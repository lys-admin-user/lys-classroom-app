import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Search, 
  DollarSign, 
  GraduationCap, 
  Briefcase,
  Shield,
  Lightbulb,
  ExternalLink,
  Calendar,
  ArrowRight,
  X,
  Star,
  Video,
  FileText,
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import type { Resource } from "@shared/schema";
import { useTier } from "@/hooks/use-tier";
import { AdBanner } from "@/components/AdBanner";

const typeConfig = {
  scholarship: { label: "Scholarship", icon: DollarSign, color: "bg-green-500/10 text-green-600" },
  guide: { label: "Guide", icon: FileText, color: "bg-blue-500/10 text-blue-600" },
  video: { label: "Video", icon: Video, color: "bg-red-500/10 text-red-600" },
  tool: { label: "Tool", icon: Wrench, color: "bg-purple-500/10 text-purple-600" },
  article: { label: "Article", icon: BookOpen, color: "bg-orange-500/10 text-orange-600" },
};

const categoryConfig = {
  financial: { label: "Financial Literacy", icon: DollarSign },
  college: { label: "College Prep", icon: GraduationCap },
  career: { label: "Career Planning", icon: Briefcase },
  military: { label: "Military Pathways", icon: Shield },
  life_skills: { label: "Life Skills", icon: Lightbulb },
};

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { showAds } = useTier();

  const openResourceDetails = (resource: Resource) => {
    setSelectedResource(resource);
    setDetailsOpen(true);
  };

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const scholarships = filteredResources.filter(r => r.type === "scholarship");
  const otherResources = filteredResources.filter(r => r.type !== "scholarship");

  const formatAmount = (amount?: number) => {
    if (!amount) return "Varies";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
                Resource Library
              </h1>
              <p className="font-roboto text-muted-foreground">
                Scholarships, guides, and tools to support your journey
              </p>
            </div>
          </div>
          
          {showAds && <AdBanner position="inline" className="mb-6" />}
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources, scholarships..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-roboto"
              data-testid="input-search-resources"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="font-roboto">All Resources</TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="font-roboto gap-1">
                <config.icon className="h-4 w-4" />
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-8">
            <div>
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-oswald text-lg text-muted-foreground">No resources found</h3>
            <p className="text-sm text-muted-foreground/70 font-roboto mt-2">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {scholarships.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <h2 className="font-oswald text-xl font-semibold">Scholarships</h2>
                  <Badge variant="secondary" className="font-roboto">
                    {scholarships.length} available
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scholarships.map((scholarship) => (
                    <Card key={scholarship.id} className="hover-elevate">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatAmount(scholarship.amount)}
                          </Badge>
                          {scholarship.deadline && (
                            <Badge variant="outline" className="text-xs font-roboto">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(scholarship.deadline).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="font-oswald text-lg mt-2">{scholarship.title}</CardTitle>
                        <CardDescription className="font-roboto text-sm line-clamp-2">
                          {scholarship.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {scholarship.eligibility && scholarship.eligibility.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground font-roboto mb-1">Eligibility:</p>
                            <div className="flex flex-wrap gap-1">
                              {scholarship.eligibility.slice(0, 3).map((req, i) => (
                                <Badge key={i} variant="secondary" className="text-xs font-roboto">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {scholarship.tags.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-roboto">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          className="w-full font-oswald gap-2" 
                          variant="secondary" 
                          onClick={() => openResourceDetails(scholarship)}
                          data-testid={`button-apply-${scholarship.id}`}
                        >
                          <Star className="h-4 w-4" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {otherResources.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="font-oswald text-xl font-semibold">Guides & Resources</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherResources.map((resource) => {
                    const typeConf = typeConfig[resource.type];
                    const catConf = categoryConfig[resource.category];

                    return (
                      <Card key={resource.id} className="hover-elevate">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={typeConf.color}>
                              <typeConf.icon className="h-3 w-3 mr-1" />
                              {typeConf.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-roboto">
                              <catConf.icon className="h-3 w-3 mr-1" />
                              {catConf.label}
                            </Badge>
                          </div>
                          <CardTitle className="font-oswald text-lg">{resource.title}</CardTitle>
                          <CardDescription className="font-roboto text-sm line-clamp-2">
                            {resource.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {resource.tags.slice(0, 4).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-roboto">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button 
                            className="w-full font-oswald gap-2" 
                            variant="secondary" 
                            onClick={() => openResourceDetails(resource)}
                            data-testid={`button-view-${resource.id}`}
                          >
                            {resource.type === "video" ? "Watch Now" : "Read More"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-lys-yellow/10 to-lys-red/10 border-lys-yellow/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-md bg-lys-yellow/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-lys-yellow" />
                </div>
                <div>
                  <h3 className="font-oswald text-lg font-semibold">Financial Literacy</h3>
                  <p className="text-sm text-muted-foreground font-roboto">Learn to manage money wisely</p>
                </div>
              </div>
              <p className="font-roboto text-sm text-muted-foreground mb-4">
                Understanding budgeting, saving, and investing early sets you up for lifelong financial success.
              </p>
              <Button variant="outline" className="font-oswald gap-2 border-lys-yellow text-lys-yellow hover:bg-lys-yellow/10" onClick={() => { setSelectedCategory("financial"); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-explore-financial">
                Explore Guides
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-lys-teal/10 to-lys-red/10 border-lys-teal/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-md bg-lys-teal/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-lys-teal" />
                </div>
                <div>
                  <h3 className="font-oswald text-lg font-semibold">Military Pathways</h3>
                  <p className="text-sm text-muted-foreground font-roboto">Service with purpose</p>
                </div>
              </div>
              <p className="font-roboto text-sm text-muted-foreground mb-4">
                Explore military career options, benefits, and educational opportunities through service.
              </p>
              <Button variant="outline" className="font-oswald gap-2 border-lys-teal text-lys-teal hover:bg-lys-teal/10" onClick={() => { setSelectedCategory("military"); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-explore-military">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resource Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedResource && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={typeConfig[selectedResource.type as keyof typeof typeConfig]?.color}>
                    {(() => {
                      const TypeIcon = typeConfig[selectedResource.type as keyof typeof typeConfig]?.icon;
                      return TypeIcon ? <TypeIcon className="h-3 w-3 mr-1" /> : null;
                    })()}
                    {typeConfig[selectedResource.type as keyof typeof typeConfig]?.label}
                  </Badge>
                  <Badge variant="outline">
                    {(() => {
                      const CatIcon = categoryConfig[selectedResource.category as keyof typeof categoryConfig]?.icon;
                      return CatIcon ? <CatIcon className="h-3 w-3 mr-1" /> : null;
                    })()}
                    {categoryConfig[selectedResource.category as keyof typeof categoryConfig]?.label}
                  </Badge>
                </div>
                <DialogTitle className="font-oswald text-xl">{selectedResource.title}</DialogTitle>
                <DialogDescription className="font-roboto">
                  {selectedResource.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Scholarship-specific details */}
                {selectedResource.type === "scholarship" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedResource.amount && (
                        <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-sm font-medium">Award Amount</span>
                          </div>
                          <p className="font-oswald text-lg mt-1">{formatAmount(selectedResource.amount)}</p>
                        </div>
                      )}
                      {selectedResource.deadline && (
                        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Deadline</span>
                          </div>
                          <p className="font-oswald text-lg mt-1">
                            {new Date(selectedResource.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedResource.eligibility && selectedResource.eligibility.length > 0 && (
                      <div>
                        <h4 className="font-oswald text-sm mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          Eligibility Requirements
                        </h4>
                        <ul className="space-y-2">
                          {selectedResource.eligibility.map((req: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Tags */}
                {selectedResource.tags && selectedResource.tags.length > 0 && (
                  <div>
                    <h4 className="font-oswald text-sm mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Link Disclaimer */}
                {selectedResource.url && !selectedResource.url.includes("ladderingyoursuccess.com") && (
                  <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">External Resource</p>
                        <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                          This link will take you to an external website not operated by Laddering Your Success. 
                          We are not responsible for the content, privacy policies, or practices of third-party sites.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action buttons */}
                <div className="flex gap-3">
                  {selectedResource.url && (
                    <Button 
                      className="flex-1 font-oswald gap-2" 
                      onClick={() => window.open(selectedResource.url, "_blank")}
                      data-testid="button-open-resource"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedResource.type === "scholarship" ? "Apply Now" : 
                       selectedResource.type === "video" ? "Watch Video" : "Open Resource"}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setDetailsOpen(false)}
                    data-testid="button-close-details"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
