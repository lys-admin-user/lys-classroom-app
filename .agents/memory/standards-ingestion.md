---
name: Standards ingestion (full & real)
description: How to bring K-12 standards into LYS so they are complete and authoritative, not partial samples.
---

# Standards ingestion must be FULL and REAL

Standards from any authority must be the complete, real published set — never
partial samples, hand-typed codes, or fabricated content.

**Why:** This is an explicit product principle for the LYS standards system; the
static fallback file historically held tiny hand-typed samples, and the LLM
extractor used to silently truncate long documents — both produced partial
ingestion that teachers would mistake for full standards.

**How to apply:**
- Prefer the **Common Standards Project (CSP)** sync (`cspService.ts`). It is a
  public API (no key) that returns the full standard tree. CSP often carries
  multiple editions per course — always pick the most current edition.
- CSP tags Texas CTE sets with a generic shared subject (e.g. "CTE (2010-)").
  The runtime cascade keys subject lookups on `standard_sets.subject`, so after
  ingesting, OVERRIDE the set's `subject` to a clean, **course-specific** label.
  Each course needs a unique subject label or `listCodes` (first set by exact
  subject) collides and hides courses.
- CSP-ingested standards have NO per-standard grade level (grade is set-level),
  so grade-filtered code lookups can come back empty — known limitation.
- `shared/standards.ts` is ONLY a labeled last-resort fallback
  (`source: "fallback"`) for unseeded jurisdictions. Not authoritative; do not
  delete it (international jurisdictions rely on it).
- The LLM/PDF extractor must process the ENTIRE document in chunks (never a
  silent char-slice), dedupe merged chunks by **code + statement** (code-only
  keys drop distinct standards when the model re-numbers per chunk), and treat
  incomplete extraction as a HARD failure (don't auto-complete) so partial data
  is never published.
