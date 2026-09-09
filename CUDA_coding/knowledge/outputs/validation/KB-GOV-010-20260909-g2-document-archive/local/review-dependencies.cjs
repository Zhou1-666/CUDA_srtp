'use strict';
// One-time first-hop dependency inventory; does not alter referenced content.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const out=path.resolve(__dirname,'..'),root=path.resolve(out,'../../../../..'),m=JSON.parse(fs.readFileSync(out+'/input-manifest.json'));
const state=JSON.parse(fs.readFileSync(out+'/raw/input-state-v2.json')),wt=state.worktree,selected=new Set(m.documents.map(d=>d.path)),included=new Set(m.evidence.map(f=>f.path));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),oid=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function tree(ref){const r=spawnSync('git',['ls-tree','-r','-z',ref],{cwd:root,encoding:'utf8',maxBuffer:30e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.stderr);return new Map(r.stdout.split('\0').filter(Boolean).map(s=>{const [meta,file]=s.split('\t');return [file,meta.split(' ')[2]];}));}
const base=tree(state.base),g1=tree(m.g1),kb002=tree('09a97586fbcce952cdd3ac233e25082cbc842220'),targets=new Map(),links=[];
function inspect(file){
  if(targets.has(file))return targets.get(file);const mainPath=path.join(root,file),candidatePath=path.join(wt,file),mainExists=fs.existsSync(mainPath),candidateExists=fs.existsSync(candidatePath);
  const b=mainExists&&fs.statSync(mainPath).isFile()?fs.readFileSync(mainPath):null,c=candidateExists&&fs.statSync(candidatePath).isFile()?fs.readFileSync(candidatePath):null,id=b?oid(b):null,lf=b?oid(Buffer.from(b.toString('utf8').replaceAll('\r\n','\n'))):null;
  let classification=selected.has(file)?'G2-selected':included.has(file)?'new-governance-evidence':g1.has(file)&&!base.has(file)?'G1-archived':!mainExists?'missing':id&&(id===base.get(file)||lf===base.get(file))?'base-content':id&&kb002.get(file)!==base.get(file)&&(id===kb002.get(file)||lf===kb002.get(file))?'KB-GOV-002-external':base.has(file)?'base-older-content':file.startsWith('CUDA_coding/knowledge/wiki/')?'G3-untracked-wiki':'outside-version-set';
  if(classification==='G1-archived')assert.ok(b&&oid(b)===g1.get(file),'G1 reference drift: '+file);
  const item={path:file,classification,mainExists,candidateExists,mainSha256:b?sha(b):null,candidateSha256:c?sha(c):null,baseBlob:base.get(file)||null,g1Blob:g1.get(file)||null,kbGov002Blob:kb002.get(file)||null,baseMatch:id&&id===base.get(file)?'exact':lf&&lf===base.get(file)?'CRLF-to-LF-only':null};targets.set(file,item);return item;
}
for(const d of m.documents){const text=fs.readFileSync(path.join(wt,d.path),'utf8');for(const x of text.matchAll(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g)){
  const url=x[1]||x[3],target=url.split('|')[0].split('#')[0].replace(/^<|>$/g,'');if(!target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/'))continue;
  let file=path.posix.normalize(path.posix.join(path.posix.dirname(d.path),target.replaceAll('\\','/')));assert.ok(!file.startsWith('../'),'outside repository link');
  if(!fs.existsSync(path.join(root,file))&&!fs.existsSync(path.join(wt,file))&&(fs.existsSync(path.join(root,file+'.md'))||fs.existsSync(path.join(wt,file+'.md'))))file+='.md';
  const item=inspect(file);links.push({source:d.path,line:text.slice(0,x.index).split('\n').length,url,target:file,classification:item.classification});
}}
const registry=inspect('CUDA_coding/knowledge/raw/source-registry.md');
const result={scope:'First-hop literal local links in 17 frozen candidate documents, including historical text. No anchor reachability, external command execution or recursive evidence closure.',capturedAt:new Date().toISOString(),g1:m.g1,summary:Object.fromEntries([...new Set(links.map(x=>x.classification))].sort().map(k=>[k,links.filter(x=>x.classification===k).length])),targets:[...targets.values()],links,sourceRegistry:registry};
fs.writeFileSync(out+'/dependencies.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({links:links.length,targets:targets.size,summary:result.summary,missing:result.targets.filter(x=>x.classification==='missing').map(x=>x.path),correctedTask002B:targets.get('CUDA_coding/knowledge/outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md')},null,2));
