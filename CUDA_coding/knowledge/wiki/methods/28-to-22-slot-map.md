---
id: KB-METHOD-003
type: method
status: draft
confidence: high
source_ids: [SRC-003, SRC-004]
compiled_at: 2026-08-17
updated: 2026-08-20
---

# 五对角 28→22 前向槽位映射

> 状态：TASK-006 已在 `faffee3` 实现 28/22 可切换 Fortran 路径，并完成 NVHPC L2–L4；TASK-016 的动态内存与各 100 次生命周期 Gate 也已通过。两任务均为 `done`，但仍没有性能收益结论。

## 原理

当前每方程 7 个传输槽已省恒等对角。对 `m=2`，四条边界方程还有 6 个结构恒零槽：

| 方程 | 当前 7 槽 | 结构恒零 | 保留数 |
| --- | --- | --- | ---: |
| e0/x0 | `L3 L2 L1 U1 U2 U3 RHS` | `L3` | 6 |
| e1/x1 | 同上 | `L3,U3` | 5 |
| e2/xN-2 | 同上 | `L3,U3` | 5 |
| e3/xN-1 | 同上 | `U3` | 6 |

总数 `6+5+5+6=22`。

## 逐槽固定映射

原始 `rd(line,0:27)` 到紧凑 22 槽：

| compact 范围 | 方程 | 保留的原始 rd 索引 | 恢复到 8 槽 |
| --- | --- | --- | --- |
| 0..5 | e0 | `1,2,3,4,5,6` | `L3=0,D=1`，其余顺序填回 |
| 6..10 | e1 | `8,9,10,11,13` | `L3=0,U3=0,D=1` |
| 11..15 | e2 | `15,16,17,18,20` | `L3=0,U3=0,D=1` |
| 16..21 | e3 | `21,22,23,24,25,27` | `U3=0,D=1` |

展开的 compact 语义：

```text
e0: [L2,L1,U1,U2,U3,RHS]
e1: [L2,L1,U1,U2,RHS]
e2: [L2,L1,U1,U2,RHS]
e3: [L3,L2,L1,U1,U2,RHS]
```

## 已选实现策略

第一版保留 28 槽路径作为默认 baseline，通过 `pascal_plan_create` 的末尾可选参数选择 22 槽。旧调用不传参数时仍为 28，benchmark 通过 `PENTA_FORWARD_SLOTS=28|22` 选择。

建议不要强迫通用 `pascalpack` 理解变长方程；可选方案：

1. S1 仍产生 28 槽，新增 `pack22` 按常量映射裁剪；改动小但多一次读取/pack 逻辑；
2. S1 直接产生 22 槽，减少存储但与消元耦合更强；
3. 用映射表驱动通用核，可扩展一般 `m`，但有额外索引成本。

TASK-006 采用方案 1：`rd` 仍是规范的 `Nsys×28` S1 输出；`pascalpack_penta22` 读取固定 22 槽，`pascalunpack_penta22` 恢复完整 `Atr` 的 32 槽。是否融合到 S1 必须另立任务并重新测量，不能在本任务推断。

## TASK-005 独立验证

`verify/penta_comm_22_verify.js` 不调用消元求解器，只验证布局合同。它模拟按列 pack、平衡/不均匀 line 分区、多来源 rank 组装和两种 unpack：

- 180 组配置，覆盖 `P=1/2/3/4/7/8`、`Nsys=P/P+1/2P+3`、marker/random 数据；
- `rd28 → pack22 → rd28` 逐槽检查 188,160 次；
- 28 槽与 22 槽组装的 `Atr32` 逐槽检查 215,040 次；
- 22 个保留槽逐个篡改均被检测；6 个结构零槽逐个置非零均被拒绝；
- 失败数为 0。

这使“固定映射在合法结构输入上无损”获得独立脚本证据；TASK-006 又覆盖了 CUDA kernel、MPI count 描述符和数值解，但实际 MPI 字节统计及性能仍等待 TASK-009。

## Fortran 实现合同

- `rd` 保留 28 槽，避免把 S1 数值消元重写混入布局任务；
- forward buffer、send/recv count 与 displacement 按 `plan%forward_slots` 取 28 或 22；
- 22 槽 pack 使用本页固定映射，unpack 恢复 `D=1` 和 6 个结构零；
- profiled solver 与普通 solver 使用相同分支；
- CSV/日志显式记录 `forward_slots`，避免只靠版本名称推断。

`Atr` 仍保持每方程 8 槽，即每 rank 32 槽；backward 仍为 4 个接口解。因此 28→22 只改变 forward 缩约数据路径。

## 验收

- 独立布局层：22 槽 pack→unpack 得到与 28 槽相同 `Atr`（TASK-005 已通过）；
- 随机、exact1、manufactured 和 `Nrow=5/6` 通过；
- `np=1/2/4`、不均匀线分区通过；
- forward MPI count 从 `28×lines` 变为 `22×lines`；
- 精度阈值不放宽；
- 分别报告 pack、MPI 和 total，不能把槽数下降直接写成时间下降 21%。

TASK-006 已通过布局、数值与配置回归：NVHPC 24.11/OpenMPI 4.1.5 干净构建，API 18/18，profiled 入口 20/20，普通入口 28/22 各一次且最大误差均为 `2.0073e-13`；profiled 两模式最大 RMS/L∞/cross 分别为 `4.336e-16/6.661e-16/1.776e-15`。TASK-016 又完成两布局各 100 次生命周期及 memcheck/initcheck。单 GPU 多 rank 日志仍不支持多 GPU或性能结论。

## 相关

- [[penta-data-layout]]
- [[general-m-reduction]]
- [[../testing/test-matrix]]
- [[../paper/claim-evidence-matrix]]
