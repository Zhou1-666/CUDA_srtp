# KB-GOV-014：主树治理受控集成

状态：in-progress。用户于本任务明确选择“KB-GOV-014 主树治理受控集成”，授权按013审定方案进行本地文件集成、分组提交及独立clone验收。禁止推送、清理、GPU/SSH/Slurm、科研候选采用和公开发布。

范围为013的717静态目标路径及逐项列明的013/014回执。基底为main `5c9724a79146e7a6d4e9819b63a5baa6f7f7fd7b`；其中220份G1证据已提交，不重复计为本任务成果。九项候选只修改六页注释、两条来源及映射、精确字节属性；三份meta保留实时软件正文。

输入已冻结于[intake.json](intake.json)，恢复副本与初始Git读数由[input-seal.json](input-seal.json)封存；完整静态范围见[integration-manifest.json](integration-manifest.json)，自身回执使用[receipt-files.json](receipt-files.json)逐文件列举。旧013回执187份逐字节保留。

A组已提交为 `6f01a6453a3f4d447f397f5197acf76fe4361d9c`：471个剩余静态路径、187份013回执及32份本批初始证据，共690路径。每个暂存blob与工作区原始字节匹配。A是中间归档，B及独立clone验收完成前不关闭任务。

九项实际修改及SHA见[applied-proposals.json](applied-proposals.json)。013属性候选继承的自身LF转换规则与原CRLF前缀冲突；本轮只在其末尾追加自身`-text`覆盖，保留原文与其余规则。过滤/不经过滤的Git blob都为 `b0a5e61b3433fdf2720aa7a65930fb99aa5bd394`。独立审查及处置见[review-notes.md](review-notes.md)。

三份meta从当时活文件增量修改，逆向关系见[meta-edits.json](meta-edits.json)。科研正文、历史日期、软件状态、Gate和授权均保留，不从G3旧快照覆盖。

## 并发变化与边界

本批捕获16,695个范围外文件指纹。A前检查发现一个T1 README变化，原失败保留；另有两份T1 transcript/audit在领取后新增。经独立只读核对可解释为T1用户构建回贴进展，三份均保留现场、排除于014暂存。见[并发见证](local/concurrent-supplement.json)。不把16,694个旧文件匹配表述成范围外没有新增，也不把T1构建当成014的GPU或科学验收。

主工作区知识lint在九项应用后为392 Markdown / 36 Wiki / 35来源，0错误/0警告；它不是独立clone验收。历史G3的24错误/2警告原回执不改写；本轮纳入15个限定历史入口，最终效果须由真实检出实测。

## 复验入口

`local/verify-integration.cjs --inputs` 只验证封存输入；传入40位固定提交SHA时只读取Git对象，核717静态路径、187份013回执、自身精确文件表、497静态变动、九项候选、三meta的限定修改，以及源码提交树与基底完全一致。不会读取未来活文档来决定旧提交是否通过。最终固定SHA及clone命令在验收后补齐。

`local/verify-integration.test.cjs` 的16项测试已通过，包含缺件、篡改、删除、未知/源码路径、文件模式、越界路径、继承字节和软件meta等反例。它们不运行GPU或修改主仓库。

014后续回执使用待验提交内的精确文件表声明，内容由交付的固定提交SHA锚定；验证器不能独立拒绝把014自身回执和清单同时改写的另一个新提交。717静态集合、013回执及原始输入则另有封存哈希约束。

制作工具 `capture-intake.cjs`、`apply-proposals.cjs`、`prepare-manifests.cjs` 及关闭制作脚本会写本批或活文档，不是长期复验入口；`check-staged.cjs`仅供本轮暂存检查。不得重新运行历史制作脚本“修复”后续失败。

未覆盖范围仍为科研源码采用、GPU/MPI、原包及递归运行依赖、许可公开和根部卫生；SRC-029缺失原包不因接收README归档而消失。没有新增科学结论或开放科学问题。本轮真正编译新增的是012已审定的SRC-032/033与两条来源映射，旧source IDs不重复分配；index路由和claim矩阵无需新增内容。
