#!/usr/bin/env node
'use strict';

/*
 * penta_comm_22_verify.js
 *
 * Independent layout proof for the pentadiagonal 28 -> 22 forward
 * communication proposal.  This script does not call or mirror the
 * elimination solver.  It verifies only the communication contract:
 *
 *   rd28: four equations x [L3,L2,L1,U1,U2,U3,RHS]
 *   Atr32: four equations x [L3,L2,L1,D,U1,U2,U3,RHS]
 *
 * Six rd28 entries are structural zeros.  Removing them must preserve
 * every reconstructed Atr32 slot for multi-rank and uneven line splits.
 */

const KEEP_28_TO_22 = Object.freeze([
  1, 2, 3, 4, 5, 6,
  8, 9, 10, 11, 13,
  15, 16, 17, 18, 20,
  21, 22, 23, 24, 25, 27,
]);
const STRUCTURAL_ZERO_28 = Object.freeze([0, 7, 12, 14, 19, 26]);
const EXPECTED_KEEP_PER_EQUATION = Object.freeze([6, 5, 5, 6]);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function mk2d(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => new Array(cols).fill(fill));
}

function lcg(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function partition(total, parts, rank) {
  const base = Math.floor(total / parts);
  const extra = total % parts;
  const count = base + (rank < extra ? 1 : 0);
  const start = rank * base + Math.min(rank, extra);
  return { start, count };
}

function rd28ToAtr32Slot(rdSlot) {
  const equation = Math.floor(rdSlot / 7);
  const slot7 = rdSlot % 7;
  return equation * 8 + (slot7 < 3 ? slot7 : slot7 + 1);
}

function validateStaticMapping() {
  assert(KEEP_28_TO_22.length === 22, 'compact mapping must contain 22 entries');
  assert(new Set(KEEP_28_TO_22).size === 22, 'compact mapping contains duplicates');
  assert(new Set(STRUCTURAL_ZERO_28).size === 6, 'zero mapping must contain 6 unique entries');

  const all = [...KEEP_28_TO_22, ...STRUCTURAL_ZERO_28].sort((a, b) => a - b);
  assert(all.length === 28 && all.every((value, index) => value === index),
    'kept and dropped mappings must partition rd28 exactly');

  const zeroSet = new Set(STRUCTURAL_ZERO_28);
  const orderPreservingKeep = Array.from({ length: 28 }, (_, index) => index)
    .filter(index => !zeroSet.has(index));
  assert(KEEP_28_TO_22.every((value, index) => value === orderPreservingKeep[index]),
    'compact mapping must preserve the original rd28 slot order');

  const keptPerEquation = [0, 0, 0, 0];
  for (const slot of KEEP_28_TO_22) keptPerEquation[Math.floor(slot / 7)]++;
  assert(keptPerEquation.every((value, index) => value === EXPECTED_KEEP_PER_EQUATION[index]),
    `unexpected per-equation compact lengths: ${keptPerEquation.join(',')}`);

  const expectedZeros = [0, 7, 12, 14, 19, 26];
  assert(STRUCTURAL_ZERO_28.every((value, index) => value === expectedZeros[index]),
    'structural-zero positions do not match the four boundary equations');

  const atrSlots = KEEP_28_TO_22.map(rd28ToAtr32Slot);
  assert(new Set(atrSlots).size === 22, 'two compact values map to the same Atr32 slot');
}

function valueFor(mode, source, line, slot, seed, random) {
  if (mode === 'markers') {
    const magnitude = (source + 1) * 1000000 + (line + 1) * 100 + slot + seed / 1000;
    if ((source + line + slot + seed) % 17 === 0) return -0;
    return (slot % 2 === 0 ? -1 : 1) * magnitude;
  }
  const sign = random() < 0.5 ? -1 : 1;
  return sign * (1 + slot + random());
}

function makeValidRd28(nsys, source, seed, mode) {
  const rows = mk2d(nsys, 28, 0);
  const random = lcg((seed * 2654435761 + source * 2246822519) >>> 0);
  for (let line = 0; line < nsys; line++) {
    for (const slot of KEEP_28_TO_22) {
      rows[line][slot] = valueFor(mode, source, line, slot, seed, random);
    }
  }
  return rows;
}

function assertStructuralZeros(rd28, start, count) {
  for (let line = start; line < start + count; line++) {
    for (const slot of STRUCTURAL_ZERO_28) {
      if (rd28[line][slot] !== 0) {
        fail(`cannot compact nonzero structural slot rd28[${line}][${slot}]=${rd28[line][slot]}`);
      }
    }
  }
}

// Buffers use the same column-major subarray ordering as pascalpack:
// buffer[localLine + column * lineCount].
function pack28(rd28, start, count) {
  const buffer = new Array(count * 28);
  for (let column = 0; column < 28; column++) {
    for (let local = 0; local < count; local++) {
      buffer[local + column * count] = rd28[start + local][column];
    }
  }
  return buffer;
}

function pack22(rd28, start, count) {
  assertStructuralZeros(rd28, start, count);
  const buffer = new Array(count * 22);
  for (let compact = 0; compact < 22; compact++) {
    const rdSlot = KEEP_28_TO_22[compact];
    for (let local = 0; local < count; local++) {
      buffer[local + compact * count] = rd28[start + local][rdSlot];
    }
  }
  return buffer;
}

function initializeAtrBlock(atr, sourceColumn, count) {
  for (let local = 0; local < count; local++) {
    for (let equation = 0; equation < 4; equation++) {
      const base = sourceColumn + equation * 8;
      for (let slot = 0; slot < 8; slot++) atr[local][base + slot] = 0;
      atr[local][base + 3] = 1;
    }
  }
}

function unpack28ToAtr(atr, sourceColumn, buffer, count) {
  initializeAtrBlock(atr, sourceColumn, count);
  for (let rdSlot = 0; rdSlot < 28; rdSlot++) {
    const atrSlot = rd28ToAtr32Slot(rdSlot);
    for (let local = 0; local < count; local++) {
      atr[local][sourceColumn + atrSlot] = buffer[local + rdSlot * count];
    }
  }
}

function unpack22ToAtr(atr, sourceColumn, buffer, count) {
  initializeAtrBlock(atr, sourceColumn, count);
  for (let compact = 0; compact < 22; compact++) {
    const atrSlot = rd28ToAtr32Slot(KEEP_28_TO_22[compact]);
    for (let local = 0; local < count; local++) {
      atr[local][sourceColumn + atrSlot] = buffer[local + compact * count];
    }
  }
}

function unpack22ToRd28(buffer, count) {
  const rd28 = mk2d(count, 28, 0);
  for (let compact = 0; compact < 22; compact++) {
    const rdSlot = KEEP_28_TO_22[compact];
    for (let local = 0; local < count; local++) {
      rd28[local][rdSlot] = buffer[local + compact * count];
    }
  }
  return rd28;
}

function exactEqual(left, right) {
  return left === right;
}

function compare2d(left, right, label) {
  assert(left.length === right.length, `${label}: row count differs`);
  let checked = 0;
  for (let row = 0; row < left.length; row++) {
    assert(left[row].length === right[row].length, `${label}: column count differs at row ${row}`);
    for (let column = 0; column < left[row].length; column++) {
      checked++;
      if (!exactEqual(left[row][column], right[row][column])) {
        fail(`${label}: mismatch at [${row}][${column}]: ${left[row][column]} vs ${right[row][column]}`);
      }
    }
  }
  return checked;
}

function verifyConfiguration(P, nsys, seed, mode) {
  const sourceRd = Array.from({ length: P }, (_, source) => makeValidRd28(nsys, source, seed, mode));
  let rdSlotsChecked = 0;
  let atrSlotsChecked = 0;

  for (let destination = 0; destination < P; destination++) {
    const { start, count } = partition(nsys, P, destination);
    assert(count > 0, `test configuration unexpectedly created an empty partition: P=${P} Nsys=${nsys}`);
    const atr28 = mk2d(count, 32 * P, NaN);
    const atr22 = mk2d(count, 32 * P, NaN);

    for (let source = 0; source < P; source++) {
      const buffer28 = pack28(sourceRd[source], start, count);
      const buffer22 = pack22(sourceRd[source], start, count);
      unpack28ToAtr(atr28, 32 * source, buffer28, count);
      unpack22ToAtr(atr22, 32 * source, buffer22, count);

      const restored = unpack22ToRd28(buffer22, count);
      const expected = sourceRd[source].slice(start, start + count);
      rdSlotsChecked += compare2d(expected, restored,
        `rd28 round-trip P=${P} Nsys=${nsys} dst=${destination} src=${source}`);
    }
    atrSlotsChecked += compare2d(atr28, atr22,
      `Atr32 equivalence P=${P} Nsys=${nsys} dst=${destination}`);
  }
  return { rdSlotsChecked, atrSlotsChecked };
}

function verifyFaultDetection() {
  const row = makeValidRd28(1, 0, 11, 'markers');
  const expected = row.map(values => values.slice());
  let detected = 0;

  for (let compact = 0; compact < 22; compact++) {
    const buffer = pack22(row, 0, 1);
    buffer[compact] += 0.5;
    const restored = unpack22ToRd28(buffer, 1);
    let mismatch = false;
    for (let slot = 0; slot < 28; slot++) {
      if (!exactEqual(expected[0][slot], restored[0][slot])) mismatch = true;
    }
    if (mismatch) detected++;
  }

  for (const slot of STRUCTURAL_ZERO_28) {
    const invalid = expected.map(values => values.slice());
    invalid[0][slot] = slot + 0.25;
    let rejected = false;
    try {
      pack22(invalid, 0, 1);
    } catch (error) {
      rejected = /cannot compact nonzero structural slot/.test(error.message);
    }
    if (rejected) detected++;
  }

  assert(detected === 28, `fault detection covered ${detected}/28 injected faults`);
  return detected;
}

function main() {
  validateStaticMapping();

  const ranks = [1, 2, 3, 4, 7, 8];
  const seeds = [0, 1, 7, 123, 65537];
  const modes = ['markers', 'random'];
  let configurations = 0;
  let rdSlotsChecked = 0;
  let atrSlotsChecked = 0;

  for (const P of ranks) {
    const nsysValues = [P, P + 1, 2 * P + 3];
    for (const nsys of nsysValues) {
      for (const seed of seeds) {
        for (const mode of modes) {
          const result = verifyConfiguration(P, nsys, seed, mode);
          configurations++;
          rdSlotsChecked += result.rdSlotsChecked;
          atrSlotsChecked += result.atrSlotsChecked;
        }
      }
    }
  }

  const faultsDetected = verifyFaultDetection();
  const forwardReduction = (1 - 22 / 28) * 100;
  const totalReduction = (1 - 26 / 32) * 100;

  console.log('28->22 independent pack/unpack validation');
  console.log(`mapping: kept=${KEEP_28_TO_22.length}, structural_zero=${STRUCTURAL_ZERO_28.length}, per_equation=${EXPECTED_KEEP_PER_EQUATION.join('+')}`);
  console.log(`configurations: ${configurations} (P=1/2/3/4/7/8, balanced and uneven Nsys, marker/random data)`);
  console.log(`rd28 round-trip slots checked: ${rdSlotsChecked}`);
  console.log(`Atr32 slots checked: ${atrSlotsChecked}`);
  console.log(`fault injections detected: ${faultsDetected}/28`);
  console.log(`slot-count reduction only: forward 28->22 (-${forwardReduction.toFixed(1)}%), forward+backward 32->26 (-${totalReduction.toFixed(1)}%)`);
  console.log('failures: 0');
}

try {
  main();
} catch (error) {
  console.error(`28->22 validation FAILED: ${error.message}`);
  process.exit(1);
}
