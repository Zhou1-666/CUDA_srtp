'use strict';
// One-time preparation: refresh explicit manifests from reviewed current bytes; no Git writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../../../../..'),OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration',AUDIT='CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review';
const abs=p=>path.join(ROOT,p),read=p=>fs.readFileSync(abs(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const json=p=>JSON.parse(read(p)),save=(p,j)=>fs.writeFileSync(abs(OWN+'/'+p),JSON.stringify(j,null,2)+'\n');
const git=args=>{const r=spawnSync('git',['--no-optional-locks','-c','core.quotepath=false',...args],{cwd:ROOT,maxBuffer:96e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout;};
function files(dir){let out=[];for(const e of fs.readdirSync(abs(dir),{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const p=dir+'/'+e.name;if(e.isDirectory())out.push(...files(p));else if(e.isFile())out.push(p);}return out.sort();}
const intake=json(OWN+'/intake.json'),plan=json(AUDIT+'/integration-paths.json'),proposals=json(OWN+'/applied-proposals.json'),meta=json(OWN+'/meta-edits.json');
const replacements=new Map(proposals.edits.map(e=>[e.path,e.after]));
for(const f of meta.files){let text=read(OWN+'/'+f.beforeSnapshot).toString();for(const e of f.edits){if(e.kind==='replace'){assert.equal(text.split(e.before).length,2,'unique meta anchor');text=text.replace(e.before,e.after);}else if(e.kind==='prepend'){const match=/^# 编译日志(\r?\n)(\r?\n)/.exec(text);assert.ok(match);text=match[0]+e.text+text.slice(match[0].length);}else assert.fail('unknown edit');}replacements.set(f.path,hash(Buffer.from(text)));}
const staticPaths=intake.staticPaths.map(f=>{const b=read(f.path);assert.equal(hash(b),replacements.get(f.path)||f.sha256,'unreviewed static drift: '+f.path);return {path:f.path,sha256:hash(b),bytes:b.length,mode:'100644'};});
const receipt013=intake.receipt013.map(f=>{assert.equal(hash(read(f.path)),f.sha256,'013 changed');return {...f,mode:'100644'};});
const baseTree=new Map(git(['ls-tree','-r','-z',intake.base]).toString().split('\0').filter(Boolean).map(s=>{const i=s.indexOf('\t');return [s.slice(i+1),s.slice(0,i).split(' ')[2]];}));
const changedStaticPaths=staticPaths.filter(f=>baseTree.get(f.path)!==blob(read(f.path))).map(f=>f.path);assert.equal(changedStaticPaths.length,497);
save('integration-manifest.json',{task:'KB-GOV-014',base:intake.base,inputSealSha256:hash(read(OWN+'/input-seal.json')),intakeSha256:hash(read(OWN+'/intake.json')),staticPaths,receipt013,changedStaticPaths});
for(const name of ['receipt-files.json','group-a.nul','group-b.nul','local/prepared-summary.json'])if(!fs.existsSync(abs(OWN+'/'+name)))fs.writeFileSync(abs(OWN+'/'+name),'');
const ownFiles=files(OWN);save('receipt-files.json',{task:'KB-GOV-014',files:ownFiles});
const aStatic=plan.rows.filter(r=>r.group!=='documents-and-attributes'||r.path==='.gitattributes').map(r=>r.path).filter(p=>changedStaticPaths.includes(p));
const bStatic=plan.rows.filter(r=>r.group==='documents-and-attributes'&&r.path!=='.gitattributes').map(r=>r.path);assert.equal(aStatic.length,471);assert.equal(bStatic.length,26);
const aOwnNames=['README.md','progress.md','review-notes.md','intake.json','input-seal.json','applied-proposals.json','meta-edits.json','group-a.nul','local/capture-intake.cjs','local/apply-proposals.cjs','local/prepare-manifests.cjs','local/check-staged.cjs','local/attribute-candidate.txt','local/intake-013-replay.log'];
const aOwn=ownFiles.filter(p=>p.startsWith(OWN+'/raw/')||aOwnNames.includes(p.slice(OWN.length+1)));
const a=[...aStatic,...receipt013.map(f=>f.path),...aOwn].sort(),b=[...bStatic,...ownFiles].sort();
fs.writeFileSync(abs(OWN+'/group-a.nul'),Buffer.from(a.map(p=>p+'\0').join('')));fs.writeFileSync(abs(OWN+'/group-b.nul'),Buffer.from(b.map(p=>p+'\0').join('')));
const summary={task:'KB-GOV-014',base:intake.base,staticPaths:717,alreadyMain:220,remainingStatic:497,groupAStatic:471,groupBStatic:26,receipt013:receipt013.length,ownReceipt:ownFiles.length,groupA:a.length,groupB:b.length,allSoftwarePathsExcluded:!staticPaths.some(f=>f.path.startsWith('CUDA_coding/CUDA_code/'))};save('local/prepared-summary.json',summary);console.log(JSON.stringify(summary,null,2));
