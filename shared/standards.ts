export interface StandardCode {
  code: string;
  description: string;
}

export interface SubjectStandards {
  subject: string;
  grades: string[];
  standards: StandardCode[];
}

export interface StateStandards {
  state: string;
  abbreviation: string;
  standardsName: string;
  subjects: SubjectStandards[];
}

export interface CountryStandards {
  country: string;
  states: StateStandards[];
}

// ============================================================
// SHARED COUNTRY DATA (referenced by educationalStandards below
// AND by the getSubjects fallback chain so we can satisfy lookups
// where the database has per-region jurisdictions but no codes).
// ============================================================

type GenericCountryEntry = { name: string; exam: string; grades: string[] };

const africanCoreSubjects = (grades: string[]): SubjectStandards[] => [
  { subject: "English Language", grades, standards: [] },
  { subject: "Mathematics", grades, standards: [] },
  { subject: "Integrated Science", grades, standards: [] },
  { subject: "Social Studies", grades, standards: [] },
  { subject: "Civic Education", grades, standards: [] },
  { subject: "Computer Studies / ICT", grades, standards: [] },
  { subject: "Agricultural Science", grades, standards: [] },
  { subject: "Business Studies / Entrepreneurship", grades, standards: [] },
  { subject: "Cultural & Creative Arts", grades, standards: [] },
  { subject: "Religious & Moral Education", grades, standards: [] },
  { subject: "French", grades, standards: [] },
  { subject: "Physical & Health Education", grades, standards: [] },
];

const internationalCoreSubjects = (grades: string[]): SubjectStandards[] => [
  { subject: "English / Language Arts", grades, standards: [] },
  { subject: "Mathematics", grades, standards: [] },
  { subject: "Science", grades, standards: [] },
  { subject: "Social Studies / History", grades, standards: [] },
  { subject: "Civics / Values Education", grades, standards: [] },
  { subject: "Information & Communication Technology", grades, standards: [] },
  { subject: "Physical & Health Education", grades, standards: [] },
  { subject: "Arts & Culture", grades, standards: [] },
  { subject: "National / Local Language", grades, standards: [] },
  { subject: "Religion / Moral Education", grades, standards: [] },
  { subject: "Career & Technical Education", grades, standards: [] },
];

const AFRICAN_COUNTRIES_DATA: GenericCountryEntry[] = [
  { name: "Nigeria", exam: "WASSCE / NECO", grades: ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6","JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"] },
  { name: "Ghana", exam: "WASSCE (Standards-Based / 4Rs)", grades: ["KG 1","KG 2","Basic 1","Basic 2","Basic 3","Basic 4","Basic 5","Basic 6","JHS 1","JHS 2","JHS 3","SHS 1","SHS 2","SHS 3"] },
  { name: "Sierra Leone", exam: "WASSCE", grades: ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6","JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"] },
  { name: "The Gambia", exam: "WASSCE", grades: ["Lower Basic 1","Lower Basic 2","Lower Basic 3","Lower Basic 4","Lower Basic 5","Lower Basic 6","Upper Basic 7","Upper Basic 8","Upper Basic 9","Senior Secondary 10","Senior Secondary 11","Senior Secondary 12"] },
  { name: "Liberia", exam: "WASSCE (US-style K-12)", grades: ["Kindergarten","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"] },
  { name: "South Africa", exam: "NSC (Matric) — CAPS", grades: ["Grade R","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"] },
  { name: "Kenya", exam: "KCSE (CBC)", grades: ["PP1","PP2","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"] },
  { name: "Tanzania", exam: "CSEE", grades: ["Standard 1","Standard 2","Standard 3","Standard 4","Standard 5","Standard 6","Standard 7","Form 1","Form 2","Form 3","Form 4","Form 5","Form 6"] },
  { name: "Uganda", exam: "UCE / UACE", grades: ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6","Primary 7","Senior 1","Senior 2","Senior 3","Senior 4","Senior 5","Senior 6"] },
  { name: "Rwanda", exam: "Rwandan National Exams (CBC)", grades: ["P1","P2","P3","P4","P5","P6","S1","S2","S3","S4","S5","S6"] },
  { name: "Ethiopia", exam: "EUEE", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"] },
  { name: "Egypt", exam: "Thanaweya Amma", grades: ["Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6","Preparatory 1","Preparatory 2","Preparatory 3","Secondary 1","Secondary 2","Secondary 3"] },
  { name: "Morocco", exam: "Baccalauréat", grades: ["Primaire 1","Primaire 2","Primaire 3","Primaire 4","Primaire 5","Primaire 6","Collège 1","Collège 2","Collège 3","Lycée 1","Lycée 2","Lycée 3 (Bac)"] },
  { name: "Tunisia", exam: "Baccalauréat", grades: ["Primaire 1","Primaire 2","Primaire 3","Primaire 4","Primaire 5","Primaire 6","Collège 1","Collège 2","Collège 3","Secondaire 1","Secondaire 2","Secondaire 3","Bac"] },
  { name: "Algeria", exam: "Baccalauréat", grades: ["Primaire 1","Primaire 2","Primaire 3","Primaire 4","Primaire 5","Moyen 1","Moyen 2","Moyen 3","Moyen 4","Secondaire 1","Secondaire 2","Bac"] },
  { name: "Senegal", exam: "Baccalauréat", grades: ["CI","CP","CE1","CE2","CM1","CM2","6e","5e","4e","3e","2nde","1ère","Terminale"] },
  { name: "Côte d'Ivoire", exam: "Baccalauréat", grades: ["CP1","CP2","CE1","CE2","CM1","CM2","6e","5e","4e","3e","2nde","1ère","Terminale"] },
  { name: "Cameroon", exam: "GCE / Baccalauréat", grades: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Form 1","Form 2","Form 3","Form 4","Form 5","Lower Sixth","Upper Sixth"] },
  { name: "Democratic Republic of the Congo", exam: "Diplôme d'État", grades: ["Primaire 1","Primaire 2","Primaire 3","Primaire 4","Primaire 5","Primaire 6","Secondaire 1","Secondaire 2","Secondaire 3","Secondaire 4","Secondaire 5","Secondaire 6"] },
  { name: "Angola", exam: "Exame Nacional", grades: ["1ª Classe","2ª Classe","3ª Classe","4ª Classe","5ª Classe","6ª Classe","7ª Classe","8ª Classe","9ª Classe","10ª Classe","11ª Classe","12ª Classe"] },
  { name: "Mozambique", exam: "Exame Nacional", grades: ["1ª Classe","2ª Classe","3ª Classe","4ª Classe","5ª Classe","6ª Classe","7ª Classe","8ª Classe","9ª Classe","10ª Classe","11ª Classe","12ª Classe"] },
  { name: "Zambia", exam: "ECZ (Grade 12)", grades: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"] },
];
const AFRICAN_COUNTRY_NAMES: Set<string> = new Set(AFRICAN_COUNTRIES_DATA.map(c => c.name));

// Non-African developing nations whose national curricula lack per-outcome
// standard codes in CSP. Grades reflect each country's own grade structure.
const INTERNATIONAL_DEVELOPING_NATIONS: GenericCountryEntry[] = [
  { name: "Philippines", exam: "K-12 Curriculum (DepEd)", grades: ["Kindergarten","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"] },
  { name: "Indonesia", exam: "Kurikulum Merdeka", grades: ["SD 1","SD 2","SD 3","SD 4","SD 5","SD 6","SMP 7","SMP 8","SMP 9","SMA 10","SMA 11","SMA 12"] },
  { name: "India", exam: "CBSE / NEP 2020", grades: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"] },
  { name: "Pakistan", exam: "Single National Curriculum", grades: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"] },
  { name: "Bangladesh", exam: "SSC / HSC", grades: ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"] },
  { name: "Vietnam", exam: "General Education Curriculum 2018", grades: ["Lớp 1","Lớp 2","Lớp 3","Lớp 4","Lớp 5","Lớp 6","Lớp 7","Lớp 8","Lớp 9","Lớp 10","Lớp 11","Lớp 12"] },
  { name: "Thailand", exam: "Basic Education Core Curriculum", grades: ["P.1","P.2","P.3","P.4","P.5","P.6","M.1","M.2","M.3","M.4","M.5","M.6"] },
  { name: "Malaysia", exam: "KSSR / KSSM", grades: ["Standard 1","Standard 2","Standard 3","Standard 4","Standard 5","Standard 6","Form 1","Form 2","Form 3","Form 4","Form 5"] },
  { name: "Brazil", exam: "BNCC", grades: ["1º Ano","2º Ano","3º Ano","4º Ano","5º Ano","6º Ano","7º Ano","8º Ano","9º Ano","1ª Série EM","2ª Série EM","3ª Série EM"] },
  { name: "Mexico", exam: "Plan de Estudios SEP", grades: ["Preescolar","Primaria 1","Primaria 2","Primaria 3","Primaria 4","Primaria 5","Primaria 6","Secundaria 1","Secundaria 2","Secundaria 3","Bachillerato 1","Bachillerato 2","Bachillerato 3"] },
  { name: "Colombia", exam: "Estándares Básicos MEN", grades: ["Grado 1","Grado 2","Grado 3","Grado 4","Grado 5","Grado 6","Grado 7","Grado 8","Grado 9","Grado 10","Grado 11"] },
  { name: "Peru", exam: "Currículo Nacional", grades: ["Inicial","Primaria 1","Primaria 2","Primaria 3","Primaria 4","Primaria 5","Primaria 6","Secundaria 1","Secundaria 2","Secundaria 3","Secundaria 4","Secundaria 5"] },
  { name: "Argentina", exam: "Núcleos de Aprendizajes Prioritarios", grades: ["1º Grado","2º Grado","3º Grado","4º Grado","5º Grado","6º Grado","7º Grado","1º Año","2º Año","3º Año","4º Año","5º Año"] },
  { name: "Chile", exam: "Bases Curriculares MINEDUC", grades: ["1º Básico","2º Básico","3º Básico","4º Básico","5º Básico","6º Básico","7º Básico","8º Básico","1º Medio","2º Medio","3º Medio","4º Medio"] },
];
const INTERNATIONAL_DEVELOPING_NATION_NAMES: Set<string> = new Set(INTERNATIONAL_DEVELOPING_NATIONS.map(c => c.name));

export const educationalStandards: CountryStandards[] = [
  {
    country: "United States",
    states: [
      {
        state: "Texas",
        abbreviation: "TX",
        standardsName: "TEKS",
        subjects: [
          {
            subject: "English Language Arts & Reading",
            grades: ["6", "7", "8", "9", "10", "11", "12"],
            standards: [
              { code: "6.6A", description: "Describe personal connections to a variety of sources" },
              { code: "6.6B", description: "Generate questions about text before, during, and after reading" },
              { code: "6.6C", description: "Make inferences and use evidence to support understanding" },
              { code: "7.6A", description: "Describe personal connections to a variety of sources" },
              { code: "7.6B", description: "Generate questions about text before, during, and after reading" },
              { code: "7.6E", description: "Interact with sources in meaningful ways" },
              { code: "8.6A", description: "Describe personal connections to a variety of sources" },
              { code: "8.6B", description: "Generate questions about text before, during, and after reading" },
              { code: "8.6E", description: "Interact with sources in meaningful ways such as annotating" },
              { code: "8.6F", description: "Respond using newly acquired vocabulary as appropriate" },
              { code: "8.9A", description: "Explain the author's purpose and message within a text" },
              { code: "8.9B", description: "Analyze how the use of text structure contributes to the author's purpose" },
              { code: "8.10A", description: "Explain the author's purpose and message within a text" },
              { code: "8.10B", description: "Analyze how the use of text structure contributes to the author's purpose" },
            ],
          },
          {
            subject: "Mathematics",
            grades: ["6", "7", "8", "Algebra I", "Geometry", "Algebra II"],
            standards: [
              { code: "6.2A", description: "Classify whole numbers, integers, and rational numbers" },
              { code: "6.2B", description: "Identify a number, its opposite, and its absolute value" },
              { code: "6.2C", description: "Locate, compare, and order integers and rational numbers" },
              { code: "6.2D", description: "Order a set of rational numbers arising from mathematical and real-world contexts" },
              { code: "6.3A", description: "Recognize that dividing by a rational number and multiplying by its reciprocal result in equivalent values" },
              { code: "6.3B", description: "Determine, with and without computation, whether a quantity is increased or decreased" },
              { code: "7.2A", description: "Extend previous knowledge of sets and subsets" },
              { code: "7.3A", description: "Add, subtract, multiply, and divide rational numbers fluently" },
              { code: "7.3B", description: "Apply and extend previous understandings of operations to solve problems" },
              { code: "8.2A", description: "Extend previous knowledge of sets and subsets" },
              { code: "8.2B", description: "Approximate the value of an irrational number" },
              { code: "8.2C", description: "Convert between standard decimal notation and scientific notation" },
            ],
          },
          {
            subject: "Science",
            grades: ["6", "7", "8", "Biology", "Chemistry", "Physics"],
            standards: [
              { code: "6.1A", description: "Demonstrate safe practices during laboratory and field investigations" },
              { code: "6.2A", description: "Plan and implement comparative and descriptive investigations" },
              { code: "6.2B", description: "Design and implement experimental investigations" },
              { code: "7.1A", description: "Demonstrate safe practices during laboratory and field investigations" },
              { code: "7.2A", description: "Plan and implement comparative and descriptive investigations" },
              { code: "8.1A", description: "Demonstrate safe practices during laboratory and field investigations" },
              { code: "8.2A", description: "Plan and implement comparative and descriptive investigations" },
              { code: "8.2B", description: "Design and implement experimental investigations" },
              { code: "8.2C", description: "Collect and record data using the International System of Units" },
              { code: "8.2D", description: "Construct tables and graphs, using repeated trials and means" },
              { code: "8.2E", description: "Analyze data to formulate reasonable explanations" },
            ],
          },
          {
            subject: "Social Studies",
            grades: ["6", "7", "8", "US History", "World Geography", "Government", "Economics"],
            standards: [
              { code: "6.1A", description: "Apply absolute and relative chronology through the sequencing of significant individuals, events, and time periods" },
              { code: "6.2A", description: "Identify major causes and describe the major effects of the following events" },
              { code: "7.1A", description: "Identify the major eras in Texas history" },
              { code: "7.2A", description: "Compare the cultures of American Indians in Texas" },
              { code: "8.1A", description: "Identify the major eras and events in U.S. history" },
              { code: "8.2A", description: "Identify reasons for European exploration and colonization" },
            ],
          },
        ],
      },
      {
        state: "California",
        abbreviation: "CA",
        standardsName: "CCSS",
        subjects: [
          {
            subject: "English Language Arts",
            grades: ["6", "7", "8", "9-10", "11-12"],
            standards: [
              { code: "RL.6.1", description: "Cite textual evidence to support analysis of what the text says" },
              { code: "RL.6.2", description: "Determine a theme or central idea of a text" },
              { code: "RL.7.1", description: "Cite several pieces of textual evidence" },
              { code: "RL.8.1", description: "Cite the textual evidence that most strongly supports an analysis" },
              { code: "W.6.1", description: "Write arguments to support claims with clear reasons and relevant evidence" },
              { code: "W.7.1", description: "Write arguments to support claims with clear reasons and relevant evidence" },
              { code: "W.8.1", description: "Write arguments to support claims with clear reasons and relevant evidence" },
            ],
          },
          {
            subject: "Mathematics",
            grades: ["6", "7", "8", "Algebra I", "Geometry", "Algebra II"],
            standards: [
              { code: "6.NS.1", description: "Interpret and compute quotients of fractions" },
              { code: "6.NS.2", description: "Fluently divide multi-digit numbers" },
              { code: "6.NS.3", description: "Fluently add, subtract, multiply, and divide multi-digit decimals" },
              { code: "7.NS.1", description: "Apply and extend previous understandings of addition and subtraction" },
              { code: "7.NS.2", description: "Apply and extend previous understandings of multiplication and division" },
              { code: "8.NS.1", description: "Know that numbers that are not rational are called irrational" },
              { code: "8.NS.2", description: "Use rational approximations of irrational numbers" },
            ],
          },
        ],
      },
      {
        state: "Florida",
        abbreviation: "FL",
        standardsName: "B.E.S.T.",
        subjects: [
          {
            subject: "English Language Arts",
            grades: ["6", "7", "8", "9", "10", "11", "12"],
            standards: [
              { code: "ELA.6.R.1.1", description: "Analyze the impact of setting on character development and plot" },
              { code: "ELA.6.R.1.2", description: "Analyze the development of stated or implied theme(s)" },
              { code: "ELA.7.R.1.1", description: "Analyze the impact of setting on character development and plot" },
              { code: "ELA.8.R.1.1", description: "Analyze the interaction between character development and plot" },
            ],
          },
          {
            subject: "Mathematics",
            grades: ["6", "7", "8", "Algebra 1", "Geometry", "Algebra 2"],
            standards: [
              { code: "MA.6.NSO.1.1", description: "Extend previous understanding of numbers to define rational numbers" },
              { code: "MA.6.NSO.1.2", description: "Given a mathematical or real-world context, represent rational numbers" },
              { code: "MA.7.NSO.1.1", description: "Know and apply the Laws of Exponents" },
              { code: "MA.8.NSO.1.1", description: "Extend previous understanding of rational numbers" },
            ],
          },
        ],
      },
      {
        state: "New York",
        abbreviation: "NY",
        standardsName: "NYSLS",
        subjects: [
          {
            subject: "English Language Arts",
            grades: ["6", "7", "8", "9-10", "11-12"],
            standards: [
              { code: "6R1", description: "Cite textual evidence to support an analysis of what the text says" },
              { code: "6R2", description: "Determine a theme or central idea of a text" },
              { code: "7R1", description: "Cite several pieces of textual evidence to support an analysis" },
              { code: "8R1", description: "Cite the textual evidence that most strongly supports an analysis" },
            ],
          },
        ],
      },
    ],
  },
  // ============================================================
  // AFRICAN COUNTRIES
  // Country/grade structure only. Standard codes are intentionally
  // empty — the AI lesson generator infers outcomes from the topic +
  // subject + grade + the African context block (see shared/africaContext.ts).
  // ============================================================
  ...AFRICAN_COUNTRIES_DATA.map<CountryStandards>(c => ({
    country: c.name,
    states: [
      {
        state: "National Curriculum",
        abbreviation: "NAT",
        standardsName: c.exam,
        subjects: africanCoreSubjects(c.grades),
      },
    ],
  })),
  // ============================================================
  // INTERNATIONAL DEVELOPING-NATION CURRICULA (non-African)
  // National-curriculum entries for countries whose state-level
  // jurisdictions are seeded in the database but lack per-outcome
  // standard codes in CSP. The AI infers outcomes from the topic +
  // subject + grade + country context.
  // ============================================================
  ...INTERNATIONAL_DEVELOPING_NATIONS.map<CountryStandards>(c => ({
    country: c.name,
    states: [
      {
        state: "National Curriculum",
        abbreviation: "NAT",
        standardsName: c.exam,
        subjects: internationalCoreSubjects(c.grades),
      },
    ],
  })),
  {
    country: "Common Core (Multi-State)",
    states: [
      {
        state: "Common Core State Standards",
        abbreviation: "CCSS",
        standardsName: "CCSS",
        subjects: [
          {
            subject: "English Language Arts",
            grades: ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9-10", "11-12"],
            standards: [
              { code: "CCSS.ELA-LITERACY.RL.6.1", description: "Cite textual evidence to support analysis" },
              { code: "CCSS.ELA-LITERACY.RL.6.2", description: "Determine a theme or central idea" },
              { code: "CCSS.ELA-LITERACY.RL.7.1", description: "Cite several pieces of textual evidence" },
              { code: "CCSS.ELA-LITERACY.RL.8.1", description: "Cite the textual evidence that most strongly supports analysis" },
              { code: "CCSS.ELA-LITERACY.W.6.1", description: "Write arguments to support claims" },
            ],
          },
          {
            subject: "Mathematics",
            grades: ["K", "1", "2", "3", "4", "5", "6", "7", "8", "High School"],
            standards: [
              { code: "CCSS.MATH.CONTENT.6.NS.A.1", description: "Interpret and compute quotients of fractions" },
              { code: "CCSS.MATH.CONTENT.6.NS.B.2", description: "Fluently divide multi-digit numbers" },
              { code: "CCSS.MATH.CONTENT.7.NS.A.1", description: "Apply and extend previous understandings" },
              { code: "CCSS.MATH.CONTENT.8.NS.A.1", description: "Know that irrational numbers exist" },
            ],
          },
        ],
      },
    ],
  },
];

export function getCountries(): string[] {
  return educationalStandards.map(c => c.country);
}

export function getStates(country: string): StateStandards[] {
  const countryData = educationalStandards.find(c => c.country === country);
  return countryData?.states || [];
}

// Generic K-12 grade list used as a safe default for any country that has no
// curated grade structure of its own. The lesson generator's grade dropdown
// is governed separately (see defaultGradeLevels / getAfricanProfile in
// LessonGenerator), so this list only affects per-subject grade tagging.
const GENERIC_K12_GRADES = ["K","1","2","3","4","5","6","7","8","9","10","11","12"];

// Countries whose static `educationalStandards` entries actually carry
// per-outcome standard codes. Everything else falls through to a generic
// subjects list and the AI infers outcomes from topic + grade + country.
const CODE_RICH_COUNTRIES: Set<string> = new Set(["United States", "Common Core (Multi-State)"]);

export function getSubjects(country: string, stateAbbr: string): SubjectStandards[] {
  // 1. Exact state-abbreviation match (US, Common Core, the static "NAT"
  //    entries for African / international developing nations).
  const stateData = getStates(country).find(s => s.abbreviation === stateAbbr);
  if (stateData?.subjects.length) return stateData.subjects;

  // 2. African country fallback — DB jurisdictions use per-state abbreviations
  //    (e.g. Nigeria → LA-NG, KN, FCT) that don't match the static "NAT" entry,
  //    but the African core subject set is identical regardless of region.
  if (AFRICAN_COUNTRY_NAMES.has(country)) {
    const entry = AFRICAN_COUNTRIES_DATA.find(c => c.name === country);
    return africanCoreSubjects(entry?.grades ?? GENERIC_K12_GRADES);
  }

  // 3. Curated international developing-nation fallback — uses the country's
  //    own grade structure when known.
  if (INTERNATIONAL_DEVELOPING_NATION_NAMES.has(country)) {
    const entry = INTERNATIONAL_DEVELOPING_NATIONS.find(c => c.name === country);
    return internationalCoreSubjects(entry?.grades ?? GENERIC_K12_GRADES);
  }

  // 4. Universal last-resort fallback — every other country (UK, Canada,
  //    Germany, Japan, Australia, UAE, etc.) gets the international core
  //    subject set with generic K-12 grade tagging. This guarantees the
  //    subjects dropdown is never empty, regardless of CSP coverage.
  return internationalCoreSubjects(GENERIC_K12_GRADES);
}

export function getStandardCodes(country: string, stateAbbr: string, subject: string): StandardCode[] {
  const subjectData = getSubjects(country, stateAbbr).find(s => s.subject === subject);
  return subjectData?.standards || [];
}

export function getStandardsName(country: string, stateAbbr: string): string {
  const stateData = getStates(country).find(s => s.abbreviation === stateAbbr);
  return stateData?.standardsName || "Standards";
}

/**
 * Returns true when the country has no per-outcome standard codes available
 * — i.e. anything that isn't the US or the Common Core multi-state entry.
 * The lesson-generator UI and the server-side Zod schema use this to skip
 * the "you must pick specific standard codes" gate; the AI infers outcomes
 * from topic + grade + country context instead.
 */
export function hasOnlyGenericFallback(country: string): boolean {
  return !CODE_RICH_COUNTRIES.has(country);
}
