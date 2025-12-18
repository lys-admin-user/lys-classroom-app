import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Trash2, Clock, Target, GraduationCap, Heart, Compass, Lightbulb, AlertCircle, Share2, Link2, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson } from "@shared/schema";
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

const bkdConfig = {
  be: { label: "BE", icon: Heart, color: "bg-lys-red/10 text-lys-red border-lys-red/20" },
  know: { label: "KNOW", icon: Compass, color: "bg-lys-yellow/10 text-lys-yellow border-lys-yellow/20" },
  do: { label: "DO", icon: Lightbulb, color: "bg-lys-teal/10 text-lys-teal border-lys-teal/20" },
};

export default function MyLessons() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareLesson, setShareLesson] = useState<{ id: string; title: string } | null>(null);

  const { data: lessons = [], isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
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
            <CardTitle className="font-marker text-2xl">Sign In Required</CardTitle>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-marker text-3xl md:text-4xl text-foreground mb-2" data-testid="text-page-title">
          My Lesson Library
        </h1>
        <p className="font-roboto text-muted-foreground">
          All your saved lesson plans in one place. Ready to inspire your students!
        </p>
      </div>

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
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => {
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
    </div>
  );
}
