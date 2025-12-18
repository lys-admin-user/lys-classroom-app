import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLessonPlan } from "./openai";
import { parseDocument } from "./documentParser";
import { generateLessonRequestSchema, insertScopeSequenceSchema, insertSequenceUnitSchema, insertScopeChangeRequestSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { randomUUID } from "crypto";
import multer from "multer";
import { syncJurisdictionsFromCSP, syncStandardSetFromCSP, getSyncStatus, fetchCSPJurisdictions } from "./services/cspService";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const saveLessonSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  gradeLevel: z.string().min(1),
  bkdFocus: z.string().min(1),
  standards: z.string().optional(),
  duration: z.string().min(1),
  objectives: z.array(z.string()),
  activities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    duration: z.string(),
    type: z.string(),
  })),
  materials: z.array(z.string()),
  assessment: z.string(),
  reflection: z.string().optional(),
});

const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1),
  bkdPillar: z.enum(["be", "know", "do"]).optional().default("do"),
  linkedCareerId: z.string().optional(),
  targetDate: z.string().min(1, "Target date is required"),
  status: z.string().optional().default("not_started"),
  progress: z.number().optional().default(0),
  milestones: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().optional(),
    reflection: z.string().optional(),
  })).optional().default([]),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  bkdPillar: z.enum(["be", "know", "do"]).optional(),
  linkedCareerId: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.string().optional(),
  progress: z.number().optional(),
  milestones: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().optional(),
    reflection: z.string().optional(),
  })).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup authentication FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // Lesson Plans - Generate (works for all, but saving requires auth)
  app.post("/api/lessons/generate", async (req, res) => {
    try {
      const validated = generateLessonRequestSchema.parse(req.body);
      const generatedPlan = await generateLessonPlan(validated);
      res.json(generatedPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Lesson generation error:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate lesson" });
      }
    }
  });

  // Saved Lessons - requires authentication
  app.get("/api/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const lessons = await storage.getLessons(userId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = saveLessonSchema.parse(req.body);
      const lesson = await storage.createLesson({
        ...validated,
        userId,
      });
      res.json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid lesson data", details: error.errors });
      } else {
        console.error("Save lesson error:", error);
        res.status(500).json({ error: "Failed to save lesson" });
      }
    }
  });

  app.delete("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const deleted = await storage.deleteLesson(req.params.id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  // Toggle lesson sharing (authenticated users only)
  app.post("/api/lessons/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const result = await storage.toggleLessonShare(req.params.id, userId);
      if (!result) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle sharing" });
    }
  });

  // Get shared lesson by share ID (public endpoint)
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const lesson = await storage.getLessonByShareId(req.params.shareId);
      if (!lesson) {
        res.status(404).json({ error: "Shared lesson not found" });
        return;
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared lesson" });
    }
  });

  // Goals - works for all users, but data is session-based for non-auth
  app.get("/api/goals", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const validated = createGoalSchema.parse(req.body);
      const sanitizedMilestones = (validated.milestones || []).map((m) => ({
        ...m,
        id: randomUUID(),
      }));
      const goal = await storage.createGoal({
        ...validated,
        userId,
        milestones: sanitizedMilestones,
      });
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid goal data", details: error.errors });
      } else {
        console.error("Create goal error:", error);
        res.status(500).json({ error: "Failed to create goal" });
      }
    }
  });

  app.patch("/api/goals/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || null;
      const validated = updateGoalSchema.parse(req.body);
      
      let updates: any = { ...validated };
      if (validated.milestones) {
        updates.milestones = validated.milestones.map((m) => ({
          title: m.title,
          completed: m.completed,
          dueDate: m.dueDate,
          reflection: m.reflection,
          id: randomUUID(),
        }));
      }
      
      const updated = await storage.updateGoal(id, updates, userId);
      if (!updated) {
        res.status(404).json({ error: "Goal not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid goal data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update goal" });
      }
    }
  });

  app.delete("/api/goals/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || null;
      const deleted = await storage.deleteGoal(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Goal not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  app.patch("/api/goals/:goalId/milestones/:milestoneId", async (req: any, res) => {
    try {
      const { goalId, milestoneId } = req.params;
      const { completed } = req.body;
      const userId = req.user?.claims?.sub || null;
      const updated = await storage.updateMilestone(goalId, milestoneId, completed, userId);
      if (!updated) {
        res.status(404).json({ error: "Goal or milestone not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // Educator Profiles - requires authentication
  const educatorProfileSchema = z.object({
    country: z.string().optional(),
    state: z.string().optional(),
    standardsName: z.string().optional(),
    schoolDistrict: z.string().optional(),
    schoolName: z.string().optional(),
    gradeLevels: z.array(z.string()).optional().default([]),
    subjects: z.array(z.string()).optional().default([]),
    preferredStandardCodes: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })).optional().default([]),
  });

  app.get("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getEducatorProfile(userId);
      const tier = await storage.getUserTier(userId);
      res.json({ profile: profile || null, tier });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch educator profile" });
    }
  });

  app.post("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = educatorProfileSchema.parse(req.body);
      
      const existing = await storage.getEducatorProfile(userId);
      if (existing) {
        res.status(400).json({ error: "Profile already exists. Use PATCH to update." });
        return;
      }
      
      const profile = await storage.createEducatorProfile({
        userId,
        ...validated,
      });
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid profile data", details: error.errors });
      } else {
        console.error("Create profile error:", error);
        res.status(500).json({ error: "Failed to create educator profile" });
      }
    }
  });

  app.patch("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = educatorProfileSchema.parse(req.body);
      
      let profile = await storage.getEducatorProfile(userId);
      if (!profile) {
        profile = await storage.createEducatorProfile({
          userId,
          ...validated,
        });
      } else {
        profile = await storage.updateEducatorProfile(userId, validated);
      }
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid profile data", details: error.errors });
      } else {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update educator profile" });
      }
    }
  });

  app.post("/api/educator-profile/complete-onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.updateEducatorProfile(userId, {
        onboardingCompleted: new Date(),
      });
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Careers - public
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

  // Resources - public
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

  // Scope and Sequence - requires auth
  app.get("/api/scopes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const scopes = await storage.getScopeSequences(userId);
      res.json(scopes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope sequences" });
    }
  });

  app.get("/api/scopes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const scope = await storage.getScopeSequence(id);
      if (!scope) {
        res.status(404).json({ error: "Scope sequence not found" });
        return;
      }
      // Get units for this scope
      const units = await storage.getSequenceUnits(id);
      res.json({ scope, units });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scope sequence" });
    }
  });

  app.post("/api/scopes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = insertScopeSequenceSchema.parse(req.body);
      const scope = await storage.createScopeSequence({
        ...validated,
        userId,
      });
      res.json(scope);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid scope data", details: error.errors });
      } else {
        console.error("Create scope error:", error);
        res.status(500).json({ error: "Failed to create scope sequence" });
      }
    }
  });

  app.patch("/api/scopes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      const updated = await storage.updateScopeSequence(id, updates, userId);
      if (!updated) {
        res.status(404).json({ error: "Scope not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scope sequence" });
    }
  });

  app.delete("/api/scopes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const deleted = await storage.deleteScopeSequence(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Scope not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scope sequence" });
    }
  });

  // Import Scope from Document with file parsing
  app.post("/api/scopes/import", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const file = req.file;
      
      // Get country and state from query params or use defaults
      const country = req.query.country as string || "United States";
      const state = req.query.state as string || "Texas";
      
      // Determine standards name based on state
      let standardsName = "TEKS";
      if (state === "California") standardsName = "California CCSS";
      else if (state === "Florida") standardsName = "Florida B.E.S.T.";
      else if (state === "New York") standardsName = "NYSLS";
      else if (state === "Common Core") standardsName = "CCSS";
      
      let parsedDoc = null;
      if (file) {
        try {
          parsedDoc = await parseDocument(file.buffer, file.originalname, file.mimetype);
        } catch (parseError) {
          console.error("Document parsing error:", parseError);
        }
      }
      
      const scope = await storage.createScopeSequence({
        userId,
        title: parsedDoc?.title || "Imported Scope & Sequence",
        subject: parsedDoc?.subject || "General",
        gradeLevel: parsedDoc?.gradeLevel || "7",
        country,
        state,
        standardsName,
        schoolYear: "2024-2025",
        totalWeeks: 36,
        status: "draft",
      });
      
      // Create units from parsed document
      if (parsedDoc?.units && parsedDoc.units.length > 0) {
        const unitsPerNineWeeks = Math.ceil(parsedDoc.units.length / 4);
        for (let i = 0; i < parsedDoc.units.length; i++) {
          const parsedUnit = parsedDoc.units[i];
          const startWeek = Math.floor((i * 36) / parsedDoc.units.length) + 1;
          const endWeek = Math.floor(((i + 1) * 36) / parsedDoc.units.length);
          const nineWeeksPeriod = Math.min(4, Math.floor(i / unitsPerNineWeeks) + 1);
          
          await storage.createSequenceUnit({
            scopeId: scope.id,
            unitNumber: i + 1,
            title: parsedUnit.title,
            summary: parsedUnit.description || null,
            transferGoal: null,
            startWeek,
            endWeek,
            nineWeeksPeriod,
            studentsWillKnow: [],
            studentsWillBeSkilled: [],
            standardCodes: [],
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: parsedDoc?.units?.length 
          ? `Imported ${parsedDoc.units.length} units from your document. Review and edit as needed.`
          : "Document imported. Add units to complete your scope.",
        scope,
        unitsCreated: parsedDoc?.units?.length || 0,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Failed to import document" });
    }
  });

  // Sequence Units
  app.post("/api/scopes/:scopeId/units", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      
      // Verify user owns the scope
      const scope = await storage.getScopeSequence(scopeId);
      if (!scope || scope.userId !== userId) {
        res.status(403).json({ error: "Not authorized to add units to this scope" });
        return;
      }
      
      const validated = insertSequenceUnitSchema.parse({ ...req.body, scopeId });
      const unit = await storage.createSequenceUnit(validated);
      res.json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid unit data", details: error.errors });
      } else {
        console.error("Create unit error:", error);
        res.status(500).json({ error: "Failed to create unit" });
      }
    }
  });

  app.patch("/api/units/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      const updated = await storage.updateSequenceUnit(id, updates, userId);
      if (!updated) {
        res.status(404).json({ error: "Unit not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update unit" });
    }
  });

  app.delete("/api/units/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const deleted = await storage.deleteSequenceUnit(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Unit not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });

  // Scope Change Requests (for teacher suggestions on admin-set scopes)
  app.get("/api/scopes/:scopeId/requests", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const requests = await storage.getScopeChangeRequests(scopeId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch change requests" });
    }
  });

  app.post("/api/scopes/:scopeId/requests", isAuthenticated, async (req: any, res) => {
    try {
      const { scopeId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const validated = insertScopeChangeRequestSchema.parse({
        ...req.body,
        scopeId,
        userId,
      });
      const request = await storage.createScopeChangeRequest(validated);
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Create change request error:", error);
        res.status(500).json({ error: "Failed to create change request" });
      }
    }
  });

  app.patch("/api/requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      // Add reviewer info if status is being updated
      if (updates.status === "approved" || updates.status === "rejected") {
        updates.reviewedBy = userId;
        updates.reviewedAt = new Date();
      }
      
      const updated = await storage.updateScopeChangeRequest(id, updates);
      if (!updated) {
        res.status(404).json({ error: "Change request not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update change request" });
    }
  });

  // Get all pending change requests (for campus admin)
  app.get("/api/admin/change-requests", isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getAllPendingChangeRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending change requests" });
    }
  });

  // Self-Discovery Results
  app.get("/api/self-discovery/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const results = await storage.getSelfDiscoveryResults(userId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch self-discovery results" });
    }
  });

  app.post("/api/self-discovery/results", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const result = await storage.saveSelfDiscoveryResult({
        ...req.body,
        userId,
      });
      res.json(result);
    } catch (error) {
      console.error("Save self-discovery result error:", error);
      res.status(500).json({ error: "Failed to save self-discovery result" });
    }
  });

  // Saved Careers
  app.get("/api/saved-careers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const careers = await storage.getSavedCareers(userId);
      res.json(careers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved careers" });
    }
  });

  app.post("/api/saved-careers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const career = await storage.saveCareer({
        ...req.body,
        userId,
      });
      res.json(career);
    } catch (error) {
      console.error("Save career error:", error);
      res.status(500).json({ error: "Failed to save career" });
    }
  });

  app.delete("/api/saved-careers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteSavedCareer(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Saved career not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete saved career" });
    }
  });

  // Affiliate System - Get or create affiliate profile
  app.get("/api/affiliate/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      let affiliate = await storage.getEducatorAffiliate(userId);
      
      if (!affiliate) {
        const referralCode = `LYS${userId.substring(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        affiliate = await storage.createEducatorAffiliate({
          userId,
          referralCode,
          displayName: req.user?.claims?.name || null,
          isActive: true,
        });
      }
      
      res.json(affiliate);
    } catch (error) {
      console.error("Get affiliate error:", error);
      res.status(500).json({ error: "Failed to get affiliate profile" });
    }
  });

  // Get affiliate dashboard with stats
  app.get("/api/affiliate/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      let affiliate = await storage.getEducatorAffiliate(userId);
      
      if (!affiliate) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }
      
      const recentEvents = await storage.getReferralEvents(affiliate.id, 20);
      const rewards = await storage.getAffiliateRewards(affiliate.id);
      
      res.json({
        affiliate,
        recentEvents,
        rewards,
      });
    } catch (error) {
      console.error("Get affiliate dashboard error:", error);
      res.status(500).json({ error: "Failed to get affiliate dashboard" });
    }
  });

  // Update affiliate profile
  app.patch("/api/affiliate/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { displayName, bio } = req.body;
      
      const updated = await storage.updateEducatorAffiliate(userId, {
        displayName,
        bio,
      });
      
      if (!updated) {
        res.status(404).json({ error: "Affiliate profile not found" });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update affiliate error:", error);
      res.status(500).json({ error: "Failed to update affiliate profile" });
    }
  });

  // Track referral event (public endpoint for shared lesson views)
  app.post("/api/referral/track", async (req, res) => {
    try {
      const { shareId, referralCode, eventType, channel, visitorId } = req.body;
      
      if (!eventType) {
        res.status(400).json({ error: "Event type is required" });
        return;
      }
      
      let affiliate;
      if (referralCode) {
        affiliate = await storage.getEducatorAffiliateByCode(referralCode);
      } else if (shareId) {
        const lesson = await storage.getLessonByShareId(shareId);
        if (lesson) {
          affiliate = await storage.getEducatorAffiliate(lesson.userId);
        }
      }
      
      if (!affiliate) {
        res.status(404).json({ error: "Invalid referral" });
        return;
      }
      
      const pointsMap: Record<string, number> = {
        view: 1,
        share: 5,
        copy_link: 2,
        signup: 50,
        lesson_save: 25,
      };
      
      const event = await storage.createReferralEvent({
        affiliateId: affiliate.id,
        shareId: shareId || null,
        eventType,
        channel: channel || "direct",
        visitorId: visitorId || null,
        pointsEarned: pointsMap[eventType] || 0,
      });
      
      if (pointsMap[eventType] && pointsMap[eventType] > 0) {
        await storage.createAffiliateReward({
          affiliateId: affiliate.id,
          points: pointsMap[eventType],
          rewardType: "earned",
          description: `${eventType} from ${channel || "direct"} link`,
          eventId: event.id,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Track referral error:", error);
      res.status(500).json({ error: "Failed to track referral" });
    }
  });

  // Generate share URL with referral code
  app.post("/api/lessons/:id/share-link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { channel } = req.body;
      
      const lesson = await storage.getLesson(id);
      if (!lesson || lesson.userId !== userId) {
        res.status(404).json({ error: "Lesson not found or not authorized" });
        return;
      }
      
      let shareId = lesson.shareId;
      if (!shareId) {
        const result = await storage.toggleLessonShare(id, userId);
        shareId = result?.shareId || null;
      }
      
      let affiliate = await storage.getEducatorAffiliate(userId);
      if (!affiliate) {
        const referralCode = `LYS${userId.substring(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        affiliate = await storage.createEducatorAffiliate({
          userId,
          referralCode,
          displayName: req.user?.claims?.name || null,
          isActive: true,
        });
      }
      
      if (channel) {
        await storage.createReferralEvent({
          affiliateId: affiliate.id,
          lessonId: id,
          shareId,
          eventType: "share",
          channel,
          pointsEarned: 5,
        });
        
        await storage.createAffiliateReward({
          affiliateId: affiliate.id,
          points: 5,
          rewardType: "earned",
          description: `Shared lesson via ${channel}`,
        });
      }
      
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const shareUrl = `${baseUrl}/shared/${shareId}?ref=${affiliate.referralCode}`;
      
      res.json({
        shareUrl,
        shareId,
        referralCode: affiliate.referralCode,
      });
    } catch (error) {
      console.error("Generate share link error:", error);
      res.status(500).json({ error: "Failed to generate share link" });
    }
  });

  // ================================
  // Educational Standards Admin API
  // ================================

  // Get sync status and statistics
  app.get("/api/admin/standards/status", isAuthenticated, async (req: any, res) => {
    try {
      const status = await getSyncStatus();
      res.json(status);
    } catch (error) {
      console.error("Get standards status error:", error);
      res.status(500).json({ error: "Failed to get standards status" });
    }
  });

  // Get all jurisdictions (from database)
  app.get("/api/admin/standards/jurisdictions", isAuthenticated, async (req: any, res) => {
    try {
      const country = req.query.country as string | undefined;
      const jurisdictions = await storage.getJurisdictions(country);
      res.json(jurisdictions);
    } catch (error) {
      console.error("Get jurisdictions error:", error);
      res.status(500).json({ error: "Failed to get jurisdictions" });
    }
  });

  // Get standard sets for a jurisdiction
  app.get("/api/admin/standards/jurisdictions/:id/sets", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const sets = await storage.getStandardSets(id);
      res.json(sets);
    } catch (error) {
      console.error("Get standard sets error:", error);
      res.status(500).json({ error: "Failed to get standard sets" });
    }
  });

  // Get individual standards for a standard set
  app.get("/api/admin/standards/sets/:id/standards", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const standards = await storage.getEducationalStandards(id);
      res.json(standards);
    } catch (error) {
      console.error("Get standards error:", error);
      res.status(500).json({ error: "Failed to get standards" });
    }
  });

  // Sync jurisdictions from CSP (Tier 1)
  app.post("/api/admin/standards/sync/jurisdictions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const result = await syncJurisdictionsFromCSP(userId);
      res.json(result);
    } catch (error) {
      console.error("Sync jurisdictions error:", error);
      res.status(500).json({ error: "Failed to sync jurisdictions" });
    }
  });

  // Sync a specific standard set from CSP
  app.post("/api/admin/standards/sync/standard-set", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { externalSetId, jurisdictionId } = req.body;
      
      if (!externalSetId || !jurisdictionId) {
        res.status(400).json({ error: "Missing externalSetId or jurisdictionId" });
        return;
      }
      
      const result = await syncStandardSetFromCSP(externalSetId, jurisdictionId, userId);
      res.json(result);
    } catch (error) {
      console.error("Sync standard set error:", error);
      res.status(500).json({ error: "Failed to sync standard set" });
    }
  });

  // Get available jurisdictions from CSP API (for discovery)
  app.get("/api/admin/standards/csp/jurisdictions", isAuthenticated, async (req: any, res) => {
    try {
      const jurisdictions = await fetchCSPJurisdictions();
      res.json(jurisdictions);
    } catch (error) {
      console.error("Fetch CSP jurisdictions error:", error);
      res.status(500).json({ error: "Failed to fetch CSP jurisdictions" });
    }
  });

  // Get sync logs
  app.get("/api/admin/standards/sync-logs", isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getLatestSyncLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Get sync logs error:", error);
      res.status(500).json({ error: "Failed to get sync logs" });
    }
  });

  // Public API to get standards for lesson planning (used by frontend)
  app.get("/api/standards/countries", async (req, res) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      const countries = [...new Set(jurisdictions.map(j => j.country))];
      res.json(countries);
    } catch (error) {
      console.error("Get countries error:", error);
      res.status(500).json({ error: "Failed to get countries" });
    }
  });

  app.get("/api/standards/states/:country", async (req, res) => {
    try {
      const { country } = req.params;
      const jurisdictions = await storage.getJurisdictions(country);
      res.json(jurisdictions.map(j => ({
        state: j.name,
        abbreviation: j.abbreviation,
        standardsName: j.standardsName,
      })));
    } catch (error) {
      console.error("Get states error:", error);
      res.status(500).json({ error: "Failed to get states" });
    }
  });

  app.get("/api/standards/subjects/:country/:stateAbbr", async (req, res) => {
    try {
      const { country, stateAbbr } = req.params;
      const jurisdiction = await storage.getJurisdictionByAbbr(country, stateAbbr);
      if (!jurisdiction) {
        res.json([]);
        return;
      }
      const sets = await storage.getStandardSets(jurisdiction.id);
      const subjects = [...new Set(sets.map(s => s.subject))];
      res.json(subjects.map(subject => ({ subject })));
    } catch (error) {
      console.error("Get subjects error:", error);
      res.status(500).json({ error: "Failed to get subjects" });
    }
  });

  app.get("/api/standards/codes/:country/:stateAbbr/:subject", async (req, res) => {
    try {
      const { country, stateAbbr, subject } = req.params;
      const jurisdiction = await storage.getJurisdictionByAbbr(country, stateAbbr);
      if (!jurisdiction) {
        res.json([]);
        return;
      }
      const sets = await storage.getStandardSets(jurisdiction.id);
      const subjectSet = sets.find(s => s.subject === subject);
      if (!subjectSet) {
        res.json([]);
        return;
      }
      const standards = await storage.getEducationalStandards(subjectSet.id);
      res.json(standards.map(s => ({
        code: s.humanCoding,
        description: s.statement,
      })));
    } catch (error) {
      console.error("Get standard codes error:", error);
      res.status(500).json({ error: "Failed to get standard codes" });
    }
  });

  return httpServer;
}
