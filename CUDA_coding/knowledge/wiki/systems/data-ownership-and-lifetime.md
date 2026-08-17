---
id: KB-SYSTEM-002
type: method
status: reviewed
confidence: high
source_ids: [SRC-003]
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

当前 `clean` 无 `allocated()` 防护，因此重复 clean、未完成 create 后 clean 或部分分配失败都可能有风险。任务中不要假定清理是幂等的。

## `pascal_a2av` 临时拥有

host staging 路径每次调用临时分配 `hA/hB`，完成 device→host、`MPI_ALLTOALLV`、host→device 后立即释放。一次多 rank solve 调用两次，因此重复求解会重复分配/释放。

`MPI_ALLTOALLV` 是阻塞式集合通信，两个实现不再创建或等待 request。返回码非 `MPI_SUCCESS` 时打印错误码并对调用方 communicator 执行 `MPI_ABORT`；五对角 host staging 只有通信成功才把 `hB` 写回 device `B`。该代码路径尚待 NVHPC + MPI 目标环境验证。

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

## 待补 API 检查

- plan 是否已创建/已清理；
- `Nsys` 和 solver 调用是否与 create 一致；
- `Nrow>=5`、`Nsys>0`、线程数合法；
- communicator/rank/nprocs 一致；
- `Nsys<nprocs` 的空分区应拒绝还是支持；
- CUDA/MPI 返回码和 kernel launch error；
- 主元为零/近零的数值失败策略。

## 相关

- [[module-dependency-map]]
- [[../methods/penta-data-layout]]
- [[../testing/test-matrix]]
