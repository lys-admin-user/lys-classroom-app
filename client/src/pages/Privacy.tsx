import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY, POLICIES } from "@shared/legal";

export default function Privacy() {
  const p = POLICIES.privacy;
  return (
    <LegalPageLayout
      title={p.title}
      shortTitle={p.shortTitle}
      version={p.version}
      effectiveDate={p.effectiveDate}
      activePath={p.path}
    >
      <h2>1. Who We Are</h2>
      <p>
        {COMPANY.legalName} operates the {COMPANY.platformName} ({COMPANY.platformLongName})
        educational platform. This policy explains what data we collect, how we use it, how
        long we keep it, and the rights you have over it.
      </p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, role, and (where required for age verification) date of birth.</li>
        <li><strong>Educational content:</strong> lessons, assignments, and other material you create or upload.</li>
        <li><strong>Student records:</strong> where you manage students, the records you enter, handled as FERPA-protected data.</li>
        <li><strong>Usage &amp; technical data:</strong> log files, device/browser information, and IP address.</li>
        <li><strong>Billing data:</strong> processed by our payment provider (Stripe); we do not store full card numbers.</li>
      </ul>

      <h2>3. How We Use AI &amp; Third Parties</h2>
      <p>
        We use OpenAI to power lesson, assignment, and practice generation. Before free-text
        content is sent to any external AI provider, we strip personally identifiable
        information (PII) from it. We do not sell your personal data. Our processors include
        our cloud host, our payment provider (Stripe), and our AI provider (OpenAI), each
        used only to deliver the service.
      </p>

      <h2>4. Precise Data Retention &amp; Hard TTL Enforcement</h2>
      <p>
        We do not retain data indefinitely. Our systems enforce automated time-to-live (TTL)
        deletion across our storage layers:
      </p>
      <ul>
        <li><strong>System log files:</strong> pruned or anonymized after 90 days.</li>
        <li><strong>Behavioral session profiles:</strong> hard-deleted after 30 days of inactivity.</li>
        <li><strong>Inactive accounts:</strong> purged or securely archived after 12 months of zero sign-in activity.</li>
        <li><strong>Student educational records:</strong> retained for up to 3 years, then purged per our retention schedule, unless a longer period is required by your institution or law.</li>
      </ul>

      <h2>5. Your Rights — Access, Export &amp; Deletion</h2>
      <p>
        In accordance with GDPR, CCPA/CPRA, and similar frameworks, you have the right to
        access, port, and delete your data.
      </p>
      <ul>
        <li><strong>Self-serve export:</strong> download your profile and history in a machine-readable format via <strong>Settings &gt; Privacy</strong>.</li>
        <li><strong>Deletion:</strong> when you request deletion, our automated workers cascade a purge that deletes or anonymizes your records across production databases and backups, generally within 30 days. Self-serve accounts are hard-deleted; school-owned student records are anonymized and the relevant school admin(s) and parent(s) are notified.</li>
      </ul>

      <h2>6. Children's Privacy (COPPA)</h2>
      <p>
        Children under 13 cannot create their own self-serve account. Under-13 students may
        only be added through a school or a homeschool-parent account, which carries
        responsibility for any required parental consent.
      </p>

      <h2>7. Security</h2>
      <p>
        Sensitive free-text student notes are encrypted at rest. Our application masks
        internal errors so that stack traces, schema, and infrastructure details are never
        exposed to end users; user-facing errors display only a generic tracking ID.
      </p>

      <h2>8. Cookies &amp; Tracking</h2>
      <p>
        We use strictly necessary cookies (for sign-in, session, and security) that are always
        on. Optional analytics and marketing technologies — such as Google Analytics, the Meta
        Pixel, and HubSpot — load in your browser <strong>only after you opt in</strong> through
        our cookie consent banner. We do not enable them until you accept, and you can decline or
        change your choice at any time. We do not sell your personal data, and analytics IP
        addresses are anonymized where supported.
      </p>

      <h2>9. Changes &amp; Contact</h2>
      <p>
        When we make material changes to this policy we will increment its version and prompt
        signed-in users to re-accept. Questions or requests may be sent to{" "}
        <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
