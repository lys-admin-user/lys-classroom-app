import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, MapPin, BookOpen, School, Loader2, Check, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { educationalStandards, getStates as getStandardsStates, getSubjects, getStandardCodes, getStandardsName, type StandardCode } from "@shared/standards";
import type { EducatorProfile } from "@shared/schema";
import allCountries from "country-region-data/data.json";

const allGradeLevels = [
  "Elementary (K-2)",
  "Elementary (3-5)",
  "Middle School (6-8)",
  "High School (9-10)",
  "High School (11-12)",
];

const allSubjects = [
  "English Language Arts & Reading",
  "Mathematics",
  "Science",
  "Social Studies",
  "Career & Technical Education",
  "Fine Arts",
  "Physical Education",
  "World Languages",
];

interface EducatorProfileFormProps {
  onComplete?: () => void;
  isOnboarding?: boolean;
  existingProfile?: EducatorProfile | null;
}

export default function EducatorProfileForm({ onComplete, isOnboarding = false, existingProfile }: EducatorProfileFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  const [educatorType, setEducatorType] = useState<string>(existingProfile?.educatorType || "");
  const [selectedCountry, setSelectedCountry] = useState(existingProfile?.country || "");
  const [selectedState, setSelectedState] = useState(existingProfile?.state || "");
  const [schoolDistrict, setSchoolDistrict] = useState(existingProfile?.schoolDistrict || "");
  const [schoolName, setSchoolName] = useState(existingProfile?.schoolName || "");
  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>(existingProfile?.gradeLevels as string[] || []);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(existingProfile?.subjects as string[] || []);
  const [selectedStandardCodes, setSelectedStandardCodes] = useState<{ code: string; description: string }[]>(
    existingProfile?.preferredStandardCodes as { code: string; description: string }[] || []
  );
  const [standardsSubject, setStandardsSubject] = useState(existingProfile?.preferredSubject || "");

  // Use comprehensive country list from country-region-data
  const countries = useMemo(() => 
    allCountries.map(c => ({ name: c.countryName, code: c.countryShortCode })).sort((a, b) => a.name.localeCompare(b.name)), 
    []
  );
  
  // Get regions for selected country
  const regions = useMemo(() => {
    if (!selectedCountry) return [];
    const countryData = allCountries.find(c => c.countryName === selectedCountry || c.countryShortCode === selectedCountry);
    return countryData?.regions?.map(r => ({ name: r.name, code: r.shortCode || r.name })) || [];
  }, [selectedCountry]);
  
  // Check if this country has educational standards defined
  const hasStandardsSupport = useMemo(() => 
    educationalStandards.some(c => c.country === selectedCountry), 
    [selectedCountry]
  );
  
  // Get standards-specific states if available
  const standardsStates = useMemo(() => 
    hasStandardsSupport ? getStandardsStates(selectedCountry) : [], 
    [selectedCountry, hasStandardsSupport]
  );
  
  const standardsName = useMemo(() => 
    hasStandardsSupport && selectedState ? getStandardsName(selectedCountry, selectedState) : "", 
    [selectedCountry, selectedState, hasStandardsSupport]
  );
  const availableStandardCodes = useMemo(() => 
    selectedCountry && selectedState && standardsSubject ? getStandardCodes(selectedCountry, selectedState, standardsSubject) : [], 
    [selectedCountry, selectedState, standardsSubject]
  );

  useEffect(() => {
    if (existingProfile) {
      setEducatorType(existingProfile.educatorType || "");
      setSelectedCountry(existingProfile.country || "");
      setSelectedState(existingProfile.state || "");
      setSchoolDistrict(existingProfile.schoolDistrict || "");
      setSchoolName(existingProfile.schoolName || "");
      setSelectedGradeLevels(existingProfile.gradeLevels as string[] || []);
      setSelectedSubjects(existingProfile.subjects as string[] || []);
      setSelectedStandardCodes(existingProfile.preferredStandardCodes as { code: string; description: string }[] || []);
      if (existingProfile.preferredSubject) setStandardsSubject(existingProfile.preferredSubject);
    }
  }, [existingProfile]);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedState("");
    setStandardsSubject("");
    setSelectedStandardCodes([]);
  };

  const handleStateChange = (stateAbbr: string) => {
    setSelectedState(stateAbbr);
    setStandardsSubject("");
    setSelectedStandardCodes([]);
  };

  const toggleGradeLevel = (grade: string) => {
    setSelectedGradeLevels(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stateData = hasStandardsSupport ? standardsStates.find((s: { abbreviation: string; standardsName: string }) => s.abbreviation === selectedState) : null;
      const response = await apiRequest("PATCH", "/api/educator-profile", {
        educatorType: educatorType || undefined,
        country: selectedCountry,
        state: selectedState,
        standardsName: stateData?.standardsName || standardsName || null,
        schoolDistrict,
        schoolName,
        gradeLevels: selectedGradeLevels,
        subjects: selectedSubjects,
        preferredSubject: standardsSubject || undefined,
        preferredStandardCodes: selectedStandardCodes,
      });
      return await response.json() as EducatorProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/educator-profile"] });
      toast({
        title: "Profile Saved!",
        description: "Your preferences have been saved.",
      });
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedCountry || !selectedState) {
      toast({
        title: "Missing Information",
        description: "Please select your country and state.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const canProceedStep1 = selectedCountry && selectedState;
  const canProceedStep2 = selectedGradeLevels.length > 0 && selectedSubjects.length > 0;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-medium">I am a...</Label>
        <Select value={educatorType} onValueChange={setEducatorType}>
          <SelectTrigger data-testid="select-educator-type">
            <SelectValue placeholder="Select your educator type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="homeschooling_parent">Homeschooling Parent</SelectItem>
            <SelectItem value="micro_school">Micro School</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-base font-medium">Country</Label>
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger data-testid="select-country">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-80">
              {countries.map(country => (
                <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>

      {selectedCountry && (
        <div className="space-y-2">
          <Label className="text-base font-medium">State / Province / Region</Label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger data-testid="select-state">
              <SelectValue placeholder="Select your state or region" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-80">
                {regions.map((region: { name: string; code: string }) => {
                  const standardsMatch = hasStandardsSupport 
                    ? standardsStates.find((s: { abbreviation: string; state: string; standardsName: string }) => s.abbreviation === region.code || s.state === region.name)
                    : null;
                  return (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}{standardsMatch ? ` (${standardsMatch.standardsName})` : ''}
                    </SelectItem>
                  );
                })}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedState && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">School District / Charter Network (Optional)</Label>
              <Input 
                value={schoolDistrict} 
                onChange={(e) => setSchoolDistrict(e.target.value)}
                placeholder="e.g., Houston ISD, KIPP Texas, or Green Dot Public Schools"
                data-testid="input-school-district"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">School Name (Optional)</Label>
              <Input 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g., Lincoln High School"
                data-testid="input-school-name"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">Grade Levels You Teach</Label>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-1 gap-2">
          {allGradeLevels.map(grade => (
            <div 
              key={grade}
              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                selectedGradeLevels.includes(grade) ? "bg-primary/10 border border-primary" : "border border-border hover-elevate"
              }`}
              onClick={() => toggleGradeLevel(grade)}
              data-testid={`grade-${grade.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              <Checkbox 
                checked={selectedGradeLevels.includes(grade)}
                onCheckedChange={() => toggleGradeLevel(grade)}
              />
              <span className="text-sm font-medium">{grade}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-base font-medium">Subjects You Teach</Label>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-1 gap-2">
          {allSubjects.map(subject => (
            <div 
              key={subject}
              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                selectedSubjects.includes(subject) ? "bg-primary/10 border border-primary" : "border border-border hover-elevate"
              }`}
              onClick={() => toggleSubject(subject)}
              data-testid={`subject-${subject.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              <Checkbox 
                checked={selectedSubjects.includes(subject)}
                onCheckedChange={() => toggleSubject(subject)}
              />
              <span className="text-sm font-medium">{subject}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {hasStandardsSupport ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{standardsName || 'Educational Standards'}</Badge>
              <span className="text-sm text-muted-foreground">Standards</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Select your frequently used standard codes. These will be pre-selected when creating lessons.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Select Subject to Browse Standards</Label>
            <Select value={standardsSubject} onValueChange={setStandardsSubject}>
              <SelectTrigger data-testid="select-standards-subject">
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {getSubjects(selectedCountry, selectedState).map(subjectData => (
                  <SelectItem key={subjectData.subject} value={subjectData.subject}>{subjectData.subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {standardsSubject && (
            <div className="space-y-2">
              <Label>Available Standard Codes</Label>
              <ScrollArea className="h-64 border rounded-md p-2">
                <div className="space-y-1">
                  {availableStandardCodes.map(code => {
                    const isSelected = selectedStandardCodes.some(c => c.code === code.code);
                    return (
                      <div
                        key={code.code}
                        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover-elevate"
                        }`}
                        onClick={() => toggleStandardCode(code)}
                        data-testid={`standard-${code.code}`}
                      >
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleStandardCode(code)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-sm font-medium">{code.code}</span>
                          <p className="text-xs text-muted-foreground line-clamp-2">{code.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {selectedStandardCodes.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Standards ({selectedStandardCodes.length})</Label>
              <div className="flex flex-wrap gap-1">
                {selectedStandardCodes.map(code => (
                  <Badge 
                    key={code.code} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => toggleStandardCode(code)}
                    data-testid={`selected-standard-${code.code}`}
                  >
                    {code.code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Educational Standards Coming Soon</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We're working on adding educational standards for {selectedCountry}. 
              In the meantime, you can still use LYS to create great lessons!
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const totalSteps = 3;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>
              {isOnboarding ? "Set Up Your Educator Profile" : "Educator Profile Settings"}
            </CardTitle>
            <CardDescription>
              {isOnboarding 
                ? "Let's personalize your experience so you can create lessons faster."
                : "Update your teaching preferences and standards."
              }
            </CardDescription>
          </div>
        </div>
        {isOnboarding && (
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div 
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Step 1: Location & School</span>
            </div>
            {renderStep1()}
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>Step 2: Grades & Subjects</span>
            </div>
            {renderStep2()}
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <School className="w-4 h-4" />
              <span>Step 3: Preferred Standards (Optional)</span>
            </div>
            {renderStep3()}
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between gap-4">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} data-testid="button-previous">
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button 
              onClick={() => setStep(s => s + 1)} 
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              data-testid="button-next"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              data-testid="button-save-profile"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isOnboarding ? "Complete Setup" : "Save Changes"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
