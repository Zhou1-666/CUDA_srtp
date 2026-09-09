'use strict';
// One-time direct-dependency follow-up; only receipt files are written.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const O=path.resolve(__dirname,'..'),R=path.resolve(O,'../../../../..'),K='CUDA_coding/knowledge/';
const read=f=>fs.readFileSync(path.join(O,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(f,b)=>fs.writeFileSync(path.join(O,f),b),write=(f,x)=>put(f,JSON.stringify(x,null,2)+'\n');
const m=json('inputs.json'),proposals=json('proposals.json'),plan=json('integration-paths.json');assert.equal(plan.rows.length,715);
const extra=['outputs/queries/20260826-task023-gpu-nsight-clarification.md','outputs/validation/TASK-023-20260826-local-implementation/README.md'].map((f,i)=>{
  const p=K+f,b=fs.readFileSync(path.join(R,p)),snapshot='raw/dependencies/'+(14+i)+'.txt';assert.ok(!fs.existsSync(path.join(O,snapshot)));put(snapshot,b);
  const trees=Object.fromEntries(['main','g1','g2','g3','kb002'].map(k=>[k,json('raw/trees/'+k+'.json').find(x=>x.path===p)||null]));
  return {path:p,snapshot,bytes:b.length,sha256:sha(b),trees};
});
write('additional-dependencies.json',{capturedAt:new Date().toISOString(),reason:'two direct historical targets of the retained main source-map',files:extra});
for(const x of extra)plan.rows.push({path:x.path,group:'historical-link-targets',ownership:'existing-untracked-historical-document',action:'stage-existing-exact-bytes',intakeSha256:x.sha256,g3Blob:null,proposedSha256:x.sha256,proposal:null});
plan.rows.sort((a,b)=>a.path.localeCompare(b.path));assert.equal(new Set(plan.rows.map(x=>x.path)).size,717);
const attr=proposals.edits.find(e=>e.path==='.gitattributes');attr.steps[0].suffix+=extra.map(x=>'/'+x.path+' -text\n').join('');
const b=Buffer.concat([read('raw/documents/26-live.txt'),Buffer.from(attr.steps[0].suffix)]);put(attr.snapshot,b);attr.after=sha(b);attr.bytes=b.length;
plan.rows.find(x=>x.path==='.gitattributes').proposedSha256=attr.after;
write('proposals.json',proposals);write('integration-paths.json',plan);put('integration-paths.nul',Buffer.from(plan.rows.map(x=>x.path+'\0').join('')));
put('path-review.md',read('path-review.md').toString().replace('完整715路径','完整717路径'));
const {spawnSync}=require('node:child_process');const diff=spawnSync('git',['diff','--no-index','--no-color','--',path.join(O,'raw/documents/26-live.txt'),path.join(O,attr.snapshot)],{maxBuffer:2e6});assert.equal(diff.status,1);put('proposed/26.patch',diff.stdout);
const projection=json('local/projected-wikilinks.json'),covered=new Set(extra.map(x=>x.path));
assert.ok(projection.broken.every(x=>covered.has(x.resolved)||covered.has(x.resolved+'.md')));
// The two added historical pages have no additional Obsidian wikilinks.
assert.ok(extra.every(x=>!read(x.snapshot).toString().includes('[[')));
write('local/projected-wikilinks-final.json',{kind:projection.kind,basis:'initial projection plus exactly two captured direct historical targets; not PowerShell lint execution',markdown:projection.markdown+2,errors:0,uniqueMissingTargets:0,previousErrors:projection.broken,addedPaths:extra.map(x=>x.path),scope:'relative Obsidian target existence only; excludes ordinary Markdown links, runtime dependencies and future receipt files'});
const script='CUDA_coding/scripts/check_knowledge.ps1',scriptBytes=fs.readFileSync(path.join(R,script));put('raw/check_knowledge.ps1.txt',scriptBytes);write('local/lint-script-identity.json',{path:script,bytes:scriptBytes.length,sha256:sha(scriptBytes)});
console.log('PROPOSAL: 717 paths; 9 unapplied document/attribute proposals; projected Obsidian target gaps 2 -> 0 (not full lint).');
