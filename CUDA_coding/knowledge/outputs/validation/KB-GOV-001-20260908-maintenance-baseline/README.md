# KB-GOV-001：知识治理首批实施与恢复点

状态：`done`（正常文档交付），仅完成本批允许范围。

## 授权与范围

2026-09-08，用户在完成 13 条建议审查和流程设计后回复“可以 实现吧”。本批对应已推荐的“恢复点＋维护规则止血＋过期入口纠正”：只修改文档，保留既有未提交内容、原始回执、冻结包和工作树。本批不提交 Git、不删除或搬迁文件、不添加 ignore/lint 功能，不改源码、门禁、任务软件排程或远端状态。

软件任务仍按 [task-queue](../../../meta/task-queue.md) 继续 TASK-031；治理任务 KB-GOV-001 不参加软件排程，不将本次文档交付记成 TASK-031 进展。

## 恢复点

- 修改前 HEAD：`91ecc661e0cd856c61bdc5b69f5aa065faadf078`；暂存区为空，展开后的 status 为 13,707 条。156 是此前折叠目录后的条目口径，不是实际文件总数。
- [恢复清单](raw/before-manifest.json) 登记 16 个允许修改的文档、4 个未跟踪验证器的原始字节副本和 SHA-256，以及 23 个保护对象的指纹。全部副本创建时逐字节复核。
- [Git status](raw/git-status-before.txt)、[跟踪清单](raw/git-tracked-before.txt)、[工作树清单](raw/git-worktrees-before.txt)、[暂存区](raw/git-staged-before.txt) 和 [原有文档 diff](raw/git-existingDiff-before.txt) 保存本批开始状态。Git 无法读取用户全局 ignore 的警告保存在对应 stderr 文件；命令退出码均为 0，本批未改变 Git 配置。
- 原始 Markdown 以 `.md.txt` 保存，避免备份被知识 lint 当作新的 Wiki 页；字节未转换。恢复时按 manifest 的 `path` 与 `backup` 对应，只还原本批目标，先核对是否出现后续改动，不批量覆盖其他工作。
- 这是本批目标的恢复点，不是全仓库备份。其他未跟踪产物与活动 worktree 未复制；后续移动、清理或提交前仍须为当批范围建立恢复点。

## 本批改动与决定

| 主题 | 具体变化与边界 |
| --- | --- |
| 维护职责 | AGENTS、meta README、compiler、impact map 和 handoff 统一为核对影响后再修改；queue 管排程，blocker 管缺口，brief/index 管约束和导航，compile-log 只记里程碑，逐次排障进入已有任务回执 |
| 当前与历史 | 新增/更新的当前区不再逐层堆叠；已有大段历史本批不移动，不以“当前”字样次数作为检查规则 |
| done 与关闭处置 | 正常交付、不采用、经明确批准的撤回分别记录；未运行门禁保留 NOT-RUN，不把提交、冻结或任务关闭等同于采用/验收 |
| blocker 快照 | 每个 done 任务保留最短关闭证据，不限曾 blocked 的任务；新软件关闭记录统一到已解除区，知识维护用已有维护区。历史缺项补录和旧快照搬迁仍待后续批次 |
| 排程覆盖 | 由维护者依据明确授权在 queue 记决策者、日期、原/新顺序、生效范围及证据；不要求用户亲自编辑，不自动解除 Gate 或扩大执行权限 |
| AGENTS 失效 P0 | 移除“REPORT 写 28→约18”的活动指认。当前 REPORT 已写 28→22；原错误指认保存在 [AGENTS 原文](raw/before/AGENTS.md.txt)。2026-09-08 是撤销指认日期，不冒称当天修改 REPORT；其余发布边界和历史 Gate 限制保留 |
| current-project-brief | 保留 ID、路径、来源和历史正文，改为 `deprecated`，标明 2026-08-20 历史快照及替代入口；index 不再称它是完整当前项目摘要 |
| 顶层入口 | 手册声明操作入口/历史命令与规范的边界；代码地图将局部预检与正式验收分开；GPT 指南标为旧版模板，并标明旧 TASK-002A 首任务及 executor 设想已过期；根 README 的 TASK-023 推荐显式标为历史 |
| 历史无主待办 | data-ownership 页补 collective 根因、最小修复和回归链接，承担旧“缺陷页＋ADR-002”需求，不新建重复页面；来源/贡献知识承接到已有页面，NOTICE/引用最终复核仍归 TASK-002B。compile-queue 不改 |

原始问题依据：[REPORT](../../../../CUDA_code/源代码/perf_bench/REPORT.md)、[TASK-001 修复回执](../../queries/OUT-20260817-009-TASK-001-MPI通信生命周期修复.md)、[TASK-001 目标验证](../TASK-001-20260817-wsl-nvhpc24.11/README.md)、[来源与贡献边界](../../../wiki/reference/upstream-diff-and-contribution-boundary.md)、[TASK-025 关闭](../TASK-025-20260828-local-implementation/README.md)、[TASK-007 撤回](../TASK-007-20260830-task5-target-gates/TASK-007-20260831-withdrawal-disposition.md)。这些证据未重写。

无新 source ID、科研问题、算法结论或论文主张；source map、open-questions、claim matrix、原始 source registry 和 active brief 经影响核对无需改写。现有技术审计已经是快照，本批保持不变。

## 验证与交接

修改前：[knowledge-lint-before.log](local/knowledge-lint-before.log)，Markdown=350、Wiki=36、Sources=33、Warnings=0、Errors=0，PASS，退出 0。

最终验证见 [保护与差异核对](local/verification-final.log) 和 [知识 lint](local/knowledge-lint-final.log)。检查覆盖恢复副本、保护对象、历史正文、软件任务记录、Git HEAD/暂存区、新增链接及本批空白差异；审查差异见 [batch1-review.diff](local/batch1-review.diff)。这些只验文档与保护边界。

首轮知识 lint 已通过；保护脚本首轮把 git diff --no-index 的正常差异退出码 1 误判为失败，未发现备份或源码变化。按 systematic-debugging 用 [正常/坏空白对照](local/whitespace-probe/result.json) 复现 rc1/rc3，修正检查为接受无空白错误的 rc0/1；[初次失败](local/verification-first.log) 与 [修正后通过](local/verification-reviewed.log) 均保留。没有通过放宽源码/任务保护断言获得 PASS。

人工复验（仓库根目录，Node 与 Windows PowerShell）：

```powershell
node 'D:\CUDA\CUDA_repository_recovery\CUDA_coding\knowledge\outputs\validation\KB-GOV-001-20260908-maintenance-baseline\local\verify.cjs'
powershell -NoProfile -ExecutionPolicy Bypass -File 'D:\CUDA\CUDA_repository_recovery\CUDA_coding\scripts\check_knowledge.ps1' -ProjectRoot 'D:\CUDA\CUDA_repository_recovery\CUDA_coding'
```

预期首条 `KB-GOV-001 verification: PASS`、退出 0；第二条 `Knowledge lint: PASS`、退出 0。失败保存完整 stdout/stderr 与退出码；这只验文档与本批保护边界，不证明 GPU、MPI 或软件候选通过。

## 后续批次边界

本批没有实施以下工作，不把它们记为已完成：

1. 历史六个 done 任务的关闭证据补录及散落 blocker 快照迁移。
2. 验证器与调用方分组提交、主树/worktree 候选入 Git、完整 clone 复验；hepta 两脚本已被跟踪，不能按孤儿删除。主树与旧 TASK-007 的注释差异不等于无验证依据。
3. TASK-031 历史段归档和 active brief 精简；复用现有版本回执，不按日期机械拆分。
4. verify/logs 有用证据归档、精确 ignore、根目录副本去重与磁盘清理；需先核实实际引用与逐文件哈希。
5. 明确当前区、复验脚本依赖及状态/证据的增量 lint；不做关键词计数或全文同步。
6. 论文窄主张拆分与审阅、容量模型页旧投影修正。已审查边界仍是前向载荷元素数、固定配置 solver 计时与缓冲区容量模型；不据此主张总 MPI 流量、实测显存峰值或通用扩展性。本批不改变 claim matrix 的支持状态。

唯一下一软件任务：TASK-031，依赖管理员对 job1483542 调度/可见性的说明与后续真实回执；推荐 gpt-6-astra / XHigh。本批未查询集群或更改作业，状态沿用原回执，不把旧 PENDING 快照冒充一次新的远端观测。
