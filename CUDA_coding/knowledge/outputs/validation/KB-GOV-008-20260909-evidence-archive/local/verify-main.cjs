'use strict';
// Historical closeout protection check: original workspace only, not clone acceptance.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(out+'/raw/before-manifest.json')),root=m.root,own=path.relative(root,out).replaceAll('\\','/');
const read=p=>fs.readFileSync(path.resolve(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function git(args,cwd=root){const r=spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:30e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.stderr);return r.stdout;}
for(const p of m.protected)assert.equal(hash(read(p.path)),p.sha256,p.path);
for(const p of m.snapshots)assert.equal(hash(read(p.backup)),p.sha256,p.backup);
for(const p of JSON.parse(fs.readFileSync(out+'/local/closeout-live-sha.json')))assert.equal(hash(read(p.path)),p.sha256,p.path);
assert.equal(git(['rev-parse','HEAD']).trim(),m.base);
assert.equal(git(['ls-files','--stage','-z']),fs.readFileSync(out+'/raw/main-index-before.txt','utf8'));
assert.equal(hash(read('.git/index')),m.indexSha256,'main index bytes');
const stable=s=>s.split('\n').filter(x=>x&&!x.startsWith('refs/codex/turn-diffs/')&&!x.startsWith('refs/heads/codex/kb-gov-008-evidence-archive ')).sort();
assert.deepEqual(stable(git(['for-each-ref','--format=%(refname) %(objectname)'])),stable(m.refs),'existing refs');
const oldTrees=m.worktrees.trim().split(/\n\n/),newTrees=git(['worktree','list','--porcelain']).trim().split(/\n\n/).filter(b=>!b.split('\n')[0].endsWith('/.worktrees/kb-gov-008-evidence-archive'));
assert.deepEqual(newTrees,oldTrees,'existing worktrees');
for(const dir of ['.worktrees/kb-gov-002-validator-versioning','.worktrees/kb-gov-002-clean-clone']){const p=path.resolve(root,dir);assert.equal(git(['rev-parse','HEAD'],p).trim(),'09a97586fbcce952cdd3ac233e25082cbc842220');assert.equal(git(['status','--porcelain=v1'],p),'');}
const status=s=>s.split('\0').filter(x=>x&&!x.slice(3).startsWith(own)).sort(),before=status(fs.readFileSync(out+'/raw/main-status-before.txt','utf8')),now=status(git(['status','--porcelain=v1','-z','--untracked-files=all']));
assert.ok(JSON.stringify(now)===JSON.stringify(before),'outside status drift: '+JSON.stringify({added:now.filter(x=>!before.includes(x)),removed:before.filter(x=>!now.includes(x))}));
const queue=m.snapshots.find(s=>s.path.endsWith('/task-queue.md')),blocker=m.snapshots.find(s=>s.path.endsWith('/task-blocker-register.md')),log=m.snapshots.find(s=>s.path.endsWith('/compile-log.md'));
const [oq,nq,ob,nb,ol,nl]=[queue.backup,queue.path,blocker.backup,blocker.path,log.backup,log.path].map(p=>read(p).toString());
const gov='## 知识维护交付（不参与软件排程）';assert.equal(nq.slice(0,nq.indexOf(gov)),oq.slice(0,oq.indexOf(gov)),'software queue and contracts');
const oldRows=s=>s.split(/\r?\n/).filter(x=>x.startsWith('| KB-GOV-')&&!/^\| KB-GOV-00[89] /.test(x));assert.deepEqual(oldRows(nq),oldRows(oq));
assert.equal(nb.slice(0,nb.indexOf('### KB-GOV-008 — done')),ob.slice(0,ob.indexOf('## 知识维护待办（不参与软件排程）')),'software blocker and prior snapshots');
assert.equal(nl.replace(/^2026-09-09 KB-GOV-008[^\n]+\n\n/m,''),ol,'old compile log');
assert.ok(/^\| KB-GOV-008 \| done \|/m.test(nq)&&/^\| KB-GOV-009 \| ready \|/m.test(nq));
const rows=nq.split(/\r?\n/).filter(x=>x.startsWith('| TASK-'));assert.equal(rows.length,48);
console.log(JSON.stringify({protected:m.protected.length,recoveryCopies:m.snapshots.length,softwareRows:rows.length,softwareQueueAndBlockerUnchanged:true,oldLogUnchanged:true,mainHeadAndIndexUnchanged:true,existingRefsAndWorktreesUnchanged:true,kbGov002Unchanged:true,outsideStatusUnchanged:true},null,2));
console.log('KB-GOV-008 MAIN PROTECTION: PASS');
