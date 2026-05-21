// Task #7 — Teacher standards quality-of-life endpoints.
//
// All endpoints are scoped to the calling user. They back:
//   - the "favorite" star + pinned/recent rows in StandardsCascadePicker
//   - a cross-grade search box (same standardsCatalog cascade, no grade filter)
//   - the "Standards I've used" dashboard widget (history aggregation)
//
// Recording is fire-and-forget from the client after a successful lesson save
// or assignment creation; failures must not break the originating action, so
// this endpoint always 200s on validation errors.
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";

const codeKeySchema = z.object({
  country: z.string().min(1),
  state: z.string().min(1),
  subject: z.string().min(1),
  code: z.string().min(1),
});

const favoriteBodySchema = codeKeySchema.extend({
  description: z.string().default(""),
  gradeLevel: z.string().nullable().optional(),
  standardsName: z.string().nullable().optional(),
  jurisdictionName: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
});

const usageItemSchema = codeKeySchema.extend({
  description: z.string().default(""),
  gradeLevel: z.string().nullable().optional(),
  standardsName: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
});

const recordBodySchema = z.object({
  lessonId: z.string().optional(),
  assignmentId: z.string().optional(),
  codes: z.array(usageItemSchema).min(0),
});

export function registerTeacherStandardsRoutes(app: Express): void {
  app.get("/api/teacher-standards/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const favorites = await storage.getTeacherStandardFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Get teacher favorites error:", error);
      res.status(500).json({ error: "Failed to load favorites" });
    }
  });

  app.post("/api/teacher-standards/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const body = favoriteBodySchema.parse(req.body);
      const fav = await storage.addTeacherStandardFavorite({
        userId,
        country: body.country,
        state: body.state,
        subject: body.subject,
        code: body.code,
        description: body.description,
        gradeLevel: body.gradeLevel ?? null,
        standardsName: body.standardsName ?? null,
        jurisdictionName: body.jurisdictionName ?? null,
        source: body.source ?? null,
        sourceUrl: body.sourceUrl ?? null,
      });
      res.json(fav);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid favorite", details: error.errors });
      }
      console.error("Add teacher favorite error:", error);
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/teacher-standards/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const body = codeKeySchema.parse(req.body);
      const removed = await storage.removeTeacherStandardFavorite(userId, body);
      res.json({ removed });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid key", details: error.errors });
      }
      console.error("Remove teacher favorite error:", error);
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/teacher-standards/recents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const country = req.query.country as string | undefined;
      const state = req.query.state as string | undefined;
      const subject = req.query.subject as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const rows = await storage.getTeacherRecentStandards(userId, {
        country,
        state,
        subject,
        limit: Number.isFinite(limit) ? limit : 10,
      });
      res.json(rows);
    } catch (error) {
      console.error("Get teacher recents error:", error);
      res.status(500).json({ error: "Failed to load recents" });
    }
  });

  app.get("/api/teacher-standards/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const rows = await storage.getTeacherStandardsHistory(userId);
      res.json(rows);
    } catch (error) {
      console.error("Get teacher history error:", error);
      res.status(500).json({ error: "Failed to load history" });
    }
  });

  // Cross-grade standards search. Hits the same standardsCatalog cascade with
  // no grade filter so teachers can find a code attached to grade 4 while
  // they're currently planning a grade 5 lesson.
  app.get("/api/teacher-standards/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? null;
      const country = req.query.country as string | undefined;
      const state = req.query.state as string | undefined;
      const subject = req.query.subject as string | undefined;
      const q = ((req.query.q as string | undefined) ?? "").trim().toLowerCase();
      if (!country || !state || !subject) {
        return res.status(400).json({ error: "country, state, subject required" });
      }
      const { listCodes } = await import("../services/standardsCatalog");
      const all = await listCodes(country, state, subject, { userId });
      const filtered = q.length === 0
        ? all
        : all.filter(
            (c) =>
              c.code.toLowerCase().includes(q) ||
              (c.description ?? "").toLowerCase().includes(q),
          );
      res.json(filtered.slice(0, 100));
    } catch (error) {
      console.error("Search teacher standards error:", error);
      res.status(500).json({ error: "Failed to search standards" });
    }
  });

  // Fire-and-forget usage logger. Returns 200 on validation issues so a
  // malformed payload from the client never blocks the originating save.
  app.post("/api/teacher-standards/record", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = recordBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.json({ recorded: 0 });
      }
      const { codes, lessonId, assignmentId } = parsed.data;
      const rows = codes.map((c) => ({
        userId,
        country: c.country,
        state: c.state,
        subject: c.subject,
        code: c.code,
        description: c.description,
        gradeLevel: c.gradeLevel ?? null,
        standardsName: c.standardsName ?? null,
        source: c.source ?? null,
        sourceUrl: c.sourceUrl ?? null,
        lessonId: lessonId ?? null,
        assignmentId: assignmentId ?? null,
      }));
      await storage.recordTeacherStandardsUsage(rows);
      res.json({ recorded: rows.length });
    } catch (error) {
      console.error("Record teacher standards usage error:", error);
      res.json({ recorded: 0 });
    }
  });
}
