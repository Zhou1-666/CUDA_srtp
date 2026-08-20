---
id: KB-BRIEF-001
type: brief
status: reviewed
updated: 2026-08-20
confidence: high
source_ids: [SRC-001, SRC-002, SRC-003, SRC-004, SRC-005, SRC-007, SRC-014]
---

# 当前项目压缩上下文

> 本页用于两个月计划、论文和跨模块项目管理。普通五对角编码请改读 [[penta-active-context]]，避免加载不相关的全项目材料。

## 目标

两个月内交付可信的 CUDA Fortran + MPI 五对角求解器研究版本、28→22 通信裁剪、真实多 GPU 实验、Poisson/Helmholtz 集成 demo 和论文全文。

## 已有资产

- 三对角 PaScaL_TDMA 2.1 基线；
- 五对角 Fortran/MPI/CUDA 扩展；
- 八项独立 Node 验证；
- 一般半带宽 `m=1..6` 的理论/递推验证；
- benchmark、历史 CSV、绘图和 Slurm 脚本。

## 当前可信结论

- 28 槽独立通信模型 756 组通过；
- 一般公式给出五对角结构裁剪目标 28→22，不是 18；
- TASK-001 已通过 WSL2/NVHPC/OpenMPI 干净构建和 `np=1/2` 回归；
- TASK-004/005/008 已完成 API 防护、22 槽独立映射和索引上界验证；
- TASK-002A 已完成：上游差异与导师来源/贡献边界确认均已归档；TASK-013 已完成技术审计、辅助补查和周一涵独立审阅；
- TASK-014/015/017/018/022 已完成各自限定范围的构建、正确性、容量或外部基线证据；历史单卡多 rank 数据仍不能证明多 GPU scaling。
- TASK-006 已在 `faffee3` 实现默认兼容的 28/22 可切换 Fortran 路径；NVHPC API 18/18、profiled 20/20、普通入口 2/2 与 TASK-016 动态/生命周期 Gate 均通过。

## 当前阻断

- TASK-002B 的“私有研发源码、公开论文”NOTICE 与引用清单草案，仍待导师/权利人复核；不得公开源码；
- TASK-006/016 均为 `done`；28/22 各 100 次 `np=2` 生命周期通过，两布局 memcheck/initcheck 的两个 rank 均为 0 errors；
- 原申报书目标大于现有源码，需要最小 PPE 集成和导师确认范围。

## 本任务上下文路由

- P0 修复：读根 `AGENTS.md`、[[penta-active-context]]、数据所有权页、目标函数片段和测试矩阵；
- 28→22：再读 `verify/mband_theory.md` 和论文主张矩阵；
- 性能：再读 EXP-000、benchmark 协议和对应 CSV；
- 论文：只从状态为“已支持”的主张写结果。
- 当前技术最小动作：等待项目负责人明确领取 TASK-009 的 A100 正式扩展实验；发布线仍由导师/权利人复核 TASK-002B 私有范围与引用草案。
