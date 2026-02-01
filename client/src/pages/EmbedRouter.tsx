import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { EmbedWrapper, FullSiteEmbed } from "@/components/EmbedWrapper";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

import Dashboard from "@/pages/Dashboard";
import LessonGenerator from "@/pages/LessonGenerator";
import Assessments from "@/pages/Assessments";
import Careers from "@/pages/Careers";
import SelfDiscovery from "@/pages/SelfDiscovery";
import Pricing from "@/pages/Pricing";
import Gradebook from "@/pages/Gradebook";
import PortfolioBuilder from "@/pages/PortfolioBuilder";
import PortfolioView from "@/pages/PortfolioView";
import ParentPortal from "@/pages/ParentPortal";
import MyJourney from "@/pages/MyJourney";
import Milestones from "@/pages/Milestones";
import ActionPlans from "@/pages/ActionPlans";
import ResourceLibrary from "@/pages/ResourceLibrary";
import ScopeSequence from "@/pages/ScopeSequence";
import Classroom from "@/pages/Classroom";
import Assignments from "@/pages/Assignments";
import MyLessons from "@/pages/MyLessons";
import Analytics from "@/pages/Analytics";
import EducatorInfluence from "@/pages/EducatorInfluence";
import ProfessionalDevelopment from "@/pages/ProfessionalDevelopment";
import LessonAuthoring from "@/pages/LessonAuthoring";
import SiteAdmin from "@/pages/SiteAdmin";

function EmbedPage({ component: Component }: { component: React.ComponentType }) {
  useEffect(() => {
    if (window.parent !== window) {
      const sendHeight = () => {
        const height = document.body.scrollHeight;
        window.parent.postMessage({ type: 'lys-resize', height }, '*');
      };
      sendHeight();
      const observer = new ResizeObserver(sendHeight);
      observer.observe(document.body);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <EmbedWrapper>
      <div className="p-4">
        <Component />
      </div>
    </EmbedWrapper>
  );
}

function FullSiteEmbedContent() {
  const [location] = useLocation();
  
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'lys-route-change', path: location }, '*');
    }
  }, [location]);

  const sidebarStyle = {
    "--sidebar-width": "14rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <FullSiteEmbed>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/embed/full" component={Dashboard} />
                <Route path="/embed/full/dashboard" component={Dashboard} />
                <Route path="/embed/full/lesson-generator" component={LessonGenerator} />
                <Route path="/embed/full/careers" component={Careers} />
                <Route path="/embed/full/self-discovery" component={SelfDiscovery} />
                <Route path="/embed/full/gradebook" component={Gradebook} />
                <Route path="/embed/full/portfolio" component={PortfolioBuilder} />
                <Route path="/embed/full/parent-portal" component={ParentPortal} />
                <Route path="/embed/full/my-journey" component={MyJourney} />
                <Route path="/embed/full/milestones" component={Milestones} />
                <Route path="/embed/full/action-plans" component={ActionPlans} />
                <Route path="/embed/full/resource-library" component={ResourceLibrary} />
                <Route path="/embed/full/scope-sequence" component={ScopeSequence} />
                <Route path="/embed/full/classroom" component={Classroom} />
                <Route path="/embed/full/assignments" component={Assignments} />
                <Route path="/embed/full/my-lessons" component={MyLessons} />
                <Route path="/embed/full/analytics" component={Analytics} />
                <Route path="/embed/full/educator-influence" component={EducatorInfluence} />
                <Route path="/embed/full/professional-development" component={ProfessionalDevelopment} />
                <Route path="/embed/full/lesson-authoring" component={LessonAuthoring} />
                <Route path="/embed/full/admin" component={SiteAdmin} />
                <Route component={Dashboard} />
              </Switch>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </FullSiteEmbed>
  );
}

export function EmbedRouter() {
  return (
    <Switch>
      {/* Individual widget embeds */}
      <Route path="/embed/lesson-generator">
        <EmbedPage component={LessonGenerator} />
      </Route>
      <Route path="/embed/careers">
        <EmbedPage component={Careers} />
      </Route>
      <Route path="/embed/self-discovery">
        <EmbedPage component={SelfDiscovery} />
      </Route>
      <Route path="/embed/pricing">
        <EmbedPage component={Pricing} />
      </Route>
      <Route path="/embed/gradebook">
        <EmbedPage component={Gradebook} />
      </Route>
      <Route path="/embed/portfolio">
        <EmbedPage component={PortfolioBuilder} />
      </Route>
      <Route path="/embed/portfolio/:slug">
        <EmbedPage component={PortfolioView} />
      </Route>
      <Route path="/embed/parent-portal">
        <EmbedPage component={ParentPortal} />
      </Route>
      <Route path="/embed/my-journey">
        <EmbedPage component={MyJourney} />
      </Route>
      <Route path="/embed/milestones">
        <EmbedPage component={Milestones} />
      </Route>
      <Route path="/embed/action-plans">
        <EmbedPage component={ActionPlans} />
      </Route>
      <Route path="/embed/assessments">
        <EmbedPage component={Assessments} />
      </Route>
      <Route path="/embed/resource-library">
        <EmbedPage component={ResourceLibrary} />
      </Route>
      <Route path="/embed/scope-sequence">
        <EmbedPage component={ScopeSequence} />
      </Route>
      <Route path="/embed/classroom">
        <EmbedPage component={Classroom} />
      </Route>
      <Route path="/embed/assignments">
        <EmbedPage component={Assignments} />
      </Route>
      <Route path="/embed/my-lessons">
        <EmbedPage component={MyLessons} />
      </Route>
      <Route path="/embed/dashboard">
        <EmbedPage component={Dashboard} />
      </Route>
      <Route path="/embed/analytics">
        <EmbedPage component={Analytics} />
      </Route>
      <Route path="/embed/educator-influence">
        <EmbedPage component={EducatorInfluence} />
      </Route>
      <Route path="/embed/professional-development">
        <EmbedPage component={ProfessionalDevelopment} />
      </Route>
      <Route path="/embed/lesson-authoring">
        <EmbedPage component={LessonAuthoring} />
      </Route>
      <Route path="/embed/admin">
        <EmbedPage component={SiteAdmin} />
      </Route>
      
      {/* Full site embed with navigation */}
      <Route path="/embed/full/:rest*">
        <FullSiteEmbedContent />
      </Route>
      <Route path="/embed/full">
        <FullSiteEmbedContent />
      </Route>
    </Switch>
  );
}
