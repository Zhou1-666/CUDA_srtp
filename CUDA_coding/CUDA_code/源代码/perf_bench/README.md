# perf_bench — 五对角求解器性能/精度对比基准

对比**实验组**（`PaScaL_TDMA_cuda_penta`，28 槽通信）与**对照组**（论文原版
`ref_pentadiagonal.f90`）以及**串行基线**（`pentadiagonal_serial_cuda`）。

## 目录结构

```
perf_bench/
  precision.f90          对照组依赖: 精度模块 (WP = 双精度)
  parallel.f90           对照组依赖: MPI 拓扑模块 (z 方向 1D, 非周期)
  ref_pentadiagonal.f90  对照组源 (control group/pentadiagonal.f90 的拷贝, 未改动)
  polydiagonal.f90       对照组缩约系统 (11 对角) 串行求解 + 周期桩
  bench_kernels.f90      设备初始化核 (x≡1 精确解系统)
  benchmark_penta.f90    基准驱动 (exp + ref + serial, CSV 输出)
  Makefile / run_sweep.sh
  plot_performance.py / plot_accuracy.py
```

## 构建 (VM, nvfortran + MPI)

```bash
cd perf_bench
make                       # 默认 -cuda (与本机 HPC SDK 兼容, 见下)
# 若需指定计算能力: make CUDAFLAG="-cuda -gpu=cc89"
# 若 FC 不是 mpif90: make FC="nvfortran -Mmpi"
```

> 注意: 本机 NVHPC 24.1 未随附 CUDA 11.8, 而 `-gpu=ccXX` 会触发该版本检查
> 导致失败。故默认只传 `-cuda` (nvfortran 用默认计算能力, 已在 RTX 4060 实测可用)。

## 运行

```bash
# 快速冒烟 (np=1/2/4, 验证正确性 + 少量规模)
STUDY_PRESET=quick ./run_sweep.sh

# 完整强/弱扩展扫描 (np∈{1,2,4,8}, 多个规模)
STUDY_PRESET=strong ITERATIONS=10 ./run_sweep.sh
STUDY_PRESET=weak   ITERATIONS=10 ./run_sweep.sh

# 自定义矩阵
STUDY_PRESET=custom NP_LIST="1 2 4 8" SIZE_LIST="128,128,2048 256,128,2048" ./run_sweep.sh

# 单个用例 (默认 x≡1 精确解)
mpirun -np 4 ./benchmark_penta 128 128 2048 10

# 制造解用例 (已知正确结果 x_true, 非平凡场):
#   PENTA_TEST_CASE=manufactured 时, RHS 由 x_true 构造, 两求解器都应机器精度复现
PENTA_TEST_CASE=manufactured mpirun -np 4 ./benchmark_penta 128 128 2048 10
```

每次运行 rank 0 会在屏幕打印验证汇总表:

```
==== PaScaL-TDMA 五对角验证 (vs 对照组) ====
config : 128x128x2048   np = 4
case   : manufactured
solver     avg_time(s)  err_rms       err_linf      cross_err
 exp         0.0543      8.2e-13       1.2e-12       1.4e-12
 ref         0.1426      1.6e-13       2.2e-13       1.4e-12
```

输出: `<时间戳>_penta_perf.csv` (性能+精度, rank 0 stdout 收集)、`<时间戳>_penta_env.txt` (环境探测)。

## 可视化

```bash
pip install pandas numpy matplotlib
python3 plot_performance.py <时间戳>_penta_perf.csv
python3 plot_accuracy.py    <时间戳>_penta_perf.csv
```

## CSV 列说明

| 列 | 含义 |
|---|---|
| solver / implementation | `penta` / `exp`·`ref`·`serial` |
| nranks, n1, n2, n3, nsys | rank 数, 规模, 线数 |
| total_s_max / total_s_avg | 各 rank 墙钟最大值 / 平均 (每次迭代) |
| local_compute_s_max 等 | exp 分阶段计时 (S1 消元 / 打包 / MPI / 解包 / 缩约求解 / 回传 / 回带) |
| compute_s_max / communication_s_max / packing_s_max | exp 聚合: 计算 / 通信 / 打包 |
| err_rms, err_linf | exp/ref 相对精确解 x≡1 的 RMS(L2) 与 ∞ 范数误差 |
| cross_err_max | exp vs ref 逐点互差最大值 |

注: ref/serial 为整段计时 (对照组未改动, 无阶段分解), 其阶段列为 0。
