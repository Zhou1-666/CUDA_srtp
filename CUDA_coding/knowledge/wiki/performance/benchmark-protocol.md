---
id: KB-PERF-001
type: method
status: reviewed
confidence: high
source_ids: [SRC-003, SRC-005]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 论文级 benchmark 协议

## 公平性合同

任何性能对比必须固定：硬件/拓扑、编译器和 flags、精度、系数/RHS、全局规模、rank→GPU 映射、MPI 模式、正确性阈值、预热、重复次数和计时范围。

一次实验只改变一个变量：例如 28→22、persistent staging 或 CUDA-aware MPI。

## 当前 benchmark 输出

`benchmark_penta.f90` 输出：

- 标识：solver、implementation、nranks；
- 规模：`n1/n2/n3/nsys/nrow_min/nrow_max`；
- 迭代：当前 iter、总 iterations、mpi_mode；
- 总时间：`total_s_max/avg`；
- 阶段：local、pack fwd、MPI fwd、unpack fwd、reduced、pack bwd、MPI bwd、unpack bwd、update；
- 聚合：compute、communication、packing；
- 正确性：`err_rms/err_linf/cross_err_max`。

阶段时间使用 rank 局部时间的 MPI MAX；这是并行墙钟的合理口径。`communication_s_max` 只合计两次 MPI，packing 独立报告。

## 运行协议

1. 从干净对象构建 release；
2. 保存环境收据和 Git commit；
3. 运行 correctness case，未过则停止；
4. 预热至少 1–3 次；
5. 正式重复至少 5 次，论文建议 10 次；
6. 每次按 rank MAX 记录，跨重复报告中位数和 IQR/MAD；
7. 同时保存原始 CSV，不只保存汇总图；
8. 异常值按预注册规则处理并保留原始行；
9. 图表脚本从冻结 CSV 重建。

## 实验矩阵

### 强扩展

固定全局 `n1×n2×n3`，使用 1/2/4/8 GPU；报告时间、加速、并行效率、每阶段占比和误差。

### 弱扩展

至少一种方式保持每 GPU `Nsys×Nrow` 近似恒定。必须写清增长的是线数量还是全局线长。

### 消融

```text
28 host staging
22 host staging
22 persistent host staging
22 CUDA-aware MPI
[可选] 22 nonblocking/overlap
```

最后一项只有在前面冻结后才开始，避免多个变量混合。

## 禁止解释

- 单 GPU 多 rank 不能写成多 GPU scaling；
- 槽数下降 21% 不等于通信时间或 total 下降 21%；
- 不只报告加速比，必须报告绝对时间；
- 不用不同精度/误差/规模的参考制造加速；
- profiler 中同步位置变化可能改变阶段时间，应同时看 total。

## 需要新增字段

未来建议增加：Git commit、build flags、GPU UUID/model、ranks-per-GPU、forward_slots、cuda_aware、warmups、run_id。当前 `mpi_mode` 固定写 `host`，启用其他模式前必须改为真实值。

## 相关

- [[../../../程序正确性与性能运行手册]]
- [[hardware-matrix]]
- [[../testing/test-matrix]]
- [[../experiments/EXP-000-现有基线盘点]]
- [[../paper/claim-evidence-matrix]]
