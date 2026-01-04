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
  Activity, Globe, FileText, Award, Zap, ExternalLink, UserCog
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
            System Administration
          </h1>
          <p className="font-roboto text-muted-foreground">
            Complete platform oversight and control
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Map className="h-5 w-5 text-lys-teal" />
                      Platform Sitemap
                    </CardTitle>
                    <CardDescription>Quick navigation to all admin sections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[280px]">
                      <div className="space-y-2">
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
                            className="w-full flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate text-left"
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
