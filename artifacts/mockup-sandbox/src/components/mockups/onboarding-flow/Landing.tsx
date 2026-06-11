import "./_group.css";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BookOpen, GraduationCap } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[hsl(7,84%,54%)] rounded-lg flex items-center justify-center transform -rotate-6">
            <span className="text-white font-marker text-xl">L</span>
          </div>
          <span className="font-marker text-2xl text-slate-800">LYS</span>
        </div>
        <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          Sign in
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full mb-20">
        <h1 className="font-oswald text-6xl md:text-7xl font-semibold text-slate-900 tracking-tight leading-tight mb-6">
          AI lesson plans & assignments, <br />
          <span className="text-[hsl(7,84%,54%)] relative">
            built for real teachers
            <svg className="absolute w-full h-4 -bottom-1 left-0 text-[hsl(45,93%,62%)]" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-10 max-w-2xl font-roboto">
          Stop spending your weekends planning. Generate rigorous, standards-aligned materials in seconds, not hours.
        </p>

        <Button 
          className="bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white text-lg h-14 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          Generate a free lesson
        </Button>

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[hsl(186,98%,23%)]" />
            <span>Used by 50,000+ educators</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[hsl(186,98%,23%)]" />
            <span>FERPA-safe</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[hsl(186,98%,23%)]" />
            <span>No credit card required</span>
          </div>
        </div>
      </main>
    </div>
  );
}
