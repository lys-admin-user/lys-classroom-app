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

// AUTO-SPLIT from server/storage/database.ts -- domain: analytics (11 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const analyticsMethods: ThisType<DatabaseStorage> = {


  async createMatriculationEvent(event: InsertStudentMatriculationHistory): Promise<StudentMatriculationHistory> {
    const [created] = await db.insert(studentMatriculationHistory)
      .values(event as any)
      .returning();
    return created;
  },


  async getMatriculationEventsByOrg(organizationId: string): Promise<StudentMatriculationHistory[]> {
    return await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.organizationId, organizationId))
      .orderBy(desc(studentMatriculationHistory.eventDate));
  },


  async getMatriculationEventsByType(eventType: string): Promise<StudentMatriculationHistory[]> {
    return await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.eventType as any, eventType))
      .orderBy(desc(studentMatriculationHistory.eventDate));
  },


  async getMatriculationStats(filters?: { organizationId?: string; academicYear?: string }): Promise<MatriculationStats> {
    let conditions: any[] = [];
    if (filters?.organizationId) {
      conditions.push(eq(studentMatriculationHistory.organizationId, filters.organizationId));
    }
    if (filters?.academicYear) {
      conditions.push(eq(studentMatriculationHistory.academicYear, filters.academicYear));
    }

    const baseQuery = conditions.length > 0 
      ? db.select().from(studentMatriculationHistory).where(and(...conditions))
      : db.select().from(studentMatriculationHistory);
    
    const events = await baseQuery;
    
    const stats: MatriculationStats = {
      totalEnrollments: events.filter(e => e.eventType === 'enrollment').length,
      totalGraduations: events.filter(e => e.eventType === 'graduation').length,
      totalTransfersIn: events.filter(e => e.eventType === 'transfer_in').length,
      totalTransfersOut: events.filter(e => e.eventType === 'transfer_out').length,
      totalWithdrawals: events.filter(e => e.eventType === 'withdrawal').length,
      gradePromotions: events.filter(e => e.eventType === 'grade_promotion').length,
      gradeRetentions: events.filter(e => e.eventType === 'grade_retention').length,
      byGradeLevel: [],
      byAcademicYear: [],
    };

    // Group by grade level
    const gradeLevelCounts = new Map<string, number>();
    events.forEach(e => {
      const grade = e.newGradeLevel || e.previousGradeLevel || 'Unknown';
      gradeLevelCounts.set(grade, (gradeLevelCounts.get(grade) || 0) + 1);
    });
    stats.byGradeLevel = Array.from(gradeLevelCounts.entries()).map(([gradeLevel, count]) => ({ gradeLevel, count }));

    // Group by academic year
    const yearStats = new Map<string, { enrollments: number; graduations: number }>();
    events.forEach(e => {
      const year = e.academicYear || 'Unknown';
      if (!yearStats.has(year)) {
        yearStats.set(year, { enrollments: 0, graduations: 0 });
      }
      const ys = yearStats.get(year)!;
      if (e.eventType === 'enrollment') ys.enrollments++;
      if (e.eventType === 'graduation') ys.graduations++;
    });
    stats.byAcademicYear = Array.from(yearStats.entries()).map(([academicYear, data]) => ({ 
      academicYear, 
      enrollments: data.enrollments, 
      graduations: data.graduations 
    }));

    return stats;
  },


  async getEducatorActivityStats(orgId: string): Promise<Array<{
    userId: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    lastLoginAt: Date | null;
    loginCount: number | null;
    createdAt: Date | null;
    lessonCount: number;
    scopeCount: number;
  }>> {
    const members = await db.select({
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      lastLoginAt: users.lastLoginAt,
      loginCount: users.loginCount,
      createdAt: users.createdAt,
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(organizationMemberships.userId, users.id))
    .where(eq(organizationMemberships.organizationId, orgId));

    const results = await Promise.all(members.map(async (m) => {
      const userLessons = await db.select({ count: sql<number>`count(*)` })
        .from(lessons)
        .where(eq(lessons.userId, m.userId));
      const userScopes = await db.select({ count: sql<number>`count(*)` })
        .from(scopeSequences)
        .where(eq(scopeSequences.userId, m.userId));
      return {
        ...m,
        lessonCount: Number(userLessons[0]?.count || 0),
        scopeCount: Number(userScopes[0]?.count || 0),
      };
    }));
    return results;
  },


  // ==========================================================================
  // Workforce Trends
  // ==========================================================================

  async getWorkforceTrends(country?: string): Promise<WorkforceTrend[]> {
    if (country) {
      return await db.select().from(workforceTrends)
        .where(eq(workforceTrends.country, country))
        .orderBy(desc(workforceTrends.lastUpdated));
    }
    return await db.select().from(workforceTrends).orderBy(desc(workforceTrends.lastUpdated));
  },


  async getWorkforceTrend(id: string): Promise<WorkforceTrend | undefined> {
    const [trend] = await db.select().from(workforceTrends).where(eq(workforceTrends.id, id));
    return trend || undefined;
  },


  async createWorkforceTrend(trend: InsertWorkforceTrend): Promise<WorkforceTrend> {
    const [created] = await db.insert(workforceTrends).values(trend as any).returning();
    return created;
  },


  async updateWorkforceTrend(id: string, updates: Partial<WorkforceTrend>): Promise<WorkforceTrend | undefined> {
    const [updated] = await db.update(workforceTrends)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(workforceTrends.id, id))
      .returning();
    return updated || undefined;
  },


  // System Admin Performance Analytics Implementation
  async getEducatorPerformanceMetrics(): Promise<EducatorPerformanceMetric[]> {
    const allUsers = await db.select().from(users).where(
      sql`${users.role} IN ('educator', 'campus_admin', 'district_admin')`
    );
    
    const metrics: EducatorPerformanceMetric[] = [];
    
    for (const user of allUsers) {
      const userGoals = await db.select().from(goals).where(eq(goals.userId, user.id));
      const goalsCompleted = userGoals.filter(g => g.status === 'completed').length;
      const goalsTotal = userGoals.length;
      
      const userLessons = await db.select().from(lessons).where(eq(lessons.userId, user.id));
      const userClasses = await db.select().from(classes).where(eq(classes.userId, user.id));
      
      let totalStudents = 0;
      for (const cls of userClasses) {
        const classStudentsList = await db.select().from(classStudents).where(eq(classStudents.classId, cls.id));
        totalStudents += classStudentsList.length;
      }
      
      const journeyProgress = await db.select().from(studentJourneyProgress).where(eq(studentJourneyProgress.educatorUserId, user.id));
      const avgBeScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.beScore, 0) / journeyProgress.length : 0;
      const avgKnowScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.knowScore, 0) / journeyProgress.length : 0;
      const avgDoScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.doScore, 0) / journeyProgress.length : 0;
      const avgOverallScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.overallScore, 0) / journeyProgress.length : 0;
      
      let orgName: string | null = null;
      let userOrgId: string | null = null;
      const userMemberships = await db.select().from(organizationMemberships).where(eq(organizationMemberships.userId, user.id));
      if (userMemberships.length > 0) {
        userOrgId = userMemberships[0].organizationId;
        const [org] = await db.select().from(organizations).where(eq(organizations.id, userOrgId));
        orgName = org?.name || null;
      }
      
      metrics.push({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationId: userOrgId,
        organizationName: orgName,
        goalsCompleted,
        goalsTotal,
        goalsCompletionRate: goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0,
        lessonsCreated: userLessons.length,
        studentsCount: totalStudents,
        avgStudentBeScore: Math.round(avgBeScore),
        avgStudentKnowScore: Math.round(avgKnowScore),
        avgStudentDoScore: Math.round(avgDoScore),
        avgStudentOverallScore: Math.round(avgOverallScore),
        classesCount: userClasses.length,
      });
    }
    
    return metrics.sort((a, b) => b.goalsCompletionRate - a.goalsCompletionRate);
  },


  async getSystemWideStats(): Promise<SystemWideStats> {
    const allUsers = await db.select().from(users);
    const educators = allUsers.filter(u => ['educator', 'campus_admin', 'district_admin'].includes(u.role || ''));
    const studentUsers = allUsers.filter(u => u.role === 'student');
    
    const allOrgs = await db.select().from(organizations);
    const campuses = allOrgs.filter(o => o.tier === 'campus');
    
    const allGoals = await db.select().from(goals);
    const completedGoals = allGoals.filter(g => g.status === 'completed');
    
    const allJourneyProgress = await db.select().from(studentJourneyProgress);
    const avgBeScore = allJourneyProgress.length > 0 ? allJourneyProgress.reduce((sum, p) => sum + p.beScore, 0) / allJourneyProgress.length : 0;
    const avgKnowScore = allJourneyProgress.length > 0 ? allJourneyProgress.reduce((sum, p) => sum + p.knowScore, 0) / allJourneyProgress.length : 0;
    const avgDoScore = allJourneyProgress.length > 0 ? allJourneyProgress.reduce((sum, p) => sum + p.doScore, 0) / allJourneyProgress.length : 0;
    const avgOverallScore = allJourneyProgress.length > 0 ? allJourneyProgress.reduce((sum, p) => sum + p.overallScore, 0) / allJourneyProgress.length : 0;
    
    const educatorMetrics = await this.getEducatorPerformanceMetrics();
    const campusMetrics = await this.getCampusPerformanceMetrics();
    
    return {
      totalEducators: educators.length,
      totalStudents: studentUsers.length,
      totalOrganizations: allOrgs.length,
      totalCampuses: campuses.length,
      totalGoals: allGoals.length,
      goalsCompleted: completedGoals.length,
      goalsCompletionRate: allGoals.length > 0 ? Math.round((completedGoals.length / allGoals.length) * 100) : 0,
      avgBeScore: Math.round(avgBeScore),
      avgKnowScore: Math.round(avgKnowScore),
      avgDoScore: Math.round(avgDoScore),
      avgOverallScore: Math.round(avgOverallScore),
      topPerformingEducators: educatorMetrics.slice(0, 10),
      topPerformingCampuses: campusMetrics.slice(0, 10),
    };
  },
};

Object.assign(DatabaseStorage.prototype, analyticsMethods);
