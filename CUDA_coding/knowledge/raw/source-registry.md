# 原始资料登记表

> 这是知识库的来源账本。Wiki 页面使用 `source_ids` 引用这里的记录。

| ID | 类型 | 名称 | 位置/URL | SHA-256 | 隐私 | 编译状态 |
| --- | --- | --- | --- | --- | --- | --- |
| SRC-001 | proposal | SRTP 项目申报书 | `C:/Users/30575/Desktop/cfd.md` | `F4BE8A4D6D6873C78C68D9459A2CB1D50D9FD6738C04B8015DDC298E882E6397` | private，含个人信息 | 已部分编译 |
| SRC-002 | paper | PaScaL_TDMA 2.1 CPC 论文 | `CUDA_code/源代码/[2026][CPC]PaScaL_TDMA 2.1 ... .pdf` | `950454A141CDA7C87C6D2E82D15D665CC869E26698E28A57DF89C06E16E9C646` | internal | 已编译三→五迁移边界；许可仍需代码级核验 |
| SRC-003 | repo | 当前 CUDA Fortran/MPI 源码树 | `CUDA_code/源代码/` | Git `b97f919`（2026-08-17 初始协作基线） | internal | 已审计，持续编译 |
| SRC-003P | source | 五对角活动实现快照 | `CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` | `6012950A0E7F94C843146EB11E223901B7A4E7E86ED13387DECA42CAD4B0A0E3` | internal | TASK-002A：导师苏运德 2026-08-20 确认导入前初始五对角由李洋在团队三对角基线基础上借助 AI 工具扩展形成；TASK-001/004/008/015 已完成目标验证 |
| SRC-003T | source | 三对角上游参考快照 | `CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90` | `52EC9286488980F8137F914DA31EF93BF5CA12A93BFBE248666C3ED60FC91AF0` | internal | TASK-001 已完成代码编译与目标验证 |
| SRC-004 | theory | 一般带宽理论与验证说明 | `CUDA_code/源代码/verify/mband_theory.md` | `346B7BA6BF95A00F09EC8F814BB99F5E72EAEC3E929A1D53663E316D6BEBB0AD` | internal | 已编译 |
| SRC-005 | dataset | 历史五对角性能 CSV | `CUDA_code/源代码/perf_bench/260810_161948_penta_perf.csv` | `EB424AC616128E29FDEE578CECF1B6D2ABF26AD4D4F6A4DE8D4E0A100CDC25AB` | internal | 已编译 |
| SRC-006 | web | Karpathy：LLM Knowledge Bases | `https://x.com/karpathy/status/2039805659525644595` | 网页，2026-08-17 核验 | public | 已编译 |
| SRC-007 | repo | PaScaL_TDMAcuda 上游代码冻结 | `https://github.com/k-kiha/PaScaL_TDMAcuda.git`，commit `e637d5ecab0f08308eea83fbbb1872ead7ae07c5`（2026-07-27） | Git object；另以历史 commit `d69ae95209b69752504ebe3888721d759ae3020b` 对照导入快照 | public | TASK-002A 已编译；公开 HEAD 的 `LICENSE` 为 MIT（Copyright 2025 Ki-Ha Kim），本仓库衍生许可仍待 TASK-002B 人工核验 |
| SRC-008 | paper | Levit：Parallel solution of pentadiagonal systems using generalized odd-even elimination | `https://doi.org/10.1145/76263.76299` | DOI；1989 | public metadata | TASK-013 已编译；证明并行五对角消元不是新概念 |
| SRC-009 | report | Ivanov & Walshaw：A parallel method for solving pentadiagonal systems of linear equations | `https://gala.gre.ac.uk/id/eprint/197/` | 机构库记录；1998 | public metadata | TASK-013 已编译；已有缩约五对角系统与通信启动优化 |
| SRC-010 | software-doc | ScaLAPACK `PDGBSV` 分布式通用带状求解器 | `https://www.netlib.org/scalapack/explore-html/d0/d92/pdgbsv_8f_ad02ab117cb1e037734dd95d980eed397.html` | Netlib 文档；2026-08-17 核验 | public | TASK-013 已编译；条件式分布式 CPU comparator |
| SRC-011 | paper/software | SPIKE 通用窄带并行缩约方法 | `https://doi.org/10.1016/j.parco.2005.07.005`；`https://arxiv.org/abs/1811.03559` | DOI/arXiv；2006/2018 | public metadata/full text | TASK-013 已编译；一般半带宽接口缩约存在明确先例 |
| SRC-012 | paper | Kim：Quasi-disjoint pentadiagonal matrix systems | `https://doi.org/10.1016/j.jcp.2013.01.046` | DOI/作者稿；2013 | public metadata/author copy | TASK-013 已编译；MPI 域分解五对角应用先例 |
| SRC-013 | paper | cuPentBatch：A batched pentadiagonal solver for NVIDIA GPUs | `https://arxiv.org/abs/1807.07382` | arXiv；2018/2019 | public | TASK-013 已编译；单 GPU 批量五对角先例 |
| SRC-014 | software-doc/sample | NVIDIA cuSPARSE `gpsvInterleavedBatch` | `https://docs.nvidia.com/cuda/cusparse/index.html#gpsv-interleaved-batch`；`https://github.com/NVIDIA/CUDALibrarySamples/tree/main/cuSPARSE/gpsvInterleavedBatch` | 在线文档与官方样例；2026-08-19 核验 | public；样例 Apache-2.0（本项目 adapter 独立编写） | TASK-013 已编译；TASK-022 已核验 QR、边界零项、交错布局、workspace 与原位覆盖合同 |
| SRC-015 | paper/software | Ginkgo GPU batched band solvers | `https://doi.org/10.1177/10943420251347460`；`https://github.com/ginkgo-project/ginkgo` | DOI/repo；2025 | public | TASK-013 已编译；可选单 GPU通用带状 comparator |
| SRC-016 | paper | Bienner et al.：Multiblock parallel high-order implicit residual smoothing | `https://research.tudelft.nl/files/222770835/1-s2.0-S0045793023003638-main.pdf` | 作者稿；2024 | public | TASK-013 已编译；给出 ScaLAPACK/SPIKE/PaScaL 用于五对角 CFD 的适用性证据 |
| SRC-017 | poster | Jackson & Zubair：Improvements to a Batch Pentadiagonal Solver on NVIDIA GPUs | `https://ntrs.nasa.gov/citations/20210009602` | NASA NTRS 官方页面/PDF；2026-08-20 核验 | public | TASK-013 补充先例；单 V100 上共享 LHS 与 pentadiagonal PCR，对比 cuSPARSE；不是多 GPU comparator |
| SRC-018 | presentation | Balogh & Reguly：Pentadsolver, a scalable batch-pentadiagonal solver library for ADI applications | `https://indico.wigner.hu/event/1482/contributions/3471/` | GPU Day 2023 官方页面/PDF；2026-08-20 核验 | public | TASK-013 关键补充先例；Thomas-Jacobi/Thomas-PCR 分布式缩约，在 LUMI 展示最高 1024 GPU；公开可运行代码与同输入复现性尚未确认 |

## 状态定义

- `待编译`：未生成任何 wiki 页面；
- `已部分编译`：已有页面，但来源覆盖检查未完成；
- `已编译`：相关页面、反向链接和索引已更新；
- `需重编译`：来源版本或哈希改变；
- `忽略`：已记录但确认不进入本项目知识域。

## 新来源登记模板

```text
ID：SRC-XXX
类型：
名称：
作者/机构：
稳定位置：
SHA-256/抓取日期：
隐私：public / internal / private
许可/引用：
希望支持的问题：
编译状态：待编译
```
