import OpenAI from "openai";
import crypto from "crypto";
import type { GenerateLessonRequest } from "@shared/schema";
import { lessonPlanCache } from "@shared/schema";
import { AI_LESSON_RUBRIC_PROMPT } from "@shared/lessonRubric";
import { calculateLessonQualityScore, getQualityLevel } from "./lessonQualityScorer";
import { storage } from "./storage";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { sanitizePromptText } from "./services/piiSanitizer";
import { isAfricanCountry, buildAfricanPromptAddendum } from "@shared/africaContext";

function generateCacheKey(request: GenerateLessonRequest): string {
  const normalizedParts = [
    request.topic.toLowerCase().trim(),
    (request.course || "").toLowerCase().trim(),
    (request.unit || "").toLowerCase().trim(),
    request.gradeLevel.toLowerCase().trim(),
    request.bkdFocus,
    (request.duration || "45 minutes").toLowerCase().trim(),
    request.standards?.codes?.map(c => c.code).sort().join(",") || "",
    // Country + language influence the African context block, so cache must vary by them.
    (request.standards?.country || "").toLowerCase().trim(),
    (request.language || "").toLowerCase().trim(),
  ];
  return crypto.createHash("sha256").update(normalizedParts.join("|")).digest("hex");
}

async function getCachedLesson(cacheKey: string): Promise<any | null> {
  try {
    const [cached] = await db.select().from(lessonPlanCache)
      .where(eq(lessonPlanCache.cacheKey, cacheKey));
    
    if (!cached) return null;
    
    if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
      await db.delete(lessonPlanCache).where(eq(lessonPlanCache.id, cached.id));
      return null;
    }

    await db.update(lessonPlanCache)
      .set({ 
        hitCount: sql`${lessonPlanCache.hitCount} + 1`,
        lastHitAt: new Date(),
      })
      .where(eq(lessonPlanCache.id, cached.id));

    return cached.generatedPlan;
  } catch (error) {
    console.error("Cache lookup error:", error);
    return null;
  }
}

async function saveLessonToCache(request: GenerateLessonRequest, cacheKey: string, plan: any): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await db.insert(lessonPlanCache).values({
      cacheKey,
      topic: request.topic,
      course: request.course || null,
      unit: request.unit || null,
      gradeLevel: request.gradeLevel,
      bkdFocus: request.bkdFocus,
      duration: request.duration || "45 minutes",
      standardsCodes: request.standards?.codes?.map(c => c.code).join(",") || null,
      generatedPlan: plan,
      hitCount: 0,
      expiresAt,
    }).onConflictDoNothing();
  } catch (error) {
    console.error("Cache save error:", error);
  }
}

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

export async function generateLessonPlan(request: GenerateLessonRequest): Promise<GeneratedLessonPlan & { cacheHit?: boolean }> {
  if (!openai) {
    return generateMockLessonPlan(request);
  }

  const cacheKey = generateCacheKey(request);
  const cached = await getCachedLesson(cacheKey);
  if (cached) {
    console.log(`Cache HIT for lesson: "${request.topic}" [${request.gradeLevel}/${request.bkdFocus}]`);
    return { ...cached, id: crypto.randomUUID(), cacheHit: true };
  }
  console.log(`Cache MISS for lesson: "${request.topic}" [${request.gradeLevel}/${request.bkdFocus}]`);

  const standardsInfo = request.standards
    ? request.standards.codes && request.standards.codes.length > 0
      ? `Standards: ${request.standards.standardsName} - ${request.standards.codes.map(c => `${c.code}: ${c.description}`).join("; ")}`
      : `Standards system: ${request.standards.standardsName} (${request.standards.country} — ${request.standards.subject}). No specific code list selected; infer the most appropriate national curriculum outcome for the given topic, subject, and grade.`
    : "";

  // Inject African / WAEC context block ONLY when an African country is selected.
  // Returns "" for non-African countries — preserves existing behavior exactly.
  const africanContext = buildAfricanPromptAddendum({
    country: request.standards?.country,
    language: request.language,
    mode: "lesson",
  });
  const africanInSystem = africanContext
    ? `\n\nWhen the user prompt below contains an "AFRICAN CONTEXT" block, you MUST follow every requirement in that block (WAEC framing, dual-path bridge, African case studies, BE pillar emphasis, facilitator pedagogy, bilingual output if requested). Treat it as overriding any default Western framing.`
    : "";

  const systemPrompt = `You are a master educator creating DISTINGUISHED-level lesson plans for the LYS (Laddering Your Success) platform.

QUALITY MANDATE: Every lesson you generate MUST score at the DISTINGUISHED level (90%+ quality score) on the LYS Rubric. Do not generate Accomplished, Acceptable, or Needs Improvement lessons. Only Distinguished quality is acceptable.

The LYS methodology uses the "Be-Know-Do" framework to develop the whole student:
- BE: ${bkdDescriptions.be}
- KNOW: ${bkdDescriptions.know}  
- DO: ${bkdDescriptions.do}

Create engaging, student-centered lessons that incorporate all three aspects while emphasizing the primary focus.
The lesson should be warm, encouraging, and focused on student growth.
Always connect the lesson to real-world applications in the Lesson Close section.
ALWAYS include ALL 7 life dimensions in the Lesson Close: Educational, Social, Cultural, Financial, Health, Vocational, and Spiritual.

${AI_LESSON_RUBRIC_PROMPT}

QUALITY CHECK BEFORE OUTPUT:
1. Are ALL objectives clearly stated with measurable outcomes?
2. Do essential questions require analysis, evaluation, or creative thinking?
3. Is BE-KNOW-DO methodology FULLY integrated (not just mentioned)?
4. Are there MULTIPLE resources with CLEAR guidance on access and application?
5. Does the lesson have differentiation for diverse learners?
6. Does the Lesson Close address ALL 7 life dimensions?

IMPORTANT: Respond ONLY with a valid JSON object, no additional text.${africanInSystem}`;

  // Get master lesson examples for AI guidance
  const subject = request.course || request.topic;
  const masterExamples = await getMasterLessonExamples(subject, request.gradeLevel);

  let rssSupplementalSection = "";
  try {
    const rssContent = await storage.getApprovedRssContentByPlacement("ai_lesson", {
      tags: request.course ? [request.course.toLowerCase()] : undefined,
    });
    if (rssContent.length > 0) {
      const contentRefs = rssContent.slice(0, 5).map(item => {
        const type = item.audioUrl ? "Podcast Episode" : "Article";
        return `- [${type}] "${item.title}" by ${item.author || "LYS"} (${item.contentUrl || ""})`;
      }).join("\n");
      rssSupplementalSection = `\n\nSUPPLEMENTAL RESOURCES FROM LYS CONTENT LIBRARY (include as optional additional resources if relevant to the topic - educators may remove these):
${contentRefs}`;
    }
  } catch (err) {
    // Silently skip if RSS content unavailable
  }

  const safeTopic = sanitizePromptText(request.topic);
  const safeCourse = request.course ? sanitizePromptText(request.course) : "";
  const safeUnit = request.unit ? sanitizePromptText(request.unit) : "";

  const userPrompt = `Create a complete lesson plan with these specifications:
- Topic: ${safeTopic}
${safeCourse ? `- Course: ${safeCourse}` : ""}
${safeUnit ? `- Unit: ${safeUnit}` : ""}
- Grade Level: ${request.gradeLevel}
- Primary Focus: ${request.bkdFocus.toUpperCase()} (${bkdDescriptions[request.bkdFocus]})
- Duration: ${request.duration}
${request.lessonPart ? `- Lesson Part: ${request.lessonPart}` : ""}
${standardsInfo}${africanContext}
${masterExamples}${rssSupplementalSection}

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
    "cultural": "How this connects to heritage and community",
    "financial": "How this relates to money management and resources",
    "health": "How this impacts well-being and healthy choices",
    "vocational": "How this applies to career/work",
    "spiritual": "How this connects to purpose and meaning"
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
    const generatedLesson = {
      id: crypto.randomUUID(),
      ...lessonPlan,
      standards: request.standards,
    };
    
    // VALIDATION LOOP: Check quality score and regenerate if below Distinguished
    const qualityResult = calculateLessonQualityScore(generatedLesson);
    const qualityLevel = getQualityLevel(qualityResult.percentage);
    
    if (qualityResult.percentage < 90 && !request.skipValidation) {
      console.log(`Lesson quality ${qualityResult.percentage}% (${qualityLevel}) - regenerating for Distinguished level...`);
      
      // Try one more time with enhanced prompt
      const retryPrompt = `${userPrompt}

CRITICAL: The previous attempt scored ${qualityResult.percentage}% quality. 
Missing requirements:
${qualityResult.breakdown.filter(b => b.score < b.maxScore).map(b => `- ${b.category}: ${b.score}/${b.maxScore}`).join('\n')}

You MUST address these gaps to achieve Distinguished level (90%+).`;

      const retryResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: retryPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      const retryContent = retryResponse.choices[0].message.content;
      if (retryContent) {
        const retryPlan = JSON.parse(retryContent);
        const improvedLesson = {
          id: crypto.randomUUID(),
          ...retryPlan,
          standards: request.standards,
        };
        
        const retryQuality = calculateLessonQualityScore(improvedLesson);
        console.log(`Retry lesson quality: ${retryQuality.percentage}% (${getQualityLevel(retryQuality.percentage)})`);
        
        if (retryQuality.percentage > qualityResult.percentage) {
          await saveLessonToCache(request, cacheKey, improvedLesson);
          return { ...improvedLesson, cacheHit: false };
        }
      }
    }
    
    await saveLessonToCache(request, cacheKey, generatedLesson);
    return { ...generatedLesson, cacheHit: false };
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return generateMockLessonPlan(request);
  }
}

// Fetch approved master lessons to use as AI examples
async function getMasterLessonExamples(subject: string, gradeLevel: string, limit: number = 3): Promise<string> {
  try {
    const masterLessons = await storage.getMasterLessons({ 
      status: "approved",
      subject,
      limit 
    });
    
    if (masterLessons.length === 0) return "";
    
    return `

REFERENCE EXAMPLES (Distinguished-level lessons to emulate):
${masterLessons.map((lesson, i) => `
Example ${i + 1}: "${lesson.title}"
- Objectives: ${(lesson.objectives as string[]).slice(0, 2).join('; ')}
- BKD Focus: ${lesson.bkdFocus}
- Quality Score: ${lesson.qualityScore || 90}%
`).join('')}
Emulate the quality and structure of these approved lessons.`;
  } catch (error) {
    return "";
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
      educational: `This skill is essential as you progress through school. Understanding ${request.topic} will help you in future classes and standardized tests. You're building a foundation for lifelong learning.`,
      social: `Learning to work through challenging material builds confidence. You're developing skills that make you a stronger collaborator and communicator. These relationships will support your success.`,
      cultural: `Understanding ${request.topic} connects you to broader human knowledge and diverse perspectives. You become part of a community of learners across cultures and backgrounds.`,
      financial: `The skills you develop today have real economic value. Understanding ${request.topic} can open career opportunities and help you make informed decisions about resources.`,
      health: `Mastering challenging content builds mental resilience and reduces stress about learning. A growth mindset contributes to overall well-being and healthy self-esteem.`,
      vocational: `In the workplace, you'll often encounter situations where you need these skills. The ability to understand ${request.topic.toLowerCase()} is valued by employers across many fields.`,
      spiritual: `Learning connects you to something larger than yourself. Understanding ${request.topic} helps you discover your purpose and how you can contribute meaningfully to the world.`,
    },
    reflection: `What did you learn about yourself today? How will you apply the ${request.bkdFocus.toUpperCase()} mindset this week?`,
  };
}

// Professional Development Recommendation Types
interface PDRecommendationResult {
  recommendations: {
    title: string;
    description: string;
    reason: string;
    skillGaps: string[];
    resourceType: string;
    provider?: string;
    estimatedDuration?: string;
    priority: number;
  }[];
  summary: string;
  focusAreas: string[];
}

export async function generatePDRecommendations(
  goals: { goalType: string; targetRole?: string | null; description?: string | null; timeline?: string | null }[],
  skills: { skillName: string; category: string; currentLevel: number; targetLevel: number }[],
  profile?: { yearsExperience?: number | null; subjectAreas?: string[] | null; certifications?: string[] | null } | null
): Promise<PDRecommendationResult> {
  if (!openai) {
    return generateMockPDRecommendations(goals, skills, profile);
  }

  const skillGaps = skills.filter(s => s.currentLevel < s.targetLevel);
  
  const systemPrompt = `You are an expert career advisor for educators, specializing in professional development planning. 
Analyze the educator's career goals, current skills, and skill gaps to generate personalized professional development recommendations.

Consider:
- The educator's stated career goals and target roles
- Specific skill gaps (difference between current and target skill levels)
- Years of experience and existing certifications
- Practical, actionable resources that can help them grow
- A mix of formal courses, workshops, peer learning, and self-directed activities

Prioritize recommendations based on:
1. Skills most critical for their career goals
2. Largest gaps between current and target levels
3. Resources that offer the best return on investment of time`;

  const userPrompt = `Educator Profile:
- Years of Experience: ${profile?.yearsExperience || "Not specified"}
- Subject Areas: ${profile?.subjectAreas?.join(", ") || "Not specified"}
- Certifications: ${profile?.certifications?.join(", ") || "None listed"}

Career Goals:
${goals.length > 0 ? goals.map(g => `- ${g.goalType}${g.targetRole ? ` (Target: ${g.targetRole})` : ""}${g.description ? `: ${g.description}` : ""}${g.timeline ? ` [Timeline: ${g.timeline}]` : ""}`).join("\n") : "No specific goals set"}

Skills Assessment:
${skillGaps.length > 0 ? skillGaps.map(s => `- ${s.skillName} (${s.category}): Current ${s.currentLevel}/5, Target ${s.targetLevel}/5, Gap: ${s.targetLevel - s.currentLevel}`).join("\n") : "No skill gaps identified"}

Generate 5-8 specific professional development recommendations tailored to this educator's needs.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content from OpenAI");

    const result = JSON.parse(content);
    return {
      recommendations: result.recommendations || [],
      summary: result.summary || "Professional development recommendations based on your goals and skills.",
      focusAreas: result.focusAreas || [],
    };
  } catch (error) {
    console.error("OpenAI PD recommendation error:", error);
    return generateMockPDRecommendations(goals, skills, profile);
  }
}

function generateMockPDRecommendations(
  goals: { goalType: string; targetRole?: string | null; description?: string | null }[],
  skills: { skillName: string; category: string; currentLevel: number; targetLevel: number }[],
  profile?: { yearsExperience?: number | null; subjectAreas?: string[] | null } | null
): PDRecommendationResult {
  const skillGaps = skills.filter(s => s.currentLevel < s.targetLevel);
  const primaryGoal = goals[0]?.goalType || "career_advancement";
  
  const baseRecommendations = [
    {
      title: "Advanced Classroom Management Strategies",
      description: "Master evidence-based techniques for creating positive learning environments and managing diverse classroom dynamics.",
      reason: "Essential foundation for any leadership role in education.",
      skillGaps: ["classroom_management", "leadership"],
      resourceType: "course",
      provider: "ASCD",
      estimatedDuration: "6 weeks",
      priority: 1,
    },
    {
      title: "Instructional Coaching Certification",
      description: "Develop skills to mentor and support fellow educators in improving their practice.",
      reason: primaryGoal === "leadership" ? "Directly aligned with your leadership goals." : "Builds leadership capacity for future advancement.",
      skillGaps: ["coaching", "feedback", "professional_development"],
      resourceType: "certification",
      provider: "Learning Forward",
      estimatedDuration: "3 months",
      priority: 2,
    },
    {
      title: "Data-Driven Instruction Workshop",
      description: "Learn to analyze student data effectively and use insights to differentiate instruction.",
      reason: "Critical skill for demonstrating impact and leading data teams.",
      skillGaps: ["data_analysis", "differentiation"],
      resourceType: "workshop",
      provider: "Local Education Agency",
      estimatedDuration: "2 days",
      priority: 3,
    },
    {
      title: "Peer Observation Exchange",
      description: "Join a structured peer observation program to learn from colleagues and share best practices.",
      reason: "Low-cost, high-impact way to improve teaching while building professional relationships.",
      skillGaps: ["collaboration", "reflection"],
      resourceType: "peer_learning",
      estimatedDuration: "Ongoing",
      priority: 4,
    },
    {
      title: "Educational Technology Integration",
      description: "Explore tools and strategies for enhancing student engagement through technology.",
      reason: "Technology literacy is increasingly essential for modern educators.",
      skillGaps: ["technology", "student_engagement"],
      resourceType: "self_study",
      provider: "ISTE",
      estimatedDuration: "4 weeks",
      priority: 5,
    },
  ];

  // Add skill-gap-specific recommendations
  if (skillGaps.length > 0) {
    const topGap = skillGaps.sort((a, b) => (b.targetLevel - b.currentLevel) - (a.targetLevel - a.currentLevel))[0];
    baseRecommendations.unshift({
      title: `${topGap.skillName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Intensive`,
      description: `Focused professional development to close your gap in ${topGap.skillName.replace(/_/g, " ")}.`,
      reason: `You have a ${topGap.targetLevel - topGap.currentLevel} level gap in this skill.`,
      skillGaps: [topGap.skillName],
      resourceType: "course",
      estimatedDuration: "4 weeks",
      priority: 1,
    });
  }

  return {
    recommendations: baseRecommendations.slice(0, 6),
    summary: `Based on your ${goals.length > 0 ? goals[0].goalType.replace(/_/g, " ") : "professional"} goals and ${skillGaps.length} identified skill gaps, we've curated these development opportunities.`,
    focusAreas: skillGaps.slice(0, 3).map(s => s.skillName.replace(/_/g, " ")),
  };
}
