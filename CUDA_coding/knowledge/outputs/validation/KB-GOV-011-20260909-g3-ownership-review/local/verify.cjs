'use strict';
// Fixed receipt replay. Never read the live paths recorded inside audit evidence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const MANIFEST_SHA='6495dc31de9eb43a3eb5b5fb0d512c438410e7e19e8ee005ba2072be9d943c5d';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function verify(read){
 const get=f=>{const b=read(f);assert.ok(Buffer.isBuffer(b),'missing frozen file: '+f);return b;};
 const manifestBytes=get('frozen-manifest.json');assert.equal(sha(manifestBytes),MANIFEST_SHA,'manifest SHA');
 const manifest=JSON.parse(manifestBytes);assert.equal(manifest.task,'KB-GOV-011');assert.equal(manifest.files.length,29);
 const files=new Map();for(const f of manifest.files){
  assert.ok(!path.isAbsolute(f.path)&&!f.path.includes('\\')&&!f.path.split('/').includes('..'),'unsafe frozen path');
  assert.ok(!files.has(f.path),'duplicate frozen path');const b=get(f.path);assert.equal(b.length,f.bytes,'bytes: '+f.path);assert.equal(sha(b),f.sha256,'SHA: '+f.path);files.set(f.path,b);
 }
 const json=f=>JSON.parse(files.get(f)),input=json('inputs.json'),ledger=json('ownership-ledger.json'),dep=json('dependencies.json');
 assert.equal(input.task,'KB-GOV-011');assert.equal(input.pages.length,7);assert.equal(new Set(input.pages.map(p=>p.path)).size,7);
 assert.deepEqual(ledger.pages.map(p=>p.path),input.pages.map(p=>p.path));assert.equal(ledger.statusPromotion,false);
 const registry=files.get(input.context.find(c=>c.path.endsWith('/source-registry.md')).snapshot).toString();
 const actualLinks=[],actualExternal=[];
 for(const p of input.pages){
  const b=files.get(p.snapshot);assert.ok(b,'missing page snapshot');assert.equal(sha(b),p.sha256,'page SHA');assert.equal(p.metadata.status,'draft');assert.equal(p.matches010,true);
  for(const evidence of ledger.pages.find(x=>x.id===p.id).evidenceLocations)assert.ok(b.toString().split('\n')[evidence.line-1]?.includes(evidence.needle),'evidence line location');
  for(const id of p.metadata.source_ids)assert.ok(registry.split('\n').some(l=>l.startsWith('| '+id+' |')),'unregistered ID');
  const text=b.toString();for(const x of text.matchAll(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g)){
   const url=x[1]||x[3],line=text.slice(0,x.index).split('\n').length,target=url.split('|')[0].split('#')[0].replace(/^<|>$/g,'');if(!target)continue;
   if(/^https?:\/\//i.test(target)){actualExternal.push({source:p.path,line,url});continue;}
   let file=path.posix.normalize(path.posix.join(path.posix.dirname(p.path),target.replaceAll('\\','/')));if(x[1]&&!file.endsWith('.md'))file+='.md';
   actualLinks.push({source:p.path,line,url,target:file});
  }
 }
 assert.deepEqual(actualLinks,dep.links.map(({classification,...link})=>link),'literal local link replay');assert.deepEqual(actualExternal,dep.external,'external link inventory');
 assert.equal(dep.links.length,30);assert.equal(dep.external.length,6);assert.equal(dep.targets.length,47);assert.equal(new Set(dep.targets.map(t=>t.path)).size,47);
 for(const link of dep.links)assert.ok(dep.targets.some(t=>t.path===link.target&&t.kind!=='missing'),'captured target missing');
 assert.equal(dep.sources.length,11);assert.equal(dep.commands.length,11);assert.ok(dep.commands.every(c=>c.executed===false&&c.kind==='file'));
 for(const tree of Object.values(input.trees)){
  const b=files.get(tree.snapshot);assert.equal(sha(b),tree.sha256);const names=new Set(b.toString().split('\0').filter(Boolean).map(l=>l.split('\t')[1]));
  for(const p of input.pages)assert.equal(names.has(p.path),false,'G3 path already in captured fixed tree');
 }
 assert.equal(json('local/independent-inputs-check.json').matching,74);
 return {task:'KB-GOV-011',checkedFrozenFiles:files.size,pages:7,remainDraft:7,localLinks:30,externalLinks:6,localTargets:47,sourceIds:11,commandIdentities:11,capturedFixedTrees:4,notRun:['LIVE_WORKSPACE_PROTECTION','CURRENT_GIT_OR_VERSION_ARCHIVE','EXTERNAL_LINK_RECHECK','FULL_DATASET_OR_GPU_REANALYSIS','COMPLETE_DEPENDENCY_CLOSURE','HISTORICAL_FULL_VERIFIERS']};
}
module.exports={verify};
if(require.main===module){
 try{assert.equal(process.argv.length,2,'usage: node verify.cjs');const out=path.resolve(__dirname,'..'),result=verify(f=>{const file=path.join(out,f);return fs.existsSync(file)?fs.readFileSync(file):undefined;});console.log(JSON.stringify(result,null,2));console.log('KB-GOV-011 FIXED AUDIT: PASS');}
 catch(error){console.error('KB-GOV-011 FIXED AUDIT: FAIL\n'+error.message);process.exitCode=1;}
}
