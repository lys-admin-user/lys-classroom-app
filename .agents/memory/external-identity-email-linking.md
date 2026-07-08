---
name: External-identity → local-user email linking
description: Security invariant for linking Clerk/SSO identities to existing local accounts by email.
---

# External-identity email linking must require a verified email

When an external identity provider (Clerk, SAML/OIDC SSO) logs a user in and we
bind that identity to an EXISTING row in the local `users` table by matching
email, the match may only happen when the caller has proven the email really
belongs to that person.

**Rule:** `authStorage.upsertUser(data, { emailVerified })` only performs the
email-based link branch when `emailVerified === true`. The Clerk session
establisher computes it from `primaryEmail.verification.status === "verified"`
and refuses to establish a session (returns `next()`, stays anonymous) when a
Clerk email is present but unverified. SSO passes `emailVerified: true` because
the IdP assertion is trusted. `clerkId`-based lookup and brand-new-user creation
are unaffected.

**Why:** Without the gate, an attacker could add (but not prove) a victim's
email in Clerk and take over the victim's existing account — including its role,
MFA, and data. Flagged as a critical/blocking account-takeover risk in code
review of the Replit-Auth→Clerk migration.

**How to apply:** Never re-broaden the email-link branch to run without a
verified-email assertion. Any new external-auth path that reaches `upsertUser`
must pass an accurate `emailVerified`, defaulting to NOT linking by email.

## Concurrent first-login race → duplicate-key on insert
The SPA fires several `/api` calls at once, and the Clerk establisher runs on
every one. On a brand-new user, none of them find an existing row, so they all
race to INSERT the same identity; the losers throw Postgres `23505` (unique
violation on email/clerkId) and login is flaky + noisy
(`[auth] clerk establisher failed: duplicate key ... users_email_unique`).

**Rule:** `upsertUser` must be idempotent under this race — on `23505`, retry
resolution ONCE (`isRetry` guard) so the winner's row is found via clerkId
(step 1) or verified-email (step 2). Do NOT "fix" it by dropping the unique
constraint or by removing the verified-email gate. **Why:** the constraint is
the safety net; the retry (not weaker validation) is the correct recovery.

