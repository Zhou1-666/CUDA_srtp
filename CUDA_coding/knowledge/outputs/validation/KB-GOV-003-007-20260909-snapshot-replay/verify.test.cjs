'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const entry=path.join(__dirname,'verify.cjs'),repo=path.resolve(__dirname,'../../../../..');
function api(){assert.ok(fs.existsSync(entry),'fixed-snapshot replay entry must exist');return require(entry);}
let frozen;
function inputs(){return frozen||(frozen=api().loadArchive(repo));}

test('replays all five historical batches with explicit coverage, without a live-workspace verdict',()=>{
  const result=api().verifyArchive(inputs());
  assert.deepEqual(result.tasks.map(t=>[t.task,t.status]),['003','004','005','006','007'].map(t=>[t,'PASS']));
  assert.deepEqual(result.tasks.map(t=>t.coverage.linkMappings||0),[241,100,181,206,0]);
  assert.equal(result.tasks[3].coverage.archivedRecords,142);
  assert.equal(result.tasks[3].coverage.frozenMilestones,22);
  assert.equal(result.tasks[4].coverage.verdicts,13);
  for(const task of result.tasks)assert.ok(task.notRun.includes('LIVE_WORKSPACE_AND_GIT_PROTECTION'));
});
test('permits selecting 003 alone and rejects unsupported task numbers',()=>{
  assert.deepEqual(api().verifyArchive(inputs(),['003']).tasks.map(t=>t.task),['003']);
  assert.throws(()=>api().verifyArchive(inputs(),['008']),/task/);
});
test('rejects a missing frozen input instead of reporting a partial pass',()=>{
  const data=new Map(inputs());data.delete([...data.keys()].find(k=>k.endsWith('penta-active-context.snapshot.md')));
  assert.throws(()=>api().verifyArchive(data),/missing|inventory/);
});
test('rejects same-length snapshot corruption',()=>{
  const data=new Map(inputs()),key=[...data.keys()].find(k=>k.endsWith('penta-active-context.snapshot.md'));
  const bytes=Buffer.from(data.get(key));bytes[100]^=1;data.set(key,bytes);
  assert.throws(()=>api().verifyArchive(data),/SHA/);
});
test('rejects a replaced manifest even if it could bless changed content',()=>{
  const data=new Map(inputs()),key=[...data.keys()].find(k=>k.endsWith('/input-manifest.json'));
  data.set(key,Buffer.from('{}'));
  assert.throws(()=>api().verifyArchive(data),/manifest SHA/);
});
test('reverses links lexically, preserving aliases and anchors without opening target files',()=>{
  const records=[{before:'../wiki/page#anchor|label',after:'../../../wiki/page.md#anchor|label',target:'K/wiki/page.md',fragment:'#anchor'}];
  assert.equal(api().restoreLinks('[[../../../wiki/page.md#anchor|label]]','K/outputs/validation/run/snapshot.md',records,'K/meta/queue.md'),'[[../wiki/page#anchor|label]]');
});
test('rejects a relocation to a different target or a changed anchor',()=>{
  const record={before:'../wiki/page#anchor',after:'../../../wiki/page.md#anchor',target:'K/wiki/page.md',fragment:'#anchor'};
  assert.throws(()=>api().restoreLinks('[[../../../wiki/wrong.md#anchor]]','K/outputs/validation/run/snapshot.md',[{...record,after:'../../../wiki/wrong.md#anchor'}],'K/meta/queue.md'),/target/);
  assert.throws(()=>api().restoreLinks('[[../../../wiki/page.md#wrong]]','K/outputs/validation/run/snapshot.md',[{...record,after:'../../../wiki/page.md#wrong'}],'K/meta/queue.md'),/anchor/);
});
test('rejects dropped mappings and unapproved historical link corrections',()=>{
  assert.throws(()=>api().restoreLinks('[[../../../wiki/page.md]]','K/outputs/validation/run/snapshot.md',[],'K/meta/queue.md'),/mapping/);
  const record={before:'bad.md',after:'../../../wiki/page.md',target:'K/wiki/page.md',fragment:'',correction:'invented'};
  assert.throws(()=>api().restoreLinks('[[../../../wiki/page.md]]','K/outputs/validation/run/snapshot.md',[record],'K/meta/queue.md'),/correction/);
});
test('CLI works from an unrelated working directory',()=>{
  api();const r=spawnSync(process.execPath,[entry,'003'],{cwd:os.tmpdir(),encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/KB-GOV-003 SNAPSHOT REPLAY: PASS/);
  assert.doesNotMatch(r.stdout,/KB-GOV-004 SNAPSHOT REPLAY: PASS/);
});
test('missing pinned Git objects fail clearly without silently switching to HEAD',()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'kb-replay-no-git-'));
  try{assert.throws(()=>api().loadArchive(folder),/pinned G1 commit/);}finally{fs.rmdirSync(folder);}
});
