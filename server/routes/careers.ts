import type { Express } from "express";
import { storage } from "../storage";
import { scholarshipApplications } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";
import multer from "multer";
import { detectSeasonFromDeadline } from "../services/scholarshipService";
import { db } from "../db";
import { eq, and, count } from "drizzle-orm";
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

// AUTO-SPLIT from server/routes.ts -- domain: careers (32 routes)
export function registerCareersRoutes(app: Express): void {


  // Careers - public with filtering options
  app.get("/api/careers", async (req, res) => {
    try {
      const { grade, state } = req.query;
      let careers;
      
      if (grade && typeof grade === "string") {
        careers = await storage.getCareersByGrade(grade);
      } else if (state && typeof state === "string") {
        careers = await storage.getCareersByState(state);
      } else {
        careers = await storage.getCareers();
      }
      res.json(careers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });


  // Get trending/high-growth careers based on BLS data
  app.get("/api/careers/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trendingCareers = await storage.getTrendingCareers(limit);
      res.json(trendingCareers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending careers" });
    }
  });


  app.get("/api/careers/recommended", async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const results = await storage.getSelfDiscoveryResults(userId);
      
      if (results.length === 0) {
        return res.json({ 
          hasAssessment: false, 
          recommendations: [],
          message: "Complete the Self-Discovery assessment to get personalized career recommendations"
        });
      }

      const latestResult = results[0];
      const limit = parseInt(req.query.limit as string) || 6;
      
      const recommendations = await storage.getRecommendedCareers(
        latestResult.beScore,
        latestResult.knowScore,
        latestResult.doScore,
        limit
      );

      res.json({ 
        hasAssessment: true,
        userProfile: {
          beScore: latestResult.beScore,
          knowScore: latestResult.knowScore,
          doScore: latestResult.doScore,
          strengths: latestResult.strengths
        },
        recommendations 
      });
    } catch (error) {
      console.error("Error fetching recommended careers:", error);
      res.status(500).json({ error: "Failed to fetch recommended careers" });
    }
  });


  // Get market trends data - aggregated BLS statistics
  app.get("/api/careers/market-trends", async (req, res) => {
    try {
      const { state } = req.query;
      const allCareers = state && typeof state === "string" 
        ? await storage.getCareersByState(state)
        : await storage.getCareers();
      
      // Calculate market trends summary
      const outlookCounts = { 
        much_faster: 0, 
        faster_than_average: 0, 
        average: 0, 
        little_change: 0, 
        declining: 0 
      };
      const demandCounts = { very_high: 0, high: 0, moderate: 0, low: 0 };
      const categoryCounts: Record<string, number> = {};
      let totalProjectedOpenings = 0;
      let avgGrowthRate = 0;
      
      allCareers.forEach(c => {
        if (c.jobOutlook) outlookCounts[c.jobOutlook]++;
        if (c.demandLevel) demandCounts[c.demandLevel]++;
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        totalProjectedOpenings += c.projectedOpenings || 0;
        avgGrowthRate += c.projectedGrowth || 0;
      });
      
      avgGrowthRate = allCareers.length > 0 ? avgGrowthRate / allCareers.length : 0;
      
      const topGrowingCareers = [...allCareers]
        .sort((a, b) => (b.projectedGrowth || 0) - (a.projectedGrowth || 0))
        .slice(0, 5)
        .map(c => ({ id: c.id, title: c.title, growth: c.projectedGrowth, category: c.category }));
      
      const highDemandCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
      
      res.json({
        summary: {
          totalCareers: allCareers.length,
          totalProjectedOpenings,
          avgGrowthRate: Math.round(avgGrowthRate * 10) / 10,
          lastUpdated: "2024-09",
          source: "Bureau of Labor Statistics (BLS)"
        },
        outlookDistribution: outlookCounts,
        demandDistribution: demandCounts,
        topGrowingCareers,
        highDemandCategories,
        stateFilter: state || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market trends" });
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
      const { beScore, knowScore, doScore, totalScore, strengths, growthAreas, answers } = req.body;
      
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
      
      // Also update the student's Be-Know-Do journey progress
      let journey = await storage.getStudentJourneyProgressByUserId(userId);
      if (!journey) {
        // Auto-create journey if it doesn't exist
        journey = await storage.createStudentJourneyProgress({
          studentId: userId,
          educatorUserId: userId,
          organizationId: null,
          beScore: 0,
          knowScore: 0,
          doScore: 0,
          overallScore: 0,
          totalAssessmentsCompleted: 0,
          totalMilestonesAchieved: 0,
          currentFocus: "be",
          savedCareerIds: [],
          latestAssessmentResults: null,
        });
      }
      
      // Update journey with assessment results
      const overallScore = Math.round((beScore + knowScore + doScore) / 3);
      await storage.updateStudentJourneyProgress(journey.id, {
        beScore,
        knowScore,
        doScore,
        overallScore,
        totalAssessmentsCompleted: (journey.totalAssessmentsCompleted || 0) + 1,
        latestAssessmentResults: {
          completedAt: new Date().toISOString(),
          beAnswers: answers,
          knowAnswers: answers,
          doAnswers: answers,
          strengths: strengths || [],
          growthAreas: growthAreas || [],
        },
        lastActivityDate: new Date(),
      });
      
      // Log the assessment activity
      await storage.createStudentJourneyActivity({
        journeyProgressId: journey.id,
        studentId: userId,
        activityType: "assessment",
        title: "Self-Discovery Assessment Completed",
        description: `Be: ${beScore}%, Know: ${knowScore}%, Do: ${doScore}%`,
        category: "be",
        pointsEarned: overallScore,
        metadata: { beScore, knowScore, doScore, strengths, growthAreas },
      });
      
      // Also create a journey entry for the timeline
      // Get user role for journey entry context
      const user = await storage.getUser(userId);
      await storage.createStudentJourneyEntry({
        userId,
        userRole: user?.role || "student",
        entryType: "assessment",
        bkdPillar: "be",
        title: "Completed Self-Discovery Assessment",
        description: `Discovered strengths in ${(strengths || []).slice(0, 2).join(", ") || "various areas"}. Scores: Be ${beScore}%, Know ${knowScore}%, Do ${doScore}%`,
        pointsEarned: Math.round(overallScore / 10),
        metadata: {
          assessmentId: result.id,
        },
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
      
      // Create a journey entry for career exploration
      // Get user role for journey entry context
      const user = await storage.getUser(userId);
      await storage.createStudentJourneyEntry({
        userId,
        userRole: user?.role || "student",
        entryType: "career_exploration",
        bkdPillar: "know",
        title: `Saved Career: ${req.body.careerTitle || "New Career"}`,
        description: req.body.careerCategory ? `Exploring ${req.body.careerCategory} careers` : "Added to career exploration list",
        pointsEarned: 2,
        metadata: {
          careerId: career.id,
        },
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
  // Saved Scholarships
  // ================================

  app.get("/api/saved-scholarships", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const items = await storage.getSavedScholarships(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved scholarships" });
    }
  });


  app.post("/api/saved-scholarships", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { resourceId, resourceTitle, resourceAmount, resourceDeadline, resourceUrl, scholarshipType, notes, pursuitReason } = req.body;
      if (!resourceId || !resourceTitle) return res.status(400).json({ error: "resourceId and resourceTitle required" });
      const cleanReason = (pursuitReason || "").toString().trim();
      if (cleanReason.length < 5) {
        return res.status(400).json({ error: "Tell us why you're pursuing this scholarship (at least 5 characters)." });
      }
      const already = await storage.isSavedScholarship(userId, resourceId);
      if (already) return res.json({ alreadySaved: true });

      // Save to bookmarks
      const saved = await storage.saveScholarship({ userId, resourceId, resourceTitle, resourceAmount, resourceDeadline, resourceUrl, notes, pursuitReason: cleanReason });

      // Also add to scholarship planner (if not already there for this resource)
      const existingApp = await db
        .select({ id: scholarshipApplications.id })
        .from(scholarshipApplications)
        .where(and(eq(scholarshipApplications.userId, userId), eq(scholarshipApplications.resourceId, resourceId)))
        .limit(1);

      if (existingApp.length === 0) {
        const season = detectSeasonFromDeadline(resourceDeadline || "");
        await db.insert(scholarshipApplications).values({
          userId,
          scholarshipName: resourceTitle,
          scholarshipUrl: resourceUrl || null,
          resourceId,
          amount: resourceAmount || null,
          deadline: resourceDeadline || null,
          season: season as any,
          scholarshipType: scholarshipType || null,
          status: "planned",
          essayRequired: false,
          transcriptRequired: false,
          referencesRequired: 0,
          checklist: [],
          notes: notes || null,
        });
      }

      res.status(201).json({ ...saved, addedToPlanner: existingApp.length === 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to save scholarship" });
    }
  });


  app.delete("/api/saved-scholarships/:resourceId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      await storage.unsaveScholarship(userId, req.params.resourceId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsave scholarship" });
    }
  });


  app.patch("/api/saved-scholarships/:resourceId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const cleanReason = ((req.body?.pursuitReason ?? "") as string).toString().trim();
      if (cleanReason.length < 5) {
        return res.status(400).json({ error: "Tell us why you're pursuing this scholarship (at least 5 characters)." });
      }
      const updated = await storage.updateSavedScholarshipReason(userId, req.params.resourceId, cleanReason);
      if (!updated) return res.status(404).json({ error: "Saved scholarship not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update saved scholarship" });
    }
  });


  // ===========================================
  // STRENGTHS INVENTORY (BE Pillar)
  // ===========================================
  
  app.get("/api/strengths", isAuthenticated, async (req: any, res) => {
    try {
      const strengths = await storage.getStrengthsInventory(req.user?.claims?.sub);
      res.json(strengths);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch strengths" });
    }
  });


  app.post("/api/strengths", isAuthenticated, async (req: any, res) => {
    try {
      const strength = await storage.createStrength({
        ...req.body,
        userId: req.user?.claims?.sub,
      });
      res.json(strength);
    } catch (e) {
      res.status(500).json({ error: "Failed to create strength" });
    }
  });


  app.patch("/api/strengths/:id", isAuthenticated, async (req: any, res) => {
    try {
      const strength = await storage.updateStrength(req.params.id, req.body, req.user?.claims?.sub);
      if (!strength) {
        res.status(404).json({ error: "Strength not found" });
        return;
      }
      res.json(strength);
    } catch (e) {
      res.status(500).json({ error: "Failed to update strength" });
    }
  });


  app.delete("/api/strengths/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteStrength(req.params.id, req.user?.claims?.sub);
      if (!success) {
        res.status(404).json({ error: "Strength not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete strength" });
    }
  });


  // ===========================================
  // SCHOLARSHIP APPLICATIONS (Planner)
  // ===========================================
  
  app.get("/api/scholarship-applications", isAuthenticated, async (req: any, res) => {
    try {
      const applications = await storage.getScholarshipApplications(req.user?.claims?.sub);
      res.json(applications);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });


  app.get("/api/scholarship-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const application = await storage.getScholarshipApplication(req.params.id);
      if (!application || application.userId !== req.user?.claims?.sub) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json(application);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });


  app.post("/api/scholarship-applications", isAuthenticated, async (req: any, res) => {
    try {
      const application = await storage.createScholarshipApplication({
        ...req.body,
        userId: req.user?.claims?.sub,
      });
      res.json(application);
    } catch (e) {
      res.status(500).json({ error: "Failed to create application" });
    }
  });


  app.patch("/api/scholarship-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const application = await storage.updateScholarshipApplication(req.params.id, req.body, req.user?.claims?.sub);
      if (!application) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json(application);
    } catch (e) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });


  app.delete("/api/scholarship-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteScholarshipApplication(req.params.id, req.user?.claims?.sub);
      if (!success) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete application" });
    }
  });


  // ===========================================
  // MENTOR SYSTEM
  // ===========================================
  
  app.get("/api/mentors", async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.careerField) filters.careerField = req.query.careerField;
      if (req.query.available === "true") filters.isAvailable = true;
      const mentors = await storage.getMentorProfiles(filters);
      res.json(mentors);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });


  app.get("/api/mentors/me", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.getMentorProfileByUser(req.user?.claims?.sub);
      res.json(profile || null);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mentor profile" });
    }
  });


  app.post("/api/mentors", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.createMentorProfile({
        ...req.body,
        userId: req.user?.claims?.sub,
      });
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: "Failed to create mentor profile" });
    }
  });


  app.patch("/api/mentors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profile = await storage.updateMentorProfile(req.params.id, req.body, req.user?.claims?.sub);
      if (!profile) {
        res.status(404).json({ error: "Mentor profile not found" });
        return;
      }
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: "Failed to update mentor profile" });
    }
  });


  // Mentor connections
  app.get("/api/mentor-connections", isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getMentorConnections(req.user?.claims?.sub);
      res.json(connections);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });


  app.get("/api/mentor-connections/mentor/:mentorId", isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getMentorConnectionsForMentor(req.params.mentorId);
      res.json(connections);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch mentor connections" });
    }
  });


  app.post("/api/mentor-connections", isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.createMentorConnection({
        ...req.body,
        studentUserId: req.user?.claims?.sub,
      });
      res.json(connection);
    } catch (e) {
      res.status(500).json({ error: "Failed to create connection" });
    }
  });


  app.patch("/api/mentor-connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const connection = await storage.updateMentorConnection(req.params.id, req.body);
      if (!connection) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }
      res.json(connection);
    } catch (e) {
      res.status(500).json({ error: "Failed to update connection" });
    }
  });


  app.get("/api/mentor-content-recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const items = await storage.getApprovedRssContentByPlacement("mentor_connect");
      res.json(items.slice(0, 20));
    } catch (error) {
      res.status(500).json({ error: "Failed to get mentor content" });
    }
  });
}
