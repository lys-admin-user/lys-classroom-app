---
name: Idempotent scheduled-job writes
description: How "send once" daily jobs (billing reminders, digests) must persist their sent-marker so retries don't crash the run.
---

# Idempotent scheduled-job writes

For daily "do this once per (entity, period)" jobs, the sent-marker table has a
unique index on the dedupe key (e.g. `kind + refId + periodKey`). The guard is
select-before-act: skip when a prior **non-failed** row exists, but allow retry
when the only prior row is `failed`.

**Rule:** the marker write must be `onConflictDoUpdate` (upsert), never a plain
`insert`.

**Why:** with a plain insert under the unique index, retrying a previously
`failed` send hits a constraint violation that throws and aborts the *entire*
scheduler tick (all remaining reminders that run too). Upsert converges to one
row per key, lets failed attempts retry on a later day, and makes the unique
index a real idempotency backstop instead of a crash trigger.

**How to apply:** any new sent-marker / dedupe-log write in a scheduled job
(billing reminders, digests, retention) — pair the select-before-act guard with
an `onConflictDoUpdate` keyed on the same columns as the unique index.
