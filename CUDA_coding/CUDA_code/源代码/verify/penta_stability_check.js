#!/usr/bin/env node
'use strict';

/*
 * TASK-015 independent numerical contract for the no-pivot penta solver.
 * This does not call CUDA and is intentionally independent of the Fortran
 * implementation. It fixes the matrix families, error metrics, pivot rule,
 * and numerical failure code that the target implementation must reproduce.
 */

const EPS = Number.EPSILON;
const PIVOT_FACTOR = 64;
const NUMERICAL_PIVOT_FAILURE = 4;

function cloneBands(sys) {
  return {
    l2: sys.l2.slice(), l1: sys.l1.slice(), d: sys.d.slice(),
    u1: sys.u1.slice(), u2: sys.u2.slice(), b: sys.b.slice(),
  };
}

function pivotUnsafe(pivot, scale) {
  return !Number.isFinite(pivot) || !Number.isFinite(scale) ||
    Math.abs(pivot) <= PIVOT_FACTOR * EPS * Math.max(scale, Number.MIN_VALUE);
}

function noPivotPentaSolve(input) {
  const { l2, l1, d, u1, u2, b } = cloneBands(input);
  const n = d.length;
  for (let k = 0; k < n - 1; k++) {
    const scale = Math.abs(d[k]) + Math.abs(u1[k]) + Math.abs(u2[k]);
    if (pivotUnsafe(d[k], scale)) {
      return { ok: false, code: NUMERICAL_PIVOT_FAILURE, row: k, pivot: d[k], scale };
    }
    let mult = l1[k + 1] / d[k];
    l1[k + 1] = mult;
    d[k + 1] -= mult * u1[k];
    u1[k + 1] -= mult * u2[k];
    b[k + 1] -= mult * b[k];
    if (k + 2 < n) {
      mult = l2[k + 2] / d[k];
      l2[k + 2] = mult;
      l1[k + 2] -= mult * u1[k];
      d[k + 2] -= mult * u2[k];
      b[k + 2] -= mult * b[k];
    }
  }
  const lastScale = Math.abs(d[n - 1]);
  if (pivotUnsafe(d[n - 1], lastScale)) {
    return { ok: false, code: NUMERICAL_PIVOT_FAILURE, row: n - 1, pivot: d[n - 1], scale: lastScale };
  }
  const x = new Array(n);
  for (let k = n - 1; k >= 0; k--) {
    let rhs = b[k];
    if (k + 1 < n) rhs -= u1[k] * x[k + 1];
    if (k + 2 < n) rhs -= u2[k] * x[k + 2];
    x[k] = rhs / d[k];
  }
  if (x.some(v => !Number.isFinite(v))) {
    return { ok: false, code: NUMERICAL_PIVOT_FAILURE, row: -1, pivot: NaN, scale: NaN };
  }
  return { ok: true, code: 0, x };
}

function denseSolve(input) {
  const A = denseMatrix(input);
  const b = input.b.slice();
  const n = A.length;
  // Row equilibration keeps the independent partial-pivoting reference
  // meaningful for the 1e-12..1e12 row-scaled family.
  for (let i = 0; i < n; i++) {
    const scale = Math.max(...A[i].map(Math.abs));
    if (scale === 0) throw new Error('independent dense reference has a zero row');
    for (let j = 0; j < n; j++) A[i][j] /= scale;
    b[i] /= scale;
  }
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
    if (A[p][k] === 0) throw new Error('independent dense reference is singular');
    [A[k], A[p]] = [A[p], A[k]];
    [b[k], b[p]] = [b[p], b[k]];
    for (let i = k + 1; i < n; i++) {
      const f = A[i][k] / A[k][k];
      A[i][k] = 0;
      for (let j = k + 1; j < n; j++) A[i][j] -= f * A[k][j];
      b[i] -= f * b[k];
    }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let rhs = b[i];
    for (let j = i + 1; j < n; j++) rhs -= A[i][j] * x[j];
    x[i] = rhs / A[i][i];
  }
  return x;
}

function denseMatrix(sys) {
  const n = sys.d.length;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    A[i][i] = sys.d[i];
    if (i >= 1) A[i][i - 1] = sys.l1[i];
    if (i >= 2) A[i][i - 2] = sys.l2[i];
    if (i + 1 < n) A[i][i + 1] = sys.u1[i];
    if (i + 2 < n) A[i][i + 2] = sys.u2[i];
  }
  return A;
}

function manufacturedRhs(sys, x) {
  const n = x.length;
  const b = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    b[i] = sys.d[i] * x[i];
    if (i >= 1) b[i] += sys.l1[i] * x[i - 1];
    if (i >= 2) b[i] += sys.l2[i] * x[i - 2];
    if (i + 1 < n) b[i] += sys.u1[i] * x[i + 1];
    if (i + 2 < n) b[i] += sys.u2[i] * x[i + 2];
  }
  return b;
}

function metrics(sys, x, xTrue) {
  const A = denseMatrix(sys);
  let rInf = 0, aInf = 0, xInf = 0, bInf = 0, fwd = 0;
  for (let i = 0; i < A.length; i++) {
    let ax = 0, rowSum = 0;
    for (let j = 0; j < A.length; j++) {
      ax += A[i][j] * x[j];
      rowSum += Math.abs(A[i][j]);
    }
    rInf = Math.max(rInf, Math.abs(ax - sys.b[i]));
    aInf = Math.max(aInf, rowSum);
    bInf = Math.max(bInf, Math.abs(sys.b[i]));
    xInf = Math.max(xInf, Math.abs(x[i]));
    fwd = Math.max(fwd, Math.abs(x[i] - xTrue[i]));
  }
  const trueInf = Math.max(...xTrue.map(Math.abs));
  return {
    backward: rInf / Math.max(aInf * xInf + bInf, Number.MIN_VALUE),
    forward: fwd / Math.max(trueInf, Number.MIN_VALUE),
  };
}

function emptyBands(n) {
  return {
    l2: new Array(n).fill(0), l1: new Array(n).fill(0), d: new Array(n).fill(0),
    u1: new Array(n).fill(0), u2: new Array(n).fill(0), b: new Array(n).fill(0),
  };
}

function baseDominant(n, margin) {
  const s = emptyBands(n);
  for (let i = 0; i < n; i++) {
    if (i >= 2) s.l2[i] = -0.11 - 0.01 * (i % 3);
    if (i >= 1) s.l1[i] = 0.31 + 0.02 * (i % 2);
    if (i + 1 < n) s.u1[i] = -0.27 - 0.01 * (i % 4);
    if (i + 2 < n) s.u2[i] = 0.09 + 0.01 * (i % 3);
    const off = Math.abs(s.l2[i]) + Math.abs(s.l1[i]) + Math.abs(s.u1[i]) + Math.abs(s.u2[i]);
    s.d[i] = off * margin;
  }
  return s;
}

function rowScale(sys, exponentLo, exponentHi) {
  const n = sys.d.length;
  for (let i = 0; i < n; i++) {
    const scale = 10 ** (exponentLo + (exponentHi - exponentLo) * i / (n - 1));
    sys.l2[i] *= scale; sys.l1[i] *= scale; sys.d[i] *= scale;
    sys.u1[i] *= scale; sys.u2[i] *= scale; sys.b[i] *= scale;
  }
  return sys;
}

function makeCase(name, n = 18) {
  const xTrue = Array.from({ length: n }, (_, i) => Math.sin(0.37 * (i + 1)) + 0.25 * Math.cos(0.11 * i));
  let sys;
  if (name === 'dominant') {
    sys = baseDominant(n, 2.0);
  } else if (name === 'weak-dominant') {
    sys = baseDominant(n, 1.0 + 1e-12);
  } else if (name === 'scaled') {
    sys = rowScale(baseDominant(n, 2.0), -12, 12);
  } else if (name === 'near-singular') {
    sys = emptyBands(n);
    const lambda = 2 * Math.cos(Math.PI / (n + 1)) + 1e-9;
    for (let i = 0; i < n; i++) {
      sys.d[i] = lambda;
      if (i >= 1) sys.l1[i] = -1;
      if (i + 1 < n) sys.u1[i] = -1;
    }
  } else if (name === 'zero-pivot' || name === 'near-zero-pivot') {
    sys = baseDominant(n, 2.0);
    sys.d[0] = name === 'zero-pivot' ? 0 : 1e-16;
    sys.u1[0] = 1;
    sys.l1[1] = 1;
  } else {
    throw new Error(`unknown case ${name}`);
  }
  sys.b = manufacturedRhs(sys, xTrue);
  return { sys, xTrue };
}

const positive = [
  { name: 'dominant', forward: 1e-10 },
  { name: 'weak-dominant', forward: 1e-10 },
  { name: 'scaled', forward: 1e-10 },
  { name: 'near-singular', forward: 1e-5 },
];
const negative = ['zero-pivot', 'near-zero-pivot'];
let failures = 0;

for (const contract of positive) {
  const { sys, xTrue } = makeCase(contract.name);
  const result = noPivotPentaSolve(sys);
  if (!result.ok) {
    console.log(`FAIL ${contract.name}: unexpected pivot rejection row=${result.row}`);
    failures++;
    continue;
  }
  const dense = denseSolve(sys);
  const m = metrics(sys, result.x, xTrue);
  const denseDiff = Math.max(...result.x.map((v, i) => Math.abs(v - dense[i])));
  const pass = m.backward <= 1e-10 && m.forward <= contract.forward && denseDiff <= contract.forward;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${contract.name}: backward=${m.backward.toExponential(3)} forward=${m.forward.toExponential(3)} dense_diff=${denseDiff.toExponential(3)}`);
  if (!pass) failures++;
}

for (const name of negative) {
  const { sys } = makeCase(name);
  const result = noPivotPentaSolve(sys);
  const scaled = rowScale(cloneBands(sys), -9, 9);
  const scaledResult = noPivotPentaSolve(scaled);
  const pass = !result.ok && result.code === NUMERICAL_PIVOT_FAILURE &&
    !scaledResult.ok && scaledResult.code === NUMERICAL_PIVOT_FAILURE;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: code=${result.code} scaled_code=${scaledResult.code} row=${result.row}`);
  if (!pass) failures++;
}

console.log(`TASK-015 stability contract: cases=${positive.length + negative.length} failures=${failures} pivot_factor=${PIVOT_FACTOR} failure_code=${NUMERICAL_PIVOT_FAILURE}`);
process.exitCode = failures === 0 ? 0 : 1;
