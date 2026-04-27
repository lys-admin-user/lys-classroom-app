import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import { logAuditEvent } from "../../services/auditLog";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();

    // If an account already exists with this email under a different id,
    // update that existing row instead of attempting an insert that would
    // violate the email unique constraint. This keeps the original user id
    // (and all of its related records) stable.
    if (userData.email) {
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingByEmail && existingByEmail.id !== userData.id) {
        const { id: _ignoredId, ...rest } = userData;
        const [updated] = await db
          .update(users)
          .set({
            ...rest,
            lastLoginAt: now,
            loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
            updatedAt: now,
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();

        logAuditEvent({
          userId: updated.id,
          action: "user_login",
          category: "auth",
          severity: "info",
          details: { email: userData.email, method: "replit_auth", note: "matched_by_email" },
        }).catch(() => {});

        return updated;
      }
    }

    const [user] = await db
      .insert(users)
      .values({ ...userData, lastLoginAt: now, loginCount: 1 })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          lastLoginAt: now,
          loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
          updatedAt: now,
        },
      })
      .returning();

    logAuditEvent({
      userId: user.id,
      action: "user_login",
      category: "auth",
      severity: "info",
      details: { email: userData.email, method: "replit_auth" },
    }).catch(() => {});

    return user;
  }
}

export const authStorage = new AuthStorage();
