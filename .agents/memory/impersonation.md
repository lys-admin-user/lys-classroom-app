---
name: True user impersonation (admin "see it as this user")
description: How admin impersonation swaps the effective user, and the constraints that make it safe.
---

# True impersonation

Site/system admins can truly "see the app as" another user, not just a cosmetic banner.

## How it works
- `req.session.impersonating = { userId, originalAdminId, startedAt, userName }` is the source of truth.
- A global middleware in `setupAuth` (right after `passport.session()`, so it runs before `requireLoginMfa` and all `/api` routes) swaps the effective identity: it replaces `req.user` with a **shallow copy** whose `claims.sub` = target id, and sets `req.impersonatorId` = real admin id.
- Downstream `isAuthenticated`, role gates, and storage lookups then all run as the target user.

## Non-obvious constraints (do not regress)
- **Never mutate `req.user.claims` in place.** `deserializeUser` returns the session-backed object *by reference*, so in-place mutation corrupts the admin's stored session permanently. Always replace with a copy.
- **Refresh the real admin's token BEFORE swapping.** `isAuthenticated`'s refresh path calls `updateUserSession(req.user)`; after the swap `req.user` is a copy, so a rotated refresh token would never persist to the session and later requests would 401. The middleware refreshes the real session object first, then copies.
- **Exempt the control endpoints** (`/api/admin/stop-impersonation` and `POST /api/admin/users/:id/impersonate`) from the swap, or the admin loses their own identity + MFA context needed to start/stop.
- **Re-verify authorization on every request**: if the real user is no longer `site_admin+`, the middleware clears the flag (a demoted admin cannot keep impersonating).
- **Anti-escalation at start**: cannot impersonate yourself, and cannot impersonate a role that outranks your own (`hasRolePrivilege(actorRole, targetRole)`).

**Why:** FERPA platform — impersonation is a high-blast-radius admin power; the guardrails above prevent session corruption, privilege escalation, and broken auth mid-session.

## Known residual (accepted, not yet done)
- Per-action audit attribution during impersonation is incomplete: most audited actions log as the *target* user unless the audit call includes `req.impersonatorId`. Only start/stop events are attributed to the real admin. Propagating `req.impersonatorId` into the audit pipeline globally is the follow-up.
