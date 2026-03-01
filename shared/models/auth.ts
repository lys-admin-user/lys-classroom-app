import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User tiers for feature gating
// free: basic features with limited access
// pro: full features for individual educators
// campus: school/district license with admin features
// enterprise: full organizational access with analytics
export type UserTier = "free" | "pro" | "campus" | "enterprise";

// User roles for different personas (ordered by privilege, highest first)
// system_admin: complete platform oversight, configuration, and global settings
// site_admin: platform-level admin with full access to manage all orgs
// district_admin: district-level admin managing multiple campuses/schools
// campus_admin: school/campus admin managing educators within one school
// educator: teacher creating lessons, scope/sequence, managing classrooms
// homeschool_parent: parent-educator hybrid with simplified tools (1-5 students)
// student: K-12 or higher ed student using self-discovery and career tools
export type UserRole = "student" | "educator" | "homeschool_parent" | "campus_admin" | "district_admin" | "site_admin" | "system_admin";

// Role hierarchy levels for permission checks (higher number = more privilege)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  homeschool_parent: 1,
  educator: 2,
  campus_admin: 3,
  district_admin: 4,
  site_admin: 5,
  system_admin: 6,
};

// Helper to check if a role has at least the given privilege level
export function hasRolePrivilege(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  birthdate: timestamp("birthdate"),
  tier: varchar("tier").default("free").$type<UserTier>(),
  role: varchar("role").default("student").$type<UserRole>(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingSkipCount: integer("onboarding_skip_count").default(0),
  onboardingLastSkipped: timestamp("onboarding_last_skipped"),
  sponsoredAccessId: varchar("sponsored_access_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"),
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User Preferences - stores language, location, and onboarding results
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  language: varchar("language").default("en"),
  country: varchar("country"),
  state: varchar("state"),
  jurisdictionId: varchar("jurisdiction_id"),
  standardSetId: varchar("standard_set_id"),
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]),
  gradeBands: jsonb("grade_bands").$type<string[]>().default([]),
  needsAnalysis: jsonb("needs_analysis").$type<{
    primaryGoal: string;
    interests: string[];
    experienceLevel: string;
    recommendedFeatures: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Educator Profile - stores preferences for paid/enterprise users
export const educatorProfiles = pgTable("educator_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  educatorType: varchar("educator_type").$type<"teacher" | "homeschooling_parent" | "micro_school">(),
  country: varchar("country"),
  state: varchar("state"),
  standardsName: varchar("standards_name"),
  schoolDistrict: varchar("school_district"),
  schoolName: varchar("school_name"),
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]),
  subjects: jsonb("subjects").$type<string[]>().default([]),
  preferredSubject: varchar("preferred_subject"),
  preferredStandardCodes: jsonb("preferred_standard_codes").$type<{ code: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorProfileSchema = createInsertSchema(educatorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorProfile = z.infer<typeof insertEducatorProfileSchema>;
export type EducatorProfile = typeof educatorProfiles.$inferSelect;

// Organization types for multi-tenant support
// Hierarchy: country > state/jurisdiction > network/charter_network > district > school/campus > (classes)
//
// Client Structure Mapping:
//   - Single-Campus Charter: type="school" or "campus", tier="campus" ($99/mo)
//     Independent school, no parent org, full customization, makes own rules
//   - Traditional Public School District (ISD): type="district" with child "school"/"campus" orgs, tier="enterprise" ($299/mo)
//     Geographically bound, locally governed, elected board, standardized calendar/curriculum
//   - Multi-State Charter Network (CMO/EMO): type="charter_network" or "network" with child orgs, tier="enterprise" ($299/mo)
//     Central HQ managing schools across states (e.g., KIPP, IDEA, Green Dot, Charter Schools USA)
//     Supports unified master dashboard OR per-state management (admin's preference)
//   - General Network: type="network", tier="enterprise" ($299/mo)
//     Multi-school networks that aren't charter-specific (e.g., university systems)
//
// All districts are Enterprise tier regardless of size.
// CMOs (non-profit) and EMOs (for-profit) both use "charter_network" type.
export type OrganizationType = "country" | "state" | "jurisdiction" | "network" | "charter_network" | "district" | "school" | "campus" | "university" | "other";
export type OrganizationStatus = "active" | "suspended" | "pending";

// Organization hierarchy levels (ordered from top to bottom)
export const organizationHierarchyLevels: OrganizationType[] = ["country", "state", "jurisdiction", "network", "charter_network", "district", "school", "campus", "university"];

// Types that can directly contain classes and students
export const classContainerTypes: OrganizationType[] = ["school", "campus", "university"];

// Types that represent multi-site enterprise entities (always Enterprise tier)
export const enterpriseOrgTypes: OrganizationType[] = ["network", "charter_network", "district"];

// Governance models for global authority tree
// bottom_heavy: US-style with strong local control (TEA, school districts)
// top_down_unitary: African/Asian centralized national curriculum
// federal_hybrid: EU/Canadian mixed federal-state jurisdiction
export type GovernanceModel = "bottom_heavy" | "top_down_unitary" | "federal_hybrid";

// Organizations table - represents educational entities at various levels
// Hierarchy: country > state/jurisdiction > network/charter_network > district > school/campus
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  type: varchar("type").default("school").$type<OrganizationType>(),
  status: varchar("status").default("active").$type<OrganizationStatus>(),
  parentOrganizationId: varchar("parent_organization_id"),
  
  // Governance model (primarily for country-level orgs)
  governanceModel: varchar("governance_model").$type<GovernanceModel>(),
  
  // ISO country code for international support
  countryCode: varchar("country_code"),
  
  domain: varchar("domain"),
  logoUrl: varchar("logo_url"),
  address: varchar("address"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country"),
  zipCode: varchar("zip_code"),
  phone: varchar("phone"),
  website: varchar("website"),
  maxUsers: varchar("max_users"),
  tier: varchar("tier").default("campus").$type<UserTier>(),
  settings: jsonb("settings").$type<{
    allowSelfRegistration?: boolean;
    requireEmailDomain?: boolean;
    defaultUserRole?: UserRole;
    features?: string[];
    curriculumAuthority?: string;
    standardsBody?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Organization membership roles
export type OrgMemberRole = "member" | "admin" | "owner";
export type OrgMemberStatus = "active" | "invited" | "suspended";

// Organization memberships - links users to organizations
export const organizationMemberships = pgTable("organization_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("member").$type<OrgMemberRole>(),
  status: varchar("status").default("active").$type<OrgMemberStatus>(),
  invitedBy: varchar("invited_by"),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrgMembershipSchema = createInsertSchema(organizationMemberships).omit({ id: true, createdAt: true });
export type InsertOrgMembership = z.infer<typeof insertOrgMembershipSchema>;
export type OrgMembership = typeof organizationMemberships.$inferSelect;

// Organization invitations for pending users
export type PersonType = "educator" | "student" | "mentor" | "parent" | "employer" | "counselor" | "administrator" | "volunteer" | "other";

export const organizationInvitations = pgTable("organization_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  email: varchar("email").notNull(),
  role: varchar("role").default("member").$type<OrgMemberRole>(),
  personType: varchar("person_type").default("educator").$type<PersonType>(),
  token: varchar("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrgInvitationSchema = createInsertSchema(organizationInvitations).omit({ id: true, createdAt: true });
export type InsertOrgInvitation = z.infer<typeof insertOrgInvitationSchema>;
export type OrgInvitation = typeof organizationInvitations.$inferSelect;

// Site administrators - for platform-wide administration
export const siteAdmins = pgTable("site_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertSiteAdminSchema = createInsertSchema(siteAdmins).omit({ id: true, createdAt: true });
export type InsertSiteAdmin = z.infer<typeof insertSiteAdminSchema>;
export type SiteAdmin = typeof siteAdmins.$inferSelect;

// Platform feature flags - for enabling/disabling features platform-wide
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").default(false),
  rolloutPercentage: integer("rollout_percentage").default(100),
  allowedRoles: jsonb("allowed_roles").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// Email templates - for customizable email communications
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  category: varchar("category").default("general"),
  variables: jsonb("variables").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// =============================================================================
// GLOBAL AUTHORITY TREE (LYS V3.0 - Unified Global System)
// =============================================================================

// Authority levels in the educational hierarchy
export type AuthorityLevel = "supranational" | "national" | "regional_state" | "local_district" | "school";

// Educational model types for different countries/regions
// bottom_heavy: US-style decentralized (Local Districts have authority)
// top_down_unitary: Africa/Asia centralized (National Ministry controls)
// federal_hybrid: Nigeria/Germany (Split between local and national)
export type AuthorityModelType = "bottom_heavy" | "top_down_unitary" | "federal_hybrid";

// Global Authority Tree - Polymorphic hierarchy for educational authorities
export const authorities = pgTable("authorities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").unique(),
  level: varchar("level").notNull().$type<AuthorityLevel>(),
  parentId: varchar("parent_id"),
  modelType: varchar("model_type").default("bottom_heavy").$type<AuthorityModelType>(),
  residencyRegion: varchar("residency_region"),
  country: varchar("country"),
  currencyCode: varchar("currency_code"),
  timezone: varchar("timezone"),
  academicCalendarStart: varchar("academic_calendar_start"),
  pupilToTeacherRatio: integer("pupil_to_teacher_ratio"),
  pisaScore: integer("pisa_score"),
  educationBudgetPercent: varchar("education_budget_percent"),
  metadata: jsonb("metadata").$type<{
    standardsFramework?: string;
    examBoard?: string;
    gatekeeperExams?: string[];
    languageOfInstruction?: string[];
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAuthoritySchema = createInsertSchema(authorities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAuthority = z.infer<typeof insertAuthoritySchema>;
export type Authority = typeof authorities.$inferSelect;

// =============================================================================
// LYS MILESTONE ENGINE (Being, Knowing, Doing)
// =============================================================================

// Milestone categories aligned with LYS Be-Know-Do methodology
export type MilestoneCategory = "being" | "knowing" | "doing";

// Milestone status tracking
export type MilestoneStatus = "not_started" | "in_progress" | "completed" | "deferred" | "failed";

// LYS Milestones - Tasks aligned with authorities and BKD methodology
export const lyseMilestones = pgTable("lyse_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull().$type<MilestoneCategory>(),
  authorityId: varchar("authority_id").references(() => authorities.id),
  standardCode: varchar("standard_code"),
  isGatekeeper: boolean("is_gatekeeper").default(false),
  isHardDeadline: boolean("is_hard_deadline").default(false),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  status: varchar("status").default("not_started").$type<MilestoneStatus>(),
  weight: integer("weight").default(1),
  regionalMultiplier: varchar("regional_multiplier"),
  alternativePathId: varchar("alternative_path_id"),
  linkedGoalId: varchar("linked_goal_id"),
  linkedCareerId: varchar("linked_career_id"),
  metadata: jsonb("metadata").$type<{
    examName?: string;
    examDate?: string;
    passingScore?: number;
    actualScore?: number;
    distinction?: boolean;
    peerLearningEnabled?: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLyseMilestoneSchema = createInsertSchema(lyseMilestones).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLyseMilestone = z.infer<typeof insertLyseMilestoneSchema>;
export type LyseMilestone = typeof lyseMilestones.$inferSelect;

// =============================================================================
// WORKFORCE TRENDS (Monthly Data Sync from BLS/OECD/UNESCO)
// =============================================================================

export const workforceTrends = pgTable("workforce_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorityId: varchar("authority_id").references(() => authorities.id),
  country: varchar("country").notNull(),
  region: varchar("region"),
  occupationCode: varchar("occupation_code"),
  occupationTitle: varchar("occupation_title"),
  medianSalary: integer("median_salary"),
  growthRate: varchar("growth_rate"),
  jobOpenings: integer("job_openings"),
  educationRequired: varchar("education_required"),
  dataSource: varchar("data_source"),
  pisaScore: integer("pisa_score"),
  pisaRank: integer("pisa_rank"),
  teacherProfessionalismIndex: varchar("teacher_professionalism_index"),
  certificationValue: varchar("certification_value"),
  policyVolatilityAlert: boolean("policy_volatility_alert").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkforceTrendSchema = createInsertSchema(workforceTrends).omit({ id: true, createdAt: true });
export type InsertWorkforceTrend = z.infer<typeof insertWorkforceTrendSchema>;
export type WorkforceTrend = typeof workforceTrends.$inferSelect;

// =============================================================================
// LYS ALIGNMENT MATRIX (Regional Gamification Weights)
// =============================================================================

export const alignmentMatrix = pgTable("alignment_matrix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorityId: varchar("authority_id").references(() => authorities.id),
  modelType: varchar("model_type").$type<AuthorityModelType>(),
  beingWeight: integer("being_weight").default(33),
  knowingWeight: integer("knowing_weight").default(34),
  doingWeight: integer("doing_weight").default(33),
  certificationMultiplier: varchar("certification_multiplier").default("1.0"),
  distinctionMultiplier: varchar("distinction_multiplier").default("2.5"),
  peerLearningThreshold: integer("peer_learning_threshold"),
  personalizedFeedbackWeight: integer("personalized_feedback_weight"),
  continuousProgressWeight: integer("continuous_progress_weight"),
  metadata: jsonb("metadata").$type<{
    focusAreas?: string[];
    guardrails?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAlignmentMatrixSchema = createInsertSchema(alignmentMatrix).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlignmentMatrix = z.infer<typeof insertAlignmentMatrixSchema>;
export type AlignmentMatrix = typeof alignmentMatrix.$inferSelect;

// =============================================================================
// SPONSORED ACCESS (Regional NGO/Ministry Bulk Access Programs)
// =============================================================================
// For regions where ad revenue < $0.35 CPM, NGOs/Ministries can pay bulk "connectivity fees"
// to provide ad-free access to students in their jurisdiction

export type SponsorType = "ngo" | "ministry" | "foundation" | "corporate" | "other";
export type SponsoredAccessStatus = "active" | "expired" | "suspended" | "pending";

export const sponsoredAccess = pgTable("sponsored_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorName: varchar("sponsor_name").notNull(),
  sponsorType: varchar("sponsor_type").$type<SponsorType>().notNull(),
  authorityId: varchar("authority_id").references(() => authorities.id),
  country: varchar("country").notNull(),
  region: varchar("region"),
  status: varchar("status").default("active").$type<SponsoredAccessStatus>(),
  maxStudents: integer("max_students"),
  currentStudents: integer("current_students").default(0),
  monthlyFeeUsd: varchar("monthly_fee_usd"),
  adFreeAccess: boolean("ad_free_access").default(true),
  focusModeEnabled: boolean("focus_mode_enabled").default(true),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  contactEmail: varchar("contact_email"),
  contactName: varchar("contact_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSponsoredAccessSchema = createInsertSchema(sponsoredAccess).omit({ id: true, createdAt: true, updatedAt: true, currentStudents: true });
export type InsertSponsoredAccess = z.infer<typeof insertSponsoredAccessSchema>;
export type SponsoredAccess = typeof sponsoredAccess.$inferSelect;

// =============================================================================
// AD CONFIGURATION (Regional Ad Revenue Settings)
// =============================================================================
// Tracks expected CPM by region to determine when to use Sponsored Access model

export const adRegionalConfig = pgTable("ad_regional_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  country: varchar("country").notNull(),
  region: varchar("region"),
  expectedCpmUsd: varchar("expected_cpm_usd").notNull(),
  cogsPerUserUsd: varchar("cogs_per_user_usd").default("0.45"),
  requiresSponsoredAccess: boolean("requires_sponsored_access").default(false),
  authorityId: varchar("authority_id").references(() => authorities.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdRegionalConfigSchema = createInsertSchema(adRegionalConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdRegionalConfig = z.infer<typeof insertAdRegionalConfigSchema>;
export type AdRegionalConfig = typeof adRegionalConfig.$inferSelect;

// =============================================================================
// CONTEXTUAL SPONSORSHIPS (Age-Appropriate Sponsorship Ads)
// =============================================================================
// High-value contextual sponsorships for minors (under 13) - COPPA compliant
// Example: "This Roadmap is brought to you by [University Name]"

export type SponsorshipPlacement = "roadmap" | "career_explorer" | "lesson_header" | "dashboard" | "portfolio";

export const contextualSponsorships = pgTable("contextual_sponsorships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorName: varchar("sponsor_name").notNull(),
  sponsorLogoUrl: varchar("sponsor_logo_url"),
  sponsorUrl: varchar("sponsor_url"),
  placement: varchar("placement").$type<SponsorshipPlacement>().notNull(),
  messageTemplate: text("message_template").notNull(),
  targetCountries: jsonb("target_countries").$type<string[]>(),
  targetRegions: jsonb("target_regions").$type<string[]>(),
  targetGradeLevels: jsonb("target_grade_levels").$type<string[]>(),
  minorsSafe: boolean("minors_safe").default(true),
  cpmUsd: varchar("cpm_usd"),
  impressionCount: integer("impression_count").default(0),
  clickCount: integer("click_count").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContextualSponsorshipSchema = createInsertSchema(contextualSponsorships).omit({ id: true, createdAt: true, updatedAt: true, impressionCount: true, clickCount: true });
export type InsertContextualSponsorship = z.infer<typeof insertContextualSponsorshipSchema>;
export type ContextualSponsorship = typeof contextualSponsorships.$inferSelect;
