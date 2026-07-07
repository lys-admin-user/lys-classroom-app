// Identity layer — Clerk.
//
// This module used to run Replit OIDC (openid-client + passport strategy). It
// now uses Clerk as the identity provider, but DELIBERATELY keeps the existing
// express-session + passport SESSION machinery so the rest of the app is
// unchanged: `req.user.claims.sub`, `req.isAuthenticated()`, `req.login/logout`,
// admin impersonation, MFA freshness (`session.mfaVerifiedAt`) and the dev-login
// switcher all keep working exactly as before.
//
// Flow: Clerk verifies the browser session (cookie or Bearer token). A small
// "establisher" middleware turns that verified Clerk session into our normal
// passport session on the first request (linking/creating the local user by
// email), so every downstream reader keeps seeing the familiar shape. Sign-out
// is propagated both ways.
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import { authStorage } from "./storage";
import { hasRolePrivilege, type User } from "@shared/models/auth";
import { isProductionDeployment } from "../../lib/hosting";

// Clerk is only wired up when its server key is present. Before the key is set
// (e.g. very first local boot) the app still starts and the dev-login switcher
// keeps working — protected routes just return 401 until Clerk is configured.
const clerkConfigured = (): boolean => !!process.env.CLERK_SECRET_KEY;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Secure only on a real HTTPS deployment so local HTTP dev still works;
      // Replit preview and Render are both HTTPS.
      secure: isProductionDeployment(),
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

// Build the session user object in the exact shape Replit OIDC produced, so
// isAuthenticated + every `req.user.claims.sub` reader work unchanged.
function buildSessionUser(u: User, clerkId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  return {
    claims: {
      sub: u.id,
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      exp,
    },
    // Marks this as a Clerk-originated session so we can tear it down if Clerk
    // signs the user out. Dev-login sessions have no authProvider and persist.
    authProvider: "clerk" as const,
    clerkId,
    expires_at: exp,
  };
}

async function linkClerkUser(
  clerkUserId: string,
  data: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  },
  ipAddress?: string,
): Promise<User> {
  const user = await authStorage.upsertUser({
    clerkId: clerkUserId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    profileImageUrl: data.profileImageUrl,
  });

  // Auto-start a 10-day trial for brand-new users (loginCount === 1).
  if (user.loginCount === 1) {
    try {
      const { db } = await import("../../db");
      const { freeTrials } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const existingTrials = await db
        .select()
        .from(freeTrials)
        .where(eq(freeTrials.userId, user.id))
        .limit(1);

      if (existingTrials.length === 0) {
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + 10);

        await db.insert(freeTrials).values({
          userId: user.id,
          ipAddress: ipAddress || "unknown",
          fingerprint: `auto_${user.id}`,
          trialStartDate: now,
          trialEndDate,
          isActive: true,
          abuseFlags: 0,
        } as any);
      }
    } catch (e) {
      console.error("Failed to auto-start trial:", e);
    }
  }

  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Verify Clerk sessions (reads __session cookie or Authorization Bearer).
  if (clerkConfigured()) {
    app.use(clerkMiddleware());
  }

  // ── Clerk → local session establisher ─────────────────────────────────
  // Turn a verified Clerk session into our normal passport session on first
  // touch, and propagate Clerk sign-out.
  if (clerkConfigured()) {
    app.use(async (req: any, _res, next) => {
      try {
        const auth = getAuth(req);
        const clerkUserId = auth?.userId as string | undefined;

        // Already have a local passport session.
        if (req.isAuthenticated?.() && req.user?.claims?.sub) {
          // If it was Clerk-established but Clerk no longer knows this user,
          // tear our session down too so sign-out propagates.
          if (req.user.authProvider === "clerk" && !clerkUserId) {
            return req.logout(() => next());
          }
          return next();
        }

        if (!clerkUserId) return next();

        // First authenticated request after a Clerk sign-in: link/create the
        // local user and persist a passport session.
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email =
          clerkUser.primaryEmailAddress?.emailAddress ??
          clerkUser.emailAddresses?.[0]?.emailAddress ??
          null;

        const localUser = await linkClerkUser(
          clerkUserId,
          {
            email,
            firstName: clerkUser.firstName ?? null,
            lastName: clerkUser.lastName ?? null,
            profileImageUrl: clerkUser.imageUrl ?? null,
          },
          req.ip,
        );

        const sessionUser = buildSessionUser(localUser, clerkUserId);
        await new Promise<void>((resolve, reject) =>
          req.login(sessionUser as any, (err: any) => (err ? reject(err) : resolve())),
        );

        try {
          const { logAuditEvent } = await import("../../services/auditLog");
          await logAuditEvent({
            userId: localUser.id,
            action: "login_success",
            category: "auth",
            severity: "info",
            details: { method: "clerk" },
          });
        } catch {}

        return next();
      } catch (err) {
        console.error("[auth] clerk establisher failed:", err);
        return next();
      }
    });
  }

  // ── True impersonation ────────────────────────────────────────────────
  // When a site/system admin has an active impersonation session, swap the
  // effective identity for API requests so every downstream handler sees the
  // TARGET user. The impersonation-control endpoints are exempt so the real
  // admin keeps their identity to start/stop and pass the admin + MFA checks.
  app.use(async (req: any, _res, next) => {
    try {
      const imp = req.session?.impersonating;
      if (!imp?.userId) return next();
      if (!req.path.startsWith("/api")) return next();
      if (
        req.path === "/api/admin/stop-impersonation" ||
        /^\/api\/admin\/users\/[^/]+\/impersonate$/.test(req.path)
      ) {
        return next();
      }
      const sessionUser = req.user;
      const realId = sessionUser?.claims?.sub;
      if (!realId) return next();
      const realUser = await authStorage.getUser(realId);
      if (!realUser || !hasRolePrivilege((realUser.role as any) ?? "student", "site_admin")) {
        delete req.session.impersonating;
        return next();
      }
      req.impersonatorId = realId;
      req.user = { ...sessionUser, claims: { ...sessionUser.claims, sub: imp.userId } };
      return next();
    } catch {
      return next();
    }
  });

  // ── Login / logout endpoints ──────────────────────────────────────────
  // Kept at the same paths so every existing `window.location.href="/api/login"`
  // / `/api/logout` trigger in the client works unchanged. Login now hands off
  // to the client-side Clerk sign-in page; logout revokes the Clerk session and
  // destroys the local session.
  app.get("/api/login", (req, res) => {
    const raw = typeof req.query.returnTo === "string" ? req.query.returnTo : "/";
    const returnTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    res.redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  });

  app.get("/api/logout", async (req: any, res) => {
    try {
      const auth = clerkConfigured() ? getAuth(req) : null;
      if (auth?.sessionId) {
        await clerkClient.sessions.revokeSession(auth.sessionId);
      }
    } catch {
      // Best-effort: still clear the local session below.
    }
    const finish = () => {
      if (req.session) {
        req.session.destroy(() => {
          res.clearCookie("connect.sid");
          res.redirect("/sign-in");
        });
      } else {
        res.redirect("/sign-in");
      }
    };
    if (typeof req.logout === "function") {
      req.logout(() => finish());
    } else {
      finish();
    }
  });
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated?.() || !user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > user.expires_at) {
    // Session lifetime elapsed — drop it and force re-authentication.
    return req.logout(() => res.status(401).json({ message: "Unauthorized" }));
  }

  return next();
};
