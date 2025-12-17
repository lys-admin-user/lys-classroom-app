import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Share2
} from "lucide-react";
import type { Lesson, Goal } from "@shared/schema";
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

export default function Analytics() {
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const isLoading = lessonsLoading || goalsLoading;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-permanent-marker text-3xl text-lys-red mb-2" data-testid="text-analytics-title">
            Your Analytics
          </h1>
          <p className="font-roboto text-muted-foreground">
            Track your progress and see how you're making an impact
          </p>
        </div>

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

        <div className="grid lg:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
