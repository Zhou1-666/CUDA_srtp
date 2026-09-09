# KB-GOV-007：治理收口审计回执

- 日期：2026-09-09；责任方：Codex；依据：用户明确选择“KB-GOV-007：治理收口审计”。
- 单一目标：对照原13项建议及 KB-GOV-001–006，核事实、完成边界与待提交归属，形成最小后续清单。
- 允许修改：本回执目录；`knowledge/meta/task-queue.md` 和 `task-blocker-register.md` 的本次治理记录；`compile-log.md` 一条完成里程碑。业务文档与代码均只读，不改变维护架构。
- 约束：不新增科研结论、不改变软件状态/排程/授权，不执行 Git 写入、清理、SSH、Slurm、GPU 或源码任务。
- 验收：13项均有判断及文件/版本依据；17个治理文件的来源和既有变更可区分；分支/工作区归属与候选边界明确；恢复点、保护对象、软件 queue/blocker 与旧日志保持；本报告链接和知识 lint 通过。
- 停止条件：保护对象或版本身份改变、证据不能对应、范围内文件被并发修改时，先保留差异，不猜测或扩大提交范围。

## 交付

- [十三项建议审计](audit-report.md)：区分治理完成、版本归档与实际验收；注明仍未完成和暂缓项。
- [待提交范围与顺序](commit-plan.md)：显式分组、13个既有脏文档的边界、字节保护/依赖/clone前提；不提供全库 add 脚本。
- [状态统计](local/status-summary.json)、[Git/候选归属](local/git-ownership.json)、[工作树盘点](local/worktree-inventory.json)、[17路径清单](local/governance-paths.json)、[小包抽样比对](local/small-archive-comparison.json)、[规则行号摘录](local/rule-evidence.json)。
- [恢复点](raw/before-manifest.json)：3份允许修改文档的原始字节、587个既有文件SHA，以及 Git HEAD/index/refs/worktree 快照。原始 status 使用NUL分隔保存，便于区别目录折叠与展开文件数。

## 结论边界

前六批主要完成工作区中的轻量治理和指定历史归档；整库版本还账未完成。四个验证器已在 KB-GOV-002 分支可检出，主树仍未纳入；hepta 两脚本本来就已跟踪。六个 done 关闭快照、卫生/ignore、容量投影和论文措辞仍待后续，不借审计自动修复。

本次 Git 读取报告无法访问用户全局 ignore；原 stderr 保留。忽略判断以实际叶路径与本仓库规则为准，不把带尾斜杠目录探针的含混结果当成“目录内容全部忽略”。首次展开 status 输出过大，后续完整输出写文件再统计，没有据截断文本计数。小包比较只覆盖25个≤1MB根包的同名候选，不代表完成所有大包/改名副本去重。

无新来源编号、论文主张、软件 Gate 或研究问题；核过 index/map/路由，无新增主题，不改这些文件。软件 blocker 的技术缺口不变，本次只关闭治理审计。

## 最终验证与交接

- [范围与指纹核验](local/verify.log)：13项判断及理由长度（最多17字）、3份恢复点、587个既有保护对象和8个补充指纹通过；48行软件任务及整个软件 queue/blocker、旧 compile-log 正文保持，状态清单除本批目录外保持；KB-GOV-002 分支与clone仍干净，Git HEAD/index/refs/worktree不变。
- [知识 lint](local/knowledge-after.log)：Markdown=364、Wiki=36、Sources=33、Warnings=0、Errors=0，退出0。新增报告/回执/清单的链接路径检查通过；本批未重跑 CUDA、MPI 或历史 GPU 实验。
- [最终差异](local/changes.diff)与[空白检查](local/diff-check.log)：活动文件只改 queue/blocker 本批治理记录及 compile-log 一条里程碑。其余新增文件均在本目录，旧治理回执和业务文件保持。
- KB-GOV-007 为正常审计交付 done；不把未完成的原建议改成已完成，不把独立分支提交当主树集成或源码验收。

## 人工复验

在 PowerShell 中运行以下命令，输出保存至临时目录，不覆盖本批日志：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-007-20260909-governance-closeout/local/verify.cjs" 2>&1 | Tee-Object -FilePath "$env:TEMP/KB-GOV-007-verify-user.log"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:/CUDA/CUDA_repository_recovery/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "D:/CUDA/CUDA_repository_recovery/CUDA_coding" 2>&1 | Tee-Object -FilePath "$env:TEMP/KB-GOV-007-knowledge-user.log"
```

预期 `KB-GOV-007 VERIFY: PASS`、`Knowledge lint: PASS`，知识检查0警告/0错误。失败时保存完整stdout/stderr、报错路径与当时diff。范围检查绑定本批完成状态，后续授权修改会触发差异，应先区分后续工作，不自动回滚或削弱断言。

唯一下一治理任务：**KB-GOV-008：治理证据版本归档（G1）**；依赖本审计与提交清单，责任方 Codex，推荐 **gpt-6-astra / XHigh**。仅登记 ready，本批未创建分支或开始实施；软件下一动作仍以 queue 为准。
