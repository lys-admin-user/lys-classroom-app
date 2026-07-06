// Pure, DB-free policy helpers for the login-time 2FA gate. Kept separate from
// the route wiring so the decision logic can be unit-tested hermetically (no DB,
// no Express). The middleware in server/routes/mfa.ts loads the user + trusted
// device state, then defers the actual allow/challenge decision to this module.

import { hasRolePrivilege, type UserRole } from "@shared/models/auth";

// Roles required to pass a second factor for the login gate: staff and above.
// (Optional roles below this — student / homeschool_parent / educator — are only
// nudged to opt in, never forced.)
export const LOGIN_MFA_MIN_ROLE: UserRole = "staff";

// Paths exempt from the login-MFA gate: the auth handshake, the MFA endpoints
// used to satisfy the gate, lightweight status/onboarding reads, and health.
export const LOGIN_MFA_EXEMPT = [
  "/api/mfa",
  "/api/login",
  "/api/logout",
  "/api/callback",
  "/api/auth",
  "/api/onboarding",
  "/api/health",
  "/api/ready",
];

export function isLoginMfaExempt(path: string): boolean {
  return LOGIN_MFA_EXEMPT.some((p) => path === p || path.startsWith(p + "/"));
}

// Admin surfaces whose READS (not just mutations) also require a passed second
// factor or a valid trusted device. Merely browsing these admin/staff tools is
// sensitive, so we gate the GETs too — everything else stays browsable while the
// client presents the challenge. These mirror the server-side role guards
// (requireCampusAdmin / requireSiteAdmin / requireApprovedStaff, etc.), so any
// route already restricted to staff+ also requires a passed second factor to
// read. (Optional roles below staff are never gated here — decideLoginMfa returns
// "allow" for them before this check.)
export const ADMIN_MFA_SURFACES = [
  "/api/admin",
  "/api/org-admin",
  "/api/org-safety",
  "/api/team",
];

export function isAdminMfaSurface(path: string): boolean {
  return ADMIN_MFA_SURFACES.some((p) => path === p || path.startsWith(p + "/"));
}

// Whether a user must FIRST enroll an authenticator app before any second factor
// (email code, recovery code) can satisfy the login gate. Required (staff+) users
// with no authenticator enrolled must be forced through enrollment; email/recovery
// verification must NOT grant them a fresh login-gate session, or the "no
// fail-open, force enrollment" rule could be bypassed by the email path. The
// master code is handled separately (intentionally still accepted).
export function mustEnrollAuthenticator(
  role: string | null | undefined,
  hasAuthenticator: boolean,
): boolean {
  return hasRolePrivilege((role as any) ?? "student", LOGIN_MFA_MIN_ROLE) && !hasAuthenticator;
}

export interface LoginMfaContext {
  role: string | null | undefined;
  method: string;
  fullPath: string;
  // Session was freshly verified within the step-up window.
  fresh: boolean;
  // A valid, non-revoked, non-expired trusted device cookie is present.
  trustedDevice: boolean;
  // A code-based factor is available: real TOTP enrollment OR the master code.
  hasTotp: boolean;
  // A real authenticator app is enrolled for this user (mfaEnabled + secret).
  // This is what "forced enrollment" keys off — NOT the master code and NOT
  // email, since authenticator enrollment doesn't depend on email delivery.
  hasAuthenticator: boolean;
  // An email one-time code can realistically reach this user.
  emailOk: boolean;
  // Dev-only bypass (non-production, no email transport configured).
  bypassed: boolean;
}

export type LoginMfaDecision =
  | { action: "allow" }
  | { action: "challenge"; enrollmentRequired: boolean };

// Decide whether a request must be challenged for the login-time second factor.
// Deliberately does NOT fail open when a required user lacks a factor: it returns
// a challenge with enrollmentRequired so the client forces setup (with the master
// code enabled, the challenge is always satisfiable in the meantime).
export function decideLoginMfa(ctx: LoginMfaContext): LoginMfaDecision {
  if (ctx.bypassed) return { action: "allow" };

  const method = ctx.method.toUpperCase();
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";

  if (isLoginMfaExempt(ctx.fullPath)) return { action: "allow" };

  // Below staff → optional; never gated (only nudged in settings).
  if (!hasRolePrivilege((ctx.role as UserRole) ?? "student", LOGIN_MFA_MIN_ROLE)) {
    return { action: "allow" };
  }

  // Reads are gated only on admin surfaces; other reads stay open so the app
  // shell renders and the client can present the challenge.
  if (isRead && !isAdminMfaSurface(ctx.fullPath)) return { action: "allow" };

  if (ctx.fresh) return { action: "allow" };
  if (ctx.trustedDevice) return { action: "allow" };

  // Required user with no real authenticator enrolled → force enrollment. This
  // is independent of the master code / email fallback: a required user must set
  // up an authenticator app, even though the master code can still satisfy the
  // challenge in the meantime.
  return {
    action: "challenge",
    enrollmentRequired: !ctx.hasAuthenticator,
  };
}

// Whether to show the optional "turn on two-factor" nudge in settings: only for
// optional roles (below staff) that have not already enabled it or dismissed it.
export function shouldPromptOptInMfa(
  role: string | null | undefined,
  enabled: boolean,
  dismissed: boolean,
): boolean {
  const optional = !hasRolePrivilege((role as UserRole) ?? "student", LOGIN_MFA_MIN_ROLE);
  return optional && !enabled && !dismissed;
}
