import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Sparkles, Building2, GraduationCap, AlertCircle, Eye, Globe, Info, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SubscriptionStatus {
  tier: string;
  subscriptionStatus: string | null;
  isDemo: boolean;
}

interface CAICountry {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  caiScore: number;
  lcsiAdjustment: number;
  region: string;
  incomeLevel: string;
  avgMonthlyIncomeUSD?: number;
  lastUpdated: string;
}

interface CAIPricing {
  country: CAICountry;
  adjustmentFactor: number;
  pricing: Array<{
    tier: string;
    name: string;
    globalPrice: number;
    adjustedPrice: number;
    savings: number;
    savingsPercent: number;
    currency: string;
  }>;
  methodology: {
    formula: string;
    caiScore: number;
    lcsiAdjustment: number;
    description: string;
  };
}

const baseTiers = [
  {
    id: "free",
    name: "Free",
    basePrice: 0,
    period: "forever",
    description: "Perfect for students exploring career paths and self-discovery",
    icon: GraduationCap,
    features: [
      { name: "Self-Discovery Assessments", included: true },
      { name: "Career Exploration", included: true },
      { name: "Action Plans (3 max)", included: true },
      { name: "Resource Library", included: true },
      { name: "AI Lesson Generator (5/month)", included: true },
      { name: "Ad-Supported Experience", included: true, note: "Contextual sponsorships" },
      { name: "Scope & Sequence Builder", included: false },
      { name: "Standards Database Access", included: false },
      { name: "Analytics Dashboard", included: false },
      { name: "Educator Influence Program", included: false },
      { name: "Priority Support", included: false },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Focus Mode",
    basePrice: 19,
    period: "/class/month",
    description: "Per-class billing with assignment generation and student distribution (35 students max per class)",
    icon: Eye,
    features: [
      { name: "Focus Mode (No Ads)", included: true, highlight: true },
      { name: "Assignment Generation & Distribution", included: true, highlight: true },
      { name: "35 Students per Class", included: true, note: "Per-class billing" },
      { name: "Self-Discovery Assessments", included: true },
      { name: "Career Exploration", included: true },
      { name: "Unlimited Action Plans", included: true },
      { name: "Unlimited AI Lessons", included: true },
      { name: "Scope & Sequence Builder", included: true },
      { name: "Full Standards Database", included: true },
      { name: "Analytics Dashboard", included: true },
      { name: "Educator Influence Program", included: true },
      { name: "Priority Support", included: false },
    ],
    cta: "Upgrade to Focus Mode",
    popular: true,
  },
  {
    id: "campus",
    name: "Campus",
    subtitle: "Focus Mode + Team",
    basePrice: 99,
    period: "/month",
    description: "For schools and districts with multiple educators and admin tools",
    icon: Building2,
    features: [
      { name: "Focus Mode (No Ads)", included: true, highlight: true },
      { name: "Everything in Pro", included: true },
      { name: "Unlimited Educators", included: true },
      { name: "Campus Admin Dashboard", included: true },
      { name: "Scope Change Approval Workflow", included: true },
      { name: "Team Analytics & Reports", included: true },
      { name: "Custom Standards Import", included: true },
      { name: "SSO Integration", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "Priority Support", included: true },
      { name: "Custom Branding", included: true },
    ],
    cta: "Upgrade to Campus",
    popular: false,
  },
];

const incomeLevelLabels: Record<string, string> = {
  high: "High Income",
  upper_middle: "Upper-Middle Income",
  lower_middle: "Lower-Middle Income",
  low: "Low Income",
};

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<string>("US");

  const { data: countries } = useQuery<CAICountry[]>({
    queryKey: ["/api/cai/countries"],
  });

  const { data: caiPricing } = useQuery<CAIPricing>({
    queryKey: ["/api/cai/pricing", selectedCountry],
    enabled: !!selectedCountry,
  });

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  const countryGroups = useMemo(() => {
    if (!countries) return {};
    return countries.reduce((acc, country) => {
      if (!acc[country.region]) acc[country.region] = [];
      acc[country.region].push(country);
      return acc;
    }, {} as Record<string, CAICountry[]>);
  }, [countries]);

  const selectedCountryData = useMemo(() => {
    return countries?.find(c => c.code === selectedCountry);
  }, [countries, selectedCountry]);

  const upgradeMutation = useMutation({
    mutationFn: (tier: string) => apiRequest("POST", "/api/subscription/demo-upgrade", { tier }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Upgrade Successful",
        description: data.message || `You've been upgraded to ${data.tier}!`,
      });
    },
    onError: () => {
      toast({
        title: "Upgrade Failed",
        description: "There was a problem processing your upgrade.",
        variant: "destructive",
      });
    },
  });

  const downgradeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/subscription/demo-downgrade", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Plan Changed",
        description: "You're now on the Free plan.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to change plan.",
        variant: "destructive",
      });
    },
  });

  const currentTier = subscriptionStatus?.tier || user?.tier || "free";

  const getButtonAction = (tierId: string) => {
    if (!isAuthenticated) return "login";
    if (tierId === currentTier) return "current";
    if (tierId === "free") return "downgrade";
    return "upgrade";
  };

  const handleTierClick = (tierId: string) => {
    const action = getButtonAction(tierId);
    if (action === "upgrade" && (tierId === "pro" || tierId === "campus")) {
      upgradeMutation.mutate(tierId);
    } else if (action === "downgrade") {
      downgradeMutation.mutate();
    }
  };

  const getAdjustedPrice = (tierId: string): { price: number; savings: number; savingsPercent: number } | null => {
    if (!caiPricing) return null;
    const pricing = caiPricing.pricing.find(p => p.tier === tierId);
    if (!pricing) return null;
    return {
      price: pricing.adjustedPrice,
      savings: pricing.savings,
      savingsPercent: pricing.savingsPercent,
    };
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "$0";
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-marker text-foreground mb-4">
            Choose Your Path to Success
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a student discovering your future or an educator shaping the next generation, 
            LYS has the tools you need to succeed.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-8">
          <Card className="border-lys-teal/30 bg-lys-teal/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-lys-teal" />
                <h3 className="font-oswald text-lg text-foreground">Global Equitable Pricing</h3>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Prices are adjusted based on local purchasing power using our Country Affordability Index (CAI), 
                      ensuring equitable access to education tools globally.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">Select your country</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full" data-testid="select-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Object.entries(countryGroups).sort().map(([region, regionCountries]) => (
                        <div key={region}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted">
                            {region}
                          </div>
                          {regionCountries.sort((a, b) => a.name.localeCompare(b.name)).map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCountryData && selectedCountry !== "US" && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Save up to {Math.round((1 - (selectedCountryData.caiScore + selectedCountryData.lcsiAdjustment)) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {selectedCountryData && (
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <span className="font-medium text-foreground">Income Level:</span>{" "}
                      {incomeLevelLabels[selectedCountryData.incomeLevel] || selectedCountryData.incomeLevel}
                    </span>
                    <span>
                      <span className="font-medium text-foreground">CAI Score:</span>{" "}
                      {selectedCountryData.caiScore.toFixed(2)}
                    </span>
                    {selectedCountryData.avgMonthlyIncomeUSD && (
                      <span>
                        <span className="font-medium text-foreground">Avg Income:</span>{" "}
                        ${selectedCountryData.avgMonthlyIncomeUSD}/mo
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {subscriptionStatus?.isDemo && isAuthenticated && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-3 p-4 rounded-md bg-muted border">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Demo Mode:</span> Tier upgrades are simulated for testing. 
                  Connect Stripe for real payment processing.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {baseTiers.map((tier) => {
            const action = getButtonAction(tier.id);
            const isCurrentPlan = tier.id === currentTier;
            const isPending = upgradeMutation.isPending || downgradeMutation.isPending;
            const adjustedPricing = getAdjustedPrice(tier.id);
            const displayPrice = adjustedPricing ? formatPrice(adjustedPricing.price) : `$${tier.basePrice}`;
            const hasSavings = adjustedPricing && adjustedPricing.savingsPercent > 0;

            return (
              <Card 
                key={tier.name}
                className={`relative ${tier.popular ? "border-lys-red border-2" : ""} ${isCurrentPlan ? "ring-2 ring-lys-teal" : ""}`}
                data-testid={`card-pricing-${tier.name.toLowerCase()}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lys-red text-white">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-4 bg-lys-teal text-white">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-muted w-fit">
                    <tier.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="font-oswald text-2xl">{tier.name}</CardTitle>
                  {tier.subtitle && (
                    <Badge variant="outline" className="mx-auto mt-1 text-lys-teal border-lys-teal/30">
                      <Eye className="w-3 h-3 mr-1" />
                      {tier.subtitle}
                    </Badge>
                  )}
                  <div className="mt-2">
                    {hasSavings && tier.basePrice > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg text-muted-foreground line-through">${tier.basePrice}</span>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            {adjustedPricing.savingsPercent}% off
                          </Badge>
                        </div>
                        <span className="text-4xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </>
                    )}
                  </div>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature: any) => (
                      <li key={feature.name} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={`h-5 w-5 shrink-0 mt-0.5 ${feature.highlight ? "text-lys-teal" : "text-green-500"}`} />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className={`${feature.included ? "text-foreground" : "text-muted-foreground"} ${feature.highlight ? "font-medium text-lys-teal" : ""}`}>
                          {feature.name}
                          {feature.note && (
                            <span className="text-xs text-muted-foreground ml-1">({feature.note})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isAuthenticated ? (
                    <Button 
                      className="w-full" 
                      variant={isCurrentPlan ? "secondary" : tier.popular ? "default" : "outline"}
                      disabled={isCurrentPlan || isPending}
                      onClick={() => handleTierClick(tier.id)}
                      data-testid={`button-select-${tier.name.toLowerCase()}`}
                    >
                      {isPending ? "Processing..." : isCurrentPlan ? "Current Plan" : action === "downgrade" ? "Switch to Free" : tier.cta}
                    </Button>
                  ) : (
                    <Link href="/api/login" className="w-full">
                      <Button 
                        className="w-full" 
                        variant={tier.popular ? "default" : "outline"}
                        data-testid={`button-select-${tier.name.toLowerCase()}`}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-oswald text-lg text-foreground mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-lys-teal" />
                About Our Global Pricing
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                LYS uses the <span className="font-medium text-foreground">Country Affordability Index (CAI)</span> to ensure 
                equitable access to educational tools worldwide. Prices are adjusted based on local purchasing power, 
                considering factors like GDP per capita, median income, and cost of living.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-md bg-background border">
                  <div className="font-medium text-foreground mb-1">CAI Score Range</div>
                  <div className="text-muted-foreground">
                    High Income: 0.70-1.0<br />
                    Upper-Middle: 0.40-0.69<br />
                    Lower-Middle: 0.20-0.39<br />
                    Low Income: 0.05-0.19
                  </div>
                </div>
                <div className="p-3 rounded-md bg-background border">
                  <div className="font-medium text-foreground mb-1">Pricing Formula</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    Adjusted Price = Global Price × (CAI + LCSI)
                  </div>
                  <div className="text-muted-foreground mt-2">
                    LCSI accounts for regional cost variations within countries.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-oswald text-foreground mb-4">
            Questions? We're here to help.
          </h2>
          <p className="text-muted-foreground mb-6">
            Contact our team for custom enterprise solutions or educational discounts.
          </p>
          <Button variant="outline" data-testid="button-contact-sales">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
