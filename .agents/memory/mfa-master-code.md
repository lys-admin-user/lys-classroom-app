---
name: MFA master code override
description: Why a fixed master MFA code is accepted for every user, and how to turn it off.
---

# MFA master code override

A single fixed master MFA code (its value lives in `MASTER_MFA_CODE` in
`server/services/mfaService.ts`) is accepted for EVERY user in EVERY environment
(dev and production). This is controlled by the `MASTER_MFA_CODE_ENABLED` flag.
When enabled, `isMasterMfaCode()` short-circuits `verifyToken` plus the
`/api/mfa/verify` and `/api/mfa/email/verify` routes, and `checkFreshMfa` reports a
usable factor so step-up never forces enrollment.

**Why:** Explicit product-owner request — make MFA accept a fixed default code for
all users until told otherwise. A security scan / architect / validation review
WILL flag this as a critical vulnerability (a shared static code collapses MFA
assurance on an FERPA platform). That flag is expected and accepted; do NOT
silently "fix" or remove it, and do not treat the review rejection as a real defect.

**How to apply:** To return to real per-user TOTP/email verification, set
`MASTER_MFA_CODE_ENABLED = false` (or delete the master-code block and its call
sites). The override was deliberately scoped to ACCEPT the code everywhere without
newly FORCING the login-MFA gate — `requireLoginMfa` still keys off real factors
(`mfaEnabled && mfaSecret` or deliverable email), so users who weren't gated before
are not newly gated. Preserve that distinction if you touch this.
