---
id: VAL-TASK-008-20260817
type: validation-receipt
status: draft
confidence: high
source_ids: [SRC-003P]
created: 2026-08-17
---

# TASK-008 五对角索引上界验证回执

## 结论

TASK-008 完成定义已满足：setup-only 独立边界模型、NVHPC + MPI 干净构建、16 个 API 正反用例、五对角 `np=1/2` 和 unchanged benchmark 正确性 smoke 全部通过。

本任务只加入五对角设置/入口层的尺寸预检，没有修改三对角源码、消元算法、28/22 槽布局、CUDA 热循环索引、性能路径或 benchmark 源码。因此结论是鲁棒性增强，不是速度优化。

## 环境

- WSL2 Ubuntu；
- NVHPC 24.11；
- OpenMPI 4.1.5；
- CUDA 12.6；
- NVIDIA GeForce RTX 4060 Laptop GPU，8 GB；
- 单 GPU；`np=2` 只作为多 rank 通信正确性回归，不作为多 GPU scaling 证据。

## 结果

| 检查 | 结果 | 日志 |
| --- | --- | --- |
| `make veryclean` | 通过 | `clean.log` |
| `make all` | 通过 | `build_all.log` |
| API runner | `cases=16 failures=0` | `api_validation_summary.log`、`api_cases/` |
| 五对角 `np=1` | 样例值均为 `1.000` | `penta_np1.log` |
| 五对角 `np=2` | 两 rank 样例值均为 `1.000` | `penta_np2.log` |
| benchmark clean/build | 通过 | `benchmark_clean.log`、`benchmark_build.log` |
| correctness smoke | `err_linf=1.332e-15`，28 槽 cross error `4.219e-15` | `benchmark_smoke_np2.log` |

新增的 plan 超限日志包含：

```text
required=2147483648, limit=2147483647
```

新增的 solver 矩阵超限日志包含：

```text
required=4294967294, limit=2147483647
```

## 复验命令

在源码根目录：

```powershell
node verify/penta_index_bounds_verify.js
bash verify/run_penta_api_validation.sh verify/logs/task-008
```

前者必须以 `failures: 0` 结束；后者必须以 `API validation summary: cases=16 failures=0` 结束。CUDA Fortran 复验仍要求安装 NVHPC、MPI 和可用 GPU。

## 边界

- 未运行 CUDA sanitizer；
- 未验证 MPI 大计数或 64 位 kernel 路径，因为当前实现明确不支持；
- 未验证真实多 GPU；
- benchmark 只用于确认源码未变且数值回归通过，不形成性能主张。
