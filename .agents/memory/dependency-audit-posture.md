---
name: Dependency audit posture
description: Which npm advisories are deliberately deferred and the two places that encode that.
---

After `npm audit fix`, 6 advisories remain — all require **major** bumps of
pre-configured tooling and are intentionally NOT applied:

- `vite` / `esbuild` — bumping vite to the fixed major breaks the pre-configured
  Vite setup (the fullstack-js skill forbids touching `vite.config.ts`/`server/vite.ts`).
- `drizzle-kit` — build/migration tool only (its esbuild-kit chain is the source).
- `drizzle-orm` — runtime ORM; a major bump (0.39 → 0.45+) risks silent query
  breakage and needs a dedicated regression pass, not a hardening drive-by.

**Why this matters:** the deferral is encoded in TWO places that must stay in
sync — the allow-list in `scripts/audit-deps.mjs` (the CI/validation audit gate,
which fails on any non-allow-listed high/critical) and the `ignore` list in
`.github/dependabot.yml`. If you ever take the major upgrade, remove the package
from BOTH.

**How to apply:** the `audit` validation check + the `.github/workflows/ci.yml`
audit step run `node scripts/audit-deps.mjs`; it passes only because these are
allow-listed. Don't add new packages to the allow-list without a written reason.
