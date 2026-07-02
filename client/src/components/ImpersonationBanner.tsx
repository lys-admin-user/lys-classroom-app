import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { UserCheck, ArrowLeftCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/stop-impersonation"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Returned to your profile" });
    },
    onError: () => {
      toast({ title: "Failed to stop impersonation", variant: "destructive" });
    },
  });

  const imp = (user as any)?.impersonating;
  if (!imp) return null;

  return (
    <div
      className="flex items-center justify-between gap-4 bg-amber-500 text-black px-4 py-2 text-sm font-medium"
      data-testid="banner-impersonation"
    >
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 shrink-0" />
        <span className="font-roboto">
          You are viewing the app as{" "}
          <span className="font-semibold">{imp.userName || `user ${imp.userId}`}</span>. Started at{" "}
          {new Date(imp.startedAt).toLocaleTimeString()}.
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="gap-1.5 bg-black/10 hover:bg-black/20 text-black border-0"
        onClick={() => stopMutation.mutate()}
        disabled={stopMutation.isPending}
        data-testid="button-stop-impersonation"
      >
        {stopMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowLeftCircle className="h-3.5 w-3.5" />
        )}
        Return to My Profile
      </Button>
    </div>
  );
}
