import { useTier } from "@/hooks/use-tier";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

interface SponsoredAccessBadgeProps {
  className?: string;
}

export function SponsoredAccessBadge({ className = "" }: SponsoredAccessBadgeProps) {
  const { adSettings } = useTier();

  if (!adSettings.hasSponsoredAccess) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-lys-yellow/10 border-lys-yellow/30 text-lys-yellow ${className}`}
      data-testid="sponsored-access-badge"
    >
      <Heart className="w-3 h-3 mr-1 fill-lys-yellow" />
      Sponsored Access
    </Badge>
  );
}
