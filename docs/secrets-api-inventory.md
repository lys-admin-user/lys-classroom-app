# Secrets & API Inventory

This document inventories every secret, API key, and external service the LYS
platform reads at runtime, what it's for, whether it's required, how the app
behaves when it's absent, and rotation guidance. It is the single reference for
provisioning a new environment (dev or production) and for periodic key rotation.

> **Principle:** every external dependency degrades gracefully. The app boots and
> serves traffic with **none** of the optional keys set — affected features simply
> no-op, log, or fall back. Only the keys marked **Required** are needed to run.

## How secrets are managed

- All secrets live in **Replit Secrets** (never hardcoded, never committed).
- The OpenAI integration is provisioned by Replit's managed connector; a bootstrap
  shim (`server/bootstrap-env.ts`, imported first in `server/index.ts`) bridges the
  connector vars to the canonical `OPENAI_*` names so existing clients work
  unchanged.
- Client-exposed values **must** be prefixed `VITE_` (only those are bundled into
  the frontend). Never put a secret behind a `VITE_` prefix — it ships to the
  browser. The only `VITE_` value here is the Turnstile **site** key, which is
  public by design.

## Required (app will not function correctly without these)

| Secret | Purpose | Absent behavior | Rotation |
| --- | --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection (all persistence) | App cannot start / serve data | Provisioned by Replit DB; rotate via DB provider |
| `SESSION_SECRET` | Signs `express-session` cookies | Sessions insecure / login broken | Rotate invalidates all sessions (forces re-login) |
| `APP_ENCRYPTION_KEY` | AES-256-GCM for field-level PII (`students.notes`, `student_notes.content`) + MFA TOTP secrets | Encrypt/decrypt fails for protected fields | **Do not rotate casually** — re-encrypt existing rows first or data becomes unreadable |
| `REPL_ID` / `REPLIT_DOMAINS` / `ISSUER_URL` / `REPL_IDENTITY` | Replit Auth (OIDC) identity + allowed domains | Login broken | Managed by Replit platform |

## AI (OpenAI)

| Secret | Purpose | Absent behavior | Test vs Live |
| --- | --- | --- | --- |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Managed OpenAI key (provisioned by Replit connector) | Bridged to `OPENAI_API_KEY` at boot | Connector-managed |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Managed OpenAI base URL | Bridged to `OPENAI_BASE_URL` at boot | Connector-managed |
| `OPENAI_API_KEY` | OpenAI calls (lessons, assignments, practice, embeddings) | Generators fall back: cache → exemplar → graceful error (`fallbackResolver.ts`); never a hard crash | Same key both envs |
| `OPENAI_BASE_URL` | Override OpenAI endpoint | Defaults to OpenAI public API | — |
| `OPENAI_DIRECT_API_KEY` | Optional direct (non-connector) OpenAI key | Falls back to connector/`OPENAI_API_KEY` | — |
| `VOICE_CRITIC_THRESHOLD` | Voice-critic rewrite cutoff (0-100, default 80) | Defaults to 80 | Not a secret (tuning) |

> **Note:** if both the managed and direct OpenAI keys are missing, generation
> degrades via the fallback cascade — confirm the integration is connected so
> users get real AI output rather than fallbacks.

## Email (transactional / OTP / digests)

Transport selection in `server/services/emailTransport.ts` prefers, in order:
**Resend** → **SMTP** → **Gmail app-password** → **log-only** (non-prod treats
log as deliverable for testability). Login/step-up email 2FA codes ride this same
transport.

| Secret | Purpose | Absent behavior | Notes |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | Resend transactional email (preferred) | Falls back to SMTP/Gmail/log | Add via the Resend connect button (preferred) or as a secret |
| `RESEND_FROM_EMAIL` | From address for Resend | Falls back to `SMTP_FROM`/default | Must be a verified Resend sender/domain |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Generic SMTP transport | Skipped if incomplete | Used only if Resend unset |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Gmail app-password transport | Skipped if unset | Last transport before log-only |
| `DIGEST_EMAIL_TRANSPORT` / `DIGEST_FROM_EMAIL` | Digest email routing/from | Defaults | Operational tuning |

> **Email 2FA dependency:** educator-and-up login MFA can use an emailed code as a
> second factor. With **no** email transport configured, emailed codes can't be
> delivered — in non-prod they're logged so the flow is still testable. Configure
> Resend (or SMTP) in production so the email factor actually reaches users.

## Anti-bot (Cloudflare Turnstile)

| Secret | Purpose | Absent behavior | Exposure |
| --- | --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | Server-side captcha verification (`server/services/captcha.ts`) | `requireCaptcha()` no-ops (allows request) + logs; fail-open on Cloudflare outage | **Secret** — server only |
| `VITE_TURNSTILE_SITE_KEY` | Renders the Turnstile widget in the browser | Widget doesn't render; forms submit without a token | **Public** by design (bundled to client) |

> Enforced on guest generation (practice/lessons/homeschool), demo requests, and
> onboarding completion. Set **both** keys to activate; set neither to disable.

## Payments (Stripe)

| Secret | Purpose | Absent behavior | Test vs Live |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe API (checkout, subscriptions) | Payment flows disabled / error surfaced | **Currently test mode.** Live keys are a separate, deferred task |
| `STRIPE_CONNECT_SECRET` | Stripe Connect (marketplace payouts) | Connect flows disabled | Test mode |

> Stripe **live** keys are intentionally **out of scope** for this hardening round.
> Keep test keys until the dedicated go-live task.

## SIS / CRM / Affiliates / Data

| Secret | Purpose | Absent behavior | Status |
| --- | --- | --- | --- |
| `CLEVER_CLIENT_ID` / `CLEVER_CLIENT_SECRET` | Clever SIS roster sync (live integration) | Clever sync disabled | Only live SIS; others "Coming Soon" |
| `PARTNERSTACK_API_KEY` | PartnerStack affiliate program | Affiliate features no-op | Optional |
| `REWARDFUL_API_KEY` | Rewardful affiliate tracking | Affiliate features no-op | Optional |
| `DATA_GOV_API_KEY` | data.gov lookups (scholarships/standards data) | Falls back / skips enrichment | Optional |

## HubSpot

HubSpot uses the Replit managed connector (`REPLIT_CONNECTORS_HOSTNAME` +
connector token), not a raw API-key env var. Absent → CRM sync no-ops.

## Platform / Operational (set by Replit or non-secret tuning)

| Var | Purpose | Notes |
| --- | --- | --- |
| `NODE_ENV` | Environment mode | `production` in deploys |
| `PORT` | Server bind port | Provided by platform |
| `LOG_LEVEL` | pino log verbosity | Default `info` |
| `SITE_TIMEZONE` | Scheduling/display tz | Default UTC |
| `MODERATION_BACKLOG_THRESHOLD` | Alert threshold | Tuning |
| `REPLIT_CONNECTORS_HOSTNAME` | Connector resolver host | Platform-set (OpenAI/HubSpot/Resend connectors) |
| `REPLIT_DEPLOYMENT` / `REPLIT_DEV_DOMAIN` / `WEB_REPL_RENEWAL` | Replit runtime context | Platform-set |

## Rotation guidance (summary)

- **`APP_ENCRYPTION_KEY`** — highest blast radius. Rotating without re-encrypting
  existing rows makes encrypted PII + MFA secrets unreadable. Plan a migration.
- **`SESSION_SECRET`** — safe to rotate; logs everyone out.
- **API keys (OpenAI, Resend, Stripe, Turnstile, Clever, etc.)** — rotate at the
  provider, update the Replit Secret, redeploy. App tolerates brief absence
  (graceful no-op/fallback), so rotation has no hard downtime for core flows.
- **Never** log secret values. The HoundDog flag on `embeddingService.ts` is a
  known false positive (it logs an env var *name* as a setup hint, not its value).

## Activation checklist for full production

1. **Resend** — connect via the Resend integration button (or set `RESEND_API_KEY`
   + a verified `RESEND_FROM_EMAIL`) so transactional + email-2FA mail is delivered.
2. **Turnstile** — add `TURNSTILE_SECRET_KEY` (secret) and `VITE_TURNSTILE_SITE_KEY`
   (public) to enable anti-bot on signup/onboarding/guest generation.
3. **Stripe live** — deferred to the dedicated go-live task (test mode for now).
4. Confirm **OpenAI** integration is connected (else generation uses fallbacks).
