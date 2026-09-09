# KB-GOV-011：G3归属与依赖审定

按用户选定的011合同完成七页来源、继承内容和第一层依赖审定。[审定报告](audit-report.md)、[逐页账本](ownership-ledger.json)及[下一合同](integration-plan.md)是主要交付；验收与主树交接结果见 `local/`。

状态：**done（仅审定合同）**。[关闭记录](local/closeout.json)汇总固定回执/异地目录复验PASS、4项测试通过及知识检查0错误/0警告；[范围核对](local/scope-final.json)单列并行TASK-031回执变化。关闭记录与活工作区核对不属于29份固定证据复验的覆盖范围。

结论：七页均保留；六页需要最小来源/时点/统计注释，SOP保持原文draft。本轮七页和来源登记均未修改，也未提交Git、修改科研结论或架构。仅在本目录形成审定证据，完成时同步queue、blocker与compile-log的治理记录。

## 核实结果

- 七页均为未跟踪draft，SHA全部与010审查记录一致；未进入main/G1/G2/KB002四个固定树。确认是继承内容，未确认人类作者，不将旧全文算作011创作。
- 11个source ID均已登记：7个文件SHA匹配，SRC-003P仍是旧冻结源码身份，另3项属于源码树/官方网页定位。旧profile和TASK-020模型缺对应实验/派生登记，后续须凭实物登记，不能虚构编号。
- ADR-005缺撤回终局导航；迁移矩阵和术语页含旧的“当前”时点。EXP-003须分开all10主口径与stable8敏感性口径，EXP-004须说明复制降幅是两个方向的端点。数值本身与已读记录一致，详见报告。
- 30处本地链接、6处官方外链；加来源位置、10项直接提及的脚本、1项选定编排依赖与registry本身，共47个本地目标。目标都存在，但16个文件只在本地工作区可定位，另有KB002独立来源和G2旧版本，不能宣称依赖闭合。
- 独立四页审查记录74份输入及统计规则，包含5份TASK-007输出和40份TASK-025 profiled CSV；本轮随后逐一核SHA匹配。此后活软件更新不改变已冻结审定证据。

官方页面观察仅对应2026-09-09访问时点，[六项记录](external-checks.json)保留URL和版本。术语页混合4.1与5.0.7链接的边界需保留；例如[Open MPI 5.0.7文档](https://docs.open-mpi.org/en/v5.0.7/launching-apps/slurm.html)中的兼容条件不能自动套到目标站点4.1版本。

## 人工复验

前置：Node.js和本回执完整文件。运行位置任意；入口只读本回执内29份固定证据，校验固定manifest、七页原件、来源登记、四个已捕获Git树、链接清单及证据行号，不读取原始记录中的主树绝对路径。

```powershell
node 'D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-011-20260909-g3-ownership-review/local/verify.cjs'
node --test 'D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-011-20260909-g3-ownership-review/local/verify.test.cjs'
```

预期：`KB-GOV-011 FIXED AUDIT: PASS`，29份固定证据/7页/30本地链接/47目标/11来源/11脚本身份；4项测试全部通过。失败保存完整stdout、stderr、退出码和所用回执目录；不要改旧原件SHA迎合活文件。

这不是旧工作区保护或GPU重跑：脚本不重新联网、不重新解析全部运行数据、不核活Git/当前作者归属、不执行SOP命令或历史完整验证器。它验证当时审定包的身份和内部对应关系，不授予候选采用或后续任务权限。

当前主树文档检查另运行：

```powershell
pwsh -NoProfile -File 'D:/CUDA/CUDA_repository_recovery/CUDA_coding/scripts/check_knowledge.ps1' -ProjectRoot 'D:/CUDA/CUDA_repository_recovery/CUDA_coding'
```

使用已安装PowerShell 7并显式给项目路径；此命令检查当时主树，未来文件变化可能导致不同结果，不能替代上面的固定回执复验。`local/audit-dependencies.cjs`是一次性制作工具，会读取活依赖并重写本回执清单，不属于长期只读复验入口，交付后不要重跑它。

## 边界与下一任务

本轮只关闭“审定”合同；没有把七页或当前源码变成已验证交付物，也没有归档到Git。现存原始来源、旧回执、G1/G2/002分支与软件进展保持各自职责。无新科研来源或科学开放问题需要本轮编译，index与source-map已核路由，未为审计复制排程。

唯一下一项：**KB-GOV-012：G3候选最小修订与版本归档**，依赖011审定与010固定G2，责任方Codex，推荐gpt-6-astra / XHigh；仅登记，用户选择后才实施。六页有限注释、一页原文保留、真实来源登记、限定路径独立归档，不合并主树或修改架构。
