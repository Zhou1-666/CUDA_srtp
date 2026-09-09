# 五对角活动上下文（2026-09-08 迁移前快照）

> 历史快照，不是活动入口。原文中的当前/下一任务及授权仅属于原记录；实时状态见 [task-queue](../../../meta/task-queue.md)，具体缺口见 [blocker](../../../meta/task-blocker-register.md)。
>
> 活动页：[原路径](../../../wiki/briefs/penta-active-context.md)；[原始字节](raw/before/penta-active-context.md.txt)；[迁移回执](README.md)。原文正文不改写，仅重定位相对链接并补全已有 Markdown 文件的扩展名。原文件 SHA-256：cac1a60cbe76ab064f5ca9f23a55c16a4807c8c94934a4d277f81adce29be5f9。

## 原始元数据（历史）

~~~yaml
---
id: KB-BRIEF-PENTA
type: brief
status: reviewed
scope: active
updated: 2026-09-08
confidence: high
source_ids: [SRC-003P, SRC-004, SRC-005, SRC-007, SRC-014, SRC-019, SRC-020, SRC-021, SRC-024, SRC-029, SRC-030, SRC-031]
---
~~~

## 原文正文


# 五对角活动上下文

> **2026-09-08 只读优化预审：** 用户批准的[源码审计](../../reviews/20260908-cuda-penta-readonly-audit/README.md)已交付；14个生产例程工作区/v7一致、诊断部分不同，历史per-call pinned回退由40份CSV复现。候选优先为长期pinned、update行并行，其次回传复制/launch减少；速度均待新实验。SRC-029原包缺失，donor逐函数审查未完成。未改solver/冻结包/远端；TASK-031/job1483542调度与验收缺口、唯一下一软件任务不变。

这是普通编码任务的默认入口。除非任务明确触发参考条件，AI 只处理五对角实现，不加载三对角源码、整篇论文或全量知识库。

开发边界：三对角程序冻结为参考基线，不开展新功能、性能优化或独立研究；只有共享缺陷、构建/API 兼容、上游核验和发布回归可以修改。软件成果、性能实验和论文贡献全部以五对角扩展为主线。

## 当前目标

> **2026-09-08 当前：[第29节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#29-节点报告已分配但占用作业查询为空)确认调度详情，等待管理员解释。** job1483542 PENDING/Priority=1、已Eligible、2h、固定149、NodeList空；默认方式被调度器记为请求mem=219904M，尚无实际allocation。149报告128CPU/4GPU全部ALLOCATED，但占用作业查询仅表头，三项rc0；隐私/过滤/状态差异原因未证，仍无可靠ETA。唯一下一动作由用户转发已备管理员询问稿并回贴答复，助手未发送；不改节点/参数或重投。TASK-031/in-progress，GPU未验收，gpt-6-astra/XHigh。以下待三项查询为历史。

> **2026-09-08 当前：[第28节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#28-job1483542预计启动时间异常遥远)记录job1483542预测启动在2027-09-08。** 查询时本地2026-09-08 15:33:18 CST，预测2027-09-08T14:42:52、PD/Priority、SCHEDNODES null、rc0；相距约一年，不能当成保证等待时长。唯一下一动作只读核job限制、固定agent-149现有作业时限与节点状态，原因未证，不再仅重复等待。单次提交已消耗，不改节点/参数、不取消重投；TASK-031/in-progress及GPU未验收保持，gpt-6-astra/XHigh。以下仅等待为此前动作。

> **2026-09-08 当前：[第27节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#27-job1483542因优先级排队)确认job1483542为PENDING/Priority。** 两项查询rc0、None assigned，回查时尚未启动GPU。三份JSON仅还原聊天转义后bytes/SHA全部匹配：sbatch status0/空stderr、无显式mem、三项内存环境继承/有效均未设置。接收证据已直接补齐；实际分配/GPU仍待验收。唯一下一动作等待调度后只读readback，禁止重投或清理意图；TASK-031/in-progress、gpt-6-astra/XHigh。以下调度UNKNOWN/原JSON待回收为此前快照，完整远端日志缺口仍保留。

> **2026-09-08 当前：[第26节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#26-control-v4单次提交已接收)确认control-v4已接收为job1483542。** SUBMITTED_ONCE、batch导出rc0及COMMAND_RC0齐全，单次授权已消耗。唯一下一动作是job1483542只读readback并回贴全文；调度/运行状态及实际内存待核、GPU未验收。TASK-031仍in-progress，gpt-6-astra/XHigh；下列待批准/待执行/未提交为历史，禁止重投、部署/preflight或清理意图。

> **2026-09-08 当前：control-v4单次提交已批准，执行回执待回收。** [第25节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#25-control-v4单次提交批准与交接)记录用户“批准这一次提交”。授权缺口已解除；唯一下一动作在既有SSH执行绑定已通过预检SHA的固定单次命令，4GPU/4rank/128CPU/2h/default-memory不变，随后回贴全部输出。当前没有新job ID或GPU结果；TASK-031仍in-progress，推荐gpt-6-astra/XHigh。下列待确认/待部署/待预检均为历史；不重复部署、预检或提交，失败/不确定保留意图与全部回执。

> **2026-09-08 当前：control-v4真实预检PASS，未提交。** [第24节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#24-control-v4真实预检通过)归档14465字节用户附件（SHA64b3d386…d5b430）：20项QUERY全部符合预期，model-reject的rc2正常、两项查重空，最终PASS/NO_SUBMISSION/COMMAND_RC0齐全，选中忙节点agent-149。PREFLIGHT_SHA815275e0…6bcd63；按冻结控制流已越过旧拒绝原件/构建/工具身份门，未独立下载远端原件。唯一下一任务仍TASK-031：确认绑定本次预检的4GPU/4rank/128CPU/2h单次提交；命令已准备，未执行。不得重跑部署/预检或清理旧意图。本站默认内存接受、实际分配与v7 GPU仍未验收；L2用户回执PASS、in-progress及其余SOP缺口保持。以下待上传/待预检描述为历史。

> **2026-09-08 当前：control-v4本地交付，待真实预检。** [第23节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#23-control-v4本地实现与冻结交付)记录用户批准后的默认内存辅助修复：gpus/gpus-per-node固定四卡、提交子环境三项内存清除、精确绑定v3已证拒绝、原防重与job实际内存核验。审查发现数组环境可扩大单作业范围，已RED/GREEN修复并复核。62项本地测试及语法/tar往返/71项源payload通过，18284字节新包；源v7及v1–v3保留。唯一下一任务仍TASK-031：上传辅助包并执行固定非覆盖、只到preflight的命令，回贴完整A类证据；未SSH/上传/提交，v4真实预检和v7 GPU NOT-RUN。L2用户回执PASS、in-progress及debug/跨节点/性能/原件缺口保持。以下待设计确认等旧动作保留为历史。

> **2026-09-08 当前：内存请求有界设计待确认。** [第22节范围审计](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#22-内存请求有界修复范围审计)核实旧成功命令用gpus/gpus-per-node，v3用gres；提交环境继承且未处理三项SBATCH内存变量，allocation尚未核本job内存。推荐恢复旧成功GPU表达和默认主机内存，限定子进程清除三项内存覆盖、精确绑定v3已证拒绝并保留即时查重；资源总量/节点门/运行门不变。已完成文档准备，未创建control-v4或提交。唯一下一任务仍TASK-031：确认范围后本地实现与回归；L2用户回执PASS、v7 GPU NOT-RUN、in-progress保持。以下旧动作按各自日期/阶段理解。

> **2026-09-08 最新：control-v3因本站内存政策被明确拒绝。** [第21节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#21-control-v3被站点内存策略拒绝与交接)记录sbatch status1/空stdout/Lua每卡55GB主机内存拒绝、显式--mem=219904M、job-id缺失及提交后两项空查询/rc0。本次未入队/未运行GPU；上一轮UNKNOWN已解除，97不是GPU错误。旧成功四卡提交不显式指定mem，默认内存方式是下一轮优先核验方案，尚未实施或验证。唯一下一任务为TASK-031 v7包外内存请求策略有界修复的范围确认；保留旧意图/回执，禁止原地重跑或换名绕过防重。L2用户回执PASS、v7 GPU门NOT-RUN、TASK-031/in-progress保持；以下旧回查/提交动作均为历史。

> **2026-09-08 最新：control-v3真实预检通过，提交回执不确定。** [第20节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#20-control-v3真实预检通过与提交回执不确定)记录用户回贴：选中agent-149、预检PASS；随后sbatch回执判据未通过，控制器返回97，无可确认job ID。提交前查重为空不能证明提交后无作业，实际调度/运行状态UNKNOWN；v7目标验收仍NOT-RUN/未确认，不记为GPU失败。唯一下一动作只读保存的sbatch-result.json等记录及提交后squeue/sacct，禁止重跑部署/提交、删除意图或换名重投。L2用户回执PASS、TASK-031/in-progress保持。以下上传/待预检及“未提交”是此前快照，不再作为当前动作。

> **2026-09-08 当前control-v3排队修复已交付：** [第19节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#19-control-v3兼容忙节点排队修复)。用户批准兼容忙节点排队；新15770字节辅助包、44个本机测试/组及独立只读审查通过。仅149/28/27选一台，空闲优先、全忙按既定顺序排队；原4GPU/128CPU/2h、查重与上机门不变。两代旧日志和源v7保留。唯一下一动作上传小辅助包并运行固定“真实预检成功才单次提交”命令，无需再手动等IDLE。远端新版尚未执行/无新job ID；v7 GPU门NOT-RUN、L2用户回执PASS保持、TASK-031仍in-progress。以下第18节等旧动作保留为历史，以本段及queue/blocker为准。

> **2026-09-08 当前control-v2停在节点资源门：** [第18节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#18-control-v2真实预检资源门拒绝)。用户附件确认工具包SHA通过、nvidia-smi已延至allocation，19次QUERY均符合预期（容量reject为预期rc2），两项查重为空。候选149/28/27均ALLOCATED、CPU128/128、GPU4/4；故原控制器拒绝并返回97，未提交/未排队/无新GPU结果。下一动作仅稍后只读刷新这三个候选节点；当前idle前置来自脚本，不代表Slurm禁止排队。完整预检尚无最终PASS；保留现有control-v2和runs-v7-control-v2证据，不重传/重跑bootstrap或submit。资源解除后需保留原证据并有界续接，不能原地覆盖日志。v7 GPU门NOT-RUN、L2用户回执PASS不变、TASK-031仍in-progress。以下待上传及工具根因待验证为历史。

> **2026-09-08 当前control-v2工具边界修复已交付：** [第17节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#17-v7-control-v2登录工具边界修复)。用户诊断确认module purge/load与五项Slurm路径正常，登录PATH在nvidia-smi查询处rc1；根因是旧辅助脚本把计算节点工具误列为登录必需。control-v2本地已修复并通过34个测试/组，登录只检查五项调度工具，计算节点再解析/记录nvidia-smi身份并保留原四卡/驱动门。新辅助包15458字节/SHA `31903911…d8a3d77`，新根runs-v7-control-v2；旧包/runs-v7及源v7不变，旧执行状态与同名作业查重不豁免。唯一下一动作上传新辅助包并执行固定v2真实登录预检，未通过前不提交。v2远端与v7 GPU门NOT-RUN、L2用户回执PASS保留、TASK-031仍in-progress；以下旧待定位/上传v1描述为历史。

> **2026-09-08 当前v7登录预检返回1：** [第16节回执与只读诊断](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#16-v7-真实预检返回1待定位)。用户摘录确认辅助包3文件SHA通过、control stage已建立，随后`COMMAND_RC=1`且无最终预检PASS。按固定脚本推断停在entry初始化范围；module日志重定向、工具查询无失败提示是已确认的可诊断性缺口，具体失败项尚待远端原文。唯一下一动作读取既有module日志并带阶段标记重查模块/工具路径；保留control stage/runs-v7，不重复解包或预检、不提交。L2用户回执PASS保留，v7 GPU门NOT-RUN，TASK-031仍in-progress。以下上传/预检等待描述为历史。

> **2026-09-08 当前v7 correctness包外工具已交付：** [第15节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#15-v7-correctness-包外工具已交付)记录用户批准后的本地实现与验证：15项控制测试、3组/45份旧真实日志回放、9项WSL启动/提交替身集成均通过，独立审查认可交付。新辅助工具包15038字节，v7源码包及六子门不变；实际MPI逐rank UUID/目标SHA收据、独立数值审计与单次提交保护已实现但尚无目标运行证据。唯一下一动作是上传辅助包并执行固定真实登录预检（不提交GPU）。L2仍为第13节用户回执PASS，A类集群预检及全部v7 GPU运行门NOT-RUN、v5完整L6历史FAIL、TASK-031仍in-progress。以下“待批准/尚无脚本”等当前措辞均为历史。

> **2026-09-07 当前v7 correctness设计待确认：** [第14节](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#14-v7-correctness-gpu-回归设计待确认)已审计冻结六子门：1节点4GPU/4rank，L2用户回执PASS不变；debug仅构建未运行、srun不等于实际mpirun绑定、stability未显式选卡及旧数值判据缺口均明列，不凭六子门PASS关闭全部SOP。唯一下一动作用户确认有界设计后生成/测试包外单次提交、回查与独立审计工具；不改v7、不重复独立构建、不自动提交。当前无新脚本/作业、全部v7 GPU门NOT-RUN、v5完整L6历史FAIL、TASK-031仍in-progress；以下待准备合同的表述为历史。

> **2026-09-07 当前v7实际干净构建通过：** [第13节用户回执](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#13-v7-远端-nvhpc-干净构建通过)确认6次make全部rc0、40条编译链接、12个程序、原stage及4副本前后10次manifest rc0、总PASS/COMMAND_RC0。L2本合同范围PASS（用户回执，完整远端日志尚未独立回读）；GPU_RUN=0，全部v7 GPU运行门NOT-RUN、v5完整L6历史FAIL、TASK-031仍in-progress。唯一下一任务准备v7 correctness GPU回归合同，将完整构建证据只读回查并入输入审计；不重建、不改包、不自动提交。未确认的计算节点环境/配额及旧原文缺口保持；以下待构建等当前表述均为历史，以本段及queue/blocker为准。

> **2026-09-07 当前v7干净构建脚本已交付：** 合同已批准，[第12节命令与验证](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#12-v7-nvhpc-干净构建脚本交付)记录真实GNU Make/冻结Makefile的12场景及3份语法通过，NVHPC边界为替身。唯一下一任务是用户在既有SSH执行一次4树debug/release干净构建并回贴，核6次make/40行/12个程序及前后SHA；不改包、不运行MPI/GPU/Slurm。实际L2/GPU仍NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；以下待确认/未生成等叙述为历史，以本段为准。

> **2026-09-07 当前v7真实CUDAFLAG dry-run通过：** [第11节与干净构建合同](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#11-v7-真实工具链与-cudaflag-dry-run-通过)记录NVHPC24.5/HPC-X查询rc0、环境/命令行均4/4、四次dry-run及manifest前后rc0。唯一下一任务是确认NVHPC干净构建合同并准备固定脚本：debug/release与app/benchmark分4树，不改v7包。合同待确认、脚本未生成，实际构建/GPU仍NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；以下dry-run待验等叙述保留为历史，以本段为准。

> **2026-09-07 当前v7登录静态通过：** [用户摘录与工具链交接](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#10-v7-远端登录静态通过)确认Node v22.23.2、GNU Make 4.3、46/46、19语法失败0、runner提交匹配0、manifest前后rc0及PASS/rc0；只关闭模拟边界静态门。唯一下一任务同stage加载NVHPC/HPC-X并运行四条Make `-n -B`，环境/命令行两组均须4/4含目标CUDAFLAG；不实际编译/MPI/GPU/Slurm。构建/GPU仍NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；以下登录静态待验叙述为历史。

> **2026-09-07 当前v7解包/manifest通过：** [用户摘录与登录静态交接](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#9-v7-远端解包与-manifest-通过)确认新stage、72/8/0、7231字节71项LF manifest及六关键SHA一致，PASS/rc0；只关闭部署完整性门。唯一下一任务同stage运行46项Node模拟合同、19项Bash语法、runner无提交匹配及前后manifest；仅建包外唯一私有日志，不编译/MPI/GPU/Slurm。真实dry-run/构建/GPU仍NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；以下解包待验叙述为历史。

> **2026-09-07 当前v7归档清单通过：** [用户摘录与解包交接](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#8-v7-远端归档清单预检通过)确认80路径/80唯一、安全异常0、唯一正确顶层、72文件/8目录/0特殊项及PASS/rc0；只关闭只读归档结构门。唯一下一任务按固定SHA非覆盖解包到新stage并核71项manifest与六个关键SHA；已有stage即拒绝，不删除/覆盖/重试或运行Node/Make/MPI/GPU/Slurm。后续静态/dry-run/构建/GPU仍NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；以下清单待验叙述为历史。

> **2026-09-07 当前v7上传身份通过：** [用户摘录与清单交接](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md#7-v7-远端上传身份通过)确认远端普通非链接文件、166214字节、冻结SHA、UPLOAD_SHA_PASS/rc0。唯一下一任务只读同tar清单，要求80唯一安全路径、唯一正确顶层、72文件/8目录/0特殊项；不解包或运行Node/Make/MPI/GPU/Slurm。后续远端门仍NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；以下本地待上传叙述为历史。

> **2026-09-07 当前v7本地交付：** [有界修复与冻结身份](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md)已完成。共享`Makefile.inc`只将CUDAFLAG普通赋值改为条件默认；真实GNU Make行为测试先RED复现覆盖，再GREEN证明显式cc80/cuda12.4值保留且无显式值仍回退`-cuda`。工作树/最终包各46/46、19语法、7数学及包审计通过；solver、lifecycle、阈值、资源、HCOLL/UCC与v6未改。唯一下一任务只上传v7 tar并核远端166214字节/SHA `1265e0308b64c90c0ae6ddd6a3aa3c9ab3f3294053395a983a376fc36bac0348`；远端静态/dry-run/构建/GPU均NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress。以下v6待修内容为历史，以本段为准。

> **2026-09-07 当前v6工具链/flags结论：** [只读回执与根因判定](../TASK-031-20260907-v6-bounded-hcoll-launch-repair/README.md#11-v6真实工具链可用cudaflag传播阻塞确认)确认NVHPC 24.5/HPC-X/GNU Make工具查询可用，但环境CUDAFLAG被Makefile普通赋值覆盖：环境组0/4含`-gpu=cc80,cuda12.4`，命令行组4/4。阻塞是包内参数传播，不是工具缺失；v6不得直接完整回归。唯一下一任务是v7本地有界修复的批准与合同冻结，不改solver/阈值/资源/HCOLL-UCC或覆盖v6。实际构建及全部v6 GPU门NOT-RUN、完整L6历史FAIL、TASK-031仍in-progress；驱动异构、/tmp、quota和旧原文等独立条件未由本次关闭。以下旧“当前”段落为历史，以本段为准。

> **2026-09-07 当前v6登录静态通过：** [45项合同回执与工具链预检交接](../TASK-031-20260907-v6-bounded-hcoll-launch-repair/README.md#10-v6远端登录静态通过)为Node v22.23.2、45/45、19项语法失败0、runner提交匹配0、manifest前后rc0、PASS/rc0；只关闭登录节点模拟边界静态门，不是NVHPC/MPI/GPU验收。唯一下一动作是同冻结stage只读查询实际module/工具路径与Make dry-run，核环境CUDAFLAG是否被Makefile覆盖；不编译、清理或提交。真实构建及全部v6 GPU门仍NOT-RUN，完整L6历史FAIL、TASK-031仍in-progress。以下旧“当前”段落为历史，以本段为准。

> **2026-09-07 当前v6解包与manifest通过：** [回执与登录静态交接](../TASK-031-20260907-v6-bounded-hcoll-launch-repair/README.md#9-v6远端解包与manifest通过)确认72文件/8目录/0特殊项、7231字节71项LF清单、六关键SHA一致、PASS/rc0。唯一下一动作是同stage的45项Node合同、19项Bash语法及前后manifest检查；仅包外新私有目录写临时测试文件和日志，不申请GPU、不重复解包或改包。登录静态/构建/全部v6 GPU门仍NOT-RUN，完整L6历史FAIL、TASK-031仍in-progress，CUDAFLAG等独立缺口保持。以下旧“当前”段落保留为历史，以本段为准。

> **2026-09-07 当前v6清单预检通过：** [远端回执及非覆盖解包交接](../TASK-031-20260907-v6-bounded-hcoll-launch-repair/README.md#8-v6远端清单预检通过)为80唯一安全条目、72文件/8目录/0特殊项、PASS/rc0。唯一下一任务同一v6包在不存在的新stage解包，核71项manifest和关键SHA；禁止覆盖或失败后自行重试。远端解包/登录静态/GPU门仍NOT-RUN，完整L6历史FAIL、TASK-031仍in-progress，CUDAFLAG等独立缺口不变。以下待上传/待清单是历史，不再重复这些独立步骤；解包命令仍即时核归档SHA。

> **2026-09-07 当前 v6 上传身份已通过：** [用户回贴与第7节交接](../TASK-031-20260907-v6-bounded-hcoll-launch-repair/README.md#7-v6远端上传身份通过)为165601字节、冻结SHA一致、UPLOAD_SHA_PASS/rc0。下一动作仅同包解包前只读清单预检（80唯一安全路径、72文件/8目录），无需重传；通过后再非覆盖解包。远端清单/解包/登录静态/GPU门仍NOT-RUN，完整L6历史FAIL、TASK-031仍in-progress，CUDAFLAG等独立缺口不变。未SSH或新提交；以下“先上传/上传未运行”均是此前交付快照。

> **2026-09-07 当前 v6 本地交付：** [有界修复与新包](../TASK-031-20260907-v6-bounded-hcoll-launch-repair/README.md)已按用户批准完成：HCOLL=0、实际检查器固定身份、双rank独立日志和失败早停；45项完整合同、19项语法及7项数学检查通过，v5/solver未改。job1480694的双rank memcheck仅28槽/1cycle短测通过；v6上传/远端/GPU均NOT-RUN，完整L6保留历史FAIL、TASK-031仍in-progress。唯一下一任务为TASK-031 v6部署身份与真实环境预检：先上传新包，不重投旧诊断/旧包；构建flags偏差及旧原文缺口仍待核对。本轮无新作业，以下待授权等记录均为历史。

> **2026-09-07 当前job1480694：** [调度终态补齐](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-node-v3.md#11-job1480694调度终态补齐)：COMPLETED/0:0，agent-149，11:38:05–11:40:36，运行2分31秒，SACCT_RC=0，与诊断batch rc0一致。关闭HCOLL后的双rank memcheck仅28槽/1cycle短测通过；完整L6仍历史FAIL、TASK-031仍in-progress。部分前段原始日志仍缺，不重投当前诊断。唯一下一任务为TASK-031生命周期启动配置有界修复的范围确认，尚未授权实施或新提交；以下旧状态/动作保留为历史。

> **2026-09-07 当前job1480694：** [提交与只读回查](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-node-v3.md#9-job1480694提交成功与重复提交拒绝)。v3首次提交成功为1480694，SBATCH_RC=0、导出比对后DO_NOT_RESUBMIT、SUBMIT_RC=0；同一回贴末尾第二次submit查到1480694为RUNNING并拒绝，未产生第二次提交，拒绝轮末端rc未贴不补写。唯一动作原v3 readback只读同job，不再submit/上传/取消。实际分配和逐case结果待回收，不能将RUNNING写为Sanitizer或L6通过；TASK-031仍in-progress、完整L6仍FAIL。以下待提交等动作保留为历史。

> **2026-09-07 当前：旧job1480472已取消。** [回执与v3单次提交](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-node-v3.md#8-旧job1480472取消终态与v3单次提交)。旧job1480472已由用户取消：CANCELLED by 72168、2026-09-07T11:28:51、运行0/None assigned，SCANCEL_RC=0、SACCT_RC=0；不是测试失败。v3上传/真实预检已通过，旧v2并跑前置缺口已解除。唯一下一动作由用户执行原v3的submit一次（agent-149/2GPU/2rank/64CPU/15min，内置即时查重和真实预检）；不再取消、不改脚本或重传。v3提交/目标GPU仍NOT-RUN，TASK-031仍in-progress、完整L6仍FAIL；下方待核/待取消及禁止提交的旧动作保留为历史。

> **2026-09-07 v3真实登录预检通过：** [回执与下一动作](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-node-v3.md#7-v3真实登录预检回执与当前动作)。v3上传脚本SHA匹配，30条READONLY调用均rc0、71项manifest及7项输入SHA匹配、历史日志回放SHORT_PASS，最终PREFLIGHT_RC=0。仅A1–A6通过；v3查重/提交/B类GPU仍NOT-RUN，完整L6仍FAIL、TASK-031仍in-progress。唯一下一动作只读查询旧job1480472新状态，不重复上传或单独预检，不submit/scancel；旧job最后PENDING/Priority不是本次实时状态。下方上传/预检未运行等动作保留为历史。

> **2026-09-07 当前节点切换交付：** [v3脚本与预检](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-node-v3.md)。v3（agent-149）本地准备完成，9+38+33项测试失败0、语法rc0；新版本上传/真实预检/提交/GPU均NOT-RUN。旧job1480472最后回贴仍PENDING/Priority、固定已满agent-28，本轮未取消或重投。唯一下一动作上传v3、核SHA并只执行preflight；预检后须先确认旧job状态/处置，再决定单次提交，v3查重不提供跨版本互斥。TASK-031仍in-progress、完整L6仍FAIL；下方较早动态动作保留为历史。

> **2026-09-07 当前：job1480472 PENDING/Priority。** [排队回查](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-parser-v2.md)显示运行0、None assigned，六组NOT-RUN；保存的预检/旧日志回放PASS不属于新GPU结果。等待并稍后短状态查询，终态后同v2 readback，不重投。TASK-031仍in-progress、完整L6仍FAIL；下方提交后状态未知保留为历史。

> **2026-09-07 当前：v2已提交为job1480472。** [完整提交回执](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-parser-v2.md)确认30条真实只读命令rc0、71项manifest/7项输入SHA、旧日志回放SHORT_PASS，sbatch及最终rc0、DO_NOT_RESUBMIT。唯一动作同v2 readback读取新job，不再上传或submit；提交后状态/实际分配/逐case结果尚未回收。TASK-031仍in-progress、完整L6仍FAIL；回放旧日志不是新Sanitizer证据，下方交付动作保留为历史。

> **2026-09-07 当前：** [job1478382根因与v2](../TASK-031-20260905-hcoll-rank-diagnostic/20260907-parser-v2.md)确认普通双rank命令rc0/误差4.4409E-16，r2解析器误读Fortran空白，batch rc4；后五组未执行。独立v2修解析与提交前旧日志回放，33+38项本地检查失败0；唯一下一动作上传一个v2脚本、核SHA后执行内置真实预检/查重的单次submit，沿用已授权诊断。v2目标预检/提交/GPU仍NOT-RUN，TASK-031仍in-progress、完整L6仍FAIL。下方待回查与排队是历史。

> **2026-09-07 最新：** [job1478382终态摘录](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-job1478382-submitted.md)为FAILED 4:0，agent-28运行17秒（08:20:36–08:20:53）。已保存r2的退出4指向普通对照未达SHORT_PASS，按控制流推断Sanitizer尚未到达；具体case/命令rc/根因待日志核验。当前唯一动作现有r2 readback读取同job完整输出，不重投。TASK-031仍in-progress、完整L6仍FAIL；下方PENDING及六组全部NOT-RUN保留为运行前历史。

> **2026-09-06 最新回查：** [job1478382为PENDING/Priority](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-job1478382-submitted.md)，运行0、尚未分配节点，六组NOT-RUN；三份回查文件bytes/SHA匹配、READBACK_RC=0。唯一动作等待并稍后只读同r2 readback，不重投。后面长段PASS是保存的登录预检，不是新GPU结果；TASK-031仍in-progress、完整L6仍FAIL，下方调度未知为历史快照。

> **2026-09-06 job1478382已提交，覆盖以下旧动作：** [最新完整回执](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-job1478382-submitted.md)确认查重/预检通过、sbatch rc0/job1478382、导出比对后DO_NOT_RESUBMIT及最终rc0。唯一下一动作是现有r2 readback只读回查同job；禁止再submit。尚无当前状态、实际分配或GPU结果，不据请求资源宣称已拿到卡。TASK-031仍in-progress、完整L6仍FAIL，其他未达门不变。

> **2026-09-06 r2真实登录预检通过，覆盖以下旧动作：** [完整回贴与判读](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-r2-preflight-pass.md)核对脚本/5项输入SHA、71项清单与30条只读命令rc0，HCOLL默认1/default、环境关闭0/environment，最终预检rc0。下一步是用户手动执行原r2 submit一次，由即时查重和预检决定是否提交；不再上传或单独重跑预检。Codex本轮未申请资源，查重/提交/新GPU仍NOT-RUN；空间恢复、配额和历史附着根因未验证。TASK-031仍in-progress、完整L6仍FAIL，其他缺口不变。

> **2026-09-06 r2本地修复已完成，以下旧动作仅作历史：** 用户已批准，新增不覆盖v1/r1的[r2脚本与交付](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-hcoll-text-r2.md)，只移除四处here-string依赖，85项本地检查失败0，审查反馈已修正复验。唯一下一动作是上传一个r2脚本、核SHA、只执行preflight并回贴；不submit、不重传v5、不清理、不改TMPDIR。r2真实预检/新GPU仍NOT-RUN，不能宣称master-2空间恢复或计算节点附着修复。TASK-031仍in-progress、完整L6仍FAIL，quota已结束且配额UNKNOWN，其他缺口不变。

> **2026-09-06 空间回贴已完整，覆盖以下旧动作：** master-2 `/tmp`容量100%/可用48K，inode仅11%；quota最终rc124并结束，配额UNKNOWN，不再等待或重查。[判读与当前动作](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-r1-temp-space-refusal.md)：确认诊断脚本r2四处here-string输入的有界修复范围；未改代码，不清理、不改TMPDIR、不submit。仅定位登录节点本次预检失败，历史计算节点附着根因仍未关闭。TASK-031仍in-progress、完整L6仍FAIL，新GPU矩阵NOT-RUN。

> **2026-09-06 r1空间错误后的当前指针（覆盖以下较早动作）：** r1上传/输入身份/版本/help读取通过，但Bash第58行创建临时文件报No space left on device，预检rc2/NO_SUBMISSION；本次HCOLL查询尚未到达，新GPU全部NOT-RUN。唯一动作是[同一登录节点空间/inode/配额只读查看](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-r1-temp-space-refusal.md)并回贴，不重传、不submit、不清理。具体耗尽项未知，不能倒推历史附着根因。TASK-031仍in-progress、完整L6仍FAIL，其他缺口不变。

> **2026-09-06 环境变量查询成功后的当前指针（覆盖以下较早动作）：** 用户回贴HCOLL value:0/source:environment/rc0；只是确认查询方式，不是GPU通过。已准备[非覆盖r1修订版](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-hcoll-env-r1.md)，仅修预检传值；GPU设计不变。唯一动作改为上传r1、核新SHA后一次submit并回贴，不再重复旧查询/旧脚本。r1完整预检/提交/GPU均NOT-RUN；TASK-031仍in-progress、完整L6仍FAIL，其他缺口不变。

> **2026-09-06 HCOLL预检回贴后的最新动作（覆盖下方交付快照）：** 新脚本上传和输入身份通过，真实关闭值查询仍default/1，预检rc2并明确NO_SUBMISSION；不是新GPU附着失败。当前只执行[环境变量方式的只读查询](../TASK-031-20260905-hcoll-rank-diagnostic/20260906-preflight-refusal-analysis.md)，核对是否能读到0，不再上传/submit、不改原脚本。新GPU矩阵全部NOT-RUN，TASK-031仍in-progress、完整L6仍FAIL；上游查询代码与回显相符，不把read-only误读为管理员锁死。

> **2026-09-06 TASK-031 当前指针，覆盖本页以下所有较早 TASK-031 动态动作（历史不删除）：** 用户已授权继续管理员之外的有界诊断；[HCOLL/逐 rank 单作业脚本及上传说明](../TASK-031-20260905-hcoll-rank-diagnostic/README.md)已本地准备。当前不是“等待上传 v1/v5 包”，也不是“只能发管理员”：只需上传一个新诊断脚本，核SHA后一次 `submit`，脚本真实预检成功才申请2张A100/最多15分钟。新预检/提交/GPU均 NOT-RUN；TASK-031仍 `in-progress`、完整L6仍FAIL，历史单rank窄PASS不升级，CUDAFLAG偏差及其他未达门不变。旧job严禁重投，详见实时queue和blocker。

在两个月内形成可重建、可验证、可测量的 CUDA Fortran + MPI 五对角求解器研究版本，并完成 28→22 通信裁剪、真实多 GPU 实验、最小应用集成和论文。

2026-08-26 原始软件优先排程：TASK-010 已完成完整证据验收及最终审查，状态 `done`。ADR-007 冻结的独立 demo 在 job1454628 完成32例，最低阶3.9905817759652016、最大缩放残差4.3520742565306136e-14；见 [[../TASK-010-20260826-paraai-a100-job1454628/README.md]]（SRC-024）。仅支持批量 z 线求解，非完整 CFD 或性能结论。当时唯一下一任务推荐 TASK-023（GPT-5.6 Sol / High）；随后024–030为条件式候选、031组合回归。本轮不启动其他任务；模型/范围合同见 [[../../plans/20260826-software-first-performance-roadmap.md]]。当前顺序以本页下方2026-08-28关闭快照和任务队列为准。

2026-08-26 用户选择并批准TASK-023；[本地实现回执](../TASK-023-20260826-local-implementation/README.md)记录隔离worktree新增方向计时、每rank CSV和普通入口扰动对照，本机clean build、68项解析测试、6配对60行、9项拒绝及独立审查通过，普通solver/数值核和主树原SHA不变。该阶段单RTX4060双rank只验证功能，后续目标A100证据见下方关闭快照。

TASK-007已于2026-08-31以负向结果关闭。重开的plan-owned persistent pinned candidate SHA `84357b2b…56b035`完成本地所有权/容量/路由合同、A100 component门、v4 API 20/20和28/22各100次pressure（最大误差`6.6613e-16`），但四项sanitizer无法attach。最后的node-local TMPDIR job1467376又证明双A100、干净构建及本地ext4 TMPDIR实际生效，sanitizer仍以rc124结束且没有solver生命周期或错误摘要；NFS/PMIx症状消失不等于attach恢复。全库无具体预指定替代环境，故按用户批准的硬停止规则把L6记`NOT-RUN/环境限制`，candidate=`do-not-adopt/withdraw`且不得进入最终软件；这不是solver内存错误结论。完整时间线和原始失败证据留在[[../TASK-007-20260830-task5-target-gates/README.md]]，终局处置见[[../TASK-007-20260830-task5-target-gates/TASK-007-20260831-withdrawal-disposition.md]]。当前唯一下一任务是TASK-031私有软件冻结，本轮不启动；其后唯一进入TASK-011论文v1。TASK-002B/019继续作为公开/投稿Gate，算法、公开接口、28/22布局和`1e-10`阈值未变。

TASK-031仍为`in-progress`。v4 job1471698在TASK-016停止；完整memcheck日志把slots28/22的唯一错误定位到`MPI_Init`内HPC-X UCC的`cuCtxGetDevice`，不在solver调用栈，但v4的L6仍为FAIL且TASK-010未运行。项目负责人随后批准有界v5本地修复：只在生命周期runner共享`mpi_args`补入`--mca coll_ucc_enable 0`，TASK-031 runner/test仅更新v5身份并增加真实启动行为锁。TDD UCC行为0/1→1/1、身份0/1→GREEN，完整行为32/32；19项Bash语法、七项数学、71项manifest、80项安全archive与fresh extraction均通过。v4→v5仅README/manifest/三个受控脚本变化，其余67项逐字节一致，solver仍为`4e12f11e…79ee`；v5 archive为163155 bytes / `3ea69d98fd4ad674de0ce9fc1bfa5b65952b93386010dbb2981ded921e4424ec`。用户从master-2回贴上传、结构、包完整性及登录静态结果：Node v22.23.2、manifest前后rc0、行为32/32、19项Bash语法失败0、target runner提交指令0匹配；故登录静态门已通过。v5完整构建/数值/生命周期/制造解组合验收、crossnode/scaling/performance及独立采用审阅仍未完成，不能复用v4结果。correctness-v5提交前只读重复门已通过：活动/历史作业均0，隔离`runs-v5`不存在、correctness运行数0，manifest和查询均rc0。2026-09-03用户已批准恰好一次correctness-v5提交（单节点4×A100、4 MPI rank、2小时上限）；用户随后回贴即时身份/manifest/重复门通过、非覆盖创建runs-v5，sbatch/最终rc0且submitted-once标记给出job1473417，确认Slurm已接收本次单次提交。授权已消耗；最新用户回贴确认job1473417在agent-27运行29分08秒后主job/batch FAILED 4:0；TASK-006 22例、TASK-015 12例失败0及TASK-018有PASS摘要，pressure 28/22各100次rc0，但四项memcheck/initcheck均rc124且零错误摘要数0，TASK-016为6例4失败、stderr gate=task016 rc4。L6失败；TASK-010按冻结fail-stop顺序未到达，完整目标证据仍缺。控制器已查不到job，batch导出虽rc0却正文失败，不能当身份通过。随后10339-byte附件的12份正文重算bytes/SHA均匹配；三项运行SHA匹配v5，保存环境为NVHPC24.5/OpenMPI4.1.7a1/CS2024.1.1.0，srun预检四rank映射四个独立A100 UUID。pressure原日志两布局各100次、最大误差6.6613e-16；四份sanitizer日志各392 bytes且同SHA `e779e2f6…fd4f5`，均明确No attachable process found，无有效内存检查结果。该报告与TASK-007 job1467376已验证ext4 TMPDIR的旧探针相同，不能据此再次把TMPDIR或延时当已知修复。L6仍FAIL，深层原因/可用后续验证路径未解决；用户随后于2026-09-03进一步授权为当前排障申请GPU，权限不再是阻塞；已对原样v5源码在本机已有WSL/NVHPC24.11/OpenMPI4.1.5/CS2024.3和RTX4060上新目录干净构建，28槽/1cycle/两rank普通与memcheck均rc0，两个零错误摘要、最大误差2.2204e-16。此单GPU短对照不替代集群L6，22槽/initcheck/100cycles及其余目标门未覆盖。最新集群10020-byte回贴已取证，HPC-X2.19的mpifort/mpirun均经env.sh；CS2024.1.1为aarch64 ELF，登录ldd没有not found。生命周期build全文16行/1134 bytes重算SHA匹配，实际仅-O3 -cuda，环境声明的-gpu=cc80,cuda12.4未显式落入此build；这是CUDAFLAG传递/记录偏差，尚未证明导致附着失败。最新env.sh全文重建396 bytes/SHA31b13776…9356匹配：默认MT初始化、NVHPC_HPCX_USE_SERIAL=1时改serial，hpcx_load后调用.bin/$EXE；包装本身未被证实有错。检查器入口登录ldd无缺库，深度2清单新见1467-byte .compute-sanitizerrc，不代表内部注入库已查。本机配置与-vv --version已确认入口转到CUDA12.6实际检查器；集群不能直接照推。最新10578-byte附件已取得集群实际路径cuda/12.4/compute-sanitizer/compute-sanitizer、SHA1b252927…0e6d与2024.1.1.0版本；实际工具登录ldd无缺库，直属目录有注入库，不代表计算节点附着有效。三份配置只551-byte转发规则正文SHA匹配，另两份回显有空白差异，不作3/3完整性声明。最新10075-byte回贴为查重为空、首个SHA前rc2，尚未到mkdir/sbatch。原提交命令两处把SHA256SUMS.txt漏写.txt是执行人的错误；旧脚本真实包预检RED，r1仅修这两行后manifest SHA/71文件与3例行为验证通过，batch正文不变，不涉及重新上传或改包。2026-09-03用户回贴r1即时查重为空、五项输入SHA匹配、TASK031_AB_PRE_SUBMIT_PASS，SBATCH_RC=0、SBATCH_OUTPUT与submitted-once均为1474105；batch导出给出成功路径且rc0，确认task031-attach-ab-v1已提交一次。该提交摘录未含最终COMMAND_RC，不补写；最新sacct rc0确认job1474105及batch为FAILED 2:0，2026-09-03 21:17:52–21:18:01在agent-68运行9秒，实际记账1节点/64CPU/2GPU/109952M；squeue rc1查不到该job，extern COMPLETED不覆盖主job失败。最新23911-byte附件/SHA483f6abb…dd50及6份正文已核对：5份LF重建直接匹配，environment仅在明确还原57处行首tab后匹配8849 bytes/SHA04686a30…0024；batch为冻结6126-byte/SHA匹配。stdout明确STOP_MISSING_COMPUTE_NODE_DEPENDENCY，孤立ldd解析TreeLauncher库时找不到同目录已存在的Interceptor库；final-status rc2，GPU身份/rank/plain/A/B日志均未生成，确认plain及A/B NOT-RUN。本机已成功短memcheck的工具链也复现裸ldd同名not found，仅为这一条ldd加入工具目录即解析成功，说明硬停止判据过强，不证明集群真实注入故障或v5附着根因。2026-09-04已非覆盖生成`20260904-submit-attach-ab-v2.sh`：只给预检中的`ldd`子进程临时前置实际检查器目录，并换用全新`task031-attach-ab-v2`/`diag-attach-ab-v2`身份；真实ELF同目录依赖正例与缺库负例2/2、真实v5 manifest 3/3及脚本语法均通过，且预检后`LD_LIBRARY_PATH`仍unset。r2尚未在集群运行；唯一下一动作是用户把r2全文粘贴到既有SSH shell一次，由即时查重/身份门决定是否至多提交一个2GPU/10分钟诊断。不得执行旧r1或重投job1474105；集群L6仍FAIL、v5附着根因与CUDAFLAG偏差仍未解决，TASK-010等仍NOT-RUN。推荐GPT-5.6 Sol / XHigh执行与同强度独立审阅。

**2026-09-04提交后状态修正：** 用户已执行上述r2一次；即时查重为空、五项输入SHA匹配、预提交PASS，sbatch rc0且输出/submitted-once均为job1474942，batch导出rc0、最终COMMAND_RC=0。该证据只证明Slurm接收了一次提交，不证明作业已运行或A/B通过；[固定只读回查脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1474942-readonly-readback.sh)及活动/终态/未知三状态行为测试已在本地通过，当前唯一动作是用户在既有SSH shell完整粘贴该脚本一次并返回输出。严禁再次提交r2。集群L6、附着根因、CUDAFLAG偏差及TASK-010等NOT-RUN状态均不变。

**2026-09-04终态回读修正（覆盖上一段“待回读”指针）：** job1474942主job/batch为`FAILED 5:0`，但冻结batch、输入SHA、计算节点依赖、双A100/双rank身份均匹配，普通MPI控制以最大误差`4.4409E-16`通过。A入口仍为rc124/两个`No attachable process found`；timeout后残留`.bin/mpirun`、两个实际检查器、两个TreeLauncherSubreaper及两个目标进程，共7项，诊断按安全合同停止。B_actual命令、日志、残留清单与post-SHA均明确缺失，故B为`NOT-RUN`，不能据总FAILED判solver失败，也不能判断入口包装是否为因。原始回读36164 bytes / SHA `58ef6e6d…74046`；17份完整正文中16份LF直重建匹配，environment还原57处行首tab后匹配8951 bytes / SHA `6d728e9c…0b05`，见[终态分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1474942-terminal-analysis.txt)。串行A→B设计现停止；唯一下一动作是负责人批准或否决全新allocation的B_actual-only隔离诊断。批准前不生成/提交新作业；L6仍FAIL，CUDAFLAG偏差及TASK-010等未达门保持未解/NOT-RUN。

**2026-09-04 B_actual-only准备状态（覆盖上一段“待批准”指针）：** 负责人已回复“可以”批准隔离设计；新增[一次性提交脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-actual-only-v1.sh)，固定全新`task031-actual-only-v1`/`diag-actual-only-v1`、同冻结v5二进制和MPI参数、双A100/双rank、28槽/1cycle、10分钟，只运行实际CUDA12.4检查器，不运行A或plain。TDD先因生产脚本缺失RED；短通过与已知超时残留两例GREEN、失败0、GPU_RUN=0，均仅一次B_actual调用且无入口/A，残留分支保存PID/PPID/PGID/SID/状态/命令后rc5停止。生产脚本9890 LF bytes / SHA `f74e509c…b1fdf`，batch正文6530 LF bytes / SHA `08259b75…336a`，旧r2未变。唯一下一动作是用户在既有SSH shell完整粘贴新脚本一次；即时门拒绝、sbatch失败或不确定均不得重试。L6/附着根因/CUDAFLAG偏差仍未解除，TASK-010等保持NOT-RUN。

**2026-09-04 job1475062提交状态（覆盖上一段“待执行”指针）：** 用户回贴即时查重为空、五项输入SHA匹配、预提交PASS；`SBATCH_RC=0`、输出与submitted-once均为1475062，batch导出路径/rc0和保留证据标记齐全，故只确认Slurm接收一次提交。附件11908 bytes / SHA `a84ba192…d3ec`已原样非覆盖归档；末端只有打印`COMMAND_RC`的命令回显而无结果，不补写最终rc。视觉折行不充当冻结batch正文SHA；尚无提交后scheduler、实际allocation、GPU/rank、environment、B_actual结果/残留或final-status。该时点进入固定job1475062纯只读回查设计批准门，尚未生成脚本；现状由下一段覆盖。严禁重投actual-only-v1及旧job；L6/附着根因/CUDAFLAG偏差仍未解除，TASK-010等保持NOT-RUN。

**2026-09-04 job1475062固定回查准备状态（覆盖上一段“待批准”指针）：** 负责人已批准固定job/root纯只读设计；新增[回查脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475062-readonly-readback.sh)及[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-job1475062-readonly-readback.sh)。TDD先因生产脚本缺失RED；活动、`squeue rc1 + sacct终态`、未知三态为3例失败0、GPU_RUN=0，作业号改为1475063的变异副本rc1被测试捕获；禁止提交/取消/MPI/GPU/等待/清理命令与等待循环扫描均0。脚本5755 bytes / SHA `824c5961…9211`，测试4582 bytes / SHA `a57c5408…6aa0`；提交batch重新提取仍为6530 bytes / SHA `08259b75…336a`。该准备未查询远端或产生GPU结果。该时点唯一下一动作是用户运行固定回查；该动作现已完成，现状由下一段覆盖。`ACTIVE`/`UNKNOWN`只允许稍后再次回查、绝不重投的规则继续有效。L6/附着根因/CUDAFLAG偏差仍未解除，TASK-010等保持NOT-RUN。

**2026-09-04冻结后顺序决策（不覆盖TASK-031当前动作）：** 用户批准当前版本A完成冻结后，不等待论文完成，先把SRC-029作为donor/reference执行TASK-033逐函数差异审计，再冻结公平P1/P2/P4/P8瓶颈基线、一次只迁移一个候选并组合验收B；随后TASK-032从B制作内部release，最后TASK-011冻结论文v1。最低同节点多GPU门为两个预注册强扩展workload上P2、P4各`median(T1/Tp)>=1.05`且10对至少8对胜P1；任一未过不得称多GPU加速版。P8决定能否声明跨节点加速，强制TCP等环境限制必须单独披露。详见[顺序设计](../../plans/20260904-pre-paper-multigpu-optimization-sequence-design.md)和[SRC-029接收审计](../../reviews/SRC-029-20260904-penta-delivery-intake.md)。当前唯一执行任务仍是TASK-031，不能提前改solver或整包合并。

**2026-09-04 job1475062终态修正（覆盖上一段“待执行”指针）：** 固定回查自身rc0并分类`TERMINAL_EVIDENCE`；sacct确认主job/batch在agent-31运行6秒后`FAILED 127:0`，记账为单节点/64CPU/2GPU/109952M。job-id和冻结6530-byte batch SHA匹配；18个FILE块为9存在/9明确缺失，9份现存正文LF重建bytes/SHA全匹配。最早失败点位于environment采集：直接实际CUDA12.4检查器执行`-vv --version`，而其帮助定义`-v [ --version ]`，故报version重复并在`set -e`下以final-status rc255早停。allocated-gpus、rank-version、results、B_actual命令/日志/残留、post-SHA和marker均缺失，B_actual为NOT-RUN；这不是目录读取不全、solver或GPU实测失败。该终态时点的下一动作曾是负责人批准或否决actual-only-v2有界修复；该批准门现已解除，当前状态由下一段覆盖。L6/附着根因/CUDAFLAG偏差仍未解除，TASK-010等保持NOT-RUN。

**2026-09-04 actual-only-v2本地准备状态（覆盖上一段“待批准”指针）：** 负责人已回复“批准”；[批准记录](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-actual-only-v2-design-approval.txt)冻结全新`task031-actual-only-v2`/`diag-actual-only-v2`及唯一允许差异。新增[一次性提交脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-actual-only-v2.sh)与[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-actual-only-v2-batch.sh)：严格fake actual使冻结v1因重复version参数在两例均rc64/RED；v2只把两处直接actual调用改为单个`--version`并增加每rank路径/产品/2024.1.1.0精确断言，短通过与超时残留两例失败0、GPU_RUN=0，旧v1回归2/2及Bash语法均通过。生产脚本10098 LF bytes / SHA `cc72f7c5…2824`，batch正文6738 LF bytes / SHA `96f9568b…217f`，测试9311 LF bytes / SHA `5a60de15…6685`；冻结v1与attach-ab-v2指纹未变。该时点唯一动作曾是用户在既有SSH shell完整粘贴v2脚本一次；该动作现已完成，当前状态由下一段覆盖。即时拒绝、sbatch失败或不确定均不得重试的规则继续有效。该准备不是GPU结果；L6/附着根因/CUDAFLAG偏差仍未解除，TASK-010等保持NOT-RUN。

**2026-09-04 actual-only-v2提交状态（覆盖上一段“待执行”指针）：** 用户回贴即时查重为空、五项冻结输入SHA匹配、`TASK031_ACTUAL_ONLY_PRE_SUBMIT_PASS`指向全新`diag-actual-only-v2`；`SBATCH_RC=0`、输出与submitted-once均为job1475231，batch导出rc0、末端`COMMAND_RC=0`，故只确认Slurm接收一次提交。[规范化摘录](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-job1475231-submit-once-user-readback.txt)为1651 bytes / SHA `bd570e9f…7ee9`，不是远端原始文件；[提交分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475231-submit-analysis.txt)保留证据边界。尚无提交后scheduler、实际GPU/rank、environment、B_actual、残留、post-SHA或final-status，冻结6738-byte batch正文也未远端回核。TASK-031仍`in-progress`、L6仍FAIL，附着结果/CUDAFLAG偏差未解，TASK-010等保持NOT-RUN。严禁再次提交v2或旧job；当前唯一动作是负责人批准或否决固定job1475231/root纯只读回查设计，批准前不生成脚本。

**2026-09-04 job1475231固定回查准备状态（覆盖上一段“待批准”指针）：** 负责人已回复“批准”，[批准记录](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-job1475231-readback-design-approval.txt)冻结job/root、6738-byte batch身份、三态和禁止动作。新增[回查脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475231-readonly-readback.sh)5755 LF bytes / SHA `c432f8f1…372d`与[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-job1475231-readonly-readback.sh)5970 LF bytes / SHA `7981b3f6…adc7`；TDD由缺生产脚本RED转为ACTIVE/TERMINAL_EVIDENCE/UNKNOWN 3例失败0，固定job变异被捕获，真实v2 batch夹具身份匹配，禁止命令/等待循环0，`GPU_RUN=0`。本地准备未查询远端或改变GPU门。当前唯一动作是用户在既有SSH shell完整粘贴固定回查脚本一次并返回全部输出；ACTIVE/UNKNOWN只允许稍后重复同一回查，严禁重投。TASK-031仍`in-progress`、L6仍FAIL，附着结果/CUDAFLAG偏差未解，TASK-010重链等保持NOT-RUN。

**2026-09-04 job1475231终态修正（覆盖上一段“待回查”指针）：** 固定回查自身rc0；`sacct`确认主job/batch在agent-28运行2分14秒后`FAILED 5:0`，实际记账双GPU。固定job-id、6738-byte batch SHA、八项输入/工具/配置及六项注入库前置SHA均匹配；两张不同A100、双rank和实际CUDA12.4检查器2024.1.1.0身份成立。B_actual已直接绕过NVHPC入口运行，但仍为`rc124/KNOWN_ATTACH_TIMEOUT`，392-byte日志SHA `e779e2f6…fd4f5`与既有入口/完整L6失败日志相同；timeout后残留`.bin/mpirun`、两个实际检查器、两个TreeLauncherSubreaper及两个目标程序共7项，故合同安全停止并以rc5结束。post-SHA/完成marker明确未到达。原附件34937 bytes / SHA `62026bb7…f05d`；15份正文LF直重建匹配，environment还原57处行首tab后匹配，见[终态分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475231-terminal-analysis.txt)。结论是入口包装器假设被否定，不是solver内存错误或目录漏读；L6仍FAIL、CUDAFLAG偏差独立保留、TASK-010等保持NOT-RUN。严禁重投或继续无依据参数变体。当前唯一动作改为向集群管理员索取该A100/aarch64分区受支持的Compute Sanitizer+MPI附着方式或替代sanitizer环境；若不存在，负责人再显式决定L6环境限制处置，不能写PASS。

**2026-09-04管理员支持材料状态（覆盖上一段“待整理”含义）：** [管理员请求正文](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475231-admin-support-request.md)与[原始附件bytes/SHA清单](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475231-admin-support-attachment-manifest.md)已就绪，明确历史命令不可盲目重跑、rc5是残留进程安全停止而不是solver内存错误，并向管理员询问支持命令、站点权限/配置和替代环境。材料尚未人工发送，管理员尚未答复；TASK-031保持`in-progress`、集群L6保持`FAIL`。当前唯一动作是用户发送材料并原样保存答复，不启动TASK-033或新的GPU变体。

**2026-09-04 singleton诊断准备状态（覆盖上一段“立即发管理员”的当前动作）：** 负责人要求先自行寻找启动方法。新增[一次性提交脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-sanitizer-singleton-v1.sh)及[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-sanitizer-singleton-v1-batch.sh)，固定全新`task031-sanitizer-singleton-v1`/`diag-sanitizer-singleton-v1`，1节点/1 task/1 GPU/5分钟；batch不调用MPI launcher，先直接运行冻结生命周期二进制的singleton普通控制，再由实际CUDA12.4检查器直接启动同一程序。缺生产脚本RED；成功、已知附着超时残留、普通控制失败三例GREEN，失败0、GPU_RUN=0，语法rc0。尚未提交或产生GPU结果。TASK-031仍`in-progress`、L6仍FAIL、CUDAFLAG偏差独立保留、TASK-010等仍NOT-RUN。当前唯一动作是用户完整执行新脚本一次并返回全部输出；任何拒绝或提交不确定均不重试。singleton通过后才设计`mpirun -np 1`；singleton失败则转管理员或先核对已安装2024.1.1支持项，不并行试参。

**2026-09-04 job1475449提交及回查准备状态（覆盖上一段“待执行”指针）：** 用户回贴查重为空、四项冻结SHA匹配、singleton预提交PASS，`SBATCH_RC=0`、输出/submitted-once均为1475449、batch导出rc0且最终`COMMAND_RC=0`；只确认Slurm接收一次提交，禁止重投。新增[固定只读回查](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475449-readonly-readback.sh)及[测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-job1475449-readonly-readback.sh)，绑定job/name/root和5463-byte batch身份，只查scheduler和有界读取证据；三态3例失败0、GPU_RUN=0，job变异捕获、语法rc0。尚无提交后scheduler、GPU或singleton结果。TASK-031仍`in-progress`、L6仍FAIL、TASK-010等NOT-RUN。当前唯一动作是用户完整运行固定回查并回贴全部输出；ACTIVE/UNKNOWN只允许稍后重复读取，绝不重投。

**2026-09-04 job1475449终态与`mpirun -np 1`准备（覆盖上一段“待回查”指针）：** 固定回查确认job/batch在单A100节点运行1分06秒后`FAILED 4:0`，冻结batch、输入与环境身份匹配。最早失败是MPI生命周期程序不经launcher直接运行时rc124超时且日志0 bytes；普通控制先失败，Sanitizer命令/日志/残留/post-SHA/marker均缺失，因此Sanitizer明确`NOT-RUN`，不是新的附着失败或solver内存错误。新增[一次性`mpirun -np 1`诊断](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-mpirun-one-v1.sh)、[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-mpirun-one-v1-batch.sh)和[准备回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-mpirun-one-v1-preparation.txt)，只恢复HPC-X launcher并先普通门、后一次Sanitizer；缺脚本RED后3例GREEN/失败0/GPU_RUN=0，语法通过，尚未提交。TASK-031仍`in-progress`、集群L6仍FAIL、TASK-010等NOT-RUN。当前唯一动作是用户完整执行新脚本一次并返回全部输出；任何拒绝、提交、失败或不确定结果均不得重跑。

**2026-09-04 `mpirun-one-v1`预检拒绝与r1准备（覆盖上一段“执行新脚本”指针）：** 用户回贴空重复查询、manifest/生命周期二进制/solver/实际Sanitizer四项冻结SHA后直接`COMMAND_RC=2`，未见launcher身份、预提交PASS、sbatch或job id，故没有提交，MPI/GPU/Sanitizer均NOT-RUN。根因是旧脚本以普通非symlink谓词检查实际`mpirun -> env.sh`入口。保留旧v1，新增[r1](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-mpirun-one-v1-r1.sh)：入口symlink、精确解析目标、目标类型和SHA四门一致用于提交前与batch；真实链接/错误目标预检2例和原batch 3分支均GREEN、失败0/GPU_RUN=0，语法通过，见[准备回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-mpirun-one-v1-r1-preparation.txt)。TASK-031仍`in-progress`、L6仍FAIL、TASK-010等NOT-RUN。当前唯一动作是用户完整执行r1一次并回贴全部输出；旧v1及任何拒绝/提交结果都不得重跑。

**2026-09-04 job1475609重复保护与固定回查（覆盖上一段“执行r1”指针）：** 用户回贴`DUPLICATE_SQUEUE`为空、`DUPLICATE_SACCT=1475609`及rc2安全拒绝，证明当前调用没有再次提交；它不是job1475609失败证据。因缺更早sbatch回执、scheduler状态、batch与运行文件，只能确认精确同名accounting记录存在。新增[固定只读回查](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475609-readonly-readback.sh)、[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-job1475609-readonly-readback.sh)和[准备回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475609-readback-preparation.txt)：固定job/name/root与6339-byte batch，RED后ACTIVE/TERMINAL_EVIDENCE/UNKNOWN三例失败0/GPU_RUN=0，job变异捕获、语法通过。TASK-031仍`in-progress`、L6仍FAIL、其他未到达门仍NOT-RUN。当前唯一动作是用户只执行固定回查并回贴全部输出；严禁再运行r1或任何旧提交脚本。

**2026-09-04 job1475609终态与GPU节点驱动异构（覆盖上一段“固定回查”指针）：** job/batch在agent-4运行10秒后`FAILED 4:0`，冻结6339-byte batch、输入、launcher与一张A100身份均匹配。普通`mpirun -np 1`先到`cudaGetDeviceCount`，返回status35并MPI abort；该节点driver为510.85.02，status35由NVIDIA定义为`cudaErrorInsufficientDriver`，CUDA12.x官方兼容最低为R525分支。此前agent-27/28的535.104.12节点普通CUDA/MPI控制可运行，故本job直接根因是GPU分区异构节点的旧驱动，不是目录、launcher、solver或新的Sanitizer结果；Sanitizer明确NOT-RUN。13份现存正文重建SHA全匹配，见[终态分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475609-terminal-analysis.txt)。新增[Slurm节点feature只读查询](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-gpu-node-feature-readonly.sh)，语法rc0、禁止动作0。TASK-031仍`in-progress`、既有兼容驱动节点上的L6仍FAIL；唯一动作是用户只运行该查询并回贴，禁止重投1475609或盲试节点。

**2026-09-04 agent-28定点`mpirun-one-v2`本地准备（覆盖上一段“设计待批准”指针）：** 负责人已批准设计；新增[一次性脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-mpirun-one-v2.sh)、[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-mpirun-one-v2-batch.sh)和[准备回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-mpirun-one-v2-preparation.txt)。脚本精确`--nodelist=paraai-n32-h-01-agent-28`，只在任何MPI调用前新增hostname、单A100与driver535.104.12三门；其余v1-r1输入、MCA、28槽/1cycle、超时及plain→一次memcheck顺序不变。缺v2先RED；旧v1-r1确会接受R510夹具，v2错主机/旧驱动均rc2且不调用MPI，批准环境三个原分支保持rc0/5/4，最终6例失败0、GPU_RUN=0；生产/测试Bash语法rc0。生产11472 LF bytes/SHA `e16e7863…a8a5`，batch 7331 LF bytes/SHA `c0276301…cb9e`。未SSH、提交或申请GPU；TASK-031仍`in-progress`、集群L6仍FAIL，TASK-010等仍NOT-RUN。当前唯一动作是用户在既有SSH shell完整粘贴v2一次并返回全部输出；任何拒绝、失败、不确定或成功提交均不得重跑。

**2026-09-04 `mpirun-one-v2`提交状态（覆盖上一段“待执行”指针）：** 用户回贴即时查重为空，v5 manifest、生命周期二进制、solver、实际CUDA12.4检查器和HPC-X解析目标五项SHA均匹配；预提交PASS指向全新`diag-mpirun-one-v2`。`SBATCH_RC=0`、输出与submitted-once均为job1475788，batch导出rc0、末端`COMMAND_RC=0`，因此只确认Slurm接收一次提交。[规范化回贴](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-job1475788-submit-once-user-readback.txt)1766 LF bytes/SHA `1798481d…d1e3`，[提交判读](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475788-submit-analysis.txt)明确尚无scheduler终态、实际agent-28/R535门、GPU、remote batch、plain/Sanitizer/残留/final-status。严禁重投v2或旧脚本。TASK-031仍`in-progress`、集群L6仍FAIL，TASK-010等仍NOT-RUN；当前唯一动作是负责人批准或否决固定job1475788/root纯只读回查设计。

**2026-09-04 job1475788固定只读回查准备状态（覆盖上一段“待批准”指针）：** 负责人已批准，[批准记录](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-job1475788-readback-design-approval.txt)冻结job/name/root、7331-byte batch、三态和禁止动作。新增[固定回查](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475788-readonly-readback.sh)、[测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-job1475788-readonly-readback.sh)及[回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475788-readback-preparation.txt)：缺生产脚本RED；ACTIVE/TERMINAL_EVIDENCE/UNKNOWN、错误JobName和batch损坏5例GREEN/失败0/GPU_RUN=0，固定job变异被捕获，生产/测试语法rc0，禁止动作/等待循环0。未查询集群或产生GPU结果。TASK-031仍`in-progress`、L6仍FAIL，TASK-010等仍NOT-RUN。当前唯一动作是用户完整执行固定回查并回贴；ACTIVE/UNKNOWN只允许稍后重复该回查，严禁重投。

**2026-09-04 job1475788终态与下一批准门（覆盖上一段“待回查”指针）：** job主/batch/extern在agent-28运行13秒后均`COMPLETED 0:0`；冻结7331-byte batch、输入/工具/注入库、单A100与driver535.104.12身份匹配。`mpirun -np 1` plain及实际CUDA12.4 Sanitizer的28槽/1cycle短控制均rc0，最大误差`4.4409E-16`；Sanitizer恰有一个`ERROR SUMMARY: 0 errors`、无attach错误和残留，前后SHA一致。20份正文重建bytes/SHA全匹配，见[终态分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-job1475788-terminal-analysis.txt)（SRC-030）。这否定“Sanitizer在此aarch64/HPC-X环境整体不可用”，但只覆盖单rank/单GPU；与同一agent-28同输入而双rank/双GPU超时的job1475231对照，失败区收窄到双rank/双GPU并发路径，rank数与GPU数尚未分离。TASK-031仍`in-progress`、完整L6仍`FAIL`，22槽/initcheck/100cycle/TASK-010等仍未覆盖。NVIDIA文档及已安装2024.1.1帮助均确认`--target-processes all`和进程filter可用（SRC-031）；当前唯一动作是负责人批准或否决保持双rank/双GPU其余变量不变、改用单个外层Sanitizer跟踪MPI目标子进程的一次性10分钟诊断。批准前不生成/提交脚本；失败或跟踪不全即转管理员，不再试参。

**2026-09-04 外层child-tracking诊断准备（覆盖上一段“待批准”指针）：** 负责人已回复“可以”；[批准记录](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260904-outer-sanitizer-np2-v1-design-approval.txt)冻结最后一次自助拓扑诊断。新增[一次性脚本](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-submit-outer-sanitizer-np2-v1.sh)、[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-outer-sanitizer-np2-v1-batch.sh)与[准备回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-outer-sanitizer-np2-v1-preparation.txt)。脚本固定agent-28/R535、双A100/双rank、冻结v5输入/MCA、28槽/1cycle和memcheck，只把两个per-rank检查器前端改成一个外层实际检查器，以`--target-processes all`、精确`test_penta_lifecycle` filter和session details启动MPI；先运行plain np2门，10分钟新job/root且残留安全停止。TDD由缺生产脚本rc1/RED转为六分支失败0、`GPU_RUN=0`，生产/测试语法rc0；生产13492 LF bytes/SHA `862284b2…c218`，batch 9224 LF bytes/SHA `0cf0f454…3280`。即使命令rc0也只写`COLLECTED_NOT_L6_ACCEPTANCE`，必须回读证明两个不同目标会话后才能称短诊断PASS。未SSH或提交。TASK-031仍`in-progress`、完整L6仍FAIL，CUDAFLAG偏差与TASK-010等NOT-RUN不变；当前唯一动作是用户在既有SSH shell完整执行脚本一次并回贴全部输出，任何拒绝、失败、不确定或submitted-once均不得重跑，失败/跟踪不全转管理员。

**2026-09-05 job1476262固定只读回查准备（覆盖上一段“待批准”指针）：** 负责人已[批准](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260905-job1476262-readback-design-approval.txt)。新增[固定读取器](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260905-job1476262-readonly-readback.sh)、[行为测试](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/test-job1476262-readonly-readback.sh)和[回执](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260905-job1476262-readback-preparation.txt)：绑定job/name/root与9218-byte/SHA `fdebdc2d…79c1` batch，只调用固定`squeue/sacct/scontrol`及有界证据读取。缺生产脚本rc1/RED后，ACTIVE、TERMINAL_EVIDENCE、UNKNOWN、错误JobName、batch损坏5例失败0/`GPU_RUN=0`，两类错配rc2；生产6457 bytes/SHA `5de1e24a…7029`、测试8491 bytes/SHA `9f1157a2…d553`，语法通过。未查询远端或运行GPU；TASK-031仍`in-progress`、完整L6仍FAIL。当前唯一动作是用户完整运行读取器并回贴全部输出；ACTIVE/UNKNOWN只允许稍后重复同一读取，严禁重投。

**2026-09-05 job1476262排队回查（覆盖上一段当前动作）：** [规范化完整回贴](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260905-job1476262-pending-readback-user-transcript-normalized-lf.txt)及[判读](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260905-job1476262-pending-readback-analysis.txt)确认job仍为`PENDING (Priority)`、运行时间0、无分配节点；显示的2026-09-06 06:46:39仅为调度估算。远端9218-byte/SHA `fdebdc2d…79c1` batch身份精确匹配；20份Slurm/运行材料缺失符合尚未启动，不是新失败。读取器rc0不是GPU结果。TASK-031仍`in-progress`、完整L6仍FAIL，本轮GPU/Sanitizer门NOT-RUN；唯一动作是等待且不重投，稍后只重复同一读取器。

**2026-09-05 job1476262终态与硬停止（覆盖上一段当前动作）：** [终态回贴](../TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/20260905-job1476262-terminal-readback-user-transcript-normalized-lf.txt)及[分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260905-job1476262-terminal-analysis.txt)确认主job/batch在agent-28双A100上2分13秒后`FAILED 5:0`；batch、输入/工具、节点/driver/GPU身份均匹配，plain `np=2`短控制rc0/最大误差`4.4409E-16`。修正裸`--`后的外层Sanitizer进入附着阶段仍rc124/`No attachable process found`，留下mpirun和两个目标子进程后rc5安全停止；这不是parser、目录、solver数值或GPU内存错误。结合单rank job1475788 PASS与双rank逐前端job1475231 FAIL，两种双rank拓扑均无有效检查结果，自助路径按合同停止。TASK-031仍`in-progress`、完整L6仍FAIL；唯一动作是把[管理员补充材料](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260905-job1476262-admin-support-addendum.md)连同既有请求发给管理员并保存答复，禁止重投猜参。

TASK-023短采集证据：job1456135在`paraai-n32-h-01-agent-154`完成；三层状态0、双物理A100 UUID、smoke/capture CSV及8报告通过 [[../TASK-023-20260826-nsight-runner/README.md]]。完整包本地SHA、安全路径、323项manifest、8报告、32 CSV/8 SQLite、冻结源码和两审计器重算通过，见 [[../TASK-023-20260827-paraai-a100-job1456135/README.md]]。该证据只用于阶段定位；正式重复对照由下方job1457454闭合。

TASK-023于2026-08-28按批准范围关闭为`done`：LF1单GPU probe job1457303和完整P1/P2×28/22×plain/profiled、2预热+5正式的56启动job1457454通过；完整包本地完成SHA、安全路径、262/201/5/10项分层清单和独立CSV复算，见 [[../TASK-023-20260827-formal-validation-v2/README.md]]。plain稳定8轮显示P1的28→22仅千分之一级，P2五个配对方向一致且配对变化中位数为`-14.5045%`，严格限单节点双A100、host staging/TCP固定配置。用户批准L4不均匀、L6、L7和TASK-010重链作为任务范围外而非PASS。唯一推荐下一任务为TASK-025（ready，GPT-5.6 Sol / High），只测pageable/pinned完整成本；024条件式blocked，021/028–030不因本结果自动重开，本轮不启动新任务。

TASK-025于2026-08-28关闭为`done / do-not-adopt current candidate`：formal-v2 job1459808三层`COMPLETED/0:0`，56/56、112 CSV/1680行、双A100、冻结SHA、409路径/类型、301/233/6项分层清单和本地独立audit/pairs/decision/阶段复算全部通过。22槽0/5 pinned更快、中位回退11.8472%；28槽1/5更快、中位回退4.1233%；最大误差`3.5216e-13`。D2H/H2D快约52%–68%，但每调用锁页allocate/free和等待抵消收益；当前候选不合并。新allocator的allocate+free诊断占比中位数22.146879%/23.213614%满足ADR-005重开门；TASK-025关闭时只把既有TASK-007转为`ready`，随后用户已按下段批准重开。该证据不证明persistent必然加速。

TASK-007的批准设计见[[../../plans/TASK-007-20260828-persistent-pinned-design.md]]，逐文件步骤见[[../../plans/TASK-007-20260828-persistent-pinned-implementation-plan.md]]。当前实施快照只在本页前述段落、[[../../../meta/task-queue.md]]和对应阻塞条目维护；本段不再复制worktree或Task进度。

## 默认活动文件

- 主实现：`CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`
- 最小示例：`CUDA_code/源代码/examples/ex_tdma_penta_zdirection.f90`
- 独立验证：`verify/penta_indep_check.js`、`verify/penta_comm_28_verify.js`、`verify/penta_comm_22_verify.js`、`verify/penta_index_bounds_verify.js`
- 性能入口：`perf_bench/benchmark_penta.f90`
- 任务队列：[[../../../meta/task-queue.md]]
- 测试矩阵：[[../../../wiki/testing/test-matrix.md]]
- 命令手册：[[../../../../程序正确性与性能运行手册.md]]
- TASK-031 构建/预检防错（修改诊断脚本前必读）：[[../../../wiki/systems/build-and-runtime-map.md]]
- 上游谱系摘要：[[../../../wiki/reference/pascal-tdma-2.1-to-penta-transfer.md]]（算法、优化或论文任务时读取）
- 相邻优化迁移矩阵：[[../../../wiki/reference/adjacent-tdma-optimization-transfer-to-penta.md]]（只在性能设计/profile 任务读取；不是五对角直接证据）

## TASK-001 已通过

三/五对角无效 `MPI_WAITALL` 已删除并加入 `MPI_ALLTOALLV` 返回码失败中止；WSL2 + NVHPC 24.11 + OpenMPI 4.1.5 的干净构建及 `np=1/2` 回归已通过。证据见 `knowledge/outputs/validation/TASK-001-20260817-wsl-nvhpc24.11/`。单 GPU 双 rank 只支持通信正确性，不支持多 GPU扩展性结论。

## TASK-004 已通过

五对角 plan/API 现会拒绝非法 `Nsys/Nrow`、空分区、线程数、communicator/rank/size 和生命周期调用，并检查分配、MPI 返回码、CUDA launch 及原有同步返回码。14 个 API 正反用例、干净构建、`np=1/2` 示例和 profiled smoke 已通过；证据见 `knowledge/outputs/validation/TASK-004-20260817-wsl-nvhpc24.11/`。尺寸乘法溢出和数值主元失败不在本任务范围。

## TASK-005 已通过（仅独立布局层）

`penta_comm_22_verify.js` 已证明合法 28 槽数据可按固定映射压缩为 22 槽，并逐槽恢复相同的 28 槽与 32 槽 `Atr`。180 组平衡/不均匀多 rank 配置和 28 个故障注入通过。TASK-006 已在 `faffee3` 实现可切换 Fortran 路径并通过 L2–L4；TASK-016 的动态内存与各 100 次生命周期 Gate 也已通过。TASK-009 的 P8 配对显示本次 22 槽 rank-MAX 中位数比 28 槽低 `14.10%–16.90%`，但只支持该配置级结论。

## TASK-008 已通过

五对角 plan/solver 在 setup 层使用 64 位临时量检查 32 位工作区、矩阵扁平偏移和 MPI count/displacement。超过上限的输入会在分配或 kernel 启动前终止；CUDA 热循环保持 32 位。setup-only 边界脚本、16 个 API 用例、NVHPC 干净构建、`np=1/2` 和 profiled smoke 已通过。

## 红队修订后的当前 Gate

TASK-002A 已完成：上游公开 HEAD `e637d5e`、三对角精确历史对象 `d69ae95` 及导师苏运德于 2026-08-20 的来源/贡献边界确认均已归档；用户于 2026-08-27 另补充初始五对角扩展开发者为李洋和周一涵，限定为在团队 PaScaL_TDMA 三对角基线上的修改扩展，不是上游项目署名，也不能写成后续执行者的独立原创。两份记录分别保留，共同署名的公开文本仍由 TASK-002B 复核。TASK-013 已完成：一般 `m` 降级为方法背景，28→22 保留为限定布局候选贡献；模型辅助审计补入 NASA/OVERFLOW 与 Pentadsolver，周一涵于 2026-08-20 以 `accept` 完成独立审阅。Pentadsolver 是最高展示 1024 GPU的高度相邻分布式五对角先例，其公开代码/同输入复现性尚未确认。TASK-014 已完成 `mpifort` debug/release、np=1/2 正确性与五次单 GPU内部计时；TASK-022 已完成同 GPU/固定 P=1 FP64 输入的 cuSPARSE QR 外部锚点、公平预热和独立复审，两项均为 `done`。TASK-017 已在 ParaAI 双 A100 上完成真实绑定与 `np=2` 正确性 smoke。TASK-009 已归档单节点 A100 的 1/2/4 GPU、P=1 cuSPARSE、双节点 4 GPU correctness smoke 和 job `1449812` 的双节点 8 GPU正式强/弱扩展。协议矩阵完整，但 strong P1→P8 speedup 仅 `0.389×–0.457×`，weak efficiency 仅 `10.02%–12.96%`；TASK-009 为 `done`，不能声称良好、线性或通用扩展性。

TASK-018 已完成：`8df948e` 上的 6 项 Node 模型自检、30 GiB FIT 与 exit 2 REJECT，以及 BSCC-N32-H A100 的安全 `256×256×1024,P=1` manufactured smoke（exit 0）均已归档。TASK-015 已完成：六类矩阵族、尺度不变主元阈值、错误码 `4` 和 NVHPC `np=1/2` 12 项回归均通过；算法仍无主元交换，不支持任意病态系统。TASK-016 在 WSL/NVHPC 下完成 28/22 各 100 次 `np=2` 生命周期，最大误差均 `6.6613e-16`，两布局 memcheck/initcheck 的两个 rank 均为 0 errors；TASK-006 的 G2 因此解除。TASK-007 已在双 A100 上完成 2 次预热、5 次正式作业共 50 个样本：allocate+free 占比中位数仅 `0.1474%`，按 ADR-005 不实施 persistent buffer。TASK-020 又复用同一批数据建立 overlap 关键路径模型：MPI-only 中位占比 `51.5085%`，50% 实现效率下预测收益中位数 `10.8458%`，但只有 3/5 作业达到单作业 `10%`，未过 4/5 稳定性 Gate；按 ADR-006 暂不实施 overlap，TASK-021 保持 `blocked`，未修改求解器。TASK-002B 已形成“源码仅私有研发、论文可公开”的 NOTICE 与引用清单草案，待导师/权利人确认其最终文本及论文审查要求；不得把此决定解释为开源授权。TASK-009 当前 `done`；TASK-019 的模型复算和自动验证已通过，周一涵于 2026-08-24 对冻结版本给出 `accept`，状态仍为 `review`，只剩投稿前数据库检索。不得自动启动其他任务，所有非 `done` 任务的具体缺口以 [[../../../meta/task-blocker-register.md]] 为准。

SRC-019..021 已编译为相邻 TDMA/ADI 优化参考：优先建立 rank-MAX 阶段时间和 bytes/line 模型，再按证据选择 workspace、布局/批大小、fusion 或 overlap。三对角的对角占优删项、相邻 `2×2` 缩约和论文加速比均不得外推到五对角；本次知识增量不改变任何任务状态，也不授权启动优化实现。

## 每个任务的最小读取包

1. 根目录 `AGENTS.md`；
2. 本页；
3. [[../../../meta/task-queue.md]] 中的一项任务；
4. 一张与任务直接相关的方法/测试/性能页；
5. 目标函数附近的源码片段，而不是整份源码；
6. 对应验证脚本或测试入口。

## 按任务路由

| 任务 | 增量上下文 | 主要代码/验证 |
| --- | --- | --- |
| P0 MPI 生命周期 | [[../../../wiki/systems/data-ownership-and-lifetime.md]]、[[../../../wiki/testing/test-matrix.md]] | `pascal_a2av` 附近、penta 示例、多 rank debug |
| 28→22 裁剪 | [[../../../wiki/methods/28-to-22-slot-map.md]]、[[../../../wiki/methods/penta-data-layout.md]] | 两个 penta JS 检查、新增 22 槽等价检查 |
| 索引与大规模 | [[../../../wiki/methods/index-width-contract.md]] | 设置阶段乘法、偏移、边界规模测试 |
| 性能优化 | [[../../../wiki/performance/benchmark-protocol.md]]、[[../../../wiki/performance/hardware-matrix.md]]、[[../../../wiki/reference/adjacent-tdma-optimization-transfer-to-penta.md]] | quick benchmark、冻结 CSV、阶段计时；先满足迁移 Gate |
| 来源/新颖性 | [[../../../wiki/reference/pascal-tdma-2.1-to-penta-transfer.md]]、[[../../../wiki/paper/claim-evidence-matrix.md]] | upstream diff、检索矩阵、外部 comparator 决策 |
| 数值稳定性 | [[../../../wiki/testing/test-matrix.md]] | 病态矩阵族、残差/前向误差、失败合同 |
| 一般带宽研究 | [[../../../wiki/methods/general-m-reduction.md]] | `mband_general.js`、`mband_recurrence.js` |
| 论文写作 | [[../../../wiki/paper/claim-evidence-matrix.md]] | 只使用“已支持”主张和已归档实验 |

## 默认不读取

- `src/PaScaL_TDMA_cuda.f90` 三对角源码；
- 完整 PaScaL_TDMA 论文 PDF（必须保留；先读迁移摘要，需核对原始细节时再读相关章节）；
- 全量 Wiki、完整两月计划、历史长报告；
- 七对角和一般 `m` 材料，除非任务确实涉及推广；
- 与当前函数无关的整个千行 Fortran 文件。

文件留在仓库不会自动消耗模型 token；只有被读入上下文的内容才产生主要开销。因此采用路由和摘要，不以删除证据换取 token。

## 何时允许读取三对角

出现以下任一条件时，加载 [[../../../wiki/reference/tridiagonal-baseline.md]]；算法/优化任务优先加载迁移摘要，只有代码比较需要时才读三对角源码片段：

- 排查五对角与上游共同的 MPI/CUDA 缺陷；
- 核对公共 API、构建目标或回归兼容性；
- 确认上游行为、版权、许可证或贡献边界；
- 推导五对角扩展、设计寄存器/通信优化或撰写相关工作；
- 发布前需要运行三对角回归；
- 有明确假设需要做最小差分比较。

## 不变量

- 当前五对角 API 要求 `Nrow >= 5`、`Nsys >= nprocs >= 1`；不支持空分区；
- 当前所有扁平索引和传统 `MPI_Alltoallv` 描述符必须能由默认 32 位整数表示；不提供 64 位 kernel 或 MPI 大计数路径；
- `RHS` 和部分系数会被原位覆盖，调用方必须明确所有权；
- 28→22 是当前理论支持的目标，不是 28→18；
- 单 GPU 多 rank 不能证明多 GPU扩展性；
- 没有独立真值不得声称正确，没有同精度实测不得声称更快。
