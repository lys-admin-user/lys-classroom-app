import fs from "fs";
import path from "path";
import { storage } from "../storage";
import type { InsertInstitution } from "@shared/schema";

const SEED_PATH = path.join(import.meta.dirname, "institutionSeed.json");

type SeedRow = {
  ipedsId: string;
  name: string;
  websiteUrl: string;
  scholarshipUrl?: string | null;
  state: string;
  sector: string;
  enrollment: number | null;
};

export async function seedInstitutionsFromJsonIfEmpty(): Promise<{ seeded: number; skipped: boolean }> {
  const existing = await storage.listInstitutions({ limit: 1 });
  if (existing.length > 0) return { seeded: 0, skipped: true };

  const raw = fs.readFileSync(SEED_PATH, "utf-8");
  const rows: SeedRow[] = JSON.parse(raw);
  const seen = new Set<string>();
  let seeded = 0;
  for (const row of rows) {
    const key = `${row.ipedsId}|${row.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const insert: InsertInstitution = {
      ipedsId: row.ipedsId,
      name: row.name,
      websiteUrl: row.websiteUrl,
      scholarshipUrl: row.scholarshipUrl || null,
      state: row.state,
      sector: row.sector as any,
      enrollment: row.enrollment,
      scholarshipUrlDiscoveryStatus: row.scholarshipUrl ? "found" : "pending",
      isActive: true,
    };
    await storage.createInstitution(insert);
    seeded++;
  }
  return { seeded, skipped: false };
}

/**
 * Pulls top 500 US institutions by undergrad enrollment from the College Scorecard API
 * (a US Department of Education product). Requires DATA_GOV_API_KEY env var.
 * Free key signup: https://api.data.gov/signup/
 *
 * Safe to call repeatedly — upserts by ipedsId.
 */
export async function refreshInstitutionsFromScorecard(): Promise<{
  fetched: number;
  upserted: number;
  error?: string;
}> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    return {
      fetched: 0,
      upserted: 0,
      error: "DATA_GOV_API_KEY env var is not set. Get a free key at https://api.data.gov/signup/",
    };
  }

  const PER_PAGE = 100;
  const TARGET = 500;
  const fields = [
    "id",
    "school.name",
    "school.school_url",
    "school.state",
    "school.ownership", // 1 public, 2 private nonprofit, 3 private for-profit
    "school.institutional_characteristics.level", // 1=4yr, 2=2yr, 3=<2yr
    "latest.student.size",
  ].join(",");

  const all: any[] = [];
  for (let page = 0; all.length < TARGET; page++) {
    const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${apiKey}&per_page=${PER_PAGE}&page=${page}&fields=${fields}&sort=latest.student.size:desc&latest.student.size__range=1..&school.operating=1`;
    const res = await fetch(url);
    if (!res.ok) {
      return { fetched: all.length, upserted: 0, error: `Scorecard API ${res.status}: ${await res.text()}` };
    }
    const json: any = await res.json();
    const results = json.results || [];
    if (results.length === 0) break;
    all.push(...results);
    if (page > 10) break; // safety
  }

  const top = all.slice(0, TARGET);
  let upserted = 0;
  for (const row of top) {
    const ownership = row["school.ownership"];
    const level = row["school.institutional_characteristics.level"];
    const sector = mapSector(ownership, level);
    const websiteUrl = normalizeUrl(row["school.school_url"]);
    const insert: InsertInstitution = {
      ipedsId: String(row.id),
      name: row["school.name"],
      websiteUrl,
      state: row["school.state"],
      sector: sector as any,
      enrollment: row["latest.student.size"] ?? null,
      scholarshipUrlDiscoveryStatus: "pending",
      isActive: true,
    };
    await storage.upsertInstitutionByIpedsId(insert);
    upserted++;
  }

  return { fetched: all.length, upserted };
}

function mapSector(ownership: number, level: number): string {
  const own = ownership === 1 ? "public" : ownership === 2 ? "private_nonprofit" : "private_forprofit";
  const lvl = level === 1 ? "4yr" : level === 2 ? "2yr" : "trade";
  if (lvl === "trade") return "trade_vocational";
  return `${own}_${lvl}`;
}

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}
