#!/usr/bin/env node
'use strict';
/*
 * mband_general.js — 任意带宽 (2m+1) 对角分布式求解的通用数值验证
 * ===========================================================
 * 目的: 验证 PaScaL-TDMA 向一般带宽 m 推广的结构通式:
 *   (1) 每条线每 rank 的接口未知量 = 2m (两端各 m)
 *   (2) 每 rank 贡献 2m 条边界方程, 缩约系统 2mP x 2mP
 *   (3) 每条边界方程归一化后对角槽恒 = 1
 *   (4) 统一槽位格式: 带宽 (2m-1, 2m-1), 每方程 4m 槽 (含 RHS)
 *   (5) 结构零槽: 由数值统计确定 (顶端/底端方程的各侧)
 *   (6) 通信量: 每线须传槽数 (含/不含结构零槽)
 *
 * 方法: 通用 m 缩减 (接口未知量作为边界条件, 内点稠密消元), m=1..4,
 *   多组 (P, Nrow, seed) 随机对角占优系统, 与全局稠密直解对比到机器精度。
 *
 * 对照基准: m=1 应重现三对角 (论文), m=2 应重现五对角 (已验证的移植)。
 */

// ---------------------------------------------------------------
// 工具
// ---------------------------------------------------------------
function lcg(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
// 稠密高斯消元 (选主元), 解 A x = b, 覆写 b 为解
function solve(A, b, n) {
  const a = A.map(row => row.slice());
  const x = b.slice();
  for (let k = 0; k < n; k++) {
    let piv = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[piv][k])) piv = i;
    [a[k], a[piv]] = [a[piv], a[k]];
    [x[k], x[piv]] = [x[piv], x[k]];
    for (let i = k + 1; i < n; i++) {
      const f = a[i][k] / a[k][k];
      for (let j = k; j < n; j++) a[i][j] -= f * a[k][j];
      x[i] -= f * x[k];
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = x[i];
    for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j];
    x[i] = s / a[i][i];
  }
  return x;
}

// ---------------------------------------------------------------
// 全局带状系统与切片
//   M[r]  : 全局行 r 的系数, M[r][k] (k=-m..m) 为 x_{r+k} 系数; 越界视为 0
// ---------------------------------------------------------------
function buildAndSlice(P, Nrow, m, seed) {
  const L = P * Nrow;
  const rng = lcg(seed);
  const M = [], b = [], xTrue = [];
  for (let r = 0; r < L; r++) {
    const row = new Array(2 * m + 1).fill(0);
    let offsum = 0;
    for (let k = -m; k <= m; k++) {
      if (k === 0) continue;
      const v = 0.1 + rng();
      row[k + m] = v; offsum += v;
    }
    row[m] = -offsum * 2.0;                  // 对角占优
    M[r] = row;
    xTrue.push(rng() * 2 - 1);
  }
  for (let r = 0; r < L; r++) {
    let s = 0;
    for (let k = -m; k <= m; k++) {
      const c = r + k;
      if (c >= 0 && c < L) s += M[r][k + m] * xTrue[c];
    }
    b.push(s);
  }
  const slices = [];
  for (let p = 0; p < P; p++) {
    const ca = [], rb = [];
    for (let j = 0; j < Nrow; j++) {
      ca.push(M[p * Nrow + j].slice());
      rb.push(b[p * Nrow + j]);
    }
    slices.push({ ca, rb });
  }
  return { M, b, xTrue, slices, L };
}

// ---------------------------------------------------------------
// 通用 m 缩减: 单 rank 切片 -> 2m 条边界方程 (归一化, 对角=1)
//   own : 系数在自身 2m 接口未知量 (顺序 top m, bottom m)
//   prev: 系数在上一 rank 的 bottom m 未知量
//   next: 系数在下一 rank 的 top m 未知量
//   rhs : 常数项 (等式 sum(coeff*x) = rhs)
// ---------------------------------------------------------------
function reduceSlice(slc, m, Nrow) {
  const { ca, rb } = slc;
  const nint = Nrow - 2 * m;
  if (nint <= 0) throw new Error(`Nrow=${Nrow} too small for m=${m}`);

  const ifaceTop = [], ifaceBot = [];
  for (let i = 0; i < m; i++) { ifaceTop.push(i); ifaceBot.push(Nrow - m + i); }
  const iface = ifaceTop.concat(ifaceBot);     // [top m, bottom m]
  const nIface = 2 * m;

  // 内点系统 + 多 RHS
  const Aint = [], rhsBase = [], rhsIface = [];
  for (let p = m; p < Nrow - m; p++) {
    const rowA = new Array(nint).fill(0);
    for (let k = -m; k <= m; k++) {
      const q = p + k;
      if (q >= m && q < Nrow - m) rowA[q - m] = ca[p][k + m];
    }
    Aint.push(rowA);
    rhsBase.push(rb[p]);
    const rowR = new Array(nIface).fill(0);
    for (let u = 0; u < nIface; u++) {
      const c = p - iface[u];
      if (Math.abs(c) <= m) rowR[u] = -ca[p][m - c];
    }
    rhsIface.push(rowR);
  }
  const X = [];
  for (let c = 0; c <= nIface; c++) {
    const col = c === 0 ? rhsBase.slice() : rhsIface.map(r => r[c - 1]);
    X.push(solve(Aint, col, nint));
  }
  const T = X[0];
  const Pcoef = [];
  for (let u = 0; u < nIface; u++) Pcoef.push(X[u + 1]);

  // 边界方程
  const eqs = [];
  for (let j = 0; j < Nrow; j++) {
    if (j >= m && j < Nrow - m) continue;      // 只处理 2m 条边界行
    const own = new Array(nIface).fill(0);
    const prev = new Array(m).fill(0);
    const next = new Array(m).fill(0);
    let rhs = rb[j];
    for (let k = -m; k <= m; k++) {
      const c = j + k;
      const a = ca[j][k + m];
      if (a === 0) continue;
      if (c >= m && c < Nrow - m) {
        rhs -= a * T[c - m];
        for (let u = 0; u < nIface; u++) own[u] += a * Pcoef[u][c - m];
      } else if (c >= 0 && c < m) {
        own[c] += a;
      } else if (c >= Nrow - m && c < Nrow) {
        own[m + (c - (Nrow - m))] += a;
      } else if (c < 0) {
        prev[c + m] += a;                      // 上一 rank bottom (bottom 块 index = c+m)
      } else {
        next[c - Nrow] += a;                   // 下一 rank top (top 块 index = c-Nrow)
      }
    }
    let diag;
    if (j < m) diag = own[j]; else diag = own[m + (j - (Nrow - m))];
    if (diag === 0) throw new Error('zero diagonal in boundary equation');
    const norm = 1 / diag;
    eqs.push({ own: own.map(v => v * norm), prev: prev.map(v => v * norm),
               next: next.map(v => v * norm), rhs: rhs * norm });
  }
  return { eqs };
}

// ---------------------------------------------------------------
// 组装缩约系统 + 求解 + 重建
// ---------------------------------------------------------------
function distributedSolve(P, Nrow, m, slices) {
  const n = 2 * m * P;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const rhs = new Array(n).fill(0);
  const reds = slices.map(s => reduceSlice(s, m, Nrow));
  for (let r = 0; r < P; r++) {
    const { eqs } = reds[r];
    for (let e = 0; e < 2 * m; e++) {
      const row = r * 2 * m + e;
      const eq = eqs[e];
      for (let i = 0; i < 2 * m; i++) A[row][r * 2 * m + i] += eq.own[i];
      if (r > 0) for (let i = 0; i < m; i++) A[row][(r - 1) * 2 * m + m + i] += eq.prev[i];
      if (r < P - 1) for (let i = 0; i < m; i++) A[row][(r + 1) * 2 * m + i] += eq.next[i];
      rhs[row] = eq.rhs;
    }
  }
  const ifaceSol = solve(A, rhs, n);
  const sol = new Array(P * Nrow).fill(0);
  for (let r = 0; r < P; r++) {
    const base = r * Nrow;
    for (let i = 0; i < m; i++) sol[base + i] = ifaceSol[r * 2 * m + i];
    for (let i = 0; i < m; i++) sol[base + Nrow - m + i] = ifaceSol[r * 2 * m + m + i];
    for (let p = m; p < Nrow - m; p++) {
      sol[base + p] = recomputeInterior(slices[r], m, Nrow, p, ifaceSol, r * 2 * m);
    }
  }
  return sol;
}

function recomputeInterior(slc, m, Nrow, p, ifaceSol, ownOffset) {
  const { ca, rb } = slc;
  const nint = Nrow - 2 * m;
  const iface = [];
  for (let i = 0; i < m; i++) iface.push(i);
  for (let i = 0; i < m; i++) iface.push(Nrow - m + i);
  const nIface = 2 * m;
  const Aint = [], rhsBase = [], rhsIface = [];
  for (let q = m; q < Nrow - m; q++) {
    const rowA = new Array(nint).fill(0);
    for (let k = -m; k <= m; k++) {
      const c = q + k;
      if (c >= m && c < Nrow - m) rowA[c - m] = ca[q][k + m];
    }
    Aint.push(rowA);
    rhsBase.push(rb[q]);
    const rowR = new Array(nIface).fill(0);
    for (let u = 0; u < nIface; u++) {
      const d = q - iface[u];
      if (Math.abs(d) <= m) rowR[u] = -ca[q][m - d];
    }
    rhsIface.push(rowR);
  }
  const X = [];
  for (let c = 0; c <= nIface; c++) {
    const col = c === 0 ? rhsBase.slice() : rhsIface.map(r => r[c - 1]);
    X.push(solve(Aint, col, nint));
  }
  let x = X[0][p - m];
  for (let u = 0; u < nIface; u++) x += X[u + 1][p - m] * ifaceSol[ownOffset + u];
  return x;
}

// ---------------------------------------------------------------
// 结构通式验证
// ---------------------------------------------------------------
function extractSlots(j, m, Nrow, eq) {
  const diagCol = (j < m) ? j : m + (j - (Nrow - m));
  const slotMap = new Map();
  const add = (col, v) => { const off = col - diagCol; slotMap.set(off, (slotMap.get(off) || 0) + v); };
  for (let i = 0; i < m; i++) add(i, eq.own[i]);
  for (let i = 0; i < m; i++) add(m + i, eq.own[m + i]);
  for (let i = 0; i < m; i++) add(-m + i, eq.prev[i]);
  for (let i = 0; i < m; i++) add(2 * m + i, eq.next[i]);
  return slotMap;
}

function verifyStructure(m) {
  const P = 3, NrowList = [2 * m + 2, 2 * m + 6, 2 * m + 10], seeds = [11, 29, 57];
  let diagOK = true, nEq = 0;
  const ever = new Set(), zero = new Map();
  const perTypeZero = Array.from({ length: 2 * m }, () => new Set());
  for (const Nrow of NrowList) {
    if (Nrow < 2 * m + 2) continue;
    for (const seed of seeds) {
      const { slices } = buildAndSlice(P, Nrow, m, seed);
      for (let r = 0; r < P; r++) {
        const { eqs } = reduceSlice(slices[r], m, Nrow);
        for (let e = 0; e < eqs.length; e++) {
          const eq = eqs[e];
          const isTop = (e < m);
          const j = isTop ? e : Nrow - m + (e - m);
          const diagVal = isTop ? eq.own[e] : eq.own[m + (e - m)];
          if (Math.abs(diagVal - 1) > 1e-12) diagOK = false;
          const sm = extractSlots(j, m, Nrow, eq);
          for (let off = -(2 * m - 1); off <= 2 * m - 1; off++) {
            const v = sm.get(off) || 0;
            if (Math.abs(v) > 1e-12) { ever.add(off); }
            else { zero.set(off, (zero.get(off) || 0) + 1); perTypeZero[e].add(off); }
          }
          nEq++;
        }
      }
    }
  }
  console.log(`\n== 结构通式 m=${m} (${nEq} 条方程统计) ==`);
  console.log(`  对角槽恒=1: ${diagOK}`);
  let minOff = Infinity, maxOff = -Infinity;
  for (const off of ever) { if (off < minOff) minOff = off; if (off > maxOff) maxOff = off; }
  console.log(`  缩约系统带宽: L 达 ${-minOff}, U 达 ${maxOff}  (预期 (2m-1,2m-1)=(${2*m-1},${2*m-1}))`);
  for (let e = 0; e < 2 * m; e++) {
    const z = [...perTypeZero[e]].sort((a, b) => a - b);
    console.log(`  方程位 ${e} (${e < m ? 'top' : 'bot'}): 结构零槽偏移 = [${z.join(', ')}]`);
  }
  let zeros = 0;
  for (let e = 0; e < 2 * m; e++) zeros += perTypeZero[e].size;
  const mustTxBand = 2 * m * (4 * m - 1) - 2 * m - zeros;
  const zerosFormula = 3 * m * (m - 1);
  const mustTxFormula = 5 * m * m + m;                       // 含 RHS
  const okZ = zeros === zerosFormula;
  const okT = (mustTxBand + 2 * m) === mustTxFormula;
  console.log(`  每线: 结构零槽 ${zeros} (公式 3m(m-1)=${zerosFormula} ${okZ ? '✓' : '✗'})`);
  console.log(`       只省对角 ${8*m*m-2*m}, 全省后总通信(含RHS) ${mustTxBand+2*m} (公式 5m^2+m=${mustTxFormula} ${okT ? '✓' : '✗'})`);
}

// ---------------------------------------------------------------
// 主验证: 解正确性 + 结构通式
// ---------------------------------------------------------------
function main() {
  const mList = [1, 2, 3, 4, 5, 6];
  const PList = [1, 2, 3, 4];
  const seeds = [11, 29, 57];
  let nCfg = 0, worstErr = 0, worstCfg = '';

  for (const m of mList) {
    const NrowList = [2 * m + 2, 2 * m + 4, 2 * m + 8];
    for (const P of PList) {
      for (const Nrow of NrowList) {
        if (Nrow < 2 * m + 2) continue;
        for (const seed of seeds) {
          const { xTrue, slices, L } = buildAndSlice(P, Nrow, m, seed);
          const sol = distributedSolve(P, Nrow, m, slices);
          let err = 0;
          for (let i = 0; i < L; i++) err = Math.max(err, Math.abs(sol[i] - xTrue[i]));
          nCfg++;
          if (err > worstErr) { worstErr = err; worstCfg = `m=${m} P=${P} Nrow=${Nrow} seed=${seed}`; }
        }
      }
    }
  }
  console.log(`解正确性: ${nCfg} 配置, 最差误差 ${worstErr.toExponential(3)}  @ ${worstCfg}`);
  if (worstErr < 1e-10) console.log('解正确性: 通过 (机器精度)');
  else { console.log('解正确性: 失败'); process.exit(1); }

  for (const m of mList) verifyStructure(m);
}
main();
