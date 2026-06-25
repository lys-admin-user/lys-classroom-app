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

# Official-DOE-vs-backup trust policy (labeling/ranking only)

The catalog ranks each `standard_sets` row into a trust tier via
`classifySetSource()` (`shared/standards.ts`) and the runtime cascade
(`standardsCatalog.ts`) picks the **highest** `catalogTierRank` set per subject
(DOE wins, the CSP duplicate is hidden). Tiers: official > backup/curated >
unverified > fallback.

**Why:** Official state DOE sources are authoritative; CSP is a backup. A
manual/PDF upload must NOT masquerade as official until a human confirms it.

**How to apply:**
- US states pass `enforceOfficialLink: true` — a `csp`/`case` set is `official`
  ONLY if its `documentUrl` clears `isOfficialDoeLink(url, abbr)` OR a site admin
  stamped `lastVerifiedAt`. Otherwise `backup`. A null `documentUrl` => `backup`
  by design (never fabricate official). Do NOT "fix" this by falling back to the
  jurisdiction URL — that would over-promote.
- `isOfficialDoeLink` is STATE-SCOPED: the host must match the SELECTED state's
  own `officialDomains`, or a state-scoped public host for that state
  (`*.k12.<abbr>.us` / `*.state.<abbr>.us`). A bare federal `.gov` or another
  state's domain is NOT official — a generic `.gov` shortcut over-promotes
  cross-state / non-authority links. `lastVerifiedAt` is the only override.
- International (non-US) passes `enforceOfficialLink: false` so ministry CSP syncs
  STAY `official` (no DOE-link reference exists). Don't regress this to backup.
- `manual`/`pdf_import` sets are `unverified` until `lastVerifiedAt` (the existing
  `POST /api/admin/standards/sets/:id/verify`, requireSiteAdmin) flips them to
  `official` — that endpoint is the "verify" action; no separate promote step.
- On manual upload staging, `notifyManualStandardsUploaded` (notificationsService)
  fans out in-app to **site_admin + system_admin** AND sends a direct email
  (the only standards trigger that emails immediately vs. digest-only).
- 50-state+DC reference data lives in `shared/usStandardsAuthorities.ts`; seed the
  existing `authorities` table from it via `npx tsx scripts/seed-us-authorities.ts`
  (official domains stored in `authorities.metadata` jsonb — no new table/column).
- Tests are hermetic (no DB); cover the policy at the `classifySetSource` /
  `isOfficialDoeLink` / `catalogTierRank` level, not via DB integration.
