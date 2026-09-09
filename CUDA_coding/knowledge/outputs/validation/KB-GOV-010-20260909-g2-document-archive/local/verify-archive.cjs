'use strict';
// Verify an explicit immutable Git commit, or the isolated candidate's staged bytes.
// This entry never reads historical m.root or requires the main workspace to stay still.
const assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-010-20260909-g2-document-archive';
const G1='ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67';
const ROOTS=['CUDA_coding/knowledge/outputs/validation/KB-GOV-009-20260909-g2-ownership-review','CUDA_coding/knowledge/outputs/validation/KB-GOV-003-007-20260909-snapshot-replay'];
const DOCS=['AGENTS.md','README.md','CUDA_coding/knowledge/00-index.md','CUDA_coding/knowledge/meta/README.md','CUDA_coding/knowledge/meta/knowledge-compiler.md','CUDA_coding/knowledge/meta/change-impact-map.md','CUDA_coding/knowledge/meta/task-handoff-protocol.md','CUDA_coding/knowledge/meta/task-blocker-register.md','CUDA_coding/knowledge/meta/task-queue.md','CUDA_coding/knowledge/meta/compile-log.md','CUDA_coding/knowledge/wiki/00-index.md','CUDA_coding/knowledge/wiki/briefs/current-project-brief.md','CUDA_coding/knowledge/wiki/systems/data-ownership-and-lifetime.md','CUDA_coding/程序正确性与性能运行手册.md','CUDA_coding/代码地图与复现指南.md','CUDA_coding/GPT主力开发执行指南.md','CUDA_coding/knowledge/wiki/briefs/penta-active-context.md'];
const OLD_LINK='](outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md)';
const NEW_LINK='](../outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md)';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=f=>typeof f==='string'&&!path.isAbsolute(f)&&!f.includes('\\')&&!f.split('/').includes('..');
function validateManifest(m){
  assert.equal(m.task,'KB-GOV-010');assert.equal(m.g1,G1);
  assert.deepEqual(m.documents.map(d=>d.path),DOCS,'exact 17 document paths');
  assert.deepEqual(m.evidenceRoots,ROOTS,'explicit reviewed evidence roots');
  assert.equal(m.evidence.length,194,'reviewed evidence inventory');
  assert.equal(new Set(m.evidence.map(f=>f.path)).size,194,'unique evidence paths');
  for(const f of m.evidence)assert.ok(safe(f.path)&&ROOTS.some(r=>f.path.startsWith(r+'/')),'invalid evidence path');
  for(const d of m.documents)assert.ok(safe(d.snapshot)&&d.snapshot.startsWith(OWN+'/raw/'),'source snapshot path');
  assert.equal(m.attributes.path,'.gitattributes');
  assert.deepEqual([m.correction.path,m.correction.oldLink,m.correction.newLink],[DOCS[8],OLD_LINK,NEW_LINK],'sole approved correction');
}
function verifyPayload(files,m){
  validateManifest(m);const read=f=>{assert.ok(files.has(f),'missing archive file: '+f);return files.get(f);};
  for(const d of m.documents){
    const source=read(d.snapshot),actual=read(d.path);assert.equal(hash(source),d.sourceSha256,'source SHA: '+d.path);
    if(d.path===DOCS[8]){
      const text=source.toString('utf8');assert.equal(text.split(OLD_LINK).length,2,'one old queue link');
      assert.deepEqual(actual,Buffer.from(text.replace(OLD_LINK,NEW_LINK)),'sole queue correction');
    }else assert.deepEqual(actual,source,'source preservation: '+d.path);
    assert.equal(actual.length,d.bytes,'document bytes: '+d.path);assert.equal(hash(actual),d.sha256,'document SHA: '+d.path);
  }
  for(const f of [...m.evidence,m.attributes]){const bytes=read(f.path);assert.equal(bytes.length,f.bytes,'bytes: '+f.path);assert.equal(hash(bytes),f.sha256,'SHA: '+f.path);}
  return {documents:17,evidenceFiles:194,queueCorrections:1,sourceSnapshotsRestorable:true};
}
function verifyChangeScope(actual,expected){assert.deepEqual([...actual].sort(),[...expected].sort(),'Git change scope');}
function gitRead(repo,args,input){const r=spawnSync('git',args,{cwd:repo,input,maxBuffer:60e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.error?.message||r.stderr?.toString());return r.stdout;}
function changedPaths(repo,base,revision){
  return gitRead(repo,revision==='--staged'?['diff','--cached','--no-renames','--name-only','-z',base]:['diff','--no-renames','--name-only','-z',base,revision]).toString().split('\0').filter(Boolean);
}
function verifyCommit(repo,revision){
  const staged=revision==='--staged';assert.ok(staged||/^[0-9a-f]{40}$/.test(revision),'supply a full immutable commit SHA or --staged');
  const git=(args,input)=>gitRead(repo,args,input);
  const object=f=>(staged?'':revision)+':'+f;
  const manifestBytes=git(['show',object(OWN+'/input-manifest.json')]),m=JSON.parse(manifestBytes);validateManifest(m);
  const receiptBytes=git(['show',object(OWN+'/archive-files.json')]),receipt=JSON.parse(receiptBytes);
  assert.ok(Array.isArray(receipt.files)&&receipt.files.length>0,'receipt files');
  for(const f of receipt.files)assert.ok(safe(f)&&f.startsWith(OWN+'/')&&f!==OWN+'/archive-files.json','own receipt path');
  const ownFiles=[...receipt.files,OWN+'/archive-files.json'];assert.equal(new Set(ownFiles).size,ownFiles.length,'unique receipt files');
  const allowed=[...DOCS,...m.evidence.map(f=>f.path),...ownFiles,'.gitattributes'];assert.equal(new Set(allowed).size,allowed.length);
  const names=changedPaths(repo,G1,revision);
  verifyChangeScope(names,allowed);git(['merge-base','--is-ancestor',G1,staged?'HEAD':revision]);
  const stream=git(['cat-file','--batch'],allowed.map(f=>object(f)+'\n').join('')),files=new Map();let offset=0;
  for(const f of allowed){
    const end=stream.indexOf(10,offset),header=stream.subarray(offset,end).toString(),match=/^[0-9a-f]+ blob (\d+)$/.exec(header);
    assert.ok(match,'missing blob: '+f);const size=Number(match[1]);assert.equal(stream[end+size+1],10,'blob boundary');
    files.set(f,stream.subarray(end+1,end+1+size));offset=end+size+2;
  }
  assert.equal(offset,stream.length);assert.deepEqual(files.get(OWN+'/input-manifest.json'),manifestBytes);assert.deepEqual(files.get(OWN+'/archive-files.json'),receiptBytes);
  const summary=verifyPayload(files,m);
  const expectedAttrs=Buffer.concat([git(['show',G1+':.gitattributes']),Buffer.from('\n# KB-GOV-010: preserve selected G2 documents and evidence bytes.\n'+DOCS.map(f=>'/'+f+' -text\n').join('')+[...ROOTS,OWN].map(f=>'/'+f+'/** -text\n').join(''))]);
  assert.deepEqual(files.get('.gitattributes'),expectedAttrs,'exact byte attributes, original G1 rules preserved');
  const paths=staged?git(['ls-files','-z']).toString().split('\0').filter(Boolean):git(['ls-tree','-r','--name-only','-z',revision]).toString().split('\0').filter(Boolean);
  verifyChangeScope(paths.filter(f=>f.startsWith(OWN+'/')),ownFiles);
  for(const r of ROOTS)verifyChangeScope(paths.filter(f=>f.startsWith(r+'/')),m.evidence.filter(f=>f.path.startsWith(r+'/')).map(f=>f.path));
  if(staged){
    assert.equal(git(['diff','--name-only']).toString(),'','unstaged changes in candidate');
    assert.equal(git(['ls-files','--others','--exclude-standard']).toString(),'','untracked candidate files');
  }
  return {...summary,mode:staged?'staged':'fixed-commit',commit:staged?null:revision,g1:G1,receiptFiles:ownFiles.length,checkedGitBlobs:allowed.length,gitChangeScopeExact:true,originalG1Preserved:true,notRun:['CURRENT_MAIN_WORKSPACE_PROTECTION','HISTORICAL_VERIFY_SCRIPTS','FULL_KNOWLEDGE_DEPENDENCY_CLOSURE','CUDA_MPI_GPU_VALIDATION']};
}
module.exports={verifyPayload,verifyChangeScope,verifyCommit,changedPaths};
if(require.main===module){
  try{
    assert.equal(process.argv.length,3,'usage: node verify-archive.cjs <40-character-commit-SHA> | --staged');
    const result=verifyCommit(path.resolve(__dirname,'../../../../../..'),process.argv[2]);
    console.log(JSON.stringify(result,null,2));console.log('KB-GOV-010 ARCHIVE: PASS');
  }catch(error){console.error('KB-GOV-010 ARCHIVE: FAIL\n'+error.message);process.exitCode=1;}
}
