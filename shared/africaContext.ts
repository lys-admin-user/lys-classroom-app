/**
 * Central source of truth for African country detection, WAEC bloc membership,
 * curriculum structure, local-language metadata, and the prompt addendum that
 * the lesson + assignment generators inject when the selected country is African.
 *
 * IMPORTANT: This module is additive. If a country is NOT detected as African,
 * the prompt builder returns an empty string and all upstream behavior is
 * preserved exactly. Do not let any logic here leak into non-African flows.
 */

export type AfricanRegion =
  | "West Africa"
  | "East Africa"
  | "Southern Africa"
  | "North Africa"
  | "Central Africa";

export type CurriculumSystem =
  | "WAEC"
  | "EAC"
  | "Anglophone"
  | "Francophone"
  | "Lusophone"
  | "Arabophone"
  | "American-influenced";

export interface AfricanCountryProfile {
  code: string;
  name: string;
  region: AfricanRegion;
  systems: CurriculumSystem[];
  isWAEC: boolean;
  examName: string;
  examFullName: string;
  gradeStructure: string;
  gradeLevels: string[];
  primaryLanguage: string;
  localLanguages: { code: string; name: string }[];
  caseStudies: string[];
  pedagogyNote: string;
}

const WAEC_GRADES = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

const PAN_AFRICAN_CASES = [
  "Flutterwave (Nigeria) — pan-African payments unicorn",
  "Dangote Group (Nigeria) — vertically integrated manufacturing",
  "M-Pesa (Kenya) — mobile-money revolution",
  "Andela (Pan-African) — global software talent pipeline",
  "Jumia (Pan-African) — e-commerce across 11 countries",
  "MTN (South Africa) — telecom across 19 markets",
  "Paystack (Nigeria) — fintech acquired by Stripe",
  "Safaricom (Kenya) — telecom + mobile money",
];

export const AFRICAN_COUNTRIES: AfricanCountryProfile[] = [
  // ===== WAEC bloc =====
  {
    code: "NG",
    name: "Nigeria",
    region: "West Africa",
    systems: ["WAEC", "Anglophone"],
    isWAEC: true,
    examName: "WASSCE",
    examFullName: "West African Senior School Certificate Examination",
    gradeStructure: "Transitioning from 6-3-3-4 to a 12-year uninterrupted model",
    gradeLevels: WAEC_GRADES,
    primaryLanguage: "English",
    localLanguages: [
      { code: "yo", name: "Yoruba" },
      { code: "ig", name: "Igbo" },
      { code: "ha", name: "Hausa" },
    ],
    caseStudies: [
      "Flutterwave — pan-African payments",
      "Dangote Group — vertically integrated manufacturing",
      "Paystack — fintech acquired by Stripe",
      "Andela — global software talent",
      "Jumia — e-commerce across Africa",
    ],
    pedagogyNote:
      "High student-to-teacher ratios (often 50:1+). Lecture-heavy norm; questioning the teacher is culturally discouraged. Provide explicit facilitator moves to surface student voice respectfully.",
  },
  {
    code: "GH",
    name: "Ghana",
    region: "West Africa",
    systems: ["WAEC", "Anglophone"],
    isWAEC: true,
    examName: "WASSCE",
    examFullName: "West African Senior School Certificate Examination",
    gradeStructure: "Standards-Based Curriculum emphasizing the 4Rs (Reading, wRiting, aRithmetic, cReativity)",
    gradeLevels: ["KG 1", "KG 2", "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6", "JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"],
    primaryLanguage: "English",
    localLanguages: [
      { code: "tw", name: "Twi (Akan)" },
      { code: "ee", name: "Ewe" },
      { code: "ga", name: "Ga" },
    ],
    caseStudies: [
      "mPharma — pharmaceutical supply chain",
      "Hubtel — fintech and SME tools",
      "Kaspa Tannery — Ghanaian leather export",
      "Flutterwave (regional)",
    ],
    pedagogyNote:
      "Ghana leads the WAEC bloc in standards-based reform. Lessons should explicitly tag the 4R being developed (Reading, Writing, Arithmetic, or Creativity).",
  },
  {
    code: "SL",
    name: "Sierra Leone",
    region: "West Africa",
    systems: ["WAEC", "Anglophone"],
    isWAEC: true,
    examName: "WASSCE",
    examFullName: "West African Senior School Certificate Examination",
    gradeStructure: "6-3-3-4 with strong national focus on foundational literacy and girls' education",
    gradeLevels: WAEC_GRADES,
    primaryLanguage: "English",
    localLanguages: [
      { code: "kri", name: "Krio" },
      { code: "men", name: "Mende" },
      { code: "tem", name: "Temne" },
    ],
    caseStudies: [
      "Easy Solar — off-grid solar for households",
      "Sensi Tech Hub (Freetown) — tech entrepreneurship",
      "Pan-African: Flutterwave, Andela",
    ],
    pedagogyNote:
      "Post-conflict context with rebuilding infrastructure. Emphasize foundational literacy + numeracy and explicitly include girls' STEM participation prompts.",
  },
  {
    code: "GM",
    name: "The Gambia",
    region: "West Africa",
    systems: ["WAEC", "Anglophone"],
    isWAEC: true,
    examName: "WASSCE",
    examFullName: "West African Senior School Certificate Examination",
    gradeStructure: "Lower Basic (1-6), Upper Basic (7-9), Senior Secondary (10-12)",
    gradeLevels: [
      "Lower Basic 1", "Lower Basic 2", "Lower Basic 3", "Lower Basic 4", "Lower Basic 5", "Lower Basic 6",
      "Upper Basic 7", "Upper Basic 8", "Upper Basic 9",
      "Senior Secondary 10", "Senior Secondary 11", "Senior Secondary 12",
    ],
    primaryLanguage: "English",
    localLanguages: [
      { code: "wo", name: "Wolof" },
      { code: "mnk", name: "Mandinka" },
      { code: "ff", name: "Fula" },
    ],
    caseStudies: [
      "Sterling Bank Gambia — local fintech",
      "Pan-African: Flutterwave, MTN, Andela",
    ],
    pedagogyNote:
      "Foundational literacy emphasis with growing STEM and girls' education focus. Use multilingual scaffolds when local language differs from English.",
  },
  {
    code: "LR",
    name: "Liberia",
    region: "West Africa",
    systems: ["WAEC", "American-influenced", "Anglophone"],
    isWAEC: true,
    examName: "WASSCE",
    examFullName: "West African Senior School Certificate Examination (with American-style K-12 grading and semesters)",
    gradeStructure: "American-style K-12 (semesters, GPA-style grading) layered onto WAEC certification",
    gradeLevels: [
      "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
      "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
    ],
    primaryLanguage: "English",
    localLanguages: [
      { code: "kpe", name: "Kpelle" },
      { code: "bzw", name: "Bassa" },
      { code: "vai", name: "Vai" },
    ],
    caseStudies: [
      "Orange Liberia — telecom + mobile money",
      "Pan-African: Flutterwave, MTN, Andela",
    ],
    pedagogyNote:
      "Liberia uniquely blends American-style K-12 structure with WAEC certification. Use US-familiar grade names but anchor exam objectives to WASSCE.",
  },

  // ===== Other Anglophone Africa =====
  {
    code: "ZA",
    name: "South Africa",
    region: "Southern Africa",
    systems: ["Anglophone"],
    isWAEC: false,
    examName: "NSC (Matric)",
    examFullName: "National Senior Certificate",
    gradeStructure: "CAPS curriculum: Grade R + Grades 1–12",
    gradeLevels: ["Grade R", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    primaryLanguage: "English",
    localLanguages: [
      { code: "zu", name: "isiZulu" },
      { code: "xh", name: "isiXhosa" },
      { code: "af", name: "Afrikaans" },
    ],
    caseStudies: [
      "MTN — telecom across 19 markets",
      "Discovery — insurance + fintech",
      "Yoco — SME card payments",
      "Pan-African: Flutterwave, Jumia",
    ],
    pedagogyNote:
      "CAPS-aligned, multilingual classrooms common. Lesson Close should explicitly address South Africa's 11 official languages and post-apartheid social cohesion themes.",
  },
  {
    code: "KE",
    name: "Kenya",
    region: "East Africa",
    systems: ["EAC", "Anglophone"],
    isWAEC: false,
    examName: "KCSE",
    examFullName: "Kenya Certificate of Secondary Education (CBC: Competency-Based Curriculum)",
    gradeStructure: "CBC 2-6-3-3-3 (PP1–PP2, Grades 1–6, JSS 7–9, SSS 10–12, University)",
    gradeLevels: ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    primaryLanguage: "English",
    localLanguages: [
      { code: "sw", name: "Kiswahili" },
    ],
    caseStudies: [
      "M-Pesa / Safaricom — mobile money pioneer",
      "Twiga Foods — agri-tech logistics",
      "Cellulant — pan-African payments",
      "Andela — software talent",
    ],
    pedagogyNote:
      "Kenya is mid-rollout of the CBC (Competency-Based Curriculum). Lessons should map to a CBC core competency (e.g., Critical Thinking, Digital Literacy, Citizenship).",
  },
  {
    code: "TZ",
    name: "Tanzania",
    region: "East Africa",
    systems: ["EAC", "Anglophone"],
    isWAEC: false,
    examName: "CSEE",
    examFullName: "Certificate of Secondary Education Examination",
    gradeStructure: "7-4-2-3 (Standard 1–7, Form 1–4, Form 5–6, University)",
    gradeLevels: ["Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6", "Standard 7", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6"],
    primaryLanguage: "Kiswahili (primary), English (secondary onward)",
    localLanguages: [
      { code: "sw", name: "Kiswahili" },
    ],
    caseStudies: [
      "NMB Bank — financial inclusion",
      "Vodacom Tanzania M-Pesa",
      "Pan-African: Andela, Jumia",
    ],
    pedagogyNote:
      "Kiswahili is the primary language of instruction in primary school. Bilingual lesson formatting is especially valuable here.",
  },
  {
    code: "UG",
    name: "Uganda",
    region: "East Africa",
    systems: ["EAC", "Anglophone"],
    isWAEC: false,
    examName: "UCE / UACE",
    examFullName: "Uganda Certificate of Education / Uganda Advanced Certificate of Education",
    gradeStructure: "7-4-2-3 (Primary 1–7, Senior 1–4, Senior 5–6, University)",
    gradeLevels: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Primary 7", "Senior 1", "Senior 2", "Senior 3", "Senior 4", "Senior 5", "Senior 6"],
    primaryLanguage: "English",
    localLanguages: [
      { code: "lg", name: "Luganda" },
      { code: "sw", name: "Kiswahili" },
    ],
    caseStudies: [
      "SafeBoda — mobility + payments",
      "Pan-African: M-Pesa, Andela, Jumia",
    ],
    pedagogyNote:
      "Strong vocational push at Senior 5–6. Connect lessons to BTVET (Business, Technical and Vocational Education and Training) pathways where relevant.",
  },
  {
    code: "RW",
    name: "Rwanda",
    region: "East Africa",
    systems: ["EAC", "Anglophone", "Francophone"],
    isWAEC: false,
    examName: "Rwandan National Examinations",
    examFullName: "Rwandan National Examinations (Competency-Based Curriculum)",
    gradeStructure: "6-3-3 with English-medium CBC since 2008",
    gradeLevels: ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"],
    primaryLanguage: "English",
    localLanguages: [
      { code: "rw", name: "Kinyarwanda" },
      { code: "fr", name: "French" },
    ],
    caseStudies: [
      "Bank of Kigali — digital banking",
      "Zipline — drone medical delivery",
      "Pan-African: M-Pesa, Andela",
    ],
    pedagogyNote:
      "Rwanda's CBC explicitly emphasizes problem-solving and cross-cutting issues (gender, peace, environment). Tag lessons to one cross-cutting issue.",
  },
  {
    code: "ET",
    name: "Ethiopia",
    region: "East Africa",
    systems: ["Anglophone"],
    isWAEC: false,
    examName: "EUEE",
    examFullName: "Ethiopian University Entrance Examination",
    gradeStructure: "8-2-2 (Primary 1–8, Secondary 9–10, Preparatory 11–12)",
    gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    primaryLanguage: "English (secondary), Amharic (primary)",
    localLanguages: [
      { code: "am", name: "Amharic" },
      { code: "om", name: "Afaan Oromo" },
      { code: "ti", name: "Tigrinya" },
    ],
    caseStudies: [
      "Ethio Telecom — telecom modernization",
      "Pan-African: M-Pesa, Andela, Jumia",
    ],
    pedagogyNote:
      "Mother-tongue instruction in early primary is the norm; English is introduced later. Plan vocabulary scaffolds for the language transition.",
  },

  // ===== North Africa =====
  {
    code: "EG",
    name: "Egypt",
    region: "North Africa",
    systems: ["Arabophone"],
    isWAEC: false,
    examName: "Thanaweya Amma",
    examFullName: "Egyptian General Secondary Education Certificate",
    gradeStructure: "6-3-3 (Primary, Preparatory, Secondary)",
    gradeLevels: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Preparatory 1", "Preparatory 2", "Preparatory 3", "Secondary 1", "Secondary 2", "Secondary 3"],
    primaryLanguage: "Arabic (English/French in international schools)",
    localLanguages: [
      { code: "ar", name: "Arabic" },
    ],
    caseStudies: [
      "Fawry — payments and banking services",
      "Swvl — transit tech (NASDAQ-listed)",
      "Pan-African: Flutterwave, Jumia",
    ],
    pedagogyNote:
      "Highly exam-centric culture. Build practice retrieval into the lesson while still preserving open-ended BE/DO components.",
  },
  {
    code: "MA",
    name: "Morocco",
    region: "North Africa",
    systems: ["Francophone", "Arabophone"],
    isWAEC: false,
    examName: "Baccalauréat",
    examFullName: "Moroccan Baccalauréat",
    gradeStructure: "French-influenced 6-3-3 with bilingual Arabic + French instruction",
    gradeLevels: ["Primaire 1", "Primaire 2", "Primaire 3", "Primaire 4", "Primaire 5", "Primaire 6", "Collège 1", "Collège 2", "Collège 3", "Lycée 1", "Lycée 2", "Lycée 3 (Bac)"],
    primaryLanguage: "Arabic + French",
    localLanguages: [
      { code: "ar", name: "Arabic" },
      { code: "fr", name: "French" },
      { code: "zgh", name: "Tamazight (Berber)" },
    ],
    caseStudies: [
      "Inwi — telecom",
      "Attijariwafa Bank — pan-African banking",
      "Pan-African: Jumia (Morocco HQ), Flutterwave",
    ],
    pedagogyNote:
      "French is the language of higher education and STEM. Consider French + Arabic bilingual framing rather than English defaults.",
  },
  {
    code: "TN",
    name: "Tunisia",
    region: "North Africa",
    systems: ["Francophone", "Arabophone"],
    isWAEC: false,
    examName: "Baccalauréat",
    examFullName: "Tunisian Baccalauréat",
    gradeStructure: "French-influenced with Arabic + French instruction",
    gradeLevels: ["Primaire 1", "Primaire 2", "Primaire 3", "Primaire 4", "Primaire 5", "Primaire 6", "Collège 1", "Collège 2", "Collège 3", "Secondaire 1", "Secondaire 2", "Secondaire 3", "Bac"],
    primaryLanguage: "Arabic + French",
    localLanguages: [
      { code: "ar", name: "Arabic" },
      { code: "fr", name: "French" },
    ],
    caseStudies: [
      "InstaDeep — AI startup",
      "Expensya — fintech",
      "Pan-African: Jumia, Flutterwave",
    ],
    pedagogyNote:
      "STEM and technical subjects are typically taught in French. Bilingual support is essential.",
  },
  {
    code: "DZ",
    name: "Algeria",
    region: "North Africa",
    systems: ["Francophone", "Arabophone"],
    isWAEC: false,
    examName: "Baccalauréat",
    examFullName: "Algerian Baccalauréat",
    gradeStructure: "5-4-3 with Arabic-medium primary, French in higher ed",
    gradeLevels: ["Primaire 1", "Primaire 2", "Primaire 3", "Primaire 4", "Primaire 5", "Moyen 1", "Moyen 2", "Moyen 3", "Moyen 4", "Secondaire 1", "Secondaire 2", "Bac"],
    primaryLanguage: "Arabic + French",
    localLanguages: [
      { code: "ar", name: "Arabic" },
      { code: "fr", name: "French" },
      { code: "zgh", name: "Tamazight" },
    ],
    caseStudies: ["Sonatrach — energy", "Pan-African: Jumia, Flutterwave"],
    pedagogyNote: "Arabic-medium primary, Francophone higher ed. Plan vocabulary bridges for the language transition.",
  },

  // ===== Other Francophone West & Central Africa =====
  {
    code: "SN",
    name: "Senegal",
    region: "West Africa",
    systems: ["Francophone"],
    isWAEC: false,
    examName: "Baccalauréat",
    examFullName: "Senegalese Baccalauréat",
    gradeStructure: "6-4-3 (Primaire, Collège, Lycée)",
    gradeLevels: ["CI", "CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "2nde", "1ère", "Terminale"],
    primaryLanguage: "French",
    localLanguages: [
      { code: "wo", name: "Wolof" },
      { code: "ff", name: "Pulaar" },
      { code: "snk", name: "Soninke" },
    ],
    caseStudies: [
      "Wave — mobile money disrupting M-Pesa model",
      "Sonatel — telecom",
      "Pan-African: Flutterwave, Jumia",
    ],
    pedagogyNote: "French-medium classroom; Wolof is the lingua franca. Bilingual framing helps reach all students.",
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    region: "West Africa",
    systems: ["Francophone"],
    isWAEC: false,
    examName: "Baccalauréat",
    examFullName: "Ivorian Baccalauréat",
    gradeStructure: "6-4-3 (French model)",
    gradeLevels: ["CP1", "CP2", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "2nde", "1ère", "Terminale"],
    primaryLanguage: "French",
    localLanguages: [
      { code: "dyu", name: "Dioula" },
      { code: "bci", name: "Baoulé" },
    ],
    caseStudies: [
      "Orange Money Côte d'Ivoire",
      "Société Ivoirienne de Banque",
      "Pan-African: Flutterwave, Jumia",
    ],
    pedagogyNote: "Francophone curriculum. Connect entrepreneurship to West African cocoa, agri-tech, and ECOWAS trade context.",
  },
  {
    code: "CM",
    name: "Cameroon",
    region: "Central Africa",
    systems: ["Francophone", "Anglophone"],
    isWAEC: false,
    examName: "GCE / Baccalauréat",
    examFullName: "Cameroon GCE (Anglophone) and Baccalauréat (Francophone)",
    gradeStructure: "Dual systems — English subsystem mirrors UK, French subsystem mirrors France",
    gradeLevels: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"],
    primaryLanguage: "French + English (officially bilingual)",
    localLanguages: [
      { code: "fr", name: "French" },
      { code: "en", name: "English" },
    ],
    caseStudies: ["MTN Mobile Money Cameroon", "Pan-African: Flutterwave, Jumia"],
    pedagogyNote: "Officially bilingual. Always offer the lesson in both English and French side-by-side regardless of selected language.",
  },
  {
    code: "CD",
    name: "Democratic Republic of the Congo",
    region: "Central Africa",
    systems: ["Francophone"],
    isWAEC: false,
    examName: "Diplôme d'État",
    examFullName: "DRC Diplôme d'État",
    gradeStructure: "6-6 (Primaire, Secondaire)",
    gradeLevels: ["Primaire 1", "Primaire 2", "Primaire 3", "Primaire 4", "Primaire 5", "Primaire 6", "Secondaire 1", "Secondaire 2", "Secondaire 3", "Secondaire 4", "Secondaire 5", "Secondaire 6"],
    primaryLanguage: "French",
    localLanguages: [
      { code: "ln", name: "Lingala" },
      { code: "sw", name: "Kiswahili" },
      { code: "kg", name: "Kikongo" },
      { code: "lua", name: "Tshiluba" },
    ],
    caseStudies: ["Vodacom Congo M-Pesa", "Pan-African: Flutterwave, Jumia"],
    pedagogyNote: "Highly multilingual. Plan vocabulary support across French and the four national languages.",
  },

  // ===== Lusophone =====
  {
    code: "AO",
    name: "Angola",
    region: "Southern Africa",
    systems: ["Lusophone"],
    isWAEC: false,
    examName: "Exame Nacional",
    examFullName: "Angolan National Examination",
    gradeStructure: "6-6 (Portuguese-influenced)",
    gradeLevels: ["1ª Classe", "2ª Classe", "3ª Classe", "4ª Classe", "5ª Classe", "6ª Classe", "7ª Classe", "8ª Classe", "9ª Classe", "10ª Classe", "11ª Classe", "12ª Classe"],
    primaryLanguage: "Portuguese",
    localLanguages: [
      { code: "kmb", name: "Kimbundu" },
      { code: "umb", name: "Umbundu" },
    ],
    caseStudies: ["Sonangol — energy", "Pan-African: MTN, Flutterwave"],
    pedagogyNote: "Portuguese-medium. Connect entrepreneurship to oil/gas diversification and SADC regional trade.",
  },
  {
    code: "MZ",
    name: "Mozambique",
    region: "Southern Africa",
    systems: ["Lusophone"],
    isWAEC: false,
    examName: "Exame Nacional",
    examFullName: "Mozambican National Examination",
    gradeStructure: "7-3-2 (Portuguese-influenced)",
    gradeLevels: ["1ª Classe", "2ª Classe", "3ª Classe", "4ª Classe", "5ª Classe", "6ª Classe", "7ª Classe", "8ª Classe", "9ª Classe", "10ª Classe", "11ª Classe", "12ª Classe"],
    primaryLanguage: "Portuguese",
    localLanguages: [
      { code: "vmw", name: "Emakhuwa" },
      { code: "ts", name: "Xitsonga" },
    ],
    caseStudies: ["mCel — telecom", "Pan-African: MTN, Flutterwave"],
    pedagogyNote: "Portuguese-medium with growing bilingual programs in local languages. Use mother-tongue scaffolds where possible.",
  },
  {
    code: "ZM",
    name: "Zambia",
    region: "Southern Africa",
    systems: ["Anglophone"],
    isWAEC: false,
    examName: "ECZ (Grade 12)",
    examFullName: "Examinations Council of Zambia, Grade 12 Certificate",
    gradeStructure: "7-2-3 (Primary 1-7, Junior Secondary 8-9, Senior Secondary 10-12)",
    gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    primaryLanguage: "English",
    localLanguages: [
      { code: "bem", name: "Bemba" },
      { code: "ny", name: "Nyanja (Chewa)" },
      { code: "toi", name: "Tonga" },
    ],
    caseStudies: ["Zambia Sugar", "Airtel Zambia", "Pan-African: MTN, Flutterwave"],
    pedagogyNote: "English-medium from Grade 5; lower primary uses one of seven zonal languages. Lean on local language for concept introduction in Grades 1-4.",
  },
];

// Canonical alias map so common name variants still trigger detection
// (e.g., "Gambia" vs the official "The Gambia", "Cote d'Ivoire" vs "Côte d'Ivoire").
const AFRICAN_NAME_ALIASES: Record<string, string> = {
  "gambia": "The Gambia",
  "ivory coast": "Côte d'Ivoire",
  "cote d'ivoire": "Côte d'Ivoire",
  "drc": "Democratic Republic of the Congo",
  "dr congo": "Democratic Republic of the Congo",
  "congo (kinshasa)": "Democratic Republic of the Congo",
};

const ALL_AFRICAN_CODES = new Set(AFRICAN_COUNTRIES.map(c => c.code));
const ALL_AFRICAN_NAMES = new Set(AFRICAN_COUNTRIES.map(c => c.name.toLowerCase()));

/**
 * Detect whether a given country (code OR display name) is an African country
 * recognized by this module. Returns false for unknown / non-African inputs so
 * the caller can short-circuit to existing behavior.
 */
export function isAfricanCountry(country: string | undefined | null): boolean {
  if (!country) return false;
  const trimmed = country.trim();
  if (AFRICAN_NAME_ALIASES[trimmed.toLowerCase()]) return true;
  if (trimmed.length === 2 && ALL_AFRICAN_CODES.has(trimmed.toUpperCase())) return true;
  return ALL_AFRICAN_NAMES.has(trimmed.toLowerCase());
}

/**
 * Strict, deterministic detection of an African country reference inside an
 * arbitrary text blob (used for older saved lessons that don't carry a
 * structured country field). Matches ONLY:
 *   - exact African country names (case-insensitive, word-boundary)
 *   - aliases from AFRICAN_NAME_ALIASES
 *   - exam names (WASSCE, KCSE, etc.) — these are unambiguous
 * Does NOT match country names appearing inside larger words. Topic strings
 * like "History of Nigeria" still match — so callers should pass the
 * STRUCTURED `standards` field only, never the user-authored topic.
 */
export function detectAfricanCountryFromText(text: string | undefined | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Try aliases first (longest-first to avoid prefix collisions)
  const aliases = Object.keys(AFRICAN_NAME_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) return AFRICAN_NAME_ALIASES[alias];
  }
  // Then unambiguous exam names — strong positive signal regardless of country mention
  for (const c of AFRICAN_COUNTRIES) {
    const exam = c.examName.split(/[\s/(]/)[0].toLowerCase();
    if (exam.length >= 4 && new RegExp(`\\b${exam}\\b`, "i").test(lower)) return c.name;
  }
  // Finally, exact country names with word boundaries
  const sorted = [...AFRICAN_COUNTRIES].sort((a, b) => b.name.length - a.name.length);
  for (const c of sorted) {
    const re = new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) return c.name;
  }
  return null;
}

export function getAfricanProfile(country: string | undefined | null): AfricanCountryProfile | null {
  if (!country) return null;
  const trimmed = country.trim();
  if (trimmed.length === 2) {
    return AFRICAN_COUNTRIES.find(c => c.code === trimmed.toUpperCase()) || null;
  }
  const aliasResolved = AFRICAN_NAME_ALIASES[trimmed.toLowerCase()] || trimmed;
  return AFRICAN_COUNTRIES.find(c => c.name.toLowerCase() === aliasResolved.toLowerCase()) || null;
}

export function isWAECCountry(country: string | undefined | null): boolean {
  return getAfricanProfile(country)?.isWAEC === true;
}

/**
 * Returns the prompt addendum injected into the lesson/assignment generator
 * when an African country is selected. Returns "" for non-African countries
 * so non-African flows are byte-for-byte unchanged.
 *
 * `language` is the local-language code OR name selected by the educator.
 * Pass "" or "english" for English-only output.
 */
export function buildAfricanPromptAddendum(args: {
  country: string | undefined | null;
  language?: string | undefined | null;
  mode: "lesson" | "assignment";
}): string {
  const profile = getAfricanProfile(args.country);
  if (!profile) return "";

  const langInput = (args.language || "").trim().toLowerCase();
  const wantsBilingual = !!langInput && langInput !== "english" && langInput !== "en";
  const localLang = profile.localLanguages.find(
    l => l.code.toLowerCase() === langInput || l.name.toLowerCase() === langInput,
  );
  const localLangName = localLang?.name || (wantsBilingual ? args.language : "");

  const waecBlock = profile.isWAEC
    ? `
WAEC / WASSCE ALIGNMENT (this country is in the WAEC bloc):
- Frame learning objectives so they are explicitly testable on the ${profile.examName} (${profile.examFullName}).
- Use WAEC terminology for grade names (e.g., JSS / SSS, Forms, Basic) — DO NOT default to "Middle School" or "High School".
- Mention the relevant WAEC subject area (e.g., "Further Mathematics", "Government", "Economics", "Agricultural Science") where applicable.
- Add an "Exam Practice" micro-section showing 1 short past-paper-style question that mirrors the lesson objective.

DUAL-PATH BRIDGE (REQUIRED for WAEC lessons):
The WAEC system is certification-driven and tests "Knowing" heavily but rarely "Being" or "Doing". For every lesson, explicitly add:
- WAEC Outcome: the exam-aligned competency the student earns toward their certificate.
- Global Competency: the parallel 21st-century / digital-portfolio artifact the student creates (e.g., a 60-second explainer video, a Canva infographic, a one-page case study, a GitHub README, a podcast clip). This is the student's "Doing" evidence for global employability.
- Make these two paths reinforce each other, not compete.

PEDAGOGY GUIDANCE:
${profile.pedagogyNote}
- Shift the teacher from "sage on the stage" to "guide on the side". Provide a short "How to deliver this in a high-ratio classroom (40+ students)" facilitation note: turn-and-talks, numbered heads, exit tickets on paper, low-tech alternatives if power/internet is unreliable.
- Replace any silicon-valley default examples with African case studies. Suggested: ${profile.caseStudies.slice(0, 3).join("; ")}.

BE-KNOW-DO REFRAMING:
The WAEC syllabus already drills KNOW. Use the BE pillar deliberately to fill that gap — explicitly develop character, identity, values, and student voice (which the dominant pedagogy culturally suppresses). Use DO to anchor the global-competency artifact described above.
`
    : `
NATIONAL CURRICULUM ALIGNMENT:
- This country uses ${profile.examName} (${profile.examFullName}).
- Grade structure: ${profile.gradeStructure}.
- Use the country's own grade names (${profile.gradeLevels.slice(0, 4).join(", ")}, ...) — DO NOT default to US "Middle School" / "High School".
- Pedagogy note: ${profile.pedagogyNote}
- Replace silicon-valley default examples with African case studies. Suggested: ${profile.caseStudies.slice(0, 3).join("; ")}.
`;

  const bilingualBlock = wantsBilingual && localLangName
    ? `
BILINGUAL OUTPUT (REQUIRED — student-facing fields must appear in BOTH English AND ${localLangName}):
For the following fields, format the value as: "<English>  ||  <${localLangName} translation>"
- title
- objectives (each one)
- essentialQuestions (each one)
- activity titles AND descriptions
- materials list items
- the lessonClose dimensions (educational, social, etc.)
- assessment description
- (assignments only) every question stimulus AND question text
Use natural, classroom-appropriate ${localLangName} — not literal word-for-word translation. Keep technical/scientific terms in English in parentheses where ${localLangName} lacks an established term. The "||" separator is mandatory so the UI can split it cleanly.
`
    : "";

  const ecosystemBlock = `
GLOBAL CASE STUDIES — use these African examples as the DEFAULT, not US examples:
Country-specific: ${profile.caseStudies.join("; ")}
Pan-African anchors (use any when relevant): ${PAN_AFRICAN_CASES.slice(0, 4).join("; ")}
`;

  const sectionLabel = args.mode === "lesson" ? "AFRICAN CONTEXT (REQUIRED)" : "AFRICAN CONTEXT FOR THIS ASSIGNMENT (REQUIRED)";

  return `

=== ${sectionLabel} ===
Country: ${profile.name} (${profile.region})
Curriculum system: ${profile.systems.join(" + ")}
Terminal exam: ${profile.examName} — ${profile.examFullName}
Primary language of instruction: ${profile.primaryLanguage}
${waecBlock}${ecosystemBlock}${bilingualBlock}=== END AFRICAN CONTEXT ===
`;
}

/** Convenience: African grade levels used by the UI when an African country is selected. */
export function getAfricanGradeLevels(country: string | undefined | null): string[] {
  return getAfricanProfile(country)?.gradeLevels || [];
}

/** Convenience: local languages used by the UI. */
export function getAfricanLocalLanguages(country: string | undefined | null) {
  return getAfricanProfile(country)?.localLanguages || [];
}
