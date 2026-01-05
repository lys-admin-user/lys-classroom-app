import { useQuery } from "@tanstack/react-query";
import { useTier } from "@/hooks/use-tier";
import { ExternalLink } from "lucide-react";

interface ContextualSponsorshipProps {
  placement: "roadmap" | "career_explorer" | "lesson_header" | "dashboard" | "portfolio";
  className?: string;
}

interface Sponsorship {
  id: string;
  sponsorName: string;
  sponsorLogoUrl: string | null;
  sponsorUrl: string | null;
  messageTemplate: string;
  placement: string;
}

export function ContextualSponsorship({ placement, className = "" }: ContextualSponsorshipProps) {
  const { adSettings, hasFocusMode, isLoading: tierLoading } = useTier();
  
  const { data: sponsorship } = useQuery<Sponsorship | null>({
    queryKey: ["/api/ads/sponsorship", placement],
    enabled: adSettings.showAds && !hasFocusMode,
  });

  if (tierLoading || hasFocusMode || !adSettings.showAds) {
    return null;
  }

  if (!sponsorship) {
    return null;
  }

  const handleClick = () => {
    if (sponsorship.sponsorUrl) {
      window.open(sponsorship.sponsorUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div 
      className={`flex items-center justify-center gap-2 py-2 px-4 bg-muted/30 border-b border-border/50 text-xs text-muted-foreground font-roboto ${className}`}
      data-testid={`sponsorship-${placement}`}
    >
      {sponsorship.sponsorLogoUrl && (
        <img 
          src={sponsorship.sponsorLogoUrl} 
          alt={sponsorship.sponsorName}
          className="h-4 w-auto"
        />
      )}
      <span>
        {sponsorship.messageTemplate.replace("{sponsor}", sponsorship.sponsorName)}
      </span>
      {sponsorship.sponsorUrl && (
        <button 
          onClick={handleClick}
          className="inline-flex items-center gap-1 text-primary/70 hover:text-primary transition-colors"
          data-testid={`sponsorship-link-${placement}`}
        >
          Learn more
          <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
