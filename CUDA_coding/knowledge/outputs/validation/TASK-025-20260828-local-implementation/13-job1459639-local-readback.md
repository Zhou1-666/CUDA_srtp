# TASK-025 job1459639 smoke本地回收与独立复算

状态：`LOCAL SMOKE EVIDENCE PASS（非正式性能结论）`。

2026-08-28，用户通过既有SSH客户端文件管理器将`TASK-025-1459639-pinned-smoke-v2-evidence-v1.tar.gz`下载到仓库根。执行人先只读核验、再复制到永久`raw/`并解压到全新同名目录；仓库根下载件保留，未覆盖或删除任何文件。

## 归档与路径

- 根下载件和永久[`raw`副本](raw/TASK-025-1459639-pinned-smoke-v2-evidence-v1.tar.gz)均为1670800字节、SHA-256 `3a0e52953792e93760688b7c17ca3bdeaad0c5626969d32dcd1dc4b538834736`；
- 157个归档路径全部位于唯一顶层`TASK-025-1459639-pinned-smoke-v2-evidence-v1`，无绝对路径、盘符、反斜杠、`.`/`..`段或重复项；157个条目类型均只为普通文件/目录；
- 永久解包目录为[`raw/TASK-025-1459639-pinned-smoke-v2-evidence-v1`](raw/TASK-025-1459639-pinned-smoke-v2-evidence-v1)。

## 清单口径

- 外层`SHA256SUMS.txt`的117项逐项存在且SHA一致；
- 解包目录共有119个文件：117项payload、外层清单自身，以及嵌套`smoke/SHA256SUMS.txt`；
- 远端打包命令使用全局`! -name SHA256SUMS.txt`，因此嵌套清单没有列入外层117项。这一口径差异被保留，不改写证据；嵌套清单仍受整个tar.gz的远端/本地SHA保护；
- 嵌套清单为6495字节、SHA `baf0ba3ce903ac85496220f7d0d9ee9dac7df64eb1dd8037caf3062464fb7b89`，其中53项逐项SHA通过；wrapper清单4项也与本地文件一致。

## 独立内容复核

- `job-status.txt=TASK025_SMOKE_JOB_RC=0`，`smoke/status.txt=TASK025_RC=0`，最终`sacct`三层均`COMPLETED/0:0`；
- 提交wrapper SHA `205af552…3022b`、pageable源码 `4e12f11e…79ee`、pinned源码 `da4282a3…dcd1`、runner `d58a0914…17c70`、独立审计器 `5adc8315…db01`均与冻结值一致；
- launch plan和exit code均为12项、ID逐项一致、全部退出0；pageable/pinned各6次，plain/profiled各6次，配置正好为P1/22、P2/22、P2/28；
- rank 0/1映射到同一节点的两个不同GPU UUID；20份rank CSV共60行；
- 使用冻结本地审计器从解包后的原始CSV重算，pageable/pinned均`PASS runs=3`，除绝对根路径归一化外与已存JSON深比较一致；
- 最大RMS、L∞和cross分别为`9.616896415862582e-15`、`1.3211653993039363e-14`、`6.994405055138486e-15`，均小于冻结阈值`1e-10`。

首次调用本地Node深比较时，一次性命令末尾多写一个`}`，Node在读取CSV前即语法失败；定位到该命令自身后仅删除多余括号，先单独验证两套audit，再完整重跑全部门禁通过。证据文件、审计器和求解器均未修改。

本回执只接受小规模NVHPC构建、双A100映射、pinned无显式回落、正确性和协议smoke。它不能证明pinned比pageable更快，也不支持跨节点、完整CFD或通用扩展性结论。TASK-025保持`in-progress`；下一步仅本地准备正式A/B wrapper和冻结包，不自动提交GPU作业。
