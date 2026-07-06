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

**Why:** Task #46 required staff+ with no enrolled authenticator to be forced to
enroll. A first pass only surfaced `enrollmentRequired` from the gate/status, but
a not-yet-enrolled staff user could still call `/api/mfa/email/verify` (email OTP)
and get marked fresh, silently bypassing enrollment. Code review flagged this as
the sole blocker.

**How to apply:** use the pure predicate `mustEnrollAuthenticator(role,
hasAuthenticator)` in `server/services/mfaAccessPolicy.ts` (staff+ AND no real
`mfaEnabled && mfaSecret`). Any verify path that would set `mfaVerifiedAt` must
reject with `{ enrollmentRequired: true }` when it returns true — except the
intentional master-code (`123456`) early-return, which stays exempt by product
decision.
