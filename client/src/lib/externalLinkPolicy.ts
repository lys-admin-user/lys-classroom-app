const FIRST_SEEN_KEY = "lys.firstSeenAt";
const SESSION_PREFIX = "lys.knowingCheckSeen:";
const FRICTION_GRACE_DAYS = 15;

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

/**
 * Returns true if we should show the Knowing Check before the user opens
 * the external scholarship link. First 15 days from first-seen → always show.
 * After that → show once per resourceId per browser session.
 */
export function shouldShowKnowingCheck(resourceId: string): boolean {
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
