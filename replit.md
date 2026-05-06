# LYS Educational Platform

LYS is an AI-powered educational platform that helps students and educators achieve academic and real-world success through personalized learning and comprehensive resources.

## Run & Operate

_Populate as you build_

## Stack

-   **Frontend**: React 18, TypeScript, Wouter, TanStack React Query, Vite
-   **Backend**: Express.js, TypeScript, Zod
-   **Database**: PostgreSQL, Drizzle ORM
-   **UI**: Tailwind CSS, shadcn/ui
-   **Authentication**: Replit Auth, `express-session`
-   **AI**: OpenAI API

## Where things live

-   **Monorepo Structure**: `/client` (frontend), `/server` (backend), `/shared` (common utilities)
-   **Developer Standards**: `docs/developer-execution-plan.md`
-   **Feature-Specific Architecture**: `docs/`
-   **PII Sanitization Logic**: `server/services/piiSanitizer.ts`
-   **OpenAI Integration**: `server/openai.ts`, `server/assignmentGenerator.ts`
-   **AI Lesson Plan Storage**: `server/storage/lessonAi.ts`
-   **LYS Reference Corpus**: `server/reference/lys/` (text files including `voice_master_teacher.txt` + `exemplar_*.txt`), `server/reference/lys/embedded.ts` (embedded output), `server/lysReference.ts` (API)
-   **Voice Infusion**: `server/services/voiceProfileService.ts`, `server/services/voiceCriticService.ts`
-   **Scholarship Scraper**: `server/scholarshipScraper/`
-   **Database Schema**: Refer to Drizzle ORM schema files.

## Architecture decisions

-   **Zero-Trust Data Governance**: Implemented with 7 rules for data immutability, communication safety, tenant scoping, data residency, and fraud protection.
-   **FERPA Pre-LLM Sanitization**: Free-text fields are stripped of PII before OpenAI processing using a dedicated service (`server/services/piiSanitizer.ts`).
-   **AI Lesson Plan Semantic Retrieval**: Gated by `new_lesson_retrieval` feature flag, uses OpenAI embeddings (cosine-ranked) for more relevant exemplar selection.
-   **LYS Master Teacher Voice Infusion**: Gated by the same `new_lesson_retrieval` flag. `voiceProfileService` injects a static rubric + cosine-retrieved snippets from `lys_canon_entries` (kinds `voice` / `exemplar_full`, seeded from `server/reference/lys/`) into both lesson and assignment prompts. After generation, `voiceCriticService` (gpt-4o-mini) scores the output 0-100 and rewrites if below `VOICE_CRITIC_THRESHOLD` (default 80). Results land in `lesson_generation_attribution` and `assignment_generation_attribution` for the admin Performance panel.
-   **Generation Resilience & Streaming UX**: When OpenAI is unreachable, `server/services/fallbackResolver.ts` runs a cache→exemplar→error cascade (cached prior generation by topic+grade, then top cosine `exemplar_full` canon entry adapted into the output shape, then `GenerationFallbackError`). Successful assignment generations persist `generatedContent` into `assignment_generation_attribution` to seed that cache. Mock template generators are no longer used in production paths. Streaming endpoints `POST /api/lessons/generate-stream` + `POST /api/assignments/generate-stream` (in `server/routes/lessons.ts`) emit SSE phase + delta events consumed by `client/src/lib/streamGeneration.ts` and rendered by `client/src/components/GenerationCountdown.tsx` (5-phase branded countdown + thinking ticker + fallback warning banner). Phase ticks are synthesized server-side via `server/services/generationStream.ts`; OpenAI itself is still called non-streaming to keep the existing regenerate-on-low-quality + voice critic loop intact.
-   **International Standards Fallback**: When a CSP-seeded jurisdiction exists but has zero standard sets attached (Nigeria, Philippines, Indonesia, India, etc.), `server/routes/org.ts` falls through to the static curriculum file in `shared/standards.ts` instead of short-circuiting on jurisdiction existence. `getSubjects` matches African countries by country alone (ignoring per-state abbreviation) and exposes a generic `internationalCoreSubjects` set for non-African developing nations. `LessonGenerator` requires standard-code selection only when the codes endpoint actually returns codes — international curricula without per-outcome codes proceed and let the AI infer outcomes from topic+grade+country context.
-   **Multi-Tenancy with Hierarchical Access**: Supports complex organizational structures (School, District, Charter Network) with cascading resources and settings.
-   **Monorepo for Cohesion**: Organized into `/client`, `/server`, and `/shared` to manage related services and frontend.

## Product

-   AI-powered lesson planning and assignment generation.
-   Self-discovery, career exploration, and goal-setting tools (Be-Know-Do framework).
-   Comprehensive educational resources and shared library.
-   Student digital portfolios and transfer system.
-   Gradebook and SIS integration (Clever currently live).
-   Parent Portal with messaging and portfolio oversight.
-   Monetization via marketplace, subscriptions, and affiliate programs.
-   Automated scholarship scraping and mentorship tools.

## User preferences

Preferred communication style: Simple, everyday language.

## Gotchas

-   **OpenAI Credentials**: Replit's managed OpenAI integration provisions `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL`. `server/bootstrap-env.ts` (imported first in `server/index.ts`) bridges these to `OPENAI_API_KEY` / `OPENAI_BASE_URL` so existing OpenAI clients work unchanged. If both are missing, generators silently fall back to a typo-laden mock template — always confirm the integration is connected.
-   **`new_lesson_retrieval` Feature Flag**: AI lesson plan semantic retrieval is OFF by default.
-   **SIS Integration**: Only Clever is fully integrated and live; others are "Coming Soon".
-   **LYS Canon Refresh**: After editing/adding `.txt` files in `server/reference/lys/`, run `node scripts/regen_lys_embedded.mjs` to refresh the corpus.
-   **Scholarship Scraper**: Newly scraped scholarships are inactive by default and require system_admin approval.

## Pointers

-   **Developer Execution Plan**: `docs/developer-execution-plan.md`
-   **OpenAI API Documentation**: [https://platform.openai.com/docs/](https://platform.openai.com/docs/)
-   **Drizzle ORM Documentation**: [https://orm.drizzle.team/docs/overview](https://orm.drizzle.team/docs/overview)
-   **Tailwind CSS Documentation**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
-   **shadcn/ui Documentation**: [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)