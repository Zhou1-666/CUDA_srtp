---
id: TASK-009-20260824-PARAAI-CROSSNODE-SMOKE
task: TASK-009
status: verified
confidence: high
source_ids: [SRC-003P, SRC-022, SRC-023]
---

# TASK-009：ParaAI 双节点四 A100 五对角正确性 smoke

## 结论

2026-08-24，Slurm job `1449615` 在两个计算节点、四张不同 A100 PCIe 40GB 上完成 HPC-X/Open MPI 跨节点启动、CUDA Fortran 干净构建和五对角 manufactured-case smoke。`sacct` 为 `COMPLETED 0:0`，程序标记 `TASK009_CROSSNODE_PENTA_SMOKE_RC=0`，实验组 RMS/L∞/cross error 均约 `1e-14`。

这关闭了 TASK-009 的“最小跨节点 MPI/五对角正确性 smoke”子缺口，但不是正式性能实验：只运行一次、小输入、28 槽、host staging，并为兼容性强制 TCP/`eth0`。TASK-009 仍缺协议要求的 8 GPU同口径重复强/弱扩展数据，状态保持 `blocked`。

## 受控环境与映射

| 项目 | 实测值 |
| --- | --- |
| 作业 | Slurm job `1449615`；`COMPLETED 0:0`；elapsed `00:01:01` |
| 代码 | 运行前 SSH checkout 为 `3c658a7426f45ed8a3ce05006c851e399012c484`；脚本未在 job 内再次打印 SHA，故不伪称 build-time SHA |
| 软件栈 | `nvhpc/24.5/nvhpc-hpcx-cuda12/24.5`；HPC-X Open MPI `4.1.7a1`；`mpifort -O3 -cuda` |
| 节点 | rank 0/1：`paraai-n32-h-01-agent-23`；rank 2/3：`paraai-n32-h-01-agent-36` |
| GPU | 4 × NVIDIA A100-PCIE-40GB；每 rank 仅见逻辑设备 `0` |
| rank 0 UUID | `GPU-d713e1e5-36db-f60e-a2de-ac3955d21c4d` |
| rank 1 UUID | `GPU-f78774ca-effa-481f-6b1a-73866e0fe94e` |
| rank 2 UUID | `GPU-4dce0c21-bbb7-12e0-3082-19bf19f16f0c` |
| rank 3 UUID | `GPU-fc5f3899-98d4-4c64-b297-40e7ad8ed127` |
| 启动兼容参数 | 每节点 2 GPU；Open MPI Slurm PLM step 显式 `--gpus=2`；`pml=ob1`、`btl=self,vader,tcp`、OOB/BTL 限定 `eth0` |

四个 rank 虽都显示 `CUDA_VISIBLE_DEVICES=0`，但 UUID 各不相同，说明 Slurm 对每个 task 的物理 GPU 做了隔离和逻辑重编号，而不是四个 rank 共用同一张卡。

## 输入与结果

| 项目 | 值 |
| --- | --- |
| case | `manufactured` |
| 输入 | `n1=16, n2=8, n3=128` |
| ranks / systems | `4 / 128` |
| local Nrow | min=max=`32`，满足五对角 `Nrow>=5` 合同 |
| iterations | `1` |
| MPI mode / forward slots | `host / 28` |
| exp total_s_max | `1.60164957e-1 s` |
| exp RMS | `1.9575735157983786e-14` |
| exp L∞ | `2.6645352591003757e-14` |
| exp cross error | `1.3544720900426910e-14` |
| ref RMS / L∞ / cross | `9.9090806307996545e-15 / 1.3544720900426910e-14 / 1.3544720900426910e-14` |

误差远低于项目常用 `1e-10` 正确性门。调度器附加的 `Get GPU mapping information failed` 是站点性能查询插件输出；它没有改变四 rank UUID、程序退出码或 `sacct` 状态，不能据此否定本次 smoke。

## 诊断闭环

1. 早期 job `1448488` 已完成四 rank/UUID 映射，但 benchmark 挂起，未形成算法行。
2. 节点 `agent-92/93` 的零时长 `JobLaunchFailure` 与应用程序分离确认；替代节点的 Slurm step 可正常运行。
3. job `1449597` 使用均衡 GRES 和 Open MPI `plm_slurm_args --gpus=2`，完成双节点 `mpirun hostname`（exit 0），证明 MPI–Slurm 启动链可用。
4. job `1449608` 已启动并构建，但输入 `n3=8` 被 4 rank 分成局部 `Nrow≈2`，由求解器按合同正确拒绝；这不是网络或算法故障。
5. job `1449615` 将 `n3` 修正为 128，完成本回执所述跨节点五对角 smoke。

## 证据边界

- 用户提供了 `sacct` 与合并 stdout/stderr 的完整终端回显；集群原始文件为 `~/task009-xnode-penta-smoke-n3-128-1449615.out` 和同名 `.err`。
- 两个文件已从远端项目同步到本回执 `raw/` 目录并在本地复算：stdout 为 4,802 bytes，SHA-256 `45d0270d7d1d96e2dadba25978d7ebfd1fca32a56f8398c406dd2fa5e5fe626a`；stderr 为 0 bytes，SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`，后者是空文件的标准哈希。传输包 `TASK-009-20260824-paraai-crossnode-smoke-raw.tar.gz` 为 1,605 bytes，本地 SHA-256 `af274a0ae90814491592e9ff629e4baf80647f1c800750a5072238caa76a1105`；规范证据是已解压的 `raw/` 文件，传输包仅作搬运副本。
- 单次 `0.160 s` 是小规模、强制 TCP/host staging 的诊断值，没有预热、重复和 8 GPU配对，不得用于加速比、效率或最终网络性能主张。
- 22 槽、device/CUDA-aware、跨节点 host/device A/B 和 8 GPU强/弱扩展均未由本回执覆盖。
