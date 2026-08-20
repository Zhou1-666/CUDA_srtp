---
id: KB-PERF-006
type: method
status: draft
confidence: high
source_ids: [SRC-003P]
updated: 2026-08-19
---

# 五对角 28/22 槽显存容量模型

## 适用范围

模型描述 `perf_bench/benchmark_penta.f90` 的当前 FP64 五对角 benchmark：每个 rank 持有全部 `Nsys=n1*n2` 条线的本地 z 切片 `Nrow_r`，而 `ptdma_plan_cuda` 再按 rank 切分这些线为 `tmp_N_r`。它不是完整 CFD 的显存模型。

`node verify/penta_capacity_model.js` 是唯一可执行模型。不要按旧注释“8 个数组”估算，实际设备二维等价数组为 10 个：`A..R` 六个、`s1(:,:,1:2)` 两个、`s2(:,:,1:2)` 两个。

## 公式（每 rank）

令 `N=Nsys`、`R=Nrow_r`、`T=tmp_N_r`、`P=nranks`、槽宽 `S∈{28,22}`，每 FP64 元素 8 B：

| 区域 | FP64 元素数 | 备注 |
| --- | ---: | --- |
| benchmark 设备数组 | `10NR` | 当前实际 `allocate` |
| `rd` | `SN` | 22 槽仅为尚未实现的投影 |
| `Atr` | `32PT` | 22 槽后仍保持 32 槽缩约求解结构 |
| `Dtr` / `Drd` | `4PT` / `4N` | 不随 payload 宽度变化 |
| `BIGbuf_A` / `BIGbuf_B` | `SN` / `SPT` | 前向通信持久 device buffer |
| device 描述符 | `16P` 个默认整数 | 当前按 4 B 计 |

因此 device persistent bytes 为以上 FP64 项乘 8 B，再加 `64P` B device 描述符和 TASK-015 主元状态数组 `4N` B。host persistent 为 `B_h/R_h=2NR` 个 FP64、112P B host 描述符及镜像主元状态数组 `4N` B；host-staging 临时峰值为前向 `8S(N+PT)` 与回传 `8(SPT+4N)` 的较大者。该临时 host buffer 不计入 device persistent，但必须计入主机内存预算。

在 `N` 能被 `P` 整除的平衡分区中，28 槽到 22 槽的 device 节省为 `18N×8=144N` B（另有最多 64 B 的 descriptor 差异）；它不是 21.4% 的总显存节省，因为大头通常是 `10NR` benchmark 数组。

## 使用与受控失败

针对 TASK-017 实测的 40 GiB A100，先用保守 30 GiB device budget 做预检：

```bash
node verify/penta_capacity_model.js --n1 256 --n2 256 --n3 1024 --ranks 1 --budget-mib 30720 --require-fit
node verify/penta_capacity_model.js --n1 512 --n2 512 --n3 2048 --ranks 1 --budget-mib 30720 --require-fit
```

前者应 `FIT`；后者应以退出码 2 报 `REJECT`，且**不会**调用 CUDA 或尝试真实 OOM。此预检只是研究运行守则，当前 Fortran API 尚未接受 GPU byte budget 参数，不能宣称它会在分配前自行拒绝所有 OOM。

TASK-018 完成前还须在真实 GPU 上完成前者的一次 `iterations=1` smoke，并保留环境与结果；22 槽实际实测必须等待 TASK-006。
