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
    const [user] = await db
      .insert(users)
      .values({ ...userData, lastLoginAt: new Date(), loginCount: 1 })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          lastLoginAt: new Date(),
          loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
          updatedAt: new Date(),
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
