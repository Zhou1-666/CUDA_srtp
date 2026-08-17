#!/usr/bin/env bash
#===============================================================================
# check_env.sh — 集群环境探测脚本（五对角基准）
#
# 用途: 上传到超算后, 先在登录节点跑一次, 摸清这台机器的底细:
#         1. 调度系统 (sbatch/srun 还是 qsub)
#         2. 有没有 NVIDIA GPU
#         3. 有没有 nvfortran (CUDA Fortran 编译器) —— 最关键!
#         4. MPI 包装器 (mpif90/mpirun)
#         5. CUDA Toolkit (nvcc)
#         6. module 系统里有没有 nvhpc
#
# 用法: bash check_env.sh
#===============================================================================
set +e

# 尝试把 module 函数弄进来 (部分集群需要)
if ! type module >/dev/null 2>&1; then
    [ -f /etc/profile.d/modules.sh ] && source /etc/profile.d/modules.sh
fi

echo "==================== 环境探测 $(date '+%Y-%m-%d %H:%M:%S') ===================="
echo "主机名: $(hostname)"
echo "用户:   $USER"
echo

echo "===== 1. 调度系统 (scheduler) ====="
for s in sbatch srun salloc qsub bsub; do
    p=$(command -v $s 2>/dev/null)
    [ -n "$p" ] && echo "  $s -> $p" || echo "  $s -> 未找到"
done
echo

echo "===== 2. NVIDIA GPU ====="
if command -v nvidia-smi >/dev/null 2>&1; then
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
else
    echo "  nvidia-smi 未找到!"
fi
echo

echo "===== 3. CUDA Fortran 编译器 nvfortran —— 最关键 ====="
if command -v nvfortran >/dev/null 2>&1; then
    nvfortran --version | head -3
else
    echo "  nvfortran 未找到!"
    echo "  >> 你的求解器是 CUDA Fortran, 必须有 nvfortran 才能编译。"
    echo "  >> 先看下面的 module 里有没有 nvhpc; 没有就找超算管理员装, 或自己装(见 HPC_GUIDE.md)"
fi
echo

echo "===== 4. MPI ====="
for c in mpif90 mpirun mpiexec; do
    p=$(command -v $c 2>/dev/null)
    [ -n "$p" ] && echo "  $c -> $p" || echo "  $c -> 未找到"
done
echo

echo "===== 5. CUDA Toolkit (nvcc) ====="
if command -v nvcc >/dev/null 2>&1; then
    nvcc --version | tail -2
else
    echo "  nvcc 未找到"
fi
echo

echo "===== 6. module 系统 ====="
if type module >/dev/null 2>&1; then
    echo "  module 可用, 列出与编译相关的模块(节选):"
    module avail 2>/dev/null | grep -iE 'nvhpc|nvfortran|hpc.?sdk|cuda|openmpi|mpich|intelmpi|compiler' | head -40
    echo
    echo "  所有可用模块条数: $(module avail 2>/dev/null | grep -c '^')"
else
    echo "  没有 module 命令 (环境变量方式, 直接看 PATH 即可)"
fi
echo

echo "===== 7. 磁盘空间 (家目录) ====="
df -h "$HOME" 2>/dev/null | tail -1
echo

echo "==================== 探测结束 ===================="
echo "把上面输出贴回来, 我帮你判断下一步怎么走。"
