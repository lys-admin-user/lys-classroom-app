---
name: AI content-safety moderation
description: Design constraints for the student-facing AI moderation layer (contentSafety.ts) wired into generation routes.
---

# AI content-safety moderation

Student free-text is screened before it reaches OpenAI generation, with a self-harm/crisis path (return resources, 200, don't generate) and a CIPA block path (422).

**OpenAI `omni-moderation-latest` has NO "profanity" category.** Plain profanity ("this is fucking dumb") is NOT flagged by the moderation API. So the local profanity/self-harm keyword scan must ALWAYS run in addition to the API call, and the most-severe verdict wins — never treat the moderation API as sufficient on its own for CIPA-style filtering.
**Why:** relying only on the API silently lets profanity through; the local scan was originally fallback-only and missed it on the primary path.

**Broad `violence` / non-threatening `hate` are intentionally NOT blocked** — only graphic/threatening/sexual buckets. Blocking them nukes legitimate history/literature topics (studying a war, etc.).
**Why:** academic false-positives. Keep the block category set narrow.

**Every generation route must be gated** — it's easy to miss the streaming siblings. There are paired streaming + non-streaming endpoints for both lessons and assignments; the assignment *streaming* route was the one initially missed. When adding moderation, grep for every `generate`/`generate-stream`/`generate-guest` endpoint.
**Why:** one ungated path defeats the whole control.

**Crisis returns HTTP 200** (supportive payload `{blocked, crisis, resources}`), not an error, so clients render resources instead of failing. Block returns 422 `{blocked, message}`. Crisis resources are US-centric (988 / 741741) — localize before non-US launch.

**Testing note:** the `openai` client from `server/openai.ts` is null in vitest (key only bridged at runtime via bootstrap-env), so unit tests exercise the deterministic local-scan path. Live moderation works through the Replit AI gateway — the `/moderations` endpoint IS proxied.
