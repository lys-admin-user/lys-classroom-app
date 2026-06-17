---
name: Org membership roles
description: organization_memberships.role is member/admin/owner, distinct from the platform role hierarchy.
---

There is NO separate "user belongs to org with a platform role" table. Two
distinct role systems exist:

- **Platform role** (`users.role`): student → homeschool_parent → educator →
  staff → campus_admin → district_admin → site_admin → system_admin
  (`ROLE_HIERARCHY` / `hasRolePrivilege` in `shared/models/auth.ts`).
- **Org membership role** (`organization_memberships.role`): only
  `member` | `owner` | `admin` (`OrgMemberRole`).

**Why it matters:** to find a school's admins, filter
`organization_memberships` by `role in ('admin','owner')` — do NOT compare it
against `campus_admin`/`district_admin` etc.; those platform-role strings never
appear in the membership column. (`shared/schema.ts` re-exports everything from
`shared/models/auth.ts`, so import org tables from `@shared/schema`.)
