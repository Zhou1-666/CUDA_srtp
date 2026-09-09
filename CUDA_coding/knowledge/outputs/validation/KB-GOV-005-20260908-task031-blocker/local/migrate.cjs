// One-use, bounded document migration from the recorded recovery point.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json'))),root=m.root;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const s of m.snapshots)assert.equal(hash(fs.readFileSync(path.join(root,s.path))),s.sha256,s.path+' changed');
const source=m.snapshots[0],from=path.resolve(root,source.path),old=fs.readFileSync(path.resolve(root,source.backup),'utf8');
const section=old.slice(m.section.start,m.section.end);assert.equal(hash(Buffer.from(section)),m.section.sha256);
const links=[];
const rendered=section.replace(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g,(full,wiki,label,markdown,offset)=>{
 const raw=wiki||markdown,parts=raw.split('|'),url=parts[0],at=url.indexOf('#');
 const file=at<0?url:url.slice(0,at),fragment=at<0?'':url.slice(at);
 if(!file||/^[a-z][a-z0-9+.-]*:/i.test(file)||file.startsWith('/'))return full;
 let resolved=path.resolve(path.dirname(from),file);if(!fs.existsSync(resolved)&&fs.existsSync(resolved+'.md'))resolved+='.md';
 assert.ok(fs.existsSync(resolved),'missing original target '+raw);
 let relative=path.relative(out,resolved).replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
 const after=relative+fragment+(parts.length>1?'|'+parts.slice(1).join('|'):'');
 links.push({line:m.section.startLine+section.slice(0,offset).split('\n').length-1,type:wiki?'wiki':'markdown',before:raw,after,target:path.relative(root,resolved).replaceAll('\\','/'),fragment});
 return wiki?'[['+after+']]':'['+label+']('+after+')';
});
const header='# TASK-031 blocker（2026-09-08 KB-GOV-005 迁移前完整条目）\n\n> 历史材料，不是活动任务指令。下文的当前/下一动作、旧批准与命令只按记录当时解释；活动缺口见 [task-blocker-register](../../../meta/task-blocker-register.md)，排程见 [task-queue](../../../meta/task-queue.md)。不得凭快照重复提交或更改任务。\n>\n> 原第203–392行，共190行/116462字节，SHA-256：'+m.section.sha256+'。[完整文件原始字节](raw/before/task-blocker-register.md.txt)与[回执](README.md)保留；正文仅重定位相对链接，详见[映射](local/link-relocations.json)。\n\n## 原文全文\n\n';
const active=fs.readFileSync(path.join(out,'local/new-active.md.txt'),'utf8');assert.ok(active.startsWith(section.split('\n')[0]+'\n'));
const rules=path.join(root,m.snapshots[2].path),ruleText=fs.readFileSync(rules,'utf8'),previous='blocker 的历史堆叠后续单独整理。';assert.ok(ruleText.includes(previous));
fs.writeFileSync(path.join(out,'task031-blocker.snapshot.md'),header+rendered);
fs.writeFileSync(path.join(out,'local/link-relocations.json'),JSON.stringify(links,null,2)+'\n');
fs.writeFileSync(from,old.slice(0,m.section.start)+active+old.slice(m.section.end));
fs.writeFileSync(rules,ruleText.replace(previous,'blocker 的 TASK-031 条目已在 [KB-GOV-005](../outputs/validation/KB-GOV-005-20260908-task031-blocker/README.md) 归并为活动缺口与历史快照，其他任务条目保留。'));
const summary={oldBlockerBytes:Buffer.byteLength(old),newBlockerBytes:fs.statSync(from).size,oldSectionBytes:Buffer.byteLength(section),newSectionBytes:Buffer.byteLength(active),oldSectionLines:section.split('\n').length-1,newSectionLines:active.split('\n').length-1,relocations:links.length};
fs.writeFileSync(path.join(out,'local/migration-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
