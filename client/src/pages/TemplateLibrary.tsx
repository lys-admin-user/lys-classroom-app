import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Library, 
  Search, 
  Plus, 
  Clock, 
  Users, 
  BookOpen, 
  Target, 
  Heart, 
  Compass, 
  Sparkles,
  Copy,
  Trash2,
  Edit,
  Globe,
  Lock,
  Loader2,
  GraduationCap,
  Zap,
  Filter,
  LayoutGrid,
  List,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import type { LessonTemplate } from "@shared/schema";

export const templateCategories = [
  "All",
  "General",
  "STEM",
  "Language Arts",
  "Social Studies",
  "Arts",
  "Physical Education",
  "Life Skills"
];

export const templateGradeLevels = [
  "All Grades",
  "Elementary (K-2)",
  "Elementary (3-5)",
  "Middle School (6-8)",
  "High School (9-10)",
  "High School (11-12)"
];

const bkdLabels = {
  be: { label: "BE", color: "bg-lys-yellow text-lys-yellow-foreground", icon: Heart, description: "Identity & Purpose" },
  know: { label: "KNOW", color: "bg-lys-teal text-white", icon: Compass, description: "Strategy & Resources" },
  do: { label: "DO", color: "bg-lys-red text-white", icon: Target, description: "Action & Application" }
};

export function TemplateCard({ 
  template, 
  onUse, 
  onDelete, 
  isOwner,
  isLoading 
}: { 
  template: LessonTemplate; 
  onUse: () => void; 
  onDelete?: () => void;
  isOwner: boolean;
  isLoading: boolean;
}) {
  const bkd = bkdLabels[template.bkdFocus as keyof typeof bkdLabels] || bkdLabels.be;
  const BkdIcon = bkd.icon;

  return (
    <Card className="group hover-elevate" data-testid={`card-template-${template.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-oswald line-clamp-1">
              {template.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {template.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge className={bkd.color}>
            <BkdIcon className="w-3 h-3 mr-1" />
            {bkd.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {template.gradeLevel && (
            <Badge variant="outline" className="gap-1">
              <GraduationCap className="w-3 h-3" />
              {template.gradeLevel}
            </Badge>
          )}
          {template.duration && (
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {template.duration}
            </Badge>
          )}
          {template.subject && (
            <Badge variant="outline" className="gap-1">
              <BookOpen className="w-3 h-3" />
              {template.subject}
            </Badge>
          )}
        </div>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {template.visibility === "public" ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            <span>{template.visibility === "public" ? "Public" : "Private"}</span>
            {template.useCount && template.useCount > 0 && (
              <>
                <span className="mx-1">•</span>
                <Users className="w-3 h-3" />
                <span>{template.useCount} uses</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isOwner && onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                data-testid={`button-delete-template-${template.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={onUse}
              disabled={isLoading}
              data-testid={`button-use-template-${template.id}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              Use Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CreateTemplateDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [bkdFocus, setBkdFocus] = useState<"be" | "know" | "do">("be");
  const [duration, setDuration] = useState("45 minutes");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  const createMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/templates", {
        title,
        description,
        category,
        gradeLevel,
        subject: subject || null,
        bkdFocus,
        duration,
        objectives: [],
        activities: [],
        materials: [],
        assessmentTemplate: "",
        tags: [],
        visibility
      });
    },
    onSuccess: () => {
      toast({ title: "Template created!", description: "Your new template is ready to customize." });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setOpen(false);
      onCreated();
      setTitle("");
      setDescription("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-template">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl">Create New Template</DialogTitle>
          <DialogDescription>
            Start with a blank template or save an existing lesson as a template from the lesson view.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Template Title</Label>
            <Input
              id="title"
              placeholder="e.g., Interactive Science Experiment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-template-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of this template"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-template-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateCategories.filter(c => c !== "All").map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger data-testid="select-template-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {templateGradeLevels.filter(g => g !== "All Grades").map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Be-Know-Do Focus</Label>
              <Select value={bkdFocus} onValueChange={(v) => setBkdFocus(v as "be" | "know" | "do")}>
                <SelectTrigger data-testid="select-template-bkd">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="be">BE - Identity</SelectItem>
                  <SelectItem value="know">KNOW - Strategy</SelectItem>
                  <SelectItem value="do">DO - Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger data-testid="select-template-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="45 minutes">45 minutes</SelectItem>
                  <SelectItem value="60 minutes">60 minutes</SelectItem>
                  <SelectItem value="90 minutes">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as "private" | "public")}>
              <SelectTrigger data-testid="select-template-visibility">
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
            <Button variant="outline" data-testid="button-cancel-create-template">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={!title || !gradeLevel || createMutation.isPending}
            data-testid="button-submit-create-template"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UseTemplateDialog({ 
  template, 
  open, 
  onOpenChange,
  onUse 
}: { 
  template: LessonTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (customizations: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-lys-yellow" />
            Create Lesson from Template
          </DialogTitle>
          <DialogDescription>
            Customize your lesson before creating it from the "{template.title}" template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Template Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Grade Level:</span>
              <span>{template.gradeLevel}</span>
              <span className="text-muted-foreground">Duration:</span>
              <span>{template.duration}</span>
              <span className="text-muted-foreground">Focus:</span>
              <span className="capitalize">{template.bkdFocus}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title</Label>
            <Input
              id="lesson-title"
              placeholder={template.title}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-lesson-title"
            />
            <p className="text-xs text-muted-foreground">Leave blank to use template title</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-topic">Topic (optional)</Label>
            <Input
              id="lesson-topic"
              placeholder="Specific topic for this lesson"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              data-testid="input-lesson-topic"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" data-testid="button-cancel-use-template">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={() => onUse({ title: title || undefined, topic: topic || undefined })}
            data-testid="button-confirm-use-template"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplateLibrary() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("my-templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);

  const { data: myTemplates = [], isLoading: myLoading } = useQuery<LessonTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: publicTemplates = [], isLoading: publicLoading } = useQuery<LessonTemplate[]>({
    queryKey: ["/api/templates/public"],
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
      setUseDialogOpen(false);
      setSelectedTemplate(null);
      setUsingTemplateId(null);
      setLocation("/lesson-generator");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create lesson from template", variant: "destructive" });
      setUsingTemplateId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
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
      const matchesSearch = !searchQuery || 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      const matchesGrade = selectedGrade === "All Grades" || t.gradeLevel === selectedGrade;
      return matchesSearch && matchesCategory && matchesGrade;
    });
  };

  const filteredMyTemplates = filterTemplates(myTemplates);
  const filteredPublicTemplates = filterTemplates(publicTemplates);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-lys-red/10">
                <Library className="h-6 w-6 text-lys-red" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-oswald tracking-tight" data-testid="text-page-title">
                  Template Library
                </h1>
                <p className="text-muted-foreground font-roboto">
                  One-click lesson creation from reusable templates
                </p>
              </div>
            </div>
            <CreateTemplateDialog onCreated={() => {}} />
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              {myLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredMyTemplates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Library className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Create your first template or save an existing lesson as a template from the lesson generator.
                    </p>
                    <div className="flex gap-2">
                      <CreateTemplateDialog onCreated={() => {}} />
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
                      onDelete={() => deleteMutation.mutate(template.id)}
                      isOwner={true}
                      isLoading={usingTemplateId === template.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="community" className="mt-6">
              {publicLoading ? (
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

          <Card className="bg-gradient-to-r from-lys-red/10 to-lys-yellow/10 border-none">
            <CardContent className="flex items-center justify-between p-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-lys-red/20">
                  <Sparkles className="w-6 h-6 text-lys-red" />
                </div>
                <div>
                  <h3 className="font-oswald text-lg">Need a custom lesson?</h3>
                  <p className="text-sm text-muted-foreground">
                    Use our AI-powered lesson generator to create a personalized lesson plan
                  </p>
                </div>
              </div>
              <Link href="/lesson-generator">
                <Button data-testid="link-lesson-generator">
                  Generate with AI
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

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
