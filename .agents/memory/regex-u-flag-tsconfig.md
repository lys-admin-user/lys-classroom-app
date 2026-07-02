---
name: Regex /u flag banned by tsconfig target
description: Why the unicode /u (and /gu) regex flag fails tsc in this repo and what to use instead
---

Do NOT use the unicode regex flag (`/u`, `/gu`, `/iu`, ...) anywhere the code is
typechecked by `tsc` in this repo. It fails compile with `error TS1501: This
regular expression flag is only available when targeting 'es6' or later`.

**Why:** the effective TypeScript `target` for the type-check pass is below ES6,
so tsc rejects the `u` flag even though the runtime (esbuild/vitest) accepts it.
This bites specifically when adding new regexes to `shared/*` files — vitest will
pass green while `npx tsc --noEmit` fails, so tests alone won't catch it.

**How to apply:** write ASCII regexes without the `u` flag (e.g. `/[^a-z0-9]+/g`
not `/[^a-z0-9]+/gu`). These patterns don't need unicode semantics. Always run
`npx tsc --noEmit` (not just vitest) after adding regexes to shared code.

Note: `npx tsc --noEmit` takes ~110s here (near the 120s tool cap). Background
log files written to /tmp, .local, or $HOME get swept mid-run — run tsc
synchronously and pipe through `grep "error TS"` instead of backgrounding it.
