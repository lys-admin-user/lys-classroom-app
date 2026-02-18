import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
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
  Trash2,
  Loader2,
  UserPlus,
  Mail as MailIcon,
} from "lucide-react";

export default function DistrictAdmin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCampusForPeople, setSelectedCampusForPeople] = useState<string>("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

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

  const { data: orgMembers = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations", selectedCampusForPeople, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/organizations/${selectedCampusForPeople}/members`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedCampusForPeople,
  });

  const { data: orgInvitations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations", selectedCampusForPeople, "invitations"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/organizations/${selectedCampusForPeople}/invitations`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedCampusForPeople,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      return await apiRequest("POST", `/api/organizations/${selectedCampusForPeople}/invite`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedCampusForPeople, "invitations"] });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      toast({ title: "Invitation sent successfully" });
    },
    onError: () => {
      toast({ title: "Failed to send invitation", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest("DELETE", `/api/organizations/${selectedCampusForPeople}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedCampusForPeople, "members"] });
      toast({ title: "Member removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove member", variant: "destructive" });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      return await apiRequest("PATCH", `/api/organizations/${selectedCampusForPeople}/members/${memberId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedCampusForPeople, "members"] });
      toast({ title: "Member role updated" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const allowedRoles = ["district_admin", "site_admin", "system_admin"];
  if (!user || !allowedRoles.includes(user.role || "")) {
    return (
      <div className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-oswald mb-2">My District</h2>
        <p className="text-muted-foreground">
          You need district administrator or higher privileges to access this page.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          If you believe this is an error, contact your district or system administrator.
        </p>
      </div>
    );
  }

  const allSelectableOrgs = [
    ...(districtOrg?.organization ? [{ id: districtOrg.organization.id, name: districtOrg.organization.name + " (District)" }] : []),
    ...campuses.map((c: any) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-marker text-lys-red" data-testid="text-district-title">
          My District
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage campuses, connected organizations, educators, and curriculum across your district
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
              <p className="text-2xl font-bold">0</p>
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
              <p className="text-2xl font-bold">0</p>
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
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">Lessons Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Building2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="people" data-testid="tab-people">
            <Users className="h-4 w-4 mr-2" />
            People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-lys-teal" />
                  Campuses
                </CardTitle>
                <CardDescription>
                  Schools and campuses in your district, each with their own internal teams and external partners
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
                  Coordinate alignment, standards, and analytics across all campuses
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
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-oswald text-xl">People Management</h2>
              <p className="text-sm text-muted-foreground">View and manage educators, students, mentors, and staff across all campuses and connected partner organizations in your district</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-full max-w-sm">
              <Label htmlFor="people-campus-select" className="text-sm text-muted-foreground mb-1 block">Select a campus or district to view its members</Label>
              <Select value={selectedCampusForPeople} onValueChange={setSelectedCampusForPeople}>
                <SelectTrigger data-testid="select-people-campus">
                  <SelectValue placeholder="Choose a campus or district..." />
                </SelectTrigger>
                <SelectContent>
                  {allSelectableOrgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCampusForPeople && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-invite-people">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite People
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite People</DialogTitle>
                    <DialogDescription>
                      Send an email invitation to join the selected campus or district. They will receive a link to accept and join.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="educator@school.edu"
                        data-testid="input-invite-email"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="invite-role">Organization Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger data-testid="select-invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member - Can view and participate</SelectItem>
                          <SelectItem value="admin">Admin - Can manage members and settings</SelectItem>
                          <SelectItem value="owner">Owner - Full control over the organization</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">This determines what the person can do within this organization</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteOpen(false)} data-testid="button-cancel-invite">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole })}
                      disabled={!inviteEmail || inviteMemberMutation.isPending}
                      data-testid="button-send-invite"
                    >
                      {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Send Invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedCampusForPeople ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No campus or district selected</p>
                <p className="text-sm text-muted-foreground mt-1">Choose a campus or the district itself from the dropdown above to view members, invite new people, or manage roles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-oswald text-lg mb-3">Current Members</h3>
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orgMembers.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No members in this organization yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Use the "Invite People" button to add educators, students, or staff</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {orgMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md border"
                        data-testid={`member-row-${member.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user?.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {(member.user?.firstName?.[0] || "") + (member.user?.lastName?.[0] || "") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.user?.firstName || member.user?.lastName
                                ? `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.trim()
                                : member.userId}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.user?.email || "No email"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role || "member"}
                            onValueChange={(newRole) => updateMemberRoleMutation.mutate({ memberId: member.id, role: newRole })}
                          >
                            <SelectTrigger className="w-28" data-testid={`select-member-role-${member.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge variant="outline" className="text-xs">
                            {member.user?.role || "user"}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                            disabled={removeMemberMutation.isPending}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {orgInvitations.length > 0 && (
                <div>
                  <h3 className="font-oswald text-lg mb-3">Pending Invitations</h3>
                  <div className="space-y-2">
                    {orgInvitations.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-md border"
                        data-testid={`invitation-row-${inv.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                            <MailIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{inv.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">{inv.role || "member"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
