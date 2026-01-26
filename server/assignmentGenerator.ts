import OpenAI from "openai";
import type { Lesson } from "@shared/schema";
import { randomUUID } from "crypto";

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
  accommodationType?: "IEP" | "504" | "BIP";
  accommodationNotes?: string;
  projectTemplate?: ProjectTemplateType;
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
  reflectionPrompts: string[];
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
  project?: GeneratedProject;
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

  // Generate reflection prompts aligned with Be-Know-Do
  const reflectionPrompts = [
    `BE: How has working on this project changed how you see yourself as a learner?`,
    `KNOW: What is the most important thing you learned about ${lesson.topic}?`,
    `DO: How will you apply what you learned in this project to other areas of your life?`,
    "What was the most challenging part of this project and how did you overcome it?",
    "What would you do differently if you could start over?"
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
    accommodationModified: !!request.accommodationType,
    accommodationType: request.accommodationType,
    accommodationNotes: request.accommodationNotes,
    worksheet: extractWorksheetMetadata(request.lesson),
    accommodationChecklist: getDefaultAccommodationChecklist(request.accommodationType),
    project: projectData,
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
