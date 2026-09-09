'use strict';
// Portable, read-only G1 archive check. Does not execute historical scripts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(root,p){
  assert.ok(fs.existsSync(path.join(root,p)),'inventory missing: '+p);
  return fs.readdirSync(path.join(root,p),{withFileTypes:true}).flatMap(e=>{const f=p+'/'+e.name;assert.ok(!e.isSymbolicLink(),'symlink: '+f);return e.isDirectory()?walk(root,f):[f];});
}
function verifyPayload(root,manifest) {
  for(const p of [...manifest.roots,...manifest.files.map(f=>f.path)])assert.ok(!path.isAbsolute(p)&&!p.includes('\\')&&!p.split('/').includes('..'),'invalid path: '+p);
  for(const f of manifest.files)assert.ok(manifest.roots.some(p=>f.path.startsWith(p+'/')),'path outside roots: '+f.path);
  assert.deepEqual(manifest.roots.flatMap(p=>walk(root,p)).sort(),manifest.files.map(f=>f.path).sort(),'inventory mismatch');
  for(const f of manifest.files){const b=fs.readFileSync(path.join(root,f.path));assert.equal(b.length,f.bytes,'bytes: '+f.path);assert.equal(hash(b),f.sha256,'SHA: '+f.path);}
}
function main(){
  const out=path.resolve(__dirname,'..'),root=path.resolve(out,'../../../../..'),own=path.relative(root,out).replaceAll('\\','/');
  const read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p));
  const m=json(own+'/input-manifest.json'),receipt=json(own+'/receipt-files.json'),staged=process.argv.includes('--staged');
  assert.ok(process.argv.slice(2).every(x=>x==='--staged'),'usage: node verify-archive.cjs [--staged]');
  function git(args,input){const r=spawnSync('git',args,{cwd:root,input,maxBuffer:60e6,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});assert.equal(r.status,0,r.stderr?.toString());return r.stdout;}
  verifyPayload(root,m);
  const ownFiles=receipt.files.map(p=>own+'/'+p).concat(own+'/receipt-files.json');
  assert.deepEqual(walk(root,own).sort(),ownFiles.slice().sort(),'receipt inventory mismatch');
  const allowed=[...m.files.map(f=>f.path),...ownFiles,'.gitattributes'].sort();
  assert.equal(new Set(allowed).size,allowed.length,'duplicate allowlist');
  const diff=git(staged?['diff','--cached','--name-only','-z',m.base]:['diff','--name-only','-z',m.base,'HEAD']).toString().split('\0').filter(Boolean).sort();
  assert.deepEqual(diff,allowed,'Git change scope mismatch');
  git(['merge-base','--is-ancestor',m.base,'HEAD']);
  const expectedAttributes=Buffer.concat([git(['show',m.base+':.gitattributes']),Buffer.from('\n# KB-GOV-008: preserve archived evidence bytes.\n/.gitattributes text eol=lf\n'+[...m.roots,own].map(p=>p+'/** -text').join('\n')+'\n')]);
  assert.deepEqual(read('.gitattributes'),expectedAttributes,'only exact archive attributes');
  const attrPaths=allowed.filter(p=>p!=='.gitattributes');
  const attr=git(['check-attr',...(staged?['--cached']:[]),'-z','--stdin','text'],Buffer.from(attrPaths.join('\0')+'\0')).toString().split('\0');
  for(let i=0;i<attrPaths.length;i++){assert.equal(attr[3*i],attrPaths[i]);assert.equal(attr[3*i+2],'unset','-text missing: '+attrPaths[i]);}
  const blobs=git(['cat-file','--batch'],allowed.map(p=>(staged?':':'HEAD:')+p+'\n').join(''));
  let offset=0;
  for(const p of allowed){const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString(),match=/^[0-9a-f]+ blob (\d+)$/.exec(header);assert.ok(match,'blob missing: '+p);const size=Number(match[1]),blob=blobs.subarray(end+1,end+1+size);assert.equal(hash(blob),hash(read(p)),'Git blob SHA: '+p);offset=end+size+2;}
  assert.equal(offset,blobs.length,'blob stream complete');
  if(staged){assert.equal(git(['diff','--name-only']).toString(),'','unstaged changes');assert.equal(git(['ls-files','--others','--exclude-standard']).toString(),'','untracked files');}
  else assert.equal(git(['status','--porcelain=v1','--untracked-files=all']).toString(),'','checkout must be clean');
  const deps=json(own+'/dependencies.json');
  for(const r of deps.links.filter(x=>x.classification==='G1-input'))assert.ok(m.files.some(f=>f.path===r.target),'internal link outside manifest: '+r.target);
  console.log(JSON.stringify({mode:staged?'staged':'committed',base:m.base,head:git(['rev-parse','HEAD']).toString().trim(),inputFiles:m.files.length,inputBytes:m.files.reduce((s,f)=>s+f.bytes,0),receiptFiles:ownFiles.length,checkedGitBlobs:allowed.length,dependencyLinks:deps.links.length,dependencyClasses:deps.summary,historicalScriptsExecuted:false},null,2));
  console.log('KB-GOV-008 ARCHIVE: PASS');
}
module.exports={verifyPayload};
if(require.main===module){try{main();}catch(e){console.error('KB-GOV-008 ARCHIVE: FAIL\n'+e.message);process.exitCode=1;}}
