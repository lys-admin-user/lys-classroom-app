---
name: LYS brand color convention
description: Which Tailwind hues are on-brand vs off-brand, and how to map them, when building/editing frontend UI.
---

# LYS brand color convention

Brand palette tokens live in `client/src/index.css` and `tailwind.config.ts`:
`--lys-red` (primary), `--lys-yellow`, `--lys-teal`. Tailwind exposes them as
`lys-red` / `lys-yellow` / `lys-teal` utilities.

**On-brand / allowed hues for new UI:**
- `teal-*` and `lys-teal` — the brand cool color (use instead of blue/cyan/indigo/purple).
- `red-*` and `lys-red` — primary brand + error/destructive.
- `amber-*` / `yellow-*` — warning/highlight (brand yellow family).
- `green-*` / `emerald-*` — kept ONLY for semantic success / money / positive growth.
- neutrals: `slate/gray/zinc/neutral/stone`.

**Off-brand — do NOT introduce** (a brand-consistency pass already removed them
across `client/src`): blue, sky, cyan, indigo, violet, purple, fuchsia (→ teal);
orange (→ amber); rose, pink (→ red).

**Why:** user explicitly asked the app to stick to the brand palette. A
shade-preserving hue shift was applied app-wide.

**How to apply:**
- Reach for the mapping above instead of any blue/purple/orange/pink/rose.
- Exception: real external brand identity colors (e.g. Facebook `#1877F2`,
  LinkedIn `#0A66C2` icons in `ShareDialog.tsx`) stay their true colors — do not
  teal-ify them.
- For category/badge maps that need several distinct swatches, distribute across
  brand tones (`teal-600`, `lys-teal`, `red-600`, `lys-red`, `amber-600`,
  `green-600`) rather than collapsing everything to one teal — keeps items
  visually distinguishable while on-brand.
