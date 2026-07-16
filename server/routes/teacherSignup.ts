import type { Express } from "express";
import { z } from "zod";
import { eq, desc, sql, isNotNull, isNull, and } from "drizzle-orm";
import { db } from "../db";
import { teacherSignupResponses } from "@shared/schema";
import { isAuthenticated } from "../replit_integrations/auth";
import { isSiteAdmin, ANALYZER_SESSION_REGEX } from "./_helpers";

// ===== Teacher pre-signup quiz ===============================================
// Three optional pain/gain questions (plus an email capture) shown to teachers
// between "Sign up" intent and account creation. Anonymous by design — keyed
// by a localStorage sessionId like the needs analyzer. After signup the
// onboarding flow calls /bind so the admin Signup Insights page can report
// conversion per answer.

export const TEACHER_FRUSTRATIONS = [
  "behavior",
  "planning_time",
  "differentiation_docs",
] as const;

export const TEACHER_PLANNING_STYLES = [
  "from_scratch",
  "reuse_old",
  "curriculum_provided",
] as const;

const submitSchema = z.object({
  sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
  email: z.string().trim().email().max(320).optional().nullable(),
  frustration: z.enum(TEACHER_FRUSTRATIONS).optional().nullable(),
  planningStyle: z.enum(TEACHER_PLANNING_STYLES).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  subject: z.string().trim().max(120).optional().nullable(),
  gradeLevel: z.string().trim().max(40).optional().nullable(),
  skipped: z.boolean().optional(),
});

const bindSchema = z.object({
  sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
});

export function registerTeacherSignupRoutes(app: Express) {
  // Anonymous upsert — same visitor revising answers updates in place.
  app.post("/api/teacher-signup/submit", async (req: any, res) => {
    try {
      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid teacher signup response" });
        return;
      }
      const ipAddress = typeof req.ip === "string" && req.ip.length > 0 ? req.ip : null;
      const values = {
        email: parsed.data.email ?? null,
        frustration: parsed.data.frustration ?? null,
        planningStyle: parsed.data.planningStyle ?? null,
        country: parsed.data.country ?? null,
        state: parsed.data.state ?? null,
        subject: parsed.data.subject ?? null,
        gradeLevel: parsed.data.gradeLevel ?? null,
        skipped: parsed.data.skipped ?? false,
        ipAddress,
      };
      const existing = await db
        .select({ id: teacherSignupResponses.id })
        .from(teacherSignupResponses)
        .where(eq(teacherSignupResponses.sessionId, parsed.data.sessionId))
        .orderBy(desc(teacherSignupResponses.createdAt))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(teacherSignupResponses)
          .set(values)
          .where(eq(teacherSignupResponses.id, existing[0].id));
        res.json({ id: existing[0].id, updated: true });
        return;
      }
      const [created] = await db
        .insert(teacherSignupResponses)
        .values({ sessionId: parsed.data.sessionId, ...values })
        .returning({ id: teacherSignupResponses.id });
      res.json({ id: created.id, updated: false });
    } catch (error) {
      console.error("Teacher signup submit error:", error);
      res.status(500).json({ error: "Failed to save response" });
    }
  });

  // Attach the pre-signup answers to the new account (called from onboarding).
  app.post("/api/teacher-signup/bind", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = bindSchema.safeParse(req.body);
      if (!userId || !parsed.success) {
        res.status(400).json({ error: "sessionId required and user must be authenticated" });
        return;
      }
      // Only bind rows not already claimed by another account — the sessionId
      // is a high-entropy client secret, and first-writer-wins prevents an
      // authenticated attacker from re-attributing someone else's conversion.
      await db
        .update(teacherSignupResponses)
        .set({ userId, convertedAt: new Date() })
        .where(
          and(
            eq(teacherSignupResponses.sessionId, parsed.data.sessionId),
            isNull(teacherSignupResponses.userId),
          ),
        );
      res.json({ ok: true });
    } catch (error) {
      console.error("Teacher signup bind error:", error);
      res.status(500).json({ error: "Failed to bind response" });
    }
  });

  // Read-only aggregates for the admin Signup Insights page (site_admin+).
  app.get("/api/admin/signup-insights", isAuthenticated, isSiteAdmin, async (_req: any, res) => {
    try {
      const [totals] = await db
        .select({
          total: sql<number>`count(*)::int`,
          withEmail: sql<number>`count(*) filter (where ${teacherSignupResponses.email} is not null)::int`,
          skipped: sql<number>`count(*) filter (where ${teacherSignupResponses.skipped})::int`,
          converted: sql<number>`count(*) filter (where ${teacherSignupResponses.convertedAt} is not null)::int`,
        })
        .from(teacherSignupResponses);

      const breakdown = async (col: any) =>
        db
          .select({
            value: col,
            count: sql<number>`count(*)::int`,
            converted: sql<number>`count(*) filter (where ${teacherSignupResponses.convertedAt} is not null)::int`,
          })
          .from(teacherSignupResponses)
          .where(isNotNull(col))
          .groupBy(col)
          .orderBy(desc(sql`count(*)`));

      const [frustrations, planningStyles, states, subjects, grades] = await Promise.all([
        breakdown(teacherSignupResponses.frustration),
        breakdown(teacherSignupResponses.planningStyle),
        breakdown(teacherSignupResponses.state),
        breakdown(teacherSignupResponses.subject),
        breakdown(teacherSignupResponses.gradeLevel),
      ]);

      // Recent respondents (no full emails for non-converters beyond what the
      // admin needs to follow up — admins ARE the follow-up channel, so we
      // include the captured email + whether they converted).
      const recent = await db
        .select({
          id: teacherSignupResponses.id,
          email: teacherSignupResponses.email,
          frustration: teacherSignupResponses.frustration,
          planningStyle: teacherSignupResponses.planningStyle,
          state: teacherSignupResponses.state,
          subject: teacherSignupResponses.subject,
          gradeLevel: teacherSignupResponses.gradeLevel,
          skipped: teacherSignupResponses.skipped,
          convertedAt: teacherSignupResponses.convertedAt,
          createdAt: teacherSignupResponses.createdAt,
        })
        .from(teacherSignupResponses)
        .orderBy(desc(teacherSignupResponses.createdAt))
        .limit(50);

      res.json({ totals, frustrations, planningStyles, states, subjects, grades, recent });
    } catch (error) {
      console.error("Signup insights error:", error);
      res.status(500).json({ error: "Failed to load signup insights" });
    }
  });
}
