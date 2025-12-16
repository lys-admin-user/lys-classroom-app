import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { ReactNode } from "react";

interface BKDCardProps {
  type: "be" | "know" | "do";
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  stats?: {
    label: string;
    value: string;
  };
}

const typeStyles = {
  be: {
    border: "border-l-4 border-l-lys-yellow",
    iconBg: "bg-lys-yellow/10",
    iconColor: "text-lys-yellow",
    badge: "bg-lys-yellow/20 text-lys-yellow",
  },
  know: {
    border: "border-l-4 border-l-lys-red",
    iconBg: "bg-lys-red/10",
    iconColor: "text-lys-red",
    badge: "bg-lys-red/20 text-lys-red",
  },
  do: {
    border: "border-l-4 border-l-lys-teal",
    iconBg: "bg-lys-teal/10",
    iconColor: "text-lys-teal",
    badge: "bg-lys-teal/20 text-lys-teal",
  },
};

const typeLabels = {
  be: "Identity & Purpose",
  know: "Strategy & Resources",
  do: "Action & Impact",
};

export function BKDCard({ type, title, description, icon, href, stats }: BKDCardProps) {
  const styles = typeStyles[type];

  return (
    <Card className={`${styles.border} rounded-l-none hover-elevate transition-all duration-200`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-md ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}>
            {icon}
          </div>
          <span className={`text-xs font-oswald font-semibold px-2 py-1 rounded-md ${styles.badge}`}>
            {type.toUpperCase()}
          </span>
        </div>
        <CardTitle className="font-oswald text-xl mt-3">{title}</CardTitle>
        <CardDescription className="font-roboto text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="mb-4 py-3 px-4 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground font-roboto">{stats.label}</p>
            <p className="text-lg font-oswald font-semibold">{stats.value}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground font-roboto italic">
            {typeLabels[type]}
          </p>
          <Link href={href}>
            <Button variant="ghost" size="sm" className="gap-1 font-roboto" data-testid={`button-launch-${type}`}>
              Launch Tool
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
