import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Compass, 
  Search, 
  DollarSign, 
  GraduationCap, 
  TrendingUp, 
  Briefcase,
  Building2,
  Wrench,
  Stethoscope,
  Code,
  Palette,
  Scale,
  ArrowRight,
  Star,
  Clock,
  X
} from "lucide-react";
import type { Career } from "@shared/schema";

const categories = [
  { value: "all", label: "All Categories", icon: Briefcase },
  { value: "technology", label: "Technology", icon: Code },
  { value: "healthcare", label: "Healthcare", icon: Stethoscope },
  { value: "business", label: "Business", icon: Building2 },
  { value: "creative", label: "Creative Arts", icon: Palette },
  { value: "trades", label: "Skilled Trades", icon: Wrench },
  { value: "legal", label: "Legal & Law", icon: Scale },
];

const pathwayTypes = {
  college: { label: "4-Year College", color: "bg-blue-500/10 text-blue-600" },
  military: { label: "Military", color: "bg-green-500/10 text-green-600" },
  trade: { label: "Trade School", color: "bg-orange-500/10 text-orange-600" },
  certification: { label: "Certification", color: "bg-purple-500/10 text-purple-600" },
};

export default function Careers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  const { data: careers = [], isLoading } = useQuery<Career[]>({
    queryKey: ["/api/careers"],
  });

  const filteredCareers = careers.filter((career) => {
    const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || career.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (selectedCareer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedCareer(null)}
            className="gap-2 mb-6 font-roboto"
            data-testid="button-back-careers"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Careers
          </Button>

          <Card>
            <CardHeader className="bg-gradient-to-r from-lys-red/10 to-lys-teal/10 border-b">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge className="mb-2 font-roboto capitalize">{selectedCareer.category}</Badge>
                  <CardTitle className="font-marker text-3xl">{selectedCareer.title}</CardTitle>
                  <CardDescription className="font-roboto mt-2">
                    {selectedCareer.description}
                  </CardDescription>
                </div>
                <Button className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2" data-testid="button-save-career">
                  <Star className="h-4 w-4" />
                  Save Career
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-lys-yellow/10 text-center">
                  <DollarSign className="h-6 w-6 text-lys-yellow mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">Median Salary</p>
                  <p className="font-oswald text-xl font-semibold">{formatSalary(selectedCareer.salaryMedian)}</p>
                  <p className="text-xs text-muted-foreground font-roboto">
                    Range: {formatSalary(selectedCareer.salaryMin)} - {formatSalary(selectedCareer.salaryMax)}
                  </p>
                </div>
                <div className="p-4 rounded-md bg-lys-teal/10 text-center">
                  <GraduationCap className="h-6 w-6 text-lys-teal mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">Education</p>
                  <p className="font-oswald text-lg font-semibold">{selectedCareer.educationRequired}</p>
                </div>
                <div className="p-4 rounded-md bg-lys-red/10 text-center">
                  <TrendingUp className="h-6 w-6 text-lys-red mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">Job Growth</p>
                  <p className="font-oswald text-xl font-semibold">{selectedCareer.growthRate}</p>
                  <p className="text-xs text-muted-foreground font-roboto">projected (10 yr)</p>
                </div>
              </div>

              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3">Key Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCareer.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="font-roboto">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-oswald text-lg font-semibold mb-4">Pathways to This Career</h3>
                <Tabs defaultValue={selectedCareer.pathways[0]?.type || "college"}>
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                    {selectedCareer.pathways.map((pathway) => (
                      <TabsTrigger 
                        key={pathway.type} 
                        value={pathway.type}
                        className="font-roboto"
                      >
                        {pathwayTypes[pathway.type].label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedCareer.pathways.map((pathway) => (
                    <TabsContent key={pathway.type} value={pathway.type} className="mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-center gap-4 mb-4">
                            <Badge className={pathwayTypes[pathway.type].color}>
                              {pathwayTypes[pathway.type].label}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-roboto">
                              <Clock className="h-4 w-4" />
                              {pathway.duration}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-roboto">
                              <DollarSign className="h-4 w-4" />
                              {pathway.cost}
                            </div>
                          </div>
                          <p className="font-roboto text-muted-foreground">{pathway.description}</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {selectedCareer.relatedCareers.length > 0 && (
                <div>
                  <h3 className="font-oswald text-lg font-semibold mb-3">Related Careers</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCareer.relatedCareers.map((career, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="font-roboto cursor-pointer hover-elevate"
                      >
                        {career}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-md bg-lys-yellow/10 border border-lys-yellow/20">
                <p className="font-roboto text-sm italic text-center">
                  "Every career path is unique. Explore your options and find what aligns with your values and strengths."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
              <Compass className="h-6 w-6 text-lys-red" />
            </div>
            <div>
              <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
                KNOW: Career Pathways
              </h1>
              <p className="font-roboto text-muted-foreground">
                Explore 500+ careers with salary data and pathway options
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-roboto"
              data-testid="input-search-careers"
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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px] font-roboto" data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="font-roboto">
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCareers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-oswald text-lg text-muted-foreground">No careers found</h3>
            <p className="text-sm text-muted-foreground/70 font-roboto mt-2">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCareers.map((career) => (
              <Card key={career.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedCareer(career)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="capitalize font-roboto text-xs">
                      {career.category}
                    </Badge>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs font-roboto">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {career.growthRate}
                    </Badge>
                  </div>
                  <CardTitle className="font-oswald text-lg mt-2">{career.title}</CardTitle>
                  <CardDescription className="font-roboto text-sm line-clamp-2">
                    {career.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-roboto flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Salary Range
                      </span>
                      <span className="font-oswald font-semibold">
                        {formatSalary(career.salaryMin)} - {formatSalary(career.salaryMax)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-roboto flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        Education
                      </span>
                      <span className="font-roboto">{career.educationRequired}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {career.pathways.slice(0, 3).map((pathway) => (
                      <Badge 
                        key={pathway.type} 
                        variant="outline" 
                        className={`text-xs ${pathwayTypes[pathway.type].color}`}
                      >
                        {pathwayTypes[pathway.type].label}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full font-oswald gap-2" 
                    variant="secondary"
                    data-testid={`button-explore-${career.id}`}
                  >
                    Explore Pathway
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-lys-red/10 to-lys-teal/10 border border-lys-red/20">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-oswald text-xl font-semibold mb-2">Discover What You Need to Know</h2>
              <p className="font-roboto text-muted-foreground text-sm">
                Understanding career options is key to making informed decisions. Explore salaries, 
                education requirements, and multiple pathways to each career — college isn't the only way!
              </p>
            </div>
            <Badge className="bg-lys-red/20 text-lys-red font-oswald text-lg px-4 py-2">
              KNOW Phase
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
