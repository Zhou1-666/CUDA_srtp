# TASK-009 — 沙箱故障后操作审计与证据索引

> status: draft
> confidence: high
> scope: 新克隆恢复、原始日志归档、rank-MAX 统计复算与剩余阻塞；不是 TASK-009 完成回执。

## 恢复边界

- 新仓库导入前 `HEAD`、本地 `origin/main` 均为 `3c658a7426f45ed8a3ce05006c851e399012c484`（`feat: enable CUDA-aware MPI benchmark mode`），工作树无已列出的改动。
- 原证据包 `D:\CUDA\CUDA_repository\task009-final-evidence-20260824.tar.gz` 的 SHA256 复算为 `12aece4c8586ef50c4c4b49d75dd2df016b0db49cdec2d0db22350b02417f972`，与交接值一致。
- 归档先解压到独立系统临时目录；432 个归档条目中没有绝对路径或 `..` 跳转。解压后有 28 个目录、408 个文件、总计 3,604,397 bytes。
- 已有 `TASK-009-20260820-paraai-a100` 的 26 个目标路径全部存在。字节哈希因 LF/CRLF 不同而不同，但统一换行后 26/26 内容一致，因此全部跳过、未覆盖。
- 其余 11 个证据目录此前不存在，已逐目录复制；源/目标文件数一致且逐文件 SHA256 不匹配数为 0。压缩包本身未复制，旧仓库 `.git` 未读取或导入，旧仓库的任务队列/阻塞台账未覆盖新仓库。
- 完整目录计数见 [import-manifest.csv](import-manifest.csv)。失败证据与成功修正均保留。

## 证据目录索引

| 目录 | 作用与结论 |
| --- | --- |
| `TASK-009-20260820-paraai-a100` | 初始双 A100、P=2、host、28/22 配对；原始日志现已齐全。 |
| `TASK-009-20260823-paraai-a100-scaling` | 早期 host 扩展批次 job 1448243；保留为先行会话，不替代最终统一批次。 |
| `TASK-009-20260824-paraai-a100-device-smoke` | job 1448410 失败；裸 `nvfortran` 无法读取 `mpi.mod`。 |
| `TASK-009-20260824-paraai-a100-device-smoke-fc-mpifort` | job 1448418 成功；`FC=mpifort`，默认/host/device 与非法模式共 5 项通过。 |
| `TASK-009-20260824-paraai-a100-host-device` | job 1448424 的 P=2 host/device × 28/22 配对会话。 |
| `TASK-009-20260824-paraai-a100-device-scaling` | job 1448435 的 P=1/P=2 host/device 扩展会话。 |
| `TASK-009-20260824-paraai-a100-4gpu-smoke` | 双节点 4 GPU job 1448488；rank→GPU 映射成功，首个 host/28/np=4 benchmark 无算法行并因时限取消。仅能登记为跨节点 MPI/环境 hang；`libmlx5-rdmav25.so` 警告不是已证实根因。 |
| `TASK-009-20260824-paraai-a100-4gpu-single-node-smoke` | 单节点 jobs 1448513/1448514；4 GPU host/device × 28/22 smoke 全部通过。 |
| `TASK-009-20260824-paraai-a100-1-2-4gpu-scaling` | 单节点 job 1448516；40 个 warmup、100 个 formal 日志，20 组各 5 个样本，正确性全部通过；正式映射为 4 张不同 A100 UUID。 |
| `TASK-009-20260824-paraai-a100-cusparse-smoke` | job 1448570 失败；默认 `sm_89` 在 A100 报 `no kernel image is available`。 |
| `TASK-009-20260824-paraai-a100-cusparse-smoke-sm80` | job 1448572，`GPU_ARCH=sm_80`；64×64×1024 正确性与 5 次正式运行通过。 |
| `TASK-009-20260824-paraai-a100-cusparse-256x256x1024` | job 1448573，A100、256×256×1024；exact1/manufactured 与 5 次正式运行通过。 |

## rank-MAX 复算与口径修正

`benchmark-protocol.md` 要求以每次迭代的 rank MAX 作为并行墙钟。旧的 `formal-1-2-4gpu-summary.csv` 从日志末尾 `avg_time(s)` 转录；源码中该值累计 `phase_sum(1)/nprocs`，是跨 rank 平均，不是 rank MAX。旧汇总保留为原始派生物，但不得用于论文级扩展统计。

本审计重新解析 100 个 formal 原始日志中的 10 条 `penta,exp` CSV 行，对每个正式启动先平均 `total_s_max`，再对 5 个启动计算中位数、type-7 IQR 和未缩放 MAD。冻结结果见 [formal-1-2-4gpu-rank-max-recomputed.csv](formal-1-2-4gpu-rank-max-recomputed.csv)。

关键 rank-MAX 中位数：

| 配置 | host28 (ms) | device22 (ms) | host28→device22 |
| --- | ---: | ---: | ---: |
| strong P=1 | 7.8733 | 7.8823 | -0.1%（近似持平） |
| strong P=2 | 16.5401 | 12.1214 | 延迟降低 26.7% |
| shared/strong P=4 | 16.2504 | 13.3957 | 延迟降低 17.6% |
| weak P=1 | 2.2923 | 2.3173 | -1.1%（近似持平） |
| weak P=2 | 13.0990 | 8.4689 | 延迟降低 35.3% |

由相同模式/槽数组合的 P=1 基准计算：P=2 强扩展效率为 host28 23.8%、device22 32.5%；P=4 为 host28 12.1%、device22 14.7%；P=2 弱扩展效率为 host28 17.5%、device22 27.4%。这些数据说明 device 路径在本次 P=2/P=4 配置改善延迟，但 P=2/P=4 仍慢于 P=1，不能写成良好或通用扩展性。

22 槽也不是所有配置都优于 28 槽。例如 strong P=2 device 的 rank-MAX 中位数为 12.1214 ms（22）与 12.0271 ms（28）；结论必须按模式、规模和节点拓扑限定。

100 个 formal 日志中的最大 RMS/L∞/cross 误差分别为 `1.6903e-13`、`2.6401e-13`、`3.5216e-13`，均低于 `1e-10`。job 1448516 的调度侧平均 GPU Util 为 2.43%、FP64 Util 为 0.09%，支持“通信和启动开销占主导”的解释，不支持计算饱和或通用良好扩展性。

## cuSPARSE A100 复算

- 64×64×1024、`sm_80`、5 次正式运行：solver 中位数 1.8360 ms，end-to-end 中位数 2.1718 ms。
- 256×256×1024、`sm_80`、5 次正式运行：solver 中位数 8.1091519 ms，end-to-end 中位数 12.9911328 ms，input restore 中位数 4.8822239 ms；manufactured RMS/L∞/residual 为 `7.8102e-12`/`1.0436e-11`/`2.6645e-15`。
- PaScaL P=1 rank-MAX solver 中位数约 7.87–7.90 ms。两者来自不同 GPU 会话，约 3% 的差距过小；只能并列报告绝对时间，不能宣称普遍优于 cuSPARSE，也不能把 cuSPARSE end-to-end 与 PaScaL solver-only 直接比较。

## 当前状态与停止条件

TASK-009 不能标记 `done`：协议要求 1/2/4/8 GPU，当前只有单节点 1/2/4 GPU；资源账本显示当时 5–8 GPU 可运行数量为 0。双节点 4 GPU job 1448488 的 MPI hang 也未关闭。完成本地恢复审计后，任务应转为 `blocked (environment/scheduler)`，直至取得 8 GPU 窗口并通过最小跨节点 MPI smoke。

本审计未修改求解器、benchmark、Makefile 或运行脚本，未提交、未推送、未启动新实验。
