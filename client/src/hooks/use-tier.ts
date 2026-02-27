import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { isGradeBelow8th } from "@/lib/adConfig";

export type UserTier = "free" | "paid" | "campus" | "enterprise";

interface AdSettings {
  showAds: boolean;
  contextualOnly: boolean;
  hasSponsoredAccess: boolean;
  focusModeEnabled: boolean;
  gradeRestricted: boolean;
}

interface TierData {
  tier: UserTier;
  isLoading: boolean;
  isPaid: boolean;
  isCampus: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  showAds: boolean;
  requiresScopeSequence: boolean;
  adSettings: AdSettings;
  isMinor: boolean;
  hasFocusMode: boolean;
  gradeLevel: string | null;
}

function calculateAge(birthdate: Date | string | null): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function useTier(): TierData {
  const { user, isAuthenticated } = useAuth();
  
  const { data, isLoading } = useQuery<{ 
    profile: unknown; 
    tier: UserTier;
    hasActiveTrial?: boolean;
    sponsoredAccess?: {
      adFreeAccess: boolean;
      focusModeEnabled: boolean;
      sponsorName: string;
    } | null;
  }>({
    queryKey: ["/api/educator-profile"],
    enabled: isAuthenticated,
  });

  const tier = data?.tier || "free";
  const hasActiveTrial = data?.hasActiveTrial || false;
  const isPaid = tier === "paid" || tier === "campus" || tier === "enterprise" || hasActiveTrial;
  const isCampus = tier === "campus";
  const isEnterprise = tier === "enterprise";
  const isFree = tier === "free";
  
  const age = calculateAge((user as any)?.birthdate || null);
  const isMinor = age !== null && age < 13;
  
  const gradeLevel = (user as any)?.gradeLevel || (data as any)?.profile?.gradeLevel || null;
  const isGradeRestricted = isGradeBelow8th(gradeLevel);
  
  const hasSponsoredAccess = !!data?.sponsoredAccess?.adFreeAccess;
  const sponsoredFocusMode = data?.sponsoredAccess?.focusModeEnabled ?? false;
  
  const hasFocusMode = isPaid || hasSponsoredAccess || sponsoredFocusMode;
  
  const showAds = isFree && !hasSponsoredAccess && !isGradeRestricted;
  
  const contextualOnly = isMinor;
  
  const adSettings: AdSettings = {
    showAds,
    contextualOnly,
    hasSponsoredAccess,
    focusModeEnabled: hasFocusMode,
    gradeRestricted: isGradeRestricted,
  };

  const requiresScopeSequence = isPaid;

  return {
    tier,
    isLoading,
    isPaid,
    isCampus,
    isEnterprise,
    isFree,
    showAds,
    requiresScopeSequence,
    adSettings,
    isMinor,
    hasFocusMode,
    gradeLevel,
  };
}
