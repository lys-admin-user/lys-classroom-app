const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g;
const STUDENT_ID_REGEX = /\b(?:student\s*(?:id|#|number)[:\s]*)\d{5,12}\b/gi;
const ADDRESS_REGEX = /\d{1,5}\s+\w+\s+(?:st(?:reet)?|ave(?:nue)?|blvd|boulevard|dr(?:ive)?|ln|lane|rd|road|ct|court|pl|place|way|cir(?:cle)?)\b[^,]*,?\s*[A-Z]{2}\s*\d{5}/gi;
const DATE_OF_BIRTH_REGEX = /\b(?:dob|date\s*of\s*birth|born|birthday)[:\s]*(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s*\d{4})\b/gi;

const PII_PATTERNS: { regex: RegExp; replacement: string; label: string }[] = [
  { regex: EMAIL_REGEX, replacement: "[EMAIL_REDACTED]", label: "email" },
  { regex: PHONE_REGEX, replacement: "[PHONE_REDACTED]", label: "phone" },
  { regex: SSN_REGEX, replacement: "[SSN_REDACTED]", label: "ssn" },
  { regex: STUDENT_ID_REGEX, replacement: "[STUDENT_ID_REDACTED]", label: "student_id" },
  { regex: ADDRESS_REGEX, replacement: "[ADDRESS_REDACTED]", label: "address" },
  { regex: DATE_OF_BIRTH_REGEX, replacement: "[DOB_REDACTED]", label: "dob" },
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
