#!/usr/bin/env node
'use strict';

/* TASK-018: current 28-slot and projected 22-slot benchmark capacity model. */

const MiB = 1024n * 1024n;
const GiB = 1024n * MiB;
const FP64 = 8n;
const INT32 = 4n;

function fail(message) { throw new Error(message); }
function asPositiveInt(value, name) {
  if (!/^\d+$/.test(value || '')) fail(`${name} must be a positive integer`);
  const parsed = BigInt(value);
  if (parsed < 1n) fail(`${name} must be positive`);
  return parsed;
}
function parseArgs(argv) {
  const options = { n1: 64n, n2: 64n, n3: 1024n, ranks: 1n, rank: 0n, budgetMiB: null, requireFit: false, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--self-test') { options.selfTest = true; continue; }
    if (key === '--require-fit') { options.requireFit = true; continue; }
    if (!['--n1', '--n2', '--n3', '--ranks', '--rank', '--budget-mib'].includes(key)) fail(`unknown option ${key}`);
    const value = argv[++i];
    if (value === undefined) fail(`missing value for ${key}`);
    const target = key === '--budget-mib' ? 'budgetMiB' : key.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    options[target] = asPositiveInt(value, key);
  }
  if (options.rank >= options.ranks) fail('--rank must be smaller than --ranks');
  return options;
}
function localCount(total, ranks, rank) {
  const base = total / ranks;
  const remainder = total % ranks;
  return base + (rank < remainder ? 1n : 0n);
}
function textBytes(bytes) {
  for (const [scale, unit] of [[GiB, 'GiB'], [MiB, 'MiB'], [1024n, 'KiB']]) {
    if (bytes >= scale) return `${(Number(bytes) / Number(scale)).toFixed(3)} ${unit}`;
  }
  return `${bytes} B`;
}
function footprint({ n1, n2, n3, ranks, rank }, slots) {
  const nsys = n1 * n2;
  const nrow = localCount(n3, ranks, rank);
  const tmpN = localCount(nsys, ranks, rank);
  const s = BigInt(slots);

  // benchmark_penta allocates A..R (6) + s1(:,:,1:2) (2) + s2(:,:,1:2) (2).
  const benchmarkDevice = 10n * nsys * nrow * FP64;
  const hostSolutionCopies = 2n * nsys * nrow * FP64;
  const rd = s * nsys * FP64;
  const atr = 32n * ranks * tmpN * FP64;
  const dtr = 4n * ranks * tmpN * FP64;
  const drd = 4n * nsys * FP64;
  const bigbufA = s * nsys * FP64;
  const bigbufB = s * ranks * tmpN * FP64;
  const deviceDescriptors = 16n * ranks * INT32; // eight 2xP device integer arrays
  const hostDescriptors = 28n * ranks * INT32;
  const pivotDevice = nsys * INT32;
  const pivotHost = nsys * INT32;
  const hostForwardStage = (s * nsys + s * ranks * tmpN) * FP64;
  const hostBackwardStage = (s * ranks * tmpN + 4n * nsys) * FP64;
  const hostStagePeak = hostForwardStage > hostBackwardStage ? hostForwardStage : hostBackwardStage;
  const planDevice = rd + atr + dtr + drd + bigbufA + bigbufB + deviceDescriptors + pivotDevice;
  return { slots, nsys, nrow, tmpN, benchmarkDevice, hostSolutionCopies, rd, atr, dtr, drd, bigbufA, bigbufB, deviceDescriptors, pivotDevice, pivotHost, planDevice, hostDescriptors, hostForwardStage, hostBackwardStage, hostStagePeak, devicePersistent: benchmarkDevice + planDevice, hostPersistent: hostSolutionCopies + hostDescriptors + pivotHost, hostPeakWithStaging: hostSolutionCopies + hostDescriptors + pivotHost + hostStagePeak };
}
function expect(condition, message) { if (!condition) fail(message); }
function selfTest() {
  const parsedBudget = parseArgs(['--budget-mib', '30720']);
  expect(parsedBudget.budgetMiB === 30720n, '--budget-mib must populate budgetMiB');
  const base = { n1: 64n, n2: 64n, n3: 1024n, ranks: 1n, rank: 0n };
  const f28 = footprint(base, 28);
  const f22 = footprint(base, 22);
  expect(f28.benchmarkDevice === 320n * MiB, '64x64x1024 benchmark arrays must be 320 MiB');
  expect(f28.planDevice === 31n * 128n * 1024n + 64n + 4096n * INT32, 'P=1 28-slot plan byte count mismatch');
  expect(f28.devicePersistent - f22.devicePersistent === 576n * 1024n, 'P=1 28->22 saving mismatch');
  const p2 = footprint({ ...base, ranks: 2n, rank: 0n }, 28);
  expect(p2.benchmarkDevice === 160n * MiB, 'P=2 local benchmark array count mismatch');
  expect(p2.planDevice === f28.planDevice + 64n, 'balanced P=2 plan must differ only by device descriptors');
  const safe = footprint({ n1: 256n, n2: 256n, n3: 1024n, ranks: 1n, rank: 0n }, 28);
  expect(safe.devicePersistent < 30n * GiB, 'safe A100 candidate exceeds 30 GiB budget');
  const reject = footprint({ n1: 512n, n2: 512n, n3: 2048n, ranks: 1n, rank: 0n }, 28);
  expect(reject.devicePersistent > 30n * GiB, 'controlled rejection candidate does not exceed 30 GiB budget');
  console.log('penta capacity model self-test: cases=6 failures=0');
}
function printModel(model, budgetMiB) {
  console.log(`config: Nsys=${model.nsys}, local_Nrow=${model.nrow}, local_tmp_N=${model.tmpN}, slots=${model.slots}`);
  console.log(`device benchmark arrays (10xNsysxNrow FP64): ${textBytes(model.benchmarkDevice)}`);
  console.log(`device plan: rd=${textBytes(model.rd)}, Atr=${textBytes(model.atr)}, Dtr=${textBytes(model.dtr)}, Drd=${textBytes(model.drd)}, BIGbuf_A=${textBytes(model.bigbufA)}, BIGbuf_B=${textBytes(model.bigbufB)}, descriptors=${textBytes(model.deviceDescriptors)}, pivot_status=${textBytes(model.pivotDevice)}`);
  console.log(`device persistent total: ${textBytes(model.devicePersistent)}`);
  console.log(`host persistent (B_h/R_h + descriptors + pivot_status): ${textBytes(model.hostPersistent)}`);
  console.log(`host staging peak (forward/backward max): ${textBytes(model.hostStagePeak)}; host peak with staging: ${textBytes(model.hostPeakWithStaging)}`);
  if (budgetMiB === null) return true;
  const budget = budgetMiB * MiB;
  const fit = model.devicePersistent <= budget;
  console.log(`device budget: ${textBytes(budget)}; classification: ${fit ? 'FIT' : 'REJECT'}`);
  return fit;
}
function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selfTest) { selfTest(); return; }
  const m28 = footprint(options, 28);
  const m22 = footprint(options, 22);
  console.log('== 28-slot current implementation ==');
  const fit28 = printModel(m28, options.budgetMiB);
  console.log('\n== 22-slot projected implementation (not yet in Fortran) ==');
  printModel(m22, options.budgetMiB);
  console.log(`\n28->22 projected device saving: ${textBytes(m28.devicePersistent - m22.devicePersistent)}`);
  if (options.requireFit && !fit28) process.exit(2);
}
try { main(); } catch (error) { console.error(`penta capacity model FAILED: ${error.message}`); process.exit(1); }
