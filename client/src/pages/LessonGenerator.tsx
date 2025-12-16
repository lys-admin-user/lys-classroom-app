import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Clock, Target, BookOpen, Users, Loader2, Copy, Download, Heart, Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { LessonPlan } from "@shared/schema";

const gradeLevels = [
  "Elementary (K-2)",
  "Elementary (3-5)",
  "Middle School (6-8)",
  "High School (9-10)",
  "High School (11-12)",
];

const durations = ["30 minutes", "45 minutes", "60 minutes", "90 minutes"];

export default function LessonGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [bkdFocus, setBkdFocus] = useState<"be" | "know" | "do">("be");
  const [standards, setStandards] = useState("");
  const [duration, setDuration] = useState("45 minutes");
  const [generatedLesson, setGeneratedLesson] = useState<LessonPlan | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/lessons/generate", {
        topic,
        gradeLevel,
        bkdFocus,
        standards,
        duration,
      });
      return await response.json() as LessonPlan;
    },
    onSuccess: (data) => {
      setGeneratedLesson(data);
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

  const handleGenerate = () => {
    if (!topic || !gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in the topic and grade level.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const copyToClipboard = () => {
    if (generatedLesson) {
      const text = `
${generatedLesson.title}
Grade: ${generatedLesson.gradeLevel}
Duration: ${generatedLesson.duration}

Objectives:
${generatedLesson.objectives.map((o) => `- ${o}`).join("\n")}

Activities:
${generatedLesson.activities.map((a) => `- ${a.title}: ${a.description}`).join("\n")}

Materials:
${generatedLesson.materials.map((m) => `- ${m}`).join("\n")}

Assessment:
${generatedLesson.assessment}
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
                Create engaging, standards-aligned lessons in seconds
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-lys-teal/5 border-b">
                <CardTitle className="font-oswald text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-lys-teal" />
                  Tell me what you need...
                </CardTitle>
                <CardDescription className="font-roboto">
                  Fill in the details and let AI do the heavy lifting
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic" className="font-oswald">Topic or Learning Objective</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., Introduction to growth mindset and resilience..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="font-roboto min-h-[100px]"
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

                <div className="space-y-2">
                  <Label className="font-oswald">Be-Know-Do Focus</Label>
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
                    <Label htmlFor="standards" className="font-oswald">Standards (optional)</Label>
                    <Input
                      id="standards"
                      placeholder="e.g., SEL, CCSS"
                      value={standards}
                      onChange={(e) => setStandards(e.target.value)}
                      className="font-roboto"
                      data-testid="input-standards"
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
                      Generate Lesson
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground font-roboto italic">
                  Powered by AI to save you time and spark creativity
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap bg-muted/30 border-b">
                <div>
                  <CardTitle className="font-oswald text-lg">Lesson Preview</CardTitle>
                  <CardDescription className="font-roboto">
                    {generatedLesson ? "Your personalized lesson is ready!" : "Your lesson will appear here"}
                  </CardDescription>
                </div>
                {generatedLesson && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 font-roboto" data-testid="button-copy-lesson">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 font-roboto" data-testid="button-download-lesson">
                      <Download className="h-4 w-4" />
                      Export
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
                  <ScrollArea className="h-[600px]">
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div>
                            <h2 className="font-marker text-2xl text-foreground">{generatedLesson.title}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="secondary" className="font-roboto">
                                <Users className="h-3 w-3 mr-1" />
                                {generatedLesson.gradeLevel}
                              </Badge>
                              <Badge variant="secondary" className="font-roboto">
                                <Clock className="h-3 w-3 mr-1" />
                                {generatedLesson.duration}
                              </Badge>
                              <Badge 
                                className={`font-roboto ${
                                  generatedLesson.bkdFocus === "be" ? "bg-lys-yellow/20 text-lys-yellow" :
                                  generatedLesson.bkdFocus === "know" ? "bg-lys-red/20 text-lys-red" :
                                  "bg-lys-teal/20 text-lys-teal"
                                }`}
                              >
                                {(generatedLesson.bkdFocus || bkdFocus).toUpperCase()} Focus
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

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

                      <div>
                        <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-lys-teal" />
                          Activities
                        </h3>
                        <div className="space-y-4">
                          {generatedLesson.activities.map((activity, i) => (
                            <div key={i} className="p-4 rounded-md bg-muted/30 border-l-4 border-l-lys-teal">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <h4 className="font-oswald font-semibold">{activity.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-roboto">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {activity.duration}
                                  </Badge>
                                  <Badge 
                                    className={`text-xs font-roboto ${
                                      activity.type === "be" ? "bg-lys-yellow/20 text-lys-yellow" :
                                      activity.type === "know" ? "bg-lys-red/20 text-lys-red" :
                                      "bg-lys-teal/20 text-lys-teal"
                                    }`}
                                  >
                                    {(activity.type || "do").toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <p className="font-roboto text-sm text-muted-foreground">{activity.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-oswald text-lg font-semibold mb-3">Materials Needed</h3>
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

                      {generatedLesson.reflection && (
                        <>
                          <Separator />
                          <div className="p-4 rounded-md bg-lys-yellow/10 border border-lys-yellow/20">
                            <h3 className="font-oswald text-lg font-semibold mb-2 text-lys-yellow">Reflection Prompt</h3>
                            <p className="font-roboto text-sm italic">{generatedLesson.reflection}</p>
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
                      Fill in the details on the left and click "Generate Lesson" to see the magic happen
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
