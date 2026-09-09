'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const entry=path.join(__dirname,'verify-archive.cjs'),out=path.resolve(__dirname,'..'),root=path.resolve(out,'../../../../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function api(){assert.ok(fs.existsSync(entry),'G2 fixed-version verifier must exist');return require(entry);}
function fixture(){
  const m=JSON.parse(fs.readFileSync(out+'/input-manifest.json')),files=new Map();
  for(const x of [...m.documents,...m.evidence,m.attributes])files.set(x.path,fs.readFileSync(path.join(root,x.path)));
  for(const d of m.documents)files.set(d.snapshot,fs.readFileSync(path.join(root,d.snapshot)));
  return {m,files};
}
test('verifies the 17 attributed documents, 194 evidence files and sole candidate link correction',()=>{
  const {m,files}=fixture();assert.deepEqual(api().verifyPayload(files,m),{documents:17,evidenceFiles:194,queueCorrections:1,sourceSnapshotsRestorable:true});
});
test('rejects an altered static document even if its candidate SHA is updated',()=>{
  const {m,files}=fixture(),d=m.documents[0],b=Buffer.concat([files.get(d.path),Buffer.from('extra')]);files.set(d.path,b);d.sha256=sha(b);d.bytes=b.length;
  assert.throws(()=>api().verifyPayload(files,m),/source preservation/);
});
test('rejects extra queue edits even if candidate SHA is updated',()=>{
  const {m,files}=fixture(),d=m.documents.find(x=>x.id==='09'),b=Buffer.concat([files.get(d.path),Buffer.from('changed task state')]);files.set(d.path,b);d.sha256=sha(b);d.bytes=b.length;
  assert.throws(()=>api().verifyPayload(files,m),/sole queue correction/);
});
test('rejects evidence loss and same-length corruption',()=>{
  const {m,files}=fixture(),f=m.evidence[0],original=files.get(f.path);files.delete(f.path);
  assert.throws(()=>api().verifyPayload(files,m),/missing/);const b=Buffer.from(original);b[0]^=1;files.set(f.path,b);
  assert.throws(()=>api().verifyPayload(files,m),/SHA/);
});
test('rejects source snapshot newline conversion',()=>{
  const {m,files}=fixture(),d=m.documents[0],b=Buffer.from(files.get(d.snapshot).toString().replace(/\r?\n/g,'\r\n'));
  assert.notEqual(sha(b),d.sourceSha256);files.set(d.snapshot,b);
  assert.throws(()=>api().verifyPayload(files,m),/source SHA/);
});
test('rejects manifest path expansion into solver sources',()=>{
  const {m,files}=fixture();m.documents[0].path='CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90';
  assert.throws(()=>api().verifyPayload(files,m),/17 document paths/);
});
test('rejects evidence path escape and arbitrary Git change scope',()=>{
  const {m,files}=fixture();m.evidence[0].path='../outside.txt';assert.throws(()=>api().verifyPayload(files,m),/evidence path/);
  assert.throws(()=>api().verifyChangeScope(['solver.f90'],['README.md']),/change scope/);
});
test('rejects deletion of an old G1 path disguised as a rename into an allowed path',()=>{
  const os=require('node:os'),{spawnSync}=require('node:child_process');
  const tmp=path.resolve(os.tmpdir()),repo=fs.mkdtempSync(path.join(tmp,'kb-gov-010-rename-'));
  const git=(args)=>{const r=spawnSync('git',['-c','core.hooksPath='+path.join(repo,'empty-hooks'),'-c','commit.gpgsign=false','-c','user.name=KB-GOV-010 Test','-c','user.email=test@example.invalid',...args],{cwd:repo,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
  try{
    git(['init','--quiet']);fs.mkdirSync(path.join(repo,'empty-hooks'));
    fs.writeFileSync(path.join(repo,'old.txt'),'historical evidence\n');git(['add','old.txt']);git(['commit','--quiet','-m','baseline']);const base=git(['rev-parse','HEAD']);
    fs.renameSync(path.join(repo,'old.txt'),path.join(repo,'new.txt'));git(['add','--','old.txt','new.txt']);
    assert.equal(git(['diff','--cached','--name-only','--find-renames',base]),'new.txt','reproduce rename hiding the deleted old path');
    const staged=api().changedPaths(repo,base,'--staged');
    git(['commit','--quiet','-m','rename fixture']);const committed=api().changedPaths(repo,base,git(['rev-parse','HEAD']));
    for(const names of [staged,committed]){
      assert.deepEqual(names.sort(),['new.txt','old.txt'],'scope must expose old-path deletion');
      assert.throws(()=>api().verifyChangeScope(names,['new.txt']),/change scope/);
    }
  }finally{
    assert.equal(path.dirname(path.resolve(repo)),tmp);assert.ok(path.basename(repo).startsWith('kb-gov-010-rename-'));
    fs.rmSync(repo,{recursive:true,force:true});
  }
});
