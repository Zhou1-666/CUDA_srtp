---
id: KB-SYSTEM-003
type: map
status: reviewed
confidence: medium
source_ids: [SRC-003, SRC-005]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 构建与运行环境地图

## 所需软件链

```text
NVHPC/nvfortran
  + MPI Fortran wrapper（必须实际调用兼容 nvfortran）
  + CUDA driver/GPU
  + GNU make/ar/ranlib
  + Node.js（独立数学验证）
  + Python/matplotlib（图表）
  + Slurm/OpenMPI（HPC 实验）
```

## 环境状态

| 环境 | 现状 | 可做 | 不可作为 |
| --- | --- | --- | --- |
| Windows PowerShell + RTX 4060 Laptop 8GB | Node 可用；NVHPC/MPI/make 不在 PATH | JS 数学验证、Markdown、CSV 分析 | CUDA Fortran 干净构建 |
| 历史 WSL2 + RTX 4060 | 曾使用 NVHPC 24.1、OpenMPI 4.1.7a1、host staging | 历史开发基线 | 真实多 GPU scaling |
| `run_benchmark.slurm` 模板 | 声明 nvhpc 23.3、4 GPU/A100 示例 | 集群模板参考 | 已核验的真实集群配置 |
| 申报书实验室资源 | 声称 GPU 节点含 A800 | 潜在正式实验资源 | 未经登录探测的硬件事实 |

## 干净构建收据必须记录

- 主机/节点与日期；
- `nvfortran --version`、`mpif90 --show`/版本；
- `nvidia-smi`、驱动、GPU 数与拓扑；
- module load 命令；
- 完整 Makefile flags；
- clean/build/run 命令与退出码；
- 产物 SHA-256 或 Git commit；
- CUDA-aware MPI 验证方式，不只写环境变量。

## 已知环境陷阱

- MPI wrapper 可能不是 NVHPC ABI；
- 驱动与 NVHPC 内置 CUDA 版本可能不兼容；
- 多 rank 必须明确 rank→GPU 绑定；
- 单卡多 rank 会产生调度、显存和页故障干扰；
- `/tmp`、Slurm 分区和 module 名称是集群特定配置；
- `CUDA-aware` 不能仅凭 MPI 名称推定，必须最小 device-buffer 测试；
- 不同 Makefile flags 共用旧 `.o/.mod` 会污染对比。

## 需要用户/导师提供

- 实际 A800/A100 集群登录后的 `hpc/check_env.sh` 输出；
- module load 和 Slurm 分区/GPU 申请方式；
- 是否允许 CUDA-aware MPI；
- 正式 Git 远端/commit 规则；
- 若要与 CFD 对齐，现有 CFD/FFT 主程序及接口说明。

这些材料不阻塞知识库和 Node 理论工作，但会阻塞发布级构建、真实多 GPU优化和 Poisson/CFD 集成。

## 相关

- [[module-dependency-map]]
- [[../performance/hardware-matrix]]
- [[../performance/benchmark-protocol]]

