# Data Processing Addendum (DPA) — Template

> **This is a template, not legal advice.** Have counsel review and adapt before
> signing. It is structured to map onto the U.S. **National Data Privacy Agreement
> (NDPA)** and common state student-privacy laws (e.g. FERPA, COPPA, California
> SOPIPA/AB 1584). Bracketed `[...]` fields are filled in per customer.

This Data Processing Addendum ("DPA") supplements the agreement between
**[Customer / School / District]** ("Customer") and **[LYS Legal Entity]**
("Provider") governing Customer's use of the LYS Educational Platform ("Service").

## 1. Definitions

- **Student Data** — personally identifiable information from education records,
  as defined by FERPA (20 U.S.C. 1232g), provided by or on behalf of Customer.
- **Process / Processing** — any operation performed on Student Data.
- **Subprocessor** — a third party engaged by Provider to process Student Data.
  See the current list at [`subprocessors.md`](./subprocessors.md).

## 2. Roles & ownership

Customer is the controller / owner of Student Data. Provider processes Student
Data solely as a **school official** with a legitimate educational interest under
FERPA, and only to provide and improve the Service per Customer's instructions.
Student Data is and remains the property of Customer / the student.

## 3. Permitted use

Provider will not use Student Data for any purpose other than providing the
Service. Provider will **not**:

- sell Student Data;
- use Student Data for targeted advertising;
- build a profile of a student except in furtherance of the Service's educational
  purpose authorized by Customer.

AI features process Student-related free text only after PII removal and content
moderation (see [`ai-safety.md`](./ai-safety.md)); raw student identifiers are not
sent to the AI subprocessor.

## 4. Security

Provider maintains administrative, technical, and physical safeguards described
in [`security-overview.md`](./security-overview.md), including encryption in
transit (TLS) and app-side AES-256-GCM encryption of sensitive free-text fields,
role-based access control, MFA step-up for sensitive admin actions, and a
tamper-evident audit trail.

## 5. Subprocessors

Provider may engage Subprocessors listed in `subprocessors.md`. Provider will
give Customer notice (`[30]` days) before adding a Subprocessor that processes
Student Data, and remains responsible for Subprocessor compliance.

## 6. Data subject / parent requests

Provider will assist Customer in responding to requests to access, correct, or
delete Student Data via the Service's data-subject request tooling
(`/api/dsr/*`). Upon verified request, self-serve accounts are deleted and
school-owned student records are anonymized.

## 7. Data breach

Provider will notify Customer without undue delay (`[72]` hours) after becoming
aware of a breach of Security affecting Student Data, including known scope and
remediation steps.

## 8. Retention & deletion

Provider retains Student Data only as needed to provide the Service or as
required by law. On termination, or on Customer request, Provider will delete or
return Student Data within `[60]` days, subject to a default 3-year retention
limit enforced by an automated purge.

## 9. Data location

Student Data is processed in the `[United States]`. See `subprocessors.md` for
per-vendor regions.

## 10. Audit

Provider will, on reasonable request and no more than `[once per year]`, make
available documentation (e.g. SOC 2 report when available, this compliance pack)
sufficient to demonstrate compliance.

---

**Customer:** ______________________  **Date:** __________

**Provider (LYS):** ______________________  **Date:** __________
