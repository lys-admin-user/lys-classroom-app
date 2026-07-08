---
name: Email transport portability
description: Why outbound email uses plain env vars + fetch, not the Replit Resend connector
---

Outbound email (MFA/login codes, digests, billing reminders, notifications) all
flows through one transport that reads plain `process.env` vars and calls the
provider's HTTPS API directly (Resend via `fetch` to api.resend.com; no `resend`
npm package). Provider order: Resend → SendGrid → Gmail SMTP → generic SMTP →
log fallback.

**Why:** the app is deployed on Render (migrated off Replit Auth). Replit's
Resend "integration" is a *connector* type — a runtime proxy that only works
inside Replit and would break on Render. So we deliberately do NOT use the
connector; a plain `RESEND_API_KEY` env var is host-agnostic and works
identically in dev, Replit, and Render.

**How to apply:** never swap this to a Replit connector or the `resend` SDK for
"convenience" — it would re-couple to Replit. Keep new email needs going through
`sendEmail()` in `server/services/emailTransport.ts`.

**Test mode:** before verifying a domain in Resend, set
`RESEND_FROM_EMAIL=LYS <onboarding@resend.dev>` (Resend's shared test sender) —
it delivers only to the account owner's own email. A custom unverified domain
makes every send fail (logged, non-throwing). Swap to a real
`no-reply@yourdomain.com` once the domain is verified in Resend.
