# Safe Editing Guide

A plain-language guide for making **look-and-feel changes** to the LYS platform
with a Replit agent — without accidentally breaking anything important.

If you are not a developer, this is written for you. Keep it open while you work.

Once you've made a change, see the [Editing Workflow](editing-workflow.md) for
how to publish it — how a change gets from Replit to GitHub to the live site, and
when to use the `staging` branch to test first.

---

## The one big idea

You can safely change **how things look**. You should **never** change **how
things work** behind the scenes.

Think of it like decorating a house. You can paint the walls, rearrange the
furniture, and change the artwork. You should not touch the wiring, the plumbing,
the front-door locks, or the safe where important documents are kept. If a
request starts to involve any of that, stop and ask the developer.

---

## What is safe to change (look & feel)

These are visual changes. If you can see it on the screen and it is about
appearance or wording, it is almost always safe.

Safe examples:

- **Colors** — brand colors, button colors, background shades, light/dark mode
  tones. (These live in `client/src/index.css`.)
- **Fonts** — which font is used for headings vs. body text, sizes, bold/italic.
  (Also in `client/src/index.css`.)
- **Spacing & layout** — margins, padding, how much breathing room sections have,
  the order of sections on a page.
- **Text & wording** — headlines, button labels, descriptions, help text, the
  wording in the sidebar, header, and footer.
- **Images & icons** — swapping a logo, hero image, or icon for another one.
- **Simple visual components** — the appearance of cards, buttons, badges, and
  banners.

Where these live (all inside the `client/` folder — the part people see):

- `client/src/index.css` — the master list of colors and fonts.
- `client/src/pages/` — the individual pages (Dashboard, Careers, Pricing, etc.).
- `client/src/components/` — reusable pieces like the sidebar, header, and footer.

Rule of thumb: **if it is inside `client/`, is about appearance or wording, and
is not a config file, it is safe.** (Config files — anything ending in
`.config.ts` or `.config.js`, such as `tailwind.config.ts` — should go through
your developer, even the ones inside the project. See the off-limits section.)

---

## What is off-limits (and why)

These areas control real data, real money, and who is allowed to do what. A
color or wording change never needs to touch them. If an agent's plan mentions
any of these, **stop and check with the developer**.

- **The database and data** — this is where student records, accounts, and
  everything users have saved actually live. A wrong change here can alter or
  permanently erase real information.
- **Logins & sign-in (authentication / SSO)** — how people sign in and stay
  signed in. Breaking this can lock everyone out, including you.
- **Two-factor / security codes (MFA)** — the extra security step for admins.
  Weakening it puts every account at risk.
- **Payments & billing (Stripe)** — plans, prices, checkout, and subscriptions.
  Mistakes here can charge people wrongly or stop payments from working.
- **Permissions & roles** — who counts as a student, teacher, or admin, and what
  each is allowed to see and do. A change here can accidentally expose private
  data.
- **Settings & configuration files** — the behind-the-scenes files that make the
  whole app run and connect to other services.

In folder terms, treat everything **outside** `client/` as off-limits for
appearance changes — especially the `server/` and `shared/` folders and any file
ending in `.config.ts` or `.config.js`.

---

## Extra rules (these matter a lot)

**1. Never share secrets or API keys.**
Never paste passwords, keys, or codes into the chat, and never ask the agent to
add an "environment variable" or change a secret. A cosmetic change never needs
this — and pasting keys into a chat is one of the most common ways credentials
get leaked. If an agent asks you for a key to change a color, that is a red flag.

**2. Don't install packages or add new software (dependencies).**
Changing a color or some text should never require adding new software to the
project. If the agent proposes installing a package or "adding a dependency" for
a visual change, stop and ask the developer.

**3. Don't run database commands.**
Anything described as "push the schema," "migrate," "seed the database," or
"reset" can change or wipe real data. These are never needed for a look-and-feel
change. Do not approve them.

**4. Don't edit this guide or the guardrails in `replit.md`.**
This guide and the guardrails section in `replit.md` are your safety net. Editing
them would quietly remove the very protections keeping you safe. Leave them for
the developer.

---

## Safety habits

Small habits that keep you out of trouble:

- **Set the boundary at the start.** Paste the "boundary prompt" below at the
  beginning of every session so the agent knows the rules up front.
- **One small change at a time.** Make a single change, look at the result, then
  move on. Small steps are easy to undo; big batches are not.
- **Trust checkpoints.** Replit automatically saves checkpoints as you work. If
  something looks wrong, you can roll back to an earlier point. This is your undo
  button — use it without worry.
- **Watch the agent's plan for red flags.** Before approving, skim what the agent
  says it will do. If you see words like *database, migrate, schema, secret, API
  key, environment variable, authentication, login, payment, permission, install,
  or dependency*, pause and check with the developer.
- **Check that login still works.** After a round of changes, sign out and sign
  back in. If sign-in still works and the pages still load, you are in good
  shape.
- **When in doubt, ask.** It is always cheaper to ask the developer first than to
  fix a broken system later.

---

## Copy-paste boundary prompt

Paste this at the **start of every session** with the agent:

```
I am a non-technical editor. I only want to make visual and layout changes
(colors, fonts, spacing, text, images, and section arrangement) inside the
client/ part of the app.

Do NOT change the database or data, logins/authentication, SSO, two-factor/MFA,
payments or billing, permissions/roles, feature flags, or any config files.
Do NOT touch the server/ or shared/ folders. Do NOT install packages or add
dependencies. Do NOT run any database commands (push, migrate, seed, reset).
Do NOT ask me for secrets or API keys, and do NOT add or change environment
variables. Do NOT edit the Safe Editing Guide or the guardrails in replit.md.

If anything I ask would require any of the above, STOP and tell me to check with
my developer first instead of doing it. Make one small change at a time.
```

---

## Quick reference

| I want to change...            | Safe? | What to do                          |
|--------------------------------|-------|-------------------------------------|
| A color or font                | Yes   | Go ahead                            |
| Wording on a page or button    | Yes   | Go ahead                            |
| Spacing / section order        | Yes   | Go ahead                            |
| Swap a logo or image           | Yes   | Go ahead                            |
| Anything about the database    | No    | Ask the developer                   |
| Logins / sign-in / SSO / MFA   | No    | Ask the developer                   |
| Payments, plans, or prices     | No    | Ask the developer                   |
| Who can see or do what (roles) | No    | Ask the developer                   |
| Install software / add a key   | No    | Ask the developer                   |

When the answer is "Ask the developer," it is not because you did something
wrong — it is just the safe way to keep the platform running smoothly.
