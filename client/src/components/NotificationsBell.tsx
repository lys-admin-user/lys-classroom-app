import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsBell() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const isSystemAdmin = isAuthenticated && user?.role === "system_admin";

  const { data, isLoading } = useQuery<{
    items: NotificationItem[];
    unread: number;
  }>({
    queryKey: ["/api/admin/notifications"],
    enabled: isSystemAdmin,
    refetchInterval: 60_000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  if (!isSystemAdmin) return null;

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications-bell"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full"
              data-testid="badge-notifications-unread"
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="font-oswald text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            data-testid="button-notifications-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const content = (
                  <div
                    className={`px-4 py-3 hover:bg-muted/50 cursor-pointer ${
                      !n.isRead ? "bg-muted/30" : ""
                    }`}
                    data-testid={`notification-item-${n.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-snug">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span
                          className="mt-1 h-2 w-2 rounded-full bg-lys-red flex-shrink-0"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
