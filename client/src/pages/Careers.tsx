import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  X,
  Check,
  Flame,
  MapPin,
  BarChart3,
  Users,
  BookOpen,
  Sparkles,
  Target,
  Heart,
  Brain,
  Zap,
  Shield,
  Scissors,
  FlaskConical
} from "lucide-react";
import type { Career, SavedCareer } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTier } from "@/hooks/use-tier";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdBanner } from "@/components/AdBanner";
import { Link } from "wouter";

const categories = [
  { value: "all", label: "All Categories", icon: Briefcase },
  { value: "technology", label: "Computer & IT", icon: Code },
  { value: "healthcare", label: "Healthcare", icon: Stethoscope },
  { value: "business", label: "Business & Management", icon: Building2 },
  { value: "science", label: "Science & Environment", icon: FlaskConical },
  { value: "creative", label: "Arts & Design", icon: Palette },
  { value: "trades", label: "Construction & Trades", icon: Wrench },
  { value: "public_safety", label: "Protective Service", icon: Shield },
  { value: "personal_services", label: "Personal Care", icon: Scissors },
  { value: "legal", label: "Legal", icon: Scale },
  { value: "education", label: "Education & Training", icon: BookOpen },
];

const educationPathways = [
  { value: "all", label: "All Education Levels" },
  { value: "no_degree", label: "No Degree Required" },
  { value: "certification", label: "Certification Only" },
  { value: "trade_apprenticeship", label: "Trade School / Apprenticeship" },
  { value: "associates", label: "Associate's Degree" },
  { value: "bachelors_plus", label: "Bachelor's Degree +" },
];

const gradeLevels = [
  { value: "all", label: "All Grades" },
  { value: "elementary", label: "Elementary (K-5)" },
  { value: "middle_school", label: "Middle School (6-8)" },
  { value: "high_school", label: "High School (9-12)" },
  { value: "post_secondary", label: "Post-Secondary" },
];

const usStates = [
  { value: "all", label: "National Average" },
  { value: "TX", label: "Texas" },
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "FL", label: "Florida" },
  { value: "WA", label: "Washington" },
  { value: "VA", label: "Virginia" },
  { value: "AZ", label: "Arizona" },
  { value: "CO", label: "Colorado" },
  { value: "IA", label: "Iowa" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "NJ", label: "New Jersey" },
  { value: "OH", label: "Ohio" },
  { value: "LA", label: "Louisiana" },
  { value: "PA", label: "Pennsylvania" },
  { value: "OK", label: "Oklahoma" },
];

const pathwayTypes = {
  college: { label: "4-Year College", color: "bg-blue-500/10 text-blue-600" },
  military: { label: "Military", color: "bg-green-500/10 text-green-600" },
  trade: { label: "Trade School", color: "bg-orange-500/10 text-orange-600" },
  certification: { label: "Certification", color: "bg-purple-500/10 text-purple-600" },
};

const outlookLabels: Record<string, { label: string; color: string }> = {
  much_faster: { label: "Much Faster Than Average", color: "text-green-600 bg-green-500/10" },
  faster_than_average: { label: "Faster Than Average", color: "text-emerald-600 bg-emerald-500/10" },
  average: { label: "Average Growth", color: "text-blue-600 bg-blue-500/10" },
  little_change: { label: "Little Change", color: "text-amber-600 bg-amber-500/10" },
  declining: { label: "Declining", color: "text-red-600 bg-red-500/10" },
};

const demandLabels: Record<string, { label: string; color: string }> = {
  very_high: { label: "Very High Demand", color: "text-green-600" },
  high: { label: "High Demand", color: "text-emerald-600" },
  moderate: { label: "Moderate Demand", color: "text-blue-600" },
  low: { label: "Low Demand", color: "text-amber-600" },
};

const categoryLabels: Record<string, string> = {
  technology: "Computer & IT",
  healthcare: "Healthcare",
  business: "Business & Management",
  science: "Science & Environment",
  creative: "Arts & Design",
  trades: "Construction & Trades",
  public_safety: "Protective Service",
  personal_services: "Personal Care",
  legal: "Legal",
  education: "Education & Training",
};

interface RecommendedCareersResponse {
  hasAssessment: boolean;
  message?: string;
  userProfile?: {
    beScore: number;
    knowScore: number;
    doScore: number;
    strengths: string[];
  };
  recommendations: Array<{
    career: Career;
    matchScore: number;
    matchReasons: string[];
  }>;
}

interface MarketTrends {
  summary: {
    totalCareers: number;
    totalProjectedOpenings: number;
    avgGrowthRate: number;
    lastUpdated: string;
    source: string;
  };
  outlookDistribution: Record<string, number>;
  demandDistribution: Record<string, number>;
  topGrowingCareers: Array<{ id: string; title: string; growth: number; category: string }>;
  highDemandCategories: Array<{ category: string; count: number }>;
  stateFilter: string | null;
}

export default function Careers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedPathway, setSelectedPathway] = useState("all");
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [activeTab, setActiveTab] = useState("explore");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { showAds } = useTier();

  // Build query URL based on filters
  const careersUrl = selectedGrade !== "all" 
    ? `/api/careers?grade=${selectedGrade}`
    : selectedState !== "all"
    ? `/api/careers?state=${selectedState}`
    : "/api/careers";

  const { data: careers = [], isLoading } = useQuery<Career[]>({
    queryKey: [careersUrl],
  });

  const { data: trendingCareers = [] } = useQuery<Career[]>({
    queryKey: ["/api/careers/trending"],
  });

  const marketTrendsUrl = selectedState !== "all" 
    ? `/api/careers/market-trends?state=${selectedState}`
    : "/api/careers/market-trends";

  const { data: marketTrends } = useQuery<MarketTrends>({
    queryKey: [marketTrendsUrl],
  });

  const { data: recommendedData, isLoading: isLoadingRecommended } = useQuery<RecommendedCareersResponse>({
    queryKey: ["/api/careers/recommended"],
    enabled: isAuthenticated,
  });

  const { data: savedCareers = [] } = useQuery<SavedCareer[]>({
    queryKey: ["/api/saved-careers"],
    enabled: isAuthenticated,
  });

  const isCareerSaved = (careerId: string) => 
    savedCareers.some((sc) => sc.careerId === careerId);

  const saveCareerMutation = useMutation({
    mutationFn: async (career: Career) => {
      const response = await apiRequest("POST", "/api/saved-careers", {
        careerId: career.id,
        careerTitle: career.title,
        careerCategory: career.category,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-careers"] });
      toast({
        title: "Career Saved",
        description: "This career has been added to your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save career. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unsaveCareerMutation = useMutation({
    mutationFn: async (careerId: string) => {
      const savedCareer = savedCareers.find((sc) => sc.careerId === careerId);
      if (!savedCareer) throw new Error("Career not found");
      await apiRequest("DELETE", `/api/saved-careers/${savedCareer.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-careers"] });
      toast({
        title: "Career Removed",
        description: "This career has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove career. Please try again.",
        variant: "destructive",
      });
    },
  });

  const matchesEducationPathway = (career: Career, pathway: string): boolean => {
    if (pathway === "all") return true;
    const edu = (career.educationRequired || "").toLowerCase();
    const training = (career.onTheJobTraining || "").toLowerCase();
    const pathwayTypes = career.pathways?.map(p => p.type) || [];
    
    switch (pathway) {
      case "no_degree":
        return edu.includes("high school") || edu.includes("cdl") || edu.includes("certificate") || 
               edu.includes("no formal") || training.includes("on-the-job") ||
               (!edu.includes("bachelor") && !edu.includes("master") && !edu.includes("doctor") && !edu.includes("associate"));
      case "certification":
        return pathwayTypes.includes("certification") || edu.includes("certif") || edu.includes("license");
      case "trade_apprenticeship":
        return pathwayTypes.includes("trade") || edu.includes("apprentice") || edu.includes("trade") || edu.includes("technical");
      case "associates":
        return edu.includes("associate");
      case "bachelors_plus":
        return edu.includes("bachelor") || edu.includes("master") || edu.includes("doctor");
      default:
        return true;
    }
  };

  const filteredCareers = careers.filter((career) => {
    const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || career.category === selectedCategory;
    const matchesPathway = matchesEducationPathway(career, selectedPathway);
    return matchesSearch && matchesCategory && matchesPathway;
  });

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(undefined).format(num);
  };

  if (selectedCareer) {
    const stateData = selectedState !== "all" ? selectedCareer.stateSalaryData?.[selectedState] : undefined;
    const entryPoint = selectedCareer.entryPointsForGrades?.[selectedGrade !== "all" ? selectedGrade : "high_school"];
    
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 overflow-y-auto">
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="font-roboto">{categoryLabels[selectedCareer.category] || selectedCareer.category}</Badge>
                    {selectedCareer.jobOutlook && (
                      <Badge className={`${outlookLabels[selectedCareer.jobOutlook]?.color} font-roboto`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {outlookLabels[selectedCareer.jobOutlook]?.label}
                      </Badge>
                    )}
                    {selectedCareer.demandLevel && (
                      <Badge variant="outline" className={`font-roboto ${demandLabels[selectedCareer.demandLevel]?.color}`}>
                        <Flame className="h-3 w-3 mr-1" />
                        {demandLabels[selectedCareer.demandLevel]?.label}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-oswald font-semibold tracking-tight text-2xl sm:text-3xl">{selectedCareer.title}</CardTitle>
                  <CardDescription className="font-roboto mt-2">
                    {selectedCareer.description}
                  </CardDescription>
                  {selectedCareer.blsCode && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-roboto" data-testid="badge-bls-code">
                        SOC {selectedCareer.blsCode}
                      </Badge>
                      {selectedCareer.blsOohGroup && (
                        <Badge variant="outline" className="text-xs font-roboto" data-testid="badge-bls-group">
                          {selectedCareer.blsOohGroup.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </Badge>
                      )}
                      {selectedCareer.naicsCode && (
                        <Badge variant="outline" className="text-xs font-roboto" data-testid="badge-naics">
                          NAICS {selectedCareer.naicsCode}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-roboto">
                        Updated {selectedCareer.blsLastUpdated || "2024"}
                      </span>
                    </div>
                  )}
                </div>
                {isAuthenticated && (
                  isCareerSaved(selectedCareer.id) ? (
                    <Button 
                      variant="outline" 
                      className="font-oswald gap-2"
                      onClick={() => unsaveCareerMutation.mutate(selectedCareer.id)}
                      disabled={unsaveCareerMutation.isPending}
                      data-testid="button-unsave-career"
                    >
                      <Check className="h-4 w-4" />
                      Saved
                    </Button>
                  ) : (
                    <Button 
                      className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
                      onClick={() => saveCareerMutation.mutate(selectedCareer)}
                      disabled={saveCareerMutation.isPending}
                      data-testid="button-save-career"
                    >
                      <Star className="h-4 w-4" />
                      Save Career
                    </Button>
                  )
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Salary & Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-md bg-lys-yellow/10 text-center">
                  <DollarSign className="h-6 w-6 text-lys-yellow mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">
                    {stateData ? `${selectedState} Median` : "National Median"}
                  </p>
                  <p className="font-oswald text-lg sm:text-xl font-semibold truncate">
                    {formatSalary(stateData?.median || selectedCareer.salaryMedian)}
                  </p>
                  <p className="text-xs text-muted-foreground font-roboto truncate">
                    Range: {formatSalary(stateData?.min || selectedCareer.salaryMin)} - {formatSalary(stateData?.max || selectedCareer.salaryMax)}
                  </p>
                </div>
                <div className="p-4 rounded-md bg-lys-teal/10 text-center">
                  <TrendingUp className="h-6 w-6 text-lys-teal mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">Projected Growth</p>
                  <p className="font-oswald text-lg sm:text-xl font-semibold text-green-600">
                    +{selectedCareer.projectedGrowth || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground font-roboto">2023-2033</p>
                </div>
                <div className="p-4 rounded-md bg-blue-500/10 text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">Annual Openings</p>
                  <p className="font-oswald text-lg sm:text-xl font-semibold truncate">
                    {selectedCareer.projectedOpenings ? formatNumber(selectedCareer.projectedOpenings) : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground font-roboto">nationwide</p>
                </div>
                <div className="p-4 rounded-md bg-green-500/10 text-center">
                  <GraduationCap className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-roboto mb-1">Typical Education</p>
                  <p className="font-oswald text-sm font-semibold">
                    {selectedCareer.typicalEntryEducation || selectedCareer.educationRequired}
                  </p>
                </div>
              </div>

              {/* State-Specific Data */}
              {selectedCareer.stateSalaryData && Object.keys(selectedCareer.stateSalaryData).length > 0 && (
                <div>
                  <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-lys-red" />
                    Salary by State
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(selectedCareer.stateSalaryData).map(([state, data]) => (
                      <div key={state} className="p-3 rounded-md border bg-card">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-oswald font-semibold">{state}</span>
                          {data.demandLevel && (
                            <Badge variant="outline" className={`text-xs ${demandLabels[data.demandLevel]?.color}`}>
                              {data.demandLevel.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                        <p className="font-roboto text-sm">
                          <span className="text-muted-foreground">Median:</span> {formatSalary(data.median)}
                        </p>
                        {data.employment && (
                          <p className="text-xs text-muted-foreground font-roboto">
                            {formatNumber(data.employment)} employed
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade-Appropriate Entry Points */}
              {selectedCareer.entryPointsForGrades && (
                <div>
                  <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-lys-teal" />
                    How to Get Started
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(selectedCareer.entryPointsForGrades).map(([grade, description]) => (
                      <div 
                        key={grade} 
                        className={`p-4 rounded-md border ${selectedGrade === grade ? "border-lys-red bg-lys-red/5" : "bg-card"}`}
                      >
                        <p className="font-oswald font-semibold capitalize mb-1">
                          {grade.replace("_", " ")}
                        </p>
                        <p className="font-roboto text-sm text-muted-foreground">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Environment */}
              {selectedCareer.workEnvironment && (
                <div>
                  <h3 className="font-oswald text-lg font-semibold mb-2">Work Environment</h3>
                  <p className="font-roboto text-muted-foreground">{selectedCareer.workEnvironment}</p>
                  {selectedCareer.onTheJobTraining && selectedCareer.onTheJobTraining !== "None" && (
                    <p className="font-roboto text-sm text-muted-foreground mt-2">
                      <span className="font-semibold">On-the-job training:</span> {selectedCareer.onTheJobTraining}
                    </p>
                  )}
                </div>
              )}

              {/* Pathways */}
              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3">Career Pathways</h3>
                <Tabs defaultValue={selectedCareer.pathways[0]?.type} className="w-full">
                  <TabsList className="w-full flex-wrap h-auto">
                    {selectedCareer.pathways.map((pathway) => (
                      <TabsTrigger 
                        key={pathway.type} 
                        value={pathway.type} 
                        className="flex-1 font-roboto"
                      >
                        {pathwayTypes[pathway.type].label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedCareer.pathways.map((pathway) => (
                    <TabsContent key={pathway.type} value={pathway.type}>
                      <div className="p-4 rounded-md border bg-card">
                        <p className="font-roboto text-muted-foreground mb-4">{pathway.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-roboto">Duration: {pathway.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-roboto">Cost: {pathway.cost}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3">Key Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCareer.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="font-roboto">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Related Careers */}
              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3">Related Careers</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCareer.relatedCareers.map((related) => (
                    <Badge key={related} variant="outline" className="font-roboto">
                      {related}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t text-center text-sm text-muted-foreground font-roboto">
                <p>
                  Data sourced from the U.S. Bureau of Labor Statistics (BLS) Occupational Outlook Handbook.
                  Visit <a href="https://www.bls.gov/ooh/" target="_blank" rel="noopener noreferrer" className="text-lys-teal underline">bls.gov/ooh</a> for more information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
              <Compass className="h-6 w-6 text-lys-red" />
            </div>
            <div>
              <h1 className="font-oswald font-semibold tracking-tight text-3xl sm:text-4xl text-foreground">
                KNOW: Career Pathways
              </h1>
              <p className="font-roboto text-muted-foreground">
                40+ careers across tech, healthcare, trades, science, and more — powered by Bureau of Labor Statistics data
              </p>
            </div>
          </div>
          
          {showAds && <AdBanner position="inline" className="mb-6" />}
        </div>

        {/* Tabs for Explore / Trending / Market Data */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6" data-testid="tabs-careers">
          <TabsList className="flex-wrap h-auto">
            {isAuthenticated && (
              <TabsTrigger value="recommended" className="font-roboto gap-2" data-testid="tab-recommended">
                <Sparkles className="h-4 w-4" />
                For You
              </TabsTrigger>
            )}
            <TabsTrigger value="explore" className="font-roboto gap-2" data-testid="tab-explore">
              <Briefcase className="h-4 w-4" />
              Explore Careers
            </TabsTrigger>
            <TabsTrigger value="trending" className="font-roboto gap-2" data-testid="tab-trending">
              <Flame className="h-4 w-4" />
              Hot Careers
            </TabsTrigger>
            <TabsTrigger value="market" className="font-roboto gap-2" data-testid="tab-market">
              <BarChart3 className="h-4 w-4" />
              Market Trends
            </TabsTrigger>
          </TabsList>

          {isAuthenticated && (
            <TabsContent value="recommended" className="mt-6">
              {isLoadingRecommended ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !recommendedData?.hasAssessment ? (
                <Card className="bg-gradient-to-r from-lys-teal/10 to-lys-yellow/10">
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-lys-teal mx-auto mb-4" />
                    <h3 className="font-oswald font-semibold tracking-tight text-2xl mb-2">Discover Your Ideal Career Path</h3>
                    <p className="text-muted-foreground font-roboto mb-6 max-w-md mx-auto">
                      Complete the Self-Discovery assessment to unlock personalized career recommendations based on your unique Be-Know-Do profile.
                    </p>
                    <Link href="/self-discovery">
                      <Button
                        className="bg-lys-teal text-white font-oswald gap-2"
                        data-testid="button-take-assessment"
                      >
                        <Compass className="h-4 w-4" />
                        Take Self-Discovery Assessment
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {recommendedData.userProfile && (
                    <Card className="bg-gradient-to-r from-lys-red/5 via-lys-yellow/5 to-lys-teal/5">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <h3 className="font-oswald font-semibold tracking-tight text-xl">Your Be-Know-Do Profile</h3>
                          <div className="flex gap-2">
                            <Badge className="bg-lys-red/10 text-lys-red font-roboto gap-1">
                              <Heart className="h-3 w-3" />
                              BE: {recommendedData.userProfile.beScore}%
                            </Badge>
                            <Badge className="bg-lys-yellow/10 text-amber-700 font-roboto gap-1">
                              <Brain className="h-3 w-3" />
                              KNOW: {recommendedData.userProfile.knowScore}%
                            </Badge>
                            <Badge className="bg-lys-teal/10 text-lys-teal font-roboto gap-1">
                              <Zap className="h-3 w-3" />
                              DO: {recommendedData.userProfile.doScore}%
                            </Badge>
                          </div>
                        </div>
                        {recommendedData.userProfile.strengths && recommendedData.userProfile.strengths.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground font-roboto">Strengths:</span>
                            {recommendedData.userProfile.strengths.map((strength, i) => (
                              <Badge key={i} variant="outline" className="font-roboto text-xs">{strength}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div>
                    <h3 className="font-oswald text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-lys-yellow" />
                      Recommended Careers Based on Your Profile
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedData.recommendations.map((rec) => (
                        <Card 
                          key={rec.career.id} 
                          className="hover-elevate cursor-pointer"
                          onClick={() => setSelectedCareer(rec.career)}
                          data-testid={`card-recommended-career-${rec.career.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-oswald text-lg">{rec.career.title}</h4>
                                <Badge className="font-roboto text-xs">{categoryLabels[rec.career.category] || rec.career.category}</Badge>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-lys-teal">
                                  <Target className="h-4 w-4" />
                                  <span className="font-oswald text-lg">{Math.round(rec.matchScore)}%</span>
                                </div>
                                <span className="text-xs text-muted-foreground font-roboto">Match</span>
                              </div>
                            </div>
                            <Progress 
                              value={rec.matchScore} 
                              className="h-2 mb-3" 
                            />
                            <p className="text-sm text-muted-foreground font-roboto line-clamp-2 mb-3">
                              {rec.career.description}
                            </p>
                            {rec.matchReasons.length > 0 && (
                              <div className="text-xs text-muted-foreground font-roboto italic">
                                {rec.matchReasons[0]}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                              <span className="text-sm font-oswald text-lys-yellow flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rec.career.salaryMedian)}
                              </span>
                              {rec.career.jobOutlook && (
                                <Badge className={`${outlookLabels[rec.career.jobOutlook]?.color} text-xs font-roboto`}>
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {rec.career.projectedGrowth || 0}%
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="explore" className="mt-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8">
              <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
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
                <SelectTrigger className="w-full sm:w-[180px] font-roboto" data-testid="select-category">
                  <SelectValue placeholder="Category" />
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
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full sm:w-[180px] font-roboto" data-testid="select-grade">
                  <SelectValue placeholder="Grade Level" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value} className="font-roboto">
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-[180px] font-roboto" data-testid="select-state">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map((state) => (
                    <SelectItem key={state.value} value={state.value} className="font-roboto">
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPathway} onValueChange={setSelectedPathway}>
                <SelectTrigger className="w-full sm:w-[220px] font-roboto" data-testid="select-pathway">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Education Path" />
                </SelectTrigger>
                <SelectContent>
                  {educationPathways.map((path) => (
                    <SelectItem key={path.value} value={path.value} className="font-roboto">
                      {path.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Career Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCareers.map((career) => (
                  <Card key={career.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedCareer(career)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className="font-roboto text-xs">
                          {categoryLabels[career.category] || career.category}
                        </Badge>
                        <div className="flex gap-1">
                          {career.jobOutlook === "much_faster" && (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs font-roboto">
                              <Flame className="h-3 w-3 mr-1" />
                              Hot
                            </Badge>
                          )}
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs font-roboto">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {career.growthRate}
                          </Badge>
                        </div>
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
                            Median Salary
                          </span>
                          <span className="font-oswald font-semibold">
                            {formatSalary(career.salaryMedian)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-roboto flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            Education
                          </span>
                          <span className="font-roboto text-sm">{career.educationRequired}</span>
                        </div>
                        {career.projectedOpenings && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-roboto flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              Annual Openings
                            </span>
                            <span className="font-roboto">{formatNumber(career.projectedOpenings)}</span>
                          </div>
                        )}
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
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="mb-6">
              <h2 className="font-oswald text-2xl font-semibold mb-2">Fastest-Growing Careers</h2>
              <p className="font-roboto text-muted-foreground">
                Careers with the highest projected growth rates according to Bureau of Labor Statistics data
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trendingCareers.slice(0, 10).map((career, index) => (
                <Card 
                  key={career.id} 
                  className="hover-elevate cursor-pointer" 
                  onClick={() => setSelectedCareer(career)}
                  data-testid={`card-trending-career-${career.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lys-red to-lys-yellow flex items-center justify-center text-white font-oswald text-xl font-bold" data-testid={`text-trending-rank-${index + 1}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-oswald text-lg font-semibold" data-testid={`text-trending-title-${career.id}`}>{career.title}</h3>
                          {career.jobOutlook && (
                            <Badge className={`text-xs ${outlookLabels[career.jobOutlook]?.color}`}>
                              {career.jobOutlook === "much_faster" ? "Booming" : "Growing"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-roboto mb-3 line-clamp-2">
                          {career.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-green-600 font-semibold font-oswald">
                            +{career.projectedGrowth}% growth
                          </span>
                          <span className="text-muted-foreground font-roboto">
                            {formatSalary(career.salaryMedian)} median
                          </span>
                          {career.projectedOpenings && (
                            <span className="text-muted-foreground font-roboto">
                              {formatNumber(career.projectedOpenings)} openings/yr
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-oswald text-2xl font-semibold mb-2">Job Market Trends</h2>
                <p className="font-roboto text-muted-foreground">
                  Employment projections and market analysis from BLS data
                </p>
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-[200px] font-roboto">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map((state) => (
                    <SelectItem key={state.value} value={state.value} className="font-roboto">
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {marketTrends && (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card data-testid="card-stat-careers-tracked">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="h-8 w-8 text-lys-teal mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-oswald font-bold" data-testid="text-careers-count">{marketTrends.summary.totalCareers}</p>
                      <p className="text-sm text-muted-foreground font-roboto">Careers Tracked</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-stat-annual-openings">
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 text-lys-red mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-oswald font-bold truncate" data-testid="text-annual-openings">
                        {formatNumber(marketTrends.summary.totalProjectedOpenings)}
                      </p>
                      <p className="text-sm text-muted-foreground font-roboto">Annual Openings</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-stat-avg-growth">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-oswald font-bold text-green-600" data-testid="text-avg-growth">
                        +{marketTrends.summary.avgGrowthRate}%
                      </p>
                      <p className="text-sm text-muted-foreground font-roboto">Avg Growth Rate</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-stat-high-demand">
                    <CardContent className="p-6 text-center">
                      <Flame className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xl sm:text-2xl font-oswald font-bold" data-testid="text-high-demand-count">
                        {marketTrends.demandDistribution.very_high + marketTrends.demandDistribution.high}
                      </p>
                      <p className="text-sm text-muted-foreground font-roboto">High-Demand Careers</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Growing Careers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-oswald">Top Growing Careers</CardTitle>
                      <CardDescription className="font-roboto">
                        Careers with highest projected growth 2023-2033
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {marketTrends.topGrowingCareers.map((career, i) => (
                          <div key={career.id} className="flex items-center gap-3">
                            <span className="font-oswald font-bold text-lg text-muted-foreground w-6">
                              {i + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-roboto font-medium">{career.title}</p>
                              <p className="text-xs text-muted-foreground">{categoryLabels[career.category] || career.category}</p>
                            </div>
                            <Badge className="bg-green-500/10 text-green-600 font-oswald">
                              +{career.growth}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Job Outlook Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-oswald">Job Outlook Distribution</CardTitle>
                      <CardDescription className="font-roboto">
                        How careers are projected to grow
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(marketTrends.outlookDistribution).map(([outlook, count]) => {
                          const total = Object.values(marketTrends.outlookDistribution).reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={outlook}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-roboto capitalize">
                                  {outlook.replace(/_/g, " ")}
                                </span>
                                <span className="font-oswald">{count} careers</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center text-sm text-muted-foreground font-roboto p-4 bg-muted/50 rounded-md">
                  Data from {marketTrends.summary.source}. Last updated: {marketTrends.summary.lastUpdated}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-lys-red/10 to-lys-teal/10 border border-lys-red/20">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-oswald text-xl font-semibold mb-2">Every Path Leads Somewhere Great</h2>
              <p className="font-roboto text-muted-foreground text-sm">
                From AI engineering to welding, drone piloting to nursing — explore 40+ careers with real salary data,
                growth projections, and multiple pathways including trade school, certifications, and military service. College isn't the only way!
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
