import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sparkles, FileText, Users, UserPlus, AlertTriangle, Check, Clock, BookOpen, Target, Compass, Lightbulb, Lock, GraduationCap, Copy, Printer, Pencil, Trash2, Plus, CheckCircle, Play, Search, RefreshCw, Star, ArrowRight, HelpCircle, ScrollText, Heart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Lesson, Assignment, Class, Student, StudentGroup, AccommodationType } from "@shared/schema";

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

export default function Assignments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [assignmentType, setAssignmentType] = useState("quiz");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [includeBeKnowDo, setIncludeBeKnowDo] = useState(true);
  const [accommodationType, setAccommodationType] = useState<AccommodationType | undefined>();
  const [accommodationNotes, setAccommodationNotes] = useState("");
  const [generatedAssignment, setGeneratedAssignment] = useState<any>(null);
  const [projectTemplate, setProjectTemplate] = useState("community_consultant");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<"student" | "group" | "class">("student");
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);

  const isPaidUser = user?.tier === "pro" || user?.tier === "campus";
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  
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

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    enabled: isAuthenticated,
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
    queryKey: ["/api/accommodations/suggestions", accommodationType],
    enabled: !!accommodationType,
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/assignments/generate", data),
    onSuccess: (response: any) => {
      console.log("[Assignment Generate] Response from server:", response);
      console.log("[Assignment Generate] Response worksheet:", response.worksheet);
      
      // Auto-populate title with lesson name
      const updatedData = {
        ...response,
        title: selectedLesson?.title || response.title,
      };
      console.log("[Assignment Generate] Updated data:", updatedData);
      console.log("[Assignment Generate] Updated data worksheet:", updatedData.worksheet);
      setGeneratedAssignment(updatedData);
      
      // Auto-populate worksheet header from user profile and selected class
      const selectedClass = classes?.find(c => c.id === selectedClassId);
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
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save assignment", variant: "destructive" });
    },
  });

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
      accommodationType,
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
      accommodationType: generatedAssignment.accommodationType,
      accommodationNotes: generatedAssignment.accommodationNotes,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-marker text-foreground">Assignment Generator</h1>
            <p className="text-muted-foreground mt-1">Create engaging assessments from your lesson plans</p>
          </div>
          {!isPaidUser && (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Pro Feature
            </Badge>
          )}
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate" data-testid="tab-generate">Generate New</TabsTrigger>
            <TabsTrigger value="saved" data-testid="tab-saved">My Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {!isPaidUser && (
              <Card className="border-lys-yellow">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertTriangle className="h-8 w-8 text-lys-yellow shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-oswald text-lg">Upgrade to Pro</h3>
                    <p className="text-sm text-muted-foreground">
                      Assignment generation is available for Pro and Campus subscribers. Upgrade to create AI-powered assessments.
                    </p>
                  </div>
                  <Button onClick={() => setLocation("/pricing")} data-testid="button-upgrade">
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-oswald">1. Select a Lesson</CardTitle>
                  <CardDescription>Choose a lesson plan to base your assignment on</CardDescription>
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
                                  template.bkdFocus === "know" ? "bg-blue-100 text-blue-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{template.label}</span>
                                    <Badge variant="outline" className={`text-xs ${
                                      template.bkdFocus === "be" ? "border-yellow-500 text-yellow-700" :
                                      template.bkdFocus === "know" ? "border-blue-500 text-blue-700" :
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
                          <SelectItem value="">No class selected</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {c.period ? `- Period ${c.period}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
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
                        disabled={!accommodationType}
                        data-testid="button-suggestions"
                      >
                        <Lightbulb className="h-4 w-4 mr-1" />
                        View Suggestions
                      </Button>
                    </div>
                    <Select value={accommodationType || "none"} onValueChange={(v) => setAccommodationType(v === "none" ? undefined : v as AccommodationType)}>
                      <SelectTrigger data-testid="select-accommodation">
                        <SelectValue placeholder="No accommodation (standard)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No accommodation</SelectItem>
                        <SelectItem value="IEP">IEP (Individualized Education Program)</SelectItem>
                        <SelectItem value="504">504 Plan</SelectItem>
                        <SelectItem value="BIP">BIP (Behavior Intervention Plan)</SelectItem>
                      </SelectContent>
                    </Select>
                    {accommodationType && (
                      <Textarea
                        placeholder="Additional accommodation notes..."
                        value={accommodationNotes}
                        onChange={(e) => setAccommodationNotes(e.target.value)}
                        className="mt-2"
                        data-testid="textarea-accommodation-notes"
                      />
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

            {generatedAssignment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
                  {isEditing ? (
                    <Input 
                      value={generatedAssignment.title} 
                      onChange={(e) => updateTitle(e.target.value)}
                      className="font-oswald text-xl max-w-md"
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

                <Card id="generated-assignment" className="print:shadow-none print:border-2 print:border-black">
                  <CardContent className="p-6 print:p-4">
                    <div className="border-b-2 border-foreground pb-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
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
                    </div>

                    {/* Worksheet Layout with Sidebar */}
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left Sidebar - Lesson Metadata */}
                      {generatedAssignment.worksheet && (
                        <div className="md:w-1/3 border-r md:pr-4 space-y-4 print:w-1/3">
                          <div className="space-y-3 text-sm">
                            <div className="border-b pb-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</Label>
                              {isEditing ? (
                                <Input value={generatedAssignment.worksheet.course} onChange={(e) => updateWorksheetField("course", e.target.value)} className="text-sm mt-1" data-testid="input-edit-course" />
                              ) : (
                                <p className="mt-1 font-medium">{generatedAssignment.worksheet.course}</p>
                              )}
                            </div>
                            
                            <div className="border-b pb-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</Label>
                              {isEditing ? (
                                <Input value={generatedAssignment.worksheet.unit} onChange={(e) => updateWorksheetField("unit", e.target.value)} className="text-sm mt-1" data-testid="input-edit-unit" />
                              ) : (
                                <p className="mt-1 font-medium">{generatedAssignment.worksheet.unit}</p>
                              )}
                            </div>
                            
                            <div className="border-b pb-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content Objective (TEKS)</Label>
                              {isEditing ? (
                                <Textarea value={generatedAssignment.worksheet.contentObjective} onChange={(e) => updateWorksheetField("contentObjective", e.target.value)} className="text-sm min-h-[60px] mt-1" data-testid="input-edit-content-objective" />
                              ) : (
                                <p className="mt-1">{generatedAssignment.worksheet.contentObjective}</p>
                              )}
                            </div>
                            
                            <div className="border-b pb-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lesson Objective</Label>
                              {isEditing ? (
                                <Textarea value={generatedAssignment.worksheet.lessonObjective} onChange={(e) => updateWorksheetField("lessonObjective", e.target.value)} className="text-sm min-h-[60px] mt-1" data-testid="input-edit-lesson-objective" />
                              ) : (
                                <p className="mt-1">{generatedAssignment.worksheet.lessonObjective}</p>
                              )}
                            </div>
                            
                            <div className="border-b pb-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">LYS Methodology</Label>
                              {isEditing ? (
                                <div className="space-y-2 mt-1">
                                  <div>
                                    <Label className="text-xs">BE:</Label>
                                    <Input value={generatedAssignment.worksheet.lysMethodology?.be || ""} onChange={(e) => updateLysMethodology("be", e.target.value)} className="text-sm mt-1" data-testid="input-edit-be" />
                                  </div>
                                  <div>
                                    <Label className="text-xs">KNOW:</Label>
                                    <Input value={generatedAssignment.worksheet.lysMethodology?.know || ""} onChange={(e) => updateLysMethodology("know", e.target.value)} className="text-sm mt-1" data-testid="input-edit-know" />
                                  </div>
                                  <div>
                                    <Label className="text-xs">DO:</Label>
                                    <Input value={generatedAssignment.worksheet.lysMethodology?.do || ""} onChange={(e) => updateLysMethodology("do", e.target.value)} className="text-sm mt-1" data-testid="input-edit-do" />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1 mt-1">
                                  <p><strong className="text-lys-red">BE:</strong> {generatedAssignment.worksheet.lysMethodology?.be}</p>
                                  <p><strong className="text-lys-yellow">KNOW:</strong> {generatedAssignment.worksheet.lysMethodology?.know}</p>
                                  <p><strong className="text-lys-teal">DO:</strong> {generatedAssignment.worksheet.lysMethodology?.do}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="border-b pb-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Essential Questions</Label>
                              {isEditing ? (
                                <Textarea value={generatedAssignment.worksheet.essentialQuestions} onChange={(e) => updateWorksheetField("essentialQuestions", e.target.value)} className="mt-1 text-sm min-h-[60px]" data-testid="input-edit-essential-questions" />
                              ) : (
                                <p className="mt-1">{generatedAssignment.worksheet.essentialQuestions}</p>
                              )}
                            </div>
                            
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lesson Close</Label>
                              {isEditing ? (
                                <Textarea value={generatedAssignment.worksheet.lessonClose} onChange={(e) => updateWorksheetField("lessonClose", e.target.value)} className="mt-1 text-sm min-h-[60px]" data-testid="input-edit-lesson-close" />
                              ) : (
                                <p className="mt-1">{generatedAssignment.worksheet.lessonClose}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Right Main Content - Questions */}
                      <div className={`${generatedAssignment.worksheet ? "md:w-2/3" : "w-full"} print:w-2/3`}>
                        <div className="mb-4 p-3 bg-muted print:bg-gray-50 rounded-md">
                          <Label className="text-xs font-semibold">Assignment Instructions</Label>
                          {isEditing ? (
                            <Textarea value={generatedAssignment.instructions} onChange={(e) => updateInstructions(e.target.value)} className="mt-1 min-h-[60px]" data-testid="input-edit-instructions" />
                          ) : (
                            <p className="mt-1">{generatedAssignment.instructions}</p>
                          )}
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                      {(generatedAssignment.questions || []).map((q: any, i: number) => (
                        <div key={q.id || i} className="p-4 border rounded-md print:break-inside-avoid">
                          <div className="flex items-start gap-3">
                            <span className="font-oswald text-lg text-muted-foreground">{i + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap print:hidden">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getBkdIcon(q.bkdFocus)}
                                  <Badge variant="outline">{(q.type || "").replace("_", " ")}</Badge>
                                  {q.bloomsLevel && (
                                    <Badge variant="secondary" className="text-xs capitalize">{q.bloomsLevel}</Badge>
                                  )}
                                  {q.depthOfKnowledge && (
                                    <Badge variant="secondary" className="text-xs">DOK {q.depthOfKnowledge}</Badge>
                                  )}
                                  {isEditing ? (
                                    <Input 
                                      type="number" 
                                      value={q.points} 
                                      onChange={(e) => updateQuestion(i, "points", parseInt(e.target.value) || 0)} 
                                      className="w-16 h-7 text-xs"
                                      data-testid={`input-edit-points-${i}`}
                                    />
                                  ) : (
                                    <Badge>{q.points} pts</Badge>
                                  )}
                                </div>
                                {isEditing && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteQuestion(i)} className="h-7 w-7" data-testid={`button-delete-question-${i}`}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                              {/* Stimulus - context/scenario presented first */}
                              {q.stimulus && (
                                <div className="mb-2 p-2 bg-muted/50 rounded text-sm italic print:bg-gray-50">
                                  {isEditing ? (
                                    <Textarea 
                                      value={q.stimulus} 
                                      onChange={(e) => updateQuestion(i, "stimulus", e.target.value)} 
                                      className="min-h-[40px] text-sm italic"
                                      placeholder="Context or scenario for the question..."
                                      data-testid={`input-edit-stimulus-${i}`}
                                    />
                                  ) : (
                                    q.stimulus
                                  )}
                                </div>
                              )}
                              {isEditing ? (
                                <Textarea value={q.question} onChange={(e) => updateQuestion(i, "question", e.target.value)} className="font-medium min-h-[60px]" data-testid={`input-edit-question-${i}`} />
                              ) : (
                                <p className="font-medium">{q.question}</p>
                              )}
                              {q.options && (
                                <ul className="mt-2 space-y-1">
                                  {q.options.map((opt: string, oi: number) => {
                                    const isCorrect = q.rubric?.correctAnswer === opt;
                                    const distractor = q.rubric?.distractors?.find((d: any) => d.option === opt);
                                    return (
                                      <li key={oi} className="text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${isCorrect ? "border-green-500 text-green-600 font-semibold print:hidden" : ""}`}>
                                            {String.fromCharCode(65 + oi)}
                                          </span>
                                          {isEditing ? (
                                            <Input value={opt} onChange={(e) => updateQuestionOption(i, oi, e.target.value)} className="flex-1 h-7 text-sm" data-testid={`input-edit-option-${i}-${oi}`} />
                                          ) : opt}
                                          {isCorrect && !isEditing && (
                                            <Badge variant="outline" className="text-green-600 border-green-500 print:hidden">Correct</Badge>
                                          )}
                                        </div>
                                        {/* Show distractor feedback for educators (hidden in print) */}
                                        {distractor?.feedback && !isEditing && (
                                          <p className="ml-7 mt-1 text-xs text-muted-foreground italic print:hidden">
                                            Feedback: {distractor.feedback}
                                          </p>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                              {/* Rubric for open-ended questions */}
                              {q.rubric?.partialCreditRules && q.rubric.partialCreditRules.length > 0 && !isEditing && (
                                <div className="mt-3 p-2 bg-muted/30 rounded text-xs print:hidden">
                                  <p className="font-semibold mb-1">Grading Rubric:</p>
                                  <ul className="space-y-1">
                                    {q.rubric.partialCreditRules.map((rule: any, ri: number) => (
                                      <li key={ri} className="flex justify-between">
                                        <span>{rule.condition}</span>
                                        <Badge variant="secondary" className="text-xs">{rule.points} pts</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!q.options && q.type !== "multiple_choice" && q.type !== "true_false" && (
                                <div className="mt-3 border-b border-muted-foreground/30 min-h-[60px] print:min-h-[80px]"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
                                <div className="p-4 rounded-md bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-purple-600" />
                                    <span className="font-oswald text-sm text-purple-700 dark:text-purple-400">High Ceiling (Advanced)</span>
                                  </div>
                                  <p className="text-sm text-purple-800 dark:text-purple-300">{generatedAssignment.project.highCeiling}</p>
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
                                          styleType === "socratic" ? "border-blue-200" :
                                          styleType === "hebraic" ? "border-amber-200" :
                                          "border-primary/20"
                                        }`}>
                                          <StyleIcon className={`w-5 h-5 ${
                                            styleType === "socratic" ? "text-blue-600" :
                                            styleType === "hebraic" ? "text-amber-600" :
                                            "text-primary"
                                          }`} />
                                          <div>
                                            <span className={`font-oswald text-sm ${
                                              styleType === "socratic" ? "text-blue-700 dark:text-blue-400" :
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
                                              styleType === "socratic" ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" :
                                              styleType === "hebraic" ? "bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900" :
                                              "bg-primary/5 border-primary/10"
                                            }`}>
                                              <div className="flex items-start gap-2">
                                                <Badge variant="outline" className={`text-xs flex-shrink-0 ${
                                                  styleType === "socratic" ? "border-blue-300 text-blue-700 dark:text-blue-400" :
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

                        {generatedAssignment.accommodationChecklist && (
                          <>
                            <Separator className="my-6" />
                            <div className="print:break-inside-avoid">
                              <h3 className="font-oswald text-lg mb-3">Accommodations/Modifications Provided On This Assignment</h3>
                              <table className="w-full border-collapse text-sm">
                                <thead>
                                  <tr className="bg-muted print:bg-gray-100">
                                    <th className="border p-2 text-left font-semibold">Accommodation/Modification</th>
                                    <th className="border p-2 text-center font-semibold w-32">Applied (Y/N)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { key: "extraTime", label: "Extra Time" },
                                    { key: "notesCopyProvided", label: "Notes/Presentation Copy Provided" },
                                    { key: "studySheetProvided", label: "Study Sheet Provided" },
                                    { key: "graphicOrganizer", label: "Graphic Organizer" },
                                    { key: "mnemonicDevices", label: "Mnemonic Devices" },
                                    { key: "largerFont", label: "Larger Size Font" },
                                    { key: "shortenedText", label: "Shortened Text" },
                                    { key: "peerSupport", label: "Peer Support" },
                                    { key: "preferentialSeating", label: "Preferential Seating" },
                                    { key: "frequentReminders", label: "Frequent On Task Reminders" },
                                    { key: "completedExample", label: "Provided A Completed Example" },
                                    { key: "visualOrganizer", label: "Visual Organizer Provided" },
                                  ].map((item) => (
                                    <tr key={item.key}>
                                      <td className="border p-2">{item.label}</td>
                                      <td className="border p-2 text-center">
                                        {isEditing ? (
                                          <Checkbox 
                                            checked={(generatedAssignment.accommodationChecklist as any)?.[item.key]} 
                                            onCheckedChange={() => toggleAccommodation(item.key)}
                                            data-testid={`checkbox-accommodation-${item.key}`}
                                          />
                                        ) : (generatedAssignment.accommodationChecklist as any)?.[item.key] ? (
                                          <span className="text-green-600 font-semibold">Y</span>
                                        ) : (
                                          <span className="text-muted-foreground">N</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}

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

          <TabsContent value="saved">
            {assignmentsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading assignments...</div>
            ) : assignments && assignments.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-oswald text-lg">{assignment.title}</CardTitle>
                        {assignment.accommodationModified && (
                          <Badge variant="outline">{assignment.accommodationType}</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
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
                              <div className="flex items-center gap-4">
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
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-oswald text-lg mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-4">Generate your first assignment from a lesson plan</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-oswald">
                {accommodationType} Accommodation Suggestions
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
