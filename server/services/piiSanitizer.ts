const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g;
const STUDENT_ID_REGEX = /\b(?:student\s*(?:id|#|number)[:\s]*)\d{5,12}\b/gi;
const ADDRESS_REGEX = /\d{1,5}\s+\w+\s+(?:st(?:reet)?|ave(?:nue)?|blvd|boulevard|dr(?:ive)?|ln|lane|rd|road|ct|court|pl|place|way|cir(?:cle)?)\b[^,]*,?\s*[A-Z]{2}\s*\d{5}/gi;
const DATE_OF_BIRTH_REGEX = /\b(?:dob|date\s*of\s*birth|born|birthday)[:\s]*(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s*\d{4})\b/gi;

// ----- Student-name detection (heuristic, not perfect) -----------------
// Catches the most common ways teachers paste a student name into accommodation
// notes / IEP context, while avoiding obvious false positives on subject content.
// Supported patterns:
//   "Name: Jane Doe"           → "Name: [STUDENT_NAME_REDACTED]"
//   "Student: Jane Doe"        → "Student: [STUDENT_NAME_REDACTED]"
//   "Student Jane Doe"         → "Student [STUDENT_NAME_REDACTED]"
//   "for Jane Doe who has..."  → "for [STUDENT_NAME_REDACTED] who has..."
//   "for Jane Doe,"            → "for [STUDENT_NAME_REDACTED],"
//   "(child) Jane Doe is ..."  → "child [STUDENT_NAME_REDACTED] is ..."
// We REQUIRE either a labeled prefix ("Name:"/"Student:") or a person-context
// word ("student", "child", "learner", "for", "named") so we don't mangle
// proper-noun bigrams in academic content (e.g. "Civil War", "Pythagorean
// Theorem"). Allows accents and apostrophes in names (D'Angelo, José).
// IMPORTANT: name token MUST be capitalized — do NOT use the `i` flag here, or
// `[A-Z]` would match lowercase too and we'd redact phrases like "for visual
// aids" or "with graphic organizer". We make the *prefix word* case-insensitive
// by enumerating both cases explicitly, while keeping the name itself strictly
// capitalized. The Unicode upper-class lets us catch accented capitals (É, Á).
const NAME_TOKEN = `(?:[A-ZÀ-Þ][a-zA-ZÀ-ÿ'\\-]{1,30})`;
const NAME_BIGRAM = `${NAME_TOKEN}(?:\\s+${NAME_TOKEN}){1,2}`;
const PREFIX_LABEL = `(?:[Nn]ame|[Ss]tudent|[Pp]upil|[Ll]earner|[Cc]hild)`;
const PREFIX_CONTEXT = `(?:[Ss]tudent|[Pp]upil|[Ll]earner|[Cc]hild|[Nn]amed)`;
const LABELED_NAME_REGEX = new RegExp(
  `\\b(${PREFIX_LABEL})\\s*[:\\-]\\s*(${NAME_BIGRAM})\\b`,
  "g",
);
// Stricter: require an explicit person-context noun ("student Jane Doe"), and
// drop overly broad prepositions like "for/about/with" that fired on academic
// phrases. Followed by a verb/clause-end so we don't grab proper nouns inside
// regular sentences (e.g. "compare with George Washington" stays untouched).
const CONTEXTUAL_NAME_REGEX = new RegExp(
  `\\b(${PREFIX_CONTEXT})\\s+(${NAME_BIGRAM})(?=\\s+(?:who|is|has|needs|requires|will|can|should|cannot|shows|struggles|reads|writes|works|likes|prefers|benefits)\\b|[,;.])`,
  "g",
);

const PII_PATTERNS: { regex: RegExp; replacement: string; label: string }[] = [
  // Order matters: redact emails/phones/SSNs first (they're unambiguous) so name
  // heuristics can't accidentally match digit-laden tokens.
  { regex: EMAIL_REGEX, replacement: "[EMAIL_REDACTED]", label: "email" },
  { regex: PHONE_REGEX, replacement: "[PHONE_REDACTED]", label: "phone" },
  { regex: SSN_REGEX, replacement: "[SSN_REDACTED]", label: "ssn" },
  { regex: STUDENT_ID_REGEX, replacement: "[STUDENT_ID_REDACTED]", label: "student_id" },
  { regex: ADDRESS_REGEX, replacement: "[ADDRESS_REDACTED]", label: "address" },
  { regex: DATE_OF_BIRTH_REGEX, replacement: "[DOB_REDACTED]", label: "dob" },
  // Name patterns last. Use a function replacement so we keep the prefix word
  // (so "for Jane Doe" → "for [STUDENT_NAME_REDACTED]" reads naturally).
  { regex: LABELED_NAME_REGEX, replacement: "$1: [STUDENT_NAME_REDACTED]", label: "student_name" },
  { regex: CONTEXTUAL_NAME_REGEX, replacement: "$1 [STUDENT_NAME_REDACTED]", label: "student_name" },
];

export interface SanitizationResult {
  sanitizedText: string;
  detectedPII: { type: string; count: number }[];
  hadPII: boolean;
}

export function stripPII(text: string): SanitizationResult {
  let sanitized = text;
  const detectedPII: { type: string; count: number }[] = [];

  for (const pattern of PII_PATTERNS) {
    const matches = sanitized.match(pattern.regex);
    if (matches && matches.length > 0) {
      detectedPII.push({ type: pattern.label, count: matches.length });
      sanitized = sanitized.replace(pattern.regex, pattern.replacement);
    }
  }

  return {
    sanitizedText: sanitized,
    detectedPII,
    hadPII: detectedPII.length > 0,
  };
}

export function sanitizeForAI(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    "email", "phone", "phoneNumber", "ssn", "socialSecurity",
    "address", "streetAddress", "homeAddress", "dateOfBirth",
    "birthDate", "dob", "parentEmail", "parentPhone",
    "emergencyContact", "medicalInfo", "iep", "accommodations",
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = stripPII(value).sanitizedText;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForAI(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === "string"
          ? stripPII(item).sanitizedText
          : typeof item === "object" && item !== null
            ? sanitizeForAI(item)
            : item,
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function sanitizePromptText(text: string): string {
  return stripPII(text).sanitizedText;
}
