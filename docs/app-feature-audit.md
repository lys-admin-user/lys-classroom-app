# LYS Feature Audit — Everything the App Does, and What Needs Attention

**Date:** July 15, 2026
**How to read this:** Part 1 is the full inventory of what the app does today. Part 2 lists the gaps we found — things that are limited, incomplete, or not yet ready — in priority order. Part 3 splits that work into "developer only" vs. "any team member can do this."

This audit deliberately **excludes** items already sitting in the project task list and the risks already written up in `threat_model.md` — those are tracked elsewhere. Everything below is either working functionality or a *newly identified* gap.

---

## Part 1 — Full Feature Inventory

### A. Getting in the door (visitors, sign-up, login)

| Feature | What it does | Status |
|---|---|---|
| Public landing page | Visitors see a marketing page tailored to who they are (student, teacher, school) before logging in | Working |
| Sign in / sign up (Clerk) | Email, Google, and other login options; under-13s blocked from self sign-up (COPPA) | Working |
| Enterprise single sign-on (SSO) | Schools can log in through Google, Azure, Okta, or a generic provider; new accounts auto-created by email domain | Working |
| Two-factor security (MFA) | Authenticator-app codes required for admins before sensitive actions; recovery codes supported | Working |
| Free trial | 10-day Pro trial, with tracking to prevent people from taking repeat trials | Working |
| Guest lesson generation | Visitors can generate up to 5 lessons/month after giving an email; lessons transfer to their account if they sign up | Working |
| Onboarding wizard | New users pick their role, interests, and needs in a few steps | Working |

### B. AI teaching tools (the core product)

| Feature | What it does | Status |
|---|---|---|
| AI Lesson Generator | Creates full lesson plans from a topic + academic standards, with a live 5-phase progress screen | Working |
| AI Assignment Generator | Creates quizzes, worksheets, and projects to go with lessons | Working |
| Student Pre-Signup Quiz | Public pain-point quiz at `/student-signup` matches students to a spotlight feature (replaced the Practice Generator, which was removed) | Working |
| Essay Builder | AI-assisted college/personal essay drafting | Working |
| Homeschool Weekly Planner | Builds a week of homeschool plans at `/homeschool` | Working |
| Content safety | Student names and personal info are stripped out before anything is sent to the AI; sensitive topics filtered; flagged content goes to a review queue | Working |
| AI quality "voice" system | Generated lessons are scored against master-teacher writing; weak output gets rewritten automatically | Working (behind an off-by-default switch for the retrieval part) |
| AI outage safety net | If OpenAI is down, the app falls back to cached/example content instead of crashing | Working — but see gap #3 below |

### C. Academic standards

| Feature | What it does | Status |
|---|---|---|
| Standards catalog | Browse standards by country → state → subject → course → grade | Working |
| Official standards sync | Pulls real published standards from the Common Standards Project | Working |
| PDF/document ingestion | Admins can upload a standards PDF and the AI extracts the standards from it | Working; flags itself for review if it thinks it missed some |
| Texas Agriculture (TEKS) | Principles of AFNR course fully ingested | Working |
| International fallback | Countries with no synced standards fall back to a built-in list, clearly labeled | Working |
| Coverage widgets | Teachers see which standards they've used and which are still uncovered | Working |

### D. Student experience (Be–Know–Do)

| Feature | What it does | Status |
|---|---|---|
| Self-Discovery assessment | Students answer questions and get a strengths/interests profile | Working |
| Strengths Inventory | Detailed personal strengths breakdown | Working |
| Career Explorer | ~830 careers with salary data, filters, and save-for-later | Working |
| Scholarship Planner | Students track scholarship applications and requirements | Working |
| Automated scholarship scraper | The system scrapes scholarship listings; admins approve them before students see them | Working — but see gap #2 below |
| Mentor Connect | Connects students with mentors | Working |
| Action Plans & Milestones | Goal-setting and progress tracking | Working |
| Digital Portfolio | Students build a portfolio with a shareable public link; portfolios can transfer between schools | Working |
| Campus Activities | Browse and register for extracurriculars | Working |
| Assignments page | Students view and submit assigned work | Working |

### E. Classroom & school management

| Feature | What it does | Status |
|---|---|---|
| Classroom / rosters | Teachers manage classes and student lists | Working |
| Gradebook | Grade tracking with a protected export (owner-or-admin only, rate-limited, audited) | Working |
| Curriculum Planning | Year-at-a-glance and scope & sequence builders | Working |
| Lesson Authoring | Manual lesson creation and a shared lesson library | Working |
| Parent Portal | Parents see student progress, message teachers, and manage consents | Working — see gap #9 |
| SIS sync (Clever) | Pulls rosters from Clever | Working |
| SIS sync (others) | PowerSchool, Canvas, Infinite Campus, Skyward | **Not built** — shown as "Coming Soon" in the app; see gap #6 |
| Org hierarchy | School → District → Charter Network, with invite codes and cascading settings | Working |

### F. Money (subscriptions & billing)

| Feature | What it does | Status |
|---|---|---|
| Stripe subscriptions | Pro ($7.99/mo) and Campus tiers via card checkout | Working |
| Bank (ACH) payments | Bank checkout with "processing" / "cleared" / "failed" emails at every step | Working (just shipped) |
| Purchase orders | Districts upload a PO; admins mark it paid to activate seats | Working |
| PayPal | Alternate checkout path | Working — worth a periodic live test |
| Marketplace / affiliate program | Rewardful / PartnerStack / Stripe Connect integrations | **Demo mode only** — see gap #4 |

### G. Administration & compliance

| Feature | What it does | Status |
|---|---|---|
| Admin dashboards | Campus, District, and System admin pages with user management | Working |
| Role system | 8-level role hierarchy enforced on the server | Working |
| Impersonation | Admins can act as a user (MFA-protected, audited) | Working |
| Audit trail | Tamper-evident log of every sensitive action, with a verification endpoint | Working |
| Privacy requests (GDPR/CCPA) | Data export and account erasure, with school records anonymized instead of deleted | Working |
| Data retention purge | Daily job deletes accounts past the 3-year retention date | Working (the trigger that *sets* the date is a known tracked item) |
| Standards ingestion admin | Upload, review, and approve ingested standards | Working |
| Content moderation queue | Flagged AI content awaits human review | Working — UI is basic; see gap #10 |

### H. Team Hub (internal HR & operations)

| Feature | What it does | Status |
|---|---|---|
| Role directory | 38 internal job roles with KPIs and SOPs, editable by admins | Working |
| Staff access gate | Joining Team Hub requires admin approval (MFA-protected) | Working |
| Onboarding tasks | Task checklists for new employees | Working |
| Quarterly OKRs module | Company goal tracking | **Placeholder only** — see gap #11 |

### I. Growth & integrations

| Feature | What it does | Status |
|---|---|---|
| HubSpot sync | Users and companies sync to the CRM | Working |
| School demo requests | "For Schools" page with a demo-request form | Working |
| Embeds & WordPress plugin | LYS tools can be embedded in outside websites | Working |
| Career data refresh | Scheduled pull from the Bureau of Labor Statistics + RSS ingestion | Working |
| Admin email digests | Scheduled summary emails to admins | Working |
| Command palette (Ctrl+K) | Jump anywhere in the app | Working |
| Dark mode, personas, role-based navigation | The app reshapes itself by who you are | Working |

---

## Part 2 — Gaps Found, in Priority Order

Priority is a blend of: paying-customer impact, student/teacher experience, and risk. **#1 is most urgent.** (Items already in the project task list or threat model are not repeated here.)

| # | Gap | Why it matters | Where |
|---|---|---|---|
| **1** | **Affiliate integrations quietly pretend to work.** When Rewardful/PartnerStack/Stripe Connect aren't configured, the system reports "success" with a fake ID instead of an error. | Anyone relying on affiliate payouts could believe partners are being tracked when nothing is happening. Silent money-related failure. | `server/services/affiliateIntegrations.ts` |
| **2** | **Scholarship scraper uses a hardcoded AI model name (`gpt-5-mini`).** If that model name is retired or wrong for the environment, scraping fails. | Students stop getting new scholarships and nobody is alerted. | `server/scholarshipScraper/scraper.ts` |
| **3** | **The "AI is down" fallback can serve a low-quality mock template** if the OpenAI keys are ever missing/misconfigured, with no loud alarm. | Paying teachers could receive obviously bad lessons and blame the product. | `server/services/fallbackResolver.ts`, `server/openai.ts` |
| **4** | **Payments code still carries "Demo Mode" notes.** Stripe/PayPal paths have leftover notes saying full environment configuration is needed to be live. Live checkout works, but the notes make it hard to know which paths are production-ready. | Revenue path clarity — a future change could accidentally flip a demo behavior on. | `server/routes/payments.ts` |
| **5** | **AI embeddings can silently switch off.** A global "disabled" flag flips if embeddings fail once, and the smart-retrieval quality features quietly stop until restart. | Lesson quality silently degrades with no visible sign. | `server/services/embeddingService.ts` |
| **6** | **Four SIS providers are visible but fake.** PowerSchool, Canvas, Infinite Campus, and Skyward appear in the integrations screen as "Coming Soon"; the server errors if tried. | Schools evaluating LYS may count on these. Decide: build, or remove from the UI until real. | `client/src/pages/SISIntegration.tsx`, `server/services/sisService.ts` |
| **7** | **"Not yet verified by LYS" labels on Be-Know-Do alignments.** Unverified curriculum alignments show this hardcoded label to users. | Teachers see an unfinished-feeling trust label on a flagship framework. Needs a verification workflow or better wording. | `server/lib/bkdAlignment.ts` |
| **8** | **Post-secondary grade levels say "Coming Soon"** in the Lesson Generator. | Limits the addressable audience; also sets expectations we should either meet or remove. | `client/src/pages/LessonGenerator.tsx` |
| **9** | **Parent Portal messaging is richer in the UI than on the server.** Some relationship checks between parent and student records are thinner than the UI implies. | Family-facing feature; should be verified end-to-end before heavy promotion. | `client/src/pages/ParentPortal.tsx` + related routes |
| **10** | **Content moderation review queue is minimal.** Flagged content goes to a queue, but the admin review screen is basic and marked for expansion. | Safety workflow bottleneck as usage grows. | `/api/admin/resource-reports` + admin UI |
| **11** | **Team Hub "Quarterly OKRs" is an empty placeholder** ("HR will populate…"). | Internal only, but looks unfinished to staff. Fill it in or hide it. | `server/seedFoundation.ts` |
| **12** | **Matriculation (school-transfer history) has a backend but no student-facing screen.** | Half-built feature; finish or park it deliberately. | `/api/admin/matriculation` |
| **13** | **Analytics are digest-emails, not dashboards.** Standards-observability reports arrive by scheduled email; there's no live dashboard. | Fine for now; worth knowing it's a limitation when selling to districts. | analytics routes + digest jobs |

---

## Part 3 — Who Should Do What

### Developer-only (touches protected areas: server code, payments, integrations, security)

In priority order:

1. **#1 Affiliate demo-mode silent success** — change fake-success to a clear "not configured" state (server code, money-adjacent).
2. **#2 Scraper model name** — make the model configurable and fail loudly (server code).
3. **#3 Mock-lesson fallback** — remove or loudly label the mock template path; add an alert when keys are missing (server code, AI path).
4. **#4 Payments "Demo Mode" notes** — audit and clean up so live vs. demo paths are unmistakable (payments).
5. **#5 Embeddings silent-off flag** — surface it (log/alert/health check) and auto-retry (server code).
6. **#6 SIS providers** — either build the next provider or remove the "Coming Soon" entries server-side (integrations).
7. **#9 Parent Portal server checks** — verify/tighten parent↔student authorization (auth/permissions).
8. **#10 Moderation queue expansion** — backend + admin UI (server code).
9. **#12 Matriculation** — decide to finish (needs backend + frontend) or remove the dangling endpoint (server code).

> Reminder: every one of these requires the guardrail pause (developer confirmation) before work starts, per `replit.md`.

### Any team member (visual/text changes in the app's frontend, or pure content)

In priority order:

1. **#7 "Not yet verified by LYS" wording** — the *label text* can be softened by anyone (e.g., "Alignment under review"); building an actual verification workflow would be developer work.
2. **#8 Post-secondary "Coming Soon"** — if the decision is to hide it rather than build it, removing the menu entry is a frontend text/option change.
3. **#6 (UI half) SIS "Coming Soon" tiles** — hiding the four fake providers from the integrations screen is a frontend-only change (the server half stays developer work).
4. **#11 Team Hub OKRs content** — writing the actual OKR content is a content task for HR/leadership; an admin can enter it through the Team Hub editing screens.
5. **#13 Analytics expectations** — until dashboards exist, updating sales/marketing copy to describe "weekly emailed reports" accurately is a content task.

---

*Prepared automatically from a full scan of the codebase (frontend pages, backend routes, and services). Items already tracked in the project task list or `threat_model.md` were intentionally left out.*
