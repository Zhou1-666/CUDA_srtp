# TASK-010 独立最终实现审查与谱系补充

日期：2026-08-26。审查者：独立上下文子代理 `/root/task010_final_review`，按 `requesting-code-review` 执行只读审查。以下为主执行人整理的返回结论，非人工签字。未修改文件、分支或索引，没有 GPU/SSH 执行。

范围：实现分支从 `91ecc661e0cd856c61bdc5b69f5aa065faadf078` 到 `8e58e4988e0cf62b33ba4848747e9bfe0fb5f620` 的六个交付文件；另检查归档实际求解器相对实现工作树的完整差异。契约来自 ADR-007 和 TASK-010 制造解设计。

## 结论

**ACCEPT：冻结 TASK-010 demo 范围。** 指定 32 组、各 rank 参数和环境一致的数值路径中未发现 Critical 或 Important 缺陷。此结论不构成合并授权，也不表示对所有输入、跨节点、二进制或性能的等价性证明。

## 已检查

- 矩阵装配符合冻结的算子、缩放连续右端、端点单位行与解析幽灵点移项。
- 主机原始数据与设备可覆盖工作副本分离；残差不使用已被求解器覆盖的设备系数。
- Fortran 存储顺序与 MPI_Gatherv 计数/位移一致，之前的全局 extent 检查约束这些乘积。
- GPU 选择遵循已有示例模式，不支持更广的拓扑/扩展性主张。
- Makefile 只增独立目标；三个 TASK-010 Node 入口和七个既有 Node 入口均通过。主执行人另行重跑，输出保存在同目录。

## 三项 Minor（本轮保留，不修改代码）

1. `source/examples/ex_penta_poisson_helmholtz.f90:94–98`：环境变量解析中的 `collective_require` 仅在变量存在且非空时运行。如果某 rank 缺省 28、另一 rank 显式 28，后续 MPI_ALLREDUCE 顺序可能错位。属于源码检查发现，未在 MPI 上复现；建议未来在分支外无条件进行解析状态的集体校验。此次脚本显式向所有 rank 导出同一变量，不影响冻结用例。
2. `source/verify/run_task_010_manufactured.sh:36–50,67`：runner 自行写表头并按 PDE 前缀抽取行，未验证原始日志表头。只读内存重建试验中，32 条不带原始表头的行仍能被接受。未来扩展时应检查原始表头；本次主执行人已独立确认全部 32 个日志有准确表头。
3. `source/verify/task010_manufactured_audit.js:99–112`：仅检查有限数，没有检查残差/时间非负；Nz32 的误差不参与最终两段阶数。只读 Node 试验将 residual/time 及 Nz32 两个误差改为 -1 后仍接受。实际 Fortran 指标计算不会产生这些负数，本次全量原始数据也逐项非负；未来应补指标域检查。

以上范围风险不是隐藏的通过条件。此次限定接受依赖已经归档并核实的统一环境、原始表头、有限且非负的指标；不能外推为任意畸形输入的校验保证。

## 实际构建源码谱系补充（独立审查返回）

**有限接受：已记录的求解器差异不阻塞本次冻结数值 demo 关闭。** 审查者检查了 [完整差异](remote-vs-implementation-solver.diff)，五个 diff hunk 仅涉及：

- `ptdma_timing_cuda` 新增五个字段；
- 对五个字段的初始化；
- `pascal_solver_profiled_penta` 内两处通信调用替换；
- 新增诊断 helper `pascal_a2av_profiled`。

归一化 CRLF/LF 后，`pascal_plan_create`、`pascal_plan_clean`、`pascal_validate_solver`、`pascal_solver`、`pascal_a2av` 的子程序体一致，完整 diff 中无 kernel 改动。归档 demo 只调用一次普通 `pascal_solver`，没有使用 profile 入口或 timing record；新 helper 的两次调用仅在 profiled solver 内。因此既有 TASK-007 增量没有改变 demo 调用的普通源码路径。

实际测试源码仍必须记录为 detached `3c658a7` 加归档差异，并引用 [逐文件谱系](source-provenance.json)；不得写成干净 `8e58e49` 整树构建、整个远端等价、二进制等价或性能等价。本补充没有重复测试、构建或提交 GPU 作业。

## 主执行人证据交叉检查

实际提交脚本与预检脚本字节相同，显式 `-x PENTA_FORWARD_SLOTS`；归档 11 个源码/构建文件中 10 个匹配实现提交（含六个交付文件）；剩余 solver 为上述 profile 增量。32 份原始日志与 CSV 一致，表头准确且指标非负，完整 CSV 的独立 CLI 重算与远端 summary 字节一致。上述结论来自本地原件和日志，不单凭子代理“通过”消息。
