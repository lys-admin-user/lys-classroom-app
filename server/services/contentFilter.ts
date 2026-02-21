const HARMFUL_KEYWORDS = [
  "kill", "suicide", "self-harm", "self harm", "cutting",
  "weapon", "gun", "bomb", "explosive",
  "drugs", "cocaine", "heroin", "meth",
  "porn", "pornography", "xxx",
  "hate", "racial slur", "nazi",
  "bully", "bullying", "harass",
  "threat", "threaten",
];

const CONTEXT_SENSITIVE_KEYWORDS = [
  "violence", "abuse", "assault", "predator",
  "inappropriate", "explicit",
  "gambling", "alcohol", "tobacco",
];

const EDUCATIONAL_EXCEPTIONS = [
  "anti-bullying", "anti-drug", "drug awareness", "drug prevention",
  "violence prevention", "conflict resolution",
  "substance abuse prevention", "health education",
  "historical violence", "civil rights", "holocaust education",
];

export interface FilterResult {
  flagged: boolean;
  severity: "none" | "low" | "medium" | "high";
  matchedKeywords: string[];
  requiresReview: boolean;
  reason?: string;
}

export function filterContent(text: string): FilterResult {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  let severity: "none" | "low" | "medium" | "high" = "none";

  const isEducationalContext = EDUCATIONAL_EXCEPTIONS.some(exception =>
    lowerText.includes(exception.toLowerCase()),
  );

  for (const keyword of HARMFUL_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
      severity = "high";
    }
  }

  if (matchedKeywords.length === 0) {
    for (const keyword of CONTEXT_SENSITIVE_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        if (severity === "none") severity = "medium";
      }
    }
  }

  if (isEducationalContext && severity !== "high") {
    severity = severity === "medium" ? "low" : "none";
  }

  const flagged = matchedKeywords.length > 0;
  const requiresReview = severity === "high" || (severity === "medium" && !isEducationalContext);

  return {
    flagged,
    severity,
    matchedKeywords,
    requiresReview,
    reason: flagged
      ? `Content contains ${severity}-severity keywords: ${matchedKeywords.join(", ")}`
      : undefined,
  };
}

export function filterChatMessage(
  content: string,
  userRole: string,
): FilterResult & { autoBlock: boolean } {
  const result = filterContent(content);

  const autoBlock = result.severity === "high" && userRole === "student";

  return { ...result, autoBlock };
}
