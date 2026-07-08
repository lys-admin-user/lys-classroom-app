---
name: Dev and prod are separate databases
description: Publishing migrates schema only, never rows — roles/users set in dev do NOT exist in prod; how the first prod admin is bootstrapped.
---

# Dev and prod are separate PostgreSQL databases

Replit's Publish flow migrates the **schema** from dev to prod, but **never copies data rows**. So a user who is `system_admin` in the development database is an ordinary user (or absent) in production. After the Clerk cutover, prod started with 21 real users and **zero** admins, while dev had 9 `system_admins` — this looked like "my admin got demoted" but was really just the two databases being independent.

**How to diagnose role/data mismatches:** query BOTH databases with `executeSql` (`environment: "development"` vs `"production"`; prod is read-only). The prod row is the source of truth for the live site. The client-side "view as student" toggle (`lys:view-as-student` localStorage) is presentational only and only activates for educator+, so it is never the cause of a genuine student role in prod.

## First-admin bootstrap (prod has no admin to promote others)

Because only an existing admin can promote users, a fresh prod DB with zero admins is a chicken-and-egg. Solution in `server/index.ts` boot init:
- Env var `BOOTSTRAP_ADMIN_EMAIL` (shared scope) names the owner email.
- On boot, if no `system_admin` exists AND a persistent latch feature flag `first_admin_bootstrap_completed` is not set, promote the matching already-registered user to `system_admin`, audit it, then set the latch.
- **Why the latch:** makes it strictly one-time so it can never re-escalate if admins are later removed intentionally.
- **How to apply:** the target user must have already signed in (row must exist). Change takes effect only on the **next Republish** (server code change). No-op in dev because dev already has admins.
