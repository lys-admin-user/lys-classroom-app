import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiGeneratedLabel, AiAgentNotice } from "@/components/AiDisclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Clock, Target, BookOpen, Users, Loader2, Copy, Download, Heart, Compass, Save, Check, GraduationCap, FileText, Globe, MapPin, Lightbulb, Play, UserCheck, Settings, Printer, LayoutList, AlertCircle, ExternalLink, Plus, X, Search, Library, ClipboardList, PenLine, MessageSquare, Brain, ChevronRight, Award, ChevronDown, ChevronUp, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { streamGeneration } from "@/lib/streamGeneration";
import { GenerationCountdown, type GenerationPhase, type FallbackSource } from "@/components/GenerationCountdown";
import { StandardsCascadePicker } from "@/components/StandardsCascadePicker";
import { useAuth } from "@/hooks/use-auth";
import { useTier } from "@/hooks/use-tier";
import { useTrial } from "@/hooks/use-trial";
import { PLAN_PRICES } from "@/lib/pricing";
import { resolveCountryName } from "@/lib/countries";
import { isAfricanCountry, getAfricanProfile, isWAECCountry } from "@shared/africaContext";
import { US_GRADE_OPTIONS, US_GRADE_VALUES, type GradeOption } from "@shared/gradeLevels";
import { AdBanner } from "@/components/AdBanner";
import type { LessonPlan, EducatorProfile, Lesson } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { StandardCode } from "@shared/standards";
import { educationalResourceProviders, getSearchUrl, type EducationalResourceProvider, type EducationalResource } from "@shared/educationalResources";
import { Link, useLocation, useSearch } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuestSignupModal } from "@/components/GuestSignupModal";
import { GuestEmailModal } from "@/components/GuestEmailModal";

// Individual grades (Pre-K → 12 + coming-soon Post-secondary), band-prefixed.
const defaultGradeOptions: GradeOption[] = US_GRADE_OPTIONS;
const defaultGradeValues = US_GRADE_VALUES;

const durations = ["30 minutes", "45 minutes", "60 minutes", "90 minutes", "1-2 class periods"];

export default function LessonGenerator() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  // Locked product decision (May 2026): source-tier badges on individual
  // standard codes are visible to solo educators (so they can judge whether
  // they're picking ministry-official codes or starter/curated entries),
  // but HIDDEN from campus/district/site/system admins — those users live
  // in a managed environment where ingestion is admin-driven and the badge
  // adds noise rather than signal. Toggled by user role only; no per-org
  // override yet (Track B will add a per-tenant flag).
  const showStandardSources = !(
    user?.role === "campus_admin" ||
    user?.role === "district_admin" ||
    user?.role === "site_admin" ||
    user?.role === "system_admin"
  );
  const { showAds, requiresScopeSequence, tier } = useTier();
  const { canStartTrial } = useTrial();
  const [, setLocation] = useLocation();
  // Streaming/anticipation state for the GenerationCountdown UI.
  const [lessonStreamPhase, setLessonStreamPhase] = useState<GenerationPhase>("studying");
  const [lessonStreamDeltaTail, setLessonStreamDeltaTail] = useState("");
  const [lessonStreamFallbackSource, setLessonStreamFallbackSource] = useState<FallbackSource>(null);
  const [lessonStreamFallbackWarning, setLessonStreamFallbackWarning] = useState<string | null>(null);
  const [assignmentStreamPhase, setAssignmentStreamPhase] = useState<GenerationPhase>("studying");
  const [assignmentStreamDeltaTail, setAssignmentStreamDeltaTail] = useState("");
  const [assignmentStreamFallbackSource, setAssignmentStreamFallbackSource] = useState<FallbackSource>(null);
  const [assignmentStreamFallbackWarning, setAssignmentStreamFallbackWarning] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [course, setCourse] = useState("");
  const [unit, setUnit] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [bkdFocus, setBkdFocus] = useState<"be" | "know" | "do">("be");
  const [duration, setDuration] = useState("45 minutes");
  const [lessonPart, setLessonPart] = useState("");
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStandardCodes, setSelectedStandardCodes] = useState<StandardCode[]>([]);
  // Task #16 — code passed via ?code= from the dashboard "Gaps to cover" widget.
  // Held until the cascade's code list loads, then matched + auto-selected.
  const [pendingPreselectCode, setPendingPreselectCode] = useState<string | null>(null);
  const [paramsApplied, setParamsApplied] = useState(false);
  // Bilingual local-language code (e.g., "yo", "ig", "ha"). Empty = English only.
  // Only used / shown when selectedCountry is an African country.
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // Africa-aware derived state. For non-African countries these all collapse
  // to the existing behavior (no grade override, no language selector).
  const africanProfile = useMemo(() => getAfricanProfile(selectedCountry), [selectedCountry]);
  const isAfrican = !!africanProfile;
  const isWAEC = isWAECCountry(selectedCountry);
  // Grade options for the dropdown: African countries surface their own
  // country-specific per-grade list; everyone else gets the individual US grades
  // (Pre-K → 12 + coming-soon Post-secondary), band-prefixed.
  const displayGradeOptions = useMemo<GradeOption[]>(
    () =>
      africanProfile
        ? africanProfile.gradeLevels.map((g) => ({
            value: g,
            label: g,
            band: "elementary" as const,
          }))
        : defaultGradeOptions,
    [africanProfile],
  );
  
  // Active org-uploaded alignment docs (YAG / scope-and-sequence) the teacher
  // hasn't opted out of. Fetched once user picks a subject/grade so the lesson
  // can be aligned to school curriculum.
  const { data: alignmentDocs = [] } = useQuery<Array<{ id: string; title: string; excerpt: string; docType: string; subject: string | null }>>({
    queryKey: ["/api/curriculum-library/active-alignment-docs", selectedSubject, gradeLevel],
    enabled: !!selectedSubject,
  });

  const [generatedLesson, setGeneratedLesson] = useState<LessonPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [profileApplied, setProfileApplied] = useState(false);
  const [scopeSkipped, setScopeSkipped] = useState(false);
  
  // Inline lesson editing state
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editObjectives, setEditObjectives] = useState("");
  const [editEssentialQuestions, setEditEssentialQuestions] = useState("");
  const [editReflection, setEditReflection] = useState("");

  // Assignment generation state
  const [showAssignmentOption, setShowAssignmentOption] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"quiz" | "worksheet" | "project" | "discussion" | "reflection">("quiz");
  const [generatedAssignment, setGeneratedAssignment] = useState<any>(null);
  const [assignmentQuestionCount, setAssignmentQuestionCount] = useState(5);
  const [assignmentDifficulty, setAssignmentDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  
  // Educational Resources state
  const [addedResources, setAddedResources] = useState<EducationalResource[]>([]);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const [customResourceUrl, setCustomResourceUrl] = useState("");
  const [customResourceTitle, setCustomResourceTitle] = useState("");
  const [selectedResourceCategory, setSelectedResourceCategory] = useState<"all" | "oer" | "government" | "video" | "interactive" | "textbooks">("all");
  const [myLessonsOpen, setMyLessonsOpen] = useState(false);

  // Guest signup modal — opened either proactively from the inline soft
  // paywall card or reactively when the server returns requiresSignup.
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestModalHardWall, setGuestModalHardWall] = useState(false);
  // Email gate — opened the first time an anonymous user generates, before any
  // free lesson is granted. Capturing the email unlocks the 5 free lessons.
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const search = useSearch();
  const viewLessonId = new URLSearchParams(search).get("view");
  const shouldRestoreGuestState = new URLSearchParams(search).has("restore");
  // Task #16 — true when the dashboard "Gaps to cover" deep-link supplied any
  // curriculum context. Used to make URL params win deterministically over the
  // educator-profile defaults, even when the profile query is already cached.
  const hasUrlStandardsParams = useMemo(() => {
    const p = new URLSearchParams(search);
    return p.has("country") || p.has("state") || p.has("subject") || p.has("code");
  }, [search]);

  // Task #16 — deep-link from the dashboard "Gaps to cover" widget:
  // ?country=&state=&subject=&code= preselects the cascade and auto-selects
  // the standard code once its list loads.
  useEffect(() => {
    if (paramsApplied) return;
    const params = new URLSearchParams(search);
    const country = params.get("country");
    const state = params.get("state");
    const subject = params.get("subject");
    const code = params.get("code");
    if (!country && !state && !subject && !code) return;
    if (country) setSelectedCountry(country);
    if (state) setSelectedState(state);
    if (subject) setSelectedSubject(subject);
    if (code) setPendingPreselectCode(code);
    // URL wins over the educator-profile defaults below.
    setProfileApplied(true);
    setParamsApplied(true);
  }, [search, paramsApplied]);

  const { data: viewLessonData, isLoading: viewLessonLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", viewLessonId],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/${viewLessonId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Lesson not found");
      return res.json();
    },
    enabled: !!viewLessonId && isAuthenticated,
  });

  useEffect(() => {
    if (viewLessonData && !generatedLesson) {
      const lesson = viewLessonData;
      setGeneratedLesson(lesson as unknown as LessonPlan);
      setIsSaved(true);
      setSavedLessonId(lesson.id);
      setTopic(lesson.topic);
      setGradeLevel(lesson.gradeLevel);
      setBkdFocus(lesson.bkdFocus as "be" | "know" | "do");
      setDuration(lesson.duration ?? "45 minutes");
    }
  }, [viewLessonData]);

  const { data: profileData } = useQuery<{ profile: EducatorProfile | null; tier: string }>({
    queryKey: ["/api/educator-profile"],
    enabled: isAuthenticated,
  });

  const { data: usageData, refetch: refetchUsage } = useQuery<{ tier: string; monthlyCount: number; limit: number | null; remaining: number | null; unlimited: boolean }>({
    queryKey: ["/api/lessons/usage"],
    enabled: isAuthenticated,
  });

  const { data: guestUsageData, refetch: refetchGuestUsage } = useQuery<{ used: number; limit: number; remaining: number; emailCaptured: boolean }>({
    queryKey: ["/api/lessons/guest-usage"],
    enabled: !isAuthenticated,
  });

  const { data: savedLessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    enabled: isAuthenticated,
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson deleted" });
    },
  });

  const educatorProfile = profileData?.profile;
  const hasProfile = !!educatorProfile && !!educatorProfile.country && !!educatorProfile.state;

  // Post-signup rehydration. When a guest signs up via the GuestSignupModal
  // we redirect back here with ?restore=1; once auth is settled, claim the
  // handoff row so the form values + last generated lesson are restored and
  // the user lands exactly where they left off.
  useEffect(() => {
    if (!shouldRestoreGuestState || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest("POST", "/api/guest/claim", {});
        const data = await res.json();
        if (cancelled || !data?.claimed) return;
        const fc = data.formContext || {};
        if (fc.topic) setTopic(fc.topic);
        if (fc.selectedCountry) setSelectedCountry(fc.selectedCountry);
        if (fc.selectedState) setSelectedState(fc.selectedState);
        if (fc.selectedSubject) setSelectedSubject(fc.selectedSubject);
        if (fc.gradeLevel) setGradeLevel(fc.gradeLevel);
        if (fc.bkdFocus) setBkdFocus(fc.bkdFocus);
        if (fc.duration) setDuration(fc.duration);
        if (fc.unit) setUnit(fc.unit);
        if (fc.lessonPart) setLessonPart(fc.lessonPart);
        if (data.lastLessonContent) {
          setGeneratedLesson(data.lastLessonContent as LessonPlan);
          if (data.savedLessonId) {
            setIsSaved(true);
            setSavedLessonId(data.savedLessonId);
            queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
          }
        }
        toast({
          title: "Welcome back!",
          description: data.lastLessonContent
            ? "Your lesson is saved to your library. Pick up where you left off."
            : "We restored your form. Generate when you're ready.",
        });
        // Drop the ?restore=1 marker so a manual refresh doesn't re-trigger.
        setLocation("/lesson-generator", { replace: true });
      } catch {
        /* claim is best-effort */
      }
    })();
    return () => { cancelled = true; };
  }, [shouldRestoreGuestState, isAuthenticated]);

  useEffect(() => {
    // Don't overwrite values we just restored from a guest handoff.
    if (shouldRestoreGuestState) return;
    // Task #16 — a dashboard deep-link with curriculum params always wins over
    // the educator-profile defaults. Checked directly off the URL (not the
    // profileApplied flag) so a cached profile query can't race ahead and
    // clobber the deep-link context before the URL effect's state lands.
    if (hasUrlStandardsParams) return;
    if (educatorProfile && !profileApplied) {
      if (educatorProfile.country) setSelectedCountry(resolveCountryName(educatorProfile.country));
      if (educatorProfile.state) setSelectedState(educatorProfile.state);
      if (educatorProfile.preferredSubject) setSelectedSubject(educatorProfile.preferredSubject);
      if (educatorProfile.preferredStandardCodes && (educatorProfile.preferredStandardCodes as StandardCode[]).length > 0) {
        setSelectedStandardCodes(educatorProfile.preferredStandardCodes as StandardCode[]);
      }
      setProfileApplied(true);
    }
  }, [educatorProfile, profileApplied, hasUrlStandardsParams, shouldRestoreGuestState]);

  // Fetch standards from API instead of hardcoded data
  const { data: countriesData } = useQuery<string[]>({
    queryKey: ["/api/standards/countries"],
  });
  const countries = countriesData || [];

  const { data: statesData } = useQuery<{ state: string; abbreviation: string; standardsName: string }[]>({
    queryKey: ["/api/standards/states", selectedCountry],
    enabled: !!selectedCountry,
  });
  const states = statesData || [];

  // Subjects are grade-aware: once a grade is chosen we only surface subjects
  // that actually have standards for that grade in the selected jurisdiction.
  const { data: subjectsData } = useQuery<{ subject: string }[]>({
    queryKey: ["/api/standards/subjects", selectedCountry, selectedState, gradeLevel],
    queryFn: async () => {
      const base = `/api/standards/subjects/${encodeURIComponent(selectedCountry)}/${encodeURIComponent(selectedState)}`;
      const url = gradeLevel ? `${base}?gradeLevels=${encodeURIComponent(gradeLevel)}` : base;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!selectedCountry && !!selectedState,
  });
  const subjects = subjectsData || [];

  // Standard codes are filtered to the chosen individual grade so the picker
  // shows only that grade's standards (not every grade's mixed together).
  const { data: standardCodesData } = useQuery<(StandardCode & { source?: "official" | "backup" | "curated" | "unverified" | "fallback"; sourceUrl?: string | null })[]>({
    queryKey: ["/api/standards/codes", selectedCountry, selectedState, selectedSubject, gradeLevel],
    queryFn: async () => {
      const base = `/api/standards/codes/${encodeURIComponent(selectedCountry)}/${encodeURIComponent(selectedState)}/${encodeURIComponent(selectedSubject)}`;
      const url = gradeLevel ? `${base}?gradeLevels=${encodeURIComponent(gradeLevel)}` : base;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    enabled: !!selectedCountry && !!selectedState && !!selectedSubject,
  });
  const standardCodes = standardCodesData || [];

  // Task #16 — once the cascade's code list loads, match the ?code= deep-link
  // and select it (with its real description), then clear the pending marker.
  useEffect(() => {
    if (!pendingPreselectCode || standardCodes.length === 0) return;
    const match = standardCodes.find((c) => c.code === pendingPreselectCode);
    if (match) {
      setSelectedStandardCodes((prev) =>
        prev.some((c) => c.code === match.code)
          ? prev
          : [...prev, { code: match.code, description: match.description }],
      );
    }
    setPendingPreselectCode(null);
  }, [pendingPreselectCode, standardCodes]);

  const standardsName = useMemo(() => {
    const stateInfo = states.find(s => s.abbreviation === selectedState);
    return stateInfo?.standardsName || "";
  }, [states, selectedState]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedState("");
    setSelectedSubject("");
    setSelectedStandardCodes([]);
    setSelectedLanguage("");
    // Clear an incompatible US-style grade selection when switching to an
    // African country (and vice-versa) so the dropdown shows a valid placeholder.
    const nextProfile = getAfricanProfile(country);
    const nextGrades = nextProfile ? nextProfile.gradeLevels : defaultGradeValues;
    if (gradeLevel && !nextGrades.includes(gradeLevel)) {
      setGradeLevel("");
    }
  };

  const handleStateChange = (stateAbbr: string) => {
    setSelectedState(stateAbbr);
    setSelectedSubject("");
    setSelectedStandardCodes([]);
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedStandardCodes([]);
  };

  const toggleStandardCode = (code: StandardCode) => {
    setSelectedStandardCodes(prev => {
      const exists = prev.find(c => c.code === code.code);
      if (exists) {
        return prev.filter(c => c.code !== code.code);
      }
      return [...prev, code];
    });
  };

  // Educational Resources functions
  const filteredProviders = useMemo(() => {
    return educationalResourceProviders.filter(p => {
      if (selectedResourceCategory !== "all" && p.category !== selectedResourceCategory) return false;
      if (resourceSearch) {
        const search = resourceSearch.toLowerCase();
        return p.name.toLowerCase().includes(search) || 
               p.description.toLowerCase().includes(search) ||
               p.subjects.some(s => s.toLowerCase().includes(search));
      }
      return true;
    });
  }, [selectedResourceCategory, resourceSearch]);

  const addResourceFromProvider = (provider: EducationalResourceProvider) => {
    const searchTerm = topic || generatedLesson?.topic || "";
    const url = getSearchUrl(provider, searchTerm);
    const resource: EducationalResource = {
      providerId: provider.id,
      providerName: provider.name,
      title: `${provider.name} - ${searchTerm || "Resources"}`,
      url,
      description: provider.description,
      type: provider.category === "video" ? "video" : 
            provider.category === "interactive" ? "interactive" :
            provider.category === "textbooks" ? "textbook" : "article",
    };
    setAddedResources(prev => [...prev, resource]);
    toast({ title: "Resource Added", description: `${provider.name} added to lesson resources` });
  };

  const addCustomResource = () => {
    if (!customResourceUrl || !customResourceTitle) {
      toast({ title: "Missing Info", description: "Please enter both title and URL", variant: "destructive" });
      return;
    }
    const resource: EducationalResource = {
      providerId: "custom",
      providerName: "Custom Resource",
      title: customResourceTitle,
      url: customResourceUrl,
      type: "other",
    };
    setAddedResources(prev => [...prev, resource]);
    setCustomResourceUrl("");
    setCustomResourceTitle("");
    toast({ title: "Resource Added", description: "Custom resource added to lesson" });
  };

  const removeResource = (index: number) => {
    setAddedResources(prev => prev.filter((_, i) => i !== index));
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "oer": return "Open Educational Resources";
      case "government": return "Government & Institutional";
      case "video": return "Video Resources";
      case "interactive": return "Interactive Simulations";
      case "textbooks": return "Free Textbooks";
      default: return category;
    }
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const stateData = states.find(s => s.abbreviation === selectedState);
      const body = {
        topic,
        course,
        unit,
        gradeLevel,
        bkdFocus,
        standards: {
          country: selectedCountry,
          state: selectedState,
          standardsName: stateData?.standardsName || standardsName,
          subject: selectedSubject,
          codes: selectedStandardCodes,
        },
        duration,
        lessonPart,
        // Optional bilingual language for African countries; ignored server-side otherwise.
        language: isAfrican ? selectedLanguage || undefined : undefined,
        // Org-uploaded curriculum context to honor pacing & sequencing
        alignmentContext: alignmentDocs.length > 0
          ? alignmentDocs.map((d) => ({ sourceTitle: d.title, sourceDocId: d.id, excerpt: d.excerpt }))
          : undefined,
      };

      // Reset streaming state for this run
      setLessonStreamPhase("studying");
      setLessonStreamDeltaTail("");
      setLessonStreamFallbackSource(null);
      setLessonStreamFallbackWarning(null);

      // Both guests and authed users get the same streaming countdown UX;
      // the endpoint differs but the envelope is identical.
      const endpoint = isAuthenticated
        ? "/api/lessons/generate-stream"
        : "/api/lessons/generate-guest-stream";

      const result = await streamGeneration<LessonPlan & { fallbackSource?: "cache" | "exemplar"; warning?: string; guestUsage?: { used: number; limit: number; remaining: number } }>(
        endpoint,
        body,
        (evt) => {
          if (evt.type === "phase") setLessonStreamPhase(evt.data as GenerationPhase);
          else if (evt.type === "delta") setLessonStreamDeltaTail((prev) => (prev + (evt.data ?? "")).slice(-300));
        },
      );
      if (result.fallbackSource) {
        setLessonStreamFallbackSource(result.fallbackSource);
        setLessonStreamFallbackWarning(result.warning ?? null);
      }
      return result;
    },
    onSuccess: (data) => {
      setGeneratedLesson(data);
      setIsSaved(false);
      if (isAuthenticated) {
        refetchUsage();
      } else {
        refetchGuestUsage();
      }
      // Initialize resources from generated lesson if any
      if (data.resources && data.resources.length > 0) {
        setAddedResources(data.resources.map(r => ({
          providerId: "ai-suggested",
          providerName: "AI Suggested",
          title: r.title,
          url: r.url || "",
          description: "",
          type: r.type as any || "other",
        })));
      } else {
        setAddedResources([]);
      }
      toast({
        title: "Lesson Generated!",
        description: "Great job! You just saved yourself 30+ minutes.",
      });
    },
    onError: (error: any) => {
      if (error?.requiresEmail) {
        // Server requires an email before unlocking free lessons.
        setEmailModalOpen(true);
        return;
      }
      if (error?.requiresSignup) {
        // Server confirmed the guest is out of free lessons. Open the
        // signup modal with form values + last lesson preserved.
        setGuestModalHardWall(true);
        setGuestModalOpen(true);
      } else if (error?.requiredTier) {
        toast({
          title: "Monthly Limit Reached",
          description: "Free accounts can generate up to 5 lessons per month. Upgrade to Pro for unlimited lessons.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Oops! Let's try that again",
          description: error.message || "There was an error generating your lesson.",
          variant: "destructive",
        });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedLesson) throw new Error("No lesson to save");
      // Embed the selected country up front so older saved lessons can later
      // be detected as African (e.g., for assignment generation) without
      // depending on fuzzy substring matching of the topic.
      const countryPrefix = selectedCountry ? `[${selectedCountry}] ` : "";
      const standardsString = generatedLesson.standards
        ? typeof generatedLesson.standards === "string"
          ? `${countryPrefix}${generatedLesson.standards}`
          : `${countryPrefix}${generatedLesson.standards.standardsName}: ${(generatedLesson.standards.codes || []).map((c: any) => c.code).join(", ")}`
        : countryPrefix;
      // Combine AI resources with user-added resources
      const allResources = addedResources.map(r => ({
        title: r.title,
        url: r.url,
        type: r.type,
      }));
      const response = await apiRequest("POST", "/api/lessons/save", {
        title: generatedLesson.title,
        topic: generatedLesson.topic,
        gradeLevel: generatedLesson.gradeLevel,
        bkdFocus: generatedLesson.bkdFocus,
        standards: standardsString,
        duration: generatedLesson.duration,
        objectives: generatedLesson.objectives,
        activities: generatedLesson.activities,
        materials: [...generatedLesson.materials, ...allResources.map(r => `${r.title}: ${r.url}`)],
        assessment: generatedLesson.assessment,
        reflection: generatedLesson.reflection,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsSaved(true);
      setSavedLessonId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      // Record standard usage so the picker's "Recently used" row and the
      // dashboard "Standards I've used" history populate. Fire-and-forget.
      if (selectedStandardCodes.length > 0 && selectedCountry && selectedState && selectedSubject) {
        apiRequest("POST", "/api/teacher-standards/record", {
          lessonId: data.id,
          codes: selectedStandardCodes.map((c: any) => ({
            country: selectedCountry,
            state: selectedState,
            subject: selectedSubject,
            code: c.code,
            description: c.description ?? "",
            gradeLevel: c.gradeLevel ?? gradeLevel ?? null,
            standardsName: c.standardsName ?? standardsName ?? null,
            source: c.source ?? null,
            sourceUrl: c.sourceUrl ?? null,
          })),
        })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/teacher-standards/recents"] });
            queryClient.invalidateQueries({ queryKey: ["/api/teacher-standards/history"] });
          })
          .catch(() => {});
      }
      toast({
        title: "Lesson Saved!",
        description: "Now you can create an aligned assignment from this lesson. Scroll down to get started.",
      });
      // Show assignment generation option with a slight delay for smooth animation
      setTimeout(() => {
        setShowAssignmentOption(true);
        // Auto-scroll to the assignment panel
        setTimeout(() => {
          const panel = document.querySelector('[data-testid="assignment-generation-panel"]');
          panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Assignment generation mutation (streaming)
  const assignmentMutation = useMutation({
    mutationFn: async () => {
      if (!savedLessonId) throw new Error("No saved lesson");
      setAssignmentStreamPhase("studying");
      setAssignmentStreamDeltaTail("");
      setAssignmentStreamFallbackSource(null);
      setAssignmentStreamFallbackWarning(null);
      const result = await streamGeneration<any>(
        "/api/assignments/generate-stream",
        {
          lessonId: savedLessonId,
          assignmentType,
          questionCount: assignmentQuestionCount,
          difficulty: assignmentDifficulty,
          includeBeKnowDo: true,
          // Carry African / WAEC context through to the assignment generator
          // so questions stay culturally and exam-aligned. No-op for non-African.
          country: isAfrican ? selectedCountry : undefined,
          language: isAfrican ? selectedLanguage || undefined : undefined,
        },
        (evt) => {
          if (evt.type === "phase") setAssignmentStreamPhase(evt.data as GenerationPhase);
          else if (evt.type === "delta") setAssignmentStreamDeltaTail((prev) => (prev + (evt.data ?? "")).slice(-300));
        },
      );
      if (result?.fallbackSource) {
        setAssignmentStreamFallbackSource(result.fallbackSource);
        setAssignmentStreamFallbackWarning(result.warning ?? null);
      }
      return result;
    },
    onSuccess: (data: any) => {
      setGeneratedAssignment(data);
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      // Record assignment-side standards usage so history reflects both
      // lesson- and assignment-attached codes.
      if (selectedStandardCodes.length > 0 && selectedCountry && selectedState && selectedSubject && data?.id) {
        apiRequest("POST", "/api/teacher-standards/record", {
          assignmentId: data.id,
          codes: selectedStandardCodes.map((c: any) => ({
            country: selectedCountry,
            state: selectedState,
            subject: selectedSubject,
            code: c.code,
            description: c.description ?? "",
            gradeLevel: c.gradeLevel ?? gradeLevel ?? null,
            standardsName: c.standardsName ?? standardsName ?? null,
            source: c.source ?? null,
            sourceUrl: c.sourceUrl ?? null,
          })),
        })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/teacher-standards/recents"] });
            queryClient.invalidateQueries({ queryKey: ["/api/teacher-standards/history"] });
          })
          .catch(() => {});
      }
      toast({
        title: "Assignment Created!",
        description: `Your ${assignmentType} is ready to use.`,
      });
    },
    onError: (error: any) => {
      const isUpgradeNeeded = error?.message?.includes("upgrade") || error?.message?.includes("tier");
      toast({
        title: isUpgradeNeeded ? "Upgrade Required" : "Generation Failed",
        description: isUpgradeNeeded 
          ? "Assignment generation requires a paid plan. Upgrade to Pro or Campus to unlock."
          : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    // Guests with quota left run through the same flow as authed users.
    // Out-of-quota guests open the signup modal with state preserved.
    if (!isAuthenticated && guestUsageData && guestUsageData.remaining <= 0) {
      setGuestModalHardWall(true);
      setGuestModalOpen(true);
      return;
    }
    if (!topic || !gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in the topic and grade level.",
        variant: "destructive",
      });
      return;
    }
    // For non-African countries, we still require specific standard codes (legal alignment).
    // For African countries we require country/state/subject but allow empty code lists,
    // since most national curricula don't expose a public per-outcome code system —
    // the AI infers outcomes from the African context block instead.
    if (!selectedCountry || !selectedState || !selectedSubject) {
      toast({
        title: "Curriculum Required",
        description: "Please select country, region, and subject so the lesson aligns to the right curriculum.",
        variant: "destructive",
      });
      return;
    }
    // Require code selection only when the system actually offers codes for
    // this subject. African + international developing-nation curricula
    // typically expose no per-outcome codes (standardCodes is empty); in that
    // case the AI infers outcomes from the topic + grade + country context.
    const codesAreAvailable = standardCodes.length > 0;
    if (!isAfrican && codesAreAvailable && selectedStandardCodes.length === 0) {
      toast({
        title: "Standards Required",
        description: "Please select your educational standards. This ensures your lesson meets legal requirements.",
        variant: "destructive",
      });
      return;
    }
    // Email gate — anonymous users provide an email once to unlock free
    // lessons. Capturing it opens the modal; onCaptured proceeds to generate.
    if (!isAuthenticated && guestUsageData && !guestUsageData.emailCaptured) {
      setEmailModalOpen(true);
      return;
    }
    generateMutation.mutate();
  };

  const copyToClipboard = () => {
    if (generatedLesson) {
      const standardsText = generatedLesson.standards
        ? typeof generatedLesson.standards === "string"
          ? generatedLesson.standards
          : `${generatedLesson.standards.standardsName}: ${(generatedLesson.standards.codes || []).map((c: any) => c.code).join(", ")}`
        : "";
      const text = `
LESSON PLAN: ${generatedLesson.title}
${generatedLesson.course ? `Course: ${generatedLesson.course}` : ""}
${generatedLesson.unit ? `Unit: ${generatedLesson.unit}` : ""}
Grade: ${generatedLesson.gradeLevel}
Duration: ${generatedLesson.duration}
Standards: ${standardsText}

ESSENTIAL QUESTIONS:
${generatedLesson.essentialQuestions?.map((q) => `- ${q}`).join("\n") || ""}

LYS METHODOLOGY:
Be (Character/Values): ${generatedLesson.lysMethodology?.be?.focus || ""} - ${generatedLesson.lysMethodology?.be?.description || ""}
Know (Resources): ${generatedLesson.lysMethodology?.know?.focus || ""} - ${generatedLesson.lysMethodology?.know?.description || ""}
Do (Excellence): ${generatedLesson.lysMethodology?.do?.focus || ""} - ${generatedLesson.lysMethodology?.do?.description || ""}

LEARNING OBJECTIVES:
${generatedLesson.objectives.map((o) => `- ${o}`).join("\n")}

INSTRUCTIONAL INPUT:
Anticipatory Set: ${generatedLesson.synchronousInstruction?.anticipatorySet || ""}
Modeling (I do): ${generatedLesson.synchronousInstruction?.modeling || ""}
Guided Practice (We do): ${generatedLesson.synchronousInstruction?.guidedPractice || ""}
Independent Practice: ${generatedLesson.synchronousInstruction?.independentPractice || ""}

MATERIALS:
${generatedLesson.materials.map((m) => `- ${m}`).join("\n")}

ASSESSMENT:
${generatedLesson.assessment}

LESSON CLOSE:
${generatedLesson.lessonClose?.educational ? `Educational: ${generatedLesson.lessonClose.educational}` : ""}
${generatedLesson.lessonClose?.social ? `Social: ${generatedLesson.lessonClose.social}` : ""}
${generatedLesson.lessonClose?.vocational ? `Vocational: ${generatedLesson.lessonClose.vocational}` : ""}

EDUCATIONAL RESOURCES:
${addedResources.length > 0 ? addedResources.map(r => `- ${r.title}: ${r.url}`).join("\n") : "No additional resources added"}
      `.trim();
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Lesson plan copied to clipboard.",
      });
    }
  };

  const bkdOptions = [
    { value: "be", label: "BE", description: "Identity & Purpose", icon: Heart, color: "bg-lys-yellow" },
    { value: "know", label: "KNOW", description: "Strategy & Resources", icon: Compass, color: "bg-lys-red" },
    { value: "do", label: "DO", description: "Action & Impact", icon: Target, color: "bg-lys-teal" },
  ];

  if (viewLessonId && viewLessonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-lys-red" />
          <p className="font-roboto text-muted-foreground">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-lys-red" />
            </div>
            <div>
              <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl text-foreground">
                AI Lesson Generator
              </h1>
              <p className="font-roboto text-muted-foreground">
                A usable, standards-aligned lesson plan in under five minutes — built on the Be-Know-Do framework.
              </p>
            </div>
          </div>
        </div>

        {requiresScopeSequence && !scopeSkipped && (
          <Alert className="mb-6 border-lys-teal/50 bg-lys-teal/5" data-testid="alert-scope-required">
            <LayoutList className="h-4 w-4 text-lys-teal" />
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span className="font-roboto">
                <strong className="font-oswald">Recommended:</strong> Create a Scope & Sequence first to organize your curriculum for the year.
              </span>
              <div className="flex items-center gap-2">
                <Link href="/curriculum-planning">
                  <Button variant="default" size="sm" className="gap-1 bg-lys-teal hover:bg-lys-teal/90" data-testid="button-go-to-scope">
                    <LayoutList className="h-3 w-3" />
                    Build Scope
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setScopeSkipped(true)}
                  data-testid="button-skip-scope"
                >
                  Skip for now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && (
          <Alert className="mb-6 border-lys-red/30 bg-lys-red/5" data-testid="alert-assignment-reminder">
            <ClipboardList className="h-4 w-4 text-lys-red" />
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span className="font-roboto">
                <strong className="font-oswald">Tip:</strong> After generating and saving a lesson, create matching assignments using the <strong>Assignment Generator</strong>.
              </span>
              <Link href="/assignments">
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-go-to-assignments">
                  <ClipboardList className="h-3 w-3" />
                  Go to Assignments
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {showAds && (
          <AdBanner position="inline" className="mb-6" />
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 no-print">
            <Card>
              <CardHeader className="bg-lys-teal/5 border-b">
                <CardTitle className="font-oswald text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-lys-teal" />
                  Lesson Details
                </CardTitle>
                <CardDescription className="font-roboto">
                  Fill in the details and let AI create your lesson plan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <AiAgentNotice />
                <div className="space-y-2">
                  <Label htmlFor="topic" className="font-oswald">Topic / Lesson Title</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., Annotating an Argumentative Text..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="font-roboto min-h-[80px]"
                    data-testid="input-lesson-topic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeLevel" className="font-oswald">Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger id="gradeLevel" className="font-roboto" data-testid="select-grade-level">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayGradeOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          disabled={opt.disabled}
                          className="font-roboto"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-lys-red" />
                      <Label className="font-oswald text-base">Educational Standards (Required)</Label>
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-2">
                        {hasProfile && (
                          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-profile-loaded">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">From Profile</span>
                          </Badge>
                        )}
                        <Link href="/settings">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1" data-testid="link-settings">
                            <Settings className="h-3 w-3" />
                            <span className="text-xs">Settings</span>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <StandardsCascadePicker
                    selectedCountry={selectedCountry}
                    selectedState={selectedState}
                    selectedSubject={selectedSubject}
                    selectedStandardCodes={selectedStandardCodes as any}
                    onCountryChange={handleCountryChange}
                    onStateChange={handleStateChange}
                    onSubjectChange={handleSubjectChange}
                    onToggleCode={toggleStandardCode as any}
                    showStandardSources={showStandardSources}
                    showRequestCurriculum={showStandardSources}
                    testIdPrefix=""
                  />

                  {alignmentDocs.length > 0 && (
                    <div className="rounded-md border border-lys-blue/30 bg-lys-blue/5 p-3" data-testid="banner-alignment-docs">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-lys-blue mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-semibold text-lys-blue">Aligning to your school's curriculum</p>
                          <p className="text-muted-foreground mt-0.5">
                            This lesson will follow {alignmentDocs.length === 1 ? "the document" : `${alignmentDocs.length} documents`} uploaded by your admin:{" "}
                            {alignmentDocs.map((d) => d.title).join(", ")}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {isAfrican && africanProfile && (
                  <div
                    className="space-y-3 rounded-md border border-lys-yellow/30 bg-lys-yellow/5 p-4"
                    data-testid="panel-african-context"
                  >
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-lys-yellow mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <p className="font-oswald text-sm font-semibold" data-testid="text-african-profile-title">
                          {`${africanProfile.name} curriculum mode`}
                        </p>
                        <p className="text-xs text-muted-foreground font-roboto">
                          {`Lessons will be aligned to ${africanProfile.examName} (${africanProfile.examFullName}), use ${africanProfile.region} grade names, and lead with African case studies instead of US defaults.`}
                          {isWAEC && " A WAEC dual-path bridge (exam outcome + global digital portfolio piece) will be added to every lesson."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Language of Instruction
                      </Label>
                      <Select
                        value={selectedLanguage || "english"}
                        onValueChange={(v) => setSelectedLanguage(v === "english" ? "" : v)}
                      >
                        <SelectTrigger className="font-roboto" data-testid="select-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english" className="font-roboto">
                            English only
                          </SelectItem>
                          {africanProfile.localLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code} className="font-roboto">
                              {`English + ${lang.name} (bilingual side-by-side)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedLanguage && (
                        <p className="text-xs text-muted-foreground font-roboto" data-testid="text-bilingual-hint">
                          Student-facing fields (objectives, questions, activities, materials) will appear in English and the selected language side-by-side.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course" className="font-oswald">Course</Label>
                    <Input
                      id="course"
                      placeholder="e.g., G8 ELAR"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="font-roboto"
                      data-testid="input-course"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="font-oswald">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="e.g., Unit 04"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="font-roboto"
                      data-testid="input-unit"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="font-oswald">Primary Be-Know-Do Focus</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {bkdOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBkdFocus(option.value as "be" | "know" | "do")}
                        className={`p-3 rounded-md border-2 transition-all ${
                          bkdFocus === option.value
                            ? `border-current ${option.color}/20 ring-2 ring-offset-2`
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                        data-testid={`button-bkd-${option.value}`}
                      >
                        <option.icon className={`h-5 w-5 mx-auto mb-1 ${
                          option.value === "be" ? "text-lys-yellow" :
                          option.value === "know" ? "text-lys-red" : "text-lys-teal"
                        }`} />
                        <p className="font-oswald text-sm font-semibold">{option.label}</p>
                        <p className="text-[10px] text-muted-foreground font-roboto">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="font-oswald">Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger id="duration" className="font-roboto" data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d} value={d} className="font-roboto">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessonPart" className="font-oswald">Lesson Part</Label>
                    <Input
                      id="lessonPart"
                      placeholder="e.g., 1 of 3"
                      value={lessonPart}
                      onChange={(e) => setLessonPart(e.target.value)}
                      className="font-roboto"
                      data-testid="input-lesson-part"
                    />
                  </div>
                </div>

                {isAuthenticated && usageData && !usageData.unlimited && (usageData.remaining ?? 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-lys-yellow" />
                      <span className="text-sm font-roboto">
                        {`${usageData.remaining} of ${usageData.limit} lessons remaining this month`}
                      </span>
                    </div>
                    <Link href="/pricing">
                      <Button size="sm" variant="ghost" className="text-xs font-roboto h-7" data-testid="button-upgrade-hint">
                        Go unlimited →
                      </Button>
                    </Link>
                  </div>
                )}

                {isAuthenticated && usageData && !usageData.unlimited && usageData.remaining === 0 && (
                  <div className="rounded-lg border-0 overflow-hidden" data-testid="card-limit-reached">
                    <div className="bg-gradient-to-br from-lys-yellow/10 via-background to-lys-red/10 p-5">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-lys-yellow/15 text-lys-yellow border-lys-yellow/30 text-xs font-roboto">Monthly Limit Reached</Badge>
                          </div>
                          <h4 className="font-oswald text-lg mb-1">Unlock Unlimited Lessons</h4>
                          <p className="text-xs text-muted-foreground font-roboto mb-3">
                            Free accounts include 5 lessons/month. Upgrade to Pro for unlimited AI generation, saved templates, and assignment creation.
                          </p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              "Unlimited lesson generation",
                              "Save & share lesson library",
                              "AI assignment creation",
                              "Standards alignment tools",
                            ].map((f) => (
                              <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-lys-yellow shrink-0" />
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 sm:border-l sm:border-border sm:pl-4 w-full sm:w-auto">
                          <p className="font-oswald text-2xl font-bold">${PLAN_PRICES.pro}<span className="text-sm font-normal text-muted-foreground font-roboto">/mo</span></p>
                          <Button
                            onClick={() => setLocation("/pricing")}
                            size="sm"
                            className="w-full sm:w-36 bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-1.5"
                            data-testid="button-upgrade-limit"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {canStartTrial ? "Start Free Trial" : "Upgrade Now"}
                          </Button>
                          <button
                            onClick={() => setLocation("/pricing")}
                            className="text-xs text-muted-foreground hover:text-foreground underline font-roboto"
                          >
                            View all plans
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!isAuthenticated && guestUsageData && (() => {
                  const remaining = guestUsageData.remaining;
                  const isWall = remaining <= 0;
                  const isSoftPaywall = remaining > 0 && remaining <= 2;
                  return (
                    <div
                      className={`flex items-center justify-between p-3 rounded-md ${
                        isWall
                          ? "bg-lys-red/10 border border-lys-red/30"
                          : isSoftPaywall
                          ? "bg-lys-yellow/10 border border-lys-yellow/30"
                          : "bg-muted"
                      }`}
                      data-testid="banner-guest-usage"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles
                          className={`h-4 w-4 ${
                            isWall ? "text-lys-red" : isSoftPaywall ? "text-lys-yellow" : "text-lys-yellow"
                          }`}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-roboto" data-testid="text-guest-usage-remaining">
                            {isWall
                              ? "You've used all 5 free lessons"
                              : remaining === 1
                              ? "1 free lesson left"
                              : `${remaining} of ${guestUsageData.limit} free lessons remaining`}
                          </span>
                          {isSoftPaywall && (
                            <span className="text-xs font-roboto text-muted-foreground">
                              Sign up free to keep going + save your work
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setGuestModalHardWall(isWall);
                          setGuestModalOpen(true);
                        }}
                        className={isWall ? "bg-lys-red hover:bg-lys-red/90 text-white" : ""}
                        data-testid="button-signup-guest"
                      >
                        {isWall ? "Sign Up Free" : "Sign Up"}
                      </Button>
                    </div>
                  );
                })()}

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || (isAuthenticated && usageData && usageData.remaining === 0)}
                  className="w-full bg-lys-red hover:bg-lys-red/90 text-white font-oswald text-lg h-12 gap-2"
                  data-testid="button-generate-lesson"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Crafting your lesson...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Lesson Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 print-content">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap bg-muted/30 border-b">
                <div>
                  <CardTitle className="font-oswald text-lg">Lesson Plan Preview</CardTitle>
                  <CardDescription className="font-roboto">
                    {generatedLesson ? "Your personalized LYS lesson is ready!" : "Your lesson will appear here"}
                  </CardDescription>
                </div>
                {generatedLesson && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAuthenticated && (
                      <Button 
                        variant={isSaved ? "secondary" : "default"}
                        size="sm" 
                        onClick={() => saveMutation.mutate()} 
                        disabled={saveMutation.isPending || isSaved}
                        className={`gap-1 font-roboto ${!isSaved ? 'bg-lys-teal hover:bg-lys-teal/90 text-white' : ''}`}
                        data-testid="button-save-lesson"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isSaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSaved ? "Saved" : "Save to Library"}
                      </Button>
                    )}
                    {isSaved && showAssignmentOption && !generatedAssignment && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const panel = document.querySelector('[data-testid="assignment-generation-panel"]');
                          panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="gap-1 font-roboto border-lys-teal/30 text-lys-teal"
                        data-testid="button-scroll-to-assignment"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Create Assignment
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    )}
                    {!isEditingLesson ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 font-roboto"
                        data-testid="button-edit-lesson"
                        onClick={() => {
                          if (!generatedLesson) return;
                          setEditTitle(generatedLesson.title);
                          setEditObjectives(generatedLesson.objectives.join("\n"));
                          setEditEssentialQuestions((generatedLesson.essentialQuestions || []).join("\n"));
                          setEditReflection((generatedLesson as any).reflection || "");
                          setIsEditingLesson(true);
                        }}
                      >
                        <PenLine className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="gap-1 font-roboto bg-lys-teal hover:bg-lys-teal/90 text-white"
                          data-testid="button-save-lesson-edits"
                          onClick={() => {
                            if (!generatedLesson) return;
                            setGeneratedLesson({
                              ...generatedLesson,
                              title: editTitle.trim() || generatedLesson.title,
                              objectives: editObjectives.split("\n").map(l => l.trim()).filter(Boolean),
                              essentialQuestions: editEssentialQuestions.split("\n").map(l => l.trim()).filter(Boolean),
                              reflection: editReflection,
                            } as any);
                            setIsSaved(false);
                            setIsEditingLesson(false);
                            toast({ title: "Changes applied", description: "Don't forget to save your lesson." });
                          }}
                        >
                          <Check className="h-4 w-4" />
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 font-roboto"
                          data-testid="button-cancel-lesson-edits"
                          onClick={() => setIsEditingLesson(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 font-roboto" data-testid="button-copy-lesson">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 font-roboto" data-testid="button-print-lesson">
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {generateMutation.isPending ? (
                  <div className="p-6">
                    <GenerationCountdown
                      phase={lessonStreamPhase}
                      deltaTail={lessonStreamDeltaTail}
                      fallbackSource={lessonStreamFallbackSource}
                      fallbackWarning={lessonStreamFallbackWarning}
                    />
                  </div>
                ) : generatedLesson ? (
                  <ScrollArea className="h-[700px]">
                    <div className="px-6 pt-4 print:hidden">
                      <AiGeneratedLabel />
                    </div>
                    {isEditingLesson && (
                      <div className="mx-6 mt-4 px-3 py-2 rounded-md bg-lys-teal/10 border border-lys-teal/30 flex items-center gap-2 text-sm font-roboto text-lys-teal">
                        <PenLine className="h-4 w-4 shrink-0" />
                        Edit mode — change the title, objectives, and questions below, then click <strong className="ml-1">Done</strong>.
                      </div>
                    )}
                    <div className="p-6 space-y-6">
                      <div className="border-b pb-4">
                        {isEditingLesson ? (
                          <div className="space-y-1 mb-3">
                            <Label className="text-xs text-muted-foreground font-roboto">Lesson Title</Label>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="font-oswald font-semibold tracking-tight text-lg"
                              data-testid="input-edit-lesson-title"
                            />
                          </div>
                        ) : (
                          <h2 className="font-oswald font-semibold tracking-tight text-2xl text-foreground mb-3">{generatedLesson.title}</h2>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-roboto">
                          {generatedLesson.course && (
                            <div><span className="text-muted-foreground">Course:</span> {generatedLesson.course}</div>
                          )}
                          {generatedLesson.unit && (
                            <div><span className="text-muted-foreground">Unit:</span> {generatedLesson.unit}</div>
                          )}
                          <div><span className="text-muted-foreground">Duration:</span> {generatedLesson.duration}</div>
                          {generatedLesson.lessonPart && (
                            <div><span className="text-muted-foreground">Part:</span> {generatedLesson.lessonPart}</div>
                          )}
                        </div>
                        {generatedLesson.standards && (
                          <div className="mt-3 p-3 bg-lys-teal/5 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <GraduationCap className="h-4 w-4 text-lys-teal" />
                              <span className="font-oswald text-sm font-semibold">
                                {typeof generatedLesson.standards === "string"
                                  ? generatedLesson.standards
                                  : generatedLesson.standards.standardsName}
                              </span>
                            </div>
                            {typeof generatedLesson.standards !== "string" && generatedLesson.standards.codes && (
                              <div className="flex flex-wrap gap-1">
                                {generatedLesson.standards.codes.map((code) => (
                                  <Badge key={code.code} variant="outline" className="font-roboto text-xs">
                                    {code.code}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {(generatedLesson.essentialQuestions && generatedLesson.essentialQuestions.length > 0) || isEditingLesson ? (
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-lys-yellow" />
                            Essential Questions
                          </h3>
                          {isEditingLesson ? (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-roboto">One question per line</Label>
                              <Textarea
                                value={editEssentialQuestions}
                                onChange={(e) => setEditEssentialQuestions(e.target.value)}
                                rows={4}
                                className="font-roboto text-sm"
                                data-testid="textarea-edit-essential-questions"
                              />
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {generatedLesson.essentialQuestions.map((q, i) => (
                                <li key={i} className="font-roboto text-sm italic text-muted-foreground pl-4 border-l-2 border-lys-yellow">
                                  {q}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}

                      {generatedLesson.lysMethodology && (
                        <div className="p-4 rounded-md bg-muted/30">
                          <h3 className="font-oswald text-lg font-semibold mb-3">LYS Methodology</h3>
                          <div className="grid gap-3">
                            <div className="flex items-start gap-3">
                              <Heart className="h-5 w-5 text-lys-yellow flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-oswald font-semibold text-lys-yellow">BE</span>
                                <span className="text-muted-foreground ml-2 font-roboto text-sm">
                                  {generatedLesson.lysMethodology.be.focus} - {generatedLesson.lysMethodology.be.description}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Compass className="h-5 w-5 text-lys-red flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-oswald font-semibold text-lys-red">KNOW</span>
                                <span className="text-muted-foreground ml-2 font-roboto text-sm">
                                  {generatedLesson.lysMethodology.know.focus} - {generatedLesson.lysMethodology.know.description}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Target className="h-5 w-5 text-lys-teal flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-oswald font-semibold text-lys-teal">DO</span>
                                <span className="text-muted-foreground ml-2 font-roboto text-sm">
                                  {generatedLesson.lysMethodology.do.focus} - {generatedLesson.lysMethodology.do.description}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-5 w-5 text-lys-red" />
                          Learning Objectives
                        </h3>
                        {isEditingLesson ? (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground font-roboto">One objective per line</Label>
                            <Textarea
                              value={editObjectives}
                              onChange={(e) => setEditObjectives(e.target.value)}
                              rows={5}
                              className="font-roboto text-sm"
                              data-testid="textarea-edit-objectives"
                            />
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {generatedLesson.objectives.map((obj, i) => (
                              <li key={i} className="flex items-start gap-2 font-roboto text-sm">
                                <span className="w-5 h-5 rounded-full bg-lys-red/10 text-lys-red text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {obj}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <Separator />

                      <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                            <Play className="h-5 w-5 text-lys-teal" />
                            Instructional Input
                          </h3>
                          <Tabs defaultValue="synchronous" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="synchronous" className="gap-2" data-testid="tab-synchronous">
                                <Users className="h-4 w-4" />
                                Synchronous
                              </TabsTrigger>
                              <TabsTrigger value="asynchronous" className="gap-2" data-testid="tab-asynchronous">
                                <Clock className="h-4 w-4" />
                                Asynchronous
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="synchronous" className="space-y-4">
                              <p className="text-xs text-muted-foreground font-roboto mb-2">
                                Live, real-time instruction with direct student interaction
                              </p>
                              {generatedLesson.synchronousInstruction && (
                                <>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Anticipatory Set (Introduction)</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.anticipatorySet}</p>
                                  </div>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Modeling (I Do)</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.modeling}</p>
                                  </div>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Guided Practice (We Do)</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.guidedPractice}</p>
                                  </div>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Independent Practice</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.independentPractice}</p>
                                  </div>
                                </>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="asynchronous" className="space-y-4">
                              <p className="text-xs text-muted-foreground font-roboto mb-2">
                                Self-paced learning activities students complete on their own time
                              </p>
                              {generatedLesson.asynchronousInstruction ? (
                                <>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Introduction / Hook</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.asynchronousInstruction.anticipatorySet}</p>
                                  </div>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Video / Content Review</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.asynchronousInstruction.modeling}</p>
                                  </div>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Discussion / Collaboration</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.asynchronousInstruction.guidedPractice}</p>
                                  </div>
                                  <div className="p-4 rounded-md bg-muted/30">
                                    <h4 className="font-oswald font-semibold text-sm mb-2">Self-Paced Practice</h4>
                                    <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.asynchronousInstruction.independentPractice}</p>
                                  </div>
                                </>
                              ) : (
                                <div className="p-6 rounded-md bg-muted/20 text-center">
                                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="font-roboto text-sm text-muted-foreground">
                                    Asynchronous instruction will be generated when available.
                                  </p>
                                  <p className="font-roboto text-xs text-muted-foreground mt-1">
                                    You can adapt the synchronous content for self-paced learning.
                                  </p>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3">Materials & Resources</h3>
                          <ul className="space-y-1">
                            {generatedLesson.materials.map((material, i) => (
                              <li key={i} className="flex items-center gap-2 font-roboto text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-lys-yellow"></div>
                                {material}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3">Assessment</h3>
                          <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.assessment}</p>
                        </div>
                      </div>

                      {generatedLesson.lessonClose && (
                        <>
                          <Separator />
                          <div className="p-4 rounded-md bg-lys-yellow/10 border border-lys-yellow/20">
                            <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                              <UserCheck className="h-5 w-5 text-lys-yellow" />
                              Lesson Close - Life Application
                            </h3>
                            <div className="space-y-3 font-roboto text-sm">
                              {generatedLesson.lessonClose.educational && (
                                <div>
                                  <span className="font-semibold">Educational:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.educational}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.social && (
                                <div>
                                  <span className="font-semibold">Social:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.social}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.vocational && (
                                <div>
                                  <span className="font-semibold">Vocational:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.vocational}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.financial && (
                                <div>
                                  <span className="font-semibold">Financial:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.financial}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.spiritual && (
                                <div>
                                  <span className="font-semibold">Spiritual:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.spiritual}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div className="p-4 rounded-md bg-lys-teal/5 border border-lys-teal/20">
                        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                          <h3 className="font-oswald text-lg font-semibold flex items-center gap-2">
                            <Library className="h-5 w-5 text-lys-teal" />
                            Educational Resources
                          </h3>
                          <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1" data-testid="button-add-resources">
                                <Plus className="h-4 w-4" />
                                Add Resources
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                              <DialogHeader>
                                <DialogTitle className="font-oswald">Add Educational Resources</DialogTitle>
                                <DialogDescription>
                                  Browse trusted open educational resources or add custom links
                                </DialogDescription>
                              </DialogHeader>
                              
                              <Tabs defaultValue="browse" className="flex-1 overflow-hidden flex flex-col">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="browse" data-testid="tab-browse-resources">Browse Resources</TabsTrigger>
                                  <TabsTrigger value="custom" data-testid="tab-custom-resource">Add Custom URL</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="browse" className="flex-1 overflow-hidden flex flex-col mt-4">
                                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    <div className="relative flex-1 min-w-0">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search resources..."
                                        value={resourceSearch}
                                        onChange={(e) => setResourceSearch(e.target.value)}
                                        className="pl-10"
                                        data-testid="input-resource-search"
                                      />
                                    </div>
                                    <Select value={selectedResourceCategory} onValueChange={(v: any) => setSelectedResourceCategory(v)}>
                                      <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-resource-category">
                                        <SelectValue placeholder="Category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="oer">Open Educational</SelectItem>
                                        <SelectItem value="government">Government</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="interactive">Interactive</SelectItem>
                                        <SelectItem value="textbooks">Textbooks</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <ScrollArea className="flex-1 pr-4">
                                    <div className="grid gap-3">
                                      {filteredProviders.map((provider) => (
                                        <div 
                                          key={provider.id}
                                          className="flex items-start gap-3 p-3 rounded-md border hover-elevate cursor-pointer"
                                          data-testid={`resource-provider-${provider.id}`}
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-oswald font-semibold">{provider.name}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {getCategoryLabel(provider.category)}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-roboto mb-2">{provider.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                              {provider.subjects.slice(0, 5).map((subject) => (
                                                <Badge key={subject} variant="secondary" className="text-xs">{subject}</Badge>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="flex flex-col gap-2">
                                            <Button 
                                              size="sm" 
                                              onClick={() => addResourceFromProvider(provider)}
                                              className="gap-1"
                                              data-testid={`button-add-${provider.id}`}
                                            >
                                              <Plus className="h-3 w-3" />
                                              Add
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => window.open(provider.url, '_blank')}
                                              className="gap-1"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Visit
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </TabsContent>
                                
                                <TabsContent value="custom" className="mt-4 space-y-4">
                                  <div className="space-y-2">
                                    <Label className="font-oswald">Resource Title</Label>
                                    <Input
                                      placeholder="e.g., NASA Mars Exploration Video"
                                      value={customResourceTitle}
                                      onChange={(e) => setCustomResourceTitle(e.target.value)}
                                      data-testid="input-custom-title"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="font-oswald">Resource URL</Label>
                                    <Input
                                      placeholder="https://..."
                                      value={customResourceUrl}
                                      onChange={(e) => setCustomResourceUrl(e.target.value)}
                                      data-testid="input-custom-url"
                                    />
                                  </div>
                                  <Button onClick={addCustomResource} className="w-full gap-2" data-testid="button-add-custom">
                                    <Plus className="h-4 w-4" />
                                    Add Custom Resource
                                  </Button>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {addedResources.length === 0 ? (
                          <p className="text-sm text-muted-foreground font-roboto text-center py-4">
                            No resources added yet. Click "Add Resources" to browse trusted educational sites like Khan Academy, NASA, MIT, and more.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {addedResources.map((resource, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-3 p-2 rounded-md bg-background/50 border"
                                data-testid={`added-resource-${index}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-roboto text-sm font-medium truncate">{resource.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{resource.providerName}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => window.open(resource.url, '_blank')}
                                    data-testid={`button-open-resource-${index}`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeResource(index)}
                                    data-testid={`button-remove-resource-${index}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Next Step: Assignment Generation - appears after saving */}
                      {showAssignmentOption && isSaved && (
                        <div 
                          className="mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500"
                          data-testid="assignment-generation-panel"
                        >
                          <Separator className="mb-4" />

                          {/* Step indicator */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-600 text-xs font-bold">
                                1
                              </div>
                              <span className="text-xs font-roboto text-muted-foreground">Generated</span>
                            </div>
                            <div className="h-px flex-1 bg-green-500/30 max-w-6" />
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-600 text-xs font-bold">
                                2
                              </div>
                              <span className="text-xs font-roboto text-muted-foreground">Saved</span>
                            </div>
                            <div className="h-px flex-1 bg-muted-foreground/20 max-w-6" />
                            <div className="flex items-center gap-1.5">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${generatedAssignment ? 'bg-green-500/20 text-green-600' : 'bg-lys-teal/20 text-lys-teal animate-pulse'}`}>
                                3
                              </div>
                              <span className={`text-xs font-roboto ${generatedAssignment ? 'text-muted-foreground' : 'text-lys-teal font-medium'}`}>
                                {generatedAssignment ? 'Assignment Created' : 'Create Assignment'}
                              </span>
                            </div>
                          </div>
                          
                          {!generatedAssignment ? (
                            <div className="relative overflow-hidden rounded-lg border border-lys-teal/20 bg-gradient-to-br from-lys-teal/5 via-background to-muted/20 p-6">
                              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-lys-teal/5 blur-2xl" />
                              
                              <div className="relative">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lys-teal/10">
                                    <ClipboardList className="h-5 w-5 text-lys-teal" />
                                  </div>
                                  <div>
                                    <h4 className="font-oswald text-base font-semibold">Next Step: Create an Assignment</h4>
                                    <p className="text-sm text-muted-foreground font-roboto">
                                      AI will generate questions aligned to your lesson's objectives and standards
                                    </p>
                                  </div>
                                </div>

                                {/* Alignment context from the lesson */}
                                {generatedLesson && (
                                  <div className="mb-4 p-3 rounded-md bg-muted/30 border border-muted/40">
                                    <p className="text-xs font-oswald text-muted-foreground mb-2 uppercase tracking-wide">Your assignment will be aligned to:</p>
                                    <div className="space-y-1.5">
                                      {generatedLesson.objectives && generatedLesson.objectives.length > 0 && (
                                        <div className="flex items-start gap-2">
                                          <Target className="h-3.5 w-3.5 text-lys-red flex-shrink-0 mt-0.5" />
                                          <p className="text-xs font-roboto text-muted-foreground">
                                            <span className="font-medium text-foreground">{generatedLesson.objectives.length} Learning Objective{generatedLesson.objectives.length !== 1 ? 's' : ''}</span>
                                            {' '}&mdash; {generatedLesson.objectives[0]?.substring(0, 80)}{(generatedLesson.objectives[0]?.length || 0) > 80 ? '...' : ''}
                                          </p>
                                        </div>
                                      )}
                                      {generatedLesson.standards && (
                                        <div className="flex items-start gap-2" data-testid="text-standards-alignment">
                                          <GraduationCap className="h-3.5 w-3.5 text-lys-teal flex-shrink-0 mt-0.5" />
                                          <p className="text-xs font-roboto text-foreground leading-relaxed">
                                            <span className="text-muted-foreground">Aligned to </span>
                                            {typeof generatedLesson.standards === "string" ? (
                                              <span className="font-medium">{generatedLesson.standards}</span>
                                            ) : (
                                              <>
                                                <span className="font-medium">{generatedLesson.standards.standardsName}</span>
                                                {generatedLesson.standards.codes?.length > 0 && (
                                                  <span className="text-muted-foreground">
                                                    {' '}&mdash;{' '}
                                                    <span className="font-medium text-foreground">
                                                      {generatedLesson.standards.codes.map((c: any) => c.code).join(', ')}
                                                    </span>
                                                  </span>
                                                )}
                                              </>
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      <div className="flex items-start gap-2">
                                        <Heart className="h-3.5 w-3.5 text-lys-yellow flex-shrink-0 mt-0.5" />
                                        <p className="text-xs font-roboto text-muted-foreground">
                                          <span className="font-medium text-foreground">Be-Know-Do</span>
                                          {' '}&mdash; Questions include identity reflection (BE), knowledge checks (KNOW), and application tasks (DO)
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Assignment type selector with descriptions */}
                                <div className="mb-4">
                                  <Label className="text-xs font-oswald text-muted-foreground uppercase tracking-wide mb-2 block">Assignment Type</Label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[
                                      { value: "quiz", label: "Quiz", icon: Brain, description: "Multiple choice, short answer, and matching questions" },
                                      { value: "worksheet", label: "Worksheet", icon: PenLine, description: "Structured practice problems and exercises" },
                                      { value: "project", label: "Project", icon: Award, description: "Hands-on learning activity with rubric" },
                                      { value: "discussion", label: "Discussion", icon: MessageSquare, description: "Collaborative prompts for group dialogue" },
                                      { value: "reflection", label: "Reflection", icon: Heart, description: "Personal growth and self-discovery journaling" },
                                    ].map((type) => (
                                      <button
                                        key={type.value}
                                        onClick={() => setAssignmentType(type.value as any)}
                                        className={`group flex flex-col items-start gap-1 rounded-md border p-3 text-left font-roboto toggle-elevate ${
                                          assignmentType === type.value 
                                            ? "toggle-elevated border-lys-teal bg-lys-teal/10" 
                                            : "border-muted-foreground/20"
                                        }`}
                                        data-testid={`assignment-type-${type.value}`}
                                      >
                                        <div className={`flex items-center gap-2 text-sm font-medium ${assignmentType === type.value ? 'text-lys-teal' : 'text-foreground'}`}>
                                          <type.icon className="h-4 w-4" />
                                          {type.label}
                                        </div>
                                        <p className="text-[11px] leading-tight text-muted-foreground">{type.description}</p>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Question count and difficulty controls */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                  <div className="flex-1 min-w-[140px]">
                                    <Label className="text-xs font-oswald text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                      Number of Questions
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      {[3, 5, 10, 15].map((count) => (
                                        <button
                                          key={count}
                                          onClick={() => setAssignmentQuestionCount(count)}
                                          className={`rounded-md border px-3 py-1.5 text-sm font-roboto toggle-elevate ${
                                            assignmentQuestionCount === count
                                              ? "toggle-elevated border-lys-teal bg-lys-teal/10 text-lys-teal font-medium"
                                              : "border-muted-foreground/20 text-muted-foreground"
                                          }`}
                                          data-testid={`question-count-${count}`}
                                        >
                                          {count}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-[140px]">
                                    <Label className="text-xs font-oswald text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                      Difficulty Level
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      {([
                                        { value: "easy", label: "Easy" },
                                        { value: "medium", label: "Medium" },
                                        { value: "hard", label: "Challenging" },
                                      ] as const).map((diff) => (
                                        <button
                                          key={diff.value}
                                          onClick={() => setAssignmentDifficulty(diff.value)}
                                          className={`rounded-md border px-3 py-1.5 text-sm font-roboto toggle-elevate ${
                                            assignmentDifficulty === diff.value
                                              ? "toggle-elevated border-lys-teal bg-lys-teal/10 text-lys-teal font-medium"
                                              : "border-muted-foreground/20 text-muted-foreground"
                                          }`}
                                          data-testid={`difficulty-${diff.value}`}
                                        >
                                          {diff.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <Button 
                                  onClick={() => assignmentMutation.mutate()}
                                  disabled={assignmentMutation.isPending}
                                  className="gap-2 bg-lys-teal border-lys-teal text-white font-roboto w-full sm:w-auto"
                                  data-testid="button-generate-assignment"
                                >
                                  {assignmentMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Creating {assignmentType}...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4" />
                                      Generate {assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)} ({assignmentQuestionCount} questions, {assignmentDifficulty})
                                      <ChevronRight className="h-4 w-4" />
                                    </>
                                  )}
                                </Button>
                                {assignmentMutation.isPending && (
                                  <div className="mt-4">
                                    <GenerationCountdown
                                      phase={assignmentStreamPhase}
                                      deltaTail={assignmentStreamDeltaTail}
                                      fallbackSource={assignmentStreamFallbackSource}
                                      fallbackWarning={assignmentStreamFallbackWarning}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border bg-card p-6 animate-in fade-in duration-300">
                              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                                    <Check className="h-5 w-5 text-green-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-oswald text-base font-semibold">{generatedAssignment.title}</h4>
                                    <p className="text-sm text-muted-foreground font-roboto">
                                      {generatedAssignment.questions?.length || 0} questions &middot; {assignmentDifficulty} difficulty &middot; {assignmentType}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const lines: string[] = [];
                                      lines.push(generatedAssignment.title || 'Assignment');
                                      lines.push('='.repeat(40));
                                      if (generatedAssignment.questions) {
                                        generatedAssignment.questions.forEach((q: any, i: number) => {
                                          lines.push('');
                                          lines.push(`${i + 1}. ${q.question}`);
                                          if (q.type) lines.push(`   Type: ${q.type} | Points: ${q.points || 0}`);
                                          if (q.bkdPillar) lines.push(`   BKD Pillar: ${q.bkdPillar.toUpperCase()}`);
                                          if (q.options) {
                                            q.options.forEach((opt: string, j: number) => {
                                              lines.push(`   ${String.fromCharCode(65 + j)}. ${opt}`);
                                            });
                                          }
                                          if (q.correctAnswer !== undefined) {
                                            lines.push(`   Answer: ${typeof q.correctAnswer === 'number' ? String.fromCharCode(65 + q.correctAnswer) : q.correctAnswer}`);
                                          }
                                        });
                                      }
                                      lines.push('');
                                      lines.push(`Total Points: ${generatedAssignment.totalPoints || 0}`);
                                      navigator.clipboard.writeText(lines.join('\n'));
                                      toast({ title: "Copied!", description: "Assignment copied as readable text" });
                                    }}
                                    className="gap-1"
                                    data-testid="button-copy-assignment"
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLocation(`/assignments`)}
                                    className="gap-1"
                                    data-testid="button-edit-assignment"
                                  >
                                    <PenLine className="h-4 w-4" />
                                    Edit & Assign
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setLocation("/assignments")}
                                    className="gap-1"
                                    data-testid="button-view-assignments"
                                  >
                                    View All Assignments
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Alignment summary */}
                              {generatedAssignment.questions && (
                                <div className="mb-4 p-3 rounded-md bg-green-500/5 border border-green-500/10">
                                  <div className="flex flex-wrap gap-3 text-xs font-roboto">
                                    <span className="text-muted-foreground">
                                      <span className="font-medium text-foreground">{generatedAssignment.questions.length}</span> questions
                                    </span>
                                    <span className="text-muted-foreground">
                                      <span className="font-medium text-foreground">{generatedAssignment.totalPoints || 0}</span> total points
                                    </span>
                                    {(() => {
                                      const bkd = { be: 0, know: 0, do: 0 } as Record<string, number>;
                                      generatedAssignment.questions.forEach((q: any) => { if (q.bkdPillar && bkd[q.bkdPillar] !== undefined) bkd[q.bkdPillar]++; });
                                      return Object.entries(bkd).filter(([, v]) => v > 0).map(([k, v]) => (
                                        <span key={k} className="text-muted-foreground">
                                          <span className="font-medium text-foreground">{v}</span> {k.toUpperCase()}
                                        </span>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}

                              {generatedAssignment.questions && (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-always-visible pr-2">
                                  {generatedAssignment.questions.slice(0, 5).map((q: any, i: number) => (
                                    <div key={i} className="p-3 rounded-md bg-muted/30 border border-muted/50">
                                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                                        <p className="font-roboto text-sm font-medium">
                                          {i + 1}. {q.question}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                          {q.bkdPillar && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                              {q.bkdPillar.toUpperCase()}
                                            </Badge>
                                          )}
                                          {q.points !== undefined && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                              {q.points}pt{q.points !== 1 ? 's' : ''}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {q.options && (
                                        <div className="ml-4 space-y-1">
                                          {q.options.map((opt: string, j: number) => (
                                            <p key={j} className={`text-sm font-roboto ${j === q.correctAnswer ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                              {String.fromCharCode(65 + j)}. {opt}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {generatedAssignment.questions.length > 5 && (
                                    <p className="text-sm text-muted-foreground text-center py-2 font-roboto">
                                      + {generatedAssignment.questions.length - 5} more questions &mdash; view all in Assignments
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="mt-4 pt-4 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setGeneratedAssignment(null);
                                    setShowAssignmentOption(true);
                                  }}
                                  className="text-muted-foreground"
                                  data-testid="button-create-another"
                                >
                                  Create another assignment
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-oswald text-lg text-muted-foreground">Your lesson plan will appear here</h3>
                    <p className="text-sm text-muted-foreground/70 font-roboto mt-2 max-w-sm">
                      Fill in the details on the left, then hit Generate.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mt-8 no-print">
            <Collapsible open={myLessonsOpen} onOpenChange={setMyLessonsOpen}>
              <Card className="border-muted">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover-elevate py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-lys-yellow" />
                        </div>
                        <div>
                          <CardTitle className="font-oswald text-lg">My Saved Lessons</CardTitle>
                          <CardDescription className="font-roboto text-sm">
                            {savedLessons.length} lesson{savedLessons.length !== 1 ? "s" : ""} in your library
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {savedLessons.length > 0 && (
                          <Link href="/my-lessons">
                            <Button variant="outline" size="sm" className="gap-1" data-testid="button-view-all-lessons">
                              View All
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="icon" data-testid="button-toggle-lessons">
                          {myLessonsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    {lessonsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : savedLessons.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="font-roboto">No saved lessons yet.</p>
                        <p className="text-sm">Generate and save your first lesson above.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {savedLessons.slice(0, 10).map((lesson) => {
                          const bkdConfig: Record<string, { color: string; icon: typeof Heart }> = {
                            be: { color: "bg-lys-yellow/10 text-lys-yellow", icon: Heart },
                            know: { color: "bg-lys-teal/10 text-lys-teal", icon: Compass },
                            do: { color: "bg-lys-red/10 text-lys-red", icon: Target },
                          };
                          const bkd = bkdConfig[lesson.bkdFocus || "be"] || bkdConfig.be;
                          const BkdIcon = bkd.icon;
                          return (
                            <div 
                              key={lesson.id} 
                              className="flex items-center gap-3 p-3 rounded-md border bg-card/50 hover-elevate group"
                              data-testid={`lesson-row-${lesson.id}`}
                            >
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${bkd.color}`}>
                                <BkdIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-oswald text-sm font-medium truncate">{lesson.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{lesson.gradeLevel}</span>
                                  {lesson.standards && <span className="truncate max-w-[150px]">{lesson.standards.split(":")[0]}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/lesson/${lesson.id}`}>
                                  <Button size="icon" variant="ghost" data-testid={`button-view-lesson-${lesson.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                  data-testid={`button-delete-lesson-${lesson.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {savedLessons.length > 10 && (
                          <div className="text-center pt-2">
                            <Link href="/my-lessons">
                              <Button variant="ghost" size="sm" className="text-muted-foreground">
                                + {savedLessons.length - 10} more lessons
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        )}
      </div>

      <GuestSignupModal
        open={guestModalOpen}
        onOpenChange={setGuestModalOpen}
        hardWall={guestModalHardWall}
        formContext={{
          topic,
          selectedCountry,
          selectedState,
          selectedSubject,
          gradeLevel,
          bkdFocus,
          duration,
          unit,
          lessonPart,
        }}
        lastLessonContent={generatedLesson}
      />

      <GuestEmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        onCaptured={() => {
          refetchGuestUsage();
          generateMutation.mutate();
        }}
      />
    </div>
  );
}
