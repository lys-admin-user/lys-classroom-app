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
import { Sparkles, FileText, Users, UserPlus, AlertTriangle, Check, Clock, BookOpen, Target, Compass, Lightbulb, Lock, GraduationCap } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Lesson, Assignment, Class, Student, StudentGroup, AccommodationType } from "@shared/schema";

const ASSIGNMENT_TYPES = [
  { value: "quiz", label: "Quiz", description: "Multiple choice and short answer questions" },
  { value: "worksheet", label: "Worksheet", description: "Comprehensive practice problems" },
  { value: "project", label: "Project", description: "Extended creative assignment" },
  { value: "discussion", label: "Discussion", description: "Open-ended discussion prompts" },
  { value: "reflection", label: "Reflection", description: "Self-reflection and journaling" },
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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<"student" | "group" | "class">("student");
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);

  const isPaidUser = user?.tier === "pro" || user?.tier === "campus";

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
    onSuccess: (data) => {
      setGeneratedAssignment(data);
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
                              <Badge variant="outline" size="sm">{lesson.gradeLevel}</Badge>
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
                        size="sm"
                        onClick={() => setSuggestionsDialogOpen(true)}
                        disabled={!accommodationType}
                        data-testid="button-suggestions"
                      >
                        <Lightbulb className="h-4 w-4 mr-1" />
                        View Suggestions
                      </Button>
                    </div>
                    <Select value={accommodationType || ""} onValueChange={(v) => setAccommodationType(v as AccommodationType || undefined)}>
                      <SelectTrigger data-testid="select-accommodation">
                        <SelectValue placeholder="No accommodation (standard)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No accommodation</SelectItem>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="font-oswald">{generatedAssignment.title}</CardTitle>
                      <CardDescription>{generatedAssignment.description}</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {generatedAssignment.accommodationModified && (
                        <Badge variant="outline">{generatedAssignment.accommodationType} Modified</Badge>
                      )}
                      <Badge>{generatedAssignment.totalPoints} points</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <Label className="text-xs text-muted-foreground">Instructions</Label>
                    <p className="mt-1">{generatedAssignment.instructions}</p>
                  </div>

                  <div className="space-y-4">
                    {generatedAssignment.questions.map((q: any, i: number) => (
                      <div key={q.id} className="p-4 border rounded-md">
                        <div className="flex items-start gap-3">
                          <span className="font-oswald text-lg text-muted-foreground">{i + 1}.</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {getBkdIcon(q.bkdFocus)}
                              <Badge variant="outline" size="sm">{q.type.replace("_", " ")}</Badge>
                              <Badge size="sm">{q.points} pts</Badge>
                            </div>
                            <p className="font-medium">{q.question}</p>
                            {q.options && (
                              <ul className="mt-2 space-y-1">
                                {q.options.map((opt: string, oi: number) => (
                                  <li key={oi} className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    {opt}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline" onClick={() => setGeneratedAssignment(null)} data-testid="button-discard">
                    Discard
                  </Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-assignment">
                    {saveMutation.isPending ? "Saving..." : "Save Assignment"}
                  </Button>
                </CardFooter>
              </Card>
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
                          <Badge variant="outline" size="sm">{assignment.accommodationType}</Badge>
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
                          <Button variant="outline" size="sm" data-testid={`button-assign-${assignment.id}`}>
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
                                    <Badge variant="outline" size="sm">
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
                                  <Badge variant="outline" size="sm">
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
                                  {c.period && <Badge variant="outline" size="sm">Period {c.period}</Badge>}
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
                        <Badge variant="outline" size="sm" className="mb-1">{s.category}</Badge>
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
