#!/usr/bin/env node
'use strict';
/*
 * mband_recurrence.js — 一般带宽 m 的显式消元递推式
 * ==================================================
 * 实现 P0 理论: 通用 m 分布式缩约的显式前向/后向扫递推公式, 并与稠密缩减
 * (mband_general.js 已验证) 对比到机器精度, m=1..6。
 *
 * 记号: 切片 Nrow 行, 带宽 m。
 *   接口未知量 (左端): x_0..x_{m-1}; (右端): x_{Nrow-m}..x_{Nrow-1}
 *   内点: x_m..x_{Nrow-m-1}
 *
 * 前向扫 (fwd): 每个内点 j 表达为
 *   x_j = Σ_{k=0}^{m-1} P_k^(j) x_k + Σ_{l=1}^{m} Q_l^(j) x_{j+l} + T^(j)
 * 后向扫 (fin): 锚点 Nrow-m-1 后回代, 每个内点 j 表达为
 *   x_j = Σ_{k=0}^{m-1} P_k^(j) x_k + Σ_{r=0}^{m-1} R_r^(j) x_{Nrow-m+r} + T^(j)
 */

// ---------------------------------------------------------------
// 工具 (复制自 mband_general.js)
// ---------------------------------------------------------------
function lcg(seed) {
  return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function solve(A, b, n) {
  const a = A.map(row => row.slice());
  const x = b.slice();
  for (let k = 0; k < n; k++) {
    let piv = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[piv][k])) piv = i;
    [a[k], a[piv]] = [a[piv], a[k]]; [x[k], x[piv]] = [x[piv], x[k]];
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
function buildAndSlice(P, Nrow, m, seed) {
  const L = P * Nrow;
  const rng = lcg(seed);
  const M = [], b = [], xTrue = [];
  for (let r = 0; r < L; r++) {
    const row = new Array(2 * m + 1).fill(0);
    let offsum = 0;
    for (let k = -m; k <= m; k++) { if (k === 0) continue; const v = 0.1 + rng(); row[k + m] = v; offsum += v; }
    row[m] = -offsum * 2.0;
    M[r] = row; xTrue.push(rng() * 2 - 1);
  }
  for (let r = 0; r < L; r++) {
    let s = 0;
    for (let k = -m; k <= m; k++) { const c = r + k; if (c >= 0 && c < L) s += M[r][k + m] * xTrue[c]; }
    b.push(s);
  }
  const slices = [];
  for (let p = 0; p < P; p++) {
    const ca = [], rb = [];
    for (let j = 0; j < Nrow; j++) { ca.push(M[p * Nrow + j].slice()); rb.push(b[p * Nrow + j]); }
    slices.push({ ca, rb });
  }
  return { M, b, xTrue, slices, L };
}

// ---------------------------------------------------------------
// P0 核心: 一般 m 显式前向扫 (resolve/composition 递推)
// 返回 fwd[j] = {P:[m], Q:[m], T}  (Q[l] = 系数 x_{j+l+1})
// ---------------------------------------------------------------
function forwardSweep(ca, rb, m, Nrow) {
  const fwd = {};
  for (let j = m; j < Nrow - m; j++) {
    const a0 = ca[j][m];                    // 对角
    const P = new Array(m).fill(0);
    const Q = new Array(m).fill(0);         // Q[l] = 系数 x_{j+l+1}, l=0..m-1
    let T = rb[j];
    if (j === m) {
      // 种子: 行 m 直接解 x_m
      for (let k = 0; k < m; k++) P[k] = -ca[j][k] / a0;
      for (let l = 0; l < m; l++) Q[l] = -ca[j][m + l + 1] / a0;
      T = T / a0;
    } else {
      // 前 m 行 x_{j-m}..x_{j-1} 的"已消解"形式 (只耦合接口 + x_j..x_{j+m})
      // effP[i][k], effQ[i][u] (u=0..m), effT[i]; i=0 -> x_{j-m}
      const effP = Array.from({ length: m }, () => new Array(m).fill(0));
      const effQ = Array.from({ length: m }, () => new Array(m + 1).fill(0));
      const effT = new Array(m).fill(0);
      for (let i = m - 1; i >= 0; i--) {    // 从 x_{j-1} 往左处理
        const p = j - m + i;
        if (p < m) {                        // 左接口未知量 x_p: 自身即接口
          effP[i][p] = 1;
          continue;
        }
        const f = fwd[p];
        for (let k = 0; k < m; k++) effP[i][k] += f.P[k];
        effT[i] += f.T;
        for (let l = 0; l < m; l++) {        // f.Q[l] = 系数 x_{p+l+1}
          const t = p + l + 1;               // 目标行
          if (t === j) { effQ[i][0] += f.Q[l]; }
          else if (t > j) { effQ[i][t - j] += f.Q[l]; }
          else {                            // t < j: 已被消解 (行 t > p, 已处理)
            const it = t - (j - m);
            for (let u = 0; u <= m; u++) effQ[i][u] += f.Q[l] * effQ[it][u];
            for (let k = 0; k < m; k++) effP[i][k] += f.Q[l] * effP[it][k];
            effT[i] += f.Q[l] * effT[it];
          }
        }
      }
      // 合并进行 j
      let den = a0;
      for (let i = 0; i < m; i++) {
        const c = ca[j][i];                  // 系数 x_{j-m+i}
        if (c === 0) continue;
        den += c * effQ[i][0];
      }
      for (let i = 0; i < m; i++) {
        const c = ca[j][i];
        if (c === 0) continue;
        for (let k = 0; k < m; k++) P[k] -= c * effP[i][k];
        for (let u = 1; u <= m; u++) Q[u - 1] -= c * effQ[i][u];
        T -= c * effT[i];
      }
      for (let u = 0; u < m; u++) Q[u] -= ca[j][m + u + 1];   // 直接右耦合 x_{j+u+1}
      for (let k = 0; k < m; k++) P[k] = P[k] / den;
      for (let u = 0; u < m; u++) Q[u] = Q[u] / den;
      T = T / den;
    }
    fwd[j] = { P, Q, T };
  }
  return fwd;
}

// ---------------------------------------------------------------
// 一般 m 显式后向扫: fwd -> fin (只耦合左接口 + 右接口 + T)
//   fin[j] = {P:[m], R:[m], T}
// ---------------------------------------------------------------
function backwardSweep(fwd, m, Nrow) {
  const fin = {};
  // 锚点 j = Nrow-m-1: 右耦合 x_{Nrow-m-1+l+1}... 即 fwd.Q[l] 指向 x_{Nrow-m-1+l+1}=x_{Nrow-m+l}
  //   正是右接口索引 l
  {
    const j = Nrow - m - 1;
    fin[j] = { P: fwd[j].P.slice(), R: fwd[j].Q.slice(), T: fwd[j].T };
  }
  for (let j = Nrow - m - 2; j >= m; j--) {
    const P = new Array(m).fill(0);
    const R = new Array(m).fill(0);
    let T = fwd[j].T;
    for (let k = 0; k < m; k++) P[k] = fwd[j].P[k];
    for (let l = 0; l < m; l++) {            // 代 x_{j+l+1}
      const q = fwd[j].Q[l];
      if (q === 0) continue;
      const t = j + l + 1;
      if (t >= Nrow - m) {                   // 右接口未知量
        R[t - (Nrow - m)] += q;
        continue;
      }
      const fj = fin[t];
      for (let k = 0; k < m; k++) P[k] += q * fj.P[k];
      for (let r = 0; r < m; r++) R[r] += q * fj.R[r];
      T += q * fj.T;
    }
    fin[j] = { P, R, T };
  }
  return fin;
}

// ---------------------------------------------------------------
// 由 fin 组装 2m 条边界方程 (与 mband_general.reduceSlice 同结构)
//   own:[2m] (top m, bot m), prev:[m], next:[m], rhs
// ---------------------------------------------------------------
function buildReducedEqs(ca, rb, fin, m, Nrow) {
  const eqs = [];
  for (let j = 0; j < Nrow; j++) {
    if (j >= m && j < Nrow - m) continue;
    const own = new Array(2 * m).fill(0);
    const prev = new Array(m).fill(0);
    const next = new Array(m).fill(0);
    let rhs = rb[j];
    for (let k = -m; k <= m; k++) {
      const c = j + k;
      const a = ca[j][k + m];
      if (a === 0) continue;
      if (c >= m && c < Nrow - m) {          // 内点: 代入 fin[c]
        const f = fin[c];
        rhs -= a * f.T;
        for (let u = 0; u < m; u++) own[u] += a * f.P[u];
        for (let r = 0; r < m; r++) own[m + r] += a * f.R[r];
      } else if (c >= 0 && c < m) {
        own[c] += a;
      } else if (c >= Nrow - m && c < Nrow) {
        own[m + (c - (Nrow - m))] += a;
      } else if (c < 0) {
        prev[c + m] += a;
      } else {
        next[c - Nrow] += a;
      }
    }
    let diag;
    if (j < m) diag = own[j]; else diag = own[m + (j - (Nrow - m))];
    if (diag === 0) throw new Error('zero diagonal');
    const norm = 1 / diag;
    eqs.push({ own: own.map(v => v * norm), prev: prev.map(v => v * norm),
               next: next.map(v => v * norm), rhs: rhs * norm });
  }
  return eqs;
}

// ---------------------------------------------------------------
// 稠密缩减 (mband_general.reduceSlice) 用于对比
// ---------------------------------------------------------------
function reduceSliceDense(slc, m, Nrow) {
  const { ca, rb } = slc;
  const nint = Nrow - 2 * m;
  const ifaceTop = [], ifaceBot = [];
  for (let i = 0; i < m; i++) { ifaceTop.push(i); ifaceBot.push(Nrow - m + i); }
  const iface = ifaceTop.concat(ifaceBot);
  const nIface = 2 * m;
  const Aint = [], rhsBase = [], rhsIface = [];
  for (let p = m; p < Nrow - m; p++) {
    const rowA = new Array(nint).fill(0);
    for (let k = -m; k <= m; k++) { const q = p + k; if (q >= m && q < Nrow - m) rowA[q - m] = ca[p][k + m]; }
    Aint.push(rowA);
    rhsBase.push(rb[p]);
    const rowR = new Array(nIface).fill(0);
    for (let u = 0; u < nIface; u++) { const c = p - iface[u]; if (Math.abs(c) <= m) rowR[u] = -ca[p][m - c]; }
    rhsIface.push(rowR);
  }
  const X = [];
  for (let c = 0; c <= nIface; c++) { const col = c === 0 ? rhsBase.slice() : rhsIface.map(r => r[c - 1]); X.push(solve(Aint, col, nint)); }
  const T = X[0], Pcoef = [];
  for (let u = 0; u < nIface; u++) Pcoef.push(X[u + 1]);
  const eqs = [];
  for (let j = 0; j < Nrow; j++) {
    if (j >= m && j < Nrow - m) continue;
    const own = new Array(nIface).fill(0), prev = new Array(m).fill(0), next = new Array(m).fill(0);
    let rhs = rb[j];
    for (let k = -m; k <= m; k++) {
      const c = j + k, a = ca[j][k + m];
      if (a === 0) continue;
      if (c >= m && c < Nrow - m) {
        rhs -= a * T[c - m];
        for (let u = 0; u < nIface; u++) own[u] += a * Pcoef[u][c - m];
      } else if (c >= 0 && c < m) { own[c] += a; }
      else if (c >= Nrow - m && c < Nrow) { own[m + (c - (Nrow - m))] += a; }
      else if (c < 0) { prev[c + m] += a; }
      else { next[c - Nrow] += a; }
    }
    let diag;
    if (j < m) diag = own[j]; else diag = own[m + (j - (Nrow - m))];
    const norm = 1 / diag;
    eqs.push({ own: own.map(v => v * norm), prev: prev.map(v => v * norm),
               next: next.map(v => v * norm), rhs: rhs * norm });
  }
  return eqs;
}

// ---------------------------------------------------------------
// 主验证: 递推式 vs 稠密缩减 (边界方程逐元素) + 完整解 vs 精确解
// ---------------------------------------------------------------
function main() {
  const mList = [1, 2, 3, 4, 5, 6];
  const PList = [1, 2, 3];
  const seeds = [11, 29, 57];
  let nCfg = 0, worstEqDiff = 0, worstSolErr = 0, worstCfg = '';

  for (const m of mList) {
    for (const P of PList) {
      const NrowList = [2 * m + 2, 2 * m + 6];
      for (const Nrow of NrowList) {
        for (const seed of seeds) {
          const { M, b, xTrue, slices, L } = buildAndSlice(P, Nrow, m, seed);
          // 递推式缩约
          const recEqs = slices.map(s => { const fw = forwardSweep(s.ca, s.rb, m, Nrow);
                                           const fn = backwardSweep(fw, m, Nrow);
                                           return buildReducedEqs(s.ca, s.rb, fn, m, Nrow); });
          // 稠密缩约
          const denEqs = slices.map(s => reduceSliceDense(s, m, Nrow));
          // 边界方程逐元素差
          let eqDiff = 0;
          for (let r = 0; r < P; r++) {
            for (let e = 0; e < recEqs[r].length; e++) {
              const a = recEqs[r][e], b2 = denEqs[r][e];
              for (let i = 0; i < 2 * m; i++) eqDiff = Math.max(eqDiff, Math.abs(a.own[i] - b2.own[i]));
              for (let i = 0; i < m; i++) { eqDiff = Math.max(eqDiff, Math.abs(a.prev[i] - b2.prev[i])); eqDiff = Math.max(eqDiff, Math.abs(a.next[i] - b2.next[i])); }
              eqDiff = Math.max(eqDiff, Math.abs(a.rhs - b2.rhs));
            }
          }
          // 完整解: 组装 + 求解 + 重建
          const sol = fullSolve(P, Nrow, m, slices, recEqs);
          let solErr = 0;
          for (let i = 0; i < L; i++) solErr = Math.max(solErr, Math.abs(sol[i] - xTrue[i]));
          nCfg++;
          if (eqDiff > worstEqDiff) worstEqDiff = eqDiff;
          if (solErr > worstSolErr) { worstSolErr = solErr; worstCfg = `m=${m} P=${P} Nrow=${Nrow} seed=${seed}`; }
        }
      }
    }
  }
  console.log(`配置数: ${nCfg}`);
  console.log(`递推式 vs 稠密缩减 边界方程最大差: ${worstEqDiff.toExponential(3)}`);
  console.log(`递推式完整解 vs 精确解 最大差: ${worstSolErr.toExponential(3)}  @ ${worstCfg}`);
  if (worstEqDiff < 1e-10 && worstSolErr < 1e-10) console.log('递推式: 通过 (机器精度)');
  else { console.log('递推式: 失败'); process.exit(1); }
}

function fullSolve(P, Nrow, m, slices, recEqs) {
  const n = 2 * m * P;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const rhs = new Array(n).fill(0);
  for (let r = 0; r < P; r++) {
    for (let e = 0; e < 2 * m; e++) {
      const row = r * 2 * m + e, eq = recEqs[r][e];
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
    // 内点重建: 用递推式的 fin (这里直接用稠密重建, 因为 fullSolve 已有 recEqs 但没 fin)
    for (let p = m; p < Nrow - m; p++) {
      sol[base + p] = recomputeFin(slices[r], m, Nrow, p, ifaceSol, r * 2 * m);
    }
  }
  return sol;
}

// 用显式后向扫 fin 重建内点
function recomputeFin(slc, m, Nrow, p, ifaceSol, ownOffset) {
  const { ca, rb } = slc;
  const fw = forwardSweep(ca, rb, m, Nrow);
  const fn = backwardSweep(fw, m, Nrow);
  const f = fn[p];
  let x = f.T;
  for (let k = 0; k < m; k++) x += f.P[k] * ifaceSol[ownOffset + k];
  for (let r = 0; r < m; r++) x += f.R[r] * ifaceSol[ownOffset + m + r];
  return x;
}

main();
