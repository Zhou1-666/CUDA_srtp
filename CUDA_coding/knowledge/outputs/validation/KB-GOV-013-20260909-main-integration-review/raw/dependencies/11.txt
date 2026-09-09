# TASK-023 外围Nsight短采集准备回执

日期：2026-08-26。用户已明确批准上一轮简短方案。本轮完成本地外围实现/测试与传输包准备，**TASK-023保持review**；没有执行SSH、上传、申请GPU、提交Slurm、commit/合并/push。此前“必要时申请GPU”的澄清仍有效。

## 范围与文件

在既有`.worktrees/task023-direct-diagnostics`隔离候选新增七项：CUDA设备身份探针、每rank应用/Nsight包装脚本、短采集runner、证据审计器、Python外围测试、ParaAI Slurm入口和说明。详见[交付说明](packages-v2/TASK-023-20260826-nsight-preflight-v1/source/verify/TASK023-nsight.md)。

原13项交付文件与封存本地实现的source内容逐字节一致。主树源码与隔离候选solver/benchmark/旧runner均未改，三项候选SHA为：

- solver：`55173a7b2fb92c2fd19dbdba8a32e320adb23fbaf12701364f7c6690509a1309`。
- benchmark：`3d2243ad4aca10d7ada1cd5049d4a7d2714b3a505d1842658d19364b9bcaa330`。
- 原诊断runner：`0c5d02f186c6a226c19db8dbc49be901521484eb52c3eb1a1ddefa663360ca46`。

独立probe不启动kernel、不求解矩阵；它按benchmark的`world_rank % ngpu`选设备、查询PCI bus，再由nvidia-smi取得UUID。每rank的真实UUID/CPU亲和性与可见设备环境均保留。任何两rank共享同一GPU时，双卡门禁拒绝。

## 实际本地验证

本机Windows Node与WSL/Bash执行，原始输出都在`local/`，没有用模拟数据宣称目标环境通过。

| 检查 | 实际结果与证据 |
| --- | --- |
| 测试先行与失败保留 | `red-v1.log`记录缺少外围实现；后续fixture纠正与审计字段失败见`audit-red-v2/v3`；`signal-red-v4`复现两个审阅问题；`green-v5`保留测试就绪竞态导致的超时，不能写全绿 |
| 最终外围行为 | `green-v6.log`/`.rc`：19/19通过、rc0；覆盖应用失败不被工具成功掩盖、importer139、TERM未知状态、缺报告/缺rank/缺配对、UUID共享、旧目录保留等 |
| 独立审查 | [审阅记录](review.md)：字段类型错误、受控中断证据缺失和测试启动竞态均已复现修复，最终无未关闭阻断问题；目标GPU/MPI未测 |
| 真实本机probe | `probe-real-wsl`：NVHPC24.11 NVCC编译，rank0/1均识别唯一GPU的ordinal0/bus0000:01:00.0；三种非法参数均rc2。不称作双GPU或MPI验收 |
| 原CSV解析器 | `parser-v1.log`：68/68，rc0 |
| 数学与容量 | `math-v1.log`：8项、0失败，逐项核对输出；72组五对角直解差最大2.887e-15、相对残差4.441e-16，28槽756组0失败、22槽180组/28注入通过，稳定性6组符合各自门；`capacity-v1.log`：6/6，rc0 |
| 受保护代码/兼容性 | `scope-v1.log`：profile-only范围仍符合旧已验候选、主树三项SHA不变、35列旧表头/4行兼容；本次未再改这些文件 |
| 包与回环 | [package-verification.json](package-verification.json)：21个payload（另有SHA清单）、13旧文件一致、7新增外围文件，27个安全归档路径；解包副本完整文件集与每项SHA一致 |
| 解包副本测试 | `local/package-check.log`/`.rc`：21项清单全部OK、全部shell/Slurm语法通过、19/19外围及68/68 CSV测试通过，`TASK023_PACKAGE_LOCAL_CHECK_PASS`、rc0 |

第一次打包因旧source目录包含自身SHA清单（13个payload+1清单）而停止，未产生tar包；空staging、旧构建脚本和原因保留。第二次只排除旧清单，重新生成新包清单，没有删除或覆盖旧证据。

## 传输包

- 文件：[TASK-023-20260826-nsight-preflight-v1.tar.gz](TASK-023-20260826-nsight-preflight-v1.tar.gz)，56239字节。
- SHA256：`1e48a193b391bd65be0d01e650928918855cb64cf727a66e0a9644c861ea5cb4`。
- 包含最小构建源码、测试/脚本和说明，不含对象文件、可执行程序、旧实验资料、账号凭据或其他任务。是内部诊断传输包，不是TASK-032 release，不作公开再分发。
- 源基线HEAD `91ecc661e0cd856c61bdc5b69f5aa065faadf078`，分支`codex/task023-direct-diagnostics`含未提交候选；文件相同不代表整个远端仓库等于本分支。

## 唯一下一动作：上传并核对包

用已有超算SSH文件管理器把上述本地文件上传至已有目录`/home/bingxing2/home/scx9fv9/pascal-work/`。若同名文件存在，先反馈，不覆盖。不猜外网SSH地址；当前尚无上传成功回执。

上传后，在超算SSH登录终端执行一条仅校验文件的命令（不占GPU）：

```bash
(cd '/home/bingxing2/home/scx9fv9/pascal-work' && printf '%s  %s\n' '1e48a193b391bd65be0d01e650928918855cb64cf727a66e0a9644c861ea5cb4' 'TASK-023-20260826-nsight-preflight-v1.tar.gz' | sha256sum -c -)
```

预期文件名后显示`OK`。失败保留完整输出和原包，不解压、不提交。收到回贴后才逐条指导安全解包、内部清单和目标工具预检，再按需给出单节点2A100/20分钟的提交命令；此回执不授权自动SSH或自动提交。

2026-08-27更新：用户已回贴上述文件名`OK`，见[上传SHA回执](04-upload-sha-confirmed.md)。本地→远端压缩包字节一致已确认；当前最小动作改为新目录安全解压及21项内部SHA核对，尚未执行。历史命令和当时状态保留，不改写为解压完成。

同日后续更新：用户已回贴`ARCHIVE_PATHS_OK entries=27`、21项内部`OK`及`TASK023_EXTRACT_VERIFY_PASS`，见[远端解压回执](05-remote-extract-verified.md)。包目录/tar均已进入`pascal-work/tasks/TASK-023/packages/`；当前下一步改为登录节点只读工具/语法/Node测试预检，仍不运行GPU程序。历史上传/解压命令保留为过程证据。

2026-08-27登录预检更新：第一次回贴确认NVHPC模块及`mpifort/mpirun/nvcc/nsys/sbatch`路径，第二次确认`SRUN=/usr/bin/srun`，但严格子shell随后未继续输出；见[未完成回执](06-login-preflight-incomplete.md)。按原命令顺序，登录节点`nvidia-smi`查找返回非零是最符合停止位置的诊断推断；无独立退出码，不补造确定结论。`srun`不是交付脚本依赖，`nvidia-smi`保留为计算节点runner强制门禁。下一步只重跑修正后的登录预检，不提交作业、不使用GPU。

同日修正版登录预检已完整通过，见[通过回执](07-login-preflight-pass.md)：Node v22.23.2、NVFortran24.5、OpenMPI4.1.7a1、CUDA12.4、Nsight2024.1.1.59、Slurm22.05.8均已回贴，68/68 Node测试、21项内部SHA和最终`TASK023_TARGET_PREFLIGHT_PASS`齐全。此前未完成回执继续保留。当前唯一下一动作改为用户提交冻结的单节点2GPU/20分钟短预检作业；尚无作业ID、计算节点或GPU证据。

同日用户已回贴`Submitted batch job 1456135`，见[提交回执](08-job-1456135-submitted.md)。这只确认调度器接受作业；当前尚无状态、实际节点/GPU、退出码或运行文件回贴，不写成运行通过，也不重复提交。下一步只读查询同一作业状态。

后续状态回贴显示job1456135在`paraai-n32-h-01-agent-154`运行约2分10秒，见[运行中回执](09-job-1456135-running.md)。运行中的`ExitCode=0:0`不是最终值；不提前验收、不重投，待同一作业结束。

最终sacct回贴显示主作业、batch和extern均`COMPLETED`、`ExitCode=0:0`，耗时3分10秒，见[Slurm完成回执](10-job-1456135-slurm-completed.md)。调度层状态已解除，但runner标志、stderr、双卡映射、报告文件及事件内容仍待核对；TASK-023保持review。

完整读回随后确认三层状态均0、双物理GPU UUID映射通过、smoke 4组与capture 2组CSV审计通过、预检SHA复核通过、8个非空报告齐全，见[文件层审计回执](11-job-1456135-file-audit-pass.md)。第一迭代含明显冷启动，两次样本与平台0%粗粒度利用率均不作性能结论。当前仍须检查`.nsys-rep`内CUDA/MPI事件并回收完整原始包。

目标安装随后确认四个stats报告名为`cuda_api_sum`、`cuda_gpu_kern_sum`、`cuda_gpu_mem_time_sum`、`mpi_event_sum`，见[报告名回执](12-nsys-stats-reports-confirmed.md)。下一步先在新派生目录对一份报告副本做stats/importer探针；原始capture目录不生成SQLite/CSV。

单报告stats探针已通过，见[探针回执](13-nsys-stats-probe-pass.md)：SQLite与四份CSV生成，CUDA API、五对角kernel、D2H/H2D和MPI事件均存在，未复现importer139。MPI_Init/Finalize和一次约15.8 ms Alltoallv冷启动主导该全程序trace，不能据此直接定位solver瓶颈。下一步批量分析其余报告副本。

全部8报告stats随后通过，见[批量回执](14-nsys-stats-all-pass.md)：8个rc均0、32份非空CSV、8个SQLite，未复现importer139。当前只有计数/行数摘要，下一步打包原始run、Slurm输出和派生stats，下载后本地核对完整内容。

远端完整证据包已创建，见[打包回执](15-evidence-package-created.md)：323个manifest文件、370个安全归档条目、13468551字节，SHA-256为`6e59b5e45d06afb57a44ff26b8c22cfdd7a02a6b0251684556425709fed16d0d`。本地预定接收路径实查尚不存在；下一步仅用现有SSH文件管理器下载，远端不再生成或重跑。

同日用户完成下载后，本地SHA、安全路径、323项manifest、8报告、32 CSV/8 SQLite、冻结源码及审计器重算均通过，永久回执见 [TASK-023 job1456135本地验收](../TASK-023-20260827-paraai-a100-job1456135/README.md)。历史“待下载”段落保留为当时状态。短采集只支持工具链有效、正确性和阶段线索；TASK-023仍为review，下一动作转为提交前核对formal runner的容量/时限并准备代表性A100重复对照。

## 未覆盖与停止条件

当前仍无真实A100/Nsight/MPI时间线与报告内容验收。首次拟做小规模P1/2 28/22 plain/profiled正确性预检（4配对36数据行），之后P2两槽两模式采集（2配对24行、8个rank报告）。两rank必须有不同UUID；任一错误/超时/缺报告就停，保留整个新目录、Slurmstdout/stderr、应用/工具/包装退出证据及qdstrm（若生成）。SIGKILL或节点丢失可能留下未知/缺失退出证据，不补造成功。

没有NVTX插桩，全程序trace含初始化、独立参考计算和校验；后续必须按实际调用定位solver事件。文件非空与退出码正常不能证明所需CUDA/MPI事件完整。小规模链路检查不外推正式规模瓶颈；不带Nsight的正式P1/2×28/22、2预热+5launch×10迭代对照另行执行。当前SOP的debug/release、真实单/多GPU、跨节点、API/稳定性/生命周期/sanitizer及demo集成等适用门禁仍缺，不豁免。

唯一继续任务：TASK-023（GPT-5.6 Sol / High）。不启动024或其他任务；本轮无新科研结论/来源编号，主张矩阵边界不变。
