'use strict';
// Read-only verification of this migration, not a new repository lint feature.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json'))),root=m.root;
const read=p=>fs.readFileSync(path.resolve(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const s of m.snapshots)assert.equal(hash(read(s.backup)),s.sha256,s.backup);
for(const s of m.protected)assert.equal(hash(read(s.path)),s.sha256,s.path);
for(const [name,args]of Object.entries({head:['rev-parse','HEAD'],index:['ls-files','--stage','-z'],refs:['for-each-ref','--format=%(refname) %(objectname)'],worktrees:['worktree','list','--porcelain']})){
 const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:5e6});assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,fs.readFileSync(path.join(out,'raw/git-'+name+'-before.txt'),'utf8'),name);
}
const original=read(m.snapshots[0].backup).toString('utf8'),live=read(m.snapshots[0].path).toString('utf8');
const start='## 既有任务（保留原编号与关闭证据）',end='## 知识维护交付（不参与软件排程）';
const contracts=t=>t.slice(t.indexOf(start),t.indexOf(end));assert.equal(contracts(live),contracts(original),'software contracts, rows and history byte text');
const rows=t=>t.split(/\r?\n/).filter(l=>l.startsWith('| TASK-'));assert.deepEqual(rows(live),rows(original));assert.equal(rows(live).length,48);
const top=live.slice(0,live.indexOf(start));assert.ok(Buffer.byteLength(top)<6000);
assert.equal((top.match(/^## 当前执行顺序：软件优先$/gm)||[]).length,1);
assert.deepEqual([...new Set(top.match(/job\d+/g))],['job1483542']);
for(const fact of ['TASK-031','in-progress','job1483542','PENDING/Priority','219904M','Priority=1','TASK-033','TASK-032','TASK-011','NOT-RUN/环境限制'])assert.ok(top.includes(fact)&&original.includes(fact),fact);
const sequence='TASK-031冻结A → TASK-033审计SRC-029 → 冻结公平多GPU基线/瓶颈 → 单变量源码候选 → 组合验收并冻结B → TASK-032内部release → TASK-011论文v1';
assert.ok(top.includes(sequence)&&original.includes(sequence),'approved order preserved');
for(const boundary of ['授权已消耗','不取消、重投、改节点/参数/资源或清理意图','TASK-007/021/024/026–030','>=1.05x'])assert.ok(top.includes(boundary),boundary);
const blocker=m.snapshots[1],before=read(blocker.backup).toString('utf8'),after=read(blocker.path).toString('utf8');
const pending='## 知识维护待办（不参与软件排程）';assert.ok(after.startsWith(before.slice(0,before.indexOf(pending))),'all previous blocker entries preserved');
const log=m.snapshots[3],oldLog=read(log.backup).toString('utf8'),newLog=read(log.path).toString('utf8');assert.ok(newLog.endsWith(oldLog.slice(oldLog.indexOf('\n')+1)),'old milestones preserved');
const archivePath=path.join(out,'task-queue.snapshot.md'),archive=fs.readFileSync(archivePath,'utf8'),marker='## 原文全文\n\n';
const records=JSON.parse(fs.readFileSync(path.join(out,'local/link-relocations.json'))),pattern=/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g;
function resolve(file,url){
 const target=url.split('|')[0].split('#')[0];if(!target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/'))return null;
 let absolute=path.resolve(path.dirname(file),target);if(!fs.existsSync(absolute)&&fs.existsSync(absolute+'.md'))absolute+='.md';return absolute;
}
let n=0;
const restored=archive.slice(archive.indexOf(marker)+marker.length).replace(pattern,(full,wiki,label,markdown)=>{
 const url=wiki||markdown;if(!resolve(archivePath,url))return full;
 const item=records[n++];assert.equal(url,item.after);assert.equal(resolve(archivePath,url),path.resolve(root,item.target));assert.ok(fs.existsSync(resolve(archivePath,url)));
 if(item.correction)assert.equal(item.before,'outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md');
 else assert.equal(resolve(path.resolve(root,m.snapshots[0].path),item.before),resolve(archivePath,url));
 assert.equal(url.split('|')[0].split('#').slice(1).join('#'),item.fragment.slice(1),'anchor preserved');
 return wiki?'[['+item.before+']]':'['+label+']('+item.before+')';
});
assert.equal(n,records.length);assert.equal(restored,original,'entire queue archive reversible');
let links=0,legacyMissing=0;
for(const [file,text]of [[archivePath,archive],[path.resolve(root,m.snapshots[0].path),live]])for(const match of text.matchAll(pattern)){
 const url=match[1]||match[3],target=resolve(file,url);if(!target)continue;
 if(!fs.existsSync(target)){
  assert.equal(file,path.resolve(root,m.snapshots[0].path));assert.equal(url,'outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md');legacyMissing++;
 }else links++;
}
assert.equal(legacyMissing,1,'one unchanged pre-existing contract link');
console.log(JSON.stringify({backups:4,protected:m.protected.length,softwareRows:48,contractBodyUnchanged:true,blockerHistoryUnchanged:true,archiveRestorable:true,relocations:n,linksChecked:links,preExistingLiveLinkDefects:legacyMissing,gitUnchanged:true},null,2));
console.log('KB-GOV-004 VERIFY: PASS');
