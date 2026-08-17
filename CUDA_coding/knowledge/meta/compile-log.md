# 编译日志

| 日期 | 输入 | 动作 | 生成/更新 | 审核 |
| --- | --- | --- | --- | --- |
| 2026-08-17 | SRC-001..005 | 首次源码/申报书审计 | 计划、审计、ADR、EXP-000、主张矩阵 | 部分人工待导师确认 |
| 2026-08-17 | SRC-006 | 编译 Karpathy 自生长知识库方法 | raw/wiki/outputs/meta 四层结构、schema、编译与 lint 流程 | 已核对原帖可访问副本 |
| 2026-08-17 | 全部 Markdown | 迁移后 lint | 36 个文件、0 个失效 wikilink；7 个规范 Wiki 页均有 frontmatter | 自动检查通过 |
| 2026-08-17 | SRC-003..005 | 编译工程执行层 | 模块/生命周期/构建、S1–S6、布局、28→22、一般 m、索引、测试、benchmark、硬件和任务队列 | 源码静态核对；运行环境项保留未知 |
| 2026-08-17 | 全部 Markdown | 工程层迁移后 lint | 50 个文件、18 个规范 Wiki 页、0 个失效链接、0 个缺失 frontmatter | 自动检查通过 |
| 2026-08-17 | SRC-003..005 | 编制正确性/性能运行手册 | V0–V6 命令、阈值、CSV 清洗、HPC、统计和归档 | 五项 Node 复跑通过；51 个 Markdown、0 断链 |
| 2026-08-17 | SRC-003P、SRC-003T | 五对角默认上下文路由 | penta active brief、context profiles、三对角 reference-only 页、入口重排 | 57 个项目 Markdown、20 个规范 Wiki 页、0 断链、0 缺失核心 frontmatter；未删除源码和证据 |
| 2026-08-17 | SRC-002、SRC-003P、SRC-004 | 编译 PaScaL 2.1→五对角迁移边界 | 文献判定、结构/优化迁移表、证据 Gate、谱系路由和论文主张边界 | 副本哈希一致；penta 术语 0 次、tridiagonal 54 次；59 个项目 Markdown、21 个规范 Wiki 页、0 断链 |
| 2026-08-17 | SRC-003 | 建立 GitHub 私有协作基线 | 初始化 `main`、加入协作 README/.gitignore/.gitattributes、推送首个提交 | `b97f919` 已推送；许可证和上游 diff 仍为 P0 未完成项 |
| 2026-08-17 | TASK-003、全部 Markdown、SRC-003/004 | 建立统一本地检查入口 | `check_knowledge.ps1`、`check_math.ps1`、`check_all.ps1` 与 README 命令 | 61 个 Markdown、21 个 Wiki、8 个来源、0 lint 错误；5 个元数据警告；五项 Node 检查通过 |
| 2026-08-17 | 用户协作约定 | 编译单任务交接协议 | AGENTS 强制规则、meta 完整模板、执行指南和任务队列链接 | 每任务必须给复验方法、证据边界和唯一下一任务；Skill 延后到流程稳定后 |
| 2026-08-17 | TASK-001、SRC-003P、SRC-003T | 修复阻塞 collective 后的无效 request 等待 | 三/五对角源码、活动 brief、生命周期、测试矩阵、运行手册和任务回执 | 改动前后统一检查通过；静态确认 WAITALL/request 为 0；缺 NVHPC/MPI，状态 blocked，目标验证待完成 |

每次编译必须留下记录。大规模重构还要写清旧路径兼容方式和被弃用页面。
