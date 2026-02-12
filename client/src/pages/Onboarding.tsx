import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Building2, ChevronRight, ChevronLeft, Sparkles, Target, Compass, BookMarked, School, Home } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StandardsJurisdiction } from "@shared/schema";

const LANGUAGES = [
  // Top 25 most spoken languages in the world
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "pa", name: "Punjabi" },
  { code: "de", name: "German" },
  { code: "jv", name: "Javanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "tr", name: "Turkish" },
  { code: "ta", name: "Tamil" },
  { code: "vi", name: "Vietnamese" },
  { code: "ur", name: "Urdu" },
  { code: "it", name: "Italian" },
  { code: "th", name: "Thai" },
  { code: "gu", name: "Gujarati" },
  { code: "pl", name: "Polish" },
  { code: "uk", name: "Ukrainian" },
];

const COUNTRIES = [
  // Americas
  { code: "US", name: "United States", region: "Americas" },
  { code: "CA", name: "Canada", region: "Americas" },
  { code: "MX", name: "Mexico", region: "Americas" },
  { code: "BR", name: "Brazil", region: "Americas" },
  { code: "AR", name: "Argentina", region: "Americas" },
  { code: "CO", name: "Colombia", region: "Americas" },
  { code: "CL", name: "Chile", region: "Americas" },
  { code: "PE", name: "Peru", region: "Americas" },
  { code: "CR", name: "Costa Rica", region: "Americas" },
  { code: "PA", name: "Panama", region: "Americas" },
  { code: "DO", name: "Dominican Republic", region: "Americas" },
  { code: "JM", name: "Jamaica", region: "Americas" },
  { code: "TT", name: "Trinidad and Tobago", region: "Americas" },
  // Europe
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "BE", name: "Belgium", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "NO", name: "Norway", region: "Europe" },
  { code: "DK", name: "Denmark", region: "Europe" },
  { code: "FI", name: "Finland", region: "Europe" },
  { code: "IE", name: "Ireland", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  { code: "AT", name: "Austria", region: "Europe" },
  { code: "PL", name: "Poland", region: "Europe" },
  { code: "CZ", name: "Czech Republic", region: "Europe" },
  { code: "GR", name: "Greece", region: "Europe" },
  { code: "HU", name: "Hungary", region: "Europe" },
  { code: "RO", name: "Romania", region: "Europe" },
  // Asia-Pacific
  { code: "AU", name: "Australia", region: "Asia-Pacific" },
  { code: "NZ", name: "New Zealand", region: "Asia-Pacific" },
  { code: "JP", name: "Japan", region: "Asia-Pacific" },
  { code: "KR", name: "South Korea", region: "Asia-Pacific" },
  { code: "CN", name: "China", region: "Asia-Pacific" },
  { code: "IN", name: "India", region: "Asia-Pacific" },
  { code: "SG", name: "Singapore", region: "Asia-Pacific" },
  { code: "MY", name: "Malaysia", region: "Asia-Pacific" },
  { code: "TH", name: "Thailand", region: "Asia-Pacific" },
  { code: "PH", name: "Philippines", region: "Asia-Pacific" },
  { code: "ID", name: "Indonesia", region: "Asia-Pacific" },
  { code: "VN", name: "Vietnam", region: "Asia-Pacific" },
  { code: "PK", name: "Pakistan", region: "Asia-Pacific" },
  { code: "BD", name: "Bangladesh", region: "Asia-Pacific" },
  { code: "HK", name: "Hong Kong", region: "Asia-Pacific" },
  { code: "TW", name: "Taiwan", region: "Asia-Pacific" },
  // Middle East
  { code: "AE", name: "United Arab Emirates", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", region: "Middle East" },
  { code: "IL", name: "Israel", region: "Middle East" },
  { code: "TR", name: "Turkey", region: "Middle East" },
  { code: "EG", name: "Egypt", region: "Middle East" },
  { code: "JO", name: "Jordan", region: "Middle East" },
  { code: "QA", name: "Qatar", region: "Middle East" },
  { code: "KW", name: "Kuwait", region: "Middle East" },
  // Africa
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "NG", name: "Nigeria", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "GH", name: "Ghana", region: "Africa" },
  { code: "TZ", name: "Tanzania", region: "Africa" },
  { code: "UG", name: "Uganda", region: "Africa" },
  { code: "ET", name: "Ethiopia", region: "Africa" },
  { code: "RW", name: "Rwanda", region: "Africa" },
  { code: "MA", name: "Morocco", region: "Africa" },
  { code: "TN", name: "Tunisia", region: "Africa" },
];

const PRIMARY_GOALS = [
  { id: "discover", label: "Discover my strengths and interests", icon: Compass },
  { id: "career", label: "Explore career pathways", icon: Target },
  { id: "lessons", label: "Create engaging lesson plans", icon: BookOpen },
  { id: "curriculum", label: "Build scope & sequence", icon: BookMarked },
];

// Interests are now auto-derived from role and primary goal to streamline onboarding
const getAutoInterests = (role: string, primaryGoal: string): string[] => {
  const interests: string[] = [];
  
  // Role-based interests
  if (role === "student") {
    interests.push("self-discovery", "career-exploration", "action-plans", "resources");
  } else if (role === "educator" || role === "homeschool_parent") {
    interests.push("ai-lessons", "scope-sequence", "analytics", "resources");
  } else if (role === "campus_admin") {
    interests.push("scope-sequence", "analytics", "ai-lessons");
  }
  
  // Goal-based additions
  if (primaryGoal === "discover") interests.push("self-discovery", "career-exploration");
  if (primaryGoal === "career") interests.push("career-exploration", "action-plans");
  if (primaryGoal === "lessons") interests.push("ai-lessons", "resources");
  if (primaryGoal === "curriculum") interests.push("scope-sequence", "analytics");
  
  return Array.from(new Set(interests));
};

const GRADE_LEVELS = [
  { id: "K", label: "Kindergarten", band: "elementary" },
  { id: "1", label: "1st Grade", band: "elementary" },
  { id: "2", label: "2nd Grade", band: "elementary" },
  { id: "3", label: "3rd Grade", band: "elementary" },
  { id: "4", label: "4th Grade", band: "elementary" },
  { id: "5", label: "5th Grade", band: "elementary" },
  { id: "6", label: "6th Grade", band: "middle_school" },
  { id: "7", label: "7th Grade", band: "middle_school" },
  { id: "8", label: "8th Grade", band: "middle_school" },
  { id: "9", label: "9th Grade", band: "high_school" },
  { id: "10", label: "10th Grade", band: "high_school" },
  { id: "11", label: "11th Grade", band: "high_school" },
  { id: "12", label: "12th Grade", band: "high_school" },
  { id: "post_secondary", label: "Post-Secondary / College", band: "post_secondary" },
];

const GRADE_BANDS = [
  { id: "elementary", label: "Elementary (K-5)" },
  { id: "middle_school", label: "Middle School (6-8)" },
  { id: "high_school", label: "High School (9-12)" },
  { id: "post_secondary", label: "Post-Secondary" },
];

type StepKey = "role" | "classes" | "goals" | "location";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<StepKey>("role");
  const [role, setRole] = useState<string>("");
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("");
  const [stateValue, setStateValue] = useState("");

  const { data: jurisdictions } = useQuery<StandardsJurisdiction[]>({
    queryKey: ["/api/standards/jurisdictions"],
    enabled: !!country,
  });

  const selectedGradeBands = useMemo(() => {
    const bands: string[] = [];
    selectedGradeLevels.forEach(level => {
      const gradeInfo = GRADE_LEVELS.find(g => g.id === level);
      if (gradeInfo && !bands.includes(gradeInfo.band)) {
        bands.push(gradeInfo.band);
      }
    });
    return bands;
  }, [selectedGradeLevels]);

  const toggleGradeLevel = (gradeId: string) => {
    setSelectedGradeLevels(prev => 
      prev.includes(gradeId) 
        ? prev.filter(g => g !== gradeId)
        : [...prev, gradeId]
    );
  };

  const toggleGradeBand = (bandId: string) => {
    const bandsGrades = GRADE_LEVELS.filter(g => g.band === bandId).map(g => g.id);
    const allSelected = bandsGrades.every(g => selectedGradeLevels.includes(g));
    
    if (allSelected) {
      setSelectedGradeLevels(prev => prev.filter(g => !bandsGrades.includes(g)));
    } else {
      setSelectedGradeLevels(prev => {
        const combined = [...prev, ...bandsGrades];
        return combined.filter((v, i, a) => a.indexOf(v) === i);
      });
    }
  };

  const completeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/onboarding/complete", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome to LYS!", description: "Your personalized experience is ready." });
      
      const redirectPath = getRecommendedPath();
      setLocation(`${redirectPath}?tour=true&role=${encodeURIComponent(role)}&goal=${encodeURIComponent(primaryGoal)}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
    },
  });

  const skipMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/onboarding/skip", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ 
        title: "Exploring LYS", 
        description: data.message || "Complete your profile anytime from Settings" 
      });
      setLocation("/");
    },
    onError: (error: any) => {
      if (error?.message?.includes("Maximum skips")) {
        toast({ 
          title: "Profile Required", 
          description: "Please complete your profile to continue using LYS", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
      }
    },
  });

  const handleSkip = () => {
    skipMutation.mutate();
  };

  const getRecommendedPath = () => {
    if (primaryGoal === "discover") return "/self-discovery";
    if (primaryGoal === "career") return "/careers";
    if (primaryGoal === "lessons") return "/lesson-generator";
    if (primaryGoal === "curriculum") return "/scope-sequence";
    return "/";
  };

  const getRecommendedFeatures = () => {
    return getAutoInterests(role, primaryGoal);
  };

  const handleComplete = () => {
    const autoInterests = getAutoInterests(role, primaryGoal);
    const needsAnalysis = {
      primaryGoal,
      interests: autoInterests,
      experienceLevel: "beginner",
      recommendedFeatures: getRecommendedFeatures(),
    };

    completeMutation.mutate({
      role,
      preferences: {
        language,
        country,
        state: stateValue,
        gradeLevels: selectedGradeLevels,
        gradeBands: selectedGradeBands,
      },
      needsAnalysis,
    });
  };

  const isEducator = role === "educator" || role === "campus_admin" || role === "homeschool_parent";

  const steps: { key: StepKey; label: string }[] = isEducator
    ? [
        { key: "role", label: "Your Role" },
        { key: "classes", label: "Your Classes" },
        { key: "goals", label: "Your Goals" },
        { key: "location", label: "Get Started" },
      ]
    : [
        { key: "role", label: "Your Role" },
        { key: "goals", label: "Your Goals" },
        { key: "location", label: "Get Started" },
      ];

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    if (step === "role") return !!role;
    if (step === "classes") return selectedGradeLevels.length > 0;
    if (step === "goals") return !!primaryGoal;
    if (step === "location") return !!language && !!country;
    return true;
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-marker text-3xl text-lys-red">LYS</span>
            <Sparkles className="h-6 w-6 text-lys-yellow" />
          </div>
          <CardTitle className="font-oswald text-2xl">Welcome! Let's personalize your experience</CardTitle>
          <CardDescription>
            Answer a few questions so we can guide you to the features that matter most
          </CardDescription>
          <Progress value={progress} className="mt-4" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {steps.map((s, i) => (
              <span key={s.key} className={i <= currentStepIndex ? "text-foreground" : ""}>
                {s.label}
              </span>
            ))}
          </div>
        </CardHeader>

        <CardContent className="min-h-[300px]">
          {step === "role" && (
            <div className="space-y-6">
              <Label className="text-lg font-oswald">What best describes you?</Label>
              <RadioGroup value={role} onValueChange={setRole} className="grid gap-4">
                <div 
                  className={`flex items-center gap-4 p-4 rounded-md border cursor-pointer hover-elevate ${role === "student" ? "border-lys-red bg-muted" : ""}`}
                  onClick={() => setRole("student")}
                  data-testid="option-student"
                >
                  <RadioGroupItem value="student" id="student" />
                  <GraduationCap className="h-6 w-6 text-lys-teal" />
                  <div>
                    <Label htmlFor="student" className="cursor-pointer font-medium">Student</Label>
                    <p className="text-sm text-muted-foreground">High school, college, or lifelong learner</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-4 p-4 rounded-md border cursor-pointer hover-elevate ${role === "educator" ? "border-lys-red bg-muted" : ""}`}
                  onClick={() => setRole("educator")}
                  data-testid="option-educator"
                >
                  <RadioGroupItem value="educator" id="educator" />
                  <BookOpen className="h-6 w-6 text-lys-yellow" />
                  <div>
                    <Label htmlFor="educator" className="cursor-pointer font-medium">Educator</Label>
                    <p className="text-sm text-muted-foreground">Teacher, instructor, or curriculum developer</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-4 p-4 rounded-md border cursor-pointer hover-elevate ${role === "homeschool_parent" ? "border-lys-red bg-muted" : ""}`}
                  onClick={() => setRole("homeschool_parent")}
                  data-testid="option-homeschool-parent"
                >
                  <RadioGroupItem value="homeschool_parent" id="homeschool_parent" />
                  <Home className="h-6 w-6 text-lys-teal" />
                  <div>
                    <Label htmlFor="homeschool_parent" className="cursor-pointer font-medium">Homeschool Parent</Label>
                    <p className="text-sm text-muted-foreground">Home educator teaching your own children</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-4 p-4 rounded-md border cursor-pointer hover-elevate ${role === "campus_admin" ? "border-lys-red bg-muted" : ""}`}
                  onClick={() => setRole("campus_admin")}
                  data-testid="option-campus-admin"
                >
                  <RadioGroupItem value="campus_admin" id="campus_admin" />
                  <Building2 className="h-6 w-6 text-lys-red" />
                  <div>
                    <Label htmlFor="campus_admin" className="cursor-pointer font-medium">Campus Administrator</Label>
                    <p className="text-sm text-muted-foreground">School or district leadership</p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === "classes" && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-oswald">What grade levels do you teach?</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Select all the grade levels for your classes. This helps us show you relevant educational standards.
                </p>
                
                <div className="space-y-4">
                  {GRADE_BANDS.map((band) => {
                    const bandGrades = GRADE_LEVELS.filter(g => g.band === band.id);
                    const allSelected = bandGrades.every(g => selectedGradeLevels.includes(g.id));
                    const someSelected = bandGrades.some(g => selectedGradeLevels.includes(g.id));
                    
                    return (
                      <div key={band.id} className="rounded-md border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Checkbox
                            id={`band-${band.id}`}
                            checked={allSelected}
                            ref={(el) => {
                              if (el && someSelected && !allSelected) {
                                (el as HTMLButtonElement).dataset.state = "indeterminate";
                              }
                            }}
                            onCheckedChange={() => toggleGradeBand(band.id)}
                            data-testid={`checkbox-band-${band.id}`}
                          />
                          <Label htmlFor={`band-${band.id}`} className="font-oswald cursor-pointer flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            {band.label}
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-6">
                          {bandGrades.map((grade) => (
                            <div key={grade.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`grade-${grade.id}`}
                                checked={selectedGradeLevels.includes(grade.id)}
                                onCheckedChange={() => toggleGradeLevel(grade.id)}
                                data-testid={`checkbox-grade-${grade.id}`}
                              />
                              <Label htmlFor={`grade-${grade.id}`} className="text-sm cursor-pointer">
                                {grade.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedGradeLevels.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Selected grades:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedGradeLevels.sort((a, b) => {
                        const order = GRADE_LEVELS.map(g => g.id);
                        return order.indexOf(a) - order.indexOf(b);
                      }).map(gradeId => {
                        const grade = GRADE_LEVELS.find(g => g.id === gradeId);
                        return (
                          <Badge key={gradeId} variant="secondary" className="text-xs">
                            {grade?.label || gradeId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "goals" && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-oswald">What's your primary goal?</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  We'll personalize your experience based on your selection
                </p>
                <RadioGroup value={primaryGoal} onValueChange={setPrimaryGoal} className="grid gap-3">
                  {PRIMARY_GOALS.map((goal) => (
                    <div 
                      key={goal.id}
                      className={`flex items-center gap-4 p-4 rounded-md border cursor-pointer hover-elevate ${primaryGoal === goal.id ? "border-lys-red bg-muted" : ""}`}
                      onClick={() => setPrimaryGoal(goal.id)}
                      data-testid={`goal-${goal.id}`}
                    >
                      <RadioGroupItem value={goal.id} id={goal.id} />
                      <goal.icon className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor={goal.id} className="cursor-pointer">{goal.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === "location" && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label className="font-oswald">Preferred Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-2" data-testid="select-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-oswald">Country</Label>
                  <Select value={country} onValueChange={(v) => { setCountry(v); setStateValue(""); }}>
                    <SelectTrigger className="mt-2" data-testid="select-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {["Americas", "Europe", "Asia-Pacific", "Middle East", "Africa"].map((region) => (
                        <SelectGroup key={region}>
                          <SelectLabel className="font-oswald text-muted-foreground">{region}</SelectLabel>
                          {COUNTRIES.filter(c => c.region === region).map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {country && (
                  <div>
                    <Label className="font-oswald">State/Jurisdiction (for standards)</Label>
                    <Select value={stateValue} onValueChange={setStateValue}>
                      <SelectTrigger className="mt-2" data-testid="select-state">
                        <SelectValue placeholder="Select state/region" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {(() => {
                          const countryName = COUNTRIES.find(c => c.code === country)?.name || country;
                          const matchingJurisdictions = jurisdictions?.filter(j => 
                            j.country === countryName || j.country === country
                          ) || [];
                          
                          if (matchingJurisdictions.length > 0) {
                            // For US, group by region
                            if (country === "US") {
                              const usRegions: Record<string, string[]> = {
                                "Northeast": ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"],
                                "Southeast": ["AL", "AR", "FL", "GA", "KY", "LA", "MD", "MS", "NC", "SC", "TN", "VA", "WV", "DE", "DC"],
                                "Midwest": ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
                                "Southwest": ["AZ", "NM", "OK", "TX"],
                                "West": ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"],
                              };
                              
                              const groupedItems: JSX.Element[] = [];
                              Object.entries(usRegions).forEach(([region, stateAbbrevs]) => {
                                const regionStates = matchingJurisdictions.filter(j => 
                                  stateAbbrevs.includes(j.abbreviation)
                                ).sort((a, b) => a.name.localeCompare(b.name));
                                
                                if (regionStates.length > 0) {
                                  groupedItems.push(
                                    <SelectGroup key={region}>
                                      <SelectLabel className="font-oswald text-xs text-muted-foreground">{region}</SelectLabel>
                                      {regionStates.map((j) => (
                                        <SelectItem key={j.id} value={j.abbreviation}>{j.name}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  );
                                }
                              });
                              
                              // Add any states not in regions (national standards, etc.)
                              const allRegionAbbrevs = Object.values(usRegions).flat();
                              const otherStandards = matchingJurisdictions.filter(j => 
                                !allRegionAbbrevs.includes(j.abbreviation)
                              ).sort((a, b) => a.name.localeCompare(b.name));
                              
                              if (otherStandards.length > 0) {
                                groupedItems.push(
                                  <SelectGroup key="national">
                                    <SelectLabel className="font-oswald text-xs text-muted-foreground">National / Other</SelectLabel>
                                    {otherStandards.map((j) => (
                                      <SelectItem key={j.id} value={j.abbreviation}>{j.name}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                );
                              }
                              
                              return groupedItems;
                            }
                            
                            // For other countries, sort alphabetically
                            return matchingJurisdictions
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((j) => (
                                <SelectItem key={j.id} value={j.abbreviation}>{j.name}</SelectItem>
                              ));
                          }
                          
                          return <SelectItem value="other">Other / Not Listed</SelectItem>;
                        })()}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      This helps us show relevant educational standards
                    </p>
                  </div>
                )}

                {isEducator && selectedGradeLevels.length > 0 && (
                  <div className="p-3 bg-lys-teal/10 border border-lys-teal/20 rounded-md">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Standards will be filtered</span> to show only content relevant to your selected grade levels:
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedGradeBands.map(bandId => {
                        const band = GRADE_BANDS.find(b => b.id === bandId);
                        return (
                          <Badge key={bandId} variant="outline" className="text-xs border-lys-teal/30 text-lys-teal">
                            {band?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between gap-4 w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              data-testid="button-back"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step === "location" ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || completeMutation.isPending}
                data-testid="button-get-started"
              >
                {completeMutation.isPending ? "Setting up..." : "Get Started"}
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={skipMutation.isPending}
            className="text-muted-foreground"
            data-testid="button-skip-onboarding"
          >
            {skipMutation.isPending ? "Skipping..." : "Skip for now and explore"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
