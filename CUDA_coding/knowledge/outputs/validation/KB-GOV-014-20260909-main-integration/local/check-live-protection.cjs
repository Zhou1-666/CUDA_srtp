'use strict';
// Handoff-only live inspection, not a permanent historical acceptance entry.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../../../../..'),own='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration',old='CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review';
const read=p=>fs.readFileSync(path.join(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),j=p=>JSON.parse(read(p));
const intake=j(own+'/intake.json'),concurrent=j(own+'/local/concurrent-supplement.json'),warnings=[];
function git(args){const r=spawnSync('git',['--no-optional-locks','-c','core.quotepath=false',...args],{cwd:root,maxBuffer:100e6});assert.equal(r.status,0,r.stderr.toString());if(r.stderr.length)warnings.push(r.stderr.toString());return r.stdout;}
assert.equal(git(['branch','--show-current']).toString().trim(),'main');assert.equal(git(['rev-parse','HEAD']).toString().trim(),process.argv[2]);assert.equal(git(['diff','--cached','--name-only']).length,0);
const exceptions=new Map(concurrent.exceptions.map(e=>[e.path,e]));const differences=[];let unchangedOriginals=0;
for(const f of intake.protectedFiles){let actual;try{actual=hash(read(f.path));}catch(e){differences.push({path:f.path,error:e.code});continue;}if(actual===f.sha256)unchangedOriginals++;const expected=exceptions.get(f.path)?.observedSha256||f.sha256;if(actual!==expected)differences.push({path:f.path,expected,actual});}
const original=new Set([...intake.protectedFiles,...intake.staticPaths,...intake.receipt013].map(f=>f.path));
const untracked=git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0').filter(Boolean);
const all=[...new Set([...git(['ls-files','-z']).toString().split('\0').filter(Boolean),...untracked])];
const newOutside=all.filter(p=>!original.has(p)&&!p.startsWith(own+'/')&&!p.startsWith(old+'/')).sort();
const expectedNew=concurrent.newOutsidePaths.map(f=>f.path).sort();
const t2Prefix='CUDA_coding/knowledge/outputs/validation/20260909-teacher-sprint-T2/';
const outsideT2=newOutside.filter(p=>!p.startsWith(t2Prefix));
if(JSON.stringify(outsideT2)!==JSON.stringify(expectedNew))differences.push({newOutside:outsideT2,expectedNew});
const concurrentT2=newOutside.filter(p=>p.startsWith(t2Prefix)).map(p=>{const b=read(p);return {path:p,bytes:b.length,sha256:hash(b)};});
for(const f of concurrent.newOutsidePaths){const actual=hash(read(f.path));if(actual!==f.sha256)differences.push({path:f.path,expected:f.sha256,actual});}
const refs=git(['for-each-ref','--format=%(refname) %(objectname)','refs/heads']).toString().trim().split(/\r?\n/);const dropMain=a=>a.filter(s=>!s.startsWith('refs/heads/main ')).sort();
assert.deepEqual(dropMain(refs),dropMain(intake.refs),'preserved branch refs');
const worktrees=git(['worktree','list','--porcelain']).toString();const withoutHead=s=>s.replace(/^HEAD [a-f0-9]+\r?\n/gm,'');assert.equal(withoutHead(worktrees),withoutHead(intake.worktrees),'worktree identity');
const priorHeads=intake.worktrees.trim().split(/\r?\n\r?\n/).slice(1),newHeads=worktrees.trim().split(/\r?\n\r?\n/).slice(1);assert.deepEqual(newHeads,priorHeads,'non-main worktree commits');
const software=intake.softwarePathsUnchanged.map(p=>({path:p,sha256:hash(read(p))}));
console.log(JSON.stringify({status:differences.length?'FAIL':'PASS',head:process.argv[2],protectedAtIntake:intake.protectedFiles.length,unchangedOriginals,reviewedConcurrentChanges:concurrent.exceptions,newOutsideFiles:concurrent.newOutsidePaths,concurrentT2Sample:concurrentT2,concurrentT2Boundary:'Exact teacher-sprint-T2 root reviewed as independently active; sample only, never staged by 014, no claim of immutable T2 contents.',untrackedVisibleCount:untracked.length,dirtyTrackedPaths:git(['diff','--name-only','-z']).toString().split('\0').filter(Boolean),preservedNonMainRefs:dropMain(refs),worktreeIdentitiesPreserved:true,software,differences,warnings:[...new Set(warnings)],scope:'Known intake files plus visible untracked paths; Git global ignore file access was unavailable.'},null,2));
if(differences.length)process.exitCode=1;
