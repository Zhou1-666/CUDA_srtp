# TASK-031 Wiki 防错增量与 SRC-028 证据索引

日期：2026-09-03。范围：只把已查明的脚本/构建/预检教训编译到现有 [Wiki 构建与运行环境地图](../../../../wiki/systems/build-and-runtime-map.md)。不创建新软件任务，不修脚本、不扫描全库执行链、不运行 GPU；TASK-031 仍为 `in-progress`，L6 仍 FAIL。

## 用户输入与授权边界

以下为本轮用户聊天摘录（Markdown 转义/终端折行规范化，不是远端原文件）：

```text
grep -n 'STOP_MISSING_COMPUTE_NODE_DEPENDENCY' /home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-031/diag-attach-ab-v1/slurm-1474105.out
5:STOP_MISSING_COMPUTE_NODE_DEPENDENCY
```

用户要求：“而且我想加一条之前犯过的错误加到知识库没 可以加到知识库的wiki中 后面可以再做”。按先入 Wiki、后续再继续修复理解；本轮只维护文档。该 grep 摘录与既有完整回贴一致，不证明实际依赖缺失，不新增 A/B 或 GPU 验收结果；摘录未含 grep 的退出码，不补写。

用户前一轮明确：“我之前虽然跟你说过少申请gpu 我决定撤回这个要求 因为现在的效率是真的感人”。不再以少申请 GPU 为优化约束；已有 TASK-031 授权范围和有假设/有界实验要求仍在，不据此无限重试、自动 SSH、重投旧作业或放宽验收。

## SRC-028：三份直接来源

以下路径相对本文件，均为已保存的用户原始附件副本，本轮不覆盖、不编辑。SHA 为本轮本地读取归档文件所得，不声称重新下载了集群文件。

| 证据 | 原件 | 字节数 | SHA-256 |
| --- | --- | --- | --- |
| 清单错名提交前拒绝 | [原始回贴](../raw/20260903-attach-ab-v1-pre-submit-manifest-refusal-user-transcript.txt) | 10075 | `e68e5b936bfc6d215ca8c3d9143088f3b0008a28ab95ad698db338d3a987a1d9` |
| 生命周期实际构建 | [原始回贴](../raw/20260903-cluster-toolchain-build-user-transcript.txt) | 10020 | `45e829088055257402e04b8afe4fa039e82bed8b1402fbbf01913fbde0fbe1a1` |
| job1474105依赖预检停止 | [原始回贴](../raw/20260903-job1474105-dependency-stop-full-user-transcript.txt) | 23911 | `483f6abbcc4a1822845dd93b884ffeb51cfaf3483287196b1469acef1d23dd50` |

分析/复现不是独立实验来源，必须连同上表原件读取：

- [真实文件错名复现及两行 r1 修正](20260903-attach-ab-v1-manifest-name-repair.txt)：旧版有效包 RED、r1 清单校验和正反例 3/3 为历史检查，本轮未重跑；旧命令不应再执行。
- [实际 build 正文核验](20260903-cluster-toolchain-build-audit.txt)：完整 16 行/1134 bytes 与远端声明 SHA 一致，确认实际 flags 偏差；不是附着根因结论。
- [停止条件回放及本机真实库反例](20260903-job1474105-dependency-stop-audit.txt)：区分 5 份正文直接匹配与 environment 明确还原 tab 后匹配；记录本机只读 ldd 对照，历史 GPU 成功未在本轮重跑。

## 可支持与不可支持

可支持：清单文件名缺陷；生命周期实际 flags 与环境声明不一致；job1474105 的孤立 ldd 硬停止及 plain/A/B 未到达；诊断脚本应有真实输入的正反行为检查。

不可支持：v5 job1473417 附着超时的深层根因、集群安装文件确实缺失、solver 非法内存访问或内存安全通过、本机与集群环境等价。新 Wiki 条目为工程教训草稿，不能冒充已修复或已通过目标测试。

## 本轮验证与后续

允许修改：现有 Wiki 构建环境页、来源登记/地图/index、活动 brief 的防错入口、TASK-031 队列入口/阻塞增量、compile log，以及本回执。开放问题和论文主张只核对；旧证据、提交脚本、v5 archive/manifest/solver/lifecycle 不改。

文档人工复验（本机 PowerShell；任意工作目录）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\CUDA\CUDA_repository_recovery\CUDA_coding\scripts\check_knowledge.ps1" -ProjectRoot "D:\CUDA\CUDA_repository_recovery\CUDA_coding"
```

预期：退出0、`Knowledge lint: PASS`、0警告/0错误。失败保存完整 stdout/stderr 与退出码；该命令只检查知识库，不验证 GPU。

本轮实际验证：知识 lint 退出0，Markdown=304、Wiki=36、Sources=30，Warnings=0、Errors=0，`Knowledge lint: PASS`；八个既有文档的16处许可增量反向还原后，LF规范化SHA与修改前一致，未混入其他正文修改；15个受保护文件SHA不变，含三份原始回贴、原诊断脚本/r1、冻结v5包/manifest/solver/lifecycle与未修改的问题/主张文档；本页及目标Wiki的11个本地Markdown链接均存在。范围核验失败0。相关文件`git diff --check`退出0，仅LF/CRLF提示。这些均是文档/范围检查，不是新的脚本行为测试或GPU验收。

唯一下一任务仍为 TASK-031 有界诊断预检修正与真实正反例验证（按当前合同 GPT-5.6 Sol / XHigh）；原件与实验环境保持冻结，不重投旧 job1474105。依赖是可复现的错误判据及行为回归；超出范围或出现新未知时停止扩改。本轮未开始此修复。
