import { storage } from "./storage";

interface StandardMatch {
  standardId: string;
  code: string;
  description: string;
  matchScore: number;
  matchReason: string;
}

interface AutoMatchRequest {
  topic: string;
  gradeLevel: string;
  subject: string;
  objectives?: string[];
  standardSetId?: string;
}

export async function autoMatchStandards(request: AutoMatchRequest): Promise<StandardMatch[]> {
  try {
    const { topic, gradeLevel, subject, objectives = [], standardSetId } = request;
    
    if (!standardSetId) {
      return [];
    }
    
    const standards = await storage.getEducationalStandardsByGradeLevels(
      standardSetId,
      [gradeLevel]
    );
    
    if (standards.length === 0) {
      return [];
    }
    
    const matches: StandardMatch[] = [];
    const searchTerms = extractSearchTerms(topic, objectives);
    
    for (const standard of standards) {
      const score = calculateMatchScore(standard, searchTerms, subject, gradeLevel);
      
      if (score > 0.3) {
        matches.push({
          standardId: standard.id,
          code: standard.humanCoding || '',
          description: standard.fullStatement || '',
          matchScore: score,
          matchReason: getMatchReason(score),
        });
      }
    }
    
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    return matches.slice(0, 10);
  } catch (error) {
    console.error("Standards auto-match error:", error);
    return [];
  }
}

function extractSearchTerms(topic: string, objectives: string[]): string[] {
  const allText = [topic, ...objectives].join(' ').toLowerCase();
  
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'under',
    'students', 'student', 'will', 'understand', 'learn', 'demonstrate',
    'and', 'or', 'but', 'if', 'then', 'that', 'this', 'these', 'those',
  ]);
  
  const words = allText.match(/\b\w+\b/g) || [];
  const terms = words.filter(word => 
    word.length > 2 && !stopWords.has(word)
  );
  
  const phrases = extractPhrases(allText);
  
  return Array.from(new Set([...terms, ...phrases]));
}

function extractPhrases(text: string): string[] {
  const importantPhrases = [
    'problem solving', 'critical thinking', 'data analysis',
    'scientific method', 'mathematical reasoning', 'reading comprehension',
    'written communication', 'oral presentation', 'research skills',
    'digital literacy', 'creative expression', 'social studies',
    'life skills', 'career readiness', 'civic responsibility',
  ];
  
  return importantPhrases.filter(phrase => text.includes(phrase));
}

function calculateMatchScore(
  standard: { humanCoding: string; fullStatement: string | null; gradeLevel: string | null },
  searchTerms: string[],
  subject: string,
  gradeLevel: string
): number {
  let score = 0;
  const description = (standard.fullStatement || '').toLowerCase();
  const code = (standard.humanCoding || '').toLowerCase();
  
  for (const term of searchTerms) {
    if (description.includes(term)) {
      score += 0.15;
    }
    if (code.includes(term)) {
      score += 0.1;
    }
  }
  
  if (standard.gradeLevel?.toLowerCase() === gradeLevel.toLowerCase()) {
    score += 0.2;
  }
  
  if (description.includes(subject.toLowerCase())) {
    score += 0.2;
  }
  
  score = Math.min(score, 1.0);
  
  return Math.round(score * 100) / 100;
}

function getMatchReason(score: number): string {
  if (score >= 0.8) return "Strong alignment with topic and objectives";
  if (score >= 0.6) return "Good alignment with subject content";
  if (score >= 0.4) return "Partial alignment with lesson focus";
  return "Related standard";
}

export async function suggestStandardsForLesson(
  lessonId: string
): Promise<StandardMatch[]> {
  try {
    const lesson = await storage.getLesson(lessonId);
    if (!lesson) {
      return [];
    }
    
    return autoMatchStandards({
      topic: lesson.topic,
      gradeLevel: lesson.gradeLevel,
      subject: lesson.topic,
      objectives: lesson.objectives as string[],
    });
  } catch (error) {
    console.error("Suggest standards error:", error);
    return [];
  }
}

export async function validateStandardAlignment(
  objectives: string[],
  standardCodes: string[]
): Promise<{
  aligned: boolean;
  coverage: number;
  gaps: string[];
  suggestions: string[];
}> {
  try {
    const standards = await Promise.all(
      standardCodes.map(code => storage.getEducationalStandardByUid(code))
    );
    
    const validStandards = standards.filter((s): s is NonNullable<typeof s> => s !== undefined);
    
    if (validStandards.length === 0) {
      return {
        aligned: false,
        coverage: 0,
        gaps: objectives,
        suggestions: ["No valid standards found. Please verify standard codes."],
      };
    }
    
    const coveredObjectives: string[] = [];
    const uncoveredObjectives: string[] = [];
    
    for (const objective of objectives) {
      const objLower = objective.toLowerCase();
      const isCovered = validStandards.some((std) => {
        const desc = (std.fullStatement || '').toLowerCase();
        const words = objLower.split(/\s+/).filter(w => w.length > 3);
        return words.some(word => desc.includes(word));
      });
      
      if (isCovered) {
        coveredObjectives.push(objective);
      } else {
        uncoveredObjectives.push(objective);
      }
    }
    
    const coverage = Math.round((coveredObjectives.length / objectives.length) * 100);
    
    return {
      aligned: coverage >= 70,
      coverage,
      gaps: uncoveredObjectives,
      suggestions: uncoveredObjectives.length > 0 
        ? ["Consider adding standards that address: " + uncoveredObjectives.join(", ")]
        : [],
    };
  } catch (error) {
    console.error("Validate alignment error:", error);
    return {
      aligned: false,
      coverage: 0,
      gaps: [],
      suggestions: ["Error validating alignment"],
    };
  }
}
