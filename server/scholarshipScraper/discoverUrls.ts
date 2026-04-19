import OpenAI from "openai";
import { storage } from "../storage";
import { fetchWithPolitePolicy } from "./fetcher";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const KEYWORDS = [
  "scholarship", "scholarships", "financial-aid", "financialaid", "financial_aid",
  "grants", "awards", "aid",
];

/**
 * For each institution missing a scholarship URL, look at the homepage and pick
 * the most likely scholarship index page. Uses gpt-4o-mini ONLY when there are
 * multiple plausible candidates; otherwise picks heuristically. Caps at one
 * LLM call per institution.
 */
export async function discoverScholarshipUrls(opts: { limit?: number } = {}): Promise<{
  attempted: number;
  found: number;
  notFound: number;
  failed: number;
}> {
  const limit = opts.limit ?? 1000;
  const pending = await storage.listInstitutions({
    discoveryStatus: "pending",
    missingScholarshipUrl: true,
    limit,
  });

  let found = 0;
  let notFound = 0;
  let failed = 0;

  for (const inst of pending) {
    if (!inst.websiteUrl) {
      await storage.updateInstitution(inst.id, {
        scholarshipUrlDiscoveryStatus: "not_found",
        lastDiscoveryAttemptAt: new Date(),
      });
      notFound++;
      continue;
    }

    try {
      const result = await fetchWithPolitePolicy(inst.websiteUrl);
      if (!result.ok) {
        await storage.updateInstitution(inst.id, {
          scholarshipUrlDiscoveryStatus: "failed",
          lastDiscoveryAttemptAt: new Date(),
        });
        failed++;
        continue;
      }
      const candidates = extractCandidateLinks(result.body, inst.websiteUrl);
      if (candidates.length === 0) {
        await storage.updateInstitution(inst.id, {
          scholarshipUrlDiscoveryStatus: "not_found",
          lastDiscoveryAttemptAt: new Date(),
        });
        notFound++;
        continue;
      }

      let chosen: string | null = candidates[0].url;
      if (candidates.length > 1 && openai) {
        chosen = await pickBestUrlWithLLM(inst.name, candidates);
      }

      if (chosen) {
        await storage.updateInstitution(inst.id, {
          scholarshipUrl: chosen,
          scholarshipUrlDiscoveryStatus: "found",
          lastDiscoveryAttemptAt: new Date(),
        });
        found++;
      } else {
        await storage.updateInstitution(inst.id, {
          scholarshipUrlDiscoveryStatus: "not_found",
          lastDiscoveryAttemptAt: new Date(),
        });
        notFound++;
      }
    } catch (err: any) {
      await storage.updateInstitution(inst.id, {
        scholarshipUrlDiscoveryStatus: "failed",
        lastDiscoveryAttemptAt: new Date(),
      });
      failed++;
    }
  }

  return { attempted: pending.length, found, notFound, failed };
}

function extractCandidateLinks(html: string, baseUrl: string): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = [];
  const seen = new Set<string>();
  const re = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let baseHost: string;
  try {
    baseHost = new URL(baseUrl).host;
  } catch {
    return out;
  }

  while ((m = re.exec(html))) {
    const href = m[1];
    const text = m[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(absolute)) continue;
    let absHost: string;
    try {
      absHost = new URL(absolute).host;
    } catch {
      continue;
    }
    if (!absHost.endsWith(baseHost.replace(/^www\./, ""))) continue;
    const lower = absolute.toLowerCase();
    const matches = KEYWORDS.some((k) => lower.includes(k) || text.includes(k));
    if (!matches) continue;
    seen.add(absolute);
    out.push({ url: absolute, text });
    if (out.length >= 12) break;
  }
  return out;
}

async function pickBestUrlWithLLM(
  institutionName: string,
  candidates: { url: string; text: string }[],
): Promise<string | null> {
  if (!openai) return candidates[0].url;
  const prompt = `Pick the single best URL that is the institution's primary "scholarships" landing/index page for prospective and current students. Prefer pages that list multiple scholarships. Return ONLY the URL, nothing else. If none look right, return "none".

Institution: ${institutionName}
Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.url}  ("${c.text}")`).join("\n")}`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0,
    });
    const choice = res.choices[0]?.message?.content?.trim();
    if (!choice || choice.toLowerCase() === "none") return null;
    if (candidates.some((c) => c.url === choice)) return choice;
    if (/^https?:\/\//.test(choice)) return choice;
    return candidates[0].url;
  } catch {
    return candidates[0].url;
  }
}
