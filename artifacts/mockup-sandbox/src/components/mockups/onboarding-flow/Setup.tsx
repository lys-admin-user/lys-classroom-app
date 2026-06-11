import "./_group.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, UserCircle2, Building2, Check } from "lucide-react";
import { useState } from "react";

export function Setup() {
  const [role, setRole] = useState("teacher");

  const roles = [
    { id: "teacher", label: "Teacher", icon: GraduationCap },
    { id: "student", label: "Student", icon: UserCircle2 },
    { id: "parent", label: "Homeschool Parent", icon: Users },
    { id: "admin", label: "School Admin", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-roboto items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-block bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 shadow-sm">
            Step 1 of 1
          </div>
          <h1 className="font-oswald text-4xl md:text-5xl font-semibold text-slate-900 mb-3">Let's tailor LYS to you</h1>
          <p className="text-lg text-slate-600">One quick question so we can set up your workspace.</p>
        </div>

        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-8 sm:p-10">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">I am a...</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected 
                            ? "border-[hsl(186,98%,23%)] bg-[hsl(186,98%,23%)]/5 text-[hsl(186,98%,23%)] shadow-sm" 
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-[hsl(186,98%,23%)] text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                        <Icon className={`w-8 h-8 mb-3 ${isSelected ? "text-[hsl(186,98%,23%)]" : "text-slate-400"}`} />
                        <span className="text-sm font-semibold text-center leading-tight">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Where should we send your saved work?</label>
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="h-12 text-base bg-slate-50 border-slate-200 focus-visible:ring-[hsl(186,98%,23%)]"
                />
              </div>

              <Button className="w-full h-14 bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white text-lg font-medium rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
                Start using LYS
              </Button>
              
              <p className="text-center text-sm text-slate-500 mt-4">
                That's it — you can change this later in settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
