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

describe("Teacher-tools access boundary (requireTeacher)", () => {
  const TEACHER_ROLES = [
    "homeschool_parent",
    "educator",
    "staff",
    "campus_admin",
    "district_admin",
    "site_admin",
    "system_admin",
  ] as const;

  it("blocks the student role from teacher tools", () => {
    expect(hasRolePrivilege("student", "homeschool_parent")).toBe(false);
    expect((TEACHER_ROLES as readonly string[]).includes("student")).toBe(false);
  });

  it("allows homeschool parents and everyone above them through", () => {
    for (const role of TEACHER_ROLES) {
      expect(hasRolePrivilege(role, "homeschool_parent")).toBe(true);
    }
  });

  it("covers every non-student role (no role is silently locked out)", () => {
    const everyNonStudentRole = (Object.keys(ROLE_HIERARCHY) as Array<keyof typeof ROLE_HIERARCHY>)
      .filter((r) => r !== "student");
    for (const role of everyNonStudentRole) {
      expect((TEACHER_ROLES as readonly string[]).includes(role)).toBe(true);
    }
  });
});
