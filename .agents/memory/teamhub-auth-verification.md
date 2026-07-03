---
name: Authed-endpoint verification in this repl
description: How to verify logged-in API flows with curl via dev-login; screenshot still can't show authed pages
---

Authed **API flows** CAN be verified end-to-end with curl via the dev-login
switcher — but three environment quirks must all be worked around:

1. **CSRF**: POSTs without a matching `Origin` header get
   `{"error":"Cross-origin request blocked."}` — send
   `-H "Origin: https://localhost:5000"`.
2. **Secure session cookie**: `express-session` only issues `connect.sid`
   when it deems the connection secure. Over `http://localhost:5000` add
   `-H "X-Forwarded-Proto: https"` (trust proxy is on) to every request.
3. **Cookie jar drops Secure cookies over http**: don't use `-c/-b jar`.
   Capture headers with `curl -D -` and replay the cookie manually via
   `-H "Cookie: connect.sid=..."`.

Working recipe:
```
O='-H Origin:https://localhost:5000'; XF='-H X-Forwarded-Proto:https'
HDRS=$(curl -s -D - -o /dev/null $O $XF -X POST http://localhost:5000/api/dev/login \
  -H 'Content-Type: application/json' -d '{"role":"educator"}')
CK=$(echo "$HDRS" | grep -i '^set-cookie' | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1 | paste -sd'; ')
curl -s $XF -H "Cookie: $CK" http://localhost:5000/api/team/access/me
```
Dev users are `dev-<role>` (seed via `npx tsx scripts/seed-test-users.ts` if 404).
Clean up any rows the test creates (e.g. `staff_access_requests`, progress rows).

**Screenshot tool still cannot show authed pages** (Secure cookie is dropped on
the preview origin) — a "Sign In Required" screenshot is the expected unauthed
state, not a failure. For UI-only checks rely on tsc + vitest + the curl recipe
above for the underlying endpoints.

**Beware stale server code**: the dev workflow does not always hot-reload
server route edits — restart "Start application" before trusting curl results
that look like your changes are missing.
