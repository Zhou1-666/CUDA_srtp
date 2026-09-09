'use strict';
// One-time read-only input audit; writes only this task's receipt.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const root=process.cwd(),v='CUDA_coding/knowledge/outputs/validation',d=v+'/KB-GOV-009-20260909-g2-ownership-review',g7=v+'/KB-GOV-007-20260909-governance-closeout',g8=v+'/KB-GOV-008-20260909-evidence-archive';
assert.ok(!fs.existsSync(d+'/raw/input-state.json'),'capture already exists');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p));
function git(args){const r=cp.spawnSync('git',args,{encoding:null,maxBuffer:40e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.stderr.toString());return r.stdout;}
function save(p,b){fs.mkdirSync(path.dirname(d+'/'+p),{recursive:true});fs.writeFileSync(d+'/'+p,typeof b==='string'||Buffer.isBuffer(b)?b:JSON.stringify(b,null,2)+'\n');}
const base=git(['rev-parse','HEAD']).toString().trim(),g1=git(['rev-parse','codex/kb-gov-008-evidence-archive']).toString().trim();assert.equal(base,'91ecc661e0cd856c61bdc5b69f5aa065faadf078');assert.equal(g1,'ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67');
const ledger=json(g7+'/local/governance-paths.json'),closeout=json(g8+'/local/closeout-live-sha.json'),rows=[];
for(let i=0;i<ledger.length;i++){
  const x=ledger[i],id=String(i+1).padStart(2,'0'),before=read(x.baselineBackup),current=read(x.path),head=git(['show',base+':'+x.path]);
  assert.equal(hash(before),x.baselineSha256);assert.equal(hash(head),x.headSha256);
  const expected=closeout.find(y=>y.path===x.path)?.sha256||x.worktreeSha256;assert.equal(hash(current),expected,'unreviewed input drift: '+x.path);
  const snapshots={head:'raw/head/'+id+'.txt',firstBefore:'raw/first-before/'+id+'.txt',current:'raw/current/'+id+'.txt'};
  save(snapshots.head,head);save(snapshots.firstBefore,before);save(snapshots.current,current);
  rows.push({id,path:x.path,firstBatch:x.firstBatch,baselineBackup:x.baselineBackup,headSha256:hash(head),firstBeforeSha256:hash(before),currentSha256:hash(current),headBytes:head.length,firstBeforeBytes:before.length,currentBytes:current.length,preExistingIgnoringCRLF:head.toString().replaceAll('\r\n','\n')!==before.toString().replaceAll('\r\n','\n'),matchesLastRecorded:true,snapshots});
}
const archive=json(g8+'/input-manifest.json');for(const f of archive.files)assert.equal(hash(read(f.path)),f.sha256,f.path);
const own8=json(g8+'/receipt-files.json').files.concat('receipt-files.json').map(p=>g8+'/'+p),tracked=git(['ls-files','-z']).toString().split('\0').filter(Boolean),mutable=rows.filter(r=>/\/(task-queue|task-blocker-register|compile-log)\.md$/.test(r.path)).map(r=>r.path);
const paths=[...new Set([...tracked,...archive.files.map(f=>f.path),...own8])].filter(p=>!mutable.includes(p));
const protectedFiles=paths.map(p=>({path:p,sha256:hash(read(p))}));
save('raw/input-state.json',{root,capturedAt:new Date().toISOString(),base,g1,kbGov002:git(['rev-parse','codex/kb-gov-002-validator-versioning']).toString().trim(),rows,mutable,protected:protectedFiles,indexSha256:hash(read('.git/index'))});
save('raw/git-index-before.txt',git(['ls-files','--stage','-z']));save('raw/git-refs-before.txt',git(['for-each-ref','--format=%(refname) %(objectname)']));save('raw/git-worktrees-before.txt',git(['worktree','list','--porcelain']));
console.log(JSON.stringify({paths:rows.length,preExisting:rows.filter(r=>r.preExistingIgnoringCRLF).length,matchingLatest:rows.filter(r=>r.matchesLastRecorded).length,protected:protectedFiles.length,base,g1},null,2));
