# CUDA SRTP：分布式五对角求解器

基于 CUDA Fortran 与 MPI 的分布式五对角线性方程求解器研究项目，围绕紧凑通信、多 GPU 验证与可复现性能优化开展 SRTP 工作。

## 当前范围

- 保留 PaScaL_TDMA 三对角上游基线，作为算法谱系、兼容性和回归参考；
- 当前活动开发对象是五对角实现：`CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`；
- TASK-001/004/005/008 已完成：MPI 最小正确性修复、五对角 API 防护、22 槽独立映射和索引上界均已有验证；
- TASK-006 已在 `faffee3` 实现默认兼容的 28/22 可切换 Fortran 前向路径，并完成 NVHPC API 18/18、profiled 20/20、普通入口 2/2 与 TASK-016 动态/生命周期 Gate；
- TASK-014 的 28 槽基线和 TASK-022 的同 GPU cuSPARSE QR 外部锚点已冻结。TASK-016 的 28/22 各 100 次生命周期与 memcheck/initcheck 已通过；TASK-006/016 均为 `done`，但仍不能据此宣称 22 槽更快。

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

三对角基线可追溯到 PaScaL_TDMAcuda；初始五对角实现由李洋在苏运德导师指导的团队三对角基线基础上借助 AI 工具扩展形成，不得表述为后续执行者的独立原创。来源和贡献边界见 [TASK-002A 审计回执](CUDA_coding/knowledge/outputs/reviews/TASK-002A-20260817-upstream-audit.md)。

TASK-002B 的私有范围 NOTICE 与引用清单已形成草案，仍须导师/权利人复核；在此之前不得改变仓库私有状态或创建面向公开发布的 `LICENSE`。
