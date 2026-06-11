import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { generatePracticeRequestSchema } from "@shared/schema";
import { generatePracticeSet } from "../practiceGenerator";

// Student Practice generation. Mirrors the lesson generator's guest model:
// anonymous visitors get a small number of free practice sets per month, gated
// behind an email capture. The free quota is shared with lesson generation
// (same guest reservation bucket) so a guest can't bypass the wall by switching
// between the two tools.
export function registerPracticeRoutes(app: Express) {
  const GUEST_PRACTICE_LIMIT = 5;

  const guestKeyFromReq = (req: any) => ({
    guestId: req.guestId as string | undefined,
    ipAddress: (req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown") as string,
  });

  // Authenticated practice generation — no separate metering for now.
  app.post("/api/practice/generate", isAuthenticated, async (req: any, res) => {
    try {
      const validated = generatePracticeRequestSchema.parse(req.body);
      const set = await generatePracticeSet(validated);
      res.json(set);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Practice generation error:", error);
        res
          .status(500)
          .json({ error: error instanceof Error ? error.message : "Failed to generate practice" });
      }
    }
  });

  // Guest practice generation — email gate, then a shared monthly free quota.
  app.post("/api/practice/generate-guest", async (req: any, res) => {
    try {
      const validated = generatePracticeRequestSchema.parse(req.body);

      const lead = await storage.getGuestLead(guestKeyFromReq(req));
      if (!lead) {
        res.status(403).json({
          error: "Email required",
          message: "Enter your email to unlock free practice sets.",
          requiresEmail: true,
        });
        return;
      }

      const { success, currentCount } = await storage.tryReserveGuestLessonGeneration(
        guestKeyFromReq(req),
        GUEST_PRACTICE_LIMIT,
        validated.topic,
      );
      if (!success) {
        res.status(403).json({
          error: "Guest limit reached",
          message: "Create a free account to keep practicing.",
          guestCount: currentCount,
          limit: GUEST_PRACTICE_LIMIT,
          requiresSignup: true,
        });
        return;
      }

      const set = await generatePracticeSet(validated);
      res.json({
        ...set,
        guestUsage: {
          used: currentCount + 1,
          limit: GUEST_PRACTICE_LIMIT,
          remaining: GUEST_PRACTICE_LIMIT - currentCount - 1,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Guest practice generation error:", error);
        res
          .status(500)
          .json({ error: error instanceof Error ? error.message : "Failed to generate practice" });
      }
    }
  });
}
