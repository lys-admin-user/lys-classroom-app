import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Eye,
  EyeOff,
  Target,
  Briefcase,
  BookOpen,
  MessageSquare,
  Send,
  Trash2,
  Check,
  Clock,
  AlertCircle,
  Shield,
  Heart,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ParentStudentLink, ParentInvitation, Goal } from "@shared/schema";

type ParentPermissions = {
  viewGoals?: boolean;
  viewAssessments?: boolean;
  viewCareers?: boolean;
  viewLessons?: boolean;
  receiveNotifications?: boolean;
};

type EnrichedLink = ParentStudentLink & {
  linkedUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

type StudentData = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  goals?: Goal[];
  assessments?: any[];
  savedCareers?: any[];
  notes?: any[];
};

export default function ParentPortal() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("encouragement");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role;
  const isStudent = userRole === 'student';

  const { data: parentLinks = [], isLoading: parentLinksLoading } = useQuery<EnrichedLink[]>({
    queryKey: ["/api/parent-portal/links", "parent"],
    queryFn: async () => {
      const res = await fetch(`/api/parent-portal/links?role=parent`);
      if (!res.ok) {
        if (res.status === 403) return [];
        throw new Error("Failed to fetch parent links");
      }
      return res.json();
    },
    enabled: isAuthenticated && !isStudent,
  });

  const hasParentLinks = parentLinks.length > 0;
  const isParent = !isStudent && hasParentLinks;
  const isUnrelatedRole = !isStudent && !parentLinksLoading && !hasParentLinks;

  const { data: links = [], isLoading: linksLoading } = useQuery<EnrichedLink[]>({
    queryKey: ["/api/parent-portal/links", "student"],
    queryFn: async () => {
      const res = await fetch(`/api/parent-portal/links?role=student`);
      if (!res.ok) throw new Error("Failed to fetch links");
      return res.json();
    },
    enabled: isAuthenticated && isStudent,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<ParentInvitation[]>({
    queryKey: ["/api/parent-portal/invitations"],
    enabled: isAuthenticated && isStudent,
  });

  const { data: studentData, isLoading: studentDataLoading } = useQuery<StudentData>({
    queryKey: ["/api/parent-portal/student", selectedStudent],
    queryFn: async () => {
      const res = await fetch(`/api/parent-portal/student/${selectedStudent}`);
      if (!res.ok) throw new Error("Failed to fetch student data");
      return res.json();
    },
    enabled: isAuthenticated && hasParentLinks && !!selectedStudent,
  });

  const inviteParentMutation = useMutation({
    mutationFn: async (data: { parentEmail: string; relationship: string }) => {
      const response = await apiRequest("POST", "/api/parent-portal/invitations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/invitations"] });
      setInviteEmail("");
      setIsInviteDialogOpen(false);
      toast({
        title: "Invitation Sent",
        description: "Your parent/guardian will receive an invitation link.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ linkId, permissions }: { linkId: string; permissions: ParentPermissions }) => {
      const response = await apiRequest("PATCH", `/api/parent-portal/links/${linkId}`, { permissions });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/links"] });
      toast({
        title: "Permissions Updated",
        description: "Parent access permissions have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await apiRequest("DELETE", `/api/parent-portal/links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/links"] });
      toast({
        title: "Access Revoked",
        description: "Parent access has been revoked.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await apiRequest("DELETE", `/api/parent-portal/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/invitations"] });
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { linkId: string; studentUserId: string; noteType: string; content: string }) => {
      const response = await apiRequest("POST", "/api/parent-portal/notes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-portal/student", selectedStudent] });
      setNoteContent("");
      toast({
        title: "Note Added",
        description: "Your note has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = (link: EnrichedLink, permission: keyof ParentPermissions) => {
    const currentPermissions = (link.permissions || {}) as ParentPermissions;
    updatePermissionsMutation.mutate({
      linkId: link.id,
      permissions: {
        ...currentPermissions,
        [permission]: !currentPermissions[permission],
      },
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !selectedStudent) return;
    const link = parentLinks.find(l => l.studentUserId === selectedStudent);
    if (!link) return;
    addNoteMutation.mutate({
      linkId: link.id,
      studentUserId: selectedStudent,
      noteType,
      content: noteContent,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500/10 text-green-600"><Check className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'revoked':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parent Portal
            </CardTitle>
            <CardDescription>
              Please sign in to access the Parent Portal
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (linksLoading || parentLinksLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isUnrelatedRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Parent Portal</CardTitle>
            <CardDescription>
              This feature is designed for students to share their progress with family members, 
              and for parents/guardians to view their children's educational journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>As an educator or administrator, you can encourage your students to use this feature 
            to engage their families in their educational success.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Parent Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStudent 
              ? "Manage which family members can view your progress"
              : "Track your student's educational journey"}
          </p>
        </div>
        
        {isStudent && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-parent">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Parent/Guardian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Parent or Guardian</DialogTitle>
                <DialogDescription>
                  Send an invitation to your parent or guardian so they can view your progress.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-email">Email Address</Label>
                  <Input
                    id="parent-email"
                    type="email"
                    placeholder="parent@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="input-parent-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger data-testid="select-relationship">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="family_member">Family Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => inviteParentMutation.mutate({ parentEmail: inviteEmail, relationship })}
                  disabled={!inviteEmail || inviteParentMutation.isPending}
                  data-testid="button-send-invitation"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {inviteParentMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isStudent ? (
        <Tabs defaultValue="linked" className="space-y-4">
          <TabsList>
            <TabsTrigger value="linked" data-testid="tab-linked-parents">
              <Users className="mr-2 h-4 w-4" />
              Linked Parents ({links.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-invitations">
              <Mail className="mr-2 h-4 w-4" />
              Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linked" className="space-y-4">
            {links.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Linked Parents</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Invite your parents or guardians so they can track your progress and support your journey.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsInviteDialogOpen(true)}
                    data-testid="button-invite-parent-empty"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Parent/Guardian
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {links.map((link) => (
                  <Card key={link.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {link.linkedUser?.firstName} {link.linkedUser?.lastName}
                            </CardTitle>
                            <CardDescription>{link.linkedUser?.email}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(link.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Access Permissions
                        </Label>
                        <div className="space-y-2">
                          {[
                            { key: 'viewGoals' as const, label: 'View Goals & Progress', icon: Target },
                            { key: 'viewAssessments' as const, label: 'View Assessments', icon: BookOpen },
                            { key: 'viewCareers' as const, label: 'View Saved Careers', icon: Briefcase },
                            { key: 'receiveNotifications' as const, label: 'Receive Updates', icon: Mail },
                          ].map(({ key, label, icon: Icon }) => (
                            <div key={key} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                {label}
                              </div>
                              <Switch
                                checked={((link.permissions || {}) as ParentPermissions)[key] ?? false}
                                onCheckedChange={() => handlePermissionToggle(link, key)}
                                data-testid={`switch-permission-${key}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => revokeLinkMutation.mutate(link.id)}
                        disabled={revokeLinkMutation.isPending}
                        data-testid={`button-revoke-${link.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke Access
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {invitationsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : invitations.filter(i => i.status === 'pending').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Pending Invitations</h3>
                  <p className="text-muted-foreground">All your invitations have been accepted or expired.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invitations.filter(i => i.status === 'pending').map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{invitation.parentEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                        disabled={deleteInvitationMutation.isPending}
                        data-testid={`button-cancel-invite-${invitation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Students</CardTitle>
                <CardDescription>Select a student to view their progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {parentLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No linked students yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your student will need to send you an invitation.
                    </p>
                  </div>
                ) : (
                  parentLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => setSelectedStudent(link.studentUserId)}
                      className={`w-full p-3 rounded-md text-left flex items-center justify-between transition-colors ${
                        selectedStudent === link.studentUserId
                          ? "bg-primary/10 border-primary"
                          : "hover-elevate"
                      }`}
                      data-testid={`button-select-student-${link.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {link.linkedUser?.firstName} {link.linkedUser?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {link.relationship}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {!selectedStudent ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Eye className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">Select a Student</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Choose a student from the list to view their goals, progress, and achievements.
                  </p>
                </CardContent>
              </Card>
            ) : studentDataLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-48" />
              </div>
            ) : studentData ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {studentData.student?.firstName}'s Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="goals">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="goals">Goals</TabsTrigger>
                        <TabsTrigger value="assessments">Assessments</TabsTrigger>
                        <TabsTrigger value="careers">Careers</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="goals" className="space-y-4 mt-4">
                        {!studentData.goals ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <EyeOff className="h-8 w-8 mx-auto mb-2" />
                            <p>Goal viewing is not permitted</p>
                          </div>
                        ) : studentData.goals.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">No goals set yet</p>
                        ) : (
                          studentData.goals.map((goal) => (
                            <Card key={goal.id}>
                              <CardContent className="py-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{goal.title}</h4>
                                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                                    <div className="mt-2">
                                      <Progress value={goal.progress} className="h-2" />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {goal.progress}% complete
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline">{goal.status}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </TabsContent>
                      
                      <TabsContent value="assessments" className="mt-4">
                        {!studentData.assessments ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <EyeOff className="h-8 w-8 mx-auto mb-2" />
                            <p>Assessment viewing is not permitted</p>
                          </div>
                        ) : studentData.assessments.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">No assessments completed yet</p>
                        ) : (
                          <div className="space-y-4">
                            {studentData.assessments.map((assessment, idx) => (
                              <Card key={idx}>
                                <CardContent className="py-4">
                                  <p className="text-sm text-muted-foreground">
                                    Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                                  </p>
                                  <div className="mt-2 flex gap-2">
                                    <Badge variant="outline">BE: {assessment.scores?.be || 0}%</Badge>
                                    <Badge variant="outline">KNOW: {assessment.scores?.know || 0}%</Badge>
                                    <Badge variant="outline">DO: {assessment.scores?.do || 0}%</Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="careers" className="mt-4">
                        {!studentData.savedCareers ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <EyeOff className="h-8 w-8 mx-auto mb-2" />
                            <p>Career viewing is not permitted</p>
                          </div>
                        ) : studentData.savedCareers.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">No careers saved yet</p>
                        ) : (
                          <div className="space-y-2">
                            {studentData.savedCareers.map((career, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{career.careerTitle}</p>
                                  <p className="text-sm text-muted-foreground capitalize">{career.careerCategory}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Encouragement Notes
                    </CardTitle>
                    <CardDescription>Leave supportive notes for your student</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger data-testid="select-note-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="encouragement">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Encouragement
                            </div>
                          </SelectItem>
                          <SelectItem value="milestone_celebration">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              Milestone Celebration
                            </div>
                          </SelectItem>
                          <SelectItem value="general">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              General Note
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Write an encouraging note for your student..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        data-testid="textarea-note-content"
                      />
                      <Button
                        onClick={handleAddNote}
                        disabled={!noteContent.trim() || addNoteMutation.isPending}
                        data-testid="button-add-note"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {addNoteMutation.isPending ? "Sending..." : "Send Note"}
                      </Button>
                    </div>

                    {studentData.notes && studentData.notes.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <Label>Previous Notes</Label>
                        {studentData.notes.map((note: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {note.noteType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
