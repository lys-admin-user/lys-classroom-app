import { Switch, Route, Redirect, useLocation, useSearch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ConsentBanner from "@/components/ConsentBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NeedsAnalyzerModal } from "@/components/NeedsAnalyzerModal";
import { OnboardingReminderBanner } from "@/components/OnboardingReminderBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { CommandPalette } from "@/components/CommandPalette";
import { ViewAsProvider, ViewAsStudentBanner } from "@/hooks/use-view-as";
import { PolicyReacceptModal } from "@/components/PolicyReacceptModal";
import { RoleRoutedLanding } from "@/components/RoleRoutedLanding";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MfaStepUpDialog } from "@/components/MfaStepUpDialog";
import { useMfaStatus, invalidateMfaStatus } from "@/hooks/use-mfa";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LogIn, Sparkles } from "lucide-react";

// Eager — homepage and tiny wrappers needed on first paint
import Dashboard from "@/pages/Dashboard";
import NeedsAnalyzerPage from "@/pages/NeedsAnalyzer";
import NotFound from "@/pages/not-found";

// Lazy — every other page is fetched on demand
const LessonGenerator = lazy(() => import("@/pages/LessonGenerator"));
const PracticeGenerator = lazy(() => import("@/pages/PracticeGenerator"));
const ForSchools = lazy(() => import("@/pages/ForSchools"));
const HomeschoolPlanner = lazy(() => import("@/pages/HomeschoolPlanner"));
const Assessments = lazy(() => import("@/pages/Assessments"));
const Careers = lazy(() => import("@/pages/Careers"));
const ActionPlans = lazy(() => import("@/pages/ActionPlans"));
const Resources = lazy(() => import("@/pages/Resources"));
const MyLessons = lazy(() => import("@/pages/MyLessons"));
const CurriculumPlanning = lazy(() => import("@/pages/CurriculumPlanning"));
const StandardsIngestionAdmin = lazy(() => import("@/pages/StandardsIngestionAdmin"));
const Settings = lazy(() => import("@/pages/Settings"));
const SharedLesson = lazy(() => import("@/pages/SharedLesson"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const ScopeEditor = lazy(() => import("@/pages/ScopeEditor"));
const SelfDiscovery = lazy(() => import("@/pages/SelfDiscovery"));
const EducatorInfluence = lazy(() => import("@/pages/EducatorInfluence"));
const StandardsAdmin = lazy(() => import("@/pages/StandardsAdmin"));
const AdminFoundation = lazy(() => import("@/pages/AdminFoundation"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Assignments = lazy(() => import("@/pages/Assignments"));
const Collaboration = lazy(() => import("@/pages/Collaboration"));
const ResourceLibrary = lazy(() => import("@/pages/ResourceLibrary"));
const SiteAdmin = lazy(() => import("@/pages/SiteAdmin"));
const SystemAdmin = lazy(() => import("@/pages/SystemAdmin"));
const ParentPortal = lazy(() => import("@/pages/ParentPortal"));
const ParentConnect = lazy(() => import("@/pages/ParentConnect"));
const Milestones = lazy(() => import("@/pages/Milestones"));
const Classroom = lazy(() => import("@/pages/Classroom"));
const ProfessionalDevelopment = lazy(() => import("@/pages/ProfessionalDevelopment"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const MyJourney = lazy(() => import("@/pages/MyJourney"));
const PortfolioBuilder = lazy(() => import("@/pages/PortfolioBuilder"));
const PortfolioView = lazy(() => import("@/pages/PortfolioView"));
const SISIntegration = lazy(() => import("@/pages/SISIntegration"));
const SsoAdmin = lazy(() => import("@/pages/SsoAdmin"));
const TransferApprovals = lazy(() => import("@/pages/TransferApprovals"));
const Gradebook = lazy(() => import("@/pages/Gradebook"));
const LessonAuthoring = lazy(() => import("@/pages/LessonAuthoring"));
const KnowResourcesAdmin = lazy(() => import("@/pages/KnowResourcesAdmin"));
const MatriculationAchievementAdmin = lazy(() => import("@/pages/MatriculationAchievementAdmin"));
const AlignmentDashboard = lazy(() => import("@/pages/AlignmentDashboard"));
const ScholarshipPlanner = lazy(() => import("@/pages/ScholarshipPlanner"));
const EssayBuilder = lazy(() => import("@/pages/EssayBuilder"));
const CampusActivities = lazy(() => import("@/pages/CampusActivities"));
const StrengthsInventory = lazy(() => import("@/pages/StrengthsInventory"));
const MentorConnect = lazy(() => import("@/pages/MentorConnect"));
const DistrictAdmin = lazy(() => import("@/pages/DistrictAdmin"));
const HelpDesk = lazy(() => import("@/pages/HelpDesk"));
const DevDocs = lazy(() => import("@/pages/DevDocs"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const AiPolicy = lazy(() => import("@/pages/AiPolicy"));
const EmbedRouter = lazy(() => import("@/pages/EmbedRouter").then(m => ({ default: m.EmbedRouter })));

const EXEMPT_PATHS = ["/onboarding", "/pricing", "/shared", "/p/", "/embed/", "/terms", "/privacy", "/ai-policy"];
const MAX_ONBOARDING_SKIPS = 3;
const SESSION_PROMPT_KEY = "lys_onboarding_prompted";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" data-testid="page-loader">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user || user.onboardingCompleted) return;

    const isExemptPath = EXEMPT_PATHS.some(path => location.startsWith(path));
    if (isExemptPath) return;

    const skipCount = user.onboardingSkipCount || 0;
    const loginCount = (user as any).loginCount || 0;

    // Brand-new users (first login, never skipped) go straight to onboarding
    if (loginCount <= 1 && skipCount === 0) {
      setLocation("/onboarding");
      return;
    }

    // Hard redirect once all skips are used
    if (skipCount >= MAX_ONBOARDING_SKIPS) {
      setLocation("/onboarding");
      return;
    }

    // Show the explicit prompt once per browser session for returning users who haven't completed
    const alreadyPrompted = sessionStorage.getItem(SESSION_PROMPT_KEY);
    if (!alreadyPrompted) {
      sessionStorage.setItem(SESSION_PROMPT_KEY, "true");
      setShowPrompt(true);
    }
  }, [isAuthenticated, user, isLoading, location, setLocation]);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      sessionStorage.removeItem(SESSION_PROMPT_KEY);
      setShowPrompt(false);
    }
  }, [user?.onboardingCompleted]);

  const handleGoToOnboarding = () => {
    setShowPrompt(false);
    setLocation("/onboarding");
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await fetch("/api/onboarding/skip", { method: "POST", credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch (_) {}
    setSkipping(false);
    setShowPrompt(false);
  };

  const skipCount = user?.onboardingSkipCount || 0;
  const skipsRemaining = MAX_ONBOARDING_SKIPS - skipCount - 1; // -1 for this dismissal

  return (
    <>
      {children}
      <Dialog open={showPrompt} onOpenChange={(open) => { if (!open) handleSkip(); }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-onboarding-prompt">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-oswald text-xl">
              <Sparkles className="h-5 w-5 text-lys-yellow" />
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-base">
              Set up your profile to unlock personalized lesson recommendations, career matching, and your full LYS experience.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {skipsRemaining > 0 ? (
              <p className="text-sm text-muted-foreground">
                You can skip for now — you have <strong>{skipsRemaining} reminder{skipsRemaining !== 1 ? "s" : ""}</strong> remaining before setup is required.
              </p>
            ) : (
              <p className="text-sm text-amber-600 font-medium">
                This is your last chance to skip. After this, setup will be required.
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={skipping}
              data-testid="button-onboarding-skip"
            >
              {skipping ? "Saving..." : skipsRemaining > 0 ? "Remind Me Later" : "Skip (Last Time)"}
            </Button>
            <Button
              onClick={handleGoToOnboarding}
              className="gap-2"
              data-testid="button-onboarding-start"
            >
              <Sparkles className="h-4 w-4" />
              Set Up My Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AuthRequired({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-permanent-marker text-2xl">Sign In Required</CardTitle>
            <CardDescription className="font-roboto">
              Please sign in with your Replit account to access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="bg-lys-yellow text-black font-oswald gap-2"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-auth-required-login"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return <>{children}</>;
}

function withAuth(Component: React.ComponentType<any>) {
  return function AuthWrapped(props: any) {
    return <AuthRequired><Component {...props} /></AuthRequired>;
  };
}

const AuthLessonGenerator = withAuth(LessonGenerator);
const AuthActionPlans = withAuth(ActionPlans);
const AuthMyLessons = withAuth(MyLessons);
const AuthCurriculumPlanning = withAuth(CurriculumPlanning);
const AuthStandardsIngestionAdmin = withAuth(StandardsIngestionAdmin);
const AuthSettings = withAuth(Settings);
const AuthSISIntegration = withAuth(SISIntegration);
const AuthSsoAdmin = withAuth(SsoAdmin);
const AuthAnalytics = withAuth(Analytics);
const AuthScopeEditor = withAuth(ScopeEditor);
const AuthEducatorInfluence = withAuth(EducatorInfluence);
const AuthAssignments = withAuth(Assignments);
const AuthCollaboration = withAuth(Collaboration);
const AuthResourceLibrary = withAuth(ResourceLibrary);
const AuthSiteAdmin = withAuth(SiteAdmin);
const AuthSystemAdmin = withAuth(SystemAdmin);
const AuthAdminFoundation = withAuth(AdminFoundation);
const AuthParentPortal = withAuth(ParentPortal);
const AuthMilestones = withAuth(Milestones);
const AuthClassroom = withAuth(Classroom);
const AuthStudentDashboard = withAuth(StudentDashboard);
const AuthMyJourney = withAuth(MyJourney);
const AuthProfessionalDevelopment = withAuth(ProfessionalDevelopment);
const AuthPortfolioBuilder = withAuth(PortfolioBuilder);
const AuthTransferApprovals = withAuth(TransferApprovals);
const AuthGradebook = withAuth(Gradebook);
const AuthLessonAuthoring = withAuth(LessonAuthoring);
const AuthKnowResourcesAdmin = withAuth(KnowResourcesAdmin);
const AuthMatriculationAdmin = withAuth(MatriculationAchievementAdmin);
const AuthAlignmentDashboard = withAuth(AlignmentDashboard);
const AuthScholarshipPlanner = withAuth(ScholarshipPlanner);
const AuthEssayBuilder = withAuth(EssayBuilder);
const AuthCampusActivities = withAuth(CampusActivities);
const AuthStrengthsInventory = withAuth(StrengthsInventory);
const AuthDistrictAdmin = withAuth(DistrictAdmin);
const AuthStandardsAdmin = withAuth(StandardsAdmin);
const AuthOnboarding = withAuth(Onboarding);
const AuthDevDocs = withAuth(DevDocs);

function RedirectTo({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to, navigate]);
  return <PageLoader />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/embed/:rest*" component={EmbedRouter} />
        
        {/* Public exploration pages — no sign-in required */}
        <Route path="/" component={Dashboard} />
        <Route path="/start" component={NeedsAnalyzerPage} />
        <Route path="/lesson-generator" component={LessonGenerator} />
        <Route path="/practice" component={PracticeGenerator} />
        <Route path="/for-schools" component={ForSchools} />
        <Route path="/homeschool" component={HomeschoolPlanner} />
        <Route path="/assessments" component={Assessments} />
        <Route path="/careers" component={Careers} />
        <Route path="/resources" component={Resources} />
        <Route path="/self-discovery" component={SelfDiscovery} />
        <Route path="/mentor-connect" component={MentorConnect} />
        <Route path="/shared/:shareId" component={SharedLesson} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/ai-policy" component={AiPolicy} />
        <Route path="/help" component={HelpDesk} />
        <Route path="/p/:slug" component={PortfolioView} />

        {/* Personal-data pages that need a signed-in account */}
        <Route path="/action-plans" component={AuthActionPlans} />
        <Route path="/strengths-inventory" component={AuthStrengthsInventory} />
        <Route path="/scholarship-planner" component={AuthScholarshipPlanner} />
        <Route path="/onboarding" component={AuthOnboarding} />

        {/* Account-required pages — personal data or admin tools */}
        <Route path="/my-lessons" component={AuthMyLessons} />
        <Route path="/curriculum-planning" component={AuthCurriculumPlanning} />
        {/* Legacy routes — redirect into the merged Curriculum Planning hub */}
        <Route path="/curriculum-library">
          <RedirectTo to="/curriculum-planning?tab=documents" />
        </Route>
        <Route path="/admin/standards-ingestion" component={AuthStandardsIngestionAdmin} />
        <Route path="/settings" component={AuthSettings} />
        <Route path="/sis-integration" component={AuthSISIntegration} />
        <Route path="/sso-admin" component={AuthSsoAdmin} />
        <Route path="/analytics" component={AuthAnalytics} />
        <Route path="/scope-sequence">
          <RedirectTo to="/curriculum-planning" />
        </Route>
        <Route path="/scope/:id" component={AuthScopeEditor} />
        <Route path="/educator-influence" component={AuthEducatorInfluence} />
        <Route path="/admin/standards" component={AuthStandardsAdmin} />
        <Route path="/admin/foundation" component={AuthAdminFoundation} />
        <Route path="/assignments" component={AuthAssignments} />
        <Route path="/collaboration" component={AuthCollaboration} />
        <Route path="/collaboration/:id" component={AuthCollaboration} />
        <Route path="/resource-library" component={AuthResourceLibrary} />
        <Route path="/admin" component={AuthSiteAdmin} />
        <Route path="/system-admin/:tab" component={AuthSystemAdmin} />
        <Route path="/system-admin" component={AuthSystemAdmin} />
        <Route path="/parent-portal" component={AuthParentPortal} />
        <Route path="/parent-connect" component={ParentConnect} />
        <Route path="/milestones" component={AuthMilestones} />
        <Route path="/classroom" component={AuthClassroom} />
        <Route path="/student-journey/:studentId">
          {(params) => <Redirect to={`/student-dashboard/${params.studentId}`} />}
        </Route>
        <Route path="/student-dashboard/:studentId" component={AuthStudentDashboard} />
        <Route path="/my-journey" component={AuthMyJourney} />
        <Route path="/professional-development" component={AuthProfessionalDevelopment} />
        <Route path="/portfolio" component={AuthPortfolioBuilder} />
        <Route path="/transfer-approvals" component={AuthTransferApprovals} />
        <Route path="/gradebook" component={AuthGradebook} />
        <Route path="/lesson-authoring" component={AuthLessonAuthoring} />
        <Route path="/admin/know-resources" component={AuthKnowResourcesAdmin} />
        <Route path="/admin/matriculation" component={AuthMatriculationAdmin} />
        <Route path="/alignment-dashboard" component={AuthAlignmentDashboard} />
        <Route path="/essay-builder" component={AuthEssayBuilder} />
        <Route path="/campus-activities" component={AuthCampusActivities} />
        <Route path="/district-admin" component={AuthDistrictAdmin} />
        <Route path="/district-admin/campuses" component={AuthDistrictAdmin} />
        <Route path="/dev-docs" component={AuthDevDocs} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function TourManager() {
  const searchString = useSearch();
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [tourRole, setTourRole] = useState("");
  const [tourGoal, setTourGoal] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("tour") === "true") {
      const alreadyCompleted = localStorage.getItem("lys_tour_completed") === "true";
      if (alreadyCompleted) {
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }
      const role = params.get("role") || user?.role || "student";
      const goal = params.get("goal") || "";
      setTourRole(role);
      setTourGoal(goal);
      setShowTour(true);

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchString, user?.role]);

  const handleTourComplete = () => {
    setShowTour(false);
  };

  if (!showTour) return null;

  return (
    <OnboardingTour
      role={tourRole}
      primaryGoal={tourGoal}
      onComplete={handleTourComplete}
    />
  );
}

// Educator-and-up accounts must clear a second factor (authenticator app OR an
// emailed code) before they can mutate data this session. The server enforces
// this; this gate surfaces a non-dismissable challenge so the user can satisfy
// it. It no-ops when login MFA isn't required (students/parents, or already
// verified), and when login MFA isn't configured server-side (loginMfaRequired
// stays false), so it degrades gracefully without any keys.
function LoginMfaGate() {
  const { isAuthenticated } = useAuth();
  const { data: status } = useMfaStatus(isAuthenticated);

  const required = !!status?.loginMfaRequired;
  if (!required) return null;

  return (
    <MfaStepUpDialog
      open
      enrollmentRequired={false}
      dismissable={false}
      purpose="login"
      methods={status?.methods}
      title="Two-factor verification required"
      description="Your role requires a second factor each session. Verify with your authenticator app or an emailed code to continue."
      onClose={() => {}}
      onVerified={() => invalidateMfaStatus()}
    />
  );
}

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const sidebarStyle = {
    // Wide enough for the 72px icon rail + 280px category flyout. Collapsing
    // (via the header toggle) shrinks to just the rail (--sidebar-width-icon).
    "--sidebar-width": "22rem",
    "--sidebar-width-icon": "4.5rem",
  };

  // Anonymous visitors landing on "/" get the full-screen role-routed landing
  // page (no app sidebar/header/footer) — it's a pre-login marketing surface.
  if (!isLoading && !isAuthenticated && location === "/") {
    return <RoleRoutedLanding />;
  }

  // The school-admin "See it for your school" page is a pre-login marketing
  // surface (reached from the landing's admin card), so anonymous visitors see
  // it full-screen without the app sidebar/header/footer.
  if (!isLoading && !isAuthenticated && location === "/for-schools") {
    return (
      <Suspense fallback={<PageLoader />}>
        <ForSchools />
      </Suspense>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <ImpersonationBanner />
          <ViewAsStudentBanner />
          <TrialBanner />
          <OnboardingReminderBanner />
          <Header />
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
          <Footer />
        </SidebarInset>
      </div>
      <TourManager />
      <CommandPalette />
      <PolicyReacceptModal />
      <LoginMfaGate />
    </SidebarProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ViewAsProvider>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
            <NeedsAnalyzerModal />
            <Toaster />
            <ConsentBanner />
          </ViewAsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
