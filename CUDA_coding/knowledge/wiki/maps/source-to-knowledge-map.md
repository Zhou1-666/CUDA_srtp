---
id: KB-MAP-001
type: map
status: draft
updated: 2026-08-17
---

# 来源—知识页面地图

| 来源 | 已编译页面 | 覆盖状态 | 下一页候选 |
| --- | --- | --- | --- |
| SRC-001 申报书 | `申报书目标与现有源码差距分析.md`、项目 brief | 部分 | `requirements/scope.md`、导师确认 ADR |
| SRC-002 PaScaL 论文 | 技术审计、项目 brief、[[../reference/pascal-tdma-2.1-to-penta-transfer]] | 算法与优化迁移边界已编译 | 许可/引用页、逐算法公式对照 |
| SRC-003 源码树 | 技术审计、模块/生命周期/构建、六阶段、数据布局、索引合同、测试 | 主要结构与工程路由已编译 | Git 版本差异 |
| SRC-003P 五对角快照 | [[../briefs/penta-active-context]]、六阶段、数据布局、生命周期、测试、[[../methods/index-width-contract]]、[[../experiments/EXP-002-index-bound-preflight]] | TASK-001/004/008 修复及目标验证已编译 | 28 槽正式 baseline 实验卡 |
| SRC-003T 三对角快照 | [[../reference/tridiagonal-baseline]] | 参考路由已编译 | 仅在共享缺陷/API/许可/发布回归时扩展 |
| SRC-004 一般带宽理论 | 主张矩阵、一般 `m`、28/22 映射、[[../experiments/EXP-001-28-to-22-layout-equivalence]] | m=2 的 28→22 映射已获独立脚本证据 | 正式证明审查、文献创新性、Fortran 等价回归 |
| SRC-005 历史 CSV | EXP-000、benchmark 协议、硬件矩阵 | 已编译 | 图表计划、P0 后新 baseline |
| SRC-006 Karpathy 原帖 | [[../concepts/自生长知识库]]、知识库指南 | 已编译 | 首次 health-check 经验页 |

## 编译缺口优先级

1. `上游来源、许可和贡献边界`；
2. P0 修复后的正式 28 槽 baseline 实验页；
3. Poisson/Helmholtz 应用接口页；
4. 论文图表计划。
