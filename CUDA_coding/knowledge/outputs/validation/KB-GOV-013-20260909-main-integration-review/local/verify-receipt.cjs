'use strict';
// Long-term read-only entry. All reads are relative to this receipt, never live documents or Git.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const MANIFEST_SHA='9f8eb7d5b036c882288aceef291f12e9baacd02aa327cbfc2b38ccf232fdf19b';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=f=>typeof f==='string'&&f.length>0&&!path.isAbsolute(f)&&!/[\\:\x00-\x1f]/.test(f)&&!f.split('/').some(s=>s===''||s==='.'||s==='..');
function replaceOnce(text,before,after){assert.equal(text.split(before).length,2,'unique closeout/proposal anchor');return text.replace(before,after);}
function verifyRelationships(read){
  const json=f=>JSON.parse(read(f)),m=json('inputs.json'),plan=json('integration-paths.json'),p=json('proposals.json'),extra=json('additional-dependencies.json');
  assert.equal(m.task,'KB-GOV-013');assert.equal(m.documents.length,27);assert.equal(p.edits.length,9);
  const expected=[...m.archivePaths.map(x=>x.path),m.documents.find(x=>x.id==='27').path,...m.missingLintTargets.map(x=>x.path),...extra.files.map(x=>x.path)].sort();
  assert.equal(expected.length,717);assert.equal(new Set(expected).size,717);
  assert.deepEqual(plan.rows.map(x=>x.path).sort(),expected,'integration path scope');
  assert.ok(plan.rows.every(x=>!x.path.startsWith('CUDA_coding/CUDA_code/')),'software path scope');
  assert.deepEqual(read('integration-paths.nul'),Buffer.from(plan.rows.map(x=>x.path+'\0').join('')),'NUL list matches JSON');
  const trees=Object.fromEntries(['main','g1','g2','g3','kb002'].map(k=>[k,new Map(json('raw/trees/'+k+'.json').map(x=>[x.path,x]))]));
  const treeDelta=[...new Set([...trees.main.keys(),...trees.g3.keys()])].filter(f=>trees.main.get(f)?.blob!==trees.g3.get(f)?.blob||trees.main.get(f)?.mode!==trees.g3.get(f)?.mode).sort();
  assert.deepEqual(treeDelta,m.archivePaths.map(x=>x.path).sort(),'recorded fixed-tree delta');assert.equal(treeDelta.length,701);
  for(const d of m.documents)for(const [kind,v]of Object.entries(d.versions))if(v){const b=read(v.snapshot);assert.equal(sha(b),v.sha256,'snapshot SHA: '+d.path);assert.equal(b.length,v.bytes);const blob=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');assert.equal(blob,v.blob);if(kind!=='live')assert.equal(blob,trees[kind].get(d.path).blob);}
  for(const x of [...m.missingLintTargets,...extra.files]){const b=read(x.snapshot);assert.equal(sha(b),x.sha256);assert.equal(b.length,x.bytes);for(const k of ['main','g2','g3','kb002'])assert.ok(!trees[k].has(x.path));}
  for(const e of p.edits){
    const d=m.documents.find(d=>d.path===e.path),live=read(e.baselineSnapshot||d.versions.live.snapshot);assert.equal(sha(live),e.before);let candidate=live.toString();
    if(d.classification==='G3-annotation-delta'){
      candidate=read(d.versions.g3.snapshot).toString();for(const step of e.steps.slice(1))candidate=replaceOnce(candidate,step.before,step.after);
      assert.match(candidate,/^status: draft\r?$/m);
    }else if(d.id==='25'){
      candidate=read(d.versions.g3.snapshot).toString();const rows=candidate.match(/^\| SRC-03[23] \|[^\r\n]*\r?\n/gm);assert.equal(rows.length,2);
      assert.equal(candidate.replace(/^\| SRC-03[23] \|[^\r\n]*\r?\n/gm,''),live.toString(),'only two registry rows');
    }else if(d.id==='26')candidate+=e.steps[0].suffix;
    else if(d.id==='27')for(const step of e.steps)candidate=replaceOnce(candidate,step.before,step.after);
    else assert.fail('unexpected proposal path');
    const bytes=read(e.snapshot);assert.deepEqual(bytes,Buffer.from(candidate),'exact proposal replay: '+e.path);assert.equal(sha(bytes),e.after);assert.equal(bytes.length,e.bytes);
    assert.equal(plan.rows.find(x=>x.path===e.path).proposedSha256,e.after);
  }
  const concurrent=json('concurrent-g1-review.json'),newTree=new Map(json('raw/trees/concurrent-main.json').map(x=>[x.path,x]));
  const observed=[...new Set([...trees.main.keys(),...newTree.keys()])].filter(f=>trees.main.get(f)?.blob!==newTree.get(f)?.blob||trees.main.get(f)?.mode!==newTree.get(f)?.mode).sort();
  assert.deepEqual(observed,[...concurrent.observedCommitScope].sort());assert.equal(observed.length,221);
  for(const f of observed)assert.deepEqual(newTree.get(f),trees.g1.get(f),'exact concurrent G1 tree identity');
  const attrs=read(concurrent.attributeBaseline.snapshot);assert.deepEqual(attrs,Buffer.concat([read('raw/documents/26-live.txt'),Buffer.from(concurrent.attributeBaseline.append)]),'reviewed concurrent attribute append');
  assert.equal(sha(attrs),concurrent.attributeBaseline.sha256);assert.equal(plan.alreadyVersionedEvidencePaths,220);assert.equal(plan.remainingStaticChangedPaths,497);
  const close=json('local/main-closeout.json');assert.equal(close.changes.length,3);
  const allowed=['task-queue.md','task-blocker-register.md','compile-log.md'].map(f=>'CUDA_coding/knowledge/meta/'+f).sort();assert.deepEqual(close.changes.map(x=>x.path).sort(),allowed,'closeout scope');
  for(const c of close.changes){const before=read(c.beforeSnapshot),after=read(c.afterSnapshot);assert.equal(sha(before),c.beforeSha256,'closeout before SHA');assert.equal(sha(after),c.afterSha256,'closeout after SHA');let forward=before.toString(),inverse=after.toString();for(const e of c.edits)forward=replaceOnce(forward,e.before,e.after);for(const e of [...c.edits].reverse())inverse=replaceOnce(inverse,e.after,e.before);assert.deepEqual(Buffer.from(forward),after,'exact closeout');assert.deepEqual(Buffer.from(inverse),before,'inverse closeout');}
  const projection=json('local/projected-wikilinks-final.json');assert.equal(projection.errors,0);assert.equal(projection.addedPaths.length,2);
  return {paths:717,primarySnapshots:27,historicalDocuments:15,proposals:9,closeoutRecords:3,scope:'fixed receipt integrity and recorded relationships; no live tree/Git/GPU verification'};
}
function verifyReceipt(read){
  const bytes=read('receipt-manifest.json');assert.equal(sha(bytes),MANIFEST_SHA,'fixed receipt manifest seal');const m=JSON.parse(bytes);assert.equal(m.task,'KB-GOV-013');assert.equal(new Set(m.files.map(x=>x.path)).size,m.files.length);
  for(const x of m.files){assert.ok(safe(x.path),'unsafe receipt path');const b=read(x.path);assert.equal(sha(b),x.sha256,'payload SHA: '+x.path);assert.equal(b.length,x.bytes,'payload size: '+x.path);}
  return {...verifyRelationships(read),sealedFiles:m.files.length};
}
module.exports={verifyReceipt,verifyRelationships};
if(require.main===module){try{assert.equal(process.argv.length,2,'usage: node verify-receipt.cjs');const O=path.resolve(__dirname,'..');const result=verifyReceipt(f=>{assert.ok(safe(f));return fs.readFileSync(path.join(O,f));});console.log(JSON.stringify(result,null,2));console.log('KB-GOV-013 FIXED RECEIPT: PASS');}catch(e){console.error('KB-GOV-013 FIXED RECEIPT: FAIL\n'+e.message);process.exitCode=1;}}
