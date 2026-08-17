---
id: KB-TEST-001
type: method
status: draft
confidence: high
source_ids: [SRC-003, SRC-004, SRC-005]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 测试与验证矩阵

## 当前可运行的独立数学层

| 命令 | 覆盖 | 当前结果 |
| --- | --- | --- |
| `node verify/penta_indep_check.js` | 五对角算法 vs 稠密直解 | 72 组通过 |
| `node verify/penta_comm_28_verify.js` | 28 槽通信模型 | 756 组，0 失败 |
| `node verify/hepta_indep_check.js` | 七对角原型 | 54 组通过 |
| `node verify/mband_general.js` | `m=1..6` 结构公式 | 216 组通过 |
| `node verify/mband_recurrence.js` | 一般递推 vs 稠密缩减 | 108 组通过 |

这些脚本不覆盖 CUDA 越界、MPI request、编译器行为和设备通信。

## 目标验证层级

| 层 | 用途 | 必须条件 |
| --- | --- | --- |
| L0 知识 lint | 链接、来源、状态 | 每次知识编译 |
| L1 数学真值 | 公式/槽位/递推 | 任何算法或布局改动 |
| L2 干净构建 | 编译/API/链接 | 任何 Fortran 改动 |
| L3 单 rank | GPU 直接路径 | 任何 kernel/plan 改动 |
| L4 多 rank 小回归 | MPI + 缩约路径 | 任何通信/布局改动 |
| L5 benchmark quick | 阶段时间与误差 | 任何性能改动 |
| L6 sanitizer/profiler | 内存与因果 | 高风险 kernel/性能任务 |
| L7 多 GPU HPC | 扩展和论文证据 | 发布/论文性能主张 |

## 输入矩阵

| 维度 | 最小集合 | 目的 |
| --- | --- | --- |
| `Nrow` | 5、6、8、16、实际大尺寸 | 最小前提、递推分支、常规路径 |
| `Nsys` | 1、`P`、`P+1`、非 `P` 整除、大规模 | 空/不均匀分区和性能 |
| ranks | 1、2、4 | 直接、最小通信、多 peer |
| 方程 | exact1、manufactured、随机对角占优 | 快速真值、非平凡解、广覆盖 |
| 布局 | 28、未来 22 | 等价与消融 |
| MPI | host staging、CUDA-aware | 通信路径 |
| 重复调用 | 1、10、100 | 生命周期、泄漏、persistent buffer |

在当前代码正式支持前，`Nsys<nprocs` 应作为“必须拒绝或明确定义”的测试，而不是默认成功。

## 任务到测试映射

| 变更 | 最低测试 |
| --- | --- |
| 删除无效 WAITALL | L1 + L2 + L3 + L4；MPI 返回码 |
| 输入/错误检查 | L2 + 非法参数矩阵 |
| 28→22 | 五项 L1 + 新 22 等价脚本 + L2–L5 |
| persistent staging | L2–L5 + 100 次重复 + 内存检查 |
| CUDA-aware | L3–L5 + 最小 device MPI 验证 |
| S1/S6 kernel | L1–L6，最小 Nrow 和随机系统 |
| 一般 `m` | 独立数学/证明；未实现前不要求 Fortran |
| 论文 release | L0–L7 + 干净环境独立复现 |

## 阈值策略

最终数值阈值应在 P0 修复后的干净 28 槽 baseline 上冻结。当前建议只作为初值：

- JS 独立双精度保持机器精度量级；
- Fortran `err_linf` 不高于 baseline 的预注册合理倍数；
- 28/22 cross error 不高于同一 baseline 容差；
- 无 NaN/Inf、MPI/CUDA 错误；
- 性能失败不能通过放宽正确性阈值解决。

## 当前缺口

- 已有统一入口：从仓库根目录运行 `powershell -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1`，依次执行 L0 知识 lint 与五项 L1 数学检查；
- TASK-001 的 request/WAITALL 静态检查和 L0/L1 已通过，但当前环境不能运行所需的 L2–L4；
- 没有 CUDA sanitizer 日志；
- 没有 22 槽独立脚本；
- 没有多 GPU 真实回归。

## 相关

- [[../../../程序正确性与性能运行手册]]
- [[../methods/six-stage-penta-flow]]
- [[../performance/benchmark-protocol]]
- [[../../meta/task-queue]]
