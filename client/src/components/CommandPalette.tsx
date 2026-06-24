import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useViewAs } from "@/hooks/use-view-as";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Settings as SettingsIcon, CreditCard, HelpCircle } from "lucide-react";
import {
  navigationGroups,
  hasMinRole,
  type NavGroup,
  type NavItem,
} from "@/components/AppSidebar";

// Extra destinations that live in the sidebar footer rather than the main nav.
const QUICK_LINKS: NavItem[] = [
  { title: "Settings", url: "/settings", icon: SettingsIcon },
  { title: "Plans & Pricing", url: "/pricing", icon: CreditCard },
  { title: "Help Desk", url: "/help", icon: HelpCircle },
];

// Global "jump to" command palette. Opens with Cmd/Ctrl+K and lists exactly
// the destinations the current user's role can see, reusing the same gating
// rules as AppSidebar so the two never drift apart. Navigation uses wouter.
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { viewAsStudent } = useViewAs();
  const actualRole = user?.role || "student";
  // Mirror AppSidebar: when an educator+ turns on student view, the palette
  // lists the same student destinations so the two nav surfaces never drift.
  const isEducatorPlus = hasMinRole(actualRole, "educator");
  const userRole = viewAsStudent && isEducatorPlus ? "student" : actualRole;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    // Lets a visible "Search" button (in the header) open the palette so it's
    // discoverable for users who don't know the keyboard shortcut.
    const openPalette = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", openPalette);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  const showItem = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.exactRole) return userRole === item.exactRole;
    if (item.minRole) return hasMinRole(userRole, item.minRole);
    return true;
  };

  const showGroup = (group: NavGroup) => {
    if (group.exactRole) return isAuthenticated && userRole === group.exactRole;
    if (group.minRole) return isAuthenticated && hasMinRole(userRole, group.minRole);
    return true;
  };

  const go = (url: string) => {
    setOpen(false);
    setLocation(url);
  };

  const visibleGroups = navigationGroups
    .filter(showGroup)
    .map((g) => ({ label: g.label, items: g.items.filter(showItem) }))
    .filter((g) => g.items.length > 0);

  const quickVisible = QUICK_LINKS.filter(showItem);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a page or tool..." data-testid="input-command-search" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {visibleGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={`${group.label}-${item.url}`}
                  value={`${group.label} ${item.title}`}
                  onSelect={() => go(item.url)}
                  data-testid={`command-item-${item.url.replace(/[^a-z0-9]+/gi, "-")}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        {quickVisible.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Links">
              {quickVisible.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`quick-${item.url}`}
                    value={`quick ${item.title}`}
                    onSelect={() => go(item.url)}
                    data-testid={`command-item-quick-${item.url.replace(/[^a-z0-9]+/gi, "-")}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
