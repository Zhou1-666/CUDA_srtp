# TASK-002A 上游冻结与逐文件审计回执

日期：2026-08-17  
状态：技术审计完成，等待导师确认贡献/署名边界

## 可复取上游版本

- 上游：<https://github.com/k-kiha/PaScaL_TDMAcuda.git>
- 冻结 HEAD：`e637d5ecab0f08308eea83fbbb1872ead7ae07c5`（2026-07-27，`update`）。
- 导入三对角快照的精确历史对象：`d69ae95209b69752504ebe3888721d759ae3020b`（2026-03-31，`fix bug`）。
- 上游公开 HEAD 的根 `LICENSE` 是 MIT，版权行是 `Copyright (c) 2025 Ki-Ha Kim`。这只说明该公开快照的许可证；本仓库的衍生文件、第三方文件和发布 NOTICE 仍由 TASK-002B 处理。

复核命令（在任意临时目录执行，不写入项目源码）：

```powershell
git clone https://github.com/k-kiha/PaScaL_TDMAcuda.git PaScaL_TDMAcuda
git -C PaScaL_TDMAcuda fetch --tags
git -C PaScaL_TDMAcuda rev-parse e637d5ecab0f08308eea83fbbb1872ead7ae07c5
git -C PaScaL_TDMAcuda show d69ae95:PaScaL_TDMA_cuda.f90 | git hash-object --stdin
git rev-parse b97f919:'CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90'
```

最后两条均应得到 `0d4ade19ba8cfdcefd7c6a1e9614b8266afd391b`。

## 逐文件归类

| 本仓库初始基线 `b97f919` 文件/范围 | 上游对照 | 归类 | 可说/不可说 |
| --- | --- | --- | --- |
| `src/PaScaL_TDMA_cuda.f90` | 与 `d69ae95:PaScaL_TDMA_cuda.f90` blob `0d4ade…` 完全相同 | 上游继承（三对角基线） | 可称“基于 PaScaL_TDMAcuda 历史版本”；不可称为本项目五对角创新 |
| `examples/ex_tdma_zdirection.f90`、根 `README.md` | 分别与 `d69ae95` blob 完全相同 | 上游继承 | 仅作兼容/回归参考 |
| `Makefile`、`Makefile.inc`、`src/Makefile`、`examples/Makefile` | 在 `d69ae95` 与冻结 HEAD 的同路径对象均不相同 | 导入前的派生/整合文件，来源待核验 | 不归为“本项目原创”；TASK-002B 前不发布为独立成果 |
| `src/PaScaL_TDMA_cuda_penta.f90` 及五对角 example、`perf_bench/*penta*`、`verify/*penta*` | 冻结 HEAD 文件树未出现 penta/hepta/band 对应实现路径 | 本项目树中的五对角扩展 | 可称“相对冻结上游新增”；初始导入前作者/时间待导师确认 |
| `b97f919..HEAD` 的五对角 API、索引检查与验证脚本 | 本仓库 Git commits `030a26f`、`e14a35f`、`ddc3be1` | 已可追溯的本项目工程增量 | 只按已验证范围陈述鲁棒性；不构成性能/新颖性结论 |

注：初始源码树是多个上游时期文件的组合，而非一次可证明的单 commit 镜像；因此报告同时冻结了“当前可复取公开 HEAD”和“三对角精确匹配的历史 commit”。

## 已可追溯的新增工程贡献

| Git commit | 文件 | 增量边界 | 证据/限制 |
| --- | --- | --- | --- |
| `030a26f` | 三/五对角 `pascal_a2av` | 删除阻塞 `MPI_ALLTOALLV` 后无效 `MPI_WAITALL`，检查返回码 | TASK-001；属于共享通信正确性修复，不是五对角算法贡献 |
| `e14a35f` | 五对角模块、Makefile、API 测试、运行脚本 | plan/API、空分区、CUDA/MPI 错误检查 | TASK-004 的 14 个 API 用例与目标环境回执；不改变消元或 28 槽布局 |
| `39a59de` | `verify/penta_comm_22_verify.js` | 22 槽独立 pack/unpack 等价验证 | 仅独立布局证据，非 Fortran 实现 |
| `ddc3be1` | 五对角模块、API 测试、索引脚本 | setup/API 层尺寸上界拒绝 | TASK-008；热循环未改为 64 位，未作性能主张 |

从 `b97f919..HEAD` 对源码根目录的总差异为 8 个文件：新增 4 个验证/测试文件，修改 4 个已有文件；总计 `888` 行新增、`65` 行删除。该统计不等价于作者贡献统计，只用于复核本项目 Git 历史。

## 论文贡献边界（待导师确认署名）

可用的保守表述：

> 本项目以冻结的 PaScaL_TDMA 三对角局部缩约—接口求解—回带框架为参考，对仓库中的五对角扩展实施独立正确性、布局与工程鲁棒性验证；五对角接口结构、28→22 映射和后续性能结论均不归因于上游三对角论文。

不得使用：

- “从零原创五对角代码”（初始导入前作者未核验）；
- “PaScaL_TDMA 已提出五对角算法”；
- “22 槽已经带来加速”（尚无 Fortran 22 槽与真实多 GPU 数据）；
- “本项目首次/最优”（TASK-013 文献检索未完成）。

## 人工停止项

导师需确认：初始五对角文件和派生构建文件的作者/署名、上游的允许衍生范围、论文中“实现”与“贡献”的署名顺序。确认前，TASK-002A 维持 `review`，TASK-002B 和公开发布/投稿保持阻塞。
