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
  type CurriculumShare,
  type InsertCurriculumShare,
  type CurriculumAccessRequest,
  type InsertCurriculumAccessRequest,
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
  type SsoConnection,
  type InsertSsoConnection,
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
  type PurchaseOrder,
  type InsertPurchaseOrder,
  purchaseOrders,
  type RssFeed,
  type InsertRssFeed,
  rssFeeds,
  type RssContentItem,
  type InsertRssContentItem,
  rssContentItems,
  type RssContentStatus,
  type RssPlacement,
} from "@shared/schema";
import { generatedCareers } from "./careersGenerated";
import { db } from "../db";
import { eq, desc, and, asc, gte, sql, or, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Lessons (saved by authenticated users)
  getLessons(userId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonByShareId(shareId: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  deleteLesson(id: string, userId: string): Promise<boolean>;
  toggleLessonShare(id: string, userId: string): Promise<{ shareId: string | null } | undefined>;
  countMonthlyGenerations(userId: string): Promise<number>;
  logLessonGeneration(userId: string, topic?: string): Promise<void>;
  tryReserveLessonGeneration(userId: string, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }>;
  countGuestGenerations(guestKey: { guestId?: string; ipAddress: string }): Promise<number>;
  tryReserveGuestLessonGeneration(guestKey: { guestId?: string; ipAddress: string }, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }>;
  saveGuestHandoff(guestKey: { guestId?: string; ipAddress: string }, formContext: any, lastLessonContent: any): Promise<void>;
  claimGuestHandoff(guestId: string, userId: string): Promise<{ formContext: any; lastLessonContent: any } | null>;
  saveGuestLead(guestKey: { guestId?: string; ipAddress: string }, email: string): Promise<void>;
  getGuestLead(guestKey: { guestId?: string; ipAddress: string }): Promise<{ email: string } | null>;

  // School/district "Request a demo" lead capture.
  createDemoRequest(data: import("@shared/schema").DemoRequestInput): Promise<void>;
  
  // Lesson Templates
  getLessonTemplates(userId: string): Promise<LessonTemplate[]>;
  getPublicLessonTemplates(): Promise<LessonTemplate[]>;
  getLessonTemplate(id: string): Promise<LessonTemplate | undefined>;
  createLessonTemplate(template: InsertLessonTemplate): Promise<LessonTemplate>;
  updateLessonTemplate(id: string, updates: Partial<LessonTemplate>, userId: string): Promise<LessonTemplate | undefined>;
  deleteLessonTemplate(id: string, userId: string): Promise<boolean>;
  incrementTemplateUseCount(id: string): Promise<void>;
  
  // Goals
  getGoals(userId?: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>, userId?: string | null): Promise<Goal | undefined>;
  deleteGoal(id: string, userId?: string | null): Promise<boolean>;
  updateMilestone(goalId: string, milestoneId: string, completed: boolean, userId?: string | null): Promise<Goal | undefined>;
  
  // Educator Profiles
  getEducatorProfile(userId: string): Promise<EducatorProfile | undefined>;
  createEducatorProfile(profile: InsertEducatorProfile): Promise<EducatorProfile>;
  updateEducatorProfile(userId: string, updates: Partial<EducatorProfile>): Promise<EducatorProfile | undefined>;
  
  // User management
  getUser(userId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserTier(userId: string): Promise<string>;
  updateUserTier(userId: string, tier: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: UserRole): Promise<User | undefined>;
  completeOnboarding(userId: string): Promise<User | undefined>;
  incrementOnboardingSkipCount(userId: string): Promise<User>;

  // Foundation onboarding (staff-facing)
  getFoundationModules(): Promise<FoundationModule[]>;
  updateFoundationModule(slug: string, updates: Partial<InsertFoundationModule>): Promise<FoundationModule | undefined>;
  getFoundationProgressForUser(userId: string): Promise<FoundationProgress[]>;
  recordFoundationProgress(userId: string, moduleSlug: string, action: "viewed" | "completed", quizScore?: number): Promise<FoundationProgress>;
  getFoundationRollup(): Promise<Array<{
    slug: string;
    title: string;
    order: number;
    contentType: string;
    totalStaff: number;
    viewedCount: number;
    completedCount: number;
    completionPct: number;
    avgQuizScore: number | null;
  }>>;
  
  // Sponsored Access
  getUserSponsoredAccess(userId: string): Promise<SponsoredAccess | undefined>;
  getActiveSponsorship(placement: string): Promise<ContextualSponsorship | undefined>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Static data (in-memory)
  getCareers(): Promise<Career[]>;
  getCareer(id: string): Promise<Career | undefined>;
  getCareersByGrade(gradeBand: string): Promise<Career[]>;
  getTrendingCareers(limit?: number): Promise<Career[]>;
  getCareersByState(stateCode: string): Promise<Career[]>;
  updateCareerFromBls(blsCode: string, updates: Partial<Career>): Promise<Career | undefined>;
  getRecommendedCareers(beScore: number, knowScore: number, doScore: number, limit?: number): Promise<{ career: Career; matchScore: number; matchReasons: string[] }[]>;
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  getAssessments(): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult>;
  
  // Scope and Sequence
  getScopeSequences(userId: string): Promise<ScopeSequence[]>;
  getScopeSequencesWithHierarchy(userId: string): Promise<ScopeSequence[]>; // Includes inherited org scopes
  getScopeSequence(id: string): Promise<ScopeSequence | undefined>;
  createScopeSequence(scope: InsertScopeSequence): Promise<ScopeSequence>;
  updateScopeSequence(id: string, updates: Partial<ScopeSequence>, userId: string): Promise<ScopeSequence | undefined>;
  deleteScopeSequence(id: string, userId: string): Promise<boolean>;

  // Curriculum access control + sharing
  getDescendantOrgIds(rootOrgIds: string[]): Promise<Set<string>>;
  getCurriculumAccessProfile(userId: string): Promise<{ isPlatformAdmin: boolean; schoolAdminOrgIds: Set<string>; memberOrgIds: Set<string>; districtVisibleOrgIds: Set<string>; }>;
  canViewScope(userId: string, scope: ScopeSequence): Promise<boolean>;
  canEditScope(userId: string, scope: ScopeSequence): Promise<boolean>;
  canManageScope(userId: string, scope: ScopeSequence): Promise<boolean>;
  getCurriculumShares(scopeId: string): Promise<CurriculumShare[]>;
  getCurriculumShareForUser(scopeId: string, userId: string): Promise<CurriculumShare | undefined>;
  createCurriculumShare(share: InsertCurriculumShare): Promise<CurriculumShare>;
  deleteCurriculumShare(scopeId: string, sharedWithUserId: string): Promise<boolean>;
  getCurriculumAccessRequests(scopeId: string): Promise<CurriculumAccessRequest[]>;
  getCurriculumAccessRequest(id: string): Promise<CurriculumAccessRequest | undefined>;
  createCurriculumAccessRequest(request: InsertCurriculumAccessRequest & { requesterId: string }): Promise<CurriculumAccessRequest>;
  updateCurriculumAccessRequest(id: string, updates: Partial<CurriculumAccessRequest>): Promise<CurriculumAccessRequest | undefined>;
  
  // Sequence Units
  getSequenceUnits(scopeId: string): Promise<SequenceUnit[]>;
  getSequenceUnit(id: string): Promise<SequenceUnit | undefined>;
  createSequenceUnit(unit: InsertSequenceUnit): Promise<SequenceUnit>;
  updateSequenceUnit(id: string, updates: Partial<SequenceUnit>, userId: string): Promise<SequenceUnit | undefined>;
  deleteSequenceUnit(id: string, userId: string): Promise<boolean>;
  
  // Scope Change Requests
  getScopeChangeRequests(scopeId: string): Promise<ScopeChangeRequest[]>;
  getAllPendingChangeRequests(): Promise<ScopeChangeRequest[]>;
  createScopeChangeRequest(request: InsertScopeChangeRequest): Promise<ScopeChangeRequest>;
  updateScopeChangeRequest(id: string, updates: Partial<ScopeChangeRequest>): Promise<ScopeChangeRequest | undefined>;
  
  // Self-Discovery Results
  getSelfDiscoveryResults(userId: string): Promise<SelfDiscoveryResult[]>;
  saveSelfDiscoveryResult(result: InsertSelfDiscoveryResult): Promise<SelfDiscoveryResult>;
  
  // Saved Careers
  getSavedCareers(userId: string): Promise<SavedCareer[]>;
  saveCareer(career: InsertSavedCareer): Promise<SavedCareer>;
  deleteSavedCareer(id: string, userId: string): Promise<boolean>;
  
  // Affiliate System
  getEducatorAffiliate(userId: string): Promise<EducatorAffiliate | undefined>;
  getEducatorAffiliateByCode(referralCode: string): Promise<EducatorAffiliate | undefined>;
  getEducatorAffiliateById(affiliateId: string): Promise<EducatorAffiliate | undefined>;
  createEducatorAffiliate(affiliate: InsertEducatorAffiliate): Promise<EducatorAffiliate>;
  updateEducatorAffiliate(userId: string, updates: Partial<EducatorAffiliate>): Promise<EducatorAffiliate | undefined>;
  
  // Referral Events
  createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent>;
  getReferralEvents(affiliateId: string, limit?: number): Promise<ReferralEvent[]>;
  
  // Affiliate Rewards
  createAffiliateReward(reward: InsertAffiliateReward): Promise<AffiliateReward>;
  getAffiliateRewards(affiliateId: string): Promise<AffiliateReward[]>;

  // Wallet & Hybrid Affiliate
  getWalletTransactions(affiliateId: string, limit?: number): Promise<WalletTransaction[]>;
  createWalletTransaction(tx: InsertWalletTransaction): Promise<WalletTransaction>;
  convertPointsToCash(affiliateId: string, pointsToConvert: number): Promise<{ success: boolean; cashCents: number; remainingPoints: number }>;
  getTier2Affiliates(parentAffiliateId: string): Promise<EducatorAffiliate[]>;
  upgradeToProMode(affiliateId: string): Promise<EducatorAffiliate | undefined>;
  
  // Promo Assets
  createPromoAsset(asset: InsertPromoAsset): Promise<PromoAsset>;
  getPromoAssets(affiliateId: string): Promise<PromoAsset[]>;
  
  // Educational Standards Ingestion
  getJurisdictions(country?: string): Promise<StandardsJurisdiction[]>;
  getJurisdiction(id: string): Promise<StandardsJurisdiction | undefined>;
  getJurisdictionByAbbr(country: string, abbreviation: string): Promise<StandardsJurisdiction | undefined>;
  createJurisdiction(jurisdiction: InsertStandardsJurisdiction): Promise<StandardsJurisdiction>;
  updateJurisdiction(id: string, updates: Partial<StandardsJurisdiction>): Promise<StandardsJurisdiction | undefined>;
  
  getStandardSets(jurisdictionId: string): Promise<StandardSet[]>;
  getStandardSet(id: string): Promise<StandardSet | undefined>;
  getStandardSetByUid(uid: string): Promise<StandardSet | undefined>;
  createStandardSet(set: InsertStandardSet): Promise<StandardSet>;
  updateStandardSet(id: string, updates: Partial<StandardSet>): Promise<StandardSet | undefined>;
  
  getEducationalStandards(standardSetId: string): Promise<EducationalStandard[]>;
  getEducationalStandardsByGradeLevels(standardSetId: string, gradeLevels: string[]): Promise<EducationalStandard[]>;
  getEducationalStandard(id: string): Promise<EducationalStandard | undefined>;
  getEducationalStandardByUid(uid: string): Promise<EducationalStandard | undefined>;
  createEducationalStandard(standard: InsertEducationalStandard): Promise<EducationalStandard>;
  updateEducationalStandard(id: string, updates: Partial<EducationalStandard>): Promise<EducationalStandard | undefined>;
  bulkCreateEducationalStandards(standards: InsertEducationalStandard[]): Promise<EducationalStandard[]>;
  
  createSyncLog(log: InsertSyncLog): Promise<SyncLog>;
  updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<SyncLog | undefined>;
  getLatestSyncLogs(limit?: number): Promise<SyncLog[]>;
  
  // Standards Staging (Approval Queue)
  createStagingStandard(staging: InsertStandardsStaging): Promise<StandardsStaging>;
  getStagingStandards(status?: string): Promise<StandardsStaging[]>;
  updateStagingStandard(id: string, updates: Partial<StandardsStaging>): Promise<StandardsStaging | undefined>;
  approveStagingStandard(id: string, reviewerId: string): Promise<EducationalStandard | undefined>;
  rejectStagingStandard(id: string, reviewerId: string, reason: string): Promise<StandardsStaging | undefined>;
  bulkCreateStagingStandards(standards: InsertStandardsStaging[]): Promise<StandardsStaging[]>;
  
  // Source Checksums (Change Detection)
  createSourceChecksum(checksum: InsertSourceChecksum): Promise<SourceChecksum>;
  getSourceChecksum(sourceUrl: string): Promise<SourceChecksum | undefined>;
  updateSourceChecksum(id: string, updates: Partial<SourceChecksum>): Promise<SourceChecksum | undefined>;
  getChangedSources(): Promise<SourceChecksum[]>;
  
  // PDF Import Queue
  createPdfImport(pdfImport: InsertPdfImport): Promise<PdfImport>;
  getPdfImport(id: string): Promise<PdfImport | undefined>;
  updatePdfImport(id: string, updates: Partial<PdfImport>): Promise<PdfImport | undefined>;
  getPdfImports(userId: string): Promise<PdfImport[]>;
  
  // Soft Delete for Standards
  deprecateStandard(id: string): Promise<EducationalStandard | undefined>;

  // Assignment System (Paid Feature)
  getClasses(userId: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, updates: Partial<Class>, userId: string): Promise<Class | undefined>;
  deleteClass(id: string, userId: string): Promise<boolean>;

  getStudents(userId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  findStudentBySchoolAndId(organizationId: string, studentIdNumber: string): Promise<(Student & { organizationName?: string }) | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>, userId: string): Promise<Student | undefined>;
  deleteStudent(id: string, userId: string): Promise<boolean>;

  getClassStudents(classId: string): Promise<Student[]>;
  getClassStudent(classId: string, studentId: string): Promise<ClassStudent | undefined>;
  addStudentToClass(classId: string, studentId: string): Promise<ClassStudent>;
  enrollStudent(enrollment: InsertClassStudent): Promise<ClassStudent>;
  removeStudentFromClass(classId: string, studentId: string): Promise<boolean>;

  getStudentGroups(userId: string): Promise<StudentGroup[]>;
  getStudentGroup(id: string): Promise<StudentGroup | undefined>;
  createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup>;
  updateStudentGroup(id: string, updates: Partial<StudentGroup>, userId: string): Promise<StudentGroup | undefined>;
  deleteStudentGroup(id: string, userId: string): Promise<boolean>;

  // Student Notes
  getStudentNotes(studentId: string, educatorId: string): Promise<StudentNote[]>;
  getStudentNotesByClass(classId: string, educatorId: string): Promise<StudentNote[]>;
  createStudentNote(note: InsertStudentNote): Promise<StudentNote>;
  updateStudentNote(id: string, updates: Partial<StudentNote>, educatorId: string): Promise<StudentNote | undefined>;
  deleteStudentNote(id: string, educatorId: string): Promise<boolean>;

  // Attendance Records
  getAttendanceByClass(classId: string, date: Date): Promise<AttendanceRecord[]>;
  getAttendanceByStudent(studentId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;
  bulkCreateAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]>;

  getAssignments(userId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByClass(classId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<Assignment>, userId: string): Promise<Assignment | undefined>;
  deleteAssignment(id: string, userId: string): Promise<boolean>;

  getAssignmentRecipients(assignmentId: string): Promise<AssignmentRecipient[]>;
  getAssignmentsForStudent(studentId: string): Promise<{ assignment: Assignment; recipient: AssignmentRecipient }[]>;
  createAssignmentRecipient(recipient: InsertAssignmentRecipient): Promise<AssignmentRecipient>;
  updateAssignmentRecipient(id: string, updates: Partial<AssignmentRecipient>): Promise<AssignmentRecipient | undefined>;
  
  // Gradebook System
  getGradeCategories(classId: string): Promise<GradeCategory[]>;
  createGradeCategory(category: InsertGradeCategory): Promise<GradeCategory>;
  updateGradeCategory(id: string, updates: Partial<GradeCategory>, userId: string): Promise<GradeCategory | undefined>;
  deleteGradeCategory(id: string, userId: string): Promise<boolean>;
  
  getStudentGrades(classId: string): Promise<StudentGrade[]>;
  getStudentGradesByStudent(studentId: string): Promise<StudentGrade[]>;
  createStudentGrade(grade: InsertStudentGrade): Promise<StudentGrade>;
  updateStudentGrade(id: string, updates: Partial<StudentGrade>, userId: string): Promise<StudentGrade | undefined>;
  deleteStudentGrade(id: string, userId: string): Promise<boolean>;
  bulkUpdateStudentGrades(grades: { id: string; pointsEarned: number; comments?: string }[], userId: string): Promise<StudentGrade[]>;
  
  getGradingPeriods(userId: string): Promise<GradingPeriod[]>;
  createGradingPeriod(period: InsertGradingPeriod): Promise<GradingPeriod>;
  updateGradingPeriod(id: string, updates: Partial<GradingPeriod>, userId: string): Promise<GradingPeriod | undefined>;
  deleteGradingPeriod(id: string, userId: string): Promise<boolean>;
  
  // Helper: Get students with specific accommodation types
  getStudentsByAccommodations(accommodationTypes: string[], classId?: string): Promise<Student[]>;

  // Organization-Scoped Classroom Access
  getClassesByOrganization(organizationId: string): Promise<Class[]>;
  getStudentsByOrganization(organizationId: string): Promise<Student[]>;
  getClassesByOrganizationHierarchy(organizationId: string): Promise<Class[]>;
  getStudentsByOrganizationHierarchy(organizationId: string): Promise<Student[]>;

  // Entity Sharing
  createEntityShare(share: InsertEntityShare): Promise<EntityShare>;
  getEntityShare(id: string): Promise<EntityShare | undefined>;
  getEntityShares(entityType: string, entityId: string): Promise<EntityShare[]>;
  getSharedWithOrganization(targetOrganizationId: string): Promise<EntityShare[]>;
  deleteEntityShare(id: string): Promise<boolean>;
  
  // Organizations (Multi-Tenant)
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getChildOrganizations(parentId: string): Promise<Organization[]>;
  getOrganizationsByType(type: string): Promise<Organization[]>;
  getOrganizationHierarchy(orgId: string): Promise<Organization[]>; // Returns ancestors from org up to root
  getAllDescendants(orgId: string): Promise<Organization[]>; // Returns all descendants recursively
  getSchoolsInHierarchy(orgId: string): Promise<Organization[]>; // Get all schools under an org
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<boolean>;
  validateEnrollment(studentId: string, classId: string): Promise<{ valid: boolean; reason?: string }>;
  
  // Organization Memberships
  getOrganizationMembers(orgId: string): Promise<OrgMembership[]>;
  getOrganizationMembersWithDetails(orgId: string): Promise<Array<{
    membership: OrgMembership;
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'profileImageUrl' | 'role' | 'tier' | 'lastLoginAt' | 'loginCount' | 'createdAt'>;
  }>>;
  getEducatorActivityStats(orgId: string): Promise<Array<{
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
  }>>;
  getUserOrganizations(userId: string): Promise<OrgMembership[]>;
  getOrgMembership(orgId: string, userId: string): Promise<OrgMembership | undefined>;
  createOrgMembership(membership: InsertOrgMembership): Promise<OrgMembership>;
  updateOrgMembership(id: string, updates: Partial<OrgMembership>): Promise<OrgMembership | undefined>;
  deleteOrgMembership(id: string): Promise<boolean>;
  
  // Organization Invitations
  getOrgInvitations(orgId: string): Promise<OrgInvitation[]>;
  getOrgInvitationByToken(token: string): Promise<OrgInvitation | undefined>;
  createOrgInvitation(invitation: InsertOrgInvitation): Promise<OrgInvitation>;
  acceptOrgInvitation(token: string, userId: string): Promise<OrgMembership | undefined>;
  deleteOrgInvitation(id: string): Promise<boolean>;
  
  // Site Administrators
  getSiteAdmins(): Promise<SiteAdmin[]>;
  getSiteAdmin(userId: string): Promise<SiteAdmin | undefined>;
  isSiteAdmin(userId: string): Promise<boolean>;
  createSiteAdmin(admin: InsertSiteAdmin): Promise<SiteAdmin>;
  deleteSiteAdmin(userId: string): Promise<boolean>;
  
  // Parent Portal
  getParentStudentLinks(userId: string, role: 'parent' | 'student'): Promise<ParentStudentLink[]>;
  getParentStudentLink(id: string): Promise<ParentStudentLink | undefined>;
  getParentStudentLinkByUsers(parentUserId: string, studentUserId: string): Promise<ParentStudentLink | undefined>;
  createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink>;
  updateParentStudentLink(id: string, updates: Partial<ParentStudentLink>): Promise<ParentStudentLink | undefined>;
  deleteParentStudentLink(id: string): Promise<boolean>;
  
  // Parent Invitations
  getParentInvitations(studentUserId: string): Promise<ParentInvitation[]>;
  getParentInvitationByToken(token: string): Promise<ParentInvitation | undefined>;
  createParentInvitation(invitation: InsertParentInvitation): Promise<ParentInvitation>;
  updateParentInvitation(id: string, updates: Partial<ParentInvitation>): Promise<ParentInvitation | undefined>;
  acceptParentInvitation(token: string, parentUserId: string): Promise<ParentStudentLink | undefined>;
  deleteParentInvitation(id: string): Promise<boolean>;
  
  // Parent Progress Notes
  getParentProgressNotes(linkId: string): Promise<ParentProgressNote[]>;
  createParentProgressNote(note: InsertParentProgressNote): Promise<ParentProgressNote>;
  deleteParentProgressNote(id: string, parentUserId: string): Promise<boolean>;
  getPendingParentRequests(educatorId: string): Promise<any[]>;

  // Quiet Hours
  getQuietHours(orgId?: string, teacherUserId?: string): Promise<QuietHours[]>;
  getQuietHoursById(id: string): Promise<QuietHours | undefined>;
  createQuietHours(qh: InsertQuietHours): Promise<QuietHours>;
  updateQuietHours(id: string, updates: Partial<QuietHours>): Promise<QuietHours | undefined>;
  deleteQuietHours(id: string): Promise<boolean>;
  isQuietHoursActive(orgId?: string, teacherUserId?: string): Promise<boolean>;

  // Parent Broadcast Posts
  getParentBroadcastPosts(filters?: { orgId?: string; classId?: string; audience?: string }): Promise<ParentBroadcastPost[]>;
  getParentBroadcastPost(id: string): Promise<ParentBroadcastPost | undefined>;
  createParentBroadcastPost(post: InsertParentBroadcastPost): Promise<ParentBroadcastPost>;
  updateParentBroadcastPost(id: string, updates: Partial<ParentBroadcastPost>): Promise<ParentBroadcastPost | undefined>;
  deleteParentBroadcastPost(id: string): Promise<boolean>;

  // Parent Notification Preferences
  getParentNotificationPreferences(parentUserId: string, linkId: string): Promise<ParentNotificationPreferences | undefined>;
  upsertParentNotificationPreferences(prefs: InsertParentNotificationPreferences): Promise<ParentNotificationPreferences>;

  // Portfolio Reports
  getPortfolioReports(filters?: { studentUserId?: string; status?: string; reportedByUserId?: string }): Promise<PortfolioReport[]>;
  createPortfolioReport(report: InsertPortfolioReport): Promise<PortfolioReport>;
  updatePortfolioReport(id: string, updates: Partial<PortfolioReport>): Promise<PortfolioReport | undefined>;

  // Parent Messages (1-to-1)
  getOrCreateMessageThread(participantA: string, participantB: string, linkId?: string): Promise<ParentMessageThread>;
  getMessageThreadsForUser(userId: string): Promise<(ParentMessageThread & { lastMessage?: ParentMessage; otherParticipant?: any })[]>;
  getMessagesForThread(threadId: string, limit?: number): Promise<ParentMessage[]>;
  createParentMessage(message: InsertParentMessage): Promise<ParentMessage>;
  markMessagesAsRead(threadId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Magic Link — generate and accept
  getParentInvitationByMagicToken(magicToken: string): Promise<ParentInvitation | undefined>;

  // Feature Flags
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlag(id: string): Promise<FeatureFlag | undefined>;
  getFeatureFlagByName(name: string): Promise<FeatureFlag | undefined>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined>;
  deleteFeatureFlag(id: string): Promise<boolean>;
  
  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;
  
  // Global Authority Tree (LYS V3.0)
  getAuthorities(level?: string): Promise<Authority[]>;
  getAuthority(id: string): Promise<Authority | undefined>;
  getAuthorityByCode(code: string): Promise<Authority | undefined>;
  getChildAuthorities(parentId: string): Promise<Authority[]>;
  createAuthority(authority: InsertAuthority): Promise<Authority>;
  updateAuthority(id: string, updates: Partial<Authority>): Promise<Authority | undefined>;
  deleteAuthority(id: string): Promise<boolean>;
  
  // LYS Milestones (Being, Knowing, Doing)
  getLyseMilestones(userId: string): Promise<LyseMilestone[]>;
  getLyseMilestone(id: string): Promise<LyseMilestone | undefined>;
  getLyseMilestonesByCategory(userId: string, category: string): Promise<LyseMilestone[]>;
  getGatekeeperMilestones(userId: string): Promise<LyseMilestone[]>;
  createLyseMilestone(milestone: InsertLyseMilestone): Promise<LyseMilestone>;
  updateLyseMilestone(id: string, updates: Partial<LyseMilestone>): Promise<LyseMilestone | undefined>;
  deleteLyseMilestone(id: string, userId: string): Promise<boolean>;
  
  // Workforce Trends
  getWorkforceTrends(country?: string): Promise<WorkforceTrend[]>;
  getWorkforceTrend(id: string): Promise<WorkforceTrend | undefined>;
  createWorkforceTrend(trend: InsertWorkforceTrend): Promise<WorkforceTrend>;
  updateWorkforceTrend(id: string, updates: Partial<WorkforceTrend>): Promise<WorkforceTrend | undefined>;
  
  // Alignment Matrix
  getAlignmentMatrices(): Promise<AlignmentMatrix[]>;
  getAlignmentMatrix(id: string): Promise<AlignmentMatrix | undefined>;
  getAlignmentMatrixByAuthority(authorityId: string): Promise<AlignmentMatrix | undefined>;
  createAlignmentMatrix(matrix: InsertAlignmentMatrix): Promise<AlignmentMatrix>;
  updateAlignmentMatrix(id: string, updates: Partial<AlignmentMatrix>): Promise<AlignmentMatrix | undefined>;
  
  // Professional Development System
  getEducatorCareerGoals(userId: string): Promise<EducatorCareerGoal[]>;
  getEducatorCareerGoal(id: string): Promise<EducatorCareerGoal | undefined>;
  createEducatorCareerGoal(goal: InsertEducatorCareerGoal): Promise<EducatorCareerGoal>;
  updateEducatorCareerGoal(id: string, userId: string, updates: Partial<EducatorCareerGoal>): Promise<EducatorCareerGoal | undefined>;
  deleteEducatorCareerGoal(id: string, userId: string): Promise<boolean>;
  
  getEducatorSkills(userId: string): Promise<EducatorSkill[]>;
  getEducatorSkill(id: string): Promise<EducatorSkill | undefined>;
  createEducatorSkill(skill: InsertEducatorSkill): Promise<EducatorSkill>;
  updateEducatorSkill(id: string, userId: string, updates: Partial<EducatorSkill>): Promise<EducatorSkill | undefined>;
  deleteEducatorSkill(id: string, userId: string): Promise<boolean>;
  
  getPDResources(filters?: { resourceType?: string; skillsAddressed?: string[]; isActive?: boolean }): Promise<PDResource[]>;
  getPDResource(id: string): Promise<PDResource | undefined>;
  createPDResource(resource: InsertPDResource): Promise<PDResource>;
  updatePDResource(id: string, updates: Partial<PDResource>): Promise<PDResource | undefined>;
  
  getPDRecommendations(userId: string, status?: string): Promise<PDRecommendation[]>;
  getPDRecommendation(id: string): Promise<PDRecommendation | undefined>;
  createPDRecommendation(rec: InsertPDRecommendation): Promise<PDRecommendation>;
  updatePDRecommendationStatus(id: string, userId: string, status: string): Promise<PDRecommendation | undefined>;
  clearUserPDRecommendations(userId: string): Promise<void>;
  
  getEducatorPDProgress(userId: string): Promise<EducatorPDProgress[]>;
  getEducatorPDProgressItem(id: string): Promise<EducatorPDProgress | undefined>;
  createEducatorPDProgress(progress: InsertEducatorPDProgress): Promise<EducatorPDProgress>;
  updateEducatorPDProgress(id: string, userId: string, updates: Partial<EducatorPDProgress>): Promise<EducatorPDProgress | undefined>;
  
  // Student Journey Progress (Be-Know-Do Tracking)
  getStudentJourneyProgress(studentId: string): Promise<StudentJourneyProgress | undefined>;
  getStudentJourneyProgressByUserId(userId: string): Promise<StudentJourneyProgress | undefined>;
  getStudentJourneyProgressByEducator(educatorUserId: string): Promise<StudentJourneyProgress[]>;
  createStudentJourneyProgress(progress: InsertStudentJourneyProgress): Promise<StudentJourneyProgress>;
  updateStudentJourneyProgress(id: string, updates: Partial<StudentJourneyProgress>): Promise<StudentJourneyProgress | undefined>;
  deleteStudentJourneyProgress(id: string): Promise<boolean>;
  
  // Student Journey Entries (Timeline/Activity Log)
  getStudentJourneyEntries(userId: string, limit?: number): Promise<StudentJourneyEntry[]>;
  getStudentJourneyEntriesByPillar(userId: string, pillar: string): Promise<StudentJourneyEntry[]>;
  createStudentJourneyEntry(entry: InsertStudentJourneyEntry): Promise<StudentJourneyEntry>;
  deleteStudentJourneyEntry(id: string): Promise<boolean>;
  
  // Student Journey Milestones
  getStudentJourneyMilestones(journeyProgressId: string): Promise<StudentJourneyMilestone[]>;
  getStudentJourneyMilestone(id: string): Promise<StudentJourneyMilestone | undefined>;
  createStudentJourneyMilestone(milestone: InsertStudentJourneyMilestone): Promise<StudentJourneyMilestone>;
  updateStudentJourneyMilestone(id: string, updates: Partial<StudentJourneyMilestone>): Promise<StudentJourneyMilestone | undefined>;
  deleteStudentJourneyMilestone(id: string): Promise<boolean>;
  
  // Student Journey Activities
  getStudentJourneyActivities(journeyProgressId: string, limit?: number): Promise<StudentJourneyActivity[]>;
  createStudentJourneyActivity(activity: InsertStudentJourneyActivity): Promise<StudentJourneyActivity>;
  
  // Student Journey Progress History
  getStudentJourneyProgressHistory(journeyProgressId: string, limit?: number): Promise<StudentJourneyProgressHistory[]>;
  getStudentJourneyProgressHistoryByStudent(studentId: string, limit?: number): Promise<StudentJourneyProgressHistory[]>;
  createStudentJourneyProgressHistory(history: InsertStudentJourneyProgressHistory): Promise<StudentJourneyProgressHistory>;
  
  // Student Digital Portfolio
  getStudentPortfolio(userId: string): Promise<StudentPortfolio | undefined>;
  getStudentPortfolioBySlug(slug: string): Promise<StudentPortfolio | undefined>;
  createStudentPortfolio(portfolio: InsertStudentPortfolio): Promise<StudentPortfolio>;
  updateStudentPortfolio(id: string, updates: Partial<StudentPortfolio>, userId: string): Promise<StudentPortfolio | undefined>;
  deleteStudentPortfolio(id: string, userId: string): Promise<boolean>;
  incrementPortfolioViews(id: string): Promise<void>;
  
  // Portfolio Items
  getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]>;
  getPortfolioItem(id: string): Promise<PortfolioItem | undefined>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined>;
  deletePortfolioItem(id: string): Promise<boolean>;
  reorderPortfolioItems(portfolioId: string, itemIds: string[]): Promise<void>;
  
  // Portfolio Comments
  getPortfolioComments(portfolioId: string): Promise<PortfolioComment[]>;
  getPortfolioItemComments(portfolioItemId: string): Promise<PortfolioComment[]>;
  createPortfolioComment(comment: InsertPortfolioComment): Promise<PortfolioComment>;
  updatePortfolioComment(id: string, authorId: string, updates: Partial<PortfolioComment>): Promise<PortfolioComment | undefined>;
  deletePortfolioComment(id: string, authorId: string): Promise<boolean>;
  
  // CAI (Country Affordability Index)
  getCAICountries(): Promise<CAICountry[]>;
  getCAICountry(code: string): Promise<CAICountry | undefined>;
  getCAICountriesByRegion(region: string): Promise<CAICountry[]>;
  
  // SIS Integration
  getSisConnections(userId: string): Promise<SisConnection[]>;
  getSisConnection(id: string): Promise<SisConnection | undefined>;
  getSisConnectionsByOrg(organizationId: string): Promise<SisConnection[]>;
  getSisConnectionsWithHierarchy(userId: string): Promise<SisConnection[]>; // Gets user's own + inherited org connections
  createSisConnection(connection: InsertSisConnection): Promise<SisConnection>;
  updateSisConnection(id: string, updates: Partial<SisConnection>): Promise<SisConnection | undefined>;
  deleteSisConnection(id: string, userId: string): Promise<boolean>;

  // Enterprise SSO (OIDC)
  getSsoConnection(id: string): Promise<SsoConnection | undefined>;
  getSsoConnectionsByOrg(organizationId: string): Promise<SsoConnection[]>;
  getEnabledSsoConnections(): Promise<SsoConnection[]>;
  createSsoConnection(connection: InsertSsoConnection): Promise<SsoConnection>;
  updateSsoConnection(id: string, updates: Partial<SsoConnection>): Promise<SsoConnection | undefined>;
  deleteSsoConnection(id: string): Promise<boolean>;
  
  // SIS Sync History
  getSisSyncHistory(connectionId: string, limit?: number): Promise<SisSyncHistory[]>;
  createSisSyncHistory(history: InsertSisSyncHistory): Promise<SisSyncHistory>;
  updateSisSyncHistory(id: string, updates: Partial<SisSyncHistory>): Promise<SisSyncHistory | undefined>;
  
  // SIS Students
  getSisStudents(connectionId: string): Promise<SisStudent[]>;
  getSisStudent(id: string): Promise<SisStudent | undefined>;
  getSisStudentBySisId(connectionId: string, sisStudentId: string): Promise<SisStudent | undefined>;
  createSisStudent(student: InsertSisStudent): Promise<SisStudent>;
  updateSisStudent(id: string, updates: Partial<SisStudent>): Promise<SisStudent | undefined>;
  deleteSisStudent(id: string): Promise<boolean>;
  
  // SIS Courses
  getSisCourses(connectionId: string): Promise<SisCourse[]>;
  getSisCourse(id: string): Promise<SisCourse | undefined>;
  getSisCourseBySisId(connectionId: string, sisCourseId: string): Promise<SisCourse | undefined>;
  createSisCourse(course: InsertSisCourse): Promise<SisCourse>;
  updateSisCourse(id: string, updates: Partial<SisCourse>): Promise<SisCourse | undefined>;
  deleteSisCourse(id: string): Promise<boolean>;
  
  // System Admin Performance Analytics
  getEducatorPerformanceMetrics(): Promise<EducatorPerformanceMetric[]>;
  getCampusPerformanceMetrics(): Promise<CampusPerformanceMetric[]>;
  getOrganizationPerformanceMetrics(): Promise<OrganizationPerformanceMetric[]>;
  getSystemWideStats(): Promise<SystemWideStats>;
  
  // System Lesson Authors
  getSystemLessonAuthors(): Promise<SystemLessonAuthor[]>;
  getSystemLessonAuthor(userId: string): Promise<SystemLessonAuthor | undefined>;
  isSystemLessonAuthor(userId: string): Promise<boolean>;
  createSystemLessonAuthor(author: InsertSystemLessonAuthor): Promise<SystemLessonAuthor>;
  updateSystemLessonAuthor(userId: string, updates: Partial<SystemLessonAuthor>): Promise<SystemLessonAuthor | undefined>;
  deleteSystemLessonAuthor(userId: string): Promise<boolean>;
  incrementAuthorLessonCount(userId: string): Promise<void>;
  decrementAuthorLessonCount(userId: string): Promise<void>;
  
  // Campus Lesson Authors
  getCampusLessonAuthors(organizationId: string): Promise<CampusLessonAuthor[]>;
  getCampusLessonAuthor(userId: string, organizationId: string): Promise<CampusLessonAuthor | undefined>;
  getCampusLessonAuthorByUserId(userId: string): Promise<CampusLessonAuthor | undefined>;
  isCampusLessonAuthor(userId: string, organizationId?: string): Promise<boolean>;
  createCampusLessonAuthor(author: InsertCampusLessonAuthor): Promise<CampusLessonAuthor>;
  updateCampusLessonAuthor(userId: string, organizationId: string, updates: Partial<CampusLessonAuthor>): Promise<CampusLessonAuthor | undefined>;
  deleteCampusLessonAuthor(userId: string, organizationId: string): Promise<boolean>;
  incrementCampusAuthorLessonCount(userId: string, organizationId: string): Promise<void>;
  decrementCampusAuthorLessonCount(userId: string, organizationId: string): Promise<void>;
  
  // Master Lessons Repository
  getMasterLessons(filters?: { subject?: string; gradeLevel?: string; status?: string; limit?: number }): Promise<MasterLesson[]>;
  getMasterLesson(id: string): Promise<MasterLesson | undefined>;
  getMasterLessonsByAuthor(authorId: string): Promise<MasterLesson[]>;
  getApprovedMasterLessons(filters?: { subject?: string; gradeLevel?: string; bkdFocus?: string }): Promise<MasterLesson[]>;
  createMasterLesson(lesson: InsertMasterLesson): Promise<MasterLesson>;
  updateMasterLesson(id: string, updates: Partial<MasterLesson>): Promise<MasterLesson | undefined>;
  deleteMasterLesson(id: string, authorId: string): Promise<boolean>;
  approveMasterLesson(id: string, reviewerId: string, notes?: string, qualityScore?: number): Promise<MasterLesson | undefined>;
  rejectMasterLesson(id: string, reviewerId: string, notes: string): Promise<MasterLesson | undefined>;
  incrementMasterLessonUsage(id: string): Promise<void>;
  
  // Content Library
  getContentLibraryItems(filters?: { contentType?: string; subjects?: string[]; isActive?: boolean }): Promise<ContentLibraryItem[]>;
  getContentLibraryItem(id: string): Promise<ContentLibraryItem | undefined>;
  createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibraryItem>;
  updateContentLibraryItem(id: string, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined>;
  deleteContentLibraryItem(id: string): Promise<boolean>;
  incrementContentUsage(id: string): Promise<void>;
  getActiveContentForAI(subjects?: string[], gradeLevels?: string[]): Promise<ContentLibraryItem[]>;
  
  // Lesson Bulk Imports
  getLessonBulkImports(): Promise<LessonBulkImport[]>;
  getLessonBulkImport(id: string): Promise<LessonBulkImport | undefined>;
  createLessonBulkImport(importRecord: InsertLessonBulkImport): Promise<LessonBulkImport>;
  updateLessonBulkImport(id: string, updates: Partial<LessonBulkImport>): Promise<LessonBulkImport | undefined>;
  
  // Question Bank System
  getQuestionBankItems(filters?: { subject?: string; gradeLevel?: string; topic?: string; difficulty?: string; bkdFocus?: string; visibility?: string }): Promise<QuestionBank[]>;
  getQuestionBankItem(id: string): Promise<QuestionBank | undefined>;
  createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBank>;
  updateQuestionBankItem(id: string, updates: Partial<QuestionBank>): Promise<QuestionBank | undefined>;
  deleteQuestionBankItem(id: string): Promise<boolean>;
  incrementQuestionUsage(id: string): Promise<void>;
  
  // Author Quality Metrics
  getAuthorQualityMetrics(authorId: string): Promise<AuthorQualityMetrics[]>;
  getLatestAuthorMetrics(authorId: string): Promise<AuthorQualityMetrics | undefined>;
  createAuthorQualityMetrics(metrics: InsertAuthorQualityMetrics): Promise<AuthorQualityMetrics>;
  updateAuthorQualityMetrics(id: string, updates: Partial<AuthorQualityMetrics>): Promise<AuthorQualityMetrics | undefined>;
  
  // Assignment Alignments
  getAssignmentAlignments(assignmentId: string): Promise<AssignmentAlignment[]>;
  createAssignmentAlignment(alignment: InsertAssignmentAlignment): Promise<AssignmentAlignment>;
  getAlignmentsByLesson(lessonId: string): Promise<AssignmentAlignment[]>;
  
  // KNOW Resources (Admin-managed educational resources)
  getKnowResources(filters?: { resourceType?: string; category?: string; isActive?: boolean; featured?: boolean }): Promise<KnowResource[]>;
  getKnowResource(id: string): Promise<KnowResource | undefined>;
  createKnowResource(resource: InsertKnowResource): Promise<KnowResource>;
  updateKnowResource(id: string, updates: Partial<KnowResource>, userId: string): Promise<KnowResource | undefined>;
  deleteKnowResource(id: string): Promise<boolean>;
  
  // Marketplace Items
  getMarketplaceItems(filters?: { audience?: string; itemType?: string; isActive?: boolean }): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: string): Promise<boolean>;

  // Marketplace Purchases
  getUserPurchases(userId: string): Promise<MarketplacePurchase[]>;
  hasPurchased(userId: string, itemId: string): Promise<boolean>;
  createPurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase>;

  // Saved Scholarships
  getSavedScholarships(userId: string): Promise<SavedScholarship[]>;
  saveScholarship(data: InsertSavedScholarship): Promise<SavedScholarship>;
  unsaveScholarship(userId: string, resourceId: string): Promise<boolean>;
  updateSavedScholarshipReason(userId: string, resourceId: string, pursuitReason: string): Promise<SavedScholarship | undefined>;
  isSavedScholarship(userId: string, resourceId: string): Promise<boolean>;

  // Resource Reports (scholarship moderation)
  createResourceReport(data: InsertResourceReport): Promise<ResourceReport>;
  listResourceReports(filters?: { status?: string; resourceId?: string }): Promise<ResourceReport[]>;
  resolveResourceReport(id: string, userId: string, status: "resolved" | "dismissed"): Promise<ResourceReport | undefined>;
  countActiveReportsForResource(resourceId: string): Promise<number>;
  verifyKnowResource(id: string, userId: string): Promise<KnowResource | undefined>;
  bulkVerifyKnowResources(ids: string[], userId: string): Promise<number>;

  // Scholarship Scraper — Institutions
  listInstitutions(filters?: {
    isActive?: boolean;
    discoveryStatus?: UrlDiscoveryStatus;
    missingScholarshipUrl?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | undefined>;
  createInstitution(data: InsertInstitution): Promise<Institution>;
  upsertInstitutionByIpedsId(data: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, updates: Partial<Institution>): Promise<Institution | undefined>;
  deleteInstitution(id: string): Promise<boolean>;

  // Scholarship Scraper — Scrape runs
  createScholarshipScrapeRun(data: InsertScholarshipScrapeRun): Promise<ScholarshipScrapeRun>;
  updateScholarshipScrapeRun(
    id: string,
    updates: Partial<ScholarshipScrapeRun>,
  ): Promise<ScholarshipScrapeRun | undefined>;
  listScholarshipScrapeRuns(filters?: { limit?: number }): Promise<ScholarshipScrapeRun[]>;

  // Scholarship Scraper — Scholarship upserts/lifecycle
  upsertAutoImportedScholarship(data: {
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
  }): Promise<{ created: boolean; resource: KnowResource }>;
  touchScholarshipsForInstitution(institutionId: string, scrapeRunId: string): Promise<number>;
  deactivateUnseenAutoImportedScholarships(currentRunId: string, institutionIds: string[]): Promise<number>;

  // Student Matriculation History (System-Level Tracking)
  getStudentMatriculationHistory(studentId: string): Promise<StudentMatriculationHistory[]>;
  getStudentMatriculationEvent(id: string): Promise<StudentMatriculationHistory | undefined>;
  createMatriculationEvent(event: InsertStudentMatriculationHistory): Promise<StudentMatriculationHistory>;
  getMatriculationEventsByOrg(organizationId: string): Promise<StudentMatriculationHistory[]>;
  getMatriculationEventsByType(eventType: string): Promise<StudentMatriculationHistory[]>;
  getMatriculationStats(filters?: { organizationId?: string; academicYear?: string }): Promise<MatriculationStats>;
  
  // System Achievements (Definitions)
  getSystemAchievements(filters?: { category?: string; isActive?: boolean; isSystemWide?: boolean }): Promise<SystemAchievement[]>;
  getSystemAchievement(id: string): Promise<SystemAchievement | undefined>;
  createSystemAchievement(achievement: InsertSystemAchievement): Promise<SystemAchievement>;
  updateSystemAchievement(id: string, updates: Partial<SystemAchievement>): Promise<SystemAchievement | undefined>;
  deleteSystemAchievement(id: string): Promise<boolean>;
  
  // Student Achievements (Earned)
  getStudentAchievements(studentId: string): Promise<StudentAchievement[]>;
  getStudentAchievement(id: string): Promise<StudentAchievement | undefined>;
  awardAchievement(achievement: InsertStudentAchievement): Promise<StudentAchievement>;
  verifyAchievement(id: string, verifiedBy: string): Promise<StudentAchievement | undefined>;
  revokeAchievement(id: string, reason: string): Promise<StudentAchievement | undefined>;
  getAchievementsByOrg(organizationId: string): Promise<StudentAchievement[]>;
  getAchievementStats(filters?: { organizationId?: string; academicYear?: string }): Promise<AchievementStats>;

  // Resource Ratings
  getResourceRatings(resourceId: string): Promise<ResourceRating[]>;
  getUserResourceRating(resourceId: string, userId: string): Promise<ResourceRating | undefined>;
  createResourceRating(rating: InsertResourceRating): Promise<ResourceRating>;
  getAverageRating(resourceId: string): Promise<{ average: number; count: number }>;

  // Student Narratives (BE Pillar)
  getStudentNarratives(userId: string): Promise<StudentNarrative[]>;
  getStudentNarrative(id: string): Promise<StudentNarrative | undefined>;
  createStudentNarrative(narrative: InsertStudentNarrative): Promise<StudentNarrative>;
  updateStudentNarrative(id: string, updates: Partial<StudentNarrative>, userId: string): Promise<StudentNarrative | undefined>;
  deleteStudentNarrative(id: string, userId: string): Promise<boolean>;

  // Strengths Inventory (BE Pillar)
  getStrengthsInventory(userId: string): Promise<StrengthsInventory[]>;
  createStrength(strength: InsertStrengthsInventory): Promise<StrengthsInventory>;
  updateStrength(id: string, updates: Partial<StrengthsInventory>, userId: string): Promise<StrengthsInventory | undefined>;
  deleteStrength(id: string, userId: string): Promise<boolean>;

  // Campus Activities (DO Pillar)
  getCampusActivities(userId: string): Promise<CampusActivity[]>;
  createCampusActivity(activity: InsertCampusActivity): Promise<CampusActivity>;
  updateCampusActivity(id: string, updates: Partial<CampusActivity>, userId: string): Promise<CampusActivity | undefined>;
  deleteCampusActivity(id: string, userId: string): Promise<boolean>;

  // Scholarship Applications (DO Pillar - Planner)
  getScholarshipApplications(userId: string): Promise<ScholarshipApplication[]>;
  getScholarshipApplication(id: string): Promise<ScholarshipApplication | undefined>;
  createScholarshipApplication(app: InsertScholarshipApplication): Promise<ScholarshipApplication>;
  updateScholarshipApplication(id: string, updates: Partial<ScholarshipApplication>, userId: string): Promise<ScholarshipApplication | undefined>;
  deleteScholarshipApplication(id: string, userId: string): Promise<boolean>;

  // Mentor System
  getMentorProfiles(filters?: { careerField?: string; isAvailable?: boolean }): Promise<MentorProfile[]>;
  getMentorProfile(id: string): Promise<MentorProfile | undefined>;
  getMentorProfileByUser(userId: string): Promise<MentorProfile | undefined>;
  createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile>;
  updateMentorProfile(id: string, updates: Partial<MentorProfile>, userId: string): Promise<MentorProfile | undefined>;
  getMentorConnections(userId: string): Promise<MentorConnection[]>;
  getMentorConnectionsForMentor(mentorId: string): Promise<MentorConnection[]>;
  createMentorConnection(connection: InsertMentorConnection): Promise<MentorConnection>;
  updateMentorConnection(id: string, updates: Partial<MentorConnection>): Promise<MentorConnection | undefined>;

  // Free Trials
  getActiveTrialByIP(ipAddress: string): Promise<FreeTrial | undefined>;
  getActiveTrialByFingerprint(fingerprint: string): Promise<FreeTrial | undefined>;
  getActiveTrialByUserId(userId: string): Promise<FreeTrial | undefined>;
  getTrialsByIP(ipAddress: string, sinceDateMs: number): Promise<FreeTrial[]>;
  getTrialsByFingerprint(fingerprint: string, sinceDateMs: number): Promise<FreeTrial[]>;
  createFreeTrial(trial: InsertFreeTrial): Promise<FreeTrial>;
  bindTrialToUser(trialId: string, userId: string): Promise<FreeTrial | undefined>;
  flagTrialAbuse(trialId: string): Promise<FreeTrial | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  listPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  markPurchaseOrderPaid(id: string, paidByUserId: string): Promise<PurchaseOrder | undefined>;
  getActiveTrialCount(ipAddress: string, sinceDateMs: number): Promise<number>;

  // RSS Feeds & Content Ingestion
  getRssFeeds(): Promise<RssFeed[]>;
  getRssFeed(id: string): Promise<RssFeed | undefined>;
  createRssFeed(feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeed(id: string, updates: Partial<RssFeed>): Promise<RssFeed | undefined>;
  deleteRssFeed(id: string): Promise<boolean>;

  getRssContentItems(filters?: { feedId?: string; status?: RssContentStatus; placement?: RssPlacement }): Promise<RssContentItem[]>;
  getRssContentItem(id: string): Promise<RssContentItem | undefined>;
  getRssContentItemByGuid(feedId: string, guid: string): Promise<RssContentItem | undefined>;
  createRssContentItem(item: InsertRssContentItem): Promise<RssContentItem>;
  updateRssContentItem(id: string, updates: Partial<RssContentItem>): Promise<RssContentItem | undefined>;
  deleteRssContentItem(id: string): Promise<boolean>;
  getPendingRssContentCount(): Promise<number>;
  getApprovedRssContentByPlacement(placement: RssPlacement, filters?: { bkdPillar?: string; careerFields?: string[]; tags?: string[] }): Promise<RssContentItem[]>;
}


// Performance Analytics Types
export type EducatorPerformanceMetric = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  organizationId: string | null;
  organizationName: string | null;
  goalsCompleted: number;
  goalsTotal: number;
  goalsCompletionRate: number;
  lessonsCreated: number;
  studentsCount: number;
  avgStudentBeScore: number;
  avgStudentKnowScore: number;
  avgStudentDoScore: number;
  avgStudentOverallScore: number;
  classesCount: number;
};

export type CampusPerformanceMetric = {
  organizationId: string;
  organizationName: string;
  educatorsCount: number;
  studentsCount: number;
  goalsCompleted: number;
  goalsTotal: number;
  goalsCompletionRate: number;
  avgStudentBeScore: number;
  avgStudentKnowScore: number;
  avgStudentDoScore: number;
  avgStudentOverallScore: number;
  classesCount: number;
  lessonsCreated: number;
};

export type OrganizationPerformanceMetric = {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  tier: string;
  campusesCount: number;
  educatorsCount: number;
  studentsCount: number;
  goalsCompleted: number;
  goalsTotal: number;
  goalsCompletionRate: number;
  avgStudentBeScore: number;
  avgStudentKnowScore: number;
  avgStudentDoScore: number;
  avgStudentOverallScore: number;
};

export type SystemWideStats = {
  totalEducators: number;
  totalStudents: number;
  totalOrganizations: number;
  totalCampuses: number;
  totalGoals: number;
  goalsCompleted: number;
  goalsCompletionRate: number;
  avgBeScore: number;
  avgKnowScore: number;
  avgDoScore: number;
  avgOverallScore: number;
  topPerformingEducators: EducatorPerformanceMetric[];
  topPerformingCampuses: CampusPerformanceMetric[];
};

// Matriculation Stats Type
export type MatriculationStats = {
  totalEnrollments: number;
  totalGraduations: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  totalWithdrawals: number;
  gradePromotions: number;
  gradeRetentions: number;
  byGradeLevel: { gradeLevel: string; count: number }[];
  byAcademicYear: { academicYear: string; enrollments: number; graduations: number }[];
};

// Achievement Stats Type
export type AchievementStats = {
  totalAchievementsAwarded: number;
  totalStudentsWithAchievements: number;
  totalPendingVerification: number;
  byCategory: { category: string; count: number }[];
  mostAwardedAchievements: { achievementId: string; name: string; count: number }[];
  recentAwards: { achievementId: string; studentId: string; earnedAt: Date }[];
};

// Seed data for careers and resources (static content - mutable for BLS sync updates)
export let seedCareers: Career[] = [
  {
    id: "1",
    title: "Software Developer",
    category: "technology",
    description: "Design, develop, and maintain software applications. Work with cutting-edge technologies to solve complex problems.",
    salaryMin: 65000,
    salaryMax: 150000,
    salaryMedian: 130160,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+25%",
    skills: ["Programming", "Problem Solving", "Communication", "Teamwork", "Critical Thinking"],
    relatedCareers: ["Web Developer", "Data Scientist", "DevOps Engineer"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Computer Science or related field from an accredited university.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Complete coding bootcamp and earn industry certifications like AWS or Google Cloud.", duration: "3-6 months", cost: "$10,000-$20,000" },
      { type: "military", description: "Serve in IT roles in the military and transition to civilian tech careers.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 45,
      know: 85,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Analytical problem-solver who enjoys building things and continuous learning"
    },
    blsCode: "15-1252",
    blsOohGroup: "computer-and-information-technology",
    naicsCode: "51",
    jobOutlook: "much_faster",
    projectedGrowth: 25,
    projectedOpenings: 153900,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Explore coding games like Scratch, join coding clubs, or build simple websites",
      high_school: "Take AP Computer Science, participate in hackathons, or start personal coding projects",
      post_secondary: "Pursue CS degree or coding bootcamp, build portfolio, contribute to open source"
    },
    workEnvironment: "Most work in offices or remotely. Collaboration with teams is common.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 75000, max: 160000, median: 125000, employment: 189500, demandLevel: "very_high" },
      CA: { min: 90000, max: 200000, median: 155000, employment: 287400, demandLevel: "very_high" },
      NY: { min: 80000, max: 175000, median: 140000, employment: 112300, demandLevel: "high" },
      FL: { min: 65000, max: 140000, median: 110000, employment: 89200, demandLevel: "high" },
      WA: { min: 95000, max: 210000, median: 165000, employment: 98700, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "2",
    title: "Registered Nurse",
    category: "healthcare",
    description: "Provide patient care, educate patients about health conditions, and support physicians in medical procedures.",
    salaryMin: 55000,
    salaryMax: 120000,
    salaryMedian: 86070,
    educationRequired: "Associate's or Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+6%",
    skills: ["Patient Care", "Communication", "Critical Thinking", "Empathy", "Attention to Detail"],
    relatedCareers: ["Nurse Practitioner", "Physician Assistant", "Healthcare Administrator"],
    pathways: [
      { type: "college", description: "Complete a BSN (Bachelor of Science in Nursing) program.", duration: "4 years", cost: "$30,000-$150,000" },
      { type: "trade", description: "Complete an ADN (Associate Degree in Nursing) at a community college.", duration: "2 years", cost: "$10,000-$30,000" },
      { type: "military", description: "Train as a military nurse and serve while gaining experience.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 85,
      know: 75,
      do: 80,
      primaryPillar: "be",
      careerPersonality: "Compassionate caregiver with strong empathy and dedication to helping others"
    },
    blsCode: "29-1141",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "faster_than_average",
    projectedGrowth: 6,
    projectedOpenings: 193100,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Volunteer at hospitals, take health science classes, join health career clubs",
      high_school: "Become a CNA, take anatomy/biology courses, shadow healthcare professionals",
      post_secondary: "Enroll in nursing program, gain clinical experience, obtain RN license"
    },
    workEnvironment: "Hospitals, clinics, nursing homes. Often involves shift work and physical demands.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 60000, max: 100000, median: 82000, employment: 223500, demandLevel: "very_high" },
      CA: { min: 90000, max: 165000, median: 133000, employment: 325400, demandLevel: "very_high" },
      NY: { min: 75000, max: 120000, median: 98000, employment: 195300, demandLevel: "high" },
      FL: { min: 55000, max: 95000, median: 73000, employment: 198700, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "3",
    title: "Marketing Manager",
    category: "business",
    description: "Develop marketing strategies, manage campaigns, and analyze market trends to drive business growth.",
    salaryMin: 60000,
    salaryMax: 180000,
    salaryMedian: 156580,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "3-7 years",
    growthRate: "+8%",
    skills: ["Strategic Planning", "Data Analysis", "Creativity", "Leadership", "Communication"],
    relatedCareers: ["Brand Manager", "Digital Marketing Specialist", "Product Manager"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Marketing, Business, or Communications.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Gain experience through internships and earn digital marketing certifications.", duration: "1-2 years", cost: "$5,000-$15,000" },
    ],
    bkdAlignment: {
      be: 60,
      know: 70,
      do: 85,
      primaryPillar: "do",
      careerPersonality: "Creative strategist who thrives on influencing outcomes and driving results"
    },
    blsCode: "11-2021",
    blsOohGroup: "management",
    naicsCode: "54",
    jobOutlook: "faster_than_average",
    projectedGrowth: 8,
    projectedOpenings: 34000,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Join DECA/FBLA, manage social media for clubs, take business courses",
      post_secondary: "Major in marketing, gain internship experience, build digital portfolio"
    },
    workEnvironment: "Office settings with some remote work. Fast-paced, deadline-driven.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 170000, median: 145000, employment: 23400, demandLevel: "high" },
      CA: { min: 95000, max: 220000, median: 175000, employment: 34200, demandLevel: "high" },
      NY: { min: 90000, max: 200000, median: 165000, employment: 28100, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "4",
    title: "Electrician",
    category: "trades",
    description: "Install, maintain, and repair electrical systems in residential, commercial, and industrial settings.",
    salaryMin: 40000,
    salaryMax: 100000,
    salaryMedian: 61590,
    educationRequired: "High School + Apprenticeship",
    yearsExperience: "0-4 years",
    growthRate: "+6%",
    skills: ["Technical Skills", "Problem Solving", "Physical Stamina", "Safety Awareness", "Math"],
    relatedCareers: ["HVAC Technician", "Plumber", "Construction Manager"],
    pathways: [
      { type: "trade", description: "Complete a 4-5 year apprenticeship program combining classroom instruction with on-the-job training.", duration: "4-5 years", cost: "Paid training" },
      { type: "military", description: "Train as a military electrician and gain certifications.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 50,
      know: 65,
      do: 95,
      primaryPillar: "do",
      careerPersonality: "Hands-on problem solver who takes pride in practical, tangible work"
    },
    blsCode: "47-2111",
    blsOohGroup: "construction-and-extraction",
    naicsCode: "23",
    jobOutlook: "faster_than_average",
    projectedGrowth: 6,
    projectedOpenings: 73500,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Take shop classes, learn basic circuits, explore maker spaces",
      high_school: "Enroll in vocational programs, join SkillsUSA, get pre-apprenticeship training",
      post_secondary: "Begin apprenticeship, attend trade school, obtain journeyman license"
    },
    workEnvironment: "Construction sites, homes, businesses. Physical work, often outdoors.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Apprenticeship",
    stateSalaryData: {
      TX: { min: 45000, max: 90000, median: 58000, employment: 67200, demandLevel: "high" },
      CA: { min: 55000, max: 120000, median: 78000, employment: 71300, demandLevel: "high" },
      NY: { min: 50000, max: 110000, median: 82000, employment: 45800, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "5",
    title: "Graphic Designer",
    category: "creative",
    description: "Create visual content for brands, including logos, marketing materials, websites, and more.",
    salaryMin: 40000,
    salaryMax: 100000,
    salaryMedian: 59970,
    educationRequired: "Bachelor's Degree or Portfolio",
    yearsExperience: "0-3 years",
    growthRate: "+3%",
    skills: ["Adobe Creative Suite", "Typography", "Color Theory", "Creativity", "Communication"],
    relatedCareers: ["UX Designer", "Art Director", "Brand Designer"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Graphic Design or Visual Arts.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "certification", description: "Build a portfolio through online courses and freelance work.", duration: "1-2 years", cost: "$2,000-$10,000" },
    ],
    bkdAlignment: {
      be: 80,
      know: 60,
      do: 85,
      primaryPillar: "be",
      careerPersonality: "Creative visionary who expresses identity through visual storytelling"
    },
    blsCode: "27-1024",
    blsOohGroup: "arts-and-design",
    naicsCode: "54",
    jobOutlook: "average",
    projectedGrowth: 3,
    projectedOpenings: 22800,
    demandLevel: "moderate",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Create digital art, take art classes, learn basic design software",
      high_school: "Build portfolio, take AP Art, learn Adobe Creative Suite",
      post_secondary: "Get design degree, do freelance work, specialize in UI/UX"
    },
    workEnvironment: "Studios, offices, or remote. Often deadline-driven project work.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 42000, max: 85000, median: 58000, employment: 18900, demandLevel: "moderate" },
      CA: { min: 50000, max: 110000, median: 72000, employment: 29100, demandLevel: "moderate" },
      NY: { min: 48000, max: 100000, median: 68000, employment: 19800, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "6",
    title: "Paralegal",
    category: "legal",
    description: "Assist lawyers with legal research, document preparation, and case management.",
    salaryMin: 40000,
    salaryMax: 85000,
    salaryMedian: 60970,
    educationRequired: "Associate's or Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+4%",
    skills: ["Legal Research", "Writing", "Attention to Detail", "Organization", "Communication"],
    relatedCareers: ["Legal Secretary", "Court Reporter", "Lawyer"],
    pathways: [
      { type: "college", description: "Complete a paralegal certificate or associate's degree program.", duration: "1-2 years", cost: "$5,000-$30,000" },
      { type: "certification", description: "Earn a paralegal certification from an accredited program.", duration: "6 months - 1 year", cost: "$3,000-$10,000" },
    ],
    bkdAlignment: {
      be: 55,
      know: 90,
      do: 70,
      primaryPillar: "know",
      careerPersonality: "Detail-oriented researcher who excels in organization and information gathering"
    },
    blsCode: "23-2011",
    blsOohGroup: "legal",
    naicsCode: "54",
    jobOutlook: "average",
    projectedGrowth: 4,
    projectedOpenings: 36400,
    demandLevel: "moderate",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Join mock trial, take legal studies courses, develop research skills",
      post_secondary: "Complete paralegal program, gain legal internship, obtain certification"
    },
    workEnvironment: "Law firms, corporate legal departments. Office-based with regular hours.",
    typicalEntryEducation: "Associate's degree",
    onTheJobTraining: "Short-term on-the-job training",
    stateSalaryData: {
      TX: { min: 42000, max: 75000, median: 56000, employment: 21200, demandLevel: "moderate" },
      CA: { min: 50000, max: 95000, median: 68000, employment: 28100, demandLevel: "moderate" },
      NY: { min: 48000, max: 90000, median: 65000, employment: 19300, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "7",
    title: "Data Scientist",
    category: "technology",
    description: "Analyze complex data to help organizations make better decisions. Use machine learning and statistics.",
    salaryMin: 80000,
    salaryMax: 180000,
    salaryMedian: 108020,
    educationRequired: "Bachelor's or Master's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+36%",
    skills: ["Python/R Programming", "Machine Learning", "Statistics", "Data Visualization", "SQL"],
    relatedCareers: ["Data Analyst", "Machine Learning Engineer", "Business Intelligence Analyst"],
    pathways: [
      { type: "college", description: "Earn a degree in Data Science, Statistics, or Computer Science.", duration: "4-6 years", cost: "$50,000-$250,000" },
      { type: "certification", description: "Complete data science bootcamp and earn industry certifications.", duration: "6-12 months", cost: "$15,000-$30,000" },
    ],
    bkdAlignment: {
      be: 45,
      know: 95,
      do: 75,
      primaryPillar: "know",
      careerPersonality: "Curious analytical mind driven by discovering patterns and insights in data"
    },
    blsCode: "15-2051",
    blsOohGroup: "math",
    naicsCode: "54",
    jobOutlook: "much_faster",
    projectedGrowth: 36,
    projectedOpenings: 17700,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in math/statistics, learn Python basics, participate in data competitions",
      post_secondary: "Major in data science or statistics, build portfolio of projects, get internships"
    },
    workEnvironment: "Office or remote. Project-based work with cross-functional teams.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 85000, max: 165000, median: 120000, employment: 12400, demandLevel: "very_high" },
      CA: { min: 100000, max: 200000, median: 150000, employment: 28900, demandLevel: "very_high" },
      WA: { min: 95000, max: 190000, median: 145000, employment: 8700, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "8",
    title: "Wind Turbine Technician",
    category: "trades",
    description: "Install, maintain, and repair wind turbines. Work at great heights in renewable energy sector.",
    salaryMin: 45000,
    salaryMax: 80000,
    salaryMedian: 61770,
    educationRequired: "Technical Certificate",
    yearsExperience: "0-2 years",
    growthRate: "+45%",
    skills: ["Mechanical Skills", "Electrical Knowledge", "Physical Fitness", "Problem Solving", "Safety"],
    relatedCareers: ["Solar Panel Installer", "Electrical Technician", "Maintenance Technician"],
    pathways: [
      { type: "trade", description: "Complete wind energy technology certificate program.", duration: "1-2 years", cost: "$5,000-$15,000" },
      { type: "certification", description: "Earn technical certifications and safety credentials.", duration: "6-12 months", cost: "$3,000-$8,000" },
    ],
    bkdAlignment: {
      be: 55,
      know: 60,
      do: 95,
      primaryPillar: "do",
      careerPersonality: "Physically capable hands-on worker passionate about renewable energy and outdoor work"
    },
    blsCode: "49-9081",
    blsOohGroup: "installation-maintenance-and-repair",
    naicsCode: "22",
    jobOutlook: "much_faster",
    projectedGrowth: 45,
    projectedOpenings: 1400,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take physics and shop classes, learn about renewable energy, build physical fitness",
      post_secondary: "Enroll in wind technician program, obtain safety certifications, gain field experience"
    },
    workEnvironment: "Outdoor work at wind farms. Heights, various weather conditions.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Long-term on-the-job training",
    stateSalaryData: {
      TX: { min: 50000, max: 85000, median: 65000, employment: 4200, demandLevel: "very_high" },
      IA: { min: 48000, max: 78000, median: 60000, employment: 1800, demandLevel: "high" },
      OK: { min: 45000, max: 75000, median: 58000, employment: 1500, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "9",
    title: "Physician Assistant",
    category: "healthcare",
    description: "Diagnose illnesses, develop treatment plans, and prescribe medications under physician supervision.",
    salaryMin: 100000,
    salaryMax: 180000,
    salaryMedian: 130000,
    educationRequired: "Master's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+28%",
    skills: ["Medical Knowledge", "Patient Care", "Critical Thinking", "Communication", "Empathy"],
    relatedCareers: ["Nurse Practitioner", "Physician", "Healthcare Administrator"],
    pathways: [
      { type: "college", description: "Complete Bachelor's degree then PA Master's program.", duration: "6-7 years", cost: "$100,000-$300,000" },
    ],
    bkdAlignment: {
      be: 80,
      know: 90,
      do: 85,
      primaryPillar: "know",
      careerPersonality: "Dedicated learner with deep medical knowledge and compassion for patient care"
    },
    blsCode: "29-1071",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "much_faster",
    projectedGrowth: 28,
    projectedOpenings: 14100,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in sciences, volunteer in healthcare, gain patient care experience",
      post_secondary: "Complete pre-PA requirements, work as medical assistant or EMT, apply to PA programs"
    },
    workEnvironment: "Hospitals, clinics, specialty practices. May include night/weekend shifts.",
    typicalEntryEducation: "Master's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 105000, max: 160000, median: 125000, employment: 12800, demandLevel: "very_high" },
      CA: { min: 120000, max: 190000, median: 150000, employment: 16200, demandLevel: "very_high" },
      NY: { min: 115000, max: 175000, median: 140000, employment: 11900, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "10",
    title: "Cybersecurity Analyst",
    category: "technology",
    description: "Protect computer systems and networks from cyber threats. Monitor security and respond to incidents.",
    salaryMin: 70000,
    salaryMax: 160000,
    salaryMedian: 120360,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+33%",
    skills: ["Network Security", "Threat Analysis", "Security Tools", "Problem Solving", "Communication"],
    relatedCareers: ["Security Engineer", "Penetration Tester", "Security Architect"],
    pathways: [
      { type: "college", description: "Earn a degree in Cybersecurity, Computer Science, or IT.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Earn security certifications like CompTIA Security+, CISSP.", duration: "6-12 months", cost: "$5,000-$15,000" },
      { type: "military", description: "Serve in military cyber operations and transition to civilian roles.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 60,
      know: 90,
      do: 80,
      primaryPillar: "know",
      careerPersonality: "Vigilant protector with strong ethics and passion for continuous technical learning"
    },
    blsCode: "15-1212",
    blsOohGroup: "computer-and-information-technology",
    naicsCode: "54",
    jobOutlook: "much_faster",
    projectedGrowth: 33,
    projectedOpenings: 16800,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Learn about online safety, explore coding, participate in cyber competitions",
      high_school: "Take cybersecurity courses, join CyberPatriot, learn networking basics",
      post_secondary: "Get cybersecurity degree, earn certifications, participate in CTF competitions"
    },
    workEnvironment: "Office or remote. May include on-call responsibilities for security incidents.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 155000, median: 115000, employment: 24600, demandLevel: "very_high" },
      CA: { min: 95000, max: 180000, median: 140000, employment: 31200, demandLevel: "very_high" },
      VA: { min: 90000, max: 170000, median: 135000, employment: 28900, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "11",
    title: "Solar Photovoltaic Installer",
    category: "trades",
    description: "Install and maintain solar panel systems on rooftops and other structures.",
    salaryMin: 35000,
    salaryMax: 65000,
    salaryMedian: 47670,
    educationRequired: "High School + Training",
    yearsExperience: "0-2 years",
    growthRate: "+22%",
    skills: ["Electrical Knowledge", "Physical Fitness", "Safety Awareness", "Technical Skills", "Problem Solving"],
    relatedCareers: ["Electrician", "Wind Turbine Technician", "Construction Worker"],
    pathways: [
      { type: "trade", description: "Complete solar installation training program.", duration: "6-12 months", cost: "$3,000-$10,000" },
      { type: "certification", description: "Earn NABCEP certification for solar installation.", duration: "3-6 months", cost: "$2,000-$5,000" },
    ],
    bkdAlignment: {
      be: 60,
      know: 55,
      do: 95,
      primaryPillar: "do",
      careerPersonality: "Environmentally conscious hands-on worker who enjoys physical outdoor work"
    },
    blsCode: "47-2231",
    blsOohGroup: "construction-and-extraction",
    naicsCode: "23",
    jobOutlook: "much_faster",
    projectedGrowth: 22,
    projectedOpenings: 3500,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn basic electrical concepts, take vocational courses, develop physical fitness",
      post_secondary: "Complete solar training program, earn certifications, gain field experience"
    },
    workEnvironment: "Outdoor work on rooftops. Physical labor in various weather conditions.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      CA: { min: 45000, max: 75000, median: 55000, employment: 12800, demandLevel: "very_high" },
      AZ: { min: 38000, max: 60000, median: 48000, employment: 3200, demandLevel: "high" },
      TX: { min: 36000, max: 58000, median: 46000, employment: 4500, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "12",
    title: "Elementary School Teacher",
    category: "education",
    description: "Teach students in grades K-5 foundational skills in reading, writing, math, and other subjects.",
    salaryMin: 40000,
    salaryMax: 80000,
    salaryMedian: 61690,
    educationRequired: "Bachelor's Degree + License",
    yearsExperience: "0-3 years",
    growthRate: "+1%",
    skills: ["Classroom Management", "Communication", "Patience", "Creativity", "Organization"],
    relatedCareers: ["Special Education Teacher", "School Counselor", "Principal"],
    pathways: [
      { type: "college", description: "Earn a Bachelor's in Elementary Education and obtain teaching license.", duration: "4 years", cost: "$40,000-$150,000" },
      { type: "certification", description: "Complete alternative certification program after bachelor's degree.", duration: "1-2 years", cost: "$5,000-$15,000" },
    ],
    bkdAlignment: {
      be: 90,
      know: 75,
      do: 80,
      primaryPillar: "be",
      careerPersonality: "Nurturing guide with strong purpose who finds fulfillment in shaping young minds"
    },
    blsCode: "25-2021",
    blsOohGroup: "education-training-and-library",
    naicsCode: "61",
    jobOutlook: "little_change",
    projectedGrowth: 1,
    projectedOpenings: 107100,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Tutor younger students, volunteer at schools, take education courses",
      post_secondary: "Major in education, complete student teaching, obtain certification"
    },
    workEnvironment: "Schools. Regular school-year schedule with summers off.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "Internship/residency",
    stateSalaryData: {
      TX: { min: 45000, max: 65000, median: 55000, employment: 178500, demandLevel: "high" },
      CA: { min: 55000, max: 95000, median: 75000, employment: 156200, demandLevel: "moderate" },
      NY: { min: 50000, max: 90000, median: 70000, employment: 89300, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "13",
    title: "Physical Therapist",
    category: "healthcare",
    description: "Help patients recover from injuries and improve movement through exercises and treatments.",
    salaryMin: 75000,
    salaryMax: 130000,
    salaryMedian: 99710,
    educationRequired: "Doctoral Degree (DPT)",
    yearsExperience: "0-3 years",
    growthRate: "+15%",
    skills: ["Anatomy Knowledge", "Patient Care", "Communication", "Physical Stamina", "Problem Solving"],
    relatedCareers: ["Occupational Therapist", "Athletic Trainer", "Chiropractor"],
    pathways: [
      { type: "college", description: "Complete Bachelor's degree then Doctor of Physical Therapy (DPT) program.", duration: "7 years", cost: "$150,000-$350,000" },
    ],
    bkdAlignment: {
      be: 75,
      know: 85,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Hands-on healer who combines scientific knowledge with direct patient care"
    },
    blsCode: "29-1123",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "much_faster",
    projectedGrowth: 15,
    projectedOpenings: 12800,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in biology and anatomy, volunteer in PT clinics, play sports",
      post_secondary: "Complete pre-PT requirements, shadow physical therapists, apply to DPT programs"
    },
    workEnvironment: "Hospitals, clinics, sports facilities. Active work requiring physical stamina.",
    typicalEntryEducation: "Doctoral or professional degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 120000, median: 95000, employment: 18900, demandLevel: "high" },
      CA: { min: 95000, max: 145000, median: 115000, employment: 22100, demandLevel: "high" },
      FL: { min: 75000, max: 110000, median: 90000, employment: 16800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "14",
    title: "Veterinarian",
    category: "healthcare",
    description: "Diagnose and treat animals, perform surgeries, and provide preventive care.",
    salaryMin: 70000,
    salaryMax: 180000,
    salaryMedian: 119100,
    educationRequired: "Doctoral Degree (DVM)",
    yearsExperience: "0-3 years",
    growthRate: "+19%",
    skills: ["Animal Care", "Medical Knowledge", "Surgery Skills", "Communication", "Problem Solving"],
    relatedCareers: ["Veterinary Technician", "Animal Scientist", "Zoologist"],
    pathways: [
      { type: "college", description: "Complete Bachelor's degree then Doctor of Veterinary Medicine (DVM) program.", duration: "8 years", cost: "$200,000-$400,000" },
    ],
    bkdAlignment: {
      be: 85,
      know: 90,
      do: 80,
      primaryPillar: "be",
      careerPersonality: "Compassionate animal lover with deep dedication to animal welfare and healing"
    },
    blsCode: "29-1131",
    blsOohGroup: "healthcare",
    naicsCode: "54",
    jobOutlook: "much_faster",
    projectedGrowth: 19,
    projectedOpenings: 4600,
    demandLevel: "high",
    appropriateGrades: ["elementary", "middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      elementary: "Learn about animals, visit zoos and animal shelters, read about animal care",
      middle_school: "Volunteer at animal shelters, learn animal anatomy, join 4-H clubs",
      high_school: "Gain hands-on experience with animals, excel in biology and chemistry, shadow vets",
      post_secondary: "Complete pre-vet requirements, gain clinical experience, apply to vet schools"
    },
    workEnvironment: "Veterinary clinics, animal hospitals. May include emergency and weekend work.",
    typicalEntryEducation: "Doctoral or professional degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 80000, max: 150000, median: 110000, employment: 5800, demandLevel: "high" },
      CA: { min: 100000, max: 190000, median: 140000, employment: 7200, demandLevel: "high" },
      FL: { min: 75000, max: 140000, median: 105000, employment: 4900, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "15",
    title: "Construction Manager",
    category: "trades",
    description: "Plan, coordinate, and oversee construction projects from start to finish.",
    salaryMin: 60000,
    salaryMax: 150000,
    salaryMedian: 104900,
    educationRequired: "Bachelor's Degree or Experience",
    yearsExperience: "5+ years",
    growthRate: "+5%",
    skills: ["Project Management", "Leadership", "Budgeting", "Communication", "Problem Solving"],
    relatedCareers: ["Civil Engineer", "Architect", "General Contractor"],
    pathways: [
      { type: "college", description: "Earn a degree in Construction Management or Civil Engineering.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "trade", description: "Advance through construction trades and gain management experience.", duration: "10+ years", cost: "On-the-job experience" },
    ],
    bkdAlignment: {
      be: 65,
      know: 70,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Natural leader who excels at coordinating teams and seeing projects through to completion"
    },
    blsCode: "11-9021",
    blsOohGroup: "management",
    naicsCode: "23",
    jobOutlook: "faster_than_average",
    projectedGrowth: 5,
    projectedOpenings: 45100,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn trades skills, take construction technology courses, work summer construction jobs",
      post_secondary: "Pursue construction management degree, gain field experience, obtain certifications"
    },
    workEnvironment: "Construction sites and offices. Project-based work with travel.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      TX: { min: 70000, max: 140000, median: 100000, employment: 28900, demandLevel: "high" },
      CA: { min: 85000, max: 170000, median: 125000, employment: 32100, demandLevel: "high" },
      FL: { min: 65000, max: 130000, median: 95000, employment: 21500, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "16",
    title: "Plumber",
    category: "trades",
    description: "Install, repair, and maintain piping systems for water, gas, and drainage in residential and commercial buildings.",
    salaryMin: 38000,
    salaryMax: 100000,
    salaryMedian: 61550,
    educationRequired: "High School + Apprenticeship",
    yearsExperience: "0-4 years",
    growthRate: "+2%",
    skills: ["Pipe Fitting", "Blueprint Reading", "Problem Solving", "Physical Stamina", "Math"],
    relatedCareers: ["Pipefitter", "Steamfitter", "HVAC Technician"],
    pathways: [
      { type: "trade", description: "Complete a 4-5 year apprenticeship program combining classroom and hands-on training.", duration: "4-5 years", cost: "Paid training" },
      { type: "military", description: "Train as a military plumber/utilities specialist and earn certifications.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 50,
      know: 60,
      do: 95,
      primaryPillar: "do",
      careerPersonality: "Practical problem solver who enjoys hands-on work and helping people maintain their homes"
    },
    blsCode: "47-2152",
    blsOohGroup: "construction-and-extraction",
    naicsCode: "23",
    jobOutlook: "average",
    projectedGrowth: 2,
    projectedOpenings: 42600,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Take shop classes, learn basic tools, explore maker spaces and plumbing basics",
      high_school: "Enroll in vocational programs, join SkillsUSA, get pre-apprenticeship training",
      post_secondary: "Begin apprenticeship, attend trade school, work toward journeyman license"
    },
    workEnvironment: "Homes, businesses, construction sites. Physical work, sometimes in tight spaces.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Apprenticeship",
    stateSalaryData: {
      TX: { min: 40000, max: 85000, median: 55000, employment: 45200, demandLevel: "high" },
      CA: { min: 55000, max: 115000, median: 75000, employment: 38900, demandLevel: "high" },
      NY: { min: 50000, max: 110000, median: 80000, employment: 28100, demandLevel: "high" },
      FL: { min: 38000, max: 80000, median: 52000, employment: 29400, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "17",
    title: "HVAC Technician",
    category: "trades",
    description: "Install, maintain, and repair heating, ventilation, air conditioning, and refrigeration systems.",
    salaryMin: 38000,
    salaryMax: 85000,
    salaryMedian: 57300,
    educationRequired: "Technical Certificate or Apprenticeship",
    yearsExperience: "0-3 years",
    growthRate: "+6%",
    skills: ["HVAC Systems", "Electrical Knowledge", "Troubleshooting", "Customer Service", "Physical Fitness"],
    relatedCareers: ["Electrician", "Plumber", "Refrigeration Mechanic"],
    pathways: [
      { type: "trade", description: "Complete HVAC training program or apprenticeship.", duration: "6 months - 2 years", cost: "$5,000-$15,000" },
      { type: "certification", description: "Earn EPA 608 certification and manufacturer-specific credentials.", duration: "3-6 months", cost: "$2,000-$5,000" },
      { type: "military", description: "Train in military HVAC/refrigeration roles and transition to civilian work.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 50,
      know: 65,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Technical troubleshooter who enjoys diagnosing and fixing complex mechanical systems"
    },
    blsCode: "49-9021",
    blsOohGroup: "installation-maintenance-and-repair",
    naicsCode: "23",
    jobOutlook: "faster_than_average",
    projectedGrowth: 6,
    projectedOpenings: 38500,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Learn basic mechanics, take shop classes, explore how heating and cooling systems work",
      high_school: "Enroll in HVAC vocational programs, take physics and electrical courses, join SkillsUSA",
      post_secondary: "Complete HVAC training, earn EPA certification, begin apprenticeship or entry-level work"
    },
    workEnvironment: "Homes, businesses, construction sites. Indoor and outdoor work in varying temperatures.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Long-term on-the-job training",
    stateSalaryData: {
      TX: { min: 40000, max: 80000, median: 52000, employment: 42800, demandLevel: "very_high" },
      CA: { min: 48000, max: 95000, median: 65000, employment: 32100, demandLevel: "high" },
      FL: { min: 38000, max: 75000, median: 50000, employment: 35600, demandLevel: "very_high" },
      AZ: { min: 42000, max: 82000, median: 55000, employment: 12400, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "18",
    title: "Welder",
    category: "trades",
    description: "Join metal parts together using heat and pressure. Work in manufacturing, construction, and repair industries.",
    salaryMin: 36000,
    salaryMax: 75000,
    salaryMedian: 48000,
    educationRequired: "High School + Training",
    yearsExperience: "0-2 years",
    growthRate: "+2%",
    skills: ["Welding Techniques", "Blueprint Reading", "Physical Stamina", "Attention to Detail", "Safety"],
    relatedCareers: ["Pipefitter", "Sheet Metal Worker", "Ironworker"],
    pathways: [
      { type: "trade", description: "Complete welding program at a technical or community college.", duration: "6 months - 2 years", cost: "$5,000-$15,000" },
      { type: "certification", description: "Earn AWS (American Welding Society) certifications for specialized welding.", duration: "3-6 months", cost: "$1,000-$5,000" },
      { type: "military", description: "Train as a military welder and gain advanced certifications.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 45,
      know: 55,
      do: 95,
      primaryPillar: "do",
      careerPersonality: "Detail-focused craftsperson who takes pride in precise, skilled manual work"
    },
    blsCode: "51-4121",
    blsOohGroup: "production",
    naicsCode: "31-33",
    jobOutlook: "average",
    projectedGrowth: 2,
    projectedOpenings: 42300,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Take metal shop classes, explore maker spaces, learn about different metals",
      high_school: "Enroll in welding vocational programs, join SkillsUSA, take physics and math",
      post_secondary: "Complete welding certification, specialize in TIG/MIG/stick welding, gain field experience"
    },
    workEnvironment: "Factories, construction sites, repair shops. Physical work with heat and safety gear.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      TX: { min: 38000, max: 72000, median: 48000, employment: 52100, demandLevel: "high" },
      CA: { min: 42000, max: 80000, median: 55000, employment: 28400, demandLevel: "moderate" },
      OH: { min: 36000, max: 65000, median: 45000, employment: 18900, demandLevel: "high" },
      LA: { min: 40000, max: 85000, median: 55000, employment: 14200, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "19",
    title: "Automotive Technician",
    category: "trades",
    description: "Diagnose, repair, and maintain automobiles and light trucks. Use diagnostic equipment and hand tools.",
    salaryMin: 32000,
    salaryMax: 75000,
    salaryMedian: 46990,
    educationRequired: "Technical Certificate or Associate's",
    yearsExperience: "0-3 years",
    growthRate: "+4%",
    skills: ["Automotive Diagnostics", "Engine Repair", "Electrical Systems", "Customer Service", "Problem Solving"],
    relatedCareers: ["Diesel Mechanic", "Auto Body Repairer", "Service Advisor"],
    pathways: [
      { type: "trade", description: "Complete automotive technology program at a trade school.", duration: "6 months - 2 years", cost: "$5,000-$20,000" },
      { type: "certification", description: "Earn ASE (Automotive Service Excellence) certifications.", duration: "6-12 months", cost: "$1,000-$5,000" },
      { type: "military", description: "Train as a military vehicle mechanic and transition to civilian auto repair.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 45,
      know: 65,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Mechanically curious problem solver who loves figuring out how things work"
    },
    blsCode: "49-3023",
    blsOohGroup: "installation-maintenance-and-repair",
    naicsCode: "81",
    jobOutlook: "average",
    projectedGrowth: 4,
    projectedOpenings: 69000,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Learn basic mechanics, take shop classes, explore how cars and engines work",
      high_school: "Enroll in auto tech programs, join SkillsUSA, work on personal vehicle projects",
      post_secondary: "Complete automotive technology program, earn ASE certifications, gain shop experience"
    },
    workEnvironment: "Auto repair shops and dealerships. Standing, bending, and lifting required.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Short-term on-the-job training",
    stateSalaryData: {
      TX: { min: 35000, max: 70000, median: 45000, employment: 68900, demandLevel: "high" },
      CA: { min: 40000, max: 82000, median: 55000, employment: 58200, demandLevel: "moderate" },
      FL: { min: 32000, max: 65000, median: 42000, employment: 42100, demandLevel: "moderate" },
      MI: { min: 38000, max: 75000, median: 50000, employment: 24800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "20",
    title: "CDL Truck Driver",
    category: "trades",
    description: "Transport goods over long or short distances using large trucks. Requires a Commercial Driver's License (CDL).",
    salaryMin: 35000,
    salaryMax: 80000,
    salaryMedian: 54320,
    educationRequired: "CDL Training Program",
    yearsExperience: "0-1 years",
    growthRate: "+4%",
    skills: ["Driving", "Navigation", "Time Management", "Safety", "Physical Stamina"],
    relatedCareers: ["Delivery Driver", "Bus Driver", "Heavy Equipment Operator"],
    pathways: [
      { type: "certification", description: "Complete CDL training program and pass CDL exam.", duration: "3-8 weeks", cost: "$3,000-$7,000" },
      { type: "trade", description: "Attend truck driving school for comprehensive training.", duration: "2-4 months", cost: "$5,000-$10,000" },
      { type: "military", description: "Drive military vehicles and convert to civilian CDL.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 55,
      know: 45,
      do: 85,
      primaryPillar: "do",
      careerPersonality: "Independent self-starter who enjoys the open road and working on their own schedule"
    },
    blsCode: "53-3032",
    blsOohGroup: "transportation-and-material-moving",
    naicsCode: "48-49",
    jobOutlook: "average",
    projectedGrowth: 4,
    projectedOpenings: 240300,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn about logistics, take driver education, understand vehicle maintenance basics",
      post_secondary: "Enroll in CDL training program, pass CDL test, start with a carrier company"
    },
    workEnvironment: "On the road for long hours. May be away from home for days or weeks at a time.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Short-term on-the-job training",
    stateSalaryData: {
      TX: { min: 40000, max: 80000, median: 55000, employment: 198400, demandLevel: "very_high" },
      CA: { min: 45000, max: 85000, median: 58000, employment: 145200, demandLevel: "very_high" },
      FL: { min: 38000, max: 72000, median: 50000, employment: 98700, demandLevel: "high" },
      OH: { min: 38000, max: 70000, median: 48000, employment: 75200, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "21",
    title: "Diesel Mechanic",
    category: "trades",
    description: "Inspect, repair, and maintain diesel engines and vehicles including trucks, buses, and heavy equipment.",
    salaryMin: 38000,
    salaryMax: 78000,
    salaryMedian: 58350,
    educationRequired: "Technical Certificate or Associate's",
    yearsExperience: "0-3 years",
    growthRate: "+5%",
    skills: ["Diesel Engine Repair", "Diagnostics", "Hydraulics", "Electrical Systems", "Problem Solving"],
    relatedCareers: ["Automotive Technician", "Heavy Equipment Mechanic", "Marine Mechanic"],
    pathways: [
      { type: "trade", description: "Complete diesel technology program at a trade school.", duration: "1-2 years", cost: "$5,000-$20,000" },
      { type: "certification", description: "Earn ASE diesel certifications and manufacturer credentials.", duration: "6-12 months", cost: "$2,000-$8,000" },
      { type: "military", description: "Train as a military diesel mechanic on heavy vehicles and equipment.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 45,
      know: 65,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Mechanically skilled troubleshooter who enjoys working with powerful engines and heavy machinery"
    },
    blsCode: "49-3031",
    blsOohGroup: "installation-maintenance-and-repair",
    naicsCode: "81",
    jobOutlook: "faster_than_average",
    projectedGrowth: 5,
    projectedOpenings: 28400,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Learn about engines and mechanics, take shop classes, explore how diesel vehicles work",
      high_school: "Enroll in diesel tech programs, work on small engines, join SkillsUSA",
      post_secondary: "Complete diesel technology program, earn ASE diesel certifications, gain shop experience"
    },
    workEnvironment: "Repair shops, truck stops, fleet garages. Physical work with heavy machinery.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Long-term on-the-job training",
    stateSalaryData: {
      TX: { min: 42000, max: 78000, median: 58000, employment: 28900, demandLevel: "high" },
      CA: { min: 48000, max: 85000, median: 65000, employment: 18200, demandLevel: "high" },
      OH: { min: 40000, max: 72000, median: 52000, employment: 12400, demandLevel: "moderate" },
      PA: { min: 42000, max: 75000, median: 55000, employment: 11800, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "22",
    title: "Medical Assistant",
    category: "healthcare",
    description: "Perform clinical and administrative tasks in physician offices, hospitals, and healthcare facilities.",
    salaryMin: 30000,
    salaryMax: 50000,
    salaryMedian: 42000,
    educationRequired: "Certificate or Associate's Degree",
    yearsExperience: "0-1 years",
    growthRate: "+14%",
    skills: ["Patient Care", "Medical Terminology", "Vital Signs", "EHR Systems", "Communication"],
    relatedCareers: ["Licensed Vocational Nurse", "Phlebotomist", "Dental Assistant"],
    pathways: [
      { type: "certification", description: "Complete medical assistant certificate program and earn CMA credential.", duration: "9-12 months", cost: "$5,000-$15,000" },
      { type: "trade", description: "Complete associate's degree in medical assisting.", duration: "2 years", cost: "$10,000-$25,000" },
    ],
    bkdAlignment: {
      be: 75,
      know: 65,
      do: 80,
      primaryPillar: "be",
      careerPersonality: "Caring multitasker who thrives in fast-paced healthcare environments"
    },
    blsCode: "31-9092",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "much_faster",
    projectedGrowth: 14,
    projectedOpenings: 119200,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take health science courses, volunteer at clinics, earn CPR/First Aid certification",
      post_secondary: "Enroll in medical assistant program, complete externship, earn CMA certification"
    },
    workEnvironment: "Doctor's offices, clinics, hospitals. Regular hours with some evening/weekend shifts.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 30000, max: 45000, median: 36000, employment: 58900, demandLevel: "very_high" },
      CA: { min: 38000, max: 55000, median: 45000, employment: 82400, demandLevel: "very_high" },
      FL: { min: 30000, max: 42000, median: 35000, employment: 48200, demandLevel: "high" },
      NY: { min: 35000, max: 50000, median: 42000, employment: 35800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "23",
    title: "Pharmacy Technician",
    category: "healthcare",
    description: "Assist pharmacists in dispensing medications, managing inventory, and serving patients at pharmacies.",
    salaryMin: 30000,
    salaryMax: 50000,
    salaryMedian: 38350,
    educationRequired: "Certificate or High School + Training",
    yearsExperience: "0-1 years",
    growthRate: "+6%",
    skills: ["Medication Knowledge", "Attention to Detail", "Customer Service", "Math", "Organization"],
    relatedCareers: ["Pharmacist", "Medical Assistant", "Phlebotomist"],
    pathways: [
      { type: "certification", description: "Complete pharmacy technician certificate program and pass PTCB exam.", duration: "6-12 months", cost: "$3,000-$10,000" },
      { type: "trade", description: "Complete associate's degree in pharmacy technology.", duration: "2 years", cost: "$10,000-$20,000" },
    ],
    bkdAlignment: {
      be: 60,
      know: 75,
      do: 70,
      primaryPillar: "know",
      careerPersonality: "Detail-oriented person who values accuracy and helping patients with their health needs"
    },
    blsCode: "29-2052",
    blsOohGroup: "healthcare",
    naicsCode: "44-45",
    jobOutlook: "faster_than_average",
    projectedGrowth: 6,
    projectedOpenings: 43500,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take chemistry and biology, learn about medications, develop strong math skills",
      post_secondary: "Enroll in pharmacy tech program, pass PTCB exam, gain retail or hospital pharmacy experience"
    },
    workEnvironment: "Retail pharmacies, hospitals, mail-order pharmacies. Regular hours with some evenings/weekends.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      TX: { min: 30000, max: 45000, median: 36000, employment: 35200, demandLevel: "high" },
      CA: { min: 38000, max: 58000, median: 48000, employment: 42100, demandLevel: "high" },
      NY: { min: 32000, max: 48000, median: 40000, employment: 22800, demandLevel: "moderate" },
      FL: { min: 30000, max: 42000, median: 35000, employment: 28400, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "24",
    title: "EMT & Paramedic",
    category: "public_safety",
    description: "Respond to emergency calls, provide medical care, and transport patients to hospitals.",
    salaryMin: 30000,
    salaryMax: 65000,
    salaryMedian: 38930,
    educationRequired: "Certificate (EMT) or Associate's (Paramedic)",
    yearsExperience: "0-2 years",
    growthRate: "+5%",
    skills: ["Emergency Medicine", "CPR/First Aid", "Decision Making", "Physical Fitness", "Stress Management"],
    relatedCareers: ["Firefighter", "Registered Nurse", "Physician Assistant"],
    pathways: [
      { type: "certification", description: "Complete EMT-Basic certification (120-150 hours of training).", duration: "3-6 months", cost: "$1,000-$3,000" },
      { type: "trade", description: "Complete paramedic program for advanced certification.", duration: "1-2 years", cost: "$5,000-$15,000" },
      { type: "military", description: "Train as a military combat medic and earn civilian EMT/Paramedic certification.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 85,
      know: 70,
      do: 90,
      primaryPillar: "be",
      careerPersonality: "Courageous first responder driven by urgency and compassion to save lives"
    },
    blsCode: "29-2040",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "faster_than_average",
    projectedGrowth: 5,
    projectedOpenings: 19600,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Get CPR/First Aid certified, volunteer with local EMS, take health science courses",
      post_secondary: "Complete EMT-Basic program, gain field experience, advance to Paramedic certification"
    },
    workEnvironment: "Ambulances, emergency scenes, hospitals. Shift work with high-stress situations.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 32000, max: 55000, median: 38000, employment: 24800, demandLevel: "high" },
      CA: { min: 40000, max: 75000, median: 48000, employment: 22100, demandLevel: "high" },
      NY: { min: 35000, max: 65000, median: 45000, employment: 18900, demandLevel: "moderate" },
      FL: { min: 30000, max: 52000, median: 36000, employment: 19200, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "25",
    title: "Dental Hygienist",
    category: "healthcare",
    description: "Clean teeth, examine patients for oral diseases, and educate patients on proper oral health care.",
    salaryMin: 60000,
    salaryMax: 105000,
    salaryMedian: 87530,
    educationRequired: "Associate's Degree",
    yearsExperience: "0-2 years",
    growthRate: "+7%",
    skills: ["Dental Procedures", "Patient Care", "Attention to Detail", "Communication", "Dexterity"],
    relatedCareers: ["Dental Assistant", "Dentist", "Dental Lab Technician"],
    pathways: [
      { type: "trade", description: "Complete associate's degree in dental hygiene from an accredited program.", duration: "2-3 years", cost: "$15,000-$50,000" },
    ],
    bkdAlignment: {
      be: 70,
      know: 75,
      do: 80,
      primaryPillar: "do",
      careerPersonality: "Detail-oriented caregiver who values preventive health and patient education"
    },
    blsCode: "29-1292",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "faster_than_average",
    projectedGrowth: 7,
    projectedOpenings: 15600,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take biology and chemistry, shadow dental offices, volunteer in healthcare settings",
      post_secondary: "Complete dental hygiene program, pass national and state board exams, obtain licensure"
    },
    workEnvironment: "Dental offices. Regular hours, part-time work common. Clean clinical environment.",
    typicalEntryEducation: "Associate's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 65000, max: 95000, median: 82000, employment: 16800, demandLevel: "high" },
      CA: { min: 85000, max: 120000, median: 105000, employment: 24200, demandLevel: "high" },
      NY: { min: 70000, max: 100000, median: 88000, employment: 12400, demandLevel: "moderate" },
      FL: { min: 60000, max: 90000, median: 75000, employment: 14100, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "26",
    title: "Licensed Vocational Nurse (LVN/LPN)",
    category: "healthcare",
    description: "Provide basic nursing care under the direction of registered nurses and doctors.",
    salaryMin: 38000,
    salaryMax: 65000,
    salaryMedian: 55860,
    educationRequired: "Certificate or Associate's Degree",
    yearsExperience: "0-1 years",
    growthRate: "+5%",
    skills: ["Patient Care", "Medication Administration", "Vital Signs", "Communication", "Compassion"],
    relatedCareers: ["Registered Nurse", "Certified Nursing Assistant", "Medical Assistant"],
    pathways: [
      { type: "trade", description: "Complete LVN/LPN program at a vocational school or community college.", duration: "12-18 months", cost: "$10,000-$25,000" },
      { type: "certification", description: "Pass the NCLEX-PN exam to obtain licensure.", duration: "12-18 months", cost: "$10,000-$25,000" },
    ],
    bkdAlignment: {
      be: 80,
      know: 70,
      do: 75,
      primaryPillar: "be",
      careerPersonality: "Compassionate caregiver who finds purpose in direct patient care and support"
    },
    blsCode: "29-2061",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "faster_than_average",
    projectedGrowth: 5,
    projectedOpenings: 54400,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take health science courses, become a CNA, volunteer at nursing facilities",
      post_secondary: "Complete LVN/LPN program, pass NCLEX-PN, gain clinical experience"
    },
    workEnvironment: "Hospitals, nursing facilities, clinics. Shift work including evenings and weekends.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 40000, max: 60000, median: 52000, employment: 82400, demandLevel: "very_high" },
      CA: { min: 50000, max: 75000, median: 65000, employment: 68100, demandLevel: "high" },
      FL: { min: 38000, max: 55000, median: 48000, employment: 52800, demandLevel: "high" },
      NY: { min: 42000, max: 62000, median: 55000, employment: 38200, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "27",
    title: "Certified Nursing Assistant (CNA)",
    category: "healthcare",
    description: "Assist patients with daily activities, take vital signs, and provide basic care in healthcare settings.",
    salaryMin: 25000,
    salaryMax: 42000,
    salaryMedian: 35760,
    educationRequired: "Certificate (4-12 weeks training)",
    yearsExperience: "None required",
    growthRate: "+4%",
    skills: ["Patient Care", "Physical Stamina", "Compassion", "Communication", "Attention to Detail"],
    relatedCareers: ["Licensed Vocational Nurse", "Medical Assistant", "Home Health Aide"],
    pathways: [
      { type: "certification", description: "Complete state-approved CNA training program and pass certification exam.", duration: "4-12 weeks", cost: "$500-$2,000" },
    ],
    bkdAlignment: {
      be: 85,
      know: 50,
      do: 75,
      primaryPillar: "be",
      careerPersonality: "Deeply caring individual who finds fulfillment in helping others with basic needs"
    },
    blsCode: "31-1131",
    blsOohGroup: "healthcare",
    naicsCode: "62",
    jobOutlook: "average",
    projectedGrowth: 4,
    projectedOpenings: 220200,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take health classes, volunteer at nursing homes, earn CPR certification",
      post_secondary: "Complete CNA training (often free through employers), pass state certification exam"
    },
    workEnvironment: "Nursing homes, hospitals, assisted living. Physically demanding shift work.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Short-term on-the-job training",
    stateSalaryData: {
      TX: { min: 26000, max: 38000, median: 32000, employment: 98400, demandLevel: "very_high" },
      CA: { min: 35000, max: 48000, median: 42000, employment: 108200, demandLevel: "very_high" },
      FL: { min: 25000, max: 36000, median: 30000, employment: 82100, demandLevel: "high" },
      NY: { min: 32000, max: 45000, median: 38000, employment: 72400, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "28",
    title: "Real Estate Agent",
    category: "business",
    description: "Help people buy, sell, and rent properties. Market listings, negotiate deals, and guide clients through transactions.",
    salaryMin: 30000,
    salaryMax: 120000,
    salaryMedian: 56620,
    educationRequired: "Real Estate License (state-specific)",
    yearsExperience: "0-2 years",
    growthRate: "+3%",
    skills: ["Negotiation", "Sales", "Marketing", "Communication", "Market Analysis"],
    relatedCareers: ["Property Manager", "Real Estate Broker", "Mortgage Loan Officer"],
    pathways: [
      { type: "certification", description: "Complete state-required pre-licensing courses and pass real estate exam.", duration: "2-6 months", cost: "$1,000-$3,000" },
    ],
    bkdAlignment: {
      be: 70,
      know: 60,
      do: 85,
      primaryPillar: "do",
      careerPersonality: "Entrepreneurial self-starter with strong people skills and drive to close deals"
    },
    blsCode: "41-9022",
    blsOohGroup: "sales",
    naicsCode: "53",
    jobOutlook: "average",
    projectedGrowth: 3,
    projectedOpenings: 51600,
    demandLevel: "moderate",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take business and marketing courses, learn about real estate markets, develop sales skills",
      post_secondary: "Complete real estate pre-licensing course, pass state exam, join a brokerage"
    },
    workEnvironment: "Self-employed or brokerage. Flexible but often includes evenings and weekends.",
    typicalEntryEducation: "High school diploma",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      TX: { min: 32000, max: 110000, median: 55000, employment: 42100, demandLevel: "moderate" },
      CA: { min: 40000, max: 150000, median: 72000, employment: 58200, demandLevel: "moderate" },
      FL: { min: 30000, max: 105000, median: 50000, employment: 48900, demandLevel: "moderate" },
      NY: { min: 35000, max: 130000, median: 65000, employment: 28400, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "29",
    title: "Cosmetologist / Barber",
    category: "personal_services",
    description: "Cut, color, and style hair. May also provide skin care, nail services, and other beauty treatments.",
    salaryMin: 25000,
    salaryMax: 65000,
    salaryMedian: 35080,
    educationRequired: "State-Licensed Cosmetology Program",
    yearsExperience: "0-1 years",
    growthRate: "+8%",
    skills: ["Hair Styling", "Color Theory", "Customer Service", "Creativity", "Business Skills"],
    relatedCareers: ["Esthetician", "Nail Technician", "Makeup Artist"],
    pathways: [
      { type: "trade", description: "Complete state-licensed cosmetology or barbering program.", duration: "9-18 months", cost: "$5,000-$20,000" },
      { type: "certification", description: "Pass state licensing exam and build clientele.", duration: "9-18 months", cost: "$5,000-$20,000" },
    ],
    bkdAlignment: {
      be: 75,
      know: 55,
      do: 85,
      primaryPillar: "be",
      careerPersonality: "Creative artist with strong interpersonal skills who helps people look and feel confident"
    },
    blsCode: "39-5012",
    blsOohGroup: "personal-care-and-service",
    naicsCode: "81",
    jobOutlook: "faster_than_average",
    projectedGrowth: 8,
    projectedOpenings: 77600,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Practice styling on friends and family, take art classes, explore beauty as a career",
      post_secondary: "Enroll in cosmetology/barber school, complete required hours, pass state board exam"
    },
    workEnvironment: "Salons, barbershops, or self-employed. Standing for long periods. Flexible schedules possible.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 25000, max: 55000, median: 32000, employment: 58200, demandLevel: "high" },
      CA: { min: 30000, max: 70000, median: 42000, employment: 82100, demandLevel: "high" },
      NY: { min: 28000, max: 65000, median: 38000, employment: 42800, demandLevel: "moderate" },
      FL: { min: 25000, max: 52000, median: 30000, employment: 48900, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "30",
    title: "Firefighter",
    category: "public_safety",
    description: "Respond to fires, accidents, and other emergencies. Rescue people and protect property and communities.",
    salaryMin: 38000,
    salaryMax: 95000,
    salaryMedian: 57120,
    educationRequired: "High School + Fire Academy",
    yearsExperience: "0-2 years",
    growthRate: "+4%",
    skills: ["Emergency Response", "Physical Fitness", "Teamwork", "Problem Solving", "First Aid"],
    relatedCareers: ["EMT & Paramedic", "Fire Inspector", "Emergency Management Director"],
    pathways: [
      { type: "certification", description: "Complete fire academy training and earn EMT certification.", duration: "3-6 months", cost: "$3,000-$10,000" },
      { type: "trade", description: "Earn fire science associate's degree and complete academy.", duration: "2 years", cost: "$10,000-$25,000" },
      { type: "military", description: "Serve as a military firefighter and transition to civilian fire service.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 90,
      know: 60,
      do: 90,
      primaryPillar: "be",
      careerPersonality: "Brave, physically fit team player driven by a deep sense of duty to protect communities"
    },
    blsCode: "33-2011",
    blsOohGroup: "protective-service",
    naicsCode: "92",
    jobOutlook: "average",
    projectedGrowth: 4,
    projectedOpenings: 24300,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Build physical fitness, learn about fire safety, join explorer scout programs",
      high_school: "Join fire explorer programs, earn CPR/First Aid certification, volunteer with local departments",
      post_secondary: "Complete fire academy, earn EMT certification, apply to fire departments"
    },
    workEnvironment: "Fire stations and emergency scenes. 24-hour shifts common. Physically demanding and hazardous.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Long-term on-the-job training",
    stateSalaryData: {
      TX: { min: 40000, max: 80000, median: 55000, employment: 28400, demandLevel: "high" },
      CA: { min: 55000, max: 120000, median: 82000, employment: 32100, demandLevel: "high" },
      NY: { min: 50000, max: 110000, median: 78000, employment: 18900, demandLevel: "moderate" },
      FL: { min: 38000, max: 72000, median: 52000, employment: 22400, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "31",
    title: "AI / Machine Learning Engineer",
    category: "technology",
    description: "Design, build, and deploy artificial intelligence and machine learning models that power intelligent applications, automation, and data-driven decision making.",
    salaryMin: 100000,
    salaryMax: 250000,
    salaryMedian: 161000,
    educationRequired: "Bachelor's or Master's Degree",
    yearsExperience: "0-5 years",
    growthRate: "+40%",
    skills: ["Python/PyTorch/TensorFlow", "Machine Learning", "Mathematics", "Data Engineering", "Cloud Computing"],
    relatedCareers: ["Data Scientist", "Software Developer", "Research Scientist"],
    pathways: [
      { type: "college", description: "Earn a degree in Computer Science, AI, or Data Science with ML focus.", duration: "4-6 years", cost: "$50,000-$250,000" },
      { type: "certification", description: "Complete AI/ML bootcamp and earn cloud AI certifications (AWS ML, Google AI).", duration: "6-12 months", cost: "$10,000-$25,000" },
    ],
    bkdAlignment: {
      be: 50,
      know: 95,
      do: 85,
      primaryPillar: "know",
      careerPersonality: "Innovative problem solver who loves pushing the boundaries of what machines can learn and do"
    },
    blsCode: "15-2051",
    blsOohGroup: "computer-and-information-technology",
    naicsCode: "51",
    jobOutlook: "much_faster",
    projectedGrowth: 40,
    projectedOpenings: 21500,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn Python programming, explore AI concepts through online courses, participate in data science competitions",
      post_secondary: "Major in CS/AI, build ML projects, contribute to open-source AI frameworks, pursue internships at AI companies"
    },
    workEnvironment: "Office or remote. Highly collaborative, research-oriented teams.",
    typicalEntryEducation: "Master's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      CA: { min: 130000, max: 280000, median: 195000, employment: 18200, demandLevel: "very_high" },
      WA: { min: 120000, max: 260000, median: 185000, employment: 8400, demandLevel: "very_high" },
      NY: { min: 110000, max: 230000, median: 170000, employment: 7800, demandLevel: "very_high" },
      TX: { min: 100000, max: 210000, median: 155000, employment: 6200, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "32",
    title: "Cloud Architect",
    category: "technology",
    description: "Design and oversee cloud computing strategies, including cloud adoption plans, application design, and cloud management and monitoring.",
    salaryMin: 100000,
    salaryMax: 200000,
    salaryMedian: 151150,
    educationRequired: "Bachelor's Degree + Certifications",
    yearsExperience: "3-7 years",
    growthRate: "+23%",
    skills: ["AWS/Azure/GCP", "System Architecture", "DevOps", "Security", "Networking"],
    relatedCareers: ["Software Developer", "Cybersecurity Analyst", "DevOps Engineer"],
    pathways: [
      { type: "college", description: "Earn a degree in Computer Science, IT, or related field.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Earn cloud certifications (AWS Solutions Architect, Azure Architect, GCP Professional).", duration: "6-12 months", cost: "$5,000-$15,000" },
      { type: "military", description: "Gain IT experience in military and transition with cloud certifications.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 55,
      know: 90,
      do: 85,
      primaryPillar: "know",
      careerPersonality: "Strategic systems thinker who designs scalable infrastructure for the digital age"
    },
    blsCode: "15-1241",
    blsOohGroup: "computer-and-information-technology",
    naicsCode: "54",
    jobOutlook: "much_faster",
    projectedGrowth: 23,
    projectedOpenings: 14200,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Learn programming and networking basics, explore cloud free tiers, take IT courses",
      post_secondary: "Study CS or IT, earn cloud certifications, gain experience in system administration"
    },
    workEnvironment: "Office or remote. Cross-team collaboration with developers and operations.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      CA: { min: 130000, max: 230000, median: 175000, employment: 12400, demandLevel: "very_high" },
      WA: { min: 120000, max: 220000, median: 165000, employment: 6800, demandLevel: "very_high" },
      TX: { min: 105000, max: 195000, median: 150000, employment: 8200, demandLevel: "very_high" },
      VA: { min: 110000, max: 200000, median: 155000, employment: 7100, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "33",
    title: "UX/UI Designer",
    category: "creative",
    description: "Research, design, and test user interfaces for websites, apps, and digital products to create intuitive and enjoyable user experiences.",
    salaryMin: 60000,
    salaryMax: 140000,
    salaryMedian: 91600,
    educationRequired: "Bachelor's Degree or Portfolio",
    yearsExperience: "0-3 years",
    growthRate: "+16%",
    skills: ["User Research", "Wireframing/Prototyping", "Figma/Sketch", "Visual Design", "Accessibility"],
    relatedCareers: ["Graphic Designer", "Product Manager", "Web Developer"],
    pathways: [
      { type: "college", description: "Earn a degree in UX Design, HCI, or Design.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "certification", description: "Complete UX design bootcamp and build portfolio.", duration: "3-6 months", cost: "$5,000-$15,000" },
    ],
    bkdAlignment: {
      be: 75,
      know: 70,
      do: 85,
      primaryPillar: "do",
      careerPersonality: "Empathetic designer who combines creativity with user psychology to craft meaningful digital experiences"
    },
    blsCode: "15-1255",
    blsOohGroup: "arts-and-design",
    naicsCode: "54",
    jobOutlook: "much_faster",
    projectedGrowth: 16,
    projectedOpenings: 19400,
    demandLevel: "very_high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Create digital art, learn basic web design, explore how apps are designed",
      high_school: "Build simple websites, learn design tools like Figma, study psychology",
      post_secondary: "Complete UX program or bootcamp, build case study portfolio, gain internship experience"
    },
    workEnvironment: "Office or remote. Collaborative work with developers and product teams.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      CA: { min: 80000, max: 160000, median: 115000, employment: 14200, demandLevel: "very_high" },
      NY: { min: 70000, max: 140000, median: 100000, employment: 8900, demandLevel: "high" },
      TX: { min: 65000, max: 130000, median: 90000, employment: 6800, demandLevel: "high" },
      WA: { min: 75000, max: 150000, median: 108000, employment: 5200, demandLevel: "very_high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "34",
    title: "Robotics Technician",
    category: "technology",
    description: "Build, install, test, and maintain robotic systems used in manufacturing, healthcare, logistics, and other industries.",
    salaryMin: 45000,
    salaryMax: 90000,
    salaryMedian: 61000,
    educationRequired: "Associate's Degree or Technical Certificate",
    yearsExperience: "0-3 years",
    growthRate: "+11%",
    skills: ["Robotics Systems", "PLC Programming", "Electrical Systems", "Mechanical Skills", "Troubleshooting"],
    relatedCareers: ["Industrial Engineer", "Automation Technician", "Mechatronics Engineer"],
    pathways: [
      { type: "trade", description: "Complete robotics or mechatronics technology program.", duration: "2 years", cost: "$10,000-$30,000" },
      { type: "certification", description: "Earn robotics certifications (FANUC, ABB, or universal robotics).", duration: "6-12 months", cost: "$3,000-$10,000" },
      { type: "military", description: "Train in military electronics or robotics systems.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 50,
      know: 70,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Mechanically gifted innovator who loves building and programming machines of the future"
    },
    blsCode: "17-3024",
    blsOohGroup: "architecture-and-engineering",
    naicsCode: "31-33",
    jobOutlook: "faster_than_average",
    projectedGrowth: 11,
    projectedOpenings: 8200,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Join robotics clubs (FIRST, VEX), learn basic programming, build simple robots",
      high_school: "Compete in robotics competitions, take electronics courses, learn Arduino/Raspberry Pi",
      post_secondary: "Complete robotics technology program, earn industry certifications, gain manufacturing experience"
    },
    workEnvironment: "Manufacturing plants, warehouses, labs. Hands-on work with advanced equipment.",
    typicalEntryEducation: "Associate's degree",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      MI: { min: 50000, max: 88000, median: 65000, employment: 4200, demandLevel: "very_high" },
      OH: { min: 48000, max: 82000, median: 60000, employment: 3800, demandLevel: "high" },
      TX: { min: 48000, max: 85000, median: 62000, employment: 3200, demandLevel: "high" },
      CA: { min: 55000, max: 95000, median: 72000, employment: 2800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "35",
    title: "Sustainability Analyst",
    category: "science",
    description: "Help organizations reduce their environmental impact by analyzing data, developing sustainability strategies, and ensuring regulatory compliance.",
    salaryMin: 55000,
    salaryMax: 110000,
    salaryMedian: 76480,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+8%",
    skills: ["Environmental Analysis", "Data Analytics", "ESG Reporting", "Project Management", "Communication"],
    relatedCareers: ["Environmental Scientist", "Climate Data Scientist", "Energy Auditor"],
    pathways: [
      { type: "college", description: "Earn a degree in Environmental Science, Sustainability, or related field.", duration: "4 years", cost: "$40,000-$180,000" },
      { type: "certification", description: "Earn sustainability certifications (LEED AP, ISSP, GRI).", duration: "3-6 months", cost: "$2,000-$8,000" },
    ],
    bkdAlignment: {
      be: 80,
      know: 80,
      do: 75,
      primaryPillar: "be",
      careerPersonality: "Purpose-driven analyst who combines environmental passion with business acumen to create lasting change"
    },
    blsCode: "19-2041",
    blsOohGroup: "life-physical-and-social-science",
    naicsCode: "54",
    jobOutlook: "faster_than_average",
    projectedGrowth: 8,
    projectedOpenings: 7200,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Join environmental clubs, study science and data analysis, volunteer for conservation",
      post_secondary: "Major in environmental science or sustainability, intern at green companies, earn certifications"
    },
    workEnvironment: "Office, field work, or remote. Cross-functional collaboration with corporate teams.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      CA: { min: 65000, max: 125000, median: 90000, employment: 4800, demandLevel: "very_high" },
      NY: { min: 60000, max: 115000, median: 85000, employment: 3200, demandLevel: "high" },
      TX: { min: 55000, max: 100000, median: 75000, employment: 2800, demandLevel: "moderate" },
      WA: { min: 62000, max: 118000, median: 88000, employment: 2100, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "36",
    title: "Biotech Research Associate",
    category: "science",
    description: "Conduct laboratory research in biotechnology, genetics, pharmaceuticals, or agriculture to develop new treatments, products, and innovations.",
    salaryMin: 50000,
    salaryMax: 95000,
    salaryMedian: 64000,
    educationRequired: "Bachelor's Degree in Biology/Biochemistry",
    yearsExperience: "0-3 years",
    growthRate: "+10%",
    skills: ["Laboratory Techniques", "Molecular Biology", "Data Analysis", "Scientific Writing", "Quality Control"],
    relatedCareers: ["Biochemist", "Medical Scientist", "Microbiologist"],
    pathways: [
      { type: "college", description: "Earn a degree in Biology, Biochemistry, or Biotechnology.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Earn lab certifications and gain research experience through internships.", duration: "1-2 years", cost: "$5,000-$15,000" },
    ],
    bkdAlignment: {
      be: 60,
      know: 90,
      do: 80,
      primaryPillar: "know",
      careerPersonality: "Curious scientist driven by discovery and the potential to improve human health and food systems"
    },
    blsCode: "19-1029",
    blsOohGroup: "life-physical-and-social-science",
    naicsCode: "54",
    jobOutlook: "faster_than_average",
    projectedGrowth: 10,
    projectedOpenings: 5800,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Excel in biology and chemistry, participate in science fairs, explore genetic concepts",
      post_secondary: "Major in biology/biochemistry, gain lab research experience, pursue grad school or industry internships"
    },
    workEnvironment: "Laboratories and research facilities. Precise, detail-oriented work with specialized equipment.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      CA: { min: 60000, max: 105000, median: 78000, employment: 18200, demandLevel: "very_high" },
      MA: { min: 58000, max: 100000, median: 75000, employment: 12400, demandLevel: "very_high" },
      NJ: { min: 55000, max: 95000, median: 72000, employment: 8100, demandLevel: "high" },
      TX: { min: 50000, max: 88000, median: 65000, employment: 6400, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "37",
    title: "Drone Pilot / Remote Sensing Technician",
    category: "technology",
    description: "Operate unmanned aerial vehicles (drones) for surveying, inspection, agriculture, photography, emergency response, and infrastructure monitoring.",
    salaryMin: 40000,
    salaryMax: 95000,
    salaryMedian: 58000,
    educationRequired: "FAA Part 107 License + Training",
    yearsExperience: "0-2 years",
    growthRate: "+30%",
    skills: ["Drone Operation", "GIS/Mapping", "Photography", "Data Analysis", "FAA Regulations"],
    relatedCareers: ["Surveyor", "Aerial Photographer", "GIS Specialist"],
    pathways: [
      { type: "certification", description: "Earn FAA Part 107 Remote Pilot Certificate and specialized drone training.", duration: "1-3 months", cost: "$500-$3,000" },
      { type: "trade", description: "Complete drone technology program with GIS and mapping specialization.", duration: "6-12 months", cost: "$5,000-$15,000" },
      { type: "military", description: "Gain UAV experience in military drone operations.", duration: "4+ years", cost: "Free + Benefits" },
    ],
    bkdAlignment: {
      be: 55,
      know: 65,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Tech-savvy pilot who loves combining flying technology with real-world problem solving"
    },
    blsCode: "53-6051",
    blsOohGroup: "transportation-and-material-moving",
    naicsCode: "54",
    jobOutlook: "much_faster",
    projectedGrowth: 30,
    projectedOpenings: 8500,
    demandLevel: "high",
    appropriateGrades: ["middle_school", "high_school", "post_secondary"],
    entryPointsForGrades: {
      middle_school: "Join drone clubs, learn basic programming and photography, explore aviation concepts",
      high_school: "Get hands-on with drone flying, study for FAA Part 107, learn GIS and mapping software",
      post_secondary: "Earn FAA certification, specialize in industry application (agriculture, construction, inspection)"
    },
    workEnvironment: "Outdoor field work with some office analysis time. Variable locations and conditions.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      TX: { min: 42000, max: 90000, median: 58000, employment: 3200, demandLevel: "high" },
      CA: { min: 50000, max: 105000, median: 68000, employment: 4100, demandLevel: "high" },
      FL: { min: 40000, max: 85000, median: 55000, employment: 2800, demandLevel: "moderate" },
      CO: { min: 45000, max: 92000, median: 62000, employment: 1800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "38",
    title: "Health Informatics Specialist",
    category: "healthcare",
    description: "Bridge healthcare and technology by managing health data systems, electronic health records, and clinical data analytics to improve patient outcomes.",
    salaryMin: 60000,
    salaryMax: 120000,
    salaryMedian: 62800,
    educationRequired: "Bachelor's or Master's Degree",
    yearsExperience: "0-3 years",
    growthRate: "+16%",
    skills: ["Health Data Systems", "EHR Management", "Data Analytics", "HIPAA Compliance", "Clinical Workflows"],
    relatedCareers: ["Data Analyst", "Health IT Specialist", "Clinical Informatics Manager"],
    pathways: [
      { type: "college", description: "Earn a degree in Health Informatics, Health IT, or related field.", duration: "4-6 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Earn health informatics certifications (RHIA, CAHIMS, CPHIMS).", duration: "6-12 months", cost: "$5,000-$15,000" },
    ],
    bkdAlignment: {
      be: 65,
      know: 85,
      do: 75,
      primaryPillar: "know",
      careerPersonality: "Analytical bridge-builder who connects healthcare knowledge with technology to save lives through data"
    },
    blsCode: "15-1211",
    blsOohGroup: "computer-and-information-technology",
    naicsCode: "62",
    jobOutlook: "much_faster",
    projectedGrowth: 16,
    projectedOpenings: 9800,
    demandLevel: "high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Take health science and computer courses, learn about health data, volunteer in healthcare",
      post_secondary: "Major in health informatics or health IT, gain clinical data experience, earn certifications"
    },
    workEnvironment: "Hospitals, health systems, insurance companies. Office-based with regular hours.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      TX: { min: 62000, max: 115000, median: 82000, employment: 4800, demandLevel: "high" },
      CA: { min: 72000, max: 135000, median: 98000, employment: 6200, demandLevel: "high" },
      NY: { min: 68000, max: 125000, median: 92000, employment: 4100, demandLevel: "moderate" },
      FL: { min: 58000, max: 108000, median: 78000, employment: 3500, demandLevel: "moderate" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "39",
    title: "EV / Battery Technician",
    category: "trades",
    description: "Service, diagnose, and repair electric vehicles and battery systems. Work with high-voltage systems, charging infrastructure, and EV powertrains.",
    salaryMin: 40000,
    salaryMax: 85000,
    salaryMedian: 56000,
    educationRequired: "Technical Certificate or Associate's",
    yearsExperience: "0-2 years",
    growthRate: "+25%",
    skills: ["EV Systems", "High-Voltage Safety", "Battery Technology", "Diagnostics", "Electrical Systems"],
    relatedCareers: ["Automotive Technician", "Electrician", "Solar Installer"],
    pathways: [
      { type: "trade", description: "Complete EV technology program at a trade school.", duration: "6-12 months", cost: "$5,000-$15,000" },
      { type: "certification", description: "Earn EV manufacturer certifications (Tesla, Ford, GM) and ASE xEV.", duration: "3-6 months", cost: "$2,000-$8,000" },
    ],
    bkdAlignment: {
      be: 55,
      know: 65,
      do: 90,
      primaryPillar: "do",
      careerPersonality: "Forward-thinking technician passionate about clean energy and the future of transportation"
    },
    blsCode: "49-3023",
    blsOohGroup: "installation-maintenance-and-repair",
    naicsCode: "81",
    jobOutlook: "much_faster",
    projectedGrowth: 25,
    projectedOpenings: 12400,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Study electronics and physics, learn about EV technology, take auto tech courses",
      post_secondary: "Complete EV technician program, earn manufacturer certifications, gain dealership experience"
    },
    workEnvironment: "EV dealerships, charging stations, fleet garages. Clean-tech shop environments.",
    typicalEntryEducation: "Postsecondary nondegree award",
    onTheJobTraining: "Moderate-term on-the-job training",
    stateSalaryData: {
      CA: { min: 50000, max: 95000, median: 68000, employment: 8200, demandLevel: "very_high" },
      TX: { min: 42000, max: 82000, median: 58000, employment: 4800, demandLevel: "high" },
      MI: { min: 45000, max: 85000, median: 62000, employment: 3200, demandLevel: "very_high" },
      FL: { min: 40000, max: 78000, median: 55000, employment: 3800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  },
  {
    id: "40",
    title: "Product Manager",
    category: "business",
    description: "Lead the strategy, development, and launch of products. Define product vision, prioritize features, and work with engineering, design, and marketing teams.",
    salaryMin: 80000,
    salaryMax: 180000,
    salaryMedian: 131000,
    educationRequired: "Bachelor's Degree",
    yearsExperience: "2-5 years",
    growthRate: "+10%",
    skills: ["Product Strategy", "User Research", "Data Analysis", "Cross-Team Leadership", "Agile/Scrum"],
    relatedCareers: ["UX/UI Designer", "Marketing Manager", "Software Developer"],
    pathways: [
      { type: "college", description: "Earn a degree in Business, Computer Science, or Engineering.", duration: "4 years", cost: "$40,000-$200,000" },
      { type: "certification", description: "Complete product management bootcamp and build a product portfolio.", duration: "3-6 months", cost: "$5,000-$15,000" },
    ],
    bkdAlignment: {
      be: 70,
      know: 80,
      do: 85,
      primaryPillar: "do",
      careerPersonality: "Strategic leader who thrives at the intersection of technology, business, and user needs"
    },
    blsCode: "11-2021",
    blsOohGroup: "management",
    naicsCode: "51",
    jobOutlook: "faster_than_average",
    projectedGrowth: 10,
    projectedOpenings: 18200,
    demandLevel: "very_high",
    appropriateGrades: ["high_school", "post_secondary"],
    entryPointsForGrades: {
      high_school: "Build small projects (apps, websites), join FBLA/DECA, develop leadership and analytical skills",
      post_secondary: "Study business or CS, gain experience in tech companies, build case studies and product sense"
    },
    workEnvironment: "Office or remote. Highly collaborative, fast-paced product teams.",
    typicalEntryEducation: "Bachelor's degree",
    onTheJobTraining: "None",
    stateSalaryData: {
      CA: { min: 110000, max: 200000, median: 155000, employment: 18400, demandLevel: "very_high" },
      WA: { min: 100000, max: 190000, median: 148000, employment: 8200, demandLevel: "very_high" },
      NY: { min: 95000, max: 180000, median: 140000, employment: 12100, demandLevel: "high" },
      TX: { min: 85000, max: 165000, median: 125000, employment: 8800, demandLevel: "high" }
    },
    blsLastUpdated: "2024-09"
  }
];

// Merge in the full BLS/O*NET-generated occupation list (~800 careers).
// Dedupe by SOC code so the curated entries above (whose stable ids are
// referenced by saved_careers) always win and are never duplicated.
{
  const existingBls = new Set(seedCareers.map((c) => c.blsCode).filter(Boolean));
  const existingTitles = new Set(seedCareers.map((c) => c.title.toLowerCase()));
  seedCareers.push(
    ...generatedCareers.filter(
      (c) => !existingBls.has(c.blsCode) && !existingTitles.has(c.title.toLowerCase()),
    ),
  );
}

export const seedResources: Resource[] = [
  {
    id: "1",
    title: "Gates Scholarship",
    description: "Full scholarship for outstanding minority high school seniors with significant financial need.",
    type: "scholarship",
    category: "financial",
    url: "https://www.thegatesscholarship.org/",
    amount: 100000,
    deadline: "2025-09-15",
    eligibility: ["High school senior", "Pell Grant eligible", "GPA 3.3+"],
    tags: ["Full Ride", "Minorities", "High School Seniors"],
  },
  {
    id: "2",
    title: "Dell Scholars Program",
    description: "Scholarship for students who demonstrate grit and ambition to succeed despite challenges.",
    type: "scholarship",
    category: "financial",
    url: "https://www.dellscholars.org/",
    amount: 20000,
    deadline: "2025-12-01",
    eligibility: ["High school senior", "Pell Grant eligible", "GPA 2.4+"],
    tags: ["Underserved", "First Generation", "College Prep"],
  },
  {
    id: "3",
    title: "Coca-Cola Scholars Program",
    description: "Achievement-based scholarship for high school seniors who demonstrate leadership and service.",
    type: "scholarship",
    category: "financial",
    url: "https://www.coca-colascholarsfoundation.org/apply/",
    amount: 20000,
    deadline: "2025-10-31",
    eligibility: ["High school senior", "US Citizen", "GPA 3.0+"],
    tags: ["Leadership", "Community Service", "Achievement"],
  },
  {
    id: "11",
    title: "Jack Kent Cooke Foundation",
    description: "College scholarship for high-achieving students with financial need to attend the nation's top colleges.",
    type: "scholarship",
    category: "financial",
    url: "https://www.jkcf.org/our-scholarships/",
    amount: 55000,
    deadline: "2025-11-18",
    eligibility: ["High school senior", "GPA 3.5+", "Financial need", "Top 15% of class"],
    tags: ["High Achievers", "Financial Need", "Full Ride"],
  },
  {
    id: "12",
    title: "Questbridge National College Match",
    description: "Program that connects high-achieving, low-income students with full scholarships to top colleges.",
    type: "scholarship",
    category: "financial",
    url: "https://www.questbridge.org/high-school-students/national-college-match",
    amount: 200000,
    deadline: "2025-09-26",
    eligibility: ["High school senior", "Low income", "Strong academics"],
    tags: ["Full Ride", "Low Income", "Top Colleges"],
  },
  {
    id: "13",
    title: "Ron Brown Scholar Program",
    description: "Scholarship for African American high school seniors who excel academically and are committed to public service.",
    type: "scholarship",
    category: "financial",
    url: "https://www.ronbrown.org/apply",
    amount: 40000,
    deadline: "2025-11-01",
    eligibility: ["African American", "High school senior", "Community leadership"],
    tags: ["African American", "Leadership", "Public Service"],
  },
  {
    id: "14",
    title: "Hispanic Scholarship Fund",
    description: "Scholarships for Hispanic students pursuing higher education across all disciplines.",
    type: "scholarship",
    category: "financial",
    url: "https://www.hsf.net/scholarship",
    amount: 5000,
    deadline: "2025-02-15",
    eligibility: ["Hispanic heritage", "US Citizen or eligible non-citizen", "GPA 3.0+"],
    tags: ["Hispanic", "Higher Education", "All Majors"],
  },
  {
    id: "15",
    title: "Cameron Impact Scholarship",
    description: "Four-year scholarship for students who demonstrate leadership and commitment to making a positive impact.",
    type: "scholarship",
    category: "financial",
    url: "https://www.bryancameroneducationfoundation.org/cameron-impact-scholarship",
    amount: 100000,
    deadline: "2025-09-13",
    eligibility: ["High school senior", "GPA 3.7+", "Leadership experience"],
    tags: ["Full Ride", "Leadership", "Impact"],
  },
  {
    id: "100",
    title: "Elks Most Valuable Student",
    description: "Scholarship program for high school seniors based on scholarship, leadership, and financial need.",
    type: "scholarship",
    category: "financial",
    url: "https://www.elks.org/scholars/scholarships/mvs.cfm",
    amount: 50000,
    deadline: "2026-11-05",
    eligibility: ["High school senior", "US Citizen", "Financial need"],
    tags: ["High School", "Leadership", "Financial Need"],
  },
  {
    id: "101",
    title: "GE-Reagan Foundation Scholarship",
    description: "Scholarship honoring the legacy of President Reagan by supporting students who demonstrate leadership, drive, integrity, and citizenship.",
    type: "scholarship",
    category: "financial",
    url: "https://www.reaganfoundation.org/education/scholarship-programs/ge-reagan-foundation-scholarship-program/",
    amount: 10000,
    deadline: "2026-01-05",
    eligibility: ["High school senior", "US Citizen or permanent resident", "GPA 3.0+"],
    tags: ["High School", "Leadership", "Citizenship"],
  },
  {
    id: "102",
    title: "Burger King Scholars Program",
    description: "Scholarship program for Burger King employees and their families, as well as high school seniors in the community.",
    type: "scholarship",
    category: "financial",
    url: "https://www.bkscholars.org/",
    amount: 50000,
    deadline: "2026-12-15",
    eligibility: ["High school senior", "GPA 2.5+", "Work experience preferred"],
    tags: ["High School", "Community", "Work Experience"],
  },
  {
    id: "103",
    title: "Equitable Excellence Scholarship",
    description: "Scholarship from Equitable Foundation for high school seniors demonstrating academic achievement and community involvement.",
    type: "scholarship",
    category: "financial",
    url: "https://equitablefoundation.org/excellence-scholarship/",
    amount: 5000,
    deadline: "2026-12-01",
    eligibility: ["High school senior", "GPA 3.0+", "US Citizen or permanent resident"],
    tags: ["High School", "Community Service", "Achievement"],
  },
  {
    id: "104",
    title: "Foot Locker Scholar Athletes",
    description: "Scholarship for student athletes who demonstrate community service, financial need, and academic excellence.",
    type: "scholarship",
    category: "financial",
    url: "https://www.footlockerscholarathletes.com/",
    amount: 20000,
    deadline: "2026-12-15",
    eligibility: ["High school senior", "Student athlete", "GPA 3.0+", "Financial need"],
    tags: ["High School", "Athletics", "Community Service"],
  },
  {
    id: "105",
    title: "Amazon Future Engineer Scholarship",
    description: "Scholarship for students from underserved communities pursuing computer science degrees.",
    type: "scholarship",
    category: "financial",
    url: "https://www.amazonfutureengineer.com/scholarships",
    amount: 40000,
    deadline: "2026-01-15",
    eligibility: ["High school senior", "Financial need", "Pursuing computer science"],
    tags: ["High School", "STEM", "Computer Science", "Underserved"],
  },
  {
    id: "106",
    title: "Davidson Fellows Scholarship",
    description: "Scholarship for exceptional young people, 18 and under, who have completed college-level work.",
    type: "scholarship",
    category: "financial",
    url: "https://www.davidsongifted.org/gifted-programs/fellows-scholarship/",
    amount: 50000,
    deadline: "2026-02-14",
    eligibility: ["Age 18 or under", "Significant project completion", "US Citizen or permanent resident"],
    tags: ["High School", "Gifted", "STEM", "Humanities"],
  },
  {
    id: "107",
    title: "The Coolidge Scholarship",
    description: "Full scholarship named after President Calvin Coolidge for pre-collegiate students who demonstrate intellectual curiosity.",
    type: "scholarship",
    category: "financial",
    url: "https://coolidgescholars.org/",
    amount: 300000,
    deadline: "2026-02-01",
    eligibility: ["High school junior", "US Citizen", "Strong academics"],
    tags: ["High School", "Full Ride", "Leadership", "Intellectual Merit"],
  },
  {
    id: "108",
    title: "Bill of Rights Institute Essay Contest",
    description: "Essay scholarship contest exploring the principles of liberty and the Founding era for high school students.",
    type: "scholarship",
    category: "financial",
    url: "https://billofrightsinstitute.org/contest",
    amount: 5000,
    deadline: "2026-01-31",
    eligibility: ["High school student", "US resident"],
    tags: ["High School", "Essay", "Civics", "History"],
  },
  {
    id: "109",
    title: "FFA Scholarships",
    description: "Range of scholarships for FFA members pursuing agriculture and related fields.",
    type: "scholarship",
    category: "financial",
    url: "https://www.ffa.org/participate/grants-and-scholarships/scholarships/",
    amount: 22000,
    deadline: "2026-02-01",
    eligibility: ["FFA member", "High school senior or college student", "Agriculture focus"],
    tags: ["High School", "Agriculture", "FFA"],
  },
  {
    id: "110",
    title: "AKTIV Learning Scholarship",
    description: "Scholarship for students demonstrating a commitment to active learning and academic excellence.",
    type: "scholarship",
    category: "financial",
    url: "https://aktiv.com/scholarship",
    amount: 1000,
    deadline: "2026-06-30",
    eligibility: ["High school senior or college student", "GPA 3.0+"],
    tags: ["High School", "Academic Excellence", "Active Learning"],
  },
  {
    id: "111",
    title: "Mary Kay Ash Foundation Scholarship",
    description: "Scholarship supporting women pursuing higher education and those affected by domestic violence or cancers.",
    type: "scholarship",
    category: "financial",
    url: "https://www.marykayfoundation.org/",
    amount: 5000,
    deadline: "2026-03-31",
    eligibility: ["Female student", "Financial need", "Academic achievement"],
    tags: ["High School", "Women", "Financial Need"],
  },
  {
    id: "112",
    title: "HEAV Scholarships",
    description: "Home Educators Association of Virginia scholarships for homeschool graduates in Virginia.",
    type: "scholarship",
    category: "financial",
    url: "https://heav.org/",
    amount: 1000,
    deadline: "2026-04-15",
    eligibility: ["Virginia resident", "Homeschool graduate", "College-bound"],
    tags: ["High School", "Homeschool", "Virginia"],
  },
  {
    id: "113",
    title: "Local Homeschool Association Scholarship",
    description: "Scholarships offered by local homeschool associations for graduating homeschool students pursuing higher education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.hslda.org/",
    amount: 500,
    deadline: "2026-05-01",
    eligibility: ["Homeschool graduate", "College-bound"],
    tags: ["High School", "Homeschool", "Local"],
  },
  {
    id: "114",
    title: "James Beard Foundation Scholarship",
    description: "Scholarships for aspiring food and beverage professionals, including culinary students.",
    type: "scholarship",
    category: "financial",
    url: "https://www.jamesbeard.org/scholarships",
    amount: 20000,
    deadline: "2026-05-15",
    eligibility: ["Pursuing culinary or food studies", "US Citizen or permanent resident"],
    tags: ["High School", "Culinary Arts", "Food Industry"],
  },
  {
    id: "115",
    title: "American Legion Oratorical Contest",
    description: "Scholarship contest for high school students demonstrating knowledge of the U.S. Constitution through public speaking.",
    type: "scholarship",
    category: "financial",
    url: "https://www.legion.org/oratorical",
    amount: 25000,
    deadline: "2026-01-31",
    eligibility: ["High school student", "US Citizen", "Under 20 years old"],
    tags: ["High School", "Public Speaking", "Civics", "Constitution"],
  },
  {
    id: "116",
    title: "Christian Connector Homeschool Scholarship",
    description: "Scholarship for Christian homeschool students connecting them with college opportunities.",
    type: "scholarship",
    category: "financial",
    url: "https://www.christianconnector.com/",
    amount: 1000,
    deadline: "2026-06-30",
    eligibility: ["Homeschool student", "Christian faith", "College-bound"],
    tags: ["High School", "Homeschool", "Christian", "Faith-Based"],
  },
  {
    id: "117",
    title: "Gen and Kelly Tanabe Scholarship",
    description: "Merit scholarship open to all students from 9th grade through college and beyond, with no restrictions on major.",
    type: "scholarship",
    category: "financial",
    url: "https://www.genkellyscholarship.com/",
    amount: 1000,
    deadline: "2026-07-31",
    eligibility: ["9th grade through graduate school", "US Citizen or permanent resident"],
    tags: ["High School", "Homeschool", "Merit", "All Majors"],
  },
  {
    id: "118",
    title: "National Merit Scholarship",
    description: "Scholarship program for academically talented high school students based on PSAT/NMSQT scores.",
    type: "scholarship",
    category: "financial",
    url: "https://www.nationalmerit.org/",
    amount: 2500,
    deadline: "2026-10-01",
    eligibility: ["High school junior", "US Citizen", "High PSAT score"],
    tags: ["High School", "Merit", "PSAT", "Academic Excellence"],
  },
  {
    id: "119",
    title: "Apologia National Scholarship",
    description: "Scholarship for homeschool students who have used Apologia curriculum and are pursuing higher education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.apologia.com/scholarship/",
    amount: 2000,
    deadline: "2026-04-01",
    eligibility: ["Homeschool student", "Apologia curriculum user", "College-bound"],
    tags: ["High School", "Homeschool", "Christian", "Science"],
  },
  {
    id: "120",
    title: "University of St. Thomas Homeschool Grant",
    description: "Financial grant for homeschool graduates admitted to the University of St. Thomas.",
    type: "scholarship",
    category: "financial",
    url: "https://www.stthomas.edu/",
    amount: 15000,
    deadline: "2026-02-01",
    eligibility: ["Homeschool graduate", "Admitted to St. Thomas", "Minnesota resident preferred"],
    tags: ["High School", "Homeschool", "Catholic", "Grant"],
  },
  {
    id: "121",
    title: "Liberty University Homeschool Advantage",
    description: "Scholarship advantage for homeschool graduates applying to Liberty University.",
    type: "scholarship",
    category: "financial",
    url: "https://www.liberty.edu/financial-aid/scholarships/",
    amount: 5000,
    deadline: "2026-12-31",
    eligibility: ["Homeschool graduate", "Applying to Liberty University"],
    tags: ["High School", "Homeschool", "Christian", "Liberty University"],
  },
  {
    id: "122",
    title: "Patrick Henry College (PHC) Scholarship",
    description: "Scholarship for homeschool graduates attending Patrick Henry College, focusing on liberty and faith-based education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.phc.edu/admissions-financial-aid",
    amount: 10000,
    deadline: "2026-01-15",
    eligibility: ["Homeschool graduate", "Strong Christian faith", "Academic merit"],
    tags: ["High School", "Homeschool", "Christian", "Faith-Based"],
  },
  {
    id: "123",
    title: "HSLDA Compassion Scholarships",
    description: "Scholarships from the Home School Legal Defense Association for homeschool graduates with special circumstances or financial hardship.",
    type: "scholarship",
    category: "financial",
    url: "https://hslda.org/scholarship",
    amount: 1500,
    deadline: "2026-04-30",
    eligibility: ["Homeschool graduate", "Financial need", "Special circumstances"],
    tags: ["High School", "Homeschool", "Financial Need", "HSLDA"],
  },
  {
    id: "200",
    title: "Doodle 4 Google",
    description: "Annual competition for K-12 students in the US to create their own Google Doodle on a given theme.",
    type: "scholarship",
    category: "financial",
    url: "https://doodles.google.com/d4g/",
    amount: 30000,
    deadline: "2026-03-01",
    eligibility: ["K-12 student", "US resident"],
    tags: ["K-12", "Art", "Creativity", "Competition"],
  },
  {
    id: "201",
    title: "Young Scholars Program (JKCF)",
    description: "Jack Kent Cooke Foundation program for high-achieving 8th graders with financial need.",
    type: "scholarship",
    category: "financial",
    url: "https://www.jkcf.org/our-scholarships/young-scholars-program/",
    amount: 45000,
    deadline: "2026-04-01",
    eligibility: ["8th grade student", "GPA 3.5+", "Financial need"],
    tags: ["K-12", "Middle School", "High Achievers", "Financial Need"],
  },
  {
    id: "202",
    title: "National WWII Museum Essay Contest",
    description: "Essay contest for K-12 students exploring themes and events of World War II.",
    type: "scholarship",
    category: "financial",
    url: "https://www.nationalww2museum.org/students-teachers/student-resources/essay-contest",
    amount: 1000,
    deadline: "2026-01-17",
    eligibility: ["K-12 student", "US resident"],
    tags: ["K-12", "Essay", "History", "WWII"],
  },
  {
    id: "203",
    title: "FIRST Robotics STEM Scholarship",
    description: "Scholarships for students who participate in FIRST Robotics competitions, rewarding STEM excellence.",
    type: "scholarship",
    category: "financial",
    url: "https://www.firstinspires.org/alumni/scholarships",
    amount: 10000,
    deadline: "2026-02-28",
    eligibility: ["FIRST Robotics participant", "High school senior"],
    tags: ["K-12", "STEM", "Robotics", "Engineering"],
  },
  {
    id: "204",
    title: "Scholastic Art & Writing Awards",
    description: "National recognition and scholarship program for creative teens in grades 7-12.",
    type: "scholarship",
    category: "financial",
    url: "https://www.artandwriting.org/",
    amount: 10000,
    deadline: "2026-01-15",
    eligibility: ["Grades 7-12", "US student"],
    tags: ["K-12", "Art", "Writing", "Creative Arts"],
  },
  {
    id: "205",
    title: "VFW Voice of Democracy",
    description: "Audio-essay scholarship program for high school students on an annual patriotic theme.",
    type: "scholarship",
    category: "financial",
    url: "https://www.vfw.org/community/youth-and-education/youth-scholarships",
    amount: 30000,
    deadline: "2026-10-31",
    eligibility: ["High school 9th-12th grade", "US Citizen"],
    tags: ["K-12", "Essay", "Patriotism", "Audio"],
  },
  {
    id: "206",
    title: "Google Science Fair",
    description: "Global online science and technology competition for students ages 13-18.",
    type: "scholarship",
    category: "financial",
    url: "https://sciencefair.withgoogle.com/",
    amount: 50000,
    deadline: "2026-05-01",
    eligibility: ["Ages 13-18", "International students eligible"],
    tags: ["K-12", "STEM", "Science", "Technology", "Global"],
  },
  {
    id: "207",
    title: "VFW Patriot's Pen",
    description: "Youth essay contest for students in grades 6-8 on an annual patriotic theme.",
    type: "scholarship",
    category: "financial",
    url: "https://www.vfw.org/community/youth-and-education/youth-scholarships",
    amount: 5000,
    deadline: "2026-10-31",
    eligibility: ["Grades 6-8", "US Citizen"],
    tags: ["K-12", "Essay", "Patriotism", "Middle School"],
  },
  {
    id: "208",
    title: "Science Without Borders Challenge",
    description: "International art and video challenge for students aged 11-19 focused on ocean conservation.",
    type: "scholarship",
    category: "financial",
    url: "https://www.biosphere.org/science-without-borders-challenge/",
    amount: 500,
    deadline: "2026-03-15",
    eligibility: ["Ages 11-19", "International students eligible"],
    tags: ["K-12", "Science", "Environment", "Ocean Conservation", "Art"],
  },
  {
    id: "209",
    title: "JFK Profile in Courage Essay Contest",
    description: "National essay contest for high school students on the theme of political courage.",
    type: "scholarship",
    category: "financial",
    url: "https://www.jfklibrary.org/learn/education/profile-in-courage-essay-contest",
    amount: 10000,
    deadline: "2027-01-06",
    eligibility: ["High school student", "US resident"],
    tags: ["K-12", "Essay", "History", "Civics", "Political Science"],
  },
  {
    id: "210",
    title: "Young American Creative Patriotic Art Contest",
    description: "Art contest for high school students sponsored by Ladies Auxiliary VFW.",
    type: "scholarship",
    category: "financial",
    url: "https://ladiesauxvfw.org/programs-and-contests/",
    amount: 5000,
    deadline: "2026-03-31",
    eligibility: ["Grades 9-12", "US Citizen"],
    tags: ["K-12", "Art", "Patriotism", "Creative Arts"],
  },
  {
    id: "211",
    title: "Courage in Student Journalism Awards",
    description: "Recognition and scholarship for K-12 student journalists who demonstrate courage in reporting.",
    type: "scholarship",
    category: "financial",
    url: "https://splc.org/",
    amount: 1000,
    deadline: "2026-04-01",
    eligibility: ["K-12 student journalist"],
    tags: ["K-12", "Journalism", "Media", "Writing"],
  },
  {
    id: "212",
    title: "Gloria Barron Prize for Young Heroes",
    description: "Annual award for outstanding young leaders who have made a significant positive difference in people and the environment.",
    type: "scholarship",
    category: "financial",
    url: "https://barronprize.org/",
    amount: 10000,
    deadline: "2026-04-15",
    eligibility: ["Ages 8-18", "US or Canadian resident"],
    tags: ["K-12", "Leadership", "Community Service", "Environment"],
  },
  {
    id: "213",
    title: "Invention Convention U.S. Nationals",
    description: "National competition where K-12 inventors showcase original inventions solving real-world problems.",
    type: "scholarship",
    category: "financial",
    url: "https://inventionconvention.com/nationalcompetition/",
    amount: 5000,
    deadline: "2026-03-01",
    eligibility: ["K-12 student", "US resident", "Original invention required"],
    tags: ["K-12", "STEM", "Invention", "Innovation"],
  },
  {
    id: "214",
    title: "The Paradigm Challenge",
    description: "Annual competition by Project Paradigm for K-12 students to solve real-world problems using kindness, creativity, and collaboration.",
    type: "scholarship",
    category: "financial",
    url: "https://www.projectparadigm.org/",
    amount: 100000,
    deadline: "2026-04-30",
    eligibility: ["K-12 student", "International students eligible"],
    tags: ["K-12", "Problem Solving", "Innovation", "Collaboration"],
  },
  {
    id: "300",
    title: "Jeannette Rankin National Scholar Grant",
    description: "Grant for low-income women 35 years and older who are pursuing a technical or vocational education or an undergraduate degree.",
    type: "scholarship",
    category: "financial",
    url: "https://www.rankinfoundation.org/students/applying/",
    amount: 2000,
    deadline: "2026-03-01",
    eligibility: ["Women 35+", "Low income", "Pursuing technical, vocational, or undergraduate degree"],
    tags: ["Non-Traditional", "Women", "Adult Learner", "Financial Need"],
  },
  {
    id: "301",
    title: "KFC Foundation Scholarships",
    description: "Scholarships for KFC restaurant employees pursuing higher education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.kfcfoundation.org/rise/",
    amount: 5000,
    deadline: "2026-02-10",
    eligibility: ["KFC employee", "US Citizen or permanent resident", "Enrolled in accredited school"],
    tags: ["Non-Traditional", "Employee", "Working Adult"],
  },
  {
    id: "302",
    title: "Ability Center of Greater Toledo Scholarship",
    description: "Scholarship for students with disabilities in the greater Toledo area pursuing postsecondary education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.abilitycenter.org/",
    amount: 1000,
    deadline: "2026-04-01",
    eligibility: ["Student with disability", "Greater Toledo area resident", "Postsecondary education"],
    tags: ["Non-Traditional", "Disability", "Ohio"],
  },
  {
    id: "303",
    title: "ASIST Scholarship",
    description: "Scholarship for non-traditional and returning adult students seeking workforce skills and higher education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.asist.org/",
    amount: 2000,
    deadline: "2026-05-01",
    eligibility: ["Non-traditional student", "Returning adult learner", "Financial need"],
    tags: ["Non-Traditional", "Adult Learner", "Workforce Development"],
  },
  {
    id: "304",
    title: "Patsy Takemoto Mink Education Foundation",
    description: "Scholarship for low-income women with children who are pursuing education or training.",
    type: "scholarship",
    category: "financial",
    url: "https://www.patsyminkfoundation.org/",
    amount: 5000,
    deadline: "2026-01-31",
    eligibility: ["Women with children", "Low income", "Pursuing education or training"],
    tags: ["Non-Traditional", "Women", "Parent", "Financial Need"],
  },
  {
    id: "305",
    title: "American Legion Auxiliary Non-Traditional Student Scholarship",
    description: "Scholarship for non-traditional students who are dependents of veterans and returning to school after a break.",
    type: "scholarship",
    category: "financial",
    url: "https://www.alaforveterans.org/scholarships/non-traditional-student-scholarship/",
    amount: 2000,
    deadline: "2026-04-01",
    eligibility: ["Non-traditional student", "Veteran dependent", "Returning to school"],
    tags: ["Non-Traditional", "Veteran", "Adult Learner"],
  },
  {
    id: "306",
    title: "Walmart Associate Scholarship",
    description: "Scholarship program for Walmart and Sam's Club associates and their dependents pursuing college education.",
    type: "scholarship",
    category: "financial",
    url: "https://www.walmartscholar.org/",
    amount: 13000,
    deadline: "2026-01-31",
    eligibility: ["Walmart or Sam's Club associate", "Or associate's dependent", "US Citizen or permanent resident"],
    tags: ["Non-Traditional", "Employee", "Working Adult"],
  },
  {
    id: "307",
    title: "ANTSHE Scholarships",
    description: "Association for Non-Traditional Students in Higher Education scholarships for returning adult students.",
    type: "scholarship",
    category: "financial",
    url: "https://www.antshe.org/scholarships",
    amount: 1000,
    deadline: "2026-06-01",
    eligibility: ["Non-traditional student", "Adult learner", "Enrolled in accredited institution"],
    tags: ["Non-Traditional", "Adult Learner", "Returning Student"],
  },
  {
    id: "308",
    title: "Osher Reentry Scholarship",
    description: "Scholarship for adult learners who are returning to complete an undergraduate degree after a break of at least 5 years.",
    type: "scholarship",
    category: "financial",
    url: "https://www.osherfoundation.org/",
    amount: 10000,
    deadline: "2026-03-15",
    eligibility: ["Adult learner", "5+ year break from education", "Pursuing undergraduate degree"],
    tags: ["Non-Traditional", "Adult Learner", "Reentry", "Returning Student"],
  },
  {
    id: "400",
    title: "Women Techmakers Scholars Program",
    description: "Google-funded scholarship for women studying computer science or related technical fields in college or graduate school.",
    type: "scholarship",
    category: "financial",
    url: "https://buildyourfuture.withgoogle.com/scholarships/google-scholarship-recipients",
    amount: 10000,
    deadline: "2026-12-01",
    eligibility: ["Women", "College or graduate student", "Computer science or related field", "GPA 3.2+"],
    tags: ["College Students", "Women", "Computer Science", "STEM"],
  },
  {
    id: "401",
    title: "The Truman Scholarship",
    description: "Scholarship for college junior-level students who plan to pursue careers in public service.",
    type: "scholarship",
    category: "financial",
    url: "https://www.truman.gov/",
    amount: 30000,
    deadline: "2027-02-01",
    eligibility: ["College junior", "US Citizen", "GPA 3.0+", "Public service interest"],
    tags: ["College Students", "Public Service", "Leadership", "Merit"],
  },
  {
    id: "402",
    title: "Goldwater Scholarship",
    description: "Prestigious scholarship for college sophomores and juniors pursuing careers in STEM research.",
    type: "scholarship",
    category: "financial",
    url: "https://goldwaterscholarship.gov/",
    amount: 7500,
    deadline: "2027-01-31",
    eligibility: ["College sophomore or junior", "US Citizen or permanent resident", "STEM major", "Research focus"],
    tags: ["College Students", "STEM", "Research", "Merit"],
  },
  {
    id: "403",
    title: "Udall Undergraduate Scholarship",
    description: "Scholarship for college sophomores and juniors committed to careers related to the environment or Native American issues.",
    type: "scholarship",
    category: "financial",
    url: "https://www.udall.gov/OurPrograms/Scholarship/Scholarship.aspx",
    amount: 7000,
    deadline: "2026-03-05",
    eligibility: ["College sophomore or junior", "US Citizen or permanent resident", "Environment or Native American focus"],
    tags: ["College Students", "Environment", "Native American", "Public Service"],
  },
  {
    id: "404",
    title: "NSF Graduate Research Fellowship",
    description: "National Science Foundation fellowship for graduate students pursuing research-based degrees in STEM fields.",
    type: "scholarship",
    category: "financial",
    url: "https://www.nsfgrfp.org/",
    amount: 147000,
    deadline: "2026-10-15",
    eligibility: ["Graduate student", "US Citizen or permanent resident", "STEM research field"],
    tags: ["College Students", "Graduate School", "STEM", "Research", "Fellowship"],
  },
  {
    id: "405",
    title: "The Beinecke Scholarship",
    description: "Scholarship for college juniors pursuing graduate study in the arts, humanities, and social sciences.",
    type: "scholarship",
    category: "financial",
    url: "https://www.beineckescholarship.org/",
    amount: 34000,
    deadline: "2026-02-01",
    eligibility: ["College junior", "US Citizen or permanent resident", "Arts, humanities, or social sciences major", "Financial need"],
    tags: ["College Students", "Humanities", "Arts", "Graduate School Prep"],
  },
  {
    id: "406",
    title: "Society of Women Engineers Scholarship",
    description: "Scholarships from SWE for women pursuing engineering and computer science degrees at the undergraduate and graduate level.",
    type: "scholarship",
    category: "financial",
    url: "https://scholarships.swe.org/",
    amount: 17000,
    deadline: "2026-05-01",
    eligibility: ["Women", "Engineering or computer science major", "College or graduate student"],
    tags: ["College Students", "Women", "Engineering", "STEM"],
  },
  {
    id: "407",
    title: "Jeannette Rankin Women's Scholarship Fund",
    description: "Scholarship for low-income women 35 and older who are pursuing a technical or vocational education or an undergraduate degree.",
    type: "scholarship",
    category: "financial",
    url: "https://www.rankinfoundation.org/students/applying/",
    amount: 2000,
    deadline: "2026-03-01",
    eligibility: ["Women 35+", "Low income", "Technical, vocational, or undergraduate education"],
    tags: ["College Students", "Non-Traditional", "Women", "Adult Learner", "Financial Need"],
  },
  {
    id: "4",
    title: "FAFSA Complete Guide",
    description: "Step-by-step walkthrough of the Free Application for Federal Student Aid process.",
    type: "guide",
    category: "financial",
    url: "https://studentaid.gov/h/apply-for-aid/fafsa",
    tags: ["Financial Aid", "College", "Government Aid"],
  },
  {
    id: "5",
    title: "Resume Writing 101",
    description: "Learn how to create a compelling resume that stands out to employers.",
    type: "guide",
    category: "career",
    url: "https://www.indeed.com/career-advice/resumes-cover-letters/how-to-make-a-resume-with-examples",
    tags: ["Job Search", "Career Development", "Professional Skills"],
  },
  {
    id: "6",
    title: "Interview Preparation Tips",
    description: "Master the art of interviewing with these proven strategies and practice questions.",
    type: "video",
    category: "career",
    url: "https://www.youtube.com/results?search_query=job+interview+tips",
    tags: ["Interviews", "Job Search", "Communication"],
  },
  {
    id: "7",
    title: "Military Career Paths",
    description: "Explore different branches and career opportunities within the US Armed Forces.",
    type: "guide",
    category: "military",
    url: "https://www.todaysmilitary.com/ways-to-serve",
    tags: ["Armed Forces", "Career Paths", "Benefits"],
  },
  {
    id: "8",
    title: "Budgeting Basics for Students",
    description: "Learn essential budgeting skills to manage your money effectively in college and beyond.",
    type: "video",
    category: "financial",
    url: "https://www.khanacademy.org/college-careers-more/personal-finance",
    tags: ["Money Management", "Budgeting", "Life Skills"],
  },
  {
    id: "9",
    title: "SAT/ACT Prep Resources",
    description: "Free and low-cost resources to help you prepare for standardized college entrance exams.",
    type: "tool",
    category: "college",
    url: "https://www.khanacademy.org/sat",
    tags: ["Test Prep", "SAT", "ACT", "College Admissions"],
  },
  {
    id: "10",
    title: "College Application Timeline",
    description: "A month-by-month guide to stay on track with your college application process.",
    type: "guide",
    category: "college",
    url: "https://bigfuture.collegeboard.org/plan-for-college/your-college-application-timeline",
    tags: ["Applications", "Planning", "Deadlines"],
  },
];

// Country Affordability Index (CAI) Database - 120+ countries
// Based on The Nomad Network Global Pricing System
export const caiCountries: CAICountry[] = [
  // High Income (CAI: 0.70-1.0)
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", caiScore: 1.0, lcsiAdjustment: 0.0, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 5500, lastUpdated: "2024-12" },
  { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "CHF", caiScore: 0.95, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 6500, lastUpdated: "2024-12" },
  { code: "NO", name: "Norway", currency: "NOK", currencySymbol: "kr", caiScore: 0.92, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 5800, lastUpdated: "2024-12" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "$", caiScore: 0.88, lcsiAdjustment: 0.03, region: "Oceania", incomeLevel: "high", avgMonthlyIncomeUSD: 4800, lastUpdated: "2024-12" },
  { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.85, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4200, lastUpdated: "2024-12" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "$", caiScore: 0.85, lcsiAdjustment: 0.02, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 4000, lastUpdated: "2024-12" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "\u00A3", caiScore: 0.82, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4100, lastUpdated: "2024-12" },
  { code: "NL", name: "Netherlands", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.82, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4300, lastUpdated: "2024-12" },
  { code: "SE", name: "Sweden", currency: "SEK", currencySymbol: "kr", caiScore: 0.80, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4000, lastUpdated: "2024-12" },
  { code: "DK", name: "Denmark", currency: "DKK", currencySymbol: "kr", caiScore: 0.80, lcsiAdjustment: 0.04, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4800, lastUpdated: "2024-12" },
  { code: "AT", name: "Austria", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.78, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3800, lastUpdated: "2024-12" },
  { code: "BE", name: "Belgium", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.78, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3700, lastUpdated: "2024-12" },
  { code: "IE", name: "Ireland", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.78, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4200, lastUpdated: "2024-12" },
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.75, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3500, lastUpdated: "2024-12" },
  { code: "FI", name: "Finland", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.75, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 3800, lastUpdated: "2024-12" },
  { code: "NZ", name: "New Zealand", currency: "NZD", currencySymbol: "$", caiScore: 0.75, lcsiAdjustment: 0.03, region: "Oceania", incomeLevel: "high", avgMonthlyIncomeUSD: 3400, lastUpdated: "2024-12" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "\u00A5", caiScore: 0.72, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 3200, lastUpdated: "2024-12" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "$", caiScore: 0.72, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 4500, lastUpdated: "2024-12" },
  { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "\u20A9", caiScore: 0.70, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2800, lastUpdated: "2024-12" },
  { code: "IT", name: "Italy", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.70, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2600, lastUpdated: "2024-12" },
  { code: "ES", name: "Spain", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.68, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2400, lastUpdated: "2024-12" },
  { code: "PT", name: "Portugal", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.65, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1800, lastUpdated: "2024-12" },
  { code: "IL", name: "Israel", currency: "ILS", currencySymbol: "\u20AA", caiScore: 0.70, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 3200, lastUpdated: "2024-12" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "AED", caiScore: 0.75, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 4000, lastUpdated: "2024-12" },
  { code: "QA", name: "Qatar", currency: "QAR", currencySymbol: "QR", caiScore: 0.78, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 5000, lastUpdated: "2024-12" },
  
  // Upper-Middle Income (CAI: 0.40-0.69)
  { code: "CZ", name: "Czech Republic", currency: "CZK", currencySymbol: "K\u010D", caiScore: 0.58, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1600, lastUpdated: "2024-12" },
  { code: "PL", name: "Poland", currency: "PLN", currencySymbol: "z\u0142", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1500, lastUpdated: "2024-12" },
  { code: "HU", name: "Hungary", currency: "HUF", currencySymbol: "Ft", caiScore: 0.52, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1300, lastUpdated: "2024-12" },
  { code: "GR", name: "Greece", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1400, lastUpdated: "2024-12" },
  { code: "HR", name: "Croatia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.50, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1200, lastUpdated: "2024-12" },
  { code: "RO", name: "Romania", currency: "RON", currencySymbol: "lei", caiScore: 0.45, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1100, lastUpdated: "2024-12" },
  { code: "BG", name: "Bulgaria", currency: "BGN", currencySymbol: "лв", caiScore: 0.42, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  { code: "RU", name: "Russia", currency: "RUB", currencySymbol: "\u20BD", caiScore: 0.45, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 800, lastUpdated: "2024-12" },
  { code: "TR", name: "Turkey", currency: "TRY", currencySymbol: "\u20BA", caiScore: 0.42, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "MX", name: "Mexico", currency: "MXN", currencySymbol: "$", caiScore: 0.45, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 650, lastUpdated: "2024-12" },
  { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$", caiScore: 0.42, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "AR", name: "Argentina", currency: "ARS", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "CL", name: "Chile", currency: "CLP", currencySymbol: "$", caiScore: 0.50, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1000, lastUpdated: "2024-12" },
  { code: "CO", name: "Colombia", currency: "COP", currencySymbol: "$", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "PE", name: "Peru", currency: "PEN", currencySymbol: "S/", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "EC", name: "Ecuador", currency: "USD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "CN", name: "China", currency: "CNY", currencySymbol: "\u00A5", caiScore: 0.48, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  { code: "TH", name: "Thailand", currency: "THB", currencySymbol: "\u0E3F", caiScore: 0.42, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 550, lastUpdated: "2024-12" },
  { code: "MY", name: "Malaysia", currency: "MYR", currencySymbol: "RM", caiScore: 0.48, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 800, lastUpdated: "2024-12" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R", caiScore: 0.40, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "EG", name: "Egypt", currency: "EGP", currencySymbol: "\u00A3", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "JO", name: "Jordan", currency: "JOD", currencySymbol: "JD", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", currencySymbol: "SR", caiScore: 0.60, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "KW", name: "Kuwait", currency: "KWD", currencySymbol: "KD", caiScore: 0.65, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 2500, lastUpdated: "2024-12" },
  
  // Lower-Middle Income (CAI: 0.20-0.39)
  { code: "IN", name: "India", currency: "INR", currencySymbol: "\u20B9", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "PH", name: "Philippines", currency: "PHP", currencySymbol: "\u20B1", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "ID", name: "Indonesia", currency: "IDR", currencySymbol: "Rp", caiScore: 0.30, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "VN", name: "Vietnam", currency: "VND", currencySymbol: "\u20AB", caiScore: 0.28, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "PK", name: "Pakistan", currency: "PKR", currencySymbol: "Rs", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "BD", name: "Bangladesh", currency: "BDT", currencySymbol: "\u09F3", caiScore: 0.20, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 120, lastUpdated: "2024-12" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", currencySymbol: "Rs", caiScore: 0.25, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "NP", name: "Nepal", currency: "NPR", currencySymbol: "Rs", caiScore: 0.20, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "MM", name: "Myanmar", currency: "MMK", currencySymbol: "K", caiScore: 0.18, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 80, lastUpdated: "2024-12" },
  { code: "KH", name: "Cambodia", currency: "KHR", currencySymbol: "\u17DB", caiScore: 0.22, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "\u20A6", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "GH", name: "Ghana", currency: "GHS", currencySymbol: "\u20B5", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "TZ", name: "Tanzania", currency: "TZS", currencySymbol: "TSh", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "UG", name: "Uganda", currency: "UGX", currencySymbol: "USh", caiScore: 0.20, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 80, lastUpdated: "2024-12" },
  { code: "SN", name: "Senegal", currency: "XOF", currencySymbol: "CFA", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "CI", name: "Ivory Coast", currency: "XOF", currencySymbol: "CFA", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "CM", name: "Cameroon", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 130, lastUpdated: "2024-12" },
  { code: "ZW", name: "Zimbabwe", currency: "ZWL", currencySymbol: "$", caiScore: 0.18, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "MA", name: "Morocco", currency: "MAD", currencySymbol: "DH", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "TN", name: "Tunisia", currency: "TND", currencySymbol: "DT", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "DZ", name: "Algeria", currency: "DZD", currencySymbol: "DA", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "UA", name: "Ukraine", currency: "UAH", currencySymbol: "\u20B4", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "BY", name: "Belarus", currency: "BYN", currencySymbol: "Br", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "BO", name: "Bolivia", currency: "BOB", currencySymbol: "Bs", caiScore: 0.28, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "PY", name: "Paraguay", currency: "PYG", currencySymbol: "\u20B2", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "GT", name: "Guatemala", currency: "GTQ", currencySymbol: "Q", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "HN", name: "Honduras", currency: "HNL", currencySymbol: "L", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 220, lastUpdated: "2024-12" },
  { code: "NI", name: "Nicaragua", currency: "NIO", currencySymbol: "C$", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "SV", name: "El Salvador", currency: "USD", currencySymbol: "$", caiScore: 0.30, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "DO", name: "Dominican Republic", currency: "DOP", currencySymbol: "RD$", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "JM", name: "Jamaica", currency: "JMD", currencySymbol: "$", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "CR", name: "Costa Rica", currency: "CRC", currencySymbol: "\u20A1", caiScore: 0.40, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "PA", name: "Panama", currency: "PAB", currencySymbol: "B/.", caiScore: 0.45, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "UY", name: "Uruguay", currency: "UYU", currencySymbol: "$", caiScore: 0.48, lcsiAdjustment: 0.02, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  
  // Low Income (CAI: 0.05-0.19)
  { code: "ET", name: "Ethiopia", currency: "ETB", currencySymbol: "Br", caiScore: 0.12, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 60, lastUpdated: "2024-12" },
  { code: "CD", name: "DR Congo", currency: "CDF", currencySymbol: "FC", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "ML", name: "Mali", currency: "XOF", currencySymbol: "CFA", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "NE", name: "Niger", currency: "XOF", currencySymbol: "CFA", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 35, lastUpdated: "2024-12" },
  { code: "MZ", name: "Mozambique", currency: "MZN", currencySymbol: "MT", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 45, lastUpdated: "2024-12" },
  { code: "MW", name: "Malawi", currency: "MWK", currencySymbol: "MK", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 30, lastUpdated: "2024-12" },
  { code: "ZM", name: "Zambia", currency: "ZMW", currencySymbol: "ZK", caiScore: 0.15, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 90, lastUpdated: "2024-12" },
  { code: "RW", name: "Rwanda", currency: "RWF", currencySymbol: "FRw", caiScore: 0.12, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 70, lastUpdated: "2024-12" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", currencySymbol: "CFA", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 55, lastUpdated: "2024-12" },
  { code: "BJ", name: "Benin", currency: "XOF", currencySymbol: "CFA", caiScore: 0.12, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 75, lastUpdated: "2024-12" },
  { code: "TG", name: "Togo", currency: "XOF", currencySymbol: "CFA", caiScore: 0.10, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "MG", name: "Madagascar", currency: "MGA", currencySymbol: "Ar", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 35, lastUpdated: "2024-12" },
  { code: "SD", name: "Sudan", currency: "SDG", currencySymbol: "SDG", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "SS", name: "South Sudan", currency: "SSP", currencySymbol: "SSP", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 25, lastUpdated: "2024-12" },
  { code: "SO", name: "Somalia", currency: "SOS", currencySymbol: "Sh", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 25, lastUpdated: "2024-12" },
  { code: "CF", name: "Central African Republic", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 30, lastUpdated: "2024-12" },
  { code: "TD", name: "Chad", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "SL", name: "Sierra Leone", currency: "SLE", currencySymbol: "Le", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "LR", name: "Liberia", currency: "LRD", currencySymbol: "$", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "GM", name: "Gambia", currency: "GMD", currencySymbol: "D", caiScore: 0.12, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 60, lastUpdated: "2024-12" },
  { code: "GN", name: "Guinea", currency: "GNF", currencySymbol: "FG", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 55, lastUpdated: "2024-12" },
  { code: "GW", name: "Guinea-Bissau", currency: "XOF", currencySymbol: "CFA", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "BI", name: "Burundi", currency: "BIF", currencySymbol: "FBu", caiScore: 0.05, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 20, lastUpdated: "2024-12" },
  { code: "ER", name: "Eritrea", currency: "ERN", currencySymbol: "Nfk", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "low", avgMonthlyIncomeUSD: 45, lastUpdated: "2024-12" },
  { code: "AF", name: "Afghanistan", currency: "AFN", currencySymbol: "\u060B", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "YE", name: "Yemen", currency: "YER", currencySymbol: "\uFDFC", caiScore: 0.08, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 40, lastUpdated: "2024-12" },
  { code: "HT", name: "Haiti", currency: "HTG", currencySymbol: "G", caiScore: 0.10, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "low", avgMonthlyIncomeUSD: 60, lastUpdated: "2024-12" },
  
  // Additional countries (various income levels)
  { code: "CU", name: "Cuba", currency: "CUP", currencySymbol: "$", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 30, lastUpdated: "2024-12" },
  { code: "VE", name: "Venezuela", currency: "VES", currencySymbol: "Bs", caiScore: 0.15, lcsiAdjustment: 0.05, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "IR", name: "Iran", currency: "IRR", currencySymbol: "\uFDFC", caiScore: 0.30, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "IQ", name: "Iraq", currency: "IQD", currencySymbol: "IQD", caiScore: 0.32, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "SY", name: "Syria", currency: "SYP", currencySymbol: "\u00A3", caiScore: 0.12, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 50, lastUpdated: "2024-12" },
  { code: "LB", name: "Lebanon", currency: "LBP", currencySymbol: "\u00A3", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "KZ", name: "Kazakhstan", currency: "KZT", currencySymbol: "\u20B8", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 550, lastUpdated: "2024-12" },
  { code: "UZ", name: "Uzbekistan", currency: "UZS", currencySymbol: "so'm", caiScore: 0.25, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "AZ", name: "Azerbaijan", currency: "AZN", currencySymbol: "\u20BC", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "GE", name: "Georgia", currency: "GEL", currencySymbol: "\u20BE", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "AM", name: "Armenia", currency: "AMD", currencySymbol: "\u058F", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "MD", name: "Moldova", currency: "MDL", currencySymbol: "L", caiScore: 0.28, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "RS", name: "Serbia", currency: "RSD", currencySymbol: "din", caiScore: 0.42, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "BA", name: "Bosnia and Herzegovina", currency: "BAM", currencySymbol: "KM", caiScore: 0.38, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 550, lastUpdated: "2024-12" },
  { code: "MK", name: "North Macedonia", currency: "MKD", currencySymbol: "den", caiScore: 0.35, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "AL", name: "Albania", currency: "ALL", currencySymbol: "L", caiScore: 0.35, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 450, lastUpdated: "2024-12" },
  { code: "ME", name: "Montenegro", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.42, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 650, lastUpdated: "2024-12" },
  { code: "XK", name: "Kosovo", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.32, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "SI", name: "Slovenia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.62, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "SK", name: "Slovakia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1400, lastUpdated: "2024-12" },
  { code: "EE", name: "Estonia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.58, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1700, lastUpdated: "2024-12" },
  { code: "LV", name: "Latvia", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.52, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1400, lastUpdated: "2024-12" },
  { code: "LT", name: "Lithuania", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.55, lcsiAdjustment: 0.02, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1500, lastUpdated: "2024-12" },
  { code: "CY", name: "Cyprus", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.58, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 1800, lastUpdated: "2024-12" },
  { code: "MT", name: "Malta", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.60, lcsiAdjustment: 0.03, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "LU", name: "Luxembourg", currency: "EUR", currencySymbol: "\u20AC", caiScore: 0.90, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 5500, lastUpdated: "2024-12" },
  { code: "IS", name: "Iceland", currency: "ISK", currencySymbol: "kr", caiScore: 0.80, lcsiAdjustment: 0.05, region: "Europe", incomeLevel: "high", avgMonthlyIncomeUSD: 4500, lastUpdated: "2024-12" },
  { code: "HK", name: "Hong Kong", currency: "HKD", currencySymbol: "$", caiScore: 0.68, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 3000, lastUpdated: "2024-12" },
  { code: "TW", name: "Taiwan", currency: "TWD", currencySymbol: "NT$", caiScore: 0.60, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "MN", name: "Mongolia", currency: "MNT", currencySymbol: "\u20AE", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "LA", name: "Laos", currency: "LAK", currencySymbol: "\u20AD", caiScore: 0.20, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "BN", name: "Brunei", currency: "BND", currencySymbol: "$", caiScore: 0.65, lcsiAdjustment: 0.03, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2500, lastUpdated: "2024-12" },
  { code: "BT", name: "Bhutan", currency: "BTN", currencySymbol: "Nu.", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "MV", name: "Maldives", currency: "MVR", currencySymbol: "Rf", caiScore: 0.40, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "FJ", name: "Fiji", currency: "FJD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.04, region: "Oceania", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "PG", name: "Papua New Guinea", currency: "PGK", currencySymbol: "K", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 180, lastUpdated: "2024-12" },
  { code: "WS", name: "Samoa", currency: "WST", currencySymbol: "T", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 280, lastUpdated: "2024-12" },
  { code: "TO", name: "Tonga", currency: "TOP", currencySymbol: "T$", caiScore: 0.30, lcsiAdjustment: 0.04, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 350, lastUpdated: "2024-12" },
  { code: "VU", name: "Vanuatu", currency: "VUV", currencySymbol: "Vt", caiScore: 0.25, lcsiAdjustment: 0.05, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 250, lastUpdated: "2024-12" },
  { code: "SB", name: "Solomon Islands", currency: "SBD", currencySymbol: "$", caiScore: 0.18, lcsiAdjustment: 0.05, region: "Oceania", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 150, lastUpdated: "2024-12" },
  { code: "AO", name: "Angola", currency: "AOA", currencySymbol: "Kz", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 250, lastUpdated: "2024-12" },
  { code: "BW", name: "Botswana", currency: "BWP", currencySymbol: "P", caiScore: 0.38, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "NA", name: "Namibia", currency: "NAD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "MU", name: "Mauritius", currency: "MUR", currencySymbol: "Rs", caiScore: 0.42, lcsiAdjustment: 0.03, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 700, lastUpdated: "2024-12" },
  { code: "SC", name: "Seychelles", currency: "SCR", currencySymbol: "Rs", caiScore: 0.48, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 900, lastUpdated: "2024-12" },
  { code: "CV", name: "Cabo Verde", currency: "CVE", currencySymbol: "$", caiScore: 0.28, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 300, lastUpdated: "2024-12" },
  { code: "DJ", name: "Djibouti", currency: "DJF", currencySymbol: "Fdj", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "LS", name: "Lesotho", currency: "LSL", currencySymbol: "L", caiScore: 0.15, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "SZ", name: "Eswatini", currency: "SZL", currencySymbol: "E", caiScore: 0.22, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
  { code: "TT", name: "Trinidad and Tobago", currency: "TTD", currencySymbol: "$", caiScore: 0.48, lcsiAdjustment: 0.03, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 1200, lastUpdated: "2024-12" },
  { code: "BS", name: "Bahamas", currency: "BSD", currencySymbol: "$", caiScore: 0.60, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 2200, lastUpdated: "2024-12" },
  { code: "BB", name: "Barbados", currency: "BBD", currencySymbol: "$", caiScore: 0.52, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "high", avgMonthlyIncomeUSD: 1500, lastUpdated: "2024-12" },
  { code: "BZ", name: "Belize", currency: "BZD", currencySymbol: "$", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "GY", name: "Guyana", currency: "GYD", currencySymbol: "$", caiScore: 0.35, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 500, lastUpdated: "2024-12" },
  { code: "SR", name: "Suriname", currency: "SRD", currencySymbol: "$", caiScore: 0.32, lcsiAdjustment: 0.04, region: "Americas", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "OM", name: "Oman", currency: "OMR", currencySymbol: "OMR", caiScore: 0.55, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 1800, lastUpdated: "2024-12" },
  { code: "BH", name: "Bahrain", currency: "BHD", currencySymbol: "BD", caiScore: 0.58, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "high", avgMonthlyIncomeUSD: 2000, lastUpdated: "2024-12" },
  { code: "TJ", name: "Tajikistan", currency: "TJS", currencySymbol: "SM", caiScore: 0.15, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "low", avgMonthlyIncomeUSD: 90, lastUpdated: "2024-12" },
  { code: "KG", name: "Kyrgyzstan", currency: "KGS", currencySymbol: "c", caiScore: 0.18, lcsiAdjustment: 0.04, region: "Asia", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 120, lastUpdated: "2024-12" },
  { code: "TM", name: "Turkmenistan", currency: "TMT", currencySymbol: "m", caiScore: 0.32, lcsiAdjustment: 0.05, region: "Asia", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "LY", name: "Libya", currency: "LYD", currencySymbol: "LD", caiScore: 0.35, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 400, lastUpdated: "2024-12" },
  { code: "MR", name: "Mauritania", currency: "MRU", currencySymbol: "UM", caiScore: 0.15, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 100, lastUpdated: "2024-12" },
  { code: "GQ", name: "Equatorial Guinea", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.35, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 600, lastUpdated: "2024-12" },
  { code: "GA", name: "Gabon", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.38, lcsiAdjustment: 0.04, region: "Africa", incomeLevel: "upper_middle", avgMonthlyIncomeUSD: 650, lastUpdated: "2024-12" },
  { code: "CG", name: "Republic of Congo", currency: "XAF", currencySymbol: "FCFA", caiScore: 0.22, lcsiAdjustment: 0.05, region: "Africa", incomeLevel: "lower_middle", avgMonthlyIncomeUSD: 200, lastUpdated: "2024-12" },
];

export class DatabaseStorage {

  assessmentResults: Map<string, AssessmentResult> = new Map();

  // Lessons - stored in database, tied to user
}

// Interface declaration merging: gives the class every method signature that
// is attached at runtime (via Object.assign in the per-domain modules).
export interface DatabaseStorage extends IStorage {
  // ----- Bricks/BKD lesson AI improvements -----
  setMasterLessonEmbedding(id: string, embedding: number[]): Promise<void>;
  getMasterLessonsForRetrieval(filters: { subject?: string; minScore?: number; limit?: number }): Promise<import("@shared/schema").MasterLesson[]>;
  createMasterLessonSection(section: import("@shared/schema").InsertMasterLessonSection): Promise<import("@shared/schema").MasterLessonSection>;
  getMasterLessonSections(masterLessonId: string): Promise<import("@shared/schema").MasterLessonSection[]>;
  setMasterLessonSectionEmbedding(id: string, embedding: number[]): Promise<void>;
  getMasterLessonSectionsByType(sectionType: string, masterLessonIds: string[]): Promise<import("@shared/schema").MasterLessonSection[]>;
  listLysCanonEntries(filters?: { subject?: string; kind?: string; isActive?: boolean }): Promise<import("@shared/schema").LysCanonEntry[]>;
  createLysCanonEntry(entry: import("@shared/schema").InsertLysCanonEntry): Promise<import("@shared/schema").LysCanonEntry>;
  updateLysCanonEntry(id: string, updates: Partial<import("@shared/schema").InsertLysCanonEntry>): Promise<import("@shared/schema").LysCanonEntry | undefined>;
  deleteLysCanonEntry(id: string): Promise<boolean>;
  setLysCanonEntryEmbedding(id: string, embedding: number[]): Promise<void>;
  createAssignmentAttribution(attr: Omit<import("@shared/schema").AssignmentGenerationAttribution, "id" | "createdAt">): Promise<import("@shared/schema").AssignmentGenerationAttribution>;
  listTopAssignmentExemplars(limit?: number): Promise<Array<{ canonEntryId: string; uses: number; avgVoiceScore: number }>>;
  getSubjectCanonVersion(subject: string): Promise<number>;
  bumpSubjectCanonVersion(subject: string): Promise<number>;
  createLessonAttribution(attr: Omit<import("@shared/schema").LessonGenerationAttribution, "id" | "createdAt">): Promise<import("@shared/schema").LessonGenerationAttribution>;
  getAiCostSummary(windowDays?: number): Promise<{
    windowDays: number;
    lessons: { count: number; costUsd: number; promptTokens: number; completionTokens: number; avgCostUsd: number };
    assignments: { count: number; costUsd: number; promptTokens: number; completionTokens: number; avgCostUsd: number };
    totalCostUsd: number;
    daily: Array<{ day: string; lessonCost: number; assignmentCost: number }>;
  }>;
  updateLessonAttributionScore(cacheKey: string, finalScore: number): Promise<void>;
  listTopExemplars(limit?: number): Promise<Array<{ masterLessonId: string; uses: number; avgScore: number; avgVoiceScore: number | null; rewriteRate: number }>>;
  createLessonEditSignal(signal: Omit<import("@shared/schema").LessonEditSignal, "id" | "createdAt">): Promise<import("@shared/schema").LessonEditSignal>;
  listLessonEditSignals(lessonId: string): Promise<import("@shared/schema").LessonEditSignal[]>;
  getLessonAiOrgSettings(orgId: string): Promise<import("@shared/schema").LessonAiOrgSettings | undefined>;
  upsertLessonAiOrgSettings(orgId: string, editCaptureEnabled: boolean): Promise<import("@shared/schema").LessonAiOrgSettings>;

  calculateLetterGrade(percentage: number): string;
  getCollaborationSessions(userId: string): Promise<CollaborationSession[]>;
  getActiveCollaborationSessions(userId: string): Promise<CollaborationSession[]>;
  getCollaborationSession(id: string): Promise<CollaborationSession | undefined>;
  getCollaborationSessionByInviteCode(inviteCode: string): Promise<CollaborationSession | undefined>;
  createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession>;
  updateCollaborationSession(id: string, updates: Partial<CollaborationSession>, hostUserId: string): Promise<CollaborationSession | undefined>;
  endCollaborationSession(id: string, hostUserId: string): Promise<CollaborationSession | undefined>;
  getSessionParticipants(sessionId: string): Promise<SessionParticipant[]>;
  getActiveSessionParticipants(sessionId: string): Promise<SessionParticipant[]>;
  getSessionParticipant(sessionId: string, userId: string): Promise<SessionParticipant | undefined>;
  createSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant>;
  updateSessionParticipant(id: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant | undefined>;
  leaveSession(sessionId: string, userId: string): Promise<boolean>;
  getCollaborationMessages(sessionId: string, limit?: any): Promise<CollaborationMessage[]>;
  createCollaborationMessage(message: InsertCollaborationMessage): Promise<CollaborationMessage>;
  getSharedResources(filters?: { visibility?: string; category?: string; subject?: string }): Promise<SharedResource[]>;
  getUserSharedResources(userId: string): Promise<SharedResource[]>;
  getSharedResource(id: string): Promise<SharedResource | undefined>;
  createSharedResource(resource: InsertSharedResource): Promise<SharedResource>;
  updateSharedResource(id: string, updates: Partial<SharedResource>, userId: string): Promise<SharedResource | undefined>;
  deleteSharedResource(id: string, userId: string): Promise<boolean>;
  incrementResourceDownload(id: string): Promise<void>;
  getResourceLike(resourceId: string, userId: string): Promise<ResourceLike | undefined>;
  toggleResourceLike(resourceId: string, userId: string): Promise<boolean>;
  getWishlist(userId: string): Promise<MarketplaceWishlist[]>;
  addToWishlist(userId: string, itemId: string): Promise<MarketplaceWishlist>;
  removeFromWishlist(userId: string, itemId: string): Promise<boolean>;
  isInWishlist(userId: string, itemId: string): Promise<boolean>;
  getRatingsForItem(itemId: string): Promise<MarketplaceRating[]>;
  getUserRating(userId: string, itemId: string): Promise<MarketplaceRating | undefined>;
  upsertRating(userId: string, itemId: string, rating: number, review: string | undefined, verified: boolean): Promise<MarketplaceRating>;
  getItemAverageRating(itemId: string): Promise<{ avg: number; count: number }>;
  getSessionEditHistory(sessionId: string, limit?: any): Promise<SessionEditHistory[]>;
  createSessionEdit(edit: InsertSessionEditHistory): Promise<SessionEditHistory>;
  getUserParticipatedSessions(userId: string): Promise<CollaborationSession[]>;
  createTransferRequest(data: InsertStudentTransferRequest): Promise<StudentTransferRequest>;
  getTransferRequest(id: string): Promise<StudentTransferRequest | undefined>;
  getTransferRequestsByStudent(studentId: string): Promise<StudentTransferRequest[]>;
  getTransferRequestsByOrganization(organizationId: string): Promise<StudentTransferRequest[]>;
  getPendingTransferRequests(level: "campus" | "district" | "system_admin"): Promise<StudentTransferRequest[]>;
  approveTransferAtLevel( id: string, level: "campus" | "district" | "system_admin", approvedBy: string ): Promise<StudentTransferRequest | undefined>;
  rejectTransfer( id: string, level: "campus" | "district" | "system_admin", rejectedBy: string, reason: string ): Promise<StudentTransferRequest | undefined>;
  cancelTransferRequest(id: string): Promise<StudentTransferRequest | undefined>;
  executeTransfer(id: string): Promise<StudentTransferRequest | undefined>;

  // ----- Team Hub (internal HR) -----
  getHrRoles(filters?: { status?: string; horizon?: string; department?: string }): Promise<import("@shared/schema").HrRole[]>;
  getHrRole(id: string): Promise<import("@shared/schema").HrRole | undefined>;
  createHrRole(data: import("@shared/schema").InsertHrRole & { id?: string }): Promise<import("@shared/schema").HrRole>;
  updateHrRole(id: string, updates: Partial<import("@shared/schema").InsertHrRole>): Promise<import("@shared/schema").HrRole | undefined>;
  getEmployees(filters?: { status?: string; roleId?: string; managerId?: string }): Promise<import("@shared/schema").Employee[]>;
  getEmployee(id: string): Promise<import("@shared/schema").Employee | undefined>;
  getEmployeeByUserId(userId: string): Promise<import("@shared/schema").Employee | undefined>;
  getDirectReports(managerId: string): Promise<import("@shared/schema").Employee[]>;
  createEmployee(data: import("@shared/schema").InsertEmployee): Promise<import("@shared/schema").Employee>;
  updateEmployee(id: string, updates: Partial<import("@shared/schema").InsertEmployee>): Promise<import("@shared/schema").Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  getOnboardingTasks(employeeId: string): Promise<import("@shared/schema").HrOnboardingTask[]>;
  getOnboardingTask(id: string): Promise<import("@shared/schema").HrOnboardingTask | undefined>;
  createOnboardingTask(data: import("@shared/schema").InsertHrOnboardingTask): Promise<import("@shared/schema").HrOnboardingTask>;
  updateOnboardingTask(id: string, updates: Partial<import("@shared/schema").InsertHrOnboardingTask> & { status?: string }): Promise<import("@shared/schema").HrOnboardingTask | undefined>;
  deleteOnboardingTask(id: string): Promise<boolean>;
  generateOnboardingForEmployee(employeeId: string): Promise<import("@shared/schema").HrOnboardingTask[]>;
  getStaffAccessRequest(id: string): Promise<import("@shared/schema").StaffAccessRequest | undefined>;
  getStaffAccessRequestByUser(userId: string): Promise<import("@shared/schema").StaffAccessRequest | undefined>;
  getStaffAccessRequests(status?: string): Promise<import("@shared/schema").StaffAccessRequest[]>;
  upsertStaffAccessRequest(userId: string, message?: string | null): Promise<import("@shared/schema").StaffAccessRequest>;
  decideStaffAccessRequest(id: string, status: "approved" | "denied", decidedById: string, extras?: { priorRole?: string | null }): Promise<import("@shared/schema").StaffAccessRequest | undefined>;
  grandfatherExistingStaffAccess(): Promise<number>;
}
