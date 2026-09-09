---
id: KB-SYSTEM-003
type: map
status: draft
confidence: medium
source_ids: [SRC-003, SRC-005, SRC-028]
compiled_at: 2026-08-17
updated: 2026-09-09
---

# 构建与运行环境地图

本页仅保留稳定工程方法和带版本的证据边界；实时状态、节点/资源及唯一下一动作只看[[../../meta/task-queue]]、[[../../meta/task-blocker-register]]。旧TASK-031逐次部署、排队、附着和提交记录归各自任务回执，不在Wiki叠加多份“当前”。修订前完整字节与迁移范围见[B批冻结说明](../../outputs/plans/20260909-batch-b-allowlist.md)。

## 所需软件链

```text
NVHPC/nvfortran
  + MPI Fortran wrapper（必须实际调用兼容 nvfortran）
  + CUDA driver/GPU
  + GNU make/ar/ranlib
  + Node.js（独立数学验证）
  + Python/matplotlib（图表）
  + Slurm/OpenMPI（HPC 实验）
```

## 环境状态

| 环境 | 现状 | 可做 | 不可作为 |
| --- | --- | --- | --- |
| Windows PowerShell + RTX 4060 Laptop 8GB | Node 可用；NVHPC/MPI/make 不在 PATH | JS 数学验证、Markdown、CSV 分析 | CUDA Fortran 干净构建 |
| 当前 WSL2 + RTX 4060 Laptop 8GB | NVHPC 24.11、OpenMPI 4.1.5、CUDA 12.6；TASK-001 干净构建和 `np=1/2` 通过 | 单 GPU正确性、host staging、受控 CUDA-aware 回归 | 真实多 GPU scaling |
| `run_benchmark.slurm` 模板 | 声明 nvhpc 23.3、4 GPU/A100 示例 | 集群模板参考 | 已核验的真实集群配置 |
| 申报书实验室资源 | 声称 GPU 节点含 A800 | 潜在正式实验资源 | 未经登录探测的硬件事实 |

## 干净构建收据必须记录

- 主机/节点与日期；
- `nvfortran --version`、`mpif90 --show`/版本；
- `nvidia-smi`、驱动、GPU 数与拓扑；
- module load 命令；
- 完整 Makefile flags；
- clean/build/run 命令与退出码；
- 产物 SHA-256 或 Git commit；
- CUDA-aware MPI 验证方式，不只写环境变量。

## 已知环境陷阱

- MPI wrapper 可能不是 NVHPC ABI；
- 驱动与 NVHPC 内置 CUDA 版本可能不兼容；
- 多 rank 必须明确 rank→GPU 绑定；
- WSL 单 GPU双 rank 的三对角 CUDA-aware 路径需使用 `--mca opal_cuda_support true --mca btl_smcuda_use_cuda_ipc 0`；五对角默认 host staging 不需要；
- 单卡多 rank 会产生调度、显存和页故障干扰；
- `/tmp`、Slurm 分区和 module 名称是集群特定配置；
- `CUDA-aware` 不能仅凭 MPI 名称推定，必须最小 device-buffer 测试；
- 不同 Makefile flags 共用旧 `.o/.mod` 会污染对比。

## 脚本与预检防错（SRC-028 历史证据）

包完整性、诊断脚本可靠性和实际 GPU 验收是不同证据层；预检须能拒绝真实错误，也不能误拒正常输入。以下为已记录工程教训，不升级为当前候选通过或失败。

| 已查明的错误 | 证据及边界 | 后续防错要求 |
| --- | --- | --- |
| 提交命令把 `SHA256SUMS.txt` 写成 `SHA256SUMS` | 真实冻结包可复现预检 rc2；当次尚未到 mkdir/sbatch，不是上传损坏或 GPU 运行失败。r1 已仅补两处扩展名，历史真实文件测试 3/3 | 从实际包清单核对所有引用路径；在真实文件上测试有效输入、缺目录、错 SHA，不能只用 Bash 语法检查或模拟日志代替 |
| 生命周期构建没有采用所声明的 CUDAFLAG | SRC-028 实际build核验确认环境声明与最终编译flags不同 | 分别核环境、make赋值优先级、命令行传播和真实编译日志；本地dry-run或环境回显不等于目标构建通过。版本修复与验收状态读取任务回执，不在本页排程 |
| 孤立 `ldd` 的 `not found` 被直接作为必停条件 | job1474105 输出 `STOP_MISSING_COMPUTE_NODE_DEPENDENCY` 后退出2，plain/A/B 均未开始；被报未解析的私有库在同目录实际存在。本机曾成功短 memcheck 的工具链也在只读孤立 ldd 中出现同名未解析 | 区分“文件不存在”“探针搜索上下文未解析”“实际检查器注入失败”；预检修正须覆盖真实工具库反例与真实缺库负例，不能直接删除所有依赖门或全局改 LD_LIBRARY_PATH |

三份用户原始回贴、字节数/SHA和历史复现分析见[SRC-028证据索引](../../outputs/validation/TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260903-wiki-script-preflight-lessons.md)。原始摘录与实际远端原文件的区别保留；本轮未重跑旧命令。

同类验证应使用真实输出样本、精确输入/工具指纹、正反例与完整退出记录；分别记录命令rc、解析分类和批作业rc，不从Slurm FAILED推断solver失败。未知根因仍按对应版本保留，不能由文档lint、模拟测试或单rank短测代替完整门禁。

## 新目标环境验收所需输入

- 实际 A800/A100 集群登录后的 `hpc/check_env.sh` 输出；
- module load 和 Slurm 分区/GPU 申请方式；
- 是否允许 CUDA-aware MPI；
- 正式 Git 远端/commit 规则；
- 若要与 CFD 对齐，现有 CFD/FFT 主程序及接口说明。

这些材料不阻塞知识库和 Node 理论工作，但会阻塞发布级构建、真实多 GPU优化和 Poisson/CFD 集成。

## 相关

- [[module-dependency-map]]
- [[../briefs/penta-active-context]]
- [[../testing/source-change-validation-sop]]
- [[../performance/hardware-matrix]]
- [[../performance/benchmark-protocol]]
