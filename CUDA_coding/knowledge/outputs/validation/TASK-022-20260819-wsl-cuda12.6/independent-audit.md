# TASK-022 首组证据独立审查

审查模型：GPT-5.6-sol  
推理强度：high  
角色：未参与 adapter 实现的只读审查者  
结论：`conditional`；不允许 TASK-022 标记 `done`

## 通过项

- `row*batch_count+system` 的交错索引、五条对角边界零项、`algo=0` QR、workspace 和 CUDA event 顺序正确；
- exact1/manufactured 与 TASK-014 的有效数学矩阵和制造解一致；两案解误差和残差均低于 `1e-10`；
- 五次 CSV 与统计可复核：solver 中位数 `5.767475176 ms`、CV `17.306226%`，restore+solver 中位数 `8.062703991 ms`、CV `12.514826%`；
- CUDA/cuSPARSE、GPU、驱动和提交 SHA 可追溯；现有 Fortran/benchmark 没有因 adapter 改动。

## 阻断问题

TASK-014 使用“两次独立预热进程，然后五个正式进程”；首组 TASK-022 在每个正式进程内排除两次 warmup，系统性偏向 cuSPARSE。首样本明显高于后四次也表明状态未稳定。因此本组性能数据不得用于 PaScaL/cuSPARSE 快慢或速度比结论。

## 最小整改

1. 正式段前单独运行两个 `manufactured 10 0` 预热进程；
2. 五个正式进程全部使用 `iterations=10,warmups=0`，在新 SHA 和新目录重跑；
3. 增加 IQR/MAD，明确 solver-only 与 restore-plus-solver；
4. 新证据通过复审后，再更新 TASK-014、claim-evidence-matrix 和任务解除快照。

## 当前措辞边界

当前只允许写：“cuSPARSE 单 GPU FP64 外部锚点已通过 exact1/manufactured 正确性门。”禁止比较快慢、称其为分布式/多 GPU comparator，或据此声称扩展性、最优性和首次性。
