---
id: TASK-017-20260819-PARAAI-A100
task: TASK-017
status: verified
confidence: high
source_ids: [SRC-003P]
---

# TASK-017：真实双 GPU 环境与绑定核验

## 结论

TASK-017 已完成。2026-08-19 在 ParaAI Slurm 集群的单节点双 GPU 预约中，两个 rank 被分别隔离到不同的 A100 UUID；五对角 `np=2` 制造解 smoke 以退出码 0 通过。

这只是环境可用性、绑定和正确性 smoke 的证据，**不是**强/弱扩展实验，也不支持任何多 GPU 加速比主张。

## 受控环境

| 项目 | 实测值 |
| --- | --- |
| 代码 SHA | `20fe6f3f2847416b31957842c47368b08be8fff4` |
| 调度与预约 | Slurm；`salloc --partition=gpu --nodes=1 --ntasks=2 --gres=gpu:2 --cpus-per-task=2 --time=00:30:00`，job `1433459` |
| 节点 | `paraai-n32-h-01-agent-68`（`linuxarm64`/aarch64） |
| GPU | 2 × NVIDIA A100-PCIE-40GB，40,960 MiB，driver `535.104.12` |
| GPU UUID | rank 0: `GPU-44eca97e-30dd-26e7-29bf-a6162fa840bf`；rank 1: `GPU-dacbbcbf-4d11-055f-2330-82cfc2f7cb75` |
| GPU 互连 | `PHB`，无 NVLink；同 CPU/NUMA affinity `0` |
| NVHPC | `nvfortran 24.5-1`，linuxarm64，target aarch64 |
| MPI | NVIDIA HPC SDK OpenMPI `3.1.5`，CUDA-aware capability `true` |
| CUDA Toolkit | `12.4` (`V12.4.131`) |
| 项目通信模式 | 本次基准的 CSV 标记为 `host`；CUDA-aware MPI 仅证明库能力，未在本任务中做 A/B 或直接设备缓冲区验证 |

## 通过证据

1. `binding.txt`：两个 `srun` task 各自仅可见一个逻辑设备 `0`，但 UUID 不同。这是 Slurm 每 task 重编号后的预期行为。
2. `np2-manufactured-smoke.txt`：`64×64×1024`、`np=2`、manufactured、`3` iterations、128/128 threads；`exp` RMS/Linf/cross 为 `1.3418e-13` / `1.9595e-13` / `2.8133e-13`，退出码为 0。
3. `environment-summary.txt` 与 `topology.txt`：保留用户在目标节点执行项目 `hpc/check_env.sh`、`nvidia-smi` 与 `ompi_info` 的可见输出摘要。

原始命令输出也保存在集群工作树的 `perf_bench/task017_check_env.log`；本目录的文本由执行时用户提供的终端输出归档，未伪造为本地复跑日志。

## 可复验命令

```bash
module load nvhpc/24.5/nvhpc-openmpi3/24.5
salloc --partition=gpu --nodes=1 --ntasks=2 --gres=gpu:2 --cpus-per-task=2 --time=00:30:00
srun --ntasks=2 --ntasks-per-node=2 --gpus-per-task=1 --gpu-bind=single:1 bash -lc 'uuid=$(nvidia-smi --query-gpu=uuid --format=csv,noheader | paste -sd, -); echo "rank=$SLURM_PROCID CUDA_VISIBLE_DEVICES=$CUDA_VISIBLE_DEVICES UUID=$uuid"'
cd ~/CUDA_srtp/CUDA_coding/CUDA_code/源代码/perf_bench
PENTA_TEST_CASE=manufactured mpirun --mca btl ^openib -np 2 ./benchmark_penta 64 64 1024 3 128 128
```

通过现象：两行 rank 的 UUID 不同；程序报告 `np = 2`、`case : manufactured`，误差在约 `1e-13`，退出码为 0。

## 边界与后续

- 尚未运行 1/2/4/8 GPU 的五次正式强/弱扩展实验；不得把本回执当作扩展性证据。
- 22 槽 Fortran 路径尚未实现，因此本回执不能比较 28/22。
- CUDA-aware MPI 的实际设备缓冲区路径及收益仍未测试。
- TASK-006 仍等待 TASK-002A 与 TASK-013 的人工回执；TASK-009 还等待 TASK-006 和正式扩展实验。
