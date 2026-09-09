// One-use maintenance patch. Refuses files changed since the recorded recovery point.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = process.cwd();
const receipt = 'CUDA_coding/knowledge/outputs/validation/KB-GOV-001-20260908-maintenance-baseline';
const manifest = JSON.parse(fs.readFileSync(receipt + '/raw/before-manifest.json', 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const changes = new Map();
function edit(p, transform) {
  if (!manifest.editablePaths.includes(p)) throw Error('Outside allowlist: ' + p);
  const before = fs.readFileSync(p);
  const record = manifest.captures.find(x => x.path === p);
  if (sha(before) !== record.sha256) throw Error('Changed since backup: ' + p);
  let text = before.toString('utf8');
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const api = {
    replace(old, value) {
      const i = text.indexOf(old);
      if (i < 0 || text.indexOf(old, i + old.length) >= 0) throw Error('Anchor not unique: ' + p + ': ' + old);
      text = text.slice(0, i) + value + text.slice(i + old.length);
    },
    afterLine(prefix, lines) {
      const found = text.split(/\r?\n/).filter(s => s.startsWith(prefix));
      if (found.length !== 1) throw Error('Line not unique: ' + p + ': ' + prefix);
      this.replace(found[0], found[0] + nl + lines.join(nl));
    },
    removeLine(line) { this.replace(line + (text.includes(line + '\r\n') ? '\r\n' : '\n'), ''); },
    append(lines) { text = text.replace(/\s*$/, '') + nl + nl + lines.join(nl) + nl; },
    nl
  };
  transform(api);
  if (text === before.toString('utf8')) throw Error('No change: ' + p);
  changes.set(p, { before, after: Buffer.from(text) });
}

edit('AGENTS.md', x => {
  x.replace('- 每次编译更新 index/map、compile log 和开放问题；缺失数据不得静默猜测，矛盾必须保留双方证据。', '- 每次编译核对 index/map、compile log 和开放问题，只修改受本次增量影响的项；无新增来源、主张或问题时在回执注明，不为同步而复制排程或新增日志。缺失数据不得静默猜测，矛盾必须保留双方证据。');
  x.replace('- 每次任务交接、验证失败、状态变化或发现人工/环境/权限依赖时，必须更新 `knowledge/meta/task-blocker-register.md`：具体缺口、类别、责任方、解除证据、最小动作和核对日期。不得只改 `blocked/review` 状态。', '- 每次任务交接、验证失败、状态变化或发现人工/环境/权限依赖时，必须核对 `knowledge/meta/task-blocker-register.md`；有变化才更新对应任务的具体缺口、类别、责任方、解除证据、最小动作和核对日期。无变化在本次回执注明，不复制旧条目；不得只改 `blocked/review` 状态。');
  x.removeLine('- `perf_bench/REPORT.md` 的“28→约18”与已验证理论不一致；当前可支持的是 `28→22`。');
  x.replace('- 每次只完成一个任务；未满足完成定义时不得标为 `done`，应保留为 `review`、`blocked` 或 `in-progress`。', '- 每次只完成一个任务；正常采用候选须满足完成定义。只有任务合同已按证据关闭，或按用户明确批准的停止规则完成“不采用/撤回”处置，才可标为 `done`；负向关闭须保留批准依据和未运行门禁，不等于候选验收通过。其余未完成任务保留为 `review`、`blocked` 或 `in-progress`，具体语义以交接协议为准。');
  x.replace('- 稳定验证方法写入运行手册/测试矩阵；单次运行证据写入 `knowledge/outputs/` 或实验卡。', '- 稳定验证方法写入运行手册/测试矩阵；单次运行与排障细节写入对应 `knowledge/outputs/validation/` 回执，运行原件保存在其 `raw/`。compile log 只记里程碑；任务状态/排程以 queue 为准，不在 brief/index 复制动态清单。');
});

edit('CUDA_coding/knowledge/meta/README.md', x => {
  x.replace('完成任务时，按 `AGENTS.md` 更新任务回执、任务状态和阻塞台账；只有影响论文主张、Gate 或稳定验证方法时，才更新 claim matrix、运行手册或活动 brief。', '完成任务时，按 `AGENTS.md` 核对任务回执、任务状态和阻塞台账；只有发生变化才修改对应项。影响论文主张、Gate、稳定验证方法或上下文路由时，才修改 claim matrix、运行手册或活动 brief。无增量在交接中注明，不重复生成状态副本。');
  x.append([
    '## 按事件维护（2026-09-08 起）', '',
    '| 事件 | 保存位置与最小更新 |', '| --- | --- |',
    '| 新运行、失败或排障证据 | 对应 `outputs/validation/<任务或候选>/` 回执；原件进入其 `raw/`，不覆盖旧文件 |',
    '| 当前状态、依赖、执行顺序或下一动作改变 | [[task-queue]]；具体缺口、责任方与解除条件改变时更新 [[task-blocker-register]] |',
    '| 可复用知识、验收标准或论文主张改变 | 对应 Wiki 页；导航或来源关系改变才更新 index/map/brief |',
    '| 已完成里程碑 | [[compile-log]] 记日期、结果与证据指针；逐次调试、命令输出和重复复验留在任务回执 |',
    '| 形成可复原的交接单元 | 在该任务已授权 Git 操作的前提下，按候选及依赖审查、检查并提交；不按目录拆散验证器与调用方 |', '',
    '任务状态与排程只有 queue 一个实时来源；blocker 管缺口；brief/index 管约束与导航。顶层运行手册、代码地图和工作流模板可以保留，但必须说明职责与现行规范入口，不独立维护另一套验收标准。', '',
    '## 当前摘要与历史', '',
    '- 新增或更新的活文档当前区只保留一份摘要；旧状态原文保存在对应任务回执或有日期的历史区。迁移前保存原文与来源映射，不改原始回执或冻结包。',
    '- 既有多层“当前”段本批不批量迁移，仍按原文最顶端有效声明定位；后续按任务逐步整理。此规则不以“当前/最新”字样出现次数判错。',
    '- 优先复用已有任务/候选目录，不默认按日拆文件；将段落折叠不等于减少模型实际读入的内容。',
    '- 提交只保存版本；冻结只保存输入；验收按适用 Gate；采用与否另记。冻结包和 worktree 不能一概称为已验证版本。', '',
    '本批恢复点、授权范围、验证与后续批次见 [KB-GOV-001 回执](../outputs/validation/KB-GOV-001-20260908-maintenance-baseline/README.md)。'
  ]);
});

edit('CUDA_coding/knowledge/meta/knowledge-compiler.md', x => {
  x.replace('7. **索引**：更新 `wiki/00-index`、brief、map 和相关页面；', '7. **索引**：核对 `wiki/00-index`、brief、map 和相关页面；只有导航、来源关系或必要上下文改变才更新，不复制实时排程；');
  x.replace('8. **记录**：更新 compile log；任务/缺口变化同步 task queue 和阻塞台账。compile queue 是历史快照，不再更新；健康报告仅在阶段性健康检查时更新；', '8. **记录**：运行原件与逐次排障保存在对应 outputs/validation 回执；compile log 只记已完成里程碑及指针。任务/缺口变化同步 task queue 和阻塞台账，无变化在回执注明。compile queue 是历史快照，不再更新；健康报告仅在阶段性健康检查时更新；');
  x.replace('9. **提问**：把未解决矛盾和新研究问题写入 `open-questions`。', '9. **提问**：新发现的未解决矛盾和研究问题写入 `open-questions`；无新增时在回执注明，不凑问题或重复登记。');
  x.replace('最后核对索引、来源地图、变更日志和开放问题；任务变化同步 task queue/阻塞台账，不改历史 compile queue。', '最后核对索引、来源地图、变更日志和开放问题，仅更新受本次增量影响的项；任务变化同步 task queue/阻塞台账，过程证据进入对应 output，compile log 只记里程碑，不改历史 compile queue。');
});

edit('CUDA_coding/knowledge/meta/change-impact-map.md', x => {
  x.afterLine('# 变更影响地图', ['', '> 下表是影响核对清单，不是每次都要改写的文件清单。实际有变化才更新；调度/状态以 task-queue 为准，缺口以 task-blocker-register 为准，brief/index/map 只在约束或路由变化时修改。逐次排障留任务回执，compile-log 只记里程碑。']);
  x.replace('| Gate/任务状态 | 计划书、task queue、README、活动 brief、代码地图；历史审计只加快照标记 |', '| Gate/任务状态 | task queue/阻塞台账与逐门禁回执；稳定支持范围改变时再核对计划、README、brief、代码地图，避免复制动态状态；历史审计只标历史及替代入口 |');
});

edit('CUDA_coding/knowledge/meta/task-handoff-protocol.md', x => {
  x.replace('- 每次交接必须核对并更新 [[task-blocker-register]]；状态不是说明，台账中的“当前缺口、责任方、解除证据、最小动作”才是未完成任务的验收依据。', '- 每次交接必须核对 [[task-blocker-register]]，有变化才更新对应条目；无变化在回执注明。状态不是说明，台账中的“当前缺口、责任方、解除证据、最小动作”才是未完成任务的验收依据。');
  x.replace('| `done` | 任务合同中的代码、自动检查、目标环境验证和记录全部完成 |', '| `done` | 任务合同已按证据关闭：正常交付完成适用验收；实验可按预注册采用门关闭为不采用；未完成门禁的撤回须有用户明确批准的停止规则或关闭决定。必须另记处置及未覆盖项 |');
  x.afterLine('例如：删除无效 `MPI_WAITALL`', ['',
    '### 关闭处置与门禁分别记录', '',
    '- `done` 必须记录关闭类型（正常交付／不采用／撤回）、依据、关闭人或决定来源、日期和回执。源码候选另记采用结论；任务关闭不等于候选获准合并。',
    '- 正常采用候选仍须满足适用 SOP；负结果不能伪装为加速，环境限制不能自动触发 done。只有按已批准的停止规则完成撤回处置，才允许任务关闭而保留未运行门禁。',
    '- FAIL、NOT-RUN、UNKNOWN 原样保留，写明是 solver、工具、环境或证据缺口；不得随任务关闭改为 PASS。TASK-025 的负结果与 TASK-007 的批准撤回分别属于后两类，不重开历史合同。',
    '- 所有 done 任务保留最短关闭快照，即使从未 blocked；历史缺项只凭原回执补录，注明补录日期，不编造曾有阻塞或原关闭日期。'
  ]);
  x.replace('状态：done | review | blocked | in-progress', '状态：done | review | blocked | in-progress' + x.nl + '关闭处置（仅 done）：正常交付 | 不采用 | 撤回；决定来源、日期、证据与保留的未运行门禁');
  x.replace('| 单次运行结果、失败日志摘要 | `knowledge/outputs/queries/` 或 `wiki/experiments/` |', '| 单次运行、失败与逐次排障 | 对应 `knowledge/outputs/validation/<任务或候选>/` 回执；运行原件放其 `raw/`。问答放 outputs/queries，可复用实验结论再编译到 Wiki |');
  x.afterLine('| 给用户的即时交接 |', ['| 已完成里程碑 | `meta/compile-log.md` 中的日期、结果和回执指针；不复制逐次命令或排程全文 |']);
  x.afterLine('5. 推荐时给出模型与推理强度', ['',
    '“唯一下一任务”是当时依赖与授权条件下的推荐，不是永久排程。用户明确决定或经用户批准的高层计划可以覆盖推荐；由维护者依据授权在 queue 记录一条“排程覆盖”，无需用户亲自编辑文件。最小字段为：决策者、日期、原顺序、新顺序、生效条件/范围、依据链接。旧推荐保留为带日期的历史，之后以该决定维护当前顺序。', '',
    '覆盖未来顺序不等于中断当前任务，不自动解除依赖或验收 Gate，也不新增 SSH、GPU 提交、Git 合并或发布授权。没有明确决策依据时，不把推测当作排程覆盖。'
  ]);
});

edit('CUDA_coding/knowledge/meta/task-blocker-register.md', x => {
  x.replace('每次任务开始、状态变化、验证失败、发现新的外部依赖或交接结束时必须更新对应条目；不得只改状态而不改本台账。', '每次任务开始、状态变化、验证失败、发现新的外部依赖或交接结束时必须核对对应条目，有变化才更新；无变化在回执注明，不重复追加状态副本。不得只改状态而漏记变化的缺口。');
  x.replace('1. 只登记 `ready`、`in-progress`、`review`、`blocked`；转为 `done` 后保留一条“已解除”快照和证据链接。', '1. 活动条目登记 `ready`、`in-progress`、`review`、`blocked`；每个 `done` 任务都保留一条关闭快照和证据链接，不限曾经 blocked 的任务。负向关闭标明“不采用/撤回”及授权依据，未运行门禁不改为 PASS，判定以 [[task-handoff-protocol]] 为准。');
  x.replace('5. 每次最终交接必须同步本文件、`task-queue.md` 和 `compile-log.md`；若影响 Gate，再同步活动 brief/ADR/开放问题。', '5. 每次最终交接核对本文件与 `task-queue.md`，只更新变化项；`compile-log.md` 仅记录已完成里程碑。影响稳定 Gate、方法或路由才更新 brief/ADR/index/map；无新问题不修改开放问题。');
  x.afterLine('5. 每次最终交接核对', ['6. 新增的软件任务关闭快照统一放“已解除快照”区，知识维护关闭记录放“知识库维护事项”区；原有散落快照暂保留原文和锚点，不据其所在位置重判任务状态。迁移和历史缺项补录另批实施，不复制第二份快照。']);
});

edit('CUDA_coding/knowledge/meta/task-queue.md', x => {
  x.replace('`done` 可表示有证据的“不采用”，必须保留理由和原始记录。', '`done` 的正常交付、不采用和批准撤回均按 [[task-handoff-protocol]] 判定，必须保留处置、依据与未运行门禁；此处不再单独定义另一套完成语义。');
  x.afterLine('> 状态：`ready / blocked / in-progress / review / done`', ['', '> 维护规则：本页负责实时状态与排程，具体缺口见 [[task-blocker-register]]。新交接更新对应当前摘要，过程进入任务回执，不再要求 brief/index/map 逐字复制。本批保留既有历史堆叠与软件排程；用户覆盖记录格式见 [[task-handoff-protocol]]。']);
});

edit('CUDA_coding/knowledge/00-index.md', x => {
  x.replace('人、GPT/Codex 和论文写作都必须从 [[wiki/00-index]] 进入，并以其中页面为准。', '导航和论文写作从 [[wiki/00-index]] 路由；普通五对角编码先读 [[wiki/briefs/penta-active-context]]，按当前任务加载对应页面。');
  x.afterLine('`knowledge/wiki/` 是项目可复用知识', ['', '该权威性限于可复用技术知识与主张：实时状态和排程以 [[meta/task-queue]] 为准，缺口以 [[meta/task-blocker-register]] 为准，协作约束以根 AGENTS 与 [[meta/task-handoff-protocol]] 为准。顶层运行手册、代码地图和模板可作操作入口，但须链接对应规范，不维护第二套验收标准。']);
});

edit('CUDA_coding/knowledge/wiki/briefs/current-project-brief.md', x => {
  x.replace('status: reviewed', 'status: deprecated');
  x.replace('updated: 2026-08-20', 'updated: 2026-09-08');
  x.replace('# 当前项目压缩上下文', '# 项目压缩上下文（2026-08-20 历史快照）');
  x.afterLine('# 项目压缩上下文（2026-08-20 历史快照）', ['', '> 2026-09-08 标记为历史快照：以下正文保留 2026-08-20 当时的结论与推荐，不用于当前排程或验收。当前上下文见 [[penta-active-context]]，任务状态见 [[../../meta/task-queue]]，缺口见 [[../../meta/task-blocker-register]]。TASK-009 已完成，末尾“等待领取”的文字仅为历史。']);
});

edit('CUDA_coding/knowledge/wiki/00-index.md', x => {
  x.replace('普通编码默认入口：[[briefs/penta-active-context]]。完整项目管理摘要：[[briefs/current-project-brief]]。', '普通编码默认入口：[[briefs/penta-active-context]]；实时项目排程见 [[../meta/task-queue]]。历史项目摘要：[[briefs/current-project-brief|2026-08-20 项目压缩上下文快照]]。');
  x.replace('- 仍待知识页：P0 collective 专题缺陷页与 ADR-002、上游许可/发布边界。', '- 历史编译规划承接：collective 缺陷的根因、最小修复与回归映射归 [[systems/data-ownership-and-lifetime]]，不再单独新建重复缺陷页或 ADR-002；来源/贡献及发布边界归 [[reference/upstream-diff-and-contribution-boundary]]，尚缺的 NOTICE/引用最终复核继续由 TASK-002B 承担。原 compile-queue 保留历史；承接决定见 [KB-GOV-001](../outputs/validation/KB-GOV-001-20260908-maintenance-baseline/README.md)。');
});

edit('CUDA_coding/knowledge/wiki/systems/data-ownership-and-lifetime.md', x => {
  x.afterLine('`MPI_ALLTOALLV` 是阻塞式集合通信', ['',
    '### TASK-001 collective 缺陷与历史编译规划承接', '',
    '初始缺陷是在阻塞式 `MPI_ALLTOALLV` 后对未初始化的 request 数组调用 `MPI_WAITALL`；最小修复删除无效 request/等待，检查集合通信返回码，并在失败时中止，host 路径只在成功后回写 device。根因与改动边界见 [TASK-001 原始修复回执](../../outputs/queries/OUT-20260817-009-TASK-001-MPI通信生命周期修复.md)，目标构建与单 GPU np=1/2 回归见 [WSL/NVHPC 回执](../../outputs/validation/TASK-001-20260817-wsl-nvhpc24.11/README.md)，回归入口见 [[../testing/test-matrix]]。旧单 GPU 多 rank 证据不支持多 GPU 扩展，也不代替新候选验收。', '',
    '2026-09-08 知识维护决定：本节承担历史 compile-queue 中“缺陷页＋ADR-002”的根因、最小修复和回归映射需求，不再为补编号新建重复页面；历史规划原文保留。该承接不重开 TASK-001 或修改求解器。'
  ]);
});

edit('CUDA_coding/程序正确性与性能运行手册.md', x => {
  x.afterLine('2026-08-26 起，新核心源码候选', ['', '本页是命令与历史复现入口，不独立定义当前验收标准。性能设计与统计口径见 [[knowledge/wiki/performance/benchmark-protocol]]，环境知识见 [[knowledge/wiki/systems/build-and-runtime-map]]，实时任务与缺口见 [[knowledge/meta/task-queue]]、[[knowledge/meta/task-blocker-register]]。旧命令仅在其源码、CSV、运行器和环境合同匹配时复用；明确冲突的旧段应标历史或改为规范链接，不能靠页眉掩盖。']);
  x.replace('## 13. 性能判定方法', '## 13. 性能判定方法（历史摘要）');
  x.afterLine('## 13. 性能判定方法（历史摘要）', ['', '以下保留原手册摘要；当前实验必须按 [[knowledge/wiki/performance/benchmark-protocol]] 及已批准的任务合同冻结计时边界、重复口径和采用门槛。']);
  x.replace('## 18. TASK-023 直接诊断（review，未合入主源码）', '## 18. TASK-023 直接诊断（历史 review 阶段命令）');
  x.afterLine('## 18. TASK-023 直接诊断（历史 review 阶段命令）', ['', 'TASK-023 后续已按限定合同关闭；以下保留当时交接，当前状态见 [[knowledge/meta/task-queue]]，关闭范围见 [最终合同复核](knowledge/outputs/validation/TASK-023-20260827-formal-validation-v2/25-TASK-023-final-contract-review.md)。']);
});

edit('CUDA_coding/代码地图与复现指南.md', x => {
  x.afterLine('# 代码地图与复现指南', ['', '> 本页负责导航与复现入口。源码候选验收以 [[knowledge/wiki/testing/source-change-validation-sop]] 为准，当前任务与缺口以 [[knowledge/meta/task-queue]]、[[knowledge/meta/task-blocker-register]] 为准；下列局部预检与带日期的旧推荐不构成新的验收或排程规则。']);
  x.replace('| 文件/目录 | 角色 | 修改时至少运行 |', '| 文件/目录 | 角色 | 局部预检示例（不替代候选验收） |');
  x.replace('唯一下一任务推荐TASK-023（GPT-5.6 Sol / High），未启动；后续按证据选择候选，合同见', '该历史快照当时推荐TASK-023（GPT-5.6 Sol / High），不是当前下一任务；实时排程见 [[knowledge/meta/task-queue]]，历史合同见');
  x.replace('## 6. 正确性阈值', '## 6. 正确性阈值（初始规划快照）');
  x.replace('阈值需在第一周冻结，建议初始口径：', '以下是初始规划口径，不用于重新放宽门禁；当前采用 [[knowledge/wiki/testing/source-change-validation-sop]] 的数值合同与已批准任务阈值：');
});

edit('CUDA_coding/GPT主力开发执行指南.md', x => {
  x.afterLine('# GPT 主力开发执行指南', ['', '> 2026-09-08 标记：本页保留 2026-08-17 的工作流设计和提示词模板，属于旧版指南，不是当前排程、模型路由或权限依据。实际执行以根 AGENTS、[[knowledge/meta/task-handoff-protocol]] 和 [[knowledge/meta/task-queue]] 为准；本页历史首个任务与自动化设想不再生效。']);
  x.replace('## 6. 当前首个任务：TASK-002A', '## 6. 历史首个任务模板：TASK-002A');
  x.replace('## 13. Skill 的创建时机', '## 13. 历史 Skill 设想（已被现行协议取代）');
  x.afterLine('## 13. 历史 Skill 设想', ['', '现行决定见 [[knowledge/meta/task-handoff-protocol]]：使用按需 penta-knowledge-maintainer，不建立 pascal-sprint-executor。以下仅保留原设计，不作为创建或执行自动任务的指令。']);
});

edit('README.md', x => {
  x.replace('- 2026-08-26 软件优先排程：', '- 2026-08-26 软件优先排程快照（历史）：');
  x.replace('唯一下一任务推荐TASK-023诊断，未启动。', '该快照当时推荐TASK-023诊断；当前执行顺序只看下方任务队列。');
});

// Validate all preconditions before writing any existing document.
for (const [p, entry] of changes) {
  const resolved = path.resolve(p);
  if (!resolved.startsWith(root + path.sep)) throw Error('Outside repository: ' + p);
  if (!fs.readFileSync(p).equals(entry.before)) throw Error('Concurrent modification: ' + p);
}
for (const [p, entry] of changes) fs.writeFileSync(p, entry.after);
fs.writeFileSync(receipt + '/local/document-edits.json', JSON.stringify([...changes].map(([p,e]) => ({path:p,beforeSha256:sha(e.before),afterSha256:sha(e.after)})), null, 2) + '\n', {flag:'wx'});
console.log('Applied bounded document edits: ' + changes.size);
