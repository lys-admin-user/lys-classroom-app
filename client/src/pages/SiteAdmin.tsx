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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Shield, Building2, Users, Plus, Trash2, Settings, BarChart3, AlertTriangle, Loader2, Flag, Mail, Edit2, ToggleLeft, Percent, Globe, MapPin, ChevronRight, TrendingUp, Target, Award, GraduationCap, Star, Brain, Compass, Briefcase, BookOpen, Library, FileText, Video, Headphones, Upload, Eye, Check, X, Clock, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Organization, SiteAdmin, FeatureFlag, EmailTemplate, Authority, SystemLessonAuthor, MasterLesson, ContentLibraryItem } from "@shared/schema";

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

  const { data: authorities = [], isLoading: authoritiesLoading } = useQuery<Authority[]>({
    queryKey: ["/api/authorities"],
    enabled: adminCheck?.isSiteAdmin,
  });

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

  // Lesson Authors, Master Lessons, Content Library
  type EnrichedAuthor = SystemLessonAuthor & { user?: { firstName: string | null; lastName: string | null; email: string | null } };
  
  const [isAddAuthorOpen, setIsAddAuthorOpen] = useState(false);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [authorSpecializations, setAuthorSpecializations] = useState<string[]>([]);
  const [authorBio, setAuthorBio] = useState("");
  
  const [lessonStatusFilter, setLessonStatusFilter] = useState<string>("all");
  const [lessonSubjectFilter, setLessonSubjectFilter] = useState<string>("all");
  
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

  const { data: lessonAuthors = [], isLoading: authorsLoading } = useQuery<EnrichedAuthor[]>({
    queryKey: ["/api/admin/lesson-authors"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: masterLessons = [], isLoading: lessonsLoading } = useQuery<MasterLesson[]>({
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

  // Lesson Author Mutations
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
              You do not have site administrator privileges. Contact a platform administrator if you believe this is an error.
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-md bg-destructive/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
            Site Administration
          </h1>
          <p className="font-roboto text-muted-foreground">
            Platform-wide management and configuration
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
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
            <CardTitle className="text-sm font-medium">Site Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSiteAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">Platform administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
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
            Site Admins
          </TabsTrigger>
          <TabsTrigger value="feature-flags" data-testid="tab-feature-flags">
            <Flag className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="email-templates" data-testid="tab-email-templates">
            <Mail className="h-4 w-4 mr-2" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="authorities" data-testid="tab-authorities">
            <Globe className="h-4 w-4 mr-2" />
            Global Authorities
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="lesson-authors" data-testid="tab-lesson-authors">
            <Users className="h-4 w-4 mr-2" />
            Lesson Authors
          </TabsTrigger>
          <TabsTrigger value="lesson-repository" data-testid="tab-lesson-repository">
            <BookOpen className="h-4 w-4 mr-2" />
            Lesson Repository
          </TabsTrigger>
          <TabsTrigger value="content-library" data-testid="tab-content-library">
            <Library className="h-4 w-4 mr-2" />
            Content Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Manage Organizations</h2>
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
                    Add a new school, district, or university to the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="Lincoln High School"
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-slug">URL Slug</Label>
                    <Input
                      id="org-slug"
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                      placeholder="lincoln-high"
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
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="district">District</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        <SelectItem value="campus">Campus ($99/mo)</SelectItem>
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
                <p className="text-muted-foreground">No organizations yet</p>
                <p className="text-sm text-muted-foreground">Create your first organization to get started</p>
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(org as any).maxMembers || "Unlimited"} members allowed
                      </span>
                      <span>Type: {org.type}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Site Administrators</h2>
          </div>

          {siteAdmins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No site administrators configured</p>
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

        <TabsContent value="feature-flags" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Feature Flags</h2>
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
            <h2 className="font-oswald text-xl">Email Templates</h2>
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
                <p className="text-sm text-muted-foreground">Add authorities to build your global education hierarchy</p>
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

        {/* Performance Analytics Tab */}
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
            <div className="grid gap-4 md:grid-cols-4">
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
              <div className="grid gap-4 md:grid-cols-4" data-testid="performance-stats-grid">
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
                            <div className="flex items-center gap-4 text-sm">
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
                            <div className="flex items-center gap-4 text-sm">
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
            </>
          )}
        </TabsContent>

        {/* Lesson Authors Tab */}
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

        {/* Lesson Repository Tab */}
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

          {lessonsLoading ? (
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

        {/* Content Library Tab */}
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
      </Tabs>
    </div>
  );
}
