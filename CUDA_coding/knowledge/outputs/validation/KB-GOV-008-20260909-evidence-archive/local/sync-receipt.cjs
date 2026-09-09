'use strict';
// Original-workspace packaging helper, not a clone validation command.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=process.cwd(),own='CUDA_coding/knowledge/outputs/validation/KB-GOV-008-20260909-evidence-archive',wt=path.resolve('.worktrees/kb-gov-008-evidence-archive');
assert.ok(fs.existsSync(wt+'/.git')&&fs.existsSync(own+'/input-manifest.json'));
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>{assert.ok(!e.isSymbolicLink());return e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]});}
const files=[...new Set(walk(own).map(p=>p.slice(own.length+1)).filter(p=>p!=='receipt-files.json').concat('local/receipt-paths.nul'))].sort();
fs.writeFileSync(own+'/receipt-files.json',JSON.stringify({files},null,2)+'\n');
fs.writeFileSync(own+'/local/receipt-paths.nul',Buffer.from(files.concat('receipt-files.json').map(p=>own+'/'+p).join('\0')+'\0'));
for(const p of files.concat('receipt-files.json')){const dst=path.join(wt,own,p);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(own+'/'+p,dst);}
console.log(JSON.stringify({receiptFiles:files.length+1,copiedTo:wt}));
