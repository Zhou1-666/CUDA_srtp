// Bounded one-use queue migration; original evidence and contracts stay immutable.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json'))),root=m.root;
for(const s of m.snapshots)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,s.path))).digest('hex'),s.sha256,s.path+' changed');
const source=m.snapshots[0],from=path.resolve(root,source.path),old=fs.readFileSync(path.resolve(root,source.backup),'utf8'),links=[];
const rendered=old.replace(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g,(full,wiki,label,markdown,offset)=>{
 const raw=wiki||markdown,type=wiki?'wiki':'markdown',parts=raw.split('|'),url=parts[0],at=url.indexOf('#');
 const file=at<0?url:url.slice(0,at),fragment=at<0?'':url.slice(at);
 if(!file||/^[a-z][a-z0-9+.-]*:/i.test(file)||file.startsWith('/'))return full;
 let resolved=path.resolve(path.dirname(from),file);if(!fs.existsSync(resolved)&&fs.existsSync(resolved+'.md'))resolved+='.md';
 let correction=null;
 if(file==='outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md'){
  resolved=path.resolve(root,'CUDA_coding/knowledge',file);
  correction='Original queue line 211 omitted ../; archive-only navigation repair to the verified knowledge-root file. Live historical contract remains unchanged.';
 }
 assert.ok(fs.existsSync(resolved),'missing original target '+raw);
 let relative=path.relative(out,resolved).replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
 const after=relative+fragment+(parts.length>1?'|'+parts.slice(1).join('|'):'');
 links.push({line:old.slice(0,offset).split('\n').length,type,before:raw,after,target:path.relative(root,resolved).replaceAll('\\','/'),fragment,correction});
 return wiki?'[['+after+']]':'['+label+']('+after+')';
});
const header='# task-queue（2026-09-08 KB-GOV-004 迁移前完整快照）\n\n> 历史材料，不是实时工作队列。下文的当前/下一动作、旧批准与旧命令只按记录当时解释；实时入口见 [task-queue](../../../meta/task-queue.md)。不得凭快照重复提交或更改软件任务。\n>\n> [原始字节](raw/before/task-queue.md.txt) SHA-256：'+source.sha256+'；[迁移回执](README.md)。正文未改写，仅重定位相对链接，并补全已存在 Markdown 文件的扩展名。原第211行 TASK-002B 链接缺少 ../，本快照导航已指向核实存在的知识库文件；原文与 live 合同保留，详见 [映射](local/link-relocations.json)。\n\n## 原文全文\n\n';
fs.writeFileSync(path.join(out,'task-queue.snapshot.md'),header+rendered);
fs.writeFileSync(path.join(out,'local/link-relocations.json'),JSON.stringify(links,null,2)+'\n');
const delimiter='## 既有任务（保留原编号与关闭证据）',at=old.indexOf(delimiter);assert.ok(at>0);
const top=fs.readFileSync(path.join(out,'local/new-top.md.txt'),'utf8');
fs.writeFileSync(from,top+old.slice(at));
const rules=path.join(root,'CUDA_coding/knowledge/meta/README.md'),text=fs.readFileSync(rules,'utf8');
const previous='queue/blocker 的历史堆叠尚未迁移，继续按各自有效声明读取，后续单独整理。';assert.ok(text.includes(previous));
fs.writeFileSync(rules,text.replace(previous,'queue 顶部已在 [KB-GOV-004](../outputs/validation/KB-GOV-004-20260908-task-queue-current/README.md) 收敛为一份有效摘要，任务表与历史合同保留；blocker 的历史堆叠后续单独整理。'));
fs.writeFileSync(path.join(out,'local/migration-summary.json'),JSON.stringify({oldBytes:Buffer.byteLength(old),newBytes:fs.statSync(from).size,oldTopBytes:Buffer.byteLength(old.slice(0,at)),newTopBytes:Buffer.byteLength(top),oldTopLines:old.slice(0,at).split('\n').length-1,newTopLines:top.split('\n').length-1,links:links.length,softwareRows:old.split(/\r?\n/).filter(l=>l.startsWith('| TASK-')).length},null,2)+'\n');
console.log(fs.readFileSync(path.join(out,'local/migration-summary.json'),'utf8'));
