#!/usr/bin/env bash
# TASK-014: freeze the existing 28-slot penta baseline.  No source mutation.
# Usage (from a Linux/WSL/HPC shell):
#   bash verify/run_task_014_baseline.sh /absolute/path/to/TASK-014-receipt
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BENCH_DIR="$SRC_ROOT/perf_bench"
OUT_DIR="${1:?usage: bash verify/run_task_014_baseline.sh /absolute/receipt-directory}"
MPIRUN="${MPIRUN:-mpirun}"
if [[ -z "${FC:-}" ]] && command -v mpifort >/dev/null 2>&1; then
    FC="mpifort"
else
    FC="${FC:-mpif90}"
fi
N1="${TASK014_N1:-64}"
N2="${TASK014_N2:-64}"
N3="${TASK014_N3:-1024}"
THREADS="${TASK014_THREADS:-128}"
ITERATIONS="${TASK014_ITERATIONS:-10}"
TOL="${TASK014_TOL:-1e-10}"

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"

capture_env() {
    {
        echo "task=TASK-014"
        echo "captured_at=$(date --iso-8601=seconds)"
        echo "git_root=$(git -C "$SRC_ROOT" rev-parse --show-toplevel)"
        echo "git_sha=$(git -C "$SRC_ROOT" rev-parse HEAD)"
        echo "git_status_begin="
        git -C "$SRC_ROOT" status --short
        echo "pwd=$BENCH_DIR"
        echo "mpirun=$MPIRUN"
        echo "fc=$FC"
        echo "input=${N1}x${N2}x${N3}; iterations=${ITERATIONS}; threads=${THREADS}; precision=fp64"
        echo "tolerance=${TOL}"
        echo "=== nvfortran ==="
        nvfortran --version || true
        echo "=== MPI ==="
        "$MPIRUN" --version || true
        bash -lc "$FC --version" || true
        echo "=== NVIDIA GPU ==="
        nvidia-smi -L || true
        nvidia-smi --query-gpu=name,uuid,driver_version,memory.total --format=csv || true
        echo "=== CUDA/cuSPARSE discovery ==="
        command -v nvcc || true
        if command -v nvcc >/dev/null 2>&1; then
            CUDA_HOME="$(dirname "$(dirname "$(command -v nvcc)")")"
            echo "cuda_home=$CUDA_HOME"
            test -f "$CUDA_HOME/include/cusparse.h" && echo "cusparse_header=present" || echo "cusparse_header=missing"
        fi
        ldconfig -p 2>/dev/null | grep -i cusparse || true
    } > "$OUT_DIR/environment.txt"
}

validate_accuracy_log() {
    local log="$1"
    awk -F, -v tol="$TOL" '
        $1 == "exp" || $1 == "ref" || $1 == "serial" {
            seen[$1] = 1
            if (($NF - 2) + 0 > tol || ($NF - 1) + 0 > tol || $NF + 0 > tol) bad = 1
        }
        END {
            if (!seen["exp"] || (!seen["ref"] && !seen["serial"]) || bad) exit 1
        }
    ' "$log"
}

run_correctness() {
    local case_name="$1" np="$2"
    local log="$OUT_DIR/correctness-${case_name}-np${np}.log"
    PENTA_TEST_CASE="$case_name" "$MPIRUN" -np "$np" "$BENCH_DIR/benchmark_penta" \
        "$N1" "$N2" "$N3" 3 "$THREADS" "$THREADS" | tee "$log"
    validate_accuracy_log "$log"
}

append_exp_mean() {
    local log="$1" run_id="$2"
    awk -F, -v run_id="$run_id" '
        $1 == "exp" { sum += $14; n += 1 }
        END { if (n == 0) exit 1; printf "%s,%.16e\n", run_id, sum / n }
    ' "$log" >> "$OUT_DIR/release-run-means.csv"
}

capture_env
cd "$BENCH_DIR"

make veryclean > "$OUT_DIR/build-debug.log" 2>&1
make FC="$FC" OPT="-O0 -g" >> "$OUT_DIR/build-debug.log" 2>&1
cp benchmark_penta "$OUT_DIR/benchmark_penta.debug"

run_correctness exact1 1
run_correctness manufactured 1
run_correctness exact1 2
run_correctness manufactured 2

make veryclean > "$OUT_DIR/build-release.log" 2>&1
make FC="$FC" OPT="-O3" >> "$OUT_DIR/build-release.log" 2>&1
cp benchmark_penta "$OUT_DIR/benchmark_penta.release"

# Warmups are deliberately not included in the five formal measurements.
for warmup in 1 2; do
    PENTA_TEST_CASE=manufactured "$MPIRUN" -np 1 ./benchmark_penta \
        "$N1" "$N2" "$N3" "$ITERATIONS" "$THREADS" "$THREADS" \
        > "$OUT_DIR/warmup-${warmup}.log"
done

echo "run_id,exp_total_s_max_mean" > "$OUT_DIR/release-run-means.csv"
for run_id in 1 2 3 4 5; do
    log="$OUT_DIR/release-manufactured-np1-run${run_id}.log"
    PENTA_TEST_CASE=manufactured "$MPIRUN" -np 1 ./benchmark_penta \
        "$N1" "$N2" "$N3" "$ITERATIONS" "$THREADS" "$THREADS" | tee "$log"
    validate_accuracy_log "$log"
    append_exp_mean "$log" "$run_id"
done

{
    echo "metric,value"
    awk -F, 'NR > 1 { print $2 }' "$OUT_DIR/release-run-means.csv" | sort -n > "$OUT_DIR/release-run-means.sorted.txt"
    printf "median_exp_total_s_max_mean,"; sed -n '3p' "$OUT_DIR/release-run-means.sorted.txt"
    printf "min_exp_total_s_max_mean,"; sed -n '1p' "$OUT_DIR/release-run-means.sorted.txt"
    printf "max_exp_total_s_max_mean,"; sed -n '5p' "$OUT_DIR/release-run-means.sorted.txt"
} > "$OUT_DIR/release-summary.csv"

git -C "$SRC_ROOT" status --short > "$OUT_DIR/git-status-end.txt"
echo "TASK-014 target-environment baseline completed: $OUT_DIR"
