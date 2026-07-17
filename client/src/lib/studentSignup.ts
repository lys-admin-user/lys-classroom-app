// Student pre-signup quiz — shared client helpers.
// Answers live in localStorage (keyed by a session uuid, same pattern as the
// teacher quiz) so the onboarding wizard and student home can pre-fill and
// personalize without asking twice.

export type StudentPainPoint =
  | "career_direction"
  | "know_strengths"
  | "stay_on_track"
  | "show_work";

export type StudentMotivation =
  | "real_world"
  | "clear_plan"
  | "recognition"
  | "confidence";

export type StudentRecommendedFeature =
  | "careers"
  | "self_discovery"
  | "goals"
  | "portfolio";

export const STUDENT_PAIN_POINT_OPTIONS: { value: StudentPainPoint; label: string }[] = [
  { value: "career_direction", label: "I don't know what career or path fits me" },
  { value: "know_strengths", label: "I'm not sure what I'm actually good at" },
  { value: "stay_on_track", label: "I have goals but I can't stay on track" },
  { value: "show_work", label: "I have nothing to show for the work I've done" },
];

export const STUDENT_MOTIVATION_OPTIONS: { value: StudentMotivation; label: string }[] = [
  { value: "real_world", label: "Seeing how school connects to real life" },
  { value: "clear_plan", label: "Having a clear plan for what's next" },
  { value: "recognition", label: "Getting credit for what I can do" },
  { value: "confidence", label: "Feeling confident about my future" },
];

export const STUDENT_GRADE_OPTIONS = [
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
  "College / other",
] as const;

export const PAIN_POINT_TO_FEATURE: Record<StudentPainPoint, StudentRecommendedFeature> = {
  career_direction: "careers",
  know_strengths: "self_discovery",
  stay_on_track: "goals",
  show_work: "portfolio",
};

export const FEATURE_SPOTLIGHTS: Record<
  StudentRecommendedFeature,
  { title: string; description: string; route: string; cta: string }
> = {
  careers: {
    title: "Career Explorer",
    description:
      "Browse 800+ real careers — what they pay, what they take, and how to get there from where you are now.",
    route: "/careers",
    cta: "Explore careers",
  },
  self_discovery: {
    title: "Self-Discovery",
    description:
      "Find out what you're actually good at with the Be-Know-Do strengths tools — then see where those strengths lead.",
    route: "/self-discovery",
    cta: "Discover your strengths",
  },
  goals: {
    title: "Goals & My Journey",
    description:
      "Turn big dreams into a step-by-step plan you can actually follow — and watch your progress add up.",
    route: "/my-journey",
    cta: "Build your plan",
  },
  portfolio: {
    title: "Digital Portfolio",
    description:
      "Collect your best work in one place you can share with colleges, employers, and mentors.",
    route: "/portfolio",
    cta: "Start your portfolio",
  },
};

export interface StudentSignupAnswers {
  painPoint?: StudentPainPoint;
  motivation?: StudentMotivation;
  gradeLevel?: string;
  state?: string;
  email?: string;
  recommendedFeature?: StudentRecommendedFeature;
  completedAt?: string;
}

const SESSION_KEY = "lys_student_signup_session_id";
const ANSWERS_KEY = "lys_student_signup_answers";

export function getOrCreateStudentSignupSessionId(): string {
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

export function getStudentSignupSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function saveStudentSignupAnswers(answers: StudentSignupAnswers): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadStudentSignupAnswers(): StudentSignupAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as StudentSignupAnswers;
  } catch {
    /* corrupt — ignore */
  }
  return null;
}

export function clearStudentSignupAnswers(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANSWERS_KEY);
  } catch {
    /* ignore */
  }
}
