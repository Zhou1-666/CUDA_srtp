# KB-SKILL-002：稀缺远端资源提交前的真实产物预检

## A. TASK-031 actual-only-v2 登录节点真实产物审计

运行位置：既有集群 SSH 登录节点。整段一次粘贴；只读取冻结的实际检查器，不申请 allocation，不运行 solver，也不修改远端文件。

```bash
if bash -s <<'TASK031_REAL_ARTIFACT_PREFLIGHT'
actual=/home/bingxing2/apps/nvhpc/24.5/Linux_aarch64/24.5/cuda/12.4/compute-sanitizer/compute-sanitizer
expected_bytes=6835536
expected_sha=1b252927574cfcac930e9d1503d951e1ec56f6baa5c6164cedb098bb7f970e6d
expected_product='NVIDIA (R) Compute Sanitizer'
expected_version='Version 2024.1.1.0 (build 34043715)'

if [ ! -f "$actual" ] || [ -L "$actual" ]; then
    printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_REFUSE reason=identity_path rc=2\n'
    exit 2
fi

actual_bytes=$(stat -Lc '%s' -- "$actual" 2>&1)
stat_rc=$?
printf 'ACTUAL_BYTES=%s EXPECTED_BYTES=%s STAT_RC=%s\n' "$actual_bytes" "$expected_bytes" "$stat_rc"
if [ "$stat_rc" -ne 0 ] || [ "$actual_bytes" != "$expected_bytes" ]; then
    printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_REFUSE reason=bytes rc=2\n'
    exit 2
fi

actual_sha=$(sha256sum -- "$actual" 2>&1)
sha_rc=$?
printf 'ACTUAL_SHA256=%s SHA_RC=%s\n' "$actual_sha" "$sha_rc"
if [ "$sha_rc" -ne 0 ] || [ "${actual_sha%% *}" != "$expected_sha" ]; then
    printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_REFUSE reason=sha256 rc=2\n'
    exit 2
fi

probe1_output=$("$actual" --version 2>&1)
probe1_rc=$?
printf '%s\n%s\n%s\n' 'PROBE_1_ENVIRONMENT_BEGIN' "$probe1_output" 'PROBE_1_ENVIRONMENT_END'
if [ "$probe1_rc" -ne 0 ] || ! grep -Fq -- "$expected_product" <<<"$probe1_output" || ! grep -Fq -- "$expected_version" <<<"$probe1_output"; then
    printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_REFUSE reason=environment_version_probe probe_rc=%s rc=3\n' "$probe1_rc"
    exit 3
fi

probe2_output=$(bash -c '"$2" --version' bash LOGIN_NODE_NO_GPU "$actual" 2>&1)
probe2_rc=$?
printf '%s\n%s\n%s\n' 'PROBE_2_RANK_PAYLOAD_BEGIN' "$probe2_output" 'PROBE_2_RANK_PAYLOAD_END'
if [ "$probe2_rc" -ne 0 ] || ! grep -Fq -- "$expected_product" <<<"$probe2_output" || ! grep -Fq -- "$expected_version" <<<"$probe2_output"; then
    printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_REFUSE reason=rank_payload_version_probe probe_rc=%s rc=4\n' "$probe2_rc"
    exit 4
fi

printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_PASS probes=2 rc=0\n'
exit 0
TASK031_REAL_ARTIFACT_PREFLIGHT
then
    task031_v2_preflight_rc=0
else
    task031_v2_preflight_rc=$?
fi
printf 'TASK031_V2_REAL_ARTIFACT_PREFLIGHT_COMMAND_RC=%s\n' "$task031_v2_preflight_rc"
```

预期：bytes 与 SHA-256 精确匹配；两段探测均完整打印 `Version 2024.1.1.0 (build 34043715)`，各自 rc 为 0；末端依次出现 `TASK031_V2_REAL_ARTIFACT_PREFLIGHT_PASS probes=2 rc=0` 和 `TASK031_V2_REAL_ARTIFACT_PREFLIGHT_COMMAND_RC=0`。

第二段只复现 v2 rank payload 中 `"$2" --version` 的真实参数语义，不启动 MPI。`--version` 不需要 GPU，因此登录节点即可完成，allocation 成本为零。任一 `REFUSE`、非零 rc、回显截断或结果不确定都意味着 v2 的这道门未关闭；对尚未提交的候选只能做有界参数修正，不得提交。本仓库实时状态已显示 v2 被接受为 job1475231，所以本轮运行只能形成事后登录节点审计，不能追认成 job1475231 的提交前 PASS，也不授权重投。

## B. Skill 交付

- 源码：[`skills/cluster-submit-preflight/SKILL.md`](../../../../../skills/cluster-submit-preflight/SKILL.md)
- 文件身份：8147 bytes；SHA-256 `c5f83cdcde0764348c90e57aeb740d40645a5fc64946c63228d0df3a6a24c447`。
- frontmatter 只含 `name`、`description`；正文提供定位与范围、按需路由、A/B 命令分类、fixture 保真声明、真实产物身份门、失败即止、反过度声明、常见误判和人工复验命令。

### 实测依据

| 事件 | 成本/终态 | 可复用教训 |
| --- | --- | --- |
| job1473417 | 29m08s，FAILED 4:0；四项 sanitizer rc124 / `No attachable process found` | 有效失败证据，但不能把 attach 失败写成 solver 内存错误 |
| job1474105 | 9s，FAILED 2:0；`STOP_MISSING_COMPUTE_NODE_DEPENDENCY` | 裸 `ldd` 脱离实际 loader 上下文，误判同目录已存在的 `libInterceptorInjectionTarget.so`；零信息 |
| job1474942 | 2m17s，FAILED 5:0 | A_entry 有效复现 `KNOWN_ATTACH_TIMEOUT`，但残留进程判据挡住 B_actual；串行 A→B 使 B 为 NOT-RUN |
| job1475062 | 6s，FAILED 127:0 / 内部 rc255 | fake actual 接受 `-vv --version`，真实工具把 `-v` 与 `--version` 判为重复；`set -e` 早退，零信息 |
| 提交前拒绝 | `SHA256SUMS.txt` 被误写为 `SHA256SUMS`，`COMMAND_RC=2` | 文件名语义必须对真实 payload 验证，不能由 fixture 或记忆代替 |

上述事实共同支持“fixture 或假设替代真实产物”是重复出现的流程缺陷，但不把某一集群路径、版本或任务状态写成通用不变量；动态事实仍由 task queue、阻塞台账和任务回执提供。

### RED/GREEN 行为压力测试

三名隔离评估者只做文本决策，不调用集群、不修改文件。

| 场景 | 无 skill 的 RED 基线 | 读取 skill 后的 GREEN |
| --- | --- | --- |
| fake actual 接受真实工具可能拒绝的 CLI | 建议失败后依次改参数再试，违反“一次失败即止” | 先做路径/bytes/SHA 身份门，只原样执行一次；失败后不换参数、不重试、不提交 |
| 混合 `sha256sum`、`ldd`、MPI、GPU、solver、sanitizer | 大体识别目标环境限制，但把部分未执行项写成“静态预检” | 逐命令拆成 A/B；A 必须真实执行才称通过，B 只能 `NOT-RUN/UNKNOWN` |
| SHA 不符且第二段输出截断 | 基线已选择拒绝，作为控制场景 | 保持拒绝，并进一步识别“SHA 早停后仍出现第二探测输出”为执行链不一致；精确限定 marker、rc 与 B 类未运行项 |

这组压力测试只证明 skill 改善了模拟决策，不是远端工具、GPU、L6、数值或性能证据。

### 已执行验证

- TASK-031 登录命令代码块用 Git Bash 5.3.9 执行 `bash -n`：rc0。未在本机伪造目标路径或冒充真实 CUDA 12.4 检查器执行结果。
- 官方 `quick_validate.py`：本机默认 `python` 不在 PATH，工作区 Python 初始缺 PyYAML；把 PyYAML 6.0.3 临时安装到系统临时目录后，以 UTF-8 模式运行最终 skill，输出 `Skill is valid!`，rc0。依赖准备失败与 skill 格式失败已分开处理；校验结束后已核对并删除该临时依赖目录，未写入仓库或系统 Python。
- 仓库知识 lint：`Markdown=307, Wiki=36, Sources=31, Warnings=0, Errors=0`，`Knowledge lint: PASS`，rc0。为兼容现有 wikilink 检查器，登录命令的 Bash 文件条件由双中括号等价改为单中括号；未改 lint Gate。
- 最终 skill 身份复算：8147 bytes；SHA-256 `c5f83cdcde0764348c90e57aeb740d40645a5fc64946c63228d0df3a6a24c447`。

## 状态与边界

本交付只关闭 KB-SKILL-002 的仓库 skill 文档和本地验证。未修改 solver、算法、公开 API、28/22 布局、数值阈值、v1–v5 包或冻结脚本；未 SSH、提交/取消 Slurm、申请 GPU、运行 MPI/solver、清理远端证据、生成 v6、Git 提交/推送或公开发布。

TASK-031 继续为 `in-progress`，集群 L6 继续为 FAIL。job1475231 已经被 Slurm 接受这一事实不因本次登录命令或 lint 改写；实时唯一下一动作继续以任务队列为准。

## 首次真实使用回执

2026-09-04 用户在集群登录节点对冻结实际检查器执行本页命令两次；两次均得到精确 bytes/SHA、两处真实 `--version` 输出、PASS marker 和外层 rc0，且没有实际 REFUSE 输出。判读与证据见 [TASK-031 登录节点预检分析](../TASK-031-20260902-v5-bounded-ucc-launch-repair/local/20260904-actual-only-v2-real-artifact-preflight-analysis.md)。这次真实使用证明该 skill 能把 fixture 未覆盖的 CLI 门落到真实产物，但不证明 MPI/GPU/L6，也不把同环境重复执行算作两个独立验证环境。
