import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Link2, Copy, Send, MessageSquare, History, FileText, CheckCircle, XCircle, Wifi, WifiOff, Crown, Video, Youtube, ExternalLink, Settings, PlayCircle, X } from "lucide-react";
import { SiZoom, SiWhatsapp } from "react-icons/si";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCollaboration } from "@/hooks/use-collaboration";
import type { CollaborationSession, Lesson, User } from "@shared/schema";

export default function Collaboration() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [chatMessage, setChatMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { data: hostedSessions, isLoading: hostLoading } = useQuery<CollaborationSession[]>({
    queryKey: ["/api/collaboration/sessions"],
    enabled: isAuthenticated && !params.id,
  });

  const { data: participatedSessions } = useQuery<CollaborationSession[]>({
    queryKey: ["/api/collaboration/participating"],
    enabled: isAuthenticated && !params.id,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    enabled: isAuthenticated,
  });

  const { data: sessionData } = useQuery<{ session: CollaborationSession; participants: any[] }>({
    queryKey: ["/api/collaboration/sessions", params.id],
    enabled: !!params.id,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/collaboration/sessions", data);
      return res.json() as Promise<CollaborationSession>;
    },
    onSuccess: (session: CollaborationSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/sessions"] });
      toast({ title: "Session Created", description: "Your collaboration session is ready." });
      setCreateDialogOpen(false);
      setLocation(`/collaboration/${session.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create session", variant: "destructive" });
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/collaboration/join", { inviteCode: code });
      return res.json() as Promise<{ session: CollaborationSession }>;
    },
    onSuccess: (data: { session: CollaborationSession }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/participating"] });
      toast({ title: "Joined Session", description: "You've joined the collaboration session." });
      setJoinDialogOpen(false);
      setLocation(`/collaboration/${data.session.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Invalid invite code", variant: "destructive" });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/collaboration/sessions/${id}/end`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/sessions"] });
      toast({ title: "Session Ended", description: "The collaboration session has ended." });
      setLocation("/collaboration");
    },
  });

  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) {
      toast({ title: "Title Required", description: "Please enter a session title.", variant: "destructive" });
      return;
    }
    createSessionMutation.mutate({
      title: newSessionTitle,
      description: newSessionDescription,
      lessonId: selectedLesson || undefined,
      sessionType: "lesson_planning",
    });
  };

  const handleJoinSession = () => {
    if (!inviteCode.trim()) {
      toast({ title: "Code Required", description: "Please enter an invite code.", variant: "destructive" });
      return;
    }
    joinSessionMutation.mutate(inviteCode.trim().toUpperCase());
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Invite code copied to clipboard." });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access collaboration features.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setLocation("/api/login")} data-testid="button-login">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (params.id && sessionData) {
    return (
      <CollaborationRoom 
        session={sessionData.session} 
        user={user!} 
        onEnd={() => endSessionMutation.mutate(params.id!)}
        onLeave={() => setLocation("/collaboration")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-marker text-foreground">Collaboration Hub</h1>
            <p className="text-muted-foreground mt-1">Co-create lesson plans with fellow educators in real-time</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-join-session">
                  <Link2 className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Collaboration Session</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Invite Code</Label>
                  <Input
                    placeholder="Enter 8-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="mt-2 font-mono text-center text-lg tracking-widest"
                    data-testid="input-invite-code"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleJoinSession} 
                    disabled={joinSessionMutation.isPending}
                    data-testid="button-join-confirm"
                  >
                    {joinSessionMutation.isPending ? "Joining..." : "Join"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-session">
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collaboration Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Session Title</Label>
                    <Input
                      placeholder="e.g., Q2 Math Curriculum Planning"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      className="mt-2"
                      data-testid="input-session-title"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="What will you be working on?"
                      value={newSessionDescription}
                      onChange={(e) => setNewSessionDescription(e.target.value)}
                      className="mt-2"
                      data-testid="textarea-session-description"
                    />
                  </div>
                  <div>
                    <Label>Link to Lesson (optional)</Label>
                    <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                      <SelectTrigger className="mt-2" data-testid="select-lesson">
                        <SelectValue placeholder="Select a lesson to collaborate on" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No lesson selected</SelectItem>
                        {lessons?.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCreateSession} 
                    disabled={createSessionMutation.isPending}
                    data-testid="button-create-confirm"
                  >
                    {createSessionMutation.isPending ? "Creating..." : "Create Session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="hosted" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hosted" data-testid="tab-hosted">My Sessions</TabsTrigger>
            <TabsTrigger value="participating" data-testid="tab-participating">Joined Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="hosted">
            {hostLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
            ) : hostedSessions && hostedSessions.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hostedSessions.map((session) => (
                  <Card key={session.id} data-testid={`card-session-${session.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-oswald text-lg">{session.title}</CardTitle>
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status}
                        </Badge>
                      </div>
                      {session.description && (
                        <CardDescription className="line-clamp-2">{session.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono bg-muted px-2 py-1 rounded">{session.inviteCode}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyInviteCode(session.inviteCode)}
                          data-testid={`button-copy-${session.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      {session.status === "active" ? (
                        <Button 
                          className="flex-1" 
                          onClick={() => setLocation(`/collaboration/${session.id}`)}
                          data-testid={`button-enter-${session.id}`}
                        >
                          Enter Session
                        </Button>
                      ) : (
                        <Button variant="outline" className="flex-1" disabled>
                          Session Ended
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-oswald text-lg mb-2">No Sessions Yet</h3>
                  <p className="text-muted-foreground mb-4">Create a session to start collaborating with other educators</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="participating">
            {participatedSessions && participatedSessions.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {participatedSessions.map((session) => (
                  <Card key={session.id} data-testid={`card-participated-${session.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-oswald text-lg">{session.title}</CardTitle>
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status}
                        </Badge>
                      </div>
                      {session.description && (
                        <CardDescription className="line-clamp-2">{session.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter>
                      {session.status === "active" ? (
                        <Button 
                          className="w-full" 
                          onClick={() => setLocation(`/collaboration/${session.id}`)}
                          data-testid={`button-rejoin-${session.id}`}
                        >
                          Rejoin Session
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Session Ended
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-oswald text-lg mb-2">No Joined Sessions</h3>
                  <p className="text-muted-foreground mb-4">Use an invite code to join a collaboration session</p>
                  <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Join Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface CollaborationRoomProps {
  session: CollaborationSession;
  user: User;
  onEnd: () => void;
  onLeave: () => void;
}

function CollaborationRoom({ session, user, onEnd, onLeave }: CollaborationRoomProps) {
  const { toast } = useToast();
  const [chatMessage, setChatMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isHost = session.hostUserId === user.id;
  const [lessonContent, setLessonContent] = useState<Record<string, any>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  // Meeting state
  const [jitsiOpen, setJitsiOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [meetZoomUrl, setMeetZoomUrl] = useState(session.zoomUrl || "");
  const [meetWhatsappLink, setMeetWhatsappLink] = useState(session.whatsappLink || "");
  const [meetYoutubeUrl, setMeetYoutubeUrl] = useState(session.youtubeUrl || "");
  const jitsiRoomName = `lys-collab-${session.inviteCode}`;

  const updateMeetingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/collaboration/sessions/${session.id}/meeting`, {
        zoomUrl: meetZoomUrl || null,
        whatsappLink: meetWhatsappLink || null,
        youtubeUrl: meetYoutubeUrl || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/sessions", session.id] });
      toast({ title: "Meeting links saved" });
      setEditingMeeting(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save meeting links", variant: "destructive" });
    },
  });

  const { data: linkedLesson, isLoading: lessonLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", session.lessonId],
    enabled: !!session.lessonId,
  });

  useEffect(() => {
    if (linkedLesson) {
      setLessonContent({
        title: linkedLesson.title || "",
        topic: linkedLesson.topic || "",
        gradeLevel: linkedLesson.gradeLevel || "",
        objectives: (linkedLesson.objectives || []).join("\n"),
        assessment: linkedLesson.assessment || "",
        reflection: linkedLesson.reflection || "",
        materials: (linkedLesson.materials || []).join("\n"),
      });
    }
  }, [linkedLesson]);

  const handleEdit = (edit: { fieldPath: string; newValue: string }) => {
    setLessonContent(prev => ({
      ...prev,
      [edit.fieldPath]: edit.newValue,
    }));
  };

  const {
    isConnected,
    participants,
    messages,
    myColor,
    role,
    error,
    sendChat,
    sendEdit,
  } = useCollaboration({
    sessionId: session.id,
    userId: user.id,
    userName: user.firstName || user.email || "Anonymous",
    onParticipantJoin: (p) => {
      toast({ title: "Joined", description: `${p.name} joined the session` });
    },
    onParticipantLeave: (p) => {
      toast({ title: "Left", description: `${p.name} left the session` });
    },
    onEdit: handleEdit,
  });

  const handleFieldChange = (fieldPath: string, newValue: string) => {
    const previousValue = lessonContent[fieldPath] || "";
    setLessonContent(prev => ({ ...prev, [fieldPath]: newValue }));
    sendEdit({ fieldPath, previousValue, newValue, editType: "update" });
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendChat(chatMessage);
    setChatMessage("");
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(session.inviteCode);
    toast({ title: "Copied", description: "Invite code copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        <header className="border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="font-oswald text-xl">{session.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Wifi className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <WifiOff className="h-3 w-3" /> Disconnected
                    </span>
                  )}
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">{session.inviteCode}</span>
                  <Button variant="ghost" size="icon" onClick={copyInviteLink}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((p) => (
                  <Avatar key={p.id} className="border-2 border-background" style={{ borderColor: p.color }}>
                    <AvatarFallback style={{ backgroundColor: p.color, color: "white" }}>
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {participants.length > 5 && (
                  <Avatar className="border-2 border-background">
                    <AvatarFallback>+{participants.length - 5}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              
              <div className="flex gap-2">
                {isHost && (
                  <Button variant="destructive" onClick={onEnd} data-testid="button-end-session">
                    End Session
                  </Button>
                )}
                <Button variant="outline" onClick={onLeave} data-testid="button-leave-session">
                  Leave
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-oswald">Collaborative Workspace</CardTitle>
                <CardDescription>Work together in real-time on lesson plans and resources</CardDescription>
              </CardHeader>
              <CardContent>
                {session.lessonId ? (
                  lessonLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                      <p>Loading lesson...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="collab-title">Lesson Title</Label>
                          <Input
                            id="collab-title"
                            value={lessonContent.title || ""}
                            onChange={(e) => handleFieldChange("title", e.target.value)}
                            placeholder="Enter lesson title"
                            data-testid="input-collab-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="collab-topic">Topic</Label>
                          <Input
                            id="collab-topic"
                            value={lessonContent.topic || ""}
                            onChange={(e) => handleFieldChange("topic", e.target.value)}
                            placeholder="Enter topic"
                            data-testid="input-collab-topic"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="collab-objectives">Learning Objectives</Label>
                        <Textarea
                          id="collab-objectives"
                          value={lessonContent.objectives || ""}
                          onChange={(e) => handleFieldChange("objectives", e.target.value)}
                          placeholder="Enter learning objectives (one per line)"
                          rows={4}
                          data-testid="input-collab-objectives"
                        />
                        <p className="text-xs text-muted-foreground">Enter one objective per line</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="collab-assessment">Assessment</Label>
                        <Textarea
                          id="collab-assessment"
                          value={lessonContent.assessment || ""}
                          onChange={(e) => handleFieldChange("assessment", e.target.value)}
                          placeholder="Describe how students will be assessed"
                          rows={3}
                          data-testid="input-collab-assessment"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="collab-materials">Materials Needed</Label>
                        <Textarea
                          id="collab-materials"
                          value={lessonContent.materials || ""}
                          onChange={(e) => handleFieldChange("materials", e.target.value)}
                          placeholder="List materials needed (one per line)"
                          rows={3}
                          data-testid="input-collab-materials"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="collab-reflection">Reflection Notes</Label>
                        <Textarea
                          id="collab-reflection"
                          value={lessonContent.reflection || ""}
                          onChange={(e) => handleFieldChange("reflection", e.target.value)}
                          placeholder="Add reflection notes for this lesson"
                          rows={3}
                          data-testid="input-collab-reflection"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Changes sync automatically with all collaborators</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No lesson linked to this session</p>
                    <p className="text-sm mt-2">Use the chat to coordinate with your team</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Jitsi Meet Dialog */}
          <Dialog open={jitsiOpen} onOpenChange={setJitsiOpen}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
              <DialogHeader className="p-4 border-b flex-row items-center justify-between">
                <div>
                  <DialogTitle className="font-oswald flex items-center gap-2">
                    <Video className="h-5 w-5 text-lys-teal" />
                    Live Meeting — {session.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    Room: <span className="font-mono">{jitsiRoomName}</span> · Powered by Jitsi Meet
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setJitsiOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>
              <iframe
                src={`https://meet.jit.si/${jitsiRoomName}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full"
                style={{ height: "560px", border: "none" }}
                title="Jitsi Meet"
              />
            </DialogContent>
          </Dialog>

          <div className="w-80 border-l flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b px-4">
                <TabsTrigger value="chat">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <Users className="h-4 w-4 mr-1" />
                  People
                </TabsTrigger>
                <TabsTrigger value="meet">
                  <Video className="h-4 w-4 mr-1" />
                  Meet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{msg.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{msg.content}</p>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No messages yet</p>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      data-testid="input-chat-message"
                    />
                    <Button size="icon" onClick={handleSendMessage} data-testid="button-send-message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="participants" className="flex-1 m-0 p-4">
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate">
                      <Avatar className="border-2" style={{ borderColor: p.color }}>
                        <AvatarFallback style={{ backgroundColor: p.color, color: "white" }}>
                          {p.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        {p.id === session.hostUserId && (
                          <Badge variant="outline" className="gap-1">
                            <Crown className="h-3 w-3" />
                            Host
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="meet" className="flex-1 m-0 p-4 overflow-auto">
                <div className="space-y-4">
                  {/* Primary: Jitsi embedded */}
                  <div className="rounded-lg border bg-lys-teal/5 border-lys-teal/20 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="h-4 w-4 text-lys-teal" />
                      <span className="font-oswald text-sm font-medium">In-App Video</span>
                      <Badge variant="outline" className="text-xs ml-auto">Free</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">No download needed. Camera &amp; screen share included.</p>
                    <Button
                      className="w-full bg-lys-teal hover:bg-lys-teal/90 text-white"
                      onClick={() => setJitsiOpen(true)}
                      data-testid="button-join-jitsi"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join Jitsi Meeting
                    </Button>
                  </div>

                  <Separator />

                  {/* External apps */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">External Apps</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      disabled={!session.zoomUrl}
                      onClick={() => session.zoomUrl && window.open(session.zoomUrl, "_blank")}
                      data-testid="button-open-zoom"
                    >
                      <SiZoom className="h-4 w-4 text-blue-500" />
                      Open Zoom
                      {session.zoomUrl ? (
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground">Not set</span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3"
                      disabled={!session.whatsappLink}
                      onClick={() => session.whatsappLink && window.open(session.whatsappLink, "_blank")}
                      data-testid="button-open-whatsapp"
                    >
                      <SiWhatsapp className="h-4 w-4 text-green-500" />
                      Open WhatsApp
                      {session.whatsappLink ? (
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                      ) : (
                        <span className="ml-auto text-xs text-muted-foreground">Not set</span>
                      )}
                    </Button>
                  </div>

                  {/* YouTube recording */}
                  {session.youtubeUrl && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Session Recording</p>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3"
                          onClick={() => window.open(session.youtubeUrl!, "_blank")}
                          data-testid="button-watch-recording"
                        >
                          <Youtube className="h-4 w-4 text-red-500" />
                          Watch Recording
                          <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Host-only config */}
                  {isHost && (
                    <>
                      <Separator />
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-muted-foreground"
                          onClick={() => setEditingMeeting(!editingMeeting)}
                          data-testid="button-configure-meeting"
                        >
                          <Settings className="h-4 w-4" />
                          {editingMeeting ? "Cancel" : "Configure Meeting Links"}
                        </Button>
                        {editingMeeting && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <Label className="text-xs flex items-center gap-1.5">
                                <SiZoom className="h-3 w-3 text-blue-500" />
                                Zoom Meeting URL
                              </Label>
                              <Input
                                placeholder="https://zoom.us/j/..."
                                value={meetZoomUrl}
                                onChange={(e) => setMeetZoomUrl(e.target.value)}
                                className="mt-1 text-xs"
                                data-testid="input-zoom-url"
                              />
                            </div>
                            <div>
                              <Label className="text-xs flex items-center gap-1.5">
                                <SiWhatsapp className="h-3 w-3 text-green-500" />
                                WhatsApp Group Link
                              </Label>
                              <Input
                                placeholder="https://chat.whatsapp.com/..."
                                value={meetWhatsappLink}
                                onChange={(e) => setMeetWhatsappLink(e.target.value)}
                                className="mt-1 text-xs"
                                data-testid="input-whatsapp-link"
                              />
                            </div>
                            <div>
                              <Label className="text-xs flex items-center gap-1.5">
                                <Youtube className="h-3 w-3 text-red-500" />
                                YouTube Recording URL
                              </Label>
                              <Input
                                placeholder="https://youtube.com/watch?v=..."
                                value={meetYoutubeUrl}
                                onChange={(e) => setMeetYoutubeUrl(e.target.value)}
                                className="mt-1 text-xs"
                                data-testid="input-youtube-url"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => updateMeetingMutation.mutate()}
                              disabled={updateMeetingMutation.isPending}
                              data-testid="button-save-meeting-links"
                            >
                              {updateMeetingMutation.isPending ? "Saving..." : "Save Links"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
