import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail,
  ExternalLink,
  Download,
  Share2,
  Copy,
  Check,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Star,
  Heart,
  Compass,
  Target,
  Calendar,
  Globe,
  Eye,
  Flag,
  Loader2
} from "lucide-react";
import { SiLinkedin } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { StudentPortfolio, PortfolioItem } from "@shared/schema";

const itemTypes = [
  { value: "assignment", label: "Assignment", icon: FileText },
  { value: "project", label: "Project", icon: Briefcase },
  { value: "certificate", label: "Certificate", icon: Award },
  { value: "achievement", label: "Achievement", icon: Star },
  { value: "reflection", label: "Reflection", icon: Heart },
  { value: "custom", label: "Custom", icon: FileText },
];

const bkdLabels = {
  be: { label: "BE", color: "bg-lys-yellow text-lys-yellow-foreground", description: "Identity & Purpose", icon: Heart },
  know: { label: "KNOW", color: "bg-lys-teal text-white", description: "Strategy & Resources", icon: Compass },
  do: { label: "DO", color: "bg-lys-red text-white", description: "Action & Application", icon: Target }
};

const themeStyles = {
  professional: {
    headerBg: "bg-gradient-to-r from-slate-800 to-slate-900",
    headerText: "text-white",
    accent: "text-lys-teal",
  },
  creative: {
    headerBg: "bg-gradient-to-r from-lys-red to-lys-yellow",
    headerText: "text-white",
    accent: "text-lys-red",
  },
  minimal: {
    headerBg: "bg-muted",
    headerText: "text-foreground",
    accent: "text-lys-teal",
  },
  academic: {
    headerBg: "bg-gradient-to-r from-teal-900 to-teal-800",
    headerText: "text-white",
    accent: "text-teal-500",
  },
};

export default function PortfolioView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug;
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportingItem, setReportingItem] = useState<PortfolioItem | null>(null);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportNotes, setReportNotes] = useState("");

  const isTeacherOrAdmin = user && ["educator", "campus_admin", "district_admin", "site_admin", "system_admin"].includes(user.role ?? "");

  const { data, isLoading, error } = useQuery<{ portfolio: StudentPortfolio; items: PortfolioItem[] }>({
    queryKey: ["/api/portfolio/public", slug],
    enabled: !!slug,
  });

  const reportItemMutation = useMutation({
    mutationFn: async ({ itemId, reason, notes }: { itemId: string; reason: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/portfolio-reports", { portfolioItemId: itemId, reason, notes });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Item Flagged", description: "This portfolio item has been reported for review." });
      setReportingItem(null);
      setReportReason("inappropriate");
      setReportNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
    },
  });

  const portfolio = data?.portfolio;
  const items = data?.items || [];

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: "Link copied!", description: "Share this portfolio with others." });
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="font-oswald text-xl">Portfolio Not Found</CardTitle>
            <CardDescription>
              This portfolio may be private or no longer exists.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const theme = themeStyles[portfolio.theme as keyof typeof themeStyles] || themeStyles.professional;
  const highlightedItems = items.filter(i => i.highlighted);
  const regularItems = items.filter(i => !i.highlighted);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header */}
      <div className={`${theme.headerBg} ${theme.headerText} py-12 px-6 print:py-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {portfolio.profileImageUrl && (
              <Avatar className="w-24 h-24 border-4 border-white/20">
                <AvatarImage src={portfolio.profileImageUrl} />
                <AvatarFallback className="text-2xl">
                  {portfolio.title.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-permanent-marker mb-2">
                {portfolio.title}
              </h1>
              {portfolio.bio && (
                <p className="text-lg opacity-90 max-w-2xl">
                  {portfolio.bio}
                </p>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                {portfolio.contactEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-inherit"
                    onClick={() => window.location.href = `mailto:${portfolio.contactEmail}`}
                    data-testid="button-contact-email"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                )}
                {portfolio.linkedinUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-inherit"
                    onClick={() => window.open(portfolio.linkedinUrl!, "_blank")}
                    data-testid="button-linkedin"
                  >
                    <SiLinkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
                {portfolio.handshakeUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-inherit"
                    onClick={() => window.open(portfolio.handshakeUrl!, "_blank")}
                    data-testid="button-handshake"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Handshake
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-inherit"
                onClick={handleCopyLink}
                data-testid="button-share-portfolio"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-inherit"
                onClick={handleDownloadPDF}
                data-testid="button-download-portfolio"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {portfolio.skills && portfolio.skills.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 -mt-4 print:mt-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {portfolio.skills.map((skill, i) => (
              <Badge key={i} variant="secondary" className="bg-background shadow-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground print:hidden">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{portfolio.viewCount || 0} views</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{items.length} items</span>
          </div>
        </div>

        {/* Highlighted Items */}
        {highlightedItems.length > 0 && (
          <section>
            <h2 className={`text-xl font-oswald ${theme.accent} flex items-center gap-2 mb-4`}>
              <Star className="w-5 h-5 text-lys-yellow fill-lys-yellow" />
              Featured Work
            </h2>
            <div className="grid gap-4">
              {highlightedItems.map((item) => (
                <PortfolioItemCard key={item.id} item={item} featured onReport={isTeacherOrAdmin ? () => setReportingItem(item) : undefined} />
              ))}
            </div>
          </section>
        )}

        {/* All Items */}
        {regularItems.length > 0 && (
          <section>
            <h2 className={`text-xl font-oswald ${theme.accent} mb-4`}>
              Portfolio
            </h2>
            <div className="grid gap-4">
              {regularItems.map((item) => (
                <PortfolioItemCard key={item.id} item={item} onReport={isTeacherOrAdmin ? () => setReportingItem(item) : undefined} />
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              This portfolio doesn't have any items yet.
            </p>
          </Card>
        )}

        {/* Education */}
        {portfolio.education && portfolio.education.length > 0 && (
          <section>
            <h2 className={`text-xl font-oswald ${theme.accent} flex items-center gap-2 mb-4`}>
              <GraduationCap className="w-5 h-5" />
              Education
            </h2>
            <div className="space-y-3">
              {portfolio.education.map((edu, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-oswald">{edu.institution}</h4>
                        {edu.degree && (
                          <p className="text-sm text-muted-foreground">
                            {edu.degree} {edu.field && `in ${edu.field}`}
                          </p>
                        )}
                      </div>
                      {(edu.startYear || edu.endYear) && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {edu.startYear} - {edu.current ? "Present" : edu.endYear}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <Separator />
        <footer className="text-center text-sm text-muted-foreground py-4 print:hidden">
          <p>
            Built with <span className="text-lys-red">LYS</span> - Laddering Your Success
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => window.open("https://linkedin.com", "_blank")}
              data-testid="button-footer-linkedin"
            >
              <SiLinkedin className="w-4 h-4 mr-1" />
              Share on LinkedIn
            </Button>
          </div>
        </footer>
      </div>

      {/* Report Portfolio Item Dialog */}
      <Dialog open={!!reportingItem} onOpenChange={(open) => { if (!open) { setReportingItem(null); setReportNotes(""); }}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Flag Portfolio Item
            </DialogTitle>
            <DialogDescription>
              Flag "{reportingItem?.customTitle}" for review. This will be visible to campus administration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason for Flagging</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger data-testid="select-report-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="inaccurate">Inaccurate Information</SelectItem>
                  <SelectItem value="plagiarism">Potential Plagiarism</SelectItem>
                  <SelectItem value="privacy">Privacy Concern</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Provide additional context..."
                rows={3}
                data-testid="input-report-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportingItem(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (reportingItem) {
                  reportItemMutation.mutate({ itemId: reportingItem.id, reason: reportReason, notes: reportNotes });
                }
              }}
              disabled={reportItemMutation.isPending}
              data-testid="button-submit-report"
            >
              {reportItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
              Submit Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PortfolioItemCard({ item, featured = false, onReport }: { item: PortfolioItem; featured?: boolean; onReport?: () => void }) {
  const typeInfo = itemTypes.find(t => t.value === item.itemType) || itemTypes[5];
  const TypeIcon = typeInfo.icon;
  const bkd = item.bkdFocus ? bkdLabels[item.bkdFocus as keyof typeof bkdLabels] : null;

  return (
    <Card className={featured ? "border-lys-yellow border-2" : ""} data-testid={`card-view-item-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-md ${featured ? "bg-lys-yellow/10" : "bg-muted"}`}>
            <TypeIcon className={`w-6 h-6 ${featured ? "text-lys-yellow" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-oswald text-lg">{item.customTitle}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {typeInfo.label}
                  </Badge>
                  {item.completedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.completedAt).toLocaleDateString()}
                    </span>
                  )}
                  {item.score && (
                    <Badge variant="secondary">{item.score}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bkd && (
                  <Badge className={bkd.color}>
                    <bkd.icon className="w-3 h-3 mr-1" />
                    {bkd.label}
                  </Badge>
                )}
                {onReport && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    title="Flag this item for review"
                    onClick={onReport}
                    data-testid={`button-flag-item-${item.id}`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            {item.customDescription && (
              <p className="text-sm text-muted-foreground mt-2">
                {item.customDescription}
              </p>
            )}
            {item.skills && item.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {item.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
            {item.metadata && (
              <div className="mt-3 text-xs text-muted-foreground">
                {item.metadata.course && <span>Course: {item.metadata.course}</span>}
                {item.metadata.educator && <span className="ml-3">Educator: {item.metadata.educator}</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
