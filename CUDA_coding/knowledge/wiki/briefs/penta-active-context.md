---
id: KB-BRIEF-PENTA
type: brief
status: reviewed
scope: active
updated: 2026-08-17
confidence: high
source_ids: [SRC-003P, SRC-004, SRC-005]
---

# 五对角活动上下文

这是普通编码任务的默认入口。除非任务明确触发参考条件，AI 只处理五对角实现，不加载三对角源码、整篇论文或全量知识库。

开发边界：三对角程序冻结为参考基线，不开展新功能、性能优化或独立研究；只有共享缺陷、构建/API 兼容、上游核验和发布回归可以修改。软件成果、性能实验和论文贡献全部以五对角扩展为主线。

## 当前目标

在两个月内形成可重建、可验证、可测量的 CUDA Fortran + MPI 五对角求解器研究版本，并完成 28→22 通信裁剪、真实多 GPU 实验、最小应用集成和论文。

## 默认活动文件

- 主实现：`CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`
- 最小示例：`CUDA_code/源代码/examples/ex_tdma_penta_zdirection.f90`
- 独立验证：`verify/penta_indep_check.js`、`verify/penta_comm_28_verify.js`
- 性能入口：`perf_bench/benchmark_penta.f90`
- 任务队列：[[../../meta/task-queue]]
- 测试矩阵：[[../testing/test-matrix]]
- 命令手册：[[../../../程序正确性与性能运行手册]]
- 上游谱系摘要：[[../reference/pascal-tdma-2.1-to-penta-transfer]]（算法、优化或论文任务时读取）

## TASK-001 已通过

三/五对角无效 `MPI_WAITALL` 已删除并加入 `MPI_ALLTOALLV` 返回码失败中止；WSL2 + NVHPC 24.11 + OpenMPI 4.1.5 的干净构建及 `np=1/2` 回归已通过。证据见 `knowledge/outputs/validation/TASK-001-20260817-wsl-nvhpc24.11/`。单 GPU 双 rank 只支持通信正确性，不支持多 GPU扩展性结论。

## 每个任务的最小读取包

1. 根目录 `AGENTS.md`；
2. 本页；
3. [[../../meta/task-queue]] 中的一项任务；
4. 一张与任务直接相关的方法/测试/性能页；
5. 目标函数附近的源码片段，而不是整份源码；
6. 对应验证脚本或测试入口。

## 按任务路由

| 任务 | 增量上下文 | 主要代码/验证 |
| --- | --- | --- |
| P0 MPI 生命周期 | [[../systems/data-ownership-and-lifetime]]、[[../testing/test-matrix]] | `pascal_a2av` 附近、penta 示例、多 rank debug |
| 28→22 裁剪 | [[../methods/28-to-22-slot-map]]、[[../methods/penta-data-layout]] | 两个 penta JS 检查、新增 22 槽等价检查 |
| 索引与大规模 | [[../methods/index-width-contract]] | 设置阶段乘法、偏移、边界规模测试 |
| 性能优化 | [[../performance/benchmark-protocol]]、[[../performance/hardware-matrix]] | quick benchmark、冻结 CSV、阶段计时 |
| 一般带宽研究 | [[../methods/general-m-reduction]] | `mband_general.js`、`mband_recurrence.js` |
| 论文写作 | [[../paper/claim-evidence-matrix]] | 只使用“已支持”主张和已归档实验 |

## 默认不读取

- `src/PaScaL_TDMA_cuda.f90` 三对角源码；
- 完整 PaScaL_TDMA 论文 PDF（必须保留；先读迁移摘要，需核对原始细节时再读相关章节）；
- 全量 Wiki、完整两月计划、历史长报告；
- 七对角和一般 `m` 材料，除非任务确实涉及推广；
- 与当前函数无关的整个千行 Fortran 文件。

文件留在仓库不会自动消耗模型 token；只有被读入上下文的内容才产生主要开销。因此采用路由和摘要，不以删除证据换取 token。

## 何时允许读取三对角

出现以下任一条件时，加载 [[../reference/tridiagonal-baseline]]；算法/优化任务优先加载迁移摘要，只有代码比较需要时才读三对角源码片段：

- 排查五对角与上游共同的 MPI/CUDA 缺陷；
- 核对公共 API、构建目标或回归兼容性；
- 确认上游行为、版权、许可证或贡献边界；
- 推导五对角扩展、设计寄存器/通信优化或撰写相关工作；
- 发布前需要运行三对角回归；
- 有明确假设需要做最小差分比较。

## 不变量

- 当前五对角分布式路径要求 `Nrow >= 5`；
- `RHS` 和部分系数会被原位覆盖，调用方必须明确所有权；
- 28→22 是当前理论支持的目标，不是 28→18；
- 单 GPU 多 rank 不能证明多 GPU扩展性；
- 没有独立真值不得声称正确，没有同精度实测不得声称更快。
