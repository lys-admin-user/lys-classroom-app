import "./_group.css";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BookOpen, Clock, Users, FileText, Quote, CheckCircle2 } from "lucide-react";

export function OutcomeProof() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-roboto text-slate-800 selection:bg-[hsl(45,93%,62%)] selection:text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[hsl(7,84%,54%)] rounded-lg flex items-center justify-center transform -rotate-6 shadow-sm">
            <span className="text-white font-marker text-xl">L</span>
          </div>
          <span className="font-marker text-2xl text-slate-800 tracking-tight">LYS</span>
        </div>
        <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          Sign in
        </a>
      </header>

      <main className="flex-1 flex flex-col w-full">
        {/* Hero Section */}
        <section className="px-4 pt-16 pb-20 text-center max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(45,93%,62%)]/20 text-[hsl(7,84%,45%)] font-medium text-sm mb-8 border border-[hsl(45,93%,62%)]/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Join 50,000+ teachers leaving work at work</span>
          </div>
          
          <h1 className="font-oswald text-6xl md:text-8xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-8">
            Get your <span className="text-[hsl(7,84%,54%)]">weekends</span> back.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto font-roboto leading-relaxed">
            Stop sacrificing your Sundays. LYS generates rigorous, standards-aligned lesson plans and assignments in seconds, not hours.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button 
              className="bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white text-xl h-16 px-10 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-full md:w-auto"
            >
              Generate a free lesson
            </Button>
            
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[hsl(186,98%,23%)]" />
                <span>FERPA-safe</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[hsl(186,98%,23%)]" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Band */}
        <section className="bg-[hsl(186,98%,23%)] text-white py-12 w-full">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="flex flex-col items-center text-center pt-4 md:pt-0">
              <Clock className="w-8 h-8 mb-4 text-[hsl(45,93%,62%)]" />
              <div className="font-oswald text-5xl font-bold mb-2">6 hrs</div>
              <div className="text-white/80 font-medium text-lg">Average time saved per week</div>
            </div>
            <div className="flex flex-col items-center text-center pt-8 md:pt-0">
              <Users className="w-8 h-8 mb-4 text-[hsl(45,93%,62%)]" />
              <div className="font-oswald text-5xl font-bold mb-2">50,000+</div>
              <div className="text-white/80 font-medium text-lg">Educators using LYS</div>
            </div>
            <div className="flex flex-col items-center text-center pt-8 md:pt-0">
              <FileText className="w-8 h-8 mb-4 text-[hsl(45,93%,62%)]" />
              <div className="font-oswald text-5xl font-bold mb-2">1.2M</div>
              <div className="text-white/80 font-medium text-lg">Lessons generated this year</div>
            </div>
          </div>
        </section>

        {/* Social Proof / Testimonials */}
        <section className="py-24 bg-slate-50 w-full">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-oswald text-4xl font-bold text-slate-900 mb-4">Don't just take our word for it</h2>
              <p className="text-lg text-slate-600">Hear from teachers who have reclaimed their planning time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-[hsl(45,93%,62%)]/40" />
                <p className="text-slate-700 text-lg leading-relaxed mb-8 relative z-10">
                  "I used to spend my entire Sunday afternoon planning for the week. With LYS, I get it done before I leave school on Friday. It's completely changed my work-life balance."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[hsl(186,98%,23%)] rounded-full flex items-center justify-center text-white font-oswald text-xl font-medium">SM</div>
                  <div>
                    <div className="font-bold text-slate-900">Sarah M.</div>
                    <div className="text-sm text-slate-500">8th Grade Science</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative md:-translate-y-4">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-[hsl(45,93%,62%)]/40" />
                <p className="text-slate-700 text-lg leading-relaxed mb-8 relative z-10">
                  "The assignments are actually rigorous and perfectly aligned to my state standards. It feels like having a personal teaching assistant who knows exactly what I need."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[hsl(7,84%,54%)] rounded-full flex items-center justify-center text-white font-oswald text-xl font-medium">JT</div>
                  <div>
                    <div className="font-bold text-slate-900">James T.</div>
                    <div className="text-sm text-slate-500">High School History</div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-[hsl(45,93%,62%)]/40" />
                <p className="text-slate-700 text-lg leading-relaxed mb-8 relative z-10">
                  "My students are more engaged, and I have the energy to actually teach instead of just plan. This tool is an absolute lifesaver for early-career teachers."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[hsl(45,93%,62%)] rounded-full flex items-center justify-center text-[hsl(186,98%,23%)] font-oswald text-xl font-medium">MR</div>
                  <div>
                    <div className="font-bold text-slate-900">Maria R.</div>
                    <div className="text-sm text-slate-500">6th Grade ELA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quiet Logo Strip */}
        <section className="py-12 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 font-oswald">Trusted by educators across all 50 states</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
              {/* Abstract simple icons representing schools/districts */}
              <div className="flex items-center gap-2 font-oswald text-xl font-bold"><BookOpen className="w-6 h-6"/> MUSD</div>
              <div className="flex items-center gap-2 font-oswald text-xl font-bold"><ShieldCheck className="w-6 h-6"/> AISD</div>
              <div className="flex items-center gap-2 font-oswald text-xl font-bold"><GraduationCap className="w-6 h-6"/> WCSD</div>
              <div className="flex items-center gap-2 font-oswald text-xl font-bold"><Building className="w-6 h-6"/> CPS</div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 text-center max-w-3xl mx-auto px-4 w-full">
          <h2 className="font-oswald text-5xl font-bold text-slate-900 mb-6">Ready to leave work at work?</h2>
          <p className="text-xl text-slate-600 mb-10 font-roboto">
            Join the movement of teachers reclaiming their personal time. Get 5 free lesson generations every month.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button 
              className="bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white text-xl h-16 px-10 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-full md:w-auto"
            >
              Generate a free lesson
            </Button>
            <p className="text-sm text-slate-500 mt-2 font-medium">No credit card required. Free forever tier available.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        <p>&copy; {new Date().getFullYear()} LYS Education. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Just an extra icon for the logo strip
function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

function Building(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  )
}
