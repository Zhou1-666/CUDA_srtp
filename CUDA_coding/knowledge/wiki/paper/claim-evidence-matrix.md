---
id: KB-CLAIMS-001
type: claim
status: reviewed
confidence: medium
source_ids: [SRC-002, SRC-003, SRC-004, SRC-005, SRC-007, SRC-008, SRC-009, SRC-010, SRC-011, SRC-012, SRC-013, SRC-014, SRC-015, SRC-016, SRC-024, SRC-026, SRC-027]
compiled_at: 2026-08-17
updated: 2026-09-02
---

# 论文主张—证据矩阵

> 论文结果段只能使用“已支持”；“部分支持”只能作为方法动机、假设或局限。

| ID | 候选主张 | 当前证据 | 缺失证据 | 状态 |
| --- | --- | --- | --- | --- |
| C0 | PaScaL_TDMA 2.1 是三对角上游方法，不是五对角论文 | SRC-002 标题、摘要、§2、§4；全文无 penta 术语 | 无 | 已支持 |
| C1 | 五对角缩约系统每 rank 有 4 个接口未知量，全局规模 `4P`、半带宽 3 | SRC-004、独立脚本 | 与 Fortran 布局逐项复核 | 部分支持 |
| C2 | 一般半带宽 `m` 的缩约规模为 `2mP`、通用结构半带宽为 `2m-1` | SRC-004 的 216 组稠密缩减、108 组递推对照；TASK-019 独立组合审计 `m=1..64`；周一涵 2026-08-24 `accept`；SRC-010/011 表明一般窄带宽接口缩约已有先例 | 只能作为本项目分区/排序下推导，不作首次性主张，特殊系数实际带宽可更小 | 已审阅支持（创新性降级） |
| C3 | 固定带状打包的结构零槽为 `3m(m-1)`，裁剪后载荷为 `5m²+m` | SRC-004、数值统计、TASK-019 独立逐行偏移复算与周一涵 2026-08-24 `accept`；零槽统计已改为跨样本取交集 | 投稿前机构数据库复查；`5m²+m` 不是任意编码绝对下界 | 部分支持（数学已审阅，候选贡献，禁止首次/最优/绝对下界） |
| C4 | 对满足六个结构零约束的五对角前向布局，固定映射可将 28 槽无损编码为 22 槽 | TASK-005 独立脚本：180 组、403,200 次逐槽检查、28/28 故障注入；TASK-006 可切换 Fortran 工作树在 NVHPC 上 API 18/18、profiled 20/20、普通入口 2/2，profiled 最大 RMS/L∞/cross 为 `4.336e-16/6.661e-16/1.776e-15`；TASK-013 将其限定为 PaScaL 式布局候选贡献，并补入 Pentadsolver 高度相邻多 GPU方法先例 | TASK-016 动态内存/生命周期；TASK-019 与投稿前更新检索 | 部分支持（核心候选贡献，禁止扩张为新五对角算法） |
| C5 | 22 槽降低实际 MPI 字节 | 公式与实现固定前向槽数从 28 降为 22；TASK-009 CSV 记录实际 `forward_slots` | 尚无 MPI 字节计数器；只能主张前向 payload 元素数减少 21.4%，不能等同总 MPI 字节或时间同比下降 | 部分支持（严格限定前向 payload） |
| C6 | 22 槽降低通信阶段或端到端时间 | TASK-009 jobs `1448516/1449812` 的1/2/4/8 GPU配对；TASK-023 job1457454单节点host正式矩阵中，P2 plain稳定8轮五个配对方向一致、变化中位数`-14.5045%`，profiled阶段把变化定位到forward D2H/MPI(含等待)/H2D，local compute不变 | P1差异仅千分之一级；TASK-009 strong P=2 device曾见22槽略慢；无MPI字节计数器，TASK-023不是跨节点/CUDA-aware或扩展性实验，且P2诊断扰动波动较大 | 部分支持（配置相关，禁止普遍化） |
| C7 | persistent pinned staging 值得用于当前性能优化 | TASK-007旧pageable profile的allocate+free中位占比仅0.1474%；TASK-025 job1459808证明per-call pinned的D2H/H2D快约52%–68%，但22/28端到端中位回退11.8472%/4.1233%。随后重开的plan-owned persistent candidate `84357b2b…56b035`已完成所有权/容量/路由合同、A100 component门、API 20/20和28/22各100次pressure，最大误差`6.6613e-16`；但四项sanitizer均无法attach，候选按硬停止规则撤回，见[终局处置](../../outputs/validation/TASK-007-20260830-task5-target-gates/TASK-007-20260831-withdrawal-disposition.md) | 候选L6没有已执行的solver memory-check结果；L3/L4/L7、TASK-010重链、plain端到端正式A/B与独立采用审阅均未完成。没有persistent候选的端到端收益数字；阶段独立rank-MAX不能相加为精确收益 | 当前不支持采用；candidate已`do-not-adopt/withdraw`，但该处置不否定persistent机制本身。只有先明确解除性能线硬停止并另行批准新任务，才可重开评估 |
| C8 | CUDA-aware MPI 优于 host staging | TASK-009 同输入的 P≤4 单节点和 P8 双节点 host/device A/B；P8 weak 的 device 中位数比 host 低约 `5.95%–7.34%`，strong/28 近似持平、strong/22 仅低约 `0.73%` | 强制 TCP 不能证明 GPUDirect/零拷贝；收益依规模和槽数变化，不能写成所有配置均优于 host | 部分支持（限冻结配置） |
| C9 | 当前实验组比仓库参考组快约 2.6–4.7× | SRC-005 | P0 后公平复现 | 部分支持 |
| C10 | 求解器具有多 GPU 强/弱扩展性 | TASK-009 jobs `1448516/1449812` 已完成 1/2/4/8 GPU同口径强/弱扩展、host/device × 28/22、每组 5 次和正确性门；P8 strong speedup 仅 `0.389×–0.457×`、效率 `4.86%–5.71%`，weak efficiency `10.02%–12.96%` | P1/P2/P4 与 P8 跨会话且 P8 强制 TCP；未覆盖其他网络、批量和节点拓扑 | 不支持“良好/通用扩展性”；协议矩阵完整，只支持低效率结论 |
| C11 | 求解器可作为冻结制造解问题的 Poisson/Helmholtz 批量 z 线求解模块 | SRC-024；[TASK-010完整回执](../../outputs/validation/TASK-010-20260826-paraai-a100-job1454628/README.md)：双A100、FP64、32例；clean build、原件/源码核验及最终审查通过；最低阶3.9905817759652016，最大缩放残差4.3520742565306136e-14 | 不覆盖完整CFD、一般边界、非均匀rank环境、跨节点或性能；实际源码为3c658a7加归档修改，不是整树8e58e49 | 已支持（严格限定制造解demo；无性能主张） |
| C12 | 五对角实现继承并推广 PaScaL_TDMA 的局部缩约—接口求解—回带框架 | SRC-002、SRC-003P、SRC-007、[[../reference/pascal-tdma-2.1-to-penta-transfer]]、[[../reference/upstream-diff-and-contribution-boundary]]、TASK-002A 导师确认及 2026-08-27 用户署名补充 | 正式数学证明、端到端回归；五对角扩展开发者按补充记录写李洋和周一涵，不得写成上游 PaScaL_TDMA 作者或后续执行者独立原创；公开共同署名待 TASK-002B 复核 | 部分支持 |
| C13 | 五对角 API 会拒绝已登记的非法 plan/尺寸/空分区输入并报告 CUDA/MPI 失败 | SRC-003P、TASK-004 的 14 用例和目标环境回执 | sanitizer、CUDA-aware MPI、真实多 GPU 失败注入 | 已支持（限定已测输入） |
| C14 | 五对角实现会在分配或 kernel 前拒绝超过默认 32 位索引/MPI extent 的已登记尺寸 | SRC-003P、TASK-008 setup-only 边界脚本、16 个 API 用例和目标环境回执 | MPI 大计数、64 位 kernel 和真实极限规模不支持 | 已支持（限定当前 32 位合同） |
| C15 | 当前无主元交换五对角求解器在预注册的弱占优、`1e-12..1e12` 行尺度和受控近奇异输入上具有明确误差边界，并以错误码 `4` 拒绝零/近零主元 | TASK-015 六类独立矩阵；NVHPC 24.11/OpenMPI 4.1.5 的 `np=1/2` 12 项回归；[[../../outputs/validation/TASK-015-20260820-wsl-nvhpc24.11/README]] | 仅限已测矩阵族；无主元交换，不支持任意非对角占优/病态系统；性能影响未测 | 已支持（严格限定） |
| C16 | 在 RTX 4060 Laptop、CUDA 12.6、P=1 FP64、`64×64×1024` manufactured 固定配置和统一预热口径下，TASK-014 PaScaL 28 槽 solver 中位数为 `3.6474 ms`；cuSPARSE QR 的两个独立回执中位数为 `6.6865 ms`（R0）与 `5.6064 ms`（R1） | [[../../outputs/validation/TASK-014-20260819-local-preflight/README]]；[[../../outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/README]]；[[../../outputs/validation/TASK-022-R1-20260819-wsl-cuda12.6/README]]；两次独立审查 PASS | 仅支持该单 GPU固定配置的会话级绝对时间；必须并列报告 R0/R1 的 IQR/MAD/CV，不能合并、挑选较快一轮或作未配对速度比 | 已支持（严格限定） |
| C17 | 在 A100 PCIe 40GB、FP64、`256×256×1024` manufactured 固定主要输入下，PaScaL P=1 rank-MAX solver 中位数约 `7.87–7.90 ms`，cuSPARSE QR solver/end-to-end 中位数为 `8.1092/12.9911 ms` | [[../../outputs/validation/TASK-009-20260824-recovery-audit/README]]；cuSPARSE job `1448573` 的 5 次原始 CSV与正确性日志 | 两者来自不同 GPU 会话，约 3% 差距过小；只能并列报告绝对时间，不得形成普遍速度比较，也不得比较 cuSPARSE end-to-end 与 PaScaL solver-only | 部分支持（会话级绝对时间） |

## 红队升级 Gate

2026-08-26 TASK-023 本地工程增量：方向计时、每rank记录和普通入口扰动对照已通过WSL/NVHPC功能与格式复验，见 [回执](../../outputs/validation/TASK-023-20260826-local-implementation/README.md)。单GPU双rank、两次smoke迭代不构成正式性能数据，A100配对待验；本次不升级任何性能主张，MPI调用时长不等同纯网络时间或已分离的等待时间。

2026-08-28 TASK-023按批准范围关闭：job1457454正式单节点双A100矩阵及本地原始CSV复算通过，见[正式回执](../../outputs/validation/TASK-023-20260827-formal-validation-v2/24-job1457454-local-readback-and-recompute.md)和[关闭复核](../../outputs/validation/TASK-023-20260827-formal-validation-v2/25-TASK-023-final-contract-review.md)。它补强C6的固定配置证据，但不改变“配置相关”等级；P1不能宣称实质加速，P2只限host staging/TCP、`256×256×1024`和本次启动口径。L4不均匀、L6、L7与TASK-010重链为批准范围外而非PASS。

2026-08-26：TASK-023–031 仅作为诊断与条件式优化排程进入 [软件优先执行流程](../../outputs/plans/20260826-software-first-performance-roadmap.md)。锁页搬运、固定系数复用、pack合并、kernel调优、主元标志汇总均没有新的实测收益；不得因为登记任务而升级任何性能或创新性主张。TASK-020/021 的原 Gate 保留。

- C2/C3：TASK-019 模型审阅和周一涵 `accept` 已归档，仍需投稿前更新检索；即使完成也只升级数学正确性，不自动升级“首次”新颖性；
- C4：TASK-006/016 的 Fortran 等价、动态内存和生命周期证据通过后升级；
- C5/C6/C8/C10：TASK-009 已补齐 1/2/4/8 GPU协议矩阵和双节点重复配对；结果支持本次 P8 中 22 槽的限定收益，也明确否定良好/线性/通用扩展性主张；
- C11：只由 TASK-010 可执行应用闭环支持；制造解不能外推为完整 CFD；
- C15：残差低但前向误差高时必须保留反例，不得只报告有利指标。
- C16：只能报告固定配置的回执级观测值；不得把 cuSPARSE restore-plus-solver 与 TASK-014 solver total 比较，不得把 R0/R1 合并或只选较快一轮，也不得外推到多 GPU、其他规模或普遍最优。
- C17：PaScaL 与 cuSPARSE 来自不同 A100 GPU 会话，只能并列报告 solver-only 绝对时间和各自正确性；约 3% 差距不支持速度优劣主张。

## 禁止直接写入论文

- `28→18`；当前候选是 `28→22`；
- 用单 GPU 多 rank 数据声称多 GPU 扩展；
- 把一般 `m` 理论写成任意带宽 CUDA Fortran 已实现；
- 未检索文献就使用“首次”“最优”；
- 把求解器库称为已完成的工业级 CFD 软件。
- 把 SRC-002 写成已经提出或证明五对角算法；它只能支撑上游方法、优化动机和实验设计。
- 把 cuSPARSE/cuPentBatch/Ginkgo 的单 GPU batched 结果写成分布式多 GPU comparator，或把内部 `penta-ref` 称为外部 baseline。

## 回编译规则

每个新实验完成后，更新相应主张、实验卡、图表映射和 `updated` 日期。状态升级必须列出新 source/experiment ID；反例出现时降级而不是删除历史。
