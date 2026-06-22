import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { generateHomeschoolPlanRequestSchema } from "@shared/schema";
import { generateHomeschoolPlan } from "../homeschoolPlanner";
import { moderateUserInput, safetyHttpResponse } from "../services/contentSafety";

// Homeschool Weekly Planner generation. Mirrors the practice/lesson guest model:
// anonymous visitors get a small number of free plans per month, gated behind an
// email capture. The free quota is shared with lesson + practice generation
// (same guest reservation bucket) so a guest can't bypass the wall by switching
// between the tools.
export function registerHomeschoolRoutes(app: Express) {
  const GUEST_HOMESCHOOL_LIMIT = 5;

  const guestKeyFromReq = (req: any) => ({
    guestId: req.guestId as string | undefined,
    ipAddress: (req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown") as string,
  });

  // Authenticated plan generation — no separate metering for now.
  app.post("/api/homeschool/generate", isAuthenticated, async (req: any, res) => {
    try {
      const validated = generateHomeschoolPlanRequestSchema.parse(req.body);

      const verdict = await moderateUserInput([
        validated.subjects.join(", "),
        validated.interests,
        validated.notes,
      ]);
      const unsafe = safetyHttpResponse(verdict);
      if (unsafe) {
        res.status(unsafe.status).json(unsafe.body);
        return;
      }

      const plan = await generateHomeschoolPlan(validated);
      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Homeschool plan generation error:", error);
        res
          .status(500)
          .json({ error: error instanceof Error ? error.message : "Failed to generate plan" });
      }
    }
  });

  // Guest plan generation — email gate, then a shared monthly free quota.
  app.post("/api/homeschool/generate-guest", async (req: any, res) => {
    try {
      const validated = generateHomeschoolPlanRequestSchema.parse(req.body);

      const verdict = await moderateUserInput([
        validated.subjects.join(", "),
        validated.interests,
        validated.notes,
      ]);
      const unsafe = safetyHttpResponse(verdict);
      if (unsafe) {
        res.status(unsafe.status).json(unsafe.body);
        return;
      }

      const lead = await storage.getGuestLead(guestKeyFromReq(req));
      if (!lead) {
        res.status(403).json({
          error: "Email required",
          message: "Enter your email to unlock free homeschool plans.",
          requiresEmail: true,
        });
        return;
      }

      const { success, currentCount } = await storage.tryReserveGuestLessonGeneration(
        guestKeyFromReq(req),
        GUEST_HOMESCHOOL_LIMIT,
        validated.subjects.join(", "),
      );
      if (!success) {
        res.status(403).json({
          error: "Guest limit reached",
          message: "Create a free account to keep planning.",
          guestCount: currentCount,
          limit: GUEST_HOMESCHOOL_LIMIT,
          requiresSignup: true,
        });
        return;
      }

      const plan = await generateHomeschoolPlan(validated);
      res.json({
        ...plan,
        guestUsage: {
          used: currentCount + 1,
          limit: GUEST_HOMESCHOOL_LIMIT,
          remaining: GUEST_HOMESCHOOL_LIMIT - currentCount - 1,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Guest homeschool plan generation error:", error);
        res
          .status(500)
          .json({ error: error instanceof Error ? error.message : "Failed to generate plan" });
      }
    }
  });
}
