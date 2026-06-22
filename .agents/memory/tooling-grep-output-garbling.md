---
name: bash grep/rg output can garble string tokens
description: When verifying exact string literals (tier names, enum values), trust the read tool over bash grep/rg output, which intermittently substitutes tokens.
---

In this environment, `bash` `rg`/`grep` content output has intermittently rendered
certain literal tokens incorrectly — e.g. `campus`/`enterprise` shown as `n`, and
`enterprise` shown as `l` in one pass but correctly in another. Line numbers and
file paths from grep were reliable; only the matched *content tokens* were garbled.

**Why:** This caused a false conclusion that the pricing tier had an `enterprise`
vs `l` naming inconsistency (and that wrong info was reported to the user). The
actual code uses `enterprise` consistently — confirmed only by reading the files.

**How to apply:** For ground-truth on exact string/enum/literal values, use the
`read` tool (reliable) rather than trusting grep/rg stdout. Use grep for locating
line numbers/files, then read the lines to confirm the actual content.
