'use strict';
// Only the three authorized governance handoff entries; no document integration.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const d='CUDA_coding/knowledge/outputs/validation/KB-GOV-009-20260909-g2-ownership-review',m=JSON.parse(fs.readFileSync(d+'/raw/input-state.json')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(!fs.existsSync(d+'/local/closeout.json'),'already closed');
for(const p of m.protected)assert.equal(hash(fs.readFileSync(p.path)),p.sha256,p.path);
const link='../outputs/validation/KB-GOV-009-20260909-g2-ownership-review/README.md',plan='../outputs/validation/KB-GOV-009-20260909-g2-ownership-review/integration-plan.md',updates=[];
for(const p of m.mutable){const row=m.rows.find(r=>r.path===p),b=fs.readFileSync(p);assert.equal(hash(b),row.currentSha256,'concurrent change: '+p);const old=b.toString();let next;
  if(p.endsWith('task-queue.md')){const match=old.match(/^\| KB-GOV-009 \| ready \|[^\r\n]+/m);assert.ok(match&&!old.includes('| KB-GOV-010 |'));next=old.replace(match[0],'| KB-GOV-009 | done | [KB-GOV-009回执]('+link+')：17路径归属审定为4份无旧实质改动/10份继承静态页/3份滚动meta；51次补丁回放通过，425引用/220目标及1条旧断链明确登记。形成带归属说明的快照入库方案，未提交/合并活文档或执行G3/源码任务 |\n| KB-GOV-010 | ready | G2文档版本归档，仅登记未领取：按[009方案]('+plan+')从固定G1新建隔离分支，归档17份带归属说明的文档、009审查依据及本次验收；重取三份meta，保留并发软件内容，只修已核定TASK-002B相对链接。依赖 KB-GOV-009/008；责任方Codex；推荐gpt-6-astra / XHigh；不合并主树、纳入G3/源码或改架构 |');
  }else if(p.endsWith('task-blocker-register.md')){const marker='## 知识维护待办（不参与软件排程）',i=old.indexOf(marker);assert.ok(i>=0&&old.slice(i).includes('### KB-GOV-009 — ready'));next=old.slice(0,i)+
    '### KB-GOV-009 — done（G2归属与依赖审定已解除快照）\n\n'+
    '- 关闭/核对日期：2026-09-09；类别：documentation/integration-review；责任方：Codex；关闭类型：正常交付；依据：用户明确选择KB-GOV-009。\n'+
    '- 原缺口：17份G2活文档的既有内容、治理增量、补丁适用条件与包外依赖尚未逐文件审定。\n'+
    '- 关闭证据：[KB-GOV-009回执]('+link+')；17份三版本快照、两层原字节差分及LF审阅补丁，51次回放通过；分为4/10/3，425引用与220目标登记，9个命令入口仅核指纹。完整方案采用带归属说明的快照，不把13份继承内容算为纯治理。\n'+
    '- 边界：仅关闭审定，G2尚未入库/合并；1条既存相对链接、七页G3、其他研究与外部证据仍按方案处理。保留软件状态/授权，588保护对象及Git未改，未运行GPU/远端或新增架构。\n\n'+marker+'\n\n### KB-GOV-010 — ready（仅登记，尚未领取）\n\n'+
    '- 核对日期：2026-09-09；类别：documentation/versioning；责任方：Codex；依赖：KB-GOV-009审定和KB-GOV-008的ee6fbf8归档。\n'+
    '- 待完成内容：严格按[009集成方案]('+plan+')，只在新codex/隔离分支保存17页带归属说明的原字节文档快照、009审查依据和本次验收；14页静态输入核SHA，三份meta重新捕获并审查后续治理/软件增量，禁止旧快照覆盖实时排程。\n'+
    '- 解除证据：显式路径/来源/依赖、原件与暂存blob SHA、已核定TASK-002B相对链接修复、分组提交和独立clone归档复验；完整知识lint的外部依赖缺口逐项登记，不降低门禁或宣称全库交付。\n'+
    '- 最小动作：用户选择后复核版本及009关闭SHA，形成精确候选；不顺带纳入15份其他tracked增量、7页G3或源码候选，不合并/推送主树、不清理、不执行远端或改架构。并发变化/哈希失配先审查相关组。推荐gpt-6-astra / XHigh，本批未执行。\n';
  }else{assert.ok(!old.includes('2026-09-09 KB-GOV-009 '));next=old.replace(/^(# 编译日志\r?\n\r?\n)/,h=>h+'2026-09-09 KB-GOV-009 G2归属与依赖审定完成：[KB-GOV-009回执]('+link+')。17文件分为4/10/3，三版本与51次补丁回放通过；425引用/220目标含1条旧断链，形成带归属说明的最小快照方案。未提交/合并活文档，不改软件排程、源码或架构。\n\n');}
  assert.notEqual(old,next);updates.push({path:p,old,next});
}
fs.mkdirSync(d+'/raw/pre-closeout',{recursive:true});const files=updates.map(u=>{const before='raw/pre-closeout/'+path.basename(u.path)+'.txt';fs.writeFileSync(d+'/'+before,u.old);return {path:u.path,before,beforeSha256:hash(Buffer.from(u.old)),afterSha256:hash(Buffer.from(u.next))};});
for(const u of updates)assert.equal(fs.readFileSync(u.path,'utf8'),u.old,u.path);for(const u of updates)fs.writeFileSync(u.path,u.next);
fs.writeFileSync(d+'/local/closeout.json',JSON.stringify({date:'2026-09-09',type:'normal-audit-delivery',files,softwareChange:'none',gitMutation:'none'},null,2)+'\n');
let t=fs.readFileSync(d+'/README.md','utf8').replace('状态：in-progress；','状态：done（正常交付）；');t+='\n关闭交接只更新queue/blocker的009关闭快照、010待办登记及一条compile-log里程碑；其余14份审查文档未改。17份输入快照保持领取时字节，三个meta的关闭后SHA另见[关闭记录](local/closeout.json)，不静默覆盖归属账本。原字节/LF回放、依赖及保护核对见[最终复验](local/review-final.log)，文档检查见[知识lint](local/knowledge-final.log)。无新研究来源、主张或问题，index/map/brief/claim matrix无需同步。\n';fs.writeFileSync(d+'/README.md',t);
for(const p of ['review-final.log','knowledge-final.log'])fs.writeFileSync(d+'/local/'+p,'');
console.log('Closed only KB-GOV-009 governance entries; KB-GOV-010 registered, not started.');
