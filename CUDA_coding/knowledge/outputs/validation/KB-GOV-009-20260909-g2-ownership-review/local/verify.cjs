'use strict';
// Historical audit verification in the original repository; no Git or live-file writes.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(out+'/raw/input-state.json')),root=m.root,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.resolve(root,p)),own=p=>fs.readFileSync(path.resolve(out,p));
function git(args,cwd=root,env={}){return cp.spawnSync('git',args,{cwd,encoding:'utf8',maxBuffer:40e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',...env}});}
function okGit(args){const r=git(args);assert.equal(r.status,0,r.stderr);return r.stdout;}
assert.equal(okGit(['rev-parse','HEAD']).trim(),m.base);
assert.equal(okGit(['rev-parse','codex/kb-gov-008-evidence-archive']).trim(),m.g1);
assert.equal(okGit(['rev-parse','codex/kb-gov-002-validator-versioning']).trim(),m.kbGov002);
assert.equal(hash(read('.git/index')),m.indexSha256,'main index bytes');
assert.equal(okGit(['ls-files','--stage','-z']),own('raw/git-index-before.txt').toString());
const refs=s=>s.split('\n').filter(x=>!x.startsWith('refs/codex/turn-diffs/')).join('\n');
assert.equal(refs(okGit(['for-each-ref','--format=%(refname) %(objectname)'])),refs(own('raw/git-refs-before.txt').toString()));
assert.equal(okGit(['worktree','list','--porcelain']),own('raw/git-worktrees-before.txt').toString());
for(const r of m.protected)assert.equal(hash(read(r.path)),r.sha256,r.path);
for(const dir of ['.worktrees/kb-gov-008-evidence-archive','.worktrees/kb-gov-008-clean-clone','.worktrees/kb-gov-002-validator-versioning','.worktrees/kb-gov-002-clean-clone']){const r=git(['status','--porcelain=v1','--untracked-files=all'],path.resolve(root,dir));assert.equal(r.status,0);assert.equal(r.stdout,'',dir);}
const deltas=JSON.parse(own('local/delta-review.json')),lf=JSON.parse(own('local/normalized-review.json')).rows,ledger=JSON.parse(own('ownership-ledger.json'));
assert.equal(ledger.length,17);assert.equal(ledger.filter(r=>r.preExistingIgnoringCRLF).length,13);
assert.deepEqual(lf.filter(r=>r.appliesToHeadLf).map(r=>r.id),['03','12','13','16']);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kb-gov-009-verify-')),tempEnv={GIT_CEILING_DIRECTORIES:path.dirname(temp)};let replays=0;
for(const r of m.rows){
  assert.equal(hash(own(r.snapshots.head)),r.headSha256);assert.equal(hash(own(r.snapshots.firstBefore)),r.firstBeforeSha256);assert.equal(hash(own(r.snapshots.current)),r.currentSha256);assert.equal(hash(read(r.baselineBackup)),r.firstBeforeSha256);
  const archived=okGit(['show',m.g1+':'+r.baselineBackup]);assert.equal(hash(Buffer.from(archived)),r.firstBeforeSha256,'G1 recovery blob');
  const target=path.join(temp,r.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,own(r.snapshots.head));
  const delta=deltas.find(x=>x.id===r.id),n=lf.find(x=>x.id===r.id);
  for(const [patch,expected]of [[delta.patches.preExisting,r.firstBeforeSha256],[delta.patches.postBaseline,r.currentSha256]]){if(own(patch).length){const q=git(['-c','core.autocrlf=false','apply','--no-index','--whitespace=nowarn',path.resolve(out,patch)],temp,tempEnv);assert.equal(q.status,0,q.stderr);}assert.equal(hash(fs.readFileSync(target)),expected,r.path);replays++;}
  fs.writeFileSync(target,own(r.snapshots.head).toString().replaceAll('\r\n','\n'));
  const c=git(['-c','core.autocrlf=false','apply','--no-index','--check','--whitespace=nowarn',path.resolve(out,n.normalizedPatch)],temp,tempEnv);assert.equal(c.status,n.appliesToHeadLf?0:1,'HEAD applicability: '+r.path);
  fs.writeFileSync(target,own(r.snapshots.firstBefore).toString().replaceAll('\r\n','\n'));
  const q=git(['-c','core.autocrlf=false','apply','--no-index','--whitespace=nowarn',path.resolve(out,n.normalizedPatch)],temp,tempEnv);assert.equal(q.status,0,q.stderr);assert.equal(hash(fs.readFileSync(target)),n.currentLfSha256);replays++;
}
const dep=JSON.parse(own('local/dependencies.json'));assert.equal(dep.links.length,425);assert.equal(dep.targets.length,220);assert.equal(dep.links.filter(r=>r.classification==='missing').length,1);assert.ok(dep.sourceIds.every(r=>r.registered));
const cmds=JSON.parse(own('local/command-dependencies.json')).rows;for(const r of cmds)assert.equal(hash(read(r.path)),r.sha256,r.path);assert.equal(cmds.length,9);
const close=fs.existsSync(out+'/local/closeout.json')?JSON.parse(own('local/closeout.json')):null;
if(close){for(const r of close.files){assert.equal(hash(own(r.before)),r.beforeSha256);assert.equal(hash(read(r.path)),r.afterSha256);const old=own(r.before).toString(),now=read(r.path).toString();
    if(r.path.endsWith('task-queue.md')){const mark='## 知识维护交付（不参与软件排程）';assert.equal(now.slice(0,now.indexOf(mark)),old.slice(0,old.indexOf(mark)),'software queue');const prior=t=>t.split(/\r?\n/).filter(l=>l.startsWith('| KB-GOV-')&&!/^\| KB-GOV-0(?:09|10) /.test(l));assert.deepEqual(prior(now),prior(old));}
    else if(r.path.endsWith('task-blocker-register.md'))assert.equal(now.slice(0,now.indexOf('### KB-GOV-009 — done')),old.slice(0,old.indexOf('## 知识维护待办（不参与软件排程）')),'old blocker');
    else assert.equal(now.replace(/^2026-09-09 KB-GOV-009[^\n]+\n\n/m,''),old,'old compile log');
  }}else for(const p of m.mutable){const r=m.rows.find(r=>r.path===p);assert.equal(hash(read(p)),r.currentSha256,p);}
for(const name of ['README.md','audit-report.md','integration-plan.md'])for(const x of own(name).toString().matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g)){const t=x[1].split('#')[0];if(!t||/^[a-z]+:/i.test(t))continue;assert.ok(fs.existsSync(path.resolve(out,t)),'report link: '+t);}
console.log(JSON.stringify({capturedDocuments:17,byteSnapshots:51,patchReplays:replays,headLfApplicable:4,headContentConflicts:13,protected:m.protected.length,dependencyOccurrences:425,uniqueTargets:220,commandFingerprints:9,gitUnchanged:true,governanceCloseout:!!close,softwareStatePreserved:true},null,2));
console.log('KB-GOV-009 REVIEW: PASS');
