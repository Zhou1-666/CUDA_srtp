---
id: KB-TEST-001
type: method
status: draft
confidence: high
source_ids: [SRC-003P, SRC-004, SRC-005]
compiled_at: 2026-08-17
updated: 2026-08-19
---

# 测试与验证矩阵

## 当前可运行的独立数学层

| 命令 | 覆盖 | 当前结果 |
| --- | --- | --- |
| `node verify/penta_indep_check.js` | 五对角算法 vs 稠密直解 | 72 组通过 |
| `node verify/penta_comm_28_verify.js` | 28 槽通信模型 | 756 组，0 失败 |
| `node verify/penta_comm_22_verify.js` | 28→22 pack/unpack 逐槽等价 | 180 组、403,200 次逐槽检查、28/28 故障注入，0 失败 |
| `node verify/penta_index_bounds_verify.js` | 32 位 plan/矩阵上界分类 | 15 个精确边界、10,000 个随机 setup-only 配置，0 失败 |
| `node verify/penta_capacity_model.js --self-test` | 当前 28 槽/投影 22 槽逐分配容量公式、P=1/2 与 budget 分类 | TASK-018 进行中；不分配 GPU |
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

当前五对角 API 明确拒绝 `Nsys<nprocs`；`empty_partition` 是预期失败用例。若未来支持空分区，必须作为独立算法/通信任务重新设计和验证。

## 任务到测试映射

| 变更 | 最低测试 |
| --- | --- |
| 删除无效 WAITALL | L1 + L2 + L3 + L4；MPI 返回码 |
| 输入/错误检查 | L2 + 非法参数矩阵 |
| 索引/尺寸上界 | setup-only 精确边界 + L2 + 超限 API 失败用例 + L3/L4 |
| 容量模型 | Node 逐分配自检 + 目标 GPU FIT smoke + 不分配 REJECT 日志；22 槽实测等待 TASK-006 |
| 28→22 | 六项 L1（含 22 等价脚本）+ L2–L5 |
| persistent staging | L2–L5 + 100 次重复 + 内存检查 |
| CUDA-aware | L3–L5 + 最小 device MPI 验证 |
| S1/S6 kernel | L1–L6，最小 Nrow 和随机系统 |
| 一般 `m` | 独立数学/证明；未实现前不要求 Fortran |
| P=1 cuSPARSE 外部锚点 | 专属 adapter 干净构建 + exact1/manufactured `1e-10` Gate + 2 次独立预热 + 5 次正式独立启动 + 原始 CSV/中位数/IQR/MAD/CV + 独立审查 |
| 论文 release | L0–L7 + 干净环境独立复现 |

## 阈值策略

最终数值阈值应在 P0 修复后的干净 28 槽 baseline 上冻结。当前建议只作为初值：

- JS 独立双精度保持机器精度量级；
- Fortran `err_linf` 不高于 baseline 的预注册合理倍数；
- 28/22 cross error 不高于同一 baseline 容差；
- 无 NaN/Inf、MPI/CUDA 错误；
- 性能失败不能通过放宽正确性阈值解决。

## 当前缺口

- 已有统一入口：从仓库根目录运行 `powershell -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1`，依次执行 L0 知识 lint、七项 L1 数学检查与不分配 GPU 的容量模型自检；
- TASK-001 的 request/WAITALL 静态检查、L0/L1、WSL2/NVHPC 干净构建及单 GPU `np=1/2` L3/L4 已通过；
- TASK-004 的 14 个 API 正反用例全部符合预期；五对角 `np=1/2` 与 profiled smoke 通过，详见 `knowledge/outputs/validation/TASK-004-20260817-wsl-nvhpc24.11/`；
- TASK-008 将 API 矩阵扩展到 16 例；两个 32 位超限输入均提前拒绝，合法 `np=1/2` 与 profiled smoke 通过；
- 没有 CUDA sanitizer 日志；
- TASK-005 的 22 槽独立脚本已通过；Fortran 22 槽路径及其 L2–L5 尚未实现；
- TASK-014 的 28 槽 debug/release、`np=1/2 × exact1/manufactured` 和五次 P=1 性能基线已通过；TASK-022 在相同单 GPU固定配置下完成 cuSPARSE QR 外部锚点和独立复审。两者只支持 P=1 solver-window 的严格限定比较，不支持多 GPU或普遍性能结论；
- 没有多 GPU 真实回归。

## 相关

- [[../../../程序正确性与性能运行手册]]
- [[../methods/six-stage-penta-flow]]
- [[../performance/benchmark-protocol]]
- [[../../meta/task-queue]]
