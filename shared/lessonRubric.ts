export type RubricLevel = "distinguished" | "accomplished" | "acceptable" | "needs_improvement";

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: {
    distinguished: string;
    accomplished: string;
    acceptable: string;
    needs_improvement: string;
  };
}

export interface LessonRubric {
  version: string;
  categories: RubricCategory[];
}

export interface RubricCategory {
  id: string;
  name: string;
  criteria: RubricCriterion[];
}

export const LESSON_RUBRIC: LessonRubric = {
  version: "1.0",
  categories: [
    {
      id: "objectives",
      name: "Lesson Objectives",
      criteria: [
        {
          id: "clarity",
          name: "Clarity of Objectives",
          description: "How clearly stated are the instructional goals and objectives",
          weight: 15,
          levels: {
            distinguished: "Instructional goals and objectives are clearly stated. Learners have a clear understanding of what is expected of them. Learners can determine what they should know and be able to do as a result of learning and instruction.",
            accomplished: "Instructional goals and objectives are stated. Learners have an understanding of what is expected of them. Learners can determine what they should know and be able to do as a result of learning and instruction.",
            acceptable: "Instructional goals and objectives are stated but are not easy to understand. Learners are given some information regarding what is expected of them.",
            needs_improvement: "Instructional goals and objectives are not stated. Learners cannot tell what is expected of them. Learners cannot determine what they should know and be able to do."
          }
        },
        {
          id: "alignment",
          name: "Alignment & Sequencing",
          description: "How well objectives align with lesson goals and activities",
          weight: 10,
          levels: {
            distinguished: "Objectives are aligned and logically sequenced to the lesson's goal, providing relevant and enriching extensions. All activities, materials, and assessments are logically sequenced, relevant to student's prior understanding and real-world applications, integrate concepts from other disciplines, and are appropriate for diverse learners.",
            accomplished: "Objectives align with the lesson goal. Activities and materials are sequenced and relevant to students.",
            acceptable: "Objectives partially align with lesson goals. Some activities are sequenced appropriately.",
            needs_improvement: "Objectives do not align with lesson goals or are missing."
          }
        }
      ]
    },
    {
      id: "essential_questions",
      name: "Essential Questions",
      criteria: [
        {
          id: "question_quality",
          name: "Question Quality & Alignment",
          description: "How appropriate and aligned are the essential questions",
          weight: 10,
          levels: {
            distinguished: "Essential questions are clearly stated, appropriate, thoroughly aligned with standards and objectives, and designed to invite inquiry. Questions are creative, evaluative, or require analysis that promotes deeper learning and broader understanding.",
            accomplished: "Essential questions are appropriate, thoroughly aligned with standards and objectives, and designed to invite inquiry. Questions require higher levels of thinking.",
            acceptable: "Essential questions are appropriate but may not align with standards and objectives, or invite inquiry. Questions may not require higher levels of thinking.",
            needs_improvement: "Essential questions are not noted and/or may not be appropriate."
          }
        }
      ]
    },
    {
      id: "lys_methodology",
      name: "LYS Methodology (Be-Know-Do)",
      criteria: [
        {
          id: "be_component",
          name: "BE Component (Character/Values/Principles)",
          description: "Integration of character development, values, and guiding principles",
          weight: 10,
          levels: {
            distinguished: "Fully integrates character development, values exploration, and principle-based learning. Students reflect on who they are becoming through the learning process.",
            accomplished: "Includes clear character/values components that connect to lesson content.",
            acceptable: "Some mention of character or values but not well integrated into the lesson.",
            needs_improvement: "No character or values component included."
          }
        },
        {
          id: "know_component",
          name: "KNOW Component (Resources/Knowledge Access)",
          description: "Resources available to students and how they can use them",
          weight: 10,
          levels: {
            distinguished: "Comprehensive resources are provided with clear guidance on access and application. Students understand what resources are available and how to leverage them effectively.",
            accomplished: "Resources are provided with guidance on how students can access and use them.",
            acceptable: "Some resources listed but limited guidance on student access or use.",
            needs_improvement: "Resources are not identified or students have no guidance on accessing knowledge."
          }
        },
        {
          id: "do_component",
          name: "DO Component (Execute with Excellence)",
          description: "Opportunities for students to apply learning with excellence",
          weight: 10,
          levels: {
            distinguished: "Multiple opportunities for students to execute learning with excellence. Clear performance expectations and pathways to demonstrate mastery.",
            accomplished: "Students have opportunities to apply learning with clear expectations for quality execution.",
            acceptable: "Some application activities but expectations for excellence are unclear.",
            needs_improvement: "No opportunities for students to execute or apply their learning."
          }
        },
        {
          id: "lys_alignment",
          name: "LYS Standards Alignment",
          description: "How well goals align to LYS standards",
          weight: 10,
          levels: {
            distinguished: "All rigorous and measurable goals aligned to LYS standards. All activities and materials are relevant to students' prior understanding, real-world applications, integrate concepts from other disciplines, provide time for reflection, and deepen understanding of unit/course objectives. Vertically aligned to state standards.",
            accomplished: "All goals aligned to LYS standards. All activities/materials are relevant to all students and vertically aligned to state standards.",
            acceptable: "Most goals aligned to LYS standards. Activities/materials provide appropriate time for LYS methodology and lesson close.",
            needs_improvement: "Few goals aligned to LYS standards. Rarely provides time for LYS methodology and lesson close."
          }
        }
      ]
    },
    {
      id: "resources",
      name: "Resources & Technology",
      criteria: [
        {
          id: "technology_integration",
          name: "Technology Integration",
          description: "Selection and application of technologies",
          weight: 5,
          levels: {
            distinguished: "Technology selection and application are appropriate for the learning environment and outcomes. Technologies enhance learning. Access to technological resources are readily available for all students and provide opportunities for students to establish high academic and social-emotional expectations.",
            accomplished: "Technology selection and application are appropriate for learning environments and outcomes. Some technologies enhance learning. Access is readily available for all students.",
            acceptable: "Technology selection is beginning to be appropriate for the learning environment. Technologies applied do not affect learning.",
            needs_improvement: "Selection and application of technologies is inappropriate or nonexistent for learning environment and outcomes."
          }
        }
      ]
    },
    {
      id: "instructional_input",
      name: "Instructional Input",
      criteria: [
        {
          id: "anticipatory_set",
          name: "Anticipatory Set (Introduction)",
          description: "How the lesson is introduced to engage students",
          weight: 5,
          levels: {
            distinguished: "Strong anticipatory set that captures student attention, connects to prior knowledge, and sets clear purpose for learning.",
            accomplished: "Anticipatory set engages students and provides context for the lesson.",
            acceptable: "Some introduction provided but may not fully engage students.",
            needs_improvement: "No anticipatory set or introduction is missing."
          }
        },
        {
          id: "modeling",
          name: "Modeling (I Do)",
          description: "Teacher demonstration of concepts and skills",
          weight: 5,
          levels: {
            distinguished: "Clear, explicit modeling that demonstrates thinking processes, uses multiple representations, and addresses potential misconceptions.",
            accomplished: "Modeling clearly demonstrates concepts with appropriate examples.",
            acceptable: "Some modeling provided but may lack clarity or depth.",
            needs_improvement: "No modeling or demonstration of concepts."
          }
        },
        {
          id: "guided_practice",
          name: "Guided Practice (We Do)",
          description: "Structured practice with teacher support",
          weight: 5,
          levels: {
            distinguished: "Guided practice activities actively engage all students, include formative assessment checkpoints, and differentiate based on student needs.",
            accomplished: "Students practice with teacher support and feedback. Students understand their roles within instructional groups.",
            acceptable: "Some guided practice but limited teacher support or differentiation.",
            needs_improvement: "No guided practice opportunities."
          }
        },
        {
          id: "instructional_strategies",
          name: "Instructional Strategies",
          description: "Appropriateness of strategies for learning outcomes",
          weight: 5,
          levels: {
            distinguished: "Instructional strategies appropriate for learning outcome(s). Strategy based on practical experience, theory, research, and documented best practice. Activities, resources, and materials are varied, appropriate to ability levels, and actively engage students in ownership of their learning.",
            accomplished: "Most instructional strategies are appropriate for learning outcome(s). Based on practical experience, theory, research, and best practice. All students understand their roles and facilitate opportunities for student input on goals and outcomes.",
            acceptable: "Some instructional strategies are appropriate for learning outcome(s). All students understand their roles within instructional groups.",
            needs_improvement: "Instructional strategies are missing or inappropriate. Encourages little to no complex higher-order thinking."
          }
        }
      ]
    },
    {
      id: "lesson_close",
      name: "Lesson Close & Practice",
      criteria: [
        {
          id: "independent_practice",
          name: "Independent Practice / Homework",
          description: "Opportunities for students to practice independently",
          weight: 5,
          levels: {
            distinguished: "Independent practice extends learning, connects to real-world applications, and allows students to demonstrate mastery in varied ways.",
            accomplished: "Independent practice reinforces lesson objectives and is appropriately challenging.",
            acceptable: "Some independent practice but may not fully align with objectives.",
            needs_improvement: "No independent practice or homework provided."
          }
        },
        {
          id: "closure",
          name: "Lesson Closure",
          description: "How the lesson concludes and connects to learning",
          weight: 5,
          levels: {
            distinguished: "All activities and materials for lesson close are relevant to students' prior understanding, real-world applications, integrate concepts from other disciplines, provide time for reflection, deepen understanding of unit/course objectives, vertically aligned to state standards, and integrate technology to enhance mastery. Answers essential question addressing: Educational, Social, Cultural, Financial, Health, Vocational, and Spiritual aspects.",
            accomplished: "Stated closure activities bring lesson to appropriate close, offer appropriate extensions, align with standards and objectives, and accommodate student diversity. All materials are relevant to students and fit into broader unit and course strand.",
            acceptable: "Stated closure activities bring lesson to a close and align with standards and objectives. Closure may offer extensions and accommodations. Most activities are sequenced and correlated to standard.",
            needs_improvement: "Closure limited or not connected to lesson objectives. Few activities sequenced and correlated to the standard."
          }
        }
      ]
    }
  ]
};

export function calculateRubricScore(scores: Record<string, RubricLevel>): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  overallLevel: RubricLevel;
} {
  const levelPoints: Record<RubricLevel, number> = {
    distinguished: 4,
    accomplished: 3,
    acceptable: 2,
    needs_improvement: 1
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const category of LESSON_RUBRIC.categories) {
    for (const criterion of category.criteria) {
      const level = scores[criterion.id];
      if (level) {
        totalWeightedScore += levelPoints[level] * criterion.weight;
        totalWeight += criterion.weight;
      }
    }
  }

  const maxPossibleScore = totalWeight * 4;
  const percentage = totalWeight > 0 ? (totalWeightedScore / maxPossibleScore) * 100 : 0;

  let overallLevel: RubricLevel;
  if (percentage >= 90) overallLevel = "distinguished";
  else if (percentage >= 75) overallLevel = "accomplished";
  else if (percentage >= 60) overallLevel = "acceptable";
  else overallLevel = "needs_improvement";

  return {
    totalScore: totalWeightedScore,
    maxScore: maxPossibleScore,
    percentage: Math.round(percentage),
    overallLevel
  };
}

export function getRubricLevelLabel(level: RubricLevel): string {
  const labels: Record<RubricLevel, string> = {
    distinguished: "Distinguished",
    accomplished: "Accomplished",
    acceptable: "Acceptable",
    needs_improvement: "Needs Improvement"
  };
  return labels[level];
}

export function getRubricLevelColor(level: RubricLevel): string {
  const colors: Record<RubricLevel, string> = {
    distinguished: "text-green-600",
    accomplished: "text-blue-600",
    acceptable: "text-yellow-600",
    needs_improvement: "text-red-600"
  };
  return colors[level];
}

export const AI_LESSON_RUBRIC_PROMPT = `
When generating lesson plans, adhere to the LYS Lesson Plan Rubric standards to ensure Distinguished-level quality:

## LESSON OBJECTIVES
- State instructional goals and objectives clearly so learners understand expectations
- Ensure learners can determine what they should know and be able to do
- Align and logically sequence objectives to the lesson's goal
- Make activities and assessments relevant to real-world applications
- Integrate concepts from other disciplines
- Accommodate diverse learners

## ESSENTIAL QUESTIONS
- Create clearly stated, appropriate questions aligned with standards and objectives
- Design questions that invite inquiry and deeper thinking
- Include creative, evaluative, or analytical questions for broader understanding

## LYS BE-KNOW-DO METHODOLOGY
### BE (Character/Values/Principles)
- Integrate character development and values exploration
- Help students reflect on who they are becoming through learning

### KNOW (Resources/Knowledge Access)
- Provide comprehensive resources with clear guidance
- Explain how students can access and leverage resources effectively

### DO (Execute with Excellence)
- Create multiple opportunities for students to apply learning
- Set clear performance expectations and pathways to demonstrate mastery

## INSTRUCTIONAL INPUT
### Anticipatory Set (Introduction)
- Capture student attention and connect to prior knowledge
- Set clear purpose for learning

### Modeling (I Do)
- Demonstrate thinking processes with multiple representations
- Address potential misconceptions

### Guided Practice (We Do)
- Actively engage all students with formative assessment checkpoints
- Differentiate based on student needs

## LESSON CLOSE
- Connect closure activities to essential questions
- Address multiple life dimensions: Educational, Social, Cultural, Financial, Health, Vocational, and Spiritual
- Provide time for student reflection
- Integrate technology to enhance mastery
`;
