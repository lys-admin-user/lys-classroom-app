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

// AUTO-SPLIT from server/storage/database.ts -- domain: account (42 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const accountMethods: ThisType<DatabaseStorage> = {


  // Educator Profiles
  async getEducatorProfile(userId: string): Promise<EducatorProfile | undefined> {
    const [profile] = await db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, userId));
    return profile || undefined;
  },


  async createEducatorProfile(profile: InsertEducatorProfile): Promise<EducatorProfile> {
    const [created] = await db.insert(educatorProfiles).values(profile as any).returning();
    return created;
  },


  async updateEducatorProfile(userId: string, updates: Partial<EducatorProfile>): Promise<EducatorProfile | undefined> {
    const existing = await this.getEducatorProfile(userId);
    if (!existing) return undefined;
    
    const [updated] = await db.update(educatorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educatorProfiles.userId, userId))
      .returning();
    return updated || undefined;
  },


  // User management
  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  },


  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  },


  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },


  async getUserTier(userId: string): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.tier || "free";
  },


  async updateUserTier(userId: string, tier: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ tier: tier as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  },


  async updateUserRole(userId: string, role: UserRole): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  },


  async completeOnboarding(userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  },


  async incrementOnboardingSkipCount(userId: string): Promise<User> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const currentCount = user?.onboardingSkipCount || 0;
    
    const [updated] = await db.update(users)
      .set({ 
        onboardingSkipCount: currentCount + 1,
        onboardingLastSkipped: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updated;
  },


  // Sponsored Access
  async getUserSponsoredAccess(userId: string): Promise<SponsoredAccess | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user?.sponsoredAccessId) return undefined;
    
    const [access] = await db.select()
      .from(sponsoredAccess)
      .where(and(
        eq(sponsoredAccess.id, user.sponsoredAccessId),
        eq(sponsoredAccess.status, "active")
      ));
    return access || undefined;
  },


  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  },


  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const [created] = await db.insert(userPreferences).values(prefs as any).returning();
    return created;
  },


  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const existing = await this.getUserPreferences(userId);
    
    // Filter out undefined values to prevent overwriting existing data
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (!existing) {
      return await this.createUserPreferences({ userId, ...filteredUpdates } as InsertUserPreferences);
    }
    
    // Merge with existing preferences
    const [updated] = await db.update(userPreferences)
      .set({ ...filteredUpdates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updated || undefined;
  },


  // Session Participants
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId))
      .orderBy(desc(sessionParticipants.joinedAt));
  },


  async getActiveSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants)
      .where(and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.status, "active")
      ));
  },


  async getSessionParticipant(sessionId: string, userId: string): Promise<SessionParticipant | undefined> {
    const [result] = await db.select().from(sessionParticipants)
      .where(and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      ));
    return result || undefined;
  },


  async createSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant> {
    const [created] = await db.insert(sessionParticipants)
      .values(participant as any)
      .returning();
    return created;
  },


  async updateSessionParticipant(id: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant | undefined> {
    const [updated] = await db.update(sessionParticipants)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(eq(sessionParticipants.id, id))
      .returning();
    return updated || undefined;
  },


  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    const participant = await this.getSessionParticipant(sessionId, userId);
    if (!participant) return false;
    
    await db.update(sessionParticipants)
      .set({ status: "left", leftAt: new Date() })
      .where(eq(sessionParticipants.id, participant.id));
    return true;
  },


  // Marketplace Purchases
  async getUserPurchases(userId: string): Promise<MarketplacePurchase[]> {
    return await db.select().from(marketplacePurchases).where(eq(marketplacePurchases.userId, userId)).orderBy(desc(marketplacePurchases.createdAt));
  },


  async getUserRating(userId: string, itemId: string): Promise<MarketplaceRating | undefined> {
    const [row] = await db.select().from(marketplaceRatings).where(and(eq(marketplaceRatings.userId, userId), eq(marketplaceRatings.itemId, itemId)));
    return row;
  },


  // System Achievements (Definitions)
  async getSystemAchievements(filters?: { category?: string; isActive?: boolean; isSystemWide?: boolean }): Promise<SystemAchievement[]> {
    let conditions: any[] = [];
    if (filters?.category) {
      conditions.push(eq(systemAchievements.category as any, filters.category));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(systemAchievements.isActive, filters.isActive));
    }
    if (filters?.isSystemWide !== undefined) {
      conditions.push(eq(systemAchievements.isSystemWide, filters.isSystemWide));
    }

    if (conditions.length > 0) {
      return await db.select().from(systemAchievements)
        .where(and(...conditions))
        .orderBy(systemAchievements.category, systemAchievements.name);
    }
    
    return await db.select().from(systemAchievements)
      .orderBy(systemAchievements.category, systemAchievements.name);
  },


  async getSystemAchievement(id: string): Promise<SystemAchievement | undefined> {
    const [result] = await db.select().from(systemAchievements)
      .where(eq(systemAchievements.id, id));
    return result || undefined;
  },


  async createSystemAchievement(achievement: InsertSystemAchievement): Promise<SystemAchievement> {
    const [created] = await db.insert(systemAchievements)
      .values(achievement as any)
      .returning();
    return created;
  },


  async updateSystemAchievement(id: string, updates: Partial<SystemAchievement>): Promise<SystemAchievement | undefined> {
    const [updated] = await db.update(systemAchievements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemAchievements.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteSystemAchievement(id: string): Promise<boolean> {
    await db.delete(systemAchievements).where(eq(systemAchievements.id, id));
    return true;
  },


  async awardAchievement(achievement: InsertStudentAchievement): Promise<StudentAchievement> {
    const [created] = await db.insert(studentAchievements)
      .values(achievement as any)
      .returning();
    return created;
  },


  async verifyAchievement(id: string, verifiedBy: string): Promise<StudentAchievement | undefined> {
    const [updated] = await db.update(studentAchievements)
      .set({ status: 'verified', verifiedBy, verifiedAt: new Date() })
      .where(eq(studentAchievements.id, id))
      .returning();
    return updated || undefined;
  },


  async revokeAchievement(id: string, reason: string): Promise<StudentAchievement | undefined> {
    const [updated] = await db.update(studentAchievements)
      .set({ status: 'revoked', revokedReason: reason })
      .where(eq(studentAchievements.id, id))
      .returning();
    return updated || undefined;
  },


  async getAchievementsByOrg(organizationId: string): Promise<StudentAchievement[]> {
    return await db.select().from(studentAchievements)
      .where(eq(studentAchievements.organizationId, organizationId))
      .orderBy(desc(studentAchievements.earnedAt));
  },


  async getAchievementStats(filters?: { organizationId?: string; academicYear?: string }): Promise<AchievementStats> {
    let conditions: any[] = [];
    if (filters?.organizationId) {
      conditions.push(eq(studentAchievements.organizationId, filters.organizationId));
    }
    if (filters?.academicYear) {
      conditions.push(eq(studentAchievements.academicYear, filters.academicYear));
    }

    const baseQuery = conditions.length > 0 
      ? db.select().from(studentAchievements).where(and(...conditions))
      : db.select().from(studentAchievements);
    
    const awards = await baseQuery;
    const allAchievements = await this.getSystemAchievements();
    const achievementMap = new Map(allAchievements.map(a => [a.id, a.name]));

    // Calculate stats
    const uniqueStudents = new Set(awards.map(a => a.studentId));
    const pendingCount = awards.filter(a => a.status === 'pending').length;

    // Group by category
    const categoryCountMap = new Map<string, number>();
    for (const award of awards) {
      const achievement = allAchievements.find(a => a.id === award.achievementId);
      const category = achievement?.category || 'unknown';
      categoryCountMap.set(category, (categoryCountMap.get(category) || 0) + 1);
    }

    // Most awarded
    const awardCounts = new Map<string, number>();
    awards.forEach(a => {
      awardCounts.set(a.achievementId, (awardCounts.get(a.achievementId) || 0) + 1);
    });
    const sortedAwards = Array.from(awardCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([achievementId, count]) => ({
        achievementId,
        name: achievementMap.get(achievementId) || 'Unknown',
        count
      }));

    // Recent awards
    const recentAwards = awards
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
      .slice(0, 10)
      .map(a => ({
        achievementId: a.achievementId,
        studentId: a.studentId,
        earnedAt: a.earnedAt!
      }));

    return {
      totalAchievementsAwarded: awards.length,
      totalStudentsWithAchievements: uniqueStudents.size,
      totalPendingVerification: pendingCount,
      byCategory: Array.from(categoryCountMap.entries()).map(([category, count]) => ({ category, count })),
      mostAwardedAchievements: sortedAwards,
      recentAwards
    };
  },


  // Session Edit History
  async getSessionEditHistory(sessionId: string, limit = 100): Promise<SessionEditHistory[]> {
    return await db.select().from(sessionEditHistory)
      .where(eq(sessionEditHistory.sessionId, sessionId))
      .orderBy(desc(sessionEditHistory.createdAt))
      .limit(limit);
  },


  async createSessionEdit(edit: InsertSessionEditHistory): Promise<SessionEditHistory> {
    const [created] = await db.insert(sessionEditHistory)
      .values(edit as any)
      .returning();
    return created;
  },


  // Get sessions user is participating in
  async getUserParticipatedSessions(userId: string): Promise<CollaborationSession[]> {
    const participations = await db.select().from(sessionParticipants)
      .where(eq(sessionParticipants.userId, userId));
    
    const sessions: CollaborationSession[] = [];
    for (const p of participations) {
      const session = await this.getCollaborationSession(p.sessionId);
      if (session && session.status === "active") {
        sessions.push(session);
      }
    }
    return sessions;
  },


  // ==========================================================================
  // Global Authority Tree (LYS V3.0)
  // ==========================================================================

  async getAuthorities(level?: string): Promise<Authority[]> {
    if (level) {
      return await db.select().from(authorities)
        .where(eq(authorities.level, level as any))
        .orderBy(asc(authorities.name));
    }
    return await db.select().from(authorities).orderBy(asc(authorities.name));
  },


  async getChildAuthorities(parentId: string): Promise<Authority[]> {
    return await db.select().from(authorities)
      .where(eq(authorities.parentId, parentId))
      .orderBy(asc(authorities.name));
  },


  async clearUserPDRecommendations(userId: string): Promise<void> {
    await db.delete(pdRecommendations).where(eq(pdRecommendations.userId, userId));
  },


  // ===========================================
  // AUTHOR QUALITY METRICS
  // ===========================================
  
  async getAuthorQualityMetrics(authorId: string): Promise<AuthorQualityMetrics[]> {
    return db.select().from(authorQualityMetrics)
      .where(eq(authorQualityMetrics.authorId, authorId))
      .orderBy(desc(authorQualityMetrics.periodEnd));
  },

  
  async createAuthorQualityMetrics(metrics: InsertAuthorQualityMetrics): Promise<AuthorQualityMetrics> {
    const [newMetrics] = await db.insert(authorQualityMetrics).values(metrics as any).returning();
    return newMetrics;
  },

  
  async updateAuthorQualityMetrics(id: string, updates: Partial<AuthorQualityMetrics>): Promise<AuthorQualityMetrics | undefined> {
    const [updated] = await db.update(authorQualityMetrics)
      .set(updates)
      .where(eq(authorQualityMetrics.id, id))
      .returning();
    return updated;
  },
};

Object.assign(DatabaseStorage.prototype, accountMethods);
