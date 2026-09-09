# KB-GOV-003–007 固定快照复验补修

日期：2026-09-09。状态：done（仅关闭复验入口补修）。依据：用户确认“003–007 在旧归档之外补固定快照复验入口，并逐项报告覆盖范围；008 保留现有归档入口，明确运行位置”。本目录交付新入口和覆盖说明，不覆盖旧归档或改写历史验收。

## 新入口验证什么

[verify.cjs](verify.cjs) 只读 G1 固定提交 `ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67` 的 Git blob。先校验固定 SHA 的输入清单及其179份原件长度/SHA，再执行所选批次的检查。原件包括所需的相邻批次备份；不从活文件补齐缺失证据，不执行旧迁移/关闭/verify 脚本，也不读取旧清单中的绝对 `root`。

输入清单 SHA-256：`823f890f2814f7a8e841c6e569b239c8e3abd569da472702fdd31c482004ce1d`。它与提交号固定在新入口中；缺 Git 对象、文件或哈希不匹配时失败退出，不回退到 HEAD，也不自动获取远端材料。提交对象与本脚本均存在时，改变当前分支、排程、TASK-031 回执或运行命令的工作目录不会改变输入。

| 批次 | 固定证据中实际复验的内容 | 明确未覆盖的批次特有事项 |
| --- | --- | --- |
| 003 | 6份原始备份；brief/index两份历史正文与原元数据可还原；241个链接映射；归档 brief 正文的体积、排程堆叠与路由检查 | 不完整回放整编后的两份活页及当时全文件修改范围 |
| 004 | 4份备份；完整旧 queue 与100个链接映射可逆；005的冻结备份确实包含004交付顶部，48行软件任务及合同正文与004原文一致；1处原已登记的链接纠正单列 | 不检查今天的任务状态是否仍为旧 Priority 或原排程 |
| 005 | 4份备份；原 TASK-031 blocker 正文/哈希与181个链接映射可逆；006的冻结备份包含4973字节交付条目，前后软件 blocker 保持原内容 | 不重新判断今天的 TASK-031 缺口或执行授权 |
| 006 | 3份备份；142条原记录逐条恢复并重建原完整日志；206个链接映射；按原替换记录得到的22条里程碑日志与007冻结备份相符，仅扣除006自身关闭里程碑 | 不要求今天的 compile-log 永远停在22条 |
| 007 | 3份备份；13项审计结论表与归档 JSON 一致、理由长度合规；17路径归属台账的原基线哈希匹配，13条“既有变化”计数一致 | 不重新裁定13项建议，不重跑当年的根目录、Git、归属和任务状态审计 |

链接检查验证的是迁移前后路径所指位置及锚点文字保持一致，允许原已登记的004链接修正。728处映射中，3处目标在这179份G1原件内，725处在包外（按引用次数计）。**不验证这些目标现在是否存在、内容版本是否一致，或锚点是否真实可跳转。** JSON 输出逐批给出映射数、包内/包外数及 `notRun`。

所有批次都明确不覆盖：当前工作区与 Git 保持历史状态、旧完整验证脚本、包外链接可达性、CUDA/MPI/GPU验收。`SNAPSHOT REPLAY: PASS` 仅适用于表中检查，不改写旧脚本当前的 FAIL，也不把历史 PASS 冒充新源码验收。

## 003–007 人工复验

环境：Git、Node.js（本次使用 v24.18.1）。本仓库已经保存所需 G1 对象；如果迁移到其他 clone，须同时带上本目录和上述固定 G1 提交，并保持目录结构。新入口在主工作树运行即可，不需要切换分支；下列绝对路径命令可从任意工作目录调用。

全部五批：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-003-007-20260909-snapshot-replay/verify.cjs"
```

预期退出0，输出逐批 JSON 覆盖报告，随后出现003、004、005、006、007各自的 `KB-GOV-00x SNAPSHOT REPLAY: PASS`。任何未覆盖项仍列在 `notRun`，不变成 PASS。

单独复验003（末尾可换成004、005、006或007；008使用下一节入口）：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-003-007-20260909-snapshot-replay/verify.cjs" 003
```

运行回归与反例测试：

```powershell
node --test "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-003-007-20260909-snapshot-replay/verify.test.cjs"
```

失败时保存完整 stdout/stderr、退出码、报错路径和 `git cat-file -t ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67` 的输出。缺提交时先恢复已归档的固定对象；不要运行旧迁移脚本、更新旧 expected、回滚 TASK-031 或删除原件。

## 008 保持原入口，固定运行位置

[008原回执](../KB-GOV-008-20260909-evidence-archive/README.md)和原检查器不修改。原 `verify-archive.cjs` 在 G1 归档的干净独立 clone 中运行，检查179份输入、41份归档回执及221个Git blob/变更路径。其适用提交是上述 G1；后续增加G2内容的提交不再符合其精确范围。

```powershell
node "D:/CUDA/CUDA_repository_recovery/.worktrees/kb-gov-008-clean-clone/CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/local/verify-archive.cjs"
```

预期退出0、`KB-GOV-008 ARCHIVE: PASS`、`inputFiles: 179`。这里必须选 `.worktrees/kb-gov-008-clean-clone/` 里的脚本；只切换工作目录、却仍调用主树那份脚本，不会切换它的检查对象。主树未合入G1，直接调用主树的008归档脚本会报 `Git change scope mismatch`。008的 `verify-main.cjs` 是历史主树保护检查，不是长期入口。

## 交付范围与证据

新增内容仅位于本补修目录；现有文件只补 queue 的复验指针、blocker 的补修关闭快照和 compile-log 的一条里程碑。旧003–008原件、008归档分支/clone及求解器保持；本次不做Git提交、合并、清理、远端或架构改动。新入口目前是工作区交付，尚未形成新的版本归档。

初始失败测试保存在 [tests-red.log](local/tests-red.log)，首次实现后10项通过保存在 [tests-first.log](local/tests-first.log)。最终证据：[完整执行](local/snapshot-replay.log)、[逐项覆盖](local/coverage.json)、[10项回归与反例测试](local/tests-green.log)、[主树/独立clone双上下文对照](local/cross-context.json)、[008原入口复验](local/kb008-archive.log)、[独立只读审查](local/review-summary.txt)、[知识lint](local/knowledge-final.log)。

[范围核对](local/scope-final.json)确认678个保护文件字节保持；三份meta仅有[记录的插入](local/closeout.json)，软件正文/状态保留，主树HEAD/索引、既有分支与worktree保持。[Codex应用快照引用变化](local/application-refs.json)另列，不声称所有Git引用静止，也不将其加入长期复验条件。[文档差分](local/meta-closeout.diff)及[空白检查结果](local/diff-check.json)保留；固定输入证明与本次工作区保护证明分别报告。

本次没有新研究来源、论文主张或科研问题，不更新 source registry、brief/index/map 或 claim matrix。核对 blocker 后，只补本次治理复验缺口的已解除快照，软件任务缺口和授权不变。

唯一下一治理任务仍为 queue 已登记的 **KB-GOV-010：G2文档版本归档**，依赖009归属审定和固定G1；推荐 `gpt-6-astra / XHigh`。本次补修及其指针属于新的工作区增量，未来归档前须显式审定其纳入范围，不冒充009此前已审定的文件集合；本次不领取010。
