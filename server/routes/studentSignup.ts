import type { Express } from "express";
import { z } from "zod";
import { eq, desc, isNull, and } from "drizzle-orm";
import { db } from "../db";
import { studentSignupResponses } from "@shared/schema";
import { isAuthenticated } from "../replit_integrations/auth";
import { ANALYZER_SESSION_REGEX } from "./_helpers";
import { requireCaptcha } from "../services/captcha";

// ===== Student pre-signup quiz ===============================================
// Short pain-point quiz shown to students before account creation. Answers map
// to a recommended feature that gets spotlighted during signup and on the
// student home. The optional email capture is the student lead channel
// (replaces the retired practice-generator guest gate). Anonymous by design —
// keyed by a localStorage sessionId like the teacher quiz; after signup the
// onboarding flow calls /bind.

export const STUDENT_PAIN_POINTS = [
  "career_direction",
  "know_strengths",
  "stay_on_track",
  "show_work",
] as const;

export const STUDENT_MOTIVATIONS = [
  "real_world",
  "clear_plan",
  "recognition",
  "confidence",
] as const;

export const STUDENT_RECOMMENDED_FEATURES = [
  "careers",
  "self_discovery",
  "goals",
  "portfolio",
] as const;

// Server-side mapping so the stored recommendation can't be spoofed into
// arbitrary strings — the client sends the pain point, we derive the feature.
export const PAIN_POINT_TO_FEATURE: Record<
  (typeof STUDENT_PAIN_POINTS)[number],
  (typeof STUDENT_RECOMMENDED_FEATURES)[number]
> = {
  career_direction: "careers",
  know_strengths: "self_discovery",
  stay_on_track: "goals",
  show_work: "portfolio",
};

const submitSchema = z.object({
  sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
  email: z.string().trim().email().max(320).optional().nullable(),
  painPoint: z.enum(STUDENT_PAIN_POINTS).optional().nullable(),
  motivation: z.enum(STUDENT_MOTIVATIONS).optional().nullable(),
  gradeLevel: z.string().trim().max(40).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  skipped: z.boolean().optional(),
});

const bindSchema = z.object({
  sessionId: z.string().regex(ANALYZER_SESSION_REGEX),
});

export function registerStudentSignupRoutes(app: Express) {
  // Anonymous upsert — same visitor revising answers updates in place.
  app.post("/api/student-signup/submit", requireCaptcha(), async (req: any, res) => {
    try {
      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid student signup response" });
        return;
      }
      const ipAddress = typeof req.ip === "string" && req.ip.length > 0 ? req.ip : null;
      const recommendedFeature = parsed.data.painPoint
        ? PAIN_POINT_TO_FEATURE[parsed.data.painPoint]
        : null;
      const values = {
        email: parsed.data.email ?? null,
        painPoint: parsed.data.painPoint ?? null,
        motivation: parsed.data.motivation ?? null,
        gradeLevel: parsed.data.gradeLevel ?? null,
        state: parsed.data.state ?? null,
        recommendedFeature,
        skipped: parsed.data.skipped ?? false,
        ipAddress,
      };
      const existing = await db
        .select({ id: studentSignupResponses.id })
        .from(studentSignupResponses)
        .where(eq(studentSignupResponses.sessionId, parsed.data.sessionId))
        .orderBy(desc(studentSignupResponses.createdAt))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(studentSignupResponses)
          .set(values)
          .where(eq(studentSignupResponses.id, existing[0].id));
        res.json({ id: existing[0].id, recommendedFeature, updated: true });
        return;
      }
      const [created] = await db
        .insert(studentSignupResponses)
        .values({ sessionId: parsed.data.sessionId, ...values })
        .returning({ id: studentSignupResponses.id });
      res.json({ id: created.id, recommendedFeature, updated: false });
    } catch (error) {
      console.error("Student signup submit error:", error);
      res.status(500).json({ error: "Failed to save response" });
    }
  });

  // Attach the pre-signup answers to the new account (called from onboarding).
  // First-writer-wins, same rationale as the teacher quiz bind.
  app.post("/api/student-signup/bind", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const parsed = bindSchema.safeParse(req.body);
      if (!userId || !parsed.success) {
        res.status(400).json({ error: "sessionId required and user must be authenticated" });
        return;
      }
      await db
        .update(studentSignupResponses)
        .set({ userId, convertedAt: new Date() })
        .where(
          and(
            eq(studentSignupResponses.sessionId, parsed.data.sessionId),
            isNull(studentSignupResponses.userId),
          ),
        );
      res.json({ ok: true });
    } catch (error) {
      console.error("Student signup bind error:", error);
      res.status(500).json({ error: "Failed to bind response" });
    }
  });
}
