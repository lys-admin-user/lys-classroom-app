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

// Polymorphic Question Schema following Learning Standard Schema best practices
interface QuestionRubric {
  correctAnswer: string | string[];
  distractors?: {
    option: string;
    feedback: string;  // Specific feedback for why this answer is incorrect
  }[];
  partialCreditRules?: {
    condition: string;
    points: number;
  }[];
}

interface StandardMapping {
  standardId: string;           // GUID of the standard
  humanCoding: string;          // Friendly code like "K.CC.A.1" or "TEKS.MATH.1.1"
  fullStatement: string;        // The actual learning requirement
  alignmentStrength: number;    // 1.0 = Direct, 0.8 = Partial, 0.5 = Related
}

interface AssignmentQuestion {
  id: string;
  type: "multiple_choice" | "short_answer" | "essay" | "true_false" | "matching" | "drag_drop" | "hotspot";
  stimulus: string;             // The text/image/video prompt the student sees first
  question: string;             // The actual question
  options?: string[];
  rubric: QuestionRubric;       // Defines correct answer and distractor feedback
  points: number;
  bkdFocus?: "be" | "know" | "do";
  standardMappings?: StandardMapping[];  // Many-to-many relationship with standards
  bloomsLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  depthOfKnowledge?: 1 | 2 | 3 | 4;  // Webb's DOK levels
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
Mix question types appropriately for a ${request.assignmentType}.

IMPORTANT: Use the Polymorphic Question Schema for each question:
- Each question must have a "stimulus" (context/scenario the student reads first)
- Each question must have a "rubric" object with:
  - "correctAnswer": the correct answer
  - "distractors": array of {option, feedback} for wrong answers explaining WHY it's wrong
- Include "bloomsLevel" (remember/understand/apply/analyze/evaluate/create)
- Include "depthOfKnowledge" (1-4) using Webb's DOK levels

For multiple choice questions, provide 4 options with specific feedback for each distractor.
This feedback helps students understand their misconceptions.

Return JSON with this structure:
{
  "title": "string",
  "description": "string",
  "instructions": "string",
  "questions": [
    {
      "type": "multiple_choice|short_answer|essay|true_false|matching|drag_drop",
      "stimulus": "Context or scenario presented first",
      "question": "The actual question",
      "options": ["A", "B", "C", "D"] (for MC/TF),
      "rubric": {
        "correctAnswer": "A",
        "distractors": [
          {"option": "B", "feedback": "Why this is incorrect"},
          {"option": "C", "feedback": "Why this is incorrect"},
          {"option": "D", "feedback": "Why this is incorrect"}
        ]
      },
      "points": 10,
      "bkdFocus": "be|know|do",
      "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
      "depthOfKnowledge": 1-4
    }
  ]
}`;

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
      stimulus: q.stimulus || "",
      question: q.question,
      options: q.options,
      rubric: q.rubric || {
        correctAnswer: q.correctAnswer || "",
        distractors: q.options?.filter((o: string) => o !== q.correctAnswer).map((o: string) => ({
          option: o,
          feedback: "This answer is not correct."
        })) || []
      },
      points: q.points || 10,
      bkdFocus: q.bkdFocus,
      bloomsLevel: q.bloomsLevel || "understand",
      depthOfKnowledge: q.depthOfKnowledge || 2,
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
  const bkdFocus = lesson.bkdFocus || "know";
  const standards = lesson.standards || "";
  
  // Generate BKD methodology content based on the lesson's focus and objectives
  const bkdMethodology = {
    be: bkdFocus === "be" 
      ? objectives[0] || "Character and values development focus"
      : "Reflect on personal values and identity in this context",
    know: bkdFocus === "know"
      ? objectives[0] || "Key concepts and knowledge to acquire"
      : objectives.length > 1 ? objectives[1] : "Understanding core concepts and information",
    do: bkdFocus === "do"
      ? objectives[0] || "Practical skills and action steps"
      : objectives.length > 2 ? objectives[2] : "Apply learning through hands-on practice",
  };

  // Generate essential questions from objectives
  const essentialQuestions = objectives.length > 0
    ? `How can students demonstrate understanding of: ${objectives[0]}?`
    : "What key concepts will students master in this lesson?";
  
  return {
    course: lesson.topic || "Course Name",
    unit: lesson.title || "Unit Topic",
    contentObjective: standards || objectives[0] || "Content objective from TEKS",
    lessonObjective: objectives.join("; ") || "Lesson objectives",
    lysMethodology: bkdMethodology,
    essentialQuestions: essentialQuestions,
    lessonClose: lesson.assessment || "Assessment and reflection on learning",
    gradeLevel: lesson.gradeLevel || "Grade Level",
    duration: lesson.duration || "Duration",
    standards: standards || "TEKS/Standards",
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
  // Instructions are left blank for educators to fill in
  return "";
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
    const { stimulus, questionText } = getQuestionByType(type, bkdFocus, request.lesson, i + 1);
    
    // Determine Bloom's level based on BKD focus
    const bloomsLevel = bkdFocus === "be" ? "evaluate" as const
      : bkdFocus === "know" ? "understand" as const
      : "apply" as const;
    
    // Determine DOK based on question type
    const typeStr = type as string;
    const depthOfKnowledge = (typeStr === "essay" ? 4 
      : typeStr === "short_answer" ? 3 
      : typeStr === "matching" ? 2 
      : 1) as 1 | 2 | 3 | 4;
    
    const question: AssignmentQuestion = {
      id: randomUUID(),
      type,
      stimulus,
      question: questionText,
      points: type === "essay" ? 20 : type === "short_answer" ? 10 : 5,
      bkdFocus,
      bloomsLevel,
      depthOfKnowledge,
      rubric: {
        correctAnswer: "",
        distractors: []
      }
    };

    if (type === "multiple_choice") {
      question.options = [
        `Key concept related to ${request.lesson.topic}`,
        `Common misconception about ${request.lesson.topic}`,
        `Partially correct but incomplete answer`,
        `Unrelated concept`
      ];
      question.rubric = {
        correctAnswer: question.options[0],
        distractors: [
          { option: question.options[1], feedback: `This is a common misconception. Review the core principles of ${request.lesson.topic}.` },
          { option: question.options[2], feedback: `This is partially correct but missing key elements. Consider all aspects covered in the lesson.` },
          { option: question.options[3], feedback: `This answer is not related to the topic. Focus on what was covered in the lesson.` }
        ]
      };
    } else if (type === "true_false") {
      question.options = ["True", "False"];
      question.rubric = {
        correctAnswer: "True",
        distractors: [
          { option: "False", feedback: `Review the key concepts from the lesson about ${request.lesson.topic}.` }
        ]
      };
    } else {
      // Short answer, essay
      question.rubric = {
        correctAnswer: `Expected response should demonstrate understanding of ${request.lesson.topic}`,
        partialCreditRules: [
          { condition: "Mentions key concepts", points: Math.floor(question.points * 0.5) },
          { condition: "Provides examples", points: Math.floor(question.points * 0.3) },
          { condition: "Shows personal reflection", points: Math.floor(question.points * 0.2) }
        ]
      };
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

function getQuestionByType(type: string, bkdFocus: "be" | "know" | "do", lesson: Lesson, num: number): { stimulus: string; questionText: string } {
  // Polymorphic question data with stimulus (context) and question text
  const bkdQuestionData = {
    be: [
      {
        stimulus: `Think about the topic "${lesson.topic}" and how it connects to who you are as a person.`,
        questionText: `How does the concept of "${lesson.topic}" relate to your personal values and goals?`
      },
      {
        stimulus: `Consider a real-world scenario where understanding "${lesson.topic}" would be valuable.`,
        questionText: `Reflect on a time when understanding "${lesson.topic}" would have helped you in a real-life situation.`
      },
      {
        stimulus: `Character and values are essential when applying any knowledge. Consider "${lesson.topic}" in this context.`,
        questionText: `What character traits are important when applying knowledge about "${lesson.topic}"?`
      },
    ],
    know: [
      {
        stimulus: `Review what you learned in today's lesson about "${lesson.topic}".`,
        questionText: `What are the key concepts covered in the lesson about "${lesson.topic}"?`
      },
      {
        stimulus: `Demonstrate your understanding by explaining concepts in your own words.`,
        questionText: `Explain the main principles of "${lesson.topic}" in your own words.`
      },
      {
        stimulus: `Consider how you might continue learning about "${lesson.topic}" beyond this lesson.`,
        questionText: `What resources or strategies can help you learn more about "${lesson.topic}"?`
      },
    ],
    do: [
      {
        stimulus: `Think about practical ways to apply what you've learned about "${lesson.topic}".`,
        questionText: `Describe one action step you can take to apply what you learned about "${lesson.topic}".`
      },
      {
        stimulus: `Planning helps turn knowledge into action. Consider "${lesson.topic}" and the coming week.`,
        questionText: `Create a plan for using your knowledge of "${lesson.topic}" in the next week.`
      },
      {
        stimulus: `Goals should be specific and measurable. Think about "${lesson.topic}" and what you want to achieve.`,
        questionText: `What measurable goal could you set related to "${lesson.topic}"?`
      },
    ],
  };

  const questionDataList = bkdQuestionData[bkdFocus];
  return questionDataList[(num - 1) % questionDataList.length];
}
