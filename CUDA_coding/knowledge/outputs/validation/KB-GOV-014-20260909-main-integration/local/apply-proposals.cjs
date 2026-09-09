'use strict';
// One-time mutation of the nine reviewed paths and the 014 governance records.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../../../../../..'),OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-014-20260909-main-integration',AUDIT='CUDA_coding/knowledge/outputs/validation/KB-GOV-013-20260909-main-integration-review';
const abs=p=>path.join(ROOT,p),read=p=>fs.readFileSync(abs(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(read(p));
const save=(p,j)=>fs.writeFileSync(abs(OWN+'/'+p),JSON.stringify(j,null,2)+'\n');
assert.ok(!fs.existsSync(abs(OWN+'/meta-edits.json')),'already applied');
const intake=json(OWN+'/intake.json'),proposals=json(AUDIT+'/proposals.json');
const suffix='\n# KB-GOV-014: preserve this inherited attribute file as exact bytes.\n/.gitattributes -text\n';
const prepared=proposals.edits.map(e=>{assert.equal(hash(read(e.path)),e.before,'input changed: '+e.path);const original=read(AUDIT+'/'+e.snapshot);assert.equal(hash(original),e.after);const bytes=e.path==='.gitattributes'?Buffer.concat([original,Buffer.from(suffix)]):original;return {path:e.path,before:e.before,originalProposalSha256:e.after,after:hash(bytes),bytes:bytes.length,payload:bytes};});
const meta=intake.recovery.filter(x=>x.path.startsWith('CUDA_coding/knowledge/meta/'));
for(const x of meta)assert.equal(hash(read(x.path)),x.sha256,'rolling record changed before intake claim');
const qpath='CUDA_coding/knowledge/meta/task-queue.md',bpath='CUDA_coding/knowledge/meta/task-blocker-register.md';
const queue=read(qpath).toString(),oldRow=queue.split(/\r?\n/).find(l=>l.startsWith('| KB-GOV-014 |'));
assert.ok(oldRow&&oldRow.includes('| ready |'));
const newRow='| KB-GOV-014 | in-progress | [014受控集成回执](../outputs/validation/KB-GOV-014-20260909-main-integration/README.md)：已冻结717路径、187份013回执及恢复点；按审定候选和精确白名单执行A/B本地归档，保留软件dirty与当前状态。独立clone、真正知识lint、固定归档及保护检查完成前不关闭；不推送、清理、运行远端或采用源码候选 |';
const blocker=read(bpath).toString(),start=blocker.indexOf('### KB-GOV-014 — ready');assert.ok(start>=0);
const following=blocker.slice(start+1).search(/\n## /);const end=following<0?blocker.length:start+1+following+1;const oldSection=blocker.slice(start,end);
assert.ok(!/^### (?!KB-GOV-014)/m.test(oldSection));
const nl=oldSection.includes('\r\n')?'\r\n':'\n';
const newSection=['### KB-GOV-014 — in-progress','','- 核对日期：2026-09-09；类别：documentation/integration；责任方：Codex；依据：用户明确选择014及013已审定合同。','- 已完成准备：717目标/187份013回执、12恢复副本及范围外文件指纹已冻结；九项候选按原归属应用，属性自身转换风险采用精确末尾覆盖处理。','- 当前缺口：A/B两组提交、固定版本验证、独立clone真正知识lint及软件工作区保护尚未全部验收。','- 解除证据：[014回执](../outputs/validation/KB-GOV-014-20260909-main-integration/README.md)中的逐blob、独立检出、固定回放、完整日志和可逆关闭记录。','- 最小动作：继续本任务分组归档和独立clone验收；不推送、清理、运行远端、改源码或架构。',''].join(nl)+nl;
const metaEdits={task:'KB-GOV-014',files:meta.map(x=>({path:x.path,beforeSnapshot:x.snapshot,edits:x.path===qpath?[{kind:'replace',before:oldRow,after:newRow}]:x.path===bpath?[{kind:'replace',before:oldSection,after:newSection}]:[]}))};
for(const x of prepared){assert.equal(hash(read(x.path)),x.before);fs.writeFileSync(abs(x.path),x.payload);}
fs.writeFileSync(abs(qpath),queue.replace(oldRow,newRow));fs.writeFileSync(abs(bpath),blocker.slice(0,start)+newSection+blocker.slice(end));
save('applied-proposals.json',{task:'KB-GOV-014',attributeSuffix:suffix,edits:prepared.map(({payload,...e})=>e)});
save('meta-edits.json',metaEdits);
fs.writeFileSync(abs(OWN+'/local/attribute-candidate.txt'),prepared.find(x=>x.path==='.gitattributes').payload);
console.log('Applied 9 bounded proposals and claimed KB-GOV-014; software records retained outside exact governance substitutions.');
