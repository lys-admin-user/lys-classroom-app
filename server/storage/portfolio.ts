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

// AUTO-SPLIT from server/storage/database.ts -- domain: portfolio (25 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const portfolioMethods: ThisType<DatabaseStorage> = {


  // Portfolio Reports
  async getPortfolioReports(filters?: { studentUserId?: string; status?: string; reportedByUserId?: string }): Promise<PortfolioReport[]> {
    const conditions = [];
    if (filters?.studentUserId) conditions.push(eq(portfolioReports.studentUserId, filters.studentUserId));
    if (filters?.status) conditions.push(eq(portfolioReports.status, filters.status));
    if (filters?.reportedByUserId) conditions.push(eq(portfolioReports.reportedByUserId, filters.reportedByUserId));
    const query = conditions.length > 0
      ? db.select().from(portfolioReports).where(and(...conditions))
      : db.select().from(portfolioReports);
    return await query.orderBy(desc(portfolioReports.createdAt));
  },


  async createPortfolioReport(report: InsertPortfolioReport): Promise<PortfolioReport> {
    const [created] = await db.insert(portfolioReports).values(report as any).returning();
    return created;
  },


  async updatePortfolioReport(id: string, updates: Partial<PortfolioReport>): Promise<PortfolioReport | undefined> {
    const [updated] = await db.update(portfolioReports).set(updates as any).where(eq(portfolioReports.id, id)).returning();
    return updated || undefined;
  },


  // ================================
  // Student Digital Portfolio
  // ================================

  async getStudentPortfolio(userId: string): Promise<StudentPortfolio | undefined> {
    const [portfolio] = await db.select().from(studentPortfolios)
      .where(eq(studentPortfolios.userId, userId));
    return portfolio || undefined;
  },


  async getStudentPortfolioBySlug(slug: string): Promise<StudentPortfolio | undefined> {
    const [portfolio] = await db.select().from(studentPortfolios)
      .where(eq(studentPortfolios.shareableSlug, slug));
    return portfolio || undefined;
  },


  async createStudentPortfolio(portfolio: InsertStudentPortfolio): Promise<StudentPortfolio> {
    const slug = portfolio.shareableSlug || `portfolio-${randomUUID().slice(0, 8)}`;
    const [created] = await db.insert(studentPortfolios).values({
      ...portfolio,
      shareableSlug: slug,
    } as any).returning();
    return created;
  },


  async updateStudentPortfolio(id: string, updates: Partial<StudentPortfolio>, userId: string): Promise<StudentPortfolio | undefined> {
    const [existing] = await db.select().from(studentPortfolios)
      .where(and(eq(studentPortfolios.id, id), eq(studentPortfolios.userId, userId)));
    if (!existing) return undefined;
    
    const [updated] = await db.update(studentPortfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentPortfolios.id, id))
      .returning();
    return updated;
  },


  async deleteStudentPortfolio(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentPortfolios)
      .where(and(eq(studentPortfolios.id, id), eq(studentPortfolios.userId, userId)));
    if (!existing) return false;
    
    await db.delete(portfolioItems).where(eq(portfolioItems.portfolioId, id));
    await db.delete(studentPortfolios).where(eq(studentPortfolios.id, id));
    return true;
  },


  async incrementPortfolioViews(id: string): Promise<void> {
    await db.update(studentPortfolios)
      .set({ viewCount: sql`COALESCE(${studentPortfolios.viewCount}, 0) + 1` })
      .where(eq(studentPortfolios.id, id));
  },


  // Portfolio Items
  async getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems)
      .where(eq(portfolioItems.portfolioId, portfolioId))
      .orderBy(asc(portfolioItems.displayOrder), desc(portfolioItems.createdAt));
  },


  async getPortfolioItem(id: string): Promise<PortfolioItem | undefined> {
    const [item] = await db.select().from(portfolioItems)
      .where(eq(portfolioItems.id, id));
    return item || undefined;
  },


  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const items = await this.getPortfolioItems(item.portfolioId);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.displayOrder)) : -1;
    
    const [created] = await db.insert(portfolioItems).values({
      ...item,
      displayOrder: item.displayOrder ?? maxOrder + 1,
    } as any).returning();
    return created;
  },


  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined> {
    const [updated] = await db.update(portfolioItems)
      .set(updates)
      .where(eq(portfolioItems.id, id))
      .returning();
    return updated || undefined;
  },


  async deletePortfolioItem(id: string): Promise<boolean> {
    const result = await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    return true;
  },


  async reorderPortfolioItems(portfolioId: string, itemIds: string[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      await db.update(portfolioItems)
        .set({ displayOrder: i })
        .where(and(eq(portfolioItems.id, itemIds[i]), eq(portfolioItems.portfolioId, portfolioId)));
    }
  },


  // Portfolio Comments
  async getPortfolioComments(portfolioId: string): Promise<PortfolioComment[]> {
    return await db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioId, portfolioId))
      .orderBy(desc(portfolioComments.createdAt));
  },


  async getPortfolioItemComments(portfolioItemId: string): Promise<PortfolioComment[]> {
    return await db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioItemId, portfolioItemId))
      .orderBy(desc(portfolioComments.createdAt));
  },


  async createPortfolioComment(comment: InsertPortfolioComment): Promise<PortfolioComment> {
    const [created] = await db.insert(portfolioComments).values(comment as any).returning();
    return created;
  },


  async updatePortfolioComment(id: string, authorId: string, updates: Partial<PortfolioComment>): Promise<PortfolioComment | undefined> {
    const [updated] = await db.update(portfolioComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(portfolioComments.id, id), eq(portfolioComments.authorId, authorId)))
      .returning();
    return updated || undefined;
  },


  async deletePortfolioComment(id: string, authorId: string): Promise<boolean> {
    await db.delete(portfolioComments).where(and(eq(portfolioComments.id, id), eq(portfolioComments.authorId, authorId)));
    return true;
  },


  // Student Narratives (BE Pillar)
  async getStudentNarratives(userId: string): Promise<StudentNarrative[]> {
    return db.select().from(studentNarratives)
      .where(eq(studentNarratives.userId, userId))
      .orderBy(desc(studentNarratives.createdAt));
  },


  async getStudentNarrative(id: string): Promise<StudentNarrative | undefined> {
    const [narrative] = await db.select().from(studentNarratives)
      .where(eq(studentNarratives.id, id));
    return narrative;
  },


  async createStudentNarrative(narrative: InsertStudentNarrative): Promise<StudentNarrative> {
    const [newNarrative] = await db.insert(studentNarratives).values(narrative as any).returning();
    return newNarrative;
  },


  async updateStudentNarrative(id: string, updates: Partial<StudentNarrative>, userId: string): Promise<StudentNarrative | undefined> {
    const [updated] = await db.update(studentNarratives)
      .set({ ...updates, lastEditedAt: new Date() })
      .where(and(eq(studentNarratives.id, id), eq(studentNarratives.userId, userId)))
      .returning();
    return updated;
  },


  async deleteStudentNarrative(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(studentNarratives)
      .where(and(eq(studentNarratives.id, id), eq(studentNarratives.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  },
};

Object.assign(DatabaseStorage.prototype, portfolioMethods);
