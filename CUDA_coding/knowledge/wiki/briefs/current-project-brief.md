---
id: KB-BRIEF-001
type: brief
status: reviewed
updated: 2026-08-17
source_ids: [SRC-001, SRC-002, SRC-003, SRC-004, SRC-005]
---

# 当前项目压缩上下文

> 本页用于两个月计划、论文和跨模块项目管理。普通五对角编码请改读 [[penta-active-context]]，避免加载不相关的全项目材料。

## 目标

两个月内交付可信的 CUDA Fortran + MPI 五对角求解器研究版本、28→22 通信裁剪、真实多 GPU 实验、Poisson/Helmholtz 集成 demo 和论文全文。

## 已有资产

- 三对角 PaScaL_TDMA 2.1 基线；
- 五对角 Fortran/MPI/CUDA 扩展；
- 七项独立 Node 验证；
- 一般半带宽 `m=1..6` 的理论/递推验证；
- benchmark、历史 CSV、绘图和 Slurm 脚本。

## 当前可信结论

- 28 槽独立通信模型 756 组通过；
- 一般公式给出五对角结构裁剪目标 28→22，不是 18；
- TASK-001 已通过 WSL2/NVHPC/OpenMPI 干净构建和 `np=1/2` 回归；
- TASK-004/005/008 已完成 API 防护、22 槽独立映射和索引上界验证；
- 历史单卡多 rank 数据只可作开发基线，不能证明多 GPU scaling。

## 当前阻断

- TASK-002A 的上游 commit/diff/贡献边界与 TASK-002B 的 LICENSE/NOTICE 未固化；
- TASK-013/014/017 尚未关闭新颖性/外部基线、28 槽论文级 baseline 和真实多 GPU 环境前置；TASK-006 因此 blocked；
- 原申报书目标大于现有源码，需要最小 PPE 集成和导师确认范围。

## 本任务上下文路由

- P0 修复：读根 `AGENTS.md`、[[penta-active-context]]、数据所有权页、目标函数片段和测试矩阵；
- 28→22：再读 `verify/mband_theory.md` 和论文主张矩阵；
- 性能：再读 EXP-000、benchmark 协议和对应 CSV；
- 论文：只从状态为“已支持”的主张写结果。
- 当前唯一建议下一任务：TASK-002A；不要越过红队 Gate 直接实施 TASK-006。
