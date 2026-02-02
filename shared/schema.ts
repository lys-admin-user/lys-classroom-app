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

// Lesson Plan Templates (for one-click lesson creation)
export const lessonTemplates = pgTable("lesson_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  gradeLevel: text("grade_level").notNull(),
  subject: text("subject"),
  bkdFocus: text("bkd_focus").notNull(),
  duration: text("duration").notNull(),
  objectives: jsonb("objectives").notNull().$type<string[]>(),
  activities: jsonb("activities").notNull().$type<{ title: string; description: string; duration: string; type: string }[]>(),
  materials: jsonb("materials").notNull().$type<string[]>(),
  assessmentTemplate: text("assessment_template").notNull(),
  lysMethodology: jsonb("lys_methodology").$type<{ be: { focus: string; description: string }; know: { focus: string; description: string }; do: { focus: string; description: string } }>(),
  tags: jsonb("tags").$type<string[]>(),
  visibility: text("visibility").notNull().default("private"),
  useCount: integer("use_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLessonTemplateSchema = createInsertSchema(lessonTemplates).omit({ id: true, createdAt: true, updatedAt: true, useCount: true });
export type InsertLessonTemplate = z.infer<typeof insertLessonTemplateSchema>;
export type LessonTemplate = typeof lessonTemplates.$inferSelect;

// Lesson Generation Tracking (for free tier limits)
export const lessonGenerations = pgTable("lesson_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonGenerationSchema = createInsertSchema(lessonGenerations).omit({ id: true, createdAt: true });
export type InsertLessonGeneration = z.infer<typeof insertLessonGenerationSchema>;
export type LessonGeneration = typeof lessonGenerations.$inferSelect;

// Guest Lesson Generation Tracking (for unauthenticated users, tracked by IP)
export const guestLessonGenerations = pgTable("guest_lesson_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: varchar("ip_address").notNull(),
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGuestLessonGenerationSchema = createInsertSchema(guestLessonGenerations).omit({ id: true, createdAt: true });
export type InsertGuestLessonGeneration = z.infer<typeof insertGuestLessonGenerationSchema>;
export type GuestLessonGeneration = typeof guestLessonGenerations.$inferSelect;

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

// Grade Level Types for Career Recommendations
export const gradeLevelBand = z.enum(["elementary", "middle_school", "high_school", "post_secondary"]);
export type GradeLevelBand = z.infer<typeof gradeLevelBand>;

// Job Outlook Categories based on BLS projections
export const jobOutlook = z.enum(["declining", "little_change", "average", "faster_than_average", "much_faster"]);
export type JobOutlook = z.infer<typeof jobOutlook>;

// Be-Know-Do Career Alignment Schema
// Weights indicate how strongly a career aligns with each pillar (0-100)
// - BE: Identity, purpose, values alignment (careers requiring strong self-awareness, ethics, identity)
// - KNOW: Knowledge acquisition, research, learning (careers requiring extensive study, expertise)
// - DO: Action, execution, practical skills (careers requiring hands-on work, project completion)
export const bkdCareerAlignmentSchema = z.object({
  be: z.number().min(0).max(100), // Identity/purpose alignment weight
  know: z.number().min(0).max(100), // Knowledge/learning alignment weight
  do: z.number().min(0).max(100), // Action/execution alignment weight
  primaryPillar: z.enum(["be", "know", "do"]), // Which pillar is most dominant
  careerPersonality: z.string().optional(), // Brief description of ideal personality fit
});

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
  // Be-Know-Do Alignment for personalized recommendations
  bkdAlignment: bkdCareerAlignmentSchema.optional(),
  // BLS and Market Data
  blsCode: z.string().optional(), // BLS Standard Occupational Classification (SOC) code
  jobOutlook: jobOutlook.optional(), // BLS job outlook category
  projectedGrowth: z.number().optional(), // Projected employment change percentage (2023-2033)
  projectedOpenings: z.number().optional(), // Annual job openings
  demandLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
  // Grade-appropriate recommendations
  appropriateGrades: z.array(gradeLevelBand).optional(), // Which grade bands this career is appropriate for
  entryPointsForGrades: z.record(z.string(), z.string()).optional(), // Grade-specific intro activities
  // State-specific data
  stateSalaryData: z.record(z.string(), z.object({
    min: z.number(),
    max: z.number(),
    median: z.number(),
    employment: z.number().optional(),
    demandLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
  })).optional(),
  // Additional BLS data
  workEnvironment: z.string().optional(),
  typicalEntryEducation: z.string().optional(),
  onTheJobTraining: z.string().optional(),
  blsLastUpdated: z.string().optional(),
});

export type Career = z.infer<typeof careerSchema>;

// Career Fields for mapping classes to career categories
export const CAREER_FIELDS = [
  { id: "stem", name: "STEM & Technology", subjects: ["math", "science", "computer science", "engineering", "physics", "chemistry", "biology"] },
  { id: "healthcare", name: "Healthcare & Medicine", subjects: ["biology", "chemistry", "health", "anatomy", "nursing"] },
  { id: "business", name: "Business & Finance", subjects: ["business", "economics", "accounting", "finance", "entrepreneurship"] },
  { id: "arts", name: "Arts & Creative", subjects: ["art", "music", "theater", "drama", "creative writing", "design"] },
  { id: "humanities", name: "Humanities & Social Sciences", subjects: ["history", "social studies", "psychology", "sociology", "philosophy"] },
  { id: "education", name: "Education & Training", subjects: ["education", "child development", "teaching"] },
  { id: "law", name: "Law & Government", subjects: ["government", "civics", "criminal justice", "law", "political science"] },
  { id: "trades", name: "Skilled Trades", subjects: ["woodworking", "auto shop", "welding", "construction", "hvac", "electrical"] },
  { id: "communications", name: "Communications & Media", subjects: ["english", "journalism", "communications", "media", "writing"] },
  { id: "agriculture", name: "Agriculture & Environment", subjects: ["agriculture", "environmental science", "ecology", "forestry"] },
] as const;

export type CareerFieldId = typeof CAREER_FIELDS[number]["id"];

// Helper to suggest career fields based on class subject
export function suggestCareerFields(subject: string): CareerFieldId[] {
  const lowerSubject = subject.toLowerCase();
  return CAREER_FIELDS
    .filter(field => field.subjects.some(s => lowerSubject.includes(s) || s.includes(lowerSubject)))
    .map(field => field.id);
}

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
  skipValidation: z.boolean().optional(), // Skip quality validation loop for faster generation
});

export type GenerateLessonRequest = z.infer<typeof generateLessonRequestSchema>;

// Question Bank System - Reusable questions for assignments
export const questionBanks = pgTable("question_banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull(),
  subject: text("subject").notNull(),
  gradeLevel: text("grade_level").notNull(),
  topic: text("topic").notNull(),
  questionType: text("question_type").notNull(), // multiple_choice, short_answer, essay, etc.
  bkdFocus: text("bkd_focus"), // be, know, do
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  stimulus: text("stimulus"), // The prompt/context
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer"),
  rubric: jsonb("rubric").$type<{ criteria: string; points: number }[]>(),
  distractorFeedback: jsonb("distractor_feedback").$type<{ option: string; feedback: string }[]>(),
  standardMappings: jsonb("standard_mappings").$type<{ code: string; description: string }[]>(),
  bloomsLevel: text("blooms_level"), // remember, understand, apply, analyze, evaluate, create
  depthOfKnowledge: integer("depth_of_knowledge"), // 1-4
  usageCount: integer("usage_count").default(0),
  visibility: text("visibility").notNull().default("personal"), // personal, campus, district, system
  organizationId: varchar("organization_id"),
  status: text("status").notNull().default("active"), // active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuestionBankSchema = createInsertSchema(questionBanks).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type QuestionBank = typeof questionBanks.$inferSelect;

// Author Quality Metrics - Track lesson author performance over time
export const authorQualityMetrics = pgTable("author_quality_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  lessonsCreated: integer("lessons_created").default(0),
  lessonsApproved: integer("lessons_approved").default(0),
  averageQualityScore: integer("average_quality_score").default(0),
  distinguishedCount: integer("distinguished_count").default(0),
  accomplishedCount: integer("accomplished_count").default(0),
  acceptableCount: integer("acceptable_count").default(0),
  needsImprovementCount: integer("needs_improvement_count").default(0),
  totalObjectivesCovered: integer("total_objectives_covered").default(0),
  standardsCoverage: jsonb("standards_coverage").$type<{ standardCode: string; count: number }[]>(),
  bkdDistribution: jsonb("bkd_distribution").$type<{ be: number; know: number; do: number }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuthorQualityMetricsSchema = createInsertSchema(authorQualityMetrics).omit({ id: true, createdAt: true });
export type InsertAuthorQualityMetrics = z.infer<typeof insertAuthorQualityMetricsSchema>;
export type AuthorQualityMetrics = typeof authorQualityMetrics.$inferSelect;

// Assignment Alignment Tracking - Links assignments to lesson objectives
export const assignmentAlignments = pgTable("assignment_alignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  objectiveIndex: integer("objective_index").notNull(), // Which lesson objective
  questionCount: integer("question_count").default(0), // Questions aligned to this objective
  coveragePercentage: integer("coverage_percentage").default(0),
  bkdFocus: text("bkd_focus"), // be, know, do
  standardMappings: jsonb("standard_mappings").$type<{ code: string; alignmentStrength: number }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentAlignmentSchema = createInsertSchema(assignmentAlignments).omit({ id: true, createdAt: true });
export type InsertAssignmentAlignment = z.infer<typeof insertAssignmentAlignmentSchema>;
export type AssignmentAlignment = typeof assignmentAlignments.$inferSelect;

// Scope Visibility Levels - defines inheritance hierarchy
export const SCOPE_VISIBILITY = {
  personal: "personal",     // Only visible to creator
  campus: "campus",         // Visible to all educators at campus
  district: "district",     // Visible to all campuses in district
  system: "system",         // System-wide (for authorized authors)
} as const;
export type ScopeVisibility = keyof typeof SCOPE_VISIBILITY;

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
  visibility: text("visibility").notNull().default("personal"), // personal, campus, district, system
  organizationId: varchar("organization_id"), // The org this scope belongs to (campus or district)
  campusId: varchar("campus_id"), // DEPRECATED: Use organizationId instead. Kept for backward compatibility
  parentScopeId: varchar("parent_scope_id"), // if derived from admin/district scope
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

// Student Journey - Tracks individual Be-Know-Do progress over time
// Note: "student" in the table name is legacy - this tracks both student AND educator journeys
// The userRole field differentiates between:
//   - student: Knowledge/career seeking (BE=identity, KNOW=career info, DO=skill building)
//   - educator: Career advancement/opportunity seeking (BE=teaching philosophy, KNOW=pedagogy, DO=professional growth)
export const studentJourneyEntries = pgTable("student_journey_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userRole: text("user_role").default("student"), // 'student', 'educator', 'campus_admin' - determines BKD context
  entryType: text("entry_type").notNull(), // 'assessment', 'goal_completed', 'milestone', 'reflection', 'career_exploration', 'skill_gained', 'professional_development', 'teaching_achievement', 'opportunity_created'
  bkdPillar: text("bkd_pillar").notNull(), // 'be', 'know', 'do'
  title: text("title").notNull(),
  description: text("description"),
  pointsEarned: integer("points_earned").default(0),
  metadata: jsonb("metadata").$type<{
    assessmentId?: string;
    goalId?: string;
    careerId?: string;
    skillName?: string;
    reflectionPrompt?: string;
    linkedStandards?: string[];
    opportunityType?: string; // for educator opportunities
    certificationName?: string; // for educator certifications
    lessonPlanId?: string; // for educator lesson achievements
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyEntrySchema = createInsertSchema(studentJourneyEntries).omit({ id: true, createdAt: true });
export type InsertStudentJourneyEntry = z.infer<typeof insertStudentJourneyEntrySchema>;
export type StudentJourneyEntry = typeof studentJourneyEntries.$inferSelect;

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

// Standards Staging Table (for approval workflow)
export const standardsStaging = pgTable("standards_staging", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jurisdictionId: varchar("jurisdiction_id").notNull(),
  standardSetId: varchar("standard_set_id"),
  humanCoding: varchar("human_coding").notNull(),
  statement: text("statement").notNull(),
  description: text("description"),
  gradeLevel: text("grade_level"),
  depth: integer("depth").default(0),
  position: integer("position").default(0),
  parentCode: varchar("parent_code"),
  source: text("source").notNull(), // "csp", "case", "pdf_import", "llm_extract"
  rawSourceText: text("raw_source_text"), // Original text before processing
  extractionConfidence: integer("extraction_confidence"), // AI confidence 0-100
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStagingSchema = createInsertSchema(standardsStaging).omit({ id: true, createdAt: true });
export type InsertStandardsStaging = z.infer<typeof insertStagingSchema>;
export type StandardsStaging = typeof standardsStaging.$inferSelect;

// Source Checksums (for change detection watchdog)
export const sourceChecksums = pgTable("source_checksums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceUrl: text("source_url").notNull().unique(),
  sourceName: text("source_name").notNull(),
  jurisdictionId: varchar("jurisdiction_id"),
  standardSetId: varchar("standard_set_id"),
  etag: varchar("etag"),
  md5Hash: varchar("md5_hash"),
  contentLength: integer("content_length"),
  lastModified: timestamp("last_modified"),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  hasChanged: boolean("has_changed").default(false),
  changeDetectedAt: timestamp("change_detected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChecksumSchema = createInsertSchema(sourceChecksums).omit({ id: true, createdAt: true });
export type InsertSourceChecksum = z.infer<typeof insertChecksumSchema>;
export type SourceChecksum = typeof sourceChecksums.$inferSelect;

// BLS Data Sync Log (tracks BLS Occupational Outlook updates)
export const blsSyncLog = pgTable("bls_sync_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(), // "full", "incremental", "wage_update"
  status: text("status").notNull(), // "started", "in_progress", "completed", "failed"
  totalOccupations: integer("total_occupations").default(0),
  processedOccupations: integer("processed_occupations").default(0),
  updatedOccupations: integer("updated_occupations").default(0),
  newOccupations: integer("new_occupations").default(0),
  errorCount: integer("error_count").default(0),
  errorMessages: jsonb("error_messages").$type<string[]>(),
  dataSource: text("data_source"), // "bls_api", "oews", "employment_projections"
  apiVersion: text("api_version"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  nextScheduledAt: timestamp("next_scheduled_at"),
  triggeredBy: text("triggered_by"), // "scheduled", "manual", user ID
});

export const insertBlsSyncLogSchema = createInsertSchema(blsSyncLog).omit({ id: true, startedAt: true });
export type InsertBlsSyncLog = z.infer<typeof insertBlsSyncLogSchema>;
export type BlsSyncLog = typeof blsSyncLog.$inferSelect;

// ================================
// Assignment System (Paid Feature)
// ================================

// Accommodation Types
export const accommodationTypes = [
  "extraTime",
  "notesCopyProvided",
  "studySheetProvided",
  "graphicOrganizer",
  "mnemonicDevices",
  "largerFont",
  "shortenedText",
  "peerSupport",
  "preferentialSeating",
  "frequentReminders",
  "completedExample",
  "visualOrganizer"
] as const;
export type AccommodationType = typeof accommodationTypes[number];

// Accommodation labels for display
export const accommodationLabels: Record<AccommodationType, string> = {
  extraTime: "Extra Time",
  notesCopyProvided: "Notes/Presentation Copy Provided",
  studySheetProvided: "Study Sheet Provided",
  graphicOrganizer: "Graphic Organizer",
  mnemonicDevices: "Mnemonic Devices",
  largerFont: "Larger Size Font",
  shortenedText: "Shortened Text",
  peerSupport: "Peer Support",
  preferentialSeating: "Preferential Seating",
  frequentReminders: "Frequent On Task Reminders",
  completedExample: "Provided A Completed Example",
  visualOrganizer: "Visual Organizer Provided"
};

// Classes Table (educator's classes)
// Classes should belong to a school/campus organization for proper hierarchy
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id"), // Should be a school/campus type org - required for hierarchy
  name: text("name").notNull(),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  period: text("period"),
  room: text("room"), // Physical or virtual room location
  schoolYear: text("school_year"),
  term: text("term"), // semester, quarter, trimester, etc.
  maxStudents: integer("max_students").default(35).notNull(),
  isActive: boolean("is_active").default(true),
  // Career alignment - maps this class to career categories for student insights
  careerFields: jsonb("career_fields").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Students Table
// Students should belong to a school/campus organization for proper hierarchy
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Links to users table for login
  organizationId: varchar("organization_id"), // School/campus where student is enrolled - required for hierarchy
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  studentId: text("student_id"), // School-assigned student ID
  email: text("email"),
  gradeLevel: text("grade_level"),
  birthDate: timestamp("birth_date"),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  status: text("status").default("active"), // active, inactive, graduated, transferred
  accommodations: jsonb("accommodations").$type<{
    type: AccommodationType;
    description: string;
    active: boolean;
  }[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Class-Student Junction Table - Enrollment records
export const classStudents = pgTable("class_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  enrolledBy: varchar("enrolled_by"), // User ID of who enrolled the student
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  droppedAt: timestamp("dropped_at"),
  status: text("status").default("enrolled"), // enrolled, dropped, completed
  finalGrade: text("final_grade"),
});

export const insertClassStudentSchema = createInsertSchema(classStudents).omit({ id: true, enrolledAt: true });
export type InsertClassStudent = z.infer<typeof insertClassStudentSchema>;
export type ClassStudent = typeof classStudents.$inferSelect;

// ================================
// Student Transfer Requests (Triple Confirmation Workflow)
// ================================

// Transfer request statuses
export const transferRequestStatuses = [
  "pending_campus",      // Waiting for source campus approval
  "pending_district",    // Waiting for district approval
  "pending_system_admin", // Waiting for system admin approval
  "approved",            // All approvals complete, transfer executed
  "rejected",            // Rejected at any level
  "cancelled"            // Cancelled by requester
] as const;
export type TransferRequestStatus = typeof transferRequestStatuses[number];

// Transfer types - between educators (same org) or between organizations
export const transferTypes = ["educator", "organization"] as const;
export type TransferType = typeof transferTypes[number];

// Student Transfer Requests Table
export const studentTransferRequests = pgTable("student_transfer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Student being transferred
  studentId: varchar("student_id").notNull(),
  
  // Transfer type: within org (between educators) or between orgs
  transferType: text("transfer_type").notNull().$type<TransferType>(),
  
  // Source information
  sourceEducatorId: varchar("source_educator_id").notNull(), // Current educator's user ID
  sourceOrganizationId: varchar("source_organization_id"), // Current org (campus/school)
  sourceDistrictId: varchar("source_district_id"), // Current district
  
  // Target information
  targetEducatorId: varchar("target_educator_id"), // New educator (for educator transfers)
  targetOrganizationId: varchar("target_organization_id"), // New org (for org transfers)
  targetDistrictId: varchar("target_district_id"), // New district (if cross-district)
  
  // Request details
  requestedBy: varchar("requested_by").notNull(), // User ID who initiated request
  reason: text("reason"), // Reason for transfer
  notes: text("notes"),
  
  // Current status
  status: text("status").notNull().default("pending_campus").$type<TransferRequestStatus>(),
  
  // Campus level approval (first approval)
  campusApprovedBy: varchar("campus_approved_by"),
  campusApprovedAt: timestamp("campus_approved_at"),
  campusRejectionReason: text("campus_rejection_reason"),
  
  // District level approval (second approval)
  districtApprovedBy: varchar("district_approved_by"),
  districtApprovedAt: timestamp("district_approved_at"),
  districtRejectionReason: text("district_rejection_reason"),
  
  // System admin approval (third/final approval)
  systemAdminApprovedBy: varchar("system_admin_approved_by"),
  systemAdminApprovedAt: timestamp("system_admin_approved_at"),
  systemAdminRejectionReason: text("system_admin_rejection_reason"),
  
  // Transfer execution
  transferExecutedAt: timestamp("transfer_executed_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentTransferRequestSchema = createInsertSchema(studentTransferRequests).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  campusApprovedBy: true,
  campusApprovedAt: true,
  districtApprovedBy: true,
  districtApprovedAt: true,
  systemAdminApprovedBy: true,
  systemAdminApprovedAt: true,
  transferExecutedAt: true
});
export type InsertStudentTransferRequest = z.infer<typeof insertStudentTransferRequestSchema>;
export type StudentTransferRequest = typeof studentTransferRequests.$inferSelect;

// ================================
// Student Journey Progress (Be-Know-Do Tracking)
// ================================

// BKD Category types for journey tracking
export const bkdCategories = ["be", "know", "do"] as const;
export type BkdCategory = typeof bkdCategories[number];

// Journey milestone status
export const journeyMilestoneStatuses = ["not_started", "in_progress", "completed", "mastered"] as const;
export type JourneyMilestoneStatus = typeof journeyMilestoneStatuses[number];

// Student Journey Progress Table - tracks overall BKD journey
export const studentJourneyProgress = pgTable("student_journey_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  educatorUserId: varchar("educator_user_id").notNull(),
  organizationId: varchar("organization_id"),
  
  // Overall scores (0-100)
  beScore: integer("be_score").notNull().default(0),
  knowScore: integer("know_score").notNull().default(0),
  doScore: integer("do_score").notNull().default(0),
  overallScore: integer("overall_score").notNull().default(0),
  
  // Journey metadata
  journeyStartDate: timestamp("journey_start_date").defaultNow(),
  lastActivityDate: timestamp("last_activity_date").defaultNow(),
  totalAssessmentsCompleted: integer("total_assessments_completed").notNull().default(0),
  totalMilestonesAchieved: integer("total_milestones_achieved").notNull().default(0),
  
  // Current focus area
  currentFocus: text("current_focus").$type<BkdCategory>().default("be"),
  
  // Saved career interests from exploration
  savedCareerIds: jsonb("saved_career_ids").$type<string[]>().default([]),
  
  // Self-discovery assessment results
  latestAssessmentResults: jsonb("latest_assessment_results").$type<{
    completedAt: string;
    beAnswers: Record<string, number>;
    knowAnswers: Record<string, number>;
    doAnswers: Record<string, number>;
    strengths: string[];
    growthAreas: string[];
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentJourneyProgressSchema = createInsertSchema(studentJourneyProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentJourneyProgress = z.infer<typeof insertStudentJourneyProgressSchema>;
export type StudentJourneyProgress = typeof studentJourneyProgress.$inferSelect;

// Student Journey Milestones - individual achievements in the journey
export const studentJourneyMilestones = pgTable("student_journey_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  journeyProgressId: varchar("journey_progress_id").notNull(),
  
  // Milestone details
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().$type<BkdCategory>(),
  status: text("status").notNull().default("not_started").$type<JourneyMilestoneStatus>(),
  
  // Progress tracking
  targetValue: integer("target_value").default(100),
  currentValue: integer("current_value").notNull().default(0),
  
  // Points and rewards
  pointsEarned: integer("points_earned").notNull().default(0),
  badgeId: varchar("badge_id"),
  
  // Dates
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Evidence/notes
  evidence: jsonb("evidence").$type<{
    type: "assignment" | "assessment" | "reflection" | "project" | "observation";
    title: string;
    date: string;
    notes?: string;
  }[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyMilestoneSchema = createInsertSchema(studentJourneyMilestones).omit({ id: true, createdAt: true });
export type InsertStudentJourneyMilestone = z.infer<typeof insertStudentJourneyMilestoneSchema>;
export type StudentJourneyMilestone = typeof studentJourneyMilestones.$inferSelect;

// Student Journey Activity Log - tracks all activities in the journey
export const studentJourneyActivities = pgTable("student_journey_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  journeyProgressId: varchar("journey_progress_id").notNull(),
  
  // Activity details
  activityType: text("activity_type").notNull().$type<"assessment" | "lesson" | "career_exploration" | "goal_progress" | "reflection" | "milestone_achieved">(),
  title: text("title").notNull(),
  description: text("description"),
  
  // BKD impact
  category: text("category").$type<BkdCategory>(),
  pointsEarned: integer("points_earned").notNull().default(0),
  
  // Related entities
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: varchar("related_entity_id"),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyActivitySchema = createInsertSchema(studentJourneyActivities).omit({ id: true, createdAt: true });
export type InsertStudentJourneyActivity = z.infer<typeof insertStudentJourneyActivitySchema>;
export type StudentJourneyActivity = typeof studentJourneyActivities.$inferSelect;

// Student Journey Progress History - tracks Be-Know-Do score snapshots over time
export const studentJourneyProgressHistory = pgTable("student_journey_progress_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  journeyProgressId: varchar("journey_progress_id").notNull(),
  
  // Snapshot scores at this point in time
  beScore: integer("be_score").notNull(),
  knowScore: integer("know_score").notNull(),
  doScore: integer("do_score").notNull(),
  overallScore: integer("overall_score").notNull(),
  
  // Context for the snapshot
  snapshotType: text("snapshot_type").notNull().$type<"assessment" | "milestone" | "weekly" | "monthly" | "manual">(),
  triggerEvent: text("trigger_event"), // What triggered this snapshot (e.g., "completed_assessment", "milestone_achieved")
  notes: text("notes"),
  
  // Cumulative stats at snapshot time
  totalMilestonesCompleted: integer("total_milestones_completed").default(0),
  totalActivitiesLogged: integer("total_activities_logged").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentJourneyProgressHistorySchema = createInsertSchema(studentJourneyProgressHistory).omit({ id: true, createdAt: true });
export type InsertStudentJourneyProgressHistory = z.infer<typeof insertStudentJourneyProgressHistorySchema>;
export type StudentJourneyProgressHistory = typeof studentJourneyProgressHistory.$inferSelect;

// ================================
// Student Matriculation & Achievement Tracking (System-Level)
// ================================

// Matriculation Event Types
export const MATRICULATION_EVENT_TYPES = [
  "enrollment", // Initial enrollment
  "grade_promotion", // Moved to next grade
  "grade_retention", // Held back a grade
  "transfer_in", // Transferred in from another school
  "transfer_out", // Transferred out to another school
  "withdrawal", // Withdrawn from school
  "graduation", // Completed program/graduated
  "re_enrollment", // Re-enrolled after withdrawal
  "status_change", // General status change
] as const;
export type MatriculationEventType = typeof MATRICULATION_EVENT_TYPES[number];

// Student Matriculation History - tracks grade progression and enrollment changes
export const studentMatriculationHistory = pgTable("student_matriculation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(), // References students table
  organizationId: varchar("organization_id"), // School/campus where event occurred
  
  eventType: text("event_type").notNull().$type<MatriculationEventType>(),
  eventDate: timestamp("event_date").notNull().defaultNow(),
  
  // Grade level tracking
  previousGradeLevel: text("previous_grade_level"),
  newGradeLevel: text("new_grade_level"),
  
  // Academic year tracking
  academicYear: text("academic_year"), // e.g., "2025-2026"
  semester: text("semester"), // "fall", "spring", "summer"
  
  // For transfers
  previousOrganizationId: varchar("previous_organization_id"),
  newOrganizationId: varchar("new_organization_id"),
  
  // Status tracking
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  
  // Additional info
  reason: text("reason"), // Reason for the change
  notes: text("notes"),
  documentUrl: text("document_url"), // Supporting document
  
  // Approval tracking
  approvedBy: varchar("approved_by"), // Admin who approved
  approvedAt: timestamp("approved_at"),
  
  // Audit trail
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentMatriculationHistorySchema = createInsertSchema(studentMatriculationHistory).omit({ 
  id: true, createdAt: true 
});
export type InsertStudentMatriculationHistory = z.infer<typeof insertStudentMatriculationHistorySchema>;
export type StudentMatriculationHistory = typeof studentMatriculationHistory.$inferSelect;

// System Achievement Types
export const ACHIEVEMENT_CATEGORIES = [
  "academic", // GPA, honor roll, dean's list
  "skill", // Skill mastery, competency
  "behavior", // Attendance, citizenship
  "extracurricular", // Sports, clubs, activities
  "career", // Career readiness, certifications
  "bkd", // Be-Know-Do framework achievements
  "custom", // Custom achievements
] as const;
export type AchievementCategory = typeof ACHIEVEMENT_CATEGORIES[number];

// System Achievements - defines available achievements
export const systemAchievements = pgTable("system_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Basic info
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().$type<AchievementCategory>(),
  
  // Visual elements
  badgeImageUrl: text("badge_image_url"),
  iconName: text("icon_name"), // Lucide icon name
  color: text("color"), // Badge color
  
  // Criteria
  criteria: jsonb("criteria").$type<{
    type: "automatic" | "manual"; // Automatic based on rules, or manually awarded
    rules?: {
      metric: string; // e.g., "gpa", "attendance_rate", "be_score"
      operator: "gte" | "lte" | "eq" | "gt" | "lt";
      value: number;
    }[];
    requiresEvidence?: boolean;
  }>(),
  
  // Points/rewards
  pointValue: integer("point_value").default(0),
  
  // Scope
  isSystemWide: boolean("is_system_wide").default(true), // Available to all organizations
  organizationId: varchar("organization_id"), // If org-specific
  gradeLevels: jsonb("grade_levels").$type<string[]>(), // Which grade levels can earn this
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemAchievementSchema = createInsertSchema(systemAchievements).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export type InsertSystemAchievement = z.infer<typeof insertSystemAchievementSchema>;
export type SystemAchievement = typeof systemAchievements.$inferSelect;

// Student Achievements - records of achievements earned by students
export const studentAchievements = pgTable("student_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(), // References students table
  achievementId: varchar("achievement_id").notNull(), // References system_achievements
  
  // When/where earned
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  academicYear: text("academic_year"),
  organizationId: varchar("organization_id"), // Where it was earned
  
  // Evidence/verification
  evidence: jsonb("evidence").$type<{
    type: string; // "document", "grade_report", "certificate", etc.
    url?: string;
    description?: string;
  }[]>(),
  
  // Verification status
  status: text("status").default("pending").$type<"pending" | "verified" | "revoked">(),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  revokedReason: text("revoked_reason"),
  
  // Additional context
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Flexible additional data
  
  // Audit
  awardedBy: varchar("awarded_by").notNull(), // Who awarded it (can be system or user)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentAchievementSchema = createInsertSchema(studentAchievements).omit({ 
  id: true, createdAt: true 
});
export type InsertStudentAchievement = z.infer<typeof insertStudentAchievementSchema>;
export type StudentAchievement = typeof studentAchievements.$inferSelect;

// Entity Shares - for sharing classroom data across organizations
export type EntitySharePermission = "view" | "edit" | "copy";
export type ShareableEntityType = "class" | "student" | "assignment" | "lesson" | "scope_sequence";

export const entityShares = pgTable("entity_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull().$type<ShareableEntityType>(),
  entityId: varchar("entity_id").notNull(),
  sourceOrganizationId: varchar("source_organization_id").notNull(),
  targetOrganizationId: varchar("target_organization_id").notNull(),
  permission: text("permission").notNull().default("view").$type<EntitySharePermission>(),
  sharedBy: varchar("shared_by").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEntityShareSchema = createInsertSchema(entityShares).omit({ id: true, createdAt: true });
export type InsertEntityShare = z.infer<typeof insertEntityShareSchema>;
export type EntityShare = typeof entityShares.$inferSelect;

// Student Groups (for group assignments)
export const studentGroups = pgTable("student_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id"),
  name: text("name").notNull(),
  description: text("description"),
  studentIds: jsonb("student_ids").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentGroupSchema = createInsertSchema(studentGroups).omit({ id: true, createdAt: true });
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type StudentGroup = typeof studentGroups.$inferSelect;

// Assignment target types
export const assignmentTargetTypes = ["class", "accommodation_group", "individual"] as const;
export type AssignmentTargetType = typeof assignmentTargetTypes[number];

// Assignments Table
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lessonId: varchar("lesson_id"),
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  questions: jsonb("questions").$type<{
    id: string;
    type: "multiple_choice" | "short_answer" | "essay" | "true_false" | "matching";
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    bkdFocus?: "be" | "know" | "do";
  }[]>(),
  totalPoints: integer("total_points"),
  dueDate: timestamp("due_date"),
  
  // Target type: class, accommodation_group, or individual
  targetType: text("target_type").notNull().default("class").$type<AssignmentTargetType>(),
  
  // For class targeting
  classId: varchar("class_id"),
  
  // For accommodation group targeting - array of accommodation types to include
  targetAccommodations: jsonb("target_accommodations").$type<AccommodationType[]>(),
  
  // For individual targeting - array of student IDs
  targetStudentIds: jsonb("target_student_ids").$type<string[]>(),
  
  assignmentType: text("assignment_type").notNull().default("individual"),
  status: text("status").notNull().default("draft"),
  accommodationModified: boolean("accommodation_modified").default(false),
  accommodationTypes: jsonb("accommodation_types").$type<string[]>(),
  accommodationNotes: text("accommodation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

// Assignment Recipients (who the assignment is assigned to)
export const assignmentRecipients = pgTable("assignment_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  recipientType: text("recipient_type").notNull(),
  recipientId: varchar("recipient_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status").notNull().default("assigned"),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  feedback: text("feedback"),
});

export const insertAssignmentRecipientSchema = createInsertSchema(assignmentRecipients).omit({ id: true, assignedAt: true });
export type InsertAssignmentRecipient = z.infer<typeof insertAssignmentRecipientSchema>;
export type AssignmentRecipient = typeof assignmentRecipients.$inferSelect;

// ================================
// Gradebook System
// ================================

// Grade Categories (weights for different assignment types)
export const gradeCategories = pgTable("grade_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id").notNull(),
  name: text("name").notNull(),
  weight: integer("weight").notNull().default(100),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGradeCategorySchema = createInsertSchema(gradeCategories).omit({ id: true, createdAt: true });
export type InsertGradeCategory = z.infer<typeof insertGradeCategorySchema>;
export type GradeCategory = typeof gradeCategories.$inferSelect;

// Student Grades Table
export const studentGrades = pgTable("student_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  assignmentId: varchar("assignment_id"),
  categoryId: varchar("category_id"),
  title: text("title").notNull(),
  pointsEarned: integer("points_earned"),
  pointsPossible: integer("points_possible").notNull().default(100),
  percentage: integer("percentage"),
  letterGrade: text("letter_grade"),
  comments: text("comments"),
  gradedAt: timestamp("graded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentGradeSchema = createInsertSchema(studentGrades).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentGrade = z.infer<typeof insertStudentGradeSchema>;
export type StudentGrade = typeof studentGrades.$inferSelect;

// Grading Periods (quarters, semesters, etc.)
export const gradingPeriods = pgTable("grading_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id"),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGradingPeriodSchema = createInsertSchema(gradingPeriods).omit({ id: true, createdAt: true });
export type InsertGradingPeriod = z.infer<typeof insertGradingPeriodSchema>;
export type GradingPeriod = typeof gradingPeriods.$inferSelect;

// ================================
// Student Digital Portfolio System
// ================================

// Student Portfolios Table
export const studentPortfolios = pgTable("student_portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  shareableSlug: varchar("shareable_slug").unique(),
  privacy: text("privacy").notNull().default("private"),
  theme: text("theme").notNull().default("professional"),
  contactEmail: text("contact_email"),
  linkedinUrl: text("linkedin_url"),
  handshakeUrl: text("handshake_url"),
  customLinks: jsonb("custom_links").$type<{ label: string; url: string }[]>(),
  skills: jsonb("skills").$type<string[]>(),
  education: jsonb("education").$type<{
    institution: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
    current?: boolean;
  }[]>(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentPortfolioSchema = createInsertSchema(studentPortfolios).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertStudentPortfolio = z.infer<typeof insertStudentPortfolioSchema>;
export type StudentPortfolio = typeof studentPortfolios.$inferSelect;

// Portfolio Items Table
export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: varchar("item_id"),
  customTitle: text("custom_title").notNull(),
  customDescription: text("custom_description"),
  thumbnailUrl: text("thumbnail_url"),
  attachmentUrl: text("attachment_url"),
  displayOrder: integer("display_order").notNull().default(0),
  highlighted: boolean("highlighted").default(false),
  bkdFocus: text("bkd_focus"),
  skills: jsonb("skills").$type<string[]>(),
  completedAt: timestamp("completed_at"),
  score: text("score"),
  metadata: jsonb("metadata").$type<{
    originalTitle?: string;
    course?: string;
    educator?: string;
    feedback?: string;
    certificateId?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true });
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;

// Portfolio item types
export const portfolioItemTypes = [
  "assignment",
  "project",
  "reflection",
  "certificate",
  "achievement",
  "custom"
] as const;

export type PortfolioItemType = typeof portfolioItemTypes[number];

// Portfolio themes
export const portfolioThemes = [
  { id: "professional", name: "Professional", description: "Clean and formal design" },
  { id: "creative", name: "Creative", description: "Colorful and expressive design" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant design" },
  { id: "academic", name: "Academic", description: "Traditional academic style" },
] as const;

// Portfolio Comments Table (for teacher/parent feedback)
export const portfolioComments = pgTable("portfolio_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  portfolioItemId: varchar("portfolio_item_id"),
  authorId: varchar("author_id").notNull(),
  authorRole: text("author_role").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPortfolioCommentSchema = createInsertSchema(portfolioComments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPortfolioComment = z.infer<typeof insertPortfolioCommentSchema>;
export type PortfolioComment = typeof portfolioComments.$inferSelect;

// Accommodation Suggestions (static reference data)
export const accommodationSuggestions = [
  { id: "1", type: "extraTime" as AccommodationType, category: "Timing", suggestion: "Provide 1.5x to 2x extended time for completing assignments", source: "IDEA Best Practices" },
  { id: "2", type: "notesCopyProvided" as AccommodationType, category: "Presentation", suggestion: "Provide copies of notes or presentation slides before class", source: "Universal Design for Learning" },
  { id: "3", type: "studySheetProvided" as AccommodationType, category: "Support", suggestion: "Provide a study sheet with key concepts and vocabulary", source: "Differentiated Instruction" },
  { id: "4", type: "graphicOrganizer" as AccommodationType, category: "Organization", suggestion: "Use graphic organizers to structure information visually", source: "Cognitive Strategy Instruction" },
  { id: "5", type: "mnemonicDevices" as AccommodationType, category: "Memory", suggestion: "Teach mnemonic devices to aid in memorization", source: "Cognitive Strategy Instruction" },
  { id: "6", type: "largerFont" as AccommodationType, category: "Presentation", suggestion: "Increase font size to 14pt or larger for readability", source: "Section 504 Guidelines" },
  { id: "7", type: "shortenedText" as AccommodationType, category: "Presentation", suggestion: "Reduce reading length while maintaining key concepts", source: "Differentiated Instruction" },
  { id: "8", type: "peerSupport" as AccommodationType, category: "Support", suggestion: "Pair with a peer buddy for collaborative learning", source: "Cooperative Learning" },
  { id: "9", type: "preferentialSeating" as AccommodationType, category: "Setting", suggestion: "Seat near the front or away from distractions", source: "Section 504 Guidelines" },
  { id: "10", type: "frequentReminders" as AccommodationType, category: "Behavior", suggestion: "Provide regular check-ins and on-task prompts", source: "PBIS Framework" },
  { id: "11", type: "completedExample" as AccommodationType, category: "Modeling", suggestion: "Show a completed example before independent work", source: "Explicit Instruction" },
  { id: "12", type: "visualOrganizer" as AccommodationType, category: "Organization", suggestion: "Use visual schedules and checklists for task completion", source: "Universal Design for Learning" },
] as const;

export type AccommodationSuggestion = typeof accommodationSuggestions[number];

// Generate Assignment Request Schema
export const generateAssignmentRequestSchema = z.object({
  lessonId: z.string(),
  assignmentType: z.enum(["quiz", "worksheet", "project", "discussion", "reflection"]),
  questionCount: z.number().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  includeBeKnowDo: z.boolean().default(true),
  accommodationTypes: z.array(z.enum(accommodationTypes)).optional(),
  accommodationNotes: z.string().optional(),
});

// ================================
// Real-Time Collaboration System
// ================================

// Collaboration Sessions Table
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hostUserId: varchar("host_user_id").notNull(),
  lessonId: varchar("lesson_id"),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull().default("lesson_planning"),
  status: text("status").notNull().default("active"),
  inviteCode: varchar("invite_code").notNull(),
  maxParticipants: integer("max_participants").default(10),
  settings: jsonb("settings").$type<{
    allowEditing: boolean;
    allowChat: boolean;
    allowComments: boolean;
    requireApproval: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).omit({ id: true, createdAt: true });
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;

// Session Participants Table
export const sessionParticipants = pgTable("session_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("viewer"),
  status: text("status").notNull().default("active"),
  cursorPosition: jsonb("cursor_position").$type<{ line: number; column: number; section?: string }>(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

export const insertSessionParticipantSchema = createInsertSchema(sessionParticipants).omit({ id: true, joinedAt: true });
export type InsertSessionParticipant = z.infer<typeof insertSessionParticipantSchema>;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;

// Collaboration Messages (Chat) Table
export const collaborationMessages = pgTable("collaboration_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  messageType: text("message_type").notNull().default("chat"),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    mentionedUserIds?: string[];
    replyToId?: string;
    attachmentUrl?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCollaborationMessageSchema = createInsertSchema(collaborationMessages).omit({ id: true, createdAt: true });
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;
export type CollaborationMessage = typeof collaborationMessages.$inferSelect;

// Shared Resources Table
export const sharedResources = pgTable("shared_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  fileUrl: text("file_url"),
  content: text("content"),
  gradeLevel: text("grade_level"),
  subject: text("subject"),
  visibility: text("visibility").notNull().default("private"),
  downloadCount: integer("download_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSharedResourceSchema = createInsertSchema(sharedResources).omit({ id: true, createdAt: true, updatedAt: true, downloadCount: true, likeCount: true });
export type InsertSharedResource = z.infer<typeof insertSharedResourceSchema>;
export type SharedResource = typeof sharedResources.$inferSelect;

// Resource Likes Table
export const resourceLikes = pgTable("resource_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceLikeSchema = createInsertSchema(resourceLikes).omit({ id: true, createdAt: true });
export type InsertResourceLike = z.infer<typeof insertResourceLikeSchema>;
export type ResourceLike = typeof resourceLikes.$inferSelect;

// KNOW Resources Table - Admin-managed educational resources for career exploration
export const KNOW_RESOURCE_TYPES = ["book", "ebook", "youtube_channel", "podcast", "whatsapp_channel", "website", "course"] as const;
export type KnowResourceType = typeof KNOW_RESOURCE_TYPES[number];

export const knowResources = pgTable("know_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull().$type<KnowResourceType>(),
  category: text("category"), // career field: STEM, Healthcare, Business, Arts, etc.
  
  // Common fields
  url: text("url"),
  imageUrl: text("image_url"),
  author: text("author"),
  
  // Book/Ebook specific
  isbn: text("isbn"),
  publisher: text("publisher"),
  publishYear: integer("publish_year"),
  
  // YouTube specific
  channelId: text("channel_id"),
  subscriberCount: text("subscriber_count"),
  
  // Podcast specific
  rssFeedUrl: text("rss_feed_url"),
  podcastHost: text("podcast_host"),
  episodeCount: integer("episode_count"),
  
  // WhatsApp specific
  whatsappLink: text("whatsapp_link"),
  
  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),
  targetAudience: jsonb("target_audience").$type<string[]>().default([]), // students, educators, parents
  careerFields: jsonb("career_fields").$type<string[]>().default([]), // aligned career fields
  featured: boolean("featured").default(false),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  
  // Admin tracking
  createdBy: varchar("created_by").notNull(),
  updatedBy: varchar("updated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowResourceSchema = createInsertSchema(knowResources).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export type InsertKnowResource = z.infer<typeof insertKnowResourceSchema>;
export type KnowResource = typeof knowResources.$inferSelect;

// Session Edit History (for tracking collaborative changes)
export const sessionEditHistory = pgTable("session_edit_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  editType: text("edit_type").notNull(),
  fieldPath: text("field_path").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSessionEditHistorySchema = createInsertSchema(sessionEditHistory).omit({ id: true, createdAt: true });
export type InsertSessionEditHistory = z.infer<typeof insertSessionEditHistorySchema>;
export type SessionEditHistory = typeof sessionEditHistory.$inferSelect;

// Parent-Student Relationships Table
export const parentStudentLinks = pgTable("parent_student_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentUserId: varchar("parent_user_id").notNull(),
  studentUserId: varchar("student_user_id").notNull(),
  relationship: text("relationship").notNull().default("parent"), // parent, guardian, family_member
  status: text("status").notNull().default("pending"), // pending, active, revoked
  permissions: jsonb("permissions").$type<{
    viewGoals: boolean;
    viewAssessments: boolean;
    viewCareers: boolean;
    viewLessons: boolean;
    receiveNotifications: boolean;
  }>().default({ viewGoals: true, viewAssessments: true, viewCareers: true, viewLessons: false, receiveNotifications: true }),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentStudentLinkSchema = createInsertSchema(parentStudentLinks).omit({ id: true, createdAt: true, invitedAt: true });
export type InsertParentStudentLink = z.infer<typeof insertParentStudentLinkSchema>;
export type ParentStudentLink = typeof parentStudentLinks.$inferSelect;

// Parent Invitations Table
export const parentInvitations = pgTable("parent_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentUserId: varchar("student_user_id").notNull(),
  parentEmail: text("parent_email").notNull(),
  relationship: text("relationship").notNull().default("parent"),
  token: varchar("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentInvitationSchema = createInsertSchema(parentInvitations).omit({ id: true, createdAt: true });
export type InsertParentInvitation = z.infer<typeof insertParentInvitationSchema>;
export type ParentInvitation = typeof parentInvitations.$inferSelect;

// Parent Progress Notes (for parents to add notes/comments)
export const parentProgressNotes = pgTable("parent_progress_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkId: varchar("link_id").notNull(), // references parent_student_links.id
  parentUserId: varchar("parent_user_id").notNull(),
  studentUserId: varchar("student_user_id").notNull(),
  noteType: text("note_type").notNull().default("general"), // general, encouragement, question, milestone_celebration
  content: text("content").notNull(),
  relatedGoalId: varchar("related_goal_id"),
  isPrivate: boolean("is_private").default(false), // private notes only visible to parent
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentProgressNoteSchema = createInsertSchema(parentProgressNotes).omit({ id: true, createdAt: true });
export type InsertParentProgressNote = z.infer<typeof insertParentProgressNoteSchema>;
export type ParentProgressNote = typeof parentProgressNotes.$inferSelect;

// ================================
// Platform Configuration System
// ================================

// Feature Flags Table
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  isEnabled: boolean("enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(100),
  allowedRoles: jsonb("allowed_roles").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// Email Templates Table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  category: varchar("category").notNull().default("notification"),
  variables: jsonb("variables").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// ================================
// Professional Development System
// ================================

// Educator Career Goals - tracks career aspirations for educators
export const educatorCareerGoals = pgTable("educator_career_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goalType: text("goal_type").notNull(), // "leadership", "specialization", "certification", "skill_development", "role_change"
  targetRole: text("target_role"), // e.g., "Department Head", "Curriculum Specialist", "Principal"
  timeframe: text("timeframe").notNull(), // "6_months", "1_year", "2_years", "5_years"
  priority: integer("priority").default(1), // 1-5, higher is more important
  status: text("status").notNull().default("active"), // "active", "achieved", "paused", "abandoned"
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorCareerGoalSchema = createInsertSchema(educatorCareerGoals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorCareerGoal = z.infer<typeof insertEducatorCareerGoalSchema>;
export type EducatorCareerGoal = typeof educatorCareerGoals.$inferSelect;

// Educator Skills - tracks current skills and proficiency levels
export const educatorSkills = pgTable("educator_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  skillName: text("skill_name").notNull(),
  category: text("category").notNull(), // "pedagogy", "technology", "leadership", "subject_matter", "assessment", "communication", "sel"
  proficiencyLevel: integer("proficiency_level").notNull().default(1), // 1-5: beginner, developing, proficient, advanced, expert
  isVerified: boolean("is_verified").default(false), // verified through assessment or certification
  lastAssessedAt: timestamp("last_assessed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorSkillSchema = createInsertSchema(educatorSkills).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorSkill = z.infer<typeof insertEducatorSkillSchema>;
export type EducatorSkill = typeof educatorSkills.$inferSelect;

// PD Resources - catalog of professional development opportunities
export const pdResources = pgTable("pd_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  provider: text("provider"), // "LYS", "Coursera", "EdX", "State", "District", etc.
  resourceType: text("resource_type").notNull(), // "course", "workshop", "certification", "webinar", "book", "mentorship", "conference"
  url: text("url"),
  duration: text("duration"), // "2 hours", "4 weeks", "self-paced"
  cost: text("cost"), // "free", "$50", "subscription"
  skillsAddressed: jsonb("skills_addressed").$type<string[]>().default([]),
  goalTypesAddressed: jsonb("goal_types_addressed").$type<string[]>().default([]),
  gradeRelevance: jsonb("grade_relevance").$type<string[]>().default([]), // K-2, 3-5, 6-8, 9-12, Higher Ed
  subjectRelevance: jsonb("subject_relevance").$type<string[]>().default([]),
  rating: integer("rating"), // 1-5 average rating
  completionCount: integer("completion_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPDResourceSchema = createInsertSchema(pdResources).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPDResource = z.infer<typeof insertPDResourceSchema>;
export type PDResource = typeof pdResources.$inferSelect;

// PD Recommendations - AI-generated personalized recommendations
export const pdRecommendations = pgTable("pd_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  resourceId: varchar("resource_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reason: text("reason").notNull(), // why this was recommended
  skillGaps: jsonb("skill_gaps").$type<string[]>().default([]), // which skills this addresses
  relatedGoalIds: jsonb("related_goal_ids").$type<string[]>().default([]),
  priority: integer("priority").default(1), // 1-5, higher is more relevant
  status: text("status").notNull().default("new"), // "new", "viewed", "saved", "started", "completed", "dismissed"
  resourceType: text("resource_type"), // "course", "workshop", etc.
  provider: text("provider"),
  url: text("url"),
  estimatedDuration: text("estimated_duration"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPDRecommendationSchema = createInsertSchema(pdRecommendations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPDRecommendation = z.infer<typeof insertPDRecommendationSchema>;
export type PDRecommendation = typeof pdRecommendations.$inferSelect;

// Educator PD Progress - tracks completion of PD activities
export const educatorPDProgress = pgTable("educator_pd_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  resourceId: varchar("resource_id"),
  recommendationId: varchar("recommendation_id"),
  title: text("title").notNull(),
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
  progress: integer("progress").default(0), // 0-100
  hoursSpent: integer("hours_spent").default(0),
  completedAt: timestamp("completed_at"),
  certificateUrl: text("certificate_url"),
  notes: text("notes"),
  rating: integer("rating"), // user's rating 1-5
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorPDProgressSchema = createInsertSchema(educatorPDProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorPDProgress = z.infer<typeof insertEducatorPDProgressSchema>;
export type EducatorPDProgress = typeof educatorPDProgress.$inferSelect;

// PD Recommendation Response Schema (for AI-generated recommendations)
export const pdRecommendationResponseSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    reason: z.string(),
    skillGaps: z.array(z.string()),
    resourceType: z.string(),
    provider: z.string().optional(),
    estimatedDuration: z.string().optional(),
    priority: z.number().min(1).max(5),
  })),
  summary: z.string(),
  focusAreas: z.array(z.string()),
});

export type PDRecommendationResponse = z.infer<typeof pdRecommendationResponseSchema>;

// ============================================
// TIER-BASED FEATURE ACCESS SYSTEM
// ============================================

export const UserTier = {
  FREE: "free",
  PRO: "pro",
  CAMPUS: "campus",
  ENTERPRISE: "enterprise",
} as const;

export type UserTierType = typeof UserTier[keyof typeof UserTier];

// Feature definition with tier requirements
export interface TierFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: "core" | "ai" | "collaboration" | "analytics" | "admin" | "premium";
  requiredTier: UserTierType;
  upgradeMessage?: string;
  limitInfo?: string; // e.g., "5/month on Free, Unlimited on Pro"
}

// Comprehensive feature definitions with tier requirements
export const TIER_FEATURES: TierFeature[] = [
  // Core Features (Free tier)
  { id: "dashboard", name: "Dashboard", description: "View your progress and recent activity", icon: "LayoutDashboard", path: "/", category: "core", requiredTier: "free" },
  { id: "self_discovery", name: "Self-Discovery", description: "Take assessments to understand your strengths", icon: "Compass", path: "/self-discovery", category: "core", requiredTier: "free" },
  { id: "careers", name: "Career Explorer", description: "Browse and save career pathways", icon: "Briefcase", path: "/careers", category: "core", requiredTier: "free" },
  { id: "action_plans", name: "Action Plans", description: "Create and track your goals", icon: "Target", path: "/action-plans", category: "core", requiredTier: "free", limitInfo: "3 active goals on Free" },
  { id: "resources", name: "Resources", description: "Access educational materials", icon: "BookOpen", path: "/resources", category: "core", requiredTier: "free" },
  
  // AI Features (Pro tier)
  { id: "lesson_generator", name: "AI Lesson Generator", description: "Create professional lesson plans with AI", icon: "Sparkles", path: "/lesson-generator", category: "ai", requiredTier: "free", limitInfo: "5/month on Free, Unlimited on Pro" },
  { id: "my_lessons", name: "My Lessons", description: "View and manage saved lessons", icon: "FileText", path: "/my-lessons", category: "ai", requiredTier: "free" },
  { id: "ai_recommendations", name: "AI PD Recommendations", description: "Get personalized professional development suggestions", icon: "Brain", path: "/professional-development", category: "ai", requiredTier: "pro", upgradeMessage: "Unlock AI-powered recommendations with Pro" },
  { id: "advanced_analytics", name: "Advanced Analytics", description: "Deep insights into your teaching impact", icon: "BarChart3", path: "/analytics", category: "analytics", requiredTier: "pro", upgradeMessage: "Get detailed analytics with Pro" },
  
  // Collaboration Features (Campus tier)
  { id: "collaboration", name: "Real-Time Collaboration", description: "Co-create lessons with colleagues", icon: "Users", path: "/collaboration", category: "collaboration", requiredTier: "campus", upgradeMessage: "Collaborate in real-time with Campus" },
  { id: "resource_library", name: "Shared Resource Library", description: "Share and discover resources with your community", icon: "Library", path: "/resource-library", category: "collaboration", requiredTier: "campus", upgradeMessage: "Access shared resources with Campus" },
  { id: "classroom", name: "Classroom Management", description: "Organize students and track progress", icon: "School", path: "/classroom", category: "collaboration", requiredTier: "campus", upgradeMessage: "Manage classrooms with Campus" },
  { id: "assignments", name: "Assignments", description: "Create and distribute assignments", icon: "ClipboardList", path: "/assignments", category: "collaboration", requiredTier: "campus", upgradeMessage: "Create assignments with Campus" },
  { id: "scope_sequence", name: "Scope & Sequence Builder", description: "Plan your curriculum across units", icon: "Calendar", path: "/scope-sequence", category: "collaboration", requiredTier: "campus", upgradeMessage: "Build curriculum with Campus" },
  
  // Admin Features (Campus tier)
  { id: "educator_influence", name: "Educator Influence", description: "Track your referrals and earn rewards", icon: "Award", path: "/educator-influence", category: "premium", requiredTier: "free" },
  { id: "milestones", name: "LYS Milestones", description: "Track Be-Know-Do milestone progress", icon: "Flag", path: "/milestones", category: "core", requiredTier: "free" },
  { id: "parent_portal", name: "Parent Portal", description: "Share progress with parents", icon: "Heart", path: "/parent-portal", category: "collaboration", requiredTier: "campus", upgradeMessage: "Share with parents via Campus" },
  
  // Enterprise Features
  { id: "standards_admin", name: "Standards Management", description: "Manage educational standards", icon: "Database", path: "/admin/standards", category: "admin", requiredTier: "enterprise", upgradeMessage: "Enterprise-level standards management" },
  { id: "site_admin", name: "Site Administration", description: "Full platform administration", icon: "Shield", path: "/admin", category: "admin", requiredTier: "enterprise", upgradeMessage: "Enterprise administration access" },
  { id: "system_admin", name: "System Administration", description: "Complete platform oversight", icon: "Settings", path: "/system-admin", category: "admin", requiredTier: "enterprise", upgradeMessage: "Enterprise system administration" },
];

// Tier benefits for upgrade messaging
export const TIER_BENEFITS = {
  free: {
    name: "Free",
    price: "$0",
    features: ["Self-Discovery Assessment", "Career Explorer", "5 AI Lessons/month", "3 Active Goals", "Basic Resources"],
  },
  pro: {
    name: "Pro",
    price: "$9.99/month",
    features: ["Everything in Free", "Unlimited AI Lessons", "AI PD Recommendations", "Advanced Analytics", "Priority Support"],
  },
  campus: {
    name: "Campus",
    price: "$29.99/month",
    features: ["Everything in Pro", "Real-Time Collaboration", "Classroom Management", "Assignments & Curriculum", "Shared Resource Library", "Parent Portal"],
  },
  enterprise: {
    name: "Enterprise",
    price: "Contact Sales",
    features: ["Everything in Campus", "Custom Integrations", "Standards Management", "Site Administration", "Dedicated Support", "Custom Branding"],
  },
};

// Helper function to check if a tier has access to a feature
export function tierHasAccess(userTier: UserTierType, requiredTier: UserTierType): boolean {
  const tierOrder: UserTierType[] = ["free", "pro", "campus", "enterprise"];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

// Get features for a specific tier (available and locked)
export function getFeaturesForTier(userTier: UserTierType): { available: TierFeature[]; locked: TierFeature[] } {
  const available: TierFeature[] = [];
  const locked: TierFeature[] = [];
  
  for (const feature of TIER_FEATURES) {
    if (tierHasAccess(userTier, feature.requiredTier)) {
      available.push(feature);
    } else {
      locked.push(feature);
    }
  }
  
  return { available, locked };
}

// Get the next tier for upgrade
export function getNextTier(currentTier: UserTierType): UserTierType | null {
  const tierOrder: UserTierType[] = ["free", "pro", "campus", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex < tierOrder.length - 1) {
    return tierOrder[currentIndex + 1];
  }
  return null;
}

// Profile Sitemap Schema for API responses
export const profileSitemapSchema = z.object({
  currentTier: z.enum(["free", "pro", "campus", "enterprise"]),
  tierInfo: z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
  }),
  nextTier: z.object({
    name: z.string(),
    price: z.string(),
    features: z.array(z.string()),
  }).nullable(),
  availableFeatures: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    path: z.string(),
    category: z.string(),
    limitInfo: z.string().optional(),
  })),
  lockedFeatures: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    path: z.string(),
    category: z.string(),
    requiredTier: z.string(),
    upgradeMessage: z.string().optional(),
  })),
  upgradeRecommendation: z.string().optional(),
});

export type ProfileSitemap = z.infer<typeof profileSitemapSchema>;

// Country Affordability Index (CAI) Schema
// Based on The Nomad Network Global Pricing System
export const caiCountrySchema = z.object({
  code: z.string(), // ISO 3166-1 alpha-2 country code
  name: z.string(),
  currency: z.string(), // ISO 4217 currency code
  currencySymbol: z.string(),
  caiScore: z.number().min(0.05).max(1.0), // Affordability score
  lcsiAdjustment: z.number().min(0).max(0.15), // Local cost adjustment
  region: z.string(),
  incomeLevel: z.enum(["high", "upper_middle", "lower_middle", "low"]),
  avgMonthlyIncomeUSD: z.number().optional(),
  lastUpdated: z.string(),
});

export type CAICountry = z.infer<typeof caiCountrySchema>;

// CAI Pricing calculation
export const caiPricingSchema = z.object({
  globalReferencePrice: z.number(),
  country: caiCountrySchema,
  adjustedPrice: z.number(),
  adjustedPriceLocal: z.number().optional(),
  savings: z.number(),
  savingsPercent: z.number(),
});

export type CAIPricing = z.infer<typeof caiPricingSchema>;

// Base prices in USD (Global Reference Prices)
export const BASE_PRICES_USD = {
  free: 0,
  pro: 19,
  campus: 99,
  enterprise: 299,
} as const;

// SIS (Student Information System) Integration
// Supports Clever, PowerSchool, Canvas, Infinite Campus, OneRoster
export const sisConnections = pgTable("sis_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // The educator/admin who connected
  organizationId: varchar("organization_id"), // Optional school/district organization
  provider: text("provider").notNull(), // clever, powerschool, canvas, infinite_campus, oneroster, skyward
  providerName: text("provider_name"), // Display name (e.g., "PowerSchool - Lincoln High")
  status: text("status").notNull().default("pending"), // pending, connected, error, disconnected
  accessToken: text("access_token"), // Encrypted OAuth access token
  refreshToken: text("refresh_token"), // Encrypted OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  districtId: varchar("district_id"), // Provider's district/school identifier
  schoolIds: jsonb("school_ids").$type<string[]>(), // Connected school IDs
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status"), // idle, syncing, error
  syncError: text("sync_error"),
  settings: jsonb("settings").$type<{
    autoSync: boolean;
    syncFrequency: string; // daily, weekly, manual
    syncStudents: boolean;
    syncTeachers: boolean;
    syncCourses: boolean;
    syncGrades: boolean;
    syncAttendance: boolean;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSisConnectionSchema = createInsertSchema(sisConnections).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSisConnection = z.infer<typeof insertSisConnectionSchema>;
export type SisConnection = typeof sisConnections.$inferSelect;

// SIS Sync History - Track data transfer logs
export const sisSyncHistory = pgTable("sis_sync_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  userId: varchar("user_id").notNull(),
  syncType: text("sync_type").notNull(), // full, incremental, students, teachers, courses, grades
  status: text("status").notNull(), // started, completed, failed
  recordsProcessed: integer("records_processed").default(0),
  recordsCreated: integer("records_created").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  errorCount: integer("error_count").default(0),
  errors: jsonb("errors").$type<{ message: string; record?: any }[]>(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

export const insertSisSyncHistorySchema = createInsertSchema(sisSyncHistory).omit({ id: true, startedAt: true });
export type InsertSisSyncHistory = z.infer<typeof insertSisSyncHistorySchema>;
export type SisSyncHistory = typeof sisSyncHistory.$inferSelect;

// SIS Imported Students - Students imported from SIS
export const sisStudents = pgTable("sis_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  sisStudentId: varchar("sis_student_id").notNull(), // ID from the SIS
  lysUserId: varchar("lys_user_id"), // Linked LYS user if exists
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  gradeLevel: text("grade_level"),
  schoolId: varchar("school_id"),
  schoolName: text("school_name"),
  enrollmentStatus: text("enrollment_status"), // active, inactive, transferred
  sisData: jsonb("sis_data").$type<Record<string, any>>(), // Raw data from SIS
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSisStudentSchema = createInsertSchema(sisStudents).omit({ id: true, createdAt: true, lastSyncAt: true });
export type InsertSisStudent = z.infer<typeof insertSisStudentSchema>;
export type SisStudent = typeof sisStudents.$inferSelect;

// SIS Imported Courses/Sections
export const sisCourses = pgTable("sis_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  sisCourseId: varchar("sis_course_id").notNull(), // ID from the SIS
  name: text("name").notNull(),
  courseCode: text("course_code"),
  subject: text("subject"),
  gradeLevel: text("grade_level"),
  schoolId: varchar("school_id"),
  schoolName: text("school_name"),
  teacherIds: jsonb("teacher_ids").$type<string[]>(),
  studentCount: integer("student_count").default(0),
  term: text("term"), // Fall 2024, Spring 2025, etc.
  status: text("status"), // active, completed, upcoming
  sisData: jsonb("sis_data").$type<Record<string, any>>(),
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSisCourseSchema = createInsertSchema(sisCourses).omit({ id: true, createdAt: true, lastSyncAt: true });
export type InsertSisCourse = z.infer<typeof insertSisCourseSchema>;
export type SisCourse = typeof sisCourses.$inferSelect;

// SIS Provider Configuration
export const SIS_PROVIDERS = {
  clever: {
    name: "Clever",
    description: "Rostering & SSO platform used by 100,000+ schools",
    apiBase: "https://api.clever.com/v3.1",
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "schools"],
    icon: "graduation-cap",
  },
  powerschool: {
    name: "PowerSchool",
    description: "Leading K-12 student information system",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "grades", "attendance"],
    icon: "school",
  },
  canvas: {
    name: "Canvas LMS",
    description: "Learning management system by Instructure",
    apiBase: "", // Institution-specific
    authType: "access_token",
    supports: ["students", "teachers", "courses", "grades", "assignments"],
    icon: "book-open",
  },
  infinite_campus: {
    name: "Infinite Campus",
    description: "Cloud-based student information system",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "grades", "attendance"],
    icon: "building",
  },
  skyward: {
    name: "Skyward",
    description: "K-12 school administration software",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "grades"],
    icon: "cloud",
  },
  oneroster: {
    name: "OneRoster",
    description: "Industry standard API for interoperability",
    apiBase: "", // District-specific
    authType: "oauth2",
    supports: ["students", "teachers", "courses", "schools"],
    icon: "link",
  },
} as const;

export type SisProvider = keyof typeof SIS_PROVIDERS;

// Student Notes - Educator comments about students
export const studentNotes = pgTable("student_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  educatorId: varchar("educator_id").notNull(),
  classId: varchar("class_id"), // Optional - note may be class-specific
  noteType: text("note_type").notNull().default("general"), // general, academic, behavioral, health, parent_contact
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true), // If true, only note creator can see it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentNoteSchema = createInsertSchema(studentNotes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudentNote = z.infer<typeof insertStudentNoteSchema>;
export type StudentNote = typeof studentNotes.$inferSelect;

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("present"), // present, absent, tardy, excused
  notes: text("notes"),
  recordedBy: varchar("recorded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true });
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Note type enum for UI
export const NoteType = {
  GENERAL: "general",
  ACADEMIC: "academic",
  BEHAVIORAL: "behavioral",
  HEALTH: "health",
  PARENT_CONTACT: "parent_contact",
} as const;
export type NoteTypeValue = typeof NoteType[keyof typeof NoteType];

// Attendance status enum
export const AttendanceStatus = {
  PRESENT: "present",
  ABSENT: "absent",
  TARDY: "tardy",
  EXCUSED: "excused",
} as const;
export type AttendanceStatusValue = typeof AttendanceStatus[keyof typeof AttendanceStatus];

// ===========================================
// SYSTEM LESSON REPOSITORY & CONTENT LIBRARY
// ===========================================

// System Lesson Authors - Educators authorized to create master lessons
export const systemLessonAuthors = pgTable("system_lesson_authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  authorizedBy: varchar("authorized_by").notNull(), // Site admin who granted permission
  specializations: jsonb("specializations").$type<string[]>().default([]), // e.g., ["math", "science", "elementary"]
  bio: text("bio"),
  status: text("status").notNull().default("active"), // active, suspended, revoked
  lessonsCreated: integer("lessons_created").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemLessonAuthorSchema = createInsertSchema(systemLessonAuthors).omit({ id: true, createdAt: true, updatedAt: true, lessonsCreated: true });
export type InsertSystemLessonAuthor = z.infer<typeof insertSystemLessonAuthorSchema>;
export type SystemLessonAuthor = typeof systemLessonAuthors.$inferSelect;

// Master Lessons - System-level authoritative lessons that influence AI generation
export const masterLessons = pgTable("master_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(), // System lesson author who created this
  title: text("title").notNull(),
  description: text("description"),
  topic: text("topic").notNull(),
  subject: text("subject").notNull(), // e.g., "math", "science", "english"
  gradeLevel: text("grade_level").notNull(),
  gradeBand: text("grade_band"), // e.g., "K-2", "3-5", "6-8", "9-12"
  bkdFocus: text("bkd_focus").notNull(), // "be", "know", "do", or "integrated"
  standards: jsonb("standards").$type<{ code: string; description: string }[]>().default([]),
  duration: text("duration").notNull(),
  objectives: jsonb("objectives").notNull().$type<string[]>(),
  activities: jsonb("activities").notNull().$type<{ title: string; description: string; duration: string; type: string; bkdAlignment?: string }[]>(),
  materials: jsonb("materials").notNull().$type<string[]>(),
  assessment: text("assessment").notNull(),
  reflection: text("reflection"),
  lysMethodology: jsonb("lys_methodology").$type<{ be: { focus: string; description: string }; know: { focus: string; description: string }; do: { focus: string; description: string } }>(),
  tags: jsonb("tags").$type<string[]>().default([]),
  qualityScore: integer("quality_score").default(0), // 0-100 based on completeness and usage
  usageCount: integer("usage_count").default(0), // Times this influenced AI generation
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, archived
  reviewedBy: varchar("reviewed_by"), // Site admin who approved
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMasterLessonSchema = createInsertSchema(masterLessons).omit({ id: true, createdAt: true, updatedAt: true, qualityScore: true, usageCount: true, reviewedAt: true });
export type InsertMasterLesson = z.infer<typeof insertMasterLessonSchema>;
export type MasterLesson = typeof masterLessons.$inferSelect;

// Content Library - PDFs, eBooks, podcasts, YouTube for AI influence
export const ContentType = {
  PDF: "pdf",
  EBOOK: "ebook",
  BOOK: "book",
  PODCAST: "podcast",
  YOUTUBE_CHANNEL: "youtube_channel",
  YOUTUBE_VIDEO: "youtube_video",
  ARTICLE: "article",
  RESEARCH_PAPER: "research_paper",
} as const;
export type ContentTypeValue = typeof ContentType[keyof typeof ContentType];

export const contentLibrary = pgTable("content_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadedBy: varchar("uploaded_by").notNull(), // Site admin or system author
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull().$type<ContentTypeValue>(),
  source: text("source"), // URL for online content, or original source reference
  fileUrl: text("file_url"), // S3/storage URL for uploaded files
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  author: text("author"), // Original author of the content
  publisher: text("publisher"),
  publicationDate: text("publication_date"),
  subjects: jsonb("subjects").$type<string[]>().default([]), // e.g., ["math", "stem", "education"]
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]), // e.g., ["K-2", "3-5"]
  tags: jsonb("tags").$type<string[]>().default([]),
  extractedText: text("extracted_text"), // Extracted/summarized text for AI processing
  embeddingVector: jsonb("embedding_vector").$type<number[]>(), // Vector embedding for semantic search
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  processingError: text("processing_error"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0), // Times used in AI generation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, embeddingVector: true });
export type InsertContentLibrary = z.infer<typeof insertContentLibrarySchema>;
export type ContentLibraryItem = typeof contentLibrary.$inferSelect;

// Lesson Bulk Import Log - Track bulk uploads of lessons
export const lessonBulkImports = pgTable("lesson_bulk_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  uploadedBy: varchar("uploaded_by").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // csv, json
  totalRecords: integer("total_records").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  errors: jsonb("errors").$type<{ row: number; field: string; message: string }[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLessonBulkImportSchema = createInsertSchema(lessonBulkImports).omit({ id: true, createdAt: true, completedAt: true });
export type InsertLessonBulkImport = z.infer<typeof insertLessonBulkImportSchema>;
export type LessonBulkImport = typeof lessonBulkImports.$inferSelect;

