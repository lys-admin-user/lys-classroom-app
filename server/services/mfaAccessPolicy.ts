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
// factor or a valid trusted device. Merely browsing these admin tools is
// sensitive, so we gate the GETs too — everything else stays browsable while the
// client presents the challenge.
export const ADMIN_MFA_SURFACES = ["/api/admin"];

export function isAdminMfaSurface(path: string): boolean {
  return ADMIN_MFA_SURFACES.some((p) => path === p || path.startsWith(p + "/"));
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

  return {
    action: "challenge",
    enrollmentRequired: !ctx.hasTotp && !ctx.emailOk,
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
