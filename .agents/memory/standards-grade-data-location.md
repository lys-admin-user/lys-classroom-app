---
name: Standards grade data location
description: Where grade level actually lives in the CSP-ingested standards schema, and why per-standard grade filtering is a no-op.
---

# Grade data for standards lives on the SET, not the standard

`educational_standards.grade_level` is empty (NULL) across the entire ingested
CSP corpus (~1.6M rows). Real grade info lives on `standard_sets.education_levels`
— a jsonb string array like `["09","10","11","12"]`, `["Pre-K","K","01",...]`, and
occasionally non-grade junk like `"VocationalTraining"`.

**Why:** the CSP sync populates education levels at the set (course) granularity;
individual standards inside a set carry no grade. So any grade filter that reads
`standard.gradeLevel` silently degrades to "no grade info → match all" and returns
every subject/standard for every grade (a no-op that looks like it works).

**How to apply:** gate grade alignment at the SET level via
`educationLevelsCoverGrades(set.educationLevels, selectedTokens)` (in
`shared/gradeLevels.ts`). Because a subject can be split into per-grade course
sets, a subject should show if ANY of its sets covers the grade, and code listing
should prefer the highest-trust set that covers the grade. Treat empty selection /
no levels / all-unparseable levels as cover-all so you never wrongly hide a set you
can't confidently place. `normalizeGradeToken` already maps `"09"→"9"`,
`"Pre-K"→"PK"`, `"K"→"K"`, and junk→null.
