# KB-GOV-009：G2 活文档归属与依赖审定

状态：done（正常交付）；2026-09-09；责任方：Codex。按用户明确选择执行现有合同：审查17份活文档的版本归属、显式补丁和依赖，形成后续最小入库方案。本任务不提交/合并活文档，不改变架构或软件任务。

结论：17份文件分为 **4份无首批前实质改动、10份继承既有内容的静态文档、3份持续更新的meta**。优先采用带归属说明的文档快照保存混合内容；治理补丁保留为可审阅差分。仅4份LF审阅补丁可直接应用到旧HEAD，不能将13份混合文件整份计为治理成果。

- [逐文件审定报告](audit-report.md)：事实、版本、归属与风险。
- [机器可读归属账本](ownership-ledger.json)：全部SHA、恢复点、两层差分和适用结果。
- [最小集成方案](integration-plan.md)：后续允许路径、依赖处置与停止条件。
- [引用依赖](local/dependencies.json)、[命令指纹](local/command-dependencies.json)、[七页Wiki边界](local/g3-page-boundary.json)。

G1基线为 `codex/kb-gov-008-evidence-archive` / `ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67`；main仍为 `91ecc661e0cd856c61bdc5b69f5aa065faadf078`。17份输入均匹配007/008最后登记的SHA；快照取自本任务领取时，后续meta变化不得回写这些输入。每个文件的HEAD、首次治理前和本次版本以原字节分别保存在raw/。

425处字面链接归并为220个本地目标。7页未跟踪Wiki、139个版本集合外目标、15个其他工作区版本、KB-GOV-002独立谱系及1条既存断链均已登记。计数是第一层路径审查，不是递归证据闭合。源码、GPU、远端命令和来源注册表原件均未执行/重新验收；元数据齐全不升级事实可信度。

人工复验：在原仓库根目录运行以下只读审核入口（Git、Node.js；会在系统临时目录创建补丁回放副本）。

```powershell
node CUDA_coding/knowledge/outputs/validation/KB-GOV-009-20260909-g2-ownership-review/local/verify.cjs
```

预期退出0、`KB-GOV-009 REVIEW: PASS`，17份输入、51次补丁结果校验通过。失败保存完整stdout/stderr、退出码和`git rev-parse HEAD`；未来活文档/分支变化可能使历史保护检查失效，不改断言凑PASS。此回执本批尚未Git入库，后续版本归档须显式纳入。

唯一下一任务建议：**KB-GOV-010：G2 文档版本归档**，依赖本次审定及008的G1版本，按集成方案在新隔离分支保存带归属说明的17份文档和009审查依据，刷新三个meta并修复一条已核实的相对链接；不默认合并主树或扩展G3/源码。责任方Codex，推荐 **gpt-6-astra / XHigh**；本批未执行。

关闭交接只更新queue/blocker的009关闭快照、010待办登记及一条compile-log里程碑；其余14份审查文档未改。17份输入快照保持领取时字节，三个meta的关闭后SHA另见[关闭记录](local/closeout.json)，不静默覆盖归属账本。原字节/LF回放、依赖及保护核对见[最终复验](local/review-final.log)，文档检查见[知识lint](local/knowledge-final.log)。无新研究来源、主张或问题，index/map/brief/claim matrix无需同步。
