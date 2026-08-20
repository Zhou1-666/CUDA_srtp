#!/usr/bin/env bash
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_root=$(cd "$script_dir/.." && pwd)
log_dir=${1:-"$source_root/verify/logs/task016_lifecycle"}
exe="$source_root/run/test_penta_lifecycle"
pressure_cycles=${PENTA_LIFECYCLE_CYCLES:-100}
sanitizer_cycles=${PENTA_SANITIZER_CYCLES:-1}
failures=0
cases_run=0
mpi_args=(--mca pml ob1 --mca osc pt2pt --mca btl ^openib -np 2)

mkdir -p "$log_dir"
cd "$source_root"
make veryclean >"$log_dir/clean.log" 2>&1
make lifecycle_validation FC=${FC:-mpifort} >"$log_dir/build.log" 2>&1 || {
    echo "FAIL: TASK-016 lifecycle validation build"
    exit 1
}

{
    date -Is
    uname -a
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
    ${FC:-mpifort} --version | head -n 2
    mpirun --version | head -n 2
    compute-sanitizer --version
} >"$log_dir/environment.log" 2>&1

run_pressure() {
    local slots=$1
    local log="$log_dir/pressure_slots${slots}_${pressure_cycles}cycles.log"
    local rc
    cases_run=$((cases_run+1))
    set +e
    timeout 300s mpirun "${mpi_args[@]}" "$exe" "$slots" "$pressure_cycles" >"$log" 2>&1
    rc=$?
    set -e
    if [[ $rc -ne 0 ]] || ! grep -Fq "LIFECYCLE_PASS: slots=$slots cycles=$pressure_cycles ranks=2" "$log"; then
        echo "FAIL: pressure slots=$slots cycles=$pressure_cycles rc=$rc"
        failures=$((failures+1))
    else
        echo "PASS: pressure slots=$slots cycles=$pressure_cycles rc=$rc"
    fi
}

run_sanitizer() {
    local tool=$1
    local slots=$2
    local log="$log_dir/${tool}_slots${slots}.log"
    local rc summaries
    cases_run=$((cases_run+1))
    set +e
    timeout 300s mpirun "${mpi_args[@]}" compute-sanitizer --tool "$tool" --error-exitcode 99 \
        "$exe" "$slots" "$sanitizer_cycles" >"$log" 2>&1
    rc=$?
    set -e
    summaries=$(grep -Fc "ERROR SUMMARY: 0 errors" "$log" || true)
    if [[ $rc -ne 0 ]] || ! grep -Fq "LIFECYCLE_PASS: slots=$slots cycles=$sanitizer_cycles ranks=2" "$log" \
        || [[ $summaries -lt 2 ]]; then
        echo "FAIL: $tool slots=$slots rc=$rc zero_error_summaries=$summaries"
        failures=$((failures+1))
    else
        echo "PASS: $tool slots=$slots rc=$rc zero_error_summaries=$summaries"
    fi
}

if ! command -v compute-sanitizer >/dev/null 2>&1; then
    echo "FAIL: compute-sanitizer is unavailable; an approved alternative is required"
    exit 1
fi

run_pressure 28
run_pressure 22
for tool in memcheck initcheck; do
    run_sanitizer "$tool" 28
    run_sanitizer "$tool" 22
done

echo "TASK-016 lifecycle validation summary: cases=$cases_run failures=$failures"
exit "$failures"
