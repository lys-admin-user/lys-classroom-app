---
name: Enterprise SSO (OIDC) design
description: How per-org OIDC SSO works alongside Replit Auth, and the security invariants that must hold.
---

# Enterprise SSO (OIDC)

Per-organization SSO runs alongside the default Replit Auth. Config lives in the
`sso_connections` table (orgId, provider, issuerUrl, clientId, clientSecret enc,
allowedDomains[], defaultRole, autoProvision, enabled). Uses `openid-client` v6
(`import * as client`) with discovery cached via `memoizee`; auth flow does
PKCE + state + nonce, all verified in the callback.

## Security invariants (do not regress)

- **Domain allowlist is enforced server-side at provisioning**, not just in the
  `/api/sso/lookup` UX endpoint. `provisionSsoUser` calls `emailMatchesConnection`
  and throws if the IdP-returned email's domain is not in the connection's
  `allowedDomains`. **Why:** the login URL (`/api/sso/login/:connectionId`) takes
  any connection id, so without this a user authenticated by the IdP could be
  provisioned into an org they don't belong to. **How to apply:** any new code
  path that creates/links a user from SSO claims must go through this check.
- SSO-provisioned users get only non-privileged roles — `sanitizeProvisionRole`
  clamps to `SSO_PROVISIONABLE_ROLES` (student/educator/homeschool_parent),
  defaulting to student. Elevated roles only via admin flows.
- Org-admin CRUD/test routes are tenant-scoped via `verifyOrgAdminAccess`
  (server/routes/_helpers.ts).
- Session compatibility: callback builds `req.login` payload with
  `claims.sub` + `expires_at` so the existing `isAuthenticated` guard accepts SSO
  sessions. No refresh token, so users re-login at token expiry.

## Known residual (pre-existing, not introduced here)

- `verifyOrgAdminAccess` district-admin path grants descendant-org access from
  generic parent-org membership (not strictly admin/owner). Shared helper used by
  other routes; changing it needs a dedicated cross-route pass.
- SSO secrets use `encryptIfPossible` (same pattern as SIS connections), which
  falls back to plaintext if `APP_ENCRYPTION_KEY` is absent.
