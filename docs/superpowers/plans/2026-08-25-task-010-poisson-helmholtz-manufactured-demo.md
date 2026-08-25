# TASK-010 Poisson/Helmholtz Manufactured Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and validate an independent FP64 CUDA Fortran + MPI manufactured-solution demo for batched fourth-order Poisson and Helmholtz line solves using the existing pentadiagonal solver.

**Architecture:** Add a standalone example that assembles `-u_zz + lambda*u = f` into a five-point fourth-order stencil, invokes the existing public penta plan/solver API, and emits one stable CSV row per run. Keep mathematical and CSV-gate logic in an independent Node audit, and keep the 32-case NVHPC/MPI/GPU matrix in a shell runner so the solver core and performance benchmark remain untouched.

**Tech Stack:** CUDA Fortran (NVHPC), MPI, GNU Make, Bash, Node.js CommonJS, PowerShell knowledge lint.

**Spec:** `CUDA_coding/knowledge/outputs/designs/TASK-010-20260825-poisson-helmholtz-manufactured-design.md`

## Global Constraints

- Work from an isolated `codex/` worktree created at execution time because the current main worktree contains unrelated user changes.
- Do not modify `CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90`, any tridiagonal source, or `perf_bench`.
- Use FP64 and only `lambda=0` (Poisson) and `lambda=1` (Helmholtz).
- Freeze `u=(1+x+y)*sin(pi*z)`, `x=(ix+1)/(Nx+1)`, `y=(iy+1)/(Ny+1)`, homogeneous endpoint values, and manufactured ghost-point elimination.
- Formal dimensions are `Nx=16`, `Ny=8`, `Nz in {32,64,128,256}`, `np in {1,2}`, and forward slots in `{28,22}`.
- Every local rank must have `Nrow >= 5`; invalid input, non-finite output, MPI/CUDA failure, incomplete CSV, or a failed numerical gate must return nonzero.
- Require scaled discrete `residual_linf <= 1e-10` and observed `L2/Linf` order `>=3.8` for both `64->128` and `128->256` transitions.
- Record `solver_s_max` only as metadata. Do not claim speedup or performance improvement.
- Preserve the user's dirty main worktree; stage and commit only files named by the current task.

## File Responsibility Map

- Create `CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit.js`: independent math helpers, CSV parser, convergence grouping, numerical gates, and audit CLI.
- Create `CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit_test.js`: Node unit/CLI tests for formula, boundary rows, convergence order, missing cases, residual rejection, and non-finite rejection.
- Create `CUDA_coding/CUDA_code/源代码/verify/task010_source_contract_test.js`: static contract test for the Fortran entry point, fixed CSV schema, public penta calls, and Make target.
- Create `CUDA_coding/CUDA_code/源代码/examples/ex_penta_poisson_helmholtz.f90`: one-case MPI/GPU manufactured demo.
- Modify `CUDA_coding/CUDA_code/源代码/examples/Makefile`: add only the new object, executable, phony target, and link rule.
- Create `CUDA_coding/CUDA_code/源代码/verify/run_task_010_manufactured.sh`: clean build, 32-case execution, raw CSV collection, and Node gate invocation.
- Create `CUDA_coding/knowledge/outputs/validation/TASK-010-20260825-paraai-a100/README.md` plus `raw/`: immutable target-environment evidence.
- Modify `CUDA_coding/knowledge/wiki/decisions/ADR-007-TASK-010独立Poisson-Helmholtz制造解demo.md`: attach final evidence without changing the approved scope.
- Modify `CUDA_coding/knowledge/wiki/testing/test-matrix.md`, `CUDA_coding/knowledge/meta/task-queue.md`, `CUDA_coding/knowledge/meta/task-blocker-register.md`, `CUDA_coding/knowledge/meta/change-impact-map.md`, `CUDA_coding/knowledge/wiki/briefs/penta-active-context.md`, and `CUDA_coding/knowledge/wiki/paper/claim-evidence-matrix.md`: synchronize the verified outcome and its limits.

---

### Task 1: Independent Formula and Result-Gate Audit

**Files:**
- Create: `CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit_test.js`
- Create: `CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit.js`

**Interfaces:**
- Consumes: the frozen equation, stencil, boundary closure, CSV schema, and gates from the spec.
- Produces: CommonJS exports `manufacturedValue(x,y,z)`, `scaledRow({lambda,h,g,nz,x,y})`, `continuousDefect({lambda,nz,x,y})`, `observedOrder(coarseError,fineError,coarseNz,fineNz)`, `parseCsv(text)`, and `summarizeRows(rows)`; CLI `node task010_manufactured_audit.js --input cases.csv --summary summary.csv`.

- [ ] **Step 1: Write the failing math and gate tests**

Create `task010_manufactured_audit_test.js` with Node strict assertions. The fixture builder must create the exact Cartesian product of 2 lambdas × 2 rank counts × 2 slot modes × 4 grids:

```javascript
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePath = path.join(__dirname, 'task010_manufactured_audit.js');
assert.ok(fs.existsSync(modulePath), 'TASK-010 audit module must exist');
const audit = require(modulePath);

assert.ok(Math.abs(audit.manufacturedValue(0.25, 0.5, 0.5) - 1.75) < 1e-15);
const left = audit.scaledRow({lambda:0,h:1/31,g:0,nz:32,x:0.25,y:0.5});
assert.deepEqual(left.coefficients, [0,0,1,0,0]);
assert.equal(left.rhs, 0);
const nearLeft = audit.scaledRow({lambda:1,h:1/31,g:1,nz:32,x:0.25,y:0.5});
assert.equal(nearLeft.coefficients[0], 0);
assert.ok(Number.isFinite(nearLeft.rhs));
assert.ok(Math.abs(audit.observedOrder(16e-8, 1e-8, 65, 129) - 4) < 1e-12);

function fixtureRows() {
  const rows=[];
  for (const lambda of [0,1]) for (const nranks of [1,2])
    for (const slots of [28,22]) for (const nz of [32,64,128,256]) {
      const h=1/(nz-1);
      rows.push({pde:lambda===0?'poisson':'helmholtz',lambda,nranks,nx:16,ny:8,nz,
        forward_slots:slots,l2_error:h**4,linf_error:2*h**4,
        residual_linf:1e-13,solver_s_max:1e-3});
    }
  return rows;
}
const good=audit.summarizeRows(fixtureRows());
assert.equal(good.cases,32);
assert.equal(good.failures.length,0);
assert.throws(()=>audit.summarizeRows(fixtureRows().slice(1)),/expected 32 cases/);
const badResidual=fixtureRows(); badResidual[0].residual_linf=1e-9;
assert.throws(()=>audit.summarizeRows(badResidual),/residual gate/);
const badFinite=fixtureRows(); badFinite[0].l2_error=Number.NaN;
assert.throws(()=>audit.summarizeRows(badFinite),/non-finite/);
console.log('TASK010_MANUFACTURED_AUDIT_TEST_PASS');
```

- [ ] **Step 2: Run the test and confirm the intended red state**

Run from `CUDA_coding/CUDA_code/源代码`:

```powershell
node verify/task010_manufactured_audit_test.js
```

Expected: nonzero exit with `TASK-010 audit module must exist`.

- [ ] **Step 3: Implement the independent audit module**

Use this exact schema and order formula:

```javascript
const HEADER=['pde','lambda','nranks','nx','ny','nz','forward_slots',
  'l2_error','linf_error','residual_linf','solver_s_max'];
function manufacturedValue(x,y,z) { return (1+x+y)*Math.sin(Math.PI*z); }
function observedOrder(coarseError,fineError,coarseNz,fineNz) {
  if (![coarseError,fineError].every(v=>Number.isFinite(v)&&v>0))
    throw new Error('errors for observed order must be finite and positive');
  const hc=1/(coarseNz-1), hf=1/(fineNz-1);
  return Math.log(coarseError/fineError)/Math.log(hc/hf);
}
```

`scaledRow` returns `{coefficients:[a,b,c,d,e],rhs}`. It returns the unit row at `g=0,nz-1`, uses `[1,-16,30+12*h*h*lambda,-16,1]` elsewhere, and for `g=1` or `g=nz-2` zeroes the missing coefficient after subtracting its analytic ghost contribution from `rhs`.

`continuousDefect` evaluates the analytic values in the scaled row, divides the scaled residual by `12*h*h`, and returns the maximum absolute defect over `g=1..nz-2`.

`parseCsv` locates the exact header, rejects duplicate/missing columns, parses all numeric columns, and rejects non-finite values. `summarizeRows` requires the unique 32-case product, checks the PDE label and fixed `Nx/Ny`, applies the residual gate, and calculates `64->128` and `128->256` L2/Linf orders per lambda/rank/slot group.

The CLI writes this summary header:

```text
pde,lambda,nranks,forward_slots,order_l2_64_128,order_l2_128_256,order_linf_64_128,order_linf_128_256,max_residual_linf
```

On success print `TASK010_MANUFACTURED_AUDIT_PASS cases=32 failures=0`; on failure execute `console.error('TASK010_MANUFACTURED_AUDIT_ERROR: ' + error.message)` and exit 1. Add `--self-check`, which checks both lambda values over the four frozen grids and prints `TASK010_MANUFACTURED_SELF_CHECK_PASS` only if both defect-order transitions are at least 3.8.

- [ ] **Step 4: Run the audit tests**

```powershell
node verify/task010_manufactured_audit_test.js
node verify/task010_manufactured_audit.js --self-check
```

Expected: both PASS markers and exit 0.

- [ ] **Step 5: Commit only the independent audit**

```powershell
git add -- "CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit.js" "CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit_test.js"
git commit -m "test: add TASK-010 manufactured PDE audit"
```

---

### Task 2: Standalone CUDA Fortran Manufactured Demo

**Files:**
- Create: `CUDA_coding/CUDA_code/源代码/verify/task010_source_contract_test.js`
- Create: `CUDA_coding/CUDA_code/源代码/examples/ex_penta_poisson_helmholtz.f90`
- Modify: `CUDA_coding/CUDA_code/源代码/examples/Makefile:32-75`

**Interfaces:**
- Consumes: `PaScaL_TDMA_cuda_penta`, public `para`, `ptdma_plan_cuda`, `pascal_plan_create`, `pascal_solver`, `pascal_plan_clean`, and `PENTA_FORWARD_SLOTS`.
- Produces: `run/ex_penta_poisson_helmholtz`; invocation `ex_penta_poisson_helmholtz Nx Ny Nz lambda`; one rank-0 CSV row with the frozen 11-column schema.

- [ ] **Step 1: Write the failing source-contract test**

Create `verify/task010_source_contract_test.js`:

```javascript
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sourcePath=path.join(root,'examples','ex_penta_poisson_helmholtz.f90');
assert.ok(fs.existsSync(sourcePath),'manufactured Fortran demo must exist');
const source=fs.readFileSync(sourcePath,'utf8');
const makefile=fs.readFileSync(path.join(root,'examples','Makefile'),'utf8');
for (const token of ['use PaScaL_TDMA_cuda_penta','call pascal_plan_create',
  'call pascal_solver','call pascal_plan_clean','PENTA_FORWARD_SLOTS',
  'pde,lambda,nranks,nx,ny,nz,forward_slots,l2_error,linf_error,residual_linf,solver_s_max'])
  assert.ok(source.includes(token),`missing source contract: ${token}`);
assert.match(makefile,/^poisson_helmholtz:\s*\$\(EXEPDE\)$/m);
assert.match(makefile,/ex_penta_poisson_helmholtz\.o/);
console.log('TASK010_SOURCE_CONTRACT_TEST_PASS');
```

- [ ] **Step 2: Run the contract test and confirm the red state**

```powershell
node verify/task010_source_contract_test.js
```

Expected: nonzero exit with `manufactured Fortran demo must exist`.

- [ ] **Step 3: Add the minimal Make target**

Add these definitions and rules without changing existing target meanings:

```make
EXEPDE = $(BINDIR)/ex_penta_poisson_helmholtz
OBJSPDE = ex_penta_poisson_helmholtz.o
.PHONY: all example penta poisson_helmholtz api_validation stability_validation lifecycle_validation clean
poisson_helmholtz: $(EXEPDE)
$(EXEPDE): $(OBJSPDE)
	mkdir -p $(BINDIR)
	$(FC) $(FLAG) $(CUDAFLAG) -I$(INCDIR) -o $@ $(OBJSPDE) -L$(LIBDIR) -lPaScaL_TDMA
```

- [ ] **Step 4: Implement initialization and validation**

Create program `ex_penta_poisson_helmholtz`. Parse four arguments; accept positive `Nx,Ny`, exact `lambda=0.d0` or `1.d0`, and `Nz >= 5*nprocs`. Parse slots, defaulting to `PASCAL_PENTA_FORWARD_SLOTS_28`, and reject other values.

```fortran
call MPI_INIT(ierr)
call MPI_COMM_RANK(MPI_COMM_WORLD,myrank,ierr)
call MPI_COMM_SIZE(MPI_COMM_WORLD,nprocs,ierr)
call para(0,nz-1,nprocs,myrank,ia,ib)
nrow=ib-ia+1
cuda_status=cudaGetDeviceCount(ngpu)
gpurank=mod(myrank,ngpu)
cuda_status=cudaSetDevice(gpurank)
```

Every later MPI/CUDA status is checked. Failures use prefix `TASK010_PDE_ERROR:` and abort collectively.

- [ ] **Step 5: Implement the frozen matrix assembly**

Allocate host originals and separate device work arrays `(0:nsys-1,0:nrow-1)`, with `nsys=nx*ny`. For each line and local row:

```fortran
ix=mod(line,nx); iy=line/nx
x=dble(ix+1)/dble(nx+1); y=dble(iy+1)/dble(ny+1)
g=ia+j; z=dble(g)*h
u_exact=(1.d0+x+y)*sin(pi*z)
f=(pi*pi+lambda)*u_exact
```

Use unit endpoint rows. Interior rows are `[1,-16,30+12*h*h*lambda,-16,1]` with RHS `12*h*h*f`. At `g=1`, subtract `A*u(x,y,-h)` then set `A=0`; at `g=nz-2`, subtract `E*u(x,y,1+h)` then set `E=0`. Copy originals to device; never overwrite host originals.

- [ ] **Step 6: Implement solve, metrics, gather, and residual**

```fortran
call pascal_plan_create(plan,nsys,MPI_COMM_WORLD,myrank,nprocs,128,128,forward_slots)
call MPI_BARRIER(MPI_COMM_WORLD,ierr)
t0=MPI_WTIME()
call pascal_solver(plan,A_d,B_d,C_d,D_d,E_d,R_d,nsys,nrow)
cuda_status=cudaDeviceSynchronize()
local_solver_s=MPI_WTIME()-t0
call MPI_ALLREDUCE(local_solver_s,solver_s_max,1,MPI_DOUBLE_PRECISION,MPI_MAX,MPI_COMM_WORLD,ierr)
```

Compute forward RMS and max errors with MPI reductions. Build `recvcounts(rank)=nsys*rank_nrow` and `displs(rank)=nsys*rank_start` using `para`, then `MPI_GATHERV` the solution into rank 0. Rank 0 regenerates every frozen row and computes maximum absolute scaled residual. Use `ieee_is_finite` for all reported metrics.

- [ ] **Step 7: Emit one result and clean up**

Rank 0 prints exactly one header and one data row:

```text
pde,lambda,nranks,nx,ny,nz,forward_slots,l2_error,linf_error,residual_linf,solver_s_max
```

Use at least 16 significant digits. Then clean the plan, deallocate every array, and finalize MPI.

- [ ] **Step 8: Run local static checks**

```powershell
node verify/task010_source_contract_test.js
node verify/task010_manufactured_audit_test.js
node verify/task010_manufactured_audit.js --self-check
```

Expected: all PASS. This is not a CUDA Fortran build.

- [ ] **Step 9: Commit the standalone demo**

```powershell
git add -- "CUDA_coding/CUDA_code/源代码/examples/ex_penta_poisson_helmholtz.f90" "CUDA_coding/CUDA_code/源代码/examples/Makefile" "CUDA_coding/CUDA_code/源代码/verify/task010_source_contract_test.js"
git commit -m "feat: add TASK-010 manufactured PDE demo"
```

---

### Task 3: Reproducible 32-Case Runner

**Files:**
- Modify: `CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit_test.js`
- Create: `CUDA_coding/CUDA_code/源代码/verify/run_task_010_manufactured.sh`

**Interfaces:**
- Consumes: `run/ex_penta_poisson_helmholtz`, the audit CLI, `FC` defaulting to `mpifort`, `MPIRUN_EXTRA` defaulting to `--mca btl ^openib`, and an optional log-directory argument.
- Produces: `cases.csv`, `summary.csv`, 32 case logs, `environment.txt`, `build.log`, and `TASK010_MANUFACTURED_RUNNER_PASS cases=32 failures=0`.

- [ ] **Step 1: Extend the Node test with a full CLI fixture**

Add `spawnSync`, `os`, and a temporary-directory lifecycle to the test. Serialize the existing 32-row fixture with the exact production header, invoke the CLI, and require one header plus eight group rows:

```javascript
const {spawnSync}=require('node:child_process');
const os=require('node:os');
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'task010-audit-'));
try {
  const casesPath=path.join(tempDir,'cases.csv');
  const summaryPath=path.join(tempDir,'summary.csv');
  const header=['pde','lambda','nranks','nx','ny','nz','forward_slots',
    'l2_error','linf_error','residual_linf','solver_s_max'];
  const lines=fixtureRows().map(row=>header.map(name=>row[name]).join(','));
  fs.writeFileSync(casesPath,`${header.join(',')}\n${lines.join('\n')}\n`);
  const cli=spawnSync(process.execPath,
    [modulePath,'--input',casesPath,'--summary',summaryPath],{encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);
  assert.match(cli.stdout,/TASK010_MANUFACTURED_AUDIT_PASS cases=32 failures=0/);
  assert.ok(fs.existsSync(summaryPath));
  assert.equal(fs.readFileSync(summaryPath,'utf8').trim().split(/\r?\n/).length,9);
} finally {
  fs.rmSync(tempDir,{recursive:true,force:true});
}
```

- [ ] **Step 2: Run the extended independent test**

```powershell
node verify/task010_manufactured_audit_test.js
```

Expected: `TASK010_MANUFACTURED_AUDIT_TEST_PASS`.

- [ ] **Step 3: Implement clean build and environment capture**

The runner uses `set -u`, resolves its source root, creates the log directory, and records:

```bash
{
  date -Iseconds
  git rev-parse HEAD
  git status --short
  "${FC:-mpifort}" --version | head -n 2
  mpirun --version | head -n 2
  nvidia-smi -L
} >"$log_dir/environment.txt" 2>&1
make veryclean >"$log_dir/clean.log" 2>&1
make lib FC="${FC:-mpifort}" >"$log_dir/build.log" 2>&1 || exit 1
make -C examples poisson_helmholtz FC="${FC:-mpifort}" >>"$log_dir/build.log" 2>&1 || exit 1
```

Delete or move aside `run/ex_penta_poisson_helmholtz` before building so a failed build cannot reuse a stale binary.

- [ ] **Step 4: Implement the exact case loop**

Initialize `cases.csv` with the frozen header. Run one fresh MPI launch for each combination:

```bash
for ranks in 1 2; do
  for slots in 28 22; do
    for lambda in 0 1; do
      for nz in 32 64 128 256; do
        label="lambda${lambda}-np${ranks}-slots${slots}-nz${nz}"
        PENTA_FORWARD_SLOTS="$slots" timeout 60s mpirun ${MPIRUN_EXTRA:---mca btl ^openib} \
          -np "$ranks" "$exe" 16 8 "$nz" "$lambda" >"$log_dir/$label.log" 2>&1
      done
    done
  done
done
```

After each launch, require exit 0 and exactly one row beginning `poisson,` or `helmholtz,`; append it to `cases.csv`. Count timeout, nonzero, missing, and duplicate rows as failures while retaining all independent logs.

- [ ] **Step 5: Invoke the gate and return its status**

```bash
node "$source_root/verify/task010_manufactured_audit.js" \
  --input "$log_dir/cases.csv" --summary "$log_dir/summary.csv" \
  >"$log_dir/audit.log" 2>&1
```

Print `TASK010_MANUFACTURED_RUNNER_PASS cases=32 failures=0` only if the shell failure count is zero and the audit exits 0. Otherwise execute `echo "TASK010_MANUFACTURED_RUNNER_FAIL cases=$cases failures=$failures"` and exit nonzero.

- [ ] **Step 6: Syntax-check the runner**

```bash
bash -n CUDA_coding/CUDA_code/源代码/verify/run_task_010_manufactured.sh
```

Expected: no output and exit 0. If Bash is unavailable on Windows, perform this first on the target Linux environment and record the local limitation.

- [ ] **Step 7: Commit the runner and CLI test**

```powershell
git add -- "CUDA_coding/CUDA_code/源代码/verify/run_task_010_manufactured.sh" "CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit_test.js"
git commit -m "test: add TASK-010 end-to-end runner"
```

---

### Task 4: Target-Environment Build and End-to-End Validation

**Files:**
- Create after evidence returns: `CUDA_coding/knowledge/outputs/validation/TASK-010-20260825-paraai-a100/raw/*`
- Create after evidence returns: `CUDA_coding/knowledge/outputs/validation/TASK-010-20260825-paraai-a100/SHA256SUMS.txt`

**Interfaces:**
- Consumes: the three implementation commits, an NVHPC + MPI + GPU Linux environment, and one GPU per rank.
- Produces: clean-build evidence and 32 passing raw cases tied to one immutable code SHA.

- [ ] **Step 1: Verify the branch before transfer**

```powershell
git status --short --branch
git log -4 --oneline
node "CUDA_coding/CUDA_code/源代码/verify/task010_manufactured_audit_test.js"
node "CUDA_coding/CUDA_code/源代码/verify/task010_source_contract_test.js"
```

Expected: only intentional task state is present, all implementation commits are visible, and both tests pass.

- [ ] **Step 2: Package only TASK-010 implementation files**

Create a tar archive rooted at `源代码` containing exactly:

```text
examples/ex_penta_poisson_helmholtz.f90
examples/Makefile
verify/task010_manufactured_audit.js
verify/task010_manufactured_audit_test.js
verify/task010_source_contract_test.js
verify/run_task_010_manufactured.sh
```

Print its listing and SHA-256. Exclude objects, modules, executables, unrelated logs, and the solver file from the dirty main worktree.

- [ ] **Step 3: Back up the cluster targets before extraction**

Resolve the exact cluster source root. Copy any existing versions of the six target files into a timestamped backup under `$HOME`; verify the resolved backup and source paths before extraction. Extract the archive and confirm that `src/PaScaL_TDMA_cuda_penta.f90` retains its pre-extraction SHA-256.

- [ ] **Step 4: Run the formal matrix**

From `CUDA_coding/CUDA_code/源代码`:

```bash
bash verify/run_task_010_manufactured.sh verify/logs/task010-20260825
```

Expected: `TASK010_MANUFACTURED_RUNNER_PASS cases=32 failures=0`, exit 0; 32 case logs; `cases.csv` with 33 lines; `summary.csv` with 9 lines; and environment, clean, build, and audit logs.

- [ ] **Step 5: Verify raw counts and hashes**

```bash
wc -l verify/logs/task010-20260825/cases.csv verify/logs/task010-20260825/summary.csv
grep -F 'TASK010_MANUFACTURED_AUDIT_PASS cases=32 failures=0' verify/logs/task010-20260825/audit.log
sha256sum verify/logs/task010-20260825/* > verify/logs/task010-20260825/SHA256SUMS.txt
sha256sum -c verify/logs/task010-20260825/SHA256SUMS.txt
```

Expected: line counts 33 and 9, the PASS marker, and `OK` for every listed file.

- [ ] **Step 6: Preserve failed attempts truthfully**

If build or any case fails, stop the completion path, retain the whole log directory, and update the blocker with the exact command, exit code, environment, responsible party, minimum retry action, and check date. Do not relax `1e-10` or `3.8` without a new explicit decision.

---

### Task 5: Evidence Compilation, Knowledge Synchronization, and Closure

**Files:**
- Create: `CUDA_coding/knowledge/outputs/validation/TASK-010-20260825-paraai-a100/README.md`
- Create: `CUDA_coding/knowledge/outputs/validation/TASK-010-20260825-paraai-a100/raw/*`
- Create: `CUDA_coding/knowledge/outputs/validation/TASK-010-20260825-paraai-a100/SHA256SUMS.txt`
- Modify: `CUDA_coding/knowledge/wiki/decisions/ADR-007-TASK-010独立Poisson-Helmholtz制造解demo.md`
- Modify: `CUDA_coding/knowledge/wiki/testing/test-matrix.md`
- Modify: `CUDA_coding/knowledge/meta/task-queue.md`
- Modify: `CUDA_coding/knowledge/meta/task-blocker-register.md`
- Modify: `CUDA_coding/knowledge/meta/change-impact-map.md`
- Modify: `CUDA_coding/knowledge/wiki/briefs/penta-active-context.md`
- Modify: `CUDA_coding/knowledge/wiki/paper/claim-evidence-matrix.md`

**Interfaces:**
- Consumes: immutable implementation SHA, target metadata, raw/summary CSV, logs, and verified hash list.
- Produces: an auditable receipt and either a truthful `done` snapshot or an updated non-done blocker.

- [ ] **Step 1: Copy and verify returned evidence locally**

Copy the entire remote log directory into `raw/`, preserve filenames, and run `sha256sum -c` from the directory level expected by the list. Record matching remote/local archive hashes if transfer uses an archive. Any mismatch blocks closure.

- [ ] **Step 2: Write the validation receipt from raw facts**

The README lists the implementation SHA/dirty status; hardware, driver, CUDA, NVHPC, MPI, and mapping; exact matrix; 32/32 statuses; maximum residual; minimum reported order; hash verification; failed attempts; and untested scope. Every number links to `raw/cases.csv`, `raw/summary.csv`, or a named log. State explicitly that `solver_s_max` is metadata and the result is a batched z-line core demo, not full CFD/FFT/GMG/ADI/PPE.

- [ ] **Step 3: Synchronize the reusable method and decision**

Append the receipt and gate result to ADR-007 while keeping the AI-created page `draft`. Add the stable runner, 32-case matrix, thresholds, and expected markers to `test-matrix.md`. Add a change-impact row that changes to the equation, ghost closure, CSV schema, slot set, or decomposition reopen TASK-010.

- [ ] **Step 4: Apply the task status gate**

Only if every completion condition passes, set TASK-010 to `done`; replace the blocker with a dated `done（已解除快照）` containing original gap, approval/design commit `394f626`, implementation SHA, receipt, extrema, scope limits, and reopen conditions; then update the active brief and claim-evidence matrix with the narrow application claim.

If anything is missing, keep `in-progress`, `review`, or `blocked` and record the exact gap, category, responsibility, required evidence, minimum action, and current check date.

- [ ] **Step 5: Run all local verification**

From `CUDA_coding/CUDA_code/源代码`:

```powershell
node verify/task010_manufactured_audit_test.js
node verify/task010_source_contract_test.js
node verify/task010_manufactured_audit.js --input "../../knowledge/outputs/validation/TASK-010-20260825-paraai-a100/raw/cases.csv" --summary "$env:TEMP/task010-summary.csv"
node verify/penta_indep_check.js
node verify/penta_comm_28_verify.js
node verify/penta_comm_22_verify.js
node verify/penta_index_bounds_verify.js
node verify/hepta_indep_check.js
node verify/mband_general.js
node verify/mband_recurrence.js
```

Expected: every command exits 0 with its PASS marker.

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\CUDA_coding\scripts\check_knowledge.ps1" -ProjectRoot ".\CUDA_coding"
```

Expected: `Knowledge lint: PASS` and zero errors. Pre-existing warnings may remain only when named in the handoff.

- [ ] **Step 6: Review final scope and provenance**

```powershell
git diff --check
git status --short
git diff --stat
git diff -- "CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90" "CUDA_coding/CUDA_code/源代码/perf_bench"
```

Expected: no whitespace error, empty solver/perf diff, and no unrelated staged file.

- [ ] **Step 7: Commit only TASK-010 evidence and closure**

Stage the TASK-010 receipt and explicitly listed knowledge files, then:

```powershell
git commit -m "docs: close TASK-010 manufactured PDE validation"
```

Do not push or publish. Handoff must report result, changed files, validations, uncovered scope, one copyable human recheck command with expected output/failure evidence, and the unique next task with dependency and model/reasoning.
