---
name: Express mounted-middleware paths
description: Path-matching pitfall for middleware mounted under a prefix (e.g. app.use("/api", mw)).
---

When a middleware is mounted with a path prefix — `app.use("/api", mw)` — inside
that middleware `req.path` is **relative to the mount point** (e.g.
`/mfa/email/send`), NOT the absolute URL (`/api/mfa/email/send`). `req.baseUrl`
holds the mount prefix (`/api`).

**Why:** a login-MFA gate mounted at `/api` had an exempt list written with full
`/api/...` prefixes but matched against `req.path`, so the exemptions never fired
— the gate could 403 the very endpoints (`/api/mfa/email/send|verify`) needed to
satisfy it, creating a lockout loop.

**How to apply:** when an exempt/allow list uses absolute paths, match against
`(req.baseUrl || "") + req.path` (or `req.originalUrl` minus query string), not
`req.path` alone. Conversely, if you keep matching `req.path`, write the list with
mount-relative paths.
