import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, BookOpen, Users, TrendingUp, CheckCircle, AlertTriangle, FileText, Award } from "lucide-react";

interface ObjectiveCoverage {
  objectiveIndex: number;
  objectiveText: string;
  questionCount: number;
  coveragePercentage: number;
  bkdFocus: string;
  assessmentTypes: string[];
}

interface AlignmentData {
  lessonId: string;
  lessonTitle: string;
  totalObjectives: number;
  coveredObjectives: number;
  averageCoverage: number;
  bkdDistribution: { be: number; know: number; do: number };
  objectives: ObjectiveCoverage[];
  missingCoverage: string[];
}

export default function AlignmentDashboard() {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");

  const { data: lessons, isLoading: lessonsLoading } = useQuery<any[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: alignmentData, isLoading: alignmentLoading } = useQuery<AlignmentData>({
    queryKey: ["/api/alignment", selectedLesson],
    enabled: !!selectedLesson,
  });

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getCoverageBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  const getBkdIcon = (focus: string) => {
    switch (focus) {
      case "be": return <Users className="h-4 w-4" />;
      case "know": return <BookOpen className="h-4 w-4" />;
      case "do": return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (lessonsLoading) {
    return (
      <div className="container mx-auto p-6" data-testid="alignment-dashboard-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="alignment-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alignment Dashboard</h1>
          <p className="text-muted-foreground">
            Track how well your assignments cover lesson objectives
          </p>
        </div>
        <Select
          value={selectedLesson || ""}
          onValueChange={(value) => setSelectedLesson(value)}
        >
          <SelectTrigger className="w-[300px]" data-testid="select-lesson-trigger">
            <SelectValue placeholder="Select a lesson" />
          </SelectTrigger>
          <SelectContent>
            {lessons?.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id} data-testid={`select-lesson-${lesson.id}`}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "overview" | "detailed")}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed" data-testid="tab-detailed">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-testid="card-total-objectives">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alignmentData?.totalObjectives || 0}</div>
                <p className="text-xs text-muted-foreground">Learning objectives defined</p>
              </CardContent>
            </Card>

            <Card data-testid="card-covered-objectives">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Covered</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alignmentData?.coveredObjectives || 0}</div>
                <p className="text-xs text-muted-foreground">Objectives with assessment questions</p>
              </CardContent>
            </Card>

            <Card data-testid="card-average-coverage">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Coverage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alignmentData?.averageCoverage || 0}%</div>
                <Progress value={alignmentData?.averageCoverage || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card data-testid="card-bkd-balance">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BKD Balance</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    BE: {alignmentData?.bkdDistribution?.be || 0}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    KNOW: {alignmentData?.bkdDistribution?.know || 0}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    DO: {alignmentData?.bkdDistribution?.do || 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {alignmentData?.missingCoverage && alignmentData.missingCoverage.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800" data-testid="card-missing-coverage">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Missing Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  The following objectives need more assessment questions:
                </p>
                <ul className="space-y-2">
                  {alignmentData.missingCoverage.map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500">•</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {!selectedLesson && (
            <Card data-testid="card-no-lesson-selected">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Select a Lesson</p>
                <p className="text-sm text-muted-foreground">
                  Choose a lesson to view its alignment analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {alignmentData?.objectives?.map((obj, idx) => (
            <Card key={idx} data-testid={`objective-card-${idx}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBkdIcon(obj.bkdFocus)}
                    <CardTitle className="text-base">Objective {obj.objectiveIndex + 1}</CardTitle>
                    <Badge variant={getCoverageBadgeVariant(obj.coveragePercentage)}>
                      {obj.coveragePercentage}% covered
                    </Badge>
                  </div>
                  <Badge variant="outline" className="uppercase">
                    {obj.bkdFocus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{obj.objectiveText}</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress 
                      value={obj.coveragePercentage} 
                      className={getCoverageColor(obj.coveragePercentage)}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {obj.questionCount} question{obj.questionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {obj.assessmentTypes.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {obj.assessmentTypes.map((type, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!selectedLesson && (
            <Card data-testid="card-detailed-no-lesson">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Lesson Selected</p>
                <p className="text-sm text-muted-foreground">
                  Select a lesson from the dropdown to see detailed objective coverage
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
