import type { Express } from "express";
import { storage } from "../storage";
import { type Goal, type User, goals } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import { randomUUID } from "crypto";
import multer from "multer";
import { and } from "drizzle-orm";
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

const manualSnapshotSchema = z.object({
  notes: z.string().max(500).optional(),
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
  role: z.enum(["student", "educator", "staff", "campus_admin", "district_admin", "site_admin", "system_admin", "homeschool_parent"]).optional(),
  preferences: z.object({
    language: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    jurisdictionId: z.string().optional(),
    standardSetId: z.string().optional(),
    gradeLevels: z.array(z.string()).optional(),
    gradeBands: z.array(z.string()).optional(),
  }).optional(),
  needsAnalysis: z.object({
    primaryGoal: z.string(),
    interests: z.array(z.string()),
    experienceLevel: z.string().default("beginner"),
    recommendedFeatures: z.array(z.string()),
  }),
});

const updateRoleSchema = z.object({
  role: z.enum(["student", "educator", "staff", "homeschool_parent", "campus_admin", "district_admin", "site_admin", "system_admin"]),
});

async function syncScopeStandardsToProfile(scopeId: string, userId: string) {
  const units = await storage.getSequenceUnits(scopeId);
  const standardsMap = new Map<string, { code: string; description: string }>();
  for (const unit of units) {
    const codes = (unit.standardCodes as { code: string; description: string }[]) || [];
    for (const std of codes) {
      if (std.code && !standardsMap.has(std.code)) {
        standardsMap.set(std.code, { code: std.code, description: std.description || "" });
      }
    }
  }
  if (standardsMap.size > 0) {
    await storage.updateEducatorProfile(userId, {
      preferredStandardCodes: Array.from(standardsMap.values()),
    });
  }
}

function requireRole(...allowedRoles: string[]) {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      const dbUser = await storage.getUser(userId);
      const userRole = dbUser?.role || "student";
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({ error: "Insufficient permissions for this action" });
        return;
      }
      next();
    } catch {
      res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
}

const requireCampusAdmin = requireRole("campus_admin", "district_admin", "site_admin", "system_admin");
const requireDistrictAdmin = requireRole("district_admin", "site_admin", "system_admin");
const requireSiteAdmin = requireRole("site_admin", "system_admin");
const requireSystemAdmin = requireRole("system_admin");

import { ANALYZER_CTAS, ANALYZER_IDENTITIES, ANALYZER_SESSION_REGEX, ANALYZER_URGENCIES, APPROVED_VIDEO_HOSTS, MAX_TRIALS_PER_IP, TRIAL_DURATION_DAYS, TRIAL_RESET_MONTHS, US_STATES, analyzerBindSchema, analyzerCtaClickSchema, analyzerSubmitSchema, autoMatchSchema, createJourneyEntrySchema, createSisConnectionSchema, educatorProfileSchema, entityShareBodySchema, entriesQuerySchema, foundationModuleUpdateSchema, foundationProgressBodySchema, foundationQuizQuestionSchema, generateInviteCode, getAdminManagedOrgIds, getAdminOrgIds, getStateNameFromAbbr, getTrialSinceDate, isApprovedVideoUrl, isSiteAdmin, pillarParamSchema, requireFoundationAdmin, requirePaidTier, requireRssAdmin, requireSiteAdminForStandards, requireStaffOrAdmin, validOrgTypes, verifyOrgAdminAccess, videoUrlSchema } from "./_helpers";

// AUTO-SPLIT from server/routes.ts -- domain: pd (25 routes)
export function registerPdRoutes(app: Express): void {


  app.get("/api/educator-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getEducatorProfile(userId);
      const tier = await storage.getUserTier(userId);
      const sponsoredAccess = await storage.getUserSponsoredAccess(userId);
      
      let hasActiveTrial = false;
      if (tier === "free") {
        const userTrial = await storage.getActiveTrialByUserId(userId);
        hasActiveTrial = !!userTrial;
      }

      res.json({ profile: profile || null, tier, sponsoredAccess: sponsoredAccess || null, hasActiveTrial });
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


  // Educator BKD self-assessment — save results + auto-create PD goal suggestions
  app.post("/api/educator/bkd-assessment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userRole = req.user?.claims?.role || "";
      const educatorRoles = ["educator", "campus_admin", "district_admin", "site_admin", "system_admin"];
      if (!educatorRoles.includes(userRole)) {
        return res.status(403).json({ error: "Only educators can submit this assessment" });
      }

      const { beScore, knowScore, doScore, totalScore, strengths, growthAreas, answers } = req.body;

      // Save as a self-discovery result tagged to this educator
      const result = await storage.saveSelfDiscoveryResult({
        userId,
        beScore,
        knowScore,
        doScore,
        totalScore,
        strengths,
        growthAreas,
        answers,
      });

      // Auto-create PD goals from low-scoring pillars
      const suggestedGoals: string[] = [];
      if (beScore < 60) suggestedGoals.push("Reflect on and strengthen your teaching identity and core values");
      if (knowScore < 60) suggestedGoals.push("Deepen subject-matter expertise and pedagogical knowledge");
      if (doScore < 60) suggestedGoals.push("Develop consistent classroom practices and measurable student impact strategies");

      const createdGoals = [];
      for (const title of suggestedGoals) {
        try {
          const goal = await storage.createEducatorCareerGoal({
            userId,
            title,
            goalType: "skill_development",
            timeframe: "1_year",
            description: `Auto-suggested from your Be-Know-Do self-assessment. Review and customize to fit your context.`,
            priority: 2,
          });
          createdGoals.push(goal);
        } catch (_) { /* skip if PD goal creation fails */ }
      }

      res.json({ result, suggestedGoals: createdGoals });
    } catch (error) {
      console.error("Educator BKD assessment error:", error);
      res.status(500).json({ error: "Failed to save educator BKD assessment" });
    }
  });


  // Get educator's own BKD assessment history
  app.get("/api/educator/bkd-assessment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const results = await storage.getSelfDiscoveryResults(userId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch educator BKD results" });
    }
  });


  // ================================
  // PD RSS Content (approved articles as micro-courses)
  // ================================

  app.get("/api/pd-content", isAuthenticated, async (req: any, res) => {
    try {
      const { search } = req.query as { search?: string };
      const allApproved = await storage.getRssContentItems({ status: "approved" });
      // Prefer items explicitly tagged for PD/educator, fall back to all approved content
      const pdTagged = allApproved.filter((item: any) => {
        const placements: string[] = item.approvedPlacements || [];
        return placements.includes("professional_development") || placements.includes("educator_tools");
      });
      const pool = pdTagged.length > 0 ? pdTagged : allApproved;
      const filtered = search
        ? pool.filter((i: any) => i.title?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
        : pool;
      res.json(filtered.slice(0, 60));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PD content" });
    }
  });


  // ================================
  // Parent-Student Connection (Educator-initiated)
  // ================================

  // Educator invites parent for their student
  app.post("/api/educator/invite-parent", isAuthenticated, async (req: any, res) => {
    try {
      const educatorId = req.user?.claims?.sub;
      const { studentId, parentEmail, relationship } = req.body;
      
      if (!studentId || !parentEmail) {
        res.status(400).json({ error: "Student ID and parent email are required" });
        return;
      }
      
      // Verify educator has access to this student (enrolled in their class)
      const educator = await storage.getUser(educatorId);
      if (!educator || (educator.role !== "educator" && educator.role !== "campus_admin" && educator.role !== "district_admin")) {
        res.status(403).json({ error: "Only educators can invite parents" });
        return;
      }
      
      // Get student to verify exists
      const student = await storage.getStudent(studentId);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      
      // Verify student is in educator's class (unless campus admin)
      if (educator.role === "educator") {
        const educatorClasses = await storage.getClasses(educatorId);
        let studentInClass = false;
        for (const cls of educatorClasses) {
          const classStudentsList = await storage.getClassStudents(cls.id);
          if (classStudentsList.some(cs => cs.studentId === studentId)) {
            studentInClass = true;
            break;
          }
        }
        
        if (!studentInClass) {
          res.status(403).json({ error: "You can only invite parents for students in your classes" });
          return;
        }
      }
      
      // Create invitation with student's user ID
      const token = randomUUID().replace(/-/g, "").substring(0, 32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const invitation = await storage.createParentInvitation({
        studentUserId: student.userId,
        parentEmail,
        relationship: relationship || "parent",
        token,
        status: "pending",
        expiresAt,
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create parent invitation" });
    }
  });


  // Get pending parent connection requests (for educators)
  app.get("/api/educator/parent-requests", isAuthenticated, async (req: any, res) => {
    try {
      const educatorId = req.user?.claims?.sub;
      const educator = await storage.getUser(educatorId);
      
      if (!educator || (educator.role !== "educator" && educator.role !== "campus_admin")) {
        res.status(403).json({ error: "Only educators can view parent requests" });
        return;
      }
      
      const requests = await storage.getPendingParentRequests(educatorId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parent requests" });
    }
  });


  // Educator approves/rejects parent connection request
  app.post("/api/educator/parent-requests/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const educatorId = req.user?.claims?.sub;
      const { id } = req.params;
      const { action } = req.body; // "approve" or "reject"
      
      const educator = await storage.getUser(educatorId);
      if (!educator || (educator.role !== "educator" && educator.role !== "campus_admin")) {
        res.status(403).json({ error: "Only educators can respond to parent requests" });
        return;
      }
      
      if (action !== "approve" && action !== "reject") {
        res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
        return;
      }
      
      const updatedLink = await storage.updateParentStudentLink(id, {
        status: action === "approve" ? "active" : "revoked",
        acceptedAt: action === "approve" ? new Date() : undefined
      });
      
      res.json(updatedLink);
    } catch (error) {
      res.status(500).json({ error: "Failed to process request" });
    }
  });


  // ================================
  // Professional Development System
  // ================================

  // Get educator career goals
  app.get("/api/pd/career-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goals = await storage.getEducatorCareerGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch career goals" });
    }
  });


  // Create career goal
  app.post("/api/pd/career-goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goal = await storage.createEducatorCareerGoal({
        ...req.body,
        userId,
      });
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create career goal" });
    }
  });


  // Update career goal
  app.patch("/api/pd/career-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const goal = await storage.updateEducatorCareerGoal(req.params.id, userId, req.body);
      if (!goal) {
        res.status(404).json({ error: "Goal not found" });
        return;
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update career goal" });
    }
  });


  // Delete career goal
  app.delete("/api/pd/career-goals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.deleteEducatorCareerGoal(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete career goal" });
    }
  });


  // Get educator skills
  app.get("/api/pd/skills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const skills = await storage.getEducatorSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });


  // Create skill
  app.post("/api/pd/skills", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const skill = await storage.createEducatorSkill({
        ...req.body,
        userId,
      });
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to create skill" });
    }
  });


  // Update skill
  app.patch("/api/pd/skills/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const skill = await storage.updateEducatorSkill(req.params.id, userId, req.body);
      if (!skill) {
        res.status(404).json({ error: "Skill not found" });
        return;
      }
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to update skill" });
    }
  });


  // Delete skill
  app.delete("/api/pd/skills/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      await storage.deleteEducatorSkill(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });


  // Get PD resources
  app.get("/api/pd/resources", async (req, res) => {
    try {
      const { resourceType } = req.query;
      const resources = await storage.getPDResources({
        resourceType: resourceType as string | undefined,
        isActive: true,
      });
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PD resources" });
    }
  });


  // Get PD recommendations
  app.get("/api/pd/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { status } = req.query;
      const recs = await storage.getPDRecommendations(userId, status as string | undefined);
      res.json(recs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });


  // Generate AI recommendations
  app.post("/api/pd/recommendations/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      // Get user's goals and skills
      const userGoals = await storage.getEducatorCareerGoals(userId);
      const userSkills = await storage.getEducatorSkills(userId);
      const profile = await storage.getEducatorProfile(userId);
      
      // Transform skills to expected format
      const skillsForAI = userSkills.map(s => ({
        skillName: s.skillName,
        category: s.category,
        currentLevel: s.proficiencyLevel,
        targetLevel: Math.min(s.proficiencyLevel + 1, 5),
      }));
      
      // Generate recommendations using AI
      const { generatePDRecommendations } = await import("../openai");
      const recommendations = await generatePDRecommendations(userGoals, skillsForAI, profile as any);
      
      // Clear old recommendations and save new ones
      await storage.clearUserPDRecommendations(userId);
      
      const savedRecs = [];
      for (const rec of recommendations.recommendations) {
        const saved = await storage.createPDRecommendation({
          userId,
          title: rec.title,
          description: rec.description,
          reason: rec.reason,
          skillGaps: rec.skillGaps,
          resourceType: rec.resourceType,
          provider: rec.provider || null,
          estimatedDuration: rec.estimatedDuration || null,
          priority: rec.priority,
          status: "new",
        });
        savedRecs.push(saved);
      }
      
      res.json({
        recommendations: savedRecs,
        summary: recommendations.summary,
        focusAreas: recommendations.focusAreas,
      });
    } catch (error) {
      console.error("Failed to generate PD recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });


  // Update recommendation status
  app.patch("/api/pd/recommendations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { status } = req.body;
      const rec = await storage.updatePDRecommendationStatus(req.params.id, userId, status);
      if (!rec) {
        res.status(404).json({ error: "Recommendation not found" });
        return;
      }
      res.json(rec);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recommendation" });
    }
  });


  // Get PD progress
  app.get("/api/pd/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const progress = await storage.getEducatorPDProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PD progress" });
    }
  });


  // Start PD activity (from recommendation)
  app.post("/api/pd/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { recommendationId, resourceId, title } = req.body;
      
      const progress = await storage.createEducatorPDProgress({
        userId,
        recommendationId,
        resourceId,
        title,
        status: "in_progress",
        progress: 0,
      });
      
      // Update recommendation status if provided
      if (recommendationId) {
        await storage.updatePDRecommendationStatus(recommendationId, userId, "started");
      }
      
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to start PD activity" });
    }
  });


  // Update PD progress
  app.patch("/api/pd/progress/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const updates = req.body;
      
      // If marking as completed, set completedAt
      if (updates.status === "completed" && !updates.completedAt) {
        updates.completedAt = new Date();
      }
      
      const progress = await storage.updateEducatorPDProgress(req.params.id, userId, updates);
      if (!progress) {
        res.status(404).json({ error: "Progress not found" });
        return;
      }
      
      // Update related recommendation if completed
      if (progress.status === "completed" && progress.recommendationId) {
        await storage.updatePDRecommendationStatus(progress.recommendationId, userId, "completed");
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update PD progress" });
    }
  });
}
