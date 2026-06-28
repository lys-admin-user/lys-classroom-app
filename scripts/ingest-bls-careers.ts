/**
 * Career Explorer data ingestion.
 *
 * Builds the full U.S. occupation list (~800 detailed SOC occupations) from
 * REAL, authoritative public sources and writes server/storage/careersGenerated.ts.
 *
 * Real data (never fabricated):
 *   - Wages (national + per-state, 10th/median/90th pctile) ...... BLS OEWS May 2023
 *   - Projected growth %, annual openings ........................ BLS Employment Projections 2024-34
 *   - Typical entry education, work experience, on-the-job training BLS Employment Projections
 *   - Occupation descriptions, skills, work styles, interests ..... O*NET 30.0
 *
 * Deterministically DERIVED from the real signals above (LYS Be-Know-Do framework,
 * which has no government source): bkdAlignment weights + personality, education
 * pathways (cost ranges are representative typical ranges), grade-level entry
 * points, and work environment text.
 *
 * Run:  npx tsx scripts/ingest-bls-careers.ts
 * Source files are cached under .local/bls_work so re-runs are fast.
 */
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as XLSXns from "xlsx";
const XLSX: any = (XLSXns as any).default || XLSXns;

const WORK = path.resolve(".local/bls_work");
const OUT = path.resolve("server/storage/careersGenerated.ts");
const UA = "LYS-Education-Platform/1.0 (contact: admin@lys.example)";

const SOURCES = {
  nat: { url: "https://www.bls.gov/oes/special-requests/oesm23nat.zip", zip: "nat.zip", xlsx: "oesm23nat/national_M2023_dl.xlsx" },
  st: { url: "https://www.bls.gov/oes/special-requests/oesm23st.zip", zip: "st.zip", xlsx: "oesm23st/state_M2023_dl.xlsx" },
  ep: { url: "https://www.bls.gov/emp/ind-occ-matrix/occupation.xlsx", file: "ep_occupation.xlsx" },
  onet: { url: "https://www.onetcenter.org/dl_files/database/db_30_0_text.zip", zip: "onet.zip" },
};

function ensureDownloads() {
  fs.mkdirSync(WORK, { recursive: true });
  const dl = (url: string, out: string) => {
    const dest = path.join(WORK, out);
    if (fs.existsSync(dest)) return dest;
    console.log("downloading", url);
    execSync(`curl -sS --max-time 240 -A ${JSON.stringify(UA)} -o ${JSON.stringify(dest)} ${JSON.stringify(url)}`, { stdio: "inherit" });
    return dest;
  };
  if (!fs.existsSync(path.join(WORK, SOURCES.nat.xlsx))) {
    dl(SOURCES.nat.url, SOURCES.nat.zip);
    execSync(`unzip -o -q ${JSON.stringify(path.join(WORK, SOURCES.nat.zip))} -d ${JSON.stringify(WORK)}`);
  }
  if (!fs.existsSync(path.join(WORK, SOURCES.st.xlsx))) {
    dl(SOURCES.st.url, SOURCES.st.zip);
    execSync(`unzip -o -q ${JSON.stringify(path.join(WORK, SOURCES.st.zip))} -d ${JSON.stringify(WORK)}`);
  }
  dl(SOURCES.ep.url, SOURCES.ep.file);
  const onetDir = path.join(WORK, "onet");
  if (!fs.existsSync(path.join(onetDir, "Skills.txt"))) {
    dl(SOURCES.onet.url, SOURCES.onet.zip);
    const want = ["Occupation Data.txt", "Skills.txt", "Knowledge.txt", "Work Styles.txt", "Interests.txt"]
      .map((f) => `"db_30_0_text/${f}"`).join(" ");
    execSync(`unzip -o -j ${JSON.stringify(path.join(WORK, SOURCES.onet.zip))} ${want} -d ${JSON.stringify(onetDir)}`, { stdio: "inherit" });
  }
}

const num = (v: any): number | null => (typeof v === "number" && isFinite(v) ? v : null);
const soc6 = (code: string): string => String(code).trim().slice(0, 7);
const TOPCODE = 239200; // BLS "#" annual top-code (>= $115/hr)

function readSheetRows(file: string, sheet?: string): any[] {
  const wb = XLSX.readFile(path.join(WORK, file));
  return XLSX.utils.sheet_to_json(wb.Sheets[sheet || wb.SheetNames[0]]);
}

// ---- OEWS national ----
interface Wage { min: number; max: number; median: number; emp: number | null; }
function parseWage(r: any): Wage | null {
  const median = num(r.A_MEDIAN) ?? (r.A_MEDIAN === "#" ? TOPCODE : null);
  if (median == null) return null;
  const min = num(r.A_PCT10) ?? median;
  const max = num(r.A_PCT90) ?? (r.A_PCT90 === "#" ? TOPCODE : median);
  return { min: Math.round(min), max: Math.round(max), median: Math.round(median), emp: num(r.TOT_EMP) };
}

function buildNational(): Map<string, { title: string; wage: Wage }> {
  const rows = readSheetRows(SOURCES.nat.xlsx, "national_M2023_dl");
  const m = new Map<string, { title: string; wage: Wage }>();
  for (const r of rows) {
    if (r.O_GROUP !== "detailed") continue;
    const w = parseWage(r);
    if (!w) continue;
    m.set(soc6(r.OCC_CODE), { title: String(r.OCC_TITLE).trim(), wage: w });
  }
  return m;
}

function buildState(): Map<string, Record<string, { min: number; max: number; median: number; employment?: number }>> {
  const rows = readSheetRows(SOURCES.st.xlsx);
  const m = new Map<string, Record<string, any>>();
  for (const r of rows) {
    if (r.O_GROUP !== "detailed") continue;
    const w = parseWage(r);
    if (!w) continue;
    const st = String(r.PRIM_STATE).trim();
    if (!st || st.length !== 2) continue;
    const code = soc6(r.OCC_CODE);
    if (!m.has(code)) m.set(code, {});
    const entry: any = { min: w.min, max: w.max, median: w.median };
    if (w.emp != null) entry.employment = w.emp;
    m.get(code)![st] = entry;
  }
  return m;
}

// ---- EP projections (Table 1.2) ----
interface EP { growth: number; openings: number; education: string; experience: string; ojt: string; }
function buildEP(): Map<string, EP> {
  const wb = XLSX.readFile(path.join(WORK, SOURCES.ep.file));
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets["Table 1.2"], { header: 1, blankrows: false });
  const m = new Map<string, EP>();
  for (const r of rows) {
    if (!r || r[2] !== "Line item") continue;
    const code = soc6(String(r[1]));
    const growth = typeof r[8] === "number" ? r[8] : parseFloat(r[8]);
    const openings = typeof r[10] === "number" ? r[10] : parseFloat(r[10]);
    m.set(code, {
      growth: isFinite(growth) ? Math.round(growth * 10) / 10 : 0,
      openings: isFinite(openings) ? Math.round(openings * 1000) : 0,
      education: typeof r[12] === "string" && r[12] !== "—" ? r[12] : "",
      experience: typeof r[13] === "string" && r[13] !== "—" ? r[13] : "None",
      ojt: typeof r[14] === "string" && r[14] !== "—" ? r[14] : "None",
    });
  }
  return m;
}

// ---- O*NET ----
function readTsv(file: string): Record<string, string>[] {
  const txt = fs.readFileSync(path.join(WORK, "onet", file), "utf8");
  const lines = txt.split(/\r?\n/).filter((l) => l.length);
  const header = lines[0].split("\t");
  return lines.slice(1).map((l) => {
    const cells = l.split("\t");
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = cells[i]));
    return o;
  });
}

const titleCase = (s: string) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

interface Onet {
  descriptions: Map<string, string>;
  importance: Map<string, Map<string, { name: string; value: number; group: string }>>; // soc6 -> elementId -> {..}
  interests: Map<string, { name: string; value: number }>; // soc6 -> top RIASEC
}

// element-id prefixes
const isContentSkill = (id: string) => id.startsWith("2.A."); // basic/content + process skills
const isSocialSkill = (id: string) => id.startsWith("2.B.1."); // social skills
const isTechnicalSkill = (id: string) => id.startsWith("2.B.3."); // technical skills

function buildOnet(): Onet {
  const occ = readTsv("Occupation Data.txt");
  const descriptions = new Map<string, string>();
  for (const r of occ) {
    const code = soc6(r["O*NET-SOC Code"]);
    // prefer the base .00 occupation's description
    if (!descriptions.has(code) || r["O*NET-SOC Code"].endsWith(".00")) {
      descriptions.set(code, (r["Title"] && r["Description"]) ? r["Description"] : descriptions.get(code) || "");
    }
  }

  // aggregate importance (IM scale) across O*NET-SOC variants per soc6
  const acc = new Map<string, Map<string, { name: string; sum: number; n: number; group: string }>>();
  const addFile = (file: string, group: string, scale = "IM") => {
    for (const r of readTsv(file)) {
      if (r["Scale ID"] !== scale) continue;
      const code = soc6(r["O*NET-SOC Code"]);
      const id = r["Element ID"];
      const value = parseFloat(r["Data Value"]);
      if (!isFinite(value)) continue;
      if (!acc.has(code)) acc.set(code, new Map());
      const em = acc.get(code)!;
      const cur = em.get(id) || { name: r["Element Name"], sum: 0, n: 0, group };
      cur.sum += value; cur.n += 1;
      em.set(id, cur);
    }
  };
  addFile("Skills.txt", "skill");
  addFile("Knowledge.txt", "knowledge");
  addFile("Work Styles.txt", "workstyle");

  const importance = new Map<string, Map<string, { name: string; value: number; group: string }>>();
  for (const [code, em] of acc) {
    const out = new Map<string, { name: string; value: number; group: string }>();
    for (const [id, v] of em) out.set(id, { name: v.name, value: v.sum / v.n, group: v.group });
    importance.set(code, out);
  }

  // interests (OI scale) -> top RIASEC per soc6
  const intAcc = new Map<string, Map<string, { name: string; sum: number; n: number }>>();
  for (const r of readTsv("Interests.txt")) {
    if (r["Scale ID"] !== "OI") continue;
    if (!["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"].includes(r["Element Name"])) continue;
    const code = soc6(r["O*NET-SOC Code"]);
    const value = parseFloat(r["Data Value"]);
    if (!isFinite(value)) continue;
    if (!intAcc.has(code)) intAcc.set(code, new Map());
    const em = intAcc.get(code)!;
    const cur = em.get(r["Element Name"]) || { name: r["Element Name"], sum: 0, n: 0 };
    cur.sum += value; cur.n += 1;
    em.set(r["Element Name"], cur);
  }
  const interests = new Map<string, { name: string; value: number }>();
  for (const [code, em] of intAcc) {
    let top = { name: "", value: -1 };
    for (const [, v] of em) { const avg = v.sum / v.n; if (avg > top.value) top = { name: v.name, value: avg }; }
    interests.set(code, top);
  }

  return { descriptions, importance, interests };
}

// ---- derivations ----
const MAJOR_TO_CATEGORY: Record<string, string> = {
  "11": "business", "13": "financial", "15": "technology", "17": "engineering",
  "19": "science", "21": "community_social", "23": "legal", "25": "education",
  "27": "creative", "29": "healthcare", "31": "healthcare_support", "33": "public_safety",
  "35": "food_service", "37": "maintenance", "39": "personal_services", "41": "sales",
  "43": "office_admin", "45": "agriculture", "47": "trades", "49": "trades",
  "51": "production", "53": "transportation", "55": "military",
};
const MAJOR_TO_OOH: Record<string, string> = {
  "11": "management", "13": "business-and-financial", "15": "computer-and-information-technology",
  "17": "architecture-and-engineering", "19": "life-physical-and-social-science",
  "21": "community-and-social-service", "23": "legal", "25": "education-training-and-library",
  "27": "arts-and-design", "29": "healthcare", "31": "healthcare", "33": "protective-service",
  "35": "food-preparation-and-serving", "37": "building-and-grounds-cleaning",
  "39": "personal-care-and-service", "41": "sales", "43": "office-and-administrative-support",
  "45": "farming-fishing-and-forestry", "47": "construction-and-extraction",
  "49": "installation-maintenance-and-repair", "51": "production", "53": "transportation-and-material-moving",
  "55": "military",
};

const GRADE_ENTRY: Record<string, Record<string, string>> = {
  technology: { middle_school: "Try coding games (Scratch, code.org), join a robotics or tech club.", high_school: "Take computer science / AP CS, build small projects, attend a hackathon.", post_secondary: "Pursue a CS/IT degree or bootcamp, build a portfolio, earn vendor certifications." },
  healthcare: { middle_school: "Take health and science classes, volunteer, join a health-careers club (HOSA).", high_school: "Take anatomy/biology, become a CNA or get CPR certified, shadow professionals.", post_secondary: "Enroll in the required degree/licensure program and complete clinical hours." },
  healthcare_support: { middle_school: "Take health classes, volunteer at care facilities, join a health-careers club.", high_school: "Earn an entry certification (CNA, phlebotomy), shadow professionals.", post_secondary: "Complete a postsecondary certificate or on-the-job training program." },
  trades: { middle_school: "Take shop/technology classes, build hands-on projects, join a CTE club.", high_school: "Take CTE courses, earn safety/tool certifications, look into a pre-apprenticeship.", post_secondary: "Enter a registered apprenticeship or trade-school program and earn licensure." },
  engineering: { middle_school: "Join robotics or a STEM club, enter science/engineering fairs.", high_school: "Take physics and advanced math, build engineering projects, try internships.", post_secondary: "Pursue an engineering degree and seek co-ops/internships." },
  science: { middle_school: "Do science fair projects, join a science club, explore nature/labs.", high_school: "Take advanced science courses, assist in a lab, enter research competitions.", post_secondary: "Pursue the required science degree and gain research/field experience." },
  business: { middle_school: "Join a business or entrepreneurship club, run a small project.", high_school: "Take business/economics, join DECA/FBLA, get a part-time leadership role.", post_secondary: "Pursue a business degree, build experience through internships." },
  financial: { middle_school: "Learn money basics, join a math or business club.", high_school: "Take accounting/economics, join FBLA, practice with budgeting tools.", post_secondary: "Pursue a finance/accounting degree and pursue relevant certifications." },
  legal: { middle_school: "Join debate, learn about government and civics.", high_school: "Take government/law courses, join mock trial, intern at a local office.", post_secondary: "Complete the required degree and licensure for the role." },
  education: { middle_school: "Tutor peers, help with younger students, join a future-educators club.", high_school: "Take education/child-development courses, volunteer in classrooms.", post_secondary: "Earn the required degree and teaching credential." },
  creative: { middle_school: "Build a portfolio, join art/media/music clubs, enter contests.", high_school: "Take art/design/media courses, create projects, build an online portfolio.", post_secondary: "Pursue a degree or build a professional portfolio and freelance work." },
  public_safety: { middle_school: "Join scouting or a public-safety explorer program, stay active.", high_school: "Take criminal justice/fire science CTE, get first-aid/EMT certs.", post_secondary: "Complete academy training, certifications, or a related degree." },
  food_service: { middle_school: "Learn cooking basics, join a culinary or FCCLA club.", high_school: "Take culinary CTE, get a food-handler card, work in a kitchen.", post_secondary: "Attend a culinary program or advance through on-the-job training." },
  maintenance: { middle_school: "Build hands-on skills, take technology/shop classes.", high_school: "Take CTE courses, get safety certifications, find part-time work.", post_secondary: "Complete on-the-job or apprenticeship training." },
  personal_services: { middle_school: "Explore the field through clubs and shadowing.", high_school: "Take a related CTE program and earn entry certifications.", post_secondary: "Complete the required state license or certificate program." },
  sales: { middle_school: "Practice communication, join a business club.", high_school: "Join DECA, get a customer-service or retail job, take marketing.", post_secondary: "Build sales experience; pursue a business degree for advancement." },
  office_admin: { middle_school: "Build computer and organization skills.", high_school: "Take business/computer courses, get office software certifications.", post_secondary: "Complete a certificate or gain on-the-job experience." },
  agriculture: { middle_school: "Join 4-H or FFA, explore gardening/animals/outdoors.", high_school: "Take agriculture CTE, join FFA, get hands-on farm/ranch experience.", post_secondary: "Pursue an agriculture program or apprenticeship." },
  production: { middle_school: "Take technology/shop classes, build hands-on projects.", high_school: "Take manufacturing CTE, earn safety certifications (OSHA).", post_secondary: "Complete on-the-job or technical-school training." },
  transportation: { middle_school: "Learn about logistics and vehicles, build responsibility.", high_school: "Take related CTE, prepare for required licenses/permits.", post_secondary: "Earn the required license (e.g., CDL) and complete training." },
  community_social: { middle_school: "Volunteer in the community, join service clubs.", high_school: "Take psychology/sociology, volunteer with social services.", post_secondary: "Pursue the required degree and supervised field experience." },
  military: { middle_school: "Build fitness and discipline, learn about service branches.", high_school: "Stay physically active, talk with a recruiter, consider JROTC.", post_secondary: "Enlist or pursue an officer commissioning path." },
};
const DEFAULT_ENTRY = { middle_school: "Explore this field through related classes, clubs, and reading.", high_school: "Take relevant CTE or academic courses and seek hands-on experience.", post_secondary: "Complete the required education or training and build experience." };

const WORK_ENV: Record<string, string> = {
  technology: "Office or remote settings; collaborative, computer-based work.",
  healthcare: "Hospitals, clinics, and care facilities; often shift work with physical demands.",
  healthcare_support: "Clinics, hospitals, and care facilities; hands-on patient support.",
  trades: "Job sites, workshops, and outdoor settings; physically active work.",
  engineering: "Offices, labs, and job sites; mix of design work and field work.",
  science: "Laboratories, offices, and field sites.",
  business: "Office settings; meetings, planning, and team coordination.",
  financial: "Office settings; analytical and detail-oriented work.",
  legal: "Offices and courtrooms.",
  education: "Schools, classrooms, and training facilities.",
  creative: "Studios, offices, or freelance/remote settings.",
  public_safety: "Field settings; physically demanding, sometimes high-stress.",
  food_service: "Kitchens, restaurants, and hospitality venues; fast-paced.",
  maintenance: "Buildings and grounds, indoors and outdoors.",
  personal_services: "Salons, spas, and client-facing settings.",
  sales: "Stores, offices, or on the road meeting clients.",
  office_admin: "Office settings; organizational and clerical work.",
  agriculture: "Farms, ranches, forests, and outdoor settings.",
  production: "Factories and production facilities; hands-on, safety-focused.",
  transportation: "On the road, in vehicles, warehouses, or transit hubs.",
  community_social: "Community agencies, schools, and client homes.",
  military: "Bases and field/deployment settings; structured environment.",
};

function jobOutlook(g: number): string {
  if (g >= 9) return "much_faster";
  if (g >= 5) return "faster_than_average";
  if (g >= 2) return "average";
  if (g >= -1) return "little_change";
  return "declining";
}
function demandLevel(g: number, openings: number): "low" | "moderate" | "high" | "very_high" {
  if (g >= 9 || openings >= 50000) return "very_high";
  if (g >= 5 || openings >= 20000) return "high";
  if (g >= 2 || openings >= 5000) return "moderate";
  return "low";
}
function yearsExperience(exp: string): string {
  if (/5 years or more/i.test(exp)) return "5+ years";
  if (/less than 5/i.test(exp)) return "1-5 years";
  return "0-2 years";
}

function pathways(education: string, ojt: string, category: string): any[] {
  const e = education.toLowerCase();
  const out: any[] = [];
  if (/doctoral|professional/.test(e)) out.push({ type: "college", description: "Earn the required doctoral or professional degree in this field.", duration: "6-10 years", cost: "$60,000-$300,000" });
  else if (/master/.test(e)) out.push({ type: "college", description: "Earn a Bachelor's then a Master's degree in a related field.", duration: "5-6 years", cost: "$60,000-$250,000" });
  else if (/bachelor/.test(e)) out.push({ type: "college", description: "Earn a Bachelor's degree in a related field from an accredited college.", duration: "4 years", cost: "$40,000-$200,000" });
  else if (/associate/.test(e)) out.push({ type: "college", description: "Earn an Associate's degree at a community or technical college.", duration: "2 years", cost: "$6,000-$40,000" });
  else if (/postsecondary nondegree/.test(e)) out.push({ type: "certification", description: "Complete a postsecondary certificate or licensing program.", duration: "6-18 months", cost: "$1,000-$20,000" });
  else if (/some college/.test(e)) out.push({ type: "college", description: "Complete relevant college coursework or a certificate program.", duration: "1-2 years", cost: "$5,000-$30,000" });
  else { // HS diploma or no formal credential
    if (/apprenticeship/i.test(ojt)) out.push({ type: "trade", description: "Enter a registered apprenticeship and earn while you learn.", duration: "1-4 years", cost: "Paid apprenticeship (earn while training)" });
    else out.push({ type: "trade", description: "Start in an entry-level role with on-the-job training.", duration: "Varies", cost: "Free (paid on-the-job training)" });
    out.push({ type: "certification", description: "Earn industry certifications to advance and increase pay.", duration: "3-12 months", cost: "$500-$10,000" });
  }
  // add trade/apprenticeship route for hands-on fields if not already
  if (["trades", "production", "maintenance", "agriculture", "transportation"].includes(category) && !out.some((p) => p.type === "trade")) {
    out.push({ type: "trade", description: "Complete a trade-school program or registered apprenticeship.", duration: "1-2 years", cost: "$5,000-$30,000" });
  }
  // military route for service-relevant fields
  if (["trades", "technology", "healthcare", "public_safety", "transportation", "engineering", "production", "maintenance"].includes(category)) {
    out.push({ type: "military", description: "Train and serve in a related military role, then transition to civilian work.", duration: "4+ years", cost: "Free + Benefits" });
  }
  return out;
}

function computeBkd(imp: Map<string, { name: string; value: number; group: string }> | undefined, interest: { name: string; value: number } | undefined) {
  // average importance buckets on the 1-5 O*NET scale
  const avg = (pred: (id: string, g: string) => boolean) => {
    let s = 0, n = 0;
    if (imp) for (const [id, v] of imp) if (pred(id, v.group)) { s += v.value; n++; }
    return n ? s / n : 0;
  };
  const knowRaw = avg((id, g) => g === "knowledge" || (g === "skill" && isContentSkill(id)));
  const doRaw = avg((id, g) => g === "skill" && isTechnicalSkill(id));
  const beRaw = avg((id, g) => g === "workstyle" || (g === "skill" && isSocialSkill(id)));
  const scale = (raw: number, boost = 0) => Math.max(15, Math.min(98, Math.round((raw / 5) * 100) + boost));
  // realistic interest nudges "do"; social interest nudges "be"
  const be = scale(beRaw, interest?.name === "Social" ? 6 : 0);
  const know = scale(knowRaw, interest?.name === "Investigative" ? 6 : 0);
  const doo = scale(doRaw || beRaw * 0.6, interest?.name === "Realistic" ? 6 : 0);
  const pillars: Array<["be" | "know" | "do", number]> = [["be", be], ["know", know], ["do", doo]];
  pillars.sort((a, b) => b[1] - a[1]);
  const primaryPillar = pillars[0][0];
  const riasecPhrase: Record<string, string> = {
    Realistic: "hands-on, practical worker", Investigative: "curious problem-solver",
    Artistic: "creative, expressive thinker", Social: "people-focused helper",
    Enterprising: "driven, persuasive leader", Conventional: "organized, detail-oriented worker",
  };
  const pillarPhrase: Record<string, string> = {
    be: "who values character, dependability, and serving others",
    know: "who enjoys analysis, learning, and applying knowledge",
    do: "who likes building, operating, and getting things done",
  };
  const personality = `${riasecPhrase[interest?.name || "Realistic"] || "versatile worker"} ${pillarPhrase[primaryPillar]}`;
  return { be, know, do: doo, primaryPillar, careerPersonality: personality.charAt(0).toUpperCase() + personality.slice(1) };
}

function topSkills(imp: Map<string, { name: string; value: number; group: string }> | undefined): string[] {
  if (!imp) return ["Communication", "Problem Solving", "Teamwork", "Critical Thinking"];
  const items = [...imp.values()].filter((v) => v.group === "skill" || v.group === "knowledge");
  items.sort((a, b) => b.value - a.value);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const name = titleCase(it.name);
    if (seen.has(name)) continue;
    seen.add(name); out.push(name);
    if (out.length >= 6) break;
  }
  return out.length ? out : ["Communication", "Problem Solving", "Teamwork"];
}

function main() {
  ensureDownloads();
  console.log("parsing sources...");
  const national = buildNational();
  const state = buildState();
  const ep = buildEP();
  const onet = buildOnet();
  console.log(`national=${national.size} state=${state.size} ep=${ep.size} onet.desc=${onet.descriptions.size}`);

  // related careers: group titles by minor group (first 4 digits incl dash, e.g. "15-12")
  const byMinor = new Map<string, Array<{ code: string; title: string }>>();
  for (const [code, v] of national) {
    const minor = code.slice(0, 5);
    if (!byMinor.has(minor)) byMinor.set(minor, []);
    byMinor.get(minor)!.push({ code, title: v.title });
  }

  const careers: any[] = [];
  for (const [code, nat] of national) {
    const major = code.slice(0, 2);
    const category = MAJOR_TO_CATEGORY[major] || "business";
    const e = ep.get(code);
    const growth = e?.growth ?? 0;
    const openings = e?.openings ?? 0;
    const imp = onet.importance.get(code);
    const interest = onet.interests.get(code);
    const bkd = computeBkd(imp, interest);
    const desc = onet.descriptions.get(code) ||
      `${nat.title} perform specialized work in the ${category.replace(/_/g, " ")} field.`;
    const education = e?.education || "See typical entry requirements";
    const related = (byMinor.get(code.slice(0, 5)) || [])
      .filter((x) => x.code !== code).slice(0, 3).map((x) => x.title);

    careers.push({
      id: `soc-${code}`,
      title: nat.title,
      category,
      description: desc,
      salaryMin: nat.wage.min,
      salaryMax: nat.wage.max,
      salaryMedian: nat.wage.median,
      educationRequired: education,
      yearsExperience: yearsExperience(e?.experience || "None"),
      growthRate: `${growth >= 0 ? "+" : ""}${growth}%`,
      skills: topSkills(imp),
      relatedCareers: related,
      pathways: pathways(education, e?.ojt || "None", category),
      bkdAlignment: bkd,
      blsCode: code,
      blsOohGroup: MAJOR_TO_OOH[major],
      jobOutlook: jobOutlook(growth),
      projectedGrowth: growth,
      projectedOpenings: openings,
      demandLevel: demandLevel(growth, openings),
      appropriateGrades: ["middle_school", "high_school", "post_secondary"],
      entryPointsForGrades: GRADE_ENTRY[category] || DEFAULT_ENTRY,
      stateSalaryData: state.get(code) || {},
      workEnvironment: WORK_ENV[category] || "Varies by employer and setting.",
      typicalEntryEducation: education,
      onTheJobTraining: e?.ojt || "None",
      blsLastUpdated: "2024-05",
    });
  }

  careers.sort((a, b) => a.title.localeCompare(b.title));
  const banner = `// AUTO-GENERATED by scripts/ingest-bls-careers.ts — DO NOT EDIT BY HAND.\n` +
    `// Source: BLS OEWS May 2023 (wages), BLS Employment Projections 2024-34 (growth/openings/education),\n` +
    `// O*NET 30.0 (descriptions/skills/work styles). ${careers.length} occupations.\n` +
    `// Quantitative market data is real/authoritative; Be-Know-Do, pathways cost ranges, grade entry\n` +
    `// points, and work-environment text are deterministically derived (LYS framework).\n`;
  // Emit the dataset as a JSON.parse("...") string literal rather than a raw
  // object literal: tsc treats the payload as a single string token (no costly
  // per-property type inference over ~800 objects), so the typecheck stays fast
  // and within memory. Runtime parse cost is a one-time ~negligible JSON.parse.
  const json = JSON.stringify(careers);
  const body = `import type { Career } from "@shared/schema";\n\n` +
    `export const generatedCareers: Career[] = JSON.parse(${JSON.stringify(json)}) as unknown as Career[];\n`;
  fs.writeFileSync(OUT, banner + body);
  console.log(`wrote ${careers.length} careers -> ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
}

main();
