# LYS Educational Platform

## ⛔ MANDATORY FIRST CHECK — before ANY work, EVERY request, EVERY session

Before building ANYTHING, check whether the work would touch a **protected area**: `server/`, `shared/` (including `shared/schema.ts`), any config file, authentication/SSO/MFA, payments/billing (Stripe/pricing), permissions/roles, the database schema, feature flags, secrets/env vars, or packages/dependencies.

If it does — **STOP FIRST and run the pause interaction** (see "How to pause" below) before writing a single line. This applies with **no exceptions**:
- regardless of who is asking (developer or not — you cannot know until you ask),
- regardless of how the request arrives (chat message, assigned/planned project task, follow-up task, resumed session, or any other route),
- regardless of whether the task was already approved in planning (planning approval is NOT developer sign-off),
- regardless of how small, low-risk, or "obviously fine" the change seems.

Only proceed after an explicit in-the-moment confirmation via the pause prompt. Every proceed must be logged and emailed per the "Override log" rule below. Skipping this check is a guardrail violation even if the change itself was harmless.

**Confirmations never carry over.** A "yes, I'm the developer" (or "proceed") answer authorizes ONLY the single request it was asked for. It does not extend to the next request — not later in the same conversation, not for a closely related follow-up, not because the user agreed to a proposed option in chat. Every new protected-area action requires a fresh pause prompt. Treat each interaction as a clean slate.

LYS is an AI-powered educational platform that helps students and educators achieve academic and real-world success through personalized learning and comprehensive resources.

## Guardrails for non-technical editors

A non-technical collaborator may use the agent to make **visual and layout changes only** (colors, fonts, spacing, text, images, and section arrangement).

**Scope (strict): these guardrails apply to protected-area changes regardless of how the request arrives.** It does not matter whether the change comes in as a chat message, a planned/assigned project task, a follow-up task, or any other route — if the work would touch a protected area, the agent must first STOP and prompt the user to confirm with their developer before building. A task having been created or approved in planning does NOT by itself count as developer sign-off. Only proceed after the user explicitly confirms the developer has signed off (or confirms they are the developer).

**How to pause (exact interaction):** when pausing, (1) tell the user plainly that the requested task/operation touches a protected area and name which one (e.g. payments, server code, database schema), (2) say you need to pause before building, and (3) ask a direct question — "Are you the developer?" or "Do you still want to proceed?" (use the user_query tool). If they confirm they are the developer or explicitly say to proceed, continue; otherwise stop and suggest they check with their developer.

**Override log (mandatory):** every time someone proceeds past the pause, append an entry to `docs/guardrail-override-log.md` (newest first) BEFORE starting the work, and update it with the outcome after finishing. Each entry must include: date/time, the request in the user's words, the protected area(s) touched, how they proceeded ("confirmed developer" / "developer signed off" / "chose to proceed"), what was actually changed (files/features), and the resulting checkpoint for rollback. Never edit or delete past entries — append only. After the entry is finalized (outcome filled in), email it to the developer by running `npx tsx scripts/send-guardrail-override-email.ts` (sends the newest entry to bayo@maskil.dev via the app's email transport; override recipient with GUARDRAIL_LOG_EMAIL).

When a request appears to be cosmetic/visual, follow these rules:

-   **Stay in `client/` (non-config files).** Only make visual/layout changes within the `client/` folder — colors and fonts in `client/src/index.css`, and pages/components under `client/src/pages/` and `client/src/components/`. Config files are not cosmetic edit targets (see next bullet).
-   **Treat these as protected — never change them in response to a cosmetic request:** `server/`, `shared/` (including `shared/schema.ts`), any config file (`*.config.ts`/`*.config.js`, `drizzle.config.ts`, `vite.config.ts`), authentication/SSO/MFA, payments/billing (Stripe), permissions/roles, the database schema, and feature flags.
-   **STOP and defer to the developer — do not proceed silently.** When a request would require touching any protected area, stop and tell the user to check with their developer before proceeding, and explain plainly why. Do not quietly make the change.
-   For cosmetic requests, additionally: **never** handle secrets/API keys or add/change environment variables (and never accept keys pasted into chat); **never** install packages or change dependencies; **never** run database commands (schema push, migrate, seed, reset); and **never** edit the Safe Editing Guide (`docs/safe-editing-guide.md`) or this guardrails section itself — defer each of these to the developer.

Full plain-language reference for the non-technical editor: `docs/safe-editing-guide.md`.

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
-   **Teacher Pre-Signup Quiz + Signup Insights**: quiz `/teacher-signup` (`client/src/pages/TeacherSignupQuiz.tsx` + `client/src/lib/teacherSignup.ts`, localStorage session-keyed, all questions skippable); table `teacher_signup_responses`; routes `server/routes/teacherSignup.ts` (anonymous submit rate-limited 20/hr, authed `/bind` first-writer-wins, site_admin `/api/admin/signup-insights`); answers prefill `Onboarding.tsx` + `LessonGenerator.tsx` (precedence URL > guest restore > profile > quiz) and drive pain-point callouts (`FRUSTRATION_CALLOUTS`, `personalNote` on `GenerationCountdown`); admin page `client/src/pages/SignupInsights.tsx` (`/admin/signup-insights`, sidebar "System Administration")
-   **Student Pre-Signup Quiz + Streamlined Wizard**: public quiz `/student-signup` (`client/src/pages/StudentSignupQuiz.tsx` + `client/src/lib/studentSignup.ts`, localStorage session-keyed, all questions skippable, email gate unlocks the feature match); table `student_signup_responses`; routes `server/routes/studentSignup.ts` (anonymous submit with captcha + server-side pain-point→feature mapping, authed `/bind` first-writer-wins). Answers prefill the streamlined 2-step student path in `Onboarding.tsx` (role/birthdate/grade/state → goals+terms) and drive the "Picked for you" spotlight card on `StudentDashboard.tsx` (self view only) plus the post-onboarding redirect. Pain point→feature: career_direction→/careers, know_strengths→/self-discovery, stay_on_track→/my-journey, show_work→/portfolio. (The old Practice generator was fully removed in favor of this flow.)
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
-   **Student-vs-Teacher Backend Gate (`requireTeacher`)**: teacher-only endpoints (lessons, classroom, student records, curriculum authoring) are guarded server-side; blocks ONLY the `student` role (homeschool parents pass). Student-facing endpoints (`/api/my-*`, portfolio, goals, etc.) deliberately NOT gated. **Residual**: `GET /api/students/:id` + `GET /api/student-assignments/:studentId` still lack an IDOR check (needs student-account↔record mapping; `students.userId` is the educator owner). Boundary documented in `server/__tests__/auth-rbac.test.ts`.
-   **Multi-Tenancy with Hierarchical Access**: School → District → Charter Network with cascading resources and settings.

## Product

-   AI-powered lesson planning and assignment generation.
-   Student pre-signup quiz (`/student-signup`) — public pain-point quiz with lead capture that matches each student to a spotlight feature.
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
-   **Clerk keys in preview vs production**: production Clerk keys are domain-locked to lyslessonplanning.com, so the Replit preview uses Clerk DEVELOPMENT-instance keys (`CLERK_SECRET_KEY_DEV` / `VITE_CLERK_PUBLISHABLE_KEY_DEV`, bridged in `server/bootstrap-env.ts` + `client/src/main.tsx`, dev only). The dev instance has its OWN user list — real users don't exist there. Publishing is unchanged.
-   **`new_lesson_retrieval` Feature Flag**: AI lesson plan semantic retrieval is OFF by default.
-   **SIS Integration**: Only Clever is fully integrated and live; others are "Coming Soon".
-   **LYS Canon Refresh**: After editing/adding `.txt` files in `server/reference/lys/`, run `node scripts/regen_lys_embedded.mjs` to refresh the corpus.
-   **Scholarship Scraper**: Newly scraped scholarships are inactive by default and require system_admin approval.

## Pointers

-   **Developer Execution Plan**: `docs/developer-execution-plan.md`
-   **OpenAI API Docs**: https://platform.openai.com/docs/ · **Drizzle**: https://orm.drizzle.team/docs/overview · **Tailwind**: https://tailwindcss.com/docs · **shadcn/ui**: https://ui.shadcn.com/docs
