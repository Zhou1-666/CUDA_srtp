#!/usr/bin/env bash
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_root=$(cd "$script_dir/.." && pwd)
log_dir=${1:-"$source_root/verify/logs/penta_api_validation"}
exe="$source_root/run/test_penta_api_validation"
failures=0
cases_run=0

mkdir -p "$log_dir"

run_case() {
    local expected=$1
    local ranks=$2
    local name=$3
    local log="$log_dir/${name}_np${ranks}.log"
    local rc

    cases_run=$((cases_run+1))
    set +e
    timeout 60s mpirun -np "$ranks" "$exe" "$name" >"$log" 2>&1
    rc=$?
    set -e

    if [[ "$expected" == "pass" ]]; then
        if [[ $rc -ne 0 ]] || ! grep -q "API_VALIDATION_PASS: $name" "$log"; then
            echo "FAIL: $name np=$ranks expected success, rc=$rc"
            failures=$((failures+1))
            return
        fi
    else
        if [[ $rc -eq 0 ]] || ! grep -q "PaScaL_TDMA_cuda_penta:" "$log"; then
            echo "FAIL: $name np=$ranks expected guarded failure, rc=$rc"
            failures=$((failures+1))
            return
        fi
    fi
    echo "PASS: $name np=$ranks expected=$expected rc=$rc"
}

cd "$source_root"
make api_validation >"$log_dir/build_api_validation.log" 2>&1 || {
    echo "FAIL: api validation build"
    exit 1
}

run_case pass 1 valid
run_case pass 1 double_clean
run_case pass 1 clean_uncreated
run_case fail 1 nsys_zero
run_case fail 2 empty_partition
run_case fail 2 rank_mismatch
run_case fail 1 nprocs_mismatch
run_case fail 1 comm_null
run_case fail 1 threads_zero
run_case fail 1 threads_too_large
run_case fail 1 double_create
run_case fail 1 solver_before_create
run_case fail 1 solver_nrow
run_case fail 1 solver_nsys_mismatch

echo "API validation summary: cases=$cases_run failures=$failures"
exit "$failures"
