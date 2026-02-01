export const AD_REVENUE_CONFIG = {
  ecpmRange: { min: 8.0, max: 15.0, average: 12.0 },
  userEngagement: {
    avgPageViewsPerMonth: 40,
    adsPerScreen: 2,
    impressionsPerMonth: 80,
  },
  revenuePerUser: 0.96,
};

export const AD_SLOT_SIZES = {
  leaderboard: { width: 728, height: 90, label: "Leaderboard" },
  mediumRectangle: { width: 300, height: 250, label: "Medium Rectangle" },
  wideSkyscraper: { width: 160, height: 600, label: "Wide Skyscraper" },
  largeRectangle: { width: 336, height: 280, label: "Large Rectangle" },
  halfPage: { width: 300, height: 600, label: "Half Page" },
  billboard: { width: 970, height: 250, label: "Billboard" },
  mobileLeaderboard: { width: 320, height: 50, label: "Mobile Leaderboard" },
  mobileBanner: { width: 320, height: 100, label: "Mobile Banner" },
  inFeed: { width: "100%", height: 120, label: "In-Feed Native" },
  nativeCard: { width: "100%", height: 180, label: "Native Card" },
} as const;

export type AdSlotSize = keyof typeof AD_SLOT_SIZES;

export type AdSlotPlacement = 
  | "header"
  | "sidebar"
  | "content_top"
  | "content_middle"
  | "content_bottom"
  | "footer"
  | "between_sections"
  | "modal"
  | "native_feed";

export interface AdSlotConfig {
  id: string;
  placement: AdSlotPlacement;
  size: AdSlotSize;
  priority: number;
  refreshRate?: number;
  lazyLoad?: boolean;
  mobileSize?: AdSlotSize;
}

export const PAGE_AD_SLOTS: Record<string, AdSlotConfig[]> = {
  parentPortal: [
    { id: "pp-header", placement: "header", size: "leaderboard", priority: 1, mobileSize: "mobileLeaderboard" },
    { id: "pp-sidebar-1", placement: "sidebar", size: "mediumRectangle", priority: 2 },
    { id: "pp-content-1", placement: "between_sections", size: "inFeed", priority: 3 },
    { id: "pp-sidebar-2", placement: "sidebar", size: "mediumRectangle", priority: 4 },
    { id: "pp-footer", placement: "footer", size: "leaderboard", priority: 5, mobileSize: "mobileBanner" },
  ],
  studentDashboard: [
    { id: "sd-header", placement: "header", size: "leaderboard", priority: 1, mobileSize: "mobileLeaderboard" },
    { id: "sd-native-1", placement: "native_feed", size: "nativeCard", priority: 2 },
    { id: "sd-sidebar", placement: "sidebar", size: "mediumRectangle", priority: 3 },
  ],
  careerExplorer: [
    { id: "ce-sidebar", placement: "sidebar", size: "wideSkyscraper", priority: 1 },
    { id: "ce-native", placement: "native_feed", size: "nativeCard", priority: 2 },
  ],
  myJourney: [
    { id: "mj-sidebar", placement: "sidebar", size: "mediumRectangle", priority: 1 },
    { id: "mj-content", placement: "content_bottom", size: "inFeed", priority: 2 },
  ],
};

export const SPONSOR_CATEGORIES = [
  { id: "education", label: "Education & Universities", ecpmMultiplier: 1.5 },
  { id: "career", label: "Career & Recruitment", ecpmMultiplier: 1.8 },
  { id: "edtech", label: "EdTech Products", ecpmMultiplier: 1.3 },
  { id: "tutoring", label: "Tutoring Services", ecpmMultiplier: 1.4 },
  { id: "scholarships", label: "Scholarships & Financial Aid", ecpmMultiplier: 2.0 },
  { id: "test_prep", label: "Test Prep", ecpmMultiplier: 1.6 },
  { id: "general", label: "General", ecpmMultiplier: 1.0 },
] as const;

export function shouldShowAds(userTier: string | null | undefined): boolean {
  const freeTiers = ["free", "parent", null, undefined];
  return freeTiers.includes(userTier as any);
}

const GRADE_ORDER = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export function isGradeBelow8th(gradeLevel: string | null | undefined): boolean {
  if (!gradeLevel) return false;
  
  const normalizedGrade = gradeLevel.trim().toUpperCase();
  
  if (normalizedGrade === "K" || normalizedGrade === "KINDERGARTEN") return true;
  if (normalizedGrade.includes("PRE-K") || normalizedGrade.includes("PREK")) return true;
  
  const gradeNum = parseInt(normalizedGrade.replace(/\D/g, ""), 10);
  if (!isNaN(gradeNum) && gradeNum < 8) return true;
  
  const gradeIndex = GRADE_ORDER.indexOf(normalizedGrade);
  if (gradeIndex !== -1 && gradeIndex < GRADE_ORDER.indexOf("8")) return true;
  
  return false;
}

export function canShowAdsForGrade(gradeLevel: string | null | undefined): boolean {
  return !isGradeBelow8th(gradeLevel);
}

export function getAdFrequency(pageViews: number): number {
  if (pageViews < 10) return 1;
  if (pageViews < 20) return 2;
  return 2;
}

export function estimateMonthlyRevenue(activeUsers: number): {
  low: number;
  high: number;
  average: number;
} {
  const { ecpmRange, userEngagement } = AD_REVENUE_CONFIG;
  const impressionsPerUser = userEngagement.impressionsPerMonth;
  
  return {
    low: (activeUsers * impressionsPerUser / 1000) * ecpmRange.min,
    high: (activeUsers * impressionsPerUser / 1000) * ecpmRange.max,
    average: (activeUsers * impressionsPerUser / 1000) * ecpmRange.average,
  };
}
