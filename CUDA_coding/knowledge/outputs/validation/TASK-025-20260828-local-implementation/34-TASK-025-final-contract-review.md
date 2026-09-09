# TASK-025最终合同复核

状态：`PASS / done / do-not-adopt current candidate`。

## 合同逐项复核

- 单变量：只比较per-call pageable与pinned host staging；算法、API、数值阈值、22/28布局和plan生命周期未改变；
- pinned真实性：候选使用CUDA Fortran pinned分配状态并在回落时显式失败；smoke/formal均未触发回落失败；
- 目标环境：formal-v2 job1459808在单节点双A100-PCIE-40GB、P=2、`256×256×1024`、host staging/TCP固定配置完成；
- 重复合同：22/28槽、pageable/pinned、plain/profiled，2次预热+5次正式配对，共56/56启动、全部退出0；
- 正确性：最大误差`3.5216274341109965e-13`，通过`1e-10`冻结阈值；
- 采用门：22槽0/5更快且中位回退11.8472%，28槽1/5更快且中位回退4.1233%，三项采用门失败；
- 来源与归档：冻结源码/wrapper、双层状态、双GPU映射、409路径、301/233/6项分层清单及本地独立audit/pairs/decision/阶段复算全部通过。

因此TASK-025合同已经完成，负结果同样构成`done`：当前“每次调用临时分配/释放pinned staging”候选不采用，不合并到主实现。候选worktree和脏改动保留用于追溯；未执行reset、commit、merge或push。

## 支持与不支持的结论

支持：在本次冻结配置中，pinned使D2H/H2D阶段明显缩短，但每调用锁页allocate/free与等待抵消收益，plain端到端反而回退。

不支持：不得外推到跨节点、其他MPI/网络、完整CFD、所有problem size、所有pinned实现或plan持久复用；profiled阶段不能相加成精确关键路径，MPI计时包含等待。

## 去重后的后续方向

TASK-025的新allocator/路径证据使pinned allocate+free诊断中位占比达到22.146879%/23.213614%，满足ADR-005写明的“实现/分配器/路径改变且达到5%门槛”重开条件。唯一推荐下一任务是**重开既有TASK-007**，而不是新增重复编号：先冻结plan所有权、容量变化、communicator/布局变化、并发、回滚与失败合同，再以TDD实现长期复用pinned staging并做同输入端到端A/B。该推荐不等于实现已批准或必然加速，本轮不启动下一任务。

推荐执行/审阅：GPT-5.6 Sol / XHigh，独立审阅同强度；任何plan字段或create/clean变化同时重开TASK-016生命周期门禁。

## 完成前新鲜复验

- 冻结formal-v2包的非runner Node集合：80/80通过、0失败；源码合同单独PASS；
- runner-stdin行为：冻结包远端正式预检1/1通过且无残留，随后同一runner完成job1459808的56/56启动；本轮Windows执行器复跑时输出回收异常，临时目录最终自动清理，未据此替代目标环境证据；
- 四项Bash语法：runner、rank mapping、smoke wrapper、formal wrapper全部通过；
- `check_all.ps1`：Knowledge lint、8项数学脚本和6项容量自检全部PASS；
- 最终`git diff --check`只允许既有行尾提示，不允许whitespace error。
