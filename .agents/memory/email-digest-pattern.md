---
name: Email digest + scheduler pattern
description: How recurring admin email alerts (digests/backlog alerts) are structured in this repo
---

# Recurring admin email alerts

Convention for any new recurring email-to-admins feature (weekly standards
digest = Task #8, daily moderation-backlog alert = Task #12):

- **Transport** lives in `server/services/emailTransport.ts` (`sendEmail` +
  `getBaseUrl`). It's a lazy nodemailer singleton; when SMTP_HOST/SMTP_PORT are
  absent (normal in dev/Replit) it returns `logged_no_transport` and console-logs
  the email instead of failing. Reuse it — do NOT re-create transport per service.
- **Recipients** come from `getEmailDigestRecipients()` in
  `notificationsService.ts` (system_admins minus `emailDigestOptOut`).
- **Idempotency** is a per-period log table (e.g. `standards_digest_log`,
  `moderation_backlog_digest_log`) keyed by a period string; before sending, skip
  recipients with a non-failed row for the current period. Survives restarts +
  multi-tick scheduler races. A manual "run now" passes `force` to bypass it.
- **Scheduling** lives in `server/services/digestScheduler.ts`: a 1-minute
  `setInterval` tick using `Intl.DateTimeFormat` in `SITE_TIMEZONE`
  (default America/Chicago) with an in-memory day-key guard. Each scheduler is
  started from `server/routes.ts`.

**Why:** keeps SMTP config + opt-out + dedup logic in one place so adding a new
alert is just "stats fn + render fn + log table + a tick", and real delivery can
be wired up once (SMTP envs) for all alerts at once.

**How to apply:** when adding another admin alert, follow this shape rather than
inventing a new transport/scheduler. Thresholds are env-configured (e.g.
`MODERATION_BACKLOG_THRESHOLD`, default 1, "notify only if total > N").
