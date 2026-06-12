import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Search, 
  DollarSign, 
  GraduationCap, 
  Briefcase,
  Shield,
  Lightbulb,
  ExternalLink,
  Calendar,
  ArrowRight,
  X,
  Star,
  Video,
  FileText,
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  ShoppingBag,
  Bookmark,
  BookmarkCheck,
  Download,
  Lock,
  Package,
  MessageSquare,
  Flag,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScholarshipBkdBadge, BkdLegend, type BkdAlignment } from "@/components/ScholarshipBkdBadge";
import { ExternalLinkInterstitial, type ScholarshipKnowingPanel } from "@/components/ExternalLinkInterstitial";
import { ReportScholarshipDialog } from "@/components/ReportScholarshipDialog";
import { PursuitReasonDialog } from "@/components/PursuitReasonDialog";
import { shouldShowKnowingCheck, markKnowingCheckSeen } from "@/lib/externalLinkPolicy";
import type { Resource } from "@shared/schema";
import { useTier } from "@/hooks/use-tier";
import { AdBanner } from "@/components/AdBanner";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type KnowResourceData = {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  category: string | null;
  url: string | null;
  applicationUrl: string | null;
  scholarshipType: string | null;
  scholarshipAmount: string | null;
  scholarshipDeadline: string | null;
  scholarshipSeason: string | null;
  eligibilityCriteria: string[] | null;
  gpaRequirement: string | null;
  studentLevel: string | null;
  firstGenFriendly: boolean | null;
  isRecurring: boolean | null;
  tags: string[] | null;
  careerFields: string[] | null;
  matchScore: number | null;
  matchReasons: string[] | null;
  isSaved: boolean | null;
  trustLevel: string | null;
  lastVerifiedAt: string | null;
  requiresFee: boolean | null;
  privacyConcern: boolean | null;
  nextDeadline: string | null;
  bkdAlignment: BkdAlignment | null;
};

type MarketplaceItemData = {
  id: string;
  title: string;
  description: string;
  itemType: string;
  audience: string;
  bkdTargets: string[];
  price: number;
  coverImageUrl: string | null;
  previewUrl: string | null;
  contentUrl: string | null;
  externalUrl: string | null;
  author: string | null;
  authorBio: string | null;
  tags: string[];
  careerFields: string[];
  pageCount: number | null;
  durationMinutes: number | null;
  featured: boolean;
  owned: boolean;
};

type SavedScholarship = {
  id: string;
  resourceId: string;
  resourceTitle: string;
};

const typeConfig = {
  scholarship: { label: "Scholarship", icon: DollarSign, color: "bg-green-500/10 text-green-600" },
  financial_guide: { label: "Financial Guide", icon: FileText, color: "bg-blue-500/10 text-blue-600" },
  essay_template: { label: "Essay Guide", icon: FileText, color: "bg-amber-500/10 text-amber-600" },
  guide: { label: "Guide", icon: FileText, color: "bg-blue-500/10 text-blue-600" },
  video: { label: "Video", icon: Video, color: "bg-red-500/10 text-red-600" },
  tool: { label: "Tool", icon: Wrench, color: "bg-purple-500/10 text-purple-600" },
  article: { label: "Article", icon: BookOpen, color: "bg-orange-500/10 text-orange-600" },
};

const categoryConfig = {
  financial: { label: "Financial Literacy", icon: DollarSign },
  college: { label: "College Prep", icon: GraduationCap },
  career: { label: "Career Planning", icon: Briefcase },
  military: { label: "Military Pathways", icon: Shield },
  life_skills: { label: "Life Skills", icon: Lightbulb },
  international: { label: "International Students", icon: Globe },
};

const marketplaceTypeConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  ebook: { label: "eBook", icon: BookOpen, color: "bg-indigo-500/10 text-indigo-600" },
  mini_course: { label: "Mini Course", icon: GraduationCap, color: "bg-lys-teal/10 text-lys-teal" },
  guide: { label: "Guide", icon: FileText, color: "bg-blue-500/10 text-blue-600" },
  template: { label: "Template", icon: FileText, color: "bg-amber-500/10 text-amber-600" },
  workshop: { label: "Workshop", icon: Briefcase, color: "bg-purple-500/10 text-purple-600" },
  resource_pack: { label: "Resource Pack", icon: Package, color: "bg-lys-red/10 text-lys-red" },
};

type DisplayResource = {
  id: string;
  rawId: string;
  title: string;
  description: string;
  type: string;
  category: string;
  url?: string;
  imageUrl?: string;
  amount?: string;
  deadline?: string;
  eligibility?: string[];
  tags: string[];
  scholarshipType?: string;
  gpaRequirement?: string;
  studentLevel?: string;
  firstGenFriendly?: boolean;
  isRecurring?: boolean;
  applicationUrl?: string;
  matchScore?: number | null;
  matchReasons?: string[] | null;
  apiIsSaved?: boolean | null;
  trustLevel?: string;
  lastVerifiedAt?: string | null;
  requiresFee?: boolean;
  privacyConcern?: boolean;
  nextDeadline?: string | null;
  bkdAlignment?: BkdAlignment | null;
};

function normalizeKnowResource(kr: KnowResourceData): DisplayResource {
  const mapCategory = (cat: string | null): string => {
    if (!cat) return "college";
    const lower = cat.toLowerCase();
    if (lower === "international" || lower === "study abroad" || lower === "global") return "international";
    if (lower === "general") return "college";
    if (lower === "stem" || lower === "agriculture") return "career";
    if (lower === "business") return "career";
    if (lower === "arts") return "life_skills";
    if (lower === "government") return "career";
    if (lower === "healthcare") return "career";
    return "college";
  };

  return {
    id: `know-${kr.id}`,
    rawId: kr.id,
    title: kr.title,
    description: kr.description || "",
    type: kr.resourceType,
    category: mapCategory(kr.category),
    url: kr.applicationUrl || kr.url || undefined,
    amount: kr.scholarshipAmount || undefined,
    deadline: kr.scholarshipDeadline || undefined,
    eligibility: kr.eligibilityCriteria || undefined,
    tags: kr.tags || [],
    scholarshipType: kr.scholarshipType || undefined,
    gpaRequirement: kr.gpaRequirement || undefined,
    studentLevel: kr.studentLevel || undefined,
    firstGenFriendly: kr.firstGenFriendly || undefined,
    isRecurring: kr.isRecurring || undefined,
    applicationUrl: kr.applicationUrl || kr.url || undefined,
    matchScore: kr.matchScore ?? null,
    matchReasons: kr.matchReasons ?? null,
    apiIsSaved: kr.isSaved ?? null,
    trustLevel: kr.trustLevel || "external",
    lastVerifiedAt: kr.lastVerifiedAt || null,
    requiresFee: kr.requiresFee || false,
    privacyConcern: kr.privacyConcern || false,
    nextDeadline: kr.nextDeadline || null,
    bkdAlignment: kr.bkdAlignment || null,
  };
}

function deadlineUrgency(d: string | null | undefined): { passed: boolean; daysLeft: number | null } {
  if (!d) return { passed: false, daysLeft: null };
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { passed: false, daysLeft: null };
  const days = Math.ceil((dt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return { passed: days < 0, daysLeft: days };
}

const MARKET_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "lesson_plans", label: "Lesson Plans" },
  { value: "classroom_tools", label: "Classroom Tools" },
  { value: "career_readiness", label: "Career Readiness" },
  { value: "college_prep", label: "College Prep" },
  { value: "sel", label: "SEL" },
  { value: "professional_development", label: "PD" },
  { value: "financial_literacy", label: "Financial Literacy" },
  { value: "stem", label: "STEM" },
  { value: "special_education", label: "Special Ed" },
  { value: "other", label: "Other" },
];

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [marketCategory, setMarketCategory] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<DisplayResource | null>(null);
  const [selectedMarketItem, setSelectedMarketItem] = useState<MarketplaceItemData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [marketDetailOpen, setMarketDetailOpen] = useState(false);
  const [mainTab, setMainTab] = useState("library");
  const { showAds } = useTier();
  const { user } = useAuth();
  const { toast } = useToast();

  const openResourceDetails = (resource: DisplayResource) => {
    setSelectedResource(resource);
    setDetailsOpen(true);
  };

  const { data: rawResources, isLoading: loadingResources } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });
  const resources = rawResources ?? [];

  const { data: rawKnowResources, isLoading: loadingKnow } = useQuery<KnowResourceData[]>({
    queryKey: ["/api/know-resources"],
  });
  const knowResources = rawKnowResources ?? [];

  const { data: rawMarketplaceItems, isLoading: loadingMarket } = useQuery<MarketplaceItemData[]>({
    queryKey: ["/api/marketplace"],
  });
  const marketplaceItems = rawMarketplaceItems ?? [];

  const { data: rawSavedScholarships } = useQuery<SavedScholarship[]>({
    queryKey: ["/api/saved-scholarships"],
  });
  const savedScholarships = rawSavedScholarships ?? [];

  const savedIds = new Set(savedScholarships.map((s) => s.resourceId));

  const saveScholarshipMutation = useMutation({
    mutationFn: (data: { resourceId: string; resourceTitle: string; resourceAmount?: string; resourceDeadline?: string; resourceUrl?: string; pursuitReason: string }) =>
      apiRequest("POST", "/api/saved-scholarships", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-scholarships"] });
      toast({
        title: "Saved to your planner",
        description: "Open the Scholarship Planner to see it under Saved.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save scholarship", variant: "destructive" });
    },
  });

  const unsaveScholarshipMutation = useMutation({
    mutationFn: (resourceId: string) =>
      apiRequest("DELETE", `/api/saved-scholarships/${encodeURIComponent(resourceId)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-scholarships"] });
      toast({ title: "Removed", description: "Scholarship removed from your planner." });
    },
  });

  const claimItemMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("POST", `/api/marketplace/${itemId}/claim`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      toast({ title: "Claimed!", description: "This item has been added to your library." });
    },
  });

  const { data: rawWishlist } = useQuery<MarketplaceItemData[]>({
    queryKey: ["/api/marketplace/wishlist"],
  });
  const wishlistIds = new Set((rawWishlist ?? []).map((item) => item.id));

  const addWishlistMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("POST", `/api/marketplace/${itemId}/wishlist`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/wishlist"] });
      toast({ title: "Saved to wishlist" });
    },
  });

  const removeWishlistMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/marketplace/${itemId}/wishlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
  });

  const isLoading = loadingResources || loadingKnow;

  const allResources: DisplayResource[] = [
    ...resources.map((r): DisplayResource => ({
      id: r.id,
      rawId: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      category: r.category,
      url: r.url,
      imageUrl: r.imageUrl,
      amount: r.amount ? String(r.amount) : undefined,
      deadline: r.deadline,
      eligibility: r.eligibility,
      tags: r.tags,
    })),
    ...knowResources.map(normalizeKnowResource),
  ];

  const seenTitles = new Set<string>();
  const deduped = allResources.filter((r) => {
    const key = r.title.toLowerCase();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  const filteredResources = deduped.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const scholarships = filteredResources.filter(r => r.type === "scholarship");
  const otherResources = filteredResources.filter(r => r.type !== "scholarship");

  const filteredMarket = marketplaceItems.filter((item) => {
    if (marketCategory !== "all" && (item as any).category !== marketCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q));
  });

  const formatAmount = (amount?: string | number) => {
    if (!amount) return "Varies";
    if (typeof amount === "string") return amount;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const [pursuitTarget, setPursuitTarget] = useState<DisplayResource | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);
  const [interstitialTarget, setInterstitialTarget] = useState<ScholarshipKnowingPanel | null>(null);
  const [hideExpired, setHideExpired] = useState<boolean>(true);
  const [sortByUrgency, setSortByUrgency] = useState<boolean>(true);
  const [feeBannerDismissed, setFeeBannerDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem("lys.feeBannerDismissed") === "1"; } catch { return false; }
  });
  const dismissFeeBanner = () => {
    try { sessionStorage.setItem("lys.feeBannerDismissed", "1"); } catch { /* ignore */ }
    setFeeBannerDismissed(true);
  };
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setHideExpired(false);
  };

  const toggleSaveScholarship = (scholarship: DisplayResource) => {
    if (savedIds.has(scholarship.id)) {
      unsaveScholarshipMutation.mutate(scholarship.id);
    } else {
      setPursuitTarget(scholarship);
    }
  };

  const confirmPursuit = (reason: string) => {
    if (!pursuitTarget) return;
    saveScholarshipMutation.mutate({
      resourceId: pursuitTarget.id,
      resourceTitle: pursuitTarget.title,
      resourceAmount: pursuitTarget.amount,
      resourceDeadline: pursuitTarget.deadline,
      resourceUrl: pursuitTarget.applicationUrl || pursuitTarget.url,
      pursuitReason: reason,
    });
    setPursuitTarget(null);
  };

  const openExternal = (scholarship: DisplayResource) => {
    const url = scholarship.applicationUrl || scholarship.url;
    if (!url) return;
    if (shouldShowKnowingCheck(scholarship.rawId, scholarship.trustLevel)) {
      setInterstitialTarget({
        resourceId: scholarship.rawId,
        title: scholarship.title,
        url,
        trustLevel: scholarship.trustLevel as any,
        lastVerifiedAt: scholarship.lastVerifiedAt || null,
        requiresFee: scholarship.requiresFee || false,
        privacyConcern: scholarship.privacyConcern || false,
        nextDeadline: scholarship.nextDeadline || null,
        scholarshipDeadline: scholarship.deadline || null,
      });
    } else {
      markKnowingCheckSeen(scholarship.rawId);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl text-foreground">
                KNOW Resources
              </h1>
              <p className="font-roboto text-muted-foreground">
                Scholarships, guides, and the LYS Marketplace — everything to support your journey
              </p>
            </div>
          </div>
          
          {showAds && <AdBanner position="inline" className="mb-6" />}
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="library" className="font-roboto gap-1.5">
              <BookOpen className="h-4 w-4" />
              Resource Library
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="font-roboto gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              LYS Marketplace
            </TabsTrigger>
          </TabsList>

          {/* ─── RESOURCE LIBRARY TAB ─── */}
          <TabsContent value="library">
            <div className="flex flex-wrap gap-4 mb-6 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources, scholarships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 font-roboto"
                  data-testid="input-search-resources"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="font-roboto">All Resources</TabsTrigger>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <TabsTrigger key={key} value={key} className="font-roboto gap-1">
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="space-y-8">
                <div>
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-16 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-resources">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-oswald text-lg text-muted-foreground">No scholarships match</h3>
                <p className="text-sm text-muted-foreground/70 font-roboto mt-2">
                  Try a different search term, category, or clear all filters.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 font-roboto"
                  onClick={resetFilters}
                  data-testid="button-reset-filters"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {scholarships.length > 0 && (() => {
                  // Apply expired filter + urgency sort
                  let displayed = scholarships.slice();
                  if (hideExpired) {
                    displayed = displayed.filter((s) => {
                      const u = deadlineUrgency(s.nextDeadline);
                      return !u.passed;
                    });
                  }
                  if (sortByUrgency) {
                    displayed.sort((a, b) => {
                      const ua = deadlineUrgency(a.nextDeadline);
                      const ub = deadlineUrgency(b.nextDeadline);
                      const va = ua.daysLeft ?? 99999;
                      const vb = ub.daysLeft ?? 99999;
                      return va - vb;
                    });
                  }
                  return (
                  <section>
                    {!feeBannerDismissed && (
                      <Alert className="mb-4 border-lys-yellow/40 bg-lys-yellow/5 relative pr-12" data-testid="alert-no-fee-banner">
                        <ShieldCheck className="h-4 w-4 text-lys-yellow" />
                        <AlertTitle className="font-oswald">Never pay to apply</AlertTitle>
                        <AlertDescription className="font-roboto text-sm">
                          Real scholarships are free. If a site asks for an application fee or your bank info, leave and report it.
                        </AlertDescription>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={dismissFeeBanner}
                          className="absolute right-2 top-2 h-7 w-7"
                          data-testid="button-dismiss-fee-banner"
                          title="Dismiss for this session"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </Alert>
                    )}

                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <h2 className="font-oswald text-xl font-semibold">Scholarships</h2>
                      <BkdLegend />
                      <Badge variant="secondary" className="font-roboto">
                        {displayed.length} of {scholarships.length}
                      </Badge>
                      <div className="ml-auto flex gap-2">
                        <Button
                          variant={sortByUrgency ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSortByUrgency((v) => !v)}
                          data-testid="button-sort-urgency"
                          className="text-xs font-roboto gap-1"
                        >
                          <Clock className="h-3 w-3" /> Urgency
                        </Button>
                        <Button
                          variant={hideExpired ? "default" : "outline"}
                          size="sm"
                          onClick={() => setHideExpired((v) => !v)}
                          data-testid="button-hide-expired"
                          className="text-xs font-roboto"
                        >
                          {hideExpired ? "Hiding expired" : "Showing all"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayed.map((scholarship) => {
                        const isSaved = savedIds.has(scholarship.id) || scholarship.apiIsSaved === true;
                        const score = scholarship.matchScore;
                        const matchColor = score != null
                          ? score >= 70 ? "bg-green-500/15 text-green-700 border-green-400/30"
                          : score >= 45 ? "bg-amber-500/15 text-amber-700 border-amber-400/30"
                          : "bg-muted text-muted-foreground"
                          : "";
                        const urgency = deadlineUrgency(scholarship.nextDeadline);
                        const verifiedDateStr = scholarship.lastVerifiedAt
                          ? new Date(scholarship.lastVerifiedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : null;
                        const daysSinceVerified = scholarship.lastVerifiedAt
                          ? Math.floor((Date.now() - new Date(scholarship.lastVerifiedAt).getTime()) / 86400000)
                          : null;
                        const freshness = daysSinceVerified == null
                          ? { dot: "bg-muted-foreground/40", label: "Not yet verified" }
                          : daysSinceVerified < 14
                            ? { dot: "bg-green-500", label: `Verified ${daysSinceVerified}d ago` }
                            : daysSinceVerified <= 30
                              ? { dot: "bg-amber-500", label: `Verified ${daysSinceVerified}d ago` }
                              : { dot: "bg-red-500", label: `Last verified ${daysSinceVerified}d ago` };
                        const trust = (scholarship.trustLevel || "external").toLowerCase();
                        const trustVisual = trust === "verified"
                          ? { Icon: ShieldCheck, color: "text-green-600", label: "LYS verified" }
                          : trust === "community"
                            ? { Icon: Shield, color: "text-amber-600", label: "Community" }
                            : { Icon: ShieldAlert, color: "text-red-500", label: "External" };
                        const urgencyClass = urgency.passed
                          ? "bg-muted text-muted-foreground border-muted-foreground/20"
                          : urgency.daysLeft != null && urgency.daysLeft <= 7
                            ? "bg-red-500/15 text-red-700 border-red-500/30"
                            : urgency.daysLeft != null && urgency.daysLeft <= 30
                              ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                              : "bg-muted text-muted-foreground border-muted-foreground/20";
                        return (
                          <Card key={scholarship.id} className="hover-elevate flex flex-col" data-testid={`card-scholarship-${scholarship.rawId}`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatAmount(scholarship.amount)}
                                </Badge>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <ScholarshipBkdBadge alignment={scholarship.bkdAlignment} />
                                  {score != null && user && (
                                    <Badge variant="outline" className={`text-xs font-roboto ${matchColor}`} title={(scholarship.matchReasons || []).join(" · ")}>
                                      {score}% match
                                    </Badge>
                                  )}
                                  {isSaved && (
                                    <Badge className="text-xs font-roboto bg-lys-teal/10 text-lys-teal border-lys-teal/30">
                                      <BookmarkCheck className="h-3 w-3 mr-1" />In Planner
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <CardTitle className="font-oswald text-lg mt-2">{scholarship.title}</CardTitle>
                              <CardDescription className="font-roboto text-sm line-clamp-2">
                                {scholarship.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1">
                              {/* Knowing Panel — compact single-line with tooltip on mobile */}
                              <div
                                className="rounded-md border bg-muted/30 p-2 mb-3 text-xs font-roboto space-y-1"
                                data-testid={`knowing-panel-${scholarship.rawId}`}
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex items-center gap-1.5 min-w-0" data-testid={`trust-${scholarship.rawId}`}>
                                        <span className={`h-2 w-2 rounded-full ${freshness.dot}`} aria-hidden />
                                        <trustVisual.Icon className={`h-3.5 w-3.5 ${trustVisual.color}`} />
                                        <span className="truncate">
                                          <span className="hidden sm:inline">
                                            {trustVisual.label}{verifiedDateStr ? <> on <strong>{verifiedDateStr}</strong></> : null}
                                          </span>
                                          <span className="sm:hidden">{trustVisual.label}</span>
                                        </span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div><strong>{trustVisual.label}</strong></div>
                                      <div className="opacity-80">{freshness.label}</div>
                                    </TooltipContent>
                                  </Tooltip>
                                  {urgency.passed ? (
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${urgencyClass}`}
                                      data-testid={`badge-deadline-passed-${scholarship.rawId}`}
                                    >Deadline passed</Badge>
                                  ) : urgency.daysLeft != null ? (
                                    <Badge variant="outline" className={`text-[10px] ${urgencyClass}`}>
                                      {urgency.daysLeft} day{urgency.daysLeft === 1 ? "" : "s"} left
                                    </Badge>
                                  ) : null}
                                </div>
                                {(scholarship.requiresFee || scholarship.privacyConcern) && (
                                  <div className="flex items-center gap-1 text-lys-red">
                                    <ShieldAlert className="h-3 w-3" />
                                    {scholarship.requiresFee ? "Reports an application fee" : "Possible privacy concern"}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
                                  {scholarship.scholarshipType && <span className="capitalize">{scholarship.scholarshipType}</span>}
                                  {scholarship.firstGenFriendly && <span className="text-green-600">· 1st-gen friendly</span>}
                                  {scholarship.gpaRequirement && <span>· GPA {scholarship.gpaRequirement}+</span>}
                                </div>
                              </div>

                              {scholarship.eligibility && scholarship.eligibility.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground font-roboto mb-1">Eligibility:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {scholarship.eligibility.slice(0, 3).map((req, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs font-roboto">
                                        {req}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mb-4">
                                {(scholarship.tags ?? []).slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs font-roboto">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-auto">
                                <Button 
                                  className="flex-1 font-oswald gap-2" 
                                  variant="secondary" 
                                  onClick={() => openResourceDetails(scholarship)}
                                  data-testid={`button-view-${scholarship.id}`}
                                >
                                  <Star className="h-4 w-4" />
                                  View Details
                                </Button>
                                {(scholarship.applicationUrl || scholarship.url) && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => openExternal(scholarship)}
                                    data-testid={`button-apply-${scholarship.id}`}
                                    title="Apply on official site"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant={isSaved ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => toggleSaveScholarship(scholarship)}
                                  data-testid={`button-save-scholarship-${scholarship.id}`}
                                  title={isSaved ? "Remove from Scholarship Planner" : "Save to Scholarship Planner"}
                                  className={isSaved ? "bg-lys-teal hover:bg-lys-teal/90" : ""}
                                >
                                  {isSaved
                                    ? <BookmarkCheck className="h-4 w-4" />
                                    : <Bookmark className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setReportTarget({ id: scholarship.rawId, title: scholarship.title })}
                                  data-testid={`button-report-${scholarship.id}`}
                                  title="Report this scholarship"
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                  );
                })()}

                {otherResources.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="h-6 w-6 text-primary" />
                      <h2 className="font-oswald text-xl font-semibold">Guides & Resources</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otherResources.map((resource) => {
                        const typeConf = typeConfig[resource.type as keyof typeof typeConfig] || typeConfig.guide;
                        const catConf = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.college;

                        return (
                          <Card key={resource.id} className="hover-elevate">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={typeConf.color}>
                                  <typeConf.icon className="h-3 w-3 mr-1" />
                                  {typeConf.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs font-roboto">
                                  <catConf.icon className="h-3 w-3 mr-1" />
                                  {catConf.label}
                                </Badge>
                              </div>
                              <CardTitle className="font-oswald text-lg">{resource.title}</CardTitle>
                              <CardDescription className="font-roboto text-sm line-clamp-2">
                                {resource.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-1 mb-4">
                                {(resource.tags ?? []).slice(0, 4).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs font-roboto">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <Button 
                                className="w-full font-oswald gap-2" 
                                variant="secondary" 
                                onClick={() => openResourceDetails(resource)}
                                data-testid={`button-view-${resource.id}`}
                              >
                                {resource.type === "video" ? "Watch Now" : "Read More"}
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-lys-yellow/10 to-lys-red/10 border-lys-yellow/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-md bg-lys-yellow/20 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-lys-yellow" />
                    </div>
                    <div>
                      <h3 className="font-oswald text-lg font-semibold">Financial Literacy</h3>
                      <p className="text-sm text-muted-foreground font-roboto">Learn to manage money wisely</p>
                    </div>
                  </div>
                  <p className="font-roboto text-sm text-muted-foreground mb-4">
                    Understanding budgeting, saving, and investing early sets you up for lifelong financial success.
                  </p>
                  <Button variant="outline" className="font-oswald gap-2 border-lys-yellow text-lys-yellow" onClick={() => { setSelectedCategory("financial"); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-explore-financial">
                    Explore Guides
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-lys-teal/10 to-lys-red/10 border-lys-teal/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-md bg-lys-teal/20 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-lys-teal" />
                    </div>
                    <div>
                      <h3 className="font-oswald text-lg font-semibold">Military Pathways</h3>
                      <p className="text-sm text-muted-foreground font-roboto">Service with purpose</p>
                    </div>
                  </div>
                  <p className="font-roboto text-sm text-muted-foreground mb-4">
                    Explore military career options, benefits, and educational opportunities through service.
                  </p>
                  <Button variant="outline" className="font-oswald gap-2 border-lys-teal text-lys-teal" onClick={() => { setSelectedCategory("military"); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-explore-military">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 dark:border-blue-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-md bg-blue-500/20 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-oswald text-lg font-semibold">International Students</h3>
                      <p className="text-sm text-muted-foreground font-roboto">Global opportunities await</p>
                    </div>
                  </div>
                  <p className="font-roboto text-sm text-muted-foreground mb-4">
                    Discover scholarships, exchange programs, government-funded opportunities, and resources for studying abroad.
                  </p>
                  <Button variant="outline" className="font-oswald gap-2 border-blue-500 text-blue-600 dark:text-blue-400" onClick={() => { setSelectedCategory("international"); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-explore-international">
                    Explore Opportunities
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── MARKETPLACE TAB ─── */}
          <TabsContent value="marketplace">
            <div className="mt-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="h-6 w-6 text-lys-teal" />
                <div>
                  <h2 className="font-oswald text-xl font-semibold">LYS Marketplace</h2>
                  <p className="text-sm text-muted-foreground font-roboto">eBooks, mini courses, guides, and tools from LYS and trusted partners</p>
                </div>
              </div>
              <div className="relative max-w-md mt-3 mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 font-roboto"
                  data-testid="input-search-marketplace"
                />
              </div>
              <div className="flex flex-wrap gap-2" data-testid="marketplace-category-filters">
                {MARKET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setMarketCategory(cat.value)}
                    className={`text-xs font-oswald px-3 py-1.5 rounded-full border transition-colors ${
                      marketCategory === cat.value
                        ? "bg-lys-teal text-white border-lys-teal"
                        : "bg-background text-muted-foreground border-border hover:border-lys-teal/50"
                    }`}
                    data-testid={`filter-market-cat-${cat.value}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingMarket ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-40 w-full rounded-md mb-3" />
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredMarket.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-oswald text-lg text-muted-foreground mb-1">Marketplace Coming Soon</h3>
                <p className="text-sm text-muted-foreground font-roboto max-w-sm mx-auto">
                  LYS eBooks, mini courses, and guides will appear here once they're published. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredMarket.some(i => i.featured) && (
                  <section>
                    <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5 text-lys-yellow" />
                      Featured
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMarket.filter(i => i.featured).map((item) => (
                        <MarketplaceCard key={item.id} item={item} formatPrice={formatPrice} onView={() => { setSelectedMarketItem(item); setMarketDetailOpen(true); }} onClaim={() => claimItemMutation.mutate(item.id)} isClaiming={claimItemMutation.isPending} wishlisted={wishlistIds.has(item.id)} onWishlist={() => wishlistIds.has(item.id) ? removeWishlistMutation.mutate(item.id) : addWishlistMutation.mutate(item.id)} />
                      ))}
                    </div>
                  </section>
                )}
                <section>
                  <h3 className="font-oswald text-lg mb-3">All Items</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMarket.map((item) => (
                      <MarketplaceCard key={item.id} item={item} formatPrice={formatPrice} onView={() => { setSelectedMarketItem(item); setMarketDetailOpen(true); }} onClaim={() => claimItemMutation.mutate(item.id)} isClaiming={claimItemMutation.isPending} wishlisted={wishlistIds.has(item.id)} onWishlist={() => wishlistIds.has(item.id) ? removeWishlistMutation.mutate(item.id) : addWishlistMutation.mutate(item.id)} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            <div className="mt-12 p-6 rounded-xl border bg-gradient-to-br from-lys-teal/10 to-lys-yellow/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-teal/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-lys-teal" />
                </div>
                <div>
                  <h3 className="font-oswald text-lg font-semibold">Want to sell your content on LYS?</h3>
                  <p className="text-sm text-muted-foreground font-roboto mt-1 mb-3">
                    LYS partners with third-party educators, publishers, and content creators. If you're interested in listing your eBook, course, or resource pack in the marketplace, reach out to our content team.
                  </p>
                  <Button variant="outline" className="font-oswald gap-2" onClick={() => window.open("mailto:content@ladderingyoursuccess.com", "_blank")} data-testid="button-marketplace-partner">
                    <ExternalLink className="h-4 w-4" />
                    Contact Our Content Team
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Resource Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedResource && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={typeConfig[selectedResource.type as keyof typeof typeConfig]?.color}>
                      {(() => {
                        const TypeIcon = typeConfig[selectedResource.type as keyof typeof typeConfig]?.icon;
                        return TypeIcon ? <TypeIcon className="h-3 w-3 mr-1" /> : null;
                      })()}
                      {typeConfig[selectedResource.type as keyof typeof typeConfig]?.label}
                    </Badge>
                    <Badge variant="outline">
                      {(() => {
                        const CatIcon = categoryConfig[selectedResource.category as keyof typeof categoryConfig]?.icon;
                        return CatIcon ? <CatIcon className="h-3 w-3 mr-1" /> : null;
                      })()}
                      {categoryConfig[selectedResource.category as keyof typeof categoryConfig]?.label}
                    </Badge>
                  </div>
                  <DialogTitle className="font-oswald text-xl">{selectedResource.title}</DialogTitle>
                  <DialogDescription className="font-roboto">
                    {selectedResource.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {(selectedResource.type === "scholarship" || selectedResource.type === "financial_guide" || selectedResource.type === "essay_template") && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedResource.amount && (
                          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-sm font-medium">Award Amount</span>
                            </div>
                            <p className="font-oswald text-lg mt-1">{formatAmount(selectedResource.amount)}</p>
                          </div>
                        )}
                        {selectedResource.scholarshipType && (
                          <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                              <GraduationCap className="h-4 w-4" />
                              <span className="text-sm font-medium">Type</span>
                            </div>
                            <p className="font-oswald text-lg mt-1 capitalize">{selectedResource.scholarshipType === "both" ? "Merit & Need-Based" : `${selectedResource.scholarshipType}-Based`}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedResource.gpaRequirement && (
                          <Badge variant="secondary" className="font-roboto">
                            <GraduationCap className="h-3 w-3 mr-1" />GPA: {selectedResource.gpaRequirement}+
                          </Badge>
                        )}
                        {selectedResource.studentLevel && selectedResource.studentLevel !== "all" && (
                          <Badge variant="secondary" className="font-roboto capitalize">
                            {selectedResource.studentLevel.replace("_", " ")}
                          </Badge>
                        )}
                        {selectedResource.firstGenFriendly && (
                          <Badge variant="outline" className="font-roboto text-green-600 border-green-300">
                            <Star className="h-3 w-3 mr-1" />First-Gen Friendly
                          </Badge>
                        )}
                        {selectedResource.isRecurring && (
                          <Badge variant="outline" className="font-roboto">
                            <Clock className="h-3 w-3 mr-1" />Recurring
                          </Badge>
                        )}
                      </div>

                      {selectedResource.eligibility && selectedResource.eligibility.length > 0 && (
                        <div>
                          <h4 className="font-oswald text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            Eligibility Requirements
                          </h4>
                          <ul className="space-y-2">
                            {selectedResource.eligibility.map((req: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {selectedResource.tags && selectedResource.tags.length > 0 && (
                    <div>
                      <h4 className="font-oswald text-sm mb-2">Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResource.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource.url && !selectedResource.url.includes("ladderingyoursuccess.com") && (
                    <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800 dark:text-amber-300">External Resource</p>
                          <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                            This link will take you to an external website not operated by Laddering Your Success. 
                            We are not responsible for the content, privacy policies, or practices of third-party sites.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3">
                    {selectedResource.type === "scholarship" && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => toggleSaveScholarship(selectedResource)}
                        data-testid="button-save-scholarship-detail"
                      >
                        {savedIds.has(selectedResource.id)
                          ? <><BookmarkCheck className="h-4 w-4 text-lys-teal" />Saved</>
                          : <><Bookmark className="h-4 w-4" />Save to Planner</>}
                      </Button>
                    )}
                    {(selectedResource.applicationUrl || selectedResource.url) && (
                      <Button 
                        className="flex-1 font-oswald gap-2" 
                        onClick={() => {
                          if (selectedResource.type === "scholarship") {
                            openExternal(selectedResource);
                          } else {
                            window.open(selectedResource.applicationUrl || selectedResource.url, "_blank", "noopener,noreferrer");
                          }
                        }}
                        data-testid="button-open-resource"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {selectedResource.type === "scholarship" ? "Apply Now" : 
                         selectedResource.type === "financial_guide" ? "Open Guide" :
                         selectedResource.type === "essay_template" ? "View Template" :
                         selectedResource.type === "video" ? "Watch Video" : "Open Resource"}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => setDetailsOpen(false)}
                      data-testid="button-close-details"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Marketplace Item Detail Dialog */}
        <Dialog open={marketDetailOpen} onOpenChange={setMarketDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedMarketItem && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={marketplaceTypeConfig[selectedMarketItem.itemType]?.color || "bg-muted text-muted-foreground"}>
                      {marketplaceTypeConfig[selectedMarketItem.itemType]?.label || selectedMarketItem.itemType}
                    </Badge>
                    {selectedMarketItem.price === 0 ? (
                      <Badge className="bg-green-500/10 text-green-600">Free</Badge>
                    ) : (
                      <Badge className="bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20">{formatPrice(selectedMarketItem.price)}</Badge>
                    )}
                    {selectedMarketItem.owned && (
                      <Badge className="bg-lys-teal/10 text-lys-teal border-lys-teal/20">
                        <CheckCircle className="h-3 w-3 mr-1" />Owned
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="font-oswald text-xl">{selectedMarketItem.title}</DialogTitle>
                  {selectedMarketItem.author && (
                    <p className="text-sm text-muted-foreground">by {selectedMarketItem.author}</p>
                  )}
                  <DialogDescription className="font-roboto">{selectedMarketItem.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedMarketItem.pageCount && (
                      <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />{selectedMarketItem.pageCount} pages</Badge>
                    )}
                    {selectedMarketItem.durationMinutes && (
                      <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{selectedMarketItem.durationMinutes} min</Badge>
                    )}
                    {selectedMarketItem.bkdTargets.map(t => (
                      <Badge key={t} variant="secondary" className="text-xs capitalize">{t.replace("_", " ")}</Badge>
                    ))}
                  </div>

                  {selectedMarketItem.authorBio && (
                    <div className="p-3 rounded-md bg-muted/50 border">
                      <p className="text-xs text-muted-foreground font-medium mb-1">About the Author</p>
                      <p className="text-sm">{selectedMarketItem.authorBio}</p>
                    </div>
                  )}

                  {(selectedMarketItem.tags ?? []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Topics covered</p>
                      <div className="flex flex-wrap gap-1">
                        {(selectedMarketItem.tags ?? []).map((t, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3">
                    {selectedMarketItem.owned ? (
                      <Button className="flex-1 font-oswald gap-2" onClick={() => selectedMarketItem.contentUrl ? window.open(selectedMarketItem.contentUrl, "_blank") : selectedMarketItem.externalUrl ? window.open(selectedMarketItem.externalUrl, "_blank") : null} data-testid="button-access-item">
                        <Download className="h-4 w-4" />
                        Access Content
                      </Button>
                    ) : selectedMarketItem.price === 0 ? (
                      <Button className="flex-1 font-oswald gap-2 bg-lys-teal hover:bg-lys-teal/90" onClick={() => { claimItemMutation.mutate(selectedMarketItem.id); setMarketDetailOpen(false); }} disabled={claimItemMutation.isPending} data-testid="button-claim-item">
                        <Download className="h-4 w-4" />
                        {claimItemMutation.isPending ? "Claiming..." : "Get for Free"}
                      </Button>
                    ) : (
                      <Button className="flex-1 font-oswald gap-2" onClick={() => window.open("mailto:purchase@ladderingyoursuccess.com?subject=Marketplace Purchase: " + encodeURIComponent(selectedMarketItem.title), "_blank")} data-testid="button-purchase-item">
                        <ExternalLink className="h-4 w-4" />
                        Purchase — {formatPrice(selectedMarketItem.price)}
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setMarketDetailOpen(false)}>Close</Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <PursuitReasonDialog
          open={!!pursuitTarget}
          onClose={() => setPursuitTarget(null)}
          onConfirm={confirmPursuit}
          scholarshipTitle={pursuitTarget?.title}
          isSaving={saveScholarshipMutation.isPending}
        />
        <ReportScholarshipDialog
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          resourceId={reportTarget?.id || null}
          resourceTitle={reportTarget?.title}
        />
        <ExternalLinkInterstitial
          open={!!interstitialTarget}
          onClose={() => setInterstitialTarget(null)}
          scholarship={interstitialTarget}
        />

        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground font-roboto max-w-3xl mx-auto space-y-2" data-testid="text-resources-disclaimer">
          <p>
            LYS curates and verifies scholarship listings to the best of our ability. Deadlines, eligibility, and award amounts can change at any time —
            always verify on the official site before applying. LYS will never charge you to apply, and we never share your data with scholarship providers.
            See something off? Use the report flag on any listing.
          </p>
          <p className="opacity-80">
            <strong>BKD</strong> = Being, Knowing, Doing — our framework for evaluating opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}

function MarketplaceCard({
  item,
  formatPrice,
  onView,
  onClaim,
  isClaiming,
  wishlisted,
  onWishlist,
}: {
  item: MarketplaceItemData;
  formatPrice: (cents: number) => string;
  onView: () => void;
  onClaim: () => void;
  isClaiming: boolean;
  wishlisted: boolean;
  onWishlist: () => void;
}) {
  const typeConf = marketplaceTypeConfig[item.itemType] || { label: item.itemType, icon: BookOpen, color: "bg-muted text-muted-foreground" };
  const TypeIcon = typeConf.icon;

  return (
    <Card className="hover-elevate flex flex-col" data-testid={`card-marketplace-${item.id}`}>
      {item.coverImageUrl && (
        <img src={item.coverImageUrl} alt={item.title} className="w-full h-40 object-cover rounded-t-lg" />
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge className={typeConf.color}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeConf.label}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm font-oswald font-semibold">
              {item.price === 0 ? <span className="text-green-600">Free</span> : <span className="text-lys-yellow">{formatPrice(item.price)}</span>}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onWishlist(); }}
              className="text-muted-foreground hover:text-lys-yellow transition-colors"
              title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              data-testid={`button-wishlist-${item.id}`}
            >
              {wishlisted ? <BookmarkCheck className="h-4 w-4 text-lys-yellow" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <CardTitle className="font-oswald text-base mt-2 leading-snug">{item.title}</CardTitle>
        {item.author && <p className="text-xs text-muted-foreground">by {item.author}</p>}
        <CardDescription className="font-roboto text-xs line-clamp-2 mt-1">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 font-oswald text-sm gap-1" onClick={onView} data-testid={`button-view-market-${item.id}`}>
            View Details
          </Button>
          {item.owned ? (
            <Badge className="bg-lys-teal/10 text-lys-teal border-lys-teal/20 self-center px-2">
              <CheckCircle className="h-3 w-3 mr-1" />Owned
            </Badge>
          ) : item.price === 0 ? (
            <Button className="flex-1 font-oswald text-sm gap-1 bg-lys-teal hover:bg-lys-teal/90" onClick={onClaim} disabled={isClaiming} data-testid={`button-claim-${item.id}`}>
              <Download className="h-3 w-3" />
              Get Free
            </Button>
          ) : (
            <Button className="flex-1 font-oswald text-sm gap-1" onClick={onView} data-testid={`button-buy-${item.id}`}>
              <Lock className="h-3 w-3" />
              Buy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
