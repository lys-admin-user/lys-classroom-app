import type { KnowResource } from "../../shared/schema";

export type BkdAlignment = {
  being: boolean;
  knowing: boolean;
  doing: boolean;
  beingReason?: string;
  knowingReason?: string;
  doingReason?: string;
};

const VERIFY_FRESHNESS_DAYS = 30;
const DOING_URGENCY_DAYS = 90;

export function computeBkdAlignment(
  resource: Partial<KnowResource> & {
    lastVerifiedAt?: Date | string | null;
    nextDeadline?: Date | string | null;
    requiresFee?: boolean | null;
    privacyConcern?: boolean | null;
    firstGenFriendly?: boolean | null;
    eligibilityCriteria?: string[] | null;
    trustLevel?: string | null;
  },
  now: Date = new Date(),
): BkdAlignment {
  // BEING: affirms identity / first-gen friendly / explicit eligibility for marginalized groups
  const eligibility = (resource.eligibilityCriteria || []).join(" ").toLowerCase();
  const beingTriggers = [
    "minority", "first-gen", "first generation", "low-income", "single parent",
    "veteran", "lgbtq", "disability", "indigenous", "native", "hispanic",
    "african american", "asian", "pacific islander", "women", "rural",
    "underrepresented", "dreamers", "daca",
  ];
  const matchedBeing = beingTriggers.find((t) => eligibility.includes(t));
  const being = !!resource.firstGenFriendly || !!matchedBeing;
  const beingReason = resource.firstGenFriendly
    ? "Affirms first-generation students"
    : matchedBeing
      ? `Honors identity: ${matchedBeing}`
      : undefined;

  // KNOWING: verified, no fee, no privacy concern, fresh verification
  const verifiedAt = resource.lastVerifiedAt ? new Date(resource.lastVerifiedAt) : null;
  const ageMs = verifiedAt ? now.getTime() - verifiedAt.getTime() : Number.POSITIVE_INFINITY;
  const fresh = ageMs <= VERIFY_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
  const trusted = (resource.trustLevel || "verified") === "verified";
  const noFee = !resource.requiresFee;
  const noPrivacy = !resource.privacyConcern;
  const knowing = trusted && fresh && noFee && noPrivacy;
  const knowingReason = knowing
    ? "LYS-verified, transparent, no fee, no privacy concerns"
    : !noFee
      ? "Requires application fee"
      : !noPrivacy
        ? "Known data-collection concern"
        : !fresh
          ? "Verification is older than 30 days"
          : "Not yet verified by LYS";

  // DOING: actionable now — has a future deadline within 90 days OR is recurring
  const deadline = resource.nextDeadline ? new Date(resource.nextDeadline) : null;
  let doing = false;
  let doingReason: string | undefined;
  if (deadline) {
    const daysOut = Math.floor((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (daysOut < 0) {
      doing = false;
      doingReason = "Deadline has passed";
    } else if (daysOut <= DOING_URGENCY_DAYS) {
      doing = true;
      doingReason = `Apply within ${daysOut} day${daysOut === 1 ? "" : "s"}`;
    } else {
      doing = false;
      doingReason = `Deadline ${daysOut} days out — plan ahead`;
    }
  } else {
    doing = false;
    doingReason = "No concrete deadline parsed yet";
  }

  return { being, knowing, doing, beingReason, knowingReason, doingReason };
}

const MONTHS: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sept: 8, sep: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Parse a free-form deadline string like "January 15", "Nov 1", "December 1, 2026"
 * into a concrete Date that is always in the future. For recurring scholarships,
 * if this year's date has passed, roll to next year.
 */
export function parseNextDeadline(raw: string | null | undefined, now: Date = new Date()): Date | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s || s === "rolling" || s === "varies" || s === "ongoing") return null;

  // Try direct Date.parse first (handles ISO and explicit-year formats)
  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) {
    if (direct > now) return direct;
    // If parsed date already passed and looks like it had a year, do not auto-roll
    if (/\d{4}/.test(raw)) return direct;
  }

  // Look for "Month Day" patterns
  const m = s.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember|t)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})/);
  if (m) {
    const monthIdx = MONTHS[m[1]];
    const day = parseInt(m[2], 10);
    if (monthIdx !== undefined && day >= 1 && day <= 31) {
      const year = now.getFullYear();
      let candidate = new Date(year, monthIdx, day);
      if (candidate <= now) candidate = new Date(year + 1, monthIdx, day);
      return candidate;
    }
  }
  return null;
}
