import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth schema (users and sessions tables)
export * from "./models/auth";

// Saved Lessons Table (for educators to save generated lessons)
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  gradeLevel: text("grade_level").notNull(),
  bkdFocus: text("bkd_focus").notNull(),
  standards: text("standards"),
  duration: text("duration").notNull(),
  objectives: jsonb("objectives").notNull().$type<string[]>(),
  activities: jsonb("activities").notNull().$type<{ title: string; description: string; duration: string; type: string }[]>(),
  materials: jsonb("materials").notNull().$type<string[]>(),
  assessment: text("assessment").notNull(),
  reflection: text("reflection"),
  shareId: varchar("share_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Goals Table (for action plans)
export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  bkdPillar: text("bkd_pillar").default("do"),
  linkedCareerId: varchar("linked_career_id"),
  targetDate: text("target_date").notNull(),
  status: text("status").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  milestones: jsonb("milestones").notNull().$type<{ id: string; title: string; completed: boolean; dueDate?: string; reflection?: string }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// LYS Methodology Schema
export const lysMethodologySchema = z.object({
  be: z.object({
    focus: z.string(),
    description: z.string(),
  }),
  know: z.object({
    focus: z.string(),
    description: z.string(),
  }),
  do: z.object({
    focus: z.string(),
    description: z.string(),
  }),
});

// Instructional Phase Schema
export const instructionalPhaseSchema = z.object({
  anticipatorySet: z.string(),
  modeling: z.string(),
  guidedPractice: z.string(),
  independentPractice: z.string(),
});

// Lesson Close Schema - Life Application Connections
export const lessonCloseSchema = z.object({
  educational: z.string().optional(),
  social: z.string().optional(),
  vocational: z.string().optional(),
  financial: z.string().optional(),
  spiritual: z.string().optional(),
  cultural: z.string().optional(),
  health: z.string().optional(),
});

// Lesson Plan Schema (for API response - not stored in DB)
export const lessonPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  topic: z.string(),
  course: z.string().optional(),
  unit: z.string().optional(),
  gradeLevel: z.string(),
  bkdFocus: z.enum(["be", "know", "do"]),
  standards: z.object({
    country: z.string(),
    state: z.string(),
    standardsName: z.string(),
    subject: z.string(),
    codes: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })),
  }).optional(),
  duration: z.string(),
  lessonPart: z.string().optional(),
  objectives: z.array(z.string()),
  essentialQuestions: z.array(z.string()),
  lysMethodology: lysMethodologySchema,
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    type: z.string(),
  })),
  asynchronousInstruction: instructionalPhaseSchema.optional(),
  synchronousInstruction: instructionalPhaseSchema,
  activities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    duration: z.string(),
    type: z.enum(["be", "know", "do"]),
  })),
  materials: z.array(z.string()),
  assessment: z.string(),
  lessonClose: lessonCloseSchema,
  reflection: z.string().optional(),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type LYSMethodology = z.infer<typeof lysMethodologySchema>;
export type InstructionalPhase = z.infer<typeof instructionalPhaseSchema>;
export type LessonClose = z.infer<typeof lessonCloseSchema>;

// Assessment Schema (BE - Identity & Purpose)
export const assessmentSchema = z.object({
  id: z.string(),
  type: z.enum(["personality", "values", "strengths"]),
  title: z.string(),
  description: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.object({
      value: z.string(),
      label: z.string(),
      trait: z.string().optional(),
    })),
  })),
});

export type Assessment = z.infer<typeof assessmentSchema>;

export const assessmentResultSchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  answers: z.record(z.string(), z.string()),
  results: z.object({
    primaryTrait: z.string(),
    secondaryTraits: z.array(z.string()),
    summary: z.string(),
    strengths: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

export type AssessmentResult = z.infer<typeof assessmentResultSchema>;

// Career Pathway Schema (KNOW - Strategy & Resources)
export const careerSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  salaryMin: z.number(),
  salaryMax: z.number(),
  salaryMedian: z.number(),
  educationRequired: z.string(),
  yearsExperience: z.string(),
  growthRate: z.string(),
  skills: z.array(z.string()),
  relatedCareers: z.array(z.string()),
  pathways: z.array(z.object({
    type: z.enum(["college", "military", "trade", "certification"]),
    description: z.string(),
    duration: z.string(),
    cost: z.string(),
  })),
});

export type Career = z.infer<typeof careerSchema>;

// Resource Schema
export const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["scholarship", "guide", "video", "tool", "article"]),
  category: z.enum(["financial", "college", "career", "military", "life_skills"]),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  amount: z.number().optional(),
  deadline: z.string().optional(),
  eligibility: z.array(z.string()).optional(),
  tags: z.array(z.string()),
});

export type Resource = z.infer<typeof resourceSchema>;

// API Request/Response Types
export const generateLessonRequestSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  course: z.string().optional(),
  unit: z.string().optional(),
  gradeLevel: z.string().min(1, "Grade level is required"),
  bkdFocus: z.enum(["be", "know", "do"]),
  standards: z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    standardsName: z.string().min(1, "Standards name is required"),
    subject: z.string().min(1, "Subject is required"),
    codes: z.array(z.object({
      code: z.string().min(1, "Standard code is required"),
      description: z.string(),
    })).min(1, "At least one standard code is required"),
  }),
  duration: z.string().optional().default("45 minutes"),
  lessonPart: z.string().optional(),
});

export type GenerateLessonRequest = z.infer<typeof generateLessonRequestSchema>;

// Scope and Sequence Tables
export const scopeSequences = pgTable("scope_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  country: text("country").notNull(),
  state: text("state").notNull(),
  standardsName: text("standards_name").notNull(),
  schoolYear: text("school_year").notNull(), // e.g., "2024-2025"
  totalWeeks: integer("total_weeks").default(36),
  status: text("status").notNull().default("draft"), // draft, published, archived
  isTemplate: boolean("is_template").default(false),
  campusId: varchar("campus_id"), // null for personal, set for campus-wide
  parentScopeId: varchar("parent_scope_id"), // if derived from admin scope
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScopeSequenceSchema = createInsertSchema(scopeSequences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScopeSequence = z.infer<typeof insertScopeSequenceSchema>;
export type ScopeSequence = typeof scopeSequences.$inferSelect;

// Units within a Scope and Sequence
export const sequenceUnits = pgTable("sequence_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull(),
  unitNumber: integer("unit_number").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  transferGoal: text("transfer_goal"),
  startWeek: integer("start_week").notNull(),
  endWeek: integer("end_week").notNull(),
  nineWeeksPeriod: integer("nine_weeks_period").notNull(), // 1, 2, 3, or 4
  studentsWillKnow: jsonb("students_will_know").$type<string[]>().default([]),
  studentsWillBeSkilled: jsonb("students_will_be_skilled").$type<string[]>().default([]),
  standardCodes: jsonb("standard_codes").$type<{ code: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSequenceUnitSchema = createInsertSchema(sequenceUnits).omit({ id: true, createdAt: true });
export type InsertSequenceUnit = z.infer<typeof insertSequenceUnitSchema>;
export type SequenceUnit = typeof sequenceUnits.$inferSelect;

// Campus-level scope assignments (for admin to assign to all teachers)
export const campusScopes = pgTable("campus_scopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campusId: varchar("campus_id").notNull(),
  scopeId: varchar("scope_id").notNull(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampusScopeSchema = createInsertSchema(campusScopes).omit({ id: true, createdAt: true });
export type InsertCampusScope = z.infer<typeof insertCampusScopeSchema>;
export type CampusScope = typeof campusScopes.$inferSelect;

// Teacher change requests for admin-set scopes
export const scopeChangeRequests = pgTable("scope_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull(),
  userId: varchar("user_id").notNull(),
  unitId: varchar("unit_id"), // null if requesting scope-level changes
  changeType: text("change_type").notNull(), // "add_unit", "modify_unit", "remove_unit", "modify_scope"
  proposedChanges: jsonb("proposed_changes").notNull().$type<Record<string, unknown>>(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScopeChangeRequestSchema = createInsertSchema(scopeChangeRequests).omit({ id: true, createdAt: true, reviewedAt: true });
export type InsertScopeChangeRequest = z.infer<typeof insertScopeChangeRequestSchema>;
export type ScopeChangeRequest = typeof scopeChangeRequests.$inferSelect;

// Scope with units (for API response)
export const scopeWithUnitsSchema = z.object({
  scope: z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    country: z.string(),
    state: z.string(),
    standardsName: z.string(),
    schoolYear: z.string(),
    totalWeeks: z.number().nullable(),
    status: z.string(),
    isTemplate: z.boolean().nullable(),
    campusId: z.string().nullable(),
    parentScopeId: z.string().nullable(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
  }),
  units: z.array(z.object({
    id: z.string(),
    scopeId: z.string(),
    unitNumber: z.number(),
    title: z.string(),
    summary: z.string().nullable(),
    transferGoal: z.string().nullable(),
    startWeek: z.number(),
    endWeek: z.number(),
    nineWeeksPeriod: z.number(),
    studentsWillKnow: z.array(z.string()).nullable(),
    studentsWillBeSkilled: z.array(z.string()).nullable(),
    standardCodes: z.array(z.object({
      code: z.string(),
      description: z.string(),
    })).nullable(),
    createdAt: z.date().nullable(),
  })),
});

export type ScopeWithUnits = z.infer<typeof scopeWithUnitsSchema>;

// Self-Discovery Assessment Results
export const selfDiscoveryResults = pgTable("self_discovery_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  beScore: integer("be_score").notNull(),
  knowScore: integer("know_score").notNull(),
  doScore: integer("do_score").notNull(),
  totalScore: integer("total_score").notNull(),
  strengths: jsonb("strengths").$type<string[]>().default([]),
  growthAreas: jsonb("growth_areas").$type<string[]>().default([]),
  answers: jsonb("answers").$type<Record<string, { value: string; score: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSelfDiscoveryResultSchema = createInsertSchema(selfDiscoveryResults).omit({ id: true, createdAt: true });
export type InsertSelfDiscoveryResult = z.infer<typeof insertSelfDiscoveryResultSchema>;
export type SelfDiscoveryResult = typeof selfDiscoveryResults.$inferSelect;

// Saved Careers (for students to bookmark careers they're interested in)
export const savedCareers = pgTable("saved_careers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  careerId: varchar("career_id").notNull(),
  careerTitle: text("career_title").notNull(),
  careerCategory: text("career_category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedCareerSchema = createInsertSchema(savedCareers).omit({ id: true, createdAt: true });
export type InsertSavedCareer = z.infer<typeof insertSavedCareerSchema>;
export type SavedCareer = typeof savedCareers.$inferSelect;

// Educator Affiliate Profiles
export const educatorAffiliates = pgTable("educator_affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  referralCode: varchar("referral_code").notNull(), // unique code like "TEACH123"
  displayName: text("display_name"),
  bio: text("bio"),
  totalPoints: integer("total_points").default(0),
  totalViews: integer("total_views").default(0),
  totalShares: integer("total_shares").default(0),
  totalReferrals: integer("total_referrals").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorAffiliateSchema = createInsertSchema(educatorAffiliates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorAffiliate = z.infer<typeof insertEducatorAffiliateSchema>;
export type EducatorAffiliate = typeof educatorAffiliates.$inferSelect;

// Referral Events (tracks views, shares, signups from shared content)
export const referralEvents = pgTable("referral_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  lessonId: varchar("lesson_id"),
  shareId: varchar("share_id"),
  eventType: text("event_type").notNull(), // "view", "share", "copy_link", "signup", "lesson_save"
  channel: text("channel"), // "twitter", "facebook", "linkedin", "email", "direct"
  visitorId: text("visitor_id"), // anonymous tracking ID
  referredUserId: varchar("referred_user_id"), // if they signed up
  pointsEarned: integer("points_earned").default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralEventSchema = createInsertSchema(referralEvents).omit({ id: true, createdAt: true });
export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;
export type ReferralEvent = typeof referralEvents.$inferSelect;

// Affiliate Rewards (points ledger for redemption)
export const affiliateRewards = pgTable("affiliate_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull(),
  points: integer("points").notNull(),
  rewardType: text("reward_type").notNull(), // "earned", "redeemed", "bonus"
  description: text("description"),
  status: text("status").default("active"), // "active", "pending", "redeemed", "expired"
  eventId: varchar("event_id"), // links to referral event if applicable
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAffiliateRewardSchema = createInsertSchema(affiliateRewards).omit({ id: true, createdAt: true });
export type InsertAffiliateReward = z.infer<typeof insertAffiliateRewardSchema>;
export type AffiliateReward = typeof affiliateRewards.$inferSelect;

// Affiliate Dashboard Stats (computed type for API response)
export const affiliateDashboardSchema = z.object({
  affiliate: z.object({
    id: z.string(),
    userId: z.string(),
    referralCode: z.string(),
    displayName: z.string().nullable(),
    bio: z.string().nullable(),
    totalPoints: z.number().nullable(),
    totalViews: z.number().nullable(),
    totalShares: z.number().nullable(),
    totalReferrals: z.number().nullable(),
    isActive: z.boolean().nullable(),
  }),
  recentEvents: z.array(z.object({
    id: z.string(),
    eventType: z.string(),
    channel: z.string().nullable(),
    pointsEarned: z.number().nullable(),
    createdAt: z.date().nullable(),
  })),
  rewards: z.array(z.object({
    id: z.string(),
    points: z.number(),
    rewardType: z.string(),
    description: z.string().nullable(),
    status: z.string().nullable(),
    createdAt: z.date().nullable(),
  })),
});

export type AffiliateDashboard = z.infer<typeof affiliateDashboardSchema>;

// ================================
// Educational Standards Ingestion System
// ================================

// Jurisdictions (Countries/States that have standards)
export const standardsJurisdictions = pgTable("standards_jurisdictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id"), // CSP jurisdiction ID
  country: text("country").notNull(),
  name: text("name").notNull(), // e.g., "Texas", "California"
  abbreviation: text("abbreviation").notNull(), // e.g., "TX", "CA"
  standardsName: text("standards_name").notNull(), // e.g., "TEKS", "CCSS"
  source: text("source").notNull(), // "csp", "case", "manual", "pdf_import"
  sourceUrl: text("source_url"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJurisdictionSchema = createInsertSchema(standardsJurisdictions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStandardsJurisdiction = z.infer<typeof insertJurisdictionSchema>;
export type StandardsJurisdiction = typeof standardsJurisdictions.$inferSelect;

// Standard Sets (groups of standards, e.g., "Grade 6 Math")
export const standardSets = pgTable("standard_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: varchar("uid").unique().notNull(), // Composite hash: country+state+year+grade+subject
  externalId: varchar("external_id"), // CSP standard_set ID
  jurisdictionId: varchar("jurisdiction_id").notNull(),
  title: text("title").notNull(), // e.g., "Grade 6 Mathematics"
  subject: text("subject").notNull(),
  educationLevels: jsonb("education_levels").$type<string[]>(), // grade levels
  documentTitle: text("document_title"), // source document title
  documentUrl: text("document_url"),
  documentYear: varchar("document_year"), // e.g., "2024"
  licenseTitle: text("license_title"),
  licenseUrl: text("license_url"),
  source: text("source").notNull(), // "csp", "case", "manual", "pdf_import"
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStandardSetSchema = createInsertSchema(standardSets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStandardSet = z.infer<typeof insertStandardSetSchema>;
export type StandardSet = typeof standardSets.$inferSelect;

// Individual Standards (the actual learning objectives)
export const educationalStandardsDb = pgTable("educational_standards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: varchar("uid").unique().notNull(), // Composite hash for deduplication
  externalId: varchar("external_id"), // External system ID (CSP, CASE, ASN)
  asnIdentifier: varchar("asn_identifier"), // Achievement Standards Network ID
  standardSetId: varchar("standard_set_id").notNull(),
  humanCoding: varchar("human_coding").notNull(), // e.g., "CCSS.ELA-LITERACY.RI.1.1"
  statementLabel: text("statement_label"), // e.g., "Standard", "Cluster", "Domain"
  statement: text("statement").notNull(), // The actual learning objective text
  description: text("description"), // Extended description if available
  gradeLevel: text("grade_level"), // e.g., "6", "K", "9-12"
  depth: integer("depth").default(0), // Hierarchy depth in tree
  position: integer("position").default(0), // Order position
  parentId: varchar("parent_id"), // For hierarchical standards
  versionHistory: jsonb("version_history").$type<{
    version: string;
    changedAt: string;
    previousStatement?: string;
    changeType: "create" | "update" | "deprecate";
  }[]>(),
  isActive: boolean("is_active").default(true),
  source: text("source").notNull(), // "csp", "case", "manual", "pdf_import"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducationalStandardSchema = createInsertSchema(educationalStandardsDb).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducationalStandard = z.infer<typeof insertEducationalStandardSchema>;
export type EducationalStandard = typeof educationalStandardsDb.$inferSelect;

// Standards Sync Log (tracks sync operations)
export const standardsSyncLog = pgTable("standards_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // "csp", "case", "pdf_import"
  jurisdictionId: varchar("jurisdiction_id"),
  standardSetId: varchar("standard_set_id"),
  status: text("status").notNull(), // "started", "in_progress", "completed", "failed"
  totalRecords: integer("total_records").default(0),
  processedRecords: integer("processed_records").default(0),
  newRecords: integer("new_records").default(0),
  updatedRecords: integer("updated_records").default(0),
  errorCount: integer("error_count").default(0),
  errorMessages: jsonb("error_messages").$type<string[]>(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  triggeredBy: varchar("triggered_by"), // "cron", "manual", user ID
});

export const insertSyncLogSchema = createInsertSchema(standardsSyncLog).omit({ id: true, startedAt: true });
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof standardsSyncLog.$inferSelect;

// PDF Import Queue (for Tier 3 sources)
export const pdfImportQueue = pgTable("pdf_import_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  country: text("country").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  status: text("status").notNull().default("pending"), // "pending", "processing", "completed", "failed"
  extractedData: jsonb("extracted_data").$type<{
    rawText?: string;
    standards?: Array<{
      code: string;
      statement: string;
      gradeLevel?: string;
    }>;
    confidence?: number;
  }>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertPdfImportSchema = createInsertSchema(pdfImportQueue).omit({ id: true, createdAt: true });
export type InsertPdfImport = z.infer<typeof insertPdfImportSchema>;
export type PdfImport = typeof pdfImportQueue.$inferSelect;
