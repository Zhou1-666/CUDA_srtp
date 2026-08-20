# 任务缺口与阻塞台账

> **唯一事实来源**：本台账解释所有非 `done` 软件任务的实际剩余工作。`task-queue.md` 负责排序与状态；本文件负责回答“为什么还不能完成、谁/什么条件能解除、下一步做什么”。每次任务开始、状态变化、验证失败、发现新的外部依赖或交接结束时必须更新对应条目；不得只改状态而不改本台账。

## 更新规则

1. 只登记 `ready`、`in-progress`、`review`、`blocked`；转为 `done` 后保留一条“已解除”快照和证据链接。
2. 每条必须有：当前缺口、类别、责任方、可验收的解除证据、当前最小动作、上次核对日期。
3. “待导师确认”“缺集群”等不能作为终点：必须写清需要导师确认的具体句子，或需要的账号、命令、日志和日期。
4. 不可抗力/外部条件应标为 `external`；没有当前可做技术工作的任务标为 `blocked`，技术完成只差签字的任务标为 `review`。
5. 每次最终交接必须同步本文件、`task-queue.md` 和 `compile-log.md`；若影响 Gate，再同步活动 brief/ADR/开放问题。

## 活动条目

### TASK-002A — done（已解除快照）

- 核对日期：2026-08-20；类别：`human/provenance`。
- 已解除证据：上游 HEAD `e637d5e`、三对角精确历史对象 `d69ae95`、逐文件差异审计，以及导师苏运德于 2026-08-20 的确认均归档在 [TASK-002A 审计回执](../outputs/reviews/TASK-002A-20260817-upstream-audit.md)。确认：初始五对角实现由李洋在导师指导的研究生团队三对角源码基础上借助 AI 工具扩展形成；三对角基线及导入前五对角实现不得作为本项目或后续执行者的独立原创；AI 不构成作者或权利主体。
- 保留边界：该回执不等于上游及衍生文件的发布许可，也不决定论文最终作者排序；两项继续由 TASK-002B 处理。

### TASK-002B — review

- 核对日期：2026-08-20；类别：`provenance/publication`。
- 已有输入：TASK-002A 来源/署名回执已解除；项目负责人确认范围为“源码仅私有研发、论文可公开”。
- 当前缺口：私有仓库声明、NOTICE、第三方引用清单和论文引用说明已形成草案；仍缺导师/权利人复核最终文本，并确认论文是否受机构、竞赛或保密审查约束。
- 责任方：导师/权利人复核；执行人保留草案与检查记录。
- 解除证据：私有研发范围在 README/NOTICE 中明确；上游 MIT 与第三方引用逐项核验；论文引用清单可复核；链接检查通过；导师/权利人确认文本。
- 当前最小动作：审阅 [TASK-002B 私有范围与引用草案](../outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md) 与根 `NOTICE`；仓库保持私有。

### TASK-006 — done（已解除快照）

- 核对日期：2026-08-20；类别：`technical`。
- 已有输入：默认兼容的 `pascal_plan_create(...,forward_slots)`、28/22 普通与 profiled 分支、固定 pack/unpack、CSV 元数据和稳定 runner 均已实现；NVHPC 24.11/OpenMPI 4.1.5 干净构建，API 18/18，profiled 的 `np=1/2/4`、exact1/manufactured、`Nrow=5/6` 和不均匀线分区 20/20，普通入口 `np=2` 的 28/22 为 2/2。回执：`knowledge/outputs/validation/TASK-006-20260820-wsl-nvhpc24.11/README.md`。
- 已解除证据：源码提交 `faffee3`；原有 API 18/18、profiled 20/20、普通入口 2/2，加上 TASK-016 的 memcheck/initcheck 与 28/22 各 100 次生命周期均通过。回执：`knowledge/outputs/validation/TASK-006-20260820-wsl-nvhpc24.11/README.md` 与 `TASK-016-20260820-wsl-nvhpc24.11/README.md`。
- 保留边界：没有配对性能或扩展性结论；单 GPU多 rank 只作正确性与内存安全证据。

### TASK-007 — blocked

- 上次核对：2026-08-17；类别：`evidence`。
- 当前缺口：没有 profiler 证明 host staging 分配/释放是瓶颈，也没有 buffer 所有权和错误回滚设计。
- 责任方：执行人。
- 解除证据：TASK-014 的 phase profile 显示可测占比；冻结生命周期合同和预注册收益阈值。
- 当前最小动作：从 TASK-014 CSV 判断 staging 占比；未达阈值则 ADR 记录“不做”。

### TASK-009 — ready

- 上次核对：2026-08-17；类别：`environment/dependency`。
- 当前缺口：TASK-006/016 已关闭，真实双 GPU环境和 22 槽实现前置均满足；仍没有正式扩展实验 CSV。
- 责任方：集群管理员/导师（资源）；执行人（实验）。
- 解除证据：TASK-006 done；按 benchmark 协议得到强弱扩展、28/22 配对、cuSPARSE、残差/制造解和每配置至少五次的原始证据。
- 当前最小动作：等待项目负责人明确领取；在 A100 预约中先做固定输入正确性预检，再按协议采集强/弱扩展与配对样本。不得把 TASK-017 单次 smoke 误作正式扩展数据。

### TASK-010 — blocked

- 上次核对：2026-08-17；类别：`human/material`。
- 当前缺口：没有 CFD/FFT 宿主接口，也未获批独立 Poisson/Helmholtz demo。
- 责任方：导师（范围决定）；执行人（集成）。
- 解除证据：导师选择“提供宿主代码/接口”或“批准独立 demo”；ADR 冻结离散、边界、制造解、阈值和 I/O 合同。
- 当前最小动作：向导师提出二选一决定；没有决定不写应用闭环结论。

### TASK-011 — blocked

- 上次核对：2026-08-17；类别：`dependency`。
- 当前缺口：论文所需实现、性能、应用、许可与一般 m 独立审阅证据均未齐。
- 责任方：执行人及各前置任务责任方。
- 解除证据：TASK-002B、006、009、010、013、019 全部 done，且每图表绑定代码 SHA、原始 CSV 和来源。
- 当前最小动作：等待前置任务；禁止写性能或首次性结论。

### TASK-013 — done（已解除快照）

- 核对日期：2026-08-20；类别：`human/research`。
- 已解除证据：主审计回执、模型辅助审计（补入 NASA/OVERFLOW 与 Pentadsolver）及周一涵于 2026-08-20 的 `accept` 独立审阅均已归档在 [TASK-013 审计回执](../outputs/reviews/TASK-013-20260817-novelty-and-comparator-audit.md)。
- 保留边界：Pentadsolver 是高度相邻多 GPU方法先例，不能声称无此类先例；其可获取代码和同输入复现性尚未确认。投稿前仍须更新数据库检索，TASK-019 仍须独立复算一般 `m` 公式。

### TASK-015 — done（已解除快照）

- 核对日期：2026-08-20；类别：`technical/evidence`。
- 已解除证据：六类独立矩阵族通过；尺度不变阈值为 `64*epsilon*row_scale`；NVHPC 24.11/OpenMPI 4.1.5 的 `np=1/2` 共 12 项、失败 0，数值拒绝码为 `4`；TASK-014 manufactured 正常回归保持约 `1e-13` 误差。完整回执：`knowledge/outputs/validation/TASK-015-20260820-wsl-nvhpc24.11/README.md`；最终源码 SHA 为包含该回执的提交。
- 保留边界：无主元交换算法不支持任意病态系统；新增状态同步的性能影响未做配对测量，不得作性能结论。

### TASK-016 — done（已解除快照）

- 核对日期：2026-08-20；类别：`environment/evidence`。
- 已解除证据：源码提交 `faffee3`；WSL/NVHPC 24.11/OpenMPI 4.1.5 下 28/22 各 100 次 `np=2` create--solve--clean 均通过，最大误差均 `6.6613e-16`；Compute Sanitizer 2024.3 的 memcheck/initcheck 对两布局、两个 rank 均为 0 errors；plan 全部 host/device allocatable 在每轮 clean 后均未分配。
- 保留边界：UCX 初始化探测的首次 false positive 已保留原始回溯，正式检查使用 `ob1/pt2pt`；不支持性能或真实多 GPU扩展结论。完整回执：`knowledge/outputs/validation/TASK-016-20260820-wsl-nvhpc24.11/README.md`。

### TASK-017 — done（已解除快照）

- 核对日期：2026-08-19；类别：`environment`。
- 已解除证据：ParaAI Slurm job `1433459` 在 `paraai-n32-h-01-agent-68` 预约 2 GPU；两张 A100 40GB（driver `535.104.12`）经 `srun --gpus-per-task=1` 显示为不同 UUID；`nvfortran 24.5-1`、OpenMPI `3.1.5` 和 CUDA `12.4` 可用，OpenMPI CUDA-aware capability 为 true；`np=2` manufactured smoke 退出 0，误差约 `1e-13`。完整回执：`knowledge/outputs/validation/TASK-017-20260819-paraai-a100/README.md`。
- 保留边界：GPU 间为 PHB、无 NVLink；本任务未做多 GPU扩展计时、22 槽比较或 CUDA-aware A/B，不能支持性能/扩展性主张。

### TASK-018 — done（已解除快照）

- 核对日期：2026-08-19；类别：`technical/evidence`。
- 已解除证据：模型 CLI 修复 `8df948e`；自检 6 项通过，30 GiB 下 `256×256×1024,P=1` 为 5.061 GiB/FIT，`512×512×2048,P=1` 为 40.242 GiB/REJECT/exit 2。BSCC-N32-H job `1433881` 在 A100 40 GiB 上 clean release build 后运行 manufactured `256×256×1024,np=1`，内联退出码 0，RMS/L∞ `1.4532e-13/1.9662e-13`。完整回执：`knowledge/outputs/validation/TASK-018-20260819-bscc-n32h-a100/README.md`。
- 保留边界：22 槽仍是投影；单 GPU、一次 iteration smoke 不支持性能、扩展或 CUDA-aware 结论。首次数值正常但 shell 状态 130 的尝试保留为非通过证据。

### TASK-019 — ready

- 核对日期：2026-08-20；类别：`human/research`。
- 当前缺口：一般 m 公式没有非原推导者逐步复算；投稿前数据库更新检索未做。
- 责任方：数学审阅者；执行人负责材料和检索记录。
- 解除证据：审阅者签字的递推/计数复算；投稿前数据库检索式、日期与结果归档。
- 当前最小动作：把一般 m 方法页和两个 Node 验证交给独立审阅者；此前 C3 只能是候选贡献。

### TASK-020 — blocked

- 上次核对：2026-08-17；类别：`dependency/evidence`。
- 当前缺口：22 槽已到 `review`、真实双 GPU环境已确认，但 persistent staging 尚未处理，且没有同输入真实多 GPU的阶段 profile，无法判断 overlap 是否值得做。
- 责任方：执行人。
- 解除证据：TASK-006、007、017 done；同输入 profile 的关键路径模型、预注册 MPI 占比/可重叠工作阈值和“做/不做”结论。
- 当前最小动作：不提前实现 overlap，等待证据齐全。

### TASK-021 — blocked

- 上次核对：2026-08-17；类别：`decision/dependency`。
- 当前缺口：TASK-020 未证明 overlap 值得做，且无非阻塞通信/缓冲区/错误路径合同。
- 责任方：执行人。
- 解除证据：TASK-020 的“值得做”结论；随后完成正确性、死锁、多 rank 和同输入性能回归。
- 当前最小动作：保持不领取；若 TASK-020 判定无收益，则以“不做”关闭并保留理由。

## 已解除快照

### TASK-014 — 2026-08-19 已解除

- 原缺口：28 槽内部正确性/五次性能数据完成后，仍缺 P=1 cuSPARSE 外部锚点；build-time SHA 未即时打印。
- 解除证据：[TASK-014 回执](../outputs/validation/TASK-014-20260819-local-preflight/README.md) 与 [TASK-022 公平外部 baseline](../outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/README.md)。
- 关闭结论：debug/release、np=1/2 × exact1/manufactured、两次预热和五次 PaScaL 正式样本通过；TASK-022 外部锚点和独立审查通过，TASK-014 标记 `done`。
- 保留边界：TASK-014 构建瞬间未打印 SHA；样本后 SHA 的限制继续公开。没有真实多 GPU 或扩展性证据。

### TASK-022 — 2026-08-19 已解除

- 原缺口：仓库没有 P=1 cuSPARSE 五对角 adapter；首组 SHA `45e6998` 数据因进程内预热口径与 TASK-014 不一致被独立审查否决。
- 解除证据：[公平回执](../outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/README.md) 与 [最终独立复审](../outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/independent-audit.md)。
- 关闭结论：SHA `f868ea9` 上 exact1/manufactured 均过 `1e-10`；两次独立预热、五次 `warmups=0` 正式启动和统计复算通过；独立 GPT-5.6-sol/high 审查为 PASS，TASK-022 标记 `done`。
- 保留边界：solver-only 中位数 `6.6865 ms`、IQR `1.2181 ms`、CV `10.68%` 仅适用于 RTX 4060/CUDA 12.6/P=1/FP64 固定配置；旧回执保留为 `superseded-preliminary`，禁止用于比较。
- 重复证据：R1 在同一 adapter 源码、相同固定配置下再次通过正确性与五次正式计时，solver-only 中位数 `5.6064 ms`、CV `3.86%`；已归档并独立复算。R0/R1 不合并、不互相覆盖，论文必须并列披露其会话差异。
