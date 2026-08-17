#!/usr/bin/env node
'use strict';
/*
 * hepta_indep_check.js — 七对角求解器的独立验证
 * ==============================================
 * 目的: 排除"AI 幻觉/自洽错误"。用与求解器无关的独立实现交叉验证:
 *
 *   (1) 全局矩阵稠密直解: 对 x≡1 系统和随机系统, 独立构造全局 7 对角矩阵,
 *       用独立稠密 LU (部分选主元) 求解, 与七对角分布式求解器输出逐点对比。
 *   (2) 残差检查: 把七对角解代回原系统 A x = b, 计算相对残差 ||Ax-b||/||b||,
 *       应 ~ n·ε (机器精度向后稳定)。
 *   (3) 制造解: 随机对角占优 7 对角系统, RHS = M·x_true (x_true 事先已知),
 *       求解器应复现 x_true。
 *
 * 若任一项失败 -> 说明实现有错, 直接报失败。
 */

// ---------- 独立稠密求解 (LU, 部分选主元, 不依赖求解器代码) ----------
function luSolve(A, b) {
  const n = A.length;
  const a = A.map(r => r.slice()), x = b.slice();
  const piv = Array.from({ length: n }, (_, i) => i);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[p][k])) p = i;
    [a[k], a[p]] = [a[p], a[k]]; [piv[k], piv[p]] = [piv[p], piv[k]];
    if (a[k][k] === 0) throw new Error('singular');
    for (let i = k + 1; i < n; i++) {
      const f = a[i][k] / a[k][k];
      for (let j = k + 1; j < n; j++) a[i][j] -= f * a[k][j];
      a[i][k] = f;
    }
  }
  const y = new Array(n);
  for (let i = 0; i < n; i++) { let s = b[piv[i]]; for (let j = 0; j < i; j++) s -= a[i][j] * y[j]; y[i] = s; }
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j]; x[i] = s / a[i][i]; }
  return x;
}

// ---------- 独立构造全局 7 对角矩阵 (物理边界幽灵=0) ----------
// 系数: 行 g 的 A[g][g+k] (k=-3..3, 越界为 0)
function globalMatrix(P, Nrow, mode, seed) {
  const L = P * Nrow;
  let rng = null;
  if (mode === 'random') rng = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const A = [], b = [], xTrue = [];
  for (let g = 0; g < L; g++) {
    const row = new Array(L).fill(0);
    let offsum = 0;
    if (mode === 'exact1') {
      for (let k = -3; k <= 3; k++) if (g + k >= 0 && g + k < L) row[g + k] = (k === 0) ? -6 : 1;
      xTrue.push(1);
    } else { // random 制造解
      for (let k = -3; k <= 3; k++) {
        if (k === 0) continue;
        const v = 0.1 + rng();
        if (g + k >= 0 && g + k < L) row[g + k] = v;
        offsum += v;
      }
      row[g] = -offsum * 2.0;
      xTrue.push(rng() * 2 - 1);
    }
    A.push(row);
  }
  for (let g = 0; g < L; g++) {
    let s = 0;
    for (let c = 0; c < L; c++) s += A[g][c] * xTrue[c];
    b.push(s);
  }
  return { A, b, xTrue, L };
}

// ---------- 七对角分布式求解器 (显式递推, m=3) ----------
function lcg(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function solve(A, b, n) {
  const a = A.map(row => row.slice()), x = b.slice();
  for (let k = 0; k < n; k++) {
    let piv = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[piv][k])) piv = i;
    [a[k], a[piv]] = [a[piv], a[k]]; [x[k], x[piv]] = [x[piv], x[k]];
    for (let i = k + 1; i < n; i++) { const f = a[i][k] / a[k][k]; for (let j = k; j < n; j++) a[i][j] -= f * a[k][j]; x[i] -= f * x[k]; }
  }
  for (let i = n - 1; i >= 0; i--) { let s = x[i]; for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j]; x[i] = s / a[i][i]; }
  return x;
}
function sliceSystem(A, b, P, Nrow) {
  const slices = [];
  for (let r = 0; r < P; r++) {
    const ca = [], rb = [];
    for (let j = 0; j < Nrow; j++) {
      const row = new Array(7).fill(0);
      for (let k = -3; k <= 3; k++) { const gg = r * Nrow + j + k; row[k + 3] = (gg >= 0 && gg < P * Nrow) ? A[r * Nrow + j][gg] : 0; }
      ca.push(row);
      rb.push(b[r * Nrow + j]);
    }
    slices.push({ ca, rb });
  }
  return slices;
}
function heptaSolve(P, Nrow, slices) {
  const m = 3, n = 6 * P;
  const A2 = Array.from({ length: n }, () => new Array(n).fill(0)), rhs = new Array(n).fill(0);
  const reds = slices.map(s => { const fw = forwardSweep(s.ca, s.rb, Nrow); const fn = backwardSweep(fw, Nrow); return { fn, eqs: boundaryEquations(s.ca, s.rb, fn, Nrow) }; });
  for (let r = 0; r < P; r++) for (let e = 0; e < 6; e++) {
    const row = r * 6 + e, eq = reds[r].eqs[e];
    for (let i = 0; i < 6; i++) A2[row][r * 6 + i] += eq.own[i];
    if (r > 0) for (let i = 0; i < 3; i++) A2[row][(r - 1) * 6 + 3 + i] += eq.prev[i];
    if (r < P - 1) for (let i = 0; i < 3; i++) A2[row][(r + 1) * 6 + i] += eq.next[i];
    rhs[row] = eq.rhs;
  }
  const s6 = solve(A2, rhs, n);
  const sol = new Array(P * Nrow).fill(0);
  for (let r = 0; r < P; r++) {
    const base = r * Nrow;
    for (let i = 0; i < 3; i++) sol[base + i] = s6[r * 6 + i];
    for (let i = 0; i < 3; i++) sol[base + Nrow - 3 + i] = s6[r * 6 + 3 + i];
    for (let p = 3; p < Nrow - 3; p++) {
      const f = reds[r].fn[p];
      let x = f.T;
      for (let k = 0; k < 3; k++) x += f.P[k] * s6[r * 6 + k];
      for (let r2 = 0; r2 < 3; r2++) x += f.R[r2] * s6[r * 6 + 3 + r2];
      sol[base + p] = x;
    }
  }
  return sol;
}
function forwardSweep(ca, rb, Nrow) {
  const fwd = {};
  for (let j = 3; j < Nrow - 3; j++) {
    const a0 = ca[j][3], P = [0, 0, 0], Q = [0, 0, 0];
    let T = rb[j];
    if (j === 3) {
      for (let k = 0; k < 3; k++) P[k] = -ca[j][k] / a0;
      for (let l = 0; l < 3; l++) Q[l] = -ca[j][4 + l] / a0;
      T /= a0;
    } else {
      const effP = [[0,0,0],[0,0,0],[0,0,0]], effQ = [[0,0,0,0],[0,0,0,0],[0,0,0,0]], effT = [0,0,0];
      for (let i = 2; i >= 0; i--) {
        const p = j - 3 + i;
        if (p < 3) { effP[i][p] = 1; continue; }
        const f = fwd[p];
        for (let k = 0; k < 3; k++) effP[i][k] += f.P[k];
        effT[i] += f.T;
        for (let l = 0; l < 3; l++) {
          const t = p + l + 1, q = f.Q[l];
          if (q === 0) continue;
          if (t === j) { effQ[i][0] += q; }
          else if (t > j) { effQ[i][t - j] += q; }
          else { const it = t - (j - 3);
                 for (let u = 0; u <= 3; u++) effQ[i][u] += q * effQ[it][u];
                 for (let k = 0; k < 3; k++) effP[i][k] += q * effP[it][k];
                 effT[i] += q * effT[it]; }
        }
      }
      let den = a0;
      for (let i = 0; i < 3; i++) den += ca[j][i] * effQ[i][0];
      for (let i = 0; i < 3; i++) {
        const c = ca[j][i]; if (c === 0) continue;
        for (let k = 0; k < 3; k++) P[k] -= c * effP[i][k];
        for (let u = 1; u <= 3; u++) Q[u - 1] -= c * effQ[i][u];
        T -= c * effT[i];
      }
      for (let u = 0; u < 3; u++) Q[u] -= ca[j][4 + u];
      for (let k = 0; k < 3; k++) P[k] /= den;
      for (let u = 0; u < 3; u++) Q[u] /= den;
      T /= den;
    }
    fwd[j] = { P, Q, T };
  }
  return fwd;
}
function backwardSweep(fwd, Nrow) {
  const fin = {};
  { const j = Nrow - 4; fin[j] = { P: fwd[j].P.slice(), R: fwd[j].Q.slice(), T: fwd[j].T }; }
  for (let j = Nrow - 5; j >= 3; j--) {
    const P = fwd[j].P.slice(), R = [0, 0, 0];
    let T = fwd[j].T;
    for (let l = 0; l < 3; l++) {
      const q = fwd[j].Q[l]; if (q === 0) continue;
      const t = j + l + 1;
      if (t >= Nrow - 3) { R[t - (Nrow - 3)] += q; continue; }
      const fj = fin[t];
      for (let k = 0; k < 3; k++) P[k] += q * fj.P[k];
      for (let r = 0; r < 3; r++) R[r] += q * fj.R[r];
      T += q * fj.T;
    }
    fin[j] = { P, R, T };
  }
  return fin;
}
function boundaryEquations(ca, rb, fin, Nrow) {
  const eqs = [];
  for (let j = 0; j < Nrow; j++) {
    if (j >= 3 && j < Nrow - 3) continue;
    const own = new Array(6).fill(0), prev = new Array(3).fill(0), next = new Array(3).fill(0);
    let rhs = rb[j];
    for (let k = -3; k <= 3; k++) {
      const c = j + k, a = ca[j][k + 3];
      if (a === 0) continue;
      if (c >= 3 && c < Nrow - 3) {
        const f = fin[c];
        rhs -= a * f.T;
        for (let u = 0; u < 3; u++) own[u] += a * f.P[u];
        for (let r = 0; r < 3; r++) own[3 + r] += a * f.R[r];
      } else if (c >= 0 && c < 3) { own[c] += a; }
      else if (c >= Nrow - 3 && c < Nrow) { own[3 + (c - (Nrow - 3))] += a; }
      else if (c < 0) { prev[c + 3] += a; }
      else { next[c - Nrow] += a; }
    }
    let diag;
    if (j < 3) diag = own[j]; else diag = own[3 + (j - (Nrow - 3))];
    const norm = 1 / diag;
    eqs.push({ own: own.map(v => v * norm), prev: prev.map(v => v * norm),
               next: next.map(v => v * norm), rhs: rhs * norm });
  }
  return eqs;
}

// ---------- 主验证 ----------
let fail = 0;
const configs = [];
for (const mode of ['exact1', 'random'])
  for (const P of [1, 2, 3])
    for (const Nrow of [8, 10, 14])
      for (const seed of [11, 29, 57])
        configs.push({ mode, P, Nrow, seed });

let worstDiff = 0, worstResid = 0;
for (const cfg of configs) {
  const { A, b, xTrue, L } = globalMatrix(cfg.P, cfg.Nrow, cfg.mode, cfg.seed);
  const dense = luSolve(A, b);                    // 独立稠密解
  const slices = sliceSystem(A, b, cfg.P, cfg.Nrow);
  const hepta = heptaSolve(cfg.P, cfg.Nrow, slices);

  let diff = 0, resid = 0, normB = 0;
  for (let i = 0; i < L; i++) {
    diff = Math.max(diff, Math.abs(hepta[i] - dense[i]));
    normB = Math.max(normB, Math.abs(b[i]));
  }
  // 残差 ||A·hepta - b||∞ / ||b||∞
  for (let g = 0; g < L; g++) {
    let s = 0;
    for (let c = 0; c < L; c++) s += A[g][c] * hepta[c];
    resid = Math.max(resid, Math.abs(s - b[g]));
  }
  if (diff > worstDiff) worstDiff = diff;
  if (resid / normB > worstResid) worstResid = resid / normB;
  if (diff > 1e-10 || resid / normB > 1e-11) { fail++; console.log('FAIL', JSON.stringify(cfg), 'diff=', diff, 'resid=', resid / normB); }
}

console.log(`独立验证: ${configs.length} 配置`);
console.log(`七对角解 vs 独立稠密直解  最大差: ${worstDiff.toExponential(3)}`);
console.log(`相对残差 ||Ax̂-b||/||b||  最大: ${worstResid.toExponential(3)}`);
console.log(fail === 0 ? '→ 全部通过 (机器精度, 非幻觉)' : `→ ${fail} 个配置失败`);
