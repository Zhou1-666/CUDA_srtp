# TASK-009 — A100 双 GPU 28/22 正式配对 benchmark（阶段性回执）

> status: reviewed
> confidence: high
> scope: 固定全局规模的 P=2 28/22 配对比较；不是完整强/弱扩展结论。

## 结论

在同一双 A100 节点、同一 FP64 manufactured 输入和 `np=2` 下，22 槽路径与 28 槽路径数值误差相同，并在五个正式配对 run 中均更快。

| 指标 | 28 槽 | 22 槽 | 变化 |
| --- | ---: | ---: | ---: |
| 五 run 平均时间 | 15.7964 ms | 14.1320 ms | 时延降低 10.5% |
| 五 run 中位时间 | 15.7490 ms | 14.1130 ms | 时延降低 10.4%；速度提升 11.6% |
| RMS 误差 | `1.6903e-13` | `1.6903e-13` | 相同 |
| L∞ 误差 | `2.6401e-13` | `2.6401e-13` | 相同 |
| 交叉误差 | `3.5216e-13` | `3.5216e-13` | 相同 |

五个同 run 序号的绝对时延差（28 减 22）依次为 1.912、1.892、1.414、1.345、1.759 ms；全部为正。数据见 [formal-run-summary.csv](formal-run-summary.csv)。

## 固定合同

- Git：`ceb2e7b0fff88190a72d6d4e9eb32ea41fef6c5f`
- Slurm batch：`1437701`，`COMPLETED`、`ExitCode=0:0`、elapsed `00:03:34`
- 节点：`paraai-n32-h-01-agent-74`
- GPU：2× NVIDIA A100-PCIE-40GB，driver `535.104.12`，各 40960 MiB
- 软件：NVHPC/nvfortran `24.5-1 linuxarm64`；Open MPI `3.1.5`
- 输入：manufactured，FP64，`256×256×1024`，`np=2`，每 run 10 iterations；仅 `PENTA_FORWARD_SLOTS=28` 或 `22` 不同。
- 预热：每布局 2 次，不计入统计；正式样本：每布局 5 次，交替执行。

## 原始证据位置

集群工作树中的原始日志位于：

```text
~/CUDA_srtp/CUDA_coding/knowledge/outputs/validation/TASK-009-20260820-paraai-a100/raw/
```

包括 `environment-batch.txt`、`slurm-1437701.out`、`warmup-*.log`、`formal-slots{28,22}-run{1..5}.log`。该目录在本地工作树尚未同步原始日志；本回执中的表由用户在 2026-08-21 提供的该目录汇总输出逐行转录。

## 未覆盖与下一步

- 本回执仅支持固定问题规模的双 GPU 配对结论，不能代替 P=1→P=2 强扩展、弱扩展或更多 GPU 的结论。
- 本轮 batch 环境文件记录了两个 GPU UUID，但没有逐 rank 的运行期 GPU 映射回显；后续扩展批任务应在启动时记录 rank→UUID。
- 下一步：继续 **TASK-009**，在可用 A100 窗口补 P=1/P=2 的强、弱扩展合同数据与逐 rank 映射，并将集群原始 `raw/` 日志同步、纳入版本控制后再决定能否关闭任务。
