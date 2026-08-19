#!/usr/bin/env bash
# TASK-018 target-GPU evidence runner. Run from a loaded NVHPC+MPI A100 allocation.
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
OUT_DIR=${1:-"$ROOT_DIR/verify/logs/TASK-018-$(date +%Y%m%d-%H%M%S)"}
MODEL="$ROOT_DIR/verify/penta_capacity_model.js"
BENCH="$ROOT_DIR/perf_bench/benchmark_penta"
mkdir -p "$OUT_DIR"

{
    echo "git_sha=$(git -C "$ROOT_DIR" rev-parse HEAD)"
    echo "timestamp=$(date -Is)"
    echo "hostname=$(hostname)"
    echo "node=$(command -v node || true)"
    echo "mpirun=$(command -v mpirun || true)"
    echo "nvfortran=$(command -v nvfortran || true)"
    nvfortran --version 2>&1 | head -3 || true
    mpirun --version 2>&1 | head -2 || true
    nvidia-smi --query-gpu=name,uuid,driver_version,memory.total,memory.free --format=csv,noheader || true
} > "$OUT_DIR/environment.txt" 2>&1

node "$MODEL" --self-test > "$OUT_DIR/model-self-test.log" 2>&1
node "$MODEL" --n1 256 --n2 256 --n3 1024 --ranks 1 --budget-mib 30720 --require-fit > "$OUT_DIR/model-fit.log" 2>&1

set +e
node "$MODEL" --n1 512 --n2 512 --n3 2048 --ranks 1 --budget-mib 30720 --require-fit > "$OUT_DIR/model-reject.log" 2>&1
reject_rc=$?
set -e
if [[ "$reject_rc" -ne 2 ]]; then
    echo "Expected model reject exit code 2, got $reject_rc" >&2
    exit 1
fi
echo "model_reject_exit_code=$reject_rc" >> "$OUT_DIR/model-reject.log"

if [[ ! -x "$BENCH" ]]; then
    echo "Missing executable: $BENCH. Build perf_bench first." >&2
    exit 1
fi

PENTA_TEST_CASE=manufactured mpirun --mca btl ^openib -np 1 "$BENCH" 256 256 1024 1 128 128 > "$OUT_DIR/a100-fit-smoke.log" 2>&1
echo "TASK-018 PASS: $OUT_DIR"
