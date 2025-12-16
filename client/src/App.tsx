import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Dashboard from "@/pages/Dashboard";
import LessonGenerator from "@/pages/LessonGenerator";
import Assessments from "@/pages/Assessments";
import Careers from "@/pages/Careers";
import ActionPlans from "@/pages/ActionPlans";
import Resources from "@/pages/Resources";
import MyLessons from "@/pages/MyLessons";
import NotFound from "@/pages/not-found";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
