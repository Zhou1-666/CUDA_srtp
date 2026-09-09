'use strict';
// Fixed G1 evidence only. Never execute historical scripts or read their m.root.
const assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const COMMIT='ee6fbf8c1f920f7e51c95bff0e1dac09107fbf67';
const V='CUDA_coding/knowledge/outputs/validation/';
const MANIFEST=V+'KB-GOV-008-20260909-evidence-archive/input-manifest.json';
const MANIFEST_SHA='823f890f2814f7a8e841c6e569b239c8e3abd569da472702fdd31c482004ce1d';
const IDS=['003','004','005','006','007'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

function loadArchive(repo){
  const git=(args,input)=>{
    const r=spawnSync('git',args,{cwd:repo,input,maxBuffer:40e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
    assert.equal(r.status,0,'pinned G1 commit '+COMMIT+' unavailable: '+(r.error?.message||r.stderr?.toString()));
    return r.stdout;
  };
  const manifest=git(['show',COMMIT+':'+MANIFEST]);
  assert.equal(hash(manifest),MANIFEST_SHA,'manifest SHA');
  const names=JSON.parse(manifest).files.map(f=>f.path);
  const stream=git(['cat-file','--batch'],names.map(f=>COMMIT+':'+f+'\n').join(''));
  const files=new Map([[MANIFEST,manifest]]);let offset=0;
  for(const name of names){
    const end=stream.indexOf(10,offset),header=stream.subarray(offset,end).toString();
    const match=/^[0-9a-f]+ blob (\d+)$/.exec(header);assert.ok(match,'missing frozen blob: '+name);
    const size=Number(match[1]);assert.equal(stream[end+1+size],10,'blob boundary');
    files.set(name,stream.subarray(end+1,end+1+size));offset=end+size+2;
  }
  assert.equal(offset,stream.length,'blob stream complete');return files;
}

const localTarget=url=>{
  const target=url.split('|')[0].split('#')[0];
  return !target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('/')?null:target;
};
const fragment=url=>url.split('|')[0].split('#').slice(1).join('#');
function restoreLinks(body,archivePath,records,sourcePath){
  let n=0;
  const resolves=(file,url,expected)=>{
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),localTarget(url)));
    assert.ok(target===expected||target+'.md'===expected,'link target mismatch: '+url);
  };
  const restored=body.replace(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g,(full,wiki,label,markdown)=>{
    const url=wiki||markdown;if(!localTarget(url))return full;
    const item=records[n++];assert.ok(item,'missing link mapping');assert.equal(url,item.after,'mapped link text');
    const target=item.target||item.resolvesTo;resolves(archivePath,url,target);
    assert.equal(fragment(url),item.fragment.replace(/^#/,''),'anchor preserved');
    assert.equal(fragment(item.before),fragment(url),'original anchor preserved');
    if(item.correction){
      assert.equal(sourcePath,'CUDA_coding/knowledge/meta/task-queue.md','unapproved correction source');
      assert.equal(item.before,'outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md','unapproved correction');
      assert.equal(target,'CUDA_coding/knowledge/outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md','unapproved correction target');
    }else resolves(sourcePath,item.before,target);
    return wiki?'[['+item.before+']]':'['+label+']('+item.before+')';
  });
  assert.equal(n,records.length,'unused link mappings');return restored;
}

function verifyArchive(files,ids=IDS){
  assert.ok(ids.length&&ids.every(id=>IDS.includes(id))&&new Set(ids).size===ids.length,'task must be 003, 004, 005, 006 or 007');
  const bytes=f=>{assert.ok(files.has(f),'missing frozen input: '+f);return files.get(f);};
  const text=f=>bytes(f).toString('utf8'),json=f=>JSON.parse(text(f));
  assert.equal(hash(bytes(MANIFEST)),MANIFEST_SHA,'manifest SHA');
  const inventory=json(MANIFEST);
  assert.deepEqual([...files.keys()].sort(),[MANIFEST,...inventory.files.map(f=>f.path)].sort(),'frozen inventory');
  for(const f of inventory.files){assert.equal(bytes(f.path).length,f.bytes,'bytes: '+f.path);assert.equal(hash(bytes(f.path)),f.sha256,'SHA: '+f.path);}
  const batch=id=>{
    const roots=inventory.roots.filter(f=>f.startsWith(V+'KB-GOV-'+id+'-'));assert.equal(roots.length,1,'one frozen batch');return roots[0];
  };
  const manifest=id=>json(batch(id)+'/raw/before-manifest.json');
  const backup=(id,suffix)=>text(manifest(id).snapshots.find(s=>s.path.endsWith(suffix)).backup);
  const bodyAfter=(value,marker)=>{const start=value.indexOf(marker);assert.ok(start>=0,'snapshot body marker');return value.slice(start+marker.length);};
  const tasks=[];
  for(const id of ids){
    const base=batch(id),m=manifest(id),coverage={rawBackups:m.snapshots.length},checks=[];
    for(const s of m.snapshots)assert.equal(hash(bytes(s.backup)),s.sha256,'backup SHA: '+s.backup);
    checks.push('FROZEN_INPUT_BYTES','RAW_BACKUP_SHA');
    let mappings=[];
    if(id==='003'){
      mappings=json(base+'/local/link-relocations.json');
      for(const [i,name]of ['penta-active-context.snapshot.md','wiki-00-index.snapshot.md'].entries()){
        const source=m.snapshots[i],original=text(source.backup),front=original.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
        assert.ok(front,'original metadata');const archive=text(base+'/'+name);assert.ok(archive.includes(front[0].trimEnd()),'retained metadata');
        const restored=restoreLinks(bodyAfter(archive,'## 原文正文\n\n'),base+'/'+name,mappings.filter(x=>x.source===source.path),source.path);
        assert.equal(restored,original.slice(front[0].length),'original body restored');
      }
      const brief=text(base+'/local/brief-body.md.txt');assert.ok(Buffer.byteLength(brief)<10000,'bounded frozen brief');
      assert.ok(!/job\d{5,}|PENDING|以下.{0,12}历史|以本段为准/.test(brief),'frozen brief has no scheduling stack');
      assert.ok(brief.includes('task-queue')&&brief.includes('task-blocker-register'),'frozen brief routing');
      coverage.archiveBodies=2;checks.push('BODY_AND_METADATA_RESTORATION','FROZEN_BRIEF_BODY_BOUNDARY');
    }else if(id==='004'||id==='005'){
      mappings=json(base+'/local/link-relocations.json');const source=m.snapshots[0],original=text(source.backup);
      const name=id==='004'?'task-queue.snapshot.md':'task031-blocker.snapshot.md';
      const restored=restoreLinks(bodyAfter(text(base+'/'+name),'## 原文全文\n\n'),base+'/'+name,mappings,source.path);
      assert.equal(restored,id==='004'?original:original.slice(m.section.start,m.section.end),'original text restored');
      if(id==='004'){
        const after=backup('005','/task-queue.md'),top=text(base+'/local/new-top.md.txt');assert.ok(after.startsWith(top),'frozen next-batch queue contains delivered top');
        const start='## 既有任务（保留原编号与关闭证据）',end='## 知识维护交付（不参与软件排程）';
        const contracts=s=>{assert.ok(s.includes(start)&&s.includes(end));return s.slice(s.indexOf(start),s.indexOf(end));};
        assert.equal(contracts(after),contracts(original),'frozen software contracts preserved');
        coverage.softwareRows=after.split(/\r?\n/).filter(s=>s.startsWith('| TASK-')).length;assert.equal(coverage.softwareRows,48);
        coverage.documentedLinkCorrections=mappings.filter(x=>x.correction).length;assert.equal(coverage.documentedLinkCorrections,1);
        checks.push('FULL_QUEUE_RESTORATION','FROZEN_004_TO_005_QUEUE_CONTINUITY');
      }else{
        assert.equal(hash(Buffer.from(restored)),m.section.sha256,'TASK-031 original section SHA');
        const after=backup('006','/task-blocker-register.md'),active=text(base+'/local/new-active.md.txt');
        const start='### TASK-031 —',end='### TASK-033 —';
        assert.equal(after.slice(after.indexOf(start),after.indexOf(end)),active,'frozen next-batch blocker contains delivered section');
        assert.equal(after.slice(0,after.indexOf(start)),original.slice(0,m.section.start),'earlier frozen blocker entries');
        const pending='## 知识维护待办（不参与软件排程）';
        assert.ok(after.slice(after.indexOf(end)).startsWith(original.slice(m.section.end,original.indexOf(pending))),'later frozen software blockers');
        coverage.activeSectionBytes=Buffer.byteLength(active);assert.ok(coverage.activeSectionBytes<6000);
        checks.push('TASK031_SECTION_RESTORATION','FROZEN_005_TO_006_BLOCKER_CONTINUITY');
      }
      coverage.archiveBodies=1;
    }else if(id==='006'){
      mappings=json(base+'/local/link-relocations.json');const original=text(m.snapshots[0].backup),archivePath=base+'/task031-compile-log.snapshot.md',archive=text(archivePath);
      assert.equal(m.records.length,142);assert.equal((archive.match(/^## 原第\d+行$/gm)||[]).length,142);
      let recovered='',reduced='',cursor=0,used=0;const {navigation,edits}=json(base+'/local/replacements.json');
      assert.deepEqual(edits.map(e=>e.line),m.records.map(r=>r.line),'record replacement coverage');
      for(const [i,record]of m.records.entries()){
        const heading='## 原第'+record.line+'行\n\n',start=archive.indexOf(heading),end=archive.indexOf('<!-- end-record:'+record.line+' -->',start);
        assert.ok(start>=0&&end>start,'record boundaries');assert.ok(record.start>=cursor&&record.end>record.start&&record.end<=original.length,'source offsets');
        const records=mappings.filter(x=>x.line===record.line);used+=records.length;
        const restored=restoreLinks(archive.slice(start+heading.length,end),archivePath,records,m.snapshots[0].path);
        assert.equal(restored,original.slice(record.start,record.end),'record text restored');assert.equal(hash(Buffer.from(restored)),record.sha256,'record SHA');
        recovered+=original.slice(cursor,record.start)+restored;reduced+=original.slice(cursor,record.start)+edits[i].replacement;cursor=record.end;
      }
      recovered+=original.slice(cursor);reduced+=original.slice(cursor);assert.equal(hash(Buffer.from(recovered)),m.snapshots[0].sha256,'full log restored');
      assert.equal(used,mappings.length,'all record mappings used');
      const titleEnd=reduced.indexOf('\n')+1;reduced=reduced.slice(0,titleEnd)+navigation+reduced.slice(titleEnd);
      const after=backup('007','/compile-log.md').replace(/\n2026-09-09 KB-GOV-006[^\n]+\n/g,'');
      assert.equal(after,reduced,'frozen 006-to-007 log continuity');
      coverage.archivedRecords=142;coverage.frozenMilestones=(reduced.match(/^2026-\d\d-\d\d TASK-031/gm)||[]).length;
      assert.equal(coverage.frozenMilestones,22);assert.equal(json(base+'/local/milestones.json').length,22);
      checks.push('142_RECORDS_AND_FULL_LOG_RESTORATION','FROZEN_006_TO_007_MILESTONE_CONTINUITY');
    }else{
      const report=text(base+'/audit-report.md');
      const verdicts=[...report.matchAll(/^\| (\d+) [^|]+\| \*\*([^*]+)\*\*；([^|]+)\|/gm)].map(x=>({id:+x[1],verdict:x[2],reason:x[3].trim(),reasonCharacters:[...x[3].trim()].length}));
      assert.deepEqual(verdicts,json(base+'/local/verdicts.json'),'audit table matches recorded verdicts');
      assert.deepEqual(verdicts.map(x=>x.id),Array.from({length:13},(_,i)=>i+1));
      for(const x of verdicts)assert.ok(['合理','部分合理','不合理'].includes(x.verdict)&&x.reasonCharacters<=30);
      const paths=json(base+'/local/governance-paths.json');assert.equal(paths.length,17);assert.equal(new Set(paths.map(x=>x.path)).size,17);
      for(const s of paths)assert.equal(hash(bytes(s.baselineBackup)),s.baselineSha256,'ownership baseline SHA');
      coverage.verdicts=13;coverage.ownershipPaths=17;coverage.recordedPreExistingChanges=paths.filter(s=>s.preExistingChangeIgnoringCRLF).length;
      assert.equal(coverage.recordedPreExistingChanges,13);checks.push('AUDIT_VERDICT_TABLE_CONSISTENCY','OWNERSHIP_LEDGER_BASELINE_HASHES');
    }
    if(mappings.length){
      coverage.linkMappings=mappings.length;coverage.linkTargetsInG1=mappings.filter(x=>files.has(x.target||x.resolvesTo)).length;
      coverage.linkTargetsOutsideG1=mappings.length-coverage.linkTargetsInG1;checks.push('LEXICAL_LINK_TARGET_AND_ANCHOR_PRESERVATION');
    }
    tasks.push({task:id,status:'PASS',checks,coverage,notRun:['LIVE_WORKSPACE_AND_GIT_PROTECTION','EXTERNAL_LINK_EXISTENCE_AND_ANCHOR_REACHABILITY','ORIGINAL_FULL_VERIFIER','CUDA_MPI_GPU_VALIDATION',...(id==='003'?['COMPLETE_POST_MIGRATION_LIVE_PAGE_REPLAY']:[]),...(id==='007'?['REASSESSMENT_OF_13_RECOMMENDATIONS','LIVE_OWNERSHIP_AND_STATUS_AUDIT']:[])]});
  }
  return {scope:'fixed G1 snapshots; not historical full acceptance',commit:COMMIT,inputFiles:inventory.files.length,tasks};
}

module.exports={loadArchive,verifyArchive,restoreLinks};
if(require.main===module){
  try{
    const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args.length||IDS.includes(args[0])),'usage: node verify.cjs [003|004|005|006|007]');
    const result=verifyArchive(loadArchive(path.resolve(__dirname,'../../../../..')),args.length?args:IDS);
    console.log(JSON.stringify(result,null,2));
    for(const task of result.tasks)console.log('KB-GOV-'+task.task+' SNAPSHOT REPLAY: PASS');
  }catch(error){console.error('SNAPSHOT REPLAY: FAIL\n'+error.message);process.exitCode=1;}
}
