'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const {verifyReceipt,verifyRelationships}=require('./verify-receipt.cjs');
const O=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(O,f));
test('fixed receipt reads only its own payload; no live root or Git required',()=>{
  const names=[];const result=verifyReceipt(f=>{names.push(f);assert.ok(!path.isAbsolute(f)&&!f.split('/').includes('..'));return read(f);});
  assert.equal(result.paths,717);assert.equal(result.proposals,9);assert.equal(result.closeoutRecords,3);assert.ok(names.includes('raw/documents/08-live.txt'));
});
test('missing frozen input fails',()=>assert.throws(()=>verifyReceipt(f=>{if(f==='raw/documents/08-live.txt')throw Error('fixture missing');return read(f);}),/missing/));
test('changed old snapshot fails without rewriting the expected SHA',()=>assert.throws(()=>verifyReceipt(f=>f==='raw/documents/08-live.txt'?Buffer.concat([read(f),Buffer.from('changed')]):read(f)),/payload SHA/));
test('editing captured expectations also fails manifest seal',()=>assert.throws(()=>verifyReceipt(f=>f==='inputs.json'?Buffer.from('{}'):read(f)),/payload SHA/));
test('solver path cannot be smuggled into a proposed integration list',()=>assert.throws(()=>verifyRelationships(f=>{
  if(f!=='integration-paths.json')return read(f);const m=JSON.parse(read(f));m.rows[0].path='CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90';return Buffer.from(JSON.stringify(m));
}),/path scope/));
test('unrelated rolling-meta change cannot hide in closeout evidence',()=>assert.throws(()=>verifyRelationships(f=>{
  if(f!=='local/main-closeout/1-after.txt')return read(f);return Buffer.concat([read(f),Buffer.from('\nTASK-031 done')]);
}),/closeout|SHA/));
