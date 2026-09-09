'use strict';
// First-hop literal document references, not execution or recursive evidence replay.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=process.cwd(),d='CUDA_coding/knowledge/outputs/validation/KB-GOV-009-20260909-g2-ownership-review',m=JSON.parse(fs.readFileSync(d+'/raw/input-state.json'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),oid=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function tree(ref){const r=cp.spawnSync('git',['ls-tree','-r','-z',ref],{encoding:'utf8',maxBuffer:30e6});assert.equal(r.status,0,r.stderr);return new Map(r.stdout.split('\0').filter(Boolean).map(s=>{const [meta,p]=s.split('\t');return [p,meta.split(' ')[2]]}));}
const base=tree(m.base),g1=tree(m.g1),g2=tree(m.kbGov002),selected=new Set(m.rows.map(r=>r.path)),targets=new Map(),links=[],sourceIds=[];
function inspect(p){if(targets.has(p))return targets.get(p);const exists=fs.existsSync(p),s=exists?fs.statSync(p):null,b=s?.isFile()&&s.size<=20e6?fs.readFileSync(p):null;
  const id=b?oid(b):null,lf=b?oid(Buffer.from(b.toString('utf8').replaceAll('\r\n','\n'))):null;
  let classification=!exists?'missing':selected.has(p)?'G2-selected':g1.has(p)&&!base.has(p)?'G1-archived':base.has(p)&&(id===base.get(p)||lf===base.get(p))?'base-content':g2.has(p)&&g2.get(p)!==base.get(p)&&(id===g2.get(p)||lf===g2.get(p))?'KB-GOV-002-content':base.has(p)?'tracked-other-version':p.startsWith('CUDA_coding/knowledge/wiki/')?'G3-untracked-wiki':'outside-version-set';
  const x={path:p,classification,bytes:s?.isFile()?s.size:null,sha256:b?hash(b):null,contentFingerprint:b?'sha256':'not-read (directory, missing or >20MB)',baseBlob:base.get(p)||null,g1Blob:g1.get(p)||null,kbGov002Blob:g2.get(p)||null,baseMatch:id&&id===base.get(p)?'exact':lf&&lf===base.get(p)?'CRLF-to-LF-only':null};
  if(classification==='G1-archived')assert.equal(id,g1.get(p),'G1 drift: '+p);targets.set(p,x);return x;
}
function extract(text){return [...text.matchAll(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g)].map(x=>({url:x[1]||x[3],kind:x[1]?'wiki':'markdown',line:text.slice(0,x.index).split('\n').length}));}
for(const r of m.rows){const old=extract(fs.readFileSync(d+'/'+r.snapshots.firstBefore,'utf8')),head=extract(fs.readFileSync(d+'/'+r.snapshots.head,'utf8')),current=fs.readFileSync(d+'/'+r.snapshots.current,'utf8');
  const count=(xs,url)=>xs.filter(x=>x.url===url).length,seen=new Map();
  for(const ref of extract(current)){const n=(seen.get(ref.url)||0)+1;seen.set(ref.url,n);const role=n>count(old,ref.url)?'added-since-first-baseline':'retained';const t=ref.url.split('|')[0].split('#')[0].replace(/^<|>$/g,'');
    const item={fileId:r.id,source:r.path,...ref,role,presentAtHead:count(head,ref.url)>0};
    if(!t){links.push({...item,classification:'same-page-anchor'});continue;}
    if(/^[a-z][a-z0-9+.-]*:/i.test(t)||t.startsWith('/')){links.push({...item,classification:'external-location'});continue;}
    let p=path.relative(root,path.resolve(path.dirname(r.path),t.replaceAll('\\','/'))).replaceAll('\\','/');
    if(p.startsWith('../')){links.push({...item,classification:'outside-repository'});continue;}
    if(!fs.existsSync(p)&&!base.has(p)&&!g1.has(p)&&(fs.existsSync(p+'.md')||base.has(p+'.md')||g1.has(p+'.md')))p+='.md';
    links.push({...item,target:p,classification:inspect(p).classification});
  }
  const front=current.match(/^---\r?\n([^]*?)\r?\n---/);const src=front?.[1].match(/^source_ids:\s*\[([^\]]*)\]/m);if(src)for(const id of src[1].match(/SRC-\d+[A-Z]?/g)||[])sourceIds.push({source:r.path,id});
}
const registry='CUDA_coding/knowledge/raw/source-registry.md',registryText=fs.readFileSync(registry,'utf8'),registered=new Set([...registryText.matchAll(/^\| (SRC-\d+[A-Z]?) \|/gm)].map(x=>x[1]));inspect(registry);for(const r of sourceIds)r.registered=registered.has(r.id);
const summary=Object.fromEntries([...new Set(links.map(x=>x.classification))].sort().map(c=>[c,links.filter(x=>x.classification===c).length]));
const added=links.filter(x=>x.role==='added-since-first-baseline'),addedSummary=Object.fromEntries([...new Set(added.map(x=>x.classification))].sort().map(c=>[c,added.filter(x=>x.classification===c).length]));
const result={scope:'First-hop literal Markdown/wiki links in 17 captured live documents, including historical text; fragments, executable command arguments, source-registry originals and transitive evidence are not validated or fetched. Added-since-first-baseline does not imply governance ownership for rolling meta.',base:m.base,g1:m.g1,kbGov002:m.kbGov002,summary,addedSummary,sourceIds,targets:[...targets.values()],links};
fs.writeFileSync(d+'/local/dependencies.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({linkOccurrences:links.length,uniqueLocalTargets:targets.size,summary,addedSinceFirst:added.length,addedSummary,missing:[...targets.values()].filter(x=>x.classification==='missing').map(x=>x.path),sourceIdMentions:sourceIds.length,unregistered:sourceIds.filter(x=>!x.registered)},null,2));
