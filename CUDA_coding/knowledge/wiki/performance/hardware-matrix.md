---
id: KB-PERF-002
type: map
status: draft
confidence: medium
source_ids: [SRC-001, SRC-003, SRC-005]
compiled_at: 2026-08-17
updated: 2026-09-04
---

# 硬件与环境矩阵

| ID | 环境 | GPU | MPI/NVHPC | 证据状态 | 用途 |
| --- | --- | --- | --- | --- | --- |
| HW-LOCAL | Windows/历史 WSL2 | RTX 4060 Laptop 8GB ×1 | 历史 NVHPC 24.1/OpenMPI 4.1.7a1 | 历史 env 文件；当前不可重建 | 开发与单卡基线 |
| HW-LAB | 实验室集群 | 申报书称 A800 ×2/节点、10 GPU 节点 | 未知 | 未登录核验 | 首选论文多 GPU |
| HW-SLURM-TEMPLATE | Slurm 模板环境 | 注释为 A100/4 GPU | nvhpc 23.3 模板 | 只是脚本占位 | 配置参考 |
| HW-BSCC-A100-R535 | BSCC `gpu`分区已观测节点agent-27/28 | A100-PCIE-40GB | NVHPC24.5/HPC-X2.19、driver535.104.12 | TASK-031普通CUDA/MPI生命周期可运行；Sanitizer附着仍FAIL | 当前CUDA12.4候选的兼容节点实证 |
| HW-BSCC-A100-R510 | 同一`gpu`分区已观测节点agent-4 | A100-PCIE-40GB | NVHPC24.5/HPC-X2.19、driver510.85.02 | job1475609在`cudaGetDeviceCount`返回35；Sanitizer NOT-RUN | 旧驱动拒绝样本，不可用于当前CUDA12.4候选 |

以上新增BSCC节点行是2026-09-04的历史观测，不表示当前资源占用、当前候选验收或调度授权；旧版本附着失败不覆盖其他版本的后续结果。

## 正式纳入条件

每个环境必须运行 `hpc/check_env.sh` 并登记：节点、GPU 数/型号/显存/拓扑、驱动、NVHPC、MPI wrapper、CUDA-aware 验证、调度参数和 rank binding。

2026-09-04实证表明同一`gpu`分区和同一A100型号不能保证相同驱动：agent-4为510.85.02，agent-27/28为535.104.12。后续结果必须把节点与driver绑定为环境身份，并在提交前使用Slurm feature/管理员constraint或明确兼容节点边界；只写分区/GPU型号视为证据不完整。详情见[TASK-031 job1475609终态分析](../../outputs/validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475609-terminal-analysis.txt)。

同日只读`scontrol`进一步确认agent-4/12/27/28的`AvailableFeatures`和`ActiveFeatures`均为空，Slurm没有提供可按driver选择的标签；其余分区节点driver仍未知。这只解释当时为何不能按分区盲选节点；新候选的节点池、资源、授权和实际验证以任务合同及[[../../meta/task-queue]]/[[../../meta/task-blocker-register]]为准，不能把当时的agent-28建议当作当前指令。

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

