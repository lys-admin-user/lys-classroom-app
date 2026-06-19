---
name: Retention purge grace window
description: Why inactive-account auto-purge must never set the purge date to "now" and must re-verify at delete time
---

# Inactive-account retention purge safety

When marking inactive accounts for deletion (TTL sweep in `server/services/dataSubjectService.ts`), the *mark* step and the *delete* step (`runRetentionPurge`) can run in the same daily scheduler pass.

**Rule:** Never set `retentionPurgeAt = now` when marking. Set it to a future grace date (`now + INACTIVE_PURGE_GRACE_DAYS`). Otherwise the same scheduler run that marks an account immediately purges it — instant, irreversible data loss.

**Rule:** `runRetentionPurge` must re-verify eligibility at delete time, not trust the stored `retentionPurgeAt` alone. An active account is only purged if it is *still* inactive (`lastLoginAt` still older than the 12-month cutoff); if the user signed back in during the grace window, rescind the schedule (set `retentionPurgeAt = null`) instead of deleting. Closed/anonymized accounts follow their own closure-driven 3-year purge and are always honored once due.

**Why:** Login updates `lastLoginAt` (in `server/replit_integrations/auth/storage.ts`) but does NOT clear `retentionPurgeAt`, so a returning user would still be deleted without the delete-time re-check.

**How to apply:** Any future "auto-delete stale X" job in this codebase should mark with a future grace date and re-confirm the staleness condition immediately before the destructive op.
