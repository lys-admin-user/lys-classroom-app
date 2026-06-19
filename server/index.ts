import "./bootstrap-env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupCollaborationWebSocket } from "./collaboration";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { randomUUID } from "node:crypto";
import { WebhookHandlers } from "./webhookHandlers";
import { getStripeSync } from "./stripeClient";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { logger, httpLogger } from "./observability";

// Dev-time guard: warn if any LYS reference .txt is newer than the generated
// embedded.ts file. Easy to forget to re-run scripts/regen_lys_embedded.mjs
// after editing a .txt — this surfaces it on every restart.
function checkLysReferenceFreshness(): void {
  try {
    const dir = "server/reference/lys";
    const embeddedPath = join(dir, "embedded.ts");
    const embeddedMtime = statSync(embeddedPath).mtimeMs;
    const stale: string[] = [];
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".txt")) continue;
      const mtime = statSync(join(dir, f)).mtimeMs;
      if (mtime > embeddedMtime) stale.push(f);
    }
    if (stale.length > 0) {
      console.warn(
        `\n[lys-reference] WARNING: ${stale.length} source file(s) newer than embedded.ts: ${stale.join(", ")}\n` +
        `[lys-reference] Run: node scripts/regen_lys_embedded.mjs\n`
      );
    }
  } catch {
    /* embedded.ts may not exist on first run; ignore */
  }
}
checkLysReferenceFreshness();

const app = express();
const httpServer = createServer(app);

setupCollaborationWebSocket(httpServer);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.set("trust proxy", 1);

// Liveness probe: cheap, no dependencies. Used by the platform/uptime checks to
// know the process is up. Registered early so it bypasses heavier middleware.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe: verifies the process can actually serve traffic by pinging
// the database. Returns 503 when a dependency is unavailable so a load balancer
// can hold traffic until the app is truly ready.
app.get("/ready", async (_req, res) => {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ status: "ready" });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed");
    res.status(503).json({ status: "not_ready" });
  }
});

// API versioning. All routes are defined once under `/api/*`. We expose `/api/v1`
// as an explicit, stable alias by rewriting the versioned prefix back to `/api`
// before any routing/rate-limiting runs, so both `/api/...` (legacy, back-compat)
// and `/api/v1/...` resolve to the same handlers. When a future breaking change
// is needed, branch here on the version segment instead of forking every route.
app.use((req, _res, next) => {
  if (req.url === "/api/v1") {
    req.url = "/api";
  } else if (req.url.startsWith("/api/v1/")) {
    req.url = "/api" + req.url.slice("/api/v1".length);
  }
  next();
});

// Content-Security-Policy is enforced only on the published deployment. In dev,
// Vite/HMR and the Replit preview banner inject inline/eval scripts that a
// strict CSP would break, so we leave it off locally. 'unsafe-inline' is kept
// for scripts/styles because React + Tailwind emit inline styles and the built
// bundle isn't nonce-tagged; nonce-based hardening is a follow-up. frame-src /
// frame-ancestors are left at helmet defaults ('self') to match the existing
// X-Frame-Options behavior and not regress the /embed/* surfaces.
const isDeployment = process.env.REPLIT_DEPLOYMENT === "1";
app.use(
  helmet({
    contentSecurityPolicy: isDeployment
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "https:", "wss:"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }),
);

// SEO: explicitly mark production responses as indexable so any upstream
// proxy default (e.g. Replit dev preview's X-Robots-Tag: noindex) is
// overridden on the published app. Dev/preview is left alone so it stays
// out of search results.
app.use((req, res, next) => {
  if (process.env.REPLIT_DEPLOYMENT === "1" && !req.path.startsWith("/api")) {
    res.setHeader("X-Robots-Tag", "index, follow");
  }
  next();
});

// Cookie parsing + guest identity. Every unauthenticated visitor gets a
// stable httpOnly `lys_guest_id` UUID cookie so guest quotas, handoff state,
// and post-signup state restoration can survive page reloads. The cookie is
// SameSite=Lax / 90 days, mirrors the secure flag of the deployment, and
// `req.guestId` is exposed for route handlers regardless of auth state.
// Sign the guest cookie with the same SESSION_SECRET used by auth so the
// guestId can't be forged by a scripted client to rotate around the quota.
// Only signedCookies are trusted; unsigned `lys_guest_id` values are ignored.
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required for signed guest cookies.");
}
app.use(cookieParser(process.env.SESSION_SECRET));
declare module "express-serve-static-core" {
  interface Request {
    guestId?: string;
  }
}
app.use((req, res, next) => {
  let guestId = req.signedCookies?.lys_guest_id as string | undefined | false;
  // cookie-parser returns `false` for a tampered signed cookie — treat the
  // same as missing and reissue a fresh one.
  if (!guestId || typeof guestId !== "string" || !/^[0-9a-f-]{36}$/i.test(guestId)) {
    guestId = randomUUID();
    res.cookie("lys_guest_id", guestId, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: process.env.REPLIT_DEPLOYMENT === "1",
      maxAge: 90 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
  req.guestId = guestId as string;
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => !req.path.startsWith("/api"),
});
app.use(apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many authentication attempts, please try again later." },
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "AI generation rate limit reached. Please wait a moment." },
});
app.use("/api/lessons/generate", aiLimiter);
app.use("/api/assignments/generate", aiLimiter);
app.use("/api/practice/generate", aiLimiter);
app.use("/api/homeschool/generate", aiLimiter);

// Public, unauthenticated write endpoint — throttle to deter spam submissions.
const demoRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many demo requests. Please try again later." },
});
app.use("/api/demo-requests", demoRequestLimiter);

// Bulk data exports (e.g. gradebook CSV) — throttle to deter scraping/exfiltration.
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: "Too many export requests. Please try again later." },
});
app.use("/api/classes/:classId/grades/export", exportLimiter);

// Stripe webhook route MUST be registered BEFORE express.json() middleware
// Webhooks require raw Buffer body, not parsed JSON
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// CSRF mitigation: for state-changing API requests, require the browser-sent
// Origin (or Referer) host to match the server host. Same-origin fetch/XHR from
// the SPA always sends an Origin header on non-GET requests, so legitimate calls
// pass; a cross-site forgery attempt carries the attacker's origin and is
// rejected. Non-browser callers (webhooks) are allowlisted by path. This needs
// no client changes and complements the SameSite=Lax session cookie.
const CSRF_EXEMPT_PATHS = new Set<string>([
  "/api/stripe/webhook",
]);
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();
  if (!req.path.startsWith("/api")) return next();
  if (CSRF_EXEMPT_PATHS.has(req.path)) return next();

  const expectedHost = req.get("host");
  const origin = req.get("origin");
  const referer = req.get("referer");
  let sourceHost: string | null = null;
  try {
    if (origin) sourceHost = new URL(origin).host;
    else if (referer) sourceHost = new URL(referer).host;
  } catch {
    sourceHost = null;
  }

  if (!sourceHost || sourceHost !== expectedHost) {
    return res.status(403).json({ error: "Cross-origin request blocked." });
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Structured per-request logging (pino-http). Attaches a request id, logs
// method/url/status/latency as JSON, and redacts sensitive headers/fields.
app.use(httpLogger);

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set - skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe...');

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log('Stripe webhook configured');

    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Stripe sync error:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

let retentionPurgeIntervalHandle: NodeJS.Timeout | null = null;
async function scheduleRetentionPurge() {
  if (retentionPurgeIntervalHandle) return; // idempotent guard
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const { runRetentionPurge, runRetentionTtlSweep } = await import("./services/dataSubjectService");

  const runJob = async () => {
    try {
      // TTL sweep first: mark 12-month-inactive accounts for purge + prune
      // behavioral (30d) and operational log (90d) rows.
      const ttl = await runRetentionTtlSweep();
      if (ttl.inactiveMarked > 0 || ttl.behavioralDeleted > 0 || ttl.logsDeleted > 0) {
        log(
          `Retention TTL sweep: ${ttl.inactiveMarked} inactive marked, ${ttl.behavioralDeleted} behavioral rows, ${ttl.logsDeleted} log rows pruned`,
          "scheduler",
        );
      }
    } catch (err: any) {
      log(`Retention TTL sweep failed: ${err?.message || err}`, "scheduler");
    }
    try {
      const { purged } = await runRetentionPurge();
      if (purged > 0) log(`Retention purge removed ${purged} expired account(s)`, "scheduler");
    } catch (err: any) {
      log(`Retention purge failed: ${err?.message || err}`, "scheduler");
    }
  };

  // Kick once shortly after boot, then daily.
  setTimeout(() => void runJob(), 60 * 1000);
  retentionPurgeIntervalHandle = setInterval(() => void runJob(), ONE_DAY_MS);
  log("Data retention purge scheduled (daily)", "scheduler");
}

let weeklyVerificationIntervalHandle: NodeJS.Timeout | null = null;
async function scheduleWeeklyScholarshipVerification() {
  if (weeklyVerificationIntervalHandle) return; // idempotent guard
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const { storage } = await import("./storage");
  const SYSTEM_USER_ID = "system-weekly-job";

  const runJob = async () => {
    try {
      const allResources = await storage.getKnowResources({});
      const ids = allResources.filter((r) => r.isActive !== false).map((r) => r.id);
      if (ids.length === 0) return;
      const count = await storage.bulkVerifyKnowResources(ids, SYSTEM_USER_ID);
      log(`Weekly verification refreshed ${count} resource(s)`, "scheduler");
    } catch (err: any) {
      log(`Weekly verification failed: ${err?.message || err}`, "scheduler");
    }
  };

  weeklyVerificationIntervalHandle = setInterval(runJob, ONE_WEEK_MS);
  log("Weekly scholarship verification scheduled (every 7 days)", "scheduler");
}

async function initLessonAiSubsystem(): Promise<void> {
  // Idempotent boot wiring for the Bricks/BKD lesson AI improvements:
  //  1. Ensure the `vector` extension exists (no-op if already installed; we
  //     currently store embeddings as jsonb arrays so this is precautionary).
  //  2. Migrate the hardcoded LYS canon into the DB on first boot.
  //  3. Seed the `new_lesson_retrieval` feature flag in the disabled state so
  //     the legacy retrieval path stays the default until an admin toggles it.
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    try { await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`); } catch { /* permission or unavailable; safe to ignore */ }
    const { seedCanonFromHardcodedIfEmpty, seedVoiceCorpusFromFiles } = await import("./services/lysCanonService");
    await seedCanonFromHardcodedIfEmpty();
    await seedVoiceCorpusFromFiles();
    const { storage } = await import("./storage");
    const existing = await storage.getFeatureFlagByName("new_lesson_retrieval");
    if (!existing) {
      await storage.createFeatureFlag({
        name: "new_lesson_retrieval",
        description: "Enable semantic retrieval, per-section highlight reel, and DB-backed canon for AI lesson generation",
        isEnabled: false,
      } as any);
    }
  } catch (err) {
    console.warn("[lesson-ai] boot init skipped:", (err as Error).message);
  }
}

(async () => {
  await initStripe();
  await registerRoutes(httpServer, app);
  await initLessonAiSubsystem();
  scheduleWeeklyScholarshipVerification().catch((err) =>
    log(`Failed to schedule verification job: ${err?.message || err}`, "scheduler"),
  );
  scheduleRetentionPurge().catch((err) =>
    log(`Failed to schedule retention purge: ${err?.message || err}`, "scheduler"),
  );
  const { scheduleQuarterlyScholarshipScrape } = await import(
    "./scholarshipScraper/scheduler"
  );
  scheduleQuarterlyScholarshipScrape().catch((err) =>
    log(`Failed to schedule scholarship scraper: ${err?.message || err}`, "scheduler"),
  );

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const requestId = (req as any).id || res.getHeader("x-request-id");

    // Full structured error (stack + request id) goes to the logs; the client
    // gets a sanitized message plus the request id for support correlation.
    logger.error(
      { err, status, requestId, method: req.method, url: req.originalUrl },
      `Request failed: ${status} ${message}`,
    );

    if (!res.headersSent) {
      const body: Record<string, any> = { message, requestId };
      // Never leak internals to clients on a 500.
      if (status >= 500) body.message = "Internal Server Error";
      res.status(status).json(body);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
