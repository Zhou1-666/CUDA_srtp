# KB-GOV-013：主树治理集成审定

单一交付是**已审定的集成方案**；实际主树集成留给014，本轮未应用9项候选、提交、合并或修改架构。结论见[decision.md](decision.md)，操作见[integration-plan.md](integration-plan.md)，逐路径身份见[integration-paths.json](integration-paths.json)。

关闭前发现并行G1提交`5c9724a…`，经[附录](concurrent-supplement.md)审定接纳；220份证据已版本化，717目标中剩余静态差集497。该提交不是013执行成果。原输入与旧属性候选保留，新的属性候选基于审查后的活文件，未覆盖主树。

- G3相对主HEAD的701路径均在主树：690字节一致、11有差异。717拟议路径由675固定证据、27文档/属性、15历史入口组成；另单独列013/014回执实际文件。
- 主树3份滚动meta保留最新进展；六页候选保留draft与原归属。registry及source-map各只补SRC-032/033，.gitattributes保留现有规则。9份拟议字节在proposed目录，未覆盖实际页面。
- 24项归档lint错误涉及13个文件；保留当前source-map后补2个直接入口。内存Obsidian目标投影为0缺口，实际独立clone与完整运行依赖仍待014验证。当前主树的真正知识lint结果单独记录，不互相替代。
- 本轮修改主树的范围仅为queue/blocker的013关闭/014登记，以及compile-log一条里程碑。三个关闭前后快照均可精确逆变换；1014个原保护对象保持，另1个属性文件的并行G1追加显式审定。Git索引/分支/worktree在并发复核后到本轮关闭间保持，不声称领取以来从未变化。

## 人工复验

Windows PowerShell可从任意目录运行，无GPU或Git依赖：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review/local/verify-receipt.cjs"
```

预期退出0，最后一行为`KB-GOV-013 FIXED RECEIPT: PASS`。只核验本回执封存输入、27组主路径快照、15份历史页、9项候选关系、717路径清单和3项关闭逆变换。它不读取未来主树页面，不重新执行675份旧证据的实验或旧保护脚本，不证明main已集成、当前live未变化或GPU验收。若搬移整个回执目录，使用新目录中的同一入口。

失败保留完整stdout/stderr、退出码和整个013回执；不要改期待SHA来追随活文档。003–007继续使用既有固定快照入口，008仍用G1独立clone内原入口，010/012显式传固定提交；未改旧入口。

反例检查：`node --test "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review/local/verify-receipt.test.cjs"`。实际执行结果见local/verification.log、local/negative-tests.log、local/portable-verification.log、local/knowledge-lint.log；一次性主树保护证据见[main-scope-closeout.json](local/main-scope-closeout.json)。receipt-manifest封存正文/输入/方案/关闭证据，复验入口本身作为信任起点，运行日志单独保存，避免自包含哈希循环。

local内capture、prepare-proposal、complete-proposal、close-main、seal为一次性制作/关闭工具，不是长期复验入口，不在新clone或后续主树重跑。raw里的所有内容只作为捕获证据；proposed里的所有文件只是未应用候选。

未覆盖：实际主树版本归档/独立检出、源码候选采用、原包与递归运行依赖、CUDA/MPI/GPU、公开许可。SRC-029原包缺失；仅纳入旧README不消除该缺口。科学主张、index/map当前内容与开放问题无本轮新增，只有治理交接受影响。

唯一下一任务：[KB-GOV-014：主树治理受控集成](next-task.md)，依赖013及固定G1/G2/G3，推荐gpt-6-astra / XHigh。仅登记，尚未开始。
