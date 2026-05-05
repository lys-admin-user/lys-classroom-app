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
-   **LYS Reference Corpus**: `server/reference/lys/` (text files), `server/reference/lys/embedded.ts` (embedded output), `server/lysReference.ts` (API)
-   **Scholarship Scraper**: `server/scholarshipScraper/`
-   **Database Schema**: Refer to Drizzle ORM schema files.

## Architecture decisions

-   **Zero-Trust Data Governance**: Implemented with 7 rules for data immutability, communication safety, tenant scoping, data residency, and fraud protection.
-   **FERPA Pre-LLM Sanitization**: Free-text fields are stripped of PII before OpenAI processing using a dedicated service (`server/services/piiSanitizer.ts`).
-   **AI Lesson Plan Semantic Retrieval**: Gated by `new_lesson_retrieval` feature flag, uses OpenAI embeddings (cosine-ranked) for more relevant exemplar selection.
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