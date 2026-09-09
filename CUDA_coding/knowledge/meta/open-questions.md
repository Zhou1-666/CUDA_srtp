# 开放问题

SRC-029来源恢复和后续候选优化问题仍归[[task-blocker-register]]的TASK-033条目；本页不把只读预审或尚未采用的源码候选提升为已验证性能主张。原预审问题段保留于B批修订前逐字节归档，未删除其任务原件。

2026-08-26 知识维护 skill 增量：本轮未新增或关闭科研问题，既有状态不据模拟测试改变。skill 本机安装与验证、宿主发现的人工试用边界见 [[../outputs/validation/KB-SKILL-001-20260826-penta-knowledge-maintainer/README]]。

| ID | 问题 | 为什么重要 | 所需证据 | 状态 |
| --- | --- | --- | --- | --- |
| Q-001 | P0 collective 应删除 WAITALL 还是改真实非阻塞通信？ | 决定最小正确修复和后续重叠路线 | TASK-001 已采用最小阻塞式修复并完成目标环境回归 | 已关闭；overlap 转 TASK-020/021 |
| Q-002 | 初始五对角和派生构建文件的作者/署名边界是什么？ | 许可、署名、论文贡献 | TASK-002A 技术审计与2026-08-20导师确认已归档；发布文本仍归002B | 已关闭来源项；TASK-002B review |
| Q-003 | 22 槽映射对四条边界方程分别保留什么？ | 核心实现与论文 | TASK-005 公式/独立脚本；TASK-006 Fortran L2–L4 | 已关闭；动态安全转 TASK-016，性能转 TASK-009 |
| Q-004 | 28→22 在真实多 GPU 上降低多少通信与 total？ | 核心性能主张 | TASK-009 P≤4 显示结果依模式/规模变化；P8 四组中 22 槽 rank-MAX total 中位数比 28 槽低 `14.10%–16.90%`，但无 MPI 字节计数器且强制 TCP | 已关闭实验矩阵；仅保留配置级结论，禁止普遍化 |
| Q-005 | 最小Poisson/Helmholtz demo采用什么离散和边界？ | 与申报书对齐 | ADR-007已冻结四阶五点、Dirichlet与制造解幽灵点；SRC-024的32例与完整证据审查通过 | 已关闭；TASK-010 done，限冻结demo |
| Q-006 | 一般 `m` 结论的创新性边界是什么？ | 论文措辞 | TASK-013 已确认一般带宽接口缩约有先例；TASK-019 模型审阅和周一涵 2026-08-24 `accept` 支持精确固定布局计数，仍待投稿前更新检索 | 部分完成；C2 数学已审阅但创新性降级，C3 保持候选贡献 |
| Q-007 | 上游基线 commit 是什么？ | 版本、许可、实验追溯 | 上游 HEAD `e637d5e` 已冻结；三对角精确导入对象为历史 `d69ae95`；本仓库初始基线为 `b97f919` | 已关闭；复合导入树已明确记录 |
| Q-008 | 实验室 A800 集群的实际 NVHPC/MPI/CUDA-aware 环境是什么？ | 真实多 GPU 开发 | `check_env.sh`、拓扑、rank→GPU UUID 和 np=2 smoke | 开放；TASK-017 |
| Q-009 | 是否存在可接入的 CFD/FFT 主程序？ | 申报书范围对齐 | ADR-007 已选择独立 demo，宿主未提供 | 不阻塞TASK-010；未声称完整CFD/FFT |
| Q-010 | 三个既有 Wiki 页缺少 5 项 `confidence/source_ids` 扩展元数据 | 完整符合 wiki schema | 页面来源复核后补齐字段 | 开放 |
| Q-011 | 是否存在问题、精度和硬件均可公平比较的外部五对角实现？ | 避免仓库内自比形成虚假优势 | TASK-022 已完成 P=1 cuSPARSE QR 固定配置锚点；ScaLAPACK 条件式；Pentadsolver 是高度相邻多 GPU方法先例，但公开代码与同输入复现性尚未确认；多 GPU仍使用配对消融并披露差异 | P=1 与 TASK-013 已关闭；Pentadsolver 可获取性和投稿前更新检索仍开放 |
| Q-012 | 零/近零主元、弱占优、尺度跨度和近奇异系统应返回什么？ | 数值适用域和失败可诊断性 | TASK-015 已冻结六类矩阵、`64ε` 相对阈值、误差 Gate 和失败码 `4` | 已关闭；任意病态系统或 pivoting 需另立任务 |
| Q-013 | 目标 NVHPC/MPI 环境能否运行 Compute Sanitizer？ | 22 槽 pack/unpack 越界风险 | TASK-016 在 WSL/NVHPC 24.11 下的 28/22 memcheck/initcheck 均为两 rank 0 errors | 已关闭；OpenMPI 检查器运行固定使用 `ob1/pt2pt` 避免 UCX context 前探测 |
| Q-014 | 28/22 路径在目标 GPU 上的安全容量是多少？ | 整数合法不等于显存可分配 | 每线字节模型、显存预算和 OOM 行为 | 开放；TASK-018 |
| Q-015 | MPI 占比和可重叠工作是否值得实现 overlap？ | 防止无收益复杂化 | TASK-020 模型得到 MPI-only 中位占比 `51.5085%`、保守收益中位数 `10.8458%`，但仅 3/5 作业达到单作业 `10%`，未过 4/5 稳定性 Gate | 当前配置已关闭：暂不实施；按 ADR-006 重开条件复验 |
| Q-018 | 当前设备何时恢复可用 WSL/NVHPC/MPI 目标环境？ | TASK-014 无法重建/计时，后续 CUDA Fortran 任务均不能验收 | WSL、GPU、NVHPC 24.11/OpenMPI 4 已恢复；TASK-014 debug/release 与 TASK-022 cuSPARSE 运行回执均完成 | 已关闭；真实多 GPU另见 TASK-017 |
| Q-016 | 当前入口文档是否仍把已完成任务写成阻断项？ | 防止重复领取旧任务 | README/计划/代码地图与 task-queue 交叉检查 | 已关闭；TASK-012 |
| Q-017 | 机构数据库是否出现新的 PaScaL 2.1 五对角前向工作或 28→22 同构先例？ | 新论文增长会改变新颖性措辞 | 投稿前导出 Scopus/Web of Science/OpenAlex 更新检索并由非原推导者签字 | 开放；TASK-013 人工复核/投稿前复查 |
| Q-019 | 相邻 TDMA 的 workspace、交错布局、系数预处理、RHS fusion 和 batch autotuning 中，哪些在五对角上有可测收益？ | 避免把三对角优化机械迁移到更高寄存器/接口压力的五对角 | SRC-019..021 迁移矩阵；本项目 bytes/line、register/spill/occupancy、阶段 profile、同输入绝对计时和独立正确性 | 开放；仅形成候选，不自动领取实现任务 |
| Q-020 | 前后向通信中多少是MPI、搬运或rank等待，计时同步增加了多少成本？ | 决定优先优化对象 | job1457454完整包已本地复算：P2稳定8轮中22槽相对28槽的forward D2H/MPI(含等待)/H2D阶段中位数变化为`-20.43%/-38.41%/-20.65%`，local compute约`+0.00%`；P2 profiled扰动波动大，MPI时长不能拆成纯网络或独立rank等待 | TASK-023范围内已关闭；只支持配置级定位，不外推因果 |
| Q-021 | 用户态可用通信路径或锁页内存能否降低完整求解时间？ | 不把CUDA-aware等同RDMA，不以copy变快代替总时间 | TASK-025已否定per-call pinned；TASK-007 persistent候选虽过API/pressure，但node-local ext4 TMPDIR下sanitizer仍无法attach、L6为`NOT-RUN/环境限制`。全库无具体预指定替代环境，候选已按硬停止规则`do-not-adopt/withdraw`。该负结果不证明所有persistent实现均无收益，也不支持继续新增性能候选 | 已按当前项目时限关闭探索；TASK-007 done/withdraw，转TASK-031，不再开启024等新性能候选 |
| Q-022 | 实际软件是否重复使用固定LHS，何时能摊薄预处理？ | 决定是否应增加缓存/API复杂度 | TASK-026 真实调用K、失效条件、数学依赖、内存和总成本；通过才实施027 | 开放；条件式，不泛化到所有输入 |
| Q-023 | pack启动、消元kernel、主元检查分别是否值得优化？ | 小热点可能被通信掩盖，安全语义不能牺牲 | 023仅见packing约0.19 ms、local compute在28/22间不变且未分离主元状态成本；重开需TASK-028/029/030各自独立证据 | 暂无实施依据；三项保持blocked，不要求全做 |
| Q-024 | SRC-029中哪些可单独迁移的资源所有权/通信/计算差异能让同节点P2和P4稳定快于P1？ | 当前P8强扩展仅`0.389x–0.457x`，若多GPU不快于P1就不能形成性能版或论文加速主张 | TASK-033逐函数diff；随后冻结至少两个P1可运行的强扩展workload和rank-MAX口径；单变量候选各做10对AB/BA，要求P2/P4各`>=1.05x`且至少8/10胜出；正确性/SOP先通过 | 开放；TASK-031后先TASK-033，未授权提前实现 |

## 2026-08-26 TASK-010 关闭增量

本次未新增科研问题；Q-005由设计关闭推进到完整实现/目标证据关闭。三项工程范围风险（rank环境不一致的条件collective、runner原始表头、有限负指标）保留于 [最终审查](../outputs/validation/TASK-010-20260826-paraai-a100-job1454628/local/final-implementation-review.md)，在扩展调用合同时处理；本轮不修代码、不启动新任务。Q-009的完整CFD/FFT宿主仍未知，但不是本demo前置。

## 2026-08-26 TASK-032 规划增量

本次无新增科研问题。后期release的首个版本号、支持平台及交付对象在TASK-031后、TASK-032执行前确认；不是现在的阻断输入。已明确“精简包不携带实验资料，但研究仓库保留原件”，见 [计划](../outputs/plans/TASK-032-20260826-minimal-software-release.md)；内部打包不等于公开源码授权。

## 2026-08-26 源码验证 SOP 工程缺口

本次无新增科研结论。[[../wiki/testing/source-change-validation-sop]] 已规定候选版本验收；尚未实现全自动跨环境流水线。当前 `penta_indep_check.js` 数值失败不设置非零退出码、TASK-014 旧 CSV 解析、目标 runner 固定 MPI 参数及日志严格性、TASK-010 harness 集成位置等限制须在采用前补审计或另行修工具。现阶段必须人工核对数值/用例/绑定，不能只取统一 PASS；缺口及责任方见 [[task-blocker-register]] 的 KB-SOP-001。软件任务状态不因文档交付改变。
