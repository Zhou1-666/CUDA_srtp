// One-use archive rendering from the immutable migration backups.
const fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(out,'raw/before-manifest.json')));
const links=[];
for(const [i,name] of ['penta-active-context.snapshot.md','wiki-00-index.snapshot.md'].entries()){
 const source=m.snapshots[i],from=path.resolve(m.root,source.path),text=fs.readFileSync(path.resolve(m.root,source.backup),'utf8');
 const rendered=text.replace(/\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\n]+)\)/g,(full,wiki,label,markdown,offset)=>{
  const raw=wiki||markdown,type=wiki?'wiki':'markdown',parts=raw.split('|'),url=parts[0],at=url.indexOf('#');
  const file=at<0?url:url.slice(0,at),fragment=at<0?'':url.slice(at);
  if(!file||/^[a-z][a-z0-9+.-]*:/i.test(file)||file.startsWith('/'))return full;
  let resolved=path.resolve(path.dirname(from),file);
  if(!fs.existsSync(resolved)&&fs.existsSync(resolved+'.md'))resolved+='.md';
  if(!fs.existsSync(resolved))throw Error('Missing source link '+raw);
  let relative=path.relative(out,resolved).replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
  const after=relative+fragment+(parts.length>1?'|'+parts.slice(1).join('|'):'');
  links.push({source:source.path,line:text.slice(0,offset).split('\n').length,type,before:raw,after,resolvesTo:path.relative(m.root,resolved).replaceAll('\\','/'),fragment});
  return wiki?'[['+after+']]':'['+label+']('+after+')';
 });
 const front=rendered.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);if(!front)throw Error('Missing frontmatter');
 const title=i===0?'五对角活动上下文':'Wiki 首页';
 const prefix='# '+title+'（2026-09-08 迁移前快照）\n\n> 历史快照，不是活动入口。原文中的当前/下一任务及授权仅属于原记录；实时状态见 [task-queue](../../../meta/task-queue.md)，具体缺口见 [blocker](../../../meta/task-blocker-register.md)。\n>\n> 活动页：[原路径](../../../'+(i===0?'wiki/briefs/penta-active-context.md':'wiki/00-index.md')+')；[原始字节](raw/before/'+path.basename(source.backup)+')；[迁移回执](README.md)。原文正文不改写，仅重定位相对链接并补全已有 Markdown 文件的扩展名。原文件 SHA-256：'+source.sha256+'。\n\n## 原始元数据（历史）\n\n~~~yaml\n'+front[0].trimEnd()+'\n~~~\n\n## 原文正文\n\n';
 fs.writeFileSync(path.join(out,name),prefix+rendered.slice(front[0].length));
}
fs.writeFileSync(path.join(out,'local/link-relocations.json'),JSON.stringify(links,null,2)+'\n');
console.log('Rebased '+links.length+' source links; all original targets resolved (Markdown extension completed where omitted).');
