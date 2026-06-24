// Ingest the Texas Agriculture, Food & Natural Resources TEKS (most current
// edition) into the standards DB from the authoritative Common Standards
// Project API. Full, real data — no hand-typed codes.
//
// Run with:  npx tsx scripts/seed-texas-ag-teks.ts
//
// Safe to re-run (CSP sync dedupes by uid).

import { seedTexasAgricultureTeks } from "../server/services/agricultureTeksSeed";

async function main() {
  console.log("[seed-texas-ag-teks] starting");
  const result = await seedTexasAgricultureTeks();
  console.log("[seed-texas-ag-teks] done. jurisdiction:", result.jurisdictionId);
  for (const c of result.courses) {
    console.log(`  - ${c.label}: ${c.totalStandards} standards`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-texas-ag-teks] FAILED:", err);
  process.exit(1);
});
