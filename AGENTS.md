# PaScaL 带状求解器项目协作规则

## 项目定位

- 本仓库的研究核心是 CUDA Fortran + MPI 的分布式带状线性方程求解器，不是完整 CFD 流场软件。
- 上游基线是 PaScaL_TDMA 2.1 三对角求解器；本项目当前实现五对角扩展，并验证一般半带宽 `m` 的缩约结构。
- 两个月主线见 `CUDA_coding/SRTP项目完成计划书.md`，代码入口见 `CUDA_coding/代码地图与复现指南.md`。

## 默认活动范围：五对角

- 普通开发默认只处理 `src/PaScaL_TDMA_cuda_penta.f90` 及其示例、验证和 benchmark。
- 最小上下文依次为：本文件、`knowledge/wiki/briefs/penta-active-context.md`、`knowledge/meta/task-queue.md` 的一个任务、一张任务专属页面、目标函数片段和对应测试。
- 先用 `rg` 定位符号和调用点，不默认读取整个 Fortran 文件、完整计划、全量 Wiki 或论文 PDF。
- 三对角论文和源码必须保留。算法推广、优化设计或论文写作先读 `knowledge/wiki/reference/pascal-tdma-2.1-to-penta-transfer.md`；三对角源码仅在共享缺陷差分、API/构建兼容、上游行为或发布回归时读取。
- 三对角程序冻结为参考基线，默认不得对其开展新功能、性能优化或独立研究；只有共享缺陷修复、构建/API 兼容、上游行为核验和发布回归可以修改。研究实现、性能数据和论文贡献均以五对角为主线。
- 仓库中保留但未读取的文件不占用当前模型上下文；不要为节省 token 删除可追溯证据。

## 每次改动前

1. 先读五对角活动 brief 和当前任务；只按路由加载相关 ADR、公式卡或实验卡。
2. 写清单一目标、允许修改文件、数值约束、验证命令和停止条件。
3. 数值算法修改、结构重构、性能优化不得混在同一任务中。
4. 未经实测，不得宣称更快；没有独立真值，不得宣称正确。

## 知识库自生长规则

- 普通编码先读 `CUDA_coding/knowledge/wiki/briefs/penta-active-context.md`；只有导航或维护知识库时才从全局 index 开始。
- 按 `CUDA_coding/knowledge/meta/context-routing.md` 加载最小证据包，不全库灌入上下文。
- 编码前从 `CUDA_coding/knowledge/meta/task-queue.md` 领取一个 `ready` 任务，并检查 `change-impact-map.md`。
- 原始资料只进入 `knowledge/raw/` 或 `raw/source-registry.md`，LLM 不得修改原件。
- 一次问答、报告或图表先进入 `knowledge/outputs/`；只有形成可复用增量并有来源时才编译回 Wiki。
- Wiki 新页必须有 `status`、`confidence` 和 `source_ids`；AI 创建页默认 `draft`，不能自动标为 `verified`。
- 每次编译更新 index/map、compile log 和开放问题；缺失数据不得静默猜测，矛盾必须保留双方证据。

## 必守技术约束

- 五对角 API 现已拒绝 `Nrow < 5`、`Nsys <= 0`、`Nsys < nprocs`、非法线程数和 communicator/rank/size 不一致；测试必须保留这些失败用例。
- 五对角 plan/solver 现用 64 位临时量预检工作区、`Nsys*Nrow`、MPI count/displacement 和缩约列宽；超过默认 32 位整数上限必须在分配或 kernel 启动前拒绝。
- CUDA 热循环仍使用 32 位索引，当前不支持超过 `2^31-1` 的扁平元素偏移；不得为扩大范围而无差别改成 64 位，确需支持时另立双路径任务并测性能。
- `RHS` 和部分系数数组会被原位覆盖；新增调用方必须明确所有权与生命周期。
- 性能结果必须注明硬件、驱动、NVHPC、MPI、CUDA-aware 状态、精度、问题规模、rank/GPU 映射和重复次数。
- 单 GPU 多 rank 结果不能作为多 GPU 强/弱扩展证据。

## 当前 P0 阻断项

- 根 README 的许可证仍为 `To be defined`，但上游论文说明原项目为 MIT。发布或投稿前必须补齐来源、版权和衍生代码许可说明。
- `perf_bench/REPORT.md` 的“28→约18”与已验证理论不一致；当前可支持的是 `28→22`。

## 最小验证

在仅做理论/JavaScript 验证时，从源码根目录运行：

```powershell
node verify/penta_indep_check.js
node verify/penta_comm_28_verify.js
node verify/penta_comm_22_verify.js
node verify/penta_index_bounds_verify.js
node verify/hepta_indep_check.js
node verify/mband_general.js
node verify/mband_recurrence.js
```

CUDA Fortran 改动还必须在 Linux/WSL/HPC 的 NVHPC + MPI 环境完成干净构建、示例、精度回归和相关 benchmark。当前 Windows PowerShell 环境没有可用的 `nvfortran/mpif90/make`，不能用已有 `.o/.mod/a.out` 代替重建验证。

## 完成定义

- 相关独立正确性检查通过；
- CUDA/MPI 改动已在目标环境干净重建；
- 性能改动有相同输入和精度下的多次绝对计时；
- 更新对应 ADR/实验卡和 `knowledge/wiki/paper/claim-evidence-matrix.md`；
- 明确未覆盖的规模、硬件和风险。

## 每个任务的完成交接

- 每次只完成一个任务；未满足完成定义时不得标为 `done`，应保留为 `review`、`blocked` 或 `in-progress`。
- 任务结束必须报告：完成结果、修改文件、已执行验证及结果、未覆盖范围。
- 必须给出用户可复制运行的“人工复验命令”、预期通过现象和失败时应保存的输出。
- 必须从任务队列推荐唯一的下一任务，并写明依赖、推荐模型和推理强度；不得悄悄开始下一任务。
- 稳定验证方法写入运行手册/测试矩阵；单次运行证据写入 `knowledge/outputs/` 或实验卡。
- 完整格式见 `CUDA_coding/knowledge/meta/task-handoff-protocol.md`。
