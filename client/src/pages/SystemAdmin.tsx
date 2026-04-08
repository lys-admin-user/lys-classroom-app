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
import { useState, useEffect, useCallback } from "react";
import { 
  Shield, Building2, Users, Trash2, BarChart3, AlertTriangle, Loader2, 
  TrendingUp, CreditCard, Share2, BookOpen, Target, UserCheck, 
  Eye, Edit2, Search, ChevronLeft, ChevronRight, Map, GraduationCap, DollarSign,
  Activity, Globe, FileText, Award, Zap, ExternalLink, UserCog, Library, Plus,
  Server, Database, Cpu, HardDrive, Wifi, Lock, Monitor, Code2, Layers, Check,
  MapPin, Upload, X, Headphones, Video, Rss, RefreshCw, Clock, CheckCircle, XCircle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Organization, User as UserType, Lesson, Authority, SystemLessonAuthor, MasterLesson, ContentLibraryItem } from "@shared/schema";

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

interface UserAnalyticsEntry {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  tier: string | null;
  profileImageUrl: string | null;
  joinDate: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  lastActivityDate: string;
  daysSinceJoin: number;
  daysSinceLastLogin: number | null;
  daysSinceLastActivity: number;
  status: "active" | "at_risk" | "churned" | "new" | "inactive";
  isPaid: boolean;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  onboardingCompleted: boolean | null;
  educatorType: string | null;
  country: string | null;
  state: string | null;
  organizationCount: number;
  usage: {
    totalActions: number;
    activeDays: number;
    engagementRate: number;
    lessonsCreated: number;
    lessonsLast30Days: number;
    aiLessonsGenerated: number;
    aiLessonsLast30Days: number;
    goalsCreated: number;
    goalsLast30Days: number;
    goalsCompleted: number;
    assignmentsCreated: number;
    assignmentsLast30Days: number;
    scopeSequencesCreated: number;
    selfDiscoveryCompleted: number;
    careersExplored: number;
    journeyEntries: number;
  };
  journey: { beScore: number | null; knowScore: number | null; doScore: number | null; overallScore: number | null } | null;
  affiliate: { referralCode: string; totalPoints: number | null; totalReferrals: number | null; isActive: boolean | null } | null;
}

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  atRiskUsers: number;
  churnedUsers: number;
  newUsers: number;
  inactiveUsers: number;
  paidUsers: number;
  churnRate: number;
  monthlyChurnRate: number;
  estimatedBurnRate: number;
  estimatedMRR: number;
  runwayMonths: number;
  conversionRate: number;
  onboardingRate: number;
  dauMauRatio: number;
  avgLoginCount: number;
  cohorts: { month: string; totalJoined: number; stillActive: number; retentionRate: number }[];
  featureAdoption: Record<string, { users: number; rate: number }>;
  tierBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
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

export default function SystemAdminPage({ params }: { params?: { tab?: string } }) {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const activeTab = params?.tab || "overview";

  const handleTabChange = useCallback((value: string) => {
    if (value !== activeTab) {
      setTimeout(() => {
        setLocation(value === "overview" ? "/system-admin" : `/system-admin/${value}`);
      }, 0);
    }
  }, [setLocation, activeTab]);
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

  const [isCreateAuthorityOpen, setIsCreateAuthorityOpen] = useState(false);
  const [editingAuthority, setEditingAuthority] = useState<Authority | null>(null);
  const [newAuthority, setNewAuthority] = useState({ 
    code: "", 
    name: "", 
    level: "national" as const, 
    modelType: "bottom_heavy" as const, 
    country: "US",
    parentId: null as string | null
  });

  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [authorSpecializations, setAuthorSpecializations] = useState<string[]>([]);
  const [authorBio, setAuthorBio] = useState("");
  
  const [lessonStatusFilter, setLessonStatusFilter] = useState<string>("all");
  const [lessonSubjectFilter, setLessonSubjectFilter] = useState<string>("all");
  
  const [analyticsSearch, setAnalyticsSearch] = useState("");
  const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState<string>("all");
  const [analyticsTierFilter, setAnalyticsTierFilter] = useState<string>("all");
  const [analyticsRoleFilter, setAnalyticsRoleFilter] = useState<string>("all");
  const [analyticsSortBy, setAnalyticsSortBy] = useState<string>("lastActivity");
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughPage, setWalkthroughPage] = useState(0);
  const [tierConfirmOpen, setTierConfirmOpen] = useState(false);
  const [tierConfirmData, setTierConfirmData] = useState<{ userId: string; updates: Partial<UserType>; suggestedTier: string } | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([]);
  const [bulkUploadAllLessons, setBulkUploadAllLessons] = useState<any[]>([]);
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    contentType: "pdf" as string,
    source: "",
    author: "",
    subjects: [] as string[],
    gradeLevels: [] as string[],
    tags: [] as string[]
  });

  const { data: adminCheck, isLoading: checkLoading } = useQuery<{ isSiteAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  useEffect(() => {
    if (adminCheck?.isSiteAdmin) {
      const seen = localStorage.getItem("lys_admin_walkthrough_seen");
      if (!seen) {
        setShowWalkthrough(true);
      }
    }
  }, [adminCheck?.isSiteAdmin]);

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
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter && userRoleFilter !== "all") params.set("role", userRoleFilter);
      if (userTierFilter && userTierFilter !== "all") params.set("tier", userTierFilter);
      const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: Failed to fetch users`);
      return res.json();
    },
  });

  const { data: affiliates = [], isLoading: affiliatesLoading } = useQuery<EnrichedAffiliate[]>({
    queryKey: ["/api/admin/affiliates"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "affiliates",
  });

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery<{ lessons: (Lesson & { author?: string; authorEmail?: string })[]; total: number }>({
    queryKey: ["/api/admin/lessons", lessonSearch],
    enabled: adminCheck?.isSiteAdmin && activeTab === "content",
    queryFn: async () => {
      const params = new URLSearchParams();
      if (lessonSearch) params.set("search", lessonSearch);
      const url = `/api/admin/lessons${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: Failed to fetch lessons`);
      return res.json();
    },
  });

  const { data: billingData } = useQuery<BillingData>({
    queryKey: ["/api/admin/billing"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "billing",
  });

  const { data: userAnalyticsData, isLoading: userAnalyticsLoading } = useQuery<{
    users: UserAnalyticsEntry[];
    platformMetrics: PlatformMetrics;
  }>({
    queryKey: ["/api/admin/user-analytics"],
    enabled: adminCheck?.isSiteAdmin && activeTab === "user-analytics",
    refetchInterval: 60000,
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
      setTierConfirmOpen(false);
      setTierConfirmData(null);
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const SUBSCRIPTION_TO_TIER: Record<string, string> = {
    active: "pro",
    trialing: "pro",
    past_due: "pro",
    canceled: "free",
    incomplete: "free",
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    const newSubStatus = editUserData.subscriptionStatus;
    const currentTier = selectedUser.tier;
    const suggestedTier = newSubStatus ? SUBSCRIPTION_TO_TIER[newSubStatus] : null;
    const paymentChanged =
      editUserData.stripeCustomerId !== selectedUser.stripeCustomerId ||
      editUserData.stripeSubscriptionId !== (selectedUser as any).stripeSubscriptionId ||
      newSubStatus !== selectedUser.subscriptionStatus;
    if (paymentChanged && suggestedTier && suggestedTier !== currentTier && !editUserData.tier) {
      setTierConfirmData({ userId: selectedUser.id, updates: editUserData, suggestedTier });
      setTierConfirmOpen(true);
    } else {
      updateUserMutation.mutate({ id: selectedUser.id, updates: editUserData });
    }
  };

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

  type EnrichedAuthor = SystemLessonAuthor & { user?: { firstName: string | null; lastName: string | null; email: string | null } };

  const { data: authorities = [], isLoading: authoritiesLoading } = useQuery<Authority[]>({
    queryKey: ["/api/authorities"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: lessonAuthors = [], isLoading: authorsLoading } = useQuery<EnrichedAuthor[]>({
    queryKey: ["/api/admin/lesson-authors"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: masterLessons = [], isLoading: masterLessonsLoading } = useQuery<MasterLesson[]>({
    queryKey: ["/api/admin/master-lessons"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: contentLibrary = [], isLoading: contentLoading } = useQuery<ContentLibraryItem[]>({
    queryKey: ["/api/admin/content-library"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: allUsers = [] } = useQuery<Array<{ id: string; email: string | null; firstName: string | null; lastName: string | null }>>({
    queryKey: ["/api/users"],
    enabled: adminCheck?.isSiteAdmin && isAddAuthorOpen,
  });

  const filteredMasterLessons = masterLessons.filter(lesson => {
    if (lessonStatusFilter !== "all" && lesson.status !== lessonStatusFilter) return false;
    if (lessonSubjectFilter !== "all" && lesson.subject !== lessonSubjectFilter) return false;
    return true;
  });

  const filteredContent = contentLibrary.filter(item => {
    if (contentTypeFilter !== "all" && item.contentType !== contentTypeFilter) return false;
    return true;
  });

  const createAuthorityMutation = useMutation({
    mutationFn: async (data: typeof newAuthority) => {
      return await apiRequest("POST", "/api/authorities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorities"] });
      setIsCreateAuthorityOpen(false);
      setNewAuthority({ code: "", name: "", level: "national", modelType: "bottom_heavy", country: "US", parentId: null });
      toast({ title: "Authority created" });
    },
    onError: () => {
      toast({ title: "Failed to create authority", variant: "destructive" });
    },
  });

  const updateAuthorityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Authority> }) => {
      return await apiRequest("PATCH", `/api/authorities/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorities"] });
      setEditingAuthority(null);
      toast({ title: "Authority updated" });
    },
    onError: () => {
      toast({ title: "Failed to update authority", variant: "destructive" });
    },
  });

  const createAuthorMutation = useMutation({
    mutationFn: async (data: { userId: string; specializations: string[]; bio: string }) => {
      return await apiRequest("POST", "/api/admin/lesson-authors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lesson-authors"] });
      setIsAddAuthorOpen(false);
      setSelectedUserId("");
      setAuthorSpecializations([]);
      setAuthorBio("");
      toast({ title: "Lesson author added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add lesson author", variant: "destructive" });
    },
  });

  const removeAuthorMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/lesson-authors/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lesson-authors"] });
      toast({ title: "Lesson author removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove author", variant: "destructive" });
    },
  });

  const approveLessonMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/master-lessons/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-lessons"] });
      toast({ title: "Lesson approved" });
    },
    onError: () => {
      toast({ title: "Failed to approve lesson", variant: "destructive" });
    },
  });

  const rejectLessonMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest("POST", `/api/admin/master-lessons/${id}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-lessons"] });
      toast({ title: "Lesson rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject lesson", variant: "destructive" });
    },
  });

  const createContentMutation = useMutation({
    mutationFn: async (data: typeof newContent) => {
      return await apiRequest("POST", "/api/admin/content-library", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-library"] });
      setIsAddContentOpen(false);
      setNewContent({ title: "", description: "", contentType: "pdf", source: "", author: "", subjects: [], gradeLevels: [], tags: [] });
      toast({ title: "Content added to library" });
    },
    onError: () => {
      toast({ title: "Failed to add content", variant: "destructive" });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/content-library/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-library"] });
      toast({ title: "Content removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove content", variant: "destructive" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ fileName, fileType, lessons }: { fileName: string; fileType: string; lessons: any[] }) => {
      return await apiRequest("POST", "/api/admin/bulk-imports", { fileName, fileType, lessons });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/master-lessons"] });
      setIsBulkUploadOpen(false);
      setBulkUploadFile(null);
      setBulkUploadPreview([]);
      setBulkUploadAllLessons([]);
      setBulkUploadErrors([]);
      const errors = data.errors || [];
      if (errors.length > 0) {
        toast({ 
          title: "Import completed with errors", 
          description: `${data.successCount || 0} imported, ${data.errorCount || 0} failed. Check console for details.`,
          variant: "destructive"
        });
        console.log("Import errors:", errors);
      } else {
        toast({ 
          title: "Bulk import completed", 
          description: `${data.successCount || 0} lessons imported successfully` 
        });
      }
    },
    onError: () => {
      toast({ title: "Failed to import lessons", variant: "destructive" });
    },
  });

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    const lessons: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCSVLine(lines[i]);
      const lesson: any = {};
      headers.forEach((header, idx) => {
        const val = (values[idx] || '').replace(/^"|"$/g, '');
        if (header === 'objectives' || header === 'materials' || header === 'tags') {
          lesson[header] = val ? val.split(';').map((v: string) => v.trim()).filter(Boolean) : [];
        } else if (header === 'activities') {
          lesson[header] = val ? val.split(';').map((v: string) => ({ title: v.trim(), description: v.trim(), duration: '15 min', type: 'activity' })).filter((a: any) => a.title) : [];
        } else {
          lesson[header] = val;
        }
      });
      lessons.push(lesson);
    }
    return lessons;
  };

  const validateLessons = (lessons: any[]): { valid: any[]; errors: string[] } => {
    const valid: any[] = [];
    const errors: string[] = [];
    lessons.forEach((lesson, idx) => {
      const missing: string[] = [];
      if (!lesson.title?.trim()) missing.push('title');
      if (!lesson.topic?.trim()) missing.push('topic');
      if (!lesson.subject?.trim()) missing.push('subject');
      if (!lesson.gradeLevel?.trim()) missing.push('gradeLevel');
      if (missing.length > 0) {
        errors.push(`Row ${idx + 1}: Missing ${missing.join(', ')}`);
      } else {
        valid.push(lesson);
      }
    });
    return { valid, errors };
  };

  const handleBulkUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploadFile(file);
    setBulkUploadErrors([]);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let lessons: any[] = [];
        
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          lessons = Array.isArray(parsed) ? parsed : (parsed.lessons || []);
        } else if (file.name.endsWith('.csv')) {
          lessons = parseCSV(content);
        }
        
        const { valid, errors } = validateLessons(lessons);
        setBulkUploadAllLessons(valid);
        setBulkUploadPreview(valid.slice(0, 5));
        setBulkUploadErrors(errors);
      } catch (error) {
        toast({ title: "Failed to parse file", description: "Please check file format", variant: "destructive" });
        setBulkUploadPreview([]);
        setBulkUploadAllLessons([]);
        setBulkUploadErrors([]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkUploadSubmit = () => {
    if (!bulkUploadFile || bulkUploadAllLessons.length === 0) return;
    
    bulkUploadMutation.mutate({
      fileName: bulkUploadFile.name,
      fileType: bulkUploadFile.name.endsWith('.json') ? 'json' : 'csv',
      lessons: bulkUploadAllLessons
    });
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      supranational: "Supranational (UN/EU)",
      national: "National",
      regional_state: "Regional/State",
      local_district: "Local/District",
      school: "School"
    };
    return labels[level] || level;
  };

  const getModelLabel = (model: string) => {
    const labels: Record<string, string> = {
      bottom_heavy: "US Style (Local Control)",
      top_down_unitary: "Centralized National",
      federal_hybrid: "Federal Hybrid"
    };
    return labels[model] || model;
  };

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
              You need system administrator privileges to access this page. This area is reserved for platform-wide management. Contact a system administrator if you need access.
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
        <div className="flex-1">
          <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
            System Administration
          </h1>
          <p className="font-roboto text-muted-foreground">
            Manage all users, organizations, billing, content, educational standards, and platform-wide settings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 hidden sm:flex"
          onClick={() => { setWalkthroughPage(0); setShowWalkthrough(true); }}
          data-testid="button-open-walkthrough"
        >
          <BookOpen className="h-4 w-4" />
          Admin Guide
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
          <TabsTrigger value="authorities" className="gap-2" data-testid="tab-authorities">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Global Authorities</span>
          </TabsTrigger>
          <TabsTrigger value="lesson-authors" className="gap-2" data-testid="tab-lesson-authors">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Lesson Authors</span>
          </TabsTrigger>
          <TabsTrigger value="lesson-repository" className="gap-2" data-testid="tab-lesson-repository">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Lesson Repository</span>
          </TabsTrigger>
          <TabsTrigger value="content-hub" className="gap-2" data-testid="tab-content-hub">
            <Rss className="h-4 w-4" />
            <span className="hidden sm:inline">Content Hub</span>
          </TabsTrigger>
          <TabsTrigger value="content-library" className="gap-2" data-testid="tab-content-library">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Content Library</span>
          </TabsTrigger>
          <TabsTrigger value="user-analytics" className="gap-2" data-testid="tab-user-analytics">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">User Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="gap-2" data-testid="tab-safety">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Safety Suite</span>
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-2" data-testid="tab-governance">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Data Governance</span>
          </TabsTrigger>
          <TabsTrigger value="trials" className="gap-2" data-testid="tab-trials">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Trials</span>
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
                                handleTabChange(tab);
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
          <div>
            <h2 className="font-oswald text-xl">All Users</h2>
            <p className="text-sm text-muted-foreground mb-4">Search, view, and manage every user account on the platform. You can edit roles, tiers, and account details.</p>
          </div>
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
                              setEditUserData({ tier: u.tier, role: u.role, email: u.email, firstName: u.firstName, lastName: u.lastName, stripeCustomerId: u.stripeCustomerId, stripeSubscriptionId: u.stripeSubscriptionId, subscriptionStatus: u.subscriptionStatus });
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
              <Separator />
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Information</Label>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Stripe Customer ID</Label>
                    {editUserData.stripeCustomerId && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${editUserData.stripeCustomerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        data-testid="link-stripe-customer-dashboard"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View in Stripe
                      </a>
                    )}
                  </div>
                  <Input
                    value={editUserData.stripeCustomerId || ""}
                    onChange={(e) => setEditUserData({ ...editUserData, stripeCustomerId: e.target.value })}
                    placeholder="cus_..."
                    data-testid="input-edit-stripe-customer-id"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Stripe Subscription ID</Label>
                  <Input
                    value={editUserData.stripeSubscriptionId || ""}
                    onChange={(e) => setEditUserData({ ...editUserData, stripeSubscriptionId: e.target.value })}
                    placeholder="sub_..."
                    data-testid="input-edit-stripe-subscription-id"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Subscription Status</Label>
                  <Select value={editUserData.subscriptionStatus || "none"} onValueChange={(v) => setEditUserData({ ...editUserData, subscriptionStatus: v === "none" ? null : v })}>
                    <SelectTrigger data-testid="select-edit-subscription-status">
                      <SelectValue placeholder="No subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subscription</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleSaveUser}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tier update confirmation dialog */}
          <Dialog open={tierConfirmOpen} onOpenChange={setTierConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Update User Tier?
                </DialogTitle>
                <DialogDescription>
                  You've set the subscription status to <strong>{tierConfirmData?.updates.subscriptionStatus}</strong>. Based on this, the recommended tier is <strong className="capitalize">{tierConfirmData?.suggestedTier}</strong>. Would you like to update this user's tier as well?
                </DialogDescription>
              </DialogHeader>
              <div className="py-2 text-sm text-muted-foreground">
                <p>Current tier: <span className="font-semibold capitalize">{selectedUser?.tier || "free"}</span></p>
                <p>Suggested tier: <span className="font-semibold capitalize">{tierConfirmData?.suggestedTier}</span></p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => {
                  if (tierConfirmData) {
                    updateUserMutation.mutate({ id: tierConfirmData.userId, updates: tierConfirmData.updates });
                  }
                }} data-testid="button-tier-confirm-skip">
                  Save Without Changing Tier
                </Button>
                <Button onClick={() => {
                  if (tierConfirmData) {
                    updateUserMutation.mutate({ id: tierConfirmData.userId, updates: { ...tierConfirmData.updates, tier: tierConfirmData.suggestedTier as any } });
                  }
                }} data-testid="button-tier-confirm-apply">
                  Update Tier to {tierConfirmData?.suggestedTier}
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
            <div>
              <h2 className="font-oswald text-xl">All Organizations</h2>
              <p className="text-sm text-muted-foreground">View every school, district, and university registered on the platform</p>
            </div>
            <Button onClick={() => setLocation("/admin")} data-testid="button-manage-orgs">
              Go to Campus Admin
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No organizations registered yet</p>
                <p className="text-sm text-muted-foreground mt-1">Schools, districts, and universities will appear here once they register on the platform</p>
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
                      <Badge variant="outline" className="capitalize">{org.type === "charter_network" ? "Charter Network" : org.type}</Badge>
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
          <div>
            <h2 className="font-oswald text-xl">Lesson Content</h2>
            <p className="text-sm text-muted-foreground mb-4">Browse and manage all lessons created by educators across the platform</p>
          </div>
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
            <div>
              <h2 className="font-oswald text-xl">Affiliate Program</h2>
              <p className="text-sm text-muted-foreground">Track educator referrals, reward points, and affiliate performance</p>
            </div>
          </div>

          {affiliatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : affiliates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No affiliates yet</p>
                <p className="text-sm text-muted-foreground mt-1">Educators who join the affiliate program and refer others will appear here</p>
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
            <div>
              <h2 className="font-oswald text-xl">Billing & Subscriptions</h2>
              <p className="text-sm text-muted-foreground">Monitor subscription plans, pricing tiers, and payment activity across the platform</p>
            </div>
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
            <div>
              <h2 className="font-oswald text-xl">Educational Standards & Jurisdictions</h2>
              <p className="text-sm text-muted-foreground">Manage state and regional educational standards that are used in lesson generation and alignment</p>
            </div>
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

        <TabsContent value="authorities" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Global Authority Tree</h2>
              <p className="text-sm text-muted-foreground">Manage educational governance systems worldwide</p>
            </div>
            <Dialog open={isCreateAuthorityOpen} onOpenChange={setIsCreateAuthorityOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-authority">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Authority
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Educational Authority</DialogTitle>
                  <DialogDescription>
                    Create a new educational authority in the global hierarchy.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="authority-code">Authority Code</Label>
                    <Input
                      id="authority-code"
                      value={newAuthority.code}
                      onChange={(e) => setNewAuthority({ ...newAuthority, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                      placeholder="US-TEA"
                      data-testid="input-authority-code"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="authority-name">Name</Label>
                    <Input
                      id="authority-name"
                      value={newAuthority.name}
                      onChange={(e) => setNewAuthority({ ...newAuthority, name: e.target.value })}
                      placeholder="Texas Education Agency"
                      data-testid="input-authority-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="authority-country">Country Code</Label>
                    <Input
                      id="authority-country"
                      value={newAuthority.country}
                      onChange={(e) => setNewAuthority({ ...newAuthority, country: e.target.value.toUpperCase().slice(0, 2) })}
                      placeholder="US"
                      maxLength={2}
                      data-testid="input-authority-country"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="authority-level">Hierarchy Level</Label>
                    <Select
                      value={newAuthority.level}
                      onValueChange={(value: any) => setNewAuthority({ ...newAuthority, level: value })}
                    >
                      <SelectTrigger data-testid="select-authority-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supranational">Supranational (UN/EU)</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="regional_state">Regional/State</SelectItem>
                        <SelectItem value="local_district">Local/District</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="authority-model">Governance Model</Label>
                    <Select
                      value={newAuthority.modelType}
                      onValueChange={(value: any) => setNewAuthority({ ...newAuthority, modelType: value })}
                    >
                      <SelectTrigger data-testid="select-authority-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom_heavy">US Style (Strong Local Control)</SelectItem>
                        <SelectItem value="top_down_unitary">Centralized National Curriculum</SelectItem>
                        <SelectItem value="federal_hybrid">Federal Hybrid (EU/Canada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {authorities.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="authority-parent">Parent Authority (Optional)</Label>
                      <Select
                        value={newAuthority.parentId || "none"}
                        onValueChange={(value) => setNewAuthority({ ...newAuthority, parentId: value === "none" ? null : value })}
                      >
                        <SelectTrigger data-testid="select-authority-parent">
                          <SelectValue placeholder="Select parent..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Parent (Top Level)</SelectItem>
                          {authorities.map((auth) => (
                            <SelectItem key={auth.id} value={auth.id}>
                              {auth.name} ({getLevelLabel(auth.level)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateAuthorityOpen(false)} data-testid="button-cancel-authority">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createAuthorityMutation.mutate(newAuthority)}
                    disabled={!newAuthority.code || !newAuthority.name || createAuthorityMutation.isPending}
                    data-testid="button-submit-authority"
                  >
                    {createAuthorityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {authoritiesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : authorities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No educational authorities configured</p>
                <p className="text-sm text-muted-foreground">Add authorities to define the global educational governance hierarchy</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {authorities.map((auth) => (
                <Card key={auth.id} data-testid={`card-authority-${auth.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-lys-teal/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-lys-teal" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{auth.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span className="font-mono">{auth.code}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{auth.country}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{getLevelLabel(auth.level)}</Badge>
                      <Badge variant="secondary">{getModelLabel(auth.modelType || "bottom_heavy")}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingAuthority(auth)}
                        data-testid={`button-edit-authority-${auth.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {auth.parentId && (
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Parent:</span>
                        <Badge variant="outline" className="font-normal">
                          {authorities.find(a => a.id === auth.parentId)?.name || auth.parentId}
                        </Badge>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingAuthority} onOpenChange={(open) => !open && setEditingAuthority(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Authority</DialogTitle>
                <DialogDescription>Update the educational authority settings.</DialogDescription>
              </DialogHeader>
              {editingAuthority && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Authority Code</Label>
                    <Input value={editingAuthority.code || ""} disabled className="bg-muted" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-authority-name">Name</Label>
                    <Input
                      id="edit-authority-name"
                      value={editingAuthority.name}
                      onChange={(e) => setEditingAuthority({ ...editingAuthority, name: e.target.value })}
                      data-testid="input-edit-authority-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-authority-model">Governance Model</Label>
                    <Select
                      value={editingAuthority.modelType || "bottom_heavy"}
                      onValueChange={(value: any) => setEditingAuthority({ ...editingAuthority, modelType: value })}
                    >
                      <SelectTrigger data-testid="select-edit-authority-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom_heavy">US Style (Strong Local Control)</SelectItem>
                        <SelectItem value="top_down_unitary">Centralized National Curriculum</SelectItem>
                        <SelectItem value="federal_hybrid">Federal Hybrid (EU/Canada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">Enable this authority</p>
                    </div>
                    <Switch
                      checked={editingAuthority.isActive ?? true}
                      onCheckedChange={(checked) => setEditingAuthority({ ...editingAuthority, isActive: checked })}
                      data-testid="switch-edit-authority-active"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingAuthority(null)} data-testid="button-cancel-edit-authority">
                  Cancel
                </Button>
                <Button
                  onClick={() => editingAuthority && updateAuthorityMutation.mutate({
                    id: editingAuthority.id,
                    updates: {
                      name: editingAuthority.name,
                      modelType: editingAuthority.modelType,
                      isActive: editingAuthority.isActive,
                    }
                  })}
                  disabled={updateAuthorityMutation.isPending}
                  data-testid="button-submit-edit-authority"
                >
                  {updateAuthorityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="lesson-authors" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">System-Level Lesson Authors</h2>
              <p className="text-sm text-muted-foreground">Educators authorized to create master lessons that influence AI-generated content across the <strong>entire system</strong>. Campus-level authors are managed by campus admins.</p>
            </div>
            <Dialog open={isAddAuthorOpen} onOpenChange={setIsAddAuthorOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-add-author">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Author
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add System Lesson Author</DialogTitle>
                  <DialogDescription>
                    Grant an educator permission to create master lessons that influence AI-generated content.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="author-user">Select Educator</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger data-testid="select-author-user">
                        <SelectValue placeholder="Choose an educator..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.filter(u => !lessonAuthors.some(a => a.userId === u.id)).map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="author-specializations">Specializations (comma-separated)</Label>
                    <Input
                      id="author-specializations"
                      placeholder="e.g., math, elementary, stem"
                      onChange={(e) => setAuthorSpecializations(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                      data-testid="input-author-specializations"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="author-bio">Bio (optional)</Label>
                    <Textarea
                      id="author-bio"
                      placeholder="Brief description of the author's expertise..."
                      value={authorBio}
                      onChange={(e) => setAuthorBio(e.target.value)}
                      data-testid="input-author-bio"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createAuthorMutation.mutate({ userId: selectedUserId, specializations: authorSpecializations, bio: authorBio })}
                    disabled={!selectedUserId || createAuthorMutation.isPending}
                    data-testid="button-submit-author"
                  >
                    {createAuthorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Author
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {authorsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : lessonAuthors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No lesson authors yet. Add your first author to start building the master lesson repository.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {lessonAuthors.map((author) => (
                <Card key={author.id} data-testid={`author-card-${author.userId}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-lys-teal/20 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-lys-teal" />
                        </div>
                        <div>
                          <p className="font-semibold">{author.user?.firstName} {author.user?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{author.user?.email}</p>
                          {author.specializations && author.specializations.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {author.specializations.map(spec => (
                                <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">{author.lessonsCreated || 0}</p>
                          <p className="text-xs text-muted-foreground">Lessons Created</p>
                        </div>
                        <Badge variant={author.status === "active" ? "default" : "secondary"}>
                          {author.status}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeAuthorMutation.mutate(author.userId)}
                          data-testid={`button-remove-author-${author.userId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lesson-repository" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Master Lesson Repository</h2>
              <p className="text-sm text-muted-foreground">Authoritative lessons that influence AI-generated content across the platform</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={lessonStatusFilter} onValueChange={setLessonStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-lesson-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={lessonSubjectFilter} onValueChange={setLessonSubjectFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-lesson-subject">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-bulk-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Lessons</DialogTitle>
                    <DialogDescription>
                      Upload a CSV or JSON file containing lesson data. Lessons will be imported for review.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-file">Upload File (CSV or JSON)</Label>
                      <Input
                        id="bulk-file"
                        type="file"
                        accept=".csv,.json"
                        onChange={handleBulkUploadFileChange}
                        className="mt-2"
                        data-testid="input-bulk-file"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV columns: title, topic, subject, gradeLevel, gradeBand, bkdFocus, duration, assessment, objectives (semicolon-separated), materials (semicolon-separated), tags (semicolon-separated)
                      </p>
                    </div>
                    {bulkUploadFile && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">File: {bulkUploadFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bulkUploadAllLessons.length} valid lessons ready to import
                          {bulkUploadErrors.length > 0 && `, ${bulkUploadErrors.length} with errors`}
                        </p>
                        {bulkUploadErrors.length > 0 && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                            <p className="text-xs text-destructive font-medium mb-1">Validation Errors (will be skipped):</p>
                            <div className="space-y-0.5 max-h-24 overflow-y-auto">
                              {bulkUploadErrors.slice(0, 5).map((err, idx) => (
                                <p key={idx} className="text-xs text-destructive">{err}</p>
                              ))}
                              {bulkUploadErrors.length > 5 && (
                                <p className="text-xs text-destructive">...and {bulkUploadErrors.length - 5} more</p>
                              )}
                            </div>
                          </div>
                        )}
                        {bulkUploadPreview.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-2">Preview (first {Math.min(5, bulkUploadPreview.length)} valid records):</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {bulkUploadPreview.map((lesson, idx) => (
                                <div key={idx} className="text-xs p-2 bg-background rounded border">
                                  <strong>{lesson.title}</strong> - {lesson.subject} / Grade {lesson.gradeLevel}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleBulkUploadSubmit}
                      disabled={!bulkUploadFile || bulkUploadAllLessons.length === 0 || bulkUploadMutation.isPending}
                      data-testid="button-submit-bulk"
                    >
                      {bulkUploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      Import {bulkUploadAllLessons.length} Lesson{bulkUploadAllLessons.length !== 1 ? 's' : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {masterLessonsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredMasterLessons.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No lessons found. Lesson authors can create master lessons that will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredMasterLessons.map((lesson) => (
                  <Card key={lesson.id} data-testid={`lesson-card-${lesson.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <Badge variant={
                              lesson.status === "approved" ? "default" :
                              lesson.status === "pending_review" ? "secondary" :
                              lesson.status === "draft" ? "outline" : "secondary"
                            }>
                              {lesson.status === "pending_review" ? "Pending Review" : lesson.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description || lesson.topic}</p>
                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <Badge variant="outline">{lesson.subject}</Badge>
                            <Badge variant="outline">{lesson.gradeLevel}</Badge>
                            <Badge variant="outline" className="capitalize">{lesson.bkdFocus}</Badge>
                            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Quality: {lesson.qualityScore || 0}%</span>
                            <span>Used: {lesson.usageCount || 0} times</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.status === "pending_review" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveLessonMutation.mutate({ id: lesson.id })}
                                disabled={approveLessonMutation.isPending}
                                data-testid={`button-approve-${lesson.id}`}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectLessonMutation.mutate({ id: lesson.id, notes: "Needs revision" })}
                                disabled={rejectLessonMutation.isPending}
                                data-testid={`button-reject-${lesson.id}`}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" data-testid={`button-view-${lesson.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="content-library" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">Content Library</h2>
              <p className="text-sm text-muted-foreground">PDFs, eBooks, podcasts, and videos that influence AI lesson generation</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-content-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="ebook">eBook</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="youtube_channel">YouTube Channel</SelectItem>
                  <SelectItem value="youtube_video">YouTube Video</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-add-content">
                    <Upload className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Content to Library</DialogTitle>
                    <DialogDescription>
                      Add educational content that will be used to enhance AI lesson generation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                      <Label htmlFor="content-title">Title</Label>
                      <Input
                        id="content-title"
                        value={newContent.title}
                        onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                        placeholder="Content title"
                        data-testid="input-content-title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content-type">Content Type</Label>
                      <Select value={newContent.contentType} onValueChange={(v) => setNewContent({ ...newContent, contentType: v })}>
                        <SelectTrigger data-testid="select-new-content-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="ebook">eBook</SelectItem>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="podcast">Podcast</SelectItem>
                          <SelectItem value="youtube_channel">YouTube Channel</SelectItem>
                          <SelectItem value="youtube_video">YouTube Video</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="research_paper">Research Paper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content-source">Source URL</Label>
                      <Input
                        id="content-source"
                        value={newContent.source}
                        onChange={(e) => setNewContent({ ...newContent, source: e.target.value })}
                        placeholder="https://..."
                        data-testid="input-content-source"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content-author">Author</Label>
                      <Input
                        id="content-author"
                        value={newContent.author}
                        onChange={(e) => setNewContent({ ...newContent, author: e.target.value })}
                        placeholder="Original author"
                        data-testid="input-content-author"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="content-description">Description</Label>
                      <Textarea
                        id="content-description"
                        value={newContent.description}
                        onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                        placeholder="Brief description of the content..."
                        data-testid="input-content-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createContentMutation.mutate(newContent)}
                      disabled={!newContent.title || createContentMutation.isPending}
                      data-testid="button-submit-content"
                    >
                      {createContentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Content
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {contentLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No content in library yet. Add PDFs, eBooks, podcasts, or YouTube content to enhance AI generation.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((item) => (
                <Card key={item.id} data-testid={`content-card-${item.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {item.contentType === "pdf" && <FileText className="h-5 w-5" />}
                        {item.contentType === "ebook" && <BookOpen className="h-5 w-5" />}
                        {item.contentType === "book" && <BookOpen className="h-5 w-5" />}
                        {item.contentType === "podcast" && <Headphones className="h-5 w-5" />}
                        {(item.contentType === "youtube_channel" || item.contentType === "youtube_video") && <Video className="h-5 w-5" />}
                        {item.contentType === "article" && <FileText className="h-5 w-5" />}
                        {item.contentType === "research_paper" && <FileText className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                        {item.author && <p className="text-xs text-muted-foreground">by {item.author}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{item.contentType.replace("_", " ")}</Badge>
                          <Badge variant={item.processingStatus === "completed" ? "default" : item.processingStatus === "failed" ? "destructive" : "secondary"} className="text-xs">
                            {item.processingStatus === "completed" ? "Ready" : item.processingStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Used {item.usageCount || 0} times</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => deleteContentMutation.mutate(item.id)}
                        data-testid={`button-delete-content-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="user-analytics" className="space-y-6">
          {userAnalyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : userAnalyticsData ? (
            <>
              <div>
                <h2 className="font-oswald text-xl">User Analytics Dashboard</h2>
                <p className="text-sm text-muted-foreground">Granular metrics for every user including churn rate, engagement, usage patterns, and revenue data.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-visible">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Churn Rate</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-churn">{userAnalyticsData.platformMetrics.monthlyChurnRate}%</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Overall: {userAnalyticsData.platformMetrics.churnRate}%</p>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Burn Rate</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-burn-rate">${userAnalyticsData.platformMetrics.estimatedBurnRate}/mo</p>
                      </div>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">MRR: ${userAnalyticsData.platformMetrics.estimatedMRR.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-conversion-rate">{userAnalyticsData.platformMetrics.conversionRate}%</p>
                      </div>
                      <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{userAnalyticsData.platformMetrics.paidUsers} paid users</p>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">DAU/MAU Ratio</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-dau-mau">{userAnalyticsData.platformMetrics.dauMauRatio}%</p>
                      </div>
                      <Activity className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Avg logins: {userAnalyticsData.platformMetrics.avgLoginCount}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="overflow-visible">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Active</p>
                        <p className="text-lg font-bold text-foreground">{userAnalyticsData.platformMetrics.activeUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">New</p>
                        <p className="text-lg font-bold text-foreground">{userAnalyticsData.platformMetrics.newUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">At Risk</p>
                        <p className="text-lg font-bold text-foreground">{userAnalyticsData.platformMetrics.atRiskUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Inactive</p>
                        <p className="text-lg font-bold text-foreground">{userAnalyticsData.platformMetrics.inactiveUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-visible">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Churned</p>
                        <p className="text-lg font-bold text-foreground">{userAnalyticsData.platformMetrics.churnedUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="overflow-visible">
                  <CardHeader>
                    <CardTitle className="text-base font-oswald">Cohort Retention</CardTitle>
                    <CardDescription>Monthly sign-up cohorts and their retention rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userAnalyticsData.platformMetrics.cohorts.map(c => (
                        <div key={c.month} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-20 shrink-0">{c.month}</span>
                          <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                            <div 
                              className="bg-lys-teal h-full rounded-full transition-all" 
                              style={{ width: `${c.retentionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-20 text-right shrink-0">{c.stillActive}/{c.totalJoined} ({c.retentionRate}%)</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-visible">
                  <CardHeader>
                    <CardTitle className="text-base font-oswald">Feature Adoption</CardTitle>
                    <CardDescription>Percentage of users who have used each feature</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(userAnalyticsData.platformMetrics.featureAdoption).map(([feature, data]) => (
                        <div key={feature}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-sm text-muted-foreground">{data.users} users ({data.rate}%)</span>
                          </div>
                          <div className="bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-lys-yellow h-full rounded-full transition-all" style={{ width: `${data.rate}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-visible">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-base font-oswald">Individual User Metrics</CardTitle>
                      <CardDescription>Click any user to see granular details</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Onboarding: {userAnalyticsData.platformMetrics.onboardingRate}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={analyticsSearch}
                        onChange={(e) => { setAnalyticsSearch(e.target.value); setAnalyticsPage(1); }}
                        className="pl-9"
                        data-testid="input-analytics-search"
                      />
                    </div>
                    <Select value={analyticsStatusFilter} onValueChange={(v) => { setAnalyticsStatusFilter(v); setAnalyticsPage(1); }}>
                      <SelectTrigger className="w-[130px]" data-testid="select-analytics-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="churned">Churned</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={analyticsTierFilter} onValueChange={(v) => { setAnalyticsTierFilter(v); setAnalyticsPage(1); }}>
                      <SelectTrigger className="w-[120px]" data-testid="select-analytics-tier">
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
                    <Select value={analyticsRoleFilter} onValueChange={(v) => { setAnalyticsRoleFilter(v); setAnalyticsPage(1); }}>
                      <SelectTrigger className="w-[140px]" data-testid="select-analytics-role">
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
                    <Select value={analyticsSortBy} onValueChange={setAnalyticsSortBy}>
                      <SelectTrigger className="w-[150px]" data-testid="select-analytics-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lastActivity">Last Activity</SelectItem>
                        <SelectItem value="joinDate">Join Date</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="totalActions">Total Actions</SelectItem>
                        <SelectItem value="loginCount">Login Count</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(() => {
                    let filtered = userAnalyticsData.users;
                    if (analyticsSearch) {
                      const s = analyticsSearch.toLowerCase();
                      filtered = filtered.filter(u => 
                        u.email?.toLowerCase().includes(s) ||
                        u.firstName?.toLowerCase().includes(s) ||
                        u.lastName?.toLowerCase().includes(s)
                      );
                    }
                    if (analyticsStatusFilter !== "all") filtered = filtered.filter(u => u.status === analyticsStatusFilter);
                    if (analyticsTierFilter !== "all") filtered = filtered.filter(u => u.tier === analyticsTierFilter);
                    if (analyticsRoleFilter !== "all") filtered = filtered.filter(u => u.role === analyticsRoleFilter);
                    
                    filtered = [...filtered].sort((a, b) => {
                      switch (analyticsSortBy) {
                        case "joinDate": return new Date(b.joinDate || 0).getTime() - new Date(a.joinDate || 0).getTime();
                        case "engagement": return b.usage.engagementRate - a.usage.engagementRate;
                        case "totalActions": return b.usage.totalActions - a.usage.totalActions;
                        case "loginCount": return b.loginCount - a.loginCount;
                        default: return a.daysSinceLastActivity - b.daysSinceLastActivity;
                      }
                    });

                    const statusColors: Record<string, string> = {
                      active: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
                      new: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
                      at_risk: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
                      inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30",
                      churned: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
                    };

                    const perPage = 10;
                    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
                    const safePage = Math.min(analyticsPage, totalPages);
                    const startIdx = (safePage - 1) * perPage;
                    const paged = filtered.slice(startIdx, startIdx + perPage);

                    return (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground mb-3">{filtered.length} users</p>
                        {paged.map(u => (
                          <div key={u.id} data-testid={`analytics-user-${u.id}`}>
                            <button
                              type="button"
                              className="w-full text-left p-3 rounded-md border hover-elevate transition-colors"
                              onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                              data-testid={`button-expand-user-${u.id}`}
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  {u.profileImageUrl ? (
                                    <img src={u.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-medium text-muted-foreground">{(u.firstName?.[0] || "?").toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{u.firstName} {u.lastName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                                <Badge variant="outline" className={`text-xs border ${statusColors[u.status] || ""}`}>
                                  {u.status === "at_risk" ? "At Risk" : u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                                </Badge>
                                <Badge variant="outline" className="capitalize text-xs">{u.role}</Badge>
                                <Badge className={getTierColor(u.tier)} >{u.tier}</Badge>
                                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                                  <span title="Days since join">{u.daysSinceJoin}d old</span>
                                  <span title="Last active">{u.daysSinceLastActivity === 0 ? "Today" : `${u.daysSinceLastActivity}d ago`}</span>
                                  <span title="Total actions">{u.usage.totalActions} actions</span>
                                  <span title="Engagement rate">{u.usage.engagementRate}% engaged</span>
                                </div>
                                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${expandedUserId === u.id ? "rotate-90" : ""}`} />
                              </div>
                            </button>

                            {expandedUserId === u.id && (
                              <div className="ml-4 mr-2 mt-1 mb-3 p-4 border rounded-md bg-muted/30 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Account Info</p>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="text-muted-foreground">Joined:</span> {u.joinDate ? new Date(u.joinDate).toLocaleDateString() : "N/A"}</p>
                                      <p><span className="text-muted-foreground">Last Login:</span> {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}</p>
                                      <p><span className="text-muted-foreground">Login Count:</span> {u.loginCount}</p>
                                      <p><span className="text-muted-foreground">Days on Platform:</span> {u.daysSinceJoin}</p>
                                      <p><span className="text-muted-foreground">Onboarding:</span> {u.onboardingCompleted ? "Completed" : "Incomplete"}</p>
                                      {u.educatorType && <p><span className="text-muted-foreground">Educator Type:</span> {u.educatorType}</p>}
                                      {u.country && <p><span className="text-muted-foreground">Location:</span> {u.state ? `${u.state}, ` : ""}{u.country}</p>}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Engagement</p>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="text-muted-foreground">Engagement Rate:</span> {u.usage.engagementRate}%</p>
                                      <p><span className="text-muted-foreground">Active Days:</span> {u.usage.activeDays}</p>
                                      <p><span className="text-muted-foreground">Total Actions:</span> {u.usage.totalActions}</p>
                                      <p><span className="text-muted-foreground">Last Activity:</span> {u.daysSinceLastActivity === 0 ? "Today" : `${u.daysSinceLastActivity} days ago`}</p>
                                      <p><span className="text-muted-foreground">Days Since Login:</span> {u.daysSinceLastLogin !== null ? u.daysSinceLastLogin : "N/A"}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Content & Usage</p>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="text-muted-foreground">Lessons Created:</span> {u.usage.lessonsCreated} <span className="text-xs text-muted-foreground">({u.usage.lessonsLast30Days} last 30d)</span></p>
                                      <p><span className="text-muted-foreground">AI Generations:</span> {u.usage.aiLessonsGenerated} <span className="text-xs text-muted-foreground">({u.usage.aiLessonsLast30Days} last 30d)</span></p>
                                      <p><span className="text-muted-foreground">Assignments:</span> {u.usage.assignmentsCreated} <span className="text-xs text-muted-foreground">({u.usage.assignmentsLast30Days} last 30d)</span></p>
                                      <p><span className="text-muted-foreground">Goals:</span> {u.usage.goalsCreated} ({u.usage.goalsCompleted} completed)</p>
                                      <p><span className="text-muted-foreground">Scope & Sequences:</span> {u.usage.scopeSequencesCreated}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Be-Know-Do & Revenue</p>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="text-muted-foreground">Self-Discovery:</span> {u.usage.selfDiscoveryCompleted} completed</p>
                                      <p><span className="text-muted-foreground">Careers Explored:</span> {u.usage.careersExplored}</p>
                                      <p><span className="text-muted-foreground">Journey Entries:</span> {u.usage.journeyEntries}</p>
                                      {u.journey && (
                                        <p><span className="text-muted-foreground">BKD Scores:</span> B:{u.journey.beScore || 0} K:{u.journey.knowScore || 0} D:{u.journey.doScore || 0}</p>
                                      )}
                                      <p><span className="text-muted-foreground">Subscription:</span> {u.subscriptionStatus || "none"}</p>
                                      {u.isPaid && <p><span className="text-muted-foreground">Stripe ID:</span> {u.stripeCustomerId ? "Connected" : "None"}</p>}
                                      {u.affiliate && (
                                        <p><span className="text-muted-foreground">Affiliate:</span> {u.affiliate.totalReferrals || 0} referrals, {u.affiliate.totalPoints || 0} pts</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between gap-4 pt-3 flex-wrap">
                            <p className="text-sm text-muted-foreground">
                              Showing {startIdx + 1}–{Math.min(startIdx + perPage, filtered.length)} of {filtered.length} users
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={safePage <= 1}
                                onClick={() => setAnalyticsPage(safePage - 1)}
                                data-testid="button-analytics-prev"
                              >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous</span>
                              </Button>
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
                                  acc.push(p);
                                  return acc;
                                }, [])
                                .map((p, i) =>
                                  p === "ellipsis" ? (
                                    <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">...</span>
                                  ) : (
                                    <Button
                                      key={p}
                                      variant={p === safePage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setAnalyticsPage(p)}
                                      data-testid={`button-analytics-page-${p}`}
                                    >
                                      {p}
                                    </Button>
                                  )
                                )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={safePage >= totalPages}
                                onClick={() => setAnalyticsPage(safePage + 1)}
                                data-testid="button-analytics-next"
                              >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <SafetySuiteTab />
        </TabsContent>
        <TabsContent value="governance" className="space-y-6">
          <DataGovernanceTab />
        </TabsContent>

        <TabsContent value="content-hub" className="space-y-6">
          <ContentHubTab />
        </TabsContent>

        <TabsContent value="trials" className="space-y-6">
          <TrialMonitoringTab />
        </TabsContent>
      </Tabs>

      {/* Admin Walkthrough / Guide Dialog */}
      {(() => {
        const pages = [
          {
            icon: <Shield className="h-10 w-10 text-lys-red" />,
            title: "Welcome, System Administrator",
            subtitle: "Your role & responsibilities",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>As a <strong>System Admin</strong>, you have the highest level of access on the LYS platform — second only to the platform owner. This guide covers everything you can do and how to do it safely.</p>
                <p>You can return to this guide at any time using the <strong>Admin Guide</strong> button in the top-right corner of this page.</p>
                <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-amber-800 dark:text-amber-300 font-medium text-xs">Important: Actions taken here affect all users and the entire platform. Always double-check before deleting data or changing user roles.</p>
                </div>
              </div>
            ),
          },
          {
            icon: <Users className="h-10 w-10 text-blue-500" />,
            title: "Users Tab",
            subtitle: "Search, edit, create, and delete users",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>The <strong>Users</strong> tab lets you manage every account on the platform.</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Search & Filter</strong> — find users by name, email, role, or tier</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Edit User</strong> — update name, email, role, tier, and Stripe payment information</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Create User</strong> — manually add users with any role and tier</span></li>
                  <li className="flex gap-2"><XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /><span><strong>Delete User</strong> — permanently removes the account, all their lessons, and goals. This cannot be undone.</span></li>
                </ul>
                <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-blue-800 dark:text-blue-300 text-xs">Tip: When editing a user's Stripe Customer ID, a "View in Stripe" link appears so you can open their Stripe dashboard record directly.</p>
                </div>
              </div>
            ),
          },
          {
            icon: <CreditCard className="h-10 w-10 text-green-500" />,
            title: "Payment Management",
            subtitle: "Managing Stripe data for users",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Inside each user's <strong>Edit</strong> dialog, you'll find a <strong>Payment Information</strong> section with three fields:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Stripe Customer ID</strong> (cus_...) — links this user to a Stripe customer record. Click "View in Stripe" to open it directly in your Stripe dashboard.</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Stripe Subscription ID</strong> (sub_...) — the specific subscription record in Stripe for this user.</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Subscription Status</strong> — active, trialing, past_due, canceled, or incomplete.</span></li>
                </ul>
                <p>When you change a user's subscription status, the system will ask whether you'd also like to update their <strong>access tier</strong> to match (e.g., active → Pro, canceled → Free). You choose.</p>
              </div>
            ),
          },
          {
            icon: <Building2 className="h-10 w-10 text-purple-500" />,
            title: "Organizations",
            subtitle: "Schools, districts, and campuses",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>The <strong>Organizations</strong> tab shows all schools, districts, and universities on the platform.</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>View all organizations and their type (school, district, university)</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>See member counts and active status</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>Delete organizations when needed (removes org but not the individual users)</span></li>
                </ul>
              </div>
            ),
          },
          {
            icon: <BarChart3 className="h-10 w-10 text-orange-500" />,
            title: "Analytics & Billing",
            subtitle: "Platform metrics and pricing tiers",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>The <strong>Overview</strong> tab shows a live snapshot of platform health: total users, active users, content created, and organizations.</p>
                <p>The <strong>Billing</strong> tab lets you view and edit the platform's pricing tiers — name, price, billing period, description, and whether they're active/visible to users.</p>
                <p>The <strong>User Analytics</strong> tab gives a detailed breakdown of every user's engagement: login frequency, lessons created, AI usage, goals, and their engagement rate.</p>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs">Analytics refresh automatically every 30 seconds while you're on this page.</p>
                </div>
              </div>
            ),
          },
          {
            icon: <Globe className="h-10 w-10 text-teal-500" />,
            title: "Standards, Authorities & Content",
            subtitle: "Educational infrastructure",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>These tabs let you manage the educational framework that powers lesson alignment:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Standards</strong> — manage state/national standards by jurisdiction</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Global Authorities</strong> — configure educational governing bodies (national, regional, local)</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Lesson Repository</strong> — manage the master lesson library available to all educators</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Content Library</strong> — curated resources (PDFs, videos, links) available platform-wide</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Content Hub</strong> — approve or reject RSS-sourced content for display to users</span></li>
                </ul>
              </div>
            ),
          },
          {
            icon: <Lock className="h-10 w-10 text-red-500" />,
            title: "Safety, Governance & Data",
            subtitle: "Platform safety and data management",
            content: (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>The final set of tabs covers platform safety and infrastructure:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Safety Suite</strong> — review flagged content and take moderation actions</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Data Sync</strong> — monitor BLS data sync status and manual refresh</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Technical Specs</strong> — view the platform's technical architecture and stack information</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Trials</strong> — manage and monitor free trial access across the platform</span></li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span><strong>Affiliates</strong> — track referral activity and affiliate performance</span></li>
                </ul>
                <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 p-3">
                  <p className="text-green-800 dark:text-green-300 text-xs font-medium">You can reopen this guide anytime via the "Admin Guide" button at the top of this page.</p>
                </div>
              </div>
            ),
          },
        ];
        const currentPage = pages[walkthroughPage];
        const isLast = walkthroughPage === pages.length - 1;
        return (
          <Dialog open={showWalkthrough} onOpenChange={(open) => {
            if (!open) {
              localStorage.setItem("lys_admin_walkthrough_seen", "true");
            }
            setShowWalkthrough(open);
          }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <div className="flex flex-col items-center text-center gap-3 pb-2">
                  {currentPage.icon}
                  <div>
                    <DialogTitle className="text-xl font-marker">{currentPage.title}</DialogTitle>
                    <DialogDescription className="text-sm mt-1">{currentPage.subtitle}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-2">{currentPage.content}</div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setWalkthroughPage(i)}
                      className={`h-2 rounded-full transition-all ${i === walkthroughPage ? "w-6 bg-lys-red" : "w-2 bg-muted-foreground/30"}`}
                      data-testid={`walkthrough-dot-${i}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {walkthroughPage > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setWalkthroughPage(w => w - 1)} data-testid="button-walkthrough-prev">
                      Back
                    </Button>
                  )}
                  {isLast ? (
                    <Button size="sm" onClick={() => {
                      localStorage.setItem("lys_admin_walkthrough_seen", "true");
                      setShowWalkthrough(false);
                    }} data-testid="button-walkthrough-done">
                      Done
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setWalkthroughPage(w => w + 1)} data-testid="button-walkthrough-next">
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
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
        { label: "Tables", value: "100+ tables covering users, lessons, organizations, standards, careers, portfolios, gradebook, journeys, scholarships, and more" },
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
        { label: "RBAC", value: "7-role hierarchy: student < homeschool_parent < educator < campus_admin < district_admin < site_admin < system_admin" },
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
        { label: "Admin Scoping", value: "My Campus (org/admin/flags), My District (multi-campus), System-Wide Admin (platform config/content)" },
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
              <p className="text-2xl font-bold font-oswald text-lys-red">100+</p>
              <p className="text-xs text-muted-foreground">Database Tables</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald text-lys-yellow">47</p>
              <p className="text-xs text-muted-foreground">Pages / Routes</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald text-lys-teal">430+</p>
              <p className="text-xs text-muted-foreground">API Endpoints</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold font-oswald">7</p>
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

function SafetySuiteTab() {
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
    queryKey: ["/api/admin/review-queue/stats"],
  });

  const { data: reviewQueue, isLoading: queueLoading } = useQuery<{
    items: any[];
    total: number;
  }>({
    queryKey: ["/api/admin/review-queue", reviewFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/review-queue?status=${reviewFilter}&limit=50`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/audit-logs", auditCategory],
    queryFn: async () => {
      const params = auditCategory !== "all" ? `?category=${auditCategory}&limit=50` : "?limit=50";
      const res = await fetch(`/api/admin/audit-logs${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/review-queue/${id}`, { action, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-queue/stats"] });
      toast({ title: "Review updated" });
    },
  });

  const bulkReviewMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await apiRequest("POST", "/api/admin/review-queue/bulk", { ids, action });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/review-queue/stats"] });
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold font-oswald">{reviewStats?.pending || 0}</p>
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
                <p className="text-2xl font-bold font-oswald">{reviewStats?.highSeverityPending || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold font-oswald">{reviewStats?.approved || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold font-oswald">{reviewStats?.rejected || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-oswald">Content Review Queue</CardTitle>
              <CardDescription className="font-roboto">
                Flagged content requiring administrator review
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkReviewMutation.mutate({ ids: selectedItems, action: "approved" })}
                    disabled={bulkReviewMutation.isPending}
                    data-testid="button-bulk-approve"
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve ({selectedItems.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => bulkReviewMutation.mutate({ ids: selectedItems, action: "rejected" })}
                    disabled={bulkReviewMutation.isPending}
                    data-testid="button-bulk-reject"
                  >
                    <X className="h-4 w-4 mr-1" /> Reject ({selectedItems.length})
                  </Button>
                </>
              )}
              <Select value={reviewFilter} onValueChange={setReviewFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-review-filter">
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
                  data-testid={`review-item-${item.id}`}
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
                              : prev.filter(id => id !== item.id)
                          );
                        }}
                        data-testid={`checkbox-review-${item.id}`}
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
                        {item.context && (
                          <p className="text-xs text-muted-foreground mt-1 font-roboto">Context: {item.context}</p>
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
                          data-testid={`button-approve-${item.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "rejected" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-reject-${item.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "archived" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-archive-${item.id}`}
                        >
                          Archive
                        </Button>
                      </div>
                    )}
                    {item.reviewedBy && (
                      <span className="text-xs text-muted-foreground font-roboto">
                        Reviewed {new Date(item.reviewedAt).toLocaleDateString()}
                      </span>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-oswald">Audit Log</CardTitle>
              <CardDescription className="font-roboto">
                Security events and administrative actions
              </CardDescription>
            </div>
            <Select value={auditCategory} onValueChange={setAuditCategory}>
              <SelectTrigger className="w-[180px]" data-testid="select-audit-category">
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
              <p>No audit log entries yet</p>
              <p className="text-sm mt-1">Security events will be recorded here as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-md text-sm"
                  data-testid={`audit-log-${log.id}`}
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
                      {log.ipAddress && <span>IP: {log.ipAddress} · </span>}
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
          <CardTitle className="font-oswald">Safety Features Status</CardTitle>
          <CardDescription className="font-roboto">Current security and safety measures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Content Keyword Filter", status: "Active", description: "Scans messages for harmful content" },
              { label: "PII Stripping for AI", status: "Active", description: "Removes personal data before AI processing" },
              { label: "Rate Limiting", status: "Active", description: "200 req/15min API, 5 req/min AI generation" },
              { label: "Security Headers (Helmet)", status: "Active", description: "XSS, clickjacking, MIME-type protection" },
              { label: "COPPA Ad Filtering", status: "Active", description: "No ads for students K-7 grade" },
              { label: "Parental Consent System", status: "Active", description: "Under-13 accounts require parent verification" },
              { label: "Audit Logging", status: "Active", description: "All security events are recorded" },
              { label: "Role-Based Access Control", status: "Active", description: "7-role hierarchical permission system" },
              { label: "Session Security", status: "Active", description: "HTTP-only cookies with secure flag" },
              { label: "Input Validation", status: "Active", description: "Zod schema validation on all API inputs" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium font-roboto text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground font-roboto">{feature.description}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs text-green-700 border-green-300 shrink-0">
                  {feature.status}
                </Badge>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold font-oswald mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Self-Hosting Security Checklist
            </h4>
            <p className="text-sm text-muted-foreground font-roboto mb-2">
              When moving to your own infrastructure, ensure these additional measures are in place:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground font-roboto">
              <li>• SSL/TLS certificates (Let's Encrypt or commercial CA)</li>
              <li>• Database encryption at rest and in transit</li>
              <li>• Environment variable / secrets management (HashiCorp Vault, AWS Secrets Manager)</li>
              <li>• WAF (Web Application Firewall) for DDoS and injection protection</li>
              <li>• Separate auth provider (Clerk, Auth0) with MFA support</li>
              <li>• Row-Level Security (RLS) on PostgreSQL for tenant isolation</li>
              <li>• GDPR/NDPR data residency compliance for international regions</li>
              <li>• Automated security scanning (OWASP ZAP, Snyk)</li>
              <li>• Backup and disaster recovery with tested restore procedures</li>
              <li>• VPN guardrail to prevent GeoIP pricing spoofing</li>
              <li>• Log aggregation service (Datadog, Elastic, CloudWatch)</li>
              <li>• Penetration testing before production launch</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DataGovernanceTab() {
  const { data: governance, isLoading } = useQuery<{
    successLedger: { totalMarks: number; finalizedMarks: number; editWindowHours: number };
    safetyVault: { totalArchived: number; piiBlocked: number };
    fraudProtection: { totalStrikes: number; unresolvedStrikes: number; strikeThreshold: number };
    rules: { id: number; name: string; status: string; description: string }[];
  }>({
    queryKey: ["/api/admin/governance-status"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const statusColor = (status: string) =>
    status === "active" ? "bg-green-100 text-green-700 border-green-300" :
    status === "stub" ? "bg-amber-100 text-amber-700 border-amber-300" :
    "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Zero-Trust Data Governance
          </CardTitle>
          <CardDescription className="font-roboto">
            Hard-coded platform laws enforced at API and database levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold font-oswald">{governance?.successLedger.totalMarks || 0}</p>
                    <p className="text-sm text-muted-foreground font-roboto">Success Marks</p>
                    <p className="text-xs text-muted-foreground">{governance?.successLedger.finalizedMarks || 0} finalized</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-2xl font-bold font-oswald">{governance?.safetyVault.totalArchived || 0}</p>
                    <p className="text-sm text-muted-foreground font-roboto">Vault Messages</p>
                    <p className="text-xs text-muted-foreground">{governance?.safetyVault.piiBlocked || 0} PII blocked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold font-oswald">{governance?.fraudProtection.unresolvedStrikes || 0}</p>
                    <p className="text-sm text-muted-foreground font-roboto">Fraud Strikes</p>
                    <p className="text-xs text-muted-foreground">{governance?.fraudProtection.totalStrikes || 0} total ({governance?.fraudProtection.strikeThreshold || 3}-strike rule)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h3 className="font-oswald text-lg font-semibold mb-3">Governance Rules</h3>
          <div className="space-y-3">
            {governance?.rules.map((rule) => (
              <div key={rule.id} className="flex items-start gap-3 p-4 border rounded-lg" data-testid={`governance-rule-${rule.id}`}>
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${rule.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium font-roboto">Rule {rule.id}: {rule.name}</p>
                    <Badge className={`text-xs ${statusColor(rule.status)}`}>{rule.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-roboto mt-1">{rule.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald">Success Ledger Details</CardTitle>
          <CardDescription className="font-roboto">Immutable student success tracking with 24-hour edit window</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium font-roboto">Edit Window</p>
                <p className="text-2xl font-bold font-oswald">{governance?.successLedger.editWindowHours || 24}h</p>
                <p className="text-xs text-muted-foreground font-roboto">After submission, educators can correct clerical errors within 1,440 minutes</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium font-roboto">Post-Window Edits</p>
                <p className="text-sm font-roboto text-muted-foreground mt-1">Require signed "Audit Reason" permanently attached to the student's longitudinal record</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium font-roboto">Deletion Policy</p>
                <p className="text-sm font-roboto text-muted-foreground mt-1">No deletion allowed. Archive hides from UI only. Data retained for 10-year predictive engine.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald">Communication Safety</CardTitle>
          <CardDescription className="font-roboto">Real-time PII scrubbing and cross-tenant lockdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="font-medium font-roboto text-sm mb-2">PII Interception Patterns</p>
              <ul className="text-sm text-muted-foreground font-roboto space-y-1">
                <li>• Phone numbers (domestic & international)</li>
                <li>• Home addresses (street patterns)</li>
                <li>• Email addresses</li>
                <li>• Social Security Numbers</li>
                <li>• Social media handles (@username)</li>
                <li>• Instagram, Snapchat, TikTok URLs</li>
              </ul>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="font-medium font-roboto text-sm mb-2">Tenant Isolation</p>
              <ul className="text-sm text-muted-foreground font-roboto space-y-1">
                <li>• Students cannot message outside their school/district</li>
                <li>• Cross-tenant requires Super Admin "Global Project" flag</li>
                <li>• All metadata (IP, timestamp, device) logged</li>
                <li>• Chat deletions are soft-deletes only (Safety Vault)</li>
                <li>• Full archive retained for legal compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald">VPN & Fraud Protection</CardTitle>
          <CardDescription className="font-roboto">3-strike rule for GeoIP/Payment region mismatches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium font-roboto text-sm">3-Strike Rule</p>
                <p className="text-sm text-muted-foreground font-roboto mt-1">
                  If GeoIP location and Payment Region mismatch for 3 consecutive sessions, 
                  the AI features ("Master Builder") are disabled until the user verifies their location. 
                  This prevents pricing arbitrage while maintaining access to basic portfolio tools.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TrialAdminActions() {
  const { toast } = useToast();
  const [grantUserId, setGrantUserId] = useState("");
  const [grantDays, setGrantDays] = useState("10");
  const [revokeUserId, setRevokeUserId] = useState("");

  const grantMutation = useMutation({
    mutationFn: (data: { userId: string; durationDays: number }) =>
      apiRequest("POST", "/api/admin/trial/grant", data),
    onSuccess: () => {
      toast({ title: "Trial Granted", description: `A fresh ${grantDays}-day trial has been issued.` });
      setGrantUserId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-stats"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to grant trial", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (data: { userId: string }) =>
      apiRequest("POST", "/api/admin/trial/revoke", data),
    onSuccess: () => {
      toast({ title: "Trial Revoked", description: "The user's active trial has been deactivated." });
      setRevokeUserId("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trial-stats"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to revoke trial", variant: "destructive" });
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-base font-oswald flex items-center gap-2 text-green-700 dark:text-green-400">
            <Zap className="h-4 w-4" />
            Grant Trial
          </CardTitle>
          <CardDescription className="font-roboto">Issue or refresh a 10-day trial for any user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="font-roboto text-sm">User ID</Label>
            <Input
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
              placeholder="Enter user ID..."
              data-testid="input-grant-user-id"
            />
          </div>
          <div className="space-y-1">
            <Label className="font-roboto text-sm">Duration (days)</Label>
            <Input
              type="number"
              min="1"
              max="365"
              value={grantDays}
              onChange={(e) => setGrantDays(e.target.value)}
              data-testid="input-grant-days"
            />
          </div>
          <Button
            onClick={() => grantMutation.mutate({ userId: grantUserId.trim(), durationDays: Number(grantDays) })}
            disabled={!grantUserId.trim() || grantMutation.isPending}
            className="w-full"
            data-testid="button-grant-trial"
          >
            {grantMutation.isPending ? "Granting..." : "Grant Trial"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-base font-oswald flex items-center gap-2 text-red-700 dark:text-red-400">
            <Lock className="h-4 w-4" />
            Revoke Trial
          </CardTitle>
          <CardDescription className="font-roboto">Immediately deactivate a user's active trial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="font-roboto text-sm">User ID</Label>
            <Input
              value={revokeUserId}
              onChange={(e) => setRevokeUserId(e.target.value)}
              placeholder="Enter user ID..."
              data-testid="input-revoke-user-id"
            />
          </div>
          <Button
            variant="destructive"
            onClick={() => revokeMutation.mutate({ userId: revokeUserId.trim() })}
            disabled={!revokeUserId.trim() || revokeMutation.isPending}
            className="w-full"
            data-testid="button-revoke-trial"
          >
            {revokeMutation.isPending ? "Revoking..." : "Revoke Trial"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TrialMonitoringTab() {
  const { data: trialStats, isLoading } = useQuery<{
    totalTrials: number;
    activeTrials: number;
    expiredTrials: number;
    boundTrials: number;
    unboundTrials: number;
    abuseFlagged: number;
    uniqueIPs: number;
    recentTrials: Array<{
      id: string;
      ipAddress: string;
      userId: string | null;
      fingerprint: string | null;
      trialStartDate: string;
      trialEndDate: string;
      isActive: boolean;
      abuseFlags: number;
      createdAt: string;
    }>;
    conversionRate: number;
  }>({
    queryKey: ["/api/admin/trial-stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = trialStats || {
    totalTrials: 0, activeTrials: 0, expiredTrials: 0,
    boundTrials: 0, unboundTrials: 0, abuseFlagged: 0,
    uniqueIPs: 0, recentTrials: [], conversionRate: 0,
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold font-oswald" data-testid="text-trial-title">Free Trial Monitoring</h3>
          <p className="text-sm text-muted-foreground font-roboto">10-day Pro-level trial system with abuse prevention</p>
        </div>
        <Badge variant="outline" className="gap-1" data-testid="badge-active-trials">
          <Zap className="h-3 w-3" />
          {stats.activeTrials} Active
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold font-oswald" data-testid="text-total-trials">{stats.totalTrials}</p>
              <p className="text-xs text-muted-foreground font-roboto">Total Trials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold font-oswald text-green-600" data-testid="text-active-trials">{stats.activeTrials}</p>
              <p className="text-xs text-muted-foreground font-roboto">Active Trials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold font-oswald text-blue-600" data-testid="text-bound-trials">{stats.boundTrials}</p>
              <p className="text-xs text-muted-foreground font-roboto">User-Bound</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold font-oswald text-amber-600" data-testid="text-abuse-flagged">{stats.abuseFlagged}</p>
              <p className="text-xs text-muted-foreground font-roboto">Abuse Flagged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-oswald">Trial Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Expired Trials</span>
              <span className="font-medium font-roboto">{stats.expiredTrials}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Unbound (IP-only)</span>
              <span className="font-medium font-roboto">{stats.unboundTrials}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Unique IPs</span>
              <span className="font-medium font-roboto">{stats.uniqueIPs}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Trial → Paid Conversion</span>
              <span className="font-medium font-roboto">{stats.conversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-oswald">System Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Trial Duration</span>
              <Badge variant="secondary">10 days</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Access Level</span>
              <Badge variant="secondary">Pro Tier</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Trials per IP</span>
              <Badge variant="secondary">1 per user (system_admin unlimited)</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-roboto text-muted-foreground">Abuse Prevention</span>
              <Badge variant="secondary">IP + Fingerprint + User ID</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-oswald">Recent Trials</CardTitle>
          <CardDescription className="font-roboto">Latest trial activations across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentTrials.length === 0 ? (
            <p className="text-sm text-muted-foreground font-roboto text-center py-6" data-testid="text-no-trials">No trials recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-trials">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-roboto font-medium">IP Address</th>
                    <th className="text-left py-2 font-roboto font-medium">User Bound</th>
                    <th className="text-left py-2 font-roboto font-medium">Started</th>
                    <th className="text-left py-2 font-roboto font-medium">Expires</th>
                    <th className="text-left py-2 font-roboto font-medium">Status</th>
                    <th className="text-left py-2 font-roboto font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTrials.map((trial) => (
                    <tr key={trial.id} className="border-b last:border-0" data-testid={`row-trial-${trial.id}`}>
                      <td className="py-2 font-mono text-xs">{trial.ipAddress.length > 12 ? trial.ipAddress.substring(0, 12) + "..." : trial.ipAddress}</td>
                      <td className="py-2">
                        {trial.userId ? (
                          <Badge variant="default" className="text-xs">Bound</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">IP Only</Badge>
                        )}
                      </td>
                      <td className="py-2 font-roboto text-muted-foreground">
                        {new Date(trial.trialStartDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 font-roboto text-muted-foreground">
                        {new Date(trial.trialEndDate).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        {trial.isActive && new Date(trial.trialEndDate) > new Date() ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Expired</Badge>
                        )}
                      </td>
                      <td className="py-2">
                        {trial.abuseFlags > 0 ? (
                          <Badge variant="destructive" className="text-xs">{trial.abuseFlags} flags</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-base font-semibold font-oswald mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Trial Management (System Admin Only)
        </h3>
        <TrialAdminActions />
      </div>
    </>
  );
}

function ContentHubTab() {
  const { toast } = useToast();
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [feedName, setFeedName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [feedType, setFeedType] = useState<"podcast" | "blog">("podcast");
  const [feedDescription, setFeedDescription] = useState("");
  const [contentFilter, setContentFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedFeedFilter, setSelectedFeedFilter] = useState<string>("all");

  const { data: feeds = [], isLoading: feedsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/rss-feeds"],
  });

  const { data: contentItems = [], isLoading: contentLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/rss-content", contentFilter, selectedFeedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (contentFilter !== "all") params.set("status", contentFilter);
      if (selectedFeedFilter !== "all") params.set("feedId", selectedFeedFilter);
      const res = await fetch(`/api/admin/rss-content?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: pendingCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/rss-content/pending-count"],
  });

  const addFeedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/rss-feeds", { name: feedName, url: feedUrl, feedType, description: feedDescription, isActive: true, fetchIntervalMinutes: 60 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-feeds"] });
      setShowAddFeed(false);
      setFeedName("");
      setFeedUrl("");
      setFeedDescription("");
      toast({ title: "RSS feed added" });
    },
    onError: () => toast({ title: "Failed to add feed", variant: "destructive" }),
  });

  const fetchFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      const res = await apiRequest("POST", `/api/admin/rss-feeds/${feedId}/fetch`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-content/pending-count"] });
      toast({ title: `Fetched ${data?.newItems || 0} new items` });
    },
    onError: () => toast({ title: "Failed to fetch feed", variant: "destructive" }),
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      return apiRequest("DELETE", `/api/admin/rss-feeds/${feedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-feeds"] });
      toast({ title: "Feed removed" });
    },
    onError: () => toast({ title: "Failed to remove feed", variant: "destructive" }),
  });

  const approveContentMutation = useMutation({
    mutationFn: async ({ id, status, approvedPlacements, bkdPillar }: { id: string; status: string; approvedPlacements?: string[]; bkdPillar?: string }) => {
      return apiRequest("PATCH", `/api/admin/rss-content/${id}`, { status, approvedPlacements, bkdPillar });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rss-content/pending-count"] });
      toast({ title: "Content updated" });
    },
    onError: () => toast({ title: "Failed to update content", variant: "destructive" }),
  });

  const placementLabels: Record<string, { label: string; color: string }> = {
    know_resource: { label: "KNOW Resources", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    ai_lesson: { label: "AI Lesson", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    featured: { label: "My Journey", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
    mentor_connect: { label: "Mentor Connect", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  };

  const pillarLabels: Record<string, { label: string; color: string }> = {
    be: { label: "BE", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
    know: { label: "KNOW", color: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" },
    do: { label: "DO", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-content-hub-title">Content Hub</h2>
          <p className="text-muted-foreground">Manage RSS feeds, review ingested content, and route to platform features</p>
        </div>
        {(pendingCount?.count || 0) > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1" data-testid="badge-pending-count">
            {pendingCount?.count} pending
          </Badge>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Feeds</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-feeds">{feeds.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Feeds</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-active-feeds">{feeds.filter((f: any) => f.isActive).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl text-amber-600" data-testid="text-pending-review">{pendingCount?.count || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Content</CardDescription>
            <CardTitle className="text-2xl" data-testid="text-total-content">{feeds.reduce((sum: number, f: any) => sum + (f.itemCount || 0), 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Rss className="h-5 w-5" /> RSS Feeds</CardTitle>
              <CardDescription>Connected podcast and blog feeds</CardDescription>
            </div>
            <Button onClick={() => setShowAddFeed(true)} data-testid="button-add-feed">
              <Plus className="h-4 w-4 mr-2" /> Add Feed
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddFeed && (
            <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Feed Name</Label>
                  <Input value={feedName} onChange={(e) => setFeedName(e.target.value)} placeholder="e.g., LYS Podcast" data-testid="input-feed-name" />
                </div>
                <div>
                  <Label>Feed URL</Label>
                  <Input value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} placeholder="https://feeds.example.com/rss" data-testid="input-feed-url" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <Select value={feedType} onValueChange={(v: any) => setFeedType(v)}>
                    <SelectTrigger data-testid="select-feed-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input value={feedDescription} onChange={(e) => setFeedDescription(e.target.value)} placeholder="Brief description" data-testid="input-feed-desc" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addFeedMutation.mutate()} disabled={!feedName || !feedUrl || addFeedMutation.isPending} data-testid="button-save-feed">
                  {addFeedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Feed
                </Button>
                <Button variant="outline" onClick={() => setShowAddFeed(false)} data-testid="button-cancel-feed">Cancel</Button>
              </div>
            </div>
          )}

          {feedsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : feeds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No RSS feeds configured. Add your first feed to start ingesting content.</p>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed: any) => (
                <div key={feed.id} className="flex items-center justify-between border rounded-lg p-3" data-testid={`card-feed-${feed.id}`}>
                  <div className="flex items-center gap-3">
                    {feed.feedType === "podcast" ? <Headphones className="h-5 w-5 text-purple-500" /> : <FileText className="h-5 w-5 text-blue-500" />}
                    <div>
                      <div className="font-medium">{feed.name}</div>
                      <div className="text-sm text-muted-foreground">{feed.url}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {feed.lastFetchedAt ? new Date(feed.lastFetchedAt).toLocaleDateString() : "Never fetched"}</span>
                        <span>{feed.itemCount || 0} items</span>
                        <Badge variant={feed.isActive ? "default" : "secondary"} className="text-xs">{feed.isActive ? "Active" : "Paused"}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => fetchFeedMutation.mutate(feed.id)} disabled={fetchFeedMutation.isPending} data-testid={`button-fetch-${feed.id}`}>
                      <RefreshCw className={`h-4 w-4 ${fetchFeedMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteFeedMutation.mutate(feed.id)} data-testid={`button-delete-feed-${feed.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Queue</CardTitle>
              <CardDescription>Review and approve ingested content for platform placement</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedFeedFilter} onValueChange={setSelectedFeedFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-feed-filter"><SelectValue placeholder="All Feeds" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feeds</SelectItem>
                  {feeds.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={contentFilter} onValueChange={(v: any) => setContentFilter(v)}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contentLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : contentItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {contentFilter === "pending" ? "No pending content to review. Fetch your RSS feeds to bring in new content." : "No content items found with the selected filters."}
            </p>
          ) : (
            <div className="space-y-4">
              {contentItems.map((item: any) => (
                <ContentItemCard
                  key={item.id}
                  item={item}
                  feeds={feeds}
                  placementLabels={placementLabels}
                  pillarLabels={pillarLabels}
                  onApprove={(placements, pillar) => approveContentMutation.mutate({ id: item.id, status: "approved", approvedPlacements: placements, bkdPillar: pillar })}
                  onReject={() => approveContentMutation.mutate({ id: item.id, status: "rejected" })}
                  isPending={approveContentMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ContentItemCard({ item, feeds, placementLabels, pillarLabels, onApprove, onReject, isPending }: {
  item: any;
  feeds: any[];
  placementLabels: Record<string, { label: string; color: string }>;
  pillarLabels: Record<string, { label: string; color: string }>;
  onApprove: (placements: string[], pillar: string) => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(item.suggestedPlacements || []);
  const [selectedPillar, setSelectedPillar] = useState(item.bkdPillar || "know");
  const feed = feeds.find((f: any) => f.id === item.feedId);

  const togglePlacement = (p: string) => {
    setSelectedPlacements(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid={`card-content-${item.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.audioUrl ? <Headphones className="h-4 w-4 text-purple-500 shrink-0" /> : <FileText className="h-4 w-4 text-blue-500 shrink-0" />}
            <h4 className="font-semibold truncate" data-testid={`text-title-${item.id}`}>{item.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {feed && <span className="flex items-center gap-1"><Rss className="h-3 w-3" /> {feed.name}</span>}
            {item.author && <span>by {item.author}</span>}
            {item.publishedAt && <span>{new Date(item.publishedAt).toLocaleDateString()}</span>}
            {item.contentUrl && (
              <a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> View
              </a>
            )}
          </div>
        </div>
        <div>
          {item.status === "pending" && <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>}
          {item.status === "approved" && <Badge variant="default" className="bg-green-600">Approved</Badge>}
          {item.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1">Placements:</span>
        {Object.entries(placementLabels).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => item.status === "pending" && togglePlacement(key)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              selectedPlacements.includes(key) ? color + " border-transparent" : "bg-muted/50 text-muted-foreground border-border"
            } ${item.status === "pending" ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            data-testid={`toggle-placement-${key}-${item.id}`}
          >
            {label}
          </button>
        ))}
        <Separator orientation="vertical" className="h-4 mx-1" />
        <span className="text-xs font-medium text-muted-foreground mr-1">Pillar:</span>
        {Object.entries(pillarLabels).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => item.status === "pending" && setSelectedPillar(key)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              selectedPillar === key ? color + " border-transparent" : "bg-muted/50 text-muted-foreground border-border"
            } ${item.status === "pending" ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            data-testid={`toggle-pillar-${key}-${item.id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {item.careerFields && item.careerFields.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground">Career fields:</span>
          {item.careerFields.map((cf: string) => (
            <Badge key={cf} variant="outline" className="text-xs">{cf}</Badge>
          ))}
        </div>
      )}

      {item.status === "pending" && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => onApprove(selectedPlacements, selectedPillar)}
            disabled={isPending || selectedPlacements.length === 0}
            data-testid={`button-approve-${item.id}`}
          >
            <CheckCircle className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={onReject}
            disabled={isPending}
            data-testid={`button-reject-${item.id}`}
          >
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      )}

      {item.status === "approved" && item.approvedPlacements && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Approved for:</span>
          {(item.approvedPlacements as string[]).map((p: string) => (
            <span key={p} className={`text-xs px-2 py-0.5 rounded-full ${placementLabels[p]?.color || "bg-muted"}`}>
              {placementLabels[p]?.label || p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
