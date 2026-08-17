# 软件任务队列

> 状态：`ready / blocked / in-progress / review / done`。一次 GPT 任务只领取一个 `ready` 项；完成交接遵循 [[task-handoff-protocol]]。

| ID | 优先级 | 任务 | 依赖 | 状态 | 推荐模型 |
| --- | ---: | --- | --- | --- | --- |
| TASK-001 | P0 | 修复两个 `pascal_a2av` 的未初始化 request/无效 WAITALL | WSL2 + NVHPC 24.11 + OpenMPI 4.1.5 的 L2–L4 通过 | done | sol/high |
| TASK-002A | P0 | 冻结上游 commit、逐文件 diff 和新增贡献边界 | Git baseline 已建立 | review | terra/medium + 人工 |
| TASK-002B | P0 | 固化 LICENSE/NOTICE、引用和公开范围 | TASK-002A、导师/许可人工核验 | blocked | terra/medium + 人工 |
| TASK-003 | P0 | 建立统一 Node 知识/数学检查入口 | 无 | done | terra/medium |
| TASK-004 | P1 | API 输入、空分区、CUDA/MPI 错误检查 | TASK-001 已完成 | done | sol/high |
| TASK-005 | P1 | 新增 22 槽独立 pack/unpack 等价脚本 | 无 | done | sol/high |
| TASK-006 | P1 | 实现可切换 28/22 Fortran 路径 | TASK-002A、005、008、013、014 | blocked | sol/high/xhigh review |
| TASK-007 | P1 | persistent host staging buffers | TASK-001、基线 profiler | blocked | terra/high |
| TASK-008 | P1 | 索引/尺寸上界检查 | TASK-004 | done | sol/high |
| TASK-009 | P1 | 真实多 GPU benchmark与公平对照 | TASK-002A、006、013、017、HPC | blocked | terra/medium + sol/high audit |
| TASK-010 | P1 | Poisson/Helmholtz 制造解集成 | 导师确定接口/无主程序则独立 demo | blocked | sol/high |
| TASK-011 | P2 | 论文主张和图表冻结 | TASK-002B、006、009、010、013、019 | blocked | sol/xhigh |
| TASK-012 | P0 | 修正当前入口文档漂移并重构红队 Gate | 用户红队复核 | done | terra/medium |
| TASK-013 | P0 | 新颖性检索与外部 comparator 决策 | SRC-002、上游/相关工作检索 | ready | sol/xhigh + 人工 |
| TASK-014 | P0 | 冻结 28 槽论文级正确性/性能 baseline | TASK-001、004、008 | ready | terra/high + sol/high audit |
| TASK-015 | P1 | 数值稳定性矩阵族与主元失败合同 | TASK-014 | blocked | sol/high |
| TASK-016 | P1 | 28/22 动态内存检查与生命周期压力回归 | TASK-006 到 review | blocked | sol/high |
| TASK-017 | P0 | 提前核验真实多 GPU 环境、映射和资源排期 | 集群访问 | ready | terra/medium |
| TASK-018 | P1 | 建立 28/22 显存容量模型和安全规模 | TASK-014 | blocked | terra/high |
| TASK-019 | P1 | 一般 `m` 公式的独立证明审阅 | TASK-013、SRC-004 | blocked | sol/xhigh + 非原推导者 |
| TASK-020 | P1 | 建立扩展关键路径模型并决定 overlap Gate | TASK-006、007、017、profiler | blocked | sol/high |
| TASK-021 | P2 | 条件式实现通信重叠 | TASK-020 判定值得做 | blocked | sol/xhigh review |

## 红队 Gate

- `G0-A`（内部 22 槽研发方向）：TASK-002A、013 通过；TASK-017 至少给出真实多 GPU 环境可用性判断；
- `G0-B`（公开发布/投稿）：TASK-002B 与导师范围/署名确认通过；未通过不阻塞内部实验，但禁止公开发布和投稿；
- `G1`（领取 TASK-006）：28 槽代码 SHA、输入、容差、五次重复计时和外部 comparator 决定均已冻结；
- `G2`（TASK-006 done）：TASK-016 动态内存/替代检查和 100 次生命周期压力回归通过；
- overlap 不是默认功能：只有 TASK-020 证明 MPI 占比和可重叠工作值得增加复杂度时，TASK-021 才能转为 `ready`。

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
current_status: review
evidence:
  - knowledge/outputs/reviews/TASK-002A-20260817-upstream-audit.md
  - knowledge/wiki/reference/upstream-diff-and-contribution-boundary.md
handoff:
  - 上游公开 HEAD 已冻结为 e637d5ecab0f08308eea83fbbb1872ead7ae07c5；三对角初始 blob 精确匹配历史 d69ae95。
  - 初始五对角实现相对上游为新增，但导入前作者/署名须导师确认；不得标记 done。
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

## 用户材料如何解除阻塞

- 导师确认初始五对角/派生构建文件的作者与论文署名边界：将 TASK-002A 从 review 解除；
- 完成实际许可证人工核验：解除 TASK-002B；
- 提供真实多 GPU 集群访问与 `check_env.sh` 输出：推进 TASK-017/009；
- 提供现有 CFD/FFT 主程序或确认独立 demo：解除 TASK-010；
- 确认论文/结题截止日期和目标期刊：帮助 TASK-011 排期。
