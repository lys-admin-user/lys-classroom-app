import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY, POLICIES } from "@shared/legal";

export default function Terms() {
  const p = POLICIES.tos;
  return (
    <LegalPageLayout
      title={p.title}
      shortTitle={p.shortTitle}
      version={p.version}
      effectiveDate={p.effectiveDate}
      activePath={p.path}
    >
      <h2>1. Binding Agreement &amp; Click-Wrap Consent</h2>
      <p>
        By clicking "I Agree," creating an account, authenticating a session, or executing
        a purchase on {COMPANY.platformName} ({COMPANY.platformLongName}, the "Platform"),
        you ("User," "Client," or "Tenant") enter into a legally binding contract with{" "}
        {COMPANY.legalName} ("Company," "we," or "us"). If you do not agree to these terms,
        you are prohibited from accessing the Platform.
      </p>

      <h2>2. Immutable Consent &amp; Tracking Architecture</h2>
      <p>
        The Company maintains an append-only ledger logging every consent event. When you
        accept this Agreement, our system records your unique Account/User ID, your IP
        address, an exact millisecond timestamp, and the specific version and UUID of the
        Agreement accepted. You acknowledge that these internal audit records constitute
        evidence of your acceptance in any dispute, court, or arbitration proceeding.
      </p>

      <h2>3. Subscription, Billing &amp; No "Drip Pricing"</h2>
      <h3>All-Inclusive Fees</h3>
      <p>
        The price displayed at the point of enrollment is the true, all-inclusive cost of
        the tier you select. We do not use "drip pricing"; no hidden processing,
        administration, or maintenance fees are added at final checkout.
      </p>
      <h3>Free Trial &amp; Free Tier</h3>
      <p>
        New users receive a 10-day trial with full access to premium features. No payment
        card is required to start the trial. After the trial ends, your account
        automatically continues on the Free plan, which includes up to 5 free AI lesson
        generations per month. You are never charged unless you affirmatively choose a paid
        subscription and authorize recurring billing.
      </p>
      <h3>Paid Plans &amp; De-coupled Authorization</h3>
      <p>
        Paid subscriptions are offered on monthly and annual billing cycles. By starting a
        paid subscription you provide a distinct, standalone authorization — separate from
        your acceptance of these Terms — for the Company to automatically charge your
        designated payment method at the stated recurring interval until you cancel.
      </p>

      <h2>4. "Click-to-Cancel" Parity &amp; Automatic Renewal</h2>
      <p>
        Canceling your subscription requires no more steps than enrollment and carries zero
        administrative friction. You may cancel at any time by signing in and navigating to{" "}
        <strong>Settings &gt; Billing</strong> and selecting "Cancel Subscription." Upon
        cancellation, your paid access continues until the end of the current billing period,
        after which your account reverts to the Free plan. Paid plans renew automatically at
        the end of each billing cycle unless cancelled beforehand.
      </p>

      <h2>5. Acceptable Use</h2>
      <ul>
        <li>You will not misuse, disrupt, or attempt to gain unauthorized access to the Platform or other tenants' data.</li>
        <li>You are responsible for the accuracy of information you submit and for safeguarding your account credentials.</li>
        <li>Educational records and student data must be handled in accordance with applicable law (including FERPA and COPPA) and our Privacy &amp; Data Policy.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        Content you author remains yours. The Platform, its software, branding, and
        underlying systems remain the property of {COMPANY.legalName}. You may not copy,
        resell, or reverse-engineer the Platform except as permitted by law.
      </p>

      <h2>7. Disclaimers &amp; Limitation of Liability</h2>
      <p>
        The Platform is provided "as is" without warranties of any kind to the maximum extent
        permitted by law. AI-generated content may contain errors and should be reviewed by a
        qualified educator before instructional use. To the fullest extent permitted by law,
        the Company's aggregate liability is limited to the amount you paid us in the twelve
        months preceding the claim.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        This Agreement is governed by the laws of the State of {COMPANY.governingState},
        USA, without regard to its conflict-of-laws principles.
      </p>

      <h2>9. Dispute Resolution &amp; Arbitration</h2>
      <p>
        <em>
          The following is a standard arbitration clause provided as a starting template and
          is subject to review and revision by {COMPANY.legalName}'s legal counsel before it
          is relied upon.
        </em>
      </p>
      <p>
        Any dispute, claim, or controversy arising out of or relating to this Agreement or
        the Platform shall be resolved by binding arbitration administered by the American
        Arbitration Association (AAA) under its Consumer Arbitration Rules, rather than in
        court, except that either party may bring an individual claim in small-claims court.
        The arbitration will take place in the State of {COMPANY.governingState}, the
        arbitrator's decision will be final and binding, and judgment may be entered in any
        court of competent jurisdiction. <strong>Class-action waiver:</strong> disputes will
        be conducted only on an individual basis and not as a plaintiff or class member in any
        purported class or representative proceeding. You may opt out of this arbitration
        provision by emailing {COMPANY.contactEmail} within 30 days of first accepting these
        Terms.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update this Agreement. When changes are material, we will increment the policy
        version and prompt signed-in users to re-accept before continuing to use the Platform.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms may be sent to{" "}
        <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
