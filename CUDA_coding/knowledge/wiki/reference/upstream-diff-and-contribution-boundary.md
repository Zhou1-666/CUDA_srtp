---
id: KB-REF-UPSTREAM-DIFF-001
type: reference
status: draft
confidence: high
source_ids: [SRC-003, SRC-003P, SRC-003T, SRC-007]
compiled_at: 2026-08-17
updated: 2026-08-17
review_by: 2026-08-31
---

# 上游冻结、逐文件差异与贡献边界

## 结论

本项目的三对角核心在初始协作基线中可精确回溯到 PaScaL_TDMAcuda 历史 commit；五对角实现不在冻结上游公开树中，因而可作为相对上游的扩展，但其进入本仓库前的作者与时间尚未核验。不要把“相对上游新增”写成“从零原创”。

## 已冻结证据

- 上游公开冻结：`https://github.com/k-kiha/PaScaL_TDMAcuda.git@e637d5ecab0f08308eea83fbbb1872ead7ae07c5`；
- 三对角精确来源：`d69ae95209b69752504ebe3888721d759ae3020b:PaScaL_TDMA_cuda.f90` 与本仓库 `b97f919:CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90` 的 Git blob 都是 `0d4ade19ba8cfdcefd7c6a1e9614b8266afd391b`；
- 根 README 和三对角 example 也在该历史树中精确匹配；构建文件不是同一历史/当前路径的精确对象，故暂列为派生整合文件；
- 冻结 HEAD 未发现五对角、七对角或一般带宽实现路径。初始五对角文件及其后续 Git 增量属于本项目树相对上游的新增范围。

完整命令、文件表、提交级增量和禁止措辞见 [[../../outputs/reviews/TASK-002A-20260817-upstream-audit]]。

## 对开发与论文的约束

1. 三对角只作上游参考、共享缺陷修复和发布回归；
2. 五对角的数学、22 槽、正确性、性能与应用证据必须独立建立；
3. TASK-013 完成前禁止使用“首次”“最优”“无先例”；
4. 导师确认作者/署名前，TASK-002A 只能为 `review`，且 TASK-002B 不得解除；
5. 公开 HEAD 的 MIT 许可证是可复核的上游事实，不自动决定本仓库最终 LICENSE/NOTICE。

## 相关页面

- [[pascal-tdma-2.1-to-penta-transfer]]
- [[tridiagonal-baseline]]
- [[../paper/claim-evidence-matrix]]
- [[../../meta/task-queue]]
