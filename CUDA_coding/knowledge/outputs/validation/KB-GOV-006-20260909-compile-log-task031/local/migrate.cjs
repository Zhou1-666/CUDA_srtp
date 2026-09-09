// One-use archive migration. The before manifest bounds every permitted edit.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),m=JSON.parse(fs.readFileSync(out+'/raw/before-manifest.json')),root=m.root;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),source=m.snapshots[0],from=path.resolve(root,source.path);
for(const s of m.snapshots)assert.equal(hash(fs.readFileSync(path.resolve(root,s.path))),s.sha256,s.path+' changed');
const old=fs.readFileSync(path.resolve(root,source.backup),'utf8'),milestones=JSON.parse(fs.readFileSync(out+'/local/milestones.json'));
const links=[],edits=[];let archive='# TASK-031 编译过程（2026-09-09 KB-GOV-006 迁移前快照）\n\n> 历史材料，不是实时任务或命令入口；旧批准、下一动作与门禁按当时记录解释。实时状态见 [queue](../../../meta/task-queue.md)，缺口见 [blocker](../../../meta/task-blocker-register.md)。142条原记录保留原顺序与原行号；正文只重定位相对链接。\n>\n> [完整原始文件](raw/before/compile-log.md.txt) SHA-256：'+source.sha256+'；[回执](README.md)；[链接映射](local/link-relocations.json)。原始回执与运行附件仍在原位置，本快照不新增验收或操作授权。\n\n';
const pattern=/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g;
for(const r of m.records){
 const original=old.slice(r.start,r.end);assert.equal(hash(Buffer.from(original)),r.sha256);
 const rendered=original.replace(pattern,(full,wiki,label,markdown,offset)=>{
  const raw=wiki||markdown,parts=raw.split('|'),url=parts[0],at=url.indexOf('#'),file=at<0?url:url.slice(0,at),fragment=at<0?'':url.slice(at);
  if(!file||/^[a-z][a-z0-9+.-]*:/i.test(file)||file.startsWith('/'))return full;
  let target=path.resolve(path.dirname(from),file);if(!fs.existsSync(target)&&fs.existsSync(target+'.md'))target+='.md';assert.ok(fs.existsSync(target),'missing target '+raw);
  let relative=path.relative(out,target).replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
  const after=relative+fragment+(parts.length>1?'|'+parts.slice(1).join('|'):'');
  links.push({line:r.line+original.slice(0,offset).split('\n').length-1,before:raw,after,target:path.relative(root,target).replaceAll('\\','/'),fragment});
  return wiki?'[['+after+']]':'['+label+']('+after+')';
 });
 archive+='## 原第'+r.line+'行\n\n'+rendered+'<!-- end-record:'+r.line+' -->\n\n';
 const milestone=milestones.find(x=>x.line===r.line);let replacement='';
 if(milestone){const first=[...original.matchAll(pattern)][0],evidence=milestone.evidence||(first&&(first[1]||first[3]));assert.ok(evidence,'no milestone evidence '+r.line);const resolved=path.resolve(path.dirname(from),evidence.split('#')[0]);assert.ok(fs.existsSync(resolved),evidence);
  replacement=original.slice(0,10)+' TASK-031 '+milestone.result+' [证据]('+evidence+')；[原记录](../outputs/validation/KB-GOV-006-20260909-compile-log-task031/task031-compile-log.snapshot.md#原第'+r.line+'行)。\n\n';}
 edits.push({line:r.line,replacement});
}
assert.equal(edits.filter(x=>x.replacement).length,milestones.length);
let live='',offset=0;for(let i=0;i<m.records.length;i++){const r=m.records[i];live+=old.slice(offset,r.start)+edits[i].replacement;offset=r.end;}live+=old.slice(offset);
// A retained final milestone needs a line terminator, not a new blank EOF line.
const finalEdit=edits.findLast(e=>e.replacement);
if(finalEdit&&live.endsWith(finalEdit.replacement)){
 const shortened=finalEdit.replacement.replace(/\n\n$/,'\n');live=live.slice(0,-finalEdit.replacement.length)+shortened;finalEdit.replacement=shortened;
}
const titleEnd=live.indexOf('\n')+1;
const navigation='\n> 本页记录里程碑；TASK-031 的142条旧过程记录见[完整快照](../outputs/validation/KB-GOV-006-20260909-compile-log-task031/task031-compile-log.snapshot.md)，以下保留关键里程碑及原记录指针。日期描述当时证据，实时状态/授权以 [queue](task-queue.md) 和 [blocker](task-blocker-register.md) 为准。逐次调试继续写对应验证回执。\n';
live=live.slice(0,titleEnd)+navigation+live.slice(titleEnd);
fs.writeFileSync(out+'/task031-compile-log.snapshot.md',archive);fs.writeFileSync(out+'/local/link-relocations.json',JSON.stringify(links,null,2)+'\n');
fs.writeFileSync(out+'/local/replacements.json',JSON.stringify({navigation,edits},null,2)+'\n');fs.writeFileSync(from,live);
const result={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(live),archivedRecords:m.records.length,oldRecordBytes:m.records.reduce((s,r)=>s+r.bytes,0),milestones:milestones.length,milestoneBytes:edits.reduce((s,e)=>s+Buffer.byteLength(e.replacement),0),relocations:links.length};
fs.writeFileSync(out+'/local/migration-summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
