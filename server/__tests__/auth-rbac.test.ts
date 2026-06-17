import { describe, it, expect } from "vitest";
import { hasRolePrivilege, ROLE_HIERARCHY } from "@shared/models/auth";

describe("RBAC (hasRolePrivilege)", () => {
  it("grants when the user's role meets or exceeds the required role", () => {
    expect(hasRolePrivilege("system_admin", "campus_admin")).toBe(true);
    expect(hasRolePrivilege("campus_admin", "campus_admin")).toBe(true);
    expect(hasRolePrivilege("educator", "student")).toBe(true);
  });

  it("denies when the user's role is below the required role", () => {
    expect(hasRolePrivilege("student", "educator")).toBe(false);
    expect(hasRolePrivilege("campus_admin", "system_admin")).toBe(false);
    expect(hasRolePrivilege("homeschool_parent", "campus_admin")).toBe(false);
  });

  it("orders the role hierarchy monotonically from student up to system_admin", () => {
    expect(ROLE_HIERARCHY.student).toBeLessThan(ROLE_HIERARCHY.educator);
    expect(ROLE_HIERARCHY.educator).toBeLessThan(ROLE_HIERARCHY.campus_admin);
    expect(ROLE_HIERARCHY.campus_admin).toBeLessThan(ROLE_HIERARCHY.district_admin);
    expect(ROLE_HIERARCHY.district_admin).toBeLessThan(ROLE_HIERARCHY.site_admin);
    expect(ROLE_HIERARCHY.site_admin).toBeLessThan(ROLE_HIERARCHY.system_admin);
  });
});
