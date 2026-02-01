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

export function calculateLessonQualityScore(lesson: Partial<MasterLesson>): QualityScoreResult {
  const breakdown: QualityScoreResult["breakdown"] = [];
  let totalScore = 0;
  let maxScore = 0;

  // 1. Objectives (25 points)
  const objectivesCategory = {
    category: "Lesson Objectives",
    score: 0,
    maxScore: 25,
    details: [] as string[],
  };
  
  const objectives = lesson.objectives || [];
  if (objectives.length >= 3) {
    objectivesCategory.score += 15;
    objectivesCategory.details.push("Has 3+ objectives");
  } else if (objectives.length >= 2) {
    objectivesCategory.score += 10;
    objectivesCategory.details.push("Has 2 objectives");
  } else if (objectives.length >= 1) {
    objectivesCategory.score += 5;
    objectivesCategory.details.push("Has 1 objective");
  }
  
  // Check if objectives are well-formed (have verb, measurable)
  const actionVerbs = ["identify", "explain", "demonstrate", "analyze", "create", "apply", "evaluate", "understand", "describe", "compare"];
  const measurableObjectives = objectives.filter(obj => 
    actionVerbs.some(verb => obj.toLowerCase().includes(verb))
  );
  if (measurableObjectives.length === objectives.length && objectives.length > 0) {
    objectivesCategory.score += 10;
    objectivesCategory.details.push("Objectives use action verbs");
  } else if (measurableObjectives.length > 0) {
    objectivesCategory.score += 5;
  }
  
  breakdown.push(objectivesCategory);
  totalScore += objectivesCategory.score;
  maxScore += objectivesCategory.maxScore;

  // 2. LYS Methodology (25 points)
  const lysCategory = {
    category: "LYS Methodology (Be-Know-Do)",
    score: 0,
    maxScore: 25,
    details: [] as string[],
  };
  
  const lysMethodology = lesson.lysMethodology;
  if (lysMethodology) {
    if (lysMethodology.be?.focus && lysMethodology.be?.description) {
      lysCategory.score += 8;
      lysCategory.details.push("BE component defined");
    }
    if (lysMethodology.know?.focus && lysMethodology.know?.description) {
      lysCategory.score += 8;
      lysCategory.details.push("KNOW component defined");
    }
    if (lysMethodology.do?.focus && lysMethodology.do?.description) {
      lysCategory.score += 9;
      lysCategory.details.push("DO component defined");
    }
  }
  
  if (lesson.bkdFocus && ["be", "know", "do", "integrated"].includes(lesson.bkdFocus)) {
    lysCategory.score = Math.min(lysCategory.score + 2, lysCategory.maxScore);
    lysCategory.details.push("BKD focus specified");
  }
  
  breakdown.push(lysCategory);
  totalScore += lysCategory.score;
  maxScore += lysCategory.maxScore;

  // 3. Activities (20 points)
  const activitiesCategory = {
    category: "Activities & Instruction",
    score: 0,
    maxScore: 20,
    details: [] as string[],
  };
  
  const activities = lesson.activities || [];
  if (activities.length >= 4) {
    activitiesCategory.score += 10;
    activitiesCategory.details.push("Has 4+ activities");
  } else if (activities.length >= 2) {
    activitiesCategory.score += 7;
    activitiesCategory.details.push("Has 2-3 activities");
  } else if (activities.length >= 1) {
    activitiesCategory.score += 4;
    activitiesCategory.details.push("Has 1 activity");
  }
  
  // Check for varied activity types (BE, KNOW, DO)
  const activityTypes = new Set(activities.map(a => a.type?.toLowerCase()));
  if (activityTypes.size >= 3) {
    activitiesCategory.score += 10;
    activitiesCategory.details.push("Activities cover all BKD types");
  } else if (activityTypes.size >= 2) {
    activitiesCategory.score += 5;
    activitiesCategory.details.push("Activities cover 2 BKD types");
  }
  
  breakdown.push(activitiesCategory);
  totalScore += activitiesCategory.score;
  maxScore += activitiesCategory.maxScore;

  // 4. Materials & Resources (10 points)
  const materialsCategory = {
    category: "Materials & Resources",
    score: 0,
    maxScore: 10,
    details: [] as string[],
  };
  
  const materials = lesson.materials || [];
  if (materials.length >= 5) {
    materialsCategory.score += 10;
    materialsCategory.details.push("Comprehensive materials list");
  } else if (materials.length >= 3) {
    materialsCategory.score += 7;
    materialsCategory.details.push("Good materials list");
  } else if (materials.length >= 1) {
    materialsCategory.score += 4;
    materialsCategory.details.push("Basic materials listed");
  }
  
  breakdown.push(materialsCategory);
  totalScore += materialsCategory.score;
  maxScore += materialsCategory.maxScore;

  // 5. Assessment (10 points)
  const assessmentCategory = {
    category: "Assessment",
    score: 0,
    maxScore: 10,
    details: [] as string[],
  };
  
  const assessment = lesson.assessment || "";
  if (assessment.length >= 200) {
    assessmentCategory.score += 10;
    assessmentCategory.details.push("Detailed assessment description");
  } else if (assessment.length >= 100) {
    assessmentCategory.score += 7;
    assessmentCategory.details.push("Good assessment description");
  } else if (assessment.length >= 30) {
    assessmentCategory.score += 4;
    assessmentCategory.details.push("Basic assessment provided");
  }
  
  breakdown.push(assessmentCategory);
  totalScore += assessmentCategory.score;
  maxScore += assessmentCategory.maxScore;

  // 6. Completeness (10 points)
  const completenessCategory = {
    category: "Completeness",
    score: 0,
    maxScore: 10,
    details: [] as string[],
  };
  
  if (lesson.title && lesson.title.length >= 5) {
    completenessCategory.score += 2;
    completenessCategory.details.push("Has title");
  }
  if (lesson.description && lesson.description.length >= 50) {
    completenessCategory.score += 2;
    completenessCategory.details.push("Has description");
  }
  if (lesson.gradeLevel) {
    completenessCategory.score += 2;
    completenessCategory.details.push("Grade level specified");
  }
  if (lesson.subject) {
    completenessCategory.score += 2;
    completenessCategory.details.push("Subject specified");
  }
  if (lesson.duration) {
    completenessCategory.score += 2;
    completenessCategory.details.push("Duration specified");
  }
  
  breakdown.push(completenessCategory);
  totalScore += completenessCategory.score;
  maxScore += completenessCategory.maxScore;

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
