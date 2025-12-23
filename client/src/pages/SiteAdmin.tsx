import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Shield, Building2, Users, Plus, Trash2, Settings, BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import type { Organization, SiteAdmin } from "@shared/schema";

export default function SiteAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", type: "school", tier: "campus" });

  const { data: adminCheck, isLoading: checkLoading } = useQuery<{ isSiteAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<{
    totalOrganizations: number;
    activeOrganizations: number;
    totalSiteAdmins: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: siteAdmins = [] } = useQuery<SiteAdmin[]>({
    queryKey: ["/api/admin/site-admins"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof newOrg) => {
      return await apiRequest("POST", "/api/admin/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsCreateOrgOpen(false);
      setNewOrg({ name: "", slug: "", type: "school", tier: "campus" });
      toast({ title: "Organization created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create organization", variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Organization deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete organization", variant: "destructive" });
    },
  });

  if (authLoading || checkLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (!adminCheck?.isSiteAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="font-marker text-xl">Access Denied</CardTitle>
            <CardDescription>
              You do not have site administrator privileges. Contact a platform administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-md bg-destructive/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
            Site Administration
          </h1>
          <p className="font-roboto text-muted-foreground">
            Platform-wide management and configuration
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeOrganizations || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Site Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSiteAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">Platform administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium">Platform Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organizations" data-testid="tab-organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="admins" data-testid="tab-admins">
            <Shield className="h-4 w-4 mr-2" />
            Site Admins
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Manage Organizations</h2>
            <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-org">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Add a new school, district, or university to the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="Lincoln High School"
                      data-testid="input-org-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-slug">URL Slug</Label>
                    <Input
                      id="org-slug"
                      value={newOrg.slug}
                      onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                      placeholder="lincoln-high"
                      data-testid="input-org-slug"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-type">Type</Label>
                    <Select
                      value={newOrg.type}
                      onValueChange={(value) => setNewOrg({ ...newOrg, type: value })}
                    >
                      <SelectTrigger data-testid="select-org-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="district">District</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-tier">Tier</Label>
                    <Select
                      value={newOrg.tier}
                      onValueChange={(value) => setNewOrg({ ...newOrg, tier: value })}
                    >
                      <SelectTrigger data-testid="select-org-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="campus">Campus ($99/mo)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOrgOpen(false)}
                    data-testid="button-cancel-org"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createOrgMutation.mutate(newOrg)}
                    disabled={!newOrg.name || !newOrg.slug || createOrgMutation.isPending}
                    data-testid="button-submit-org"
                  >
                    {createOrgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {orgsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No organizations yet</p>
                <p className="text-sm text-muted-foreground">Create your first organization to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {organizations.map((org) => (
                <Card key={org.id} data-testid={`card-org-${org.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription>/{org.slug}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>
                        {org.status}
                      </Badge>
                      <Badge variant="outline">
                        {org.tier}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteOrgMutation.mutate(org.id)}
                        disabled={deleteOrgMutation.isPending}
                        data-testid={`button-delete-org-${org.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(org as any).maxMembers || "Unlimited"} members allowed
                      </span>
                      <span>Type: {org.type}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Site Administrators</h2>
          </div>

          {siteAdmins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No site administrators configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {siteAdmins.map((admin) => (
                <Card key={admin.id} data-testid={`card-admin-${admin.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <CardTitle className="text-base">User: {admin.userId}</CardTitle>
                        <CardDescription>
                          Added {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "Unknown"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="destructive">Super Admin</Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="font-oswald text-xl">Platform Settings</h2>
          <Card>
            <CardContent className="py-8 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Platform configuration options coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Email templates, feature flags, and more
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
