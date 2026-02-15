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
import { Plus, Pencil, Trash2, Book, Youtube, Podcast, MessageCircle, FileText, ExternalLink, Star, Eye, EyeOff, GraduationCap, DollarSign, PenTool } from "lucide-react";
import type { KnowResource, InsertKnowResource, KnowResourceType } from "@shared/schema";

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
}: {
  resource: KnowResource;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
}) {
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

  const filteredResources = activeType === "all"
    ? resources
    : resources.filter((r) => r.resourceType === activeType);

  const resourceCounts = RESOURCE_TYPES.reduce((acc, type) => {
    acc[type.value] = resources.filter((r) => r.resourceType === type.value).length;
    return acc;
  }, {} as Record<string, number>);

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
        </TabsList>

        <TabsContent value={activeType} className="space-y-4">
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
