# 基于 Karpathy 思路的自生长 SRTP 知识库

> 版本：v2.0  
> 更新：2026-08-17  
> 项目：PaScaL 分布式带状求解器  
> 入口：[[knowledge/wiki/00-index]]

## 1. 设计结论

采用 Karpathy 的 LLM Knowledge Base 闭环：把论文、网页、源码、数据和图片放入 `raw`，由 LLM 增量“编译”为结构化 Markdown Wiki；通过分层索引和短摘要查询；把有长期价值的问答/图表再归档；定期运行健康检查，寻找矛盾、缺失来源、新连接和新问题。

原帖：<https://x.com/karpathy/status/2039805659525644595>

本项目增加三条科学研究约束：

1. 原始资料与 AI 生成内容物理隔离；
2. 数学、性能和论文主张必须经过独立证据 Gate；
3. AI 不得静默补全缺失数据或覆盖矛盾。

因此“自生长”不是让 AI 自由改写一切，而是让 AI 自动做资料编译、链接、摘要、巡检和候选更新，人类只把关高风险事实与结论。

## 2. 四层结构

```text
knowledge/
├─ raw/                         # 不可变事实来源
│  ├─ inbox/                    # 新论文、网页、数据、图片收件箱
│  ├─ README.md
│  └─ source-registry.md        # 来源 ID、路径、哈希、许可、隐私
├─ wiki/                        # LLM 编译后的规范知识
│  ├─ 00-index.md               # 总入口，只放导航和当前状态
│  ├─ briefs/                   # 给人/Agent 的压缩上下文
│  ├─ maps/                     # 来源—概念—代码—实验地图
│  ├─ concepts/                 # 稳定概念、算法、公式
│  ├─ decisions/                # ADR
│  ├─ experiments/              # 经整理的实验知识
│  └─ paper/                    # 主张、图表、投稿证据
├─ outputs/                     # 查询、报告、图、幻灯片等派生产物
│  └─ README.md                 # 先入 inbox，筛选后再回编译
├─ meta/                        # 知识库自身的状态和维护
│  ├─ wiki-schema.md
│  ├─ knowledge-compiler.md
│  ├─ compile-queue.md
│  ├─ compile-log.md
│  ├─ health-report.md
│  └─ open-questions.md
└─ templates/
   ├─ source-card.md
   ├─ experiment-card.md
   └─ query-output.md
```

这四层分别回答：

- `raw`：原文究竟是什么？
- `wiki`：当前经过整理的理解是什么？
- `outputs`：这次查询/分析产生了什么？
- `meta`：知识库如何增长、哪里不健康、下一步编译什么？

## 3. 为什么不把所有资料直接混放

如果原文、AI 总结和论文草稿放在同一目录，模型可能把自己的旧回答当成独立证据，形成循环引用和幻觉放大。分层后：

- `raw` 是只读证据；
- `outputs` 明确是派生内容；
- `wiki` 是可修订的当前模型；
- `meta` 留下更新收据。

大文件、源码和历史 CSV 不必复制进 vault，只在 [[knowledge/raw/source-registry]] 保存稳定路径、哈希和隐私级别。

## 4. 增量编译闭环

```text
投递来源
  → 登记 source ID/哈希/许可/隐私
  → 抽取事实、方法、数字、限制和未知项
  → 与已有 Wiki 比对
  → 更新旧页或创建新页
  → 增加来源、反向链接、brief 和 map
  → 独立验证/人工 Gate
  → 写编译日志并提出新问题
```

完整执行规范见 [[knowledge/meta/knowledge-compiler]]。

### 小批量原则

每次只编译一个来源或一个紧密主题包。单篇新论文不能随意重组整个目录；累计 5–10 个来源后，才做一次跨来源综合、重复页合并和目录重构建议。

## 5. 新资料进入方式

### 网页/文章

使用 Obsidian Web Clipper 保存为 Markdown，并下载必要图片到本地。登记原 URL、抓取日期、作者和许可。动态网页最好同时保留 PDF/Markdown 快照。

### 论文/PDF

PDF 保持原样；生成 source card，记录 DOI、页码、SHA-256、引用信息和要回答的问题。公式/数字在 Wiki 中引用页码或章节。

### 仓库/源码

登记 Git URL、commit、分支、许可和本地路径。Wiki 只保存架构、API、数据流和关键行链接，不复制大段代码。

### 数据集/实验

保存原始 CSV/日志、环境、命令和校验值；经处理表和图片属于 `outputs`，论文主张引用实验卡和 raw 数据。

### 含个人信息资料

例如申报书只登记为 `private`，不复制到可发布 raw。AI 只抽取项目目标，不将手机号、邮箱等编入 Wiki。

## 6. Wiki 页面模式

每页 frontmatter 至少包含：

```yaml
---
id: KB-TYPE-NNN
type: concept | method | decision | experiment | claim | map | brief
status: draft | reviewed | verified | deprecated
confidence: low | medium | high
source_ids: [SRC-001]
compiled_at: YYYY-MM-DD
updated: YYYY-MM-DD
review_by: YYYY-MM-DD
supersedes: []
---
```

状态含义：

- `draft`：LLM 可创建，不能进入论文结果；
- `reviewed`：来源和结构已检查；
- `verified`：有独立数学、测试或实验支持；
- `deprecated`：保留历史与替代链接，不直接删除。

每页正文应写清：结论、前提、来源、适用边界、源码/实验映射、矛盾与下一问题。

## 7. 渐进式检索，不急着上 RAG

GPT 默认按以下顺序加载：

1. `wiki/00-index.md`；
2. 一个 `brief`；
3. 来源—知识 `map`；
4. 与任务有关的 1–3 个页面；
5. 必要时才打开 raw 原文。

在约百篇页面、几十万词的规模下，索引、短摘要、双向链接和 `rg` 往往已经够用。只有出现以下情况才增加搜索引擎/RAG：

- 页面规模导致索引经常漏掉已知答案；
- 已有至少 30 个检索评测问题；
- 能维护切分、索引更新、权限和引用；
- 不会占用软件与论文关键路径。

RAG 是附加检索工具，不是事实层，也不能替代 source registry。

## 8. 问答如何让知识库生长

一次 GPT 查询结束时，不只返回聊天答案，还要生成或填写 `templates/query-output.md`：

- 问了什么；
- 读取哪些 Wiki 页和 source IDs；
- 得到什么结论；
- 哪些是推断；
- 发现什么矛盾或新问题；
- 是否值得回编译。

只有形成新概念、解决开放问题、更新实验/论文主张或修正矛盾的输出，才从 `outputs/inbox` 编译回 Wiki。普通聊天和重复摘要不归档。

这样每次有价值的探索都会“累加”，同时避免知识库因低价值回答无限膨胀。

## 9. 健康检查与自修复

### 每次编译后的轻量检查

- 新页面是否有 source IDs；
- 是否更新 index/map/brief；
- 是否产生断链或重复概念；
- 是否把推断写成事实；
- 是否新增开放问题和编译日志。

### 每周 health check

- 来源覆盖：raw 中是否有长期未编译来源；
- 新鲜度：来源哈希变化后哪些页面需重编译；
- 结构：孤立页面、断链、重复标题、过长页面；
- 一致性：同一数字/公式/术语是否冲突；
- 证据：verified 页是否真有独立证据；
- 论文：`待核验` 是否被写成确定结论；
- 隐私：是否混入账号、密钥或个人信息；
- 连接发现：提出 3–5 个候选新连接，但不自动升格为事实。

结果写入 [[knowledge/meta/health-report]]；矛盾和缺失进入 [[knowledge/meta/open-questions]]。

### 禁止的“自动修复”

- 没有来源时猜一个数字；
- 把两份矛盾结果平均；
- 删除失败实验；
- 因新论文出现就自动覆盖已验证实现；
- 将 AI 旧回答作为独立来源支持新回答。

## 10. 本项目的首批自生长主题

编译队列见 [[knowledge/meta/compile-queue]]，当前顺序：

1. MPI collective/request 生命周期缺陷页和 ADR；
2. 上游来源、许可与本项目贡献边界；
3. 一般半带宽 `m` 的正式理论页；
4. 五对角 28→22 逐方程槽位映射；
5. benchmark 数据字典与性能口径；
6. Poisson/Helmholtz 最小集成知识包。

## 11. GPT 模型路由

| 知识任务 | 推荐模型 | 强度 |
| --- | --- | --- |
| raw 登记、格式、基础摘要 | `gpt-5.6-luna/terra` | low/medium |
| 增量编译和跨页链接 | `gpt-5.6-terra` | medium |
| 文献证据判断、矛盾定位 | `gpt-5.6-sol` | high |
| 数学公式、反例和证明 | `gpt-5.6-sol` | xhigh |
| health check 和新连接候选 | `gpt-5.6-sol` | high |
| 论文主张升级/降级审计 | `gpt-5.6-sol` | xhigh |

模型生成页面不等于页面已 verified；状态由证据决定。

## 12. 与 AGENTS.md 和未来 Skill 的关系

- `AGENTS.md`：每次任务必须遵守的稳定规则，包括 raw 不可改、输出先隔离、证据 Gate；
- 本指南：解释知识架构与人机分工；
- `meta/knowledge-compiler.md`：每次增量编译的具体流程；
- 未来 `knowledge-compiler` Skill：在流程经过两三个真实来源验证后再提炼，自动登记、编译、lint 和留收据。

不要把整个 Wiki 放进 Skill。Skill 只保存稳定工作流，并通过 index/brief/map 渐进加载项目知识。

## 13. 质量指标

每周记录：

- raw 来源数与已编译比例；
- draft/reviewed/verified/deprecated 页面数；
- 无 source ID 页面数；
- 断链和孤立页面数；
- 过期来源关联页面数；
- 被解决的开放问题数；
- 问答输出回编译率；
- GPT 任务上下文文件数、返工次数和错误数；
- 论文已支持主张比例。

目标不是回编译率越高越好，而是长期知识密度、可追溯性和后续任务成功率提高。

---

最终验收：新资料进入后能被登记、编译、链接、验证和索引；一次有价值的研究问答能留下可复用增量；任何论文主张都能反向追到不可变原始来源。

