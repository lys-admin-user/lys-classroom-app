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
  type SsoConnection,
  type InsertSsoConnection,
  ssoConnections,
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

// AUTO-SPLIT from server/storage/database.ts -- domain: misc (104 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const miscMethods: ThisType<DatabaseStorage> = {


  // ==========================================================================
  // Foundation onboarding
  // ==========================================================================

  async getFoundationModules(): Promise<FoundationModule[]> {
    return db.select().from(foundationModules)
      .where(eq(foundationModules.isPublished, true))
      .orderBy(foundationModules.order);
  },


  async updateFoundationModule(slug: string, updates: Partial<InsertFoundationModule>): Promise<FoundationModule | undefined> {
    // Cast to any to bypass Drizzle's PgUpdateSetSource narrowing on enum-typed columns
    // (`contentType` is a string-literal union; the partial-input shape widens it to string).
    const [updated] = await db.update(foundationModules)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(foundationModules.slug, slug))
      .returning();
    return updated || undefined;
  },


  async getFoundationRollup(): Promise<Array<{
    slug: string;
    title: string;
    order: number;
    contentType: string;
    totalStaff: number;
    viewedCount: number;
    completedCount: number;
    completionPct: number;
    avgQuizScore: number | null;
  }>> {
    const FOUNDATION_ROLES = ["staff", "site_admin", "system_admin"];
    const staffRows = await db.select({ id: users.id }).from(users)
      .where(inArray(users.role, FOUNDATION_ROLES as any));
    const staffIds = new Set(staffRows.map((r) => r.id));
    const totalStaff = staffIds.size;

    const modules = await db.select().from(foundationModules)
      .where(eq(foundationModules.isPublished, true))
      .orderBy(foundationModules.order);

    const allProgress = await db.select().from(foundationProgress);
    // Filter to staff progress only.
    const staffProgress = allProgress.filter((p) => staffIds.has(p.userId));

    return modules.map((m) => {
      const rows = staffProgress.filter((p) => p.moduleSlug === m.slug);
      const viewedCount = rows.length;
      const completedCount = rows.filter((p) => p.completedAt).length;
      const quizScores = rows.map((p) => p.quizScore).filter((s): s is number => typeof s === "number");
      const avgQuizScore = quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : null;
      const completionPct = totalStaff > 0 ? Math.round((completedCount / totalStaff) * 100) : 0;
      return {
        slug: m.slug,
        title: m.title,
        order: m.order,
        contentType: m.contentType,
        totalStaff,
        viewedCount,
        completedCount,
        completionPct,
        avgQuizScore,
      };
    });
  },


  async getActiveSponsorship(placement: string): Promise<ContextualSponsorship | undefined> {
    const now = new Date();
    const [sponsor] = await db.select()
      .from(contextualSponsorships)
      .where(and(
        eq(contextualSponsorships.placement, placement as any),
        eq(contextualSponsorships.isActive, true),
        eq(contextualSponsorships.minorsSafe, true)
      ))
      .limit(1);
    return sponsor || undefined;
  },


  async getAllPendingChangeRequests(): Promise<ScopeChangeRequest[]> {
    return await db.select().from(scopeChangeRequests)
      .where(eq(scopeChangeRequests.status, "pending"))
      .orderBy(desc(scopeChangeRequests.createdAt));
  },


  // Wallet & Hybrid Affiliate
  async getWalletTransactions(affiliateId: string, limit: number = 50): Promise<WalletTransaction[]> {
    return await db.select().from(affiliateWalletTransactions)
      .where(eq(affiliateWalletTransactions.affiliateId, affiliateId))
      .orderBy(desc(affiliateWalletTransactions.createdAt))
      .limit(limit);
  },


  async createWalletTransaction(tx: InsertWalletTransaction): Promise<WalletTransaction> {
    const [created] = await db.insert(affiliateWalletTransactions).values(tx as any).returning();
    return created;
  },


  async convertPointsToCash(affiliateId: string, pointsToConvert: number): Promise<{ success: boolean; cashCents: number; remainingPoints: number }> {
    const { pointsPerDollar, minimumPointsToConvert } = AFFILIATE_CONVERSION_RATE;
    
    if (pointsToConvert < minimumPointsToConvert) {
      return { success: false, cashCents: 0, remainingPoints: 0 };
    }

    const affiliate = await this.getEducatorAffiliateById(affiliateId);
    if (!affiliate || (affiliate.totalPoints || 0) < pointsToConvert) {
      return { success: false, cashCents: 0, remainingPoints: affiliate?.totalPoints || 0 };
    }

    const cashCents = Math.floor((pointsToConvert / pointsPerDollar) * 100);
    const newPoints = (affiliate.totalPoints || 0) - pointsToConvert;
    const newCash = (affiliate.cashBalance || 0) + cashCents;

    await db.update(educatorAffiliates)
      .set({ totalPoints: newPoints, cashBalance: newCash, updatedAt: new Date() })
      .where(eq(educatorAffiliates.id, affiliateId));

    await this.createWalletTransaction({
      affiliateId,
      type: "points_redeemed",
      pointsAmount: -pointsToConvert,
      cashAmountCents: 0,
      description: `Converted ${pointsToConvert} points`,
      status: "completed",
    });

    await this.createWalletTransaction({
      affiliateId,
      type: "cash_conversion",
      pointsAmount: 0,
      cashAmountCents: cashCents,
      description: `Cash credit from ${pointsToConvert} points ($${(cashCents / 100).toFixed(2)})`,
      status: "completed",
    });

    return { success: true, cashCents, remainingPoints: newPoints };
  },


  // Promo Assets
  async createPromoAsset(asset: InsertPromoAsset): Promise<PromoAsset> {
    const [created] = await db.insert(affiliatePromoAssets).values(asset as any).returning();
    return created;
  },


  async getPromoAssets(affiliateId: string): Promise<PromoAsset[]> {
    return await db.select().from(affiliatePromoAssets)
      .where(eq(affiliatePromoAssets.affiliateId, affiliateId))
      .orderBy(desc(affiliatePromoAssets.createdAt));
  },


  // Educational Standards Ingestion
  async getJurisdictions(country?: string): Promise<StandardsJurisdiction[]> {
    if (country) {
      return await db.select().from(standardsJurisdictions)
        .where(eq(standardsJurisdictions.country, country))
        .orderBy(asc(standardsJurisdictions.name));
    }
    return await db.select().from(standardsJurisdictions)
      .orderBy(asc(standardsJurisdictions.country), asc(standardsJurisdictions.name));
  },


  async getJurisdiction(id: string): Promise<StandardsJurisdiction | undefined> {
    const [result] = await db.select().from(standardsJurisdictions)
      .where(eq(standardsJurisdictions.id, id));
    return result || undefined;
  },


  async getJurisdictionByAbbr(country: string, abbreviation: string): Promise<StandardsJurisdiction | undefined> {
    const [result] = await db.select().from(standardsJurisdictions)
      .where(and(
        eq(standardsJurisdictions.country, country),
        eq(standardsJurisdictions.abbreviation, abbreviation)
      ));
    return result || undefined;
  },


  async createJurisdiction(jurisdiction: InsertStandardsJurisdiction): Promise<StandardsJurisdiction> {
    const [created] = await db.insert(standardsJurisdictions).values(jurisdiction as any).returning();
    return created;
  },


  async updateJurisdiction(id: string, updates: Partial<StandardsJurisdiction>): Promise<StandardsJurisdiction | undefined> {
    const [updated] = await db.update(standardsJurisdictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standardsJurisdictions.id, id))
      .returning();
    return updated || undefined;
  },


  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [created] = await db.insert(standardsSyncLog).values(log as any).returning();
    return created;
  },


  async updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<SyncLog | undefined> {
    const [updated] = await db.update(standardsSyncLog)
      .set(updates)
      .where(eq(standardsSyncLog.id, id))
      .returning();
    return updated || undefined;
  },


  async getLatestSyncLogs(limit: number = 20): Promise<SyncLog[]> {
    return await db.select().from(standardsSyncLog)
      .orderBy(desc(standardsSyncLog.startedAt))
      .limit(limit);
  },


  // Source Checksums (Change Detection)
  async createSourceChecksum(checksum: InsertSourceChecksum): Promise<SourceChecksum> {
    const [created] = await db.insert(sourceChecksums).values(checksum as any).returning();
    return created;
  },


  async getSourceChecksum(sourceUrl: string): Promise<SourceChecksum | undefined> {
    const [result] = await db.select().from(sourceChecksums)
      .where(eq(sourceChecksums.sourceUrl, sourceUrl));
    return result || undefined;
  },


  async updateSourceChecksum(id: string, updates: Partial<SourceChecksum>): Promise<SourceChecksum | undefined> {
    const [updated] = await db.update(sourceChecksums)
      .set({ ...updates, lastCheckedAt: new Date() })
      .where(eq(sourceChecksums.id, id))
      .returning();
    return updated || undefined;
  },


  async getChangedSources(): Promise<SourceChecksum[]> {
    return await db.select().from(sourceChecksums)
      .where(eq(sourceChecksums.hasChanged, true));
  },


  // PDF Import Queue
  async createPdfImport(pdfImport: InsertPdfImport): Promise<PdfImport> {
    const [created] = await db.insert(pdfImportQueue).values(pdfImport as any).returning();
    return created;
  },


  async getPdfImport(id: string): Promise<PdfImport | undefined> {
    const [result] = await db.select().from(pdfImportQueue)
      .where(eq(pdfImportQueue.id, id));
    return result || undefined;
  },


  async updatePdfImport(id: string, updates: Partial<PdfImport>): Promise<PdfImport | undefined> {
    const [updated] = await db.update(pdfImportQueue)
      .set(updates)
      .where(eq(pdfImportQueue.id, id))
      .returning();
    return updated || undefined;
  },


  async getPdfImports(userId: string): Promise<PdfImport[]> {
    return await db.select().from(pdfImportQueue)
      .where(eq(pdfImportQueue.userId, userId))
      .orderBy(desc(pdfImportQueue.createdAt));
  },


  // Entity Sharing
  async createEntityShare(share: InsertEntityShare): Promise<EntityShare> {
    const [result] = await db.insert(entityShares).values(share as any).returning();
    return result;
  },


  async getEntityShare(id: string): Promise<EntityShare | undefined> {
    const [result] = await db.select().from(entityShares).where(eq(entityShares.id, id));
    return result || undefined;
  },


  async getEntityShares(entityType: string, entityId: string): Promise<EntityShare[]> {
    return await db.select().from(entityShares)
      .where(and(eq(entityShares.entityType, entityType as any), eq(entityShares.entityId, entityId)))
      .orderBy(desc(entityShares.createdAt));
  },


  async deleteEntityShare(id: string): Promise<boolean> {
    await db.delete(entityShares).where(eq(entityShares.id, id));
    return true;
  },


  // Assignments
  async getAssignments(userId: string): Promise<Assignment[]> {
    return await db.select().from(assignments)
      .where(eq(assignments.userId, userId))
      .orderBy(desc(assignments.createdAt));
  },


  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [result] = await db.select().from(assignments).where(eq(assignments.id, id));
    return result || undefined;
  },


  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(assignment as any).returning();
    return created;
  },


  async updateAssignment(id: string, updates: Partial<Assignment>, userId: string): Promise<Assignment | undefined> {
    const existing = await this.getAssignment(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteAssignment(id: string, userId: string): Promise<boolean> {
    const existing = await this.getAssignment(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(assignments).where(eq(assignments.id, id));
    return true;
  },


  // Assignment Recipients
  async getAssignmentRecipients(assignmentId: string): Promise<AssignmentRecipient[]> {
    return await db.select().from(assignmentRecipients)
      .where(eq(assignmentRecipients.assignmentId, assignmentId));
  },


  async createAssignmentRecipient(recipient: InsertAssignmentRecipient): Promise<AssignmentRecipient> {
    const [created] = await db.insert(assignmentRecipients).values(recipient as any).returning();
    return created;
  },


  async updateAssignmentRecipient(id: string, updates: Partial<AssignmentRecipient>): Promise<AssignmentRecipient | undefined> {
    const [updated] = await db.update(assignmentRecipients)
      .set(updates)
      .where(eq(assignmentRecipients.id, id))
      .returning();
    return updated || undefined;
  },


  async hasPurchased(userId: string, itemId: string): Promise<boolean> {
    const [row] = await db.select().from(marketplacePurchases).where(and(eq(marketplacePurchases.userId, userId), eq(marketplacePurchases.itemId, itemId)));
    return !!row;
  },


  async createPurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase> {
    const [created] = await db.insert(marketplacePurchases).values(purchase).returning();
    return created;
  },


  // Marketplace Wishlists
  async getWishlist(userId: string): Promise<MarketplaceWishlist[]> {
    return await db.select().from(marketplaceWishlists).where(eq(marketplaceWishlists.userId, userId)).orderBy(desc(marketplaceWishlists.createdAt));
  },


  async addToWishlist(userId: string, itemId: string): Promise<MarketplaceWishlist> {
    const existing = await db.select().from(marketplaceWishlists).where(and(eq(marketplaceWishlists.userId, userId), eq(marketplaceWishlists.itemId, itemId)));
    if (existing[0]) return existing[0];
    const [created] = await db.insert(marketplaceWishlists).values({ userId, itemId }).returning();
    return created;
  },


  async removeFromWishlist(userId: string, itemId: string): Promise<boolean> {
    await db.delete(marketplaceWishlists).where(and(eq(marketplaceWishlists.userId, userId), eq(marketplaceWishlists.itemId, itemId)));
    return true;
  },


  async isInWishlist(userId: string, itemId: string): Promise<boolean> {
    const [row] = await db.select().from(marketplaceWishlists).where(and(eq(marketplaceWishlists.userId, userId), eq(marketplaceWishlists.itemId, itemId)));
    return !!row;
  },


  // Marketplace Ratings
  async getRatingsForItem(itemId: string): Promise<MarketplaceRating[]> {
    return await db.select().from(marketplaceRatings).where(eq(marketplaceRatings.itemId, itemId)).orderBy(desc(marketplaceRatings.createdAt));
  },


  async upsertRating(userId: string, itemId: string, rating: number, review: string | undefined, verified: boolean): Promise<MarketplaceRating> {
    const existing = await this.getUserRating(userId, itemId);
    if (existing) {
      const [updated] = await db.update(marketplaceRatings).set({ rating, review, updatedAt: new Date() }).where(eq(marketplaceRatings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(marketplaceRatings).values({ userId, itemId, rating, review, verified }).returning();
    return created;
  },


  async getItemAverageRating(itemId: string): Promise<{ avg: number; count: number }> {
    const [result] = await db.select({ avg: sql<number>`avg(rating)`, count: sql<number>`count(*)` }).from(marketplaceRatings).where(eq(marketplaceRatings.itemId, itemId));
    return { avg: parseFloat((result?.avg || 0).toFixed(1)), count: Number(result?.count || 0) };
  },


  // Get all descendants of an organization recursively
  async getAllDescendants(orgId: string): Promise<Organization[]> {
    const descendants: Organization[] = [];
    const queue: string[] = [orgId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.getChildOrganizations(currentId);
      descendants.push(...children);
      queue.push(...children.map(c => c.id));
    }
    
    return descendants;
  },


  // Get all schools/campuses under an organization
  async getSchoolsInHierarchy(orgId: string): Promise<Organization[]> {
    const org = await this.getOrganization(orgId);
    if (!org) return [];
    
    // If the org itself is a school/campus, return it
    if (org.type === 'school' || org.type === 'campus') {
      return [org];
    }
    
    // Otherwise, get all descendants and filter for schools/campuses
    const descendants = await this.getAllDescendants(orgId);
    return descendants.filter(d => d.type === 'school' || d.type === 'campus');
  },


  // ==========================================================================
  // Alignment Matrix
  // ==========================================================================

  async getAlignmentMatrices(): Promise<AlignmentMatrix[]> {
    return await db.select().from(alignmentMatrix).orderBy(asc(alignmentMatrix.createdAt));
  },


  async getAlignmentMatrix(id: string): Promise<AlignmentMatrix | undefined> {
    const [matrix] = await db.select().from(alignmentMatrix).where(eq(alignmentMatrix.id, id));
    return matrix || undefined;
  },


  async createAlignmentMatrix(matrix: InsertAlignmentMatrix): Promise<AlignmentMatrix> {
    const [created] = await db.insert(alignmentMatrix).values(matrix as any).returning();
    return created;
  },


  async updateAlignmentMatrix(id: string, updates: Partial<AlignmentMatrix>): Promise<AlignmentMatrix | undefined> {
    const [updated] = await db.update(alignmentMatrix)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(alignmentMatrix.id, id))
      .returning();
    return updated || undefined;
  },


  async getPDRecommendations(userId: string, status?: string): Promise<PDRecommendation[]> {
    if (status) {
      return await db.select().from(pdRecommendations)
        .where(and(eq(pdRecommendations.userId, userId), eq(pdRecommendations.status, status)))
        .orderBy(desc(pdRecommendations.priority), desc(pdRecommendations.createdAt));
    }
    return await db.select().from(pdRecommendations)
      .where(eq(pdRecommendations.userId, userId))
      .orderBy(desc(pdRecommendations.priority), desc(pdRecommendations.createdAt));
  },


  async getPDRecommendation(id: string): Promise<PDRecommendation | undefined> {
    const [rec] = await db.select().from(pdRecommendations).where(eq(pdRecommendations.id, id));
    return rec || undefined;
  },


  async createPDRecommendation(rec: InsertPDRecommendation): Promise<PDRecommendation> {
    const [created] = await db.insert(pdRecommendations).values(rec as any).returning();
    return created;
  },


  async updatePDRecommendationStatus(id: string, userId: string, status: string): Promise<PDRecommendation | undefined> {
    const [updated] = await db.update(pdRecommendations)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(pdRecommendations.id, id), eq(pdRecommendations.userId, userId)))
      .returning();
    return updated || undefined;
  },


  async getEducatorPDProgress(userId: string): Promise<EducatorPDProgress[]> {
    return await db.select().from(educatorPDProgress)
      .where(eq(educatorPDProgress.userId, userId))
      .orderBy(desc(educatorPDProgress.updatedAt));
  },


  async getEducatorPDProgressItem(id: string): Promise<EducatorPDProgress | undefined> {
    const [progress] = await db.select().from(educatorPDProgress).where(eq(educatorPDProgress.id, id));
    return progress || undefined;
  },


  async createEducatorPDProgress(progress: InsertEducatorPDProgress): Promise<EducatorPDProgress> {
    const [created] = await db.insert(educatorPDProgress).values(progress as any).returning();
    return created;
  },


  async updateEducatorPDProgress(id: string, userId: string, updates: Partial<EducatorPDProgress>): Promise<EducatorPDProgress | undefined> {
    const [updated] = await db.update(educatorPDProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorPDProgress.id, id), eq(educatorPDProgress.userId, userId)))
      .returning();
    return updated || undefined;
  },


  // CAI (Country Affordability Index) Methods
  async getCAICountries(): Promise<CAICountry[]> {
    return caiCountries;
  },


  async getCAICountry(code: string): Promise<CAICountry | undefined> {
    return caiCountries.find(c => c.code.toUpperCase() === code.toUpperCase());
  },


  async getCAICountriesByRegion(region: string): Promise<CAICountry[]> {
    return caiCountries.filter(c => c.region.toLowerCase() === region.toLowerCase());
  },


  // SIS Connection Methods
  async getSisConnections(userId: string): Promise<SisConnection[]> {
    return await db.select().from(sisConnections)
      .where(eq(sisConnections.userId, userId))
      .orderBy(desc(sisConnections.createdAt));
  },


  async getSisConnection(id: string): Promise<SisConnection | undefined> {
    const [connection] = await db.select().from(sisConnections)
      .where(eq(sisConnections.id, id));
    return connection || undefined;
  },


  async getSisConnectionsByOrg(organizationId: string): Promise<SisConnection[]> {
    return await db.select().from(sisConnections)
      .where(eq(sisConnections.organizationId, organizationId))
      .orderBy(desc(sisConnections.createdAt));
  },


  async getSisConnectionsWithHierarchy(userId: string): Promise<SisConnection[]> {
    const userConnections = await this.getSisConnections(userId);
    const seenIds = new Set(userConnections.map(c => c.id));
    const orgConnections: SisConnection[] = [];
    
    const userOrgs = await this.getUserOrganizations(userId);
    
    for (const membership of userOrgs) {
      const currentOrg = await this.getOrganization(membership.organizationId);
      if (!currentOrg) continue;
      
      // Get SIS from current org (campus/school level)
      if (currentOrg.type === 'school' || currentOrg.type === 'campus') {
        const campusSis = await this.getSisConnectionsByOrg(currentOrg.id);
        for (const conn of campusSis) {
          if (!seenIds.has(conn.id)) {
            seenIds.add(conn.id);
            orgConnections.push(conn);
          }
        }
      }
      
      // Get SIS from parent district (district → campus inheritance)
      if (currentOrg.parentOrganizationId) {
        const parentOrg = await this.getOrganization(currentOrg.parentOrganizationId);
        if (parentOrg && parentOrg.type === 'district') {
          const districtSis = await this.getSisConnectionsByOrg(parentOrg.id);
          for (const conn of districtSis) {
            if (!seenIds.has(conn.id)) {
              seenIds.add(conn.id);
              orgConnections.push(conn);
            }
          }
        }
      }
    }
    
    return [...userConnections, ...orgConnections].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },


  async createSisConnection(connection: InsertSisConnection): Promise<SisConnection> {
    const [created] = await db.insert(sisConnections).values(connection as any).returning();
    return created;
  },


  async updateSisConnection(id: string, updates: Partial<SisConnection>): Promise<SisConnection | undefined> {
    const [updated] = await db.update(sisConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sisConnections.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteSisConnection(id: string, userId: string): Promise<boolean> {
    await db.delete(sisConnections)
      .where(and(eq(sisConnections.id, id), eq(sisConnections.userId, userId)));
    return true;
  },


  // Enterprise SSO (OIDC) Methods
  async getSsoConnection(id: string): Promise<SsoConnection | undefined> {
    const [connection] = await db.select().from(ssoConnections).where(eq(ssoConnections.id, id));
    return connection || undefined;
  },

  async getSsoConnectionsByOrg(organizationId: string): Promise<SsoConnection[]> {
    return await db.select().from(ssoConnections)
      .where(eq(ssoConnections.organizationId, organizationId))
      .orderBy(desc(ssoConnections.createdAt));
  },

  async getEnabledSsoConnections(): Promise<SsoConnection[]> {
    return await db.select().from(ssoConnections)
      .where(eq(ssoConnections.enabled, true))
      .orderBy(desc(ssoConnections.createdAt));
  },

  async createSsoConnection(connection: InsertSsoConnection): Promise<SsoConnection> {
    const [created] = await db.insert(ssoConnections).values(connection as any).returning();
    return created;
  },

  async updateSsoConnection(id: string, updates: Partial<SsoConnection>): Promise<SsoConnection | undefined> {
    const [updated] = await db.update(ssoConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ssoConnections.id, id))
      .returning();
    return updated || undefined;
  },

  async deleteSsoConnection(id: string): Promise<boolean> {
    await db.delete(ssoConnections).where(eq(ssoConnections.id, id));
    return true;
  },


  // SIS Sync History Methods
  async getSisSyncHistory(connectionId: string, limit: number = 50): Promise<SisSyncHistory[]> {
    return await db.select().from(sisSyncHistory)
      .where(eq(sisSyncHistory.connectionId, connectionId))
      .orderBy(desc(sisSyncHistory.startedAt))
      .limit(limit);
  },


  async createSisSyncHistory(history: InsertSisSyncHistory): Promise<SisSyncHistory> {
    const [created] = await db.insert(sisSyncHistory).values(history as any).returning();
    return created;
  },


  async updateSisSyncHistory(id: string, updates: Partial<SisSyncHistory>): Promise<SisSyncHistory | undefined> {
    const [updated] = await db.update(sisSyncHistory)
      .set(updates)
      .where(eq(sisSyncHistory.id, id))
      .returning();
    return updated || undefined;
  },


  // SIS Courses Methods
  async getSisCourses(connectionId: string): Promise<SisCourse[]> {
    return await db.select().from(sisCourses)
      .where(eq(sisCourses.connectionId, connectionId))
      .orderBy(asc(sisCourses.name));
  },


  async getSisCourse(id: string): Promise<SisCourse | undefined> {
    const [course] = await db.select().from(sisCourses)
      .where(eq(sisCourses.id, id));
    return course || undefined;
  },


  async getSisCourseBySisId(connectionId: string, sisCourseId: string): Promise<SisCourse | undefined> {
    const [course] = await db.select().from(sisCourses)
      .where(and(eq(sisCourses.connectionId, connectionId), eq(sisCourses.sisCourseId, sisCourseId)));
    return course || undefined;
  },


  async createSisCourse(course: InsertSisCourse): Promise<SisCourse> {
    const [created] = await db.insert(sisCourses).values(course as any).returning();
    return created;
  },


  async updateSisCourse(id: string, updates: Partial<SisCourse>): Promise<SisCourse | undefined> {
    const [updated] = await db.update(sisCourses)
      .set({ ...updates, lastSyncAt: new Date() })
      .where(eq(sisCourses.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteSisCourse(id: string): Promise<boolean> {
    await db.delete(sisCourses).where(eq(sisCourses.id, id));
    return true;
  },


  // ===========================================
  // CONTENT LIBRARY
  // ===========================================
  
  async getContentLibraryItems(filters?: { contentType?: string; subjects?: string[]; isActive?: boolean }): Promise<ContentLibraryItem[]> {
    let query = db.select().from(contentLibrary);
    const conditions: any[] = [];
    
    if (filters?.contentType) {
      conditions.push(eq(contentLibrary.contentType as any, filters.contentType));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(contentLibrary.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      return db.select().from(contentLibrary).where(and(...conditions)).orderBy(desc(contentLibrary.createdAt));
    }
    return db.select().from(contentLibrary).orderBy(desc(contentLibrary.createdAt));
  },

  
  async getContentLibraryItem(id: string): Promise<ContentLibraryItem | undefined> {
    const [item] = await db.select().from(contentLibrary).where(eq(contentLibrary.id, id));
    return item;
  },

  
  async createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibraryItem> {
    const [newItem] = await db.insert(contentLibrary).values(item as any).returning();
    return newItem;
  },

  
  async updateContentLibraryItem(id: string, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined> {
    const [updated] = await db.update(contentLibrary)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentLibrary.id, id))
      .returning();
    return updated;
  },

  
  async deleteContentLibraryItem(id: string): Promise<boolean> {
    await db.delete(contentLibrary).where(eq(contentLibrary.id, id));
    return true;
  },

  
  async incrementContentUsage(id: string): Promise<void> {
    await db.update(contentLibrary)
      .set({ usageCount: sql`${contentLibrary.usageCount} + 1` })
      .where(eq(contentLibrary.id, id));
  },

  
  async getActiveContentForAI(subjects?: string[], gradeLevels?: string[]): Promise<ContentLibraryItem[]> {
    const conditions: any[] = [
      eq(contentLibrary.isActive, true),
      eq(contentLibrary.processingStatus, 'completed')
    ];
    
    return db.select().from(contentLibrary).where(and(...conditions)).orderBy(desc(contentLibrary.usageCount));
  },

  
  async incrementQuestionUsage(id: string): Promise<void> {
    await db.update(questionBanks)
      .set({ usageCount: sql`${questionBanks.usageCount} + 1` })
      .where(eq(questionBanks.id, id));
  },


  // ===========================================
  // ASSIGNMENT ALIGNMENTS
  // ===========================================
  
  async getAssignmentAlignments(assignmentId: string): Promise<AssignmentAlignment[]> {
    return db.select().from(assignmentAlignments)
      .where(eq(assignmentAlignments.assignmentId, assignmentId))
      .orderBy(asc(assignmentAlignments.objectiveIndex));
  },

  
  async createAssignmentAlignment(alignment: InsertAssignmentAlignment): Promise<AssignmentAlignment> {
    const [newAlignment] = await db.insert(assignmentAlignments).values(alignment as any).returning();
    return newAlignment;
  },


  async getAverageRating(resourceId: string): Promise<{ average: number; count: number }> {
    const ratings = await db.select().from(resourceRatings)
      .where(eq(resourceRatings.resourceId, resourceId));
    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / ratings.length, count: ratings.length };
  },


  async getRssFeeds(): Promise<RssFeed[]> {
    return db.select().from(rssFeeds).orderBy(desc(rssFeeds.createdAt));
  },


  async getRssFeed(id: string): Promise<RssFeed | undefined> {
    const [feed] = await db.select().from(rssFeeds).where(eq(rssFeeds.id, id));
    return feed;
  },


  async createRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const [created] = await db.insert(rssFeeds).values(feed as any).returning();
    return created;
  },


  async updateRssFeed(id: string, updates: Partial<RssFeed>): Promise<RssFeed | undefined> {
    const [updated] = await db.update(rssFeeds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rssFeeds.id, id))
      .returning();
    return updated;
  },


  async deleteRssFeed(id: string): Promise<boolean> {
    const result = await db.delete(rssFeeds).where(eq(rssFeeds.id, id));
    return (result.rowCount ?? 0) > 0;
  },


  async getRssContentItems(filters?: { feedId?: string; status?: RssContentStatus; placement?: RssPlacement }): Promise<RssContentItem[]> {
    const conditions = [];
    if (filters?.feedId) conditions.push(eq(rssContentItems.feedId, filters.feedId));
    if (filters?.status) conditions.push(eq(rssContentItems.status, filters.status));
    if (filters?.placement) conditions.push(sql`${rssContentItems.suggestedPlacements}::jsonb @> ${JSON.stringify([filters.placement])}::jsonb`);
    return db.select().from(rssContentItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rssContentItems.createdAt));
  },


  async getRssContentItem(id: string): Promise<RssContentItem | undefined> {
    const [item] = await db.select().from(rssContentItems).where(eq(rssContentItems.id, id));
    return item;
  },


  async getRssContentItemByGuid(feedId: string, guid: string): Promise<RssContentItem | undefined> {
    const [item] = await db.select().from(rssContentItems)
      .where(and(eq(rssContentItems.feedId, feedId), eq(rssContentItems.guid, guid)));
    return item;
  },


  async createRssContentItem(item: InsertRssContentItem): Promise<RssContentItem> {
    const [created] = await db.insert(rssContentItems).values(item as any).returning();
    return created;
  },


  async updateRssContentItem(id: string, updates: Partial<RssContentItem>): Promise<RssContentItem | undefined> {
    const [updated] = await db.update(rssContentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rssContentItems.id, id))
      .returning();
    return updated;
  },


  async deleteRssContentItem(id: string): Promise<boolean> {
    const result = await db.delete(rssContentItems).where(eq(rssContentItems.id, id));
    return (result.rowCount ?? 0) > 0;
  },


  async getPendingRssContentCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(rssContentItems)
      .where(eq(rssContentItems.status, "pending"));
    return Number(result[0]?.count || 0);
  },


  async getApprovedRssContentByPlacement(placement: RssPlacement, filters?: { bkdPillar?: string; careerFields?: string[]; tags?: string[] }): Promise<RssContentItem[]> {
    const conditions = [
      eq(rssContentItems.status, "approved"),
      sql`${rssContentItems.approvedPlacements}::jsonb @> ${JSON.stringify([placement])}::jsonb`,
    ];
    if (filters?.bkdPillar) conditions.push(eq(rssContentItems.bkdPillar, filters.bkdPillar as any));
    return db.select().from(rssContentItems)
      .where(and(...conditions))
      .orderBy(desc(rssContentItems.publishedAt));
  },
};

Object.assign(DatabaseStorage.prototype, miscMethods);
