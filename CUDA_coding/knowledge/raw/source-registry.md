# 原始资料登记表

> 这是知识库的来源账本。Wiki 页面使用 `source_ids` 引用这里的记录。

| ID | 类型 | 名称 | 位置/URL | SHA-256 | 隐私 | 编译状态 |
| --- | --- | --- | --- | --- | --- | --- |
| SRC-001 | proposal | SRTP 项目申报书 | `C:/Users/30575/Desktop/cfd.md` | `F4BE8A4D6D6873C78C68D9459A2CB1D50D9FD6738C04B8015DDC298E882E6397` | private，含个人信息 | 已部分编译 |
| SRC-002 | paper | PaScaL_TDMA 2.1 CPC 论文 | `CUDA_code/源代码/[2026][CPC]PaScaL_TDMA 2.1 ... .pdf` | `950454A141CDA7C87C6D2E82D15D665CC869E26698E28A57DF89C06E16E9C646` | internal | 已编译三→五迁移边界；许可仍需代码级核验 |
| SRC-003 | repo | 当前 CUDA Fortran/MPI 源码树 | `CUDA_code/源代码/` | Git `b97f919`（2026-08-17 初始协作基线） | internal | 已审计，持续编译 |
| SRC-003P | source | 五对角活动实现快照 | `CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` | `6012950A0E7F94C843146EB11E223901B7A4E7E86ED13387DECA42CAD4B0A0E3` | internal | 该哈希保留为既有冻结快照；2026-08-27 本地主树/任务树候选仅新增署名注释后的哈希分别为 `9FE8A4DF...F1F768` / `4E12F11E...FE79EE`。TASK-002A：导师苏运德 2026-08-20 确认导入前初始五对角由李洋在团队三对角基线基础上借助 AI 工具扩展形成；用户 2026-08-27 补充扩展开发者为李洋和周一涵，公开共同署名待 TASK-002B 复核；TASK-001/004/008/015 已完成目标验证 |
| SRC-003T | source | 三对角上游参考快照 | `CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90` | `52EC9286488980F8137F914DA31EF93BF5CA12A93BFBE248666C3ED60FC91AF0` | internal | TASK-001 已完成代码编译与目标验证 |
| SRC-004 | theory | 一般带宽理论与验证说明 | `CUDA_code/源代码/verify/mband_theory.md` | `54E8007D9B093DDAE5B85113DD802C77155FB209FE37801BF2F75BA7D700A6F8` | internal | TASK-019 模型审阅已修正适用条件、递推下标和固定布局计数边界；待非原推导者签字 |
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
| SRC-019 | paper | Ha, Park & You：A multi-GPU method for ADI-based fractional-step integration of incompressible Navier-Stokes equations | `knowledge/raw/papers/SRC-019-2021-ha-multigpu-adi.md`；DOI `10.1016/j.cpc.2021.107999` | `EDD1289AAD2B7EC8CE4DB5BCE7F24DB1AC0C334A0B7D233452BC6640FAEBEB56` | internal；论文标注 ©2021 Elsevier | 已编译为相邻 TDMA/ADI 优化迁移参考；不是五对角正确性或性能证据 |
| SRC-020 | paper/preprint | Kim et al.：A Highly Scalable TDMA for GPUs and Its Application to Flow Solver Optimization | `knowledge/raw/papers/SRC-020-2025-kim-pipelined-tdma.md`；arXiv `2509.03339v1` | `034FEBF72A77834944DE0CEC3A0F90175582025E5D3BE535E09F89A98034ECAD` | internal copy；arXiv 再分发许可未在副本中确认 | 已编译为关键路径、流水线、batch 与 overlap Gate 参考；不得外推论文 64 GPU 结果 |
| SRC-021 | paper | Akkurt et al.：A distributed-memory tridiagonal solver based on a specialised data structure optimised for CPU and GPU architectures | `knowledge/raw/papers/SRC-021-2025-akkurt-distd2-tds.md`；DOI `10.1016/j.cpc.2025.109747` | `AF7E6ABB275F94159BDCFDD81870E22CF88D8C4216D033B84F4722F2CBB4D33F` | public，CC BY 4.0 | 已编译为交错布局、系数预处理、kernel fusion 与带宽模型参考；三对角 `2×2` 缩约不可直接迁移 |
| SRC-022 | software-doc | SchedMD Slurm 官方 Overview、`sbatch`、`srun` 与 GRES 文档 | `https://slurm.schedmd.com/overview.html`；`sbatch.html`；`srun.html`；`gres.html` | 官方网页；2026-08-24 核验 | public | 已编译为 HPC/MPI/Slurm 新手术语和 TASK-009 启动分层参考；站点策略仍以实际集群为准 |
| SRC-023 | software-doc | Open MPI 官方 `mpirun` 与 Slurm 启动文档 | `https://www.open-mpi.org/doc/v4.1/man1/mpirun.1.php`；`https://docs.open-mpi.org/en/v5.0.7/launching-apps/slurm.html` | 官方网页；2026-08-24 核验 | public | 已编译为 rank、slot、mapping/binding 和 Slurm 启动关系；版本差异必须以目标环境 `ompi_info`/手册核验 |
| SRC-024 | experiment/source | TASK-010 job1454628 完整制造解运行与源码证据包 | `knowledge/outputs/validation/TASK-010-20260826-paraai-a100-job1454628/archive/TASK-010-1454628-evidence-gq9ZN9dE.tar.gz`；同目录 raw/source 与 SHA256SUMS.txt | `9bc515c598d30e212f8789f1018e55fb381390c703389ba027cd3dec359cf8bf`；2026-08-26 本地核验 | internal；不新增公开再分发授权 | 56/56 文件、11/11 源码及32例通过；已编译到ADR-007、测试/主张矩阵和TASK-010关闭回执；仅冻结demo |
| SRC-025 | experiment/source | TASK-023 job1457454 正式单节点双A100诊断证据包 | `knowledge/outputs/validation/TASK-023-20260827-formal-validation-v2/raw/TASK-023-1457454-formal-v2-evidence-v1.tar.gz` | `69c18f004910093fc112917fdab8a0ee91f4cb0a3c152364a4b28645fa8180a2`；1293339字节；2026-08-27本地核验，2026-08-29登记 | internal；不新增公开再分发授权 | 已编译为EXP-003；仅支持单节点双A100、P=1/2、FP64、host staging/TCP、固定规模的诊断与正式对照 |
| SRC-026 | experiment/source | TASK-025 job1459808 per-call pageable/pinned 正式A/B证据包 | `knowledge/outputs/validation/TASK-025-20260828-local-implementation/raw/TASK-025-1459808-pinned-formal-v2-evidence-v1.tar.gz` | `67dadd09a5f8068e1b98f51d00094bf7fac1778faa696947137b34886d9a3d5a`；1820153字节；2026-08-28本地核验，2026-08-29登记 | internal；不新增公开再分发授权 | 已编译为EXP-004；当前per-call pinned候选为do-not-adopt，不支持persistent实现必然加速 |
| SRC-027 | experiment/source | TASK-007 job1463264 standalone pinned-component A100运行证据包 | `knowledge/outputs/validation/TASK-007-20260829-pinned-component-probe/raw/TASK-007-1463264-pinned-component-gpu-v1-evidence-v1.tar.gz` | `5903ef61f2bb90fcb36e02dee598c6f9df3cb2e30528840770716e23413f2e20`；15793字节；2026-08-29本地核验/登记 | internal；不新增公开再分发授权 | 已编译到TASK-007回执/队列/阻塞；仅证明NVFortran24.5-1在单张A100上该derived-type component取得pinned分配并正常释放，不证明solver复用或性能 |
| SRC-028 | diagnostic/source | TASK-031 脚本预检与构建参数失败取证（非完整验收） | `knowledge/outputs/validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/` 中清单错名、实际构建、job1474105依赖停止三份原始回贴；[精确文件与核验索引](../outputs/validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260903-wiki-script-preflight-lessons.md) | 依次为 `e68e5b936bfc6d215ca8c3d9143088f3b0008a28ab95ad698db338d3a987a1d9` / `45e829088055257402e04b8afe4fa039e82bed8b1402fbbf01913fbde0fbe1a1` / `483f6abbcc4a1822845dd93b884ffeb51cfaf3483287196b1469acef1d23dd50`；2026-09-03本地复核 | private，含账号/节点/绝对路径；不新增公开再分发授权 | 已编译到构建与运行环境地图的防错草稿；仅支持脚本/取证边界，不证明v5附着根因或GPU验收通过 |
| SRC-029 | source/package | 用户识别为同事李洋的五对角 CUDA 交付包（2026-09-01） | `C:/Users/30575/Downloads/penta_delivery_20260901.tar.gz`；[接收审计](../outputs/reviews/SRC-029-20260904-penta-delivery-intake.md) | archive `BF32A311041E1ABE25E8B17D0777984D3049C974E602D7005F9EEE492EEA7117`，42849 bytes；包内 solver `186FE9BC3EE87008D4BC73ECBA06E80D964738B185837AF7095E52461BC21EA3`；2026-09-04只读核验 | private/internal；作者归属为用户提供说明，未独立核验；不推断公开再分发权 | 已部分编译为冻结后 donor 审计来源；README 自报 jobs/性能未获原始日志核验，不是正确性或性能证据 |
| SRC-030 | experiment/source | TASK-031 job1475788 agent-28单rank Compute Sanitizer终态回查 | `knowledge/outputs/validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-job1475788-terminal-readback-user-transcript-normalized-lf.txt`；[终态分析](../outputs/validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475788-terminal-analysis.txt) | 原附件29877 bytes / `9ED863CD9EBEE24405ABB9BFB6C5E7B052B7BA6EE8A949E687A9CB5CC2FEC740`；LF规范化副本29388 bytes / `9BC0BDEA1E9D3855DCB686A8D439B1D44FDB541D1053AD54B6BFA4EAD3E74B2E`；2026-09-04本地核验 | private，含账号/节点/绝对路径；不新增公开再分发授权 | 已编译到TASK-031回执/brief/台账、测试矩阵及构建运行地图；仅支持agent-28上单rank/单A100/28槽/1cycle memcheck窄PASS，不是完整L6 |
| SRC-031 | software-doc | NVIDIA Compute Sanitizer命令行与版本说明 | `https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html`；`https://docs.nvidia.com/compute-sanitizer/ReleaseNotes/index.html` | 官方网页；2026-09-04核验；另由SRC-030同工具链此前保存的2024.1.1帮助确认相关CLI | public | 已部分编译到TASK-031下一启动拓扑边界；官方文档证明child tracking/filter能力存在，不证明ParaAI站点支持或外层MPI拓扑会成功 |
| SRC-032 | experiment/file-set | TASK-007 旧pageable profile精确文件集合 | [固定文件清单](../outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/raw/sources/SRC-032.json) | `742dd34b1d263c13f34284cce91fe7741b20051e12772432328c11bdcce5300c`；23文件；2026-09-09登记；既有KB002对象逐项相同 | private/internal，含站点/路径信息；不新增公开再分发授权 | 候选中已部分编译到ADR-005/006与迁移矩阵；定量仅_3至_7五正式输出，_1/_2预热及smoke/nsys分开 |
| SRC-033 | derived-model/file-set | TASK-020 critical-path派生模型记录 | [固定文件清单](../outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/raw/sources/SRC-033.json) | `86f1d68c8cd69ec7ba642a80e3942beda67fb1c86881be89e68e29c296859bbc`；3文件；2026-09-09登记；既有KB002对象逐项相同 | private/internal，含站点/路径信息；不新增公开再分发授权 | 候选中已部分编译到ADR-006与迁移矩阵；派生自SRC-032五正式输出，G50非实测overlap收益 |

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
