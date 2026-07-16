import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, Mail, Users } from "lucide-react";
import { FRUSTRATION_OPTIONS, PLANNING_STYLE_OPTIONS } from "@/lib/teacherSignup";

interface BreakdownRow {
  value: string | null;
  count: number;
  converted: number;
}

interface InsightsResponse {
  totals: { total: number; withEmail: number; skipped: number; converted: number };
  frustrations: BreakdownRow[];
  planningStyles: BreakdownRow[];
  states: BreakdownRow[];
  subjects: BreakdownRow[];
  grades: BreakdownRow[];
  recent: {
    id: string;
    email: string | null;
    frustration: string | null;
    planningStyle: string | null;
    state: string | null;
    subject: string | null;
    gradeLevel: string | null;
    skipped: boolean;
    convertedAt: string | null;
    createdAt: string | null;
  }[];
}

const FRUSTRATION_LABELS = Object.fromEntries(FRUSTRATION_OPTIONS.map((o) => [o.value, o.label]));
const PLANNING_LABELS = Object.fromEntries(PLANNING_STYLE_OPTIONS.map((o) => [o.value, o.label]));

function BreakdownCard({
  title,
  rows,
  labels,
}: {
  title: string;
  rows: BreakdownRow[];
  labels?: Record<string, string>;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-oswald text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground font-roboto">No answers yet.</p>
        )}
        {rows.map((r) => {
          const label = (r.value && labels?.[r.value]) || r.value || "—";
          const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
          const convPct = r.count > 0 ? Math.round((r.converted / r.count) * 100) : 0;
          return (
            <div key={r.value ?? "none"} data-testid={`row-breakdown-${title}-${r.value}`}>
              <div className="flex items-center justify-between text-sm font-roboto mb-1 gap-2">
                <span className="truncate">{label}</span>
                <span className="text-muted-foreground shrink-0">
                  {r.count} ({pct}%) · {convPct}% signed up
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function SignupInsights() {
  useEffect(() => {
    document.title = "Signup Insights — LYS Admin";
  }, []);

  const { data, isLoading, error } = useQuery<InsightsResponse>({
    queryKey: ["/api/admin/signup-insights"],
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-sm font-roboto text-muted-foreground">
            Couldn't load signup insights. You need site admin access to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totals } = data;
  const convPct = totals.total > 0 ? Math.round((totals.converted / totals.total) * 100) : 0;

  const stats = [
    { label: "Quiz sessions", value: totals.total, icon: Users, testid: "stat-total" },
    { label: "Emails captured", value: totals.withEmail, icon: Mail, testid: "stat-emails" },
    { label: "Signed up", value: `${totals.converted} (${convPct}%)`, icon: CheckCircle2, testid: "stat-converted" },
    { label: "Skipped everything", value: totals.skipped, icon: BarChart3, testid: "stat-skipped" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" data-testid="page-signup-insights">
      <div>
        <h1 className="font-oswald text-3xl mb-1">Signup Insights</h1>
        <p className="text-muted-foreground font-roboto text-sm">
          What teachers tell us before they create an account — read-only.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-roboto mb-1">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              <div className="font-oswald text-2xl" data-testid={s.testid}>
                {s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BreakdownCard title="Biggest frustration" rows={data.frustrations} labels={FRUSTRATION_LABELS} />
        <BreakdownCard title="How they plan today" rows={data.planningStyles} labels={PLANNING_LABELS} />
        <BreakdownCard title="State" rows={data.states} />
        <BreakdownCard title="Subject" rows={data.subjects} />
        <BreakdownCard title="Grade level" rows={data.grades} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-oswald text-lg">Recent responses</CardTitle>
          <CardDescription>Latest 50 quiz sessions, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-roboto">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Frustration</th>
                  <th className="py-2 pr-3 font-medium">Planning</th>
                  <th className="py-2 pr-3 font-medium">State / Subject / Grade</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-muted-foreground">
                      No responses yet.
                    </td>
                  </tr>
                )}
                {data.recent.map((r) => (
                  <tr key={r.id} className="border-b last:border-0" data-testid={`row-recent-${r.id}`}>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 pr-3">{r.email || <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2 pr-3">
                      {r.frustration ? FRUSTRATION_LABELS[r.frustration] || r.frustration : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {r.planningStyle ? PLANNING_LABELS[r.planningStyle] || r.planningStyle : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      {[r.state, r.subject, r.gradeLevel].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="py-2">
                      {r.convertedAt ? (
                        <Badge className="bg-lys-teal text-white">Signed up</Badge>
                      ) : r.skipped ? (
                        <Badge variant="secondary">Skipped</Badge>
                      ) : (
                        <Badge variant="outline">Answered</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
