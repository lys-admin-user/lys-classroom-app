import { 
  type User, 
  type InsertUser,
  type LessonPlan,
  type InsertLessonPlan,
  type Goal,
  type InsertGoal,
  type Career,
  type Resource,
  type Assessment,
  type AssessmentResult
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getLessonPlans(): Promise<LessonPlan[]>;
  getLessonPlan(id: string): Promise<LessonPlan | undefined>;
  createLessonPlan(lesson: InsertLessonPlan): Promise<LessonPlan>;
  
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  updateMilestone(goalId: string, milestoneId: string, completed: boolean): Promise<Goal | undefined>;
  
  getCareers(): Promise<Career[]>;
  getCareer(id: string): Promise<Career | undefined>;
  
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  
  getAssessments(): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private lessonPlans: Map<string, LessonPlan>;
  private goals: Map<string, Goal>;
  private careers: Map<string, Career>;
  private resources: Map<string, Resource>;
  private assessments: Map<string, Assessment>;
  private assessmentResults: Map<string, AssessmentResult>;

  constructor() {
    this.users = new Map();
    this.lessonPlans = new Map();
    this.goals = new Map();
    this.careers = new Map();
    this.resources = new Map();
    this.assessments = new Map();
    this.assessmentResults = new Map();
    
    this.seedData();
  }

  private seedData() {
    const careers: Career[] = [
      {
        id: "1",
        title: "Software Developer",
        category: "technology",
        description: "Design, develop, and maintain software applications. Work with cutting-edge technologies to solve complex problems.",
        salaryMin: 65000,
        salaryMax: 150000,
        salaryMedian: 110000,
        educationRequired: "Bachelor's Degree",
        yearsExperience: "0-5 years",
        growthRate: "+25%",
        skills: ["Programming", "Problem Solving", "Communication", "Teamwork", "Critical Thinking"],
        relatedCareers: ["Web Developer", "Data Scientist", "DevOps Engineer"],
        pathways: [
          { type: "college", description: "Earn a Bachelor's in Computer Science or related field from an accredited university.", duration: "4 years", cost: "$40,000-$200,000" },
          { type: "certification", description: "Complete coding bootcamp and earn industry certifications like AWS or Google Cloud.", duration: "3-6 months", cost: "$10,000-$20,000" },
          { type: "military", description: "Serve in IT roles in the military and transition to civilian tech careers.", duration: "4+ years", cost: "Free + Benefits" },
        ],
      },
      {
        id: "2",
        title: "Registered Nurse",
        category: "healthcare",
        description: "Provide patient care, educate patients about health conditions, and support physicians in medical procedures.",
        salaryMin: 55000,
        salaryMax: 120000,
        salaryMedian: 77000,
        educationRequired: "Associate's or Bachelor's Degree",
        yearsExperience: "0-3 years",
        growthRate: "+12%",
        skills: ["Patient Care", "Communication", "Critical Thinking", "Empathy", "Attention to Detail"],
        relatedCareers: ["Nurse Practitioner", "Physician Assistant", "Healthcare Administrator"],
        pathways: [
          { type: "college", description: "Complete a BSN (Bachelor of Science in Nursing) program.", duration: "4 years", cost: "$30,000-$150,000" },
          { type: "trade", description: "Complete an ADN (Associate Degree in Nursing) at a community college.", duration: "2 years", cost: "$10,000-$30,000" },
          { type: "military", description: "Train as a military nurse and serve while gaining experience.", duration: "4+ years", cost: "Free + Benefits" },
        ],
      },
      {
        id: "3",
        title: "Marketing Manager",
        category: "business",
        description: "Develop marketing strategies, manage campaigns, and analyze market trends to drive business growth.",
        salaryMin: 60000,
        salaryMax: 140000,
        salaryMedian: 95000,
        educationRequired: "Bachelor's Degree",
        yearsExperience: "3-7 years",
        growthRate: "+10%",
        skills: ["Strategic Planning", "Data Analysis", "Creativity", "Leadership", "Communication"],
        relatedCareers: ["Brand Manager", "Digital Marketing Specialist", "Product Manager"],
        pathways: [
          { type: "college", description: "Earn a Bachelor's in Marketing, Business, or Communications.", duration: "4 years", cost: "$40,000-$200,000" },
          { type: "certification", description: "Gain experience through internships and earn digital marketing certifications.", duration: "1-2 years", cost: "$5,000-$15,000" },
        ],
      },
      {
        id: "4",
        title: "Electrician",
        category: "trades",
        description: "Install, maintain, and repair electrical systems in residential, commercial, and industrial settings.",
        salaryMin: 40000,
        salaryMax: 100000,
        salaryMedian: 60000,
        educationRequired: "High School + Apprenticeship",
        yearsExperience: "0-4 years",
        growthRate: "+9%",
        skills: ["Technical Skills", "Problem Solving", "Physical Stamina", "Safety Awareness", "Math"],
        relatedCareers: ["HVAC Technician", "Plumber", "Construction Manager"],
        pathways: [
          { type: "trade", description: "Complete a 4-5 year apprenticeship program combining classroom instruction with on-the-job training.", duration: "4-5 years", cost: "Paid training" },
          { type: "military", description: "Train as a military electrician and gain certifications.", duration: "4+ years", cost: "Free + Benefits" },
        ],
      },
      {
        id: "5",
        title: "Graphic Designer",
        category: "creative",
        description: "Create visual content for brands, including logos, marketing materials, websites, and more.",
        salaryMin: 40000,
        salaryMax: 90000,
        salaryMedian: 55000,
        educationRequired: "Bachelor's Degree or Portfolio",
        yearsExperience: "0-3 years",
        growthRate: "+3%",
        skills: ["Adobe Creative Suite", "Typography", "Color Theory", "Creativity", "Communication"],
        relatedCareers: ["UX Designer", "Art Director", "Brand Designer"],
        pathways: [
          { type: "college", description: "Earn a Bachelor's in Graphic Design or Visual Arts.", duration: "4 years", cost: "$40,000-$180,000" },
          { type: "certification", description: "Build a portfolio through online courses and freelance work.", duration: "1-2 years", cost: "$2,000-$10,000" },
        ],
      },
      {
        id: "6",
        title: "Paralegal",
        category: "legal",
        description: "Assist lawyers with legal research, document preparation, and case management.",
        salaryMin: 40000,
        salaryMax: 75000,
        salaryMedian: 56000,
        educationRequired: "Associate's or Bachelor's Degree",
        yearsExperience: "0-3 years",
        growthRate: "+12%",
        skills: ["Legal Research", "Writing", "Attention to Detail", "Organization", "Communication"],
        relatedCareers: ["Legal Secretary", "Court Reporter", "Lawyer"],
        pathways: [
          { type: "college", description: "Complete a paralegal certificate or associate's degree program.", duration: "1-2 years", cost: "$5,000-$30,000" },
          { type: "certification", description: "Earn a paralegal certification from an accredited program.", duration: "6 months - 1 year", cost: "$3,000-$10,000" },
        ],
      },
    ];

    const resources: Resource[] = [
      {
        id: "1",
        title: "Gates Scholarship",
        description: "Full scholarship for outstanding minority high school seniors with significant financial need.",
        type: "scholarship",
        category: "financial",
        amount: 100000,
        deadline: "2025-09-15",
        eligibility: ["High school senior", "Pell Grant eligible", "GPA 3.3+"],
        tags: ["Full Ride", "Minorities", "High School Seniors"],
      },
      {
        id: "2",
        title: "Dell Scholars Program",
        description: "Scholarship for students who demonstrate grit and ambition to succeed despite challenges.",
        type: "scholarship",
        category: "financial",
        amount: 20000,
        deadline: "2025-12-01",
        eligibility: ["High school senior", "Pell Grant eligible", "GPA 2.4+"],
        tags: ["Underserved", "First Generation", "College Prep"],
      },
      {
        id: "3",
        title: "Coca-Cola Scholars Program",
        description: "Achievement-based scholarship for high school seniors who demonstrate leadership and service.",
        type: "scholarship",
        category: "financial",
        amount: 20000,
        deadline: "2025-10-31",
        eligibility: ["High school senior", "US Citizen", "GPA 3.0+"],
        tags: ["Leadership", "Community Service", "Achievement"],
      },
      {
        id: "4",
        title: "FAFSA Complete Guide",
        description: "Step-by-step walkthrough of the Free Application for Federal Student Aid process.",
        type: "guide",
        category: "financial",
        tags: ["Financial Aid", "College", "Government Aid"],
      },
      {
        id: "5",
        title: "Resume Writing 101",
        description: "Learn how to create a compelling resume that stands out to employers.",
        type: "guide",
        category: "career",
        tags: ["Job Search", "Career Development", "Professional Skills"],
      },
      {
        id: "6",
        title: "Interview Preparation Tips",
        description: "Master the art of interviewing with these proven strategies and practice questions.",
        type: "video",
        category: "career",
        tags: ["Interviews", "Job Search", "Communication"],
      },
      {
        id: "7",
        title: "Military Career Paths",
        description: "Explore different branches and career opportunities within the US Armed Forces.",
        type: "guide",
        category: "military",
        tags: ["Armed Forces", "Career Paths", "Benefits"],
      },
      {
        id: "8",
        title: "Budgeting Basics for Students",
        description: "Learn essential budgeting skills to manage your money effectively in college and beyond.",
        type: "video",
        category: "financial",
        tags: ["Money Management", "Budgeting", "Life Skills"],
      },
      {
        id: "9",
        title: "SAT/ACT Prep Resources",
        description: "Free and low-cost resources to help you prepare for standardized college entrance exams.",
        type: "tool",
        category: "college",
        tags: ["Test Prep", "SAT", "ACT", "College Admissions"],
      },
      {
        id: "10",
        title: "College Application Timeline",
        description: "A month-by-month guide to stay on track with your college application process.",
        type: "guide",
        category: "college",
        tags: ["Applications", "Planning", "Deadlines"],
      },
    ];

    careers.forEach(c => this.careers.set(c.id, c));
    resources.forEach(r => this.resources.set(r.id, r));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLessonPlans(): Promise<LessonPlan[]> {
    return Array.from(this.lessonPlans.values());
  }

  async getLessonPlan(id: string): Promise<LessonPlan | undefined> {
    return this.lessonPlans.get(id);
  }

  async createLessonPlan(lesson: InsertLessonPlan): Promise<LessonPlan> {
    const id = randomUUID();
    const lessonPlan: LessonPlan = { ...lesson, id };
    this.lessonPlans.set(id, lessonPlan);
    return lessonPlan;
  }

  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values());
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const goal: Goal = { 
      ...insertGoal, 
      id,
      progress: insertGoal.progress || 0,
      status: insertGoal.status || "not_started",
      milestones: insertGoal.milestones.map(m => ({
        ...m,
        id: m.id || randomUUID(),
      })),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    const updated = { ...goal, ...updates };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  async updateMilestone(goalId: string, milestoneId: string, completed: boolean): Promise<Goal | undefined> {
    const goal = this.goals.get(goalId);
    if (!goal) return undefined;

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed } : m
    );
    
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = updatedMilestones.length > 0 
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : 0;
    
    let status = goal.status;
    if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    }

    const updated = { ...goal, milestones: updatedMilestones, progress, status };
    this.goals.set(goalId, updated);
    return updated;
  }

  async getCareers(): Promise<Career[]> {
    return Array.from(this.careers.values());
  }

  async getCareer(id: string): Promise<Career | undefined> {
    return this.careers.get(id);
  }

  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResource(id: string): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult> {
    this.assessmentResults.set(result.id, result);
    return result;
  }
}

export const storage = new MemStorage();
