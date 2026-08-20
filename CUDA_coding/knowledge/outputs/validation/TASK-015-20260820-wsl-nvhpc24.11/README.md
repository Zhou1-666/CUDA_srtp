---
id: OUT-TASK-015-20260820-WSL
type: validation-receipt
status: draft
confidence: high
source_ids: [SRC-003P, SRC-014]
created: 2026-08-20
---

# TASK-015 数值稳定性与主元失败合同回执

## 结论

TASK-015 的技术完成定义已满足。当前五对角求解器仍采用无主元交换消元，但会在每个实际除法前使用尺度不变判据

`abs(pivot) <= 64*epsilon(FP64)*row_scale`

拒绝不安全主元，并通过 `pascal_fail` 给出 `numerical pivot breakdown` 与错误码 `4`，不再把零/近零主元静默传播为 NaN/Inf。

## 环境

- WSL Ubuntu；NVHPC `nvfortran 24.11-0`，x86-64；
- NVHPC OpenMPI `4.1.5`；
- CUDA Fortran release 构建 `-O3 -cuda`；
- 最终源码版本为包含本回执的 Git 提交；以该提交执行 `git rev-parse HEAD` 取得不可变 SHA。

## 独立数值合同

`node verify/penta_stability_check.js` 六类全部通过：

| 矩阵族 | 后向误差 | 前向误差 | 结论 |
| --- | ---: | ---: | --- |
| 对角占优 | `8.424e-17` | `1.802e-16` | 通过 |
| 弱占优 | `6.990e-17` | `1.802e-16` | 通过 |
| 行尺度 `1e-12..1e12` | `7.425e-21` | `3.603e-16` | 通过；分类对行缩放不变 |
| 受控近奇异 | `8.050e-17` | `4.428e-8` | 通过；保留前向误差放大 |
| 零主元 | 不求解 | 不求解 | 失败码 `4` |
| 近零主元 | 不求解 | 不求解 | 失败码 `4` |

八项独立数学检查、知识 lint 和同步后的容量模型自检全部通过。

## CUDA/MPI 专属回归

`verify/run_task_015_stability.sh` 完成 NVHPC 干净构建，`np=1/2` 共 12 项、失败 0：

- dominant、weak_dominant、scaled、near_singular 均退出 `0`；
- zero_pivot、near_zero_pivot 均出现主元守卫并退出 `4`；
- 近奇异前向误差：`np=1 1.3843e-7`，`np=2 1.1787e-8`；对应后向误差为 `8.8683e-17`、`4.2972e-17`。

完整汇总见 `raw/stability/runner_summary.log`，构建和逐用例输出保留在同目录。

## 既有回归

- 16 个 API 正反用例均生成预期成功或守卫日志；OpenMPI 在最后一次预期 `MPI_ABORT` 时截断 runner stdout，因此以 `raw/api/` 的 16 个逐用例日志为准。
- TASK-014 manufactured 正常输入重新干净构建并通过：
  - `np=1`：RMS `6.0064e-14`，L∞ `1.1657e-13`，cross `0`；
  - `np=2`：RMS `2.0165e-13`，L∞ `2.8555e-13`，cross `2.2715e-13`。

## 证据边界

- 这里只验证了预注册的六类矩阵，不声称支持任意非对角占优或任意病态系统。
- 算法没有加入行交换或列主元；守卫是可诊断拒绝机制，不是稳定化算法。
- 新增状态同步位于求解路径；本任务没有进行配对性能回归，不作速度或开销结论。
- `np=2` 在本机共享 GPU，只用于数值与通信正确性，不是多 GPU扩展证据。
