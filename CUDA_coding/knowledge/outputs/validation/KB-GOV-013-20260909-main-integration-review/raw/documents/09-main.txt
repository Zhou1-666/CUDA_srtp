# 软件任务队列

> 状态：`ready / blocked / in-progress / review / done`。一次 GPT 任务只领取一个 `ready` 项；完成交接遵循 [[task-handoff-protocol]]。

| ID        | 优先级 | 任务                                          | 依赖                                            | 状态      | 推荐模型                          |     |
| --------- | --: | ------------------------------------------- | --------------------------------------------- | ------- | ----------------------------- | --- |
| TASK-001  |  P0 | 修复两个 `pascal_a2av` 的未初始化 request/无效 WAITALL | WSL2 + NVHPC 24.11 + OpenMPI 4.1.5 的 L2–L4 通过 | done    | sol/high                      |     |
| TASK-002A |  P0 | 冻结上游 commit、逐文件 diff 和新增贡献边界                | Git baseline 与导师确认已归档                         | done    | terra/medium + 人工             |     |
| TASK-002B |  P0 | 固化 LICENSE/NOTICE、引用和公开范围                   | 私有范围 NOTICE 与引用清单草案待权利人复核                  | review  | terra/medium + 人工             |     |
| TASK-003  |  P0 | 建立统一 Node 知识/数学检查入口                         | 无                                             | done    | terra/medium                  |     |
| TASK-004  |  P1 | API 输入、空分区、CUDA/MPI 错误检查                    | TASK-001 已完成                                  | done    | sol/high                      |     |
| TASK-005  |  P1 | 新增 22 槽独立 pack/unpack 等价脚本                  | 无                                             | done    | sol/high                      |     |
| TASK-006  |  P1 | 实现可切换 28/22 Fortran 路径                      | `faffee3`；L2–L4 与 TASK-016 G2 已通过             | done    | sol/high/xhigh review         |     |
| TASK-007  |  P1 | persistent host staging buffers             | TASK-001、基线 profiler                          | blocked | terra/high                    |     |
| TASK-008  |  P1 | 索引/尺寸上界检查                                   | TASK-004                                      | done    | sol/high                      |     |
| TASK-009  |  P1 | 真实多 GPU benchmark与公平对照                      | TASK-002A、006、013、017、HPC 均满足                | ready   | terra/medium + sol/high audit |     |
| TASK-010  |  P1 | Poisson/Helmholtz 制造解集成                     | 导师确定接口/无主程序则独立 demo                           | blocked | sol/high                      |     |
| TASK-011  |  P2 | 论文主张和图表冻结                                   | TASK-002B、006、009、010、013、019                 | blocked | sol/xhigh                     |     |
| TASK-012  |  P0 | 修正当前入口文档漂移并重构红队 Gate                        | 用户红队复核                                        | done    | terra/medium                  |     |
| TASK-013  |  P0 | 新颖性检索与外部 comparator 决策                      | 技术审计、辅助补查与独立人工审阅均已归档                  | done    | sol/xhigh + 人工                |     |
| TASK-014  |  P0 | 冻结 28 槽论文级正确性/性能 baseline                   | TASK-001、004、008；cuSPARSE 适配                  | done    | terra/high + sol/high audit   |     |
| TASK-015  |  P1 | 数值稳定性矩阵族与主元失败合同                             | 六类矩阵与 NVHPC `np=1/2` 回归已归档                    | done    | sol/high                      |     |
| TASK-016  |  P1 | 28/22 动态内存检查与生命周期压力回归                       | `faffee3`；sanitizer 与各 100 次通过              | done    | sol/high                      |     |
| TASK-017  |  P0 | 提前核验真实多 GPU 环境、映射和资源排期                      | ParaAI 双 A100 绑定、拓扑与 `np=2` smoke 已归档         | done    | terra/medium                  |     |
| TASK-018  |  P1 | 建立 28/22 显存容量模型和安全规模                        | `8df948e` 模型预检与 BSCC-N32-H A100 smoke 已归档     | done    | terra/high                    |     |
| TASK-019  |  P1 | 一般 `m` 公式的独立证明审阅                            | TASK-013、SRC-004 已满足                         | ready   | sol/xhigh + 非原推导者             |     |
| TASK-020  |  P1 | 建立扩展关键路径模型并决定 overlap Gate                  | TASK-006、007、017、profiler                     | blocked | sol/high                      |     |
| TASK-021  |  P2 | 条件式实现通信重叠                                   | TASK-020 判定值得做                                | blocked | sol/xhigh review              |     |
| TASK-022  |  P0 | P=1 cuSPARSE 五对角外部 baseline adapter 与可用性核验  | TASK-014 的内部 28 槽基线已冻结                        | done    | sol/high + sol/high audit     |     |

## 红队 Gate

- `G0-A`（内部 22 槽研发方向）：TASK-002A、013 通过；TASK-017 至少给出真实多 GPU 环境可用性判断；
- `G0-B`（公开发布/投稿）：TASK-002B 与导师范围/署名确认通过；未通过不阻塞内部实验，但禁止公开发布和投稿；
- `G1`（领取 TASK-006）：28 槽代码 SHA、输入、容差、五次重复计时和外部 comparator 决定均已冻结；
- `G2`（TASK-006 done）：TASK-016 动态内存/替代检查和 100 次生命周期压力回归通过；
- overlap 不是默认功能：只有 TASK-020 证明 MPI 占比和可重叠工作值得增加复杂度时，TASK-021 才能转为 `ready`。

## 未完成任务：缺口、完成判据与首个动作

> 本表为快速摘要；以 [[task-blocker-register]] 为唯一的逐任务更新台账。`review` 表示技术工作已完成、但仍缺指定人工证据；`blocked` 表示前置条件尚未满足，不能绕过。只有台账“解除证据”和任务合同验证均满足，才允许改为 `done`。

| ID | 当前还差什么（不可省略） | 完成前必须补齐 | 首个可执行动作 / 外部输入 | 解除后状态 |
| --- | --- | --- | --- | --- |
| TASK-002A | 已完成：上游冻结、逐文件审计及导师对来源/贡献边界的书面确认均已归档。 | 关闭证据见 `outputs/reviews/TASK-002A-20260817-upstream-audit.md`；该确认不替代发布许可或最终作者排序决定。 | 若初始文件来源或署名发生争议，重新开启审计并保留本回执。 | `done`；TASK-002B 的来源前置已解除，但其许可证/公开范围前置仍在。 |
| TASK-002B | 私有范围 NOTICE、README 说明和引用清单草案已完成；仍缺导师/权利人对最终文本及论文公开审查要求的确认。 | 复核 `NOTICE` 与 [TASK-002B 回执](outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md)；确认是否需要机构/竞赛/保密审查；明确维持“不创建公开源码 LICENSE”。 | 将草案交导师/权利人确认；未经确认不得改变仓库私有状态或发布源码。 | `done`；解除论文公开 Gate G0-B，但仓库保持私有。 |
| TASK-006 | 已完成：`faffee3` 上可切换 Fortran、API 18/18、profiled 20/20、普通入口 2/2，以及 TASK-016 动态/生命周期 Gate 均通过。 | 关闭证据见 TASK-006 与 TASK-016 两份验证回执；没有性能结论。 | 若布局、plan 所有权或 runner 改变，重开相关 Gate。 | `done`；TASK-009 已解锁。 |
| TASK-007 | 没有 profiler 基线证明 host staging 分配/释放是瓶颈，也没有生命周期设计。 | TASK-014 的 phase profile 显示该路径有可测占比；定义 buffer 所有权、create/clean/错误回滚和线程安全约束；同输入性能多次计时且无回归。 | 从 TASK-014 的 CSV 判断 staging 占比；若未达预注册阈值，记录“不做”的 ADR，而非强行实现。 | `ready` 或以“不值得做”关闭。 |
| TASK-009 | TASK-006/016 已关闭，真实双 A100 环境已确认；尚无正式扩展数据。 | 按 `benchmark-protocol.md` 跑强/弱扩展、28/22 配对及 P=1 cuSPARSE；每配置至少五次、保存环境/UUID/输入/原始 CSV；先过残差和制造解比较。 | 项目负责人明确领取后，在 A100 预约内先执行固定输入正确性预检；不得把 TASK-017 smoke 或 TASK-006 单次时间当正式扩展数据。 | `ready`。 |
| TASK-010 | CFD/FFT 宿主接口未定，当前没有可执行应用闭环。 | 导师确认接入现有主程序，或批准独立 Poisson/Helmholtz demo；冻结离散、边界、制造解、误差阈值和输入输出接口；运行端到端正确性回归。 | 向导师确认“给出宿主代码/接口”或“批准独立 demo”二选一，并把决定写入 ADR。 | `ready`。 |
| TASK-011 | 论文所需实现、性能、应用、许可与一般 m 审阅证据尚不齐。 | TASK-002B、006、009、010、013、019 全部完成；逐条将图、表、数字绑定到代码 SHA/原始 CSV/文献；删除没有证据的主张并做投稿前检索更新。 | 完成前不得写结论性性能/首次性措辞；先等待前置任务，不领取。 | `ready`。 |
| TASK-013 | 已完成：技术检索、模型辅助补查及周一涵的独立人工审阅均已归档。 | 关闭证据见主审计回执和 `outputs/reviews/TASK-013-AI-AUDIT-20260820.md`；投稿前仍须更新数据库检索。 | 若发现 Pentadsolver 的代码/正式出版物或新的直接先例，重开审计并更新相关工作。 | `done`；G0-A 的新颖性人工项已解除。 |
| TASK-015 | 已完成：六类矩阵族、尺度不变主元阈值和失败码 `4` 已进入实现；NVHPC `np=1/2` 12 项通过。 | 关闭证据见 `outputs/validation/TASK-015-20260820-wsl-nvhpc24.11/`；不支持任意病态系统或主元交换。 | 若实现 pivoting 或调整阈值，另立数值算法任务并重跑本矩阵族。 | `done`。 |
| TASK-016 | 已完成：28/22 各 100 次 `np=2` 生命周期、memcheck/initcheck 和 plan 全分配释放检查均通过。 | 关闭证据见 `outputs/validation/TASK-016-20260820-wsl-nvhpc24.11/`；源码 SHA `faffee3`。 | 若 plan 字段、create/clean 或通信 buffer 所有权改变，重开本回归。 | `done`。 |
| TASK-018 | 已完成：`8df948e` 上 6 项模型自检、30 GiB FIT、exit 2 REJECT；BSCC-N32-H A100 的安全规模 manufactured smoke exit 0。 | 关闭证据见 `outputs/validation/TASK-018-20260819-bscc-n32h-a100/`；22 槽仍仅为投影。 | 若日后修改模型计数或 budget 合同，另立任务并在目标环境复验。 | `done`。 |
| TASK-019 | TASK-013 已完成；仍缺一般 m 的非原推导者数学复算和投稿前更新检索。 | 独立审阅者从递推到 `3m(m-1)`/`5m²+m` 逐步复算并签字；投稿前在可访问的学术数据库重复检索并记录日期/式子。 | 等待项目负责人领取；将 `general-m-reduction.md` 和两个 Node 验证交给非原推导者，在此之前 C3 只能是候选贡献。 | `done`。 |
| TASK-020 | 22 槽已到 `review`、真实双 GPU已确认；仍缺 TASK-006/007 关闭和同输入真实多 GPU阶段 profile。 | TASK-006、007、017 完成；基于同一输入的 profile 建关键路径模型，预先定义 MPI 占比/可重叠工作阈值；给出“做/不做 overlap”的可审计结论。 | 不提前实现；收集上述数据后由高推理审阅模型复核。 | `ready`。 |
| TASK-021 | overlap 是否值得做尚未被 TASK-020 证明；没有不改变数值语义的实现合同。 | TASK-020 明确判定值得做；设计非阻塞通信、buffer 生命周期、完成同步和错误路径；完成正确性、死锁、多 rank 及同输入性能回归。 | 仅在 TASK-020 结论为“值得做”后领取；否则保持关闭并记录理由。 | `ready` 或以“不做”关闭。 |

TASK-012 已完成本轮规划入口同步，决策记录见 [[../wiki/decisions/ADR-003-红队评审后的Gate重构]]；历史任务合同中的“五项检查”等数字保留为当时完成定义，不用它们替代当前七项统一检查。

## 可领取任务合同

```yaml
id: TASK-XXX
goal: 一个可验收结果
knowledge_inputs: []
target_files: []
allowed_changes: []
forbidden_changes: []
dependencies: []
validation: []
outputs: []
model: gpt-5.6-terra
reasoning: medium
stop_conditions: []
```

## TASK-001 合同与当前交接

```yaml
id: TASK-001
goal: 删除三/五对角 pascal_a2av 在阻塞式 MPI_ALLTOALLV 后的无效等待，并处理 MPI 返回码
target_files:
  - CUDA_code/源代码/src/PaScaL_TDMA_cuda.f90
  - CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90
allowed_changes:
  - 删除未初始化 request 数组和无效 MPI_WAITALL
  - 检查 MPI_ALLTOALLV 返回码并在失败时 MPI_ABORT
forbidden_changes:
  - 消元算法
  - 28 槽布局
  - 性能路径和 benchmark
validation:
  - 改动前后统一 L0/L1 检查
  - 静态确认两个子程序不存在 WAITALL/request
  - NVHPC + MPI 干净构建
  - np=1/2 三、五对角回归
current_status: done
evidence:
  - knowledge/outputs/validation/TASK-001-20260817-wsl-nvhpc24.11/README.md
model: gpt-5.6-sol
reasoning: high
```

## TASK-003 合同

```yaml
id: TASK-003
goal: 一条命令运行知识 lint 和五项 Node 数学检查
knowledge_inputs:
  - wiki/testing/test-matrix.md
target_files:
  - 新增 scripts/check_knowledge.ps1
  - 新增 scripts/check_math.ps1 或统一入口
allowed_changes:
  - 只新增检查脚本和说明
forbidden_changes:
  - Fortran 源码
  - 数学脚本算法
validation:
  - 当前 36+ Markdown 无失效 wikilink
  - 五项 Node 命令退出码均为 0
outputs:
  - 脚本
  - query/experiment receipt
model: gpt-5.6-terra
reasoning: medium
```

## TASK-004 合同与当前交接

```yaml
id: TASK-004
goal: 只为五对角公共 API 补充输入、空分区和 CUDA/MPI 错误检查
target_files:
  - CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90
  - CUDA_code/源代码/examples/test_penta_api_validation.f90
  - CUDA_code/源代码/verify/run_penta_api_validation.sh
allowed_changes:
  - plan 生命周期和参数合同
  - Nsys<nprocs 明确拒绝
  - 分配、MPI 返回码、CUDA launch/已有同步返回码检查
forbidden_changes:
  - 三对角源码
  - 消元算法和 28 槽布局
  - 性能优化和 benchmark 源码
validation:
  - 改动前后统一 L0/L1
  - NVHPC + MPI 干净构建
  - 14 个 API 正反用例
  - 五对角 np=1/2 回归
  - unchanged benchmark profiled smoke
current_status: done
evidence:
  - knowledge/outputs/validation/TASK-004-20260817-wsl-nvhpc24.11/README.md
model: gpt-5.6-sol
reasoning: high
```

## TASK-005 合同

```yaml
id: TASK-005
goal: 独立验证 28→22 紧凑映射可无损恢复相同 32 槽缩约系统
knowledge_inputs:
  - wiki/methods/28-to-22-slot-map.md
  - wiki/methods/penta-data-layout.md
target_files:
  - verify/ 新增独立 JS 脚本
allowed_changes:
  - 验证脚本
forbidden_changes:
  - Fortran
  - benchmark 历史数据
validation:
  - 覆盖四方程所有槽
  - 随机与结构边界配置
  - 28/22 unpack 后逐槽一致
outputs:
  - 脚本、运行结果、实验卡、主张矩阵更新
current_status: done
evidence:
  - verify/penta_comm_22_verify.js
  - knowledge/wiki/experiments/EXP-001-28-to-22-layout-equivalence.md
  - knowledge/outputs/validation/TASK-005-20260817-node/README.md
model: gpt-5.6-sol
reasoning: high
```

## TASK-008 合同与当前交接

```yaml
id: TASK-008
goal: 在五对角分配、MPI 描述符或 CUDA kernel 使用默认整数前拒绝不可安全表示的尺寸
knowledge_inputs:
  - wiki/methods/index-width-contract.md
target_files:
  - CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90
  - CUDA_code/源代码/examples/test_penta_api_validation.f90
  - CUDA_code/源代码/verify/penta_index_bounds_verify.js
allowed_changes:
  - setup/API 层 int64 临时乘法和上界检查
  - setup-only 边界脚本与非法 API 用例
forbidden_changes:
  - CUDA 热循环索引类型
  - 三对角源码
  - 消元算法、28/22 槽布局、性能路径和 benchmark 源码
validation:
  - 8 个 plan 精确边界、7 个矩阵精确边界、10000 个随机 setup-only 配置
  - NVHPC + MPI 干净构建
  - 16 个 API 正反用例
  - 五对角 np=1/2 与 unchanged profiled smoke
current_status: done
evidence:
  - knowledge/wiki/experiments/EXP-002-index-bound-preflight.md
  - knowledge/outputs/validation/TASK-008-20260817-wsl-nvhpc24.11/README.md
model: gpt-5.6-sol
reasoning: high
```

## TASK-002A 合同

```yaml
id: TASK-002A
goal: 确定上游不可变版本，并把继承代码、五对角新增代码和本项目修改逐文件分开
target_files:
  - knowledge/raw/source-registry.md
  - 新增上游差异/贡献边界报告
allowed_changes:
  - 来源、哈希、diff、署名和论文措辞说明
forbidden_changes:
  - 求解算法、通信布局、benchmark
validation:
  - 上游 URL 与 commit 可重取
  - 导入文件哈希和 diff 可复核
  - 每项论文贡献能指向新增文件/公式/实验
stop_conditions:
  - 上游 commit 或实际许可证无法确定
  - 导师对署名/贡献边界尚无决定
current_status: done
evidence:
  - knowledge/outputs/reviews/TASK-002A-20260817-upstream-audit.md
  - knowledge/wiki/reference/upstream-diff-and-contribution-boundary.md
handoff:
  - 上游公开 HEAD 已冻结为 e637d5ecab0f08308eea83fbbb1872ead7ae07c5；三对角初始 blob 精确匹配历史 d69ae95。
  - 初始五对角实现由李洋在导师苏运德指导的研究生团队三对角源码基础上借助 AI 工具扩展形成；导师于 2026-08-20 确认其不属于本项目或后续执行者的独立原创。完整原文见审计回执“导师确认记录”。
model: gpt-5.6-terra
reasoning: medium + human review
```

## TASK-013 合同

```yaml
id: TASK-013
goal: 在实现 22 槽前确定一般 m、结构零裁剪和多 GPU 五对角的创新性边界与公平外部 comparator
outputs:
  - 检索式、数据库、日期和纳排标准
  - 方法/带宽/硬件/精度/通信/开源状态对照表
  - C2-C6 可用、降级或禁止的措辞
validation:
  - 从 PaScaL 论文前后向引用和独立关键词两路检索
  - 至少一名非原推导者人工审阅结论
  - 无公平 comparator 时明确记录不可比原因
forbidden_changes:
  - 未检索就声称首次、最优或无先例
current_status: done
evidence:
  - knowledge/outputs/reviews/TASK-013-20260817-novelty-and-comparator-audit.md
  - knowledge/outputs/reviews/TASK-013-AI-AUDIT-20260820.md
  - knowledge/wiki/reference/novelty-and-external-comparator.md
  - knowledge/wiki/decisions/ADR-004-外部Comparator与新颖性措辞.md
handoff:
  - 一般 m 缩约降级为方法背景；28→22 保留为限定布局的候选贡献。
  - P=1 必选 cuSPARSE gpsvInterleavedBatch；ScaLAPACK 条件式；已发现 Pentadsolver 等高度相邻的分布式多 GPU五对角先例，但尚未确认可公开取得并按同输入复现的实现。
  - 模型辅助审计已补入 NASA/OVERFLOW 与 Pentadsolver；周一涵于 2026-08-20 以 `accept` 完成独立审阅，TASK-013 关闭。
model: gpt-5.6-sol
reasoning: xhigh + human review
```

## TASK-014 合同

```yaml
id: TASK-014
goal: 在 TASK-006 前冻结可复现的 28 槽论文级 baseline
outputs:
  - 代码 SHA、环境、输入生成、容差和命令
  - debug/release 构建回执
  - 同配置至少五次绝对计时、中位数和波动
validation:
  - 七项统一检查
  - NVHPC 干净构建、np=1/2 正确性
  - 参考/实验路径同输入同精度
forbidden_changes:
  - 22 槽实现
  - persistent、CUDA-aware、overlap
current_status: done
evidence:
  - knowledge/outputs/validation/TASK-014-20260819-local-preflight/README.md
  - knowledge/outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/README.md
  - CUDA_code/源代码/verify/run_task_014_baseline.sh
handoff:
  - 七项独立检查、NVHPC `mpifort` debug/release 干净构建、np=1/2 × exact1/manufactured 正确性均已通过；五次单 GPU/np=1 release 基线的 exp 中位数为 `3.6474 ms`、CV `2.41%`，所有误差低于 `1e-10`。
  - 运行时回执：Open MPI `4.1.5`；RTX 4060 Laptop UUID `GPU-44881249-c7bc-01a6-688c-946e2e0d760a`，驱动 `560.94`，8188 MiB；单 GPU 多 rank 仅为通信正确性。
  - `c12afa99d1ac8ae6851e5a06309edff822a7b214` 是样本后的代码回执，构建瞬间 SHA 未打印；该可追溯性限制必须保留。
  - TASK-022 已在同 GPU/驱动、同 P=1 FP64 manufactured 固定配置下完成 cuSPARSE QR adapter、两次独立预热、五次正式启动和独立复审；外部 comparator 缺口已关闭，TASK-014 标记 done。
model: gpt-5.6-terra
reasoning: high + sol/high audit
```

## TASK-017 合同

```yaml
id: TASK-017
goal: 在第 1 周确认论文所需真实多 GPU 环境是否可用并完成最小双 GPU smoke
outputs:
  - check_env、GPU 拓扑、驱动/NVHPC/MPI/CUDA-aware 状态
  - rank 到 GPU UUID 映射
  - 资源预约或无法取得资源的降级决定
validation:
  - 每 rank 独占 GPU
  - np=2 正确性 smoke
forbidden_claims:
  - 把 smoke 或单 GPU 多 rank 当作扩展性证据
model: gpt-5.6-terra
reasoning: medium
```

## TASK-022 合同

```yaml
id: TASK-022
goal: 为固定的五对角 P=1 输入建立可复核的 cuSPARSE gpsvInterleavedBatch 外部 baseline，或归档可复现的独立适配失败证据
knowledge_inputs:
  - wiki/briefs/penta-active-context.md
  - wiki/decisions/ADR-004-外部Comparator与新颖性措辞.md
  - wiki/performance/benchmark-protocol.md
  - wiki/testing/test-matrix.md
  - meta/task-blocker-register.md
target_files:
  - CUDA_code/源代码/perf_bench/ 下新增隔离的 cuSPARSE adapter、构建目标和运行脚本
  - CUDA_code/源代码/verify/ 下新增 adapter 验证入口（若需要）
  - knowledge/outputs/validation/TASK-022-*/
allowed_changes:
  - 新增独立 CUDA C/C++ 或 Fortran ISO_C_BINDING adapter
  - 将 P=1 benchmark 输入转换为 cuSPARSE 要求的 interleaved/batch 布局
  - adapter 专属构建、正确性、五次计时和环境记录
forbidden_changes:
  - PaScaL_TDMA_cuda_penta.f90、28 槽通信、22 槽实现
  - 既有 benchmark_penta 的数值路径与历史计时口径
  - 将 adapter 不可用或内部 serial 对照伪称为 cuSPARSE 结果
validation:
  - 记录 CUDA Toolkit、cuSPARSE header/library、GPU、驱动和 API 可用性
  - 与相同 P=1 FP64 exact1、manufactured 输入逐项对照；误差或残差不高于 1e-10
  - 固定输入、预热两次、独立启动五次，保存原始时间与中位数/CV
  - 若无法适配，保存最小复现命令、编译/运行输出、API 版本与不适配原因，交由独立审查
outputs:
  - adapter 或独立适配失败回执
  - 可复制命令、原始日志位置、环境元数据、五次 CSV（成功时）
  - TASK-014 回执和 claim-evidence-matrix 的外部 comparator 更新
dependencies:
  - TASK-014 内部 28 槽基线已记录
model: gpt-5.6-sol
reasoning: high
audit_model: gpt-5.6-sol
audit_reasoning: high
escalate_to_xhigh_when:
  - API 数据布局与五对角系数/RHS 映射出现无法由官方文档消除的歧义
  - cuSPARSE 与独立稠密真值或既有制造解出现不一致
stop_conditions:
  - 未经独立审查不得以失败证据关闭外部 baseline 缺口
  - 发现必须修改现有 28 槽 Fortran 或 benchmark 才能适配时，停止并另立设计任务
current_status: done
evidence:
  - knowledge/outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/README.md
  - knowledge/outputs/validation/TASK-022-20260819-wsl-cuda12.6-fair/independent-audit.md
  - knowledge/outputs/validation/TASK-022-R1-20260819-wsl-cuda12.6/README.md
  - knowledge/outputs/validation/TASK-022-R1-20260819-wsl-cuda12.6/independent-audit.md
  - CUDA_code/源代码/perf_bench/cusparse_penta_baseline.cu
  - CUDA_code/源代码/perf_bench/Makefile.cusparse
  - CUDA_code/源代码/verify/run_task_022_cusparse.sh
handoff:
  - exact1/manufactured 的最大解误差分别为 `1.1107e-11`/`1.0436e-11`，最大残差约 `2.8e-15`，均通过 `1e-10` Gate。
  - 公平回执采用两次独立预热和五次独立正式启动，每次正式启动计时 10 次且 `warmups=0`；solver-only 中位数 `6.686515188 ms`、IQR `1.218051243 ms`、CV `10.684923%`。
  - R1 重复回执使用同一 adapter 源码与相同协议，solver-only 中位数 `5.606400013 ms`、IQR `0.183091259 ms`、CV `3.857337%`；两轮保留为独立会话结果，不合并也不以较快一轮替代原回执。
  - 最终独立 GPT-5.6-sol/high 审查为 PASS；仅允许与 TASK-014 `3.6474 ms` 做固定 RTX 4060/CUDA 12.6/P=1/FP64 配置的受限 solver-window 比较，禁止多 GPU或普遍性能外推。
```

## 用户材料如何解除阻塞

- 导师确认初始五对角/派生构建文件的作者与论文署名边界：将 TASK-002A 从 review 解除；
- 完成实际许可证人工核验：解除 TASK-002B；
- 提供真实多 GPU 集群访问与 `check_env.sh` 输出：推进 TASK-017/009；
- 提供现有 CFD/FFT 主程序或确认独立 demo：解除 TASK-010；
- 确认论文/结题截止日期和目标期刊：帮助 TASK-011 排期。
