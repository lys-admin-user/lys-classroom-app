import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Compass, Target, ChevronRight, ChevronLeft, Sparkles, User, RotateCcw, Trophy, BookOpen, GraduationCap, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTier } from "@/hooks/use-tier";
import { AdBanner } from "@/components/AdBanner";
import { apiRequest } from "@/lib/queryClient";

interface Question {
  id: string;
  text: string;
  category: "be" | "know" | "do";
  options: { value: string; label: string; score: number }[];
}

const assessmentQuestions: Question[] = [
  {
    id: "be-1",
    text: "How would you describe your approach to understanding who you are?",
    category: "be",
    options: [
      { value: "a", label: "I often reflect on my values and what matters most to me", score: 3 },
      { value: "b", label: "I think about it sometimes when I face big decisions", score: 2 },
      { value: "c", label: "I focus more on what I need to do than who I am", score: 1 },
    ],
  },
  {
    id: "be-2",
    text: "When facing a challenge, what guides your decisions?",
    category: "be",
    options: [
      { value: "a", label: "My personal values and sense of purpose", score: 3 },
      { value: "b", label: "What others expect of me", score: 1 },
      { value: "c", label: "Whatever seems most practical at the moment", score: 2 },
    ],
  },
  {
    id: "be-3",
    text: "How connected do you feel to your long-term vision for life?",
    category: "be",
    options: [
      { value: "a", label: "I have a clear vision and work toward it daily", score: 3 },
      { value: "b", label: "I have some ideas but they're not very specific", score: 2 },
      { value: "c", label: "I don't really have a long-term vision yet", score: 1 },
    ],
  },
  {
    id: "know-1",
    text: "How do you approach learning new information?",
    category: "know",
    options: [
      { value: "a", label: "I actively seek out knowledge and resources", score: 3 },
      { value: "b", label: "I learn when I need to solve a specific problem", score: 2 },
      { value: "c", label: "I prefer to learn from experience rather than study", score: 1 },
    ],
  },
  {
    id: "know-2",
    text: "How would you rate your understanding of career paths related to your interests?",
    category: "know",
    options: [
      { value: "a", label: "I've researched extensively and know my options well", score: 3 },
      { value: "b", label: "I have a general idea but haven't explored deeply", score: 2 },
      { value: "c", label: "I'm not sure what career paths exist for me", score: 1 },
    ],
  },
  {
    id: "know-3",
    text: "How comfortable are you with managing money and planning financially?",
    category: "know",
    options: [
      { value: "a", label: "I have a budget and understand investing basics", score: 3 },
      { value: "b", label: "I save some money but don't have a clear plan", score: 2 },
      { value: "c", label: "I don't really think about finances much", score: 1 },
    ],
  },
  {
    id: "do-1",
    text: "How do you approach setting and working toward goals?",
    category: "do",
    options: [
      { value: "a", label: "I set clear goals with specific action steps", score: 3 },
      { value: "b", label: "I have goals but sometimes struggle to follow through", score: 2 },
      { value: "c", label: "I prefer to take things as they come", score: 1 },
    ],
  },
  {
    id: "do-2",
    text: "When you start a project, how likely are you to complete it?",
    category: "do",
    options: [
      { value: "a", label: "Very likely - I finish what I start", score: 3 },
      { value: "b", label: "Sometimes - it depends on the project", score: 2 },
      { value: "c", label: "I often start things but have trouble finishing", score: 1 },
    ],
  },
  {
    id: "do-3",
    text: "How do you handle obstacles that get in your way?",
    category: "do",
    options: [
      { value: "a", label: "I find alternative solutions and keep going", score: 3 },
      { value: "b", label: "I might take a break and try again later", score: 2 },
      { value: "c", label: "I often give up when things get too difficult", score: 1 },
    ],
  },
];

interface Results {
  be: number;
  know: number;
  do: number;
  total: number;
  strengths: string[];
  growthAreas: string[];
}

export default function SelfDiscovery() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { showAds } = useTier();
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({});
  const [showResults, setShowResults] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const question = assessmentQuestions[currentQuestion];

  const saveResultsMutation = useMutation({
    mutationFn: async (results: Results) => {
      const response = await apiRequest("POST", "/api/self-discovery/results", {
        beScore: results.be,
        knowScore: results.know,
        doScore: results.do,
        totalScore: results.total,
        strengths: results.strengths,
        growthAreas: results.growthAreas,
        answers,
      });
      return response.json();
    },
    onSuccess: () => {
      setResultsSaved(true);
      toast({
        title: "Results Saved",
        description: "Your assessment results have been saved to your profile.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnswer = (value: string, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { value, score },
    }));
  };

  const goNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const goPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const calculateResults = (): Results => {
    const scores = { be: 0, know: 0, do: 0 };
    const maxScores = { be: 0, know: 0, do: 0 };

    assessmentQuestions.forEach((q) => {
      maxScores[q.category] += 3;
      const answer = answers[q.id];
      if (answer) {
        scores[q.category] += answer.score;
      }
    });

    const bePercent = Math.round((scores.be / maxScores.be) * 100);
    const knowPercent = Math.round((scores.know / maxScores.know) * 100);
    const doPercent = Math.round((scores.do / maxScores.do) * 100);
    const total = Math.round(((scores.be + scores.know + scores.do) / (maxScores.be + maxScores.know + maxScores.do)) * 100);

    const strengths: string[] = [];
    const growthAreas: string[] = [];

    if (bePercent >= 70) strengths.push("Strong sense of identity and purpose");
    else if (bePercent < 50) growthAreas.push("Develop clearer sense of values and purpose");

    if (knowPercent >= 70) strengths.push("Well-informed about resources and strategies");
    else if (knowPercent < 50) growthAreas.push("Expand knowledge of career paths and resources");

    if (doPercent >= 70) strengths.push("Excellent at taking action and following through");
    else if (doPercent < 50) growthAreas.push("Build habits for consistent goal achievement");

    return {
      be: bePercent,
      know: knowPercent,
      do: doPercent,
      total,
      strengths,
      growthAreas,
    };
  };

  const getCategoryInfo = (category: "be" | "know" | "do") => {
    switch (category) {
      case "be":
        return { icon: Heart, color: "text-lys-yellow", bg: "bg-lys-yellow/10", label: "BE", subtitle: "Identity & Purpose" };
      case "know":
        return { icon: Compass, color: "text-lys-red", bg: "bg-lys-red/10", label: "KNOW", subtitle: "Strategy & Resources" };
      case "do":
        return { icon: Target, color: "text-lys-teal", bg: "bg-lys-teal/10", label: "DO", subtitle: "Action & Impact" };
    }
  };

  if (showResults) {
    const results = calculateResults();

    return (
      <div className="min-h-screen bg-background overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-lys-yellow/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-lys-yellow" />
            </div>
            <h1 className="font-marker text-2xl sm:text-3xl md:text-4xl text-foreground mb-2">
              Your Student Be-Know-Do Profile
            </h1>
            <p className="font-roboto text-muted-foreground">
              Here's what we learned about your strengths and growth areas
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary" className="font-oswald gap-1">
                <GraduationCap className="h-3 w-3" />
                Student Assessment
              </Badge>
              <Badge variant="outline" className="font-roboto text-xs gap-1">
                <Info className="h-3 w-3" />
                Your teacher can see your results to help you grow
              </Badge>
            </div>
          </div>

          {showAds && <AdBanner position="inline" className="mb-6" />}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {(["be", "know", "do"] as const).map((category) => {
              const info = getCategoryInfo(category);
              const Icon = info.icon;
              const score = results[category];
              return (
                <Card key={category} className={`${info.bg} border-none`}>
                  <CardContent className="p-6 text-center">
                    <Icon className={`h-8 w-8 ${info.color} mx-auto mb-2`} />
                    <p className="font-oswald text-xl font-bold">{info.label}</p>
                    <p className="text-xs text-muted-foreground mb-3">{info.subtitle}</p>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className={`absolute left-0 top-0 h-full ${category === "be" ? "bg-lys-yellow" : category === "know" ? "bg-lys-red" : "bg-lys-teal"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="font-oswald text-2xl">{score}%</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-oswald text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lys-red" />
                Overall Score: {results.total}%
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.strengths.length > 0 && (
                <div>
                  <p className="font-oswald text-sm mb-2">Your Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {results.strengths.map((s, i) => (
                      <Badge key={i} variant="secondary" className="font-roboto">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {results.growthAreas.length > 0 && (
                <div>
                  <p className="font-oswald text-sm mb-2">Areas for Growth</p>
                  <div className="flex flex-wrap gap-2">
                    {results.growthAreas.map((g, i) => (
                      <Badge key={i} variant="outline" className="font-roboto">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={resetAssessment} className="w-full sm:w-auto gap-2" data-testid="button-retake">
              <RotateCcw className="h-4 w-4" />
              Take Again
            </Button>
            {isAuthenticated && !resultsSaved && (
              <Button 
                variant="outline" 
                onClick={() => saveResultsMutation.mutate(results)}
                disabled={saveResultsMutation.isPending}
                className="w-full sm:w-auto gap-2" 
                data-testid="button-save-results"
              >
                <Sparkles className="h-4 w-4" />
                {saveResultsMutation.isPending ? "Saving..." : "Save Results"}
              </Button>
            )}
            {resultsSaved && (
              <Badge variant="secondary" className="font-roboto py-2 px-4">
                Results Saved
              </Badge>
            )}
            <Button 
              className="w-full sm:w-auto bg-lys-red hover:bg-lys-red/90 text-white gap-2" 
              onClick={() => setLocation("/careers")}
              data-testid="button-explore-careers"
            >
              <BookOpen className="h-4 w-4" />
              Explore Careers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(question.category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lys-yellow/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-lys-yellow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-marker text-xl sm:text-2xl md:text-3xl text-foreground">
                  Student Be-Know-Do Assessment
                </h1>
                <Badge variant="secondary" className="font-oswald hidden sm:flex">For Students</Badge>
              </div>
              <p className="font-roboto text-sm text-muted-foreground">
                Discover who you <span className="font-semibold text-lys-yellow">BE</span>, what you <span className="font-semibold text-lys-red">KNOW</span>, and what you <span className="font-semibold text-lys-teal">DO</span>
              </p>
            </div>
          </div>

          {/* BKD Explainer */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-lys-yellow/10 rounded-lg p-2">
              <Heart className="h-4 w-4 text-lys-yellow mx-auto mb-1" />
              <p className="font-oswald text-xs font-bold text-lys-yellow">BE</p>
              <p className="font-roboto text-xs text-muted-foreground">Identity & Purpose</p>
            </div>
            <div className="bg-lys-red/10 rounded-lg p-2">
              <Compass className="h-4 w-4 text-lys-red mx-auto mb-1" />
              <p className="font-oswald text-xs font-bold text-lys-red">KNOW</p>
              <p className="font-roboto text-xs text-muted-foreground">Knowledge & Resources</p>
            </div>
            <div className="bg-lys-teal/10 rounded-lg p-2">
              <Target className="h-4 w-4 text-lys-teal mx-auto mb-1" />
              <p className="font-oswald text-xs font-bold text-lys-teal">DO</p>
              <p className="font-roboto text-xs text-muted-foreground">Action & Impact</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 font-roboto">
            Question {currentQuestion + 1} of {assessmentQuestions.length}
          </p>
        </div>

        <Card>
          <CardHeader className={`${categoryInfo.bg} border-b`}>
            <div className="flex items-center gap-2">
              <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
              <Badge variant="secondary" className="font-oswald">
                {categoryInfo.label}: {categoryInfo.subtitle}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="font-roboto text-lg mb-6">{question.text}</p>

            <RadioGroup
              value={answers[question.id]?.value || ""}
              onValueChange={(value) => {
                const option = question.options.find((o) => o.value === value);
                if (option) handleAnswer(value, option.score);
              }}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-md border transition-all hover-elevate ${
                    answers[question.id]?.value === option.value
                      ? "border-lys-teal bg-lys-teal/5"
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${question.id}-${option.value}`}
                    data-testid={`radio-${question.id}-${option.value}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.value}`}
                    className="flex-1 cursor-pointer font-roboto"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentQuestion === 0}
            className="gap-2"
            data-testid="button-prev-question"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={goNext}
            disabled={!answers[question.id]}
            className="bg-lys-teal hover:bg-lys-teal/90 text-white gap-2"
            data-testid="button-next-question"
          >
            {currentQuestion === assessmentQuestions.length - 1 ? "See Results" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
