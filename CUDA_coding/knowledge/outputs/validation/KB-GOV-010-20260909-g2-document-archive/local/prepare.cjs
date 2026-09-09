'use strict';
// One-time candidate preparation; not a long-term verification command.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const out=path.resolve(__dirname,'..'),root=path.resolve(out,'../../../../..'),own=path.relative(root,out).replaceAll('\\','/');
const state=JSON.parse(fs.readFileSync(out+'/raw/input-state-v2.json')),wt=path.resolve(state.worktree);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(root,state.root);assert.equal(wt,path.join(root,'.worktrees/kb-gov-010-g2-document-archive'));
function git(args){const r=spawnSync('git',args,{cwd:wt,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.stderr);return r.stdout;}
assert.equal(git(['rev-parse','HEAD']).trim(),state.g1);assert.equal(git(['branch','--show-current']).trim(),state.branch);
assert.equal(git(['diff','--cached','--name-only']),'','nothing staged before preparation');
assert.equal(git(['ls-files','--others','--exclude-standard']),'','no unknown untracked files');
// The first refusal copied seven static documents before detecting parallel meta changes.
for(const file of git(['diff','--name-only','-z']).split('\0').filter(Boolean)){
  const d=state.documents.find(d=>d.path===file);assert.ok(d&&d.group!=='C-rolling-meta','unexpected partial change: '+file);
  assert.equal(hash(fs.readFileSync(path.join(wt,file))),d.sha256,'partial static snapshot changed');
}
// Check all inputs before further writes; the saved snapshots remain immutable.
for(const d of state.documents)assert.equal(hash(fs.readFileSync(path.join(root,d.path))),d.sha256,'main input changed: '+d.path);
for(const f of state.evidence)assert.equal(hash(fs.readFileSync(path.join(root,f.path))),f.sha256,f.path);
function write(rel,bytes){
  const dst=path.resolve(wt,rel);assert.ok(dst.startsWith(wt+path.sep)&&!rel.split('/').includes('..')&&!rel.startsWith('.git/'));
  fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,bytes);
}
const oldLink='](outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md)';
const newLink='](../outputs/reviews/TASK-002B-20260820-private-scope-and-citations.md)';
const documents=[];
for(const d of state.documents){
  const original=fs.readFileSync(path.join(root,d.snapshot));assert.equal(hash(original),d.sha256);assert.equal(hash(fs.readFileSync(path.join(root,d.path))),d.sha256,'main input changed: '+d.path);
  let bytes=original;
  if(d.id==='09'){const text=original.toString('utf8');assert.equal(text.split(oldLink).length,2,'one documented queue link');bytes=Buffer.from(text.replace(oldLink,newLink));}
  write(d.path,bytes);documents.push({...d,sourceSha256:d.sha256,sha256:hash(bytes),bytes:bytes.length});
}
for(const f of state.evidence){const bytes=fs.readFileSync(path.join(root,f.path));assert.equal(hash(bytes),f.sha256,f.path);write(f.path,bytes);}
const roots=[...state.evidenceRoots,own],attrs=Buffer.concat([Buffer.from(git(['show',state.g1+':.gitattributes'])),Buffer.from('\n# KB-GOV-010: preserve selected G2 documents and evidence bytes.\n'+documents.map(d=>'/'+d.path+' -text\n').join('')+roots.map(d=>'/'+d+'/** -text\n').join(''))]);
write('.gitattributes',attrs);
const manifest={task:'KB-GOV-010',g1:state.g1,documents,evidenceRoots:state.evidenceRoots,evidence:state.evidence,attributes:{path:'.gitattributes',bytes:attrs.length,sha256:hash(attrs)},correction:{path:documents.find(d=>d.id==='09').path,oldLink,newLink,scope:'candidate only; original captured bytes retained'}};
fs.writeFileSync(out+'/input-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const r=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--',path.join(root,documents.find(d=>d.id==='09').snapshot),path.join(wt,manifest.correction.path)],{encoding:'utf8'});assert.equal(r.status,1);fs.writeFileSync(out+'/local/queue-link-fix.patch',r.stdout);
console.log(JSON.stringify({documents:documents.length,evidenceFiles:state.evidence.length,worktree:wt,corrections:1},null,2));
