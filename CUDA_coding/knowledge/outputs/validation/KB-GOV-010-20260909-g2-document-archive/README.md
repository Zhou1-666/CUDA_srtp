# KB-GOV-010：G2 文档版本归档

状态：**done，正常文档归档交付**。本批按用户“KB-GOV-010 进行 上面全部PASS了”及[009合同](../KB-GOV-009-20260909-g2-ownership-review/integration-plan.md)执行，保存带归属说明的文档版本；不等于完整知识库或求解器交付。[验收记录](local/closeout.json)对应首个完整提交 `eb41ec2dc9dafa5935544d1e468f1193b596feab`；后续提交只补本目录验收证据。主树另记治理关闭，不合并本分支。

## 范围与来源

- 基点固定为 G1 `ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67`；新分支 `codex/kb-gov-010-g2-document-archive`，工作树 `.worktrees/kb-gov-010-g2-document-archive`，独立 clone `.worktrees/kb-gov-010-clean-clone`。
- [input-manifest.json](input-manifest.json)逐项列明17份文档：4份A类无首批治理前实质改动、10份B类继承静态内容、3份C类滚动meta；保存源字节、候选SHA、009审定SHA及归属。14份静态页与009审定一致，不能把继承的整页内容称为010创作。
- 194份配套证据逐字节纳入：009审查目录165份、[003–007补充复验目录](../KB-GOV-003-007-20260909-snapshot-replay/README.md)29份。后者是本轮显式审定的新增依赖，承接用户已批准且报告PASS的入口；G1旧回执和脚本不重写。
- 初次捕获为2026-09-09 05:59:26 UTC。三份meta发生并行更新时准备程序拒绝继续，原件及失败输出保留。审查后在06:05:19 UTC形成V2；旧V1未覆盖。V2补丁和原件位于 `raw/concurrent-v2/`，有效输入清单位于 [raw/input-state-v2.json](raw/input-state-v2.json)。
- 三份meta继承009关闭、003–007补修关闭及TASK-031软件进展；V1→V2仅第33节真实预检用户PASS/rc0及切换待单独确认。它们属于后续治理/软件增量，不算001–006治理创作。该捕获时点TASK-031尚未完成GPU验收；之后主树第34节新增六门运行PASS用户回执，不改变此固定快照，也不由010代验软件。
- 唯一正文修正只在候选queue：TASK-002B的 `outputs/reviews/...` 改为 `../outputs/reviews/...`。[独立差分](local/queue-link-fix.patch)可见；原始快照与主树原链接保留。精确 `.gitattributes` 仅追加17路径及三批证据目录的 `-text`，避免换行转换。

候选中的queue/blocker/compile-log是上述时间点的历史快照，因此可保留领取前的010状态。主树的010关闭记录随后单独留证，不反向覆盖这17份冻结文档。源码、研究结论、G3、主树合并、远端作业及卫生清理均不在本批范围。

## 依赖和知识检查边界

[dependencies.json](dependencies.json)审计17页的434处字面引用、221个本地目标。只覆盖第一层本地路径，不覆盖锚点、外部网站、命令执行或递归依赖。TASK-002B修正后目标可达，但候选保留base旧稿，其SHA与主树新稿不同，分类为 `base-older-content`，没有静默扩大范围复制新稿。

完整知识检查保持原断言：G1基线25错误/4警告；G2候选76错误/2警告。详见 [local/lint-boundary-audit.json](local/lint-boundary-audit.json)及原始日志。76项全部归类：58处引用依赖21个集合外目标（当前主树存在），18处来源ID依赖本批未纳入的新来源登记；两条警告来自未纳入的旧知识映射页。G1自带检查器与主树检查器检查候选所得问题相同。此门保留 **FAIL**；通过的是限定路径、字节、归属及归档复验，不能写成“全库全部PASS”。

主树收口另用PowerShell 7、显式 `-ProjectRoot` 检查，结果385篇Markdown/36页Wiki/33来源、0错误/0警告。Windows PowerShell的默认参数和新TASK-031证据深层目录枚举失败输出也保留；未改检查器或清理运行原件。这是主树当时检查结果，不能替代G2 clone的76项依赖缺口。

## 人工复验

前置：Node.js、Git，以及含本次G2提交对象的仓库。公开入口只读Git对象，要求显式40位提交SHA；不读取历史脚本中固定的主树路径，也不要求活主树一直保持旧SHA。

交付 clone 的完整命令（首次取得SHA后请保留打印值，长期复验直接使用该固定值）：

```powershell
$repo = 'D:/CUDA/CUDA_repository_recovery/.worktrees/kb-gov-010-clean-clone'
$g2 = git -C $repo rev-parse HEAD
$g2
node "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-010-20260909-g2-document-archive/local/verify-archive.cjs" $g2
node --test "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-010-20260909-g2-document-archive/local/verify-archive.test.cjs"
node "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-003-007-20260909-snapshot-replay/verify.cjs"
```

预期：第一条验收命令输出 `KB-GOV-010 ARCHIVE: PASS`，17文档/194证据/1处queue修正；8项测试通过；补充入口逐项报告003–007覆盖及通过。测试在本G2工作树或clone运行；主树未应用候选链接修正，不是测试夹具。失败时保存完整stdout、stderr、退出码、40位SHA及 `git status --porcelain`，不修改旧预期哈希迁就活文件。

008保留原入口及原运行位置：

```powershell
node 'D:/CUDA/CUDA_repository_recovery/.worktrees/kb-gov-008-clean-clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/local/verify-archive.cjs'
```

008检查其原G1整树，不能挪到新增G2路径后的HEAD运行。003–007补充入口只重放已声明的固定证据，不等于重新执行当时全部工作区保护和GPU检查。

`local/prepare.cjs`、`local/sync-receipt.cjs`、`local/review-dependencies.cjs` 是有写操作且绑定本次捕获位置的一次性制作工具，不是人工复验入口，不在新clone重跑。`verify-archive.cjs --staged` 只供隔离候选提交前核暂存内容；日常使用显式固定SHA。

## 验收机制与交接

归档检查从固定提交读取17页、194份证据、源快照及本批文件清单；验证原字节可还原、唯一queue修正、追加属性及相对G1的精确变动范围。范围查询禁用重命名识别，旧G1路径的删除不能伪装成允许的新文件；真实临时Git反例先FAIL再修复，8项回归全部通过。

分组提交保存静态页、滚动meta及证据；每组核暂存blob，完整版本在独立且无共享对象硬链接的clone验收。独立clone的检出字节和清洁状态另核。固定提交检查自身不声称保护此刻主工作区、执行旧历史脚本、闭合全库依赖或运行CUDA/MPI/GPU。

本批没有新增科研来源、论文主张或开放科学问题，不为同步而复制软件排程到brief/index。关闭只更新主树queue、本任务blocker快照与compile-log一条里程碑，并保留并行软件内容。唯一建议下一维护事项是 **KB-GOV-011：G3归属与依赖审定**（依赖009/010，Codex负责，推荐gpt-6-astra / XHigh）；只登记待用户选择，未执行页面入库、主树集成或架构修改。

[主树范围证明](local/main-scope-closeout.json)记录872保护对象中871份保持，另1份TASK-031 README是已审查的并行软件更新；不能把它写成“872份全未改”。[关闭差分](local/main-closeout-changes.json)及前后原件可逆还原，软件正文原位保留；主树HEAD/索引、旧稳定分支和002/008工作树及clone保持。最终保留010分支、工作树与独立clone，不推送、合并或删除。
