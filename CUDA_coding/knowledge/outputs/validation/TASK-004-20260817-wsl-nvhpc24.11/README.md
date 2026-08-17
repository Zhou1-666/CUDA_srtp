---
id: VAL-TASK-004-20260817
type: validation-receipt
status: draft
confidence: high
source_ids: [SRC-003P]
created: 2026-08-17
---

# TASK-004 五对角 API 与错误检查验证回执

## 结论

TASK-004 已通过当前完成定义：五对角模块已补充 plan/API 输入、空分区、分配、CUDA kernel launch/同步和 MPI 返回码检查；WSL2 目标环境完成干净构建，14 个 API 正反用例全部符合预期，合法 `np=1/2` 示例与 profiled benchmark smoke 正常结束。

本任务没有修改三对角源码、消元公式、28 槽布局和 benchmark 源码。benchmark smoke 只证明入口可运行且误差未异常，不作为性能结论。

## 环境

- Windows 11 WSL2 Ubuntu；
- NVHPC 24.11，OpenMPI 4.1.5，CUDA 12.6；
- NVIDIA GeForce RTX 4060 Laptop GPU，8 GiB；
- 验证前 Git 基线：`7ee9f8a3e41469e3d890e842147960e8c0405f35`；
- MPI 模式：host staging；`np=2` 为单 GPU 双 rank。

## 代码范围

- `src/PaScaL_TDMA_cuda_penta.f90`：plan 状态、输入合同、幂等 clean、分配/CUDA/MPI 失败中止；
- `examples/test_penta_api_validation.f90`：专用 API 测试驱动；
- `verify/run_penta_api_validation.sh`：带超时和预期退出码的用例运行器；
- 根目录和 `examples/Makefile`：仅新增 `api_validation` 显式目标，默认 `all` 不变。

## 验证结果

| 验证 | 结果 | 证据 |
| --- | --- | --- |
| 改动前统一 L0/L1 | 通过；0 errors，五项 Node 检查通过 | 本任务执行记录 |
| `make veryclean && make all` | 通过 | `clean.log`、`build_all.log` |
| API 驱动构建 | 通过 | `api_cases/build_api_validation.log`（最终收紧用例） |
| 合法生命周期 | `valid`、`double_clean`、`clean_uncreated` 通过 | `api_validation_summary.log`、`api_cases/` |
| 非法 API | 11 个非法用例均被带前缀错误信息的非零退出拒绝 | `api_validation_summary.log`、`api_cases/` |
| 五对角示例 | `np=1/2` 均正常结束，抽样结果为 `1.000` | `penta_np1.log`、`penta_np2.log` |
| profiled smoke | `np=2` 正常结束，实验路径 `err_linf=1.33e-15`、`cross_err=4.22e-15` | `benchmark_smoke_np2.log` |

API 用例总计 14 个、失败计数 0。其中非法用例覆盖：`Nsys<=0`、`Nsys<nprocs`、rank/size 不一致、空 communicator、线程数越界、重复 create、未 create 求解、`Nrow<5` 和 solver/plan 的 `Nsys` 不一致。

## 可复制复验

在 NVHPC + MPI 环境、源码根目录运行：

```bash
make veryclean
make all
make api_validation
bash verify/run_penta_api_validation.sh verify/logs/task-004
mpirun -np 1 ./run/a.out_penta
mpirun -np 2 ./run/a.out_penta
```

预期 `API validation summary: cases=14 failures=0`，两个示例正常退出且无 MPI/CUDA error、NaN/Inf。

## 未覆盖边界

- 尚未检查尺寸乘法和 MPI count/displacement 的整数溢出；由 TASK-008 处理；
- 尚未定义零/近零主元的数值失败策略；
- 未运行 Compute Sanitizer；
- 未验证 CUDA-aware MPI 分支和真实多 GPU；
- 普通 solver 使用 `cudaGetLastError` 检查 launch，不额外同步；异步执行错误仍需后续同步点或调用方同步暴露。
