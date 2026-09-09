# TASK-025 job1459808 profiled阶段回读

状态：`STAGE EXPLANATION PASS`；正式采用结论仍为`do-not-adopt`。

2026-08-28，用户以短圆括号子shell从formal原始profiled CSV读取全部五个measured配对的稳态迭代2–9；每个运行/方向/迭代先取双rank最大值，再对40个样本求均值。22/28槽、forward/backward及allocate/D2H/MPI/H2D/free共20组均为`40/40`，末端`TASK025_PROFILED_STAGE_READBACK_DONE`。

## 直接观察

- D2H：pinned相对pageable在四组中降低`62.239%–67.692%`；
- H2D：降低`52.218%–65.505%`；
- allocate：pageable约`1.6–16.8 us`，pinned约`541–2242 us`，锁页分配/注册成本显著增加；
- free：pageable约`1.2–3.3 us`，pinned约`326–781 us`，锁页注销/释放成本显著增加；
- MPI：forward两组变化为`+1.152%/-13.583%`，backward两组为`+278.626%/+210.183%`。MPI计时包含等待，不能把该变化直接归因为MPI库或网络本身变慢。

阶段数据证明锁页传输本身有效，但当前候选在每次solver调用、每个方向内新建并释放临时pinned staging，分配/释放开销和同步等待抵消了复制收益。这与plain端到端正式结论一致：22槽0/5更快、中位回退11.8472%；28槽1/5更快、中位回退4.1233%，故当前实现不得采用。

这些阶段是分别取rank最大值的诊断量，不能相加为精确关键路径；profiled数据也不能替代plain端到端采用门。

## 受限优化方向

新证据支持的后续假设是“长期复用pinned host staging”：在plan创建或首次使用时按已验证容量一次分配，普通/profiled路径复用，并在plan清理时释放；仅在容量、分区、communicator或布局变化时安全重建。该方向会改变plan所有权、生命周期、并发和失败回滚合同，明确超出TASK-025范围。

该方向与已按旧pageable profile否决的TASK-007 persistent host staging重叠。TASK-007台账已允许在实现、分配器、规模或MPI路径显著改变且新profile达到门槛时重新审计，因此不得另建重复任务或在TASK-025内静默实现；应先完成TASK-025证据归档，再依据本次完整本地复算决定是否以新证据重开TASK-007的设计/收益门。当前不宣称persistent版本必然加速。
