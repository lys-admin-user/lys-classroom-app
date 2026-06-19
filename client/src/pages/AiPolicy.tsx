import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY, POLICIES } from "@shared/legal";

export default function AiPolicy() {
  const p = POLICIES.ai;
  return (
    <LegalPageLayout
      title={p.title}
      shortTitle={p.shortTitle}
      version={p.version}
      effectiveDate={p.effectiveDate}
      activePath={p.path}
    >
      <h2>1. Transparency &amp; AI Notifications</h2>
      <p>
        Whenever you interact with an automated chat agent, a generative feature, or an
        algorithmic support interface on {COMPANY.platformName}, you are given a clear,
        conspicuous notice that you are "Interacting with an AI Agent." We will never lead you
        to believe an automated system is a human representative.
      </p>

      <h2>2. AI-Generated Content Labeling &amp; Watermarking</h2>
      <p>
        Content produced by our generative features — including lessons, assignments, and
        practice materials — is visibly labeled as AI-generated. Where technically feasible,
        generated images carry an embedded, machine-readable marker indicating they were
        artificially produced, helping ensure such outputs are detectable and reducing the
        risk of misuse.
      </p>

      <h2>3. Human Oversight</h2>
      <p>
        AI output is a starting point, not a final authority. We encourage educators to
        review and adapt generated material before instructional use. AI may produce
        inaccuracies, and you remain responsible for the content you publish or assign.
      </p>

      <h2>4. Data Handling for AI Features</h2>
      <p>
        Free-text inputs are stripped of personally identifiable information before being sent
        to our AI provider. We do not use your private student records to train external,
        general-purpose AI models.
      </p>

      <h2>5. Prohibition on Scraping for Model Training</h2>
      <p>
        You may not feed proprietary datasets, source code, or confidential operational data
        extracted from the Platform into external Large Language Models or public machine-
        learning pipelines without an explicit enterprise license. Unauthorized ingestion of
        our interfaces to train competing systems may result in suspension or revocation of
        access.
      </p>

      <h2>6. Changes &amp; Contact</h2>
      <p>
        We will increment this policy's version and prompt signed-in users to re-accept when
        we make material changes. Questions may be sent to{" "}
        <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
