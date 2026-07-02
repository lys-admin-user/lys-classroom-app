import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { hasRolePrivilege } from "@shared/models/auth";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

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
      secure: true,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any, ipAddress?: string) {
  const user = await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });

  // Auto-start a 10-day trial for brand-new users (loginCount === 1)
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

  // ── True impersonation ────────────────────────────────────────────────
  // When a site/system admin has an active impersonation session, swap the
  // effective identity for API requests so every downstream handler sees the
  // TARGET user (their role, their data) — not just a banner. We never mutate
  // req.user in place: deserializeUser hands back the session-stored object, so
  // we replace it with a shallow copy to avoid corrupting the admin's real
  // session. The impersonation-control endpoints are exempt so the real admin
  // keeps their identity to start/stop and pass the admin + MFA checks.
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
      // Refresh the REAL admin's token on the session-backed object BEFORE we
      // swap, so rotated refresh tokens persist to the session (the swapped
      // req.user is a copy and would drop the rotation, breaking later requests).
      const now = Math.floor(Date.now() / 1000);
      if (sessionUser.expires_at && now > sessionUser.expires_at && sessionUser.refresh_token) {
        try {
          const config = await getOidcConfig();
          const tokenResponse = await client.refreshTokenGrant(config, sessionUser.refresh_token);
          updateUserSession(sessionUser, tokenResponse);
        } catch {
          // Leave it to isAuthenticated to reject with 401.
        }
      }
      req.impersonatorId = realId;
      req.user = { ...sessionUser, claims: { ...sessionUser.claims, sub: imp.userId } };
      return next();
    } catch {
      return next();
    }
  });

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback,
    req?: any
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      const claims = tokens.claims();
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || "unknown";
      await upsertUser(claims, ipAddress);
      try {
        const { logAuditEvent } = await import("../../../server/services/auditLog");
        await logAuditEvent({
          userId: claims?.sub as string,
          action: "login_success",
          category: "auth",
          severity: "info",
          details: { method: "replit_oidc" },
        });
      } catch {}
      verified(null, user);
    } catch (err) {
      console.error("[auth] verify failed:", err);
      verified(err as Error);
    }
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
