import { db } from "../db";
import { sql } from "drizzle-orm";
import { DatabaseStorage } from "./_base";
import type { DemoRequestInput } from "@shared/schema";

// "Request a demo" lead capture from the public /for-schools page. Stored as a
// sales lead list; status defaults to "new" for later triage.
const demoMethods = {
  async createDemoRequest(this: DatabaseStorage, data: DemoRequestInput): Promise<void> {
    await db.execute(sql`
      INSERT INTO demo_requests (id, name, email, organization, role, teacher_count, message, status, created_at)
      VALUES (
        gen_random_uuid(),
        ${data.name.trim()},
        ${data.email.trim().toLowerCase()},
        ${data.organization.trim()},
        ${data.role?.trim() || null},
        ${data.teacherCount?.trim() || null},
        ${data.message?.trim() || null},
        'new',
        NOW()
      )
    `);
  },
};

Object.assign(DatabaseStorage.prototype, demoMethods);
