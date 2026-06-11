import "./_group.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, Wand2, CheckCircle2, BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FirstValue() {
  return (
    <div className="min-h-screen bg-slate-50 font-roboto p-6 lg:p-12">
      <header className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[hsl(7,84%,54%)] rounded-md flex items-center justify-center transform -rotate-6">
            <span className="text-white font-marker text-lg">L</span>
          </div>
          <span className="font-marker text-xl text-slate-800">LYS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
            <span className="text-[hsl(186,98%,23%)] font-bold">3 of 5</span> free lessons left this month
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        {/* Generator Form */}
        <div className="space-y-6">
          <div className="mb-2">
            <h2 className="font-oswald text-3xl font-semibold text-slate-900 mb-2">Create a Lesson</h2>
            <p className="text-slate-600 text-sm">Fill out the basics and let our AI do the heavy lifting.</p>
          </div>
          
          <Card className="shadow-md border-0">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Topic or Standard</label>
                <Input placeholder="e.g. The Water Cycle" defaultValue="Fractions and Decimals" className="h-11" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Grade Level</label>
                <Select defaultValue="4">
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3rd Grade</SelectItem>
                    <SelectItem value="4">4th Grade</SelectItem>
                    <SelectItem value="5">5th Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <Select defaultValue="math">
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="ela">ELA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full h-12 bg-[hsl(7,84%,54%)] hover:bg-[hsl(7,84%,45%)] text-white mt-4 text-base shadow-md">
                <Wand2 className="mr-2 h-5 w-5" /> Generate
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Result */}
        <div className="flex flex-col h-full">
          <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 p-8 flex-1">
            <div className="flex items-start justify-between mb-6">
              <div>
                <Badge className="bg-[hsl(45,93%,62%)] text-slate-800 hover:bg-[hsl(45,93%,55%)] border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  Generated in 4 seconds
                </Badge>
                <h1 className="font-oswald text-4xl text-slate-900 font-semibold">Understanding Fractions and Decimals</h1>
                <p className="text-slate-500 mt-2 font-medium">4th Grade Mathematics • 45 minutes</p>
              </div>
            </div>

            <div className="space-y-8 mt-8">
              <section>
                <h3 className="font-oswald text-xl text-[hsl(186,98%,23%)] font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Objective
                </h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  Students will be able to convert fractions with denominators of 10 and 100 into decimals, and represent them visually using grid models with 80% accuracy.
                </p>
              </section>

              <section>
                <h3 className="font-oswald text-xl text-[hsl(186,98%,23%)] font-semibold mb-3">Materials Needed</h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>10x10 blank grids (2 per student)</li>
                  <li>Colored pencils or markers</li>
                  <li>Whiteboard and dry erase markers</li>
                  <li>"Fractions to Decimals" matching cards</li>
                </ul>
              </section>

              <section>
                <h3 className="font-oswald text-xl text-[hsl(186,98%,23%)] font-semibold mb-3">Activity (20 mins)</h3>
                <div className="space-y-4 text-slate-700 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 before:rounded-full">
                  <div>
                    <h4 className="font-bold text-slate-900">1. Visual Introduction</h4>
                    <p>Distribute the 10x10 grids. Instruct students to color 30 squares. Explain that this represents 30/100, which can also be written as 0.30.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">2. Guided Practice</h4>
                    <p>Write several fractions on the board (45/100, 7/10, 99/100). Have students color their second grid for one of the fractions and write the corresponding decimal beneath it.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">3. Assessment</h4>
                    <p>Exit ticket matching game.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Action Row & Gentle Nudge */}
          <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex gap-3">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-white bg-white">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-white bg-white">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
            
            <div className="flex items-center gap-4 bg-[hsl(186,98%,23%)]/5 px-4 py-2 rounded-xl border border-[hsl(186,98%,23%)]/20">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4 text-[hsl(186,98%,23%)]" />
                Want to save this to your library?
              </span>
              <Button size="sm" className="bg-[hsl(186,98%,23%)] hover:bg-[hsl(186,98%,20%)] text-white rounded-full">
                Create free account
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
