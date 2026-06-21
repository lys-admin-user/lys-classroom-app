// Consent-gated analytics / marketing tracker loader.
//
// Trackers are injected ONLY after the matching consent category is granted and
// ONLY when their public ID is configured via env. With no IDs set this module
// is a complete no-op, so it ships safely and activates the moment IDs are
// added:
//   * VITE_GA_MEASUREMENT_ID  — Google Analytics 4   (category: analytics)
//   * VITE_META_PIXEL_ID      — Meta (Facebook) Pixel (category: marketing)
//   * VITE_HUBSPOT_PORTAL_ID  — HubSpot tracking code (category: marketing)
import type { ConsentState } from "./consent";

const env = import.meta.env as unknown as Record<string, string | undefined>;
const GA_ID = env.VITE_GA_MEASUREMENT_ID;
const META_PIXEL_ID = env.VITE_META_PIXEL_ID;
const HUBSPOT_PORTAL_ID = env.VITE_HUBSPOT_PORTAL_ID;

let gaLoaded = false;
let metaLoaded = false;
let hubspotLoaded = false;

function loadGA() {
  if (gaLoaded || !GA_ID) return;
  gaLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID, { anonymize_ip: true });
}

function loadMetaPixel() {
  if (metaLoaded || !META_PIXEL_ID) return;
  metaLoaded = true;
  const w = window as any;
  if (!w.fbq) {
    const n: any = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = document.createElement("script");
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(t, first);
  }
  w.fbq("init", META_PIXEL_ID);
  w.fbq("track", "PageView");
}

function loadHubSpot() {
  if (hubspotLoaded || !HUBSPOT_PORTAL_ID) return;
  hubspotLoaded = true;
  const s = document.createElement("script");
  s.id = "hs-script-loader";
  s.async = true;
  s.defer = true;
  s.src = `https://js.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`;
  document.head.appendChild(s);
}

// Apply (or re-apply) the visitor's consent choice. Idempotent: each tracker
// guards against double-injection, so calling this repeatedly is safe.
export function applyConsent(consent: ConsentState | null) {
  if (!consent) return;
  if (consent.analytics) loadGA();
  if (consent.marketing) {
    loadMetaPixel();
    loadHubSpot();
  }
}

// True only when at least one tracker ID is configured — used to decide whether
// the consent banner is meaningful to show at all.
export function hasAnyTrackerConfigured(): boolean {
  return Boolean(GA_ID || META_PIXEL_ID || HUBSPOT_PORTAL_ID);
}
