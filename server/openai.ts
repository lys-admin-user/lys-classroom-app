import OpenAI from "openai";
import type { GenerateLessonRequest } from "@shared/schema";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface LYSMethodology {
  be: { focus: string; description: string };
  know: { focus: string; description: string };
  do: { focus: string; description: string };
}

interface InstructionalPhase {
  anticipatorySet: string;
  modeling: string;
  guidedPractice: string;
  independentPractice: string;
}

interface LessonClose {
  educational?: string;
  social?: string;
  vocational?: string;
  financial?: string;
  spiritual?: string;
  cultural?: string;
  health?: string;
}

interface GeneratedLessonPlan {
  id: string;
  title: string;
  topic: string;
  course?: string;
  unit?: string;
  gradeLevel: string;
  bkdFocus: "be" | "know" | "do";
  standards?: {
    country: string;
    state: string;
    standardsName: string;
    subject: string;
    codes: { code: string; description: string }[];
  };
  duration: string;
  lessonPart?: string;
  objectives: string[];
  essentialQuestions: string[];
  lysMethodology: LYSMethodology;
  resources: { title: string; url?: string; type: string }[];
  asynchronousInstruction?: InstructionalPhase;
  synchronousInstruction: InstructionalPhase;
  activities: {
    title: string;
    description: string;
    duration: string;
    type: "be" | "know" | "do";
  }[];
  materials: string[];
  assessment: string;
  lessonClose: LessonClose;
  reflection?: string;
}

const bkdDescriptions = {
  be: "Identity & Purpose - Focus on helping students discover who they are, their values, strengths, and unique qualities. Character development and self-awareness.",
  know: "Strategy & Resources - Focus on practical knowledge, skills, and resources students need to succeed. Vocational awareness and skill development.",
  do: "Action & Impact - Focus on taking concrete steps, building habits, and making measurable progress. Execute with excellence.",
};

export async function generateLessonPlan(request: GenerateLessonRequest): Promise<GeneratedLessonPlan> {
  if (!openai) {
    return generateMockLessonPlan(request);
  }

  const standardsInfo = request.standards 
    ? `Standards: ${request.standards.standardsName} - ${request.standards.codes.map(c => `${c.code}: ${c.description}`).join("; ")}`
    : "";

  const systemPrompt = `You are an expert educator creating lesson plans for the LYS (Laddering Your Success) platform. 
The LYS methodology uses the "Be-Know-Do" framework to develop the whole student:
- BE: ${bkdDescriptions.be}
- KNOW: ${bkdDescriptions.know}  
- DO: ${bkdDescriptions.do}

Create engaging, student-centered lessons that incorporate all three aspects while emphasizing the primary focus.
The lesson should be warm, encouraging, and focused on student growth.
Always connect the lesson to real-world applications in the Lesson Close section.

IMPORTANT: Respond ONLY with a valid JSON object, no additional text.`;

  const userPrompt = `Create a complete lesson plan with these specifications:
- Topic: ${request.topic}
${request.course ? `- Course: ${request.course}` : ""}
${request.unit ? `- Unit: ${request.unit}` : ""}
- Grade Level: ${request.gradeLevel}
- Primary Focus: ${request.bkdFocus.toUpperCase()} (${bkdDescriptions[request.bkdFocus]})
- Duration: ${request.duration}
${request.lessonPart ? `- Lesson Part: ${request.lessonPart}` : ""}
${standardsInfo}

Generate a complete LYS lesson plan in JSON format. Include:
1. A compelling title
2. 2-3 essential questions that tie to real-world application
3. LYS Methodology section with specific BE/KNOW/DO applications for this lesson
4. Clear learning objectives aligned to the standards
5. Instructional phases: Anticipatory Set, Modeling (I Do), Guided Practice (We Do), Independent Practice
6. Resources with URLs where applicable
7. Materials list
8. Assessment strategy
9. Lesson Close with life application connections (educational, social, vocational, financial, spiritual as relevant)

JSON structure:
{
  "title": "string",
  "topic": "${request.topic}",
  "course": "${request.course || ""}",
  "unit": "${request.unit || ""}",
  "gradeLevel": "${request.gradeLevel}",
  "bkdFocus": "${request.bkdFocus}",
  "duration": "${request.duration}",
  "lessonPart": "${request.lessonPart || ""}",
  "objectives": ["objective1", "objective2"],
  "essentialQuestions": ["question1", "question2"],
  "lysMethodology": {
    "be": {"focus": "Character trait", "description": "How this develops identity"},
    "know": {"focus": "Skill/Resource", "description": "What students will learn"},
    "do": {"focus": "Action/Habit", "description": "What students will accomplish"}
  },
  "resources": [{"title": "Resource name", "url": "optional url", "type": "video/document/website"}],
  "synchronousInstruction": {
    "anticipatorySet": "Introduction activity",
    "modeling": "Teacher demonstration",
    "guidedPractice": "Class activity together",
    "independentPractice": "Student independent work"
  },
  "activities": [{"title": "name", "description": "detailed description", "duration": "time", "type": "be|know|do"}],
  "materials": ["material1", "material2"],
  "assessment": "Assessment description",
  "lessonClose": {
    "educational": "How this applies to education journey",
    "social": "How this applies to relationships/confidence",
    "vocational": "How this applies to career/work"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const lessonPlan = JSON.parse(content);
    return {
      id: crypto.randomUUID(),
      ...lessonPlan,
      standards: request.standards,
    };
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return generateMockLessonPlan(request);
  }
}

function generateMockLessonPlan(request: GenerateLessonRequest): GeneratedLessonPlan {
  const standardsCodes = request.standards?.codes.map(c => c.code).join(", ") || "";
  
  return {
    id: crypto.randomUUID(),
    title: `Exploring ${request.topic}: A ${request.bkdFocus.toUpperCase()} Journey`,
    topic: request.topic,
    course: request.course,
    unit: request.unit,
    gradeLevel: request.gradeLevel,
    bkdFocus: request.bkdFocus,
    standards: request.standards,
    duration: request.duration,
    lessonPart: request.lessonPart,
    objectives: [
      `Students will understand the core concepts of ${request.topic}`,
      `Students will apply the ${request.bkdFocus.toUpperCase()} framework to their personal growth`,
      `Students will demonstrate mastery through collaborative activities aligned to ${standardsCodes}`,
    ],
    essentialQuestions: [
      `How does understanding ${request.topic} help me in real life?`,
      `What skills am I developing that will matter in my future?`,
    ],
    lysMethodology: {
      be: {
        focus: request.bkdFocus === "be" ? "Self-Awareness" : "Character Development",
        description: request.bkdFocus === "be" 
          ? "Students will explore their identity and values through this lesson"
          : "Students will develop confidence and self-esteem",
      },
      know: {
        focus: request.bkdFocus === "know" ? "Skill Development" : "Resource Awareness",
        description: request.bkdFocus === "know"
          ? "Students will learn practical skills they can apply immediately"
          : "Students will discover resources available to them",
      },
      do: {
        focus: request.bkdFocus === "do" ? "Action Planning" : "Skill Practice",
        description: request.bkdFocus === "do"
          ? "Students will create and execute action plans"
          : "Students will practice and apply what they learn",
      },
    },
    resources: [
      { title: "Lesson Presentation Slides", type: "presentation" },
      { title: "Student Worksheet", type: "document" },
      { title: "Instructional Video", url: "https://example.com/video", type: "video" },
    ],
    synchronousInstruction: {
      anticipatorySet: `Begin by asking students what they already know about ${request.topic}. Write responses on the board and discuss connections to their lives.`,
      modeling: `Demonstrate the key concepts using examples. Show students how to approach the material step by step.`,
      guidedPractice: `Work through sample problems or scenarios as a class. Encourage students to share their thinking and ask questions.`,
      independentPractice: `Students complete the assigned practice independently, applying what they learned to new situations.`,
    },
    activities: [
      { 
        title: "Opening Discussion", 
        description: "Students share their initial thoughts and experiences related to the topic.", 
        duration: "5 minutes", 
        type: "be" 
      },
      { 
        title: "Direct Instruction", 
        description: "Teacher presents key concepts with visual aids and examples.", 
        duration: "15 minutes", 
        type: "know" 
      },
      { 
        title: "Collaborative Practice", 
        description: "Students work in pairs to apply concepts to real-world scenarios.", 
        duration: "15 minutes", 
        type: "do" 
      },
      { 
        title: "Reflection & Sharing", 
        description: "Students share what they learned and how they will apply it.", 
        duration: "10 minutes", 
        type: "be" 
      },
    ],
    materials: [
      "Student journals or reflection sheets",
      "Presentation slides",
      "Handout worksheets",
      "Timer for activities",
      "Whiteboard and markers",
    ],
    assessment: "Formative assessment through observation, exit tickets, and completed practice activities. Students demonstrate understanding through both written and verbal responses.",
    lessonClose: {
      educational: `This skill is essential as you progress through school. Understanding ${request.topic} will help you in future classes and standardized tests.`,
      social: `Learning to work through challenging material builds confidence. You're developing skills that make you a stronger collaborator and communicator.`,
      vocational: `In the workplace, you'll often encounter situations where you need these skills. The ability to ${request.topic.toLowerCase()} is valued by employers.`,
    },
    reflection: `What did you learn about yourself today? How will you apply the ${request.bkdFocus.toUpperCase()} mindset this week?`,
  };
}
