---
id: EXP-001
type: experiment
status: draft
confidence: high
source_ids: [SRC-003P, SRC-004]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# EXP-001：28→22 布局独立等价验证

## 问题

五对角每条线的四个边界方程当前各传 7 槽，共 28 槽。若删除六个结构恒零槽，22 槽数据能否无损恢复相同的 28 槽和每 rank 32 槽缩约矩阵块？

## 方法

运行 `node verify/penta_comm_22_verify.js`。脚本独立实现固定映射、列主序子块 pack、line 分区和 28/22 两种 unpack；不调用 Fortran 或现有消元求解器。

配置覆盖：

- rank 数 `P=1/2/3/4/7/8`；
- `Nsys=P`、`P+1`、`2P+3`，包含平衡与不均匀分区；
- 5 个种子；marker 与随机两类数据；
- 四方程保留槽数 `6+5+5+6`。

此外逐个篡改 22 个保留槽，并逐个把 6 个结构零槽设为非零，确认测试能发现错误而不是只做同源自洽比较。

## 结果

| 项目 | 结果 |
| --- | ---: |
| 配置数 | 180 |
| `rd28` round-trip 逐槽检查 | 188,160 |
| `Atr32` 逐槽检查 | 215,040 |
| 故障注入 | 28/28 被检测 |
| 失败 | 0 |

## 支持的结论

在六个被裁剪位置确为零的前提下，候选固定映射是无损的；22 槽 unpack 可以恢复与 28 槽路径逐槽相同的 32 槽 `Atr`。元素数口径上，forward 为 `28→22`，下降约 21.4%；加上不变的 4 槽 backward 后为 `32→26`，下降 18.75%。

## 不支持的结论

- 没有证明当前 Fortran S1 在所有输入上都满足结构零约束；
- 没有实现或验证 CUDA/MPI 22 槽路径；
- 没有测量通信字节、通信时间或端到端时间；
- 不能据此声称性能提升 21.4% 或 18.75%。

## 证据

- `verify/penta_comm_22_verify.js`
- `knowledge/outputs/validation/TASK-005-20260817-node/README.md`
- [[../methods/28-to-22-slot-map]]
- [[../paper/claim-evidence-matrix]]
