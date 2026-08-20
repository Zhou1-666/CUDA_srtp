# BSCC-N32-H A100 smoke：用户终端转录

> 说明：以下为 2026-08-19 用户提供的终端输出转录；有效通过尝试在同一 `srun` 命令内打印 benchmark 退出码。

## 环境

```text
host=paraai-n32-h-01-agent-68
cuda_visible_devices=0
NVIDIA A100-PCIE-40GB, GPU-62b343c5-de91-dc05-4292-a7eaf5518a65, 535.104.12, 40960 MiB

nvfortran 24.5-1 linuxarm64 target on aarch64 Linux -tp tsv110
NVIDIA Compilers and Tools
mpirun (Open MPI) 3.1.5
```

## 干净 release 构建

```text
make veryclean
mpifort -O3 -cuda -module . -I. -c precision.f90 -o precision.o
mpifort -O3 -cuda -module . -I. -c parallel.f90 -o parallel.o
mpifort -O3 -cuda -module . -I. -c bench_kernels.f90 -o bench_kernels.o
mpifort -O3 -cuda -module . -I. -c ../src/PaScaL_TDMA_cuda_penta.f90 -o ../src/PaScaL_TDMA_cuda_penta.o
mpifort -O3 -cuda -module . -I. -c polydiagonal.f90 -o polydiagonal.o
mpifort -O3 -cuda -module . -I. -c ref_pentadiagonal.f90 -o ref_pentadiagonal.o
mpifort -O3 -cuda -module . -I. -c benchmark_penta.f90 -o benchmark_penta.o
mpifort -O3 -cuda -module . -I. -o benchmark_penta ...
```

## 有效 smoke

```text
==== PaScaL-TDMA 五对角验证 (vs 对照组) ====
config : 256x256x1024   np = 1
case   : manufactured
solver     avg_time(s)  err_rms       err_linf      cross_err
 exp         7.5768E-03    1.4532E-13    1.9662E-13    0.0000E+00
 serial      7.2713E-02    1.4532E-13    1.9662E-13    0.0000E+00
benchmark_exit_code=0
```

## 作业释放

```text
salloc: Job allocation 1433881 has been revoked.
```
