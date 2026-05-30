import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsData {
  emailDigestOptOut: boolean;
  inAppNotificationsOptOut: boolean;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<NotificationSettingsData>({
    queryKey: ["/api/notification-settings"],
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<NotificationSettingsData>) => {
      return await apiRequest("PATCH", "/api/notification-settings", patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: "Notification preferences updated" });
    },
    onError: () => {
      toast({ title: "Failed to update preferences", variant: "destructive" });
    },
  });

  const emailReceive = !(data?.emailDigestOptOut ?? false);
  const inAppReceive = !(data?.inAppNotificationsOptOut ?? false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-oswald flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription className="font-roboto">
          Standards-pipeline alerts and the weekly admin digest. System admins
          receive these by default; teachers can ignore — they only fire for
          admin-only events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="toggle-email-digest" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Weekly email digest
                </Label>
                <p className="text-xs text-muted-foreground">
                  A Monday-morning summary of new requests, coverage gaps, and
                  failed sync runs.
                </p>
              </div>
              <Switch
                id="toggle-email-digest"
                checked={emailReceive}
                disabled={update.isPending}
                onCheckedChange={(checked) =>
                  update.mutate({ emailDigestOptOut: !checked })
                }
                data-testid="switch-email-digest"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="toggle-in-app-notifications" className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" /> In-app notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bell badge in the top bar for urgent events like sync
                  failures and verbatim-rejection spikes.
                </p>
              </div>
              <Switch
                id="toggle-in-app-notifications"
                checked={inAppReceive}
                disabled={update.isPending}
                onCheckedChange={(checked) =>
                  update.mutate({ inAppNotificationsOptOut: !checked })
                }
                data-testid="switch-in-app-notifications"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
