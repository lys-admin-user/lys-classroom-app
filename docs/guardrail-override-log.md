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
