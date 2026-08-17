#!/usr/bin/env bash
#=======================================================================
# run_sweep.sh - 五对角基准扫描
#
# 预设 (STUDY_PRESET):
#   quick    快速冒烟子集 (验证正确性 + 少量规模)
#   strong   强扩展: 固定全局规模, np∈{1,2,4,8}
#   weak    弱扩展: np∈{1,2,4,8} (nrow 恒定 / nsys 增长两种)
#   custom   自定义 NP_LIST x SIZE_LIST 矩阵
#
# 环境变量:
#   ITERATIONS=10      计时迭代次数 (warmup 另计, 由驱动内部处理)
#   NP_LIST / SIZE_LIST  (custom 预设)
#   TIMESTAMP / OUT / CORRECTNESS_OUT
#   MPIRUN=mpirun
#
# 单卡环境: 多 rank 共享同一 GPU (gpurank=mod(myrank,ngpu))。
# 输出: <TIMESTAMP>_penta_perf.csv (性能+精度), *_env.txt (环境探测)
#=======================================================================
set -euo pipefail

MPIRUN=${MPIRUN:-mpirun}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXE="$SCRIPT_DIR/benchmark_penta"

STUDY_PRESET=${STUDY_PRESET:-strong}
ITERATIONS=${ITERATIONS:-10}
TDMA_THREADS=${TDMA_THREADS:-128}
REDUCED_THREADS=${REDUCED_THREADS:-128}
# 单卡 8GB 显存下 np 上限取 4 较安全 (8 进程共享 8GB 会超限)。
# 若要 np=8, 请搭配更小规模 (或显存更大的 GPU)。
NP_LIST=${NP_LIST:-"1 2 4"}
SIZE_LIST=${SIZE_LIST:-"128,128,2048"}
TIMESTAMP=${TIMESTAMP:-$(date +%y%m%d_%H%M%S)}
OUT=${OUT:-"$SCRIPT_DIR/${TIMESTAMP}_penta_perf.csv"}
ENV_OUT=${ENV_OUT:-"$SCRIPT_DIR/${TIMESTAMP}_penta_env.txt"}

mkdir -p "$(dirname "$OUT")"

append_csv() {
    if [[ ! -s "$OUT" ]]; then
        tee -a "$OUT"
    else
        awk 'NR == 1 && /^solver,/ { next } { print }' | tee -a "$OUT"
    fi
}

run_case() {
    local np="$1" n1="$2" n2="$3" n3="$4"
    echo "==> np=$np size=${n1}x${n2}x${n3} iter=$ITERATIONS" >&2
    "$MPIRUN" -np "$np" "$EXE" "$n1" "$n2" "$n3" "$ITERATIONS" \
        "$TDMA_THREADS" "$REDUCED_THREADS" | append_csv
}

capture_env() {
    {
        echo "# penta benchmark environment"
        echo "date=$(date '+%Y-%m-%dT%H:%M:%S%z')"
        echo "hostname=$(hostname)"
        echo "pwd=$PWD"
        echo "study_preset=$STUDY_PRESET"
        echo "iterations=$ITERATIONS"
        echo "tdma_threads=$TDMA_THREADS"
        echo "reduced_threads=$REDUCED_THREADS"
        echo "cuda_visible_devices=${CUDA_VISIBLE_DEVICES:-}"
        echo
        echo "## nvidia-smi"
        nvidia-smi || true
        echo
        echo "## mpirun --version"
        "$MPIRUN" --version || true
        echo
        echo "## FC --version"
        "${FC:-mpif90}" --version || true
    } > "$ENV_OUT"
}

run_strong() {
    # 固定全局规模, 扫描 np。
    # 注意: 单卡 8GB 笔记本 GPU + WSL2 下, 总规模 >=67M (128x128x4096)
    # 多进程会显存驻留崩溃 (页故障回退, 计算核慢 ~100 倍)。此处取实测
    # 安全区间 (总规模 <=33.5M) 的规模; 更大规模需在多卡 HPC 节点验证。
    for np in $NP_LIST; do
        run_case "$np" 128 128 1024
        run_case "$np" 128 128 2048
        run_case "$np" 128 64 2048
    done
}

run_weak() {
    # 弱扩展 A: nrow 恒定 (=512), n3 = 512*np
    #   (8GB 单卡下每 rank 显存 ~0.27GB, np=8 时 2.1GB, 安全)
    for np in $NP_LIST; do
        run_case "$np" 128 128 $((512 * np))
    done
    # 弱扩展 B: 每 rank 工作量恒定, n2 = 64*np, n3 固定
    for np in $NP_LIST; do
        run_case "$np" 128 $((64 * np)) 2048
    done
}

run_quick() {
    run_case 1 64 64 1024
    run_case 2 64 64 2048
    run_case 4 128 128 2048
}

run_custom() {
    local np size n1 n2 n3
    for np in $NP_LIST; do
        for size in $SIZE_LIST; do
            IFS=',' read -r n1 n2 n3 <<< "$size"
            run_case "$np" "$n1" "$n2" "$n3"
        done
    done
}

capture_env

case "$STUDY_PRESET" in
    quick)   run_quick ;;
    strong)  run_strong ;;
    weak)    run_weak ;;
    custom)  run_custom ;;
    *)
        echo "error: unknown STUDY_PRESET=$STUDY_PRESET (quick|strong|weak|custom)" >&2
        exit 2 ;;
esac

echo "wrote $OUT" >&2
echo "wrote $ENV_OUT" >&2
