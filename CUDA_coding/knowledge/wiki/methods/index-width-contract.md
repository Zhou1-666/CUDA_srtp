---
id: KB-METHOD-005
type: method
status: draft
confidence: high
source_ids: [SRC-003P]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 大规模索引宽度合同

## 已识别风险点

当前尺寸、MPI count/displacement 和 kernel 索引主要使用默认 Fortran `integer`。潜在溢出表达式包括：

- `Nsys*Nrow`；
- `28*Nsys`、未来 `22*Nsys`；
- `32*nprocs`、`4*nprocs`；
- `tmp_N*32`、`tmp_N*4`；
- `sum(bufsubsize*)` 和累计 displacement；
- CUDA grid 维度和扁平 kernel launch 规模。

## 已采用决策

不要把所有热循环整数无差别改成 64 位：

TASK-008 采用“setup 层 64 位预检、热循环保持 32 位”的方案：

1. `pascal_plan_create` 在任何工作区分配和默认整数乘法前，以 `integer(int64)` 检查所有 plan/MPI 尺寸；
2. solver 在 kernel 启动前检查 `Nsys*Nrow`；
3. 检查通过后，现有默认整数描述符、`sum`、displacement 和 kernel 索引才允许执行；
4. 超限输入带具体表达式、required 和 limit 信息，通过 `MPI_ABORT`/`error stop` 拒绝；
5. 没有改动 CUDA 热循环、消元算法或 28 槽路径，因此没有引入 64 位除法/取模和 kernel 二进制双实例。

plan 的核心 Gate 是：

```text
ceil(Nsys/nprocs) * 32 * nprocs <= 2^31-1
Nsys * Nrow                       <= 2^31-1
```

代码还显式检查 28 槽 forward、4 槽 backward、`32*nprocs`、`4*nprocs` 及相应 MPI 总 extent。单 rank 时 plan 工作区给出的最大 `Nsys` 是 `floor((2^31-1)/32)=67,108,863`；实际可运行规模还受显存、主存和 `Nsys*Nrow` 限制。

## MPI 特别约束

当前传统 `MPI_Alltoallv` Fortran binding 使用默认 `INTEGER` 的 `sendcounts/displs`。TASK-008 保证当前调用不会静默超过该范围，但不提供 MPI 大计数接口；需要更大规模时必须另做分块通信或迁移到实现支持的大计数 binding。

## 已完成验证

- `penta_index_bounds_verify.js`：8 个 plan 精确边界、7 个矩阵精确边界、10,000 个随机 setup-only 配置，0 失败；
- API：`Nsys=67,108,864` 在 plan 分配前被拒绝，`Nsys=2,Nrow=2^31-1` 在 solver kernel 前被拒绝；
- NVHPC 24.11 + OpenMPI 4.1.5 干净构建和 16 个 API 正反用例通过；
- 合法 `np=1/2` 与 profiled smoke 通过。

当前 plan Gate 已把 `Nsys` 限制到 grid.x 可表示范围，pack/unpack 的 grid.y 固定为 28 或 4。若未来解除 32 位 Gate，必须重新审查 CUDA grid 上限，不能只换整数类型。

## 当前结论边界

代码已能拒绝已登记的 32 位溢出输入，但不支持超过 32 位的扁平偏移、64 位 kernel 索引或 MPI 大计数。检查只提高正确性和可诊断性，不构成速度优化。

## 相关

- [[penta-data-layout]]
- [[../systems/data-ownership-and-lifetime]]
- [[../testing/test-matrix]]
