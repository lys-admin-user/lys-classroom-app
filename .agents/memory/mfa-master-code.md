---
name: MFA master code override (now DISABLED)
description: The fixed master MFA code was disabled 2026-07-23 by product-owner request; admin MFA-reset replaces it.
---

# MFA master code override — DISABLED

The fixed master MFA code (`MASTER_MFA_CODE` in `server/services/mfaService.ts`)
was accepted for every user until 2026-07-23, when the product owner asked to
"implement best practices". `MASTER_MFA_CODE_ENABLED` is now **false** — real
per-user TOTP / email OTP / recovery codes are required everywhere.

**Why:** Product-owner decision reversing the earlier shared-default-code
request. Do NOT re-enable the master code without an explicit new request.

**Replacement for locked-out users:** admin MFA-reset —
`POST /api/admin/users/:id/reset-mfa` (site_admin+, fresh MFA, must outrank the
target, cannot self-reset; clears enrollment + trusted devices + recovery codes,
audited as `admin.user_mfa_reset`). UI: shield button in SystemAdmin Manage Users.

**Break-glass:** `/api/mfa/disable` also accepts a FRESH session step-up (e.g.
email OTP) in addition to TOTP/recovery codes, so a sole admin who lost both
authenticator and recovery codes can still self-recover via email verification.
Don't remove that fresh-session path — it's the deliberate lockout escape hatch.
