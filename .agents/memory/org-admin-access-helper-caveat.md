---
name: verifyOrgAdminAccess is loose for district_admin
description: The shared org-admin auth helper grants district admins access via plain (non-admin) parent membership; don't rely on it alone to gate sensitive org data disclosure.
---

`verifyOrgAdminAccess(userId, orgId)` (server/routes/_helpers.ts) returns true for
a `district_admin` when the target org is a child of ANY org the user belongs to —
even with a plain `member` role on that parent (it uses `getUserOrganizations`,
which ignores membership role). Likewise `getAdminManagedOrgIds` returns all
memberships regardless of role.

**Why:** A code review flagged that an endpoint exposing org name + campus count
(the Enterprise auto-quote, `GET /api/pricing/enterprise-quote`) leaked to plain
members because it leaned on these helpers. Tightening the shared helper itself was
declined — it is used across many routes and changing its semantics has broad blast
radius without a dedicated regression pass.

**How to apply:** For endpoints that disclose org-scoped data, gate with a DIRECT
admin/owner membership check (`storage.getOrgMembership(orgId, userId)` →
`role === "admin" || "owner"`) plus a platform-admin override
(`storage.isSiteAdmin(userId)`), rather than `verifyOrgAdminAccess`/
`getAdminManagedOrgIds` alone. The quote endpoint does exactly this inline.
