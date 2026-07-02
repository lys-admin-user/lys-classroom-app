---
name: Grade selector value contract
description: The six grade pickers do NOT share one value format; the shared normalizer must tolerate all of them or standards silently broaden.
---

# Grade selector value contract

Grade selectors send **different value shapes** to the backend, all funneled through
`normalizeGradeToken` / `expandGradeSelectionToTokens` in `shared/gradeLevels.ts`:

- Lesson / Practice / Homeschool / Educator Profile → display values from
  `US_GRADE_OPTIONS` (e.g. `"Grade 3"`, `"Kindergarten"`, `"Pre-K"`).
- Onboarding → band-grouped **ids** (`"pre_k"`, `"K"`, `"1".."12"`, `"post_secondary"`)
  AND separate **band keys** (`"early_childhood"`, `"elementary"`, ...). Backend reads
  `prefs.gradeBands || prefs.gradeLevels`, so band keys must resolve too.
- International/African jurisdictions pass their own country-specific labels
  (best-effort; many correctly normalize to `null` and rely on the static fallback).

**Why this matters:** `standardMatchesGrades` treats an **empty selected-token set as
match-all**. So if a real grade value fails to normalize (returns `null`), the filter
does NOT narrow — it silently returns ALL standards. A value-contract mismatch reads
as "alignment quietly stopped working," not as an error.

**Incident:** Onboarding's `"pre_k"` id (underscore) was not matched by
`normalizeGradeToken` (it only handled `pre-k` / `pre k`), so Pre-K onboarding
selections collapsed to empty → match-all. Fix widened the regex to `pre[\s_-]?k`.

**How to apply:** When adding a new grade picker or a new grade value anywhere, add a
normalization case + unit test in `shared/gradeLevels.test.ts`. Never assume a new
selector uses the same string format as the others. Band keys live in `BAND_TOKENS`.
