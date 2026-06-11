import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { demoRequestSchema } from "@shared/schema";

// Public "Request a demo" capture for the school-admin /for-schools page.
export function registerDemoRoutes(app: Express) {
  app.post("/api/demo-requests", async (req, res) => {
    try {
      const validated = demoRequestSchema.parse(req.body);
      await storage.createDemoRequest(validated);
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Demo request error:", error);
        res.status(500).json({ error: "Failed to submit your request. Please try again." });
      }
    }
  });
}
