import React, { useState } from "react";
import "./_group.css";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Sparkles, Send, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolFirst() {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6th");

  const grades = ["3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
  const suggestions = [
    { grade: "3rd", topic: "Introduction to Fractions" },
    { grade: "7th", topic: "Causes of the American Revolution" },
    { grade: "9th", topic: "Cellular Respiration & Photosynthesis" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto text-slate-900 selection:bg-[hsl(45,93%,62%)] selection:text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[hsl(7,84%,54%)] rounded-lg flex items-center justify-center transform -rotate-6 shadow-sm">
            <span className="text-white font-marker text-xl">L</span>
          </div>
          <span className="font-marker text-2xl text-slate-800 tracking-wide">LYS</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Sign in
          </a>
        </div>
      </header>

      {/* Main Content - The Tool */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto pb-24">
        
        <div className="text-center mb-8">
          <h1 className="font-oswald text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-slate-900">
            What are we teaching today?
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Tell our AI what you need. Get a complete, rigorous lesson plan in 15 seconds.
          </p>
        </div>

        {/* Generator Card */}
        <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100/50 flex flex-col gap-6 relative overflow-hidden">
          {/* Decorative subtle background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(45,93%,62%)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(186,98%,23%)] opacity-5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          {/* Grade Selector */}
          <div className="flex flex-col gap-3 relative z-10">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider font-oswald flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[hsl(186,98%,23%)]" />
              1. Select Grade Level
            </label>
            <div className="flex flex-wrap gap-2">
              {grades.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                    grade === g 
                      ? "bg-[hsl(186,98%,23%)] text-white border-[hsl(186,98%,23%)] shadow-md" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  {g} Grade
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div className="flex flex-col gap-3 relative z-10">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider font-oswald flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[hsl(45,93%,62%)]" />
              2. Describe the Topic
            </label>
            <div className="relative group">
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The water cycle, focusing on evaporation and condensation..."
                className="w-full min-h-[120px] bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[hsl(7,84%,54%)] focus:bg-white transition-colors resize-none text-lg leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* Generate Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 relative z-10">
            <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              5 free generations left this month
            </div>
            
            <Button 
              className={cn(
                "w-full sm:w-auto h-14 px-8 rounded-2xl text-lg font-bold shadow-lg transition-all flex items-center gap-2 group",
                topic.length > 3
                  ? "bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_hsla(7,84%,54%,0.4)]"
                  : "bg-slate-800 text-white hover:bg-slate-900"
              )}
            >
              Generate Free Lesson
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="w-full mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">Or try a one-click example:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setGrade(s.grade);
                  setTopic(s.topic);
                }}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-[hsl(45,93%,62%)] hover:shadow-md transition-all active:scale-95"
              >
                <span className="text-[hsl(186,98%,23%)] bg-[hsl(186,98%,95%)] px-2 py-0.5 rounded text-xs font-bold">{s.grade}</span>
                {s.topic}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Trust Markers */}
      <footer className="w-full py-8 border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 px-6 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[hsl(186,98%,23%)]" />
            <span>FERPA Compliant</span>
          </div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[hsl(186,98%,23%)]" />
            <span>No Credit Card Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}