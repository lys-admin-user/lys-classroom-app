---
name: Sidebar rail + flyout architecture
description: How AppSidebar's icon-rail + flyout is integrated with the shadcn Sidebar primitive, and the constraints to keep it working.
---

# AppSidebar rail + flyout

AppSidebar (`client/src/components/AppSidebar.tsx`) is a 72px icon rail + a ~280px
category flyout, both rendered as a single child inside the shadcn
`<Sidebar collapsible="icon">` primitive. The app shell widths come from
`client/src/App.tsx` AppShell: `--sidebar-width: 22rem`, `--sidebar-width-icon: 4.5rem`.

**Why this shape:** collapse must map to "rail only". The flyout is conditionally
*unmounted* when `state === "collapsed"` (`showFlyout = isMobile || state === "expanded"`),
not just hidden. So the Sidebar wrapper does NOT need `overflow-hidden` — putting it
there clips the rail's hover tooltips. Keep `overflow-hidden` on the flyout's own
outer div instead (contains its content during the width transition) and leave the
`<Sidebar>` wrapper free to let tooltips/active-indicator escape.

**How to apply / constraints:**
- Exports `navigationGroups`, `hasMinRole`, `NavItem`, `NavGroup` must stay stable —
  `CommandPalette.tsx` and `Settings.tsx` import them. `EmbedSidebar.tsx` has its own
  copy and is unaffected.
- The 3 `studentFocused` Be/Know/Do groups collapse into ONE rail category with 3
  color-coded flyout sections; every other group is 1 rail category (needs `icon`).
- Educators+ get tools first, BKD bucket last (`reorderForEducator`); others see BKD first.
- Icon-only rail/footer controls need `aria-label` + `title`; tooltips also reveal on
  `group-focus-visible`. When collapsed, a rail category click must `setOpen(true)` first
  (its flyout is unmounted), otherwise the click looks dead.
- `isDark = hasMinRole(role, "campus_admin")` → charcoal rail; flyout always light.
