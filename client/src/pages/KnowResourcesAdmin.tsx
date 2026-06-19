import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Book, Youtube, Podcast, MessageCircle, FileText, ExternalLink, Star, Eye, EyeOff, GraduationCap, DollarSign, PenTool, ShieldCheck, Flag, CheckCircle2, ShieldAlert, AlertTriangle, Building2, RefreshCw, Bot, Globe } from "lucide-react";
import type { KnowResource, InsertKnowResource, KnowResourceType, Institution, ScholarshipScrapeRun } from "@shared/schema";

const RESOURCE_TYPES = [
  { value: "book", label: "Book", icon: Book },
  { value: "ebook", label: "E-Book", icon: FileText },
  { value: "youtube_channel", label: "YouTube Channel", icon: Youtube },
  { value: "podcast", label: "Podcast", icon: Podcast },
  { value: "whatsapp_channel", label: "WhatsApp Channel", icon: MessageCircle },
  { value: "website", label: "Website", icon: ExternalLink },
  { value: "course", label: "Course", icon: Book },
  { value: "scholarship", label: "Scholarship", icon: GraduationCap },
  { value: "financial_guide", label: "Financial Guide", icon: DollarSign },
  { value: "essay_template", label: "Essay Template", icon: PenTool },
] as const;

const CATEGORIES = [
  "STEM",
  "Healthcare",
  "Business",
  "Arts",
  "Education",
  "Technology",
  "Finance",
  "Engineering",
  "Science",
  "Mathematics",
  "Financial Literacy",
  "Scholarships",
  "International",
];

const TARGET_AUDIENCES = ["students", "educators", "parents"];

function ResourceIcon({ type }: { type: string }) {
  const resource = RESOURCE_TYPES.find(r => r.value === type);
  const Icon = resource?.icon || Book;
  return <Icon className="w-4 h-4" />;
}

function ResourceForm({
  resource,
  onSubmit,
  onCancel,
  isLoading,
}: {
  resource?: KnowResource;
  onSubmit: (data: Partial<InsertKnowResource>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<{
    resourceType: KnowResourceType;
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    author: string;
    category: string;
    isbn: string;
    publisher: string;
    publishYear: number | undefined;
    channelId: string;
    subscriberCount: string;
    rssFeedUrl: string;
    podcastHost: string;
    episodeCount: number | undefined;
    whatsappLink: string;
    tags: string[];
    targetAudience: string[];
    careerFields: string[];
    scholarshipAmount: number | undefined;
    scholarshipDeadline: string;
    gpaRequirement: string;
    eligibilityCriteria: string;
    applicationSeason: string;
    isFirstGenFriendly: boolean;
    isRecurring: boolean;
    isActive: boolean;
    featured: boolean;
    sortOrder: number;
  }>({
    resourceType: resource?.resourceType || "book",
    title: resource?.title || "",
    description: resource?.description || "",
    url: resource?.url || "",
    imageUrl: resource?.imageUrl || "",
    author: resource?.author || "",
    category: resource?.category || "",
    isbn: resource?.isbn || "",
    publisher: resource?.publisher || "",
    publishYear: resource?.publishYear || undefined,
    channelId: resource?.channelId || "",
    subscriberCount: resource?.subscriberCount || "",
    rssFeedUrl: resource?.rssFeedUrl || "",
    podcastHost: resource?.podcastHost || "",
    episodeCount: resource?.episodeCount || undefined,
    whatsappLink: resource?.whatsappLink || "",
    tags: resource?.tags || [],
    targetAudience: resource?.targetAudience || [],
    careerFields: resource?.careerFields || [],
    scholarshipAmount: (resource as any)?.scholarshipAmount || undefined,
    scholarshipDeadline: (resource as any)?.scholarshipDeadline || "",
    gpaRequirement: (resource as any)?.gpaRequirement || "",
    eligibilityCriteria: (resource as any)?.eligibilityCriteria || "",
    applicationSeason: (resource as any)?.applicationSeason || "",
    isFirstGenFriendly: (resource as any)?.isFirstGenFriendly ?? false,
    isRecurring: (resource as any)?.isRecurring ?? false,
    isActive: resource?.isActive ?? true,
    featured: resource?.featured ?? false,
    sortOrder: resource?.sortOrder ?? 0,
  });

  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      resourceType: formData.resourceType as KnowResourceType,
      title: formData.title,
      description: formData.description || null,
      url: formData.url || null,
      imageUrl: formData.imageUrl || null,
      author: formData.author || null,
      category: formData.category || null,
      isbn: formData.isbn || null,
      publisher: formData.publisher || null,
      publishYear: formData.publishYear || null,
      channelId: formData.channelId || null,
      subscriberCount: formData.subscriberCount || null,
      rssFeedUrl: formData.rssFeedUrl || null,
      podcastHost: formData.podcastHost || null,
      episodeCount: formData.episodeCount || null,
      whatsappLink: formData.whatsappLink || null,
      tags: formData.tags,
      targetAudience: formData.targetAudience,
      careerFields: formData.careerFields,
      isActive: formData.isActive,
      featured: formData.featured,
      sortOrder: formData.sortOrder,
      ...(formData.resourceType === "scholarship" ? {
        scholarshipAmount: formData.scholarshipAmount || null,
        scholarshipDeadline: formData.scholarshipDeadline || null,
        gpaRequirement: formData.gpaRequirement || null,
        eligibilityCriteria: formData.eligibilityCriteria || null,
        applicationSeason: formData.applicationSeason || null,
        isFirstGenFriendly: formData.isFirstGenFriendly,
        isRecurring: formData.isRecurring,
      } : {}),
    };
    onSubmit(submitData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const toggleAudience = (audience: string) => {
    if (formData.targetAudience.includes(audience)) {
      setFormData({ ...formData, targetAudience: formData.targetAudience.filter(a => a !== audience) });
    } else {
      setFormData({ ...formData, targetAudience: [...formData.targetAudience, audience] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="resourceType">Resource Type</Label>
          <Select
            value={formData.resourceType}
            onValueChange={(value) => setFormData({ ...formData, resourceType: value as KnowResourceType })}
          >
            <SelectTrigger data-testid="select-resource-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Career Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Resource title"
          required
          data-testid="input-resource-title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the resource"
          rows={3}
          data-testid="input-resource-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
          data-testid="input-resource-url"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author/Creator</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Author or creator name"
            data-testid="input-resource-author"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
            data-testid="input-image-url"
          />
        </div>
      </div>

      {(formData.resourceType === "book" || formData.resourceType === "ebook") && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              placeholder="ISBN number"
              data-testid="input-isbn"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={formData.publisher}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              placeholder="Publisher name"
              data-testid="input-publisher"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishYear">Publish Year</Label>
            <Input
              id="publishYear"
              type="number"
              value={formData.publishYear || ""}
              onChange={(e) => setFormData({ ...formData, publishYear: parseInt(e.target.value) || undefined })}
              placeholder="Year"
              data-testid="input-publish-year"
            />
          </div>
        </div>
      )}

      {formData.resourceType === "youtube_channel" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              placeholder="YouTube channel ID"
              data-testid="input-channel-id"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscriberCount">Subscriber Count</Label>
            <Input
              id="subscriberCount"
              value={formData.subscriberCount}
              onChange={(e) => setFormData({ ...formData, subscriberCount: e.target.value })}
              placeholder="e.g., 1.2M"
              data-testid="input-subscriber-count"
            />
          </div>
        </div>
      )}

      {formData.resourceType === "podcast" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rssFeedUrl">RSS Feed URL</Label>
            <Input
              id="rssFeedUrl"
              type="url"
              value={formData.rssFeedUrl}
              onChange={(e) => setFormData({ ...formData, rssFeedUrl: e.target.value })}
              placeholder="https://..."
              data-testid="input-rss-url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="podcastHost">Host</Label>
            <Input
              id="podcastHost"
              value={formData.podcastHost}
              onChange={(e) => setFormData({ ...formData, podcastHost: e.target.value })}
              placeholder="Podcast host name"
              data-testid="input-podcast-host"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="episodeCount">Episode Count</Label>
            <Input
              id="episodeCount"
              type="number"
              value={formData.episodeCount || ""}
              onChange={(e) => setFormData({ ...formData, episodeCount: parseInt(e.target.value) || undefined })}
              placeholder="Number of episodes"
              data-testid="input-episode-count"
            />
          </div>
        </div>
      )}

      {formData.resourceType === "whatsapp_channel" && (
        <div className="space-y-2">
          <Label htmlFor="whatsappLink">WhatsApp Channel Link</Label>
          <Input
            id="whatsappLink"
            type="url"
            value={formData.whatsappLink}
            onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
            placeholder="https://whatsapp.com/channel/..."
            data-testid="input-whatsapp-link"
          />
        </div>
      )}

      {formData.resourceType === "scholarship" && (
        <div className="space-y-4 border-t pt-4">
          <Label className="text-base font-semibold">Scholarship Details</Label>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="scholarshipAmount">Amount ($)</Label>
              <Input
                id="scholarshipAmount"
                type="number"
                value={formData.scholarshipAmount || ""}
                onChange={(e) => setFormData({ ...formData, scholarshipAmount: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 5000"
                data-testid="input-scholarship-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scholarshipDeadline">Deadline</Label>
              <Input
                id="scholarshipDeadline"
                type="date"
                value={formData.scholarshipDeadline}
                onChange={(e) => setFormData({ ...formData, scholarshipDeadline: e.target.value })}
                data-testid="input-scholarship-deadline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpaRequirement">GPA Requirement</Label>
              <Input
                id="gpaRequirement"
                value={formData.gpaRequirement}
                onChange={(e) => setFormData({ ...formData, gpaRequirement: e.target.value })}
                placeholder="e.g., 3.0"
                data-testid="input-gpa-requirement"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eligibilityCriteria">Eligibility Criteria</Label>
            <Textarea
              id="eligibilityCriteria"
              value={formData.eligibilityCriteria}
              onChange={(e) => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
              placeholder="Describe eligibility requirements..."
              rows={3}
              data-testid="input-eligibility-criteria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationSeason">Season</Label>
            <Select
              value={formData.applicationSeason}
              onValueChange={(value) => setFormData({ ...formData, applicationSeason: value })}
            >
              <SelectTrigger data-testid="select-application-season">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="early_fall">Early Fall</SelectItem>
                <SelectItem value="late_fall">Late Fall</SelectItem>
                <SelectItem value="spring">Spring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="isFirstGenFriendly"
                checked={formData.isFirstGenFriendly}
                onCheckedChange={(checked) => setFormData({ ...formData, isFirstGenFriendly: checked })}
                data-testid="switch-first-gen-friendly"
              />
              <Label htmlFor="isFirstGenFriendly">First-Gen Friendly</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                data-testid="switch-is-recurring"
              />
              <Label htmlFor="isRecurring">Recurring Annual Scholarship</Label>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2 flex-wrap mb-2">
          {formData.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            data-testid="input-tag"
          />
          <Button type="button" variant="outline" onClick={addTag} data-testid="button-add-tag">
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Audience</Label>
        <div className="flex gap-2 flex-wrap">
          {TARGET_AUDIENCES.map((audience) => (
            <Badge
              key={audience}
              variant={formData.targetAudience.includes(audience) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleAudience(audience)}
              data-testid={`badge-audience-${audience}`}
            >
              {audience}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          data-testid="input-sort-order"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            data-testid="switch-featured"
          />
          <Label htmlFor="featured">Featured</Label>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="button-save-resource">
          {isLoading ? "Saving..." : resource ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onVerify,
  isVerifying,
}: {
  resource: KnowResource;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  onVerify?: () => void;
  isVerifying?: boolean;
}) {
  const trustLevel = (resource as any).trustLevel as string | undefined;
  const lastVerifiedAt = (resource as any).lastVerifiedAt as string | undefined;
  const requiresFee = (resource as any).requiresFee as boolean | undefined;
  const privacyConcern = (resource as any).privacyConcern as boolean | undefined;
  const verifiedStr = lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Never";
  const resourceUrl = resource.url || resource.whatsappLink || "";
  
  return (
    <Card className={`relative ${!resource.isActive ? "opacity-60" : ""}`} data-testid={`card-resource-${resource.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <ResourceIcon type={resource.resourceType} />
            <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {resource.featured && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            )}
            {!resource.isActive && (
              <Badge variant="outline" className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                Hidden
              </Badge>
            )}
          </div>
        </div>
        {resource.author && (
          <CardDescription>by {resource.author}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {resource.category && (
            <Badge variant="outline">{resource.category}</Badge>
          )}
          {resource.tags && resource.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>

        {resource.resourceType === "scholarship" && (
          <div className="flex flex-wrap gap-2 text-xs items-center">
            <Badge variant="outline" className="capitalize gap-1">
              <ShieldCheck className="w-3 h-3" />{trustLevel || "external"}
            </Badge>
            <span className="text-muted-foreground">Verified: {verifiedStr}</span>
            {requiresFee && (
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Fee</Badge>
            )}
            {privacyConcern && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><ShieldAlert className="w-3 h-3" />Privacy</Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          {resourceUrl && (
            <a
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
              data-testid={`link-resource-${resource.id}`}
            >
              <ExternalLink className="w-3 h-3" />
              View Resource
            </a>
          )}

          <div className="flex items-center gap-1 ml-auto">
            {resource.resourceType === "scholarship" && onVerify && (
              <Button
                size="sm"
                variant="outline"
                onClick={onVerify}
                disabled={isVerifying}
                className="gap-1 text-xs"
                title={`Last verified: ${verifiedStr}`}
                data-testid={`button-verify-${resource.id}`}
              >
                <ShieldCheck className="w-3 h-3" />Verify
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleFeatured}
              title={resource.featured ? "Remove from featured" : "Add to featured"}
              data-testid={`button-toggle-featured-${resource.id}`}
            >
              <Star className={`w-4 h-4 ${resource.featured ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleActive}
              title={resource.isActive ? "Hide resource" : "Show resource"}
              data-testid={`button-toggle-active-${resource.id}`}
            >
              {resource.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              data-testid={`button-edit-resource-${resource.id}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              data-testid={`button-delete-resource-${resource.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ResourceReport = {
  id: string;
  resourceId: string;
  userId: string;
  reason: string;
  details: string | null;
  status: string;
  resolvedAt: string | null;
  createdAt: string | null;
};

function ReportsTab() {
  const { toast } = useToast();
  const { data: reports = [], isLoading } = useQuery<ResourceReport[]>({
    queryKey: ["/api/admin/resource-reports"],
  });
  const { data: resources = [] } = useQuery<KnowResource[]>({
    queryKey: ["/api/admin/know-resources"],
  });
  const resourceMap = new Map(resources.map((r) => [r.id, r] as const));

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "resolved" | "dismissed" }) =>
      apiRequest("PATCH", `/api/admin/resource-reports/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resource-reports"] });
      toast({ title: "Report updated" });
    },
    onError: () => toast({ title: "Failed to update report", variant: "destructive" }),
  });

  const pending = reports.filter((r) => r.status === "pending");

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading reports...</div>;
  }
  if (pending.length === 0) {
    return (
      <Card className="py-12">
        <CardContent className="text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto text-lys-teal mb-2" />
          <p className="text-muted-foreground">No pending reports. Nice work.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {pending.map((report) => {
        const r = resourceMap.get(report.resourceId);
        return (
          <Card key={report.id} data-testid={`card-report-${report.id}`}>
            <CardContent className="py-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="destructive" className="capitalize">{report.reason.replace(/_/g, " ")}</Badge>
                  {r ? (
                    <span className="font-semibold text-sm">{r.title}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Resource removed</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                {report.details && (
                  <p className="text-sm text-muted-foreground italic">"{report.details}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveMutation.mutate({ id: report.id, status: "dismissed" })}
                  disabled={resolveMutation.isPending}
                  data-testid={`button-dismiss-report-${report.id}`}
                >Dismiss</Button>
                <Button
                  size="sm"
                  onClick={() => resolveMutation.mutate({ id: report.id, status: "resolved" })}
                  disabled={resolveMutation.isPending}
                  data-testid={`button-resolve-report-${report.id}`}
                >Resolve</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function KnowResourcesAdmin() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<KnowResource | null>(null);
  const [activeType, setActiveType] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: resources = [], isLoading } = useQuery<KnowResource[]>({
    queryKey: ["/api/admin/know-resources"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<InsertKnowResource>) =>
      apiRequest("POST", "/api/admin/know-resources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/know-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/know-resources"] });
      setIsCreateOpen(false);
      toast({ title: "Resource created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create resource", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertKnowResource> }) =>
      apiRequest("PATCH", `/api/admin/know-resources/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/know-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/know-resources"] });
      setEditingResource(null);
      toast({ title: "Resource updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update resource", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/know-resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/know-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/know-resources"] });
      setDeleteConfirm(null);
      toast({ title: "Resource deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete resource", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/know-resources/${id}/verify`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/know-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/know-resources"] });
      toast({ title: "Verified" });
    },
    onError: () => toast({ title: "Verify failed", variant: "destructive" }),
  });

  const bulkVerifyMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", `/api/admin/know-resources/bulk-verify`, { ids }),
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/know-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/know-resources"] });
      toast({ title: `Verified ${ids.length} resource${ids.length === 1 ? "" : "s"}` });
    },
    onError: () => toast({ title: "Bulk verify failed", variant: "destructive" }),
  });

  const filteredResources = activeType === "all"
    ? resources
    : resources.filter((r) => r.resourceType === activeType);

  const resourceCounts = RESOURCE_TYPES.reduce((acc, type) => {
    acc[type.value] = resources.filter((r) => r.resourceType === type.value).length;
    return acc;
  }, {} as Record<string, number>);

  const visibleScholarships = filteredResources.filter((r) => r.resourceType === "scholarship");
  const allScholarships = resources.filter((r) => r.resourceType === "scholarship");
  const trustStats = allScholarships.reduce(
    (acc, r) => {
      const t = (((r as any).trustLevel as string) || "external").toLowerCase();
      if (t === "verified") acc.verified++;
      else if (t === "community") acc.community++;
      else acc.external++;
      return acc;
    },
    { verified: 0, community: 0, external: 0 },
  );
  const unparseableDeadlines = allScholarships.filter((r: any) => {
    const raw = r.scholarshipDeadline;
    if (!raw) return false;
    if (r.nextDeadline) return false;
    return isNaN(new Date(raw).getTime());
  });

  // Pending reports count for badge
  const { data: allReports = [] } = useQuery<any[]>({ queryKey: ["/api/admin/resource-reports"] });
  const pendingReportsCount = (allReports || []).filter((r: any) => r.status === "pending").length;

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">KNOW Resources</h1>
          <p className="text-muted-foreground">
            Manage educational resources for students and educators
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-resource">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
              <DialogDescription>
                Create a new educational resource for the KNOW section
              </DialogDescription>
            </DialogHeader>
            <ResourceForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeType} onValueChange={setActiveType} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({resources.length})
          </TabsTrigger>
          {RESOURCE_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value} data-testid={`tab-${type.value}`}>
              <type.icon className="w-4 h-4 mr-1" />
              {type.label} ({resourceCounts[type.value] || 0})
            </TabsTrigger>
          ))}
          <TabsTrigger value="reports" data-testid="tab-reports">
            <Flag className="w-4 h-4 mr-1" />Reports
            {pendingReportsCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]" data-testid="badge-pending-reports">
                {pendingReportsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auto-scrape" data-testid="tab-auto-scrape">
            <Bot className="w-4 h-4 mr-1" />Auto-Scrape
          </TabsTrigger>
        </TabsList>

        {(activeType === "all" || activeType === "scholarship") && allScholarships.length > 0 && (
          <Card className="bg-muted/30" data-testid="card-trust-stats">
            <CardContent className="py-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold">Scholarship trust:</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />Verified <strong>{trustStats.verified}</strong></span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Community <strong>{trustStats.community}</strong></span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />External <strong>{trustStats.external}</strong></span>
              {unparseableDeadlines.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-amber-700" data-testid="text-unparseable-deadlines">
                  <Flag className="w-3.5 h-3.5" />
                  <strong>{unparseableDeadlines.length}</strong> listing{unparseableDeadlines.length === 1 ? "" : "s"} have unparseable deadlines — review the deadline field.
                </span>
              )}
            </CardContent>
          </Card>
        )}

        {visibleScholarships.length > 0 && activeType !== "reports" && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">
              {visibleScholarships.length} scholarship{visibleScholarships.length === 1 ? "" : "s"} on this page
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setBulkConfirmOpen(true)}
              disabled={bulkVerifyMutation.isPending}
              data-testid="button-bulk-verify"
            >
              <ShieldCheck className="w-4 h-4" />
              {bulkVerifyMutation.isPending ? "Verifying..." : "Verify all on this page"}
            </Button>
          </div>
        )}

        <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
          <AlertDialogContent data-testid="dialog-bulk-verify-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Verify {visibleScholarships.length} scholarship{visibleScholarships.length === 1 ? "" : "s"}?</AlertDialogTitle>
              <AlertDialogDescription>
                This stamps "verified today" on every scholarship currently visible on this tab and re-derives their BKD alignment + next deadline.
                Only do this after you've actually checked the official source for each one.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  bulkVerifyMutation.mutate(visibleScholarships.map((r) => r.id));
                  setBulkConfirmOpen(false);
                }}
                data-testid="button-bulk-verify-confirm"
              >
                Yes, verify all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="auto-scrape" className="space-y-4">
          <AutoScrapeTab />
        </TabsContent>

        <TabsContent
          value={activeType}
          className="space-y-4"
          hidden={activeType === "reports" || activeType === "auto-scrape"}
        >
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
          ) : filteredResources.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No resources found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                  data-testid="button-add-first-resource"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first resource
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onEdit={() => setEditingResource(resource)}
                  onDelete={() => setDeleteConfirm(resource.id)}
                  onToggleActive={() =>
                    updateMutation.mutate({
                      id: resource.id,
                      data: { isActive: !resource.isActive },
                    })
                  }
                  onToggleFeatured={() =>
                    updateMutation.mutate({
                      id: resource.id,
                      data: { featured: !resource.featured },
                    })
                  }
                  onVerify={() => verifyMutation.mutate(resource.id)}
                  isVerifying={verifyMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the resource details
            </DialogDescription>
          </DialogHeader>
          {editingResource && (
            <ResourceForm
              resource={editingResource}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingResource.id, data })
              }
              onCancel={() => setEditingResource(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// AutoScrapeTab — quarterly scholarship scraper admin UI
// =============================================================================
function AutoScrapeTab() {
  const { toast } = useToast();
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);

  const { data: runs = [], isLoading: runsLoading } = useQuery<ScholarshipScrapeRun[]>({
    queryKey: ["/api/admin/scholarship-scrape/runs"],
    refetchInterval: 5000,
  });
  const { data: institutions = [], isLoading: instLoading } = useQuery<Institution[]>({
    queryKey: ["/api/admin/scholarship-scrape/institutions"],
  });

  const runMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/scholarship-scrape/run").then((r) => r.json()),
    onSuccess: (data: any) => {
      toast({ title: "Scrape complete", description: data.summary || "Done." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scholarship-scrape/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scholarship-scrape/institutions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/know-resources"] });
    },
    onError: (err: any) =>
      toast({ title: "Scrape failed", description: err?.message || "Unknown error", variant: "destructive" }),
  });

  const seedMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/scholarship-scrape/seed-institutions").then((r) => r.json()),
    onSuccess: (data: any) => {
      const desc =
        data.source === "scorecard"
          ? `Loaded ${data.upserted ?? 0} from College Scorecard.`
          : data.source === "json_fallback"
            ? `Loaded ${data.seeded ?? 0} from starter pack (Scorecard error: ${data.scorecardError})`
            : "Done.";
      toast({ title: "Institutions seeded", description: desc });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scholarship-scrape/institutions"] });
    },
    onError: (err: any) =>
      toast({ title: "Seed failed", description: err?.message || "Unknown error", variant: "destructive" }),
  });

  const discoverMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/scholarship-scrape/discover-urls", { limit: 1000 }).then((r) => r.json()),
    onSuccess: (data: any) => {
      toast({
        title: "URL discovery complete",
        description: `${data.found} found, ${data.notFound} not_found, ${data.failed} failed (of ${data.attempted} attempted)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scholarship-scrape/institutions"] });
    },
    onError: (err: any) =>
      toast({ title: "Discovery failed", description: err?.message || "Unknown error", variant: "destructive" }),
  });

  const totalInst = institutions.length;
  const withUrl = institutions.filter((i) => !!i.scholarshipUrl).length;
  const lastRun = runs[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Scholarship Auto-Scraper
              </CardTitle>
              <CardDescription>
                Quarterly scrape of the top 500 US institutions (sourced from the US Dept of Ed). All scraped
                scholarships land in the Scholarships tab as <strong>inactive</strong> and require your approval
                before students see them.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Institutions" value={totalInst} icon={Building2} testId="stat-institutions" />
            <Stat label="With scholarship URL" value={withUrl} icon={Globe} testId="stat-with-url" />
            <Stat
              label="Last scrape"
              value={lastRun?.startedAt ? new Date(lastRun.startedAt).toLocaleDateString() : "Never"}
              icon={RefreshCw}
              testId="stat-last-scrape"
            />
            <Stat
              label="Last run new scholarships"
              value={lastRun?.scholarshipsFound ?? 0}
              icon={GraduationCap}
              testId="stat-last-found"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSeedConfirmOpen(true)}
              disabled={seedMutation.isPending}
              variant="outline"
              data-testid="button-seed-institutions"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {seedMutation.isPending ? "Seeding..." : "Seed/refresh from Dept of Ed"}
            </Button>
            <Button
              onClick={() => discoverMutation.mutate()}
              disabled={discoverMutation.isPending}
              variant="outline"
              data-testid="button-discover-urls"
            >
              <Globe className="w-4 h-4 mr-2" />
              {discoverMutation.isPending ? "Discovering..." : "Discover scholarship URLs"}
            </Button>
            <Button
              onClick={() => setRunConfirmOpen(true)}
              disabled={runMutation.isPending}
              data-testid="button-run-scrape"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${runMutation.isPending ? "animate-spin" : ""}`} />
              {runMutation.isPending ? "Scraping..." : "Run scrape now"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: The first scrape (and the URL discovery step) can take a while because we throttle to 1 request/second
            per school to be polite. Set the <code>DATA_GOV_API_KEY</code> env var (free at api.data.gov) to refresh the
            full top-500 list from the College Scorecard.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent scrape runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : runs.length === 0 ? (
            <div className="text-sm text-muted-foreground" data-testid="text-no-runs">
              No scrapes yet. The first one will run automatically ~30 seconds after server boot.
            </div>
          ) : (
            <div className="text-sm divide-y">
              {runs.slice(0, 10).map((r) => (
                <div key={r.id} className="py-2 flex flex-wrap items-center gap-2" data-testid={`row-run-${r.id}`}>
                  <Badge variant={r.status === "completed" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                  <span className="text-muted-foreground">{r.triggerType}</span>
                  <span>{r.startedAt ? new Date(r.startedAt).toLocaleString() : ""}</span>
                  <span className="ml-auto">
                    +{r.scholarshipsFound} new · {r.institutionsScraped}/{r.institutionsTotal} sites · {r.institutionsFailed} failed
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Institutions ({institutions.length})</CardTitle>
          <CardDescription>Showing the largest by enrollment first.</CardDescription>
        </CardHeader>
        <CardContent>
          {instLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : institutions.length === 0 ? (
            <div className="text-sm text-muted-foreground" data-testid="text-no-institutions">
              No institutions seeded yet. Click "Seed/refresh from Dept of Ed" above.
            </div>
          ) : (
            <div className="text-xs divide-y max-h-[600px] overflow-y-auto">
              {institutions.map((inst) => (
                <div key={inst.id} className="py-2 flex items-center gap-2" data-testid={`row-inst-${inst.id}`}>
                  <span className="flex-1 truncate font-medium">{inst.name}</span>
                  <span className="text-muted-foreground w-10">{inst.state}</span>
                  <span className="text-muted-foreground w-20 text-right">
                    {inst.enrollment ? inst.enrollment.toLocaleString() : "—"}
                  </span>
                  <Badge variant={inst.scholarshipUrl ? "default" : "outline"} className="w-24 justify-center">
                    {inst.scholarshipUrlDiscoveryStatus || "pending"}
                  </Badge>
                  <Badge
                    variant={
                      inst.lastScrapeStatus === "ok"
                        ? "default"
                        : inst.lastScrapeStatus === "skipped_unchanged"
                          ? "secondary"
                          : inst.lastScrapeStatus
                            ? "destructive"
                            : "outline"
                    }
                    className="w-32 justify-center"
                  >
                    {inst.lastScrapeStatus || "never"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={seedConfirmOpen} onOpenChange={setSeedConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed/refresh institutions?</AlertDialogTitle>
            <AlertDialogDescription>
              This pulls the top 500 US institutions by undergrad enrollment from the College Scorecard (US Dept of
              Ed). Existing institutions are updated by IPEDS ID; nothing is deleted. Falls back to a built-in starter
              pack of ~80 schools if no API key is configured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                seedMutation.mutate();
                setSeedConfirmOpen(false);
              }}
              data-testid="button-confirm-seed"
            >
              Yes, seed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={runConfirmOpen} onOpenChange={setRunConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run scrape now?</AlertDialogTitle>
            <AlertDialogDescription>
              This visits every active institution's scholarship page (1 req/sec/site, robots.txt respected) and uses
              gpt-4o-mini to extract scholarship listings. New scholarships land as inactive in the Scholarships tab and
              require your approval. Estimated cost per full run: under $1. Estimated time: 10–30 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                runMutation.mutate();
                setRunConfirmOpen(false);
              }}
              data-testid="button-confirm-run"
            >
              Yes, run now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, icon: Icon, testId }: { label: string; value: any; icon: any; testId: string }) {
  return (
    <div className="rounded-lg border p-3" data-testid={testId}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
