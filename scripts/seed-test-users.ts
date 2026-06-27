// Seed one test user per role for development auditing.
//
// Run with:  npx tsx scripts/seed-test-users.ts
//
// Safe to re-run (idempotent upsert keyed by the deterministic id `dev-<role>`).
// These accounts are ONLY usable through the development login switcher
// (`/api/dev/login`), which is hard-disabled on the published/deployed site.

import { db } from "../server/db";
import { users } from "@shared/schema";
import { sql } from "drizzle-orm";
import type { UserRole } from "@shared/models/auth";

const ROLES: UserRole[] = [
  "student",
  "homeschool_parent",
  "educator",
  "staff",
  "campus_admin",
  "district_admin",
  "site_admin",
  "system_admin",
];

const LABELS: Record<UserRole, string> = {
  student: "Student",
  homeschool_parent: "Homeschool Parent",
  educator: "Educator",
  staff: "Staff",
  campus_admin: "Campus Admin",
  district_admin: "District Admin",
  site_admin: "Site Admin",
  system_admin: "System Admin",
};

export async function seedTestUsers() {
  const adultBirthdate = new Date("1990-01-01T00:00:00Z");
  const seeded: { id: string; role: UserRole; email: string }[] = [];

  for (const role of ROLES) {
    const id = `dev-${role}`;
    const email = `dev-${role}@lys.test`;
    const values = {
      id,
      email,
      firstName: "Test",
      lastName: LABELS[role],
      role,
      tier: "free" as const,
      onboardingCompleted: true,
      birthdate: adultBirthdate,
      accountStatus: "active" as const,
    };

    await db
      .insert(users)
      .values(values as any)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          firstName: values.firstName,
          lastName: values.lastName,
          role,
          onboardingCompleted: true,
          birthdate: adultBirthdate,
          accountStatus: "active",
          updatedAt: sql`now()`,
        },
      });

    seeded.push({ id, role, email });
  }

  return seeded;
}

async function main() {
  console.log("[seed-test-users] starting");
  const seeded = await seedTestUsers();
  for (const u of seeded) {
    console.log(`  - ${u.role.padEnd(18)} ${u.id}  (${u.email})`);
  }
  console.log(`[seed-test-users] done. ${seeded.length} accounts ready.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-test-users] FAILED:", err);
  process.exit(1);
});
