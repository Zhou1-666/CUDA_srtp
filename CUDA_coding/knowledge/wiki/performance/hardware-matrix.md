---
id: KB-PERF-002
type: map
status: draft
confidence: medium
source_ids: [SRC-001, SRC-003, SRC-005]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 硬件与环境矩阵

| ID | 环境 | GPU | MPI/NVHPC | 证据状态 | 用途 |
| --- | --- | --- | --- | --- | --- |
| HW-LOCAL | Windows/历史 WSL2 | RTX 4060 Laptop 8GB ×1 | 历史 NVHPC 24.1/OpenMPI 4.1.7a1 | 历史 env 文件；当前不可重建 | 开发与单卡基线 |
| HW-LAB | 实验室集群 | 申报书称 A800 ×2/节点、10 GPU 节点 | 未知 | 未登录核验 | 首选论文多 GPU |
| HW-SLURM-TEMPLATE | Slurm 模板环境 | 注释为 A100/4 GPU | nvhpc 23.3 模板 | 只是脚本占位 | 配置参考 |

## 正式纳入条件

每个环境必须运行 `hpc/check_env.sh` 并登记：节点、GPU 数/型号/显存/拓扑、驱动、NVHPC、MPI wrapper、CUDA-aware 验证、调度参数和 rank binding。

## 实验分层

- HW-LOCAL：数学、API、单 GPU smoke，不发表 scaling；
- HW-LAB：强/弱扩展、CUDA-aware、通信裁剪主数据；
- 第二套 GPU 平台（若可得）：可移植性/架构讨论，不是必须交付。

## 待用户提供

- `check_env.sh` 完整输出；
- 一份成功的 Slurm 作业输出；
- 集群使用政策与最长作业/存储位置；
- 是否有 Nsight Systems/Compute；
- 是否已有 CFD/FFT 主程序在该集群运行。

## 相关

- [[benchmark-protocol]]
- [[../systems/build-and-runtime-map]]

