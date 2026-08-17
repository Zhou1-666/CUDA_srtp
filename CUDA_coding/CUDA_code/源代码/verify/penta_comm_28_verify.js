#!/usr/bin/env node
'use strict';
/*
 * 五对角 PaScaL-TDMA 分布式求解器 —— JS 忠实复刻与 32->28 通信优化验证
 *
 * 对应 Fortran: 源代码/src/PaScaL_TDMA_cuda_penta.f90
 * 复刻内核 (逐行对应): tdma_modified_penta, pascalpack, pascalunpack,
 *   pascalunpack_penta (新增), tdma_banded_cuda, pascal_update_penta,
 *   tdma_penta_cuda (密集直解参考).
 *
 * 验证目标 (优化前提: 缩约数据的对角槽 D 恒等于 1, 丢弃后由组装核填回):
 *   (1) 28 槽路径组装的 Atr 与 32 槽路径逐元素位一致 (===)
 *   (2) 28 槽路径最终解与 32 槽路径逐元素位一致 (===)
 *   (3) 两种路径的解都与全局密集直解一致到机器精度
 *
 * 分布式方案 (每个 rank 有全部 Nsys 条线, 数据为其本地 z 切片):
 *   S1 本地改进消元 rd(Nsys, 32|28)
 *   S2 pack: 发给 rank i 的是 "rank i 拥有" 的线块 (lines_i 行)
 *   A2AV:    收回来的是 "自己拥有" 的线块 (tmp_N 行, 来自各 rank)
 *   S3 解包组装 Atr(tmp_N, 32*nprocs)  (28 路径: 对角槽 D 填 1)
 *   S4 带状 (3,3) 求解 -> Dtr(tmp_N, 4*nprocs)
 *   S5 pack Dtr 列块 [4*i,4*i+4) 发给 rank i
 *   A2AV:    收回来的是自己线的 4 个接口解 -> Drd(Nsys, 4)
 *   S6 回带重建
 */

// ---------------------------------------------------------------
// 工具
// ---------------------------------------------------------------
function mk2d(n, m) {
  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = new Float64Array(m);
  return a;
}
function clone2d(a) { return a.map(r => Float64Array.from(r)); }
function cloneSlices(s) {
  return s.map(x => ({ A: clone2d(x.A), B: clone2d(x.B), C: clone2d(x.C),
                       D: clone2d(x.D), E: clone2d(x.E), RHS: clone2d(x.RHS) }));
}
function bitEqual(a, b) {
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a[i].length; j++)
      if (a[i][j] !== b[i][j]) return false;
  return true;
}
function maxAbsDiff(a, b) {
  let m = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a[i].length; j++)
      m = Math.max(m, Math.abs(a[i][j] - b[i][j]));
  return m;
}
function para(nsta, nend, nprocs, myrank) {
  const n = nend - nsta + 1;
  const iwork1 = Math.floor(n / nprocs);
  const iwork2 = n % nprocs;
  let ia = myrank * iwork1 + nsta + Math.min(myrank, iwork2);
  let ib = ia + iwork1 - 1;
  if (iwork2 > myrank) ib = ib + 1;
  return [ia, ib];
}
function lcg(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// ---------------------------------------------------------------
// S1: 本地改进消元 (写 8 槽 rd32; 28 路径由 rd32 去对角槽得到)
// ---------------------------------------------------------------
function tdma_modified_penta(A, B, C, D, E, RHS, rd32, nsys, nrow) {
  for (let i = 0; i < nsys; i++) {
    // --- 前向扫 种子 j=2 ---
    let den = C[i][2];
    let p1 = -A[i][2] / den, q1 = -B[i][2] / den, r1 = -D[i][2] / den;
    let s1 = -E[i][2] / den, t1 = RHS[i][2] / den;
    A[i][2] = p1; B[i][2] = q1; D[i][2] = r1; E[i][2] = s1; RHS[i][2] = t1;

    // --- 前向扫 种子 j=3 (仅 nrow>=6) ---
    let p0 = 0, q0 = 0, r0 = 0, s0 = 0, t0 = 0;
    if (nrow >= 6) {
      den = C[i][3] + B[i][3] * r1;
      p0 = -B[i][3] * p1 / den;
      q0 = -(A[i][3] + B[i][3] * q1) / den;
      r0 = -(D[i][3] + B[i][3] * s1) / den;
      s0 = -E[i][3] / den;
      t0 = (RHS[i][3] - B[i][3] * t1) / den;
      A[i][3] = p0; B[i][3] = q0; D[i][3] = r0; E[i][3] = s0; RHS[i][3] = t0;
    }

    // --- 前向扫 一般公式 j=4..nrow-3 (仅 nrow>6) ---
    if (nrow > 6) {
      let p2 = p1, q2 = q1, r2 = r1, s2 = s1, t2 = t1;
      let p1b = p0, q1b = q0, r1b = r0, s1b = s0, t1b = t0;
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

    // --- 后向扫 (仅 nrow>=5) ---
    if (nrow >= 5) {
      let u1 = A[i][nrow - 3], v1 = B[i][nrow - 3], w1 = D[i][nrow - 3];
      let x1 = E[i][nrow - 3], y1 = RHS[i][nrow - 3];
      let u2 = 0, v2 = 0, w2 = 1, x2 = 0, y2 = 0;
      for (let j = nrow - 4; j >= 2; j--) {
        const pj = A[i][j], qj = B[i][j], rj = D[i][j], sj = E[i][j], tj = RHS[i][j];
        const u0 = pj + rj * u1 + sj * u2;
        const v0 = qj + rj * v1 + sj * v2;
        const w0 = rj * w1 + sj * w2;
        const x0 = rj * x1 + sj * x2;
        const y0 = tj + rj * y1 + sj * y2;
        A[i][j] = u0; B[i][j] = v0; D[i][j] = w0; E[i][j] = x0; RHS[i][j] = y0;
        u2 = u1; v2 = v1; w2 = w1; x2 = x1; y2 = y1;
        u1 = u0; v1 = v0; w1 = w0; x1 = x0; y1 = y0;
      }
    }

    // --- 4 条边界方程 -> rd32 (8 槽/方程, 对角槽=1) ---
    // rd0 (行0)
    let l3 = 0, l2 = A[i][0], l1 = B[i][0], up1 = D[i][0], up2 = 0, up3 = 0;
    let rr = RHS[i][0], diag = C[i][0];
    if (nrow >= 5) {
      diag = diag + E[i][0] * A[i][2];
      up1 = up1 + E[i][0] * B[i][2];
      up2 = up2 + E[i][0] * D[i][2];
      up3 = up3 + E[i][0] * E[i][2];
      rr = rr - E[i][0] * RHS[i][2];
    }
    rd32[i][0] = l3 / diag; rd32[i][1] = l2 / diag; rd32[i][2] = l1 / diag;
    rd32[i][3] = 1.0;
    rd32[i][4] = up1 / diag; rd32[i][5] = up2 / diag; rd32[i][6] = up3 / diag; rd32[i][7] = rr / diag;

    // rd1 (行1)
    l3 = 0; l2 = A[i][1]; l1 = B[i][1]; up1 = 0; up2 = 0; up3 = 0;
    rr = RHS[i][1]; diag = C[i][1];
    if (nrow >= 5) {
      l1 = l1 + D[i][1] * A[i][2];
      diag = diag + D[i][1] * B[i][2];
      up1 = up1 + D[i][1] * D[i][2];
      up2 = up2 + D[i][1] * E[i][2];
      rr = rr - D[i][1] * RHS[i][2];
    }
    if (nrow >= 6) {
      l1 = l1 + E[i][1] * A[i][3];
      diag = diag + E[i][1] * B[i][3];
      up1 = up1 + E[i][1] * D[i][3];
      up2 = up2 + E[i][1] * E[i][3];
      rr = rr - E[i][1] * RHS[i][3];
    } else {
      up1 = up1 + E[i][1];
    }
    rd32[i][8] = 0; rd32[i][9] = l2 / diag; rd32[i][10] = l1 / diag;
    rd32[i][11] = 1.0;
    rd32[i][12] = up1 / diag; rd32[i][13] = up2 / diag; rd32[i][14] = 0; rd32[i][15] = rr / diag;

    // rd2 (行 nrow-2)
    l3 = 0; l2 = 0; l1 = 0; up1 = D[i][nrow - 2]; up2 = E[i][nrow - 2]; up3 = 0;
    rr = RHS[i][nrow - 2]; diag = C[i][nrow - 2];
    if (nrow >= 6) {
      l2 = l2 + A[i][nrow - 2] * A[i][nrow - 4];
      l1 = l1 + A[i][nrow - 2] * B[i][nrow - 4];
      diag = diag + A[i][nrow - 2] * D[i][nrow - 4];
      up1 = up1 + A[i][nrow - 2] * E[i][nrow - 4];
      rr = rr - A[i][nrow - 2] * RHS[i][nrow - 4];
    } else {
      l1 = l1 + A[i][nrow - 2];
    }
    if (nrow >= 5) {
      l2 = l2 + B[i][nrow - 2] * A[i][nrow - 3];
      l1 = l1 + B[i][nrow - 2] * B[i][nrow - 3];
      diag = diag + B[i][nrow - 2] * D[i][nrow - 3];
      up1 = up1 + B[i][nrow - 2] * E[i][nrow - 3];
      rr = rr - B[i][nrow - 2] * RHS[i][nrow - 3];
    }
    rd32[i][16] = 0; rd32[i][17] = l2 / diag; rd32[i][18] = l1 / diag;
    rd32[i][19] = 1.0;
    rd32[i][20] = up1 / diag; rd32[i][21] = up2 / diag; rd32[i][22] = 0; rd32[i][23] = rr / diag;

    // rd3 (行 nrow-1)
    l3 = 0; l2 = 0; l1 = 0; up1 = D[i][nrow - 1]; up2 = E[i][nrow - 1]; up3 = 0;
    rr = RHS[i][nrow - 1]; diag = C[i][nrow - 1];
    if (nrow >= 5) {
      l3 = l3 + A[i][nrow - 1] * A[i][nrow - 3];
      l2 = l2 + A[i][nrow - 1] * B[i][nrow - 3];
      l1 = l1 + A[i][nrow - 1] * D[i][nrow - 3];
      diag = diag + A[i][nrow - 1] * E[i][nrow - 3];
      rr = rr - A[i][nrow - 1] * RHS[i][nrow - 3];
    }
    l1 = l1 + B[i][nrow - 1];
    rd32[i][24] = l3 / diag; rd32[i][25] = l2 / diag; rd32[i][26] = l1 / diag;
    rd32[i][27] = 1.0;
    rd32[i][28] = up1 / diag; rd32[i][29] = up2 / diag; rd32[i][30] = 0; rd32[i][31] = rr / diag;
  }
}

// 28 槽布局: [L3,L2,L1,U1,U2,U3,RHS] (去对角槽), 每方程 7 槽
function rd28from32(rd32) {
  const r = mk2d(rd32.length, 28);
  for (let i = 0; i < rd32.length; i++) {
    for (let eq = 0; eq < 4; eq++) {
      const o8 = eq * 8, o7 = eq * 7;
      r[i][o7 + 0] = rd32[i][o8 + 0]; // L3
      r[i][o7 + 1] = rd32[i][o8 + 1]; // L2
      r[i][o7 + 2] = rd32[i][o8 + 2]; // L1
      r[i][o7 + 3] = rd32[i][o8 + 4]; // U1
      r[i][o7 + 4] = rd32[i][o8 + 5]; // U2
      r[i][o7 + 5] = rd32[i][o8 + 6]; // U3
      r[i][o7 + 6] = rd32[i][o8 + 7]; // RHS
    }
  }
  return r;
}

// ---------------------------------------------------------------
// S2 pack / S3 unpack (pascalpack / pascalunpack / pascalunpack_penta)
//   buf 块: nLines 行 x packSize 列, 列主序 (行步长 nLines)
// ---------------------------------------------------------------
function packSub(rd, startRow, nLines, packSize) {
  const buf = new Float64Array(nLines * packSize);
  for (let j = 0; j < packSize; j++)
    for (let l = 0; l < nLines; l++)
      buf[l + j * nLines] = rd[startRow + l][j];
  return buf;
}
// 8 槽解包 (32 路径)
function unpack8(Atr, colOff, buf, nLines, packSize) {
  for (let j = 0; j < packSize; j++)
    for (let l = 0; l < nLines; l++)
      Atr[l][colOff + j] = buf[l + j * nLines];
}
// 7->8 槽解包 (28 路径, pascalunpack_penta): 对角槽 D 填 1
function unpackPenta(Atr, colOff, buf, nLines) {
  for (let j = 0; j < 28; j++)
    for (let l = 0; l < nLines; l++) {
      const eq = Math.floor(j / 7), slot7 = j - eq * 7;
      const slot8 = slot7 < 3 ? slot7 : slot7 + 1;
      Atr[l][colOff + eq * 8 + slot8] = buf[l + j * nLines];
      Atr[l][colOff + eq * 8 + 3] = 1.0;
    }
}

// ---------------------------------------------------------------
// S4: 带状 (3,3) 缩约求解 (8 槽 Atr)
// ---------------------------------------------------------------
function tdma_banded_cuda(rd, sol, nsys, nrd) {
  for (let i = 0; i < nsys; i++) {
    for (let k = 0; k <= nrd - 2; k++) {
      const piv = rd[i][8 * k + 3];
      for (let m = k + 1; m <= Math.min(k + 3, nrd - 1); m++) {
        const off = m - k;
        const mult = rd[i][8 * m + (3 - off)] / piv;
        rd[i][8 * m + (3 - off)] = mult;
        for (let j = k + 1; j <= Math.min(k + 3, m + 3); j++)
          rd[i][8 * m + (j - m + 3)] = rd[i][8 * m + (j - m + 3)] - mult * rd[i][8 * k + (j - k + 3)];
        rd[i][8 * m + 7] = rd[i][8 * m + 7] - mult * rd[i][8 * k + 7];
      }
    }
    for (let m = nrd - 1; m >= 0; m--) {
      let tt = rd[i][8 * m + 7];
      for (let j = m + 1; j <= Math.min(m + 3, nrd - 1); j++)
        tt = tt - rd[i][8 * m + (j - m + 3)] * sol[i][j];
      sol[i][m] = tt / rd[i][8 * m + 3];
    }
  }
}

// ---------------------------------------------------------------
// S6: 回带重建
// ---------------------------------------------------------------
function pascal_update_penta(A, B, C, D, E, RHS, d_rd, nsys, nrow) {
  for (let i = 0; i < nsys; i++) {
    const x0 = d_rd[i][0], x1 = d_rd[i][1], xn2 = d_rd[i][2], xn1 = d_rd[i][3];
    RHS[i][0] = x0; RHS[i][1] = x1; RHS[i][nrow - 2] = xn2; RHS[i][nrow - 1] = xn1;
    for (let j = 2; j <= nrow - 3; j++)
      RHS[i][j] = RHS[i][j] + A[i][j] * x0 + B[i][j] * x1 + D[i][j] * xn2 + E[i][j] * xn1;
  }
}

// ---------------------------------------------------------------
// 单进程五对角直接求解 (tdma_penta_cuda) —— 密集直解参考
// ---------------------------------------------------------------
function tdma_penta_cuda(A, B, C, D, E, RHS, nsys, nrow) {
  for (let i = 0; i < nsys; i++) {
    for (let k = 0; k <= nrow - 2; k++) {
      const piv = C[i][k];
      let mult = B[i][k + 1] / piv;
      B[i][k + 1] = mult;
      C[i][k + 1] = C[i][k + 1] - mult * D[i][k];
      D[i][k + 1] = D[i][k + 1] - mult * E[i][k];
      RHS[i][k + 1] = RHS[i][k + 1] - mult * RHS[i][k];
      if (k <= nrow - 3) {
        mult = A[i][k + 2] / piv;
        A[i][k + 2] = mult;
        B[i][k + 2] = B[i][k + 2] - mult * D[i][k];
        C[i][k + 2] = C[i][k + 2] - mult * E[i][k];
        RHS[i][k + 2] = RHS[i][k + 2] - mult * RHS[i][k];
      }
    }
    for (let k = nrow - 1; k >= 0; k--) {
      let tt = RHS[i][k];
      if (k + 1 < nrow) tt = tt - D[i][k] * RHS[i][k + 1];
      if (k + 2 < nrow) tt = tt - E[i][k] * RHS[i][k + 2];
      RHS[i][k] = tt / C[i][k];
    }
  }
}

// ---------------------------------------------------------------
// 分布式求解 (JS 模拟 MPI alltoallv)
//   slices: 每 rank {A,B,C,D,E,RHS} 均为 [Nsys][Nrow]
//   use28 : true=28 槽通信路径, false=32 槽
// 返回 { Atrs: 每 rank 的 Atr, sols: 每 rank 的解 (RHS 原位) }
// ---------------------------------------------------------------
function distributedSolve(P, Nrow, Nsys, slices, use28) {
  const starts = [], lines = [];
  for (let r = 0; r < P; r++) {
    const [ia, ib] = para(0, Nsys - 1, P, r);
    starts.push(ia); lines.push(ib - ia + 1);
  }

  // S1: 每 rank 对全部线做本地消元, 写 8 槽 rd32 (28 路径再派生 28 槽)
  const rds = [];
  for (let r = 0; r < P; r++) {
    const rd32 = mk2d(Nsys, 32);
    const { A, B, C, D, E, RHS } = slices[r];
    tdma_modified_penta(A, B, C, D, E, RHS, rd32, Nsys, Nrow);
    rds.push(use28 ? rd28from32(rd32) : rd32);
  }

  // S2+S3: 组装每 rank 的 Atr (tmp_N x 32*nprocs)
  const Atrs = [];
  for (let r = 0; r < P; r++) {
    const tmpN = lines[r];
    const Atr = mk2d(tmpN, 32 * P);
    for (let i = 0; i < P; i++) {
      const packSize = use28 ? 28 : 32;
      const buf = packSub(rds[i], starts[r], tmpN, packSize);
      if (use28) unpackPenta(Atr, 32 * i, buf, tmpN);
      else       unpack8(Atr, 32 * i, buf, tmpN, 32);
    }
    Atrs.push(Atr);
  }

  // S4: 带状求解
  const Dtrs = [];
  for (let r = 0; r < P; r++) {
    const Dtr = mk2d(lines[r], 4 * P);
    tdma_banded_cuda(Atrs[r], Dtr, lines[r], 4 * P);
    Dtrs.push(Dtr);
  }

  // S5+S6: 接口解回传 + 回带
  const sols = [];
  for (let r = 0; r < P; r++) {
    const Drd = mk2d(Nsys, 4);
    for (let me = 0; me < P; me++) {
      const tmpM = lines[me];
      for (let l = 0; l < tmpM; l++)
        for (let c = 0; c < 4; c++)
          Drd[starts[me] + l][c] = Dtrs[me][l][4 * r + c];
    }
    const s = slices[r];
    pascal_update_penta(s.A, s.B, s.C, s.D, s.E, s.RHS, Drd, Nsys, Nrow);
    sols.push(s.RHS);
  }
  return { Atrs, sols };
}

// ---------------------------------------------------------------
// 测试数据生成
//   L = P*Nrow 全局线长; 每 rank 是连续 Nrow 长的切片
//   mode: 'exact1' | 'dominant' | 'near'
// ---------------------------------------------------------------
function buildGlobalAndSlices(P, Nrow, Nsys, mode, rng) {
  const L = P * Nrow;
  const ga = mk2d(Nsys, L), gb = mk2d(Nsys, L), gc = mk2d(Nsys, L);
  const gd = mk2d(Nsys, L), ge = mk2d(Nsys, L), grhs = mk2d(Nsys, L);
  const gx = mk2d(Nsys, L);   // 精确解 (随机模式)

  for (let i = 0; i < Nsys; i++) {
    for (let j = 0; j < L; j++) {
      if (mode === 'exact1') {
        ga[i][j] = 1; gb[i][j] = 1; gc[i][j] = -4; gd[i][j] = 1; ge[i][j] = 1;
        grhs[i][j] = 0;
      } else {
        const margin = mode === 'dominant' ? 2.0 : 1.05;
        const a = 0.1 + rng(), b = 0.1 + rng(), d = 0.1 + rng(), e = 0.1 + rng();
        ga[i][j] = a; gb[i][j] = b; gd[i][j] = d; ge[i][j] = e;
        gc[i][j] = -(a + b + d + e) * margin;
        gx[i][j] = rng() * 2 - 1;
      }
    }
  }
  // RHS = M x (全局截断边界: 越界 x 视为 0)
  for (let i = 0; i < Nsys; i++) {
    for (let j = 0; j < L; j++) {
      let s = gc[i][j] * (mode === 'exact1' ? 1 : gx[i][j]);
      if (j >= 2)     s += ga[i][j] * (mode === 'exact1' ? 1 : gx[i][j - 2]);
      if (j >= 1)     s += gb[i][j] * (mode === 'exact1' ? 1 : gx[i][j - 1]);
      if (j < L - 1)  s += gd[i][j] * (mode === 'exact1' ? 1 : gx[i][j + 1]);
      if (j < L - 2)  s += ge[i][j] * (mode === 'exact1' ? 1 : gx[i][j + 2]);
      grhs[i][j] = s;
    }
  }
  // exact1: 物理边界 RHS 补偿 (与 Fortran 示例一致)
  if (mode === 'exact1') {
    // 首两行: 忽略 x_{-2},x_{-1} (1+1) -> -4+1+1 = -2 / -1
    for (let i = 0; i < Nsys; i++) { grhs[i][0] = -2; grhs[i][1] = -1; }
    // 末两行: 忽略 x_N,x_{N+1} -> -4+1+1 = -2 / -1
    for (let i = 0; i < Nsys; i++) { grhs[i][L - 2] = -1; grhs[i][L - 1] = -2; }
  }

  // 切片: rank r 取全局行 [r*Nrow, r*Nrow+Nrow)
  const slices = [];
  for (let r = 0; r < P; r++) {
    const A = mk2d(Nsys, Nrow), B = mk2d(Nsys, Nrow), C = mk2d(Nsys, Nrow);
    const D = mk2d(Nsys, Nrow), E = mk2d(Nsys, Nrow), RHS = mk2d(Nsys, Nrow);
    for (let i = 0; i < Nsys; i++)
      for (let k = 0; k < Nrow; k++) {
        const j = r * Nrow + k;
        A[i][k] = ga[i][j]; B[i][k] = gb[i][j]; C[i][k] = gc[i][j];
        D[i][k] = gd[i][j]; E[i][k] = ge[i][j]; RHS[i][k] = grhs[i][j];
      }
    slices.push({ A, B, C, D, E, RHS });
  }
  return { slices, gx, L };
}

// 密集参考: 全局线直解
function denseRef(P, Nrow, Nsys, mode, rng) {
  const { slices, gx, L } = buildGlobalAndSlices(P, Nrow, Nsys, mode, rng);
  const ga = mk2d(Nsys, L), gb = mk2d(Nsys, L), gc = mk2d(Nsys, L);
  const gd = mk2d(Nsys, L), ge = mk2d(Nsys, L), grhs = mk2d(Nsys, L);
  for (let r = 0; r < P; r++)
    for (let i = 0; i < Nsys; i++)
      for (let k = 0; k < Nrow; k++) {
        const j = r * Nrow + k;
        ga[i][j] = slices[r].A[i][k]; gb[i][j] = slices[r].B[i][k]; gc[i][j] = slices[r].C[i][k];
        gd[i][j] = slices[r].D[i][k]; ge[i][j] = slices[r].E[i][k]; grhs[i][j] = slices[r].RHS[i][k];
      }
  tdma_penta_cuda(ga, gb, gc, gd, ge, grhs, Nsys, L);
  return { ref: grhs, gx, L };
}

// ---------------------------------------------------------------
// 主测试
// ---------------------------------------------------------------
function main() {
  const P_list = [1, 2, 3, 4, 7, 8];
  const Nrow_list = [5, 6, 7, 8, 12, 16];
  const Nsys_pool = (P) => [P, P + 1, 3 * P];
  const modes = ['exact1', 'dominant', 'near'];
  const tol = { exact1: 1e-13, dominant: 1e-13, near: 1e-10 };

  let nCfg = 0, nFail = 0;
  const failMsgs = [];
  let worstRel = 0, worstCfg = '';
  let worstExact1 = 0;   // exact1 模式 |x-1| 的最大值

  for (const mode of modes) {
    const seeds = mode === 'exact1' ? [0] : [1, 7, 123];
    for (const P of P_list) {
      for (const Nrow of Nrow_list) {
        for (const Nsys of Nsys_pool(P)) {
          for (const seed of seeds) {
            nCfg++;
            const rng = lcg(seed * 7919 + P * 131 + Nrow * 17 + Nsys);
            // 32 与 28 路径各用独立数据副本 (S1 原位修改)
            const s32 = buildGlobalAndSlices(P, Nrow, Nsys, mode, rng).slices;
            const s28 = cloneSlices(s32);

            const r32 = distributedSolve(P, Nrow, Nsys, s32, false);
            const r28 = distributedSolve(P, Nrow, Nsys, s28, true);

            const cfg = `P=${P} Nrow=${Nrow} Nsys=${Nsys} ${mode} seed=${seed}`;

            // (1) Atr 位一致
            for (let r = 0; r < P; r++) {
              if (!bitEqual(r32.Atrs[r], r28.Atrs[r])) {
                nFail++; failMsgs.push(`[Atr 位不一致] ${cfg} rank=${r}`);
                break;
              }
            }
            // (2) 解位一致
            let bitOK = true;
            for (let r = 0; r < P; r++) {
              if (!bitEqual(r32.sols[r], r28.sols[r])) { bitOK = false; break; }
            }
            if (!bitOK) { nFail++; failMsgs.push(`[解位不一致] ${cfg}`); }

            // (3) 与密集直解对照 (两种路径一致, 只对 28 路径做对照)
            const dr = denseRef(P, Nrow, Nsys, mode, lcg(seed * 7919 + P * 131 + Nrow * 17 + Nsys));
            const concat = mk2d(Nsys, dr.L);
            // 每 rank 的解覆盖全部 Nsys 线 (同一 (x,y) 位置), 其切片为全局 z 行 [r*Nrow, r*Nrow+Nrow)
            for (let r = 0; r < P; r++)
              for (let i = 0; i < Nsys; i++)
                for (let k = 0; k < Nrow; k++)
                  concat[i][r * Nrow + k] = r28.sols[r][i][k];
            let maxAbs = 0;
            for (let i = 0; i < Nsys; i++)
              for (let j = 0; j < dr.L; j++)
                maxAbs = Math.max(maxAbs, Math.abs(concat[i][j] - dr.ref[i][j]));

            // exact1 模式: 物理解应为 x ≡ 1, 校验最大偏差
            if (mode === 'exact1') {
              for (let i = 0; i < Nsys; i++)
                for (let j = 0; j < dr.L; j++)
                  worstExact1 = Math.max(worstExact1, Math.abs(concat[i][j] - 1));
            }
            // 相对误差按参考量级归一
            let norm = 0;
            for (let i = 0; i < Nsys; i++)
              for (let j = 0; j < dr.L; j++)
                norm = Math.max(norm, Math.abs(dr.ref[i][j]));
            const rel = maxAbs / (norm + 1e-300);
            if (rel > worstRel) { worstRel = rel; worstCfg = cfg; }
            if (rel > tol[mode]) {
              nFail++;
              failMsgs.push(`[密集对照超差] ${cfg} maxAbs=${maxAbs.toExponential(2)} rel=${rel.toExponential(2)}`);
            }
          }
        }
      }
    }
  }

  console.log(`配置数: ${nCfg}`);
  console.log(`失败数: ${nFail}`);
  console.log(`最差相对误差 (28 路径 vs 密集直解): ${worstRel.toExponential(3)}  @ ${worstCfg}`);
  console.log(`exact1 模式 |x-1| 最大偏差: ${worstExact1.toExponential(3)}`);
  console.log(`通信量降幅: 前向缩约数据每线 ${'32'} -> ${'28'} 双精度 (-${(4 / 32 * 100).toFixed(1)}%);`);
  console.log(`           每线总通信 (前向+解回传) ${'36'} -> ${'32'} (-${(4 / 36 * 100).toFixed(1)}%)`);
  if (failMsgs.length) {
    console.log('--- 失败明细 ---');
    for (const m of failMsgs.slice(0, 30)) console.log('  ' + m);
  }
  process.exit(nFail ? 1 : 0);
}

main();
