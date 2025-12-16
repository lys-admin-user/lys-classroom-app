import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/lesson-generator", label: "AI Lessons" },
  { href: "/assessments", label: "BE Tools" },
  { href: "/careers", label: "KNOW Paths" },
  { href: "/action-plans", label: "DO Plans" },
  { href: "/resources", label: "Resources" },
];

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              className="hidden sm:flex bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
              data-testid="button-get-started"
            >
              <Sparkles className="h-4 w-4" />
              Get Started Free
            </Button>
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
              <Button
                className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2 mt-2"
                data-testid="button-mobile-get-started"
              >
                <Sparkles className="h-4 w-4" />
                Get Started Free
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
