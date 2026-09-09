# 2026-09-09：按任务分配模型与推理档位

用户要求：“把合理档位附着在每一个任务下，不要每一个都用xhigh。”本次直接调整现有任务元数据，不新增KB-GOV编号、不领取或重开软件任务。

task-queue的34个软件任务和15个KB-GOV任务均已附完整模型名及起步/分阶段建议。普通文档、证据整理和明确合同的工作使用Low/Medium；复杂代码与门禁审阅使用High；XHigh只对应已定位的证明、并发、数学等价或证据冲突。TASK-031起步为gpt-6-astra / Medium，门禁合同和最终审阅为High，未解疑难才考虑XHigh。TASK-033清单整理用Terra / Medium，逐函数审计用Astra / High。TASK-015同类补录用Terra / Medium，若使用Astra则Low起步。

具体映射见[task-models.json](task-models.json)，当前权威入口为[task-queue](../../../meta/task-queue.md)。旧值和四份meta原始字节保存在raw/before-*.bin；[changes.json](changes.json)列出精确替换。task-blocker-register清除当前推荐中的强制全程XHigh，task-handoff-protocol要求后续每项任务附起步档位与升档条件，compile-log只记本次一条里程碑。

历史合同和回执中的实际用模/旧推荐保持原文；当前模型列优先，不追改历史。任务状态、排序、依赖、停止条件、数值阈值、原件、软件源码、人工确认与独立审查要求保持。模型建议不会自动改变Codex应用当前设置。未写Git、运行GPU/SSH/Slurm或推送。

这些任务档位是按本项目复杂度作出的工程建议，不是官方能力保证或固定节省比例。已核的[官方模型目录](https://developers.openai.com/api/docs/models)区分Astra与兼顾成本的Terra；[官方用量说明](https://learn.chatgpt.com/docs/pricing)说明模型、上下文、推理、工具调用和缓存共同影响用量。没有重新估算用户套餐额度。

检查只覆盖本次改动：49行均有建议、原任务状态/依赖/目标/顺序不变、全部旧合同字节保留、四meta的精确逆变换成立、Git HEAD/index及业务refs不变，并运行知识库lint。内部refs/codex/turn-diffs引用在检查期间从capture进入checkpoint，最初的全refs相等检查因此失败；[差异记录](raw/ref-observation.json)记录观察，不删除内部引用，也不要求其停止更新。其余refs仍与领取时比较。结果见[verification.json](raw/verification.json)和[knowledge-lint.log](raw/knowledge-lint.log)。未新增来源、研究主张、开放问题或导航，相关Wiki与原回执不修改。

人工复验：从仓库根目录运行，预期退出0且Knowledge lint: PASS；失败保存全部stdout/stderr和退出码。这仅验证文档，不代替科研门禁。

```powershell
pwsh -NoProfile -File CUDA_coding/scripts/check_knowledge.ps1 -ProjectRoot CUDA_coding
```

唯一下一软件任务仍是TASK-031，依赖原剩余门表与不变候选指纹，先准备有界debug合同/本地交付；起步gpt-6-astra / Medium、合同及验收审查High，本轮未执行。已登记KB-GOV待办仍为0。
