# LYS Educational Platform

LYS is an AI-powered educational platform that helps students and educators achieve academic and real-world success through personalized learning and comprehensive resources.

## Stack

-   **Frontend**: React 18, TypeScript, Wouter, TanStack React Query, Vite
-   **Backend**: Express.js, TypeScript, Zod
-   **Database**: PostgreSQL, Drizzle ORM
-   **UI**: Tailwind CSS, shadcn/ui
-   **Authentication**: Replit Auth, `express-session`
-   **AI**: OpenAI API

## Where things live

-   **Monorepo Structure**: `/client` (frontend), `/server` (backend), `/shared` (common utilities); developer standards + feature docs in `docs/`
-   **PII Sanitization**: `server/services/piiSanitizer.ts`
-   **OpenAI Integration**: `server/openai.ts`, `server/assignmentGenerator.ts`; AI lesson storage `server/storage/lessonAi.ts`
-   **LYS Reference Corpus + Voice Infusion**: `server/reference/lys/` (txt sources → `embedded.ts`), API `server/lysReference.ts`; `server/services/voiceProfileService.ts` + `voiceCriticService.ts`
-   **Scholarship Scraper**: `server/scholarshipScraper/`
-   **Standards Ingestion**: `server/services/cspService.ts` (authoritative CSP sync), `standardsCatalog.ts` (runtime cascade), `llmExtractionService.ts` (PDF/text extraction), routes `server/routes/org.ts` (`/api/standards/*`)
-   **Standards Course Layer (Subject→Course→Codes)**: pure engine `shared/courseGrouping.ts`; `listCourses` + `courseId` branch in `standardsCatalog.ts`; UI `client/src/components/StandardsCascadePicker.tsx`; tests `server/__tests__/course-grouping.test.ts`
-   **Texas Agriculture TEKS Seed**: `server/services/agricultureTeksSeed.ts`; refresh with `npx tsx scripts/seed-texas-ag-teks.ts`
-   **Career Explorer Catalog (~830 careers)**: 42 curated in `seedCareers` (`server/storage/_base.ts`, stable ids "1".."42") + ~800 generated in `server/storage/careersGenerated.ts`; regenerate with `npx tsx scripts/ingest-bls-careers.ts`; UI `client/src/pages/Careers.tsx`
-   **Embedded Routes**: `client/src/pages/EmbedRouter.tsx`, `client/src/components/EmbedWrapper.tsx`, `EmbedSidebar.tsx`
-   **Command Palette**: `client/src/components/CommandPalette.tsx` (reuses `navigationGroups` + `hasMinRole` from `AppSidebar.tsx`)
-   **Anonymous Landing / Role Home**: `client/src/components/RoleRoutedLanding.tsx` (pre-login); authed "/" is persona-routed (see Persona UI)
-   **Persona UI (nav trim + theming + homes)**: config `client/src/lib/personas.ts` (personaForRole, PERSONA_CONFIGS.primaryGroups, homeConfigForRole); sidebar/palette persona-first ordering with "More" overflow (`AppSidebar.tsx`, `CommandPalette.tsx`); accent via `data-persona` on `<html>` (`usePersonaTheme` in `App.tsx`, vars in `index.css`, `persona` color in tailwind config); home layouts `client/src/components/PersonaHome.tsx` (PersonaQuickStart + Homeschool/Staff/SchoolAdmin/PlatformAdmin homes), routed in `Dashboard.tsx` default export. Presentation-only — server gating unchanged.
-   **Guest Email Gate**: `client/src/components/GuestEmailModal.tsx`, `guest_leads` table, endpoints in `server/routes/lessons.ts`
-   **Student Practice Flow**: `client/src/pages/PracticeGenerator.tsx` (`/practice`), `server/routes/practice.ts`, `server/practiceGenerator.ts`
-   **School Demo Requests**: `client/src/pages/ForSchools.tsx` (`/for-schools`), `server/routes/demo.ts`, `server/storage/demo.ts`
-   **Homeschool Weekly Planner**: `client/src/pages/HomeschoolPlanner.tsx` (`/homeschool`), `server/routes/homeschool.ts`, `server/homeschoolPlanner.ts`
-   **Audit Trail**: `server/services/auditLog.ts`; verify endpoint `GET /api/admin/audit-logs/verify`
-   **Observability**: `server/observability.ts` (pino + redaction + request id), `/health` + `/ready` in `server/index.ts`
-   **COPPA/GDPR/CCPA + Retention**: `server/services/dataSubjectService.ts`, `server/routes/dsr.ts`, COPPA gate in `server/routes/account.ts`, purge scheduler in `server/index.ts`
-   **In-Memory Caching**: `server/services/memoryCache.ts` (TTL cache + `cached()` middleware)
-   **Dependency / CI Hardening**: `scripts/audit-deps.mjs`, `.github/dependabot.yml`, `.github/workflows/ci.yml`, tests in `server/__tests__/` (vitest)
-   **Team Hub (internal HR + ops)**: hub at `/team` + `/team/:tab`; schema `hr_roles`/`employees`/`hr_onboarding_tasks`; storage `server/storage/teamHub.ts`; routes `server/routes/teamHub.ts` (`/api/team/*`); UI `client/src/pages/TeamHub.tsx` + `TeamHubViews.tsx`. Role directory: 38 roles auto-generated from `server/hr/rolesSource.txt` by `scripts/ingest-lys-roles.ts` (re-run to refresh; blank KPI/SOP targets are NOT fabricated); `seedHrRoles` (boot) is idempotent by stable id and never overwrites admin edits — regenerating does NOT repair seeded rows (delete `isSeed=true` `role-%` rows + restart for a clean reseed). Admins edit roles/KPIs/SOPs via `RoleFormDialog`. HR job roles are intentionally SEPARATE from platform `ROLE_HIERARCHY`.
-   **Team Hub Staff Approval Gate**: membership is admin-approved. `staff_access_requests` table; gate logic `server/services/teamAccessPolicy.ts` (`canAccessTeamHub`: site_admin/system_admin always in, others need an approved row); `requireApprovedStaff` on all `/api/team/*` reads; access endpoints in `server/routes/teamHub.ts` (approve requires fresh MFA; elevates basic roles to `staff` recording `priorRole`; revoke restores it). Existing staff grandfathered at boot. UI: `useTeamHubAccess` hook gates sidebar/palette + `TeamHub.tsx` request/pending/denied card; admin queue in People tab.

## Architecture decisions

-   **Zero-Trust Data Governance**: 7 rules for data immutability, communication safety, tenant scoping, data residency, fraud protection.
-   **FERPA Pre-LLM Sanitization**: free-text is PII-stripped (`piiSanitizer.ts`) before any OpenAI call.
-   **AI Retrieval + Voice Infusion**: gated by `new_lesson_retrieval` flag — embedding-ranked exemplar retrieval plus master-teacher voice snippets injected into prompts; `voiceCriticService` (gpt-4o-mini) scores output and rewrites below `VOICE_CRITIC_THRESHOLD` (default 80); attribution recorded for the admin Performance panel.
-   **Generation Resilience & Streaming UX**: when OpenAI is down, `fallbackResolver.ts` cascades cache→exemplar→error (no mock templates in production paths). SSE streaming endpoints (`.../generate-stream`) drive the 5-phase `GenerationCountdown` UI; OpenAI itself is called non-streaming to preserve the quality/critic loop.
-   **International Standards Fallback**: jurisdictions with zero standard sets fall through to static `shared/standards.ts`; international curricula without per-outcome codes skip required code selection.
-   **Embedded Routes (DO NOT REMOVE)**: `EmbedRouter` at `/embed/:rest*` powers single-component embeds (`/embed/<page>`, auto-height via `lys-resize` postMessage) and full-site embeds (`/embed/full/*`, route sync via `lys-route-change`/`lys-navigate`). Used by in-app drawers/modals and external iframes — not dead navigation.
-   **Role-Aware Navigation & Home**: single home `/` branches by role (StudentDashboard vs EducatorDashboard+RoleQuickStart); anonymous visitors get the full-screen `RoleRoutedLanding` rendered OUTSIDE the app shell (gated in `AppShell` by `!isAuthenticated && location === "/"`). Sidebar gates all nav via `minRole`/`exactRole`; CommandPalette reuses the same exported config so they never drift. `/settings` links out to admin pages rather than duplicating controls.
-   **Tamper-Evident Audit Trail**: `auditLogs` rows form a SHA-256 hash chain (advisory-lock serialized, no forks); `verifyAuditChain()` detects edits/deletions/forks/cycles.
-   **Structured Observability**: pino structured logs with secret redaction + per-request `x-request-id`; 5xx internals hidden from clients. Built-in logging only.
-   **API Versioning**: `/api/v1/*` rewrites to `/api/*` (both prefixes equivalent).
-   **COPPA + GDPR/CCPA Compliance**: birthdate required for every self-serve onboarding; under-13 blocked from self sign-up (school/parent accounts only). Self-serve can only set non-privileged roles; escalation attempts are rejected + audited. DSR export/erasure: self-serve hard-deleted, school-owned records anonymized; tenant-scoped authorization (only site/system admin have global override). Daily `runRetentionPurge` (3-year retention).
-   **Full & Real Standards Ingestion (foundational)**: ingested standards must be the FULL, REAL published set — never partial samples or fabricated. CSP sync is authoritative; the LLM/PDF path processes ENTIRE documents in chunks and loudly flags incomplete ingestion. `shared/standards.ts` is only a labeled last-resort fallback (`source: "fallback"`).
-   **Texas Agriculture TEKS**: "Principles of AFNR (2024)" ingested from CSP under subject `"CTE: Agriculture, Food & Natural Resources"` (76 standards, 9–12); add more AFNR courses via `AG_COURSES` in `agricultureTeksSeed.ts`.
-   **Student-vs-Teacher Backend Gate (`requireTeacher`)**: teacher-only endpoints (lessons, classroom, student records, curriculum authoring) are guarded server-side; blocks ONLY the `student` role (homeschool parents pass). Student-facing endpoints (`/api/my-*`, practice, portfolio, goals, etc.) deliberately NOT gated. **Residual**: `GET /api/students/:id` + `GET /api/student-assignments/:studentId` still lack an IDOR check (needs student-account↔record mapping; `students.userId` is the educator owner). Boundary documented in `server/__tests__/auth-rbac.test.ts`.
-   **Multi-Tenancy with Hierarchical Access**: School → District → Charter Network with cascading resources and settings.

## Product

-   AI-powered lesson planning and assignment generation.
-   Student practice generator (`/practice`) — anonymous-friendly via guest email gate + 5/month shared guest quota.
-   Self-discovery, career exploration, and goal-setting tools (Be-Know-Do framework).
-   Educational resources, shared library, student digital portfolios + transfer system.
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
-   **OpenAI API Docs**: https://platform.openai.com/docs/ · **Drizzle**: https://orm.drizzle.team/docs/overview · **Tailwind**: https://tailwindcss.com/docs · **shadcn/ui**: https://ui.shadcn.com/docs
