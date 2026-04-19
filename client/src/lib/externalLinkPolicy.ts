const FIRST_SEEN_KEY = "lys.firstSeenAt";
const SESSION_PREFIX = "lys.knowingCheckSeen:";
const CONFIRM_COUNT_KEY = "lys.knowingCheckConfirmCount";
const SUPPRESS_VERIFIED_KEY = "lys.knowingCheckSuppressVerified";
const FRICTION_GRACE_DAYS = 15;
const SUPPRESS_ELIGIBLE_AFTER_CONFIRMS = 5;

function getOrSetFirstSeen(): Date {
  try {
    const stored = localStorage.getItem(FIRST_SEEN_KEY);
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d.getTime())) return d;
    }
    const now = new Date();
    localStorage.setItem(FIRST_SEEN_KEY, now.toISOString());
    return now;
  } catch {
    return new Date();
  }
}

export function getConfirmCount(): number {
  try {
    return parseInt(localStorage.getItem(CONFIRM_COUNT_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementConfirmCount(): number {
  const next = getConfirmCount() + 1;
  try { localStorage.setItem(CONFIRM_COUNT_KEY, String(next)); } catch { /* ignore */ }
  return next;
}

export function isSuppressVerifiedEnabled(): boolean {
  try { return localStorage.getItem(SUPPRESS_VERIFIED_KEY) === "1"; } catch { return false; }
}

export function setSuppressVerified(on: boolean) {
  try { localStorage.setItem(SUPPRESS_VERIFIED_KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

export function canOfferSuppressOption(): boolean {
  return getConfirmCount() >= SUPPRESS_ELIGIBLE_AFTER_CONFIRMS;
}

/**
 * Returns true if we should show the Knowing Check before the user opens
 * the external scholarship link.
 *  - First 15 days from first-seen → always show.
 *  - After that → show once per resourceId per browser session.
 *  - If `trustLevel === "verified"` and user has opted-in to suppress for verified
 *    listings (after confirming 5+ times), skip the check entirely.
 */
export function shouldShowKnowingCheck(resourceId: string, trustLevel?: string | null): boolean {
  if (trustLevel === "verified" && isSuppressVerifiedEnabled()) return false;
  const firstSeen = getOrSetFirstSeen();
  const daysSinceFirstSeen = (Date.now() - firstSeen.getTime()) / (24 * 60 * 60 * 1000);
  if (daysSinceFirstSeen <= FRICTION_GRACE_DAYS) return true;
  try {
    return !sessionStorage.getItem(SESSION_PREFIX + resourceId);
  } catch {
    return true;
  }
}

export function markKnowingCheckSeen(resourceId: string) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + resourceId, "1");
  } catch { /* ignore */ }
}
