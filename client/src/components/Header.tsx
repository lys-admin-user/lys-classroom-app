import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsBell } from "./NotificationsBell";
import { LogIn, LogOut, Settings, CreditCard, Compass } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/my-journey": "My Journey",
  "/lesson-generator": "AI Lesson Generator",
  "/self-discovery": "Self Discovery",
  "/careers": "Career Explorer",
  "/action-plans": "Action Plans",
  "/resources": "Resources",
  "/my-lessons": "My Lessons",
  "/settings": "Settings",
  "/analytics": "Analytics",
  "/scope-sequence": "Scope & Sequence",
  "/curriculum-planning": "Curriculum Planning",
  "/curriculum-library": "Curriculum Library",
  "/educator-influence": "Educator Influence",
  "/admin/standards": "Standards Admin",
  "/pricing": "Plans & Pricing",
  "/onboarding": "Onboarding",
  "/assignments": "Assignments",
  "/collaboration": "Collaboration",
  "/resource-library": "Community Library",
  "/admin": "Campus Admin",
  "/system-admin": "System Admin",
  "/parent-portal": "Parent Portal",
  "/milestones": "Milestones",
  "/classroom": "Classroom",
  "/professional-development": "Professional Development",
  "/portfolio": "My Portfolio",
  "/assessments": "Assessments",
  "/sis-integration": "SIS Integration",
};

export function Header() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getPageTitle = () => {
    if (routeLabels[location]) return routeLabels[location];
    if (location.startsWith("/scope/")) return "Scope Editor";
    if (location.startsWith("/student-journey/")) return "Student Journey";
    if (location.startsWith("/student-dashboard/")) return "Student Dashboard";
    if (location.startsWith("/collaboration/")) return "Collaboration";
    if (location.startsWith("/shared/")) return "Shared Lesson";
    if (location.startsWith("/p/")) return "Portfolio";
    return "LYS";
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
      <SidebarTrigger className="-ml-1" data-testid="button-sidebar-toggle" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      {isCollapsed && (
        <>
          <Link href="/" className="flex items-center gap-1 mr-2">
            <span className="font-marker text-xl text-lys-red">L</span>
            <div className="w-3 h-5 flex flex-col justify-center mx-0.5">
              <div className="w-2 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
              <div className="w-2 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
              <div className="w-2 h-0.5 bg-lys-yellow rounded-full"></div>
            </div>
            <span className="font-marker text-xl text-lys-red">S</span>
          </Link>
          <Separator orientation="vertical" className="mr-2 h-4" />
        </>
      )}
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-oswald text-base">
              {getPageTitle()}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {!isAuthenticated && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="font-roboto gap-1.5"
            data-testid="button-find-your-fit"
          >
            <Link href="/start" aria-label="Find your fit">
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline">Find your fit</span>
            </Link>
          </Button>
        )}
        <NotificationsBell />
        <ThemeToggle />
        
        {isLoading ? (
          <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
        ) : isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-lys-teal text-white font-oswald text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                {user?.role && (
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {user.role.replace('_', ' ')}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Profile & Settings
                </DropdownMenuItem>
              </Link>
              <Link href="/pricing">
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Plans & Billing
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
