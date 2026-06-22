import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  Building,
} from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google Workspace",
  azure: "Microsoft Entra / Azure AD",
  okta: "Okta",
  onelogin: "OneLogin",
  generic: "Generic OIDC",
};

const ssoFormSchema = z.object({
  displayName: z.string().min(1, "Required"),
  provider: z.enum(["google", "azure", "okta", "onelogin", "generic"]),
  issuerUrl: z.string().url("Must be a valid URL"),
  clientId: z.string().min(1, "Required"),
  clientSecret: z.string().optional(),
  allowedDomains: z.string().min(1, "Add at least one email domain"),
  defaultRole: z.enum(["student", "educator", "homeschool_parent"]),
  autoProvision: z.boolean(),
  enabled: z.boolean(),
});

type SsoFormData = z.infer<typeof ssoFormSchema>;

interface SsoConnection {
  id: string;
  organizationId: string;
  displayName: string;
  provider: string;
  issuerUrl: string;
  clientId: string;
  clientSecret: string | null;
  allowedDomains: string[] | null;
  defaultRole: string | null;
  autoProvision: boolean | null;
  enabled: boolean | null;
}

export default function SsoAdmin() {
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: myOrgs = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations/mine"],
  });

  // Only orgs where the user is an admin/owner can manage SSO.
  const adminOrgs = useMemo(
    () => myOrgs.filter((m) => m.role === "admin" || m.role === "owner"),
    [myOrgs],
  );

  const effectiveOrgId = selectedOrgId || adminOrgs[0]?.organization?.id || "";

  const { data: connections = [], isLoading } = useQuery<SsoConnection[]>({
    queryKey: ["/api/organizations", effectiveOrgId, "sso"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/organizations/${effectiveOrgId}/sso`);
      return res.json();
    },
    enabled: !!effectiveOrgId,
  });

  const form = useForm<SsoFormData>({
    resolver: zodResolver(ssoFormSchema),
    defaultValues: {
      displayName: "",
      provider: "generic",
      issuerUrl: "",
      clientId: "",
      clientSecret: "",
      allowedDomains: "",
      defaultRole: "educator",
      autoProvision: true,
      enabled: true,
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/organizations", effectiveOrgId, "sso"] });

  const createMutation = useMutation({
    mutationFn: async (data: SsoFormData) => {
      return await apiRequest("POST", `/api/organizations/${effectiveOrgId}/sso`, {
        ...data,
        allowedDomains: data.allowedDomains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      });
    },
    onSuccess: () => {
      invalidate();
      setIsAddOpen(false);
      form.reset();
      toast({ title: "SSO connection created" });
    },
    onError: (e: any) =>
      toast({ title: "Failed to create connection", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiRequest("PATCH", `/api/sso/connections/${id}`, { enabled }),
    onSuccess: () => invalidate(),
    onError: (e: any) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/sso/connections/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "SSO connection deleted" });
    },
    onError: (e: any) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/sso/connections/${id}/test`);
      return res.json();
    },
    onSuccess: (data: any) =>
      toast({
        title: data.success ? "Discovery succeeded" : "Discovery failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      }),
    onError: (e: any) =>
      toast({ title: "Test failed", description: e.message, variant: "destructive" }),
  });

  if (adminOrgs.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Enterprise SSO
            </CardTitle>
            <CardDescription>
              You must be an organization admin or owner to configure single sign-on.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Enterprise SSO
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Let your staff and students sign in with your school's identity provider (OIDC).
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-sso">
          <Plus className="h-4 w-4 mr-2" /> Add connection
        </Button>
      </div>

      {adminOrgs.length > 1 && (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <Select value={effectiveOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-72" data-testid="select-org">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {adminOrgs.map((m) => (
                <SelectItem key={m.organization?.id} value={m.organization?.id}>
                  {m.organization?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No SSO connections yet. Add one to enable "Sign in with your school".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <Card key={conn.id} data-testid={`card-sso-${conn.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {conn.displayName}
                      <Badge variant={conn.enabled ? "default" : "secondary"}>
                        {conn.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {PROVIDER_LABELS[conn.provider] || conn.provider} · {conn.issuerUrl}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={!!conn.enabled}
                    onCheckedChange={(enabled) => toggleMutation.mutate({ id: conn.id, enabled })}
                    data-testid={`switch-enabled-${conn.id}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(conn.allowedDomains || []).map((d) => (
                    <Badge key={d} variant="outline" data-testid={`badge-domain-${d}`}>
                      @{d}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  New users provisioned as <strong>{conn.defaultRole}</strong> ·{" "}
                  {conn.autoProvision ? "auto-provision on" : "auto-provision off"}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate(conn.id)}
                    disabled={testMutation.isPending}
                    data-testid={`button-test-${conn.id}`}
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(conn.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${conn.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add SSO connection</DialogTitle>
            <DialogDescription>
              Configure your identity provider's OIDC settings. The redirect/callback URL to register
              with your provider is shown after you save.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lincoln District Google Workspace" {...field} data-testid="input-display-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PROVIDER_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuer URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://accounts.google.com" {...field} data-testid="input-issuer" />
                    </FormControl>
                    <FormDescription>The OIDC discovery base URL.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-client-id" />
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
                    <FormLabel>Client secret</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} data-testid="input-client-secret" />
                    </FormControl>
                    <FormDescription>Stored encrypted at rest.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowedDomains"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed email domains</FormLabel>
                    <FormControl>
                      <Input placeholder="lincoln.edu, lincoln.k12.us" {...field} data-testid="input-domains" />
                    </FormControl>
                    <FormDescription>Comma-separated. Users with these domains use this connection.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default role for new users</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-default-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="educator">Educator</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="homeschool_parent">Homeschool Parent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Elevated roles are granted only through admin tools, never via SSO.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoProvision"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Auto-provision users</FormLabel>
                      <FormDescription>Create accounts automatically on first login.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-auto-provision" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Enabled</FormLabel>
                      <FormDescription>Turn the connection on for sign-in.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-enabled-new" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-sso">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save connection
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
