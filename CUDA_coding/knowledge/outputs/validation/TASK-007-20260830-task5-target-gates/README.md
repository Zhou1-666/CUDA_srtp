# TASK-007 Task 5 target gates freeze

## Status and scope

Task 5 Step 6 ran immutable v3 once as job1465997 and identified a target-environment UCC/Compute Sanitizer startup conflict. The minimally revised immutable v4 passed local, extracted-package and remote preflight checks, then ran once as job1466143. Its API and pressure cases passed, but all four sanitizer cases failed to attach and reached the outer timeout. The later node-local TMPDIR probe also failed to attach; TASK-007 is now closed as `done / do-not-adopt/withdraw`, while Step 6 remains explicitly not passed. v1/v2/v3/v4 and jobs1465997/1466143/1467376 are preserved and must not be reused for submission.

This checkpoint adds only target validation tooling. It does not change `src/PaScaL_TDMA_cuda_penta.f90`, the numerical algorithm, public solver interfaces, 28/22 layouts, FP64, or the `1e-10` threshold. It performs no SSH, GPU allocation, Slurm submission, commit, merge, or push.

## Wrapper TDD and build flags

`verify/task007_task5_gates_wrapper_test.js` first observed three expected failures because the approved wrapper did not exist. A fourth RED behavior test then proved that the existing API/lifecycle runners passed `FC` but dropped the frozen `FLAG` and `CUDAFLAG` values. The minimum GREEN changes were:

- both runners forward `FC`, `FLAG` and `CUDAFLAG` to their validation `make` invocation;
- the new wrapper requests one node/two A100 GPUs and runs no nested submission or benchmark;
- it requires candidate SHA `84357b2b9ab9dc5d4751b49b23fda836347b1132870dc9b67facbaba3c56b035` and flags `-O3 -cuda -gpu=cc80,cuda12.4`;
- it copies the candidate into a new job-owned build tree, records compiler/GPU/Slurm/rank mapping, then accepts only exact `20/0` API and `6/0` lifecycle summaries;
- lifecycle is frozen to 28/22 at 100 cycles plus memcheck/initcheck for both slots, with at least two zero-error summaries per sanitizer case;
- any manifest/source mismatch, missing/duplicate A100 mapping, unexpected exit, incomplete matrix or lifecycle failure stops the chain and preserves evidence.

The v3 wrapper behavior suite was `5/5` GREEN and its combined Task 4/5 suite was `20/20`. The v4 UCC regression raises those counts to `6/6` and `21/21` respectively.

## Rejected v1/v2, preserved v3 run, and local v4

The first local archive is preserved and must not be uploaded:

- `TASK-007-20260830-task5-target-gates-v1.tar.gz`
- bytes: `43599`
- SHA-256: `5b1aae786152d02dfc1019ac03964297854b4245c97b9ca7e38a888671272b42`
- disposition: **rejected local preflight input**. Its 15 source contracts passed after extraction, but the four wrapper tests attempted to create fixtures below the deeply nested extracted `verify` directory and hit the Windows path-length limit. This was a test-fixture path failure, not a wrapper or solver result.

The test fixture was changed to use the short shared workspace root on Windows and `/tmp` on Linux, the package basename/protocol was bumped, and no v1 object was overwritten. That produced v2:

- [TASK-007-20260830-task5-target-gates-v2.tar.gz](</D:/CUDA/CUDA_repository_recovery/TASK-007-20260830-task5-target-gates-v2.tar.gz>)
- bytes: `43730`
- SHA-256: `141b19f62b3e1f4b5e3f1b1ed682d7cb3a2cf7a434563ffd9dc44267df3bfb47`
- archive paths: `23`, one unique top-level root, no absolute/traversal/backslash/colon/duplicate paths, only regular files/directories;
- extracted files: `18`, no reparse point;
- internal manifest: LF-only, `17/17` payload hashes independently recomputed;
- staged tests before upload: `19/19` PASS;
- new-directory round-trip tests before upload: `19/19` PASS;
- three Bash syntax checks: PASS.

The user uploaded v2 and the remote byte/SHA gate passed exactly. Safe extraction, the `17/17` manifest and Bash syntax gates also passed, but the remote Node suite produced `18/19`: only `Task 5 target wrapper accepts exactly 20 API and six lifecycle cases` failed at the fake GPU UUID assertion because `.match(...)` returned null. No target build, MPI solver run, GPU allocation or Slurm submission occurred.

A following read-only environment diagnostic confirmed the root cause. The login shell exports `module` as `BASH_FUNC_module%%`; the Node-created Bash child inherited that function, and `module load nvhpc/24.5/nvhpc-hpcx-cuda12/24.5` prepended the real HPC-X `mpirun` ahead of the fake-bin path. Therefore the `18/19` result is a test-fixture isolation failure, not a solver/API/lifecycle/GPU failure. The v2 archive and extracted stage remain preserved and must not be reused for submission.

TDD added a regression that injects `BASH_FUNC_module%%`; it first failed with the inherited function as the actual value. The minimum GREEN removes only environment keys beginning with `BASH_FUNC_module` from the wrapper fixture child. The production wrapper behavior was unchanged apart from the required v3 package/protocol basename. At that checkpoint the accepted upload input was:

- [TASK-007-20260830-task5-target-gates-v3.tar.gz](</D:/CUDA/CUDA_repository_recovery/TASK-007-20260830-task5-target-gates-v3.tar.gz>)
- bytes: `44321`
- SHA-256: `8d701b60f878b2416c8db1fb30c526f787c0e243a9e22bc1f875620a66b8e1eb`
- archive paths: `23`, one unique top-level root, safe paths and only regular files/directories;
- extracted files: `18`;
- internal manifest: LF-only, `17/17` payload hashes independently recomputed;
- worktree tests: `20/20` PASS;
- new-directory round-trip tests: `20/20` PASS;
- three Bash syntax checks: PASS;
- solver SHA remains `84357b2b9ab9dc5d4751b49b23fda836347b1132870dc9b67facbaba3c56b035`.

The failed mixed PowerShell/MSYS packaging attempts are retained in the task transcript. They were traced to GNU tar interpreting `D:` as a remote archive name, non-login Bash inheriting Windows `find`, and PowerShell expanding `$()` inside a Bash command string. The accepted v3 check uses PowerShell end-to-end for archive paths/types/extraction/hash recomputation and Git Bash only for direct `bash -n` calls.

After job1465997, both memcheck logs showed the same pre-solver stack: `ucc_mc_cuda_init` -> OpenMPI `mca_coll_ucc_comm_query` -> `MPI_Init` -> `cuCtxGetDevice`, ending in `CUDA_ERROR_INVALID_CONTEXT (201)`. Both runs nevertheless printed `LIFECYCLE_PASS` for their respective slot count with maximum error `4.4409e-16`. Target `ompi_info` then confirmed that `coll_ucc_enable` defaults to 1 and that integer value 0 disables the optional UCC collective component.

A new source contract first failed because the shared lifecycle `mpi_args` lacked that exact parameter. The minimum GREEN adds only `--mca coll_ucc_enable 0`; both pressure and sanitizer launch sites continue to consume the same array. The solver is unchanged. The immutable replacement input is:

- [TASK-007-20260830-task5-target-gates-v4.tar.gz](</D:/CUDA/CUDA_repository_recovery/TASK-007-20260830-task5-target-gates-v4.tar.gz>)
- bytes: `44580`
- SHA-256: `1185d206e4f62f1bb4dd7c4520aa1a1e4fe5c908fd5dfac668e3fcdd336aee50`
- archive paths: `23`; payload/extracted files: `17/18`; LF-only manifest: `17/17`;
- worktree and extracted-package Node suites: `21/21`; Bash syntax: `3/3`;
- solver SHA remains `84357b2b9ab9dc5d4751b49b23fda836347b1132870dc9b67facbaba3c56b035`.

The first extracted-package Node invocation omitted the established short Windows fixture root and therefore produced `17/21` when Git Bash was denied access below `C:\Users\30575`; the same unchanged extraction with `TASK007_TEST_TMP_ROOT=D:\CUDA\CUDA_repository_recovery` produced `21/21`. A final content audit exited 0 with all hashes and Bash syntax intact. Two fixture directories from earlier interrupted local test commands remain preserved outside the package and were not counted as package residue.

## Frozen fingerprints

| Artifact | SHA-256 |
|---|---|
| unchanged candidate solver | `84357b2b9ab9dc5d4751b49b23fda836347b1132870dc9b67facbaba3c56b035` |
| `verify/run_penta_api_validation.sh` | `db3cf4e2f7788d7555a98b3fad64beb99427b55a6098ea0430528e3f228a73bb` |
| `verify/run_task_016_lifecycle.sh` | `b69e1c76a8706548bd4da817d3e53c329280d98a79b4c1f845fe02f5903d5473` |
| `verify/task007_task5_gates.slurm` | `3af649ffff3714990a4fee2b7396a34efa75123ffd65de789a3488669201e66d` |
| `verify/task007_task5_gates_wrapper_test.js` | `704bee801b39e5fd91826b6992c4fa28d6a74128253a63e1489c8adf83db2ef4` |
| package README | `1038c8189bca4f6db322d2756bfb88e009ce906c27041a411434cae1ccbcda5c` |

## Stop point

The user uploaded the v3 archive without replacing v1/v2. Remote readback matched `44321` bytes and SHA-256 `8d701b60f878b2416c8db1fb30c526f787c0e243a9e22bc1f875620a66b8e1eb`. The first extraction command refused an already-existing v3 stage before overwrite. A separate audit then established that the existing stage is a directory containing exactly 18 files and five directories, no special entry, LF-only `17/17` manifest, matching solver/wrapper fingerprints, three valid Bash scripts and `20/20` Node tests. It ended with `TASK007_TASK5_V3_EXISTING_STAGE_PREFLIGHT_PASS`.

The accepted remote stage is:

```text
/home/bingxing2/home/scx9fv9/pascal-work/tasks/TASK-007/packages/TASK-007-20260830-task5-target-gates-v3
```

The duplicate-job query returned zero active and zero accounting records, after which the user submitted exactly one v3 target job: `1465997`. It ran on `paraai-n32-h-01-agent-13` for `00:03:24` and ended `FAILED/1:0`; the extern step alone was `COMPLETED/0:0`. Internal readback shows both target builds passed, all 20 API cases passed, both 100-cycle 28/22 pressure cases passed, and both initcheck cases passed with two zero-error summaries each. Only memcheck failed for both slots with `rc=99`; complete logs and the target MCA parameter query localized this to UCC CUDA initialization during `MPI_Init`, before solver entry.

The v4 archive was subsequently uploaded without replacing earlier packages. Its `44580` bytes, full SHA, 23 safe paths, LF `17/17` manifest, frozen fingerprints, Bash syntax and remote Node `21/21` all passed. After a duplicate-job readback showed no active job and only historical job1465997, the user submitted v4 exactly once as job1466143.

Job1466143 ran on `paraai-n32-h-01-agent-68` for `00:22:54`; job/batch ended `FAILED/1:0` and extern ended `COMPLETED/0:0`. Internal results were:

- API `20/20` PASS;
- pressure 28/22 at 100 cycles both PASS, maximum error `6.6613e-16`;
- memcheck 28/22 and initcheck 28/22 all `rc=124`, with no `LIFECYCLE_PASS` or zero-error summary;
- lifecycle summary `cases=6 failures=4`.

All four sanitizer logs contain 46 lines and the same event structure: two Compute Sanitizer frontends start, OpenMPI warns that its shared-memory backing file is on a network filesystem, both frontends report `No attachable process found`, and PMIx later reports `NO-PERMISSIONS`. The run tree contains 32 FIFO entries created by the sanitizer frontends (four cases × two ranks × two pipe directions × read/write); the post-job process readback found no live sanitizer or lifecycle process. These FIFOs are preserved evidence and are not solver memory leaks.

The wrapper recorded Compute Sanitizer 2024.1.1 and OpenMPI 4.1.7a1. It explicitly placed `TMPDIR` below the job evidence tree. Read-only filesystem checks proved that tree is NFSv3, while node `/tmp` is local ext4 and `/dev/shm` is tmpfs. The actual sanitizer help states that multi-process attach defaults to 60 seconds and that `--kill` is opt-in, matching the observed attach error followed by waiting until the wrapper's 300-second timeout. This establishes the failure at the sanitizer/MPI launch boundary, not in an executed solver memory check. It does not yet prove whether NFS temporary IPC is the root cause, because the PMIx errors may be timeout-cleanup effects.

The only next action is an explicitly approved, short single-variable diagnostic using a fresh node-local temporary directory for one sanitizer case while preserving the frozen executable and MPI arguments. It must not rerun the full v4 matrix or alter the solver. v3/job1465997 and v4/job1466143 must not be repeated, and Task 6 must not start automatically.

## Approved node-local TMPDIR short probe freeze

The user approved the bounded diagnostic design. A new contract first produced the intended missing-wrapper RED (`0/3`), then the minimum wrapper passed `3/3` plus Bash syntax. It freezes the unchanged candidate SHA `84357b2b9ab9dc5d4751b49b23fda836347b1132870dc9b67facbaba3c56b035`, NVHPC flags, v4 MPI/UCC arguments and sanitizer arguments. The only experiment variable is `TMPDIR=/tmp/task007-${USER}-${SLURM_JOB_ID}`, which is checked with `findmnt` and rejected for NFS/NFS4.

The probe runs exactly one case: one node, two A100s, two MPI ranks, memcheck, 28 slots and one create-solve-clean cycle. Its command timeout is 240 seconds and its Slurm ceiling is ten minutes. Acceptance requires exit zero, exact `LIFECYCLE_PASS: slots=28 cycles=1 ranks=2`, and at least two `ERROR SUMMARY: 0 errors` lines. It does not run API, pressure, initcheck, a performance matrix or nested submission.

The immutable local upload input is [TASK-007-20260830-task5-localtmp-probe-v1.tar.gz](</D:/CUDA/CUDA_repository_recovery/TASK-007-20260830-task5-localtmp-probe-v1.tar.gz>): 32956 bytes, SHA-256 `bb0db4b5ad4fd988daaebfb80e3ee5f3e8cc3334ba7290acb9e42095c9198752`, 16 safe archive paths, ten LF manifest payloads and eleven extracted files. A fresh extraction passed all payload hashes, candidate SHA, `3/3` contracts and Bash syntax. On 2026-08-31 the user pasted the ParaAI login-node readback `ARCHIVE_BYTES=32956`, the same full SHA-256 and `TASK007_LOCALTMP_V1_UPLOAD_SHA_PASS`; the normalized excerpt is preserved in [raw/20260831-localtmp-probe-v1-upload-sha-user-readback.txt](raw/20260831-localtmp-probe-v1-upload-sha-user-readback.txt). The following read-only remote preflight returned 16 paths, 16 unique paths, 16 regular-file/directory types, the exact single top-level root and `TASK007_LOCALTMP_V1_ARCHIVE_PREFLIGHT_PASS`; see [raw/20260831-localtmp-probe-v1-archive-preflight-user-readback.txt](raw/20260831-localtmp-probe-v1-archive-preflight-user-readback.txt). The non-overwriting remote extraction then produced 11 files and five directories; all ten manifest payloads were `OK`, the candidate SHA matched, and the user pasted `TASK007_LOCALTMP_V1_EXTRACT_MANIFEST_PASS`; see [raw/20260831-localtmp-probe-v1-extract-manifest-user-readback.txt](raw/20260831-localtmp-probe-v1-extract-manifest-user-readback.txt). The first login-preflight command then ended the interactive SSH session because its failure branches used top-level `exit`; the user reported immediate `logout` and connection failure without the preceding check output. This is a command-control failure, not a Node/Bash/solver result; see [raw/20260831-localtmp-probe-v1-login-preflight-session-exit-user-report.txt](raw/20260831-localtmp-probe-v1-login-preflight-session-exit-user-report.txt). A corrected no-exit child-shell diagnostic then confirmed `STAGE_CHECK=PASS`, `MANIFEST_RECHECK_RC=0`, `BASH_SYNTAX_RC=0` and `OUTER_SHELL_STILL_ALIVE`, while `NODE_PATH=MISSING`, `node --version` rc127 and `NODE_CONTRACT_RC=127` show that Node was absent from the login environment and the `3/3` contract was not run; see [raw/20260831-localtmp-probe-v1-login-preflight-node-missing-user-readback.txt](raw/20260831-localtmp-probe-v1-login-preflight-node-missing-user-readback.txt). A read-only module query then established that the cluster uses a module function without the Lmod `spider` subcommand and that the visible catalog contains no Node/NodeJS match; see [raw/20260831-localtmp-probe-v1-node-module-query-user-readback.txt](raw/20260831-localtmp-probe-v1-node-module-query-user-readback.txt). Existing TASK-023 evidence supplied the private ARM64 Node path used by the later successful login contract. At this historical checkpoint transport, archive structure, extraction, internal-manifest integrity and Bash syntax were closed, while the GPU probe had not yet run; subsequent paragraphs record its one authorized submission and terminal result.

The exact historical private Node path was then rechecked successfully: it is present, not a symlink, is a user-owned regular executable, is identified as an ARM aarch64 ELF, and reports exact version `v22.23.2` with rc0. The normalized readback is [raw/20260831-localtmp-probe-v1-private-node-path-user-readback.txt](raw/20260831-localtmp-probe-v1-private-node-path-user-readback.txt). This closes only the Node-tool availability check; the frozen `3/3` wrapper contract remains not run. The sole next action is to invoke that contract with the verified absolute Node path, without loading modules or running the Slurm wrapper.

Using that verified absolute path, the login-node contract run returned `MANIFEST_RECHECK_RC=0`, three passing subtests, `tests 3`, `pass 3`, `fail 0`, `NODE_CONTRACT_RC=0` and an intact outer shell. The normalized readback is [raw/20260831-localtmp-probe-v1-login-contract-user-readback.txt](raw/20260831-localtmp-probe-v1-login-contract-user-readback.txt). This closes the remote static wrapper-contract preflight only. The Slurm wrapper, sanitizer, solver and GPU probe remain not run. The sole next action is a read-only `squeue`/`sacct` duplicate-submission gate for the exact short-probe job name; explicit renewed GPU/Slurm authorization is still required after that gate.

The exact-name duplicate gate then returned `SQUEUE_RC=0`, `ACTIVE_COUNT=0`, `SACCT_RC=0`, `ACCOUNTING_COUNT=0` and `TASK007_LOCALTMP_DUPLICATE_GATE=PASS`; see [raw/20260831-localtmp-probe-v1-duplicate-gate-user-readback.txt](raw/20260831-localtmp-probe-v1-duplicate-gate-user-readback.txt). This confirms that no active or top-level accounting record since 2026-08-30 exists for `task007-task5-localtmp`. It does not authorize or prove a run. The workflow now stops pending explicit renewed user approval for exactly one single-node, two-A100, two-rank, ten-minute short-probe submission.

The user then replied `批准` to that exact bounded authorization request; the context-bound authorization record is [raw/20260831-localtmp-probe-v1-explicit-gpu-authorization.txt](raw/20260831-localtmp-probe-v1-explicit-gpu-authorization.txt). It authorizes exactly one submission of this frozen short probe and no retry, cancellation, v3/v4 matrix or other task. The next action is one guarded `sbatch --parsable` invocation after immediate manifest/SHA and exact-name duplicate rechecks; after a returned job ID, only read-only status collection is allowed.

The guarded submission rechecked the path, manifest, wrapper SHA `e9ec5c77…775d8`, candidate SHA `84357b2b…56b035`, Bash syntax and zero active/accounting duplicates, then called `sbatch --parsable` once. Slurm returned rc0 and job ID `1467376`; see [raw/20260831-localtmp-probe-v1-job1467376-submission-user-readback.txt](raw/20260831-localtmp-probe-v1-job1467376-submission-user-readback.txt). This proves scheduler acceptance only. Node assignment, two distinct A100s, execution, local TMPDIR, sanitizer attach, lifecycle output and final status remain unverified. Job 1467376 must not be cancelled or resubmitted; the sole next action is read-only `squeue`/`sacct`/`scontrol` status collection for this job.

The first status snapshot found job 1467376 `RUNNING` for 3:22 on `paraai-n32-h-01-agent-28`, with one node, two tasks, two GPU resources, ten-minute limit and scheduler reason `None`; see [raw/20260831-localtmp-probe-v1-job1467376-running-user-readback.txt](raw/20260831-localtmp-probe-v1-job1467376-running-user-readback.txt). The displayed `ExitCode=0:0` is provisional while running. This snapshot does not prove GPU model/UUID, wrapper progress, sanitizer attach or acceptance. Do not cancel or resubmit; wait for a terminal state and then collect the frozen stdout/stderr and internal evidence.

The terminal `sacct` readback then reported job 1467376 `FAILED/1:0` after 4:35 on the same node, from 12:51:29 to 12:56:04; see [raw/20260831-localtmp-probe-v1-job1467376-failed-status-user-readback.txt](raw/20260831-localtmp-probe-v1-job1467376-failed-status-user-readback.txt). This terminal status does not identify the failing wrapper gate and is not yet attributable to the solver. The job is permanently non-repeatable. The sole next action is bounded read-only inspection of its frozen stdout/stderr, `job-status.txt`, memcheck status/log, local-TMPDIR record and GPU record.

That bounded internal readback is now preserved at [raw/20260831-localtmp-probe-v1-job1467376-internal-readback-user-transcript.txt](raw/20260831-localtmp-probe-v1-job1467376-internal-readback-user-transcript.txt). The clean build completed and linked the lifecycle executable, the protocol retained the exact candidate SHA and flags, and `gpus.csv` records two distinct A100-PCIE-40GB devices. Both the before and after records prove that the requested job-owned `TMPDIR=/tmp/task007-scx9fv9-1467376` was local ext4; the after record contains the two sanitizer treetracker directories and their eight FIFOs, so the intervention was applied rather than silently ignored.

The probe nevertheless failed its frozen acceptance contract: wrapper rc was 1, memcheck rc was 124, both Compute Sanitizer frontends reported `No attachable process found. compute-sanitizer timed-out.`, and neither `LIFECYCLE_PASS` nor `ERROR SUMMARY` appeared. Unlike v4, this six-line memcheck log contains no NFS warning or PMIx `NO-PERMISSIONS`. Node-local TMPDIR therefore removes the earlier NFS/PMIx symptom but is not sufficient to make sanitizer/MPI attachment succeed. The first evidenced failure remains the sanitizer/MPI attach boundary before an executed solver memory check; no CUDA memory error was reported, but L6 is not PASS and the run supplies no solver-memory-safety result.

The knowledge base names no concrete predesignated alternative sanitizer environment, host or availability record. Under the approved hard stop, no further TMPDIR, PMIx, launcher, MPI-backend or sanitizer-parameter experiment may be invented. Job1467376 remains preserved and non-repeatable; the following terminal audit applies the default negative disposition.

The repository-wide audit found no concrete environment that could satisfy “predesignated”; selecting one after this terminal probe would violate that qualifier. The approved default therefore applies without another experiment: L6 is `NOT-RUN/environment limitation`, candidate `84357b2b…56b035` is `do-not-adopt/withdraw`, and TASK-007 is closed with a negative disposition. See [TASK-007-20260831-withdrawal-disposition.md](TASK-007-20260831-withdrawal-disposition.md). This does not turn any missing SOP gate into PASS and does not attribute an error to solver code. The only next task is TASK-031, which is not started here.

## 2026-08-31 governance stop rule

The user accepted the short probe as the last environment-causal diagnostic. No additional TMPDIR, PMIx, launcher, MPI-backend or sanitizer-parameter variants and no new performance candidates may follow it. A successful probe only unlocks the already frozen remaining TASK-007 gates, TASK-010 relink, formal A/B and independent review. If attach still fails, at most one predesignated alternative sanitizer environment may be used with the exact same candidate; if that is unavailable or fails, L6 is recorded as `NOT-RUN/environment limitation`, never `PASS`, and the candidate defaults to `do-not-adopt/withdraw`. A terminal TASK-007 disposition forces the sequence TASK-031 then TASK-011 paper v1.
