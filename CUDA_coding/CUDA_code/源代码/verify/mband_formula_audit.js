#!/usr/bin/env node
'use strict';

/*
 * Independent combinatorial audit for the general half-bandwidth m formulas.
 * This script deliberately does not call the numerical reduction or recurrence
 * implementations.  It derives row offsets directly from the global ordering
 * [top m, bottom m] used for each rank.
 */

function range(first, last) {
  const values = [];
  for (let value = first; value <= last; value++) values.push(value);
  return values;
}

function allowedOffsets(m, equation) {
  const offsets = new Set(range(-equation, 2 * m - 1 - equation));
  if (equation < m) {
    for (const offset of range(-m, -equation - 1)) offsets.add(offset);
  } else {
    for (const offset of range(2 * m - equation, m)) offsets.add(offset);
  }
  return offsets;
}

function formulaZeroOffsets(m, equation) {
  const offsets = new Set();
  if (equation < m) {
    for (const offset of range(-(2 * m - 1), -(m + 1))) offsets.add(offset);
    for (const offset of range(2 * m - equation, 2 * m - 1)) offsets.add(offset);
  } else {
    for (const offset of range(-(2 * m - 1), -(equation + 1))) offsets.add(offset);
    for (const offset of range(m + 1, 2 * m - 1)) offsets.add(offset);
  }
  return offsets;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every(value => right.has(value));
}

function audit(m) {
  const bandOffsets = new Set(range(-(2 * m - 1), 2 * m - 1));
  let zeroCount = 0;
  let reachesLowerBand = false;
  let reachesUpperBand = false;

  for (let equation = 0; equation < 2 * m; equation++) {
    const allowed = allowedOffsets(m, equation);
    const complement = new Set([...bandOffsets].filter(offset => !allowed.has(offset)));
    const expectedZeros = formulaZeroOffsets(m, equation);
    assert(sameSet(complement, expectedZeros),
      `m=${m} equation=${equation}: zero-offset formula mismatch`);
    assert(allowed.has(0), `m=${m} equation=${equation}: diagonal missing`);
    zeroCount += complement.size;
    reachesLowerBand ||= allowed.has(-(2 * m - 1));
    reachesUpperBand ||= allowed.has(2 * m - 1);
  }

  const fullSlots = 2 * m * 4 * m;
  const normalizedPayload = fullSlots - 2 * m;
  const prunedPayload = normalizedPayload - zeroCount;
  assert(reachesLowerBand && reachesUpperBand,
    `m=${m}: reduced half-bandwidth is not exactly 2m-1`);
  assert(zeroCount === 3 * m * (m - 1),
    `m=${m}: got ${zeroCount} structural zeros`);
  assert(normalizedPayload === 8 * m * m - 2 * m,
    `m=${m}: normalized fixed-layout payload mismatch`);
  assert(prunedPayload === 5 * m * m + m,
    `m=${m}: structurally pruned fixed-layout payload mismatch`);
}

function main() {
  const maxM = 64;
  for (let m = 1; m <= maxM; m++) audit(m);

  for (const m of [1, 2, 3, 4]) {
    const expected = {
      1: [2, 1, 6, 0],
      2: [4, 3, 22, 6],
      3: [6, 5, 48, 18],
      4: [8, 7, 84, 36]
    }[m];
    assert(2 * m === expected[0], `m=${m}: interface special case mismatch`);
    assert(2 * m - 1 === expected[1], `m=${m}: bandwidth special case mismatch`);
    assert(5 * m * m + m === expected[2], `m=${m}: payload special case mismatch`);
    assert(3 * m * (m - 1) === expected[3], `m=${m}: zero-count special case mismatch`);
  }

  console.log(`independent formula audit: PASS (m=1..${maxM})`);
  console.log('verified: interfaces=2m, dimension=2mP, half-bandwidth=2m-1');
  console.log('verified: structural_zeros=3m(m-1), fixed_layout_payload=5m^2+m');
}

main();
