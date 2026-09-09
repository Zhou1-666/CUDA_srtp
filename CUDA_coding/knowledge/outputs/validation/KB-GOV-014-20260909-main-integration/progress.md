# KB-GOV-014 execution ledger

Plan: ../KB-GOV-013-20260909-main-integration-review/integration-plan.md

- Intake and immutable recovery: complete; 717 targets, 187 receipt files, 12 recovery copies, 16695 protected paths.
- Apply nine reviewed proposals and retain rolling meta: complete; exact attribute suffix separately reviewed.
- Group A (471 remaining static paths + exact receipts): complete; commit 6f01a64, 690 staged blobs verified, no source paths.
- Group B (26 documents + exact receipt): complete; commit e1a4f38, 43 actual changed blobs checked.
- Independent B clone, fixed replays, knowledge lint and protection: complete; all ten clone checks passed; live check passed with reviewed T1 exception and a sampled independent T2 boundary.
- Closeout: three meta records updated with exact inverse edits; final receipt supplement must pass staged checks, then the independent clone fast-forwards to that fixed commit for final stdout-only verification. This avoids a self-hash/log commit cycle.

Ruling: execute on main as explicitly selected by the user and the reviewed 014 contract; no extra worktree or branch is needed for integration. Preserve existing software dirty state and all prior worktrees.
Ruling: use this receipt as the execution ledger and review-artifact location; do not create or delete generic skill scratch workspaces.
Ruling: initial A/B and final receipt-only closeout commits are one task. Acceptance is only after actual independent-clone validation; intermediate archival commits do not mean done.

| Shared boundary | Review |
| --- | --- |
| Intake → proposals | All nine before hashes must match before any write; retain original bytes. |
| A → B | .gitattributes precedes evidence staging; all source paths excluded from both groups. |
| B → closeout | Three rolling meta files may change only within the 014 governance record and one milestone; capture inverse edits. |
| Archive → clone | Preserve fixed G1/G2/G3 refs; full local clone without hardlinks; historical verifiers run only at declared fixed versions. |

The plan is internally consistent after its G1 concurrent-commit supplement. Genuine independent clone lint is required; in-memory link projection is not acceptance.

Concurrent boundary: one previously protected T1 README changed and two T1 transcript/audit files were added after intake. Retain the original protection FAIL and bounded witness; exclude all T1 files from integration. This is not evidence of 014 scientific validation.

Subsequent boundary: independently reviewed T2 tools appeared after intake. Preserve the second protection FAIL; new files only under the exact T2 receipt root are sampled by path/SHA and excluded, while all original protected paths and T1's two new files remain strict. T2 may continue independently; none of its GPU/Slurm work is run or accepted by 014.
