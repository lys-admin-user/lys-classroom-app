import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../replit_integrations/auth";
import {
  generateMfaSecret,
  buildOtpAuthUri,
  buildQrDataUrl,
  verifyToken,
  verifyTokenAgainstEncrypted,
  encryptSecret,
} from "../services/mfaService";
import { isEncryptionConfigured } from "../services/crypto";
import { logAuditEvent, getClientIP } from "../services/auditLog";

// How long a successful step-up verification stays "fresh" (ms).
const MFA_FRESH_WINDOW_MS = 5 * 60 * 1000;

function getUserId(req: any): string {
  return req.user?.claims?.sub as string;
}

type FreshMfaResult =
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown> };

// Shared check used by both the route middleware and conditional in-handler
// gating (e.g. only when an admin role change is actually requested).
export async function checkFreshMfa(req: any): Promise<FreshMfaResult> {
  const userId = getUserId(req);
  if (!userId) {
    return { ok: false, status: 401, body: { message: "Unauthorized" } };
  }
  const user = await storage.getUser(userId);
  if (!user) {
    return { ok: false, status: 401, body: { message: "Unauthorized" } };
  }
  if (!user.mfaEnabled || !user.mfaSecret) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "Multi-factor authentication must be enabled before performing this action.",
        mfaRequired: true,
        enrollmentRequired: true,
      },
    };
  }
  const verifiedAt = req.session?.mfaVerifiedAt ? Number(req.session.mfaVerifiedAt) : 0;
  if (!verifiedAt || Date.now() - verifiedAt > MFA_FRESH_WINDOW_MS) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "Please verify your authenticator code to continue.",
        mfaRequired: true,
        enrollmentRequired: false,
      },
    };
  }
  return { ok: true };
}

// Middleware: require a recently-verified MFA step-up before a sensitive action.
// - If the admin has not enrolled MFA, respond 403 with mfaRequired+enrollmentRequired
//   so the client can force enrollment first.
// - If enrolled but not freshly verified, respond 403 with mfaRequired so the
//   client can prompt for a code (POST /api/mfa/verify) and retry.
export const requireFreshMfa: RequestHandler = async (req: any, res, next) => {
  try {
    const result = await checkFreshMfa(req);
    if (!result.ok) {
      return res.status(result.status).json(result.body);
    }
    return next();
  } catch (err) {
    console.error("requireFreshMfa error:", err);
    return res.status(500).json({ error: "MFA check failed" });
  }
};

export function registerMfaRoutes(app: Express): void {
  // Current MFA status for the signed-in user.
  app.get("/api/mfa/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const verifiedAt = req.session?.mfaVerifiedAt ? Number(req.session.mfaVerifiedAt) : 0;
      const fresh = !!verifiedAt && Date.now() - verifiedAt <= MFA_FRESH_WINDOW_MS;
      res.json({
        enabled: !!user?.mfaEnabled,
        verifiedFresh: fresh,
        encryptionConfigured: isEncryptionConfigured(),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to load MFA status" });
    }
  });

  // Begin enrollment: generate a secret, return otpauth URI + QR. The secret is
  // persisted encrypted but NOT yet activated until a code is confirmed.
  app.post("/api/mfa/enroll", isAuthenticated, async (req: any, res) => {
    try {
      if (!isEncryptionConfigured()) {
        return res.status(503).json({
          error: "Encryption key is not configured. MFA cannot be enabled until APP_ENCRYPTION_KEY is set.",
        });
      }
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const secret = generateMfaSecret();
      const label = user.email || user.id;
      const otpauthUri = buildOtpAuthUri(label, secret);
      const qrDataUrl = await buildQrDataUrl(otpauthUri);

      // Store encrypted secret but keep mfaEnabled false until activation.
      await db.update(users)
        .set({ mfaSecret: encryptSecret(secret), mfaEnabled: false, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ otpauthUri, qrDataUrl, secret });
    } catch (err) {
      console.error("MFA enroll error:", err);
      res.status(500).json({ error: "Failed to start MFA enrollment" });
    }
  });

  // Activate enrollment by confirming a code generated from the pending secret.
  app.post("/api/mfa/activate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const token = String(req.body?.token || "");
      const user = await storage.getUser(userId);
      if (!user?.mfaSecret) {
        return res.status(400).json({ error: "Start enrollment first." });
      }
      if (!verifyTokenAgainstEncrypted(token, user.mfaSecret)) {
        return res.status(400).json({ error: "Invalid code. Please try again." });
      }
      await db.update(users)
        .set({ mfaEnabled: true, mfaActivatedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, userId));
      req.session.mfaVerifiedAt = Date.now();
      await logAuditEvent({
        userId,
        action: "mfa.activated",
        category: "security",
        severity: "info",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true });
    } catch (err) {
      console.error("MFA activate error:", err);
      res.status(500).json({ error: "Failed to activate MFA" });
    }
  });

  // Step-up verification: confirm a code to mark the session as freshly verified.
  app.post("/api/mfa/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const token = String(req.body?.token || "");
      const user = await storage.getUser(userId);
      if (!user?.mfaEnabled || !user.mfaSecret) {
        return res.status(400).json({ error: "MFA is not enabled.", enrollmentRequired: true });
      }
      if (!verifyTokenAgainstEncrypted(token, user.mfaSecret)) {
        return res.status(400).json({ error: "Invalid code. Please try again." });
      }
      req.session.mfaVerifiedAt = Date.now();
      res.json({ success: true });
    } catch (err) {
      console.error("MFA verify error:", err);
      res.status(500).json({ error: "Failed to verify MFA" });
    }
  });

  // Disable MFA (requires a current code to prevent lockout abuse).
  app.post("/api/mfa/disable", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const token = String(req.body?.token || "");
      const user = await storage.getUser(userId);
      if (!user?.mfaEnabled || !user.mfaSecret) {
        return res.status(400).json({ error: "MFA is not enabled." });
      }
      if (!verifyTokenAgainstEncrypted(token, user.mfaSecret)) {
        return res.status(400).json({ error: "Invalid code. Please try again." });
      }
      await db.update(users)
        .set({ mfaEnabled: false, mfaSecret: null, mfaActivatedAt: null, updatedAt: new Date() })
        .where(eq(users.id, userId));
      if (req.session) req.session.mfaVerifiedAt = undefined;
      await logAuditEvent({
        userId,
        action: "mfa.disabled",
        category: "security",
        severity: "warning",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true });
    } catch (err) {
      console.error("MFA disable error:", err);
      res.status(500).json({ error: "Failed to disable MFA" });
    }
  });
}
