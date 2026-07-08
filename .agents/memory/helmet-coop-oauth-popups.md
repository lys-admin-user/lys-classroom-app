---
name: Helmet COOP breaks Clerk/OAuth popups
description: Why helmet's default Cross-Origin-Opener-Policy breaks popup-based social login, and the CSP origins Clerk needs in production.
---

# Helmet default COOP severs OAuth popups (window.opener is null)

`helmet()` in `server/index.ts` is applied in ALL environments (only the
`contentSecurityPolicy` block is gated to production). Helmet's default
`Cross-Origin-Opener-Policy: same-origin` cuts the opener link to any
cross-origin popup, so a popup-based social login (Google via Clerk) cannot
`postMessage` its result back to the opener window.

**Symptom:** browser console shows `TypeError: can't access property
"postMessage", window.opener is null` (from Clerk's Account-Portal Next.js
bundle) followed by "a client-side exception has occurred". Happens in dev too,
because helmet runs in dev.

**Fix:** set `crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }`.
That keeps COOP isolation for the page while letting popups it opens retain the
opener reference. Do NOT use `unsafe-none` (needlessly weak).

**Why:** popup OAuth relies on `window.opener.postMessage`; `same-origin` COOP
nulls `window.opener` for cross-origin popups.

## Clerk production CSP requirements
The production-only CSP must also allow Clerk or login breaks once deployed:
- `scriptSrc`: `'unsafe-eval'` (Clerk's Cloudflare bot challenge needs it),
  `https://*.clerk.accounts.dev`, `https://*.clerk.com`, `https://clerk.com`,
  `https://challenges.cloudflare.com`, and the first-party Clerk domain
  (`clerk.<yourdomain>`, e.g. clerk.lyslessonplanning.com — wildcards do NOT
  cover it). Env override: `CLERK_FRONTEND_API_URL`.
- `frameSrc`: challenges.cloudflare.com + the Clerk origins.
- `workerSrc`: `'self'`, `blob:`.
- `connectSrc`/`imgSrc` already use broad `https:` so Clerk FAPI + img.clerk.com
  are covered.

**How to apply:** whenever touching security headers, remember social login is
popup-based; verify the dev response header is `same-origin-allow-popups` and,
before publishing, that no Clerk `clerk.js`/challenge-frame CSP violations fire
on the production domain.
