#!/usr/bin/env python3
"""
plot_accuracy.py - 五对角求解器精度对比可视化 (论文/报告风格)

用法:
    python3 plot_accuracy.py <penta_perf.csv> [输出目录]

读取 run_sweep.sh 生成的 CSV (exp/ref/serial 行), 输出:
    fig_a_rms.png     RMS 误差 (L2) vs 配置, exp vs ref (log y)
    fig_a_linf.png    ∞ 范数误差 vs 配置, exp vs ref (log y)
    fig_a_cross.png   实验组 vs 对照组逐点互差最大值 vs 配置
    fig_a_vs_rank.png 固定规模下误差 vs rank 数 (验证分布式不损失精度)

误差定义 (x≡1 精确解):
    err_rms  = sqrt( sum_{所有点}(x-1)^2 / N_total )
    err_linf = max |x-1|
    cross    = max |x_exp - x_ref|
"""
import sys
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

SERIES = {"exp": "#2a78d6", "ref": "#eb6834", "serial": "#1baf7a"}
INK = "#0b0b0b"
MUTED = "#898781"
GRID = "#e1e0d9"
SURFACE = "#fcfcfb"

plt.rcParams.update({
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE,
    "axes.edgecolor": MUTED, "axes.labelcolor": INK, "text.color": INK,
    "xtick.color": INK, "ytick.color": INK,
    "font.family": "system-ui, -apple-system, Segoe UI, sans-serif",
    "font.size": 10, "axes.titlesize": 11,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.6,
    "axes.spines.top": False, "axes.spines.right": False, "legend.frameon": False,
})


def load(path):
    df = pd.read_csv(path)
    df["config"] = df["n1"].astype(str) + "x" + df["n2"].astype(str) + "x" + df["n3"].astype(str)
    df["nranks"] = df["nranks"].astype(int)
    # 精度每配置恒定, 取 iter==0 行
    return df[df["iter"] == 0]


def save(fig, path, name):
    out = os.path.join(path, name)
    fig.savefig(out, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print("wrote", out)


def grouped_error_plot(df, metric, ylabel, title, outdir, name):
    cfgs = sorted(df.config.unique(), key=lambda c: (len(c), c))
    labels = []
    for c in cfgs:
        for n in sorted(df[df.config == c].nranks.unique()):
            labels.append(f"{c} / {n}r")
    x = np.arange(len(labels))
    fig, ax = plt.subplots(figsize=(max(8, 1.2 * len(labels)), 4.6))
    for k, impl in enumerate(["exp", "ref", "serial"]):
        vals = []
        for c in cfgs:
            for n in sorted(df[df.config == c].nranks.unique()):
                row = df[(df.config == c) & (df.nranks == n) & (df.implementation == impl)]
                vals.append(row[metric].iloc[0] if len(row) else np.nan)
        ax.bar(x + (k - 1) * 0.27, vals, 0.27, label=impl, color=SERIES[impl],
               edgecolor=SURFACE, linewidth=0.5)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_yscale("log")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend(loc="upper left")
    save(fig, outdir, name)


def error_vs_rank(df, outdir):
    sizes = sorted(df.config.unique(), key=lambda c: (len(c), c))[:1]
    fig, ax = plt.subplots(figsize=(6.5, 4.4))
    for size in sizes:
        sub = df[df.config == size]
        for impl in ["exp", "ref"]:
            s = sub[sub.implementation == impl].sort_values("nranks")
            if not s.empty:
                ax.plot(s.nranks, s.err_linf, marker="o", ms=6, lw=2, label=f"{impl} ∞范数",
                        color=SERIES[impl])
                ax.plot(s.nranks, s.err_rms, marker="s", ms=5, lw=1.5, ls="--",
                        label=f"{impl} RMS", color=SERIES[impl])
    ax.set_xscale("log", base=2)
    ax.set_yscale("log")
    ax.set_xticks(sorted(sub.nranks.unique()))
    ax.set_xlabel("rank 数")
    ax.set_ylabel("误差")
    ax.set_title(f"误差 vs rank 数 ({sizes[0]})")
    ax.legend(loc="upper right", fontsize=8)
    save(fig, outdir, "fig_a_vs_rank.png")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    csv_path = sys.argv[1]
    outdir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(csv_path))
    os.makedirs(outdir, exist_ok=True)
    df = load(csv_path)
    grouped_error_plot(df, "err_rms", "RMS 误差 (L2)", "误差 vs 配置: 实验组 vs 对照组", outdir, "fig_a_rms.png")
    grouped_error_plot(df, "err_linf", "∞ 范数误差", "误差 vs 配置: 实验组 vs 对照组", outdir, "fig_a_linf.png")

    cfgs = sorted(df.config.unique(), key=lambda c: (len(c), c))
    labels = [f"{c} / {n}r" for c in cfgs for n in sorted(df[df.config == c].nranks.unique())]
    cross = []
    for c in cfgs:
        for n in sorted(df[df.config == c].nranks.unique()):
            row = df[(df.config == c) & (df.nranks == n) & (df.implementation == "exp")]
            cross.append(row.cross_err_max.iloc[0] if len(row) else np.nan)
    fig, ax = plt.subplots(figsize=(max(8, 1.2 * len(labels)), 4.2))
    ax.bar(labels, cross, color=SERIES["exp"], edgecolor=MUTED, linewidth=0.8, width=0.6)
    ax.set_yscale("log")
    ax.set_xticklabels(labels, rotation=40, ha="right", fontsize=8)
    ax.set_ylabel("max |x_exp - x_ref|")
    ax.set_title("实验组 vs 对照组逐点互差")
    save(fig, outdir, "fig_a_cross.png")

    error_vs_rank(df, outdir)


if __name__ == "__main__":
    main()
