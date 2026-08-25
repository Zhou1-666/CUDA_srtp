---
id: ADR-007
type: decision
status: draft
confidence: high
source_ids: [SRC-001, SRC-003P]
compiled_at: 2026-08-25
updated: 2026-08-25
---

# ADR-007：TASK-010 采用独立 Poisson/Helmholtz 制造解 demo

## 决策

TASK-010 不再等待未提供的 CFD/FFT 宿主接口，采用独立制造解 demo 建立最小应用闭环。demo 同时覆盖 `-u_zz + lambda*u = f` 的 Poisson（`lambda=0`）和 Helmholtz（`lambda=1`），以二维批量、沿 `z` 的分布式五对角线求解调用现有 CUDA Fortran + MPI 接口。

完整离散、边界、制造解、I/O、错误处理与验证合同见 [TASK-010 设计](../../outputs/designs/TASK-010-20260825-poisson-helmholtz-manufactured-design.md)。

## 理由

仓库已经具有可复验的分布式五对角求解器，但现有示例只验证代数系统，没有把连续 PDE、离散矩阵、解析真值和网格收敛连成闭环。独立 demo 能以最小范围补齐应用证据，同时避免在缺少宿主代码时从零构造完整 CFD、FFT 或三维迭代器。

## 冻结边界

- 制造解：`u=(1+x+y)*sin(pi*z)`；
- 方程：`-u_zz + lambda*u = f`，`lambda in {0,1}`；
- 离散：四阶五点中心差分，端点齐次 Dirichlet，邻边界使用制造解幽灵点移项；
- 验证：FP64，`Nz=32,64,128,256`，`np=1/2`，28/22 槽；
- Gate：`residual_linf <= 1e-10`，最后两次加密的 `L2/Linf` 观测阶均 `>=3.8`；
- 求解计时只作元数据，不构成性能提升证据。

## 后果

- 允许在设计复核和实施计划批准后领取 TASK-010；
- 新增独立示例、构建目标和验证脚本，不修改求解器核心数值算法；
- 结果只能表述为 Poisson/Helmholtz 线求解核心验证，不能表述为完整 CFD、FFT、GMG、ADI、PPE 或通用边界模块；
- TASK-010 在目标环境端到端回归完成前不得标为 `done`。
