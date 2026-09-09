# TASK-023 ParaAI A100 Nsight 短采集本地验收

日期：2026-08-27。状态：`review`。

本目录保存 Slurm job `1456135` 的完整证据包、本地只读解包、独立审计重算及跨报告汇总。原始压缩包保存在 `raw/`，所有派生文件写入新的 `extracted/` 和 `local/`，没有覆盖远端原件、工作源码或既有证据。

## 作业与证据包

- 主作业、batch、extern 均为 `COMPLETED/0:0`，运行时间 `2026-08-27 09:55:20` 至 `09:58:30`，节点 `paraai-n32-h-01-agent-154`。
- 两个 rank 分别绑定两张 `NVIDIA A100-PCIE-40GB`，UUID 不同；驱动 `535.104.12`。作业未设置 CPU 绑定，两 rank 的 `Cpus_allowed_list` 相同，因此本次证据不能用于 CPU 亲和性收益判断。
- 原包：[TASK-023-1456135-nsight-evidence-v1.tar.gz](raw/TASK-023-1456135-nsight-evidence-v1.tar.gz)，`13468551` 字节，SHA-256 `6e59b5e45d06afb57a44ff26b8c22cfdd7a02a6b0251684556425709fed16d0d`。
- 本地归档安全检查通过：`370` 个条目、六个预期根目录，无绝对路径、路径穿越、反斜杠、冒号、重复项、链接或设备文件。
- 外层 `SHA256SUMS.txt` 的 `323/323` 个 payload 文件在本地重新计算一致，且 manifest 与实际 payload 文件集完全相同。

## 本地独立复核

- 包内 capture auditor 与 smoke auditor 均在本地重新运行并通过；忽略绝对路径差异后，逻辑结果与随包报告一致。
- 提交脚本、solver、benchmark 和 Nsight runner 与冻结传输包逐字节一致。受保护 solver SHA-256 为 `55173a7b2fb92c2fd19dbdba8a32e320adb23fbaf12701364f7c6690509a1309`，未改求解器或数值阈值。
- `8/8` 个 `.nsys-rep` 与 manifest 一致；`8/8` 个 stats 返回码为 0，`32` 份 CSV 和 `8` 个 SQLite 齐全，stats stderr 均为空。
- 本地标准库分析脚本 [analyze_task023_job1456135.py](local/analyze_task023_job1456135.py) 复核 `284` 条事件记录和全部报告，输出 `TASK023_LOCAL_CONTENT_AUDIT_PASS`。独立摘要见 [ANALYSIS.md](ANALYSIS.md) 和 [analysis-summary.json](local/analysis-summary.json)。
- 最大 `err_linf=1.3211653993039363e-14`、`err_rms=9.616896415862582e-15`、交叉误差 `6.994405055138486e-15`，均不超过冻结门槛 `1e-10`。
- 最终知识库检查为 `Markdown=164`、`Wiki=34`、`Sources=26`、`Warnings=0`、`Errors=0`，见 [knowledge-lint.log](local/knowledge-lint.log)；本轮相关文档 `git diff --check` 退出 0。

## 可支持的观察

- Nsight 报告包含真实五对角 CUDA 内核、CUDA API、D2H/H2D 和 MPI 事件，说明本次采集链路有效；历史 importer 139 未在八份报告中复现。
- 22 槽每 rank 前向缓冲为 `2816` 个 FP64 元素，28 槽为 `3584` 个，缓冲载荷减少 `21.43%`。该数值含发给自身的数据，是缓冲 payload，不是实测网络字节。
- 唯一热态迭代的 rank-max 总时间为：22/plain `0.636101 ms`、22/profiled `0.660021 ms`、28/plain `0.593310 ms`、28/profiled `0.647811 ms`。首轮比第二轮慢约 `25–27` 倍，显著受冷启动影响。
- profiled 热态迭代中，前向 MPI 阶段是单个已插桩阶段里最大的 rank-max 项：22 槽约 `192.173 us`，28 槽约 `186.094 us`。MPI 时间包含等待，且独立阶段的 rank-max 不可相加，因此这只是后续正式实验的定位线索。

## 不能支持的结论与剩余缺口

- 小规模为 `16×8×128`，每配置只有两次迭代，实际只有一个热态样本；不能据此宣称 22 槽更快、Nsight 扰动大小稳定或 MPI 已是正式瓶颈。
- 全程序 trace 没有 solver NVTX 范围，包含 MPI 初始化/结束、参考计算、校验和清理；全报告事件总量不能精确映射为单次 solver 阶段。
- 本轮没有代表性 `256×256×1024` 的不带 Nsight 配对重复，没有跨节点或完整现行 SOP 门禁，也不支持性能提升、良好扩展性或完整 CFD 结论。
- TASK-023 继续保持 `review`。同一任务的最小下一动作是执行已冻结的正式 A100 对照协议：P=1/2、28/22、plain/profiled，每模式两次预热、五次独立 launch、每次十迭代；在提交前仍须核对显存和作业时限。该动作尚未执行，也未提交新的 GPU 作业。

## 本地复验

在仓库根目录 PowerShell 运行：

```powershell
& 'C:\Users\30575\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' '.\CUDA_coding\knowledge\outputs\validation\TASK-023-20260827-paraai-a100-job1456135\local\analyze_task023_job1456135.py'
```

预期退出码为 0，末行包含 `TASK023_LOCAL_CONTENT_AUDIT_PASS stats_csv=32 event_rows=284 reports=8`，最大误差为 `1.3211653993039363e-14`。失败时保留完整 stdout/stderr、退出码以及 `local/analysis-run*.log`；不要修改原包、阈值或清单来绕过检查。本命令仅复算已下载证据，不代替正式 GPU 对照或其他 SOP 门禁。
