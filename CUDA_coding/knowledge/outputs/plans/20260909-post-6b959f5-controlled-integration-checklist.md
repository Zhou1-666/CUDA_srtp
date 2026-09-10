# `main@6b959f5` 之上工作区受控集成清单

日期：2026-09-09

第 A 批已完成本地内容提交与独立 clone 验收：`c80ab27b3e38818b3f171ad21025e22df2a30aef`，closeout 为 `78fec880c5b5d7e47d3c4042fb02aee26c43a06c`。第 B 批内容提交 `39100fa4facf6f9a5a2f959019183a905812f766` 已通过独立 clone 验收；C 批 5 路径已审阅并冻结但尚未暂存或采用，TASK-031/T2 排除片段仍在批次外。下方“已冻结基线”保留初次捕获时事实。

目标：先为 `main@6b959f5` 之上的未提交状态建立可恢复锚点，再按文档治理、其余文档、科研源码三个边界完成受控提交。本文只是执行清单，不新建 `KB-GOV` 任务，不把任何未执行门禁写成通过。

## 已冻结基线

- 分支：`main`
- `HEAD` / `main`：`6b959f5d785d1359f8ded5287c371a8affe9c79c`
- 索引：0 个已暂存路径
- 有实质差异的 tracked 路径：35 个
  - 文档治理与实时权威文件：15 个
  - 其余文档：15 个
  - 科研源码线：5 个
- 捕获时非忽略 untracked 路径：12,802 个
  - 已逐字节复制的关键路径：13 个（GOV-015 回执 11 个、P1 根指针 2 个）
  - 仅列入路径/大小清单、未复制：12,789 个
- 本机恢复归档：`.kb-local-archive/post-6b959f5-controlled-integration-20260909-v1/`
- tracked 补丁 SHA-256：`938c2fd69f38a0ee495e039da21504d639edccd7c618b976f168bd877bc5ed18`
- 归档验收：35/35 tracked 文件有逐字节副本；13/13 关键 untracked 文件有逐字节副本；补丁在当前树反向检查通过，并从干净索引基线正向重放后与 35 个当前文件逐项一致（忽略 CRLF 差异）。

归档内的 `archive-manifest.json`、`tracked-manifest.json`、`critical-untracked-manifest.json`、`all-untracked-inventory.json`、`referenced-local-originals.json` 和 `archive-verification.json` 是本次收口的机器可读边界。归档受 `.gitignore` 保护，只是恢复副本，不是 Git 权威历史。

## 全程硬边界

- [x] 归档阶段不执行 `git add`、`git commit`、`git reset`、`git checkout` 或 `git clean`。
- [ ] 后续禁止使用 `git add .` 或 `git add -A`；每批只允许显式路径或经过复核的分块暂存。
- [ ] 文档治理批不得夹带 5 个科研源码路径；科研源码批不得借文档 lint 代替源码验证 SOP。
- [ ] 12,789 个“仅清单”untracked 路径默认不进入任何提交；逐项认领前视为批次外文件。
- [ ] `task-queue.md`、`task-blocker-register.md`、`compile-log.md` 是混合权威文件，必须逐段确认本批归属和交叉引用闭包。
- [ ] 原始证据、被忽略本机归档和已保留的 canonical 大归档不得重复纳入 Git。
- [ ] 任一批次出现基线漂移、意外已暂存文件、未解释的大文件、lint 错误或依赖断链，立即停止，不得以“先提交再修”收尾。

## 第 A 批：文档治理与实时权威状态

冻结集合见 [第 A 批 allowlist](20260909-batch-a-allowlist.md) 与 [机器清单](20260909-batch-a-allowlist.json)：29 个内容路径（12 个整文件 tracked、4 个分块 tracked、13 个 untracked）加本清单及两份 allowlist，共 32 个路径。逐差异复核纠正了原归档的分类：`claim-evidence-matrix.md` 移回 B 批；KB-GOV-008 README 的 P1 指针注释纳入 A 批；另补 `.gitattributes` 候选分块，仅保护 GOV-015 原件的精确字节。原归档 manifest 作为历史捕获记录保留。

- [x] 逐段审阅 3 个实时权威文件；GOV-015 精确记录重放通过，模型档位与 TASK-031/T2 增量排除，分块补丁按 SHA 冻结。
- [x] 15 处新增本地文档引用在 `6b959f5 + A 批内容` 中解析成功，均位于基线或 A 批；七个原件仍为明确的本机外部依赖，不伪称 clone 自带。
- [x] 核对 11 个 GOV-015 文件、六条历史变更、三份原 meta 的精确重放与历史 lint 原件；历史文件未重写。
- [x] 核对 2 个根指针及 5 个 dump/intake 指针对应原件的大小和 SHA-256。
- [x] 对冻结的 32 路径受控暂存；32/32 实际 staged blob 与冻结值一致。
- [x] 暂存路径不含科研源码、claim matrix、模型档位或 TASK-031/T2 排除增量。
- [x] 空白检查完成有界处置：完整检查退出 2，14 条提示仅来自 GOV-015 的 5 份冻结原件；除这 5 份外检查退出 0。用户要求最终收口后，按原件精确字节合同保留例外，提交说明逐文件记明；未清洗原件或放宽 Git 配置。最大内容 blob 336,035 字节，无意外大对象。
- [x] 实际索引及独立 clone 的知识库 lint 均为 `Markdown=172, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS。
- [x] 第 A 批内容提交：`c80ab27b3e38818b3f171ad21025e22df2a30aef`，恰好 32 路径，parent 为冻结基线 `6b959f5d785d1359f8ded5287c371a8affe9c79c`。
- [x] `git clone --no-local --no-hardlinks --single-branch` 独立副本干净，32/32 commit blob 与 checkout 字节通过，15/15 新增引用目标可定位，7/7 本机外部原件大小与 SHA 通过；后者不属于 clone 携带范围。
- [x] 通过上述验收后，在本清单和 allowlist 说明补记关闭结果，以独立 closeout 提交保存；自身 SHA 由最终交付消息给出，避免自引用。

## 第 B 批：其余文档修订

冻结集合见 [B 批 allowlist](20260909-batch-b-allowlist.md) 与 [机器清单](20260909-batch-b-allowlist.json)：15 个原文档、3 个模型元数据分块、1 个属性分块、31 个逐件认领的最小证据依赖、3 个控制文档，共 53 路径；基线为 A 批 closeout `78fec880c5b5d7e47d3c4042fb02aee26c43a06c`。TASK-031/T2 活跃状态、后续模型覆盖和 C 批未纳入。

- [x] 按主张/来源边界审阅 15 个路径；有界修正签字状态、撤回约束、硬件历史范围、测试入口和重复的实时排程，不新增许可／性能结论。
- [x] 新增依赖 76 处引用在独立候选树闭合，31 份原件逐字节保真，49 条历史模型映射及三份 meta 分块逆向还原通过。
- [x] 独立候选树文档 lint 零警告／零错误；53 路径按候选 blob 冻结。完整空白检查退出 2；用户批准的精确 10 份原件共 737 条提示单列，排除它们后退出 0，不放宽 Git 配置。
- [x] 受控暂存 53 个显式路径，53/53 实际 staged blob 匹配冻结值；C 批源码和 TASK-031 后续增量均未进入索引。
- [x] 内容提交 `39100fa4facf6f9a5a2f959019183a905812f766` 恰含 53 路径，parent 为 `78fec880c5b5d7e47d3c4042fb02aee26c43a06c`，tree 与提交前索引树一致。
- [x] `--no-local --no-hardlinks` 独立 clone 干净；53/53 commit／checkout blob、76 处引用和 31 份原件通过，知识库 lint 为 `Markdown=182, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS；主工作区 1,359 个文件指纹未变，索引为空。
- [x] 关闭结果已补记到本清单和 B 批 allowlist；独立 closeout 提交保存这两份记录，其 SHA 由最终交付消息给出以避免自引用。

## 第 C 批：科研源码线

冻结集合见 [C 批源码 allowlist](20260910-batch-c-source-allowlist.md) 与 [机器清单](20260910-batch-c-source-allowlist.json)：归档 `tracked-manifest.json` 中类别为 `research-source` 的 5 个路径。组合候选基于 B 批 closeout `d5948d49a11e05236ebc1bae6618c555f26c74bd`，状态为 `frozen-not-staged-not-adopted`。

- [x] 逐路径／分块确认任务归属：署名组归 TASK-002A/002B，一般半带宽模型归 TASK-019，历史 profile-only 诊断归 TASK-007；核心 Fortran 共享路径按 5 行署名前缀和其余 profile 分块拆分。
- [x] 按 `knowledge/wiki/testing/source-change-validation-sop.md` 冻结 5 个候选的原字节 SHA、raw/staged blob、历史快照、数值边界、停止条件和分组验证合同。
- [x] 认领 3 个最小验证依赖；`mband_formula_audit.js` 已纳入 TASK-019 的独立候选 payload，`run_task_007_profile_timing.sh` 仍只作 C-PROFILE 指纹化依赖，当前均未暂存。
- [x] 本地 JavaScript／容量／知识库预检通过；`mband_theory.md` 的 180 条旧提示已证明只来自 180 个 CRLF 与 48 个 LF 的混合换行、无真实尾随空格。候选现已纯 LF 规范化并采用精确 `text eol=lf` 属性分块，完整空白检查退出 0，不使用原件例外。
- [x] 当前 Windows 缺 NVHPC/MPI/make；C-PROFILE 的 L2/L3/L4/L6/L7、TASK-010 重链和独立采用审阅均明确记为 `NOT-RUN`，不把历史 TASK-007 回执当成当前候选 PASS，不宣称正确或更快。
- [ ] 只有各任务分组分别满足自身验证合同并获得另行暂存／提交授权后，才可形成独立内容提交；不得将三组整体采用。

## 每批提交前的最小只读核对

```powershell
git status --short --branch
git diff --name-only
git diff --cached --name-only
git diff --cached --check
powershell -NoProfile -ExecutionPolicy Bypass -File '.\CUDA_coding\scripts\check_knowledge.ps1' -ProjectRoot '.\CUDA_coding'
```

预期现象：分支和基线符合当前批的记录；已暂存路径与该批 allowlist 完全一致；正常内容 `git diff --cached --check` 无输出并返回 0；知识库 lint 为 `Warnings=0`、`Errors=0`、`PASS`。A 批的 5 份原件例外不自动扩张到后续批次；B 批另经用户明确批准精确 10 份原件保真例外，完整路径、SHA 和提示数见 B 清单。其他失败保存完整命令、标准输出、标准错误、退出码、`HEAD` 和已暂存路径清单，停止提交。

## 恢复顺序

1. 先读取本机归档 `archive-manifest.json` 和 `archive-verification.json`，确认 HEAD 与补丁目标仍为 `6b959f5`。
2. 单文件恢复优先使用 `tracked-working-files/` 或 `critical-untracked/` 中的逐字节副本。
3. 整体恢复只在干净、隔离的 `6b959f5` 基线中先执行 `git apply --check tracked-working-tree.patch`；禁止直接覆盖含新工作的当前树。
4. `all-untracked-inventory.json` 中标为 `copied=false` 的文件没有第二份内容副本，恢复前必须回到其各自任务原件或 canonical 证据源。

## 当前受控集成交接

- [x] 已完成执行清单与恢复归档。
- [x] 已证明归档可重放，归档阶段结束时索引为空。
- [x] 第 A 批内容已提交并通过独立 clone 验收；GOV-015 回执和 P1/P2/P4/P5 处置已进入 main。
- [x] 第 A 批精确路径/分块 allowlist 已审阅并冻结。
- [x] 已将本批采用的 `.gitattributes` 最小规则同步到工作区，字节与内容提交一致，避免留下意外的反向删除；三份 meta 的并发/排除变化保持未暂存。
- [x] B 批归属／最小依赖审阅、冻结、受控暂存、内容提交和独立 clone 验收已完成；十份历史原件例外及批次排除边界保持。
- [x] C 批 5 路径的任务归属、候选指纹和验证合同已冻结；三组边界、两个未跟踪验证依赖及目标门禁 `NOT-RUN` 状态均已记录，索引保持为空。
- [x] C-GENERAL-M 四路径候选已按审定策略构造：理论页纯 LF、属性规则 `text eol=lf`、独立公式审计器纳入；实际 raw/clean-filtered blob、组合 SHA、内容等价性与本地门禁均已重新冻结，索引为空。
- [ ] 唯一下一治理动作：另行授权后按冻结 blob 受控暂存 C-GENERAL-M，并逐项核对实际索引；推荐 `gpt-5.6-terra / Medium`。本 closeout 不授权提交、GPU 作业、公开发布或推送。
