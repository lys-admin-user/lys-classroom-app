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
import { sendEmailOtp, verifyEmailOtp } from "../services/emailOtpService";
import { isEmailConfigured } from "../services/emailTransport";
import { hasRolePrivilege } from "@shared/models/auth";

// How long a successful step-up verification stays "fresh" (ms).
const MFA_FRESH_WINDOW_MS = 5 * 60 * 1000;

// Roles required to complete a second factor at login (educators and above).
const LOGIN_MFA_MIN_ROLE = "educator";

function getUserId(req: any): string {
  return req.user?.claims?.sub as string;
}

function isSessionFresh(req: any): boolean {
  const verifiedAt = req.session?.mfaVerifiedAt ? Number(req.session.mfaVerifiedAt) : 0;
  return !!verifiedAt && Date.now() - verifiedAt <= MFA_FRESH_WINDOW_MS;
}

// Whether an email code can realistically reach this user. In non-production we
// treat the logged-to-console transport as deliverable so the flow is testable
// without provider keys; in production we require a real transport so we never
// gate a user behind a code we cannot actually send.
function emailDeliverable(user: { email?: string | null } | null | undefined): boolean {
  if (!user?.email) return false;
  return isEmailConfigured() || process.env.NODE_ENV !== "production";
}

type FreshMfaResult =
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown> };

// Shared check used by both the route middleware and conditional in-handler
// gating. A fresh verification by EITHER an authenticator app (TOTP) or an
// email code satisfies the check. Enrollment is only forced when the user has
// no usable second factor at all (no TOTP and no deliverable email).
export async function checkFreshMfa(req: any): Promise<FreshMfaResult> {
  const userId = getUserId(req);
  if (!userId) {
    return { ok: false, status: 401, body: { message: "Unauthorized" } };
  }
  const user = await storage.getUser(userId);
  if (!user) {
    return { ok: false, status: 401, body: { message: "Unauthorized" } };
  }
  if (isSessionFresh(req)) {
    return { ok: true };
  }
  const hasTotp = !!(user.mfaEnabled && user.mfaSecret);
  const emailOk = emailDeliverable(user);
  return {
    ok: false,
    status: 403,
    body: {
      error: hasTotp || emailOk
        ? "Please verify a second factor to continue."
        : "Multi-factor authentication must be set up before performing this action.",
      mfaRequired: true,
      enrollmentRequired: !hasTotp && !emailOk,
      methods: { totp: hasTotp, email: emailOk },
    },
  };
}

// Middleware: require a recently-verified MFA step-up before a sensitive action.
// Accepts a fresh TOTP or email-code verification. Responds 403 with mfaRequired
// (and which methods are available) so the client can prompt and retry.
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

// Paths exempt from the login-MFA gate: the auth handshake itself, the MFA
// endpoints used to satisfy the gate, lightweight status/onboarding reads, and
// health checks. Everything else under /api for an educator+ requires freshness.
const LOGIN_MFA_EXEMPT = [
  "/api/mfa",
  "/api/login",
  "/api/logout",
  "/api/callback",
  "/api/auth",
  "/api/onboarding",
  "/api/health",
  "/api/ready",
];

function isLoginMfaExempt(path: string): boolean {
  return LOGIN_MFA_EXEMPT.some((p) => path === p || path.startsWith(p + "/"));
}

// Login-MFA gate: educators-and-up must have a fresh second-factor verification
// before they can MUTATE anything via the API. Read-only requests (GET/HEAD)
// pass through so the app remains browsable while the challenge is presented by
// the client. Degrades safely: if the user has no usable second factor (no TOTP
// and no deliverable email) the gate steps aside rather than locking them out.
export const requireLoginMfa: RequestHandler = async (req: any, res, next) => {
  try {
    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();
    const userId = getUserId(req);
    if (!userId) return next();
    // This middleware is mounted at "/api", so req.path is mount-relative
    // (e.g. "/mfa/email/send"). Reconstruct the absolute path so the exempt
    // list (which uses "/api/..." prefixes) matches correctly.
    const fullPath = (req.baseUrl || "") + req.path;
    if (isLoginMfaExempt(fullPath)) return next();
    if (isSessionFresh(req)) return next();

    const user = await storage.getUser(userId);
    if (!user) return next();
    if (!hasRolePrivilege(user.role as any, LOGIN_MFA_MIN_ROLE)) return next();

    const hasTotp = !!(user.mfaEnabled && user.mfaSecret);
    const emailOk = emailDeliverable(user);
    if (!hasTotp && !emailOk) return next(); // cannot complete — don't lock out

    return res.status(403).json({
      error: "Please verify your second factor to continue.",
      loginMfaRequired: true,
      mfaRequired: true,
      methods: { totp: hasTotp, email: emailOk },
    });
  } catch (err) {
    console.error("requireLoginMfa error:", err);
    return next(); // fail open — never hard-block the whole API on a bug
  }
};

export function registerMfaRoutes(app: Express): void {
  // Current MFA status for the signed-in user.
  app.get("/api/mfa/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      const fresh = isSessionFresh(req);
      const hasTotp = !!(user?.mfaEnabled && user?.mfaSecret);
      const emailOk = emailDeliverable(user);
      const subjectToLoginMfa = hasRolePrivilege((user?.role as any) ?? "student", LOGIN_MFA_MIN_ROLE);
      res.json({
        enabled: !!user?.mfaEnabled,
        verifiedFresh: fresh,
        encryptionConfigured: isEncryptionConfigured(),
        methods: { totp: hasTotp, email: emailOk },
        emailConfigured: isEmailConfigured(),
        // True when this user must complete a second factor before mutating, and
        // hasn't yet this session. Drives the client's login-MFA challenge.
        loginMfaRequired: subjectToLoginMfa && !fresh && (hasTotp || emailOk),
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

  // Send a one-time code to the signed-in user's account email. Used both for
  // login-time 2FA and as an alternative to authenticator-app step-up.
  app.post("/api/mfa/email/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (!user.email) {
        return res.status(400).json({ error: "No email address on file for this account." });
      }
      const purpose = req.body?.purpose === "login" ? "login" : "mfa";
      const result = await sendEmailOtp(userId, user.email, purpose);
      await logAuditEvent({
        userId,
        action: "mfa.email_code_sent",
        category: "security",
        severity: "info",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        details: { transport: result.transport, purpose },
      });
      if (!result.ok) {
        return res.status(502).json({ error: "Could not send the verification email. Please try again." });
      }
      // Lightly mask the destination so the client can show where it went.
      const [name, domain] = user.email.split("@");
      const masked = domain ? `${name.slice(0, 2)}***@${domain}` : undefined;
      res.json({ success: true, sentTo: masked, transport: result.transport });
    } catch (err) {
      console.error("MFA email send error:", err);
      res.status(500).json({ error: "Failed to send email code" });
    }
  });

  // Verify an emailed code; on success the session becomes freshly verified,
  // satisfying both step-up and the login-MFA gate.
  app.post("/api/mfa/email/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const code = String(req.body?.code || "");
      const purpose = req.body?.purpose === "login" ? "login" : "mfa";
      const ok = await verifyEmailOtp(userId, code, purpose);
      if (!ok) {
        return res.status(400).json({ error: "Invalid or expired code. Please try again." });
      }
      req.session.mfaVerifiedAt = Date.now();
      await logAuditEvent({
        userId,
        action: "mfa.email_verified",
        category: "security",
        severity: "info",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        details: { purpose },
      });
      res.json({ success: true });
    } catch (err) {
      console.error("MFA email verify error:", err);
      res.status(500).json({ error: "Failed to verify email code" });
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
