---
id: KB-REF-TRI-001
type: reference
status: reviewed
scope: reference-only
updated: 2026-08-17
confidence: high
source_ids: [SRC-002, SRC-003T]
---

# 三对角上游基线（必须保留、按任务读取）

三对角实现冻结为参考基线，不开展新功能、性能优化或独立研究；只有共享缺陷修复、构建/API 兼容、上游行为核验和发布回归可以修改。它仍是五对角扩展的算法谱系、上游证据和兼容性对照，不能删除或从知识库导航中隐去。

## 保留原因

- 五对角实现由 PaScaL_TDMA 2.1 基线扩展而来，需要保留来源和贡献边界；
- 当前构建产物同时包含三对角与五对角目标；
- 两个实现曾存在共同的 `MPI_ALLTOALLV`/`MPI_WAITALL` 生命周期问题；TASK-001 已完成代码修复，仍待目标环境共同回归；
- 发布前需要验证公共 API、构建和基础回归没有被意外破坏。
- 论文中的局部缩约、边界接口系统、寄存器驻留、聚合通信和实验设计是五对角研究的重要参考。

## 读取触发器

算法推广或论文写作先读 [[pascal-tdma-2.1-to-penta-transfer]]；需要核对原始算法、优化参数或引用时再读论文相关章节。只有共享缺陷差分、API/构建兼容、上游行为核验或发布回归才读三对角源码片段。

## 稳定定位

- 文件：`CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90`
- SHA-256：`52EC9286488980F8137F914DA31EF93BF5CA12A93BFBE248666C3ED60FC91AF0`
- 活动五对角入口：[[../briefs/penta-active-context]]
- 三→五迁移边界：[[pascal-tdma-2.1-to-penta-transfer]]

该哈希只是 2026-08-17 的工作区快照，不替代 Git commit、上游 tag 或正式发布校验值。
