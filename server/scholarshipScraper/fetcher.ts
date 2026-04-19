/**
 * Polite HTTP fetcher with robots.txt compliance and per-domain throttling.
 * 1 req/sec/domain, identifying User-Agent, no retries.
 */

const USER_AGENT =
  "LYS-Scholarship-Bot/1.0 (+https://ladderingyoursuccess.com/bot; info@ladderingyoursuccess.com)";

const TIMEOUT_MS = 15_000;
const MIN_INTERVAL_MS = 1000;

const lastRequestByHost = new Map<string, number>();
const hostQueue = new Map<string, Promise<void>>();
const robotsCache = new Map<string, RobotsRules>();

interface RobotsRules {
  disallow: string[];
  allow: string[];
}

async function getRobotsRules(host: string, scheme: string): Promise<RobotsRules> {
  const cached = robotsCache.get(host);
  if (cached) return cached;
  try {
    const res = await fetch(`${scheme}//${host}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const empty = { disallow: [], allow: [] };
      robotsCache.set(host, empty);
      return empty;
    }
    const text = await res.text();
    const rules = parseRobots(text);
    robotsCache.set(host, rules);
    return rules;
  } catch {
    const empty = { disallow: [], allow: [] };
    robotsCache.set(host, empty);
    return empty;
  }
}

function parseRobots(text: string): RobotsRules {
  const lines = text.split(/\r?\n/);
  let inBlock = false;
  const disallow: string[] = [];
  const allow: string[] = [];
  for (const raw of lines) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      inBlock = value === "*" || value.toLowerCase().includes("lys-scholarship-bot");
      continue;
    }
    if (!inBlock) continue;
    if (key === "disallow" && value) disallow.push(value);
    if (key === "allow" && value) allow.push(value);
  }
  return { disallow, allow };
}

function isAllowed(rules: RobotsRules, pathname: string): boolean {
  const matchLen = (pattern: string) => (pathname.startsWith(pattern) ? pattern.length : -1);
  const allowLen = Math.max(-1, ...rules.allow.map(matchLen));
  const disallowLen = Math.max(-1, ...rules.disallow.map(matchLen));
  if (disallowLen === -1) return true;
  return allowLen >= disallowLen;
}

async function throttleHost(host: string): Promise<void> {
  // Per-host serial queue prevents two concurrent callers from both
  // observing the same `last` value and racing past the throttle.
  const prev = hostQueue.get(host) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  hostQueue.set(host, prev.then(() => next));
  await prev;
  try {
    const last = lastRequestByHost.get(host) || 0;
    const wait = last + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestByHost.set(host, Date.now());
  } finally {
    release();
    // Tidy up: drop queue entry if nothing else is waiting.
    if (hostQueue.get(host) === prev.then(() => next)) hostQueue.delete(host);
  }
}

export type FetchResult =
  | { ok: true; status: number; body: string; finalUrl: string }
  | { ok: false; status: number; reason: "blocked_by_robots" | "fetch_failed"; error?: string };

export async function fetchWithPolitePolicy(rawUrl: string): Promise<FetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, status: 0, reason: "fetch_failed", error: "invalid url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, status: 0, reason: "fetch_failed", error: "non-http url" };
  }

  const rules = await getRobotsRules(url.host, url.protocol);
  if (!isAllowed(rules, url.pathname)) {
    return { ok: false, status: 0, reason: "blocked_by_robots" };
  }

  // Manually follow redirects so we can re-check robots + throttle on each hop.
  let currentUrl = url;
  const MAX_REDIRECTS = 5;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await throttleHost(currentUrl.host);
      const res = await fetch(currentUrl.toString(), {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "manual",
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) {
          return { ok: false, status: res.status, reason: "fetch_failed", error: "redirect without location" };
        }
        const nextUrl = new URL(loc, currentUrl);
        if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
          return { ok: false, status: res.status, reason: "fetch_failed", error: "non-http redirect" };
        }
        const nextRules = await getRobotsRules(nextUrl.host, nextUrl.protocol);
        if (!isAllowed(nextRules, nextUrl.pathname)) {
          return { ok: false, status: 0, reason: "blocked_by_robots" };
        }
        currentUrl = nextUrl;
        continue;
      }
      if (!res.ok) {
        return { ok: false, status: res.status, reason: "fetch_failed", error: `HTTP ${res.status}` };
      }
      const ct = res.headers.get("content-type") || "";
      if (!/text\/|html|json/i.test(ct)) {
        return { ok: false, status: res.status, reason: "fetch_failed", error: `non-text content-type: ${ct}` };
      }
      const body = await res.text();
      return { ok: true, status: res.status, body, finalUrl: currentUrl.toString() };
    }
    return { ok: false, status: 0, reason: "fetch_failed", error: "too many redirects" };
  } catch (err: any) {
    return { ok: false, status: 0, reason: "fetch_failed", error: err?.message || String(err) };
  }
}
