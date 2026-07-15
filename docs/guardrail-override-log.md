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
