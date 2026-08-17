#!/usr/bin/env node
'use strict';

/* Independent setup-only arithmetic checks for TASK-008. */

const INT_MAX = 2147483647n;

function planExtents(nsys, nprocs) {
  const maxLines = nsys / nprocs + (nsys % nprocs === 0n ? 0n : 1n);
  return {
    forwardWorkspace: 28n * nsys,
    backwardWorkspace: 4n * nsys,
    reducedColumns: 32n * nprocs,
    solutionColumns: 4n * nprocs,
    forwardMpiExtent: maxLines * 28n * nprocs,
    reducedWorkspace: maxLines * 32n * nprocs,
    backwardMpiExtent: maxLines * 4n * nprocs,
  };
}

function planFits(nsys, nprocs) {
  if (nsys <= 0n || nprocs <= 0n || nsys < nprocs) return false;
  return Object.values(planExtents(nsys, nprocs)).every(value => value <= INT_MAX);
}

function matrixFits(nsys, nrow) {
  return nsys > 0n && nrow > 0n && nsys * nrow <= INT_MAX;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function largestPlanNsys(nprocs) {
  let low = nprocs;
  let high = INT_MAX;
  while (low < high) {
    const middle = low + (high - low + 1n) / 2n;
    if (planFits(middle, nprocs)) low = middle;
    else high = middle - 1n;
  }
  return low;
}

function lcg(seed) {
  let state = seed >>> 0;
  return function random32() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return BigInt(state);
  };
}

function main() {
  const ranks = [1n, 2n, 3n, 4n, 7n, 8n, 1024n, 65535n];
  let planBoundaries = 0;
  for (const nprocs of ranks) {
    const boundary = largestPlanNsys(nprocs);
    assert(planFits(boundary, nprocs), `plan boundary rejected for P=${nprocs}`);
    assert(!planFits(boundary + 1n, nprocs), `plan overflow accepted for P=${nprocs}`);
    const extents = planExtents(boundary, nprocs);
    assert(Object.values(extents).every(value => value <= INT_MAX), `unsafe plan product for P=${nprocs}`);
    planBoundaries++;
  }
  assert(largestPlanNsys(1n) === INT_MAX / 32n,
    'P=1 boundary must be floor(INT_MAX/32) because Atr is the limiting workspace');

  const nsysValues = [1n, 2n, 3n, 28n, 1024n, 65535n, 1000000n];
  let matrixBoundaries = 0;
  for (const nsys of nsysValues) {
    const nrow = INT_MAX / nsys;
    assert(matrixFits(nsys, nrow), `matrix boundary rejected for Nsys=${nsys}`);
    assert(!matrixFits(nsys, nrow + 1n), `matrix overflow accepted for Nsys=${nsys}`);
    matrixBoundaries++;
  }

  const random = lcg(20260817);
  let randomCases = 0;
  for (let index = 0; index < 10000; index++) {
    const nprocs = random() % 4096n + 1n;
    const nsys = nprocs + random() % 100000000n;
    const extents = planExtents(nsys, nprocs);
    const expected = Object.values(extents).every(value => value <= INT_MAX);
    assert(planFits(nsys, nprocs) === expected, `random plan classification mismatch at ${index}`);
    randomCases++;
  }

  console.log('pentadiagonal index-bound validation');
  console.log(`default integer limit: ${INT_MAX}`);
  console.log(`plan exact boundaries checked: ${planBoundaries}`);
  console.log(`matrix exact boundaries checked: ${matrixBoundaries}`);
  console.log(`random setup-only cases checked: ${randomCases}`);
  console.log(`P=1 maximum supported Nsys by workspace arithmetic: ${largestPlanNsys(1n)}`);
  console.log('failures: 0');
}

try {
  main();
} catch (error) {
  console.error(`index-bound validation FAILED: ${error.message}`);
  process.exit(1);
}
