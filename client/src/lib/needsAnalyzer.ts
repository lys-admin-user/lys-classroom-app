import { GraduationCap, BookOpen, Heart, Building2, Globe, type LucideIcon } from "lucide-react";

export type AnalyzerIdentity =
  | "student"
  | "educator"
  | "homeschool_parent"
  | "campus_admin"
  | "district_admin";

export type AnalyzerUrgency = "exploring" | "looking" | "ready_now";

export type AnalyzerCtaType = "start_free" | "try_sample" | "book_demo";

export interface AnalyzerCta {
  type: AnalyzerCtaType;
  label: string;
  href: string;
}

export interface AnalyzerSegment {
  identity: AnalyzerIdentity;
  label: string;
  icon: LucideIcon;
  valueProp: string;
  pains: string[];
  outcomes: string[];
  cta: AnalyzerCta;
}

export const URGENCY_OPTIONS: { value: AnalyzerUrgency; label: string }[] = [
  { value: "exploring", label: "Just starting to explore" },
  { value: "looking", label: "Actively looking for a solution" },
  { value: "ready_now", label: "Ready to get started now" },
];

export const SEGMENTS: Record<AnalyzerIdentity, AnalyzerSegment> = {
  student: {
    identity: "student",
    label: "Student",
    icon: GraduationCap,
    valueProp:
      "LYS gives every student a clear, personalized roadmap from high school to life — so you never feel lost, alone, or unprepared for what comes next.",
    pains: [
      "I don't know what I want to do after high school",
      "I feel pressure to choose a path, but no one's guiding me",
      "I want to figure out my real strengths",
      "I want to plan for college or a career, but don't know where to start",
    ],
    outcomes: [
      "A clear next step I can take this week",
      "A personalized career and college roadmap",
      "Confidence in who I am and what I'm great at",
    ],
    cta: { type: "start_free", label: "Start free", href: "/api/login" },
  },
  educator: {
    identity: "educator",
    label: "Teacher or Educator",
    icon: BookOpen,
    valueProp:
      "LYS gives teachers back their time — with state-aligned lesson plans and life-skills tools that make every student feel seen, prepared, and motivated.",
    pains: [
      "Lesson planning is consuming my time",
      "I need standards-aligned lessons fast",
      "I want students engaged in real-life skills, not just content",
      "I need differentiation and accommodations built in",
    ],
    outcomes: [
      "Get a usable, standards-aligned lesson in under 5 minutes",
      "Cover state standards without manual cross-referencing",
      "Engage every learner with built-in accommodations",
    ],
    cta: { type: "try_sample", label: "Try a sample lesson", href: "/lesson-generator" },
  },
  homeschool_parent: {
    identity: "homeschool_parent",
    label: "Parent or Homeschool Family",
    icon: Heart,
    valueProp:
      "LYS gives families a structured, proven framework to develop the whole child — academically, emotionally, and professionally — without needing a school to do it.",
    pains: [
      "I want a structured curriculum without it feeling like school",
      "I want my child prepared for life, not just tests",
      "I need lesson plans I can use today",
      "I want to track progress across academics and life skills",
    ],
    outcomes: [
      "A weekly plan I can actually follow",
      "Whole-child development built in",
      "Confidence my child is on track for life after high school",
    ],
    cta: { type: "start_free", label: "Start free", href: "/api/login" },
  },
  campus_admin: {
    identity: "campus_admin",
    label: "School or Campus Administrator",
    icon: Building2,
    valueProp:
      "LYS helps schools close the college and career readiness gap with a proven, scalable program that improves student outcomes and strengthens community trust.",
    pains: [
      "Our college and career readiness numbers need to move",
      "Teachers are burning out on lesson planning",
      "We need a scalable life-skills program across campus",
      "We need measurable outcomes for our board",
    ],
    outcomes: [
      "Higher college and career readiness numbers",
      "Less teacher burnout and turnover",
      "Measurable, board-ready outcome reports",
    ],
    cta: {
      type: "book_demo",
      label: "Book a demo",
      href: "mailto:demo@lys.org?subject=LYS%20Demo%20Request%20-%20School",
    },
  },
  district_admin: {
    identity: "district_admin",
    label: "District or Education Partner",
    icon: Globe,
    valueProp:
      "LYS partners with districts, colleges, and community organizations to increase student retention, strengthen first-gen support, and build lasting pathways to student success.",
    pains: [
      "We need a district-wide career and college readiness solution",
      "We're losing students between high school and post-secondary",
      "We need first-generation student support at scale",
      "We need a partner that integrates with our existing systems",
    ],
    outcomes: [
      "Higher retention and matriculation rates",
      "Stronger first-generation student outcomes",
      "A scalable partnership that fits our SIS and standards",
    ],
    cta: {
      type: "book_demo",
      label: "Book a partnership call",
      href: "mailto:partnerships@lys.org?subject=LYS%20Partnership%20Inquiry",
    },
  },
};

const SESSION_KEY = "lys_needs_analyzer_session_id";
const SEEN_KEY = "lys_needs_analyzer_seen";
const DRAFT_KEY = "lys_needs_analyzer_draft";

export function getOrCreateAnalyzerSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getAnalyzerSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function hasSeenAnalyzer(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SEEN_KEY) === "1";
}

export function markAnalyzerSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, "1");
}

// ----- Draft persistence -----------------------------------------------------
// Saves a partial in-progress answer set to localStorage so a visitor can
// refresh, navigate away, or open the modal again without losing what they
// already picked. Cleared once a complete response is submitted.
export interface AnalyzerDraft {
  step?: number | "result";
  identity?: AnalyzerIdentity;
  corePain?: string;
  urgency?: AnalyzerUrgency;
  desiredOutcome?: string;
}

export function saveAnalyzerDraft(draft: AnalyzerDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadAnalyzerDraft(): AnalyzerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as AnalyzerDraft;
  } catch {
    /* corrupt — ignore */
  }
  return null;
}

export function clearAnalyzerDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

// ----- Durable telemetry POST -----------------------------------------------
// CTA tracking fires immediately before a navigation (anchor click, mailto,
// /api/login redirect). A vanilla fetch can be canceled by the browser when
// the page unloads, which would systematically undercount conversions.
// `fetch(..., { keepalive: true })` instructs the browser to let the request
// outlive the page; sendBeacon is used as the most reliable fallback.
export function postKeepalive(url: string, body: unknown): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(body);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "include",
    });
  } catch {
    /* best-effort */
  }
}
