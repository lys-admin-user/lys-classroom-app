import type { MasterLesson } from "@shared/schema";

interface QualityScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    details: string[];
  }[];
}

interface LessonForScoring extends Partial<MasterLesson> {
  essentialQuestions?: string[];
  resources?: { title: string; url?: string; type: string }[];
  synchronousInstruction?: {
    anticipatorySet?: string;
    modeling?: string;
    guidedPractice?: string;
    independentPractice?: string;
  };
  lessonClose?: {
    educational?: string;
    social?: string;
    cultural?: string;
    financial?: string;
    health?: string;
    vocational?: string;
    spiritual?: string;
  };
}

export function calculateLessonQualityScore(lesson: LessonForScoring): QualityScoreResult {
  const breakdown: QualityScoreResult["breakdown"] = [];
  let totalScore = 0;
  let maxScore = 0;

  // 1. LESSON OBJECTIVES (25% of total - 25 points)
  const objectivesCategory = {
    category: "Lesson Objectives",
    score: 0,
    maxScore: 25,
    details: [] as string[],
  };
  
  const objectives = lesson.objectives || [];
  
  // Clarity of Objectives (15 points)
  if (objectives.length >= 3) {
    objectivesCategory.score += 10;
    objectivesCategory.details.push("Has 3+ clear objectives");
  } else if (objectives.length >= 2) {
    objectivesCategory.score += 7;
    objectivesCategory.details.push("Has 2 objectives");
  } else if (objectives.length >= 1) {
    objectivesCategory.score += 4;
    objectivesCategory.details.push("Has 1 objective");
  }
  
  // Check for measurable action verbs
  const actionVerbs = ["identify", "explain", "demonstrate", "analyze", "create", "apply", "evaluate", "compare", "describe", "develop", "design", "implement", "synthesize", "assess"];
  const measurableObjectives = objectives.filter(obj => 
    actionVerbs.some(verb => obj.toLowerCase().includes(verb))
  );
  if (measurableObjectives.length === objectives.length && objectives.length > 0) {
    objectivesCategory.score += 5;
    objectivesCategory.details.push("All objectives use measurable action verbs");
  } else if (measurableObjectives.length >= 1) {
    objectivesCategory.score += 2;
    objectivesCategory.details.push("Some objectives use action verbs");
  }
  
  // Alignment & Sequencing (10 points) - check for cross-curricular connections
  const activities = lesson.activities || [];
  if (activities.length >= 3 && objectives.length >= 2) {
    objectivesCategory.score += 7;
    objectivesCategory.details.push("Activities align with objectives");
  } else if (activities.length >= 2) {
    objectivesCategory.score += 4;
    objectivesCategory.details.push("Some activities align with objectives");
  }
  
  // Check for diversity/differentiation mentions
  const description = (lesson.description || "").toLowerCase();
  if (description.includes("diverse") || description.includes("differentiat") || description.includes("all learners")) {
    objectivesCategory.score += 3;
    objectivesCategory.details.push("Addresses diverse learners");
  }
  
  objectivesCategory.score = Math.min(objectivesCategory.score, objectivesCategory.maxScore);
  breakdown.push(objectivesCategory);
  totalScore += objectivesCategory.score;
  maxScore += objectivesCategory.maxScore;

  // 2. ESSENTIAL QUESTIONS (10% of total - 10 points)
  const questionsCategory = {
    category: "Essential Questions",
    score: 0,
    maxScore: 10,
    details: [] as string[],
  };
  
  const essentialQuestions = lesson.essentialQuestions || [];
  if (essentialQuestions.length >= 3) {
    questionsCategory.score += 5;
    questionsCategory.details.push("Has 3+ essential questions");
  } else if (essentialQuestions.length >= 2) {
    questionsCategory.score += 4;
    questionsCategory.details.push("Has 2 essential questions");
  } else if (essentialQuestions.length >= 1) {
    questionsCategory.score += 2;
    questionsCategory.details.push("Has 1 essential question");
  }
  
  // Check for higher-order thinking words
  const higherOrderWords = ["why", "how", "what if", "analyze", "evaluate", "create", "compare", "impact", "relationship", "significance"];
  const inquiryQuestions = essentialQuestions.filter((q: string) => 
    higherOrderWords.some(word => q.toLowerCase().includes(word))
  );
  if (inquiryQuestions.length >= 2) {
    questionsCategory.score += 5;
    questionsCategory.details.push("Questions invite inquiry and deeper thinking");
  } else if (inquiryQuestions.length >= 1) {
    questionsCategory.score += 3;
    questionsCategory.details.push("Some questions promote deeper thinking");
  }
  
  questionsCategory.score = Math.min(questionsCategory.score, questionsCategory.maxScore);
  breakdown.push(questionsCategory);
  totalScore += questionsCategory.score;
  maxScore += questionsCategory.maxScore;

  // 3. LYS METHODOLOGY (40% of total - 40 points)
  const lysCategory = {
    category: "LYS Methodology (Be-Know-Do)",
    score: 0,
    maxScore: 40,
    details: [] as string[],
  };
  
  const lysMethodology = lesson.lysMethodology;
  
  // BE Component (10 points)
  if (lysMethodology?.be?.focus && lysMethodology?.be?.description) {
    if (lysMethodology.be.description.length >= 50) {
      lysCategory.score += 10;
      lysCategory.details.push("BE component fully integrated with character development");
    } else {
      lysCategory.score += 6;
      lysCategory.details.push("BE component defined");
    }
  }
  
  // KNOW Component (10 points)
  if (lysMethodology?.know?.focus && lysMethodology?.know?.description) {
    if (lysMethodology.know.description.length >= 50) {
      lysCategory.score += 10;
      lysCategory.details.push("KNOW component comprehensive with resource guidance");
    } else {
      lysCategory.score += 6;
      lysCategory.details.push("KNOW component defined");
    }
  }
  
  // DO Component (10 points)
  if (lysMethodology?.do?.focus && lysMethodology?.do?.description) {
    if (lysMethodology.do.description.length >= 50) {
      lysCategory.score += 10;
      lysCategory.details.push("DO component with clear performance expectations");
    } else {
      lysCategory.score += 6;
      lysCategory.details.push("DO component defined");
    }
  }
  
  // LYS Standards Alignment (10 points) - check for variety in activity types
  const activityTypes = new Set(activities.map(a => a.type?.toLowerCase()));
  if (activityTypes.size >= 3) {
    lysCategory.score += 7;
    lysCategory.details.push("Activities cover all BKD types");
  } else if (activityTypes.size >= 2) {
    lysCategory.score += 4;
    lysCategory.details.push("Activities cover 2 BKD types");
  }
  
  if (lesson.bkdFocus && ["be", "know", "do", "integrated"].includes(lesson.bkdFocus)) {
    lysCategory.score += 3;
    lysCategory.details.push("BKD focus explicitly specified");
  }
  
  lysCategory.score = Math.min(lysCategory.score, lysCategory.maxScore);
  breakdown.push(lysCategory);
  totalScore += lysCategory.score;
  maxScore += lysCategory.maxScore;

  // 4. RESOURCES & TECHNOLOGY (5% of total - 5 points)
  const resourcesCategory = {
    category: "Resources & Technology",
    score: 0,
    maxScore: 5,
    details: [] as string[],
  };
  
  const resources = lesson.resources || [];
  const materials = lesson.materials || [];
  const totalResources = resources.length + materials.length;
  
  if (totalResources >= 6) {
    resourcesCategory.score += 5;
    resourcesCategory.details.push("Comprehensive resources for all students");
  } else if (totalResources >= 4) {
    resourcesCategory.score += 4;
    resourcesCategory.details.push("Good resource selection");
  } else if (totalResources >= 2) {
    resourcesCategory.score += 2;
    resourcesCategory.details.push("Basic resources provided");
  }
  
  // Check for technology integration
  const hasUrls = resources.some((r: { title: string; url?: string; type: string }) => r.url && r.url.length > 0);
  const techTypes = resources.filter((r: { title: string; url?: string; type: string }) => ["video", "website", "digital", "interactive"].includes((r.type || "").toLowerCase()));
  if (hasUrls || techTypes.length > 0) {
    resourcesCategory.score = Math.min(resourcesCategory.score + 1, resourcesCategory.maxScore);
    resourcesCategory.details.push("Technology integration present");
  }
  
  breakdown.push(resourcesCategory);
  totalScore += resourcesCategory.score;
  maxScore += resourcesCategory.maxScore;

  // 5. INSTRUCTIONAL INPUT (15% of total - 15 points)
  const instructionCategory = {
    category: "Instructional Input",
    score: 0,
    maxScore: 15,
    details: [] as string[],
  };
  
  const syncInstruction = lesson.synchronousInstruction;
  
  // Anticipatory Set (4 points)
  if (syncInstruction?.anticipatorySet && syncInstruction.anticipatorySet.length >= 100) {
    instructionCategory.score += 4;
    instructionCategory.details.push("Strong anticipatory set");
  } else if (syncInstruction?.anticipatorySet && syncInstruction.anticipatorySet.length >= 50) {
    instructionCategory.score += 2;
    instructionCategory.details.push("Anticipatory set present");
  }
  
  // Modeling (4 points)
  if (syncInstruction?.modeling && syncInstruction.modeling.length >= 100) {
    instructionCategory.score += 4;
    instructionCategory.details.push("Clear, explicit modeling");
  } else if (syncInstruction?.modeling && syncInstruction.modeling.length >= 50) {
    instructionCategory.score += 2;
    instructionCategory.details.push("Modeling present");
  }
  
  // Guided Practice (4 points)
  if (syncInstruction?.guidedPractice && syncInstruction.guidedPractice.length >= 100) {
    instructionCategory.score += 4;
    instructionCategory.details.push("Guided practice engages all students");
  } else if (syncInstruction?.guidedPractice && syncInstruction.guidedPractice.length >= 50) {
    instructionCategory.score += 2;
    instructionCategory.details.push("Guided practice present");
  }
  
  // Instructional Strategies (3 points)
  if (activities.length >= 4) {
    instructionCategory.score += 3;
    instructionCategory.details.push("Varied instructional strategies");
  } else if (activities.length >= 2) {
    instructionCategory.score += 1;
    instructionCategory.details.push("Some instructional variety");
  }
  
  breakdown.push(instructionCategory);
  totalScore += instructionCategory.score;
  maxScore += instructionCategory.maxScore;

  // 6. LESSON CLOSE (5% of total - 5 points)
  const closeCategory = {
    category: "Lesson Close",
    score: 0,
    maxScore: 5,
    details: [] as string[],
  };
  
  const lessonClose = lesson.lessonClose || {};
  const lifeDimensions = ["educational", "social", "cultural", "financial", "health", "vocational", "spiritual"];
  const presentDimensions = lifeDimensions.filter(dim => 
    lessonClose[dim as keyof typeof lessonClose] && 
    (lessonClose[dim as keyof typeof lessonClose] as string).length > 10
  );
  
  if (presentDimensions.length >= 6) {
    closeCategory.score += 5;
    closeCategory.details.push("Addresses all 7 life dimensions (Distinguished)");
  } else if (presentDimensions.length >= 4) {
    closeCategory.score += 4;
    closeCategory.details.push(`Addresses ${presentDimensions.length} life dimensions`);
  } else if (presentDimensions.length >= 2) {
    closeCategory.score += 2;
    closeCategory.details.push(`Addresses ${presentDimensions.length} life dimensions`);
  } else if (presentDimensions.length >= 1) {
    closeCategory.score += 1;
    closeCategory.details.push("Minimal lesson close");
  }
  
  // Check for reflection opportunity
  if (lesson.reflection && lesson.reflection.length >= 30) {
    closeCategory.score = Math.min(closeCategory.score + 1, closeCategory.maxScore);
    closeCategory.details.push("Includes reflection opportunity");
  }
  
  breakdown.push(closeCategory);
  totalScore += closeCategory.score;
  maxScore += closeCategory.maxScore;

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    totalScore,
    maxScore,
    percentage,
    breakdown,
  };
}

export function getQualityLevel(percentage: number): string {
  if (percentage >= 90) return "Distinguished";
  if (percentage >= 75) return "Accomplished";
  if (percentage >= 60) return "Acceptable";
  return "Needs Improvement";
}
