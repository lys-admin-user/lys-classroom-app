import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Compass,
  Target,
  ArrowLeft,
  Trophy,
  ClipboardList,
  FolderOpen,
  Activity,
  Briefcase,
  Calendar,
  CheckCircle2,
  Star,
  Clock,
} from "lucide-react";

const categories = {
  be: { label: "Being", icon: Heart, color: "text-rose-500", ring: "stroke-rose-500", score: 78 },
  know: { label: "Knowing", icon: Compass, color: "text-blue-500", ring: "stroke-blue-500", score: 64 },
  do: { label: "Doing", icon: Target, color: "text-emerald-500", ring: "stroke-emerald-500", score: 71 },
} as const;

function ScoreRing({ k }: { k: keyof typeof categories }) {
  const c = categories[k];
  const Icon = c.icon;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (c.score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={c.ring}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`h-5 w-5 ${c.color}`} />
          <span className="text-xl font-bold text-foreground">{c.score}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
    </div>
  );
}

function FromBadge() {
  return (
    <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 align-middle">
      from Journey
    </Badge>
  );
}

export function UnifiedStudentPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Back + header */}
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Classroom roster
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
            MJ
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Maria Johnson</h1>
            <p className="text-muted-foreground text-sm">Grade 10 · Be-Know-Do Pathway · Last active 2 days ago</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge className="bg-emerald-100 text-emerald-700">On track</Badge>
          </div>
        </div>

        {/* Tabs — 6 in one place */}
        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
            <TabsTrigger value="overview"><Star className="h-3.5 w-3.5 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="assignments"><ClipboardList className="h-3.5 w-3.5 mr-1" />Assignments</TabsTrigger>
            <TabsTrigger value="milestones"><Trophy className="h-3.5 w-3.5 mr-1" />Milestones</TabsTrigger>
            <TabsTrigger value="portfolio"><FolderOpen className="h-3.5 w-3.5 mr-1" />Portfolio</TabsTrigger>
            <TabsTrigger value="activity"><Activity className="h-3.5 w-3.5 mr-1" />Activity<FromBadge /></TabsTrigger>
            <TabsTrigger value="careers"><Briefcase className="h-3.5 w-3.5 mr-1" />Careers<FromBadge /></TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Be-Know-Do Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around">
                  <ScoreRing k="be" />
                  <ScoreRing k="know" />
                  <ScoreRing k="do" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Current Focus", value: "Career Exploration", icon: Compass },
                { label: "Days Active", value: "47 days", icon: Calendar },
                { label: "Milestones Earned", value: "8 of 12", icon: Trophy },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-5">
                    <s.icon className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-lg font-semibold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="mt-5 space-y-3">
            {[
              { t: "Personal Mission Statement", due: "Due Jun 12", done: true },
              { t: "Career Interview Reflection", due: "Due Jun 18", done: false },
              { t: "Goal-Setting Worksheet", due: "Due Jun 24", done: false },
            ].map((a) => (
              <Card key={a.t}>
                <CardContent className="py-4 flex items-center gap-3">
                  {a.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium text-foreground">{a.t}</span>
                  <span className="ml-auto text-sm text-muted-foreground">{a.due}</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Milestones */}
          <TabsContent value="milestones" className="mt-5">
            <div className="grid grid-cols-2 gap-3">
              {["Self-Awareness Badge", "First Career Saved", "Mentor Connected", "Portfolio Started"].map((m) => (
                <Card key={m}>
                  <CardContent className="py-4 flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-medium text-foreground">{m}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Portfolio */}
          <TabsContent value="portfolio" className="mt-5">
            <div className="grid grid-cols-3 gap-3">
              {["Essay: Who I Am", "Volunteer Photos", "Science Project"].map((p) => (
                <Card key={p}>
                  <CardContent className="pt-5">
                    <FolderOpen className="h-6 w-6 text-blue-500 mb-2" />
                    <p className="font-medium text-foreground text-sm">{p}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity (moved from Journey) */}
          <TabsContent value="activity" className="mt-5 space-y-3">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              This tab brings in the activity feed that used to live on the separate Student Journey page.
            </p>
            {[
              "Completed 'Personal Mission Statement'",
              "Saved a career: Registered Nurse",
              "Earned the Self-Awareness Badge",
            ].map((a, i) => (
              <Card key={i}>
                <CardContent className="py-3 flex items-center gap-3 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{a}</span>
                  <span className="ml-auto text-muted-foreground text-xs">{i + 1}d ago</span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Careers (moved from Journey) */}
          <TabsContent value="careers" className="mt-5">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
              Saved careers also move here from the old Student Journey page — nothing is lost.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {["Registered Nurse", "Software Developer", "Graphic Designer"].map((c) => (
                <Card key={c}>
                  <CardContent className="pt-5">
                    <Briefcase className="h-6 w-6 text-emerald-500 mb-2" />
                    <p className="font-medium text-foreground text-sm">{c}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
