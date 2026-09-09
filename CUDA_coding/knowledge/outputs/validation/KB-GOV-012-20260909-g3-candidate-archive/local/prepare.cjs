'use strict';
// One-time candidate writer. Refuses changed inputs; never writes original pages.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync,spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../../../../../..'),OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive',PREV='CUDA_coding/knowledge/outputs/validation/KB-GOV-011-20260909-g3-ownership-review';
const s=JSON.parse(fs.readFileSync(path.join(ROOT,OWN,'raw/start-state.json'))),DEST=s.worktree,KB002='09a97586fbcce952cdd3ac233e25082cbc842220';
const V='CUDA_coding/knowledge/outputs/validation/',REG='CUDA_coding/knowledge/raw/source-registry.md';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=f=>fs.readFileSync(path.join(ROOT,f));
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,maxBuffer:60e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
const put=(root,f,b)=>{const d=path.join(root,f);fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,b);};
const json=(f,v)=>put(ROOT,OWN+'/'+f,JSON.stringify(v,null,2)+'\n');
const files=r=>fs.readdirSync(path.join(ROOT,r),{recursive:true}).map(x=>r+'/'+x.replaceAll('\\','/')).filter(f=>fs.statSync(path.join(ROOT,f)).isFile()).sort();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:DEST,encoding:'utf8'}).trim(),s.g2);
assert.ok(!fs.existsSync(path.join(ROOT,OWN,'input-manifest.json')),'candidate already prepared');
for(const x of [...s.pages,s.context[0],...s.evidence])assert.equal(hash(read(x.path)),x.sha256,'input drift: '+x.path);
const sourceRoots=[V+'TASK-007-20260824-paraai-a100-profile',V+'TASK-020-20260825-critical-path'];
const sources=sourceRoots.map((r,i)=>({id:'SRC-0'+(32+i),root:r,role:i?'derived-model':'measured-input',derivedFrom:i?['SRC-032']:[],files:files(r).map(f=>{const b=read(f),blob=git('rev-parse',KB002+':'+f).toString().trim();assert.deepEqual(b,git('show',KB002+':'+f),'KB002 identity: '+f);return {path:f,bytes:b.length,sha256:hash(b),kb002Blob:blob};})}));
assert.deepEqual(sources.map(x=>x.files.length),[23,3]);
for(const src of sources){
  const sums=read(src.root+'/SHA256SUMS.txt').toString().trim().split(/\r?\n/);
  for(const line of sums){const m=/^([0-9a-f]{64})\s+(.+)$/.exec(line);assert.ok(m);assert.equal(hash(read(src.root+'/'+m[2])),m[1]);}
  src.manifest=OWN+'/raw/sources/'+src.id+'.json';
  json('raw/sources/'+src.id+'.json',{sourceId:src.id,role:src.role,derivedFrom:src.derivedFrom,kb002Commit:KB002,files:src.files,measurementSelection:src.id==='SRC-032'?'formal array _3.._7.out: five jobs, ten iterations each; _1/_2 warmup; smoke/nsys not quantitative inputs':'critical-path.csv derived from SRC-032 _3.._7; G50 is a model prediction, not measured overlap speedup',boundary:'Exact available file collection and inherited manifests. The historic transfer tar identity is recorded by the old README but is not independently re-established from this file collection.'});
  src.manifestSha256=hash(read(src.manifest));
}
const extra=[
  ['CUDA_coding/knowledge/outputs/plans/TASK-007-20260828-persistent-pinned-design.md','inherited design approval context, distinct from adoption'],
  [V+'TASK-007-20260830-task5-target-gates/TASK-007-20260831-withdrawal-disposition.md','dated negative disposition and unexecuted gate boundary'],
  [V+'TASK-023-20260827-formal-validation-v2/local/job1457454-analysis-summary.json','exact all10/stable8 summary keys and launch pairing limit'],
  [V+'TASK-025-20260828-local-implementation/30-job1459808-profiled-stage-readback.md','directional stage aggregation protocol'],
  [V+'TASK-025-20260828-local-implementation/13-job1459639-local-readback.md','separate smoke evidence boundary'],
  [V+'TASK-025-20260828-local-implementation/34-TASK-025-final-contract-review.md','formal negative adoption and separate smoke reference'],
  [V+'TASK-009-20260824-paraai-crossnode-smoke/README.md','dated site example and recorded smoke limits'],
  ...files(V+'TASK-009-20260824-paraai-crossnode-smoke/raw').map(f=>[f,'original stdout/stderr supporting the dated site example'])
].map(([f,role])=>{const b=read(f);return {path:f,bytes:b.length,sha256:hash(b),role};});
assert.equal(extra.length,9,'reviewed extra evidence count');
const evidence=[...s.evidence.map(f=>({...f,role:'complete inherited KB-GOV-011 receipt'})),...sources.flatMap(x=>x.files.map(f=>({...f,role:x.id+' exact source collection'}))),...extra];
assert.equal(new Set(evidence.map(f=>f.path)).size,evidence.length);
const stat=JSON.parse(read(extra[2].path));assert.equal(stat.statistics.plain_22_vs_28_paired_percent.p2_all10.median,-9.847843444);assert.equal(stat.statistics.plain_22_vs_28_paired_percent.p2_stable8.median,-14.504494936);
const notes=[
  '下文2026-08-25的pageable否定结果、2026-08-28的pinned重开及设计批准均作为历史保留。后续按2026-08-31用户批准的停止规则，persistent pinned候选已作[撤回处置](../../outputs/validation/TASK-007-20260830-task5-target-gates/TASK-007-20260831-withdrawal-disposition.md)，L6保留`NOT-RUN/environment limitation`；撤回不等于证明无收益或求解器正确性失败，也不把旧设计批准升级为采用。\n\n来源角色：SRC-003P是实现背景；SRC-032是下文五次正式profile的实测输入；SRC-026支持TASK-025正式per-call pinned负结果。批准/撤回由各自文档说明，不冒充实验来源。',
  '下文MPI-only占比来自SRC-032的五个正式作业；SRC-033登记由这些输入得到的TASK-020模型、CSV及原清单。SRC-003P/020/021仅作实现和论文背景。`10.8458%`是50%效率假设下的预测，3/5是模型稳定性Gate，均不是实测overlap加速；原决策、阈值和重开条件保留。',
  '下方Plain表采用stable8敏感性口径；主协议all10与其分别报告。[固定JSON](../../outputs/validation/TASK-023-20260827-formal-validation-v2/local/job1457454-analysis-summary.json)的`statistics.plain_22_vs_28_paired_percent.p2_all10.median`为`-9.847843444%`，`p2_stable8.median`为`-14.504494936%`。五次配对按启动序号对应，22/28槽启动块未按时间交错（`limits[4]`）；本注释不把两种统计口径混用或改称通信字节收益。',
  '下表D2H/H2D“降低范围”由forward和backward两个方向降幅的最小值、最大值组成，非置信区间。[阶段回读](../../outputs/validation/TASK-025-20260828-local-implementation/30-job1459808-profiled-stage-readback.md)先按运行/方向/迭代取双rank最大值，再对五次正式运行各8轮、共40个样本求均值。smoke无显式回落另由[job1459639回执](../../outputs/validation/TASK-025-20260828-local-implementation/13-job1459639-local-readback.md)支持；SRC-026与[最终合同复核](../../outputs/validation/TASK-025-20260828-local-implementation/34-TASK-025-final-contract-review.md)对应正式per-call负结果，不把正式包来源自动扩为smoke包或persistent收益证明。',
  '本页项目状态栏和TASK-007/020段按原`updated: 2026-08-25`时点阅读；既有正文及`review_by: 2026-09-07`保留，不自动续期。TASK-007后续pinned重开和2026-08-31撤回见[[../decisions/ADR-005-TASK-007不实施persistent-host-staging]]；TASK-020模型边界见[[../decisions/ADR-006-TASK-020暂不实施overlap]]。实时排程读取开发树[[../../meta/task-queue]]，本归档随带queue仅是固定G2历史快照。\n\nSRC-019/020/021提供三对角方法背景；SRC-032/033分别支持本项目旧profile与派生模型，SRC-026支持per-call pinned负结果。开头的优化顺序是项目方法建议，不是三篇论文共同证明的定理；不升级为五对角采用、性能或启动授权。',
  '“节点、rank与GPU的关系”和“TASK-009当前启动链路”中的现场目标与参数按2026-08-24 ParaAI诊断示例阅读，见[job1449615跨节点smoke](../../outputs/validation/TASK-009-20260824-paraai-crossnode-smoke/README.md)。该示例不代表TASK-009后续正式P8验收范围，也不是长期通用启动参数。实时状态须读开发树[[../../meta/task-queue]]；本归档随带queue仅为固定G2历史快照。官方4.1与5.0.7页面的版本边界沿用原页，实际参数须与目标站点版本核对。'
];
const sourceLists={ '01':['SRC-003P','SRC-026','SRC-032'], '02':['SRC-003P','SRC-020','SRC-021','SRC-032','SRC-033'], '05':['SRC-019','SRC-020','SRC-021','SRC-026','SRC-032','SRC-033'] };
const documents=s.pages.map((d,i)=>{
  const original=read(d.snapshot);let text=original.toString('utf8'),edits=[];const nl=text.includes('\r\n')?'\r\n':'\n';
  if(sourceLists[d.id]){const before=text.match(/^source_ids:.*$/m)[0].replace(/\r$/,''),after='source_ids: ['+sourceLists[d.id].join(', ')+']';edits.push({before,after});text=text.replace(before,after);}
  if(i<6){const before=nl+'## ',after=nl+'## 2026-09-09 G3候选注释'+nl+nl+notes[i].replaceAll('\n',nl)+nl+nl+'## ';assert.ok(text.includes(before));edits.push({before,after,firstOnly:true});text=text.replace(before,after);}
  const candidate=Buffer.from(text);if(i===6)assert.deepEqual(candidate,original);
  put(DEST,d.path,candidate);put(ROOT,OWN+'/raw/candidates/'+d.id+'.txt',candidate);
  const diff=spawnSync('git',['diff','--no-index','--no-ext-diff','--no-color','--',path.join(ROOT,d.snapshot),path.join(ROOT,OWN,'raw/candidates/'+d.id+'.txt')],{maxBuffer:5e6});assert.ok([0,1].includes(diff.status));put(ROOT,OWN+'/local/page-'+d.id+'.patch',diff.stdout);
  return {id:d.id,path:d.path,snapshot:d.snapshot,sourceSha256:d.sha256,bytes:candidate.length,sha256:hash(candidate),edits,attribution:'Inherited entire draft page; KB-GOV-012 only the listed annotations and source_ids additions'};
});
const originalRegistry=read(s.context[0].snapshot),registryText=originalRegistry.toString(),nl=registryText.includes('\r\n')?'\r\n':'\n';
assert.ok(!/^\| SRC-03[23] \|/m.test(registryText),'source IDs already allocated');
const rows=sources.map(src=>'| '+src.id+' | '+(src.id==='SRC-032'?'experiment/file-set | TASK-007 旧pageable profile精确文件集合':'derived-model/file-set | TASK-020 critical-path派生模型记录')+' | [固定文件清单](../outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/raw/sources/'+src.id+'.json) | `'+src.manifestSha256+'`；'+src.files.length+'文件；2026-09-09登记；既有KB002对象逐项相同 | private/internal，含站点/路径信息；不新增公开再分发授权 | 候选中已部分编译到'+(src.id==='SRC-032'?'ADR-005/006与迁移矩阵；定量仅_3至_7五正式输出，_1/_2预热及smoke/nsys分开':'ADR-006与迁移矩阵；派生自SRC-032五正式输出，G50非实测overlap收益')+' |').join(nl)+nl;
const marker=nl+'## 状态定义';assert.equal(registryText.split(marker).length,2);const registryAfter=registryText.replace(marker,rows+marker);
put(DEST,REG,registryAfter);put(ROOT,OWN+'/raw/candidates/registry.txt',registryAfter);
const registry={path:REG,snapshot:s.context[0].snapshot,sourceSha256:s.context[0].sha256,sha256:hash(Buffer.from(registryAfter)),bytes:Buffer.byteLength(registryAfter),edit:{before:marker,after:rows+marker},newIds:['SRC-032','SRC-033']};
const baseReg=read(OWN+'/raw/context/g2-registry.txt').toString();const ids=t=>[...t.matchAll(/^\| (SRC-[^ ]+) \|/mg)].map(x=>x[1]);
json('source-admission.json',{task:s.task,sources,registry:{...registry,inheritedFromLiveIds:ids(registryText),g2Ids:ids(baseReg),inheritedNewIdsVsG2:ids(registryText).filter(x=>!ids(baseReg).includes(x)),role:'Full inherited live registry snapshot plus exactly two newly allocated source rows; prior source claims and licensing text are inherited, not revalidated or authored by 012'},toolDependencies:['CUDA_coding/CUDA_code/源代码/verify/task020_critical_path_audit.js','CUDA_coding/CUDA_code/源代码/verify/task020_critical_path_audit_test.js'].map(f=>({path:f,kb002:KB002,blob:git('rev-parse',KB002+':'+f).toString().trim(),sha256:hash(git('show',KB002+':'+f)),includedInG3:false,executed:false}))});
for(const f of evidence){const b=read(f.path);assert.equal(hash(b),f.sha256);put(DEST,f.path,b);}
const extraPaths=[...sourceRoots,...[...new Set(extra.map(f=>f.path))]];
const attrAdd='\n# KB-GOV-012: preserve attributed G3 candidates and exact evidence bytes.\n'+[...documents.map(d=>d.path),REG,...extra.map(f=>f.path)].map(f=>'/'+f+' -text\n').join('')+[PREV,OWN,...sourceRoots].map(f=>'/'+f+'/** -text\n').join('');
const attributes=Buffer.concat([read(OWN+'/raw/context/g2-attributes.txt'),Buffer.from(attrAdd)]);put(DEST,'.gitattributes',attributes);
const m={task:s.task,g2:s.g2,kb002:KB002,capturedAt:s.capturedAt,documents,registry,evidence,sources:sources.map(x=>({id:x.id,manifest:x.manifest,manifestSha256:x.manifestSha256,root:x.root,files:x.files.length})),attributes:{path:'.gitattributes',bytes:attributes.length,sha256:hash(attributes),append:attrAdd},explicitNewDependencyPaths:extraPaths};
json('input-manifest.json',m);
console.log(JSON.stringify({pages:documents.length,annotated:6,sopUnchanged:true,sources:sources.map(x=>({id:x.id,files:x.files.length})),evidenceFiles:evidence.length,extraFiles:extra.length,manifestSha256:hash(read(OWN+'/input-manifest.json'))},null,2));
