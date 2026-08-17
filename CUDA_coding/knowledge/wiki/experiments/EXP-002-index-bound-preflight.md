---
id: EXP-002
type: experiment
status: draft
confidence: high
source_ids: [SRC-003P]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# EXP-002：五对角索引与尺寸上界预检

## 问题

当前五对角实现的数组偏移、CUDA kernel 索引以及传统 `MPI_Alltoallv` 的 count/displacement 都使用默认 32 位整数。如何在不改变热循环索引宽度、消元算法和 28 槽布局的前提下，避免大尺寸乘法静默溢出后进入分配、MPI 或 kernel？

## 决策与方法

采用“setup 层局部 64 位预检、热循环继续 32 位”的合同：

- plan 在分配前以 `integer(int64)` 计算 `ceil(Nsys/nprocs)` 及 28/32/4 槽工作区和 MPI 总 extent；
- solver 在 kernel 启动前以 `integer(int64)` 检查 `Nsys*Nrow`；
- 任一 extent 超过 `huge(default integer)=2,147,483,647` 时，报告位置、required 和 limit 后终止；
- 检查通过后才允许现有默认整数乘法、MPI 描述符和 CUDA kernel 路径执行。

最严格的当前 plan Gate 为：

```text
ceil(Nsys/nprocs) * 32 * nprocs <= 2^31-1
Nsys * Nrow                       <= 2^31-1
```

单 rank 时，第一个 Gate 给出 `Nsys<=67,108,863`。这只是整数合同上界，实际可运行规模还受主存、显存和矩阵 extent 限制。

## 验证

| 项目 | 结果 |
| --- | --- |
| setup-only plan 精确边界 | 8 个通过 |
| setup-only 矩阵精确边界 | 7 个通过 |
| 随机 setup-only 配置 | 10,000 个通过 |
| API 正反用例 | 16/16 符合预期 |
| NVHPC + MPI 干净构建 | 通过 |
| 五对角 `np=1/2` | 通过 |
| unchanged benchmark smoke | 误差约机器精度，通过 |

两个新增失败用例分别验证：

- `Nsys=67,108,864,nprocs=1` 在 plan 分配前因 `tmp_Nmax*32*nprocs=2,147,483,648` 被拒绝；
- `Nsys=2,Nrow=2,147,483,647` 在 solver kernel 前因 `Nsys*Nrow=4,294,967,294` 被拒绝。

## 支持的结论

已登记的默认整数 extent 溢出会在 plan 分配或 solver kernel 启动前被明确拒绝。该改动提高输入鲁棒性和错误可诊断性。

## 不支持的结论

- 不支持超过 32 位的扁平 kernel 偏移；
- 不支持 MPI 大计数 binding；
- 没有证明极限内存规模可实际分配；
- 没有引入或证明速度提升；
- 未完成 CUDA sanitizer 或真实多 GPU 极限规模验证。

## 证据

- `verify/penta_index_bounds_verify.js`
- `examples/test_penta_api_validation.f90`
- `knowledge/outputs/validation/TASK-008-20260817-wsl-nvhpc24.11/README.md`
- [[../methods/index-width-contract]]
- [[../testing/test-matrix]]
