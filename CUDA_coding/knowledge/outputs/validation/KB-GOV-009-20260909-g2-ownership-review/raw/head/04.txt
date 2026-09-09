# 两人团队的最小知识库工作法

本页是 `meta/` 的日常入口。目标是保留可追溯性，而不要求每次开发浏览或维护全部协议页。

## 普通开发：只读这四项

1. 根 `AGENTS.md`；
2. [[../wiki/briefs/penta-active-context]]；
3. [[task-queue]] 中当前领取的一项任务；
4. [[task-blocker-register]] 中该任务的条目，以及一个直接验证入口。

完成任务时，按 `AGENTS.md` 更新任务回执、任务状态和阻塞台账；只有影响论文主张、Gate 或稳定验证方法时，才更新 claim matrix、运行手册或活动 brief。

## 按需资料，不是每日必读

- `context-routing.md`：需要为 GPT 装载最小上下文时；
- `task-handoff-protocol.md`：交接格式不确定时；
- `change-impact-map.md`：改动跨源码、测试和论文三类对象时；
- `knowledge-compiler.md`、`wiki-schema.md`：新增来源或新 Wiki 页时；
- `compile-log.md`：只记录已完成的里程碑，不逐次记录普通调试；
- `health-report.md`：阶段性健康快照，不是实时状态；
- `compile-queue.md`：2026-08-17 的历史规划快照，当前执行顺序只看 `task-queue.md`。

这套分层的原则是：日常开发维持最小状态，只有确实需要复核、归档或论文写作时才打开维护资料。
