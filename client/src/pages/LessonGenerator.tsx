import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/use-auth";
import { useTier } from "@/hooks/use-tier";
import { AdBanner } from "@/components/AdBanner";
import type { LessonPlan, EducatorProfile, Lesson } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { StandardCode } from "@shared/standards";
import { educationalResourceProviders, getSearchUrl, type EducationalResourceProvider, type EducationalResource } from "@shared/educationalResources";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const gradeLevels = [
  "Elementary (K-2)",
  "Elementary (3-5)",
  "Middle School (6-8)",
  "High School (9-10)",
  "High School (11-12)",
];

const durations = ["30 minutes", "45 minutes", "60 minutes", "90 minutes", "1-2 class periods"];

export default function LessonGenerator() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { showAds, requiresScopeSequence, tier } = useTier();
  const [, setLocation] = useLocation();
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
  
  const [generatedLesson, setGeneratedLesson] = useState<LessonPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [profileApplied, setProfileApplied] = useState(false);
  const [scopeSkipped, setScopeSkipped] = useState(false);
  
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

  const { data: profileData } = useQuery<{ profile: EducatorProfile | null; tier: string }>({
    queryKey: ["/api/educator-profile"],
    enabled: isAuthenticated,
  });

  const { data: usageData, refetch: refetchUsage } = useQuery<{ tier: string; monthlyCount: number; limit: number | null; remaining: number | null; unlimited: boolean }>({
    queryKey: ["/api/lessons/usage"],
    enabled: isAuthenticated,
  });

  const { data: guestUsageData, refetch: refetchGuestUsage } = useQuery<{ used: number; limit: number; remaining: number }>({
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

  useEffect(() => {
    if (educatorProfile && !profileApplied) {
      if (educatorProfile.country) setSelectedCountry(educatorProfile.country);
      if (educatorProfile.state) setSelectedState(educatorProfile.state);
      if (educatorProfile.preferredStandardCodes && (educatorProfile.preferredStandardCodes as StandardCode[]).length > 0) {
        setSelectedStandardCodes(educatorProfile.preferredStandardCodes as StandardCode[]);
      }
      setProfileApplied(true);
    }
  }, [educatorProfile, profileApplied]);

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

  const { data: subjectsData } = useQuery<{ subject: string }[]>({
    queryKey: ["/api/standards/subjects", selectedCountry, selectedState],
    enabled: !!selectedCountry && !!selectedState,
  });
  const subjects = subjectsData || [];

  const { data: standardCodesData } = useQuery<StandardCode[]>({
    queryKey: ["/api/standards/codes", selectedCountry, selectedState, selectedSubject],
    enabled: !!selectedCountry && !!selectedState && !!selectedSubject,
  });
  const standardCodes = standardCodesData || [];

  const standardsName = useMemo(() => {
    const stateInfo = states.find(s => s.abbreviation === selectedState);
    return stateInfo?.standardsName || "";
  }, [states, selectedState]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedState("");
    setSelectedSubject("");
    setSelectedStandardCodes([]);
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
      const endpoint = isAuthenticated ? "/api/lessons/generate" : "/api/lessons/generate-guest";
      const response = await apiRequest("POST", endpoint, {
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
      });
      return await response.json() as LessonPlan;
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
    onError: async (error: any) => {
      const errorData = error?.response ? await error.response.json().catch(() => ({})) : {};
      if (errorData.requiresSignup) {
        toast({
          title: "Free Lessons Used",
          description: "Create a free account to continue generating lessons and save your work!",
          variant: "destructive",
        });
      } else if (errorData.requiredTier) {
        toast({
          title: "Monthly Limit Reached",
          description: "Free accounts can generate up to 3 lessons per month. Upgrade to Pro for unlimited lessons.",
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
      const standardsString = generatedLesson.standards 
        ? `${generatedLesson.standards.standardsName}: ${generatedLesson.standards.codes.map(c => c.code).join(", ")}`
        : "";
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

  // Assignment generation mutation
  const assignmentMutation = useMutation({
    mutationFn: async () => {
      if (!savedLessonId) throw new Error("No saved lesson");
      const response = await apiRequest("POST", "/api/assignments/generate", {
        lessonId: savedLessonId,
        assignmentType,
        questionCount: assignmentQuestionCount,
        difficulty: assignmentDifficulty,
        includeBeKnowDo: true,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedAssignment(data);
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
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
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to generate lessons.",
        variant: "destructive",
      });
      setLocation("/api/login");
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
    if (!selectedCountry || !selectedState || !selectedSubject || selectedStandardCodes.length === 0) {
      toast({
        title: "Standards Required",
        description: "Please select your educational standards. This ensures your lesson meets legal requirements.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const copyToClipboard = () => {
    if (generatedLesson) {
      const standardsText = generatedLesson.standards 
        ? `${generatedLesson.standards.standardsName}: ${generatedLesson.standards.codes.map(c => c.code).join(", ")}`
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-lys-red" />
            </div>
            <div>
              <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
                AI Lesson Generator
              </h1>
              <p className="font-roboto text-muted-foreground">
                Create standards-aligned lessons using the LYS Be-Know-Do methodology
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
                <Link href="/scope-sequence">
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
                      {gradeLevels.map((level) => (
                        <SelectItem key={level} value={level} className="font-roboto">
                          {level}
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Country
                      </Label>
                      <Select value={selectedCountry} onValueChange={handleCountryChange}>
                        <SelectTrigger className="font-roboto" data-testid="select-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country} className="font-roboto">
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        State/Region
                      </Label>
                      <Select value={selectedState} onValueChange={handleStateChange} disabled={!selectedCountry}>
                        <SelectTrigger className="font-roboto" data-testid="select-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.abbreviation} value={state.abbreviation} className="font-roboto">
                              {state.state} ({state.standardsName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Subject Area
                    </Label>
                    <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={!selectedState}>
                      <SelectTrigger className="font-roboto" data-testid="select-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.subject} value={subject.subject} className="font-roboto">
                            {subject.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selection breadcrumb path */}
                  {(selectedCountry || selectedState || selectedSubject) && (
                    <div className="flex items-center gap-1 text-xs font-roboto text-muted-foreground bg-muted/50 rounded-md px-3 py-2" data-testid="breadcrumb-selection">
                      {selectedCountry && (
                        <>
                          <Globe className="h-3 w-3" />
                          <span>{selectedCountry}</span>
                        </>
                      )}
                      {selectedState && (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <MapPin className="h-3 w-3" />
                          <span>{states.find(s => s.abbreviation === selectedState)?.state || selectedState}</span>
                        </>
                      )}
                      {selectedSubject && (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <FileText className="h-3 w-3" />
                          <span>{selectedSubject}</span>
                        </>
                      )}
                    </div>
                  )}

                  {standardCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground">
                        {standardsName} Standard Codes (select all that apply)
                      </Label>
                      <ScrollArea className="h-48 rounded-md border bg-muted/30">
                        <div className="p-3 space-y-1">
                          {standardCodes.map((code) => (
                            <div 
                              key={code.code} 
                              className="flex items-start gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                            >
                              <Checkbox
                                id={code.code}
                                checked={selectedStandardCodes.some(c => c.code === code.code)}
                                onCheckedChange={() => toggleStandardCode(code)}
                                className="mt-0.5"
                                data-testid={`checkbox-standard-${code.code}`}
                              />
                              <label htmlFor={code.code} className="font-roboto text-sm cursor-pointer leading-relaxed flex-1">
                                <span className="font-semibold text-lys-teal">{code.code}</span>
                                <span className="text-muted-foreground ml-2">{code.description}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {selectedStandardCodes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedStandardCodes.map((code) => (
                            <Badge 
                              key={code.code} 
                              variant="secondary" 
                              className="font-roboto text-xs cursor-pointer"
                              onClick={() => toggleStandardCode(code)}
                              data-testid={`badge-selected-${code.code}`}
                            >
                              {code.code}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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

                {isAuthenticated && usageData && !usageData.unlimited && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-lys-yellow" />
                      <span className="text-sm font-roboto">
                        {usageData.remaining === 0 
                          ? "Monthly limit reached" 
                          : `${usageData.remaining} of ${usageData.limit} lessons remaining this month`}
                      </span>
                    </div>
                    {usageData.remaining === 0 && (
                      <Link href="/pricing">
                        <Button size="sm" variant="default" data-testid="button-upgrade-limit">
                          Upgrade
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {!isAuthenticated && guestUsageData && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-lys-yellow" />
                      <span className="text-sm font-roboto">
                        {guestUsageData.remaining === 0 
                          ? "Free lessons used" 
                          : `${guestUsageData.remaining} of ${guestUsageData.limit} free lessons remaining`}
                      </span>
                    </div>
                    <Link href="/api/login">
                      <Button size="sm" variant="default" data-testid="button-signup-guest">
                        {guestUsageData.remaining === 0 ? "Sign Up Free" : "Sign In"}
                      </Button>
                    </Link>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || (isAuthenticated && usageData && usageData.remaining === 0) || (!isAuthenticated && guestUsageData && guestUsageData.remaining === 0)}
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
                  <div className="flex items-center gap-2">
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
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-lys-red/10 flex items-center justify-center animate-pulse">
                        <Sparkles className="h-8 w-8 text-lys-red" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-lys-red/30 animate-ping"></div>
                    </div>
                    <p className="mt-6 font-oswald text-lg">Crafting your personalized lesson plan...</p>
                    <p className="text-sm text-muted-foreground font-roboto mt-2">
                      This usually takes about 10-15 seconds
                    </p>
                  </div>
                ) : generatedLesson ? (
                  <ScrollArea className="h-[700px]">
                    <div className="p-6 space-y-6">
                      <div className="border-b pb-4">
                        <h2 className="font-marker text-2xl text-foreground mb-3">{generatedLesson.title}</h2>
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
                              <span className="font-oswald text-sm font-semibold">{generatedLesson.standards.standardsName}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {generatedLesson.standards.codes.map((code) => (
                                <Badge key={code.code} variant="outline" className="font-roboto text-xs">
                                  {code.code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {generatedLesson.essentialQuestions && generatedLesson.essentialQuestions.length > 0 && (
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-lys-yellow" />
                            Essential Questions
                          </h3>
                          <ul className="space-y-2">
                            {generatedLesson.essentialQuestions.map((q, i) => (
                              <li key={i} className="font-roboto text-sm italic text-muted-foreground pl-4 border-l-2 border-lys-yellow">
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                                    <div className="relative flex-1 min-w-[200px]">
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
                                      <SelectTrigger className="w-[200px]" data-testid="select-resource-category">
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
                                        <div className="flex items-start gap-2">
                                          <GraduationCap className="h-3.5 w-3.5 text-lys-teal flex-shrink-0 mt-0.5" />
                                          <p className="text-xs font-roboto text-muted-foreground">
                                            <span className="font-medium text-foreground">{generatedLesson.standards.standardsName}</span>
                                            {' '}&mdash; {generatedLesson.standards.codes.map(c => c.code).join(', ')}
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
                    <h3 className="font-oswald text-lg text-muted-foreground">Your first amazing lesson is just a click away</h3>
                    <p className="text-sm text-muted-foreground/70 font-roboto mt-2 max-w-sm">
                      Fill in the details on the left and click "Generate Lesson Plan" to create a standards-aligned LYS lesson
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
    </div>
  );
}
