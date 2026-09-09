# 2026-09-09 导师冲刺 T1：冻结 v7 与 benchmark 干净构建

状态：**T1 done（用户终端回贴核验通过）**。只关闭今日 T1 的冻结源身份与 benchmark 干净构建；不是 GPU、性能或 TASK-031 正式冻结验收结果。

## 单一目标与授权

按 [今日权威输入](../../inbox/20260909-teacher-sprint-gpt-input.md) 的 T1，仅从冻结 v7 干净构建 `benchmark_penta`。当前任务已获用户确认，以独立 `TASK-031-20260907-private-freeze-target-v7` 为构建源；用户选择在现有 SSH 终端运行命令并回传日志。

最初活动源码 SHA 为 `9fe8a4df8978d7db49f48449096f8a8b55f11a22ad6a7567053ff67184f1f768`，并非 v7，且排除 CRLF 差异后仍不同；当时已按硬约束停止。此次明确指定独立 v7 只解除本次构建源选择问题，不修改原活动源码。

允许新增文件仅为本回执目录的命令及证据，以及目标环境的专用构建目录。solver、算法、数值阈值、28/22、冻结包原件和既有运行目录不作修改。T1 不执行 benchmark，不申请 GPU，不启动 MPI 作业。

## 冻结输入

- 本地 stage：`D:\CUDA\CUDA_repository_recovery\TASK-031-20260907-private-freeze-target-v7`
- 远端 stage：`/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-031/packages/TASK-031-20260907-private-freeze-target-v7`
- solver SHA-256：`4e12f11e586125975d19ce2214f33b342e50a776667f93ee2c96a84a9dfe79ee`
- manifest SHA-256：`129e9ad48080990389cfb2fa828da5545bf3ebdbf14e6ed72d913ffa08b68d24`
- manifest 包含 71 项 payload；本地全部逐项核对，匹配 71/71，旧构建产物 0。
- 历史构建入口来源：[20260907 v7 构建命令](../TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/local/20260907-v7-nvhpc-clean-build-command.txt)。本次缩减为一个 release benchmark 构建，不调用旧完整 runner，不重开 TASK-031 的完整构建/回归合同。

## 首次交接命令（已执行，不重跑）

用户已在现有集群 SSH Bash 终端执行 [T1-build-command.txt](T1-build-command.txt)，实际结果见下方回执。保留命令用于复现追溯，不在同一目录再次运行。

目标构建目录固定为：

```text
/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-031/teacher-sprint-20260909-t1-build-v1
```

该目录已存在即停止，不能删除后重跑。命令先核远端 manifest 与 solver 身份，再复制至新目录；原件和副本在构建前后分别核 manifest。

工具链沿用已验证的 `nvhpc/24.5/nvhpc-hpcx-cuda12/24.5`，要求 aarch64、nvfortran 24.5-1、MPI Fortran 后端为 nvfortran。完整构建参数为：

```text
make --no-print-directory -B -j1 -C <构建副本>/source/perf_bench benchmark_penta FC=mpifort OPT=-O3 CUDAFLAG='-cuda -gpu=cc80,cuda12.4'
```

此前先在同一副本执行 `veryclean`。预期输出：

```text
COMPILER_LINES=8 BAD_FLAG_LINES=0
T1_BENCHMARK_CLEAN_BUILD_PASS
GPU_RUN=0
STEP=complete
RC=0
COMMAND_RC=0
OUTER_SHELL_STILL_ALIVE
```

以上为首次交接时列出的预期输出；实际回贴的编译/链接全文与数值标记已经核对，结果及证据边界见下节。成功只证明此次干净构建，不证明求解正确性、性能或 T2–T4 通过。

失败时保存完整终端输出及整个 `BUILD_ROOT`，尤其 `exit-status.txt`、`module-*.log`、`environment.log`、`commands.txt`、`clean.log`、`build.log` 和已有 manifest 日志；不改源码、不更换 flags、不重试凑通过。若尚未创建 BUILD_ROOT，保存终端的停止标记即可。

## 2026-09-09 实际构建回执

证据为[用户终端回贴原文](raw/20260909-t1-build-user-transcript.txt)及[本地回贴核验](raw/20260909-t1-transcript-audit.json)。原文保留显示中的 Markdown 转义；核验只将 `\_`、`\*` 还原后解析，不重写原文、不补造缺失日志。原文保存文件 SHA-256 为 `0e8fc3ee8707ea36feddb5909a387094634e65473c625ac32f828ae93572f42c`。

| 核验项 | 实际结果 |
| --- | --- |
| 主机与时间 | `paraai-n32-h-01-ccs-master-1`，`2026-09-09T08:47:30Z` |
| 源身份 | v7 solver 与 manifest 完整 SHA 匹配，终端均有 `OK` |
| 工具链 | aarch64，GNU Make 4.3，NVHPC 24.5-1，MPI Fortran 后端 nvfortran |
| 构建 | 独立副本先 `veryclean`，再 `-B -j1`；7 次编译、1 次链接 |
| 参数 | 8/8 命令均为 `-O3 -cuda -gpu=cc80,cuda12.4`，`BAD_FLAG_LINES=0` |
| 退出状态 | `T1_BENCHMARK_CLEAN_BUILD_PASS`、`STEP=complete`、`RC=0`、`COMMAND_RC=0` |
| 本地回贴核验 | 19/19 项通过，无失败 |
| GPU / MPI 运行 | `GPU_RUN=0`；未进行性能或数值测量 |

可执行文件：

```text
/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-031/teacher-sprint-20260909-t1-build-v1/frozen-copy/source/perf_bench/benchmark_penta
SHA256=6dc2b7bc185b312b75c754a6c906678af4fb0ccc46f1045807b436f62d1f2733
```

证据边界：用户执行并回贴，助手未 SSH 或独立下载远端原件。四份 manifest 检查日志与 ELF 头未逐份回传；它们成功执行是由交付命令的遇错停止控制流和最终 PASS 推断的。回贴没有末尾 `OUTER_SHELL_STILL_ALIVE`，故不声称核验了该标记；它仅是外层终端存活提示，不是 T1 源身份、编译 flags 或干净构建要求，不据此重复构建。

T1 原“缺目标构建回执”已解除，依据是本次用户回贴与 19/19 本地核验。关闭类型为正常交付，关闭范围仅为今日 T1。单独日志原件尚未独立回收的边界继续保留，不将其写成已独立审计。

## 人工只读复验

在同一集群 SSH 终端可复制执行以下命令；它不重新构建或运行 benchmark：

```bash
(
  set -e
  t1_build_root='/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-031/teacher-sprint-20260909-t1-build-v1'
  sha256sum --strict -c "$t1_build_root/executable-sha256.txt"
  cat "$t1_build_root/flags-check.log" "$t1_build_root/exit-status.txt" "$t1_build_root/result.txt"
)
```

预期可执行文件 `OK`，参数为 `COMPILER_LINES=8 BAD_FLAG_LINES=0`，状态为 `STEP=complete` / `RC=0`，结果含 `T1_BENCHMARK_CLEAN_BUILD_PASS` / `GPU_RUN=0`。失败时保留终端输出与整个构建目录，不重建覆盖。

## 本地验证与未覆盖范围

本地验证记录保存在 [raw/local-identity-check.json](raw/local-identity-check.json) 和 [raw/local-command-check.json](raw/local-command-check.json)。本地 Bash 语法检查不能替代 NVHPC 编译。

本会话无已连接集群终端，Windows PATH 没有 `nvfortran/mpif90/make`；WSL 查询返回 `E_ACCESSDENIED`。实际集群编译由用户执行，不能称为助手直接执行。两份最初本地检查 JSON 保留当时 `NOT-RUN` 的历史状态，不回改成目标构建结果；新结果以本节及用户回贴核验为准。

已核对 TASK-031 阻塞条目，其缺口无变化；正式收尾仍按今日授权延后，既有六门结论不变。本次不新建编号候选，不重领 done 或解锁 blocked 任务；治理暂停，不改 queue、blocker 或 Wiki。本次 T1 缺口及其已解除快照仅记录在本回执。T2–T4 均未运行，没有新的加速或瓶颈结论。

唯一下一任务：**T2：单节点强扩展规模预注册与 host/device 运行配置**。依赖本次固定 v7 源、可执行文件 SHA 与 T1 构建回执；正式计时前确定 P1 40GB 显存可容纳的全局规模、预热/迭代/十组配对顺序和逐 rank 绑卡配置，P4 资源不足时按授权缩为 P1/P2。本轮未开始 T2。推荐继续 `gpt-6-astra / xhigh`。
