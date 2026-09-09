# 审查与实施决定

2026-09-09 独立初审确认717路径分组、八项文档候选和SOP边界；内存目标投影无缺口，但不代替真正知识lint。

发现：013的属性候选保留7个CRLF，而继承的 `/.gitattributes text eol=lf` 会使过滤后blob与原字节不同。原候选的Git过滤值为 `2e413ca085d73631907d28bc08c6bcd4f0ab4be2`，无过滤值为 `490248961cf7ff7784ba2b6344ac7cca93a6afc6`。

决定：保留013原件，在014候选末尾追加注释及 `/.gitattributes -text`。只改变该属性文件自身的转换规则，原前缀和其余路径规则保留；不renormalize或触碰源码。暂存和独立clone必须实核该修正后的字节，不能以工作区SHA代替Git blob。

其余八项文档候选照013审定字节应用。三份meta只改014治理记录和关闭时一条里程碑；科研正文、日期、否定结果和软件排程原位保留。

实施复审：独立审查者实跑最新16项测试全部通过；属性验证必须接受原013候选加精确末尾覆盖，删除该覆盖并重写清单的反例被拒绝。未发现实际候选越界，可进入B候选和独立clone验收。红绿过程保留于local/verifier-tests-red.log和local/verifier-tests-green.log。

验证边界：717静态路径、187份013回执和初始输入由封存哈希约束；014后续回执文件表由待验提交声明。因此交付必须使用已审查的固定40位提交SHA，不宣称验证器能独立拒绝“014自身回执与清单同时改写”的另一个新提交。独立clone、旧固定回放和最终工作区保护另行实测，代码审查不能代替这些门禁。

B验收复审：clone-b-first-checks.json三项和clone-b-replays.json七项均为真实运行、退出0，真正知识lint为169 Markdown / 36 Wiki / 35来源 / 0警告 / 0错误；717+187+46检出字节、无alternates/硬链接、G1独立位置及G2/G3固定SHA符合合同。inspect-clone.cjs须配合固定提交验证器使用，不能单独证明manifest来源。

第二次并发发现保留于local/protection-after-b.json（FAIL）：新增teacher-sprint-T2工具与T1无冲突。独立只读检查t2.cjs、test-t2.cjs、submit.sh、rank.sh、batch.sh支持其独立任务归属；未执行这些脚本。接受精确`CUDA_coding/knowledge/outputs/validation/20260909-teacher-sprint-T2/`目录内新文件的当时路径/SHA采样并排除014，不能宣称T2内容冻结或把其GPU/Slurm进展算014验收。16,695旧文件与T1两新增件保持原严格指纹比较，其他新增目录仍停止。全球Git ignore不可读的观察边界保留。

最终关闭候选复审无阻断：三份meta逆变换精确恢复封存原字节；相对B只含三meta及014回执，T1/T2零纳入。自身55文件与清单一致，无缺失/重复/未列文件；四份自身Markdown链接可定位。T2例外仅作用于original集合外的新文件，未豁免任何原保护路径。014关闭语义与B实测一致，015仅ready。最终暂存逐blob及clone快进后的固定SHA/16测/lint仍须执行，结果保留在交付会话，避免循环补交日志。
