# KB-GOV-006：compile-log 的 TASK-031 过程记录归档

- 日期：2026-09-09；责任方：Codex；依据：用户明确选择 KB-GOV-006，依赖 KB-GOV-005 已完成。
- 单一目标：将 compile-log 中 TASK-031 的过程记录移入可追溯快照，活动日志保留关键里程碑与证据入口。历史记录按当时理解，不承担实时状态或命令授权。
- 允许修改：`knowledge/meta/compile-log.md` 的 TASK-031 条目、历史入口及本批里程碑；`task-queue.md` 与 `task-blocker-register.md` 的本批治理记录；本回执目录。其他任务日志原文保持。
- 约束：不改源码、冻结包、原始回执、软件状态/排程/授权或数值门禁；不操作远端或 Git 写入。不修改现有维护架构和全局 lint。
- 验证：3份原始字节备份；142条原记录可还原；相对链接重定位后指向同一目标且保留锚点；其他日志及整个软件 queue/blocker 正文不变；530个保护对象、Git HEAD/index/refs/worktree 保持；知识 lint 与差异检查通过。
- 停止条件：恢复点不匹配、选中条目边界变化、证据矛盾、链接目标不存在或保护对象改变时，停止对应迁移，不猜测补写。

## 核实与最小方案

迁移前 compile-log 为292841字节/656行。按完整物理行的日期后主题 `TASK-031` 确认142条记录，共167678字节（含各条原行尾及紧邻空行）。混合主题条目，例如只读优化预审、SRC-029 排程决定及 KB-GOV-001–005 治理记录，不进入迁移集合；所有原有标题及其他任务记录保留原文。

现行 AGENTS、meta/README、活动 brief 已明确“里程碑入 compile-log、逐次运行和调试入任务回执”。本批直接按既有规则整理，不新增同步机制、按日文件或关键词 lint。

既有142条记录主要指向 v1、v2追认、v3包身份停止、v4、v5、HCOLL诊断、v6、v7 的回执。按这些记录归纳关键里程碑，保留正向局部门通过和负向结果；不重新验收原 GPU 数据。所有原文、旧命令、旧批准、失败和机械复验仍完整归档。

## 恢复点

- [迁移前清单](raw/before-manifest.json)：3份活动文件字节备份及 SHA、142条原记录边界/SHA、530个既有保护对象与 Git 只读快照。
- [完整 compile-log 原始字节](raw/before/compile-log.md.txt)、[queue 原始字节](raw/before/task-queue.md.txt)、[blocker 原始字节](raw/before/task-blocker-register.md.txt)。
- 保护对象覆盖其他已跟踪文件及142条记录直接引用的现存文件；既有任务回执/原件留在原位置，不复制或清理。
- 无新来源、科研主张、门禁、开放问题或知识导航主题；已核 index/map 与路由，无受影响条目。软件 blocker 缺口核对无变化，不重复追加软件快照。

## 交付与验收

- [compile-log](../../../meta/compile-log.md) 从292841字节降至134909字节（含本批关闭里程碑和历史入口）。142条 TASK-031 原记录共167678字节，替换为22条关键里程碑/8995字节；其他任务历史保持，不宣称整个日志已全面精简。
- [完整过程快照](task031-compile-log.snapshot.md) 按原行号索引142条记录；[206个链接映射](local/link-relocations.json)保留目标、片段及原行号；[里程碑清单](local/milestones.json)与[替换清单](local/replacements.json)标明活动日志所保留的内容。反向恢复所有原条目后，完整 compile-log 的 SHA 与恢复点一致。
- 活动文件仅3份：compile-log、本批 [queue 治理行](../../../meta/task-queue.md#知识维护交付不参与软件排程)、[blocker 治理关闭快照](../../../meta/task-blocker-register.md#kb-gov-006--donecompile-log-治理已解除快照)。[最终完整 diff](local/changes-final.diff)以本批恢复点为基准，避免把既有 dirty 混入此次改动。
- [范围/追溯核验](local/verify.log)通过：3份备份、530个保护对象、142条记录及全文可还原、206链接重定位、其他日志原文、48行软件表及整个软件 queue/blocker、Git HEAD/index/refs/worktree 不变；新活动链接与锚点有效。
- [知识 lint](local/knowledge-after.log)：Markdown=361、Wiki=36、Sources=33、Warnings=0、Errors=0，退出0；[最终差异空白检查](local/diff-check-final.log)通过。首次检查在末条新里程碑发现多出的 EOF 空行，已只去掉该新增空行并修正本次迁移脚本；[首次失败记录](local/diff-check.log)与修正前 diff 保留，不修改原始快照或其他日志。
- 仅验收文档治理，未运行 NVHPC、MPI、GPU、SSH 或 Slurm，未改 Git 索引/提交/分支。软件仍 TASK-031/in-progress；L2 用户回执 PASS、v7 GPU 未验收与 v5 完整 L6 历史 FAIL 保持。没有新增软件排程或操作授权。

## 人工复验

在 PowerShell 中运行以下只读命令，输出保存到临时目录，不覆盖本批日志：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-006-20260909-compile-log-task031/local/verify.cjs" 2>&1 | Tee-Object -FilePath "$env:TEMP/KB-GOV-006-verify-user.log"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:/CUDA/CUDA_repository_recovery/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "D:/CUDA/CUDA_repository_recovery/CUDA_coding" 2>&1 | Tee-Object -FilePath "$env:TEMP/KB-GOV-006-knowledge-user.log"
```

预期出现 `KB-GOV-006 VERIFY: PASS` 和 `Knowledge lint: PASS`，知识检查0警告/0错误。失败时保存完整输出、报错路径及当时 diff；范围核验绑定本批完成状态，后续授权改动可能触发差异，应先区分后续工作，不自动回滚。

唯一下一治理任务：**KB-GOV-007，治理收口审计**。依赖本批及既有 KB-GOV-001–005 回执；核对原13项建议的完成/未完/暂缓项及待提交边界，区分主树与未合并的 KB-GOV-002 分支；不新增架构、不执行提交合并或软件任务。责任方 Codex，推荐 **gpt-6-astra / XHigh**；只登记 ready，本批未开始。
