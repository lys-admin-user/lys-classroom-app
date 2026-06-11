import "./_group.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, Wand2, PlusCircle, Users2, Compass, 
  Library, X, Sparkles, GraduationCap 
} from "lucide-react";
import { useState } from "react";

export function Home() {
  const [showNudge, setShowNudge] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[hsl(7,84%,54%)] rounded flex items-center justify-center transform -rotate-6">
              <span className="text-white font-marker text-lg">L</span>
            </div>
            <span className="font-marker text-xl text-slate-800">LYS</span>
          </div>
          
          <div className="relative hidden md:block w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Press / to jump to..." 
              className="w-full bg-slate-100 border-transparent rounded-full h-9 pl-10 pr-4 text-sm focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-[hsl(186,98%,23%)]/20 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Avatar className="h-9 w-9 bg-slate-200 text-slate-600 cursor-pointer">
            <AvatarFallback className="font-medium text-sm">MR</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        
        {/* Nudge */}
        {showNudge && (
          <div className="bg-[hsl(186,98%,23%)]/5 border border-[hsl(186,98%,23%)]/20 rounded-xl p-4 mb-8 flex items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Sparkles className="h-5 w-5 text-[hsl(186,98%,23%)]" />
              </div>
              <div>
                <h4 className="font-semibold text-[hsl(186,98%,23%)]">Welcome to your new workspace!</h4>
                <p className="text-sm text-slate-600 mt-0.5">Everything you need to plan, teach, and assess is right here. Try generating a lesson to get started.</p>
              </div>
            </div>
            <button onClick={() => setShowNudge(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="mb-10">
          <h1 className="font-oswald text-4xl font-semibold text-slate-900 mb-2">Welcome, Ms. Rivera</h1>
          <p className="text-slate-500 font-medium">Here's what's happening in your classroom today.</p>
        </div>

        {/* Quick Start Band */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Generate Lesson", icon: Wand2, color: "text-[hsl(7,84%,54%)]", bg: "bg-[hsl(7,84%,54%)]/10" },
            { label: "New Assignment", icon: PlusCircle, color: "text-[hsl(45,93%,62%)]", bg: "bg-[hsl(45,93%,62%)]/20" },
            { label: "Build a Class", icon: Users2, color: "text-[hsl(186,98%,23%)]", bg: "bg-[hsl(186,98%,23%)]/10" },
            { label: "Explore Resources", icon: Compass, color: "text-purple-600", bg: "bg-purple-100" },
          ].map((action) => (
            <button key={action.label} className="flex flex-col items-start p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group">
              <div className={`p-3 rounded-xl mb-4 ${action.bg}`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <span className="font-semibold text-slate-800 group-hover:text-slate-900">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Empty States / Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-dashed border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                <GraduationCap className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="font-oswald text-2xl font-semibold text-slate-800 mb-2">No classes yet</h3>
              <p className="text-slate-500 mb-8 max-w-sm">Set up your first class roster to start assigning work and tracking student progress.</p>
              <Button className="bg-[hsl(186,98%,23%)] hover:bg-[hsl(186,98%,20%)] text-white rounded-full px-6 shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Create your first class
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-dashed border-slate-200 shadow-sm bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                <Library className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="font-oswald text-2xl font-semibold text-slate-800 mb-2">Your library is empty</h3>
              <p className="text-slate-500 mb-8 max-w-sm">Generate AI lesson plans or upload your existing materials to build your library.</p>
              <Button className="bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white rounded-full px-6 shadow-sm">
                <Wand2 className="mr-2 h-4 w-4" /> Generate a lesson
              </Button>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
