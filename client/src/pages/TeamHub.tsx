import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { HrRole, Employee, HrOnboardingTask, FoundationModule, FoundationProgress } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Building2, Users, Briefcase, ClipboardList, Plus, Pencil, Archive, RefreshCw,
  Compass, CheckCircle2, Circle, BookOpen, Target, Wrench, ListChecks, Sparkles,
  Route, KanbanSquare, CalendarDays, LayoutDashboard, Megaphone, Lock, Hourglass,
} from "lucide-react";
import { JourneyView, KanbanView, CalendarView, DashboardsView, TrainingView } from "./TeamHubViews";
import { useTeamHubAccess } from "@/hooks/useTeamHubAccess";
import { FoundationDrawer } from "@/components/FoundationDrawer";
import { MfaStepUpDialog } from "@/components/MfaStepUpDialog";
import { isMfaRequiredError, isMfaEnrollmentRequiredError } from "@/hooks/use-mfa";

const HORIZON_LABEL: Record<string, string> = {
  active: "Active now",
  near_future: "Near future",
  future: "Future",
};
const HORIZON_STYLE: Record<string, string> = {
  active: "bg-lys-teal/15 text-lys-teal border-lys-teal/30",
  near_future: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  future: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
};

const TABS = [
  { key: "", label: "Overview", url: "/team", icon: Building2 },
  { key: "roles", label: "Role Directory", url: "/team/roles", icon: Briefcase },
  { key: "people", label: "People", url: "/team/people", icon: Users },
  { key: "onboarding", label: "My Onboarding", url: "/team/onboarding", icon: ClipboardList },
  { key: "journey", label: "Journey Map", url: "/team/journey", icon: Route },
  { key: "board", label: "Board", url: "/team/board", icon: KanbanSquare },
  { key: "calendar", label: "Calendar", url: "/team/calendar", icon: CalendarDays },
  { key: "dashboards", label: "Dashboards", url: "/team/dashboards", icon: LayoutDashboard },
  { key: "training", label: "Training", url: "/team/training", icon: Megaphone },
];

function useIsManager() {
  const { user } = useAuth() as any;
  return user?.role === "site_admin" || user?.role === "system_admin";
}

function linesToArray(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

/* ----------------------- Membership access gate ----------------------- */
// Shown to anyone not yet approved as a Team Hub staff member. Requesting to
// join is unlocked by finishing the "Our Foundation" materials; until then
// the card walks the user through completing them. Pending requests wait;
// new/denied users can (re)submit a request with a note.
function TeamAccessGate({ status }: { status: "none" | "pending" | "approved" | "denied" }) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [foundationOpen, setFoundationOpen] = useState(false);
  const { foundationComplete, foundationPercent } = useTeamHubAccess();
  const needsFoundation = status !== "pending" && !foundationComplete;
  const request = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/team/access/request", message.trim() ? { message: message.trim() } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/access/me"] });
      toast({ title: "Request sent", description: "A site or system admin will review it." });
    },
    onError: () => toast({ title: "Could not send request", variant: "destructive" }),
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16" data-testid="page-team-access-gate">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {status === "pending" ? (
              <Hourglass className="h-6 w-6 text-lys-teal" />
            ) : needsFoundation ? (
              <Sparkles className="h-6 w-6 text-lys-teal" />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="font-oswald text-2xl">
            {status === "pending"
              ? "Request pending"
              : needsFoundation
                ? "Start with Our Foundation"
                : "Team Hub is members-only"}
          </CardTitle>
          <CardDescription>
            {status === "pending"
              ? "Your request to join the Team Hub is waiting for a site or system admin to approve it."
              : needsFoundation
                ? "Explore all of the Our Foundation materials first — once you hit 100%, you can request to join the Team Hub."
                : status === "denied"
                  ? "Your previous request was not approved. You can send a new one below."
                  : "The Team Hub is for approved LYS team members. Ask to join and a site or system admin will review your request."}
          </CardDescription>
        </CardHeader>
        {needsFoundation && (
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-oswald">Our Foundation</span>
                <span className="text-muted-foreground" data-testid="text-foundation-gate-pct">
                  {foundationPercent}% explored
                </span>
              </div>
              <Progress value={foundationPercent} />
            </div>
            <Button
              className="w-full"
              onClick={() => setFoundationOpen(true)}
              data-testid="button-open-foundation"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Explore Our Foundation
            </Button>
            <FoundationDrawer open={foundationOpen} onOpenChange={setFoundationOpen} />
          </CardContent>
        )}
        {status !== "pending" && !needsFoundation && (
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="access-message">Note for the admins (optional)</Label>
              <Textarea
                id="access-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Who are you, and why do you need Team Hub access?"
                maxLength={1000}
                data-testid="input-access-message"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => request.mutate()}
              disabled={request.isPending}
              data-testid="button-request-access"
            >
              {request.isPending ? "Sending..." : status === "denied" ? "Request again" : "Request access"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

interface AccessRequestRow {
  id: string;
  userId: string;
  status: string;
  message: string | null;
  source: string;
  requestedAt: string | null;
  user: { id: string; firstName: string | null; lastName: string | null; email: string | null; role: string } | null;
}

// Admin-only queue (site/system admin) for approving or denying Team Hub
// membership requests. Approval is MFA step-up protected server-side.
function AccessRequestsCard() {
  const { toast } = useToast();
  const [mfaPrompt, setMfaPrompt] = useState<{ enrollmentRequired: boolean; retry: () => void } | null>(null);
  const { data: requests = [], isLoading } = useQuery<AccessRequestRow[]>({
    queryKey: ["/api/team/access/requests"],
  });
  const pending = requests.filter((r) => r.status === "pending");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/team/access/requests"] });
    queryClient.invalidateQueries({ queryKey: ["/api/team/access/me"] });
  };

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "deny" }) =>
      apiRequest("POST", `/api/team/access/requests/${id}/${action}`),
    onSuccess: (_res, vars) => {
      invalidate();
      toast({ title: vars.action === "approve" ? "Member approved" : "Request denied" });
    },
    onError: (error: any, vars) => {
      if (isMfaRequiredError(error)) {
        setMfaPrompt({
          enrollmentRequired: isMfaEnrollmentRequiredError(error),
          retry: () => decide.mutate(vars),
        });
        return;
      }
      toast({ title: "Action failed", variant: "destructive" });
    },
  });

  const displayName = (r: AccessRequestRow) => {
    const n = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ");
    return n || r.user?.email || r.userId;
  };

  return (
    <Card data-testid="card-access-requests">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-lys-teal" /> Membership requests
        </CardTitle>
        <CardDescription>
          People asking to join the Team Hub. Approving makes them a staff member.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-access-requests">
            No pending requests.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                data-testid={`row-access-request-${r.id}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{displayName(r)}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.user?.email}
                    {r.user?.role ? ` · currently ${r.user.role.replace(/_/g, " ")}` : ""}
                  </p>
                  {r.message && <p className="text-xs mt-1 italic text-muted-foreground">"{r.message}"</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ id: r.id, action: "approve" })}
                    disabled={decide.isPending}
                    data-testid={`button-approve-access-${r.id}`}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide.mutate({ id: r.id, action: "deny" })}
                    disabled={decide.isPending}
                    data-testid={`button-deny-access-${r.id}`}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <MfaStepUpDialog
        open={!!mfaPrompt}
        enrollmentRequired={!!mfaPrompt?.enrollmentRequired}
        onClose={() => setMfaPrompt(null)}
        onVerified={() => {
          const retry = mfaPrompt?.retry;
          setMfaPrompt(null);
          retry?.();
        }}
      />
    </Card>
  );
}

export default function TeamHub() {
  const [, params] = useRoute("/team/:tab");
  const tab = params?.tab ?? "";
  const [, navigate] = useLocation();
  const access = useTeamHubAccess();

  if (access.isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!access.approved) {
    return <TeamAccessGate status={access.status} />;
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8" data-testid="page-team-hub">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Building2 className="h-4 w-4" /> Team Hub
        </div>
        <h1 className="font-oswald text-3xl font-bold" data-testid="text-team-hub-title">
          Team Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Your internal home for roles, people, and onboarding — built on the LYS Be-Know-Do foundation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b mb-6">
        {TABS.map((t) => {
          const active = t.key === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.key || "overview"}
              onClick={() => navigate(t.url)}
              className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
                active ? "border-lys-teal text-lys-teal" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${t.key || "overview"}`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "" && <OverviewTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "people" && <PeopleTab />}
      {tab === "onboarding" && <MyOnboardingTab />}
      {tab === "journey" && <JourneyView />}
      {tab === "board" && <KanbanView />}
      {tab === "calendar" && <CalendarView />}
      {tab === "dashboards" && <DashboardsView />}
      {tab === "training" && <TrainingTab />}
    </div>
  );
}

function TrainingTab() {
  const { data } = useQuery<{ hubspot?: { connected: boolean }; google?: { connected: boolean } }>({
    queryKey: ["/api/team/integrations/status"],
  });
  return <TrainingView integrations={data} />;
}

/* ----------------------------- Overview ----------------------------- */
function OverviewTab() {
  const { data: roles = [] } = useQuery<HrRole[]>({ queryKey: ["/api/team/roles"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/team/employees"] });

  const stat = (label: string, value: number | string, icon: React.ReactNode, testid: string) => (
    <Card data-testid={`stat-${testid}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-lys-teal/10 p-3 text-lys-teal">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stat("Roles defined", roles.length, <Briefcase className="h-5 w-5" />, "roles")}
        {stat("Team members", employees.length, <Users className="h-5 w-5" />, "people")}
        {stat("Onboarding", employees.filter((e) => e.status === "onboarding").length, <ClipboardList className="h-5 w-5" />, "onboarding")}
      </div>

      <FoundationFrame />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-lys-teal" /> Role Directory</CardTitle>
            <CardDescription>Every role's summary, Be-Know-Do, KPIs, SOPs, and evaluation checklist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/team/roles"><Button variant="outline" data-testid="link-go-roles">Open directory</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-lys-teal" /> People & Onboarding</CardTitle>
            <CardDescription>Add team members and auto-generate their onboarding plan from their role.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/team/people"><Button variant="outline" data-testid="link-go-people">Manage people</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* --------------------- Our Foundation (folded in) --------------------- */
function FoundationFrame() {
  const { toast } = useToast();
  const { data: modules = [], isLoading } = useQuery<FoundationModule[]>({ queryKey: ["/api/foundation/modules"] });
  const { data: progress = [] } = useQuery<FoundationProgress[]>({ queryKey: ["/api/foundation/progress"] });
  const [open, setOpen] = useState<FoundationModule | null>(null);

  const completedSlugs = new Set(progress.filter((p) => !!p.completedAt).map((p) => p.moduleSlug));
  const pct = modules.length ? Math.round((completedSlugs.size / modules.length) * 100) : 0;

  const mark = useMutation({
    mutationFn: async (slug: string) => apiRequest("POST", "/api/foundation/progress", { moduleSlug: slug, action: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foundation/progress"] });
      toast({ title: "Marked complete", description: "Nice work — your Foundation progress was saved." });
    },
  });

  return (
    <Card className="border-lys-teal/30" data-testid="card-foundation-frame">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><Compass className="h-5 w-5 text-lys-teal" /> Our Foundation</CardTitle>
            <CardDescription>Start here. The mission, vision, and Be-Know-Do method every LYS team member shares.</CardDescription>
          </div>
          <div className="text-right min-w-[140px]">
            <div className="text-sm text-muted-foreground">Explored</div>
            <div className="text-2xl font-bold text-lys-teal" data-testid="text-foundation-pct">{pct}%</div>
          </div>
        </div>
        <Progress value={pct} className="mt-2" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {modules.map((m) => {
              const done = completedSlugs.has(m.slug);
              return (
                <button
                  key={m.slug}
                  onClick={() => setOpen(m)}
                  className="flex items-start gap-3 rounded-lg border p-3 text-left hover-elevate"
                  data-testid={`button-foundation-${m.slug}`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5 text-lys-teal shrink-0 mt-0.5" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-oswald text-2xl">{open?.title}</DialogTitle>
            <DialogDescription>{open?.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {open?.body}
          </div>
          <DialogFooter>
            {open && !completedSlugs.has(open.slug) && (
              <Button onClick={() => { mark.mutate(open.slug); setOpen(null); }} disabled={mark.isPending} data-testid="button-foundation-complete">
                Mark complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ----------------------------- Roles ----------------------------- */
function RolesTab() {
  const isManager = useIsManager();
  const { data: roles = [], isLoading } = useQuery<HrRole[]>({ queryKey: ["/api/team/roles"] });
  const [detail, setDetail] = useState<HrRole | null>(null);
  const [editing, setEditing] = useState<HrRole | null>(null);
  const [adding, setAdding] = useState(false);

  const byDept = roles.reduce<Record<string, HrRole[]>>((acc, r) => {
    (acc[r.department] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roles.length} role{roles.length === 1 ? "" : "s"} across {Object.keys(byDept).length} department{Object.keys(byDept).length === 1 ? "" : "s"}.</p>
        {isManager && (
          <Button onClick={() => setAdding(true)} data-testid="button-add-role"><Plus className="h-4 w-4 mr-1" /> Add role</Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : roles.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No roles yet. {isManager ? "Add your first role to get started." : "An admin will add roles soon."}
        </CardContent></Card>
      ) : (
        Object.entries(byDept).map(([dept, list]) => (
          <div key={dept}>
            <h2 className="font-oswald text-lg font-semibold mb-3">{dept}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((r) => (
                <Card key={r.id} className="cursor-pointer hover-elevate" onClick={() => setDetail(r)} data-testid={`card-role-${r.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{r.title}</CardTitle>
                      <Badge variant="outline" className={HORIZON_STYLE[r.horizon] || ""}>{HORIZON_LABEL[r.horizon] || r.horizon}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{r.summary || "No summary yet."}</p>
                    <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {r.kpis?.length || 0} KPIs</span>
                      <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {r.tools?.length || 0} tools</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <RoleDetailDialog role={detail} onClose={() => setDetail(null)} onEdit={isManager ? (r) => { setDetail(null); setEditing(r); } : undefined} />
      {(adding || editing) && (
        <RoleFormDialog role={editing} onClose={() => { setAdding(false); setEditing(null); }} />
      )}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-semibold mb-2">{icon} {title}</h3>
      {children}
    </div>
  );
}

function RoleDetailDialog({ role, onClose, onEdit }: { role: HrRole | null; onClose: () => void; onEdit?: (r: HrRole) => void }) {
  if (!role) return null;
  const cadences: [string, string[] | undefined][] = [
    ["Daily", role.sops?.daily], ["Weekly", role.sops?.weekly], ["Monthly", role.sops?.monthly],
    ["Each semester", role.sops?.semester], ["Yearly", role.sops?.yearly],
  ];
  return (
    <Dialog open={!!role} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-role-detail">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={HORIZON_STYLE[role.horizon] || ""}>{HORIZON_LABEL[role.horizon] || role.horizon}</Badge>
            <Badge variant="secondary">{role.department}</Badge>
            {role.employmentType && role.employmentType !== "Unspecified" && <Badge variant="outline">{role.employmentType}</Badge>}
          </div>
          <DialogTitle className="font-oswald text-2xl">{role.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          {role.summary && <p className="text-muted-foreground leading-relaxed">{role.summary}</p>}
          {(role.bkdBe || role.bkdKnow || role.bkdDo) && (
            <Section icon={<Sparkles className="h-4 w-4 text-lys-teal" />} title="Be-Know-Do">
              <div className="grid gap-2">
                {role.bkdBe && <div><span className="font-semibold text-lys-red">BE:</span> {role.bkdBe}</div>}
                {role.bkdKnow && <div><span className="font-semibold text-[hsl(45,93%,38%)]">KNOW:</span> {role.bkdKnow}</div>}
                {role.bkdDo && <div><span className="font-semibold text-lys-teal">DO:</span> {role.bkdDo}</div>}
              </div>
            </Section>
          )}
          {role.kpis?.length > 0 && (
            <Section icon={<Target className="h-4 w-4 text-lys-teal" />} title="KPIs">
              <ul className="space-y-1">
                {role.kpis.map((k, i) => (
                  <li key={i} className="flex justify-between gap-4 border-b border-dashed py-1">
                    <span>{k.name}</span>{k.target && <span className="text-muted-foreground whitespace-nowrap">{k.target}</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {cadences.some(([, v]) => v && v.length) && (
            <Section icon={<ClipboardList className="h-4 w-4 text-lys-teal" />} title="Standard operating procedures">
              <div className="space-y-3">
                {cadences.map(([label, items]) => items && items.length > 0 && (
                  <div key={label}>
                    <div className="font-medium">{label}</div>
                    <ul className="list-disc pl-5 text-muted-foreground">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {role.tools?.length > 0 && (
            <Section icon={<Wrench className="h-4 w-4 text-lys-teal" />} title="Tools">
              <div className="flex flex-wrap gap-2">{role.tools.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div>
            </Section>
          )}
          {role.evaluationChecklist?.length > 0 && (
            <Section icon={<ListChecks className="h-4 w-4 text-lys-teal" />} title="Evaluation checklist">
              <ul className="list-disc pl-5 text-muted-foreground">{role.evaluationChecklist.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </Section>
          )}
        </div>
        {onEdit && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onEdit(role)} data-testid="button-edit-role"><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleFormDialog({ role, onClose }: { role: HrRole | null; onClose: () => void }) {
  const { toast } = useToast();
  const editing = !!role;
  const [f, setF] = useState({
    title: role?.title ?? "",
    department: role?.department ?? "",
    horizon: role?.horizon ?? "active",
    employmentType: role?.employmentType ?? "Unspecified",
    summary: role?.summary ?? "",
    bkdBe: role?.bkdBe ?? "",
    bkdKnow: role?.bkdKnow ?? "",
    bkdDo: role?.bkdDo ?? "",
    kpis: (role?.kpis ?? []).map((k) => (k.target ? `${k.name} :: ${k.target}` : k.name)).join("\n"),
    daily: (role?.sops?.daily ?? []).join("\n"),
    weekly: (role?.sops?.weekly ?? []).join("\n"),
    monthly: (role?.sops?.monthly ?? []).join("\n"),
    semester: (role?.sops?.semester ?? []).join("\n"),
    yearly: (role?.sops?.yearly ?? []).join("\n"),
    tools: (role?.tools ?? []).join("\n"),
    evaluationChecklist: (role?.evaluationChecklist ?? []).join("\n"),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const buildPayload = () => ({
    title: f.title.trim(),
    department: f.department.trim() || "Unassigned",
    horizon: f.horizon,
    employmentType: f.employmentType.trim() || "Unspecified",
    summary: f.summary.trim(),
    bkdBe: f.bkdBe.trim(),
    bkdKnow: f.bkdKnow.trim(),
    bkdDo: f.bkdDo.trim(),
    kpis: linesToArray(f.kpis).map((line) => {
      const [name, target] = line.split("::").map((s) => s.trim());
      return target ? { name, target } : { name };
    }),
    sops: {
      daily: linesToArray(f.daily), weekly: linesToArray(f.weekly), monthly: linesToArray(f.monthly),
      semester: linesToArray(f.semester), yearly: linesToArray(f.yearly),
    },
    tools: linesToArray(f.tools),
    evaluationChecklist: linesToArray(f.evaluationChecklist),
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editing) return apiRequest("PATCH", `/api/team/roles/${role!.id}`, payload);
      return apiRequest("POST", "/api/team/roles", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/roles"] });
      toast({ title: editing ? "Role updated" : "Role added" });
      onClose();
    },
    onError: () => toast({ title: "Could not save role", variant: "destructive" }),
  });

  const ta = (label: string, key: keyof typeof f, placeholder: string, rows = 3) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea value={f[key] as string} onChange={set(key)} placeholder={placeholder} rows={rows} data-testid={`input-role-${String(key)}`} />
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto" data-testid="dialog-role-form">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit role" : "Add a role"}</DialogTitle>
          <DialogDescription>Paste the role's real documentation. One item per line. For KPIs, use "Name :: target".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Title</Label><Input value={f.title} onChange={set("title")} data-testid="input-role-title" /></div>
            <div className="space-y-1"><Label>Department</Label><Input value={f.department} onChange={set("department")} data-testid="input-role-department" /></div>
            <div className="space-y-1">
              <Label>Horizon</Label>
              <Select value={f.horizon} onValueChange={(v) => setF({ ...f, horizon: v })}>
                <SelectTrigger data-testid="select-role-horizon"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active now</SelectItem>
                  <SelectItem value="near_future">Near future</SelectItem>
                  <SelectItem value="future">Future</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Employment type</Label><Input value={f.employmentType} onChange={set("employmentType")} data-testid="input-role-employmentType" /></div>
          </div>
          {ta("Executive summary", "summary", "What this role exists to do…")}
          <div className="grid gap-3 sm:grid-cols-3">
            {ta("BE", "bkdBe", "Who they are…", 3)}
            {ta("KNOW", "bkdKnow", "What they must know…", 3)}
            {ta("DO", "bkdDo", "What they do…", 3)}
          </div>
          {ta("KPIs (one per line, Name :: target)", "kpis", "Partnership retention rate :: ≥ 85% annually", 4)}
          <Separator />
          <p className="text-sm font-medium">Standard operating procedures (one per line)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ta("Daily", "daily", "", 3)}
            {ta("Weekly", "weekly", "", 3)}
            {ta("Monthly", "monthly", "", 3)}
            {ta("Each semester", "semester", "", 3)}
          </div>
          {ta("Yearly", "yearly", "", 3)}
          <Separator />
          {ta("Tools (one per line)", "tools", "", 3)}
          {ta("Evaluation checklist (one per line)", "evaluationChecklist", "", 3)}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !f.title.trim()} data-testid="button-save-role">
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- People ----------------------------- */
function PeopleTab() {
  const isManager = useIsManager();
  const { data: employees = [], isLoading } = useQuery<Employee[]>({ queryKey: ["/api/team/employees"] });
  const { data: roles = [] } = useQuery<HrRole[]>({ queryKey: ["/api/team/roles"] });
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const roleName = (id: string) => roles.find((r) => r.id === id)?.title ?? "—";

  return (
    <div className="space-y-6">
      {isManager && <AccessRequestsCard />}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{employees.length} team member{employees.length === 1 ? "" : "s"}.</p>
        {isManager && <Button onClick={() => setAdding(true)} disabled={roles.length === 0} data-testid="button-add-employee"><Plus className="h-4 w-4 mr-1" /> Add person</Button>}
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : employees.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No team members yet. {isManager ? "Add someone to auto-build their onboarding plan." : ""}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => (
            <Card key={e.id} className="cursor-pointer hover-elevate" onClick={() => setViewing(e)} data-testid={`card-employee-${e.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.name}</CardTitle>
                <CardDescription>{roleName(e.roleId)}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">{e.status}</Badge>
                <span className="text-xs text-muted-foreground">{e.email}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {adding && <EmployeeFormDialog roles={roles} onClose={() => setAdding(false)} />}
      {viewing && <EmployeeOnboardingDialog employee={viewing} roleName={roleName(viewing.roleId)} isManager={isManager} onClose={() => setViewing(null)} />}
    </div>
  );
}

function EmployeeFormDialog({ roles, onClose }: { roles: HrRole[]; onClose: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ name: "", email: "", roleId: "", startDate: "", employmentType: "" });
  const save = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/team/employees", {
      name: f.name.trim(), email: f.email.trim(), roleId: f.roleId,
      startDate: f.startDate || undefined, employmentType: f.employmentType.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/employees"] });
      toast({ title: "Person added", description: "Their onboarding plan was generated from their role." });
      onClose();
    },
    onError: () => toast({ title: "Could not add person", variant: "destructive" }),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="dialog-employee-form">
        <DialogHeader><DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>We'll auto-generate their onboarding checklist from their role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="input-employee-name" /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-testid="input-employee-email" /></div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={f.roleId} onValueChange={(v) => setF({ ...f, roleId: v })}>
              <SelectTrigger data-testid="select-employee-role"><SelectValue placeholder="Choose a role" /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Start date</Label><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} data-testid="input-employee-startdate" /></div>
            <div className="space-y-1"><Label>Employment type</Label><Input value={f.employmentType} onChange={(e) => setF({ ...f, employmentType: e.target.value })} placeholder="Optional" data-testid="input-employee-employmenttype" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !f.name.trim() || !f.email.trim() || !f.roleId} data-testid="button-save-employee">
            {save.isPending ? "Adding…" : "Add person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OnboardingChecklist({ employeeId, editable }: { employeeId: string; editable: boolean }) {
  const { data: tasks = [], isLoading } = useQuery<HrOnboardingTask[]>({ queryKey: ["/api/team/employees", employeeId, "onboarding"] });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/team/onboarding/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/team/employees", employeeId, "onboarding"] }),
  });
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (tasks.length === 0) return <p className="text-sm text-muted-foreground">No onboarding tasks yet.</p>;

  const done = tasks.filter((t) => t.status === "done").length;
  const pct = Math.round((done / tasks.length) * 100);
  const phases = tasks.reduce<Record<string, HrOnboardingTask[]>>((acc, t) => { (acc[t.phase] ||= []).push(t); return acc; }, {});

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1"><span>Onboarding progress</span><span className="font-medium">{pct}%</span></div>
        <Progress value={pct} />
      </div>
      {Object.entries(phases).map(([phase, list]) => (
        <div key={phase}>
          <div className="font-medium text-sm mb-1">{phase}</div>
          <div className="space-y-1">
            {list.map((t) => (
              <label key={t.id} className="flex items-start gap-3 rounded-md border p-2 text-sm" data-testid={`task-${t.id}`}>
                <Checkbox
                  checked={t.status === "done"}
                  disabled={!editable || update.isPending}
                  onCheckedChange={(c) => update.mutate({ id: t.id, status: c ? "done" : "todo" })}
                  data-testid={`checkbox-task-${t.id}`}
                />
                <div className={t.status === "done" ? "line-through text-muted-foreground" : ""}>
                  <div>{t.title}</div>
                  {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.category}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeOnboardingDialog({ employee, roleName, isManager, onClose }: { employee: Employee; roleName: string; isManager: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const regen = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/team/employees/${employee.id}/onboarding/regenerate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/employees", employee.id, "onboarding"] });
      toast({ title: "Onboarding regenerated from role" });
    },
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" data-testid="dialog-employee-onboarding">
        <DialogHeader>
          <DialogTitle>{employee.name}</DialogTitle>
          <DialogDescription>{roleName} · {employee.email}</DialogDescription>
        </DialogHeader>
        {isManager && (
          <Button variant="outline" size="sm" className="w-fit" onClick={() => regen.mutate()} disabled={regen.isPending} data-testid="button-regen-onboarding">
            <RefreshCw className="h-4 w-4 mr-1" /> Regenerate from role
          </Button>
        )}
        <OnboardingChecklist employeeId={employee.id} editable={isManager} />
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- My Onboarding ----------------------------- */
function MyOnboardingTab() {
  const { data, isLoading } = useQuery<{ employee: Employee | null; role: HrRole | null; onboarding: HrOnboardingTask[] }>({ queryKey: ["/api/team/me"] });
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <FoundationFrame />
      {data?.employee ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-lys-teal" /> Your onboarding</CardTitle>
            <CardDescription>{data.role?.title}{data.role ? " · " : ""}{data.role?.department}</CardDescription>
          </CardHeader>
          <CardContent><OnboardingChecklist employeeId={data.employee.id} editable /></CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          You're not linked to a team member record yet. Complete the Our Foundation modules above, and an admin can link your account in People.
        </CardContent></Card>
      )}
    </div>
  );
}
