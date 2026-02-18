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
import { OnboardingTour } from "@/components/OnboardingTour";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
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
import NotFound from "@/pages/not-found";
import { EmbedRouter } from "@/pages/EmbedRouter";

const EXEMPT_PATHS = ["/onboarding", "/pricing", "/shared", "/p/", "/embed/"];
const MAX_ONBOARDING_SKIPS = 3;
const SESSION_TRACKED_KEY = "lys_onboarding_session_tracked";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    
    const isExemptPath = EXEMPT_PATHS.some(path => location.startsWith(path));
    
    if (isAuthenticated && user && !user.onboardingCompleted && !isExemptPath) {
      const skipCount = user.onboardingSkipCount || 0;
      
      // Only force redirect if user has exceeded skip limit
      if (skipCount >= MAX_ONBOARDING_SKIPS) {
        setLocation("/onboarding");
        return;
      }
      
      // Auto-track session visit (once per browser session using sessionStorage)
      const sessionTracked = sessionStorage.getItem(SESSION_TRACKED_KEY);
      if (!sessionTracked && skipCount < MAX_ONBOARDING_SKIPS) {
        sessionStorage.setItem(SESSION_TRACKED_KEY, "true");
        // Silently increment skip count for this session
        fetch("/api/onboarding/skip", { method: "POST", credentials: "include" })
          .then(res => res.json())
          .catch(() => {});
      }
    }
  }, [isAuthenticated, user, isLoading, location, setLocation]);

  // Clear session tracking when onboarding is completed
  useEffect(() => {
    if (user?.onboardingCompleted) {
      sessionStorage.removeItem(SESSION_TRACKED_KEY);
    }
  }, [user?.onboardingCompleted]);

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Embed routes - handled separately without main layout */}
      <Route path="/embed/:rest*" component={EmbedRouter} />
      
      <Route path="/" component={Dashboard} />
      <Route path="/lesson-generator" component={LessonGenerator} />
      <Route path="/assessments" component={Assessments} />
      <Route path="/careers" component={Careers} />
      <Route path="/action-plans" component={ActionPlans} />
      <Route path="/resources" component={Resources} />
      <Route path="/my-lessons" component={MyLessons} />
      <Route path="/settings" component={Settings} />
      <Route path="/sis-integration" component={SISIntegration} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/scope-sequence" component={ScopeSequence} />
      <Route path="/scope/:id" component={ScopeEditor} />
      <Route path="/self-discovery" component={SelfDiscovery} />
      <Route path="/educator-influence" component={EducatorInfluence} />
      <Route path="/shared/:shareId" component={SharedLesson} />
      <Route path="/admin/standards" component={StandardsAdmin} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/assignments" component={Assignments} />
      <Route path="/collaboration" component={Collaboration} />
      <Route path="/collaboration/:id" component={Collaboration} />
      <Route path="/resource-library" component={ResourceLibrary} />
      <Route path="/admin" component={SiteAdmin} />
      <Route path="/system-admin" component={SystemAdmin} />
      <Route path="/parent-portal" component={ParentPortal} />
      <Route path="/milestones" component={Milestones} />
      <Route path="/classroom" component={Classroom} />
      <Route path="/student-journey/:studentId" component={StudentJourney} />
      <Route path="/student-dashboard/:studentId" component={StudentDashboard} />
      <Route path="/my-journey" component={MyJourney} />
      <Route path="/professional-development" component={ProfessionalDevelopment} />
      <Route path="/portfolio" component={PortfolioBuilder} />
      <Route path="/p/:slug" component={PortfolioView} />
      <Route path="/transfer-approvals" component={TransferApprovals} />
      <Route path="/gradebook" component={Gradebook} />
      <Route path="/lesson-authoring" component={LessonAuthoring} />
      <Route path="/admin/know-resources" component={KnowResourcesAdmin} />
      <Route path="/admin/matriculation" component={MatriculationAchievementAdmin} />
      <Route path="/alignment-dashboard" component={AlignmentDashboard} />
      <Route path="/scholarship-planner" component={ScholarshipPlanner} />
      <Route path="/essay-builder" component={EssayBuilder} />
      <Route path="/campus-activities" component={CampusActivities} />
      <Route path="/strengths-inventory" component={StrengthsInventory} />
      <Route path="/mentor-connect" component={MentorConnect} />
      <Route path="/district-admin" component={DistrictAdmin} />
      <Route path="/district-admin/campuses" component={DistrictAdmin} />
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
