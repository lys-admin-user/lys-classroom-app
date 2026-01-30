import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const MAX_SKIPS = 3;
const BANNER_DISMISSED_KEY = "lys_onboarding_banner_dismissed";

export function OnboardingReminderBanner() {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === "true";
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
  };

  useEffect(() => {
    if (user?.onboardingCompleted) {
      localStorage.removeItem(BANNER_DISMISSED_KEY);
    }
  }, [user?.onboardingCompleted]);

  if (!isAuthenticated || !user) return null;
  if (user.onboardingCompleted) return null;
  if (dismissed) return null;

  const skipCount = user.onboardingSkipCount || 0;
  const skipsRemaining = MAX_SKIPS - skipCount;

  if (skipsRemaining <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-lys-yellow/20 to-lys-red/20 border-b border-lys-yellow/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-lys-yellow" />
          <p className="text-sm font-roboto">
            <span className="font-medium">Complete your profile</span>
            <span className="text-muted-foreground ml-1">
              to unlock personalized recommendations
            </span>
            {skipsRemaining < MAX_SKIPS && (
              <span className="text-muted-foreground ml-2">
                ({skipsRemaining} session{skipsRemaining !== 1 ? "s" : ""} remaining)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/onboarding">
            <Button size="sm" variant="default" className="gap-1" data-testid="button-complete-profile">
              <Sparkles className="h-3 w-3" />
              Complete Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            data-testid="button-dismiss-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
