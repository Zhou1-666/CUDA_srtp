# TASK-022：P=1 cuSPARSE 公平外部 baseline 回执

日期：2026-08-19  
实验提交：`f868ea993e8263c46a0c3b6d1050d27e41a73b80`  
状态：`done`（实现、运行、预热口径整改和最终独立复审均通过）

## 结果摘要

隔离的双精度 `cusparseDgpsvInterleavedBatch` adapter 已在与 TASK-014 相同的 RTX 4060 Laptop、`64×64×1024`、P=1、FP64 manufactured 输入上完成：

- exact1/manufactured 正确性均通过 `1e-10`；
- 两个独立 manufactured 预热进程完成，不计入正式统计；
- 五个正式进程各计时 10 次，`warmups=0`，与 TASK-014 的预热/进程口径一致；
- 五次 solver-only 中位数 `6.686515188 ms`；
- 五次 restore-plus-solver 中位数 `9.133897495 ms`；
- 旧 SHA `45e6998` 的进程内预热结果被独立审查否决并保留在相邻 preliminary 目录，没有覆盖或删除。

## 不变边界

本任务只新增 `cusparse_penta_baseline.cu`、`Makefile.cusparse` 和专属运行脚本。没有修改 `PaScaL_TDMA_cuda_penta.f90`、28 槽通信、22 槽实现或既有 `benchmark_penta`。

SRC-014/NVIDIA 官方合同：`algo=0` 使用 QR；五条对角线和 RHS 被原位覆盖；越界对角槽为零；workspace 由 `bufferSizeExt` 查询且 device buffer 满足 128-byte 对齐。adapter 以 `row*batchCount+system` 生成交错布局。Fortran `A_sh(Nsys,Nrow)` 的列主序物理偏移与它相同，所以不需要转置，`layout_conversion_ms=0`。

## 环境

- GPU：NVIDIA GeForce RTX 4060 Laptop GPU；UUID `GPU-44881249-c7bc-01a6-688c-946e2e0d760a`；8188 MiB；
- 驱动：`560.94`；
- NVHPC：24.11；CUDA Toolkit：12.6 (`V12.6.77`)；
- cuSPARSE runtime：`12504`（12.5.4）；
- 编译：`nvcc -O3 -std=c++17 -arch=sm_89`；
- workspace：67,108,864 bytes。

原始环境和命令见 `environment.txt`、`build.log`。

## 数学输入与正确性

- `batchCount=Nsys=4096`，每个系统长度 `system_size=1024`；
- 有效五对角系数为 `1,1,-4,1,1`，物理域外项置零；
- manufactured 精确解为 `1+0.1 sin(2πj/n3)+0.05 cos(4πj/n3)`；
- RHS 由上述有效矩阵与精确解直接生成。

| case | RMS 解误差 | 最大解误差 | 最大绝对残差 | 结果 |
| --- | ---: | ---: | ---: | --- |
| exact1 | `8.2861e-12` | `1.1107e-11` | `2.7756e-15` | PASS |
| manufactured | `7.8102e-12` | `1.0436e-11` | `2.6645e-15` | PASS |

## 公平预热与五次正式统计

正式段之前先运行两个独立 `manufactured 10 0` 进程，日志为 `warmup-manufactured-1.log` 和 `warmup-manufactured-2.log`。随后五个正式进程全部使用 `iterations=10,warmups=0`。

solver-only 原始均值（ms）：

```text
5.670908833
5.584588814
6.888960075
6.981420803
6.686515188
```

| 口径 | 中位数 (ms) | 均值 (ms) | CV | IQR (ms) | MAD (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| solver-only | `6.686515188` | `6.362478743` | `10.684923%` | `1.218051243` | `0.294905615` |
| restore-plus-solver | `9.133897495` | `8.757431698` | `10.439178%` | `1.621040201` | `0.515670490` |
| input-restore | `2.447382307` | `2.394952955` | `9.910975%` | `0.402988958` | `0.220764875` |

IQR 使用 5 点样本的 linear/type-7 四分位（第 2/4 个顺序统计量），MAD 是未缩放中位绝对偏差。所有原始样本保留；没有异常值删除。CV 约 10% 表明该笔记本 GPU 仍有可见波动，因此论文必须同时报告中位数、IQR/MAD 和原始 CSV。

## 与 TASK-014 的可比边界

TASK-014 的同 GPU、同规模、同 FP64 manufactured、五次正式 PaScaL P=1 solver 中位数为 `3.6474 ms`。P=1 时 `timing%total` 包围 `tdma_penta_cuda` 与设备同步；cuSPARSE solver-only 也以 CUDA events 包围 QR API 并同步，所以这是当前最近的求解器口径。

固定配置的中位数比为 `6.686515188 / 3.6474 = 1.8332`。最终独立复审已通过，允许使用限定措辞：“在该固定 RTX 4060/CUDA 12.6/P=1/FP64 输入与已记录计时口径下，PaScaL 28 槽路径的中位 solver 时间低于 cuSPARSE QR 外部锚点。”不得外推为其他规模、硬件、多 GPU、普遍最优或首次性结论。

`restore-plus-solver` 包含六个 device-to-device 输入恢复，不含初始输入生成/H2D，也不是与 TASK-014 solver total 相同的端到端口径；禁止直接拿 `9.1339 ms` 与 `3.6474 ms` 计算速度比。

## 证据文件

- `environment.txt`、`build.log`；
- `correctness-exact1.log`、`correctness-manufactured.log`；
- `warmup-manufactured-1.log`、`warmup-manufactured-2.log`；
- `formal-manufactured-run1.log` 至 `run5.log`；
- `formal-runs.csv`、`formal-stats.txt`。
- `independent-audit.md`（最终独立复审 PASS 及允许/禁止措辞）。

## 人工复验

```bash
cd /mnt/d/CUDA/CUDA_repository/CUDA_coding/CUDA_code/源代码
export NVARCH=Linux_x86_64
export NVCOMPILERS=/opt/nvidia/hpc_sdk/$NVARCH/24.11
export PATH=$NVCOMPILERS/compilers/bin:$PATH
bash verify/run_task_022_cusparse.sh \
  "$PWD/verify/logs/TASK-022-$(date +%Y%m%d-%H%M%S)"
```

预期脚本最后输出 `TASK-022 PASS`；两个预热日志、五个正式日志和五行 CSV 均存在；三项误差/残差不超过 `1e-10`。失败时保存整个输出目录。

## 未覆盖

- 仅一个 GPU、一个规模和一种正常矩阵族；
- cuSPARSE QR 与 PaScaL 无 pivot 消元算法不同；
- 不构成多 GPU comparator、扩展性、数值稳定域或总体最优证据；
- 笔记本 GPU 计时 CV 仍约 10%，不能隐藏波动。
