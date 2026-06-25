// Seed / refresh the `authorities` table from the 50-state DOE reference guide
// (shared/usStandardsAuthorities.ts). This makes the EXPECTED official source
// for each US state available to the existing System Admin "Authorities" tab —
// no new admin screen, no new ingestion. Each state is stored as a
// `regional_state` authority with its DOE name, recognized standards name, and
// the official-domain allow-list carried in `metadata` (used by the catalog's
// "Official (DOE) vs. backup" policy).
//
// Idempotent upsert keyed by `code` ("US-<ABBR>"). Run with:
//   npx tsx scripts/seed-us-authorities.ts
import { storage } from "../server/storage";
import { US_STATE_AUTHORITIES } from "../shared/usStandardsAuthorities";
import type { InsertAuthority } from "@shared/schema";

async function seedUsAuthorities() {
  let created = 0;
  let updated = 0;

  for (const a of US_STATE_AUTHORITIES) {
    const code = `US-${a.abbr}`;
    const metadata = {
      standardsFramework: a.standardsName,
      stateAbbr: a.abbr,
      agency: a.agency,
      standardsName: a.standardsName,
      officialDomains: a.officialDomains,
      frameworks: a.frameworks,
    };
    const payload: InsertAuthority = {
      name: a.agency,
      code,
      level: "regional_state",
      country: "United States",
      isActive: true,
      metadata,
    } as InsertAuthority;

    const existing = await storage.getAuthorityByCode(code);
    if (existing) {
      await storage.updateAuthority(existing.id, {
        name: payload.name,
        level: payload.level,
        country: payload.country,
        isActive: true,
        metadata,
      });
      updated++;
    } else {
      await storage.createAuthority(payload);
      created++;
    }
  }

  console.log(
    `[seed-us-authorities] done — ${created} created, ${updated} updated ` +
      `(${US_STATE_AUTHORITIES.length} total US jurisdictions).`,
  );
}

seedUsAuthorities()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-us-authorities] failed:", err);
    process.exit(1);
  });
