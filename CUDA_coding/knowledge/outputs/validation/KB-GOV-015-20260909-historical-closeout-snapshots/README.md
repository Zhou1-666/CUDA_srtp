# KB-GOV-015：六条历史关闭快照补录

状态：done（工作区文档交付）。用户选择本合同后，已核对TASK-001/003/004/005/008/012的原回执、历史queue变更和当前状态，补齐六条最短已解除快照。仅修改task-blocker-register、015治理queue行、必要compile-log里程碑及本回执；软件状态、源码、原件、研究结论、许可与排程保持。

原件清单与领取现场见[raw/intake.json](raw/intake.json)，三份meta原始字节保存在raw/before-*.bin。六条历史变更与回执指纹见[historical-evidence.json](historical-evidence.json)。本任务只写工作区文档，没有提交Git；领取main为`6b959f5d785d1359f8ded5287c371a8affe9c79c`。

| 任务 | 原记录日期及main历史提交 | 原关闭依据 | 必须保留的范围 |
| --- | --- | --- | --- |
| TASK-001 | 2026-08-17，`7ee9f8a3e41469e3d890e842147960e8c0405f35` | WSL/NVHPC干净构建，三/五对角各np=1/2最终回归 | 单GPU多rank；三对角默认np=2曾输出0.000，禁用同GPU CUDA IPC后的通过不能抹除失败 |
| TASK-003 | 2026-08-17，`155add3f03e1cfc7533956ec0f5823061bc79d2f` | 原query回执：统一入口，知识lint和五项Node检查 | 0错误但5项元数据警告；不覆盖CUDA/MPI/GPU |
| TASK-004 | 2026-08-17，`e14a35fc683bae47d2b5444feec7a8fe5e4fa453` | 原验收回执及API summary：14例、0失败 | 未覆盖整数溢出、零/近零主元策略、Sanitizer、CUDA-aware和真实多GPU；smoke非性能结论 |
| TASK-005 | 2026-08-17，`39a59de45edf8b9f05a85d16f1df11c0b67915f7` | 原回执：180组、403,200次逐槽检查、28/28故障注入 | 只证明pack/unpack映射；未证明Fortran 22槽路径或加速 |
| TASK-008 | 2026-08-17，`ddc3be10bc9e83d27d6e52a432d5e4e0f1706f14` | 原验收回执及API summary：setup边界、16例、0失败 | 热循环32位；未验证Sanitizer、真实多GPU、大计数MPI或64位kernel；无性能结论 |
| TASK-012 | 2026-08-17，`9f4cee6965ee117bc958b8bb0963f24525889db9` | ADR-003、同提交的compile记录和queue新增done行 | 文档Gate重构；不表示许可、科研或GPU验收，也不把当时TASK-006 blocked重新施加到当前 |

日期口径：六个提交都在main祖先链，且对应queue均在该提交首次从非done（012此前无该行）变为done。这里记录的是可核验的历史状态变更/回执日期；不推断签字日期。原回执未单列验收决定人，保留该未知，不把Git提交者当批准人。本次补录和核对日期为2026-09-09，补录责任方Codex。六条按原结论记为正常交付，不编造曾经blocked或新的关闭批准。

源回执当前文本与对应历史Git blob在仅忽略CRLF/LF时一致；原始字节分别记录SHA，未作换行清洗。TASK-003没有另找出独立原始stdout，TASK-005目录仅含原README参考摘要；本次依据已入main的原关闭回执，不冒称取得独立原始运行日志。TASK-012没有单独validation README，使用原ADR及同提交queue/compile记录作为文档关闭依据。这些限制不用于追溯重判软件状态。

验证结果：六任务在queue仍done；blocker由0条补至各1条；按[精确编辑记录](changes.json)逆变换后，三meta恢复原字节。1412份保护文件（已跟踪工作文件、指定原回执目录及可见未跟踪源码）指纹保持，Git HEAD/index/refs/worktree不变。关闭前检查见[preclose-verification.json](raw/preclose-verification.json)，最终核对见[final-verification.json](raw/final-verification.json)。其余未跟踪任务文件不在本次指纹保护测量范围；全局Git ignore文件不可读的限制保留。

实际知识lint通过，最终计数与完整输出见[knowledge-lint-final.log](raw/knowledge-lint-final.log)。本次没有运行历史数学脚本、NVHPC构建、GPU、SSH或Slurm；没有把阅读原日志写成重新运行通过。

本次没有新增来源、科学主张、开放问题、稳定验证方法或导航；已核index、source-map、open-questions和change-impact-map，不追加Wiki、来源编号或重复排程。旧原件及历史回执保持原状，compile-log只记本次里程碑。

人工复验：在仓库根目录运行下列只读文档检查，预期退出0且`Knowledge lint: PASS`；失败保存stdout、stderr与退出码。它不重跑历史GPU/数学验收。

```powershell
pwsh -NoProfile -File CUDA_coding/scripts/check_knowledge.ps1 -ProjectRoot CUDA_coding
```

本批完成后已登记KB-GOV待办归零，不自动创建016。唯一下一软件任务仍为queue中的TASK-031：按已有剩余门表准备debug实际运行的有界合同/本地交付；依赖已核验六门与不变v7指纹，后续跨节点、适用性能和最终冻结审阅仍保留。推荐gpt-6-astra / XHigh，本轮不执行。
