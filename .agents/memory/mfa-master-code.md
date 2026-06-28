---
name: MFA master code override
description: Why the fixed code 123456 is accepted for every user's MFA, and how to turn it off.
---

# MFA master code override

A fixed master MFA code (`123456`) is accepted for EVERY user in EVERY
environment (dev and production). This is controlled by `MASTER_MFA_CODE_ENABLED`
in `server/services/mfaService.ts`. When enabled, `isMasterMfaCode()` short-circuits
`verifyToken` plus the `/api/mfa/verify` and `/api/mfa/email/verify` routes, and
`checkFreshMfa` reports a usable factor so step-up never forces enrollment.

**Why:** Explicit product-owner request — "set MFA to a fixed default 123456 for
all users until told otherwise." A security scan / architect WILL flag this as a
critical vulnerability (shared static secret collapses MFA assurance on an FERPA
platform). That flag is expected and accepted; do NOT silently "fix" or remove it.

**How to apply:** To return to real per-user TOTP/email verification, set
`MASTER_MFA_CODE_ENABLED = false` (or delete the master-code block and its call
sites). The override was deliberately scoped to ACCEPT the code everywhere without
newly FORCING the login-MFA gate — `requireLoginMfa` still keys off real factors
(`mfaEnabled && mfaSecret` or deliverable email), so users who weren't gated before
are not newly gated. Preserve that distinction if you touch this.
