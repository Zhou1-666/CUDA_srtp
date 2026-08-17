########################################################################
# perf_bench/Makefile
#
# 五对角求解器性能/精度对比基准构建。
#
#   - FC         : MPI 包装的 nvfortran (如 mpif90 / nvfortran -Mmpi)
#   - CUDA_ARCH  : GPU 计算能力, 默认 80 (A100/RTX 30 系列), 按需改
#   - CUDAFLAG   : CUDA Fortran 编译选项
#
# 依赖:
#   - ../src/PaScaL_TDMA_cuda_penta.f90   (实验组, 含 profiled 入口)
#   - ref_pentadiagonal.f90               (对照组拷贝, 源同 control group/)
#   - precision.f90 / parallel.f90        (对照组依赖模块, 本目录新写)
#   - polydiagonal.f90                    (缩约 11 对角求解 + 周期桩)
#   - bench_kernels.f90, benchmark_penta.f90
########################################################################

FC        = mpif90
OPT       ?= -O3
# 默认仅 -cuda: 与本机 HPC SDK (nvfortran 24.1, 无配套 CUDA 11.8) 兼容。
# 若需指定计算能力, 用命令行覆盖, 例如:
#   make CUDAFLAG="-cuda -gpu=cc89"
CUDAFLAG  ?= -cuda
FFLAGS     = $(OPT) $(CUDAFLAG) -module . -I.

PENTA_SRC  = ../src/PaScaL_TDMA_cuda_penta.f90
PENTA_OBJ  = ../src/PaScaL_TDMA_cuda_penta.o

OBJS = precision.o parallel.o bench_kernels.o \
       $(PENTA_OBJ) polydiagonal.o ref_pentadiagonal.o benchmark_penta.o

EXE = benchmark_penta

.PHONY: all clean veryclean

all: $(EXE)

$(EXE): $(OBJS)
	$(FC) $(FFLAGS) -o $@ $(OBJS)

precision.o: precision.f90
	$(FC) $(FFLAGS) -c $< -o $@

parallel.o: parallel.f90 precision.o
	$(FC) $(FFLAGS) -c $< -o $@

bench_kernels.o: bench_kernels.f90
	$(FC) $(FFLAGS) -c $< -o $@

$(PENTA_OBJ): $(PENTA_SRC)
	$(FC) $(FFLAGS) -c $< -o $@

polydiagonal.o: polydiagonal.f90 precision.o
	$(FC) $(FFLAGS) -c $< -o $@

ref_pentadiagonal.o: ref_pentadiagonal.f90 precision.o parallel.o
	$(FC) $(FFLAGS) -c $< -o $@

benchmark_penta.o: benchmark_penta.f90 precision.o parallel.o bench_kernels.o $(PENTA_OBJ)
	$(FC) $(FFLAGS) -c $< -o $@

clean:
	rm -f *.o *.mod
	rm -f ../src/PaScaL_TDMA_cuda_penta.o ../src/*.mod

veryclean: clean
	rm -f $(EXE)
