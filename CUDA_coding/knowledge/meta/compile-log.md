# 编译日志

| 日期 | 输入 | 动作 | 生成/更新 | 审核 |
| --- | --- | --- | --- | --- |
| 2026-08-17 | SRC-001..005 | 首次源码/申报书审计 | 计划、审计、ADR、EXP-000、主张矩阵 | 部分人工待导师确认 |
| 2026-08-17 | SRC-006 | 编译 Karpathy 自生长知识库方法 | raw/wiki/outputs/meta 四层结构、schema、编译与 lint 流程 | 已核对原帖可访问副本 |
| 2026-08-17 | 全部 Markdown | 迁移后 lint | 36 个文件、0 个失效 wikilink；7 个规范 Wiki 页均有 frontmatter | 自动检查通过 |
| 2026-08-17 | SRC-003..005 | 编译工程执行层 | 模块/生命周期/构建、S1–S6、布局、28→22、一般 m、索引、测试、benchmark、硬件和任务队列 | 源码静态核对；运行环境项保留未知 |
| 2026-08-17 | 全部 Markdown | 工程层迁移后 lint | 50 个文件、18 个规范 Wiki 页、0 个失效链接、0 个缺失 frontmatter | 自动检查通过 |
| 2026-08-17 | SRC-003..005 | 编制正确性/性能运行手册 | V0–V6 命令、阈值、CSV 清洗、HPC、统计和归档 | 五项 Node 复跑通过；51 个 Markdown、0 断链 |
| 2026-08-17 | SRC-003P、SRC-003T | 五对角默认上下文路由 | penta active brief、context profiles、三对角 reference-only 页、入口重排 | 57 个项目 Markdown、20 个规范 Wiki 页、0 断链、0 缺失核心 frontmatter；未删除源码和证据 |
| 2026-08-17 | SRC-002、SRC-003P、SRC-004 | 编译 PaScaL 2.1→五对角迁移边界 | 文献判定、结构/优化迁移表、证据 Gate、谱系路由和论文主张边界 | 副本哈希一致；penta 术语 0 次、tridiagonal 54 次；59 个项目 Markdown、21 个规范 Wiki 页、0 断链 |
| 2026-08-17 | SRC-003 | 建立 GitHub 私有协作基线 | 初始化 `main`、加入协作 README/.gitignore/.gitattributes、推送首个提交 | `b97f919` 已推送；许可证和上游 diff 仍为 P0 未完成项 |
| 2026-08-17 | TASK-003、全部 Markdown、SRC-003/004 | 建立统一本地检查入口 | `check_knowledge.ps1`、`check_math.ps1`、`check_all.ps1` 与 README 命令 | 61 个 Markdown、21 个 Wiki、8 个来源、0 lint 错误；5 个元数据警告；五项 Node 检查通过 |
| 2026-08-17 | 用户协作约定 | 编译单任务交接协议 | AGENTS 强制规则、meta 完整模板、执行指南和任务队列链接 | 每任务必须给复验方法、证据边界和唯一下一任务；Skill 延后到流程稳定后 |
| 2026-08-17 | TASK-001、SRC-003P、SRC-003T | 修复阻塞 collective 后的无效 request 等待 | 三/五对角源码、活动 brief、生命周期、测试矩阵、运行手册和任务回执 | 改动前后统一检查通过；静态确认 WAITALL/request 为 0；缺 NVHPC/MPI，状态 blocked，目标验证待完成 |
| 2026-08-17 | 用户确认、SRC-003T | 固化三/五对角开发边界 | AGENTS、五对角活动 brief、三对角参考页 | 三对角冻结为参考基线，仅允许共享缺陷/兼容/核验/发布回归；成果和论文以五对角为主线 |
| 2026-08-17 | TASK-001、SRC-003P、SRC-003T | WSL/NVHPC/MPI 目标环境验收 | 环境、clean/build、`np=1/2` 三/五对角日志与验证收据 | NVHPC 24.11/OpenMPI 4.1.5 构建通过；最终四项回归全为 `1.000`；TASK-001 done；单 GPU双 rank 不作为 scaling 证据 |
| 2026-08-17 | TASK-004、SRC-003P | 五对角 API、空分区和 CUDA/MPI 错误防护 | plan 合同、14 用例测试、运行手册、生命周期、测试矩阵与验证回执 | 干净构建、14/14 正反用例、`np=1/2` 示例和 profiled smoke 通过；三对角/算法/28 槽/benchmark 源码未改 |
| 2026-08-17 | TASK-005、SRC-003P、SRC-004 | 独立验证五对角 28→22 pack/unpack 映射 | 新 JS、EXP-001、测试矩阵、主张矩阵、运行手册与验证回执 | 180 组、403,200 次逐槽检查、28/28 故障注入通过；只支持布局结论，Fortran/性能仍未实现 |
| 2026-08-17 | TASK-008、SRC-003P | 五对角索引和尺寸上界预检 | setup/API 层 int64 预检、新 JS、16 用例、EXP-002、索引合同、测试矩阵与验证回执 | 15 个精确边界、10,000 个随机配置、NVHPC 干净构建、16/16 API、`np=1/2` 和 smoke 通过；热循环仍为 32 位，无性能主张 |
| 2026-08-17 | 用户红队复核、当前 task queue 与验证回执 | TASK-012：重构计划 Gate 并修正当前入口漂移 | 计划 v4、ADR-003、002A/002B、TASK-013..021、README、代码地图、GPT 指南、两个 brief、index、开放问题和 claim Gate | 保留技术审计为历史快照；TASK-006 改为 blocked；内部研发与公开许可 Gate 分离；未改 Fortran/实验数据 |
| 2026-08-17 | SRC-007、SRC-003/003P/003T、Git 历史 | TASK-002A：冻结上游、逐文件差异与贡献边界 | 上游冻结/审计回执、参考页、来源账本、任务状态、开放问题和主张矩阵 | 上游 HEAD `e637d5e` 可复取，三对角初始 blob 精确匹配 `d69ae95`；初始五对角作者/署名待导师确认，任务为 review；未改代码/benchmark |
| 2026-08-17 | SRC-002/004、SRC-008..016、PaScaL 参考文献与独立关键词检索 | TASK-013：新颖性和外部 comparator 审计 | 检索回执、参考页、ADR-004、来源账本、claim/benchmark Gate、任务状态和开放问题 | 一般 m 缩约降级；28→22 为限定布局候选；P=1 cuSPARSE 必选、ScaLAPACK 条件式；无同构公开多 GPU comparator；待非原推导者签字，未改代码/benchmark |
| 2026-08-17 | 当前任务状态、Gate 与已有回执 | 补齐未完成任务的执行缺口 | task queue 的缺口/完成判据/首个动作表，五对角活动 brief 路由 | 未改变任何任务状态、算法或代码；`review`/`blocked` 均保留其人工或环境前置条件 |
| 2026-08-17 | 用户的持续交接要求、当前任务/Gate | 建立持续更新的任务缺口与阻塞台账 | `meta/task-blocker-register.md`、AGENTS、交接协议、任务队列与活动 brief | 所有非 done 任务已登记具体缺口、责任方、解除证据和最小动作；后续交接强制同步台账；未改代码/状态 |
| 2026-08-19 | TASK-014、当前 SHA、Windows/WSL 探测 | 冻结 28 槽基线执行器并登记目标环境阻塞 | `verify/run_task_014_baseline.sh`、TASK-014 本机预检回执、运行手册、Gate/台账/开放问题 | SHA `2b7cb1a`；七项独立检查通过；Windows 识别 RTX 4060 8 GiB；WSL `E_ACCESSDENIED`，无目标环境重建/计时且无 cuSPARSE adapter；任务 blocked，未改 Fortran/benchmark |
| 2026-08-19 | TASK-014、用户 WSL/NVHPC 回执 | 解除环境阻塞并完成 debug 重建 | TASK-014 回执、任务状态/台账/活动 brief、Q-018 | WSL/GPU/NVHPC 24.11/OpenMPI 4 可用；系统 mpif90 指向 gfortran，改用 NVHPC mpifort；`make veryclean && make FC=mpifort OPT="-O0 -g"` 退出 0，生成 3.2 MiB `benchmark_penta`；正确性/性能未运行 |
| 2026-08-19 | TASK-014、用户目标环境输出 | 完成首个单进程常数精确解回归 | TASK-014 回执与阻塞台账 | `np=1`、`64×64×1024`、debug、exact1 退出 0；exp RMS `1.7470e-13`、Linf `2.8821e-13`、cross `0`；仍缺制造解、双进程、release/计时与 cuSPARSE |
| 2026-08-19 | TASK-014、用户目标环境输出 | 完成单进程制造解回归 | TASK-014 回执与阻塞台账 | `np=1`、`64×64×1024`、debug、manufactured 退出 0；exp RMS `2.6010e-13`、Linf `3.8480e-13`、cross `0`；仍缺双进程、release/计时与 cuSPARSE |
| 2026-08-19 | TASK-014、用户目标环境输出 | 完成双进程常数精确解回归 | TASK-014 回执与阻塞台账 | `np=2`、`64×64×1024`、debug、exact1 退出 0；exp RMS `2.3136e-13`、Linf `3.1042e-13`、cross `2.9821e-13`；单 GPU 共享进程仅作通信正确性证据 |
| 2026-08-19 | TASK-014、用户目标环境输出 | 完成双进程制造解回归并关闭 debug 正确性阶段 | TASK-014 回执与阻塞台账 | `np=2`、`64×64×1024`、debug、manufactured 退出 0；exp RMS `1.3418e-13`、Linf `1.9595e-13`、cross `2.9154e-13`；debug 四组正确性均通过，待 release/五次计时与 cuSPARSE |
| 2026-08-19 | TASK-014、用户目标环境输出 | 完成 release 重建 | TASK-014 回执与阻塞台账 | `make veryclean && make FC=mpifort OPT="-O3"` 退出 0；将以 `np=1, 64×64×1024, manufactured, FP64, 128/128 threads` 执行预热和五次正式计时 |
| 2026-08-19 | TASK-014、用户目标环境输出 | 完成 release 预热 | TASK-014 回执与阻塞台账 | 同一 release/manufactured/np=1 配置的两次预热均 exit 0；不计入性能统计，待五次独立正式样本 |
| 2026-08-19 | TASK-014、用户目标环境输出 | 记录第 1 次正式 release 样本 | TASK-014 回执与阻塞台账 | `np=1`、`64×64×1024`、manufactured、10 iterations、FP64、128/128 threads，exit 0；exp `3.6559e-03 s`、RMS `6.0064e-14`、Linf `1.1657e-13`、cross `0`；待第 2--5 次和统计 |
| 2026-08-19 | TASK-014、用户目标环境输出 | 冻结五次内部 release 基线统计 | TASK-014 回执与阻塞台账 | 五次 exp 时间 `3.6559/3.5809/3.5069/3.6474/3.7401 ms`，中位数 `3.6474 ms`、均值 `3.62624 ms`、CV `2.41%`；均通过误差 Gate；仅单 GPU/np=1 内部基线，待环境元数据和 cuSPARSE 外部 baseline |
| 2026-08-19 | TASK-014、用户目标环境回执 | 补齐运行时环境标识 | TASK-014 回执与阻塞台账 | `git rev-parse HEAD=c12afa99d1ac8ae6851e5a06309edff822a7b214`（样本后回执，不伪称 build-time SHA）；Open MPI `4.1.5`；RTX 4060 Laptop UUID `GPU-44881249-c7bc-01a6-688c-946e2e0d760a`、driver `560.94`、`8188 MiB`；仅剩 P=1 cuSPARSE 外部 baseline |
| 2026-08-19 | TASK-022、任务分解 | 将 TASK-014 的外部 comparator 缺口固化为独立任务 | task queue、阻塞台账、活动 brief、影响地图 | 状态 `ready`；仅允许隔离 cuSPARSE adapter/API 可行性核验，禁止修改既有 28 槽 Fortran 或 benchmark；主执行与独立审查均为 GPT-5.6-sol/high，API/数值歧义才升级 xhigh |
| 2026-08-19 | TASK-022、SRC-014、CUDA 12.6 | 新增并预验隔离 cuSPARSE P=1 adapter | `cusparse_penta_baseline.cu`、`Makefile.cusparse`、`run_task_022_cusparse.sh`、任务台账 | 首次链接参数与首次 runtime 分别暴露 `-Wl` 转发和 `libnvJitLink.so.12` 路径问题，均已修复；NVHPC `nvcc` 构建成功；`64×64×1024` exact1/manufactured 的 Linf 为 `1.1107e-11`/`1.0436e-11`、残差约 `2.8e-15`，均通过 `1e-10`；待提交 SHA 上五次正式计时 |
| 2026-08-19 | TASK-022、独立 GPT-5.6-sol/high 审查 | 否决首组 cuSPARSE 性能比较口径并保留原始证据 | 首组 TASK-022 回执、运行脚本、阻塞台账 | API/正确性条件通过；性能暂不通过：每个正式进程内排除 2 次 warmup，与 TASK-014 的“2 次独立预热＋5 次无进程内排除的正式启动”不一致，且 CV 偏高；脚本改为完全相同预热口径后重跑 |
| 2026-08-19 | TASK-022 SHA `f868ea9`、公平重跑、独立 GPT-5.6-sol/high 复审 | 冻结 P=1 cuSPARSE 外部锚点并关闭 TASK-014/TASK-022 | 公平回执、最终独立审查、任务队列/阻塞快照、TASK-014 回执、测试矩阵、运行手册和论文主张矩阵 | exact1/manufactured 均过 `1e-10`；2 次独立预热＋5 次 `warmups=0` 正式启动；solver-only 中位数 `6.6865 ms`、IQR `1.2181 ms`、CV `10.68%`；独立复审 PASS；只允许与 TASK-014 `3.6474 ms` 做固定单 GPU配置的受限 solver-window 比较 |

每次编译必须留下记录。大规模重构还要写清旧路径兼容方式和被弃用页面。
