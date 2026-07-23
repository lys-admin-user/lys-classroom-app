---
name: LYS guardrail pause is unconditional
description: Protected-area changes require the pause prompt EVERY time, even for assigned project tasks — a past violation happened via the task route.
---

# LYS guardrail pause is unconditional

**Rule:** before touching any protected area (`server/`, `shared/`, configs, auth, payments/pricing, roles, DB schema, feature flags, secrets, dependencies), run the pause interaction defined in `replit.md` ("How to pause"): name the protected area, pause, ask "Are you the developer?" via user_query. Then log to `docs/guardrail-override-log.md` BEFORE the work and email via `npx tsx scripts/send-guardrail-override-email.ts` after.

**Why:** a server-side change once skipped the pause because it arrived as an approved project task, which "felt" pre-authorized. The developer confirmed this was a violation: planning/task approval is explicitly NOT developer sign-off.

**How to apply:** treat EVERY request route identically — chat, assigned task, follow-up task, resumed session. No size/risk exception. If work is already in progress and you realize it touches a protected area, stop and ask before continuing. Declined pauses are not logged; only proceeds are.

**Follow-up fixes count too (developer-confirmed 2026-07-23):** a code-review
fix, bug fix, or "small follow-up" to just-approved protected-area work is a NEW
protected-area action and needs its OWN fresh pause prompt. A violation happened
when a post-review server fix rode on the earlier approval without re-asking.

**No carry-over (developer-confirmed 2026-07-14):** a "yes, I'm the developer" answer applies ONLY to the single request it was asked for. It never carries over to the next request, even seconds later in the same conversation, even if the user just confirmed for a related change. Every new protected-area action = a fresh pause prompt, clean slate. Agreement in conversation ("sure, let's do that option") is NOT a substitute for the explicit pause question.
