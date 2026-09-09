# TASK-023 本地实现、验证与待验收交接

- 日期：2026-08-26；状态：`review`。用户已确认诊断设计；本地实现、干净构建及独立审查完成，**尚缺目标 A100 正式配对数据，不能 done**。
- 实现工作树：`D:/CUDA/CUDA_repository_recovery/.worktrees/task023-direct-diagnostics`，分支 `codex/task023-direct-diagnostics`，基底 HEAD `91ecc661e0cd856c61bdc5b69f5aa065faadf078`。未 commit、合并、push。
- 先带入 TASK-007 已验收但未提交的三个文件，再实施023。它们在主工作树的 SHA 保持 [启动核对](../TASK-023-20260826-local-intake/README.md) 中的原值；不能将仅有 HEAD 的 checkout 当成本次输入。
- 不连接 SSH、不申请 GPU、不提交 Slurm、不启动其他任务。此次 CUDA 实测仅使用本机已有 RTX 4060。

## 实现与保护范围

隔离工作树修改 `src/PaScaL_TDMA_cuda_penta.f90` 的计时类型、reset、profiled solver 和 profiled exchange；增加每方向 sync/allocate/D2H/MPI/H2D/free，保留旧 host aggregate。普通 solver、普通 exchange、所有数值核/阈值/索引限制和生产通信后端内容不变；[scope 检查](local/scope.log)对整个模块除允许区域的文本逐字比较，并复核主工作树三个原始哈希。

`perf_bench/benchmark_penta.f90` 增加默认关闭的诊断模式：plain 调普通入口，profiled 调诊断入口；同样从输入就绪之后计时，均包含最终 CUDA 同步，输出/误差检查/参考求解在窗口外。每次诊断迭代检查误差；per-rank CSV 使用新建模式禁止覆盖。rank 间模式、文本与七个数值配置在求解前统一核对。

新增四个工具：`verify/task023_diagnostics_audit.js`、`task023_diagnostics_audit_test.js`、`run_task_023_diagnostics.sh`、`run_task_023_contract_tests.sh`；[使用说明](source/verify/TASK023-diagnostics.md)定义37列新CSV、35列旧CSV兼容、全局rank-MAX总时间与扰动口径。原始字段及方向阶段都保留，不由旧合计按比例拆分。

`source/` 是本次私有验证所需的13个源码/构建/工具文件及完整SHA清单，不是正式release，也不是整个远端仓库等于该分支的证明。原始远端 detached HEAD 与 TASK-007 改动谱系不改写。

## 已实际执行

环境见 [原始记录](raw/wsl-smoke-v2/environment.txt)：WSL2、RTX4060 Laptop 8188 MiB，驱动560.94，NVHPC24.11、CUDA12.6、Open MPI4.1.7a1；`-O3 -cuda -gpu=cc89,cuda12.6`；host staging，`ob1`/`self,tcp`，FP64。P=2 的两个 rank 共用唯一 GPU UUID `GPU-44881249-c7bc-01a6-688c-946e2e0d760a`。**这不是双GPU性能实验。**

| 验证 | 实际结果 | 证据 |
| --- | --- | --- |
| 解析器TDD | 初始61例RED；合同更正补4例RED；最终68/68通过，根任务独立复跑 | [测试日志](local/parser-tests.log)、[实现报告](review/parser-report.md) |
| 旧程序缺诊断输出 | 旧版clean build/solve成功，预期诊断CSV不存在，新增测试RED | `raw/baseline-build/`、`local/producer-red.sh` |
| 最终版本clean build与host smoke | P1/2 ×28/22，plain/profiled各2次，16×8×128 manufactured；4完整配对、36原始行，RC0 | [build](raw/wsl-smoke-v2/build.log)、[审计](raw/wsl-smoke-v2/audit.json)、[状态](raw/wsl-smoke-v2/status.txt) |
| 不均匀分区 | 3×3×17、P2、28/22、两入口各2次exact1；2配对、24行 | [审计](raw/wsl-contract-v3/uneven-audit.json) |
| 失败/输出保护 | 非法模式、缺目录、非法ID、目录不存在、已有输出、rank模式/迭代/槽数/n3不一致，9项均rc1，不超时 | [退出码](raw/wsl-contract-v3/rejections.txt) |
| 旧CSV兼容 | 表头完全相同；35列、4行，误差均有限且<=1e-10；header/row writer内容未改 | [scope/兼容检查](local/scope.log)、[实际输出](raw/wsl-contract-v3/legacy.log) |
| 既有独立数学/边界回归 | 7项Node检查全部退出0 | `local/penta_*.log`、`hepta_indep_check.log`、`mband_*.log` |
| 最终实现审查 | 修复1项P2后，无剩余代码缺陷；独立重算最终两组CSV审计、核对源码/构建/可执行哈希和9项拒绝 | [完整审查](review/review-report.md) |

6个完整配对共60行，所有 `err_rms/err_linf/cross_err` 最大值 `3.2085445411667024e-14`，固定门槛 `1e-10`；[本地汇总](local/measurement-summary.json)。这是功能/格式验收，不是正式性能结论。初版及失败证据均保留：审查发现rank迭代数不一致可导致45秒超时（rc124，`raw/wsl-contract-v2-red/`），增加集体配置检查后在v3明确rc1拒绝。

`raw/` 不含新生成的 `.o/.mod` 和可执行二进制，避免误用其代替重建；原工作树SDD目录仍保留这些本地构建产物。源码、构建日志、可执行哈希、原始CSV、失败输出及脚本均已复制归档，未删除/覆盖任何历史证据。

## 人工只读复验

执行位置：Windows PowerShell，`D:/CUDA/CUDA_repository_recovery`。下面只有一条命令，不需要GPU，不写原始数据：

```powershell
node ".\CUDA_coding\knowledge\outputs\validation\TASK-023-20260826-local-implementation\source\verify\task023_diagnostics_audit.js" ".\CUDA_coding\knowledge\outputs\validation\TASK-023-20260826-local-implementation\raw\wsl-smoke-v2\measured"
```

预期退出0，JSON中 `status: "pass"`、`run_count: 4`。失败保留完整stdout/stderr、退出码和整个归档目录，不覆盖CSV或降低阈值。本命令已由本地审计等价执行；知识lint结果另见 `local/knowledge-lint.log`，不替代CUDA或性能验收。

## 仍缺什么／唯一下一步

继续 **TASK-023**（任务合同 GPT-5.6 Sol / High），不启动024或其他优化。由用户执行目标SSH操作，首先确认是否有**已分配、仍有效**的单节点双GPU资源及实际GPU UUID/CPU绑定/MPI设置；没有现有分配就保留 `review`，本轮不重新申请GPU。

后续在该资源内从本次源码快照干净构建、host 28/22 smoke，再执行冻结的P1/2 ×28/22正式协议：每模式/配置2次独立预热、5次配对launch×10次迭代、交替模式顺序，保存完整每rank/方向数据、低扰动普通入口对照、环境/启动顺序/正确性/哈希及绝对时间波动。SSH下载/部署/运行命令须在确认远端位置和已有分配后逐条提供；当前没有远端路径或资源可用性的新版回执，不猜连接地址。

device runtime、跨节点、新规模/硬件及Nsight未覆盖；计时只知道MPI调用耗时包含等待，不能单凭这些字段区分等待原因。payload含self，仅为应用元素数×8，不是网卡流量。禁止阶段MAX相加、由两次smoke的负扰动比声称加速、升级性能/完整CFD结论或自动解锁TASK-021。
