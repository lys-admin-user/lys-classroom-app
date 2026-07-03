import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export interface TeamHubAccess {
  status: "none" | "pending" | "approved" | "denied";
  canManage: boolean;
  foundation?: {
    total: number;
    completed: number;
    percent: number;
    complete: boolean;
  };
}

// Team Hub membership status for the signed-in user. Site/system admins are
// always "approved" (server decides); everyone else needs an approved
// staff access request — and must finish the "Our Foundation" materials
// before they can even request one. Used to hide/show Team Hub nav + gate
// the page.
export function useTeamHubAccess() {
  const { isAuthenticated } = useAuth();
  const query = useQuery<TeamHubAccess>({
    queryKey: ["/api/team/access/me"],
    enabled: isAuthenticated,
  });
  const status = query.data?.status ?? "none";
  const foundationComplete = query.data?.foundation?.complete ?? false;
  return {
    status,
    approved: status === "approved",
    canManage: query.data?.canManage ?? false,
    foundationComplete,
    foundationPercent: query.data?.foundation?.percent ?? 0,
    // The "Join the Team" tab appears only once the Foundation is 100%
    // explored. Exception: a live pending request stays visible so the user
    // can track it (even if new modules were published since). Denied users
    // must be at 100% to see it again.
    canRequest:
      isAuthenticated && status !== "approved" && (foundationComplete || status === "pending"),
    isLoading: isAuthenticated && query.isLoading,
  };
}
