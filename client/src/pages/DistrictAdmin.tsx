import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  School,
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  Building2,
  GraduationCap,
  Map,
  ClipboardList,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function DistrictAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: orgs } = useQuery<any[]>({
    queryKey: ["/api/organizations/mine"],
  });

  const districtOrg = orgs?.find(
    (o: any) => o.organization?.type === "district"
  );

  const { data: childOrgs } = useQuery<any[]>({
    queryKey: ["/api/organizations", districtOrg?.organization?.id, "children"],
    queryFn: async () => {
      if (!districtOrg?.organization?.id) return [];
      const res = await fetch(
        `/api/organizations/${districtOrg.organization.id}/children`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!districtOrg?.organization?.id,
  });

  const campuses = childOrgs?.filter(
    (o: any) => o.type === "school" || o.type === "campus"
  ) || [];

  const allowedRoles = ["district_admin", "site_admin", "system_admin"];
  if (!user || !allowedRoles.includes(user.role || "")) {
    return (
      <div className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-oswald mb-2">District Administration</h2>
        <p className="text-muted-foreground">
          You need district administrator privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-marker text-lys-red" data-testid="text-district-title">
          District Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage campuses, educators, and district-wide curriculum
          {districtOrg?.organization?.name && (
            <span className="font-medium"> — {districtOrg.organization.name}</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-campuses">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-lys-teal/10 p-2">
              <School className="h-5 w-5 text-lys-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold">{campuses.length}</p>
              <p className="text-xs text-muted-foreground">Campuses</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-educators">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-lys-yellow/10 p-2">
              <Users className="h-5 w-5 text-lys-yellow" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Educators</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-students">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-lys-red/10 p-2">
              <GraduationCap className="h-5 w-5 text-lys-red" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-lessons">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">Lessons Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <Building2 className="h-5 w-5 text-lys-teal" />
              Campuses
            </CardTitle>
            <CardDescription>
              Schools and campuses in your district
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campuses.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <School className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No campuses found in your district.</p>
                <p className="text-xs mt-1">Create organizations and assign them as schools under your district.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campuses.map((campus: any) => (
                  <div
                    key={campus.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate cursor-pointer"
                    data-testid={`card-campus-${campus.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{campus.name}</p>
                        {campus.city && (
                          <p className="text-xs text-muted-foreground">
                            {campus.city}, {campus.state}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {campus.status || "active"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-oswald flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-lys-yellow" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              District-wide management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setLocation("/scope-sequence")}
              data-testid="button-district-scopes"
            >
              <span className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                District Scope & Sequence
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setLocation("/admin/standards")}
              data-testid="button-district-standards"
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Standards Management
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setLocation("/analytics")}
              data-testid="button-district-analytics"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                District Analytics
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setLocation("/transfer-approvals")}
              data-testid="button-district-transfers"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Transfer Approvals
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
