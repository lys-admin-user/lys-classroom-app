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

// AUTO-SPLIT from server/storage/database.ts -- domain: org (35 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const orgMethods: ThisType<DatabaseStorage> = {


  async getSharedWithOrganization(targetOrganizationId: string): Promise<EntityShare[]> {
    return await db.select().from(entityShares)
      .where(eq(entityShares.targetOrganizationId, targetOrganizationId))
      .orderBy(desc(entityShares.createdAt));
  },


  // ==========================================================================
  // Scholarship Scraper — Institutions
  // ==========================================================================
  async listInstitutions(filters?: {
    isActive?: boolean;
    discoveryStatus?: UrlDiscoveryStatus;
    missingScholarshipUrl?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Institution[]> {
    const conds: any[] = [];
    if (filters?.isActive !== undefined) conds.push(eq(institutions.isActive, filters.isActive));
    if (filters?.discoveryStatus)
      conds.push(eq(institutions.scholarshipUrlDiscoveryStatus as any, filters.discoveryStatus));
    if (filters?.missingScholarshipUrl) {
      conds.push(sql`${institutions.scholarshipUrl} IS NULL OR ${institutions.scholarshipUrl} = ''`);
    }
    let q: any = db.select().from(institutions);
    if (conds.length) q = q.where(and(...conds));
    q = q.orderBy(desc(institutions.enrollment));
    if (filters?.limit) q = q.limit(filters.limit);
    if (filters?.offset) q = q.offset(filters.offset);
    return await q;
  },


  async getInstitution(id: string): Promise<Institution | undefined> {
    const [row] = await db.select().from(institutions).where(eq(institutions.id, id));
    return row || undefined;
  },


  async createInstitution(data: InsertInstitution): Promise<Institution> {
    const [row] = await db.insert(institutions).values(data as any).returning();
    return row;
  },


  async upsertInstitutionByIpedsId(data: InsertInstitution): Promise<Institution> {
    if (!data.ipedsId) {
      return await this.createInstitution(data);
    }
    const [existing] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.ipedsId, data.ipedsId));
    if (existing) {
      const [updated] = await db
        .update(institutions)
        .set({
          name: data.name,
          websiteUrl: data.websiteUrl ?? existing.websiteUrl,
          state: data.state ?? existing.state,
          sector: (data.sector as any) ?? existing.sector,
          enrollment: data.enrollment ?? existing.enrollment,
          updatedAt: new Date(),
        })
        .where(eq(institutions.id, existing.id))
        .returning();
      return updated;
    }
    return await this.createInstitution(data);
  },


  async updateInstitution(id: string, updates: Partial<Institution>): Promise<Institution | undefined> {
    const [row] = await db
      .update(institutions)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(institutions.id, id))
      .returning();
    return row || undefined;
  },


  async deleteInstitution(id: string): Promise<boolean> {
    const result = await db.delete(institutions).where(eq(institutions.id, id));
    return (result.rowCount ?? 0) > 0;
  },


  // Organizations (Multi-Tenant)
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(asc(organizations.name));
  },


  async getOrganization(id: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.id, id));
    return result || undefined;
  },


  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return result || undefined;
  },


  async getChildOrganizations(parentId: string): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.parentOrganizationId, parentId));
  },


  async getOrganizationsByType(type: string): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.type, type as any));
  },


  // Get the full hierarchy from an organization up to the root (country)
  async getOrganizationHierarchy(orgId: string): Promise<Organization[]> {
    const hierarchy: Organization[] = [];
    let currentId: string | null = orgId;
    
    while (currentId) {
      const org = await this.getOrganization(currentId);
      if (!org) break;
      hierarchy.push(org);
      currentId = org.parentOrganizationId || null;
    }
    
    return hierarchy; // Returns [current, parent, grandparent, ..., root]
  },


  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org as any).returning();
    return created;
  },


  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteOrganization(id: string): Promise<boolean> {
    await db.delete(organizations).where(eq(organizations.id, id));
    return true;
  },


  // Organization Memberships
  async getOrganizationMembers(orgId: string): Promise<OrgMembership[]> {
    return await db.select().from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, orgId));
  },


  async getOrganizationMembersWithDetails(orgId: string): Promise<Array<{
    membership: OrgMembership;
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'profileImageUrl' | 'role' | 'tier' | 'lastLoginAt' | 'loginCount' | 'createdAt'>;
  }>> {
    const results = await db.select({
      membership: organizationMemberships,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        tier: users.tier,
        lastLoginAt: users.lastLoginAt,
        loginCount: users.loginCount,
        createdAt: users.createdAt,
      },
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(organizationMemberships.userId, users.id))
    .where(eq(organizationMemberships.organizationId, orgId));
    return results;
  },


  async getUserOrganizations(userId: string): Promise<OrgMembership[]> {
    return await db.select().from(organizationMemberships)
      .where(eq(organizationMemberships.userId, userId));
  },


  async getOrgMembership(orgId: string, userId: string): Promise<OrgMembership | undefined> {
    const [result] = await db.select().from(organizationMemberships)
      .where(and(
        eq(organizationMemberships.organizationId, orgId),
        eq(organizationMemberships.userId, userId)
      ));
    return result || undefined;
  },


  async createOrgMembership(membership: InsertOrgMembership): Promise<OrgMembership> {
    const [created] = await db.insert(organizationMemberships).values(membership as any).returning();
    return created;
  },


  async updateOrgMembership(id: string, updates: Partial<OrgMembership>): Promise<OrgMembership | undefined> {
    const [updated] = await db.update(organizationMemberships)
      .set(updates)
      .where(eq(organizationMemberships.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteOrgMembership(id: string): Promise<boolean> {
    await db.delete(organizationMemberships).where(eq(organizationMemberships.id, id));
    return true;
  },


  async getAuthority(id: string): Promise<Authority | undefined> {
    const [authority] = await db.select().from(authorities).where(eq(authorities.id, id));
    return authority || undefined;
  },


  async getAuthorityByCode(code: string): Promise<Authority | undefined> {
    const [authority] = await db.select().from(authorities).where(eq(authorities.code, code));
    return authority || undefined;
  },


  async createAuthority(authority: InsertAuthority): Promise<Authority> {
    const [created] = await db.insert(authorities).values(authority as any).returning();
    return created;
  },


  async updateAuthority(id: string, updates: Partial<Authority>): Promise<Authority | undefined> {
    const [updated] = await db.update(authorities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(authorities.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteAuthority(id: string): Promise<boolean> {
    await db.delete(authorities).where(eq(authorities.id, id));
    return true;
  },


  async getAlignmentMatrixByAuthority(authorityId: string): Promise<AlignmentMatrix | undefined> {
    const [matrix] = await db.select().from(alignmentMatrix).where(eq(alignmentMatrix.authorityId, authorityId));
    return matrix || undefined;
  },


  async getCampusPerformanceMetrics(): Promise<CampusPerformanceMetric[]> {
    const allOrgs = await db.select().from(organizations).where(eq(organizations.tier, 'campus'));
    const metrics: CampusPerformanceMetric[] = [];
    
    for (const org of allOrgs) {
      const orgMembers = await db.select().from(organizationMemberships).where(eq(organizationMemberships.organizationId, org.id));
      const memberUserIds = orgMembers.map(m => m.userId);
      const orgUsers = memberUserIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, memberUserIds))
        : [];
      const educatorIds = orgUsers.map(u => u.id);
      
      let goalsCompleted = 0;
      let goalsTotal = 0;
      let lessonsCreated = 0;
      let classesCount = 0;
      let studentsCount = 0;
      
      for (const userId of educatorIds) {
        const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
        goalsCompleted += userGoals.filter(g => g.status === 'completed').length;
        goalsTotal += userGoals.length;
        
        const userLessons = await db.select().from(lessons).where(eq(lessons.userId, userId));
        lessonsCreated += userLessons.length;
        
        const userClasses = await db.select().from(classes).where(eq(classes.userId, userId));
        classesCount += userClasses.length;
        
        for (const cls of userClasses) {
          const classStudentsList = await db.select().from(classStudents).where(eq(classStudents.classId, cls.id));
          studentsCount += classStudentsList.length;
        }
      }
      
      const journeyProgress = await db.select().from(studentJourneyProgress).where(
        sql`${studentJourneyProgress.educatorUserId} IN (${educatorIds.length > 0 ? educatorIds.map(id => `'${id}'`).join(',') : "'none'"})`
      );
      
      const avgBeScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.beScore, 0) / journeyProgress.length : 0;
      const avgKnowScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.knowScore, 0) / journeyProgress.length : 0;
      const avgDoScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.doScore, 0) / journeyProgress.length : 0;
      const avgOverallScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.overallScore, 0) / journeyProgress.length : 0;
      
      metrics.push({
        organizationId: org.id,
        organizationName: org.name,
        educatorsCount: educatorIds.length,
        studentsCount,
        goalsCompleted,
        goalsTotal,
        goalsCompletionRate: goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0,
        avgStudentBeScore: Math.round(avgBeScore),
        avgStudentKnowScore: Math.round(avgKnowScore),
        avgStudentDoScore: Math.round(avgDoScore),
        avgStudentOverallScore: Math.round(avgOverallScore),
        classesCount,
        lessonsCreated,
      });
    }
    
    return metrics.sort((a, b) => b.goalsCompletionRate - a.goalsCompletionRate);
  },


  async getOrganizationPerformanceMetrics(): Promise<OrganizationPerformanceMetric[]> {
    const allOrgs = await db.select().from(organizations);
    const metrics: OrganizationPerformanceMetric[] = [];
    
    for (const org of allOrgs) {
      const childOrgs = await db.select().from(organizations).where(eq(organizations.parentOrganizationId, org.id));
      const campusesCount = childOrgs.filter(o => o.tier === 'campus').length;
      
      const allOrgIds = [org.id, ...childOrgs.map(o => o.id)];
      const orgMemberships = await db.select().from(organizationMemberships).where(
        inArray(organizationMemberships.organizationId, allOrgIds)
      );
      const orgUserIds = Array.from(new Set(orgMemberships.map(m => m.userId)));
      const orgUsers = orgUserIds.length > 0 
        ? await db.select().from(users).where(inArray(users.id, orgUserIds))
        : [];
      
      const educatorIds = orgUsers.filter(u => ['educator', 'campus_admin', 'district_admin'].includes(u.role || '')).map(u => u.id);
      const studentIds = orgUsers.filter(u => u.role === 'student').map(u => u.id);
      
      let goalsCompleted = 0;
      let goalsTotal = 0;
      
      for (const userId of educatorIds) {
        const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
        goalsCompleted += userGoals.filter(g => g.status === 'completed').length;
        goalsTotal += userGoals.length;
      }
      
      const journeyProgress = educatorIds.length > 0 
        ? await db.select().from(studentJourneyProgress).where(
            sql`${studentJourneyProgress.educatorUserId} IN (${educatorIds.map(id => `'${id}'`).join(',')})`
          )
        : [];
      
      const avgBeScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.beScore, 0) / journeyProgress.length : 0;
      const avgKnowScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.knowScore, 0) / journeyProgress.length : 0;
      const avgDoScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.doScore, 0) / journeyProgress.length : 0;
      const avgOverallScore = journeyProgress.length > 0 ? journeyProgress.reduce((sum, p) => sum + p.overallScore, 0) / journeyProgress.length : 0;
      
      metrics.push({
        organizationId: org.id,
        organizationName: org.name,
        organizationType: org.type || 'school',
        tier: org.tier || 'campus',
        campusesCount,
        educatorsCount: educatorIds.length,
        studentsCount: studentIds.length,
        goalsCompleted,
        goalsTotal,
        goalsCompletionRate: goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0,
        avgStudentBeScore: Math.round(avgBeScore),
        avgStudentKnowScore: Math.round(avgKnowScore),
        avgStudentDoScore: Math.round(avgDoScore),
        avgStudentOverallScore: Math.round(avgOverallScore),
      });
    }
    
    return metrics.sort((a, b) => b.goalsCompletionRate - a.goalsCompletionRate);
  },


  // Campus Activities (DO Pillar)
  async getCampusActivities(userId: string): Promise<CampusActivity[]> {
    return db.select().from(campusActivities)
      .where(eq(campusActivities.userId, userId))
      .orderBy(desc(campusActivities.createdAt));
  },


  async createCampusActivity(activity: InsertCampusActivity): Promise<CampusActivity> {
    const [newActivity] = await db.insert(campusActivities).values(activity as any).returning();
    return newActivity;
  },


  async updateCampusActivity(id: string, updates: Partial<CampusActivity>, userId: string): Promise<CampusActivity | undefined> {
    const [updated] = await db.update(campusActivities)
      .set(updates)
      .where(and(eq(campusActivities.id, id), eq(campusActivities.userId, userId)))
      .returning();
    return updated;
  },


  async deleteCampusActivity(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(campusActivities)
      .where(and(eq(campusActivities.id, id), eq(campusActivities.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  },
};

Object.assign(DatabaseStorage.prototype, orgMethods);
