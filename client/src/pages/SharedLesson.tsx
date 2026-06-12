import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useSearch, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Heart, Compass, Target, Lightbulb, GraduationCap, Play, UserCheck, Printer, ArrowLeft } from "lucide-react";
import type { Lesson } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function SharedLesson() {
  const [, params] = useRoute("/shared/:shareId");
  const shareId = params?.shareId;
  const search = useSearch();
  const trackedRef = useRef(false);

  const { data: lesson, isLoading, error } = useQuery<Lesson>({
    queryKey: ["/api/shared", shareId],
    enabled: !!shareId,
  });

  useEffect(() => {
    if (shareId && lesson && !trackedRef.current) {
      trackedRef.current = true;
      
      const searchParams = new URLSearchParams(search);
      const referralCode = searchParams.get("ref");
      const channel = searchParams.get("utm_source") || "direct";
      
      const visitorId = localStorage.getItem("lys_visitor_id") || `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (!localStorage.getItem("lys_visitor_id")) {
        localStorage.setItem("lys_visitor_id", visitorId);
      }
      
      apiRequest("POST", "/api/referral/track", {
        shareId,
        referralCode,
        eventType: "view",
        channel,
        visitorId,
      }).catch(() => {
      });
    }
  }, [shareId, lesson, search]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-3/4 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-lg mt-8"></div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-oswald text-xl mb-2">Lesson Not Found</h2>
            <p className="font-roboto text-muted-foreground mb-6">
              This shared lesson link may have expired or been removed by its owner.
            </p>
            <Link href="/">
              <Button className="font-roboto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parsedStandards = lesson.standards ? JSON.parse(lesson.standards) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6 no-print">
        <Link href="/">
          <Button variant="ghost" className="gap-2 font-roboto" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to LYS
          </Button>
        </Link>
        <Button variant="outline" onClick={() => window.print()} className="gap-2 font-roboto" data-testid="button-print-shared">
          <Printer className="h-4 w-4" />
          Print Lesson
        </Button>
      </div>

      <Card className="print-content">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="font-oswald font-semibold tracking-tight text-2xl">{lesson.title}</CardTitle>
              <CardDescription className="font-roboto mt-1">{lesson.topic}</CardDescription>
            </div>
            <Badge variant="outline" className="font-roboto">
              Shared Lesson
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-roboto mt-4">
            <div><span className="text-muted-foreground">Grade:</span> {lesson.gradeLevel}</div>
            <div><span className="text-muted-foreground">Duration:</span> {lesson.duration}</div>
            <div><span className="text-muted-foreground">Focus:</span> {lesson.bkdFocus.toUpperCase()}</div>
          </div>
          {parsedStandards && (
            <div className="mt-4 p-3 bg-lys-teal/5 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-lys-teal" />
                <span className="font-oswald text-sm font-semibold">{parsedStandards.standardsName}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {parsedStandards.codes?.map((code: { code: string }) => (
                  <Badge key={code.code} variant="outline" className="font-roboto text-xs">
                    {code.code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-lys-red" />
              Learning Objectives
            </h3>
            <ul className="space-y-2">
              {(lesson.objectives as string[])?.map((obj, i) => (
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

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-oswald text-lg font-semibold mb-3">Materials & Resources</h3>
              <ul className="space-y-1">
                {(lesson.materials as string[])?.map((material, i) => (
                  <li key={i} className="flex items-center gap-2 font-roboto text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-lys-yellow"></div>
                    {material}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-oswald text-lg font-semibold mb-3">Assessment</h3>
              <p className="font-roboto text-sm text-muted-foreground">{lesson.assessment}</p>
            </div>
          </div>

          {(lesson.activities as any[])?.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5 text-lys-teal" />
                  Activities
                </h3>
                <div className="space-y-4">
                  {(lesson.activities as { title: string; description: string; duration: string; type: string }[])?.map((activity, i) => (
                    <div key={i} className="p-4 rounded-md bg-muted/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-oswald font-semibold text-sm">{activity.title}</h4>
                        <Badge variant="secondary" className="font-roboto text-xs">{activity.duration}</Badge>
                      </div>
                      <p className="font-roboto text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {lesson.reflection && (
            <>
              <Separator />
              <div className="p-4 rounded-md bg-lys-yellow/10 border border-lys-yellow/20">
                <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-lys-yellow" />
                  Reflection
                </h3>
                <p className="font-roboto text-sm text-muted-foreground">{lesson.reflection}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="text-center text-sm text-muted-foreground font-roboto pt-4">
            <p>Shared via <span className="font-marker text-lys-red">LYS</span> - Laddering Your Success</p>
            <p className="text-xs mt-1">The Be-Know-Do methodology for student success</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
