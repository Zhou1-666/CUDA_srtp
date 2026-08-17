---
id: KB-METHOD-005
type: method
status: draft
confidence: medium
source_ids: [SRC-003]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 大规模索引宽度合同

## 风险点

当前尺寸、MPI count/displacement 和 kernel 索引主要使用默认 Fortran `integer`。潜在溢出表达式包括：

- `Nsys*Nrow`；
- `28*Nsys`、未来 `22*Nsys`；
- `32*nprocs`、`4*nprocs`；
- `tmp_N*32`、`tmp_N*4`；
- `sum(bufsubsize*)` 和累计 displacement；
- CUDA grid 维度和扁平 kernel launch 规模。

## 决策原则

不要把所有热循环整数无差别改成 64 位：

1. 在 plan/create、分配和累计偏移阶段用明确 64 位临时量计算上界；
2. 在转换回 MPI/默认 integer 前检查范围；
3. 若逐元素线性索引确实可能超过 32 位，才为内核引入 32/64 位路径；
4. 若算法或 MPI count 不支持该规模，入口明确拒绝，而不是静默溢出；
5. grid dimension 超限需要分块/stride，单纯换整数类型无效。

## MPI 特别约束

传统 `MPI_Alltoallv` Fortran binding 的 `sendcounts/displs` 常为默认 `INTEGER`。即使 device allocation 使用 64 位，单 peer count 或 displacement 仍可能超过 32 位。需要根据实际 MPI 标准/实现确认大计数接口，或对通信分块。

## 待建立测试

- 不分配超大数组的 setup-only 边界测试；
- 对每个乘法做 `huge(integer)` 前检查；
- `Nsys<nprocs` 和零长度块；
- grid x/y 维上界；
- 若未来支持大计数，跨 `2^31-1` 的最小通信/索引回归。

## 当前结论边界

这是风险合同，不代表代码已经支持超过 32 位的元素数，也不建议在普通规模下为全部 kernel 强制 64 位索引。

## 相关

- [[penta-data-layout]]
- [[../systems/data-ownership-and-lifetime]]
- [[../testing/test-matrix]]

