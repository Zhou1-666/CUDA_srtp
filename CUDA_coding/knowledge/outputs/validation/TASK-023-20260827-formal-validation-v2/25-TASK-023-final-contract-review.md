# TASK-023 最终合同复核

日期：2026-08-27，关闭决定：2026-08-28。结论：job1457454正式A100对照及本地证据回收验收通过；用户明确批准将TASK-023范围冻结为单节点、P=1/2、host staging/TCP的诊断与正式对照，并将本候选L4不均匀、L6、L7和TASK-010重链记录为任务范围外。TASK-023据此关闭为`done`；范围外项不是PASS。

## 已完成的正式对照

- job1457454主作业、batch、extern均为`COMPLETED/0:0`，节点`paraai-n32-h-01-agent-149`，耗时42分15秒。
- 单节点两张不同UUID的A100-PCIE-40GB，FP64、host staging/TCP、`256×256×1024`；P=1/2、28/22槽、plain/profiled、每组2次预热和5次正式独立启动、每次10轮，共56/56启动且退出码全0。
- 84个rank CSV、56个stdout、stored audit 20组和本地从原始CSV重算的measured 20组/warmup 8组均通过。
- 证据包1293339字节，SHA-256 `69c18f004910093fc112917fdab8a0ee91f4cb0a3c152364a4b28645fa8180a2`；362项归档路径安全。外层262/262、formal 201/201、wrapper 5/5、source 10/10清单均无缺失或哈希不符。
- 实际构建solver SHA为`55173a7b2fb92c2fd19dbdba8a32e320adb23fbaf12701364f7c6690509a1309`，与LF1冻结输入一致；提交wrapper SHA为`3d7c43774643f2bad54e4b6295d0492f8c0c5d8359161589a1f2bd7df1ecebca`。
- 最大RMS/L∞/cross误差分别为`1.8501744902198585e-13`、`2.6401103525586223e-13`、`3.5216274341109965e-13`，均低于冻结`1e-10`。

统计与限定解释见[本地回读和独立复算](24-job1457454-local-readback-and-recompute.md)及[机器可读摘要](local/job1457454-analysis-summary.json)。正式plain结果显示：P1的28→22差异仅千分之一级，不能主张实质加速；P2五个配对方向一致，稳定8轮配对变化中位数为`-14.5045%`，只支持本次单节点双A100、host staging/TCP固定配置结论。P2诊断扰动波动较大，profiled数据只用于阶段归因，不校正plain结果。

## 当前SOP逐门禁判定

| 门禁 | 状态 | 判定依据 |
| --- | --- | --- |
| L0 静态/指纹 | PASS | 变更边界、冻结solver/wrapper/package SHA、普通路径不变审查和知识lint均已归档。 |
| L1 数学/容量 | PASS（复用并新鲜复核） | 2026-08-27本地`check_all.ps1`：8项脚本0失败、容量6例0失败；诊断变更未改数值核、布局或阈值。 |
| L2 目标构建 | PASS（任务合同范围） | 正式包在NVHPC 24.5/OpenMPI 4.1.7a1/CUDA 12.4目标环境全新构建，源码清单和实际solver SHA闭合；未单列同候选debug构建。 |
| L3 单GPU | PASS（任务合同范围） | job1457303及job1457454的P1、28/22、plain/profiled、真值与交叉误差通过。 |
| L4 单节点多GPU | 部分PASS | 两个物理A100 UUID、P2、28/22、plain/profiled和正式规模通过；不均匀分解只在此前单RTX4060双rank功能回归，不是目标双GPU候选回归。 |
| L6 生命周期/sanitizer | NOT-RUN（本候选） | TASK-016的28/22各100次和sanitizer属于更早普通求解器版本；未覆盖TASK-023新增profiled诊断路径的本候选。 |
| L7 跨节点正确性 | NOT-RUN（本候选） | job1457454为单节点；历史TASK-009跨节点证据不绑定TASK-023诊断候选。 |
| TASK-010候选库重链集成 | NOT-RUN | 普通生产solver经只读差分保持不变，但未用TASK-023候选库重新链接并执行冻结32例。 |
| 性能/诊断合同 | PASS | 正式56启动、绝对时间、误差、启动波动、plain/profiled扰动、每rank方向阶段、映射和原始CSV均完成并可复算。 |
| 审查/归档 | 部分PASS | 既有代码独立审查和本次原始证据复算完成；尚缺对上述NOT-RUN门禁的明确用户范围批准或补测。 |

## 状态决定

当前证据足以接受TASK-023的正式单节点A100测量合同。用户于2026-08-28回复`ok`，明确确认上一条完整范围文字：将交付范围冻结为“单节点、P=1/2、host staging/TCP、诊断与正式对照”，并把L4目标双GPU不均匀、L6、L7和TASK-010候选库重链记录为本任务范围外。因此TASK-023标为`done`；这些范围外门禁仍为NOT-RUN/部分PASS，不能在后续候选中继承为已通过。

本地曾发现整个`.worktrees`目录被移入`.agents/.worktrees`，导致TASK-010/023两项Git登记显示`prunable`；实体目录、分支和脏改动均仍完整。经用户明确批准，2026-08-27将该目录原样移回仓库根`.worktrees`，未执行`git worktree repair/prune`或清理。恢复后两项登记均不再显示`prunable`，TASK-023仍为`codex/task023-direct-diagnostics`，3个已跟踪修改和15个未跟踪文件原样保留，源码SHA仍为`4e12f11e…dfe79ee`；TASK-010保持干净。这不影响已冻结远端输入和永久证据包。

关闭决定不改变求解器算法、接口、阈值，也不把结果扩张为跨节点、CUDA-aware、完整CFD或通用扩展性结论。唯一推荐下一任务为TASK-025（GPT-5.6 Sol / High），仅推荐并转为`ready`，本次不启动、不申请GPU。
