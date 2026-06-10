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

// AUTO-SPLIT from server/storage/database.ts -- domain: lessons (58 methods)
// The `ThisType<DatabaseStorage>` annotation tells TypeScript that `this`
// inside these methods is a full DatabaseStorage instance, so cross-domain
// `this.someOtherMethod(...)` calls type-check correctly.
const lessonsMethods: ThisType<DatabaseStorage> = {
  async getLessons(userId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.userId, userId)).orderBy(desc(lessons.createdAt));
  },


  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  },


  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson as any).returning();
    return created;
  },


  async deleteLesson(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(lessons)
      .where(and(eq(lessons.id, id), eq(lessons.userId, userId)))
      .returning();
    return result.length > 0;
  },


  async getLessonByShareId(shareId: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.shareId, shareId));
    return lesson || undefined;
  },


  async toggleLessonShare(id: string, userId: string): Promise<{ shareId: string | null } | undefined> {
    const lesson = await this.getLesson(id);
    if (!lesson || lesson.userId !== userId) return undefined;
    
    const newShareId = lesson.shareId ? null : randomUUID().substring(0, 12);
    await db.update(lessons).set({ shareId: newShareId }).where(eq(lessons.id, id));
    return { shareId: newShareId };
  },


  async countMonthlyGenerations(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(lessonGenerations)
      .where(and(
        eq(lessonGenerations.userId, userId),
        gte(lessonGenerations.createdAt, startOfMonth)
      ));
    return Number(result[0]?.count || 0);
  },


  async logLessonGeneration(userId: string, topic?: string): Promise<void> {
    await db.insert(lessonGenerations).values({ userId, topic });
  },


  async tryReserveLessonGeneration(userId: string, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }> {
    // Atomic check-and-insert using a single SQL statement
    // This inserts a row only if the current count is below the limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.execute(sql`
      WITH current_count AS (
        SELECT COUNT(*) as cnt FROM lesson_generations 
        WHERE user_id = ${userId} AND created_at >= ${startOfMonth}
      ),
      inserted AS (
        INSERT INTO lesson_generations (id, user_id, topic, created_at)
        SELECT gen_random_uuid(), ${userId}, ${topic}, NOW()
        WHERE (SELECT cnt FROM current_count) < ${limit}
        RETURNING 1
      )
      SELECT 
        (SELECT cnt FROM current_count)::int as current_count,
        (SELECT COUNT(*) FROM inserted)::int as inserted_count
    `);
    
    const row = result.rows[0] as any;
    const currentCount = Number(row?.current_count || 0);
    const insertedCount = Number(row?.inserted_count || 0);
    
    return {
      success: insertedCount > 0,
      currentCount: currentCount
    };
  },


  // Count guest generations under this guest's identity. Only rows with a
  // real topic (NOT NULL) count — handoff marker rows are excluded so a
  // pre-generation signup doesn't burn quota. Rows are matched on EITHER
  // guestId OR ipAddress so a forged/rotated cookie still hits the IP
  // ceiling, and claimed rows are excluded so a converted user doesn't
  // permanently lose quota on shared networks.
  async countGuestGenerations(guestKey: { guestId?: string; ipAddress: string }): Promise<number> {
    const { guestId, ipAddress } = guestKey;
    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM guest_lesson_generations
      WHERE claimed_by_user_id IS NULL
        AND topic IS NOT NULL
        AND (
          ${guestId ? sql`guest_id = ${guestId}` : sql`false`}
          OR ip_address = ${ipAddress}
        )
    `);
    return Number((result.rows[0] as any)?.cnt || 0);
  },


  // Email gate for guests. Capture a lead email once per guest identity to
  // unlock free lessons; the dedicated table doubles as a marketing contact
  // list. Idempotent per guestId+email so resubmits don't duplicate rows.
  async saveGuestLead(guestKey: { guestId?: string; ipAddress: string }, email: string): Promise<void> {
    const { guestId, ipAddress } = guestKey;
    const normalized = email.trim().toLowerCase();
    const existing = await db.execute(sql`
      SELECT id FROM guest_leads
      WHERE email = ${normalized}
        AND ${guestId ? sql`guest_id = ${guestId}` : sql`false`}
      LIMIT 1
    `);
    if (existing.rows.length > 0) return;
    await db.execute(sql`
      INSERT INTO guest_leads (id, email, guest_id, ip_address, created_at)
      VALUES (gen_random_uuid(), ${normalized}, ${guestId ?? null}, ${ipAddress}, NOW())
    `);
  },

  // Return the most recent lead for this guest identity (guestId, or IP
  // fallback so shared-network users aren't re-prompted), or null if none.
  async getGuestLead(guestKey: { guestId?: string; ipAddress: string }): Promise<{ email: string } | null> {
    const { guestId, ipAddress } = guestKey;
    const result = await db.execute(sql`
      SELECT email FROM guest_leads
      WHERE ${guestId ? sql`guest_id = ${guestId}` : sql`false`}
         OR ip_address = ${ipAddress}
      ORDER BY created_at DESC LIMIT 1
    `);
    const row = result.rows[0] as any;
    return row?.email ? { email: row.email } : null;
  },


  // Race-safe reservation. A Postgres transactional advisory lock keyed on
  // the guestId (or IP hash when no cookie) serializes concurrent generate
  // attempts from the same identity so the count-then-insert cannot exceed
  // `limit` under burst traffic. The lock is auto-released at commit/rollback.
  async tryReserveGuestLessonGeneration(
    guestKey: { guestId?: string; ipAddress: string },
    limit: number,
    topic?: string,
  ): Promise<{ success: boolean; currentCount: number }> {
    const { guestId, ipAddress } = guestKey;
    const lockKey = guestId || `ip:${ipAddress}`;
    return await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
      const result = await tx.execute(sql`
        WITH current_count AS (
          SELECT COUNT(*) as cnt FROM guest_lesson_generations
          WHERE claimed_by_user_id IS NULL
            AND topic IS NOT NULL
            AND (
              ${guestId ? sql`guest_id = ${guestId}` : sql`false`}
              OR ip_address = ${ipAddress}
            )
        ),
        inserted AS (
          INSERT INTO guest_lesson_generations (id, guest_id, ip_address, topic, created_at)
          SELECT gen_random_uuid(), ${guestId ?? null}, ${ipAddress}, ${topic ?? null}, NOW()
          WHERE (SELECT cnt FROM current_count) < ${limit} AND ${topic ?? null}::text IS NOT NULL
          RETURNING 1
        )
        SELECT
          (SELECT cnt FROM current_count)::int as current_count,
          (SELECT COUNT(*) FROM inserted)::int as inserted_count
      `);
      const row = result.rows[0] as any;
      const currentCount = Number(row?.current_count || 0);
      const insertedCount = Number(row?.inserted_count || 0);
      return { success: insertedCount > 0, currentCount };
    });
  },


  // Persist the guest's in-flight form values and most recently generated
  // lesson against their guestId so we can rehydrate after they sign up.
  // Stored on the most recent quota row for that guest; if none exists (the
  // user clicked "Sign Up" before generating anything), we insert a marker
  // row with no topic that does NOT count against the quota — it's claimed
  // immediately on signup.
  async saveGuestHandoff(
    guestKey: { guestId?: string; ipAddress: string },
    formContext: any,
    lastLessonContent: any,
  ): Promise<void> {
    const { guestId, ipAddress } = guestKey;
    if (!guestId) return;
    const formJson = formContext ? JSON.stringify(formContext) : null;
    const lessonJson = lastLessonContent ? JSON.stringify(lastLessonContent) : null;
    const result = await db.execute(sql`
      UPDATE guest_lesson_generations
      SET form_context = COALESCE(${formJson}::jsonb, form_context),
          last_lesson_content = COALESCE(${lessonJson}::jsonb, last_lesson_content)
      WHERE id = (
        SELECT id FROM guest_lesson_generations
        WHERE guest_id = ${guestId} AND claimed_by_user_id IS NULL
        ORDER BY created_at DESC LIMIT 1
      )
      RETURNING id
    `);
    if (result.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO guest_lesson_generations
          (id, guest_id, ip_address, topic, form_context, last_lesson_content, created_at, claimed_by_user_id, claimed_at)
        VALUES
          (gen_random_uuid(), ${guestId}, ${ipAddress}, NULL,
           ${formJson}::jsonb, ${lessonJson}::jsonb, NOW(), NULL, NULL)
      `);
    }
  },


  // Atomically mark all of a guest's rows as claimed by the given user and
  // return the most recent form_context + last_lesson_content for rehydration.
  async claimGuestHandoff(
    guestId: string,
    userId: string,
  ): Promise<{ formContext: any; lastLessonContent: any } | null> {
    const latest = await db.execute(sql`
      SELECT form_context, last_lesson_content
      FROM guest_lesson_generations
      WHERE guest_id = ${guestId} AND claimed_by_user_id IS NULL
      ORDER BY created_at DESC LIMIT 1
    `);
    await db.execute(sql`
      UPDATE guest_lesson_generations
      SET claimed_by_user_id = ${userId}, claimed_at = NOW()
      WHERE guest_id = ${guestId} AND claimed_by_user_id IS NULL
    `);
    const row = latest.rows[0] as any;
    if (!row) return null;
    return {
      formContext: row.form_context ?? null,
      lastLessonContent: row.last_lesson_content ?? null,
    };
  },


  // Lesson Templates - stored in database
  async getLessonTemplates(userId: string): Promise<LessonTemplate[]> {
    return await db.select().from(lessonTemplates)
      .where(eq(lessonTemplates.userId, userId))
      .orderBy(desc(lessonTemplates.createdAt));
  },


  async getPublicLessonTemplates(): Promise<LessonTemplate[]> {
    return await db.select().from(lessonTemplates)
      .where(eq(lessonTemplates.visibility, "public"))
      .orderBy(desc(lessonTemplates.useCount));
  },


  async getLessonTemplate(id: string): Promise<LessonTemplate | undefined> {
    const [template] = await db.select().from(lessonTemplates).where(eq(lessonTemplates.id, id));
    return template || undefined;
  },


  async createLessonTemplate(template: InsertLessonTemplate): Promise<LessonTemplate> {
    const [created] = await db.insert(lessonTemplates).values(template as any).returning();
    return created;
  },


  async updateLessonTemplate(id: string, updates: Partial<LessonTemplate>, userId: string): Promise<LessonTemplate | undefined> {
    const template = await this.getLessonTemplate(id);
    if (!template || template.userId !== userId) return undefined;
    
    const [updated] = await db.update(lessonTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lessonTemplates.id, id))
      .returning();
    return updated || undefined;
  },


  async deleteLessonTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(lessonTemplates)
      .where(and(eq(lessonTemplates.id, id), eq(lessonTemplates.userId, userId)))
      .returning();
    return result.length > 0;
  },


  async incrementTemplateUseCount(id: string): Promise<void> {
    await db.update(lessonTemplates)
      .set({ useCount: sql`${lessonTemplates.useCount} + 1` })
      .where(eq(lessonTemplates.id, id));
  },


  // Assessments - in memory for now
  async getAssessments(): Promise<Assessment[]> {
    return [];
  },


  async getAssessment(id: string): Promise<Assessment | undefined> {
    return undefined;
  },


  async saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult> {
    this.assessmentResults.set(result.id, result);
    return result;
  },


  // ===========================================
  // SYSTEM LESSON AUTHORS
  // ===========================================
  
  async getSystemLessonAuthors(): Promise<SystemLessonAuthor[]> {
    return db.select().from(systemLessonAuthors).orderBy(desc(systemLessonAuthors.createdAt));
  },

  
  async getSystemLessonAuthor(userId: string): Promise<SystemLessonAuthor | undefined> {
    const [author] = await db.select().from(systemLessonAuthors).where(eq(systemLessonAuthors.userId, userId));
    return author;
  },

  
  async isSystemLessonAuthor(userId: string): Promise<boolean> {
    const author = await this.getSystemLessonAuthor(userId);
    return author !== undefined && author.status === 'active';
  },

  
  async createSystemLessonAuthor(author: InsertSystemLessonAuthor): Promise<SystemLessonAuthor> {
    const [newAuthor] = await db.insert(systemLessonAuthors).values(author as any).returning();
    return newAuthor;
  },

  
  async updateSystemLessonAuthor(userId: string, updates: Partial<SystemLessonAuthor>): Promise<SystemLessonAuthor | undefined> {
    const [updated] = await db.update(systemLessonAuthors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemLessonAuthors.userId, userId))
      .returning();
    return updated;
  },

  
  async deleteSystemLessonAuthor(userId: string): Promise<boolean> {
    const result = await db.delete(systemLessonAuthors).where(eq(systemLessonAuthors.userId, userId));
    return true;
  },

  
  async incrementAuthorLessonCount(userId: string): Promise<void> {
    await db.update(systemLessonAuthors)
      .set({ lessonsCreated: sql`${systemLessonAuthors.lessonsCreated} + 1`, updatedAt: new Date() })
      .where(eq(systemLessonAuthors.userId, userId));
  },


  async decrementAuthorLessonCount(userId: string): Promise<void> {
    await db.update(systemLessonAuthors)
      .set({ lessonsCreated: sql`GREATEST(${systemLessonAuthors.lessonsCreated} - 1, 0)`, updatedAt: new Date() })
      .where(eq(systemLessonAuthors.userId, userId));
  },


  // ===========================================
  // CAMPUS LESSON AUTHORS
  // ===========================================

  async getCampusLessonAuthors(organizationId: string): Promise<CampusLessonAuthor[]> {
    return db.select().from(campusLessonAuthors)
      .where(eq(campusLessonAuthors.organizationId, organizationId))
      .orderBy(desc(campusLessonAuthors.createdAt));
  },


  async getCampusLessonAuthor(userId: string, organizationId: string): Promise<CampusLessonAuthor | undefined> {
    const [author] = await db.select().from(campusLessonAuthors)
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
    return author;
  },


  async getCampusLessonAuthorByUserId(userId: string): Promise<CampusLessonAuthor | undefined> {
    const [author] = await db.select().from(campusLessonAuthors)
      .where(eq(campusLessonAuthors.userId, userId));
    return author;
  },


  async isCampusLessonAuthor(userId: string, organizationId?: string): Promise<boolean> {
    if (organizationId) {
      const author = await this.getCampusLessonAuthor(userId, organizationId);
      return author?.status === "active";
    }
    const author = await this.getCampusLessonAuthorByUserId(userId);
    return author?.status === "active";
  },


  async createCampusLessonAuthor(author: InsertCampusLessonAuthor): Promise<CampusLessonAuthor> {
    const [newAuthor] = await db.insert(campusLessonAuthors).values(author as any).returning();
    return newAuthor;
  },


  async updateCampusLessonAuthor(userId: string, organizationId: string, updates: Partial<CampusLessonAuthor>): Promise<CampusLessonAuthor | undefined> {
    const [updated] = await db.update(campusLessonAuthors)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)))
      .returning();
    return updated;
  },


  async deleteCampusLessonAuthor(userId: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(campusLessonAuthors)
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  },


  async incrementCampusAuthorLessonCount(userId: string, organizationId: string): Promise<void> {
    await db.update(campusLessonAuthors)
      .set({ lessonsCreated: sql`${campusLessonAuthors.lessonsCreated} + 1`, updatedAt: new Date() })
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
  },


  async decrementCampusAuthorLessonCount(userId: string, organizationId: string): Promise<void> {
    await db.update(campusLessonAuthors)
      .set({ lessonsCreated: sql`GREATEST(${campusLessonAuthors.lessonsCreated} - 1, 0)`, updatedAt: new Date() })
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
  },


  // ===========================================
  // MASTER LESSONS REPOSITORY
  // ===========================================
  
  async getMasterLessons(filters?: { subject?: string; gradeLevel?: string; status?: string; limit?: number }): Promise<MasterLesson[]> {
    const conditions: any[] = [];
    
    if (filters?.subject) {
      conditions.push(eq(masterLessons.subject, filters.subject));
    }
    if (filters?.gradeLevel) {
      conditions.push(eq(masterLessons.gradeLevel, filters.gradeLevel));
    }
    if (filters?.status) {
      conditions.push(eq(masterLessons.status, filters.status));
    }
    
    let query;
    if (conditions.length > 0) {
      query = db.select().from(masterLessons).where(and(...conditions)).orderBy(desc(masterLessons.createdAt));
    } else {
      query = db.select().from(masterLessons).orderBy(desc(masterLessons.createdAt));
    }
    
    if (filters?.limit) {
      return query.limit(filters.limit);
    }
    return query;
  },

  
  async getMasterLesson(id: string): Promise<MasterLesson | undefined> {
    const [lesson] = await db.select().from(masterLessons).where(eq(masterLessons.id, id));
    return lesson;
  },

  
  async getMasterLessonsByAuthor(authorId: string): Promise<MasterLesson[]> {
    return db.select().from(masterLessons).where(eq(masterLessons.authorId, authorId)).orderBy(desc(masterLessons.createdAt));
  },

  
  async getApprovedMasterLessons(filters?: { subject?: string; gradeLevel?: string; bkdFocus?: string }): Promise<MasterLesson[]> {
    const conditions: any[] = [eq(masterLessons.status, 'approved')];
    
    if (filters?.subject) {
      conditions.push(eq(masterLessons.subject, filters.subject));
    }
    if (filters?.gradeLevel) {
      conditions.push(eq(masterLessons.gradeLevel, filters.gradeLevel));
    }
    if (filters?.bkdFocus) {
      conditions.push(eq(masterLessons.bkdFocus, filters.bkdFocus));
    }
    
    return db.select().from(masterLessons).where(and(...conditions)).orderBy(desc(masterLessons.usageCount));
  },

  
  async createMasterLesson(lesson: InsertMasterLesson): Promise<MasterLesson> {
    const [newLesson] = await db.insert(masterLessons).values(lesson as any).returning();
    return newLesson;
  },

  
  async updateMasterLesson(id: string, updates: Partial<MasterLesson>): Promise<MasterLesson | undefined> {
    const [updated] = await db.update(masterLessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(masterLessons.id, id))
      .returning();
    return updated;
  },

  
  async deleteMasterLesson(id: string, authorId: string): Promise<boolean> {
    const [lesson] = await db.select().from(masterLessons).where(and(eq(masterLessons.id, id), eq(masterLessons.authorId, authorId)));
    if (!lesson) return false;
    await db.delete(masterLessons).where(eq(masterLessons.id, id));
    return true;
  },

  
  async approveMasterLesson(id: string, reviewerId: string, notes?: string, qualityScore?: number): Promise<MasterLesson | undefined> {
    const updateData: any = { 
      status: 'approved', 
      reviewedBy: reviewerId, 
      reviewedAt: new Date(), 
      reviewNotes: notes, 
      updatedAt: new Date() 
    };
    
    if (qualityScore !== undefined) {
      updateData.qualityScore = qualityScore;
    }
    
    const [updated] = await db.update(masterLessons)
      .set(updateData)
      .where(eq(masterLessons.id, id))
      .returning();
    return updated;
  },

  
  async rejectMasterLesson(id: string, reviewerId: string, notes: string): Promise<MasterLesson | undefined> {
    const [updated] = await db.update(masterLessons)
      .set({ status: 'draft', reviewedBy: reviewerId, reviewedAt: new Date(), reviewNotes: notes, updatedAt: new Date() })
      .where(eq(masterLessons.id, id))
      .returning();
    return updated;
  },

  
  async incrementMasterLessonUsage(id: string): Promise<void> {
    await db.update(masterLessons)
      .set({ usageCount: sql`${masterLessons.usageCount} + 1` })
      .where(eq(masterLessons.id, id));
  },


  // ===========================================
  // LESSON BULK IMPORTS
  // ===========================================
  
  async getLessonBulkImports(): Promise<LessonBulkImport[]> {
    return db.select().from(lessonBulkImports).orderBy(desc(lessonBulkImports.createdAt));
  },

  
  async getLessonBulkImport(id: string): Promise<LessonBulkImport | undefined> {
    const [importRecord] = await db.select().from(lessonBulkImports).where(eq(lessonBulkImports.id, id));
    return importRecord;
  },

  
  async createLessonBulkImport(importRecord: InsertLessonBulkImport): Promise<LessonBulkImport> {
    const [newImport] = await db.insert(lessonBulkImports).values(importRecord as any).returning();
    return newImport;
  },

  
  async updateLessonBulkImport(id: string, updates: Partial<LessonBulkImport>): Promise<LessonBulkImport | undefined> {
    const [updated] = await db.update(lessonBulkImports)
      .set(updates)
      .where(eq(lessonBulkImports.id, id))
      .returning();
    return updated;
  },


  // ===========================================
  // QUESTION BANK SYSTEM
  // ===========================================
  
  async getQuestionBankItems(filters?: { subject?: string; gradeLevel?: string; topic?: string; difficulty?: string; bkdFocus?: string; visibility?: string }): Promise<QuestionBank[]> {
    const conditions: any[] = [eq(questionBanks.status, 'active')];
    
    if (filters?.subject) {
      conditions.push(eq(questionBanks.subject, filters.subject));
    }
    if (filters?.gradeLevel) {
      conditions.push(eq(questionBanks.gradeLevel, filters.gradeLevel));
    }
    if (filters?.topic) {
      conditions.push(eq(questionBanks.topic, filters.topic));
    }
    if (filters?.difficulty) {
      conditions.push(eq(questionBanks.difficulty, filters.difficulty));
    }
    if (filters?.bkdFocus) {
      conditions.push(eq(questionBanks.bkdFocus, filters.bkdFocus));
    }
    if (filters?.visibility) {
      conditions.push(eq(questionBanks.visibility, filters.visibility));
    }
    
    return db.select().from(questionBanks).where(and(...conditions)).orderBy(desc(questionBanks.usageCount));
  },

  
  async getQuestionBankItem(id: string): Promise<QuestionBank | undefined> {
    const [item] = await db.select().from(questionBanks).where(eq(questionBanks.id, id));
    return item;
  },

  
  async createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBank> {
    const [newItem] = await db.insert(questionBanks).values(item as any).returning();
    return newItem;
  },

  
  async updateQuestionBankItem(id: string, updates: Partial<QuestionBank>): Promise<QuestionBank | undefined> {
    const [updated] = await db.update(questionBanks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(questionBanks.id, id))
      .returning();
    return updated;
  },

  
  async deleteQuestionBankItem(id: string): Promise<boolean> {
    const result = await db.delete(questionBanks).where(eq(questionBanks.id, id));
    return true;
  },

  
  async getAlignmentsByLesson(lessonId: string): Promise<AssignmentAlignment[]> {
    return db.select().from(assignmentAlignments)
      .where(eq(assignmentAlignments.lessonId, lessonId))
      .orderBy(asc(assignmentAlignments.objectiveIndex));
  },
};

Object.assign(DatabaseStorage.prototype, lessonsMethods);
