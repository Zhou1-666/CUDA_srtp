# KB-GOV-012：G3候选最小修订与版本归档

状态：**done，正常限定文档归档交付**。用户明确选择012，按[011合同](../KB-GOV-011-20260909-g3-ownership-review/integration-plan.md)在固定G2 `669182cf4879aa3ebc9976533178bce0214d4dbc` 上完成隔离候选；只做文档与证据版本归档，不是科研发行或GPU验收。首个完整归档固定为 `49126ad1c92a4aa06e59d051aa25ea00fa62d811`；后续提交只补本回执验收与主树交接证据，不改七页、来源或配套原件。

七页原文来自011审定的继承draft。六页新增独立、带日期的来源/历史/统计注释；SOP原字节保留。原正文、旧日期、否定结果与draft身份保留，012仅对清单中列出的注释和来源行负责。主树七页及来源登记不覆盖。

[输入与修订清单](input-manifest.json)记录可逆修改；[来源登记](source-admission.json)区分继承的33条登记与新分配的SRC-032/033。两类来源使用真实文件集合：TASK-007的23文件（定量仅五个正式输出），TASK-020的3个模型/CSV记录；26文件与KB002固定对象相同，不把历史传输包名伪装成现存已验包。

完整011回执51文件逐字节继承，另纳入上述26文件及9份精确依赖。9份比只解释新增句子的最小7份多保留TASK-007原设计和TASK-025最终合同复核：分别承接原页的批准历史和SRC-026正式负结果角色，均为有限原文件，不复制整任务目录。[范围方案](execution-plan.md)与清单逐项记录允许路径。

登记的模型工具仍是KB002外部依赖；不扩入源码白名单。原始来源许可/隐私说明原样继承，新增集合按private/internal处理，不新增对外再分发授权。index已包含七页；本批只在来源登记与审定账本建立新增来源关系，现有source-map候选同步仍留给后续整合审查，不冒充全库知识编译完成。本轮无新增科学结论或开放科学问题。

本归档携带的queue/blocker/compile-log仍为G2固定时点快照；实时软件状态读取开发主树。新注释不授予实现、采用、排程改变或远端执行权限。主树仅记录本治理任务交接。

## 验证与依赖边界

独立审查的一项端点顺序措辞已修正；[审查记录](local/review-summary.txt)和旧候选/旧manifest均保留。8项反例与回放测试通过；文档组9路径、证据组86路径已逐blob核验。原始.out使用精确白名单纳入，未放开通用忽略规则。原字节空白检查的CRLF及原末尾空行提示按[记录](local/documents-whitespace-boundary.json)保留，不清洗证据。

[依赖清单](dependencies.json)覆盖七页40处本地链接、6处外链、13来源及11脚本身份，共55目标；14目标在本地存在但未入此归档，9目标沿用G2旧内容。只作第一层路径与身份审定，不覆盖锚点、网页重查、递归依赖或运行有效性。

完整知识lint沿用原检查器：G2基线76错误/2警告，当前候选24错误/2警告。24项对应13个集合外目标，全部逐项记录于[lint边界](local/lint-boundary-audit.json)；其中23项也是G2既有错误，1项是迁移页入库后显露的原文链接。未知source ID已消除，两条警告仍来自原source-map缺少扩展元数据。此门为**FAIL**，不能写成“全库全部PASS”。

## 人工复验入口

前置：Node.js、Git及下面保留的独立clone。可从任意工作目录运行，提交SHA固定，不使用随分支推进的HEAD：

```powershell
$repo = 'D:/CUDA/CUDA_repository_recovery/.worktrees/kb-gov-012-clean-clone'
$g3 = '49126ad1c92a4aa06e59d051aa25ea00fa62d811'
node "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/local/verify-archive.cjs" $g3
node --test "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/local/verify-archive.test.cjs"
node "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-011-20260909-g3-ownership-review/local/verify.cjs"
```

预期：`KB-GOV-012 ARCHIVE: PASS`，7页/6注释/26来源文件/86配套证据/163个blob；8项测试通过；`KB-GOV-011 FIXED AUDIT: PASS`（29份固定证据）。失败保存完整stdout、stderr、退出码、固定40位SHA、运行目录及`git status --porcelain`；不修改旧预期SHA迁就活文件。

012入口仅读所选Git对象；测试须在已应用候选的工作树/clone中运行。011入口只读其固定回执。两者都不要求主树科研文档一直保持旧SHA，不执行历史完整验证器，不重新运行模型/GPU，也不证明集合外依赖已闭合。163个blob和68份012回执是上述首个完整提交的计数；后续关闭证据提交会增加自身回执计数。

完整知识检查另在clone运行：

```powershell
pwsh -NoProfile -File "$repo/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "$repo/CUDA_coding"
```

本次原样结果为24错误/2警告，与候选问题集合一致，仍为FAIL。不要将它与限定归档PASS混淆。

制作工具 `local/capture.cjs`、`local/prepare.cjs`、`local/sync-receipt.cjs`、`local/review-dependencies.cjs`、`local/close-main.cjs` 有写操作，只服务本轮准备/交接，不能当人工复验入口重跑。其余local检查辅助脚本会写本轮日志，也不替代上述公开只读入口。

## 关闭与保留

分组提交：文档 `17b373eee4b8037ced1dbbb02cd96e9a092d5e24`、证据 `f57dccbb7b84a5a44fa44f4b21f92afd9c884489`、首个完整回执 `49126ad1c92a4aa06e59d051aa25ea00fa62d811`。[独立clone证明](local/clone-independence.json)确认无共享对象硬链接/alternates、检出字节与固定blob一致且工作区干净；[主树关闭差分](local/main-closeout.json)证明仅三项治理记录改变，反向替换可还原原始全文。

[关闭记录](local/closeout.json)汇总实际验收；[主树范围证明](local/main-scope-closeout.json)确认923/923保护文件保持、主树HEAD/索引和既有分支/工作树保持。主树知识检查379篇Markdown/36页Wiki/33来源，0错误/0警告；候选来源35条与主树33条分开记录。交接准备曾因混合换行选择错标题锚点而在写入前拒绝，按实际首行换行修正后，三文件均通过全文逆向还原，没有清洗旧正文。

保留分支 `codex/kb-gov-012-g3-candidate-archive`、工作树 `.worktrees/kb-gov-012-g3-candidate-archive` 及独立clone `.worktrees/kb-gov-012-clean-clone`。主树七页和来源登记保持，软件进展不由归档快照覆盖；不合并、推送、清理或开展源码任务。

唯一下一任务：**[KB-GOV-013：主树治理集成审定](next-task.md)**，依赖008/G1、010/G2、012/G3与领取时主树，责任方Codex，推荐gpt-6-astra / XHigh。仅登记，未执行。
