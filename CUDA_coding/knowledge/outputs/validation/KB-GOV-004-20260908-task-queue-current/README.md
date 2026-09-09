# KB-GOV-004：task-queue 当前区收敛

状态：`done`（纯文档治理）；类别：知识治理，不领取或执行软件任务。

## 合同

2026-09-08 用户明确选择 KB-GOV-004，承接“整理 task-queue 顶部状态堆叠”的 ready 项；依赖 KB-GOV-003 已完成。本批只修改 `meta/task-queue.md` 顶部与治理行、`meta/README.md` 对整理范围的说明，以及 blocker 中本治理项的关闭/后续登记和 compile-log 的一条里程碑。责任方 Codex，推荐模型及推理强度沿用合同 gpt-6-astra / XHigh。

保持全部 48 行软件任务表、任务合同、批准条件与执行顺序；不改 TASK-031 的 blocker 原文。不得通过删掉失败、改变授权或重排软件任务来消除文档矛盾。不改源码、阈值、原始任务回执、冻结包、Git 或远端，不新增状态机或自动同步功能。

实施顺序：四份原始字节恢复点 → 完整 queue 快照及链接重定位 → 核对有效状态/排程/停止边界 → 压缩顶部 → 验证软件表/合同与证据不变 → 治理关闭记录。遇到有效声明无法判定、指纹变化或新断链即停止相应步骤，保留双方证据。

## 有效声明与历史

- 当前动作依据迁移前 queue 第 11 行、TASK-031 表行和 blocker 对应条目：job1483542 待管理员解释调度；单次授权已消耗，GPU 未验收。这三处一致，本批没有查询远端。
- 后续顺序依据原第 121 行的 2026-09-04 用户决定及已批准顺序设计：TASK-031 → TASK-033 → 公平基线/瓶颈 → 单变量候选 → B 组合验收 → TASK-032 → TASK-011。原第 132 行也指明 031 后唯一领取 033。
- 原下方合同仍有“031 后立即论文”等旧表述，本批保持正文并在顶部明确其历史口径；不把它当成新排程。2026-08-31 TASK-007 硬停止与旧候选撤回边界继续有效，不被新顺序追溯解除。
- 原顶部的 v5/r1 旧执行指针与“可再提交一次”仅按当时解释，移入快照，不再与第 29 节并列作为当前动作。

## 证据与恢复

[恢复清单](raw/before-manifest.json)记录四份原文及 368 个保护对象；[原 queue 字节](raw/before/task-queue.md.txt)、[完整可读快照](task-queue.snapshot.md)、[100 项链接映射](local/link-relocations.json)完整保留。本恢复点不是整库备份。

原第 211 行的 TASK-002B 链接写成 `outputs/reviews/...`，相对 meta 目录少了 `../`。已核实目标实际存在于 knowledge/outputs/reviews；只修正快照导航并登记映射，live 合同原文不改。[初始检查](local/original-link-audit.json)和[停止输出](local/migration-initial-refusal.log)保留。后续维护下方合同可单独修复这一旧链接，不影响本批顶部整理。

## 验证结果

- 顶部从 56,641 字节 / 135 行降到 4,404 字节 / 28 行，字节减少 92.2%；整个 queue 的表格与合同正文仍在本页，没有为了缩小文件移走任务合同。
- [迁移复验](local/migration-final.log)：四份原文、368 个保护对象保持；48 行软件任务表、从“既有任务”到治理区前的完整正文相同；原 blocker 历史和 compile-log 旧里程碑保持。
- 归档全文可按映射还原原文，旧锚点保持；活动页与快照的新增/重定位链接目标存在。live 合同保留上述 1 个已知旧断链，无新增断链。Git HEAD、暂存区、refs/worktree 列表保持。
- [最终知识 lint](local/knowledge-final.log)：357 Markdown / 36 Wiki / 33 Sources，0 Warnings / 0 Errors、退出 0。纯文档任务未执行数学、NVHPC、MPI/GPU 或远端检查，不构成软件验收。
- index/brief、来源地图、source registry 和开放问题已核对：本批没有新增来源、科学主张或研究问题，入口路径没有改变，因此保持这些页面；meta README 仅更新 queue 已整理、blocker 尚待整理的范围说明。

人工复验（任意工作目录）：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-004-20260908-task-queue-current/local/verify.cjs"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:/CUDA/CUDA_repository_recovery/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "D:/CUDA/CUDA_repository_recovery/CUDA_coding"
```

预期 `KB-GOV-004 VERIFY: PASS` 与 `Knowledge lint: PASS`、退出 0；失败保存完整 stdout/stderr 和退出码。迁移脚本与核对脚本都是本批工具，不加入仓库 lint；后续授权改变保护对象或 Git 时，旧检查会失效，不得篡改旧恢复点掩盖新状态。未来提交归档时须保留原始字节，避免换行转换改变 SHA。

## 交接

只关闭 KB-GOV-004 治理交付；软件线保持其原任务、状态和依赖。唯一下一治理项是队列中 **KB-GOV-005 / ready**：整理 blocker 内 TASK-031 的历史堆叠，保留活动缺口、责任方、解除条件及全部证据，依赖本批完成；责任方 Codex，推荐 **gpt-6-astra / XHigh**。本批仅登记，尚未领取或执行。
