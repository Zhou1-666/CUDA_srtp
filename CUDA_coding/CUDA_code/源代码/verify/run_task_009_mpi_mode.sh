#!/usr/bin/env bash
# TASK-009: validate benchmark selection and reporting of the MPI data path.
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_root=$(cd "$script_dir/.." && pwd)
bench_dir="$source_root/perf_bench"
out_dir=${1:-"$source_root/verify/logs/task009_mpi_mode"}
mpirun_cmd=${MPIRUN:-mpirun}
if [[ -n "${FC:-}" ]]; then
    fc="$FC"
elif command -v mpifort >/dev/null 2>&1; then
    fc=mpifort
else
    fc=mpif90
fi
threads=${TASK009_THREADS:-128}
failures=0
cases_run=0

mkdir -p "$out_dir"
out_dir=$(cd "$out_dir" && pwd)

cd "$bench_dir"
make veryclean >"$out_dir/build.log" 2>&1
make FC="$fc" OPT="-O3" >>"$out_dir/build.log" 2>&1

validate_mode() {
    local log=$1 expected=$2
    awk -F, -v expected="$expected" '
        $1 == "penta" && $2 == "exp" {
            seen = 1
            if ($12 != expected) bad = 1
            if (($NF-2)+0 > 1e-10 || ($NF-1)+0 > 1e-10 || $NF+0 > 1e-10) bad = 1
        }
        END { if (!seen || bad) exit 1 }
    ' "$log"
}

run_success_case() {
    local requested=$1 expected=$2 np=$3 n3=$4
    local label=${requested:-default}
    local log="$out_dir/${label}-np${np}.log"
    local rc
    cases_run=$((cases_run+1))
    set +e
    if [[ -n "$requested" ]]; then
        PENTA_TEST_CASE=manufactured PENTA_MPI_MODE="$requested" \
            timeout 120s "$mpirun_cmd" --mca btl ^openib -np "$np" \
            ./benchmark_penta 16 8 "$n3" 1 "$threads" "$threads" >"$log" 2>&1
    else
        PENTA_TEST_CASE=manufactured env -u PENTA_MPI_MODE \
            timeout 120s "$mpirun_cmd" --mca btl ^openib -np "$np" \
            ./benchmark_penta 16 8 "$n3" 1 "$threads" "$threads" >"$log" 2>&1
    fi
    rc=$?
    set -e
    if [[ $rc -ne 0 ]] || ! validate_mode "$log" "$expected"; then
        echo "FAIL: requested=${label} expected=$expected np=$np rc=$rc"
        failures=$((failures+1))
    else
        echo "PASS: requested=${label} expected=$expected np=$np"
    fi
}

run_success_case "" host 1 8
run_success_case host host 1 8

if [[ "${TASK009_TEST_DEVICE_MPI:-0}" == 1 ]]; then
    device_np=${TASK009_DEVICE_NP:-1}
    device_n3=$((8 * device_np))
    run_success_case device device "$device_np" "$device_n3"
fi

invalid_log="$out_dir/invalid.log"
cases_run=$((cases_run+1))
set +e
PENTA_TEST_CASE=manufactured PENTA_MPI_MODE=invalid \
    timeout 120s "$mpirun_cmd" --mca btl ^openib -np 1 \
    ./benchmark_penta 16 8 8 1 "$threads" "$threads" >"$invalid_log" 2>&1
invalid_rc=$?
set -e
if [[ $invalid_rc -eq 0 ]] || ! grep -Fq "invalid PENTA_MPI_MODE" "$invalid_log"; then
    echo "FAIL: invalid mode was not rejected rc=$invalid_rc"
    failures=$((failures+1))
else
    echo "PASS: invalid mode rejected rc=$invalid_rc"
fi

long_invalid_log="$out_dir/long-invalid.log"
long_invalid_mode=invalid-invalid-invalid-invalid-invalid
cases_run=$((cases_run+1))
set +e
PENTA_TEST_CASE=manufactured PENTA_MPI_MODE="$long_invalid_mode" \
    timeout 120s "$mpirun_cmd" --mca btl ^openib -np 1 \
    ./benchmark_penta 16 8 8 1 "$threads" "$threads" >"$long_invalid_log" 2>&1
long_invalid_rc=$?
set -e
if [[ $long_invalid_rc -eq 0 ]] || ! grep -Fq "invalid PENTA_MPI_MODE" "$long_invalid_log"; then
    echo "FAIL: long invalid mode was not rejected rc=$long_invalid_rc"
    failures=$((failures+1))
else
    echo "PASS: long invalid mode rejected rc=$long_invalid_rc"
fi

echo "TASK-009 MPI mode validation summary: cases=$cases_run failures=$failures"
exit "$failures"
