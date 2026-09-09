'use strict';
// Preparation helper only; copies this new receipt, never historical evidence.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),root=path.resolve(out,'../../../../..'),own=path.relative(root,out).replaceAll('\\','/');
const state=JSON.parse(fs.readFileSync(out+'/raw/input-state-v2.json'));assert.equal(root,state.root);
assert.equal(path.resolve(state.worktree),path.join(root,'.worktrees/kb-gov-010-g2-document-archive'));
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);assert.ok(!e.isSymbolicLink());if(e.isDirectory())walk(file);else if(file!==path.join(out,'archive-files.json'))files.push(path.relative(root,file).replaceAll('\\','/'));}}
walk(out);files.sort();fs.writeFileSync(out+'/archive-files.json',JSON.stringify({files},null,2)+'\n');
for(const file of [...files,own+'/archive-files.json']){const target=path.resolve(state.worktree,file);assert.ok(target.startsWith(path.resolve(state.worktree,own)+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
console.log('synced own receipt files: '+(files.length+1));
