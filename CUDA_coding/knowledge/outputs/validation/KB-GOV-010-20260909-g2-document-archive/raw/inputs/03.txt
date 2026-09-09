# 知识库入口与权威性声明

## 唯一规范版本

`knowledge/wiki/` 是项目可复用知识、任务结论和论文主张的**唯一规范版本**。导航和论文写作从 [[wiki/00-index]] 路由；普通五对角编码先读 [[wiki/briefs/penta-active-context]]，按当前任务加载对应页面。

该权威性限于可复用技术知识与主张：实时状态和排程以 [[meta/task-queue]] 为准，缺口以 [[meta/task-blocker-register]] 为准，协作约束以根 AGENTS 与 [[meta/task-handoff-protocol]] 为准。顶层运行手册、代码地图和模板可作操作入口，但须链接对应规范，不维护第二套验收标准。

`06-decisions/`、`07-experiments/`、`10-paper/` 是迁移前的兼容目录；其中页面只保留旧链接跳转，**不得编辑、不得引用为证据、不得与 Wiki 内容做双向同步**。遇到同名文件时一律使用 `wiki/` 路径。

## 四层职责

- `raw/`：不可变原始资料与来源登记；
- `wiki/`：规范、可复用的项目知识；
- `outputs/`：单次实验、审查和问答回执；
- `meta/`：任务状态与知识库维护规则。

两人团队的日常最小读取与维护范围见 [[meta/README]]；无需为普通开发遍历全部 `meta/` 文件。
