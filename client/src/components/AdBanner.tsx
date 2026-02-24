import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface AdBannerProps {
  position?: "sidebar" | "inline" | "footer";
  className?: string;
}

export function AdBanner({ position = "inline", className = "" }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (position === "sidebar") {
    return (
      <Card className={`p-4 bg-muted/30 border-dashed ${className}`} data-testid="ad-banner-sidebar">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-roboto">Sponsored</p>
            <div className="h-24 bg-muted rounded-md flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-roboto">Ad Space</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 shrink-0"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-ad"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    );
  }

  if (position === "footer") {
    return (
      <div className={`border-t bg-muted/20 py-3 px-4 ${className}`} data-testid="ad-banner-footer">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground font-roboto">Sponsored</p>
            <div className="h-8 w-48 bg-muted rounded flex items-center justify-center">
              <p className="text-xs text-muted-foreground font-roboto">Ad Space</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs gap-1"
                data-testid="button-upgrade-ad"
              >
                <Sparkles className="h-3 w-3" />
                Remove Ads
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setDismissed(true)}
              data-testid="button-dismiss-footer-ad"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-4 bg-muted/20 border-dashed ${className}`} data-testid="ad-banner-inline">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground font-roboto">Sponsored</p>
          <div className="h-12 w-64 bg-muted rounded flex items-center justify-center">
            <p className="text-xs text-muted-foreground font-roboto">Advertisement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs gap-1"
              data-testid="button-upgrade-inline"
            >
              <Sparkles className="h-3 w-3" />
              Go Ad-Free
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-inline-ad"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
