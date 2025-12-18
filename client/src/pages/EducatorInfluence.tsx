import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Link2,
  Gift,
  Clock
} from "lucide-react";
import { SiFacebook, SiLinkedin } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import type { EducatorAffiliate, ReferralEvent, AffiliateReward } from "@shared/schema";
import { format } from "date-fns";

interface DashboardData {
  affiliate: EducatorAffiliate;
  recentEvents: ReferralEvent[];
  rewards: AffiliateReward[];
}

const eventTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
  view: { label: "View", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Eye },
  share: { label: "Share", color: "bg-green-500/10 text-green-600 border-green-200", icon: Share2 },
  copy_link: { label: "Link Copy", color: "bg-purple-500/10 text-purple-600 border-purple-200", icon: Link2 },
  signup: { label: "Signup", color: "bg-lys-red/10 text-lys-red border-lys-red/20", icon: Users },
  lesson_save: { label: "Lesson Save", color: "bg-lys-teal/10 text-lys-teal border-lys-teal/20", icon: BookOpen },
};

export default function EducatorInfluence() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/affiliate/dashboard"],
    enabled: isAuthenticated,
  });

  const handleCopyReferralCode = async () => {
    if (!dashboard?.affiliate.referralCode) return;
    
    try {
      const shareUrl = `${window.location.origin}?ref=${dashboard.affiliate.referralCode}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    }
  };

  const totalPoints = dashboard?.affiliate.totalPoints || 0;

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lys-red to-lys-yellow flex items-center justify-center">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-marker text-3xl md:text-4xl text-foreground" data-testid="text-page-title">
              Educator Influence
            </h1>
            <p className="font-roboto text-muted-foreground">
              Share your lessons and earn rewards when others use them
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
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
                    <p className="font-marker text-2xl text-lys-red">{dashboard.affiliate.referralCode}</p>
                  </div>
                </div>
                <div className="flex gap-2">
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card data-testid="stat-total-points">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lys-yellow/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-lys-yellow" />
                  </div>
                  <div>
                    <p className="font-roboto text-2xl font-bold text-foreground">{totalPoints}</p>
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
                <CardDescription className="font-roboto">
                  Your latest referral events
                </CardDescription>
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
                                  {event.createdAt && ` • ${format(new Date(event.createdAt), "MMM d, h:mm a")}`}
                                </p>
                              </div>
                            </div>
                            {(event.pointsEarned || 0) > 0 && (
                              <Badge variant="secondary" className="font-roboto">
                                +{event.pointsEarned} pts
                              </Badge>
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
                <CardDescription className="font-roboto">
                  Share lessons and grow your influence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-oswald text-sm">Lesson Views</p>
                      <p className="font-roboto text-xs text-muted-foreground">When someone views your shared lesson</p>
                    </div>
                    <Badge className="bg-lys-yellow/20 text-lys-yellow border-lys-yellow/30">+1 pt</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <Share2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-oswald text-sm">Social Shares</p>
                      <p className="font-roboto text-xs text-muted-foreground">Share to Twitter, Facebook, or LinkedIn</p>
                    </div>
                    <Badge className="bg-lys-yellow/20 text-lys-yellow border-lys-yellow/30">+5 pts</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-lys-teal/20 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-lys-teal" />
                    </div>
                    <div className="flex-1">
                      <p className="font-oswald text-sm">Lesson Saves</p>
                      <p className="font-roboto text-xs text-muted-foreground">When someone saves your shared lesson</p>
                    </div>
                    <Badge className="bg-lys-yellow/20 text-lys-yellow border-lys-yellow/30">+25 pts</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-lys-red/20 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-lys-red" />
                    </div>
                    <div className="flex-1">
                      <p className="font-oswald text-sm">New Signups</p>
                      <p className="font-roboto text-xs text-muted-foreground">When someone signs up through your link</p>
                    </div>
                    <Badge className="bg-lys-yellow/20 text-lys-yellow border-lys-yellow/30">+50 pts</Badge>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-md bg-gradient-to-r from-lys-red/10 to-lys-yellow/10 border border-lys-red/20">
                  <p className="font-oswald text-sm mb-1">Coming Soon: Point Redemption</p>
                  <p className="font-roboto text-xs text-muted-foreground">
                    Redeem your points for LYS premium features, exclusive content, and more!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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
