'use strict';
// One-time preparation tool. Writes only this receipt; never stage or commit here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../../../../..');
const OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration';
const AUDIT='CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review';
const BASE='5c9724a79146e7a6d4e9819b63a5baa6f7f7fd7b';
const abs=p=>path.join(ROOT,p),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(abs(p)),json=p=>JSON.parse(read(p));
const write=(p,b)=>{const f=abs(OWN+'/'+p);assert.ok(!fs.existsSync(f),'do not overwrite intake: '+p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,b);};
const save=(p,j)=>write(p,JSON.stringify(j,null,2)+'\n');
function git(args){const r=spawnSync('git',['--no-optional-locks','-c','core.quotepath=false',...args],{cwd:ROOT,maxBuffer:96e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout;}
function filesUnder(dir){let out=[];for(const d of fs.readdirSync(abs(dir),{withFileTypes:true})){const p=dir+'/'+d.name;assert.ok(!d.isSymbolicLink(),'unexpected receipt link');if(d.isDirectory())out.push(...filesUnder(p));else if(d.isFile())out.push(p);else assert.fail('non-regular receipt file');}return out.sort();}
assert.ok(!fs.existsSync(abs(OWN+'/intake.json')),'intake already exists');
assert.equal(git(['branch','--show-current']).toString().trim(),'main');
assert.equal(git(['rev-parse','HEAD']).toString().trim(),BASE);
assert.equal(git(['diff','--cached','--name-only']).length,0,'existing staged work');
const replay=spawnSync(process.execPath,[abs(AUDIT+'/local/verify-receipt.cjs')],{cwd:ROOT,encoding:'utf8'});write('local/intake-013-replay.log',replay.stdout+replay.stderr);assert.equal(replay.status,0,'013 input validation');
const plan=json(AUDIT+'/integration-paths.json'),proposals=json(AUDIT+'/proposals.json'),closed=json(AUDIT+'/local/main-closeout.json');
const staticPaths=[];
for(const r of plan.rows){const b=read(r.path);const expected=closed.changes.find(c=>c.path===r.path)?.afterSha256||r.reviewedConcurrentIntakeSha256||r.intakeSha256;assert.equal(hash(b),expected,'live drift: '+r.path);staticPaths.push({path:r.path,group:r.group,sha256:hash(b),bytes:b.length});}
assert.equal(staticPaths.length,717);
const originals=[...proposals.edits.map(x=>x.path),...closed.changes.map(x=>x.path)];
const recovery=originals.map((p,i)=>{const b=read(p),snapshot='raw/before/'+String(i+1).padStart(2,'0')+'.bin';write(snapshot,b);return {path:p,snapshot,sha256:hash(b),bytes:b.length};});
for(const e of proposals.edits)assert.equal(hash(read(e.path)),e.before,'proposal before mismatch');
const archived013=filesUnder(AUDIT).map(p=>({path:p,sha256:hash(read(p)),bytes:read(p).length}));
const ignoredRelevant=json(AUDIT+'/inputs.json').protection.map(x=>x.path);
const all=[...new Set([...git(['ls-files','-z']).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0'),...ignoredRelevant])].filter(Boolean);
const allowed=new Set(staticPaths.map(x=>x.path));
const protectedFiles=[];
for(const p of all){if(allowed.has(p)||p.startsWith(OWN+'/')||p.startsWith(AUDIT+'/'))continue;const s=fs.lstatSync(abs(p));if(s.isSymbolicLink())protectedFiles.push({path:p,kind:'symlink',target:fs.readlinkSync(abs(p))});else if(s.isFile()){const b=read(p);protectedFiles.push({path:p,sha256:hash(b),bytes:b.length});}else assert.fail('unexpected protected path: '+p);}
for(const [name,args]of [['status-all',['status','--porcelain=v1','-z','--untracked-files=all']],['index',['ls-files','--stage','-z']],['refs',['show-ref']],['worktrees',['worktree','list','--porcelain']]])write('raw/git-'+name+'.bin',git(args));
const refs=git(['for-each-ref','--format=%(refname) %(objectname)','refs/heads']).toString().trim().split('\n');
const intake={task:'KB-GOV-014',capturedAt:new Date().toISOString(),base:BASE,root:ROOT,staticPaths,receipt013:archived013,recovery,protectedFiles,refs,worktrees:git(['worktree','list','--porcelain']).toString(),indexSha256:hash(git(['ls-files','--stage','-z'])),softwarePathsUnchanged:json(AUDIT+'/inputs.json').softwareCodePathsExcluded};
save('intake.json',intake);
write('raw/user-authorization.txt','User explicitly selected: KB-GOV-014 主树治理受控集成，\nContext: execute the reviewed 013 plan locally, including bounded application, Git commits and an independent clone. No push, cleanup, GPU, SSH or scientific adoption.\n');
const seal=filesUnder(OWN+'/raw').map(p=>({path:p.slice(OWN.length+1),sha256:hash(read(p)),bytes:read(p).length}));seal.push({path:'intake.json',sha256:hash(read(OWN+'/intake.json')),bytes:read(OWN+'/intake.json').length});save('input-seal.json',{task:'KB-GOV-014',files:seal});
console.log(JSON.stringify({task:'KB-GOV-014',base:BASE,staticPaths:717,receipt013:archived013.length,recovery:recovery.length,protectedFiles:protectedFiles.length,inputSealSha256:hash(read(OWN+'/input-seal.json'))},null,2));
