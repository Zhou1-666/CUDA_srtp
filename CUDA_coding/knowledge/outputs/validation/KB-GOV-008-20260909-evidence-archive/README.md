# KB-GOV-008：治理证据版本归档（G1）

状态：done（正常交付）；2026-09-09；责任方：Codex。用户明确选择本任务，授权按 KB-GOV-007 的 G1 合同进行隔离分支本地归档。本回执只验收治理证据版本，不改变求解器验收或软件排程。

## 范围与版本

- 基线 main：`91ecc661e0cd856c61bdc5b69f5aa065faadf078`。
- 归档分支：`codex/kb-gov-008-evidence-archive`；工作树：`.worktrees/kb-gov-008-evidence-archive`。
- 第一组原件提交：`525bd08`，仅包含 KB-GOV-001、003–007 的 **179 文件 / 10,711,774 字节**及精确 `.gitattributes`。所有原文、快照、映射、失败日志和历史脚本按输入字节保留。[输入 SHA 清单](input-manifest.json)、[暂存 blob SHA](local/g1-staged-blobs.json)。
- 第二组 `8643530165ba6becf2198e756bc1f512cb39bcf2` 保存范围、依赖和便携入口；后续关闭提交保存本次验收、主树治理交接的差分与保护检查。主树不合并、不提交活文档 G2、研究材料 G3 或候选源码。
- KB-GOV-002 保持 `codex/kb-gov-002-validator-versioning` / `09a97586fbcce952cdd3ac233e25082cbc842220` 的原五笔谱系，不复制其回执目录，也不赋予候选新的 GPU 验收。

## 归档与复验边界

[依赖登记](dependencies.json)扫描 13 个 G1 Markdown 页的 869 处字面链接：96 处在 G1，120 处仅在旧基线有同名路径，653 处依赖包外工作区材料。同名路径存在不等于引用时版本相同。锚点、原件正文中的命令、JSON 中历史路径和历史脚本运行依赖未递归回放；不声称全库离线复现。

完整知识库 lint 在空白基线为 4 Warnings / 0 Errors；加入局部 G1 后为 4 Warnings / 25 Errors，25 处均是已登记包外 wikilink，见[逐项核对](local/knowledge-boundary-audit.json)和[原始失败日志](local/knowledge-g1-payload.log)。不为消除这些错误而重写快照、削弱检查器或拉入 G2/G3；本分支不能作为完整知识库交付版本。

历史 `local/verify.cjs`、迁移和关闭脚本绑定原工作区及当时状态，不在 clone 中执行。KB-GOV-007 历史复查本次失败：TASK-031 并行新增资源记录、更新 queue/blocker，应用也新增 `refs/codex/turn-diffs/` 捕获；既有分支、主树索引和 G1 输入保持。两处活文档变化仅限 TASK-031，恢复对应区域后与007关闭 SHA 一致，详见[差异审核](local/input-drift-audit.json)。旧检查器未修改，其原失败输出保留在 raw/。

本次便携入口只做只读检查：179 原件文件集合/长度/SHA、回执显式文件集、相对固定 main 的变更范围、精确属性、Git blob 与 checkout 字节，以及 checkout 干净状态。它不运行旧脚本，不访问原根目录，不要求 KB-GOV-002 分支存在，不运行 GPU 或远端命令。清单及检查器本身由归档 Git commit 标识；本校验用于发现遗失/字节变化，不是签名认证。

## 人工复验

环境：Git、Node.js（本次 v24.18.1）。在此归档分支的独立 clone 根目录运行：

```powershell
node CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/local/verify-archive.cjs
```

预期退出0、`KB-GOV-008 ARCHIVE: PASS`、inputFiles=179；失败保存完整 stdout/stderr、退出码、`git rev-parse HEAD` 和 `git status --porcelain=v1`。不要执行历史迁移脚本“修复”失败。校验器反例检查：

```powershell
node --test CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/local/verify-archive.test.cjs
```

预期6项通过，覆盖精确字节、缺文件、同长度篡改、CRLF转换、额外文件和越界路径；只在系统临时目录创建微型测试夹具。[先失败](local/tests-red.log)和[实现后通过](local/tests-green.log)均保留。

下一治理任务建议：**KB-GOV-009：治理活文档 G2 的归属与依赖审定**。以007的17路径清单、首批前恢复点及008归档提交为输入，逐文件区分既有内容与治理增量，给出显式补丁和包外依赖处置；先审查，不默认提交整文件或合并主树。依赖008归档完成；责任方Codex；推荐 **gpt-6-astra / XHigh**。本批不执行下一任务；无新增研究来源、主张或开放问题，brief/index/map/claim matrix 无需同步。

## 关闭验收

独立 clone `.worktrees/kb-gov-008-clean-clone` 在检查器提交8643530通过：179原件、207个Git blob、6项行为测试；对象目录52个文件的硬链接数均为1，无alternates/符号链接，[对象独立性](local/clone-independence.json)、[clone输出](local/clone-verification.log)、[测试输出](local/clone-tests.log)。最终关闭提交仅增加本次证据及回执，最终HEAD以该分支Git记录为准，可用上述命令重新验证。

主树仅更新本任务的queue/blocker关闭记录、下一治理任务009登记和一条compile-log里程碑；这些活文档只作为[差分](local/main-closeout.diff)/恢复点保存在008回执，不进入归档分支的活文档路径。[主树保护检查](local/main-protection.log)通过637个对象、3份恢复点、48行软件任务及既有Git状态；[主树知识检查](local/knowledge-main-after.log)为365 Markdown / 36 Wiki / 33 Sources、0 Warnings / 0 Errors。现有源码、G1原件、KB-GOV-002谱系和软件排程保持；没有新增研究来源、主张或问题。G2/G3、主树集成、全库链接闭合、根目录清理及任何GPU/远端验证均未执行。

关闭后的并发复核：上述主树全状态 PASS 是当时快照。随后 TASK-031 在自己的回执 local/ 下新增13个 v4/v5 控制脚本/测试文件，`verify-main.cjs` 的全状态断言转为 FAIL；[失败输出](local/main-protection-concurrent.log)和[有界差异审核](local/concurrent-closeout-audit.json)另存，不覆盖先前PASS或改掉断言。再次核对637个保护对象、三个关闭文档、main HEAD/索引仍匹配；新增文件均在G1之外，未读作本任务实现输入、暂存、修改或执行。独立归档验收仍通过，不能把它扩写为并行工作的整个主工作区保持静止。最终归档命令保持便携且只读，历史主树保护命令不作为日后新clone的验收入口。
