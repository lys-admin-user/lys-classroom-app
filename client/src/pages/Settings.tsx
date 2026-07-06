import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Settings as SettingsIcon, User, Crown, Loader2, Shield, Building2, Users as UsersIcon, ChevronRight, CreditCard, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useViewAs } from "@/hooks/use-view-as";
import { hasMinRole } from "@/components/AppSidebar";
import { PLAN_PRICES, SEAT_PRICES, SEAT_MINIMUMS, ENTERPRISE_PER_CAMPUS_PRICE } from "@/lib/pricing";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EducatorProfileForm from "@/components/EducatorProfileForm";
import ProfileTierSitemap from "@/components/ProfileTierSitemap";
import { NotificationSettings } from "@/components/NotificationSettings";
import { MfaSettingsCard } from "@/components/MfaSettingsCard";
import type { EducatorProfile } from "@shared/schema";

function BillingCard({ tier }: { tier: string }) {
  const { toast } = useToast();
  const isPaid = ["pro", "paid", "campus", "enterprise"].includes(tier);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/cancel", {});
      return res.json();
    },
    onSuccess: (data: { message?: string }) => {
      toast({
        title: "Subscription canceled",
        description: data?.message || "Your subscription has been canceled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/educator-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Could not cancel",
        description: "Something went wrong canceling your subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card data-testid="card-billing">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="font-oswald">Billing &amp; Subscription</CardTitle>
            <CardDescription className="font-roboto">
              Manage your plan and recurring billing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-roboto text-sm text-foreground">
                You're on the <span className="font-medium">{tier === "free" ? "Free" : tier}</span> plan.
              </p>
              <p className="text-xs text-muted-foreground font-roboto mt-1">
                {isPaid
                  ? "Canceling is one click — no hoops. You keep access until the end of your paid period, then return to the Free plan."
                  : "Upgrade any time to unlock full features. Free plans are never charged."}
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="outline" data-testid="button-manage-plan">
                {isPaid ? "Change Plan" : "View Plans"}
              </Button>
            </Link>
          </div>

          {isPaid && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="self-start"
                  disabled={cancelMutation.isPending}
                  data-testid="button-cancel-subscription"
                >
                  {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="dialog-cancel-subscription">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-oswald">Cancel your subscription?</AlertDialogTitle>
                  <AlertDialogDescription className="font-roboto">
                    Your subscription will be canceled and you'll keep full access until the
                    end of your current paid period. After that, your account returns to the
                    Free plan. You can resubscribe any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-keep-subscription">Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    data-testid="button-confirm-cancel"
                  >
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentViewCard() {
  const { viewAsStudent, setViewAsStudent } = useViewAs();
  return (
    <Card data-testid="card-student-view">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-lys-teal" />
          <div>
            <CardTitle className="font-oswald">Student View</CardTitle>
            <CardDescription className="font-roboto">
              See the app the way your students do
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <Label htmlFor="toggle-student-view" className="font-roboto text-sm leading-snug">
            Switch your navigation to the student layout. This is just a preview —
            it doesn't change what you're allowed to do, and you can turn it off any time.
          </Label>
          <Switch
            id="toggle-student-view"
            checked={viewAsStudent}
            onCheckedChange={setViewAsStudent}
            data-testid="switch-student-view"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profileData, isLoading: profileLoading } = useQuery<{ profile: EducatorProfile | null; tier: string }>({
    queryKey: ["/api/educator-profile"],
    enabled: isAuthenticated,
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-oswald font-semibold tracking-tight text-2xl">Sign In Required</CardTitle>
              <CardDescription className="font-roboto">
                Please sign in to access your settings and educator profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => setLocation("/")} data-testid="button-go-home">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tier = profileData?.tier || "free";
  const profile = profileData?.profile;
  const userRole = user?.role || "student";

  // Role-aware administration shortcuts. Admins manage their org from dedicated
  // pages; Settings links out to them rather than duplicating those controls.
  const adminLinks: { label: string; description: string; href: string; icon: typeof Shield }[] = [];
  if (hasMinRole(userRole, "campus_admin")) {
    adminLinks.push({ label: "Campus Admin", description: "Manage your campus, staff, and settings", href: "/admin", icon: Shield });
    adminLinks.push({ label: "Standards Catalog", description: "Review the standards used on your campus", href: "/admin/standards", icon: SettingsIcon });
  }
  if (hasMinRole(userRole, "district_admin")) {
    adminLinks.push({ label: "District / Network Admin", description: "Oversee campuses and district-wide settings", href: "/district-admin", icon: Building2 });
    adminLinks.push({ label: "Campuses", description: "Manage the campuses in your network", href: "/district-admin/campuses", icon: Building2 });
  }
  if (hasMinRole(userRole, "site_admin")) {
    adminLinks.push({ label: "System Administration", description: "Platform-wide controls and configuration", href: "/system-admin", icon: SettingsIcon });
    adminLinks.push({ label: "Manage Users", description: "Add, edit, and assign roles to users", href: "/system-admin/users", icon: UsersIcon });
  }

  const tierColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-lys-yellow/20 text-lys-yellow",
    paid: "bg-lys-yellow/20 text-lys-yellow",
    campus: "bg-lys-teal/20 text-lys-teal",
    enterprise: "bg-lys-red/20 text-lys-red",
  };

  const tierLabels: Record<string, string> = {
    free: "Free Plan",
    pro: "Pro",
    paid: "Pro",
    campus: "Campus",
    enterprise: "Enterprise",
  };

  const tierDescriptions: Record<string, string> = {
    free: "Basic access to core features with limited usage.",
    pro: "Full features for individual educators.",
    paid: "Full features for individual educators.",
    campus: `Single-campus license — $${PLAN_PRICES.campus}/mo base + $${SEAT_PRICES.campus}/seat/mo per Pro educator (${SEAT_MINIMUMS.campus} seat minimum).`,
    enterprise: `Multi-campus/district plan — $${PLAN_PRICES.enterprise}/mo base + $${SEAT_PRICES.enterprise}/seat/mo per Pro educator (${SEAT_MINIMUMS.enterprise} seat minimum) + $${ENTERPRISE_PER_CAMPUS_PRICE}/mo per campus for each campus admin.`,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl text-foreground">
                Settings
              </h1>
              <p className="font-roboto text-muted-foreground">
                Manage your account and educator preferences
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="font-oswald">Account</CardTitle>
                    <CardDescription className="font-roboto">
                      {user?.email || "Your account details"}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={tierColors[tier]} data-testid="badge-tier">
                  <Crown className="h-3 w-3 mr-1" />
                  {tierLabels[tier]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {user?.firstName && user?.lastName 
                        ? `Signed in as ${user.firstName} ${user.lastName}`
                        : "Welcome to LYS!"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-roboto" data-testid="text-tier-description">
                  {tierDescriptions[tier]}
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <BillingCard tier={tier} />

          <Separator />

          <ProfileTierSitemap />

          <Separator />

          <NotificationSettings />

          {hasMinRole(userRole, "educator") && (
            <>
              <Separator />
              <StudentViewCard />
            </>
          )}

          <Separator />

          <EducatorProfileForm 
            existingProfile={profile}
            isOnboarding={!profile}
          />

          <Separator />
          <MfaSettingsCard />

          {adminLinks.length > 0 && (
            <>
              <Separator />
              <Card data-testid="card-admin-settings">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-lys-teal" />
                    <div>
                      <CardTitle className="font-oswald">Administration</CardTitle>
                      <CardDescription className="font-roboto">
                        Manage your organization from these tools
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {adminLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link key={link.href} href={link.href}>
                          <div
                            className="flex items-center gap-3 rounded-md border p-3 hover-elevate active-elevate-2 cursor-pointer"
                            data-testid={`link-admin-${link.href.replace(/\//g, "-")}`}
                          >
                            <Icon className="h-5 w-5 text-lys-teal shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-oswald text-sm">{link.label}</p>
                              <p className="text-xs text-muted-foreground font-roboto truncate">
                                {link.description}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
