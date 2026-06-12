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

## Reported, not implemented (need product input)
- MFA/step-up for admins, field-level encryption (key mgmt + migration), bulk-export controls, scheduled dependency/SAST scans + threat model. Curriculum scope sharing endpoints left as-is pending a product decision on intended cross-org sharing.
