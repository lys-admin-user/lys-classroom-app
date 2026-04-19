import { db } from "../server/db";
import { knowResources } from "../shared/schema";
import { eq } from "drizzle-orm";
import { computeBkdAlignment, parseNextDeadline } from "../server/lib/bkdAlignment";

async function main() {
  const all = await db.select().from(knowResources).where(eq(knowResources.resourceType as any, "scholarship"));
  console.log(`Backfilling ${all.length} scholarships...`);
  const now = new Date();
  let updated = 0;
  for (const r of all) {
    const nextDeadline = (r as any).nextDeadline || parseNextDeadline((r as any).scholarshipDeadline, now);
    const lastVerifiedAt = (r as any).lastVerifiedAt || now;
    const trustLevel = (r as any).trustLevel || "verified";
    const requiresFee = (r as any).requiresFee ?? false;
    const privacyConcern = (r as any).privacyConcern ?? false;
    const bkdAlignment = computeBkdAlignment(
      { ...r, lastVerifiedAt, nextDeadline, trustLevel, requiresFee, privacyConcern } as any,
      now,
    );
    await db.update(knowResources).set({
      lastVerifiedAt,
      trustLevel: trustLevel as any,
      requiresFee,
      privacyConcern,
      nextDeadline,
      bkdAlignment,
    } as any).where(eq(knowResources.id, r.id));
    updated++;
  }
  console.log(`Done. Updated ${updated} rows.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
