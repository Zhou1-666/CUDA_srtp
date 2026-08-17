---
id: OUT-20260817-TASK001-VALIDATION
type: validation-receipt
status: draft
created: 2026-08-17
source_ids: [SRC-003P, SRC-003T]
git_commit: 3c5b4b51dbeb34d6f8d3cf1fcc9fa1f2d4660407
---

# TASK-001 WSL/NVHPC/MPI 目标环境验证收据

## 验证结论

TASK-001 的代码修复、干净构建、单 rank 和双 rank 通信回归全部完成。最终验收矩阵全部通过，任务可标记为 `done`。

本收据只支持单块 RTX 4060 Laptop GPU 上的 WSL2 正确性回归，不支持真实多 GPU 性能或扩展性结论。

## 环境

- 系统：WSL2 Ubuntu，Linux `5.15.167.4-microsoft-standard-WSL2`；
- GPU：NVIDIA GeForce RTX 4060 Laptop GPU，8188 MiB，compute capability 8.9；
- 驱动：560.94；
- 编译器：NVHPC/nvfortran 24.11；
- MPI：NVHPC OpenMPI 4.1.5，`mpif90` 实际调用 `nvfortran`；
- CUDA Toolkit：12.6；
- Make：GNU Make 4.3；
- Git：`3c5b4b51dbeb34d6f8d3cf1fcc9fa1f2d4660407`。

完整环境见 `env_summary.log` 和 `env_check.log`。

## 构建

从 `CUDA_coding/CUDA_code/源代码` 执行 `make veryclean` 和 `make all`，退出码均为 0。三/五对角模块、静态库和两个示例均由当前源码重新生成。

产物 SHA-256：

- `lib/libPaScaL_TDMA.a`：`8EE5144C3A85295B9B4FA3516EAB0DCF78D92EB929629B56DAA1CC29199F06FF`；
- `run/a.out`：`A67E02DC40236100015DCAF471776B5FA5CFAAC2594D41207E6914C878790AED`；
- `run/a.out_penta`：`B6388B266E2AA06A426C439DE6A2BE42F4C146DB905B1E33D66292BCBF382173`。

构建证据见 `clean.log` 和 `build_all.log`。

## 最终回归矩阵

| 路径 | 命令要点 | 结果 |
| --- | --- | --- |
| 三对角 `np=1` | `mpirun -np 1 ./run/a.out` | PASS；solver finished；15 个抽样值为 `1.000` |
| 五对角 `np=1` | `mpirun -np 1 ./run/a.out_penta` | PASS；solver finished；15 个抽样值为 `1.000` |
| 三对角 `np=2` | `mpirun --mca opal_cuda_support true --mca btl_smcuda_use_cuda_ipc 0 -np 2 ./run/a.out` | PASS；两个 rank 共 30 个抽样值为 `1.000` |
| 五对角 `np=2` | `mpirun -np 2 ./run/a.out_penta` | PASS；两个 rank 共 30 个抽样值为 `1.000` |

四份最终日志均无 `0.000` 解值，也未发现 NaN、Inf、segmentation、MPI abort、failed 或 error。统一 L0/L1 检查再次通过。

## 失败诊断与环境边界

三对角默认 `mpirun -np 2 ./run/a.out` 在当前“两个 rank 共享同一块 WSL GPU”的环境中正常退出，但抽样解为 `0.000`，见 `tri_np2.log`。保持同一二进制和输入，仅禁用 OpenMPI 的同 GPU CUDA IPC 后结果恢复为 `1.000`，见 `tri_np2_no_cuda_ipc.log`。

因此当前证据支持：该失败是 WSL 单 GPU、多 rank、CUDA-aware OpenMPI 传输配置问题。三对角固定传递 device buffer，必须使用上述 MCA 配置；五对角默认 host staging 不受影响。这个诊断不能外推到每 rank 独占 GPU 的真实多 GPU集群。

## 未修改范围

本轮只运行环境检查、构建和回归，没有修改 Fortran 源码、消元算法、28 槽布局、性能路径或 benchmark。
