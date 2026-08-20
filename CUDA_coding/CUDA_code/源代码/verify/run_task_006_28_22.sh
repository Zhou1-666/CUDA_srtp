#!/usr/bin/env bash
# TASK-006: validate the switchable 28/22 forward-slot Fortran paths.
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_root=$(cd "$script_dir/.." && pwd)
bench_dir="$source_root/perf_bench"
out_dir=${1:-"$source_root/verify/logs/task006_28_22"}
mpirun_cmd=${MPIRUN:-mpirun}
if [[ -n "${FC:-}" ]]; then
    fc="$FC"
elif command -v mpifort >/dev/null 2>&1; then
    fc=mpifort
else
    fc=mpif90
fi
tol=${TASK006_TOL:-1e-10}
threads=${TASK006_THREADS:-128}
failures=0
cases_run=0
regular_cases=0

mkdir -p "$out_dir"
out_dir=$(cd "$out_dir" && pwd)

{
    echo "task=TASK-006"
    echo "captured_at=$(date --iso-8601=seconds)"
    echo "git_sha=$(git -C "$source_root" rev-parse HEAD)"
    echo "fc=$fc"
    echo "mpirun=$mpirun_cmd"
    echo "tolerance=$tol"
    "$fc" --version || true
    "$mpirun_cmd" --version || true
    nvidia-smi --query-gpu=name,uuid,driver_version,memory.total --format=csv || true
} > "$out_dir/environment.txt" 2>&1

cd "$source_root"
make veryclean > "$out_dir/api-clean.log" 2>&1
FC="$fc" bash verify/run_penta_api_validation.sh "$out_dir/api" \
    > "$out_dir/api-summary.log" 2>&1 || {
        echo "FAIL: API validation"
        exit 1
    }

make veryclean > "$out_dir/regular-build.log" 2>&1
make penta FC="$fc" >> "$out_dir/regular-build.log" 2>&1 || {
    echo "FAIL: regular solver example build"
    exit 1
}
for slots in 28 22; do
    regular_cases=$((regular_cases+1))
    log="$out_dir/regular-np2-slots${slots}.log"
    set +e
    PENTA_FORWARD_SLOTS="$slots" timeout 120s "$mpirun_cmd" --mca btl ^openib \
        -np 2 ./run/a.out_penta > "$log" 2>&1
    rc=$?
    set -e
    if [[ $rc -ne 0 ]] || ! grep -Fq "regular forward slots=$slots" "$log" || \
       ! grep -Fq "solver finished" "$log"; then
        echo "FAIL: regular solver np=2 slots=$slots rc=$rc"
        failures=$((failures+1))
    else
        echo "PASS: regular solver np=2 slots=$slots"
    fi
done

cd "$bench_dir"
make veryclean > "$out_dir/build.log" 2>&1
make FC="$fc" OPT="-O3" >> "$out_dir/build.log" 2>&1 || {
    echo "FAIL: TASK-006 benchmark build"
    exit 1
}

validate_log() {
    local log=$1 slots=$2
    if ! grep -Fq "forward slots: $slots" "$log"; then
        return 1
    fi
    awk -F, -v tol="$tol" -v slots="$slots" '
        $1 == "penta" && $2 == "exp" {
            seen = 1
            if (($NF-2)+0 > tol || ($NF-1)+0 > tol || $NF+0 > tol) bad = 1
            if ($13+0 != slots) bad = 1
        }
        END { if (!seen || bad) exit 1 }
    ' "$log"
}

run_case() {
    local label=$1 case_name=$2 np=$3 n1=$4 n2=$5 n3=$6 slots=$7
    local log="$out_dir/${label}-${case_name}-np${np}-slots${slots}.log"
    local rc
    cases_run=$((cases_run+1))
    set +e
    PENTA_TEST_CASE="$case_name" PENTA_FORWARD_SLOTS="$slots" \
        timeout 120s "$mpirun_cmd" --mca btl ^openib -np "$np" ./benchmark_penta \
        "$n1" "$n2" "$n3" 1 "$threads" "$threads" > "$log" 2>&1
    rc=$?
    set -e
    if [[ $rc -ne 0 ]] || ! validate_log "$log" "$slots"; then
        echo "FAIL: $label case=$case_name np=$np slots=$slots rc=$rc"
        failures=$((failures+1))
    else
        echo "PASS: $label case=$case_name np=$np slots=$slots"
    fi
}

for slots in 28 22; do
    for case_name in exact1 manufactured; do
        # Default-compatible P=1 path, then distributed standard/boundary/
        # uneven-line partitions that exercise the forward layout.
        run_case direct "$case_name" 1 16 8 8 "$slots"
        run_case distributed "$case_name" 2 16 8 16 "$slots"
        run_case nrow5 "$case_name" 2 8 8 10 "$slots"
        run_case nrow6 "$case_name" 2 8 8 12 "$slots"
        run_case uneven-lines "$case_name" 4 7 5 24 "$slots"
    done
done

echo "TASK-006 28/22 validation summary: profiled_cases=$cases_run regular_cases=$regular_cases failures=$failures"
exit "$failures"
