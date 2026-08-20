---
id: TASK-018-20260819-BSCC-N32H-A100
task: TASK-018
status: draft
confidence: high
source_ids: [USER-TERMINAL-20260819, TASK-017-20260819-PARAAI-A100, TASK-018-CONTRACT]
---

# TASK-018：本机容量预检与 BSCC-N32-H A100 安全 smoke

## 结论

容量模型的本机自检、安全 FIT、受控 REJECT，以及 N32H A100 的一次 `np=1` manufactured safe smoke 均已取得正向证据。A100 的有效 smoke（第二次尝试）退出码为 0，RMS/L∞ 误差分别为 `1.4532e-13` 与 `1.9662e-13`。

模型修复已提交为 `8df948e`；在该 SHA 上复跑自检（6 项）、FIT 与 exit 2 REJECT 均通过。A100 benchmark 源码在已同步的 `9cbab6e` 上干净构建；两提交之间与本任务相关的差异仅为 Node.js `--budget-mib` 的字段映射，未改 Fortran 或 benchmark。首次 A100 尝试的数值正常但后续 shell 状态为 130，保留在本目录而不计为成功。

## 代码与环境

| 项目 | 观测值 |
| --- | --- |
| 集群 checkout | `9cbab6e`（TASK-018 模型/运行器提交） |
| A100 Slurm job | `1433881`，后以 `scancel` 释放 |
| 节点 | `paraai-n32-h-01-agent-68` |
| GPU | NVIDIA A100-PCIE-40GB，40,960 MiB |
| GPU UUID | `GPU-62b343c5-de91-dc05-4292-a7eaf5518a65` |
| driver | `535.104.12` |
| NVHPC | `nvfortran 24.5-1`，linuxarm64/aarch64 |
| MPI | Open MPI `3.1.5` |
| 绑定 | 单 task、单 GPU；`CUDA_VISIBLE_DEVICES=0` |

## 本机 Node.js 容量模型

模型首先暴露了 CLI 缺陷：`--budget-mib` 被写成 `budgetMib`，而模型读取 `budgetMiB`，导致首次本机 FIT 输出没有 `classification`。本地工作树已修正映射并向 `--self-test` 加入该字段断言；修正后结果如下：

- 自检：`cases=6 failures=0`。
- `256×256×1024,P=1,budget=30 GiB`：28 槽 `5.061 GiB`，分类 `FIT`；22 槽仅为 `5.052 GiB` 投影，不能当作实测。
- `512×512×2048,P=1,budget=30 GiB`：28 槽 `40.242 GiB`，分类 `REJECT`，退出码 2；此过程不调用 CUDA。

完整用户终端转录见 [local-node-model.md](local-node-model.md)。本机 Node.js 环境与 A100 环境分开记录；前者不代表 A100 上存在 Node.js。

## A100 干净构建与 smoke

在已分配资源中，以 `mpifort` / `-O3` 执行 `make veryclean && make FC=mpifort OPT=-O3`，成功生成 `benchmark_penta`。

有效启动配置为：`256×256×1024`、`np=1`、`PENTA_TEST_CASE=manufactured`、`iterations=1`、`128/128` threads。输出：

| solver | avg_time(s) | err_rms | err_linf | cross_err |
| --- | ---: | ---: | ---: | ---: |
| exp | `7.5768e-03` | `1.4532e-13` | `1.9662e-13` | `0` |
| serial | `7.2713e-02` | `1.4532e-13` | `1.9662e-13` | `0` |

内联捕获的 `benchmark_exit_code=0`。这只证明安全规模下的正确性 smoke；它不是多 GPU 扩展、性能比较、CUDA-aware 通信或 22 槽实测证据。完整转录见 [a100-smoke.md](a100-smoke.md)。

## 保留的异常尝试

第一次同规模运行显示相同数量级误差（exp `7.9053e-03`、RMS/L∞ `1.4532e-13/1.9662e-13`），但用户随后读到 shell 状态 `130`。该尝试不作为通过证据；第二次在同一启动命令内捕获 `benchmark_exit_code=0` 后才通过。

## 未覆盖范围

- 未在 A100 上运行 Node.js；A100 当前没有已核验的 Node 运行时。
- 未测量 22 槽实际显存或性能；该路径尚未实现，等待 TASK-006 的人工 Gate。
- 未进行多 GPU扩展、五次计时、CUDA-aware A/B 或长期稳定性测试。
- CLI 修复尚未提交、推送或由独立审阅者复核。

## 人工复验顺序

1. 在包含 CLI 修复的已提交 SHA 上运行模型自检、FIT 和 REJECT；REJECT 必须返回 2。
2. 在 N32H 已分配的单 A100 中干净构建后运行同一 manufactured smoke，并在同一命令中捕获退出码 0。
3. 保存环境与原始输出，再更新任务台账和状态。
