'use strict';
// One-time audit producer. Writes proposed bytes in this receipt, never the target tree.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync,spawnSync}=require('node:child_process');
const O=path.resolve(__dirname,'..'),R=path.resolve(O,'../../../../..'),K='CUDA_coding/knowledge/';
const read=f=>fs.readFileSync(path.join(O,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(f,b)=>{fs.mkdirSync(path.dirname(path.join(O,f)),{recursive:true});fs.writeFileSync(path.join(O,f),b,{flag:'wx'});},write=(f,x)=>put(f,JSON.stringify(x,null,2)+'\n');
const m=json('inputs.json'),edits=[];
function propose(d,text,steps){
  const live=read(d.versions.live.snapshot),b=Buffer.from(text),snapshot='proposed/'+d.id+'.txt';put(snapshot,b);
  const diff=spawnSync('git',['diff','--no-index','--no-color','--',path.join(O,d.versions.live.snapshot),path.join(O,snapshot)],{maxBuffer:8e6});assert.ok([0,1].includes(diff.status));put('proposed/'+d.id+'.patch',diff.stdout);
  edits.push({path:d.path,before:d.versions.live.sha256,after:sha(b),bytes:b.length,snapshot,steps});
}
for(const d of m.documents.filter(x=>x.classification==='G3-annotation-delta')){
  let text=read(d.versions.g3.snapshot).toString();const steps=[{kind:'admit-reviewed-G3-annotation',source:d.versions.g3.snapshot}];
  const substitutions=d.id==='22'?[['实时排程读取开发树[[../../meta/task-queue]]，本归档随带queue仅是固定G2历史快照。','实时排程读取主树[[../../meta/task-queue]]；G3冻结归档随带的queue仅是固定G2历史快照。']]:d.id==='23'?[['实时状态须读开发树[[../../meta/task-queue]]；本归档随带queue仅为固定G2历史快照。','实时状态须读主树[[../../meta/task-queue]]；G3冻结归档随带的queue仅为固定G2历史快照。']]:[];
  for(const [before,after]of substitutions){assert.equal(text.split(before).length,2);text=text.replace(before,after);steps.push({kind:'main-context-only',before,after});}
  propose(d,text,steps);
}
const registry=m.documents.find(d=>d.id==='25');propose(registry,read(registry.versions.g3.snapshot).toString(),[{kind:'two-source-rows-only',source:registry.versions.g3.snapshot}]);
const map=m.documents.find(d=>d.id==='27');let mapText=read(map.versions.live.snapshot).toString();
const sourceBefore=mapText.match(/^source_ids:.*$/m)[0],sourceAfter=sourceBefore.replace('SRC-031]','SRC-031, SRC-032, SRC-033]');assert.notEqual(sourceBefore,sourceAfter);
const anchor=mapText.match(/^\| SRC-031 [^\r\n]+/m)[0];
const extraRows='\n| SRC-032 TASK-007旧pageable profile文件集 | [[../decisions/ADR-005-TASK-007不实施persistent-host-staging]]、[[../decisions/ADR-006-TASK-020暂不实施overlap]]、[[../reference/adjacent-tdma-optimization-transfer-to-penta]] | 23文件；定量仅_3至_7五个正式输出，预热、smoke、Nsight分别保留 | 只支持旧profile与历史决定边界，不升级为persistent收益或GPU验收 |\n| SRC-033 TASK-020 critical-path派生模型 | [[../decisions/ADR-006-TASK-020暂不实施overlap]]、[[../reference/adjacent-tdma-optimization-transfer-to-penta]] | 3文件；派生自SRC-032五个正式输出，实测输入与模型预测分开 | G50是模型假设，不是实测overlap收益 |';
mapText=mapText.replace(sourceBefore,sourceAfter).replace(anchor,anchor+extraRows);
propose(map,mapText,[{kind:'source-ids-only',before:sourceBefore,after:sourceAfter},{kind:'two-map-rows-only',before:anchor,after:anchor+extraRows}]);
const attr=m.documents.find(d=>d.id==='26'),liveAttr=read(attr.versions.live.snapshot).toString(),existing=new Set(liveAttr.split(/\r?\n/).map(s=>s.trim()));
const additions=read(attr.versions.g3.snapshot).toString().split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#')&&!existing.has(s));
for(const f of [map.path,...m.missingLintTargets.map(x=>x.path)])additions.push('/'+f+' -text');
additions.push('/'+K+'outputs/validation/KB-GOV-013-20260909-main-integration-review/** -text','/'+K+'outputs/validation/KB-GOV-014-20260909-main-integration/** -text');
const suffix='\n# KB-GOV-014 proposed: preserve reviewed governance bytes; retain existing rules.\n'+[...new Set(additions)].join('\n')+'\n';
propose(attr,liveAttr+suffix,[{kind:'append-only-attributes',suffix}]);
const rows=m.archivePaths.map(x=>{const d=m.documents.find(d=>d.path===x.path),e=edits.find(e=>e.path===x.path);return {path:x.path,group:d?'documents-and-attributes':'frozen-evidence',ownership:d?.classification||'inherited-fixed-evidence',action:e?'apply-reviewed-proposal':d?.classification==='live-rolling-records'?'retain-live-and-capture-governance-closeout':'stage-existing-exact-bytes',intakeSha256:x.liveSha256,g3Blob:x.g3Blob,proposedSha256:e?.after||x.liveSha256,proposal:e?.snapshot||null};});
const eMap=edits.find(e=>e.path===map.path);rows.push({path:map.path,group:'documents-and-attributes',ownership:map.classification,action:'retain-live-plus-two-source-relations',intakeSha256:map.versions.live.sha256,g3Blob:map.versions.g3.blob,proposedSha256:eMap.after,proposal:eMap.snapshot});
for(const x of m.missingLintTargets)rows.push({path:x.path,group:'historical-link-targets',ownership:'existing-untracked-historical-document',action:'stage-existing-exact-bytes',intakeSha256:x.sha256,g3Blob:null,proposedSha256:x.sha256,proposal:null});
rows.sort((a,b)=>a.path.localeCompare(b.path));assert.equal(new Set(rows.map(x=>x.path)).size,715);assert.ok(rows.every(x=>!x.path.startsWith('CUDA_coding/CUDA_code/')));
write('proposals.json',{task:'KB-GOV-013',status:'REVIEW_ONLY_NOT_APPLIED',edits});write('integration-paths.json',{task:'KB-GOV-014-proposed',status:'NOT_EXECUTED',rows,additionalReceiptRoots:[K+'outputs/validation/KB-GOV-013-20260909-main-integration-review',K+'outputs/validation/KB-GOV-014-20260909-main-integration'],rollingMetaMustBeRecaptured:true});
put('integration-paths.nul',Buffer.from(rows.map(x=>x.path+'\0').join('')));
put('path-review.md','# 主路径审定\n\n逐文件完整715路径、SHA和归属见[integration-paths.json](integration-paths.json)。此表只显示27个主要文件；013未应用拟议字节。\n\n| 路径 | 领取时分类 | 最小处置 |\n| --- | --- | --- |\n'+m.documents.map(d=>'| `'+d.path+'` | '+d.classification+' | '+rows.find(x=>x.path===d.path).action+' |').join('\n')+'\n');
// In-memory projection: same Obsidian-link target rule as current check_knowledge.ps1.
// This is not execution of PowerShell lint and does not prove Markdown/runtime closure.
const git=a=>execFileSync('git',a,{cwd:R,maxBuffer:80e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
const g3=json('raw/trees/g3.json'),files=new Map(g3.map(x=>[x.path,null]));
const md=g3.filter(x=>x.path.startsWith('CUDA_coding/')&&x.path.endsWith('.md'));
const stream=execFileSync('git',['cat-file','--batch'],{cwd:R,input:md.map(x=>m.refs.g3+':'+x.path+'\n').join(''),maxBuffer:80e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});let offset=0;
for(const x of md){const end=stream.indexOf(10,offset),size=Number(stream.subarray(offset,end).toString().split(' ')[2]);assert.ok(Number.isFinite(size));files.set(x.path,stream.subarray(end+1,end+size+1).toString());offset=end+size+2;}assert.equal(offset,stream.length);
for(const d of m.documents)files.set(d.path,read(d.versions.live.snapshot).toString());
for(const x of m.missingLintTargets)files.set(x.path,read(x.snapshot).toString());
for(const e of edits)files.set(e.path,read(e.snapshot).toString());
const exists=f=>files.has(f)||[...files.keys()].some(k=>k.startsWith(f+'/')),broken=[];
for(const [f,s]of files)if(s!==null&&f.endsWith('.md')&&f.startsWith('CUDA_coding/'))for(const match of s.matchAll(/\[\[([^\]]+)\]\]/g)){
  const t=match[1].split('|')[0].split('#')[0].trim();if(!t)continue;const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(f),t.replaceAll('\\','/')));
  if(!exists(resolved)&&!exists(resolved+'.md'))broken.push({source:f,line:s.slice(0,match.index).split('\n').length,target:t,resolved});
}
const missing=[...new Set(broken.map(x=>x.resolved))];
write('local/projected-wikilinks.json',{kind:'in-memory-target-rule-only',basis:'fixed G3 plus 27 captured main/proposed documents and 13 exact historical targets; excludes future 013/014 receipt files',markdown:[...files].filter(([f,s])=>s!==null&&f.endsWith('.md')&&f.startsWith('CUDA_coding/')).length,errors:broken.length,uniqueMissingTargets:missing.length,broken,missing});
console.log(JSON.stringify({proposals:edits.length,paths:rows.length,groups:Object.fromEntries([...new Set(rows.map(x=>x.group))].map(k=>[k,rows.filter(x=>x.group===k).length])),projectedWikilinkErrors:broken.length,projectedMissingTargets:missing.length},null,2));
