import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Share2,
  Download,
  Link as LinkIcon,
  Copy,
  Check,
  Globe,
  Lock,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Star,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Heart,
  Compass,
  Target,
  Loader2
} from "lucide-react";
import { SiLinkedin, SiHandshake } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import type { StudentPortfolio, PortfolioItem } from "@shared/schema";

const themes = [
  { id: "professional", name: "Professional", description: "Clean and formal design" },
  { id: "creative", name: "Creative", description: "Colorful and expressive design" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant design" },
  { id: "academic", name: "Academic", description: "Traditional academic style" },
];

const itemTypes = [
  { value: "assignment", label: "Assignment", icon: FileText },
  { value: "project", label: "Project", icon: Briefcase },
  { value: "certificate", label: "Certificate", icon: Award },
  { value: "achievement", label: "Achievement", icon: Star },
  { value: "reflection", label: "Reflection", icon: Heart },
  { value: "custom", label: "Custom", icon: Plus },
];

const bkdLabels = {
  be: { label: "BE", color: "bg-lys-yellow text-lys-yellow-foreground", icon: Heart },
  know: { label: "KNOW", color: "bg-lys-teal text-white", icon: Compass },
  do: { label: "DO", color: "bg-lys-red text-white", icon: Target }
};

export default function PortfolioBuilder() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [copiedLink, setCopiedLink] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  // Form state for portfolio profile
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [handshakeUrl, setHandshakeUrl] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public" | "unlisted">("private");
  const [theme, setTheme] = useState("professional");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Form state for new item
  const [itemType, setItemType] = useState("custom");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemBkdFocus, setItemBkdFocus] = useState<string>("");
  const [itemSkills, setItemSkills] = useState<string[]>([]);
  const [newItemSkill, setNewItemSkill] = useState("");

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<StudentPortfolio | null>({
    queryKey: ["/api/portfolio"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio", portfolio?.id, "items"],
    enabled: !!portfolio?.id,
  });

  // Initialize form when portfolio loads, reset when absent
  useEffect(() => {
    if (portfolio) {
      setTitle(portfolio.title || "");
      setBio(portfolio.bio || "");
      setContactEmail(portfolio.contactEmail || "");
      setLinkedinUrl(portfolio.linkedinUrl || "");
      setHandshakeUrl(portfolio.handshakeUrl || "");
      setPrivacy(portfolio.privacy as any || "private");
      setTheme(portfolio.theme || "professional");
      setSkills(portfolio.skills || []);
    } else if (!portfolioLoading) {
      // Reset form state when no portfolio exists
      setTitle("");
      setBio("");
      setContactEmail("");
      setLinkedinUrl("");
      setHandshakeUrl("");
      setPrivacy("private");
      setTheme("professional");
      setSkills([]);
      // Clear items cache to prevent stale data after portfolio deletion
      queryClient.removeQueries({ queryKey: ["/api/portfolio"], exact: false });
    }
  }, [portfolio, portfolioLoading]);

  const createPortfolioMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/portfolio", {
        title: title || "My Portfolio",
        bio,
        contactEmail,
        linkedinUrl,
        handshakeUrl,
        privacy,
        theme,
        skills,
      });
    },
    onSuccess: () => {
      toast({ title: "Portfolio created!", description: "Start adding your work to showcase your achievements." });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create portfolio", variant: "destructive" });
    },
  });

  const updatePortfolioMutation = useMutation({
    mutationFn: async () => {
      if (!portfolio) return;
      return await apiRequest("PATCH", `/api/portfolio/${portfolio.id}`, {
        title,
        bio,
        contactEmail,
        linkedinUrl,
        handshakeUrl,
        privacy,
        theme,
        skills,
      });
    },
    onSuccess: () => {
      toast({ title: "Portfolio updated!", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update portfolio", variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!portfolio) return;
      return await apiRequest("POST", `/api/portfolio/${portfolio.id}/items`, {
        itemType,
        customTitle: itemTitle,
        customDescription: itemDescription,
        bkdFocus: itemBkdFocus || null,
        skills: itemSkills,
      });
    },
    onSuccess: () => {
      toast({ title: "Item added!", description: "Your work has been added to your portfolio." });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", portfolio?.id, "items"] });
      setAddItemOpen(false);
      resetItemForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/portfolio/items/${itemId}`);
    },
    onSuccess: () => {
      toast({ title: "Item removed", description: "The item has been removed from your portfolio." });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", portfolio?.id, "items"] });
    },
  });

  const toggleHighlightMutation = useMutation({
    mutationFn: async ({ itemId, highlighted }: { itemId: string; highlighted: boolean }) => {
      return await apiRequest("PATCH", `/api/portfolio/items/${itemId}`, { highlighted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", portfolio?.id, "items"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      if (!portfolio) return;
      return await apiRequest("POST", `/api/portfolio/${portfolio.id}/reorder`, { itemIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio", portfolio?.id, "items"] });
    },
  });

  const resetItemForm = () => {
    setItemType("custom");
    setItemTitle("");
    setItemDescription("");
    setItemBkdFocus("");
    setItemSkills([]);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleCopyLink = () => {
    if (portfolio?.shareableSlug) {
      const url = `${window.location.origin}/p/${portfolio.shareableSlug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Link copied!", description: "Share this link with employers and institutions." });
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    reorderMutation.mutate(newItems.map(i => i.id));
  };

  if (portfolioLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If no portfolio exists, show creation form
  if (!portfolio) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-permanent-marker text-lys-red">Create Your Portfolio</h1>
          <p className="text-muted-foreground">
            Showcase your achievements to colleges, employers, and scholarship committees
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-oswald">Get Started</CardTitle>
            <CardDescription>
              Create your professional portfolio to share your completed work with the world
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-title">Portfolio Title</Label>
              <Input
                id="portfolio-title"
                placeholder="My Portfolio"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-portfolio-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-bio">Bio</Label>
              <Textarea
                id="portfolio-bio"
                placeholder="Tell employers and institutions about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                data-testid="textarea-portfolio-bio"
              />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger data-testid="select-portfolio-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} - {t.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createPortfolioMutation.mutate()}
              disabled={createPortfolioMutation.isPending}
              className="w-full"
              data-testid="button-create-portfolio"
            >
              {createPortfolioMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shareableUrl = portfolio.shareableSlug 
    ? `${window.location.origin}/p/${portfolio.shareableSlug}` 
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-permanent-marker text-lys-red">Portfolio Builder</h1>
          <p className="text-muted-foreground">
            Build and share your professional portfolio
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareableUrl && (
            <>
              <Button variant="outline" onClick={handleCopyLink} data-testid="button-copy-portfolio-link">
                {copiedLink ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </Button>
              <Link href={`/p/${portfolio.shareableSlug}`}>
                <Button variant="outline" data-testid="button-preview-portfolio">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="items" data-testid="tab-items">My Work ({items.length})</TabsTrigger>
          <TabsTrigger value="share" data-testid="tab-share">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald">Portfolio Profile</CardTitle>
              <CardDescription>
                Information displayed on your public portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Portfolio Title</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Portfolio"
                    data-testid="input-edit-portfolio-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Contact Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="input-contact-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your story..."
                  rows={4}
                  data-testid="textarea-edit-bio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center w-9 bg-muted rounded-l-md border border-r-0">
                      <SiLinkedin className="w-4 h-4" />
                    </div>
                    <Input
                      id="linkedin"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/in/yourprofile"
                      className="rounded-l-none"
                      data-testid="input-linkedin-url"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handshake">Handshake Profile</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center w-9 bg-muted rounded-l-md border border-r-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <Input
                      id="handshake"
                      value={handshakeUrl}
                      onChange={(e) => setHandshakeUrl(e.target.value)}
                      placeholder="app.joinhandshake.com/profiles/..."
                      className="rounded-l-none"
                      data-testid="input-handshake-url"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger data-testid="select-edit-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} - {t.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    data-testid="input-new-skill"
                  />
                  <Button type="button" variant="outline" onClick={handleAddSkill} data-testid="button-add-skill">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-skill-${i}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <Button
                onClick={() => updatePortfolioMutation.mutate()}
                disabled={updatePortfolioMutation.isPending}
                data-testid="button-save-portfolio"
              >
                {updatePortfolioMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-oswald">Portfolio Items</h3>
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-oswald">Add Portfolio Item</DialogTitle>
                  <DialogDescription>
                    Add completed work to showcase your achievements
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Item Type</Label>
                    <Select value={itemType} onValueChange={setItemType}>
                      <SelectTrigger data-testid="select-item-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {itemTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-title">Title</Label>
                    <Input
                      id="item-title"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder="Title of your work"
                      data-testid="input-item-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Textarea
                      id="item-description"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Describe what you accomplished..."
                      rows={3}
                      data-testid="textarea-item-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Be-Know-Do Focus (Optional)</Label>
                    <Select value={itemBkdFocus} onValueChange={setItemBkdFocus}>
                      <SelectTrigger data-testid="select-item-bkd">
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="be">BE - Identity & Purpose</SelectItem>
                        <SelectItem value="know">KNOW - Strategy & Resources</SelectItem>
                        <SelectItem value="do">DO - Action & Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" data-testid="button-cancel-add-item">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={() => addItemMutation.mutate()}
                    disabled={!itemTitle || addItemMutation.isPending}
                    data-testid="button-confirm-add-item"
                  >
                    {addItemMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {itemsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="font-oswald text-lg">No items yet</h3>
                <p className="text-sm text-muted-foreground">
                  Add completed assignments, projects, and achievements to your portfolio
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const typeInfo = itemTypes.find(t => t.value === item.itemType) || itemTypes[5];
                const TypeIcon = typeInfo.icon;
                const bkd = item.bkdFocus ? bkdLabels[item.bkdFocus as keyof typeof bkdLabels] : null;

                return (
                  <Card key={item.id} className={item.highlighted ? "border-lys-yellow" : ""} data-testid={`card-portfolio-item-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => moveItem(index, "up")}
                            data-testid={`button-move-up-${item.id}`}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={index === items.length - 1}
                            onClick={() => moveItem(index, "down")}
                            data-testid={`button-move-down-${item.id}`}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="w-5 h-5 text-muted-foreground" />
                              <h4 className="font-oswald text-lg line-clamp-1">{item.customTitle}</h4>
                              {item.highlighted && (
                                <Star className="w-4 h-4 text-lys-yellow fill-lys-yellow" />
                              )}
                            </div>
                            {bkd && (
                              <Badge className={bkd.color}>
                                <bkd.icon className="w-3 h-3 mr-1" />
                                {bkd.label}
                              </Badge>
                            )}
                          </div>
                          {item.customDescription && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.customDescription}
                            </p>
                          )}
                          {item.skills && item.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.skills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleHighlightMutation.mutate({ 
                              itemId: item.id, 
                              highlighted: !item.highlighted 
                            })}
                            data-testid={`button-highlight-${item.id}`}
                          >
                            <Star className={`w-4 h-4 ${item.highlighted ? "text-lys-yellow fill-lys-yellow" : ""}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            data-testid={`button-delete-item-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Portfolio
              </CardTitle>
              <CardDescription>
                Control who can see your portfolio and share it with employers, schools, and scholarship committees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Control who can access your portfolio
                    </p>
                  </div>
                  <Select value={privacy} onValueChange={(v) => setPrivacy(v as any)}>
                    <SelectTrigger className="w-40" data-testid="select-privacy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Private
                        </div>
                      </SelectItem>
                      <SelectItem value="unlisted">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Unlisted
                        </div>
                      </SelectItem>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm">
                    {privacy === "private" && "Only you can see your portfolio."}
                    {privacy === "unlisted" && "Anyone with the link can view your portfolio."}
                    {privacy === "public" && "Your portfolio is publicly visible and searchable."}
                  </p>
                </div>
              </div>

              {shareableUrl && privacy !== "private" && (
                <>
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Shareable Link</Label>
                    <div className="flex gap-2">
                      <Input value={shareableUrl} readOnly data-testid="input-shareable-link" />
                      <Button variant="outline" onClick={handleCopyLink} data-testid="button-copy-link">
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Share to Professional Networks</Label>
                    <p className="text-sm text-muted-foreground">
                      Add your portfolio link to your profiles on these platforms
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="justify-start gap-2"
                        onClick={() => window.open(`https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=Portfolio&organizationName=LYS&certUrl=${encodeURIComponent(shareableUrl)}`, "_blank")}
                        data-testid="button-share-linkedin"
                      >
                        <SiLinkedin className="w-5 h-5 text-[#0077B5]" />
                        Add to LinkedIn
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start gap-2"
                        onClick={() => window.open("https://app.joinhandshake.com/profiles/me", "_blank")}
                        data-testid="button-share-handshake"
                      >
                        <Briefcase className="w-5 h-5 text-[#FF7459]" />
                        Add to Handshake
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copy your portfolio link and paste it into your profile on these platforms
                    </p>
                  </div>

                  <Separator />

                  {shareableUrl && (
                    <div className="space-y-3">
                      <Label>Download Portfolio</Label>
                      <p className="text-sm text-muted-foreground">
                        Download a PDF version to submit with applications
                      </p>
                      <Link href={`/p/${portfolio.shareableSlug}?download=true`}>
                        <Button variant="outline" data-testid="button-download-pdf">
                          <Download className="w-4 h-4 mr-2" />
                          Download as PDF
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}

              <Button
                onClick={() => updatePortfolioMutation.mutate()}
                disabled={updatePortfolioMutation.isPending}
                data-testid="button-save-share-settings"
              >
                {updatePortfolioMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Portfolio Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-lys-teal">{portfolio.viewCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-lys-yellow">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Portfolio Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
