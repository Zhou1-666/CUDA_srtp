# TASK-007 persistent pinned candidate withdrawal disposition

- Date: 2026-08-31
- Candidate SHA-256: `84357b2b9ab9dc5d4751b49b23fda836347b1132870dc9b67facbaba3c56b035`
- Result: `do-not-adopt/withdraw`
- TASK-007 terminal state: `done` with a negative disposition
- Scope: evidence and governance only; no solver, API, layout, threshold, Git or remote mutation

## Decision

The persistent pinned host-staging candidate is withdrawn and must not enter the final software. This is not a solver-correctness failure finding. It is the mandatory negative disposition from the user-approved 2026-08-31 hard-stop rule because the required L6 sanitizer gate could not be executed successfully and no auditable predesignated alternative sanitizer environment exists.

## Evidence chain

- The candidate source and target wrappers remained bound to the frozen SHA and flags.
- Local contracts covered plan ownership, backend drift, capacity, lifecycle and ordinary/profiled routing.
- ParaAI job1466143 passed API `20/20` and both 100-cycle pressure cases, with maximum error `6.6613e-16`, but all four sanitizer cases timed out before an executed solver memory check.
- The final single-variable job1467376 successfully clean-built the frozen candidate and recorded two distinct A100-PCIE-40GB GPUs.
- Its before/after records prove that Compute Sanitizer used the job-owned node-local ext4 `TMPDIR`.
- Both sanitizer frontends still emitted `No attachable process found`; `MEMCHECK_RC=124`; there was no `LIFECYCLE_PASS` and no `ERROR SUMMARY`.
- The earlier NFS warning and PMIx `NO-PERMISSIONS` did not appear, so node-local TMPDIR removed that symptom but was not sufficient to restore sanitizer/MPI attachment.
- No CUDA memory error was reported, but absence of such a report before attach is not a memory-safety result.
- A repository-wide knowledge search found the governance phrase “one predesignated alternative sanitizer environment” but no concrete environment name, host, toolchain or availability record. An environment selected after this terminal probe would not be predesignated and would violate the stop rule.

## SOP disposition

| Gate | Terminal status | Evidence boundary |
| --- | --- | --- |
| L0/L1 local contracts and independent checks | PASS within recorded local scope | Does not replace target GPU gates. |
| L2 target clean build | PASS for the job1467376 release build | Debug/release full-SOP adoption matrix was not completed. |
| API and 28/22 pressure subset | PASS in job1466143 | Supports only those frozen cases. |
| L3/L4/L7 | NOT-RUN/incomplete for the final candidate contract | Never promoted to PASS. |
| L6 memory and lifecycle sanitizer | `NOT-RUN/environment limitation` | Sanitizer could not attach; no executed memory-check result. |
| TASK-010 relink, formal A/B, independent adoption review | NOT-RUN | Stopped because the candidate is withdrawn before adoption. |

## Preserved boundaries

- Jobs1465997, 1466143 and 1467376 and every local/remote package or log are non-repeatable evidence and must not be cancelled, resubmitted, deleted or overwritten.
- No TMPDIR, PMIx, launcher, MPI-backend or sanitizer-parameter variant may follow.
- The withdrawn candidate is not merged, committed or pushed and must not be synchronized into final software.
- This result does not alter the numerical algorithm, public arguments, 28/22 layout or `1e-10` threshold.

The only next task is TASK-031 private software freeze. This record recommends it but does not start it.
