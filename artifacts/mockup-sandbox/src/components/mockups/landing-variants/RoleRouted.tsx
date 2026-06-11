import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Users,
  Building,
  PenTool,
  Lightbulb,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import "./_group.css";

const ROLES = [
  {
    id: 'teacher',
    label: 'Teacher',
    icon: PenTool,
    headline: 'Stop spending your weekends planning.',
    description: 'Generate rigorous, standards-aligned materials, quizzes, and rubrics in seconds, not hours.',
    cta: 'Generate a free lesson',
    benefits: ['TEKS & Common Core aligned', 'Differentiated reading levels', 'Export to PDF/Word']
  },
  {
    id: 'student',
    label: 'Student',
    icon: Lightbulb,
    headline: 'Get unstuck without cheating.',
    description: 'Personalized AI tutoring that guides you to the answer step-by-step, helping you actually understand the material.',
    cta: 'Try a practice problem',
    benefits: ['Step-by-step hints', 'Socratic method guiding', 'Learn at your own pace']
  },
  {
    id: 'parent',
    label: 'Homeschool Parent',
    icon: Users,
    headline: 'Customized curriculum for your child.',
    description: 'Build engaging lesson plans tailored to your child\'s unique pace, interests, and learning style.',
    cta: 'Create a learning plan',
    benefits: ['Interest-based modules', 'Flexible pacing', 'Comprehensive subject coverage']
  },
  {
    id: 'admin',
    label: 'School Admin',
    icon: Building,
    headline: 'Safe AI that empowers your staff.',
    description: 'Provide your district with FERPA-compliant AI tools that teachers actually want to use, with full administrative oversight.',
    cta: 'Book a district demo',
    benefits: ['Data privacy guaranteed', 'Usage analytics dashboard', 'Centralized management']
  }
];

export function RoleRouted() {
  const [activeRoleId, setActiveRoleId] = useState('teacher');
  const activeRole = ROLES.find(r => r.id === activeRoleId)!;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[hsl(45,93%,62%)]/5 -skew-x-12 transform origin-top right-[-10%]" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-[hsl(186,98%,23%)]/5 rounded-tr-full" />

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-[hsl(7,84%,54%)] rounded-lg flex items-center justify-center transform -rotate-6 shadow-md shadow-[hsl(7,84%,54%)]/20">
            <span className="text-white font-marker text-xl">L</span>
          </div>
          <span className="font-marker text-2xl text-slate-800">LYS</span>
        </div>
        <a href="#" className="text-sm font-medium text-slate-600 hover:text-[hsl(186,98%,23%)] transition-colors">
          Sign in
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center pt-12 pb-24 px-4 text-center max-w-5xl mx-auto w-full relative z-10">
        
        <div className="mb-12">
          <h1 className="font-oswald text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Who are you building for today?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select your role to see how LYS can transform your educational workflow.
          </p>
        </div>

        {/* Role Selector Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-16">
          {ROLES.map((role) => {
            const isActive = activeRoleId === role.id;
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRoleId(role.id)}
                className={`group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 ease-out text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(7,84%,54%)]
                  ${isActive 
                    ? 'border-[hsl(7,84%,54%)] bg-white shadow-lg shadow-[hsl(7,84%,54%)]/10 -translate-y-1' 
                    : 'border-slate-200 bg-white/60 hover:bg-white hover:border-[hsl(45,93%,62%)] hover:shadow-md'
                  }
                `}
              >
                <div className={`
                  p-3 rounded-xl mb-4 transition-colors duration-300
                  ${isActive 
                    ? 'bg-[hsl(7,84%,54%)]/10 text-[hsl(7,84%,54%)]' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-[hsl(45,93%,62%)]/20 group-hover:text-[hsl(45,93%,62%)]'
                  }
                `}>
                  <Icon className="w-8 h-8" />
                </div>
                <span className={`font-oswald text-lg font-semibold transition-colors duration-300
                  ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}
                `}>
                  {role.label}
                </span>
                
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-[hsl(7,84%,54%)] rotate-45" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Panel */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 w-full max-w-4xl text-left flex flex-col md:flex-row gap-10 items-center transform transition-all duration-500">
          
          <div className="flex-1 space-y-6">
            <h2 className="font-oswald text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
              {activeRole.headline}
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed font-roboto">
              {activeRole.description}
            </p>
            
            <ul className="space-y-3 pt-2">
              {activeRole.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[hsl(186,98%,23%)] shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6">
              <Button 
                className="bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white text-lg h-14 px-8 rounded-full shadow-lg shadow-[hsl(7,84%,54%)]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all group w-full md:w-auto"
              >
                {activeRole.cta}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-slate-500 mt-4 text-center md:text-left">
                Get up to 5 free generations/month.
              </p>
            </div>
          </div>

          <div className="w-full md:w-[350px] aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center p-8 relative overflow-hidden group">
              {/* Abstract Representation of the tool in action */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-100 opacity-50"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center animate-bounce duration-3000">
                    <activeRole.icon className="w-10 h-10 text-[hsl(45,93%,62%)]" />
                 </div>
                 <div className="space-y-2 w-full px-4">
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-4/5 mx-auto"></div>
                    <div className="h-3 bg-[hsl(7,84%,54%)]/20 rounded-full w-2/3 mx-auto mt-4"></div>
                 </div>
              </div>
          </div>

        </div>

        {/* Trust strip */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 bg-white/80 backdrop-blur px-8 py-4 rounded-full shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[hsl(186,98%,23%)]" />
            <span>Used by 50,000+ educators</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[hsl(186,98%,23%)]" />
            <span>FERPA-safe</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[hsl(186,98%,23%)]" />
            <span>No credit card required</span>
          </div>
        </div>

      </main>
    </div>
  );
}
