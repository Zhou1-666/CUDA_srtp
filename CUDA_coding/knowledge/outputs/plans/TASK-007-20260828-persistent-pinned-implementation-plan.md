# TASK-007 Persistent Pinned Host Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and independently validate a `ptdma_plan_cuda`-owned persistent pinned host-staging path, then adopt it only if both steady-state plain timing and complete lifecycle A/B gates pass.

**Architecture:** A host-mode plan owns one reusable send array and one reusable receive array sized for the maximum of the forward and backward exchanges. Plan creation freezes MPI backend and capacities, solver calls reuse the arrays, and plan cleanup releases them; the CUDA-aware path owns no host staging. Existing public procedure argument lists, numerical kernels, 28/22 layouts, and the `1e-10` correctness threshold remain unchanged.

**Tech Stack:** CUDA Fortran with NVHPC, MPI/Open MPI or HPC-X, CUDA runtime pinned allocation, Node.js `node:test`, PowerShell knowledge checks, Bash runners, Slurm, Compute Sanitizer.

**Spec:** `CUDA_coding/knowledge/outputs/plans/TASK-007-20260828-persistent-pinned-design.md`

## Global Constraints

- Work only on TASK-007; do not start TASK-024, TASK-021, TASK-026–031, or a duplicate persistent-staging task.
- Preserve the dirty main tree and all existing worktrees; do not reset, repair, prune, clean, overwrite evidence, or reuse TASK-025's rejected candidate as the implementation base.
- Freeze the accepted tracked baseline from `.worktrees/task023-direct-diagnostics`: solver SHA-256 `4e12f11e586125975d19ce2214f33b342e50a776667f93ee2c96a84a9dfe79ee`, benchmark SHA-256 `716b4e4decdd0416ccac4cb98184b00316075451316193645fe9ecc3c9d9b5d8`, README SHA-256 `3bd5dd74a7e766c894b606284565826162cfb35cc1d8fd7a9639079969b4c9b8`.
- Do not modify solver mathematics, pack/unpack mappings, public procedure argument lists, pivot protection, 28/22 support, FP64, or the `1e-10` numerical threshold.
- One active solver call per plan; concurrent solves require distinct plans.
- Pinned allocation is fail-closed: an allocation error or pageable fallback invalidates the run and may not be counted as persistent pinned.
- `pascal_cuda_aware_mpi` is frozen at plan creation; changing it while a plan is active is an explicit error requiring clean and recreate.
- Use TDD: observe each targeted test fail for the intended missing behavior before production changes, then implement the smallest change and observe it pass.
- Do not automatically commit, merge, push, submit Slurm jobs, or publish. At every checkpoint record status, diff, and SHA instead of committing.
- The user performs SSH operations. When execution reaches a remote step, provide exactly one copyable command per turn, including execution location, purpose, expected output, and failure artifacts to preserve.
- GPU work begins only after local/static tests, package integrity, and login-node NVHPC preflight pass; do not cancel or duplicate an existing job.

---

## File Structure

**Modify**

- `CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90` — plan ownership, capacity/backend validation, create/clean lifecycle, and plan-backed host exchanges.
- `CUDA_coding/CUDA_code/源代码/verify/penta_capacity_model.js` — persistent send/receive host footprint and capacity invariants.
- `CUDA_coding/CUDA_code/源代码/examples/test_penta_lifecycle.f90` — active-plan staging and clean-state assertions.
- `CUDA_coding/CUDA_code/源代码/examples/test_penta_api_validation.f90` — backend-change rejection and host-plan metadata cases.
- `CUDA_coding/CUDA_code/源代码/verify/run_penta_api_validation.sh` — expected result classification for the new API cases.
- `CUDA_coding/CUDA_code/源代码/verify/run_task_016_lifecycle.sh` — TASK-007 host-mode lifecycle assertions while retaining 28/22 × 100-cycle and sanitizer behavior.
- `CUDA_coding/CUDA_code/源代码/perf_bench/benchmark_penta.f90` — rank-local create/solver-sum/clean lifecycle sidecar without changing the existing diagnostic CSV schema.
- `CUDA_coding/CUDA_code/源代码/README.md` — plan lifetime, backend freeze, concurrency, and pinned failure contract.

**Create**

- `CUDA_coding/CUDA_code/源代码/verify/task007_persistent_pinned_contract_test.js` — source-level TDD contract.
- `CUDA_coding/CUDA_code/源代码/verify/task007_pinned_component_probe.f90` — isolated NVHPC syntax/runtime allocation probe for a pinned allocatable derived-type component.
- `CUDA_coding/CUDA_code/源代码/verify/task007_capacity_test.js` — independent capacity oracle for forward/backward send/receive maxima.
- `CUDA_coding/CUDA_code/源代码/verify/task007_lifecycle_csv_test.js` — sidecar schema, rank-pairing, finite-value, and total-consistency tests.
- `CUDA_coding/CUDA_code/源代码/verify/task007_launch_plan.js` and `task007_launch_plan_test.js` — immutable smoke/formal launch matrices.
- `CUDA_coding/CUDA_code/源代码/verify/task007_pair_extract.js` and `task007_pair_extract_test.js` — combine diagnostic CSV audits and lifecycle sidecars into paired evidence.
- `CUDA_coding/CUDA_code/源代码/verify/task007_ab_audit.js` and `task007_ab_audit_test.js` — apply correctness, pinned, steady-state, and lifecycle adoption gates.
- `CUDA_coding/CUDA_code/源代码/verify/run_task_007_persistent_ab.sh` and `task007_runner_stdin_test.js` — non-scheduler build/run/audit driver and stdin regression.
- `CUDA_coding/CUDA_code/源代码/verify/task007_rank_mapping.sh` — one-rank-per-GPU mapping receipt.
- `CUDA_coding/CUDA_code/源代码/verify/task007_smoke.slurm` and `task007_formal.slurm` — manually submitted, non-nesting Slurm wrappers.
- `CUDA_coding/knowledge/outputs/validation/TASK-007-20260828-persistent-pinned/README.md` — append-only execution/evidence ledger created when implementation begins.

---

### Task 1: Create the isolated worktree and freeze the accepted baseline

**Files:**
- Create worktree: `.worktrees/task007-persistent-pinned`
- Create branch: `codex/task007-persistent-pinned`
- Populate accepted tracked baseline: `CUDA_coding/CUDA_code/源代码/{src/PaScaL_TDMA_cuda_penta.f90,perf_bench/benchmark_penta.f90,README.md}`

**Interfaces:**
- Consumes: repository commit `91ecc661e0cd856c61bdc5b69f5aa065faadf078` plus the three accepted dirty tracked files from `.worktrees/task023-direct-diagnostics`.
- Produces: an isolated TASK-007 tree whose three baseline hashes exactly match the Global Constraints.

- [ ] **Step 1: Inspect worktree safety using `superpowers:using-git-worktrees`**

Run from `D:\CUDA\CUDA_repository_recovery`:

```powershell
git check-ignore -q .worktrees
git worktree list --porcelain
git status --short --branch
```

Expected: `.worktrees` is ignored; existing TASK-010/023/025 paths remain registered; main dirty state is recorded without modification.

- [ ] **Step 2: Create the worktree without touching existing worktrees**

Run:

```powershell
git worktree add '.worktrees/task007-persistent-pinned' -b 'codex/task007-persistent-pinned' 91ecc661e0cd856c61bdc5b69f5aa065faadf078
```

Expected: one new registered worktree on the requested branch. If the branch or path already exists, stop and inspect it; do not delete or overwrite it.

- [ ] **Step 3: Copy only the three accepted tracked baseline files**

Copy the solver, benchmark, and README from `.worktrees/task023-direct-diagnostics` into the same paths in the new worktree. Do not copy TASK-023/TASK-025 untracked runners or evidence.

- [ ] **Step 4: Verify exact baseline hashes**

Run in the new worktree:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath 'CUDA_coding\CUDA_code\源代码\src\PaScaL_TDMA_cuda_penta.f90','CUDA_coding\CUDA_code\源代码\perf_bench\benchmark_penta.f90','CUDA_coding\CUDA_code\源代码\README.md' | Format-Table -AutoSize
```

Expected: the three full hashes equal `4e12f11e…79ee`, `716b4e4d…b5d8`, and `3bd5dd74…c9b8`. A mismatch is a stop condition.

- [ ] **Step 5: Record the no-commit checkpoint**

Save branch, HEAD, `git status --short`, the three hashes, and `git diff --check` in the new validation README. Do not commit.

---

### Task 2: Add the RED contract for plan ownership, allocation, and cleanup

**Files:**
- Create: `CUDA_coding/CUDA_code/源代码/verify/task007_persistent_pinned_contract_test.js`
- Modify: `CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90:43-114,286-309,320-529,536-591`

**Interfaces:**
- Consumes: `ptdma_plan_cuda`, `pascal_plan_create`, `pascal_validate_solver`, and `pascal_plan_clean`.
- Produces: plan fields `host_send`, `host_recv`, `host_send_capacity`, `host_recv_capacity`, `host_staging_ready`, and `cuda_aware_mpi_at_create` with deterministic create/clean semantics.

- [ ] **Step 1: Write the first failing Node test**

Use `node:test` and extract exact type/subroutine blocks. The first test must assert these source contracts:

```js
test('host plans own two persistent pinned buffers from create through clean', () => {
  assert.match(planType, /real\s*\(\s*8\s*\)\s*,\s*allocatable\s*,\s*pinned\s*::\s*host_send\s*\(\s*:\s*\)\s*,\s*host_recv\s*\(\s*:\s*\)/i);
  assert.match(planType, /integer\s*::\s*host_send_capacity\s*=\s*0\s*,\s*host_recv_capacity\s*=\s*0/i);
  assert.match(planType, /logical\s*::\s*host_staging_ready\s*=\s*\.false\./i);
  assert.match(planType, /logical\s*::\s*cuda_aware_mpi_at_create\s*=\s*\.false\./i);
  assert.match(createBlock, /allocate\s*\(\s*plan%host_send[\s\S]*?pinned\s*=\s*send_is_pinned/i);
  assert.match(createBlock, /allocate\s*\(\s*plan%host_recv[\s\S]*?pinned\s*=\s*recv_is_pinned/i);
  assert.match(cleanBlock, /allocated\s*\(\s*plan%host_send\s*\)[\s\S]*?deallocate\s*\(\s*plan%host_send\s*\)/i);
  assert.match(cleanBlock, /allocated\s*\(\s*plan%host_recv\s*\)[\s\S]*?deallocate\s*\(\s*plan%host_recv\s*\)/i);
});
```

Also assert that both pinned flags are checked before `plan%is_created=.true.` and that clean resets capacities, ready state, and backend snapshot.

- [ ] **Step 2: Run the test and observe RED**

Run from the source root:

```powershell
node --test verify/task007_persistent_pinned_contract_test.js
```

Expected: FAIL at the first missing plan-owned pinned field. A syntax error or missing source file is not the intended RED.

- [ ] **Step 3: Add the minimal plan fields and 64-bit capacities**

Add to `ptdma_plan_cuda`:

```fortran
logical :: cuda_aware_mpi_at_create = .false.
logical :: host_staging_ready = .false.
integer :: host_send_capacity = 0, host_recv_capacity = 0
real(8), allocatable, pinned :: host_send(:), host_recv(:)
```

In `pascal_plan_create`, accumulate four extents in `integer(int64)` without default-integer `sum`:

```fortran
forward_send64 = forward_send64 + int(plan%BIGbufsubsize_A(i),int64)
forward_recv64 = forward_recv64 + int(plan%BIGbufsubsize_B(i),int64)
backward_send64 = backward_send64 + int(plan%bufsubsize_sol_B(i),int64)
backward_recv64 = backward_recv64 + int(plan%bufsubsize_sol_A(i),int64)
host_send64 = max(forward_send64,backward_send64)
host_recv64 = max(forward_recv64,backward_recv64)
```

Call `pascal_require_default_int_extent` for both maxima, convert only after checks, and snapshot `pascal_cuda_aware_mpi`.

- [ ] **Step 4: Allocate host-mode buffers and reject fallback**

For host mode only, initialize flags false, allocate with zero lower bounds, check `stat` and `pinned=` separately, and set ready only after both succeed:

```fortran
send_is_pinned=.false.
recv_is_pinned=.false.
allocate(plan%host_send(0:plan%host_send_capacity-1),stat=alloc_status,pinned=send_is_pinned)
call pascal_check_allocation(alloc_status,commworld,'plan%host_send')
if(.not.send_is_pinned) then
    if(allocated(plan%host_send)) deallocate(plan%host_send)
    call pascal_fail('pinned allocation fallback at plan%host_send',commworld,1)
endif
allocate(plan%host_recv(0:plan%host_recv_capacity-1),stat=alloc_status,pinned=recv_is_pinned)
if(alloc_status/=0 .or. .not.recv_is_pinned) then
    if(allocated(plan%host_recv)) deallocate(plan%host_recv)
    if(allocated(plan%host_send)) deallocate(plan%host_send)
    if(alloc_status/=0) call pascal_check_allocation(alloc_status,commworld,'plan%host_recv')
    call pascal_fail('pinned allocation fallback at plan%host_recv',commworld,1)
endif
plan%host_staging_ready=.true.
```

Keep `plan%is_created=.true.` as the final create action.

- [ ] **Step 5: Extend clean and validation**

Deallocate the two buffers using declarations that retain the pinned attribute. Reset the new fields. In `pascal_validate_solver`, reject a backend mismatch and reject missing/undersized host staging:

```fortran
if(plan%cuda_aware_mpi_at_create .neqv. pascal_cuda_aware_mpi) &
    call pascal_fail('pascal_cuda_aware_mpi changed after plan create',plan%ptdma_world,1)
if(.not.plan%cuda_aware_mpi_at_create) then
    if(.not.plan%host_staging_ready .or. .not.allocated(plan%host_send) .or. &
       .not.allocated(plan%host_recv)) &
        call pascal_fail('host staging is not ready',plan%ptdma_world,1)
    if(size(plan%host_send)<plan%host_send_capacity .or. &
       size(plan%host_recv)<plan%host_recv_capacity) &
        call pascal_fail('host staging capacity mismatch',plan%ptdma_world,1)
endif
```

- [ ] **Step 6: Run GREEN and static checks**

Run:

```powershell
node --test verify/task007_persistent_pinned_contract_test.js
node verify/penta_index_bounds_verify.js
git diff --check
```

Expected: contract PASS, index script PASS, diff check exit 0. This does not prove NVHPC support.

- [ ] **Step 7: Record the no-commit checkpoint**

Append the observed RED message, GREEN output, solver SHA, and scoped diff to the validation README. Do not commit.

---

### Task 3: Prove NVHPC component support before expanding the implementation

**Files:**
- Create: `CUDA_coding/CUDA_code/源代码/verify/task007_pinned_component_probe.f90`
- Test: full candidate module build in a clean target directory

**Interfaces:**
- Consumes: NVHPC CUDA Fortran `pinned` allocatable component and `allocate(...,pinned=logical)`.
- Produces: a compiler/version-bound feasibility receipt; failure stops the implementation for redesign.

- [x] **Step 1: Write the isolated compiler probe**

```fortran
program task007_pinned_component_probe
    use cudafor
    implicit none
    type :: owner
        real(8), allocatable, pinned :: buffer(:)
    end type owner
    type(owner) :: value
    integer :: stat
    logical :: is_pinned
    is_pinned=.false.
    allocate(value%buffer(0:31),stat=stat,pinned=is_pinned)
    if(stat/=0 .or. .not.is_pinned) error stop 2
    value%buffer=1.0d0
    deallocate(value%buffer,stat=stat)
    if(stat/=0) error stop 3
    print '(A)', 'TASK007_PINNED_COMPONENT_PROBE_PASS'
end program task007_pinned_component_probe
```

- [x] **Step 2: Run a compiler diagnostic negative control**

First compile a temporary control copy with the `pinned` attribute removed from the component while retaining `pinned=is_pinned` in `allocate`. For the frozen NVFortran 24.5-1 toolchain, the observed version-bound negative signal is `NVFORTRAN-W-0155-PINNED specifier used with object that is not PINNED`; the compiler returns zero and may produce an object. Preserve the exact diagnostic, then restore the real probe. Do not edit the candidate solver, promote warnings to errors, or claim that the compiler rejected the source. A missing `W-0155`, or a nonzero exit caused by CUDA toolkit selection, missing driver/toolchain, wrapper setup, source lookup, permissions, or another pre-source failure, invalidates the control and stops for diagnosis.

- [x] **Step 3: Compile the real probe and full module in clean directories**

Use the target `mpifort`/NVHPC with the same `-cuda` and GPU flags planned for the solver. On the driverless ParaAI login node, explicitly select the installed toolkit with `-gpu=cc80,cuda12.4`. Expected: both probe and candidate module compile with exit 0; the real probe must not emit `W-0155`. Record compiler version, flags, stdout/stderr, and object timestamps.

- [ ] **Step 4: Run the probe on an authorized compute GPU**

Expected: exit 0 and exactly `TASK007_PINNED_COMPONENT_PROBE_PASS`. A pageable fallback exits 2 and is preserved as FAIL.

- [ ] **Step 5: Stop on unsupported syntax or runtime fallback**

If either compile or runtime allocation fails, keep TASK-007 `in-progress/review`, update the blocker with the exact diagnostic, and return to design review. Do not replace the component with `cudaHostAlloc`, raw `c_ptr`, a module global, or a pool without new approval.

---

### Task 4: Reuse plan staging in ordinary and profiled exchanges

**Files:**
- Modify: `CUDA_coding/CUDA_code/源代码/verify/task007_persistent_pinned_contract_test.js`
- Modify: `CUDA_coding/CUDA_code/源代码/src/PaScaL_TDMA_cuda_penta.f90:620-745,792-916,1557-1657`

**Interfaces:**
- Consumes: allocated `plan%host_send(0:)`, `plan%host_recv(0:)`, and frozen backend from Task 2.
- Produces: one explicitly private `pascal_a2av_with_staging` helper used only by internal host-plan paths; the existing `pascal_a2av` and `pascal_a2av_profiled` signatures and behavior remain unchanged.

- [x] **Step 1: Add a second failing contract test**

Freeze the two legacy helper signatures byte-for-byte in the fixture. Assert that the new helper is explicitly private, accepts both plan-owned host arrays, both solver host paths call it, and its body contains no `allocate`/`deallocate`:

```js
test('private host helper reuses plan staging without changing legacy signatures', () => {
  assert.equal(signature(a2av), frozenA2avSignature);
  assert.equal(signature(profiledA2av), frozenProfiledA2avSignature);
  assert.match(moduleDeclarations, /private\s*::\s*pascal_a2av_with_staging/i);
  assert.match(stagingHelper, /host_send\s*\(\s*0\s*:\s*\)[\s\S]*host_recv\s*\(\s*0\s*:\s*\)/i);
  assert.match(solverHostBranch, /call\s+pascal_a2av_with_staging\([\s\S]*plan%host_send\s*,\s*plan%host_recv\s*\)/i);
  assert.match(profiledSolverHostBranch, /call\s+pascal_a2av_with_staging\([\s\S]*plan%host_send\s*,\s*plan%host_recv\s*,\s*exchange\s*\)/i);
  assert.doesNotMatch(stagingHelper, /\b(?:allocate|deallocate)\s*\(/i);
});
```

- [x] **Step 2: Run and observe RED**

Expected: FAIL because the private staging helper does not exist and solvers do not pass plan buffers.

- [x] **Step 3: Add a private plan-staging helper without changing legacy interfaces**

Declare the new helper explicitly before `contains`:

```fortran
private :: pascal_a2av_with_staging
```

Implement this separate internal interface:

```fortran
subroutine pascal_a2av_with_staging(A,Asize,sendcount,senddisp, &
    B,Bsize,recvcount,recvdisp,nprocs,communicator,host_send,host_recv,exchange)
real(8), intent(inout) :: host_send(0:),host_recv(0:)
type(ptdma_exchange_timing_cuda), optional, intent(out) :: exchange
```

The helper always executes the host-staging path and never allocates or frees storage. It rejects undersized arrays, synchronizes the device, copies `A(0:Asize-1)` to `host_send(0:Asize-1)`, performs blocking `MPI_ALLTOALLV`, and copies `host_recv(0:Bsize-1)` to `B(0:Bsize-1)`. If `exchange` is present, record only sync/D2H/MPI/H2D and leave allocate/free at zero. Leave both legacy helper definitions untouched so existing external calls retain their original interfaces and behavior.

- [x] **Step 4: Route both solvers through plan buffers**

After `pascal_validate_solver`, use the frozen backend. CUDA-aware device mode continues to call the existing `pascal_a2av` or `pascal_a2av_profiled` with their original argument lists. Host mode calls `pascal_a2av_with_staging`, passing the same plan-owned send/receive arrays for both forward and backward exchanges. The profiled host path also passes an exchange-timing result. Do not duplicate four plan buffers; the two exchanges are sequential.

- [x] **Step 5: Preserve profiled meanings**

For `pascal_a2av_with_staging`, leave `exchange%allocate` and `exchange%free` at zero and time only synchronization/D2H/MPI/H2D. The unchanged legacy profiled helper retains its existing pageable allocation/free measurements.

- [x] **Step 6: Run GREEN and old-parser compatibility tests**

Run the contract test plus TASK-023 diagnostic audit tests and TASK-025 pinned contract against its frozen rejected source copy, not against the new candidate. Expected: new contract PASS; frozen historical tests remain unchanged; no existing diagnostic CSV column changes.

- [x] **Step 7: Record the no-commit checkpoint**

Record source SHA, exact helper signatures, RED/GREEN logs, and `git diff --check`. Do not commit.

---

### Task 5: Add independent capacity and lifecycle/API validation

**Files:**
- Create: `CUDA_coding/CUDA_code/源代码/verify/task007_capacity_test.js`
- Create: `CUDA_coding/CUDA_code/源代码/verify/task007_lifecycle_api_contract_test.js`
- Modify: `CUDA_coding/CUDA_code/源代码/verify/penta_capacity_model.js`
- Modify: `CUDA_coding/CUDA_code/源代码/examples/test_penta_lifecycle.f90`
- Modify: `CUDA_coding/CUDA_code/源代码/examples/test_penta_api_validation.f90`
- Modify: `CUDA_coding/CUDA_code/源代码/verify/run_penta_api_validation.sh`
- Modify: `CUDA_coding/CUDA_code/源代码/verify/run_task_016_lifecycle.sh`

**Interfaces:**
- Consumes: capacity formulas and plan fields from Task 2.
- Produces: independent byte/count oracle, active host-plan assertions, clean-state assertions, backend-change rejection, 28/22 × 100-cycle and sanitizer coverage.

- [x] **Step 1: Write independent capacity and lifecycle/API RED tests**

The test must compute, without importing the production model:

```js
const send = max(forwardSlots * nsys, 4n * ranks * tmpN);
const recv = max(forwardSlots * ranks * tmpN, 4n * nsys);
const persistentPinnedBytes = (send + recv) * 8n;
```

Cover P=1/2/3, 22/28 slots, balanced and uneven `Nsys`, zero/overflow rejection, and the exact P=1 `64×64` values: 28-slot bytes `56*4096*8`, 22-slot bytes `44*4096*8`, difference `393216` bytes.

The separately approved lifecycle/API source contract freezes the active/clean plan assertions and the two API/runner cases before those production validation paths change. Observed result: `5` tests, `1` pass and `4` intended feature-missing failures; see [Task 5 RED receipt](../validation/TASK-007-20260829-capacity-lifecycle-api-red/README.md).

- [x] **Step 2: Observe RED, then extend the production capacity model**

Add `hostSendStage`, `hostRecvStage`, `hostPersistentPinnedStage`, and `hostPersistentWithPinned` to `footprint()`. Keep the historical per-call `hostStagePeak` output for comparison; do not relabel it as persistent.

- [x] **Step 3: Add host-plan lifecycle assertions**

After create, require host mode to satisfy:

```fortran
allocated(plan%host_send) .and. allocated(plan%host_recv)
plan%host_staging_ready
plan%host_send_capacity>=max(sum(plan%BIGbufsubsize_A),sum(plan%bufsubsize_sol_B))
plan%host_recv_capacity>=max(sum(plan%BIGbufsubsize_B),sum(plan%bufsubsize_sol_A))
```

Extend `plan_is_clean` to require both buffers unallocated, capacities zero, ready false, and backend snapshot false.

- [x] **Step 4: Add API cases**

Add `valid_host_staging` as a success case that checks both arrays and capacities. Add `backend_change_after_create` as an expected failure: create in host mode, set `pascal_cuda_aware_mpi=.true.`, then call solver and require the explicit backend-change diagnostic. Reset the module variable in success paths before finalization.

- [x] **Step 5: Run local Node GREEN**

Run independent capacity tests, `penta_capacity_model.js --self-test`, all eight mathematical scripts through `check_all.ps1`, and the source contract. Expected: zero failures. This still does not replace NVHPC execution.

Local GREEN completed on 2026-08-30: Task 5 `6/6`, unchanged Task 4 `9/9`, wrapper `3/3`, eight mathematical scripts and six capacity self-tests passed. The lifecycle runner was left byte-unchanged because it already expresses all six required target cases. See [Task 5 local GREEN receipt](../validation/TASK-007-20260830-capacity-lifecycle-api-green/README.md).

- [ ] **Step 6: Run target lifecycle gates**

On the authorized target, clean-build the updated lifecycle executable and run host mode for 28/22 at 100 cycles, then memcheck/initcheck for both slots and both ranks. Expected: six cases, 0 failures, at least two `ERROR SUMMARY: 0 errors` per sanitizer case, maximum numerical error `<=1e-10`, and active/clean staging assertions on every cycle.

Local target-input checkpoint (2026-08-30): wrapper TDD is 4/4 GREEN and accepted v2 package `TASK-007-20260830-task5-target-gates-v2.tar.gz` is 43730 bytes with SHA-256 `141b19f62b3e1f4b5e3f1b1ed682d7cb3a2cf7a434563ffd9dc44267df3bfb47`; 23 safe archive paths, 17/17 manifest payloads and staged/round-trip 19/19 tests passed. Rejected v1 is preserved and must not be uploaded. See [target-gate freeze receipt](../validation/TASK-007-20260830-task5-target-gates/README.md). This checkbox remains open until the target API 20/20 and lifecycle 6/6 evidence is recovered.

- [ ] **Step 7: Record the no-commit checkpoint**

Save all target environment, mapping, build flags, per-rank logs, candidate SHA, and sanitizer summaries. Do not commit.

---

### Task 6: Add a separate complete-lifecycle timing sidecar

**Files:**
- Modify: `CUDA_coding/CUDA_code/源代码/perf_bench/benchmark_penta.f90:37-78,183-185,190-305,321-323,357-468`
- Create: `CUDA_coding/CUDA_code/源代码/verify/task007_lifecycle_csv_test.js`

**Interfaces:**
- Consumes: existing `PENTA_DIAGNOSTIC_DIR`, `PENTA_DIAGNOSTIC_RUN_ID`, rank, mode, iteration count, and `t_exp%total`.
- Produces: one exclusive `lifecycle-rank-<rank>.csv` beside each existing `rank-<rank>.csv`, leaving the existing 37-column diagnostic schema byte-compatible.

- [ ] **Step 1: Write lifecycle CSV parser tests before benchmark changes**

Freeze this one-row schema:

```text
schema,run_id,mode,mpi_mode,forward_slots,nranks,rank,iterations,create_s,solver_sum_s,clean_s,lifecycle_s
```

Tests must accept finite nonnegative create/clean, positive solver sum, and `abs(lifecycle_s-(create_s+solver_sum_s+clean_s)) <= max(1e-12,1e-9*lifecycle_s)`. Reject duplicate ranks, mismatched run metadata, missing rank, nonfinite/negative fields, and a mismatched total.

- [ ] **Step 2: Observe RED because no lifecycle sidecar exists**

Run the test fixture against a directory containing only ordinary diagnostic rank CSVs. Expected: explicit `missing lifecycle sidecar` failure.

- [ ] **Step 3: Instrument rank-local create, solve sum, and clean**

Barrier before create, record local create duration, accumulate each already-synchronized solver duration into `solver_sum_s`, time clean before arrays/MPI finalization, and compute:

```fortran
lifecycle_s = plan_create_s + solver_sum_s + plan_clean_s
```

Do not include input generation, CPU correctness scans, reference solver, MPI initialization, file I/O, or process startup in this metric.

- [ ] **Step 4: Write the exclusive sidecar after clean**

Use `status='new'`, the existing safe `run_id`, and rank-specific filename. Flush and close with collective error checks. Write local values; the later auditor computes per-rank lifecycle sums first, then takes the rank maximum. Never add independent rank maxima of create/solve/clean.

- [ ] **Step 5: Run GREEN and compatibility checks**

Run lifecycle CSV tests and all 68 TASK-023 diagnostic audit tests. Expected: lifecycle parser PASS and the existing 37-column parser PASS unchanged.

- [ ] **Step 6: Record the no-commit checkpoint**

Record benchmark SHA and tests. Explicitly state that sidecar support is not yet performance evidence.

---

### Task 7: Build the launch, pairing, and adoption auditors with TDD

**Files:**
- Create: `verify/task007_launch_plan.js`, `verify/task007_launch_plan_test.js`
- Create: `verify/task007_pair_extract.js`, `verify/task007_pair_extract_test.js`
- Create: `verify/task007_ab_audit.js`, `verify/task007_ab_audit_test.js`

**Interfaces:**
- Consumes: TASK-023 diagnostic audit JSON, TASK-007 lifecycle sidecars, launch plan, exit codes, baseline/candidate SHA, and fail-closed candidate identity.
- Produces: `pairs.json` with ten measured pairs and `decision.json` with `adopt-candidate` or `do-not-adopt`.

- [ ] **Step 1: Freeze launch-plan tests**

Smoke contains exactly 12 launches: P1/22, P2/22, P2/28 × pageable/persistent × plain/profiled, each `16×8×128`, 2 iterations. Formal contains 56 launches: slots 22/28 × two warmups plus five measured repetitions × pageable/persistent × plain/profiled, P2 `256×256×1024`, 10 iterations. Alternate A/B ordering by repetition and reject unknown protocols.

- [ ] **Step 2: Observe launch-plan RED, implement, then GREEN**

Expected GREEN counts: smoke 12, formal 56 with 16 warmup and 40 measured, unique launch IDs, matched run IDs, and no unknown variant/mode.

- [ ] **Step 3: Write pair-extractor RED tests**

Each measured pair must contain:

```js
{
  slots, launch,
  pageable_stable8_s, persistent_stable8_s,
  pageable_lifecycle_s, persistent_lifecycle_s,
  pageable_err_max, persistent_err_max,
  persistent_pinned: true
}
```

Derive steady values from iterations 2–9 of plain rank-MAX rows. Derive lifecycle values by computing each rank's create+solver-sum+clean and then taking the rank maximum. Set `persistent_pinned:true` only when the compiled candidate SHA matches the frozen fail-closed source, all corresponding exits are zero, and no fallback diagnostic occurred.

- [ ] **Step 4: Implement pair extraction and reject bad evidence**

Reject missing/duplicate runs, rank mapping mismatch, nonfinite values, schema mismatch, fewer/more than ten pairs, pageable/persistent configuration mismatch, nonzero exits, or errors above `1e-10`.

- [ ] **Step 5: Write adoption-audit RED tests**

Implement these exact gates:

```js
const stable22 = changes(pairs22, 'persistent_stable8_s', 'pageable_stable8_s');
const life22 = changes(pairs22, 'persistent_lifecycle_s', 'pageable_lifecycle_s');
const stable28 = changes(pairs28, 'persistent_stable8_s', 'pageable_stable8_s');
const life28 = changes(pairs28, 'persistent_lifecycle_s', 'pageable_lifecycle_s');

if (countFaster(stable22) < 4) fail('slots22_faster_pairs');
if (median(stable22) > -5) fail('slots22_median_improvement');
if (median(stable28) > 3) fail('slots28_median_regression');
if (median(life22) >= 0) fail('slots22_lifecycle_positive_gain');
if (median(life28) > 3) fail('slots28_lifecycle_regression');
```

Correct but sub-threshold evidence returns `do-not-adopt`; malformed or inaccurate evidence exits nonzero.

- [ ] **Step 6: Run all auditor tests GREEN**

Require tests for an adopting sample, pinned fallback rejection, steady-state failure, lifecycle reversal, 28-slot guard failure, incomplete/duplicate/nonfinite evidence, and error-threshold failure.

- [ ] **Step 7: Record the no-commit checkpoint**

Save test counts/output and script SHAs. Do not commit.

---

### Task 8: Build the non-scheduler runner and immutable wrappers

**Files:**
- Create: `verify/run_task_007_persistent_ab.sh`
- Create: `verify/task007_runner_stdin_test.js`
- Create: `verify/task007_rank_mapping.sh`
- Create: `verify/task007_smoke.slurm`
- Create: `verify/task007_formal.slurm`

**Interfaces:**
- Consumes: frozen baseline solver, candidate solver, shared benchmark, launch plan, diagnostic/lifecycle/pair/decision auditors.
- Produces: append-only run directories containing builds, mapping, environment, launch/exit matrices, rank CSVs, lifecycle CSVs, audits, pairs, decision, and SHA manifests.

- [ ] **Step 1: Write runner behavior tests first**

Use a fake MPI launcher that consumes stdin unless redirected. Expected RED: an unprotected loop runs only the first launch. The real runner must place `</dev/null` on every MPI launch and complete all 12 smoke rows in the test fixture.

- [ ] **Step 2: Implement fail-safe output ownership**

Require an existing single-node Slurm allocation, reject an existing output directory, build baseline/candidate in separate new directories, and install an EXIT trap that writes `TASK007_RC=<code>` without deleting evidence. Never invoke `sbatch` inside the runner.

- [ ] **Step 3: Freeze build and identity checks**

Before launches, verify baseline solver SHA equals `4e12…79ee`, candidate source contract passes, compiler probe has passed on the target version, and both clean builds use identical benchmark/flags. Save source, benchmark, runner, auditor, and wrapper SHAs.

- [ ] **Step 4: Run the launch matrix and audits**

Set host mode/TCP, manufactured case, slots, diagnostic mode/directory/run ID, and variant for each launch. Preserve stdout/stderr and exit code. After all exits are zero, run diagnostic audits, lifecycle parser, pair extractor, and decision audit.

- [ ] **Step 5: Implement one-rank-per-GPU mapping**

The mapping script must record global/local rank, hostname, CUDA visible list, GPU UUID, and inventory; P2 requires two distinct A100 UUIDs. A duplicate UUID or missing mapping stops the run.

- [ ] **Step 6: Write immutable Slurm wrappers**

Smoke requests one node/two A100 GPUs/20 minutes and runs only the 12-launch smoke. Formal requests one node/two A100 GPUs/two hours and runs only the 56-launch formal matrix. Both accept a package root argument, perform no nested submissions, refuse an existing output directory, and emit wrapper/run status plus SHA manifests.

- [ ] **Step 7: Run local non-GPU preflight**

Run all Node tests, source contract, eight mathematics scripts, capacity model, Bash `-n` for four scripts, line-length check, `git diff --check`, and knowledge lint. Expected: zero failures/warnings/errors attributable to TASK-007.

- [ ] **Step 8: Freeze a smoke package without submitting it**

Create a new package name, LF-only manifest, safe single-root tar paths, baseline/candidate/shared files, and exact SHA/byte/path/file counts. Extract into a new temporary directory, re-run manifest/tests, then remove only the verified temporary directory. Do not submit GPU work.

---

### Task 9: Execute target build, correctness, lifecycle, cross-node, and integration gates

**Files:**
- Append: `CUDA_coding/knowledge/outputs/validation/TASK-007-20260828-persistent-pinned/README.md`
- Preserve remote run/package directories under `/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-007/`

**Interfaces:**
- Consumes: immutable smoke package and candidate SHA from Task 8.
- Produces: source-change SOP L2/L3/L4/L6/L7 and TASK-010 integration evidence, or an explicit failure/blocker snapshot.

- [ ] **Step 1: Upload and verify one immutable smoke package**

The user uploads through the working client. Provide one command to verify remote bytes/SHA, then one later command for safe path/type extraction and manifest/test preflight. Preserve connection failures and partial-state checks; never overwrite a stage/package.

- [ ] **Step 2: Run NVHPC debug and release clean builds**

Build library, example, API/lifecycle tests, and benchmark in separate debug/release directories. Record actual compiler/MPI/CUDA versions and flags. Expected: zero compile/link errors and no reuse of old objects.

- [ ] **Step 3: Run L3 and L4 correctness**

Cover P=1 and single-node P=2 with 28/22, plain/profiled, host mode, manufactured/exact/edge cases, uniform and uneven partitions, unique GPU binding, and all API success/failure cases. Errors remain `<=1e-10`; all expected-success launches exit 0 and all expected-rejection diagnostics match.

- [ ] **Step 4: Run L6 lifecycle and sanitizers**

Execute 28/22 × 100 create–solve–clean cycles and memcheck/initcheck on both ranks. Preserve per-rank sanitizer summaries. Any fallback, leak, invalid access, initialization error, stale allocation, or missing clean assertion stops the chain.

- [ ] **Step 5: Run L7 cross-node correctness**

Use at least two nodes/two distinct A100 GPUs/one rank per GPU, host staging, 28/22, uniform and uneven manufactured cases, with timeout and all-rank completion. Record actual network/backend and do not call it scaling evidence.

- [ ] **Step 6: Re-link and run TASK-010 integration**

Build the frozen TASK-010 harness against the candidate library, run all 32 cases, and independently audit convergence/residuals. Do not reuse the archived executable. Record candidate library and harness hashes.

- [ ] **Step 7: Package and locally recover all gate evidence**

Create an immutable remote evidence tar, verify paths/SHA, download once, copy to a new permanent raw location, re-verify nested manifests, and independently recompute summaries. Missing evidence keeps TASK-007 `review/in-progress`.

---

### Task 10: Run the formal A/B and close by evidence

**Files:**
- Use: `verify/task007_formal.slurm`
- Append: TASK-007 validation README, ADR-005, task queue, blocker register, brief, index, performance protocol, claim/evidence matrix, and compile log.

**Interfaces:**
- Consumes: all Task 9 correctness/lifecycle/integration gates and the immutable formal package.
- Produces: one formal decision bound to raw CSVs and source/wrapper SHAs.

- [ ] **Step 1: Freeze and preflight the formal package**

Require the same candidate SHA that passed Task 9. Verify 56-launch plan, 16 warmups/40 measured, LF manifest, runner stdin regression, auditor tests, wrapper SHA, package paths, and no active/existing duplicate formal job before submission.

- [ ] **Step 2: Submit exactly once after explicit GPU approval**

The user executes one supplied command. Record `sbatch` return code/job ID and stop submitting. Later status queries are read-only and never use a failed `squeue` half to infer job loss.

- [ ] **Step 3: Verify the complete formal matrix**

Require job/batch/extern final status, node/two unique A100 UUIDs, 56/56 launches, all exit codes zero, expected diagnostic and lifecycle files for every rank/run, both build/source hashes, environment, and all manifests.

- [ ] **Step 4: Recompute the decision locally**

From raw files, independently regenerate diagnostic audits, ten pairs, lifecycle rank maxima, and `decision.json`. Compare byte/field-level structure with remote outputs. Report absolute seconds and paired percentages, not only speedup.

- [ ] **Step 5: Apply the frozen adoption result**

Adopt only if all correctness/pinned/22 steady/28 steady/22 lifecycle/28 lifecycle gates pass. Otherwise close as `done / do-not-adopt current candidate` with the implementation branch unmerged. A negative result is a valid completion.

- [ ] **Step 6: Perform final independent review and knowledge maintenance**

Review solver/API/math invariants, source/evidence lineage, complete SOP gates, statistical definitions, unsupported claims, and all failure records. Run `check_all.ps1`, knowledge lint, line-length, `git diff --check`, worktree status, and archive SHA checks. Update state only after evidence agrees; do not commit/merge/push automatically.

---

## Plan Self-Review

- **Spec coverage:** Tasks 2–5 cover ownership, capacities, backend, fallback, cleanup, concurrency precondition, ordinary/profiled reuse, and lifecycle. Tasks 6–8 cover complete-cost observability and immutable A/B tooling. Tasks 9–10 cover every required SOP gate, formal decision, archive, and knowledge state.
- **Algorithm/API freeze:** No task changes numerical kernels, slot maps, existing procedure argument lists, pivot threshold, FP64, or `1e-10`. The plan-staging entry point is a new explicitly private helper; both legacy exchange signatures and their ABI remain unchanged.
- **Pinned proof:** Source declaration alone is insufficient; Task 3 requires compiler and runtime proof, and Task 7 derives `persistent_pinned:true` only from fail-closed candidate identity plus successful launches.
- **Statistical correctness:** Stable solver timing uses iterations 2–9. Complete lifecycle computes each rank's local create+solver-sum+clean before the rank maximum; it never sums independent rank maxima.
- **Historical separation:** TASK-025's rejected source is never the base. Old TASK-007 pageable and TASK-025 negative results stay intact.
- **No hidden authority:** Worktree/source execution begins only after the user selects an execution mode. GPU/SSH/Slurm and Git integration remain separately controlled.
- **No placeholders:** Every file, interface, schema, gate, stop condition, and expected result required to begin implementation is specified; remote commands are intentionally delivered one at a time at execution because that is the user's explicit command-safety contract.
