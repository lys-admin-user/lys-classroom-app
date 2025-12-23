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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Shield, Building2, Users, Plus, Trash2, Settings, BarChart3, AlertTriangle, Loader2, Flag, Mail, Edit2, ToggleLeft, Percent } from "lucide-react";
import type { Organization, SiteAdmin, FeatureFlag, EmailTemplate } from "@shared/schema";

export default function SiteAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", type: "school", tier: "campus" });
  
  const [isCreateFlagOpen, setIsCreateFlagOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [newFlag, setNewFlag] = useState({ name: "", description: "", isEnabled: false, rolloutPercentage: 100, allowedRoles: [] as string[] });
  
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", category: "notification", htmlContent: "", textContent: "", variables: [] as string[], isActive: true });

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

  const { data: featureFlags = [], isLoading: flagsLoading } = useQuery<FeatureFlag[]>({
    queryKey: ["/api/admin/feature-flags"],
    enabled: adminCheck?.isSiteAdmin,
  });

  const { data: emailTemplates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
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

  const createFlagMutation = useMutation({
    mutationFn: async (data: typeof newFlag) => {
      return await apiRequest("POST", "/api/admin/feature-flags", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      setIsCreateFlagOpen(false);
      setNewFlag({ name: "", description: "", isEnabled: false, rolloutPercentage: 100, allowedRoles: [] });
      toast({ title: "Feature flag created" });
    },
    onError: () => {
      toast({ title: "Failed to create feature flag", variant: "destructive" });
    },
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeatureFlag> }) => {
      return await apiRequest("PATCH", `/api/admin/feature-flags/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      setEditingFlag(null);
      toast({ title: "Feature flag updated" });
    },
    onError: () => {
      toast({ title: "Failed to update feature flag", variant: "destructive" });
    },
  });

  const deleteFlagMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/feature-flags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-flags"] });
      toast({ title: "Feature flag deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete feature flag", variant: "destructive" });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      return await apiRequest("POST", "/api/admin/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setIsCreateTemplateOpen(false);
      setNewTemplate({ name: "", subject: "", category: "notification", htmlContent: "", textContent: "", variables: [], isActive: true });
      toast({ title: "Email template created" });
    },
    onError: () => {
      toast({ title: "Failed to create email template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) => {
      return await apiRequest("PATCH", `/api/admin/email-templates/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setEditingTemplate(null);
      toast({ title: "Email template updated" });
    },
    onError: () => {
      toast({ title: "Failed to update email template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Email template deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete email template", variant: "destructive" });
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="organizations" data-testid="tab-organizations">
            <Building2 className="h-4 w-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="admins" data-testid="tab-admins">
            <Shield className="h-4 w-4 mr-2" />
            Site Admins
          </TabsTrigger>
          <TabsTrigger value="feature-flags" data-testid="tab-feature-flags">
            <Flag className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="email-templates" data-testid="tab-email-templates">
            <Mail className="h-4 w-4 mr-2" />
            Email Templates
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

        <TabsContent value="feature-flags" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Feature Flags</h2>
            <Dialog open={isCreateFlagOpen} onOpenChange={setIsCreateFlagOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-flag">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Feature Flag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature Flag</DialogTitle>
                  <DialogDescription>
                    Add a new feature flag to control feature rollout.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="flag-name">Flag Name</Label>
                    <Input
                      id="flag-name"
                      value={newFlag.name}
                      onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                      placeholder="new_feature_enabled"
                      data-testid="input-flag-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="flag-description">Description</Label>
                    <Textarea
                      id="flag-description"
                      value={newFlag.description}
                      onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                      placeholder="Enables the new feature for users"
                      data-testid="input-flag-description"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Enabled</Label>
                      <p className="text-sm text-muted-foreground">Turn this feature on or off</p>
                    </div>
                    <Switch
                      checked={newFlag.isEnabled}
                      onCheckedChange={(checked) => setNewFlag({ ...newFlag, isEnabled: checked })}
                      data-testid="switch-flag-enabled"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label>Rollout Percentage</Label>
                      <span className="text-sm text-muted-foreground">{newFlag.rolloutPercentage}%</span>
                    </div>
                    <Slider
                      value={[newFlag.rolloutPercentage]}
                      onValueChange={([value]) => setNewFlag({ ...newFlag, rolloutPercentage: value })}
                      max={100}
                      step={1}
                      data-testid="slider-flag-rollout"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateFlagOpen(false)} data-testid="button-cancel-flag">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createFlagMutation.mutate(newFlag)}
                    disabled={!newFlag.name || createFlagMutation.isPending}
                    data-testid="button-submit-flag"
                  >
                    {createFlagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {flagsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : featureFlags.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No feature flags configured</p>
                <p className="text-sm text-muted-foreground">Create feature flags to control feature rollout</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {featureFlags.map((flag) => (
                <Card key={flag.id} data-testid={`card-flag-${flag.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${flag.isEnabled ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}>
                        <ToggleLeft className={`h-5 w-5 ${flag.isEnabled ? "text-green-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-mono">{flag.name}</CardTitle>
                        <CardDescription>{flag.description || "No description"}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                        {flag.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {flag.rolloutPercentage}%
                      </Badge>
                      <Switch
                        checked={flag.isEnabled}
                        onCheckedChange={(checked) => updateFlagMutation.mutate({ id: flag.id, updates: { isEnabled: checked } })}
                        data-testid={`switch-flag-${flag.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingFlag(flag)}
                        data-testid={`button-edit-flag-${flag.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteFlagMutation.mutate(flag.id)}
                        disabled={deleteFlagMutation.isPending}
                        data-testid={`button-delete-flag-${flag.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingFlag} onOpenChange={(open) => !open && setEditingFlag(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Feature Flag</DialogTitle>
                <DialogDescription>Update the feature flag settings.</DialogDescription>
              </DialogHeader>
              {editingFlag && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Flag Name</Label>
                    <Input value={editingFlag.name} disabled className="bg-muted" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-flag-description">Description</Label>
                    <Textarea
                      id="edit-flag-description"
                      value={editingFlag.description || ""}
                      onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                      data-testid="input-edit-flag-description"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label>Enabled</Label>
                    <Switch
                      checked={editingFlag.isEnabled}
                      onCheckedChange={(checked) => setEditingFlag({ ...editingFlag, isEnabled: checked })}
                      data-testid="switch-edit-flag-enabled"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label>Rollout Percentage</Label>
                      <span className="text-sm text-muted-foreground">{editingFlag.rolloutPercentage}%</span>
                    </div>
                    <Slider
                      value={[editingFlag.rolloutPercentage]}
                      onValueChange={([value]) => setEditingFlag({ ...editingFlag, rolloutPercentage: value })}
                      max={100}
                      step={1}
                      data-testid="slider-edit-flag-rollout"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingFlag(null)} data-testid="button-cancel-edit-flag">
                  Cancel
                </Button>
                <Button
                  onClick={() => editingFlag && updateFlagMutation.mutate({
                    id: editingFlag.id,
                    updates: {
                      description: editingFlag.description,
                      isEnabled: editingFlag.isEnabled,
                      rolloutPercentage: editingFlag.rolloutPercentage,
                    }
                  })}
                  disabled={updateFlagMutation.isPending}
                  data-testid="button-submit-edit-flag"
                >
                  {updateFlagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="email-templates" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-oswald text-xl">Email Templates</h2>
            <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Email Template</DialogTitle>
                  <DialogDescription>
                    Add a new email template for system notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                      placeholder="welcome_email"
                      data-testid="input-template-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input
                      id="template-subject"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      placeholder="Welcome to LYS!"
                      data-testid="input-template-subject"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-category">Category</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                    >
                      <SelectTrigger data-testid="select-template-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-html">HTML Content</Label>
                    <Textarea
                      id="template-html"
                      value={newTemplate.htmlContent}
                      onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                      placeholder="<h1>Welcome, {{name}}!</h1>"
                      className="min-h-[100px] font-mono text-sm"
                      data-testid="input-template-html"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-text">Plain Text Content</Label>
                    <Textarea
                      id="template-text"
                      value={newTemplate.textContent}
                      onChange={(e) => setNewTemplate({ ...newTemplate, textContent: e.target.value })}
                      placeholder="Welcome, {{name}}!"
                      className="min-h-[80px]"
                      data-testid="input-template-text"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="template-variables">Variables (comma-separated)</Label>
                    <Input
                      id="template-variables"
                      value={newTemplate.variables.join(", ")}
                      onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
                      placeholder="name, email, date"
                      data-testid="input-template-variables"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label>Active</Label>
                      <p className="text-sm text-muted-foreground">Enable this template for use</p>
                    </div>
                    <Switch
                      checked={newTemplate.isActive}
                      onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isActive: checked })}
                      data-testid="switch-template-active"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)} data-testid="button-cancel-template">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createTemplateMutation.mutate(newTemplate)}
                    disabled={!newTemplate.name || !newTemplate.subject || createTemplateMutation.isPending}
                    data-testid="button-submit-template"
                  >
                    {createTemplateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emailTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No email templates configured</p>
                <p className="text-sm text-muted-foreground">Create email templates for system notifications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {emailTemplates.map((template) => (
                <Card key={template.id} data-testid={`card-template-${template.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${template.isActive ? "bg-blue-100 dark:bg-blue-900/20" : "bg-muted"}`}>
                        <Mail className={`h-5 w-5 ${template.isActive ? "text-blue-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-mono">{template.name}</CardTitle>
                        <CardDescription>{template.subject}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingTemplate(template)}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {template.variables && template.variables.length > 0 && (
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Variables:</span>
                        {template.variables.map((v) => (
                          <Badge key={v} variant="outline" className="font-mono text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Email Template</DialogTitle>
                <DialogDescription>Update the email template settings.</DialogDescription>
              </DialogHeader>
              {editingTemplate && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Template Name</Label>
                    <Input value={editingTemplate.name} disabled className="bg-muted" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-subject">Subject</Label>
                    <Input
                      id="edit-template-subject"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      data-testid="input-edit-template-subject"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-category">Category</Label>
                    <Select
                      value={editingTemplate.category}
                      onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}
                    >
                      <SelectTrigger data-testid="select-edit-template-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-html">HTML Content</Label>
                    <Textarea
                      id="edit-template-html"
                      value={editingTemplate.htmlContent || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, htmlContent: e.target.value })}
                      className="min-h-[100px] font-mono text-sm"
                      data-testid="input-edit-template-html"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-text">Plain Text Content</Label>
                    <Textarea
                      id="edit-template-text"
                      value={editingTemplate.textContent || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, textContent: e.target.value })}
                      className="min-h-[80px]"
                      data-testid="input-edit-template-text"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-template-variables">Variables (comma-separated)</Label>
                    <Input
                      id="edit-template-variables"
                      value={(editingTemplate.variables || []).join(", ")}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
                      data-testid="input-edit-template-variables"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label>Active</Label>
                    <Switch
                      checked={editingTemplate.isActive}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isActive: checked })}
                      data-testid="switch-edit-template-active"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTemplate(null)} data-testid="button-cancel-edit-template">
                  Cancel
                </Button>
                <Button
                  onClick={() => editingTemplate && updateTemplateMutation.mutate({
                    id: editingTemplate.id,
                    updates: {
                      subject: editingTemplate.subject,
                      category: editingTemplate.category,
                      htmlContent: editingTemplate.htmlContent,
                      textContent: editingTemplate.textContent,
                      variables: editingTemplate.variables,
                      isActive: editingTemplate.isActive,
                    }
                  })}
                  disabled={updateTemplateMutation.isPending}
                  data-testid="button-submit-edit-template"
                >
                  {updateTemplateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
