// Read-only checks for this bounded documentation handoff, not a new repository lint.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const receipt = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(receipt, 'raw/before-manifest.json'), 'utf8'));
const root = manifest.root;
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const oldText = p => fs.readFileSync(path.join(receipt, manifest.captures.find(x => x.path === p).backup), 'utf8');
const errors = [];
function check(ok, message) { if (!ok) errors.push(message); }
function git(args) {
  const r = cp.spawnSync('git', args, {cwd:root, encoding:'utf8', maxBuffer:32*1024*1024});
  if (r.status !== 0) throw Error('git ' + args.join(' ') + ': ' + r.stderr);
  return r.stdout;
}
for (const entry of manifest.captures) {
  const b = fs.readFileSync(path.join(receipt, entry.backup));
  check(b.length === entry.bytes && sha(b) === entry.sha256, 'Recovery copy changed: ' + entry.path);
}
for (const entry of manifest.protectedFiles) {
  const b = fs.readFileSync(path.join(root, entry.path));
  check(b.length === entry.bytes && sha(b) === entry.sha256, 'Protected object changed: ' + entry.path);
}
check(git(['rev-parse','HEAD']) === fs.readFileSync(path.join(receipt,'raw/git-head-before.txt'),'utf8'), 'HEAD moved');
check(git(['worktree','list','--porcelain']) === fs.readFileSync(path.join(receipt,'raw/git-worktrees-before.txt'),'utf8'), 'Worktree identity changed');
check(git(['-c','core.quotepath=false','diff','--cached','--name-status']) === fs.readFileSync(path.join(receipt,'raw/git-staged-before.txt'),'utf8'), 'Index changed');

const queuePath = 'CUDA_coding/knowledge/meta/task-queue.md';
const tableRows = s => s.split(/\r?\n/).filter(l => /^\|\s*TASK-\d/.test(l));
check(JSON.stringify(tableRows(read(queuePath))) === JSON.stringify(tableRows(oldText(queuePath))), 'Software task rows changed');
const currentJobLine = oldText(queuePath).split(/\r?\n/).find(l => l.startsWith('> **2026-09-08 当前：') && l.includes('第29节'));
check(Boolean(currentJobLine) && read(queuePath).includes(currentJobLine), 'TASK-031 current scheduling evidence changed');
const blockerPath = 'CUDA_coding/knowledge/meta/task-blocker-register.md';
const blockerBody = s => s.slice(s.indexOf('## 活动条目')).split('### KB-GOV-001')[0].trimEnd();
check(blockerBody(read(blockerPath)) === blockerBody(oldText(blockerPath)), 'Existing blocker/evidence bodies changed');
const logPath = 'CUDA_coding/knowledge/meta/compile-log.md';
const originalLog = oldText(logPath);
check(read(logPath).endsWith(originalLog.slice(originalLog.indexOf('\n') + 1)), 'Historical compile-log entries changed');
const briefPath = 'CUDA_coding/knowledge/wiki/briefs/current-project-brief.md';
const historicalBody = s => s.slice(s.indexOf('## 目标'));
check(historicalBody(read(briefPath)) === historicalBody(oldText(briefPath)), 'Historical brief body changed');
check(read(briefPath).includes('status: deprecated') && read(briefPath).includes('2026-08-20 历史快照'), 'Historical brief is not clearly deprecated');
check(!read('AGENTS.md').includes('`perf_bench/REPORT.md` 的“28→约18”'), 'Stale P0 remains active');

const changed = manifest.editablePaths.filter(p => read(p) !== oldText(p));
let newLinks = 0;
const localLinks = (p, lines) => {
  for (const line of lines) {
    for (const match of line.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      let target = match[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      target = decodeURIComponent(target);
      newLinks++;
      check(fs.existsSync(path.resolve(root,path.dirname(p),target)), 'Missing new link: ' + p + ' -> ' + target);
    }
  }
};
for (const p of changed) {
  const beforeLines = new Set(oldText(p).split(/\r?\n/));
  localLinks(p, read(p).split(/\r?\n/).filter(l => !beforeLines.has(l)));
  const record = manifest.captures.find(x => x.path === p);
  const diff = cp.spawnSync('git',['diff','--no-index','--check',path.join(receipt,record.backup),path.join(root,p)],{cwd:root,encoding:'utf8'});
  // --no-index returns 1 for different files; --check adds bit 2 for whitespace errors.
  check((diff.status === 0 || diff.status === 1) && diff.stdout.trim() === '', 'Whitespace diff failed: ' + p + '\n' + diff.stdout + diff.stderr);
}
localLinks(path.relative(root,path.join(receipt,'README.md')),fs.readFileSync(path.join(receipt,'README.md'),'utf8').split(/\r?\n/));
console.log(JSON.stringify({recoveryCopies:manifest.captures.length,protectedObjects:manifest.protectedFiles.length,changedDocuments:changed.length,softwareTaskRows:tableRows(read(queuePath)).length,newLocalLinks:newLinks,failures:errors.length},null,2));
if (errors.length) {
  for (const e of errors) console.error(e);
  console.error('KB-GOV-001 verification: FAIL');
  process.exitCode = 1;
} else console.log('KB-GOV-001 verification: PASS');
