'use strict';
// One-time main governance handoff, not an archive replay command.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const OUT=path.resolve(__dirname,'..'),ROOT=path.resolve(OUT,'../../../../..'),s=JSON.parse(fs.readFileSync(OUT+'/raw/start-state.json')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(!fs.existsSync(OUT+'/local/main-closeout.json'),'main closeout already exists');
const link='../outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/README.md',next='../outputs/validation/KB-GOV-012-20260909-g3-candidate-archive/next-task.md';
const row='| KB-GOV-012 | done | [G3归档回执]('+link+')：七页继承draft中六页最小注释、SOP原字节，候选registry新增SRC-032/033；86份配套证据及本回执分组提交到codex/kb-gov-012-g3-candidate-archive。逐blob/固定提交/独立clone、8项测试及011固定复验通过；完整知识lint保留24项集合外错误/2条旧警告。主树七页/registry/源码未覆盖，未合并/推送或改架构 |';
const nextRow='| KB-GOV-013 | ready | [主树治理集成审定]('+next+')，仅登记未执行：对照G1/G2/G3固定归档和当时主树，审定允许集成路径、滚动meta差异、来源地图及集合外依赖；保留科研候选与软件状态，不合并/推送、覆盖、清理或改架构。依赖008/010/012；责任方Codex；推荐gpt-6-astra / XHigh；用户选择后执行 |';
const snapshot='### KB-GOV-012 — done（G3候选与版本归档已解除快照）\n\n- 关闭/核对日期：2026-09-09；类别：documentation/versioning；责任方：Codex；关闭类型：正常限定文档归档；依据：用户明确选择012及011合同。\n- 原缺口：七页继承draft缺限定候选、真实profile/派生来源登记与独立可复验版本。\n- 关闭证据：[G3回执]('+link+')；文档17b373e、证据f57dccb、首个完整归档49126ad；六页注释可逆、一页SOP原字节、两条新来源/26原件及011完整51文件与9份依赖均逐blob核验。固定提交、独立clone、8项测试与011固定入口通过。\n- 边界：完整知识lint保留24项集合外错误/2条旧警告，非完整知识或科研发行；旧来源登记与研究正文归属保留，不升verified。主树仅本治理交接，七页/registry/源码及软件正文不覆盖，未合并/推送/清理或运行远端。\n\n';
const pending='### KB-GOV-013 — ready（仅登记，尚未领取）\n\n- 核对日期：2026-09-09；类别：documentation/integration-review；责任方：Codex；依赖：008/G1、010/G2、012/G3与领取时主树。\n- 待完成内容：按[最小合同]('+next+')只读审定治理主树集成范围、快照/滚动meta差异、source-map及集合外依赖，形成可审查路径与操作方案。\n- 解除证据：固定版本对照、每路径归属/指纹、软件状态保护与最小集成验收方案；不得把整树合并等同于源码采用。\n- 最小动作：用户选择后捕获主树与固定归档差异；本轮未开始。不合并/推送、覆盖主树、清理或修改架构。推荐gpt-6-astra / XHigh。\n';
const changes=[];
for(const d of s.context.slice(1,4)){
  const before=fs.readFileSync(path.join(ROOT,d.path));assert.equal(hash(before),d.sha256,'concurrent main context needs review: '+d.path);let text=before.toString(),edits=[];const nl=text.match(/\r?\n/)[0],eol=t=>t.replaceAll('\n',nl);
  if(d.path.endsWith('/task-queue.md')){const old=text.match(/^\| KB-GOV-012 \| ready \|.*$/m)[0].replace(/\r$/,'');edits.push({before:old,after:row+nl+nextRow});}
  else if(d.path.endsWith('/task-blocker-register.md')){const marker='## 知识维护待办（不参与软件排程）';edits.push({before:marker,after:eol(snapshot)+marker});const old=text.slice(text.indexOf('### KB-GOV-012 — ready'));assert.ok(old.startsWith('### KB-GOV-012 — ready'));edits.push({before:old,after:eol(pending)});}
  else{const marker='# 编译日志'+nl+nl;const milestone='2026-09-09 KB-GOV-012 G3候选与版本归档完成：[回执]('+link+')。七页draft保留继承归属，六页注释/一页SOP原字节；新增两条真实来源，86份配套证据分组归档。逐blob、固定提交/独立clone、8项测试及011固定复验通过；完整知识lint的24项集合外错误/2条旧警告保留。主树仅治理交接，七页/registry/源码不覆盖，未合并/推送或改架构。';edits.push({before:marker,after:marker+milestone+nl+nl});}
  for(const e of edits){assert.equal(text.split(e.before).length,2,'unique closeout edit');text=text.replace(e.before,e.after);}const after=Buffer.from(text);let inverse=text;for(const e of [...edits].reverse()){assert.equal(inverse.split(e.after).length,2);inverse=inverse.replace(e.after,e.before);}assert.deepEqual(Buffer.from(inverse),before,'software/other record preservation');
  const id=String(changes.length+1);fs.mkdirSync(OUT+'/local/main-closeout',{recursive:true});fs.writeFileSync(OUT+'/local/main-closeout/'+id+'-after.txt',after);const diff=spawnSync('git',['diff','--no-index','--no-color','--',path.join(ROOT,d.snapshot),OUT+'/local/main-closeout/'+id+'-after.txt']);assert.ok([0,1].includes(diff.status));fs.writeFileSync(OUT+'/local/main-closeout/'+id+'.patch',diff.stdout);changes.push({path:d.path,beforeSnapshot:d.snapshot,beforeSha256:hash(before),afterSnapshot:'local/main-closeout/'+id+'-after.txt',afterSha256:hash(after),edits,inverseMatchesOriginal:true});
}
// Check every before-image again before the three authorized writes.
for(const c of changes)assert.equal(hash(fs.readFileSync(path.join(ROOT,c.path))),c.beforeSha256);
for(const c of changes)fs.writeFileSync(path.join(ROOT,c.path),fs.readFileSync(path.join(OUT,c.afterSnapshot)));
fs.writeFileSync(OUT+'/local/main-closeout.json',JSON.stringify({task:'KB-GOV-012',date:'2026-09-09',changes,nextTask:'KB-GOV-013',nextTaskExecuted:false},null,2)+'\n');console.log('Main governance closeout: three exact reversible record edits');
