import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
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
import NotFound from "@/pages/not-found";

const EXEMPT_PATHS = ["/onboarding", "/pricing", "/shared"];

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    
    const isExemptPath = EXEMPT_PATHS.some(path => location.startsWith(path));
    
    if (isAuthenticated && user && !user.onboardingCompleted && !isExemptPath) {
      setLocation("/onboarding");
    }
  }, [isAuthenticated, user, isLoading, location, setLocation]);

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/lesson-generator" component={LessonGenerator} />
      <Route path="/assessments" component={Assessments} />
      <Route path="/careers" component={Careers} />
      <Route path="/action-plans" component={ActionPlans} />
      <Route path="/resources" component={Resources} />
      <Route path="/my-lessons" component={MyLessons} />
      <Route path="/settings" component={Settings} />
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
      <Route path="/professional-development" component={ProfessionalDevelopment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingGuard>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
        </OnboardingGuard>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
