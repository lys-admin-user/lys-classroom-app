import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Award,
  Share2,
  Eye,
  Users,
  TrendingUp,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  Gift,
  Clock,
  Wallet,
  ArrowRightLeft,
  DollarSign,
  Network,
  Sparkles,
  Image,
  Download,
  ExternalLink,
  Crown,
  Zap,
  CircleDollarSign,
  Loader2,
} from "lucide-react";
import type {
  EducatorAffiliate,
  ReferralEvent,
  WalletTransaction,
  PromoAsset,
} from "@shared/schema";
import { format } from "date-fns";

interface DashboardData {
  affiliate: EducatorAffiliate;
  recentEvents: ReferralEvent[];
}

interface WalletData {
  pointsBalance: number;
  cashBalanceCents: number;
  affiliateMode: string;
  canConvert: boolean;
  conversionRate: {
    pointsPerDollar: number;
    minimumPayoutCents: number;
    minimumPointsToConvert: number;
    tier2CommissionPercent: number;
    proUpgradeThreshold: number;
  };
  transactions: WalletTransaction[];
}

interface Tier2Data {
  parentAffiliate: { id: string; referralCode: string; tier2EarningsTotal: number };
  subAffiliates: Array<{
    id: string;
    displayName: string | null;
    referralCode: string;
    totalPoints: number;
    totalReferrals: number;
    affiliateMode: string | null;
    createdAt: string | null;
  }>;
  tier2InviteLink: string;
}

interface ConfigData {
  pointConfig: Record<string, number>;
  conversionRate: {
    pointsPerDollar: number;
    minimumPayoutCents: number;
    minimumPointsToConvert: number;
    tier2CommissionPercent: number;
    proUpgradeThreshold: number;
  };
  integrations: {
    rewardful: { configured: boolean; status: string };
    partnerstack: { configured: boolean; status: string };
    stripeConnect: { configured: boolean; status: string };
  };
}

const eventTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
  view: { label: "View", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Eye },
  share: { label: "Share", color: "bg-green-500/10 text-green-600 border-green-200", icon: Share2 },
  copy_link: { label: "Link Copy", color: "bg-purple-500/10 text-purple-600 border-purple-200", icon: Copy },
  signup: { label: "Signup", color: "bg-lys-red/10 text-lys-red border-lys-red/20", icon: Users },
  lesson_save: { label: "Lesson Save", color: "bg-lys-teal/10 text-lys-teal border-lys-teal/20", icon: BookOpen },
  referral_signup: { label: "Referral Signup", color: "bg-lys-red/10 text-lys-red border-lys-red/20", icon: Users },
  course_completion: { label: "Course Complete", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: Award },
  daily_login_streak: { label: "Login Streak", color: "bg-amber-500/10 text-amber-600 border-amber-200", icon: Zap },
  verified_review: { label: "Review", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200", icon: Check },
  tier2_commission: { label: "Tier-2 Bonus", color: "bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20", icon: Network },
};

const txTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
  points_earned: { label: "Points Earned", color: "text-green-600", icon: TrendingUp },
  points_redeemed: { label: "Points Converted", color: "text-orange-600", icon: ArrowRightLeft },
  cash_conversion: { label: "Cash Credit", color: "text-emerald-600", icon: DollarSign },
  cash_payout: { label: "Payout", color: "text-blue-600", icon: CircleDollarSign },
  tier2_commission: { label: "Tier-2 Bonus", color: "text-lys-yellow", icon: Network },
};

export default function EducatorInfluence() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [tier2Copied, setTier2Copied] = useState(false);
  const [convertAmount, setConvertAmount] = useState("");
  const [promoCourseName, setPromoCourseName] = useState("");

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/affiliate/dashboard"],
    enabled: isAuthenticated,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ["/api/affiliate/wallet"],
    enabled: isAuthenticated,
  });

  const { data: tier2Data } = useQuery<Tier2Data>({
    queryKey: ["/api/affiliate/tier2"],
    enabled: isAuthenticated,
  });

  const { data: configData } = useQuery<ConfigData>({
    queryKey: ["/api/affiliate/config"],
  });

  const { data: promos } = useQuery<PromoAsset[]>({
    queryKey: ["/api/affiliate/promos"],
    enabled: isAuthenticated,
  });

  const convertMutation = useMutation({
    mutationFn: async (pointsToConvert: number) => {
      const res = await apiRequest("POST", "/api/affiliate/convert", { pointsToConvert });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Points Converted!", description: `You received ${data.cashDollars} in cash credit.` });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
      setConvertAmount("");
    },
    onError: () => {
      toast({ title: "Conversion Failed", description: "Could not convert points. Check minimum requirements.", variant: "destructive" });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/affiliate/payout", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: data.demoMode ? "Payout Requested (Demo)" : "Payout Initiated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/wallet"] });
    },
    onError: () => {
      toast({ title: "Payout Failed", variant: "destructive" });
    },
  });

  const promoMutation = useMutation({
    mutationFn: async (courseName: string) => {
      const res = await apiRequest("POST", "/api/affiliate/promo/generate", { courseName });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Promo Generated!", description: "Your branded content is ready." });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/promos"] });
      setPromoCourseName("");
    },
    onError: () => {
      toast({ title: "Generation Failed", description: "Could not generate promo content.", variant: "destructive" });
    },
  });

  const handleCopyReferralCode = async () => {
    if (!dashboard?.affiliate.referralCode) return;
    try {
      const shareUrl = `${window.location.origin}?ref=${dashboard.affiliate.referralCode}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link Copied!", description: "Your referral link has been copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    }
  };

  const handleCopyTier2Link = async () => {
    if (!tier2Data?.tier2InviteLink) return;
    try {
      await navigator.clipboard.writeText(tier2Data.tier2InviteLink);
      setTier2Copied(true);
      setTimeout(() => setTier2Copied(false), 2000);
      toast({ title: "Link Copied!", description: "Your tier-2 invite link has been copied." });
    } catch {
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-lys-red/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-lys-red" />
            </div>
            <CardTitle className="font-marker text-2xl">Sign In Required</CardTitle>
            <CardDescription className="font-roboto">
              Sign in to access your Educator Influence dashboard and track your affiliate rewards.
            </CardDescription>
          </CardHeader>
          <div className="pb-6">
            <Button
              className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-sign-in"
            >
              Sign In to Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isPro = dashboard?.affiliate.affiliateMode === "pro";
  const totalPoints = dashboard?.affiliate.totalPoints || 0;
  const cashBalanceCents = walletData?.cashBalanceCents || 0;
  const referralCount = dashboard?.affiliate.totalReferrals || 0;
  const proThreshold = configData?.conversionRate.proUpgradeThreshold || 5;
  const proProgress = Math.min((referralCount / proThreshold) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lys-red to-lys-yellow flex items-center justify-center">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-marker text-3xl md:text-4xl text-foreground" data-testid="text-page-title">
                Educator Influence
              </h1>
              {isPro && (
                <Badge className="bg-gradient-to-r from-lys-yellow to-amber-500 text-black font-oswald" data-testid="badge-pro-mode">
                  <Crown className="w-3 h-3 mr-1" /> PRO
                </Badge>
              )}
              {!isPro && (
                <Badge variant="secondary" className="font-oswald" data-testid="badge-student-mode">
                  Student Mode
                </Badge>
              )}
            </div>
            <p className="font-roboto text-muted-foreground">
              Share your lessons, earn rewards, and grow your network
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : dashboard ? (
        <>
          <Card className="mb-6 bg-gradient-to-r from-lys-yellow/10 via-lys-red/5 to-lys-teal/10 border-lys-yellow/20">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-lys-red/20 flex items-center justify-center">
                    <Award className="h-7 w-7 text-lys-red" />
                  </div>
                  <div>
                    <p className="font-oswald text-sm text-muted-foreground">Your Referral Code</p>
                    <p className="font-marker text-2xl text-lys-red" data-testid="text-referral-code">{dashboard.affiliate.referralCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-roboto text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
                    <p className="font-roboto text-xs text-muted-foreground">Points</p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-center">
                    <p className="font-roboto text-2xl font-bold text-emerald-600">${(cashBalanceCents / 100).toFixed(2)}</p>
                    <p className="font-roboto text-xs text-muted-foreground">Cash</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyReferralCode}
                    data-testid="button-copy-referral"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy Link
                  </Button>
                </div>
              </div>

              {!isPro && (
                <div className="mt-4 p-3 rounded-lg bg-background/60 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-oswald text-xs text-muted-foreground">Pro Upgrade Progress</span>
                    <span className="font-roboto text-xs font-medium">{referralCount}/{proThreshold} referrals</span>
                  </div>
                  <Progress value={proProgress} className="h-2" />
                  <p className="font-roboto text-[10px] text-muted-foreground mt-1">
                    Refer {Math.max(0, proThreshold - referralCount)} more user{proThreshold - referralCount !== 1 ? "s" : ""} to unlock Pro mode with cash payouts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview" className="font-oswald" data-testid="tab-overview">
                <TrendingUp className="w-4 h-4 mr-2 hidden sm:inline" /> Overview
              </TabsTrigger>
              <TabsTrigger value="wallet" className="font-oswald" data-testid="tab-wallet">
                <Wallet className="w-4 h-4 mr-2 hidden sm:inline" /> Wallet
              </TabsTrigger>
              <TabsTrigger value="network" className="font-oswald" data-testid="tab-network">
                <Network className="w-4 h-4 mr-2 hidden sm:inline" /> Network
              </TabsTrigger>
              <TabsTrigger value="promo" className="font-oswald" data-testid="tab-promo">
                <Sparkles className="w-4 h-4 mr-2 hidden sm:inline" /> Promo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card data-testid="stat-total-points">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-lys-yellow/20 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-lys-yellow" />
                      </div>
                      <div>
                        <p className="font-roboto text-2xl font-bold text-foreground">{totalPoints.toLocaleString()}</p>
                        <p className="font-roboto text-xs text-muted-foreground">Total Points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="stat-views">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-roboto text-2xl font-bold text-foreground">{dashboard.affiliate.totalViews || 0}</p>
                        <p className="font-roboto text-xs text-muted-foreground">Total Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="stat-shares">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Share2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-roboto text-2xl font-bold text-foreground">{dashboard.affiliate.totalShares || 0}</p>
                        <p className="font-roboto text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="stat-referrals">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-lys-teal/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-lys-teal" />
                      </div>
                      <div>
                        <p className="font-roboto text-2xl font-bold text-foreground">{dashboard.affiliate.totalReferrals || 0}</p>
                        <p className="font-roboto text-xs text-muted-foreground">Referrals</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {dashboard.recentEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground font-roboto">
                          <Share2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No referral events yet</p>
                          <p className="text-sm">Share your lessons to start earning!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dashboard.recentEvents.map((event) => {
                            const config = eventTypeLabels[event.eventType] || eventTypeLabels.view;
                            const EventIcon = config.icon;
                            return (
                              <div
                                key={event.id}
                                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                                data-testid={`event-${event.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
                                    <EventIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-roboto text-sm font-medium">{config.label}</p>
                                    <p className="font-roboto text-xs text-muted-foreground">
                                      {event.channel && `via ${event.channel}`}
                                      {event.createdAt && ` · ${format(new Date(event.createdAt), "MMM d, h:mm a")}`}
                                    </p>
                                  </div>
                                </div>
                                {(event.pointsEarned || 0) > 0 && (
                                  <Badge variant="secondary" className="font-roboto">+{event.pointsEarned} pts</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                      How to Earn Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {configData ? (
                        Object.entries(configData.pointConfig).map(([action, pts]) => {
                          const config = eventTypeLabels[action];
                          const Icon = config?.icon || Award;
                          const label = config?.label || action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                          return (
                            <div key={action} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config?.color || "bg-muted"}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="font-roboto text-sm flex-1">{label}</span>
                              <Badge className="bg-lys-yellow/20 text-lys-yellow border-lys-yellow/30">+{pts} pts</Badge>
                            </div>
                          );
                        })
                      ) : (
                        <Skeleton className="h-32" />
                      )}
                    </div>
                    <div className="mt-4 p-3 rounded-md bg-gradient-to-r from-lys-teal/10 to-lys-yellow/10 border border-lys-teal/20">
                      <p className="font-oswald text-sm mb-1">Points to Cash</p>
                      <p className="font-roboto text-xs text-muted-foreground">
                        Convert {configData?.conversionRate.pointsPerDollar || 100} points = $1.00. Minimum {((configData?.conversionRate.minimumPointsToConvert || 5000)).toLocaleString()} points to convert.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="wallet">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-2 border-lys-yellow/30">
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-lys-yellow/20 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-7 w-7 text-lys-yellow" />
                    </div>
                    <p className="font-roboto text-3xl font-bold text-foreground" data-testid="text-points-balance">
                      {(walletData?.pointsBalance || 0).toLocaleString()}
                    </p>
                    <p className="font-oswald text-sm text-muted-foreground">Points Balance</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-emerald-500/30">
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-7 w-7 text-emerald-600" />
                    </div>
                    <p className="font-roboto text-3xl font-bold text-emerald-600" data-testid="text-cash-balance">
                      ${((walletData?.cashBalanceCents || 0) / 100).toFixed(2)}
                    </p>
                    <p className="font-oswald text-sm text-muted-foreground">Cash Balance</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-lys-teal/30">
                  <CardContent className="pt-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-lys-teal/20 flex items-center justify-center mx-auto mb-3">
                      <Network className="h-7 w-7 text-lys-teal" />
                    </div>
                    <p className="font-roboto text-3xl font-bold text-foreground" data-testid="text-tier2-earnings">
                      {(dashboard?.affiliate.tier2EarningsTotal || 0).toLocaleString()}
                    </p>
                    <p className="font-oswald text-sm text-muted-foreground">Tier-2 Earnings</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                      Convert Points to Cash
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      {configData?.conversionRate.pointsPerDollar || 100} points = $1.00 · Min {((configData?.conversionRate.minimumPointsToConvert || 5000)).toLocaleString()} points
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="font-roboto text-sm text-muted-foreground mb-1 block">Points to Convert</label>
                        <Input
                          type="number"
                          value={convertAmount}
                          onChange={(e) => setConvertAmount(e.target.value)}
                          placeholder={`Min ${(configData?.conversionRate.minimumPointsToConvert || 5000).toLocaleString()}`}
                          min={configData?.conversionRate.minimumPointsToConvert || 5000}
                          max={walletData?.pointsBalance || 0}
                          data-testid="input-convert-points"
                        />
                      </div>
                      {convertAmount && Number(convertAmount) > 0 && (
                        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <p className="font-roboto text-sm">
                            You'll receive: <span className="font-bold text-emerald-600">
                              ${(Number(convertAmount) / (configData?.conversionRate.pointsPerDollar || 100)).toFixed(2)}
                            </span>
                          </p>
                        </div>
                      )}
                      <Button
                        className="w-full bg-lys-teal hover:bg-lys-teal/90 font-oswald"
                        disabled={
                          !walletData?.canConvert ||
                          !convertAmount ||
                          Number(convertAmount) < (configData?.conversionRate.minimumPointsToConvert || 5000) ||
                          Number(convertAmount) > (walletData?.pointsBalance || 0) ||
                          convertMutation.isPending
                        }
                        onClick={() => convertMutation.mutate(Number(convertAmount))}
                        data-testid="button-convert-points"
                      >
                        {convertMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Converting...</>
                        ) : (
                          <><ArrowRightLeft className="h-4 w-4 mr-2" /> Convert to Cash</>
                        )}
                      </Button>
                    </div>

                    {isPro && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <h4 className="font-oswald text-sm mb-2 flex items-center gap-2">
                            <CircleDollarSign className="h-4 w-4" /> Request Payout
                          </h4>
                          <p className="font-roboto text-xs text-muted-foreground mb-3">
                            Cash balance will be sent to your connected payment account.
                            Min payout: ${((configData?.conversionRate.minimumPayoutCents || 5000) / 100).toFixed(2)}
                          </p>
                          <Button
                            variant="outline"
                            className="w-full font-oswald"
                            disabled={
                              cashBalanceCents < (configData?.conversionRate.minimumPayoutCents || 5000) ||
                              payoutMutation.isPending
                            }
                            onClick={() => payoutMutation.mutate()}
                            data-testid="button-request-payout"
                          >
                            {payoutMutation.isPending ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                            ) : (
                              <><DollarSign className="h-4 w-4 mr-2" /> Request Payout (${(cashBalanceCents / 100).toFixed(2)})</>
                            )}
                          </Button>
                        </div>
                      </>
                    )}

                    {!isPro && (
                      <div className="mt-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <p className="font-oswald text-sm flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-600" /> Unlock Cash Payouts
                        </p>
                        <p className="font-roboto text-xs text-muted-foreground">
                          Refer {proThreshold} users to upgrade to Pro mode and request cash payouts via Stripe Connect.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      {walletLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
                        </div>
                      ) : (walletData?.transactions?.length || 0) === 0 ? (
                        <div className="text-center py-8 text-muted-foreground font-roboto">
                          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No transactions yet</p>
                          <p className="text-sm">Start earning points to see your wallet activity</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {walletData?.transactions.map((tx) => {
                            const config = txTypeLabels[tx.type] || txTypeLabels.points_earned;
                            const TxIcon = config.icon;
                            return (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                                data-testid={`tx-${tx.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <TxIcon className={`h-4 w-4 ${config.color}`} />
                                  <div>
                                    <p className="font-roboto text-sm font-medium">{config.label}</p>
                                    <p className="font-roboto text-xs text-muted-foreground">
                                      {tx.description}
                                      {tx.createdAt && ` · ${format(new Date(tx.createdAt), "MMM d")}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {(tx.pointsAmount || 0) !== 0 && (
                                    <p className={`font-roboto text-sm font-medium ${(tx.pointsAmount || 0) > 0 ? "text-green-600" : "text-orange-600"}`}>
                                      {(tx.pointsAmount || 0) > 0 ? "+" : ""}{tx.pointsAmount} pts
                                    </p>
                                  )}
                                  {(tx.cashAmountCents || 0) !== 0 && (
                                    <p className={`font-roboto text-sm font-medium ${(tx.cashAmountCents || 0) > 0 ? "text-emerald-600" : "text-red-600"}`}>
                                      {(tx.cashAmountCents || 0) > 0 ? "+" : ""}${((tx.cashAmountCents || 0) / 100).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="network">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Network className="h-5 w-5 text-muted-foreground" />
                      Two-Tier Network
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      Earn {configData?.conversionRate.tier2CommissionPercent || 10}% bonus from your sub-affiliates' points
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-lys-teal/10 to-lys-yellow/10 border border-lys-teal/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-oswald text-sm">Your Tier-2 Earnings</span>
                        <span className="font-roboto text-xl font-bold text-lys-teal">
                          {(tier2Data?.parentAffiliate.tier2EarningsTotal || 0).toLocaleString()} pts
                        </span>
                      </div>
                      <p className="font-roboto text-xs text-muted-foreground">
                        When someone joins using your tier-2 invite link, you earn {configData?.conversionRate.tier2CommissionPercent || 10}% of their points automatically.
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="font-roboto text-sm text-muted-foreground mb-1 block">Tier-2 Invite Link</label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={tier2Data?.tier2InviteLink || "Loading..."}
                          className="text-xs font-roboto"
                          data-testid="input-tier2-link"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyTier2Link}
                          data-testid="button-copy-tier2"
                        >
                          {tier2Copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <p className="font-roboto text-xs text-muted-foreground">
                      Share this link with other educators. When they sign up and start earning, you get a {configData?.conversionRate.tier2CommissionPercent || 10}% bonus on everything they earn.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      Sub-Affiliates ({tier2Data?.subAffiliates.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {(tier2Data?.subAffiliates.length || 0) === 0 ? (
                        <div className="text-center py-8 text-muted-foreground font-roboto">
                          <Network className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No sub-affiliates yet</p>
                          <p className="text-sm">Share your tier-2 invite link to build your network</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tier2Data?.subAffiliates.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                              data-testid={`sub-affiliate-${sub.id}`}
                            >
                              <div>
                                <p className="font-roboto text-sm font-medium">{sub.displayName || "Unnamed Affiliate"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px]">{sub.referralCode}</Badge>
                                  {sub.affiliateMode === "pro" && (
                                    <Badge className="bg-amber-500/20 text-amber-600 text-[10px]">
                                      <Crown className="w-2 h-2 mr-0.5" /> Pro
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-roboto text-sm font-medium">{sub.totalPoints} pts</p>
                                <p className="font-roboto text-xs text-muted-foreground">{sub.totalReferrals} referrals</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="font-oswald flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    External Integrations
                  </CardTitle>
                  <CardDescription className="font-roboto">
                    Connected affiliate platforms and payment providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { name: "Rewardful", key: "rewardful" as const, desc: "Sales tracking & commissions" },
                      { name: "PartnerStack", key: "partnerstack" as const, desc: "Partner ecosystem management" },
                      { name: "Stripe Connect", key: "stripeConnect" as const, desc: "Cash payouts & transfers" },
                    ].map((integration) => {
                      const status = configData?.integrations[integration.key];
                      const isConnected = status?.configured;
                      return (
                        <div
                          key={integration.key}
                          className={`p-4 rounded-lg border-2 ${isConnected ? "border-green-500/30 bg-green-500/5" : "border-muted bg-muted/30"}`}
                          data-testid={`integration-${integration.key}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-oswald text-sm font-medium">{integration.name}</span>
                            <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
                              {isConnected ? "Connected" : "Demo"}
                            </Badge>
                          </div>
                          <p className="font-roboto text-xs text-muted-foreground">{integration.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promo">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                      Generate Promo Pack
                    </CardTitle>
                    <CardDescription className="font-roboto">
                      AI creates a branded image and social media caption with your referral link
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="font-roboto text-sm text-muted-foreground mb-1 block">
                          Course/Topic Name (optional)
                        </label>
                        <Input
                          value={promoCourseName}
                          onChange={(e) => setPromoCourseName(e.target.value)}
                          placeholder="e.g., Texas Tech Engineering Prep Course"
                          data-testid="input-promo-course"
                        />
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-lys-red to-lys-yellow text-white font-oswald"
                        disabled={promoMutation.isPending}
                        onClick={() => promoMutation.mutate(promoCourseName || "")}
                        data-testid="button-generate-promo"
                      >
                        {promoMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" /> Generate Promo Pack</>
                        )}
                      </Button>
                      <p className="font-roboto text-xs text-muted-foreground text-center">
                        Generates a LinkedIn-sized promotional image and caption using AI
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-oswald flex items-center gap-2">
                      <Image className="h-5 w-5 text-muted-foreground" />
                      Your Promo Assets ({promos?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      {(promos?.length || 0) === 0 ? (
                        <div className="text-center py-8 text-muted-foreground font-roboto">
                          <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No promo assets yet</p>
                          <p className="text-sm">Generate your first promo pack to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {promos?.map((promo) => (
                            <div
                              key={promo.id}
                              className="p-4 rounded-lg border bg-muted/30"
                              data-testid={`promo-${promo.id}`}
                            >
                              {promo.imageUrl && (
                                <div className="mb-3 rounded-md overflow-hidden">
                                  <img
                                    src={promo.imageUrl}
                                    alt={promo.courseName || "Promo"}
                                    className="w-full h-32 object-cover"
                                  />
                                </div>
                              )}
                              <p className="font-oswald text-sm mb-1">{promo.courseName}</p>
                              <p className="font-roboto text-xs text-muted-foreground mb-3 line-clamp-3">
                                {promo.caption}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const fullCaption = `${promo.caption}\n\n${promo.referralLink}`;
                                    await navigator.clipboard.writeText(fullCaption);
                                    toast({ title: "Caption Copied!" });
                                  }}
                                  data-testid={`button-copy-caption-${promo.id}`}
                                >
                                  <Copy className="h-3 w-3 mr-1" /> Caption
                                </Button>
                                {promo.imageUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <a href={promo.imageUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-download-image-${promo.id}`}>
                                      <Download className="h-3 w-3 mr-1" /> Image
                                    </a>
                                  </Button>
                                )}
                              </div>
                              <p className="font-roboto text-[10px] text-muted-foreground mt-2">
                                {promo.status === "text_only" && "Image generation unavailable — caption only"}
                                {promo.createdAt && ` · ${format(new Date(promo.createdAt), "MMM d, yyyy")}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-oswald text-xl mb-2">Start Earning Rewards</h2>
            <p className="font-roboto text-muted-foreground mb-6">
              Share your lessons with other educators and earn points!
            </p>
            <Button
              className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald"
              onClick={() => window.location.href = "/my-lessons"}
              data-testid="button-go-to-lessons"
            >
              Go to My Lessons
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
