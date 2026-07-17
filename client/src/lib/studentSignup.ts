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

// ---------------------------------------------------------------------------
// "First win" content — a real taste of the matched feature, shown in the quiz
// BEFORE any email/signup ask. All curated client-side (no server calls).
// ---------------------------------------------------------------------------

export interface CareerTeaser {
  title: string;
  pay: string;
  path: string;
  hook: string;
}

// 3 curated career matches per motivation (falls back to "real_world").
export const CAREER_TEASERS: Record<StudentMotivation, CareerTeaser[]> = {
  real_world: [
    { title: "Electrician", pay: "$61K median", path: "Apprenticeship — earn while you learn", hook: "Hands-on work you can see finished every single day." },
    { title: "Registered Nurse", pay: "$86K median", path: "2–4 year degree", hook: "Real impact on real people, in demand everywhere." },
    { title: "Wind Turbine Technician", pay: "$62K median", path: "Certificate, ~1 year", hook: "One of the fastest-growing jobs in the country." },
  ],
  clear_plan: [
    { title: "Accountant", pay: "$79K median", path: "4-year degree + CPA track", hook: "A clear ladder: every step from here to CPA is mapped." },
    { title: "Dental Hygienist", pay: "$87K median", path: "Associate degree, ~3 years", hook: "Defined program, licensed career, predictable schedule." },
    { title: "Air Traffic Controller", pay: "$137K median", path: "FAA academy route", hook: "A known path with a big payoff at the end." },
  ],
  recognition: [
    { title: "Software Developer", pay: "$130K median", path: "Degree or portfolio route", hook: "Your work ships — people literally use what you build." },
    { title: "Chef / Head Cook", pay: "$58K median", path: "Culinary school or kitchen ranks", hook: "Skill you can prove on a plate, no test required." },
    { title: "Graphic Designer", pay: "$58K median", path: "Portfolio-first field", hook: "Your portfolio IS your resume — the work speaks." },
  ],
  confidence: [
    { title: "Physical Therapist Assistant", pay: "$64K median", path: "Associate degree, ~2 years", hook: "Help people get stronger — and feel it yourself." },
    { title: "Firefighter", pay: "$57K median", path: "Academy + EMT cert", hook: "Training builds the confidence; the team has your back." },
    { title: "Teacher", pay: "$63K median", path: "4-year degree + license", hook: "Master something, then watch others get it because of you." },
  ],
};

export interface StrengthTeaserQuestion {
  question: string;
  options: { label: string; strength: string }[];
}

// 3-tap strengths mini-quiz — instant "top strength" result.
export const STRENGTH_TEASER_QUESTIONS: StrengthTeaserQuestion[] = [
  {
    question: "A group project is falling apart. What do you do?",
    options: [
      { label: "Take charge and split up the work", strength: "Leadership" },
      { label: "Calm everyone down and get them talking", strength: "Empathy" },
      { label: "Quietly fix the hardest part yourself", strength: "Problem-Solving" },
    ],
  },
  {
    question: "Which compliment feels best?",
    options: [
      { label: "\"You always know what to do\"", strength: "Leadership" },
      { label: "\"You really get people\"", strength: "Empathy" },
      { label: "\"How did you even figure that out?\"", strength: "Problem-Solving" },
    ],
  },
  {
    question: "Free Saturday. You'd rather…",
    options: [
      { label: "Organize something with friends", strength: "Leadership" },
      { label: "Help someone who's struggling", strength: "Empathy" },
      { label: "Build, code, or take something apart", strength: "Problem-Solving" },
    ],
  },
];

export const STRENGTH_RESULTS: Record<string, { title: string; meaning: string; nextStep: string }> = {
  Leadership: {
    title: "Leadership",
    meaning: "You move groups forward when others freeze. That's rarer than you think.",
    nextStep: "The full Self-Discovery tools map this across Be-Know-Do and show careers where leaders thrive.",
  },
  Empathy: {
    title: "Empathy",
    meaning: "You read people and situations others miss. Teams need exactly this.",
    nextStep: "The full Self-Discovery tools show how this strength turns into real career paths.",
  },
  "Problem-Solving": {
    title: "Problem-Solving",
    meaning: "You don't panic at hard problems — you take them apart. That's a superpower.",
    nextStep: "The full Self-Discovery tools connect this to fields that pay for exactly that skill.",
  },
};

// Sample first-week plan per motivation (goals feature win).
export const SAMPLE_WEEK_PLANS: Record<StudentMotivation, string[]> = {
  real_world: [
    "Day 1–2: Pick ONE goal that connects to life outside school",
    "Day 3–4: Break it into 3 steps you can actually finish",
    "Day 5–7: Do step one, check it off, feel the momentum",
  ],
  clear_plan: [
    "Day 1–2: Write down where you want to be in 1 year",
    "Day 3–4: Work backwards — what has to happen each month?",
    "Day 5–7: Lock in this week's single most important step",
  ],
  recognition: [
    "Day 1–2: Pick a goal with something to SHOW at the end",
    "Day 3–4: Set a milestone someone else will see",
    "Day 5–7: Finish the first piece and share it",
  ],
  confidence: [
    "Day 1–2: Pick a goal small enough that you can't fail it",
    "Day 3–4: Do it. Seriously — that's the whole step",
    "Day 5–7: Stack the next small win on top",
  ],
};

// Example portfolio items (portfolio feature win).
export const SAMPLE_PORTFOLIO_ITEMS: { title: string; type: string; note: string }[] = [
  { title: "Community Garden Project", type: "Project", note: "Led a 4-person team, documented with photos + reflection" },
  { title: "Spanish Debate — 1st Place", type: "Achievement", note: "Certificate + judge feedback attached" },
  { title: "Coding: Weather App", type: "Skill Demo", note: "Working demo link + what I'd improve next" },
  { title: "100 Volunteer Hours", type: "Service", note: "Verified by supervisor, running log" },
];

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
