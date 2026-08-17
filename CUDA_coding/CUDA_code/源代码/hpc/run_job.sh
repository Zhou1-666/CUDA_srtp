#!/usr/bin/env bash
#===============================================================================
# run_job.sh — 应用模式下让作业自己完成"编译 + 运行 + 输出"
#
# 背景: 应用模式没有(或不一定有)交互终端, 不能在登录节点敲 make。
#       本脚本设计成: 把 源代码 目录传到超算后, 在平台"作业提交"表单里
#       把执行命令填成  bash run_job.sh, 由作业自己完成一切。
#
# 需要放到 perf_bench 目录下(和 benchmark_penta.f90 同级), 或填完整路径。
# 可用环境变量(在表单的"环境变量"或命令行参数里填):
#   N1 N2 N3          求解规模(默认 128 128 2048)
#   ITER              计时迭代次数(默认 10)
#   PENTA_TEST_CASE   exact1 或 manufactured
#   NP                MPI 进程数(默认 4, 别超过分配到的 GPU 数太多)
#   MAKE_IN_JOB       设为 1 时每次都在作业里重新编译(慢); 否则只在缺二进制时编译
#===============================================================================
set -euo pipefail

cd "$(dirname "$0")"

# ---- 加载编译/运行环境 (北京超算 nvhpc 24.1) ----
if type module >/dev/null 2>&1; then
    module load nvhpc/23.3_cuda11.0-11.8-12.0/nvhpc/23.3 2>/dev/null || echo "!! module load nvhpc 失败, 检查模块名"
else
    [ -f /etc/profile.d/modules.sh ] && source /etc/profile.d/modules.sh && module load nvhpc/23.3_cuda11.0-11.8-12.0/nvhpc/23.3
fi

echo "===== $(date '+%F %T') 作业开始, 节点: $(hostname) ====="
echo "== GPU 情况:"
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv || true

# ---- 编译(缺二进制时才编; 设 MAKE_IN_JOB=1 则每次都编) ----
if [ ! -x benchmark_penta ] || [ "${MAKE_IN_JOB:-0}" = "1" ]; then
    echo "== 开始编译 (需要 nvfortran; 若这里报错, 说明集群没有 nvfortran) ..."
    make clean && make || { echo "!! 编译失败, 把上面报错贴回来或找超算管理员"; exit 2; }
fi

# ---- 运行参数 ----
N1=${N1:-128}
N2=${N2:-128}
N3=${N3:-2048}
ITER=${ITER:-10}
NT=${TDMA_THREADS:-128}
NR=${REDUCED_THREADS:-128}
NP=${NP:-4}
PENTA_TEST_CASE=${PENTA_TEST_CASE:-exact1}

# OpenMPI + NVIDIA HCOLL 时屏蔽无害启动报错 (同本机 WSL 做法)
export OMPI_MCA_coll_hcoll_enable=0
# 关键: 集群 /tmp 已满, MPI 会话目录改到 home (否则 opal_init 失败)
export TMPDIR=$HOME/tmp
mkdir -p "$TMPDIR"

STAMP=$(date +%y%m%d_%H%M%S)
OUT="penta_${N1}x${N2}x${N3}_np${NP}_${PENTA_TEST_CASE}_${STAMP}.csv"

echo "== 规模=${N1}x${N2}x${N3}  iter=$ITER  case=$PENTA_TEST_CASE  np=$NP"
echo "== 输出文件: $OUT"

mpirun -np "$NP" ./benchmark_penta "$N1" "$N2" "$N3" "$ITER" "$NT" "$NR" > "$OUT"

echo "== 汇总表:"
grep -E 'solver|avg_time|err_rms|err_linf|cross' "$OUT" | head -30
echo "===== $(date '+%F %T') 作业结束 ====="
