# 软件任务队列

> 状态：`ready / blocked / in-progress / review / done`。一次 GPT 任务只领取一个 `ready` 项。

| ID | 优先级 | 任务 | 依赖 | 状态 | 推荐模型 |
| --- | ---: | --- | --- | --- | --- |
| TASK-001 | P0 | 修复两个 `pascal_a2av` 的未初始化 request/无效 WAITALL | NVHPC/MPI 运行环境 | blocked | sol/high |
| TASK-002 | P0 | 建立正式 Git baseline、上游 diff 和 LICENSE/NOTICE | Git baseline 已建立；仍需上游 diff 与许可核验 | in-progress | terra/medium + 人工 |
| TASK-003 | P0 | 建立统一 Node 知识/数学检查入口 | 无 | done | terra/medium |
| TASK-004 | P1 | API 输入、空分区、CUDA/MPI 错误检查 | TASK-001 | blocked | sol/high |
| TASK-005 | P1 | 新增 22 槽独立 pack/unpack 等价脚本 | 无 | ready | sol/high |
| TASK-006 | P1 | 实现可切换 28/22 Fortran 路径 | TASK-001、005、28 baseline | blocked | sol/high/xhigh review |
| TASK-007 | P1 | persistent host staging buffers | TASK-001、基线 profiler | blocked | terra/high |
| TASK-008 | P1 | 索引/尺寸上界检查 | TASK-004 | blocked | sol/high |
| TASK-009 | P1 | 真实多 GPU benchmark | TASK-001、002、006、HPC | blocked | terra/medium + sol/high audit |
| TASK-010 | P1 | Poisson/Helmholtz 制造解集成 | 导师确定接口/无主程序则独立 demo | blocked | sol/high |
| TASK-011 | P2 | 论文主张和图表冻结 | TASK-006、009、010 | blocked | sol/xhigh |

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
model: gpt-5.6-sol
reasoning: high
```

## 用户材料如何解除阻塞

- 提供正式 Git 位置/上游来源：解除 TASK-002；
- 提供集群 `check_env.sh` 输出：推进 TASK-001/009；
- 提供现有 CFD/FFT 主程序或确认独立 demo：解除 TASK-010；
- 确认论文/结题截止日期和目标期刊：帮助 TASK-011 排期。
