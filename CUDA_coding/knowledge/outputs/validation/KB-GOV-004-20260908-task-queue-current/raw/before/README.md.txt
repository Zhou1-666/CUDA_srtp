# 两人团队的最小知识库工作法

本页是 `meta/` 的日常入口。目标是保留可追溯性，而不要求每次开发浏览或维护全部协议页。

## 普通开发：只读这四项

1. 根 `AGENTS.md`；
2. [[../wiki/briefs/penta-active-context]]；
3. [[task-queue]] 中当前领取的一项任务；
4. [[task-blocker-register]] 中该任务的条目，以及一个直接验证入口。

完成任务时，按 `AGENTS.md` 核对任务回执、任务状态和阻塞台账；只有发生变化才修改对应项。影响论文主张、Gate、稳定验证方法或上下文路由时，才修改 claim matrix、运行手册或活动 brief。无增量在交接中注明，不重复生成状态副本。

## 按需资料，不是每日必读

- `context-routing.md`：需要为 GPT 装载最小上下文时；
- `task-handoff-protocol.md`：交接格式不确定时；
- `change-impact-map.md`：改动跨源码、测试和论文三类对象时；
- `knowledge-compiler.md`、`wiki-schema.md`：新增来源或新 Wiki 页时；
- `compile-log.md`：只记录已完成的里程碑，不逐次记录普通调试；
- `health-report.md`：阶段性健康快照，不是实时状态；
- `compile-queue.md`：2026-08-17 的历史规划快照，当前执行顺序只看 `task-queue.md`。
- `penta-knowledge-maintainer`：来源录入、实验归档或任务交接时按需使用的 skill；[源码](../../../skills/penta-knowledge-maintainer/SKILL.md) 与 [[../outputs/validation/KB-SKILL-001-20260826-penta-knowledge-maintainer/README|验证回执]]。不是普通编码的额外必读页，也不是后台自动执行器。
- `cluster-submit-preflight`：稀缺远端 allocation 提交前，对冻结真实产物执行登录节点只读命令并显式保留计算节点风险；[源码](../../../skills/cluster-submit-preflight/SKILL.md) 与 [[../outputs/validation/KB-SKILL-002-20260904-cluster-submit-preflight/README|验证回执]]。不授权 SSH、Slurm 或 GPU 操作。

这套分层的原则是：日常开发维持最小状态，只有确实需要复核、归档或论文写作时才打开维护资料。

## 按事件维护（2026-09-08 起）

| 事件 | 保存位置与最小更新 |
| --- | --- |
| 新运行、失败或排障证据 | 对应 `outputs/validation/<任务或候选>/` 回执；原件进入其 `raw/`，不覆盖旧文件 |
| 当前状态、依赖、执行顺序或下一动作改变 | [[task-queue]]；具体缺口、责任方与解除条件改变时更新 [[task-blocker-register]] |
| 可复用知识、验收标准或论文主张改变 | 对应 Wiki 页；导航或来源关系改变才更新 index/map/brief |
| 已完成里程碑 | [[compile-log]] 记日期、结果与证据指针；逐次调试、命令输出和重复复验留在任务回执 |
| 形成可复原的交接单元 | 在该任务已授权 Git 操作的前提下，按候选及依赖审查、检查并提交；不按目录拆散验证器与调用方 |

任务状态与排程只有 queue 一个实时来源；blocker 管缺口；brief/index 管约束与导航。顶层运行手册、代码地图和工作流模板可以保留，但必须说明职责与现行规范入口，不独立维护另一套验收标准。

## 当前摘要与历史

- 新增或更新的活文档当前区只保留一份摘要；旧状态原文保存在对应任务回执或有日期的历史区。迁移前保存原文与来源映射，不改原始回执或冻结包。
- 活动 brief 与 Wiki index 已在 [KB-GOV-003](../outputs/validation/KB-GOV-003-20260908-active-context-navigation/README.md) 收敛为约束与导航入口；queue/blocker 的历史堆叠尚未迁移，继续按各自有效声明读取，后续单独整理。此规则不以“当前/最新”字样出现次数判错。
- 优先复用已有任务/候选目录，不默认按日拆文件；将段落折叠不等于减少模型实际读入的内容。
- 提交只保存版本；冻结只保存输入；验收按适用 Gate；采用与否另记。冻结包和 worktree 不能一概称为已验证版本。

本批恢复点、授权范围、验证与后续批次见 [KB-GOV-001 回执](../outputs/validation/KB-GOV-001-20260908-maintenance-baseline/README.md)。
