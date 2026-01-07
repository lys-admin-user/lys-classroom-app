import OpenAI from "openai";
import type { Lesson } from "@shared/schema";
import { randomUUID } from "crypto";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface GenerateAssignmentRequest {
  lesson: Lesson;
  assignmentType: "quiz" | "worksheet" | "project" | "discussion" | "reflection";
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  includeBeKnowDo: boolean;
  accommodationType?: "IEP" | "504" | "BIP";
  accommodationNotes?: string;
}

interface AssignmentQuestion {
  id: string;
  type: "multiple_choice" | "short_answer" | "essay" | "true_false" | "matching";
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  bkdFocus?: "be" | "know" | "do";
}

interface AccommodationChecklist {
  extraTime: boolean;
  notesCopyProvided: boolean;
  studySheetProvided: boolean;
  graphicOrganizer: boolean;
  mnemonicDevices: boolean;
  largerFont: boolean;
  shortenedText: boolean;
  peerSupport: boolean;
  preferentialSeating: boolean;
  frequentReminders: boolean;
  completedExample: boolean;
  visualOrganizer: boolean;
}

interface WorksheetMetadata {
  course: string;
  unit: string;
  contentObjective: string;
  lessonObjective: string;
  lysMethodology: {
    be: string;
    know: string;
    do: string;
  };
  essentialQuestions: string;
  lessonClose: string;
  gradeLevel: string;
  duration: string;
  standards: string;
}

interface GeneratedAssignment {
  title: string;
  description: string;
  instructions: string;
  questions: AssignmentQuestion[];
  totalPoints: number;
  accommodationModified: boolean;
  accommodationType?: string;
  accommodationNotes?: string;
  worksheet: WorksheetMetadata;
  accommodationChecklist: AccommodationChecklist;
}

const accommodationGuidelines = {
  IEP: `Apply these IEP accommodations:
- Simplify language and reduce complexity
- Break complex questions into smaller parts
- Provide more context and scaffolding
- Allow for various response formats
- Include visual supports where appropriate`,
  504: `Apply these 504 accommodations:
- Reduce the number of items if appropriate
- Provide clear, structured instructions
- Include check-in points within longer tasks
- Allow for extended response time consideration
- Minimize distracting elements`,
  BIP: `Apply these BIP accommodations:
- Include clear behavioral expectations
- Break work into manageable chunks
- Provide positive reinforcement opportunities
- Offer choice where possible
- Include breaks or transition points`,
};

export async function generateAssignment(request: GenerateAssignmentRequest): Promise<GeneratedAssignment> {
  if (!openai) {
    return generateMockAssignment(request);
  }

  const accommodationContext = request.accommodationType 
    ? `\n\nIMPORTANT ACCOMMODATION REQUIREMENTS (${request.accommodationType}):\n${accommodationGuidelines[request.accommodationType]}\n${request.accommodationNotes ? `Additional notes: ${request.accommodationNotes}` : ""}`
    : "";

  const systemPrompt = `You are an expert educator creating ${request.assignmentType} assignments based on lesson plans.
Your assignments should be engaging, pedagogically sound, and aligned with the lesson objectives.

For the Be-Know-Do framework:
- BE questions focus on identity, values, self-reflection, and personal application
- KNOW questions focus on knowledge, facts, concepts, and understanding
- DO questions focus on skills, action steps, and practical application

${request.includeBeKnowDo ? "Include questions from all three pillars (BE, KNOW, DO)." : "Focus primarily on KNOW and DO questions."}
${accommodationContext}

Create ${request.questionCount} questions at ${request.difficulty} difficulty level.
Mix question types appropriately for a ${request.assignmentType}.`;

  const lessonContext = `
Lesson Title: ${request.lesson.title}
Topic: ${request.lesson.topic}
Grade Level: ${request.lesson.gradeLevel}
BKD Focus: ${request.lesson.bkdFocus}
Objectives: ${(request.lesson.objectives as string[]).join(", ")}
Assessment: ${request.lesson.assessment}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a ${request.assignmentType} based on this lesson:\n${lessonContext}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    
    const questions: AssignmentQuestion[] = (parsed.questions || []).map((q: any, i: number) => ({
      id: randomUUID(),
      type: q.type || "short_answer",
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points || 10,
      bkdFocus: q.bkdFocus,
    }));

    return {
      title: parsed.title || `${request.lesson.title} - ${request.assignmentType.charAt(0).toUpperCase() + request.assignmentType.slice(1)}`,
      description: parsed.description || `A ${request.assignmentType} based on the lesson: ${request.lesson.title}`,
      instructions: parsed.instructions || getDefaultInstructions(request.assignmentType),
      questions,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      accommodationModified: !!request.accommodationType,
      accommodationType: request.accommodationType,
      accommodationNotes: request.accommodationNotes,
      worksheet: extractWorksheetMetadata(request.lesson),
      accommodationChecklist: getDefaultAccommodationChecklist(request.accommodationType),
    };
  } catch (error) {
    console.error("AI assignment generation error:", error);
    return generateMockAssignment(request);
  }
}

function extractWorksheetMetadata(lesson: Lesson): WorksheetMetadata {
  const objectives = lesson.objectives as string[] || [];
  const bkdContent = lesson.bkdContent as any || {};
  const essentialQs = lesson.essentialQuestions as string[] | string | undefined;
  const essentialQuestionsText = Array.isArray(essentialQs) 
    ? essentialQs.join("; ") 
    : (essentialQs || bkdContent.essentialQuestions || "What key question drives this lesson?");
  
  return {
    course: (lesson as any).subject || lesson.topic || "Course Name",
    unit: lesson.topic || "Unit Topic",
    contentObjective: (Array.isArray(lesson.standards) ? lesson.standards.join(", ") : (lesson.standards || "")) || objectives[0] || "Content objective from TEKS",
    lessonObjective: objectives.join("; ") || "Lesson objectives",
    lysMethodology: {
      be: bkdContent.be?.identity || bkdContent.be?.values || bkdContent.be || "Character/Values/Principles focus",
      know: bkdContent.know?.resources || bkdContent.know?.concepts || bkdContent.know || "Resources and knowledge available to students",
      do: bkdContent.do?.action || bkdContent.do?.skills || bkdContent.do || "Execute with Excellence action steps",
    },
    essentialQuestions: essentialQuestionsText,
    lessonClose: lesson.assessment || "Lesson close summary and reflection",
    gradeLevel: lesson.gradeLevel || "Grade Level",
    duration: lesson.duration || "Duration",
    standards: (Array.isArray(lesson.standards) ? lesson.standards.join(", ") : (lesson.standards || "")) || "TEKS/Standards",
  };
}

function getDefaultAccommodationChecklist(accommodationType?: string): AccommodationChecklist {
  const defaults: AccommodationChecklist = {
    extraTime: false,
    notesCopyProvided: false,
    studySheetProvided: false,
    graphicOrganizer: false,
    mnemonicDevices: false,
    largerFont: false,
    shortenedText: false,
    peerSupport: false,
    preferentialSeating: false,
    frequentReminders: false,
    completedExample: false,
    visualOrganizer: false,
  };

  if (accommodationType === "IEP") {
    return {
      ...defaults,
      extraTime: true,
      notesCopyProvided: true,
      graphicOrganizer: true,
      visualOrganizer: true,
    };
  } else if (accommodationType === "504") {
    return {
      ...defaults,
      extraTime: true,
      preferentialSeating: true,
      frequentReminders: true,
    };
  } else if (accommodationType === "BIP") {
    return {
      ...defaults,
      frequentReminders: true,
      peerSupport: true,
      completedExample: true,
    };
  }

  return defaults;
}

function getDefaultInstructions(type: string): string {
  switch (type) {
    case "quiz":
      return "Read each question carefully and select or write the best answer. You have the full class period to complete this quiz.";
    case "worksheet":
      return "Complete all sections of this worksheet. Show your work where applicable.";
    case "project":
      return "Follow the project guidelines below. Be creative and apply what you learned from the lesson.";
    case "discussion":
      return "Read the discussion prompts and provide thoughtful responses. Support your ideas with examples from the lesson.";
    case "reflection":
      return "Reflect on the lesson and your learning experience. Be honest and thoughtful in your responses.";
    default:
      return "Complete all items in this assignment.";
  }
}

function generateMockAssignment(request: GenerateAssignmentRequest): GeneratedAssignment {
  const questions: AssignmentQuestion[] = [];
  const types: ("multiple_choice" | "short_answer" | "essay" | "true_false")[] = 
    request.assignmentType === "quiz" 
      ? ["multiple_choice", "true_false", "short_answer"]
      : request.assignmentType === "reflection"
      ? ["essay", "short_answer"]
      : ["short_answer", "essay", "multiple_choice"];

  const bkdFocuses: ("be" | "know" | "do")[] = request.includeBeKnowDo 
    ? ["be", "know", "do"]
    : ["know", "do"];

  for (let i = 0; i < request.questionCount; i++) {
    const type = types[i % types.length];
    const bkdFocus = bkdFocuses[i % bkdFocuses.length];
    
    const question: AssignmentQuestion = {
      id: randomUUID(),
      type,
      question: getQuestionByType(type, bkdFocus, request.lesson, i + 1),
      points: type === "essay" ? 20 : type === "short_answer" ? 10 : 5,
      bkdFocus,
    };

    if (type === "multiple_choice") {
      question.options = ["Option A", "Option B", "Option C", "Option D"];
      question.correctAnswer = "Option A";
    } else if (type === "true_false") {
      question.options = ["True", "False"];
      question.correctAnswer = "True";
    }

    questions.push(question);
  }

  return {
    title: `${request.lesson.title} - ${request.assignmentType.charAt(0).toUpperCase() + request.assignmentType.slice(1)}`,
    description: `A ${request.difficulty} difficulty ${request.assignmentType} covering the key concepts from "${request.lesson.title}".`,
    instructions: getDefaultInstructions(request.assignmentType),
    questions,
    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
    accommodationModified: !!request.accommodationType,
    accommodationType: request.accommodationType,
    accommodationNotes: request.accommodationNotes,
    worksheet: extractWorksheetMetadata(request.lesson),
    accommodationChecklist: getDefaultAccommodationChecklist(request.accommodationType),
  };
}

function getQuestionByType(type: string, bkdFocus: "be" | "know" | "do", lesson: Lesson, num: number): string {
  const bkdQuestions = {
    be: [
      `How does the concept of "${lesson.topic}" relate to your personal values and goals?`,
      `Reflect on a time when understanding "${lesson.topic}" would have helped you in a real-life situation.`,
      `What character traits are important when applying knowledge about "${lesson.topic}"?`,
    ],
    know: [
      `What are the key concepts covered in the lesson about "${lesson.topic}"?`,
      `Explain the main principles of "${lesson.topic}" in your own words.`,
      `What resources or strategies can help you learn more about "${lesson.topic}"?`,
    ],
    do: [
      `Describe one action step you can take to apply what you learned about "${lesson.topic}".`,
      `Create a plan for using your knowledge of "${lesson.topic}" in the next week.`,
      `What measurable goal could you set related to "${lesson.topic}"?`,
    ],
  };

  const questions = bkdQuestions[bkdFocus];
  return questions[(num - 1) % questions.length];
}
