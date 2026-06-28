/**
 * Ingest the LYS Comprehensive Roles & Operational Directory into a structured
 * seed file for the Team Hub role directory.
 *
 * Source of truth: server/hr/rolesSource.txt (plain-text extraction of
 * attached_assets/LYS_Comprehensive_Roles_*.pdf via `pdftotext -layout`).
 *
 * Output: server/hr/rolesGenerated.ts (GENERATED_HR_ROLES: SeedHrRole[]).
 *
 * Re-run after refreshing the source document:
 *   npx tsx scripts/ingest-lys-roles.ts
 *
 * The parser is faithful to the document: KPI/SOP targets that are left blank in
 * the source are transcribed without a fabricated number. Admins can fill in /
 * adjust / increase KPIs and SOPs later through the in-app role editor.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(process.cwd(), "server/hr/rolesSource.txt");
const OUT = resolve(process.cwd(), "server/hr/rolesGenerated.ts");

// Strip zero-width chars and normalize whitespace.
function clean(s: string): string {
  return s.replace(/[\u200b\u200c\u200d\ufeff]/g, "").replace(/\s+/g, " ").trim();
}

const BULLET = /^[\u25cf\u25aa\u2022]/; // ● ▪ •
const SUB = /^[\u25cb\u25e6\u25aa\u2218]/; // ○ ◦

function isBullet(line: string): boolean {
  return BULLET.test(clean(line).replace(/[\u200b]/g, "").trimStart()) || /^●/.test(line.trimStart().replace(/^\s+/, ""));
}

type Role = {
  id: string;
  num: number;
  title: string;
  department: string;
  horizon: "active" | "near_future" | "future";
  employmentType: string;
  summary: string;
  bkdBe: string;
  bkdKnow: string;
  bkdDo: string;
  kpis: { name: string; target?: string }[];
  sops: { daily: string[]; weekly: string[]; monthly: string[]; semester: string[]; yearly: string[] };
  tools: string[];
  evaluationChecklist: string[];
};

function slugify(title: string, num: number): string {
  const base = title
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48)
    .replace(/-$/, "");
  return `role-${String(num).padStart(2, "0")}-${base}`;
}

function deriveHorizon(title: string, section: string): "active" | "near_future" | "future" {
  const t = `${title} ${section}`.toLowerCase();
  if (/near-future|near future/.test(t)) return "near_future";
  if (/year 3|phase 3|distant-future|distant future|n\.e\.s\.t|study abroad/.test(t)) return "future";
  return "active";
}

function deriveEmployment(title: string): string {
  const m = title.match(/\(([^)]*)\)\s*$/);
  const paren = m ? m[1].toLowerCase() : "";
  if (/hourly|intern/.test(paren)) return "Intern / Hourly";
  if (/retainer/.test(paren)) return "Retainer";
  if (/royalty/.test(paren)) return "1099 / Royalty";
  if (/contract\b/.test(paren) && /1099/.test(paren)) return "Contract / 1099";
  if (/contract/.test(paren)) return "Contract";
  if (/1099/.test(paren)) return "1099 Contractor";
  if (/w-?2/.test(paren)) return "W-2 Employee";
  return "Full-time";
}

function cleanTitle(raw: string): string {
  // Drop trailing employment/horizon parentheticals for a cleaner display title,
  // but keep meaningful acronym parentheticals like (CEO), (GDAR), (RIC).
  return clean(raw);
}

const text = readFileSync(SRC, "utf8");
const lines = text.split(/\r?\n/);

// Index section headers (department) and role headers.
type Marker = { idx: number; type: "section" | "role"; text: string };
const markers: Marker[] = [];
lines.forEach((line, idx) => {
  const c = clean(line);
  if (/^Section\s+2\.\d+:\s+/.test(c)) markers.push({ idx, type: "section", text: c.replace(/^Section\s+2\.\d+:\s+/, "") });
  else if (/^Role\s+\d+:\s+/.test(c)) markers.push({ idx, type: "role", text: c });
});

const roleStarts = markers.filter((m) => m.type === "role");
const roles: Role[] = [];

function sectionForIdx(idx: number): string {
  let s = "General";
  for (const m of markers) {
    if (m.type === "section" && m.idx < idx) s = m.text;
  }
  return s;
}

// All marker positions (role + section), sorted, so a role block ends at the
// next marker of EITHER type — preventing a trailing "Section 2.x" header (which
// sits between the last role of one section and the first of the next) from
// bleeding into the previous role's content.
const allMarkerIdx = markers.map((m) => m.idx).sort((a, b) => a - b);

for (let i = 0; i < roleStarts.length; i++) {
  const start = roleStarts[i].idx;
  const nextMarker = allMarkerIdx.find((idx) => idx > start);
  const end = nextMarker ?? lines.length;
  const block = lines.slice(start, end);
  const headerC = clean(block[0]);
  const hm = headerC.match(/^Role\s+(\d+):\s+(.*)$/);
  if (!hm) continue;
  const num = parseInt(hm[1], 10);
  const title = cleanTitle(hm[2]);
  const section = sectionForIdx(start);

  // Split the block into numbered subsections (1..6) by their header lines.
  const subHeaders: { key: string; idx: number }[] = [];
  block.forEach((line, j) => {
    const c = clean(line);
    if (/^1\.\s*Executive Summary/i.test(c)) subHeaders.push({ key: "summary", idx: j });
    else if (/^2\.\s*BE.?KNOW.?DO/i.test(c)) subHeaders.push({ key: "bkd", idx: j });
    else if (/^3\.\s*Key Performance Indicators/i.test(c)) subHeaders.push({ key: "kpis", idx: j });
    else if (/^4\.\s*Standard Operating Procedures/i.test(c)) subHeaders.push({ key: "sops", idx: j });
    else if (/^5\.\s*Tools\s*&\s*Templates/i.test(c)) subHeaders.push({ key: "tools", idx: j });
    else if (/^6\.\s*Performance Evaluation Checklist/i.test(c)) subHeaders.push({ key: "eval", idx: j });
  });

  function sectionLines(key: string): string[] {
    const sh = subHeaders.find((s) => s.key === key);
    if (!sh) return [];
    const next = subHeaders.filter((s) => s.idx > sh.idx).sort((a, b) => a.idx - b.idx)[0];
    const from = sh.idx + 1;
    const to = next ? next.idx : block.length;
    return block.slice(from, to);
  }

  // Group raw lines into logical bullets: a top-level (●) or sub-level (○)
  // marker starts a new item; non-marker indented lines continue the prior item.
  type Item = { level: "top" | "sub"; text: string };
  function groupBullets(raw: string[]): Item[] {
    const items: Item[] = [];
    for (const line of raw) {
      const trimmed = line.replace(/[\u200b]/g, "").trimStart();
      const c = clean(line);
      if (!c) continue;
      // Never let a stray section/role header or a numbered subsection header
      // become content (defensive — block slicing should already exclude them).
      if (/^Section\s+2\.\d+:/.test(c) || /^Role\s+\d+:/.test(c)) continue;
      if (/^[1-6]\.\s+(Executive Summary|BE.?KNOW.?DO|Key Performance|Standard Operating|Tools|Performance Evaluation)/i.test(c)) continue;
      if (/^●/.test(trimmed)) {
        items.push({ level: "top", text: clean(trimmed.replace(/^●\s*/, "")) });
      } else if (/^○/.test(trimmed)) {
        items.push({ level: "sub", text: clean(trimmed.replace(/^○\s*/, "")) });
      } else if (items.length > 0) {
        // continuation of the previous bullet
        items[items.length - 1].text = clean(`${items[items.length - 1].text} ${clean(line)}`);
      }
    }
    return items.filter((it) => it.text.length > 0);
  }

  // 1. Summary — join all non-empty lines.
  const summary = clean(sectionLines("summary").join(" "));

  // 2. BKD
  let bkdBe = "", bkdKnow = "", bkdDo = "";
  for (const it of groupBullets(sectionLines("bkd"))) {
    const m = it.text.match(/^(BE|KNOW|DO)\s*:?\s*(.*)$/i);
    if (!m) continue;
    const val = clean(m[2]);
    if (/be/i.test(m[1])) bkdBe = val;
    else if (/know/i.test(m[1])) bkdKnow = val;
    else if (/do/i.test(m[1])) bkdDo = val;
  }

  // 3. KPIs — each top-level bullet becomes one KPI. Try to split "Label: value".
  const kpis: { name: string; target?: string }[] = [];
  for (const it of groupBullets(sectionLines("kpis"))) {
    if (it.level !== "top") continue;
    const t = it.text;
    // Many bullets read "<Category> KPIs: <description with possible blank>".
    kpis.push({ name: t });
  }

  // 4. SOPs — top-level bullets are cadence headers; sub-bullets are tasks.
  const sops = { daily: [] as string[], weekly: [] as string[], monthly: [] as string[], semester: [] as string[], yearly: [] as string[] };
  let cadence: keyof typeof sops | null = null;
  for (const it of groupBullets(sectionLines("sops"))) {
    if (it.level === "top") {
      const c = it.text.toLowerCase();
      if (/daily/.test(c)) cadence = "daily";
      else if (/weekly/.test(c)) cadence = "weekly";
      else if (/monthly/.test(c)) cadence = "monthly";
      else if (/semester|bi-?annual/.test(c)) cadence = "semester";
      else if (/yearly|annual/.test(c)) cadence = "yearly";
      else cadence = null;
    } else if (it.level === "sub" && cadence) {
      sops[cadence].push(it.text);
    }
  }

  // 5. Tools
  const tools = groupBullets(sectionLines("tools")).filter((it) => it.level === "top").map((it) => it.text);

  // 6. Evaluation checklist — strip leading "[ ]".
  const evaluationChecklist = groupBullets(sectionLines("eval"))
    .filter((it) => it.level === "top")
    .map((it) => clean(it.text.replace(/^\[\s*\]\s*/, "")));

  roles.push({
    id: slugify(title, num),
    num,
    title,
    department: section,
    horizon: deriveHorizon(title, section),
    employmentType: deriveEmployment(title),
    summary,
    bkdBe,
    bkdKnow,
    bkdDo,
    kpis,
    sops,
    tools,
    evaluationChecklist,
  });
}

// Emit the generated TS file.
const header = `import type { SeedHrRole } from "./roleSeed";

// AUTO-GENERATED by scripts/ingest-lys-roles.ts from server/hr/rolesSource.txt
// (the LYS Comprehensive Roles & Operational Directory). DO NOT EDIT BY HAND —
// re-run \`npx tsx scripts/ingest-lys-roles.ts\` to refresh. Admin edits made in
// the app are stored in the database and are NOT overwritten by re-seeding
// (the seeder is idempotent by stable id).
export const GENERATED_HR_ROLES: SeedHrRole[] = `;

const body = roles
  .sort((a, b) => a.num - b.num)
  .map((r) => {
    const { num, ...rest } = r;
    return {
      ...rest,
      reportsToId: null,
      sortOrder: num * 10,
      onboardingTemplate: [] as string[],
    };
  });

writeFileSync(OUT, header + JSON.stringify(body, null, 2) + ";\n", "utf8");

console.log(`Parsed ${roles.length} roles -> ${OUT}`);
for (const r of roles) {
  console.log(
    `  #${String(r.num).padStart(2)} ${r.title} | dept=${r.department} | horizon=${r.horizon} | emp=${r.employmentType} | kpis=${r.kpis.length} sops(d/w/m/s/y)=${r.sops.daily.length}/${r.sops.weekly.length}/${r.sops.monthly.length}/${r.sops.semester.length}/${r.sops.yearly.length} tools=${r.tools.length} eval=${r.evaluationChecklist.length} summary=${r.summary.length}c be=${r.bkdBe.length}c`,
  );
}
