---
id: OUT-REVIEW-SRC-029-PENTA-DELIVERY
type: review
status: draft
confidence: high
source_ids: [SRC-003P, SRC-029]
created: 2026-09-04
updated: 2026-09-04
---

# SRC-029：李洋五对角 CUDA 交付包接收审计

## 接收身份

- 用户提供位置：`C:/Users/30575/Downloads/penta_delivery_20260901.tar.gz`；
- archive：42849 bytes，SHA-256 `BF32A311041E1ABE25E8B17D0777984D3049C974E602D7005F9EEE492EEA7117`；
- 包内 solver：`src/PaScaL_TDMA_cuda_penta.f90`，1402 行，SHA-256 `186FE9BC3EE87008D4BC73ECBA06E80D964738B185837AF7095E52461BC21EA3`；
- 当前 TASK-031 v5 solver 对照：1659 行，SHA-256 `4E12F11E586125975D19CE2214F33B342E50A776667F93EE2C96A84A9DFE79EE`；
- 两份 solver 的文本 diff 统计为 1117 行变化（430 insertions、687 deletions）。这个统计只说明差异规模，不说明哪份更正确或更快。

用户将该包识别为同事李洋的 CUDA 五对角实现/交付。本轮未从包外材料独立核验作者身份或共同贡献边界，因此该归属只记录为用户提供的来源说明；公开署名和再分发仍由 TASK-002B 处理。

## 安全与证据边界

- 只读列出并检查 archive；没有执行包内 README、Slurm、MPI、CUDA 或 shell 命令；
- 包内 README 自报的 job `1467948`、`1468039`、`1468123` 及性能数字尚无原始日志、完整环境、源码/runner 指纹和本地复算支持，当前一律视为待审计主张；
- 未把该 solver 覆盖进活动源码，也未把整个包合并成候选；
- 未从 archive 存在性推断许可、可公开分发权或性能优越性；
- 当前仓库此前没有按 archive 文件名或完整 SHA 登记该来源。本页和 SRC-029 是首次正式登记。

## 可用方式

SRC-029 只作为冻结基线之外的 donor/reference source。TASK-031 完成后，TASK-033 逐项生成“差异—意图—依赖—可验证收益—风险”表，并把全局资源所有权、workspace 生命周期、MPI staging、kernel/通信路径等候选分开。任何候选必须单变量迁移到 TASK-031 的不可变基线；禁止整包覆盖、混合算法/结构/性能改动，禁止把 README 自报结果当采用证据。

## 尚未完成

- 尚未逐函数解释 1117 行差异；
- 尚未判定哪些差异属于资源分配优化、功能回退、旧缺陷或环境专用代码；
- 尚未在 NVHPC/MPI/CUDA 环境编译该包；
- 尚未重跑 1/2/4/8 GPU，也没有证明其多 GPU 快于 TASK-031 或 P1；
- 尚未形成可实施的单变量源码任务。

因此本页是来源接收审计，不是代码评审、正确性验收或性能验收。
