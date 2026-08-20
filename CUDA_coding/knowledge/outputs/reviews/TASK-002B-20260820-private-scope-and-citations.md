---
id: TASK-002B-PRIVATE-SCOPE-20260820
type: review
status: draft
confidence: high
source_ids: [SRC-002, SRC-003, SRC-003P, SRC-003T, SRC-007, SRC-014]
---

# TASK-002B 私有研发范围、NOTICE 与引用清单

## 已确认的范围

- 项目源码：仅私有研发与团队协作，不公开源码。
- 论文：可以公开，但必须准确披露来源、贡献边界和引用。
- 此范围决定不等于给任何人授予源码复制、修改、再分发或公开发布的许可。

## 已形成的仓库文本

- 根目录 `NOTICE`：说明私有研发边界、上游三对角来源、初始五对角的团队来源和公开源码前的额外审批条件。
- 根 `README.md` 与 `CUDA_code/源代码/README.md`：不再使用“License: To be defined”，而是链接到私有范围 NOTICE，明确论文公开不等于源码公开。

没有创建 `LICENSE`。原因是公开 MIT 许可证只在已审计的上游快照中得到确认，不能自动覆盖本仓库的派生构建文件、初始五对角实现或后续工程增量。

## 论文与发布引用清单

| 使用场景 | 必须披露或引用 | 可复核来源 |
| --- | --- | --- |
| 项目方法与三对角谱系 | Ki-Ha Kim 等，*PaScaL_TDMA 2.1: A register-resident multi-GPU tridiagonal matrix solver with optimized communication for large-scale CFD simulations*, *Computer Physics Communications* 323 (2026) 110120, DOI: <https://doi.org/10.1016/j.cpc.2026.110120> | SRC-002、[[../../wiki/reference/pascal-tdma-2.1-to-penta-transfer]] |
| 上游代码来源 | `https://github.com/k-kiha/PaScaL_TDMAcuda.git`，审计快照 `e637d5ecab0f08308eea83fbbb1872ead7ae07c5`；三对角精确历史对象 `d69ae95` | SRC-007、[[TASK-002A-20260817-upstream-audit]] |
| 初始五对角实现的贡献边界 | 李洋在苏运德导师指导的团队三对角基线基础上借助 AI 工具扩展形成；不得归为后续执行者的独立原创；AI 不是作者或权利主体 | [[TASK-002A-20260817-upstream-audit]] 的导师确认记录 |
| 报告 TASK-022 的外部 P=1 对照时 | NVIDIA cuSPARSE `gpsvInterleavedBatch` 官方文档与使用的 CUDA Toolkit 版本；如使用 NVIDIA 样例，应另保留其 Apache-2.0 样例来源 | SRC-014、[[../../wiki/reference/novelty-and-external-comparator]] |

不要把上游 MIT、NVIDIA 样例的 Apache-2.0 或论文可公开，误写为整个私有仓库的公开许可证。

## 待人工复核与完成条件

导师或对应权利人须确认：

1. 根目录 `NOTICE` 准确表达了“源码私有、论文可公开”的范围；
2. 以上来源、贡献边界与论文引用清单无遗漏或错误；
3. 公开论文是否还需要机构、竞赛或保密审查；
4. 不创建公开源码 `LICENSE` 的决定是否维持。

取得该确认后，将本页状态改为 `reviewed`，TASK-002B 改为 `done`；若日后改为公开源码，必须新建独立发布任务并重新核验许可证。
