'use strict';
// Read-only evidence/scope checks for this migration; no new global lint rule.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json'))),root=m.root;
const read=p=>fs.readFileSync(path.resolve(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const s of m.snapshots)assert.equal(hash(read(s.backup)),s.sha256,s.backup);
for(const s of m.protected)assert.equal(hash(read(s.path)),s.sha256,s.path);
for(const [name,args]of Object.entries({head:['rev-parse','HEAD'],index:['ls-files','--stage','-z'],refs:['for-each-ref','--format=%(refname) %(objectname)'],worktrees:['worktree','list','--porcelain']})){
 const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:5e6});assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,fs.readFileSync(path.join(out,'raw/git-'+name+'-before.txt'),'utf8'),name);
}
const [blocker,queue,rules,log]=m.snapshots,old=read(blocker.backup).toString('utf8'),live=read(blocker.path).toString('utf8');
const start='### TASK-031 —',end='### TASK-033 —',pending='## 知识维护待办（不参与软件排程）';
const active=live.slice(live.indexOf(start),live.indexOf(end)),original=old.slice(m.section.start,m.section.end);
assert.equal(live.slice(0,live.indexOf(start)),old.slice(0,m.section.start),'earlier blocker entries unchanged');
const tail=old.slice(m.section.end,old.indexOf(pending));assert.ok(live.slice(live.indexOf(end)).startsWith(tail),'later software entries and prior closures unchanged');
const govTail=live.slice(live.indexOf(end)+tail.length);
assert.ok(govTail===old.slice(old.indexOf(pending))||govTail.startsWith('### KB-GOV-005 — done（TASK-031 blocker 治理已解除快照）\n'),'only own governance tail');
assert.equal(active.split('\n')[0],original.split('\n')[0],'incoming heading anchor preserved');assert.ok(Buffer.byteLength(active)<6000);
for(const boundary of ['单次提交授权已消耗','不取消、重投、改节点/参数/资源','v7 GPU 仍 NOT-RUN/未验收','L2 本合同范围 PASS（用户回执）','v5 完整 L6 仍是历史 FAIL','8份 rank Sanitizer','debug','跨节点','性能','独立原始 CSV','tmp','配额','SRC-029'])assert.ok(active.includes(boundary),boundary);
assert.deepEqual([...new Set(active.match(/job\d+/g))],['job1483542']);
assert.equal((active.match(/^- 最小动作：/gm)||[]).length,1);
const oldQueue=read(queue.backup).toString('utf8'),newQueue=read(queue.path).toString('utf8'),gov='## 知识维护交付（不参与软件排程）';
assert.equal(newQueue.slice(0,newQueue.indexOf(gov)),oldQueue.slice(0,oldQueue.indexOf(gov)),'all software queue text unchanged');
const softwareRows=t=>t.split(/\r?\n/).filter(l=>l.startsWith('| TASK-'));assert.deepEqual(softwareRows(newQueue),softwareRows(oldQueue));assert.equal(softwareRows(newQueue).length,48);
const priorGov=t=>t.split(/\r?\n/).filter(l=>l.startsWith('| KB-GOV-')&&!/^\| KB-GOV-00[56] /.test(l));assert.deepEqual(priorGov(newQueue),priorGov(oldQueue));
const oldRules=read(rules.backup).toString('utf8'),newRules=read(rules.path).toString('utf8');
assert.equal(newRules,oldRules.replace('blocker 的历史堆叠后续单独整理。','blocker 的 TASK-031 条目已在 [KB-GOV-005](../outputs/validation/KB-GOV-005-20260908-task031-blocker/README.md) 归并为活动缺口与历史快照，其他任务条目保留。'),'one scope-description edit');
const oldLog=read(log.backup).toString('utf8'),newLog=read(log.path).toString('utf8'),logBody=oldLog.slice(oldLog.indexOf('\n')+1);
assert.ok(newLog.endsWith(logBody),'old milestones unchanged');
const addition=newLog.slice(oldLog.indexOf('\n')+1,newLog.length-logBody.length);assert.ok(!addition||/^\n2026-09-09 KB-GOV-005[^\n]+\n$/.test(addition),'at most one milestone');
const archivePath=path.join(out,'task031-blocker.snapshot.md'),archive=fs.readFileSync(archivePath,'utf8'),marker='## 原文全文\n\n';
const records=JSON.parse(fs.readFileSync(path.join(out,'local/link-relocations.json'))),pattern=/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g;
function resolve(file,url){
 const target=url.split('|')[0].split('#')[0];if(!target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/'))return null;
 let absolute=path.resolve(path.dirname(file),target);if(!fs.existsSync(absolute)&&fs.existsSync(absolute+'.md'))absolute+='.md';return absolute;
}
let n=0;
const restored=archive.slice(archive.indexOf(marker)+marker.length).replace(pattern,(full,wiki,label,markdown)=>{
 const url=wiki||markdown;if(!resolve(archivePath,url))return full;
 const item=records[n++];assert.equal(url,item.after);assert.equal(resolve(archivePath,url),path.resolve(root,item.target));assert.ok(fs.existsSync(resolve(archivePath,url)));
 assert.equal(resolve(path.resolve(root,blocker.path),item.before),resolve(archivePath,url));
 assert.equal(url.split('|')[0].split('#').slice(1).join('#'),item.fragment.slice(1),'anchor preserved');
 return wiki?'[['+item.before+']]':'['+label+']('+item.before+')';
});
assert.equal(n,records.length);assert.equal(restored,original,'original TASK-031 section fully reversible');assert.equal(hash(Buffer.from(restored)),m.section.sha256);
let links=0,anchors=0;
for(const [file,text]of [[archivePath,archive],[path.join(out,'README.md'),fs.readFileSync(path.join(out,'README.md'),'utf8')],[path.resolve(root,blocker.path),active]])for(const match of text.matchAll(pattern)){
 const url=match[1]||match[3],target=resolve(file,url);if(!target)continue;assert.ok(fs.existsSync(target),'missing link '+url);links++;
 const fragment=url.split('|')[0].split('#')[1];
 if(fragment&&file===path.resolve(root,blocker.path)){
  const slug=s=>s.replace(/[^\p{L}\p{N}\p{M}\s_-]/gu,'').trim().toLowerCase().replace(/\s/g,'-');
  const headings=[...fs.readFileSync(target,'utf8').matchAll(/^#{1,6} (.+)$/gm)].map(h=>slug(h[1]));assert.ok(headings.includes(fragment),'missing active anchor '+url);anchors++;
 }
}
console.log(JSON.stringify({backups:4,protected:m.protected.length,softwareRows:48,softwareQueueUnchanged:true,otherBlockerEntriesUnchanged:true,oldMilestonesUnchanged:true,archiveRestorable:true,relocations:n,linksChecked:links,activeAnchorsChecked:anchors,gitUnchanged:true,activeBytes:Buffer.byteLength(active)},null,2));
console.log('KB-GOV-005 VERIFY: PASS');
