# TASK-014：28 槽论文级 baseline 本机预检回执

日期：2026-08-19  
代码 SHA：`2b7cb1ad56dea4f378b7c4e7715cca172bc38281`  
状态：`in-progress`（目标环境已恢复并完成 debug 构建；正确性、release 计时和 cuSPARSE 证据尚未完成）

## 本次已完成

- 固定待测对象为当前 28 槽五对角实现；未修改 Fortran、通信布局、benchmark 或优化路径。
- 新增 `verify/run_task_014_baseline.sh`：在目标 Linux/WSL/HPC 环境自动执行 debug/release 干净构建、exact1/manufactured 的 np=1/2 正确性、两次预热、五次同配置 release 绝对计时，并保存环境、二进制、日志和中位数。
- 通过静态检索确认仓库中没有 cuSPARSE `cusparseDgpsvInterleavedBatch` 调用或适配器；P=1 外部 baseline 尚不能运行。

## 已执行验证

从仓库根目录：

```powershell
powershell -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1
```

结果：知识库 lint 为 `Errors=0`；7 个独立 Node 数学检查均通过。关键结果：五对角独立稠密真值最大差 `2.887e-15`，28 槽通信验证 756 配置 0 失败，22 槽 JS 布局验证 180 配置 0 失败。这些仅支持独立数学/布局证据，**不构成 CUDA Fortran 28 槽 baseline 验收**。

Windows 可见 GPU：NVIDIA GeForce RTX 4060 Laptop GPU，驱动 `560.94`，显存 `8188 MiB`。

## 阻塞证据

早期尝试调用 WSL 时得到：`Wsl/Service/CreateInstance/E_ACCESSDENIED`。2026-08-19 用户重启 WSL 后，Ubuntu、GPU、NVHPC 24.11 与 NVHPC OpenMPI 4 均已恢复可用。系统 `mpif90` 包装 gfortran，故改用 NVHPC `mpifort`；在 `perf_bench` 已执行 `make veryclean` 与 `make FC=mpifort OPT="-O0 -g"`，退出码 `0`，生成 `benchmark_penta`（3.2 MiB）。

首个目标环境正确性用例也已通过：`PENTA_TEST_CASE=exact1 mpirun -np 1 ./benchmark_penta 64 64 1024 3 128 128` 退出码 `0`。实验路径 `exp` 的平均时间为 `2.6816e-02 s`，`err_rms=1.7470e-13`、`err_linf=2.8821e-13`、`cross_err=0`；串行参考的三项误差相同，均低于 `1e-10`。这只证明 debug 构建下的单进程常数精确解，尚不构成性能 baseline。

单进程制造解也已通过：`PENTA_TEST_CASE=manufactured mpirun -np 1 ./benchmark_penta 64 64 1024 3 128 128` 退出码 `0`。`exp` 的平均时间为 `2.3333e-02 s`，`err_rms=2.6010e-13`、`err_linf=3.8480e-13`、`cross_err=0`；串行参考相同，均低于 `1e-10`。制造解不是常数，因而额外覆盖系数、RHS 和索引对应关系；但仍只有 `np=1`。

双进程常数精确解已通过：`PENTA_TEST_CASE=exact1 mpirun -np 2 ./benchmark_penta 64 64 1024 3 128 128` 退出码 `0`。`exp` 的平均时间为 `3.6606e-02 s`，`err_rms=2.3136e-13`、`err_linf=3.1042e-13`、`cross_err=2.9821e-13`；分布式 `ref` 的 RMS/Linf 分别为 `1.3272e-14`/`2.6201e-14`，同样 cross 为 `2.9821e-13`。所有项低于 `1e-10`。该环境只有一张 GPU，两个 MPI 进程共享该 GPU；结果仅支持通信正确性，不支持双 GPU 性能主张。

双进程制造解已通过：`PENTA_TEST_CASE=manufactured mpirun -np 2 ./benchmark_penta 64 64 1024 3 128 128` 退出码 `0`。`exp` 的平均时间为 `3.5043e-02 s`，`err_rms=1.3418e-13`、`err_linf=1.9595e-13`、`cross_err=2.9154e-13`；分布式 `ref` 的 RMS/Linf 分别为 `9.8271e-14`/`1.5010e-13`，同样 cross 为 `2.9154e-13`。至此 debug 的 np=1/2 × exact1/manufactured 四组均小于 `1e-10`，但不构成 release 性能数据。

TASK-013/ADR-004 仍要求 P=1 的 cuSPARSE 双精度外部 baseline；当前仓库没有适配器。这是本任务的独立未解除缺口。

## 目标环境复验

在 Linux/WSL/HPC 中，从 `CUDA_coding/CUDA_code/源代码` 运行：

```bash
git rev-parse HEAD
bash verify/run_task_014_baseline.sh \
  "$PWD/verify/logs/TASK-014-$(date +%Y%m%d-%H%M%S)"
```

通过条件：脚本退出码为 0；输出目录含 `build-debug.log`、`build-release.log`、四份 `correctness-*.log`、五份 `release-manufactured-np1-run*.log`、`release-summary.csv` 和 `environment.txt`；所有 exp/ref/serial 的 `err_rms`、`err_linf`、`cross_err_max` 均不高于 `1e-10`。脚本不会运行 cuSPARSE；其缺失需在后续独立适配/外部 baseline 回执中解决。

## 未覆盖范围

- 未完成本 SHA 的 NVHPC/MPI debug/release 构建、np=1/2 CUDA 正确性与五次计时；
- 未得到 cuSPARSE P=1 外部 baseline；
- 未取得多 GPU 或扩展性数据；单 GPU 多 rank 仅用于通信正确性。
