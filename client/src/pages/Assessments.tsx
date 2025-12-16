import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Heart, Brain, Star, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: { value: string; label: string; trait?: string }[];
}

interface Assessment {
  id: string;
  type: "personality" | "values" | "strengths";
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  questions: Question[];
}

const assessments: Assessment[] = [
  {
    id: "personality",
    type: "personality",
    title: "Personality Discovery",
    description: "Understand your unique personality traits and how they shape your path to success.",
    icon: Brain,
    color: "text-lys-yellow",
    bgColor: "bg-lys-yellow/10",
    questions: [
      {
        id: "p1",
        text: "When facing a new challenge, I typically...",
        options: [
          { value: "a", label: "Jump right in and figure it out as I go", trait: "adventurous" },
          { value: "b", label: "Research and plan before taking action", trait: "analytical" },
          { value: "c", label: "Seek advice from others who have experience", trait: "collaborative" },
          { value: "d", label: "Trust my gut instincts", trait: "intuitive" },
        ],
      },
      {
        id: "p2",
        text: "In a group project, I naturally tend to...",
        options: [
          { value: "a", label: "Take charge and organize the team", trait: "leader" },
          { value: "b", label: "Generate creative ideas and solutions", trait: "creative" },
          { value: "c", label: "Make sure everyone feels included and heard", trait: "empathetic" },
          { value: "d", label: "Focus on the details and quality of work", trait: "detail-oriented" },
        ],
      },
      {
        id: "p3",
        text: "When I have free time, I prefer to...",
        options: [
          { value: "a", label: "Spend time with friends and family", trait: "social" },
          { value: "b", label: "Engage in creative hobbies or projects", trait: "creative" },
          { value: "c", label: "Read, learn, or explore new topics", trait: "curious" },
          { value: "d", label: "Relax and recharge alone", trait: "introspective" },
        ],
      },
      {
        id: "p4",
        text: "My friends would describe me as...",
        options: [
          { value: "a", label: "The reliable one who always follows through", trait: "dependable" },
          { value: "b", label: "The energetic one who brings excitement", trait: "enthusiastic" },
          { value: "c", label: "The thoughtful one who gives great advice", trait: "wise" },
          { value: "d", label: "The creative one with unique perspectives", trait: "innovative" },
        ],
      },
      {
        id: "p5",
        text: "When making important decisions, I value...",
        options: [
          { value: "a", label: "Logic and facts above all else", trait: "logical" },
          { value: "b", label: "How my choice will affect others", trait: "compassionate" },
          { value: "c", label: "Staying true to my personal values", trait: "principled" },
          { value: "d", label: "Keeping my options open for the future", trait: "adaptable" },
        ],
      },
    ],
  },
  {
    id: "values",
    type: "values",
    title: "Core Values Explorer",
    description: "Discover what matters most to you and align your goals with your deepest values.",
    icon: Heart,
    color: "text-lys-red",
    bgColor: "bg-lys-red/10",
    questions: [
      {
        id: "v1",
        text: "What motivates you most in life?",
        options: [
          { value: "a", label: "Making a positive impact on others", trait: "service" },
          { value: "b", label: "Achieving personal excellence", trait: "achievement" },
          { value: "c", label: "Building meaningful relationships", trait: "connection" },
          { value: "d", label: "Gaining knowledge and understanding", trait: "wisdom" },
        ],
      },
      {
        id: "v2",
        text: "In your ideal future career, what's most important?",
        options: [
          { value: "a", label: "Financial security and stability", trait: "security" },
          { value: "b", label: "Creative freedom and self-expression", trait: "creativity" },
          { value: "c", label: "Helping and inspiring others", trait: "service" },
          { value: "d", label: "Leadership and influence", trait: "leadership" },
        ],
      },
      {
        id: "v3",
        text: "What type of environment helps you thrive?",
        options: [
          { value: "a", label: "Fast-paced and competitive", trait: "ambition" },
          { value: "b", label: "Collaborative and supportive", trait: "harmony" },
          { value: "c", label: "Independent and flexible", trait: "freedom" },
          { value: "d", label: "Structured and organized", trait: "order" },
        ],
      },
      {
        id: "v4",
        text: "How do you define success?",
        options: [
          { value: "a", label: "Achieving my goals and dreams", trait: "achievement" },
          { value: "b", label: "Being happy and at peace", trait: "happiness" },
          { value: "c", label: "Making a difference in the world", trait: "impact" },
          { value: "d", label: "Being respected and admired", trait: "recognition" },
        ],
      },
      {
        id: "v5",
        text: "What would you never compromise on?",
        options: [
          { value: "a", label: "My integrity and honesty", trait: "integrity" },
          { value: "b", label: "My relationships with loved ones", trait: "family" },
          { value: "c", label: "My personal growth and learning", trait: "growth" },
          { value: "d", label: "My independence and freedom", trait: "autonomy" },
        ],
      },
    ],
  },
  {
    id: "strengths",
    type: "strengths",
    title: "Strengths Identifier",
    description: "Uncover your natural talents and learn how to leverage them for success.",
    icon: Star,
    color: "text-lys-teal",
    bgColor: "bg-lys-teal/10",
    questions: [
      {
        id: "s1",
        text: "People often come to me when they need...",
        options: [
          { value: "a", label: "A creative solution to a problem", trait: "creativity" },
          { value: "b", label: "Someone to listen and understand", trait: "empathy" },
          { value: "c", label: "Help organizing or planning something", trait: "organization" },
          { value: "d", label: "Motivation and encouragement", trait: "inspiration" },
        ],
      },
      {
        id: "s2",
        text: "I learn best when I can...",
        options: [
          { value: "a", label: "Read and research on my own", trait: "analytical" },
          { value: "b", label: "Discuss and debate with others", trait: "communication" },
          { value: "c", label: "Get hands-on experience", trait: "practical" },
          { value: "d", label: "Watch demonstrations and examples", trait: "observant" },
        ],
      },
      {
        id: "s3",
        text: "When under pressure, I typically...",
        options: [
          { value: "a", label: "Stay calm and focused on the solution", trait: "composure" },
          { value: "b", label: "Rise to the occasion and perform better", trait: "resilience" },
          { value: "c", label: "Rally the team and seek support", trait: "leadership" },
          { value: "d", label: "Break down the problem into smaller parts", trait: "strategic" },
        ],
      },
      {
        id: "s4",
        text: "I feel most energized when I'm...",
        options: [
          { value: "a", label: "Creating something new and original", trait: "innovation" },
          { value: "b", label: "Helping someone overcome a challenge", trait: "mentoring" },
          { value: "c", label: "Learning a new skill or subject", trait: "curiosity" },
          { value: "d", label: "Achieving a goal I've been working toward", trait: "determination" },
        ],
      },
      {
        id: "s5",
        text: "My greatest asset is my ability to...",
        options: [
          { value: "a", label: "See the big picture and future possibilities", trait: "vision" },
          { value: "b", label: "Connect with people from all backgrounds", trait: "adaptability" },
          { value: "c", label: "Stay persistent until I succeed", trait: "perseverance" },
          { value: "d", label: "Think critically and analyze situations", trait: "analysis" },
        ],
      },
    ],
  },
];

interface AssessmentResult {
  primaryTrait: string;
  secondaryTraits: string[];
  summary: string;
  strengths: string[];
  recommendations: string[];
}

export default function Assessments() {
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const handleStartAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (selectedAssessment && currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (!selectedAssessment) return;

    const traits: string[] = [];
    selectedAssessment.questions.forEach((q) => {
      const answer = answers[q.id];
      const option = q.options.find((o) => o.value === answer);
      if (option?.trait) {
        traits.push(option.trait);
      }
    });

    const traitCounts = traits.reduce((acc, trait) => {
      acc[trait] = (acc[trait] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedTraits = Object.entries(traitCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([trait]) => trait);

    const primaryTrait = sortedTraits[0] || "balanced";
    const secondaryTraits = sortedTraits.slice(1, 3);

    const summaries: Record<string, string> = {
      adventurous: "You're a natural explorer who thrives on new experiences and challenges.",
      analytical: "Your thoughtful, methodical approach helps you solve complex problems with precision.",
      collaborative: "You bring people together and create strong, supportive communities.",
      leader: "You inspire and guide others toward shared goals with confidence and vision.",
      creative: "Your innovative thinking and unique perspective set you apart as a creative force.",
      empathetic: "Your deep understanding of others makes you a trusted friend and ally.",
      curious: "Your thirst for knowledge drives you to constantly learn and grow.",
      service: "Your dedication to helping others creates meaningful impact in your community.",
      achievement: "Your drive for excellence pushes you to reach new heights of success.",
      resilience: "Your ability to bounce back from challenges makes you unstoppable.",
    };

    const strengthsList: Record<string, string[]> = {
      adventurous: ["Risk-taking", "Adaptability", "Enthusiasm", "Open-mindedness"],
      analytical: ["Critical thinking", "Problem-solving", "Attention to detail", "Research skills"],
      collaborative: ["Teamwork", "Communication", "Conflict resolution", "Empathy"],
      leader: ["Decision-making", "Vision", "Motivation", "Strategic thinking"],
      creative: ["Innovation", "Imagination", "Original thinking", "Artistic expression"],
      empathetic: ["Active listening", "Emotional intelligence", "Compassion", "Understanding"],
      curious: ["Learning agility", "Research", "Open-mindedness", "Growth mindset"],
      service: ["Generosity", "Dedication", "Community focus", "Altruism"],
      achievement: ["Goal-setting", "Discipline", "Perseverance", "Excellence"],
      resilience: ["Persistence", "Adaptability", "Optimism", "Stress management"],
    };

    const recommendationsList: Record<string, string[]> = {
      adventurous: ["Explore careers in travel, entrepreneurship, or creative fields", "Seek out leadership roles that allow innovation"],
      analytical: ["Consider careers in science, technology, research, or consulting", "Develop your communication skills to share insights effectively"],
      collaborative: ["Pursue roles in team-based environments, HR, or community organizing", "Your strength in building relationships will serve you in any field"],
      leader: ["Look for opportunities to lead projects and mentor others", "Consider careers in management, politics, or social entrepreneurship"],
      creative: ["Explore careers in design, arts, marketing, or content creation", "Find ways to incorporate creativity into any career path"],
      empathetic: ["Consider careers in counseling, healthcare, social work, or education", "Your emotional intelligence is a rare and valuable skill"],
      curious: ["Pursue lifelong learning through courses, books, and experiences", "Consider careers in research, education, or innovation"],
      service: ["Explore non-profit work, healthcare, teaching, or public service", "Your dedication to others will create lasting impact"],
      achievement: ["Set ambitious goals and create systems to achieve them", "Consider competitive fields like business, athletics, or performance"],
      resilience: ["Your ability to overcome challenges makes you suited for high-pressure roles", "Mentor others on building mental toughness"],
    };

    setResult({
      primaryTrait,
      secondaryTraits,
      summary: summaries[primaryTrait] || "You have a unique blend of traits that make you special.",
      strengths: strengthsList[primaryTrait] || ["Adaptability", "Creativity", "Determination"],
      recommendations: recommendationsList[primaryTrait] || ["Explore diverse career paths", "Build on your natural strengths"],
    });
  };

  const handleBackToList = () => {
    setSelectedAssessment(null);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  if (result && selectedAssessment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="font-marker text-3xl">Your Results Are In!</CardTitle>
              <CardDescription className="font-roboto">
                {selectedAssessment.title} - Completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 rounded-lg bg-gradient-to-br from-lys-yellow/20 to-lys-red/20">
                <Badge className="mb-3 bg-lys-red text-white font-oswald">Primary Trait</Badge>
                <h2 className="font-marker text-4xl capitalize mb-2">{result.primaryTrait}</h2>
                <p className="font-roboto text-muted-foreground">{result.summary}</p>
              </div>

              {result.secondaryTraits.length > 0 && (
                <div>
                  <h3 className="font-oswald text-lg font-semibold mb-3">Supporting Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.secondaryTraits.map((trait) => (
                      <Badge key={trait} variant="secondary" className="capitalize font-roboto">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-lys-yellow" />
                  Your Strengths
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {result.strengths.map((strength, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-lys-yellow/10">
                      <Sparkles className="h-4 w-4 text-lys-yellow" />
                      <span className="font-roboto text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-oswald text-lg font-semibold mb-3">Recommendations for Your Journey</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 font-roboto text-sm text-muted-foreground">
                      <ArrowRight className="h-4 w-4 text-lys-teal flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button onClick={handleBackToList} variant="outline" className="flex-1 font-oswald" data-testid="button-back-assessments">
                  Take Another Assessment
                </Button>
                <Button className="flex-1 bg-lys-teal hover:bg-lys-teal/90 text-white font-oswald" data-testid="button-explore-careers">
                  Explore Matching Careers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedAssessment) {
    const question = selectedAssessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;
    const isLastQuestion = currentQuestion === selectedAssessment.questions.length - 1;
    const currentAnswer = answers[question.id];

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <Button variant="ghost" onClick={handleBackToList} className="gap-2 mb-4 font-roboto" data-testid="button-exit-assessment">
              <ArrowLeft className="h-4 w-4" />
              Exit Assessment
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-md ${selectedAssessment.bgColor} flex items-center justify-center`}>
                <selectedAssessment.icon className={`h-5 w-5 ${selectedAssessment.color}`} />
              </div>
              <div>
                <h1 className="font-oswald text-xl font-semibold">{selectedAssessment.title}</h1>
                <p className="text-sm text-muted-foreground font-roboto">
                  Question {currentQuestion + 1} of {selectedAssessment.questions.length}
                </p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-marker text-2xl">{question.text}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={currentAnswer || ""}
                onValueChange={(value) => handleAnswer(question.id, value)}
                className="space-y-3"
              >
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={option.value}
                      id={`${question.id}-${option.value}`}
                      data-testid={`radio-${question.id}-${option.value}`}
                    />
                    <Label
                      htmlFor={`${question.id}-${option.value}`}
                      className="flex-1 cursor-pointer font-roboto p-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex justify-between mt-8 gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="gap-2 font-oswald"
                  data-testid="button-previous-question"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                {isLastQuestion ? (
                  <Button
                    onClick={handleComplete}
                    disabled={!currentAnswer}
                    className="gap-2 bg-lys-red hover:bg-lys-red/90 text-white font-oswald"
                    data-testid="button-complete-assessment"
                  >
                    Complete Assessment
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!currentAnswer}
                    className="gap-2 font-oswald"
                    data-testid="button-next-question"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
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
            <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-lys-yellow" />
            </div>
            <div>
              <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
                BE: Identity Assessments
              </h1>
              <p className="font-roboto text-muted-foreground">
                Discover who you are and what makes you unique
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover-elevate">
              <CardHeader>
                <div className={`w-14 h-14 rounded-md ${assessment.bgColor} flex items-center justify-center mb-4`}>
                  <assessment.icon className={`h-7 w-7 ${assessment.color}`} />
                </div>
                <CardTitle className="font-oswald text-xl">{assessment.title}</CardTitle>
                <CardDescription className="font-roboto">
                  {assessment.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="font-roboto">
                    {assessment.questions.length} questions
                  </Badge>
                  <span className="text-sm text-muted-foreground font-roboto">~5 min</span>
                </div>
                <Button
                  onClick={() => handleStartAssessment(assessment)}
                  className="w-full font-oswald gap-2"
                  data-testid={`button-start-${assessment.id}`}
                >
                  Start Assessment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg bg-gradient-to-r from-lys-yellow/10 to-lys-red/10 border border-lys-yellow/20">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-oswald text-xl font-semibold mb-2">Why Knowing Yourself Matters</h2>
              <p className="font-roboto text-muted-foreground text-sm">
                Before you can truly succeed, you need to understand who you are. These assessments help you 
                discover your unique strengths, values, and personality traits — the foundation of your journey.
              </p>
            </div>
            <Badge className="bg-lys-yellow/20 text-lys-yellow font-oswald text-lg px-4 py-2">
              BE Phase
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
