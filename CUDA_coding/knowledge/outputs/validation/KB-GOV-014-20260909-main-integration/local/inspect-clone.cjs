'use strict';
// Read-only physical checkout inspection; never clones, resets, or runs historical makers.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(process.argv[2]||''),commit=process.argv[3],own='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration';
assert.match(commit||'',/^[a-f0-9]{40}$/);
function git(args){const r=spawnSync('git',['--no-optional-locks','-c','core.quotepath=false',...args],{cwd:root,maxBuffer:80e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});assert.equal(r.status,0,r.stderr.toString());return r.stdout;}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
assert.equal(git(['rev-parse','HEAD']).toString().trim(),commit);
assert.equal(git(['status','--porcelain=v1','--untracked-files=all']).length,0,'clone must be clean');
assert.ok(fs.lstatSync(path.join(root,'.git')).isDirectory());
assert.ok(!fs.existsSync(path.join(root,'.git/objects/info/alternates')),'no alternates');
assert.ok(!fs.existsSync(path.join(root,'.git/shallow')),'full history');
const objectFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);assert.ok(!e.isSymbolicLink(),'object symlink');if(e.isDirectory())walk(p);else if(e.isFile())objectFiles.push(p);}}
walk(path.join(root,'.git/objects'));
const objectLinks=objectFiles.map(p=>{const r=spawnSync('fsutil',['hardlink','list',p],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const names=r.stdout.trim().split(/\r?\n/).filter(Boolean);assert.equal(names.length,1,'shared object hardlink: '+p);return {path:path.relative(root,p).replaceAll('\\','/'),links:names.length};});
const tree=new Map(git(['ls-tree','-r','-z',commit]).toString().split('\0').filter(Boolean).map(s=>{const i=s.indexOf('\t');return [s.slice(i+1),s.slice(0,i).split(' ')[2]];}));
const read=p=>fs.readFileSync(path.join(root,p)),m=JSON.parse(read(own+'/integration-manifest.json')),r=JSON.parse(read(own+'/receipt-files.json'));
for(const f of [...m.staticPaths,...m.receipt013]){assert.equal(hash(read(f.path)),f.sha256,'checkout SHA: '+f.path);assert.equal(blob(read(f.path)),tree.get(f.path),'checkout blob: '+f.path);}
for(const p of r.files)assert.equal(blob(read(p)),tree.get(p),'receipt checkout blob: '+p);
const expectedRefs=['ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67','669182cf4879aa3ebc9976533178bce0214d4dbc','ce11e2ca35506194099094796b218d3a881a3e62'];
const refs=git(['for-each-ref','--format=%(objectname) %(refname)','refs/remotes/origin']).toString().trim().split(/\r?\n/);
for(const c of expectedRefs){assert.ok(refs.some(r=>r.startsWith(c+' ')),'archival remote ref missing');assert.equal(git(['cat-file','-t',c]).toString().trim(),'commit');}
console.log(JSON.stringify({status:'PASS',commit,clone:root,clean:true,alternates:false,shallow:false,objectFiles:objectLinks,staticPaths:m.staticPaths.length,receipt013:m.receipt013.length,receipt014:r.files.length,exactCheckoutBytes:true,archivalRefs:expectedRefs},null,2));
