import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { BookOpen, Plus, Edit2, Eye, Clock, Check, X, Send, Trash2, Loader2, GraduationCap, FileText, Save } from "lucide-react";
import type { SystemLessonAuthor, MasterLesson } from "@shared/schema";
import { RubricReference, RubricQuickTips } from "@/components/RubricReference";

export default function LessonAuthoringPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<MasterLesson | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    topic: "",
    gradeLevel: "",
    gradeBand: "",
    subject: "",
    objectives: "",
    activities: "",
    assessment: "",
    materials: "",
    duration: "",
    tags: "",
    bkdFocus: "integrated",
    reflection: "",
  });

  const { data: authorStatus, isLoading: profileLoading } = useQuery<{ isAuthor: boolean; author: SystemLessonAuthor | null }>({
    queryKey: ["/api/lesson-author/status"],
    enabled: !!user,
  });

  const { data: myLessons = [], isLoading: lessonsLoading } = useQuery<MasterLesson[]>({
    queryKey: ["/api/lesson-author/my-lessons"],
    enabled: !!authorStatus?.isAuthor,
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lesson: typeof newLesson) => {
      const response = await fetch("/api/lesson-author/master-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesson.title,
          description: lesson.description,
          topic: lesson.topic || lesson.title,
          gradeLevel: lesson.gradeLevel,
          gradeBand: lesson.gradeBand,
          subject: lesson.subject,
          objectives: lesson.objectives.split("\n").filter(o => o.trim()),
          activities: lesson.activities.split("\n").filter(a => a.trim()).map(a => ({
            title: a,
            description: a,
            duration: "15 min",
            type: "activity"
          })),
          assessment: lesson.assessment,
          materials: lesson.materials.split("\n").filter(m => m.trim()),
          duration: lesson.duration,
          tags: lesson.tags.split(",").map(t => t.trim()).filter(t => t),
          bkdFocus: lesson.bkdFocus,
          reflection: lesson.reflection,
        }),
      });
      if (!response.ok) throw new Error("Failed to create lesson");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lesson created", description: "Your lesson has been saved as a draft." });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-author/my-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-author/status"] });
      setIsCreateLessonOpen(false);
      resetLessonForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create lesson", description: error.message, variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...lesson }: { id: string } & typeof newLesson) => {
      const response = await fetch(`/api/lesson-author/master-lessons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesson.title,
          description: lesson.description,
          topic: lesson.topic || lesson.title,
          gradeLevel: lesson.gradeLevel,
          gradeBand: lesson.gradeBand,
          subject: lesson.subject,
          objectives: lesson.objectives.split("\n").filter(o => o.trim()),
          activities: lesson.activities.split("\n").filter(a => a.trim()).map(a => ({
            title: a,
            description: a,
            duration: "15 min",
            type: "activity"
          })),
          assessment: lesson.assessment,
          materials: lesson.materials.split("\n").filter(m => m.trim()),
          duration: lesson.duration,
          tags: lesson.tags.split(",").map(t => t.trim()).filter(t => t),
          bkdFocus: lesson.bkdFocus,
          reflection: lesson.reflection,
          status: "draft", // Reset to draft on edit
        }),
      });
      if (!response.ok) throw new Error("Failed to update lesson");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lesson updated", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-author/my-lessons"] });
      setEditingLesson(null);
      resetLessonForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update lesson", description: error.message, variant: "destructive" });
    },
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await fetch(`/api/lesson-author/master-lessons/${lessonId}/submit`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to submit lesson");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted for review", description: "Your lesson is now pending admin approval." });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-author/my-lessons"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await fetch(`/api/lesson-author/master-lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete lesson");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Lesson deleted", description: "Your lesson has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-author/my-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-author/status"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  const resetLessonForm = () => {
    setNewLesson({
      title: "",
      description: "",
      topic: "",
      gradeLevel: "",
      gradeBand: "",
      subject: "",
      objectives: "",
      activities: "",
      assessment: "",
      materials: "",
      duration: "",
      tags: "",
      bkdFocus: "integrated",
      reflection: "",
    });
  };

  const openEditDialog = (lesson: MasterLesson) => {
    setEditingLesson(lesson);
    const activitiesArray = Array.isArray(lesson.activities) 
      ? lesson.activities.map((a: any) => typeof a === 'string' ? a : a.title || a.description || '')
      : [];
    setNewLesson({
      title: lesson.title,
      description: lesson.description || "",
      topic: lesson.topic || "",
      gradeLevel: lesson.gradeLevel || "",
      gradeBand: lesson.gradeBand || "",
      subject: lesson.subject || "",
      objectives: Array.isArray(lesson.objectives) ? lesson.objectives.join("\n") : "",
      activities: activitiesArray.join("\n"),
      assessment: lesson.assessment || "",
      materials: Array.isArray(lesson.materials) ? lesson.materials.join("\n") : "",
      duration: lesson.duration || "",
      tags: Array.isArray(lesson.tags) ? lesson.tags.join(", ") : "",
      bkdFocus: lesson.bkdFocus || "integrated",
      reflection: lesson.reflection || "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" data-testid="badge-status-draft"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
      case "pending_review":
        return <Badge variant="outline" data-testid="badge-status-pending"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600" data-testid="badge-status-approved"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="badge-status-rejected"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-indicator">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authorStatus?.isAuthor || !authorStatus.author) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Lesson Authoring</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You are not currently authorized as a System Lesson Author.
          Contact a site administrator to request authorization.
        </p>
        <Button onClick={() => setLocation("/")} data-testid="button-go-home">
          Go Home
        </Button>
      </div>
    );
  }

  const authorProfile = authorStatus.author;
  const draftLessons = myLessons.filter(l => l.status === "draft");
  const pendingLessons = myLessons.filter(l => l.status === "pending_review");
  const approvedLessons = myLessons.filter(l => l.status === "approved");
  const rejectedLessons = myLessons.filter(l => l.status === "rejected");

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl" data-testid="lesson-authoring-page">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Lesson Authoring
            </h1>
            <p className="text-muted-foreground mt-1">
              Create master lessons that influence AI-generated content
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RubricReference />
            <Dialog open={isCreateLessonOpen} onOpenChange={setIsCreateLessonOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-lesson">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Lesson
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Master Lesson</DialogTitle>
                <DialogDescription>
                  Create a new lesson that can influence AI-generated content for educators.
                </DialogDescription>
              </DialogHeader>
              <LessonForm
                lesson={newLesson}
                setLesson={setNewLesson}
                onSubmit={() => createLessonMutation.mutate(newLesson)}
                isLoading={createLessonMutation.isPending}
                submitLabel="Create Lesson"
              />
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <RubricQuickTips />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Author Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{authorProfile.lessonsCreated || 0}</div>
                <div className="text-sm text-muted-foreground">Total Lessons</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{approvedLessons.length}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{pendingLessons.length}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
            </div>
            {authorProfile.specializations && authorProfile.specializations.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Specializations</div>
                <div className="flex flex-wrap gap-2">
                  {authorProfile.specializations.map((spec, idx) => (
                    <Badge key={idx} variant="outline">{spec}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-lessons">All ({myLessons.length})</TabsTrigger>
            <TabsTrigger value="drafts" data-testid="tab-drafts">Drafts ({draftLessons.length})</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingLessons.length})</TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">Approved ({approvedLessons.length})</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected ({rejectedLessons.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <LessonList
              lessons={myLessons}
              isLoading={lessonsLoading}
              getStatusBadge={getStatusBadge}
              onEdit={openEditDialog}
              onSubmit={(id) => submitForReviewMutation.mutate(id)}
              onDelete={(id) => deleteLessonMutation.mutate(id)}
              isSubmitting={submitForReviewMutation.isPending}
              isDeleting={deleteLessonMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="drafts">
            <LessonList
              lessons={draftLessons}
              isLoading={lessonsLoading}
              getStatusBadge={getStatusBadge}
              onEdit={openEditDialog}
              onSubmit={(id) => submitForReviewMutation.mutate(id)}
              onDelete={(id) => deleteLessonMutation.mutate(id)}
              isSubmitting={submitForReviewMutation.isPending}
              isDeleting={deleteLessonMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="pending">
            <LessonList
              lessons={pendingLessons}
              isLoading={lessonsLoading}
              getStatusBadge={getStatusBadge}
              onEdit={openEditDialog}
              onSubmit={(id) => submitForReviewMutation.mutate(id)}
              onDelete={(id) => deleteLessonMutation.mutate(id)}
              isSubmitting={submitForReviewMutation.isPending}
              isDeleting={deleteLessonMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="approved">
            <LessonList
              lessons={approvedLessons}
              isLoading={lessonsLoading}
              getStatusBadge={getStatusBadge}
              onEdit={openEditDialog}
              onSubmit={(id) => submitForReviewMutation.mutate(id)}
              onDelete={(id) => deleteLessonMutation.mutate(id)}
              isSubmitting={submitForReviewMutation.isPending}
              isDeleting={deleteLessonMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="rejected">
            <LessonList
              lessons={rejectedLessons}
              isLoading={lessonsLoading}
              getStatusBadge={getStatusBadge}
              onEdit={openEditDialog}
              onSubmit={(id) => submitForReviewMutation.mutate(id)}
              onDelete={(id) => deleteLessonMutation.mutate(id)}
              isSubmitting={submitForReviewMutation.isPending}
              isDeleting={deleteLessonMutation.isPending}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingLesson} onOpenChange={(open) => !open && setEditingLesson(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
              <DialogDescription>
                Update your lesson content. Changes will be saved as a draft.
              </DialogDescription>
            </DialogHeader>
            <LessonForm
              lesson={newLesson}
              setLesson={setNewLesson}
              onSubmit={() => editingLesson && updateLessonMutation.mutate({ id: editingLesson.id, ...newLesson })}
              isLoading={updateLessonMutation.isPending}
              submitLabel="Save Changes"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function LessonForm({
  lesson,
  setLesson,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  lesson: {
    title: string;
    description: string;
    topic: string;
    gradeLevel: string;
    gradeBand: string;
    subject: string;
    objectives: string;
    activities: string;
    assessment: string;
    materials: string;
    duration: string;
    tags: string;
    bkdFocus: string;
    reflection: string;
  };
  setLesson: (lesson: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={lesson.title}
            onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
            placeholder="Introduction to Fractions"
            data-testid="input-lesson-title"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="topic">Topic *</Label>
          <Input
            id="topic"
            value={lesson.topic}
            onChange={(e) => setLesson({ ...lesson, topic: e.target.value })}
            placeholder="Understanding Fractions"
            data-testid="input-lesson-topic"
          />
        </div>
        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Select value={lesson.subject} onValueChange={(v) => setLesson({ ...lesson, subject: v })}>
            <SelectTrigger data-testid="select-lesson-subject">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="math">Mathematics</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="english">English Language Arts</SelectItem>
              <SelectItem value="social_studies">Social Studies</SelectItem>
              <SelectItem value="history">History</SelectItem>
              <SelectItem value="art">Art</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="pe">Physical Education</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gradeLevel">Grade Level *</Label>
          <Select value={lesson.gradeLevel} onValueChange={(v) => setLesson({ ...lesson, gradeLevel: v })}>
            <SelectTrigger data-testid="select-lesson-grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="k">Kindergarten</SelectItem>
              <SelectItem value="1">1st Grade</SelectItem>
              <SelectItem value="2">2nd Grade</SelectItem>
              <SelectItem value="3">3rd Grade</SelectItem>
              <SelectItem value="4">4th Grade</SelectItem>
              <SelectItem value="5">5th Grade</SelectItem>
              <SelectItem value="6">6th Grade</SelectItem>
              <SelectItem value="7">7th Grade</SelectItem>
              <SelectItem value="8">8th Grade</SelectItem>
              <SelectItem value="9">9th Grade</SelectItem>
              <SelectItem value="10">10th Grade</SelectItem>
              <SelectItem value="11">11th Grade</SelectItem>
              <SelectItem value="12">12th Grade</SelectItem>
              <SelectItem value="higher_ed">Higher Education</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gradeBand">Grade Band</Label>
          <Select value={lesson.gradeBand} onValueChange={(v) => setLesson({ ...lesson, gradeBand: v })}>
            <SelectTrigger data-testid="select-lesson-grade-band">
              <SelectValue placeholder="Select grade band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="K-2">K-2</SelectItem>
              <SelectItem value="3-5">3-5</SelectItem>
              <SelectItem value="6-8">6-8</SelectItem>
              <SelectItem value="9-12">9-12</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bkdFocus">Be-Know-Do Focus</Label>
          <Select value={lesson.bkdFocus} onValueChange={(v) => setLesson({ ...lesson, bkdFocus: v })}>
            <SelectTrigger data-testid="select-lesson-bkd">
              <SelectValue placeholder="Select focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="be">Be (Identity)</SelectItem>
              <SelectItem value="know">Know (Knowledge)</SelectItem>
              <SelectItem value="do">Do (Skills)</SelectItem>
              <SelectItem value="integrated">Integrated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Duration *</Label>
          <Input
            id="duration"
            value={lesson.duration}
            onChange={(e) => setLesson({ ...lesson, duration: e.target.value })}
            placeholder="45 minutes"
            data-testid="input-lesson-duration"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={lesson.description}
            onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
            placeholder="A comprehensive lesson on understanding fractions..."
            rows={3}
            data-testid="textarea-lesson-description"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="objectives">Learning Objectives * (one per line)</Label>
          <Textarea
            id="objectives"
            value={lesson.objectives}
            onChange={(e) => setLesson({ ...lesson, objectives: e.target.value })}
            placeholder="Students will be able to identify fractions&#10;Students will understand numerator and denominator"
            rows={3}
            data-testid="textarea-lesson-objectives"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="activities">Activities (one per line)</Label>
          <Textarea
            id="activities"
            value={lesson.activities}
            onChange={(e) => setLesson({ ...lesson, activities: e.target.value })}
            placeholder="Fraction pizza activity&#10;Partner practice with manipulatives"
            rows={3}
            data-testid="textarea-lesson-activities"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="assessment">Assessment *</Label>
          <Textarea
            id="assessment"
            value={lesson.assessment}
            onChange={(e) => setLesson({ ...lesson, assessment: e.target.value })}
            placeholder="Exit ticket quiz, oral questioning during activities"
            rows={2}
            data-testid="textarea-lesson-assessment"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="materials">Materials Needed (one per line)</Label>
          <Textarea
            id="materials"
            value={lesson.materials}
            onChange={(e) => setLesson({ ...lesson, materials: e.target.value })}
            placeholder="Fraction circles&#10;Whiteboard markers"
            rows={3}
            data-testid="textarea-lesson-materials"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="reflection">Reflection</Label>
          <Textarea
            id="reflection"
            value={lesson.reflection}
            onChange={(e) => setLesson({ ...lesson, reflection: e.target.value })}
            placeholder="Questions for students to reflect on learning..."
            rows={2}
            data-testid="textarea-lesson-reflection"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            value={lesson.tags}
            onChange={(e) => setLesson({ ...lesson, tags: e.target.value })}
            placeholder="fractions, math, elementary, hands-on"
            data-testid="input-lesson-tags"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !lesson.title || !lesson.subject || !lesson.gradeLevel || !lesson.duration || !lesson.objectives || !lesson.assessment || !lesson.topic}
          data-testid="button-submit-lesson"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

function LessonList({
  lessons,
  isLoading,
  getStatusBadge,
  onEdit,
  onSubmit,
  onDelete,
  isSubmitting,
  isDeleting,
}: {
  lessons: MasterLesson[];
  isLoading: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  onEdit: (lesson: MasterLesson) => void;
  onSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No lessons found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {lessons.map((lesson) => (
        <Card key={lesson.id} data-testid={`card-lesson-${lesson.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                <CardDescription className="mt-1">
                  {lesson.subject && <span className="capitalize">{lesson.subject}</span>}
                  {lesson.subject && lesson.gradeLevel && " · "}
                  {lesson.gradeLevel && `Grade ${lesson.gradeLevel}`}
                  {lesson.duration && ` · ${lesson.duration}`}
                </CardDescription>
              </div>
              {getStatusBadge(lesson.status)}
            </div>
          </CardHeader>
          <CardContent>
            {lesson.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {lesson.description}
              </p>
            )}
            {lesson.tags && Array.isArray(lesson.tags) && lesson.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {lesson.tags.slice(0, 5).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
                {lesson.tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">+{lesson.tags.length - 5} more</Badge>
                )}
              </div>
            )}
            {lesson.reviewNotes && lesson.status === "rejected" && (
              <div className="p-3 bg-destructive/10 rounded-md text-sm">
                <strong>Review Notes:</strong> {lesson.reviewNotes}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 flex-wrap">
            {(lesson.status === "draft" || lesson.status === "rejected") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(lesson)}
                  data-testid={`button-edit-lesson-${lesson.id}`}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onSubmit(lesson.id)}
                  disabled={isSubmitting}
                  data-testid={`button-submit-lesson-${lesson.id}`}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Submit for Review
                </Button>
              </>
            )}
            {lesson.status === "pending_review" && (
              <Button variant="outline" size="sm" disabled>
                <Clock className="h-4 w-4 mr-1" />
                Awaiting Review
              </Button>
            )}
            {lesson.status === "approved" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{lesson.usageCount || 0} times used in AI generation</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={() => onDelete(lesson.id)}
              disabled={isDeleting || lesson.status === "approved"}
              data-testid={`button-delete-lesson-${lesson.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
