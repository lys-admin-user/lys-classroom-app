import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Library, Plus, Search, Heart, Download, Globe, Lock, Trash2, Edit, FileText, Image, Video, Link2, File } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { SharedResource } from "@shared/schema";

const RESOURCE_CATEGORIES = [
  { value: "lesson_plan", label: "Lesson Plans" },
  { value: "worksheet", label: "Worksheets" },
  { value: "presentation", label: "Presentations" },
  { value: "assessment", label: "Assessments" },
  { value: "activity", label: "Activities" },
  { value: "template", label: "Templates" },
  { value: "other", label: "Other" },
];

const SUBJECTS = [
  { value: "math", label: "Math" },
  { value: "science", label: "Science" },
  { value: "english", label: "English Language Arts" },
  { value: "social_studies", label: "Social Studies" },
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "pe", label: "Physical Education" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Other" },
];

function getResourceIcon(type: string) {
  switch (type) {
    case "document": return FileText;
    case "image": return Image;
    case "video": return Video;
    case "link": return Link2;
    default: return File;
  }
}

export default function ResourceLibrary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    category: "",
    subject: "",
    resourceType: "document",
    fileUrl: "",
    visibility: "public",
    tags: "",
  });

  const { data: publicResources, isLoading: publicLoading } = useQuery<SharedResource[]>({
    queryKey: ["/api/shared-resources", categoryFilter, subjectFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.set("category", categoryFilter);
      if (subjectFilter) params.set("subject", subjectFilter);
      const url = `/api/shared-resources${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: Failed to fetch resources`);
      return res.json();
    },
  });

  const { data: myResources, isLoading: myLoading } = useQuery<SharedResource[]>({
    queryKey: ["/api/shared-resources/mine"],
    enabled: isAuthenticated,
  });

  const createResourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/shared-resources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-resources/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-resources"] });
      toast({ title: "Resource Created", description: "Your resource has been added to the library." });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create resource", variant: "destructive" });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/shared-resources/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-resources/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shared-resources"] });
      toast({ title: "Deleted", description: "Resource removed from library." });
    },
  });

  const likeResourceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/shared-resources/${id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-resources"] });
    },
  });

  const downloadResourceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/shared-resources/${id}/download`, {}),
  });

  const resetForm = () => {
    setNewResource({
      title: "",
      description: "",
      category: "",
      subject: "",
      resourceType: "document",
      fileUrl: "",
      visibility: "public",
      tags: "",
    });
  };

  const handleCreateResource = () => {
    if (!newResource.title.trim() || !newResource.category) {
      toast({ title: "Missing Fields", description: "Please fill in title and category.", variant: "destructive" });
      return;
    }
    const tags = newResource.tags.split(",").map(t => t.trim()).filter(Boolean);
    createResourceMutation.mutate({
      ...newResource,
      tags,
    });
  };

  const handleDownload = (resource: SharedResource) => {
    downloadResourceMutation.mutate(resource.id);
    if (resource.fileUrl) {
      window.open(resource.fileUrl, "_blank");
    }
  };

  const filteredPublicResources = publicResources?.filter(r => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!r.title.toLowerCase().includes(query) && !r.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access the resource library.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setLocation("/api/login")} data-testid="button-login">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-oswald font-semibold tracking-tight text-foreground">Community Library</h1>
            <p className="text-muted-foreground mt-1">Discover and share classroom materials with fellow educators</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-resource">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Fractions Practice Worksheet"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    className="mt-2"
                    data-testid="input-resource-title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your resource..."
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    className="mt-2"
                    data-testid="textarea-resource-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={newResource.category} onValueChange={(v) => setNewResource({ ...newResource, category: v })}>
                      <SelectTrigger className="mt-2" data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={newResource.subject} onValueChange={(v) => setNewResource({ ...newResource, subject: v })}>
                      <SelectTrigger className="mt-2" data-testid="select-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Resource URL</Label>
                  <Input
                    placeholder="https://..."
                    value={newResource.fileUrl}
                    onChange={(e) => setNewResource({ ...newResource, fileUrl: e.target.value })}
                    className="mt-2"
                    data-testid="input-resource-url"
                  />
                </div>
                <div>
                  <Label>Visibility</Label>
                  <Select value={newResource.visibility} onValueChange={(v) => setNewResource({ ...newResource, visibility: v })}>
                    <SelectTrigger className="mt-2" data-testid="select-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Public</span>
                      </SelectItem>
                      <SelectItem value="private">
                        <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Private</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    placeholder="math, fractions, 5th grade"
                    value={newResource.tags}
                    onChange={(e) => setNewResource({ ...newResource, tags: e.target.value })}
                    className="mt-2"
                    data-testid="input-resource-tags"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateResource} 
                  disabled={createResourceMutation.isPending}
                  data-testid="button-create-resource"
                >
                  {createResourceMutation.isPending ? "Creating..." : "Add Resource"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList>
            <TabsTrigger value="discover" data-testid="tab-discover">Discover</TabsTrigger>
            <TabsTrigger value="my-resources" data-testid="tab-my-resources">My Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-resources"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {RESOURCE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-subject">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {publicLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
            ) : filteredPublicResources && filteredPublicResources.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPublicResources.map((resource) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource}
                    onLike={() => likeResourceMutation.mutate(resource.id)}
                    onDownload={() => handleDownload(resource)}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-oswald text-lg mb-2">No Resources Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-resources">
            {myLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading your resources...</div>
            ) : myResources && myResources.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myResources.map((resource) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource}
                    isOwner
                    onDelete={() => deleteResourceMutation.mutate(resource.id)}
                    onDownload={() => handleDownload(resource)}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-oswald text-lg mb-2">No Resources Yet</h3>
                  <p className="text-muted-foreground mb-4">Share your first resource with the community</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface ResourceCardProps {
  resource: SharedResource;
  isOwner?: boolean;
  onLike?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

function ResourceCard({ resource, isOwner, onLike, onDownload, onDelete }: ResourceCardProps) {
  const IconComponent = getResourceIcon(resource.resourceType);
  const categoryLabel = RESOURCE_CATEGORIES.find(c => c.value === resource.category)?.label || resource.category;
  const subjectLabel = SUBJECTS.find(s => s.value === resource.subject)?.label || resource.subject;

  return (
    <Card data-testid={`card-resource-${resource.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted">
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="font-oswald text-base">{resource.title}</CardTitle>
              {resource.subject && (
                <span className="text-xs text-muted-foreground">{subjectLabel}</span>
              )}
            </div>
          </div>
          {resource.visibility === "private" && (
            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{resource.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="secondary">{categoryLabel}</Badge>
          {resource.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
          {resource.tags && resource.tags.length > 2 && (
            <Badge variant="outline">+{resource.tags.length - 2}</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {resource.likeCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" /> {resource.downloadCount || 0}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {!isOwner && onLike && (
          <Button variant="ghost" size="sm" onClick={onLike} data-testid={`button-like-${resource.id}`}>
            <Heart className="h-4 w-4" />
          </Button>
        )}
        {resource.fileUrl && onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload} data-testid={`button-download-${resource.id}`}>
            <Download className="h-4 w-4 mr-1" />
            Open
          </Button>
        )}
        {isOwner && onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="ml-auto" data-testid={`button-delete-${resource.id}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
