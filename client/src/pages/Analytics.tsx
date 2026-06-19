import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Target, 
  Award, 
  TrendingUp,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  BarChart3,
  Share2,
  Building2,
  GraduationCap,
  Trophy,
  ChevronLeft,
  ChevronRight,
  School,
  User,
  Database,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import type { Lesson, Goal } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

interface CampusAnalytics {
  totalEducators: number;
  totalStudents: number;
  totalLessons: number;
  totalGoals: number;
  lessonsThisWeek: number;
  lessonsLastWeek: number;
  goalsCompleted: number;
  goalsInProgress: number;
  standardsCoverage: Record<string, number>;
  bkdDistribution: { be: number; know: number; do: number };
  activityByWeek: Array<{ name: string; lessons: number; goals: number }>;
  topEducators: Array<{ id: string; name: string; lessonCount: number }>;
  organizations: Array<{ id: string; name: string; memberCount: number }>;
}

interface DistrictAnalytics {
  isDistrictAdmin: boolean;
  districts: Array<{ id: string; name: string; type: string }>;
  schools: Array<{ 
    id: string; 
    name: string; 
    districtId: string; 
    memberCount: number; 
    educatorCount: number; 
    studentCount: number; 
    lessonCount: number; 
    goalCount: number 
  }>;
  totalSchools: number;
  totalEducators: number;
  totalStudents: number;
  totalLessons: number;
  totalGoals: number;
}

interface SchoolAnalytics {
  school: { id: string; name: string; type: string };
  totalMembers: number;
  totalEducators: number;
  totalStudents: number;
  totalLessons: number;
  totalGoals: number;
  goalsCompleted: number;
  goalsInProgress: number;
  teachers: Array<{
    id: string;
    name: string;
    email: string | null;
    role: string;
    lessonCount: number;
    goalCount: number;
    lessonsThisWeek: number;
  }>;
  bkdDistribution: { be: number; know: number; do: number };
  standardsCoverage: Record<string, number>;
}

interface TeacherAnalytics {
  teacher: { id: string; name: string; email: string | null; role: string };
  totalLessons: number;
  totalGoals: number;
  lessonsThisWeek: number;
  lessonsLastWeek: number;
  goalsCompleted: number;
  goalsInProgress: number;
  lessonBkdDistribution: { be: number; know: number; do: number };
  standardsCoverage: Record<string, number>;
  recentLessons: Array<{
    id: string;
    title: string;
    topic: string;
    gradeLevel: string;
    bkdFocus: string;
    createdAt: string | null;
  }>;
}

type DrillDownView = 
  | { type: "none" }
  | { type: "school"; schoolId: string }
  | { type: "teacher"; teacherId: string; schoolName?: string };

export default function Analytics() {
  const { user } = useAuth();
  const isCampusAdmin = user?.role === "campus_admin";
  const [drillDown, setDrillDown] = useState<DrillDownView>({ type: "none" });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: campusData, isLoading: campusLoading } = useQuery<CampusAnalytics>({
    queryKey: ["/api/campus-analytics"],
    enabled: isCampusAdmin,
  });

  const { data: districtData, isLoading: districtLoading } = useQuery<DistrictAnalytics>({
    queryKey: ["/api/district-analytics"],
    enabled: isCampusAdmin,
  });

  const { data: schoolData, isLoading: schoolLoading } = useQuery<SchoolAnalytics>({
    queryKey: ["/api/analytics/school", drillDown.type === "school" ? drillDown.schoolId : null],
    enabled: drillDown.type === "school",
  });

  const { data: teacherData, isLoading: teacherLoading } = useQuery<TeacherAnalytics>({
    queryKey: ["/api/analytics/teacher", drillDown.type === "teacher" ? drillDown.teacherId : null],
    enabled: drillDown.type === "teacher",
  });

  const isLoading = lessonsLoading || goalsLoading || (isCampusAdmin && (campusLoading || districtLoading));

  const totalLessons = lessons.length;
  const sharedLessons = lessons.filter((l) => l.shareId).length;
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const inProgressGoals = goals.filter((g) => g.status === "in_progress").length;
  const totalMilestones = goals.reduce((sum, g) => sum + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce(
    (sum, g) => sum + (g.milestones?.filter((m) => m.completed).length || 0), 
    0
  );
  const overallProgress = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  const standardsCoverage = lessons.reduce((acc: Record<string, number>, lesson) => {
    const standardStr = lesson.standards || "";
    const standardsList = standardStr.split(",").map((s: string) => s.trim()).filter((s: string) => s);
    standardsList.forEach((standard: string) => {
      const prefix = standard.split(".")[0] || standard.substring(0, 3);
      acc[prefix] = (acc[prefix] || 0) + 1;
    });
    return acc;
  }, {});

  const standardsChartData = Object.entries(standardsCoverage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const goalsByCategory = goals.reduce((acc: Record<string, number>, goal) => {
    acc[goal.category] = (acc[goal.category] || 0) + 1;
    return acc;
  }, {});

  const categoryPieData = Object.entries(goalsByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ["#EE4E23", "#F8D842", "#016371", "#3B82F6", "#EC4899", "#22C55E"];

  const bkdDistribution = goals.reduce((acc: Record<string, number>, goal) => {
    const pillar = goal.bkdPillar || "do";
    acc[pillar] = (acc[pillar] || 0) + 1;
    return acc;
  }, {});

  const bkdPieData = [
    { name: "BE (Identity)", value: bkdDistribution["be"] || 0, color: "#F8D842" },
    { name: "KNOW (Strategy)", value: bkdDistribution["know"] || 0, color: "#EE4E23" },
    { name: "DO (Action)", value: bkdDistribution["do"] || 0, color: "#016371" },
  ].filter((d) => d.value > 0);

  const getWeekLabel = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return "This Week";
    if (diffDays < 14) return "Last Week";
    if (diffDays < 21) return "2 Weeks Ago";
    return "3+ Weeks Ago";
  };

  const activityByWeek: Record<string, { lessons: number; goals: number }> = {
    "This Week": { lessons: 0, goals: 0 },
    "Last Week": { lessons: 0, goals: 0 },
    "2 Weeks Ago": { lessons: 0, goals: 0 },
    "3+ Weeks Ago": { lessons: 0, goals: 0 },
  };

  lessons.forEach((lesson) => {
    if (lesson.createdAt) {
      const week = getWeekLabel(new Date(lesson.createdAt));
      activityByWeek[week].lessons++;
    }
  });

  goals.forEach((goal) => {
    if (goal.createdAt) {
      const week = getWeekLabel(new Date(goal.createdAt));
      activityByWeek[week].goals++;
    }
  });

  const activityData = [
    { name: "3+ Weeks", lessons: activityByWeek["3+ Weeks Ago"].lessons, goals: activityByWeek["3+ Weeks Ago"].goals },
    { name: "2 Weeks", lessons: activityByWeek["2 Weeks Ago"].lessons, goals: activityByWeek["2 Weeks Ago"].goals },
    { name: "Last Week", lessons: activityByWeek["Last Week"].lessons, goals: activityByWeek["Last Week"].goals },
    { name: "This Week", lessons: activityByWeek["This Week"].lessons, goals: activityByWeek["This Week"].goals },
  ];

  // Handle school drill-down
  const handleSchoolClick = (schoolId: string) => {
    setDrillDown({ type: "school", schoolId });
  };

  // Handle teacher drill-down
  const handleTeacherClick = (teacherId: string, schoolName?: string) => {
    setDrillDown({ type: "teacher", teacherId, schoolName });
  };

  // Handle back navigation
  const handleBack = () => {
    if (drillDown.type === "teacher" && drillDown.schoolName) {
      // Go back to school view - need to find school ID
      const school = districtData?.schools.find(s => s.name === drillDown.schoolName);
      if (school) {
        setDrillDown({ type: "school", schoolId: school.id });
      } else {
        setDrillDown({ type: "none" });
      }
    } else {
      setDrillDown({ type: "none" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  // Drill-down views
  if (drillDown.type === "school" && schoolData) {
    return (
      <SchoolDrillDownView 
        data={schoolData} 
        isLoading={schoolLoading}
        onBack={handleBack}
        onTeacherClick={handleTeacherClick}
      />
    );
  }

  if (drillDown.type === "teacher" && teacherData) {
    return (
      <TeacherDrillDownView 
        data={teacherData} 
        isLoading={teacherLoading}
        onBack={handleBack}
      />
    );
  }

  // Campus Standards Chart Data
  const campusStandardsData = campusData?.standardsCoverage 
    ? Object.entries(campusData.standardsCoverage)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : [];

  // Campus BKD Pie Data
  const campusBkdPieData = campusData ? [
    { name: "BE (Identity)", value: campusData.bkdDistribution.be, color: "#F8D842" },
    { name: "KNOW (Strategy)", value: campusData.bkdDistribution.know, color: "#EE4E23" },
    { name: "DO (Action)", value: campusData.bkdDistribution.do, color: "#016371" },
  ].filter((d) => d.value > 0) : [];

  const isDistrictAdmin = districtData?.isDistrictAdmin ?? false;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-permanent-marker text-2xl sm:text-3xl text-lys-red mb-2" data-testid="text-analytics-title">
            {isCampusAdmin ? (isDistrictAdmin ? "District Analytics" : "Campus Analytics") : "Your Analytics"}
          </h1>
          <p className="font-roboto text-muted-foreground">
            {isCampusAdmin 
              ? (isDistrictAdmin 
                  ? "District-wide insights with drill-down to schools and teachers" 
                  : "Organization-wide insights and educator performance")
              : "Track your progress and see how you're making an impact"}
          </p>
        </div>

        {isCampusAdmin && (campusData || districtData) ? (
          <Tabs defaultValue={isDistrictAdmin ? "district" : "campus"} className="w-full">
            <TabsList className={`grid w-full ${isDistrictAdmin ? 'grid-cols-3' : 'grid-cols-2'} max-w-lg`}>
              {isDistrictAdmin && (
                <TabsTrigger value="district" className="gap-2" data-testid="tab-district-analytics">
                  <Building2 className="h-4 w-4" />
                  District
                </TabsTrigger>
              )}
              <TabsTrigger value="campus" className="gap-2" data-testid="tab-campus-analytics">
                <School className="h-4 w-4" />
                Campus
              </TabsTrigger>
              <TabsTrigger value="personal" className="gap-2" data-testid="tab-personal-analytics">
                <User className="h-4 w-4" />
                My Activity
              </TabsTrigger>
            </TabsList>

            {isDistrictAdmin && districtData && (
              <TabsContent value="district" className="space-y-6 mt-6">
                <DistrictOverview 
                  data={districtData} 
                  onSchoolClick={handleSchoolClick}
                />
              </TabsContent>
            )}

            <TabsContent value="campus" className="space-y-6 mt-6">
              {campusData && (
                <CampusOverview 
                  data={campusData}
                  campusStandardsData={campusStandardsData}
                  campusBkdPieData={campusBkdPieData}
                  onTeacherClick={handleTeacherClick}
                />
              )}
            </TabsContent>

            <TabsContent value="personal" className="space-y-6 mt-6">
              <PersonalAnalytics 
                totalLessons={totalLessons}
                sharedLessons={sharedLessons}
                inProgressGoals={inProgressGoals}
                completedGoals={completedGoals}
                overallProgress={overallProgress}
                totalMilestones={totalMilestones}
                completedMilestones={completedMilestones}
                standardsChartData={standardsChartData}
                bkdPieData={bkdPieData}
                categoryPieData={categoryPieData}
                activityData={activityData}
                standardsCoverage={standardsCoverage}
                totalGoals={totalGoals}
                COLORS={COLORS}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <PersonalAnalytics 
            totalLessons={totalLessons}
            sharedLessons={sharedLessons}
            inProgressGoals={inProgressGoals}
            completedGoals={completedGoals}
            overallProgress={overallProgress}
            totalMilestones={totalMilestones}
            completedMilestones={completedMilestones}
            standardsChartData={standardsChartData}
            bkdPieData={bkdPieData}
            categoryPieData={categoryPieData}
            activityData={activityData}
            standardsCoverage={standardsCoverage}
            totalGoals={totalGoals}
            COLORS={COLORS}
          />
        )}
      </div>
    </div>
  );
}

// District Overview Component
interface DistrictOverviewProps {
  data: DistrictAnalytics;
  onSchoolClick: (schoolId: string) => void;
}

function DistrictOverview({ data, onSchoolClick }: DistrictOverviewProps) {
  return (
    <>
      {/* District Summary Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
                <School className="h-6 w-6 text-lys-teal" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Schools</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-district-schools">{data.totalSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-lys-red" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Educators</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-district-educators">{data.totalEducators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-lys-yellow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Students</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-district-students">{data.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-teal-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Lessons</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-district-lessons">{data.totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-green-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Goals</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-district-goals">{data.totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Districts */}
      {data.districts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Building2 className="h-5 w-5 text-lys-teal" />
              Your Districts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {data.districts.map((district) => (
                <Badge key={district.id} variant="outline" className="px-4 py-2 font-roboto">
                  {district.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schools List with Drill-Down */}
      <Card>
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <School className="h-5 w-5 text-lys-red" />
            Schools in Your District
          </CardTitle>
          <CardDescription className="font-roboto">
            Click on a school to view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.schools.length > 0 ? (
            <div className="space-y-3">
              {data.schools.map((school) => (
                <div 
                  key={school.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border bg-muted/20 hover-elevate cursor-pointer"
                  onClick={() => onSchoolClick(school.id)}
                  data-testid={`school-card-${school.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-lys-teal/10 flex items-center justify-center shrink-0">
                      <School className="h-5 w-5 text-lys-teal" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-oswald font-semibold truncate">{school.name}</p>
                      <p className="text-sm text-muted-foreground font-roboto">
                        {school.educatorCount} educator{school.educatorCount !== 1 ? 's' : ''} | {school.studentCount} student{school.studentCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-oswald font-bold text-lys-red">{school.lessonCount}</p>
                      <p className="text-xs text-muted-foreground font-roboto">Lessons</p>
                    </div>
                    <div className="text-right">
                      <p className="font-oswald font-bold text-lys-teal">{school.goalCount}</p>
                      <p className="text-xs text-muted-foreground font-roboto">Goals</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground font-roboto">
              <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No schools found in your district</p>
              <p className="text-sm">Schools need to be added as child organizations of your district</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// School Drill-Down View
interface SchoolDrillDownViewProps {
  data: SchoolAnalytics;
  isLoading: boolean;
  onBack: () => void;
  onTeacherClick: (teacherId: string, schoolName?: string) => void;
}

function SchoolDrillDownView({ data, isLoading, onBack, onTeacherClick }: SchoolDrillDownViewProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bkdPieData = [
    { name: "BE (Identity)", value: data.bkdDistribution.be, color: "#F8D842" },
    { name: "KNOW (Strategy)", value: data.bkdDistribution.know, color: "#EE4E23" },
    { name: "DO (Action)", value: data.bkdDistribution.do, color: "#016371" },
  ].filter((d) => d.value > 0);

  const standardsChartData = Object.entries(data.standardsCoverage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-permanent-marker text-2xl sm:text-3xl text-lys-red" data-testid="text-school-name">
              {data.school.name}
            </h1>
            <p className="font-roboto text-muted-foreground">
              School Analytics - Click on a teacher to view their details
            </p>
          </div>
        </div>

        {/* School Summary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-lys-red" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Educators</p>
                  <p className="font-oswald text-2xl font-bold">{data.totalEducators}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-lys-yellow" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Students</p>
                  <p className="font-oswald text-2xl font-bold">{data.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-lys-teal" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Total Lessons</p>
                  <p className="font-oswald text-2xl font-bold">{data.totalLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-green-500/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Goals Completed</p>
                  <p className="font-oswald text-2xl font-bold">{data.goalsCompleted} / {data.totalGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Trophy className="h-5 w-5 text-lys-yellow" />
              Teachers at {data.school.name}
            </CardTitle>
            <CardDescription className="font-roboto">
              Click on a teacher to view their detailed analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.teachers.length > 0 ? (
              <div className="space-y-3">
                {data.teachers.map((teacher, index) => (
                  <div 
                    key={teacher.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border bg-muted/20 hover-elevate cursor-pointer"
                    onClick={() => onTeacherClick(teacher.id, data.school.name)}
                    data-testid={`teacher-card-${teacher.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-oswald font-bold text-sm ${
                        index === 0 ? 'bg-lys-yellow text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-oswald font-semibold">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground font-roboto">{teacher.email || "No email"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="font-oswald font-bold text-lys-red">{teacher.lessonCount}</p>
                        <p className="text-xs text-muted-foreground font-roboto">Lessons</p>
                      </div>
                      <div className="text-right">
                        <p className="font-oswald font-bold text-lys-teal">{teacher.goalCount}</p>
                        <p className="text-xs text-muted-foreground font-roboto">Goals</p>
                      </div>
                      <Badge variant="outline" className="font-roboto">
                        {teacher.lessonsThisWeek} this week
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground font-roboto">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No educators found at this school</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-lys-teal" />
                Standards Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {standardsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={standardsChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#016371" 
                      radius={[4, 4, 0, 0]}
                      name="Lessons"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p className="font-roboto text-center">No standards data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <Award className="h-5 w-5 text-lys-red" />
                Be-Know-Do Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bkdPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bkdPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bkdPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p className="font-roboto text-center">No lesson data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Teacher Drill-Down View
interface TeacherDrillDownViewProps {
  data: TeacherAnalytics;
  isLoading: boolean;
  onBack: () => void;
}

function TeacherDrillDownView({ data, isLoading, onBack }: TeacherDrillDownViewProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bkdPieData = [
    { name: "BE (Identity)", value: data.lessonBkdDistribution.be, color: "#F8D842" },
    { name: "KNOW (Strategy)", value: data.lessonBkdDistribution.know, color: "#EE4E23" },
    { name: "DO (Action)", value: data.lessonBkdDistribution.do, color: "#016371" },
  ].filter((d) => d.value > 0);

  const standardsChartData = Object.entries(data.standardsCoverage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-permanent-marker text-2xl sm:text-3xl text-lys-red" data-testid="text-teacher-name">
              {data.teacher.name}
            </h1>
            <p className="font-roboto text-muted-foreground">
              {data.teacher.email || "Teacher Analytics"}
            </p>
          </div>
        </div>

        {/* Teacher Summary Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-lys-red" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Total Lessons</p>
                  <p className="font-oswald text-2xl font-bold">{data.totalLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-lys-teal" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">This Week</p>
                  <p className="font-oswald text-2xl font-bold">{data.lessonsThisWeek}</p>
                  <p className={`text-xs ${data.lessonsThisWeek >= data.lessonsLastWeek ? 'text-green-600' : 'text-amber-600'}`}>
                    {data.lessonsThisWeek >= data.lessonsLastWeek ? '+' : ''}
                    {data.lessonsThisWeek - data.lessonsLastWeek} vs last week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-lys-yellow" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Total Goals</p>
                  <p className="font-oswald text-2xl font-bold">{data.totalGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-roboto">Goals Completed</p>
                  <p className="font-oswald text-2xl font-bold">{data.goalsCompleted} / {data.totalGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Clock className="h-5 w-5 text-lys-red" />
              Recent Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentLessons.length > 0 ? (
              <div className="space-y-3">
                {data.recentLessons.map((lesson) => (
                  <div 
                    key={lesson.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border bg-muted/20"
                  >
                    <div className="min-w-0">
                      <p className="font-oswald font-semibold truncate">{lesson.title}</p>
                      <p className="text-sm text-muted-foreground font-roboto">
                        {lesson.topic} | Grade {lesson.gradeLevel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge 
                        className={`font-roboto ${
                          lesson.bkdFocus === "be" ? "bg-lys-yellow/20 text-lys-yellow" :
                          lesson.bkdFocus === "know" ? "bg-lys-red/20 text-lys-red" :
                          "bg-lys-teal/20 text-lys-teal"
                        }`}
                      >
                        {lesson.bkdFocus.toUpperCase()}
                      </Badge>
                      {lesson.createdAt && (
                        <span className="text-sm text-muted-foreground font-roboto">
                          {new Date(lesson.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground font-roboto">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No lessons created yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-lys-teal" />
                Standards Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {standardsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={standardsChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#016371" 
                      radius={[4, 4, 0, 0]}
                      name="Lessons"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p className="font-roboto text-center">No standards data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <Award className="h-5 w-5 text-lys-red" />
                Be-Know-Do Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bkdPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bkdPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bkdPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p className="font-roboto text-center">No lesson data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Campus Overview Component
interface CampusOverviewProps {
  data: CampusAnalytics;
  campusStandardsData: Array<{ name: string; count: number }>;
  campusBkdPieData: Array<{ name: string; value: number; color: string }>;
  onTeacherClick: (teacherId: string) => void;
}

function CampusOverview({ data, campusStandardsData, campusBkdPieData, onTeacherClick }: CampusOverviewProps) {
  return (
    <>
      {/* Campus Summary Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-lys-teal" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Educators</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-campus-educators">{data.totalEducators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-lys-yellow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Students</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-campus-students">{data.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-lys-red" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Lessons</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-campus-lessons">{data.totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-green-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Goals</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-campus-goals">{data.totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SIS Integration Quick Access */}
      <Card className="bg-gradient-to-r from-lys-teal/5 to-lys-teal/10 border-lys-teal/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-teal/20 flex items-center justify-center">
                <Database className="h-6 w-6 text-lys-teal" />
              </div>
              <div>
                <p className="font-oswald text-lg font-semibold">SIS Integration</p>
                <p className="text-sm text-muted-foreground font-roboto">
                  Connect to Clever, PowerSchool, Canvas, and more to import student rosters and course data
                </p>
              </div>
            </div>
            <Link href="/sis-integration">
              <Button className="bg-lys-teal hover:bg-lys-teal/90 text-white gap-2" data-testid="button-sis-integration">
                Manage Connections
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Comparison */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Lessons This Week</p>
                <p className="font-oswald text-3xl font-bold text-lys-red">{data.lessonsThisWeek}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-roboto">vs Last Week</p>
                <p className={`font-oswald text-lg font-bold ${data.lessonsThisWeek >= data.lessonsLastWeek ? 'text-green-600' : 'text-amber-600'}`}>
                  {data.lessonsThisWeek >= data.lessonsLastWeek ? '+' : ''}
                  {data.lessonsThisWeek - data.lessonsLastWeek}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Goals Completed</p>
                <p className="font-oswald text-3xl font-bold text-green-600">{data.goalsCompleted}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-roboto">In Progress</p>
                <p className="font-oswald text-lg font-bold text-lys-teal">{data.goalsInProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations */}
      {data.organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Building2 className="h-5 w-5 text-lys-teal" />
              Your Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.organizations.map((org) => (
                <div key={org.id} className="p-4 rounded-md border bg-muted/20">
                  <p className="font-oswald font-semibold">{org.name}</p>
                  <p className="text-sm text-muted-foreground font-roboto">
                    {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Educators */}
      {data.topEducators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Trophy className="h-5 w-5 text-lys-yellow" />
              Top Educators by Lesson Creation
            </CardTitle>
            <CardDescription className="font-roboto">
              Click on an educator to view their detailed analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEducators.map((educator, index) => (
                <div 
                  key={educator.id} 
                  className="flex items-center gap-4 p-3 rounded-md bg-muted/20 hover-elevate cursor-pointer"
                  onClick={() => onTeacherClick(educator.id)}
                  data-testid={`educator-card-${educator.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-oswald font-bold text-sm ${
                    index === 0 ? 'bg-lys-yellow text-black' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-oswald font-semibold">{educator.name}</p>
                  </div>
                  <Badge variant="outline" className="font-roboto">
                    {educator.lessonCount} lesson{educator.lessonCount !== 1 ? 's' : ''}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campus Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lys-teal" />
              Standards Coverage (Campus-wide)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campusStandardsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campusStandardsData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#016371" 
                    radius={[4, 4, 0, 0]}
                    name="Lessons"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="font-roboto text-center">No standards data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Award className="h-5 w-5 text-lys-red" />
              Be-Know-Do Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campusBkdPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={campusBkdPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {campusBkdPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="font-roboto text-center">No lesson data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campus Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Clock className="h-5 w-5 text-lys-red" />
            Campus Activity Timeline
          </CardTitle>
          <CardDescription className="font-roboto">
            Organization-wide activity over the past month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.activityByWeek}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="lessons" 
                stroke="#EE4E23" 
                strokeWidth={2}
                dot={{ fill: "#EE4E23" }}
                name="Lessons"
              />
              <Line 
                type="monotone" 
                dataKey="goals" 
                stroke="#016371" 
                strokeWidth={2}
                dot={{ fill: "#016371" }}
                name="Goals"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

interface PersonalAnalyticsProps {
  totalLessons: number;
  sharedLessons: number;
  inProgressGoals: number;
  completedGoals: number;
  overallProgress: number;
  totalMilestones: number;
  completedMilestones: number;
  standardsChartData: Array<{ name: string; count: number }>;
  bkdPieData: Array<{ name: string; value: number; color: string }>;
  categoryPieData: Array<{ name: string; value: number }>;
  activityData: Array<{ name: string; lessons: number; goals: number }>;
  standardsCoverage: Record<string, number>;
  totalGoals: number;
  COLORS: string[];
}

function PersonalAnalytics({
  totalLessons,
  sharedLessons,
  inProgressGoals,
  completedGoals,
  overallProgress,
  totalMilestones,
  completedMilestones,
  standardsChartData,
  bkdPieData,
  categoryPieData,
  activityData,
  standardsCoverage,
  totalGoals,
  COLORS,
}: PersonalAnalyticsProps) {
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-lys-red" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Total Lessons</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-total-lessons">{totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
                <Share2 className="h-6 w-6 text-lys-teal" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Shared Lessons</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-shared-lessons">{sharedLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-lys-yellow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Active Goals</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-active-goals">{inProgressGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-roboto">Goals Completed</p>
                <p className="font-oswald text-2xl font-bold" data-testid="text-completed-goals">{completedGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lys-teal" />
              Standards Coverage
            </CardTitle>
            <CardDescription className="font-roboto">
              Distribution of educational standards across your lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {standardsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={standardsChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#016371" 
                    radius={[4, 4, 0, 0]}
                    name="Lessons"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="font-roboto text-center">
                  Create lessons with standards to see coverage analytics
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-lys-yellow" />
              Overall Progress
            </CardTitle>
            <CardDescription className="font-roboto">
              Milestone completion across all goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#016371"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${overallProgress * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-oswald text-3xl font-bold" data-testid="text-overall-progress">
                    {overallProgress}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm font-roboto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Milestones</span>
                <span className="font-semibold">{totalMilestones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-green-600">{completedMilestones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">{totalMilestones - completedMilestones}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Clock className="h-5 w-5 text-lys-red" />
            Activity Timeline
          </CardTitle>
          <CardDescription className="font-roboto">
            Your creation activity over the past month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="lessons" 
                stroke="#EE4E23" 
                strokeWidth={2}
                dot={{ fill: "#EE4E23" }}
                name="Lessons"
              />
              <Line 
                type="monotone" 
                dataKey="goals" 
                stroke="#016371" 
                strokeWidth={2}
                dot={{ fill: "#016371" }}
                name="Goals"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Award className="h-5 w-5 text-lys-red" />
              Be-Know-Do Distribution
            </CardTitle>
            <CardDescription className="font-roboto">
              Goals organized by LYS methodology pillars
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bkdPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={bkdPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bkdPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="font-roboto text-center">Create goals to see methodology distribution</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-lys-teal" />
              Goals by Category
            </CardTitle>
            <CardDescription className="font-roboto">
              Distribution of goals across life areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="font-roboto text-center">Create goals to see category distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald flex items-center gap-2">
            <Users className="h-5 w-5 text-lys-yellow" />
            Quick Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-lys-red/5">
              <p className="font-oswald text-2xl font-bold text-lys-red">{totalLessons + totalGoals}</p>
              <p className="text-sm text-muted-foreground font-roboto">Total Items Created</p>
            </div>
            <div className="p-4 rounded-lg bg-lys-yellow/5">
              <p className="font-oswald text-2xl font-bold text-lys-yellow">
                {Object.keys(standardsCoverage).length}
              </p>
              <p className="text-sm text-muted-foreground font-roboto">Standards Covered</p>
            </div>
            <div className="p-4 rounded-lg bg-lys-teal/5">
              <p className="font-oswald text-2xl font-bold text-lys-teal">
                {totalMilestones}
              </p>
              <p className="text-sm text-muted-foreground font-roboto">Total Milestones</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-6 rounded-lg bg-gradient-to-r from-lys-red/10 via-lys-yellow/10 to-lys-teal/10 border">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-oswald text-xl font-semibold mb-2">Keep Building Success</h2>
            <p className="font-roboto text-muted-foreground text-sm">
              Every lesson you create and every goal you set brings your students one step closer 
              to bridging the gap between high school and real-world success. You're making a difference!
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-lys-red/20 text-lys-red font-oswald px-3 py-1">BE</Badge>
            <Badge className="bg-lys-yellow/20 text-lys-yellow font-oswald px-3 py-1">KNOW</Badge>
            <Badge className="bg-lys-teal/20 text-lys-teal font-oswald px-3 py-1">DO</Badge>
          </div>
        </div>
      </div>
    </>
  );
}
