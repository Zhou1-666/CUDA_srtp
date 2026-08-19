# TASK-022：P=1 cuSPARSE 五对角外部 baseline 回执

日期：2026-08-19  
实验提交：`45e699817f6c05a9b0760065406e3434a843797c`  
状态：`superseded-preliminary`（API/正确性有效；性能数据因独立审查发现预热口径不公平而不用于最终比较，原始证据保留）

## 单一目标与边界

本任务新增隔离的 CUDA C++ adapter，调用双精度 `cusparseDgpsvInterleavedBatch`，为 TASK-014 的单 GPU、P=1 五对角结果提供外部锚点。没有修改 `PaScaL_TDMA_cuda_penta.f90`、28 槽通信、22 槽实现或既有 `benchmark_penta`。

外部 API 与布局合同来自 SRC-014：NVIDIA cuSPARSE 官方文档和 `CUDALibrarySamples/cuSPARSE/gpsvInterleavedBatch`。接口使用 `algo=0` 的 QR，原位覆盖五条对角线和 RHS；越界对角项必须为零，workspace 由 `bufferSizeExt` 查询。

## 输入与布局等价

- 配置：P=1、FP64、`n1=n2=64`、`n3=m=1024`、`batchCount=Nsys=4096`；
- 五条对角线：二条下对角、一条主对角和二条上对角分别为 `1,1,-4,1,1`，物理边界越界项置零；
- `exact1`：精确解恒为 1；
- `manufactured`：`x(j)=1+0.1 sin(2πj/n3)+0.05 cos(4πj/n3)`，RHS 由同一五对角矩阵生成；
- cuSPARSE 交错偏移为 `row*batchCount+system`。Fortran `A_sh(Nsys,Nrow)` 的列主序偏移为 `(system-1)+(row-1)*Nsys`，二者等价，因此 adapter 原生生成交错布局，`layout_conversion_ms=0`，没有用转置时间制造优势。

## 环境

- GPU：NVIDIA GeForce RTX 4060 Laptop GPU，UUID `GPU-44881249-c7bc-01a6-688c-946e2e0d760a`，8188 MiB；
- 驱动：`560.94`；
- NVHPC：24.11；`nvcc`/CUDA Toolkit：12.6 (`V12.6.77`)；
- cuSPARSE runtime：`12.5.4`（`cusparseGetVersion=12504`）；
- workspace：67,108,864 bytes；编译目标 `sm_89`。

完整路径见 `environment.txt` 和 `build.log`。首次构建暴露 NVHPC `nvcc` 的 rpath 转发差异；首次运行暴露 `libnvJitLink.so.12` 搜索路径缺失。两者均在 adapter 专属 Makefile/脚本内修复，既有 Fortran 构建未受影响。

## 正确性

| case | RMS 解误差 | 最大解误差 | 最大绝对残差 | 阈值 | 结果 |
| --- | ---: | ---: | ---: | ---: | --- |
| exact1 | `8.2861e-12` | `1.1107e-11` | `2.7756e-15` | `1e-10` | PASS |
| manufactured | `7.8102e-12` | `1.0436e-11` | `2.6645e-15` | `1e-10` | PASS |

cuSPARSE 的前向解误差高于 TASK-014 的 PaScaL 28 槽结果，但二者都通过预注册阈值；残差处于机器精度量级。不得只比较残差或只比较速度。

## 五次正式结果（初始回执，不用于最终公平比较）

每个正式进程使用 manufactured、10 次计时迭代和 2 次进程内预热。原始 solver-only 时间（ms）：

```text
8.050176048
5.816006422
5.532774401
5.767475176
5.611417627
```

- solver-only：中位数 `5.767475176 ms`，均值 `6.155569935 ms`，CV `17.306226%`；
- input-restore + solver：中位数 `8.062703991 ms`，均值 `8.491316519 ms`，CV `12.514826%`；
- 第一个正式样本明显较慢，但按预注册规则完整保留；当前不删除异常值、不用后四次重新包装结论；
- `input_restore` 是六个原位覆盖数组的 device-to-device 恢复，不是布局转置；与 TASK-014 的 solver 总时间比较时只能使用 solver-only 列。

独立 GPT-5.6-sol/high 审查确认：TASK-014 是“两次独立预热进程，然后五个无进程内排除的正式进程”；本回执却在每个正式进程内排除了 2 次 warmup，口径偏向 cuSPARSE，且 solver/e2e CV 为 `17.31%/12.51%`。因此本组性能比值作废，不得与 TASK-014 写成公平对比；修订脚本后将在新 SHA 和新证据目录重跑。API 可用性与两个正确性结果仍有效。

## 原始证据

- `environment.txt`：SHA、编译器、CUDA/cuSPARSE 符号、GPU/驱动；
- `build.log`：adapter 干净重建；
- `correctness-exact1.log`、`correctness-manufactured.log`：两个独立正确性入口；
- `formal-manufactured-run1.log` 至 `run5.log`：五次完整输出；
- `formal-runs.csv`：五行原始数据；
- `formal-stats.txt`：中位数、均值和 CV。

## 人工复验

从 WSL 的源码根目录运行：

```bash
export NVARCH=Linux_x86_64
export NVCOMPILERS=/opt/nvidia/hpc_sdk/$NVARCH/24.11
export PATH=$NVCOMPILERS/compilers/bin:$PATH
bash verify/run_task_022_cusparse.sh \
  "$PWD/verify/logs/TASK-022-$(date +%Y%m%d-%H%M%S)"
```

预期：脚本最后输出 `TASK-022 PASS`，两个正确性日志及五个正式日志均存在，`formal-runs.csv` 有 5 行数据且三项误差/残差均不超过 `1e-10`。失败时保存整个输出目录，不要只截最后一行。

## 未覆盖与停止条件

- 仅覆盖 RTX 4060 Laptop、CUDA 12.6、一个 `64×64×1024` FP64 输入；
- cuSPARSE QR 与 PaScaL 无 pivot 消元算法不同；
- 不支持多 GPU comparator 或强/弱扩展结论；
- 本回执的性能口径已被独立审查否决；新回执通过前 TASK-022/TASK-014 均不得标记 done。
