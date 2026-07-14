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
