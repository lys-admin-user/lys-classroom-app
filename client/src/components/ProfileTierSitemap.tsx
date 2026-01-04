import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  LayoutDashboard, Compass, Briefcase, Target, BookOpen, Sparkles, FileText, Brain,
  BarChart3, Users, Library, School, ClipboardList, Calendar, Award, Flag, Heart,
  Database, Shield, Settings, Lock, ArrowRight, Crown, Star, Zap, Loader2, Map
} from "lucide-react";
import type { ProfileSitemap } from "@shared/schema";

const iconMap: Record<string, any> = {
  LayoutDashboard, Compass, Briefcase, Target, BookOpen, Sparkles, FileText, Brain,
  BarChart3, Users, Library, School, ClipboardList, Calendar, Award, Flag, Heart,
  Database, Shield, Settings,
};

const categoryLabels: Record<string, string> = {
  core: "Core Features",
  ai: "AI-Powered",
  collaboration: "Collaboration",
  analytics: "Analytics",
  admin: "Administration",
  premium: "Premium",
};

const categoryColors: Record<string, string> = {
  core: "bg-muted/50",
  ai: "bg-lys-yellow/10",
  collaboration: "bg-lys-teal/10",
  analytics: "bg-blue-500/10 dark:bg-blue-400/10",
  admin: "bg-lys-red/10",
  premium: "bg-purple-500/10 dark:bg-purple-400/10",
};

const tierColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-lys-yellow/20 text-lys-yellow",
  campus: "bg-lys-teal/20 text-lys-teal",
  enterprise: "bg-lys-red/20 text-lys-red",
};

const tierIcons: Record<string, any> = {
  free: Star,
  pro: Crown,
  campus: School,
  enterprise: Shield,
};

export default function ProfileTierSitemap() {
  const [, setLocation] = useLocation();
  
  const { data: sitemap, isLoading } = useQuery<ProfileSitemap>({
    queryKey: ["/api/profile/sitemap"],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (!sitemap) {
    return null;
  }
  
  const TierIcon = tierIcons[sitemap.currentTier] || Star;
  
  const groupAvailableByCategory = () => {
    const groups: Record<string, typeof sitemap.availableFeatures> = {};
    for (const f of sitemap.availableFeatures) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  };
  
  const groupLockedByCategory = () => {
    const groups: Record<string, typeof sitemap.lockedFeatures> = {};
    for (const f of sitemap.lockedFeatures) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  };
  
  const availableGroups = groupAvailableByCategory();
  const lockedGroups = groupLockedByCategory();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Map className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="font-oswald">Feature Map</CardTitle>
              <CardDescription className="font-roboto">
                Your personalized platform navigation
              </CardDescription>
            </div>
          </div>
          <Badge className={tierColors[sitemap.currentTier]} data-testid="badge-current-tier">
            <TierIcon className="h-3 w-3 mr-1" />
            {sitemap.tierInfo.name} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sitemap.upgradeRecommendation && sitemap.nextTier && (
          <div className="p-4 rounded-md bg-gradient-to-r from-lys-yellow/10 to-lys-teal/10 border border-lys-yellow/20">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-lys-yellow shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-roboto text-sm text-foreground mb-2">
                  {sitemap.upgradeRecommendation}
                </p>
                <Button 
                  size="sm" 
                  onClick={() => setLocation("/pricing")}
                  data-testid="button-upgrade-cta"
                >
                  Upgrade to {sitemap.nextTier.name}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-lys-yellow" />
            Available Features
          </h3>
          <div className="max-h-[280px] overflow-y-auto scrollbar-always-visible pr-1">
            <div className="space-y-4 pr-3">
              {Object.entries(availableGroups).map(([category, features]) => (
                <div key={category} className={`p-3 rounded-md ${categoryColors[category]}`}>
                  <h4 className="font-oswald text-sm text-muted-foreground mb-2">
                    {categoryLabels[category]}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {features.map((feature) => {
                      const IconComponent = iconMap[feature.icon] || BookOpen;
                      return (
                        <Tooltip key={feature.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className="justify-start h-auto py-2 px-3"
                              onClick={() => setLocation(feature.path)}
                              data-testid={`button-feature-${feature.id}`}
                            >
                              <IconComponent className="h-4 w-4 mr-2 shrink-0" />
                              <span className="font-roboto text-sm truncate">{feature.name}</span>
                              {feature.limitInfo && (
                                <Badge variant="outline" className="ml-auto text-xs no-default-hover-elevate no-default-active-elevate">
                                  Limited
                                </Badge>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px]">
                            <p className="font-roboto text-sm">{feature.description}</p>
                            {feature.limitInfo && (
                              <p className="text-xs text-muted-foreground mt-1">{feature.limitInfo}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {sitemap.lockedFeatures.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-oswald text-lg mb-3 flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                Unlock More Features
              </h3>
              <div className="max-h-[220px] overflow-y-auto scrollbar-always-visible pr-1">
                <div className="space-y-4 pr-3">
                  {Object.entries(lockedGroups).map(([category, features]) => (
                    <div key={category} className="p-3 rounded-md bg-muted/30 border border-dashed border-muted-foreground/20">
                      <h4 className="font-oswald text-sm text-muted-foreground mb-2">
                        {categoryLabels[category]}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {features.map((feature) => {
                          const IconComponent = iconMap[feature.icon] || BookOpen;
                          return (
                            <Tooltip key={feature.id}>
                              <TooltipTrigger asChild>
                                <div 
                                  className="flex items-center gap-2 py-2 px-3 rounded-md opacity-60 cursor-not-allowed"
                                  data-testid={`locked-feature-${feature.id}`}
                                >
                                  <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="font-roboto text-sm text-muted-foreground truncate">
                                    {feature.name}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className="ml-auto text-xs capitalize no-default-hover-elevate no-default-active-elevate"
                                  >
                                    {feature.requiredTier}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[220px]">
                                <p className="font-roboto text-sm">{feature.description}</p>
                                {feature.upgradeMessage && (
                                  <p className="text-xs text-lys-yellow mt-1">{feature.upgradeMessage}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {sitemap.nextTier && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="font-oswald text-sm">Ready to unlock more?</h4>
                <p className="font-roboto text-xs text-muted-foreground">
                  {sitemap.nextTier.name} includes: {sitemap.nextTier.features.slice(0, 3).join(", ")}...
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/pricing")}
                data-testid="button-view-pricing"
              >
                View Plans
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
