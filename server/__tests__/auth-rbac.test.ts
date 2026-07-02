import { describe, it, expect } from "vitest";
import { hasRolePrivilege, ROLE_HIERARCHY } from "@shared/models/auth";
import {
  canAccessTeamHub,
  shouldElevateRoleOnApproval,
  shouldRestoreRoleOnRevoke,
  FOUNDATION_ADMIN_ROLES,
} from "../services/teamAccessPolicy";

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

describe("Team Hub membership gate (canAccessTeamHub)", () => {
  it("lets foundation admins in regardless of any access request", () => {
    expect(canAccessTeamHub("site_admin", undefined)).toBe(true);
    expect(canAccessTeamHub("system_admin", null)).toBe(true);
    expect(canAccessTeamHub("system_admin", "denied")).toBe(true);
  });

  it("blocks the staff role without an approved request (approval is explicit)", () => {
    expect(canAccessTeamHub("staff", undefined)).toBe(false);
    expect(canAccessTeamHub("staff", "pending")).toBe(false);
    expect(canAccessTeamHub("staff", "denied")).toBe(false);
  });

  it("admits anyone with an approved request", () => {
    expect(canAccessTeamHub("staff", "approved")).toBe(true);
    expect(canAccessTeamHub("educator", "approved")).toBe(true);
  });

  it("blocks everyone else (students, educators, campus/district admins)", () => {
    for (const role of ["student", "homeschool_parent", "educator", "campus_admin", "district_admin"]) {
      expect(canAccessTeamHub(role, "pending")).toBe(false);
      expect(canAccessTeamHub(role, undefined)).toBe(false);
    }
  });

  it("only recognizes site_admin and system_admin as approvers", () => {
    expect([...FOUNDATION_ADMIN_ROLES].sort()).toEqual(["site_admin", "system_admin"]);
  });

  it("elevates only basic roles to staff on approval — never touches admin roles", () => {
    expect(shouldElevateRoleOnApproval("student")).toBe(true);
    expect(shouldElevateRoleOnApproval("homeschool_parent")).toBe(true);
    expect(shouldElevateRoleOnApproval("educator")).toBe(true);
    expect(shouldElevateRoleOnApproval("staff")).toBe(false);
    expect(shouldElevateRoleOnApproval("campus_admin")).toBe(false);
    expect(shouldElevateRoleOnApproval("district_admin")).toBe(false);
    expect(shouldElevateRoleOnApproval("site_admin")).toBe(false);
    expect(shouldElevateRoleOnApproval("system_admin")).toBe(false);
    expect(shouldElevateRoleOnApproval(undefined)).toBe(false);
  });

  it("restores the prior role on revoke only when this approval elevated it", () => {
    // Elevated educator, still staff → demote back to educator.
    expect(shouldRestoreRoleOnRevoke("educator", "staff")).toBe(true);
    expect(shouldRestoreRoleOnRevoke("student", "staff")).toBe(true);
    expect(shouldRestoreRoleOnRevoke("homeschool_parent", "staff")).toBe(true);
    // No prior role recorded (was already staff or admin-granted) → leave alone.
    expect(shouldRestoreRoleOnRevoke(null, "staff")).toBe(false);
    expect(shouldRestoreRoleOnRevoke(undefined, "staff")).toBe(false);
    // Role changed since approval (e.g. promoted to admin) → never touch it.
    expect(shouldRestoreRoleOnRevoke("educator", "campus_admin")).toBe(false);
    expect(shouldRestoreRoleOnRevoke("educator", "site_admin")).toBe(false);
    // Prior role must itself be a basic role — never "restore" to admin tiers.
    expect(shouldRestoreRoleOnRevoke("site_admin", "staff")).toBe(false);
  });
});
