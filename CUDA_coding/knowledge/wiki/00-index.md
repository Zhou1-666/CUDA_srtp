---
id: KB-INDEX
type: index
status: reviewed
updated: 2026-08-17
---

# 编译知识库首页

这是供人和 GPT 读取的规范 Wiki。事实来源在 [[../raw/source-registry]]；生成过程和健康状态在 `meta/`；一次性回答在 `outputs/`。

## 30 秒项目摘要

当前仓库的活动核心是 CUDA Fortran + MPI 分布式五对角求解器，而不是完整 CFD 软件。两个月主线是先修复 MPI/复现基线，再把五对角前向缩约数据从每线 28 个 double 裁剪为 22 个，补真实多 GPU 证据和 Poisson/Helmholtz 集成验证。

普通编码默认入口：[[briefs/penta-active-context]]。完整项目管理摘要：[[briefs/current-project-brief]]。

## 当前 Gate

- Gate：红队修订后的 G0-A——贡献边界、新颖性/外部基线和冻结 28 槽 baseline；
- 已通过：TASK-001 的干净构建和 `np=1/2` 三、五对角回归；TASK-004 的五对角 API 防护；TASK-005 的 28→22 独立布局等价验证；TASK-008 的 32 位索引/尺寸上界预检与 16 用例；
- 阻断：TASK-002A 等待导师确认初始文件署名；TASK-013 技术检索完成、等待非原推导者签字；TASK-014 已通过 debug 构建但尚缺正确性、release 计时与 cuSPARSE adapter，TASK-006 因此不是当前可领取任务；TASK-002B 阻塞公开发布/投稿；真实多 GPU 环境需由 TASK-017 提前核验。

## 活动开发（默认读取）

- 五对角活动 brief：[[briefs/penta-active-context]]
- 软件任务队列：[[../meta/task-queue]]
- 数据所有权：[[systems/data-ownership-and-lifetime]]
- 六阶段执行：[[methods/six-stage-penta-flow]]
- 数据布局：[[methods/penta-data-layout]]
- 测试矩阵：[[testing/test-matrix]]
- 运行指令手册：[[../../程序正确性与性能运行手册]]

## 按需专题

- 路线决策：[[decisions/ADR-001-优化现有五对角实现]]
- 红队 Gate 决策：[[decisions/ADR-003-红队评审后的Gate重构]]
- 历史基线：[[experiments/EXP-000-现有基线盘点]]
- 模块依赖：[[systems/module-dependency-map]]
- 构建环境：[[systems/build-and-runtime-map]]
- 28→22 候选映射：[[methods/28-to-22-slot-map]]
- 一般带宽：[[methods/general-m-reduction]]
- 索引宽度：[[methods/index-width-contract]]
- 索引上界验证：[[experiments/EXP-002-index-bound-preflight]]
- benchmark 协议：[[performance/benchmark-protocol]]
- 硬件矩阵：[[performance/hardware-matrix]]
- 论文主张：[[paper/claim-evidence-matrix]]
- 三对角参考基线：[[reference/tridiagonal-baseline]]
- 三→五迁移边界：[[reference/pascal-tdma-2.1-to-penta-transfer]]
- 上游 diff 与贡献边界：[[reference/upstream-diff-and-contribution-boundary]]
- 新颖性与外部 comparator：[[reference/novelty-and-external-comparator]]
- comparator 决策：[[decisions/ADR-004-外部Comparator与新颖性措辞]]

## 知识库维护

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

## 当前编译状态

- 来源登记：18 项（新增并行五对角、SPIKE/ScaLAPACK、cuSPARSE/cuPentBatch/Ginkgo 与 CFD 应用先例）；
- 已编译：项目 brief、路线、基线、主张、模块/生命周期/构建、S1–S6、数据布局、28→22、一般 `m`、索引合同、测试和性能协议；
- 当前最小解除动作：在恢复的 WSL/HPC 运行 TASK-014 基线执行器；TASK-017 可在集群可用时推进，但不得越过 Gate 直接领取 TASK-006；
- 仍待来源：导师对初始文件署名的确认、LICENSE/NOTICE、真实集群环境、CFD/FFT 主程序；
- 仍待知识页：P0 collective 专题缺陷页与 ADR-002、上游许可/发布边界。
