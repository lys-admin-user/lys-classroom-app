---
name: Audit hash chain
description: How the tamper-evident auditLogs hash chain works and how not to break it.
---

`auditLogs` rows form a SHA-256 hash chain (`server/services/auditLog.ts`).

**Rule:** `logAuditEvent` writes inside a transaction guarded by a fixed
`pg_advisory_xact_lock` so concurrent writers serialize into ONE linear chain
(no two writers read the same head and fork it). Each row's `hash` commits to a
deterministic (`stableStringify`, key-sorted) payload of a FIXED field set plus
the previous row's `hash` (genesis marker = `"GENESIS"`).

**Why:** the chain is the integrity guarantee — `verifyAuditChain()` walks it
from genesis recomputing hashes to detect edits, deletions, forks, and cycles
(exposed at `GET /api/admin/audit-logs/verify`).

**How to apply:**
- If you add/remove/rename a field that should be covered by integrity, update
  BOTH `computeHash`'s committed payload AND the verify path — they must hash the
  exact same fields or every existing row fails verification.
- Don't backfill/edit `auditLogs` rows out of band; any change to a committed
  field without recomputing downstream hashes breaks verification (by design).
- `computeHash` + `stableStringify` are exported purely so they can be unit-tested
  without a DB (see `server/__tests__/audit-chain.test.ts`).
