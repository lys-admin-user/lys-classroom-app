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
  isMasterMfaCode,
  MASTER_MFA_CODE_ENABLED,
} from "../services/mfaService";
import { isEncryptionConfigured } from "../services/crypto";
import { logAuditEvent, getClientIP } from "../services/auditLog";
import { sendEmailOtp, verifyEmailOtp } from "../services/emailOtpService";
import { isEmailConfigured } from "../services/emailTransport";
import { hasRolePrivilege } from "@shared/models/auth";
import {
  LOGIN_MFA_MIN_ROLE,
  decideLoginMfa,
  shouldPromptOptInMfa,
  isLoginMfaExempt,
  isAdminMfaSurface,
  mustEnrollAuthenticator,
} from "../services/mfaAccessPolicy";
import {
  regenerateRecoveryCodes,
  verifyRecoveryCode,
  countRemainingRecoveryCodes,
  invalidateRecoveryCodes,
} from "../services/recoveryCodeService";
import {
  issueTrustedDevice,
  hasValidTrustedDevice,
  listTrustedDevices,
  revokeTrustedDevice,
  revokeAllTrustedDevices,
  revokeCurrentTrustedDevice,
  clearTrustedDeviceCookie,
} from "../services/trustedDeviceService";

// How long a successful step-up verification stays "fresh" (ms).
const MFA_FRESH_WINDOW_MS = 5 * 60 * 1000;

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

// Dev convenience: until a real email provider is configured, skip the
// login-time 2FA gate in development so the app is freely usable without fishing
// verification codes out of the server console. Re-enables automatically in
// production, or as soon as an email provider (e.g. Resend / SMTP / Gmail) is
// configured. Step-up MFA for sensitive actions (requireFreshMfa) is unaffected.
function loginMfaBypassed(): boolean {
  return process.env.NODE_ENV !== "production" && !isEmailConfigured();
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
  // With the master MFA code enabled, every user can satisfy the challenge by
  // entering the fixed code, so never force enrollment — show the code prompt.
  const hasTotp = !!(user.mfaEnabled && user.mfaSecret) || MASTER_MFA_CODE_ENABLED;
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

// Login-MFA gate: staff-and-up must have a fresh second-factor verification (or
// a valid trusted device) before they can MUTATE anything via the API OR access
// admin surfaces (reads to /api/admin/* are gated too). Non-admin reads pass so
// the app stays browsable while the client presents the challenge. Unlike the
// old behavior, this does NOT fail open when a required user has no factor: it
// returns a challenge with enrollmentRequired so setup is forced (with the
// master code enabled, the challenge stays satisfiable in the meantime).
export const requireLoginMfa: RequestHandler = async (req: any, res, next) => {
  // NOTE: the dev/email bypass is applied INSIDE decideLoginMfa (after the
  // forced-enrollment check), not as an early return here — otherwise a staff+
  // user with no authenticator could skip enrollment entirely in a non-prod /
  // no-email environment.
  // Mounted at "/api", so req.path is mount-relative — reconstruct the
  // absolute path the policy's exempt/admin lists expect.
  const fullPath = (req.baseUrl || "") + req.path;
  const method = req.method.toUpperCase();
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";

  // Cheap, pure pre-filter (cannot throw) so the vast majority of requests never
  // touch the DB: exempt paths and non-admin reads are never gated, and an
  // unauthenticated request is left for the auth layer to handle.
  if (isLoginMfaExempt(fullPath)) return next();
  if (isRead && !isAdminMfaSurface(fullPath)) return next();
  const userId = getUserId(req);
  if (!userId) return next();

  // Past this point the request is a gated surface (mutation, or admin read) for
  // an authenticated user. Any failure evaluating the factor state must FAIL
  // CLOSED — a runtime fault here must not silently grant access.
  try {
    const user = await storage.getUser(userId);
    if (!user) return next();

    const fresh = isSessionFresh(req);
    const trustedDevice = fresh ? false : await hasValidTrustedDevice(userId, req);
    const hasAuthenticator = !!(user.mfaEnabled && user.mfaSecret);
    const hasTotp = hasAuthenticator || MASTER_MFA_CODE_ENABLED;
    const emailOk = emailDeliverable(user);

    const decision = decideLoginMfa({
      role: user.role as any,
      method,
      fullPath,
      fresh,
      trustedDevice,
      hasTotp,
      hasAuthenticator,
      emailOk,
      bypassed: loginMfaBypassed(),
    });
    if (decision.action === "allow") return next();

    return res.status(403).json({
      error: decision.enrollmentRequired
        ? "Two-factor authentication must be set up before continuing."
        : "Please verify your second factor to continue.",
      loginMfaRequired: true,
      mfaRequired: true,
      enrollmentRequired: decision.enrollmentRequired,
      methods: { totp: hasTotp, email: emailOk },
    });
  } catch (err) {
    console.error("requireLoginMfa error:", err);
    // Fail closed: we could not confirm the second factor for a gated request.
    return res.status(403).json({
      error: "Could not verify your second factor right now. Please try again.",
      loginMfaRequired: true,
      mfaRequired: true,
      enrollmentRequired: false,
    });
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
      const trustedDevice = fresh ? false : await hasValidTrustedDevice(userId, req);
      const recoveryCodesRemaining = await countRemainingRecoveryCodes(userId);
      res.json({
        enabled: !!user?.mfaEnabled,
        verifiedFresh: fresh,
        trustedDevice,
        encryptionConfigured: isEncryptionConfigured(),
        methods: { totp: hasTotp, email: emailOk },
        emailConfigured: isEmailConfigured(),
        recoveryCodesRemaining,
        // Optional-role users (below staff) see a dismissible nudge to turn on 2FA.
        promptOptIn: shouldPromptOptInMfa(
          user?.role,
          !!user?.mfaEnabled,
          !!user?.mfaPromptDismissedAt,
        ),
        // True when this user must complete a second factor before mutating/admin
        // access, and hasn't yet this session (and has no trusted device). Drives
        // the client's login-MFA challenge. Forced enrollment overrides the bypass:
        // a required user with no authenticator must still be surfaced the gate.
        loginMfaRequired:
          subjectToLoginMfa &&
          (!hasTotp || (!loginMfaBypassed() && !fresh && !trustedDevice)),
        // True when a required (staff+) user has no real authenticator enrolled,
        // so the client must force them through enrollment (not just a challenge).
        enrollmentRequired: subjectToLoginMfa && !hasTotp,
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
      // Issue the one-time recovery codes now, at enrollment, and return them
      // ONCE for the user to save (only hashes are stored).
      const recoveryCodes = await regenerateRecoveryCodes(userId);
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
      await logAuditEvent({
        userId,
        action: "mfa.recovery_generated",
        category: "security",
        severity: "warning",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        details: { count: recoveryCodes.length, atEnrollment: true },
      });
      res.json({ success: true, recoveryCodes });
    } catch (err) {
      console.error("MFA activate error:", err);
      res.status(500).json({ error: "Failed to activate MFA" });
    }
  });

  // Step-up verification: confirm a code to mark the session as freshly verified.
  // A recovery code is accepted anywhere a TOTP/master code is. Passing
  // rememberDevice: true also mints a 30-day trusted device for this browser.
  app.post("/api/mfa/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const token = String(req.body?.token || "");
      const remember = req.body?.rememberDevice === true;
      // Master MFA code: accept for any user (even without enrollment) and mark
      // the session freshly verified. Product-owner default until disabled.
      if (isMasterMfaCode(token)) {
        req.session.mfaVerifiedAt = Date.now();
        if (remember) await issueTrustedDevice(userId, req, res);
        return res.json({ success: true });
      }
      const user = await storage.getUser(userId);
      // Required (staff+) users with no authenticator enrolled must be forced
      // through enrollment — a recovery code must NOT satisfy the login gate for
      // them (and they can't have one anyway before enrolling). No fail-open.
      const mustEnroll = mustEnrollAuthenticator(user?.role, !!(user?.mfaEnabled && user?.mfaSecret));
      let verified = false;
      if (user?.mfaEnabled && user.mfaSecret && verifyTokenAgainstEncrypted(token, user.mfaSecret)) {
        verified = true;
      } else if (!mustEnroll && await verifyRecoveryCode(userId, token)) {
        verified = true;
        await logAuditEvent({
          userId,
          action: "mfa.recovery_used",
          category: "security",
          severity: "warning",
          resourceType: "user",
          resourceId: userId,
          ipAddress: getClientIP(req),
          userAgent: req.get("user-agent"),
        });
      }
      if (!verified) {
        if (mustEnroll || !user?.mfaEnabled || !user.mfaSecret) {
          return res.status(400).json({ error: "Set up an authenticator app to continue.", enrollmentRequired: true });
        }
        return res.status(400).json({ error: "Invalid code. Please try again." });
      }
      req.session.mfaVerifiedAt = Date.now();
      if (remember) await issueTrustedDevice(userId, req, res);
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
      const remember = req.body?.rememberDevice === true;
      // Master MFA code: accept here too so the email-code path also honors it.
      if (isMasterMfaCode(code)) {
        req.session.mfaVerifiedAt = Date.now();
        if (remember) await issueTrustedDevice(userId, req, res);
        return res.json({ success: true });
      }
      const emailUser = await storage.getUser(userId);
      // No fail-open via email: a required (staff+) user with no authenticator
      // enrolled must enroll one first. An email code must NOT mark them fresh
      // (which would satisfy the login gate) regardless of the stated purpose.
      if (mustEnrollAuthenticator(emailUser?.role, !!(emailUser?.mfaEnabled && emailUser?.mfaSecret))) {
        return res.status(400).json({ error: "Set up an authenticator app to continue.", enrollmentRequired: true });
      }
      const ok = await verifyEmailOtp(userId, code, purpose);
      if (!ok) {
        return res.status(400).json({ error: "Invalid or expired code. Please try again." });
      }
      req.session.mfaVerifiedAt = Date.now();
      if (remember) await issueTrustedDevice(userId, req, res);
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
      // Tear down every factor tied to this enrollment: leftover trusted devices
      // or recovery codes must NOT let a required user keep bypassing the gate
      // (or re-enrollment) after they've turned MFA off.
      const devicesRevoked = await revokeAllTrustedDevices(userId);
      clearTrustedDeviceCookie(res);
      const codesInvalidated = await invalidateRecoveryCodes(userId);
      await logAuditEvent({
        userId,
        action: "mfa.disabled",
        category: "security",
        severity: "warning",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        details: { devicesRevoked, codesInvalidated },
      });
      res.json({ success: true });
    } catch (err) {
      console.error("MFA disable error:", err);
      res.status(500).json({ error: "Failed to disable MFA" });
    }
  });

  // Generate a fresh batch of one-time recovery codes (invalidating any old
  // ones). Returned in plaintext ONCE — only hashes are stored. Requires a fresh
  // step-up so a hijacked session can't silently mint a backdoor.
  app.post("/api/mfa/recovery/generate", isAuthenticated, requireFreshMfa, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const codes = await regenerateRecoveryCodes(userId);
      await logAuditEvent({
        userId,
        action: "mfa.recovery_generated",
        category: "security",
        severity: "warning",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        details: { count: codes.length },
      });
      res.json({ codes });
    } catch (err) {
      console.error("MFA recovery generate error:", err);
      res.status(500).json({ error: "Failed to generate recovery codes" });
    }
  });

  // List this user's active (non-revoked, unexpired) trusted devices. Marks the
  // device tied to the current request's cookie as "current".
  app.get("/api/mfa/trusted-devices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const devices = await listTrustedDevices(userId);
      const isCurrent = await hasValidTrustedDevice(userId, req);
      // hasValidTrustedDevice refreshed lastUsedAt on the current device, so it
      // sorts first; flag it for the UI when a valid cookie is present.
      if (isCurrent && devices[0]) devices[0].current = true;
      res.json({ devices });
    } catch (err) {
      console.error("MFA trusted-devices list error:", err);
      res.status(500).json({ error: "Failed to load trusted devices" });
    }
  });

  // Revoke one trusted device by id, or all of them (?all=true / body.all).
  app.post("/api/mfa/trusted-devices/revoke", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const all = req.body?.all === true || req.query?.all === "true";
      let count = 0;
      if (all) {
        count = await revokeAllTrustedDevices(userId);
        clearTrustedDeviceCookie(res);
      } else {
        const id = String(req.body?.id || "");
        if (!id) return res.status(400).json({ error: "Missing device id." });
        const ok = await revokeTrustedDevice(userId, id);
        if (!ok) return res.status(404).json({ error: "Device not found." });
        count = 1;
      }
      await logAuditEvent({
        userId,
        action: "mfa.trusted_device_revoked",
        category: "security",
        severity: "info",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
        details: { count, all },
      });
      res.json({ success: true, revoked: count });
    } catch (err) {
      console.error("MFA trusted-device revoke error:", err);
      res.status(500).json({ error: "Failed to revoke trusted device" });
    }
  });

  // Dismiss the optional "turn on two-factor" nudge (optional-role users only).
  app.post("/api/mfa/prompt/dismiss", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await db.update(users)
        .set({ mfaPromptDismissedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, userId));
      await logAuditEvent({
        userId,
        action: "mfa.prompt_dismissed",
        category: "security",
        severity: "info",
        resourceType: "user",
        resourceId: userId,
        ipAddress: getClientIP(req),
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true });
    } catch (err) {
      console.error("MFA prompt dismiss error:", err);
      res.status(500).json({ error: "Failed to dismiss prompt" });
    }
  });
}
