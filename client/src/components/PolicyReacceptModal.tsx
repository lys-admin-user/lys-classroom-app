import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ScrollText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { COMPANY, POLICIES, needsPolicyReacceptance } from "@shared/legal";

// Routes where we never interrupt with the re-acceptance modal (embeds, the
// legal pages themselves, and onboarding which already gates on acceptance).
const SUPPRESSED_PREFIXES = ["/embed", "/terms", "/privacy", "/ai-policy", "/onboarding"];

export function PolicyReacceptModal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [agreed, setAgreed] = useState(false);
  const { toast } = useToast();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/legal/accept", { context: "reaccept" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setAgreed(false);
    },
    onError: () => {
      toast({
        title: "Could not save",
        description: "We couldn't record your acceptance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const suppressed = SUPPRESSED_PREFIXES.some((pre) => location.startsWith(pre));
  const acceptedVersion = (user as any)?.acceptedPolicyVersion as string | null | undefined;

  const open =
    !isLoading &&
    isAuthenticated &&
    !!user &&
    !suppressed &&
    needsPolicyReacceptance(acceptedVersion);

  return (
    <Dialog open={open} onOpenChange={() => { /* required, no dismiss without accepting */ }}>
      <DialogContent
        className="sm:max-w-lg"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-testid="dialog-policy-reaccept"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-oswald text-xl">
            <ScrollText className="h-5 w-5 text-primary" />
            We've updated our policies
          </DialogTitle>
          <DialogDescription className="font-roboto">
            {COMPANY.legalName} has updated its policies. Please review and accept to keep
            using {COMPANY.platformName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <ul className="text-sm space-y-1.5">
            <li>
              <a className="underline text-primary" href={POLICIES.tos.path} target="_blank" rel="noreferrer" data-testid="link-reaccept-tos">
                {POLICIES.tos.title}
              </a>
            </li>
            <li>
              <a className="underline text-primary" href={POLICIES.privacy.path} target="_blank" rel="noreferrer" data-testid="link-reaccept-privacy">
                {POLICIES.privacy.title}
              </a>
            </li>
            <li>
              <a className="underline text-primary" href={POLICIES.ai.path} target="_blank" rel="noreferrer" data-testid="link-reaccept-ai">
                {POLICIES.ai.title}
              </a>
            </li>
          </ul>

          <div className="flex items-start gap-2 pt-2 border-t">
            <Checkbox
              id="reaccept-agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
              data-testid="checkbox-reaccept-agree"
            />
            <Label htmlFor="reaccept-agree" className="text-sm font-normal leading-relaxed cursor-pointer">
              I have read and agree to the updated Terms of Service &amp; Subscription
              Agreement, Privacy &amp; Data Policy, and Responsible AI Policy.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={!agreed || acceptMutation.isPending}
            data-testid="button-reaccept-confirm"
          >
            {acceptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Accept &amp; Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
