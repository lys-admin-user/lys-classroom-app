import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import { logAuditEvent } from "../../services/auditLog";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser, opts?: { emailVerified?: boolean }): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  /**
   * Link an external identity (Clerk) to the local `users` table without ever
   * changing an existing user's primary id (which the rest of the app + all
   * foreign keys depend on). Resolution order:
   *   1. Existing row already linked by clerkId  → update profile + bump login.
   *   2. Existing row with the same email         → link clerkId + update.
   *   3. No match                                 → insert a brand-new user.
   *
   * Roles, MFA/recovery-code/trusted-device fields and every other column are
   * preserved on the matched row — only profile/login-tracking fields are set.
   */
  async upsertUser(
    userData: UpsertUser,
    opts?: { emailVerified?: boolean },
    isRetry = false,
  ): Promise<User> {
    const now = new Date();

    // Only the profile + login-tracking fields are ever written on a match, so
    // we never clobber role, tier, MFA secrets, subscription state, etc.
    const profile = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
    };

    // 1. Already linked by external id → straightforward profile refresh.
    if (userData.clerkId) {
      const [existingByClerk] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, userData.clerkId));

      if (existingByClerk) {
        const [updated] = await db
          .update(users)
          .set({
            ...profile,
            lastLoginAt: now,
            loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
            updatedAt: now,
          })
          .where(eq(users.id, existingByClerk.id))
          .returning();

        logAuditEvent({
          userId: updated.id,
          action: "user_login",
          category: "auth",
          severity: "info",
          details: { email: userData.email, method: "clerk" },
        }).catch(() => {});

        return updated;
      }
    }

    // 2. Existing account with this email → link the external id to it. This is
    // what keeps current users (and all their data/roles) after cutover.
    //
    // SECURITY: email-based linking binds an external identity to an EXISTING
    // account, so it is only safe when the caller has proven the email really
    // belongs to this person (Clerk "verified" status / trusted IdP assertion).
    // An unverified email must NEVER auto-link — otherwise an attacker could
    // claim another user's account just by typing their email into Clerk.
    if (userData.email && opts?.emailVerified === true) {
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));

      if (existingByEmail) {
        const [linked] = await db
          .update(users)
          .set({
            ...profile,
            clerkId: userData.clerkId ?? existingByEmail.clerkId,
            lastLoginAt: now,
            loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
            updatedAt: now,
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();

        logAuditEvent({
          userId: linked.id,
          action: "user_login",
          category: "auth",
          severity: "info",
          details: { email: userData.email, method: "clerk", note: "linked_by_email" },
        }).catch(() => {});

        return linked;
      }
    }

    // 3. Brand-new user. Let the DB generate the id (gen_random_uuid) unless a
    // caller provided one explicitly.
    const insertValues: UpsertUser = {
      ...userData,
      lastLoginAt: now,
      loginCount: 1,
    };
    if (!insertValues.id) delete (insertValues as any).id;

    try {
      const [user] = await db.insert(users).values(insertValues).returning();

      logAuditEvent({
        userId: user.id,
        action: "user_login",
        category: "auth",
        severity: "info",
        details: { email: userData.email, method: "clerk", note: "new_user" },
      }).catch(() => {});

      return user;
    } catch (err: any) {
      // Concurrent first-login requests (the SPA fires several /api calls at
      // once) all reach step 3 before any row exists, so the losers hit the
      // unique constraint on email/clerkId (Postgres 23505). Re-run resolution
      // once: the winner's row now exists, so step 1 (clerkId) or step 2
      // (verified email) links to it instead of failing the login. The
      // verified-email gate in step 2 is unchanged, so this adds no new linking
      // path — it only recovers from the race.
      if (err?.code === "23505" && !isRetry) {
        return this.upsertUser(userData, opts, true);
      }
      throw err;
    }
  }
}

export const authStorage = new AuthStorage();
