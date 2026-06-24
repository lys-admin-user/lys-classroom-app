import { storage } from "../storage";
import { syncStandardSetFromCSP } from "./cspService";

// Idempotent ingestion of the Texas Agriculture, Food & Natural Resources
// TEKS into the live standards DB using the authoritative Common Standards
// Project (CSP) pipeline — NO hand-typed codes. CSP carries the full, real
// standard tree; we ingest the MOST CURRENT published edition.
//
// "Most current full release" note: as of this writing CSP publishes a 2024
// edition of "Principles of Agriculture, Food and Natural Resources" (the
// gateway AFNR course) alongside older 2015/2010 editions. We ingest the 2024
// edition. Other AFNR courses (Practicum, Ag Mechanics) are listed below and
// can be enabled by adding them to AG_COURSES.
//
// Run with:  npx tsx scripts/seed-texas-ag-teks.ts

// CSP jurisdiction id for the state of Texas.
const TEXAS_CSP_JURISDICTION_ID = "28903EF2A9F9469C9BF592D4D0BE10F8";

// CSP tags every Texas CTE set with the generic subject "CTE (2010-)", which
// would collapse every CTE course under one misleading dropdown entry. We
// override each ingested set's subject with a clean, COURSE-SPECIFIC label so
// every course surfaces as its own selectable subject and `listCodes` (which
// selects the set by exact subject match) never collides between courses.
interface AgCourse {
  // CSP standard_set id for the most current edition of the course.
  cspSetId: string;
  // Human label for logs only.
  label: string;
  // Edition year for documentYear metadata.
  year: string;
  // Clean, teacher-facing subject label — MUST be unique per course so the
  // standards cascade maps one subject -> exactly one standard set.
  subjectLabel: string;
}

// Only the gateway AFNR course (most current edition) is enabled per the
// request ("a CTE course"). Add more entries here to ingest the rest of the
// AFNR cluster — each is full + real CSP data. Give every entry a UNIQUE
// subjectLabel.
const AG_COURSES: AgCourse[] = [
  {
    cspSetId: "F3727BD2AE9D420BBFFFCCE90AE159E0",
    label: "Principles of Agriculture, Food and Natural Resources (2024)",
    year: "2024",
    subjectLabel: "CTE: Agriculture, Food & Natural Resources",
  },
];

export interface AgTeksSeedResult {
  jurisdictionId: string;
  courses: Array<{
    label: string;
    standardSetId: string;
    newStandards: number;
    updatedStandards: number;
    totalStandards: number;
  }>;
}

/**
 * Ensure the Texas jurisdiction exists in the DB and is linked to its CSP
 * external id, then ingest the configured AFNR course(s) in full from CSP.
 * Safe to re-run — CSP sync dedupes by uid and only writes deltas.
 */
export async function seedTexasAgricultureTeks(
  triggeredBy = "agriculture-teks-seed",
): Promise<AgTeksSeedResult> {
  // 1. Resolve (or create) the Texas jurisdiction by name.
  const usJurisdictions = await storage.getJurisdictions("United States");
  let texas = usJurisdictions.find((j) => j.name === "Texas");

  if (!texas) {
    texas = await storage.createJurisdiction({
      externalId: TEXAS_CSP_JURISDICTION_ID,
      country: "United States",
      name: "Texas",
      abbreviation: "TX",
      standardsName: "TEKS",
      source: "csp",
      sourceUrl: `https://api.commonstandardsproject.com/api/v1/jurisdictions/${TEXAS_CSP_JURISDICTION_ID}`,
      lastSyncedAt: new Date(),
    });
    console.log(`[ag-teks-seed] created Texas jurisdiction ${texas.id}`);
  } else if (texas.externalId !== TEXAS_CSP_JURISDICTION_ID) {
    await storage.updateJurisdiction(texas.id, {
      externalId: TEXAS_CSP_JURISDICTION_ID,
      lastSyncedAt: new Date(),
    });
    console.log(`[ag-teks-seed] linked Texas jurisdiction ${texas.id} to CSP id`);
  }

  const courses: AgTeksSeedResult["courses"] = [];

  // 2. Ingest each configured course in full from CSP.
  for (const course of AG_COURSES) {
    console.log(`[ag-teks-seed] syncing "${course.label}" from CSP...`);
    const sync = await syncStandardSetFromCSP(course.cspSetId, texas.id, triggeredBy);

    // 3. Override the generic CSP subject with a clean, course-specific label
    //    so it surfaces as its own subject in the standards dropdowns, and
    //    stamp the edition year.
    await storage.updateStandardSet(sync.standardSetId, {
      subject: course.subjectLabel,
      documentYear: course.year,
    });

    const total = (await storage.getEducationalStandards(sync.standardSetId)).length;
    courses.push({
      label: course.label,
      standardSetId: sync.standardSetId,
      newStandards: sync.newStandards,
      updatedStandards: sync.updatedStandards,
      totalStandards: total,
    });
    console.log(
      `[ag-teks-seed] "${course.label}": ${total} standards in set ` +
        `(+${sync.newStandards} new, ~${sync.updatedStandards} updated)`,
    );
  }

  return { jurisdictionId: texas.id, courses };
}
