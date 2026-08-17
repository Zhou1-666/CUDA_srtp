# AI 上下文路由

> 目的：按任务装载最小证据包，避免把全仓库、三对角基线和长文档重复灌入模型上下文。

## 默认配置：`penta-default`

按顺序读取：

1. 仓库根 `AGENTS.md`；
2. [[../wiki/briefs/penta-active-context]]；
3. [[task-queue]] 中当前任务；
4. 一张任务专属 Wiki 页面；
5. 目标函数的局部源码片段；
6. 一个直接验证入口。

不要因为文件存在就读入它。先用 `rg` 定位符号、调用点和测试，再读取必要行段。

## 任务配置

| 配置 | 额外读取 | 默认排除 |
| --- | --- | --- |
| `penta-mpi` | data ownership、test matrix、`pascal_a2av` 及调用点 | 三对角；仅共享缺陷比较时例外 |
| `penta-28-to-22` | slot map、penta layout、相关 JS | 论文全文、性能历史报告 |
| `penta-performance` | benchmark protocol、hardware matrix、当前实验卡/CSV | 一般 `m`、论文正文 |
| `penta-lineage` | [[../wiki/reference/pascal-tdma-2.1-to-penta-transfer]]；不足时再读 SRC-002 对应章节 | 与论证问题无关的论文页和三对角源码 |
| `paper` | claim-evidence matrix、已审核实验卡、引用来源 | 未支持主张、临时输出 |
| `tri-reference` | [[../wiki/reference/tridiagonal-baseline]]、最小三对角片段 | 与比较目的无关的三对角内容 |

## 扩展规则

- 只有当前证据不足以回答具体问题时才扩展一层；
- 每次扩展要说明缺少什么证据，以及新材料将回答什么问题；
- 先读摘要、地图和函数片段，再考虑长文档或全文；
- 一次任务只维护一个主目标，算法、重构和性能优化分开提交；
- 任务结束后，把可复用的新结论写入 Wiki；过程性回答保存在 `outputs/`。

## Token 口径

仓库文件的磁盘体积不等于 token 消耗。未被工具读取、未放进提示词的文件不会占用当前任务上下文。物理删除三对角资料通常只会降低可追溯性；本路由通过“默认不读、按触发读取”实现节省。
