import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  GraduationCap, 
  School, 
  BookOpen, 
  Building, 
  Cloud, 
  Link2, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Settings,
  Users,
  History,
  Loader2,
  ExternalLink
} from "lucide-react";

const providerIcons: Record<string, React.ReactNode> = {
  clever: <GraduationCap className="h-5 w-5" />,
  powerschool: <School className="h-5 w-5" />,
  canvas: <BookOpen className="h-5 w-5" />,
  infinite_campus: <Building className="h-5 w-5" />,
  skyward: <Cloud className="h-5 w-5" />,
  oneroster: <Link2 className="h-5 w-5" />,
  classlink: <Link2 className="h-5 w-5" />,
};

const COMING_SOON_PROVIDERS = ["powerschool", "canvas", "infinite_campus", "skyward"];

const CLIENT_CREDENTIALS_PROVIDERS = ["oneroster", "classlink"];

const statusColors: Record<string, string> = {
  connected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  disconnected: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const connectionSchema = z.object({
  provider: z.enum(["clever", "powerschool", "canvas", "infinite_campus", "skyward", "oneroster", "classlink"]),
  providerName: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
  accessToken: z.string().optional(),
  districtId: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tokenUrl: z.string().url().optional().or(z.literal("")),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

export default function SISIntegration() {
  const { toast } = useToast();
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: providers } = useQuery<Record<string, any>>({
    queryKey: ["/api/integrations/sis/providers"],
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/integrations/sis/connections"],
  });

  const form = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      provider: "clever",
      providerName: "",
      baseUrl: "",
      accessToken: "",
      districtId: "",
      clientId: "",
      clientSecret: "",
      tokenUrl: "",
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: ConnectionFormData) => {
      return await apiRequest("POST", "/api/integrations/sis/connections", {
        ...data,
        baseUrl: data.baseUrl || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/sis/connections"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Connection created",
        description: "Your SIS connection has been created. You can now sync data.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create connection",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest("POST", `/api/integrations/sis/connections/${connectionId}/test`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/sis/connections"] });
      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async ({ connectionId, syncType }: { connectionId: string; syncType: string }) => {
      const res = await apiRequest("POST", `/api/integrations/sis/connections/${connectionId}/sync`, { syncType });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/sis/connections"] });
      toast({
        title: "Sync completed",
        description: `Processed ${data.recordsProcessed} records. Created: ${data.recordsCreated}, Updated: ${data.recordsUpdated}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync data",
        variant: "destructive",
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return await apiRequest("DELETE", `/api/integrations/sis/connections/${connectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/sis/connections"] });
      setSelectedConnection(null);
      toast({
        title: "Connection deleted",
        description: "The SIS connection has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConnectionFormData) => {
    createConnectionMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-sis-title">SIS Integration</h1>
          <p className="text-muted-foreground">
            Connect your Student Information System to sync students, classes, and data
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-sis">
              <Plus className="h-4 w-4 mr-2" />
              Connect SIS
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Connect Student Information System</DialogTitle>
              <DialogDescription>
                Connect your school's SIS to import students, classes, and sync data.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIS Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-provider">
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers && Object.entries(providers as Record<string, any>).map(([key, info]: [string, any]) => {
                            const isComingSoon = COMING_SOON_PROVIDERS.includes(key);
                            return (
                              <SelectItem key={key} value={key} disabled={isComingSoon} data-testid={`option-provider-${key}`}>
                                <div className="flex items-center gap-2">
                                  {providerIcons[key]}
                                  <span>{info.name}</span>
                                  {isComingSoon && (
                                    <span className="ml-1 text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                      Coming Soon
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose your school's Student Information System
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Lincoln High School" 
                          {...field} 
                          data-testid="input-provider-name"
                        />
                      </FormControl>
                      <FormDescription>
                        A friendly name to identify this connection
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Base URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://your-district.powerschool.com" 
                          {...field} 
                          data-testid="input-base-url"
                        />
                      </FormControl>
                      <FormDescription>
                        Required for PowerSchool, Canvas, and self-hosted systems
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Token (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Paste your API access token" 
                          {...field} 
                          data-testid="input-access-token"
                        />
                      </FormControl>
                      <FormDescription>
                        For systems that provide API tokens. Or use OAuth below.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="districtId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your district identifier" 
                          {...field} 
                          data-testid="input-district-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {CLIENT_CREDENTIALS_PROVIDERS.includes(form.watch("provider")) && (
                  <div className="space-y-4 rounded-lg border border-border p-4" data-testid="section-client-credentials">
                    <p className="text-sm font-medium">OAuth2 Client Credentials</p>
                    <p className="text-xs text-muted-foreground">
                      OneRoster and ClassLink use a client ID and secret to fetch an access token automatically. Get these from your roster server's developer console.
                    </p>
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your OneRoster/ClassLink client ID"
                              {...field}
                              data-testid="input-client-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Secret</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Your client secret"
                              {...field}
                              data-testid="input-client-secret"
                            />
                          </FormControl>
                          <FormDescription>
                            Stored encrypted at rest.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tokenUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://your-roster-server/token"
                              {...field}
                              data-testid="input-token-url"
                            />
                          </FormControl>
                          <FormDescription>
                            Defaults to <code>{"{Base URL}/token"}</code> if left blank.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createConnectionMutation.isPending} data-testid="button-submit-connection">
                    {createConnectionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Connection
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 flex items-start gap-3" data-testid="banner-sis-coming-soon">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Clever, OneRoster, and ClassLink are fully supported</p>
          <p className="text-amber-700 dark:text-amber-400 text-sm">
            Clever (OAuth) plus OneRoster 1.1 and ClassLink (OAuth2 client credentials) are live and will sync rosters today. PowerSchool, Canvas LMS, Infinite Campus, and Skyward are <strong>coming soon</strong> — they appear in the provider list for planning purposes but will not successfully sync yet.
          </p>
        </div>
      </div>

      {connectionsLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !connections || (connections as any[]).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SIS Connections</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Connect your school's Student Information System to import students, sync class rosters, and transfer data seamlessly.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-sis">
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First SIS
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(connections as any[]).map((connection: any) => (
            <Card 
              key={connection.id} 
              className={`cursor-pointer hover-elevate transition-all ${
                selectedConnection?.id === connection.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedConnection(connection)}
              data-testid={`card-connection-${connection.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      {providerIcons[connection.provider]}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {connection.providerName || (providers as any)?.[connection.provider]?.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {connection.districtId || "No district ID"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={statusColors[connection.status] || statusColors.disconnected}>
                    {connection.status === "connected" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {connection.status === "error" && <XCircle className="h-3 w-3 mr-1" />}
                    {connection.status === "pending" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {connection.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      testConnectionMutation.mutate(connection.id);
                    }}
                    disabled={testConnectionMutation.isPending}
                    data-testid={`button-test-${connection.id}`}
                  >
                    {testConnectionMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Test
                  </Button>
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      syncMutation.mutate({ connectionId: connection.id, syncType: "full" });
                    }}
                    disabled={syncMutation.isPending || connection.status !== "connected"}
                    data-testid={`button-sync-${connection.id}`}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Sync All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this connection?")) {
                        deleteConnectionMutation.mutate(connection.id);
                      }
                    }}
                    data-testid={`button-delete-${connection.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {connection.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {new Date(connection.lastSyncAt).toLocaleDateString()}
                  </p>
                )}
                {connection.syncError && (
                  <p className="text-xs text-destructive mt-1">{connection.syncError}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedConnection && (
        <div className="mt-8">
          <Tabs defaultValue="students">
            <TabsList>
              <TabsTrigger value="students" data-testid="tab-students">
                <Users className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="courses" data-testid="tab-courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                <History className="h-4 w-4 mr-2" />
                Sync History
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-4">
              <SisStudentsTab connectionId={selectedConnection.id} />
            </TabsContent>

            <TabsContent value="courses" className="mt-4">
              <SisCoursesTab connectionId={selectedConnection.id} />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <SisSyncHistoryTab connectionId={selectedConnection.id} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <SisSettingsTab connection={selectedConnection} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported SIS Providers</CardTitle>
            <CardDescription>
              LYS integrates with major Student Information Systems used by schools worldwide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers && Object.entries(providers as Record<string, any>).map(([key, info]: [string, any]) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-md bg-background">
                    {providerIcons[key]}
                  </div>
                  <div>
                    <h4 className="font-medium">{info.name}</h4>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {info.supports?.map((feature: string) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SisStudentsTab({ connectionId }: { connectionId: string }) {
  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/integrations/sis/connections", connectionId, "students"],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/sis/connections/${connectionId}/students`, { credentials: "include" });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No students synced yet. Run a sync to import students.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="divide-y">
          {students.map((student: any) => (
            <div key={student.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{student.firstName} {student.lastName}</p>
                <p className="text-sm text-muted-foreground">
                  {student.email || "No email"} • Grade {student.gradeLevel || "N/A"}
                </p>
              </div>
              <Badge variant={student.enrollmentStatus === "active" ? "default" : "secondary"}>
                {student.enrollmentStatus || "Unknown"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SisCoursesTab({ connectionId }: { connectionId: string }) {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/integrations/sis/connections", connectionId, "courses"],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/sis/connections/${connectionId}/courses`, { credentials: "include" });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No courses synced yet. Run a sync to import courses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="divide-y">
          {courses.map((course: any) => (
            <div key={course.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{course.name}</p>
                <p className="text-sm text-muted-foreground">
                  {course.courseCode || "No code"} • {course.subject || "No subject"} • {course.studentCount || 0} students
                </p>
              </div>
              <Badge variant={course.status === "active" ? "default" : "secondary"}>
                {course.status || "Unknown"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SisSyncHistoryTab({ connectionId }: { connectionId: string }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/integrations/sis/connections", connectionId, "history"],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/sis/connections/${connectionId}/history`, { credentials: "include" });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <History className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No sync history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="divide-y">
          {history.map((entry: any) => (
            <div key={entry.id} className="py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant={entry.status === "completed" ? "default" : entry.status === "failed" ? "destructive" : "secondary"}>
                    {entry.status}
                  </Badge>
                  <span className="text-sm font-medium">{entry.syncType} sync</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.startedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Processed: {entry.recordsProcessed} • Created: {entry.recordsCreated} • Updated: {entry.recordsUpdated}
                {entry.errorCount > 0 && ` • Errors: ${entry.errorCount}`}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SisSettingsTab({ connection }: { connection: any }) {
  const { toast } = useToast();
  const settings = connection.settings || {};

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      return await apiRequest("PATCH", `/api/integrations/sis/connections/${connection.id}`, { settings: newSettings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/sis/connections"] });
      toast({
        title: "Settings updated",
        description: "Your sync settings have been saved.",
      });
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sync Settings</CardTitle>
        <CardDescription>Configure what data to sync from your SIS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Auto Sync</p>
            <p className="text-sm text-muted-foreground">Automatically sync data on schedule</p>
          </div>
          <Switch
            checked={settings.autoSync || false}
            onCheckedChange={(checked) => handleToggle("autoSync", checked)}
            data-testid="switch-auto-sync"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sync Students</p>
            <p className="text-sm text-muted-foreground">Import student roster from SIS</p>
          </div>
          <Switch
            checked={settings.syncStudents !== false}
            onCheckedChange={(checked) => handleToggle("syncStudents", checked)}
            data-testid="switch-sync-students"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sync Teachers</p>
            <p className="text-sm text-muted-foreground">Import teacher information</p>
          </div>
          <Switch
            checked={settings.syncTeachers !== false}
            onCheckedChange={(checked) => handleToggle("syncTeachers", checked)}
            data-testid="switch-sync-teachers"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sync Courses</p>
            <p className="text-sm text-muted-foreground">Import class/course sections</p>
          </div>
          <Switch
            checked={settings.syncCourses !== false}
            onCheckedChange={(checked) => handleToggle("syncCourses", checked)}
            data-testid="switch-sync-courses"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sync Grades</p>
            <p className="text-sm text-muted-foreground">Export grades back to SIS (requires permission)</p>
          </div>
          <Switch
            checked={settings.syncGrades || false}
            onCheckedChange={(checked) => handleToggle("syncGrades", checked)}
            data-testid="switch-sync-grades"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sync Attendance</p>
            <p className="text-sm text-muted-foreground">Import/export attendance data</p>
          </div>
          <Switch
            checked={settings.syncAttendance || false}
            onCheckedChange={(checked) => handleToggle("syncAttendance", checked)}
            data-testid="switch-sync-attendance"
          />
        </div>
      </CardContent>
    </Card>
  );
}
