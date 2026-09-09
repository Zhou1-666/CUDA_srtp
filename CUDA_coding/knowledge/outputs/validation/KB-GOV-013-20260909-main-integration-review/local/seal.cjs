'use strict';
// One-time seal of this receipt. Runtime logs are separate; no live repository changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const O=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(!fs.existsSync(path.join(O,'receipt-manifest.json')),'already sealed');
const excluded=new Set(['local/verify-receipt.cjs','receipt-manifest.json','local/verification.log','local/negative-tests.log','local/portable-verification.log','local/knowledge-lint.log','local/final-validation.json']);
const files=[];
function walk(dir=''){for(const entry of fs.readdirSync(path.join(O,dir),{withFileTypes:true})){const f=dir?dir+'/'+entry.name:entry.name;assert.ok(!entry.isSymbolicLink());if(entry.isDirectory())walk(f);else if(!excluded.has(f)){const b=fs.readFileSync(path.join(O,f));files.push({path:f,bytes:b.length,sha256:sha(b)});}}}
walk();files.sort((a,b)=>a.path.localeCompare(b.path));
const bytes=Buffer.from(JSON.stringify({task:'KB-GOV-013',kind:'fixed-receipt-input-and-decision-seal',files},null,2)+'\n');fs.writeFileSync(path.join(O,'receipt-manifest.json'),bytes,{flag:'wx'});
const verifier=path.join(O,'local/verify-receipt.cjs'),source=fs.readFileSync(verifier,'utf8');assert.equal(source.split("'PENDING_SEAL'").length,2);fs.writeFileSync(verifier,source.replace("'PENDING_SEAL'","'"+sha(bytes)+"'"));
console.log(JSON.stringify({sealedFiles:files.length,manifestSha256:sha(bytes),trustRoot:'local/verify-receipt.cjs',excludedRunArtifacts:[...excluded]},null,2));
