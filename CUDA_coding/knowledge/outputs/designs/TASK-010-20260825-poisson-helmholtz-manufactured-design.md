---
id: TASK-010-DESIGN-20260825
type: design
status: draft
confidence: high
source_ids: [SRC-001, SRC-003P]
created: 2026-08-25
updated: 2026-08-25
---

# TASK-010 Poisson/Helmholtz 制造解集成设计

## 决策状态

项目负责人于 2026-08-25 批准 TASK-010 采用独立制造解 demo 路线，同时覆盖 Poisson 与 Helmholtz。该决定解除“宿主接口或独立 demo 未选择”的范围阻塞，但不代表实现、目标环境验证或任务完成。

## 目标

建立一个可复验的最小 PDE 应用闭环：从解析制造解生成连续右端项，经四阶五点差分形成沿 `z` 方向的五对角线性系统，调用现有 CUDA Fortran + MPI 五对角求解器，并报告解析误差、离散残差和网格收敛阶。

本任务证明求解器可作为 Poisson/Helmholtz 线求解核心，不构造完整 CFD、FFT、ADI、PPE 或三维迭代求解器，也不以本任务产生性能提升主张。

## 连续问题与制造解

在 `z in [0,1]` 上求解批量的一维问题

```text
-u_zz + lambda*u = f,
u(x,y,0) = u(x,y,1) = 0.
```

其中 `x,y` 只标识独立批量线，不参与微分。冻结制造解为

```text
u(x,y,z) = (1 + x + y) * sin(pi*z),
f(x,y,z) = (pi^2 + lambda) * u(x,y,z).
```

固定验证两种参数：

- Poisson：`lambda = 0`；
- Helmholtz：`lambda = 1`。

批量索引使用 `x=(ix+1)/(Nx+1)`、`y=(iy+1)/(Ny+1)`，其中 `ix=0..Nx-1`、`iy=0..Ny-1`。不同 `x,y` 位置具有不同幅值，避免所有批量线退化为完全相同的数据。

## 离散与边界合同

令 `h = 1/(Nz-1)`。对内部网格使用四阶五点中心差分，并将方程乘以 `12*h^2`，得到

```text
u[j-2] - 16*u[j-1] + (30 + 12*h^2*lambda)*u[j]
        - 16*u[j+1] + u[j+2] = 12*h^2*f[j].
```

这对应五对角数组 `A,B,C,D,E = 1,-16,30+12*h^2*lambda,-16,1`。

- `j=0` 和 `j=Nz-1` 使用单位行施加齐次 Dirichlet 值；
- `j=1` 和 `j=Nz-2` 缺失的一个幽灵点由冻结制造解给出，并移入右端项；
- 该幽灵点处理是制造解验证闭合方式，不宣称为通用边界条件模块；
- MPI 仅沿 `z` 分解，必须保证每个 rank 的本地 `Nrow >= 5`。

## 架构与文件边界

采用独立 demo，不扩展现有基础示例，不进入 `perf_bench`，不修改三对角源码。

计划新增或最小修改：

- `examples/ex_penta_poisson_helmholtz.f90`：参数解析、制造解、矩阵装配、GPU/MPI 求解和单用例指标；
- `examples/Makefile`：增加独立构建目标；
- `verify/task010_manufactured_audit.js`：不调用生产求解器的公式、边界和收敛判据审计；
- `verify/run_task_010_manufactured.sh`：干净构建并运行冻结验证矩阵；
- TASK-010 的 ADR、测试矩阵、任务台账和目标环境验证回执。

明确禁止：

- 修改 `src/PaScaL_TDMA_cuda_penta.f90` 的数值算法或通信布局；
- 顺带实现 FFT、GMG、ADI、完整三维 Poisson 迭代或性能优化；
- 修改冻结的三对角参考实现；
- 把 demo 计时解释为相对加速。

## 单用例数据流

1. 从命令行读取 `Nx Ny Nz lambda`，从既有 `PENTA_FORWARD_SLOTS` 环境变量读取 28/22 槽模式。
2. 初始化 MPI，按 `z` 划分全局网格，并按现有规则选择 GPU。
3. 在主机端生成坐标、解析解、原始系数和原始右端项。
4. 将工作副本传至 GPU；创建 plan；仅对 `pascal_solver` 调用计时。
5. 将求解结果拷回主机，计算解析 `L2` 与 `Linf` 误差。
6. 对本任务的小规模验证场使用 `MPI_Gatherv` 汇集到 rank 0，按原始离散方程独立重算 `residual_linf`；汇集与指标计算不计入求解时间。
7. 清理 plan 与数组，输出一行稳定 CSV，并以明确退出码结束。

求解器会原位覆盖系数和 RHS；demo 必须保留用于残差重算的主机端原始数据，不能在求解后把设备工作副本当作原矩阵。

## 输入输出合同

单次运行形式冻结为：

```text
ex_penta_poisson_helmholtz Nx Ny Nz lambda
```

正式验证固定 `Nx=16, Ny=8`，`Nz=32,64,128,256`。每次成功运行输出一次表头和一行：

```text
pde,lambda,nranks,nx,ny,nz,forward_slots,l2_error,linf_error,residual_linf,solver_s_max
```

- `pde` 在 `lambda=0` 时为 `poisson`，在 `lambda=1` 时为 `helmholtz`；
- `l2_error` 定义为全局全部 `Nx*Ny*Nz` 网格点前向误差的 RMS，`linf_error` 为其最大绝对值；
- `residual_linf` 是缩放后五对角离散方程的最大绝对残差；
- `solver_s_max` 是各 rank 求解窗口的最大值，只作运行元数据；
- 调试文字不得伪装成 CSV；自动验证器只消费带固定表头的数据行。

## 错误处理

以下情况必须给出可定位信息并非零退出：

- 参数数量或数值非法；
- `Nx <= 0`、`Ny <= 0`、`Nz < 5*nprocs`，或 `lambda` 不是精确的 `0`/`1`；
- 任一 rank 本地 `Nrow < 5`；
- MPI、CUDA、分配或 plan/solver 调用失败；
- 指标中出现 `NaN` 或 `Inf`；
- 自动验证未找到完整 CSV、某用例缺失或数值门未通过。

生产求解器已有的致命错误合同保持不变；demo 不捕获后继续运行。

## 验证矩阵与通过门槛

### 无 GPU 独立审计

Node 审计器独立检查：

- 五点系数和缩放后的连续右端项；
- 两端单位行及邻边界幽灵点移项；
- 将缩放残差除以 `12*h^2` 后，解析采样在 `Nz=32,64,128,256` 上呈现四阶连续算子缺陷趋势；
- CSV 解析、缺用例和阈值失败路径。

### NVHPC + MPI + GPU 端到端回归

正式矩阵为：

```text
lambda in {0,1}
nranks in {1,2}
forward_slots in {28,22}
Nz in {32,64,128,256}
```

共 32 个用例，全部使用 FP64、`Nx=16`、`Ny=8`。要求：

- 所有进程和 runner 退出码为 0；
- 每个用例 `residual_linf <= 1e-10`；
- 观测阶按 `log(error_coarse/error_fine)/log(h_coarse/h_fine)` 计算；Poisson 与 Helmholtz 在每组 `nranks/forward_slots` 下，`64->128` 与 `128->256` 两次加密的 `L2` 和 `Linf` 观测阶均 `>= 3.8`；
- 28 与 22 槽分别通过相同解析真值和残差门；向量级 28/22 等价性引用 TASK-006 的既有证据，不在本任务导出完整场重复证明；
- `np=1/2` 结果不得因 rank 数变化而越过上述误差门。

## 证据与完成定义

目标环境回执必须保存：

- 代码 SHA 和 dirty 状态；
- GPU、驱动、NVHPC、CUDA、MPI 版本及 rank/GPU 映射；
- 干净构建日志；
- 32 个原始 CSV 用例及自动汇总；
- SHA-256 清单；
- 未覆盖范围和失败尝试。

只有独立审计通过、目标环境干净构建、32 个端到端用例全部通过、ADR/测试矩阵/任务台账完成同步后，TASK-010 才能标为 `done`。在此之前只能为 `ready`、`in-progress` 或 `review`。

## 已批准的设计决定

2026-08-25 当前会话依次批准：

1. 采用独立 demo，不等待 CFD/FFT 宿主；
2. 同时覆盖 Poisson 与 Helmholtz；
3. 使用二维批量、沿 `z` 方向的分布式线求解；
4. 使用上述制造解、齐次 Dirichlet 和制造解幽灵点闭合；
5. 使用四级网格、四阶门、残差门以及 28/22、`np=1/2` 验证；
6. 新增独立示例与验证脚本，不修改求解器核心；
7. 采用上述数据流、CSV、错误处理和证据合同。
