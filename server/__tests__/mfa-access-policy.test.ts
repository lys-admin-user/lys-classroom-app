import { describe, it, expect } from "vitest";
import {
  decideLoginMfa,
  shouldPromptOptInMfa,
  isLoginMfaExempt,
  isAdminMfaSurface,
  mustEnrollAuthenticator,
  LOGIN_MFA_MIN_ROLE,
  type LoginMfaContext,
} from "../services/mfaAccessPolicy";

// A staff-and-up user mutating a normal endpoint with no factor state.
function ctx(overrides: Partial<LoginMfaContext> = {}): LoginMfaContext {
  return {
    role: "staff",
    method: "POST",
    fullPath: "/api/lessons",
    fresh: false,
    trustedDevice: false,
    hasTotp: true,
    hasAuthenticator: true,
    emailOk: true,
    bypassed: false,
    ...overrides,
  };
}

describe("mfaAccessPolicy: path helpers", () => {
  it("treats the MFA + auth endpoints as exempt", () => {
    expect(isLoginMfaExempt("/api/mfa/verify")).toBe(true);
    expect(isLoginMfaExempt("/api/login")).toBe(true);
    expect(isLoginMfaExempt("/api/health")).toBe(true);
    expect(isLoginMfaExempt("/api/lessons")).toBe(false);
  });

  it("recognizes admin surfaces (prefix match, not substring)", () => {
    expect(isAdminMfaSurface("/api/admin")).toBe(true);
    expect(isAdminMfaSurface("/api/admin/users")).toBe(true);
    expect(isAdminMfaSurface("/api/org-admin")).toBe(true);
    expect(isAdminMfaSurface("/api/org-admin/orgs")).toBe(true);
    expect(isAdminMfaSurface("/api/org-safety")).toBe(true);
    expect(isAdminMfaSurface("/api/team")).toBe(true);
    expect(isAdminMfaSurface("/api/team/roles")).toBe(true);
    expect(isAdminMfaSurface("/api/lessons")).toBe(false);
    // must not false-match a path that merely contains "admin"
    expect(isAdminMfaSurface("/api/badminton")).toBe(false);
  });
});

describe("mfaAccessPolicy: decideLoginMfa", () => {
  it("challenges a staff user mutating without a fresh factor", () => {
    const d = decideLoginMfa(ctx());
    expect(d.action).toBe("challenge");
  });

  it("does NOT fail open when a required user has no authenticator enrolled", () => {
    const d = decideLoginMfa(ctx({ hasTotp: false, hasAuthenticator: false, emailOk: false }));
    expect(d.action).toBe("challenge");
    expect(d).toMatchObject({ enrollmentRequired: true });
  });

  it("forces enrollment when only the master code is usable (no real authenticator)", () => {
    // Master code makes hasTotp true, but the user still has no enrolled
    // authenticator, so we must push them through setup.
    const d = decideLoginMfa(ctx({ hasTotp: true, hasAuthenticator: false, emailOk: false }));
    expect(d).toEqual({ action: "challenge", enrollmentRequired: true });
  });

  it("marks enrollmentRequired false when an authenticator is enrolled", () => {
    const d = decideLoginMfa(ctx({ hasTotp: true, hasAuthenticator: true, emailOk: false }));
    expect(d).toEqual({ action: "challenge", enrollmentRequired: false });
  });

  it("allows once the session is fresh", () => {
    expect(decideLoginMfa(ctx({ fresh: true })).action).toBe("allow");
  });

  it("allows on a valid trusted device", () => {
    expect(decideLoginMfa(ctx({ trustedDevice: true })).action).toBe("allow");
  });

  it("forces enrollment even with a trusted device when no authenticator is enrolled", () => {
    // e.g. a staff+ user who trusted a device, then disabled MFA — must not slip
    // through on the stale trusted-device cookie; enrollment beats trust/freshness.
    const td = decideLoginMfa(ctx({ trustedDevice: true, hasAuthenticator: false, hasTotp: false }));
    expect(td).toEqual({ action: "challenge", enrollmentRequired: true });
    const fr = decideLoginMfa(ctx({ fresh: true, hasAuthenticator: false, hasTotp: false }));
    expect(fr).toEqual({ action: "challenge", enrollmentRequired: true });
  });

  it("allows optional-role users (below staff) regardless", () => {
    expect(decideLoginMfa(ctx({ role: "educator" })).action).toBe("allow");
    expect(decideLoginMfa(ctx({ role: "student" })).action).toBe("allow");
    expect(decideLoginMfa(ctx({ role: "homeschool_parent" })).action).toBe("allow");
  });

  it("requires staff and above as the minimum gated role", () => {
    expect(LOGIN_MFA_MIN_ROLE).toBe("staff");
    expect(decideLoginMfa(ctx({ role: "staff" })).action).toBe("challenge");
    expect(decideLoginMfa(ctx({ role: "site_admin" })).action).toBe("challenge");
  });

  it("lets non-admin reads through for gated users", () => {
    expect(decideLoginMfa(ctx({ method: "GET", fullPath: "/api/lessons" })).action).toBe("allow");
  });

  it("gates admin-surface reads (not just mutations)", () => {
    const d = decideLoginMfa(ctx({ method: "GET", fullPath: "/api/admin/users" }));
    expect(d.action).toBe("challenge");
  });

  it("always allows exempt paths, even for gated users mutating", () => {
    expect(decideLoginMfa(ctx({ fullPath: "/api/mfa/verify" })).action).toBe("allow");
  });

  it("honors the dev bypass", () => {
    expect(decideLoginMfa(ctx({ bypassed: true })).action).toBe("allow");
  });
});

describe("mfaAccessPolicy: mustEnrollAuthenticator", () => {
  it("forces staff+ with no authenticator to enroll (blocks email/recovery bypass)", () => {
    expect(mustEnrollAuthenticator("staff", false)).toBe(true);
    expect(mustEnrollAuthenticator("site_admin", false)).toBe(true);
    expect(mustEnrollAuthenticator("system_admin", false)).toBe(true);
  });

  it("does not force enrollment once an authenticator is enrolled", () => {
    expect(mustEnrollAuthenticator("staff", true)).toBe(false);
    expect(mustEnrollAuthenticator("site_admin", true)).toBe(false);
  });

  it("never forces optional roles (below staff)", () => {
    expect(mustEnrollAuthenticator("educator", false)).toBe(false);
    expect(mustEnrollAuthenticator("homeschool_parent", false)).toBe(false);
    expect(mustEnrollAuthenticator("student", false)).toBe(false);
    expect(mustEnrollAuthenticator(undefined, false)).toBe(false);
  });
});

describe("mfaAccessPolicy: shouldPromptOptInMfa", () => {
  it("prompts optional-role users who have neither enabled nor dismissed", () => {
    expect(shouldPromptOptInMfa("educator", false, false)).toBe(true);
    expect(shouldPromptOptInMfa("student", false, false)).toBe(true);
  });

  it("does not prompt once enabled or dismissed", () => {
    expect(shouldPromptOptInMfa("educator", true, false)).toBe(false);
    expect(shouldPromptOptInMfa("educator", false, true)).toBe(false);
  });

  it("never prompts required (staff+) roles — they're forced, not nudged", () => {
    expect(shouldPromptOptInMfa("staff", false, false)).toBe(false);
    expect(shouldPromptOptInMfa("site_admin", false, false)).toBe(false);
  });
});
