'use strict';
// Generates review patches, then replays them only in disposable OS-temp files.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),crypto=require('crypto'),cp=require('child_process');
const root=process.cwd(),d='CUDA_coding/knowledge/outputs/validation/KB-GOV-009-20260909-g2-ownership-review',m=JSON.parse(fs.readFileSync(d+'/raw/input-state.json')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(!fs.existsSync(d+'/local/delta-review.json'),'already generated');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kb-gov-009-replay-')),env={...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_CEILING_DIRECTORIES:path.dirname(temp)},rows=[];
function run(args,cwd=root){return cp.spawnSync('git',args,{cwd,env,encoding:'utf8',maxBuffer:30e6});}
function diff(left,right,target){const r=run(['-c','core.autocrlf=false','-c','core.quotepath=false','diff','--no-index','--no-ext-diff','--no-renames','--text','--',left,right]);assert.ok([0,1].includes(r.status),r.stderr);assert.ok(!/\s/.test(target));return r.stdout.replace(/^diff --git[^\n]*\n/,'diff --git a/'+target+' b/'+target+'\n').replace(/^--- [^\n]*\n/m,'--- a/'+target+'\n').replace(/^\+\+\+ [^\n]*\n/m,'+++ b/'+target+'\n');}
function stats(t){const ls=t.split('\n');return {added:ls.filter(x=>x.startsWith('+')&&!x.startsWith('+++')).length,removed:ls.filter(x=>x.startsWith('-')&&!x.startsWith('---')).length,hunks:ls.filter(x=>x.startsWith('@@')).length};}
for(const r of m.rows){
  const patches={preExisting:'patches/pre-existing/'+r.id+'.patch',postBaseline:'patches/post-baseline/'+r.id+'.patch'};
  const a=diff(d+'/'+r.snapshots.head,d+'/'+r.snapshots.firstBefore,r.path),b=diff(d+'/'+r.snapshots.firstBefore,d+'/'+r.snapshots.current,r.path);
  for(const [p,text]of [[patches.preExisting,a],[patches.postBaseline,b]]){fs.mkdirSync(path.dirname(d+'/'+p),{recursive:true});fs.writeFileSync(d+'/'+p,text);}
  const target=path.join(temp,r.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(d+'/'+r.snapshots.head,target);
  const check=b?run(['-c','core.autocrlf=false','apply','--no-index','--check','--whitespace=nowarn',path.resolve(d,patches.postBaseline)],temp):{status:0,stdout:'',stderr:''};
  assert.ok([0,1].includes(check.status),check.stderr);
  const checkLog='local/head-apply-'+r.id+'.log';fs.writeFileSync(d+'/'+checkLog,check.stdout+check.stderr);
  for(const [text,patch,sha]of [[a,patches.preExisting,r.firstBeforeSha256],[b,patches.postBaseline,r.currentSha256]]){if(text){const result=run(['-c','core.autocrlf=false','apply','--no-index','--whitespace=nowarn',path.resolve(d,patch)],temp);assert.equal(result.status,0,result.stderr);}assert.equal(hash(fs.readFileSync(target)),sha,'exact replay: '+r.path);}
  rows.push({id:r.id,path:r.path,patches,preExistingStats:stats(a),postBaselineStats:stats(b),postBaselineAppliesToHead:check.status===0,headApplyLog:checkLog,replayedFirstBeforeSha256:r.firstBeforeSha256,replayedCurrentSha256:r.currentSha256,scope:m.mutable.includes(r.path)?'rolling-meta; includes closures and, for queue/blocker, documented concurrent TASK-031 updates':'static-governance; unchanged since last governance evidence'});
}
fs.writeFileSync(d+'/local/delta-review.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify({paths:rows.length,byteExactReplays:rows.length*2,postBaselineAppliesToHead:rows.filter(r=>r.postBaselineAppliesToHead).map(r=>r.id),postBaselineConflictsOnHead:rows.filter(r=>!r.postBaselineAppliesToHead).map(r=>r.id)},null,2));
