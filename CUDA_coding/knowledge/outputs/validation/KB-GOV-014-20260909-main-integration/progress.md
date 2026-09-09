# KB-GOV-014 execution ledger

Plan: ../KB-GOV-013-20260909-main-integration-review/integration-plan.md

- Intake and immutable recovery: complete; 717 targets, 187 receipt files, 12 recovery copies, 16695 protected paths.
- Apply nine reviewed proposals and retain rolling meta: complete; exact attribute suffix separately reviewed.
- Group A (471 remaining static paths + exact receipts): complete; commit 6f01a64, 690 staged blobs verified, no source paths.
- Group B (26 documents + exact receipt): pending.
- Independent clone, fixed replays, knowledge lint and protection: pending.
- Closeout and final fixed-commit verification: pending.

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
