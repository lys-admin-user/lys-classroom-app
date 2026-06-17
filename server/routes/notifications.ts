// Task #8 — admin notifications + digest settings routes.
import type { Express } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { userPreferences, NOTIFICATION_KINDS, DIGEST_CADENCES, type DigestCadence } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import {
  countUnread,
  listNotifications,
  markAllRead,
} from "../services/notificationsService";
import { runDigestNow, runBacklogDigestNow } from "../services/digestScheduler";
import { getModerationBacklogStats } from "../services/ingestionModeration";
import { getBacklogThreshold } from "../services/moderationBacklogDigest";

function requireSystemAdmin() {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const u = await storage.getUser(userId);
      if (u?.role !== "system_admin") return res.status(403).json({ error: "Forbidden" });
      next();
    } catch {
      res.status(500).json({ error: "Permission check failed" });
    }
  };
}

// `emailDigestOptOut` is deprecated (Task #17) — digest delivery is now driven
// solely by `digestCadence` ("off" replaces the old opt-out). We still accept
// it for backward compatibility and translate it into a cadence below.
const settingsSchema = z.object({
  emailDigestOptOut: z.boolean().optional(),
  inAppNotificationsOptOut: z.boolean().optional(),
  digestCadence: z.enum(DIGEST_CADENCES as [string, ...string[]]).optional(),
  mutedNotificationKinds: z.array(z.enum(NOTIFICATION_KINDS as unknown as [string, ...string[]])).optional(),
});

export function registerNotificationsRoutes(app: Express): void {
  // List notifications for the current admin (most recent first).
  app.get("/api/admin/notifications", isAuthenticated, requireSystemAdmin(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const onlyUnread = req.query.unread === "1" || req.query.unread === "true";
      const limit = req.query.limit ? Math.min(Number(req.query.limit) || 25, 100) : 25;
      const [items, unread] = await Promise.all([
        listNotifications(userId, { onlyUnread, limit }),
        countUnread(userId),
      ]);
      res.json({ items, unread });
    } catch (err) {
      console.error("[notifications] list failed:", err);
      res.status(500).json({ error: "Failed to load notifications" });
    }
  });

  // Lightweight polling endpoint used by the bell badge.
  app.get("/api/admin/notifications/unread-count", isAuthenticated, requireSystemAdmin(), async (req: any, res) => {
    try {
      const unread = await countUnread(req.user.claims.sub);
      res.json({ unread });
    } catch (err) {
      res.status(500).json({ error: "Failed to count notifications" });
    }
  });

  app.post("/api/admin/notifications/mark-all-read", isAuthenticated, requireSystemAdmin(), async (req: any, res) => {
    try {
      const result = await markAllRead(req.user.claims.sub);
      res.json(result);
    } catch (err) {
      console.error("[notifications] mark-all-read failed:", err);
      res.status(500).json({ error: "Failed to mark notifications read" });
    }
  });

  // Per-user opt-out settings. Available to any authenticated user since the
  // toggles live on the shared Settings page; non-admins simply have no
  // notifications to receive.
  app.get("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.getUserPreferences(userId);
      const digestCadence = (prefs?.digestCadence as DigestCadence | undefined) ?? "weekly";
      res.json({
        // Derived from cadence so the deprecated flag never disagrees with the
        // authoritative cadence value.
        emailDigestOptOut: digestCadence === "off",
        inAppNotificationsOptOut: prefs?.inAppNotificationsOptOut ?? false,
        digestCadence,
        mutedNotificationKinds: prefs?.mutedNotificationKinds ?? [],
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to load notification settings" });
    }
  });

  app.patch("/api/notification-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = settingsSchema.parse(req.body);

      // Resolve the effective cadence. An explicit `digestCadence` wins; a
      // legacy `emailDigestOptOut` boolean is translated (true -> "off",
      // false -> "weekly"). We then keep the deprecated column in sync so the
      // two never disagree.
      let cadence: DigestCadence | undefined =
        validated.digestCadence as DigestCadence | undefined;
      if (cadence === undefined && validated.emailDigestOptOut !== undefined) {
        cadence = validated.emailDigestOptOut ? "off" : "weekly";
      }

      // Upsert pattern: getUserPreferences returns null for fresh users.
      const existing = await storage.getUserPreferences(userId);
      if (!existing) {
        const initialCadence: DigestCadence = cadence ?? "weekly";
        await db.insert(userPreferences).values({
          userId,
          emailDigestOptOut: initialCadence === "off",
          inAppNotificationsOptOut: validated.inAppNotificationsOptOut ?? false,
          digestCadence: initialCadence,
          mutedNotificationKinds: validated.mutedNotificationKinds ?? [],
        });
      } else {
        await db
          .update(userPreferences)
          .set({
            ...(cadence !== undefined
              ? { digestCadence: cadence, emailDigestOptOut: cadence === "off" }
              : {}),
            ...(validated.inAppNotificationsOptOut !== undefined
              ? { inAppNotificationsOptOut: validated.inAppNotificationsOptOut }
              : {}),
            ...(validated.mutedNotificationKinds !== undefined
              ? { mutedNotificationKinds: validated.mutedNotificationKinds }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId));
      }
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings", details: err.errors });
      }
      console.error("[notifications] update settings failed:", err);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Manual trigger so system_admin can preview a digest without waiting for
  // Monday. Useful in dev + when wiring up a real transport.
  app.post("/api/admin/digest/run-now", isAuthenticated, requireSystemAdmin(), async (_req, res) => {
    try {
      const result = await runDigestNow();
      res.json(result);
    } catch (err) {
      console.error("[digest] manual run failed:", err);
      res.status(500).json({ error: "Failed to run digest" });
    }
  });

  // Task #12 — current moderation-queue backlog snapshot + configured alert
  // threshold, for the admin banner in the Moderation queue tab.
  app.get("/api/admin/moderation-backlog/stats", isAuthenticated, requireSystemAdmin(), async (_req, res) => {
    try {
      const stats = await getModerationBacklogStats();
      res.json({ ...stats, threshold: getBacklogThreshold() });
    } catch (err) {
      console.error("[moderation-backlog] stats failed:", err);
      res.status(500).json({ error: "Failed to load backlog stats" });
    }
  });

  // Manual trigger so system_admin can send the backlog alert on demand
  // (forces past the threshold gate + per-day dedup).
  app.post("/api/admin/moderation-backlog/run-now", isAuthenticated, requireSystemAdmin(), async (_req, res) => {
    try {
      const result = await runBacklogDigestNow();
      res.json(result);
    } catch (err) {
      console.error("[moderation-backlog] manual run failed:", err);
      res.status(500).json({ error: "Failed to run backlog alert" });
    }
  });
}
