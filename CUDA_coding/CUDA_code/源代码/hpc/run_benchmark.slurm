#!/bin/bash
#===============================================================================
# run_benchmark.slurm — 五对角基准 SLURM 作业模板
#
# 用法:
#   1. 把下面"#SBATCH"里的占位行改成你集群的实际值 (分区名/GPU 数等)
#   2. 在 perf_bench 目录编译好 benchmark_penta
#   3. sbatch run_benchmark.slurm
#   4. squeue -u $USER  查看排队; 结束后看 slurm-<jobid>.out
#
# 常用变量(可覆盖):
#   N3=4096 sbatch run_benchmark.slurm      # 改规模
#   PENTA_TEST_CASE=manufactured sbatch ...
#===============================================================================
# --- SLURM 头 (按你的集群改) ---
#SBATCH --job-name=penta_bench
#SBATCH --output=slurm-%j.out
#SBATCH --error=slurm-%j.err
#SBATCH --partition=gpu                  # 北京超算 A100 分区名
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=4              # ← 建议 = 每节点 GPU 数, 用 nvidia-smi -L 查
#SBATCH --gres=gpu:4                     # ← 建议 = 每节点 GPU 数
#SBATCH --time=01:00:00                  # 最长运行时间, 按需改
#SBATCH --mem=64G                        # 每节点内存, 按需改

# --- 1) 加载编译/运行环境 (北京超算 nvhpc 23.3, CUDA 兼容驱动535) ---
module load nvhpc/23.3_cuda11.0-11.8-12.0/nvhpc/23.3
# 注意: 不要用 nvhpc 24.1 (CUDA 12.3) — 与驱动 535 (CUDA 12.2) 不匹配, CUDA 看不到设备

# --- 2) 参数 (可用环境变量覆盖) ---
N1=${N1:-128}
N2=${N2:-128}
N3=${N3:-2048}
ITER=${ITER:-10}                        # 计时迭代次数
NT=${TDMA_THREADS:-128}
NR=${REDUCED_THREADS:-128}
PENTA_TEST_CASE=${PENTA_TEST_CASE:-exact1}   # exact1 或 manufactured
EXE=./benchmark_penta

# --- 3) 运行 ---
cd "$SLURM_SUBMIT_DIR" || exit 1
[ -x "$EXE" ] || { echo "找不到 $EXE, 请先在 perf_bench 目录 make"; exit 2; }

# 若 OpenMPI 带 NVIDIA HCOLL, 屏蔽无害启动报错 (同本机 WSL 的做法)
export OMPI_MCA_coll_hcoll_enable=0
# 关键: 集群 /tmp 已满, MPI 会话目录改到 home (否则 opal_init 失败)
export TMPDIR=$HOME/tmp
mkdir -p "$TMPDIR"

STAMP=$(date +%y%m%d_%H%M%S)
OUT="penta_${N1}x${N2}x${N3}_np${SLURM_NTASKS}_${PENTA_TEST_CASE}_${STAMP}.csv"

echo "==> $(date '+%F %T') 开始: np=$SLURM_NTASKS 规模=${N1}x${N2}x${N3} iter=$ITER case=$PENTA_TEST_CASE"
echo "==> 输出文件: $OUT"

mpirun -np "$SLURM_NTASKS" "$EXE" "$N1" "$N2" "$N3" "$ITER" "$NT" "$NR" > "$OUT"

echo "==> $(date '+%F %T') 结束, exit=$?"
echo "==> 汇总表:"
grep -E 'solver|avg_time|err_rms|err_linf|cross' "$OUT" | head -30
