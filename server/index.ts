import "./bootstrap-env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupCollaborationWebSocket } from "./collaboration";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { WebhookHandlers } from "./webhookHandlers";
import { getStripeSync } from "./stripeClient";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

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
  const { scheduleQuarterlyScholarshipScrape } = await import(
    "./scholarshipScraper/scheduler"
  );
  scheduleQuarterlyScholarshipScrape().catch((err) =>
    log(`Failed to schedule scholarship scraper: ${err?.message || err}`, "scheduler"),
  );

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`ERROR ${status}: ${message}`, "error");
    if (!res.headersSent) {
      res.status(status).json({ message });
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
