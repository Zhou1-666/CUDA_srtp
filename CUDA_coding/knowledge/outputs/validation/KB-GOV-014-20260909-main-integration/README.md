# KB-GOV-014：主树治理受控集成

状态：done（治理集成）。用户于本任务明确选择“KB-GOV-014 主树治理受控集成”，授权按013审定方案进行本地文件集成、分组提交及独立clone验收。本轮未推送、清理、运行GPU/SSH/Slurm、采用科研候选或公开发布。

范围为013的717静态目标路径及逐项列明的013/014回执。基底为main `5c9724a79146e7a6d4e9819b63a5baa6f7f7fd7b`；其中220份G1证据已提交，不重复计为本任务成果。九项候选只修改六页注释、两条来源及映射、精确字节属性；三份meta保留实时软件正文。

输入已冻结于[intake.json](intake.json)，恢复副本与初始Git读数由[input-seal.json](input-seal.json)封存；完整静态范围见[integration-manifest.json](integration-manifest.json)，自身回执使用[receipt-files.json](receipt-files.json)逐文件列举。旧013回执187份逐字节保留。2026-09-09 P1 清账后，树内 `intake.json` 与 `raw/git-status-all.bin` 改为小指针；原始 `4943028` / `2575121` 字节按各自 SHA-256 保留在已忽略的 `.kb-local-archive/`。本回执的历史 seal/manifest 不重算；重放制作工具须先按指针取回原件，不得把指针 JSON 当原始 intake。

A组提交为 `6f01a6453a3f4d447f397f5197acf76fe4361d9c`：471个剩余静态路径、187份013回执及32份本批初始证据，共690路径。B组提交为 `e1a4f38ffedb54d2771eb158e03d8017b65b6432`：26份文档及逐项回执，实际新增/变更43路径。两组每个暂存blob均与工作区原始字节匹配。B通过完整独立clone验收后，以三份meta及精确本批回执作关闭补充；该补充提交的SHA由交付消息给出，避免把自身SHA循环写入本提交。

九项实际修改及SHA见[applied-proposals.json](applied-proposals.json)。013属性候选继承的自身LF转换规则与原CRLF前缀冲突；本轮只在其末尾追加自身`-text`覆盖，保留原文与其余规则。过滤/不经过滤的Git blob都为 `b0a5e61b3433fdf2720aa7a65930fb99aa5bd394`。独立审查及处置见[review-notes.md](review-notes.md)。

三份meta从当时活文件增量修改，逆向关系见[meta-edits.json](meta-edits.json)。科研正文、历史日期、软件状态、Gate和授权均保留，不从G3旧快照覆盖。

## 并发变化与边界

本批捕获16,695个范围外文件指纹。A前检查发现一个T1 README变化，原失败保留；另有两份T1 transcript/audit在领取后新增。经独立只读核对可解释为T1用户构建回贴进展，三份均保留现场、排除于014暂存。见[并发见证](local/concurrent-supplement.json)。不把16,694个旧文件匹配表述成范围外没有新增，也不把T1构建当成014的GPU或科学验收。

B后又发现独立T2任务新增五份工具，初次失败见[保护原输出](local/protection-after-b.json)。独立只读审查后，只对精确T2根目录内新文件作当时路径/SHA采样，保持排除014；T2后续进展不要求被冻结。关闭前[保护检查](local/protection-closeout.json)通过：16,694旧文件原SHA相同、一个旧T1文件符合已审例外、T1两新增件指纹保持，非main分支和worktree身份不变。全球Git ignore文件不可读，检查覆盖限于捕获的旧路径与Git可见新增路径。

主工作区知识lint在九项应用后为392 Markdown / 36 Wiki / 35来源，0错误/0警告。新建独立clone的实际结果为169 Markdown / 36 Wiki / 35来源，0错误/0警告；数量较工作区少是未纳入其他散件，不能外推全库依赖已经闭合。历史G3的24错误/2警告原回执保持；本轮纳入15个限定历史入口后的真实检出已通过。

[B检出与lint原输出](local/clone-b-first-checks.json)和[固定回放原输出](local/clone-b-replays.json)记录10项检查：完整本地clone使用`--no-local`，无alternates或shallow，3个pack相关文件均只有一条硬链接；717静态文件、187份013回执、B时46份014回执的检出字节与blob完全一致。003–007固定快照、G1独立clone、G2/G3固定SHA、013封存入口，以及014固定提交/封存输入/16项测试均通过。旧回放未运行项继续保留，不作为历史完整验收。

## 复验入口

`local/verify-integration.cjs --inputs` 只验证封存输入；传入40位固定提交SHA时只读取Git对象，核717静态路径、187份013回执、自身精确文件表、497静态变动、九项候选、三meta的限定修改，以及源码提交树与基底完全一致。不会读取未来活文档来决定旧提交是否通过。

人工只读复验，以下命令固定已验收B候选；最终关闭提交可使用交付消息中的40位SHA替换它。预期`KB-GOV-014 INTEGRATION: PASS`和`Knowledge lint: PASS`；失败保存全部stdout/stderr与退出码，不重新运行制作工具。

```powershell
$clone = 'D:/CUDA/CUDA_repository_recovery/.worktrees/kb-gov-014-clean-clone'
$receipt = "$clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration"
node "$receipt/local/verify-integration.cjs" e1a4f38ffedb54d2771eb158e03d8017b65b6432
if ($LASTEXITCODE -ne 0) { throw 'Fixed integration verification failed' }
pwsh -NoProfile -File "$clone/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "$clone/CUDA_coding"
if ($LASTEXITCODE -ne 0) { throw 'Clone knowledge lint failed' }
```

lint核当前clone检出，长期复验其他固定提交时另建该提交的独立clone，不在dirty研究工作树切换版本。`inspect-clone.cjs`与固定验证器配合核物理检出；`check-live-protection.cjs`仅用于本轮交付现场，不能当未来历史复验入口。

`local/verify-integration.test.cjs` 的16项测试已通过，包含缺件、篡改、删除、未知/源码路径、文件模式、越界路径、继承字节和软件meta等反例。它们不运行GPU或修改主仓库。

014后续回执使用待验提交内的精确文件表声明，内容由交付的固定提交SHA锚定；验证器不能独立拒绝把014自身回执和清单同时改写的另一个新提交。717静态集合、013回执及原始输入则另有封存哈希约束。

制作工具 `capture-intake.cjs`、`apply-proposals.cjs`、`prepare-manifests.cjs` 及关闭制作脚本会写本批或活文档，不是长期复验入口；`check-staged.cjs`仅供本轮暂存检查。不得重新运行历史制作脚本“修复”后续失败。

未覆盖范围仍为科研源码采用、GPU/MPI、原包及递归运行依赖、许可公开和根部卫生；SRC-029缺失原包不因接收README归档而消失。没有新增科学结论或开放科学问题。本轮真正编译新增的是012已审定的SRC-032/033与两条来源映射，旧source IDs不重复分配；index路由和claim矩阵无需新增内容。

唯一下一治理任务为[KB-GOV-015：六条历史关闭快照补录](next-task.md)，已在queue登记ready，未执行。依赖014和六任务原关闭证据；推荐gpt-6-astra / XHigh。
