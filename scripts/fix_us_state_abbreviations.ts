// One-shot data repair: production `standards_jurisdictions` rows for US
// states have dirty `abbreviation` values (mixed casing, stray whitespace,
// occasional wrong codes carried over from a CSP import). The lesson
// generator's standards cascade has been working around this by looking US
// states up by NAME instead of by abbreviation. This script repairs the
// underlying data so the workaround can eventually be removed.
//
// Run with:  npx tsx scripts/fix_us_state_abbreviations.ts
//
// Safe to re-run: it only touches rows whose abbreviation differs from the
// canonical USPS code AND whose name matches a known state. Other rows are
// left alone (and reported as warnings so an admin can investigate).

import { db } from "../server/db";
import { standardsJurisdictions } from "../shared/schema";
import { US_STATES } from "../server/routes/_helpers";
import { eq } from "drizzle-orm";

async function main() {
  console.log("[fix-us-state-abbrev] starting");
  const rows = await db
    .select()
    .from(standardsJurisdictions)
    .where(eq(standardsJurisdictions.country, "United States"));
  console.log(`[fix-us-state-abbrev] loaded ${rows.length} US jurisdictions`);

  let fixed = 0;
  let alreadyOk = 0;
  let skipped: Array<{ id: string; name: string; abbreviation: string }> = [];

  for (const row of rows) {
    const canonical = US_STATES[row.name];
    if (!canonical) {
      // Row's `name` doesn't match a US state — likely an org/district that
      // landed in the jurisdictions table by accident. Don't auto-touch it.
      skipped.push({ id: row.id, name: row.name, abbreviation: row.abbreviation });
      continue;
    }
    const current = (row.abbreviation || "").trim().toUpperCase();
    if (current === canonical) {
      alreadyOk += 1;
      continue;
    }
    await db
      .update(standardsJurisdictions)
      .set({ abbreviation: canonical, updatedAt: new Date() })
      .where(eq(standardsJurisdictions.id, row.id));
    fixed += 1;
    console.log(`[fix-us-state-abbrev] ${row.name}: "${row.abbreviation}" → "${canonical}"`);
  }

  console.log(`[fix-us-state-abbrev] done. fixed=${fixed} alreadyOk=${alreadyOk} skipped=${skipped.length}`);
  if (skipped.length > 0) {
    console.log("[fix-us-state-abbrev] skipped non-state rows (review manually):");
    for (const s of skipped) console.log(`  - ${s.id} name="${s.name}" abbr="${s.abbreviation}"`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[fix-us-state-abbrev] failed:", err);
  process.exit(1);
});
