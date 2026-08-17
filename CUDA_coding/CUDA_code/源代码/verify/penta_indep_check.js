#!/usr/bin/env node
'use strict';
/*
 * penta_indep_check.js — 五对角求解器的独立验证
 * =============================================
 * 目的: 排除 AI 幻觉。用与求解器无关的独立实现交叉验证:
 *
 *   (1) 全局矩阵稠密直解: 独立构造全局 5 对角矩阵 (exact1 与随机制造解),
 *       用独立稠密 LU (部分选主元) 求解, 与**忠实复刻 Fortran 的 28 槽
 *       分布式求解器**输出逐点对比。
 *   (2) 残差检查: ||A x̂ - b||/||b||, 应 ~ n·ε。
 *   (3) 制造解: RHS = M·x_true (x_true 事先已知), 求解器应复现 x_true。
 *
 * 注: 嵌入的求解器是 PaScaL_TDMA_cuda_penta.f90 的 Node 忠实复刻
 *   (tdma_modified_penta + 28 槽 pack/unpack + tdma_banded_cuda + update)。
 */

// ---------- 独立稠密 LU (部分选主元) ----------
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

// ---------- 独立构造全局 5 对角矩阵 ----------
function globalMatrix(P, Nrow, mode, seed) {
  const L = P * Nrow;
  let rng = null;
  if (mode === 'random') rng = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const A = [], b = [], xTrue = [];
  for (let g = 0; g < L; g++) {
    const row = new Array(L).fill(0);
    let offsum = 0;
    if (mode === 'exact1') {
      for (let k = -2; k <= 2; k++) if (g + k >= 0 && g + k < L) row[g + k] = (k === 0) ? -4 : 1;
      xTrue.push(1);
    } else {
      for (let k = -2; k <= 2; k++) {
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
  for (let g = 0; g < L; g++) { let s = 0; for (let c = 0; c < L; c++) s += A[g][c] * xTrue[c]; b.push(s); }
  return { A, b, xTrue, L };
}

// ---------- Fortran 忠实复刻的五对角分布式求解器 (28 槽通信路径) ----------
// 以下函数与 PaScaL_TDMA_cuda_penta.f90 的核一一对应:
//   tdma_modified_penta, pascalpack/pascalunpack_penta, tdma_banded_cuda, pascal_update_penta
function mk2d(n, m) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = new Float64Array(m); return a; }
function para(nsta, nend, nprocs, myrank) {
  const n = nend - nsta + 1, iw1 = Math.floor(n / nprocs), iw2 = n % nprocs;
  let ia = myrank * iw1 + nsta + Math.min(myrank, iw2), ib = ia + iw1 - 1;
  if (iw2 > myrank) ib = ib + 1;
  return [ia, ib];
}

// S1: 本地改进消元 (写 8 槽 rd32; 与 Fortran tdma_modified_penta 逐行对应)
function tdma_modified_penta(A, B, C, D, E, RHS, rd32, nsys, nrow) {
  for (let i = 0; i < nsys; i++) {
    let den = C[i][2];
    let p1 = -A[i][2] / den, q1 = -B[i][2] / den, r1 = -D[i][2] / den, s1 = -E[i][2] / den, t1 = RHS[i][2] / den;
    A[i][2] = p1; B[i][2] = q1; D[i][2] = r1; E[i][2] = s1; RHS[i][2] = t1;
    let p0 = 0, q0 = 0, r0 = 0, s0 = 0, t0 = 0;
    if (nrow >= 6) {
      den = C[i][3] + B[i][3] * r1;
      p0 = -B[i][3] * p1 / den; q0 = -(A[i][3] + B[i][3] * q1) / den;
      r0 = -(D[i][3] + B[i][3] * s1) / den; s0 = -E[i][3] / den;
      t0 = (RHS[i][3] - B[i][3] * t1) / den;
      A[i][3] = p0; B[i][3] = q0; D[i][3] = r0; E[i][3] = s0; RHS[i][3] = t0;
    }
    if (nrow > 6) {
      let p2 = p1, q2 = q1, r2 = r1, s2 = s1, t2 = t1, p1b = p0, q1b = q0, r1b = r0, s1b = s0, t1b = t0;
      for (let j = 4; j <= nrow - 3; j++) {
        const aj = A[i][j], bj = B[i][j], cj = C[i][j], dj = D[i][j], ej = E[i][j], tt = RHS[i][j];
        den = cj + aj * (r2 * r1b + s2) + bj * r1b;
        p0 = -(aj * (p2 + r2 * p1b) + bj * p1b) / den;
        q0 = -(aj * (q2 + r2 * q1b) + bj * q1b) / den;
        r0 = -(aj * r2 * s1b + bj * s1b + dj) / den;
        s0 = -ej / den;
        t0 = (tt - aj * (t2 + r2 * t1b) - bj * t1b) / den;
        A[i][j] = p0; B[i][j] = q0; D[i][j] = r0; E[i][j] = s0; RHS[i][j] = t0;
        p2 = p1b; q2 = q1b; r2 = r1b; s2 = s1b; t2 = t1b;
        p1b = p0; q1b = q0; r1b = r0; s1b = s0; t1b = t0;
      }
    }
    if (nrow >= 5) {
      let u1 = A[i][nrow - 3], v1 = B[i][nrow - 3], w1 = D[i][nrow - 3], x1 = E[i][nrow - 3], y1 = RHS[i][nrow - 3];
      let u2 = 0, v2 = 0, w2 = 1, x2 = 0, y2 = 0;
      for (let j = nrow - 4; j >= 2; j--) {
        const pj = A[i][j], qj = B[i][j], rj = D[i][j], sj = E[i][j], tj = RHS[i][j];
        const u0 = pj + rj * u1 + sj * u2, v0 = qj + rj * v1 + sj * v2, w0 = rj * w1 + sj * w2;
        const x0 = rj * x1 + sj * x2, y0 = tj + rj * y1 + sj * y2;
        A[i][j] = u0; B[i][j] = v0; D[i][j] = w0; E[i][j] = x0; RHS[i][j] = y0;
        u2 = u1; v2 = v1; w2 = w1; x2 = x1; y2 = y1; u1 = u0; v1 = v0; w1 = w0; x1 = x0; y1 = y0;
      }
    }
    // 4 条边界方程 -> rd32 (8 槽)
    let l3 = 0, l2 = A[i][0], l1 = B[i][0], up1 = D[i][0], up2 = 0, up3 = 0;
    let rr = RHS[i][0], diag = C[i][0];
    if (nrow >= 5) { diag += E[i][0] * A[i][2]; up1 += E[i][0] * B[i][2]; up2 += E[i][0] * D[i][2]; up3 += E[i][0] * E[i][2]; rr -= E[i][0] * RHS[i][2]; }
    rd32[i][0] = l3 / diag; rd32[i][1] = l2 / diag; rd32[i][2] = l1 / diag; rd32[i][3] = 1;
    rd32[i][4] = up1 / diag; rd32[i][5] = up2 / diag; rd32[i][6] = up3 / diag; rd32[i][7] = rr / diag;
    l3 = 0; l2 = A[i][1]; l1 = B[i][1]; up1 = 0; up2 = 0; up3 = 0; rr = RHS[i][1]; diag = C[i][1];
    if (nrow >= 5) { l1 += D[i][1] * A[i][2]; diag += D[i][1] * B[i][2]; up1 += D[i][1] * D[i][2]; up2 += D[i][1] * E[i][2]; rr -= D[i][1] * RHS[i][2]; }
    if (nrow >= 6) { l1 += E[i][1] * A[i][3]; diag += E[i][1] * B[i][3]; up1 += E[i][1] * D[i][3]; up2 += E[i][1] * E[i][3]; rr -= E[i][1] * RHS[i][3]; }
    else { up1 += E[i][1]; }
    rd32[i][8] = 0; rd32[i][9] = l2 / diag; rd32[i][10] = l1 / diag; rd32[i][11] = 1;
    rd32[i][12] = up1 / diag; rd32[i][13] = up2 / diag; rd32[i][14] = 0; rd32[i][15] = rr / diag;
    l3 = 0; l2 = 0; l1 = 0; up1 = D[i][nrow - 2]; up2 = E[i][nrow - 2]; up3 = 0; rr = RHS[i][nrow - 2]; diag = C[i][nrow - 2];
    if (nrow >= 6) { l2 += A[i][nrow - 2] * A[i][nrow - 4]; l1 += A[i][nrow - 2] * B[i][nrow - 4]; diag += A[i][nrow - 2] * D[i][nrow - 4]; up1 += A[i][nrow - 2] * E[i][nrow - 4]; rr -= A[i][nrow - 2] * RHS[i][nrow - 4]; }
    else { l1 += A[i][nrow - 2]; }
    if (nrow >= 5) { l2 += B[i][nrow - 2] * A[i][nrow - 3]; l1 += B[i][nrow - 2] * B[i][nrow - 3]; diag += B[i][nrow - 2] * D[i][nrow - 3]; up1 += B[i][nrow - 2] * E[i][nrow - 3]; rr -= B[i][nrow - 2] * RHS[i][nrow - 3]; }
    rd32[i][16] = 0; rd32[i][17] = l2 / diag; rd32[i][18] = l1 / diag; rd32[i][19] = 1;
    rd32[i][20] = up1 / diag; rd32[i][21] = up2 / diag; rd32[i][22] = 0; rd32[i][23] = rr / diag;
    l3 = 0; l2 = 0; l1 = 0; up1 = D[i][nrow - 1]; up2 = E[i][nrow - 1]; up3 = 0; rr = RHS[i][nrow - 1]; diag = C[i][nrow - 1];
    if (nrow >= 5) { l3 += A[i][nrow - 1] * A[i][nrow - 3]; l2 += A[i][nrow - 1] * B[i][nrow - 3]; l1 += A[i][nrow - 1] * D[i][nrow - 3]; diag += A[i][nrow - 1] * E[i][nrow - 3]; rr -= A[i][nrow - 1] * RHS[i][nrow - 3]; }
    l1 += B[i][nrow - 1];
    rd32[i][24] = l3 / diag; rd32[i][25] = l2 / diag; rd32[i][26] = l1 / diag; rd32[i][27] = 1;
    rd32[i][28] = up1 / diag; rd32[i][29] = up2 / diag; rd32[i][30] = 0; rd32[i][31] = rr / diag;
  }
}
function rd28from32(rd32) {
  const r = mk2d(rd32.length, 28);
  for (let i = 0; i < rd32.length; i++) for (let eq = 0; eq < 4; eq++) {
    const o8 = eq * 8, o7 = eq * 7;
    for (let s = 0; s < 3; s++) r[i][o7 + s] = rd32[i][o8 + s];
    for (let s = 3; s < 7; s++) r[i][o7 + s] = rd32[i][o8 + s + 1];
  }
  return r;
}
function tdma_banded_cuda(rd, sol, nsys, nrd) {
  for (let i = 0; i < nsys; i++) {
    for (let k = 0; k <= nrd - 2; k++) {
      const piv = rd[i][8 * k + 3];
      for (let m2 = k + 1; m2 <= Math.min(k + 3, nrd - 1); m2++) {
        const off = m2 - k, mult = rd[i][8 * m2 + (3 - off)] / piv;
        rd[i][8 * m2 + (3 - off)] = mult;
        for (let j = k + 1; j <= Math.min(k + 3, m2 + 3); j++) rd[i][8 * m2 + (j - m2 + 3)] -= mult * rd[i][8 * k + (j - k + 3)];
        rd[i][8 * m2 + 7] -= mult * rd[i][8 * k + 7];
      }
    }
    for (let m2 = nrd - 1; m2 >= 0; m2--) {
      let tt = rd[i][8 * m2 + 7];
      for (let j = m2 + 1; j <= Math.min(m2 + 3, nrd - 1); j++) tt -= rd[i][8 * m2 + (j - m2 + 3)] * sol[i][j];
      sol[i][m2] = tt / rd[i][8 * m2 + 3];
    }
  }
}
function pascal_update_penta(A, B, C, D, E, RHS, d_rd, nsys, nrow) {
  for (let i = 0; i < nsys; i++) {
    const x0 = d_rd[i][0], x1 = d_rd[i][1], xn2 = d_rd[i][2], xn1 = d_rd[i][3];
    RHS[i][0] = x0; RHS[i][1] = x1; RHS[i][nrow - 2] = xn2; RHS[i][nrow - 1] = xn1;
    for (let j = 2; j <= nrow - 3; j++) RHS[i][j] += A[i][j] * x0 + B[i][j] * x1 + D[i][j] * xn2 + E[i][j] * xn1;
  }
}

// 分布式求解 (28 槽通信路径, 与 Fortran pascal_solver 对应)
function distributedSolve(P, Nrow, slices) {
  const nsys = slices[0].A.length;
  const starts = [], lines = [];
  for (let r = 0; r < P; r++) { const [ia, ib] = para(0, nsys - 1, P, r); starts.push(ia); lines.push(ib - ia + 1); }
  const rds = [];
  for (let r = 0; r < P; r++) {
    const rd32 = mk2d(nsys, 32);
    const { A, B, C, D, E, RHS } = slices[r];
    tdma_modified_penta(A, B, C, D, E, RHS, rd32, nsys, Nrow);
    rds.push(rd28from32(rd32));
  }
  const Atrs = [];
  for (let r = 0; r < P; r++) {
    const tmpN = lines[r], Atr = mk2d(tmpN, 32 * P);
    for (let i = 0; i < P; i++) {
      const buf = new Float64Array(tmpN * 28);
      for (let j = 0; j < 28; j++) for (let l = 0; l < tmpN; l++) buf[l + j * tmpN] = rds[i][starts[r] + l][j];
      for (let j = 0; j < 28; j++) for (let l = 0; l < tmpN; l++) {
        const eq = Math.floor(j / 7), slot7 = j - eq * 7, slot8 = slot7 < 3 ? slot7 : slot7 + 1;
        Atr[l][32 * i + eq * 8 + slot8] = buf[l + j * tmpN];
        Atr[l][32 * i + eq * 8 + 3] = 1.0;
      }
    }
    Atrs.push(Atr);
  }
  const Dtrs = [];
  for (let r = 0; r < P; r++) { const Dtr = mk2d(lines[r], 4 * P); tdma_banded_cuda(Atrs[r], Dtr, lines[r], 4 * P); Dtrs.push(Dtr); }
  const sols = [];
  for (let r = 0; r < P; r++) {
    const Drd = mk2d(nsys, 4);
    for (let me = 0; me < P; me++) { const tmpM = lines[me]; for (let l = 0; l < tmpM; l++) for (let c = 0; c < 4; c++) Drd[starts[me] + l][c] = Dtrs[me][l][4 * r + c]; }
    const s = slices[r];
    pascal_update_penta(s.A, s.B, s.C, s.D, s.E, s.RHS, Drd, nsys, Nrow);
    sols.push(s.RHS);
  }
  // 拼接: 各线相同, 取线 0; 每 rank 的线 0 解覆盖全局行 [r*Nrow, r*Nrow+Nrow)
  const full = new Array(P * Nrow);
  for (let r = 0; r < P; r++) for (let k = 0; k < Nrow; k++) full[r * Nrow + k] = sols[r][0][k];
  return full;
}

// 构造切片: nsys = P 条线, 每条线均为同一全局五对角系统 (按 rank 切片)
// 与 Fortran 输入一致: 每 rank 持有全部 nsys 线的 z 切片数据
function sliceSystem(A, b, P, Nrow) {
  const nsys = P;   // 每 rank 恰好 1 条线 (para 分区非退化)
  const slices = [];
  for (let r = 0; r < P; r++) {
    const AA = mk2d(nsys, Nrow), BB = mk2d(nsys, Nrow), CC = mk2d(nsys, Nrow);
    const DD = mk2d(nsys, Nrow), EE = mk2d(nsys, Nrow), RHS = mk2d(nsys, Nrow);
    for (let l = 0; l < nsys; l++) {
      for (let j = 0; j < Nrow; j++) {
        const g = r * Nrow + j;
        // 系数: A 槽存 x_{g-2}, B 存 x_{g-1}, C 存 x_g, D 存 x_{g+1}, E 存 x_{g+2}
        AA[l][j] = (g - 2 >= 0) ? A[g][g - 2] : 0;
        BB[l][j] = (g - 1 >= 0) ? A[g][g - 1] : 0;
        CC[l][j] = A[g][g];
        DD[l][j] = (g + 1 < P * Nrow) ? A[g][g + 1] : 0;
        EE[l][j] = (g + 2 < P * Nrow) ? A[g][g + 2] : 0;
        RHS[l][j] = b[g];
      }
    }
    slices.push({ A: AA, B: BB, C: CC, D: DD, E: EE, RHS });
  }
  return slices;
}

// ---------- 主验证 ----------
let fail = 0, worstDiff = 0, worstResid = 0, nCfg = 0;
for (const mode of ['exact1', 'random'])
  for (const P of [1, 2, 3])
    for (const Nrow of [5, 6, 8, 10])
      for (const seed of [11, 29, 57]) {
        const { A, b, xTrue, L } = globalMatrix(P, Nrow, mode, seed);
        const dense = luSolve(A, b);
        const slices = sliceSystem(A, b, P, Nrow);
        const sol = distributedSolve(P, Nrow, slices);
        let diff = 0, resid = 0, normB = 0;
        for (let i = 0; i < L; i++) { diff = Math.max(diff, Math.abs(sol[i] - dense[i])); normB = Math.max(normB, Math.abs(b[i])); }
        for (let g = 0; g < L; g++) { let s = 0; for (let c = 0; c < L; c++) s += A[g][c] * sol[c]; resid = Math.max(resid, Math.abs(s - b[g])); }
        nCfg++;
        if (diff > worstDiff) worstDiff = diff;
        if (resid / normB > worstResid) worstResid = resid / normB;
        if (diff > 1e-10 || resid / normB > 1e-11) { fail++; console.log('FAIL', mode, P, Nrow, seed, diff, resid / normB); }
      }

console.log(`独立验证: ${nCfg} 配置`);
console.log(`五对角解 vs 独立稠密直解  最大差: ${worstDiff.toExponential(3)}`);
console.log(`相对残差 ||Ax̂-b||/||b||  最大: ${worstResid.toExponential(3)}`);
console.log(fail === 0 ? '→ 全部通过 (机器精度, 非幻觉)' : `→ ${fail} 个配置失败`);
