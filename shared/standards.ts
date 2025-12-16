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

export function getSubjects(country: string, stateAbbr: string): SubjectStandards[] {
  const stateData = getStates(country).find(s => s.abbreviation === stateAbbr);
  return stateData?.subjects || [];
}

export function getStandardCodes(country: string, stateAbbr: string, subject: string): StandardCode[] {
  const subjectData = getSubjects(country, stateAbbr).find(s => s.subject === subject);
  return subjectData?.standards || [];
}

export function getStandardsName(country: string, stateAbbr: string): string {
  const stateData = getStates(country).find(s => s.abbreviation === stateAbbr);
  return stateData?.standardsName || "Standards";
}
