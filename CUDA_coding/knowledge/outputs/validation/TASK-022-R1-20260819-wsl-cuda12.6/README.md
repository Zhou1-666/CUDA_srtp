# TASK-022-R1：P=1 cuSPARSE 重复实验回执

日期：2026-08-19

运行提交：`15123ce61d7d8a5aa7469977c59d0980e50d4c21`

状态：`done`（第二轮独立运行已归档并完成独立复算；它补充而不替代 TASK-022 原公平回执）

## 目的与不变量

本回执复现已关闭的 TASK-022，不修改 `PaScaL_TDMA_cuda_penta.f90`、28 槽通信、22 槽实现或既有 `benchmark_penta`。它使用原 adapter、构建目标和 runner；`f868ea9`（原公平回执）到本次运行提交之间，这三个目标文件无差异。

运行环境仍为 RTX 4060 Laptop GPU（UUID `GPU-44881249-c7bc-01a6-688c-946e2e0d760a`，驱动 `560.94`）、NVHPC 24.11、CUDA 12.6、cuSPARSE `12504`。完整环境记录见 `environment.txt`。

## 正确性

| case | RMS 解误差 | 最大解误差 | 最大绝对残差 | 结果 |
| --- | ---: | ---: | ---: | --- |
| exact1 | `8.2861e-12` | `1.1107e-11` | `2.7756e-15` | PASS |
| manufactured | `7.8102e-12` | `1.0436e-11` | `2.6645e-15` | PASS |

二者均满足 `1e-10` Gate。

## 预热、正式样本与统计

先运行两个独立 `manufactured 10 0` 预热进程；随后五个正式进程均为 `manufactured`、`64×64×1024`、batch 4096、FP64、`iterations=10`、`warmups=0`。正式 CSV 恰有五行，预热没有混入统计。

solver-only 原始均值（ms）：

```text
6.091977596
5.606400013
5.766041613
5.582950354
5.568912077
```

| 口径 | 中位数 (ms) | 均值 (ms) | CV | IQR (ms) | MAD (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| solver-only | `5.606400013` | `5.723256330` | `3.857337%` | `0.183091259` | `0.037487936` |
| restore-plus-solver | `8.063999987` | `7.927198706` | `2.813050%` | `0.260703993` | `0.024857664` |
| input-restore | `2.213695908` | `2.203942375` | `9.675744%` | `0.315468597` | `0.214406204` |

四分位定义为 5 点样本的 linear/type-7；MAD 为未缩放中位绝对偏差。

## 与原公平回执的关系

原公平回执的 solver-only 中位数为 `6.686515188 ms`、CV `10.684923%`；本轮为 `5.606400013 ms`、CV `3.857337%`。两轮都有效，但属于不同独立启动组，反映笔记本 GPU 的会话波动。它们**不得合并成预先未定义的十样本统计，也不得只选较快一轮作为唯一论文数字**。

论文或答辩应并列报告两个回执的原始 CSV、每轮中位数/IQR/MAD/CV；若未来需要单一主数字，必须预先规定新的重复协议并在相同会话内联合采样。与 TASK-014 的比较仍只可限于固定单 GPU、P=1、FP64、solver-window 的描述性证据，不能外推为多 GPU、普遍速度或算法优劣结论。

## 证据与人工复验

- `build.log`、`environment.txt`；
- `correctness-exact1.log`、`correctness-manufactured.log`；
- 两个 `warmup-manufactured-*.log`；
- 五个 `formal-manufactured-run*.log`、`formal-runs.csv`、`formal-stats.txt`；
- `independent-audit.md`。

复验命令：

```bash
cd /mnt/d/CUDA/CUDA_repository/CUDA_coding/CUDA_code/源代码
export NVARCH=Linux_x86_64
export NVCOMPILERS=/opt/nvidia/hpc_sdk/$NVARCH/24.11
export PATH=$NVCOMPILERS/compilers/bin:$PATH
bash verify/run_task_022_cusparse.sh \
  "$PWD/verify/logs/TASK-022-$(date +%Y%m%d-%H%M%S)"
```

预期输出 `TASK-022 PASS`。失败时保留整个输出目录，不覆盖本回执。
