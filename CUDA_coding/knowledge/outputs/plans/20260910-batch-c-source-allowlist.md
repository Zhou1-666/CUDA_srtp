# 第 C 批：科研源码路径／分块冻结与验证合同

日期：2026-09-10。冻结基线：`d5948d49a11e05236ebc1bae6618c555f26c74bd`。

状态：本页主体保留 5 个工作区候选在 `frozen-not-staged-not-adopted` 时点的任务归属、字节指纹和验证合同。2026-09-10 经后续明确授权，`C-GENERAL-M` 与 `C-ATTRIBUTION` 已分别受控暂存、形成内容提交并通过独立 clone 验收；关闭结果见文末。`C-PROFILE` 仍未采用。

## 结论

这 5 个路径不是一个可整体采用的任务单元，必须按三组处置：

| 冻结组 | 任务归属 | 精确路径／分块 | 当前处置 |
|---|---|---|---|
| `C-ATTRIBUTION` | TASK-002A 提供署名来源；TASK-002B 控制最终公开文字 | `README.md` 的单个署名段；`PaScaL_TDMA_cuda_penta.f90` 第 1–5 行署名注释 | 内容提交 `5e4588550ed0c23cc925b44611bfaa9f6a07db12` 已通过独立 clone 验收；TASK-002B 仍为 `review` |
| `C-GENERAL-M` | TASK-019 | `.gitattributes` 精确分块、`mband_formula_audit.js`、`mband_general.js`、`mband_theory.md` | 内容提交 `6b2bbda6bd0551843af72e6b0db23f7b575c2d32` 已通过独立 clone 验收；TASK-019 仍为 `review` |
| `C-PROFILE` | TASK-007 的历史 profile-only 诊断增量 | 核心 Fortran 除第 1–5 行外的计时字段、复位、两处 profiled 调用和 helper；`benchmark_penta.f90` 的 18 字段提取／CSV 表头 | 当前候选仍未完成源码 SOP，禁止采用；冻结不重开已 `done` 的 TASK-007 |

`PaScaL_TDMA_cuda_penta.f90` 是共享路径，只能分块归属。它去掉精确 5 行署名前缀后的 SHA-256 为 `0ad2330739ac4a11e8f3e403ae35fb1ea630459b3ba489e190622afc39b3a8d2`，与 TASK-007 历史 profile-only 输入一致；完整文件 SHA-256 与 TASK-002A 署名补充后的记录一致。不得把后来的 persistent pinned 候选 `84357b2b…56b035` 与本组旧 profile-only 增量混为一谈；前者已按硬停止规则撤回，`do-not-adopt` 结论不变。

## 5 路径候选指纹

组合候选 SHA-256（按下表顺序连接 5 份工作区原字节）：`9798e542ae55807015e2262646f45fb9d7588f68284138cacfe96194a305b4bb`。理论页 LF 规范化后，相对基线的 5 路径总差异为 `+150/-32`。

| 路径 | 原字节 SHA-256 | 原字节 Git blob | 预期 staged blob | 差异 |
|---|---|---|---|---:|
| `CUDA_code/源代码/README.md` | `3bd5dd74a7e766c894b606284565826162cfb35cc1d8fd7a9639079969b4c9b8` | `a6303546462454d4c4067d0fafbaed01def44389` | `e80a6b43d178486c329e816b5b0013f6597b0f97` | `+1/-1` |
| `CUDA_code/源代码/perf_bench/benchmark_penta.f90` | `2cc91f341066969928febdf2840d0e5aabd14d56239084c87b0efe9d3b9745e8` | `c4a774c0f9d30a511bf2f75f236402c84486b133` | 同原字节 blob | `+8/-1` |
| `CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` | `9fe8a4df8978d7db49f48449096f8a8b55f11a22ad6a7567053ff67184f1f768` | `caea0f8c5af4964648648bcac9d8e4038fff1a0b` | 同原字节 blob | `+76/-4` |
| `CUDA_code/源代码/verify/mband_general.js` | `1ee2fea811289b62379aa9a50a77da6c0a95c21d6088c7881faa5490048036eb` | `5593ad13a13ca3ed124956e3898ff591fc2397a0` | 同原字节 blob | `+24/-5` |
| `CUDA_code/源代码/verify/mband_theory.md` | `308e61c27a4a4e12d9fec55a80cde7bfb2a3be095694c965efb0e235a72b0ee1` | `9742bf4ab18c0c94a18df75ef25021fadf8ec37b` | 同原字节 blob | `+41/-21` |

README 受 Git 文本清洗影响，所以原字节 blob 与预期 staged blob 不同；两者均冻结，未来暂存必须核 staged blob，恢复原件必须核 SHA-256。完整基线 blob、基线 SHA、字节数和历史快照提交见[机器 allowlist](20260910-batch-c-source-allowlist.json)。

## 最小证据依赖

以下依赖仅被认领和指纹化，不自动加入 5 路径 allowlist：

| 路径 | 状态 | 冻结身份／用途 |
|---|---|---|
| `verify/mband_formula_audit.js` | 冻结时未跟踪；现由 `6b2bbda6` 跟踪 | SHA-256 `ca1cbb9a121fcbf29e48ada9914e607305088f5cbe56c67271e60db618f9e46d`；blob `52962dabbea98096674f328d7f58556de34b0b15`；与 `041193d` 一致；TASK-019 独立公式审计 |
| `verify/run_task_007_profile_timing.sh` | 未跟踪 | SHA-256 `6382b18ce97465541e617a15d9bc70bc969adaeca6a5a39363c37c5671513e3d`；blob `1e762f3a899923866f57229d7a89f0dbfa65a703`；与 `6ada162` 一致；profile 结构／精度 runner |
| `verify/mband_recurrence.js` | HEAD 已跟踪 | SHA-256 `195fd0814e490d80ac9bcf8a6de7d1c9b0c5c24bc5274f3a9f16ec2a1cd5073d`；TASK-019 独立递推比较 |

2026-09-10 的 C-GENERAL-M 暂存前置审阅已决定并实际把 `mband_formula_audit.js` 放入 TASK-019 候选 payload；冻结时该文件尚未跟踪，现已随内容提交进入 Git。`run_task_007_profile_timing.sh` 仍只属于 C-PROFILE 的指纹化依赖，未进入该提交。

## C-GENERAL-M 暂存前置审定

字节策略已经应用：**`mband_theory.md` 仅做 UTF-8 LF 规范化，不申请原件保真例外**。

- 原文件包含 180 个 CRLF、48 个裸 LF、0 个裸 CR，共 229 个逻辑行；去掉行尾 CR 后没有真实尾随空格。候选现为 0 个 CRLF、228 个 LF、0 个裸 CR，文字和公式除 EOL 外逐字节等价。
- 人工 `accept` 绑定的冻结对象是 `knowledge/outputs/reviews/TASK-019-20260824-general-m-model-audit.md`（SHA-256 `2DDEBDF1…C1905`），不是 `mband_theory.md`。历史 `041193d` blob 和本机冻结副本继续保留，因此规范化不改写签字证据。
- 规范化结果为 10,616 字节，SHA-256 `308e61c27a4a4e12d9fec55a80cde7bfb2a3be095694c965efb0e235a72b0ee1`，raw/staged blob 均为 `9742bf4ab18c0c94a18df75ef25021fadf8ec37b`。
- `.gitattributes` 的精确规则已从 `CUDA_coding/CUDA_code/源代码/verify/mband_theory.md -text` 改为 `... text eol=lf`，没有交给本机 `core.autocrlf` 决定。整文件 SHA-256 `5f1601cad4e61af130c2160ced5a4073410faed299c79fcbe7e2b6fea040861f`，raw/staged blob 均为 `d7e6fe8ae752eebc0be4e870a0be18e62eba8dd6`。
- `mband_formula_audit.js` 必须纳入：理论页、compile log 与验证合同都直接依赖其 `m=1..64` 独立审计；不携带它的 clone 无法复验。采用当前精确历史身份：SHA-256 `ca1cbb9a121fcbf29e48ada9914e607305088f5cbe56c67271e60db618f9e46d`，blob `52962dabbea98096674f328d7f58556de34b0b15`。

C-GENERAL-M 候选固定为 4 路径：`.gitattributes` 精确分块、`mband_formula_audit.js`、`mband_general.js`、`mband_theory.md`。实际 raw/clean-filtered blob 均与机器清单一致，按此顺序连接的候选 SHA-256 为 `2df63b7f6328818fe2fdb25d2080f38cf30d86e25443bb541ecfd961ef28f069`；差异为 4 文件、`+166/-27`。C-ATTRIBUTION 与 C-PROFILE 不属于 payload；三份控制文档只用于冻结和集成交接。冻结时暂存须另行授权，后续执行与关闭证据见文末。

## 分组验证合同

### C-ATTRIBUTION

- 对照 TASK-002A 补充记录逐句审阅，确认只表达五对角扩展开发者，不宣称上游 PaScaL_TDMA 作者身份。
- 去除核心源码第 1–5 行后，剩余字节必须保持上述 `0ad233…b3a8d2` 身份；Fortran 最大行长不超过 132（本次最大 126）。
- 运行知识库 lint 和本组空白检查。
- 注释／文档分块不要求重跑 NVHPC/GPU；这项豁免不适用于同一 Fortran 文件中的 C-PROFILE 分块，也不关闭 TASK-002B。

### C-GENERAL-M

- `node verify/mband_general.js --self-test-zero-aggregation`：必须输出 `zero aggregation: PASS`。
- `node verify/mband_general.js`：216 个配置全部通过，最大误差维持机器精度量级。
- `node verify/mband_formula_audit.js`：独立组合审计 `m=1..64` 全部通过。
- `node verify/mband_recurrence.js`：108 个配置全部通过，边界和解误差维持机器精度量级。
- 运行全量本地 `check_all.ps1`。这些结果只验证工具／理论模型，不验证生产 Fortran 求解器，不产生 CUDA/GPU 或性能主张。
- TASK-019 的人工公式复核已保留，但投稿前数据库检索仍须单独关闭；在此之前不使用“首次／最优／绝对下界”。

### C-PROFILE

这是生产 Fortran 诊断路径变化，采用前必须把当前 5 路径候选及所需 runner 绑定到同一不可变 SHA，并按 `source-change-validation-sop.md` 完成：

1. L0：接口、所有权、18 列 timing schema、分块归属和候选指纹审阅。
2. L1：八项数学／独立检查及容量模型。
3. L2：目标 NVHPC + MPI 环境 debug/release 干净构建。
4. L3：真实 `P=1` plain/profiled 的 28/22、独立真值、误差和 API 失败用例。
5. L4：至少两张不同 GPU UUID、每 rank 一 GPU，覆盖均匀与不均匀分解。
6. L6：28/22 各 100 次 create-solve-clean；逐 rank memcheck/initcheck。
7. L7：至少两节点，保存 hostname、GPU UUID 和通信后端证据。
8. 重链 TASK-010，运行并审计其 32 例。
9. profile 专项：18 列齐全、有限且非负；适用时 D2H/MPI/H2D 为正；普通入口无回归。
10. 独立采用审阅；任何“更快”结论必须另做预注册、同输入同精度的配对多次计时。

本机没有 `nvfortran`、`mpif90/mpifort` 或 `make`，所以 L2/L3/L4/L6/L7、TASK-010 重链和目标采用审阅均为 `NOT-RUN`。历史 TASK-007 结果只作谱系证据，不能代替当前候选门禁。

## 已执行冻结预检

- `check_all.ps1`：PASS；`Markdown=413, Wiki=36, Sources=35, Warnings=0, Errors=0`；`Scripts=8, Failures=0`。
- 零槽交集自检：PASS。
- general-m：216 个配置，最大误差 `6.661e-16`。
- 独立公式审计：`m=1..64` PASS。
- recurrence：108 个配置，边界最大误差 `2.220e-16`，解最大误差 `6.661e-16`。
- 完整候选空白检查退出 0、无提示；LF 规范化和精确 `text eol=lf` 属性分块已经应用，不使用原件例外。

## 停止条件与排除项

出现以下任一情况立即停止：C-GENERAL-M 的任一候选或依赖指纹漂移；不同任务组被一起暂存／采用却未分别完成合同；C-PROFILE 任一必需门禁缺失、失败、超时或绑定不同源码；把撤回的 persistent 候选与旧 profile-only 增量混淆；TASK-002B 人工门前声称公开文字已最终确认；未来 staged index 偏离上述 4 个 payload 路径／冻结 blob，或遗漏另行认领的控制文档。

冻结阶段明确排除：`git add/commit/push`、SSH、GPU 作业、发布、源码采用；后续只有受控暂存和本地内容提交获得了另行授权。未跟踪依赖不属于 5 路径核心集合；TASK-031 活跃状态及工作区全部其他变化不在本批。

人工复验（仓库根）：

```powershell
node '.\CUDA_coding\CUDA_code\源代码\verify\mband_general.js' --self-test-zero-aggregation
node '.\CUDA_coding\CUDA_code\源代码\verify\mband_general.js'
node '.\CUDA_coding\CUDA_code\源代码\verify\mband_formula_audit.js'
node '.\CUDA_coding\CUDA_code\源代码\verify\mband_recurrence.js'
powershell -NoProfile -ExecutionPolicy Bypass -File '.\CUDA_coding\scripts\check_all.ps1'
git diff --cached --name-only
```

预期：四项 Node 检查与 `check_all.ps1` 均 PASS，最后一条无输出。若失败，保存完整命令、stdout、stderr、退出码、`git rev-parse HEAD`、当前 5 路径及 3 个依赖的 SHA-256；停止暂存和采用。

## C-GENERAL-M 内容提交与独立 clone 关闭记录

2026-09-10 C-GENERAL-M 内容提交已形成：`6b2bbda6bd0551843af72e6b0db23f7b575c2d32`，parent 为 `d5948d49a11e05236ebc1bae6618c555f26c74bd`，tree 为 `9e2fded6ba791b3df7bd33a00a45dc8e04a378fa`。提交恰含 7 个受控路径：4 个 TASK-019 payload 与 3 份批次控制文件，差异为 `+597/-35`；提交前索引树与提交树一致，7/7 staged/commit blob 命中冻结值，提交后索引为空。C-ATTRIBUTION、C-PROFILE、TASK-031 与其余工作区变化均未进入提交。

独立副本使用 `git clone --no-local --no-hardlinks --single-branch --branch main` 建立在 `.kb-local-archive/cgm-6b2bbda`。clone HEAD、parent、tree 和 7 路径集合与内容提交一致，无 object alternates，`git fsck --full --strict` 通过；4 个 payload 的 checkout 原字节及 clean-filtered blob 均命中冻结值，三份控制文档的 clean-filtered blob 命中提交。测试前后工作树均干净。

独立 clone 验收中，零槽聚合自测 PASS；general-m 216 个配置通过，最大误差 `6.661e-16`；独立公式审计 `m=1..64` PASS；recurrence 108 个配置通过，边界最大误差 `2.220e-16`、解最大误差 `6.661e-16`。`check_all.ps1` 为 `Markdown=183, Wiki=36, Sources=35, Warnings=0, Errors=0`、`Scripts=8, Failures=0`，容量自测 6/6，整体 PASS。初次使用更深的忽略目录时 Windows checkout 因路径过长失败；该不完整副本已删除，随后使用上述短路径成功复验，未修改 Git 全局配置。

这项关闭只证明一般 `m` 理论模型、验证工具和批次集成可由提交独立复现；不证明生产 Fortran、CUDA/MPI、GPU 或性能。TASK-019 仍为 `review`，投稿前数据库更新检索缺口不变；没有新增来源、主张或开放问题。未推送。机器 allowlist 的冻结状态不追溯改写，本 closeout commit 的 SHA 由最终交付消息给出以避免自引用。

人工复验（仓库根）：

```powershell
git show --stat --oneline 6b2bbda6bd0551843af72e6b0db23f7b575c2d32
git -C '.\.kb-local-archive\cgm-6b2bbda' status --short
powershell -NoProfile -ExecutionPolicy Bypass -File '.\CUDA_coding\scripts\check_knowledge.ps1' -ProjectRoot '.\CUDA_coding'
```

预期：第一条显示 7 文件、`+597/-35`；第二条无输出；第三条退出 0、Warnings/Errors 为 0 且 `Knowledge lint: PASS`。失败时保存完整 stdout/stderr、退出码、主工作区与 clone 的 HEAD、`git status --short`；文档 lint 不替代 GPU 验收。

## C-ATTRIBUTION 实际候选与控制文档冻结

2026-09-10 的提交前置审阅确认，两处文字只把李洋、周一涵限定为五对角扩展开发者，不声称二人是上游 PaScaL_TDMA 项目作者。该内部归属有 TASK-002A 补充记录支持；TASK-002B 仍控制共同署名、NOTICE／引用清单及论文公开文字的最终确认。

共享 Fortran 在构造前的 81,089 字节原件已由恢复归档逐字节保存于 `.kb-local-archive/post-6b959f5-controlled-integration-20260909-v1/tracked-working-files/CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`，SHA-256 为 `9fe8a4df8978d7db49f48449096f8a8b55f11a22ad6a7567053ff67184f1f768`。工作树随后仅撤出 C-PROFILE 分块，保留第 1–5 行署名注释；C-PROFILE 原件和既有 `do-not-adopt` 边界没有丢失或改写。

| payload 路径 | 实际原字节 SHA-256 | 原字节 blob | 预期 staged blob | 相对 `ee735b6d` |
|---|---|---|---|---:|
| `CUDA_coding/CUDA_code/源代码/README.md` | `3bd5dd74a7e766c894b606284565826162cfb35cc1d8fd7a9639079969b4c9b8` | `a6303546462454d4c4067d0fafbaed01def44389` | `e80a6b43d178486c329e816b5b0013f6597b0f97` | `+1/-1` |
| `CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` | `8b419a5bd3667e48e70952a736387fbb3a5b450d523f01b3c2cb949a11815fc9` | `0e305035bad774a5fe7b9406864f6d2394074463` | `0e305035bad774a5fe7b9406864f6d2394074463` | `+5/-0` |

按上表顺序连接两份实际原字节的组合 SHA-256 为 `6dad9692bbc329b690380ef1e4957bd6e1a6e1249b6e6b5dafce793dd6ef2586`。Fortran 去除 5 行注释后与 `ee735b6d:CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` 逐字节相同，候选最大行长 126，无注释尾随空白。

未来受控暂存的精确集合为 5 路径：上述 2 个 payload，加本页、`20260910-batch-c-source-allowlist.json` 和 `20260909-post-6b959f5-controlled-integration-checklist.md` 三份控制文档。机器 JSON 保留原始五路径冻结字段，并新增时间化的 `c_attribution_candidate`；包含控制文档实际 raw/clean blob 的不可自引用 seal 位于 `.kb-local-archive/post-6b959f5-controlled-integration-20260909-v1/batch-c-attribution-20260910-v1/freeze-seal.json`。冻结不授权暂存或提交。

验收范围为逐句来源核对、两 payload 指纹、Fortran 去前缀等价、最大行长、局部空白检查和知识库 lint。纯注释／文档候选不要求重跑 NVHPC/GPU；这项豁免不适用于归档中的 C-PROFILE 分块，也不关闭 TASK-002B。没有新增来源、主张或开放问题。

## C-ATTRIBUTION 内容提交与独立 clone 关闭记录

2026-09-10 C-ATTRIBUTION 内容提交已形成：`5e4588550ed0c23cc925b44611bfaa9f6a07db12`，parent 为 `ee735b6d68f971de9b59406ec0c2c5522d9d42b6`，tree 为 `b6a09369344b362251166b69ce64f3d89a2f3362`。提交恰含冻结 seal 的 5 个受控路径：2 个署名 payload 与 3 份批次控制文件，差异为 `+84/-6`；5/5 commit blob 命中冻结值，提交后索引为空。C-PROFILE、`benchmark_penta.f90`、profile runner、TASK-031 与其余工作区变化均未进入提交。

独立副本使用 `git clone --no-local --no-hardlinks --single-branch --branch main` 建立在 `.kb-local-archive/ca-5e45885`。clone HEAD、parent、tree 和 5 路径集合与内容提交一致，无 object alternates，`git fsck --full --strict` 通过；提交 blob 与干净 checkout 的 clean-filtered blob 均命中冻结值，测试前后工作树干净。

独立 clone 验收确认：README 只更新冻结的署名段；Fortran 只增加第 1–5 行署名注释，去除该前缀后与 parent 逐字节相同，最大行长 126；局部空白检查无问题。知识库 lint 为 `Markdown=183, Wiki=36, Sources=35, Warnings=0, Errors=0`、PASS。TASK-002B 继续保持 `review`，最终共同署名、NOTICE／引用和公开文字仍须导师或权利人确认。

这项关闭只证明内部署名分块及其批次集成可由提交独立复现；不证明 CUDA/MPI、GPU、性能或公开发布 Gate。没有新增来源、主张或开放问题，未修改 queue/blocker，未推送。机器 allowlist 和本机 seal 的冻结时事实不追溯改写，本 closeout commit 的 SHA 由最终交付消息给出以避免自引用。

人工复验（仓库根）：

```powershell
git show --stat --oneline 5e4588550ed0c23cc925b44611bfaa9f6a07db12
git -C '.\.kb-local-archive\ca-5e45885' status --short
powershell -NoProfile -ExecutionPolicy Bypass -File '.\CUDA_coding\scripts\check_knowledge.ps1' -ProjectRoot '.\CUDA_coding'
```

预期：第一条显示 5 文件、`+84/-6`；第二条无输出；第三条退出 0、Warnings/Errors 为 0 且 `Knowledge lint: PASS`。失败时保存完整 stdout/stderr、退出码、主工作区与 clone 的 HEAD、`git status --short`；文档 lint 不替代 GPU 或公开发布验收。

唯一下一治理动作：审阅 C-PROFILE 当前候选的处置／恢复策略和采用门禁，保持其生产源码 SOP 的未运行项与 TASK-007 `do-not-adopt` 边界；推荐 `gpt-6-astra / High`。本页不授权恢复、暂存、提交、GPU 作业、公开发布或推送。
