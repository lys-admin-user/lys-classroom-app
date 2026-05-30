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
  ingestionAuditLog,
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
  // Task #8: notify system admins of every new ingestion request. Fire and
  // forget — notifications must never block the request submission path.
  try {
    const { notifyIngestionRequestSubmitted } = await import("./notificationsService");
    void notifyIngestionRequestSubmitted({
      requestId: row.id,
      country: row.country,
      state: row.state,
    });
  } catch (err) {
    console.error("[publicStandardsIngestion] notify-request failed:", err);
  }
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

// The previous version of this prompt asked the model to "produce" standards
// given only a URL and a description, which is a hallucination-bait prompt:
// the model wasn't shown the source page, so every "standard" was effectively
// generated from training data with no provenance check. Now we ALWAYS fetch
// the source page first, hand the model the actual text, and then enforce a
// verbatim string-presence check on each returned code + description before
// any row reaches the admin review queue. AI proposals stay AI proposals —
// the admin still approves each row individually.
const EXTRACTION_PROMPT = `You are an expert curriculum analyst. Given the
fetched text of a country's official curriculum source page, EXTRACT learning
standards that appear verbatim in the provided text.

Rules:
- Output ONLY JSON: { "standards": [...] }.
- Each standard: { code, description, subject, gradeLevel, strand?, confidence }.
- "code" MUST appear verbatim in the provided text. If you cannot find an
  exact code string, omit that standard entirely.
- "description" MUST be quoted directly from the provided text (the first
  40+ characters of the description will be string-matched against the
  source text — paraphrased entries will be rejected).
- "confidence" is 0-100 — your certainty that this exact standard exists in
  the source as written. Below 60 will be hidden from default admin views.
- Prefer fewer, higher-confidence standards over more, speculative ones.
- DO NOT invent codes. DO NOT fabricate descriptions. DO NOT use prior
  knowledge from outside the provided text.`;

// Lightweight HTML → text. Good enough for verbatim string presence checks
// — we don't need perfect rendering, just the original code/description
// strings so the verifier can prove they came from the page rather than the
// model's training data.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_SOURCE_CHARS = 50_000;
const FETCH_TIMEOUT_MS = 20_000;

async function fetchSourceText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "LYS-Standards-Ingestion/1.0 (educational)" },
    });
    if (!resp.ok) throw new Error(`fetch ${resp.status} ${resp.statusText}`);
    const ctype = resp.headers.get("content-type") || "";
    if (!ctype.includes("html") && !ctype.includes("text") && !ctype.includes("xml")) {
      // PDFs and other binaries require a different extraction pipeline that
      // we haven't built yet — fail loud rather than feeding garbage to the
      // model. Admin can register a different source URL or add the rows
      // manually.
      throw new Error(`unsupported content-type for verbatim extraction: ${ctype}`);
    }
    const raw = await resp.text();
    const text = htmlToText(raw);
    return text.slice(0, MAX_SOURCE_CHARS);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Drop any AI-suggested standard whose code or first 40 chars of description
 * doesn't appear (case-insensitively) in the fetched source text. This is
 * the core anti-hallucination guard: even if the model invents a plausible
 * code, it has to actually be on the page we fetched, or we reject it.
 *
 * Note we don't lowercase the whole source on each call — instead we lowercase
 * once and let the V8 short-string search handle the per-item check.
 */
function filterVerbatimItems<T extends { code?: string | null; description?: string | null }>(
  items: T[],
  sourceText: string,
): { kept: T[]; rejected: number } {
  const haystack = sourceText.toLowerCase();
  const kept: T[] = [];
  let rejected = 0;
  for (const item of items) {
    const code = (item.code || "").trim().toLowerCase();
    const descSnippet = (item.description || "").trim().slice(0, 40).toLowerCase();
    const codeOk = code.length > 0 && haystack.includes(code);
    const descOk = descSnippet.length >= 20 && haystack.includes(descSnippet);
    if (codeOk && descOk) {
      kept.push(item);
    } else {
      rejected += 1;
    }
  }
  return { kept, rejected };
}

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

    // Step 1: actually fetch the source page so we have ground truth to
    // verify AI output against. No verbatim source text = no extraction.
    const sourceText = await fetchSourceText(source.sourceUrl);
    if (sourceText.length < 200) {
      throw new Error(`source text too short for extraction (${sourceText.length} chars)`);
    }

    // Step 2: ask the model to extract standards that literally appear in
    // the fetched text. Output is treated as suggestions only — every row
    // goes through the verbatim guard below before reaching the admin
    // review queue, and admin still approves each row individually.
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
            "",
            "--- BEGIN SOURCE TEXT ---",
            sourceText,
            "--- END SOURCE TEXT ---",
          ]
            .filter((v) => v !== null)
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
    const candidates = (parsed.standards || []).filter(
      (s) => s && typeof s.description === "string" && s.description.length > 5,
    );

    // Step 3: verbatim guard — drop anything the model couldn't actually
    // ground in the fetched text. This is the deterministic check that
    // turns the autonomous-extractor risk into an admin-suggestion flow.
    const { kept: items, rejected: verbatimRejected } = filterVerbatimItems(candidates, sourceText);

    if (items.length > 0) {
      const inserted = await db
        .insert(pendingPublicStandards)
        .values(
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
        )
        .returning({ id: pendingPublicStandards.id });
      // Task #6: log a `created` row for every newly inserted pending standard
      // so the moderation viewer's audit trail starts at ingestion, not approval.
      try {
        const { writeAuditLog } = await import("./ingestionModeration");
        for (const row of inserted) {
          await writeAuditLog({
            entityType: "pending_standard",
            entityId: row.id,
            action: "created",
            actorUserId: triggeredByUserId,
            details: { syncRunId: run.id, sourceRegistryId: source.id },
          });
        }
      } catch (err) {
        console.error("[publicStandardsIngestion] audit-log create failed:", err);
      }
    }

    await db
      .update(publicStandardsSyncRuns)
      .set({
        status: "completed",
        sourcesSucceeded: 1,
        pendingCreated: items.length,
        verbatimRejected,
        completedAt: new Date(),
      })
      .where(eq(publicStandardsSyncRuns.id, run.id));

    await db
      .update(standardsSourceRegistry)
      .set({ lastSyncedAt: new Date(), lastSyncStatus: "ok" })
      .where(eq(standardsSourceRegistry.id, source.id));

    // Task #8 notifications: fire on the two interesting outcomes of a
    // successful run — verbatim rejection spike (data-quality signal) and
    // new pending standards ready to moderate.
    try {
      const notif = await import("./notificationsService");
      void notif.notifyVerbatimRejectionSpike({
        syncRunId: run.id,
        country: source.country,
        state: source.state,
        rejectedCount: verbatimRejected,
      });
      void notif.notifyPendingStandardsReady({
        syncRunId: run.id,
        country: source.country,
        state: source.state,
        pendingCount: items.length,
      });
    } catch (err) {
      console.error("[publicStandardsIngestion] notify-success failed:", err);
    }

    return { ...run, status: "completed", sourcesSucceeded: 1, pendingCreated: items.length, verbatimRejected };
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
    // Task #8: alert admins on sync failure.
    try {
      const { notifySyncRunFailed } = await import("./notificationsService");
      void notifySyncRunFailed({
        syncRunId: run.id,
        country: source.country,
        state: source.state,
        errorMessage: msg,
      });
    } catch (notifErr) {
      console.error("[publicStandardsIngestion] notify-failure failed:", notifErr);
    }
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
  reason?: string,
  externalTx?: any,
): Promise<{ approved: number }> {
  if (ids.length === 0) return { approved: 0 };
  const run = async (tx: any) => {
    const targets = await tx
      .select()
      .from(pendingPublicStandards)
      .where(
        and(
          eq(pendingPublicStandards.status, "pending_review"),
          inArray(pendingPublicStandards.id, ids),
        ),
      );
    // Atomicity guard (Task #6): bulk approve is all-or-nothing — if any
    // requested id is missing or already reviewed, the whole tx rolls back.
    if (targets.length !== ids.length) {
      throw new Error(
        `Bulk approve aborted: ${ids.length - targets.length} of ${ids.length} pending standard(s) not found or already reviewed`,
      );
    }

    for (const item of targets) {
      const jurisdictionName = item.state || item.country;
      const jurisdictionAbbr = (item.state || item.country).slice(0, 8).toUpperCase();
      let [jurisdiction] = await tx
        .select()
        .from(standardsJurisdictions)
        .where(
          and(
            eq(standardsJurisdictions.country, item.country),
            eq(standardsJurisdictions.name, jurisdictionName),
          ),
        );
      if (!jurisdiction) {
        [jurisdiction] = await tx
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

      const setUid = createHash("sha256")
        .update(
          `${item.country}|${item.state || ""}|${item.subject || "general"}|${item.gradeLevel || "all"}`,
        )
        .digest("hex")
        .slice(0, 32);
      let [stdSet] = await tx
        .select()
        .from(standardSets)
        .where(eq(standardSets.uid, setUid));
      if (!stdSet) {
        [stdSet] = await tx
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

      const stdUid = createHash("sha256")
        .update(`${stdSet.uid}|${item.code || item.description.slice(0, 64)}`)
        .digest("hex")
        .slice(0, 32);
      const [published] = await tx
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

      await tx
        .update(pendingPublicStandards)
        .set({
          status: "approved",
          reviewedByUserId: reviewerId,
          reviewedAt: new Date(),
          publishedStandardId: published?.id ?? null,
        })
        .where(eq(pendingPublicStandards.id, item.id));

      await tx.insert(ingestionAuditLog).values({
        entityType: "pending_standard",
        entityId: item.id,
        action: "approved",
        actorUserId: reviewerId,
        reason: reason ?? null,
        details: { publishedStandardId: published?.id ?? null },
      });
    }
    return targets.length;
  };
  const approved = externalTx ? await run(externalTx) : await db.transaction(run);
  return { approved };
}

export async function rejectPendingStandards(
  ids: string[],
  reviewerId: string,
  reason?: string,
  externalTx?: any,
): Promise<{ rejected: number }> {
  if (ids.length === 0) return { rejected: 0 };
  const run = async (tx: any) => {
    const targets = await tx
      .select({ id: pendingPublicStandards.id })
      .from(pendingPublicStandards)
      .where(
        and(
          eq(pendingPublicStandards.status, "pending_review"),
          inArray(pendingPublicStandards.id, ids),
        ),
      );
    if (targets.length !== ids.length) {
      throw new Error(
        `Bulk reject aborted: ${ids.length - targets.length} of ${ids.length} pending standard(s) not found or already reviewed`,
      );
    }
    await tx
      .update(pendingPublicStandards)
      .set({
        status: "rejected",
        reviewedByUserId: reviewerId,
        reviewedAt: new Date(),
      })
      .where(inArray(pendingPublicStandards.id, ids));
    await tx.insert(ingestionAuditLog).values(
      targets.map((t: { id: string }) => ({
        entityType: "pending_standard",
        entityId: t.id,
        action: "rejected",
        actorUserId: reviewerId,
        reason: reason ?? null,
      })),
    );
    return targets.length;
  };
  const rejected = externalTx ? await run(externalTx) : await db.transaction(run);
  return { rejected };
}

// -------------------- Annual cleanup scheduler --------------------
//
// Locked product decision (Track A, May 2026): the annual cleanup runs once
// a year on July 1 (between US academic years, after most ministries
// publish updates). The scheduler ticks daily and the body short-circuits
// unless (a) today is July 1 in UTC AND (b) we haven't already run this
// year's cleanup. Manual re-runs are still possible via the admin endpoint
// that calls `runAnnualCleanup` directly.
//
// What the cleanup does:
//   1. Sweep due sources (lastSyncedAt > ~300d ago) through `runSyncForSource`
//      — this still emits admin-review pending rows; nothing auto-publishes.
//   2. Backfill `coverage_mode` on any jurisdiction still on the column
//      default, so the lesson generator can route teachers correctly.
//   3. Aggregate the last 12 months of `standards_fallback_misses` so the
//      admin dashboard can show "countries with most unmet teacher demand".

let sweepIntervalHandle: NodeJS.Timeout | null = null;
const DAY_MS = 24 * 60 * 60 * 1000;
const SOURCE_DUE_MS = 300 * DAY_MS; // ~10 months — gives mid-year ad-hoc syncs room

export interface AnnualCleanupResult {
  ranAt: string;
  sourcesAttempted: number;
  sourcesSucceeded: number;
  pendingCreated: number;
  verbatimRejected: number;
  jurisdictionsBackfilled: number;
  fallbackMissCount: number;
  skipped?: "already_ran_this_year";
}

// DB-backed year lock. We use a sentinel row in `public_standards_sync_runs`
// (triggerType "annual_cleanup_marker") instead of an in-memory flag so
// restarts and any future multi-instance deployment can't double-trigger
// the cleanup in the same year.
async function hasCleanupRunThisYear(year: number): Promise<boolean> {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const [existing] = await db
    .select({ id: publicStandardsSyncRuns.id })
    .from(publicStandardsSyncRuns)
    .where(
      and(
        eq(publicStandardsSyncRuns.triggerType, "annual_cleanup_marker"),
        sql`${publicStandardsSyncRuns.startedAt} >= ${yearStart}`,
      ),
    )
    .limit(1);
  return !!existing;
}

async function insertCleanupMarker(triggeredByUserId: string): Promise<void> {
  await db.insert(publicStandardsSyncRuns).values({
    triggerType: "annual_cleanup_marker",
    triggeredByUserId,
    status: "completed",
    sourcesAttempted: 0,
    sourcesSucceeded: 0,
    pendingCreated: 0,
    completedAt: new Date(),
  });
}

export async function runAnnualCleanup(
  triggeredByUserId: string,
  opts: { enforceYearLock?: boolean } = {},
): Promise<AnnualCleanupResult> {
  // Lazy-imported to avoid an import cycle between this service and the
  // catalog (catalog imports from `../routes/_helpers`, which transitively
  // pulls in route files that import this service).
  const { backfillCoverageModes } = await import("./standardsCatalog");
  const { standardsFallbackMisses } = await import("@shared/schema");

  const year = new Date().getUTCFullYear();
  if (opts.enforceYearLock && (await hasCleanupRunThisYear(year))) {
    return {
      ranAt: new Date().toISOString(),
      sourcesAttempted: 0,
      sourcesSucceeded: 0,
      pendingCreated: 0,
      verbatimRejected: 0,
      jurisdictionsBackfilled: 0,
      fallbackMissCount: 0,
      skipped: "already_ran_this_year",
    };
  }

  // Drop the marker BEFORE doing the work so a crash mid-cleanup can't cause
  // an infinite retry loop. Subsequent ticks will see the marker and skip.
  await insertCleanupMarker(triggeredByUserId);

  const sources = await db
    .select()
    .from(standardsSourceRegistry)
    .where(eq(standardsSourceRegistry.isActive, true));
  const now = Date.now();
  const due = sources.filter(
    (s) => !s.lastSyncedAt || now - new Date(s.lastSyncedAt).getTime() > SOURCE_DUE_MS,
  );

  let succeeded = 0;
  let pendingCreated = 0;
  let verbatimRejected = 0;
  for (const s of due) {
    const run = await runSyncForSource(s, triggeredByUserId, "annual_sweep");
    if (run.status === "completed") {
      succeeded += 1;
      pendingCreated += run.pendingCreated || 0;
      verbatimRejected += (run as any).verbatimRejected || 0;
    }
  }

  const { updated: jurisdictionsBackfilled } = await backfillCoverageModes();

  const since = new Date(Date.now() - 365 * DAY_MS);
  const [{ count: fallbackMissCount = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(standardsFallbackMisses)
    .where(sql`${standardsFallbackMisses.createdAt} >= ${since}`);

  return {
    ranAt: new Date().toISOString(),
    sourcesAttempted: due.length,
    sourcesSucceeded: succeeded,
    pendingCreated,
    verbatimRejected,
    jurisdictionsBackfilled,
    fallbackMissCount: Number(fallbackMissCount) || 0,
  };
}

// Runs the cleanup if (a) today is on or after July 1 UTC, and (b) the
// year-lock sentinel for the current year is absent. The "on or after"
// (rather than "exactly on") condition is what keeps a server that starts
// up on July 3 from missing the entire year. Safe to call from both the
// daily tick AND from process startup.
async function tickAnnualCleanup(): Promise<void> {
  const today = new Date();
  const onOrAfterJuly1 =
    today.getUTCMonth() > 6 ||
    (today.getUTCMonth() === 6 && today.getUTCDate() >= 1);
  if (!onOrAfterJuly1) return;
  const year = today.getUTCFullYear();
  if (await hasCleanupRunThisYear(year)) return;
  console.log(`[publicStandardsIngestion] July ${year} annual cleanup starting`);
  const result = await runAnnualCleanup("system_annual_sweep", { enforceYearLock: true });
  console.log(`[publicStandardsIngestion] annual cleanup complete:`, result);
}

export function startAnnualSweepScheduler(): void {
  if (sweepIntervalHandle) return;
  // Immediate startup check — covers the case where the process starts up
  // after July 1 has already passed and the cleanup hasn't run this year.
  // Without this, a freshly-deployed server in July/August would otherwise
  // wait until next July to do anything.
  setTimeout(() => {
    tickAnnualCleanup().catch((err) =>
      console.error("[publicStandardsIngestion] startup tick error:", err),
    );
  }, 30_000); // small delay so DB & other services have settled
  sweepIntervalHandle = setInterval(() => {
    tickAnnualCleanup().catch((err) =>
      console.error("[publicStandardsIngestion] daily tick error:", err),
    );
  }, DAY_MS);
}
