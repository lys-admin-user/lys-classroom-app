import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLessonPlan } from "./openai";
import { generateLessonRequestSchema, insertGoalSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Lesson Plans
  app.get("/api/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessonPlans();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons/generate", async (req, res) => {
    try {
      const validated = generateLessonRequestSchema.parse(req.body);
      const generatedPlan = await generateLessonPlan(validated);
      const savedPlan = await storage.createLessonPlan(generatedPlan);
      res.json(savedPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Lesson generation error:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate lesson" });
      }
    }
  });

  // Goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const validated = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(validated);
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create goal" });
      }
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateGoal(id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGoal(id);
      if (!deleted) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  app.patch("/api/goals/:goalId/milestones/:milestoneId", async (req, res) => {
    try {
      const { goalId, milestoneId } = req.params;
      const { completed } = req.body;
      const updated = await storage.updateMilestone(goalId, milestoneId, completed);
      if (!updated) {
        res.status(404).json({ error: "Goal or milestone not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // Careers
  app.get("/api/careers", async (req, res) => {
    try {
      const careers = await storage.getCareers();
      res.json(careers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  app.get("/api/careers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const career = await storage.getCareer(id);
      if (!career) {
        res.status(404).json({ error: "Career not found" });
        return;
      }
      res.json(career);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch career" });
    }
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getResource(id);
      if (!resource) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  return httpServer;
}
