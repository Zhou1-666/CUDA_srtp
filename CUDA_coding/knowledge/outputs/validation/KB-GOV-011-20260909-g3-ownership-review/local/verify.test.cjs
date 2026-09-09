'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'..');
function fixture(){const b=fs.readFileSync(out+'/frozen-manifest.json'),m=JSON.parse(b),files=new Map([['frozen-manifest.json',b]]);for(const f of m.files)files.set(f.path,fs.readFileSync(path.join(out,f.path)));return files;}
function check(files){const entry=path.join(__dirname,'verify.cjs');assert.ok(fs.existsSync(entry),'fixed audit verifier must exist');return require(entry).verify(f=>files.get(f));}
test('replays only the fixed audit package without live workspace or Git access',()=>{
 const result=check(fixture());assert.equal(result.pages,7);assert.equal(result.localLinks,30);assert.equal(result.localTargets,47);assert.equal(result.sourceIds,11);assert.equal(result.commandIdentities,11);assert.ok(result.notRun.includes('LIVE_WORKSPACE_PROTECTION'));
});
test('rejects one-byte corruption of an original G3 page',()=>{
 const files=fixture(),b=Buffer.from(files.get('raw/pages/01.txt'));b[0]^=1;files.set('raw/pages/01.txt',b);assert.throws(()=>check(files),/SHA/);
});
test('rejects missing source-registry snapshot',()=>{
 const files=fixture();files.delete('raw/context/02.txt');assert.throws(()=>check(files),/missing/);
});
test('rejects a rewritten manifest, including an attempted outside path',()=>{
 const files=fixture(),m=JSON.parse(files.get('frozen-manifest.json'));m.files[0].path='../../outside.txt';files.set('frozen-manifest.json',Buffer.from(JSON.stringify(m)));assert.throws(()=>check(files),/manifest SHA/);
});
