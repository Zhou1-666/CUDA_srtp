# KB-GOV-005：TASK-031 blocker 活动缺口与历史分离

- 启动/恢复点日期：2026-09-08；关闭核验日期：2026-09-09（跨日完成，目录沿用启动日期）；执行与核对：Codex；依据：用户明确选择 KB-GOV-005。软件证据仍截至09-08，未把跨日整理当成新调度观测。
- 单一目标：整理 blocker 的 TASK-031 条目，保留可执行的缺口/类别/责任方/解除证据和全部历史；软件状态仍为 `in-progress`。
- 允许修改：`knowledge/meta/task-blocker-register.md` 的 TASK-031 与本次治理记录；`task-queue.md` 的治理行；`meta/README.md` 一处范围说明；`compile-log.md` 一条里程碑；本回执目录。
- 数值/证据约束：不改源码、冻结包、既有回执、门禁、软件合同或授权；不运行远端查询/作业，不提交或合并 Git。
- 步骤与验收：先核 queue 与 v7 回执第29节并保存恢复点；再归档原文、重定位链接及归并缺口；最后核可逆还原、限定改动范围、Git/保护对象及知识 lint。
- 停止条件：恢复点不匹配、证据矛盾、链接目标无法确认或保护对象发生变化时，停止对应迁移，不猜测关闭状态。

## 事实与归并依据

基准为 [迁移前 blocker](raw/before/task-blocker-register.md.txt) 第203–392行及 [v7 回执](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/README.md)。本批只核已有资料，没有新增调度观测。

| 活动内容 | 原文依据 | 归并边界 |
| --- | --- | --- |
| 调度/资源/可见性 | 原第207–217行；v7 第24–29节 | job1483542 已接收、授权已消耗；待管理员说明，既有预检/提交不重跑；请求内存不等于 allocation |
| GPU 与适用 SOP 门禁 | 原第237–241行及后续状态保留句 | v7 GPU 未验收；保留实际 MPI 映射、独立 CSV 审计、每 rank Sanitizer、debug/跨节点/集成/性能缺口；v5 完整 L6 历史 FAIL 不升级 |
| 原件与版本身份 | 原第205、211、217、239–241行 | 聊天还原的三个 JSON 已核 SHA，不称独立下载；完整构建/预检/运行原件、产物身份及旧原件仍需回收 |
| 计算节点环境 | 原第219、239–255行 | 真实 driver/UUID、系统/tmp/配额不由登录预检或 L2 自动关闭；不重新打开已经解除的上传/解包/构建缺口 |

所有旧阶段的命令、失败与批准全文留在快照；它们的历史“下一动作”不再构成活动入口。源码优化建议仍只读，SRC-029 原包缺失与 TASK-033 边界保持。

## 恢复点与范围

- [迁移前清单](raw/before-manifest.json)：4 份活动文档原始字节及 SHA；368 个既有保护对象；Git HEAD/index/refs/worktree 状态。
- TASK-031 原段：190 行、116462 字节；SHA-256 `91a5f7bd87907f0b86ac9ca8ee9056f9c7eb6a15b59a76c2f21228d2cb97c6f4`。
- 无新来源、科研主张、数值结论或开放问题；不更新 Wiki、map、claim matrix 或测试矩阵。blocker 仅表达方式改变，软件缺口核对无变化。
## 交付与验证

- TASK-031 活动条目由190行/116462字节缩至17行/4973字节，保留4类缺口与唯一最小动作；其他软件 blocker 条目原文保持。
- [完整条目快照](task031-blocker.snapshot.md)保留旧文；[181个链接映射](local/link-relocations.json)保留原行号、前后路径和锚点。反向替换可还原原段 SHA，不删除任何旧失败、批准或命令。
- 活动文件只改4份：[blocker](../../../meta/task-blocker-register.md)、[queue 的治理行](../../../meta/task-queue.md#知识维护交付不参与软件排程)、[meta 说明](../../../meta/README.md)、[一条编译里程碑](../../../meta/compile-log.md)。完整差异见 [本批 diff](local/changes.diff)，基准为恢复点，不是混合已有 dirty 的 HEAD diff。
- [范围与证据检查](local/verify.log)：4份原始副本、368个保护对象、48行软件任务及整个 queue 软件正文、其他 blocker 条目、旧里程碑与 Git HEAD/index/refs/worktree 保持；快照可逆、链接目标及活动锚点检查通过。
- [知识 lint](local/knowledge-after.log)：Markdown=359、Wiki=36、Sources=33、Warnings=0、Errors=0；[差异空白检查](local/diff-check.log)通过。首次省略 `-ProjectRoot` 时，Windows PowerShell 在脚本默认参数求值处报告空路径，尚未执行知识检查；改用仓库已有的显式路径命令后通过，未修改 lint 脚本。
- 仅验收治理文档。未运行 NVHPC、MPI、GPU、SSH 或 Slurm，未修改 Git 索引/提交/分支；TASK-031 仍 `in-progress`，L2 用户回执 PASS、v7 GPU 未验收与 v5 完整 L6 历史 FAIL 保持。

## 人工复验

在 PowerShell 中执行下列只读检查；输出另存到系统临时目录，避免覆盖本批验收日志：

```powershell
node "D:/CUDA/CUDA_repository_recovery/CUDA_coding/knowledge/outputs/validation/KB-GOV-005-20260908-task031-blocker/local/verify.cjs" 2>&1 | Tee-Object -FilePath "$env:TEMP/KB-GOV-005-verify-user.log"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:/CUDA/CUDA_repository_recovery/CUDA_coding/scripts/check_knowledge.ps1" -ProjectRoot "D:/CUDA/CUDA_repository_recovery/CUDA_coding" 2>&1 | Tee-Object -FilePath "$env:TEMP/KB-GOV-005-knowledge-user.log"
```

预期分别出现 `KB-GOV-005 VERIFY: PASS` 和 `Knowledge lint: PASS`，知识检查0警告/0错误；保存失败时的完整输出、报错路径和当时 diff。范围检查绑定本批结束状态，后续授权任务改动保护对象后会提示差异，应先区分后续改动，不自动回滚。

唯一下一治理任务：**KB-GOV-006**，整理 compile-log 中 TASK-031 的过程记录，复用现有验证回执，保留里程碑与全部原文。依赖本批完成；责任方 Codex；推荐 **gpt-6-astra / XHigh**。仅登记 ready，本批未开始；软件下一动作继续以 queue 为准。
