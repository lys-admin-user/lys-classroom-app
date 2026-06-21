// Client-side cookie/tracking consent store.
//
// Necessary cookies (session/auth/security) are always on and are NOT gated.
// Optional analytics + marketing technologies load only after the visitor
// opts in via the ConsentBanner. State lives in localStorage and a custom
// window event lets the analytics loader react the moment a choice is made.

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const STORAGE_KEY = "lys-consent-v1";
const CHANGE_EVENT = "lys-consent-change";

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function hasDecided(): boolean {
  return getConsent() !== null;
}

export function setConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — consent simply won't persist this session */
  }
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
  } catch {
    /* no-op */
  }
  return state;
}

export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail as ConsentState);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
