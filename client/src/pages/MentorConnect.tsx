import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, MessageCircle, CheckCircle, Clock, Filter, XCircle, Headphones, FileText, ExternalLink, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CAREER_FIELDS } from "@shared/schema";
import type { RssContentItem } from "@shared/schema";

interface MentorProfile {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  organization: string;
  bio: string;
  careerFields: string[];
  expertiseAreas: string[];
  isAvailable: boolean;
  maxMentees: number;
  currentMentees: number;
}

interface MentorConnection {
  id: string;
  mentorProfileId: string;
  menteeUserId: string;
  mentorName: string;
  message: string;
  status: "pending" | "active" | "completed" | "declined";
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  declined: { label: "Declined", variant: "destructive" },
};

export default function MentorConnect() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("find");
  const [careerFieldFilter, setCareerFieldFilter] = useState("all");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");

  const queryParams = new URLSearchParams();
  if (careerFieldFilter !== "all") queryParams.set("careerField", careerFieldFilter);
  queryParams.set("available", "true");
  const mentorQueryString = queryParams.toString();
  const mentorUrl = `/api/mentors?${mentorQueryString}`;

  const { data: mentors, isLoading: mentorsLoading } = useQuery<MentorProfile[]>({
    queryKey: [mentorUrl],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<MentorConnection[]>({
    queryKey: ["/api/mentor-connections"],
    enabled: isAuthenticated,
  });

  const { data: mentorContentRecommendations = [] } = useQuery<RssContentItem[]>({
    queryKey: ["/api/mentor-content-recommendations"],
    enabled: isAuthenticated,
  });

  const requestConnectionMutation = useMutation({
    mutationFn: async (data: { mentorProfileId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/mentor-connections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor-connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      toast({ title: "Request Sent", description: "Your mentor connection request has been sent." });
      setRequestDialogOpen(false);
      setConnectionMessage("");
      setSelectedMentor(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send connection request.", variant: "destructive" });
    },
  });

  const cancelConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/mentor-connections/${id}`, { status: "declined" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor-connections"] });
      toast({ title: "Cancelled", description: "Connection request has been cancelled." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel request.", variant: "destructive" });
    },
  });

  function handleRequestConnection(mentor: MentorProfile) {
    setSelectedMentor(mentor);
    setRequestDialogOpen(true);
  }

  function submitConnectionRequest() {
    if (!selectedMentor) return;
    requestConnectionMutation.mutate({
      mentorProfileId: selectedMentor.id,
      message: connectionMessage,
    });
  }

  function getCareerFieldLabel(id: string): string {
    return CAREER_FIELDS.find((f) => f.id === id)?.name ?? id;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto" data-testid="page-mentor-connect">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Users className="h-7 w-7 text-muted-foreground" />
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Mentor Connect</h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Find mentors who can guide your journey
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-mentor">
          <TabsTrigger value="find" data-testid="tab-find-mentors">
            <UserPlus className="h-4 w-4 mr-2" />
            Find Mentors
          </TabsTrigger>
          <TabsTrigger value="connections" data-testid="tab-my-connections">
            <MessageCircle className="h-4 w-4 mr-2" />
            My Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={careerFieldFilter} onValueChange={setCareerFieldFilter}>
              <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-career-field-filter">
                <SelectValue placeholder="Filter by career field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Career Fields</SelectItem>
                {CAREER_FIELDS.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mentorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : mentors && mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor) => (
                <Card key={mentor.id} data-testid={`card-mentor-${mentor.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base" data-testid={`text-mentor-name-${mentor.id}`}>
                        {mentor.displayName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid={`text-mentor-title-${mentor.id}`}>
                        {mentor.title}
                      </p>
                      {mentor.organization && (
                        <p className="text-xs text-muted-foreground" data-testid={`text-mentor-org-${mentor.id}`}>
                          {mentor.organization}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" data-testid={`status-availability-${mentor.id}`}>
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${mentor.isAvailable ? "bg-green-500" : "bg-muted-foreground"}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {mentor.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {mentor.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-mentor-bio-${mentor.id}`}>
                        {mentor.bio}
                      </p>
                    )}
                    {mentor.careerFields.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.careerFields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs" data-testid={`badge-career-field-${field}-${mentor.id}`}>
                            {getCareerFieldLabel(field)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {mentor.expertiseAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertiseAreas.map((area) => (
                          <Badge key={area} variant="outline" className="text-xs" data-testid={`badge-expertise-${area}-${mentor.id}`}>
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground" data-testid={`text-mentee-count-${mentor.id}`}>
                      {mentor.currentMentees} / {mentor.maxMentees} mentees
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={!mentor.isAvailable || mentor.currentMentees >= mentor.maxMentees}
                      onClick={() => handleRequestConnection(mentor)}
                      data-testid={`button-request-connection-${mentor.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Request Connection
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground" data-testid="text-no-mentors">No mentors found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections" className="flex flex-col gap-4 mt-4">
          {connectionsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="flex flex-col gap-2 py-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="flex flex-col gap-3">
              {connections.map((conn) => {
                const config = statusConfig[conn.status] ?? statusConfig.pending;
                return (
                  <Card key={conn.id} data-testid={`card-connection-${conn.id}`}>
                    <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium" data-testid={`text-connection-mentor-${conn.id}`}>
                            {conn.mentorName}
                          </span>
                          <Badge variant={config.variant} data-testid={`badge-connection-status-${conn.id}`}>
                            {conn.status === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {conn.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {conn.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                            {config.label}
                          </Badge>
                        </div>
                        {conn.message && (
                          <p className="text-sm text-muted-foreground line-clamp-1" data-testid={`text-connection-message-${conn.id}`}>
                            {conn.message}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span data-testid={`text-connection-created-${conn.id}`}>
                            Requested: {new Date(conn.createdAt).toLocaleDateString()}
                          </span>
                          {conn.updatedAt && conn.updatedAt !== conn.createdAt && (
                            <span data-testid={`text-connection-updated-${conn.id}`}>
                              Updated: {new Date(conn.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {conn.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelConnectionMutation.mutate(conn.id)}
                          disabled={cancelConnectionMutation.isPending}
                          data-testid={`button-cancel-connection-${conn.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <MessageCircle className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground" data-testid="text-no-connections">
                  You have no mentor connections yet. Find a mentor to get started.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("find")} data-testid="button-go-find-mentors">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find Mentors
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-request-dialog-title">
              Connect with {selectedMentor?.displayName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Send a message introducing yourself and explaining why you'd like to connect with this mentor.
            </p>
            <Textarea
              placeholder="Hi, I'm interested in learning more about..."
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              rows={4}
              data-testid="input-connection-message"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)} data-testid="button-cancel-request-dialog">
              Cancel
            </Button>
            <Button
              onClick={submitConnectionRequest}
              disabled={requestConnectionMutation.isPending || !connectionMessage.trim()}
              data-testid="button-submit-connection-request"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {requestConnectionMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mentorContentRecommendations.length > 0 && (
        <div data-testid="section-mentor-resources">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Resources to Share
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Relevant content you can reference with your mentees</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentorContentRecommendations.map((item) => {
                  const isPodcast = !!item.audioUrl;
                  const TypeIcon = isPodcast ? Headphones : FileText;

                  return (
                    <Card key={item.id} className="hover-elevate" data-testid={`card-mentor-resource-${item.id}`}>
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${isPodcast ? "bg-purple-500/10" : "bg-blue-500/10"}`}>
                            <TypeIcon className={`w-4 h-4 ${isPodcast ? "text-purple-500" : "text-blue-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2" data-testid={`text-mentor-resource-title-${item.id}`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`text-mentor-resource-description-${item.id}`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-xs" data-testid={`badge-mentor-resource-type-${item.id}`}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {isPodcast ? "Podcast" : "Blog"}
                            </Badge>
                            {item.bkdPillar && (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-mentor-resource-pillar-${item.id}`}>
                                {item.bkdPillar === "be" ? "Being" : item.bkdPillar === "know" ? "Knowing" : item.bkdPillar === "do" ? "Doing" : item.bkdPillar}
                              </Badge>
                            )}
                          </div>
                          {item.contentUrl && (
                            <a
                              href={item.contentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                              data-testid={`link-mentor-resource-${item.id}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
