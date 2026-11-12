# CUDA SRTP：分布式五对角求解器

基于 CUDA Fortran 与 MPI 的分布式五对角线性方程求解器研究项目，围绕紧凑通信、多 GPU 验证与可复现性能优化开展 SRTP 工作。

## 研究进展（截至 2026-11-01）

- **正确性验证**：Poisson 和 Helmholtz 独立示例的 32 组双精度制造解用例全部通过。测试条件与覆盖范围见[验证记录](CUDA_coding/knowledge/outputs/validation/TASK-010-20260826-paraai-a100-job1454628/README.md)。
- **性能评估**：整理了 28 槽和 22 槽通信布局的对照结果，分别记录完整求解耗时和包含数据恢复的批次耗时。不同运行分配下的收益复现与长尾延迟原因仍待验证。
- **跨节点与基准对照**：跨节点通信烟测和参考求解器对照已完成本地准备与检查。目标环境运行及同条件性能对照仍待完成。

## 当前范围

- 保留 PaScaL_TDMA 三对角上游基线，作为算法谱系、兼容性和回归参考；
- 当前活动开发对象是五对角实现：`CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`；
- TASK-001/004/005/008 已完成：MPI 最小正确性修复、五对角 API 防护、22 槽独立映射和索引上界均已有验证；
- TASK-006 已在 `faffee3` 实现默认兼容的 28/22 可切换 Fortran 前向路径，并完成 NVHPC API 18/18、profiled 20/20、普通入口 2/2 与 TASK-016 动态/生命周期 Gate；
- TASK-014 的 28 槽基线和 TASK-022 的同 GPU cuSPARSE QR 外部锚点已冻结。TASK-016 的 28/22 各 100 次生命周期与 memcheck/initcheck 已通过；TASK-006/016 均为 `done`，但仍不能据此宣称 22 槽更快。
- 2026-08-26 软件优先排程快照（历史）：TASK-009已完成真实1/2/4/8 GPU实验，扩展效率低及P8的22槽限定收益保持；TASK-007/020以不实施关闭。TASK-010独立demo完整32例证据、源码/构建与最终审查已验收，见[永久回执](CUDA_coding/knowledge/outputs/validation/TASK-010-20260826-paraai-a100-job1454628/README.md)。该快照当时推荐TASK-023诊断；当前执行顺序只看下方任务队列。
- 当前任务状态与模型/推理强度以 [任务队列](CUDA_coding/knowledge/meta/task-queue.md) 和 [软件优先执行流程](CUDA_coding/knowledge/outputs/plans/20260826-software-first-performance-roadmap.md) 为准；投稿检索与公开范围支线不阻塞私有软件开发，排程不授权公开发布。

项目状态、验证命令和两个月 Gate 见：

- `AGENTS.md`
- `CUDA_coding/代码地图与复现指南.md`
- `CUDA_coding/程序正确性与性能运行手册.md`
- `CUDA_coding/SRTP项目完成计划书.md`
- `CUDA_coding/knowledge/wiki/briefs/penta-active-context.md`

## Obsidian 协作边界

建议将本仓库根目录 `D:\CUDA\CUDA_repository` 作为唯一 Obsidian vault 根目录。`.obsidian/` 是每位成员的本机界面配置，已被 Git 忽略；不要将其提交，也不要把 `CUDA_coding/` 再作为嵌套 vault。

## 本地统一检查

在 Windows PowerShell 中，从仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1
```

该命令依次执行 L0 知识库 lint、七项 L1 Node 独立数学验证和一个不分配 GPU 的容量模型自检。它不代替 NVHPC 编译、CUDA kernel、MPI、sanitizer 或真实多 GPU 测试。

## 仓库内容

- `CUDA_coding/CUDA_code/源代码/`：CUDA Fortran/MPI 源码、示例、独立验证、benchmark 与 HPC 脚本；
- `CUDA_coding/knowledge/`：项目知识库、任务队列、证据矩阵和实验记录；
- `CUDA_coding/*.md`：计划、开发指南、代码地图和运行说明。

## 团队协作

1. 从 `main` 创建一个任务分支，例如 `feature/p0-mpi-fix`；
2. 一次只完成一个任务队列项，并在 PR 中附上运行命令、结果和未覆盖风险；
3. 数值正确性与性能结论必须有独立验证、目标环境构建或实验记录支持；
4. 代码合并前至少由另一名成员审查高风险 MPI/CUDA/数学改动。

## 不纳入版本库的内容

`.gitignore` 会排除构建产物、可执行文件、机器本地环境日志、密钥、临时目录和第三方论文 PDF。项目只保存论文 DOI、来源登记和可追溯哈希；不把个人申报材料或凭据纳入协作仓库。

## 许可与来源

本仓库仅用于**私有研发与协作**，不授予公开复制、修改、再分发或公开源码的许可；完整边界见根目录 [NOTICE](NOTICE)。论文可在准确说明来源、贡献边界与参考文献的前提下公开，但论文公开不等于源码公开。

三对角基线可追溯到 PaScaL_TDMAcuda；初始五对角扩展由李洋和周一涵在团队 PaScaL_TDMA 三对角基线基础上修改、扩展形成，不得表述为两人创立了上游 PaScaL_TDMA 项目，也不得表述为后续执行者的独立原创。2026-08-20 导师原始确认与 2026-08-27 用户署名补充分别保留在 [TASK-002A 审计回执](CUDA_coding/knowledge/outputs/reviews/TASK-002A-20260817-upstream-audit.md)和[署名补充记录](CUDA_coding/knowledge/outputs/reviews/TASK-002A-20260827-attribution-amendment.md)。

TASK-002B 的私有范围 NOTICE 与引用清单已形成草案，仍须导师/权利人复核；在此之前不得改变仓库私有状态或创建面向公开发布的 `LICENSE`。
