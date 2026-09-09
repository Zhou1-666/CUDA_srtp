'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {verifyPayload}=require('./verify-archive.cjs');
// Removing byte or inventory checks must make the corresponding rejection fail.
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'kb-gov-008-test-'));fs.mkdirSync(root+'/evidence');const bytes=Buffer.from('original\r\n');fs.writeFileSync(root+'/evidence/raw.txt',bytes);return {root,m:{roots:['evidence'],files:[{path:'evidence/raw.txt',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}]}};}
test('accepts exact original bytes',()=>{const {root,m}=fixture();assert.doesNotThrow(()=>verifyPayload(root,m));});
test('rejects missing file',()=>{const {root,m}=fixture();fs.unlinkSync(root+'/evidence/raw.txt');assert.throws(()=>verifyPayload(root,m),/inventory/);});
test('rejects same-length changed content',()=>{const {root,m}=fixture();fs.writeFileSync(root+'/evidence/raw.txt','modified\r\n');assert.throws(()=>verifyPayload(root,m),/SHA/);});
test('rejects CRLF conversion',()=>{const {root,m}=fixture();fs.writeFileSync(root+'/evidence/raw.txt','original\n');assert.throws(()=>verifyPayload(root,m),/bytes|SHA/);});
test('rejects unexpected evidence file',()=>{const {root,m}=fixture();fs.writeFileSync(root+'/evidence/extra.txt','extra');assert.throws(()=>verifyPayload(root,m),/inventory/);});
test('rejects path outside declared root',()=>{const {root,m}=fixture();m.files[0].path='../outside.txt';assert.throws(()=>verifyPayload(root,m),/path/);});
