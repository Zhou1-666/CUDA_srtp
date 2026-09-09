'use strict';
// Read-only checks for this bounded document migration; not a repository lint rule.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json'))),root=m.root;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=p=>fs.readFileSync(path.resolve(root,p));
for(const item of m.snapshots)assert.equal(sha(read(item.backup)),item.sha256,item.backup);
for(const item of m.protected)assert.equal(sha(read(item.path)),item.sha256,item.path);
for(const [name,args]of Object.entries({head:['rev-parse','HEAD'],index:['ls-files','--stage','-z'],worktrees:['worktree','list','--porcelain'],refs:['for-each-ref','--format=%(refname) %(objectname)']})){
 const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:5e6});assert.equal(r.status,0,r.stderr);
 assert.equal(r.stdout,fs.readFileSync(path.join(out,'raw/git-'+name+'-before.txt'),'utf8'),name+' unchanged');
}
const relocations=JSON.parse(fs.readFileSync(path.join(out,'local/link-relocations.json')));
const linkPattern=/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g;
let checkedLinks=0;
function resolve(file,url){
 const target=url.split('|')[0].split('#')[0];if(!target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/'))return null;
 let absolute=path.resolve(path.dirname(file),target);
 if(!fs.existsSync(absolute)&&fs.existsSync(absolute+'.md'))absolute+='.md';
 assert.ok(fs.existsSync(absolute),'link target missing: '+file+' -> '+url);return absolute;
}
for(const [i,name]of ['penta-active-context.snapshot.md','wiki-00-index.snapshot.md'].entries()){
 const original=read(m.snapshots[i].backup).toString('utf8'),front=original.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)[0];
 const archived=fs.readFileSync(path.join(out,name),'utf8');assert.ok(archived.includes(front.trimEnd()),'original metadata retained');
 const marker='## 原文正文\n\n',body=archived.slice(archived.indexOf(marker)+marker.length);
 const records=relocations.filter(r=>r.source===m.snapshots[i].path);let n=0;
 const restored=body.replace(linkPattern,(full,wiki,label,markdown)=>{
  const raw=wiki||markdown;
  if(!resolve(path.join(out,name),raw))return full;
  const record=records[n++];assert.ok(record,'unexpected archive link');assert.equal(raw,record.after);
  assert.equal(resolve(path.join(out,name),raw),resolve(path.resolve(root,record.source),record.before),'same source target');
  assert.equal(raw.split('|')[0].split('#').slice(1).join('#'),record.fragment.slice(1),'same anchor');
  return wiki?'[['+record.before+']]':'['+label+']('+record.before+')';
 });
 assert.equal(n,records.length);assert.equal(restored,original.slice(front.length),'all original body text recoverable');
 for(const target of [path.join(out,name),path.resolve(root,m.snapshots[i].path)]){
  const text=fs.readFileSync(target,'utf8');for(const match of text.matchAll(linkPattern)){if(resolve(target,match[1]||match[3]))checkedLinks++;}
 }
 const live=read(m.snapshots[i].path).toString('utf8');
 assert.ok(!/job\d{5,}|PENDING|以下.{0,12}历史|以本段为准/.test(live),'no copied scheduling stack');
 assert.ok(live.includes('task-queue')&&live.includes('task-blocker-register'),'authoritative routes');
 assert.ok(Buffer.byteLength(live)<10000,'bounded live navigation page');
}
for(const name of ['task-queue','task-blocker-register']){
 const item=m.snapshots.find(p=>p.path.endsWith('/'+name+'.md')),before=read(item.backup),after=read(item.path);
 assert.ok(after.subarray(0,before.length).equals(before),name+' original body unchanged');
 const added=after.subarray(before.length).toString('utf8');
 assert.ok(added===''||added.includes('KB-GOV-003'),name+' only maintenance append');
 assert.ok(!/^\| TASK-/m.test(added),'no added software task row');
}
const log=m.snapshots.find(p=>p.path.endsWith('/compile-log.md')),before=read(log.backup).toString('utf8'),after=read(log.path).toString('utf8');
assert.ok(after.endsWith(before.slice(before.indexOf('\n')+1)),'compile-log old tail unchanged');
const summary={recoveryCopies:m.snapshots.length,protectedObjects:m.protected.length,relocatedLinks:relocations.length,archiveBodiesRestorable:2,liveAndArchiveLinks:checkedLinks,gitUnchanged:true,softwareTaskHistoryUnchanged:true};
console.log(JSON.stringify(summary,null,2));
console.log('KB-GOV-003 MIGRATION VERIFY: PASS');
