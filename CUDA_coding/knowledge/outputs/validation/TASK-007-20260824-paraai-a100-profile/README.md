# TASK-007 ParaAI A100 host-staging profile 回执

## 结论

TASK-007 以“实测后不实施 persistent host staging buffers”关闭。

在双节点、双 A100、两个 MPI rank 的正式实验中，host staging 的每次分配与释放合计只占 `total_s_max` 的中位数 `0.1474%`，五次正式作业中的最高占比为 `0.1826%`，远低于实验前冻结的 `5%` 实施门槛。即使理想化地完全消除这部分成本，端到端理论上限也只有约 `0.15%`，不足以抵偿把通信缓冲区生命周期移入 plan 所带来的所有权、回滚和线程安全复杂度。

本任务保留 profile-only 的五项阶段计时，不修改普通求解入口的 host-staging 生命周期，也不宣称获得性能加速。

## 冻结配置

- 日期：2026-08-24；平台：ParaAI；GPU：每节点一张 NVIDIA A100-PCIE-40GB，共两张；
- NVHPC：24.5；MPI：HPC-X Open MPI 4.1.7a1；
- 节点：每次 Slurm 数组作业由调度器分配，rank 0/1 映射到不同节点和不同 GPU UUID；
- 五对角配置：FP64、manufactured、host staging、28 slots、`256×256×1024`、`np=2`；
- 每次作业：10 iterations；2 次独立预热后，5 次独立正式作业，共 50 个正式样本；
- 正确性 Gate：`err_rms`、`err_linf`、`cross_err_max <= 1e-10`；
- 实施 Gate：五次正式作业的 `(allocate+free)/total_s_max` 中位数达到 `5%` 才继续设计 persistent buffer。

## 正式结果

| 数组任务 | 样本数 | mean total (ms) | mean alloc+free (ms) | 占比 |
| ---: | ---: | ---: | ---: | ---: |
| 3 | 10 | 17.903242 | 0.032698 | 0.1826% |
| 4 | 10 | 24.808604 | 0.034204 | 0.1379% |
| 5 | 10 | 24.506661 | 0.036120 | 0.1474% |
| 6 | 10 | 21.561704 | 0.033091 | 0.1535% |
| 7 | 10 | 22.281437 | 0.031962 | 0.1434% |

五次作业统计：

- `total_s_max` 作业均值的中位数：`22.281437 ms`；
- allocate、D2H、host-staging MPI、H2D、free 作业均值的中位数分别为 `0.015903 / 2.577149 / 11.476841 / 2.041820 / 0.017598 ms`；
- allocate+free 占比中位数：`0.147387%`；最大值：`0.182637%`；
- 50 个正式样本最大正确性误差：`3.521627434111e-13`；
- 5/5 正式作业和 2/2 预热作业均 `COMPLETED 0:0`。

## 诊断实现边界

- `ptdma_timing_cuda` 新增 `host_staging_allocate/d2h/mpi/h2d/free`；
- `pascal_a2av_profiled` 只由 profiled solver 调用；普通 `pascal_solver` 仍走原 `pascal_a2av`，不增加 profile 分支；
- benchmark CSV 新增五个 rank-MAX 字段；
- `verify/run_task_007_profile_timing.sh` 验证字段存在、D2H/MPI/H2D 为正且数值误差过 Gate；
- 未把临时 host buffer 移入 plan，未改变 create/clean、普通 solver 或数值算法。

对应文件 SHA-256：

```text
0ad2330739ac4a11e8f3e403ae35fb1ea630459b3ba489e190622afc39b3a8d2  src/PaScaL_TDMA_cuda_penta.f90
2cc91f341066969928febdf2840d0e5aabd14d56239084c87b0efe9d3b9745e8  perf_bench/benchmark_penta.f90
6382b18ce97465541e617a15d9bc70bc969adaeca6a5a39363c37c5671513e3d  verify/run_task_007_profile_timing.sh
```

## 原始证据与完整性

- 下载包：`TASK-007-20260824-paraai-a100-profile.tar.gz`；
- 集群端与本地 SHA-256：`defe57d2977003da9bbcfe6339302f591d03d01c86a538214b7589bcf9977ff3`；
- `raw/` 共 21 个文件；`SHA256SUMS.txt` 本地复核为 21/21 通过；
- Slurm 数组父作业：`1450272`；正式子作业对应输出 `_3` 至 `_7`；smoke 作业：`1450262`；
- Nsight Systems 作业 `1450184` 中求解器完成并输出正确结果，但 rank 1 的 `nsys` importer 退出 139。该失败作为 profiler 工具故障原样保留，不作为求解器失败或正式定量依据。

## 2026-08-25 本地完成前复验

- `powershell -NoProfile -ExecutionPolicy Bypass -File CUDA_coding/scripts/check_all.ps1`：知识 lint 为 Markdown 112、Wiki 31、Sources 25、Warnings 0、Errors 0；8 个数学脚本与容量模型全部通过；
- WSL2、NVHPC 24.11、Open MPI 4.1.5：`run_task_007_profile_timing.sh` 末行 `TASK007_PROFILE_TIMING_PASS`；
- 同一环境的既有 28/22 runner：普通入口 2/2、profiled 20/20，`failures=0`；
- `git diff --check`：目标代码与文档退出 0；仅有仓库既有的 LF/CRLF 提示。

## 重开条件

只有 host-staging 实现、MPI/网络路径、分配器、问题规模或 rank/GPU 映射显著变化，并且新 profile 使 allocate+free 中位占比达到预注册门槛时，才重开 persistent buffer 设计。TASK-020 可以复用本回执的 D2H/MPI/H2D 阶段数据建立 overlap 关键路径，但不得把本结论解释为 overlap 已经值得实现。
