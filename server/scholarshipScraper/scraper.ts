import OpenAI from "openai";
import crypto from "crypto";
import { storage } from "../storage";
import { fetchWithPolitePolicy } from "./fetcher";
import type { Institution, ScrapeTrigger } from "@shared/schema";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const SYSTEM_USER_ID = "system-scholarship-scraper";

interface ExtractedScholarship {
  title: string;
  description?: string;
  url?: string;
  amount?: string;
  deadline?: string;
  eligibility?: string[];
  studentLevel?: string;
  isRecurring?: boolean;
}

/**
 * Run a full scrape across all active institutions.
 * - Skips institutions without a scholarship URL.
 * - Hash-compares page content; skips unchanged pages (no LLM cost).
 * - Inserts new scholarships as is_active=false (admin must approve).
 * - Re-marks last_seen_at on existing scholarships matched by sourceUrl.
 * - At the end, deactivates any auto-imported scholarships not seen this run.
 */
export async function runScholarshipScrape(opts: {
  trigger: ScrapeTrigger;
  triggeredBy?: string | null;
}): Promise<{ runId: string; summary: string }> {
  const run = await storage.createScholarshipScrapeRun({
    triggerType: opts.trigger,
    triggeredBy: opts.triggeredBy || null,
    status: "running",
  });

  let institutionsTotal = 0;
  let institutionsScraped = 0;
  let institutionsSkipped = 0;
  let institutionsFailed = 0;
  let scholarshipsFound = 0;
  let scholarshipsUpdated = 0;
  let scholarshipsDeactivated = 0;

  try {
    const insts = await storage.listInstitutions({ isActive: true, limit: 1000 });
    institutionsTotal = insts.length;

    // Track institutions whose page we successfully fetched + extracted (or
    // confirmed unchanged). Only these are eligible for deactivation sweep.
    const fullyScrapedInstitutionIds: string[] = [];

    for (const inst of insts) {
      if (!inst.scholarshipUrl) {
        await storage.updateInstitution(inst.id, {
          lastScrapeStatus: "no_url",
          lastScrapedAt: new Date(),
        });
        institutionsSkipped++;
        continue;
      }
      try {
        const result = await scrapeOneInstitution(inst, run.id);
        if (result.success) {
          institutionsScraped++;
          fullyScrapedInstitutionIds.push(inst.id);
          if (result.skippedUnchanged) institutionsSkipped++;
          scholarshipsFound += result.created;
          scholarshipsUpdated += result.updated;
        } else {
          institutionsFailed++;
        }
      } catch (err: any) {
        institutionsFailed++;
        await storage.updateInstitution(inst.id, {
          lastScrapeStatus: "fetch_failed",
          lastScrapeError: String(err?.message || err).slice(0, 500),
          lastScrapedAt: new Date(),
        });
      }
    }

    // Deactivate auto-imported scholarships not seen this run, scoped only to
    // institutions whose page we actually successfully scraped/extracted.
    scholarshipsDeactivated = await storage.deactivateUnseenAutoImportedScholarships(
      run.id,
      fullyScrapedInstitutionIds,
    );

    await storage.updateScholarshipScrapeRun(run.id, {
      status: "completed",
      finishedAt: new Date(),
      institutionsTotal,
      institutionsScraped,
      institutionsSkipped,
      institutionsFailed,
      scholarshipsFound,
      scholarshipsUpdated,
      scholarshipsDeactivated,
    });
  } catch (err: any) {
    await storage.updateScholarshipScrapeRun(run.id, {
      status: "failed",
      finishedAt: new Date(),
      errorMessage: String(err?.message || err).slice(0, 1000),
      institutionsTotal,
      institutionsScraped,
      institutionsSkipped,
      institutionsFailed,
      scholarshipsFound,
      scholarshipsUpdated,
      scholarshipsDeactivated,
    });
    throw err;
  }

  const summary = `${institutionsScraped} scraped, ${institutionsSkipped} skipped, ${institutionsFailed} failed → +${scholarshipsFound} new, ~${scholarshipsUpdated} updated, ~${scholarshipsDeactivated} deactivated`;
  return { runId: run.id, summary };
}

async function scrapeOneInstitution(
  inst: Institution,
  runId: string,
): Promise<{ success: boolean; created: number; updated: number; skippedUnchanged: boolean }> {
  if (!inst.scholarshipUrl) return { success: false, created: 0, updated: 0, skippedUnchanged: true };

  const result = await fetchWithPolitePolicy(inst.scholarshipUrl);
  if (!result.ok) {
    await storage.updateInstitution(inst.id, {
      lastScrapeStatus: result.reason,
      lastScrapeError: result.error || null,
      lastScrapedAt: new Date(),
    });
    return { success: false, created: 0, updated: 0, skippedUnchanged: false };
  }

  const text = stripHtml(result.body);
  const hash = crypto.createHash("sha256").update(text).digest("hex");

  if (inst.lastContentHash === hash) {
    // Unchanged — re-stamp lastSeenAt on existing scholarships from this institution so we don't deactivate them
    await storage.touchScholarshipsForInstitution(inst.id, runId);
    await storage.updateInstitution(inst.id, {
      lastScrapeStatus: "skipped_unchanged",
      lastScrapedAt: new Date(),
      lastScrapeError: null,
    });
    return { success: true, created: 0, updated: 0, skippedUnchanged: true };
  }

  if (!openai) {
    await storage.updateInstitution(inst.id, {
      lastScrapeStatus: "extract_failed",
      lastScrapeError: "OPENAI_API_KEY not configured",
      lastScrapedAt: new Date(),
    });
    return { success: false, created: 0, updated: 0, skippedUnchanged: false };
  }

  const extraction = await extractScholarshipsWithLLM(inst, text);
  if (!extraction.ok) {
    // LLM call failed — do NOT update content hash and do NOT mark success,
    // so the next run will retry and the deactivation sweep won't touch this
    // institution's previously-approved scholarships.
    await storage.updateInstitution(inst.id, {
      lastScrapeStatus: "extract_failed",
      lastScrapeError: extraction.error.slice(0, 500),
      lastScrapedAt: new Date(),
    });
    return { success: false, created: 0, updated: 0, skippedUnchanged: false };
  }
  const extracted = extraction.scholarships;

  let created = 0;
  let updated = 0;
  for (const s of extracted) {
    const upserted = await storage.upsertAutoImportedScholarship({
      title: s.title,
      description: s.description || null,
      url: s.url || inst.scholarshipUrl,
      applicationUrl: s.url || inst.scholarshipUrl,
      sourceInstitutionId: inst.id,
      sourceUrl: inst.scholarshipUrl,
      scrapeRunId: runId,
      scholarshipAmount: s.amount || null,
      scholarshipDeadline: s.deadline || null,
      eligibilityCriteria: s.eligibility || [],
      studentLevel: s.studentLevel || null,
      isRecurring: !!s.isRecurring,
      category: inst.name,
    });
    if (upserted.created) created++;
    else updated++;
  }

  await storage.updateInstitution(inst.id, {
    lastScrapeStatus: "ok",
    lastScrapedAt: new Date(),
    lastContentHash: hash,
    lastScrapeError: null,
    lastScrapeScholarshipsFound: extracted.length,
  });

  return { success: true, created, updated, skippedUnchanged: false };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000); // cap to keep token cost bounded
}

type ExtractionResult =
  | { ok: true; scholarships: ExtractedScholarship[] }
  | { ok: false; error: string };

async function extractScholarshipsWithLLM(
  inst: Institution,
  pageText: string,
): Promise<ExtractionResult> {
  if (!openai) return { ok: false, error: "OPENAI_API_KEY not configured" };
  const prompt = `You are extracting scholarship listings from a US institution's scholarships page.
Return ONLY a JSON object with key "scholarships" — an array of objects. Each item has:
{
  "title": string (required, the scholarship name),
  "description": string (1-2 sentences, optional),
  "url": string (direct application URL if present, optional),
  "amount": string (e.g. "$5,000", "$2,500/year", "Full tuition", optional),
  "deadline": string (as printed, e.g. "March 1, 2026", "Rolling", "Annual — see site", optional),
  "eligibility": string[] (short bullet criteria, optional),
  "studentLevel": "high_school" | "undergraduate" | "graduate" | "all" (optional),
  "isRecurring": boolean (true if reapply each year, optional)
}

Rules:
- Only include actual named scholarships/grants/awards. Exclude generic financial aid descriptions, loan info, or work-study.
- If the page lists 0 scholarships, return {"scholarships": []}.
- NEVER invent details not on the page. If a field is not present, omit it.
- Cap at the first 25 scholarships.

Institution: ${inst.name}
Page URL: ${inst.scholarshipUrl}
Page content (text only, may be truncated):
"""
${pageText}
"""`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 2500,
      reasoning_effort: "minimal",
    });
    const content = res.choices[0]?.message?.content;
    if (!content) return { ok: false, error: "empty LLM response" };
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed?.scholarships)) {
      return { ok: false, error: "LLM response missing 'scholarships' array" };
    }
    const filtered = parsed.scholarships.filter(
      (s: any) => s && typeof s.title === "string" && s.title.trim(),
    );
    return { ok: true, scholarships: filtered };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}
