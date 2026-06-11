import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BookOpen, GraduationCap, CheckCircle2, Zap, Clock, Loader2, Sparkles, Wand2 } from "lucide-react";
import "./_group.css";

const TOPICS = [
  { id: "civil-war", label: "Causes of Civil War", grade: "8th Grade History" },
  { id: "photosynthesis", label: "Photosynthesis", grade: "6th Grade Science" },
  { id: "fractions", label: "Adding Fractions", grade: "5th Grade Math" },
];

const LESSONS = {
  "civil-war": {
    objective: "Students will be able to analyze and articulate the primary economic and political differences between the North and South that led to the American Civil War.",
    materials: ["Primary source excerpts (Lincoln, Davis)", "Blank Venn Diagram handouts", "Interactive timeline cards"],
    steps: [
      { time: "10 min", title: "Hook: The Divide", desc: "Display two contrasting images (factory vs. plantation) and ask students to list differences." },
      { time: "20 min", title: "Jigsaw Reading", desc: "Divide class into 'North' and 'South' expert groups to read and analyze their specific economic policies." },
      { time: "15 min", title: "Debate & Discuss", desc: "Bring groups together to negotiate a mock compromise. Highlight why compromises failed." },
    ]
  },
  "photosynthesis": {
    objective: "Students will be able to model the process of photosynthesis, identifying the reactants (water, carbon dioxide, light) and products (glucose, oxygen).",
    materials: ["Small potted plants", "Black construction paper & paper clips", "Diagram worksheets"],
    steps: [
      { time: "5 min", title: "Warm-up", desc: "Ask: 'How do plants eat without mouths?' Discuss student theories." },
      { time: "25 min", title: "Light Block Experiment", desc: "Examine plants that had leaves covered with black paper for 48 hours. Compare to exposed leaves." },
      { time: "15 min", title: "Diagramming the Formula", desc: "Work in pairs to label the chemical equation using physical manipulatives." },
    ]
  },
  "fractions": {
    objective: "Students will be able to add fractions with unlike denominators by finding a common denominator.",
    materials: ["Fraction fraction tiles/bars", "Mini whiteboards", "Word problem task cards"],
    steps: [
      { time: "10 min", title: "Review", desc: "Quick review of finding least common multiples (LCM) using mini whiteboards." },
      { time: "20 min", title: "Manipulative Discovery", desc: "Use fraction tiles to physically see why 1/2 + 1/3 does NOT equal 2/5." },
      { time: "15 min", title: "Practice & Apply", desc: "Independent practice with real-world baking recipes requiring fraction addition." },
    ]
  }
};

export function LiveDemo() {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeLesson = LESSONS[activeTopic as keyof typeof LESSONS];

  const handleTopicChange = (id: string) => {
    if (id === activeTopic) return;
    setActiveTopic(id);
    setIsGenerating(true);
    setProgress(0);
  };

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsGenerating(false), 200);
            return 100;
          }
          return prev + 15;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 lg:px-10 lg:py-6 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[hsl(7,84%,54%)] rounded-xl flex items-center justify-center transform -rotate-6 shadow-sm">
            <span className="text-white font-marker text-xl">L</span>
          </div>
          <span className="font-marker text-2xl text-slate-800 tracking-tight">LYS</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Sign in
          </a>
          <Button variant="outline" className="hidden sm:flex border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full px-6">
            Get Started
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full">
        {/* Left Column: Value Prop & CTA */}
        <div className="flex-1 px-6 py-12 lg:px-16 lg:py-24 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(45,93%,62%)]/10 text-[hsl(45,93%,45%)] font-medium text-sm mb-8 w-fit border border-[hsl(45,93%,62%)]/20">
            <Sparkles className="w-4 h-4" />
            <span>Try it right now, no account needed</span>
          </div>
          
          <h1 className="font-oswald text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Generate a perfect lesson plan in <span className="text-[hsl(7,84%,54%)]">seconds</span>.
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
            See the magic yourself. Pick a topic on the right and watch our AI instantly build a rigorous, classroom-ready lesson plan. 
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button 
              className="bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white text-lg h-14 px-8 rounded-full shadow-lg shadow-[hsl(7,84%,54%)]/20 hover:shadow-xl hover:shadow-[hsl(7,84%,54%)]/30 hover:-translate-y-0.5 transition-all w-fit"
            >
              Generate your own free lesson
            </Button>
            <p className="text-sm text-slate-500 flex items-center px-4">
              5 free generations per month.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm font-medium text-slate-600 bg-white/60 p-4 rounded-2xl border border-slate-200/60 shadow-sm w-fit">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(186,98%,23%)]/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-[hsl(186,98%,23%)]" />
              </div>
              <span>FERPA-safe</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(186,98%,23%)]/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-[hsl(186,98%,23%)]" />
              </div>
              <span>No credit card</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(186,98%,23%)]/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-[hsl(186,98%,23%)]" />
              </div>
              <span>50k+ Educators</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Demo */}
        <div className="flex-[1.2] p-6 lg:p-12 lg:pl-0 flex flex-col justify-center relative">
          {/* Decorative background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[hsl(45,93%,62%)]/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 relative z-10">
            {/* Topic Chips */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2 px-2">
                <Wand2 className="w-4 h-4 text-[hsl(7,84%,54%)]" />
                Click a topic to see it rebuild:
              </div>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicChange(topic.id)}
                    className={`
                      px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border text-left
                      ${activeTopic === topic.id 
                        ? "bg-white border-[hsl(7,84%,54%)] text-[hsl(7,84%,54%)] shadow-sm scale-105 transform origin-left" 
                        : "bg-white/50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:text-slate-900"}
                    `}
                  >
                    <div className="block font-bold mb-0.5">{topic.label}</div>
                    <div className="text-xs opacity-80 font-normal">{topic.grade}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Preview Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 min-h-[500px]">
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[hsl(7,84%,54%)]" />
                  <span className="font-oswald font-medium text-lg text-slate-800">
                    Lesson Plan Preview
                  </span>
                </div>
                {!isGenerating && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Generated in 4.2s
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 lg:p-8 flex-1 relative bg-white">
                {isGenerating ? (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 relative mb-6">
                      <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                      <div 
                        className="absolute inset-0 border-4 border-[hsl(7,84%,54%)] rounded-full border-t-transparent animate-spin"
                        style={{ animationDuration: '1s' }}
                      />
                    </div>
                    <div className="text-lg font-medium text-slate-800 mb-2 font-oswald">AI is thinking...</div>
                    <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[hsl(45,93%,62%)] transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-4 text-sm text-slate-500 font-medium">
                      {progress < 30 ? "Analyzing standards..." : progress < 70 ? "Drafting activities..." : "Finalizing materials..."}
                    </div>
                  </div>
                ) : null}

                <div className={`transition-opacity duration-300 ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="mb-8">
                    <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-2">Objective</h3>
                    <p className="text-slate-800 text-lg leading-relaxed">
                      {activeLesson.objective}
                    </p>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3">Required Materials</h3>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {activeLesson.materials.map((mat, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(45,93%,62%)] shrink-0" />
                          <span className="text-sm">{mat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">Activity Steps</h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {activeLesson.steps.map((step, i) => (
                        <div key={i} className="relative flex items-start gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border-2 border-slate-200 text-slate-500 text-xs font-bold shrink-0 z-10 relative">
                            {i + 1}
                          </div>
                          <div className="pt-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-oswald font-medium text-slate-900">{step.title}</h4>
                              <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                {step.time}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
