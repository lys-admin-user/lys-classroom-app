import type { Request, Response, NextFunction } from "express";

// Tiny in-process TTL cache for hot, rarely-changing static metadata (e.g. the
// standards/countries/states catalog). This is intentionally simple: a single
// Map with lazy expiry and a hard size cap. It is per-instance (not shared
// across replicas), which is fine for immutable reference data.

interface Entry {
  value: unknown;
  expires: number;
}

const store = new Map<string, Entry>();
const MAX_ENTRIES = 500;

export function getCached<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function setCached(key: string, value: unknown, ttlSeconds: number): void {
  if (store.size >= MAX_ENTRIES) {
    // Evict the oldest insertion to bound memory.
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

export function clearCache(): void {
  store.clear();
}

// Express middleware: serves a cached JSON body when warm and always sets a
// matching Cache-Control header so browsers/CDNs can cache too. Only caches
// successful (2xx) responses. Cache key defaults to the full URL.
export function cached(ttlSeconds: number, keyFn?: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn ? keyFn(req) : req.originalUrl;
    res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}`);

    const hit = getCached<unknown>(key);
    if (hit !== undefined) {
      res.setHeader("X-Cache", "HIT");
      return res.json(hit);
    }

    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCached(key, body, ttlSeconds);
      }
      return originalJson(body);
    };
    next();
  };
}
