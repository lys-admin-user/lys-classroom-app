import { storage } from "../storage";
import { runScholarshipScrape } from "./scraper";
import { seedInstitutionsFromJsonIfEmpty } from "./seedInstitutions";
import { discoverScholarshipUrls } from "./discoverUrls";

let intervalHandle: NodeJS.Timeout | null = null;
let isRunning = false;
const QUARTERLY_MS = 90 * 24 * 60 * 60 * 1000;
const DAILY_CHECK_MS = 24 * 60 * 60 * 1000;

export function isScrapeRunning(): boolean {
  return isRunning;
}

export async function triggerScrape(opts: {
  trigger: "scheduled" | "manual" | "startup";
  triggeredBy?: string | null;
}): Promise<{ ok: boolean; runId?: string; summary?: string; error?: string }> {
  if (isRunning) {
    return { ok: false, error: "A scrape is already in progress." };
  }
  isRunning = true;
  try {
    const { runId, summary } = await runScholarshipScrape(opts);
    return { ok: true, runId, summary };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) };
  } finally {
    isRunning = false;
  }
}

/**
 * Initialize on server start:
 *  1. Seed institutions table from JSON if empty
 *  2. If no scrape has ever run, kick off the first scrape in the background
 *  3. Schedule a quarterly scrape via setInterval
 */
export async function scheduleQuarterlyScholarshipScrape(): Promise<void> {
  if (intervalHandle) return; // idempotent

  try {
    const seedResult = await seedInstitutionsFromJsonIfEmpty();
    if (!seedResult.skipped) {
      console.log(`[scholarship-scraper] Seeded ${seedResult.seeded} institutions from JSON.`);
    }
  } catch (err: any) {
    console.error("[scholarship-scraper] Institution seed failed:", err?.message || err);
  }

  // setInterval can't hold values > ~24.8 days, so we tick daily and check
  // whether 90 days have elapsed since the last successful scrape.
  intervalHandle = setInterval(async () => {
    try {
      if (isRunning) return;
      const runs = await storage.listScholarshipScrapeRuns({ limit: 1 });
      const last = runs[0];
      const lastTime = last?.finishedAt ? new Date(last.finishedAt).getTime() : last?.startedAt ? new Date(last.startedAt).getTime() : 0;
      if (Date.now() - lastTime < QUARTERLY_MS) return;
      const r = await triggerScrape({ trigger: "scheduled" });
      if (r.ok) console.log(`[scholarship-scraper] Quarterly scrape complete: ${r.summary}`);
      else console.error(`[scholarship-scraper] Quarterly scrape failed: ${r.error}`);
    } catch (err: any) {
      console.error("[scholarship-scraper] Daily check failed:", err?.message || err);
    }
  }, DAILY_CHECK_MS);

  // First-run: if no scrape has ever happened, kick one off after a short delay
  // so server startup is not blocked.
  setTimeout(async () => {
    try {
      const runs = await storage.listScholarshipScrapeRuns({ limit: 1 });
      if (runs.length > 0) return;

      // Discover URLs first (one-time) for any institutions missing them
      console.log("[scholarship-scraper] First boot: discovering missing scholarship URLs...");
      const disc = await discoverScholarshipUrls({ limit: 1000 });
      console.log(
        `[scholarship-scraper] URL discovery: ${disc.found} found, ${disc.notFound} not_found, ${disc.failed} failed`,
      );

      console.log("[scholarship-scraper] First boot: starting initial scrape...");
      const r = await triggerScrape({ trigger: "startup" });
      if (r.ok) console.log(`[scholarship-scraper] Initial scrape complete: ${r.summary}`);
      else console.error(`[scholarship-scraper] Initial scrape failed: ${r.error}`);
    } catch (err: any) {
      console.error("[scholarship-scraper] First-run kickoff failed:", err?.message || err);
    }
  }, 30_000); // 30s after boot

  console.log("[scholarship-scraper] Quarterly scrape scheduled (every 90 days).");
}
