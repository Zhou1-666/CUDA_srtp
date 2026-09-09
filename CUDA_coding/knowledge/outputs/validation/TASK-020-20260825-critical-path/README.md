# TASK-020 关键路径模型与 overlap Gate 回执

## 结论

TASK-020 以“当前证据不足以进入 overlap 实现”关闭，TASK-021 保持 `blocked`。

现有双 A100 数据显示 MPI-only 是重要时间来源：五次正式作业的 `host_staging_mpi/total_s_max` 中位数为 `51.5085%`。模型得到的理想可隐藏时间占比中位数为 `21.6916%`；按预注册的 50% 实现效率折算后，中位预测收益为 `10.8458%`。但只有 3/5 个独立正式作业达到 `10%` 保守收益，未达到批准前冻结的 4/5 稳定性 Gate。因此不把一次边缘中位数通过解释为值得增加分批、双缓冲、非阻塞 MPI 和 stream 依赖复杂度。

这是“暂不实施”的证据结论，不表示通信没有优化潜力，也不是实际 overlap 性能结果。

## 输入与冻结口径

- 输入：TASK-007 的正式数组任务 `_3` 至 `_7`；每个作业 10 iterations，共 5 个独立作业、50 个样本；
- 平台：ParaAI 双节点双 NVIDIA A100-PCIE-40GB；NVHPC 24.5；HPC-X Open MPI 4.1.7a1；
- 配置：FP64、manufactured、host staging、28 slots、`256×256×1024`、`np=2`；
- 每个作业先对 10 个 `penta,exp` 行求均值，再跨 5 个作业取中位数；不把同一作业内迭代当作独立作业；
- 数值 Gate：`err_rms/err_linf/cross_err_max <= 1e-10`。

原始输入仍由 [TASK-007 回执](../TASK-007-20260824-paraai-a100-profile/README.md) 管理，传输包 SHA-256 为 `defe57d2977003da9bbcfe6339302f591d03d01c86a538214b7589bcf9977ff3`，其 raw 21/21 哈希已通过。

## 模型

对每个正式作业 `i`：

```text
T_i   = mean(total_s_max)
M_i   = mean(host_staging_mpi_s_max)
r_f   = mean(mpi_forward_s_max) /
        (mean(mpi_forward_s_max) + mean(mpi_backward_s_max))
M_f   = M_i * r_f
M_b   = M_i - M_f
W_f   = mean(local_compute_s_max) + mean(pack_forward_s_max)
W_b   = mean(reduced_compute_s_max) + mean(pack_backward_s_max)
H_i   = min(M_f, W_f) + min(M_b, W_b)
Gideal_i = H_i / T_i
G50_i    = 0.5 * H_i / T_i
```

`M_f/M_b` 是由于现有 CSV 只提供两次通信合计的 MPI-only 时间，而按 forward/backward 外层通信时间比例得到的推断。`W_f/W_b` 只计入另一批可独立执行的计算与 pack；D2H/H2D、unpack 和 update 不计入可隐藏窗口。`G50` 只是假设理想隐藏量实现 50% 的保守筛选值，不是实测加速。

## 预注册 Gate

| Gate | 阈值 | 结果 | 判定 |
| --- | ---: | ---: | --- |
| 正式作业数 | 5 | 5 | PASS |
| MPI-only 中位占比 | ≥30% | 51.5085% | PASS |
| `G50` 中位数 | ≥10% | 10.8458% | PASS |
| 单作业 `G50≥10%` | ≥4/5 | 3/5 | **FAIL** |
| 最大正确性误差 | ≤1e-10 | `3.522e-13` | PASS |

任一核心 Gate 失败即停止 TASK-021；本次失败项是跨作业稳定性。

## 逐作业结果

| 数组任务 | total (ms) | MPI-only 占比 | 理想收益 | 50% 保守收益 | 单作业 Gate |
| ---: | ---: | ---: | ---: | ---: | --- |
| 3 | 17.9032 | 39.3044% | 27.1755% | 13.5877% | PASS |
| 4 | 24.8086 | 55.9168% | 19.6542% | 9.8271% | FAIL |
| 5 | 24.5067 | 55.8158% | 19.7419% | 9.8709% | FAIL |
| 6 | 21.5617 | 49.1256% | 22.9141% | 11.4571% | PASS |
| 7 | 22.2814 | 51.5085% | 21.6916% | 10.8458% | PASS |

完整数值见 `critical-path.csv`。

## 审计器与完整性

- 审计器：`verify/task020_critical_path_audit.js`，SHA-256 `252524222f61a502a3298078d3f4d5f28df1abd6137d7df4edab7cc823d1d2d1`；
- 测试：`verify/task020_critical_path_audit_test.js`，SHA-256 `a4c6a6295566fc68a5b7e315fb6efd28359bb4fecab47a63c8929486fa83cdea`；
- 输出 CSV SHA-256：`a87d8de316709eb191ed6dac0991c534918d95f84af81dd85c2ff80de894d80a`；
- TDD：测试先因生产模块不存在失败；函数模型转绿后，CLI 测试再因无输出失败；实现 CLI 后通过。
- 独立 PowerShell 复算未调用 Node 审计器，得到中位 MPI share `51.508533%`、中位 `G50=10.845786%`、单作业通过 `3/5`、最大误差 `3.521627434111e-13`，与 CSV 一致。

## 边界与重开条件

- 当前是聚合计时模型，未直接测量 nonblocking MPI、异步进度、分批开销、双缓冲显存或 CUDA stream 并发；
- 当前跨节点路径强制 TCP/`eth0`，不能外推到 UCX、IB、GPUDirect 或其他 MPI；
- 不得把 `21.6916%` 写成可获得加速，更不得写成已实现通信计算重叠；
- 只有新增每方向 MPI-only 计时、改用不同网络路径/规模，或更多独立正式作业使冻结的稳定性 Gate 达到 4/5 时，才重开 TASK-021。
