// Single source of truth for the lesson-generator's "what standards exist
// for this country + state + subject?" cascade. Before this service existed,
// the same DB → static-file → generic-international fallback was duplicated
// three times across `server/routes/org.ts` (states, subjects, codes, and a
// fourth my-codes variant), with subtle drift between them — most notably
// inconsistent US state-name vs abbreviation lookups, inconsistent source
// tagging, and inconsistent handling of "jurisdiction exists but has no
// standard sets attached" (common for the curated international seeds).
//
// All four cascade endpoints now route through this module. New endpoints
// (e.g. an admin coverage dashboard, or a "what would this teacher see"
// preview) MUST use these helpers instead of re-implementing the cascade.

import { storage } from "../storage";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  standardsJurisdictions,
  standardsFallbackMisses,
} from "@shared/schema";
import {
  classifyDbSource,
  isCoverageOptionalCountry,
  type CatalogSourceTier,
} from "@shared/standards";
import {
  US_STATES,
  getStateNameFromAbbr,
} from "../routes/_helpers";

export type CoverageMode = "codes_required" | "outcomes_only" | "unmapped";

export interface CatalogState {
  state: string;
  abbreviation: string;
  standardsName: string;
  source: CatalogSourceTier;
  sourceUrl?: string | null;
  coverageMode: CoverageMode;
}

export interface CatalogSubject {
  subject: string;
  source: CatalogSourceTier;
  sourceUrl?: string | null;
}

export interface CatalogCode {
  code: string;
  description: string;
  gradeLevel?: string | null;
  source: CatalogSourceTier;
  sourceUrl?: string | null;
}

// Countries (or "Common Core") whose jurisdictions publish per-outcome codes
// and therefore default to `codes_required`. Everything else defaults to
// `outcomes_only` so teachers in code-poor curricula aren't blocked by the
// "you must pick a standard code" gate.
function defaultCoverageMode(country: string): CoverageMode {
  return isCoverageOptionalCountry(country) ? "outcomes_only" : "codes_required";
}

/**
 * Resolve a US state to a DB jurisdiction by NAME (e.g. "Texas"), not by
 * abbreviation. We do this because production data has dirty abbreviations
 * for US states (mixed casing, stray whitespace, the occasional state-org
 * collision). Other countries are looked up by the canonical abbreviation
 * because their seeds were imported cleanly via CSP. The annual cleanup
 * pass plus `scripts/fix_us_state_abbreviations.ts` exist to repair the US
 * data so this special case can eventually be removed.
 */
async function resolveJurisdiction(country: string, stateAbbr: string) {
  if (country === "United States") {
    const stateName = getStateNameFromAbbr(stateAbbr);
    if (!stateName) return undefined;
    const jurisdictions = await storage.getJurisdictions(country);
    return jurisdictions.find((j) => j.name === stateName);
  }
  return await storage.getJurisdictionByAbbr(country, stateAbbr);
}

// --------------------------------------------------------------
// Drift logging
// --------------------------------------------------------------

/**
 * Fire-and-forget logger for fallback hits. Every time the runtime cascade
 * falls past the live DB into the static curriculum file (or the universal
 * generic subject list), we record a row so the annual July 1 cleanup pass
 * can rank countries by real teacher demand instead of guesswork.
 *
 * Intentionally not awaited by callers — fallback latency must not regress
 * because of logging. Failures are swallowed and console-logged only.
 */
function recordFallbackMiss(input: {
  country: string;
  state?: string | null;
  subject?: string | null;
  gradeLevel?: string | null;
  fallbackKind: "static-curated-v1" | "international-generic" | "no-data";
  userId?: string | null;
}): void {
  db.insert(standardsFallbackMisses)
    .values({
      country: input.country,
      state: input.state ?? null,
      subject: input.subject ?? null,
      gradeLevel: input.gradeLevel ?? null,
      fallbackKind: input.fallbackKind,
      userId: input.userId ?? null,
    })
    .then(() => undefined)
    .catch((err) => {
      console.error("[standardsCatalog] recordFallbackMiss failed:", err);
    });
}

// --------------------------------------------------------------
// listStates
// --------------------------------------------------------------

export async function listStates(country: string): Promise<CatalogState[]> {
  const jurisdictions = await storage.getJurisdictions(country);

  // For US, only count jurisdictions whose NAME matches a real state — this
  // filters out the occasional org/district row that landed in the
  // jurisdictions table with country="United States".
  const isUS = country === "United States";
  const liveJurisdictions = isUS
    ? jurisdictions.filter((j) => US_STATES[j.name] !== undefined)
    : jurisdictions;

  const liveNames = new Set(liveJurisdictions.map((j) => j.name));
  const result: CatalogState[] = liveJurisdictions.map((j) => ({
    state: j.name,
    // Prefer the canonical abbreviation from the static US map when the DB
    // row has a dirty value; non-US jurisdictions trust the DB abbreviation.
    abbreviation: isUS ? (US_STATES[j.name] || j.abbreviation) : j.abbreviation,
    standardsName: j.standardsName,
    source: classifyDbSource(j.source),
    sourceUrl: j.sourceUrl,
    coverageMode:
      ((j as any).coverageMode as CoverageMode | undefined) ?? defaultCoverageMode(country),
  }));

  // Always merge the static curriculum file so dropdowns are never empty —
  // a one-off DB outage or a country we haven't seeded yet must not block
  // the teacher entirely.
  try {
    const { getStates } = await import("@shared/standards");
    const staticStates = getStates(country);
    let merged = 0;
    for (const fb of staticStates) {
      if (!liveNames.has(fb.state)) {
        result.push({
          state: fb.state,
          abbreviation: fb.abbreviation,
          standardsName: fb.standardsName,
          source: "fallback",
          coverageMode: defaultCoverageMode(country),
        });
        merged += 1;
      }
    }
    if (merged > 0 && liveJurisdictions.length === 0) {
      recordFallbackMiss({ country, fallbackKind: "static-curated-v1" });
    }
  } catch {
    // Static file shouldn't throw, but if it does we still want to return
    // whatever DB jurisdictions we managed to load rather than 500.
  }

  result.sort((a, b) => a.state.localeCompare(b.state));
  return result;
}

// --------------------------------------------------------------
// listSubjects
// --------------------------------------------------------------

export async function listSubjects(
  country: string,
  stateAbbr: string,
  opts: { userId?: string | null } = {},
): Promise<CatalogSubject[]> {
  const jurisdiction = await resolveJurisdiction(country, stateAbbr);
  const sets = jurisdiction ? await storage.getStandardSets(jurisdiction.id) : [];

  if (jurisdiction && sets.length > 0) {
    const dbSourceTier = classifyDbSource(jurisdiction.source);
    const unique = Array.from(new Set(sets.map((s) => s.subject)));
    return unique.map((subject) => ({
      subject,
      source: dbSourceTier,
      sourceUrl: jurisdiction.sourceUrl,
    }));
  }

  // Two fallback cases:
  //   (a) jurisdiction missing entirely (no DB row), and
  //   (b) jurisdiction seeded but no standard sets attached — common for
  //       Nigerian/Philippine/etc. regions where CSP doesn't publish
  //       per-outcome curricula. Without this, those users see an empty
  //       subjects dropdown and a dead-end UI.
  const { getSubjects } = await import("@shared/standards");
  const fallbackSubjects = getSubjects(country, stateAbbr);
  if (fallbackSubjects.length > 0) {
    recordFallbackMiss({
      country,
      state: stateAbbr,
      fallbackKind: "static-curated-v1",
      userId: opts.userId ?? null,
    });
    return fallbackSubjects.map((s) => ({ subject: s.subject, source: "fallback" }));
  }

  recordFallbackMiss({
    country,
    state: stateAbbr,
    fallbackKind: "no-data",
    userId: opts.userId ?? null,
  });
  return [];
}

// --------------------------------------------------------------
// listCodes
// --------------------------------------------------------------

export async function listCodes(
  country: string,
  stateAbbr: string,
  subject: string,
  opts: { gradeLevels?: string[]; userId?: string | null } = {},
): Promise<CatalogCode[]> {
  const gradeLevels = opts.gradeLevels ?? [];
  const jurisdiction = await resolveJurisdiction(country, stateAbbr);
  const sets = jurisdiction ? await storage.getStandardSets(jurisdiction.id) : [];
  const subjectSet = sets.find((s) => s.subject === subject);

  if (jurisdiction && subjectSet) {
    const dbSourceTier = classifyDbSource(jurisdiction.source);
    const standards = gradeLevels.length > 0
      ? await storage.getEducationalStandardsByGradeLevels(subjectSet.id, gradeLevels)
      : await storage.getEducationalStandards(subjectSet.id);
    return standards.map((s) => ({
      code: s.humanCoding,
      description: s.statement,
      gradeLevel: s.gradeLevel,
      source: dbSourceTier,
      sourceUrl: subjectSet.documentUrl || jurisdiction.sourceUrl,
    }));
  }

  // Static fallback — many international curricula intentionally have no
  // per-outcome codes; an empty array is a valid answer and the lesson
  // generator handles it. Only log a fallback miss when the static file
  // actually had to substitute for a missing DB jurisdiction.
  const { getStandardCodes } = await import("@shared/standards");
  const fallbackCodes = getStandardCodes(country, stateAbbr, subject);
  if (!jurisdiction || sets.length === 0) {
    recordFallbackMiss({
      country,
      state: stateAbbr,
      subject,
      fallbackKind: fallbackCodes.length > 0 ? "static-curated-v1" : "no-data",
      userId: opts.userId ?? null,
    });
  }
  return fallbackCodes.map((s) => ({
    code: s.code,
    description: s.description,
    source: "fallback",
  }));
}

// --------------------------------------------------------------
// Coverage mode helpers for admin / cleanup tooling
// --------------------------------------------------------------

/**
 * Backfill `coverage_mode` for jurisdictions that pre-date the column.
 * Heuristic: any jurisdiction with at least one standard set whose source
 * is "csp" or "case" is `codes_required`; otherwise `outcomes_only`. Rows
 * with no standard sets and no country-level static fallback are tagged
 * `unmapped` so the admin dashboard surfaces them as ingestion priorities.
 *
 * Safe to re-run — only flips rows that are still on the column default.
 */
export async function backfillCoverageModes(): Promise<{ updated: number }> {
  const rows = await db.select().from(standardsJurisdictions);
  let updated = 0;
  for (const j of rows) {
    const current = (j as any).coverageMode as string | undefined;
    if (current && current !== "codes_required") continue;
    const sets = await storage.getStandardSets(j.id);
    const next: CoverageMode =
      sets.length === 0
        ? (isCoverageOptionalCountry(j.country) ? "outcomes_only" : "unmapped")
        : defaultCoverageMode(j.country);
    if (next === current) continue;
    await db
      .update(standardsJurisdictions)
      .set({ coverageMode: next, updatedAt: new Date() })
      .where(eq(standardsJurisdictions.id, j.id));
    updated += 1;
  }
  return { updated };
}
