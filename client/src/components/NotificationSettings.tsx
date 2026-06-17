import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Mail, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DigestCadence = "off" | "daily" | "weekly";

interface NotificationSettingsData {
  emailDigestOptOut: boolean;
  inAppNotificationsOptOut: boolean;
  digestCadence: DigestCadence;
  mutedNotificationKinds: string[];
}

// Mirrors NOTIFICATION_KINDS in shared/schema.ts. Each kind can be muted
// individually so admins keep the urgent ones while silencing the chatty ones.
const NOTIFICATION_KINDS: Array<{ kind: string; label: string; description: string }> = [
  {
    kind: "ingestion_request_submitted",
    label: "New standards requests",
    description: "A teacher or admin asks LYS to ingest a new jurisdiction's standards.",
  },
  {
    kind: "sync_run_failed",
    label: "Sync failures",
    description: "A scheduled standards sync run errors out.",
  },
  {
    kind: "verbatim_rejection_spike",
    label: "Verbatim-rejection spikes",
    description: "A run drops 5+ AI suggestions for failing the verbatim-in-source check.",
  },
  {
    kind: "pending_standards_ready",
    label: "Pending standards ready",
    description: "Freshly extracted standards are waiting in the moderation queue.",
  },
];

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

  const inAppReceive = !(data?.inAppNotificationsOptOut ?? false);
  const cadence: DigestCadence = data?.digestCadence ?? "weekly";
  const muted = new Set(data?.mutedNotificationKinds ?? []);

  const toggleKind = (kind: string, mute: boolean) => {
    const next = new Set(muted);
    if (mute) next.add(kind);
    else next.delete(kind);
    update.mutate({ mutedNotificationKinds: Array.from(next) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-oswald flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications
        </CardTitle>
        <CardDescription className="font-roboto">
          Standards-pipeline alerts and the admin digest. System admins receive
          these by default; teachers can ignore — they only fire for admin-only
          events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="select-digest-cadence" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email digest
                </Label>
                <p className="text-xs text-muted-foreground">
                  A summary of new requests, coverage gaps, and failed sync runs.
                  Daily arrives every morning; weekly arrives Monday mornings.
                </p>
              </div>
              <Select
                value={cadence}
                disabled={update.isPending}
                onValueChange={(value) =>
                  update.mutate({ digestCadence: value as DigestCadence })
                }
              >
                <SelectTrigger
                  id="select-digest-cadence"
                  className="w-32"
                  data-testid="select-digest-cadence"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off" data-testid="option-cadence-off">Off</SelectItem>
                  <SelectItem value="daily" data-testid="option-cadence-daily">Daily</SelectItem>
                  <SelectItem value="weekly" data-testid="option-cadence-weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="toggle-in-app-notifications" className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" /> In-app notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bell badge in the top bar for urgent events like sync failures
                  and verbatim-rejection spikes.
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

            <div className="space-y-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Mute specific alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Turn off individual in-app notification types without silencing
                  the bell entirely.
                </p>
              </div>
              <div className="space-y-3 pl-1">
                {NOTIFICATION_KINDS.map(({ kind, label, description }) => {
                  const enabled = inAppReceive && !muted.has(kind);
                  return (
                    <div key={kind} className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor={`toggle-kind-${kind}`}
                          className="text-sm font-normal"
                        >
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={`toggle-kind-${kind}`}
                        checked={enabled}
                        disabled={update.isPending || !inAppReceive}
                        onCheckedChange={(checked) => toggleKind(kind, !checked)}
                        data-testid={`switch-kind-${kind}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
