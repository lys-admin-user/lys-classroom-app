import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Clock, Target, BookOpen, Users, Loader2, Copy, Download, Heart, Compass, Save, Check, GraduationCap, FileText, Globe, MapPin, Lightbulb, Play, UserCheck, Settings, Printer, LayoutList, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTier } from "@/hooks/use-tier";
import { AdBanner } from "@/components/AdBanner";
import type { LessonPlan, EducatorProfile } from "@shared/schema";
import { educationalStandards, getStates, getSubjects, getStandardCodes, getStandardsName, type StandardCode } from "@shared/standards";
import { Link, useLocation } from "wouter";

const gradeLevels = [
  "Elementary (K-2)",
  "Elementary (3-5)",
  "Middle School (6-8)",
  "High School (9-10)",
  "High School (11-12)",
];

const durations = ["30 minutes", "45 minutes", "60 minutes", "90 minutes", "1-2 class periods"];

export default function LessonGenerator() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { showAds, requiresScopeSequence, tier } = useTier();
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [course, setCourse] = useState("");
  const [unit, setUnit] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [bkdFocus, setBkdFocus] = useState<"be" | "know" | "do">("be");
  const [duration, setDuration] = useState("45 minutes");
  const [lessonPart, setLessonPart] = useState("");
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStandardCodes, setSelectedStandardCodes] = useState<StandardCode[]>([]);
  
  const [generatedLesson, setGeneratedLesson] = useState<LessonPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [profileApplied, setProfileApplied] = useState(false);
  const [scopeSkipped, setScopeSkipped] = useState(false);

  const { data: profileData } = useQuery<{ profile: EducatorProfile | null; tier: string }>({
    queryKey: ["/api/educator-profile"],
    enabled: isAuthenticated,
  });

  const educatorProfile = profileData?.profile;
  const hasProfile = !!educatorProfile && !!educatorProfile.country && !!educatorProfile.state;

  useEffect(() => {
    if (educatorProfile && !profileApplied) {
      if (educatorProfile.country) setSelectedCountry(educatorProfile.country);
      if (educatorProfile.state) setSelectedState(educatorProfile.state);
      if (educatorProfile.preferredStandardCodes && (educatorProfile.preferredStandardCodes as StandardCode[]).length > 0) {
        setSelectedStandardCodes(educatorProfile.preferredStandardCodes as StandardCode[]);
      }
      setProfileApplied(true);
    }
  }, [educatorProfile, profileApplied]);

  const countries = useMemo(() => educationalStandards.map(c => c.country), []);
  const states = useMemo(() => selectedCountry ? getStates(selectedCountry) : [], [selectedCountry]);
  const subjects = useMemo(() => selectedCountry && selectedState ? getSubjects(selectedCountry, selectedState) : [], [selectedCountry, selectedState]);
  const standardCodes = useMemo(() => selectedCountry && selectedState && selectedSubject ? getStandardCodes(selectedCountry, selectedState, selectedSubject) : [], [selectedCountry, selectedState, selectedSubject]);
  const standardsName = useMemo(() => selectedCountry && selectedState ? getStandardsName(selectedCountry, selectedState) : "", [selectedCountry, selectedState]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedState("");
    setSelectedSubject("");
    setSelectedStandardCodes([]);
  };

  const handleStateChange = (stateAbbr: string) => {
    setSelectedState(stateAbbr);
    setSelectedSubject("");
    setSelectedStandardCodes([]);
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedStandardCodes([]);
  };

  const toggleStandardCode = (code: StandardCode) => {
    setSelectedStandardCodes(prev => {
      const exists = prev.find(c => c.code === code.code);
      if (exists) {
        return prev.filter(c => c.code !== code.code);
      }
      return [...prev, code];
    });
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const stateData = states.find(s => s.abbreviation === selectedState);
      const response = await apiRequest("POST", "/api/lessons/generate", {
        topic,
        course,
        unit,
        gradeLevel,
        bkdFocus,
        standards: {
          country: selectedCountry,
          state: selectedState,
          standardsName: stateData?.standardsName || standardsName,
          subject: selectedSubject,
          codes: selectedStandardCodes,
        },
        duration,
        lessonPart,
      });
      return await response.json() as LessonPlan;
    },
    onSuccess: (data) => {
      setGeneratedLesson(data);
      setIsSaved(false);
      toast({
        title: "Lesson Generated!",
        description: "Great job! You just saved yourself 30+ minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Oops! Let's try that again",
        description: error.message || "There was an error generating your lesson.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedLesson) throw new Error("No lesson to save");
      const standardsString = generatedLesson.standards 
        ? `${generatedLesson.standards.standardsName}: ${generatedLesson.standards.codes.map(c => c.code).join(", ")}`
        : "";
      const response = await apiRequest("POST", "/api/lessons/save", {
        title: generatedLesson.title,
        topic: generatedLesson.topic,
        gradeLevel: generatedLesson.gradeLevel,
        bkdFocus: generatedLesson.bkdFocus,
        standards: standardsString,
        duration: generatedLesson.duration,
        objectives: generatedLesson.objectives,
        activities: generatedLesson.activities,
        materials: generatedLesson.materials,
        assessment: generatedLesson.assessment,
        reflection: generatedLesson.reflection,
      });
      return await response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({
        title: "Lesson Saved!",
        description: "Your lesson has been added to your library.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!topic || !gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in the topic and grade level.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedCountry || !selectedState || !selectedSubject || selectedStandardCodes.length === 0) {
      toast({
        title: "Standards Required",
        description: "Please select your educational standards. This ensures your lesson meets legal requirements.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const copyToClipboard = () => {
    if (generatedLesson) {
      const standardsText = generatedLesson.standards 
        ? `${generatedLesson.standards.standardsName}: ${generatedLesson.standards.codes.map(c => c.code).join(", ")}`
        : "";
      const text = `
LESSON PLAN: ${generatedLesson.title}
${generatedLesson.course ? `Course: ${generatedLesson.course}` : ""}
${generatedLesson.unit ? `Unit: ${generatedLesson.unit}` : ""}
Grade: ${generatedLesson.gradeLevel}
Duration: ${generatedLesson.duration}
Standards: ${standardsText}

ESSENTIAL QUESTIONS:
${generatedLesson.essentialQuestions?.map((q) => `- ${q}`).join("\n") || ""}

LYS METHODOLOGY:
Be (Character/Values): ${generatedLesson.lysMethodology?.be?.focus || ""} - ${generatedLesson.lysMethodology?.be?.description || ""}
Know (Resources): ${generatedLesson.lysMethodology?.know?.focus || ""} - ${generatedLesson.lysMethodology?.know?.description || ""}
Do (Excellence): ${generatedLesson.lysMethodology?.do?.focus || ""} - ${generatedLesson.lysMethodology?.do?.description || ""}

LEARNING OBJECTIVES:
${generatedLesson.objectives.map((o) => `- ${o}`).join("\n")}

INSTRUCTIONAL INPUT:
Anticipatory Set: ${generatedLesson.synchronousInstruction?.anticipatorySet || ""}
Modeling (I do): ${generatedLesson.synchronousInstruction?.modeling || ""}
Guided Practice (We do): ${generatedLesson.synchronousInstruction?.guidedPractice || ""}
Independent Practice: ${generatedLesson.synchronousInstruction?.independentPractice || ""}

MATERIALS:
${generatedLesson.materials.map((m) => `- ${m}`).join("\n")}

ASSESSMENT:
${generatedLesson.assessment}

LESSON CLOSE:
${generatedLesson.lessonClose?.educational ? `Educational: ${generatedLesson.lessonClose.educational}` : ""}
${generatedLesson.lessonClose?.social ? `Social: ${generatedLesson.lessonClose.social}` : ""}
${generatedLesson.lessonClose?.vocational ? `Vocational: ${generatedLesson.lessonClose.vocational}` : ""}
      `.trim();
      navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Lesson plan copied to clipboard.",
      });
    }
  };

  const bkdOptions = [
    { value: "be", label: "BE", description: "Identity & Purpose", icon: Heart, color: "bg-lys-yellow" },
    { value: "know", label: "KNOW", description: "Strategy & Resources", icon: Compass, color: "bg-lys-red" },
    { value: "do", label: "DO", description: "Action & Impact", icon: Target, color: "bg-lys-teal" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-lys-red" />
            </div>
            <div>
              <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
                AI Lesson Generator
              </h1>
              <p className="font-roboto text-muted-foreground">
                Create standards-aligned lessons using the LYS Be-Know-Do methodology
              </p>
            </div>
          </div>
        </div>

        {requiresScopeSequence && !scopeSkipped && (
          <Alert className="mb-6 border-lys-teal/50 bg-lys-teal/5" data-testid="alert-scope-required">
            <LayoutList className="h-4 w-4 text-lys-teal" />
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span className="font-roboto">
                <strong className="font-oswald">Recommended:</strong> Create a Scope & Sequence first to organize your curriculum for the year.
              </span>
              <div className="flex items-center gap-2">
                <Link href="/scope-sequence">
                  <Button variant="default" size="sm" className="gap-1 bg-lys-teal hover:bg-lys-teal/90" data-testid="button-go-to-scope">
                    <LayoutList className="h-3 w-3" />
                    Build Scope
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setScopeSkipped(true)}
                  data-testid="button-skip-scope"
                >
                  Skip for now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showAds && (
          <AdBanner position="inline" className="mb-6" />
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 no-print">
            <Card>
              <CardHeader className="bg-lys-teal/5 border-b">
                <CardTitle className="font-oswald text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-lys-teal" />
                  Lesson Details
                </CardTitle>
                <CardDescription className="font-roboto">
                  Fill in the details and let AI create your lesson plan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="font-oswald">Topic / Lesson Title</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., Annotating an Argumentative Text..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="font-roboto min-h-[80px]"
                    data-testid="input-lesson-topic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeLevel" className="font-oswald">Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger id="gradeLevel" className="font-roboto" data-testid="select-grade-level">
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeLevels.map((level) => (
                        <SelectItem key={level} value={level} className="font-roboto">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-lys-red" />
                      <Label className="font-oswald text-base">Educational Standards (Required)</Label>
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-2">
                        {hasProfile && (
                          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-profile-loaded">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">From Profile</span>
                          </Badge>
                        )}
                        <Link href="/settings">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1" data-testid="link-settings">
                            <Settings className="h-3 w-3" />
                            <span className="text-xs">Settings</span>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Country
                      </Label>
                      <Select value={selectedCountry} onValueChange={handleCountryChange}>
                        <SelectTrigger className="font-roboto" data-testid="select-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country} className="font-roboto">
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        State/Region
                      </Label>
                      <Select value={selectedState} onValueChange={handleStateChange} disabled={!selectedCountry}>
                        <SelectTrigger className="font-roboto" data-testid="select-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.abbreviation} value={state.abbreviation} className="font-roboto">
                              {state.state} ({state.standardsName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-roboto text-sm text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Subject Area
                    </Label>
                    <Select value={selectedSubject} onValueChange={handleSubjectChange} disabled={!selectedState}>
                      <SelectTrigger className="font-roboto" data-testid="select-subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.subject} value={subject.subject} className="font-roboto">
                            {subject.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {standardCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="font-roboto text-sm text-muted-foreground">
                        {standardsName} Standard Codes (select all that apply)
                      </Label>
                      <ScrollArea className="h-32 rounded-md border p-3">
                        <div className="space-y-2">
                          {standardCodes.map((code) => (
                            <div key={code.code} className="flex items-start gap-2">
                              <Checkbox
                                id={code.code}
                                checked={selectedStandardCodes.some(c => c.code === code.code)}
                                onCheckedChange={() => toggleStandardCode(code)}
                                data-testid={`checkbox-standard-${code.code}`}
                              />
                              <label htmlFor={code.code} className="font-roboto text-sm cursor-pointer leading-tight">
                                <span className="font-semibold text-lys-teal">{code.code}</span>
                                <span className="text-muted-foreground ml-1">- {code.description}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {selectedStandardCodes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedStandardCodes.map((code) => (
                            <Badge key={code.code} variant="secondary" className="font-roboto text-xs">
                              {code.code}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course" className="font-oswald">Course</Label>
                    <Input
                      id="course"
                      placeholder="e.g., G8 ELAR"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="font-roboto"
                      data-testid="input-course"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="font-oswald">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="e.g., Unit 04"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="font-roboto"
                      data-testid="input-unit"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="font-oswald">Primary Be-Know-Do Focus</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {bkdOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBkdFocus(option.value as "be" | "know" | "do")}
                        className={`p-3 rounded-md border-2 transition-all ${
                          bkdFocus === option.value
                            ? `border-current ${option.color}/20 ring-2 ring-offset-2`
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                        data-testid={`button-bkd-${option.value}`}
                      >
                        <option.icon className={`h-5 w-5 mx-auto mb-1 ${
                          option.value === "be" ? "text-lys-yellow" :
                          option.value === "know" ? "text-lys-red" : "text-lys-teal"
                        }`} />
                        <p className="font-oswald text-sm font-semibold">{option.label}</p>
                        <p className="text-[10px] text-muted-foreground font-roboto">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="font-oswald">Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger id="duration" className="font-roboto" data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d} value={d} className="font-roboto">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessonPart" className="font-oswald">Lesson Part</Label>
                    <Input
                      id="lessonPart"
                      placeholder="e.g., 1 of 3"
                      value={lessonPart}
                      onChange={(e) => setLessonPart(e.target.value)}
                      className="font-roboto"
                      data-testid="input-lesson-part"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full bg-lys-red hover:bg-lys-red/90 text-white font-oswald text-lg h-12 gap-2"
                  data-testid="button-generate-lesson"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Crafting your lesson...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Lesson Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 print-content">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap bg-muted/30 border-b">
                <div>
                  <CardTitle className="font-oswald text-lg">Lesson Plan Preview</CardTitle>
                  <CardDescription className="font-roboto">
                    {generatedLesson ? "Your personalized LYS lesson is ready!" : "Your lesson will appear here"}
                  </CardDescription>
                </div>
                {generatedLesson && (
                  <div className="flex items-center gap-2">
                    {isAuthenticated && (
                      <Button 
                        variant={isSaved ? "secondary" : "default"}
                        size="sm" 
                        onClick={() => saveMutation.mutate()} 
                        disabled={saveMutation.isPending || isSaved}
                        className={`gap-1 font-roboto ${!isSaved ? 'bg-lys-teal hover:bg-lys-teal/90 text-white' : ''}`}
                        data-testid="button-save-lesson"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isSaved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isSaved ? "Saved" : "Save to Library"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 font-roboto" data-testid="button-copy-lesson">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 font-roboto" data-testid="button-print-lesson">
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {generateMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-lys-red/10 flex items-center justify-center animate-pulse">
                        <Sparkles className="h-8 w-8 text-lys-red" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-lys-red/30 animate-ping"></div>
                    </div>
                    <p className="mt-6 font-oswald text-lg">Crafting your personalized lesson plan...</p>
                    <p className="text-sm text-muted-foreground font-roboto mt-2">
                      This usually takes about 10-15 seconds
                    </p>
                  </div>
                ) : generatedLesson ? (
                  <ScrollArea className="h-[700px]">
                    <div className="p-6 space-y-6">
                      <div className="border-b pb-4">
                        <h2 className="font-marker text-2xl text-foreground mb-3">{generatedLesson.title}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-roboto">
                          {generatedLesson.course && (
                            <div><span className="text-muted-foreground">Course:</span> {generatedLesson.course}</div>
                          )}
                          {generatedLesson.unit && (
                            <div><span className="text-muted-foreground">Unit:</span> {generatedLesson.unit}</div>
                          )}
                          <div><span className="text-muted-foreground">Duration:</span> {generatedLesson.duration}</div>
                          {generatedLesson.lessonPart && (
                            <div><span className="text-muted-foreground">Part:</span> {generatedLesson.lessonPart}</div>
                          )}
                        </div>
                        {generatedLesson.standards && (
                          <div className="mt-3 p-3 bg-lys-teal/5 rounded-md">
                            <div className="flex items-center gap-2 mb-1">
                              <GraduationCap className="h-4 w-4 text-lys-teal" />
                              <span className="font-oswald text-sm font-semibold">{generatedLesson.standards.standardsName}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {generatedLesson.standards.codes.map((code) => (
                                <Badge key={code.code} variant="outline" className="font-roboto text-xs">
                                  {code.code}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {generatedLesson.essentialQuestions && generatedLesson.essentialQuestions.length > 0 && (
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-lys-yellow" />
                            Essential Questions
                          </h3>
                          <ul className="space-y-2">
                            {generatedLesson.essentialQuestions.map((q, i) => (
                              <li key={i} className="font-roboto text-sm italic text-muted-foreground pl-4 border-l-2 border-lys-yellow">
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {generatedLesson.lysMethodology && (
                        <div className="p-4 rounded-md bg-muted/30">
                          <h3 className="font-oswald text-lg font-semibold mb-3">LYS Methodology</h3>
                          <div className="grid gap-3">
                            <div className="flex items-start gap-3">
                              <Heart className="h-5 w-5 text-lys-yellow flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-oswald font-semibold text-lys-yellow">BE</span>
                                <span className="text-muted-foreground ml-2 font-roboto text-sm">
                                  {generatedLesson.lysMethodology.be.focus} - {generatedLesson.lysMethodology.be.description}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Compass className="h-5 w-5 text-lys-red flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-oswald font-semibold text-lys-red">KNOW</span>
                                <span className="text-muted-foreground ml-2 font-roboto text-sm">
                                  {generatedLesson.lysMethodology.know.focus} - {generatedLesson.lysMethodology.know.description}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Target className="h-5 w-5 text-lys-teal flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-oswald font-semibold text-lys-teal">DO</span>
                                <span className="text-muted-foreground ml-2 font-roboto text-sm">
                                  {generatedLesson.lysMethodology.do.focus} - {generatedLesson.lysMethodology.do.description}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-5 w-5 text-lys-red" />
                          Learning Objectives
                        </h3>
                        <ul className="space-y-2">
                          {generatedLesson.objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2 font-roboto text-sm">
                              <span className="w-5 h-5 rounded-full bg-lys-red/10 text-lys-red text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      {generatedLesson.synchronousInstruction && (
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                            <Play className="h-5 w-5 text-lys-teal" />
                            Instructional Input
                          </h3>
                          <div className="space-y-4">
                            <div className="p-4 rounded-md bg-muted/30">
                              <h4 className="font-oswald font-semibold text-sm mb-2">Anticipatory Set (Introduction)</h4>
                              <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.anticipatorySet}</p>
                            </div>
                            <div className="p-4 rounded-md bg-muted/30">
                              <h4 className="font-oswald font-semibold text-sm mb-2">Modeling (I Do)</h4>
                              <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.modeling}</p>
                            </div>
                            <div className="p-4 rounded-md bg-muted/30">
                              <h4 className="font-oswald font-semibold text-sm mb-2">Guided Practice (We Do)</h4>
                              <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.guidedPractice}</p>
                            </div>
                            <div className="p-4 rounded-md bg-muted/30">
                              <h4 className="font-oswald font-semibold text-sm mb-2">Independent Practice</h4>
                              <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.synchronousInstruction.independentPractice}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3">Materials & Resources</h3>
                          <ul className="space-y-1">
                            {generatedLesson.materials.map((material, i) => (
                              <li key={i} className="flex items-center gap-2 font-roboto text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-lys-yellow"></div>
                                {material}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3">Assessment</h3>
                          <p className="font-roboto text-sm text-muted-foreground">{generatedLesson.assessment}</p>
                        </div>
                      </div>

                      {generatedLesson.lessonClose && (
                        <>
                          <Separator />
                          <div className="p-4 rounded-md bg-lys-yellow/10 border border-lys-yellow/20">
                            <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                              <UserCheck className="h-5 w-5 text-lys-yellow" />
                              Lesson Close - Life Application
                            </h3>
                            <div className="space-y-3 font-roboto text-sm">
                              {generatedLesson.lessonClose.educational && (
                                <div>
                                  <span className="font-semibold">Educational:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.educational}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.social && (
                                <div>
                                  <span className="font-semibold">Social:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.social}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.vocational && (
                                <div>
                                  <span className="font-semibold">Vocational:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.vocational}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.financial && (
                                <div>
                                  <span className="font-semibold">Financial:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.financial}</span>
                                </div>
                              )}
                              {generatedLesson.lessonClose.spiritual && (
                                <div>
                                  <span className="font-semibold">Spiritual:</span>
                                  <span className="text-muted-foreground ml-2">{generatedLesson.lessonClose.spiritual}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-oswald text-lg text-muted-foreground">Your first amazing lesson is just a click away</h3>
                    <p className="text-sm text-muted-foreground/70 font-roboto mt-2 max-w-sm">
                      Fill in the details on the left and click "Generate Lesson Plan" to create a standards-aligned LYS lesson
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
