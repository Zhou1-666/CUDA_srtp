# TASK-023 正式验证频率修正与单配置探针包

日期：2026-08-27，关闭决定：2026-08-28。状态：`done`；job1457454正式单节点A100对照、完整证据包本地安全回收和独立复算均已通过，用户已明确批准冻结支持范围并将其余SOP门禁记录为任务范围外。

## 原因与边界

job1456509 在一小时上限到达时只完成了 P1/28 的 13 次启动，第14次被截断。静态回溯和时间线表明，主因是 diagnostic 模式在十个迭代中的每一次都执行两次完整 512 MiB D2H、两次解析误差扫描和一次互差扫描，而非求解器计时、MPI错误或GPU容量失败。原失败证据继续保留在 [formal runner 回执](../TASK-023-20260827-formal-runner/README.md)，没有覆盖或改写。

经用户批准，本次仅把每个独立启动的完整 host 正确性/互差检查调整为首、末两个迭代；十条 solver timing 行全部保留，输入仍在每次迭代重建。新增 `formal-probe`，只运行一次 `256x256x1024`、P1/28、plain/profiled、各十迭代的正式规模配对，用于在重交完整矩阵前实测端到端成本。

没有修改五对角求解器、`1e-10`精度门槛、通信后端、绑定方式或数值算法。探针结果只用于资源与协议判断，不作为完整正式对照、提速、跨节点、CUDA-aware或CFD结论。

## 文件差异

包从冻结的 `TASK-023-20260826-nsight-preflight-v1` 派生。逐文件比较只有以下差异：

- 修改 `source/perf_bench/benchmark_penta.f90`；
- 修改 `source/verify/run_task_023_diagnostics.sh`；
- 修改 `source/verify/TASK023-diagnostics.md`；
- 新增 `source/verify/test_task023_formal_validation.py`；
- 新增 `source/verify/task023_formal_probe.slurm`。

其余文件逐字节不变。包内求解器 SHA-256 为 `55173a7b2fb92c2fd19dbdba8a32e320adb23fbaf12701364f7c6690509a1309`，与 v1 一致；benchmark 中五处 `1.d-10` 门槛仍在。

## 本地验证

- 新测试先对旧验证表达式失败，修改后 5/5 通过；探针模式和Slurm包装也分别经历缺失失败后通过。
- 暂存包 `test_task023_formal_validation.py`：5/5通过。
- 暂存包 `task023_diagnostics_audit_test.js`：68/68通过。
- 既有五对角独立检查：72项独立数学、756项28槽、180项22槽及索引边界检查均通过；具体结果来自修改后的隔离工作树验证记录。
- `git diff --check` 对本次变更文件退出0；求解器哈希未变。
- Windows上的`bash.exe`是不可用的WSL入口，因此未把本机`bash -n`写成通过；必须在超算登录节点复验脚本语法和包内测试。

## 冻结归档

- 文件：`TASK-023-20260827-formal-validation-v2.tar.gz`
- 字节数：`58326`
- SHA-256：`176e21aeaab1325ffaf1b34078ec1a9a61dd5d9dc6688ac732d3d30af2652bf2`
- 归档条目：29，危险路径：0
- 内部清单：23项，原目录与全新解包副本均为0失败

## 下一步

用户通过现有SSH文件管理器把归档上传到 `/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-023/packages/`，同名存在时停止，不覆盖。先只核对归档 SHA；通过后再逐步做安全路径、全新目录解包、内部清单、`bash -n`及测试，最后才单独提交20分钟单GPU探针。当前不直接重跑完整formal矩阵。

## 远端上传更新

用户随后回贴上一条冻结SHA核验“输出ok”，见[上传SHA回执](04-remote-upload-sha-ok.md)。这只确认远端压缩包字节一致；未补造独立退出码，也未提前写成解包、Linux测试或GPU探针通过。下一步在新目录中完成安全路径、内部清单、脚本语法及包内测试预检。

后续严格预检只输出`ARCHIVE_PATHS_OK entries=29`后停止，见[部分回执](05-remote-preflight-partial.md)。当前仅确认归档路径门禁通过；内部清单、语法和测试仍未知。保留已创建目录和日志，下一步只读定位停止点，不重复解包。

只读诊断随后确认解包结构正确（29行manifest、24文件、0链接），但内部23项都因`SHA256SUMS.txt`的CRLF末尾被Linux当成文件名字符而失败；Python/Node测试尚未运行。见[根因与LF1修正](06-crlf-root-cause-and-lf1.md)。新名称LF1包保持22个source文件逐字节不变，只修正传输清单行尾并更新包说明；本地清单、测试和全新解包回环均通过。后续不得再使用原v2包提交作业。

用户随后回贴LF1冻结SHA核验“ok了”，见[LF1上传回执](08-lf1-remote-upload-sha-ok.md)。仅确认新归档字节一致；下一步用全新LF1目录完成安全解包、内部清单、Linux语法和包内测试，原v2失败现场保持不动。

LF1严格预检随后确认29项路径、纯LF、23项内部SHA、solver SHA和6文件Bash语法全部通过，但在工具/测试阶段停止，见[部分回执](09-lf1-remote-preflight-partial.md)。当前只读检查Python/Node及测试日志，不重复解包，也不提前提交GPU探针。

只读日志确认Python 3.7.9可用，而登录shell没有Node；命令在`command -v node`处停止，测试均未开始。见[Node路径诊断](10-lf1-node-path-diagnosis.md)。冻结脚本已显式使用此前验证过的私有ARM64 Node v22.23.2，下一步只用该准确路径写入新的续验日志，不安装软件或覆盖旧日志。

续验最终回贴Node v22.23.2、5/5 Python、68/68 Node及`TASK023_LF1_LOGIN_PREFLIGHT_PASS`，见[完整通过回执](11-lf1-login-preflight-pass.md)。登录节点门禁已闭合；当前尚未提交或使用GPU。下一步只提交冻结的单GPU/20分钟正式规模探针一次，不运行Nsight或完整矩阵。

用户随后回贴`Submitted batch job 1457303`，见[提交回执](12-job-1457303-submitted.md)。只确认Slurm接受单GPU/20分钟探针；状态、节点、计算节点门禁及结果待查询，不重复提交。

`sacct`随后确认job1457303主作业、batch和extern均`COMPLETED/0:0`，在`paraai-n32-h-01-agent-8`运行2分51秒，见[Slurm完成回执](13-job-1457303-slurm-completed.md)。当前只关闭调度状态；内部probe状态、GPU、原始CSV、误差、audit和SHA仍待只读验收。

[完整回读](14-job-1457303-full-readback.md)随后确认外/内状态0、A100 40GB、两个启动rc0、两份CSV、两层SHA及audit pass。十轮plain/profiled均值为8.0228/8.0451 ms，扰动0.2785%；排除前两轮后为7.6181/7.6403 ms，扰动0.2921%。误差保持`1.4532e-13/1.9662e-13`，cross为0。probe验收通过，但单配置单启动不能代替完整正式矩阵或支持28/22、P1/P2提速结论。

依据probe墙钟，新的[完整矩阵包装](16-formal-v2-wrapper-prepared.md)采用2小时保守上限，协议仍为56次启动且只接受LF1包。静态合同TDD、LF和尾随空白检查通过；当前尚未上传或提交。

用户随后回贴wrapper SHA为OK且远端`bash -n`最终`TASK023_FORMAL_V2_UPLOAD_PREFLIGHT_PASS`，见[上传预检回执](17-formal-v2-remote-upload-preflight-pass.md)。包装已具备提交条件，但尚未提交或使用新GPU资源。

用户随后回贴`Submitted batch job 1457454`，见[提交回执](18-job-1457454-submitted.md)。只确认Slurm接受完整矩阵v2作业；当前待状态和结果，不重复提交。

首次状态回贴显示job1457454为`PENDING (Priority)`，尚无节点/GPU分配；调度器当时估计`2026-08-28 21:20:35`开始，但可能变化。见[排队回执](19-job-1457454-pending.md)。当前只等待，不取消或重投。

后续`sacct`回贴确认job1457454主作业、batch和extern均`COMPLETED/0:0`，在`paraai-n32-h-01-agent-149`运行42分15秒，见[Slurm完成回执](20-job-1457454-slurm-completed.md)。这只关闭调度状态；56/56启动、内部状态、CSV、audit和SHA仍待只读验收，TASK-023保持review。

[内部只读核验](21-job-1457454-internal-readonly-check-pass.md)随后确认外/内状态0、双A100 UUID和容量、精确56启动顺序、56/56退出码0、84个rank CSV、stored/recomputed audit及201+5项SHA全部通过。当前只关闭远端内部门禁；仍须创建不可覆盖证据包、下载、本地安全解包和独立统计复算，尚不形成正式性能结论。

[远端证据包](22-job-1457454-evidence-package-created.md)随后以新名称创建并自检：1293339字节、362个安全条目、262项payload manifest，SHA为`69c18f00…8180a2`。原始运行目录未删除或覆盖；当前包尚未下载到本地，TASK-023保持review。

首次从Windows OpenSSH直接`scp`因集群内节点名无法由本机解析而在连接前失败，见[传输失败回执](23-local-scp-dns-failure.md)。本地未产生部分文件，远端包未被触及；下一步使用已有SSH客户端文件管理器下载，不猜测主机、端口或跳板参数。

用户随后通过既有SSH客户端完成下载。[本地回读和独立复算](24-job1457454-local-readback-and-recompute.md)确认外层SHA、362项安全路径、262/262外层清单、201/201 formal、5/5 wrapper和10/10 source清单全部通过；56/56启动、84个rank CSV、stored/recomputed audit、冻结solver/wrapper及误差门均闭合。plain正式结果中，P1的28→22差异仅千分之一级；P2五个配对方向一致，稳定8轮配对变化中位数为`-14.5045%`，只适用于本次单节点双A100、host staging/TCP固定配置。

[最终合同复核](25-TASK-023-final-contract-review.md)将正式测量合同判为PASS。本候选L4不均匀、L6生命周期/sanitizer、L7跨节点和TASK-010候选库重链未运行；用户于2026-08-28明确批准将交付范围冻结为单节点、P=1/2、host staging/TCP诊断与正式对照，并把这些门禁记录为任务范围外。TASK-023据此关闭为`done`，但范围外项不是PASS。唯一推荐下一任务为TASK-025；本次不启动、不申请/提交GPU作业。
