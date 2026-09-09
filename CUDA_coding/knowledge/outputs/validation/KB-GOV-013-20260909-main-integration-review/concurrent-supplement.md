# 关闭前并行G1提交的审定附录

关闭工具首次检查时发现HEAD从领取时`91ecc661e0cd856c61bdc5b69f5aa065faadf078`变为`5c9724a79146e7a6d4e9819b63a5baa6f7f7fd7b`，在写关闭快照或活文档之前停止。原inputs.json、27组领取快照均保留，未修改原期待SHA。初次保护失败不等于旧证据损坏。

只读复核及独立审查确认：新提交唯一父提交是原HEAD，差集恰为固定G1的220份证据＋.gitattributes，共221个路径，全部mode/blob与G1相同。源码及3份滚动meta的提交树、活文档均无变化。当前暂存为空，只有main ref和主工作树HEAD推进。

属性活文件由原653字节＋G1的706字节精确追加组成，共1359字节，SHA为`82bccf5ad816c98a712b9c66f5c4561250ec80fb001b0ff087c5c7abd715491a`。其余1014个原保护对象及15历史入口保持。事实数据见[concurrent-g1-review.json](concurrent-g1-review.json)、新树清单与raw/concurrent记录。提交身份元数据不能确定实际操作者或授权来源；**该提交不是013创建的成果**。

接纳该已审查的G1限定推进作为剩余方案与关闭前保护的新基底，不执行任何回滚。目标白名单仍717路径，其中220已经版本化，待集成的静态差集为497路径；A组可跳过已完成220项。014仍需重新捕获领取状态。

旧9项proposal元数据及旧属性候选保存在raw/concurrent/proposals-before.json和attributes-proposal-before.txt。仅重建未应用的属性候选：以当前1359字节作前缀，追加尚缺的G2/G3/013/014精确保护，不重复G1规则。新proposals.json显式注明baselineSnapshot，原inputs不动。其他8项候选字节保持。

关闭前重新核HEAD/index/refs/worktrees及全部保护文件；三份meta保持原领取字节，写入前整组和逐份重核，漂移即停止。本轮只追加治理交接，不将并行版本变化伪报成全程Git未变。
