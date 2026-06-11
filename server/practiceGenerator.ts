import { randomUUID } from "crypto";
import { openai } from "./openai";
import { sanitizePromptText } from "./services/piiSanitizer";
import type {
  GeneratePracticeRequest,
  GeneratedPracticeSet,
  PracticeQuestion,
} from "@shared/schema";

// Turns a subject/grade/topic into a set of practice questions with
// progressive, step-by-step hints. Deliberately simpler than the lesson
// generator (no canon/voice/retrieval) — this is a fast, student-facing
// "study with me" experience.
export async function generatePracticeSet(
  request: GeneratePracticeRequest,
): Promise<GeneratedPracticeSet> {
  if (!openai) {
    throw new Error(
      "Practice generation is temporarily unavailable. Please try again in a moment.",
    );
  }

  const safeSubject = sanitizePromptText(request.subject);
  const safeTopic = sanitizePromptText(request.topic);
  const safeGrade = sanitizePromptText(request.gradeLevel);
  const count = Math.max(1, Math.min(10, request.questionCount || 5));

  const systemPrompt = `You are a warm, encouraging tutor on the LYS (Laddering Your Success) platform. You help students learn by DOING — you give them practice problems and guide them with step-by-step hints instead of just handing over the answer.

Generate exactly ${count} practice questions for a ${safeGrade} student studying "${safeTopic}" in ${safeSubject}, at ${request.difficulty} difficulty.

Rules for every question:
- Make it age-appropriate and clearly worded for a ${safeGrade} student.
- Mix multiple-choice and short-answer questions where it makes sense for the subject.
- For multiple-choice questions, provide 4 plausible options and make exactly one correct.
- Provide 2-3 HINTS that build progressively: the first is a gentle nudge (what to think about / where to start), each later hint reveals more of the method, and the LAST hint should almost lead the student to the answer WITHOUT stating it outright.
- Provide the correct answer and a clear, friendly explanation of WHY it is correct (the reasoning/steps), not just the answer.
- Keep the tone supportive and growth-minded.

Respond ONLY with a valid JSON object in exactly this shape:
{
  "title": "string — a short friendly title for this practice set",
  "questions": [
    {
      "type": "multiple_choice" | "short_answer",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "hints": ["string", "string"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}
For short_answer questions omit the "options" field or set it to an empty array. Do not include any text outside the JSON object.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create ${count} ${request.difficulty} practice questions on "${safeTopic}" (${safeSubject}) for a ${safeGrade} student.`,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("The tutor didn't return any practice questions. Please try again.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Couldn't read the practice questions. Please try again.");
  }

  const rawQuestions: any[] = Array.isArray(parsed?.questions) ? parsed.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error("No practice questions were generated. Please try a different topic.");
  }

  const questions: PracticeQuestion[] = rawQuestions.map((q: any) => {
    const type: PracticeQuestion["type"] =
      q?.type === "multiple_choice" ? "multiple_choice" : "short_answer";
    const options = Array.isArray(q?.options)
      ? q.options.filter((o: any) => typeof o === "string" && o.trim().length > 0)
      : [];
    const hints = Array.isArray(q?.hints)
      ? q.hints.filter((h: any) => typeof h === "string" && h.trim().length > 0)
      : [];
    return {
      id: randomUUID(),
      type: type === "multiple_choice" && options.length >= 2 ? "multiple_choice" : "short_answer",
      question: typeof q?.question === "string" ? q.question : "",
      options: options.length >= 2 ? options : undefined,
      hints: hints.length > 0 ? hints : ["Think about what the question is really asking."],
      answer: typeof q?.answer === "string" ? q.answer : "",
      explanation: typeof q?.explanation === "string" ? q.explanation : "",
    };
  });

  return {
    id: randomUUID(),
    title:
      typeof parsed?.title === "string" && parsed.title.trim().length > 0
        ? parsed.title
        : `Practice: ${request.topic}`,
    subject: request.subject,
    topic: request.topic,
    gradeLevel: request.gradeLevel,
    difficulty: request.difficulty,
    questions,
  };
}
