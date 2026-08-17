#!/usr/bin/env node
'use strict';
/*
 * hepta_demo.js — 七对角 (m=3) PaScaL-TDMA 演示
 * =============================================
 * 自包含: 直接 `node hepta_demo.js` 即可运行。
 *
 * 测试系统: 7 对角, 系数 Aa=Ab=Ad=Ae=Af=Ag=1, Ac=-6 (行和=0),
 *   全局首 3 行 / 末 3 行的 RHS 按"忽略幽灵点"补偿 -> 精确解 x ≡ 1。
 *   两 rank 各 Nrow=16 行 (线长 32), 与分布式路径一致 (跨 rank 耦合)。
 *
 * 打印: 采样解, 最大误差 vs x≡1 (应 ~1e-16), 耗时。
 */
const m = 3;

// ---------------------------------------------------------------
// 稠密高斯消元 (选主元)
// ---------------------------------------------------------------
function solve(A, b, n) {
  const a = A.map(r => r.slice());
  const x = b.slice();
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[p][k])) p = i;
    [a[k], a[p]] = [a[p], a[k]]; [x[k], x[p]] = [x[p], x[k]];
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
// x≡1 测试系统: 每 rank 切片 (ca[j][k+3] = x_{j+k} 系数, k=-3..3)
// ---------------------------------------------------------------
function buildExact1(P, Nrow) {
  const slices = [];
  for (let r = 0; r < P; r++) {
    const ca = [], rb = [];
    const head = (r === 0), tail = (r === P - 1);
    for (let j = 0; j < Nrow; j++) {
      const row = new Array(7).fill(0);
      for (let k = -3; k <= 3; k++) row[k + 3] = (k === 0) ? -6 : 1;
      ca.push(row);
      let rhs = 0;
      // RHS = 行和(0) - 被忽略的幽灵系数*1; 全局行 g = r*Nrow+j
      const g = r * Nrow + j;
      for (let k = -3; k <= 3; k++) {
        const gg = g + k;
        if (gg < 0 || gg >= P * Nrow) rhs -= ca[j][k + 3];   // 幽灵点 (=0) 贡献
      }
      rb.push(rhs);
    }
    slices.push({ ca, rb });
  }
  return slices;
}

// ---------------------------------------------------------------
// 七对角求解器 (显式递推, 见 mband_theory.md §7)
// ---------------------------------------------------------------
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
      const effP = [[0,0,0],[0,0,0],[0,0,0]];
      const effQ = [[0,0,0,0],[0,0,0,0],[0,0,0,0]];
      const effT = [0,0,0];
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
function heptaSolve(P, Nrow, slices) {
  const n = 6 * P;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const rhs = new Array(n).fill(0);
  const reds = slices.map(s => { const fw = forwardSweep(s.ca, s.rb, Nrow);
                                 const fn = backwardSweep(fw, Nrow);
                                 return { fn, eqs: boundaryEquations(s.ca, s.rb, fn, Nrow) }; });
  for (let r = 0; r < P; r++) for (let e = 0; e < 6; e++) {
    const row = r * 6 + e, eq = reds[r].eqs[e];
    for (let i = 0; i < 6; i++) A[row][r * 6 + i] += eq.own[i];
    if (r > 0) for (let i = 0; i < 3; i++) A[row][(r - 1) * 6 + 3 + i] += eq.prev[i];
    if (r < P - 1) for (let i = 0; i < 3; i++) A[row][(r + 1) * 6 + i] += eq.next[i];
    rhs[row] = eq.rhs;
  }
  const s6 = solve(A, rhs, n);
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

// ---------------------------------------------------------------
// 演示主程序
// ---------------------------------------------------------------
const P = 2, Nrow = 16;                 // 2 rank, 每 rank 16 行, 线长 32
const L = P * Nrow;

console.log('==== 七对角 (m=3) PaScaL-TDMA 演示 ====');
console.log('系统: 7 对角, 系数 (1,1,1,-6,1,1,1), 精确解 x ≡ 1');
console.log(`规模: P = ${P} rank, Nrow = ${Nrow} / rank, 线长 ${L}\n`);

const t0 = Date.now();
const slices = buildExact1(P, Nrow);
const sol = heptaSolve(P, Nrow, slices);
const ms = Date.now() - t0;

// 采样解
const samples = [0, 1, 2, 5, Nrow - 3, Nrow - 1, Nrow, Nrow + 3, Nrow + 5, 2 * Nrow - 1];
console.log('解 (采样):');
for (const i of samples) {
  console.log(`  x[${String(i).padStart(2)}] = ${sol[i].toFixed(6)}`);
}

// 误差 vs x≡1
let maxErr = 0;
for (let i = 0; i < L; i++) maxErr = Math.max(maxErr, Math.abs(sol[i] - 1));
console.log(`\n最大误差 vs 精确解 x≡1: ${maxErr.toExponential(3)}`);
console.log(maxErr < 1e-12 ? '→ 机器精度 ✓ 求解正确' : '→ 失败 ✗');

console.log(`耗时: ${ms} ms (含 Node 解释开销, 非性能基准)`);
