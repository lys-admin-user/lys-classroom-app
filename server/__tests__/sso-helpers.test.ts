import { describe, it, expect } from "vitest";
import {
  emailDomain,
  emailMatchesConnection,
  resolveSsoConnectionByEmail,
  sanitizeProvisionRole,
} from "../services/ssoService";

describe("emailMatchesConnection", () => {
  it("matches when the email domain is in allowedDomains (case-insensitive)", () => {
    expect(emailMatchesConnection("Teacher@Lincoln.EDU", { allowedDomains: ["lincoln.edu"] })).toBe(true);
    expect(emailMatchesConnection("a@lincoln.edu", { allowedDomains: [" LINCOLN.EDU "] })).toBe(true);
  });

  it("rejects when the domain is not in allowedDomains", () => {
    expect(emailMatchesConnection("a@other.com", { allowedDomains: ["lincoln.edu"] })).toBe(false);
  });

  it("rejects when allowedDomains is empty, null, or undefined", () => {
    expect(emailMatchesConnection("a@lincoln.edu", { allowedDomains: [] })).toBe(false);
    expect(emailMatchesConnection("a@lincoln.edu", { allowedDomains: null })).toBe(false);
    expect(emailMatchesConnection("a@lincoln.edu", {})).toBe(false);
  });

  it("rejects malformed or missing emails", () => {
    expect(emailMatchesConnection("garbage", { allowedDomains: ["lincoln.edu"] })).toBe(false);
    expect(emailMatchesConnection(null, { allowedDomains: ["lincoln.edu"] })).toBe(false);
    expect(emailMatchesConnection(undefined, { allowedDomains: ["lincoln.edu"] })).toBe(false);
  });
});

describe("emailDomain", () => {
  it("extracts the lowercased domain", () => {
    expect(emailDomain("Alice@Lincoln.EDU")).toBe("lincoln.edu");
    expect(emailDomain("  bob@school.org  ")).toBe("school.org");
  });

  it("returns null for malformed addresses", () => {
    expect(emailDomain("")).toBeNull();
    expect(emailDomain(null)).toBeNull();
    expect(emailDomain(undefined)).toBeNull();
    expect(emailDomain("noatsign")).toBeNull();
    expect(emailDomain("@nodomain")).toBeNull();
    expect(emailDomain("trailing@")).toBeNull();
    expect(emailDomain("a@b@c.com")).toBeNull();
    expect(emailDomain("nodot@localhost")).toBeNull();
  });
});

describe("resolveSsoConnectionByEmail", () => {
  const connections = [
    { id: "c1", allowedDomains: ["lincoln.edu", "lincoln.k12.us"], enabled: true },
    { id: "c2", allowedDomains: ["Roosevelt.org"], enabled: true },
    { id: "c3", allowedDomains: ["disabled.edu"], enabled: false },
  ];

  it("matches an email to the connection that owns its domain", () => {
    expect(resolveSsoConnectionByEmail("teacher@lincoln.edu", connections)?.id).toBe("c1");
    expect(resolveSsoConnectionByEmail("a@lincoln.k12.us", connections)?.id).toBe("c1");
  });

  it("matches case-insensitively on the configured domain", () => {
    expect(resolveSsoConnectionByEmail("user@roosevelt.org", connections)?.id).toBe("c2");
  });

  it("returns null when no connection owns the domain", () => {
    expect(resolveSsoConnectionByEmail("user@unknown.com", connections)).toBeNull();
  });

  it("ignores disabled connections", () => {
    expect(resolveSsoConnectionByEmail("user@disabled.edu", connections)).toBeNull();
  });

  it("returns null for malformed emails", () => {
    expect(resolveSsoConnectionByEmail("garbage", connections)).toBeNull();
  });
});

describe("sanitizeProvisionRole", () => {
  it("allows non-privileged roles", () => {
    expect(sanitizeProvisionRole("student")).toBe("student");
    expect(sanitizeProvisionRole("educator")).toBe("educator");
    expect(sanitizeProvisionRole("homeschool_parent")).toBe("homeschool_parent");
  });

  it("clamps privileged or unknown roles down to student", () => {
    expect(sanitizeProvisionRole("system_admin")).toBe("student");
    expect(sanitizeProvisionRole("site_admin")).toBe("student");
    expect(sanitizeProvisionRole("campus_admin")).toBe("student");
    expect(sanitizeProvisionRole("staff")).toBe("student");
    expect(sanitizeProvisionRole("bogus")).toBe("student");
    expect(sanitizeProvisionRole(null)).toBe("student");
    expect(sanitizeProvisionRole(undefined)).toBe("student");
  });
});
