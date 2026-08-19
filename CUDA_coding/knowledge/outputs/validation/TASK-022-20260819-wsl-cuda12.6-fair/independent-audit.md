# TASK-022 最终独立复审

日期：2026-08-19

审查模型：GPT-5.6-sol

推理强度：high

结论：`PASS`

## 核对范围

- 实验提交、环境、adapter/runner 与目标文件工作树状态；
- cuSPARSE interleaved 布局、边界槽、QR API、workspace、原位 RHS 和 CUDA event 口径；
- exact1/manufactured 输入与项目五对角输入的一致性；
- 两次独立预热、五次正式启动和原始 CSV 是否隔离；
- 中位数、均值、CV、type-7 IQR 和未缩放 MAD 的独立复算；
- 与 TASK-014 的固定配置、代码差异和可比边界。

## 复审结果

- 提交为 `f868ea993e8263c46a0c3b6d1050d27e41a73b80`；环境为 CUDA 12.6、cuSPARSE `12504`、RTX 4060 Laptop、驱动 `560.94`。三个任务目标源码相对该提交无差异。
- 两个 correctness、两个独立 warmup、五个 formal 日志齐全。正式 CSV 恰有五行，均为 manufactured、`64×64×1024`、batch 4096、FP64、10 次计时迭代、`warmups=0`，没有混入预热行。
- exact1/manufactured 最大解误差分别为 `1.1107e-11`、`1.0436e-11`，最大残差分别为 `2.7756e-15`、`2.6645e-15`，通过 `1e-10` Gate。
- 独立复算与归档统计完全一致：solver-only 中位数 `6.686515188 ms`、IQR `1.218051243 ms`、MAD `0.294905615 ms`、CV `10.684923%`；restore-plus-solver 中位数 `9.133897495 ms`。
- TASK-022 与 TASK-014 现在均为“两次独立预热进程 + 五次正式进程，每个正式进程计时 10 次且不排除进程内调用”。两者使用相同 GPU/驱动、P=1 FP64 manufactured 输入；TASK-014 到本提交之间内部 Fortran、benchmark、bench_kernels 和原 Makefile 无变更。

因此，TASK-022 的技术、正确性、公平性能口径和独立审查门均已闭合，允许标记 `done`。CV 没有预注册拒绝阈值，不阻止关闭任务，但论文必须随中位数公开 IQR/MAD、CV 和原始五次数据。

## 允许与禁止的解释

允许：在该 RTX 4060 Laptop、CUDA 12.6、P=1 FP64、`64×64×1024` manufactured 固定配置下，报告 cuSPARSE QR solver-only 中位数 `6.6865 ms`，并与 TASK-014 28 槽 PaScaL solver 中位数 `3.6474 ms` 做限定的回执级比较；观测中位数比为 `1.83`。

禁止：

- 将 cuSPARSE restore-plus-solver `9.1339 ms` 与 TASK-014 solver total 直接比较；
- 把 cuSPARSE 称为分布式或多 GPU comparator；
- 由 P=1 推断多 GPU 扩展性；
- 隐去 `10.68%` 的计时波动；
- 宣称普遍更快、最优、首次或两种数值算法等价。
