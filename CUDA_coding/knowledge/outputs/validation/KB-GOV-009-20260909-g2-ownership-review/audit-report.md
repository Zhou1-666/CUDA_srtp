# G2 归属与依赖审定

审定：**带归属说明的分批文档归档合理；把17份当前全文视为纯治理补丁不合理。** 理由：旧内容、治理增量与软件状态必须分账。

## 版本依据

审核输入见[原始状态](raw/input-state.json)。每份文件具有main HEAD原文、首次治理触及前原文、本次领取时原文三份字节快照；首批前恢复点的来源仍指向已由G1归档的001或003。这里“首批前”按文件首次治理批次定义，不推断原作者，也不把当时dirty内容归为009成果。

main为91ecc66，G1归档为ee6fbf8，KB-GOV-002为09a9758；008独立clone的221个blob/179份原件复验通过。17份领取时内容均与最后记录一致：14份沿用007登记，三个meta采用008关闭SHA，没有发现需要猜测归属的新变化。

两层差分均保留：`pre-existing`是HEAD→首次治理前，`post-baseline`是首次治理前→本次快照。后者对queue/blocker还包括008已记录的TASK-031 Resources软件更新，不能整体叫“纯治理”。三个meta的治理交接和软件内容分别承担原合同含义，本轮不改门禁、授权或排程。

## 17份文件的结论

以下表格由固定输入和已审阅差分生成；SHA与完整恢复点见[归属账本](ownership-ledger.json)。A可使用LF审阅补丁；B保留旧内容归属并采用带说明快照；C领取下一批时重新捕获最新文档，不用旧快照覆盖实时状态。

| ID | 文件（本次快照） | 首批前内容 | 治理增量与审定 |
| --- | --- | --- | --- |
| 01 | [AGENTS.md](raw/current/01.txt) | 既有SOP/验收与任务边界 | 删除失效P0；按事件同步、关闭处置、日志归位；B-inherited-static；[原字节差分](patches/post-baseline/01.patch) / [LF审阅补丁](patches/post-baseline-lf/01.patch) |
| 02 | [README.md](raw/current/02.txt) | 既有软件进度及TASK-010证据 | 将2026-08-26推荐明确标为历史；B-inherited-static；[原字节差分](patches/post-baseline/02.patch) / [LF审阅补丁](patches/post-baseline-lf/02.patch) |
| 03 | [CUDA_coding/knowledge/00-index.md](raw/current/03.txt) | 仅CRLF差异 | 明确Wiki、queue、blocker、协议的职责边界；A-no-preexisting-semantic-change；[原字节差分](patches/post-baseline/03.patch) / [LF审阅补丁](patches/post-baseline-lf/03.patch) |
| 04 | [CUDA_coding/knowledge/meta/README.md](raw/current/04.txt) | 既有最小维护与导航规则 | 按事件维护；补快照、状态及归档入口；B-inherited-static；[原字节差分](patches/post-baseline/04.patch) / [LF审阅补丁](patches/post-baseline-lf/04.patch) |
| 05 | [CUDA_coding/knowledge/meta/knowledge-compiler.md](raw/current/05.txt) | 既有历史compile-queue冻结规则 | 无增量不重复同步；只记里程碑；B-inherited-static；[原字节差分](patches/post-baseline/05.patch) / [LF审阅补丁](patches/post-baseline-lf/05.patch) |
| 06 | [CUDA_coding/knowledge/meta/change-impact-map.md](raw/current/06.txt) | 既有源码SOP与TASK-023–031影响映射 | 只修改实际受影响项；停止复制排程；B-inherited-static；[原字节差分](patches/post-baseline/06.patch) / [LF审阅补丁](patches/post-baseline-lf/06.patch) |
| 07 | [CUDA_coding/knowledge/meta/task-handoff-protocol.md](raw/current/07.txt) | 既有候选验收/skill与交接规则 | done处置、最短关闭快照、排程覆盖机制；B-inherited-static；[原字节差分](patches/post-baseline/07.patch) / [LF审阅补丁](patches/post-baseline-lf/07.patch) |
| 08 | [CUDA_coding/knowledge/meta/task-blocker-register.md](raw/current/08.txt) | 既有软件缺口及长TASK-031排障历史 | 005归档压缩+治理关闭；另含已登记TASK-031 Resources更新；C-rolling-meta；[原字节差分](patches/post-baseline/08.patch) / [LF审阅补丁](patches/post-baseline-lf/08.patch) |
| 09 | [CUDA_coding/knowledge/meta/task-queue.md](raw/current/09.txt) | 既有软件合同/排程与状态历史 | 004归档压缩+治理登记；另含已登记TASK-031 Resources更新；C-rolling-meta；[原字节差分](patches/post-baseline/09.patch) / [LF审阅补丁](patches/post-baseline-lf/09.patch) |
| 10 | [CUDA_coding/knowledge/meta/compile-log.md](raw/current/10.txt) | 既有大量研究里程碑及TASK-031过程 | 006归档142条过程并留22条里程碑；001–008治理里程碑；C-rolling-meta；[原字节差分](patches/post-baseline/10.patch) / [LF审阅补丁](patches/post-baseline-lf/10.patch) |
| 11 | [CUDA_coding/knowledge/wiki/00-index.md](raw/current/11.txt) | 既有研究来源/链接及多层状态段 | 001承接待办；003改为短导航并指向完整历史快照；B-inherited-static；[原字节差分](patches/post-baseline/11.patch) / [LF审阅补丁](patches/post-baseline-lf/11.patch) |
| 12 | [CUDA_coding/knowledge/wiki/briefs/current-project-brief.md](raw/current/12.txt) | 仅CRLF差异 | 旧项目brief标deprecated/历史；保留正文；A-no-preexisting-semantic-change；[原字节差分](patches/post-baseline/12.patch) / [LF审阅补丁](patches/post-baseline-lf/12.patch) |
| 13 | [CUDA_coding/knowledge/wiki/systems/data-ownership-and-lifetime.md](raw/current/13.txt) | 仅CRLF差异 | 承接TASK-001缺陷与ADR-002需求，绑定既有回执；A-no-preexisting-semantic-change；[原字节差分](patches/post-baseline/13.patch) / [LF审阅补丁](patches/post-baseline-lf/13.patch) |
| 14 | [CUDA_coding/程序正确性与性能运行手册.md](raw/current/14.txt) | 既有运行命令及TASK-010/023记录 | 职责页眉；性能摘要/旧TASK-023命令标历史；B-inherited-static；[原字节差分](patches/post-baseline/14.patch) / [LF审阅补丁](patches/post-baseline-lf/14.patch) |
| 15 | [CUDA_coding/代码地图与复现指南.md](raw/current/15.txt) | 既有代码导航、验收及TASK-010记录 | 局部预检与验收分开；旧阈值/推荐标历史；B-inherited-static；[原字节差分](patches/post-baseline/15.patch) / [LF审阅补丁](patches/post-baseline-lf/15.patch) |
| 16 | [CUDA_coding/GPT主力开发执行指南.md](raw/current/16.txt) | 仅CRLF差异 | 旧工作流、首任务及skill设想标历史；A-no-preexisting-semantic-change；[原字节差分](patches/post-baseline/16.patch) / [LF审阅补丁](patches/post-baseline-lf/16.patch) |
| 17 | [CUDA_coding/knowledge/wiki/briefs/penta-active-context.md](raw/current/17.txt) | 首次治理本页前的83KB状态/排障记录 | 003改为约4.7KB活动导航；完整历史留快照；B-inherited-static；[原字节差分](patches/post-baseline/17.patch) / [LF审阅补丁](patches/post-baseline-lf/17.patch) |

11份静态文件直接匹配001最终SHA；meta README、wiki index和active brief包含003/004的导航整理，当前SHA已在007登记并由008冻结。三个meta另有002–008治理交接；TASK-031的9月9日软件变化有008差异审核来源。所有历史原文、旧决策及失败结果保留，不补写不存在的作者、日期或GPU成功记录。

## 补丁适用性：换行与内容分开

[原字节回放](local/delta-review.json)用Git在系统临时目录逐文件完成HEAD→首次治理前→当前，34个中间/最终SHA全部一致。原字节post-baseline补丁直接面对HEAD均不适用，其中包含CRLF/LF差异，不能据此宣称17份均有内容冲突。

另在临时副本将CRLF视为LF生成[审阅补丁](local/normalized-review.json)，原始快照和原字节差分不改。17次LF回放通过；仅03、12、13、16可以直接应用到HEAD，正好对应4份“无首批前实质改动”文件。其余13份仍不适用，不能用忽略上下文或宽松patch参数强行拼回旧HEAD。机械应用成功不等于依赖或知识验收。

## 引用和命令依赖

范围为17份捕获文档中的第一层Markdown/wikilink字面引用（包括历史正文）；不递归回收冻结包，不验锚点/外网，不假定所有历史shell命令可执行。明细包含源文件行号、目标、原版本是否已引用、当前SHA与Git blob归属。

| 分类 | 引用次数 | 不重复目标数 | 审定处置 |
| --- | ---: | ---: | --- |
| G1已归档 | 58 | 12 | 绑定ee6fbf8的原字节；保留G1原谱系 |
| 本批G2选定页 | 67 | 13 | 目标也按17路径归属账本处理，不能只提交引用者 |
| base内容相同 | 39 | 29 | 标明字节相同或仅CRLF差异，不重复入库 |
| KB-GOV-002独立版本 | 6 | 4 | 保留09a9758身份；不连带合入solver/benchmark |
| 其他tracked工作区版本 | 36 | 15 | 当前字节不同于base；另核研究/规范归属，不借G2提交 |
| G3未跟踪Wiki | 24 | 7 | 来源/命令/证据在后续G3审查，本批不纳入 |
| 版本集合外目标 | 194 | 139 | 包括旧计划、回执及文件/目录；显式外部依赖，不称离线完整 |
| 实际缺失路径 | 1 | 1 | 已有错误相对链接，见下一段；无新增断链 |

目标数合计220，包含source-registry这一共同依赖；425是文档链接出现次数，不把两种计数混用。130处在首次治理前未出现的引用中没有新增缺失路径；对持续变化的meta，“新增引用”也不自动代表治理所有权。

队列[本次快照](raw/current/09.txt)第104行的TASK-002B链接写为`outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md`，实际被解析到不存在的`knowledge/meta/outputs/`。错误在HEAD已存在；正确目标是`knowledge/outputs/reviews/...`，所以后续只需改为`../outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md`。正确文件存在且是tracked的draft回执；修正路径不关闭TASK-002B或变更发布边界。本轮不修改该旧合同。

7页G3包括source-change-validation-sop、ADR-005/006、EXP-003/004、hpc-mpi-slurm-glossary及adjacent-tdma-optimization-transfer-to-penta；详见[页首与指纹](local/g3-page-boundary.json)。51处source_id引用均已在当前registry登记，但registry本身是G2之外的tracked增量；“有编号”不等于原始来源已在当前Git集合中。

另逐字节核对AGENTS中的7个最小Node入口和文档明确提及的formula audit/profile runner：6个与base相同，3个与KB-GOV-002相同，见[命令依赖](local/command-dependencies.json)。未运行这些研究/目标环境验证；旧运行器需要匹配其原合同。active brief引用的solver/benchmark也属于KB-GOV-002候选内容，不是本轮G2采用授权。

## 风险、前提与最小化

- **归属风险**：先提交13份历史基线再补治理虽可机械还原，却会在活路径短暂引入过期状态，并误导提交历史。优先保存一份带分层来源说明的当前文档快照，原字节差分用作审核证据，不倒填旧提交日期。
- **并发风险**：queue/blocker/log是活状态；下一批必须重新比对009捕获SHA与最新软件增量，逐处审查后只应用授权差异，禁止整份回滚。009自己的关闭记录也不是本次17份捕获内容的一部分。
- **依赖风险**：文档集成不等于完整知识库或软件交付。008已有25处包外wikilink缺失；不能为了让完整lint变绿而把整个outputs、七页研究Wiki或候选源码带进来。
- **前提**：G1提交可访问；每个候选路径与依赖有清单；原件及暂存blob SHA能匹配；后续只在明确的隔离分支形成归档版本。主树合并、源码采用、GPU作业和公开发布仍不是本合同动作。
- **过度工程判断**：不增加状态数据库、自动同步器或新lint架构。使用一次性三版本快照、两层差分和第一层依赖表即可；不用逐个改写旧决策或按日拆更多文档。

本任务关闭的是审定合同，不代表G2已提交或原13项建议全部完成。没有新增研究来源、主张或开放问题；index/map/brief/claim matrix保持。
