# TASK-010：Poisson/Helmholtz 制造解完整证据验收

日期：2026-08-26。状态：**done（冻结 demo 范围）**。执行复核：本次 Codex 主执行人；独立实现审查：`/root/task010_final_review`。完整归档来源登记为 **SRC-024**。不是合并、提交、公开发布或后续实验授权。

## 结果与证据

作业 `1454628` 在 `paraai-n32-h-01-agent-8` 上于 2026-08-26 15:20:49–15:23:45 完成，`COMPLETED 0:0`，176 秒。审查了完整 [sacct](raw/sacct.txt)、[job.log](raw/job.log)、[stdout](raw/task010-1454628.out)、[空 stderr](raw/task010-1454628.err)，不是只消费先前的 tail 摘录。SSH 由用户执行，本轮未连接 SSH、重跑 GPU 或申请资源。

| 验收项 | 本地核验结果 | 证据 |
| --- | --- | --- |
| 压缩包 | 43,564 字节；SHA-256 `9bc515c598d30e212f8789f1018e55fb381390c703389ba027cd3dec359cf8bf` 与远端回贴一致 | [原包副本](archive/TASK-010-1454628-evidence-gq9ZN9dE.tar.gz) |
| 解包安全 | 校验 tar header、相对路径、Windows 路径规则、重复成员；仅普通文件/目录；新建专用目录、独占写入 | [检查记录](local/archive-inspection.json) |
| 完整性 | 56/56 原始清单文件匹配，无多余 raw/source 文件；11/11 源码/构建文件匹配 | [包清单](SHA256SUMS.txt)、[源码清单](raw/SOURCE_SHA256SUMS.txt) |
| 原始用例 | 32 个独立日志；各含准确表头和单行结果，逐项等于 cases.csv；所有指标有限且非负 | [cases.csv](raw/cases.csv)、[只读复验](local/verify-receipt.js) |
| 数值重算 | 32/32 通过，8 个分组；本地 CLI 生成 summary 与远端字节一致 | [原始 summary](raw/summary.csv)、[重算 summary](local/recomputed-summary.csv)、[audit 输出](local/full-cases-audit.log) |
| 观测阶 | 64→128、128→256 的 L2/Linf 共 32 个阶数，最低 `3.9905817759652016 >= 3.8` | 同上 |
| 缩放残差 | 全部用例最大 `4.3520742565306136e-14 <= 1e-10` | 同上 |
| 干净构建 | clean 清除 src/examples 对象及 lib/include/run 产物；重新编译两个模块和 demo 并链接 | [clean.log](raw/clean.log)、[build.log](raw/build.log) |
| 提交脚本 | 与先前交接脚本字节一致；原样保存并通过本地 `bash -n` | [实际提交脚本](raw/submitted-script.slurm) |
| 最终审查 | 冻结 32 例路径接受；无 Critical/Important，保留三项 Minor 范围风险 | [最终审查](local/final-implementation-review.md) |

冻结问题是 `-u_zz + lambda*u = f`、`lambda=0/1`、`u=(1+x+y)*sin(pi*z)`。`x/y` 仅标识批量线。四阶五点差分、齐次 Dirichlet 单位行和制造解幽灵点移项保持原合同；不修改残差/阶数门。

验证矩阵为 `Nx=16, Ny=8, FP64`，两种方程 × `np=1/2` × `forward_slots=28/22` × `Nz=32/64/128/256`，共 32 次独立 MPI 启动，每组合一次。没有性能预热/重复统计；`solver_s_max` 仅为元数据。

## 实际源码谱系与构建边界

- 实现提交：`8e58e4988e0cf62b33ba4848747e9bfe0fb5f620`；分支 `codex/task010-poisson-helmholtz`；实际本地工作树 `D:/CUDA/CUDA_repository_recovery/.worktrees/task010-poisson-helmholtz`，本轮未修改。源码与审查区间见 [逐文件哈希](local/source-provenance.json)。
- 远端原目录：`/home/bingxing2/home/scx9fv9/CUDA_srtp_zhou1_task009/CUDA_coding/CUDA_code/源代码`，detached HEAD `3c658a7426f45ed8a3ce05006c851e399012c484`，含既有 TASK-007 求解器/benchmark 改动和 TASK-010 六文件安装。完整 dirty 状态见 [原目录元数据](raw/original-source-git.txt)。
- 实际构建来自 `/home/bingxing2/home/scx9fv9/task010-run-3ooZsjqu/source` 的 11 文件独立副本，没有 `.git`。因此 [environment.txt](raw/environment.txt) 中两条 `not a git repository` 是副本元数据缺省；不是构建失败，也不能替副本编造 commit。源码清单、原目录 Git 记录和构建日志共同锚定本次运行。
- 11 文件中 10 个与实现提交字节一致，包含全部六个交付文件。唯一不同的是五对角模块：实际构建 SHA-256 `0ad2330739ac4a11e8f3e403ae35fb1ea630459b3ba489e190622afc39b3a8d2`，与本次主工作树该文件一致。保留 [实际模块](source/src/PaScaL_TDMA_cuda_penta.f90) 及 [差异](local/remote-vs-implementation-solver.diff)。差异为既有 TASK-007 timing 字段、profiled 调用及 helper，demo 使用普通 `pascal_solver`；最终范围审查见审查回执。
- 不能把六文件一致表述为整个远端等于实现分支，也不能把该作业写成“未修改实现分支整树的 GPU 回归”。本次验收只针对归档的实际源码组合；没有二进制哈希，复现依赖保留的源码、构建脚本和环境。
- `mpifort -O3 -cuda` 在独立目录重新生成库和 demo；没有复用 Windows 上已有 `.o/.mod/a.out`。本轮不在 Windows 声称 CUDA 重建。

## 环境与 rank/GPU

| 项 | 原始记录 |
| --- | --- |
| 节点 | 单节点 `paraai-n32-h-01-agent-8`，aarch64；两张 A100-PCIE-40GB |
| GPU UUID | `GPU-9f370f78-944f-311d-08dd-d7df64bb912b`、`GPU-5f957695-c322-82a8-2ef7-2d88aa1bc696` |
| 驱动 | `535.104.12` |
| CUDA 字段 | nvidia-smi 显示 `12.2`；nvcc 工具链 `12.4.131`，两个字段不合并为一个实际运行时版本 |
| 编译器/MPI | NVHPC/nvfortran `24.5-1` linuxarm64；HPC-X，Open MPI `4.1.7a1` |
| Node | 目标节点 `v22.23.2`；本地运行版本另见验证记录 |
| MPI 路径 | 脚本 `pml ob1`、`btl self,vader,tcp`、`eth0`、hcoll 关闭；不从配置推断 RDMA/GPUDirect |
| CUDA-aware | demo 未启用该开关，按归档模块默认 `.false.` 走 host staging |
| 映射 | 探针 rank/local_rank 为 0/0 与 1/1，各见 `CUDA_VISIBLE_DEVICES=0,1`；结合 demo 的 `mod(myrank,ngpu)` 推断选 GPU 0/1。探针不是逐 solver CUDA context 的 UUID 跟踪 |

完整环境和探针在 [job.log](raw/job.log)。未测跨节点、其他 GPU/编译器版本、非均匀参数/环境、多于两 rank、其他网格/边界或通用三维问题。

完整 stdout 的平台附加末尾报告 `Get GPU mapping information failed，can not perform performance query`（在 `TASK010_JOB_RC=0` 之后）。保留这一失败：平台性能查询未取得映射数据，不能当作 GPU context 跟踪证据；它不推翻已有的程序退出码、32 例数值或前述设备可见性探针，也不授权性能结论。

## 本地检查与边界发现

下列本地检查均退出 0，输出保存在 `local/`：

- 归档 `source/verify/task010_manufactured_audit_test.js`、`task010_source_contract_test.js`、审计器 `--self-check`；
- 完整 `cases.csv` 的既有审计 CLI，以及独立归档复验器；
- 实现工作树的 `penta_indep_check.js`、`penta_comm_28_verify.js`、`penta_comm_22_verify.js`、`penta_index_bounds_verify.js`、`hepta_indep_check.js`、`mband_general.js`、`mband_recurrence.js`；这里只执行现有测试，没有启动一般 m 新任务；
- 归档 runner 和 Slurm 脚本的 `bash -n`；文档 lint、状态一致性与改动范围验证见 `local/` 对应记录。

独立审查保留三项未改代码的风险：rank 环境变量存在性不一致时的条件 collective；runner 给结果补表头而未检查原始表头；原审计器不拒绝有限负指标。本作业显式 `-x PENTA_FORWARD_SLOTS` 统一环境，且本地逐份核对原始表头和非负指标，因此不撤销这 32 例验收。该结论不承诺一般恶意/畸形输入均被拒绝；扩展调用合同前必须重开这些检查。没有隐瞒或放宽门槛。

历史 Node 下载超时及安装/副本/提交回执仍保存在 [此前交接记录](../TASK-010-20260826-transfer-preflight/README.md)，不覆盖。此次完整证据补足先前“仅用户摘录”的限制；本轮没有新的目标失败尝试。

## 人工复验（一次一条，无 GPU）

位置：本地 Windows PowerShell，任意目录；依赖可用 Node。执行唯一命令：

```powershell
node "D:\CUDA\CUDA_repository_recovery\CUDA_coding\knowledge\outputs\validation\TASK-010-20260826-paraai-a100-job1454628\local\verify-receipt.js"
```

预期退出 0，显示清单 56、源码 11、用例 32、分组 8、汇总字节一致，以及 `TASK010_RECEIPT_VERIFY_PASS cases=32 failures=0`。该命令只读，不覆盖原始证据；数值审计消费完整 CSV，但不替代 GPU 重跑。失败保留完整 stdout/stderr、退出码和当前压缩包/原始目录，不重新解压覆盖、不降低阈值。

## 关闭边界与下一任务

本次只完成 TASK-010 的证据回收、最终复核及归档；新增本目录并同步相关知识入口。原始源码/日志、脏工作树源码、阈值保持不变，未自动 commit、合并、push。该 demo 不能支持性能提升、跨节点扩展性、完整 CFD/FFT/GMG/ADI/PPE 或通用边界结论。

修改清单：新增本证据目录；同步16份既有文档，分别为任务队列/阻塞台账/影响地图/编译日志/开放问题、来源登记、index/brief/来源地图/ADR-007/测试矩阵/主张矩阵，以及根 README、代码地图、项目计划、运行手册。逐文件改前/改后哈希见 [修改范围](local/change-scope.json)，仅本轮增量见 [文档差异](local/documentation-changes.diff)。既有脏工作树改动没有被重置；三个受保护源码/构建文件哈希不变，实现工作树仍干净，32个任务中只有010改变状态。

最终文档复验：本地 Node `v24.18.1`；[knowledge lint](local/knowledge-lint.log) 为 Markdown=121、Wiki=33、Sources=26、Warnings=0、Errors=0，退出0；[git diff --check](local/git-diff-check.log) 退出0，无空白错误，另有27条现有Git LF→CRLF提示（不是knowledge lint警告）。命令与退出码见 [最终检查记录](local/final-checks.json)。文档通过不替代归档中的GPU验收证据。

唯一推荐下一任务：**TASK-023 直接通信诊断**，技术依赖 TASK-007/009/020 已完成，顺序前置 TASK-010 已关闭；模型 **GPT-5.6 Sol，High**，来源为任务队列合同。需用户另行选择后才冻结诊断合同；无新授权不启动、不申请资源，缺目标环境或诊断扰动对照时停止归因。
