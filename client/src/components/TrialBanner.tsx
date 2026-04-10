import { useTrial } from "@/hooks/use-trial";
import { useTier } from "@/hooks/use-tier";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Sparkles, Gift, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export function TrialBanner() {
  const { isAuthenticated } = useAuth();
  const { isPaid, isLoading: tierLoading } = useTier();
  const { trialStatus, isTrialActive, daysRemaining, canStartTrial, startTrial, isStartingTrial } = useTrial();
  const [dismissed, setDismissed] = useState(false);

  // Auto-start trial for authenticated free users who haven't used their trial yet
  useEffect(() => {
    if (isAuthenticated && !isPaid && !isTrialActive && canStartTrial && !isStartingTrial && trialStatus.trialsUsed === 0) {
      startTrial();
    }
  }, [isAuthenticated, isPaid, isTrialActive, canStartTrial, isStartingTrial, trialStatus.trialsUsed]);

  if (tierLoading || dismissed) return null;
  if (isPaid) return null;

  if (isTrialActive) {
    const totalDays = trialStatus.totalDays || 10;
    const elapsed = totalDays - daysRemaining;
    const progress = (elapsed / totalDays) * 100;
    const isExpiringSoon = daysRemaining <= 3;

    return (
      <div
        className={`relative border-b px-4 py-3 ${
          isExpiringSoon
            ? "bg-gradient-to-r from-lys-red/10 via-background to-lys-yellow/10"
            : "bg-gradient-to-r from-lys-teal/10 via-background to-lys-yellow/10"
        }`}
        data-testid="trial-banner-active"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              isExpiringSoon ? "bg-lys-red/20" : "bg-lys-teal/20"
            }`}>
              <Clock className={`w-4 h-4 ${isExpiringSoon ? "text-lys-red" : "text-lys-teal"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-oswald text-sm font-medium">
                  {isExpiringSoon ? "Trial Ending Soon" : "Free Trial Active"}
                </p>
                <Badge
                  variant={isExpiringSoon ? "destructive" : "secondary"}
                  className="text-[10px]"
                  data-testid="badge-trial-days"
                >
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={progress} className="w-32 h-1.5" />
                <span className="text-[10px] text-muted-foreground font-roboto">
                  Day {elapsed} of {totalDays}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button
                size="sm"
                className={isExpiringSoon ? "bg-lys-red hover:bg-lys-red/90" : "bg-lys-teal hover:bg-lys-teal/90"}
                data-testid="button-trial-upgrade"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isExpiringSoon ? "Upgrade Now" : "Subscribe"}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDismissed(true)}
              data-testid="button-dismiss-trial-banner"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (canStartTrial) {
    return (
      <div
        className="border-b px-4 py-3 bg-gradient-to-r from-lys-yellow/10 via-background to-lys-teal/10"
        data-testid="trial-banner-start"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lys-yellow/20">
              <Gift className="w-4 h-4 text-lys-yellow" />
            </div>
            <div>
              <p className="font-oswald text-sm font-medium">Try LYS Free for 10 Days</p>
              <p className="text-xs text-muted-foreground font-roboto">
                Full access to all features — no credit card required
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-lys-yellow hover:bg-lys-yellow/90 text-black"
              onClick={() => startTrial()}
              disabled={isStartingTrial}
              data-testid="button-start-trial"
            >
              <Gift className="w-4 h-4 mr-1" />
              {isStartingTrial ? "Starting..." : "Start Free Trial"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDismissed(true)}
              data-testid="button-dismiss-trial-offer"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function TrialCard() {
  const { isPaid, isLoading: tierLoading } = useTier();
  const { isTrialActive, daysRemaining, canStartTrial, startTrial, isStartingTrial, trialStatus } = useTrial();

  if (tierLoading || isPaid) return null;

  if (isTrialActive) {
    const totalDays = trialStatus.totalDays || 10;
    const elapsed = totalDays - daysRemaining;
    const progress = (elapsed / totalDays) * 100;
    const isExpiringSoon = daysRemaining <= 3;

    return (
      <Card className={`border-2 ${isExpiringSoon ? "border-lys-red/30" : "border-lys-teal/30"}`} data-testid="trial-card-active">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
              isExpiringSoon ? "bg-lys-red/20" : "bg-lys-teal/20"
            }`}>
              <Clock className={`w-5 h-5 ${isExpiringSoon ? "text-lys-red" : "text-lys-teal"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-oswald font-medium">Free Trial</h4>
                <Badge
                  variant={isExpiringSoon ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                </Badge>
              </div>
              <Progress value={progress} className="w-full h-2 mb-3" />
              <p className="text-sm text-muted-foreground font-roboto mb-3">
                {isExpiringSoon
                  ? "Your trial is ending soon. Subscribe to keep full access to all features."
                  : "Enjoy full access to all LYS features during your trial period."}
              </p>
              <Link href="/pricing">
                <Button
                  size="sm"
                  className={isExpiringSoon ? "bg-lys-red hover:bg-lys-red/90" : "bg-lys-teal hover:bg-lys-teal/90"}
                  data-testid="button-trial-card-upgrade"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {isExpiringSoon ? "Upgrade Now" : "View Plans"}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (canStartTrial) {
    return (
      <Card className="border-2 border-lys-yellow/30 bg-gradient-to-br from-lys-yellow/5 to-background" data-testid="trial-card-start">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lys-yellow/20 shrink-0">
              <Gift className="w-5 h-5 text-lys-yellow" />
            </div>
            <div className="flex-1">
              <h4 className="font-oswald font-medium mb-1">Try LYS Free</h4>
              <p className="text-sm text-muted-foreground font-roboto mb-3">
                Get 10 days of full access to all features. No credit card required.
              </p>
              <Button
                size="sm"
                className="bg-lys-yellow hover:bg-lys-yellow/90 text-black"
                onClick={() => startTrial()}
                disabled={isStartingTrial}
                data-testid="button-trial-card-start"
              >
                <Gift className="w-4 h-4 mr-1" />
                {isStartingTrial ? "Starting..." : "Start Free Trial"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
