#!/usr/bin/env python3
"""
plot_performance.py - 五对角求解器性能对比可视化 (论文/报告风格)

用法:
    python3 plot_performance.py <penta_perf.csv> [输出目录]

读取 run_sweep.sh 生成的 CSV (exp/ref/serial 行), 输出:
    fig1_total_bars.png       总耗时分组柱状图 (exp vs ref, 各配置)
    fig2_strong_scaling.png   强扩展: 耗时 vs rank 数 (log-log, 含理想线)
    fig3_weak_scaling.png     弱扩展: 耗时 vs rank 数 (nrow 恒定 / nsys 增长)
    fig4_comm_breakdown.png   exp 阶段分解堆叠柱状图 (计算/通信/打包)
    fig5_speedup_ratio.png    对照组/实验组耗时比 (加速倍数)

统计口径: 每次迭代各 rank 的最大墙钟时间 (total_s_max), 多次迭代取中位数。
"""
import sys
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# --- 经校验的分类色板 (light 模式) 与排版 ---
SERIES = {"exp": "#2a78d6", "ref": "#eb6834", "serial": "#1baf7a"}  # blue/orange/aqua
INK = "#0b0b0b"
MUTED = "#898781"
GRID = "#e1e0d9"
SURFACE = "#fcfcfb"

plt.rcParams.update({
    "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE,
    "axes.edgecolor": MUTED,
    "axes.labelcolor": INK,
    "text.color": INK,
    "xtick.color": INK,
    "ytick.color": INK,
    "font.family": "system-ui, -apple-system, Segoe UI, sans-serif",
    "font.size": 10,
    "axes.titlesize": 11,
    "axes.grid": True,
    "grid.color": GRID,
    "grid.linewidth": 0.6,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "legend.frameon": False,
})


def load(path):
    df = pd.read_csv(path)
    df["config"] = df["n1"].astype(str) + "x" + df["n2"].astype(str) + "x" + df["n3"].astype(str)
    df["nranks"] = df["nranks"].astype(int)
    return df


def median_total(df):
    """按 (implementation, config, nranks) 取 total_s_max 中位数。"""
    cols = ["implementation", "config", "nranks", "total_s_max"]
    return df[cols].groupby(["implementation", "config", "nranks"]).median().reset_index()


def save(fig, path, name):
    out = os.path.join(path, name)
    fig.savefig(out, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print("wrote", out)


def fig1_total_bars(df, outdir):
    d = median_total(df)
    cfgs = sorted(d["config"].unique(), key=lambda c: (len(c), c))
    np_set = sorted(d["nranks"].unique())
    labels = [f"{c} / {n}r" for c in cfgs for n in np_set]
    imp = ["exp", "ref", "serial"]
    x = np.arange(len(labels))
    w = 0.27
    fig, ax = plt.subplots(figsize=(max(8, 1.2 * len(labels)), 5))
    for k, impl in enumerate(imp):
        vals = []
        for c in cfgs:
            for n in np_set:
                row = d[(d.config == c) & (d.nranks == n) & (d.implementation == impl)]
                vals.append(row.total_s_max.iloc[0] if len(row) else np.nan)
        ax.bar(x + (k - 1) * w, vals, w, label=impl, color=SERIES[impl],
               edgecolor=SURFACE, linewidth=0.5)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_ylabel("中位墙钟时间 (s)")
    ax.set_yscale("log")
    ax.set_title("总耗时: 实验组 vs 对照组 vs 串行基线")
    ax.legend(loc="upper left")
    save(fig, outdir, "fig1_total_bars.png")


def fig2_strong_scaling(df, outdir):
    d = median_total(df)
    sizes = ["128x128x2048", "128x128x4096", "256x128x2048"]
    fig, axes = plt.subplots(1, len(sizes), figsize=(4.2 * len(sizes), 4.2), sharey=True)
    if len(sizes) == 1:
        axes = [axes]
    for ax, size in zip(axes, sizes):
        sub = d[d.config == size]
        if sub.empty:
            ax.set_visible(False)
            continue
        for impl in ["exp", "ref", "serial"]:
            s = sub[sub.implementation == impl].sort_values("nranks")
            if s.empty:
                continue
            # ref 在 np=1 时即串行基线, 用 serial 的 np=1 补点
            if impl == "ref":
                ser = sub[sub.implementation == "serial"].sort_values("nranks")
                if len(ser) and ser.nranks.iloc[0] == 1:
                    s = pd.concat([ser.iloc[[0]].assign(implementation="ref"), s])
            ax.plot(s.nranks, s.total_s_max, marker="o", ms=6, lw=2, label=impl, color=SERIES[impl])
            if len(s) and impl == "exp":
                t1 = s.total_s_max.iloc[0]
                np_ = s.nranks
                ax.plot(np_, t1 / np_, ls="--", lw=1.2, color=MUTED, label="理想 (exp)")
        ax.set_xscale("log", base=2)
        ax.set_yscale("log")
        ax.set_xticks(sorted(sub.nranks.unique()))
        ax.set_title(f"强扩展 {size}")
        ax.set_xlabel("rank 数")
        ax.grid(True, which="both")
    axes[0].set_ylabel("中位墙钟时间 (s)")
    fig.suptitle("强扩展: 固定全局问题, 耗时 vs rank 数")
    axes[0].legend(loc="upper right", fontsize=8)
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    save(fig, outdir, "fig2_strong_scaling.png")


def fig3_weak_scaling(df, outdir):
    d = median_total(df)
    fig, axes = plt.subplots(1, 2, figsize=(9, 4.2))
    # 弱扩展 A: nrow 恒定, n3 = 1024*np
    a = d[d.apply(lambda r: r["n1"] == 128 and r["n2"] == 128 and r["n3"] == 1024 * r["nranks"], axis=1)]
    # 弱扩展 B: 每 rank 工作量恒定, n2 = 128*np, n3 固定
    b = d[d.apply(lambda r: r["n1"] == 128 and r["n2"] == 128 * r["nranks"] and r["n3"] == 2048, axis=1)]
    for ax, sub, title in ((axes[0], a, "弱扩展 A: nrow 恒定 (=1024)"),
                           (axes[1], b, "弱扩展 B: 每 rank 工作量恒定")):
        if sub.empty:
            ax.set_visible(False)
            continue
        for impl in ["exp", "ref", "serial"]:
            s = sub[sub.implementation == impl].sort_values("nranks")
            if s.empty:
                continue
            ax.plot(s.nranks, s.total_s_max, marker="o", ms=6, lw=2, label=impl, color=SERIES[impl])
        ax.set_xscale("log", base=2)
        ax.set_xticks(sorted(sub.nranks.unique()))
        ax.set_title(title)
        ax.set_xlabel("rank 数")
        ax.grid(True, which="both")
    axes[0].set_ylabel("中位墙钟时间 (s)")
    fig.suptitle("弱扩展: 耗时随 rank 数 (理想为水平线)")
    axes[0].legend(loc="upper left", fontsize=8)
    fig.tight_layout(rect=[0, 0, 1, 0.94])
    save(fig, outdir, "fig3_weak_scaling.png")


def fig4_comm_breakdown(df, outdir):
    d = median_total(df)
    exp = d[d.implementation == "exp"]
    if exp.empty:
        return
    size = sorted(exp.config.unique())[0]
    sub = exp[exp.config == size].sort_values("nranks")
    if sub.empty:
        return
    parts = ["compute_s_max", "communication_s_max", "packing_s_max"]
    colors = ["#2a78d6", "#eb6834", "#1baf7a"]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    bottom = np.zeros(len(sub))
    for part, color in zip(parts, colors):
        ax.bar(sub.nranks.astype(str), sub[part], bottom=bottom, label=part, color=color,
               edgecolor=SURFACE, linewidth=0.6, width=0.62)
        bottom += sub[part].values
    ax.set_xlabel("rank 数")
    ax.set_ylabel("中位墙钟时间 (s)")
    ax.set_title(f"实验组阶段分解 {size} (计算/通信/打包)")
    ax.legend(loc="upper right")
    save(fig, outdir, "fig4_comm_breakdown.png")


def fig5_speedup_ratio(df, outdir):
    d = median_total(df)
    cfgs = sorted(d.config.unique(), key=lambda c: (len(c), c))
    rows = []
    for c in cfgs:
        for n in sorted(d[d.config == c].nranks.unique()):
            e = d[(d.config == c) & (d.nranks == n) & (d.implementation == "exp")].total_s_max
            r = d[(d.config == c) & (d.nranks == n) & (d.implementation == "ref")].total_s_max
            if len(e) and len(r):
                rows.append((c, n, r.iloc[0] / e.iloc[0]))
    if not rows:
        return
    rdf = pd.DataFrame(rows, columns=["config", "nranks", "ratio"])
    labels = [f"{c} / {n}r" for c, n in zip(rdf.config, rdf.nranks)]
    fig, ax = plt.subplots(figsize=(max(8, 1.2 * len(labels)), 5))
    ax.bar(labels, rdf.ratio, color=SERIES["exp"], edgecolor=SERIES["ref"], linewidth=1.0, width=0.6)
    ax.axhline(1.0, color=MUTED, lw=1.2, ls="--")
    ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_ylabel("ref 耗时 / exp 耗时")
    ax.set_title("对照组相对实验组的耗时比 (>1 表示实验组更快)")
    save(fig, outdir, "fig5_speedup_ratio.png")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    csv_path = sys.argv[1]
    outdir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(csv_path))
    os.makedirs(outdir, exist_ok=True)
    df = load(csv_path)
    fig1_total_bars(df, outdir)
    fig2_strong_scaling(df, outdir)
    fig3_weak_scaling(df, outdir)
    fig4_comm_breakdown(df, outdir)
    fig5_speedup_ratio(df, outdir)


if __name__ == "__main__":
    main()
