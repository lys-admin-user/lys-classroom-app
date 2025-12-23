import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
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

// User roles for different personas
// student: K-12 or higher ed student using self-discovery and career tools
// educator: teacher creating lessons and scope/sequence
// campus_admin: school/district admin managing multiple educators
export type UserRole = "student" | "educator" | "campus_admin";

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  tier: varchar("tier").default("free").$type<UserTier>(),
  role: varchar("role").default("student").$type<UserRole>(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
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
  country: varchar("country"),
  state: varchar("state"),
  standardsName: varchar("standards_name"),
  schoolDistrict: varchar("school_district"),
  schoolName: varchar("school_name"),
  gradeLevels: jsonb("grade_levels").$type<string[]>().default([]),
  subjects: jsonb("subjects").$type<string[]>().default([]),
  preferredStandardCodes: jsonb("preferred_standard_codes").$type<{ code: string; description: string }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEducatorProfileSchema = createInsertSchema(educatorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEducatorProfile = z.infer<typeof insertEducatorProfileSchema>;
export type EducatorProfile = typeof educatorProfiles.$inferSelect;
