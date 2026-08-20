# TASK-006 可切换 28/22 Fortran 路径验证回执

## 状态与边界

TASK-006 已完成。可切换实现、独立数学检查和 NVHPC L2–L4 均通过；TASK-016 又完成动态内存检查及 28/22 各 100 次 create–solve–clean 生命周期压力回归，项目 G2 已解除。

实现与 TASK-016 验证程序的不可变源码提交为 `faffee3`。TASK-016 完整回执见 `knowledge/outputs/validation/TASK-016-20260820-wsl-nvhpc24.11/README.md`。

## 实现合同

- `pascal_plan_create` 增加末尾可选 `forward_slots`；旧调用默认仍为 28，只接受 28 或 22；
- S1 与 `rd(Nsys,28)` 保持不变，避免把数值消元重写混入通信布局任务；
- 22 模式用固定映射只打包 22 个保留槽，unpack 显式恢复四个单位对角和六个结构零，`Atr` 仍为每 rank 32 槽；
- 普通与 profiled solver 使用同一分支；forward buffer/count/displacement 按 plan 选择缩放，backward 仍为 4 槽；
- benchmark 用 `PENTA_FORWARD_SLOTS=28|22` 选择并在屏幕/CSV 写出 `forward_slots`；
- 容量模型按实际第一版实现保留 28 槽 `rd`，只计算 forward buffers 的 28→22 差异。
- 顶层 `make penta` 现在依赖 `lib`，可在 `veryclean` 后直接重建五对角示例。

没有修改三对角源码、参考五对角对照组、主元算法、persistent staging、CUDA-aware MPI 或 overlap。

## 环境

- WSL Ubuntu；NVIDIA GeForce RTX 4060 Laptop GPU，8 GiB，driver `560.94`；
- NVHPC `nvfortran 24.11-0`；NVHPC OpenMPI `4.1.5`；
- FP64；host staging；多 rank 共享单 GPU，仅作数值和通信正确性证据。

完整环境见 [raw/environment.txt](raw/environment.txt)。

## 验证结果

本机统一入口的 8 项独立数学检查、容量模型自检和知识 lint 均通过。目标环境 runner 完成：

| 层 | 覆盖 | 结果 |
| --- | --- | --- |
| API | 默认 28、合法 22、生命周期/输入/越界及非法 21 槽 | 18/18 |
| profiled 28 槽 | exact1/manufactured；`np=1/2/4`；常规、`Nrow=5/6`、不均匀线分区 | 10/10 |
| profiled 22 槽 | 与 28 槽相同矩阵 | 10/10 |
| 普通 solver | `np=2` 五对角示例，28/22 各一次 | 2/2 |

profiled 两种前向布局得到相同的最坏误差：RMS `4.335560e-16`、L∞ `6.661338e-16`、与独立参考解互差 `1.776357e-15`，均低于冻结阈值 `1e-10`。代表性的 `np=4,7×5×24,manufactured` 两份日志中，28/22 的三项误差逐项一致；普通 solver 的 28/22 最大误差也相同，均为 `2.0073e-13`。

在 TASK-018 的安全规模 `256×256×1024,P=1` 上，当前第一版实现的模型为 28 槽 `5.061 GiB`、22 槽 `5.055 GiB`，forward device buffers 节省 `6 MiB`。历史 `5.052 GiB/9 MiB` 是“连 `rd` 也缩到 22”的投影，不是本实现实测或当前模型值。

构建无 error/warning/severe/fatal 诊断。逐用例原始输出、API 日志和构建日志均在 [raw](raw/) 中。

第一次尝试在 `veryclean` 后直接执行 `make penta`，暴露顶层目标未依赖 `lib`、因而缺少模块文件的构建缺口；修正为 `penta: lib` 后重新从头运行本回执，普通与 profiled 全部通过。该失败是构建依赖问题，不是 22 槽数值失败。

## TASK-016 动态与生命周期 Gate

- 28/22 各 100 次 `np=2` create–solve–clean 均通过，最大误差均为 `6.6613e-16`；
- 两种布局的 Compute Sanitizer memcheck/initcheck 均由两个 rank 分别报告 0 errors；
- TASK-016 正式汇总 `cases=6 failures=0`。

## 未覆盖范围

- 未在本轮 A100 环境复验，且单 GPU多 rank 不能作为多 GPU扩展证据；
- 未执行预注册五次 28/22 配对计时、MPI 字节统计或显著性分析；单次日志中的时间不得用于声称 22 槽更快；
- 未证明 S1 直接生成 22 槽会更省显存或更快；当前实现刻意保留规范 28 槽 `rd`。

## 人工复验

在 WSL/NVHPC + OpenMPI + 可见 NVIDIA GPU 环境，从源码根目录运行：

```bash
bash verify/run_task_006_28_22.sh "$PWD/verify/logs/TASK-006-manual"
```

预期末行是 `TASK-006 28/22 validation summary: profiled_cases=20 regular_cases=2 failures=0`，且 API 汇总为 18/18。失败时保存整个输出目录，不覆盖本回执。
