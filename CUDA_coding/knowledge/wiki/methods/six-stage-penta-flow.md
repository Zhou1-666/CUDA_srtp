---
id: KB-METHOD-001
type: method
status: reviewed
confidence: high
source_ids: [SRC-003, SRC-004]
compiled_at: 2026-08-17
updated: 2026-08-17
---

# 五对角分布式六阶段执行合同

## 总体路径

`nprocs==1` 时每线程直接解一条五对角系统。多 rank 时执行本地消元、两次 Alltoallv、缩约求解和回带。

| 阶段 | 函数 | 主要输入 | 主要输出 | 计算/通信 | 当前计时字段 |
| --- | --- | --- | --- | --- | --- |
| S1 | `tdma_modified_penta` | `A..E,RHS` | 原位重建系数 + `rd(Nsys,28)` | GPU | `local_compute` |
| S2 | `pascalpack` | `rd`、gather 描述符 | `BIGbuf_A` | GPU pack | `pack_forward` |
| FWD MPI | `pascal_a2av` | `BIGbuf_A` | `BIGbuf_B` | MPI/host staging | `mpi_forward` |
| S3 | `pascalunpack_penta` | 28 槽数据 | `Atr(tmp_N,32P)` | GPU unpack/assemble | `unpack_forward` |
| S4 | `tdma_banded_cuda` | 带状(3,3)缩约系统 | `Dtr(tmp_N,4P)` | GPU | `reduced_compute` |
| S5a | `pascalpack` | `Dtr` | `BIGbuf_B` 的 4 列块 | GPU pack | `pack_backward` |
| BWD MPI | `pascal_a2av` | `BIGbuf_B` | `BIGbuf_A` | MPI/host staging | `mpi_backward` |
| S5b | `pascalunpack` | 4 槽接口解 | `Drd(Nsys,4)` | GPU unpack | `unpack_backward` |
| S6 | `pascal_update_penta` | 原位系数 + `Drd` | 完整解写回 `RHS` | GPU | `update_compute` |

## S1 数学合同

每个子域保留两端各两个接口点：`{x0,x1,xN-2,xN-1}`。内点最终表示为：

```text
x_j = T + P*x0 + Q*x1 + R*xN-2 + S*xN-1
```

四条边界方程归一化后写入 28 槽 `rd`。多 rank 路径注释要求 `Nrow>=5`，当前 API 未强制检查。

## S3/S4 缩约合同

- 每 rank、每条线贡献 4 个接口未知量；
- 全局缩约未知量数 `4P`；
- 每方程使用 `[L3,L2,L1,D,U1,U2,U3,RHS]` 8 槽；
- `D=1` 不在当前 28 槽通信中传输，由 unpack 填回；
- `tdma_banded_cuda` 在 `Atr` 上原位带状消元并把接口解写入 `Dtr`。

## S6 回带合同

接口点从 `Drd` 直接写入 `RHS`；内点使用 S1 写回的 `A/B/D/E/RHS` 重建。因此 S1 和 S6 的原位数据约定必须一起审查，不能只修改其中一端。

## 正确性不变量

- 28 槽 pack/unpack 后的四条方程与本地边界方程一致；
- 对角槽恢复为 1；
- 缩约带宽保持 `(3,3)`；
- 第二次通信每线回传恰好 4 个接口解；
- 最终 `RHS` 满足原始五对角系统；
- 28/22 两路径必须在相同输入上等价。

## 当前阻断缺陷

`pascal_a2av` 使用阻塞式 `MPI_ALLTOALLV` 后仍等待从未初始化的 request arrays。这是发布基线前的 P0，修复任务不得同时改变上述阶段合同。

## 相关

- [[penta-data-layout]]
- [[28-to-22-slot-map]]
- [[../systems/data-ownership-and-lifetime]]
- [[../testing/test-matrix]]

