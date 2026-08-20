---
id: KB-METHOD-002
type: method
status: draft
confidence: high
source_ids: [SRC-003, SRC-004]
compiled_at: 2026-08-17
updated: 2026-08-20
---

# 五对角数据布局

## 调用方矩阵

`A/B/C/D/E/RHS(0:Nsys-1,0:Nrow-1)` 为 device arrays。第一维是独立线系统，第二维是线内行。Fortran column-major 意味着同一 `j` 下连续 `i` 访问相邻，当前一线程一条线的逐 `j` 扫描需要结合实际生成访存指令分析，不能仅凭维度断言完全合并。

## plan 核心数组

| 数组 | 形状 | 内容 | 生命周期 |
| --- | --- | --- | --- |
| `rd` | `Nsys × 28` | 4 条边界方程，每条 7 个传输槽 | plan |
| `Atr` | `tmp_N × (32P)` | 每 rank 4 方程×8 槽的完整缩约系统 | plan |
| `Dtr` | `tmp_N × (4P)` | 缩约接口解 | plan |
| `Drd` | `Nsys × 4` | 原 rank 每线四个接口解 | plan |
| `BIGbuf_A/B` | 1D | forward 按 28/22 槽分配，backward 复用的 device 通信缓冲 | plan |

`tmp_N` 是当前 rank 负责的线数量，`tmp_Nmax` 是所有 rank 最大线数量；它们来自对 `0..Nsys-1` 的块划分，而 `Nrow` 是 z/线方向在各 rank 的局部长度。

## 当前可切换布局

每条边界方程传输：

```text
[L3, L2, L1, U1, U2, U3, RHS]
```

四方程顺序：

```text
e0 = x0
e1 = x1
e2 = xN-2
e3 = xN-1
```

在 `rd(line,0:27)` 中，方程 `e` 的 base 为 `7e`。完整缩约格式在 `Atr` 中是：

```text
[L3, L2, L1, D, U1, U2, U3, RHS]
```

其中 `D` 由 unpack 核填为 1。plan 默认 `forward_slots=28`；传入 `PASCAL_PENTA_FORWARD_SLOTS_22` 时，S1 仍生成上述 `rd(0:27)`，pack 只发送索引 `1..6,8..11,13,15..18,20,21..25,27`，unpack 同时恢复单位对角和索引 `0,7,12,14,19,26` 对应的六个结构零。

## 描述符

- forward gather：规范输入子块仍为 `rank_line_count × 28`，实际通信块为 `rank_line_count × forward_slots`，目标完整块为 `tmp_N × 32`；
- forward send/recv counts 以 double 元素计；
- backward gather：从每个来源块取 `tmp_N × 4`，回到原 rank 的 `rank_line_count × 4`；
- displacement 是扁平缓冲元素偏移，不是字节偏移。

## 高风险布局耦合

以下内容必须保持一致：

- `Nrd_global/local` 与 `rd` 固定为规范 28 槽；
- gather local/start host/device arrays；
- forward `bufsubsize/start`；
- `plan%forward_slots`、forward buffer count/displacement；
- 28/22 两个 forward pack/unpack kernel 的映射和 grid y 维；
- forward unpack 的源槽解释；
- benchmark CSV 的 `forward_slots` 元数据和独立验证中的通信量统计。

## 相关

- [[six-stage-penta-flow]]
- [[28-to-22-slot-map]]
- [[../systems/data-ownership-and-lifetime]]
