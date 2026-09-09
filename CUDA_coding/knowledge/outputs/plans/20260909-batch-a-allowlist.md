# 第 A 批精确路径与分块 allowlist

最终状态：第 A 批已由 `c80ab27b3e38818b3f171ad21025e22df2a30aef` 保存并通过独立 clone 验收。以下范围、输入指纹及“未暂存”等叙述保留为冻结时快照；当前结果见文末“关闭补充”。JSON allowlist 原字节保持，后续不能把旧基线/空索引条件当作当前状态。

2026-09-09；审定基线：`main = HEAD = 6b959f5d785d1359f8ded5287c371a8affe9c79c`。本轮交付为范围冻结；实际暂存与提交尚未执行。承接 [执行清单](20260909-post-6b959f5-controlled-integration-checklist.md)，精确路径、输入 SHA-256、候选 SHA-256、原 blob 与分块补丁由 [JSON 清单](20260909-batch-a-allowlist.json) 固定。

## 许可集合

共 32 个候选提交路径：29 个内容路径，以及执行清单、本说明、JSON 清单这 3 个控制文件。所有路径均相对仓库根；没有目录通配授权。JSON 中未列出的路径或片段一律不属于 A 批。

整文件纳入的 tracked 路径为以下 12 个；许可仅覆盖 JSON 所录 SHA 的版本：

```text
.gitignore
CUDA_coding/knowledge/outputs/README.md
CUDA_coding/knowledge/raw/README.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-001-20260908-maintenance-baseline/README.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-001-20260908-maintenance-baseline/raw/git-status-before.txt
CUDA_coding/knowledge/outputs/validation/KB-GOV-007-20260909-governance-closeout/README.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-007-20260909-governance-closeout/raw/git-status-all-before.txt
CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/README.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive/raw/main-status-before.txt
CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration/README.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration/intake.json
CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration/raw/git-status-all.bin
```

其中 `.gitignore` 仅补原始归档、profiler/解包与本机恢复材料的忽略规则；outputs/raw README 对齐用途；4 个历史 README 的唯一增量均为 P1 迁移注释；5 个大文件只保留指针。历史 manifest/hash 不改写，原字节仍在本机归档。指针替换不意味着老 Git 历史体积被回收。

分块纳入以下 3 个 meta 路径，另增加仓库根 `.gitattributes` 的一个候选 hunk，共 4 个 tracked 路径；不允许用整文件 `git add` 代替分块候选：

| 路径（相对 `CUDA_coding/knowledge/meta/`） | 允许片段 | 明确排除 |
| --- | --- | --- |
| `compile-log.md` | 文件顶部 GOV-015 补录里程碑，1 个 hunk | 成本偏好/模型调整里程碑 |
| `task-blocker-register.md` | 六条 TASK-001/003/004/005/008/012 历史关闭快照；KB-GOV-015 ready→done 条目，2 个 hunks | TASK-031 新 job/缺口变化；031/032/033 档位调整；015 末行后续档位替换 |
| `task-queue.md` | 三列表中 GOV-015 ready→done 行；末尾 P1–P5 产品债段，1 个 hunk | 所有模型列/模型说明段；TASK-031 顶部/任务行/授权变化；债务引言中的 T2 FAILED 收尾句 |

三份候选从 `6b959f5` 原字节出发，以 GOV-015 `changes.json` 重放，先复现 `final-verification.json` 中全部 3 个历史 SHA；queue 再加入产品债段，并排除 T2 句。015 末行旧模型值作为这次历史补录的一部分保留；新的统一选档属于另一个文档增量。候选沿用原 CRLF/LF 字节，未清洗整文件。

`.gitattributes` 的新增片段仅为注释及 `/CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/** -text`。只读 `git hash-object` 检查发现，现有规则会转换 3 个 before 备份和 lint 日志的换行；候选属性使 11 个 GOV-015 文件保存原字节。这是精确归档所需的最小依赖，当前工作区 `.gitattributes` 尚未修改。

分块补丁 SHA-256：`3149e1e2cea68b34aab6ec4c5cb07a3d3da8e0463564a2b89fa527adeb07d306`。JSON 内嵌其 Base64，避免依赖行号、手工复制或 PowerShell 文本重定向造成换行损坏。未来暂存应将该补丁作用于符合基线的索引，而非覆盖工作区；候选 SHA 与当前完整文件 SHA 不同是分块选择的预期结果。

整文件纳入的 13 个 untracked 路径：

```text
TASK-023-1456135-nsight-evidence-v1.tar.gz.pointer.md
TASK-031-job1483542-evidence.tar.gz.pointer.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/README.md
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/changes.json
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/historical-evidence.json
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/before-compile-log.md.bin
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/before-task-blocker-register.md.bin
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/before-task-queue.md.bin
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/final-verification.json
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/intake.json
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/knowledge-lint-final.log
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/preclose-verification.json
CUDA_coding/knowledge/outputs/validation/KB-GOV-015-20260909-historical-closeout-snapshots/raw/snapshot-addition.txt
```

这 11 个 GOV-015 文件是现存的最小回执集合；三份 before 和 intake 用于精确重放及取证，各自小于 1 MiB。此次不新增 dump，也不把另有 12,789 个“仅清单”untracked 文件纳入。

## 归属修正与依赖边界

原恢复归档误把 `claim-evidence-matrix.md` 分入产品债，实际上其差异是 C2–C17 等数学、性能、署名和制造解主张修订，全部移回 B 批。KB-GOV-008 README 的差异只有一条 P1 迁移说明，与其指针必须成对，因此调入 A 批。原 35 个 dirty 路径仍按 A=15、B=15、科研线=5 分配；A 批另增加原本干净的 `.gitattributes` 候选，故最终有 16 个 tracked 路径。JSON 明列其余 20 个 tracked 排除路径。

审阅期间另一条任务更新了 queue/blocker 中 TASK-031 的资源等待段。已对照原恢复快照确认仅为排除区的资源说明变化，保存差分并冻结最新输入 SHA；GOV-015 与产品债选中片段不受影响。后续任何新漂移仍须重新核对，不能照旧 whole-file add。

新增本地文档引用 15 处已在隔离候选树核对，目标全部在基线或 A 批内；没有为闭包追加 Wiki、NOTICE、源码或任务运行包。六条关闭证据对应提交均在 `main` 祖先链，历史 queue 变更、回执 SHA 与当前原回执核对通过。这里验证的是证据一致性，没有重跑历史 GPU/数学验收。

七个大原件的字节数与 SHA-256 已在本机验证；它们受忽略规则排除，不在 clone 中。干净树只能验证指针文本与登记，读取原始大证据仍须恢复本机原件。旧治理验证器若直接读取原 dump/intake，需要先按指针恢复后再运行；本次没有宣称旧固定回放全部通过。

P5 保持 `deferred`；产品债表“原实测现状”是用户原诊断的历史引文，其“零编译条目”等措辞不作为本轮重新实测结论。A 批只保存处置与限定范围，不升级论文主张。

## 验证与使用

冻结前已执行 49 个输入哈希检查（含上述 2 个已审阅排除区漂移）、3 个 GOV-015 精确重放、6 条历史状态核对、7 个原件哈希检查、15 处新增本地文档链接检查及 4 个分块候选逐字节重放。`6b959f5 + 29 个内容路径` 的隔离树知识 lint 为 `Markdown=170, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS；加入 3 个控制文件后最终为 `Markdown=172, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS。工作区最终为 Markdown=405、零错误/零警告、PASS。11 个 GOV-015 文件在候选 attributes 下的 Git blob 均与原始字节一致；最大内容文件 336,035 字节，无大于 1 MiB 的内容候选。

本机审阅材料位于 `.kb-local-archive/post-6b959f5-controlled-integration-20260909-v1/batch-a-review-20260909-v1/`，保存候选文件、补丁、输入指纹、依赖检查及最终控制文件 seal；均为本轮小范围衍生产物，原恢复归档未覆盖。控制文件的最终 SHA 在该目录 `freeze-seal.json`，避免 JSON 自身哈希循环。

后续执行前必须核对 HEAD、空索引、29 项工作区 SHA、3 个控制文件 seal 和补丁 SHA。任何变化都要先审阅对应差异，不自动更新 allowlist。暂存后以 `git show :路径` 的实际 blob 校验 4 个分块候选及 11 个 GOV-015 原件；处理新增原件时必须使用候选 attributes 的有效规则，或以原字节写入指定 blob 并核对。其余文件遵循现有 attributes 并核对转换结果。禁止 `git add .`、`git add -A`，也不得把完整恢复补丁作为 A 批补丁。

人工复验（仓库根）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\CUDA_coding\scripts\check_knowledge.ps1' -ProjectRoot '.\CUDA_coding'
git diff --cached --name-only
```

预期 lint 为零警告/零错误且 PASS，当前已暂存路径输出为空。失败保留完整 stdout/stderr、退出码和 HEAD。冻结材料的机器验证结果见 JSON 及本机 seal；此命令本身不替代分块 SHA 核验或未来提交后的独立验收。

本轮已核 queue/blocker，没有新的软件状态或科研缺口，故工作区三份实时文档保持原样；无新增来源、科学主张、开放问题或编译里程碑。唯一下一步为按本 allowlist 做 A 批受控暂存与提交前 blob 验收；依赖本冻结基线及指纹保持，推荐 `gpt-6-astra / Medium`，发生归属冲突时使用 `High`。

## 关闭补充（2026-09-09）

用户要求“进行最后收口吧”后，已提交冻结内容，SHA：`c80ab27b3e38818b3f171ad21025e22df2a30aef`，parent 为 `6b959f5d785d1359f8ded5287c371a8affe9c79c`。32/32 实际 staged blob、commit blob 和独立 clone checkout 字节一致；4 个分块候选与 11 个 GOV-015 原件保持精确字节，最大内容 blob 为 336,035 字节。

唯一空白例外位于 GOV-015 的 `raw/before-compile-log.md.bin`、`raw/before-task-blocker-register.md.bin`、`raw/before-task-queue.md.bin`、`raw/knowledge-lint-final.log`、`raw/snapshot-addition.txt`。完整默认 `git diff --cached --check` 在内容提交前返回 2，共 14 条 CRLF/末尾空行提示；这五份原件均与冻结 SHA 一致，排除这五份后的其余内容检查返回 0。按本任务精确保留原件的合同接受该有界例外，提交说明已记明；不声称完整默认检查为 PASS，也不修改原件或 Git 空白配置。

独立 clone 使用 `--no-local --no-hardlinks --single-branch`，不借用工作区未跟踪依赖。干净树知识 lint 为 `Markdown=172, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS；15 处新增本地引用目标齐全。七个 pointer 原件的本机大小与 SHA 均通过，仍属外部依赖，不声称 clone 自带大原件或已重跑历史 GPU/旧制作工具。

内容提交不包含另一个任务在暂存期间新增的 queue/blocker 资源等待说明；这些变化和 B/C 批原有改动继续留在工作区。`.gitattributes` 已同步本批采用的规则，避免工作区出现对新提交规则的反向删除。旧 GOV-015 回执及 JSON allowlist 不追溯重写；本说明与执行清单通过单独关闭补充提交记录结果，自身 SHA 在交付消息给出。

本机逐文件核对和 clone 日志保存在原恢复归档的 `batch-a-review-20260909-v1/` 下：`stage-a-actual-blobs.json`、`stage-a-result.json`、`content-commit-clone-verification.json` 和 `content-commit-clone-lint.log`。关闭后唯一下一动作见执行清单的 B 批审阅；没有自动推进剩余文档、源码、远端或公开发布。
