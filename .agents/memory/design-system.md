---
name: LYS design system conventions
description: Brand-aligned visual conventions for the LYS app UI (fonts, sidebar, color usage).
---

# LYS visual conventions

These are presentational conventions the app's UI should stay consistent with.

## Typography
- **Headings/labels → `font-oswald`** (Oswald, condensed). Page H1/H2/CardTitle use `font-oswald font-semibold tracking-tight`.
- **Body → `font-roboto`**.
- **`font-marker` (Permanent Marker) is RESERVED for the LYS logo/wordmark only** (the "LYS" / "L" brand mark). Do NOT use it for page titles or section headings.
  - **Why:** Permanent Marker on every heading reads as loud/busy; the approved "beautiful + simple" aesthetic uses clean Oswald headings and keeps marker as a brand accent.
  - **How to apply:** When adding a new page, title it with `font-oswald`, not `font-marker`. Only the literal LYS logo spans (e.g. ForSchools, Onboarding, SharedLesson inline "LYS") keep `font-marker`.

## Sidebar (AppSidebar.tsx)
- White sidebar (`--sidebar` is `0 0% 100%` in light), neutral hover (`--sidebar-accent` `0 0% 96%`).
- Active nav item = brand-red tint: `data-[active=true]:bg-lys-red/10 data-[active=true]:text-lys-red`.
- Group labels: `text-[10px] uppercase tracking-widest font-semibold`, color-coded — BE=red, KNOW=amber `hsl(45,93%,38%)` (darker than the light fill yellow for legibility), DO=teal.
- Lucide icons rendered with `strokeWidth={1.75}` for a refined line weight. `NavItem.icon` must be typed `LucideIcon` (not a hand-narrowed prop type) so Lucide props like `strokeWidth` typecheck.

## Color usage
- lys-red `7 84% 54%`, lys-teal `186 98% 23%`, lys-yellow fill `45 93% 62%` but **yellow TEXT/labels use `hsl(45,93%,38%)`** (the light fill is too low-contrast as text).
- Global `borderRadius` bumped (lg .875rem) for softer cards/buttons everywhere; cards stay white with soft borders (`border-border` ~`hsl(0 0% 92%)`).
