---
id: KB-TEST-001
type: method
status: draft
confidence: high
source_ids: [SRC-003P, SRC-004, SRC-005, SRC-024]
compiled_at: 2026-08-17
updated: 2026-09-09
---

# 测试与验证矩阵

逐rank生命周期/Sanitizer复验应核对实际工具参数、二进制SHA、数值/退出记录及完整检查器日志，再核适用压力矩阵；不能只认总PASS或空日志。日志解析使用真实生产输出样本，核命名字段、有限非负数值、阈值、记录数量、规模与rank覆盖，分别记录程序rc、解析分类和批作业rc。TASK-031逐版本运行与解析器准备记录保留在任务回执；本页不据旧快照排程，实时验收和缺口看[[../../meta/task-queue]]、[[../../meta/task-blocker-register]]。修订前完整字节见[B批冻结说明](../../outputs/plans/20260909-batch-b-allowlist.md)。

新候选的验收流程以 [[source-change-validation-sop]] 为准：核心源码版本须覆盖数学、干净构建、单 GPU、真实多 GPU、跨节点、生命周期和适用集成/性能回归。本页的任务最低测试与历史“当前结果”不替代新候选的完整回执；下方旧层级表用于解释测试用途，不作为缩减新 SOP 门禁的依据。

历史合同（2026-08-26，当时TASK-023为review；后续关闭按正式回执）的新增诊断合同见 [本地回执](../../outputs/validation/TASK-023-20260826-local-implementation/README.md) 和其中源码快照的 `verify/TASK023-diagnostics.md`：严格37列CSV/完整配对解析、默认35列兼容、每迭代精度、输出不覆盖、rank模式/数值配置一致性。不均匀P2及9项拒绝已在本机NVHPC验证；单卡双rank不替代A100正式协议。工具目前仅在TASK-023隔离worktree和回执source快照，未合入主源码。

## 当前可运行的独立数学层

| 命令 | 覆盖 | 当前结果 |
| --- | --- | --- |
| `node verify/penta_indep_check.js` | 五对角算法 vs 稠密直解 | 72 组通过 |
| `node verify/penta_comm_28_verify.js` | 28 槽通信模型 | 756 组，0 失败 |
| `node verify/penta_comm_22_verify.js` | 28→22 pack/unpack 逐槽等价 | 180 组、403,200 次逐槽检查、28/28 故障注入，0 失败 |
| `node verify/penta_index_bounds_verify.js` | 32 位 plan/矩阵上界分类 | 15 个精确边界、10,000 个随机 setup-only 配置，0 失败 |
| `node verify/penta_stability_check.js` | 对角占优、弱占优、跨尺度、近奇异、零/近零主元 | TASK-015：6 类通过；相对主元阈值 `64ε`，失败码 `4` |
| `node verify/penta_capacity_model.js --self-test` | 当前 28/22 前向槽实现的逐分配容量公式、P=1/2 与 budget 分类 | TASK-018 回执仍对应 `8df948e`；TASK-006 模型保留规范 28 槽 `rd`、仅缩小 forward buffers，并另计主元状态数组，6 项自检通过 |
| `node verify/hepta_indep_check.js` | 七对角原型 | 54 组通过 |
| `node verify/mband_general.js` | `m=1..6` 结构公式 | 216 组通过 |
| `node verify/mband_recurrence.js` | 一般递推 vs 稠密缩减 | 108 组通过 |

这些脚本不覆盖 CUDA 越界、MPI request、编译器行为和设备通信。

历史任务还使用过 `verify/run_task_007_profile_timing.sh` 和 `verify/task020_critical_path_audit_test.js`。两入口及其源码依赖尚未随本批进入main，不列为干净clone可运行命令；本批不认领或执行这些C批工具。相应方法/结果见[[../performance/benchmark-protocol]]与[[../decisions/ADR-006-TASK-020暂不实施overlap]]，采用工具前须由源码任务另行冻结验证。

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
| 布局 | 28、22 | 等价与消融 |
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
| persistent staging | 先以 profile 证明 allocate+free 达预注册门槛；仅达门槛后才要求 L2–L5 + 100 次重复 + 内存检查 |
| CUDA-aware | L3–L5 + 最小 device MPI 验证 |
| S1/S6 kernel | L1–L6，最小 Nrow 和随机系统 |
| 数值主元合同 | 六类独立矩阵 + NVHPC `np=1/2` 正例/守卫 + TASK-014 正常回归；失败须有消息和错误码 `4`，不得期待 NaN/Inf |
| 一般 `m` | 独立数学/证明；未实现前不要求 Fortran |
| P=1 cuSPARSE 外部锚点 | 专属 adapter 干净构建 + exact1/manufactured `1e-10` Gate + 2 次独立预热 + 5 次正式独立启动 + 原始 CSV/中位数/IQR/MAD/CV + 独立审查 |
| 论文 release | L0–L7 + 干净环境独立复现 |

## 阈值策略

TASK-015 已冻结当前无主元交换五对角路径的数值阈值：

- 除法前要求 `abs(pivot) > 64*epsilon(FP64)*row_scale`，其中 `row_scale` 由同一变换行相关项的绝对值构成；
- 对角占优、弱占优、跨尺度的归一化后向误差和前向误差均不高于 `1e-10`；
- 受控近奇异族后向误差不高于 `1e-10`、前向误差不高于 `1e-5`，必须同时报告两者；
- 零/近零主元必须以错误码 `4` 和 `numerical pivot breakdown` 拒绝；
- TASK-014 正常 manufactured 的解误差继续不高于 `1e-10`；
- 28/22 cross error 不高于同一 baseline 容差；
- 无 NaN/Inf、MPI/CUDA 错误；
- 性能失败不能通过放宽正确性阈值解决。

## 当前缺口

- 已有本地入口：从仓库根目录运行 `powershell -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1`，依次执行 L0 知识 lint、当前八项 L1 数学检查与不分配 GPU 的容量模型自检；必须另核对子脚本失败计数与数值，退出码汇总不足以保证正确性，已知边界见 [[source-change-validation-sop]]；
- TASK-001 的 request/WAITALL 静态检查、L0/L1、WSL2/NVHPC 干净构建及单 GPU `np=1/2` L3/L4 已通过；
- TASK-004 的 14 个、TASK-008 的 16 个、TASK-006 的 18 个 API 正反用例均符合各自冻结合同；
- TASK-008 将 API 矩阵扩展到 16 例；两个 32 位超限输入均提前拒绝，合法 `np=1/2` 与 profiled smoke 通过；
- TASK-016 已在 WSL/NVHPC 24.11/OpenMPI 4.1.5 完成 28/22 各 100 次 `np=2` create–solve–clean，最大误差均 `6.6613e-16`；两布局的 Compute Sanitizer memcheck/initcheck 均由两个 rank 报告 0 errors；
- TASK-005 的 22 槽独立脚本已通过；TASK-006 的可切换 Fortran 路径在 `faffee3` 完成 L2–L4 和 TASK-016 L6 Gate，性能 L5/L7 等待 TASK-009；
- TASK-014 的 28 槽 debug/release、`np=1/2 × exact1/manufactured` 和五次 P=1 性能基线已通过；TASK-022 在相同单 GPU固定配置下完成 cuSPARSE QR 外部锚点和独立复审。两者只支持 P=1 solver-window 的严格限定比较，不支持多 GPU或普遍性能结论；
- TASK-015 的六类独立矩阵与 NVHPC `np=1/2` 12 项通过；零/近零主元不再静默传播 NaN/Inf。无主元交换的适用域边界和未测性能影响必须保留；
- TASK-009 已有正式1/2/4/8 GPU强弱扩展矩阵，结果仅支持冻结配置及低效率结论，见[[../paper/claim-evidence-matrix]]的C6/C8/C10；旧“尚无正式数据”不再作为当前缺口。新源码候选仍须重新核适用SOP。
- TASK-007 的 profile-only 五段计时在 WSL/NVHPC 与 ParaAI 双 A100 上通过；5 次正式作业共 50 个样本的 allocate+free 占比中位数 `0.1474%`、最大误差 `3.522e-13`，因此不实施 persistent buffer。该否决不等于 MPI 或 D2H/H2D 没有优化空间。
- TASK-020 的独立审计器在同一 5 作业上得到 MPI-only 中位占比 `51.5085%`、保守收益中位数 `10.8458%`，但只有 3/5 作业达到单作业 `10%`，未过 4/5 稳定性 Gate；TASK-021 保持 blocked，模型收益不是实测加速。

## 相关

- [[../../../程序正确性与性能运行手册]]
- [[../methods/six-stage-penta-flow]]
- [[../performance/benchmark-protocol]]
- [[../../meta/task-queue]]

## TASK-010：独立 Poisson/Helmholtz 制造解

SRC-024 / [完整回执](../../outputs/validation/TASK-010-20260826-paraai-a100-job1454628/README.md)已验收。FP64，Nx=16、Ny=8；lambda=0/1 × np=1/2 × slots=28/22 × Nz=32/64/128/256，共32例；scaled residual≤1e-10，64→128和128→256的L2/Linf阶均≥3.8。原始表头、每例一行、有限非负指标和唯一笛卡尔积必须核对，不能只看runner标记。

稳定入口是归档source/verify中的 `task010_manufactured_audit_test.js`、`task010_source_contract_test.js`、审计器 `--self-check` 及消费完整CSV的 `--input/--summary`。目标Linux入口 `run_task_010_manufactured.sh` 会清理构建目录，必须使用经哈希验证的独立源码副本；各rank显式导出相同PENTA_FORWARD_SLOTS。本轮不重跑GPU。只读人工复验命令见 [运行手册](../../../程序正确性与性能运行手册.md)。

原始 `cases.csv` 33行、`summary.csv` 9行，runner/audit均需cases=32 failures=0。此次三项原审计边界风险见最终审查，不推断通用输入校验完备性；变更算子、幽灵边界、CSV、分解或环境合同需重开该矩阵。
