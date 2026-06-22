# Subprocessors

A "subprocessor" is any third party that may process customer or student data on
LYS's behalf. This list must be shared with customers under most DPAs/NDPAs and
kept current. Update it whenever a vendor is added or removed.

> Customers on a signed DPA are entitled to advance notice of new subprocessors.

| Subprocessor | Purpose | Data categories processed | Region |
| --- | --- | --- | --- |
| Replit (Deployment & Hosting) | Application hosting, PostgreSQL database, secrets management, TLS. | All application data at rest and in transit. | US |
| OpenAI | AI generation (lessons, assignments, practice, plans), embeddings, content moderation. | Free-text prompts **after** PII stripping + content-safety moderation. No raw student PII is sent. | US |
| Stripe | Subscription billing and payment processing. | Billing contact + payment data (held by Stripe; card data never touches LYS servers). | US |
| HubSpot | CRM / marketing for prospect and lead management. | Business/lead contact info (name, email, org). Not student records. | US |
| Clever | SIS roster synchronization (where a school enables it). | Roster data (student/teacher names, school, section) per the school's Clever config. | US |
| Email delivery (transactional) | Account, consent, and notification emails. | Recipient email address + message content. | US |

## Notes

- **PII boundary to OpenAI:** free-text is sanitized by `server/services/piiSanitizer.ts`
  and moderated by `server/services/contentSafety.ts` before any model call.
  Structured student identifiers are not included in prompts.
- **Payment data:** card details are tokenized by Stripe and never stored by LYS.
- **Disabled-by-default integrations:** SIS sync (Clever) only processes data for
  schools that explicitly connect it.

## Maintenance

When adding a vendor: add a row above, confirm a DPA exists with that vendor,
and notify customers under active DPAs per the notice period in their agreement.
