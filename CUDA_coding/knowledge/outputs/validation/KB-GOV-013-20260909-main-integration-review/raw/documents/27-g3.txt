---
id: KB-MAP-001
type: map
status: draft
updated: 2026-08-17
---

# 来源—知识页面地图

| 来源 | 已编译页面 | 覆盖状态 | 下一页候选 |
| --- | --- | --- | --- |
| SRC-001 申报书 | `申报书目标与现有源码差距分析.md`、项目 brief、[[../decisions/ADR-003-红队评审后的Gate重构]] | 部分 | `requirements/scope.md`、导师确认 ADR |
| SRC-002 PaScaL 论文 | 技术审计、项目 brief、[[../reference/pascal-tdma-2.1-to-penta-transfer]]、[[../decisions/ADR-003-红队评审后的Gate重构]] | 算法与优化迁移边界已编译 | 许可/引用页、逐算法公式对照 |
| SRC-003 源码树 | 技术审计、模块/生命周期/构建、六阶段、数据布局、索引合同、测试、[[../decisions/ADR-003-红队评审后的Gate重构]] | 主要结构与工程路由已编译 | Git 版本差异 |
| SRC-003P 五对角快照 | [[../briefs/penta-active-context]]、六阶段、数据布局、生命周期、测试、[[../methods/index-width-contract]]、[[../experiments/EXP-002-index-bound-preflight]] | TASK-001/004/008 修复及目标验证已编译 | 28 槽正式 baseline 实验卡 |
| SRC-003T 三对角快照 | [[../reference/tridiagonal-baseline]] | 参考路由已编译 | 仅在共享缺陷/API/许可/发布回归时扩展 |
| SRC-004 一般带宽理论 | 主张矩阵、一般 `m`、28/22 映射、[[../experiments/EXP-001-28-to-22-layout-equivalence]]、[[../decisions/ADR-003-红队评审后的Gate重构]] | m=2 的 28→22 映射已获独立脚本证据 | 正式证明审查、文献创新性、Fortran 等价回归 |
| SRC-005 历史 CSV | EXP-000、benchmark 协议、硬件矩阵、[[../decisions/ADR-003-红队评审后的Gate重构]] | 已编译 | TASK-014 冻结 baseline 与公平外部对照 |
| SRC-006 Karpathy 原帖 | [[../concepts/自生长知识库]]、知识库指南 | 已编译 | 首次 health-check 经验页 |
| SRC-007 PaScaL_TDMAcuda 上游代码冻结 | [[../reference/upstream-diff-and-contribution-boundary]]、[[../reference/pascal-tdma-2.1-to-penta-transfer]] | 上游 HEAD、历史精确 blob 与相对新增范围已编译；署名待人工确认 | TASK-002B 的 LICENSE/NOTICE 与导师 ADR |
| SRC-008..012 并行五对角/通用带状先例 | [[../reference/novelty-and-external-comparator]]、[[../decisions/ADR-004-外部Comparator与新颖性措辞]]、主张矩阵 | 已编译为 C2 降级、C3/C4 候选边界 | 投稿前数据库更新检索、TASK-019 |
| SRC-013..015 GPU batched 五对角/带状库 | [[../reference/novelty-and-external-comparator]]、[[../performance/benchmark-protocol]]、[[../decisions/ADR-004-外部Comparator与新颖性措辞]] | cuSPARSE 必选，Ginkgo/MAGMA/cuPentBatch 可选 | TASK-014 外部 baseline 回执 |
| SRC-016 五对角 CFD 并行应用 | [[../reference/novelty-and-external-comparator]] | 已编译为应用先例与通用 solver 成本边界 | TASK-010 应用闭环对照 |

## 编译缺口优先级

1. TASK-014 正式 28 槽 baseline 与 P=1 cuSPARSE 锚点；
2. TASK-017 真实多 GPU 环境；
3. TASK-013 非原推导者签字和投稿前数据库复查；
4. TASK-002A 的导师署名确认和 TASK-002B 许可；
5. Poisson/Helmholtz 应用接口与论文图表计划。
