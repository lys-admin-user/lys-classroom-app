import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  Shield, Building2, Users, Trash2, BarChart3, AlertTriangle, Loader2, 
  TrendingUp, CreditCard, Share2, BookOpen, Target, UserCheck, 
  Eye, Edit2, Search, ChevronRight, Map, GraduationCap, DollarSign,
  Activity, Globe, FileText, Award, Zap, ExternalLink, UserCog, Library, Plus,
  Server, Database, Cpu, HardDrive, Wifi, Lock, Monitor, Code2, Layers, Check
} from "lucide-react";
import type { Organization, User as UserType, Lesson } from "@shared/schema";

interface Analytics {
  users: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    byTier: { free: number; pro: number; campus: number; enterprise: number };
    byRole: { student: number; educator: number; campus_admin: number };
  };
  content: {
    totalLessons: number;
    totalGoals: number;
  };
  organizations: {
    total: number;
    active: number;
    byType: { school: number; district: number; university: number };
  };
  affiliates: {
    total: number;
    active: number;
    totalPoints: number;
    totalReferrals: number;
    totalViews: number;
    totalShares: number;
  };
}

interface SitemapSection {
  name: string;
  path: string;
  description: string;
  count?: number;
}

interface Sitemap {
  platform: {
    name: string;
    sections: SitemapSection[];
  };
  organizations: { id: string; name: string; type: string; status: string; tier: string }[];
}

interface EnrichedAffiliate {
  id: string;
  userId: string;
  referralCode: string;
  displayName: string | null;
  totalPoints: number | null;
  totalViews: number | null;
  totalShares: number | null;
  totalReferrals: number | null;
  isActive: boolean | null;
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null } | null;
}

interface BillingData {
  stats: {
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    totalProUsers: number;
    totalCampusUsers: number;
    totalEnterpriseUsers: number;
    usersWithStripe: number;
  };
  recentUpgrades: { id: string; email: string | null; name: string; tier: string | null; updatedAt: Date | null }[];
}

export default function SystemAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userTierFilter, setUserTierFilter] = useState<string>("all");
  const [lessonSearch, setLessonSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<Partial<UserType>>({});
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: "", firstName: "", lastName: "", role: "student", tier: "free" });
  const [editPricingOpen, setEditPricingOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<{ tierId: string; name: string; basePrice: number; period: string; description: string; isActive: boolean } | null>(null);
  const [addJurisdictionOpen, setAddJurisdictionOpen] = useState(false);
  const [newJurisdiction, setNewJurisdiction] = useState({ country: 'United States', name: '', abbreviation: '', standardsName: '' });

  const { data: adminCheck, isLoading: checkLoading } = useQuery<{ isSiteAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: adminCheck?.isSiteAdmin,
    refetchInterval: 30000,
  });

  const { data: sitemap } = useQuery<Sitemap>({
    queryKey: ["/api/admin/sitemap"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: UserType[]; total: number }>({
    queryKey: ["/api/admin/users", userSearch, userRoleFilter, userTierFilter],
    enabled: adminCheck?.isSiteAdmin && activeTab === "users",
  });

  const { data: affiliates = [], isLoading: affiliatesLoading } = useQuery<EnrichedAffiliate[]>({
    queryKey: ["/api/admin/affiliates"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "affiliates",
  });

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery<{ lessons: (Lesson & { author?: string; authorEmail?: string })[]; total: number }>({
    queryKey: ["/api/admin/lessons", lessonSearch],
    enabled: adminCheck?.isSiteAdmin && activeTab === "content",
  });

  const { data: billingData } = useQuery<BillingData>({
    queryKey: ["/api/admin/billing"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "billing",
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: adminCheck?.isSiteAdmin,
  });

  interface PricingTierData {
    id: string;
    tierId: string;
    name: string;
    basePrice: number;
    period: string;
    description: string | null;
    features: string[];
    isActive: boolean | null;
    maxStudentsPerClass: number | null;
    maxAiLessons: number | null;
    includesAds: boolean | null;
    updatedAt: string | null;
    updatedBy: string | null;
  }

  const { data: pricingTiersData = [], isLoading: pricingLoading } = useQuery<PricingTierData[]>({
    queryKey: ["/api/admin/pricing-tiers"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "billing",
  });

  const updatePricingMutation = useMutation({
    mutationFn: async ({ tierId, updates }: { tierId: string; updates: Partial<PricingTierData> }) => {
      return await apiRequest("PATCH", `/api/admin/pricing-tiers/${tierId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-tiers"] });
      toast({ title: "Pricing updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update pricing", variant: "destructive" });
    },
  });

  const { data: jurisdictions = [], isLoading: jurisdictionsLoading } = useQuery<{
    state: string;
    abbreviation: string;
    standardsName: string;
    source: 'csp' | 'fallback' | 'manual';
  }[]>({
    queryKey: ["/api/standards/states/United States"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "standards",
  });

  const addJurisdictionMutation = useMutation({
    mutationFn: async (data: { country: string; name: string; abbreviation: string; standardsName: string }) => {
      return await apiRequest("POST", "/api/admin/jurisdictions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standards/states/United States"] });
      setAddJurisdictionOpen(false);
      setNewJurisdiction({ country: 'United States', name: '', abbreviation: '', standardsName: '' });
      toast({ title: "Jurisdiction added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add jurisdiction", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserType> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setEditUserOpen(false);
      setSelectedUser(null);
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "User deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; role: string; tier: string }) => {
      return await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      setCreateUserOpen(false);
      setNewUserData({ email: "", firstName: "", lastName: "", role: "student", tier: "free" });
      toast({ title: "User created successfully" });
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Failed to create user", variant: "destructive" });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/admin/users/${id}/impersonate`);
    },
    onSuccess: (data: any) => {
      toast({ title: data.message || "Impersonation started" });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Failed to impersonate user", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      toast({ title: "Lesson deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete lesson", variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sitemap"] });
      toast({ title: "Organization deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete organization", variant: "destructive" });
    },
  });

  if (authLoading || checkLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (!adminCheck?.isSiteAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="font-marker text-xl">Access Denied</CardTitle>
            <CardDescription>
              System Administrator privileges required. Contact a platform administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case "pro": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "campus": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "enterprise": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-lys-red to-lys-red/80 flex items-center justify-center shadow-lg">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
            System-Wide Admin
          </h1>
          <p className="font-roboto text-muted-foreground">
            Platform-wide oversight, all users, billing, and global configuration
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="organizations" className="gap-2" data-testid="tab-organizations">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organizations</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2" data-testid="tab-content">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="gap-2" data-testid="tab-affiliates">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Affiliates</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2" data-testid="tab-billing">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="standards" className="gap-2" data-testid="tab-standards">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Standards</span>
          </TabsTrigger>
          <TabsTrigger value="datasync" className="gap-2" data-testid="tab-datasync">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Data Sync</span>
          </TabsTrigger>
          <TabsTrigger value="techspecs" className="gap-2" data-testid="tab-techspecs">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Technical Specs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-visible">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.users.total || 0}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">+{analytics?.users.newThisWeek || 0} this week</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.organizations.total || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.organizations.active || 0} active
                    </p>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.content.totalLessons || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.content.totalGoals || 0} goals created
                    </p>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.affiliates.active || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.affiliates.totalReferrals || 0} total referrals
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-lys-teal" />
                      User Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Tier</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <span className="text-sm">Free</span>
                          <Badge variant="secondary">{analytics?.users.byTier.free || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-md bg-blue-500/5">
                          <span className="text-sm">Pro</span>
                          <Badge className={getTierColor("pro")}>{analytics?.users.byTier.pro || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-md bg-purple-500/5">
                          <span className="text-sm">Campus</span>
                          <Badge className={getTierColor("campus")}>{analytics?.users.byTier.campus || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-md bg-amber-500/5">
                          <span className="text-sm">Enterprise</span>
                          <Badge className={getTierColor("enterprise")}>{analytics?.users.byTier.enterprise || 0}</Badge>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Role</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Students</span>
                          </div>
                          <span className="font-medium">{analytics?.users.byRole.student || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Educators</span>
                          </div>
                          <span className="font-medium">{analytics?.users.byRole.educator || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Campus Admins</span>
                          </div>
                          <span className="font-medium">{analytics?.users.byRole.campus_admin || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Map className="h-5 w-5 text-lys-teal" />
                      Platform Sitemap
                    </CardTitle>
                    <CardDescription>Quick navigation to all admin sections</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 relative">
                    <ScrollArea className="h-[320px] pr-4" type="always">
                      <div className="space-y-2 pb-2">
                        {sitemap?.platform.sections.map((section, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (section.path.includes("?tab=")) {
                                const tab = section.path.split("?tab=")[1];
                                setActiveTab(tab);
                              } else {
                                setLocation(section.path);
                              }
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate text-left transition-colors"
                            data-testid={`sitemap-link-${section.name.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{section.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {section.count !== undefined && (
                                <Badge variant="secondary">{section.count}</Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="absolute bottom-0 left-0 right-4 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-lys-yellow" />
                    Affiliate Program Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <Activity className="h-6 w-6 mx-auto mb-2 text-lys-teal" />
                      <div className="text-2xl font-bold">{analytics?.affiliates.totalPoints?.toLocaleString() || 0}</div>
                      <p className="text-sm text-muted-foreground">Total Points Earned</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{analytics?.affiliates.totalViews?.toLocaleString() || 0}</div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <Share2 className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold">{analytics?.affiliates.totalShares?.toLocaleString() || 0}</div>
                      <p className="text-sm text-muted-foreground">Total Shares</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{analytics?.affiliates.totalReferrals || 0}</div>
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-role-filter">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="educator">Educator</SelectItem>
                <SelectItem value="campus_admin">Campus Admin</SelectItem>
                <SelectItem value="district_admin">District Admin</SelectItem>
                <SelectItem value="site_admin">Site Admin</SelectItem>
                <SelectItem value="system_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userTierFilter} onValueChange={setUserTierFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-tier-filter">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="campus">Campus</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateUserOpen(true)} data-testid="button-create-user">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{usersData?.total || 0} users found</p>
              <div className="space-y-2">
                {usersData?.users.map((u) => (
                  <Card key={u.id} className="overflow-visible" data-testid={`card-user-${u.id}`}>
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {u.profileImageUrl ? (
                            <img src={u.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-lg font-medium text-muted-foreground">
                              {(u.firstName?.[0] || "").toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge variant="outline" className="capitalize">{u.role}</Badge>
                        <Badge className={getTierColor(u.tier)}>{u.tier}</Badge>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditUserData({ tier: u.tier, role: u.role, email: u.email, firstName: u.firstName, lastName: u.lastName });
                              setEditUserOpen(true);
                            }}
                            data-testid={`button-edit-user-${u.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => impersonateMutation.mutate(u.id)}
                            disabled={u.id === user?.id}
                            title="Impersonate user"
                            data-testid={`button-impersonate-${u.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                                deleteUserMutation.mutate(u.id);
                              }
                            }}
                            disabled={u.id === user?.id}
                            data-testid={`button-delete-user-${u.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information and permissions</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>First Name</Label>
                    <Input
                      value={editUserData.firstName || ""}
                      onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                      data-testid="input-edit-first-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last Name</Label>
                    <Input
                      value={editUserData.lastName || ""}
                      onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                      data-testid="input-edit-last-name"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    value={editUserData.email || ""}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select value={editUserData.role || "student"} onValueChange={(v: any) => setEditUserData({ ...editUserData, role: v })}>
                      <SelectTrigger data-testid="select-edit-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="educator">Educator</SelectItem>
                        <SelectItem value="campus_admin">Campus Admin</SelectItem>
                        <SelectItem value="district_admin">District Admin</SelectItem>
                        <SelectItem value="site_admin">Site Admin</SelectItem>
                        <SelectItem value="system_admin">System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tier</Label>
                    <Select value={editUserData.tier || "free"} onValueChange={(v: any) => setEditUserData({ ...editUserData, tier: v })}>
                      <SelectTrigger data-testid="select-edit-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="campus">Campus</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => selectedUser && updateUserMutation.mutate({ id: selectedUser.id, updates: editUserData })}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the platform with a specific role and tier</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>First Name</Label>
                    <Input
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      data-testid="input-create-first-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last Name</Label>
                    <Input
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      data-testid="input-create-last-name"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="user@example.com"
                    data-testid="input-create-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select value={newUserData.role} onValueChange={(v) => setNewUserData({ ...newUserData, role: v })}>
                      <SelectTrigger data-testid="select-create-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="educator">Educator</SelectItem>
                        <SelectItem value="campus_admin">Campus Admin</SelectItem>
                        <SelectItem value="district_admin">District Admin</SelectItem>
                        <SelectItem value="site_admin">Site Admin</SelectItem>
                        <SelectItem value="system_admin">System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tier</Label>
                    <Select value={newUserData.tier} onValueChange={(v) => setNewUserData({ ...newUserData, tier: v })}>
                      <SelectTrigger data-testid="select-create-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="campus">Campus</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => createUserMutation.mutate(newUserData)}
                  disabled={createUserMutation.isPending || !newUserData.email || !newUserData.firstName || !newUserData.lastName}
                  data-testid="button-submit-create-user"
                >
                  {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Organizations</h2>
            <Button onClick={() => setLocation("/admin")} data-testid="button-manage-orgs">
              Manage in Site Admin
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No organizations yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {organizations.map((org) => (
                <Card key={org.id} className="overflow-visible" data-testid={`card-org-${org.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-lys-teal/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-lys-teal" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription>/{org.slug}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>{org.status}</Badge>
                      <Badge variant="outline" className="capitalize">{org.type}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this organization?")) {
                            deleteOrgMutation.mutate(org.id);
                          }
                        }}
                        data-testid={`button-delete-org-${org.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-lessons"
              />
            </div>
          </div>

          {lessonsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{lessonsData?.total || 0} lessons found</p>
              <div className="space-y-2">
                {lessonsData?.lessons.map((lesson) => (
                  <Card key={lesson.id} className="overflow-visible" data-testid={`card-lesson-${lesson.id}`}>
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            by {lesson.author || "Unknown"} - {lesson.gradeLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lesson.bkdFocus}</Badge>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this lesson?")) {
                              deleteLessonMutation.mutate(lesson.id);
                            }
                          }}
                          data-testid={`button-delete-lesson-${lesson.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Affiliate Program</h2>
          </div>

          {affiliatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : affiliates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No affiliates yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {affiliates.map((affiliate) => (
                <Card key={affiliate.id} className="overflow-visible" data-testid={`card-affiliate-${affiliate.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-lys-yellow/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-lys-yellow" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {affiliate.user?.firstName} {affiliate.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">{affiliate.referralCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-center">
                          <p className="text-lg font-bold">{affiliate.totalPoints || 0}</p>
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{affiliate.totalReferrals || 0}</p>
                          <p className="text-xs text-muted-foreground">Referrals</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{affiliate.totalShares || 0}</p>
                          <p className="text-xs text-muted-foreground">Shares</p>
                        </div>
                        <Badge variant={affiliate.isActive ? "default" : "secondary"}>
                          {affiliate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Billing & Subscriptions</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{billingData?.stats.activeSubscriptions || 0}</div>
              </CardContent>
            </Card>
            <Card className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingData?.stats.totalProUsers || 0}</div>
              </CardContent>
            </Card>
            <Card className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-sm font-medium">Stripe Connected</CardTitle>
                <Globe className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{billingData?.stats.usersWithStripe || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Upgrades</CardTitle>
              <CardDescription>Users who recently upgraded their subscription</CardDescription>
            </CardHeader>
            <CardContent>
              {billingData?.recentUpgrades && billingData.recentUpgrades.length > 0 ? (
                <div className="space-y-2">
                  {billingData.recentUpgrades.map((upgrade) => (
                    <div key={upgrade.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div>
                        <p className="font-medium">{upgrade.name}</p>
                        <p className="text-sm text-muted-foreground">{upgrade.email}</p>
                      </div>
                      <Badge className={getTierColor(upgrade.tier)}>{upgrade.tier}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent upgrades</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Pricing Tiers</CardTitle>
                <CardDescription>Manage subscription pricing and features</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pricingTiersData.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No pricing tiers configured</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {pricingTiersData.map((tier) => (
                    <div key={tier.tierId} className={`rounded-md border p-4 space-y-3 ${!tier.isActive ? 'opacity-60' : ''}`} data-testid={`card-pricing-${tier.tierId}`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-oswald text-lg font-bold">{tier.name}</h3>
                        {!tier.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                      <div className="text-2xl font-bold">
                        {tier.basePrice === 0 ? 'Free' : `$${(tier.basePrice / 100).toFixed(2)}`}
                        {tier.basePrice > 0 && <span className="text-sm font-normal text-muted-foreground">/{tier.period}</span>}
                      </div>
                      {tier.description && <p className="text-sm text-muted-foreground">{tier.description}</p>}
                      <div className="space-y-1">
                        {tier.features?.slice(0, 3).map((feature, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500 shrink-0" /> {feature}
                          </p>
                        ))}
                        {tier.features && tier.features.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{tier.features.length - 3} more</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs text-muted-foreground">
                        <div>Students: {tier.maxStudentsPerClass ?? 'Unlimited'}</div>
                        <div>AI Lessons: {tier.maxAiLessons ?? 'Unlimited'}</div>
                        <div>Ads: {tier.includesAds ? 'Yes' : 'No'}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        data-testid={`button-edit-pricing-${tier.tierId}`}
                        onClick={() => {
                          setEditingTier({
                            tierId: tier.tierId,
                            name: tier.name,
                            basePrice: tier.basePrice / 100,
                            period: tier.period,
                            description: tier.description || '',
                            isActive: tier.isActive !== false,
                          });
                          setEditPricingOpen(true);
                        }}
                      >
                        Edit Pricing
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={editPricingOpen} onOpenChange={setEditPricingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Pricing Tier</DialogTitle>
                <DialogDescription>Update the pricing and settings for {editingTier?.name}</DialogDescription>
              </DialogHeader>
              {editingTier && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Tier Name</Label>
                    <Input
                      value={editingTier.name}
                      onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                      data-testid="input-pricing-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Price (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingTier.basePrice}
                        onChange={(e) => setEditingTier({ ...editingTier, basePrice: parseFloat(e.target.value) || 0 })}
                        data-testid="input-pricing-price"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Period</Label>
                      <Select value={editingTier.period} onValueChange={(v) => setEditingTier({ ...editingTier, period: v })}>
                        <SelectTrigger data-testid="select-pricing-period">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="lifetime">Lifetime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input
                      value={editingTier.description}
                      onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                      placeholder="Brief description"
                      data-testid="input-pricing-description"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={editingTier.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditingTier({ ...editingTier, isActive: !editingTier.isActive })}
                      data-testid="button-pricing-active-toggle"
                    >
                      {editingTier.isActive ? 'Active' : 'Inactive'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {editingTier.isActive ? 'Tier is visible to users' : 'Tier is hidden from users'}
                    </span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPricingOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (editingTier) {
                      updatePricingMutation.mutate({
                        tierId: editingTier.tierId,
                        updates: {
                          name: editingTier.name,
                          basePrice: Math.round(editingTier.basePrice * 100),
                          period: editingTier.period,
                          description: editingTier.description || null,
                          isActive: editingTier.isActive,
                        },
                      });
                      setEditPricingOpen(false);
                    }
                  }}
                  disabled={updatePricingMutation.isPending}
                  data-testid="button-save-pricing"
                >
                  {updatePricingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Educational Standards & Jurisdictions</h2>
            <Dialog open={addJurisdictionOpen} onOpenChange={setAddJurisdictionOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-jurisdiction">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Jurisdiction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Jurisdiction</DialogTitle>
                  <DialogDescription>
                    Add a new state or jurisdiction for educational standards. This will be available in the lesson generator.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="j-country">Country</Label>
                    <Select 
                      value={newJurisdiction.country} 
                      onValueChange={(v) => setNewJurisdiction({ ...newJurisdiction, country: v })}
                    >
                      <SelectTrigger id="j-country" data-testid="select-jurisdiction-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="j-name">State/Region Name</Label>
                    <Input 
                      id="j-name"
                      value={newJurisdiction.name}
                      onChange={(e) => setNewJurisdiction({ ...newJurisdiction, name: e.target.value })}
                      placeholder="e.g. California"
                      data-testid="input-jurisdiction-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="j-abbr">Abbreviation</Label>
                    <Input 
                      id="j-abbr"
                      value={newJurisdiction.abbreviation}
                      onChange={(e) => setNewJurisdiction({ ...newJurisdiction, abbreviation: e.target.value.toUpperCase() })}
                      placeholder="e.g. CA"
                      maxLength={3}
                      data-testid="input-jurisdiction-abbreviation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="j-standards">Standards Name</Label>
                    <Input 
                      id="j-standards"
                      value={newJurisdiction.standardsName}
                      onChange={(e) => setNewJurisdiction({ ...newJurisdiction, standardsName: e.target.value })}
                      placeholder="e.g. California Standards, CCSS"
                      data-testid="input-jurisdiction-standards-name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddJurisdictionOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => addJurisdictionMutation.mutate(newJurisdiction)}
                    disabled={!newJurisdiction.name || !newJurisdiction.abbreviation || addJurisdictionMutation.isPending}
                    data-testid="button-confirm-add-jurisdiction"
                  >
                    {addJurisdictionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Jurisdiction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-lys-teal" />
                US States & Jurisdictions
              </CardTitle>
              <CardDescription>
                States with educational standards available for lesson generation. 
                "CSP" indicates data from Common Standards Project, "Fallback" uses built-in standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jurisdictionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {jurisdictions.map((j) => (
                      <div 
                        key={j.abbreviation} 
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate"
                        data-testid={`jurisdiction-${j.abbreviation}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{j.state}</span>
                            <Badge variant="outline" className="text-xs">{j.abbreviation}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{j.standardsName}</p>
                        </div>
                        <Badge 
                          variant={j.source === 'csp' ? 'default' : j.source === 'manual' ? 'outline' : 'secondary'} 
                          className="ml-2 text-xs"
                        >
                          {j.source === 'csp' ? 'CSP' : j.source === 'manual' ? 'Manual' : 'Fallback'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Missing States</CardTitle>
              <CardDescription>
                These US states are not yet in the system. Click "Add Jurisdiction" above to manually add them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
                const stateNames: Record<string, string> = {
                  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
                  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
                  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
                  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
                  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
                  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
                  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
                  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
                  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
                  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
                  'DC': 'District of Columbia'
                };
                const presentAbbrs = new Set(jurisdictions.map(j => j.abbreviation));
                const missing = allStates.filter(a => !presentAbbrs.has(a));
                
                if (missing.length === 0) {
                  return <p className="text-center text-muted-foreground py-4">All US states are covered!</p>;
                }
                
                return (
                  <div className="flex flex-wrap gap-2">
                    {missing.map(abbr => (
                      <Badge key={abbr} variant="outline" className="text-xs">
                        {stateNames[abbr]} ({abbr})
                      </Badge>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datasync" className="space-y-6">
          <BlsSyncSection />
        </TabsContent>

        <TabsContent value="techspecs" className="space-y-6">
          <TechnicalSpecsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SpecSection {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: string }[];
}

function TechnicalSpecsSection() {
  const platformArchitecture: SpecSection[] = [
    {
      icon: Code2,
      title: "Frontend Stack",
      items: [
        { label: "Framework", value: "React 18 with TypeScript" },
        { label: "Build Tool", value: "Vite 5.x with HMR" },
        { label: "Routing", value: "Wouter (lightweight SPA router)" },
        { label: "State Management", value: "TanStack React Query v5 (server state)" },
        { label: "UI Components", value: "shadcn/ui built on Radix UI primitives" },
        { label: "Styling", value: "Tailwind CSS with custom design tokens" },
        { label: "Forms", value: "React Hook Form with Zod validation" },
        { label: "Icons", value: "Lucide React, React Icons" },
        { label: "Typography", value: "Permanent Marker (headers), Oswald (subheaders), Roboto (body)" },
        { label: "Dark Mode", value: "Class-based toggle with CSS custom properties" },
      ],
    },
    {
      icon: Server,
      title: "Backend Stack",
      items: [
        { label: "Runtime", value: "Node.js with TypeScript (tsx)" },
        { label: "Framework", value: "Express.js with RESTful JSON API" },
        { label: "API Prefix", value: "/api for all endpoints" },
        { label: "Validation", value: "Zod schemas (shared between client and server)" },
        { label: "Authentication", value: "Replit Auth (Google, GitHub, email) with express-session" },
        { label: "Session Store", value: "PostgreSQL-backed via connect-pg-simple" },
        { label: "File Uploads", value: "Multer with in-memory storage (10MB limit)" },
        { label: "Real-Time", value: "WebSocket server for collaboration, presence, and chat" },
      ],
    },
    {
      icon: Database,
      title: "Data Layer",
      items: [
        { label: "Database", value: "PostgreSQL (Neon-backed)" },
        { label: "ORM", value: "Drizzle ORM with drizzle-zod for schema-to-validation" },
        { label: "Schema Location", value: "shared/schema.ts (monorepo shared types)" },
        { label: "Migrations", value: "Drizzle Kit with push strategy" },
        { label: "Tables", value: "50+ tables covering users, lessons, organizations, standards, careers, portfolios, gradebook, and more" },
        { label: "Session Storage", value: "PostgreSQL sessions table with TTL index" },
        { label: "Caching", value: "Database-backed lesson plan cache with 30-day TTL and SHA-256 keys" },
      ],
    },
    {
      icon: Zap,
      title: "AI Integration",
      items: [
        { label: "Provider", value: "OpenAI API (GPT-4o)" },
        { label: "Lesson Generation", value: "AI lesson plans with rubric alignment and standards mapping" },
        { label: "PD Recommendations", value: "Personalized professional development suggestions" },
        { label: "Standards Extraction", value: "LLM-powered extraction from documents with human review" },
        { label: "Assignment Generation", value: "AI assignments aligned with lesson objectives and BKD methodology" },
        { label: "Fallback", value: "Mock data generation when API key unavailable" },
        { label: "Response Format", value: "JSON structured output with Zod validation" },
      ],
    },
    {
      icon: Globe,
      title: "External Integrations",
      items: [
        { label: "HubSpot CRM", value: "Contact, company, and deal sync via Replit connector" },
        { label: "BLS Data", value: "Weekly automated sync with Bureau of Labor Statistics occupational data" },
        { label: "CSP Standards", value: "Standards ingestion from Common Standards Project API" },
        { label: "SIS Providers", value: "Clever, PowerSchool, Canvas LMS, Infinite Campus, Skyward, OneRoster" },
        { label: "WordPress", value: "Full site embed via plugin with 22+ embeddable widgets" },
        { label: "Payment", value: "Stripe integration (planned) via Replit connector" },
      ],
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      items: [
        { label: "Input Validation", value: "Server-side Zod validation on all endpoints" },
        { label: "Ownership Checks", value: "User-scoped data access with server-side ID regeneration" },
        { label: "COPPA Compliance", value: "Grade-level ad restriction (K-7 never see ads)" },
        { label: "Session Security", value: "HTTP-only cookies, secure in production, 30-day max age" },
        { label: "RBAC", value: "Role-based access: student, educator, campus_admin, district_admin, site_admin, system_admin" },
        { label: "Secrets Management", value: "Replit secrets store for API keys and credentials" },
      ],
    },
    {
      icon: Layers,
      title: "Architecture Patterns",
      items: [
        { label: "Monorepo", value: "/client (frontend), /server (backend), /shared (common types)" },
        { label: "Multi-Tenancy", value: "Organization hierarchy with Country > State > District > School > Class" },
        { label: "Governance Models", value: "Bottom-heavy (US), Top-down unitary (centralized), Federal hybrid" },
        { label: "Tier System", value: "Free (ad-supported), Pro, Campus, Enterprise with feature gating" },
        { label: "Be-Know-Do Framework", value: "Three-pillar methodology: Being (identity), Knowing (career), Doing (action)" },
        { label: "Affiliate System", value: "Referral codes, social sharing, point-based educator rewards" },
        { label: "Ad Monetization", value: "IAB standard sizes, sponsor categories, eCPM $8-15 range, tier-aware rendering" },
        { label: "Global Pricing", value: "Country Affordability Index (CAI) across 120+ countries" },
      ],
    },
  ];

  const hardwareRequirements = [
    {
      tier: "Development / Small Deployment",
      description: "Suitable for development, testing, or a single school with up to 500 users.",
      icon: Monitor,
      specs: [
        { label: "CPU", value: "2 vCPUs (x86-64 or ARM64)" },
        { label: "RAM", value: "4 GB minimum" },
        { label: "Storage", value: "20 GB SSD (OS + application)" },
        { label: "Database Storage", value: "5 GB PostgreSQL" },
        { label: "Network", value: "100 Mbps with public IP or load balancer" },
        { label: "OS", value: "Linux (NixOS, Ubuntu 22.04+, Debian 12+)" },
      ],
    },
    {
      tier: "Campus Deployment",
      description: "Single campus or small district with 500-5,000 concurrent users.",
      icon: Building2,
      specs: [
        { label: "CPU", value: "4 vCPUs (x86-64)" },
        { label: "RAM", value: "8 GB minimum, 16 GB recommended" },
        { label: "Storage", value: "50 GB SSD (OS + application + file uploads)" },
        { label: "Database Storage", value: "20 GB PostgreSQL with automated backups" },
        { label: "Network", value: "500 Mbps with TLS termination" },
        { label: "OS", value: "Linux (Ubuntu 22.04 LTS or NixOS)" },
        { label: "CDN", value: "Recommended for static asset delivery" },
      ],
    },
    {
      tier: "District Deployment",
      description: "Multi-campus district with 5,000-50,000 concurrent users.",
      icon: Globe,
      specs: [
        { label: "CPU", value: "8+ vCPUs across 2-4 application instances" },
        { label: "RAM", value: "32 GB total across instances (8 GB per node)" },
        { label: "Storage", value: "100 GB SSD per instance + shared file storage" },
        { label: "Database", value: "Managed PostgreSQL with 50 GB, read replicas, point-in-time recovery" },
        { label: "Network", value: "1 Gbps with load balancer, TLS, and DDoS protection" },
        { label: "OS", value: "Linux with container orchestration (Docker/Kubernetes)" },
        { label: "CDN", value: "Required for global asset delivery" },
        { label: "Redis", value: "Recommended for session cache and rate limiting" },
      ],
    },
    {
      tier: "Enterprise / State-Level",
      description: "State-wide or national deployment with 50,000+ concurrent users.",
      icon: Server,
      specs: [
        { label: "CPU", value: "16+ vCPUs across 4-8+ auto-scaling application instances" },
        { label: "RAM", value: "64 GB+ total (16 GB per node minimum)" },
        { label: "Storage", value: "500 GB+ SSD with object storage for file uploads" },
        { label: "Database", value: "Managed PostgreSQL cluster: 200 GB+, multi-AZ, read replicas, automated failover" },
        { label: "Network", value: "10 Gbps backbone, global load balancing, WAF, DDoS protection" },
        { label: "OS", value: "Linux with Kubernetes orchestration and auto-scaling" },
        { label: "CDN", value: "Multi-region CDN with edge caching" },
        { label: "Redis", value: "Redis cluster for sessions, rate limiting, and pub/sub" },
        { label: "Monitoring", value: "APM, log aggregation, uptime monitoring, alerting" },
        { label: "Backup", value: "Cross-region database replication, 30-day retention, RPO < 1 hour" },
      ],
    },
  ];

  const softwareDependencies = [
    { label: "Node.js", value: "v20.x LTS or later" },
    { label: "PostgreSQL", value: "v15+ (Neon-compatible)" },
    { label: "npm", value: "v9+ (package management)" },
    { label: "TypeScript", value: "v5.x (compile-time type safety)" },
    { label: "OpenAI API Key", value: "Required for AI features (GPT-4o access)" },
    { label: "SMTP Server", value: "Optional, for email notifications" },
    { label: "Stripe Account", value: "Optional, for payment processing" },
    { label: "HubSpot API Key", value: "Optional, for CRM integration" },
  ];

  const networkRequirements = [
    { label: "HTTPS/TLS", value: "Required for all traffic (TLS 1.2+ minimum)" },
    { label: "WebSocket Support", value: "Required for real-time collaboration features" },
    { label: "DNS", value: "A/AAAA records pointing to application server or load balancer" },
    { label: "Ports", value: "443 (HTTPS), 80 (HTTP redirect), 5432 (PostgreSQL internal)" },
    { label: "Firewall", value: "Allow inbound 443, restrict database to internal network only" },
    { label: "CORS", value: "Configured for same-origin; WordPress embeds require specific origins" },
    { label: "Bandwidth", value: "~50 KB per page load (compressed), ~200 KB initial bundle" },
  ];

  return (
    <>
      <div className="mb-4">
        <h2 className="font-oswald text-xl font-semibold">Technical Specifications</h2>
        <p className="text-sm text-muted-foreground font-roboto">
          Complete platform architecture, software dependencies, and hardware requirements for deployment planning.
        </p>
      </div>

      <Card data-testid="card-platform-overview">
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Layers className="h-5 w-5 text-lys-teal" />
            Platform Overview
          </CardTitle>
          <CardDescription>
            LYS (Laddering Your Success) is a full-stack monorepo application built with React and Express.js, 
            powered by PostgreSQL and OpenAI. It runs as a single deployable unit serving both the frontend SPA 
            and backend API on port 5000.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald text-lys-red">50+</p>
              <p className="text-xs text-muted-foreground">Database Tables</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald text-lys-yellow">30+</p>
              <p className="text-xs text-muted-foreground">Pages / Routes</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald text-lys-teal">100+</p>
              <p className="text-xs text-muted-foreground">API Endpoints</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald">6</p>
              <p className="text-xs text-muted-foreground">User Roles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {platformArchitecture.map((section) => {
          const SectionIcon = section.icon;
          return (
            <Card key={section.title} data-testid={`card-spec-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-oswald flex items-center gap-2">
                  <SectionIcon className="h-4 w-4 text-lys-teal" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 text-sm">
                      <span className="text-muted-foreground min-w-[120px] shrink-0">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card data-testid="card-software-dependencies">
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Code2 className="h-5 w-5 text-lys-yellow" />
            Software Dependencies
          </CardTitle>
          <CardDescription>
            Required and optional software for running the LYS platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {softwareDependencies.map((dep) => (
              <div key={dep.label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <span className="font-medium text-sm min-w-[130px]">{dep.label}</span>
                <span className="text-sm text-muted-foreground">{dep.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-network-requirements">
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Wifi className="h-5 w-5 text-lys-teal" />
            Network Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {networkRequirements.map((req) => (
              <div key={req.label} className="flex items-start gap-3 text-sm">
                <span className="text-muted-foreground min-w-[130px] shrink-0">{req.label}</span>
                <span className="font-medium">{req.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-oswald text-lg font-semibold mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-lys-red" />
          Hardware Requirements by Deployment Tier
        </h3>
        <div className="grid lg:grid-cols-2 gap-6">
          {hardwareRequirements.map((tier) => {
            const TierIcon = tier.icon;
            return (
              <Card key={tier.tier} data-testid={`card-hw-${tier.tier.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      <TierIcon className="h-5 w-5 text-lys-red" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-oswald">{tier.tier}</CardTitle>
                      <CardDescription className="text-xs">{tier.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tier.specs.map((spec) => (
                      <div key={spec.label} className="flex items-start gap-3 text-sm">
                        <Badge variant="outline" className="text-[10px] min-w-[70px] justify-center shrink-0">
                          {spec.label}
                        </Badge>
                        <span className="text-muted-foreground">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card data-testid="card-deployment-notes">
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Lock className="h-5 w-5 text-lys-yellow" />
            Deployment Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-oswald font-semibold mb-2 text-sm">Replit Deployment</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Hosted on Replit with built-in PostgreSQL (Neon)</li>
                <li>Automatic TLS and domain management</li>
                <li>Built-in secrets management for API keys</li>
                <li>One-click publishing with health checks</li>
                <li>Automatic scaling based on traffic</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-oswald font-semibold mb-2 text-sm">Self-Hosted Deployment</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Clone repository and configure environment variables</li>
                <li>Run npm install and npm run build</li>
                <li>Configure PostgreSQL connection string (DATABASE_URL)</li>
                <li>Set SESSION_SECRET and OPENAI_API_KEY</li>
                <li>Run npm start on port 5000 behind a reverse proxy</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200 font-roboto">
              For enterprise deployments handling sensitive student data, ensure compliance with FERPA, COPPA, 
              and local data protection regulations. Database encryption at rest and in transit is strongly recommended. 
              Consult your IT security team before deploying in production environments.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

interface BlsSyncStatus {
  lastSync: {
    id: string;
    syncType: string;
    status: string;
    totalOccupations: number | null;
    processedOccupations: number | null;
    updatedOccupations: number | null;
    errorCount: number | null;
    startedAt: string | null;
    completedAt: string | null;
    nextScheduledAt: string | null;
    triggeredBy: string | null;
  } | null;
  scheduler: {
    running: boolean;
    nextCheck: string | null;
  };
}

function BlsSyncSection() {
  const { toast } = useToast();
  
  const { data: syncStatus, isLoading: statusLoading } = useQuery<BlsSyncStatus>({
    queryKey: ["/api/bls-sync/status"],
    refetchInterval: 30000,
  });

  const { data: syncHistory = [], isLoading: historyLoading } = useQuery<BlsSyncStatus["lastSync"][]>({
    queryKey: ["/api/bls-sync/history"],
  });

  const triggerSyncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/bls-sync/trigger");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bls-sync/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bls-sync/history"] });
      toast({ title: "BLS data sync started" });
    },
    onError: () => {
      toast({ title: "Failed to trigger sync", variant: "destructive" });
    },
  });

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-oswald text-xl font-semibold">BLS Occupational Outlook Data</h2>
          <p className="text-sm text-muted-foreground font-roboto">
            Automatic weekly sync with Bureau of Labor Statistics employment projections and wage data
          </p>
        </div>
        <Button
          onClick={() => triggerSyncMutation.mutate()}
          disabled={triggerSyncMutation.isPending}
          data-testid="button-trigger-bls-sync"
        >
          {triggerSyncMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          Sync Now
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-scheduler-status">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={syncStatus?.scheduler.running ? "bg-green-500" : "bg-red-500"}>
                {syncStatus?.scheduler.running ? "Running" : "Stopped"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Weekly auto-sync enabled
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-last-sync">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-oswald">
              {formatDate(syncStatus?.lastSync?.completedAt || syncStatus?.lastSync?.startedAt || null)}
            </p>
            <p className="text-xs text-muted-foreground">
              Status: {syncStatus?.lastSync?.status || "No sync yet"}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-next-sync">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-oswald">
              {formatDate(syncStatus?.lastSync?.nextScheduledAt || null)}
            </p>
            <p className="text-xs text-muted-foreground">
              Runs every 7 days
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-occupations-synced">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Occupations</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-oswald">
              {syncStatus?.lastSync?.processedOccupations || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.lastSync?.updatedOccupations || 0} updated
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Sync History</CardTitle>
          <CardDescription>
            Recent BLS data synchronization operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : syncHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sync history yet. Click "Sync Now" to start the first sync.
            </p>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((sync) => sync && (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`row-sync-${sync.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      className={
                        sync.status === "completed"
                          ? "bg-green-500"
                          : sync.status === "failed"
                          ? "bg-red-500"
                          : sync.status === "in_progress"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }
                    >
                      {sync.status}
                    </Badge>
                    <div>
                      <p className="font-medium font-roboto">
                        {sync.syncType === "full" ? "Full Sync" : sync.syncType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sync.startedAt)}
                        {sync.triggeredBy && ` • Triggered by: ${sync.triggeredBy}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold font-oswald">
                      {sync.processedOccupations}/{sync.totalOccupations}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sync.updatedOccupations} updated
                      {(sync.errorCount || 0) > 0 && (
                        <span className="text-red-500 ml-2">{sync.errorCount} errors</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About BLS Data Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold font-oswald mb-2">Data Sources</h4>
              <ul className="text-sm space-y-1 text-muted-foreground font-roboto">
                <li>• BLS Occupational Employment and Wage Statistics (OEWS)</li>
                <li>• BLS Employment Projections (2023-2033)</li>
                <li>• Occupational Outlook Handbook</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold font-oswald mb-2">Sync Schedule</h4>
              <ul className="text-sm space-y-1 text-muted-foreground font-roboto">
                <li>• Automatic sync every 7 days</li>
                <li>• Updates wage data, job outlook, and projections</li>
                <li>• Manual sync available anytime</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200 font-roboto">
              BLS data is updated annually. The sync fetches the latest available data from the public BLS API 
              and updates career salary and outlook information in the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
