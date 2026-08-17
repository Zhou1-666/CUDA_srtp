#!/usr/bin/env node
'use strict';
/*
 * hepta_solver.js — 七对角 (m=3) 分布式求解器实现与验证
 * =====================================================
 * 按 m-band 理论 (mband_theory.md) 实现 m=3 情形:
 *   - 接口未知量 2m=6: 左 {x_0,x_1,x_2}, 右 {x_{N-3},x_{N-2},x_{N-1}}
 *   - 每 rank 6 条边界方程, 每方程 12 槽 [L5,L4,L3,L2,L1,D,U1,U2,U3,U4,U5,RHS]
 *   - 缩约系统 6P×6P, 带宽 (5,5)
 *   - 显式前向/后向扫递推 (resolve 合成)
 *
 * 验证: 随机对角占优 7 对角系统, P∈{1,2,3}, 多种子, vs 全局稠密直解到机器精度。
 */

// ---------------------------------------------------------------
// 工具
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

// 全局 7 对角系统 + 切片 (带宽 m=3)
function build(P, Nrow, seed) {
  const m = 3, L = P * Nrow;
  const rng = lcg(seed);
  const M = [], b = [], xt = [];
  for (let r = 0; r < L; r++) {
    const row = new Array(7).fill(0);
    let off = 0;
    for (let k = -3; k <= 3; k++) { if (k === 0) continue; const v = 0.1 + rng(); row[k + 3] = v; off += v; }
    row[3] = -off * 2.0;
    M[r] = row; xt.push(rng() * 2 - 1);
  }
  for (let r = 0; r < L; r++) {
    let s = 0;
    for (let k = -3; k <= 3; k++) { const c = r + k; if (c >= 0 && c < L) s += M[r][k + 3] * xt[c]; }
    b.push(s);
  }
  const slices = [];
  for (let p = 0; p < P; p++) {
    const ca = [], rb = [];
    for (let j = 0; j < Nrow; j++) { ca.push(M[p * Nrow + j].slice()); rb.push(b[p * Nrow + j]); }
    slices.push({ ca, rb });
  }
  return { xt, slices, L };
}

// ---------------------------------------------------------------
// 七对角前向扫 (m=3, resolve 合成)
//   fwd[j] = {P:[3](左接口), Q:[3](右耦合 x_{j+l+1}), T}
// ---------------------------------------------------------------
function forwardSweep(ca, rb, Nrow) {
  const m = 3, fwd = {};
  for (let j = 3; j < Nrow - 3; j++) {
    const a0 = ca[j][3];
    const P = [0, 0, 0], Q = [0, 0, 0];
    let T = rb[j];
    if (j === 3) {                     // 种子: 行 3 直接解
      for (let k = 0; k < 3; k++) P[k] = -ca[j][k] / a0;
      for (let l = 0; l < 3; l++) Q[l] = -ca[j][4 + l] / a0;
      T = T / a0;
    } else {
      // 前 3 行 x_{j-3}..x_{j-1} 的已消解形式
      const effP = Array.from({ length: 3 }, () => [0, 0, 0]);
      const effQ = Array.from({ length: 3 }, () => [0, 0, 0, 0]);  // u=0..3
      const effT = [0, 0, 0];
      for (let i = 2; i >= 0; i--) {
        const p = j - 3 + i;
        if (p < 3) { effP[i][p] = 1; continue; }      // 左接口未知量
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

// ---------------------------------------------------------------
// 后向扫 (m=3): fin[j] = {P:[3], R:[3](右接口 x_{N-3+r}), T}
// ---------------------------------------------------------------
function backwardSweep(fwd, Nrow) {
  const fin = {};
  { const j = Nrow - 4; fin[j] = { P: fwd[j].P.slice(), R: fwd[j].Q.slice(), T: fwd[j].T }; }
  for (let j = Nrow - 5; j >= 3; j--) {
    const P = fwd[j].P.slice(), R = [0, 0, 0];
    let T = fwd[j].T;
    for (let l = 0; l < 3; l++) {
      const q = fwd[j].Q[l]; if (q === 0) continue;
      const t = j + l + 1;
      if (t >= Nrow - 3) { R[t - (Nrow - 3)] += q; continue; }   // 右接口
      const fj = fin[t];
      for (let k = 0; k < 3; k++) P[k] += q * fj.P[k];
      for (let r = 0; r < 3; r++) R[r] += q * fj.R[r];
      T += q * fj.T;
    }
    fin[j] = { P, R, T };
  }
  return fin;
}

// ---------------------------------------------------------------
// 6 条边界方程, 12 槽格式 [L5,L4,L3,L2,L1,D,U1,U2,U3,U4,U5,RHS]
// 返回 slots[e] = 12 槽数组 (归一化, 对角=1), 以及 prev/next/own 映射
// ---------------------------------------------------------------
function boundaryEquations(ca, rb, fin, Nrow) {
  const eqs = [];
  for (let j = 0; j < Nrow; j++) {
    if (j >= 3 && j < Nrow - 3) continue;
    const own = new Array(6).fill(0), prev = new Array(3).fill(0), next = new Array(3).fill(0);
    let rhs = rb[j];
    for (let k = -3; k <= 3; k++) {
      const c = j + k, a = ca[j][k + 3];
      if (a === 0) continue;
      if (c >= 3 && c < Nrow - 3) {               // 内点代入
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
    if (diag === 0) throw new Error('zero diagonal');
    const norm = 1 / diag;
    eqs.push({ j, own: own.map(v => v * norm), prev: prev.map(v => v * norm),
               next: next.map(v => v * norm), rhs: rhs * norm });
  }
  return eqs;
}

// 12 槽: 把 own/prev/next 映射到 [L5..L1,D,U1..U5,RHS] (相对对角列偏移)
function toSlots(eq, Nrow) {
  const m = 3, j = eq.j;
  const diagCol = (j < 3) ? j : 3 + (j - (Nrow - 3));
  const slots = new Array(12).fill(0);
  const add = (col, v) => { const off = col - diagCol; const idx = off + 5; slots[idx] += v; };  // off in [-5,5] -> idx 0..10, RHS=11
  for (let i = 0; i < 3; i++) add(i, eq.own[i]);
  for (let i = 0; i < 3; i++) add(3 + i, eq.own[3 + i]);
  for (let i = 0; i < 3; i++) add(-3 + i, eq.prev[i]);
  for (let i = 0; i < 3; i++) add(6 + i, eq.next[i]);
  slots[11] = eq.rhs;
  return slots;
}

// ---------------------------------------------------------------
// 组装 + 求解 + 重建
// ---------------------------------------------------------------
function distributedSolve(P, Nrow, slices) {
  const m = 3, n = 6 * P;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const rhs = new Array(n).fill(0);
  const reds = slices.map(s => { const fw = forwardSweep(s.ca, s.rb, Nrow);
                                 const fn = backwardSweep(fw, Nrow);
                                 return { fw, fn, eqs: boundaryEquations(s.ca, s.rb, fn, Nrow) }; });
  for (let r = 0; r < P; r++) {
    for (let e = 0; e < 6; e++) {
      const row = r * 6 + e, eq = reds[r].eqs[e];
      for (let i = 0; i < 6; i++) A[row][r * 6 + i] += eq.own[i];
      if (r > 0) for (let i = 0; i < 3; i++) A[row][(r - 1) * 6 + 3 + i] += eq.prev[i];
      if (r < P - 1) for (let i = 0; i < 3; i++) A[row][(r + 1) * 6 + i] += eq.next[i];
      rhs[row] = eq.rhs;
    }
  }
  const sol6 = solve(A, rhs, n);
  const sol = new Array(P * Nrow).fill(0);
  for (let r = 0; r < P; r++) {
    const base = r * Nrow;
    for (let i = 0; i < 3; i++) sol[base + i] = sol6[r * 6 + i];
    for (let i = 0; i < 3; i++) sol[base + Nrow - 3 + i] = sol6[r * 6 + 3 + i];
    for (let p = 3; p < Nrow - 3; p++) {
      const f = reds[r].fn[p];
      let x = f.T;
      for (let k = 0; k < 3; k++) x += f.P[k] * sol6[r * 6 + k];
      for (let r2 = 0; r2 < 3; r2++) x += f.R[r2] * sol6[r * 6 + 3 + r2];
      sol[base + p] = x;
    }
  }
  return { sol, reds };
}

// ---------------------------------------------------------------
// 主验证
// ---------------------------------------------------------------
function main() {
  const PList = [1, 2, 3];
  const NrowList = [8, 10, 14, 18];
  const seeds = [11, 29, 57];
  let nCfg = 0, worstErr = 0, worstCfg = '';
  const slotStats = {};   // 每个方程位的恒零/非零槽

  for (const P of PList) for (const Nrow of NrowList) for (const seed of seeds) {
    const { xt, slices, L } = build(P, Nrow, seed);
    const { sol, reds } = distributedSolve(P, Nrow, slices);
    let err = 0;
    for (let i = 0; i < L; i++) err = Math.max(err, Math.abs(sol[i] - xt[i]));
    nCfg++;
    if (err > worstErr) { worstErr = err; worstCfg = `P=${P} Nrow=${Nrow} seed=${seed}`; }
    // 槽位统计
    for (let r = 0; r < P; r++) for (let e = 0; e < 6; e++) {
      const sl = toSlots(reds[r].eqs[e], Nrow);
      if (!slotStats[e]) slotStats[e] = { ever: new Set(), zero: new Set() };
      for (let s = 0; s < 11; s++) {
        if (Math.abs(sl[s]) > 1e-12) slotStats[e].ever.add(s);
        else slotStats[e].zero.add(s);
      }
    }
  }

  console.log(`七对角 (m=3) 求解器: ${nCfg} 配置, 最差误差 ${worstErr.toExponential(3)}  @ ${worstCfg}`);
  if (worstErr < 1e-10) console.log('解正确性: 通过 (机器精度)');
  else { console.log('失败'); process.exit(1); }

  console.log('\n12 槽格式 [L5,L4,L3,L2,L1,D,U1,U2,U3,U4,U5,RHS] 的结构 (每方程位的恒零槽):');
  for (let e = 0; e < 6; e++) {
    const zeros = [...slotStats[e].zero].sort((a, b) => a - b);
    const names = zeros.map(s => ['L5','L4','L3','L2','L1','D','U1','U2','U3','U4','U5'][s]);
    console.log(`  方程位 ${e} (${e < 3 ? 'top' : 'bot'}): 恒零槽 = [${names.join(', ')}]`);
  }
}
main();
