// Teacher pre-signup quiz — shared client helpers.
// Answers are held in localStorage (keyed by a session uuid, same pattern as
// the needs analyzer) so the onboarding wizard and lesson generator can
// pre-fill from them without asking the same questions twice.

export type TeacherFrustration = "behavior" | "planning_time" | "differentiation_docs";
export type TeacherPlanningStyle = "from_scratch" | "reuse_old" | "curriculum_provided";

export const FRUSTRATION_OPTIONS: { value: TeacherFrustration; label: string }[] = [
  { value: "behavior", label: "Behavior issues taking over class time" },
  { value: "planning_time", label: "Time spent on lessons and assignments" },
  { value: "differentiation_docs", label: "Documenting differentiation and accommodations" },
];

export const PLANNING_STYLE_OPTIONS: { value: TeacherPlanningStyle; label: string }[] = [
  { value: "from_scratch", label: "I build lessons from scratch" },
  { value: "reuse_old", label: "I reuse and adapt old lessons" },
  { value: "curriculum_provided", label: "My school provides the curriculum" },
];

// Personalized pain-point messaging used on the generation waiting screen and
// in the finished lesson.
export const FRUSTRATION_CALLOUTS: Record<
  TeacherFrustration,
  { waiting: string; result: string }
> = {
  behavior: {
    waiting:
      "You said behavior issues eat your class time. This lesson builds in engagement activities that keep students busy learning — watch for the activities section.",
    result:
      "You said behavior is your biggest frustration — these ready-made, engaging activities are designed to keep every student on task.",
  },
  planning_time: {
    waiting:
      "You said lessons and assignments eat your week. This full, standards-aligned plan is being written for you right now — in seconds, not Sundays.",
    result:
      "You said planning time is your biggest frustration — this complete plan (objectives, activities, materials, assessment) just saved you hours.",
  },
  differentiation_docs: {
    waiting:
      "You said documenting differentiation takes too long. This lesson includes ready-to-file activities tagged by learning focus — the documentation writes itself.",
    result:
      "You said differentiation documentation is your biggest frustration — the activities below are already broken out by focus, ready to file.",
  },
};

export interface TeacherSignupAnswers {
  frustration?: TeacherFrustration;
  planningStyle?: TeacherPlanningStyle;
  country?: string;
  state?: string;
  subject?: string;
  gradeLevel?: string;
  email?: string;
  completedAt?: string;
}

const SESSION_KEY = "lys_teacher_signup_session_id";
const ANSWERS_KEY = "lys_teacher_signup_answers";

export function getOrCreateTeacherSignupSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getTeacherSignupSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function saveTeacherSignupAnswers(answers: TeacherSignupAnswers): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadTeacherSignupAnswers(): TeacherSignupAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as TeacherSignupAnswers;
  } catch {
    /* corrupt — ignore */
  }
  return null;
}

export function clearTeacherSignupAnswers(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANSWERS_KEY);
  } catch {
    /* ignore */
  }
}
