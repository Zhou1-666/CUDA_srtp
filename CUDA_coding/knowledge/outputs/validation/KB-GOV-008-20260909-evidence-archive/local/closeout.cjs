'use strict';
// One-time authorized governance closeout in the original workspace only.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const d='CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive',m=JSON.parse(fs.readFileSync(d+'/raw/before-manifest.json'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const p of [...m.protected,...m.snapshots])assert.equal(hash(fs.readFileSync(p.path)),p.sha256,p.path);
const link='../outputs/validation/KB-GOV-008-20260909-evidence-archive/README.md',updates=[];
for(const s of m.snapshots){const old=fs.readFileSync(s.path,'utf8');let next;
  if(s.path.endsWith('task-queue.md')){
    assert.ok(!old.includes('| KB-GOV-009 |'));
    const row=old.match(/^\| KB-GOV-008 \| ready \|[^\r\n]+/m);assert.ok(row);
    next=old.replace(row[0],'| KB-GOV-008 | done | [KB-GOV-008 回执]('+link+')：G1 的179份治理证据逐字节归档到 codex/kb-gov-008-evidence-archive，便携检查器/暂存blob/独立clone通过；25处包外知识链接明确登记，非完整知识库交付。KB-GOV-002谱系、主树源码和软件排程保持，未合并主树 |\n| KB-GOV-009 | ready | 治理活文档G2归属与依赖审定，仅登记未领取：以007的17路径清单、首批前恢复点及008归档为输入，区分既有内容与治理增量，形成显式补丁/包外依赖处置方案；先审查，不默认提交整文件、纳入G3或合并主树。依赖 KB-GOV-008；责任方 Codex；推荐 gpt-6-astra / XHigh |');
  }else if(s.path.endsWith('task-blocker-register.md')){
    const marker='## 知识维护待办（不参与软件排程）',start=old.indexOf(marker);assert.ok(start>=0&&old.slice(start).includes('### KB-GOV-008 — ready'));
    next=old.slice(0,start)+'### KB-GOV-008 — done（G1治理证据版本归档已解除快照）\n\n'+
      '- 关闭/核对日期：2026-09-09；类别：documentation/versioning；责任方：Codex；关闭类型：正常交付；依据：用户明确选择KB-GOV-008及007的G1合同。\n'+
      '- 原缺口：KB-GOV-001/003–007回执、恢复点、映射未有隔离的版本快照和便携归档复验。\n'+
      '- 关闭证据：[KB-GOV-008回执]('+link+')；179文件/10,711,774字节保持，原件组525bd08、检查器组8643530，独立clone的归档检查和6项反例测试通过，暂存blob SHA匹配；关闭证据后续保存在同一归档分支。\n'+
      '- 边界：完整知识库lint的25处包外引用缺失原样登记，旧基线4警告保留；不代表全库/G2/G3闭环或源码验收。637保护对象、主树HEAD/索引、既有分支与KB-GOV-002工作树/clone保持；TASK-031并行更新已审查保留，不改软件排程，不合并/推送/清理或运行远端。\n\n'+
      marker+'\n\n### KB-GOV-009 — ready（仅登记，尚未领取）\n\n'+
      '- 核对日期：2026-09-09；类别：documentation/integration-review；责任方：Codex；依赖：KB-GOV-008归档完成。\n'+
      '- 待完成内容：以KB-GOV-007的17路径清单、首批前恢复点、KB-GOV-008归档及领取时最新SHA为输入，逐文件分离既有改动和治理增量，并审定G2引用依赖。TASK-031并行状态不得用旧快照覆盖。\n'+
      '- 解除证据：路径/版本/来源/依赖清单、具体可审核补丁或带归属说明的快照方案；包外和缺失材料明确列出，不把13个首批前已有改动文件整体记为治理成果。\n'+
      '- 最小动作：用户选择后先复核最新输入并做只读归属与依赖审查；不默认提交整文件、实施G3、修改源码、合并主树或新增架构。出现并发变化先审查相关差异。推荐gpt-6-astra / XHigh，本批未执行。\n';
  }else{
    assert.ok(!old.includes('2026-09-09 KB-GOV-008 '));
    next=old.replace(/^(# 编译日志\r?\n\r?\n)/,head=>head+'2026-09-09 KB-GOV-008 G1治理证据版本归档完成：[KB-GOV-008回执]('+link+')。179文件保留原字节，分组提交到独立治理分支，暂存blob及独立clone归档检查通过；25处包外链接明确登记，不等于完整知识库交付。主树源码/软件排程、既有分支保持，未合并、推送或执行G2/G3。\n\n');
  }
  assert.notEqual(next,old,s.path);updates.push({path:s.path,old,next});
}
// Check again immediately before writing; never overwrite a concurrent update.
for(const u of updates)assert.equal(fs.readFileSync(u.path,'utf8'),u.old,u.path);
for(const u of updates)fs.writeFileSync(u.path,u.next);
const p=d+'/README.md';let t=fs.readFileSync(p,'utf8');t=t.replace('状态：in-progress；','状态：done（正常交付）；');
t=t.replace('- 第二组保存本次范围、依赖和便携复验入口；验收后另记关闭证据。','- 第二组 `8643530165ba6becf2198e756bc1f512cb39bcf2` 保存范围、依赖和便携入口；后续关闭提交保存本次验收、主树治理交接的差分与保护检查。');
t+='\n## 关闭验收\n\n独立 clone `.worktrees/kb-gov-008-clean-clone` 在检查器提交8643530通过：179原件、207个Git blob、6项行为测试；对象目录52个文件的硬链接数均为1，无alternates/符号链接，[对象独立性](local/clone-independence.json)、[clone输出](local/clone-verification.log)、[测试输出](local/clone-tests.log)。最终关闭提交仅增加本次证据及回执，最终HEAD以该分支Git记录为准，可用上述命令重新验证。\n\n主树仅更新本任务的queue/blocker关闭记录、下一治理任务009登记和一条compile-log里程碑；这些活文档只作为差分/恢复点保存在008回执，不进入归档分支的活文档路径。现有源码、G1原件、KB-GOV-002谱系和软件排程保持；没有新增研究来源、主张或问题。G2/G3、主树集成、全库链接闭合、根目录清理及任何GPU/远端验证均未执行。\n';
fs.writeFileSync(p,t);
fs.writeFileSync(d+'/local/closeout-live-sha.json',JSON.stringify(updates.map(u=>({path:u.path,sha256:hash(Buffer.from(u.next))})),null,2)+'\n');
console.log('KB-GOV-008: wrote only three governance closeout entries and own receipt.');
