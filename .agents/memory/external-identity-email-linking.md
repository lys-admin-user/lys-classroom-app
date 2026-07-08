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
