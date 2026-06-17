---
name: Security hardening decisions
description: Durable conventions for CSRF, CSP, uploads, tenant isolation, audit logging, and self-service role limits in the LYS backend.
---

# Security hardening decisions

## CSP / helmet
- Content-Security-Policy via helmet is enabled **production-only**, gated on `REPLIT_DEPLOYMENT === "1"`.
- **Why:** A full CSP breaks Vite dev server / HMR (inline scripts, ws). Dev must stay unrestricted; only the deployed build gets the strict policy.

## CSRF
- Custom Origin/Referer-host CSRF middleware guards **mutating `/api` requests only** (POST/PUT/PATCH/DELETE), comparing the Origin/Referer host to the request host.
- Inbound webhooks must be exempted — currently `/api/stripe/webhook` is the only one.
- **Why:** Webhooks come from third parties with no same-origin Origin header; without the exemption they'd 403. Stripe is also the only true inbound webhook (HubSpot = authed outbound API calls, Clever = OAuth GET callback).
- **Known limitation:** host comparison is exact-equality against `req.get("host")`; behind a multi-host proxy this could false-403. Fine on Replit's single served host.

## File uploads (multer)
- Both `lessons.ts` and `marketplace.ts` validate uploads with **MIME allowlist AND extension allowlist** (`ALLOWED_UPLOAD_MIME` + `ALLOWED_UPLOAD_EXT`) plus a 10MB size limit.
- **Why:** MIME alone is client-spoofable. Require both to match. Next step if ever needed: magic-byte sniffing (not yet done).

## Tenant isolation
- Any admin endpoint that takes a user-supplied `orgId`/resource id must call `verifyOrgAdminAccess(userId, orgId)` (in `server/routes/_helpers.ts`) before returning org-scoped data — NOT just `isAuthenticated`/`requireRole`.
- `verifyOrgAdminAccess` is true for site/system admin, org admin/owner membership, or parent district_admin. For resource ids, fetch the resource first and verify against its `organizationId`.
- **Why:** Several routes leaked cross-org student PII by trusting a user-supplied orgId.

## Self-service role changes
- `PATCH /api/user/role` must restrict its schema to non-privileged roles only: `z.enum(["student","educator","homeschool_parent"])`. Never accept admin/system roles on a self-service endpoint.
- **Why:** It was `isAuthenticated`-only with a schema allowing all roles → any user could self-promote to system_admin. No client calls this endpoint.

## Audit logging
- Sensitive admin mutations emit `logAuditEvent` (from `server/services/auditLog.ts`): user update/delete, impersonation start, feature-flag create/update/delete.
- Valid `category` values are a fixed union: `auth | data_access | data_modify | admin_action | security | ai_usage | content_moderation | system`. Admin actions use `admin_action`; self-service privilege changes use `security`. `severity` is `info | warning | critical`.
- **Why:** "admin"/"account" are NOT valid categories and fail typecheck.

## App-layer encryption (APP_ENCRYPTION_KEY)
- `server/services/crypto.ts` = AES-256-GCM, key from `APP_ENCRYPTION_KEY` (base64 32 bytes), ciphertext format `enc:v1:<base64(iv12|tag16|ct)>`. Pass `{ authTagLength: 16 }` to both createCipheriv/createDecipheriv (SAST flags GCM without it).
- **Write sensitive fields with strict `encrypt()` (throws if key missing); read with `decryptIfPossible()` (tolerates legacy plaintext).** Do NOT use `encryptIfPossible` on writes — it silently stores plaintext when the key is absent, defeating at-rest encryption.
- Same key encrypts admin MFA secrets (P1) and student PII (P2).
- **Currently encrypted:** `students.notes`, `student_notes.content` (handled in `server/storage/student.ts` + the `getStudentNotesByClass` read in `server/storage/classroom.ts`). Encrypt-on-write/decrypt-on-read lives at the storage layer, so all callers get plaintext transparently. NOT encrypted yet: student email/birthDate, guardian emails, other `notes` columns — and never encrypt columns used in WHERE/lookups.

## Admin MFA step-up (TOTP)
- `requireFreshMfa` middleware + `checkFreshMfa(req)` helper in `server/routes/mfa.ts`; ~5-min freshness window via `session.mfaVerifiedAt`. Applied to admin delete-user, impersonate, role-change. otplib v13 **functional** API (generateSecret/generateURI/verifySync). Admin with no MFA enrolled is forced to enroll before the sensitive action.

## Bulk export controls
- Grades export `GET /api/classes/:classId/grades/export` (server/routes/classroom.ts): authz = class owner OR `hasRolePrivilege(role,"site_admin")` else 403; rate-limited via `exportLimiter` (30/hr) in server/index.ts; audits both `grades.export` (success, data_access) and `grades.export_denied` (warning, security).
- **Why owner-OR-admin, not admin-only:** export is a normal teacher action; admin-only would break teachers. The prior hole let ANY authed user export ANY class by id (IDOR).

## Still not implemented (residual)
- Dependency upgrades for known CVEs (axios, @xmldom/xmldom, esbuild, @babel/core) — needs package.json edit (user approval). SAST mediums: wildcard `postMessage` origins in embed components; HTML-in-template-string escaping. See `threat_model.md` (project root) for the full residual list.
