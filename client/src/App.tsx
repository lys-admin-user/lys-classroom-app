import { Switch, Route, useLocation, useSearch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OnboardingReminderBanner } from "@/components/OnboardingReminderBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LogIn, Sparkles, X } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import LessonGenerator from "@/pages/LessonGenerator";
import Assessments from "@/pages/Assessments";
import Careers from "@/pages/Careers";
import ActionPlans from "@/pages/ActionPlans";
import Resources from "@/pages/Resources";
import MyLessons from "@/pages/MyLessons";
import Settings from "@/pages/Settings";
import SharedLesson from "@/pages/SharedLesson";
import Analytics from "@/pages/Analytics";
import ScopeSequence from "@/pages/ScopeSequence";
import ScopeEditor from "@/pages/ScopeEditor";
import SelfDiscovery from "@/pages/SelfDiscovery";
import EducatorInfluence from "@/pages/EducatorInfluence";
import StandardsAdmin from "@/pages/StandardsAdmin";
import Pricing from "@/pages/Pricing";
import Onboarding from "@/pages/Onboarding";
import Assignments from "@/pages/Assignments";
import Collaboration from "@/pages/Collaboration";
import ResourceLibrary from "@/pages/ResourceLibrary";
import SiteAdmin from "@/pages/SiteAdmin";
import SystemAdmin from "@/pages/SystemAdmin";
import ParentPortal from "@/pages/ParentPortal";
import ParentConnect from "@/pages/ParentConnect";
import Milestones from "@/pages/Milestones";
import Classroom from "@/pages/Classroom";
import ProfessionalDevelopment from "@/pages/ProfessionalDevelopment";
import StudentJourney from "@/pages/StudentJourney";
import StudentDashboard from "@/pages/StudentDashboard";
import MyJourney from "@/pages/MyJourney";
import PortfolioBuilder from "@/pages/PortfolioBuilder";
import PortfolioView from "@/pages/PortfolioView";
import SISIntegration from "@/pages/SISIntegration";
import TransferApprovals from "@/pages/TransferApprovals";
import Gradebook from "@/pages/Gradebook";
import LessonAuthoring from "@/pages/LessonAuthoring";
import KnowResourcesAdmin from "@/pages/KnowResourcesAdmin";
import MatriculationAchievementAdmin from "@/pages/MatriculationAchievementAdmin";
import AlignmentDashboard from "@/pages/AlignmentDashboard";
import ScholarshipPlanner from "@/pages/ScholarshipPlanner";
import EssayBuilder from "@/pages/EssayBuilder";
import CampusActivities from "@/pages/CampusActivities";
import StrengthsInventory from "@/pages/StrengthsInventory";
import MentorConnect from "@/pages/MentorConnect";
import DistrictAdmin from "@/pages/DistrictAdmin";
import HelpDesk from "@/pages/HelpDesk";
import DevDocs from "@/pages/DevDocs";
import NotFound from "@/pages/not-found";
import { EmbedRouter } from "@/pages/EmbedRouter";

const EXEMPT_PATHS = ["/onboarding", "/pricing", "/shared", "/p/", "/embed/"];
const MAX_ONBOARDING_SKIPS = 3;
const SESSION_PROMPT_KEY = "lys_onboarding_prompted";

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

const AuthDashboard = withAuth(Dashboard);
const AuthLessonGenerator = withAuth(LessonGenerator);
const AuthActionPlans = withAuth(ActionPlans);
const AuthMyLessons = withAuth(MyLessons);
const AuthSettings = withAuth(Settings);
const AuthSISIntegration = withAuth(SISIntegration);
const AuthAnalytics = withAuth(Analytics);
const AuthScopeSequence = withAuth(ScopeSequence);
const AuthScopeEditor = withAuth(ScopeEditor);
const AuthEducatorInfluence = withAuth(EducatorInfluence);
const AuthAssignments = withAuth(Assignments);
const AuthCollaboration = withAuth(Collaboration);
const AuthResourceLibrary = withAuth(ResourceLibrary);
const AuthSiteAdmin = withAuth(SiteAdmin);
const AuthSystemAdmin = withAuth(SystemAdmin);
const AuthParentPortal = withAuth(ParentPortal);
const AuthMilestones = withAuth(Milestones);
const AuthClassroom = withAuth(Classroom);
const AuthStudentJourney = withAuth(StudentJourney);
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
const AuthMentorConnect = withAuth(MentorConnect);
const AuthDistrictAdmin = withAuth(DistrictAdmin);
const AuthStandardsAdmin = withAuth(StandardsAdmin);

function Router() {
  return (
    <Switch>
      <Route path="/embed/:rest*" component={EmbedRouter} />
      
      {/* Public exploration pages — no sign-in required */}
      <Route path="/" component={Dashboard} />
      <Route path="/lesson-generator" component={LessonGenerator} />
      <Route path="/assessments" component={Assessments} />
      <Route path="/careers" component={Careers} />
      <Route path="/action-plans" component={ActionPlans} />
      <Route path="/resources" component={Resources} />
      <Route path="/self-discovery" component={SelfDiscovery} />
      <Route path="/strengths-inventory" component={StrengthsInventory} />
      <Route path="/scholarship-planner" component={ScholarshipPlanner} />
      <Route path="/mentor-connect" component={MentorConnect} />
      <Route path="/shared/:shareId" component={SharedLesson} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/help" component={HelpDesk} />
      <Route path="/p/:slug" component={PortfolioView} />

      {/* Account-required pages — personal data or admin tools */}
      <Route path="/my-lessons" component={AuthMyLessons} />
      <Route path="/settings" component={AuthSettings} />
      <Route path="/sis-integration" component={AuthSISIntegration} />
      <Route path="/analytics" component={AuthAnalytics} />
      <Route path="/scope-sequence" component={AuthScopeSequence} />
      <Route path="/scope/:id" component={AuthScopeEditor} />
      <Route path="/educator-influence" component={AuthEducatorInfluence} />
      <Route path="/admin/standards" component={AuthStandardsAdmin} />
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
      <Route path="/student-journey/:studentId" component={AuthStudentJourney} />
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
      <Route path="/dev-docs" component={DevDocs} />
      <Route component={NotFound} />
    </Switch>
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

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingGuard>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1">
                <ImpersonationBanner />
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
          </SidebarProvider>
        </OnboardingGuard>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
