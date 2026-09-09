# 待执行：KB-GOV-014 主树治理受控集成

013只审定本方案。用户选择014后，按以下顺序完成同一个任务；不先合并整树，不做科研采用、清理或推送。所有操作均使用本地仓库，公开许可门保留。

1. **领取及保护。** 确认分支main，以并发附录已审查的HEAD `5c9724a79146e7a6d4e9819b63a5baa6f7f7fd7b`为预期基底；保存完整status、index、refs/worktree及软件候选SHA。先复验013固定回执，再按717白名单比较实际文件SHA。675份旧证据及15历史入口须等于审定输入；属性用明确的并发复核基底，其他变化逐项审查。3份滚动meta预期已经有013关闭记录，捕获当下字节并只改014治理条目，不从G3覆盖。用户已有暂存内容不混入，先保留并解决归属，不用reset或stash清场。
2. **应用9项精确候选。** 四页用G3已审定注释；迁移页/术语页用主树语境修正；registry只加SRC-032/033；source-map只加两个source_ids和两行映射；属性保留既有全文再追加精确保护。proposals.json记录前后SHA、候选和步骤，若before不匹配先审差异。SOP及其余静态页原字节。关闭记录全部保留软件合同、状态、授权和未运行门禁；生成精确逆变换证明。
3. **按两组归档。** A组为675固定证据＋15历史入口＋.gitattributes，共691路径，另列013完整回执及014本次输入/方案文件；以精确文件清单归档。B组为其余26个文档/来源/地图路径及014验证/关闭回执。每组暂存前后核对路径差集、blob SHA和归属，分组本地提交。提交信息明确A为继承证据归档、B为限定治理整合，不将继承论文/源码内容署为本轮原创。A是中间归档，只有B及最终验证完成才算014交付。
4. **检查固定版本与检出。** 在独立非硬链接本地clone检查最终commit全部允许路径、字节及无多余变更；运行实际知识lint和003–007固定快照入口，010/012使用显式固定SHA，008保持G1独立clone内原入口。对新014验证器分别检查固定提交和自身封存输入，不能把后续主树文档SHA作为永久通过条件。所有软件路径在主树提交树中须仍等于领取基底，而其工作区字节保持原样；dirty剩余属于科研/其他范围，不要求清零。
5. **交付。** 核对main提交树准确包含717目标路径及逐项列出的013/014回执文件；从已审查基底计算差集，已版本化220项不形成新差异，预期497静态路径加精确新回执。必须逐blob核对，不能只数文件。保留固定归档refs、失败输出和未经覆盖范围。只关闭014，给唯一下一任务，不自动继续。

以上717是目标白名单。并行G1提交已完成A组中的220份证据，见[附录](concurrent-supplement.md)，014跳过其重复暂存/提交：剩余A组471静态路径，B组26静态路径，共497个待变更静态路径，另加精确013/014回执。最终diff从`5c9724a…`计算；不得把220项再计为014新增成果。相同文件仍逐字节检查，不删除它们。

下面是014的关键命令模板，**本轮未执行任何写Git命令**。PowerShell每一步都检查退出码；路径清单由机器表直接生成，不用全目录add。014首先生成A/B及回执的最终精确NUL清单和SHA清单，审核后才暂存。

```powershell
$repo = 'D:/CUDA/CUDA_repository_recovery'
$audit = "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review"
$receipt = "$repo/CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration"
node "$audit/local/verify-receipt.cjs"
if ($LASTEXITCODE -ne 0) { throw '013 receipt failed' }
git -C $repo diff --cached --exit-code
if ($LASTEXITCODE -ne 0) { throw 'Existing staged work must be resolved separately' }
# 完成步骤1/2、形成并核验A组清单与逐blob报告后：
git --literal-pathspecs -C $repo add -f --pathspec-from-file="$receipt/group-a.nul" --pathspec-file-nul
if ($LASTEXITCODE -ne 0) { throw 'Stage A failed' }
# 必须先核实际暂存差集/逐blob，再执行：
git -C $repo commit -m 'Archive reviewed governance evidence and historical entry documents'
if ($LASTEXITCODE -ne 0) { throw 'Commit A failed' }
# B组及014验收资料已完成，并经独立审查后：
git --literal-pathspecs -C $repo add -f --pathspec-from-file="$receipt/group-b.nul" --pathspec-file-nul
if ($LASTEXITCODE -ne 0) { throw 'Stage B failed' }
# 必须先核实际暂存差集/逐blob，再执行：
git -C $repo commit -m 'Integrate reviewed governance documents with current task records'
if ($LASTEXITCODE -ne 0) { throw 'Commit B failed' }
```

`integration-paths.nul`是717静态集合，不含本次/下次回执，不能拿它当完整最终清单。两组回执只列实际文件，不接纳临时文件或递归通配。未来日期改变时相应014回执根路径和属性须一并明确审定；不能扩成全knowledge保护或全库纳入。

白名单中有10份已审定的TASK-007/009原始.out文件受现有忽略规则覆盖，因此只对经过审核的精确NUL清单使用`-f`与literal pathspec；不改变.gitignore，也不扩大强制纳入范围。

独立检出的关键验证命令如下；014决定未占用的clone目录并核对其在仓库工作区内。`--no-local`避免本地对象硬链接；默认完整分支clone，不加`--single-branch`或`--depth`。不用已有源码worktree作干净交付证明。

```powershell
$clone = "$repo/.worktrees/kb-gov-014-clean-clone"
if (Test-Path -LiteralPath $clone) { throw 'Choose and record a fresh clone directory' }
git clone --no-local --branch main $repo $clone
if ($LASTEXITCODE -ne 0) { throw 'Clone failed' }
$finalCommit = git -C $repo rev-parse HEAD
git -C $clone rev-parse HEAD
# 两者必须相等；再核无alternates、对象非硬链接、checkout干净及完整白名单。
pwsh -NoProfile -File "$clone/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "$clone/CUDA_coding"
if ($LASTEXITCODE -ne 0) { throw 'Independent knowledge lint failed; preserve full output' }
node "$clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-003-007-20260909-snapshot-replay/verify.cjs"
if ($LASTEXITCODE -ne 0) { throw '003–007 fixed replay failed' }
node "$clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-010-20260909-g2-document-archive/local/verify-archive.cjs" 669182cf4879aa3ebc9976533178bce0214d4dbc
if ($LASTEXITCODE -ne 0) { throw 'G2 archive failed' }
node "$clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/local/verify-archive.cjs" ce11e2ca35506194099094796b218d3a881a3e62
if ($LASTEXITCODE -ne 0) { throw 'G3 archive failed' }
node "$clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review/local/verify-receipt.cjs"
if ($LASTEXITCODE -ne 0) { throw '013 receipt failed' }
node "$repo/.worktrees/kb-gov-008-clean-clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/local/verify-archive.cjs"
if ($LASTEXITCODE -ne 0) { throw 'G1 archive failed' }
```

先确认最后的008独立clone仍固定在G1；若其不在，另建明确G1分支clone，不能替换成主树路径。003–007旧回执内的live保护入口不重跑、不改期待SHA。008/010/012原入口的运行位置/固定SHA要求继续有效。

源/包依赖、站点环境或既有普通Markdown链接不是此次静态lint能保证的内容。若实际独立检出发现新的Obsidian/来源缺口，保存差集并只审相关入口；不得把失败写PASS或为清lint复制源码/全目录。源码候选、根目录散件、verify/logs、.worktrees、许可发布门均不在717白名单。
