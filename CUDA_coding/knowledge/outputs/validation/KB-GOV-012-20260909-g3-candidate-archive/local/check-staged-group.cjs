'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const OUT=path.resolve(__dirname,'..'),ROOT=path.resolve(OUT,'../../../../..'),s=JSON.parse(fs.readFileSync(OUT+'/raw/start-state.json')),m=JSON.parse(fs.readFileSync(OUT+'/input-manifest.json')),group=process.argv[2];
assert.ok(['documents','evidence','receipt','closeout'].includes(group));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),git=(...args)=>execFileSync('git',args,{cwd:s.worktree,maxBuffer:80e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
const expected=group==='documents'?[...m.documents,m.registry,m.attributes]:group==='evidence'?m.evidence:null;
const names=git('diff','--cached','--no-renames','--name-only','-z').toString().split('\0').filter(Boolean);
assert.ok(names.length>0,'empty staged group');
if(expected)assert.deepEqual([...names].sort(),expected.map(x=>x.path).sort(),'exact group paths');else for(const f of names)assert.ok(f.startsWith('CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/'),'receipt-only group');
for(const f of names){const blob=git('show',':'+f),e=expected?.find(x=>x.path===f);if(e){assert.equal(sha(blob),e.sha256,f);assert.equal(blob.length,e.bytes,f);}assert.deepEqual(blob,fs.readFileSync(path.join(s.worktree,f)),'index matches candidate: '+f);if(!expected)assert.deepEqual(blob,fs.readFileSync(path.join(ROOT,f)),'receipt matches delivery: '+f);}
const result={group,checkedAt:new Date().toISOString(),paths:names,files:names.length,bytesVerified:true,headBefore:git('rev-parse','HEAD').toString().trim()};
fs.writeFileSync(OUT+'/local/'+group+'-staged.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({group,files:names.length,result:'STAGED BYTES PASS'},null,2));
