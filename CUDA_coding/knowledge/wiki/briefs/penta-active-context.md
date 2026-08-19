---
id: KB-BRIEF-PENTA
type: brief
status: reviewed
scope: active
updated: 2026-08-17
confidence: high
source_ids: [SRC-003P, SRC-004, SRC-005, SRC-007, SRC-014]
---

# 五对角活动上下文

这是普通编码任务的默认入口。除非任务明确触发参考条件，AI 只处理五对角实现，不加载三对角源码、整篇论文或全量知识库。

开发边界：三对角程序冻结为参考基线，不开展新功能、性能优化或独立研究；只有共享缺陷、构建/API 兼容、上游核验和发布回归可以修改。软件成果、性能实验和论文贡献全部以五对角扩展为主线。

## 当前目标

在两个月内形成可重建、可验证、可测量的 CUDA Fortran + MPI 五对角求解器研究版本，并完成 28→22 通信裁剪、真实多 GPU 实验、最小应用集成和论文。

## 默认活动文件

- 主实现：`CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`
- 最小示例：`CUDA_code/源代码/examples/ex_tdma_penta_zdirection.f90`
- 独立验证：`verify/penta_indep_check.js`、`verify/penta_comm_28_verify.js`、`verify/penta_comm_22_verify.js`、`verify/penta_index_bounds_verify.js`
- 性能入口：`perf_bench/benchmark_penta.f90`
- 任务队列：[[../../meta/task-queue]]
- 测试矩阵：[[../testing/test-matrix]]
- 命令手册：[[../../../程序正确性与性能运行手册]]
- 上游谱系摘要：[[../reference/pascal-tdma-2.1-to-penta-transfer]]（算法、优化或论文任务时读取）

## TASK-001 已通过

三/五对角无效 `MPI_WAITALL` 已删除并加入 `MPI_ALLTOALLV` 返回码失败中止；WSL2 + NVHPC 24.11 + OpenMPI 4.1.5 的干净构建及 `np=1/2` 回归已通过。证据见 `knowledge/outputs/validation/TASK-001-20260817-wsl-nvhpc24.11/`。单 GPU 双 rank 只支持通信正确性，不支持多 GPU扩展性结论。

## TASK-004 已通过

五对角 plan/API 现会拒绝非法 `Nsys/Nrow`、空分区、线程数、communicator/rank/size 和生命周期调用，并检查分配、MPI 返回码、CUDA launch 及原有同步返回码。14 个 API 正反用例、干净构建、`np=1/2` 示例和 profiled smoke 已通过；证据见 `knowledge/outputs/validation/TASK-004-20260817-wsl-nvhpc24.11/`。尺寸乘法溢出和数值主元失败不在本任务范围。

## TASK-005 已通过（仅独立布局层）

`penta_comm_22_verify.js` 已证明合法 28 槽数据可按固定映射压缩为 22 槽，并逐槽恢复相同的 28 槽与 32 槽 `Atr`。180 组平衡/不均匀多 rank 配置和 28 个故障注入通过。Fortran 仍只有 28 槽路径，因此不得把该结果写成软件优化或性能收益。

## TASK-008 已通过

五对角 plan/solver 在 setup 层使用 64 位临时量检查 32 位工作区、矩阵扁平偏移和 MPI count/displacement。超过上限的输入会在分配或 kernel 启动前终止；CUDA 热循环保持 32 位。setup-only 边界脚本、16 个 API 用例、NVHPC 干净构建、`np=1/2` 和 profiled smoke 已通过。

## 红队修订后的当前 Gate

TASK-002A 已冻结上游公开 HEAD `e637d5e` 和三对角精确历史对象 `d69ae95`，但初始五对角署名仍待导师确认。TASK-013 已完成技术检索并把一般 `m` 降级为方法背景，保留 28→22 为限定布局候选贡献；P=1 必选 cuSPARSE 外部 baseline，详见 [[../reference/novelty-and-external-comparator]]。因非原推导者尚未签字，TASK-013 仍为 `review`。TASK-014 已完成 `mpifort` debug/release 重建、np=1/2 正确性和五次单 GPU 内部计时，现仅缺 P=1 cuSPARSE 外部 baseline；该缺口由 `TASK-022` 独立处理。TASK-006 仍缺 TASK-014 关闭及 G0 人工项。TASK-017 必须提前确认真实多 GPU 环境。

当前最小解除阻塞动作是按 TASK-022 合同核验 cuSPARSE P=1 外部 baseline 的 API 与数据布局；不得悄悄开始 TASK-006。所有非 `done` 任务的具体缺口、完成判据、责任方和首个动作以 [[../../meta/task-blocker-register]] 为准；`task-queue.md` 只保留快速摘要与排序。

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
| 来源/新颖性 | [[../reference/pascal-tdma-2.1-to-penta-transfer]]、[[../paper/claim-evidence-matrix]] | upstream diff、检索矩阵、外部 comparator 决策 |
| 数值稳定性 | [[../testing/test-matrix]] | 病态矩阵族、残差/前向误差、失败合同 |
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

- 当前五对角 API 要求 `Nrow >= 5`、`Nsys >= nprocs >= 1`；不支持空分区；
- 当前所有扁平索引和传统 `MPI_Alltoallv` 描述符必须能由默认 32 位整数表示；不提供 64 位 kernel 或 MPI 大计数路径；
- `RHS` 和部分系数会被原位覆盖，调用方必须明确所有权；
- 28→22 是当前理论支持的目标，不是 28→18；
- 单 GPU 多 rank 不能证明多 GPU扩展性；
- 没有独立真值不得声称正确，没有同精度实测不得声称更快。
