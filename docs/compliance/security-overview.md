# Security Overview & SOC 2 Control Mapping

This document describes the technical and organizational controls implemented in
the LYS platform and maps them to the **SOC 2 Trust Services Criteria (TSC)**.
It is intended as evidence to accelerate a future SOC 2 Type II audit. It is a
self-assessment; it is **not** an audited SOC 2 report.

Last reviewed against the codebase: see git history for this file.

## Data we process

- Student educational records (FERPA-regulated): names, emails, birth dates, and
  educator-authored free-text notes (behavioral / accommodation / contact).
- Account + session data (Replit Auth identities, `express-session`).
- Admin MFA secrets (TOTP), stored encrypted.
- Curriculum / lesson content authored by educators.

See [`subprocessors.md`](./subprocessors.md) for third parties that may process
this data, and `threat_model.md` at the repo root for the full threat model.

## Control mapping

### Security / Common Criteria (CC)

| TSC | Control | Where it lives |
| --- | --- | --- |
| CC6.1 Logical access | Replit Auth on every protected route (`isAuthenticated`); role checks via `ROLE_HIERARCHY` / `hasRolePrivilege`, enforced server-side only. | `server/replit_integrations/auth`, `shared/models/auth.ts` |
| CC6.1 Encryption at rest | App-side AES-256-GCM for sensitive free-text (`students.notes`, `student_notes.content`), keyed by `APP_ENCRYPTION_KEY`. | `server/services/crypto.ts`, `server/storage/student.ts` |
| CC6.1 Encryption in transit | TLS terminated by the Replit deployment platform. | Deployment platform |
| CC6.3 Least privilege | Tenant scoping by org hierarchy + explicit shares; campus/district admins limited to their sub-tree; global override only for `site_admin`/`system_admin`. | `server/storage/curriculum.ts`, `server/routes/dsr.ts` |
| CC6.6 Step-up auth | TOTP MFA required (fresh, ~5-min window) for account deletion, impersonation, role escalation, bulk export. | `server/routes/mfa.ts`, `server/routes/admin.ts` |
| CC6.7 Data sent to third parties | PII stripped before any OpenAI call; AI inputs additionally moderated. | `server/services/piiSanitizer.ts`, `server/services/contentSafety.ts` |
| CC7.2 Monitoring / logging | Structured pino logging with secret redaction + per-request `x-request-id`; `/health` + `/ready` endpoints. | `server/observability.ts`, `server/index.ts` |
| CC7.2 Audit trail integrity | `auditLogs` form a SHA-256 hash chain; `verifyAuditChain` detects edits/deletes/forks. | `server/services/auditLog.ts` |
| CC7.4 Incident input | Audit events record acting user, action, IP, user-agent, timestamp for sensitive ops (export, role change, delete, impersonate). | `server/services/auditLog.ts` |
| CC8.1 Change management | Dependency audit gate + Dependabot config + ready-to-enable CI (typecheck/test/audit). | `scripts/audit-deps.mjs`, `.github/` |

### Confidentiality

| TSC | Control | Where it lives |
| --- | --- | --- |
| C1.1 Identify confidential data | Field-level sensitivity classification in PII sanitizer + encrypted columns. | `server/services/piiSanitizer.ts` |
| C1.2 Disposal | GDPR/CCPA erasure: self-serve accounts hard-deleted, school-owned student records anonymized; 3-year retention purge scheduler. | `server/services/dataSubjectService.ts`, `server/routes/dsr.ts` |

### Processing Integrity

| TSC | Control | Where it lives |
| --- | --- | --- |
| PI1.1 Input validation | All request bodies validated with Zod before reaching storage. | route modules, `shared/schema.ts` |
| PI1.2 AI content safety | Student-facing AI inputs moderated (CIPA filtering + self-harm crisis handling). | `server/services/contentSafety.ts` |

### Privacy

| TSC | Control | Where it lives |
| --- | --- | --- |
| P1–P8 | COPPA age gate (under-13 self-serve blocked), consent-gated analytics, DSR export/erasure, data-residency rules. | `server/routes/account.ts`, `server/services/dataSubjectService.ts` |

### Availability

| TSC | Control | Where it lives |
| --- | --- | --- |
| A1.1 Rate limiting | Per-route limiters incl. a dedicated export limiter (30/hr); guest AI quota (5/mo). | `server/index.ts` |
| A1.2 Graceful degradation | OpenAI fallback cascade (cache → exemplar → explicit error) keeps generation usable when the model is unreachable. | `server/services/fallbackResolver.ts` |

## Known residual risks

Tracked in `threat_model.md` (root). Summary: partial PII-at-rest coverage,
a small set of accepted build-tool dependency advisories, embed `postMessage`
origin hardening, an off-box audit anchor, retention-trigger wiring, and
DB-backed DSR integration tests.

## What an auditor still needs (not in code)

- Engaged SOC 2 auditor + observation period (Type II).
- Written policies (access, incident response, vendor management, BCP/DR).
- Background checks / security training records for staff.
- Penetration test report.
