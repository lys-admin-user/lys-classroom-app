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

  // Task #16 — "Standards I haven't covered yet". The counterpart to the
  // history widget: take the teacher's most-used (country, state, subject),
  // pull the full code list from the same cascade the lesson generator uses,
  // and subtract the codes they've already attached to a lesson/assignment.
  // Surfaces curriculum gaps before report time.
  app.get("/api/teacher-standards/uncovered", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub ?? null;
      const history = await storage.getTeacherStandardsHistory(userId);
      if (history.length === 0) {
        return res.json({ context: null, uncovered: [], coveredCount: 0, totalCount: 0 });
      }

      // Group usage by (country, state, subject) and pick the teacher's most
      // active curriculum context by total times-used. Ties break on the
      // number of distinct codes already touched.
      const groups = new Map<
        string,
        { country: string; state: string; subject: string; totalUse: number; codes: Set<string> }
      >();
      for (const row of history) {
        const key = `${row.country}|${row.state}|${row.subject}`;
        const g =
          groups.get(key) ??
          { country: row.country, state: row.state, subject: row.subject, totalUse: 0, codes: new Set<string>() };
        g.totalUse += row.useCount;
        g.codes.add(row.code);
        groups.set(key, g);
      }
      const top = Array.from(groups.values()).sort(
        (a, b) => b.totalUse - a.totalUse || b.codes.size - a.codes.size,
      )[0];

      const { listCodes } = await import("../services/standardsCatalog");
      const allCodes = await listCodes(top.country, top.state, top.subject, { userId });

      // International curricula that publish no per-outcome codes legitimately
      // return an empty list — there's nothing to "cover", so the widget
      // shows its empty state rather than a misleading gap report.
      const uncovered = allCodes.filter((c) => !top.codes.has(c.code));

      res.json({
        context: { country: top.country, state: top.state, subject: top.subject },
        uncovered,
        coveredCount: top.codes.size,
        totalCount: allCodes.length,
      });
    } catch (error) {
      console.error("Get teacher uncovered standards error:", error);
      res.status(500).json({ error: "Failed to load uncovered standards" });
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
