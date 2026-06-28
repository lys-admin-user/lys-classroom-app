import { db } from "../db";
import { hrRoles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { SEED_HR_ROLES } from "./roleSeed";

// Idempotent seeder for the Team Hub role directory. Inserts any seed role that
// isn't already present (matched by its stable id) and leaves existing rows —
// including admin edits — untouched.
export async function seedHrRoles(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (const role of SEED_HR_ROLES) {
    const existing = await db.select({ id: hrRoles.id }).from(hrRoles).where(eq(hrRoles.id, role.id));
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(hrRoles).values({ ...role, isSeed: true } as any);
    inserted++;
  }
  return { inserted, skipped };
}
