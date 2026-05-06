import OpenAI from "openai";
import type { Lesson } from "@shared/schema";
import { randomUUID } from "crypto";
import { buildAfricanPromptAddendum } from "@shared/africaContext";
import { sanitizePromptText, stripPII } from "./services/piiSanitizer";
import { LYS_ACCOMMODATIONS, LYS_BKD_VOCAB, LYS_DOMAINS } from "./lysReference";
import { storage } from "./storage";
import { buildVoiceBlock } from "./services/voiceProfileService";
import { critiqueAndMaybeRewrite } from "./services/voiceCriticService";
import { normalizeSubject as normalizeSubjectFromCanon } from "./services/lysCanonService";

let _asgnFlagCache: { value: boolean; at: number } | null = null;
async function isVoiceInfusionEnabled(): Promise<boolean> {
  if (_asgnFlagCache && Date.now() - _asgnFlagCache.at < 60_000) return _asgnFlagCache.value;
  try {
    const flag = await storage.getFeatureFlagByName("new_lesson_retrieval");
    const value = !!flag?.isEnabled;
    _asgnFlagCache = { value, at: Date.now() };
    return value;
  } catch {
    return false;
  }
}

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Project Template Types for "Low-Floor, High-Ceiling" method
type ProjectTemplateType = "community_consultant" | "kitchen_lab" | "digital_storyteller" | "custom";

interface ProjectPhase {
  name: string;
  asyncTask: string;
  syncTask: string;
  materials: string[];
  deliverable: string;
  estimatedTime: string;
}

interface ProjectTemplate {
  id: ProjectTemplateType;
  name: string;
  description: string;
  lowFloor: string;   // Easy entry point
  highCeiling: string; // Advanced extension
  phases: ProjectPhase[];
  materials: string[];
  standardAlignment: string[];
  bkdFocus: "be" | "know" | "do";
}

interface GenerateAssignmentRequest {
  lesson: Lesson;
  assignmentType: "quiz" | "worksheet" | "project" | "discussion" | "reflection";
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  includeBeKnowDo: boolean;
  accommodationTypes?: string[];
  accommodationNotes?: string;
  projectTemplate?: ProjectTemplateType;
  differentiationLevel?: "standard" | "scaffolded" | "enrichment"; // Tiered question generation
  // African / WAEC support — optional country (display name) and bilingual local language.
  // Ignored for non-African countries; the addendum builder returns "" in that case.
  country?: string;
  language?: string;
}

// Differentiation level configurations
interface DifferentiationConfig {
  bloomsLevels: string[];
  dokLevels: number[];
  scaffoldingRequired: boolean;
  extendedThinking: boolean;
  vocabularyLevel: "basic" | "grade-level" | "advanced";
  questionComplexity: "simplified" | "standard" | "complex";
}

const DIFFERENTIATION_CONFIGS: Record<string, DifferentiationConfig> = {
  scaffolded: {
    bloomsLevels: ["remember", "understand"],
    dokLevels: [1, 2],
    scaffoldingRequired: true,
    extendedThinking: false,
    vocabularyLevel: "basic",
    questionComplexity: "simplified",
  },
  standard: {
    bloomsLevels: ["understand", "apply", "analyze"],
    dokLevels: [2, 3],
    scaffoldingRequired: false,
    extendedThinking: false,
    vocabularyLevel: "grade-level",
    questionComplexity: "standard",
  },
  enrichment: {
    bloomsLevels: ["analyze", "evaluate", "create"],
    dokLevels: [3, 4],
    scaffoldingRequired: false,
    extendedThinking: true,
    vocabularyLevel: "advanced",
    questionComplexity: "complex",
  },
};

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

interface ReflectionPrompt {
  style: "socratic" | "hebraic" | "bkd";
  category: string;
  prompt: string;
  followUp?: string;
  connectionToObjective?: string;
}

interface GeneratedProject {
  templateType: ProjectTemplateType;
  templateName: string;
  lowFloor: string;
  highCeiling: string;
  phases: ProjectPhase[];
  materials: string[];
  rubric: {
    criteria: string;
    exemplary: string;
    proficient: string;
    developing: string;
    beginning: string;
    points: number;
  }[];
  extensions: string[];
  reflectionPrompts: ReflectionPrompt[];
}

interface GeneratedAssignment {
  title: string;
  description: string;
  instructions: string;
  questions: AssignmentQuestion[];
  totalPoints: number;
  accommodationModified: boolean;
  accommodationTypes?: string[];
  accommodationNotes?: string;
  worksheet: WorksheetMetadata;
  accommodationChecklist: AccommodationChecklist;
  project?: GeneratedProject;
}

const accommodationGuidelines: Record<string, string> = {
  extraTime: "Provide extended time (1.5x to 2x) for completing the assignment",
  notesCopyProvided: "Provide copies of notes or presentation slides with the assignment",
  studySheetProvided: "Include a study sheet with key concepts and vocabulary",
  graphicOrganizer: "Use graphic organizers to structure information visually",
  mnemonicDevices: "Include mnemonic devices to aid in memorization",
  largerFont: "Use larger font size (14pt or larger) for readability",
  shortenedText: "Reduce reading length while maintaining key concepts",
  peerSupport: "Allow peer buddy support for collaborative learning",
  preferentialSeating: "Note that student has preferential seating near instruction",
  frequentReminders: "Include regular check-in points and on-task prompts",
  completedExample: "Provide a completed example before independent work",
  visualOrganizer: "Use visual schedules and checklists for task completion",
};

// "Low-Floor, High-Ceiling" Project Templates
const PROJECT_TEMPLATES: Record<ProjectTemplateType, ProjectTemplate> = {
  community_consultant: {
    id: "community_consultant",
    name: "Community Consultant",
    description: "Service Learning: Students identify a real-world problem in their neighborhood or school and propose a solution.",
    lowFloor: "Take photos with a phone and describe a problem you see in your community using paper and pencil.",
    highCeiling: "Design a comprehensive action plan with budget, timeline, stakeholder analysis, and present to actual community leaders.",
    bkdFocus: "do",
    materials: ["Digital camera or smartphone", "Free Google Slides or Canva", "Interview questions template", "Community mapping worksheet"],
    standardAlignment: ["Service Learning", "Civic Engagement", "Problem Solving", "Communication"],
    phases: [
      {
        name: "Launch",
        asyncTask: "Watch a 2-minute video about community change-makers. Brainstorm problems you notice in your neighborhood.",
        syncTask: "Class discussion: Share problems observed. Teacher facilitates Q&A to spark interest.",
        materials: ["Hook video", "Brainstorm worksheet"],
        deliverable: "List of 3-5 community problems",
        estimatedTime: "Day 1"
      },
      {
        name: "Research",
        asyncTask: "Photo-document the problem. Interview 2-3 community members about the issue.",
        syncTask: "Think-Pair-Share: Students discuss findings in pairs, then share with class.",
        materials: ["Phone/camera", "Interview guide"],
        deliverable: "Photo essay with interview notes",
        estimatedTime: "Days 2-4"
      },
      {
        name: "Iteration",
        asyncTask: "Create draft solution proposal with sketches or slides. Submit for feedback.",
        syncTask: "Peer-review 'Critique Circles': Give and receive structured feedback.",
        materials: ["Slides template", "Feedback rubric"],
        deliverable: "Draft proposal v2",
        estimatedTime: "Days 5-7"
      },
      {
        name: "Showcase",
        asyncTask: "Upload final project to class gallery. Write reflection on learning.",
        syncTask: "Present to peer 'Board of Directors' panel for feedback and questions.",
        materials: ["Presentation tools", "Reflection template"],
        deliverable: "Final presentation + reflection",
        estimatedTime: "Day 8-10"
      }
    ]
  },
  kitchen_lab: {
    id: "kitchen_lab",
    name: "Kitchen Lab",
    description: "Inquiry-Based: Students use household items to test scientific or mathematical principles.",
    lowFloor: "Use water and salt to conduct a simple experiment and draw what you observe.",
    highCeiling: "Design a multi-variable experiment, collect quantitative data, create graphs, and draw evidence-based conclusions.",
    bkdFocus: "know",
    materials: ["Water", "Salt", "Food coloring", "Measuring cups", "Timer", "Recycled cardboard", "Shadows (sunlight)"],
    standardAlignment: ["Experimental Design", "Scientific Method", "Data Analysis", "Geometry"],
    phases: [
      {
        name: "Launch",
        asyncTask: "Watch video on the scientific method. Write a question you want to investigate.",
        syncTask: "Teacher demo of sample experiment. Class brainstorm on testable questions.",
        materials: ["Demo materials", "Question template"],
        deliverable: "Research question + hypothesis",
        estimatedTime: "Day 1"
      },
      {
        name: "Research",
        asyncTask: "Gather materials at home. Design your experiment procedure step-by-step.",
        syncTask: "Lab partner check-in: Review each other's procedures for clarity.",
        materials: ["Household items", "Procedure template"],
        deliverable: "Written procedure",
        estimatedTime: "Days 2-3"
      },
      {
        name: "Iteration",
        asyncTask: "Conduct experiment. Record time-lapse or take photos of each stage. Collect data.",
        syncTask: "Data analysis session: Create graphs, identify patterns.",
        materials: ["Camera", "Data table", "Graph paper"],
        deliverable: "Data + visuals",
        estimatedTime: "Days 4-6"
      },
      {
        name: "Showcase",
        asyncTask: "Create a 'Lab Report' poster or digital presentation.",
        syncTask: "Science fair style: Gallery walk where students explain their experiments.",
        materials: ["Poster/slides", "Presentation rubric"],
        deliverable: "Lab report + presentation",
        estimatedTime: "Days 7-8"
      }
    ]
  },
  digital_storyteller: {
    id: "digital_storyteller",
    name: "Digital Storyteller",
    description: "Creative Synthesis: Students teach a concept they just learned by creating a 'Manual' or 'Mini-Movie' for a younger student.",
    lowFloor: "Draw a comic strip or write a simple story explaining the concept to a friend.",
    highCeiling: "Produce a polished educational video with script, visuals, voiceover, and interactive elements.",
    bkdFocus: "be",
    materials: ["Paper and colored pencils", "Free Adobe Express", "Loom (free)", "Canva", "Notebook"],
    standardAlignment: ["Communication", "Creative Expression", "Content Mastery", "Digital Literacy"],
    phases: [
      {
        name: "Launch",
        asyncTask: "Review the concept to be taught. Identify key ideas a younger student needs to know.",
        syncTask: "Class discussion: What makes explanations clear? Analyze examples of good teaching.",
        materials: ["Concept notes", "Examples of tutorials"],
        deliverable: "Key concepts list",
        estimatedTime: "Day 1"
      },
      {
        name: "Research",
        asyncTask: "Create a script or storyboard for your explanation. Decide on format (comic, video, booklet).",
        syncTask: "Peer feedback on scripts: Is it clear? What's missing?",
        materials: ["Storyboard template", "Script outline"],
        deliverable: "Script/storyboard draft",
        estimatedTime: "Days 2-3"
      },
      {
        name: "Iteration",
        asyncTask: "Create your 'teaching material' - draw, record, or design your content.",
        syncTask: "Work session with check-ins. Teacher provides mini-lessons on tools as needed.",
        materials: ["Chosen creation tools"],
        deliverable: "Draft teaching material",
        estimatedTime: "Days 4-6"
      },
      {
        name: "Showcase",
        asyncTask: "Polish and upload final product. Write reflection: 'What did I learn by teaching?'",
        syncTask: "Presentation to class or 'buddy class' of younger students.",
        materials: ["Final product", "Reflection prompt"],
        deliverable: "Final teaching material + reflection",
        estimatedTime: "Days 7-8"
      }
    ]
  },
  custom: {
    id: "custom",
    name: "Custom Project",
    description: "Create a custom project tailored to your specific lesson objectives.",
    lowFloor: "Start with basic materials and simple tasks accessible to all students.",
    highCeiling: "Extend with advanced challenges for students ready for deeper exploration.",
    bkdFocus: "do",
    materials: ["To be determined based on project"],
    standardAlignment: ["Custom alignment"],
    phases: [
      {
        name: "Launch",
        asyncTask: "Introduction to the project topic and requirements.",
        syncTask: "Class discussion and project overview.",
        materials: ["Project guidelines"],
        deliverable: "Project plan",
        estimatedTime: "Day 1"
      },
      {
        name: "Research",
        asyncTask: "Gather information and materials needed for the project.",
        syncTask: "Collaborative research and planning session.",
        materials: ["Research resources"],
        deliverable: "Research notes",
        estimatedTime: "Days 2-4"
      },
      {
        name: "Iteration",
        asyncTask: "Create project draft and refine based on feedback.",
        syncTask: "Peer review and revision workshop.",
        materials: ["Draft materials"],
        deliverable: "Revised project",
        estimatedTime: "Days 5-7"
      },
      {
        name: "Showcase",
        asyncTask: "Finalize and submit project.",
        syncTask: "Class presentations and celebration.",
        materials: ["Final project"],
        deliverable: "Completed project",
        estimatedTime: "Days 8-10"
      }
    ]
  }
};

function generateProjectFromTemplate(
  lesson: Lesson,
  templateType: ProjectTemplateType,
  difficulty: string
): GeneratedProject {
  const template = PROJECT_TEMPLATES[templateType] || PROJECT_TEMPLATES.custom;
  
  // Customize the template based on the lesson
  const customizedPhases = template.phases.map(phase => ({
    ...phase,
    asyncTask: phase.asyncTask.replace(/the concept|the topic/gi, `"${lesson.topic}"`),
    syncTask: phase.syncTask.replace(/the concept|the topic/gi, `"${lesson.topic}"`),
  }));

  // Generate rubric criteria based on difficulty
  const rubricCriteria = [
    {
      criteria: "Understanding of Concept",
      exemplary: `Demonstrates deep understanding of ${lesson.topic} with original insights.`,
      proficient: `Shows solid understanding of ${lesson.topic} with accurate explanations.`,
      developing: `Shows basic understanding of ${lesson.topic} with some gaps.`,
      beginning: `Shows limited understanding of ${lesson.topic}. Needs revision.`,
      points: difficulty === "hard" ? 30 : difficulty === "medium" ? 25 : 20
    },
    {
      criteria: "Quality of Work",
      exemplary: "Work is polished, creative, and exceeds expectations.",
      proficient: "Work is complete, neat, and meets all requirements.",
      developing: "Work is mostly complete but lacks attention to detail.",
      beginning: "Work is incomplete or does not meet basic requirements.",
      points: difficulty === "hard" ? 25 : difficulty === "medium" ? 25 : 20
    },
    {
      criteria: "Process & Effort",
      exemplary: "Evidence of iteration, revision, and growth throughout the project.",
      proficient: "Followed all phases and submitted work on time.",
      developing: "Completed most phases with some missed deadlines.",
      beginning: "Missed multiple phases or deadlines.",
      points: 20
    },
    {
      criteria: "Presentation & Communication",
      exemplary: "Presents ideas clearly and engages audience effectively.",
      proficient: "Communicates ideas clearly with good organization.",
      developing: "Ideas are present but organization could improve.",
      beginning: "Presentation lacks clarity or organization.",
      points: difficulty === "hard" ? 25 : difficulty === "medium" ? 25 : 20
    }
  ];

  // Generate extension activities based on difficulty
  const extensions = difficulty === "hard" ? [
    `Connect ${lesson.topic} to real-world applications beyond the classroom.`,
    "Create a follow-up project that builds on your findings.",
    "Mentor a peer who is working on a similar project.",
    "Present to an authentic audience (community members, experts, etc.)."
  ] : difficulty === "medium" ? [
    `Research how ${lesson.topic} relates to other subjects you're studying.`,
    "Add multimedia elements to enhance your project.",
    "Interview an expert or professional in this field."
  ] : [
    `Find one more example of ${lesson.topic} in your daily life.`,
    "Create a visual aid to explain your project to a younger student."
  ];

  // Generate reflection prompts incorporating Socratic, Hebraic, and Be-Know-Do styles
  // Connected to learning objectives and essential questions
  const objectives = lesson.objectives as string[] || [];
  const contentObjective = objectives[0] || `understanding ${lesson.topic}`;
  const lessonObjective = objectives.length > 1 ? objectives[1] : `mastering concepts in ${lesson.topic}`;
  
  const reflectionPrompts: ReflectionPrompt[] = [
    // SOCRATIC STYLE - Questioning to illuminate understanding
    {
      style: "socratic",
      category: "Examining Assumptions",
      prompt: `What did you assume to be true about "${lesson.topic}" before this project that you now question?`,
      followUp: "What evidence from your work challenged or confirmed this assumption?",
      connectionToObjective: contentObjective
    },
    {
      style: "socratic",
      category: "Exploring Evidence",
      prompt: `If someone disagreed with your conclusions about "${lesson.topic}", what would be their strongest argument?`,
      followUp: "How would you respond to that argument using evidence from your project?",
      connectionToObjective: lessonObjective
    },
    {
      style: "socratic",
      category: "Implications & Consequences",
      prompt: `What are the implications if your understanding of "${lesson.topic}" is correct? What changes?`,
      followUp: "Who else needs to understand this, and why does it matter to them?",
      connectionToObjective: contentObjective
    },
    {
      style: "socratic",
      category: "Meta-Questioning",
      prompt: "What question about this topic do you still not know how to answer?",
      followUp: "Why is this question important, and where might you find answers?",
      connectionToObjective: lessonObjective
    },

    // HEBRAIC STYLE - Discussion, debate, story, and life application
    {
      style: "hebraic",
      category: "Chavruta (Partner Learning)",
      prompt: "If you were to teach this project to a study partner, what would be the most important insight you would share first?",
      followUp: "What question would you want them to ask you to deepen both of your understanding?",
      connectionToObjective: contentObjective
    },
    {
      style: "hebraic",
      category: "Story & Narrative",
      prompt: `Tell the story of your learning journey with "${lesson.topic}" - what was the beginning, middle, and turning point?`,
      followUp: "What character in a story or history faced a similar challenge to what you explored?",
      connectionToObjective: lessonObjective
    },
    {
      style: "hebraic",
      category: "Action & Life Application",
      prompt: "Learning is incomplete without action. What specific action will you take in the next week because of what you learned?",
      followUp: "How will you know if your action was successful?",
      connectionToObjective: contentObjective
    },
    {
      style: "hebraic",
      category: "Generational Wisdom",
      prompt: "If you could share one insight from this project with a younger student, what would it be and why?",
      followUp: "What advice would someone who mastered this topic give to you as you continue learning?",
      connectionToObjective: lessonObjective
    },

    // BE-KNOW-DO FRAMEWORK
    {
      style: "bkd",
      category: "BE (Identity & Character)",
      prompt: `How has working on this project shaped who you are becoming as a person?`,
      followUp: "What character trait did you develop or strengthen through this work?",
      connectionToObjective: contentObjective
    },
    {
      style: "bkd",
      category: "KNOW (Knowledge & Understanding)",
      prompt: `What is the most important concept about "${lesson.topic}" that you now understand deeply?`,
      followUp: "How would you explain this concept to someone who has never encountered it?",
      connectionToObjective: lessonObjective
    },
    {
      style: "bkd",
      category: "DO (Skills & Action)",
      prompt: "What new skill did you practice or develop through this project?",
      followUp: "Where else in your life can you apply this skill?",
      connectionToObjective: contentObjective
    }
  ];

  return {
    templateType,
    templateName: template.name,
    lowFloor: template.lowFloor,
    highCeiling: template.highCeiling,
    phases: customizedPhases,
    materials: template.materials,
    rubric: rubricCriteria,
    extensions,
    reflectionPrompts
  };
}

export async function generateAssignment(request: GenerateAssignmentRequest): Promise<GeneratedAssignment> {
  if (!openai) {
    return generateMockAssignment(request);
  }

  // FERPA / privacy: scrub student PII (names, IDs, emails, phones, addresses,
  // DOBs) from the free-text accommodation notes BEFORE they reach the LLM.
  // The fixed-vocabulary `accommodationTypes` list is already safe (controlled
  // checkboxes, no free text), but `accommodationNotes` is a textarea where
  // teachers commonly paste student names and IEP details.
  const sanitizedAccommodationNotes = request.accommodationNotes
    ? sanitizePromptText(request.accommodationNotes)
    : "";
  if (request.accommodationNotes && sanitizedAccommodationNotes !== request.accommodationNotes) {
    const detected = stripPII(request.accommodationNotes).detectedPII.map(p => p.type).join(", ");
    console.log(`[PII] Redacted from accommodation notes before LLM call: ${detected}`);
  }
  const accommodationContext = request.accommodationTypes && request.accommodationTypes.length > 0
    ? `\n\nIMPORTANT ACCOMMODATION REQUIREMENTS:\n${request.accommodationTypes.map(t => `- ${accommodationGuidelines[t] || t}`).join('\n')}\n${sanitizedAccommodationNotes ? `Additional notes: ${sanitizedAccommodationNotes}` : ""}`
    : "";

  // African / WAEC context — empty string for non-African countries (no behavior change).
  const africanContext = buildAfricanPromptAddendum({
    country: request.country,
    language: request.language,
    mode: "assignment",
  });
  const africanInSystem = africanContext
    ? `\n\nWhen the user prompt below contains an "AFRICAN CONTEXT" block, you MUST follow every requirement in that block — WAEC exam framing, dual-path bridge (WAEC outcome + global digital portfolio piece), African case studies (NOT silicon valley defaults), BE-pillar emphasis to fill the WAEC "character" gap, and bilingual output formatting if requested. Treat it as overriding any default Western framing.`
    : "";

  // Voice infusion (gated by new_lesson_retrieval flag — same flag as lesson generator).
  // Subject derives from the lesson's canonical subject column, falling back to topic
  // so retrieval/normalization match what the lesson generator uses.
  const useVoice = await isVoiceInfusionEnabled();
  const lessonSubject = (request.lesson as any).subject || request.lesson.topic || "";
  const subjectKey = normalizeSubjectFromCanon(lessonSubject) || "_global";
  let voiceBlockText = "";
  let voiceSnippetIds: string[] = [];
  if (useVoice) {
    try {
      const v = await buildVoiceBlock({
        topic: request.lesson.topic || request.lesson.title || "",
        subject: lessonSubject,
        gradeLevel: request.lesson.gradeLevel || "",
        mode: "assignment",
      });
      voiceBlockText = v.block;
      voiceSnippetIds = v.snippetIds;
    } catch {
      /* non-fatal */
    }
  }

  // Get differentiation config based on difficulty level
  const differentiationLevel = request.difficulty === "easy" ? "scaffolded" 
    : request.difficulty === "hard" ? "enrichment" 
    : "standard";
  const diffConfig = DIFFERENTIATION_CONFIGS[differentiationLevel];
  
  const differentiationContext = `
DIFFERENTIATION LEVEL: ${differentiationLevel.toUpperCase()}
- Target Bloom's Levels: ${diffConfig.bloomsLevels.join(", ")}
- Depth of Knowledge: Levels ${diffConfig.dokLevels.join("-")}
- Vocabulary: ${diffConfig.vocabularyLevel}
- Question Complexity: ${diffConfig.questionComplexity}
${diffConfig.scaffoldingRequired ? "- REQUIRED: Include scaffolding (sentence starters, word banks, visual supports)" : ""}
${diffConfig.extendedThinking ? "- REQUIRED: Include extended thinking opportunities (multi-step reasoning, open-ended synthesis)" : ""}
`;

  const systemPrompt = `You are a master educator creating DISTINGUISHED-LEVEL ${request.assignmentType} assignments that align perfectly with LYS lesson plans.
${differentiationContext}

CRITICAL ALIGNMENT REQUIREMENTS:
Your assignments MUST directly align with the lesson's:
1. Learning OBJECTIVES - Every question should assess one or more lesson objectives
2. ESSENTIAL QUESTIONS - Include questions that address the lesson's essential questions
3. LYS METHODOLOGY (BE-KNOW-DO) - Balance questions across all three pillars
4. LIFE DIMENSIONS - For reflection/essay questions, connect to the 7 life dimensions (Educational, Social, Cultural, Financial, Health, Vocational, Spiritual)

BE-KNOW-DO FRAMEWORK (vocabulary distilled from real LYS teacher exemplars):
- BE questions: Identity, values, character development, self-reflection, personal growth.
  Draw from traits like: ${LYS_BKD_VOCAB.being.slice(0, 10).join(", ")}.
- KNOW questions: Knowledge, facts, concepts, understanding, resource awareness.
  Draw from strategies like: ${LYS_BKD_VOCAB.knowing.slice(0, 8).join(", ")}.
- DO questions: Skills, action steps, practical application, execution with excellence.
  Draw from actions like: ${LYS_BKD_VOCAB.doing.slice(0, 8).join(", ")}.

LIFE DIMENSIONS (use these exact 7 labels for any reflection prompt that asks students to apply learning to life): ${LYS_DOMAINS.join(", ")}.

LYS-RECOGNIZED ACCOMMODATIONS (when generating accommodation-aware variants, prefer this canonical list — same vocabulary every LYS teacher sees on the Assignment Form):
${LYS_ACCOMMODATIONS.map(a => `- ${a}`).join("\n")}

${request.includeBeKnowDo ? "Include questions from ALL three pillars (BE, KNOW, DO) with clear balance." : "Focus primarily on KNOW and DO questions."}
${accommodationContext}
${voiceBlockText}

DISTINGUISHED-LEVEL QUALITY STANDARDS:
[x] Every question directly ties to a lesson objective or essential question
[x] Questions require higher-order thinking (analyze, evaluate, create) not just recall
[x] Stimuli provide real-world context that connects to students' lives
[x] Distractors address common misconceptions with educational feedback
[x] Include at least one question connecting to character/values (BE)
[x] Include at least one question requiring practical application (DO)
[x] For essays/reflections: prompt students to connect learning to life dimensions

Create ${request.questionCount} questions at ${request.difficulty} difficulty level.
Mix question types appropriately for a ${request.assignmentType}.

POLYMORPHIC QUESTION SCHEMA:
- Each question must have a "stimulus" (real-world context/scenario presented first)
- Each question must have a "rubric" object with:
  - "correctAnswer": the correct answer
  - "distractors": array of {option, feedback} for wrong answers explaining WHY it's wrong
- Include "bloomsLevel" (remember/understand/apply/analyze/evaluate/create)
- Include "depthOfKnowledge" (1-4) using Webb's DOK levels
- Include "objectiveAlignment" - which lesson objective this question assesses

For multiple choice questions, provide 4 options with specific educational feedback for each distractor.

Return JSON with this structure:
{
  "title": "string",
  "description": "string - include how this assignment reinforces lesson objectives",
  "instructions": "string - include BE-KNOW-DO focus and expectations",
  "questions": [
    {
      "type": "multiple_choice|short_answer|essay|true_false|matching|drag_drop",
      "stimulus": "Real-world context or scenario that engages students",
      "question": "The actual question tied to lesson objectives",
      "options": ["A", "B", "C", "D"] (for MC/TF),
      "rubric": {
        "correctAnswer": "A",
        "distractors": [
          {"option": "B", "feedback": "Educational feedback on why this is incorrect"},
          {"option": "C", "feedback": "Educational feedback on why this is incorrect"},
          {"option": "D", "feedback": "Educational feedback on why this is incorrect"}
        ]
      },
      "points": 10,
      "bkdFocus": "be|know|do",
      "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
      "depthOfKnowledge": 1-4,
      "objectiveAlignment": "Which lesson objective this assesses"
    }
  ],
  "lifeDimensionConnections": {
    "educational": "How assignment connects to learning journey",
    "vocational": "Career relevance of skills assessed",
    "social": "How this connects to relationships/collaboration"
  }
}${africanInSystem}`;

  // Extract lesson components for alignment
  const lessonObjectives = request.lesson.objectives as string[] || [];
  const lessonActivities = request.lesson.activities as { title: string; description: string; type: string }[] || [];
  const lessonMaterials = request.lesson.materials as string[] || [];
  const lysMethodology = (request.lesson as any).lysMethodology as { be?: { focus: string; description: string }; know?: { focus: string; description: string }; do?: { focus: string; description: string } } || {};
  
  const lessonContext = `
=== LESSON ALIGNMENT DATA ===

LESSON TITLE: ${request.lesson.title}
TOPIC: ${request.lesson.topic}
GRADE LEVEL: ${request.lesson.gradeLevel}
DURATION: ${request.lesson.duration || "45 minutes"}
PRIMARY BKD FOCUS: ${request.lesson.bkdFocus?.toUpperCase()}

LEARNING OBJECTIVES (Questions MUST assess these):
${lessonObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

LYS METHODOLOGY COMPONENTS:
- BE (Character/Values): ${lysMethodology.be?.focus || "Identity development"} - ${lysMethodology.be?.description || "Character growth through learning"}
- KNOW (Resources/Knowledge): ${lysMethodology.know?.focus || "Skill development"} - ${lysMethodology.know?.description || "Building understanding"}
- DO (Execute/Excellence): ${lysMethodology.do?.focus || "Action steps"} - ${lysMethodology.do?.description || "Practical application"}

LESSON ACTIVITIES (for context):
${lessonActivities.map(a => `- ${a.title} (${a.type}): ${a.description}`).join('\n')}

MATERIALS USED: ${lessonMaterials.join(', ')}

ASSESSMENT APPROACH: ${request.lesson.assessment}

=== END LESSON DATA ===

Create a ${request.assignmentType} that directly assesses mastery of the above objectives while reinforcing the BE-KNOW-DO methodology.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a ${request.assignmentType} based on this lesson:\n${lessonContext}${africanContext}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content);
    
    const questions: AssignmentQuestion[] = (parsed.questions || []).map((q: any, i: number) => {
      // Map objectives to standards format for alignment tracking
      const objectiveAlignment = q.objectiveAlignment || lessonObjectives[i % lessonObjectives.length] || "";
      const standardMappings: StandardMapping[] = objectiveAlignment ? [{
        standardId: randomUUID(),
        humanCoding: `OBJ-${i + 1}`,
        fullStatement: objectiveAlignment,
        alignmentStrength: 1.0
      }] : [];

      return {
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
        standardMappings,
        bloomsLevel: q.bloomsLevel || "understand",
        depthOfKnowledge: q.depthOfKnowledge || 2,
      };
    });

    let assignmentResult: GeneratedAssignment = {
      title: parsed.title || `${request.lesson.title} - ${request.assignmentType.charAt(0).toUpperCase() + request.assignmentType.slice(1)}`,
      description: parsed.description || `A ${request.assignmentType} based on the lesson: ${request.lesson.title}`,
      instructions: parsed.instructions || getDefaultInstructions(request.assignmentType),
      questions,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      accommodationModified: !!(request.accommodationTypes && request.accommodationTypes.length > 0),
      accommodationTypes: request.accommodationTypes,
      accommodationNotes: request.accommodationNotes,
      worksheet: extractWorksheetMetadata(request.lesson),
      accommodationChecklist: getDefaultAccommodationChecklist(request.accommodationTypes),
    };

    // Voice critic post-pass + attribution (only when flag on)
    let voiceMeta: { voiceScore: number | null; tellsDetected: string[]; rewritten: boolean; notes?: string } = {
      voiceScore: null, tellsDetected: [], rewritten: false,
    };
    if (useVoice) {
      try {
        const critic = await critiqueAndMaybeRewrite(assignmentResult, {
          topic: request.lesson.topic || request.lesson.title || "",
          subject: lessonSubject,
          gradeLevel: request.lesson.gradeLevel || "",
          mode: "assignment",
        });
        if (critic.rewritten && critic.finalContent) {
          assignmentResult = critic.finalContent;
        }
        voiceMeta = { voiceScore: critic.voiceScore, tellsDetected: critic.tellsDetected, rewritten: critic.rewritten, notes: critic.notes };
      } catch {
        /* non-fatal */
      }
    }

    try {
      await storage.createAssignmentAttribution({
        assignmentId: null,
        lessonId: (request.lesson as any).id ?? null,
        userId: null,
        topic: request.lesson.topic || null,
        subject: subjectKey,
        gradeLevel: request.lesson.gradeLevel || null,
        assignmentType: request.assignmentType,
        canonEntryIds: [],
        voiceSnippetIds,
        voiceScore: voiceMeta.voiceScore,
        voiceCritique: { tellsDetected: voiceMeta.tellsDetected, notes: voiceMeta.notes },
        rewritten: voiceMeta.rewritten,
        retrievalMode: useVoice ? "semantic" : "legacy",
      });
    } catch (err) {
      console.warn("[assignmentGenerator] attribution insert failed (non-fatal):", (err as Error).message);
    }

    return assignmentResult;
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

function getDefaultAccommodationChecklist(accommodationTypes?: string[]): AccommodationChecklist {
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

  if (!accommodationTypes || accommodationTypes.length === 0) {
    return defaults;
  }

  // Set each selected accommodation to true
  const checklist = { ...defaults };
  for (const accType of accommodationTypes) {
    if (accType in checklist) {
      (checklist as any)[accType] = true;
    }
  }
  
  return checklist;
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
    
    // Extract objective for alignment
    const lessonObjectives = request.lesson.objectives as string[] || [];
    const alignedObjective = lessonObjectives[i % lessonObjectives.length] || `Understanding ${request.lesson.topic}`;
    
    const question: AssignmentQuestion = {
      id: randomUUID(),
      type,
      stimulus,
      question: questionText,
      points: type === "essay" ? 20 : type === "short_answer" ? 10 : 5,
      bkdFocus,
      bloomsLevel,
      depthOfKnowledge,
      standardMappings: [{
        standardId: randomUUID(),
        humanCoding: `OBJ-${i + 1}`,
        fullStatement: alignedObjective,
        alignmentStrength: 1.0
      }],
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

  // Generate project data if assignment type is project
  const projectData = request.assignmentType === "project" 
    ? generateProjectFromTemplate(request.lesson, request.projectTemplate || "community_consultant", request.difficulty)
    : undefined;

  // Calculate total points including project rubric if applicable
  const questionPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const projectPoints = projectData?.rubric.reduce((sum, r) => sum + r.points, 0) || 0;

  return {
    title: `${request.lesson.title} - ${request.assignmentType.charAt(0).toUpperCase() + request.assignmentType.slice(1)}`,
    description: request.assignmentType === "project" && projectData
      ? `${projectData.templateName}: ${projectData.lowFloor} → ${projectData.highCeiling}`
      : `A ${request.difficulty} difficulty ${request.assignmentType} covering the key concepts from "${request.lesson.title}".`,
    instructions: getDefaultInstructions(request.assignmentType),
    questions,
    totalPoints: request.assignmentType === "project" ? projectPoints : questionPoints,
    accommodationModified: !!(request.accommodationTypes && request.accommodationTypes.length > 0),
    accommodationTypes: request.accommodationTypes,
    accommodationNotes: request.accommodationNotes,
    worksheet: extractWorksheetMetadata(request.lesson),
    accommodationChecklist: getDefaultAccommodationChecklist(request.accommodationTypes),
    project: projectData,
  };
}

function getQuestionByType(type: string, bkdFocus: "be" | "know" | "do", lesson: Lesson, num: number): { stimulus: string; questionText: string } {
  // Extract lesson context for richer questions
  const objectives = lesson.objectives || [];
  const primaryObjective = objectives[0] || `understanding ${lesson.topic}`;
  const secondaryObjective = objectives[1] || `applying concepts from ${lesson.topic}`;
  
  // Generate essential questions from lesson reflection or create them
  const essentialQuestion = lesson.reflection || `How does ${lesson.topic} impact your understanding and growth?`;
  
  // 5W1H Question Framework - Who, What, When, Where, Why, How
  const fiveW1HQuestions = {
    who: [
      { stimulus: `Consider the people involved in or affected by "${lesson.topic}".`, questionText: `Who are the key individuals or groups most impacted by ${lesson.topic}?` },
      { stimulus: `Think about expertise and authority related to "${lesson.topic}".`, questionText: `Who would be considered an expert on ${lesson.topic}, and what makes them qualified?` },
      { stimulus: `Consider perspectives and stakeholders.`, questionText: `Who might have a different perspective on ${lesson.topic}, and why?` },
    ],
    what: [
      { stimulus: `Focus on the core content of today's lesson.`, questionText: `What are the most important concepts you learned about ${lesson.topic}?` },
      { stimulus: `Consider the key definitions and terms from this lesson.`, questionText: `What key terms or vocabulary are essential to understanding ${lesson.topic}?` },
      { stimulus: `Think about the main takeaway from this lesson.`, questionText: `What is the single most important thing everyone should know about ${lesson.topic}?` },
    ],
    when: [
      { stimulus: `Consider the timing and context of "${lesson.topic}".`, questionText: `When is knowledge of ${lesson.topic} most relevant or useful?` },
      { stimulus: `Think about historical or future implications.`, questionText: `When did ${lesson.topic} become important, and when might it change?` },
      { stimulus: `Consider timing in your own life.`, questionText: `When have you encountered or will you encounter ${lesson.topic} in your own experience?` },
    ],
    where: [
      { stimulus: `Think about the settings and contexts for "${lesson.topic}".`, questionText: `Where is ${lesson.topic} most commonly applied or observed?` },
      { stimulus: `Consider geographic or situational contexts.`, questionText: `Where might understanding ${lesson.topic} be most valuable?` },
      { stimulus: `Think about resources and locations.`, questionText: `Where can you go to learn more about ${lesson.topic}?` },
    ],
    why: [
      { stimulus: `Consider the purpose and importance of understanding "${lesson.topic}".`, questionText: `Why is it important to understand ${lesson.topic}?` },
      { stimulus: `Think about cause and effect relationships.`, questionText: `Why does ${lesson.topic} matter for your future success?` },
      { stimulus: `Consider deeper reasoning and motivation.`, questionText: `Why might someone disagree about the importance of ${lesson.topic}?` },
    ],
    how: [
      { stimulus: `Think about application and process.`, questionText: `How can you apply what you learned about ${lesson.topic} in real life?` },
      { stimulus: `Consider methods and approaches.`, questionText: `How would you explain ${lesson.topic} to someone who has never heard of it?` },
      { stimulus: `Think about connections and relationships.`, questionText: `How does ${lesson.topic} connect to other subjects or areas of your life?` },
    ],
  };

  // Objective-based questions (reworded from lesson objectives)
  const objectiveQuestions = [
    { stimulus: `Reflect on the lesson objective: "${primaryObjective}".`, questionText: `In your own words, explain how you demonstrated "${primaryObjective.replace(/Students will |will /gi, '')}" during this lesson.` },
    { stimulus: `Consider the learning goal: "${secondaryObjective}".`, questionText: `How confident are you in your ability to "${secondaryObjective.replace(/Students will |will /gi, '')}"? Explain with evidence.` },
    { stimulus: `Think about mastery of the lesson objectives.`, questionText: `Which lesson objective was most challenging for you, and what would help you master it?` },
  ];

  // Essential question-based prompts
  const essentialQuestionPrompts = [
    { stimulus: `Consider this essential question: "${essentialQuestion}"`, questionText: `How would you answer: "${essentialQuestion}" based on what you learned today?` },
    { stimulus: `Essential questions drive deep learning. Reflect on: "${essentialQuestion}"`, questionText: `What new insights about "${essentialQuestion}" did you gain from this lesson?` },
    { stimulus: `Connect the essential question to your own life.`, questionText: `How does the question "${essentialQuestion}" relate to your personal experiences?` },
  ];

  // BKD-focused question bank with 5W1H integration
  const bkdQuestionData = {
    be: [
      // Identity & Values (BE focus)
      ...fiveW1HQuestions.who,
      ...fiveW1HQuestions.why.slice(0, 2),
      { stimulus: `Think about the topic "${lesson.topic}" and how it connects to who you are as a person.`, questionText: `How does the concept of "${lesson.topic}" relate to your personal values and goals?` },
      { stimulus: `Consider a real-world scenario where understanding "${lesson.topic}" would be valuable.`, questionText: `Reflect on a time when understanding "${lesson.topic}" would have helped you in a real-life situation.` },
      { stimulus: `Character and values are essential when applying any knowledge.`, questionText: `What character traits are important when applying knowledge about "${lesson.topic}"?` },
      ...essentialQuestionPrompts,
      { stimulus: `Self-awareness is key to growth. Reflect on your learning.`, questionText: `How has your understanding of "${lesson.topic}" changed your perspective or thinking?` },
    ],
    know: [
      // Knowledge & Understanding (KNOW focus)
      ...fiveW1HQuestions.what,
      ...fiveW1HQuestions.when.slice(0, 2),
      ...fiveW1HQuestions.where.slice(0, 2),
      { stimulus: `Review what you learned in today's lesson about "${lesson.topic}".`, questionText: `What are the key concepts covered in the lesson about "${lesson.topic}"?` },
      { stimulus: `Demonstrate your understanding by explaining concepts in your own words.`, questionText: `Explain the main principles of "${lesson.topic}" in your own words.` },
      ...objectiveQuestions,
      { stimulus: `Compare and contrast concepts from the lesson.`, questionText: `How does ${lesson.topic} compare to or connect with other topics you've studied?` },
      { stimulus: `Analyze the evidence presented in the lesson.`, questionText: `What evidence or examples best support the key ideas about ${lesson.topic}?` },
    ],
    do: [
      // Skills & Action (DO focus)
      ...fiveW1HQuestions.how,
      ...fiveW1HQuestions.where.slice(1, 3),
      { stimulus: `Think about practical ways to apply what you've learned about "${lesson.topic}".`, questionText: `Describe one action step you can take to apply what you learned about "${lesson.topic}".` },
      { stimulus: `Planning helps turn knowledge into action.`, questionText: `Create a plan for using your knowledge of "${lesson.topic}" in the next week.` },
      { stimulus: `Goals should be specific and measurable.`, questionText: `What measurable goal could you set related to "${lesson.topic}"?` },
      { stimulus: `Consider how you will transfer this learning.`, questionText: `How will you teach or share what you learned about "${lesson.topic}" with someone else?` },
      { stimulus: `Problem-solving requires action. Consider a challenge.`, questionText: `Describe a problem you could solve using your knowledge of "${lesson.topic}".` },
      { stimulus: `Skills develop through practice.`, questionText: `What skill from this lesson on "${lesson.topic}" do you want to practice more?` },
    ],
  };

  const questionDataList = bkdQuestionData[bkdFocus];
  return questionDataList[(num - 1) % questionDataList.length];
}
