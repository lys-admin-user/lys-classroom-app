import { 
  type Lesson,
  type InsertLesson,
  type Goal,
  type InsertGoal,
  type Career,
  type Resource,
  type Assessment,
  type AssessmentResult,
  type LessonPlan,
  type EducatorProfile,
  type InsertEducatorProfile,
  type FoundationModule,
  type InsertFoundationModule,
  type FoundationProgress,
  foundationModules,
  foundationProgress,
  type User,
  type UserRole,
  type UserTier,
  type UserPreferences,
  type InsertUserPreferences,
  type ScopeSequence,
  type InsertScopeSequence,
  type SequenceUnit,
  type InsertSequenceUnit,
  type ScopeChangeRequest,
  type InsertScopeChangeRequest,
  type SelfDiscoveryResult,
  type InsertSelfDiscoveryResult,
  type SavedCareer,
  type InsertSavedCareer,
  type EducatorAffiliate,
  type InsertEducatorAffiliate,
  type ReferralEvent,
  type CAICountry,
  type InsertReferralEvent,
  type AffiliateReward,
  type InsertAffiliateReward,
  type WalletTransaction,
  type InsertWalletTransaction,
  type PromoAsset,
  type InsertPromoAsset,
  AFFILIATE_CONVERSION_RATE,
  type StandardsJurisdiction,
  type InsertStandardsJurisdiction,
  type StandardSet,
  type InsertStandardSet,
  type EducationalStandard,
  type InsertEducationalStandard,
  type SyncLog,
  type InsertSyncLog,
  type StandardsStaging,
  type InsertStandardsStaging,
  type SourceChecksum,
  type InsertSourceChecksum,
  type PdfImport,
  type InsertPdfImport,
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type ClassStudent,
  type InsertClassStudent,
  type StudentGroup,
  type InsertStudentGroup,
  type Assignment,
  type InsertAssignment,
  type AssignmentRecipient,
  type InsertAssignmentRecipient,
  type GradeCategory,
  type InsertGradeCategory,
  type StudentGrade,
  type InsertStudentGrade,
  type GradingPeriod,
  type InsertGradingPeriod,
  type CollaborationSession,
  type InsertCollaborationSession,
  type SessionParticipant,
  type InsertSessionParticipant,
  type CollaborationMessage,
  type InsertCollaborationMessage,
  type SharedResource,
  type InsertSharedResource,
  type ResourceLike,
  type InsertResourceLike,
  type KnowResource,
  type InsertKnowResource,
  type Institution,
  type InsertInstitution,
  type ScholarshipScrapeRun,
  type InsertScholarshipScrapeRun,
  type UrlDiscoveryStatus,
  type StudentMatriculationHistory,
  type InsertStudentMatriculationHistory,
  type SystemAchievement,
  type InsertSystemAchievement,
  type StudentAchievement,
  type InsertStudentAchievement,
  studentMatriculationHistory,
  systemAchievements,
  studentAchievements,
  type SessionEditHistory,
  type InsertSessionEditHistory,
  type Organization,
  type InsertOrganization,
  type OrgMembership,
  type InsertOrgMembership,
  type OrgInvitation,
  type InsertOrgInvitation,
  type SiteAdmin,
  type InsertSiteAdmin,
  type ParentStudentLink,
  type InsertParentStudentLink,
  type ParentInvitation,
  type InsertParentInvitation,
  type ParentProgressNote,
  type InsertParentProgressNote,
  type QuietHours,
  type InsertQuietHours,
  type ParentBroadcastPost,
  type InsertParentBroadcastPost,
  type ParentNotificationPreferences,
  type InsertParentNotificationPreferences,
  type PortfolioReport,
  type InsertPortfolioReport,
  type ParentMessageThread,
  type InsertParentMessageThread,
  type ParentMessage,
  type InsertParentMessage,
  type FeatureFlag,
  type InsertFeatureFlag,
  type EmailTemplate,
  type InsertEmailTemplate,
  type StudentTransferRequest,
  type InsertStudentTransferRequest,
  type TransferRequestStatus,
  lessons,
  goals,
  educatorProfiles,
  users,
  userPreferences,
  scopeSequences,
  sequenceUnits,
  scopeChangeRequests,
  selfDiscoveryResults,
  savedCareers,
  educatorAffiliates,
  referralEvents,
  affiliateRewards,
  affiliateWalletTransactions,
  affiliatePromoAssets,
  standardsJurisdictions,
  standardSets,
  educationalStandardsDb,
  standardsSyncLog,
  standardsStaging,
  sourceChecksums,
  pdfImportQueue,
  classes,
  students,
  classStudents,
  studentGroups,
  assignments,
  assignmentRecipients,
  gradeCategories,
  studentGrades,
  gradingPeriods,
  collaborationSessions,
  sessionParticipants,
  collaborationMessages,
  sharedResources,
  resourceLikes,
  knowResources,
  institutions,
  scholarshipScrapeRuns,
  marketplaceItems,
  marketplacePurchases,
  marketplaceWishlists,
  marketplaceRatings,
  savedScholarships,
  resourceReports,
  type ResourceReport,
  type InsertResourceReport,
  REPORT_AUTOHIDE_THRESHOLD,
  type MarketplaceItem,
  type InsertMarketplaceItem,
  type MarketplacePurchase,
  type InsertMarketplacePurchase,
  type MarketplaceWishlist,
  type InsertMarketplaceWishlist,
  type MarketplaceRating,
  type InsertMarketplaceRating,
  type SavedScholarship,
  type InsertSavedScholarship,
  sessionEditHistory,
  organizations,
  organizationMemberships,
  organizationInvitations,
  siteAdmins,
  parentStudentLinks,
  parentInvitations,
  parentProgressNotes,
  quietHours,
  parentBroadcastPosts,
  parentNotificationPreferences,
  portfolioReports,
  parentMessageThreads,
  parentMessages,
  featureFlags,
  emailTemplates,
  studentTransferRequests,
  authorities,
  lyseMilestones,
  workforceTrends,
  alignmentMatrix,
  type Authority,
  type InsertAuthority,
  type LyseMilestone,
  type InsertLyseMilestone,
  type WorkforceTrend,
  type InsertWorkforceTrend,
  type AlignmentMatrix,
  type InsertAlignmentMatrix,
  type EntityShare,
  type InsertEntityShare,
  entityShares,
  lessonGenerations,
  guestLessonGenerations,
  type InsertLessonGeneration,
  type EducatorCareerGoal,
  type InsertEducatorCareerGoal,
  type EducatorSkill,
  type InsertEducatorSkill,
  type PDResource,
  type InsertPDResource,
  type PDRecommendation,
  type InsertPDRecommendation,
  type EducatorPDProgress,
  type InsertEducatorPDProgress,
  educatorCareerGoals,
  educatorSkills,
  pdResources,
  pdRecommendations,
  educatorPDProgress,
  type StudentJourneyProgress,
  type InsertStudentJourneyProgress,
  type StudentJourneyMilestone,
  type InsertStudentJourneyMilestone,
  type StudentJourneyActivity,
  type InsertStudentJourneyActivity,
  type StudentJourneyEntry,
  type InsertStudentJourneyEntry,
  type StudentJourneyProgressHistory,
  type InsertStudentJourneyProgressHistory,
  studentJourneyProgress,
  studentJourneyMilestones,
  studentJourneyActivities,
  studentJourneyEntries,
  studentJourneyProgressHistory,
  type LessonTemplate,
  type InsertLessonTemplate,
  lessonTemplates,
  type StudentPortfolio,
  type InsertStudentPortfolio,
  studentPortfolios,
  type PortfolioItem,
  type InsertPortfolioItem,
  portfolioItems,
  type PortfolioComment,
  type InsertPortfolioComment,
  portfolioComments,
  type SponsoredAccess,
  sponsoredAccess,
  type ContextualSponsorship,
  contextualSponsorships,
  type SisConnection,
  type InsertSisConnection,
  sisConnections,
  type SisSyncHistory,
  type InsertSisSyncHistory,
  sisSyncHistory,
  type SisStudent,
  type InsertSisStudent,
  sisStudents,
  type SisCourse,
  type InsertSisCourse,
  sisCourses,
  type StudentNote,
  type InsertStudentNote,
  studentNotes,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  attendanceRecords,
  type SystemLessonAuthor,
  type InsertSystemLessonAuthor,
  systemLessonAuthors,
  type CampusLessonAuthor,
  type InsertCampusLessonAuthor,
  campusLessonAuthors,
  type MasterLesson,
  type InsertMasterLesson,
  masterLessons,
  type ContentLibraryItem,
  type InsertContentLibrary,
  contentLibrary,
  type LessonBulkImport,
  type InsertLessonBulkImport,
  lessonBulkImports,
  type QuestionBank,
  type InsertQuestionBank,
  questionBanks,
  type AuthorQualityMetrics,
  type InsertAuthorQualityMetrics,
  authorQualityMetrics,
  type AssignmentAlignment,
  type InsertAssignmentAlignment,
  assignmentAlignments,
  type ResourceRating,
  type InsertResourceRating,
  resourceRatings,
  type StudentNarrative,
  type InsertStudentNarrative,
  studentNarratives,
  type StrengthsInventory,
  type InsertStrengthsInventory,
  strengthsInventory,
  type CampusActivity,
  type InsertCampusActivity,
  campusActivities,
  type ScholarshipApplication,
  type InsertScholarshipApplication,
  scholarshipApplications,
  type MentorProfile,
  type InsertMentorProfile,
  mentorProfiles,
  type MentorConnection,
  type InsertMentorConnection,
  mentorConnections,
  type FreeTrial,
  type InsertFreeTrial,
  freeTrials,
  type RssFeed,
  type InsertRssFeed,
  rssFeeds,
  type RssContentItem,
  type InsertRssContentItem,
  rssContentItems,
  type RssContentStatus,
  type RssPlacement,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, asc, gte, sql, or, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

import {
  DatabaseStorage,
  seedResources,
  seedCareers,
  caiCountries,
  type EducatorPerformanceMetric,
  type CampusPerformanceMetric,
  type OrganizationPerformanceMetric,
  type SystemWideStats,
  type MatriculationStats,
  type AchievementStats,
} from "./_base";

// AUTO-SPLIT from server/storage/database.ts -- domain: careers (46 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const careersMethods: ThisType<DatabaseStorage> = {


  // Static data - careers
  async getCareers(): Promise<Career[]> {
    return seedCareers;
  },


  async getCareer(id: string): Promise<Career | undefined> {
    return seedCareers.find(c => c.id === id);
  },


  async getCareersByGrade(gradeBand: string): Promise<Career[]> {
    return seedCareers.filter(c => 
      c.appropriateGrades?.includes(gradeBand as any) ?? true
    );
  },


  async getTrendingCareers(limit: number = 10): Promise<Career[]> {
    // Sort by growth rate and demand level
    const outlookOrder = { "much_faster": 5, "faster_than_average": 4, "average": 3, "little_change": 2, "declining": 1 };
    const demandOrder = { "very_high": 4, "high": 3, "moderate": 2, "low": 1 };
    
    return [...seedCareers]
      .sort((a, b) => {
        const aOutlook = outlookOrder[a.jobOutlook || "average"] || 3;
        const bOutlook = outlookOrder[b.jobOutlook || "average"] || 3;
        const aDemand = demandOrder[a.demandLevel || "moderate"] || 2;
        const bDemand = demandOrder[b.demandLevel || "moderate"] || 2;
        
        // Primary sort by outlook, secondary by demand
        if (bOutlook !== aOutlook) return bOutlook - aOutlook;
        return bDemand - aDemand;
      })
      .slice(0, limit);
  },


  async getCareersByState(stateCode: string): Promise<Career[]> {
    // Filter careers that have state-specific data for the given state
    return seedCareers.filter(c => 
      c.stateSalaryData && stateCode in c.stateSalaryData
    ).map(c => ({
      ...c,
      // Override national salary data with state-specific data
      salaryMin: c.stateSalaryData![stateCode].min,
      salaryMax: c.stateSalaryData![stateCode].max,
      salaryMedian: c.stateSalaryData![stateCode].median,
      demandLevel: c.stateSalaryData![stateCode].demandLevel || c.demandLevel,
    }));
  },


  async updateCareerFromBls(blsCode: string, updates: Partial<Career>): Promise<Career | undefined> {
    const index = seedCareers.findIndex(c => c.blsCode === blsCode);
    if (index === -1) return undefined;
    
    seedCareers[index] = {
      ...seedCareers[index],
      ...updates,
      blsLastUpdated: new Date().toISOString().slice(0, 7), // YYYY-MM format
    };
    
    return seedCareers[index];
  },


  async getRecommendedCareers(
    beScore: number,
    knowScore: number,
    doScore: number,
    limit: number = 10
  ): Promise<{ career: Career; matchScore: number; matchReasons: string[] }[]> {
    const userTotal = beScore + knowScore + doScore;
    if (userTotal === 0) return [];

    const userBePercent = (beScore / userTotal) * 100;
    const userKnowPercent = (knowScore / userTotal) * 100;
    const userDoPercent = (doScore / userTotal) * 100;

    const userPrimaryPillar = userBePercent >= userKnowPercent && userBePercent >= userDoPercent
      ? "be"
      : userKnowPercent >= userDoPercent
        ? "know"
        : "do";

    const recommendations = seedCareers
      .filter(career => career.bkdAlignment)
      .map(career => {
        const alignment = career.bkdAlignment!;
        const careerTotal = alignment.be + alignment.know + alignment.do;
        const careerBePercent = (alignment.be / careerTotal) * 100;
        const careerKnowPercent = (alignment.know / careerTotal) * 100;
        const careerDoPercent = (alignment.do / careerTotal) * 100;

        const beDiff = Math.abs(userBePercent - careerBePercent);
        const knowDiff = Math.abs(userKnowPercent - careerKnowPercent);
        const doDiff = Math.abs(userDoPercent - careerDoPercent);

        const matchScore = Math.max(0, 100 - (beDiff + knowDiff + doDiff));

        const matchReasons: string[] = [];
        if (alignment.primaryPillar === userPrimaryPillar) {
          matchReasons.push(`Strong ${userPrimaryPillar.toUpperCase()} alignment matches your profile`);
        }
        if (userBePercent > 35 && alignment.be >= 70) {
          matchReasons.push("Your identity-focused strengths align well with this role");
        }
        if (userKnowPercent > 35 && alignment.know >= 70) {
          matchReasons.push("Your knowledge-seeking nature fits this career's learning requirements");
        }
        if (userDoPercent > 35 && alignment.do >= 70) {
          matchReasons.push("Your action-oriented approach matches this hands-on career");
        }
        if (alignment.careerPersonality) {
          matchReasons.push(alignment.careerPersonality);
        }

        return { career, matchScore, matchReasons };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return recommendations;
  },


  // Self-Discovery Results
  async getSelfDiscoveryResults(userId: string): Promise<SelfDiscoveryResult[]> {
    return await db.select().from(selfDiscoveryResults)
      .where(eq(selfDiscoveryResults.userId, userId))
      .orderBy(desc(selfDiscoveryResults.createdAt));
  },


  async saveSelfDiscoveryResult(result: InsertSelfDiscoveryResult): Promise<SelfDiscoveryResult> {
    const [created] = await db.insert(selfDiscoveryResults).values(result as any).returning();
    return created;
  },


  // Saved Careers
  async getSavedCareers(userId: string): Promise<SavedCareer[]> {
    return await db.select().from(savedCareers)
      .where(eq(savedCareers.userId, userId))
      .orderBy(desc(savedCareers.createdAt));
  },


  async saveCareer(career: InsertSavedCareer): Promise<SavedCareer> {
    const [created] = await db.insert(savedCareers).values(career as any).returning();
    return created;
  },


  async deleteSavedCareer(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(savedCareers)
      .where(and(eq(savedCareers.id, id), eq(savedCareers.userId, userId)));
    if (!existing) return false;
    await db.delete(savedCareers).where(eq(savedCareers.id, id));
    return true;
  },


  // Saved Scholarships
  async getSavedScholarships(userId: string): Promise<SavedScholarship[]> {
    return await db.select().from(savedScholarships).where(eq(savedScholarships.userId, userId)).orderBy(desc(savedScholarships.createdAt));
  },


  async saveScholarship(data: InsertSavedScholarship): Promise<SavedScholarship> {
    const [created] = await db.insert(savedScholarships).values(data).returning();
    return created;
  },


  async unsaveScholarship(userId: string, resourceId: string): Promise<boolean> {
    await db.delete(savedScholarships).where(and(eq(savedScholarships.userId, userId), eq(savedScholarships.resourceId, resourceId)));
    return true;
  },


  async updateSavedScholarshipReason(userId: string, resourceId: string, pursuitReason: string): Promise<SavedScholarship | undefined> {
    const [updated] = await db.update(savedScholarships)
      .set({ pursuitReason })
      .where(and(eq(savedScholarships.userId, userId), eq(savedScholarships.resourceId, resourceId)))
      .returning();
    return updated;
  },


  async isSavedScholarship(userId: string, resourceId: string): Promise<boolean> {
    const [row] = await db.select().from(savedScholarships).where(and(eq(savedScholarships.userId, userId), eq(savedScholarships.resourceId, resourceId)));
    return !!row;
  },


  // ==========================================================================
  // Scholarship Scraper — Scrape runs
  // ==========================================================================
  async createScholarshipScrapeRun(data: InsertScholarshipScrapeRun): Promise<ScholarshipScrapeRun> {
    const [row] = await db.insert(scholarshipScrapeRuns).values(data as any).returning();
    return row;
  },


  async updateScholarshipScrapeRun(
    id: string,
    updates: Partial<ScholarshipScrapeRun>,
  ): Promise<ScholarshipScrapeRun | undefined> {
    const [row] = await db
      .update(scholarshipScrapeRuns)
      .set(updates as any)
      .where(eq(scholarshipScrapeRuns.id, id))
      .returning();
    return row || undefined;
  },


  async listScholarshipScrapeRuns(filters?: { limit?: number }): Promise<ScholarshipScrapeRun[]> {
    let q: any = db.select().from(scholarshipScrapeRuns).orderBy(desc(scholarshipScrapeRuns.startedAt));
    if (filters?.limit) q = q.limit(filters.limit);
    return await q;
  },


  // ==========================================================================
  // Scholarship Scraper — Scholarship upserts/lifecycle
  // ==========================================================================
  async upsertAutoImportedScholarship(data: {
    title: string;
    description?: string | null;
    url?: string | null;
    applicationUrl?: string | null;
    sourceInstitutionId: string;
    sourceUrl: string;
    scrapeRunId: string;
    scholarshipAmount?: string | null;
    scholarshipDeadline?: string | null;
    eligibilityCriteria?: string[];
    studentLevel?: string | null;
    isRecurring?: boolean;
    category?: string | null;
  }): Promise<{ created: boolean; resource: KnowResource }> {
    const now = new Date();
    // Match on (sourceInstitutionId, title) — this is the natural dedupe key
    const [existing] = await db
      .select()
      .from(knowResources)
      .where(
        and(
          eq(knowResources.sourceInstitutionId, data.sourceInstitutionId),
          eq(knowResources.title, data.title),
          eq(knowResources.autoImported, true),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(knowResources)
        .set({
          description: data.description ?? existing.description,
          url: data.url ?? existing.url,
          applicationUrl: data.applicationUrl ?? existing.applicationUrl,
          sourceUrl: data.sourceUrl,
          scrapeRunId: data.scrapeRunId,
          scholarshipAmount: data.scholarshipAmount ?? existing.scholarshipAmount,
          scholarshipDeadline: data.scholarshipDeadline ?? existing.scholarshipDeadline,
          eligibilityCriteria: data.eligibilityCriteria ?? existing.eligibilityCriteria,
          studentLevel: data.studentLevel ?? existing.studentLevel,
          isRecurring: data.isRecurring ?? existing.isRecurring,
          lastSeenAt: now,
          updatedAt: now,
        } as any)
        .where(eq(knowResources.id, existing.id))
        .returning();
      return { created: false, resource: updated };
    }

    const [created] = await db
      .insert(knowResources)
      .values({
        title: data.title,
        description: data.description || null,
        url: data.url || null,
        applicationUrl: data.applicationUrl || null,
        resourceType: "scholarship",
        category: data.category || null,
        sourceInstitutionId: data.sourceInstitutionId,
        sourceUrl: data.sourceUrl,
        scrapeRunId: data.scrapeRunId,
        scholarshipAmount: data.scholarshipAmount || null,
        scholarshipDeadline: data.scholarshipDeadline || null,
        eligibilityCriteria: data.eligibilityCriteria || [],
        studentLevel: data.studentLevel || null,
        isRecurring: data.isRecurring ?? false,
        autoImported: true,
        trustLevel: "community",
        isActive: false, // requires admin approval
        lastSeenAt: now,
        createdBy: "system-scholarship-scraper",
      } as any)
      .returning();
    return { created: true, resource: created };
  },


  async touchScholarshipsForInstitution(institutionId: string, scrapeRunId: string): Promise<number> {
    const now = new Date();
    const result = await db
      .update(knowResources)
      .set({ lastSeenAt: now, scrapeRunId } as any)
      .where(
        and(
          eq(knowResources.sourceInstitutionId, institutionId),
          eq(knowResources.autoImported, true),
        ),
      );
    return result.rowCount ?? 0;
  },


  async deactivateUnseenAutoImportedScholarships(currentRunId: string, institutionIds: string[]): Promise<number> {
    // Only deactivate auto-imported scholarships from institutions that were
    // successfully scraped/extracted this run. Institutions that failed
    // (fetch_failed, extract_failed, blocked_by_robots) are skipped so a
    // transient outage does not wipe out previously-approved listings.
    if (institutionIds.length === 0) return 0;
    const result = await db
      .update(knowResources)
      .set({ isActive: false, updatedAt: new Date() } as any)
      .where(
        and(
          eq(knowResources.autoImported, true),
          inArray(knowResources.sourceInstitutionId, institutionIds),
          sql`(${knowResources.scrapeRunId} IS NULL OR ${knowResources.scrapeRunId} <> ${currentRunId})`,
          eq(knowResources.isActive, true),
        ),
      );
    return result.rowCount ?? 0;
  },


  // ==========================================================================
  // Professional Development System
  // ==========================================================================

  async getEducatorCareerGoals(userId: string): Promise<EducatorCareerGoal[]> {
    return await db.select().from(educatorCareerGoals)
      .where(eq(educatorCareerGoals.userId, userId))
      .orderBy(desc(educatorCareerGoals.priority), desc(educatorCareerGoals.createdAt));
  },


  async getEducatorCareerGoal(id: string): Promise<EducatorCareerGoal | undefined> {
    const [goal] = await db.select().from(educatorCareerGoals).where(eq(educatorCareerGoals.id, id));
    return goal || undefined;
  },


  async createEducatorCareerGoal(goal: InsertEducatorCareerGoal): Promise<EducatorCareerGoal> {
    const [created] = await db.insert(educatorCareerGoals).values(goal as any).returning();
    return created;
  },


  async updateEducatorCareerGoal(id: string, userId: string, updates: Partial<EducatorCareerGoal>): Promise<EducatorCareerGoal | undefined> {
    const [updated] = await db.update(educatorCareerGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorCareerGoals.id, id), eq(educatorCareerGoals.userId, userId)))
      .returning();
    return updated || undefined;
  },


  async deleteEducatorCareerGoal(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(educatorCareerGoals)
      .where(and(eq(educatorCareerGoals.id, id), eq(educatorCareerGoals.userId, userId)));
    return true;
  },


  // Strengths Inventory (BE Pillar)
  async getStrengthsInventory(userId: string): Promise<StrengthsInventory[]> {
    return db.select().from(strengthsInventory)
      .where(eq(strengthsInventory.userId, userId))
      .orderBy(desc(strengthsInventory.createdAt));
  },


  async createStrength(strength: InsertStrengthsInventory): Promise<StrengthsInventory> {
    const [newStrength] = await db.insert(strengthsInventory).values(strength as any).returning();
    return newStrength;
  },


  async updateStrength(id: string, updates: Partial<StrengthsInventory>, userId: string): Promise<StrengthsInventory | undefined> {
    const [updated] = await db.update(strengthsInventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(strengthsInventory.id, id), eq(strengthsInventory.userId, userId)))
      .returning();
    return updated;
  },


  async deleteStrength(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(strengthsInventory)
      .where(and(eq(strengthsInventory.id, id), eq(strengthsInventory.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  },


  // Scholarship Applications (DO Pillar - Planner)
  async getScholarshipApplications(userId: string): Promise<ScholarshipApplication[]> {
    return db.select().from(scholarshipApplications)
      .where(eq(scholarshipApplications.userId, userId))
      .orderBy(desc(scholarshipApplications.createdAt));
  },


  async getScholarshipApplication(id: string): Promise<ScholarshipApplication | undefined> {
    const [app] = await db.select().from(scholarshipApplications)
      .where(eq(scholarshipApplications.id, id));
    return app;
  },


  async createScholarshipApplication(app: InsertScholarshipApplication): Promise<ScholarshipApplication> {
    const [newApp] = await db.insert(scholarshipApplications).values(app as any).returning();
    return newApp;
  },


  async updateScholarshipApplication(id: string, updates: Partial<ScholarshipApplication>, userId: string): Promise<ScholarshipApplication | undefined> {
    const [updated] = await db.update(scholarshipApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(scholarshipApplications.id, id), eq(scholarshipApplications.userId, userId)))
      .returning();
    return updated;
  },


  async deleteScholarshipApplication(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(scholarshipApplications)
      .where(and(eq(scholarshipApplications.id, id), eq(scholarshipApplications.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  },


  // Mentor System
  async getMentorProfiles(filters?: { careerField?: string; isAvailable?: boolean }): Promise<MentorProfile[]> {
    const conditions = [];
    if (filters?.isAvailable !== undefined) {
      conditions.push(eq(mentorProfiles.isAvailable, filters.isAvailable));
    }
    if (filters?.careerField) {
      conditions.push(sql`${mentorProfiles.careerFields}::jsonb @> ${JSON.stringify([filters.careerField])}::jsonb`);
    }
    if (conditions.length > 0) {
      return db.select().from(mentorProfiles).where(and(...conditions));
    }
    return db.select().from(mentorProfiles);
  },


  async getMentorProfile(id: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles)
      .where(eq(mentorProfiles.id, id));
    return profile;
  },


  async getMentorProfileByUser(userId: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles)
      .where(eq(mentorProfiles.userId, userId));
    return profile;
  },


  async createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile> {
    const [newProfile] = await db.insert(mentorProfiles).values(profile as any).returning();
    return newProfile;
  },


  async updateMentorProfile(id: string, updates: Partial<MentorProfile>, userId: string): Promise<MentorProfile | undefined> {
    const [updated] = await db.update(mentorProfiles)
      .set(updates)
      .where(and(eq(mentorProfiles.id, id), eq(mentorProfiles.userId, userId)))
      .returning();
    return updated;
  },


  async getMentorConnections(userId: string): Promise<MentorConnection[]> {
    return db.select().from(mentorConnections)
      .where(eq(mentorConnections.studentUserId, userId))
      .orderBy(desc(mentorConnections.createdAt));
  },


  async getMentorConnectionsForMentor(mentorId: string): Promise<MentorConnection[]> {
    return db.select().from(mentorConnections)
      .where(eq(mentorConnections.mentorId, mentorId))
      .orderBy(desc(mentorConnections.createdAt));
  },


  async createMentorConnection(connection: InsertMentorConnection): Promise<MentorConnection> {
    const [newConnection] = await db.insert(mentorConnections).values(connection).returning();
    return newConnection;
  },


  async updateMentorConnection(id: string, updates: Partial<MentorConnection>): Promise<MentorConnection | undefined> {
    const [updated] = await db.update(mentorConnections)
      .set(updates)
      .where(eq(mentorConnections.id, id))
      .returning();
    return updated;
  },
};

Object.assign(DatabaseStorage.prototype, careersMethods);
