---
id: TASK-007-PERSISTENT-PINNED-DESIGN-20260828
type: plan
status: draft
confidence: high
source_ids: [SRC-003P]
created: 2026-08-28
updated: 2026-08-28
---

# TASK-007：persistent pinned host staging buffers 设计

## 批准状态与证据边界

用户于 2026-08-28 明确重开 TASK-007，并批准本页所述设计方向。当前只完成设计冻结和台账同步；尚未创建 TASK-007 worktree、修改源码、运行 NVHPC 编译、申请 GPU、提交 Slurm 作业或形成加速结论。

旧 TASK-007 的否定结论继续适用于当时的 pageable allocator：双 A100 正式 profile 中 allocate+free 占比中位数仅 `0.1474%`。TASK-025 job1459808 随后证明 per-call pinned 版本虽然使 D2H/H2D 快约 52%–68%，但 22/28 槽 plain 端到端中位数分别回退 `11.8472%`/`4.1233%`，因此该候选保持 `do-not-adopt`。同一证据又显示 pinned allocate+free 诊断占比中位数达到 `22.146879%`/`23.213614%`，满足 ADR-005 的 5% 重开门。本设计只检验“把 pinned 注册成本移到 plan 生命周期后是否值得”，不预设结果为正。

冻结实现基线是 TASK-023/TASK-025 pageable 正式对照使用的五对角源码 SHA-256 `4e12f11e586125975d19ce2214f33b342e50a776667f93ee2c96a84a9dfe79ee`。TASK-025 被否决的 per-call pinned 源码 SHA `da4282a3b931564d9b6d736951065d71387335a68ec0275a5ae4c63f7049dcd1` 仅作 allocator 语法和历史证据，不作为新分支基线。

## 单一目标与禁止改变项

单一目标：在 host-staging 模式下，由每个 `ptdma_plan_cuda` 独占并长期复用两块真实 page-locked host buffer，消除每次前向/回传通信中的 pinned 分配和释放，再以完整生命周期与 plain 端到端 A/B 决定采用或否定。

禁止改变：

- 五对角消元、缩约、回代算法和 pack/unpack 槽位映射；
- `pascal_plan_create`、`pascal_solver`、`pascal_solver_profiled_penta`、`pascal_plan_clean` 的公开实参列表；
- 28/22 槽支持范围、FP64、主元保护和 `1e-10` 正确性阈值；
- 三对角参考实现、TASK-025 原工作树和既有原始证据；
- CUDA-aware 性能优化、MPI overlap、固定 LHS 缓存或其他任务内容。

## 方案比较与选择

| 方案 | 优点 | 风险 | 决定 |
| --- | --- | --- | --- |
| plan 创建时分配两块 pinned buffer，clean 时释放 | 所有权和容量固定；solver 内无分配；普通/profiled 可共享 | plan 存活期间占用锁页内存；create/clean 需新增失败与生命周期验证 | 采用 |
| 首次 solver 调用时懒分配并按需扩容 | CUDA-aware-only plan 不占 pinned 内存 | 首轮抖动、扩容回滚、并发和计时解释复杂；solver 热路径重新出现资源管理 | 不采用 |
| 模块级或跨 plan 全局内存池 | 可能减少多个 plan 的总锁页量 | communicator、GPU、容量和并发所有权混杂；清理顺序难以局部证明 | 不采用 |

## 所有权、容量和后端合同

1. 一个 plan 独占两块 host buffer：`host_send` 和 `host_recv`。不在不同 plan、rank 或 communicator 之间共享。
2. host plan 在 `pascal_plan_create` 中一次性申请真实 pinned 内存；`pascal_plan_clean` 释放，重复 clean 保持幂等。CUDA-aware plan 不申请这两块内存。
3. send 容量取前向发送与回传发送的最大值：
   `max(sum(BIGbufsubsize_A), sum(bufsubsize_sol_B))`。
4. recv 容量取前向接收与回传接收的最大值：
   `max(sum(BIGbufsubsize_B), sum(bufsubsize_sol_A))`。
   容量先用 64 位临时量核对，再转换为默认整数；不得用溢出的默认整数 `sum` 充当预检。
5. `Nsys`、`nprocs`、communicator、forward slots 和 MPI backend 都在 plan 创建时冻结。改变任一项必须 clean 后重新 create；solver 不做自动扩容或静默重配。
6. `pascal_cuda_aware_mpi` 必须在 create 前设置。plan 保存创建时的 backend；若活动 plan 期间全局开关发生变化，solver 明确失败并要求重建 plan，不静默切换到缺失或不匹配的 staging 资源。
7. 同一 plan 同一时刻只允许一个 solver 调用；需要并发时创建不同 plan。当前共享 `rd/Atr/Dtr/Drd/BIGbuf_*` 已使 plan 非重入，本任务不增加伪线程安全锁或改变这一既有前提。

## 分配、失败与清理合同

- 优先表示为 plan 内的 CUDA Fortran `allocatable, pinned` 数组，并在 `allocate(..., pinned=flag, stat=...)` 后同时检查分配状态和真实锁页标志。
- NVHPC 对 pinned allocatable derived-type component 的实际支持是首个目标编译门。若最小编译探针不通过，停止当前实现评审；不得在未重新批准设计的情况下切换到 `cudaHostAlloc` 原始指针或全局池。
- 分配失败或 runtime 回落为 pageable 时 fail-closed，不把该运行计作 persistent pinned。现有公开 API 无 `ierr`，因此沿用 communicator 级 fatal error 语义，不在本任务中重设全库错误模型。
- `is_created` 仍只在全部资源成功就绪后置真。pinned 第二块分配失败时先释放本任务已建立的第一块 pinned 资源，再进入既有 fatal error 路径；不借机重构所有旧分配的异常模型。
- clean 必须识别 host/device plan，只释放实际拥有的 staging；释放后容量、backend 快照和 ready 状态恢复默认值，并继续通过 clean-uncreated/double-clean 用例。

## solver 与诊断路径

- 普通和 profiled solver 都使用同一 plan-owned staging，不保留普通路径 pageable、profiled 路径 pinned 的分叉。
- 两次通信依次复用同一 send/recv 数组；前向和回传不会并发使用它们。
- 现有 `pascal_a2av` 与 `pascal_a2av_profiled` 的签名和行为保持不变；新增显式 `private` 的 `pascal_a2av_with_staging`，只供内部 host-plan 路径复用 plan-owned staging。这样既不删除旧调用能力，也不改变模块外源级接口或现有过程 ABI。
- persistent 路径的 solver 内 `allocate/free` 阶段应为零；create/clean 成本必须在 benchmark 生命周期字段或外围计时中单独保存，不能从报告中消失。
- profiled 阶段只解释 D2H/MPI/H2D 与等待变化；采用决定只读取 plain rank-MAX 端到端和完整生命周期指标。

## TDD 与允许修改范围

实现前先新增失败测试并实际观察 RED：

1. 源码合同：plan 拥有两块 pinned 数组、create 检查真实锁页、plain/profiled 复用、clean 释放、solver 活跃路径不再 per-call 分配。
2. 容量模型：28/22、P=1/2 和不均匀分区下，send/recv 最大容量、字节数及 32 位拒绝边界与 Fortran 一致。
3. 生命周期/API：host/device、28/22、create–solve–clean、double clean、backend 创建后改变的明确拒绝，以及活动 plan 的 staging 元数据。
4. 性能审计器：拒绝回落、缺失/重复/非有限样本和误差超阈值；收益不足必须输出 `do-not-adopt`，不能调宽门槛。

设计获最终批准后，允许在新的 TASK-007 隔离 worktree 中修改或新增：

- `src/PaScaL_TDMA_cuda_penta.f90`；
- TASK-007 专属源码合同、容量、生命周期、A/B 审计和 runner；
- `examples/test_penta_lifecycle.f90`、相关 Makefile 目标（仅在测试确需时）；
- `perf_bench/benchmark_penta.f90`（只增加生命周期可观测性，不改求解输入或计时阈值）；
- TASK-007 回执、ADR-005、测试/性能协议和状态台账。

不允许复制 TASK-025 rejected solver 作为起点，不修改三对角文件，不自动 commit、merge 或 push。

## 验证矩阵与采用门

源码候选按 `source-change-validation-sop.md` 作为 plan/内存生命周期核心变更验收：

- L0/L1：diff、指纹、知识 lint、八项数学和容量自检；
- L2：目标 NVHPC + MPI debug/release 干净构建，另有最小 pinned plan-component 编译探针；
- L3：真实 P=1，28/22、plain/profiled、host/device 适用路径、正确性和 API 失败语义；
- L4：单节点至少两张不同 UUID GPU，均匀/不均匀分区、28/22；
- L6：28/22 各 100 次 create–solve–clean，双 rank Compute Sanitizer memcheck/initcheck 为零非预期错误；
- L7：至少双节点、双 GPU、一 rank/卡，28/22、均匀/不均匀制造解；
- 集成：用候选库重新链接并运行 TASK-010 冻结 32 例；
- 性能：正确性通过后，单节点双 A100、P=2、固定 host staging/TCP、`256×256×1024`、28/22、plain/profiled、每组 2 次预热和 5 次正式独立配对，每次 10 次 solver timing。

性能采用条件全部满足才可采用：

1. 所有样本为真实 pinned、退出 0，误差不超过 `1e-10`；
2. 22 槽五个正式 plain 配对至少四个更快，稳定 8 轮配对中位改善至少 `5%`；
3. 28 槽 plain 配对中位回退不超过 `3%`；
4. 另报告并审计每次独立启动的 `create + 10 solve + clean` 完整生命周期；22 槽该口径必须为正收益，28 槽回退同样不得超过 `3%`；
5. profile 数据、模型预测或单次最佳值不得替代上述 plain/生命周期 Gate。

若性能 Gate 失败，TASK-007 可像 TASK-025 一样以可复核负结果关闭，候选不合并；任务完成不以“必须获得加速”为前提。

## 停止条件、当前缺口与下一步

以下任一情况立即停止并保留证据：基线指纹不符、pinned component 不能编译、发生 pageable 回落、容量/索引溢出、普通/profiled 数值或错误语义变化、生命周期泄漏/悬挂、MPI 死锁/超时、目标环境缺失或证据矩阵不完整。不得通过换输入、删用例或放宽 `1e-10` 掩盖失败。

当前缺口仍包括：尚无实现 worktree、RED/GREEN 测试、NVHPC 编译、GPU 正确性、生命周期/跨节点/TASK-010 重链或正式性能证据。逐文件TDD步骤已写入[实施计划](TASK-007-20260828-persistent-pinned-implementation-plan.md)；下一步须由用户选择执行方式后才建立隔离worktree，不会直接申请GPU。

## 设计自检

- 单一变量保持为 host staging 生命周期；算法、公开实参和数值阈值冻结。
- 所有资源有唯一 owner、确定容量、创建/释放点和失败语义。
- 并发、backend 变化、布局/communicator 变化及 pageable 回落均有明确合同。
- TASK-025 负结果和旧 TASK-007 关闭快照均保留，没有改写成正收益证据。
- 采用门包含 steady-state plain 与完整生命周期，避免把一次性注册成本从计时中隐藏。
- 本页没有授权实现、SSH、Slurm、Git 集成或公开发布。
