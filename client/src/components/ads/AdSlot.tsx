import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, ExternalLink, GraduationCap, Briefcase, BookOpen, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTier } from "@/hooks/use-tier";
import { AD_SLOT_SIZES, type AdSlotSize, type AdSlotPlacement, shouldShowAds } from "@/lib/adConfig";

interface AdSlotProps {
  slotId: string;
  size?: AdSlotSize;
  placement?: AdSlotPlacement;
  className?: string;
  showDismiss?: boolean;
  showUpgrade?: boolean;
  sponsorCategory?: "education" | "career" | "edtech" | "tutoring" | "scholarships" | "test_prep" | "general";
}

const PLACEHOLDER_ADS = [
  {
    category: "education",
    title: "Discover Your Future University",
    description: "Explore top-rated programs that match your career goals",
    cta: "Learn More",
    icon: GraduationCap,
    bgClass: "from-blue-500/10 to-indigo-500/10",
  },
  {
    category: "career",
    title: "Find Your Dream Career",
    description: "Connect with employers looking for talented students",
    cta: "Explore Jobs",
    icon: Briefcase,
    bgClass: "from-emerald-500/10 to-teal-500/10",
  },
  {
    category: "scholarships",
    title: "Scholarship Opportunities",
    description: "Millions in scholarships available for students like you",
    cta: "Apply Now",
    icon: Award,
    bgClass: "from-amber-500/10 to-orange-500/10",
  },
  {
    category: "test_prep",
    title: "Ace Your Exams",
    description: "Premium test prep courses with proven results",
    cta: "Start Learning",
    icon: BookOpen,
    bgClass: "from-purple-500/10 to-pink-500/10",
  },
];

function getPlaceholderAd(category?: string) {
  if (category) {
    return PLACEHOLDER_ADS.find(ad => ad.category === category) || PLACEHOLDER_ADS[0];
  }
  return PLACEHOLDER_ADS[Math.floor(Math.random() * PLACEHOLDER_ADS.length)];
}

export function AdSlot({ 
  slotId,
  size = "mediumRectangle", 
  placement = "sidebar",
  className = "",
  showDismiss = true,
  showUpgrade = true,
  sponsorCategory,
}: AdSlotProps) {
  const { tier, isLoading, hasFocusMode } = useTier();
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [placeholderAd] = useState(() => getPlaceholderAd(sponsorCategory));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isLoading || dismissed || hasFocusMode || !shouldShowAds(tier)) {
    return null;
  }

  const slotConfig = AD_SLOT_SIZES[size];
  const Icon = placeholderAd.icon;

  if (placement === "header" || placement === "footer") {
    const bannerSize = isMobile ? AD_SLOT_SIZES.mobileLeaderboard : slotConfig;
    
    return (
      <div 
        className={`w-full bg-muted/20 border-b flex items-center justify-center py-2 px-4 ${className}`}
        data-testid={`ad-slot-${slotId}`}
        data-ad-placement={placement}
      >
        <div className="flex items-center gap-4 max-w-4xl w-full">
          <Badge variant="outline" className="text-[10px] shrink-0">Sponsored</Badge>
          <div 
            className={`flex-1 flex items-center justify-center gap-3 py-2 px-4 rounded-md bg-gradient-to-r ${placeholderAd.bgClass}`}
            style={{ 
              minHeight: typeof bannerSize.height === "number" ? `${bannerSize.height}px` : "50px",
              maxHeight: "90px"
            }}
          >
            <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{placeholderAd.title}</p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{placeholderAd.description}</p>
            </div>
            <Button size="sm" variant="secondary" className="shrink-0 text-xs gap-1" data-testid={`ad-cta-${slotId}`}>
              {placeholderAd.cta}
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          {showUpgrade && (
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0" data-testid={`ad-upgrade-${slotId}`}>
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Go Ad-Free</span>
              </Button>
            </Link>
          )}
          {showDismiss && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 shrink-0"
              onClick={() => setDismissed(true)}
              data-testid={`ad-dismiss-${slotId}`}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (placement === "native_feed" || placement === "between_sections" || size === "inFeed" || size === "nativeCard") {
    return (
      <Card 
        className={`overflow-hidden border-dashed ${className}`}
        data-testid={`ad-slot-${slotId}`}
        data-ad-placement={placement}
      >
        <div className={`p-4 bg-gradient-to-r ${placeholderAd.bgClass}`}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background/80 shrink-0">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">Sponsored</Badge>
              </div>
              <h4 className="font-medium text-sm mb-1">{placeholderAd.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{placeholderAd.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="secondary" className="text-xs gap-1" data-testid={`ad-cta-${slotId}`}>
                  {placeholderAd.cta}
                  <ExternalLink className="w-3 h-3" />
                </Button>
                {showUpgrade && (
                  <Link href="/pricing">
                    <Button variant="ghost" size="sm" className="text-xs gap-1" data-testid={`ad-upgrade-${slotId}`}>
                      <Sparkles className="w-3 h-3" />
                      Remove Ads
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {showDismiss && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 shrink-0"
                onClick={() => setDismissed(true)}
                data-testid={`ad-dismiss-${slotId}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const width = slotConfig.width;
  const height = slotConfig.height;
  const displayWidth = typeof width === "number" ? `${width}px` : width;
  const displayHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <Card 
      className={`overflow-hidden border-dashed ${className}`}
      style={{ 
        width: isMobile ? "100%" : displayWidth,
        maxWidth: "100%",
      }}
      data-testid={`ad-slot-${slotId}`}
      data-ad-placement={placement}
    >
      <div 
        className={`flex flex-col items-center justify-center p-4 bg-gradient-to-br ${placeholderAd.bgClass}`}
        style={{ minHeight: displayHeight }}
      >
        <Badge variant="outline" className="text-[10px] mb-2">Sponsored</Badge>
        <Icon className="w-8 h-8 text-muted-foreground mb-2" />
        <h4 className="font-medium text-sm text-center mb-1">{placeholderAd.title}</h4>
        <p className="text-xs text-muted-foreground text-center mb-3 px-2">{placeholderAd.description}</p>
        <Button size="sm" variant="secondary" className="text-xs gap-1 mb-2" data-testid={`ad-cta-${slotId}`}>
          {placeholderAd.cta}
          <ExternalLink className="w-3 h-3" />
        </Button>
        <div className="flex items-center gap-2">
          {showUpgrade && (
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-[10px] gap-1" data-testid={`ad-upgrade-${slotId}`}>
                <Sparkles className="w-3 h-3" />
                Ad-Free
              </Button>
            </Link>
          )}
          {showDismiss && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5"
              onClick={() => setDismissed(true)}
              data-testid={`ad-dismiss-${slotId}`}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function AdSlotSidebar({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <AdSlot slotId="sidebar-1" size="mediumRectangle" placement="sidebar" sponsorCategory="education" />
      <AdSlot slotId="sidebar-2" size="mediumRectangle" placement="sidebar" sponsorCategory="career" />
    </div>
  );
}

export function AdSlotInFeed({ slotId, className = "" }: { slotId: string; className?: string }) {
  return (
    <AdSlot 
      slotId={slotId} 
      size="inFeed" 
      placement="between_sections" 
      className={className}
    />
  );
}

export function AdSlotHeader({ className = "" }: { className?: string }) {
  return (
    <AdSlot 
      slotId="header-banner" 
      size="leaderboard" 
      placement="header" 
      className={className}
    />
  );
}

export function AdSlotFooter({ className = "" }: { className?: string }) {
  return (
    <AdSlot 
      slotId="footer-banner" 
      size="leaderboard" 
      placement="footer" 
      className={className}
    />
  );
}
