'use strict';
// One-time receipt-only adjustment after independently reviewed concurrent G1 integration.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const O=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(O,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),put=(f,b)=>fs.writeFileSync(path.join(O,f),b),write=(f,x)=>put(f,JSON.stringify(x,null,2)+'\n');
const c=json('concurrent-g1-review.json'),p=json('proposals.json'),plan=json('integration-paths.json'),e=p.edits.find(x=>x.path==='.gitattributes');
fs.writeFileSync(path.join(O,'raw/concurrent/proposals-before.json'),read('proposals.json'),{flag:'wx'});fs.writeFileSync(path.join(O,'raw/concurrent/attributes-proposal-before.txt'),read(e.snapshot),{flag:'wx'});
const baseline=read(c.attributeBaseline.snapshot),existing=new Set(baseline.toString().split(/\r?\n/).map(s=>s.trim()));
const needed=e.steps[0].suffix.split(/\r?\n/).filter(s=>s&&!s.startsWith('#')&&!existing.has(s.trim()));
e.before=c.attributeBaseline.sha256;e.baselineSnapshot=c.attributeBaseline.snapshot;e.steps=[{kind:'append-only-attributes',suffix:'\n# KB-GOV-014 proposed: preserve remaining reviewed governance bytes.\n'+needed.join('\n')+'\n'}];
const b=Buffer.concat([baseline,Buffer.from(e.steps[0].suffix)]);put(e.snapshot,b);e.after=sha(b);e.bytes=b.length;write('proposals.json',p);
const already=new Set(c.observedCommitScope.filter(x=>x!=='.gitattributes'));
for(const row of plan.rows){if(already.has(row.path)){row.action='retain-already-versioned-G1-exact-bytes';row.alreadyVersionedAt=c.acceptedHead;}if(row.path==='.gitattributes'){row.reviewedConcurrentIntakeSha256=e.before;row.proposedSha256=e.after;}}
plan.reviewedMainHead=c.acceptedHead;plan.originalIntakeHead=c.originalHead;plan.alreadyVersionedEvidencePaths=220;plan.remainingStaticChangedPaths=497;write('integration-paths.json',plan);
const diff=spawnSync('git',['diff','--no-index','--no-color','--',path.join(O,e.baselineSnapshot),path.join(O,e.snapshot)],{maxBuffer:2e6});assert.equal(diff.status,1);put('proposed/26.patch',diff.stdout);
const head=new Map(json('raw/trees/concurrent-main.json').map(x=>[x.path,x]));let delta=0;
for(const row of plan.rows){let bytes;if(row.proposal)bytes=read(row.proposal);else{const own=json('inputs.json'),d=own.documents.find(x=>x.path===row.path),h=[...own.missingLintTargets,...json('additional-dependencies.json').files].find(x=>x.path===row.path);bytes=d?read(d.versions.live.snapshot):h?read(h.snapshot):null;}
  const blob=bytes?crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'):row.g3Blob;if(blob!==head.get(row.path)?.blob)delta++;
}assert.equal(delta,497);console.log('CONCURRENT ADJUSTMENT: preserve old proposal; 220 already versioned; 497 remaining static differences; 9 unapplied proposals.');
