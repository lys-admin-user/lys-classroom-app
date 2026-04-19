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
import { db } from "./db";
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
  countGuestGenerations(ipAddress: string): Promise<number>;
  tryReserveGuestLessonGeneration(ipAddress: string, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }>;
  
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
  isSavedScholarship(userId: string, resourceId: string): Promise<boolean>;

  // Resource Reports (scholarship moderation)
  createResourceReport(data: InsertResourceReport): Promise<ResourceReport>;
  listResourceReports(filters?: { status?: string; resourceId?: string }): Promise<ResourceReport[]>;
  resolveResourceReport(id: string, userId: string, status: "resolved" | "dismissed"): Promise<ResourceReport | undefined>;
  countActiveReportsForResource(resourceId: string): Promise<number>;
  verifyKnowResource(id: string, userId: string): Promise<KnowResource | undefined>;
  bulkVerifyKnowResources(ids: string[], userId: string): Promise<number>;

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
let seedCareers: Career[] = [
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

const seedResources: Resource[] = [
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
const caiCountries: CAICountry[] = [
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

export class DatabaseStorage implements IStorage {
  private assessmentResults: Map<string, AssessmentResult> = new Map();

  // Lessons - stored in database, tied to user
  async getLessons(userId: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.userId, userId)).orderBy(desc(lessons.createdAt));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson as any).returning();
    return created;
  }

  async deleteLesson(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(lessons)
      .where(and(eq(lessons.id, id), eq(lessons.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getLessonByShareId(shareId: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.shareId, shareId));
    return lesson || undefined;
  }

  async toggleLessonShare(id: string, userId: string): Promise<{ shareId: string | null } | undefined> {
    const lesson = await this.getLesson(id);
    if (!lesson || lesson.userId !== userId) return undefined;
    
    const newShareId = lesson.shareId ? null : randomUUID().substring(0, 12);
    await db.update(lessons).set({ shareId: newShareId }).where(eq(lessons.id, id));
    return { shareId: newShareId };
  }

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
  }

  async logLessonGeneration(userId: string, topic?: string): Promise<void> {
    await db.insert(lessonGenerations).values({ userId, topic });
  }

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
  }

  async countGuestGenerations(ipAddress: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(guestLessonGenerations)
      .where(eq(guestLessonGenerations.ipAddress, ipAddress));
    return Number(result[0]?.count || 0);
  }

  async tryReserveGuestLessonGeneration(ipAddress: string, limit: number, topic?: string): Promise<{ success: boolean; currentCount: number }> {
    const result = await db.execute(sql`
      WITH current_count AS (
        SELECT COUNT(*) as cnt FROM guest_lesson_generations 
        WHERE ip_address = ${ipAddress}
      ),
      inserted AS (
        INSERT INTO guest_lesson_generations (id, ip_address, topic, created_at)
        SELECT gen_random_uuid(), ${ipAddress}, ${topic}, NOW()
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
  }

  // Lesson Templates - stored in database
  async getLessonTemplates(userId: string): Promise<LessonTemplate[]> {
    return await db.select().from(lessonTemplates)
      .where(eq(lessonTemplates.userId, userId))
      .orderBy(desc(lessonTemplates.createdAt));
  }

  async getPublicLessonTemplates(): Promise<LessonTemplate[]> {
    return await db.select().from(lessonTemplates)
      .where(eq(lessonTemplates.visibility, "public"))
      .orderBy(desc(lessonTemplates.useCount));
  }

  async getLessonTemplate(id: string): Promise<LessonTemplate | undefined> {
    const [template] = await db.select().from(lessonTemplates).where(eq(lessonTemplates.id, id));
    return template || undefined;
  }

  async createLessonTemplate(template: InsertLessonTemplate): Promise<LessonTemplate> {
    const [created] = await db.insert(lessonTemplates).values(template as any).returning();
    return created;
  }

  async updateLessonTemplate(id: string, updates: Partial<LessonTemplate>, userId: string): Promise<LessonTemplate | undefined> {
    const template = await this.getLessonTemplate(id);
    if (!template || template.userId !== userId) return undefined;
    
    const [updated] = await db.update(lessonTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lessonTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLessonTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(lessonTemplates)
      .where(and(eq(lessonTemplates.id, id), eq(lessonTemplates.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async incrementTemplateUseCount(id: string): Promise<void> {
    await db.update(lessonTemplates)
      .set({ useCount: sql`${lessonTemplates.useCount} + 1` })
      .where(eq(lessonTemplates.id, id));
  }

  // Goals - stored in database
  async getGoals(userId?: string): Promise<Goal[]> {
    if (userId) {
      return await db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
    }
    return await db.select().from(goals).orderBy(desc(goals.createdAt));
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [created] = await db.insert(goals).values({
      ...goal,
      milestones: goal.milestones || [],
    } as any).returning();
    return created;
  }

  async updateGoal(id: string, updates: Partial<Goal>, userId?: string | null): Promise<Goal | undefined> {
    const goal = await this.getGoal(id);
    if (!goal) return undefined;
    if (goal.userId && goal.userId !== userId) return undefined;
    
    const [updated] = await db.update(goals).set(updates).where(eq(goals.id, id)).returning();
    return updated || undefined;
  }

  async deleteGoal(id: string, userId?: string | null): Promise<boolean> {
    const goal = await this.getGoal(id);
    if (!goal) return false;
    if (goal.userId && goal.userId !== userId) return false;
    
    await db.delete(goals).where(eq(goals.id, id));
    return true;
  }

  async updateMilestone(goalId: string, milestoneId: string, completed: boolean, userId?: string | null): Promise<Goal | undefined> {
    const goal = await this.getGoal(goalId);
    if (!goal) return undefined;
    if (goal.userId && goal.userId !== userId) return undefined;

    const updatedMilestones = (goal.milestones as any[]).map((m: any) =>
      m.id === milestoneId ? { ...m, completed } : m
    );
    
    const completedCount = updatedMilestones.filter((m: any) => m.completed).length;
    const progress = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;
    
    let status = goal.status;
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    }

    return await this.updateGoal(goalId, { milestones: updatedMilestones, progress, status }, userId);
  }

  // Educator Profiles
  async getEducatorProfile(userId: string): Promise<EducatorProfile | undefined> {
    const [profile] = await db.select().from(educatorProfiles).where(eq(educatorProfiles.userId, userId));
    return profile || undefined;
  }

  async createEducatorProfile(profile: InsertEducatorProfile): Promise<EducatorProfile> {
    const [created] = await db.insert(educatorProfiles).values(profile as any).returning();
    return created;
  }

  async updateEducatorProfile(userId: string, updates: Partial<EducatorProfile>): Promise<EducatorProfile | undefined> {
    const existing = await this.getEducatorProfile(userId);
    if (!existing) return undefined;
    
    const [updated] = await db.update(educatorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educatorProfiles.userId, userId))
      .returning();
    return updated || undefined;
  }

  // User management
  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserTier(userId: string): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.tier || "free";
  }

  async updateUserTier(userId: string, tier: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ tier: tier as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  async completeOnboarding(userId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

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
  }

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
  }

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
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const [created] = await db.insert(userPreferences).values(prefs as any).returning();
    return created;
  }

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
  }

  // Static data - careers
  async getCareers(): Promise<Career[]> {
    return seedCareers;
  }

  async getCareer(id: string): Promise<Career | undefined> {
    return seedCareers.find(c => c.id === id);
  }

  async getCareersByGrade(gradeBand: string): Promise<Career[]> {
    return seedCareers.filter(c => 
      c.appropriateGrades?.includes(gradeBand as any) ?? true
    );
  }

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
  }

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
  }

  async updateCareerFromBls(blsCode: string, updates: Partial<Career>): Promise<Career | undefined> {
    const index = seedCareers.findIndex(c => c.blsCode === blsCode);
    if (index === -1) return undefined;
    
    seedCareers[index] = {
      ...seedCareers[index],
      ...updates,
      blsLastUpdated: new Date().toISOString().slice(0, 7), // YYYY-MM format
    };
    
    return seedCareers[index];
  }

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
  }

  // Static data - resources
  async getResources(): Promise<Resource[]> {
    return seedResources;
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return seedResources.find(r => r.id === id);
  }

  // Assessments - in memory for now
  async getAssessments(): Promise<Assessment[]> {
    return [];
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    return undefined;
  }

  async saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult> {
    this.assessmentResults.set(result.id, result);
    return result;
  }

  // Scope and Sequence
  async getScopeSequences(userId: string): Promise<ScopeSequence[]> {
    return await db.select().from(scopeSequences)
      .where(eq(scopeSequences.userId, userId))
      .orderBy(desc(scopeSequences.createdAt));
  }

  async getScopeSequencesWithHierarchy(userId: string): Promise<ScopeSequence[]> {
    const userScopes = await this.getScopeSequences(userId);
    const seenIds = new Set(userScopes.map(s => s.id));
    const inheritedScopes: ScopeSequence[] = [];
    
    const userOrgs = await this.getUserOrganizations(userId);
    
    for (const membership of userOrgs) {
      const currentOrg = await this.getOrganization(membership.organizationId);
      if (!currentOrg) continue;
      
      // Get campus-level scopes (only from current org if it's a campus/school)
      if (currentOrg.type === 'school' || currentOrg.type === 'campus') {
        const campusScopes = await db.select().from(scopeSequences)
          .where(and(
            or(
              eq(scopeSequences.organizationId, currentOrg.id),
              eq(scopeSequences.campusId, currentOrg.id) // Backward compatibility
            ),
            eq(scopeSequences.visibility as any, 'campus'),
            eq(scopeSequences.status, 'published')
          ));
        
        for (const scope of campusScopes) {
          if (!seenIds.has(scope.id)) {
            seenIds.add(scope.id);
            inheritedScopes.push(scope);
          }
        }
      }
      
      // Get district-level scopes (from parent district)
      if (currentOrg.parentOrganizationId) {
        const parentOrg = await this.getOrganization(currentOrg.parentOrganizationId);
        if (parentOrg && parentOrg.type === 'district') {
          const districtScopes = await db.select().from(scopeSequences)
            .where(and(
              eq(scopeSequences.organizationId, parentOrg.id),
              eq(scopeSequences.visibility as any, 'district'),
              eq(scopeSequences.status, 'published')
            ));
          
          for (const scope of districtScopes) {
            if (!seenIds.has(scope.id)) {
              seenIds.add(scope.id);
              inheritedScopes.push(scope);
            }
          }
        }
      }
    }
    
    // Get system-level scopes (available to all)
    const systemScopes = await db.select().from(scopeSequences)
      .where(and(
        eq(scopeSequences.visibility as any, 'system'),
        eq(scopeSequences.status, 'published')
      ));
    
    for (const scope of systemScopes) {
      if (!seenIds.has(scope.id)) {
        seenIds.add(scope.id);
        inheritedScopes.push(scope);
      }
    }
    
    return [...userScopes, ...inheritedScopes].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getScopeSequence(id: string): Promise<ScopeSequence | undefined> {
    const [scope] = await db.select().from(scopeSequences).where(eq(scopeSequences.id, id));
    return scope || undefined;
  }

  async createScopeSequence(scope: InsertScopeSequence): Promise<ScopeSequence> {
    const [created] = await db.insert(scopeSequences).values(scope as any).returning();
    return created;
  }

  async updateScopeSequence(id: string, updates: Partial<ScopeSequence>, userId: string): Promise<ScopeSequence | undefined> {
    const scope = await this.getScopeSequence(id);
    if (!scope || scope.userId !== userId) return undefined;
    
    const [updated] = await db.update(scopeSequences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scopeSequences.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteScopeSequence(id: string, userId: string): Promise<boolean> {
    const scope = await this.getScopeSequence(id);
    if (!scope || scope.userId !== userId) return false;
    
    // Delete associated units first
    await db.delete(sequenceUnits).where(eq(sequenceUnits.scopeId, id));
    // Delete the scope
    await db.delete(scopeSequences).where(eq(scopeSequences.id, id));
    return true;
  }

  // Sequence Units
  async getSequenceUnits(scopeId: string): Promise<SequenceUnit[]> {
    return await db.select().from(sequenceUnits)
      .where(eq(sequenceUnits.scopeId, scopeId))
      .orderBy(asc(sequenceUnits.unitNumber));
  }

  async getSequenceUnit(id: string): Promise<SequenceUnit | undefined> {
    const [unit] = await db.select().from(sequenceUnits).where(eq(sequenceUnits.id, id));
    return unit || undefined;
  }

  async createSequenceUnit(unit: InsertSequenceUnit): Promise<SequenceUnit> {
    const [created] = await db.insert(sequenceUnits).values(unit as any).returning();
    return created;
  }

  async updateSequenceUnit(id: string, updates: Partial<SequenceUnit>, userId: string): Promise<SequenceUnit | undefined> {
    const unit = await this.getSequenceUnit(id);
    if (!unit) return undefined;
    
    // Verify user owns the scope
    const scope = await this.getScopeSequence(unit.scopeId);
    if (!scope || scope.userId !== userId) return undefined;
    
    const [updated] = await db.update(sequenceUnits)
      .set(updates)
      .where(eq(sequenceUnits.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSequenceUnit(id: string, userId: string): Promise<boolean> {
    const unit = await this.getSequenceUnit(id);
    if (!unit) return false;
    
    // Verify user owns the scope
    const scope = await this.getScopeSequence(unit.scopeId);
    if (!scope || scope.userId !== userId) return false;
    
    await db.delete(sequenceUnits).where(eq(sequenceUnits.id, id));
    return true;
  }

  // Scope Change Requests
  async getScopeChangeRequests(scopeId: string): Promise<ScopeChangeRequest[]> {
    return await db.select().from(scopeChangeRequests)
      .where(eq(scopeChangeRequests.scopeId, scopeId))
      .orderBy(desc(scopeChangeRequests.createdAt));
  }

  async createScopeChangeRequest(request: InsertScopeChangeRequest): Promise<ScopeChangeRequest> {
    const [created] = await db.insert(scopeChangeRequests).values(request as any).returning();
    return created;
  }

  async updateScopeChangeRequest(id: string, updates: Partial<ScopeChangeRequest>): Promise<ScopeChangeRequest | undefined> {
    const [updated] = await db.update(scopeChangeRequests)
      .set(updates)
      .where(eq(scopeChangeRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllPendingChangeRequests(): Promise<ScopeChangeRequest[]> {
    return await db.select().from(scopeChangeRequests)
      .where(eq(scopeChangeRequests.status, "pending"))
      .orderBy(desc(scopeChangeRequests.createdAt));
  }

  // Self-Discovery Results
  async getSelfDiscoveryResults(userId: string): Promise<SelfDiscoveryResult[]> {
    return await db.select().from(selfDiscoveryResults)
      .where(eq(selfDiscoveryResults.userId, userId))
      .orderBy(desc(selfDiscoveryResults.createdAt));
  }

  async saveSelfDiscoveryResult(result: InsertSelfDiscoveryResult): Promise<SelfDiscoveryResult> {
    const [created] = await db.insert(selfDiscoveryResults).values(result as any).returning();
    return created;
  }

  // Saved Careers
  async getSavedCareers(userId: string): Promise<SavedCareer[]> {
    return await db.select().from(savedCareers)
      .where(eq(savedCareers.userId, userId))
      .orderBy(desc(savedCareers.createdAt));
  }

  async saveCareer(career: InsertSavedCareer): Promise<SavedCareer> {
    const [created] = await db.insert(savedCareers).values(career as any).returning();
    return created;
  }

  async deleteSavedCareer(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(savedCareers)
      .where(and(eq(savedCareers.id, id), eq(savedCareers.userId, userId)));
    if (!existing) return false;
    await db.delete(savedCareers).where(eq(savedCareers.id, id));
    return true;
  }

  // Affiliate System
  async getEducatorAffiliate(userId: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.userId, userId));
    return affiliate || undefined;
  }

  async getEducatorAffiliateByCode(referralCode: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.referralCode, referralCode));
    return affiliate || undefined;
  }

  async getEducatorAffiliateById(affiliateId: string): Promise<EducatorAffiliate | undefined> {
    const [affiliate] = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.id, affiliateId));
    return affiliate || undefined;
  }

  async createEducatorAffiliate(affiliate: InsertEducatorAffiliate): Promise<EducatorAffiliate> {
    const [created] = await db.insert(educatorAffiliates).values(affiliate as any).returning();
    return created;
  }

  async updateEducatorAffiliate(userId: string, updates: Partial<EducatorAffiliate>): Promise<EducatorAffiliate | undefined> {
    const [updated] = await db.update(educatorAffiliates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educatorAffiliates.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Referral Events
  async createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent> {
    const [created] = await db.insert(referralEvents).values(event as any).returning();
    
    // Update affiliate totals based on event type
    const affiliate = await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.id, event.affiliateId));
    if (affiliate.length > 0) {
      const current = affiliate[0];
      const updates: Partial<EducatorAffiliate> = { updatedAt: new Date() };
      
      if (event.eventType === "view") {
        updates.totalViews = (current.totalViews || 0) + 1;
      } else if (event.eventType === "share" || event.eventType === "copy_link") {
        updates.totalShares = (current.totalShares || 0) + 1;
      } else if (event.eventType === "signup" || event.eventType === "lesson_save") {
        updates.totalReferrals = (current.totalReferrals || 0) + 1;
      }
      
      if (event.pointsEarned && event.pointsEarned > 0) {
        updates.totalPoints = (current.totalPoints || 0) + event.pointsEarned;
      }
      
      await db.update(educatorAffiliates)
        .set(updates)
        .where(eq(educatorAffiliates.id, event.affiliateId));
    }
    
    return created;
  }

  async getReferralEvents(affiliateId: string, limit: number = 50): Promise<ReferralEvent[]> {
    return await db.select().from(referralEvents)
      .where(eq(referralEvents.affiliateId, affiliateId))
      .orderBy(desc(referralEvents.createdAt))
      .limit(limit);
  }

  // Affiliate Rewards
  async createAffiliateReward(reward: InsertAffiliateReward): Promise<AffiliateReward> {
    const [created] = await db.insert(affiliateRewards).values(reward as any).returning();
    return created;
  }

  async getAffiliateRewards(affiliateId: string): Promise<AffiliateReward[]> {
    return await db.select().from(affiliateRewards)
      .where(eq(affiliateRewards.affiliateId, affiliateId))
      .orderBy(desc(affiliateRewards.createdAt));
  }

  // Wallet & Hybrid Affiliate
  async getWalletTransactions(affiliateId: string, limit: number = 50): Promise<WalletTransaction[]> {
    return await db.select().from(affiliateWalletTransactions)
      .where(eq(affiliateWalletTransactions.affiliateId, affiliateId))
      .orderBy(desc(affiliateWalletTransactions.createdAt))
      .limit(limit);
  }

  async createWalletTransaction(tx: InsertWalletTransaction): Promise<WalletTransaction> {
    const [created] = await db.insert(affiliateWalletTransactions).values(tx as any).returning();
    return created;
  }

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
  }

  async getTier2Affiliates(parentAffiliateId: string): Promise<EducatorAffiliate[]> {
    return await db.select().from(educatorAffiliates)
      .where(eq(educatorAffiliates.parentAffiliateId, parentAffiliateId));
  }

  async upgradeToProMode(affiliateId: string): Promise<EducatorAffiliate | undefined> {
    const [updated] = await db.update(educatorAffiliates)
      .set({ affiliateMode: "pro", proUpgradedAt: new Date(), updatedAt: new Date() })
      .where(eq(educatorAffiliates.id, affiliateId))
      .returning();
    return updated || undefined;
  }

  // Promo Assets
  async createPromoAsset(asset: InsertPromoAsset): Promise<PromoAsset> {
    const [created] = await db.insert(affiliatePromoAssets).values(asset as any).returning();
    return created;
  }

  async getPromoAssets(affiliateId: string): Promise<PromoAsset[]> {
    return await db.select().from(affiliatePromoAssets)
      .where(eq(affiliatePromoAssets.affiliateId, affiliateId))
      .orderBy(desc(affiliatePromoAssets.createdAt));
  }

  // Educational Standards Ingestion
  async getJurisdictions(country?: string): Promise<StandardsJurisdiction[]> {
    if (country) {
      return await db.select().from(standardsJurisdictions)
        .where(eq(standardsJurisdictions.country, country))
        .orderBy(asc(standardsJurisdictions.name));
    }
    return await db.select().from(standardsJurisdictions)
      .orderBy(asc(standardsJurisdictions.country), asc(standardsJurisdictions.name));
  }

  async getJurisdiction(id: string): Promise<StandardsJurisdiction | undefined> {
    const [result] = await db.select().from(standardsJurisdictions)
      .where(eq(standardsJurisdictions.id, id));
    return result || undefined;
  }

  async getJurisdictionByAbbr(country: string, abbreviation: string): Promise<StandardsJurisdiction | undefined> {
    const [result] = await db.select().from(standardsJurisdictions)
      .where(and(
        eq(standardsJurisdictions.country, country),
        eq(standardsJurisdictions.abbreviation, abbreviation)
      ));
    return result || undefined;
  }

  async createJurisdiction(jurisdiction: InsertStandardsJurisdiction): Promise<StandardsJurisdiction> {
    const [created] = await db.insert(standardsJurisdictions).values(jurisdiction as any).returning();
    return created;
  }

  async updateJurisdiction(id: string, updates: Partial<StandardsJurisdiction>): Promise<StandardsJurisdiction | undefined> {
    const [updated] = await db.update(standardsJurisdictions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standardsJurisdictions.id, id))
      .returning();
    return updated || undefined;
  }

  async getStandardSets(jurisdictionId: string): Promise<StandardSet[]> {
    return await db.select().from(standardSets)
      .where(eq(standardSets.jurisdictionId, jurisdictionId))
      .orderBy(asc(standardSets.title));
  }

  async getStandardSet(id: string): Promise<StandardSet | undefined> {
    const [result] = await db.select().from(standardSets)
      .where(eq(standardSets.id, id));
    return result || undefined;
  }

  async getStandardSetByUid(uid: string): Promise<StandardSet | undefined> {
    const [result] = await db.select().from(standardSets)
      .where(eq(standardSets.uid, uid));
    return result || undefined;
  }

  async createStandardSet(set: InsertStandardSet): Promise<StandardSet> {
    const [created] = await db.insert(standardSets).values(set as any).returning();
    return created;
  }

  async updateStandardSet(id: string, updates: Partial<StandardSet>): Promise<StandardSet | undefined> {
    const [updated] = await db.update(standardSets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(standardSets.id, id))
      .returning();
    return updated || undefined;
  }

  async getEducationalStandards(standardSetId: string): Promise<EducationalStandard[]> {
    return await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.standardSetId, standardSetId))
      .orderBy(asc(educationalStandardsDb.position));
  }

  async getEducationalStandardsByGradeLevels(standardSetId: string, gradeLevels: string[]): Promise<EducationalStandard[]> {
    if (!gradeLevels || gradeLevels.length === 0) {
      return this.getEducationalStandards(standardSetId);
    }
    
    // Expand grade bands to individual grades for matching
    const expandedGrades = new Set<string>();
    const gradeBandMapping: Record<string, string[]> = {
      'elementary': ['K', '1', '2', '3', '4', '5'],
      'middle_school': ['6', '7', '8'],
      'high_school': ['9', '10', '11', '12'],
      'post_secondary': ['post_secondary', 'college', 'university', '13+'],
    };
    
    gradeLevels.forEach(level => {
      if (gradeBandMapping[level]) {
        gradeBandMapping[level].forEach(g => expandedGrades.add(g));
      } else {
        expandedGrades.add(level);
      }
    });
    
    const allStandards = await this.getEducationalStandards(standardSetId);
    
    // Filter standards by grade level
    return allStandards.filter(standard => {
      if (!standard.gradeLevel) return true; // Include standards without grade info
      
      const standardGrade = standard.gradeLevel.toLowerCase();
      
      // Check for exact match or range overlap
      for (const grade of Array.from(expandedGrades)) {
        const g = grade.toLowerCase();
        if (standardGrade === g) return true;
        if (standardGrade.includes(g)) return true;
        // Handle ranges like "9-12", "K-2", etc.
        if (standardGrade.includes('-')) {
          const [start, end] = standardGrade.split('-').map(s => s.trim());
          const gradeNum = parseInt(g);
          const startNum = start === 'k' ? 0 : parseInt(start);
          const endNum = parseInt(end);
          if (!isNaN(gradeNum) && !isNaN(startNum) && !isNaN(endNum)) {
            if (gradeNum >= startNum && gradeNum <= endNum) return true;
          }
        }
      }
      return false;
    });
  }

  async getEducationalStandard(id: string): Promise<EducationalStandard | undefined> {
    const [result] = await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.id, id));
    return result || undefined;
  }

  async getEducationalStandardByUid(uid: string): Promise<EducationalStandard | undefined> {
    const [result] = await db.select().from(educationalStandardsDb)
      .where(eq(educationalStandardsDb.uid, uid));
    return result || undefined;
  }

  async createEducationalStandard(standard: InsertEducationalStandard): Promise<EducationalStandard> {
    const [created] = await db.insert(educationalStandardsDb).values(standard as any).returning();
    return created;
  }

  async updateEducationalStandard(id: string, updates: Partial<EducationalStandard>): Promise<EducationalStandard | undefined> {
    const [updated] = await db.update(educationalStandardsDb)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(educationalStandardsDb.id, id))
      .returning();
    return updated || undefined;
  }

  async bulkCreateEducationalStandards(standards: InsertEducationalStandard[]): Promise<EducationalStandard[]> {
    if (standards.length === 0) return [];
    return await db.insert(educationalStandardsDb).values(standards as any[]).returning();
  }

  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const [created] = await db.insert(standardsSyncLog).values(log as any).returning();
    return created;
  }

  async updateSyncLog(id: string, updates: Partial<SyncLog>): Promise<SyncLog | undefined> {
    const [updated] = await db.update(standardsSyncLog)
      .set(updates)
      .where(eq(standardsSyncLog.id, id))
      .returning();
    return updated || undefined;
  }

  async getLatestSyncLogs(limit: number = 20): Promise<SyncLog[]> {
    return await db.select().from(standardsSyncLog)
      .orderBy(desc(standardsSyncLog.startedAt))
      .limit(limit);
  }

  // Standards Staging (Approval Queue)
  async createStagingStandard(staging: InsertStandardsStaging): Promise<StandardsStaging> {
    const [created] = await db.insert(standardsStaging).values(staging as any).returning();
    return created;
  }

  async getStagingStandards(status?: string): Promise<StandardsStaging[]> {
    if (status) {
      return await db.select().from(standardsStaging)
        .where(eq(standardsStaging.status, status))
        .orderBy(desc(standardsStaging.createdAt));
    }
    return await db.select().from(standardsStaging)
      .orderBy(desc(standardsStaging.createdAt));
  }

  async updateStagingStandard(id: string, updates: Partial<StandardsStaging>): Promise<StandardsStaging | undefined> {
    const [updated] = await db.update(standardsStaging)
      .set(updates)
      .where(eq(standardsStaging.id, id))
      .returning();
    return updated || undefined;
  }

  async approveStagingStandard(id: string, reviewerId: string): Promise<EducationalStandard | undefined> {
    const [staging] = await db.select().from(standardsStaging).where(eq(standardsStaging.id, id));
    if (!staging) return undefined;

    await db.update(standardsStaging)
      .set({ status: "approved", reviewedBy: reviewerId, reviewedAt: new Date() })
      .where(eq(standardsStaging.id, id));

    const uid = `${staging.jurisdictionId}-${staging.humanCoding}-${Date.now()}`;
    const [created] = await db.insert(educationalStandardsDb).values({
      uid,
      standardSetId: staging.standardSetId || "",
      humanCoding: staging.humanCoding,
      statement: staging.statement,
      description: staging.description,
      gradeLevel: staging.gradeLevel,
      depth: staging.depth,
      position: staging.position,
      isActive: true,
      source: staging.source,
      versionHistory: [{ version: "1.0", changedAt: new Date().toISOString(), changeType: "create" as const }],
    } as any).returning();
    return created;
  }

  async rejectStagingStandard(id: string, reviewerId: string, reason: string): Promise<StandardsStaging | undefined> {
    const [updated] = await db.update(standardsStaging)
      .set({ status: "rejected", reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason: reason })
      .where(eq(standardsStaging.id, id))
      .returning();
    return updated || undefined;
  }

  async bulkCreateStagingStandards(standards: InsertStandardsStaging[]): Promise<StandardsStaging[]> {
    if (standards.length === 0) return [];
    return await db.insert(standardsStaging).values(standards as any[]).returning();
  }

  // Source Checksums (Change Detection)
  async createSourceChecksum(checksum: InsertSourceChecksum): Promise<SourceChecksum> {
    const [created] = await db.insert(sourceChecksums).values(checksum as any).returning();
    return created;
  }

  async getSourceChecksum(sourceUrl: string): Promise<SourceChecksum | undefined> {
    const [result] = await db.select().from(sourceChecksums)
      .where(eq(sourceChecksums.sourceUrl, sourceUrl));
    return result || undefined;
  }

  async updateSourceChecksum(id: string, updates: Partial<SourceChecksum>): Promise<SourceChecksum | undefined> {
    const [updated] = await db.update(sourceChecksums)
      .set({ ...updates, lastCheckedAt: new Date() })
      .where(eq(sourceChecksums.id, id))
      .returning();
    return updated || undefined;
  }

  async getChangedSources(): Promise<SourceChecksum[]> {
    return await db.select().from(sourceChecksums)
      .where(eq(sourceChecksums.hasChanged, true));
  }

  // PDF Import Queue
  async createPdfImport(pdfImport: InsertPdfImport): Promise<PdfImport> {
    const [created] = await db.insert(pdfImportQueue).values(pdfImport as any).returning();
    return created;
  }

  async getPdfImport(id: string): Promise<PdfImport | undefined> {
    const [result] = await db.select().from(pdfImportQueue)
      .where(eq(pdfImportQueue.id, id));
    return result || undefined;
  }

  async updatePdfImport(id: string, updates: Partial<PdfImport>): Promise<PdfImport | undefined> {
    const [updated] = await db.update(pdfImportQueue)
      .set(updates)
      .where(eq(pdfImportQueue.id, id))
      .returning();
    return updated || undefined;
  }

  async getPdfImports(userId: string): Promise<PdfImport[]> {
    return await db.select().from(pdfImportQueue)
      .where(eq(pdfImportQueue.userId, userId))
      .orderBy(desc(pdfImportQueue.createdAt));
  }

  // Soft Delete for Standards
  async deprecateStandard(id: string): Promise<EducationalStandard | undefined> {
    const existing = await this.getEducationalStandard(id);
    if (!existing) return undefined;

    const versionHistory = existing.versionHistory || [];
    versionHistory.push({
      version: new Date().toISOString(),
      changedAt: new Date().toISOString(),
      previousStatement: existing.statement,
      changeType: "deprecate",
    });

    const [updated] = await db.update(educationalStandardsDb)
      .set({ isActive: false, versionHistory, updatedAt: new Date() })
      .where(eq(educationalStandardsDb.id, id))
      .returning();
    return updated || undefined;
  }

  // ================================
  // Assignment System (Paid Feature)
  // ================================

  // Classes
  async getClasses(userId: string): Promise<Class[]> {
    return await db.select().from(classes)
      .where(eq(classes.userId, userId))
      .orderBy(desc(classes.createdAt));
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [result] = await db.select().from(classes).where(eq(classes.id, id));
    return result || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [created] = await db.insert(classes).values(classData as any).returning();
    return created;
  }

  async updateClass(id: string, updates: Partial<Class>, userId: string): Promise<Class | undefined> {
    const existing = await this.getClass(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteClass(id: string, userId: string): Promise<boolean> {
    const existing = await this.getClass(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(classes).where(eq(classes.id, id));
    return true;
  }

  // Students
  async getStudents(userId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.userId, userId))
      .orderBy(asc(students.lastName), asc(students.firstName));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [result] = await db.select().from(students).where(eq(students.id, id));
    return result || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student as any).returning();
    return created;
  }

  async updateStudent(id: string, updates: Partial<Student>, userId: string): Promise<Student | undefined> {
    const existing = await this.getStudent(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudent(id: string, userId: string): Promise<boolean> {
    const existing = await this.getStudent(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(students).where(eq(students.id, id));
    return true;
  }

  async findStudentBySchoolAndId(organizationId: string, studentIdNumber: string): Promise<(Student & { organizationName?: string }) | undefined> {
    const [result] = await db.select()
      .from(students)
      .where(and(
        eq(students.organizationId, organizationId),
        eq(students.studentId, studentIdNumber)
      ));
    
    if (!result) return undefined;
    
    // Get organization name
    const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
    
    return {
      ...result,
      organizationName: org?.name
    };
  }

  // Class-Student Relationships
  async getClassStudents(classId: string): Promise<Student[]> {
    const enrollments = await db.select().from(classStudents)
      .where(eq(classStudents.classId, classId));
    
    if (enrollments.length === 0) return [];
    
    const studentIds = enrollments.map(e => e.studentId);
    const result: Student[] = [];
    for (const sid of studentIds) {
      const student = await this.getStudent(sid);
      if (student) result.push(student);
    }
    return result;
  }

  async getClassStudent(classId: string, studentId: string): Promise<ClassStudent | undefined> {
    const [result] = await db.select().from(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return result || undefined;
  }

  async addStudentToClass(classId: string, studentId: string): Promise<ClassStudent> {
    const classData = await this.getClass(classId);
    if (!classData) {
      throw new Error("Class not found");
    }
    
    const currentStudents = await this.getClassStudents(classId);
    const maxStudents = classData.maxStudents || 35;
    
    if (currentStudents.length >= maxStudents) {
      throw new Error(`Class has reached maximum capacity of ${maxStudents} students`);
    }
    
    const [created] = await db.insert(classStudents)
      .values({ classId, studentId } as any)
      .returning();
    return created;
  }

  async enrollStudent(enrollment: InsertClassStudent): Promise<ClassStudent> {
    const classData = await this.getClass(enrollment.classId);
    if (!classData) {
      throw new Error("Class not found");
    }
    
    const currentStudents = await this.getClassStudents(enrollment.classId);
    const maxStudents = classData.maxStudents || 35;
    
    if (currentStudents.length >= maxStudents) {
      throw new Error(`Class has reached maximum capacity of ${maxStudents} students`);
    }
    
    const [created] = await db.insert(classStudents)
      .values(enrollment as any)
      .returning();
    return created;
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<boolean> {
    await db.delete(classStudents)
      .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)));
    return true;
  }

  // Organization-Scoped Classroom Access
  async getClassesByOrganization(organizationId: string): Promise<Class[]> {
    return await db.select().from(classes)
      .where(eq(classes.organizationId, organizationId))
      .orderBy(desc(classes.createdAt));
  }

  async getStudentsByOrganization(organizationId: string): Promise<Student[]> {
    return await db.select().from(students)
      .where(eq(students.organizationId, organizationId))
      .orderBy(asc(students.lastName), asc(students.firstName));
  }

  async getClassesByOrganizationHierarchy(organizationId: string): Promise<Class[]> {
    const childOrgs = await this.getChildOrganizations(organizationId);
    const orgIds = [organizationId, ...childOrgs.map(o => o.id)];
    
    const allClasses: Class[] = [];
    for (const orgId of orgIds) {
      const orgClasses = await this.getClassesByOrganization(orgId);
      allClasses.push(...orgClasses);
    }
    return allClasses.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getStudentsByOrganizationHierarchy(organizationId: string): Promise<Student[]> {
    const childOrgs = await this.getChildOrganizations(organizationId);
    const orgIds = [organizationId, ...childOrgs.map(o => o.id)];
    
    const allStudents: Student[] = [];
    for (const orgId of orgIds) {
      const orgStudents = await this.getStudentsByOrganization(orgId);
      allStudents.push(...orgStudents);
    }
    return allStudents.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  // Entity Sharing
  async createEntityShare(share: InsertEntityShare): Promise<EntityShare> {
    const [result] = await db.insert(entityShares).values(share as any).returning();
    return result;
  }

  async getEntityShare(id: string): Promise<EntityShare | undefined> {
    const [result] = await db.select().from(entityShares).where(eq(entityShares.id, id));
    return result || undefined;
  }

  async getEntityShares(entityType: string, entityId: string): Promise<EntityShare[]> {
    return await db.select().from(entityShares)
      .where(and(eq(entityShares.entityType, entityType as any), eq(entityShares.entityId, entityId)))
      .orderBy(desc(entityShares.createdAt));
  }

  async getSharedWithOrganization(targetOrganizationId: string): Promise<EntityShare[]> {
    return await db.select().from(entityShares)
      .where(eq(entityShares.targetOrganizationId, targetOrganizationId))
      .orderBy(desc(entityShares.createdAt));
  }

  async deleteEntityShare(id: string): Promise<boolean> {
    await db.delete(entityShares).where(eq(entityShares.id, id));
    return true;
  }

  // Student Groups
  async getStudentGroups(userId: string): Promise<StudentGroup[]> {
    return await db.select().from(studentGroups)
      .where(eq(studentGroups.userId, userId))
      .orderBy(desc(studentGroups.createdAt));
  }

  async getStudentGroup(id: string): Promise<StudentGroup | undefined> {
    const [result] = await db.select().from(studentGroups).where(eq(studentGroups.id, id));
    return result || undefined;
  }

  async createStudentGroup(group: InsertStudentGroup): Promise<StudentGroup> {
    const [created] = await db.insert(studentGroups).values(group as any).returning();
    return created;
  }

  async updateStudentGroup(id: string, updates: Partial<StudentGroup>, userId: string): Promise<StudentGroup | undefined> {
    const existing = await this.getStudentGroup(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(studentGroups)
      .set(updates)
      .where(eq(studentGroups.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentGroup(id: string, userId: string): Promise<boolean> {
    const existing = await this.getStudentGroup(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(studentGroups).where(eq(studentGroups.id, id));
    return true;
  }

  // Assignments
  async getAssignments(userId: string): Promise<Assignment[]> {
    return await db.select().from(assignments)
      .where(eq(assignments.userId, userId))
      .orderBy(desc(assignments.createdAt));
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [result] = await db.select().from(assignments).where(eq(assignments.id, id));
    return result || undefined;
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [created] = await db.insert(assignments).values(assignment as any).returning();
    return created;
  }

  async updateAssignment(id: string, updates: Partial<Assignment>, userId: string): Promise<Assignment | undefined> {
    const existing = await this.getAssignment(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAssignment(id: string, userId: string): Promise<boolean> {
    const existing = await this.getAssignment(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(assignments).where(eq(assignments.id, id));
    return true;
  }

  // Assignment Recipients
  async getAssignmentRecipients(assignmentId: string): Promise<AssignmentRecipient[]> {
    return await db.select().from(assignmentRecipients)
      .where(eq(assignmentRecipients.assignmentId, assignmentId));
  }

  async getAssignmentsForStudent(studentId: string): Promise<{ assignment: Assignment; recipient: AssignmentRecipient }[]> {
    const recipients = await db.select().from(assignmentRecipients)
      .where(and(
        eq(assignmentRecipients.recipientType, "student"),
        eq(assignmentRecipients.recipientId, studentId)
      ));
    
    const result: { assignment: Assignment; recipient: AssignmentRecipient }[] = [];
    for (const recipient of recipients) {
      const assignment = await this.getAssignment(recipient.assignmentId);
      if (assignment) {
        result.push({ assignment, recipient });
      }
    }
    return result;
  }

  async createAssignmentRecipient(recipient: InsertAssignmentRecipient): Promise<AssignmentRecipient> {
    const [created] = await db.insert(assignmentRecipients).values(recipient as any).returning();
    return created;
  }

  async updateAssignmentRecipient(id: string, updates: Partial<AssignmentRecipient>): Promise<AssignmentRecipient | undefined> {
    const [updated] = await db.update(assignmentRecipients)
      .set(updates)
      .where(eq(assignmentRecipients.id, id))
      .returning();
    return updated || undefined;
  }

  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    return await db.select().from(assignments)
      .where(eq(assignments.classId, classId))
      .orderBy(desc(assignments.createdAt));
  }

  // Gradebook System Implementation
  async getGradeCategories(classId: string): Promise<GradeCategory[]> {
    return await db.select().from(gradeCategories)
      .where(eq(gradeCategories.classId, classId))
      .orderBy(gradeCategories.name);
  }

  async createGradeCategory(category: InsertGradeCategory): Promise<GradeCategory> {
    const [created] = await db.insert(gradeCategories).values(category as any).returning();
    return created;
  }

  async updateGradeCategory(id: string, updates: Partial<GradeCategory>, userId: string): Promise<GradeCategory | undefined> {
    const [existing] = await db.select().from(gradeCategories).where(eq(gradeCategories.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    const [updated] = await db.update(gradeCategories)
      .set(updates)
      .where(eq(gradeCategories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGradeCategory(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(gradeCategories).where(eq(gradeCategories.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(gradeCategories).where(eq(gradeCategories.id, id));
    return true;
  }

  async getStudentGrades(classId: string): Promise<StudentGrade[]> {
    return await db.select().from(studentGrades)
      .where(eq(studentGrades.classId, classId))
      .orderBy(desc(studentGrades.gradedAt));
  }

  async getStudentGradesByStudent(studentId: string): Promise<StudentGrade[]> {
    return await db.select().from(studentGrades)
      .where(eq(studentGrades.studentId, studentId))
      .orderBy(desc(studentGrades.gradedAt));
  }

  async createStudentGrade(grade: InsertStudentGrade): Promise<StudentGrade> {
    // Calculate percentage and letter grade if not provided
    const percentage = grade.pointsEarned !== undefined && grade.pointsEarned !== null
      ? Math.round((grade.pointsEarned / (grade.pointsPossible || 100)) * 100)
      : undefined;
    const letterGrade = percentage !== undefined ? this.calculateLetterGrade(percentage) : undefined;
    
    const [created] = await db.insert(studentGrades).values({
      ...grade,
      percentage,
      letterGrade,
    } as any).returning();
    return created;
  }

  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  }

  async updateStudentGrade(id: string, updates: Partial<StudentGrade>, userId: string): Promise<StudentGrade | undefined> {
    const [existing] = await db.select().from(studentGrades).where(eq(studentGrades.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    
    // Recalculate percentage if points changed
    let percentage = updates.percentage;
    let letterGrade = updates.letterGrade;
    if (updates.pointsEarned !== undefined || updates.pointsPossible !== undefined) {
      const earned = updates.pointsEarned ?? existing.pointsEarned;
      const possible = updates.pointsPossible ?? existing.pointsPossible;
      if (earned !== null && earned !== undefined) {
        percentage = Math.round((earned / (possible || 100)) * 100);
        letterGrade = this.calculateLetterGrade(percentage);
      }
    }
    
    const [updated] = await db.update(studentGrades)
      .set({ ...updates, percentage, letterGrade, updatedAt: new Date() })
      .where(eq(studentGrades.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentGrade(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentGrades).where(eq(studentGrades.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(studentGrades).where(eq(studentGrades.id, id));
    return true;
  }

  async bulkUpdateStudentGrades(gradesData: { id: string; pointsEarned: number; comments?: string }[], userId: string): Promise<StudentGrade[]> {
    const results: StudentGrade[] = [];
    for (const g of gradesData) {
      const updated = await this.updateStudentGrade(g.id, { 
        pointsEarned: g.pointsEarned,
        comments: g.comments,
      }, userId);
      if (updated) results.push(updated);
    }
    return results;
  }

  async getGradingPeriods(userId: string): Promise<GradingPeriod[]> {
    return await db.select().from(gradingPeriods)
      .where(eq(gradingPeriods.userId, userId))
      .orderBy(gradingPeriods.startDate);
  }

  async createGradingPeriod(period: InsertGradingPeriod): Promise<GradingPeriod> {
    const [created] = await db.insert(gradingPeriods).values(period as any).returning();
    return created;
  }

  async updateGradingPeriod(id: string, updates: Partial<GradingPeriod>, userId: string): Promise<GradingPeriod | undefined> {
    const [existing] = await db.select().from(gradingPeriods).where(eq(gradingPeriods.id, id));
    if (!existing || existing.userId !== userId) return undefined;
    const [updated] = await db.update(gradingPeriods)
      .set(updates)
      .where(eq(gradingPeriods.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGradingPeriod(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(gradingPeriods).where(eq(gradingPeriods.id, id));
    if (!existing || existing.userId !== userId) return false;
    await db.delete(gradingPeriods).where(eq(gradingPeriods.id, id));
    return true;
  }

  async getStudentsByAccommodations(accommodationTypes: string[], classId?: string): Promise<Student[]> {
    // Get all students
    let allStudents: Student[];
    if (classId) {
      // Get students in specific class
      const classStudentsList = await db.select().from(classStudents)
        .where(eq(classStudents.classId, classId));
      const studentIds = classStudentsList.map(cs => cs.studentId);
      if (studentIds.length === 0) return [];
      allStudents = await db.select().from(students)
        .where(inArray(students.id, studentIds));
    } else {
      allStudents = await db.select().from(students);
    }

    // Filter students that have any of the specified accommodation types
    return allStudents.filter(student => {
      if (!student.accommodations || !Array.isArray(student.accommodations)) return false;
      const studentAccommodationTypes = (student.accommodations as any[])
        .filter(a => a.active)
        .map(a => a.type);
      return accommodationTypes.some(type => studentAccommodationTypes.includes(type));
    });
  }

  // ================================
  // Real-Time Collaboration System
  // ================================

  // Collaboration Sessions
  async getCollaborationSessions(userId: string): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.hostUserId, userId))
      .orderBy(desc(collaborationSessions.createdAt));
  }

  async getActiveCollaborationSessions(userId: string): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(and(
        eq(collaborationSessions.hostUserId, userId),
        eq(collaborationSessions.status, "active")
      ))
      .orderBy(desc(collaborationSessions.createdAt));
  }

  async getCollaborationSession(id: string): Promise<CollaborationSession | undefined> {
    const [result] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.id, id));
    return result || undefined;
  }

  async getCollaborationSessionByInviteCode(inviteCode: string): Promise<CollaborationSession | undefined> {
    const [result] = await db.select().from(collaborationSessions)
      .where(eq(collaborationSessions.inviteCode, inviteCode));
    return result || undefined;
  }

  async createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession> {
    const [created] = await db.insert(collaborationSessions)
      .values(session as any)
      .returning();
    return created;
  }

  async updateCollaborationSession(id: string, updates: Partial<CollaborationSession>, hostUserId: string): Promise<CollaborationSession | undefined> {
    const existing = await this.getCollaborationSession(id);
    if (!existing || existing.hostUserId !== hostUserId) return undefined;
    
    const [updated] = await db.update(collaborationSessions)
      .set(updates)
      .where(eq(collaborationSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async endCollaborationSession(id: string, hostUserId: string): Promise<CollaborationSession | undefined> {
    return await this.updateCollaborationSession(id, { 
      status: "ended", 
      endedAt: new Date() 
    }, hostUserId);
  }

  // Session Participants
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId))
      .orderBy(desc(sessionParticipants.joinedAt));
  }

  async getActiveSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return await db.select().from(sessionParticipants)
      .where(and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.status, "active")
      ));
  }

  async getSessionParticipant(sessionId: string, userId: string): Promise<SessionParticipant | undefined> {
    const [result] = await db.select().from(sessionParticipants)
      .where(and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      ));
    return result || undefined;
  }

  async createSessionParticipant(participant: InsertSessionParticipant): Promise<SessionParticipant> {
    const [created] = await db.insert(sessionParticipants)
      .values(participant as any)
      .returning();
    return created;
  }

  async updateSessionParticipant(id: string, updates: Partial<SessionParticipant>): Promise<SessionParticipant | undefined> {
    const [updated] = await db.update(sessionParticipants)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(eq(sessionParticipants.id, id))
      .returning();
    return updated || undefined;
  }

  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    const participant = await this.getSessionParticipant(sessionId, userId);
    if (!participant) return false;
    
    await db.update(sessionParticipants)
      .set({ status: "left", leftAt: new Date() })
      .where(eq(sessionParticipants.id, participant.id));
    return true;
  }

  // Collaboration Messages
  async getCollaborationMessages(sessionId: string, limit = 50): Promise<CollaborationMessage[]> {
    return await db.select().from(collaborationMessages)
      .where(eq(collaborationMessages.sessionId, sessionId))
      .orderBy(desc(collaborationMessages.createdAt))
      .limit(limit);
  }

  async createCollaborationMessage(message: InsertCollaborationMessage): Promise<CollaborationMessage> {
    const [created] = await db.insert(collaborationMessages)
      .values(message as any)
      .returning();
    return created;
  }

  // Shared Resources
  async getSharedResources(filters?: { visibility?: string; category?: string; subject?: string }): Promise<SharedResource[]> {
    let query = db.select().from(sharedResources);
    
    if (filters?.visibility) {
      query = query.where(eq(sharedResources.visibility, filters.visibility)) as any;
    }
    
    return await query.orderBy(desc(sharedResources.createdAt));
  }

  async getUserSharedResources(userId: string): Promise<SharedResource[]> {
    return await db.select().from(sharedResources)
      .where(eq(sharedResources.userId, userId))
      .orderBy(desc(sharedResources.createdAt));
  }

  async getSharedResource(id: string): Promise<SharedResource | undefined> {
    const [result] = await db.select().from(sharedResources)
      .where(eq(sharedResources.id, id));
    return result || undefined;
  }

  async createSharedResource(resource: InsertSharedResource): Promise<SharedResource> {
    const [created] = await db.insert(sharedResources)
      .values(resource as any)
      .returning();
    return created;
  }

  async updateSharedResource(id: string, updates: Partial<SharedResource>, userId: string): Promise<SharedResource | undefined> {
    const existing = await this.getSharedResource(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const [updated] = await db.update(sharedResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sharedResources.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSharedResource(id: string, userId: string): Promise<boolean> {
    const existing = await this.getSharedResource(id);
    if (!existing || existing.userId !== userId) return false;
    
    await db.delete(sharedResources).where(eq(sharedResources.id, id));
    return true;
  }

  async incrementResourceDownload(id: string): Promise<void> {
    const resource = await this.getSharedResource(id);
    if (resource) {
      await db.update(sharedResources)
        .set({ downloadCount: (resource.downloadCount || 0) + 1 })
        .where(eq(sharedResources.id, id));
    }
  }

  // Resource Likes
  async getResourceLike(resourceId: string, userId: string): Promise<ResourceLike | undefined> {
    const [result] = await db.select().from(resourceLikes)
      .where(and(
        eq(resourceLikes.resourceId, resourceId),
        eq(resourceLikes.userId, userId)
      ));
    return result || undefined;
  }

  async toggleResourceLike(resourceId: string, userId: string): Promise<boolean> {
    const existing = await this.getResourceLike(resourceId, userId);
    const resource = await this.getSharedResource(resourceId);
    
    if (!resource) return false;
    
    if (existing) {
      await db.delete(resourceLikes).where(eq(resourceLikes.id, existing.id));
      await db.update(sharedResources)
        .set({ likeCount: Math.max(0, (resource.likeCount || 0) - 1) })
        .where(eq(sharedResources.id, resourceId));
      return false;
    } else {
      await db.insert(resourceLikes).values({ resourceId, userId } as any);
      await db.update(sharedResources)
        .set({ likeCount: (resource.likeCount || 0) + 1 })
        .where(eq(sharedResources.id, resourceId));
      return true;
    }
  }

  // KNOW Resources (Admin-managed educational resources)
  async getKnowResources(filters?: { 
    resourceType?: string; 
    category?: string; 
    isActive?: boolean;
    featured?: boolean;
  }): Promise<KnowResource[]> {
    let conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(knowResources.isActive, filters.isActive));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(knowResources.featured, filters.featured));
    }
    if (filters?.resourceType) {
      conditions.push(eq(knowResources.resourceType as any, filters.resourceType));
    }
    if (filters?.category) {
      conditions.push(eq(knowResources.category, filters.category));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(knowResources)
        .where(and(...conditions))
        .orderBy(knowResources.sortOrder, desc(knowResources.createdAt));
    }
    
    return await db.select().from(knowResources)
      .orderBy(knowResources.sortOrder, desc(knowResources.createdAt));
  }

  async getKnowResource(id: string): Promise<KnowResource | undefined> {
    const [result] = await db.select().from(knowResources)
      .where(eq(knowResources.id, id));
    return result || undefined;
  }

  async createKnowResource(resource: InsertKnowResource): Promise<KnowResource> {
    const [created] = await db.insert(knowResources)
      .values(resource as any)
      .returning();
    return created;
  }

  async updateKnowResource(id: string, updates: Partial<KnowResource>, userId: string): Promise<KnowResource | undefined> {
    const [updated] = await db.update(knowResources)
      .set({ ...updates, updatedBy: userId, updatedAt: new Date() })
      .where(eq(knowResources.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteKnowResource(id: string): Promise<boolean> {
    const result = await db.delete(knowResources).where(eq(knowResources.id, id));
    return true;
  }

  // Marketplace Items
  async getMarketplaceItems(filters?: { audience?: string; itemType?: string; isActive?: boolean }): Promise<MarketplaceItem[]> {
    const conditions: any[] = [];
    if (filters?.isActive !== undefined) conditions.push(eq(marketplaceItems.isActive, filters.isActive));
    if (filters?.audience) conditions.push(eq(marketplaceItems.audience as any, filters.audience));
    if (filters?.itemType) conditions.push(eq(marketplaceItems.itemType as any, filters.itemType));
    const q = conditions.length > 0
      ? db.select().from(marketplaceItems).where(and(...conditions))
      : db.select().from(marketplaceItems);
    return await q.orderBy(desc(marketplaceItems.featured), desc(marketplaceItems.createdAt));
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return item;
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [created] = await db.insert(marketplaceItems).values(item as any).returning();
    return created;
  }

  async updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const [updated] = await db.update(marketplaceItems).set({ ...updates, updatedAt: new Date() }).where(eq(marketplaceItems.id, id)).returning();
    return updated;
  }

  async deleteMarketplaceItem(id: string): Promise<boolean> {
    await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id));
    return true;
  }

  // Marketplace Purchases
  async getUserPurchases(userId: string): Promise<MarketplacePurchase[]> {
    return await db.select().from(marketplacePurchases).where(eq(marketplacePurchases.userId, userId)).orderBy(desc(marketplacePurchases.createdAt));
  }

  async hasPurchased(userId: string, itemId: string): Promise<boolean> {
    const [row] = await db.select().from(marketplacePurchases).where(and(eq(marketplacePurchases.userId, userId), eq(marketplacePurchases.itemId, itemId)));
    return !!row;
  }

  async createPurchase(purchase: InsertMarketplacePurchase): Promise<MarketplacePurchase> {
    const [created] = await db.insert(marketplacePurchases).values(purchase).returning();
    return created;
  }

  // Marketplace Wishlists
  async getWishlist(userId: string): Promise<MarketplaceWishlist[]> {
    return await db.select().from(marketplaceWishlists).where(eq(marketplaceWishlists.userId, userId)).orderBy(desc(marketplaceWishlists.createdAt));
  }

  async addToWishlist(userId: string, itemId: string): Promise<MarketplaceWishlist> {
    const existing = await db.select().from(marketplaceWishlists).where(and(eq(marketplaceWishlists.userId, userId), eq(marketplaceWishlists.itemId, itemId)));
    if (existing[0]) return existing[0];
    const [created] = await db.insert(marketplaceWishlists).values({ userId, itemId }).returning();
    return created;
  }

  async removeFromWishlist(userId: string, itemId: string): Promise<boolean> {
    await db.delete(marketplaceWishlists).where(and(eq(marketplaceWishlists.userId, userId), eq(marketplaceWishlists.itemId, itemId)));
    return true;
  }

  async isInWishlist(userId: string, itemId: string): Promise<boolean> {
    const [row] = await db.select().from(marketplaceWishlists).where(and(eq(marketplaceWishlists.userId, userId), eq(marketplaceWishlists.itemId, itemId)));
    return !!row;
  }

  // Marketplace Ratings
  async getRatingsForItem(itemId: string): Promise<MarketplaceRating[]> {
    return await db.select().from(marketplaceRatings).where(eq(marketplaceRatings.itemId, itemId)).orderBy(desc(marketplaceRatings.createdAt));
  }

  async getUserRating(userId: string, itemId: string): Promise<MarketplaceRating | undefined> {
    const [row] = await db.select().from(marketplaceRatings).where(and(eq(marketplaceRatings.userId, userId), eq(marketplaceRatings.itemId, itemId)));
    return row;
  }

  async upsertRating(userId: string, itemId: string, rating: number, review: string | undefined, verified: boolean): Promise<MarketplaceRating> {
    const existing = await this.getUserRating(userId, itemId);
    if (existing) {
      const [updated] = await db.update(marketplaceRatings).set({ rating, review, updatedAt: new Date() }).where(eq(marketplaceRatings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(marketplaceRatings).values({ userId, itemId, rating, review, verified }).returning();
    return created;
  }

  async getItemAverageRating(itemId: string): Promise<{ avg: number; count: number }> {
    const [result] = await db.select({ avg: sql<number>`avg(rating)`, count: sql<number>`count(*)` }).from(marketplaceRatings).where(eq(marketplaceRatings.itemId, itemId));
    return { avg: parseFloat((result?.avg || 0).toFixed(1)), count: Number(result?.count || 0) };
  }

  // Saved Scholarships
  async getSavedScholarships(userId: string): Promise<SavedScholarship[]> {
    return await db.select().from(savedScholarships).where(eq(savedScholarships.userId, userId)).orderBy(desc(savedScholarships.createdAt));
  }

  async saveScholarship(data: InsertSavedScholarship): Promise<SavedScholarship> {
    const [created] = await db.insert(savedScholarships).values(data).returning();
    return created;
  }

  async unsaveScholarship(userId: string, resourceId: string): Promise<boolean> {
    await db.delete(savedScholarships).where(and(eq(savedScholarships.userId, userId), eq(savedScholarships.resourceId, resourceId)));
    return true;
  }

  async isSavedScholarship(userId: string, resourceId: string): Promise<boolean> {
    const [row] = await db.select().from(savedScholarships).where(and(eq(savedScholarships.userId, userId), eq(savedScholarships.resourceId, resourceId)));
    return !!row;
  }

  // Resource Reports — community moderation for scholarship listings
  async createResourceReport(data: InsertResourceReport): Promise<ResourceReport> {
    const [created] = await db.insert(resourceReports).values(data as any).returning();
    // Auto-hide if pending reports >= threshold
    const pending = await db.select({ id: resourceReports.id }).from(resourceReports)
      .where(and(eq(resourceReports.resourceId, data.resourceId), eq(resourceReports.status, "pending")));
    if (pending.length >= REPORT_AUTOHIDE_THRESHOLD) {
      await db.update(knowResources).set({ isActive: false, updatedAt: new Date() }).where(eq(knowResources.id, data.resourceId));
    }
    return created;
  }

  async listResourceReports(filters?: { status?: string; resourceId?: string }): Promise<ResourceReport[]> {
    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(resourceReports.status, filters.status as any));
    if (filters?.resourceId) conditions.push(eq(resourceReports.resourceId, filters.resourceId));
    const q = conditions.length > 0
      ? db.select().from(resourceReports).where(and(...conditions))
      : db.select().from(resourceReports);
    return await q.orderBy(desc(resourceReports.createdAt));
  }

  async resolveResourceReport(id: string, userId: string, status: "resolved" | "dismissed"): Promise<ResourceReport | undefined> {
    const [updated] = await db.update(resourceReports)
      .set({ status, resolvedBy: userId, resolvedAt: new Date() })
      .where(eq(resourceReports.id, id))
      .returning();
    return updated;
  }

  async countActiveReportsForResource(resourceId: string): Promise<number> {
    const rows = await db.select({ id: resourceReports.id }).from(resourceReports)
      .where(and(eq(resourceReports.resourceId, resourceId), eq(resourceReports.status, "pending")));
    return rows.length;
  }

  async verifyKnowResource(id: string, userId: string): Promise<KnowResource | undefined> {
    const { computeBkdAlignment, parseNextDeadline } = await import("./lib/bkdAlignment");
    const [existing] = await db.select().from(knowResources).where(eq(knowResources.id, id));
    if (!existing) return undefined;

    const now = new Date();
    const refreshed: any = {
      ...existing,
      lastVerifiedAt: now,
      trustLevel: "verified",
    };
    if (!refreshed.nextDeadline) {
      const parsed = parseNextDeadline(existing.scholarshipDeadline);
      if (parsed) refreshed.nextDeadline = parsed;
    }

    const updates: any = {
      lastVerifiedAt: now,
      trustLevel: "verified",
      updatedBy: userId,
      updatedAt: now,
    };
    if (refreshed.nextDeadline && !existing.nextDeadline) {
      updates.nextDeadline = refreshed.nextDeadline;
    }
    if (!(existing as any).bkdManualOverride) {
      updates.bkdAlignment = computeBkdAlignment(refreshed);
    }

    const [updated] = await db.update(knowResources)
      .set(updates)
      .where(eq(knowResources.id, id))
      .returning();
    return updated;
  }

  async bulkVerifyKnowResources(ids: string[], userId: string): Promise<number> {
    if (!ids.length) return 0;
    let count = 0;
    for (const id of ids) {
      const r = await this.verifyKnowResource(id, userId);
      if (r) count++;
    }
    return count;
  }

  // Student Matriculation History (System-Level Tracking)
  async getStudentMatriculationHistory(studentId: string): Promise<StudentMatriculationHistory[]> {
    return await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.studentId, studentId))
      .orderBy(desc(studentMatriculationHistory.eventDate));
  }

  async getStudentMatriculationEvent(id: string): Promise<StudentMatriculationHistory | undefined> {
    const [result] = await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.id, id));
    return result || undefined;
  }

  async createMatriculationEvent(event: InsertStudentMatriculationHistory): Promise<StudentMatriculationHistory> {
    const [created] = await db.insert(studentMatriculationHistory)
      .values(event as any)
      .returning();
    return created;
  }

  async getMatriculationEventsByOrg(organizationId: string): Promise<StudentMatriculationHistory[]> {
    return await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.organizationId, organizationId))
      .orderBy(desc(studentMatriculationHistory.eventDate));
  }

  async getMatriculationEventsByType(eventType: string): Promise<StudentMatriculationHistory[]> {
    return await db.select().from(studentMatriculationHistory)
      .where(eq(studentMatriculationHistory.eventType as any, eventType))
      .orderBy(desc(studentMatriculationHistory.eventDate));
  }

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
  }

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
  }

  async getSystemAchievement(id: string): Promise<SystemAchievement | undefined> {
    const [result] = await db.select().from(systemAchievements)
      .where(eq(systemAchievements.id, id));
    return result || undefined;
  }

  async createSystemAchievement(achievement: InsertSystemAchievement): Promise<SystemAchievement> {
    const [created] = await db.insert(systemAchievements)
      .values(achievement as any)
      .returning();
    return created;
  }

  async updateSystemAchievement(id: string, updates: Partial<SystemAchievement>): Promise<SystemAchievement | undefined> {
    const [updated] = await db.update(systemAchievements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemAchievements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSystemAchievement(id: string): Promise<boolean> {
    await db.delete(systemAchievements).where(eq(systemAchievements.id, id));
    return true;
  }

  // Student Achievements (Earned)
  async getStudentAchievements(studentId: string): Promise<StudentAchievement[]> {
    return await db.select().from(studentAchievements)
      .where(eq(studentAchievements.studentId, studentId))
      .orderBy(desc(studentAchievements.earnedAt));
  }

  async getStudentAchievement(id: string): Promise<StudentAchievement | undefined> {
    const [result] = await db.select().from(studentAchievements)
      .where(eq(studentAchievements.id, id));
    return result || undefined;
  }

  async awardAchievement(achievement: InsertStudentAchievement): Promise<StudentAchievement> {
    const [created] = await db.insert(studentAchievements)
      .values(achievement as any)
      .returning();
    return created;
  }

  async verifyAchievement(id: string, verifiedBy: string): Promise<StudentAchievement | undefined> {
    const [updated] = await db.update(studentAchievements)
      .set({ status: 'verified', verifiedBy, verifiedAt: new Date() })
      .where(eq(studentAchievements.id, id))
      .returning();
    return updated || undefined;
  }

  async revokeAchievement(id: string, reason: string): Promise<StudentAchievement | undefined> {
    const [updated] = await db.update(studentAchievements)
      .set({ status: 'revoked', revokedReason: reason })
      .where(eq(studentAchievements.id, id))
      .returning();
    return updated || undefined;
  }

  async getAchievementsByOrg(organizationId: string): Promise<StudentAchievement[]> {
    return await db.select().from(studentAchievements)
      .where(eq(studentAchievements.organizationId, organizationId))
      .orderBy(desc(studentAchievements.earnedAt));
  }

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
  }

  // Session Edit History
  async getSessionEditHistory(sessionId: string, limit = 100): Promise<SessionEditHistory[]> {
    return await db.select().from(sessionEditHistory)
      .where(eq(sessionEditHistory.sessionId, sessionId))
      .orderBy(desc(sessionEditHistory.createdAt))
      .limit(limit);
  }

  async createSessionEdit(edit: InsertSessionEditHistory): Promise<SessionEditHistory> {
    const [created] = await db.insert(sessionEditHistory)
      .values(edit as any)
      .returning();
    return created;
  }

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
  }

  // Organizations (Multi-Tenant)
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(asc(organizations.name));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.id, id));
    return result || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [result] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return result || undefined;
  }

  async getChildOrganizations(parentId: string): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.parentOrganizationId, parentId));
  }

  async getOrganizationsByType(type: string): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.type, type as any));
  }

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
  }

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
  }

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
  }

  // Validate that a student can be enrolled in a class
  // Enforces: Student and Class should belong to the same school/campus organization
  // Legacy mode: Allows enrollment when both have no organization assigned
  async validateEnrollment(studentId: string, classId: string): Promise<{ valid: boolean; reason?: string }> {
    const student = await this.getStudent(studentId);
    if (!student) {
      return { valid: false, reason: 'Student not found' };
    }

    const classData = await this.getClass(classId);
    if (!classData) {
      return { valid: false, reason: 'Class not found' };
    }

    // Legacy mode: If neither has an organization, allow enrollment
    if (!student.organizationId && !classData.organizationId) {
      return { valid: true };
    }

    // If only one has an org, they need to match
    if (!student.organizationId && classData.organizationId) {
      return { valid: false, reason: 'Student must be assigned to a school before enrolling in an organization-linked class' };
    }
    
    if (student.organizationId && !classData.organizationId) {
      // Allow students with org to enroll in legacy classes
      return { valid: true };
    }

    // Both have organizations - verify they match or are in hierarchy
    const classOrg = await this.getOrganization(classData.organizationId!);
    if (!classOrg) {
      return { valid: false, reason: 'Class organization not found' };
    }
    
    // Optionally verify class org type (soft check - don't fail for legacy data)
    const validClassContainerTypes = ['school', 'campus', 'university'];
    if (classOrg.type && !validClassContainerTypes.includes(classOrg.type)) {
      // Log warning but don't fail - could be legacy or special org type
      console.warn(`Class ${classId} org type '${classOrg.type}' is not a typical school container`);
    }

    // Check if student's organization matches the class organization (same school)
    if (student.organizationId === classData.organizationId) {
      return { valid: true };
    }

    // Check if student's org is within the class org's hierarchy
    // This allows a student at a campus to enroll in a class at the parent school
    const studentHierarchy = await this.getOrganizationHierarchy(student.organizationId!);
    const classOrgInHierarchy = studentHierarchy.some(org => org.id === classData.organizationId);
    
    if (classOrgInHierarchy) {
      return { valid: true };
    }

    // Also check reverse - student's school is a parent of the class's school
    const classHierarchy = await this.getOrganizationHierarchy(classData.organizationId!);
    const studentOrgInClassHierarchy = classHierarchy.some(org => org.id === student.organizationId);
    
    if (studentOrgInClassHierarchy) {
      return { valid: true };
    }

    return { 
      valid: false, 
      reason: 'Student must be enrolled in the same school or a related school as the class' 
    };
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org as any).returning();
    return created;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    await db.delete(organizations).where(eq(organizations.id, id));
    return true;
  }

  // Organization Memberships
  async getOrganizationMembers(orgId: string): Promise<OrgMembership[]> {
    return await db.select().from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, orgId));
  }

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
  }

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
  }

  async getUserOrganizations(userId: string): Promise<OrgMembership[]> {
    return await db.select().from(organizationMemberships)
      .where(eq(organizationMemberships.userId, userId));
  }

  async getOrgMembership(orgId: string, userId: string): Promise<OrgMembership | undefined> {
    const [result] = await db.select().from(organizationMemberships)
      .where(and(
        eq(organizationMemberships.organizationId, orgId),
        eq(organizationMemberships.userId, userId)
      ));
    return result || undefined;
  }

  async createOrgMembership(membership: InsertOrgMembership): Promise<OrgMembership> {
    const [created] = await db.insert(organizationMemberships).values(membership as any).returning();
    return created;
  }

  async updateOrgMembership(id: string, updates: Partial<OrgMembership>): Promise<OrgMembership | undefined> {
    const [updated] = await db.update(organizationMemberships)
      .set(updates)
      .where(eq(organizationMemberships.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrgMembership(id: string): Promise<boolean> {
    await db.delete(organizationMemberships).where(eq(organizationMemberships.id, id));
    return true;
  }

  // Organization Invitations
  async getOrgInvitations(orgId: string): Promise<OrgInvitation[]> {
    return await db.select().from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, orgId));
  }

  async getOrgInvitationByToken(token: string): Promise<OrgInvitation | undefined> {
    const [result] = await db.select().from(organizationInvitations)
      .where(eq(organizationInvitations.token, token));
    return result || undefined;
  }

  async createOrgInvitation(invitation: InsertOrgInvitation): Promise<OrgInvitation> {
    const [created] = await db.insert(organizationInvitations).values(invitation as any).returning();
    return created;
  }

  async acceptOrgInvitation(token: string, userId: string): Promise<OrgMembership | undefined> {
    const invitation = await this.getOrgInvitationByToken(token);
    if (!invitation || invitation.acceptedAt || new Date() > invitation.expiresAt) {
      return undefined;
    }
    
    await db.update(organizationInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(organizationInvitations.id, invitation.id));
    
    const membership = await this.createOrgMembership({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role || "member",
      status: "active",
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.createdAt,
      joinedAt: new Date(),
    });
    
    return membership;
  }

  async deleteOrgInvitation(id: string): Promise<boolean> {
    await db.delete(organizationInvitations).where(eq(organizationInvitations.id, id));
    return true;
  }

  // Site Administrators
  async getSiteAdmins(): Promise<SiteAdmin[]> {
    return await db.select().from(siteAdmins);
  }

  async getSiteAdmin(userId: string): Promise<SiteAdmin | undefined> {
    const [result] = await db.select().from(siteAdmins).where(eq(siteAdmins.userId, userId));
    return result || undefined;
  }

  async isSiteAdmin(userId: string): Promise<boolean> {
    const admin = await this.getSiteAdmin(userId);
    if (admin) return true;
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    return user?.role === "system_admin" || user?.role === "site_admin";
  }

  async createSiteAdmin(admin: InsertSiteAdmin): Promise<SiteAdmin> {
    const [created] = await db.insert(siteAdmins).values(admin as any).returning();
    return created;
  }

  async deleteSiteAdmin(userId: string): Promise<boolean> {
    await db.delete(siteAdmins).where(eq(siteAdmins.userId, userId));
    return true;
  }

  // Parent Portal
  async getParentStudentLinks(userId: string, role: 'parent' | 'student'): Promise<ParentStudentLink[]> {
    if (role === 'parent') {
      return await db.select().from(parentStudentLinks)
        .where(eq(parentStudentLinks.parentUserId, userId))
        .orderBy(desc(parentStudentLinks.createdAt));
    } else {
      return await db.select().from(parentStudentLinks)
        .where(eq(parentStudentLinks.studentUserId, userId))
        .orderBy(desc(parentStudentLinks.createdAt));
    }
  }

  async getParentStudentLink(id: string): Promise<ParentStudentLink | undefined> {
    const [result] = await db.select().from(parentStudentLinks)
      .where(eq(parentStudentLinks.id, id));
    return result || undefined;
  }

  async getParentStudentLinkByUsers(parentUserId: string, studentUserId: string): Promise<ParentStudentLink | undefined> {
    const [result] = await db.select().from(parentStudentLinks)
      .where(and(
        eq(parentStudentLinks.parentUserId, parentUserId),
        eq(parentStudentLinks.studentUserId, studentUserId)
      ));
    return result || undefined;
  }

  async createParentStudentLink(link: InsertParentStudentLink): Promise<ParentStudentLink> {
    const [created] = await db.insert(parentStudentLinks).values(link as any).returning();
    return created;
  }

  async updateParentStudentLink(id: string, updates: Partial<ParentStudentLink>): Promise<ParentStudentLink | undefined> {
    const [updated] = await db.update(parentStudentLinks)
      .set(updates)
      .where(eq(parentStudentLinks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteParentStudentLink(id: string): Promise<boolean> {
    await db.delete(parentStudentLinks).where(eq(parentStudentLinks.id, id));
    return true;
  }

  // Parent Invitations
  async getParentInvitations(studentUserId: string): Promise<ParentInvitation[]> {
    return await db.select().from(parentInvitations)
      .where(eq(parentInvitations.studentUserId, studentUserId))
      .orderBy(desc(parentInvitations.createdAt));
  }

  async getParentInvitationByToken(token: string): Promise<ParentInvitation | undefined> {
    const [result] = await db.select().from(parentInvitations)
      .where(eq(parentInvitations.token, token));
    return result || undefined;
  }

  async createParentInvitation(invitation: InsertParentInvitation): Promise<ParentInvitation> {
    const [created] = await db.insert(parentInvitations).values(invitation as any).returning();
    return created;
  }

  async updateParentInvitation(id: string, updates: Partial<ParentInvitation>): Promise<ParentInvitation | undefined> {
    const [updated] = await db.update(parentInvitations)
      .set(updates)
      .where(eq(parentInvitations.id, id))
      .returning();
    return updated || undefined;
  }

  async acceptParentInvitation(token: string, parentUserId: string): Promise<ParentStudentLink | undefined> {
    const invitation = await this.getParentInvitationByToken(token);
    if (!invitation || invitation.status !== 'pending' || new Date() > invitation.expiresAt) {
      return undefined;
    }
    
    await db.update(parentInvitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(parentInvitations.id, invitation.id));
    
    const link = await this.createParentStudentLink({
      parentUserId,
      studentUserId: invitation.studentUserId,
      relationship: invitation.relationship,
      status: 'active',
      acceptedAt: new Date(),
    });
    
    return link;
  }

  async deleteParentInvitation(id: string): Promise<boolean> {
    await db.delete(parentInvitations).where(eq(parentInvitations.id, id));
    return true;
  }

  // Parent Progress Notes
  async getParentProgressNotes(linkId: string): Promise<ParentProgressNote[]> {
    return await db.select().from(parentProgressNotes)
      .where(eq(parentProgressNotes.linkId, linkId))
      .orderBy(desc(parentProgressNotes.createdAt));
  }

  async createParentProgressNote(note: InsertParentProgressNote): Promise<ParentProgressNote> {
    const [created] = await db.insert(parentProgressNotes).values(note as any).returning();
    return created;
  }

  async deleteParentProgressNote(id: string, parentUserId: string): Promise<boolean> {
    await db.delete(parentProgressNotes).where(
      and(
        eq(parentProgressNotes.id, id),
        eq(parentProgressNotes.parentUserId, parentUserId)
      )
    );
    return true;
  }

  async getPendingParentRequests(educatorId: string): Promise<any[]> {
    // Get all classes taught by this educator
    const educatorClasses = await db.select().from(classes).where(eq(classes.userId, educatorId));
    if (educatorClasses.length === 0) return [];
    
    const classIds = educatorClasses.map(c => c.id);
    
    // Get all enrolled students in educator's classes
    const enrollments = await db.select().from(classStudents)
      .where(sql`${classStudents.classId} IN (${sql.join(classIds.map(id => sql`${id}`), sql`, `)})`);
    
    if (enrollments.length === 0) return [];
    
    const studentIds = enrollments.map(e => e.studentId);
    
    // Get students to get their userIds
    const enrolledStudents = await db.select().from(students)
      .where(sql`${students.id} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`);
    
    if (enrolledStudents.length === 0) return [];
    
    const studentUserIds = enrolledStudents.map(s => s.userId);
    
    // Get pending parent connection requests for these students
    const pendingLinks = await db.select().from(parentStudentLinks)
      .where(and(
        sql`${parentStudentLinks.studentUserId} IN (${sql.join(studentUserIds.map(id => sql`${id}`), sql`, `)})`,
        eq(parentStudentLinks.status, "pending")
      ));
    
    // Enrich with user info
    const enrichedRequests = await Promise.all(pendingLinks.map(async (link) => {
      const [parent] = await db.select().from(users).where(eq(users.id, link.parentUserId));
      const [studentUser] = await db.select().from(users).where(eq(users.id, link.studentUserId));
      const student = enrolledStudents.find(s => s.userId === link.studentUserId);
      
      return {
        ...link,
        parent: parent ? { id: parent.id, firstName: parent.firstName, lastName: parent.lastName, email: parent.email } : null,
        student: student ? { id: student.id, firstName: student.firstName, lastName: student.lastName, gradeLevel: student.gradeLevel } : null,
        studentUser: studentUser ? { id: studentUser.id, firstName: studentUser.firstName, lastName: studentUser.lastName } : null
      };
    }));
    
    return enrichedRequests;
  }

  // Magic Link
  async getParentInvitationByMagicToken(magicToken: string): Promise<ParentInvitation | undefined> {
    const [inv] = await db.select().from(parentInvitations).where(eq(parentInvitations.magicToken, magicToken));
    return inv || undefined;
  }

  // Quiet Hours
  async getQuietHours(orgId?: string, teacherUserId?: string): Promise<QuietHours[]> {
    const conditions = [];
    if (orgId) conditions.push(eq(quietHours.orgId, orgId));
    if (teacherUserId) conditions.push(eq(quietHours.teacherUserId, teacherUserId));
    const query = conditions.length > 0
      ? db.select().from(quietHours).where(and(...conditions))
      : db.select().from(quietHours);
    return await query.orderBy(asc(quietHours.startTime));
  }

  async getQuietHoursById(id: string): Promise<QuietHours | undefined> {
    const [qh] = await db.select().from(quietHours).where(eq(quietHours.id, id));
    return qh || undefined;
  }

  async createQuietHours(qh: InsertQuietHours): Promise<QuietHours> {
    const [created] = await db.insert(quietHours).values(qh as any).returning();
    return created;
  }

  async updateQuietHours(id: string, updates: Partial<QuietHours>): Promise<QuietHours | undefined> {
    const [updated] = await db.update(quietHours).set({ ...updates, updatedAt: new Date() } as any).where(eq(quietHours.id, id)).returning();
    return updated || undefined;
  }

  async deleteQuietHours(id: string): Promise<boolean> {
    await db.delete(quietHours).where(eq(quietHours.id, id));
    return true;
  }

  async isQuietHoursActive(orgId?: string, teacherUserId?: string): Promise<boolean> {
    const allQH = await this.getQuietHours(orgId, teacherUserId);
    if (allQH.length === 0) return false;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return allQH.some(qh => {
      if (!qh.isActive) return false;
      const days = (qh.daysOfWeek as number[]) || [];
      if (!days.includes(currentDay)) return false;
      return currentTime >= qh.startTime && currentTime <= qh.endTime;
    });
  }

  // Parent Broadcast Posts
  async getParentBroadcastPosts(filters?: { orgId?: string; classId?: string; audience?: string }): Promise<ParentBroadcastPost[]> {
    const conditions = [eq(parentBroadcastPosts.isActive, true)];
    if (filters?.orgId) conditions.push(eq(parentBroadcastPosts.orgId, filters.orgId));
    if (filters?.classId) conditions.push(eq(parentBroadcastPosts.classId, filters.classId));
    if (filters?.audience) conditions.push(eq(parentBroadcastPosts.audience, filters.audience));
    return await db.select().from(parentBroadcastPosts).where(and(...conditions)).orderBy(desc(parentBroadcastPosts.isPinned), desc(parentBroadcastPosts.createdAt));
  }

  async getParentBroadcastPost(id: string): Promise<ParentBroadcastPost | undefined> {
    const [post] = await db.select().from(parentBroadcastPosts).where(eq(parentBroadcastPosts.id, id));
    return post || undefined;
  }

  async createParentBroadcastPost(post: InsertParentBroadcastPost): Promise<ParentBroadcastPost> {
    const [created] = await db.insert(parentBroadcastPosts).values(post as any).returning();
    return created;
  }

  async updateParentBroadcastPost(id: string, updates: Partial<ParentBroadcastPost>): Promise<ParentBroadcastPost | undefined> {
    const [updated] = await db.update(parentBroadcastPosts).set({ ...updates, updatedAt: new Date() } as any).where(eq(parentBroadcastPosts.id, id)).returning();
    return updated || undefined;
  }

  async deleteParentBroadcastPost(id: string): Promise<boolean> {
    await db.update(parentBroadcastPosts).set({ isActive: false } as any).where(eq(parentBroadcastPosts.id, id));
    return true;
  }

  // Parent Notification Preferences
  async getParentNotificationPreferences(parentUserId: string, linkId: string): Promise<ParentNotificationPreferences | undefined> {
    const [prefs] = await db.select().from(parentNotificationPreferences)
      .where(and(eq(parentNotificationPreferences.parentUserId, parentUserId), eq(parentNotificationPreferences.linkId, linkId)));
    return prefs || undefined;
  }

  async upsertParentNotificationPreferences(prefs: InsertParentNotificationPreferences): Promise<ParentNotificationPreferences> {
    const existing = await this.getParentNotificationPreferences(prefs.parentUserId, prefs.linkId);
    if (existing) {
      const [updated] = await db.update(parentNotificationPreferences)
        .set({ preferences: prefs.preferences, updatedAt: new Date() } as any)
        .where(eq(parentNotificationPreferences.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(parentNotificationPreferences).values(prefs as any).returning();
    return created;
  }

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
  }

  async createPortfolioReport(report: InsertPortfolioReport): Promise<PortfolioReport> {
    const [created] = await db.insert(portfolioReports).values(report as any).returning();
    return created;
  }

  async updatePortfolioReport(id: string, updates: Partial<PortfolioReport>): Promise<PortfolioReport | undefined> {
    const [updated] = await db.update(portfolioReports).set(updates as any).where(eq(portfolioReports.id, id)).returning();
    return updated || undefined;
  }

  // Parent Messages (1-to-1)
  async getOrCreateMessageThread(participantA: string, participantB: string, linkId?: string): Promise<ParentMessageThread> {
    const [existing] = await db.select().from(parentMessageThreads).where(
      sql`(${parentMessageThreads.participantA} = ${participantA} AND ${parentMessageThreads.participantB} = ${participantB})
       OR (${parentMessageThreads.participantA} = ${participantB} AND ${parentMessageThreads.participantB} = ${participantA})`
    );
    if (existing) return existing;
    const [created] = await db.insert(parentMessageThreads).values({ participantA, participantB, linkId } as any).returning();
    return created;
  }

  async getMessageThreadsForUser(userId: string): Promise<(ParentMessageThread & { lastMessage?: ParentMessage; otherParticipant?: any })[]> {
    const threads = await db.select().from(parentMessageThreads).where(
      sql`${parentMessageThreads.participantA} = ${userId} OR ${parentMessageThreads.participantB} = ${userId}`
    ).orderBy(desc(parentMessageThreads.lastMessageAt));

    return await Promise.all(threads.map(async (thread) => {
      const [lastMessage] = await db.select().from(parentMessages).where(eq(parentMessages.threadId, thread.id)).orderBy(desc(parentMessages.createdAt)).limit(1);
      const otherId = thread.participantA === userId ? thread.participantB : thread.participantA;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherId));
      return { ...thread, lastMessage: lastMessage || undefined, otherParticipant: otherUser ? { id: otherUser.id, firstName: otherUser.firstName, lastName: otherUser.lastName, profileImageUrl: otherUser.profileImageUrl, role: otherUser.role } : undefined };
    }));
  }

  async getMessagesForThread(threadId: string, limit = 50): Promise<ParentMessage[]> {
    return await db.select().from(parentMessages).where(eq(parentMessages.threadId, threadId)).orderBy(asc(parentMessages.createdAt)).limit(limit);
  }

  async createParentMessage(message: InsertParentMessage): Promise<ParentMessage> {
    const [created] = await db.insert(parentMessages).values(message as any).returning();
    await db.update(parentMessageThreads).set({ lastMessageAt: new Date() } as any).where(eq(parentMessageThreads.id, message.threadId));
    return created;
  }

  async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    await db.update(parentMessages).set({ isRead: true } as any).where(
      and(eq(parentMessages.threadId, threadId), sql`${parentMessages.senderUserId} != ${userId}`, eq(parentMessages.isRead, false))
    );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const threads = await db.select().from(parentMessageThreads).where(
      sql`${parentMessageThreads.participantA} = ${userId} OR ${parentMessageThreads.participantB} = ${userId}`
    );
    if (threads.length === 0) return 0;
    const threadIds = threads.map(t => t.id);
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(parentMessages).where(
      and(
        sql`${parentMessages.threadId} IN (${sql.join(threadIds.map(id => sql`${id}`), sql`, `)})`,
        sql`${parentMessages.senderUserId} != ${userId}`,
        eq(parentMessages.isRead, false)
      )
    );
    return Number(result?.count || 0);
  }

  // Feature Flags
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags).orderBy(asc(featureFlags.name));
  }

  async getFeatureFlag(id: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.id, id));
    return flag || undefined;
  }

  async getFeatureFlagByName(name: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.name, name));
    return flag || undefined;
  }

  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const [created] = await db.insert(featureFlags).values(flag as any).returning();
    return created;
  }

  async updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    const [updated] = await db.update(featureFlags)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(featureFlags.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFeatureFlag(id: string): Promise<boolean> {
    await db.delete(featureFlags).where(eq(featureFlags.id, id));
    return true;
  }

  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template as any).returning();
    return created;
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return true;
  }

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
  }

  async getAuthority(id: string): Promise<Authority | undefined> {
    const [authority] = await db.select().from(authorities).where(eq(authorities.id, id));
    return authority || undefined;
  }

  async getAuthorityByCode(code: string): Promise<Authority | undefined> {
    const [authority] = await db.select().from(authorities).where(eq(authorities.code, code));
    return authority || undefined;
  }

  async getChildAuthorities(parentId: string): Promise<Authority[]> {
    return await db.select().from(authorities)
      .where(eq(authorities.parentId, parentId))
      .orderBy(asc(authorities.name));
  }

  async createAuthority(authority: InsertAuthority): Promise<Authority> {
    const [created] = await db.insert(authorities).values(authority as any).returning();
    return created;
  }

  async updateAuthority(id: string, updates: Partial<Authority>): Promise<Authority | undefined> {
    const [updated] = await db.update(authorities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(authorities.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAuthority(id: string): Promise<boolean> {
    await db.delete(authorities).where(eq(authorities.id, id));
    return true;
  }

  // ==========================================================================
  // LYS Milestones (Being, Knowing, Doing)
  // ==========================================================================

  async getLyseMilestones(userId: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(eq(lyseMilestones.userId, userId))
      .orderBy(asc(lyseMilestones.dueDate));
  }

  async getLyseMilestone(id: string): Promise<LyseMilestone | undefined> {
    const [milestone] = await db.select().from(lyseMilestones).where(eq(lyseMilestones.id, id));
    return milestone || undefined;
  }

  async getLyseMilestonesByCategory(userId: string, category: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(and(
        eq(lyseMilestones.userId, userId),
        eq(lyseMilestones.category, category as any)
      ))
      .orderBy(asc(lyseMilestones.dueDate));
  }

  async getGatekeeperMilestones(userId: string): Promise<LyseMilestone[]> {
    return await db.select().from(lyseMilestones)
      .where(and(
        eq(lyseMilestones.userId, userId),
        eq(lyseMilestones.isGatekeeper, true)
      ))
      .orderBy(asc(lyseMilestones.dueDate));
  }

  async createLyseMilestone(milestone: InsertLyseMilestone): Promise<LyseMilestone> {
    const [created] = await db.insert(lyseMilestones).values(milestone as any).returning();
    return created;
  }

  async updateLyseMilestone(id: string, updates: Partial<LyseMilestone>): Promise<LyseMilestone | undefined> {
    const [updated] = await db.update(lyseMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lyseMilestones.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLyseMilestone(id: string, userId: string): Promise<boolean> {
    await db.delete(lyseMilestones).where(
      and(eq(lyseMilestones.id, id), eq(lyseMilestones.userId, userId))
    );
    return true;
  }

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
  }

  async getWorkforceTrend(id: string): Promise<WorkforceTrend | undefined> {
    const [trend] = await db.select().from(workforceTrends).where(eq(workforceTrends.id, id));
    return trend || undefined;
  }

  async createWorkforceTrend(trend: InsertWorkforceTrend): Promise<WorkforceTrend> {
    const [created] = await db.insert(workforceTrends).values(trend as any).returning();
    return created;
  }

  async updateWorkforceTrend(id: string, updates: Partial<WorkforceTrend>): Promise<WorkforceTrend | undefined> {
    const [updated] = await db.update(workforceTrends)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(workforceTrends.id, id))
      .returning();
    return updated || undefined;
  }

  // ==========================================================================
  // Alignment Matrix
  // ==========================================================================

  async getAlignmentMatrices(): Promise<AlignmentMatrix[]> {
    return await db.select().from(alignmentMatrix).orderBy(asc(alignmentMatrix.createdAt));
  }

  async getAlignmentMatrix(id: string): Promise<AlignmentMatrix | undefined> {
    const [matrix] = await db.select().from(alignmentMatrix).where(eq(alignmentMatrix.id, id));
    return matrix || undefined;
  }

  async getAlignmentMatrixByAuthority(authorityId: string): Promise<AlignmentMatrix | undefined> {
    const [matrix] = await db.select().from(alignmentMatrix).where(eq(alignmentMatrix.authorityId, authorityId));
    return matrix || undefined;
  }

  async createAlignmentMatrix(matrix: InsertAlignmentMatrix): Promise<AlignmentMatrix> {
    const [created] = await db.insert(alignmentMatrix).values(matrix as any).returning();
    return created;
  }

  async updateAlignmentMatrix(id: string, updates: Partial<AlignmentMatrix>): Promise<AlignmentMatrix | undefined> {
    const [updated] = await db.update(alignmentMatrix)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(alignmentMatrix.id, id))
      .returning();
    return updated || undefined;
  }

  // ==========================================================================
  // Professional Development System
  // ==========================================================================

  async getEducatorCareerGoals(userId: string): Promise<EducatorCareerGoal[]> {
    return await db.select().from(educatorCareerGoals)
      .where(eq(educatorCareerGoals.userId, userId))
      .orderBy(desc(educatorCareerGoals.priority), desc(educatorCareerGoals.createdAt));
  }

  async getEducatorCareerGoal(id: string): Promise<EducatorCareerGoal | undefined> {
    const [goal] = await db.select().from(educatorCareerGoals).where(eq(educatorCareerGoals.id, id));
    return goal || undefined;
  }

  async createEducatorCareerGoal(goal: InsertEducatorCareerGoal): Promise<EducatorCareerGoal> {
    const [created] = await db.insert(educatorCareerGoals).values(goal as any).returning();
    return created;
  }

  async updateEducatorCareerGoal(id: string, userId: string, updates: Partial<EducatorCareerGoal>): Promise<EducatorCareerGoal | undefined> {
    const [updated] = await db.update(educatorCareerGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorCareerGoals.id, id), eq(educatorCareerGoals.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteEducatorCareerGoal(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(educatorCareerGoals)
      .where(and(eq(educatorCareerGoals.id, id), eq(educatorCareerGoals.userId, userId)));
    return true;
  }

  async getEducatorSkills(userId: string): Promise<EducatorSkill[]> {
    return await db.select().from(educatorSkills)
      .where(eq(educatorSkills.userId, userId))
      .orderBy(asc(educatorSkills.category), asc(educatorSkills.skillName));
  }

  async getEducatorSkill(id: string): Promise<EducatorSkill | undefined> {
    const [skill] = await db.select().from(educatorSkills).where(eq(educatorSkills.id, id));
    return skill || undefined;
  }

  async createEducatorSkill(skill: InsertEducatorSkill): Promise<EducatorSkill> {
    const [created] = await db.insert(educatorSkills).values(skill as any).returning();
    return created;
  }

  async updateEducatorSkill(id: string, userId: string, updates: Partial<EducatorSkill>): Promise<EducatorSkill | undefined> {
    const [updated] = await db.update(educatorSkills)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorSkills.id, id), eq(educatorSkills.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteEducatorSkill(id: string, userId: string): Promise<boolean> {
    await db.delete(educatorSkills)
      .where(and(eq(educatorSkills.id, id), eq(educatorSkills.userId, userId)));
    return true;
  }

  async getPDResources(filters?: { resourceType?: string; skillsAddressed?: string[]; isActive?: boolean }): Promise<PDResource[]> {
    let query = db.select().from(pdResources);
    if (filters?.isActive !== undefined) {
      query = query.where(eq(pdResources.isActive, filters.isActive)) as any;
    }
    if (filters?.resourceType) {
      query = query.where(eq(pdResources.resourceType, filters.resourceType)) as any;
    }
    return await query.orderBy(desc(pdResources.rating), desc(pdResources.completionCount));
  }

  async getPDResource(id: string): Promise<PDResource | undefined> {
    const [resource] = await db.select().from(pdResources).where(eq(pdResources.id, id));
    return resource || undefined;
  }

  async createPDResource(resource: InsertPDResource): Promise<PDResource> {
    const [created] = await db.insert(pdResources).values(resource as any).returning();
    return created;
  }

  async updatePDResource(id: string, updates: Partial<PDResource>): Promise<PDResource | undefined> {
    const [updated] = await db.update(pdResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pdResources.id, id))
      .returning();
    return updated || undefined;
  }

  async getPDRecommendations(userId: string, status?: string): Promise<PDRecommendation[]> {
    if (status) {
      return await db.select().from(pdRecommendations)
        .where(and(eq(pdRecommendations.userId, userId), eq(pdRecommendations.status, status)))
        .orderBy(desc(pdRecommendations.priority), desc(pdRecommendations.createdAt));
    }
    return await db.select().from(pdRecommendations)
      .where(eq(pdRecommendations.userId, userId))
      .orderBy(desc(pdRecommendations.priority), desc(pdRecommendations.createdAt));
  }

  async getPDRecommendation(id: string): Promise<PDRecommendation | undefined> {
    const [rec] = await db.select().from(pdRecommendations).where(eq(pdRecommendations.id, id));
    return rec || undefined;
  }

  async createPDRecommendation(rec: InsertPDRecommendation): Promise<PDRecommendation> {
    const [created] = await db.insert(pdRecommendations).values(rec as any).returning();
    return created;
  }

  async updatePDRecommendationStatus(id: string, userId: string, status: string): Promise<PDRecommendation | undefined> {
    const [updated] = await db.update(pdRecommendations)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(pdRecommendations.id, id), eq(pdRecommendations.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async clearUserPDRecommendations(userId: string): Promise<void> {
    await db.delete(pdRecommendations).where(eq(pdRecommendations.userId, userId));
  }

  async getEducatorPDProgress(userId: string): Promise<EducatorPDProgress[]> {
    return await db.select().from(educatorPDProgress)
      .where(eq(educatorPDProgress.userId, userId))
      .orderBy(desc(educatorPDProgress.updatedAt));
  }

  async getEducatorPDProgressItem(id: string): Promise<EducatorPDProgress | undefined> {
    const [progress] = await db.select().from(educatorPDProgress).where(eq(educatorPDProgress.id, id));
    return progress || undefined;
  }

  async createEducatorPDProgress(progress: InsertEducatorPDProgress): Promise<EducatorPDProgress> {
    const [created] = await db.insert(educatorPDProgress).values(progress as any).returning();
    return created;
  }

  async updateEducatorPDProgress(id: string, userId: string, updates: Partial<EducatorPDProgress>): Promise<EducatorPDProgress | undefined> {
    const [updated] = await db.update(educatorPDProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(educatorPDProgress.id, id), eq(educatorPDProgress.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // ================================
  // Student Journey Progress (Be-Know-Do Tracking)
  // ================================

  async getStudentJourneyProgress(studentId: string): Promise<StudentJourneyProgress | undefined> {
    const [progress] = await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.studentId, studentId));
    return progress || undefined;
  }

  async getStudentJourneyProgressByUserId(userId: string): Promise<StudentJourneyProgress | undefined> {
    const [progress] = await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.studentId, userId));
    return progress || undefined;
  }

  async getStudentJourneyProgressByEducator(educatorUserId: string): Promise<StudentJourneyProgress[]> {
    return await db.select().from(studentJourneyProgress)
      .where(eq(studentJourneyProgress.educatorUserId, educatorUserId))
      .orderBy(desc(studentJourneyProgress.lastActivityDate));
  }

  async createStudentJourneyProgress(progress: InsertStudentJourneyProgress): Promise<StudentJourneyProgress> {
    const [created] = await db.insert(studentJourneyProgress).values(progress as any).returning();
    return created;
  }

  async updateStudentJourneyProgress(id: string, updates: Partial<StudentJourneyProgress>): Promise<StudentJourneyProgress | undefined> {
    const [updated] = await db.update(studentJourneyProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentJourneyProgress.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentJourneyProgress(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyProgress).where(eq(studentJourneyProgress.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Student Journey Milestones
  async getStudentJourneyMilestones(journeyProgressId: string): Promise<StudentJourneyMilestone[]> {
    return await db.select().from(studentJourneyMilestones)
      .where(eq(studentJourneyMilestones.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyMilestones.createdAt));
  }

  async getStudentJourneyMilestone(id: string): Promise<StudentJourneyMilestone | undefined> {
    const [milestone] = await db.select().from(studentJourneyMilestones)
      .where(eq(studentJourneyMilestones.id, id));
    return milestone || undefined;
  }

  async createStudentJourneyMilestone(milestone: InsertStudentJourneyMilestone): Promise<StudentJourneyMilestone> {
    const [created] = await db.insert(studentJourneyMilestones).values(milestone as any).returning();
    return created;
  }

  async updateStudentJourneyMilestone(id: string, updates: Partial<StudentJourneyMilestone>): Promise<StudentJourneyMilestone | undefined> {
    const [updated] = await db.update(studentJourneyMilestones)
      .set(updates)
      .where(eq(studentJourneyMilestones.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentJourneyMilestone(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyMilestones).where(eq(studentJourneyMilestones.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Student Journey Activities
  async getStudentJourneyActivities(journeyProgressId: string, limit: number = 50): Promise<StudentJourneyActivity[]> {
    return await db.select().from(studentJourneyActivities)
      .where(eq(studentJourneyActivities.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyActivities.createdAt))
      .limit(limit);
  }

  async createStudentJourneyActivity(activity: InsertStudentJourneyActivity): Promise<StudentJourneyActivity> {
    const [created] = await db.insert(studentJourneyActivities).values(activity as any).returning();
    return created;
  }

  // Student Journey Entries (Timeline/Activity Log for individual students)
  async getStudentJourneyEntries(userId: string, limit: number = 50): Promise<StudentJourneyEntry[]> {
    return await db.select().from(studentJourneyEntries)
      .where(eq(studentJourneyEntries.userId, userId))
      .orderBy(desc(studentJourneyEntries.createdAt))
      .limit(limit);
  }

  async getStudentJourneyEntriesByPillar(userId: string, pillar: string): Promise<StudentJourneyEntry[]> {
    return await db.select().from(studentJourneyEntries)
      .where(and(
        eq(studentJourneyEntries.userId, userId),
        eq(studentJourneyEntries.bkdPillar, pillar)
      ))
      .orderBy(desc(studentJourneyEntries.createdAt));
  }

  async createStudentJourneyEntry(entry: InsertStudentJourneyEntry): Promise<StudentJourneyEntry> {
    const [created] = await db.insert(studentJourneyEntries).values(entry as any).returning();
    return created;
  }

  async deleteStudentJourneyEntry(id: string): Promise<boolean> {
    const result = await db.delete(studentJourneyEntries).where(eq(studentJourneyEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Student Journey Progress History
  async getStudentJourneyProgressHistory(journeyProgressId: string, limit: number = 100): Promise<StudentJourneyProgressHistory[]> {
    return await db.select().from(studentJourneyProgressHistory)
      .where(eq(studentJourneyProgressHistory.journeyProgressId, journeyProgressId))
      .orderBy(desc(studentJourneyProgressHistory.createdAt))
      .limit(limit);
  }

  async getStudentJourneyProgressHistoryByStudent(studentId: string, limit: number = 100): Promise<StudentJourneyProgressHistory[]> {
    return await db.select().from(studentJourneyProgressHistory)
      .where(eq(studentJourneyProgressHistory.studentId, studentId))
      .orderBy(desc(studentJourneyProgressHistory.createdAt))
      .limit(limit);
  }

  async createStudentJourneyProgressHistory(history: InsertStudentJourneyProgressHistory): Promise<StudentJourneyProgressHistory> {
    const [created] = await db.insert(studentJourneyProgressHistory).values(history as any).returning();
    return created;
  }

  // ================================
  // Student Digital Portfolio
  // ================================

  async getStudentPortfolio(userId: string): Promise<StudentPortfolio | undefined> {
    const [portfolio] = await db.select().from(studentPortfolios)
      .where(eq(studentPortfolios.userId, userId));
    return portfolio || undefined;
  }

  async getStudentPortfolioBySlug(slug: string): Promise<StudentPortfolio | undefined> {
    const [portfolio] = await db.select().from(studentPortfolios)
      .where(eq(studentPortfolios.shareableSlug, slug));
    return portfolio || undefined;
  }

  async createStudentPortfolio(portfolio: InsertStudentPortfolio): Promise<StudentPortfolio> {
    const slug = portfolio.shareableSlug || `portfolio-${randomUUID().slice(0, 8)}`;
    const [created] = await db.insert(studentPortfolios).values({
      ...portfolio,
      shareableSlug: slug,
    } as any).returning();
    return created;
  }

  async updateStudentPortfolio(id: string, updates: Partial<StudentPortfolio>, userId: string): Promise<StudentPortfolio | undefined> {
    const [existing] = await db.select().from(studentPortfolios)
      .where(and(eq(studentPortfolios.id, id), eq(studentPortfolios.userId, userId)));
    if (!existing) return undefined;
    
    const [updated] = await db.update(studentPortfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentPortfolios.id, id))
      .returning();
    return updated;
  }

  async deleteStudentPortfolio(id: string, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentPortfolios)
      .where(and(eq(studentPortfolios.id, id), eq(studentPortfolios.userId, userId)));
    if (!existing) return false;
    
    await db.delete(portfolioItems).where(eq(portfolioItems.portfolioId, id));
    await db.delete(studentPortfolios).where(eq(studentPortfolios.id, id));
    return true;
  }

  async incrementPortfolioViews(id: string): Promise<void> {
    await db.update(studentPortfolios)
      .set({ viewCount: sql`COALESCE(${studentPortfolios.viewCount}, 0) + 1` })
      .where(eq(studentPortfolios.id, id));
  }

  // Portfolio Items
  async getPortfolioItems(portfolioId: string): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems)
      .where(eq(portfolioItems.portfolioId, portfolioId))
      .orderBy(asc(portfolioItems.displayOrder), desc(portfolioItems.createdAt));
  }

  async getPortfolioItem(id: string): Promise<PortfolioItem | undefined> {
    const [item] = await db.select().from(portfolioItems)
      .where(eq(portfolioItems.id, id));
    return item || undefined;
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const items = await this.getPortfolioItems(item.portfolioId);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.displayOrder)) : -1;
    
    const [created] = await db.insert(portfolioItems).values({
      ...item,
      displayOrder: item.displayOrder ?? maxOrder + 1,
    } as any).returning();
    return created;
  }

  async updatePortfolioItem(id: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined> {
    const [updated] = await db.update(portfolioItems)
      .set(updates)
      .where(eq(portfolioItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    const result = await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    return true;
  }

  async reorderPortfolioItems(portfolioId: string, itemIds: string[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      await db.update(portfolioItems)
        .set({ displayOrder: i })
        .where(and(eq(portfolioItems.id, itemIds[i]), eq(portfolioItems.portfolioId, portfolioId)));
    }
  }

  // Portfolio Comments
  async getPortfolioComments(portfolioId: string): Promise<PortfolioComment[]> {
    return await db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioId, portfolioId))
      .orderBy(desc(portfolioComments.createdAt));
  }

  async getPortfolioItemComments(portfolioItemId: string): Promise<PortfolioComment[]> {
    return await db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioItemId, portfolioItemId))
      .orderBy(desc(portfolioComments.createdAt));
  }

  async createPortfolioComment(comment: InsertPortfolioComment): Promise<PortfolioComment> {
    const [created] = await db.insert(portfolioComments).values(comment as any).returning();
    return created;
  }

  async updatePortfolioComment(id: string, authorId: string, updates: Partial<PortfolioComment>): Promise<PortfolioComment | undefined> {
    const [updated] = await db.update(portfolioComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(portfolioComments.id, id), eq(portfolioComments.authorId, authorId)))
      .returning();
    return updated || undefined;
  }

  async deletePortfolioComment(id: string, authorId: string): Promise<boolean> {
    await db.delete(portfolioComments).where(and(eq(portfolioComments.id, id), eq(portfolioComments.authorId, authorId)));
    return true;
  }

  // CAI (Country Affordability Index) Methods
  async getCAICountries(): Promise<CAICountry[]> {
    return caiCountries;
  }

  async getCAICountry(code: string): Promise<CAICountry | undefined> {
    return caiCountries.find(c => c.code.toUpperCase() === code.toUpperCase());
  }

  async getCAICountriesByRegion(region: string): Promise<CAICountry[]> {
    return caiCountries.filter(c => c.region.toLowerCase() === region.toLowerCase());
  }

  // SIS Connection Methods
  async getSisConnections(userId: string): Promise<SisConnection[]> {
    return await db.select().from(sisConnections)
      .where(eq(sisConnections.userId, userId))
      .orderBy(desc(sisConnections.createdAt));
  }

  async getSisConnection(id: string): Promise<SisConnection | undefined> {
    const [connection] = await db.select().from(sisConnections)
      .where(eq(sisConnections.id, id));
    return connection || undefined;
  }

  async getSisConnectionsByOrg(organizationId: string): Promise<SisConnection[]> {
    return await db.select().from(sisConnections)
      .where(eq(sisConnections.organizationId, organizationId))
      .orderBy(desc(sisConnections.createdAt));
  }

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
  }

  async createSisConnection(connection: InsertSisConnection): Promise<SisConnection> {
    const [created] = await db.insert(sisConnections).values(connection as any).returning();
    return created;
  }

  async updateSisConnection(id: string, updates: Partial<SisConnection>): Promise<SisConnection | undefined> {
    const [updated] = await db.update(sisConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sisConnections.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSisConnection(id: string, userId: string): Promise<boolean> {
    await db.delete(sisConnections)
      .where(and(eq(sisConnections.id, id), eq(sisConnections.userId, userId)));
    return true;
  }

  // SIS Sync History Methods
  async getSisSyncHistory(connectionId: string, limit: number = 50): Promise<SisSyncHistory[]> {
    return await db.select().from(sisSyncHistory)
      .where(eq(sisSyncHistory.connectionId, connectionId))
      .orderBy(desc(sisSyncHistory.startedAt))
      .limit(limit);
  }

  async createSisSyncHistory(history: InsertSisSyncHistory): Promise<SisSyncHistory> {
    const [created] = await db.insert(sisSyncHistory).values(history as any).returning();
    return created;
  }

  async updateSisSyncHistory(id: string, updates: Partial<SisSyncHistory>): Promise<SisSyncHistory | undefined> {
    const [updated] = await db.update(sisSyncHistory)
      .set(updates)
      .where(eq(sisSyncHistory.id, id))
      .returning();
    return updated || undefined;
  }

  // SIS Students Methods
  async getSisStudents(connectionId: string): Promise<SisStudent[]> {
    return await db.select().from(sisStudents)
      .where(eq(sisStudents.connectionId, connectionId))
      .orderBy(asc(sisStudents.lastName), asc(sisStudents.firstName));
  }

  async getSisStudent(id: string): Promise<SisStudent | undefined> {
    const [student] = await db.select().from(sisStudents)
      .where(eq(sisStudents.id, id));
    return student || undefined;
  }

  async getSisStudentBySisId(connectionId: string, sisStudentId: string): Promise<SisStudent | undefined> {
    const [student] = await db.select().from(sisStudents)
      .where(and(eq(sisStudents.connectionId, connectionId), eq(sisStudents.sisStudentId, sisStudentId)));
    return student || undefined;
  }

  async createSisStudent(student: InsertSisStudent): Promise<SisStudent> {
    const [created] = await db.insert(sisStudents).values(student as any).returning();
    return created;
  }

  async updateSisStudent(id: string, updates: Partial<SisStudent>): Promise<SisStudent | undefined> {
    const [updated] = await db.update(sisStudents)
      .set({ ...updates, lastSyncAt: new Date() })
      .where(eq(sisStudents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSisStudent(id: string): Promise<boolean> {
    await db.delete(sisStudents).where(eq(sisStudents.id, id));
    return true;
  }

  // SIS Courses Methods
  async getSisCourses(connectionId: string): Promise<SisCourse[]> {
    return await db.select().from(sisCourses)
      .where(eq(sisCourses.connectionId, connectionId))
      .orderBy(asc(sisCourses.name));
  }

  async getSisCourse(id: string): Promise<SisCourse | undefined> {
    const [course] = await db.select().from(sisCourses)
      .where(eq(sisCourses.id, id));
    return course || undefined;
  }

  async getSisCourseBySisId(connectionId: string, sisCourseId: string): Promise<SisCourse | undefined> {
    const [course] = await db.select().from(sisCourses)
      .where(and(eq(sisCourses.connectionId, connectionId), eq(sisCourses.sisCourseId, sisCourseId)));
    return course || undefined;
  }

  async createSisCourse(course: InsertSisCourse): Promise<SisCourse> {
    const [created] = await db.insert(sisCourses).values(course as any).returning();
    return created;
  }

  async updateSisCourse(id: string, updates: Partial<SisCourse>): Promise<SisCourse | undefined> {
    const [updated] = await db.update(sisCourses)
      .set({ ...updates, lastSyncAt: new Date() })
      .where(eq(sisCourses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSisCourse(id: string): Promise<boolean> {
    await db.delete(sisCourses).where(eq(sisCourses.id, id));
    return true;
  }

  // Student Notes Methods
  async getStudentNotes(studentId: string, educatorId: string): Promise<StudentNote[]> {
    return await db.select().from(studentNotes)
      .where(and(
        eq(studentNotes.studentId, studentId),
        eq(studentNotes.educatorId, educatorId)
      ))
      .orderBy(desc(studentNotes.createdAt));
  }

  async getStudentNotesByClass(classId: string, educatorId: string): Promise<StudentNote[]> {
    return await db.select().from(studentNotes)
      .where(and(
        eq(studentNotes.classId, classId),
        eq(studentNotes.educatorId, educatorId)
      ))
      .orderBy(desc(studentNotes.createdAt));
  }

  async createStudentNote(note: InsertStudentNote): Promise<StudentNote> {
    const [created] = await db.insert(studentNotes).values(note as any).returning();
    return created;
  }

  async updateStudentNote(id: string, updates: Partial<StudentNote>, educatorId: string): Promise<StudentNote | undefined> {
    const [existing] = await db.select().from(studentNotes).where(eq(studentNotes.id, id));
    if (!existing || existing.educatorId !== educatorId) return undefined;
    
    const [updated] = await db.update(studentNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentNotes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStudentNote(id: string, educatorId: string): Promise<boolean> {
    const [existing] = await db.select().from(studentNotes).where(eq(studentNotes.id, id));
    if (!existing || existing.educatorId !== educatorId) return false;
    
    await db.delete(studentNotes).where(eq(studentNotes.id, id));
    return true;
  }

  // Attendance Records Methods
  async getAttendanceByClass(classId: string, date: Date): Promise<AttendanceRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.classId, classId),
        gte(attendanceRecords.date, startOfDay),
        sql`${attendanceRecords.date} <= ${endOfDay}`
      ))
      .orderBy(asc(attendanceRecords.studentId));
  }

  async getAttendanceByStudent(studentId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    const conditions = [eq(attendanceRecords.studentId, studentId)];
    
    if (startDate) {
      conditions.push(gte(attendanceRecords.date, startDate));
    }
    if (endDate) {
      conditions.push(sql`${attendanceRecords.date} <= ${endDate}`);
    }
    
    return await db.select().from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.date));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [created] = await db.insert(attendanceRecords).values(record as any).returning();
    return created;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [updated] = await db.update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updated || undefined;
  }

  async bulkCreateAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]> {
    if (records.length === 0) return [];
    const created = await db.insert(attendanceRecords).values(records as any[]).returning();
    return created;
  }

  // ================================
  // Student Transfer Request Methods
  // ================================

  async createTransferRequest(data: InsertStudentTransferRequest): Promise<StudentTransferRequest> {
    const [created] = await db.insert(studentTransferRequests).values(data as any).returning();
    return created;
  }

  async getTransferRequest(id: string): Promise<StudentTransferRequest | undefined> {
    const [request] = await db.select().from(studentTransferRequests)
      .where(eq(studentTransferRequests.id, id));
    return request || undefined;
  }

  async getTransferRequestsByStudent(studentId: string): Promise<StudentTransferRequest[]> {
    return await db.select().from(studentTransferRequests)
      .where(eq(studentTransferRequests.studentId, studentId))
      .orderBy(desc(studentTransferRequests.createdAt));
  }

  async getTransferRequestsByOrganization(organizationId: string): Promise<StudentTransferRequest[]> {
    return await db.select().from(studentTransferRequests)
      .where(or(
        eq(studentTransferRequests.sourceOrganizationId, organizationId),
        eq(studentTransferRequests.targetOrganizationId, organizationId)
      ))
      .orderBy(desc(studentTransferRequests.createdAt));
  }

  async getPendingTransferRequests(level: "campus" | "district" | "system_admin"): Promise<StudentTransferRequest[]> {
    const statusMap = {
      campus: "pending_campus" as TransferRequestStatus,
      district: "pending_district" as TransferRequestStatus,
      system_admin: "pending_system_admin" as TransferRequestStatus
    };
    return await db.select().from(studentTransferRequests)
      .where(eq(studentTransferRequests.status, statusMap[level]))
      .orderBy(desc(studentTransferRequests.createdAt));
  }

  async approveTransferAtLevel(
    id: string, 
    level: "campus" | "district" | "system_admin",
    approvedBy: string
  ): Promise<StudentTransferRequest | undefined> {
    const now = new Date();
    let updates: Partial<StudentTransferRequest> = { updatedAt: now };
    
    if (level === "campus") {
      updates = {
        ...updates,
        campusApprovedBy: approvedBy,
        campusApprovedAt: now,
        status: "pending_district" as TransferRequestStatus
      };
    } else if (level === "district") {
      updates = {
        ...updates,
        districtApprovedBy: approvedBy,
        districtApprovedAt: now,
        status: "pending_system_admin" as TransferRequestStatus
      };
    } else if (level === "system_admin") {
      updates = {
        ...updates,
        systemAdminApprovedBy: approvedBy,
        systemAdminApprovedAt: now,
        status: "approved" as TransferRequestStatus,
        transferExecutedAt: now
      };
    }

    const [updated] = await db.update(studentTransferRequests)
      .set(updates)
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async rejectTransfer(
    id: string,
    level: "campus" | "district" | "system_admin",
    rejectedBy: string,
    reason: string
  ): Promise<StudentTransferRequest | undefined> {
    const now = new Date();
    let updates: Partial<StudentTransferRequest> = { 
      updatedAt: now,
      status: "rejected" as TransferRequestStatus
    };

    if (level === "campus") {
      updates.campusRejectionReason = reason;
    } else if (level === "district") {
      updates.districtRejectionReason = reason;
    } else if (level === "system_admin") {
      updates.systemAdminRejectionReason = reason;
    }

    const [updated] = await db.update(studentTransferRequests)
      .set(updates)
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async cancelTransferRequest(id: string): Promise<StudentTransferRequest | undefined> {
    const [updated] = await db.update(studentTransferRequests)
      .set({ 
        status: "cancelled" as TransferRequestStatus,
        updatedAt: new Date()
      })
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async executeTransfer(id: string): Promise<StudentTransferRequest | undefined> {
    const request = await this.getTransferRequest(id);
    if (!request || request.status !== "approved") return undefined;

    // Update the student's organization/educator
    if (request.transferType === "organization" && request.targetOrganizationId) {
      await db.update(students)
        .set({ 
          organizationId: request.targetOrganizationId,
          updatedAt: new Date()
        })
        .where(eq(students.id, request.studentId));
    }

    // Mark transfer as executed
    const [updated] = await db.update(studentTransferRequests)
      .set({ 
        transferExecutedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(studentTransferRequests.id, id))
      .returning();
    return updated || undefined;
  }

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
  }

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
  }

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
  }

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
  }

  // ===========================================
  // SYSTEM LESSON AUTHORS
  // ===========================================
  
  async getSystemLessonAuthors(): Promise<SystemLessonAuthor[]> {
    return db.select().from(systemLessonAuthors).orderBy(desc(systemLessonAuthors.createdAt));
  }
  
  async getSystemLessonAuthor(userId: string): Promise<SystemLessonAuthor | undefined> {
    const [author] = await db.select().from(systemLessonAuthors).where(eq(systemLessonAuthors.userId, userId));
    return author;
  }
  
  async isSystemLessonAuthor(userId: string): Promise<boolean> {
    const author = await this.getSystemLessonAuthor(userId);
    return author !== undefined && author.status === 'active';
  }
  
  async createSystemLessonAuthor(author: InsertSystemLessonAuthor): Promise<SystemLessonAuthor> {
    const [newAuthor] = await db.insert(systemLessonAuthors).values(author as any).returning();
    return newAuthor;
  }
  
  async updateSystemLessonAuthor(userId: string, updates: Partial<SystemLessonAuthor>): Promise<SystemLessonAuthor | undefined> {
    const [updated] = await db.update(systemLessonAuthors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemLessonAuthors.userId, userId))
      .returning();
    return updated;
  }
  
  async deleteSystemLessonAuthor(userId: string): Promise<boolean> {
    const result = await db.delete(systemLessonAuthors).where(eq(systemLessonAuthors.userId, userId));
    return true;
  }
  
  async incrementAuthorLessonCount(userId: string): Promise<void> {
    await db.update(systemLessonAuthors)
      .set({ lessonsCreated: sql`${systemLessonAuthors.lessonsCreated} + 1`, updatedAt: new Date() })
      .where(eq(systemLessonAuthors.userId, userId));
  }

  async decrementAuthorLessonCount(userId: string): Promise<void> {
    await db.update(systemLessonAuthors)
      .set({ lessonsCreated: sql`GREATEST(${systemLessonAuthors.lessonsCreated} - 1, 0)`, updatedAt: new Date() })
      .where(eq(systemLessonAuthors.userId, userId));
  }

  // ===========================================
  // CAMPUS LESSON AUTHORS
  // ===========================================

  async getCampusLessonAuthors(organizationId: string): Promise<CampusLessonAuthor[]> {
    return db.select().from(campusLessonAuthors)
      .where(eq(campusLessonAuthors.organizationId, organizationId))
      .orderBy(desc(campusLessonAuthors.createdAt));
  }

  async getCampusLessonAuthor(userId: string, organizationId: string): Promise<CampusLessonAuthor | undefined> {
    const [author] = await db.select().from(campusLessonAuthors)
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
    return author;
  }

  async getCampusLessonAuthorByUserId(userId: string): Promise<CampusLessonAuthor | undefined> {
    const [author] = await db.select().from(campusLessonAuthors)
      .where(eq(campusLessonAuthors.userId, userId));
    return author;
  }

  async isCampusLessonAuthor(userId: string, organizationId?: string): Promise<boolean> {
    if (organizationId) {
      const author = await this.getCampusLessonAuthor(userId, organizationId);
      return author?.status === "active";
    }
    const author = await this.getCampusLessonAuthorByUserId(userId);
    return author?.status === "active";
  }

  async createCampusLessonAuthor(author: InsertCampusLessonAuthor): Promise<CampusLessonAuthor> {
    const [newAuthor] = await db.insert(campusLessonAuthors).values(author as any).returning();
    return newAuthor;
  }

  async updateCampusLessonAuthor(userId: string, organizationId: string, updates: Partial<CampusLessonAuthor>): Promise<CampusLessonAuthor | undefined> {
    const [updated] = await db.update(campusLessonAuthors)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async deleteCampusLessonAuthor(userId: string, organizationId: string): Promise<boolean> {
    const result = await db.delete(campusLessonAuthors)
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementCampusAuthorLessonCount(userId: string, organizationId: string): Promise<void> {
    await db.update(campusLessonAuthors)
      .set({ lessonsCreated: sql`${campusLessonAuthors.lessonsCreated} + 1`, updatedAt: new Date() })
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
  }

  async decrementCampusAuthorLessonCount(userId: string, organizationId: string): Promise<void> {
    await db.update(campusLessonAuthors)
      .set({ lessonsCreated: sql`GREATEST(${campusLessonAuthors.lessonsCreated} - 1, 0)`, updatedAt: new Date() })
      .where(and(eq(campusLessonAuthors.userId, userId), eq(campusLessonAuthors.organizationId, organizationId)));
  }

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
  }
  
  async getMasterLesson(id: string): Promise<MasterLesson | undefined> {
    const [lesson] = await db.select().from(masterLessons).where(eq(masterLessons.id, id));
    return lesson;
  }
  
  async getMasterLessonsByAuthor(authorId: string): Promise<MasterLesson[]> {
    return db.select().from(masterLessons).where(eq(masterLessons.authorId, authorId)).orderBy(desc(masterLessons.createdAt));
  }
  
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
  }
  
  async createMasterLesson(lesson: InsertMasterLesson): Promise<MasterLesson> {
    const [newLesson] = await db.insert(masterLessons).values(lesson as any).returning();
    return newLesson;
  }
  
  async updateMasterLesson(id: string, updates: Partial<MasterLesson>): Promise<MasterLesson | undefined> {
    const [updated] = await db.update(masterLessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(masterLessons.id, id))
      .returning();
    return updated;
  }
  
  async deleteMasterLesson(id: string, authorId: string): Promise<boolean> {
    const [lesson] = await db.select().from(masterLessons).where(and(eq(masterLessons.id, id), eq(masterLessons.authorId, authorId)));
    if (!lesson) return false;
    await db.delete(masterLessons).where(eq(masterLessons.id, id));
    return true;
  }
  
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
  }
  
  async rejectMasterLesson(id: string, reviewerId: string, notes: string): Promise<MasterLesson | undefined> {
    const [updated] = await db.update(masterLessons)
      .set({ status: 'draft', reviewedBy: reviewerId, reviewedAt: new Date(), reviewNotes: notes, updatedAt: new Date() })
      .where(eq(masterLessons.id, id))
      .returning();
    return updated;
  }
  
  async incrementMasterLessonUsage(id: string): Promise<void> {
    await db.update(masterLessons)
      .set({ usageCount: sql`${masterLessons.usageCount} + 1` })
      .where(eq(masterLessons.id, id));
  }

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
  }
  
  async getContentLibraryItem(id: string): Promise<ContentLibraryItem | undefined> {
    const [item] = await db.select().from(contentLibrary).where(eq(contentLibrary.id, id));
    return item;
  }
  
  async createContentLibraryItem(item: InsertContentLibrary): Promise<ContentLibraryItem> {
    const [newItem] = await db.insert(contentLibrary).values(item as any).returning();
    return newItem;
  }
  
  async updateContentLibraryItem(id: string, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined> {
    const [updated] = await db.update(contentLibrary)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentLibrary.id, id))
      .returning();
    return updated;
  }
  
  async deleteContentLibraryItem(id: string): Promise<boolean> {
    await db.delete(contentLibrary).where(eq(contentLibrary.id, id));
    return true;
  }
  
  async incrementContentUsage(id: string): Promise<void> {
    await db.update(contentLibrary)
      .set({ usageCount: sql`${contentLibrary.usageCount} + 1` })
      .where(eq(contentLibrary.id, id));
  }
  
  async getActiveContentForAI(subjects?: string[], gradeLevels?: string[]): Promise<ContentLibraryItem[]> {
    const conditions: any[] = [
      eq(contentLibrary.isActive, true),
      eq(contentLibrary.processingStatus, 'completed')
    ];
    
    return db.select().from(contentLibrary).where(and(...conditions)).orderBy(desc(contentLibrary.usageCount));
  }

  // ===========================================
  // LESSON BULK IMPORTS
  // ===========================================
  
  async getLessonBulkImports(): Promise<LessonBulkImport[]> {
    return db.select().from(lessonBulkImports).orderBy(desc(lessonBulkImports.createdAt));
  }
  
  async getLessonBulkImport(id: string): Promise<LessonBulkImport | undefined> {
    const [importRecord] = await db.select().from(lessonBulkImports).where(eq(lessonBulkImports.id, id));
    return importRecord;
  }
  
  async createLessonBulkImport(importRecord: InsertLessonBulkImport): Promise<LessonBulkImport> {
    const [newImport] = await db.insert(lessonBulkImports).values(importRecord as any).returning();
    return newImport;
  }
  
  async updateLessonBulkImport(id: string, updates: Partial<LessonBulkImport>): Promise<LessonBulkImport | undefined> {
    const [updated] = await db.update(lessonBulkImports)
      .set(updates)
      .where(eq(lessonBulkImports.id, id))
      .returning();
    return updated;
  }

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
  }
  
  async getQuestionBankItem(id: string): Promise<QuestionBank | undefined> {
    const [item] = await db.select().from(questionBanks).where(eq(questionBanks.id, id));
    return item;
  }
  
  async createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBank> {
    const [newItem] = await db.insert(questionBanks).values(item as any).returning();
    return newItem;
  }
  
  async updateQuestionBankItem(id: string, updates: Partial<QuestionBank>): Promise<QuestionBank | undefined> {
    const [updated] = await db.update(questionBanks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(questionBanks.id, id))
      .returning();
    return updated;
  }
  
  async deleteQuestionBankItem(id: string): Promise<boolean> {
    const result = await db.delete(questionBanks).where(eq(questionBanks.id, id));
    return true;
  }
  
  async incrementQuestionUsage(id: string): Promise<void> {
    await db.update(questionBanks)
      .set({ usageCount: sql`${questionBanks.usageCount} + 1` })
      .where(eq(questionBanks.id, id));
  }

  // ===========================================
  // AUTHOR QUALITY METRICS
  // ===========================================
  
  async getAuthorQualityMetrics(authorId: string): Promise<AuthorQualityMetrics[]> {
    return db.select().from(authorQualityMetrics)
      .where(eq(authorQualityMetrics.authorId, authorId))
      .orderBy(desc(authorQualityMetrics.periodEnd));
  }
  
  async getLatestAuthorMetrics(authorId: string): Promise<AuthorQualityMetrics | undefined> {
    const [metrics] = await db.select().from(authorQualityMetrics)
      .where(eq(authorQualityMetrics.authorId, authorId))
      .orderBy(desc(authorQualityMetrics.periodEnd))
      .limit(1);
    return metrics;
  }
  
  async createAuthorQualityMetrics(metrics: InsertAuthorQualityMetrics): Promise<AuthorQualityMetrics> {
    const [newMetrics] = await db.insert(authorQualityMetrics).values(metrics as any).returning();
    return newMetrics;
  }
  
  async updateAuthorQualityMetrics(id: string, updates: Partial<AuthorQualityMetrics>): Promise<AuthorQualityMetrics | undefined> {
    const [updated] = await db.update(authorQualityMetrics)
      .set(updates)
      .where(eq(authorQualityMetrics.id, id))
      .returning();
    return updated;
  }

  // ===========================================
  // ASSIGNMENT ALIGNMENTS
  // ===========================================
  
  async getAssignmentAlignments(assignmentId: string): Promise<AssignmentAlignment[]> {
    return db.select().from(assignmentAlignments)
      .where(eq(assignmentAlignments.assignmentId, assignmentId))
      .orderBy(asc(assignmentAlignments.objectiveIndex));
  }
  
  async createAssignmentAlignment(alignment: InsertAssignmentAlignment): Promise<AssignmentAlignment> {
    const [newAlignment] = await db.insert(assignmentAlignments).values(alignment as any).returning();
    return newAlignment;
  }
  
  async getAlignmentsByLesson(lessonId: string): Promise<AssignmentAlignment[]> {
    return db.select().from(assignmentAlignments)
      .where(eq(assignmentAlignments.lessonId, lessonId))
      .orderBy(asc(assignmentAlignments.objectiveIndex));
  }

  // Resource Ratings
  async getResourceRatings(resourceId: string): Promise<ResourceRating[]> {
    return db.select().from(resourceRatings)
      .where(eq(resourceRatings.resourceId, resourceId))
      .orderBy(desc(resourceRatings.createdAt));
  }

  async getUserResourceRating(resourceId: string, userId: string): Promise<ResourceRating | undefined> {
    const [rating] = await db.select().from(resourceRatings)
      .where(and(eq(resourceRatings.resourceId, resourceId), eq(resourceRatings.userId, userId)));
    return rating;
  }

  async createResourceRating(rating: InsertResourceRating): Promise<ResourceRating> {
    const [newRating] = await db.insert(resourceRatings).values(rating).returning();
    return newRating;
  }

  async getAverageRating(resourceId: string): Promise<{ average: number; count: number }> {
    const ratings = await db.select().from(resourceRatings)
      .where(eq(resourceRatings.resourceId, resourceId));
    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / ratings.length, count: ratings.length };
  }

  // Student Narratives (BE Pillar)
  async getStudentNarratives(userId: string): Promise<StudentNarrative[]> {
    return db.select().from(studentNarratives)
      .where(eq(studentNarratives.userId, userId))
      .orderBy(desc(studentNarratives.createdAt));
  }

  async getStudentNarrative(id: string): Promise<StudentNarrative | undefined> {
    const [narrative] = await db.select().from(studentNarratives)
      .where(eq(studentNarratives.id, id));
    return narrative;
  }

  async createStudentNarrative(narrative: InsertStudentNarrative): Promise<StudentNarrative> {
    const [newNarrative] = await db.insert(studentNarratives).values(narrative as any).returning();
    return newNarrative;
  }

  async updateStudentNarrative(id: string, updates: Partial<StudentNarrative>, userId: string): Promise<StudentNarrative | undefined> {
    const [updated] = await db.update(studentNarratives)
      .set({ ...updates, lastEditedAt: new Date() })
      .where(and(eq(studentNarratives.id, id), eq(studentNarratives.userId, userId)))
      .returning();
    return updated;
  }

  async deleteStudentNarrative(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(studentNarratives)
      .where(and(eq(studentNarratives.id, id), eq(studentNarratives.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Strengths Inventory (BE Pillar)
  async getStrengthsInventory(userId: string): Promise<StrengthsInventory[]> {
    return db.select().from(strengthsInventory)
      .where(eq(strengthsInventory.userId, userId))
      .orderBy(desc(strengthsInventory.createdAt));
  }

  async createStrength(strength: InsertStrengthsInventory): Promise<StrengthsInventory> {
    const [newStrength] = await db.insert(strengthsInventory).values(strength as any).returning();
    return newStrength;
  }

  async updateStrength(id: string, updates: Partial<StrengthsInventory>, userId: string): Promise<StrengthsInventory | undefined> {
    const [updated] = await db.update(strengthsInventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(strengthsInventory.id, id), eq(strengthsInventory.userId, userId)))
      .returning();
    return updated;
  }

  async deleteStrength(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(strengthsInventory)
      .where(and(eq(strengthsInventory.id, id), eq(strengthsInventory.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Campus Activities (DO Pillar)
  async getCampusActivities(userId: string): Promise<CampusActivity[]> {
    return db.select().from(campusActivities)
      .where(eq(campusActivities.userId, userId))
      .orderBy(desc(campusActivities.createdAt));
  }

  async createCampusActivity(activity: InsertCampusActivity): Promise<CampusActivity> {
    const [newActivity] = await db.insert(campusActivities).values(activity as any).returning();
    return newActivity;
  }

  async updateCampusActivity(id: string, updates: Partial<CampusActivity>, userId: string): Promise<CampusActivity | undefined> {
    const [updated] = await db.update(campusActivities)
      .set(updates)
      .where(and(eq(campusActivities.id, id), eq(campusActivities.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCampusActivity(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(campusActivities)
      .where(and(eq(campusActivities.id, id), eq(campusActivities.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Scholarship Applications (DO Pillar - Planner)
  async getScholarshipApplications(userId: string): Promise<ScholarshipApplication[]> {
    return db.select().from(scholarshipApplications)
      .where(eq(scholarshipApplications.userId, userId))
      .orderBy(desc(scholarshipApplications.createdAt));
  }

  async getScholarshipApplication(id: string): Promise<ScholarshipApplication | undefined> {
    const [app] = await db.select().from(scholarshipApplications)
      .where(eq(scholarshipApplications.id, id));
    return app;
  }

  async createScholarshipApplication(app: InsertScholarshipApplication): Promise<ScholarshipApplication> {
    const [newApp] = await db.insert(scholarshipApplications).values(app as any).returning();
    return newApp;
  }

  async updateScholarshipApplication(id: string, updates: Partial<ScholarshipApplication>, userId: string): Promise<ScholarshipApplication | undefined> {
    const [updated] = await db.update(scholarshipApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(scholarshipApplications.id, id), eq(scholarshipApplications.userId, userId)))
      .returning();
    return updated;
  }

  async deleteScholarshipApplication(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(scholarshipApplications)
      .where(and(eq(scholarshipApplications.id, id), eq(scholarshipApplications.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

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
  }

  async getMentorProfile(id: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles)
      .where(eq(mentorProfiles.id, id));
    return profile;
  }

  async getMentorProfileByUser(userId: string): Promise<MentorProfile | undefined> {
    const [profile] = await db.select().from(mentorProfiles)
      .where(eq(mentorProfiles.userId, userId));
    return profile;
  }

  async createMentorProfile(profile: InsertMentorProfile): Promise<MentorProfile> {
    const [newProfile] = await db.insert(mentorProfiles).values(profile as any).returning();
    return newProfile;
  }

  async updateMentorProfile(id: string, updates: Partial<MentorProfile>, userId: string): Promise<MentorProfile | undefined> {
    const [updated] = await db.update(mentorProfiles)
      .set(updates)
      .where(and(eq(mentorProfiles.id, id), eq(mentorProfiles.userId, userId)))
      .returning();
    return updated;
  }

  async getMentorConnections(userId: string): Promise<MentorConnection[]> {
    return db.select().from(mentorConnections)
      .where(eq(mentorConnections.studentUserId, userId))
      .orderBy(desc(mentorConnections.createdAt));
  }

  async getMentorConnectionsForMentor(mentorId: string): Promise<MentorConnection[]> {
    return db.select().from(mentorConnections)
      .where(eq(mentorConnections.mentorId, mentorId))
      .orderBy(desc(mentorConnections.createdAt));
  }

  async createMentorConnection(connection: InsertMentorConnection): Promise<MentorConnection> {
    const [newConnection] = await db.insert(mentorConnections).values(connection).returning();
    return newConnection;
  }

  async updateMentorConnection(id: string, updates: Partial<MentorConnection>): Promise<MentorConnection | undefined> {
    const [updated] = await db.update(mentorConnections)
      .set(updates)
      .where(eq(mentorConnections.id, id))
      .returning();
    return updated;
  }

  async getActiveTrialByIP(ipAddress: string): Promise<FreeTrial | undefined> {
    const now = new Date();
    const [trial] = await db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.ipAddress, ipAddress),
        eq(freeTrials.isActive, true),
        gte(freeTrials.trialEndDate, now)
      ))
      .orderBy(desc(freeTrials.createdAt))
      .limit(1);
    return trial;
  }

  async getActiveTrialByFingerprint(fingerprint: string): Promise<FreeTrial | undefined> {
    if (!fingerprint) return undefined;
    const now = new Date();
    const [trial] = await db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.fingerprint, fingerprint),
        eq(freeTrials.isActive, true),
        gte(freeTrials.trialEndDate, now)
      ))
      .orderBy(desc(freeTrials.createdAt))
      .limit(1);
    return trial;
  }

  async getActiveTrialByUserId(userId: string): Promise<FreeTrial | undefined> {
    const now = new Date();
    const [trial] = await db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.userId, userId),
        eq(freeTrials.isActive, true),
        gte(freeTrials.trialEndDate, now)
      ))
      .orderBy(desc(freeTrials.createdAt))
      .limit(1);
    return trial;
  }

  async getTrialsByIP(ipAddress: string, sinceDateMs: number): Promise<FreeTrial[]> {
    const sinceDate = new Date(sinceDateMs);
    return db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.ipAddress, ipAddress),
        gte(freeTrials.createdAt, sinceDate)
      ))
      .orderBy(desc(freeTrials.createdAt));
  }

  async getTrialsByFingerprint(fingerprint: string, sinceDateMs: number): Promise<FreeTrial[]> {
    if (!fingerprint) return [];
    const sinceDate = new Date(sinceDateMs);
    return db.select().from(freeTrials)
      .where(and(
        eq(freeTrials.fingerprint, fingerprint),
        gte(freeTrials.createdAt, sinceDate)
      ))
      .orderBy(desc(freeTrials.createdAt));
  }

  async createFreeTrial(trial: InsertFreeTrial): Promise<FreeTrial> {
    const [newTrial] = await db.insert(freeTrials).values(trial as any).returning();
    return newTrial;
  }

  async bindTrialToUser(trialId: string, userId: string): Promise<FreeTrial | undefined> {
    const [updated] = await db.update(freeTrials)
      .set({ userId, updatedAt: new Date() })
      .where(eq(freeTrials.id, trialId))
      .returning();
    return updated;
  }

  async flagTrialAbuse(trialId: string): Promise<FreeTrial | undefined> {
    const [updated] = await db.update(freeTrials)
      .set({ abuseFlags: sql`${freeTrials.abuseFlags} + 1`, updatedAt: new Date() })
      .where(eq(freeTrials.id, trialId))
      .returning();
    return updated;
  }

  async getActiveTrialCount(ipAddress: string, sinceDateMs: number): Promise<number> {
    const sinceDate = new Date(sinceDateMs);
    const result = await db.select({ count: sql<number>`count(*)` }).from(freeTrials)
      .where(and(
        eq(freeTrials.ipAddress, ipAddress),
        gte(freeTrials.createdAt, sinceDate)
      ));
    return Number(result[0]?.count || 0);
  }

  async getRssFeeds(): Promise<RssFeed[]> {
    return db.select().from(rssFeeds).orderBy(desc(rssFeeds.createdAt));
  }

  async getRssFeed(id: string): Promise<RssFeed | undefined> {
    const [feed] = await db.select().from(rssFeeds).where(eq(rssFeeds.id, id));
    return feed;
  }

  async createRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const [created] = await db.insert(rssFeeds).values(feed as any).returning();
    return created;
  }

  async updateRssFeed(id: string, updates: Partial<RssFeed>): Promise<RssFeed | undefined> {
    const [updated] = await db.update(rssFeeds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rssFeeds.id, id))
      .returning();
    return updated;
  }

  async deleteRssFeed(id: string): Promise<boolean> {
    const result = await db.delete(rssFeeds).where(eq(rssFeeds.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRssContentItems(filters?: { feedId?: string; status?: RssContentStatus; placement?: RssPlacement }): Promise<RssContentItem[]> {
    const conditions = [];
    if (filters?.feedId) conditions.push(eq(rssContentItems.feedId, filters.feedId));
    if (filters?.status) conditions.push(eq(rssContentItems.status, filters.status));
    if (filters?.placement) conditions.push(sql`${rssContentItems.suggestedPlacements}::jsonb @> ${JSON.stringify([filters.placement])}::jsonb`);
    return db.select().from(rssContentItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(rssContentItems.createdAt));
  }

  async getRssContentItem(id: string): Promise<RssContentItem | undefined> {
    const [item] = await db.select().from(rssContentItems).where(eq(rssContentItems.id, id));
    return item;
  }

  async getRssContentItemByGuid(feedId: string, guid: string): Promise<RssContentItem | undefined> {
    const [item] = await db.select().from(rssContentItems)
      .where(and(eq(rssContentItems.feedId, feedId), eq(rssContentItems.guid, guid)));
    return item;
  }

  async createRssContentItem(item: InsertRssContentItem): Promise<RssContentItem> {
    const [created] = await db.insert(rssContentItems).values(item as any).returning();
    return created;
  }

  async updateRssContentItem(id: string, updates: Partial<RssContentItem>): Promise<RssContentItem | undefined> {
    const [updated] = await db.update(rssContentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rssContentItems.id, id))
      .returning();
    return updated;
  }

  async deleteRssContentItem(id: string): Promise<boolean> {
    const result = await db.delete(rssContentItems).where(eq(rssContentItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPendingRssContentCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(rssContentItems)
      .where(eq(rssContentItems.status, "pending"));
    return Number(result[0]?.count || 0);
  }

  async getApprovedRssContentByPlacement(placement: RssPlacement, filters?: { bkdPillar?: string; careerFields?: string[]; tags?: string[] }): Promise<RssContentItem[]> {
    const conditions = [
      eq(rssContentItems.status, "approved"),
      sql`${rssContentItems.approvedPlacements}::jsonb @> ${JSON.stringify([placement])}::jsonb`,
    ];
    if (filters?.bkdPillar) conditions.push(eq(rssContentItems.bkdPillar, filters.bkdPillar as any));
    return db.select().from(rssContentItems)
      .where(and(...conditions))
      .orderBy(desc(rssContentItems.publishedAt));
  }
}

export const storage = new DatabaseStorage();
