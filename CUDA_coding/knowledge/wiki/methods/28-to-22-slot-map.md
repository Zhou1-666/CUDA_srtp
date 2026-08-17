---
id: KB-METHOD-003
type: method
status: draft
confidence: high
source_ids: [SRC-003, SRC-004]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 五对角 28→22 槽位候选映射

> 状态：理论和结构统计支持；Fortran 22 槽路径尚未实现。本页不能用于声称优化已完成。

## 原理

当前每方程 7 个传输槽已省恒等对角。对 `m=2`，四条边界方程还有 6 个结构恒零槽：

| 方程 | 当前 7 槽 | 结构恒零 | 保留数 |
| --- | --- | --- | ---: |
| e0/x0 | `L3 L2 L1 U1 U2 U3 RHS` | `L3` | 6 |
| e1/x1 | 同上 | `L3,U3` | 5 |
| e2/xN-2 | 同上 | `L3,U3` | 5 |
| e3/xN-1 | 同上 | `U3` | 6 |

总数 `6+5+5+6=22`。

## 逐槽候选映射

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

## 实现策略建议

第一版保留 28 槽路径作为 baseline，通过编译开关或独立 API 选择 22 槽。先写独立 JS 22 槽 pack/unpack 等价测试，再修改 Fortran。

建议不要强迫通用 `pascalpack` 理解变长方程；可选方案：

1. S1 仍产生 28 槽，新增 `pack22` 按常量映射裁剪；改动小但多一次读取/pack 逻辑；
2. S1 直接产生 22 槽，减少存储但与消元耦合更强；
3. 用映射表驱动通用核，可扩展一般 `m`，但有额外索引成本。

第一轮推荐方案 1，用正确性与 profiler 决定是否融合到 S1。

## 必须修改

- `rd`/forward buffer 的第二维与 count 从 28 改 22；
- forward gather/subsize/displacement；
- forward pack 与 unpack；
- unpack 恢复 `D=1` 和 6 个结构零；
- profiled solver 与普通 solver 保持同一布局；
- CSV/日志记录 `forward_slots=22`，避免只靠版本名称推断。

`Atr` 仍保持每方程 8 槽，即每 rank 32 槽；backward 仍为 4 个接口解。因此 28→22 只改变 forward 缩约数据路径。

## 验收

- 22 槽 pack→unpack 得到与 28 槽相同 `Atr`；
- 随机、exact1、manufactured 和 `Nrow=5/6` 通过；
- `np=1/2/4`、不均匀线分区通过；
- forward MPI count 从 `28×lines` 变为 `22×lines`；
- 精度阈值不放宽；
- 分别报告 pack、MPI 和 total，不能把槽数下降直接写成时间下降 21%。

## 相关

- [[penta-data-layout]]
- [[general-m-reduction]]
- [[../testing/test-matrix]]
- [[../paper/claim-evidence-matrix]]

