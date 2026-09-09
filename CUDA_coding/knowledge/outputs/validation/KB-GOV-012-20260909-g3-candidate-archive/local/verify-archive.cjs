'use strict';
// Public read-only entry: verify an explicit fixed commit, never the live main tree.
const assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive';
const G2='669182cf4879aa3ebc9976533178bce0214d4dbc',KB002='09a97586fbcce952cdd3ac233e25082cbc842220';
const MANIFEST_SHA='80ce33f7db0ae2ec201979a92e85f8606241d3cd3b430687cba16ae31aa31518';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const safePath=f=>typeof f==='string'&&f.length>0&&!path.isAbsolute(f)&&!/[\\:\x00-\x1f]/.test(f)&&!f.split('/').some(x=>x==='..'||x==='.'||x==='');
const verifyChangeScope=(actual,expected)=>assert.deepEqual([...actual].sort(),[...expected].sort(),'Git change scope');
function validateManifestBytes(b){assert.equal(hash(b),MANIFEST_SHA,'fixed input manifest SHA');const m=JSON.parse(b);assert.equal(m.task,'KB-GOV-012');assert.equal(m.g2,G2);assert.equal(m.kb002,KB002);assert.equal(m.documents.length,7);assert.equal(m.evidence.length,86);return m;}
function applyEdits(source,edits){let t=source.toString('utf8');for(const e of edits){assert.ok(t.includes(e.before),'edit anchor missing');if(!e.firstOnly)assert.equal(t.split(e.before).length,2,'unique edit anchor');t=t.replace(e.before,e.after);}return Buffer.from(t);}
function verifyPayload(files,m){
  const read=f=>{assert.ok(safePath(f),'unsafe archive path');assert.ok(files.has(f),'missing archive file: '+f);return files.get(f);};
  for(const d of m.documents){const original=read(d.snapshot),candidate=read(d.path);assert.equal(hash(original),d.sourceSha256,'source SHA: '+d.path);assert.deepEqual(candidate,applyEdits(original,d.edits),'exact candidate edits: '+d.path);assert.equal(hash(candidate),d.sha256,'candidate SHA');assert.equal(candidate.length,d.bytes,'candidate bytes');assert.match(candidate.toString(),/^status: draft\r?$/m);}
  assert.equal(m.documents[6].edits.length,0,'SOP must remain unchanged');assert.equal(m.documents.filter(x=>x.edits.length).length,6);
  const r=m.registry,original=read(r.snapshot);assert.equal(hash(original),r.sourceSha256,'registry source SHA');assert.deepEqual(read(r.path),applyEdits(original,[r.edit]),'exact registry addition');assert.equal(hash(read(r.path)),r.sha256,'registry SHA');assert.equal(read(r.path).length,r.bytes);
  for(const f of [...m.evidence,m.attributes]){const b=read(f.path);assert.equal(hash(b),f.sha256,'evidence SHA: '+f.path);assert.equal(b.length,f.bytes,'evidence bytes: '+f.path);}
  let sourceFiles=0;
  for(const src of m.sources){const b=read(src.manifest);assert.equal(hash(b),src.manifestSha256,'source collection manifest SHA');const collection=JSON.parse(b);assert.equal(collection.sourceId,src.id);assert.equal(collection.kb002Commit,KB002);assert.equal(collection.files.length,src.files);assert.deepEqual(collection.derivedFrom,src.id==='SRC-033'?['SRC-032']:[]);
    for(const f of collection.files){assert.ok(f.path.startsWith(src.root+'/'));const bytes=read(f.path);assert.equal(hash(bytes),f.sha256,'source collection SHA');assert.equal(bytes.length,f.bytes);const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');assert.equal(blob,f.kb002Blob,'recorded KB002 blob identity');sourceFiles++;}
    const lines=read(src.root+'/SHA256SUMS.txt').toString().trim().split(/\r?\n/);assert.equal(lines.length,src.id==='SRC-032'?21:1);for(const line of lines){const match=/^([0-9a-f]{64})\s+(.+)$/.exec(line);assert.ok(match,'source checksum syntax');assert.equal(hash(read(src.root+'/'+match[2])),match[1],'inherited source checksum');}
  }
  assert.equal(sourceFiles,26);
  const ids=[...read(r.path).toString().matchAll(/^\| (SRC-[^ ]+) \|/mg)].map(x=>x[1]);assert.equal(ids.length,35);assert.equal(new Set(ids).size,35);
  for(const d of m.documents){const idsLine=read(d.path).toString().match(/^source_ids: \[([^\]]+)\]/m);assert.ok(idsLine);for(const id of idsLine[1].split(',').map(x=>x.trim()))assert.ok(ids.includes(id),'registered candidate source ID');}
  return {documents:7,annotated:6,sopUnchanged:true,sourceRowsAdded:2,sourceFiles,evidenceFiles:86,sourceSnapshotsRestorable:true};
}
function gitRead(repo,args,input){const r=spawnSync('git',args,{cwd:repo,input,maxBuffer:80e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.error?.message||r.stderr?.toString());return r.stdout;}
function changedPaths(repo,base,revision){return gitRead(repo,revision==='--staged'?['diff','--cached','--no-renames','--name-only','-z',base]:['diff','--no-renames','--name-only','-z',base,revision]).toString().split('\0').filter(Boolean);}
function verifyCommit(repo,revision){
  const staged=revision==='--staged';assert.ok(staged||/^[0-9a-f]{40}$/.test(revision),'supply full immutable commit SHA or --staged');const git=(args,input)=>gitRead(repo,args,input),object=f=>(staged?'':revision)+':'+f;
  if(!staged)assert.equal(git(['rev-parse',revision+'^{commit}']).toString().trim(),revision,'fixed commit object required');
  git(['merge-base','--is-ancestor',G2,staged?'HEAD':revision]);
  const mbytes=git(['show',object(OWN+'/input-manifest.json')]),m=validateManifestBytes(mbytes),receiptBytes=git(['show',object(OWN+'/archive-files.json')]),receipt=JSON.parse(receiptBytes);
  assert.equal(receipt.task,'KB-GOV-012');assert.ok(Array.isArray(receipt.files)&&receipt.files.length>0);
  for(const f of receipt.files)assert.ok(safePath(f)&&f.startsWith(OWN+'/')&&f!==OWN+'/archive-files.json','own receipt path');
  const ownFiles=[...receipt.files,OWN+'/archive-files.json'];assert.equal(new Set(ownFiles).size,ownFiles.length);
  const allowed=[...m.documents.map(x=>x.path),m.registry.path,...m.evidence.map(x=>x.path),...ownFiles,'.gitattributes'];assert.equal(new Set(allowed).size,allowed.length);
  verifyChangeScope(changedPaths(repo,G2,revision),allowed);
  const tree=staged?git(['ls-files','--stage','-z']):git(['ls-tree','-r','-z',revision]);
  const records=tree.toString().split('\0').filter(Boolean).map(t=>{const i=t.indexOf('\t');return {path:t.slice(i+1),header:t.slice(0,i)};});
  verifyChangeScope(records.filter(x=>x.path.startsWith(OWN+'/')).map(x=>x.path),ownFiles);
  for(const f of allowed){const record=records.find(x=>x.path===f);assert.ok(record&&record.header.startsWith('100644 '),'regular non-executable archive file: '+f);}
  const stream=git(['cat-file','--batch'],allowed.map(f=>object(f)+'\n').join('')),files=new Map();let offset=0;
  for(const f of allowed){const end=stream.indexOf(10,offset),match=/^[0-9a-f]+ blob (\d+)$/.exec(stream.subarray(offset,end).toString());assert.ok(match,'missing blob: '+f);const size=Number(match[1]);assert.equal(stream[end+size+1],10,'blob boundary');files.set(f,stream.subarray(end+1,end+1+size));offset=end+size+2;}
  assert.equal(offset,stream.length);assert.deepEqual(files.get(OWN+'/input-manifest.json'),mbytes);assert.deepEqual(files.get(OWN+'/archive-files.json'),receiptBytes);
  const result=verifyPayload(files,m);assert.deepEqual(files.get('.gitattributes'),Buffer.concat([git(['show',G2+':.gitattributes']),Buffer.from(m.attributes.append)]),'preserve G2 attributes plus exact approved additions');
  if(staged){assert.equal(git(['diff','--name-only']).toString(),'','unstaged candidate changes');assert.equal(git(['ls-files','--others','--exclude-standard']).toString(),'','untracked candidate files');}
  return {...result,mode:staged?'staged':'fixed-commit',commit:staged?null:revision,g2:G2,receiptFiles:ownFiles.length,checkedGitBlobs:allowed.length,gitChangeScopeExact:true,notRun:['LIVE_MAIN_WORKSPACE_PROTECTION','COMPLETE_KNOWLEDGE_DEPENDENCY_CLOSURE','HISTORICAL_FULL_VERIFIERS','MODEL_OR_GPU_REEXECUTION','PUBLICATION_OR_LICENSE_CLEARANCE']};
}
module.exports={verifyPayload,verifyCommit,verifyChangeScope,validateManifestBytes,safePath,changedPaths};
if(require.main===module){try{assert.equal(process.argv.length,3,'usage: node verify-archive.cjs <40-character-commit-SHA> | --staged');console.log(JSON.stringify(verifyCommit(path.resolve(__dirname,'../../../../../..'),process.argv[2]),null,2));console.log('KB-GOV-012 ARCHIVE: PASS');}catch(e){console.error('KB-GOV-012 ARCHIVE: FAIL\n'+e.message);process.exitCode=1;}}
