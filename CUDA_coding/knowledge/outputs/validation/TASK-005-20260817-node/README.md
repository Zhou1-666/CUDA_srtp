---
id: VAL-TASK-005-20260817
type: validation-receipt
status: draft
confidence: high
source_ids: [SRC-003P, SRC-004]
created: 2026-08-17
---

# TASK-005 独立 28→22 布局验证回执

## 结论

TASK-005 的独立布局完成定义已满足。新增脚本在 180 组多 rank/不均匀分区配置中完成 403,200 次逐槽等价检查，并检测全部 28 个故障注入，失败数为 0。

本任务没有修改 Fortran、Makefile、benchmark 或历史性能数据。结论仅适用于 pack/unpack 映射，不代表 22 槽软件路径已经实现。

## 命令

在 Windows PowerShell 中：

```powershell
Set-Location 'D:\CUDA\CUDA_repository\CUDA_coding\CUDA_code\源代码'
node verify/penta_comm_22_verify.js
$LASTEXITCODE
```

预期末行：

```text
failures: 0
```

并且 `$LASTEXITCODE` 为 `0`。完整参考摘要：

```text
configurations: 180
rd28 round-trip slots checked: 188160
Atr32 slots checked: 215040
fault injections detected: 28/28
slot-count reduction only: forward 28->22 (-21.4%), forward+backward 32->26 (-18.8%)
failures: 0
```

## 停止条件

若出现非零退出码、任一 mismatch、故障注入不足 28/28，或被裁剪槽出现非零却未拒绝，则 TASK-005 不得标为完成。
