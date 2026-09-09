'use strict';
// Read-only staged path and original-byte check; does not run historical scripts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../../../../..'),OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration';
const git=args=>{const r=spawnSync('git',['--no-optional-locks','-c','core.quotepath=false',...args],{cwd:ROOT,maxBuffer:160e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout;};
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
assert.ok(['a','b'].includes(process.argv[2]),'group a or b');
const list=fs.readFileSync(path.join(ROOT,OWN,'group-'+process.argv[2]+'.nul')).toString().split('\0').filter(Boolean);assert.equal(new Set(list).size,list.length);assert.ok(list.every(p=>!p.startsWith('CUDA_coding/CUDA_code/')));
const head=new Map(git(['ls-tree','-r','-z','HEAD']).toString().split('\0').filter(Boolean).map(s=>{const i=s.indexOf('\t');return [s.slice(i+1),s.slice(0,i).split(' ')[2]];}));
const actual=git(['diff','--cached','--no-renames','--name-only','-z']).toString().split('\0').filter(Boolean).sort();
const expected=list.filter(p=>head.get(p)!==blob(fs.readFileSync(path.join(ROOT,p)))).sort();assert.deepEqual(actual,expected,'staged change scope');
const rows=git(['ls-files','--stage','-z']).toString().split('\0').filter(Boolean).map(s=>{const i=s.indexOf('\t');return {path:s.slice(i+1),header:s.slice(0,i)};});
for(const p of actual){const r=rows.find(x=>x.path===p);assert.ok(r);assert.ok(r.header.startsWith('100644 '),'file mode');assert.equal(r.header.split(' ')[1],blob(fs.readFileSync(path.join(ROOT,p))),'staged original bytes: '+p);}
console.log(JSON.stringify({group:process.argv[2],paths:actual.length,originalByteBlobs:actual.length,softwarePaths:0},null,2));console.log('KB-GOV-014 STAGED: PASS');
