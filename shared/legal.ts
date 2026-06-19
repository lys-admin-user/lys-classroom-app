// Centralized legal/policy metadata shared by client and server.
//
// IMPORTANT: When the human-readable text of any policy page changes in a way
// that requires users to re-accept, bump that policy's `version` AND the
// `CURRENT_POLICY_BUNDLE_VERSION` below. Authenticated users whose
// `acceptedPolicyVersion` is older than the bundle version are shown a
// re-acceptance intercept modal on their next visit.
//
// These templates were drafted from structured 2026 compliance templates and
// MUST be reviewed and customized by qualified legal counsel before relying on
// them in production. They do not constitute legal advice.

export type PolicyType = "tos" | "privacy" | "ai";

export interface PolicyMeta {
  type: PolicyType;
  title: string;
  shortTitle: string;
  version: string;
  uuid: string;
  effectiveDate: string; // ISO date
  path: string;
}

export const COMPANY = {
  legalName: "Laddering Your Success, LLC",
  platformName: "LYS",
  platformLongName: "Laddering Your Success",
  governingState: "Texas",
  contactEmail: "info@ladderingyoursuccess.com",
} as const;

export const POLICIES: Record<PolicyType, PolicyMeta> = {
  tos: {
    type: "tos",
    title: "Terms of Service & Subscription Agreement",
    shortTitle: "Terms of Service",
    version: "2026.1",
    uuid: "c0b4e1a2-1f4d-4a7b-9b21-0d2a8f3e7a10",
    effectiveDate: "2026-06-19",
    path: "/terms",
  },
  privacy: {
    type: "privacy",
    title: "Privacy & Data Policy",
    shortTitle: "Privacy Policy",
    version: "2026.1",
    uuid: "7d9f2c54-3b8e-4c1a-8e6f-2a1b9c4d5e63",
    effectiveDate: "2026-06-19",
    path: "/privacy",
  },
  ai: {
    type: "ai",
    title: "Responsible AI & Automated Agents Policy",
    shortTitle: "Responsible AI Policy",
    version: "2026.1",
    uuid: "1a2b3c4d-5e6f-4071-8899-aabbccddeeff",
    effectiveDate: "2026-06-19",
    path: "/ai-policy",
  },
};

export const POLICY_LIST: PolicyMeta[] = [POLICIES.tos, POLICIES.privacy, POLICIES.ai];

// Single version string covering the whole policy bundle. Drives the click-wrap
// acceptance gate and the re-acceptance intercept modal. Bump on any material
// change to any policy.
export const CURRENT_POLICY_BUNDLE_VERSION = "2026.1";

// Consent ledger context values (where the affirmative action happened).
export type ConsentContext = "signup" | "onboarding" | "checkout" | "reaccept";

// Consent ledger policy keys (what was agreed to).
export type ConsentPolicyKey = PolicyType | "bundle" | "recurring_billing";

// Returns true when a user with the given accepted version must re-accept.
export function needsPolicyReacceptance(acceptedVersion: string | null | undefined): boolean {
  return (acceptedVersion ?? "") !== CURRENT_POLICY_BUNDLE_VERSION;
}
