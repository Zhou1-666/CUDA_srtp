---
id: ADR-004
type: decision
status: draft
confidence: medium
source_ids: [SRC-004, SRC-008, SRC-009, SRC-010, SRC-011, SRC-012, SRC-013, SRC-014, SRC-015, SRC-016, SRC-017, SRC-018]
compiled_at: 2026-08-17
updated: 2026-08-20
---

# ADR-004：外部 Comparator 与新颖性措辞

## 决策

1. 一般 `m` 的接口缩约只作统一推导和方法背景，不列为“首次”核心贡献；
2. `3m(m-1)`/`5m²+m` 计数与五对角 28→22 固定编码保留为候选贡献，分别受 TASK-019 与 TASK-006/016 Gate 约束；
3. TASK-014/009 必须加入 P=1 的 cuSPARSE `cusparseDgpsvInterleavedBatch` 双精度外部基线；
4. ScaLAPACK `PDGBSV` 是条件式 CPU/MPI 通用参照，不阻塞 22 槽研发；
5. 已有 Pentadsolver 等高度相邻的分布式多 GPU五对角先例，但在未确认可公开取得且可同输入复现的实现时，仍使用 28/22 配对消融、绝对扩展数据和 P=1 外部锚点，并公开方法差异与不可比原因；
6. 禁止使用“首次并行五对角”“首次分布式五对角”“首个任意带宽 GPU 求解器”和未经检索更新的“最优”。

## 原因

并行五对角、分区缩约、通用带状域分解、单 GPU batched pentadiagonal，以及 Pentadsolver 的跨 rank 批量五对角本地缩约—分布式接口求解均已有公开先例。尚未确认 Pentadsolver 有可公开取得、可在目标 NVIDIA 环境按同输入复现的实现；cuSPARSE 因而仍是目标环境中稳定、可获得且算法独立的 P=1 外部锚点。

## 后果

- 论文贡献更窄，但证据边界更可靠；
- TASK-014 需要新增 cuSPARSE 适配/冻结子项，不与 22 槽实现混合；
- 多 GPU 结果主要证明本项目路径的可复现扩展与 28/22 因果差异，不宣称击败所有外部实现；
- 投稿前必须补 Scopus/Web of Science 或等价数据库的更新检索和人工审阅。

## 不改变

- 不改当前 Fortran、28 槽布局或 benchmark；
- 不把 Ginkgo/cuPentBatch 强行接入为本阶段依赖；
- 不把理论检索结果当作正确性或性能证据。
