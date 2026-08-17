#!/bin/bash
#=======================================================================
# submit_penta.slurm — 自包含验证作业
# 模块加载 + 编译 + 运行 + 输出, 全在作业里, 提交后不用交互。
#
# 用法:
#   cd ~/源代码/perf_bench
#   sbatch ~/源代码/hpc/submit_penta.slurm
#   squeue -u $USER
# 结束后看 penta_v_*.out
#=======================================================================
#SBATCH --job-name=penta_v
#SBATCH --partition=gpu
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=1
#SBATCH --gres=gpu:1
#SBATCH --time=00:30:00
#SBATCH --output=penta_v_%j.out
#SBATCH --error=penta_v_%j.err

# ---- 确保 module 可用 (batch 脚本默认不加载 /etc/profile) ----
if ! type module >/dev/null 2>&1; then
    [ -f /etc/profile.d/modules.sh ] && source /etc/profile.d/modules.sh
fi
module load nvhpc/23.3_cuda11.0-11.8-12.0/nvhpc/23.3

# ---- MPI 前缀与规避项 ----
export OPAL_PREFIX=/home/bingxing2/apps/nvhpc/24.1/Linux_aarch64/24.1/comm_libs/12.3/hpcx/hpcx-2.17.1/ompi
export OMPI_MCA_coll_hcoll_enable=0
# 关键: 集群 /tmp 已满, MPI 会话目录改到 home (否则 opal_init 失败)
export TMPDIR=$HOME/tmp
mkdir -p "$TMPDIR"

cd "$SLURM_SUBMIT_DIR" || exit 1

# ---- 编译(若二进制缺失) ----
if [ ! -x benchmark_penta ]; then
    echo "== 开始编译 ..."
    make clean && make || { echo "!! 编译失败"; exit 2; }
fi

echo "== $(date '+%F %T') np=$SLURM_NTASKS 开始, 主机=$(hostname)"
echo "== 显卡:"
nvidia-smi --query-gpu=name,memory.total --format=csv || true

mpirun -np "$SLURM_NTASKS" ./benchmark_penta 128 128 1024 3 128 128

echo "== $(date '+%F %T') 结束, exit=$?"
