import { describe, it, expect } from "vitest";
import { isPlatformAdminRole } from "../services/dataSubjectService";

// Guards the DSR authorization boundary: only platform-level admins
// (site_admin / system_admin) get a GLOBAL cross-tenant override. Campus and
// district admins must be org-scoped (verified separately against a live DB),
// so they must NOT be treated as platform admins here. This locks in the fix
// for the blanket admin-override hole in canActOnSubject / DSR listing.
describe("DSR platform-admin override boundary (isPlatformAdminRole)", () => {
  it("grants global override to site_admin and system_admin", () => {
    expect(isPlatformAdminRole("site_admin")).toBe(true);
    expect(isPlatformAdminRole("system_admin")).toBe(true);
  });

  it("does NOT grant global override to campus_admin or district_admin", () => {
    expect(isPlatformAdminRole("campus_admin")).toBe(false);
    expect(isPlatformAdminRole("district_admin")).toBe(false);
  });

  it("does NOT grant override to non-admin roles", () => {
    expect(isPlatformAdminRole("educator")).toBe(false);
    expect(isPlatformAdminRole("homeschool_parent")).toBe(false);
    expect(isPlatformAdminRole("student")).toBe(false);
  });

  it("treats missing/empty role as no override", () => {
    expect(isPlatformAdminRole(null)).toBe(false);
    expect(isPlatformAdminRole(undefined)).toBe(false);
    expect(isPlatformAdminRole("")).toBe(false);
  });
});
