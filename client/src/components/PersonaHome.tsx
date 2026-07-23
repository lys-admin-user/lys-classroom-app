import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CalendarRange,
  Building2,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  Users,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  X,
  type LucideIcon,
} from "lucide-react";
import { homeConfigForRole } from "@/lib/personas";
import { useTeamHubAccess } from "@/hooks/useTeamHubAccess";

/**
 * Persona home layouts. Each persona lands on "/" but sees an arrangement
 * built around its daily job: homeschool parents get planner-first, staff get
 * Team Hub shortcuts, admins get an org-overview launchpad. Students keep
 * their dedicated StudentDashboard and educators keep the full
 * EducatorDashboard (with the PersonaQuickStart band below).
 * Presentation only — every link is still role-gated server-side.
 */

// D3: "Getting Started" steps per role. Shown as a dismissible card on home.
const GETTING_STARTED: Record<string, Array<{ label: string; href: string }>> = {
  student: [
    { label: "Discover yourself", href: "/self-discovery" },
    { label: "Explore careers", href: "/careers" },
    { label: "Set an action plan", href: "/action-plans" },
  ],
  homeschool_parent: [
    { label: "Plan your first week", href: "/homeschool" },
    { label: "Generate a lesson", href: "/lesson-generator" },
    { label: "View your gradebook", href: "/gradebook" },
  ],
  educator: [
    { label: "Generate your first lesson", href: "/lesson-generator" },
    { label: "Set up your classroom", href: "/classroom" },
    { label: "Explore standards", href: "/admin/standards" },
  ],
  campus_admin: [
    { label: "Open campus admin", href: "/admin" },
    { label: "Review standards", href: "/admin/standards" },
    { label: "View analytics", href: "/analytics" },
  ],
  district_admin: [
    { label: "Open district admin", href: "/district-admin" },
    { label: "Manage campuses", href: "/district-admin/campuses" },
    { label: "View analytics", href: "/analytics" },
  ],
  staff: [
    { label: "Request Team Hub access", href: "/team" },
    { label: "Browse role directory", href: "/team/roles" },
    { label: "Check your onboarding", href: "/team/onboarding" },
  ],
  site_admin: [
    { label: "Open system dashboard", href: "/system-admin" },
    { label: "Review users", href: "/system-admin/users" },
    { label: "Check standards ingestion", href: "/admin/standards-ingestion" },
  ],
  system_admin: [
    { label: "Open system dashboard", href: "/system-admin" },
    { label: "Review users", href: "/system-admin/users" },
    { label: "Check standards ingestion", href: "/admin/standards-ingestion" },
  ],
};

function useGettingStarted(role: string | undefined) {
  const key = role ?? "guest";
  const dismissKey = `lys:gs-dismissed:${key}`;
  const visitedKey = `lys:gs-visited:${key}`;

  const [dismissed, setDismissed] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(dismissKey) === "1");
      const raw = localStorage.getItem(visitedKey);
      setVisited(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      /* ignore */
    }
  }, [dismissKey, visitedKey]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
  };

  const markVisited = (href: string) => {
    setVisited((prev) => {
      if (prev.includes(href)) return prev;
      const next = [...prev, href];
      try {
        localStorage.setItem(visitedKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { dismissed, visited, dismiss, markVisited };
}

function GettingStartedCard({ role }: { role: string | undefined }) {
  const steps = GETTING_STARTED[role ?? ""] ?? [];
  const { dismissed, visited, dismiss, markVisited } = useGettingStarted(role);

  if (!steps.length || dismissed) return null;
  const allDone = steps.every((s) => visited.includes(s.href));
  if (allDone) return null;

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-6"
      data-testid="getting-started-card"
    >
      <div className="relative rounded-xl border border-persona/20 bg-persona/5 px-4 py-4">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss getting started"
          data-testid="button-dismiss-getting-started"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="font-oswald font-semibold text-sm uppercase tracking-wide text-persona mb-3">
          Getting Started
        </h3>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const done = visited.includes(step.href);
            return (
              <Link
                key={step.href}
                href={step.href}
                onClick={() => markVisited(step.href)}
                data-testid={`gs-step${step.href.replace(/\//g, "-")}`}
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-roboto border transition-all ${
                    done
                      ? "bg-persona/10 border-persona/20 text-persona"
                      : "bg-white border-slate-200 text-slate-700 hover:border-persona/30 hover:shadow-sm"
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${done ? "text-persona" : "text-slate-300"}`}
                  />
                  {step.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Shared "welcome back" band with the persona's quick links. Used standalone
// inside EducatorDashboard and as the top of each bespoke persona home.
export function PersonaQuickStart({ role }: { role: string | undefined }) {
  const { greeting, subtitle, links } = homeConfigForRole(role);

  return (
    <>
      <GettingStartedCard role={role} />
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-8"
        data-testid="role-quick-start"
      >
        <div className="mb-4">
          <h2
            className="font-oswald text-2xl sm:text-3xl text-foreground"
            data-testid="text-role-greeting"
          >
            {greeting}
          </h2>
          <p className="font-roboto text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card
                  className="hover-elevate active-elevate-2 cursor-pointer h-full"
                  data-testid={`quick-link-${link.href.replace(/\//g, "-")}`}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <Icon className="h-6 w-6 text-persona" />
                    <span className="font-oswald text-sm leading-tight">{link.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  cta: string;
}

// Shared scaffold: persona-tinted hero + quick links + 3 feature cards.
function PersonaHomeShell({
  badge,
  headline,
  tagline,
  primaryCta,
  features,
  testId,
}: {
  badge: string;
  headline: string;
  tagline: string;
  primaryCta: { label: string; href: string };
  features: FeatureCard[];
  testId: string;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background" data-testid={testId}>
      <section className="relative overflow-hidden bg-gradient-to-br from-persona/10 via-background to-persona/5 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
          <Badge className="bg-persona/10 text-persona border-persona/20 mb-4 font-roboto">
            {badge}
          </Badge>
          <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-foreground mb-3 leading-tight">
            {headline}
          </h1>
          <p className="font-oswald text-lg text-muted-foreground mb-6 max-w-2xl">{tagline}</p>
          <Link href={primaryCta.href}>
            <Button
              size="lg"
              className="bg-persona hover:bg-persona/90 text-white font-oswald gap-2"
              data-testid="button-persona-primary-cta"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <PersonaQuickStart role={user?.role ?? undefined} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.href} href={f.href}>
                <Card
                  className="hover-elevate active-elevate-2 cursor-pointer h-full"
                  data-testid={`feature-card-${f.href.replace(/\//g, "-")}`}
                >
                  <CardContent className="p-5 flex flex-col gap-3 h-full">
                    <div className="w-10 h-10 rounded-full bg-persona/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-persona" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-oswald font-semibold text-lg mb-1">{f.title}</h3>
                      <p className="text-sm text-muted-foreground font-roboto">{f.description}</p>
                    </div>
                    <span className="text-sm font-oswald text-persona flex items-center gap-1">
                      {f.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function HomeschoolHome() {
  return (
    <PersonaHomeShell
      testId="homeschool-home"
      badge="Homeschool HQ"
      headline="Your homeschool, beautifully organized"
      tagline="Plan the week, generate lessons, and keep records — all from one calm home base."
      primaryCta={{ label: "Plan This Week", href: "/homeschool" }}
      features={[
        {
          title: "Weekly Planner",
          description: "Build a balanced week of learning for each child in minutes.",
          href: "/homeschool",
          icon: CalendarRange,
          cta: "Open planner",
        },
        {
          title: "AI Lesson Planner",
          description: "Turn any topic into a ready-to-teach lesson with standards built in.",
          href: "/lesson-generator",
          icon: Sparkles,
          cta: "Generate a lesson",
        },
        {
          title: "Records & Portfolio",
          description: "Keep transcripts and records organized for the whole family.",
          href: "/sis-integration",
          icon: ClipboardList,
          cta: "View records",
        },
      ]}
    />
  );
}

export function StaffHome() {
  // Team Hub membership is admin-approved. Until then, the home still lands
  // staff on /team where the request/pending card lives, but the copy sets
  // the right expectation instead of promising tools they can't open yet.
  const { approved } = useTeamHubAccess();

  if (!approved) {
    return (
      <div className="min-h-screen bg-background" data-testid="staff-home">
        <section className="relative overflow-hidden bg-gradient-to-br from-persona/10 via-background to-persona/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
            <Badge className="bg-persona/10 text-persona border-persona/20 mb-4 font-roboto">
              LYS Team
            </Badge>
            <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-foreground mb-3 leading-tight">
              One step away from the Team Hub
            </h1>
            <p className="font-oswald text-lg text-muted-foreground mb-6 max-w-2xl">
              Team Hub access needs a quick admin approval. Request it (or check
              your request status) and you'll be in shortly.
            </p>
            <Link href="/team">
              <Button
                size="lg"
                className="bg-persona hover:bg-persona/90 text-white font-oswald gap-2"
                data-testid="button-persona-primary-cta"
              >
                Request Team Hub Access
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
        <PersonaQuickStart role="staff" />
      </div>
    );
  }

  return (
    <PersonaHomeShell
      testId="staff-home"
      badge="LYS Team"
      headline="Welcome to the Team Hub"
      tagline="Your roles, people, and onboarding — everything internal lives here."
      primaryCta={{ label: "Open Team Hub", href: "/team" }}
      features={[
        {
          title: "Role Directory",
          description: "Every LYS role with its KPIs and SOPs in one directory.",
          href: "/team/roles",
          icon: Briefcase,
          cta: "Browse roles",
        },
        {
          title: "People",
          description: "See who's on the team and who owns what.",
          href: "/team/people",
          icon: Users,
          cta: "View people",
        },
        {
          title: "Onboarding",
          description: "Track your onboarding tasks and check off what's done.",
          href: "/team/onboarding",
          icon: ClipboardList,
          cta: "My onboarding",
        },
      ]}
    />
  );
}

export function SchoolAdminHome() {
  const { user } = useAuth();
  const isDistrict = user?.role === "district_admin";

  return (
    <PersonaHomeShell
      testId="school-admin-home"
      badge={isDistrict ? "District Command Center" : "Campus Command Center"}
      headline={isDistrict ? "Your district at a glance" : "Your campus at a glance"}
      tagline="Curriculum, standards, analytics, and your team — everything you oversee, one screen."
      primaryCta={{
        label: isDistrict ? "District Dashboard" : "Admin Dashboard",
        href: isDistrict ? "/district-admin" : "/admin",
      }}
      features={[
        {
          title: "Analytics",
          description: "Usage, growth, and outcomes across your organization.",
          href: "/analytics",
          icon: BarChart3,
          cta: "View analytics",
        },
        {
          title: "Curriculum Planning",
          description: "Scopes, sequences, and shared curriculum documents.",
          href: "/curriculum-planning",
          icon: CalendarRange,
          cta: "Plan curriculum",
        },
        {
          title: isDistrict ? "Campuses" : "Standards",
          description: isDistrict
            ? "Manage every campus in your district or network."
            : "Manage the standards your campus teaches against.",
          href: isDistrict ? "/district-admin/campuses" : "/admin/standards",
          icon: isDistrict ? Building2 : ClipboardList,
          cta: isDistrict ? "Manage campuses" : "Manage standards",
        },
      ]}
    />
  );
}

export function PlatformAdminHome() {
  const { user } = useAuth();
  const isSystem = user?.role === "system_admin";

  return (
    <PersonaHomeShell
      testId="platform-admin-home"
      badge="Platform Operations"
      headline="Platform overview"
      tagline="System health, organizations, standards, and content — the whole platform from one place."
      primaryCta={{
        label: isSystem ? "System Admin" : "Site Admin",
        href: isSystem ? "/system-admin" : "/admin",
      }}
      features={[
        {
          title: isSystem ? "Site Admin" : "System Admin",
          description: "Organizations, users, and platform-wide controls.",
          href: isSystem ? "/admin" : "/system-admin",
          icon: ShieldCheck,
          cta: "Open console",
        },
        {
          title: "Analytics",
          description: "Adoption and engagement across every tenant.",
          href: "/analytics",
          icon: BarChart3,
          cta: "View analytics",
        },
        {
          title: "Standards Ingestion",
          description: "Sync and verify the standards catalog powering lessons.",
          href: "/admin/standards-ingestion",
          icon: ClipboardList,
          cta: "Manage standards",
        },
      ]}
    />
  );
}
