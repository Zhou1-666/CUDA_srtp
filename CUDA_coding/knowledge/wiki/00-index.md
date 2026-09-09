---
id: KB-INDEX
type: index
status: reviewed
confidence: high
source_ids: [SRC-001, SRC-002, SRC-003, SRC-003P, SRC-003T, SRC-004, SRC-005, SRC-006, SRC-007, SRC-008, SRC-009, SRC-010, SRC-011, SRC-012, SRC-013, SRC-014, SRC-015, SRC-016, SRC-017, SRC-018, SRC-019, SRC-020, SRC-021, SRC-022, SRC-023, SRC-024, SRC-025, SRC-026, SRC-027, SRC-028, SRC-029]
updated: 2026-09-08
---

# 编译知识库首页

本页维护技术知识导航。技术结论与论文主张以对应 Wiki 页及其证据为准；来源见 [[../raw/source-registry]]。任务状态和排程归 queue，具体缺口归 blocker，单次过程与历史快照保存在 outputs。

## 30 秒项目摘要

本项目研究 CUDA Fortran + MPI 分布式五对角求解器，涵盖缩约布局、独立数值验证和限定配置的性能实验。独立应用 demo 不代表完整 CFD 软件；研究主张的支持范围见 [[paper/claim-evidence-matrix]]。

普通编码从 [[briefs/penta-active-context]] 开始。历史项目摘要见 [[briefs/current-project-brief|2026-08-20 项目压缩上下文快照]]。

## 任务状态与门禁入口

- 实时状态、执行顺序及授权：[[../meta/task-queue]] 中的一项任务。
- 具体缺口、责任方与解除证据：[[../meta/task-blocker-register]] 对应条目。
- 候选版本验证：[[testing/source-change-validation-sop]]、[[testing/test-matrix]]。
- 本页不维护作业状态、当前任务清单或历史 Gate 通过集合；已有回执由上述任务入口索引。

## 活动开发（默认读取）

- 五对角活动 brief：[[briefs/penta-active-context]]
- 软件任务队列：[[../meta/task-queue]]
- 软件优先流程历史设计（实时顺序与模型以 queue 为准）：[[../outputs/plans/20260826-software-first-performance-roadmap]]
- 冻结后优化顺序设计（历史批准记录，执行顺序以 queue 为准）：[[../outputs/plans/20260904-pre-paper-multigpu-optimization-sequence-design]]
- SRC-029李洋五对角CUDA交付包接收审计（donor/reference，非性能证据）：[[../outputs/reviews/SRC-029-20260904-penta-delivery-intake]]
- 数据所有权：[[systems/data-ownership-and-lifetime]]
- 六阶段执行：[[methods/six-stage-penta-flow]]
- 数据布局：[[methods/penta-data-layout]]
- 测试矩阵：[[testing/test-matrix]]
- 源码变更验证 SOP（候选版本验收必读）：[[testing/source-change-validation-sop]]
- 运行指令手册：[[../../程序正确性与性能运行手册]]

## 按需专题

- 路线决策：[[decisions/ADR-001-优化现有五对角实现]]
- 红队 Gate 决策：[[decisions/ADR-003-红队评审后的Gate重构]]
- 历史基线：[[experiments/EXP-000-现有基线盘点]]
- TASK-023直接通信诊断：[[experiments/EXP-003-TASK-023-direct-communication-diagnostics]]
- TASK-025 per-call pinned完整成本：[[experiments/EXP-004-TASK-025-per-call-pinned-staging]]
- 模块依赖：[[systems/module-dependency-map]]
- 构建环境与 TASK-031 脚本/预检防错（SRC-028，非 GPU 验收）：[[systems/build-and-runtime-map]]
- HPC/MPI/Slurm 新手术语：[[systems/hpc-mpi-slurm-glossary]]
- 28→22 候选映射：[[methods/28-to-22-slot-map]]
- 一般带宽：[[methods/general-m-reduction]]
- 索引宽度：[[methods/index-width-contract]]
- 索引上界验证：[[experiments/EXP-002-index-bound-preflight]]
- benchmark 协议：[[performance/benchmark-protocol]]
- 28/22 槽容量模型：[[performance/penta-memory-model]]
- 硬件矩阵：[[performance/hardware-matrix]]
- 论文主张：[[paper/claim-evidence-matrix]]
- 三对角参考基线：[[reference/tridiagonal-baseline]]
- 三→五迁移边界：[[reference/pascal-tdma-2.1-to-penta-transfer]]
- 相邻 TDMA/ADI 优化迁移矩阵：[[reference/adjacent-tdma-optimization-transfer-to-penta]]
- 上游 diff 与贡献边界：[[reference/upstream-diff-and-contribution-boundary]]
- 新颖性与外部 comparator：[[reference/novelty-and-external-comparator]]
- comparator 决策：[[decisions/ADR-004-外部Comparator与新颖性措辞]]
- persistent staging 决策及TASK-025触发的重开边界：[[decisions/ADR-005-TASK-007不实施persistent-host-staging]]
- overlap Gate 决策：[[decisions/ADR-006-TASK-020暂不实施overlap]]
- 独立 Poisson/Helmholtz demo 决策：[[decisions/ADR-007-TASK-010独立Poisson-Helmholtz制造解demo]]

- 后期精简软件 release 计划：[[../outputs/plans/TASK-032-20260826-minimal-software-release]]（历史计划，执行条件以 queue 为准，不授予公开发布权限）

## 知识库维护

- 知识维护 skill（按需，不是编码必读）：[[../outputs/validation/KB-SKILL-001-20260826-penta-knowledge-maintainer/README]]
- 稀缺远端提交前真实产物预检 skill（按需，不是 GPU 验收）：[[../outputs/validation/KB-SKILL-002-20260904-cluster-submit-preflight/README]]
- 两人团队日常入口：[[../meta/README]]
- 自生长方法：[[concepts/自生长知识库]]
- 来源—页面地图：[[maps/source-to-knowledge-map]]
- 上下文路由：[[../meta/context-routing]]
- 单任务交接协议：[[../meta/task-handoff-protocol]]
- 变更影响地图：[[../meta/change-impact-map]]
- 开放问题：[[../meta/open-questions]]
- 健康报告：[[../meta/health-report]]

## 面向 GPT 的渐进式读取

1. 普通编码直接读 [[briefs/penta-active-context]]，不必先加载完整项目 brief；
2. 从 [[../meta/task-queue]] 领取一个任务，并按 [[../meta/context-routing]] 选择最小证据包；
3. 只加载一个相关概念/ADR/实验页和目标源码片段；
4. 需要核验时再回到 `raw` 来源；
5. 任务答案先进入 `outputs/inbox`，有长期价值才编译回 wiki。

## 知识覆盖与历史

- 来源登记及承担页面：[[../raw/source-registry]]、[[maps/source-to-knowledge-map]]；编译里程碑：[[../meta/compile-log]]。
- 论文主张与性能边界：[[paper/claim-evidence-matrix]]；不从旧任务状态推断新候选已验收。
- 历史编译规划承接：collective 缺陷的根因、修复与回归映射归 [[systems/data-ownership-and-lifetime]]，不再重复新建缺陷页或 ADR-002；来源/贡献及发布边界归 [[reference/upstream-diff-and-contribution-boundary]]，NOTICE/引用事项及责任方以 queue 的 TASK-002B 条目为准。原 compile-queue 保留历史；承接决定见 [KB-GOV-001](../outputs/validation/KB-GOV-001-20260908-maintenance-baseline/README.md)。
- 2026-09-08 整理前的完整首页见 [迁移快照](../outputs/validation/KB-GOV-003-20260908-active-context-navigation/wiki-00-index.snapshot.md)，原始字节与链接核对见 [KB-GOV-003](../outputs/validation/KB-GOV-003-20260908-active-context-navigation/README.md)。
