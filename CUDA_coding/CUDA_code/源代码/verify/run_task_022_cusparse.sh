#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
BENCH_DIR="$SOURCE_ROOT/perf_bench"
OUT_DIR="${1:-$SOURCE_ROOT/verify/logs/TASK-022-$(date +%Y%m%d-%H%M%S)}"

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd -- "$OUT_DIR" && pwd)"

if ! command -v nvcc >/dev/null 2>&1; then
    echo "TASK-022: nvcc not found in PATH" >&2
    exit 1
fi

CUDA_HEADER=""
if [[ -n "${CUDA_ROOT:-}" && -f "$CUDA_ROOT/include/cusparse.h" ]]; then
    CUDA_HEADER="$CUDA_ROOT/include/cusparse.h"
elif [[ -f /usr/local/cuda/include/cusparse.h ]]; then
    CUDA_HEADER=/usr/local/cuda/include/cusparse.h
elif [[ -n "${NVCOMPILERS:-}" ]]; then
    CUDA_HEADER="$(find "$NVCOMPILERS/math_libs" -path '*/targets/x86_64-linux/include/cusparse.h' -print 2>/dev/null | sort -V | tail -1)"
fi

if [[ -z "$CUDA_HEADER" || ! -f "$CUDA_HEADER" ]]; then
    echo "TASK-022: cusparse.h not found; set CUDA_ROOT or NVCOMPILERS" >&2
    exit 1
fi

CUDA_INCLUDE_DIR="$(dirname -- "$CUDA_HEADER")"
CUDA_TARGET_ROOT="$(dirname -- "$CUDA_INCLUDE_DIR")"
CUDA_LIB_DIR="$CUDA_TARGET_ROOT/lib"
if [[ ! -f "$CUDA_LIB_DIR/libcusparse.so" ]]; then
    CUDA_LIB_DIR="$CUDA_TARGET_ROOT/lib64"
fi
if [[ ! -f "$CUDA_LIB_DIR/libcusparse.so" ]]; then
    echo "TASK-022: libcusparse.so not found next to $CUDA_HEADER" >&2
    exit 1
fi

CUDA_VERSION="$(basename -- "$(dirname -- "$(dirname -- "$CUDA_TARGET_ROOT")")")"
CUDA_RUNTIME_LIB_DIR=""
if [[ -n "${NVCOMPILERS:-}" && -f "$NVCOMPILERS/cuda/$CUDA_VERSION/targets/x86_64-linux/lib/libnvJitLink.so.12" ]]; then
    CUDA_RUNTIME_LIB_DIR="$NVCOMPILERS/cuda/$CUDA_VERSION/targets/x86_64-linux/lib"
elif [[ -n "${NVCOMPILERS:-}" ]]; then
    NVJITLINK="$(find "$NVCOMPILERS/cuda" -name 'libnvJitLink.so.12' -print 2>/dev/null | sort -V | tail -1)"
    if [[ -n "$NVJITLINK" ]]; then
        CUDA_RUNTIME_LIB_DIR="$(dirname -- "$NVJITLINK")"
    fi
fi
if [[ -z "$CUDA_RUNTIME_LIB_DIR" ]]; then
    CUDA_RUNTIME_LIB_DIR="$CUDA_LIB_DIR"
fi

export LD_LIBRARY_PATH="$CUDA_LIB_DIR:$CUDA_RUNTIME_LIB_DIR:${LD_LIBRARY_PATH:-}"

{
    echo "task=TASK-022"
    echo "timestamp=$(date --iso-8601=seconds)"
    echo "git_sha=$(git -C "$SOURCE_ROOT" rev-parse HEAD)"
    echo "nvcc=$(command -v nvcc)"
    nvcc --version
    echo "cusparse_header=$CUDA_HEADER"
    echo "cusparse_library=$CUDA_LIB_DIR/libcusparse.so"
    echo "cuda_runtime_library_dir=$CUDA_RUNTIME_LIB_DIR"
    grep -n 'cusparseDgpsvInterleavedBatch' "$CUDA_HEADER"
    nvidia-smi --query-gpu=name,uuid,driver_version,memory.total --format=csv,noheader
} > "$OUT_DIR/environment.txt" 2>&1

make -C "$BENCH_DIR" -f Makefile.cusparse clean > "$OUT_DIR/build.log" 2>&1
make -C "$BENCH_DIR" -f Makefile.cusparse \
    CUDA_INCLUDE_DIR="$CUDA_INCLUDE_DIR" CUDA_LIB_DIR="$CUDA_LIB_DIR" \
    CUDA_RUNTIME_LIB_DIR="$CUDA_RUNTIME_LIB_DIR" \
    >> "$OUT_DIR/build.log" 2>&1

EXE="$BENCH_DIR/cusparse_penta_baseline"
if [[ ! -x "$EXE" ]]; then
    echo "TASK-022: adapter executable was not produced" >&2
    exit 1
fi

run_case() {
    local case_name="$1"
    local iterations="$2"
    local warmups="$3"
    local log_path="$4"
    "$EXE" 64 64 1024 "$iterations" "$warmups" "$case_name" 2>&1 | tee "$log_path"
}

run_case exact1 1 1 "$OUT_DIR/correctness-exact1.log"
run_case manufactured 1 1 "$OUT_DIR/correctness-manufactured.log"

for warmup_id in 1 2; do
    run_case manufactured 10 0 "$OUT_DIR/warmup-manufactured-${warmup_id}.log"
done

CSV_HEADER="$(grep '^implementation,' "$OUT_DIR/correctness-exact1.log")"
printf '%s\n' "$CSV_HEADER" > "$OUT_DIR/formal-runs.csv"

for run_id in 1 2 3 4 5; do
    log_path="$OUT_DIR/formal-manufactured-run${run_id}.log"
    run_case manufactured 10 0 "$log_path"
    grep '^cusparse_penta,' "$log_path" >> "$OUT_DIR/formal-runs.csv"
done

awk -F, '
    NR == 1 { next }
    {
        solver[++n] = $10
        e2e[n] = $11
        restore[n] = $12
        solver_sum += $10
        e2e_sum += $11
        restore_sum += $12
        if ($14 > 1e-10 || $15 > 1e-10 || $16 > 1e-10) bad = 1
    }
    END {
        if (n != 5 || bad) exit 1
        for (i = 1; i <= n; ++i) {
            for (j = i + 1; j <= n; ++j) {
                if (solver[j] < solver[i]) { t = solver[i]; solver[i] = solver[j]; solver[j] = t }
                if (e2e[j] < e2e[i]) { t = e2e[i]; e2e[i] = e2e[j]; e2e[j] = t }
                if (restore[j] < restore[i]) { t = restore[i]; restore[i] = restore[j]; restore[j] = t }
            }
        }
        solver_mean = solver_sum / n
        e2e_mean = e2e_sum / n
        restore_mean = restore_sum / n
        for (i = 1; i <= n; ++i) {
            solver_sq += (solver[i] - solver_mean)^2
            e2e_sq += (e2e[i] - e2e_mean)^2
            restore_sq += (restore[i] - restore_mean)^2
        }
        solver_sd = sqrt(solver_sq / (n - 1))
        e2e_sd = sqrt(e2e_sq / (n - 1))
        restore_sd = sqrt(restore_sq / (n - 1))
        for (i = 1; i <= n; ++i) {
            solver_dev[i] = solver[i] >= solver[3] ? solver[i] - solver[3] : solver[3] - solver[i]
            e2e_dev[i] = e2e[i] >= e2e[3] ? e2e[i] - e2e[3] : e2e[3] - e2e[i]
            restore_dev[i] = restore[i] >= restore[3] ? restore[i] - restore[3] : restore[3] - restore[i]
        }
        for (i = 1; i <= n; ++i) {
            for (j = i + 1; j <= n; ++j) {
                if (solver_dev[j] < solver_dev[i]) { t = solver_dev[i]; solver_dev[i] = solver_dev[j]; solver_dev[j] = t }
                if (e2e_dev[j] < e2e_dev[i]) { t = e2e_dev[i]; e2e_dev[i] = e2e_dev[j]; e2e_dev[j] = t }
                if (restore_dev[j] < restore_dev[i]) { t = restore_dev[i]; restore_dev[i] = restore_dev[j]; restore_dev[j] = t }
            }
        }
        printf "samples=%d\n", n
        printf "quartile_definition=linear_type7_for_n5\n"
        printf "mad_definition=unscaled_median_absolute_deviation\n"
        printf "solver_median_ms=%.9f\n", solver[3]
        printf "solver_mean_ms=%.9f\n", solver_mean
        printf "solver_cv_percent=%.6f\n", 100 * solver_sd / solver_mean
        printf "solver_iqr_ms=%.9f\n", solver[4] - solver[2]
        printf "solver_mad_ms=%.9f\n", solver_dev[3]
        printf "end_to_end_median_ms=%.9f\n", e2e[3]
        printf "end_to_end_mean_ms=%.9f\n", e2e_mean
        printf "end_to_end_cv_percent=%.6f\n", 100 * e2e_sd / e2e_mean
        printf "end_to_end_iqr_ms=%.9f\n", e2e[4] - e2e[2]
        printf "end_to_end_mad_ms=%.9f\n", e2e_dev[3]
        printf "input_restore_median_ms=%.9f\n", restore[3]
        printf "input_restore_mean_ms=%.9f\n", restore_mean
        printf "input_restore_cv_percent=%.6f\n", 100 * restore_sd / restore_mean
        printf "input_restore_iqr_ms=%.9f\n", restore[4] - restore[2]
        printf "input_restore_mad_ms=%.9f\n", restore_dev[3]
    }
' "$OUT_DIR/formal-runs.csv" | tee "$OUT_DIR/formal-stats.txt"

echo "TASK-022 PASS: correctness and five formal cuSPARSE runs completed"
echo "TASK-022 evidence: $OUT_DIR"
