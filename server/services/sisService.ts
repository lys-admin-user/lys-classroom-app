import { SIS_PROVIDERS, SisProvider } from "@shared/schema";

interface SisApiConfig {
  baseUrl: string;
  accessToken: string;
  refreshToken?: string;
  districtId?: string;
}

interface SisStudent {
  sisId: string;
  firstName: string;
  lastName: string;
  email?: string;
  gradeLevel?: string;
  schoolId?: string;
  schoolName?: string;
  enrollmentStatus?: string;
  rawData: Record<string, any>;
}

interface SisCourse {
  sisId: string;
  name: string;
  courseCode?: string;
  subject?: string;
  gradeLevel?: string;
  schoolId?: string;
  schoolName?: string;
  teacherIds?: string[];
  studentCount?: number;
  term?: string;
  status?: string;
  rawData: Record<string, any>;
}

interface SisSchool {
  sisId: string;
  name: string;
  districtId?: string;
  address?: string;
  phone?: string;
  rawData: Record<string, any>;
}

interface SisTeacher {
  sisId: string;
  firstName: string;
  lastName: string;
  email?: string;
  title?: string;
  schoolIds?: string[];
  rawData: Record<string, any>;
}

class SisService {
  private config: SisApiConfig | null = null;
  private provider: SisProvider | null = null;

  setConfig(provider: SisProvider, config: SisApiConfig) {
    this.provider = provider;
    this.config = config;
  }

  getProviders() {
    return SIS_PROVIDERS;
  }

  getProviderInfo(provider: SisProvider) {
    return SIS_PROVIDERS[provider];
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config || !this.provider) {
      return { success: false, message: "SIS not configured" };
    }

    try {
      switch (this.provider) {
        case "clever":
          return await this.testCleverConnection();
        case "powerschool":
          return await this.testPowerSchoolConnection();
        case "canvas":
          return await this.testCanvasConnection();
        case "oneroster":
          return await this.testOneRosterConnection();
        default:
          return { success: false, message: `Provider ${this.provider} not yet implemented` };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async testCleverConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) throw new Error("Not configured");
    
    const response = await fetch(`${this.config.baseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Clever API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: "Connected to Clever", data };
  }

  private async testPowerSchoolConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) throw new Error("Not configured");
    
    const response = await fetch(`${this.config.baseUrl}/ws/v1/district`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`PowerSchool API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: "Connected to PowerSchool", data };
  }

  private async testCanvasConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) throw new Error("Not configured");
    
    const response = await fetch(`${this.config.baseUrl}/api/v1/users/self`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: "Connected to Canvas", data };
  }

  private async testOneRosterConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.config) throw new Error("Not configured");
    
    const response = await fetch(`${this.config.baseUrl}/ims/oneroster/v1p1/orgs`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`OneRoster API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: "Connected via OneRoster", data };
  }

  async fetchStudents(limit = 100, offset = 0): Promise<SisStudent[]> {
    if (!this.config || !this.provider) {
      throw new Error("SIS not configured");
    }

    switch (this.provider) {
      case "clever":
        return await this.fetchCleverStudents(limit, offset);
      case "powerschool":
        return await this.fetchPowerSchoolStudents(limit, offset);
      case "canvas":
        return await this.fetchCanvasStudents(limit, offset);
      case "oneroster":
        return await this.fetchOneRosterStudents(limit, offset);
      default:
        throw new Error(`Provider ${this.provider} not yet implemented`);
    }
  }

  private async fetchCleverStudents(limit: number, offset: number): Promise<SisStudent[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/students?limit=${limit}&starting_after=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Clever API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map((item: any) => ({
      sisId: item.data.id,
      firstName: item.data.name?.first || "",
      lastName: item.data.name?.last || "",
      email: item.data.email,
      gradeLevel: item.data.grade,
      schoolId: item.data.school,
      enrollmentStatus: "active",
      rawData: item.data,
    }));
  }

  private async fetchPowerSchoolStudents(limit: number, offset: number): Promise<SisStudent[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/ws/v1/district/student?page=${Math.floor(offset / limit) + 1}&pagesize=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`PowerSchool API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.students?.student || []).map((student: any) => ({
      sisId: student.id?.toString() || student.dcid?.toString(),
      firstName: student.name?.first_name || "",
      lastName: student.name?.last_name || "",
      email: student.contact_info?.email,
      gradeLevel: student.grade_level?.toString(),
      schoolId: student.school_enrollment?.school_id?.toString(),
      enrollmentStatus: student.school_enrollment?.enroll_status || "active",
      rawData: student,
    }));
  }

  private async fetchCanvasStudents(limit: number, offset: number): Promise<SisStudent[]> {
    if (!this.config) throw new Error("Not configured");

    const page = Math.floor(offset / limit) + 1;
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/accounts/self/users?per_page=${limit}&page=${page}&enrollment_type=student`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status}`);
    }

    const users = await response.json();
    return users.map((user: any) => ({
      sisId: user.sis_user_id || user.id?.toString(),
      firstName: user.name?.split(" ")[0] || user.short_name || "",
      lastName: user.name?.split(" ").slice(1).join(" ") || "",
      email: user.email,
      gradeLevel: null,
      enrollmentStatus: user.workflow_state || "active",
      rawData: user,
    }));
  }

  private async fetchOneRosterStudents(limit: number, offset: number): Promise<SisStudent[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/ims/oneroster/v1p1/students?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OneRoster API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.users || []).map((user: any) => ({
      sisId: user.sourcedId,
      firstName: user.givenName || "",
      lastName: user.familyName || "",
      email: user.email,
      gradeLevel: user.grades?.[0],
      schoolId: user.orgs?.[0]?.sourcedId,
      enrollmentStatus: user.status || "active",
      rawData: user,
    }));
  }

  async fetchCourses(limit = 100, offset = 0): Promise<SisCourse[]> {
    if (!this.config || !this.provider) {
      throw new Error("SIS not configured");
    }

    switch (this.provider) {
      case "clever":
        return await this.fetchCleverCourses(limit, offset);
      case "powerschool":
        return await this.fetchPowerSchoolCourses(limit, offset);
      case "canvas":
        return await this.fetchCanvasCourses(limit, offset);
      case "oneroster":
        return await this.fetchOneRosterCourses(limit, offset);
      default:
        throw new Error(`Provider ${this.provider} not yet implemented`);
    }
  }

  private async fetchCleverCourses(limit: number, offset: number): Promise<SisCourse[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/sections?limit=${limit}&starting_after=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Clever API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map((item: any) => ({
      sisId: item.data.id,
      name: item.data.name || "Unnamed Section",
      courseCode: item.data.sis_id,
      subject: item.data.subject,
      gradeLevel: item.data.grade,
      schoolId: item.data.school,
      teacherIds: item.data.teachers || [],
      studentCount: item.data.students?.length || 0,
      term: item.data.term_id,
      status: "active",
      rawData: item.data,
    }));
  }

  private async fetchPowerSchoolCourses(limit: number, offset: number): Promise<SisCourse[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/ws/v1/district/section?page=${Math.floor(offset / limit) + 1}&pagesize=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`PowerSchool API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.sections?.section || []).map((section: any) => ({
      sisId: section.id?.toString() || section.dcid?.toString(),
      name: section.course_name || section.section_number || "Unnamed",
      courseCode: section.course_number,
      subject: section.department,
      schoolId: section.schoolid?.toString(),
      teacherIds: section.teachers?.teacher?.map((t: any) => t.id?.toString()) || [],
      studentCount: section.students?.student?.length || 0,
      term: section.term_id,
      status: "active",
      rawData: section,
    }));
  }

  private async fetchCanvasCourses(limit: number, offset: number): Promise<SisCourse[]> {
    if (!this.config) throw new Error("Not configured");

    const page = Math.floor(offset / limit) + 1;
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/courses?per_page=${limit}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status}`);
    }

    const courses = await response.json();
    return courses.map((course: any) => ({
      sisId: course.sis_course_id || course.id?.toString(),
      name: course.name,
      courseCode: course.course_code,
      studentCount: course.total_students,
      term: course.term?.name,
      status: course.workflow_state,
      rawData: course,
    }));
  }

  private async fetchOneRosterCourses(limit: number, offset: number): Promise<SisCourse[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/ims/oneroster/v1p1/classes?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OneRoster API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.classes || []).map((cls: any) => ({
      sisId: cls.sourcedId,
      name: cls.title || "Unnamed Class",
      courseCode: cls.classCode,
      subject: cls.subjects?.[0],
      gradeLevel: cls.grades?.[0],
      schoolId: cls.school?.sourcedId,
      term: cls.terms?.[0]?.sourcedId,
      status: cls.status || "active",
      rawData: cls,
    }));
  }

  async fetchSchools(): Promise<SisSchool[]> {
    if (!this.config || !this.provider) {
      throw new Error("SIS not configured");
    }

    switch (this.provider) {
      case "clever":
        return await this.fetchCleverSchools();
      case "oneroster":
        return await this.fetchOneRosterSchools();
      default:
        return [];
    }
  }

  private async fetchCleverSchools(): Promise<SisSchool[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(`${this.config.baseUrl}/schools`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Clever API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map((item: any) => ({
      sisId: item.data.id,
      name: item.data.name,
      districtId: item.data.district,
      rawData: item.data,
    }));
  }

  private async fetchOneRosterSchools(): Promise<SisSchool[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(`${this.config.baseUrl}/ims/oneroster/v1p1/schools`, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`OneRoster API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.orgs || []).map((org: any) => ({
      sisId: org.sourcedId,
      name: org.name,
      districtId: org.parent?.sourcedId,
      rawData: org,
    }));
  }

  async fetchTeachers(limit = 100, offset = 0): Promise<SisTeacher[]> {
    if (!this.config || !this.provider) {
      throw new Error("SIS not configured");
    }

    switch (this.provider) {
      case "clever":
        return await this.fetchCleverTeachers(limit, offset);
      case "oneroster":
        return await this.fetchOneRosterTeachers(limit, offset);
      default:
        return [];
    }
  }

  private async fetchCleverTeachers(limit: number, offset: number): Promise<SisTeacher[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/teachers?limit=${limit}&starting_after=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Clever API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map((item: any) => ({
      sisId: item.data.id,
      firstName: item.data.name?.first || "",
      lastName: item.data.name?.last || "",
      email: item.data.email,
      title: item.data.title,
      schoolIds: item.data.schools || [],
      rawData: item.data,
    }));
  }

  private async fetchOneRosterTeachers(limit: number, offset: number): Promise<SisTeacher[]> {
    if (!this.config) throw new Error("Not configured");

    const response = await fetch(
      `${this.config.baseUrl}/ims/oneroster/v1p1/teachers?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OneRoster API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.users || []).map((user: any) => ({
      sisId: user.sourcedId,
      firstName: user.givenName || "",
      lastName: user.familyName || "",
      email: user.email,
      schoolIds: user.orgs?.map((org: any) => org.sourcedId) || [],
      rawData: user,
    }));
  }

  getOAuthUrl(provider: SisProvider, redirectUri: string, state: string): string | null {
    switch (provider) {
      case "clever":
        const cleverClientId = process.env.CLEVER_CLIENT_ID;
        if (!cleverClientId) return null;
        return `https://clever.com/oauth/authorize?response_type=code&client_id=${cleverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&district_id=`;
      
      case "canvas":
        return null;
      
      default:
        return null;
    }
  }

  async exchangeCodeForTokens(
    provider: SisProvider,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date } | null> {
    switch (provider) {
      case "clever":
        return await this.exchangeCleverCode(code, redirectUri);
      default:
        return null;
    }
  }

  private async exchangeCleverCode(
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date } | null> {
    const clientId = process.env.CLEVER_CLIENT_ID;
    const clientSecret = process.env.CLEVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Clever credentials not configured");
    }

    const response = await fetch("https://clever.com/oauth/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange Clever code: ${response.status}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }
}

export const sisService = new SisService();
