# Threat Model

## Project Overview

LYS is an AI-powered K-12 education platform. React 18 + TypeScript frontend
(Vite, wouter, TanStack Query, shadcn/ui), Express + TypeScript backend, and
PostgreSQL via Drizzle ORM. Authentication is Replit Auth with `express-session`.
AI features call OpenAI (lesson/assignment/practice generation, embeddings).
Third-party integrations include Stripe (payments), HubSpot, and a Clever SIS
sync. Users span a strict role hierarchy: student → homeschool_parent → educator
→ staff → campus_admin → district_admin → site_admin → system_admin
(`shared/models/auth.ts`, `ROLE_HIERARCHY` / `hasRolePrivilege`). The platform is
multi-tenant: organizations form a School → District → Charter Network hierarchy.

The application handles student educational records (FERPA-regulated), so the
primary security objective is preventing one tenant — or one teacher — from
reaching another tenant's student data, and keeping sensitive student PII out of
logs, external LLM calls, and unauthorized exports.

## Assets

- **Student PII and educational records** — names, emails, birth dates, free-text
  notes (`students.notes`), and educator-authored behavioral/health/parent-contact
  notes (`student_notes.content`). FERPA-protected. Free-text notes are the most
  sensitive because they may contain unstructured health/behavioral observations.
- **User accounts and sessions** — Replit Auth identities and `express-session`
  cookies. Compromise enables impersonation and access to scoped student data.
- **Admin MFA secrets** — TOTP shared secrets (`users.mfaSecret`), stored
  encrypted at rest. Compromise would defeat the admin step-up control.
- **Curriculum / lesson-plan content** — owner-authored teaching material with a
  private-by-default sharing model; cross-tenant disclosure is an audit concern.
- **Application secrets** — `APP_ENCRYPTION_KEY` (field + MFA encryption),
  `DATABASE_URL`, OpenAI keys, Stripe keys, session signing secret, HubSpot/Clever
  credentials. Managed via Replit Secrets, never hardcoded.
- **Audit trail** — `audit_events` records of sensitive actions (exports, role
  changes, deletions, impersonation). Integrity matters for repudiation defense.

## Trust Boundaries

- **Browser → API** — every client request is untrusted. All role and ownership
  checks must be enforced server-side; the frontend sidebar/role gating is UX
  only, not a security control.
- **API → PostgreSQL** — Drizzle parameterizes queries. The DB holds all student
  PII; SQL injection here would be catastrophic.
- **API → OpenAI** — free-text fields cross to a third party. PII is stripped
  pre-LLM by `server/services/piiSanitizer.ts` before generation calls.
- **API → Stripe / HubSpot / Clever** — server-side calls with secret keys;
  webhooks (Stripe) must be signature-verified.
- **Tenant → Tenant** — the School/District/Network hierarchy is a trust boundary.
  Resource reads must be scoped via organization hierarchy + explicit shares, not
  by ID guessability.
- **Role → Role (user vs admin)** — sensitive admin operations (delete user,
  impersonate, role change, bulk export) sit behind both role checks and MFA
  step-up.
- **Anonymous → Authenticated** — marketing landing, practice/lesson generation
  for guests (quota + email gate) are public; everything touching stored student
  data requires a session.

## Scan Anchors

- **Production entry points**: `server/index.ts` (Express bootstrap, rate
  limiters), `server/routes.ts` (route registration), route modules in
  `server/routes/*`.
- **Highest-risk code areas**:
  - Access control: `server/storage/curriculum.ts` (tenant scoping,
    `canViewScope`/`canEditScope`/`getDescendantOrgIds`), `server/routes/curriculum.ts`.
  - Sensitive admin actions + MFA: `server/routes/mfa.ts` (`requireFreshMfa`),
    `server/routes/admin.ts` (delete user / impersonate / role change).
  - Bulk data egress: grades export in `server/routes/classroom.ts`
    (`GET /api/classes/:classId/grades/export`).
  - Crypto: `server/services/crypto.ts` (AES-256-GCM, keyed by `APP_ENCRYPTION_KEY`).
  - PII handling: `server/services/piiSanitizer.ts`, `server/storage/student.ts`
    (field-level encryption of `students.notes` + `student_notes.content`).
- **Public surfaces**: anonymous landing, `/api/lessons/*` and `/api/practice/*`
  guest flows (quota-gated), `/embed/*`.
- **Authenticated surfaces**: classroom, gradebook, student management, portfolios.
- **Admin surfaces**: `server/routes/admin.ts`, system/district admin pages.
- **Dev-only (usually ignore unless proven reachable)**: `artifacts/mockup-sandbox/*`
  (separate Vite preview server), `client/src/pages/DevDocs.tsx`.

## Threat Categories

### Spoofing

Authentication is delegated to Replit Auth; the server validates the session on
every protected route via `isAuthenticated`. Admin step-up uses authenticator-app
TOTP (`server/routes/mfa.ts`): sensitive admin actions require a *fresh* MFA
verification (`requireFreshMfa`, ~5-minute `session.mfaVerifiedAt` window), and an
admin with no MFA enrolled is forced to enroll before performing them. Stripe
webhooks must continue to be verified by signature. TOTP verification uses a small
epoch tolerance to absorb clock skew without widening the replay window unduly.

### Tampering

All authorization decisions are server-side. Role checks use `ROLE_HIERARCHY` /
`hasRolePrivilege`, never client-trusted role claims. Curriculum edit access is
gated by `canEditScope`; non-owners may only *request* edit access. Drizzle
parameterizes all queries, preventing SQL injection at the API→DB boundary.

### Repudiation

Sensitive operations write to `audit_events` via `logAuditEvent` (acting user,
action, category, severity, resource, IP, user-agent, timestamp). Grades export
logs both successful exports (`grades.export`, with row count) and denied attempts
(`grades.export_denied`). Admin delete/impersonate/role-change paths are likewise
audited. Audit writes must remain non-optional on these paths.

### Information Disclosure

This is the dominant risk class for an FERPA platform.
- **Cross-tenant reads**: curriculum and student queries are scoped by
  organization hierarchy and explicit shares, not by guessable IDs. The grades
  export endpoint now enforces ownership (class owner) OR `site_admin`+; any other
  authenticated user is denied and audited. Other IDOR-prone read endpoints should
  follow the same owner-or-admin pattern.
- **PII to third parties**: free-text fields are sanitized pre-LLM
  (`piiSanitizer.ts`) before OpenAI calls.
- **Encryption at rest**: `students.notes` and `student_notes.content` are
  encrypted app-side with AES-256-GCM (`server/services/crypto.ts`), keyed by
  `APP_ENCRYPTION_KEY`. Decrypt-on-read tolerates legacy plaintext, so the field
  set can expand without a migration. **Not yet encrypted** (residual): student
  `email`/`birthDate`, parent/guardian contact emails, and other free-text `notes`
  columns across the schema — see Residual Risks.
- **Secrets in logs**: secrets must never be logged. The HoundDog scan flag on
  `server/services/embeddingService.ts` ("auth token to stdout") is a false
  positive — the warning logs the *name* of an env var as a setup hint, not its
  value. Keep it that way.

### Denial of Service

Public and sensitive endpoints are rate-limited in `server/index.ts`, including a
dedicated `exportLimiter` (30/hour) on the grades export route. Guest AI
generation is quota-gated (5/month per guest bucket). External calls (OpenAI,
Stripe) should retain timeouts/fallbacks; `server/services/fallbackResolver.ts`
already degrades gracefully when OpenAI is unreachable.

### Elevation of Privilege

Role-restricted functionality is enforced server-side via `hasRolePrivilege`, not
the frontend. Admin-only and owner-only operations validate the acting user's role
and resource ownership before acting. MFA step-up adds a second factor in front of
the most damaging admin actions (account deletion, impersonation, role escalation,
bulk export). Impersonation in particular must remain behind both an admin role
check and fresh MFA.

## Residual Risks (as of this review)

1. **Partial PII-at-rest coverage** — only `students.notes` and
   `student_notes.content` are encrypted. Student email/birthDate, guardian
   contact emails, and other `notes`/free-text columns remain plaintext. Expanding
   coverage is low-risk (helper tolerates plaintext) but requires care for any
   column used in `WHERE`/lookups (those cannot be transparently encrypted).
2. **Dependency vulnerabilities** — non-breaking advisories (`axios`,
   `@xmldom/xmldom`, `@babel/core`, `qs`, `ws`, `underscore`, `body-parser`, etc.)
   have been patched via lockfile resolution (`npm audit fix`), dropping the audit
   from 28 to 6 advisories. The remaining 6 require **major** bumps of
   pre-configured build/ORM tooling — `vite`/`esbuild` (the skill forbids touching
   the Vite setup), `drizzle-kit` (build-only), and `drizzle-orm` (a major ORM bump
   is too risky without a dedicated query-regression pass). These are tracked as
   accepted residual risk in the `scripts/audit-deps.mjs` allow-list and the
   `.github/dependabot.yml` ignore list; a Dependabot config + a ready-to-enable
   `.github/workflows/ci.yml` (typecheck + test + audit gate) ship with the repo.
3. **SAST mediums** — `postMessage` wildcard origin (`*`) in embed components
   (`EmbedWrapper.tsx`, `EmbedRouter.tsx`) and HTML-in-template-string in export/
   integration helpers warrant origin allow-listing and output escaping. The embed
   surfaces are intentionally cross-origin but should validate target/sender origin.
4. **Audit log integrity** — audit events now form a SHA-256 hash chain
   (`verifyAuditChain`), making in-place edits, deletions, and forks detectable.
   The chain still shares the application database, so an attacker with full DB
   write access could recompute the whole chain; a periodic off-box hash anchor
   would close this. Acceptable for now.
5. **Retention-purge trigger wiring** — `runRetentionPurge` (3-year) is scheduled
   daily and deletes any user whose `retentionPurgeAt` has passed, but the
   account-closure/inactivity flow that *sets* `retentionPurgeAt` is not yet wired.
   Until that exists, the purge runner is a no-op safety net rather than an active
   lifecycle control. Follow-up: set `retentionPurgeAt = closedAt + 3y` on account
   closure / prolonged inactivity.
6. **DSR endpoint test coverage** — unit coverage exists for crypto, RBAC, the
   COPPA gate, and the audit hash chain (hermetic, no DB). The DSR export/delete
   authorization and anonymize-vs-hard-delete paths are exercised by code but not
   yet covered by DB-backed integration tests (those would mutate a live DB).
   Follow-up: add an ephemeral test DB + fixtures to cover them in CI.
