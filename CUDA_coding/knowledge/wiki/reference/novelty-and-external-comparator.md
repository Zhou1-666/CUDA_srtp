---
id: KB-REF-NOVELTY-COMPARATOR-001
type: reference
status: draft
confidence: medium
source_ids: [SRC-002, SRC-004, SRC-008, SRC-009, SRC-010, SRC-011, SRC-012, SRC-013, SRC-014, SRC-015, SRC-016, SRC-017, SRC-018]
compiled_at: 2026-08-17
updated: 2026-08-20
review_by: 2026-08-31
---

# 五对角新颖性边界与外部 comparator 决策

## 一句话结论

并行五对角、接口缩约和一般窄带宽域分解均有明确先例；本项目可保留的候选新意是 PaScaL 式分布式五对角实现中对特定接口布局的结构零计数与 28→22 无损通信编码，而不是“一般 `m` 缩约思想首次提出”。

## 新颖性边界

- Levit、Ivanov/Walshaw、ScaLAPACK、SPIKE 和五对角 compact-scheme 域分解否定“并行五对角/分布式五对角/一般带宽缩约无先例”的表述；
- cuPentBatch、cuSPARSE、MAGMA/Ginkgo 说明单 GPU 批量五对角及一般带状 GPU 求解已有成熟路线；
- NASA/OVERFLOW 的共享 LHS 与 PCR 工作补充了单 GPU批量五对角先例；Pentadsolver 已展示跨 ranks 分块、本地 Thomas 缩约、分布式 Jacobi/PCR 和最高 1024 GPU扩展，禁止声称“没有多 GPU/分布式批量五对角先例”；
- 本次未检索到与 `3m(m-1)`、`5m²+m` 或 PaScaL 式 28→22 完全相同的公开公式/编码，但这只是候选新颖性，不是排他证明；
- C2 降级为方法背景；C3/C4 保留为候选贡献；C5/C6 只能由项目实测形成结果。

## comparator 决策

| 层级 | 决策 | 用途 |
| --- | --- | --- |
| 单 GPU，必须 | cuSPARSE `cusparseDgpsvInterleavedBatch` | 同输入、双精度、独立 QR 路线的外部正确性/性能锚点 |
| 分布式 CPU，条件式 | ScaLAPACK `PDGBSV` | 通用带状分布式参照；不作跨硬件头条 speedup |
| 单 GPU，可选 | Ginkgo/MAGMA band solver、cuPentBatch | 只有规模/输入和版本可冻结时加入 |
| 多 GPU，主实验 | 本项目 28/22 配对 + 绝对强弱扩展；Pentadsolver 作方法先例 | 已有高度相邻多 GPU先例，但尚未确认可公开取得并按同输入复现的代码；必须公开此限制 |

详细检索式、纳排标准、先例表、公平性合同和人工签字栏见 [[../../outputs/reviews/TASK-013-20260817-novelty-and-comparator-audit]]。

## 论文题目/摘要约束

建议围绕“distributed multi-GPU pentadiagonal line solver”“structure-aware compact communication”与实测扩展性；不要在 TASK-019 和更新检索前把“general band solver”或“first”写入题目、摘要或结论。

## 相关页面

- [[pascal-tdma-2.1-to-penta-transfer]]
- [[../methods/general-m-reduction]]
- [[../methods/28-to-22-slot-map]]
- [[../performance/benchmark-protocol]]
- [[../paper/claim-evidence-matrix]]
- [[../decisions/ADR-004-外部Comparator与新颖性措辞]]
