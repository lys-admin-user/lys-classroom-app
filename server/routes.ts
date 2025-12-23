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
import { extractStandardsFromText, processPdfImport, checkSourceForChanges } from "./services/llmExtractionService";

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
    experienceLevel: z.string().optional(),
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
      const prefs = await storage.updateUserPreferences(userId, validated);
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
        needsAnalysis,
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

  return httpServer;
}
