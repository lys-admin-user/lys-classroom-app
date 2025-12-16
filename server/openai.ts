import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface LessonPlanRequest {
  topic: string;
  gradeLevel: string;
  bkdFocus: "be" | "know" | "do";
  standards?: string;
  duration: string;
}

interface GeneratedLessonPlan {
  title: string;
  topic: string;
  gradeLevel: string;
  bkdFocus: "be" | "know" | "do";
  standards?: string;
  duration: string;
  objectives: string[];
  activities: {
    title: string;
    description: string;
    duration: string;
    type: "be" | "know" | "do";
  }[];
  materials: string[];
  assessment: string;
  reflection?: string;
}

const bkdDescriptions = {
  be: "Identity & Purpose - Focus on helping students discover who they are, their values, strengths, and unique qualities",
  know: "Strategy & Resources - Focus on practical knowledge, skills, and resources students need to succeed",
  do: "Action & Impact - Focus on taking concrete steps, building habits, and making measurable progress",
};

export async function generateLessonPlan(request: LessonPlanRequest): Promise<GeneratedLessonPlan> {
  if (!openai) {
    // Return a mock lesson plan when OpenAI API key is not configured
    return generateMockLessonPlan(request);
  }

  const systemPrompt = `You are an expert educator creating lesson plans for the LYS (Laddering Your Success) platform. 
The LYS method uses the "Be-Know-Do" framework:
- BE: ${bkdDescriptions.be}
- KNOW: ${bkdDescriptions.know}
- DO: ${bkdDescriptions.do}

Create engaging, student-centered lessons that incorporate this framework. The lesson should be warm, encouraging, and focused on student growth.

IMPORTANT: Respond ONLY with a valid JSON object, no additional text.`;

  const userPrompt = `Create a lesson plan with the following specifications:
- Topic: ${request.topic}
- Grade Level: ${request.gradeLevel}
- Primary Focus: ${request.bkdFocus.toUpperCase()} (${bkdDescriptions[request.bkdFocus]})
- Duration: ${request.duration}
${request.standards ? `- Standards Alignment: ${request.standards}` : ""}

Generate a complete lesson plan in JSON format with this structure:
{
  "title": "Engaging lesson title",
  "topic": "${request.topic}",
  "gradeLevel": "${request.gradeLevel}",
  "bkdFocus": "${request.bkdFocus}",
  "duration": "${request.duration}",
  "objectives": ["Learning objective 1", "Learning objective 2", "Learning objective 3"],
  "activities": [
    {
      "title": "Activity name",
      "description": "Detailed description of the activity",
      "duration": "Time for this activity",
      "type": "be" | "know" | "do"
    }
  ],
  "materials": ["Material 1", "Material 2"],
  "assessment": "How students will be assessed",
  "reflection": "Optional reflection prompt for students"
}

Include 3-5 activities that balance the Be-Know-Do framework while emphasizing the ${request.bkdFocus.toUpperCase()} aspect. Make the activities engaging and age-appropriate for ${request.gradeLevel}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const lessonPlan = JSON.parse(content) as GeneratedLessonPlan;
    return lessonPlan;
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    // Fall back to mock if API fails
    return generateMockLessonPlan(request);
  }
}

function generateMockLessonPlan(request: LessonPlanRequest): GeneratedLessonPlan {
  const bkdActivities = {
    be: [
      { title: "Self-Reflection Journal", description: "Students write about their personal values and what success means to them.", duration: "10 minutes", type: "be" as const },
      { title: "Strengths Identification", description: "Partner activity where students share and identify each other's strengths.", duration: "15 minutes", type: "be" as const },
    ],
    know: [
      { title: "Interactive Presentation", description: "Educator presents key concepts with guided note-taking and discussion questions.", duration: "15 minutes", type: "know" as const },
      { title: "Research Station Rotation", description: "Students rotate through stations to explore different aspects of the topic.", duration: "20 minutes", type: "know" as const },
    ],
    do: [
      { title: "Action Planning Workshop", description: "Students create personal action plans with specific, measurable goals.", duration: "15 minutes", type: "do" as const },
      { title: "Peer Accountability Partners", description: "Students pair up to share goals and commit to supporting each other.", duration: "10 minutes", type: "do" as const },
    ],
  };

  return {
    title: `Exploring ${request.topic}: A ${request.bkdFocus.toUpperCase()} Journey`,
    topic: request.topic,
    gradeLevel: request.gradeLevel,
    bkdFocus: request.bkdFocus,
    duration: request.duration,
    standards: request.standards,
    objectives: [
      `Students will understand the core concepts of ${request.topic}`,
      `Students will apply the ${request.bkdFocus.toUpperCase()} framework to their personal growth`,
      `Students will demonstrate mastery through collaborative activities`,
    ],
    activities: [
      { title: "Warm-Up Discussion", description: "Open with an engaging question that connects to students' lives and experiences.", duration: "5 minutes", type: "be" as const },
      ...bkdActivities[request.bkdFocus],
      { title: "Closing Reflection", description: "Students share one key takeaway and one action they'll take.", duration: "5 minutes", type: "do" as const },
    ],
    materials: [
      "Student journals or reflection sheets",
      "Presentation slides",
      "Handout worksheets",
      "Timer for activities",
    ],
    assessment: "Formative assessment through observation, exit tickets, and completed action plans.",
    reflection: `What did you learn about yourself today? How will you apply the ${request.bkdFocus.toUpperCase()} mindset this week?`,
  };
}
