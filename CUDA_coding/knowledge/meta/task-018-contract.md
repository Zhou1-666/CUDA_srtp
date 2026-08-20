---
id: TASK-018
status: done
model: gpt-5.6-terra
reasoning: high
---

# TASK-018 合同：28/22 槽显存容量模型与安全规模

## 目标

为当前 28 槽和投影 22 槽路径建立逐分配的容量模型，并以真实 A100 完成安全规模与非分配拒绝核验。

## 允许与禁止

- 允许：新增独立 Node 容量模型、运行文档和修正 benchmark 的设备数组计数注释。
- 禁止：修改五对角消元、28 槽布局、MPI/CUDA 通信路径或 benchmark 数值语义；禁止真实申请预估超过保守 budget 的 OOM 配置。

## 完成条件

1. Node 自检覆盖 28/22、P=1/2、FIT/REJECT 边界；
2. A100 上 `256×256×1024,P=1`、一次 iteration 的制造解 smoke 退出 0；
3. 同一 30 GiB budget 下 `512×512×2048,P=1` 由模型以 exit 2 拒绝，且不触发 CUDA 分配；
4. 归档逐项 bytes、原始输出、设备环境与未覆盖边界。

## 完成回执

- 模型 CLI 修复：`8df948e`；自检 6 项、30 GiB FIT（5.061 GiB）与 REJECT（40.242 GiB，exit 2）通过。
- A100：已同步的 `9cbab6e` 在 BSCC-N32-H job `1433881` 干净 release 构建后，manufactured `256×256×1024,np=1,iterations=1` smoke 内联退出码为 0，RMS/L∞ 为 `1.4532e-13/1.9662e-13`。
- 证据：`knowledge/outputs/validation/TASK-018-20260819-bscc-n32h-a100/`。
- 边界：22 槽仍为投影；本任务不支持性能或扩展结论。
