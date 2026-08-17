# TASK-013 新颖性检索与外部 comparator 审计回执

日期：2026-08-17  
状态：检索、判定与实验决策完成；等待非原推导者人工签字

## 检索协议

检索路线分为两路：

1. PaScaL_TDMA 2.1 谱系：核对本地论文参考文献，以论文题名、DOI、作者和 PaScaL_TDMA 关键词检查可访问的前向记录；
2. 独立关键词：组合 `pentadiagonal`、`banded`、`parallel`、`distributed memory`、`MPI`、`multi-GPU`、`batch`、`reduced system`、`Schur complement`、`SPIKE`、`communication`、`interface`、`ScaLAPACK`、`cuSPARSE`。

查阅渠道：Crossref/DOI 出版页、DBLP、arXiv、Netlib、NVIDIA 官方文档、Ginkgo 官方文档/仓库、大学机构库与作者公开稿。纳入直接五对角/一般带状求解、分区缩约、GPU/MPI 实现或能实际运行的库；排除只讨论行列式/逆公式、纯 Toeplitz 特例、没有求解器细节的应用和与带状问题无关的通用稀疏迭代法。

限制：当前无法使用机构订阅的 Scopus/Web of Science 全量前向引用导出；PaScaL_TDMA 2.1 于 2026 年发表，前向记录仍可能增长。因此“没有检索到”不是“世界上不存在”，投稿前必须补一次数据库更新检索。

## 关键先例矩阵

| 来源 | 方法/对象 | 并行/硬件 | 与本项目的关系 | 新颖性影响 |
| --- | --- | --- | --- | --- |
| Levit 1989，SRC-008 | 广义 odd-even elimination 解五对角 | 并行处理器，`O(log n)` 阶段 | 已直接研究并行五对角 | 禁止声称“首次并行五对角” |
| Ivanov & Walshaw 1998，SRC-009 | chain of P processors 上的 parallel partition/TW 方法；形成更小五对角缩约系统 | 分布式链式处理器 | 已研究接口缩约与通信启动数 | 禁止把“缩约五对角接口系统”本身当首次创新 |
| ScaLAPACK `PDGBSV`，SRC-010 | 带 pivoting 的分布式通用带状 LU/分治 | MPI/CPU | 能处理半带宽 2，但不是批量 GPU 专用 | 通用外部参照；不能宣称没有分布式带状库 |
| SPIKE，SRC-011 | 任意窄带宽的域分解、spikes 与 reduced system | CPU/OpenMP；文献讨论 MPI 实现 | 一般 `m` 接口缩约的直接先例 | `2m` 级接口规模属于已知方法族，不应作为核心新颖性 |
| Kim 2013，SRC-012 | 五对角 compact scheme 的 quasi-disjoint 域分解与 halo 交换 | MPI/CFD | 是应用导向的五对角域分解替代路线 | 禁止声称“五对角 MPI 域分解无先例”；它与本项目精确全局缩约并不等价 |
| cuPentBatch，SRC-013 | 批量五对角 LU；可复用共同 LHS | 单 NVIDIA GPU | 与当前同 LHS 大批量 workload 接近，但不跨 rank | 单 GPU算法/性能参照，不是多 GPU comparator |
| cuSPARSE `gpsvInterleavedBatch`，SRC-014 | 批量五对角 QR，双精度 API，interleaved layout | 单 NVIDIA GPU | 官方、可获得、数值路线独立 | 选为必须执行的 P=1 外部 baseline |
| Ginkgo 2025，SRC-015 | 任意带宽 GPU-resident batched LU；一系统一 workgroup | 单 GPU，多后端；小系统批量 | 可覆盖五对角，但典型规模/映射与本项目不同 | 可选 comparator；也否定“GPU 一般带宽实现空白” |
| Bienner et al. 2024，SRC-016 | 在 CFD 五对角场景评估 ScaLAPACK/SPIKE/PaScaL 路线 | MPI/CPU CFD | 明确指出通用带状法存在但专用五对角成本重要 | 支撑“专用低通信实现仍有工程价值”，不支撑首次性 |

## C2–C6 措辞决策

| 主张 | 决策 | 论文允许措辞 | 禁止措辞 |
| --- | --- | --- | --- |
| C2：一般 `m` 缩约规模/带宽 | 降级为方法推导与统一记号，不列核心创新 | “在本项目的 PaScaL 式行布局下推导并验证为……” | “首次发现一般带宽缩约”“首个任意带宽算法” |
| C3：`3m(m-1)` 结构零与 `5m²+m` 下界 | 保留为候选理论增量；TASK-019 前只写“本项目推导” | “我们推导出该具体接口编码的结构零计数……” | “首次/唯一/最优下界”；检索不到精确公式不足以证明新颖 |
| C4：五对角 28→22 无损编码 | 保留为最强候选贡献，但限定为 PaScaL 式五对角通信布局 | “利用六个结构恒零槽构造固定 22 槽编码，并验证与 28 槽组装等价” | “新五对角求解算法”“已实现并加速”（TASK-006/016 前） |
| C5：降低 MPI 字节 | 归为实现结果，不单独作为算法创新 | “相对本项目 28 槽路径，前向 payload 从 28 降为 22 doubles/line” | “通信降低 21.4%”而不注明只指前向 payload；不得外推时间 |
| C6：降低通信/端到端时间 | 归为经验结果 | “在指定硬件/规模下，22 槽相对 28 槽的实测……”，同时报绝对时间与误差 | 未实测就称更快；与不同硬件/精度外部论文直接算 speedup |

结论：论文核心应从“一般 `m` 理论”收窄为“面向分布式多 GPU 五对角线批求解的 PaScaL 式扩展 + 特定 28→22 无损通信编码 + 可复现实测”。一般 `m` 只作为统一解释和未来工作。

## 外部 comparator 决策

### 必须执行：P=1 cuSPARSE

使用目标环境实际 CUDA Toolkit 中的 `cusparseDgpsvInterleavedBatch`：

- 双精度、相同 `Nsys`、全局 `Nrow=N3`、相同五条对角线和 RHS；
- 同时报告 cuSPARSE QR 与本项目无 pivot 消元的算法差异；
- 记录两种时间：solver-only（输入已是 interleaved）和 end-to-end（含 layout 转换）；
- 预热至少 2 次，正式至少 5 次，使用同一 CUDA stream/同步边界；
- 同时比较相对残差、制造解误差和交叉误差；任一正确性 Gate 失败则不比较速度；
- 固定 CUDA/cuSPARSE 版本、代码 commit、编译 flags、GPU UUID、频率策略和计时范围。

### 条件式：ScaLAPACK `PDGBSV`

只在目标系统已安装 ScaLAPACK/BLACS 且一天内能链接时执行。当前 uniform-LHS benchmark 可将 `Nsys` 作为多 RHS；它用于说明通用分布式带状解法的成本/正确性，不作为“GPU 对 CPU 加速”头条，也不阻塞 TASK-006。若未执行，保存缺少依赖或不满足同输入的理由。

### 可选：Ginkgo/MAGMA 或 cuPentBatch

仅在能冻结版本、覆盖相同 `Nrow/Nsys` 区间并在一天内完成适配时加入。它们是单 GPU batched solver，不能支持多 GPU扩展性结论，也不能替代 cuSPARSE 必选基线。

### 多 GPU 主比较

截至本次检索，没有发现同时满足“每条五对角线跨 MPI ranks 分区、批量线系统、NVIDIA 多 GPU、可直接运行和公平同输入”的公开 comparator。TASK-009 应采用：

1. 同一 commit、同一输入的 28/22 配对消融；
2. 1/2/4/8 独占 GPU 的绝对时间、强弱扩展和阶段占比；
3. P=1 cuSPARSE 外部锚点；
4. 明确写出没有同构公开多 GPU comparator，而不是把内部 `penta-ref` 包装成外部 baseline。

## 人工复核清单

非原推导者需在本回执中补充姓名/日期并确认：检索式覆盖合理；先例表没有明显遗漏；C2–C6 降级合理；cuSPARSE 公平性合同可执行。签字前 TASK-013 为 `review`，不能标记 `done`。

```text
reviewer:
reviewed_at:
decision: accept / revise
missing_reference_or_comment:
```
