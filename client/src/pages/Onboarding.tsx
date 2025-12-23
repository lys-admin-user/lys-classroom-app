import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, Building2, ChevronRight, ChevronLeft, Sparkles, Target, Compass, BookMarked } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StandardsJurisdiction } from "@shared/schema";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "UK", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

const PRIMARY_GOALS = [
  { id: "discover", label: "Discover my strengths and interests", icon: Compass },
  { id: "career", label: "Explore career pathways", icon: Target },
  { id: "lessons", label: "Create engaging lesson plans", icon: BookOpen },
  { id: "curriculum", label: "Build scope & sequence", icon: BookMarked },
];

const INTERESTS = [
  { id: "self-discovery", label: "Self-Discovery Assessments" },
  { id: "career-exploration", label: "Career Exploration" },
  { id: "action-plans", label: "Goal Setting & Action Plans" },
  { id: "ai-lessons", label: "AI Lesson Generator" },
  { id: "scope-sequence", label: "Scope & Sequence Builder" },
  { id: "resources", label: "Educational Resources" },
  { id: "analytics", label: "Progress Analytics" },
];

type StepKey = "role" | "goals" | "location" | "complete";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<StepKey>("role");
  const [role, setRole] = useState<string>("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");

  const { data: jurisdictions } = useQuery<StandardsJurisdiction[]>({
    queryKey: ["/api/standards/jurisdictions"],
    enabled: !!country,
  });

  const completeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/onboarding/complete", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome to LYS!", description: "Your personalized experience is ready." });
      
      const redirectPath = getRecommendedPath();
      setLocation(redirectPath);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
    },
  });

  const getRecommendedPath = () => {
    if (primaryGoal === "discover") return "/self-discovery";
    if (primaryGoal === "career") return "/careers";
    if (primaryGoal === "lessons") return "/lesson-generator";
    if (primaryGoal === "curriculum") return "/scope-sequence";
    return "/";
  };

  const getRecommendedFeatures = () => {
    const features: string[] = [];
    if (role === "student") {
      features.push("self-discovery", "career-exploration", "action-plans", "resources");
    } else if (role === "educator") {
      features.push("ai-lessons", "scope-sequence", "analytics", "resources");
    } else if (role === "campus_admin") {
      features.push("scope-sequence", "analytics", "ai-lessons");
    }
    return [...new Set([...features, ...interests])];
  };

  const handleComplete = () => {
    const needsAnalysis = {
      primaryGoal,
      interests,
      experienceLevel: "beginner",
      recommendedFeatures: getRecommendedFeatures(),
    };

    completeMutation.mutate({
      role,
      preferences: {
        language,
        country,
        state,
      },
      needsAnalysis,
    });
  };

  const steps: { key: StepKey; label: string }[] = [
    { key: "role", label: "Your Role" },
    { key: "goals", label: "Your Goals" },
    { key: "location", label: "Location & Standards" },
    { key: "complete", label: "Get Started" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    if (step === "role") return !!role;
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

          {step === "goals" && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-oswald">What's your primary goal?</Label>
                <RadioGroup value={primaryGoal} onValueChange={setPrimaryGoal} className="grid gap-3 mt-4">
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

              <div>
                <Label className="text-base font-oswald mb-3 block">What else interests you? (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTS.map((interest) => (
                    <div key={interest.id} className="flex items-center gap-2">
                      <Checkbox
                        id={interest.id}
                        checked={interests.includes(interest.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setInterests([...interests, interest.id]);
                          } else {
                            setInterests(interests.filter(i => i !== interest.id));
                          }
                        }}
                        data-testid={`interest-${interest.id}`}
                      />
                      <Label htmlFor={interest.id} className="text-sm cursor-pointer">{interest.label}</Label>
                    </div>
                  ))}
                </div>
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
                  <Select value={country} onValueChange={(v) => { setCountry(v); setState(""); }}>
                    <SelectTrigger className="mt-2" data-testid="select-country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {country && (
                  <div>
                    <Label className="font-oswald">State/Jurisdiction (for standards)</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="mt-2" data-testid="select-state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {jurisdictions?.filter(j => j.country === country).map((j) => (
                          <SelectItem key={j.id} value={j.abbreviation}>{j.name}</SelectItem>
                        ))}
                        {(!jurisdictions || jurisdictions.filter(j => j.country === country).length === 0) && (
                          <SelectItem value="other">Other</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      This helps us show relevant educational standards
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="space-y-6 text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-lys-teal/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-lys-teal" />
              </div>
              <div>
                <h3 className="text-xl font-oswald text-foreground mb-2">You're all set!</h3>
                <p className="text-muted-foreground">
                  Based on your answers, we recommend starting with:
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted">
                <p className="font-medium text-foreground">
                  {primaryGoal === "discover" && "Self-Discovery Assessments"}
                  {primaryGoal === "career" && "Career Exploration"}
                  {primaryGoal === "lessons" && "AI Lesson Generator"}
                  {primaryGoal === "curriculum" && "Scope & Sequence Builder"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll take you there after you click "Get Started"
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step === "complete" ? (
            <Button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
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
        </CardFooter>
      </Card>
    </div>
  );
}
