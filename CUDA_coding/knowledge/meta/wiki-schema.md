# Wiki 页面模式

规范 Wiki 页使用以下 frontmatter：

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

## 状态 Gate

- `draft`：LLM 可创建，不能支持论文结论；
- `reviewed`：结构和来源已人工/独立上下文检查；
- `verified`：有独立数学、测试或实验支持；
- `deprecated`：保留历史与替代页面链接，不删除。

## 页面正文最低要求

- 一句话结论；
- 前提和适用边界；
- 证据与 source ID；
- 与源码/实验/论文的连接；
- 矛盾、未知项和下一问题；
- 相关页面双向链接。

页面可以简短。不要为了“完整”复制原文；摘要应能把读者路由到来源和更细页面。

