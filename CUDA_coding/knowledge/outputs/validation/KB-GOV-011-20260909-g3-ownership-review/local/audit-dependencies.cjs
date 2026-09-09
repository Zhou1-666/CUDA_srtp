'use strict';
// One-time read-only inventory of live dependencies; writes this receipt only.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),root=path.resolve(out,'../../../../..'),m=JSON.parse(fs.readFileSync(out+'/inputs.json'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),oid=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const trees=Object.fromEntries(Object.entries(m.trees).map(([k,t])=>[k,new Map(fs.readFileSync(path.join(out,t.snapshot),'utf8').split('\0').filter(Boolean).map(x=>[x.split('\t')[1],x.split('\t')[0].split(' ')[2]]))]));
const selected=new Set(m.pages.map(p=>p.path)),targets=new Map(),links=[],external=[];
function inspect(file){
 if(targets.has(file))return targets.get(file);
 const resolved=path.resolve(root,file);assert.ok(resolved.startsWith(root+path.sep),'outside repository');
 const exists=fs.existsSync(resolved),kind=exists?(fs.statSync(resolved).isFile()?'file':'directory'):'missing',b=kind==='file'?fs.readFileSync(resolved):null;
 const id=b?oid(b):null,lf=b&&/\.(md|txt|json|js|cjs|ps1|sh|f90)$/i.test(file)?oid(Buffer.from(b.toString('utf8').replaceAll('\r\n','\n'))):null;
 const versions=Object.fromEntries(Object.entries(trees).map(([k,t])=>[k,{blob:t.get(file)||null,match:!t.has(file)?'absent':id===t.get(file)?'exact':lf===t.get(file)?'LF-normalized-only':'different'}]));
 if(kind==='directory')for(const [k,t]of Object.entries(trees))versions[k]={blob:null,match:'directory-container',versionedDescendants:[...t.keys()].filter(f=>f.startsWith(file.replace(/\/$/,'')+'/')).length};
 let classification=kind==='directory'?'directory-container':selected.has(file)?'G3-selected':!exists?'missing':versions.main.match==='exact'?'base-exact':versions.main.match==='LF-normalized-only'?'base-EOL-only':versions.g2.match==='exact'?'G2-exact':versions.g2.match==='LF-normalized-only'?'G2-EOL-only':versions.kb002.match==='exact'?'KB002-exact':versions.g2.blob?'G2-older-content':'workspace-only';
 const item={path:file,kind,classification,bytes:b?.length||null,sha256:b?hash(b):null,versions};targets.set(file,item);return item;
}
for(const p of m.pages){const b=fs.readFileSync(path.join(out,p.snapshot));assert.equal(hash(b),p.sha256);const text=b.toString('utf8');
 for(const x of text.matchAll(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g)){
  const url=x[1]||x[3],line=text.slice(0,x.index).split('\n').length,target=url.split('|')[0].split('#')[0].replace(/^<|>$/g,'');
  if(!target)continue;if(/^https?:\/\//i.test(target)){external.push({source:p.path,line,url});continue;}
  assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(target)&&!target.startsWith('/'),'unsupported link');
  let file=path.posix.normalize(path.posix.join(path.posix.dirname(p.path),target.replaceAll('\\','/')));if(x[1]&&!file.endsWith('.md'))file+='.md';
  const item=inspect(file);links.push({source:p.path,line,url,target:file,classification:item.classification});
 }
}
const registry=fs.readFileSync(path.join(out,m.context.find(f=>f.path.endsWith('/source-registry.md')).snapshot),'utf8').split('\n');
const sourceIds=[...new Set(m.pages.flatMap(p=>p.metadata.source_ids))].sort(),sources=sourceIds.map(id=>{
 const line=registry.findIndex(l=>l.startsWith('| '+id+' |'));assert.ok(line>=0,'unregistered source '+id);const row=registry[line],cells=row.split('|').slice(1,-1).map(x=>x.trim()),location=cells[3],first=location.match(/`([^`]+)`/)?.[1],registeredSha256=cells[4].match(/[0-9a-f]{64}/i)?.[0].toLowerCase()||null;
 const file=first&&!/^https?:/.test(first)?path.posix.normalize('CUDA_coding/'+first):null,actual=file?inspect(file):null;
 return {id,registryLine:line+1,registryRow:row,type:cells[1],location,registeredSha256,path:file,currentSha256:actual?.sha256||null,hashRelation:!registeredSha256?'not-file-hash':registeredSha256===actual?.sha256?'matches-registered':'frozen-reference-differs-from-live',privacyAndLicense:cells[5],role:m.pages.filter(p=>p.metadata.source_ids.includes(id)).map(p=>p.id)};
});
inspect('CUDA_coding/knowledge/raw/source-registry.md');
const commandPaths=['CUDA_coding/scripts/check_all.ps1','CUDA_coding/scripts/check_math.ps1','CUDA_coding/scripts/check_knowledge.ps1',...['penta_indep_check.js','run_penta_api_validation.sh','run_task_006_28_22.sh','run_task_015_stability.sh','run_task_016_lifecycle.sh','run_task_007_profile_timing.sh','run_task_014_baseline.sh'].map(f=>'CUDA_coding/CUDA_code/源代码/verify/'+f),'CUDA_coding/knowledge/outputs/validation/TASK-010-20260826-paraai-a100-job1454628/source/verify/run_task_010_manufactured.sh'];
const commands=commandPaths.map(f=>({...inspect(f),executed:false,role:f.endsWith('/check_knowledge.ps1')?'Selected indirect orchestration dependency of check_all.ps1:8; identity only':'Script explicitly mentioned in SOP; identity and location only'}));
const result={scope:'Literal first-hop local/external links from seven frozen pages, source locations, source-registry.md itself, 10 scripts explicitly mentioned in SOP and one selected indirect orchestration dependency; no recursive closure, anchor validation or GPU execution',capturedAt:new Date().toISOString(),refs:m.refs,links,external,targets:[...targets.values()],sources,commands};
fs.writeFileSync(out+'/dependencies.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({localLinks:links.length,externalLinks:external.length,targets:targets.size,sources:sources.length,commands:commands.length,classes:Object.fromEntries([...new Set(result.targets.map(t=>t.classification))].map(k=>[k,result.targets.filter(t=>t.classification===k).length])),sourceHashes:sources.map(s=>({id:s.id,hashRelation:s.hashRelation})),missing:result.targets.filter(t=>t.kind==='missing').map(t=>t.path)},null,2));
