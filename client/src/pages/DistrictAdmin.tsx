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
import { Textarea } from "@/components/ui/textarea";
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
  Upload,
  CheckSquare,
  Square,
  AlertCircle,
  AlertTriangle,
  FileText,
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
  const [invitePersonType, setInvitePersonType] = useState("educator");
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkImportResults, setBulkImportResults] = useState<{ success: number; failed: number; errors: { row: number; email: string; message: string }[] } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

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
    mutationFn: async (data: { email: string; role: string; personType: string }) => {
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

  const parseCsvText = (text: string): { email: string; role: string; personType: string }[] => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const results: { email: string; role: string; personType: string }[] = [];
    for (const line of lines) {
      const firstLine = line.trim().toLowerCase();
      if (firstLine.startsWith("email") || firstLine.startsWith("name")) continue;
      const parts = line.split(/[,\t]+/).map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        results.push({ email: parts[0], personType: parts[1] || "educator", role: parts[2] || "member" });
      }
    }
    return results;
  };

  const bulkInviteMutation = useMutation({
    mutationFn: async (people: { email: string; role: string; personType: string }[]) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedCampusForPeople}/bulk-invite`, { people });
      return res.json();
    },
    onSuccess: (data) => {
      setBulkImportResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedCampusForPeople, "invitations"] });
      if (data.success > 0) {
        toast({ title: `${data.success} invitation(s) sent successfully${data.failed > 0 ? `, ${data.failed} failed` : ""}` });
      } else {
        toast({ title: "No invitations sent - check errors below", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Failed to process bulk invitations", variant: "destructive" });
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const res = await apiRequest("POST", `/api/organizations/${selectedCampusForPeople}/bulk-remove`, { memberIds });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", selectedCampusForPeople, "members"] });
      setSelectedMembers(new Set());
      setIsBulkDeleteConfirmOpen(false);
      toast({ title: `${data.removed} member(s) removed${data.failed > 0 ? `, ${data.failed} failed` : ""}` });
    },
    onError: () => {
      toast({ title: "Failed to remove members", variant: "destructive" });
    },
  });

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const toggleAllMembers = (members: any[]) => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m: any) => m.id)));
    }
  };

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
          <TabsTrigger value="safety" data-testid="tab-safety">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Safety & Security
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
              <Select value={selectedCampusForPeople} onValueChange={(v) => { setSelectedCampusForPeople(v); setSelectedMembers(new Set()); }}>
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
              <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="grid gap-2">
                        <Label htmlFor="invite-person-type-district">Person Type</Label>
                        <Select value={invitePersonType} onValueChange={setInvitePersonType}>
                          <SelectTrigger data-testid="select-invite-person-type-district">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="educator">Educator</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="mentor">Mentor</SelectItem>
                            <SelectItem value="parent">Parent / Guardian</SelectItem>
                            <SelectItem value="employer">Employer</SelectItem>
                            <SelectItem value="counselor">Counselor</SelectItem>
                            <SelectItem value="administrator">Administrator</SelectItem>
                            <SelectItem value="volunteer">Volunteer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">This describes the person's role in the educational community. It can be changed after they accept.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteOpen(false)} data-testid="button-cancel-invite">
                        Cancel
                      </Button>
                      <Button
                        onClick={() => inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole, personType: invitePersonType })}
                        disabled={!inviteEmail || inviteMemberMutation.isPending}
                        data-testid="button-send-invite"
                      >
                        {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isBulkImportOpen} onOpenChange={(open) => { setIsBulkImportOpen(open); if (!open) { setBulkCsvText(""); setBulkImportResults(null); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-bulk-import-district">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Bulk Add People</DialogTitle>
                      <DialogDescription>
                        Add multiple people at once by pasting their information below. Each person will receive an email invitation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="p-3 rounded-md bg-muted/50 border">
                        <p className="text-sm font-medium mb-2">Required Format (CSV)</p>
                        <p className="text-xs text-muted-foreground mb-2">One person per line. Columns: email, person type, org role (last two optional)</p>
                        <code className="text-xs block bg-background p-2 rounded border font-mono">
                          email,person type,role{"\n"}
                          teacher@school.edu,educator,member{"\n"}
                          mentor@org.com,mentor,member{"\n"}
                          admin@school.edu,administrator,admin{"\n"}
                          parent@email.com,parent,member
                        </code>
                        <p className="text-xs text-muted-foreground mt-2">Person types: educator, student, mentor, parent, employer, counselor, administrator, volunteer, other. Org roles: member, admin, owner. You can also paste tab-separated data from a spreadsheet.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bulk-csv-district">Paste your data here</Label>
                        <Textarea
                          id="bulk-csv-district"
                          value={bulkCsvText}
                          onChange={(e) => setBulkCsvText(e.target.value)}
                          placeholder={"teacher@school.edu,educator,member\nmentor@org.com,mentor,member\nparent@email.com,parent,member"}
                          className="min-h-[120px] font-mono text-sm"
                          data-testid="textarea-bulk-csv-district"
                        />
                        <p className="text-xs text-muted-foreground">
                          {bulkCsvText ? `${parseCsvText(bulkCsvText).length} people detected` : "Paste CSV or tab-separated data"}
                        </p>
                      </div>
                      {bulkImportResults && (
                        <div className="p-3 rounded-md border space-y-2">
                          <p className="text-sm font-medium">Results</p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">{bulkImportResults.success} sent</span>
                            {bulkImportResults.failed > 0 && <span className="text-destructive">{bulkImportResults.failed} failed</span>}
                          </div>
                          {bulkImportResults.errors.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {bulkImportResults.errors.map((err, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>Row {err.row} ({err.email}): {err.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsBulkImportOpen(false); setBulkCsvText(""); setBulkImportResults(null); }} data-testid="button-cancel-bulk-district">
                        {bulkImportResults ? "Close" : "Cancel"}
                      </Button>
                      {!bulkImportResults && (
                        <Button
                          onClick={() => {
                            const people = parseCsvText(bulkCsvText);
                            if (people.length === 0) {
                              toast({ title: "No valid entries found. Check your format.", variant: "destructive" });
                              return;
                            }
                            bulkInviteMutation.mutate(people);
                          }}
                          disabled={!bulkCsvText.trim() || bulkInviteMutation.isPending}
                          data-testid="button-send-bulk-invites-district"
                        >
                          {bulkInviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Send {parseCsvText(bulkCsvText).length} Invitations
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {selectedMembers.size > 0 && (
                  <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-bulk-delete-district">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove {selectedMembers.size} Selected
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Selected Members</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove {selectedMembers.size} member(s) from this organization? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)} data-testid="button-cancel-bulk-delete-district">
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => bulkRemoveMutation.mutate(Array.from(selectedMembers))}
                          disabled={bulkRemoveMutation.isPending}
                          data-testid="button-confirm-bulk-delete-district"
                        >
                          {bulkRemoveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Remove {selectedMembers.size} Members
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
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
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <h3 className="font-oswald text-lg">Current Members</h3>
                  {orgMembers.length > 0 && (
                    <p className="text-xs text-muted-foreground">{orgMembers.length} member(s) total</p>
                  )}
                </div>
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orgMembers.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No members in this organization yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Use "Invite People" or "Bulk Add" to add educators, students, or staff</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
                      <button
                        onClick={() => toggleAllMembers(orgMembers)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid="button-select-all-members-district"
                      >
                        {selectedMembers.size === orgMembers.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {selectedMembers.size > 0 ? `${selectedMembers.size} selected` : "Select all"}
                      </span>
                    </div>
                    {orgMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between gap-4 p-3 rounded-md border ${selectedMembers.has(member.id) ? "border-primary/30 bg-primary/5" : ""}`}
                        data-testid={`member-row-${member.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleMemberSelection(member.id)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`checkbox-member-${member.id}`}
                          >
                            {selectedMembers.has(member.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
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
                        <div className="flex items-center gap-2">
                          {inv.personType && (
                            <Badge variant="outline" className="text-xs capitalize">{inv.personType}</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">{inv.role || "member"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <DistrictSafetySuiteTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DistrictSafetySuiteTab() {
  const { toast } = useToast();
  const [reviewFilter, setReviewFilter] = useState<string>("pending_review");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [auditCategory, setAuditCategory] = useState<string>("all");

  const { data: reviewStats } = useQuery<{
    pending: number;
    approved: number;
    rejected: number;
    highSeverityPending: number;
  }>({
    queryKey: ["/api/org-safety/review-queue/stats"],
  });

  const { data: reviewQueue, isLoading: queueLoading } = useQuery<{
    items: any[];
    total: number;
  }>({
    queryKey: ["/api/org-safety/review-queue", reviewFilter],
    queryFn: async () => {
      const res = await fetch(`/api/org-safety/review-queue?status=${reviewFilter}&limit=50`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<any[]>({
    queryKey: ["/api/org-safety/audit-logs", auditCategory],
    queryFn: async () => {
      const params = auditCategory !== "all" ? `?category=${auditCategory}&limit=50` : "?limit=50";
      const res = await fetch(`/api/org-safety/audit-logs${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: governance } = useQuery<{
    successLedger: { totalMarks: number; finalizedMarks: number; editWindowHours: number };
    safetyVault: { totalArchived: number; piiBlocked: number };
    coppaStatus: string;
    piiProtection: string;
  }>({
    queryKey: ["/api/org-safety/governance-status"],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/org-safety/review-queue/${id}`, { action, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue/stats"] });
      toast({ title: "Review updated" });
    },
  });

  const bulkReviewMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await apiRequest("POST", "/api/org-safety/review-queue/bulk", { ids, action });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-safety/review-queue/stats"] });
      setSelectedItems([]);
      toast({ title: `${data.updated} items updated` });
    },
  });

  const severityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-district-pending-count">{reviewStats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-district-high-severity">{reviewStats?.highSeverityPending || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-district-approved">{reviewStats?.approved || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-lys-teal" />
              <div>
                <p className="text-2xl font-bold font-oswald" data-testid="text-district-governance-marks">{governance?.successLedger.totalMarks || 0}</p>
                <p className="text-sm text-muted-foreground font-roboto">Success Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-oswald">Content Review Queue</CardTitle>
              <CardDescription className="font-roboto">
                Flagged content across your district requiring review
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkReviewMutation.mutate({ ids: selectedItems, action: "approved" })}
                    disabled={bulkReviewMutation.isPending}
                    data-testid="button-district-bulk-approve"
                  >
                    <Shield className="h-4 w-4 mr-1" /> Approve ({selectedItems.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => bulkReviewMutation.mutate({ ids: selectedItems, action: "rejected" })}
                    disabled={bulkReviewMutation.isPending}
                    data-testid="button-district-bulk-reject"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" /> Reject ({selectedItems.length})
                  </Button>
                </>
              )}
              <Select value={reviewFilter} onValueChange={setReviewFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-district-review-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="auto_blocked">Auto-Blocked</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !reviewQueue?.items?.length ? (
            <div className="text-center py-8 text-muted-foreground font-roboto">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No items in the {reviewFilter.replace("_", " ")} queue</p>
              <p className="text-sm mt-1">Content flagged by the keyword filter will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.items.map((item: any) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 space-y-2"
                  data-testid={`district-review-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          setSelectedItems(prev =>
                            e.target.checked
                              ? [...prev, item.id]
                              : prev.filter((id: string) => id !== item.id)
                          );
                        }}
                        data-testid={`checkbox-district-review-${item.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${severityColors[item.severity] || ""}`}>
                            {item.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.contentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-roboto">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-roboto line-clamp-3">{item.content}</p>
                        {item.flaggedKeywords?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {item.flaggedKeywords.map((kw: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.status === "pending_review" && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "approved" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-district-approve-${item.id}`}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "rejected" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-district-reject-${item.id}`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reviewMutation.mutate({ id: item.id, action: "archived" })}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-district-archive-${item.id}`}
                        >
                          Archive
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-oswald">District Audit Log</CardTitle>
              <CardDescription className="font-roboto">
                Security events and actions across your district
              </CardDescription>
            </div>
            <Select value={auditCategory} onValueChange={setAuditCategory}>
              <SelectTrigger className="w-[180px]" data-testid="select-district-audit-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="admin_action">Admin Actions</SelectItem>
                <SelectItem value="content_moderation">Content Moderation</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="ai_usage">AI Usage</SelectItem>
                <SelectItem value="data_modify">Data Changes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !auditLogs?.length ? (
            <div className="text-center py-8 text-muted-foreground font-roboto">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No audit log entries for your district yet</p>
              <p className="text-sm mt-1">Security events will be recorded here as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-md text-sm"
                  data-testid={`district-audit-log-${log.id}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.severity === "critical" ? "bg-red-500" :
                    log.severity === "warning" ? "bg-amber-500" : "bg-green-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium font-roboto">{log.action.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-xs">{log.category}</Badge>
                      {log.severity !== "info" && (
                        <Badge className={`text-xs ${log.severity === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {log.severity}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-roboto">
                      {log.userId && <span>User: {log.userId} · </span>}
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-oswald">District Governance Status</CardTitle>
          <CardDescription className="font-roboto">Data governance metrics across your district</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-oswald" data-testid="text-district-ledger-total">{governance?.successLedger.totalMarks || 0}</p>
              <p className="text-sm text-muted-foreground font-roboto">Success Marks</p>
              <p className="text-xs text-muted-foreground">{governance?.successLedger.finalizedMarks || 0} finalized</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-oswald" data-testid="text-district-vault-total">{governance?.safetyVault.totalArchived || 0}</p>
              <p className="text-sm text-muted-foreground font-roboto">Archived Messages</p>
              <p className="text-xs text-muted-foreground">{governance?.safetyVault.piiBlocked || 0} PII blocked</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Badge variant={governance?.coppaStatus === "enforced" ? "default" : "destructive"} className="mb-2">
                {governance?.coppaStatus || "unknown"}
              </Badge>
              <p className="text-sm text-muted-foreground font-roboto">COPPA Status</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Badge variant={governance?.piiProtection === "active" ? "default" : "destructive"} className="mb-2">
                {governance?.piiProtection || "unknown"}
              </Badge>
              <p className="text-sm text-muted-foreground font-roboto">PII Protection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
