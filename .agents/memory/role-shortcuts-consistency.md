---
name: Role shortcuts consistency
description: Role-aware navigation/shortcuts must agree across Home, Sidebar, and Settings; site_admin is system-level.
---

# Role-aware shortcuts must stay consistent across surfaces

Three surfaces present role-aware destinations and must agree on what each role
sees: the sidebar (`AppSidebar.tsx`, `navigationGroups` gated by `minRole`/`exactRole`
against `ROLE_HIERARCHY`), the authenticated home band (`RoleQuickStart.tsx`), and
`Settings.tsx` (Administration link-outs).

**Rule:** `site_admin` is a *system-level* role (ranks above `district_admin`), so it
must get system-admin shortcuts (`/system-admin`), NOT campus-admin shortcuts
(`/admin`). Do not group `site_admin` with `campus_admin`.

**Why:** A code review caught `RoleQuickStart` grouping `site_admin` with
`campus_admin` (sending it to campus `/admin`) while the sidebar and Settings
correctly treated `site_admin` as system-level — the home, sidebar, and settings
disagreed for that role.

**How to apply:** When editing any role-to-shortcuts mapping, mirror the same role
ordering the sidebar uses (`hasMinRole` / `ROLE_HIERARCHY` from `@shared/models/auth`).
The command palette (`CommandPalette.tsx`) already reuses the exported
`navigationGroups` + `hasMinRole` from `AppSidebar` for exactly this reason — prefer
reusing that single source over re-deriving role visibility by hand.
