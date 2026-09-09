# 相邻 TDMA/ADI 论文优化审阅回执（2026-08-24）

## 审阅范围

- SRC-019：Ha、Park、You，2021，CPC，多 GPU ADI fractional-step；
- SRC-020：Kim 等，2025，arXiv，Pipelined-TDMA；
- SRC-021：Akkurt 等，2025，CPC，DistD2-TDS。

三篇论文研究的是三对角系统、ADI/Poisson 或紧致差分，不是本项目五对角实现。它们可支持优化假设、性能建模方法和实验设计，不能支持五对角正确性、28→22 等价性或本仓库性能结论。

## 来源完整性

| 来源 | 知识库原始副本 | SHA-256 | 许可/使用边界 |
| --- | --- | --- | --- |
| SRC-019 | `knowledge/raw/papers/SRC-019-2021-ha-multigpu-adi.md` | `EDD1289AAD2B7EC8CE4DB5BCE7F24DB1AC0C334A0B7D233452BC6640FAEBEB56` | 论文页标注 ©2021 Elsevier；仅作内部研究与引用，未取得再分发授权 |
| SRC-020 | `knowledge/raw/papers/SRC-020-2025-kim-pipelined-tdma.md` | `034FEBF72A77834944DE0CEC3A0F90175582025E5D3BE535E09F89A98034ECAD` | arXiv 用户副本；引用可用，具体再分发许可未在副本中确认 |
| SRC-021 | `knowledge/raw/papers/SRC-021-2025-akkurt-distd2-tds.md` | `AF7E6ABB275F94159BDCFDD81870E22CF88D8C4216D033B84F4722F2CBB4D33F` | 正文标注 CC BY 4.0 |

归档副本与用户提供文件逐一计算 SHA-256，三项均完全一致；未改写原文。

## SRC-019：多 GPU ADI fractional-step

### 论文实际方法

- 采用沿壁法向的一维 slab decomposition，使另外两个方向的变换或三对角求解保持 GPU 本地，避免频繁全局转置；
- 对动量方程使用 PDD，对 Poisson 方程使用更一般但可扩展性较弱的 PPT；
- PDD 依赖对角占优和足够大的局部子域，使特定耦合项降到机器精度以下；论文明确指出该近似对 Poisson 矩阵未必成立；
- 通过预运行枚举 cuSPARSE 调用的 batch size，在显存限制内选择实测更快的批大小；
- 使用单一大 workspace 和 Fortran 指针切片复用临时存储，避免反复 allocate/deallocate；
- 使用 CUDA-aware MPI，并用强/弱扩展和完整流场验证区分 solver 与应用效果。

### 可迁移到五对角的思想

- 域分解方向必须与通信模式、FFT/ADI 方向和后处理需求共同选择；
- batch size 不是越大越好，应同时受 GPU 占用、启动开销、显存和调用次数约束；
- workspace 可作为 TASK-007 的设计参考，但必须先证明分配/释放或临时存储确实占据关键路径；
- PDD/PPT 的“根据数值结构选择算法”思想可迁移，但具体删项、误差界和 `2×2` 接口不能迁移。

### 不可外推

- 三对角对角占优误差界不能证明五对角缩约中的任意项可忽略；
- PDD/PPT 的接口维度、通信量和 GPU 数阈值不能替代本项目的四接口未知量、七对角缩约与 28/22 槽证据；
- P100/V100/K80 上的扩展结果不能作为 A100 五对角性能数据。

## SRC-020：Pipelined-TDMA

### 论文实际方法

- 把 divide-and-conquer TDMA 分为可扩展的 A/C 阶段、缩约求解 B 阶段和 A2B/B2C 通信阶段；
- 将缩约系统工作从单一指定 GPU 均分到所有 GPU，以 `MPI_Alltoall` 替代 gather/scatter；
- 对多个独立 TDM 系统做三阶段流水：A/C、B 和通信分别使用 CUDA stream/默认流，跨不同系统重叠通信与计算，并并发执行低占用 B kernel；
- batch size 同时平衡 Stage A 占用率、流水尾部欠填充、通信暴露和临时显存，不只优化单 kernel 吞吐；
- 在论文环境中以 NVHPC 25.1、Open MPI 5.0.5、CUDA-aware MPI 和最多 64 张 A100 SXM 验证；这些环境条件是结果的一部分。

### 可迁移到五对角的思想

- 先把五对角六阶段映射为可扩展计算、缩约求解、通信和回带，再以 rank-MAX 阶段时间建立关键路径；
- overlap 的必要条件不是“论文有效”，而是本项目存在多个独立系统、通信可异步推进、可重叠计算足够长、buffer 生命周期可证明；
- batch autotuning 的目标函数应包含总流水时间和尾部损失，不能只测 kernel；
- 缩约阶段的负载均衡值得审计，但必须先确认当前五对角实现是否真的存在单 rank 集中工作。

### 不可外推

- 三对角的 A/B/C 数据依赖、`2P-2` 缩约规模和三流调度不能直接套到五对角四接口系统；
- 论文中“通信时间小于计算时间”的条件必须由 TASK-020 的本项目 profile 证明；
- 64 GPU 加速、并行效率和完整流场收益不属于本仓库结果。

## SRC-021：DistD2-TDS

### 论文实际方法

- 将少量独立三对角线组成 group，按同一轴位置交错存储；GPU 示例以 `SZ=32` 让一个 thread 处理一条线，CPU 用 SIMD 宽度决定 group；
- 通过方向专属重排换取方向无关的连续访问、GPU thread-level parallelism 和 CPU vectorization；
- 当系数对多个 RHS 不变时预处理消元系数，避免每个 RHS 重算；
- 将 RHS 构造与前向消元融合，利用 cache/shared-memory temporal locality 减少主存流量；
- 用字节流量和 STREAM/BabelStream 建立带宽上限模型，而不是只用 FLOP；
- 依赖对角占优将特定缩约耦合降到机器精度，最终只做相邻 rank 的 `2×2` 系统通信；论文明确将一般三对角系统列为需要额外步骤的扩展。

### 可迁移到五对角的思想

- 当前“一线程一条线”可进一步按实际 memory transaction 检查交错宽度、连续性和方向重排成本；
- 对多 RHS/固定系数场景可评估系数预处理，但必须明确系数是否被原位覆盖及复用生命周期；
- RHS 构造—前向消元融合是候选 kernel-fusion 方向，必须比较新增寄存器、spill、occupancy 和总字节流量；
- 先建立五对角每阶段 bytes/line 模型，再用有效带宽判断优化空间。

### 不可外推

- `SZ=32` 是论文硬件/算法布局选择，不是本项目最佳线程块或 batch 大小；
- 三对角 `2×2` 相邻接口与对角占优删项不能替代五对角 4 接口、七对角缩约和独立误差证明；
- H100/A100 的带宽利用率与 384 GPU scaling 不能作为本项目性能主张。

## 跨论文综合结论

### 优先级 A：先建立测量闭环

1. 对当前六阶段记录 rank-MAX 的 stage time、通信量、bytes/line、寄存器、spill、occupancy；
2. 区分单节点与跨节点、host staging 与 CUDA-aware、28 与 22 槽；
3. 只有 profile 指向明确瓶颈，才选择下面的优化方向。

### 优先级 B：低风险候选

- 固定系数的 setup-only 预处理；
- 临时 workspace 生命周期与复用；
- 数据布局连续性和按线 group 宽度的受控 autotuning；
- 以总流水时间为目标的 batch size 搜索。

这些仍需独立任务和目标环境实测；本次审阅不授权实现。

### 优先级 C：条件式候选

- 缩约工作均分；
- 多系统流水线；
- CUDA stream 并发和通信—计算 overlap；
- RHS 构造与前向消元融合。

只有 TASK-020 证明通信占比、可重叠工作和 MPI 异步推进达到预注册阈值时，才值得增加复杂度。

### 禁止直接采用

- 根据三对角论文直接删除五对角缩约项；
- 将五对角缩约系统简化为相邻 `2×2`；
- 把论文 GPU 数、加速比或带宽利用率当作本项目结果；
- 未测量就声称 workspace、layout、fusion 或 overlap 会更快。

## 与 TASK-009 的关系

三篇论文强化了 TASK-009 的实验口径：必须记录 MPI/CUDA-aware 环境、rank→GPU 映射、跨节点拓扑、rank-MAX 总时间和阶段时间。它们不解决当前 ParaAI 的 Slurm/MPI 启动兼容性，也不能补齐缺失的 8 GPU 数据。TASK-009 状态不因本次文献编译而改变。

## 编译产物

- 规范 Wiki：[[../../wiki/reference/adjacent-tdma-optimization-transfer-to-penta]]；
- 来源账本：`knowledge/raw/source-registry.md`；
- 来源地图：[[../../wiki/maps/source-to-knowledge-map]]；
- 开放问题：`knowledge/meta/open-questions.md`。
