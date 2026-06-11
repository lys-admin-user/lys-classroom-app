import { randomUUID } from "crypto";
import { openai } from "./openai";
import { sanitizePromptText } from "./services/piiSanitizer";
import type {
  GenerateHomeschoolPlanRequest,
  GeneratedHomeschoolPlan,
  HomeschoolActivity,
  HomeschoolDayPlan,
} from "@shared/schema";

// Turns a child's grade + chosen subjects + interests into a ready-to-teach,
// day-by-day homeschool week plan. Like the practice generator, this is a fast,
// parent-facing experience (no canon/voice/retrieval).
export async function generateHomeschoolPlan(
  request: GenerateHomeschoolPlanRequest,
): Promise<GeneratedHomeschoolPlan> {
  if (!openai) {
    throw new Error(
      "Homeschool planning is temporarily unavailable. Please try again in a moment.",
    );
  }

  const safeGrade = sanitizePromptText(request.gradeLevel);
  const safeSubjects = request.subjects
    .map((s) => sanitizePromptText(s))
    .filter((s) => s.trim().length > 0);
  const safeInterests = request.interests ? sanitizePromptText(request.interests) : "";
  const safeNotes = request.notes ? sanitizePromptText(request.notes) : "";
  const days = Math.max(1, Math.min(7, request.daysPerWeek || 5));

  if (safeSubjects.length === 0) {
    throw new Error("Please pick at least one subject to plan.");
  }

  const systemPrompt = `You are an experienced homeschool curriculum coach on the LYS (Laddering Your Success) platform. You help busy homeschool parents by building practical, ready-to-teach weekly plans tailored to their child.

Build a ${days}-day homeschool week plan for a ${safeGrade} child covering these subjects across the week: ${safeSubjects.join(", ")}.
${safeInterests ? `The child is especially interested in: ${safeInterests}. Weave these interests into activities and examples where natural.` : ""}
${safeNotes ? `Parent notes / special considerations: ${safeNotes}.` : ""}

Rules:
- Plan exactly ${days} days (label them "Day 1", "Day 2", ...).
- Distribute the subjects sensibly across the week — you do NOT need every subject every day. Aim for a balanced, realistic load for a ${safeGrade} child (roughly 3-5 activities per day).
- Each day may have a short, friendly theme that ties the day together.
- For each activity provide: the subject, a clear learning focus (what they'll learn), a concrete hands-on activity (what the parent and child actually DO), a short list of common, low-cost materials, and an estimated time in minutes appropriate for the grade.
- Keep everything age-appropriate, encouraging, and doable at home without special equipment.

Respond ONLY with a valid JSON object in exactly this shape:
{
  "title": "string — a short friendly title for this week's plan",
  "weeklyTheme": "string — an optional overarching theme for the week",
  "overview": "string — 1-2 sentences telling the parent what this week covers and how to use it",
  "days": [
    {
      "day": "Day 1",
      "theme": "string — optional short daily theme",
      "activities": [
        {
          "subject": "string",
          "focus": "string — what the child will learn",
          "activity": "string — what to actually do",
          "materials": ["string"],
          "estimatedMinutes": 30
        }
      ]
    }
  ]
}
Do not include any text outside the JSON object.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create a ${days}-day homeschool plan for a ${safeGrade} child covering ${safeSubjects.join(", ")}.${safeInterests ? ` Interests: ${safeInterests}.` : ""}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("The planner didn't return a plan. Please try again.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Couldn't read the homeschool plan. Please try again.");
  }

  const rawDays: any[] = Array.isArray(parsed?.days) ? parsed.days : [];
  if (rawDays.length === 0) {
    throw new Error("No plan was generated. Please try different subjects.");
  }

  const planDays: HomeschoolDayPlan[] = rawDays.map((d: any, dayIdx: number) => {
    const rawActivities: any[] = Array.isArray(d?.activities) ? d.activities : [];
    const activities: HomeschoolActivity[] = rawActivities
      .map((a: any) => {
        const materials = Array.isArray(a?.materials)
          ? a.materials.filter((m: any) => typeof m === "string" && m.trim().length > 0)
          : [];
        const minutes = Number(a?.estimatedMinutes);
        return {
          subject: typeof a?.subject === "string" ? a.subject : "",
          focus: typeof a?.focus === "string" ? a.focus : "",
          activity: typeof a?.activity === "string" ? a.activity : "",
          materials: materials.length > 0 ? materials : undefined,
          estimatedMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : undefined,
        };
      })
      .filter((a: HomeschoolActivity) => a.subject.trim().length > 0 || a.activity.trim().length > 0);

    return {
      id: randomUUID(),
      day: typeof d?.day === "string" && d.day.trim().length > 0 ? d.day : `Day ${dayIdx + 1}`,
      theme: typeof d?.theme === "string" && d.theme.trim().length > 0 ? d.theme : undefined,
      activities,
    };
  });

  return {
    id: randomUUID(),
    title:
      typeof parsed?.title === "string" && parsed.title.trim().length > 0
        ? parsed.title
        : `Homeschool Week — ${request.gradeLevel}`,
    gradeLevel: request.gradeLevel,
    weeklyTheme:
      typeof parsed?.weeklyTheme === "string" && parsed.weeklyTheme.trim().length > 0
        ? parsed.weeklyTheme
        : undefined,
    overview:
      typeof parsed?.overview === "string" && parsed.overview.trim().length > 0
        ? parsed.overview
        : undefined,
    days: planDays,
  };
}
