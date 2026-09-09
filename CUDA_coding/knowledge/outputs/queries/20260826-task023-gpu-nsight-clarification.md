# TASK-023：GPU按需申请与Nsight分析范围澄清

2026-08-26 用户最新澄清原文：

> 我没有提出不要申请GPU 我的意思是 也就是说只要在必要的时候申请GPU 同时这个TASK023不是用Nsight进行不同阶段的分析么

## 当前有效约束

- GPU在任务实际需要时申请；本地代码/脚本/解析/传输准备能先完成的先完成，避免闲置占卡。先明确卡数、节点数、时间、目的和停止条件，再由用户执行对应SSH/调度操作。不自动SSH、不直接提交远端作业、不扩大到其他任务。
- 旧TASK-010交接中的“不重新申请GPU”不能继续解释为TASK-023或整个项目的长期禁令。此前要求“只能等待有效已有分配”的推断已被本澄清替代；历史回贴及封存归档不改写。
- squeue仅表头仍证明该次查询未见账号作业，但**不再构成禁止申请所需资源的理由**。

## TASK-023要交付什么

任务目标是定位五对角求解各阶段的耗时与并行执行情况，不是声称已完成优化。当前已完成的是方向计时、每rank CSV、普通入口对照及本机功能/解析审查；尚未完成本候选的目标Nsight采集分析或正式性能验收。

1. **Nsight Systems（nsys）**用于查看CUDA kernel、内存搬运、MPI调用在时间线上的分布；结合已知调用顺序与per-rank输出辨认前向/后向阶段。时间线中的MPI调用耗时仍包含等待，不能无证据断言网络或具体等待原因。官方说明见 [User Guide](https://docs.nvidia.com/nsight-systems/UserGuide/index.html)。
2. **代码内直接计时与CSV**用于每方向allocate/D2H/MPI/H2D/free、payload及plain/profiled扰动的定量对照，不代替尚未做的Nsight分析。TASK-007曾出现nsys importer rc139；原任务允许工具失败时保留失败证据、回退直接计时，不能把工具崩溃写成solver失败或悄悄声称拿到了时间线。
3. **无分析器的普通入口计时**用于真实端到端性能基线；分析器及profiled同步可能扰动时间，不将trace期间的总时长当作正式性能结论。
4. **Nsight Compute（ncu）**用于具体kernel的硬件指标，例如占用率/访存；不是本轮必须无差别采集的步骤。先由nsys定位，再决定是否需要针对少数kernel采集，不自动进入内核调优任务。官方说明见 [Nsight Compute](https://docs.nvidia.com/nsight-compute/NsightCompute/index.html)。

当前AGENTS及 [源码变更验证SOP](../../wiki/testing/source-change-validation-sop.md)已明确：触及solver的诊断候选也要核对完整适用门禁。现有7项模型与本机release smoke不等于8项数学/容量、debug+release、实际单/多GPU、跨节点、内存生命周期及候选demo集成全部通过。下一轮运行前要把这些列成逐项PASS/NOT-RUN/经批准的复用清单，不能只凭Nsight图或单节点smoke关闭任务。本次仅澄清和更新台账，不修改候选代码或擅自豁免门禁。

## 唯一下一动作

继续TASK-023（任务合同GPT-5.6 Sol / High），先检查目标环境当前可见的Nsight Systems版本。由用户在超算SSH终端运行；此检查不需要GPU、不申请资源、不启动求解器：

```bash
nsys --version
```

预期输出版本号；若报`command not found`，仅表示当前PATH未找到，不能断言平台未安装。无论成功失败都保存完整回贴。拿到版本后核对其帮助/安装位置及已有失败回执，准备匹配版本的短时采集与失败保留脚本；准备完成后按任务需要申请资源，再进行实际绑定/正确性/采集和普通入口对照。

状态保持review；本次无新GPU结果、无性能提升主张，无源码/阈值/原件变更、无提交/合并/推送。只纠正当前队列/阻塞台账/brief/index与运行说明，Q-020仍开放；历史221文件归档及其清单不改动。
