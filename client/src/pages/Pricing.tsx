import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Building2, GraduationCap, AlertCircle, Eye, Globe, Info, TrendingDown, CreditCard, FileText, Landmark, Loader2, Sparkles, Users } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_PRICES, SEAT_PRICES, SEAT_MINIMUMS, FREE_LESSON_LIMIT, PRO_REGULAR_PRICE, PRO_PROMO_END_DATE } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SubscriptionStatus {
  tier: string;
  subscriptionStatus: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  downgradeTargetTier: string | null;
  isDemo: boolean;
}

const TIER_ORDER: Record<string, number> = { free: 0, pro: 1, campus: 2, enterprise: 3 };

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

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  configured: boolean;
  available: boolean;
}

const baseTiers = [
  {
    id: "free",
    name: "Free",
    basePrice: 0,
    period: "forever",
    description: "Perfect for students exploring career paths and self-discovery",
    icon: GraduationCap,
    seatBased: false,
    features: [
      { name: "Self-Discovery Assessments", included: true },
      { name: "Career Exploration", included: true },
      { name: "Action Plans (3 max)", included: true },
      { name: "Resource Library", included: true },
      { name: `AI Lesson Generator (${FREE_LESSON_LIMIT}/month)`, included: true },
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
    basePrice: PLAN_PRICES.pro,
    period: "/class/month",
    description: "Per-class billing with assignment generation and student distribution (35 students max per class)",
    icon: Eye,
    seatBased: false,
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
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "campus",
    name: "Campus",
    subtitle: "Focus Mode + Team",
    basePrice: PLAN_PRICES.campus,
    seatPrice: SEAT_PRICES.campus,
    seatMinimum: SEAT_MINIMUMS.campus,
    period: "/month base",
    description: `Single-campus license. $${PLAN_PRICES.campus}/mo base + $${SEAT_PRICES.campus}/seat/mo (${SEAT_MINIMUMS.campus} seat minimum).`,
    icon: Building2,
    seatBased: true,
    features: [
      { name: "Focus Mode (No Ads)", included: true, highlight: true },
      { name: "Everything in Pro", included: true },
      { name: `$${SEAT_PRICES.campus}/seat/mo for Pro Educators`, included: true, highlight: true },
      { name: `${SEAT_MINIMUMS.campus} seat minimum`, included: true, note: `starts at $${PLAN_PRICES.campus + SEAT_MINIMUMS.campus * SEAT_PRICES.campus}/mo` },
      { name: "Campus Admin Dashboard", included: true },
      { name: "Scope Change Approval Workflow", included: true },
      { name: "Team Analytics & Reports", included: true },
      { name: "Custom Standards Import", included: true },
      { name: "SSO Integration", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "Priority Support", included: true },
      { name: "Custom Branding", included: true },
    ],
    cta: "Get Campus",
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Full Platform",
    basePrice: PLAN_PRICES.enterprise,
    seatPrice: SEAT_PRICES.enterprise,
    seatMinimum: SEAT_MINIMUMS.enterprise,
    period: "/month base",
    description: `For ISDs, charter networks (CMOs/EMOs), and multi-site orgs. $${PLAN_PRICES.enterprise}/mo base + $${SEAT_PRICES.enterprise}/seat/mo (${SEAT_MINIMUMS.enterprise} seat minimum).`,
    icon: Building2,
    seatBased: true,
    features: [
      { name: "Everything in Campus", included: true, highlight: true },
      { name: `$${SEAT_PRICES.enterprise}/seat/mo for Pro Educators`, included: true, highlight: true },
      { name: `${SEAT_MINIMUMS.enterprise} seat minimum`, included: true, note: `starts at $${PLAN_PRICES.enterprise + SEAT_MINIMUMS.enterprise * SEAT_PRICES.enterprise}/mo` },
      { name: "Multi-District & Charter Network Management", included: true },
      { name: "Master Dashboard across all campuses", included: true },
      { name: "Per-State Management for multi-state networks", included: true },
      { name: "Custom API Access", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "White-Label Options", included: true },
      { name: "Custom Integrations", included: true },
      { name: "SLA Guarantee", included: true },
      { name: "Dedicated Support Team", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const incomeLevelLabels: Record<string, string> = {
  high: "High Income",
  upper_middle: "Upper-Middle Income",
  lower_middle: "Lower-Middle Income",
  low: "Low Income",
};

const paymentMethodIcons: Record<string, any> = {
  "credit-card": CreditCard,
  "paypal": SiPaypal,
  "file-text": FileText,
  "landmark": Landmark,
};

export default function Pricing() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [poFormData, setPoFormData] = useState({ poNumber: "", organizationName: "", contactName: "", contactEmail: user?.email || "", notes: "" });
  const [bankFormData, setBankFormData] = useState({ organizationName: "", contactEmail: user?.email || "" });
  const [bankTransferDetails, setBankTransferDetails] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [downgradeTo, setDowngradeTo] = useState<string>("");

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("checkout_success");
    const sessionId = params.get("session_id");
    const tier = params.get("tier");
    const cancelled = params.get("checkout_cancelled");

    if (cancelled) {
      window.history.replaceState({}, "", window.location.pathname);
      toast({ title: "Checkout Cancelled", description: "No charges were made. You can try again anytime.", variant: "destructive" });
      return;
    }

    if (success && sessionId && isAuthenticated) {
      window.history.replaceState({}, "", window.location.pathname);
      apiRequest("POST", "/api/subscription/verify-checkout", { sessionId })
        .then(r => r.json())
        .then((data) => {
          queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          if (data.success) {
            const tierData = baseTiers.find(t => t.id === (tier || data.tier));
            const displayName = tierData?.subtitle || tierData?.name || tier || data.tier;
            toast({ title: "Welcome to " + displayName + "! 🎉", description: "Your payment was successful. Enjoy your new features!" });
          } else {
            toast({ title: "Verification Pending", description: "Your payment is being processed. Your plan will update shortly." });
          }
        })
        .catch(() => {
          toast({ title: "Verification Pending", description: "Your payment is being processed. Your plan will update shortly." });
        });
    }
  }, [isAuthenticated]);

  const { data: countries } = useQuery<CAICountry[]>({
    queryKey: ["/api/cai/countries"],
  });

  const { data: caiPricing } = useQuery<CAIPricing>({
    queryKey: [`/api/cai/pricing/${selectedCountry}`],
    enabled: !!selectedCountry,
  });

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods/available"],
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
    mutationFn: (tier: string) => apiRequest("POST", "/api/subscription/demo-upgrade", { tier }).then(r => r.json()),
    onSuccess: (_data: any, tier: string) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setCheckoutOpen(false);
      const tierData = baseTiers.find(t => t.id === tier);
      const displayName = tierData?.subtitle || tierData?.name || tier;
      toast({
        title: "Upgrade Successful",
        description: `You've been upgraded to ${displayName}!`,
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

  const poMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/purchase-order/submit", data).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setCheckoutOpen(false);
      toast({
        title: "Purchase Order Submitted",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Could not submit the purchase order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bankTransferMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/bank-transfer/request", data).then(r => r.json()),
    onSuccess: (data: any) => {
      setBankTransferDetails(data.bankDetails);
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({
        title: "Bank Transfer Details",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Could not get bank transfer details.",
        variant: "destructive",
      });
    },
  });

  const downgradeMutation = useMutation({
    mutationFn: (targetTier: string) =>
      apiRequest("POST", "/api/subscription/downgrade", { targetTier }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setDowngradeDialogOpen(false);
      if (data.immediate) {
        toast({ title: "Plan Changed", description: data.message });
      } else {
        toast({
          title: "Downgrade Scheduled",
          description: data.message,
        });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to change plan. Please try again.", variant: "destructive" });
    },
  });

  const currentTier = subscriptionStatus?.tier || user?.tier || "free";

  const getButtonAction = (tierId: string) => {
    if (!isAuthenticated) return "login";
    if (tierId === currentTier) return "current";
    const currentOrder = TIER_ORDER[currentTier] ?? 0;
    const targetOrder = TIER_ORDER[tierId] ?? 0;
    if (targetOrder < currentOrder) return "downgrade";
    return "upgrade";
  };

  const handleTierClick = (tierId: string) => {
    const action = getButtonAction(tierId);
    if (action === "upgrade" && (tierId === "pro" || tierId === "campus")) {
      setCheckoutTier(tierId);
      setSelectedPaymentMethod("");
      setBankTransferDetails(null);
      setCheckoutOpen(true);
    } else if (action === "downgrade") {
      setDowngradeTo(tierId);
      setDowngradeDialogOpen(true);
    }
  };

  const handlePaymentSubmit = async () => {
    if (selectedPaymentMethod === "stripe") {
      setStripeLoading(true);
      try {
        const res = await apiRequest("POST", "/api/subscription/create-checkout-session", { tier: checkoutTier });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast({ title: "Error", description: data.error || "Could not start checkout. Please try again.", variant: "destructive" });
          setStripeLoading(false);
        }
      } catch {
        toast({ title: "Error", description: "Could not connect to payment service. Please try again.", variant: "destructive" });
        setStripeLoading(false);
      }
      return;
    } else if (selectedPaymentMethod === "paypal") {
      toast({ title: "PayPal Coming Soon", description: "PayPal checkout will be available soon. Please use a card or another payment method.", variant: "default" });
      return;
    } else if (selectedPaymentMethod === "purchase_order") {
      poMutation.mutate({
        tier: checkoutTier,
        ...poFormData,
      });
    } else if (selectedPaymentMethod === "bank_transfer") {
      bankTransferMutation.mutate({
        tier: checkoutTier,
        ...bankFormData,
      });
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

  const selectedTierData = baseTiers.find(t => t.id === checkoutTier);
  const checkoutPrice = getAdjustedPrice(checkoutTier);
  const seatMinTotal = selectedTierData && (selectedTierData as any).seatBased && (selectedTierData as any).seatMinimum
    ? selectedTierData.basePrice + (selectedTierData as any).seatMinimum * (selectedTierData as any).seatPrice
    : null;
  const displayCheckoutPrice = checkoutPrice
    ? formatPrice(checkoutPrice.price)
    : seatMinTotal !== null
      ? `Starts at $${seatMinTotal}`
      : selectedTierData ? `$${selectedTierData.basePrice}` : "$0";
  const isPending = upgradeMutation.isPending || downgradeMutation.isPending || poMutation.isPending || bankTransferMutation.isPending || stripeLoading;

  const downgradeToData = baseTiers.find(t => t.id === downgradeTo);
  const currentTierData = baseTiers.find(t => t.id === currentTier);
  const periodEndFormatted = subscriptionStatus?.currentPeriodEnd
    ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const hasRealSubscription = !!subscriptionStatus?.stripeSubscriptionId && subscriptionStatus?.subscriptionStatus === "active";

  const scheduledDowngrade = subscriptionStatus?.subscriptionStatus === "canceling" && subscriptionStatus?.downgradeTargetTier
    ? {
        targetTier: subscriptionStatus.downgradeTargetTier,
        targetName: baseTiers.find(t => t.id === subscriptionStatus.downgradeTargetTier)?.name ?? subscriptionStatus.downgradeTargetTier,
        date: periodEndFormatted,
      }
    : null;

  const lostFeatures = currentTierData?.features.filter(f =>
    f.included && !downgradeToData?.features.find(df => df.name === f.name && df.included)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-marker text-foreground mb-4">
            Choose Your Path to Success
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            From students and families to classrooms, campuses, and districts — 
            LYS has the tools you need to succeed.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-lys-yellow/10 border border-lys-yellow/30 rounded-full px-5 py-2 text-sm font-roboto">
            <Sparkles className="h-4 w-4 text-lys-yellow" />
            <span className="text-foreground font-medium">Try Pro free for 10 days</span>
            <span className="text-muted-foreground">— No credit card required</span>
          </div>
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
                  <span className="font-medium text-foreground">Demo Mode:</span> Payment processing is in sandbox mode.
                  Tier upgrades are available for testing across all payment methods.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {baseTiers.map((tier) => {
            const action = getButtonAction(tier.id);
            const isCurrentPlan = tier.id === currentTier;
            const adjustedPricing = getAdjustedPrice(tier.id);
            const displayPrice = adjustedPricing ? formatPrice(adjustedPricing.price) : `$${tier.basePrice}`;
            const hasSavings = adjustedPricing && adjustedPricing.savingsPercent > 0;

            return (
              <Card 
                key={tier.name}
                className={`relative ${
                  isCurrentPlan
                    ? "border-lys-teal border-2"
                    : tier.popular
                    ? "border-lys-red border-2"
                    : ""
                }`}
                data-testid={`card-pricing-${tier.name.toLowerCase()}`}
              >
                {isCurrentPlan ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lys-teal text-white">
                    Current Plan
                  </Badge>
                ) : tier.popular ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lys-red text-white">
                    Most Popular
                  </Badge>
                ) : null}
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
                    {tier.id === "pro" ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg text-muted-foreground line-through" data-testid="text-pro-regular-price">${PRO_REGULAR_PRICE}</span>
                          <Badge variant="secondary" className="bg-lys-red/10 text-lys-red border-lys-red/20" data-testid="badge-pro-promo">
                            Limited time
                          </Badge>
                        </div>
                        <div>
                          <span className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-pro-promo-price">{displayPrice}</span>
                          <span className="text-muted-foreground">{tier.period}</span>
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid="text-pro-promo-end">
                          Promo ends {(() => {
                            const [y, m, d] = PRO_PROMO_END_DATE.split("-").map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                          })()}
                        </div>
                        {hasSavings && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            +{adjustedPricing.savingsPercent}% country discount
                          </Badge>
                        )}
                      </div>
                    ) : hasSavings && tier.basePrice > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg text-muted-foreground line-through">${tier.basePrice}</span>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            {adjustedPricing.savingsPercent}% off
                          </Badge>
                        </div>
                        <span className="text-3xl md:text-4xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl md:text-4xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </>
                    )}
                    {(tier as any).seatBased && (tier as any).seatPrice && (
                      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-lys-teal/10 rounded-full px-3 py-1">
                        <Users className="h-3 w-3 text-lys-teal" />
                        <span>+ <strong className="text-foreground">${(tier as any).seatPrice}/seat/mo</strong> for Pro educators</span>
                      </div>
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
                <CardFooter className="flex flex-col gap-3">
                  {isCurrentPlan && scheduledDowngrade && (
                    <div className="w-full rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 flex items-start gap-2" data-testid="banner-scheduled-downgrade">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                        Switching to <strong>{scheduledDowngrade.targetName}</strong>
                        {scheduledDowngrade.date ? <> on <strong>{scheduledDowngrade.date}</strong></> : " at end of billing period"}.
                        {" "}You keep full access until then.
                      </p>
                    </div>
                  )}
                  {isAuthenticated ? (
                    <Button 
                      className="w-full" 
                      variant={isCurrentPlan ? "secondary" : tier.popular ? "default" : "outline"}
                      disabled={(isCurrentPlan && !scheduledDowngrade) || isPending}
                      onClick={() => handleTierClick(tier.id)}
                      data-testid={`button-select-${tier.name.toLowerCase()}`}
                    >
                      {isCurrentPlan && !scheduledDowngrade ? "Current Plan" :
                       isCurrentPlan && scheduledDowngrade ? "Change Plan" :
                       action === "downgrade" ? `Switch to ${tier.name}` :
                       tier.cta}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => { window.location.href = "/api/login"; }}
                      data-testid={`button-select-${tier.name.toLowerCase()}`}
                    >
                      {tier.cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto mb-12 space-y-6">
          {paymentMethods && paymentMethods.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-oswald text-lg text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-lys-teal" />
                  Accepted Payment Methods
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => {
                    const IconComp = paymentMethodIcons[method.icon] || CreditCard;
                    const needsSetup = (method.id === "stripe" || method.id === "paypal") && !method.configured;
                    return (
                      <div
                        key={method.id}
                        className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border"
                        data-testid={`payment-method-${method.id}`}
                      >
                        <div className="p-2 rounded-md bg-background border">
                          <IconComp className="h-5 w-5 text-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">{method.name}</p>
                            {needsSetup && (
                              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                    Adjusted Price = Global Price x (CAI + LCSI)
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
          <h2 className="text-xl md:text-2xl font-oswald text-foreground mb-4">
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

      {/* Downgrade Confirmation Dialog */}
      <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-oswald text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Plan Change
            </DialogTitle>
            <DialogDescription>
              You're switching from <strong>{currentTierData?.name}</strong> to <strong>{downgradeToData?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Access timeline */}
            {hasRealSubscription && periodEndFormatted ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  You keep full access until {periodEndFormatted}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Since you've already paid for this billing period, your {currentTierData?.name} plan stays active until then. After that, your account switches to {downgradeToData?.name}.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-muted bg-muted/40 p-4 space-y-1">
                <p className="text-sm font-medium text-foreground">Your plan changes immediately</p>
                <p className="text-xs text-muted-foreground">
                  You'll be switched to the {downgradeToData?.name} plan right away.
                </p>
              </div>
            )}

            {/* Features being lost */}
            {lostFeatures.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Features you'll lose:</p>
                <ul className="space-y-1">
                  {lostFeatures.slice(0, 6).map(f => (
                    <li key={f.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      {f.name}
                    </li>
                  ))}
                  {lostFeatures.length > 6 && (
                    <li className="text-xs text-muted-foreground pl-5">and {lostFeatures.length - 6} more…</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDowngradeDialogOpen(false)}
              data-testid="button-cancel-downgrade"
            >
              Keep {currentTierData?.name}
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={downgradeMutation.isPending}
              onClick={() => downgradeMutation.mutate(downgradeTo)}
              data-testid="button-confirm-downgrade"
            >
              {downgradeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {hasRealSubscription && periodEndFormatted
                ? `Downgrade on ${periodEndFormatted}`
                : `Switch to ${downgradeToData?.name}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-oswald text-xl">
              Upgrade to {selectedTierData?.name}
            </DialogTitle>
            <DialogDescription>
              {displayCheckoutPrice}{selectedTierData?.period} - Choose your preferred payment method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
              <div className="grid gap-2">
                {paymentMethods?.map((method) => {
                  const IconComp = paymentMethodIcons[method.icon] || CreditCard;
                  const isUnavailable = method.available === false;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      disabled={isUnavailable}
                      onClick={() => {
                        if (!isUnavailable) {
                          setSelectedPaymentMethod(method.id);
                          setBankTransferDetails(null);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                        isUnavailable
                          ? "opacity-50 cursor-not-allowed border-border"
                          : selectedPaymentMethod === method.id
                          ? "border-lys-teal bg-lys-teal/5 ring-1 ring-lys-teal"
                          : "hover-elevate"
                      }`}
                      data-testid={`button-select-payment-${method.id}`}
                    >
                      <div className={`p-2 rounded-md border ${selectedPaymentMethod === method.id ? "bg-lys-teal/10 border-lys-teal/30" : "bg-muted"}`}>
                        <IconComp className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{method.name}</p>
                          {isUnavailable && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Coming Soon</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                      {selectedPaymentMethod === method.id && !isUnavailable && (
                        <Check className="h-4 w-4 text-lys-teal shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPaymentMethod === "stripe" && (
              <div className="p-4 rounded-md bg-muted/50 border space-y-2">
                <p className="text-sm text-foreground font-medium">Secure Card Payment via Stripe</p>
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to Stripe's secure checkout page to enter your card details.
                  We accept Visa, Mastercard, American Express, and Discover.
                </p>
                <p className="text-xs text-muted-foreground">
                  Your payment is protected by Stripe — no card data is stored on our servers.
                </p>
              </div>
            )}

            {selectedPaymentMethod === "paypal" && (
              <div className="p-4 rounded-md bg-muted/50 border space-y-2">
                <p className="text-sm text-foreground font-medium">PayPal — Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  PayPal checkout is not yet available. Please use Credit / Debit Card, Purchase Order, or Bank Transfer instead.
                </p>
              </div>
            )}

            {selectedPaymentMethod === "purchase_order" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Submit a purchase order for institutional billing. Your account will be provisioned immediately while we process the PO.
                </p>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="po-number" className="text-sm">PO Number *</Label>
                    <Input
                      id="po-number"
                      value={poFormData.poNumber}
                      onChange={(e) => setPoFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                      placeholder="PO-2026-001"
                      data-testid="input-po-number"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="po-org" className="text-sm">Organization Name *</Label>
                    <Input
                      id="po-org"
                      value={poFormData.organizationName}
                      onChange={(e) => setPoFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Springfield School District"
                      data-testid="input-po-org"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="po-contact" className="text-sm">Contact Name</Label>
                      <Input
                        id="po-contact"
                        value={poFormData.contactName}
                        onChange={(e) => setPoFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Jane Doe"
                        data-testid="input-po-contact"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="po-email" className="text-sm">Billing Email *</Label>
                      <Input
                        id="po-email"
                        type="email"
                        value={poFormData.contactEmail}
                        onChange={(e) => setPoFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="billing@school.edu"
                        data-testid="input-po-email"
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="po-notes" className="text-sm">Notes (optional)</Label>
                    <Textarea
                      id="po-notes"
                      value={poFormData.notes}
                      onChange={(e) => setPoFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional details for the purchase order..."
                      className="min-h-[60px]"
                      data-testid="textarea-po-notes"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === "bank_transfer" && !bankTransferDetails && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Available for annual plans. Enter your organization details to receive bank transfer instructions.
                </p>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="bank-org" className="text-sm">Organization Name *</Label>
                    <Input
                      id="bank-org"
                      value={bankFormData.organizationName}
                      onChange={(e) => setBankFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Springfield School District"
                      data-testid="input-bank-org"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="bank-email" className="text-sm">Contact Email *</Label>
                    <Input
                      id="bank-email"
                      type="email"
                      value={bankFormData.contactEmail}
                      onChange={(e) => setBankFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="billing@school.edu"
                      data-testid="input-bank-email"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === "bank_transfer" && bankTransferDetails && (
              <div className="p-4 rounded-md bg-green-500/5 border border-green-500/20 space-y-3">
                <p className="text-sm font-medium text-foreground">Bank Transfer Instructions</p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Payee:</span>
                    <span className="text-foreground font-medium">{bankTransferDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Account Type:</span>
                    <span className="text-foreground">{bankTransferDetails.accountType}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Routing Info:</span>
                    <span className="text-foreground text-xs">{bankTransferDetails.routingNumber}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="text-foreground font-mono text-xs">{bankTransferDetails.reference}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{bankTransferDetails.note}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} data-testid="button-cancel-checkout">
              Cancel
            </Button>
            {selectedPaymentMethod === "bank_transfer" && bankTransferDetails ? (
              <Button onClick={() => setCheckoutOpen(false)} data-testid="button-done-checkout">
                Done
              </Button>
            ) : (
              <Button
                onClick={handlePaymentSubmit}
                disabled={!selectedPaymentMethod || isPending || 
                  (selectedPaymentMethod === "purchase_order" && (!poFormData.poNumber || !poFormData.organizationName || !poFormData.contactEmail)) ||
                  (selectedPaymentMethod === "bank_transfer" && (!bankFormData.organizationName || !bankFormData.contactEmail))
                }
                data-testid="button-confirm-checkout"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedPaymentMethod === "purchase_order" ? "Submit Purchase Order" :
                 selectedPaymentMethod === "bank_transfer" ? "Get Transfer Instructions" :
                 selectedPaymentMethod === "paypal" ? "PayPal — Coming Soon" :
                 selectedPaymentMethod === "stripe" ? (stripeLoading ? "Redirecting to Stripe..." : "Pay with Card") :
                 "Select Payment Method"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
