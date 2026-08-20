---
id: OUT-TASK-016-20260820-WSL
type: validation-receipt
status: draft
confidence: high
source_ids: [SRC-003P]
created: 2026-08-20
---

# TASK-016 动态内存与生命周期回归回执

## 结论

TASK-016 完成定义已满足。源码提交为 `faffee3`：28/22 两种前向布局均在 `np=2` 下完成 100 次 `pascal_plan_create → pascal_solver → pascal_plan_clean`；每轮重新初始化非平凡制造解，检查数值误差、CUDA 同步状态、plan 元数据复位及全部 host/device allocatable 均已释放。

Compute Sanitizer `memcheck` 与 `initcheck` 对 28/22 各运行一次完整多 rank 生命周期，两 rank 均报告 `ERROR SUMMARY: 0 errors`。

## 环境

- WSL2，NVIDIA GeForce RTX 4060 Laptop GPU，8188 MiB，driver `560.94`；
- NVHPC `nvfortran 24.11-0`，OpenMPI `4.1.5`；
- Compute Sanitizer `2024.3.0`；
- FP64，`np=2` 共享单 GPU，仅作内存、生命周期和通信正确性证据。

完整环境见 [raw/environment.log](raw/environment.log)。

## 冻结合同

- `Nsys=5`、每 rank `Nrow=8`、`np=2`，保证实际进入分布式缩约与两次通信；
- 调用方六个 device arrays 在 100 次循环外持有，每轮重新初始化，plan 每轮创建和清理；
- 精确解随 system 与 cycle 改变，防止陈旧数据偶然通过；
- 每轮全局最大前向误差必须 `<=1e-10`；
- clean 后 `is_created=.false.`、MPI/尺寸/布局元数据复位，plan 的全部 host/device allocatable 均未分配；重复 clean 仍须安全；
- memcheck/initcheck 任一 rank 非零错误或检查器非零退出均判失败。

## 结果

| 检查 | 28 槽 | 22 槽 |
| --- | --- | --- |
| 100 次 create–solve–clean | PASS，最大误差 `6.6613e-16` | PASS，最大误差 `6.6613e-16` |
| Compute Sanitizer memcheck | 两 rank各 0 errors | 两 rank各 0 errors |
| Compute Sanitizer initcheck | 两 rank各 0 errors | 两 rank各 0 errors |

正式 runner 汇总为 `cases=6 failures=0`。构建、压力、sanitizer 和环境原始日志均位于 [raw](raw/)；统一知识 lint、8 项独立数学检查和容量模型自检也全部通过。

## UCX 诊断记录

首次将 Compute Sanitizer 直接置于 OpenMPI rank 内运行时，OpenMPI 的 UCX PML/OSC 在 `MPI_Init`、CUDA context 建立之前调用 `cuCtxGetDevice`，产生 `CUDA_ERROR_INVALID_CONTEXT (201)`。回溯全部位于 `libuct_cuda/libucp`，程序仍输出正确解；原始失败保留为 [diagnostic_ucx_memcheck_slots28_initial.log](raw/diagnostic_ucx_memcheck_slots28_initial.log)。

正式 runner 显式选择 `--mca pml ob1 --mca osc pt2pt --mca btl ^openib`，避免加载本测试未使用的 UCX CUDA 探测；随后两布局 memcheck 均为 0 errors。该参数是 WSL/OpenMPI 检查器兼容约束，不是对求解器错误的屏蔽。

## 证据边界

- 本任务没有修改数值算法、通信槽映射、persistent staging、CUDA-aware MPI 或 overlap；
- 没有做配对性能计时，不支持“22 槽更快”的结论；
- 单 GPU双 rank 不能证明真实多 GPU扩展性；真实 A100 性能仍须 TASK-009；
- Compute Sanitizer 只能证明本次冻结输入和执行路径未报告相应错误，不能证明所有规模绝对无缺陷。

## 人工复验

在 WSL/NVHPC + OpenMPI + 可见 NVIDIA GPU 环境，从源码根目录运行：

```bash
bash verify/run_task_016_lifecycle.sh "$PWD/verify/logs/TASK-016-manual"
```

预期末行是 `TASK-016 lifecycle validation summary: cases=6 failures=0`。失败时保存整个输出目录，尤其是 `environment.log`、对应 sanitizer 日志和压力日志。
