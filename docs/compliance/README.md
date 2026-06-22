# LYS Compliance Pack

This folder holds the **buyer-facing compliance and security documentation** for
the LYS Educational Platform. It is written to support — not replace — formal
attestations (SOC 2 Type II, VPAT/Section 508, signed NDPA/state DPAs). Those
require third-party auditors and signatures; what we maintain here is the
evidence, control mapping, and templates that make those processes faster.

> Audience: school/district procurement, IT security reviewers, and parents who
> ask "is my child's data safe?"

## Contents

| Doc | Purpose | Status |
| --- | --- | --- |
| [`security-overview.md`](./security-overview.md) | Maps our live technical controls to SOC 2 Trust Services Criteria. | Evidence ready; audit not yet engaged |
| [`subprocessors.md`](./subprocessors.md) | List of third parties that may process customer data, required for any DPA/NDPA. | Maintained |
| [`data-processing-addendum.md`](./data-processing-addendum.md) | Template DPA / NDPA exhibit a customer can sign. | Template — legal review required before signing |
| [`accessibility-vpat.md`](./accessibility-vpat.md) | VPAT 2.x scaffold + current WCAG 2.1 AA self-assessment. | Self-assessment; independent audit recommended |
| [`ai-safety.md`](./ai-safety.md) | How student-facing AI is moderated (CIPA + crisis handling). | Live |

## How to use this for a deal

1. **Direct teachers / parents / homeschoolers (current first market):**
   `security-overview.md` + `ai-safety.md` + the public privacy policy are
   normally sufficient. No signed DPA is typically required for an individual.
2. **Single school / campus or charter network (next market):** expect to sign
   the DPA (`data-processing-addendum.md`) and share `subprocessors.md`. Many
   states require the NDPA (National Data Privacy Agreement) — the DPA template
   is structured to map onto it.
3. **Full district RFP (later):** you will additionally need the *signed* SOC 2
   report, a third-party VPAT, and state-specific DPA exhibits. Engage an auditor
   (SOC 2) and an accessibility firm (VPAT); this pack is the input that shortens
   that work.

## What is and is not a code task

- **Code/docs we control (in this repo):** technical controls, the control-to-SOC2
  mapping, subprocessor inventory, DPA/VPAT templates, AI safety. These are kept
  current here.
- **Business/legal tasks (not code):** engaging a SOC 2 auditor, obtaining a
  signed report, an independent VPAT audit, and executing DPAs with each customer.
  Track those outside the repo.
