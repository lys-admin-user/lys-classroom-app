// Pure decision logic for the Team Hub membership gate. Kept dependency-free
// so it can be unit-tested hermetically (no DB) in server/__tests__.

export const FOUNDATION_ADMIN_ROLES = new Set(["site_admin", "system_admin"]);

// Roles that approval may elevate to `staff`. Higher roles are never touched
// (approval must not downgrade an admin), and `staff` itself needs no change.
export const ELEVATABLE_ROLES = new Set(["student", "homeschool_parent", "educator"]);

export type StaffAccessStatus = "pending" | "approved" | "denied";

// Team Hub is open only to foundation admins (the approvers) and users whose
// access request has been APPROVED. Holding the `staff` role alone is NOT
// enough — membership is an explicit admin-granted approval.
export function canAccessTeamHub(
  role: string | null | undefined,
  accessStatus: string | undefined | null,
): boolean {
  if (role && FOUNDATION_ADMIN_ROLES.has(role)) return true;
  return accessStatus === "approved";
}

// Whether approving a user's membership should also elevate their platform
// role to `staff`.
export function shouldElevateRoleOnApproval(role: string | null | undefined): boolean {
  return !!role && ELEVATABLE_ROLES.has(role);
}

// True only for the admin tiers allowed to approve/deny membership.
export function isFoundationAdmin(role: string | null | undefined): boolean {
  return !!role && FOUNDATION_ADMIN_ROLES.has(role);
}

// When membership is revoked, only demote if THIS approval elevated the user
// (priorRole recorded) AND they still hold exactly the granted `staff` role —
// never touch a role an admin changed to something else in the meantime.
export function shouldRestoreRoleOnRevoke(
  priorRole: string | null | undefined,
  currentRole: string | null | undefined,
): boolean {
  return !!priorRole && currentRole === "staff" && ELEVATABLE_ROLES.has(priorRole);
}
