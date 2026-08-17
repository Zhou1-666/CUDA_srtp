# 变更影响地图

| 改动对象 | 同步检查/更新 |
| --- | --- |
| `ptdma_plan_cuda` 字段 | create/clean、普通/profiled solver、example、benchmark、API 页 |
| forward 槽数 28→22 | S1/pack/unpack、描述符、buffers、JS、CSV 元数据、论文主张 |
| backward 4 槽 | Dtr/Drd、第二次通信、update、接口解测试 |
| `pascal_a2av` | 三/五对角模块、host/CUDA-aware、MPI 回归、计时解释 |
| S1 递推 | S6 回带、最小 Nrow、随机真值、一般 m 理论 |
| CUDA block/thread | create 参数检查、kernel coverage、benchmark flags |
| benchmark CSV | plot scripts、REPORT、实验卡、论文图 |
| MPI/GPU 绑定 | 示例、Slurm、环境元数据、扩展性结论 |
| 正确性阈值 | test matrix、实验卡、论文主张；必须人工批准 |
| 论文公式 | theory source、独立脚本、代码映射、claim matrix |

本页用于 GPT 修改前的影响扫描。若一个任务同时跨越三行以上，优先拆分；确实不可拆时升级推理强度并增加独立审查。

