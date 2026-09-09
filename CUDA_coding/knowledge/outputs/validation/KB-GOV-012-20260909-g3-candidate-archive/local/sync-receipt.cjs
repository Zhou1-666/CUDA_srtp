'use strict';
// One-time producer: sync only this receipt into its isolated candidate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const OWN='CUDA_coding/knowledge/outputs/validation/KB-GOV-012-20260909-g3-candidate-archive',ROOT=path.resolve(__dirname,'../../../../../..');
const s=JSON.parse(fs.readFileSync(path.join(ROOT,OWN,'raw/start-state.json')));
assert.equal(path.resolve(s.worktree),path.join(ROOT,'.worktrees/kb-gov-012-g3-candidate-archive'));
const files=fs.readdirSync(path.join(ROOT,OWN),{recursive:true}).map(f=>OWN+'/'+f.replaceAll('\\','/')).filter(f=>fs.statSync(path.join(ROOT,f)).isFile()&&f!==OWN+'/archive-files.json').sort();
fs.writeFileSync(path.join(ROOT,OWN,'archive-files.json'),JSON.stringify({task:'KB-GOV-012',files},null,2)+'\n');
for(const f of [...files,OWN+'/archive-files.json']){const dest=path.join(s.worktree,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(ROOT,f),dest);}
console.log('Synced receipt files: '+(files.length+1));
