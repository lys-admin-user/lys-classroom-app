import {
  Sparkles,
  Wand2,
  BookOpen,
  Map,
  FileText,
  School,
  ClipboardList,
  Share2,
  Folder,
  Link2,
  PenTool,
  Users,
  ArrowRight,
} from "lucide-react";

type Item = { label: string; icon: any; highlight?: boolean };

function Group({ heading, items }: { heading: string; items: Item[] }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 mb-1">{heading}</p>
      <div className="space-y-0.5">
        {items.map((it) => (
          <div
            key={it.label}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
              it.highlight
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300 font-medium"
                : "text-foreground/80"
            }`}
          >
            <it.icon className="h-4 w-4 shrink-0 opacity-70" />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuBeforeAfter() {
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="grid grid-cols-2 gap-6 items-start">
        {/* BEFORE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Before</span>
            <span className="text-xs text-muted-foreground">— student tools scattered</span>
          </div>
          <div className="bg-background rounded-xl border shadow-sm p-3">
            <Group
              heading="Educator Tools"
              items={[
                { label: "AI Lesson Generator", icon: Sparkles },
                { label: "AI Assignment Generator", icon: Wand2 },
                { label: "My Lessons", icon: BookOpen },
                { label: "Curriculum Planning", icon: Map },
                { label: "Assessments", icon: FileText },
                { label: "Classroom", icon: School, highlight: true },
                { label: "Gradebook", icon: ClipboardList },
                { label: "Collaboration", icon: Share2 },
                { label: "Community Library", icon: Folder },
                { label: "SIS Integration", icon: Link2 },
                { label: "Lesson Authoring", icon: PenTool },
              ]}
            />
            <Group
              heading="Student Management"
              items={[{ label: "Parent Portal", icon: Users, highlight: true }]}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            “Classroom” is buried in a long tools list, and “Parent Portal” sits alone — student work is split across two unrelated groups.
          </p>
        </div>

        {/* AFTER */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">After</span>
            <span className="text-xs text-muted-foreground">— one clear “Students” group</span>
          </div>
          <div className="bg-background rounded-xl border shadow-sm p-3">
            <Group
              heading="Educator Tools"
              items={[
                { label: "AI Lesson Generator", icon: Sparkles },
                { label: "AI Assignment Generator", icon: Wand2 },
                { label: "My Lessons", icon: BookOpen },
                { label: "Curriculum Planning", icon: Map },
                { label: "Assessments", icon: FileText },
                { label: "Gradebook", icon: ClipboardList },
                { label: "Collaboration", icon: Share2 },
                { label: "Community Library", icon: Folder },
                { label: "SIS Integration", icon: Link2 },
                { label: "Lesson Authoring", icon: PenTool },
              ]}
            />
            <Group
              heading="Students"
              items={[
                { label: "Classroom", icon: School, highlight: true },
                { label: "Parent Portal", icon: Users, highlight: true },
              ]}
            />
          </div>
          <p className="text-xs text-emerald-700 mt-2 px-1">
            All student-focused tools live together. Nothing removed — “Classroom” just moves into a logical home next to “Parent Portal”.
          </p>
        </div>
      </div>
    </div>
  );
}
