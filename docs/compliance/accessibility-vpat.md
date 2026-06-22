# Accessibility Conformance Report (VPAT Scaffold)

> Based on the **VPAT 2.x** structure (ITI Voluntary Product Accessibility
> Template) covering WCAG 2.1, Section 508, and EN 301 549. This is a
> **self-assessment scaffold** to be completed and, for district/government
> sales, validated by an independent accessibility auditor.

- **Product:** LYS Educational Platform
- **Report date:** `[fill in]`
- **Evaluation methods used:** `[manual keyboard testing, automated axe scan,
  screen-reader spot checks — fill in what was actually performed]`
- **Applicable standards:** WCAG 2.1 Level A & AA; Section 508 (Revised 2017).

## Conformance levels (terminology)

- **Supports** — meets the criterion.
- **Partially Supports** — some functionality does not meet the criterion.
- **Does Not Support** — majority does not meet the criterion.
- **Not Applicable** — criterion does not apply.

## WCAG 2.1 Level A & AA — summary table

Fill the "Conformance Level" and "Remarks" columns after testing each criterion.
Current entries reflect the design system in use (Tailwind + shadcn/ui with
Radix primitives), which provides accessible component foundations but must still
be verified per screen.

| Criterion | Level | Conformance | Remarks |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | `[verify]` | Confirm `alt` text on informative images; decorative images marked. |
| 1.3.1 Info and Relationships | A | `[verify]` | Radix components expose semantic roles; verify custom layouts. |
| 1.4.3 Contrast (Minimum) | AA | `[verify]` | Verify brand palette (lys-red/teal/yellow) meets 4.5:1 on text. |
| 1.4.11 Non-text Contrast | AA | `[verify]` | Verify focus rings / control borders meet 3:1. |
| 2.1.1 Keyboard | A | `[verify]` | Radix primitives are keyboard-operable; verify custom interactions. |
| 2.4.3 Focus Order | A | `[verify]` | Verify modal/drawer focus trapping and return. |
| 2.4.7 Focus Visible | AA | `[verify]` | Verify visible focus indicator on all interactive elements. |
| 3.3.1 Error Identification | A | `[verify]` | Forms use react-hook-form + Zod; verify errors are announced. |
| 3.3.2 Labels or Instructions | A | `[verify]` | Verify every input has an associated `<Label>`. |
| 4.1.2 Name, Role, Value | A | `[verify]` | Radix exposes ARIA; verify custom widgets. |

(Extend with the full WCAG 2.1 AA criteria list before submitting to a customer.)

## Section 508 mapping

Section 508 (Revised) incorporates WCAG 2.1 AA by reference for web content.
Complete the WCAG table above and reference it here.

## Known accessibility considerations in this codebase

- **Component foundation:** shadcn/ui on Radix provides keyboard and ARIA support
  out of the box, which is a strong starting point.
- **`data-testid` coverage:** interactive elements carry stable test IDs, which
  also aids automated accessibility scanning.
- **To verify per screen:** color contrast of the brand palette, focus management
  in modals/drawers and the embedded (`/embed/*`) surfaces, and screen-reader
  labeling of icon-only buttons.

## Next steps to a customer-ready VPAT

1. Run an automated scan (e.g. axe) across key flows and record results.
2. Manual keyboard + screen-reader pass on: landing, lesson generator, practice,
   dashboard, settings.
3. Fix high-impact gaps; document remaining items with remediation dates.
4. For district/government deals, commission an independent VPAT audit.
