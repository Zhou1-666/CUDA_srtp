const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json'))),root=m.root;
const link='[KB-GOV-003 回执](../outputs/validation/KB-GOV-003-20260908-active-context-navigation/README.md)';
const queue='| KB-GOV-003 | done | '+link+'：brief/index 收敛为约束与导航，旧文完整快照、241 链接重定位通过；仅治理文档，软件状态/顺序不变 |\n| KB-GOV-004 | ready | 治理后续，仅登记未领取：收敛 task-queue 顶部状态堆叠，原文归档并保留任务合同/授权/执行顺序；依赖 KB-GOV-003 完成。责任方 Codex；推荐 gpt-6-astra / XHigh；不参与软件排程，不执行 TASK-031 |\n';
const blocker='\n### KB-GOV-003 — done（活动入口治理已解除快照）\n\n- 关闭/核对日期：2026-09-08；类别：documentation/governance；责任方：Codex；依据：用户批准第三批并要求与软件任务区分。\n- 原缺口：活动 brief 和 Wiki index 重复动态状态与旧排程，默认上下文被历史记录占据。\n- 关闭证据：'+link+'；六份原文副本、两份可读快照、241 个链接重定位；正文可还原、链接有效、知识 lint 0 Warnings/0 Errors、Git 与 366 个保护对象保持。\n- 边界：只关闭文档治理；TASK-031 状态、授权与软件顺序未改，未做源码/GPU/Git 操作。\n\n## 知识维护待办（不参与软件排程）\n\n### KB-GOV-004 — ready（仅登记，尚未领取）\n\n- 核对日期：2026-09-08；类别：documentation/governance；责任方：Codex；依赖：KB-GOV-003 已完成。\n- 待完成内容：task-queue 顶部仍保留多层旧状态，后续只收敛其当前入口并完整归档历史；任务合同、批准依据、执行顺序和软件状态须逐项保持。\n- 解除证据：原文可还原、有效摘要与原有效声明一致、任务表及授权不变、链接和知识 lint 通过；只完成治理时关闭本项，不等于 TASK-031 验收。\n- 最小动作：用户继续此治理项时，先核 queue/对应 blocker 的有效声明和恢复点；遇到状态含义不明先列双方证据，不推断新的软件排程。推荐 gpt-6-astra / XHigh，本批未执行。\n';
const milestone='2026-09-08 KB-GOV-003 活动入口治理完成：'+link+'。brief 83.4→4.7 KB、index 36.1→6.7 KB，旧文完整快照与241链接重定位通过；只整理导航，软件任务与Git状态不变。';
for(const [name,add]of [['task-queue',queue],['task-blocker-register',blocker],['compile-log',milestone]]){
 const p=path.join(root,'CUDA_coding/knowledge/meta/'+name+'.md'),text=fs.readFileSync(p,'utf8');
 assert.ok(!text.includes('KB-GOV-003'),'do not rerun '+name);
 const before=m.snapshots.find(s=>s.path.endsWith('/'+name+'.md'));assert.ok(fs.readFileSync(p).equals(fs.readFileSync(path.resolve(root,before.backup))),'concurrent edit '+name);
 const nl=text.includes('\r\n')?'\r\n':'\n';let next;
 if(name==='compile-log'){const at=text.indexOf(nl)+nl.length;next=text.slice(0,at)+nl+add+nl+text.slice(at);}
 else next=text+add.replace(/\n/g,nl);
 fs.writeFileSync(p,next);
}
console.log('KB-GOV-003 closure and KB-GOV-004 governance-only follow-up registered; original software records retained.');
