import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Check, Share2, Eye, Users, Award, Link2 } from "lucide-react";
import { SiFacebook, SiLinkedin } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import type { EducatorAffiliate } from "@shared/schema";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  lessonTitle: string;
}

export function ShareDialog({ open, onOpenChange, lessonId, lessonTitle }: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const { data: affiliate } = useQuery<EducatorAffiliate>({
    queryKey: ["/api/affiliate/me"],
    enabled: open,
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (channel?: string) => {
      const response = await apiRequest("POST", `/api/lessons/${lessonId}/share-link`, { channel });
      return await response.json();
    },
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/me"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = async () => {
    if (!shareUrl) {
      await generateLinkMutation.mutateAsync("direct");
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied!",
        description: "Share link copied to your clipboard. Earn points when others view your lesson!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = async (channel: "twitter" | "facebook" | "linkedin") => {
    let url = shareUrl;
    if (!url) {
      const result = await generateLinkMutation.mutateAsync(channel);
      url = result.shareUrl;
    } else {
      await generateLinkMutation.mutateAsync(channel);
    }

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(`Check out this lesson: ${lessonTitle} - Created with LYS (Laddering Your Success)`);
    const encodedText = encodeURIComponent(`I created this lesson using LYS and the Be-Know-Do methodology! Check it out:`);

    let socialUrl = "";
    switch (channel) {
      case "twitter":
        socialUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
        break;
      case "linkedin":
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    window.open(socialUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    
    toast({
      title: "Shared!",
      description: `Lesson shared to ${channel}. You earned 5 points!`,
    });
  };

  const handleEmailShare = async () => {
    let url = shareUrl;
    if (!url) {
      const result = await generateLinkMutation.mutateAsync("email");
      url = result.shareUrl;
    } else {
      await generateLinkMutation.mutateAsync("email");
    }

    const subject = encodeURIComponent(`Check out this lesson: ${lessonTitle}`);
    const body = encodeURIComponent(`I created this lesson using LYS (Laddering Your Success) and wanted to share it with you!\n\n${url}\n\nThe Be-Know-Do methodology helps students connect learning to real-world success.`);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    toast({
      title: "Email Draft Opened",
      description: "You earned 5 points for sharing!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-oswald text-xl flex items-center gap-2">
            <Share2 className="h-5 w-5 text-lys-red" />
            Share & Earn Rewards
          </DialogTitle>
          <DialogDescription className="font-roboto">
            Share your lesson with other educators and earn affiliate points!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {affiliate && (
            <Card className="bg-gradient-to-r from-lys-yellow/10 to-lys-red/10 border-lys-yellow/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-lys-red/20 flex items-center justify-center">
                      <Award className="h-5 w-5 text-lys-red" />
                    </div>
                    <div>
                      <p className="font-oswald text-sm">Your Referral Code</p>
                      <p className="font-roboto text-lg font-bold text-lys-red">{affiliate.referralCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-roboto text-2xl font-bold text-lys-teal">{affiliate.totalPoints || 0}</p>
                    <p className="font-roboto text-xs text-muted-foreground">Points Earned</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50">
                  <div className="text-center">
                    <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="font-roboto text-sm font-semibold">{affiliate.totalViews || 0}</p>
                    <p className="font-roboto text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <Link2 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="font-roboto text-sm font-semibold">{affiliate.totalShares || 0}</p>
                    <p className="font-roboto text-xs text-muted-foreground">Shares</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="font-roboto text-sm font-semibold">{affiliate.totalReferrals || 0}</p>
                    <p className="font-roboto text-xs text-muted-foreground">Referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <p className="font-oswald text-sm mb-2">Share Link</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl || "Click to generate share link..."}
                className="font-roboto text-sm"
                data-testid="input-share-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                disabled={generateLinkMutation.isPending}
                data-testid="button-copy-link"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <p className="font-oswald text-sm mb-2">Share on Social Media</p>
            <p className="font-roboto text-xs text-muted-foreground mb-3">Earn 5 points for each share!</p>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => handleSocialShare("twitter")}
                disabled={generateLinkMutation.isPending}
                data-testid="button-share-twitter"
              >
                <FaXTwitter className="h-5 w-5" />
                <span className="font-roboto text-xs">X</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => handleSocialShare("facebook")}
                disabled={generateLinkMutation.isPending}
                data-testid="button-share-facebook"
              >
                <SiFacebook className="h-5 w-5 text-blue-600" />
                <span className="font-roboto text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={() => handleSocialShare("linkedin")}
                disabled={generateLinkMutation.isPending}
                data-testid="button-share-linkedin"
              >
                <SiLinkedin className="h-5 w-5 text-blue-700" />
                <span className="font-roboto text-xs">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3"
                onClick={handleEmailShare}
                disabled={generateLinkMutation.isPending}
                data-testid="button-share-email"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
                <span className="font-roboto text-xs">Email</span>
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <p className="font-roboto text-xs text-muted-foreground text-center">
              Earn points when others view, save, or sign up through your shared links!
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <Badge variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" /> View = 1pt
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Share2 className="h-3 w-3 mr-1" /> Share = 5pts
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" /> Signup = 50pts
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
