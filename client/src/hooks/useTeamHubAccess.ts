import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export interface TeamHubAccess {
  status: "none" | "pending" | "approved" | "denied";
  canManage: boolean;
}

// Team Hub membership status for the signed-in user. Site/system admins are
// always "approved" (server decides); everyone else needs an approved
// staff access request. Used to hide Team Hub nav + gate the page.
export function useTeamHubAccess() {
  const { isAuthenticated } = useAuth();
  const query = useQuery<TeamHubAccess>({
    queryKey: ["/api/team/access/me"],
    enabled: isAuthenticated,
  });
  return {
    status: query.data?.status ?? "none",
    approved: query.data?.status === "approved",
    canManage: query.data?.canManage ?? false,
    isLoading: isAuthenticated && query.isLoading,
  };
}
