// Hosting-agnostic helpers so the app behaves the same on Replit (dev) and on
// Render (or any other host) without depending on Replit-only env vars.
//
// Historically the code keyed production behaviour (secure cookies, CSP, robots)
// off REPLIT_DEPLOYMENT and built canonical URLs from REPLIT_DOMAINS /
// REPLIT_DEV_DOMAIN. Those only exist on Replit. These helpers fold in a
// standard NODE_ENV=production signal plus a generic PUBLIC_BASE_URL /
// RENDER_EXTERNAL_URL so the same behaviour triggers off-Replit.

/**
 * True when running as a real deployed/production site (HTTPS, hardened
 * cookies, CSP, indexable). Triggers on standard `NODE_ENV=production` OR the
 * legacy Replit `REPLIT_DEPLOYMENT=1` flag so nothing regresses before cutover.
 */
export function isProductionDeployment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.REPLIT_DEPLOYMENT === "1"
  );
}

/**
 * The public, externally-reachable base URL of this app (no trailing slash),
 * used for building webhook URLs, email links, canonical hosts, etc.
 *
 * Resolution order (first match wins):
 *   1. PUBLIC_BASE_URL   — explicit, host-agnostic override (recommended)
 *   2. RENDER_EXTERNAL_URL — provided automatically by Render
 *   3. REPLIT_DOMAINS / REPLIT_DEV_DOMAIN — legacy Replit fallbacks
 *
 * Returns undefined when none are set (callers should degrade gracefully).
 */
export function getPublicBaseUrl(): string | undefined {
  const explicit = process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const replitDomain =
    process.env.REPLIT_DOMAINS?.split(",")[0]?.trim() ||
    process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) return `https://${replitDomain}`;

  return undefined;
}
