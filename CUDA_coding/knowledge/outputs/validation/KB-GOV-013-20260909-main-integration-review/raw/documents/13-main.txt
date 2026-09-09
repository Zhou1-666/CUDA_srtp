---
id: KB-SYSTEM-002
type: method
status: reviewed
confidence: high
source_ids: [SRC-003P]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 数据所有权与生命周期

## 调用方拥有

`A/B/C/D/E/RHS` 由调用方分配为 device arrays，并保证形状为 `(Nsys,Nrow)`。求解器不释放它们。

求解是原位的：

- 单 rank `tdma_penta_cuda` 在消元中覆盖部分系数和 `RHS`，最终解写回 `RHS`；
- 多 rank `tdma_modified_penta` 把内部重建系数写回 `A/B/D/E/RHS`；
- `pascal_update_penta` 最终把所有解写回 `RHS`；
- 调用后不能假定原系数仍可复用，除非调用方提前保留副本或重新初始化。

MPI communicator 由调用方传入。plan 只保存整数 handle，没有 `MPI_Comm_dup/free`，因此 communicator 生命周期必须覆盖 plan 全生命周期。

## plan 拥有

`pascal_plan_create` 分配、`pascal_plan_clean` 释放：

- device：`rd`、`Atr`、`Dtr`、`Drd`、`BIGbuf_A/B`；
- host/device gather 描述符；
- forward/backward sendcount、displacement 和子块描述符；
- CUDA block/grid 配置。

plan 记录 `is_created` 和创建时的 `Nsys`。`clean` 对未创建/已清理 plan 直接返回，并对每个 allocatable 使用 `allocated()` 防护；当前重复 clean 已由 API 用例覆盖。

## `pascal_a2av` 临时拥有

host staging 路径每次调用临时分配 `hA/hB`，完成 device→host、`MPI_ALLTOALLV`、host→device 后立即释放。一次多 rank solve 调用两次，因此重复求解会重复分配/释放。

`MPI_ALLTOALLV` 是阻塞式集合通信，两个实现不再创建或等待 request。返回码非 `MPI_SUCCESS` 时打印错误码并对调用方 communicator 执行 `MPI_ABORT`；五对角 host staging 只有通信成功才把 `hB` 写回 device `B`。五对角 host staging 已通过 WSL2 + NVHPC 24.11 + OpenMPI 4.1.5 的 `np=2` 示例和 profiled smoke。

优化候选：把 host buffers 放入 plan 生命周期并按最大通信需求复用；这属于独立性能任务，不能与 28→22 同时实施。

## 模块级共享状态

`pascal_cuda_aware_mpi` 是 module-level public logical，默认 `.false.`。它不是 plan 字段：同一进程中所有该模块 plan 共用模式，运行中改变会影响后续调用。

## 同步和 stream

- `pascal_a2av` 在 MPI 前调用 `CudaDeviceSynchronize()`；
- profiled solver 在阶段边界同步以取得可解释时间；
- 未发现显式 CUDA stream 参数，默认 stream/编译器语义主导；
- host staging 的数组赋值隐含 device/host 数据传输和同步。

## 生命周期合同（目标）

```text
MPI_Init
  → 选择并绑定 GPU
  → 分配/初始化调用方 device arrays
  → pascal_plan_create
  → [重新初始化输入 → pascal_solver] × 多次
  → pascal_plan_clean（一次）
  → 释放调用方 arrays
  → MPI_Finalize
```

TASK-016 另以更强的压力合同验证 plan 自身所有权：调用方 device arrays 保持存活，28/22 各循环 100 次 `create → solve → synchronize/验误差 → clean`。每轮 clean 后核对元数据复位和全部 plan host/device allocatable 未分配；两布局的 Compute Sanitizer memcheck/initcheck 均为两个 rank 0 errors。证据见 `knowledge/outputs/validation/TASK-016-20260820-wsl-nvhpc24.11/`。

## 已实现 API 合同

- plan 不得重复 create；未 create 的 solver 调用被拒绝；clean 可重复调用；
- solver 的 `Nsys` 必须等于 create 时的值，`Nrow>=5`、`Nsys>0`；
- communicator 非空，传入 rank/nprocs 必须与 communicator 一致；
- `Nsys<nprocs` 明确拒绝，当前不支持空分区；
- 两个线程块参数必须在 `[1,1024]`；
- plan 工作区、MPI count/displacement 和 solver 的 `Nsys*Nrow` 在默认整数乘法、分配或 kernel 前用 64 位临时量预检，超出 32 位合同则拒绝；
- plan/host staging 分配、MPI 调用、CUDA launch 和原有同步点检查返回状态；失败通过带模块前缀的信息和 `MPI_ABORT`/`error stop` 终止。

## 仍待处理

- 主元为零/近零的数值失败策略；
- CUDA-aware MPI 和真实多 GPU 下的失败路径；
- 普通异步 solver 的执行期 CUDA 错误在后续同步点暴露。

## 相关

- [[module-dependency-map]]
- [[../methods/penta-data-layout]]
- [[../testing/test-matrix]]
