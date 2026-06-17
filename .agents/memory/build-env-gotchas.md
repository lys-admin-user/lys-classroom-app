---
name: Build/env gotchas
description: Environment quirks for building/installing/typechecking in this repl.
---

- **Installing packages**: bash `npm install` is blocked in this sandbox. Use the
  packager tool (`installLanguagePackages({language:"nodejs", packages:[...]})`
  via code execution). `npm audit fix` from bash DOES work and only touches the
  lockfile for transitive resolutions (it left package.json direct deps unchanged
  here).
- **Typecheck**: `npm run check` tends to time out. Use a bounded
  `timeout 115 npx tsc --noEmit` instead.
- **Long identifiers in bash/rg output**: bash/ripgrep sometimes visually mangle
  very long identifiers (showing fragments like `n` / `n-logs`). The files are
  actually fine — confirm with the read tool, not the terminal echo.
