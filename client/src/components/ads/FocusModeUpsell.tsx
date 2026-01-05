import { useTier } from "@/hooks/use-tier";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Eye, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface FocusModeUpsellProps {
  variant?: "banner" | "card" | "inline";
  className?: string;
  onDismiss?: () => void;
}

export function FocusModeUpsell({ variant = "banner", className = "", onDismiss }: FocusModeUpsellProps) {
  const { hasFocusMode, isFree, isLoading } = useTier();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || hasFocusMode || !isFree || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Eye className="w-4 h-4" />
        <span className="font-roboto">Enjoying ad-free learning?</span>
        <Link href="/pricing">
          <Button variant="ghost" size="sm" className="text-primary underline-offset-4 hover:underline font-roboto" data-testid="button-focus-mode-upgrade-inline">
            Upgrade to Focus Mode
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div 
        className={`relative flex items-center justify-between gap-4 py-3 px-4 bg-gradient-to-r from-lys-teal/10 via-background to-lys-yellow/10 border-b ${className}`}
        data-testid="focus-mode-banner"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lys-teal/20">
            <Eye className="w-4 h-4 text-lys-teal" />
          </div>
          <div>
            <p className="font-oswald text-sm font-medium">Focus Mode</p>
            <p className="text-xs text-muted-foreground font-roboto">
              Remove all ads and distractions for deep learning
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button size="sm" className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-focus-mode-upgrade">
              <Sparkles className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </Link>
          {onDismiss && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              onClick={handleDismiss}
              data-testid="button-dismiss-focus-mode"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-lys-teal/30 bg-gradient-to-br from-lys-teal/5 to-background ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lys-teal/20 flex-shrink-0">
            <Eye className="w-5 h-5 text-lys-teal" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-oswald font-medium">Focus Mode</h4>
              <Badge variant="secondary" className="text-xs">Pro Feature</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-roboto mb-3">
              Unlock distraction-free learning with zero ads. Perfect for deep work and exam prep.
            </p>
            <Link href="/pricing">
              <Button size="sm" className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-focus-mode-upgrade-card">
                <Sparkles className="w-4 h-4 mr-1" />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
