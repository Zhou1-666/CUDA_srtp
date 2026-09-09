# 第 B 批：有界修订与路径／分块冻结

日期：2026-09-09。基线：`78fec880c5b5d7e47d3c4042fb02aee26c43a06c`。

目标：收口既有 B 批文档，不集成科研源码或 TASK-031/T2 活跃执行更新。本页前述内容记录候选冻结时的授权边界；2026-09-10 经后续明确授权完成受控暂存、内容提交及独立 clone 验收，关闭结果见文末。

## 执行与验收清单

- [x] 对照原 B 批 15 路径和三份混合 meta 审阅归属；A 批历史不重写。
- [x] 修正 TASK-019 人工复核、TASK-007 撤回、TASK-009 正式数据与未集成工具入口的过时表述。
- [x] 构建／测试页收敛为稳定方法；旧运行时间线原件与修订前全文保留，禁止用新结论改写旧回执。
- [x] 认领 31 个精确证据路径的新增引用最小闭包，逐件核原件指纹；不纳入源码、活动工具包或目录通配。
- [x] 三份 meta 候选保持 HEAD 中科研状态／依赖／授权，只纳入审定的模型元数据；工作区较新的 TASK-031 模型及运行更新另列差异，不回滚。
- [x] 从基线加精确候选形成独立验收树，核链接、文档 lint、空白检查、路径和 blob。
- [x] 记录机器清单、候选补丁和 seal；主索引为空，受保护源码与原件未变。最终数值以本机 `candidate-verification.json` 和 `freeze-seal.json` 为准。
- [x] 按 53 路径受控暂存；53/53 实际 staged blob 与冻结值一致，5 个科研源码路径均未暂存。
- [x] 创建 B 批内容提交并以独立 clone 验收；提交、checkout、引用、原件及文档 lint 均满足冻结合同。

## 冻结集合与分块合同

冻结共 **53 路径**：15 个 B 批原文档、3 个混合 meta、1 个 `.gitattributes`、31 个最小证据依赖、3 个控制文档（本页、机器清单、既有受控集成清单）。精确路径、基线 blob、工作区输入 SHA-256、候选 SHA-256 与候选 Git blob 全列于 [机器 allowlist](20260909-batch-b-allowlist.json)，不以目录认领。

- 15 文档沿用已审阅集合；知识库搭建指南排除无关 EOF 清理，普通文档候选仅统一 CRLF 为 LF，工作区原始字节与候选字节分别记录。
- `compile-log.md`、`task-blocker-register.md`、`task-queue.md` 从冻结 HEAD 加原模型回执中的精确替换构造；`selected-meta-edits.json` 逐项记录 before/after，逆向还原必须与 HEAD 原字节相等。GOV-004 被选行仅随该行消除 CRLF 空白噪音；不清理其他行。
- 工作区只补 GOV-015 缺失模型列，不以整页候选覆盖工作区。TASK-031 后续模型建议、作业与资源更新不属本批；并发更新保留在工作区。
- `.gitattributes` 只增加这 31 个证据路径的精确 `-text` 规则；不使用目录通配，不改变 Git 空白配置。
- 31 依赖由 19 个新增引用所需历史文件、6 个模型回执文件、2 份硬件观测回贴和 4 份模型调整前原字节快照组成。历史 `.diff` 仅作为证据，不应用其中源码补丁；CSV 仅逐字节保存，不重算或编辑。
- 机器清单记录 52 个 payload 指纹；其自身指纹由本机外部 seal 记录，避免自引用。候选补丁和 seal 均位于下述本机归档，未来暂存须逐 blob 匹配，不能直接全文件 `git add` 混合 meta。

## 限定原件保真例外与验收

2026-09-09 用户明确批准：“接受限定原件保真例外”。完整默认 `git diff --cached --check` 退出 **2**，不是全量 PASS；737 条提示仅来自以下 10 份冻结证据。仅排除这 10 个精确路径后退出 **0**。各原件完整 SHA-256 及告警数同时进入机器清单；其余 B 批文件不得沿用例外。

下表路径均相对于 `CUDA_coding/knowledge/outputs/`；`M` 为 `queries/OUT-20260909-task-model-effort/raw/`，`V` 为 `validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/raw/`，仅为阅读缩写，不是 Git 路径通配。

| 精确原件 | 提示数 |
|---|---:|
| M + `before-compile-log.md.bin` | 2 |
| M + `before-task-blocker-register.md.bin` | 7 |
| M + `before-task-queue.md.bin` | 1 |
| M + `knowledge-lint.log` | 2 |
| `reviews/TASK-002A-20260827-attribution-amendment.md` | 1 |
| `validation/TASK-010-20260826-paraai-a100-job1454628/local/remote-vs-implementation-solver.diff` | 7 |
| V + `20260903-attach-ab-v1-pre-submit-manifest-refusal-user-transcript.txt` | 200 |
| V + `20260903-cluster-toolchain-build-user-transcript.txt` | 130 |
| V + `20260903-job1474105-dependency-stop-full-user-transcript.txt` | 385 |
| V + `20260904-job1475609-terminal-readback-user-transcript-normalized-lf.txt` | 2 |

验收覆盖独立候选树中 53 个实际索引 blob、76 处新增依赖引用、31 份证据字节、49 条历史模型映射、三份 meta 逆向还原、TASK-019 签字来源及四份主附件指纹。独立树文档 lint 为 `Markdown=182, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS。这里的索引仅为隔离验收副本；主仓库没有暂存、提交或推送。没有运行数学、CUDA/MPI、GPU 或性能门禁，不据此关闭科研候选。

## 修订边界

1. `general-m-reduction` 引入签字前审阅与独立电子确认回执，明确仅剩投稿前检索；统计交集修正属于冻结审阅版本，不能说本批集成了 C 批工具。
2. `benchmark-protocol` 保留 per-call pinned 否定数据和旧重开原因，但当前必须服从后来的撤回／硬停止；不重开候选、不升级收益。
3. `hardware-matrix` 的节点／驱动为 2026-09-04 观测；不将旧 agent-28 指针当成新的节点选择授权。
4. `build-and-runtime-map` 仅保留稳定环境信息及有直接原始回贴的 SRC-028 三项工程教训。逐次排队、上传、提交和附着记录继续归对应历史回执，不随 B 批认领活动控制器。
5. `test-matrix` 将版本运行状态退回 queue/blocker；历史脚本名与 main 可运行入口分开，TASK-009 正式矩阵事实按 claim matrix 的限定口径；本轮不运行或集成源码工具。
6. 模型调整回执保持当时原字节，不用其历史映射覆盖工作区后续 TASK-031 建议；补齐 GOV-015 模型列。候选仅采用审定的模型段，不采用新的作业／资源／授权正文。

## 证据与保留范围

原 B 批 15 文件在修订前仍与首次恢复归档逐字节一致；原文保存在仓库本机 `.kb-local-archive/post-6b959f5-controlled-integration-20260909-v1/tracked-working-files/`。本轮领取快照、差异、候选和验收日志保存在该归档的 `batch-b-review-20260909-v1/`。该目录被忽略，不伪称已进入 Git；后续提交使用冻结候选，不从当前工作区整页取代分块文件。

对已有 HEAD 回执，本批只复用其既有引用，不宣称整个历史原始实验树均随 clone 携带。新认领依赖必须在机器清单中逐路径列出，保持原字节；外部原始包、未集成源码、历史节点事实和原件身份核验限制分别记录。旧回执内的“当前／下一步／未提交”按当时解释，不能执行其历史命令。源代码、数值门、许可决定、研究状态与 P5 延后决定不变；没有新增科研主张、来源编号或开放问题，不为同步复制 index/map 或新增 KB-GOV 任务。

## 内容提交与独立 clone 关闭记录

2026-09-10 B 批内容提交已形成：`39100fa4facf6f9a5a2f959019183a905812f766`，parent 为冻结基线 `78fec880c5b5d7e47d3c4042fb02aee26c43a06c`，tree 为 `ce32a83c94d62ad2f66d6fba70244ab85c5a51e8`。提交恰含 53 个冻结路径（33 新增、20 修改，`+5392/-123`）；提交前索引树与提交树一致。机器 allowlist 的 `frozen-not-staged` 是冻结时点状态，不追溯改写。

独立副本使用 `git clone --no-local --no-hardlinks --single-branch --branch main` 建立并保持干净：53/53 commit blob 与 checkout 原字节一致，76 处新增引用可定位，31 份新认领证据保持冻结 SHA；知识库 lint 为 `Markdown=182, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS。完整空白检查按记录退出 2，737 条提示仍精确来自获批的 10 份原件；排除这些路径后退出 0。提交过程核对 1,359 个主工作区文件指纹未变，提交后主索引为空；TASK-031 后续状态、指南 EOF 差异和 C 批源码继续留在工作区。未推送，未运行数学、CUDA/MPI、GPU 或性能验证。

本机完整验收记录位于 `.kb-local-archive/post-6b959f5-controlled-integration-20260909-v1/batch-b-review-20260909-v1/commit-clone-acceptance.json` 及同目录日志；该目录受忽略保护，不冒充 Git 携带证据。本 closeout 只将已完成事实补记到既有清单，不新建 KB-GOV 任务或改变软件队列。

人工文档复验（仓库根）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\CUDA_coding\scripts\check_knowledge.ps1' -ProjectRoot '.\CUDA_coding'
```

内容提交后，该命令预期退出 0、lint 零警告／零错误。提交前冻结脚本只适用于 `HEAD=78fec880` 且索引为空的时点，现由上述内容提交和独立 clone 验收记录取代。失败保存完整 stdout/stderr、退出码、HEAD 和 staged 路径；文档检查不替代 GPU 验收。

唯一下一治理动作：审阅并冻结 C 批 5 个科研源码路径的任务归属、候选指纹及源码验证合同；依赖独立源码任务和 `source-change-validation-sop.md`，推荐 `gpt-6-astra / High`。本页不授权暂存 C 批、运行远端或提交源码。
