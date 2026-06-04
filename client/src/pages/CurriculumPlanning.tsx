import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Folder, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTier } from "@/hooks/use-tier";
import { MyPlansPanel, CampusAdminPanel } from "@/pages/ScopeSequence";
import { SourceDocumentsPanel } from "@/pages/CurriculumLibrary";

const VALID_TABS = ["plans", "documents", "admin"] as const;
type PlanningTab = (typeof VALID_TABS)[number];

export default function CurriculumPlanning() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { tier } = useTier();
  const isCampusAdmin = tier === "campus" || tier === "enterprise";

  const requestedTab = new URLSearchParams(search).get("tab");
  const initialTab: PlanningTab = (VALID_TABS as readonly string[]).includes(requestedTab ?? "")
    ? (requestedTab as PlanningTab)
    : "plans";

  const [tab, setTab] = useState<PlanningTab>(initialTab);

  // Keep the active tab in sync if the URL search param changes (e.g. legacy
  // redirects landing on /curriculum-planning?tab=documents).
  useEffect(() => {
    const next = new URLSearchParams(search).get("tab");
    if (next && (VALID_TABS as readonly string[]).includes(next)) {
      setTab(next as PlanningTab);
    }
  }, [search]);

  // Non-admins should never sit on the admin tab once their tier is known.
  // Keep the URL in sync with the corrected tab so state and address bar agree.
  useEffect(() => {
    if (tab === "admin" && tier && !isCampusAdmin) {
      setTab("plans");
      navigate("/curriculum-planning?tab=plans", { replace: true });
    }
  }, [tab, tier, isCampusAdmin, navigate]);

  const handleTabChange = (value: string) => {
    const next = value as PlanningTab;
    setTab(next);
    navigate(`/curriculum-planning?tab=${next}`, { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-80" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Map className="h-12 w-12 mx-auto text-lys-red mb-4" />
            <CardTitle className="font-permanent-marker text-2xl text-lys-red">
              Curriculum Planning
            </CardTitle>
            <CardDescription className="font-roboto">
              Plan your year, build scope &amp; sequence, and manage source documents. Sign in to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <a href="/api/login">Sign In to Continue</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-permanent-marker text-3xl text-lys-red mb-2" data-testid="text-curriculum-planning-title">
            Curriculum Planning
          </h1>
          <p className="font-roboto text-muted-foreground">
            Plan your year, build scope &amp; sequence, and manage your source curriculum documents — all in one place.
          </p>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <Map className="h-4 w-4 mr-2" />
              My Plans
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">
              <Folder className="h-4 w-4 mr-2" />
              Source Documents
            </TabsTrigger>
            {isCampusAdmin && (
              <TabsTrigger value="admin" data-testid="tab-campus-admin">
                <Building2 className="h-4 w-4 mr-2" />
                Campus Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="plans" className="mt-4">
            <MyPlansPanel />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <SourceDocumentsPanel />
          </TabsContent>
          {isCampusAdmin && (
            <TabsContent value="admin" className="mt-4">
              <CampusAdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
