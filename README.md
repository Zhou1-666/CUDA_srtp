# CUDA SRTP：分布式五对角求解器

基于 CUDA Fortran 与 MPI 的分布式五对角线性方程求解器研究项目，围绕紧凑通信、多 GPU 验证与可复现性能优化开展 SRTP 工作。

## 当前范围

- 保留 PaScaL_TDMA 三对角上游基线，作为算法谱系、兼容性和回归参考；
- 当前活动开发对象是五对角实现：`CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`；
- TASK-001/004/005/008 已完成：MPI 最小正确性修复、五对角 API 防护、22 槽独立映射和索引上界均已有验证；
- 28→22 通信裁剪仍处于“独立映射已验证、Fortran 路径未实现”的阶段；
- 当前进入 TASK-006 前的 Gate 是：上游贡献边界（TASK-002A 技术审计已完成，署名待导师确认）、新颖性/外部基线审计、冻结 28 槽论文级 baseline；真实多 GPU 环境需提前 smoke。

项目状态、验证命令和两个月 Gate 见：

- `AGENTS.md`
- `CUDA_coding/代码地图与复现指南.md`
- `CUDA_coding/程序正确性与性能运行手册.md`
- `CUDA_coding/SRTP项目完成计划书.md`
- `CUDA_coding/knowledge/wiki/briefs/penta-active-context.md`

## 本地统一检查

在 Windows PowerShell 中，从仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1
```

该命令依次执行 L0 知识库 lint 和七项 L1 Node 独立数学验证。它不代替 NVHPC 编译、CUDA kernel、MPI、sanitizer 或真实多 GPU 测试。

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

本仓库尚未完成最终 `LICENSE`/`NOTICE` 核验。TASK-002A 的来源/贡献边界阻塞 22 槽正式研发 Gate；TASK-002B 的许可文本不阻塞内部实验，但阻塞公开发布和投稿。协作期间请勿将仓库视为可公开再分发的最终发行版。
