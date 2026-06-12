import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Trash2, Clock, Target, GraduationCap, Heart, Compass, Lightbulb, AlertCircle, Share2, Link2, BarChart3, Library, Loader2, Search, Filter, LayoutGrid, List, Globe, Lock, Sparkles, Zap, ClipboardList, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson, LessonTemplate, Assignment } from "@shared/schema";
import { Link, useSearch } from "wouter";
import { X } from "lucide-react";
import { TemplateCard, CreateTemplateDialog, UseTemplateDialog, templateCategories, templateGradeLevels } from "./TemplateLibrary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShareDialog } from "@/components/ShareDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bkdConfig = {
  be: { label: "BE", icon: Heart, color: "bg-lys-red/10 text-lys-red border-lys-red/20" },
  know: { label: "KNOW", icon: Compass, color: "bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20" },
  do: { label: "DO", icon: Lightbulb, color: "bg-lys-teal/10 text-lys-teal border-lys-teal/20" },
};

// Extract the standard codes attached to a lesson. Saved lessons serialize
// their alignment either as JSON ({ codes: [{ code }], standardsName }) or as
// a lossy string ("[Country] StandardsName: CODE1, CODE2"); we read both so
// the dashboard "Standards I've used" deep-link can match either shape.
function getLessonStandardCodes(standards: string | null | undefined): string[] {
  if (!standards) return [];
  try {
    const parsed = JSON.parse(standards);
    if (parsed?.codes && Array.isArray(parsed.codes)) {
      return parsed.codes
        .map((c: { code?: string }) => c?.code?.trim())
        .filter(Boolean) as string[];
    }
  } catch {
    // Not JSON — fall through to string parsing below.
  }
  const withoutCountry = standards.replace(/^\s*\[[^\]]*\]\s*/, "");
  const colonIdx = withoutCountry.indexOf(":");
  if (colonIdx < 0) return [];
  return withoutCountry
    .slice(colonIdx + 1)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function lessonMentionsStandard(lesson: Lesson, code: string): boolean {
  const target = code.trim().toLowerCase();
  if (!target) return true;
  return getLessonStandardCodes(lesson.standards).some(
    (c) => c.toLowerCase() === target,
  );
}

export default function MyLessons() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const searchString = useSearch();
  const standardFilter = (new URLSearchParams(searchString).get("standard") || "").trim();
  const [activeMainTab, setActiveMainTab] = useState("lessons");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareLesson, setShareLesson] = useState<{ id: string; title: string } | null>(null);
  const [templateLesson, setTemplateLesson] = useState<Lesson | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateVisibility, setTemplateVisibility] = useState<"private" | "public">("private");

  // Template Library state
  const [templateTab, setTemplateTab] = useState("my-templates");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);

  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    enabled: isAuthenticated,
  });

  const { data: myTemplates = [], isLoading: myTemplatesLoading } = useQuery<LessonTemplate[]>({
    queryKey: ["/api/templates"],
    enabled: isAuthenticated,
  });

  const { data: publicTemplates = [], isLoading: publicTemplatesLoading } = useQuery<LessonTemplate[]>({
    queryKey: ["/api/templates/public"],
    enabled: isAuthenticated,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({
        title: "Lesson Deleted",
        description: "The lesson has been removed from your library.",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ lessonId, title, description, visibility }: { lessonId: string; title: string; description: string; visibility: string }) => {
      return await apiRequest("POST", `/api/lessons/${lessonId}/save-as-template`, {
        title,
        description,
        visibility
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/public"] });
      toast({
        title: "Template Created!",
        description: "Your lesson has been saved as a reusable template.",
      });
      setTemplateLesson(null);
      setTemplateTitle("");
      setTemplateDescription("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save as template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: async ({ templateId, customizations }: { templateId: string; customizations: any }) => {
      setUsingTemplateId(templateId);
      return await apiRequest("POST", `/api/templates/${templateId}/use`, customizations);
    },
    onSuccess: () => {
      toast({ title: "Lesson created!", description: "Your new lesson is ready in your saved lessons." });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/public"] });
      setUseDialogOpen(false);
      setSelectedTemplate(null);
      setUsingTemplateId(null);
      setActiveMainTab("lessons");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create lesson from template", variant: "destructive" });
      setUsingTemplateId(null);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/public"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  });

  const handleUseTemplate = (template: LessonTemplate) => {
    setSelectedTemplate(template);
    setUseDialogOpen(true);
  };

  const filterTemplates = (templates: LessonTemplate[]) => {
    return templates.filter(t => {
      const matchesSearch = !templateSearchQuery || 
        t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(templateSearchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      const matchesGrade = selectedGrade === "All Grades" || t.gradeLevel === selectedGrade;
      return matchesSearch && matchesCategory && matchesGrade;
    });
  };

  const filteredMyTemplates = filterTemplates(myTemplates);
  const filteredPublicTemplates = filterTemplates(publicTemplates);

  const standardsCoverage = useMemo(() => {
    if (!lessons || lessons.length === 0) return null;
    
    const standardsMap = new Map<string, { code: string; count: number; standardsName: string }>();
    let totalWithStandards = 0;
    
    lessons.forEach((lesson) => {
      if (lesson.standards) {
        try {
          const parsed = JSON.parse(lesson.standards);
          if (parsed.codes && Array.isArray(parsed.codes)) {
            totalWithStandards++;
            parsed.codes.forEach((code: { code: string }) => {
              const existing = standardsMap.get(code.code);
              if (existing) {
                existing.count++;
              } else {
                standardsMap.set(code.code, { 
                  code: code.code, 
                  count: 1, 
                  standardsName: parsed.standardsName || "Standards" 
                });
              }
            });
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    });
    
    if (standardsMap.size === 0) return null;
    
    const sorted = Array.from(standardsMap.values()).sort((a, b) => b.count - a.count);
    const topStandards = sorted.slice(0, 6);
    const standardsName = sorted[0]?.standardsName || "Standards";
    
    return {
      total: standardsMap.size,
      topStandards,
      lessonsWithStandards: totalWithStandards,
      totalLessons: lessons.length,
      standardsName,
    };
  }, [lessons]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-lys-red/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-lys-red" />
            </div>
            <CardTitle className="font-oswald font-semibold tracking-tight text-2xl">Sign In Required</CardTitle>
            <CardDescription className="font-roboto">
              Sign in to access your saved lesson library and keep all your generated lessons organized.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-sign-in"
            >
              Sign In to Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const filteredLessons = standardFilter
    ? lessons.filter((lesson) => lessonMentionsStandard(lesson, standardFilter))
    : lessons;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-oswald font-semibold tracking-tight text-3xl md:text-4xl text-foreground mb-2" data-testid="text-page-title">
          My Lessons
        </h1>
        <p className="font-roboto text-muted-foreground">
          Manage your lessons and templates in one place
        </p>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="lessons" data-testid="tab-my-lessons">
            <BookOpen className="w-4 h-4 mr-2" />
            Lessons ({lessons.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-my-assignments">
            <ClipboardList className="w-4 h-4 mr-2" />
            Assignments ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Library className="w-4 h-4 mr-2" />
            Templates ({myTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          {standardFilter && (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-lys-teal/30 bg-lys-teal/5 px-3 py-2"
              data-testid="banner-standard-filter"
            >
              <p className="text-sm font-roboto">
                Showing lessons aligned to{" "}
                <span className="font-semibold text-lys-teal" data-testid="text-filter-standard">
                  {standardFilter}
                </span>{" "}
                <span className="text-muted-foreground">
                  ({filteredLessons.length} {filteredLessons.length === 1 ? "lesson" : "lessons"})
                </span>
              </p>
              <Link href="/my-lessons">
                <Button variant="ghost" size="sm" className="font-roboto" data-testid="button-clear-standard-filter">
                  <X className="h-4 w-4 mr-1" />
                  Clear filter
                </Button>
              </Link>
            </div>
          )}
          {standardsCoverage && (
        <Card className="mb-6" data-testid="card-standards-coverage">
          <CardHeader className="pb-2">
            <CardTitle className="font-oswald text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lys-teal" />
              Standards Coverage
            </CardTitle>
            <CardDescription className="font-roboto">
              Tracking {standardsCoverage.total} unique {standardsCoverage.standardsName} codes across {standardsCoverage.lessonsWithStandards} of {standardsCoverage.totalLessons} lessons
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {standardsCoverage.topStandards.map((standard) => (
                <Badge 
                  key={standard.code} 
                  variant="outline" 
                  className="font-roboto text-xs gap-1"
                  data-testid={`badge-standard-${standard.code}`}
                >
                  <span className="font-semibold text-lys-teal">{standard.code}</span>
                  <span className="text-muted-foreground">({standard.count})</span>
                </Badge>
              ))}
              {standardsCoverage.total > 6 && (
                <Badge variant="secondary" className="font-roboto text-xs">
                  +{standardsCoverage.total - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card className="max-w-lg mx-auto text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-oswald text-xl mb-2">No Saved Lessons Yet</h2>
            <p className="font-roboto text-muted-foreground mb-6">
              Generate your first AI-powered lesson and save it to build your library!
            </p>
            <Button
              className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald"
              onClick={() => window.location.href = "/lesson-generator"}
              data-testid="button-create-first-lesson"
            >
              Create Your First Lesson
            </Button>
          </CardContent>
        </Card>
      ) : filteredLessons.length === 0 ? (
        <Card className="max-w-lg mx-auto text-center py-12" data-testid="card-no-filtered-lessons">
          <CardContent>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-oswald text-xl mb-2">No Lessons Match This Standard</h2>
            <p className="font-roboto text-muted-foreground mb-6">
              None of your saved lessons are aligned to {standardFilter} yet.
            </p>
            <Link href="/my-lessons">
              <Button variant="outline" className="font-oswald" data-testid="button-clear-filter-empty">
                <X className="h-4 w-4 mr-2" />
                Clear filter
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLessons.map((lesson) => {
            const bkd = bkdConfig[lesson.bkdFocus as keyof typeof bkdConfig] || bkdConfig.be;
            const BkdIcon = bkd.icon;
            
            return (
              <Card key={lesson.id} className="group hover-elevate" data-testid={`card-lesson-${lesson.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-oswald text-lg line-clamp-2">
                      {lesson.title}
                    </CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                      {lesson.shareId && (
                        <Badge variant="secondary" className="bg-lys-teal/10 text-lys-teal border-lys-teal/20">
                          <Link2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                      <Badge variant="outline" className={bkd.color}>
                        <BkdIcon className="h-3 w-3 mr-1" />
                        {bkd.label}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="font-roboto text-sm">
                    {lesson.topic}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-roboto">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {lesson.gradeLevel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {(lesson.objectives as string[])?.length || 0} objectives
                    </span>
                  </div>
                  
                  <ScrollArea className="h-24 mt-3">
                    <div className="space-y-1">
                      {(lesson.objectives as string[])?.slice(0, 3).map((obj, i) => (
                        <p key={i} className="text-sm text-muted-foreground font-roboto line-clamp-1">
                          • {obj}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="pt-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-roboto"
                    onClick={() => {
                      window.location.href = `/lesson-generator?view=${lesson.id}`;
                    }}
                    data-testid={`button-view-${lesson.id}`}
                  >
                    View Lesson
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={lesson.shareId ? "text-lys-teal" : "text-muted-foreground"}
                    onClick={() => setShareLesson({ id: lesson.id, title: lesson.title })}
                    data-testid={`button-share-${lesson.id}`}
                  >
                    {lesson.shareId ? <Link2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => {
                      setTemplateLesson(lesson);
                      setTemplateTitle(lesson.title);
                      setTemplateDescription("");
                    }}
                    data-testid={`button-template-${lesson.id}`}
                    title="Save as Template"
                  >
                    <Library className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(lesson.id)}
                    data-testid={`button-delete-${lesson.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          </div>
        )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {assignmentsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-oswald text-lg mb-2">No Assignments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate assignments from your saved lessons to distribute to students.
                </p>
                <Link href="/assignments">
                  <Button data-testid="button-create-assignment">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-oswald text-lg">{assignment.title}</CardTitle>
                      {assignment.accommodationModified && (
                        <Badge variant="outline">{(assignment as any).accommodationType || assignment.accommodationTypes}</Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {(assignment.questions as any[])?.length || 0} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {assignment.totalPoints} pts
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 flex-wrap">
                    <Link href="/assignments">
                      <Button variant="outline" size="sm" data-testid={`button-view-assignment-${assignment.id}`}>
                        View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <CreateTemplateDialog onCreated={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
              queryClient.invalidateQueries({ queryKey: ["/api/templates/public"] });
            }} />
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-templates"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-grade">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateGradeLevels.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center border rounded-md">
                  <Button
                    size="icon"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={templateTab} onValueChange={setTemplateTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-templates" data-testid="tab-my-templates">
                <Lock className="w-4 h-4 mr-2" />
                My Templates ({myTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="community" data-testid="tab-community">
                <Globe className="w-4 h-4 mr-2" />
                Community ({publicTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-templates" className="mt-6">
              {myTemplatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredMyTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Library className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Create your first template or save an existing lesson as a template from the lesson view.
                    </p>
                    <div className="flex gap-2">
                      <CreateTemplateDialog onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/templates/public"] });
                      }} />
                      <Link href="/lesson-generator">
                        <Button variant="outline">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Lesson
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "flex flex-col gap-3"
                }>
                  {filteredMyTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onUse={() => handleUseTemplate(template)}
                      onDelete={() => deleteTemplateMutation.mutate(template.id)}
                      isOwner={true}
                      isLoading={usingTemplateId === template.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="community" className="mt-6">
              {publicTemplatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredPublicTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Globe className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No community templates yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Be the first to share a template with the community! Make your templates public to appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "flex flex-col gap-3"
                }>
                  {filteredPublicTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onUse={() => handleUseTemplate(template)}
                      isOwner={template.userId === user?.id}
                      isLoading={usingTemplateId === template.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this lesson from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {shareLesson && (
        <ShareDialog
          open={!!shareLesson}
          onOpenChange={(open) => !open && setShareLesson(null)}
          lessonId={shareLesson.id}
          lessonTitle={shareLesson.title}
        />
      )}

      <Dialog open={!!templateLesson} onOpenChange={(open) => {
        if (!open) {
          setTemplateLesson(null);
          setTemplateTitle("");
          setTemplateDescription("");
          setTemplateVisibility("private");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-oswald text-xl flex items-center gap-2">
              <Library className="h-5 w-5 text-lys-teal" />
              Save as Template
            </DialogTitle>
            <DialogDescription>
              Create a reusable template from this lesson. Templates help you quickly create new lessons with the same structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="save-template-title">Template Title</Label>
              <Input
                id="save-template-title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Enter template title"
                data-testid="input-save-template-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="save-template-description">Description (optional)</Label>
              <Input
                id="save-template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for"
                data-testid="input-save-template-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={templateVisibility} onValueChange={(v) => setTemplateVisibility(v as "private" | "public")}>
                <SelectTrigger data-testid="select-save-template-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private - Only you can see</SelectItem>
                  <SelectItem value="public">Public - Share with community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" data-testid="button-cancel-save-template">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (templateLesson) {
                  saveTemplateMutation.mutate({
                    lessonId: templateLesson.id,
                    title: templateTitle,
                    description: templateDescription,
                    visibility: templateVisibility
                  });
                }
              }}
              disabled={!templateTitle || saveTemplateMutation.isPending}
              data-testid="button-confirm-save-template"
            >
              {saveTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Library className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UseTemplateDialog
        template={selectedTemplate}
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
        onUse={(customizations) => {
          if (selectedTemplate) {
            useTemplateMutation.mutate({ templateId: selectedTemplate.id, customizations });
          }
        }}
      />
    </div>
  );
}
