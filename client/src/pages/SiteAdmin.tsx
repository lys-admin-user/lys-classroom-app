import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_PRICES, SEAT_PRICES, SEAT_MINIMUMS } from "@/lib/pricing";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Shield, Building2, Users, Plus, Trash2, Settings, BarChart3, AlertTriangle, Loader2, Flag, Mail, Edit2, ToggleLeft, Percent, TrendingUp, Target, Award, GraduationCap, Star, Brain, Compass, Briefcase, Library, FileText, Clock, Search, UserPlus, Mail as MailIcon, Upload, Download, CheckSquare, Square, AlertCircle, Activity, Ban, PlayCircle, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Organization, SiteAdmin, FeatureFlag, EmailTemplate } from "@shared/schema";

export default function SiteAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", type: "school", tier: "campus" });
  
  const [isCreateFlagOpen, setIsCreateFlagOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [newFlag, setNewFlag] = useState({ name: "", description: "", isEnabled: false, rolloutPercentage: 100, allowedRoles: [] as string[] });
  
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", category: "notification", htmlContent: "", textContent: "", variables: [] as string[], isActive: true });
  
  const [selectedOrgForPeople, setSelectedOrgForPeople] = useState<string>("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invitePersonType, setInvitePersonType] = useState("educator");
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkImportResults, setBulkImportResults] = useState<{ success: number; failed: number; errors: { row: number; email: string; message: string }[] } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "suspend" | "platformRole" | "orgRoleOwner";
    memberId: string;
    memberName: string;
    newValue?: string;
  } | null>(null);

  const [selectedOrgForSettings, setSelectedOrgForSettings] = useState<string>("");
  const [settingsForm, setSettingsForm] = useState({
    name: "", address: "", city: "", state: "", country: "", zipCode: "", phone: "", website: "",
    settings: { allowSelfRegistration: false, requireEmailDomain: false, defaultUserRole: "student" as string },
  });
  const [selectedOrgForActivity, setSelectedOrgForActivity] = useState<string>("");

  const { data: adminCheck, isLoading: checkLoading } = useQuery<{ isSiteAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<{
    totalOrganizations: number;
    activeOrganizations: number;
    totalSiteAdmins: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: siteAdmins = [] } = useQuery<SiteAdmin[]>({
    queryKey: ["/api/admin/site-admins"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery<FeatureFlag[]>({
    queryKey: ["/api/admin/feature-flags"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: emailTemplates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: orgInvitations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations", selectedOrgForPeople, "invitations"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForPeople}/invitations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedOrgForPeople,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: string; personType: string }) => {
      return await apiRequest("POST", `/api/organizations/${selectedOrgForPeople}/invite`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrgForPeople, "invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"] });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      toast({ title: "Invitation sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send invitation", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest("DELETE", `/api/org-admin/orgs/${selectedOrgForPeople}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"] });
      toast({ title: "Member removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove member", variant: "destructive" });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      return await apiRequest("PATCH", `/api/org-admin/orgs/${selectedOrgForPeople}/members/${memberId}/role`, { orgRole: role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"] });
      toast({ title: "Member role updated" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const parseCsvText = (text: string): { email: string; role: string; personType: string }[] => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const results: { email: string; role: string; personType: string }[] = [];
    for (const line of lines) {
      const firstLine = line.trim().toLowerCase();
      if (firstLine.startsWith("email") || firstLine.startsWith("name")) continue;
      const parts = line.split(/[,\t]+/).map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        results.push({ email: parts[0], personType: parts[1] || "educator", role: parts[2] || "member" });
      }
    }
    return results;
  };

  const bulkInviteMutation = useMutation({
    mutationFn: async (people: { email: string; role: string; personType: string }[]) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedOrgForPeople}/bulk-invite`, { people });
      return res.json();
    },
    onSuccess: (data) => {
      setBulkImportResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedOrgForPeople, "invitations"] });
      if (data.success > 0) {
        toast({ title: `${data.success} invitation(s) sent successfully${data.failed > 0 ? `, ${data.failed} failed` : ""}` });
      } else {
        toast({ title: "No invitations sent - check errors below", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Failed to process bulk invitations", variant: "destructive" });
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedOrgForPeople}/bulk-remove`, { memberIds });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"] });
      setSelectedMembers(new Set());
      setIsBulkDeleteConfirmOpen(false);
      toast({ title: `${data.removed} member(s) removed${data.failed > 0 ? `, ${data.failed} failed` : ""}` });
    },
    onError: () => {
      toast({ title: "Failed to remove members", variant: "destructive" });
    },
  });

  const { data: myAdminOrgs = [] } = useQuery<any[]>({
    queryKey: ["/api/org-admin/my-orgs"],
  });

  const { data: orgAdminMembers = [], isLoading: orgAdminMembersLoading } = useQuery<any[]>({
    queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/org-admin/orgs/${selectedOrgForPeople}/members`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedOrgForPeople,
  });

  const updatePlatformRoleMutation = useMutation({
    mutationFn: async ({ memberId, platformRole }: { memberId: string; platformRole: string }) => {
      return await apiRequest("PATCH", `/api/org-admin/orgs/${selectedOrgForPeople}/members/${memberId}/role`, { platformRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"] });
      toast({ title: "Platform role updated" });
    },
    onError: () => {
      toast({ title: "Failed to update platform role", variant: "destructive" });
    },
  });

  const updateMemberStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/org-admin/orgs/${selectedOrgForPeople}/members/${memberId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForPeople, "members"] });
      toast({ title: "Member status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update member status", variant: "destructive" });
    },
  });

  const { data: orgSettingsData, isLoading: settingsLoading } = useQuery<any>({
    queryKey: ["/api/org-admin/orgs", selectedOrgForSettings, "settings"],
    queryFn: async () => {
      const res = await fetch(`/api/org-admin/orgs/${selectedOrgForSettings}/settings`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedOrgForSettings,
  });

  useEffect(() => {
    if (orgSettingsData) {
      setSettingsForm({
        name: orgSettingsData.name || "",
        address: orgSettingsData.address || "",
        city: orgSettingsData.city || "",
        state: orgSettingsData.state || "",
        country: orgSettingsData.country || "",
        zipCode: orgSettingsData.zipCode || "",
        phone: orgSettingsData.phone || "",
        website: orgSettingsData.website || "",
        settings: {
          allowSelfRegistration: orgSettingsData.settings?.allowSelfRegistration || false,
          requireEmailDomain: orgSettingsData.settings?.requireEmailDomain || false,
          defaultUserRole: orgSettingsData.settings?.defaultUserRole || "student",
        },
      });
    }
  }, [orgSettingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsForm) => {
      return await apiRequest("PATCH", `/api/org-admin/orgs/${selectedOrgForSettings}/settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/orgs", selectedOrgForSettings, "settings"] });
      toast({ title: "Organization settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const { data: activityData = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/org-admin/orgs", selectedOrgForActivity, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/org-admin/orgs/${selectedOrgForActivity}/activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedOrgForActivity,
  });

  const sortedActivityData = [...activityData].sort((a, b) => {
    if (!a.lastLoginAt && !b.lastLoginAt) return 0;
    if (!a.lastLoginAt) return 1;
    if (!b.lastLoginAt) return -1;
    return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
  });

  const isInactive = (lastLoginAt: string | null) => {
    if (!lastLoginAt) return true;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lastLoginAt) < thirtyDaysAgo;
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const toggleAllMembers = (members: any[]) => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m: any) => m.id)));
    }
  };

  // Performance Analytics Types
  type EducatorPerformanceMetric = {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    organizationId: string | null;
    organizationName: string | null;
    goalsCompleted: number;
    goalsTotal: number;
    goalsCompletionRate: number;
    lessonsCreated: number;
    studentsCount: number;
    avgStudentBeScore: number;
    avgStudentKnowScore: number;
    avgStudentDoScore: number;
    avgStudentOverallScore: number;
    classesCount: number;
  };

  type CampusPerformanceMetric = {
    organizationId: string;
    organizationName: string;
    educatorsCount: number;
    studentsCount: number;
    goalsCompleted: number;
    goalsTotal: number;
    goalsCompletionRate: number;
    avgStudentBeScore: number;
    avgStudentKnowScore: number;
    avgStudentDoScore: number;
    avgStudentOverallScore: number;
    classesCount: number;
    lessonsCreated: number;
  };

  type OrganizationPerformanceMetric = {
    organizationId: string;
    organizationName: string;
    organizationType: string;
    tier: string;
    campusesCount: number;
    educatorsCount: number;
    studentsCount: number;
    goalsCompleted: number;
    goalsTotal: number;
    goalsCompletionRate: number;
    avgStudentBeScore: number;
    avgStudentKnowScore: number;
    avgStudentDoScore: number;
    avgStudentOverallScore: number;
  };

  type SystemWideStats = {
    totalEducators: number;
    totalStudents: number;
    totalOrganizations: number;
    totalCampuses: number;
    totalGoals: number;
    goalsCompleted: number;
    goalsCompletionRate: number;
    avgBeScore: number;
    avgKnowScore: number;
    avgDoScore: number;
    avgOverallScore: number;
    topPerformingEducators: EducatorPerformanceMetric[];
    topPerformingCampuses: CampusPerformanceMetric[];
  };

  // Performance Analytics Queries
  const { data: systemStats, isLoading: systemStatsLoading } = useQuery<SystemWideStats>({
    queryKey: ["/api/admin/performance/system"],
    enabled: adminCheck?.isSiteAdmin,
  });

  type EducatorTypeBreakdown = {
    type: string;
    label: string;
    total: number;
    activeLast7Days: number;
    activeLast30Days: number;
  };

  type EducatorTypeAnalytics = {
    breakdown: EducatorTypeBreakdown[];
    totalEducators: number;
    totalWithType: number;
  };

  const { data: educatorTypeData, isLoading: educatorTypeLoading } = useQuery<EducatorTypeAnalytics>({
    queryKey: ["/api/admin/performance/educator-types"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: educatorMetrics = [], isLoading: educatorMetricsLoading } = useQuery<EducatorPerformanceMetric[]>({
    queryKey: ["/api/admin/performance/educators"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: campusMetrics = [], isLoading: campusMetricsLoading } = useQuery<CampusPerformanceMetric[]>({
    queryKey: ["/api/admin/performance/campuses"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: orgMetrics = [], isLoading: orgMetricsLoading } = useQuery<OrganizationPerformanceMetric[]>({
    queryKey: ["/api/admin/performance/organizations"],
    enabled: adminCheck?.isSiteAdmin,
  });

  // Sort metrics by goal completion rate (client-side safety)
  const sortedEducatorMetrics = [...educatorMetrics].sort((a, b) => b.goalsCompletionRate - a.goalsCompletionRate);
  const sortedCampusMetrics = [...campusMetrics].sort((a, b) => b.goalsCompletionRate - a.goalsCompletionRate);
  const sortedOrgMetrics = [...orgMetrics].sort((a, b) => b.goalsCompletionRate - a.goalsCompletionRate);

  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof newOrg) => {
      return await apiRequest("POST", "/api/admin/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsCreateOrgOpen(false);
      setNewOrg({ name: "", slug: "", type: "school", tier: "campus" });
      toast({ title: "Organization created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create organization", variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Organization deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete organization", variant: "destructive" });
    },
  });

  const createFlagMutation = useMutation({
    mutationFn: async (data: typeof newFlag) => {
      return await apiRequest("POST", "/api/admin/feature-flags", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      setIsCreateFlagOpen(false);
      setNewFlag({ name: "", description: "", isEnabled: false, rolloutPercentage: 100, allowedRoles: [] });
      toast({ title: "Feature flag created" });
    },
    onError: () => {
      toast({ title: "Failed to create feature flag", variant: "destructive" });
    },
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeatureFlag> }) => {
      return await apiRequest("PATCH", `/api/admin/feature-flags/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      setEditingFlag(null);
      toast({ title: "Feature flag updated" });
    },
    onError: () => {
      toast({ title: "Failed to update feature flag", variant: "destructive" });
    },
  });

  const deleteFlagMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/feature-flags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      toast({ title: "Feature flag deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete feature flag", variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      return await apiRequest("POST", "/api/admin/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsCreateTemplateOpen(false);
      setNewTemplate({ name: "", subject: "", category: "notification", htmlContent: "", textContent: "", variables: [], isActive: true });
      toast({ title: "Email template created" });
    },
    onError: () => {
      toast({ title: "Failed to create email template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) => {
      return await apiRequest("PATCH", `/api/admin/email-templates/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setEditingTemplate(null);
      toast({ title: "Email template updated" });
    },
    onError: () => {
      toast({ title: "Failed to update email template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Email template deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete email template", variant: "destructive" });
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
              You need campus administrator or higher privileges to access this page. If you believe this is an error, please contact your campus or district administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-md bg-destructive/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
            My Campus
          </h1>
          <p className="font-roboto text-muted-foreground">
            Manage your campus teams, external partner organizations, people, and campus settings
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Campus Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeOrganizations || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Campus Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSiteAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">Administrators with campus access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Campus Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">All services running normally</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="organizations" data-testid="tab-organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="admins" data-testid="tab-admins">
            <Shield className="h-4 w-4 mr-2" />
            Administrators
          </TabsTrigger>
          <TabsTrigger value="people" data-testid="tab-people">
            <Users className="h-4 w-4 mr-2" />
            People
          </TabsTrigger>
          <TabsTrigger value="feature-flags" data-testid="tab-feature-flags">
            <Flag className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="email-templates" data-testid="tab-email-templates">
            <Mail className="h-4 w-4 mr-2" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="safety" data-testid="tab-safety">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Safety & Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Campus Organizations</h2>
              <p className="text-sm text-muted-foreground">Internal teams (grade levels, departments, support staff) and external partners (non-profits, workforce boards, higher ed) connected to your campus</p>
            </div>
            <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-org">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Add an internal campus team or connect an external partner organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="e.g., 9th Grade Team, Science Dept, Boys & Girls Club"
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-slug">URL Slug</Label>
                    <Input
                      id="org-slug"
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                      placeholder="9th-grade-team"
                      data-testid="input-org-slug"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-type">Type</Label>
                    <Select
                      value={newOrg.type}
                      onValueChange={(value) => setNewOrg({ ...newOrg, type: value })}
                    >
                      <SelectTrigger data-testid="select-org-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school">Internal - School / Campus Team</SelectItem>
                        <SelectItem value="district">Internal - District (ISD)</SelectItem>
                        <SelectItem value="network">Network - Multi-School Network</SelectItem>
                        <SelectItem value="charter_network">Charter Network - CMO / EMO</SelectItem>
                        <SelectItem value="university">Internal - University / Higher Ed</SelectItem>
                        <SelectItem value="organization">External - Partner Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Internal teams are part of your campus. Districts (ISDs) manage multiple campuses locally. Charter Networks (CMO/EMO) manage schools across states. External partners connect to provide mentoring, scholarships, workforce opportunities, or enrichment resources.</p>
                  </div>
                  {newOrg.type === "organization" && (
                    <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">External Partner Notice</p>
                      <p className="text-xs text-muted-foreground mt-1">External partners do not have access to student academic data. Members of this organization will need to be assigned to a class within the campus to interact with students.</p>
                    </div>
                  )}
                  {(newOrg.type === "network" || newOrg.type === "charter_network") && (
                    <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium">{newOrg.type === "charter_network" ? "Charter Network (CMO/EMO)" : "Multi-School Network"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{`This organization manages multiple campuses${newOrg.type === "charter_network" ? " across states (e.g., KIPP, IDEA, Green Dot)" : ""}. Child campuses can be added under this organization. Enterprise tier ($${PLAN_PRICES.enterprise}/mo + $${SEAT_PRICES.enterprise}/seat/mo, ${SEAT_MINIMUMS.enterprise} seat minimum) is recommended for unified master dashboard and per-state management capabilities.`}</p>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="org-tier">Tier</Label>
                    <Select
                      value={newOrg.tier}
                      onValueChange={(value) => setNewOrg({ ...newOrg, tier: value })}
                    >
                      <SelectTrigger data-testid="select-org-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="campus">{`Campus ($${PLAN_PRICES.campus}/mo + $${SEAT_PRICES.campus}/seat, ${SEAT_MINIMUMS.campus} seat min)`}</SelectItem>
                        <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOrgOpen(false)}
                    data-testid="button-cancel-org"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createOrgMutation.mutate(newOrg)}
                    disabled={!newOrg.name || !newOrg.slug || createOrgMutation.isPending}
                    data-testid="button-submit-org"
                  >
                    {createOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {orgsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No organizations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create internal campus teams (grade levels, departments) or connect external partners (non-profits, workforce boards) to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {organizations.map((org) => (
                <Card key={org.id} data-testid={`card-org-${org.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription>/{org.slug}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>
                        {org.status}
                      </Badge>
                      <Badge variant="outline">
                        {org.tier}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteOrgMutation.mutate(org.id)}
                        disabled={deleteOrgMutation.isPending}
                        data-testid={`button-delete-org-${org.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(org as any).maxMembers || "Unlimited"} members allowed
                      </span>
                      <span>Type: {org.type === "charter_network" ? "Charter Network (CMO/EMO)" : org.type === "network" ? "Network" : org.type === "district" ? "District (ISD)" : org.type}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Administrators</h2>
              <p className="text-sm text-muted-foreground">Users with elevated access to manage your campus settings and organizations</p>
            </div>
          </div>

          {siteAdmins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No administrators configured yet</p>
                <p className="text-sm text-muted-foreground mt-1">Administrators can manage organizations, people, and campus settings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {siteAdmins.map((admin) => (
                <Card key={admin.id} data-testid={`card-admin-${admin.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <CardTitle className="text-base">User: {admin.userId}</CardTitle>
                        <CardDescription>
                          Added {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "Unknown"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="destructive">Super Admin</Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">People Management</h2>
              <p className="text-sm text-muted-foreground">View and manage the educators, students, and staff within each organization</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="w-full sm:max-w-sm">
              <Label htmlFor="people-org-select" className="text-sm text-muted-foreground mb-1 block">Select an organization to view its members</Label>
              <Select value={selectedOrgForPeople} onValueChange={(v) => { setSelectedOrgForPeople(v); setSelectedMembers(new Set()); }}>
                <SelectTrigger data-testid="select-people-org">
                  <SelectValue placeholder="Choose an organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOrgForPeople && (
              <div className="flex items-center gap-2 flex-wrap">
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-invite-people">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite People
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite People</DialogTitle>
                      <DialogDescription>
                        Send an email invitation to join the selected organization. They will receive a link to accept and join.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="educator@school.edu"
                          data-testid="input-invite-email"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="invite-role">Organization Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger data-testid="select-invite-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member - Can view and participate</SelectItem>
                            <SelectItem value="admin">Admin - Can manage members and settings</SelectItem>
                            <SelectItem value="owner">Owner - Full control over the organization</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">This determines what the person can do within this organization</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="invite-person-type">Person Type</Label>
                        <Select value={invitePersonType} onValueChange={setInvitePersonType}>
                          <SelectTrigger data-testid="select-invite-person-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="educator">Educator</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="mentor">Mentor</SelectItem>
                            <SelectItem value="parent">Parent / Guardian</SelectItem>
                            <SelectItem value="employer">Employer</SelectItem>
                            <SelectItem value="counselor">Counselor</SelectItem>
                            <SelectItem value="administrator">Administrator</SelectItem>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">This describes the person's role in the educational community. It can be changed after they accept.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteOpen(false)} data-testid="button-cancel-invite">
                        Cancel
                      </Button>
                      <Button
                        onClick={() => inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole, personType: invitePersonType })}
                        disabled={!inviteEmail || inviteMemberMutation.isPending}
                        data-testid="button-send-invite"
                      >
                        {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBulkImportOpen} onOpenChange={(open) => { setIsBulkImportOpen(open); if (!open) { setBulkCsvText(""); setBulkImportResults(null); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-bulk-import">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Bulk Add People</DialogTitle>
                      <DialogDescription>
                        Add multiple people at once by pasting their information below. Each person will receive an email invitation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="p-3 rounded-md bg-muted/50 border">
                        <p className="text-sm font-medium mb-2">Required Format (CSV)</p>
                        <p className="text-xs text-muted-foreground mb-2">One person per line. Columns: email, person type, org role (last two optional)</p>
                        <code className="text-xs block bg-background p-2 rounded border font-mono">
                          email,person type,role{"\n"}
                          teacher@school.edu,educator,member{"\n"}
                          mentor@org.com,mentor,member{"\n"}
                          admin@school.edu,administrator,admin{"\n"}
                          parent@email.com,parent,member
                        </code>
                        <p className="text-xs text-muted-foreground mt-2">Person types: educator, student, mentor, parent, employer, counselor, administrator, volunteer, other. Org roles: member, admin, owner. You can also paste tab-separated data from a spreadsheet.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bulk-csv">Paste your data here</Label>
                        <Textarea
                          id="bulk-csv"
                          value={bulkCsvText}
                          onChange={(e) => setBulkCsvText(e.target.value)}
                          placeholder={"teacher@school.edu,educator,member\nmentor@org.com,mentor,member\nparent@email.com,parent,member"}
                          className="min-h-[120px] font-mono text-sm"
                          data-testid="textarea-bulk-csv"
                        />
                        <p className="text-xs text-muted-foreground">
                          {bulkCsvText ? `${parseCsvText(bulkCsvText).length} people detected` : "Paste CSV or tab-separated data"}
                        </p>
                      </div>
                      {bulkImportResults && (
                        <div className="p-3 rounded-md border space-y-2">
                          <p className="text-sm font-medium">Results</p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">{bulkImportResults.success} sent</span>
                            {bulkImportResults.failed > 0 && <span className="text-destructive">{bulkImportResults.failed} failed</span>}
                          </div>
                          {bulkImportResults.errors.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {bulkImportResults.errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>Row {err.row} ({err.email}): {err.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsBulkImportOpen(false); setBulkCsvText(""); setBulkImportResults(null); }} data-testid="button-cancel-bulk">
                        {bulkImportResults ? "Close" : "Cancel"}
                      </Button>
                      {!bulkImportResults && (
                        <Button
                          onClick={() => {
                            const people = parseCsvText(bulkCsvText);
                            if (people.length === 0) {
                              toast({ title: "No valid entries found. Check your format.", variant: "destructive" });
                              return;
                            }
                            bulkInviteMutation.mutate(people);
                          }}
                          disabled={!bulkCsvText.trim() || bulkInviteMutation.isPending}
                          data-testid="button-send-bulk-invites"
                        >
                          {bulkInviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Send {parseCsvText(bulkCsvText).length} Invitations
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {selectedMembers.size > 0 && (
                  <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-bulk-delete">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove {selectedMembers.size} Selected
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Selected Members</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove {selectedMembers.size} member(s) from this organization? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)} data-testid="button-cancel-bulk-delete">
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => bulkRemoveMutation.mutate(Array.from(selectedMembers))}
                          disabled={bulkRemoveMutation.isPending}
                          data-testid="button-confirm-bulk-delete"
                        >
                          {bulkRemoveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Remove {selectedMembers.size} Members
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </div>

          <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
            <DialogContent data-testid="dialog-confirm-action">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(confirmAction?.type === "remove" || confirmAction?.type === "suspend") && (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  {confirmAction?.type === "remove" && "Remove Member"}
                  {confirmAction?.type === "suspend" && "Suspend Member"}
                  {confirmAction?.type === "platformRole" && "Change Platform Role"}
                  {confirmAction?.type === "orgRoleOwner" && "Promote to Owner"}
                </DialogTitle>
                <DialogDescription>
                  {confirmAction?.type === "remove" && `Are you sure you want to remove ${confirmAction.memberName} from this organization? This cannot be undone.`}
                  {confirmAction?.type === "suspend" && `Are you sure you want to suspend ${confirmAction.memberName}? They will lose access to this organization immediately.`}
                  {confirmAction?.type === "platformRole" && `Are you sure you want to change ${confirmAction.memberName}'s platform role to ${confirmAction.newValue}? This will change what they can access across the entire platform.`}
                  {confirmAction?.type === "orgRoleOwner" && `Are you sure you want to make ${confirmAction.memberName} an Owner? Owners have full control over this organization.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAction(null)} data-testid="button-cancel-action">
                  Cancel
                </Button>
                <Button
                  variant={(confirmAction?.type === "remove" || confirmAction?.type === "suspend") ? "destructive" : "default"}
                  data-testid="button-confirm-action"
                  disabled={removeMemberMutation.isPending || updateMemberStatusMutation.isPending || updatePlatformRoleMutation.isPending || updateMemberRoleMutation.isPending}
                  onClick={() => {
                    if (!confirmAction) return;
                    if (confirmAction.type === "remove") {
                      removeMemberMutation.mutate(confirmAction.memberId, { onSettled: () => setConfirmAction(null) });
                    } else if (confirmAction.type === "suspend") {
                      updateMemberStatusMutation.mutate({ memberId: confirmAction.memberId, status: "suspended" }, { onSettled: () => setConfirmAction(null) });
                    } else if (confirmAction.type === "platformRole") {
                      updatePlatformRoleMutation.mutate({ memberId: confirmAction.memberId, platformRole: confirmAction.newValue! }, { onSettled: () => setConfirmAction(null) });
                    } else if (confirmAction.type === "orgRoleOwner") {
                      updateMemberRoleMutation.mutate({ memberId: confirmAction.memberId, role: confirmAction.newValue! }, { onSettled: () => setConfirmAction(null) });
                    }
                  }}
                >
                  {(removeMemberMutation.isPending || updateMemberStatusMutation.isPending || updatePlatformRoleMutation.isPending || updateMemberRoleMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {!selectedOrgForPeople ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No organization selected</p>
                <p className="text-sm text-muted-foreground mt-1">Choose an organization from the dropdown above to view its members, invite new people, or manage roles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <h3 className="font-oswald text-lg">Current Members</h3>
                  {orgAdminMembers.length > 0 && (
                    <p className="text-xs text-muted-foreground">{orgAdminMembers.length} member(s) total</p>
                  )}
                </div>
                {orgAdminMembersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orgAdminMembers.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No members in this organization yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Use "Invite People" or "Bulk Add" to add educators, students, or staff</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 overflow-x-auto">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
                      <button
                        onClick={() => toggleAllMembers(orgAdminMembers.map((item: any) => item.membership))}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="button-select-all-members"
                      >
                        {selectedMembers.size === orgAdminMembers.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {selectedMembers.size > 0 ? `${selectedMembers.size} selected` : "Select all"}
                      </span>
                    </div>
                    {orgAdminMembers.map((item: any) => {
                      const member = item.membership;
                      const memberUser = item.user;
                      const memberStatus = member?.status || "active";
                      const memberPlatformRole = memberUser?.role || "student";
                      return (
                        <div
                          key={member.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 rounded-md border ${selectedMembers.has(member.id) ? "border-primary/30 bg-primary/5" : ""} ${memberStatus === "suspended" ? "opacity-60" : ""}`}
                          data-testid={`member-row-${member.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => toggleMemberSelection(member.id)}
                              className="text-muted-foreground hover:text-foreground shrink-0"
                              data-testid={`checkbox-member-${member.id}`}
                            >
                              {selectedMembers.has(member.id) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                            <Avatar>
                              <AvatarImage src={memberUser?.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {(memberUser?.firstName?.[0] || "") + (memberUser?.lastName?.[0] || "") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium truncate">
                                  {memberUser?.firstName || memberUser?.lastName
                                    ? `${memberUser?.firstName || ""} ${memberUser?.lastName || ""}`.trim()
                                    : member.userId}
                                </p>
                                <Badge
                                  variant={memberStatus === "active" ? "outline" : "destructive"}
                                  className="text-xs"
                                  data-testid={`badge-status-${member.id}`}
                                >
                                  {memberStatus}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{memberUser?.email || "No email"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={member.role || "member"}
                              onValueChange={(newRole) => {
                                const name = (memberUser?.firstName && memberUser?.lastName)
                                  ? `${memberUser.firstName} ${memberUser.lastName}`.trim()
                                  : "this member";
                                if (newRole === "owner") {
                                  setConfirmAction({ type: "orgRoleOwner", memberId: member.id, memberName: name, newValue: newRole });
                                } else {
                                  updateMemberRoleMutation.mutate({ memberId: member.id, role: newRole });
                                }
                              }}
                            >
                              <SelectTrigger className="w-28" data-testid={`select-member-role-${member.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={memberPlatformRole}
                              onValueChange={(newPlatformRole) => {
                                const name = (memberUser?.firstName && memberUser?.lastName)
                                  ? `${memberUser.firstName} ${memberUser.lastName}`.trim()
                                  : "this member";
                                setConfirmAction({ type: "platformRole", memberId: member.id, memberName: name, newValue: newPlatformRole });
                              }}
                            >
                              <SelectTrigger className="w-36" data-testid={`select-platform-role-${member.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="educator">Educator</SelectItem>
                                <SelectItem value="staff">Staff (LYS internal)</SelectItem>
                                <SelectItem value="homeschool_parent">Homeschool Parent</SelectItem>
                                <SelectItem value="campus_admin">Campus Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (memberStatus === "active") {
                                  const name = (memberUser?.firstName && memberUser?.lastName)
                                    ? `${memberUser.firstName} ${memberUser.lastName}`.trim()
                                    : "this member";
                                  setConfirmAction({ type: "suspend", memberId: member.id, memberName: name });
                                } else {
                                  updateMemberStatusMutation.mutate({ memberId: member.id, status: "active" });
                                }
                              }}
                              disabled={updateMemberStatusMutation.isPending}
                              data-testid={`button-toggle-status-${member.id}`}
                            >
                              {memberStatus === "active" ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const name = (memberUser?.firstName && memberUser?.lastName)
                                  ? `${memberUser.firstName} ${memberUser.lastName}`.trim()
                                  : "this member";
                                setConfirmAction({ type: "remove", memberId: member.id, memberName: name });
                              }}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {orgInvitations.length > 0 && (
                <div>
                  <h3 className="font-oswald text-lg mb-3">Pending Invitations</h3>
                  <div className="space-y-2">
                    {orgInvitations.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md border"
                        data-testid={`invitation-row-${inv.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                            <MailIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {inv.personType && (
                            <Badge variant="outline" className="text-xs capitalize">{inv.personType}</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">{inv.role || "member"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="feature-flags" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Feature Flags</h2>
              <p className="text-sm text-muted-foreground">Control which features are enabled and gradually roll them out to users</p>
            </div>
            <Dialog open={isCreateFlagOpen} onOpenChange={setIsCreateFlagOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-flag">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Feature Flag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature Flag</DialogTitle>
                  <DialogDescription>
                    Add a new feature flag to control feature rollout.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="flag-name">Flag Name</Label>
                    <Input
                      id="flag-name"
                      value={newFlag.name}
                      onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                      placeholder="new_feature_enabled"
                      data-testid="input-flag-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="flag-description">Description</Label>
                    <Textarea
                      id="flag-description"
                      value={newFlag.description}
                      onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                      placeholder="Enables the new feature for users"
                      data-testid="input-flag-description"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Enabled</Label>
                      <p className="text-sm text-muted-foreground">Turn this feature on or off</p>
                    </div>
                    <Switch
                      checked={newFlag.isEnabled}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, isEnabled: checked })}
                      data-testid="switch-flag-enabled"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label>Rollout Percentage</Label>
                      <span className="text-sm text-muted-foreground">{newFlag.rolloutPercentage}%</span>
                    </div>
                    <Slider
                      value={[newFlag.rolloutPercentage]}
                      onValueChange={([value]) => setNewFlag({ ...newFlag, rolloutPercentage: value })}
                      max={100}
                      step={1}
                      data-testid="slider-flag-rollout"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateFlagOpen(false)} data-testid="button-cancel-flag">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createFlagMutation.mutate(newFlag)}
                    disabled={!newFlag.name || createFlagMutation.isPending}
                    data-testid="button-submit-flag"
                  >
                    {createFlagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {flagsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : featureFlags.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feature flags configured</p>
                <p className="text-sm text-muted-foreground">Create feature flags to control feature rollout</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {featureFlags.map((flag) => (
                <Card key={flag.id} data-testid={`card-flag-${flag.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${flag.isEnabled ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}>
                        <ToggleLeft className={`h-5 w-5 ${flag.isEnabled ? "text-green-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-mono">{flag.name}</CardTitle>
                        <CardDescription>{flag.description || "No description"}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                        {flag.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {flag.rolloutPercentage}%
                      </Badge>
                      <Switch
                        checked={flag.isEnabled}
                        onCheckedChange={(checked) => updateFlagMutation.mutate({ id: flag.id, updates: { isEnabled: checked } })}
                        data-testid={`switch-flag-${flag.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingFlag(flag)}
                        data-testid={`button-edit-flag-${flag.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteFlagMutation.mutate(flag.id)}
                        disabled={deleteFlagMutation.isPending}
                        data-testid={`button-delete-flag-${flag.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingFlag} onOpenChange={(open) => !open && setEditingFlag(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Feature Flag</DialogTitle>
                <DialogDescription>Update the feature flag settings.</DialogDescription>
              </DialogHeader>
              {editingFlag && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Flag Name</Label>
                    <Input value={editingFlag.name} disabled className="bg-muted" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-flag-description">Description</Label>
                    <Textarea
                      id="edit-flag-description"
                      value={editingFlag.description || ""}
                      onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                      data-testid="input-edit-flag-description"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label>Enabled</Label>
                    <Switch
                      checked={editingFlag.isEnabled}
                      onCheckedChange={(checked) => setEditingFlag({ ...editingFlag, isEnabled: checked })}
                      data-testid="switch-edit-flag-enabled"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label>Rollout Percentage</Label>
                      <span className="text-sm text-muted-foreground">{editingFlag.rolloutPercentage}%</span>
                    </div>
                    <Slider
                      value={[editingFlag.rolloutPercentage]}
                      onValueChange={([value]) => setEditingFlag({ ...editingFlag, rolloutPercentage: value })}
                      max={100}
                      step={1}
                      data-testid="slider-edit-flag-rollout"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingFlag(null)} data-testid="button-cancel-edit-flag">
                  Cancel
                </Button>
                <Button
                  onClick={() => editingFlag && updateFlagMutation.mutate({
                    id: editingFlag.id,
                    updates: {
                      description: editingFlag.description,
                      isEnabled: editingFlag.isEnabled,
                      rolloutPercentage: editingFlag.rolloutPercentage,
                    }
                  })}
                  disabled={updateFlagMutation.isPending}
                  data-testid="button-submit-edit-flag"
                >
                  {updateFlagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="email-templates" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Email Templates</h2>
              <p className="text-sm text-muted-foreground">Create and manage the email templates used for system notifications and invitations</p>
            </div>
            <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Email Template</DialogTitle>
                  <DialogDescription>
                    Add a new email template for system notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                      placeholder="welcome_email"
                      data-testid="input-template-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input
                      id="template-subject"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      placeholder="Welcome to LYS!"
                      data-testid="input-template-subject"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                    >
                      <SelectTrigger data-testid="select-template-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-html">HTML Content</Label>
                    <Textarea
                      id="template-html"
                      value={newTemplate.htmlContent}
                      onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                      placeholder="<h1>Welcome, {{name}}!</h1>"
                      className="min-h-[100px] font-mono text-sm"
                      data-testid="input-template-html"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-text">Plain Text Content</Label>
                    <Textarea
                      id="template-text"
                      value={newTemplate.textContent}
                      onChange={(e) => setNewTemplate({ ...newTemplate, textContent: e.target.value })}
                      placeholder="Welcome, {{name}}!"
                      className="min-h-[80px]"
                      data-testid="input-template-text"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-variables">Variables (comma-separated)</Label>
                    <Input
                      id="template-variables"
                      value={newTemplate.variables.join(", ")}
                      onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
                      placeholder="name, email, date"
                      data-testid="input-template-variables"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">Enable this template for use</p>
                    </div>
                    <Switch
                      checked={newTemplate.isActive}
                      onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isActive: checked })}
                      data-testid="switch-template-active"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)} data-testid="button-cancel-template">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createTemplateMutation.mutate(newTemplate)}
                    disabled={!newTemplate.name || !newTemplate.subject || createTemplateMutation.isPending}
                    data-testid="button-submit-template"
                  >
                    {createTemplateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emailTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No email templates configured</p>
                <p className="text-sm text-muted-foreground">Create email templates for system notifications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {emailTemplates.map((template) => (
                <Card key={template.id} data-testid={`card-template-${template.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${template.isActive ? "bg-blue-100 dark:bg-blue-900/20" : "bg-muted"}`}>
                        <Mail className={`h-5 w-5 ${template.isActive ? "text-blue-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-mono">{template.name}</CardTitle>
                        <CardDescription>{template.subject}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingTemplate(template)}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {template.variables && template.variables.length > 0 && (
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Variables:</span>
                        {template.variables.map((v) => (
                          <Badge key={v} variant="outline" className="font-mono text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Email Template</DialogTitle>
                <DialogDescription>Update the email template settings.</DialogDescription>
              </DialogHeader>
              {editingTemplate && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Template Name</Label>
                    <Input value={editingTemplate.name} disabled className="bg-muted" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-subject">Subject</Label>
                    <Input
                      id="edit-template-subject"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      data-testid="input-edit-template-subject"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-category">Category</Label>
                    <Select
                      value={editingTemplate.category}
                      onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}
                    >
                      <SelectTrigger data-testid="select-edit-template-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-html">HTML Content</Label>
                    <Textarea
                      id="edit-template-html"
                      value={editingTemplate.htmlContent || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlContent: e.target.value })}
                      className="min-h-[100px] font-mono text-sm"
                      data-testid="input-edit-template-html"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-text">Plain Text Content</Label>
                    <Textarea
                      id="edit-template-text"
                      value={editingTemplate.textContent || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, textContent: e.target.value })}
                      className="min-h-[80px]"
                      data-testid="input-edit-template-text"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-variables">Variables (comma-separated)</Label>
                    <Input
                      id="edit-template-variables"
                      value={(editingTemplate.variables || []).join(", ")}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
                      data-testid="input-edit-template-variables"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label>Active</Label>
                    <Switch
                      checked={editingTemplate.isActive}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isActive: checked })}
                      data-testid="switch-edit-template-active"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTemplate(null)} data-testid="button-cancel-edit-template">
                  Cancel
                </Button>
                <Button
                  onClick={() => editingTemplate && updateTemplateMutation.mutate({
                    id: editingTemplate.id,
                    updates: {
                      subject: editingTemplate.subject,
                      category: editingTemplate.category,
                      htmlContent: editingTemplate.htmlContent,
                      textContent: editingTemplate.textContent,
                      variables: editingTemplate.variables,
                      isActive: editingTemplate.isActive,
                    }
                  })}
                  disabled={updateTemplateMutation.isPending}
                  data-testid="button-submit-edit-template"
                >
                  {updateTemplateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Performance Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Track educator, campus, and organization performance based on goals, standards, and student Be-Know-Do progress
              </p>
            </div>
          </div>

          {/* System-Wide Overview */}
          {systemStatsLoading ? (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : systemStats && (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4" data-testid="performance-stats-grid">
                <Card data-testid="stat-card-goals">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Goals Completion</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-value-goals">{systemStats.goalsCompletionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {systemStats.goalsCompleted} of {systemStats.totalGoals} goals completed
                    </p>
                    <Progress value={systemStats.goalsCompletionRate} className="mt-2" />
                  </CardContent>
                </Card>
                <Card data-testid="stat-card-be">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Avg BE Score</CardTitle>
                    <Brain className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary" data-testid="stat-value-be">{systemStats.avgBeScore}%</div>
                    <p className="text-xs text-muted-foreground">Self-Discovery Progress</p>
                    <Progress value={systemStats.avgBeScore} className="mt-2" />
                  </CardContent>
                </Card>
                <Card data-testid="stat-card-know">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Avg KNOW Score</CardTitle>
                    <Compass className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600" data-testid="stat-value-know">{systemStats.avgKnowScore}%</div>
                    <p className="text-xs text-muted-foreground">Career Exploration Progress</p>
                    <Progress value={systemStats.avgKnowScore} className="mt-2" />
                  </CardContent>
                </Card>
                <Card data-testid="stat-card-do">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle className="text-sm font-medium">Avg DO Score</CardTitle>
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-value-do">{systemStats.avgDoScore}%</div>
                    <p className="text-xs text-muted-foreground">Action & Goals Progress</p>
                    <Progress value={systemStats.avgDoScore} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Educator Type Breakdown */}
              <Card data-testid="card-educator-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-lys-teal" />
                    Educator Type Usage
                  </CardTitle>
                  <CardDescription>
                    Who is using the platform most regularly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {educatorTypeLoading ? (
                    <div className="h-32 bg-muted animate-pulse rounded" />
                  ) : educatorTypeData ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {educatorTypeData.breakdown.filter(b => b.type !== "unspecified").map(item => {
                          const percentage = educatorTypeData.totalEducators > 0 
                            ? Math.round((item.total / educatorTypeData.totalEducators) * 100) 
                            : 0;
                          return (
                            <Card key={item.type} data-testid={`educator-type-card-${item.type}`}>
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-sm font-medium">{item.label}</span>
                                  <Badge variant="secondary">{percentage}%</Badge>
                                </div>
                                <div className="text-2xl font-bold">{item.total}</div>
                                <Progress value={percentage} className="h-2" />
                                <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
                                  <span>Active last 7d: {item.activeLast7Days}</span>
                                  <span>Active last 30d: {item.activeLast30Days}</span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      {educatorTypeData.totalEducators > 0 && (
                        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                          <span>{educatorTypeData.totalWithType} of {educatorTypeData.totalEducators} educators have set their type</span>
                          {educatorTypeData.breakdown.find(b => b.type === "unspecified")?.total ? (
                            <Badge variant="outline">
                              {educatorTypeData.breakdown.find(b => b.type === "unspecified")?.total} not set
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No educator data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Educators Leaderboard */}
              <Card data-testid="card-educators-leaderboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-lys-yellow" />
                    Top Performing Educators
                  </CardTitle>
                  <CardDescription>
                    Educators ranked by goal completion rate and student Be-Know-Do progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {educatorMetricsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : educatorMetrics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No educator data available</p>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {sortedEducatorMetrics.slice(0, 15).map((educator, idx) => (
                          <div 
                            key={educator.userId} 
                            className="flex items-center justify-between p-3 rounded-md border"
                            data-testid={`educator-row-${idx}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-lys-yellow text-white' :
                                idx === 1 ? 'bg-gray-400 text-white' :
                                idx === 2 ? 'bg-amber-600 text-white' :
                                'bg-muted'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {educator.firstName || ''} {educator.lastName || educator.email || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {educator.organizationName || 'No Organization'} • {educator.classesCount} classes • {educator.studentsCount} students
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-bold">{educator.goalsCompletionRate}%</p>
                                <p className="text-xs text-muted-foreground">Goals</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-primary">{educator.avgStudentBeScore}%</p>
                                <p className="text-xs text-muted-foreground">BE</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-blue-600">{educator.avgStudentKnowScore}%</p>
                                <p className="text-xs text-muted-foreground">KNOW</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-green-600">{educator.avgStudentDoScore}%</p>
                                <p className="text-xs text-muted-foreground">DO</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold">{educator.lessonsCreated}</p>
                                <p className="text-xs text-muted-foreground">Lessons</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Top Campuses Leaderboard */}
              <Card data-testid="card-campuses-leaderboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-lys-teal" />
                    Top Performing Campuses
                  </CardTitle>
                  <CardDescription>
                    Campuses ranked by goal completion and student achievement scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campusMetricsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : campusMetrics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No campus data available</p>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {sortedCampusMetrics.slice(0, 15).map((campus, idx) => (
                          <div 
                            key={campus.organizationId} 
                            className="flex items-center justify-between p-3 rounded-md border"
                            data-testid={`campus-row-${idx}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-lys-teal text-white' :
                                idx === 1 ? 'bg-gray-400 text-white' :
                                idx === 2 ? 'bg-amber-600 text-white' :
                                'bg-muted'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium">{campus.organizationName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {campus.educatorsCount} educators • {campus.studentsCount} students • {campus.classesCount} classes
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap">
                              <div className="text-center">
                                <p className="font-bold">{campus.goalsCompletionRate}%</p>
                                <p className="text-xs text-muted-foreground">Goals</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-primary">{campus.avgStudentBeScore}%</p>
                                <p className="text-xs text-muted-foreground">BE</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-blue-600">{campus.avgStudentKnowScore}%</p>
                                <p className="text-xs text-muted-foreground">KNOW</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-green-600">{campus.avgStudentDoScore}%</p>
                                <p className="text-xs text-muted-foreground">DO</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold">{campus.lessonsCreated}</p>
                                <p className="text-xs text-muted-foreground">Lessons</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Top Organizations Leaderboard */}
              <Card data-testid="card-organizations-leaderboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-lys-red" />
                    Top Performing Organizations
                  </CardTitle>
                  <CardDescription>
                    Districts, schools, and universities ranked by overall performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orgMetricsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : sortedOrgMetrics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No organization data available</p>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {sortedOrgMetrics.slice(0, 15).map((org, idx) => (
                          <div 
                            key={org.organizationId} 
                            className="flex items-center justify-between p-3 rounded-md border"
                            data-testid={`org-row-${idx}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                idx === 0 ? 'bg-lys-red text-white' :
                                idx === 1 ? 'bg-gray-400 text-white' :
                                idx === 2 ? 'bg-amber-600 text-white' :
                                'bg-muted'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-medium">{org.organizationName}</p>
                                <p className="text-xs text-muted-foreground">
                                  <Badge variant="outline" className="mr-2">{org.organizationType}</Badge>
                                  {org.tier} • {org.campusesCount} campuses • {org.educatorsCount} educators • {org.studentsCount} students
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap">
                              <div className="text-center">
                                <p className="font-bold">{org.goalsCompletionRate}%</p>
                                <p className="text-xs text-muted-foreground">Goals</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-primary">{org.avgStudentBeScore}%</p>
                                <p className="text-xs text-muted-foreground">BE</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-blue-600">{org.avgStudentKnowScore}%</p>
                                <p className="text-xs text-muted-foreground">KNOW</p>
                              </div>
                              <div className="text-center">
                                <p className="font-bold text-green-600">{org.avgStudentDoScore}%</p>
                                <p className="text-xs text-muted-foreground">DO</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
              {/* Lesson Cache Management */}
              <LessonCacheSection isSiteAdmin={adminCheck?.isSiteAdmin} />
              {/* Bricks/BKD: LYS Canon CRUD + top exemplars (gated by new_lesson_retrieval flag) */}
              <LysCanonAdminSection isSiteAdmin={adminCheck?.isSiteAdmin} />
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="font-oswald text-xl">Organization Settings</h2>
            <p className="text-sm text-muted-foreground">Configure organization details and policies</p>
          </div>

          <div className="w-full max-w-sm">
            <Label htmlFor="settings-org-select" className="text-sm text-muted-foreground mb-1 block">Select an organization to configure</Label>
            <Select value={selectedOrgForSettings} onValueChange={setSelectedOrgForSettings}>
              <SelectTrigger data-testid="select-settings-org">
                <SelectValue placeholder="Choose an organization..." />
              </SelectTrigger>
              <SelectContent>
                {(myAdminOrgs.length > 0 ? myAdminOrgs : organizations).map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedOrgForSettings ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No organization selected</p>
                <p className="text-sm text-muted-foreground mt-1">Choose an organization from the dropdown above to configure its settings</p>
              </CardContent>
            </Card>
          ) : settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald">Organization Details</CardTitle>
                  <CardDescription>Basic organization information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="settings-name">Organization Name</Label>
                    <Input
                      id="settings-name"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-settings-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="settings-address">Address</Label>
                    <Input
                      id="settings-address"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                      data-testid="input-settings-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="settings-city">City</Label>
                      <Input
                        id="settings-city"
                        value={settingsForm.city}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, city: e.target.value }))}
                        data-testid="input-settings-city"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="settings-state">State</Label>
                      <Input
                        id="settings-state"
                        value={settingsForm.state}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, state: e.target.value }))}
                        data-testid="input-settings-state"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="settings-country">Country</Label>
                      <Input
                        id="settings-country"
                        value={settingsForm.country}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, country: e.target.value }))}
                        data-testid="input-settings-country"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="settings-zip">Zip Code</Label>
                      <Input
                        id="settings-zip"
                        value={settingsForm.zipCode}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, zipCode: e.target.value }))}
                        data-testid="input-settings-zip"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="settings-phone">Phone</Label>
                    <Input
                      id="settings-phone"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-settings-phone"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="settings-website">Website</Label>
                    <Input
                      id="settings-website"
                      value={settingsForm.website}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, website: e.target.value }))}
                      data-testid="input-settings-website"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald">Policies & Defaults</CardTitle>
                  <CardDescription>Registration and role assignment settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>Allow Self Registration</Label>
                      <p className="text-xs text-muted-foreground">Allow users to register and join this organization without an invitation</p>
                    </div>
                    <Switch
                      checked={settingsForm.settings.allowSelfRegistration}
                      onCheckedChange={(checked) => setSettingsForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, allowSelfRegistration: checked },
                      }))}
                      data-testid="switch-allow-self-registration"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label>Require Email Domain</Label>
                      <p className="text-xs text-muted-foreground">Restrict registration to specific email domains</p>
                    </div>
                    <Switch
                      checked={settingsForm.settings.requireEmailDomain}
                      onCheckedChange={(checked) => setSettingsForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, requireEmailDomain: checked },
                      }))}
                      data-testid="switch-require-email-domain"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Default User Role</Label>
                    <p className="text-xs text-muted-foreground">Role assigned to new members by default</p>
                    <Select
                      value={settingsForm.settings.defaultUserRole}
                      onValueChange={(val) => setSettingsForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, defaultUserRole: val },
                      }))}
                    >
                      <SelectTrigger data-testid="select-default-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="educator">Educator</SelectItem>
                        <SelectItem value="homeschool_parent">Homeschool Parent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                <Button
                  onClick={() => updateSettingsMutation.mutate(settingsForm)}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div>
            <h2 className="font-oswald text-xl">Activity Overview</h2>
            <p className="text-sm text-muted-foreground">View educator activity, login stats, and content creation metrics</p>
          </div>

          <div className="w-full max-w-sm">
            <Label htmlFor="activity-org-select" className="text-sm text-muted-foreground mb-1 block">Select an organization</Label>
            <Select value={selectedOrgForActivity} onValueChange={setSelectedOrgForActivity}>
              <SelectTrigger data-testid="select-activity-org">
                <SelectValue placeholder="Choose an organization..." />
              </SelectTrigger>
              <SelectContent>
                {(myAdminOrgs.length > 0 ? myAdminOrgs : organizations).map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedOrgForActivity ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No organization selected</p>
                <p className="text-sm text-muted-foreground mt-1">Choose an organization from the dropdown above to view activity metrics</p>
              </CardContent>
            </Card>
          ) : activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedActivityData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No activity data available</p>
                <p className="text-xs text-muted-foreground mt-1">Activity will appear once members start using the platform</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-activity">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Last Login</th>
                        <th className="text-right p-3 font-medium">Login Count</th>
                        <th className="text-right p-3 font-medium">Lessons Created</th>
                        <th className="text-right p-3 font-medium">Scopes Created</th>
                        <th className="text-left p-3 font-medium">Member Since</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedActivityData.map((row: any, idx: number) => (
                        <tr
                          key={row.userId || idx}
                          className={`border-b ${isInactive(row.lastLoginAt) ? "text-muted-foreground" : ""}`}
                          data-testid={`activity-row-${row.userId || idx}`}
                        >
                          <td className="p-3 font-medium">
                            {row.firstName || row.lastName
                              ? `${row.firstName || ""} ${row.lastName || ""}`.trim()
                              : "Unknown"}
                          </td>
                          <td className="p-3">{row.email || "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs capitalize">{row.role || "—"}</Badge>
                          </td>
                          <td className="p-3">
                            {row.lastLoginAt ? (
                              <span className={isInactive(row.lastLoginAt) ? "text-destructive" : ""}>
                                {new Date(row.lastLoginAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-destructive">Never</span>
                            )}
                          </td>
                          <td className="p-3 text-right">{row.loginCount ?? 0}</td>
                          <td className="p-3 text-right">{row.lessonCount ?? 0}</td>
                          <td className="p-3 text-right">{row.scopeCount ?? 0}</td>
                          <td className="p-3">
                            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <OrgSafetySuiteTab />
        </TabsContent>

      </Tabs>
    </div>
  );
}

function OrgSafetySuiteTab() {
  const { toast } = useToast();
  const [reviewFilter, setReviewFilter] = useState<string>("pending_review");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [auditCategory, setAuditCategory] = useState<string>("all");

  const { data: reviewStats } = useQuery<{
    pending: number;
    approved: number;
    rejected: number;
    highSeverityPending: number;
  }>({
    queryKey: ["/api/org-safety/review-queue/stats"],
  });

  const { data: reviewQueue, isLoading: queueLoading } = useQuery<{
    items: any[];
    total: number;
  }>({
    queryKey: ["/api/org-safety/review-queue", reviewFilter],
    queryFn: async () => {
      const res = await fetch(`/api/org-safety/review-queue?status=${reviewFilter}&limit=50`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<any[]>({
    queryKey: ["/api/org-safety/audit-logs", auditCategory],
    queryFn: async () => {
      const params = auditCategory !== "all" ? `?category=${auditCategory}&limit=50` : "?limit=50";
      const res = await fetch(`/api/org-safety/audit-logs${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: governance } = useQuery<{
    successLedger: { totalMarks: number; finalizedMarks: number; editWindowHours: number };
    safetyVault: { totalArchived: number; piiBlocked: number };
    coppaStatus: string;
    piiProtection: string;
  }>({
    queryKey: ["/api/org-safety/governance-status"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/org-safety/review-queue/${id}`, { action, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue/stats"] });
      toast({ title: "Review updated" });
    },
  });

  const bulkReviewMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await apiRequest("POST", "/api/org-safety/review-queue/bulk", { ids, action });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue/stats"] });
      setSelectedItems([]);
      toast({ title: `${data.updated} items updated` });
    },
  });

  const severityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-org-pending-count">{reviewStats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-org-high-severity">{reviewStats?.highSeverityPending || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-org-approved">{reviewStats?.approved || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-lys-teal" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-org-governance-marks">{governance?.successLedger.totalMarks || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Success Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-oswald">Content Review Queue</CardTitle>
              <CardDescription className="font-roboto">
                Flagged content within your organization requiring review
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedItems.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkReviewMutation.mutate({ ids: selectedItems, action: "approved" })}
                    disabled={bulkReviewMutation.isPending}
                    data-testid="button-org-bulk-approve"
                  >
                    <Shield className="h-4 w-4 mr-1" /> Approve ({selectedItems.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => bulkReviewMutation.mutate({ ids: selectedItems, action: "rejected" })}
                    disabled={bulkReviewMutation.isPending}
                    data-testid="button-org-bulk-reject"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" /> Reject ({selectedItems.length})
                  </Button>
                </>
              )}
              <Select value={reviewFilter} onValueChange={setReviewFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-org-review-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="auto_blocked">Auto-Blocked</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !reviewQueue?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground font-roboto">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No items in the {reviewFilter.replace("_", " ")} queue</p>
              <p className="text-sm mt-1">Content flagged by the keyword filter will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.items.map((item: any) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 space-y-2"
                  data-testid={`org-review-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          setSelectedItems(prev =>
                            e.target.checked
                              ? [...prev, item.id]
                              : prev.filter((id: string) => id !== item.id)
                          );
                        }}
                        data-testid={`checkbox-org-review-${item.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${severityColors[item.severity] || ""}`}>
                            {item.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.contentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-roboto">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-roboto line-clamp-3">{item.content}</p>
                        {item.flaggedKeywords?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {item.flaggedKeywords.map((kw: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.status === "pending_review" && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "approved" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-org-approve-${item.id}`}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "rejected" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-org-reject-${item.id}`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "archived" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-org-archive-${item.id}`}
                        >
                          Archive
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-oswald">Organization Audit Log</CardTitle>
              <CardDescription className="font-roboto">
                Security events and actions within your organization
              </CardDescription>
            </div>
            <Select value={auditCategory} onValueChange={setAuditCategory}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-org-audit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="admin_action">Admin Actions</SelectItem>
                <SelectItem value="content_moderation">Content Moderation</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="ai_usage">AI Usage</SelectItem>
                <SelectItem value="data_modify">Data Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !auditLogs?.length ? (
            <div className="text-center py-8 text-muted-foreground font-roboto">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No audit log entries for your organization yet</p>
              <p className="text-sm mt-1">Security events will be recorded here as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-md text-sm"
                  data-testid={`org-audit-log-${log.id}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.severity === "critical" ? "bg-red-500" :
                    log.severity === "warning" ? "bg-amber-500" : "bg-green-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium font-roboto">{log.action.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-xs">{log.category}</Badge>
                      {log.severity !== "info" && (
                        <Badge className={`text-xs ${log.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {log.severity}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-roboto">
                      {log.userId && <span>User: {log.userId} · </span>}
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald">Governance Status</CardTitle>
          <CardDescription className="font-roboto">Data governance metrics for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-oswald" data-testid="text-org-ledger-total">{governance?.successLedger.totalMarks || 0}</p>
              <p className="text-sm text-muted-foreground font-roboto">Success Marks</p>
              <p className="text-xs text-muted-foreground">{governance?.successLedger.finalizedMarks || 0} finalized</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-oswald" data-testid="text-org-vault-total">{governance?.safetyVault.totalArchived || 0}</p>
              <p className="text-sm text-muted-foreground font-roboto">Archived Messages</p>
              <p className="text-xs text-muted-foreground">{governance?.safetyVault.piiBlocked || 0} PII blocked</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Badge variant={governance?.coppaStatus === "enforced" ? "default" : "destructive"} className="mb-2">
                {governance?.coppaStatus || "unknown"}
              </Badge>
              <p className="text-sm text-muted-foreground font-roboto">COPPA Status</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Badge variant={governance?.piiProtection === "active" ? "default" : "destructive"} className="mb-2">
                {governance?.piiProtection || "unknown"}
              </Badge>
              <p className="text-sm text-muted-foreground font-roboto">PII Protection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function LessonCacheSection({ isSiteAdmin }: { isSiteAdmin?: boolean }) {
  const { toast } = useToast();

  type CacheEntry = {
    id: string;
    cacheKey: string;
    topic: string;
    course: string | null;
    gradeLevel: string;
    bkdFocus: string;
    hitCount: number | null;
    lastHitAt: string | null;
    createdAt: string | null;
    expiresAt: string | null;
  };

  type CacheData = {
    entries: CacheEntry[];
    stats: { totalEntries: number; totalHits: number; expired: number; active: number };
  };

  const { data: cacheData, isLoading } = useQuery<CacheData>({
    queryKey: ["/api/admin/lesson-cache"],
    enabled: !!isSiteAdmin,
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/lesson-cache");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lesson-cache"] });
      toast({ title: "Cache Cleared", description: "All cached lesson plans have been removed." });
    },
  });

  const clearExpiredMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/lesson-cache/expired");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lesson-cache"] });
      toast({ title: "Expired Entries Cleared", description: "Expired cache entries have been removed." });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/lesson-cache/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lesson-cache"] });
      toast({ title: "Entry Removed" });
    },
  });

  const stats = cacheData?.stats;
  const entries = cacheData?.entries || [];

  return (
    <Card data-testid="card-lesson-cache">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5 text-lys-yellow" />
              Lesson Plan Cache
            </CardTitle>
            <CardDescription>
              Cached AI-generated lesson plans to reduce duplicate API calls
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearExpiredMutation.mutate()}
              disabled={clearExpiredMutation.isPending || !stats?.expired}
              data-testid="button-clear-expired-cache"
            >
              <Clock className="h-4 w-4 mr-1" />
              Clear Expired
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending || !stats?.totalEntries}
              data-testid="button-clear-all-cache"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 bg-muted animate-pulse rounded" />
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold" data-testid="stat-cache-total">{stats.totalEntries}</p>
                <p className="text-xs text-muted-foreground">Total Cached</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold text-green-600" data-testid="stat-cache-active">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold text-lys-yellow" data-testid="stat-cache-hits">{stats.totalHits}</p>
                <p className="text-xs text-muted-foreground">Total Hits</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold text-muted-foreground" data-testid="stat-cache-expired">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>

            {entries.length > 0 && (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {entries.slice(0, 20).map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`cache-entry-${entry.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.topic}</p>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <Badge variant="secondary">{entry.gradeLevel}</Badge>
                          <Badge variant="outline">{entry.bkdFocus.toUpperCase()}</Badge>
                          {entry.course && <span>{entry.course}</span>}
                          <span>{entry.hitCount || 0} hits</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive shrink-0"
                        onClick={() => deleteEntryMutation.mutate(entry.id)}
                        data-testid={`button-delete-cache-${entry.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No cached lesson plans yet. They will appear here as educators generate lessons.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LysCanonAdminSection({ isSiteAdmin }: { isSiteAdmin?: boolean }) {
  const { toast } = useToast();
  type CanonEntry = {
    id: string;
    kind: string;
    subject: string | null;
    gradeBand: string | null;
    topic: string | null;
    title: string;
    body: string;
    sortOrder: number | null;
    isActive: boolean | null;
  };
  type TopExemplar = { masterLessonId: string; uses: number; avgScore: number };

  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    kind: "exemplar",
    subject: "_global",
    gradeBand: "",
    topic: "",
    title: "",
    body: "",
  });

  const { data: entries = [], isLoading } = useQuery<CanonEntry[]>({
    queryKey: ["/api/admin/canon-entries", filterSubject],
    queryFn: async () => {
      const url = filterSubject === "all"
        ? "/api/admin/canon-entries"
        : `/api/admin/canon-entries?subject=${encodeURIComponent(filterSubject)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load canon entries");
      return res.json();
    },
    enabled: !!isSiteAdmin,
  });

  const { data: topExemplars = [] } = useQuery<TopExemplar[]>({
    queryKey: ["/api/admin/lesson-attribution/top"],
    enabled: !!isSiteAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof draft) => {
      const res = await apiRequest("POST", "/api/admin/canon-entries", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canon-entries"] });
      toast({ title: "Canon entry created", description: "Subject version bumped — affected caches will regenerate." });
      setCreating(false);
      setDraft({ kind: "exemplar", subject: "_global", gradeBand: "", topic: "", title: "", body: "" });
    },
    onError: () => toast({ title: "Create failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/canon-entries/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canon-entries"] });
      toast({ title: "Canon entry removed" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/canon-entries/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canon-entries"] });
    },
  });

  const subjectOptions = [
    { value: "all", label: "All subjects" },
    { value: "_global", label: "Global (all subjects)" },
    { value: "math", label: "Math" },
    { value: "ela", label: "ELA" },
    { value: "science", label: "Science" },
    { value: "social_studies", label: "Social Studies" },
  ];
  const kindOptions = ["exemplar", "vocab", "domain", "accommodation"];

  return (
    <Card data-testid="card-lys-canon-admin">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-lys-yellow" />
              LYS Canon (Bricks/BKD reference)
            </CardTitle>
            <CardDescription>
              Manage the canonical exemplars, vocabulary, and accommodations the AI lesson generator pulls from. Edits auto-bump the subject's cache version.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-44" data-testid="select-canon-subject-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreating(v => !v)}
              data-testid="button-toggle-create-canon"
            >
              <Plus className="h-4 w-4 mr-1" />
              {creating ? "Cancel" : "New entry"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Active only when the <code className="font-mono">new_lesson_retrieval</code> feature flag is on. With the flag off, the legacy hardcoded reference is used and these edits are inert. Toggle the flag from the <strong>Feature Flags</strong> tab.
          </AlertDescription>
        </Alert>

        {creating && (
          <div className="border rounded-md p-4 space-y-3 bg-muted/30">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <div>
                <Label className="text-xs">Kind</Label>
                <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v })}>
                  <SelectTrigger data-testid="select-canon-kind"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kindOptions.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Select value={draft.subject} onValueChange={(v) => setDraft({ ...draft, subject: v })}>
                  <SelectTrigger data-testid="select-canon-subject"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {subjectOptions.filter(o => o.value !== "all").map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Grade band (optional)</Label>
                <Input
                  value={draft.gradeBand}
                  onChange={(e) => setDraft({ ...draft, gradeBand: e.target.value })}
                  placeholder="e.g. 6-8"
                  data-testid="input-canon-grade-band"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Short, descriptive title"
                data-testid="input-canon-title"
              />
            </div>
            <div>
              <Label className="text-xs">Body</Label>
              <Textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={5}
                placeholder="The reference text the AI will see in the prompt block."
                data-testid="textarea-canon-body"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => createMutation.mutate(draft)}
                disabled={createMutation.isPending || !draft.title || !draft.body}
                data-testid="button-create-canon"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save entry
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-24 bg-muted animate-pulse rounded" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No canon entries for this filter. The hardcoded reference auto-seeds on first boot — try the "All subjects" filter.
          </p>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-md border"
                  data-testid={`canon-entry-${entry.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary">{entry.kind}</Badge>
                      {entry.subject && <Badge variant="outline">{entry.subject}</Badge>}
                      {entry.gradeBand && <Badge variant="outline">{entry.gradeBand}</Badge>}
                      {!entry.isActive && <Badge variant="destructive">inactive</Badge>}
                    </div>
                    <p className="text-sm font-medium truncate" data-testid={`text-canon-title-${entry.id}`}>{entry.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.body}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActiveMutation.mutate({ id: entry.id, isActive: !entry.isActive })}
                      data-testid={`button-toggle-canon-${entry.id}`}
                      title={entry.isActive ? "Deactivate" : "Activate"}
                    >
                      <ToggleLeft className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          data-testid={`button-delete-canon-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent data-testid={`dialog-confirm-delete-canon-${entry.id}`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove canon entry?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This deletes <span className="font-medium">{entry.title}</span> from the LYS canon and bumps the
                            {entry.subject ? ` "${entry.subject}"` : " global"} subject version, which will invalidate matching cached lessons. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-cancel-delete-canon-${entry.id}`}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(entry.id)}
                            data-testid={`button-confirm-delete-canon-${entry.id}`}
                          >
                            Delete entry
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {topExemplars.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-lys-yellow" />
              <h4 className="text-sm font-medium">Top exemplars by attribution</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Master lessons most frequently used as exemplars, ranked by average final rubric score.</p>
            <div className="space-y-1">
              {topExemplars.slice(0, 10).map(ex => (
                <div
                  key={ex.masterLessonId}
                  className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                  data-testid={`exemplar-${ex.masterLessonId}`}
                >
                  <code className="font-mono truncate">{ex.masterLessonId}</code>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground">{ex.uses} uses</span>
                    <Badge variant="secondary">avg {Math.round(ex.avgScore)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
