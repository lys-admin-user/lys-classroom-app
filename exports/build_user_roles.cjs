const XLSX = require("xlsx");

// Roles ranked low -> high (for detecting who lost access)
const RANK = {
  student: 1,
  homeschool_parent: 2,
  educator: 3,
  staff: 4,
  campus_admin: 5,
  district_admin: 6,
  site_admin: 7,
  system_admin: 8,
};
const PERMS = {
  student: "Basic learner: practice, portfolio, goals. No teaching or admin tools.",
  homeschool_parent: "Homeschool planner + oversight of their own children.",
  educator: "Full teacher tools: lessons, classroom, gradebook, student records.",
  staff: "Educator tools PLUS internal Team Hub (HR/ops).",
  campus_admin: "Manages one school/campus and its staff.",
  district_admin: "Manages a district (multiple campuses).",
  site_admin: "Near-top admin across the whole platform.",
  system_admin: "Full control of everything, including managing other admins.",
};
const pretty = (r) => (r || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// [email, first, last, role, tier, status, mfa, loginCount]
const PROD = [
  ["aldenne@yugorithm.com", "", "", "educator", "free", "active", "no", 3],
  ["austilord@gmail.com", "", "", "educator", "free", "active", "no", 3],
  ["austine.itebalumeh@ladderingyoursuccess.com", "", "", "educator", "free", "active", "no", 7],
  ["carolyn.m.grey@gmail.com", "", "", "educator", "free", "active", "no", 1],
  ["danielhill1983@gmail.com", "", "", "educator", "free", "active", "no", 5],
  ["festus.aaa@gmail.com", "", "", "educator", "free", "active", "no", 3],
  ["info@ladderingyoursuccess.com", "", "", "educator", "free", "active", "no", 8],
  ["kirsten.watson@terrellisd.org", "", "", "educator", "free", "active", "no", 1],
  ["nmosqueda.teach@gmail.com", "Natividad", "Mosqueda", "educator", "free", "active", "no", 1],
  ["olay.shorunke@ladderingyoursuccess.com", "Olay", "Shorunke", "educator", "free", "active", "no", 3],
  ["shorunke86@gmail.com", "shorunke86", "", "educator", "free", "active", "no", 4],
  ["acadewole@gmail.com", "Bayo", "", "student", "free", "active", "no", 1],
  ["bayo@maskil.dev", "Bayo", "Adewole", "student", "free", "active", "no", 16],
  ["espinodanniell@gmail.com", "", "", "student", "free", "active", "no", 1],
  ["esther.eumoren@ladderingyoursuccess.com", "", "", "student", "free", "active", "no", 30],
  ["festus.amoye@ladderingyoursuccess.com", "Festus", "Amoye", "student", "free", "active", "no", 11],
  ["kimberly.abitong@ladderingyoursuccess.com", "", "", "student", "free", "active", "no", 2],
  ["lojickse7en@gmail.com", "", "", "student", "pro", "active", "no", 1],
  ["olayinka.shorunke@gmail.com", "", "", "student", "free", "active", "no", 2],
  ["remidairo@gmail.com", "Remi", "Dairo", "student", "free", "active", "no", 2],
  ["viha.kini@gmail.com", "@vihaakinii", "", "student", "free", "active", "no", 1],
];
const DEV = [
  ["dev-campus_admin@lys.test", "Test", "Campus Admin", "campus_admin", "free", "active", "no", 0],
  ["dev-district_admin@lys.test", "Test", "District Admin", "district_admin", "free", "active", "no", 0],
  ["dev-educator@lys.test", "Test", "Educator", "educator", "pro", "active", "no", 0],
  ["lojickse7en@gmail.com", "", "", "educator", "pro", "active", "no", 7],
  ["dev-homeschool_parent@lys.test", "Test", "Homeschool Parent", "homeschool_parent", "free", "active", "no", 0],
  ["dev-site_admin@lys.test", "Test", "Site Admin", "site_admin", "free", "active", "no", 0],
  ["dev-staff@lys.test", "Test", "Staff", "staff", "free", "active", "no", 0],
  ["acadewole@gmail.com", "Bayo", "Adewole", "student", "free", "active", "no", 6],
  ["dev-student@lys.test", "Test", "Student", "student", "free", "active", "no", 0],
  ["educatorvMjm_P@example.com", "Test", "Educator", "student", "pro", "active", "no", 0],
  ["teacher@lys.edu", "Sarah", "Johnson", "student", "free", "active", "no", 0],
  ["aldenne@yugorithm.com", "Aldenne", "Joy", "system_admin", "enterprise", "active", "no", 0],
  ["bayo@maskil.dev", "Bayo", "Adewole", "system_admin", "campus", "active", "yes", 9],
  ["dev-system_admin@lys.test", "Test", "System Admin", "system_admin", "free", "active", "no", 0],
  ["festus.amoye@ladderingyoursuccess.com", "Festus", "Amoye", "system_admin", "enterprise", "active", "yes", 29],
  ["info@ladderingyoursuccess.com", "AJ", "AJ", "system_admin", "enterprise", "active", "no", 0],
  ["jsalazar@thenomadnet.com", "Juan", "Salazar", "system_admin", "enterprise", "active", "no", 0],
  ["juan@headwayidealabs.com", "Juan", "Salazar", "system_admin", "enterprise", "active", "no", 0],
  ["olay.shorunke@ladderingyoursuccess.com", "Olay", "Shorunke", "system_admin", "enterprise", "active", "no", 0],
  ["weso@headwayidealabs.com", "wes", "okeke", "system_admin", "enterprise", "active", "no", 0],
];

const isTest = (email) =>
  email.endsWith("@lys.test") || email.endsWith("@lys.edu") || email.endsWith("@example.com");

const devByEmail = new Map(DEV.map((r) => [r[0].toLowerCase(), r]));
const prodByEmail = new Map(PROD.map((r) => [r[0].toLowerCase(), r]));
const allEmails = Array.from(new Set([...PROD, ...DEV].map((r) => r[0].toLowerCase()))).sort();

// ---- Sheet 1: Action list (real people, side-by-side) ----
const compareRows = [];
for (const email of allEmails) {
  if (isTest(email)) continue;
  const d = devByEmail.get(email);
  const p = prodByEmail.get(email);
  const prevRole = d ? d[3] : null;
  const curRole = p ? p[3] : null;
  const name = ((p && (p[1] || p[2]) ? `${p[1]} ${p[2]}` : d && (d[1] || d[2]) ? `${d[1]} ${d[2]}` : "")).trim();
  let action = "";
  if (!p) action = "Not on live site (dev-only)";
  else if (!d) action = "New on live site (no prior role)";
  else if (prevRole === curRole) action = "OK — matches";
  else if (RANK[prevRole] > RANK[curRole]) action = `NEEDS FIX -> set to ${pretty(prevRole)}`;
  else action = `Now higher than before (was ${pretty(prevRole)})`;
  compareRows.push({
    Email: email,
    Name: name,
    "Previous Role (your setup)": prevRole ? pretty(prevRole) : "—",
    "Current Role (LIVE site)": curRole ? pretty(curRole) : "—",
    "What previous role could do": prevRole ? PERMS[prevRole] : "",
    "Action needed": action,
  });
}
// Put NEEDS FIX rows first
compareRows.sort((a, b) => {
  const rank = (x) => (x["Action needed"].startsWith("NEEDS FIX") ? 0 : x["Action needed"].startsWith("OK") ? 2 : 1);
  return rank(a) - rank(b) || a.Email.localeCompare(b.Email);
});

const toSheet = (rows, header) => {
  const ws = XLSX.utils.json_to_sheet(rows, { header });
  ws["!cols"] = header.map((h) => ({ wch: Math.max(h.length + 2, 16) }));
  return ws;
};

const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
  wb,
  toSheet(compareRows, [
    "Email",
    "Name",
    "Previous Role (your setup)",
    "Current Role (LIVE site)",
    "What previous role could do",
    "Action needed",
  ]),
  "Fix List (Compare)"
);

const fullRows = (data) =>
  data.map((r) => ({
    Email: r[0],
    "First Name": r[1],
    "Last Name": r[2],
    Role: pretty(r[3]),
    "What this role can do": PERMS[r[3]] || "",
    Plan: r[4],
    Status: r[5],
    "2FA on": r[6],
    "Times logged in": r[7],
  }));
const fullHeader = [
  "Email",
  "First Name",
  "Last Name",
  "Role",
  "What this role can do",
  "Plan",
  "Status",
  "2FA on",
  "Times logged in",
];
XLSX.utils.book_append_sheet(wb, toSheet(fullRows(PROD), fullHeader), "Current (Live site)");
XLSX.utils.book_append_sheet(wb, toSheet(fullRows(DEV), fullHeader), "Previous (Your setup)");

// Legend sheet
const legend = Object.keys(RANK)
  .sort((a, b) => RANK[a] - RANK[b])
  .map((r) => ({ Role: pretty(r), "Access level (1=lowest)": RANK[r], "What they can do": PERMS[r] }));
XLSX.utils.book_append_sheet(wb, toSheet(legend, ["Role", "Access level (1=lowest)", "What they can do"]), "Role Guide");

const out = "exports/LYS_Users_Roles_Compare.xlsx";
XLSX.writeFile(wb, out);
const fixes = compareRows.filter((r) => r["Action needed"].startsWith("NEEDS FIX"));
console.log("Wrote", out);
console.log("Rows in Fix List:", compareRows.length, "| NEEDS FIX:", fixes.length);
fixes.forEach((f) => console.log("  -", f.Email, "|", f["Previous Role (your setup)"], "->", f["Current Role (LIVE site)"]));
