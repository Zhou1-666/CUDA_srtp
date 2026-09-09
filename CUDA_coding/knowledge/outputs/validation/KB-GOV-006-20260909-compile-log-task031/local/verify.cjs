'use strict';
// Read-only audit of history recovery, references and the permitted live-file scope.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(out+'/raw/before-manifest.json')),root=m.root;
const read=p=>fs.readFileSync(path.resolve(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const s of m.snapshots)assert.equal(hash(read(s.backup)),s.sha256,s.backup);
for(const s of m.protected)assert.equal(hash(read(s.path)),s.sha256,s.path);
for(const [name,args]of Object.entries({head:['rev-parse','HEAD'],index:['ls-files','--stage','-z'],refs:['for-each-ref','--format=%(refname) %(objectname)'],worktrees:['worktree','list','--porcelain']})){
 const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:5e6});assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,fs.readFileSync(out+'/raw/git-'+name+'-before.txt','utf8'),name);
}
const [log,queue,blocker]=m.snapshots,original=read(log.backup).toString('utf8'),live=read(log.path).toString('utf8');
const pattern=/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g,archivePath=out+'/task031-compile-log.snapshot.md',archive=fs.readFileSync(archivePath,'utf8');
function resolve(file,url){const target=url.split('|')[0].split('#')[0];if(!target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/'))return null;let p=path.resolve(path.dirname(file),target);if(!fs.existsSync(p)&&fs.existsSync(p+'.md'))p+='.md';return p;}
const mappings=JSON.parse(fs.readFileSync(out+'/local/link-relocations.json'));let n=0,recovered='',cursor=0;
assert.equal(m.records.length,142);assert.equal((archive.match(/^## 原第\d+行$/gm)||[]).length,142);
assert.equal((original.match(/^2026-\d\d-\d\d TASK-031/gm)||[]).length,142);
for(const record of m.records){
 const heading='## 原第'+record.line+'行\n\n',end='<!-- end-record:'+record.line+' -->',start=archive.indexOf(heading);assert.ok(start>=0);
 const payload=archive.slice(start+heading.length,archive.indexOf(end,start));
 const restored=payload.replace(pattern,(full,wiki,label,markdown)=>{
  const url=wiki||markdown,target=resolve(archivePath,url);if(!target)return full;
  const item=mappings[n++];assert.equal(url,item.after);assert.equal(target,path.resolve(root,item.target));assert.ok(fs.existsSync(target));assert.equal(target,resolve(path.resolve(root,log.path),item.before));
  assert.equal(url.split('|')[0].split('#').slice(1).join('#'),item.fragment.slice(1),'fragment preserved');
  return wiki?'[['+item.before+']]':'['+label+']('+item.before+')';
 });
 assert.equal(hash(Buffer.from(restored)),record.sha256,'record '+record.line);assert.equal(restored,original.slice(record.start,record.end));
 recovered+=original.slice(cursor,record.start)+restored;cursor=record.end;
}
recovered+=original.slice(cursor);assert.equal(hash(Buffer.from(recovered)),log.sha256,'full original compile-log recovered');assert.equal(n,mappings.length);
const {navigation,edits}=JSON.parse(fs.readFileSync(out+'/local/replacements.json')),milestones=JSON.parse(fs.readFileSync(out+'/local/milestones.json'));
assert.equal(milestones.length,22);assert.equal((live.match(/^2026-\d\d-\d\d TASK-031/gm)||[]).length,22);
assert.equal(live.split(navigation).length,2,'one archive/routing note');let unselectedLive=live.replace(navigation,'');
const ownMilestone=/\n2026-09-09 KB-GOV-006[^\n]+\n/g;assert.ok([...unselectedLive.matchAll(ownMilestone)].length<=1);unselectedLive=unselectedLive.replace(ownMilestone,'');
for(const e of edits.filter(e=>e.replacement)){assert.equal(unselectedLive.split(e.replacement).length,2,'one milestone at '+e.line);unselectedLive=unselectedLive.replace(e.replacement,'');}
let unselectedOld='',at=0;for(const r of m.records){unselectedOld+=original.slice(at,r.start);at=r.end;}unselectedOld+=original.slice(at);assert.equal(unselectedLive,unselectedOld,'all non-TASK-031 bytes and headings unchanged');
const oldQueue=read(queue.backup).toString('utf8'),newQueue=read(queue.path).toString('utf8'),gov='## 知识维护交付（不参与软件排程）';
assert.equal(newQueue.slice(0,newQueue.indexOf(gov)),oldQueue.slice(0,oldQueue.indexOf(gov)),'software queue unchanged');
const rows=t=>t.split(/\r?\n/).filter(l=>l.startsWith('| TASK-'));assert.deepEqual(rows(newQueue),rows(oldQueue));assert.equal(rows(newQueue).length,48);
const priorGov=t=>t.split(/\r?\n/).filter(l=>l.startsWith('| KB-GOV-')&&!/^\| KB-GOV-00[67] /.test(l));assert.deepEqual(priorGov(newQueue),priorGov(oldQueue));
const oldBlocker=read(blocker.backup).toString('utf8'),newBlocker=read(blocker.path).toString('utf8'),pending='## 知识维护待办（不参与软件排程）';assert.ok(newBlocker.startsWith(oldBlocker.slice(0,oldBlocker.indexOf(pending))),'all software blockers and previous closures unchanged');
const govTail=newBlocker.slice(oldBlocker.indexOf(pending));assert.ok(govTail===oldBlocker.slice(oldBlocker.indexOf(pending))||govTail.startsWith('### KB-GOV-006 — done（compile-log 治理已解除快照）\n'));
let links=0,anchors=0;
const newContent=navigation+edits.map(e=>e.replacement).join('')+(live.match(ownMilestone)||[]).join('');
for(const [file,text]of [[archivePath,archive],[out+'/README.md',fs.readFileSync(out+'/README.md','utf8')],[path.resolve(root,log.path),newContent]])for(const x of text.matchAll(pattern)){
 const url=x[1]||x[3],target=resolve(file,url);if(!target)continue;assert.ok(fs.existsSync(target),'missing link '+url);links++;
 const fragment=url.split('|')[0].split('#')[1];if(fragment&&file!==archivePath){
  const slug=s=>s.replace(/[^\p{L}\p{N}\p{M}\s_-]/gu,'').trim().toLowerCase().replace(/\s/g,'-');const headings=[...fs.readFileSync(target,'utf8').matchAll(/^#{1,6} (.+)$/gm)].map(h=>slug(h[1]));assert.ok(headings.includes(fragment),'missing milestone anchor '+url);anchors++;
 }
}
console.log(JSON.stringify({backups:3,protected:m.protected.length,archivedRecords:142,retainedMilestones:22,archiveAndFullLogRestorable:true,relocations:n,linksChecked:links,newAnchorsChecked:anchors,otherLogRecordsUnchanged:true,softwareRows:48,softwareQueueAndBlockerUnchanged:true,gitUnchanged:true,liveLogBytes:Buffer.byteLength(live)},null,2));console.log('KB-GOV-006 VERIFY: PASS');
