# AI Safety & Content Moderation

LYS uses AI (OpenAI) to generate lessons, assignments, practice questions, and
homeschool plans. Because students interact with these features directly, every
user-supplied free-text input is screened **before** it reaches the model and
before any output is returned.

This supports **CIPA** (Children's Internet Protection Act) expectations around
filtering obscene/harmful content, and adds a **self-harm / crisis** safety net.

## How it works

The screening lives in `server/services/contentSafety.ts` and runs inside each AI
generation route (practice, lessons + streaming, assignments, homeschool plans).

1. **Primary signal — OpenAI moderation** (`omni-moderation-latest`). The user's
   combined free-text fields (e.g. topic, subject, interests, notes) are sent to
   the moderation endpoint, which returns flagged categories.
2. **Verdict mapping:**
   - **Self-harm** categories (`self-harm`, `self-harm/intent`,
     `self-harm/instructions`) → **crisis**. We do **not** generate; we return
     supportive crisis resources.
   - **Severe** categories (`sexual`, `sexual/minors`, `harassment/threatening`,
     `hate/threatening`, `violence/graphic`, `illicit/violent`) → **block**.
   - Broad `violence` / non-threatening `hate` are **not** blocked, so legitimate
     history and literature topics (e.g. studying a war) still work.
3. **Fallback when moderation is unavailable.** If the moderation API can't be
   reached, a conservative local keyword/profanity scan still catches the most
   obvious self-harm phrasing and profanity. Normal content proceeds (fail-open
   for availability, but never silently for the obvious-harm cases).

## What the user sees

- **Crisis:** an HTTP 200 with a supportive payload (not an error). The student
  surface (e.g. the Practice page) shows crisis resources instead of questions:
  - **988** — Suicide & Crisis Lifeline (call or text, 24/7).
  - **Text HOME to 741741** — Crisis Text Line.
  - Guidance to reach a trusted adult or call 911 in immediate danger.
- **Blocked content:** an HTTP 422 with a short, student-safe message asking the
  user to rephrase as an academic topic.

## Layering with existing protections

This sits alongside two pre-existing controls:

- **PII stripping** (`server/services/piiSanitizer.ts`) removes student PII from
  prompts before any model call.
- **Topic review filter** (`filterChatMessage`) on lesson routes flags certain
  topics for human review.

Content safety adds the moderation + crisis layer on top, and provides the
**only** input screening on the otherwise-unfiltered practice and homeschool
guest flows.

## Limitations & follow-ups

- Crisis resources are **US-centric** (988 / 741741). Add localized resources
  before launching in other countries.
- Moderation runs on **inputs**; model outputs rely on the model's own safety
  plus the structured/JSON response shape. Output-side moderation could be added
  for fully free-form responses.
- Self-harm detection is a safety net, **not** a clinical tool and not a
  mandatory-reporting mechanism.
