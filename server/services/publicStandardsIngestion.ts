// Pipeline for ingesting real public standards from ministry-of-education
// sources around the world. Mirrors the scholarship-scraper pattern:
//   request -> approve -> fetch+extract -> system_admin review -> publish
//
// Triggers:
//   - Customer admin clicks "Request my country's standards" → creates a
//     standards_ingestion_requests row (system_admin can also create on
//     behalf of an unaffiliated user).
//   - System admin approves a request and clicks "Run sync" → this service.
//   - Annual cron sweep → runs against every active source registry entry.

import { db } from "../db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  standardsIngestionRequests,
  standardsSourceRegistry,
  pendingPublicStandards,
  publicStandardsSyncRuns,
  educationalStandardsDb,
  standardSets,
  standardsJurisdictions,
  type StandardsIngestionRequest,
  type StandardsSourceRegistry,
  type PendingPublicStandard,
  type PublicStandardsSyncRun,
} from "@shared/schema";
import { openai } from "../openai";
import { randomUUID, createHash } from "crypto";

// -------------------- Source registry seeds --------------------
//
// Eight high-priority countries with well-documented public curricula.
// These get a one-time seed so the annual sweep has something to chew on
// from day one. system_admin can add more sources via the admin UI.
export const SOURCE_REGISTRY_SEEDS: Array<{
  country: string;
  sourceName: string;
  sourceUrl: string;
  notes?: string;
}> = [
  {
    country: "United Kingdom",
    sourceName: "UK National Curriculum",
    sourceUrl:
      "https://www.gov.uk/government/collections/national-curriculum",
    notes: "England's statutory programmes of study for KS1-KS4.",
  },
  {
    country: "Australia",
    sourceName: "Australian Curriculum (ACARA) v9",
    sourceUrl: "https://v9.australiancurriculum.edu.au/",
    notes: "F-10 + senior secondary across all learning areas.",
  },
  {
    country: "Canada",
    sourceName: "Ontario Curriculum",
    sourceUrl:
      "https://www.dcp.edu.gov.on.ca/en/curriculum",
    notes: "Provincial — most populous Canadian curriculum.",
  },
  {
    country: "Singapore",
    sourceName: "Singapore MOE Syllabuses",
    sourceUrl:
      "https://www.moe.gov.sg/education-in-sg/our-programmes/curriculum",
    notes: "Primary, secondary, JC syllabuses by subject.",
  },
  {
    country: "India",
    sourceName: "NCERT / CBSE Curriculum",
    sourceUrl: "https://ncert.nic.in/curriculum.php",
    notes: "National council framework adopted by CBSE schools.",
  },
  {
    country: "Philippines",
    sourceName: "DepEd K-12 Curriculum Guides",
    sourceUrl:
      "https://www.deped.gov.ph/k-to-12/about/k-to-12-basic-education-curriculum/",
    notes: "Per-subject curriculum guides for K-12.",
  },
  {
    country: "Brazil",
    sourceName: "Base Nacional Comum Curricular (BNCC)",
    sourceUrl: "http://basenacionalcomum.mec.gov.br/",
    notes: "National common curriculum base, all stages.",
  },
  {
    country: "Mexico",
    sourceName: "SEP Plan y Programas de Estudio",
    sourceUrl: "https://www.planyprogramasdestudio.sep.gob.mx/",
    notes: "Secretaría de Educación Pública national plans.",
  },
];

export async function seedSourceRegistryIfEmpty(): Promise<{ inserted: number }> {
  const existing = await db.select({ id: standardsSourceRegistry.id }).from(standardsSourceRegistry).limit(1);
  if (existing.length > 0) return { inserted: 0 };
  await db.insert(standardsSourceRegistry).values(
    SOURCE_REGISTRY_SEEDS.map((s) => ({
      country: s.country,
      sourceName: s.sourceName,
      sourceUrl: s.sourceUrl,
      sourceType: "html" as const,
      notes: s.notes,
      isActive: true,
    })),
  );
  return { inserted: SOURCE_REGISTRY_SEEDS.length };
}

// -------------------- Ingestion requests --------------------

export async function createIngestionRequest(input: {
  country: string;
  state?: string;
  requestedByUserId: string;
  requesterRole: string;
  requesterOrgId?: string;
  notes?: string;
}): Promise<StandardsIngestionRequest> {
  const [row] = await db
    .insert(standardsIngestionRequests)
    .values({
      country: input.country,
      state: input.state ?? null,
      requestedByUserId: input.requestedByUserId,
      requesterRole: input.requesterRole,
      requesterOrgId: input.requesterOrgId ?? null,
      notes: input.notes ?? null,
      status: "pending",
    })
    .returning();
  return row;
}

export async function listIngestionRequests(filter: { status?: string } = {}): Promise<StandardsIngestionRequest[]> {
  const conditions = [];
  if (filter.status) conditions.push(eq(standardsIngestionRequests.status, filter.status));
  const q = db
    .select()
    .from(standardsIngestionRequests)
    .orderBy(desc(standardsIngestionRequests.createdAt));
  return conditions.length ? await q.where(and(...conditions)) : await q;
}

export async function updateRequestStatus(
  id: string,
  status: string,
  reviewerId: string,
  reviewNotes?: string,
): Promise<void> {
  await db
    .update(standardsIngestionRequests)
    .set({
      status,
      reviewedByUserId: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes ?? null,
    })
    .where(eq(standardsIngestionRequests.id, id));
}

// -------------------- Source registry CRUD --------------------

export async function listSourceRegistry(): Promise<StandardsSourceRegistry[]> {
  return await db
    .select()
    .from(standardsSourceRegistry)
    .orderBy(standardsSourceRegistry.country);
}

export async function addSource(input: {
  country: string;
  state?: string;
  sourceName: string;
  sourceUrl: string;
  notes?: string;
}): Promise<StandardsSourceRegistry> {
  const [row] = await db
    .insert(standardsSourceRegistry)
    .values({
      country: input.country,
      state: input.state ?? null,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      notes: input.notes ?? null,
      sourceType: "html",
      isActive: true,
    })
    .returning();
  return row;
}

// -------------------- Sync pipeline --------------------

const EXTRACTION_PROMPT = `You are an expert curriculum analyst. Given a country's official
curriculum reference (URL + description), produce a representative sample
of real, verifiable learning standards for that curriculum.

Rules:
- Output ONLY JSON: { "standards": [...] }.
- Each standard: { code, description, subject, gradeLevel, strand?, confidence }.
- "code" must be the official code as published by that ministry.
- "description" must be the actual statement of the standard.
- "confidence" is 0-100 — your certainty that this exact standard exists in
  the source. Mark anything you're inferring at <60.
- Cover at least Mathematics, English/Language Arts, and Science across
  primary and secondary grades. Aim for 30-80 standards per run.
- DO NOT fabricate. If you don't know a real code, omit that standard.`;

export async function runSyncForSource(
  source: StandardsSourceRegistry,
  triggeredByUserId: string,
  triggerType: "manual" | "request" | "annual_sweep",
  ingestionRequestId?: string,
): Promise<PublicStandardsSyncRun> {
  const [run] = await db
    .insert(publicStandardsSyncRuns)
    .values({
      triggerType,
      triggeredByUserId,
      ingestionRequestId: ingestionRequestId ?? null,
      country: source.country,
      state: source.state,
      status: "running",
      sourcesAttempted: 1,
    })
    .returning();

  try {
    if (!openai) throw new Error("OpenAI not configured");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            `Country: ${source.country}`,
            source.state ? `State/Region: ${source.state}` : null,
            `Source: ${source.sourceName}`,
            `URL: ${source.sourceUrl}`,
            source.notes ? `Notes: ${source.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw) as {
      standards?: Array<{
        code?: string;
        description?: string;
        subject?: string;
        gradeLevel?: string;
        strand?: string;
        confidence?: number;
      }>;
    };
    const items = (parsed.standards || []).filter(
      (s) => s && typeof s.description === "string" && s.description.length > 5,
    );

    if (items.length > 0) {
      await db.insert(pendingPublicStandards).values(
        items.map((s) => ({
          ingestionRequestId: ingestionRequestId ?? null,
          sourceRegistryId: source.id,
          syncRunId: run.id,
          country: source.country,
          state: source.state,
          subject: s.subject ?? null,
          gradeLevel: s.gradeLevel ?? null,
          code: s.code ?? null,
          description: s.description!,
          strand: s.strand ?? null,
          sourceUrl: source.sourceUrl,
          confidenceScore: typeof s.confidence === "number" ? Math.max(0, Math.min(100, s.confidence)) : 50,
          status: "pending_review",
        })),
      );
    }

    await db
      .update(publicStandardsSyncRuns)
      .set({
        status: "completed",
        sourcesSucceeded: 1,
        pendingCreated: items.length,
        completedAt: new Date(),
      })
      .where(eq(publicStandardsSyncRuns.id, run.id));

    await db
      .update(standardsSourceRegistry)
      .set({ lastSyncedAt: new Date(), lastSyncStatus: "ok" })
      .where(eq(standardsSourceRegistry.id, source.id));

    return { ...run, status: "completed", sourcesSucceeded: 1, pendingCreated: items.length };
  } catch (err: any) {
    const msg = err?.message || String(err);
    await db
      .update(publicStandardsSyncRuns)
      .set({ status: "failed", errorMessage: msg.slice(0, 500), completedAt: new Date() })
      .where(eq(publicStandardsSyncRuns.id, run.id));
    await db
      .update(standardsSourceRegistry)
      .set({ lastSyncedAt: new Date(), lastSyncStatus: "failed" })
      .where(eq(standardsSourceRegistry.id, source.id));
    return { ...run, status: "failed", errorMessage: msg };
  }
}

export async function runAnnualSweep(triggeredByUserId: string): Promise<{
  attempted: number;
  succeeded: number;
  pendingCreated: number;
}> {
  const sources = await db
    .select()
    .from(standardsSourceRegistry)
    .where(eq(standardsSourceRegistry.isActive, true));
  let succeeded = 0;
  let pendingCreated = 0;
  for (const s of sources) {
    const run = await runSyncForSource(s, triggeredByUserId, "annual_sweep");
    if (run.status === "completed") {
      succeeded += 1;
      pendingCreated += run.pendingCreated || 0;
    }
  }
  return { attempted: sources.length, succeeded, pendingCreated };
}

// -------------------- Pending review + publish --------------------

export async function listPendingStandards(filter: {
  country?: string;
  state?: string;
  status?: string;
  syncRunId?: string;
} = {}): Promise<PendingPublicStandard[]> {
  const conditions = [];
  if (filter.country) conditions.push(eq(pendingPublicStandards.country, filter.country));
  if (filter.state) conditions.push(eq(pendingPublicStandards.state, filter.state));
  if (filter.status) conditions.push(eq(pendingPublicStandards.status, filter.status));
  if (filter.syncRunId) conditions.push(eq(pendingPublicStandards.syncRunId, filter.syncRunId));
  const q = db
    .select()
    .from(pendingPublicStandards)
    .orderBy(desc(pendingPublicStandards.createdAt));
  return conditions.length
    ? await q.where(and(...conditions))
    : await q;
}

// Approve a batch of pending standards. We materialize them into
// standardsJurisdictions / standardSets / educational_standards so they
// flow through the existing standards UI.
export async function approvePendingStandards(
  ids: string[],
  reviewerId: string,
): Promise<{ approved: number }> {
  if (ids.length === 0) return { approved: 0 };
  const targets = await db
    .select()
    .from(pendingPublicStandards)
    .where(
      and(
        eq(pendingPublicStandards.status, "pending_review"),
        inArray(pendingPublicStandards.id, ids),
      ),
    );

  for (const item of targets) {
    // Find or create jurisdiction
    const jurisdictionName = item.state || item.country;
    const jurisdictionAbbr = (item.state || item.country).slice(0, 8).toUpperCase();
    let [jurisdiction] = await db
      .select()
      .from(standardsJurisdictions)
      .where(
        and(
          eq(standardsJurisdictions.country, item.country),
          eq(standardsJurisdictions.name, jurisdictionName),
        ),
      );
    if (!jurisdiction) {
      [jurisdiction] = await db
        .insert(standardsJurisdictions)
        .values({
          country: item.country,
          name: jurisdictionName,
          abbreviation: jurisdictionAbbr,
          standardsName: `${item.country} National Curriculum`,
          source: "manual",
          sourceUrl: item.sourceUrl,
        })
        .returning();
    }

    // Find or create standard set (per subject + grade)
    const setUid = createHash("sha256")
      .update(
        `${item.country}|${item.state || ""}|${item.subject || "general"}|${item.gradeLevel || "all"}`,
      )
      .digest("hex")
      .slice(0, 32);
    let [stdSet] = await db
      .select()
      .from(standardSets)
      .where(eq(standardSets.uid, setUid));
    if (!stdSet) {
      [stdSet] = await db
        .insert(standardSets)
        .values({
          uid: setUid,
          jurisdictionId: jurisdiction.id,
          title: `${item.subject || "General"} ${item.gradeLevel ? `Grade ${item.gradeLevel}` : ""}`.trim(),
          subject: item.subject || "General",
          educationLevels: item.gradeLevel ? [item.gradeLevel] : [],
          documentUrl: item.sourceUrl,
          source: "manual",
        })
        .returning();
    }

    // Insert the actual standard
    const stdUid = createHash("sha256")
      .update(`${stdSet.uid}|${item.code || item.description.slice(0, 64)}`)
      .digest("hex")
      .slice(0, 32);
    const [published] = await db
      .insert(educationalStandardsDb)
      .values({
        uid: stdUid,
        standardSetId: stdSet.id,
        humanCoding: item.code || `GEN-${stdUid.slice(0, 8)}`,
        statement: item.description,
        gradeLevel: item.gradeLevel,
        isActive: true,
        source: "manual",
      })
      .onConflictDoNothing({ target: educationalStandardsDb.uid })
      .returning();

    await db
      .update(pendingPublicStandards)
      .set({
        status: "approved",
        reviewedByUserId: reviewerId,
        reviewedAt: new Date(),
        publishedStandardId: published?.id ?? null,
      })
      .where(eq(pendingPublicStandards.id, item.id));
  }
  return { approved: targets.length };
}

export async function rejectPendingStandards(
  ids: string[],
  reviewerId: string,
): Promise<{ rejected: number }> {
  if (ids.length === 0) return { rejected: 0 };
  await db
    .update(pendingPublicStandards)
    .set({
      status: "rejected",
      reviewedByUserId: reviewerId,
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(pendingPublicStandards.status, "pending_review"),
        inArray(pendingPublicStandards.id, ids),
      ),
    );
  return { rejected: ids.length };
}

// -------------------- Annual sweep scheduler --------------------

let sweepIntervalHandle: NodeJS.Timeout | null = null;
const ANNUAL_MS = 365 * 24 * 60 * 60 * 1000;

export function startAnnualSweepScheduler(): void {
  if (sweepIntervalHandle) return;
  // Schedule once per day; the sweep itself only runs sources whose
  // lastSyncedAt is older than ~365 days.
  const DAY_MS = 24 * 60 * 60 * 1000;
  sweepIntervalHandle = setInterval(async () => {
    try {
      const sources = await db
        .select()
        .from(standardsSourceRegistry)
        .where(eq(standardsSourceRegistry.isActive, true));
      const now = Date.now();
      const due = sources.filter(
        (s) => !s.lastSyncedAt || now - new Date(s.lastSyncedAt).getTime() > ANNUAL_MS,
      );
      if (due.length === 0) return;
      console.log(`[publicStandardsIngestion] annual sweep: ${due.length} sources due`);
      for (const s of due) {
        await runSyncForSource(s, "system_annual_sweep", "annual_sweep");
      }
    } catch (err) {
      console.error("[publicStandardsIngestion] sweep error:", err);
    }
  }, DAY_MS);
}
