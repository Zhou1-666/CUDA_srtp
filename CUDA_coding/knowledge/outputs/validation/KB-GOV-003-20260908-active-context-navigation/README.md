# KB-GOV-003：活动上下文与历史证据分离

状态：`done`（纯文档治理）；类别：知识治理维护，不参与软件排程。

## 授权与范围

2026-09-08 用户批准第三批方案：“可以 直接进行 同时注意不要搞混啊”。本批只整理活动 brief 与 Wiki index；旧状态完整归档，链接保留指向原证据。实时任务、执行顺序仍由 task-queue 管理，具体缺口由 blocker 管理。

允许修改六个文档：`wiki/briefs/penta-active-context.md`、`wiki/00-index.md`、`meta/README.md`，以及 `meta/task-queue.md`、`meta/task-blocker-register.md`、`meta/compile-log.md` 中本批维护记录与下一治理项登记。后三者的既有内容不迁移、不更改软件任务状态。本批不改源码、阈值、既有原始回执、冻结包、Git 分支/提交/暂存区或远端；不新增 YAML 状态机、自动同步或 lint 规则。

## 实施与验收

1. 保存六文档原始字节与 SHA-256，冻结 Git 身份及保护对象；基线知识 lint 通过。
2. 为旧 brief/index 建立可阅读快照，重定位相对链接；另保留原始字节副本和逐链接映射。迁移前检查指向被移除标题的入站引用。
3. 活动 brief 只保留项目背景、技术约束、最小读取顺序及专题入口；index 保留导航，状态/Gate 改为 queue/blocker/SOP 指针。
4. 验收完整历史可还原、快照链接仍指向同一文件/锚点、新页本地链接有效、Git/软件任务与保护对象不变、知识 lint 通过；随后追加本批正常关闭快照及一条里程碑。

停止条件：恢复副本、来源映射或保护对象不匹配；本批新断链或 lint 错误；发现无法判定的旧状态覆盖关系。不得通过改软件状态或覆盖原始证据使检查通过。

## 历史与恢复

- [恢复清单](raw/before-manifest.json)包含六份副本、路径/大小/行数/SHA-256及 366 个保护对象；仅为本批恢复点。
- [原 brief 字节](raw/before/penta-active-context.md.txt)、[原 index 字节](raw/before/wiki-00-index.md.txt)完整保留，便于逐字节恢复。
- [brief 完整快照](penta-active-context.snapshot.md)、[index 完整快照](wiki-00-index.snapshot.md)及[241 个链接重定位记录](local/link-relocations.json)；旧文中的“当前”“下一动作”只表示记录当时的含义，不授予执行权限。归档只重定位相对链接并为原先省略扩展名的现有文件补上 `.md`，没有改写历史正文。
- TASK-031 的排障详情继续引用已有候选回执，不把相同过程再按日期拆出副本。

## 结果与交接

| 活动页 | 整理前 | 整理后 | 字节减少 |
| --- | ---: | ---: | ---: |
| penta-active-context.md | 83,431 字节 / 274 行 | 4,677 字节 / 61 行 | 94.4% |
| wiki/00-index.md | 36,100 字节 / 187 行 | 6,718 字节 / 97 行 | 81.4% |

行数按正文实际行计算，末尾换行不另算一行；字节包括原有 frontmatter。既有 Wiki 元数据与科学结论状态不升级。meta README 明确两个入口已整理、queue/blocker 历史仍待下批处理；其余三项只追加治理记录及一条里程碑。

[迁移复验](local/migration-final.log)核对：6 份原文副本、366 个保护对象、241 次链接重定位，两个归档正文可还原原文；354 次活动页/归档页链接目标路径检查通过，原证据锚点保持。Git HEAD、暂存区、refs 和 worktree 列表不变；queue/blocker 原始全文前缀及 compile-log 原始尾部保持。未发现仓库默认可见 Markdown 中指向被移除标题的入站引用，见 [检索记录](local/inbound-anchor-search.log)。

[最终知识 lint](local/knowledge-final.log)：355 Markdown / 36 Wiki / 33 Sources，0 Warnings / 0 Errors，退出 0。没有修改源码，不执行数学或 GPU 回归；文档通过不构成 TASK-031 验收。一次性核对脚本初次有括号语法错误，已修正后重跑；原失败输出保留在 `local/migration-first.log`。链接解析初查把带版本号的 Wiki 文件名误判为扩展名，已按实际文件解析并补全 `.md` 后核对，未修改原件。

人工复验（任意工作目录）：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-003-20260908-active-context-navigation/local/verify.cjs"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:/CUDA/CUDA_repository_recovery/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "D:/CUDA/CUDA_repository_recovery/CUDA_coding"
```

预期分别为 `KB-GOV-003 MIGRATION VERIFY: PASS`、`Knowledge lint: PASS`，退出 0；失败保存完整 stdout/stderr 和退出码。本批脚本绑定此恢复点；后续授权修改保护对象或 Git 后，不应篡改旧快照让旧检查继续通过。未来入库本快照时须保护原始字节，避免 Git 换行转换破坏 SHA。

已核对 index/map、来源与开放问题：仅 index 导航受影响，没有新增 source ID、科学主张或研究问题，来源地图及问题页保持。本批与 KB-GOV-002 独立，在主工作区维护活动文档，未修改第二批分支或其验证 clone。

唯一下一治理项为队列中 **KB-GOV-004 / ready**：收敛 task-queue 顶部状态堆叠，完整归档旧文，保持有效软件状态、合同、授权及执行顺序；依赖 KB-GOV-003 完成，责任方 Codex，推荐 **gpt-6-astra / XHigh**。本批仅登记，尚未领取或执行。

软件线是保护边界：TASK-031 仍保留原状态和待管理员调度说明的依赖，本批没有运行它，也不把它列为治理下一批。
