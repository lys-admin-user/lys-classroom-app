import { useQuery } from "@tanstack/react-query";

export type UserTier = "free" | "paid" | "campus" | "enterprise";

interface TierData {
  tier: UserTier;
  isLoading: boolean;
  isPaid: boolean;
  isCampus: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  showAds: boolean;
  requiresScopeSequence: boolean;
}

export function useTier(): TierData {
  const { data, isLoading } = useQuery<{ profile: unknown; tier: UserTier }>({
    queryKey: ["/api/educator-profile"],
  });

  const tier = data?.tier || "free";
  const isPaid = tier === "paid" || tier === "campus" || tier === "enterprise";
  const isCampus = tier === "campus";
  const isEnterprise = tier === "enterprise";
  const isFree = tier === "free";
  const showAds = isFree;
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
  };
}
