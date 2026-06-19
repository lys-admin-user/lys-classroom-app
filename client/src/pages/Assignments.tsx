import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AiGeneratedLabel } from "@/components/AiDisclosure";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, FileText, Users, UserPlus, AlertTriangle, Check, Clock, BookOpen, Target, Compass, Lightbulb, Lock, GraduationCap, Copy, Printer, Pencil, Trash2, Plus, CheckCircle, Play, Search, RefreshCw, Star, ArrowRight, HelpCircle, ScrollText, Heart, ChevronDown, ChevronRight, Eye, EyeOff, BarChart3, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTier } from "@/hooks/use-tier";
import { useTrial } from "@/hooks/use-trial";
import { PLAN_PRICES } from "@/lib/pricing";
import type { Lesson, Assignment, Class, Student, StudentGroup, AccommodationType } from "@shared/schema";
import { StandardsCascadePicker, StandardsSourcePopover, type CatalogCodeClient } from "@/components/StandardsCascadePicker";
import { accommodationLabels } from "@shared/schema";

const ASSIGNMENT_TYPES = [
  { value: "quiz", label: "Quiz", description: "Multiple choice and short answer questions" },
  { value: "worksheet", label: "Worksheet", description: "Comprehensive practice problems" },
  { value: "project", label: "Project", description: "Extended creative assignment with phases" },
  { value: "discussion", label: "Discussion", description: "Open-ended discussion prompts" },
  { value: "reflection", label: "Reflection", description: "Self-reflection and journaling" },
];

// Project Templates using "Low-Floor, High-Ceiling" method
const PROJECT_TEMPLATES = [
  { 
    value: "community_consultant", 
    label: "Community Consultant", 
    description: "Service Learning: Identify a real-world problem and propose a solution",
    bkdFocus: "do" as const,
    icon: Users
  },
  { 
    value: "kitchen_lab", 
    label: "Kitchen Lab", 
    description: "Inquiry-Based: Use household items to test scientific principles",
    bkdFocus: "know" as const,
    icon: Lightbulb
  },
  { 
    value: "digital_storyteller", 
    label: "Digital Storyteller", 
    description: "Creative Synthesis: Teach a concept by creating content for younger students",
    bkdFocus: "be" as const,
    icon: BookOpen
  },
  { 
    value: "custom", 
    label: "Custom Project", 
    description: "Create a tailored project for your specific lesson objectives",
    bkdFocus: "do" as const,
    icon: Target
  },
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", description: "Foundational understanding" },
  { value: "medium", label: "Medium", description: "Standard rigor" },
  { value: "hard", label: "Hard", description: "Advanced challenge" },
];

interface AccommodationSuggestion {
  id: string;
  type: AccommodationType;
  category: string;
  suggestion: string;
  source: string;
}

// Shared renderer for the standards-source provenance badges so the saved
// cards, the generated/preview detail, and the student/parent views all show
// the same code badges + source popover. When `includePrint` is set, a static
// badge-free line is emitted for print output alongside the screen badges.
function AssignmentStandardsBadges({
  codes,
  testIdPrefix,
  showPopover = true,
  includePrint = false,
}: {
  codes: CatalogCodeClient[] | null | undefined;
  testIdPrefix: string;
  showPopover?: boolean;
  includePrint?: boolean;
}) {
  if (!codes?.length) return null;
  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-1.5${includePrint ? " print:hidden" : ""}`}
        data-testid={`${testIdPrefix}-standards-list`}
      >
        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
        {codes.map((sc) => (
          <span
            key={sc.code}
            className="inline-flex items-center"
            data-testid={`${testIdPrefix}-standard-${sc.code}`}
          >
            <Badge variant="secondary" className="text-[10px] font-roboto">
              {sc.code}
            </Badge>
            {showPopover && sc.source && (
              <StandardsSourcePopover
                code={sc}
                testId={`${testIdPrefix}-badge-source-${sc.code}`}
              />
            )}
          </span>
        ))}
      </div>
      {includePrint && (
        <p
          className="hidden print:block text-xs"
          data-testid={`${testIdPrefix}-standards-print`}
        >
          <span className="font-semibold">Standards: </span>
          {codes.map((sc) => sc.code).join(", ")}
        </p>
      )}
    </>
  );
}

// Derive structured standard codes from a saved lesson's lossy `standards`
// string. The lesson save flow serializes alignment as
// "[Country] StandardsName: CODE1, CODE2" — we strip the optional country
// provenance prefix, then read the comma-separated codes that follow the
// standards-name label. Lessons whose standards are free-text (no colon)
// expose no per-outcome codes and yield an empty list.
function parseLessonStandardCodes(
  standards: string | null | undefined,
): CatalogCodeClient[] {
  if (!standards) return [];
  const withoutCountry = standards.replace(/^\s*\[[^\]]*\]\s*/, "");
  const colonIdx = withoutCountry.indexOf(":");
  if (colonIdx < 0) return [];
  return withoutCountry
    .slice(colonIdx + 1)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((code) => ({ code, description: "" }));
}

// Pull the "[Country]" provenance prefix back out of a lesson's standards
// string so the AI Generate tab's picker can pre-select the right country.
function parseLessonStandardCountry(
  standards: string | null | undefined,
): string {
  if (!standards) return "";
  const m = standards.match(/^\s*\[([^\]]+)\]/);
  return m ? m[1].trim() : "";
}

export default function Assignments() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const standardFilter = (new URLSearchParams(searchString).get("standard") || "").trim();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { isPaid: hasTrialOrPaid } = useTier();
  const { canStartTrial } = useTrial();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [assignmentType, setAssignmentType] = useState("quiz");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [includeBeKnowDo, setIncludeBeKnowDo] = useState(true);
  const [selectedAccommodations, setSelectedAccommodations] = useState<AccommodationType[]>([]);
  const [accommodationNotes, setAccommodationNotes] = useState("");
  const [generatedAssignment, setGeneratedAssignment] = useState<any>(null);
  const [projectTemplate, setProjectTemplate] = useState("community_consultant");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<"student" | "group" | "class">("student");
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);

  const isPaidUser = hasTrialOrPaid || user?.tier === "pro" || user?.tier === "campus";
  const isStudent = user?.role === "student";
  const isParent = (user?.role as any) === "parent";
  const [isEditing, setIsEditing] = useState(false);

  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualInstructions, setManualInstructions] = useState("");
  const [manualDueDate, setManualDueDate] = useState("");
  const [manualClassId, setManualClassId] = useState("");
  const [manualStdCountry, setManualStdCountry] = useState("");
  const [manualStdState, setManualStdState] = useState("");
  const [manualStdSubject, setManualStdSubject] = useState("");
  const [manualStdCodes, setManualStdCodes] = useState<CatalogCodeClient[]>([]);
  const handleManualStdCountry = (c: string) => {
    setManualStdCountry(c);
    setManualStdState("");
    setManualStdSubject("");
    setManualStdCodes([]);
  };
  const handleManualStdState = (s: string) => {
    setManualStdState(s);
    setManualStdSubject("");
    setManualStdCodes([]);
  };
  const handleManualStdSubject = (s: string) => {
    setManualStdSubject(s);
    setManualStdCodes([]);
  };
  const toggleManualStdCode = (code: CatalogCodeClient) => {
    setManualStdCodes((prev) =>
      prev.some((c) => c.code === code.code)
        ? prev.filter((c) => c.code !== code.code)
        : [...prev, code],
    );
  };

  // AI Generate tab: standards inherited from the selected source lesson.
  // Pre-populated from the lesson's saved alignment (see useEffect below) and
  // editable via the same StandardsCascadePicker before the generated
  // assignment is saved. Unlike the manual flow, cascade navigation does NOT
  // clear the inherited codes — teachers add to or remove from the inherited
  // set rather than starting from scratch.
  const [aiStdCountry, setAiStdCountry] = useState("");
  const [aiStdState, setAiStdState] = useState("");
  const [aiStdSubject, setAiStdSubject] = useState("");
  const [aiStdCodes, setAiStdCodes] = useState<CatalogCodeClient[]>([]);
  const handleAiStdCountry = (c: string) => {
    setAiStdCountry(c);
    setAiStdState("");
    setAiStdSubject("");
  };
  const handleAiStdState = (s: string) => {
    setAiStdState(s);
    setAiStdSubject("");
  };
  const handleAiStdSubject = (s: string) => {
    setAiStdSubject(s);
  };
  const toggleAiStdCode = (code: CatalogCodeClient) => {
    setAiStdCodes((prev) =>
      prev.some((c) => c.code === code.code)
        ? prev.filter((c) => c.code !== code.code)
        : [...prev, code],
    );
  };
  const [manualQuestions, setManualQuestions] = useState<{
    type: "multiple_choice" | "short_answer" | "essay" | "true_false";
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
    bkdFocus: "be" | "know" | "do";
  }[]>([]);

  const addManualQuestion = () => {
    setManualQuestions(prev => [...prev, {
      type: "short_answer",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
      bkdFocus: "know",
    }]);
  };

  const updateManualQuestion = (index: number, field: string, value: any) => {
    setManualQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateManualQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    setManualQuestions(prev => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      options[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  const removeManualQuestion = (index: number) => {
    setManualQuestions(prev => prev.filter((_, i) => i !== index));
  };
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedQuestionDetails, setExpandedQuestionDetails] = useState<Set<number>>(new Set());
  
  // Worksheet header fields - auto-populated from lesson, user, and class data
  const [worksheetHeader, setWorksheetHeader] = useState({
    date: new Date().toLocaleDateString(),
    teacherName: "",
    periodSection: "",
  });

  const updateWorksheetHeader = (field: string, value: string) => {
    setWorksheetHeader(prev => ({ ...prev, [field]: value }));
  };

  const updateWorksheetField = (field: string, value: string) => {
    if (!generatedAssignment) return;
    setGeneratedAssignment({
      ...generatedAssignment,
      worksheet: {
        ...generatedAssignment.worksheet,
        [field]: value,
      },
    });
  };

  const updateLysMethodology = (field: "be" | "know" | "do", value: string) => {
    if (!generatedAssignment?.worksheet) return;
    setGeneratedAssignment({
      ...generatedAssignment,
      worksheet: {
        ...generatedAssignment.worksheet,
        lysMethodology: {
          ...generatedAssignment.worksheet.lysMethodology,
          [field]: value,
        },
      },
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    if (!generatedAssignment) return;
    const questions = [...(generatedAssignment.questions || [])];
    questions[index] = { ...questions[index], [field]: value };
    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
    setGeneratedAssignment({ ...generatedAssignment, questions, totalPoints });
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, value: string) => {
    if (!generatedAssignment) return;
    const questions = [...(generatedAssignment.questions || [])];
    const options = [...(questions[qIndex].options || [])];
    options[optIndex] = value;
    questions[qIndex] = { ...questions[qIndex], options };
    setGeneratedAssignment({ ...generatedAssignment, questions });
  };

  const deleteQuestion = (index: number) => {
    if (!generatedAssignment) return;
    const questions = (generatedAssignment.questions || []).filter((_: any, i: number) => i !== index);
    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
    setGeneratedAssignment({ ...generatedAssignment, questions, totalPoints });
  };

  const toggleAccommodation = (key: string) => {
    if (!generatedAssignment?.accommodationChecklist) return;
    setGeneratedAssignment({
      ...generatedAssignment,
      accommodationChecklist: {
        ...generatedAssignment.accommodationChecklist,
        [key]: !generatedAssignment.accommodationChecklist[key],
      },
    });
  };

  const toggleQuestionDetails = (index: number) => {
    setExpandedQuestionDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getQuestionTypeCounts = () => {
    if (!generatedAssignment?.questions) return {};
    return (generatedAssignment.questions as any[]).reduce((acc: any, q: any) => {
      const type = q.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  };

  const getBkdCounts = () => {
    if (!generatedAssignment?.questions) return { be: 0, know: 0, do: 0 };
    return (generatedAssignment.questions as any[]).reduce((acc: any, q: any) => {
      const focus = q.bkdFocus || "know";
      acc[focus] = (acc[focus] || 0) + 1;
      return acc;
    }, { be: 0, know: 0, do: 0 });
  };

  const updateInstructions = (value: string) => {
    if (!generatedAssignment) return;
    setGeneratedAssignment({ ...generatedAssignment, instructions: value });
  };

  const updateTitle = (value: string) => {
    if (!generatedAssignment) return;
    setGeneratedAssignment({ ...generatedAssignment, title: value });
  };

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    enabled: isAuthenticated,
  });

  // When the source lesson changes, seed the AI Generate tab's standards from
  // that lesson's saved alignment so generated assignments inherit the lesson's
  // codes by default (teachers can still adjust before saving).
  useEffect(() => {
    if (!selectedLesson) {
      setAiStdCodes([]);
      setAiStdCountry("");
      setAiStdState("");
      setAiStdSubject("");
      return;
    }
    setAiStdCodes(parseLessonStandardCodes(selectedLesson.standards));
    setAiStdCountry(parseLessonStandardCountry(selectedLesson.standards));
    setAiStdState("");
    setAiStdSubject("");
  }, [selectedLesson?.id]);

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    enabled: isAuthenticated && !isStudent && !isParent,
  });

  const { data: myAssignedWork, isLoading: myAssignedLoading } = useQuery<{ assignment: Assignment; recipient: any }[]>({
    queryKey: ["/api/my-assignments"],
    enabled: isAuthenticated && (isStudent || isParent),
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    enabled: isAuthenticated,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const { data: studentGroups } = useQuery<StudentGroup[]>({
    queryKey: ["/api/student-groups"],
    enabled: isAuthenticated,
  });

  const { data: suggestions } = useQuery<AccommodationSuggestion[]>({
    queryKey: ["/api/accommodations/suggestions", selectedAccommodations],
    enabled: selectedAccommodations.length > 0,
    queryFn: async () => {
      const res = await fetch("/api/accommodations/suggestions", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: Failed to fetch suggestions`);
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/assignments/generate", data);
      return await res.json();
    },
    onSuccess: (response: any) => {
      // Auto-populate title with lesson name
      const updatedData = {
        ...response,
        title: selectedLesson?.title || response.title,
      };
      setGeneratedAssignment(updatedData);
      
      // Auto-populate worksheet header from user profile and selected class
      const selectedClass = selectedClassId && selectedClassId !== "__none__" ? classes?.find(c => c.id === selectedClassId) : undefined;
      setWorksheetHeader({
        date: new Date().toLocaleDateString(),
        teacherName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "",
        periodSection: selectedClass?.period || "",
      });
      
      toast({ title: "Assignment Generated", description: "Review and save your assignment below." });
    },
    onError: (error: any) => {
      if (error.requiredTier) {
        toast({ 
          title: "Upgrade Required", 
          description: "Assignment generation is a Pro feature. Upgrade to access.",
          variant: "destructive"
        });
      } else {
        toast({ title: "Error", description: "Failed to generate assignment", variant: "destructive" });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Assignment Saved", description: "Your assignment has been saved." });
      setGeneratedAssignment(null);
      setSelectedLesson(null);
      setAiStdCodes([]);
      setAiStdCountry("");
      setAiStdState("");
      setAiStdSubject("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save assignment", variant: "destructive" });
    },
  });

  const manualSaveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Assignment Created", description: "Your assignment has been saved successfully." });
      setManualTitle("");
      setManualDescription("");
      setManualInstructions("");
      setManualDueDate("");
      setManualClassId("");
      setManualQuestions([]);
      setManualStdCountry("");
      setManualStdState("");
      setManualStdSubject("");
      setManualStdCodes([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    },
  });

  const handleManualSave = () => {
    if (!manualTitle.trim()) {
      toast({ title: "Title Required", description: "Please enter a title for your assignment.", variant: "destructive" });
      return;
    }
    if (manualQuestions.length === 0) {
      toast({ title: "Questions Required", description: "Please add at least one question.", variant: "destructive" });
      return;
    }
    const hasEmptyQuestions = manualQuestions.some(q => !q.question.trim());
    if (hasEmptyQuestions) {
      toast({ title: "Incomplete Questions", description: "Please fill in all question text.", variant: "destructive" });
      return;
    }
    const totalPoints = manualQuestions.reduce((sum, q) => sum + q.points, 0);
    manualSaveMutation.mutate({
      title: manualTitle,
      description: manualDescription || undefined,
      instructions: manualInstructions || undefined,
      questions: manualQuestions.map((q, i) => ({
        id: `q-${i + 1}`,
        ...q,
        options: q.type === "multiple_choice" ? q.options.filter(o => o.trim()) : undefined,
      })),
      totalPoints,
      dueDate: manualDueDate ? new Date(manualDueDate).toISOString() : undefined,
      classId: manualClassId || undefined,
      assignmentType: "individual",
      status: "draft",
      standardsCodes: manualStdCodes.length > 0 ? manualStdCodes : undefined,
    });
  };

  const assignMutation = useMutation({
    mutationFn: (data: { id: string; recipientType: string; recipientIds: string[] }) => 
      apiRequest("POST", `/api/assignments/${data.id}/assign`, { recipientType: data.recipientType, recipientIds: data.recipientIds }),
    onSuccess: () => {
      toast({ title: "Assigned", description: "Assignment has been assigned to selected recipients." });
      setAssignDialogOpen(false);
      setSelectedRecipients([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign", variant: "destructive" });
    },
  });

  const handleGenerate = () => {
    if (!selectedLesson) {
      toast({ title: "Select a Lesson", description: "Please select a lesson to generate an assignment from.", variant: "destructive" });
      return;
    }

    generateMutation.mutate({
      lessonId: selectedLesson.id,
      assignmentType,
      questionCount,
      difficulty,
      includeBeKnowDo,
      accommodationTypes: selectedAccommodations.length > 0 ? selectedAccommodations : undefined,
      accommodationNotes: accommodationNotes || undefined,
      projectTemplate: assignmentType === "project" ? projectTemplate : undefined,
    });
  };

  const handleSave = () => {
    if (!generatedAssignment || !selectedLesson) return;

    saveMutation.mutate({
      lessonId: selectedLesson.id,
      title: generatedAssignment.title,
      description: generatedAssignment.description,
      instructions: generatedAssignment.instructions,
      questions: generatedAssignment.questions,
      totalPoints: generatedAssignment.totalPoints,
      accommodationModified: generatedAssignment.accommodationModified,
      accommodationTypes: generatedAssignment.accommodationTypes,
      accommodationNotes: generatedAssignment.accommodationNotes,
      standardsCodes: aiStdCodes.length > 0 ? aiStdCodes : undefined,
    });
  };

  const handleAssign = (assignmentId: string) => {
    if (selectedRecipients.length === 0) {
      toast({ title: "Select Recipients", description: "Please select at least one recipient.", variant: "destructive" });
      return;
    }
    assignMutation.mutate({ id: assignmentId, recipientType, recipientIds: selectedRecipients });
  };

  const getBkdIcon = (bkdFocus?: string) => {
    switch (bkdFocus) {
      case "be": return <Compass className="h-4 w-4 text-lys-teal" />;
      case "know": return <BookOpen className="h-4 w-4 text-lys-yellow" />;
      case "do": return <Target className="h-4 w-4 text-lys-red" />;
      default: return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access assignment generation.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setLocation("/api/login")} data-testid="button-login">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const filteredAssignments = standardFilter
    ? (assignments ?? []).filter((a) =>
        (((a as any).standardsCodes as { code?: string }[] | null | undefined) ?? []).some(
          (sc) => (sc?.code ?? "").trim().toLowerCase() === standardFilter.toLowerCase(),
        ),
      )
    : (assignments ?? []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-oswald font-semibold tracking-tight text-foreground">
              {isStudent || isParent ? "My Assignments" : "Assignment Generator"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isStudent ? "View and complete your assigned work" : isParent ? "View your student's assignments" : "Create engaging assessments from your lesson plans"}
            </p>
          </div>
          {!isPaidUser && !isStudent && !isParent && (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Pro Feature
            </Badge>
          )}
        </div>

        <Tabs defaultValue={isStudent || isParent || standardFilter ? "saved" : "generate"} className="space-y-6">
          <TabsList>
            {!isStudent && !isParent && (
              <>
                <TabsTrigger value="generate" data-testid="tab-generate">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="create" data-testid="tab-create">
                  <Plus className="h-4 w-4 mr-1" />
                  Create New
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="saved" data-testid="tab-saved">My Assignments</TabsTrigger>
            {!isStudent && !isParent && (
              <TabsTrigger value="class-bkd" data-testid="tab-class-bkd">
                <BarChart3 className="h-4 w-4 mr-1" />
                Class BKD Insights
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {!isPaidUser && (
              <Card className="border-0 overflow-hidden shadow-sm" data-testid="card-upgrade-prompt">
                <div className="bg-gradient-to-br from-lys-red/8 via-background to-lys-yellow/8 p-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-lys-red/10">
                          <Sparkles className="h-4 w-4 text-lys-red" />
                        </div>
                        <Badge className="bg-lys-red/10 text-lys-red border-lys-red/20 text-xs font-roboto">Pro Feature</Badge>
                      </div>
                      <h3 className="font-oswald text-xl mb-1">Unlock AI Assignment Generation</h3>
                      <p className="text-sm text-muted-foreground font-roboto mb-4">
                        Turn any saved lesson into a complete, standards-aligned assessment in under 60 seconds.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { icon: <Sparkles className="h-3.5 w-3.5" />, text: "AI question generation" },
                          { icon: <FileText className="h-3.5 w-3.5" />, text: "5 question types (quiz, project, reflection…)" },
                          { icon: <BarChart3 className="h-3.5 w-3.5" />, text: "Class performance & BKD insights" },
                          { icon: <Users className="h-3.5 w-3.5" />, text: "Assign to classes, groups, or students" },
                        ].map((f) => (
                          <div key={f.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="text-lys-yellow shrink-0">{f.icon}</div>
                            <span>{f.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3 sm:border-l sm:border-border sm:pl-6 w-full sm:w-auto">
                      <div className="text-center">
                        <p className="font-oswald text-3xl font-bold">${PLAN_PRICES.pro}<span className="text-base font-normal text-muted-foreground font-roboto">/mo</span></p>
                        <p className="text-xs text-muted-foreground font-roboto">Pro plan · billed monthly</p>
                      </div>
                      <Button
                        onClick={() => setLocation("/pricing")}
                        className="w-full sm:w-40 bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
                        data-testid="button-upgrade"
                      >
                        <Sparkles className="h-4 w-4" />
                        {canStartTrial ? "Start Free Trial" : "Upgrade to Pro"}
                      </Button>
                      <button
                        onClick={() => setLocation("/pricing")}
                        className="text-xs text-muted-foreground hover:text-foreground underline font-roboto"
                        data-testid="button-view-all-plans"
                      >
                        View all plans
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald">1. Select a Lesson</CardTitle>
                  <CardDescription>
                    AI will generate aligned questions from one of your saved lessons.{" "}
                    <button
                      className="underline underline-offset-2 text-foreground hover:text-lys-teal transition-colors"
                      onClick={() => setLocation("/lesson-generator")}
                      data-testid="link-go-to-lesson-generator"
                    >
                      Build a lesson first
                    </button>{" "}
                    if you don't have one yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lessonsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading lessons...</div>
                  ) : lessons && lessons.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={`p-3 rounded-md border cursor-pointer hover-elevate ${selectedLesson?.id === lesson.id ? "border-lys-red bg-muted" : ""}`}
                            onClick={() => setSelectedLesson(lesson)}
                            data-testid={`lesson-option-${lesson.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{lesson.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{lesson.topic}</p>
                              </div>
                              <Badge variant="outline">{lesson.gradeLevel}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No lessons yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => setLocation("/lesson-generator")}>
                        Create a Lesson
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald">2. Configure Assignment</CardTitle>
                  <CardDescription>Customize the type and difficulty of your assignment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-oswald">Assignment Type</Label>
                    <Select value={assignmentType} onValueChange={setAssignmentType}>
                      <SelectTrigger className="mt-2" data-testid="select-assignment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Template Selection - Only show for project type */}
                  {assignmentType === "project" && (
                    <div className="space-y-3">
                      <Label className="font-oswald flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Project Template (Low-Floor, High-Ceiling)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Low-Floor: Easy entry for all students. High-Ceiling: Advanced challenges for deeper exploration.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PROJECT_TEMPLATES.map((template) => {
                          const IconComponent = template.icon;
                          const isSelected = projectTemplate === template.value;
                          return (
                            <div
                              key={template.value}
                              onClick={() => setProjectTemplate(template.value)}
                              className={`p-4 rounded-md border cursor-pointer transition-all hover-elevate ${
                                isSelected 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid={`project-template-${template.value}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-md ${
                                  template.bkdFocus === "be" ? "bg-yellow-100 text-yellow-700" :
                                  template.bkdFocus === "know" ? "bg-teal-100 text-teal-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{template.label}</span>
                                    <Badge variant="outline" className={`text-xs ${
                                      template.bkdFocus === "be" ? "border-yellow-500 text-yellow-700" :
                                      template.bkdFocus === "know" ? "border-teal-500 text-teal-700" :
                                      "border-red-500 text-red-700"
                                    }`}>
                                      {template.bkdFocus.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {classes && classes.length > 0 && (
                    <div>
                      <Label className="font-oswald">Class (Optional - for Period/Section)</Label>
                      <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="mt-2" data-testid="select-class">
                          <SelectValue placeholder="Select a class (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No class selected</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {c.period ? `- Period ${c.period}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-oswald">Questions</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                        className="mt-2"
                        data-testid="input-question-count"
                      />
                    </div>
                    <div>
                      <Label className="font-oswald">Difficulty</Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="mt-2" data-testid="select-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeBeKnowDo"
                      checked={includeBeKnowDo}
                      onCheckedChange={(checked) => setIncludeBeKnowDo(!!checked)}
                      data-testid="checkbox-bkd"
                    />
                    <Label htmlFor="includeBeKnowDo" className="cursor-pointer">
                      Include Be-Know-Do questions (identity, strategy, action)
                    </Label>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label className="font-oswald">Accommodation Modifications</Label>
                      <Button
                        variant="ghost"
                        onClick={() => setSuggestionsDialogOpen(true)}
                        disabled={selectedAccommodations.length === 0}
                        data-testid="button-suggestions"
                      >
                        <Lightbulb className="h-4 w-4 mr-1" />
                        View Suggestions
                      </Button>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" data-testid="select-accommodation">
                          {selectedAccommodations.length === 0 ? (
                            <span className="text-muted-foreground">No accommodations selected</span>
                          ) : (
                            <span className="truncate">
                              {selectedAccommodations.length} accommodation{selectedAccommodations.length > 1 ? "s" : ""} selected
                            </span>
                          )}
                          <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <ScrollArea className="h-72">
                          <div className="p-2 space-y-1">
                            {(Object.entries(accommodationLabels) as [AccommodationType, string][]).map(([key, label]) => {
                              const isSelected = selectedAccommodations.includes(key);
                              return (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedAccommodations(selectedAccommodations.filter(a => a !== key));
                                    } else {
                                      setSelectedAccommodations([...selectedAccommodations, key]);
                                    }
                                  }}
                                  data-testid={`checkbox-accommodation-${key}`}
                                >
                                  <Checkbox checked={isSelected} />
                                  <span className="text-sm">{label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                        {selectedAccommodations.length > 0 && (
                          <div className="border-t p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => setSelectedAccommodations([])}
                            >
                              Clear all
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    {selectedAccommodations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedAccommodations.map(acc => (
                          <Badge key={acc} variant="secondary" className="text-xs">
                            {accommodationLabels[acc]}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {selectedAccommodations.length > 0 && (
                      <>
                        <Textarea
                          placeholder="Additional accommodation notes (e.g., 'reads at 4th-grade level, prefers visual aids')..."
                          value={accommodationNotes}
                          onChange={(e) => setAccommodationNotes(e.target.value)}
                          className="mt-2"
                          data-testid="textarea-accommodation-notes"
                        />
                        <p
                          className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5 font-roboto"
                          data-testid="text-pii-notice"
                        >
                          <Lock className="h-3 w-3 mt-0.5 flex-shrink-0 text-lys-teal" />
                          <span>
                            <span className="font-medium">FERPA-safe:</span> student names, IDs, emails, phone numbers, addresses, and dates of birth are automatically removed before this is sent to the AI. Describe needs, not identities.
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={!selectedLesson || !isPaidUser || generateMutation.isPending}
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Assignment
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {selectedLesson && (
              <Card data-testid="card-ai-standards">
                <CardHeader>
                  <CardTitle className="font-oswald flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-lys-red" />
                    Aligned Standards
                  </CardTitle>
                  <CardDescription>
                    Inherited from <span className="font-medium text-foreground">{selectedLesson.title}</span>. These codes will be tagged on the generated assignment — adjust them below before saving if needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiStdCodes.length > 0 && (
                    <div data-testid="ai-std-inherited-summary">
                      <p className="text-xs text-muted-foreground mb-1.5 font-roboto">
                        Tagged on this assignment ({aiStdCodes.length}):
                      </p>
                      <AssignmentStandardsBadges
                        codes={aiStdCodes}
                        testIdPrefix="ai-std-inherited"
                        showPopover={false}
                      />
                    </div>
                  )}
                  <StandardsCascadePicker
                    selectedCountry={aiStdCountry}
                    selectedState={aiStdState}
                    selectedSubject={aiStdSubject}
                    selectedStandardCodes={aiStdCodes}
                    onCountryChange={handleAiStdCountry}
                    onStateChange={handleAiStdState}
                    onSubjectChange={handleAiStdSubject}
                    onToggleCode={toggleAiStdCode}
                    testIdPrefix="ai-std"
                  />
                </CardContent>
              </Card>
            )}

            {generatedAssignment && (
              <div className="space-y-4">
                <AiGeneratedLabel className="print:hidden" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap print:hidden">
                  {isEditing ? (
                    <Input 
                      value={generatedAssignment.title} 
                      onChange={(e) => updateTitle(e.target.value)}
                      className="font-oswald text-xl w-full sm:max-w-md"
                      data-testid="input-edit-title"
                    />
                  ) : (
                    <h2 className="font-oswald text-xl">{generatedAssignment.title}</h2>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      data-testid="button-toggle-edit"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {isEditing ? "Done Editing" : "Edit"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const ws = generatedAssignment.worksheet;
                        const acc = generatedAssignment.accommodationChecklist;
                        const text = `${generatedAssignment.title}\n\nStudent Name: _________________ Date: ${worksheetHeader.date}\nTeacher Name: ${worksheetHeader.teacherName || '_________________'} Period/Section: ${worksheetHeader.periodSection || '_________'}\n\nCourse: ${ws?.course || ''}\nUnit: ${ws?.unit || ''}\nContent Objective: ${ws?.contentObjective || ''}\nLesson Objective: ${ws?.lessonObjective || ''}\n\nLYS Methodology:\n- BE: ${ws?.lysMethodology?.be || ''}\n- KNOW: ${ws?.lysMethodology?.know || ''}\n- DO: ${ws?.lysMethodology?.do || ''}\n\nEssential Questions:\n${ws?.essentialQuestions || ''}\n\nINSTRUCTIONS:\n${generatedAssignment.instructions || ''}\n\nQUESTIONS:\n${(generatedAssignment.questions || []).map((q: any, i: number) => `${i + 1}. ${q.question}${q.options ? '\n   ' + q.options.map((o: string, oi: number) => `${String.fromCharCode(65 + oi)}) ${o}`).join('\n   ') : ''}`).join('\n\n')}\n\nLesson Close:\n${ws?.lessonClose || ''}\n\nAccommodations Applied: ${acc ? Object.entries(acc).filter(([k, v]) => v).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()).join(', ') : 'None'}`;
                        navigator.clipboard.writeText(text);
                        toast({ title: "Copied!", description: "Worksheet copied to clipboard." });
                      }}
                      data-testid="button-copy-assignment"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.print()}
                      data-testid="button-print-assignment"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                    <Button variant="outline" onClick={() => setGeneratedAssignment(null)} data-testid="button-discard">
                      Discard
                    </Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-assignment">
                      {saveMutation.isPending ? "Saving..." : "Save Assignment"}
                    </Button>
                  </div>
                </div>

                {/* Standards-source provenance (interactive, screen only).
                    Reflects the live AI-tab picker so the preview matches what
                    will be saved. */}
                {aiStdCodes.length ? (
                  <div className="print:hidden">
                    <AssignmentStandardsBadges
                      codes={aiStdCodes}
                      testIdPrefix="preview"
                    />
                  </div>
                ) : null}

                {/* Progress Summary Bar */}
                <Card className="print:hidden">
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{(generatedAssignment.questions || []).length} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{generatedAssignment.totalPoints} Points</span>
                        </div>
                        <Separator orientation="vertical" className="h-6 hidden sm:block" />
                        <div className="flex items-center gap-3">
                          {(() => {
                            const counts = getBkdCounts();
                            return (
                              <>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3.5 w-3.5 text-lys-red" />
                                  <span className="text-xs">{counts.be} BE</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Lightbulb className="h-3.5 w-3.5 text-lys-yellow" />
                                  <span className="text-xs">{counts.know} KNOW</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="h-3.5 w-3.5 text-lys-teal" />
                                  <span className="text-xs">{counts.do} DO</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      {generatedAssignment.worksheet && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                          className="text-xs"
                          data-testid="button-toggle-sidebar"
                        >
                          {sidebarCollapsed ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Show Lesson Info
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide Lesson Info
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card id="generated-assignment" className="print:shadow-none print:border-2 print:border-black">
                  <CardContent className="p-6 print:p-4">
                    <div className="border-b-2 border-foreground pb-4 mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex gap-2 items-center">
                          <span className="font-semibold">Student Name:</span>
                          <span className="border-b border-foreground flex-1 min-w-[150px]"></span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="font-semibold">Date:</span>
                          {isEditing ? (
                            <Input 
                              value={worksheetHeader.date} 
                              onChange={(e) => updateWorksheetHeader("date", e.target.value)} 
                              className="text-sm flex-1" 
                              data-testid="input-edit-date" 
                            />
                          ) : (
                            <span className="border-b border-foreground flex-1 min-w-[100px]">{worksheetHeader.date}</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="font-semibold">Teacher Name:</span>
                          {isEditing ? (
                            <Input 
                              value={worksheetHeader.teacherName} 
                              onChange={(e) => updateWorksheetHeader("teacherName", e.target.value)} 
                              className="text-sm flex-1" 
                              data-testid="input-edit-teacher-name" 
                            />
                          ) : (
                            <span className="border-b border-foreground flex-1 min-w-[150px]">{worksheetHeader.teacherName}</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="font-semibold">Period/Section:</span>
                          {isEditing ? (
                            <Input 
                              value={worksheetHeader.periodSection} 
                              onChange={(e) => updateWorksheetHeader("periodSection", e.target.value)} 
                              className="text-sm flex-1" 
                              data-testid="input-edit-period" 
                            />
                          ) : (
                            <span className="border-b border-foreground flex-1 min-w-[100px]">{worksheetHeader.periodSection}</span>
                          )}
                        </div>
                      </div>
                      {/* Tagged standards — static, badge-free line for print/export */}
                      {aiStdCodes.length ? (
                        <p
                          className="hidden print:block text-sm mt-3"
                          data-testid="preview-standards-print"
                        >
                          <span className="font-semibold">Standards: </span>
                          {aiStdCodes.map((sc) => sc.code).join(", ")}
                        </p>
                      ) : null}
                    </div>

                    {/* Worksheet Layout with Sidebar */}
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left Sidebar - Lesson Metadata - Always visible in print */}
                      {generatedAssignment.worksheet && (
                        <div className={`md:w-1/3 border-r md:pr-4 space-y-3 print:w-1/3 print:block ${sidebarCollapsed ? "hidden md:hidden print:block" : ""}`}>
                          {/* Course & Unit Card */}
                          <Card className="bg-muted/30">
                            <CardContent className="p-3 space-y-3">
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</Label>
                                {isEditing ? (
                                  <Input value={generatedAssignment.worksheet.course} onChange={(e) => updateWorksheetField("course", e.target.value)} className="text-sm mt-1" data-testid="input-edit-course" />
                                ) : (
                                  <p className="mt-1 font-medium text-sm">{generatedAssignment.worksheet.course}</p>
                                )}
                              </div>
                              <Separator />
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</Label>
                                {isEditing ? (
                                  <Input value={generatedAssignment.worksheet.unit} onChange={(e) => updateWorksheetField("unit", e.target.value)} className="text-sm mt-1" data-testid="input-edit-unit" />
                                ) : (
                                  <p className="mt-1 font-medium text-sm">{generatedAssignment.worksheet.unit}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Objectives Card */}
                          <Card className="bg-muted/30">
                            <CardContent className="p-3 space-y-3">
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content Objective (TEKS)</Label>
                                {isEditing ? (
                                  <Textarea value={generatedAssignment.worksheet.contentObjective} onChange={(e) => updateWorksheetField("contentObjective", e.target.value)} className="text-sm min-h-[50px] mt-1" data-testid="input-edit-content-objective" />
                                ) : (
                                  <p className="mt-1 text-sm">{generatedAssignment.worksheet.contentObjective}</p>
                                )}
                              </div>
                              <Separator />
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lesson Objective</Label>
                                {isEditing ? (
                                  <Textarea value={generatedAssignment.worksheet.lessonObjective} onChange={(e) => updateWorksheetField("lessonObjective", e.target.value)} className="text-sm min-h-[50px] mt-1" data-testid="input-edit-lesson-objective" />
                                ) : (
                                  <p className="mt-1 text-sm">{generatedAssignment.worksheet.lessonObjective}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* LYS Methodology Card - Brand Colors */}
                          <Card className="border-2 border-primary/20 overflow-hidden">
                            <CardHeader className="py-2 px-3 bg-primary/10">
                              <CardTitle className="text-sm font-oswald flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                LYS Methodology
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              {isEditing ? (
                                <div className="p-3 space-y-2">
                                  <div>
                                    <Label className="text-xs font-semibold text-lys-red">BE:</Label>
                                    <Input value={generatedAssignment.worksheet.lysMethodology?.be || ""} onChange={(e) => updateLysMethodology("be", e.target.value)} className="text-sm mt-1" data-testid="input-edit-be" />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold text-lys-yellow">KNOW:</Label>
                                    <Input value={generatedAssignment.worksheet.lysMethodology?.know || ""} onChange={(e) => updateLysMethodology("know", e.target.value)} className="text-sm mt-1" data-testid="input-edit-know" />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold text-lys-teal">DO:</Label>
                                    <Input value={generatedAssignment.worksheet.lysMethodology?.do || ""} onChange={(e) => updateLysMethodology("do", e.target.value)} className="text-sm mt-1" data-testid="input-edit-do" />
                                  </div>
                                </div>
                              ) : (
                                <div className="divide-y">
                                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-lys-red">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Heart className="h-3.5 w-3.5 text-lys-red" />
                                      <span className="text-xs font-bold text-lys-red uppercase tracking-wide">BE</span>
                                    </div>
                                    <p className="text-sm text-foreground">{generatedAssignment.worksheet.lysMethodology?.be}</p>
                                  </div>
                                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-lys-yellow">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Lightbulb className="h-3.5 w-3.5 text-lys-yellow" />
                                      <span className="text-xs font-bold text-lys-yellow uppercase tracking-wide">KNOW</span>
                                    </div>
                                    <p className="text-sm text-foreground">{generatedAssignment.worksheet.lysMethodology?.know}</p>
                                  </div>
                                  <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border-l-4 border-lys-teal">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Target className="h-3.5 w-3.5 text-lys-teal" />
                                      <span className="text-xs font-bold text-lys-teal uppercase tracking-wide">DO</span>
                                    </div>
                                    <p className="text-sm text-foreground">{generatedAssignment.worksheet.lysMethodology?.do}</p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          
                          {/* Essential Questions & Lesson Close */}
                          <Card className="bg-muted/30">
                            <CardContent className="p-3 space-y-3">
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Essential Questions</Label>
                                {isEditing ? (
                                  <Textarea value={generatedAssignment.worksheet.essentialQuestions} onChange={(e) => updateWorksheetField("essentialQuestions", e.target.value)} className="mt-1 text-sm min-h-[50px]" data-testid="input-edit-essential-questions" />
                                ) : (
                                  <p className="mt-1 text-sm italic">{generatedAssignment.worksheet.essentialQuestions}</p>
                                )}
                              </div>
                              <Separator />
                              <div>
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lesson Close</Label>
                                {isEditing ? (
                                  <Textarea value={generatedAssignment.worksheet.lessonClose} onChange={(e) => updateWorksheetField("lessonClose", e.target.value)} className="mt-1 text-sm min-h-[50px]" data-testid="input-edit-lesson-close" />
                                ) : (
                                  <p className="mt-1 text-sm">{generatedAssignment.worksheet.lessonClose}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Right Main Content - Questions */}
                      <div className={`${generatedAssignment.worksheet && !sidebarCollapsed ? "md:w-2/3" : generatedAssignment.worksheet ? "w-full md:w-full print:w-2/3" : "w-full"} print:w-2/3`}>
                        {/* Instructions Card */}
                        <Card className="mb-4 bg-primary/5 border-primary/20">
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <Label className="text-xs font-semibold uppercase tracking-wide">Assignment Instructions</Label>
                            </div>
                            {isEditing ? (
                              <Textarea value={generatedAssignment.instructions} onChange={(e) => updateInstructions(e.target.value)} className="min-h-[60px]" data-testid="input-edit-instructions" />
                            ) : (
                              <p className="text-sm">{generatedAssignment.instructions || "Complete all questions below. Show your work where applicable."}</p>
                            )}
                          </CardContent>
                        </Card>

                        <div className="space-y-3">
                          {(generatedAssignment.questions || []).map((q: any, i: number) => {
                            const isDetailsExpanded = expandedQuestionDetails.has(i);
                            const bkdColor = q.bkdFocus === "be" ? "border-l-lys-red" : q.bkdFocus === "do" ? "border-l-lys-teal" : "border-l-lys-yellow";
                            
                            return (
                              <Card key={q.id || i} className={`border-l-4 ${bkdColor} print:break-inside-avoid`}>
                                <CardContent className="py-3 px-4">
                                  <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="font-oswald text-lg text-primary font-bold">{i + 1}</span>
                                      <Badge variant="secondary" className="text-xs">{q.points}pt</Badge>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {/* Compact header with essential info */}
                                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap print:hidden">
                                        <div className="flex items-center gap-2">
                                          {getBkdIcon(q.bkdFocus)}
                                          <Badge variant="outline" className="capitalize">{(q.type || "").replace("_", " ")}</Badge>
                                          {/* Collapsible details toggle */}
                                          {(q.bloomsLevel || q.depthOfKnowledge) && (
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={() => toggleQuestionDetails(i)}
                                              aria-expanded={isDetailsExpanded}
                                              data-testid={`button-toggle-details-${i}`}
                                            >
                                              {isDetailsExpanded ? (
                                                <><ChevronDown className="h-3 w-3 mr-1" /> Less</>
                                              ) : (
                                                <><ChevronRight className="h-3 w-3 mr-1" /> More</>
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {isEditing && (
                                            <>
                                              <Input 
                                                type="number" 
                                                value={q.points} 
                                                onChange={(e) => updateQuestion(i, "points", parseInt(e.target.value) || 0)} 
                                                className="w-16 h-7 text-xs"
                                                data-testid={`input-edit-points-${i}`}
                                              />
                                              <Button variant="ghost" size="icon" onClick={() => deleteQuestion(i)} className="h-7 w-7" data-testid={`button-delete-question-${i}`}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Expanded details */}
                                      {isDetailsExpanded && (
                                        <div className="flex gap-2 mb-2 print:hidden">
                                          {q.bloomsLevel && (
                                            <Badge variant="secondary" className="text-xs capitalize">Bloom's: {q.bloomsLevel}</Badge>
                                          )}
                                          {q.depthOfKnowledge && (
                                            <Badge variant="secondary" className="text-xs">DOK Level {q.depthOfKnowledge}</Badge>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Stimulus */}
                                      {q.stimulus && (
                                        <div className="mb-2 p-2 bg-muted/50 rounded-md text-sm italic border-l-2 border-muted-foreground/20 print:bg-gray-50">
                                          {isEditing ? (
                                            <Textarea 
                                              value={q.stimulus} 
                                              onChange={(e) => updateQuestion(i, "stimulus", e.target.value)} 
                                              className="min-h-[40px] text-sm italic"
                                              placeholder="Context or scenario..."
                                              data-testid={`input-edit-stimulus-${i}`}
                                            />
                                          ) : (
                                            q.stimulus
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Question */}
                                      {isEditing ? (
                                        <Textarea value={q.question} onChange={(e) => updateQuestion(i, "question", e.target.value)} className="font-medium min-h-[60px]" data-testid={`input-edit-question-${i}`} />
                                      ) : (
                                        <p className="font-medium text-sm">{q.question}</p>
                                      )}
                                      
                                      {/* Multiple choice options */}
                                      {q.options && (
                                        <ul className="mt-3 space-y-2">
                                          {q.options.map((opt: string, oi: number) => {
                                            const isCorrect = q.rubric?.correctAnswer === opt;
                                            const distractor = q.rubric?.distractors?.find((d: any) => d.option === opt);
                                            return (
                                              <li key={oi} className="text-sm">
                                                <div className={`flex items-center gap-2 p-2 rounded-md ${isCorrect && !isEditing ? "bg-green-50 dark:bg-green-950/30" : "bg-muted/30"}`}>
                                                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${isCorrect ? "border-green-500 bg-green-500 text-white print:border-foreground print:bg-transparent print:text-foreground" : "border-muted-foreground/30"}`}>
                                                    {String.fromCharCode(65 + oi)}
                                                  </span>
                                                  {isEditing ? (
                                                    <Input value={opt} onChange={(e) => updateQuestionOption(i, oi, e.target.value)} className="flex-1 h-7 text-sm" data-testid={`input-edit-option-${i}-${oi}`} />
                                                  ) : (
                                                    <span className="flex-1">{opt}</span>
                                                  )}
                                                  {isCorrect && !isEditing && (
                                                    <CheckCircle className="h-4 w-4 text-green-600 print:hidden" />
                                                  )}
                                                </div>
                                                {distractor?.feedback && !isEditing && isDetailsExpanded && (
                                                  <p className="ml-8 mt-1 text-xs text-muted-foreground italic print:hidden">
                                                    {distractor.feedback}
                                                  </p>
                                                )}
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                      
                                      {/* Rubric for open-ended questions - collapsible */}
                                      {q.rubric?.partialCreditRules && q.rubric.partialCreditRules.length > 0 && !isEditing && isDetailsExpanded && (
                                        <Card className="mt-3 bg-muted/30 print:hidden">
                                          <CardContent className="p-3">
                                            <p className="font-semibold text-xs mb-2 uppercase tracking-wide">Grading Rubric</p>
                                            <div className="space-y-1">
                                              {q.rubric.partialCreditRules.map((rule: any, ri: number) => (
                                                <div key={ri} className="flex justify-between text-xs">
                                                  <span>{rule.condition}</span>
                                                  <Badge variant="secondary" className="text-xs">{rule.points} pts</Badge>
                                                </div>
                                              ))}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      )}
                                      
                                      {/* Answer space for open-ended */}
                                      {!q.options && q.type !== "multiple_choice" && q.type !== "true_false" && (
                                        <div className="mt-3 border-2 border-dashed border-muted-foreground/20 rounded-md min-h-[60px] print:min-h-[100px] flex items-center justify-center">
                                          <span className="text-xs text-muted-foreground print:hidden">Answer space</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Project Phases Display - Low Floor High Ceiling */}
                        {generatedAssignment.project && (
                          <>
                            <Separator className="my-6" />
                            <div className="print:break-inside-avoid">
                              <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                {generatedAssignment.project.templateName} - Project Phases
                              </h3>
                              
                              {/* Low Floor / High Ceiling Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Play className="w-4 h-4 text-green-600" />
                                    <span className="font-oswald text-sm text-green-700 dark:text-green-400">Low Floor (Entry Point)</span>
                                  </div>
                                  <p className="text-sm text-green-800 dark:text-green-300">{generatedAssignment.project.lowFloor}</p>
                                </div>
                                <div className="p-4 rounded-md bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-teal-600" />
                                    <span className="font-oswald text-sm text-teal-700 dark:text-teal-400">High Ceiling (Advanced)</span>
                                  </div>
                                  <p className="text-sm text-teal-800 dark:text-teal-300">{generatedAssignment.project.highCeiling}</p>
                                </div>
                              </div>

                              {/* Phase Timeline */}
                              <div className="space-y-4">
                                {(generatedAssignment.project.phases || []).map((phase: any, i: number) => (
                                  <div key={i} className="relative pl-8 pb-4 border-l-2 border-muted last:border-l-0">
                                    <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                      {i + 1}
                                    </div>
                                    <div className="p-4 rounded-md border bg-card">
                                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                                        <h4 className="font-oswald text-base">{phase.name}</h4>
                                        <Badge variant="outline" className="text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {phase.estimatedTime}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {/* Async (Independent) Task */}
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <RefreshCw className="w-3 h-3" />
                                            <span className="font-semibold text-xs uppercase">Async (Independent)</span>
                                          </div>
                                          <p className="text-foreground">{phase.asyncTask}</p>
                                        </div>
                                        
                                        {/* Sync (Classroom) Task */}
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <Users className="w-3 h-3" />
                                            <span className="font-semibold text-xs uppercase">Sync (Classroom)</span>
                                          </div>
                                          <p className="text-foreground">{phase.syncTask}</p>
                                        </div>
                                      </div>
                                      
                                      {/* Phase Deliverable */}
                                      <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                        <span className="text-muted-foreground">Deliverable:</span>
                                        <span className="font-medium">{phase.deliverable}</span>
                                      </div>
                                      
                                      {/* Phase Materials */}
                                      {phase.materials && phase.materials.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {phase.materials.map((mat: string, mi: number) => (
                                            <Badge key={mi} variant="secondary" className="text-xs">{mat}</Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Materials List */}
                              {generatedAssignment.project.materials && generatedAssignment.project.materials.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="font-oswald text-sm mb-2">Materials Needed</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {generatedAssignment.project.materials.map((mat: string, i: number) => (
                                      <Badge key={i} variant="outline">{mat}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Project Rubric */}
                              {generatedAssignment.project.rubric && generatedAssignment.project.rubric.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="font-oswald text-sm mb-2">Project Rubric</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-muted">
                                          <th className="border p-2 text-left">Criteria</th>
                                          <th className="border p-2 text-center">Exemplary</th>
                                          <th className="border p-2 text-center">Proficient</th>
                                          <th className="border p-2 text-center">Developing</th>
                                          <th className="border p-2 text-center">Beginning</th>
                                          <th className="border p-2 text-center w-16">Points</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {generatedAssignment.project.rubric.map((row: any, ri: number) => (
                                          <tr key={ri}>
                                            <td className="border p-2 font-medium">{row.criteria}</td>
                                            <td className="border p-2 text-center">{row.exemplary}</td>
                                            <td className="border p-2 text-center">{row.proficient}</td>
                                            <td className="border p-2 text-center">{row.developing}</td>
                                            <td className="border p-2 text-center">{row.beginning}</td>
                                            <td className="border p-2 text-center font-bold">{row.points}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Extensions */}
                              {generatedAssignment.project.extensions && generatedAssignment.project.extensions.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="font-oswald text-sm mb-2 flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    Extension Activities (High Ceiling)
                                  </h4>
                                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                    {generatedAssignment.project.extensions.map((ext: string, i: number) => (
                                      <li key={i}>{ext}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Enhanced Reflection Prompts - Socratic, Hebraic, Be-Know-Do */}
                              {generatedAssignment.project.reflectionPrompts && generatedAssignment.project.reflectionPrompts.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="font-oswald text-sm mb-3 flex items-center gap-1">
                                    <Lightbulb className="w-4 h-4 text-primary" />
                                    Reflection Prompts
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-4">
                                    These prompts incorporate Socratic questioning, Hebraic learning traditions, and the Be-Know-Do framework to deepen understanding.
                                  </p>
                                  
                                  {/* Group by style */}
                                  {["socratic", "hebraic", "bkd"].map((styleType) => {
                                    const stylePrompts = generatedAssignment.project.reflectionPrompts.filter((p: any) => p.style === styleType);
                                    if (stylePrompts.length === 0) return null;
                                    
                                    const styleConfig = {
                                      socratic: {
                                        title: "Socratic Method",
                                        description: "Questioning to illuminate understanding and examine assumptions",
                                        color: "blue",
                                        IconComponent: HelpCircle
                                      },
                                      hebraic: {
                                        title: "Hebraic Learning",
                                        description: "Discussion, narrative, and life application through partnership",
                                        color: "amber",
                                        IconComponent: ScrollText
                                      },
                                      bkd: {
                                        title: "Be-Know-Do Framework",
                                        description: "Identity, knowledge, and action integration",
                                        color: "primary",
                                        IconComponent: Target
                                      }
                                    }[styleType];
                                    
                                    const StyleIcon = styleConfig?.IconComponent || HelpCircle;
                                    
                                    return (
                                      <div key={styleType} className="mb-5">
                                        <div className={`flex items-center gap-2 mb-2 pb-1 border-b ${
                                          styleType === "socratic" ? "border-teal-200" :
                                          styleType === "hebraic" ? "border-amber-200" :
                                          "border-primary/20"
                                        }`}>
                                          <StyleIcon className={`w-5 h-5 ${
                                            styleType === "socratic" ? "text-teal-600" :
                                            styleType === "hebraic" ? "text-amber-600" :
                                            "text-primary"
                                          }`} />
                                          <div>
                                            <span className={`font-oswald text-sm ${
                                              styleType === "socratic" ? "text-teal-700 dark:text-teal-400" :
                                              styleType === "hebraic" ? "text-amber-700 dark:text-amber-400" :
                                              "text-primary"
                                            }`}>
                                              {styleConfig?.title}
                                            </span>
                                            <p className="text-xs text-muted-foreground">{styleConfig?.description}</p>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-3 ml-6">
                                          {stylePrompts.map((rp: any, ri: number) => (
                                            <div key={ri} className={`p-3 rounded-md border ${
                                              styleType === "socratic" ? "bg-teal-50/50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900" :
                                              styleType === "hebraic" ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900" :
                                              "bg-primary/5 border-primary/10"
                                            }`}>
                                              <div className="flex items-start gap-2">
                                                <Badge variant="outline" className={`text-xs flex-shrink-0 ${
                                                  styleType === "socratic" ? "border-teal-300 text-teal-700 dark:text-teal-400" :
                                                  styleType === "hebraic" ? "border-amber-300 text-amber-700 dark:text-amber-400" :
                                                  "border-primary/50"
                                                }`}>
                                                  {rp.category}
                                                </Badge>
                                              </div>
                                              <p className="text-sm font-medium mt-2 text-foreground">{rp.prompt}</p>
                                              {rp.followUp && (
                                                <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                                                  <ArrowRight className="w-3 h-3" />
                                                  Follow-up: {rp.followUp}
                                                </p>
                                              )}
                                              {rp.connectionToObjective && (
                                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed flex items-center gap-1">
                                                  <Target className="w-3 h-3" />
                                                  Connected to: {rp.connectionToObjective}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Accommodations section removed - now handled via dropdown selection */}

                        <div className="mt-6 text-center text-xs text-muted-foreground print:mt-8">
                          <Badge variant="outline" className="print:hidden">{generatedAssignment.totalPoints} Total Points</Badge>
                          <p className="hidden print:block">Total Points: {generatedAssignment.totalPoints}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <Pencil className="h-5 w-5" />
                  Create New Assignment
                </CardTitle>
                <CardDescription>Build your own assignment from scratch with custom questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-title">Assignment Title *</Label>
                    <Input
                      id="manual-title"
                      placeholder="Enter assignment title"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      data-testid="input-manual-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-class">Class (optional)</Label>
                    <Select value={manualClassId} onValueChange={setManualClassId}>
                      <SelectTrigger data-testid="select-manual-class">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-description">Description</Label>
                  <Textarea
                    id="manual-description"
                    placeholder="Brief description of this assignment"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="resize-none"
                    data-testid="input-manual-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-instructions">Instructions</Label>
                  <Textarea
                    id="manual-instructions"
                    placeholder="Detailed instructions for students"
                    value={manualInstructions}
                    onChange={(e) => setManualInstructions(e.target.value)}
                    className="resize-none"
                    data-testid="input-manual-instructions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-due-date">Due Date (optional)</Label>
                  <Input
                    id="manual-due-date"
                    type="date"
                    value={manualDueDate}
                    onChange={(e) => setManualDueDate(e.target.value)}
                    data-testid="input-manual-due-date"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-lys-red" />
                    <Label className="font-oswald text-base">Aligned Standards (optional)</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tag this assignment with the standard codes it covers so they can be surfaced on the assignment detail.
                  </p>
                  <StandardsCascadePicker
                    selectedCountry={manualStdCountry}
                    selectedState={manualStdState}
                    selectedSubject={manualStdSubject}
                    selectedStandardCodes={manualStdCodes}
                    onCountryChange={handleManualStdCountry}
                    onStateChange={handleManualStdState}
                    onSubjectChange={handleManualStdSubject}
                    onToggleCode={toggleManualStdCode}
                    testIdPrefix="manual-std"
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                    <div>
                      <h3 className="font-oswald text-lg font-semibold">Questions</h3>
                      <p className="text-sm text-muted-foreground">Add questions to your assignment</p>
                    </div>
                    <Button onClick={addManualQuestion} variant="outline" data-testid="button-add-question">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  {manualQuestions.length === 0 ? (
                    <div className="text-center py-12 border rounded-md border-dashed">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground font-roboto">No questions yet</p>
                      <p className="text-sm text-muted-foreground font-roboto mt-1">Click "Add Question" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {manualQuestions.map((q, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <CardTitle className="font-oswald text-base">Question {index + 1}</CardTitle>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeManualQuestion(index)}
                                data-testid={`button-remove-question-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={q.type}
                                  onValueChange={(v) => updateManualQuestion(index, "type", v)}
                                >
                                  <SelectTrigger data-testid={`select-question-type-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="short_answer">Short Answer</SelectItem>
                                    <SelectItem value="essay">Essay</SelectItem>
                                    <SelectItem value="true_false">True/False</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Be-Know-Do Focus</Label>
                                <Select
                                  value={q.bkdFocus}
                                  onValueChange={(v) => updateManualQuestion(index, "bkdFocus", v)}
                                >
                                  <SelectTrigger data-testid={`select-question-bkd-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="be">BE (Identity)</SelectItem>
                                    <SelectItem value="know">KNOW (Knowledge)</SelectItem>
                                    <SelectItem value="do">DO (Action)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Points</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={q.points}
                                  onChange={(e) => updateManualQuestion(index, "points", parseInt(e.target.value) || 1)}
                                  data-testid={`input-question-points-${index}`}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Question Text *</Label>
                              <Textarea
                                placeholder="Enter your question"
                                value={q.question}
                                onChange={(e) => updateManualQuestion(index, "question", e.target.value)}
                                className="resize-none"
                                data-testid={`input-question-text-${index}`}
                              />
                            </div>

                            {q.type === "multiple_choice" && (
                              <div className="space-y-2">
                                <Label className="text-xs">Answer Options</Label>
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <Badge variant="outline" className="shrink-0">{String.fromCharCode(65 + optIdx)}</Badge>
                                    <Input
                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                      value={opt}
                                      onChange={(e) => updateManualQuestionOption(index, optIdx, e.target.value)}
                                      data-testid={`input-option-${index}-${optIdx}`}
                                    />
                                  </div>
                                ))}
                                <div className="space-y-1 mt-2">
                                  <Label className="text-xs">Correct Answer</Label>
                                  <Select
                                    value={q.correctAnswer}
                                    onValueChange={(v) => updateManualQuestion(index, "correctAnswer", v)}
                                  >
                                    <SelectTrigger data-testid={`select-correct-answer-${index}`}>
                                      <SelectValue placeholder="Select correct answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {q.options.filter(o => o.trim()).map((opt, i) => (
                                        <SelectItem key={i} value={opt}>{String.fromCharCode(65 + i)}: {opt}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {q.type === "true_false" && (
                              <div className="space-y-1">
                                <Label className="text-xs">Correct Answer</Label>
                                <Select
                                  value={q.correctAnswer}
                                  onValueChange={(v) => updateManualQuestion(index, "correctAnswer", v)}
                                >
                                  <SelectTrigger data-testid={`select-tf-answer-${index}`}>
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="True">True</SelectItem>
                                    <SelectItem value="False">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {(q.type === "short_answer" || q.type === "essay") && (
                              <div className="space-y-1">
                                <Label className="text-xs">Sample Answer (optional)</Label>
                                <Input
                                  placeholder="Expected answer or key points"
                                  value={q.correctAnswer}
                                  onChange={(e) => updateManualQuestion(index, "correctAnswer", e.target.value)}
                                  data-testid={`input-sample-answer-${index}`}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {manualQuestions.length > 0 && (
                  <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {manualQuestions.length} question{manualQuestions.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline">
                        {manualQuestions.reduce((sum, q) => sum + q.points, 0)} total points
                      </Badge>
                    </div>
                    <Button
                      onClick={handleManualSave}
                      disabled={manualSaveMutation.isPending}
                      data-testid="button-save-manual-assignment"
                    >
                      {manualSaveMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Save Assignment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="flex items-center gap-4 py-4">
                <Sparkles className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <h3 className="font-oswald text-base">Want AI to create questions for you?</h3>
                  <p className="text-sm text-muted-foreground">
                    Switch to the "AI Generate" tab to automatically create aligned questions from your lesson plans.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            {(isStudent || isParent) ? (
              /* ── Student / Parent view: show assignments received from educators ── */
              myAssignedLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading your assignments...</div>
              ) : myAssignedWork && myAssignedWork.length > 0 ? (
                <div className="space-y-4">
                  {/* Pending / In-Progress first */}
                  {myAssignedWork.filter(({ recipient }) => recipient.status === "assigned" || recipient.status === "in_progress").length > 0 && (
                    <div>
                      <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Due Soon
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myAssignedWork
                          .filter(({ recipient }) => recipient.status === "assigned" || recipient.status === "in_progress")
                          .map(({ assignment, recipient }) => {
                            const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                            return (
                              <Card key={recipient.id} data-testid={`card-assigned-${assignment.id}`} className="border-l-4 border-l-amber-400">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="font-oswald text-lg">{assignment.title}</CardTitle>
                                    <Badge variant={isOverdue ? "destructive" : "secondary"}>
                                      {isOverdue ? "Overdue" : recipient.status === "in_progress" ? "In Progress" : "New"}
                                    </Badge>
                                  </div>
                                  <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-4 w-4" />
                                      {(assignment.questions as any[])?.length || 0} questions
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Star className="h-4 w-4" />
                                      {assignment.totalPoints} pts
                                    </span>
                                    {assignment.dueDate && (
                                      <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                                        <Clock className="h-4 w-4" />
                                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  {assignment.assignmentType && (
                                    <Badge variant="outline" className="mt-2 capitalize">{assignment.assignmentType}</Badge>
                                  )}
                                  <div className="mt-2">
                                    <AssignmentStandardsBadges
                                      codes={(assignment as any).standardsCodes as CatalogCodeClient[] | null | undefined}
                                      testIdPrefix={`assigned-${assignment.id}`}
                                      showPopover={false}
                                    />
                                  </div>
                                </CardContent>
                                <CardFooter>
                                  <Button size="sm" className="w-full" data-testid={`button-start-${assignment.id}`}>
                                    <Play className="h-4 w-4 mr-1" />
                                    {recipient.status === "in_progress" ? "Continue" : "Start Assignment"}
                                  </Button>
                                </CardFooter>
                              </Card>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Submitted / Graded */}
                  {myAssignedWork.filter(({ recipient }) => recipient.status === "submitted" || recipient.status === "graded").length > 0 && (
                    <div>
                      <h3 className="font-oswald text-lg mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Completed
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myAssignedWork
                          .filter(({ recipient }) => recipient.status === "submitted" || recipient.status === "graded")
                          .map(({ assignment, recipient }) => (
                            <Card key={recipient.id} data-testid={`card-completed-${assignment.id}`} className="border-l-4 border-l-green-400 opacity-90">
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="font-oswald text-lg">{assignment.title}</CardTitle>
                                  <Badge variant="outline" className="text-green-600 border-green-400">
                                    {recipient.status === "graded" ? "Graded" : "Submitted"}
                                  </Badge>
                                </div>
                                <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  {recipient.score !== null && recipient.score !== undefined ? (
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                      <Star className="h-4 w-4 text-amber-500" />
                                      {recipient.score} / {assignment.totalPoints} pts
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Star className="h-4 w-4" />
                                      {assignment.totalPoints} pts
                                    </span>
                                  )}
                                  {recipient.submittedAt && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      Submitted {new Date(recipient.submittedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {recipient.feedback && (
                                  <p className="mt-2 text-sm border-l-2 border-muted pl-2 text-muted-foreground italic line-clamp-2">
                                    {recipient.feedback}
                                  </p>
                                )}
                                <div className="mt-2">
                                  <AssignmentStandardsBadges
                                    codes={(assignment as any).standardsCodes as CatalogCodeClient[] | null | undefined}
                                    testIdPrefix={`completed-${assignment.id}`}
                                    showPopover={false}
                                  />
                                </div>
                              </CardContent>
                              <CardFooter>
                                <Button size="sm" variant="outline" className="w-full" data-testid={`button-review-${assignment.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-oswald text-lg mb-2">No Assignments Yet</h3>
                    <p className="text-muted-foreground">Your teacher hasn't assigned anything yet. Check back soon!</p>
                  </CardContent>
                </Card>
              )
            ) : (
              /* ── Educator view: show their created/saved assignments ── */
              assignmentsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading assignments...</div>
              ) : assignments && assignments.length > 0 ? (
                <div className="space-y-4">
                  {standardFilter && (
                    <div
                      className="flex items-center justify-between gap-3 rounded-md border border-lys-teal/30 bg-lys-teal/5 px-3 py-2"
                      data-testid="banner-standard-filter"
                    >
                      <p className="text-sm">
                        Showing assignments aligned to{" "}
                        <span className="font-semibold text-lys-teal" data-testid="text-filter-standard">
                          {standardFilter}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          ({filteredAssignments.length} {filteredAssignments.length === 1 ? "assignment" : "assignments"})
                        </span>
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation("/assignments")}
                        data-testid="button-clear-standard-filter"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear filter
                      </Button>
                    </div>
                  )}
                  {filteredAssignments.length === 0 ? (
                    <Card className="text-center py-12" data-testid="card-no-filtered-assignments">
                      <CardContent>
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-oswald text-lg mb-2">No Assignments Match This Standard</h3>
                        <p className="text-muted-foreground mb-4">
                          None of your assignments are aligned to {standardFilter} yet.
                        </p>
                        <Button variant="outline" onClick={() => setLocation("/assignments")} data-testid="button-clear-filter-empty">
                          <X className="h-4 w-4 mr-2" />
                          Clear filter
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssignments.map((assignment) => (
                    <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-oswald text-lg">{assignment.title}</CardTitle>
                          {assignment.accommodationModified && (assignment as any).accommodationTypes && (assignment as any).accommodationTypes.length > 0 && (
                            <Badge variant="outline">{(assignment as any).accommodationTypes.length} accommodation{(assignment as any).accommodationTypes.length > 1 ? "s" : ""}</Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {(assignment.questions as any[])?.length || 0} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {assignment.totalPoints} pts
                          </span>
                        </div>
                        <div className="pt-1">
                          <AssignmentStandardsBadges
                            codes={(assignment as any).standardsCodes as CatalogCodeClient[] | null | undefined}
                            testIdPrefix={assignment.id}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" data-testid={`button-assign-${assignment.id}`}>
                              <Users className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign to Students</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <RadioGroup value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="student" id="student" />
                                    <Label htmlFor="student">Individual Students</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="group" id="group" />
                                    <Label htmlFor="group">Student Group</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value="class" id="class" />
                                    <Label htmlFor="class">Entire Class</Label>
                                  </div>
                                </div>
                              </RadioGroup>

                              <ScrollArea className="h-[200px] border rounded-md p-2">
                                {recipientType === "student" && students?.map((s) => (
                                  <div key={s.id} className="flex items-center gap-2 py-1">
                                    <Checkbox
                                      checked={selectedRecipients.includes(s.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedRecipients([...selectedRecipients, s.id]);
                                        } else {
                                          setSelectedRecipients(selectedRecipients.filter(id => id !== s.id));
                                        }
                                      }}
                                    />
                                    <span>{s.firstName} {s.lastName}</span>
                                    {s.accommodations && s.accommodations.length > 0 && (
                                      <Badge variant="outline">
                                        {(s.accommodations as any[])[0].type}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                                {recipientType === "group" && studentGroups?.map((g) => (
                                  <div key={g.id} className="flex items-center gap-2 py-1">
                                    <Checkbox
                                      checked={selectedRecipients.includes(g.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedRecipients([...selectedRecipients, g.id]);
                                        } else {
                                          setSelectedRecipients(selectedRecipients.filter(id => id !== g.id));
                                        }
                                      }}
                                    />
                                    <span>{g.name}</span>
                                    <Badge variant="outline">
                                      {(g.studentIds as string[]).length} students
                                    </Badge>
                                  </div>
                                ))}
                                {recipientType === "class" && classes?.map((c) => (
                                  <div key={c.id} className="flex items-center gap-2 py-1">
                                    <Checkbox
                                      checked={selectedRecipients.includes(c.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedRecipients([...selectedRecipients, c.id]);
                                        } else {
                                          setSelectedRecipients(selectedRecipients.filter(id => id !== c.id));
                                        }
                                      }}
                                    />
                                    <span>{c.name}</span>
                                    {c.period && <Badge variant="outline">Period {c.period}</Badge>}
                                  </div>
                                ))}
                                {((recipientType === "student" && (!students || students.length === 0)) ||
                                  (recipientType === "group" && (!studentGroups || studentGroups.length === 0)) ||
                                  (recipientType === "class" && (!classes || classes.length === 0))) && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <UserPlus className="h-8 w-8 mx-auto mb-2" />
                                    <p>No {recipientType}s found</p>
                                    <p className="text-sm">Add {recipientType}s first to assign work</p>
                                  </div>
                                )}
                              </ScrollArea>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                              <Button 
                                onClick={() => handleAssign(assignment.id)}
                                disabled={assignMutation.isPending || selectedRecipients.length === 0}
                              >
                                {assignMutation.isPending ? "Assigning..." : "Assign"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  ))}
                  </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-oswald text-lg mb-2">No Assignments Yet</h3>
                    <p className="text-muted-foreground mb-4">Generate your first assignment from a lesson plan</p>
                  </CardContent>
                </Card>
              )
            )}
          </TabsContent>

          {/* ── Class BKD Insights Tab (educators only) ── */}
          {!isStudent && !isParent && (
            <TabsContent value="class-bkd" className="space-y-6">
              <ClassBKDInsights />
            </TabsContent>
          )}
        </Tabs>

        <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-oswald">
                Accommodation Suggestions
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3 py-4">
                {suggestions?.map((s) => (
                  <div key={s.id} className="p-3 border rounded-md">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <Badge variant="outline" className="mb-1">{s.category}</Badge>
                        <p>{s.suggestion}</p>
                        <p className="text-xs text-muted-foreground mt-1">Source: {s.source}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setSuggestionsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface StudentBKDRow {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  classIds: string[];
  hasAssessment: boolean;
  beScore: number | null;
  knowScore: number | null;
  doScore: number | null;
  totalScore: number | null;
  strengths: string[];
  growthAreas: string[];
  assessedAt: string | null;
}

interface BKDInsightsData {
  classes: { classId: string; className: string; period?: string | null; totalStudents: number; studentsAssessed: number; avgBe: number | null; avgKnow: number | null; avgDo: number | null }[];
  students: StudentBKDRow[];
  aggregate: {
    totalStudents: number;
    studentsAssessed: number;
    avgBe: number;
    avgKnow: number;
    avgDo: number;
    lowBe: number;
    lowKnow: number;
    lowDo: number;
  } | null;
}

function BKDBar({ score, color }: { score: number | null; color: string }) {
  if (score === null) return <span className="text-xs text-muted-foreground font-roboto">No data</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-roboto w-8 text-right">{score}%</span>
    </div>
  );
}

function ClassBKDInsights() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [showNames, setShowNames] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<BKDInsightsData>({
    queryKey: ["/api/class/bkd-insights"],
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!data?.students) return;
    const rows = data.students.filter(s => s.hasAssessment);
    const csv = [
      ["First Name", "Last Name", "Grade", "BE Score", "KNOW Score", "DO Score", "Total", "Strengths", "Growth Areas", "Assessed At"].join(","),
      ...rows.map(s => [
        s.firstName, s.lastName, s.gradeLevel || "", s.beScore, s.knowScore, s.doScore, s.totalScore,
        `"${(s.strengths || []).join("; ")}"`, `"${(s.growthAreas || []).join("; ")}"`,
        s.assessedAt ? new Date(s.assessedAt).toLocaleDateString() : ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "class-bkd-results.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Class BKD data exported as CSV" });
  };

  const filteredStudents = data?.students?.filter(s =>
    selectedClass === "all" || s.classIds.includes(selectedClass)
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.classes.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-oswald text-lg mb-2">No Classes Found</h3>
          <p className="text-muted-foreground font-roboto text-sm">Add classes and enroll students to view their BKD assessment results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Header */}
      <Card className="border-lys-teal/30 bg-lys-teal/5">
        <CardContent className="py-4 flex gap-4 items-start">
          <BarChart3 className="h-6 w-6 text-lys-teal shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-oswald text-base font-semibold">Class Be-Know-Do Insights</p>
            <p className="font-roboto text-sm text-muted-foreground mt-1">
              View how your students score across the three BKD pillars so you can tailor your teaching, coaching, and lesson plans to meet them where they are.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="font-roboto text-xs">Student data only</Badge>
              <Badge variant="outline" className="font-roboto text-xs">COPPA-compliant view</Badge>
              <Badge variant="outline" className="font-roboto text-xs">District & campus admins can see this</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48" data-testid="select-class-filter">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {data.classes.map(c => (
              <SelectItem key={c.classId} value={c.classId}>{c.className}{c.period ? ` (Period ${c.period})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNames(!showNames)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-roboto transition-colors ${showNames ? "border-lys-teal bg-lys-teal/10 text-lys-teal" : "border-border text-muted-foreground"}`}
            data-testid="button-toggle-names"
          >
            {showNames ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showNames ? "Showing Names" : "Names Hidden"}
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1" data-testid="button-print-bkd">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1" data-testid="button-download-bkd">
            <Copy className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Aggregate Summary Cards */}
      {data.aggregate && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-oswald">{data.aggregate.studentsAssessed}</p>
              <p className="text-xs text-muted-foreground font-roboto">of {data.aggregate.totalStudents} students assessed</p>
            </CardContent>
          </Card>
          <Card className="bg-lys-yellow/10 border-lys-yellow/20">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-oswald text-lys-yellow">{data.aggregate.avgBe}%</p>
              <p className="text-xs text-muted-foreground font-roboto">Class avg BE</p>
              {data.aggregate.lowBe > 0 && <Badge variant="outline" className="text-xs mt-1">{data.aggregate.lowBe} need support</Badge>}
            </CardContent>
          </Card>
          <Card className="bg-lys-red/10 border-lys-red/20">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-oswald text-lys-red">{data.aggregate.avgKnow}%</p>
              <p className="text-xs text-muted-foreground font-roboto">Class avg KNOW</p>
              {data.aggregate.lowKnow > 0 && <Badge variant="outline" className="text-xs mt-1">{data.aggregate.lowKnow} need support</Badge>}
            </CardContent>
          </Card>
          <Card className="bg-lys-teal/10 border-lys-teal/20">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold font-oswald text-lys-teal">{data.aggregate.avgDo}%</p>
              <p className="text-xs text-muted-foreground font-roboto">Class avg DO</p>
              {data.aggregate.lowDo > 0 && <Badge variant="outline" className="text-xs mt-1">{data.aggregate.lowDo} need support</Badge>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-Student Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="font-oswald text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Breakdown
            {!showNames && (
              <Badge variant="outline" className="font-roboto text-xs font-normal">Names hidden — toggle above to reveal</Badge>
            )}
          </CardTitle>
          <CardDescription className="font-roboto text-xs">
            Results reflect each student's most recent Be-Know-Do assessment. Scores below 50% indicate areas where coaching and targeted lesson design can make a real difference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6 font-roboto">No students found in this class.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-class-bkd">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-oswald text-xs text-muted-foreground">Student</th>
                    <th className="text-left py-2 pr-4 font-oswald text-xs text-muted-foreground w-32">
                      <span className="text-lys-yellow">BE</span> — Identity
                    </th>
                    <th className="text-left py-2 pr-4 font-oswald text-xs text-muted-foreground w-32">
                      <span className="text-lys-red">KNOW</span> — Knowledge
                    </th>
                    <th className="text-left py-2 pr-4 font-oswald text-xs text-muted-foreground w-32">
                      <span className="text-lys-teal">DO</span> — Action
                    </th>
                    <th className="text-left py-2 font-oswald text-xs text-muted-foreground">Focus Areas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="border-b last:border-0" data-testid={`row-student-bkd-${student.id}`}>
                      <td className="py-3 pr-4">
                        {showNames ? (
                          <span className="font-roboto text-sm">{student.firstName} {student.lastName}</span>
                        ) : (
                          <span className="font-roboto text-sm text-muted-foreground">Student {idx + 1}</span>
                        )}
                        {student.gradeLevel && (
                          <span className="block text-xs text-muted-foreground">Grade {student.gradeLevel}</span>
                        )}
                        {!student.hasAssessment && (
                          <Badge variant="outline" className="text-xs mt-1">Not assessed yet</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 w-32">
                        <BKDBar score={student.beScore} color="bg-lys-yellow" />
                      </td>
                      <td className="py-3 pr-4 w-32">
                        <BKDBar score={student.knowScore} color="bg-lys-red" />
                      </td>
                      <td className="py-3 pr-4 w-32">
                        <BKDBar score={student.doScore} color="bg-lys-teal" />
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {(student.growthAreas || []).map((area, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-roboto">{area}</Badge>
                          ))}
                          {student.hasAssessment && (student.growthAreas || []).length === 0 && (
                            <Badge variant="secondary" className="text-xs font-roboto text-green-600">Strong across all pillars</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Class Summary */}
      {data.classes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald text-base">Class-by-Class Summary</CardTitle>
            <CardDescription className="font-roboto text-xs">Aggregate BKD averages per period or class section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.classes.map(cls => (
                <div key={cls.classId} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-oswald text-sm font-semibold">{cls.className}</p>
                      {cls.period && <p className="text-xs text-muted-foreground">Period {cls.period}</p>}
                    </div>
                    <Badge variant="outline" className="font-roboto text-xs">{cls.studentsAssessed}/{cls.totalStudents} assessed</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ label: "BE", val: cls.avgBe, color: "bg-lys-yellow", text: "text-lys-yellow" }, { label: "KNOW", val: cls.avgKnow, color: "bg-lys-red", text: "text-lys-red" }, { label: "DO", val: cls.avgDo, color: "bg-lys-teal", text: "text-lys-teal" }].map(p => (
                      <div key={p.label}>
                        <p className={`font-oswald text-xs font-bold ${p.text} mb-1`}>{p.label}</p>
                        <BKDBar score={p.val} color={p.color} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
