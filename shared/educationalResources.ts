// Curated list of open educational resource providers
export interface EducationalResourceProvider {
  id: string;
  name: string;
  description: string;
  url: string;
  searchUrl?: string;
  category: "oer" | "government" | "video" | "interactive" | "textbooks";
  subjects: string[];
  icon?: string;
}

export const educationalResourceProviders: EducationalResourceProvider[] = [
  // Open Educational Resources
  {
    id: "khan-academy",
    name: "Khan Academy",
    description: "Free courses, lessons, and practice in math, science, and more",
    url: "https://www.khanacademy.org",
    searchUrl: "https://www.khanacademy.org/search?search_again=1&page_search_query=",
    category: "oer",
    subjects: ["Math", "Science", "History", "Economics", "Computing", "Arts"],
  },
  {
    id: "oer-commons",
    name: "OER Commons",
    description: "Open educational resources shared by educators worldwide",
    url: "https://www.oercommons.org",
    searchUrl: "https://www.oercommons.org/search?f.search=",
    category: "oer",
    subjects: ["All Subjects"],
  },
  {
    id: "openstax",
    name: "OpenStax",
    description: "Free, peer-reviewed textbooks for college and high school",
    url: "https://openstax.org",
    category: "textbooks",
    subjects: ["Math", "Science", "Social Sciences", "Humanities", "Business"],
  },
  {
    id: "mit-ocw",
    name: "MIT OpenCourseWare",
    description: "Free lecture notes, exams, and videos from MIT",
    url: "https://ocw.mit.edu",
    searchUrl: "https://ocw.mit.edu/search/?q=",
    category: "oer",
    subjects: ["Engineering", "Science", "Math", "Humanities", "Business"],
  },
  {
    id: "ck12",
    name: "CK-12 Foundation",
    description: "Free digital textbooks and interactive learning resources",
    url: "https://www.ck12.org",
    searchUrl: "https://www.ck12.org/search/?q=",
    category: "textbooks",
    subjects: ["Math", "Science", "Social Studies", "English"],
  },
  {
    id: "merlot",
    name: "MERLOT",
    description: "Curated online learning materials for higher education",
    url: "https://www.merlot.org",
    searchUrl: "https://www.merlot.org/merlot/materialsSearch.htm?keywords=",
    category: "oer",
    subjects: ["All Subjects"],
  },
  {
    id: "project-gutenberg",
    name: "Project Gutenberg",
    description: "Free eBooks of classic literature and historical texts",
    url: "https://www.gutenberg.org",
    searchUrl: "https://www.gutenberg.org/ebooks/search/?query=",
    category: "textbooks",
    subjects: ["Literature", "History", "Philosophy", "Languages"],
  },
  {
    id: "open-edx",
    name: "Open edX",
    description: "Open-source platform for online courses from universities",
    url: "https://www.edx.org",
    searchUrl: "https://www.edx.org/search?q=",
    category: "oer",
    subjects: ["All Subjects"],
  },

  // Interactive Simulations
  {
    id: "phet",
    name: "PhET Interactive Simulations",
    description: "Free interactive math and science simulations from CU Boulder",
    url: "https://phet.colorado.edu",
    searchUrl: "https://phet.colorado.edu/en/simulations/filter?q=",
    category: "interactive",
    subjects: ["Physics", "Chemistry", "Biology", "Earth Science", "Math"],
  },

  // Video Resources
  {
    id: "youtube-edu",
    name: "YouTube EDU",
    description: "Educational videos and channels for learning",
    url: "https://www.youtube.com/education",
    searchUrl: "https://www.youtube.com/results?search_query=",
    category: "video",
    subjects: ["All Subjects"],
  },

  // Government & Institutional Resources
  {
    id: "nasa-stem",
    name: "NASA STEM Engagement",
    description: "Space and science resources for educators and students",
    url: "https://www.nasa.gov/stem",
    searchUrl: "https://www.nasa.gov/stem/search?q=",
    category: "government",
    subjects: ["Space Science", "Earth Science", "Engineering", "Physics"],
  },
  {
    id: "nsf",
    name: "National Science Foundation",
    description: "Science education resources and research",
    url: "https://www.nsf.gov/news/classroom/",
    category: "government",
    subjects: ["Science", "Engineering", "Math", "Research"],
  },
  {
    id: "noaa",
    name: "NOAA Education",
    description: "Ocean, weather, and climate education resources",
    url: "https://www.noaa.gov/education",
    category: "government",
    subjects: ["Earth Science", "Weather", "Ocean Science", "Climate"],
  },
  {
    id: "smithsonian",
    name: "Smithsonian Learning Lab",
    description: "Digital resources from Smithsonian museums",
    url: "https://learninglab.si.edu",
    searchUrl: "https://learninglab.si.edu/search?",
    category: "government",
    subjects: ["History", "Art", "Science", "Culture", "Natural History"],
  },
  {
    id: "loc-teachers",
    name: "Library of Congress - Teachers",
    description: "Primary sources and lesson plans from the Library of Congress",
    url: "https://www.loc.gov/programs/teachers/",
    searchUrl: "https://www.loc.gov/search/?q=",
    category: "government",
    subjects: ["History", "Civics", "Literature", "Arts"],
  },
  {
    id: "docsteach",
    name: "National Archives - DocsTeach",
    description: "Primary source documents and activities for teaching",
    url: "https://www.docsteach.org",
    searchUrl: "https://www.docsteach.org/documents?q=",
    category: "government",
    subjects: ["History", "Government", "Civics"],
  },
  {
    id: "usgs-education",
    name: "USGS Education",
    description: "Earth science resources from the U.S. Geological Survey",
    url: "https://www.usgs.gov/educational-resources",
    category: "government",
    subjects: ["Earth Science", "Geology", "Geography", "Environment"],
  },
  {
    id: "nps-educators",
    name: "National Park Service - Educators",
    description: "Lesson plans and resources about national parks and history",
    url: "https://www.nps.gov/teachers/index.htm",
    category: "government",
    subjects: ["History", "Science", "Environment", "Geography"],
  },
  {
    id: "epa-students",
    name: "EPA Environmental Education",
    description: "Environmental science resources and lesson plans",
    url: "https://www.epa.gov/students",
    category: "government",
    subjects: ["Environmental Science", "Chemistry", "Biology", "Health"],
  },
  {
    id: "doe-stem",
    name: "U.S. Department of Energy STEM",
    description: "Energy and science education resources",
    url: "https://www.energy.gov/eere/education/stem-rising",
    category: "government",
    subjects: ["Physics", "Chemistry", "Engineering", "Energy Science"],
  },
];

// Get providers by category
export function getProvidersByCategory(category: EducationalResourceProvider["category"]) {
  return educationalResourceProviders.filter(p => p.category === category);
}

// Get providers by subject
export function getProvidersBySubject(subject: string) {
  return educationalResourceProviders.filter(
    p => p.subjects.includes("All Subjects") || p.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
  );
}

// Generate a search URL for a topic
export function getSearchUrl(provider: EducationalResourceProvider, query: string): string {
  if (provider.searchUrl) {
    return provider.searchUrl + encodeURIComponent(query);
  }
  return provider.url;
}

// Resource type for saved resources
export interface EducationalResource {
  providerId: string;
  providerName: string;
  title: string;
  url: string;
  description?: string;
  type: "video" | "article" | "interactive" | "textbook" | "lesson" | "other";
}
