import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HrRole, Employee, HrOnboardingTask } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, Circle, CircleDot, ChevronLeft, ChevronRight, CalendarDays,
  UserCircle, Users, Crown, TrendingUp, AlertTriangle, ArrowRight, Megaphone, PlugZap,
} from "lucide-react";

export interface TeamAggregate {
  isManager: boolean;
  meEmployeeId: string | null;
  roles: HrRole[];
  employees: Employee[];
  tasks: HrOnboardingTask[];
}

function useAggregate() {
  return useQuery<TeamAggregate>({ queryKey: ["/api/team/aggregate"] });
}

function pctOf(tasks: HrOnboardingTask[]) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100);
}

function phaseOrder(tasks: HrOnboardingTask[]): string[] {
  const min: Record<string, number> = {};
  for (const t of tasks) min[t.phase] = Math.min(min[t.phase] ?? Infinity, t.dueOffsetDays);
  return Object.keys(min).sort((a, b) => min[a] - min[b]);
}

/** Manager-only employee picker; staff are pinned to themselves. */
function EmployeePicker({ agg, value, onChange }: { agg: TeamAggregate; value: string; onChange: (v: string) => void }) {
  if (!agg.isManager) return null;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-64" data-testid="select-view-employee"><SelectValue placeholder="Choose a team member" /></SelectTrigger>
      <SelectContent>
        {agg.employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function useSelectedEmployee(agg?: TeamAggregate) {
  const [picked, setPicked] = useState<string>("");
  if (!agg) return { id: "", setPicked, list: [] as Employee[] };
  const id = picked || agg.meEmployeeId || agg.employees[0]?.id || "";
  return { id, setPicked, list: agg.employees };
}

/* ----------------------------- Journey Map ----------------------------- */
export function JourneyView() {
  const { data: agg, isLoading } = useAggregate();
  const sel = useSelectedEmployee(agg);
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!agg || agg.employees.length === 0) return <EmptyState text="No team members yet — add people to see their onboarding journey." />;

  const tasks = agg.tasks.filter((t) => t.employeeId === sel.id);
  const phases = phaseOrder(tasks);
  const emp = agg.employees.find((e) => e.id === sel.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-oswald text-xl font-semibold">Onboarding Journey</h2>
          <p className="text-sm text-muted-foreground">{emp?.name}'s path from day one to fully ramped.</p>
        </div>
        <EmployeePicker agg={agg} value={sel.id} onChange={sel.setPicked} />
      </div>

      {phases.length === 0 ? (
        <EmptyState text="No onboarding tasks for this person yet." />
      ) : (
        <div className="space-y-4">
          {phases.map((phase, i) => {
            const pt = tasks.filter((t) => t.phase === phase);
            const pct = pctOf(pt);
            const complete = pct === 100;
            const started = pt.some((t) => t.status !== "todo");
            return (
              <div key={phase} className="flex gap-4" data-testid={`journey-phase-${i}`}>
                <div className="flex flex-col items-center">
                  {complete ? <CheckCircle2 className="h-7 w-7 text-lys-teal" />
                    : started ? <CircleDot className="h-7 w-7 text-amber-500" />
                    : <Circle className="h-7 w-7 text-muted-foreground" />}
                  {i < phases.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <Card className="flex-1 mb-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <CardTitle className="text-base">{phase}</CardTitle>
                      <Badge variant="outline">{pct}% done</Badge>
                    </div>
                    <Progress value={pct} className="mt-1" />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {pt.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        {t.status === "done" ? <CheckCircle2 className="h-4 w-4 text-lys-teal" />
                          : t.status === "in_progress" ? <CircleDot className="h-4 w-4 text-amber-500" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                        <span className={t.status === "done" ? "line-through text-muted-foreground" : ""}>{t.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{t.category}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Kanban ----------------------------- */
const COLUMNS: { key: HrOnboardingTask["status"]; label: string; tone: string }[] = [
  { key: "todo", label: "To do", tone: "border-t-muted-foreground/40" },
  { key: "in_progress", label: "In progress", tone: "border-t-amber-500" },
  { key: "done", label: "Done", tone: "border-t-lys-teal" },
];
const NEXT: Record<string, HrOnboardingTask["status"]> = { todo: "in_progress", in_progress: "done", done: "todo" };

export function KanbanView() {
  const { data: agg, isLoading } = useAggregate();
  const { toast } = useToast();
  const sel = useSelectedEmployee(agg);
  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/team/onboarding/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/team/aggregate"] }),
    onError: () => toast({ title: "Could not move task", variant: "destructive" }),
  });
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!agg || agg.employees.length === 0) return <EmptyState text="No team members yet — add people to see their onboarding board." />;

  const tasks = agg.tasks.filter((t) => t.employeeId === sel.id);
  const emp = agg.employees.find((e) => e.id === sel.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-oswald text-xl font-semibold">Onboarding Board</h2>
          <p className="text-sm text-muted-foreground">{emp?.name}'s tasks. Click a card to advance it.</p>
        </div>
        <EmployeePicker agg={agg} value={sel.id} onChange={sel.setPicked} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`rounded-lg border border-t-4 ${col.tone} bg-muted/30 p-3`} data-testid={`kanban-col-${col.key}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm">{col.label}</span>
                <Badge variant="secondary">{colTasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {colTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => move.mutate({ id: t.id, status: NEXT[t.status] })}
                    disabled={move.isPending}
                    className="w-full rounded-md border bg-background p-3 text-left text-sm hover-elevate"
                    data-testid={`kanban-card-${t.id}`}
                  >
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.phase} · {t.category}</div>
                  </button>
                ))}
                {colTasks.length === 0 && <p className="text-xs text-muted-foreground px-1 py-2">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- Master Calendar ----------------------------- */
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function ymd(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

export function CalendarView() {
  const { data: agg, isLoading } = useAggregate();
  const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  const events = useMemo(() => {
    const map: Record<string, { label: string; type: "start" | "due" }[]> = {};
    if (!agg) return map;
    const empById = Object.fromEntries(agg.employees.map((e) => [e.id, e]));
    for (const e of agg.employees) {
      if (e.startDate) {
        const k = ymd(new Date(e.startDate));
        (map[k] ||= []).push({ label: `${e.name} starts`, type: "start" });
      }
    }
    for (const t of agg.tasks) {
      const e = empById[t.employeeId];
      if (!e?.startDate || t.status === "done") continue;
      const due = addDays(new Date(e.startDate), t.dueOffsetDays);
      const k = ymd(due);
      (map[k] ||= []).push({ label: `${e.name}: ${t.title}`, type: "due" });
    }
    return map;
  }, [agg]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!agg || agg.employees.length === 0) return <EmptyState text="No team members yet — the calendar fills in once people have start dates." />;

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const todayKey = ymd(new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-oswald text-xl font-semibold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-lys-teal" /> Master Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} data-testid="button-cal-prev"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-medium w-40 text-center">{cursor.toLocaleString("default", { month: "long", year: "numeric" })}</span>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} data-testid="button-cal-next"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border bg-border text-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
        {cells.map((date, i) => {
          const key = date ? ymd(date) : `e-${i}`;
          const evs = date ? events[key] || [] : [];
          return (
            <div key={key} className={`min-h-[88px] bg-background p-1 ${date && key === todayKey ? "ring-1 ring-inset ring-lys-teal" : ""}`}>
              {date && <div className="text-xs text-muted-foreground mb-1">{date.getDate()}</div>}
              <div className="space-y-1">
                {evs.slice(0, 3).map((ev, j) => (
                  <div key={j} className={`truncate rounded px-1 py-0.5 text-[11px] ${ev.type === "start" ? "bg-lys-teal/15 text-lys-teal" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}`} title={ev.label}>
                    {ev.label}
                  </div>
                ))}
                {evs.length > 3 && <div className="text-[11px] text-muted-foreground px-1">+{evs.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-lys-teal/30" /> Start date</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/30" /> Task due</span>
      </div>
    </div>
  );
}

/* ----------------------------- Tri-level Dashboards ----------------------------- */
export function DashboardsView() {
  const { data: agg, isLoading } = useAggregate();
  const [level, setLevel] = useState<"personal" | "team" | "leadership">("personal");
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!agg) return <EmptyState text="No team data yet." />;

  const levels: { key: typeof level; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: "personal", label: "Personal", icon: <UserCircle className="h-4 w-4" />, show: true },
    { key: "team", label: "My Team", icon: <Users className="h-4 w-4" />, show: agg.isManager },
    { key: "leadership", label: "Leadership", icon: <Crown className="h-4 w-4" />, show: agg.isManager },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {levels.filter((l) => l.show).map((l) => (
          <Button key={l.key} variant={level === l.key ? "default" : "outline"} size="sm" onClick={() => setLevel(l.key)} data-testid={`dash-level-${l.key}`}>
            {l.icon}<span className="ml-1">{l.label}</span>
          </Button>
        ))}
      </div>
      {level === "personal" && <PersonalDash agg={agg} />}
      {level === "team" && agg.isManager && <TeamDash agg={agg} />}
      {level === "leadership" && agg.isManager && <LeadershipDash agg={agg} />}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent></Card>
  );
}

function PersonalDash({ agg }: { agg: TeamAggregate }) {
  const myTasks = agg.tasks.filter((t) => t.employeeId === agg.meEmployeeId);
  const me = agg.employees.find((e) => e.id === agg.meEmployeeId);
  const role = agg.roles.find((r) => r.id === me?.roleId);
  if (!me) return <EmptyState text="You're not linked to a team member record yet. An admin can link your account in People." />;
  const pct = pctOf(myTasks);
  const open = myTasks.filter((t) => t.status !== "done");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Onboarding complete" value={`${pct}%`} />
        <StatCard label="Open tasks" value={open.length} />
        <StatCard label="Your role" value={<span className="text-base">{role?.title ?? "—"}</span>} sub={role?.department} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">What's next</CardTitle><CardDescription>Your nearest open onboarding tasks.</CardDescription></CardHeader>
        <CardContent className="space-y-1">
          {open.slice(0, 6).map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm border-b border-dashed py-1">
              <ArrowRight className="h-3 w-3 text-lys-teal" /> {t.title}<span className="ml-auto text-xs text-muted-foreground">{t.phase}</span>
            </div>
          ))}
          {open.length === 0 && <p className="text-sm text-muted-foreground">You're all caught up. 🎉</p>}
        </CardContent>
      </Card>
      {role && role.kpis.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-lys-teal" /> Your KPIs</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">{role.kpis.map((k, i) => (
              <li key={i} className="flex justify-between border-b border-dashed py-1"><span>{k.name}</span>{k.target && <span className="text-muted-foreground">{k.target}</span>}</li>
            ))}</ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamDash({ agg }: { agg: TeamAggregate }) {
  const reports = agg.employees.filter((e) => e.id === agg.meEmployeeId || e.managerId === agg.meEmployeeId);
  const roleName = (id: string) => agg.roles.find((r) => r.id === id)?.title ?? "—";
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{reports.length} person{reports.length === 1 ? "" : "s"} on your team.</p>
      <div className="space-y-2">
        {reports.map((e) => {
          const t = agg.tasks.filter((x) => x.employeeId === e.id);
          const pct = pctOf(t);
          return (
            <Card key={e.id} data-testid={`teamdash-row-${e.id}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{roleName(e.roleId)} · {e.status}</div>
                </div>
                <div className="w-40"><Progress value={pct} /></div>
                <span className="text-sm font-medium w-10 text-right">{pct}%</span>
              </CardContent>
            </Card>
          );
        })}
        {reports.length === 0 && <EmptyState text="No direct reports yet." />}
      </div>
    </div>
  );
}

function LeadershipDash({ agg }: { agg: TeamAggregate }) {
  const byStatus = countBy(agg.employees.map((e) => e.status));
  const byDept = countBy(agg.employees.map((e) => agg.roles.find((r) => r.id === e.roleId)?.department ?? "Unassigned"));
  const byHorizon = countBy(agg.roles.map((r) => r.horizon));
  const overall = pctOf(agg.tasks);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Team members" value={agg.employees.length} />
        <StatCard label="Roles defined" value={agg.roles.length} />
        <StatCard label="Onboarding now" value={byStatus["onboarding"] ?? 0} />
        <StatCard label="Org onboarding" value={`${overall}%`} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <BreakdownCard title="By department" data={byDept} />
        <BreakdownCard title="By status" data={byStatus} />
        <BreakdownCard title="Roles by horizon" data={byHorizon} />
      </div>
    </div>
  );
}

function countBy(arr: string[]): Record<string, number> {
  return arr.reduce<Record<string, number>>((a, k) => { a[k] = (a[k] ?? 0) + 1; return a; }, {});
}
function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-sm mb-0.5"><span className="capitalize">{k.replace(/_/g, " ")}</span><span className="text-muted-foreground">{v}</span></div>
            <div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-lys-teal" style={{ width: `${(v / max) * 100}%` }} /></div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Training Module ----------------------------- */
const FUNNEL = [
  { stage: "Sign up", goal: "Visitor creates an account.", dropoff: "Long forms, unclear value, no social proof.", play: "Keep the landing role-routed; show proof + a single clear CTA." },
  { stage: "Onboarding", goal: "New user completes profile + birthdate gate.", dropoff: "Confusing role choice, COPPA age block for under-13 self sign-up.", play: "Explain why we ask for a birthdate; route under-13 to a school/parent path." },
  { stage: "First lesson / practice", goal: "User generates their first lesson or practice set.", dropoff: "Blank-page paralysis, slow generation, fear of 'getting it wrong'.", play: "Offer templates + the streaming countdown so progress feels alive." },
  { stage: "Activation", goal: "User returns and creates a second artifact.", dropoff: "No reason to come back, forgot the value.", play: "Trigger a helpful nudge; surface saved work on the dashboard." },
  { stage: "Retention", goal: "User makes it a weekly habit.", dropoff: "Value plateau, no team/admin buy-in.", play: "Show growth analytics; bring in the school admin via 'See it for your school'." },
];

export function TrainingView({ integrations }: { integrations?: { hubspot?: { connected: boolean }; google?: { connected: boolean } } }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-oswald text-xl font-semibold flex items-center gap-2"><Megaphone className="h-5 w-5 text-lys-teal" /> Customer Onboarding Training</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Internal training for our team on how new LYS users move from sign-up to a weekly habit — where they drop off, and what we do about it. This is staff enablement, not a per-customer deal board.
        </p>
      </div>

      <div className="space-y-3">
        {FUNNEL.map((f, i) => (
          <Card key={f.stage} data-testid={`funnel-stage-${i}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lys-teal/15 text-lys-teal text-sm font-bold">{i + 1}</div>
                <CardTitle className="text-base">{f.stage}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
              <div><div className="font-medium text-muted-foreground mb-1">Goal</div>{f.goal}</div>
              <div><div className="font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Drop-off</div>{f.dropoff}</div>
              <div><div className="font-medium text-lys-teal mb-1">Our play</div>{f.play}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><PlugZap className="h-5 w-5 text-lys-teal" /> Automation hooks (manual-first)</CardTitle>
          <CardDescription>These are scaffolded and switch on later — for now the funnel is run by hand.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={integrations?.hubspot?.connected ? "default" : "secondary"}>{integrations?.hubspot?.connected ? "Connected" : "Manual"}</Badge>
            <span>HubSpot "Closed-Won" → assign customer-onboarding training automatically.</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={integrations?.google?.connected ? "default" : "secondary"}>{integrations?.google?.connected ? "Connected" : "Manual"}</Badge>
            <span>Google Workspace account creation → auto-create the employee + onboarding plan.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- shared ----------------------------- */
function EmptyState({ text }: { text: string }) {
  return <Card><CardContent className="py-12 text-center text-muted-foreground">{text}</CardContent></Card>;
}
