# Guardrail Override Log

A running record of every time the "check with your developer" pause was
overridden and protected-area work went ahead. Newest entries at the top.

Each entry records: when it happened, what was asked, which protected area it
touched, how the person proceeded past the pause, what was actually changed,
and where to look to undo it.

> This log is itself part of the protected guardrail material — entries are
> appended by the agent only. Do not edit or delete past entries.

---

## Entry template

```
## [YYYY-MM-DD HH:MM] — <short title of the change>
- **Requested by:** (how they proceeded: confirmed they are the developer / said developer signed off / chose to proceed anyway)
- **Request (their words):** "..."
- **Protected area(s):** payments · database schema · server code · auth · roles · config · feature flags
- **What was changed:** files/features actually touched
- **Rollback:** checkpoint created after the work (see the checkpoint list in Replit)
```

---

## [2026-07-21] — Campus layer: grading systems, grade weight on assignments, student drill-down in gradebook
- **Requested by:** confirmed developer ("Yes, proceed")
- **Request (their words):** "Campus layer — Gradebook: click student name for individual view + teacher notes; grading scale selector (top 10 international); assignment grade type (major/minor/other) with customizable weights. Schema + server changes required."
- **Protected area(s):** database schema · server code
- **What was changed:** shared/schema.ts (gradeWeight on assignments, classGradingSettings table), server/routes/classroom.ts (grading settings endpoints), client/src/pages/Gradebook.tsx (student drill-down, grading system UI), client/src/pages/Assignments.tsx (grade type selector)
- **Outcome:** IN PROGRESS
- **Rollback:** checkpoint before this work (d52da21)

## [2026-07-18 04:20] — Update stale gpt-4o-mini comments to gpt-5-mini (Task: upgrade from gpt-4o to gpt-5)
- **Requested by:** confirmed developer ("Yes, proceed")
- **Request (their words):** Task #36 — "Switch this app from the gpt-4o model to gpt-5."
- **Protected area(s):** server code (`server/services/voiceCriticService.ts`, `server/scholarshipScraper/discoverUrls.ts`)
- **What was changed:** All LLM API call sites already used gpt-5/gpt-5-mini. Only stale comments referencing gpt-4o-mini were updated in two server files. No logic or call-site changes.
- **Rollback:** checkpoint created after this work (see checkpoint list in Replit)
- **Outcome:** COMPLETED — typecheck and tests pass; app redeployed.

## [2026-07-18 04:05] — Clear stored curriculum file bytes on delete (Task: free up database space)
- **Requested by:** confirmed developer via pause prompt ("Yes, proceed")
- **Request (their words):** Task #29 — "Free up database space when curriculum files are deleted."
- **Protected area(s):** server code (`server/services/curriculumLibrary.ts`, `server/index.ts`)
- **What was changed:** `deleteCurriculumDocument` now sets `originalFileBytes` to NULL when soft-deleting (audit detail records `originalFileCleared: true`). Added `sweepArchivedCurriculumFileBytes()` — a data-only maintenance sweep that nulls stored blobs on already-archived documents — wired into the existing daily retention scheduler in `server/index.ts` so production reclaims space from previously deleted docs. No schema, auth, or route changes; moderation viewer's existing 404/`hasOriginal === false` path handles deleted docs.
- **Rollback:** checkpoint created after this work (see checkpoint list in Replit)
- **Outcome:** COMPLETED — typecheck clean, 244 tests passing; sweep verified end-to-end against the dev database (test row's bytes cleared, then removed).

## [2026-07-18 03:47] — Show verifier name in standards source popover (Task: show who confirmed a standard's source)
- **Requested by:** confirmed developer via pause prompt ("Yes, proceed")
- **Request (their words):** Task #23 — "Show teachers who confirmed a standard's source, not just when."
- **Protected area(s):** server code (`server/services/standardsCatalog.ts`)
- **What was changed:** `standardsCatalog.ts` now resolves the verifier's display name from `lastVerifiedBy` (set-level wins over jurisdiction-level, matching the timestamp precedence) and returns it as `lastVerifiedByName` on CatalogCode. `client/src/components/StandardsCascadePicker.tsx` popover shows "Verified by <name> on <date>". Read-only addition — no auth, schema, or write-path changes.
- **Rollback:** checkpoint created after this work (see checkpoint list in Replit)
- **Outcome:** COMPLETED — typecheck clean, full test suite passing (244 tests).

## [2026-07-17 16:10] — Add temporary debug logging to MFA disable endpoint
- **Requested by:** confirmed developer ("Yes, I'm the developer — add the debug logging")
- **Request (their words):** Recovery codes don't work to disable 2FA — "Invalid code. Please try again." DB shows codes are stored, hashing logic is correct, need to see what userId/token the endpoint actually receives at runtime.
- **Protected area(s):** server code (`server/routes/mfa.ts`, `server/services/recoveryCodeService.ts`)
- **What was changed:** Added `console.log` statements in `verifyRecoveryCode` (userId, normalized code, hash, updated row count) and in the `/api/mfa/disable` handler (userId, token, user lookup result, totpOk, recoveryOk). All logging is temporary for diagnosis — to be removed once root cause is found.
- **Rollback:** checkpoint before this change: 672f42c85d1bf02263221e0139fd5e9b98eed808
- **Outcome:** RESOLVED. Root cause was user error — the 3 previous failed attempts used the TOTP authenticator code, not a recovery code. After being prompted to use an actual recovery code, it succeeded immediately. The recovery code logic, hashing, and DB path are all correct. Debug logging removed (token value was temporarily logged — no long-term exposure). Checkpoint after cleanup: see next checkpoint.

## [2026-07-17 15:45] — MFA disable endpoint: accept recovery codes as a valid factor
- **Requested by:** confirmed they are the developer ("Yes, I'm the developer — go ahead")
- **Request (their words):** "let's revisit that disable 2fa issue" — specifically: when a user loses access to their authenticator app, they need a way to disable 2FA using a recovery code; currently the disable endpoint only accepts TOTP codes
- **Protected area(s):** server code (`server/routes/mfa.ts`)
- **What was changed:** `server/routes/mfa.ts` — `/api/mfa/disable` now also accepts a recovery code (via `verifyRecoveryCode`) if the TOTP check fails; `client/src/components/MfaSettingsCard.tsx` — UI label, placeholder, and helper text updated to tell users recovery codes are accepted
- **Outcome:** Both TOTP codes and recovery codes now work in the disable form; recovery code is consumed (single-use) on success; audit log updated to record which factor was used
- **Rollback:** checkpoint `8f7ab71` (before server edit)

---

## [2026-07-17 04:55] — Trial-binding bug fix: auto-bind network trials to new accounts + honest trial banner
- **Requested by:** confirmed they are the developer / chose to proceed ("Go ahead with the recommendations that you put forth. I like them.")
- **Request (their words):** "if a homeschool parent is attempting to use the signup wizard, they are hitting the limit of 5 free. That should not be the case. Tell me what you find and recommend a few courses of action." — approved recommendations 1+2: auto-bind the network's unclaimed trial to the signed-in user, and only show the trial banner as active when the trial actually belongs to that user
- **Protected area(s):** server code (trial/billing logic in `server/routes/payments.ts`, `server/routes/lessons.ts`, `server/storage/payments.ts`)
- **What was changed:** (1) New storage method `getOrBindActiveTrialForUser` (`server/storage/payments.ts`, declared in `server/storage/_base.ts`): returns the signed-in user's own active trial, or atomically claims an active trial started as a guest on the same network/device (IP or browser fingerprint) — the claim only succeeds if the trial is still unbound (`userId IS NULL` guard in the UPDATE), so a trial already belonging to another account can never be re-bound, even under concurrent requests. (2) All three lesson-quota checks in `server/routes/lessons.ts` (`/api/lessons/usage`, `/api/lessons/generate`, `/api/lessons/generate-stream`) now use it with the request IP + a new `X-Trial-Fingerprint` header, so a parent who started a trial before signing up gets unlimited trial lessons instead of hitting the 5-free limit. (3) `/api/trial/status` (`server/routes/payments.ts`): logged-in users now only see "trial active" when the trial is actually theirs (or claimable — which claims it); previously the banner matched by IP/fingerprint even when the trial belonged to someone else, showing "Trial Active" while the 5-lesson limit was still enforced. (4) Client: fingerprint extracted to `client/src/lib/fingerprint.ts` and sent as `X-Trial-Fingerprint` on API requests (`queryClient.ts`, `streamGeneration.ts`, `use-trial.ts`) so binding works even across networks. Verified: typecheck clean, 244/244 tests pass, independent review's two findings (atomic claim, fingerprint pass-through) fixed.
- **Rollback:** the checkpoint created at the end of this change (July 17, 2026)

## [2026-07-17 03:40] — Student signup rework: pre-signup mini-quiz + streamlined wizard + full removal of the Practice feature
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Request (their words):** "Let's improve the student signup wizard experience" · "I want to get rid of the student practice feature. We should remove it all together. But we need to highlight a feature that students would use to encourage signup" · "Is there a way we can ask 2-3 questions to find out their pain points so that we can integrate the needs analyzer to find out exactly what their need is?" — approved plan: public student pain-point quiz before signup (with lead capture), grade + state collected for students, streamlined 2-step student wizard, complete removal of practice (page, backend, links)
- **Protected area(s):** server code (new student quiz routes, practice route removal, onboarding changes) · database schema (new student signup responses table)
- **What was changed:** (1) Practice feature fully removed — `/practice` page, `server/routes/practice.ts`, `server/practiceGenerator.ts`, practice schemas, links, and docs references all deleted. (2) New public student pain-point quiz at `/student-signup` (`client/src/pages/StudentSignupQuiz.tsx`, `client/src/lib/studentSignup.ts`) with email lead capture; new `student_signup_responses` table; routes in `server/routes/studentSignup.ts` (anonymous submit with captcha + 20/hour rate limit, server-side pain-point→feature mapping, authed `/bind` first-writer-wins). (3) Streamlined 2-step student onboarding in `client/src/pages/Onboarding.tsx` (quiz answers prefill grade/state/goal; grade + goal collected inline on the final step; post-onboarding redirect to the matched feature). (4) "Picked for you" spotlight card on the student home (`client/src/pages/StudentDashboard.tsx`, self view only). Verified: typecheck clean, 244/244 tests pass, endpoints smoke-tested, quiz page renders.
- **Rollback:** the checkpoint created at the end of this change (July 17, 2026)

## [2026-07-17 03:20] — Turnstile on 3 remaining public forms + full user-role tally in System Admin
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Request (their words):** "We can do both....what exactly is the Turstile check that exisit and if that exists, why does it need the key" (approving: wiring Turnstile into the teacher quiz, needs analyzer, and trial starter; plus Task: "Full user role tally in System Admin")
- **Protected area(s):** server code (captcha middleware on 3 public endpoints · admin analytics endpoint role breakdown)
- **What was changed:** (1) Turnstile bot-check wired into the three remaining public forms: teacher pre-signup quiz (`/api/teacher-signup/submit` + widget on the quiz's email step), needs analyzer (`/api/needs-analyzer/submit` + widget on the final question), and trial starter (`/api/trial/start` — captcha applies to anonymous requests only, because logged-in users get their trial auto-started right after signup and a captcha there would silently break it; the trial banner/card also show the widget to visitors who aren't logged in so an anonymous manual start keeps working once keys are set). Like the other wired forms, the check stays dormant until the Turnstile keys are added. (2) System Admin "By Role" card now tallies ALL 8 platform roles (was only 3) plus an "Other" row for unexpected values; counts verified to sum to the user total. Files: `server/routes/teacherSignup.ts`, `server/routes/lessons.ts`, `server/routes/payments.ts`, `server/routes/admin.ts`, `client/src/pages/TeacherSignupQuiz.tsx`, `client/src/components/NeedsAnalyzer.tsx`, `client/src/pages/SystemAdmin.tsx`. Typecheck clean, 244/244 tests pass, all three endpoints smoke-tested, admin tally verified against the live database.
- **Rollback:** the checkpoint created at the end of this change (July 17, 2026)

## [2026-07-16 05:15] — Teacher pre-signup needs flow + Signup Insights admin page
- **Requested by:** chose to proceed after a risk rundown (via the guardrail pause prompt)
- **Request (their words):** "Between the public landing page and the signup process, each user type needs to see the functions or features that are most valuable to them... look at ways to better blend the needs analyzer with the sign up process to reduce redundancy and improve the process." (starting with teachers/educators per their choice)
- **Protected area(s):** server code (new routes/storage) · database schema (one new table for pre-signup answers) · admin pages (new read-only Signup Insights page)
- **What was changed:** New anonymous teacher pre-signup quiz at `/teacher-signup` (3 optional questions + optional email, fully skippable) shown when a visitor picks "Teacher" on the landing page or the needs analyzer; answers prefill onboarding and the lesson generator and drive a personalized pain-point callout during/after lesson generation. Database: one new table `teacher_signup_responses` (schema pushed). Server: `server/routes/teacherSignup.ts` — anonymous submit (rate-limited 20/hr per IP, session-keyed upsert), authed bind-on-signup (first-writer-wins so conversions can't be re-attributed), and a site_admin-only `/api/admin/signup-insights` aggregate endpoint. Client: `TeacherSignupQuiz.tsx`, `client/src/lib/teacherSignup.ts`, prefill hooks in `Onboarding.tsx` + `LessonGenerator.tsx`, `personalNote` prop on `GenerationCountdown`, admin `SignupInsights.tsx` page + sidebar entry. No existing payments/auth/roles behavior changed. Typecheck clean, 244/244 tests pass, endpoints smoke-tested, independent review passed (its two hardening suggestions — rate limit + bind ownership guard — were applied).
- **Rollback:** the checkpoint created right after this change (look for the teacher pre-signup quiz entry in the checkpoint list).

## [2026-07-15 21:30] — Remove expired "offer ends June 30, 2026" promo text on pricing page
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Request (their words):** Task: "Remove the expired 'offer ends June 30, 2026' promo text on the pricing page"
- **Protected area(s):** payments/pricing (display only — no prices, checkout, or Stripe amounts changed)
- **What was changed:** Removed the expired Pro-plan promo block from `client/src/pages/Pricing.tsx` — the struck-through $19 "regular" price, the "Limited time" badge, and the "Promo ends Jun 30, 2026" note. The Pro card now shows its normal price ($7.99/month) the same way the other plans do, including the country-discount display when applicable. No prices, checkout amounts, or server code were touched; typecheck passes and the pricing page renders without errors.
- **Rollback:** the checkpoint created right after this change (look for the expired-promo-removal entry in the checkpoint list).

## [2026-07-15 21:05] — "Payment is processing" email right after bank checkout
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** payments · server code (Stripe webhook / checkout + outbound email)
- **Request (their words):** Task: "Send a 'payment is processing' email right after bank checkout"
- **What was changed:** Extended `server/services/achPaymentEmails.ts` with a "processing" email: "we received your order — your bank payment is processing (about 4 business days), your plan is already active, and we'll email you when it clears (or if anything goes wrong)". Sent from BOTH places an ACH checkout can land in payment-pending — the Stripe webhook (`server/webhookHandlers.ts`) and the browser return page (`server/routes/verifyCheckoutHandler.ts`, wired in `server/routes/payments.ts`) — but with a database-level dedupe so whichever path provisions first sends exactly ONE email; replays/duplicates send nothing, and email problems can never break payment processing or the checkout page. Covered by 7 new/updated tests; full suite 244/244 pass, typecheck clean, independent review passed (initial review caught a race where no email could be sent — fixed as described). Also hardened one flaky banner test.
- **Rollback:** the checkpoint created right after this change (look for the ACH "payment processing" email entry in the checkpoint list).

## [2026-07-15 20:55] — Emails when a bank (ACH) payment clears or fails
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** payments · server code (Stripe webhook + outbound email)
- **Request (their words):** Task: "Tell customers by email when their bank payment clears or fails"
- **What was changed:** New `server/services/achPaymentEmails.ts` builds and sends plain-language outcome emails through the existing email transport (Resend key first): a "your bank payment cleared — your plan is now active" notice on success, and a "your bank payment didn't go through — your plan was reverted to free" notice on failure with a link to /pricing to retry or pay by card. Wired into the Stripe webhook (`server/webhookHandlers.ts`) so an email goes out only when the account state actually changed — skipped replays/duplicates send nothing — and email problems can never break payment processing. Unknown plan names from Stripe metadata are never echoed into customer copy. Covered by 9 new/updated tests; full suite 240/240 pass, typecheck clean, independent review passed.
- **Rollback:** the checkpoint created right after this change (look for the ACH outcome-email entry in the checkpoint list).

## [2026-07-15 20:30] — Automated tests for the "bank payment processing" banner
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** packages/dependencies (test-only libraries) · config file (`vitest.config.ts`)
- **Request (their words):** Task: "Confirm the 'bank payment processing' banner shows and clears correctly"
- **What was changed:** Test-only work — no app behavior changed. Installed three test-only development packages (`@testing-library/react`, `@testing-library/user-event`, `jsdom`) and updated `vitest.config.ts` so browser-style component tests can run (client test files included, jsdom environment for `client/**`, `@` import alias, automatic JSX). Added `client/src/components/PaymentPendingBanner.test.tsx` with 8 tests locking in the banner's behavior: shows while a bank payment is pending (naming the plan), hidden for active/no-status/anonymous users, disappears automatically when the status flips to active, dismiss hides it for the session (`sessionStorage` flag) and it returns in a fresh session while still pending. Full suite 234/234 pass, typecheck clean, independent review passed.
- **Rollback:** the checkpoint created right after this change (look for the payment-banner tests entry in the checkpoint list).

## [2026-07-15 19:55] — "Bank payment processing" banner while ACH payment clears
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** payments/billing (subscription-status display; client-only visual work)
- **Request (their words):** Task: "Show customers a clear 'bank payment processing' banner until their payment clears"
- **What was changed:** Added `client/src/components/PaymentPendingBanner.tsx` and wired it into the app shell (`client/src/App.tsx`, above the trial banner). Signed-in users whose subscription status is `payment_pending` (bank/ACH payment still clearing) now see a persistent banner explaining the payment usually takes about 4 business days and their plan unlocks automatically. It can be dismissed for the current browser session but returns on the next visit while still pending, and it checks the account status every minute so it disappears on its own once the Stripe webhook flips the status to active. Client-only visual work — no server, payment-rule, or schema changes. Typecheck clean, independent review passed.
- **Rollback:** the checkpoint created right after this change (look for the payment-pending banner entry in the checkpoint list).

## [2026-07-14 18:25] — Accurate payment audit records (skip-aware webhook auditing)
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** payments · server code (Stripe webhook auditing)
- **Request (their words):** Task: "Stop payment audit records from claiming changes that never happened"
- **What was changed:** The Stripe webhook (`server/webhookHandlers.ts`) now checks how many database rows each guarded update actually changed. When a webhook event was correctly skipped (a replay or out-of-order delivery that matched zero rows), the audit trail no longer records a state change (`billing.ach_payment_succeeded` / `billing.ach_payment_failed` / `billing.checkout_completed_provisioned`); instead it records a distinct `billing.webhook_skipped_idempotent` event (with the intended action and context) so real-world delivery anomalies stay visible without overstating changes. No change to the payment rules themselves or the SQL guards. 3 new tests in `server/__tests__/payment-wiring.test.ts` (226/226 pass), typecheck clean, independent review passed.
- **Rollback:** the checkpoint created right after this change (look for the skip-aware webhook auditing entry in the checkpoint list).

## [2026-07-14 17:55] — Wiring-parity tests for payment webhook + checkout verification
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** payments · server code (test coverage around Stripe webhook + verify-checkout)
- **Request (their words):** Task: "Confirm webhook and checkout wiring can't silently drift from the tested rules"
- **What was changed:** Added automated "wiring parity" tests so the payment webhook and checkout verification can never quietly drift from the safety rules that are unit tested. The verify-checkout logic was moved unchanged from `server/routes/payments.ts` into `server/routes/verifyCheckoutHandler.ts` (dependency-injected so tests exercise the REAL handler, not a copy). New test suite `server/__tests__/payment-wiring.test.ts` (13 tests, no live database): renders the webhook's actual SQL update filters and compares them to reference twins of the policy rules (`canApplyAsyncPaymentToUser`, `canActivateFromAsyncSuccess`, `canProvisionFromCompletedCheckout`), and confirms verify-checkout maps a session belonging to someone else to 403 and incomplete/invalid sessions to 400, provisioning active vs payment-pending correctly. No behavior change to payments; 223/223 tests pass, typecheck clean; independent review passed.
- **Rollback:** the checkpoint created right after this change (look for the payment wiring-parity tests entry in the checkpoint list).

## [2026-07-14 17:20] — Provision bank payments from Stripe webhook (no-return safety net)
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** payments · server code (Stripe webhook + billing policy)
- **Request (their words):** Task: "Make sure a bank payment still activates even if the customer never returns to the site"
- **What was changed:** The Stripe webhook now provisions a plan when a checkout completes, so a customer who pays but never returns to the site still gets their subscription. New decision logic in `server/services/achPaymentPolicy.ts` (`evaluateCheckoutCompletedEvent` — reuses the same completion/tier rules as verify-checkout; `canProvisionFromCompletedCheckout` — idempotency rule) and a new `checkout.session.completed` branch in `server/webhookHandlers.ts` (ACH provisions as payment_pending, card as active; skips rows already carrying the same subscription id so an already-activated ACH payment is never regressed back to pending; audit event `billing.checkout_completed_provisioned`). verify-checkout is unchanged and remains idempotent with this path. After an independent review round, two hardening fixes were added: (1) out-of-order webhook delivery — an ACH "payment succeeded" event that arrives before the "checkout completed" event now fully provisions and activates the plan itself (only when the account has no subscription yet and the event carries a valid pro/campus tier; `canActivateFromAsyncSuccess`/`isCheckoutTier`); (2) a stale replayed "checkout completed" event can never overwrite an account that is already ACTIVE on a different subscription. 16 new tests (210/210 pass), typecheck clean.
- **Rollback:** the checkpoint created right after this change (look for the webhook no-return provisioning entry in the checkpoint list).

## [2026-07-14 15:45] — Automated safety tests for ACH bank-payment code
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Protected area(s):** server code (new test files in `server/__tests__/` only — no app behavior changes)
- **Request (their words):** Task: "Catch broken bank-payment activation before it affects real customers" (automated tests for the ACH webhook + checkout-verification code)
- **What was changed:** Added 19 automated safety tests for the ACH bank-payment lifecycle (`server/__tests__/ach-payment-policy.test.ts`). To make the safety-critical branches testable without a live database, the decision logic was extracted into a new pure module `server/services/achPaymentPolicy.ts` and the existing code now calls it — `server/webhookHandlers.ts` (which events count, stale-event correlation) and the verify-checkout endpoint in `server/routes/payments.ts` (session ownership, completion, tier validity, pending-vs-paid). Behavior is unchanged; the tests lock in: success activates only the matching pending payment, failure reverts only the matching one, stale/mismatched subscription ids are ignored, and someone else's checkout session can never upgrade your account. Typecheck clean; 194/194 tests pass (was 175).
- **Rollback:** the checkpoint created right after this change (look for the ACH safety tests entry in the checkpoint list).

## [2026-07-14 15:30] — Real ACH Direct Debit bank payments via Stripe
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt; chose ACH Direct Debit only)
- **Request (their words):** Set up real bank transfer / ACH payments through Stripe for subscriptions (Task: "Stripe bank transfer / ACH payments")
- **Protected area(s):** payments/billing (Stripe checkout + webhooks) · server code
- **What was changed:** Bank payments are now real ACH Direct Debit through Stripe checkout (the old placeholder "get transfer instructions" screen and its fake bank details are gone). Server: `server/routes/payments.ts` — create-checkout-session accepts a payment method (card or US bank account) and the placeholder `/api/bank-transfer/request` endpoint was removed; verify-checkout provisions the plan as "payment_pending" while the debit clears (~4 business days); `server/webhookHandlers.ts` — Stripe's async-payment webhooks flip payment_pending accounts to active on success or revert them to the free tier on failure, with audit-log entries for both. Client: `client/src/pages/Pricing.tsx` — "Bank Account (ACH)" option now routes through Stripe checkout with its own bank-debit authorization checkbox and a pending notice on return. Docs updated (`docs/workflow-knowledge-base.md` §1.3 + regenerated PDF). Typecheck clean, 175/175 tests pass. Note: ACH Direct Debit must be enabled once in the Stripe dashboard (Settings > Payment methods).
- **Rollback:** the checkpoint created right after this change (look for the ACH / bank payments entry in the checkpoint list).

## [2026-07-14 14:35] — Clerk development keys for preview-pane login
- **Requested by:** confirmed they are the developer (chose to proceed after the protected-area explanation)
- **Request (their words):** "Sure, lets roll with this option" (use Clerk development-instance keys so login works in the Replit preview pane)
- **Protected area(s):** authentication (Clerk key selection) · secrets/env vars (new dev-only Clerk keys)
- **What was changed:** The preview workspace now uses Clerk's development-instance keys so login works on the Replit preview domain (production keys are domain-locked to lyslessonplanning.com and showed a blank login screen in preview). Two new secrets were added by the developer (`CLERK_SECRET_KEY_DEV`, `VITE_CLERK_PUBLISHABLE_KEY_DEV`); `server/bootstrap-env.ts` bridges them over the regular Clerk vars in development only, and `client/src/main.tsx` prefers the dev publishable key in dev builds only. The live site and its production keys are untouched — publishing works the same as before. Verified: preview sign-in page renders with Clerk "Development mode" badge; typecheck clean; 175/175 tests pass.
- **Rollback:** the checkpoint created right after this change (look for the Clerk development keys entry in the checkpoint list); removing the two _DEV secrets also fully reverts the behavior.

## [2026-07-14 03:45] — Purchase-order notifications sent to one central email
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Request (their words):** "Do you think it should just be one centralized email? I was thinking info@ladderingyoursuccess.com also this should be the email contact contact sales button on the enterprise tier"
- **Protected area(s):** server code · payments/billing (PO notification recipients)
- **What was changed:** Purchase-order notification emails now go to ONE centralized inbox, info@ladderingyoursuccess.com, instead of being sent to every site/system admin (`server/routes/payments.ts`; the PO_NOTIFY_EMAIL / PLATFORM_OWNER_EMAIL env override still takes priority if set). Also (cosmetic): the enterprise-tier "Contact Sales" button and the bottom-of-page Contact Sales button on the pricing page now open an email to info@ladderingyoursuccess.com (`client/src/pages/Pricing.tsx`). Typecheck clean, 175/175 tests pass.
- **Rollback:** the checkpoint created right after this change (see the checkpoint list — "centralized purchase order email" entry).

## [2026-07-14 02:05] — Pro plan price reverted to $7.99/month
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Request (their words):** "I actually want to change it back to what it was before"
- **Protected area(s):** payments/billing (Stripe checkout amount + pricing constants)
- **What was changed:** Pro plan price reverted from $99 back to $7.99/month in all the same places as the previous entry — Stripe checkout amount (`server/routes/payments.ts`, back to 799 cents), pricing constants (`shared/pricing.ts` PLAN_PRICES.pro back to 7.99 + PRO_REGULAR_PRICE back to 19, `shared/schema.ts` BASE_PRICES_USD.pro), org billing display (`server/routes/org.ts`), and admin MRR estimate (`server/routes/admin.ts`). Typecheck + full test suite pass.
- **Rollback:** the checkpoint created right after this change ("reverted to $7.99" in the checkpoint list) — though rolling this one back would re-apply the $99 price.

## [2026-07-14 01:40] — Pro plan price changed to $99/month
- **Requested by:** confirmed they are the developer (via the guardrail pause prompt)
- **Request (their words):** "Change the price of the Pro plan to $99"
- **Protected area(s):** payments/billing (Stripe checkout amount + pricing constants)
- **What was changed:** Pro plan price updated from $7.99 to $99/month everywhere it is defined — Stripe checkout amount (`server/routes/payments.ts`, now 9900 cents), pricing constants (`shared/pricing.ts` PLAN_PRICES.pro + PRO_REGULAR_PRICE, `shared/schema.ts` BASE_PRICES_USD.pro), org billing display (`server/routes/org.ts`), and admin MRR estimate (`server/routes/admin.ts`). Typecheck + full test suite (164 tests) pass.
- **Rollback:** the checkpoint created right after this change ("Pro plan price" in the checkpoint list) — roll back to the one just before it to undo.

## [2026-07-14 01:20] — Test entry (email notification setup)
- **Requested by:** the developer (bayo@maskil.dev) — this is a system test, not a real override
- **Request (their words):** "Can you send each log entry that happens to bayo@maskil.dev?"
- **Protected area(s):** none — verification of the notification pipeline only
- **What was changed:** added `scripts/send-guardrail-override-email.ts` and the mandatory email step in the guardrails
- **Rollback:** n/a (test entry)
