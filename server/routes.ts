import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLessonPlan } from "./openai";
import { parseDocument } from "./documentParser";
import { generateLessonRequestSchema, insertScopeSequenceSchema, insertSequenceUnitSchema, insertScopeChangeRequestSchema, users, insertFeatureFlagSchema, insertEmailTemplateSchema, type Lesson, type Goal } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { randomUUID } from "crypto";
import multer from "multer";
import { syncJurisdictionsFromCSP, syncStandardSetFromCSP, getSyncStatus, fetchCSPJurisdictions } from "./services/cspService";
import { extractStandardsFromText, processPdfImport, checkSourceForChanges } from "./services/llmExtractionService";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

const updatePreferencesSchema = z.object({
  language: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  jurisdictionId: z.string().optional(),
  standardSetId: z.string().optional(),
  needsAnalysis: z.object({
    primaryGoal: z.string().optional(),
    interests: z.array(z.string()).optional(),
    experienceLevel: z.string().optional(),
    recommendedFeatures: z.array(z.string()).optional(),
  }).optional(),
});

const completeOnboardingSchema = z.object({
  role: z.enum(["student", "educator", "campus_admin"]).optional(),
  preferences: z.object({
    language: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    jurisdictionId: z.string().optional(),
    standardSetId: z.string().optional(),
  }).optional(),
  needsAnalysis: z.object({
    primaryGoal: z.string(),
    interests: z.array(z.string()),
    experienceLevel: z.string().default("beginner"),
    recommendedFeatures: z.array(z.string()),
  }),
});

const updateRoleSchema = z.object({
  role: z.enum(["student", "educator", "campus_admin"]),
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
      // Mark onboarding complete on user record
      const user = await storage.completeOnboarding(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
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

  // ================================
  // User Preferences & Onboarding
  // ================================

  // Get user preferences
  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || {});
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  // Update user preferences
  app.patch("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = updatePreferencesSchema.parse(req.body);
      const prefs = await storage.updateUserPreferences(userId, validated as any);
      res.json(prefs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid preferences data", details: error.errors });
        return;
      }
      console.error("Update preferences error:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Complete onboarding
  app.post("/api/onboarding/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = completeOnboardingSchema.parse(req.body);
      const { role, preferences, needsAnalysis } = validated;
      
      // Update user role
      if (role) {
        await storage.updateUserRole(userId, role);
      }
      
      // Save preferences with needs analysis
      await storage.updateUserPreferences(userId, {
        ...preferences,
        needsAnalysis: needsAnalysis as any,
      });
      
      // Mark onboarding complete
      const user = await storage.completeOnboarding(userId);
      
      res.json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid onboarding data", details: error.errors });
        return;
      }
      console.error("Complete onboarding error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Update user role
  app.patch("/api/user/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const validated = updateRoleSchema.parse(req.body);
      const user = await storage.updateUserRole(userId, validated.role);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid role data", details: error.errors });
        return;
      }
      console.error("Update role error:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // ================================
  // Assignment System (Paid Feature)
  // ================================

  // Helper to check paid tier
  const requirePaidTier = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tier = await storage.getUserTier(userId);
    if (tier === "free") {
      res.status(403).json({ 
        error: "Paid subscription required",
        message: "Assignment generation is a Pro/Campus feature. Upgrade your plan to access this feature.",
        requiredTier: "pro"
      });
      return;
    }
    next();
  };

  // Get accommodation suggestions
  app.get("/api/accommodations/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      const { accommodationSuggestions } = await import("@shared/schema");
      const suggestions = type 
        ? accommodationSuggestions.filter(s => s.type === type)
        : accommodationSuggestions;
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get accommodation suggestions" });
    }
  });

  // Generate assignment from lesson (PAID FEATURE)
  app.post("/api/assignments/generate", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { lessonId, assignmentType, questionCount, difficulty, includeBeKnowDo, accommodationType, accommodationNotes } = req.body;
      
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      
      if (lesson.userId !== userId) {
        res.status(403).json({ error: "You can only generate assignments from your own lessons" });
        return;
      }
      
      const { generateAssignment } = await import("./assignmentGenerator");
      const generated = await generateAssignment({
        lesson,
        assignmentType: assignmentType || "quiz",
        questionCount: questionCount || 5,
        difficulty: difficulty || "medium",
        includeBeKnowDo: includeBeKnowDo !== false,
        accommodationType,
        accommodationNotes,
      });
      
      res.json(generated);
    } catch (error) {
      console.error("Generate assignment error:", error);
      res.status(500).json({ error: "Failed to generate assignment" });
    }
  });

  // Save assignment (PAID FEATURE)
  app.post("/api/assignments", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const assignment = await storage.createAssignment({
        ...req.body,
        userId,
      });
      res.json(assignment);
    } catch (error) {
      console.error("Create assignment error:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // Get user's assignments
  app.get("/api/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const assignmentsList = await storage.getAssignments(userId);
      res.json(assignmentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Get single assignment
  app.get("/api/assignments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        res.status(404).json({ error: "Assignment not found" });
        return;
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  // Update assignment
  app.patch("/api/assignments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateAssignment(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Assignment not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  // Delete assignment
  app.delete("/api/assignments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteAssignment(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Assignment not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  // Assign to recipients (student, group, or class)
  app.post("/api/assignments/:id/assign", isAuthenticated, requirePaidTier, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { recipientType, recipientIds } = req.body;
      
      const assignment = await storage.getAssignment(id);
      if (!assignment || assignment.userId !== userId) {
        res.status(404).json({ error: "Assignment not found or not authorized" });
        return;
      }
      
      const recipients = [];
      for (const recipientId of recipientIds) {
        const recipient = await storage.createAssignmentRecipient({
          assignmentId: id,
          recipientType,
          recipientId,
          status: "assigned",
        });
        recipients.push(recipient);
      }
      
      res.json({ success: true, recipients });
    } catch (error) {
      console.error("Assign error:", error);
      res.status(500).json({ error: "Failed to assign" });
    }
  });

  // Classes management
  app.get("/api/classes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const classesList = await storage.getClasses(userId);
      res.json(classesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const newClass = await storage.createClass({
        ...req.body,
        userId,
      });
      res.json(newClass);
    } catch (error) {
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.patch("/api/classes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateClass(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Class not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteClass(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Class not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  // Students management
  app.get("/api/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const studentsList = await storage.getStudents(userId);
      res.json(studentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const student = await storage.createStudent({
        ...req.body,
        userId,
      });
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  app.patch("/api/students/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateStudent(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Student not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteStudent(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Student not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Class-student enrollment
  app.get("/api/classes/:id/students", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const studentsList = await storage.getClassStudents(id);
      res.json(studentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class students" });
    }
  });

  app.post("/api/classes/:id/students", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      const enrollment = await storage.addStudentToClass(id, studentId);
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to add student to class" });
    }
  });

  app.delete("/api/classes/:classId/students/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const { classId, studentId } = req.params;
      await storage.removeStudentFromClass(classId, studentId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove student from class" });
    }
  });

  // Student groups
  app.get("/api/student-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groups = await storage.getStudentGroups(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student groups" });
    }
  });

  app.post("/api/student-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const group = await storage.createStudentGroup({
        ...req.body,
        userId,
      });
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to create student group" });
    }
  });

  app.patch("/api/student-groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateStudentGroup(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Group not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update student group" });
    }
  });

  app.delete("/api/student-groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteStudentGroup(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Group not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student group" });
    }
  });

  // ================================
  // Real-Time Collaboration System
  // ================================

  // Generate unique invite code
  function generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create collaboration session
  app.post("/api/collaboration/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { title, description, lessonId, sessionType, maxParticipants, settings } = req.body;
      
      const session = await storage.createCollaborationSession({
        hostUserId: userId,
        title,
        description,
        lessonId,
        sessionType: sessionType || "lesson_planning",
        status: "active",
        inviteCode: generateInviteCode(),
        maxParticipants: maxParticipants || 10,
        settings: settings || {
          allowEditing: true,
          allowChat: true,
          allowComments: true,
          requireApproval: false,
        },
      });
      
      await storage.createSessionParticipant({
        sessionId: session.id,
        userId,
        role: "host",
        status: "active",
      });
      
      res.json(session);
    } catch (error) {
      console.error("Create collaboration session error:", error);
      res.status(500).json({ error: "Failed to create collaboration session" });
    }
  });

  // Get user's hosted sessions
  app.get("/api/collaboration/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessions = await storage.getCollaborationSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collaboration sessions" });
    }
  });

  // Get sessions user is participating in
  app.get("/api/collaboration/participating", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessions = await storage.getUserParticipatedSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participated sessions" });
    }
  });

  // Get single session
  app.get("/api/collaboration/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getCollaborationSession(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      
      const participants = await storage.getActiveSessionParticipants(id);
      res.json({ session, participants });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Join session by invite code
  app.post("/api/collaboration/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { inviteCode } = req.body;
      
      const session = await storage.getCollaborationSessionByInviteCode(inviteCode);
      if (!session) {
        res.status(404).json({ error: "Invalid invite code" });
        return;
      }
      
      if (session.status !== "active") {
        res.status(400).json({ error: "This session has ended" });
        return;
      }
      
      const existingParticipant = await storage.getSessionParticipant(session.id, userId);
      if (existingParticipant) {
        await storage.updateSessionParticipant(existingParticipant.id, { status: "active" });
        res.json({ session, participant: existingParticipant });
        return;
      }
      
      const activeParticipants = await storage.getActiveSessionParticipants(session.id);
      if (session.maxParticipants && activeParticipants.length >= session.maxParticipants) {
        res.status(400).json({ error: "Session is full" });
        return;
      }
      
      const participant = await storage.createSessionParticipant({
        sessionId: session.id,
        userId,
        role: "editor",
        status: "active",
      });
      
      res.json({ session, participant });
    } catch (error) {
      console.error("Join session error:", error);
      res.status(500).json({ error: "Failed to join session" });
    }
  });

  // End collaboration session
  app.post("/api/collaboration/sessions/:id/end", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      const session = await storage.endCollaborationSession(id, userId);
      if (!session) {
        res.status(404).json({ error: "Session not found or not authorized" });
        return;
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Leave session
  app.post("/api/collaboration/sessions/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      
      await storage.leaveSession(id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave session" });
    }
  });

  // Get session messages
  app.get("/api/collaboration/sessions/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getCollaborationMessages(id, 100);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get session edit history
  app.get("/api/collaboration/sessions/:id/history", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getSessionEditHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch edit history" });
    }
  });

  // ================================
  // Shared Resources Library
  // ================================

  // Get public shared resources
  app.get("/api/shared-resources", async (req, res) => {
    try {
      const { category, subject } = req.query;
      const resources = await storage.getSharedResources({ 
        visibility: "public",
        category: category as string,
        subject: subject as string,
      });
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared resources" });
    }
  });

  // Get user's shared resources
  app.get("/api/shared-resources/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const resources = await storage.getUserSharedResources(userId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your resources" });
    }
  });

  // Get single shared resource
  app.get("/api/shared-resources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getSharedResource(id);
      if (!resource) {
        res.status(404).json({ error: "Resource not found" });
        return;
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  // Create shared resource
  app.post("/api/shared-resources", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const resource = await storage.createSharedResource({
        ...req.body,
        userId,
      });
      res.json(resource);
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  // Update shared resource
  app.patch("/api/shared-resources/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const updated = await storage.updateSharedResource(id, req.body, userId);
      if (!updated) {
        res.status(404).json({ error: "Resource not found or not authorized" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  // Delete shared resource
  app.delete("/api/shared-resources/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const deleted = await storage.deleteSharedResource(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Resource not found or not authorized" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  // Like/unlike shared resource
  app.post("/api/shared-resources/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const liked = await storage.toggleResourceLike(id, userId);
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Track shared resource download
  app.post("/api/shared-resources/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementResourceDownload(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track download" });
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
      const countries = Array.from(new Set(jurisdictions.map(j => j.country)));
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
      const subjects = Array.from(new Set(sets.map(s => s.subject)));
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

  // ================================
  // Standards Staging Queue (Approval Workflow)
  // ================================

  // Get staging standards (pending, approved, rejected)
  app.get("/api/admin/standards/staging", isAuthenticated, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const staging = await storage.getStagingStandards(status);
      res.json(staging);
    } catch (error) {
      console.error("Get staging standards error:", error);
      res.status(500).json({ error: "Failed to get staging standards" });
    }
  });

  // Approve a staging standard
  app.post("/api/admin/standards/staging/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const result = await storage.approveStagingStandard(id, userId);
      if (!result) {
        res.status(404).json({ error: "Staging standard not found" });
        return;
      }
      res.json({ success: true, standard: result });
    } catch (error) {
      console.error("Approve staging error:", error);
      res.status(500).json({ error: "Failed to approve staging standard" });
    }
  });

  // Reject a staging standard
  app.post("/api/admin/standards/staging/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await storage.rejectStagingStandard(id, userId, reason || "No reason provided");
      if (!result) {
        res.status(404).json({ error: "Staging standard not found" });
        return;
      }
      res.json({ success: true, staging: result });
    } catch (error) {
      console.error("Reject staging error:", error);
      res.status(500).json({ error: "Failed to reject staging standard" });
    }
  });

  // Bulk approve staging standards
  app.post("/api/admin/standards/staging/bulk-approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "No IDs provided" });
        return;
      }
      let approved = 0;
      for (const id of ids) {
        const result = await storage.approveStagingStandard(id, userId);
        if (result) approved++;
      }
      res.json({ success: true, approved });
    } catch (error) {
      console.error("Bulk approve error:", error);
      res.status(500).json({ error: "Failed to bulk approve" });
    }
  });

  // ================================
  // LLM Extraction (Tier 3)
  // ================================

  // Extract standards from text using LLM
  app.post("/api/admin/standards/extract", isAuthenticated, async (req: any, res) => {
    try {
      const { rawText, jurisdictionName, subject, gradeLevel } = req.body;
      if (!rawText || !jurisdictionName) {
        res.status(400).json({ error: "Missing rawText or jurisdictionName" });
        return;
      }
      const result = await extractStandardsFromText(rawText, jurisdictionName, subject, gradeLevel);
      res.json(result);
    } catch (error) {
      console.error("LLM extraction error:", error);
      res.status(500).json({ error: "Failed to extract standards" });
    }
  });

  // Process a PDF import
  app.post("/api/admin/standards/pdf/:id/process", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await processPdfImport(id);
      res.json(result);
    } catch (error) {
      console.error("PDF process error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  // ================================
  // Change Detection (Watchdog)
  // ================================

  // Check a source URL for changes
  app.post("/api/admin/standards/check-source", isAuthenticated, async (req: any, res) => {
    try {
      const { sourceUrl } = req.body;
      if (!sourceUrl) {
        res.status(400).json({ error: "Missing sourceUrl" });
        return;
      }
      const result = await checkSourceForChanges(sourceUrl);
      res.json(result);
    } catch (error) {
      console.error("Check source error:", error);
      res.status(500).json({ error: "Failed to check source" });
    }
  });

  // Get all sources with detected changes
  app.get("/api/admin/standards/changed-sources", isAuthenticated, async (req: any, res) => {
    try {
      const sources = await storage.getChangedSources();
      res.json(sources);
    } catch (error) {
      console.error("Get changed sources error:", error);
      res.status(500).json({ error: "Failed to get changed sources" });
    }
  });

  // Deprecate a standard (soft delete)
  app.post("/api/admin/standards/:id/deprecate", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await storage.deprecateStandard(id);
      if (!result) {
        res.status(404).json({ error: "Standard not found" });
        return;
      }
      res.json({ success: true, standard: result });
    } catch (error) {
      console.error("Deprecate standard error:", error);
      res.status(500).json({ error: "Failed to deprecate standard" });
    }
  });

  // ================================
  // Site Administration & Multi-Tenant
  // ================================

  // Middleware to check if user is a site admin
  const isSiteAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const isAdmin = await storage.isSiteAdmin(userId);
    if (!isAdmin) {
      res.status(403).json({ error: "Site admin access required" });
      return;
    }
    next();
  };

  // Check if current user is site admin
  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isAdmin = await storage.isSiteAdmin(userId);
      res.json({ isSiteAdmin: isAdmin });
    } catch (error) {
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  // Get all site admins (site admin only)
  app.get("/api/admin/site-admins", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const admins = await storage.getSiteAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site admins" });
    }
  });

  // Add site admin (site admin only)
  app.post("/api/admin/site-admins", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { userId, permissions } = req.body;
      const createdBy = req.user?.claims?.sub;
      const admin = await storage.createSiteAdmin({ userId, permissions, createdBy });
      res.json(admin);
    } catch (error) {
      res.status(500).json({ error: "Failed to create site admin" });
    }
  });

  // Remove site admin (site admin only)
  app.delete("/api/admin/site-admins/:userId", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteSiteAdmin(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove site admin" });
    }
  });

  // Get all organizations (site admin only)
  app.get("/api/admin/organizations", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const orgs = await storage.getOrganizations();
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Create organization (site admin only)
  app.post("/api/admin/organizations", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const org = await storage.createOrganization(req.body);
      res.json(org);
    } catch (error) {
      console.error("Create org error:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  // Update organization (site admin only)
  app.patch("/api/admin/organizations/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateOrganization(id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  // Delete organization (site admin only)
  app.delete("/api/admin/organizations/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteOrganization(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  // =============== Feature Flags Routes ===============
  
  // Get all feature flags (site admin only)
  app.get("/api/admin/feature-flags", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feature flags" });
    }
  });

  // Create feature flag (site admin only)
  app.post("/api/admin/feature-flags", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const parsed = insertFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid feature flag data", details: parsed.error.flatten() });
        return;
      }
      const flag = await storage.createFeatureFlag(parsed.data);
      res.json(flag);
    } catch (error) {
      res.status(500).json({ error: "Failed to create feature flag" });
    }
  });

  // Update feature flag (site admin only)
  app.patch("/api/admin/feature-flags/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertFeatureFlagSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid feature flag data", details: parsed.error.flatten() });
        return;
      }
      const updated = await storage.updateFeatureFlag(id, parsed.data as any);
      if (!updated) {
        res.status(404).json({ error: "Feature flag not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update feature flag" });
    }
  });

  // Delete feature flag (site admin only)
  app.delete("/api/admin/feature-flags/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFeatureFlag(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete feature flag" });
    }
  });

  // =============== Email Templates Routes ===============
  
  // Get all email templates (site admin only)
  app.get("/api/admin/email-templates", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  // Create email template (site admin only)
  app.post("/api/admin/email-templates", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const parsed = insertEmailTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid email template data", details: parsed.error.flatten() });
        return;
      }
      const template = await storage.createEmailTemplate(parsed.data);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create email template" });
    }
  });

  // Update email template (site admin only)
  app.patch("/api/admin/email-templates/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateSchema = insertEmailTemplateSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid email template data", details: parsed.error.flatten() });
        return;
      }
      const updated = await storage.updateEmailTemplate(id, parsed.data as any);
      if (!updated) {
        res.status(404).json({ error: "Email template not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update email template" });
    }
  });

  // Delete email template (site admin only)
  app.delete("/api/admin/email-templates/:id", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete email template" });
    }
  });

  // Get organization members (site admin or org admin)
  app.get("/api/admin/organizations/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const membership = await storage.getOrgMembership(id, userId);
      
      if (!isSiteAdminUser && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const members = await storage.getOrganizationMembers(id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get current user's organizations
  app.get("/api/organizations/mine", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const memberships = await storage.getUserOrganizations(userId);
      
      const orgsWithDetails = await Promise.all(
        memberships.map(async (m) => {
          const org = await storage.getOrganization(m.organizationId);
          return { ...m, organization: org };
        })
      );
      
      res.json(orgsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  // Organization-scoped classroom data
  app.get("/api/orgs/:orgId/classes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      const includeHierarchy = req.query.hierarchy === "true";
      
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const classes = includeHierarchy 
        ? await storage.getClassesByOrganizationHierarchy(orgId)
        : await storage.getClassesByOrganization(orgId);
      
      res.json(classes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization classes" });
    }
  });

  app.get("/api/orgs/:orgId/students", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      const includeHierarchy = req.query.hierarchy === "true";
      
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const studentList = includeHierarchy 
        ? await storage.getStudentsByOrganizationHierarchy(orgId)
        : await storage.getStudentsByOrganization(orgId);
      
      res.json(studentList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization students" });
    }
  });

  // Entity sharing between organizations
  const entityShareBodySchema = z.object({
    entityType: z.enum(["class", "student", "assignment", "lesson", "scope_sequence"]),
    entityId: z.string().min(1),
    targetOrganizationId: z.string().min(1),
    permission: z.enum(["view", "edit", "copy"]).optional().default("view"),
  });

  app.post("/api/orgs/:orgId/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      const parsed = entityShareBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid share data", details: parsed.error.errors });
        return;
      }
      
      const { entityType, entityId, targetOrganizationId, permission } = parsed.data;
      
      const membership = await storage.getOrgMembership(orgId, userId);
      if (!membership || membership.role === "member") {
        res.status(403).json({ error: "Admin access required to share" });
        return;
      }
      
      const targetOrg = await storage.getOrganization(targetOrganizationId);
      if (!targetOrg) {
        res.status(400).json({ error: "Target organization not found" });
        return;
      }
      
      const share = await storage.createEntityShare({
        entityType,
        entityId,
        sourceOrganizationId: orgId,
        targetOrganizationId,
        permission,
        sharedBy: userId,
      });
      
      res.json(share);
    } catch (error) {
      res.status(500).json({ error: "Failed to share entity" });
    }
  });

  app.get("/api/orgs/:orgId/shared-with-us", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { orgId } = req.params;
      
      const membership = await storage.getOrgMembership(orgId, userId);
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      if (!membership && !isSiteAdminUser) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      
      const shares = await storage.getSharedWithOrganization(orgId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared entities" });
    }
  });

  app.get("/api/shares/entity/:entityType/:entityId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { entityType, entityId } = req.params;
      
      const shares = await storage.getEntityShares(entityType, entityId);
      
      const userOrgs = await storage.getUserOrganizations(userId);
      const userOrgIds = userOrgs.map(m => m.organizationId);
      
      const filteredShares = shares.filter(share => 
        userOrgIds.includes(share.sourceOrganizationId) ||
        userOrgIds.includes(share.targetOrganizationId)
      );
      
      res.json(filteredShares);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch entity shares" });
    }
  });

  app.delete("/api/shares/:shareId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { shareId } = req.params;
      
      const share = await storage.getEntityShare(shareId);
      if (!share) {
        res.status(404).json({ error: "Share not found" });
        return;
      }
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      
      const sourceOrgMembership = await storage.getOrgMembership(share.sourceOrganizationId, userId);
      const isSourceOrgAdmin = sourceOrgMembership && 
        (sourceOrgMembership.role === "admin" || sourceOrgMembership.role === "owner");
      
      if (!isSiteAdminUser && !isSourceOrgAdmin) {
        res.status(403).json({ error: "Admin access required to delete share" });
        return;
      }
      
      await storage.deleteEntityShare(shareId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete share" });
    }
  });

  // Campus Admin Analytics - aggregate data across organization
  app.get("/api/campus-analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is campus_admin
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Get user's organizations
      const memberships = await storage.getUserOrganizations(userId);
      const orgIds = memberships.map(m => m.organizationId);
      
      if (orgIds.length === 0) {
        res.json({
          totalEducators: 0,
          totalStudents: 0,
          totalLessons: 0,
          totalGoals: 0,
          lessonsThisWeek: 0,
          lessonsLastWeek: 0,
          goalsCompleted: 0,
          goalsInProgress: 0,
          standardsCoverage: {},
          bkdDistribution: { be: 0, know: 0, do: 0 },
          activityByWeek: [],
          topEducators: [],
          organizations: [],
        });
        return;
      }
      
      // Get organization details
      const orgs = await Promise.all(
        orgIds.map(async (id) => {
          const org = await storage.getOrganization(id);
          const members = await storage.getOrganizationMembers(id);
          return { ...org, memberCount: members.length };
        })
      );
      
      // Get all members across organizations
      const allMembers = await Promise.all(
        orgIds.map(async (id) => storage.getOrganizationMembers(id))
      );
      const memberUserIds = allMembers.flat().map(m => m.userId);
      
      // Count educators and students
      const memberDetails = await Promise.all(
        memberUserIds.map(async (uid) => storage.getUser(uid))
      );
      const educators = memberDetails.filter(u => u?.role === "educator").length;
      const students = memberDetails.filter(u => u?.role === "student").length;
      
      // Get all lessons from organization members
      const allLessons = await Promise.all(
        memberUserIds.map(async (uid: string) => storage.getLessons(uid))
      );
      const lessons = allLessons.flat();
      
      // Get all goals from organization members
      const allGoals = await Promise.all(
        memberUserIds.map(async (uid: string) => storage.getGoals(uid))
      );
      const goals = allGoals.flat();
      
      // Calculate weekly stats
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const lessonsThisWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= oneWeekAgo
      ).length;
      const lessonsLastWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= twoWeeksAgo && new Date(l.createdAt) < oneWeekAgo
      ).length;
      
      // Goals stats
      const goalsCompleted = goals.filter((g: Goal) => g.status === "completed").length;
      const goalsInProgress = goals.filter((g: Goal) => g.status === "in_progress").length;
      
      // Standards coverage
      const standardsCoverage: Record<string, number> = {};
      lessons.forEach((l: Lesson) => {
        const stds = (l.standards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        stds.forEach((s: string) => {
          const prefix = s.split(".")[0] || s.substring(0, 4);
          standardsCoverage[prefix] = (standardsCoverage[prefix] || 0) + 1;
        });
      });
      
      // BKD distribution
      const bkdDistribution = { be: 0, know: 0, do: 0 };
      lessons.forEach((l: Lesson) => {
        const focus = l.bkdFocus as "be" | "know" | "do";
        if (focus && bkdDistribution[focus] !== undefined) {
          bkdDistribution[focus]++;
        }
      });
      
      // Activity by week (last 4 weeks)
      const getWeek = (date: Date) => {
        const diff = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (diff === 0) return "This Week";
        if (diff === 1) return "Last Week";
        if (diff === 2) return "2 Weeks Ago";
        return "3+ Weeks Ago";
      };
      
      const activityMap: Record<string, { lessons: number; goals: number }> = {
        "This Week": { lessons: 0, goals: 0 },
        "Last Week": { lessons: 0, goals: 0 },
        "2 Weeks Ago": { lessons: 0, goals: 0 },
        "3+ Weeks Ago": { lessons: 0, goals: 0 },
      };
      
      lessons.forEach((l: Lesson) => {
        if (l.createdAt) activityMap[getWeek(new Date(l.createdAt))].lessons++;
      });
      goals.forEach((g: Goal) => {
        if (g.createdAt) activityMap[getWeek(new Date(g.createdAt))].goals++;
      });
      
      // Top educators by lesson count
      const lessonsByUser: Record<string, number> = {};
      lessons.forEach((l: Lesson) => {
        lessonsByUser[l.userId] = (lessonsByUser[l.userId] || 0) + 1;
      });
      
      const topEducators = await Promise.all(
        Object.entries(lessonsByUser)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(async ([uid, count]) => {
            const user = await storage.getUser(uid);
            return {
              id: uid,
              name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown" : "Unknown",
              lessonCount: count,
            };
          })
      );
      
      res.json({
        totalEducators: educators,
        totalStudents: students,
        totalLessons: lessons.length,
        totalGoals: goals.length,
        lessonsThisWeek,
        lessonsLastWeek,
        goalsCompleted,
        goalsInProgress,
        standardsCoverage,
        bkdDistribution,
        activityByWeek: [
          { name: "3+ Weeks", ...activityMap["3+ Weeks Ago"] },
          { name: "2 Weeks", ...activityMap["2 Weeks Ago"] },
          { name: "Last Week", ...activityMap["Last Week"] },
          { name: "This Week", ...activityMap["This Week"] },
        ],
        topEducators,
        organizations: orgs,
      });
    } catch (error) {
      console.error("Campus analytics error:", error);
      res.status(500).json({ error: "Failed to fetch campus analytics" });
    }
  });

  // District Analytics - aggregates data across all schools in a district
  app.get("/api/district-analytics", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Get user's organizations
      const memberships = await storage.getUserOrganizations(userId);
      
      // Find districts where user is admin or owner (not just member)
      const districtIds: string[] = [];
      const districts: Array<{ id: string; name: string; type: string }> = [];
      
      for (const m of memberships) {
        // Only allow admin or owner access to district analytics
        if (m.role !== "admin" && m.role !== "owner") continue;
        
        const org = await storage.getOrganization(m.organizationId);
        if (org?.type === "district") {
          districtIds.push(org.id);
          districts.push({ id: org.id, name: org.name, type: org.type });
        }
      }
      
      if (districtIds.length === 0) {
        res.json({
          isDistrictAdmin: false,
          districts: [],
          schools: [],
          totalSchools: 0,
          totalEducators: 0,
          totalStudents: 0,
          totalLessons: 0,
          totalGoals: 0,
        });
        return;
      }
      
      // Get all child schools under these districts
      const allSchools: Array<{ id: string; name: string; districtId: string; memberCount: number; educatorCount: number; studentCount: number; lessonCount: number; goalCount: number }> = [];
      
      for (const districtId of districtIds) {
        const childOrgs = await storage.getChildOrganizations(districtId);
        for (const school of childOrgs) {
          const members = await storage.getOrganizationMembers(school.id);
          // Filter out any null/undefined userIds
          const memberUserIds = members.map(m => m.userId).filter((uid): uid is string => !!uid);
          
          // Get member details
          const memberDetails = await Promise.all(
            memberUserIds.map(async (uid) => storage.getUser(uid))
          );
          const educatorCount = memberDetails.filter(u => u?.role === "educator").length;
          const studentCount = memberDetails.filter(u => u?.role === "student").length;
          
          // Get lessons and goals from this school's members with error handling
          let lessonCount = 0;
          let goalCount = 0;
          
          for (const uid of memberUserIds) {
            try {
              const lessons = await storage.getLessons(uid);
              const goals = await storage.getGoals(uid);
              lessonCount += lessons.length;
              goalCount += goals.length;
            } catch (err) {
              console.error(`Error fetching data for user ${uid}:`, err);
            }
          }
          
          allSchools.push({
            id: school.id,
            name: school.name,
            districtId: districtId,
            memberCount: members.length,
            educatorCount,
            studentCount,
            lessonCount,
            goalCount,
          });
        }
      }
      
      // Aggregate totals
      const totalEducators = allSchools.reduce((sum, s) => sum + s.educatorCount, 0);
      const totalStudents = allSchools.reduce((sum, s) => sum + s.studentCount, 0);
      const totalLessons = allSchools.reduce((sum, s) => sum + s.lessonCount, 0);
      const totalGoals = allSchools.reduce((sum, s) => sum + s.goalCount, 0);
      
      res.json({
        isDistrictAdmin: true,
        districts,
        schools: allSchools,
        totalSchools: allSchools.length,
        totalEducators,
        totalStudents,
        totalLessons,
        totalGoals,
      });
    } catch (error) {
      console.error("District analytics error:", error);
      res.status(500).json({ error: "Failed to fetch district analytics" });
    }
  });

  // School drill-down analytics - detailed stats for a single school
  app.get("/api/analytics/school/:schoolId", isAuthenticated, async (req: any, res) => {
    try {
      const { schoolId } = req.params;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Verify user has access to this school or its parent district
      const school = await storage.getOrganization(schoolId);
      if (!school) {
        res.status(404).json({ error: "School not found" });
        return;
      }
      
      // Check for admin/owner access to the school
      const membership = await storage.getOrgMembership(schoolId, userId);
      let hasAccess = membership?.role === "admin" || membership?.role === "owner";
      
      // Check if user is admin/owner of parent district
      if (!hasAccess && school.parentOrganizationId) {
        const districtMembership = await storage.getOrgMembership(school.parentOrganizationId, userId);
        hasAccess = districtMembership?.role === "admin" || districtMembership?.role === "owner";
      }
      
      if (!hasAccess) {
        res.status(403).json({ error: "Admin access required for this school" });
        return;
      }
      
      // Get school members
      const members = await storage.getOrganizationMembers(schoolId);
      // Filter out any null/undefined userIds
      const memberUserIds = members.map(m => m.userId).filter((uid): uid is string => !!uid);
      
      // Get member details with lessons and goals
      const teacherStats: Array<{
        id: string;
        name: string;
        email: string | null;
        role: string;
        lessonCount: number;
        goalCount: number;
        lessonsThisWeek: number;
      }> = [];
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let allLessons: Lesson[] = [];
      let allGoals: Goal[] = [];
      
      for (const uid of memberUserIds) {
        try {
          const memberUser = await storage.getUser(uid);
          const lessons = await storage.getLessons(uid);
          const goals = await storage.getGoals(uid);
          
          allLessons = allLessons.concat(lessons);
          allGoals = allGoals.concat(goals);
          
          const lessonsThisWeek = lessons.filter((l: Lesson) => 
            l.createdAt && new Date(l.createdAt) >= oneWeekAgo
          ).length;
          
          teacherStats.push({
            id: uid,
            name: memberUser ? `${memberUser.firstName || ""} ${memberUser.lastName || ""}`.trim() || "Unknown" : "Unknown",
            email: memberUser?.email || null,
            role: memberUser?.role || "unknown",
            lessonCount: lessons.length,
            goalCount: goals.length,
            lessonsThisWeek,
          });
        } catch (err) {
          console.error(`Error fetching data for user ${uid}:`, err);
        }
      }
      
      // Sort teachers by lesson count
      teacherStats.sort((a, b) => b.lessonCount - a.lessonCount);
      
      // Calculate BKD distribution
      const bkdDistribution = { be: 0, know: 0, do: 0 };
      allLessons.forEach((l: Lesson) => {
        const focus = l.bkdFocus as "be" | "know" | "do";
        if (focus && bkdDistribution[focus] !== undefined) {
          bkdDistribution[focus]++;
        }
      });
      
      // Standards coverage
      const standardsCoverage: Record<string, number> = {};
      allLessons.forEach((l: Lesson) => {
        const stds = (l.standards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        stds.forEach((s: string) => {
          const prefix = s.split(".")[0] || s.substring(0, 4);
          standardsCoverage[prefix] = (standardsCoverage[prefix] || 0) + 1;
        });
      });
      
      res.json({
        school: {
          id: school.id,
          name: school.name,
          type: school.type,
        },
        totalMembers: members.length,
        totalEducators: teacherStats.filter(t => t.role === "educator").length,
        totalStudents: teacherStats.filter(t => t.role === "student").length,
        totalLessons: allLessons.length,
        totalGoals: allGoals.length,
        goalsCompleted: allGoals.filter((g: Goal) => g.status === "completed").length,
        goalsInProgress: allGoals.filter((g: Goal) => g.status === "in_progress").length,
        teachers: teacherStats.filter(t => t.role === "educator"),
        bkdDistribution,
        standardsCoverage,
      });
    } catch (error) {
      console.error("School analytics error:", error);
      res.status(500).json({ error: "Failed to fetch school analytics" });
    }
  });

  // Teacher drill-down analytics - detailed stats for a single teacher
  app.get("/api/analytics/teacher/:teacherId", isAuthenticated, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (user?.role !== "campus_admin") {
        res.status(403).json({ error: "Campus admin access required" });
        return;
      }
      
      // Get teacher info
      const teacher = await storage.getUser(teacherId);
      if (!teacher) {
        res.status(404).json({ error: "Teacher not found" });
        return;
      }
      
      // Verify user has admin/owner access to teacher's organization or parent district
      const userOrgs = await storage.getUserOrganizations(userId);
      const teacherOrgs = await storage.getUserOrganizations(teacherId);
      
      let hasAccess = false;
      for (const userOrg of userOrgs) {
        // Only admin/owner of org can view teacher analytics
        if (userOrg.role !== "admin" && userOrg.role !== "owner") continue;
        
        for (const teacherOrg of teacherOrgs) {
          // Direct org membership match
          if (userOrg.organizationId === teacherOrg.organizationId) {
            hasAccess = true;
            break;
          }
          // Check if user's org is parent district of teacher's school
          const tOrg = await storage.getOrganization(teacherOrg.organizationId);
          if (tOrg?.parentOrganizationId === userOrg.organizationId) {
            hasAccess = true;
            break;
          }
        }
        if (hasAccess) break;
      }
      
      if (!hasAccess) {
        res.status(403).json({ error: "Admin access required to view this teacher" });
        return;
      }
      
      // Get teacher's data
      const lessons = await storage.getLessons(teacherId);
      const goals = await storage.getGoals(teacherId);
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const lessonsThisWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= oneWeekAgo
      ).length;
      const lessonsLastWeek = lessons.filter((l: Lesson) => 
        l.createdAt && new Date(l.createdAt) >= twoWeeksAgo && new Date(l.createdAt) < oneWeekAgo
      ).length;
      
      // BKD distribution for lessons
      const lessonBkdDistribution = { be: 0, know: 0, do: 0 };
      lessons.forEach((l: Lesson) => {
        const focus = l.bkdFocus as "be" | "know" | "do";
        if (focus && lessonBkdDistribution[focus] !== undefined) {
          lessonBkdDistribution[focus]++;
        }
      });
      
      // Standards coverage
      const standardsCoverage: Record<string, number> = {};
      lessons.forEach((l: Lesson) => {
        const stds = (l.standards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        stds.forEach((s: string) => {
          const prefix = s.split(".")[0] || s.substring(0, 4);
          standardsCoverage[prefix] = (standardsCoverage[prefix] || 0) + 1;
        });
      });
      
      // Recent lessons
      const recentLessons = lessons
        .sort((a: Lesson, b: Lesson) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10)
        .map((l: Lesson) => ({
          id: l.id,
          title: l.title,
          topic: l.topic,
          gradeLevel: l.gradeLevel,
          bkdFocus: l.bkdFocus,
          createdAt: l.createdAt,
        }));
      
      res.json({
        teacher: {
          id: teacher.id,
          name: `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || "Unknown",
          email: teacher.email,
          role: teacher.role,
        },
        totalLessons: lessons.length,
        totalGoals: goals.length,
        lessonsThisWeek,
        lessonsLastWeek,
        goalsCompleted: goals.filter((g: Goal) => g.status === "completed").length,
        goalsInProgress: goals.filter((g: Goal) => g.status === "in_progress").length,
        lessonBkdDistribution,
        standardsCoverage,
        recentLessons,
      });
    } catch (error) {
      console.error("Teacher analytics error:", error);
      res.status(500).json({ error: "Failed to fetch teacher analytics" });
    }
  });

  // Invite user to organization
  app.post("/api/organizations/:id/invite", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      const userId = req.user?.claims?.sub;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const membership = await storage.getOrgMembership(id, userId);
      
      if (!isSiteAdminUser && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const invitation = await storage.createOrgInvitation({
        organizationId: id,
        email,
        role: role || "member",
        token,
        invitedBy: userId,
        expiresAt,
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Accept invitation
  app.post("/api/organizations/accept-invite", isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;
      const userId = req.user?.claims?.sub;
      
      const membership = await storage.acceptOrgInvitation(token, userId);
      if (!membership) {
        res.status(400).json({ error: "Invalid or expired invitation" });
        return;
      }
      
      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Update member role
  app.patch("/api/organizations/:orgId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, memberId } = req.params;
      const { role, status } = req.body;
      const userId = req.user?.claims?.sub;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const membership = await storage.getOrgMembership(orgId, userId);
      
      if (!isSiteAdminUser && (!membership || membership.role !== "owner")) {
        res.status(403).json({ error: "Owner access required" });
        return;
      }
      
      const updated = await storage.updateOrgMembership(memberId, { role, status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  // Remove member from organization
  app.delete("/api/organizations/:orgId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, memberId } = req.params;
      const userId = req.user?.claims?.sub;
      
      const isSiteAdminUser = await storage.isSiteAdmin(userId);
      const membership = await storage.getOrgMembership(orgId, userId);
      
      if (!isSiteAdminUser && (!membership || membership.role === "member")) {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      
      await storage.deleteOrgMembership(memberId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // Platform statistics for site admin dashboard
  app.get("/api/admin/stats", isAuthenticated, isSiteAdmin, async (req: any, res) => {
    try {
      const orgs = await storage.getOrganizations();
      const admins = await storage.getSiteAdmins();
      
      res.json({
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter(o => o.status === "active").length,
        totalSiteAdmins: admins.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ============ Parent Portal Routes ============
  
  // Get linked students (for parents) or linked parents (for students)
  app.get("/api/parent-portal/links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const role = req.query.role as 'parent' | 'student' || 'parent';
      
      const links = await storage.getParentStudentLinks(userId, role);
      
      // Enrich with user details
      const enrichedLinks = await Promise.all(links.map(async (link) => {
        const targetUserId = role === 'parent' ? link.studentUserId : link.parentUserId;
        const user = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
        return {
          ...link,
          linkedUser: user[0] ? {
            id: user[0].id,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            email: user[0].email,
          } : null,
        };
      }));
      
      res.json(enrichedLinks);
    } catch (error) {
      console.error("Error fetching parent-student links:", error);
      res.status(500).json({ error: "Failed to fetch links" });
    }
  });

  // Get a specific link
  app.get("/api/parent-portal/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const link = await storage.getParentStudentLink(req.params.id);
      
      if (!link || (link.parentUserId !== userId && link.studentUserId !== userId)) {
        res.status(404).json({ error: "Link not found" });
        return;
      }
      
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch link" });
    }
  });

  // Update link permissions (student controls what parent can see)
  app.patch("/api/parent-portal/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const link = await storage.getParentStudentLink(req.params.id);
      
      if (!link || link.studentUserId !== userId) {
        res.status(403).json({ error: "Only the student can update permissions" });
        return;
      }
      
      const { permissions, status } = req.body;
      const updated = await storage.updateParentStudentLink(req.params.id, { permissions, status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update link" });
    }
  });

  // Delete a parent-student link
  app.delete("/api/parent-portal/links/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const link = await storage.getParentStudentLink(req.params.id);
      
      if (!link || (link.studentUserId !== userId && link.parentUserId !== userId)) {
        res.status(403).json({ error: "Not authorized to delete this link" });
        return;
      }
      
      await storage.deleteParentStudentLink(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete link" });
    }
  });

  // Get student's invitations sent to parents
  app.get("/api/parent-portal/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const invitations = await storage.getParentInvitations(userId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Student invites a parent
  app.post("/api/parent-portal/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { parentEmail, relationship } = req.body;
      
      if (!parentEmail) {
        res.status(400).json({ error: "Parent email is required" });
        return;
      }
      
      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const invitation = await storage.createParentInvitation({
        studentUserId: userId,
        parentEmail,
        relationship: relationship || "parent",
        token,
        status: "pending",
        expiresAt,
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  // Accept parent invitation (parent uses this after signing in)
  app.post("/api/parent-portal/invitations/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ error: "Invitation token is required" });
        return;
      }
      
      const link = await storage.acceptParentInvitation(token, userId);
      if (!link) {
        res.status(400).json({ error: "Invalid or expired invitation" });
        return;
      }
      
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Delete invitation
  app.delete("/api/parent-portal/invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const invitations = await storage.getParentInvitations(userId);
      const invitation = invitations.find(i => i.id === req.params.id);
      
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      
      await storage.deleteParentInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });

  // Get student data for parent view (respects permissions)
  app.get("/api/parent-portal/student/:studentId", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      const { studentId } = req.params;
      
      const link = await storage.getParentStudentLinkByUsers(parentUserId, studentId);
      if (!link || link.status !== 'active') {
        res.status(403).json({ error: "You don't have access to this student's data" });
        return;
      }
      
      const permissions = (link.permissions || {}) as { viewGoals?: boolean; viewAssessments?: boolean; viewCareers?: boolean; viewLessons?: boolean; receiveNotifications?: boolean };
      const studentData: any = {};
      
      // Get student user info
      const [student] = await db.select().from(users).where(eq(users.id, studentId));
      if (student) {
        studentData.student = {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
        };
      }
      
      // Get goals if permitted
      if (permissions.viewGoals) {
        studentData.goals = await storage.getGoals(studentId);
      }
      
      // Get self-discovery results if permitted
      if (permissions.viewAssessments) {
        studentData.assessments = await storage.getSelfDiscoveryResults(studentId);
      }
      
      // Get saved careers if permitted
      if (permissions.viewCareers) {
        studentData.savedCareers = await storage.getSavedCareers(studentId);
      }
      
      // Get parent's notes for this link
      const notes = await storage.getParentProgressNotes(link.id);
      studentData.notes = notes.filter(n => !n.isPrivate || n.parentUserId === parentUserId);
      
      res.json(studentData);
    } catch (error) {
      console.error("Error fetching student data:", error);
      res.status(500).json({ error: "Failed to fetch student data" });
    }
  });

  // Parent adds a progress note
  app.post("/api/parent-portal/notes", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      const { linkId, studentUserId, noteType, content, relatedGoalId, isPrivate } = req.body;
      
      // Verify parent has access to this link
      const link = await storage.getParentStudentLink(linkId);
      if (!link || link.parentUserId !== parentUserId) {
        res.status(403).json({ error: "Not authorized to add notes for this student" });
        return;
      }
      
      const note = await storage.createParentProgressNote({
        linkId,
        parentUserId,
        studentUserId,
        noteType: noteType || "general",
        content,
        relatedGoalId,
        isPrivate: isPrivate || false,
      });
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Delete a note
  app.delete("/api/parent-portal/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const parentUserId = req.user?.claims?.sub;
      await storage.deleteParentProgressNote(req.params.id, parentUserId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ================================
  // Global Authority Tree (LYS V3.0)
  // ================================

  // Get all authorities (optionally filtered by level)
  app.get("/api/authorities", async (req, res) => {
    try {
      const { level } = req.query;
      const authoritiesList = await storage.getAuthorities(level as string | undefined);
      res.json(authoritiesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authorities" });
    }
  });

  // Get single authority
  app.get("/api/authorities/:id", async (req, res) => {
    try {
      const authority = await storage.getAuthority(req.params.id);
      if (!authority) {
        res.status(404).json({ error: "Authority not found" });
        return;
      }
      res.json(authority);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch authority" });
    }
  });

  // Get child authorities
  app.get("/api/authorities/:id/children", async (req, res) => {
    try {
      const children = await storage.getChildAuthorities(req.params.id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch child authorities" });
    }
  });

  // Create authority (admin only)
  app.post("/api/authorities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdmin = await storage.isSiteAdmin(userId);
      if (!isSiteAdmin) {
        res.status(403).json({ error: "Site admin access required" });
        return;
      }
      const authority = await storage.createAuthority(req.body);
      res.status(201).json(authority);
    } catch (error) {
      res.status(500).json({ error: "Failed to create authority" });
    }
  });

  // Update authority (admin only)
  app.patch("/api/authorities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isSiteAdmin = await storage.isSiteAdmin(userId);
      if (!isSiteAdmin) {
        res.status(403).json({ error: "Site admin access required" });
        return;
      }
      const authority = await storage.updateAuthority(req.params.id, req.body);
      if (!authority) {
        res.status(404).json({ error: "Authority not found" });
        return;
      }
      res.json(authority);
    } catch (error) {
      res.status(500).json({ error: "Failed to update authority" });
    }
  });

  // ================================
  // LYS Milestones (Being, Knowing, Doing)
  // ================================

  // Get user's milestones
  app.get("/api/lyse-milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { category } = req.query;
      
      let milestones;
      if (category) {
        milestones = await storage.getLyseMilestonesByCategory(userId, category as string);
      } else {
        milestones = await storage.getLyseMilestones(userId);
      }
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  // Get gatekeeper milestones
  app.get("/api/lyse-milestones/gatekeepers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestones = await storage.getGatekeeperMilestones(userId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gatekeeper milestones" });
    }
  });

  // Get single milestone
  app.get("/api/lyse-milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestone = await storage.getLyseMilestone(req.params.id);
      if (!milestone) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }
      if (milestone.userId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestone" });
    }
  });

  // Create milestone
  app.post("/api/lyse-milestones", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const milestone = await storage.createLyseMilestone({
        ...req.body,
        userId,
      });
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  // Update milestone
  app.patch("/api/lyse-milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const existing = await storage.getLyseMilestone(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Milestone not found" });
        return;
      }
      if (existing.userId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const milestone = await storage.updateLyseMilestone(req.params.id, req.body);
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // Delete milestone
  app.delete("/api/lyse-milestones/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.deleteLyseMilestone(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete milestone" });
    }
  });

  // ================================
  // Workforce Trends
  // ================================

  // Get workforce trends (optionally filtered by country)
  app.get("/api/workforce-trends", async (req, res) => {
    try {
      const { country } = req.query;
      const trends = await storage.getWorkforceTrends(country as string | undefined);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workforce trends" });
    }
  });

  // Get alignment matrix for an authority
  app.get("/api/alignment-matrix/:authorityId", async (req, res) => {
    try {
      const matrix = await storage.getAlignmentMatrixByAuthority(req.params.authorityId);
      if (!matrix) {
        res.status(404).json({ error: "Alignment matrix not found" });
        return;
      }
      res.json(matrix);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alignment matrix" });
    }
  });

  // ================================
  // Subscription / Tier Management (Demo Mode)
  // ================================
  // NOTE: This is a demo/development mode that simulates tier upgrades
  // For production, integrate Stripe via Replit's Stripe connector
  
  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json({
        tier: user.tier || "free",
        subscriptionStatus: user.subscriptionStatus || null,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
        isDemo: !process.env.STRIPE_SECRET_KEY,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  // Demo tier upgrade (for development/testing only)
  app.post("/api/subscription/demo-upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { tier } = req.body;
      
      if (!["pro", "campus"].includes(tier)) {
        res.status(400).json({ error: "Invalid tier. Choose 'pro' or 'campus'" });
        return;
      }
      
      // Update user tier directly for demo purposes
      await db.update(users)
        .set({ 
          tier: tier,
          subscriptionStatus: "demo_active",
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        message: `Upgraded to ${tier} tier (demo mode)`,
        tier: tier,
        isDemo: true,
        note: "For production, connect Stripe via Replit integrations"
      });
    } catch (error) {
      console.error("Demo upgrade error:", error);
      res.status(500).json({ error: "Failed to upgrade tier" });
    }
  });

  // Demo tier downgrade
  app.post("/api/subscription/demo-downgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      await db.update(users)
        .set({ 
          tier: "free",
          subscriptionStatus: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      res.json({ 
        success: true, 
        message: "Downgraded to free tier",
        tier: "free"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to downgrade tier" });
    }
  });

  return httpServer;
}
