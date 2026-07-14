# LYS Workflow Knowledge Base

A plain-language reference for how the platform's key workflows behave — what users should expect, and what admins/developers should expect behind the scenes. Organized by area. Keep this document updated as workflows change; the PDF is regenerated from this file with `npx tsx scripts/generate-workflow-kb-pdf.ts`.

Last updated: July 14, 2026

## 1. Billing

### 1.1 Paying by card (Stripe)

**Who it's for:** Individual educators and schools upgrading to Pro or Campus.

**What the user experiences:**

- On the Pricing page, they click the upgrade button for Pro or Campus.
- A checkout dialog opens; they pick "Credit / Debit Card" and authorize billing.
- They are sent to Stripe's secure checkout page to enter card details.
- On success, they are returned to the app and the plan is active immediately — no waiting, no manual steps.
- Stripe emails them a receipt automatically.

**What admins/devs should expect:**

- Nothing manual. Stripe notifies the server (webhook) and the account upgrades automatically.
- The payment appears in the Stripe dashboard alongside all other card payments (refunds, receipts, and reporting live there).
- If a payment fails, the plan simply does not activate — there is no partial state to clean up.

### 1.2 Paying by purchase order (PO)

**Who it's for:** Schools and districts that pay through an institutional purchasing process (Pro or Campus tiers).

**What the user experiences:**

- In the checkout dialog they pick "Purchase Order" and fill in: PO number, organization name, contact name, contact email, and optional notes.
- The form checks the entries before submitting (bad or missing fields show a clear red message under the field).
- On success, their account is provisioned immediately and marked "PO pending" — they can start using the plan right away while the invoice is processed.

**What admins/devs should expect:**

- A notification email goes to the central sales inbox: info@ladderingyoursuccess.com (this can be overridden with the PO_NOTIFY_EMAIL or PLATFORM_OWNER_EMAIL setting).
- The PO appears in the admin area under Billing > Purchase Orders.
- An admin must manually mark the PO as paid once the invoice clears. Until then the account stays in the "PO pending" state.

### 1.3 Paying by bank transfer / ACH

**Current status: placeholder only — not a working payment path yet.**

**What the user experiences today:**

- In the checkout dialog they can pick "Bank Transfer / ACH" and enter an organization name and contact email.
- The screen then shows a reference number and generic instructions — but no real bank account details.

**What admins/devs should expect today:**

- Nothing is recorded, no email is sent, and the plan does NOT activate. There is no follow-up process.
- Recommendation: steer bank-transfer requests to the purchase-order flow (which works end to end) until the real version ships.

**Planned upgrade:** Task #62 (Stripe bank transfer / ACH payments) is queued. Once built, bank payments will run through the same Stripe checkout as cards: the customer gets official Stripe payment instructions, the money clears in about 4 business days, and the plan activates automatically via webhook — with pending/failed states handled properly.

### 1.4 Enterprise (districts, charter networks, multi-site orgs)

**Who it's for:** ISDs, charter management organizations, and any multi-campus network.

**What the user experiences:**

- The Pricing page shows an enterprise cost estimator (base price + per-seat + per-campus) so they can see an estimate before talking to anyone.
- Clicking "Contact Sales" (on the enterprise tier card or at the bottom of the page) opens an email to info@ladderingyoursuccess.com.
- From there, pricing and payment are worked out directly with the LYS team — typically ending in a purchase order or invoice rather than self-serve checkout.

**What admins/devs should expect:**

- Enterprise inquiries arrive as plain email at info@ladderingyoursuccess.com — there is no in-app queue for them.
- If the deal closes via purchase order, the standard PO workflow above applies (provision, PO-pending, mark paid).

### 1.5 Billing quick-reference table

| Method | Plan activates | Admin action needed | Where money is tracked |
| --- | --- | --- | --- |
| Card (Stripe) | Instantly | None | Stripe dashboard |
| Purchase order | Instantly (PO pending) | Mark paid when invoice clears | Admin > Billing > Purchase Orders |
| Bank transfer / ACH | Not yet (placeholder) | N/A — steer to PO for now | Nowhere yet (Task #62 planned) |
| Enterprise | After deal closes | Handle inquiry by email; then PO flow | Email + PO flow |
