import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, Sparkles, LogIn, LogOut, BookOpen, User, BarChart3, Award, Database, Users, Library, Briefcase } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/lesson-generator", label: "AI Lessons" },
  { href: "/self-discovery", label: "Self Discovery" },
  { href: "/careers", label: "KNOW Paths" },
  { href: "/action-plans", label: "DO Plans" },
  { href: "/resources", label: "Resources" },
];

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center">
              <span className="font-marker text-2xl text-lys-red">L</span>
              <div className="w-4 h-6 flex flex-col justify-center mx-0.5">
                <div className="w-3 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
                <div className="w-3 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
                <div className="w-3 h-0.5 bg-lys-yellow rounded-full"></div>
              </div>
              <span className="font-marker text-2xl text-lys-red">S</span>
            </div>
            <span className="hidden sm:block font-oswald text-sm text-muted-foreground font-medium">
              Laddering Your Success
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className="font-roboto"
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link href="/scope-sequence">
                  <Button
                    variant={location === "/scope-sequence" || location.startsWith("/scope/") ? "secondary" : "ghost"}
                    size="sm"
                    className="font-roboto"
                    data-testid="nav-scope-sequence"
                  >
                    Scope & Sequence
                  </Button>
                </Link>
                <Link href="/my-lessons">
                  <Button
                    variant={location === "/my-lessons" ? "secondary" : "ghost"}
                    size="sm"
                    className="font-roboto"
                    data-testid="nav-my-lessons"
                  >
                    My Lessons
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button
                    variant={location === "/templates" ? "secondary" : "ghost"}
                    size="sm"
                    className="font-roboto"
                    data-testid="nav-templates"
                  >
                    Templates
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button
                    variant={location === "/portfolio" ? "secondary" : "ghost"}
                    size="sm"
                    className="font-roboto"
                    data-testid="nav-portfolio"
                  >
                    Portfolio
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button
                    variant={location === "/analytics" ? "secondary" : "ghost"}
                    size="sm"
                    className="font-roboto"
                    data-testid="nav-analytics"
                  >
                    Analytics
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
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
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/my-lessons">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-my-lessons">
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Lessons
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/templates">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-templates">
                      <Library className="mr-2 h-4 w-4" />
                      Templates
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/portfolio">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-portfolio">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Portfolio
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/analytics">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-analytics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/educator-influence">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-educator-influence">
                      <Award className="mr-2 h-4 w-4" />
                      Educator Influence
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/parent-portal">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-parent-portal">
                      <Users className="mr-2 h-4 w-4" />
                      Parent Portal
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/standards">
                    <DropdownMenuItem className="cursor-pointer" data-testid="menu-standards-admin">
                      <Database className="mr-2 h-4 w-4" />
                      Standards Admin
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
                className="hidden sm:flex bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={location === link.href ? "secondary" : "ghost"}
                    className="w-full justify-start font-roboto"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <Link href="/scope-sequence">
                    <Button
                      variant={location === "/scope-sequence" || location.startsWith("/scope/") ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-scope-sequence"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Scope & Sequence
                    </Button>
                  </Link>
                  <Link href="/my-lessons">
                    <Button
                      variant={location === "/my-lessons" ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-my-lessons"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Lessons
                    </Button>
                  </Link>
                  <Link href="/templates">
                    <Button
                      variant={location === "/templates" ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-templates"
                    >
                      <Library className="mr-2 h-4 w-4" />
                      Templates
                    </Button>
                  </Link>
                  <Link href="/portfolio">
                    <Button
                      variant={location === "/portfolio" ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-portfolio"
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      Portfolio
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button
                      variant={location === "/analytics" ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-analytics"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                  </Link>
                  <Link href="/educator-influence">
                    <Button
                      variant={location === "/educator-influence" ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-educator-influence"
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Educator Influence
                    </Button>
                  </Link>
                  <Link href="/parent-portal">
                    <Button
                      variant={location === "/parent-portal" ? "secondary" : "ghost"}
                      className="w-full justify-start font-roboto"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="mobile-nav-parent-portal"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Parent Portal
                    </Button>
                  </Link>
                </>
              )}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="mobile-button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              ) : (
                <Button
                  className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2 mt-2"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="mobile-button-login"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In Free
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
