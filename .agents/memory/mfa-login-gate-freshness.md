---
name: MFA login-gate freshness invariant
description: Why every factor-verify path (not just the gate) must enforce forced-enrollment for required roles
---

The login-2FA gate (`requireLoginMfa`) treats a session as passed purely from
`session.mfaVerifiedAt` freshness. ANY endpoint that sets `mfaVerifiedAt`
(`/api/mfa/verify`, `/api/mfa/email/verify`, `/api/mfa/activate`) therefore
satisfies the gate — regardless of the request's stated `purpose` ("login" vs
"mfa" step-up).

**Rule:** a "forced enrollment" / "no fail-open" requirement for a role cannot be
enforced only in the gate or only on the "login" purpose. It must be enforced in
EVERY factor-verify path before that path sets `mfaVerifiedAt`.

**Why:** Staff+ with no enrolled authenticator must be forced to enroll. Surfacing
`enrollmentRequired` only from the gate/status is insufficient: a not-yet-enrolled
staff user can still call `/api/mfa/email/verify` (email OTP) and get marked fresh,
silently bypassing enrollment. Similarly, a stale trusted-device cookie or leftover
recovery codes can bypass the gate — so forced-enrollment must beat the
`fresh`/`trustedDevice` allow shortcuts, and disabling MFA must revoke trusted
devices + recovery codes.

**How to apply:** use the pure predicate `mustEnrollAuthenticator(role,
hasAuthenticator)` in `server/services/mfaAccessPolicy.ts` (staff+ AND no real
`mfaEnabled && mfaSecret`). Any verify path that would set `mfaVerifiedAt` must
reject with `{ enrollmentRequired: true }` when it returns true — except the
intentional master-code (`123456`) early-return, which stays exempt by product
decision.
