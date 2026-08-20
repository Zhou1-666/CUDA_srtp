#!/usr/bin/env bash
set -u

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_root=$(cd "$script_dir/.." && pwd)
log_dir=${1:-"$source_root/verify/logs/task015_stability"}
exe="$source_root/run/test_penta_stability"
failures=0
cases_run=0

mkdir -p "$log_dir"
cd "$source_root"
make veryclean >"$log_dir/clean.log" 2>&1
make stability_validation FC=${FC:-mpifort} >"$log_dir/build.log" 2>&1 || {
    echo "FAIL: TASK-015 stability validation build"
    exit 1
}

run_case() {
    local expected=$1
    local ranks=$2
    local name=$3
    local log="$log_dir/${name}_np${ranks}.log"
    local rc
    cases_run=$((cases_run+1))
    set +e
    timeout 60s mpirun --mca btl ^openib -np "$ranks" "$exe" "$name" >"$log" 2>&1
    rc=$?
    if [[ "$expected" == "pass" ]]; then
        if [[ $rc -ne 0 ]] || ! grep -Fq "STABILITY_PASS: $name" "$log"; then
            echo "FAIL: $name np=$ranks expected pass rc=$rc"
            failures=$((failures+1))
            return
        fi
    else
        if [[ $rc -eq 0 ]] || ! grep -Fq "numerical pivot breakdown" "$log"; then
            echo "FAIL: $name np=$ranks expected guarded failure rc=$rc"
            failures=$((failures+1))
            return
        fi
    fi
    echo "PASS: $name np=$ranks expected=$expected rc=$rc"
}

for ranks in 1 2; do
    run_case pass "$ranks" dominant
    run_case pass "$ranks" weak_dominant
    run_case pass "$ranks" scaled
    run_case pass "$ranks" near_singular
    run_case fail "$ranks" zero_pivot
    run_case fail "$ranks" near_zero_pivot
done

echo "TASK-015 stability validation summary: cases=$cases_run failures=$failures"
exit "$failures"
