'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration';
const OLD='CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review';
const BASE='5c9724a79146e7a6d4e9819b63a5baa6f7f7fd7b';
const SEAL_SHA='a6cf420bf886e22140d925339d3f735d92911d0c78e41e9cc7e5076861c46a47';
const ATTRIBUTE_SUFFIX='\n# KB-GOV-014: preserve this inherited attribute file as exact bytes.\n/.gitattributes -text\n';
const META=['task-queue.md','task-blocker-register.md','compile-log.md'].map(p=>'CUDA_coding/knowledge/meta/'+p);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const safePath=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!/[\\:\x00-\x1f\x7f]/.test(p)&&!p.split('/').some(x=>!x||x==='.'||x==='..'||x.toLowerCase()==='.git');
function exactPaths(actual,expected,label){for(const p of [...actual,...expected])assert.ok(safePath(p),'unsafe path: '+p);assert.equal(new Set(actual).size,actual.length,'duplicate '+label);assert.deepEqual([...actual].sort(),[...expected].sort(),label);}
function checkedRead(read,p){assert.ok(safePath(p),'unsafe path: '+p);const b=read(p);assert.ok(Buffer.isBuffer(b),'missing file: '+p);return b;}
function checkBytes(b,r){assert.equal(b.length,r.bytes,'byte length: '+r.path);assert.equal(hash(b),r.sha256,'SHA256: '+r.path);}
function records(rows,count,label){assert.ok(Array.isArray(rows));assert.equal(rows.length,count,label+' count');exactPaths(rows.map(r=>r.path),rows.map(r=>r.path),label);for(const r of rows){assert.match(r.sha256,/^[0-9a-f]{64}$/);assert.ok(Number.isSafeInteger(r.bytes)&&r.bytes>=0);}}
function verifyInputs(read){
  const sealBytes=checkedRead(read,OWN+'/input-seal.json');assert.equal(hash(sealBytes),SEAL_SHA,'fixed input seal SHA256');
  const seal=JSON.parse(sealBytes);assert.equal(seal.task,'KB-GOV-014');records(seal.files,18,'sealed inputs');
  for(const r of seal.files)checkBytes(checkedRead(read,OWN+'/'+r.path),r);
  const intake=JSON.parse(checkedRead(read,OWN+'/intake.json'));assert.equal(intake.task,'KB-GOV-014');assert.equal(intake.base,BASE);
  for(const [key,n]of [['staticPaths',717],['receipt013',187],['recovery',12],['protectedFiles',16695]])records(intake[key],n,key);
  for(const r of intake.recovery){assert.ok(safePath(r.snapshot));checkBytes(checkedRead(read,OWN+'/'+r.snapshot),r);const original=intake.staticPaths.find(f=>f.path===r.path);assert.ok(original);assert.equal(original.sha256,r.sha256);assert.equal(original.bytes,r.bytes);}
  return intake;
}
function replayMeta(read,intake){
  const meta=JSON.parse(checkedRead(read,OWN+'/meta-edits.json'));assert.equal(meta.task,'KB-GOV-014');assert.ok(Array.isArray(meta.files));exactPaths(meta.files.map(f=>f.path),META,'three rolling meta files');
  const result=new Map();
  for(const f of meta.files){
    const original=intake.recovery.find(r=>r.path===f.path);assert.equal(f.beforeSnapshot,original.snapshot,'sealed meta snapshot');
    const before=checkedRead(read,OWN+'/'+f.beforeSnapshot);let text=before.toString('utf8');assert.deepEqual(Buffer.from(text),before,'lossless UTF8 meta');assert.ok(Array.isArray(f.edits));
    for(const e of f.edits){
      if(f.path===META[2]){
        assert.equal(e.kind,'prepend','compile-log allows prepend only');assert.match(e.text,/^2026-09-09 KB-GOV-014[^\r\n]+(?:\r?\n){2}$/,'one 014 milestone paragraph');
        const header=/^# 编译日志(?:\r?\n){2}/.exec(text);assert.ok(header,'compile-log heading');text=header[0]+e.text+text.slice(header[0].length);
      }else{
        assert.equal(e.kind,'replace','governance meta allows replace only');assert.equal(typeof e.before,'string');assert.equal(typeof e.after,'string');assert.ok(e.before.length>0);assert.equal(text.split(e.before).length,2,'unique meta edit anchor');text=text.replace(e.before,e.after);
      }
    }
    if(f.path===META[2])assert.ok(f.edits.length<=1,'at most one 014 milestone');
    else{
      const strip=t=>f.path===META[0]?t.replace(/^\| KB-GOV-01[45] \|[^\r\n]*(?:\r?\n|$)/gm,''):t.replace(/^### KB-GOV-01[45] — [^\r\n]*(?:\r?\n|$)(?:(?!^#{1,3} ).*(?:\r?\n|$))*/gm,'');
      assert.equal(strip(text),strip(before.toString()),'only KB-GOV-014/015 governance records may change');
      assert.equal((text.match(f.path===META[0]?/^\| KB-GOV-014 \|/gm:/^### KB-GOV-014 — /gm)||[]).length,1,'retain one 014 record');
    }
    result.set(f.path,Buffer.from(text));
  }
  return result;
}
function verifyArchive(files,tree,baseTree){
  const read=p=>checkedRead(x=>files.get(x),p),intake=verifyInputs(read);
  const manifest=JSON.parse(read(OWN+'/integration-manifest.json')),receipt=JSON.parse(read(OWN+'/receipt-files.json'));
  assert.equal(manifest.task,'KB-GOV-014');assert.equal(manifest.base,BASE);assert.equal(receipt.task,'KB-GOV-014');assert.ok(Array.isArray(receipt.files));
  records(manifest.staticPaths,717,'manifest static paths');records(manifest.receipt013,187,'manifest 013 receipts');
  exactPaths(manifest.staticPaths.map(r=>r.path),intake.staticPaths.map(r=>r.path),'immutable static path set');
  const normalized=rows=>rows.map(({path,sha256,bytes})=>({path,sha256,bytes})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  assert.deepEqual(normalized(manifest.receipt013),normalized(intake.receipt013),'immutable 013 records');
  for(const p of receipt.files)assert.ok(safePath(p)&&p.startsWith(OWN+'/'),'own receipt path');assert.ok(receipt.files.includes(OWN+'/receipt-files.json'),'receipt inventory includes itself');
  exactPaths([...tree.keys()].filter(p=>p.startsWith(OWN+'/')),receipt.files,'exact own receipt inventory');
  const allowed=[...manifest.staticPaths.map(r=>r.path),...manifest.receipt013.map(r=>r.path),...receipt.files];exactPaths(allowed,allowed,'combined allowed paths');
  for(const r of [...manifest.staticPaths,...manifest.receipt013]){assert.equal(r.mode,'100644','manifest regular mode');checkBytes(read(r.path),r);}
  for(const p of allowed){
    assert.match(tree.get(p)||'',/^100644 blob [0-9a-f]{40}$/,'regular committed file: '+p);const b=read(p);
    const oid=crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');assert.equal(tree.get(p),'100644 blob '+oid,'Git blob bytes: '+p);
  }
  const changes=[...new Set([...baseTree.keys(),...tree.keys()])].filter(p=>baseTree.get(p)!==tree.get(p));
  const changedStatic=manifest.staticPaths.filter(r=>baseTree.get(r.path)!==tree.get(r.path)).map(r=>r.path);
  assert.equal(changedStatic.length,497,'changed static count');assert.ok(Array.isArray(manifest.changedStaticPaths));exactPaths(manifest.changedStaticPaths,changedStatic,'calculated changed static paths');
  exactPaths(changes,[...changedStatic,...manifest.receipt013.map(r=>r.path),...receipt.files],'exact baseline-to-commit scope including deletions');
  const software=t=>[...t].filter(([p])=>p.startsWith('CUDA_coding/CUDA_code/')).sort(([a],[b])=>a<b?-1:a>b?1:0);
  assert.deepEqual(software(tree),software(baseTree),'complete software subtree remains at BASE');
  const proposals=JSON.parse(read(OLD+'/proposals.json'));assert.equal(proposals.task,'KB-GOV-013');assert.equal(proposals.edits.length,9);exactPaths(proposals.edits.map(e=>e.path),intake.recovery.slice(0,9).map(r=>r.path),'nine approved proposal paths');
  const expected=replayMeta(read,intake);
  for(const e of proposals.edits){
    assert.ok(safePath(e.snapshot));const b=read(OLD+'/'+e.snapshot);checkBytes(b,{path:e.path,sha256:e.after,bytes:e.bytes});
    if(e.path==='.gitattributes'){const actual=read(e.path);assert.deepEqual(actual,Buffer.concat([b,Buffer.from(ATTRIBUTE_SUFFIX)]),'required exact approved attribute suffix');expected.set(e.path,actual);}else expected.set(e.path,b);
  }
  for(const r of intake.staticPaths){if(expected.has(r.path))assert.deepEqual(read(r.path),expected.get(r.path),'exact approved target: '+r.path);else checkBytes(read(r.path),r);}
  return {staticPaths:717,receipt013:187,changedStaticPaths:497,ownReceiptFiles:receipt.files.length,sealedInputs:18,protectedFilesRecorded:16695,gitChangeScopeExact:true,softwareTreeUnchanged:true};
}
function gitRead(repo,args,input){const r=spawnSync('git',args,{cwd:repo,input,maxBuffer:150e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}});assert.equal(r.status,0,r.error?.message||r.stderr?.toString());return r.stdout;}
function readTree(repo,revision){return new Map(gitRead(repo,['ls-tree','-r','-z',revision]).toString().split('\0').filter(Boolean).map(s=>{const i=s.indexOf('\t');assert.ok(i>0);return [s.slice(i+1),s.slice(0,i)];}));}
function readBlobs(repo,tree,paths,files){
  const selected=paths.filter(p=>!files.has(p));if(!selected.length)return;
  const objects=selected.map(p=>{assert.ok(safePath(p));const r=/^100644 blob ([0-9a-f]{40})$/.exec(tree.get(p)||'');assert.ok(r,'missing or nonregular committed file: '+p);return r[1];});
  const data=gitRead(repo,['cat-file','--batch'],objects.join('\n')+'\n');let offset=0;
  for(let i=0;i<selected.length;i++){const end=data.indexOf(10,offset),m=/^([0-9a-f]{40}) blob (\d+)$/.exec(data.subarray(offset,end).toString());assert.ok(m,'batch blob header');assert.equal(m[1],objects[i]);const size=Number(m[2]);assert.equal(data[end+size+1],10,'batch blob boundary');files.set(selected[i],data.subarray(end+1,end+size+1));offset=end+size+2;}assert.equal(offset,data.length);
}
function verifyCommit(repo,revision){
  assert.match(revision,/^[0-9a-f]{40}$/,'supply an immutable 40-character commit SHA');assert.equal(gitRead(repo,['rev-parse',revision+'^{commit}']).toString().trim(),revision,'commit object required');gitRead(repo,['merge-base','--is-ancestor',BASE,revision]);
  const tree=readTree(repo,revision),baseTree=readTree(repo,BASE),files=new Map();readBlobs(repo,tree,[...tree.keys()].filter(p=>p.startsWith(OWN+'/')),files);
  const intake=verifyInputs(p=>files.get(p));readBlobs(repo,tree,[...intake.staticPaths,...intake.receipt013].map(r=>r.path),files);
  return {...verifyArchive(files,tree,baseTree),mode:'fixed-commit',commit:revision,base:BASE,notRun:['LIVE_WORKSPACE_PROTECTION','GPU_OR_MPI_VALIDATION','PUBLICATION_OR_LICENSE_CLEARANCE']};
}
module.exports={verifyInputs,verifyArchive,verifyCommit};
if(require.main===module){try{
  assert.equal(process.argv.length,3,'usage: node verify-integration.cjs <40-character-commit-SHA> | --inputs');const arg=process.argv[2],repo=path.resolve(__dirname,'../../../../../..');
  const result=arg==='--inputs'?(()=>{const i=verifyInputs(p=>fs.readFileSync(path.join(repo,p)));return {mode:'sealed-inputs',staticPaths:i.staticPaths.length,receipt013:i.receipt013.length,recovery:i.recovery.length,protectedFilesRecorded:i.protectedFiles.length,liveFilesChecked:false};})():verifyCommit(repo,arg);
  console.log(JSON.stringify(result,null,2));console.log('KB-GOV-014 INTEGRATION: PASS');
}catch(e){console.error('KB-GOV-014 INTEGRATION: FAIL\n'+e.message);process.exitCode=1;}}
