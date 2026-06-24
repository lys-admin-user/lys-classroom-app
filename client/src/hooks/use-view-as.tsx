import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HIERARCHY, type UserRole } from "@shared/models/auth";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

const STORAGE_KEY = "lys:view-as-student";

interface ViewAsContextValue {
  viewAsStudent: boolean;
  setViewAsStudent: (value: boolean) => void;
}

const ViewAsContext = createContext<ViewAsContextValue | undefined>(undefined);

// Lightweight, client-side "view as student" preference. Lets an educator (or
// higher) preview the student-facing experience for "I do / you do / we do"
// modeling. It only changes what navigation is shown — it never grants or
// removes real permissions (those stay server-enforced).
export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [viewAsStudent, setViewAsStudentState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  const setViewAsStudent = (value: boolean) => {
    setViewAsStudentState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* ignore storage failures */
    }
  };

  return (
    <ViewAsContext.Provider value={{ viewAsStudent, setViewAsStudent }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs(): ViewAsContextValue {
  const ctx = useContext(ViewAsContext);
  if (!ctx) {
    return { viewAsStudent: false, setViewAsStudent: () => {} };
  }
  return ctx;
}

// Returns true only when the signed-in user is actually an educator-or-higher
// AND has student view turned on. Used to gate the override so a real student
// can never accidentally "exit" a view they were never in.
export function useIsViewingAsStudent(): boolean {
  const { viewAsStudent } = useViewAs();
  const { user } = useAuth();
  const role = (user?.role as UserRole) || "student";
  const isEducatorPlus = (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY.educator;
  return viewAsStudent && isEducatorPlus;
}

export function ViewAsStudentBanner() {
  const { setViewAsStudent } = useViewAs();
  const active = useIsViewingAsStudent();

  if (!active) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 bg-lys-teal/10 border-b border-lys-teal/20 px-4 py-2"
      data-testid="banner-view-as-student"
    >
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Eye className="h-4 w-4 text-lys-teal shrink-0" />
        <span className="font-medium">Student view</span>
        <span className="text-muted-foreground hidden sm:inline">
          You're seeing the app the way your students do.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 shrink-0"
        onClick={() => setViewAsStudent(false)}
        data-testid="button-exit-student-view"
      >
        <X className="h-3.5 w-3.5" />
        Exit student view
      </Button>
    </div>
  );
}
