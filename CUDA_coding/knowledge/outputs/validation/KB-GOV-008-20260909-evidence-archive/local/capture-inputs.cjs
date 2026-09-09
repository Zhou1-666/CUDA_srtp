'use strict';
// One-time capture in the original workspace. Not the portable archive verifier.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=process.cwd(),v='CUDA_coding/knowledge/outputs/validation',prior=v+'/KB-GOV-007-20260909-governance-closeout',own=v+'/KB-GOV-008-20260909-evidence-archive';
assert.ok(!fs.existsSync(own+'/input-manifest.json'),'capture already exists');
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=args=>{const r=cp.spawnSync('git',args,{encoding:'utf8',maxBuffer:30e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.stderr);return r.stdout};
const m=json(prior+'/raw/before-manifest.json'),a=json(prior+'/local/audit-state.json');
for(const x of [...m.protected,...a.extraProtected])assert.equal(sha(read(x.path)),x.sha256,x.path);
const live=json(prior+'/local/closeout-live-sha.json'),drift=[];
for(const x of live){const now=read(x.path),old=read(prior+'/raw/before/'+path.basename(x.path)+'.txt').toString();let normalized=now.toString();
  if(x.path.endsWith('task-queue.md'))normalized=normalized.replace(/^\| TASK-031[^\r\n]+/m,old.match(/^\| TASK-031[^\r\n]+/m)[0]);
  if(x.path.endsWith('task-blocker-register.md')){const section=/^### TASK-031 —[^]*?(?=^### |^## )/m;normalized=normalized.replace(section,old.match(section)[0]);}
  assert.equal(sha(Buffer.from(normalized)),x.closeoutSha256,'unreviewed live change: '+x.path);
  if(sha(now)!==x.closeoutSha256)drift.push({path:x.path,oldSha256:x.closeoutSha256,newSha256:sha(now),review:'Only TASK-031 queue row / blocker section updated to Resources; retained, excluded from G1.'});
}
const ledger=json(prior+'/local/governance-paths.json');
for(const x of ledger){assert.equal(sha(read(x.baselineBackup)),x.baselineSha256);if(!live.some(y=>y.path===x.path))assert.equal(sha(read(x.path)),x.worktreeSha256,x.path);}
const commands={head:['rev-parse','HEAD'],index:['ls-files','--stage','-z'],refs:['for-each-ref','--format=%(refname) %(objectname)'],worktrees:['worktree','list','--porcelain']};
const stableRefs=s=>s.split('\n').filter(x=>!x.startsWith('refs/codex/turn-diffs/')).join('\n');
for(const [k,args] of Object.entries(commands)){const actual=git(args),expected=read(prior+'/raw/git-'+k+'-before.txt').toString();assert.equal(k==='refs'?stableRefs(actual):actual,k==='refs'?stableRefs(expected):expected,k);}
const status=git(['status','--porcelain=v1','-z','--untracked-files=all']);
const records=s=>s.split('\0').filter(x=>x&&!x.slice(3).startsWith(prior)&&!x.slice(3).startsWith(own));
const old=records(read(prior+'/raw/git-status-all-before.txt').toString()),now=records(status);
const changes={added:now.filter(x=>!old.includes(x)),removed:old.filter(x=>!now.includes(x))};
assert.equal(changes.removed.length,0);
const task031=v+'/TASK-031-20260907-v7-bounded-cudaflag-propagation-repair/';
for(const x of changes.added)assert.ok(x.startsWith('?? '+task031)&&/20260909-job1483542-resources-/.test(x),x);
const historical=cp.spawnSync(process.execPath,[prior+'/local/verify.cjs'],{encoding:'utf8',maxBuffer:30e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
assert.equal(historical.status,1);
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(e=>{const f=p+'/'+e.name;assert.ok(!e.isSymbolicLink(),f);return e.isDirectory()?walk(f):[f]})}
const roots=fs.readdirSync(v).filter(n=>/^KB-GOV-00[134567]-/.test(n)).sort().map(n=>v+'/'+n);assert.equal(roots.length,6);
const files=roots.flatMap(walk).map(p=>({path:p,bytes:read(p).length,sha256:sha(read(p))}));
fs.mkdirSync(own+'/raw/before',{recursive:true});
const write=(p,b)=>fs.writeFileSync(own+'/'+p,b),save=(p,b)=>write(p,JSON.stringify(b,null,2)+'\n');
write('raw/kb007-recheck.stdout.txt',historical.stdout);write('raw/kb007-recheck.stderr.txt',historical.stderr);
save('local/input-drift-audit.json',{historicalVerifierExit:1,reason:'Historical global checker fails on subsequent TASK-031 resources records, this new receipt, and app-generated refs/codex/turn-diffs captures. Existing branches/remotes/tags and main index match. Two live regions reviewed by restoring them in memory and matching KB007 final SHA. G1 unchanged; no historical checker edited.',changes,liveDrift:drift,protected:m.protected.length+a.extraProtected.length,governancePaths:ledger.length});
const snapshots=live.map(x=>{const backup=own+'/raw/before/'+path.basename(x.path)+'.txt';fs.copyFileSync(x.path,backup);return {path:x.path,backup,sha256:sha(read(x.path))}});
const protectedFiles=[...m.protected,...a.extraProtected,...files].filter((x,i,arr)=>arr.findIndex(y=>y.path===x.path)===i);
for(const p of [...changes.added.map(x=>x.slice(3)),task031+'README.md'])protectedFiles.push({path:p,sha256:sha(read(p))});
const baseline={root,base:git(commands.head).trim(),snapshots,protected:protectedFiles,refs:git(commands.refs),worktrees:git(commands.worktrees),indexSha256:sha(read('.git/index'))};
save('raw/before-manifest.json',baseline);write('raw/main-index-before.txt',git(commands.index));write('raw/main-status-before.txt',status);
save('input-manifest.json',{task:'KB-GOV-008',base:baseline.base,roots,files});
console.log(JSON.stringify({files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),protected:protectedFiles.length,reviewedLiveDrift:drift.length,newOutsideG1:changes.added.length,mainHead:baseline.base},null,2));
