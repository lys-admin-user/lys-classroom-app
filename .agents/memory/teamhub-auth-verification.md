---
name: Authed-page verification in this repl
description: Why screenshot/curl can't verify logged-in pages here, and how to verify instead
---

Verifying staff/admin-gated pages (e.g. `/team` Team Hub) visually is NOT possible
via the screenshot tool or plain curl in this repl.

**Why:** the `express-session` cookie is `Secure`/`SameSite`, so it is not retained
over the preview origin used by the screenshot browser, and curl over
`http://localhost:5000` never stores it (cookie jar comes back empty). The
`GET /api/dev/login/:role?next=/path` dev switcher returns a 302 but the Set-Cookie
is dropped, so subsequent requests are 401. This is an environment limitation, not a
code bug.

**How to verify instead:**
- tsc (`npx tsc --noEmit`, run backgrounded to `/tmp/tsc.log` via nohup — it OOMs
  in the foreground), vitest (`npx vitest run`), and `curl /health` (200) +
  `curl /api/team/*` (401 unauth → gating works).
- Trust that route handlers reusing the shared `isAuthenticated` +
  `requireStaffOrAdmin`/`requireFoundationAdmin` helpers behave like every other
  gated endpoint.
- A clean browser console after a Vite reload (no "Failed to fetch dynamically
  imported module" / "Invalid hook call") confirms the lazy page compiles; a
  "Sign In Required" screenshot is the expected unauthed state, not a failure.
