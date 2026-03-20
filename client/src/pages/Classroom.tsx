import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  GraduationCap, 
  BookOpen,
  UserPlus,
  School,
  FileText,
  AlertCircle,
  Building2,
  Share2,
  Eye,
  X,
  TrendingUp,
  Search,
  Download,
  StickyNote,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowRightLeft,
  Send,
  Megaphone,
  Bell,
  Link2,
  PinIcon,
  MessageCircle,
  Shield,
  Moon
} from "lucide-react";
import { Link } from "wouter";
import type { Class, Student, InsertClass, InsertStudent, AccommodationType, Organization, OrgMembership, StudentNote, AttendanceRecord, StudentTransferRequest } from "@shared/schema";
import { CAREER_FIELDS, suggestCareerFields } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "behavioral", label: "Behavioral" },
  { value: "health", label: "Health" },
  { value: "parent_contact", label: "Parent Contact" }
];

const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", icon: CheckCircle2, selectedClass: "bg-green-600 hover:bg-green-700 text-white" },
  { value: "absent", label: "Absent", icon: XCircle, selectedClass: "bg-red-600 hover:bg-red-700 text-white" },
  { value: "tardy", label: "Tardy", icon: Clock, selectedClass: "bg-yellow-600 hover:bg-yellow-700 text-white" },
  { value: "excused", label: "Excused", icon: Calendar, selectedClass: "bg-blue-600 hover:bg-blue-700 text-white" }
];

type OrgWithDetails = OrgMembership & { organization: Organization };

const GRADE_LEVELS = [
  "Pre-K",
  "Kindergarten",
  "1st Grade",
  "2nd Grade", 
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College/University"
];

const ACCOMMODATION_TYPES: AccommodationType[] = ["extraTime", "notesCopyProvided", "studySheetProvided", "graphicOrganizer", "mnemonicDevices", "largerFont", "shortenedText", "peerSupport", "preferentialSeating", "frequentReminders", "completedExample", "visualOrganizer"];

const ACCOMMODATION_LABELS: Record<AccommodationType, string> = {
  extraTime: "Extra Time",
  notesCopyProvided: "Notes Copy Provided",
  studySheetProvided: "Study Sheet Provided",
  graphicOrganizer: "Graphic Organizer",
  mnemonicDevices: "Mnemonic Devices",
  largerFont: "Larger Font",
  shortenedText: "Shortened Text",
  peerSupport: "Peer Support",
  preferentialSeating: "Preferential Seating",
  frequentReminders: "Frequent Reminders",
  completedExample: "Completed Example",
  visualOrganizer: "Visual Organizer"
};

export default function Classroom() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"classes" | "students" | "lesson-authors" | "communications">("classes");
  // Communications tab state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("parents");
  const [broadcastClassId, setBroadcastClassId] = useState("");
  const [qhStartTime, setQhStartTime] = useState("21:00");
  const [qhEndTime, setQhEndTime] = useState("07:00");
  const [qhDays, setQhDays] = useState<number[]>([0, 6]);
  const [qhTimezone, setQhTimezone] = useState("America/Chicago");
  const [isCreateBroadcastOpen, setIsCreateBroadcastOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"personal" | "organization">("personal");
  const [sharingClass, setSharingClass] = useState<Class | null>(null);
  const [shareTargetOrgId, setShareTargetOrgId] = useState<string>("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit" | "copy">("view");
  const [managingSharesClass, setManagingSharesClass] = useState<Class | null>(null);
  const [managingStudentsClass, setManagingStudentsClass] = useState<Class | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState<string>("");
  
  // New student management features
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>("all");
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all");
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isStudentNotesOpen, setIsStudentNotesOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [attendanceClass, setAttendanceClass] = useState<Class | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  
  // Transfer request state
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  // Invite parent state
  const [inviteParentStudent, setInviteParentStudent] = useState<Student | null>(null);
  const [isInviteParentOpen, setIsInviteParentOpen] = useState(false);
  const [generatedMagicLink, setGeneratedMagicLink] = useState<string>("");
  const [transferType, setTransferType] = useState<"educator" | "organization">("organization");
  const [targetOrganizationId, setTargetOrganizationId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // Campus Lesson Authors state
  const [isAddCampusAuthorOpen, setIsAddCampusAuthorOpen] = useState(false);
  const [selectedAuthorUserId, setSelectedAuthorUserId] = useState("");
  const [campusAuthorSpecializations, setCampusAuthorSpecializations] = useState<string[]>([]);
  const [campusAuthorBio, setCampusAuthorBio] = useState("");

  const isCampusAdmin = user?.role === "campus_admin";
  
  const { data: userOrgs = [] } = useQuery<OrgWithDetails[]>({
    queryKey: ["/api/organizations/mine"],
    enabled: !!user && isCampusAdmin,
  });

  const { data: allOrgs = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: !!user && isCampusAdmin,
  });

  // Campus Lesson Authors types and queries
  type CampusLessonAuthor = {
    id: string;
    userId: string;
    organizationId: string;
    authorizedBy: string;
    specializations: string[];
    bio: string | null;
    status: string;
    lessonsCreated: number;
    createdAt: string;
    userName: string;
    userEmail: string;
  };

  const { data: campusLessonAuthors = [], isLoading: campusAuthorsLoading } = useQuery<CampusLessonAuthor[]>({
    queryKey: ["/api/campus/lesson-authors", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      const res = await fetch(`/api/campus/lesson-authors?organizationId=${selectedOrgId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch campus lesson authors");
      return res.json();
    },
    enabled: !!selectedOrgId && isCampusAdmin,
  });

  const { data: orgEducators = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations", selectedOrgId, "members"],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      const res = await fetch(`/api/organizations/${selectedOrgId}/members`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedOrgId && isCampusAdmin && activeTab === "lesson-authors",
  });

  const createCampusAuthorMutation = useMutation({
    mutationFn: async (data: { userId: string; specializations: string[]; bio: string }) => {
      return await apiRequest("POST", "/api/campus/lesson-authors", {
        ...data,
        organizationId: selectedOrgId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus/lesson-authors", selectedOrgId] });
      setIsAddCampusAuthorOpen(false);
      setSelectedAuthorUserId("");
      setCampusAuthorSpecializations([]);
      setCampusAuthorBio("");
      toast({ title: "Success", description: "Campus lesson author added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add author", variant: "destructive" });
    },
  });

  const deleteCampusAuthorMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/campus/lesson-authors/${userId}/${selectedOrgId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campus/lesson-authors", selectedOrgId] });
      toast({ title: "Success", description: "Campus lesson author removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove author", variant: "destructive" });
    },
  });

  type EntityShare = {
    id: string;
    entityType: string;
    entityId: string;
    sourceOrganizationId: string;
    targetOrganizationId: string;
    permission: string;
    sharedBy: string;
    createdAt: string;
  };

  const { data: sharedWithUs = [] } = useQuery<EntityShare[]>({
    queryKey: ["/api/orgs", selectedOrgId, "shared-with-us"],
    enabled: !!selectedOrgId && viewMode === "organization",
  });

  const { data: classShares = [] } = useQuery<EntityShare[]>({
    queryKey: ["/api/shares/entity", "class", managingSharesClass?.id],
    enabled: !!managingSharesClass,
  });

  const [newClass, setNewClass] = useState<Partial<InsertClass>>({
    name: "",
    subject: "",
    gradeLevel: "",
    period: "",
    schoolYear: new Date().getFullYear().toString(),
    isActive: true
  });

  const [newStudent, setNewStudent] = useState<Partial<InsertStudent>>({
    firstName: "",
    lastName: "",
    studentId: "",
    gradeLevel: "",
    notes: "",
    accommodations: []
  });

  const [newAccommodation, setNewAccommodation] = useState<{
    type: AccommodationType;
    description: string;
    active: boolean;
  }>({ type: "extraTime", description: "", active: true });

  // Query for students in the currently managed class
  const { data: managedClassStudents = [], isLoading: managedClassStudentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/classes", managingStudentsClass?.id, "students"],
    enabled: !!managingStudentsClass,
  });

  // Query for student notes
  const { data: studentNotes = [] } = useQuery<StudentNote[]>({
    queryKey: ["/api/students", viewingStudent?.id, "notes"],
    enabled: !!viewingStudent && isStudentNotesOpen,
  });

  // Query for class attendance
  const { data: classAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/classes", attendanceClass?.id, "attendance", attendanceDate],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${attendanceClass!.id}/attendance?date=${attendanceDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!attendanceClass,
  });

  // Query for students in attendance class
  const { data: attendanceClassStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/classes", attendanceClass?.id, "students"],
    enabled: !!attendanceClass,
  });

  useEffect(() => {
    if (classAttendance.length > 0) {
      const savedRecords: Record<string, string> = {};
      classAttendance.forEach((r) => {
        savedRecords[r.studentId] = r.status;
      });
      setAttendanceRecords(prev => ({ ...prev, ...savedRecords }));
    }
  }, [classAttendance]);

  // Personal classes/students queries
  const { data: personalClasses = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    enabled: !!user && viewMode === "personal",
  });

  const { data: personalStudents = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: !!user && viewMode === "personal",
  });

  // Organization-scoped queries with hierarchy for district-level viewing
  const { data: orgClasses = [] } = useQuery<Class[]>({
    queryKey: ["/api/orgs", selectedOrgId, "classes", "hierarchy=true"],
    enabled: !!selectedOrgId && viewMode === "organization",
  });

  const { data: orgStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/orgs", selectedOrgId, "students", "hierarchy=true"],
    enabled: !!selectedOrgId && viewMode === "organization",
  });

  // Combined data based on view mode
  const classes = viewMode === "organization" ? orgClasses : personalClasses;
  const students = viewMode === "organization" ? orgStudents : personalStudents;

  const { data: classStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/classes", selectedClassId, "students"],
    enabled: !!selectedClassId,
  });

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: async (data: Partial<InsertClass>) => {
      return await apiRequest("POST", "/api/classes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setIsCreateClassOpen(false);
      setNewClass({
        name: "",
        subject: "",
        gradeLevel: "",
        period: "",
        schoolYear: new Date().getFullYear().toString(),
        isActive: true
      });
      toast({ title: "Class created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create class", variant: "destructive" });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Class> }) => {
      return await apiRequest("PATCH", `/api/classes/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setEditingClass(null);
      toast({ title: "Class updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update class", variant: "destructive" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Class deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete class", variant: "destructive" });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: Partial<InsertStudent>) => {
      return await apiRequest("POST", "/api/students", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsCreateStudentOpen(false);
      setNewStudent({
        firstName: "",
        lastName: "",
        studentId: "",
        gradeLevel: "",
        notes: "",
        accommodations: []
      });
      toast({ title: "Student added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add student", variant: "destructive" });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      return await apiRequest("PATCH", `/api/students/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setEditingStudent(null);
      toast({ title: "Student updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update student", variant: "destructive" });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove student", variant: "destructive" });
    },
  });

  const addStudentToClassMutation = useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      return await apiRequest("POST", `/api/classes/${classId}/students`, { studentId });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", variables.classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "students"] });
      toast({ title: "Student added to class" });
    },
    onError: () => {
      toast({ title: "Failed to add student to class", variant: "destructive" });
    },
  });

  const removeStudentFromClassMutation = useMutation({
    mutationFn: async ({ classId, studentId }: { classId: string; studentId: string }) => {
      return await apiRequest("DELETE", `/api/classes/${classId}/students/${studentId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", variables.classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "students"] });
      toast({ title: "Student removed from class" });
    },
    onError: () => {
      toast({ title: "Failed to remove student from class", variant: "destructive" });
    },
  });

  const shareClassMutation = useMutation({
    mutationFn: async ({ orgId, classId, targetOrgId, permission }: { 
      orgId: string; classId: string; targetOrgId: string; permission: string 
    }) => {
      return await apiRequest("POST", `/api/orgs/${orgId}/share`, {
        entityType: "class",
        entityId: classId,
        targetOrganizationId: targetOrgId,
        permission,
      });
    },
    onSuccess: () => {
      setSharingClass(null);
      setShareTargetOrgId("");
      setSharePermission("view");
      toast({ title: "Class shared successfully" });
    },
    onError: () => {
      toast({ title: "Failed to share class", variant: "destructive" });
    },
  });

  const revokeShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      return await apiRequest("DELETE", `/api/shares/${shareId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shares/entity", "class", managingSharesClass?.id] });
      toast({ title: "Share revoked" });
    },
    onError: () => {
      toast({ title: "Failed to revoke share", variant: "destructive" });
    },
  });

  const addAccommodationToStudent = () => {
    if (!newAccommodation.description.trim()) return;
    const current = newStudent.accommodations || [];
    setNewStudent({
      ...newStudent,
      accommodations: [...current, { ...newAccommodation }]
    });
    setNewAccommodation({ type: "extraTime", description: "", active: true });
  };

  type AccommodationItem = { type: AccommodationType; description: string; active: boolean };

  const removeAccommodation = (index: number) => {
    const current = (newStudent.accommodations || []) as AccommodationItem[];
    setNewStudent({
      ...newStudent,
      accommodations: current.filter((_, i) => i !== index)
    });
  };

  // Student notes mutation
  const createNoteMutation = useMutation({
    mutationFn: async ({ studentId, content, noteType }: { studentId: string; content: string; noteType: string }) => {
      return await apiRequest("POST", `/api/students/${studentId}/notes`, { content, noteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", viewingStudent?.id, "notes"] });
      setNewNoteContent("");
      setNewNoteType("general");
      toast({ title: "Note added" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return await apiRequest("DELETE", `/api/student-notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", viewingStudent?.id, "notes"] });
      toast({ title: "Note deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  // Attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ classId, records }: { classId: string; records: { studentId: string; date: Date; status: string }[] }) => {
      return await apiRequest("POST", `/api/classes/${classId}/attendance/bulk`, { records });
    },
    onSuccess: (_data, variables) => {
      // Invalidate all attendance queries for this class
      queryClient.invalidateQueries({ queryKey: ["/api/classes", variables.classId, "attendance"] });
      toast({ title: "Attendance saved" });
      setAttendanceClass(null);
      setAttendanceRecords({});
    },
    onError: () => {
      toast({ title: "Failed to save attendance", variant: "destructive" });
    },
  });

  // Transfer request mutation
  const createTransferMutation = useMutation({
    mutationFn: async (data: { studentId: string; transferType: string; targetOrganizationId?: string; reason?: string; notes?: string }) => {
      return await apiRequest("POST", "/api/transfers", data);
    },
    onSuccess: () => {
      toast({ title: "Transfer request submitted", description: "Awaiting campus, district, and system admin approval." });
      setIsTransferDialogOpen(false);
      setTransferStudent(null);
      setTargetOrganizationId("");
      setTransferReason("");
      setTransferNotes("");
    },
    onError: () => {
      toast({ title: "Failed to submit transfer request", variant: "destructive" });
    },
  });

  // Communications queries
  const { data: portfolioReports = [] } = useQuery<any[]>({
    queryKey: ["/api/portfolio-reports"],
    enabled: !!user?.id,
  });

  const { data: quietHoursList = [] } = useQuery<any[]>({
    queryKey: ["/api/quiet-hours", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/quiet-hours?teacherUserId=${user?.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: broadcastPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/broadcast-posts"],
    enabled: !!user?.id,
  });

  const createBroadcastMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; audience: string; classId?: string }) => {
      const response = await apiRequest("POST", "/api/broadcast-posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-posts"] });
      setBroadcastTitle("");
      setBroadcastContent("");
      setIsCreateBroadcastOpen(false);
      toast({ title: "Announcement posted", description: "Your announcement has been sent to parents and/or students." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post announcement.", variant: "destructive" });
    },
  });

  const deleteBroadcastMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/broadcast-posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-posts"] });
      toast({ title: "Announcement removed" });
    },
  });

  const createQuietHoursMutation = useMutation({
    mutationFn: async (data: { startTime: string; endTime: string; daysOfWeek: number[]; timezone: string }) => {
      const response = await apiRequest("POST", "/api/quiet-hours", { ...data, teacherUserId: user?.id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiet-hours", user?.id] });
      toast({ title: "Quiet Hours Set", description: "Students will not receive messages during the set times." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save quiet hours.", variant: "destructive" });
    },
  });

  const deleteQuietHoursMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/quiet-hours/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiet-hours", user?.id] });
      toast({ title: "Quiet Hours Removed" });
    },
  });

  const generateMagicLinkMutation = useMutation({
    mutationFn: async (studentUserId: string) => {
      const response = await apiRequest("POST", "/api/parent-portal/magic-invite", { studentUserId, inviterType: "educator" });
      return response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedMagicLink(data.magicLink || "");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate invite link.", variant: "destructive" });
    },
  });

  // Filtered students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = studentSearchQuery === "" || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase()));
    
    const matchesGrade = studentGradeFilter === "all" || student.gradeLevel === studentGradeFilter;
    const matchesStatus = studentStatusFilter === "all" || student.status === studentStatusFilter;
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Export students to CSV
  const exportStudentsToCSV = () => {
    const headers = ["First Name", "Last Name", "Student ID", "Grade Level", "Status", "Email", "Enrollment Date"];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(s => [
        s.firstName,
        s.lastName,
        s.studentId || "",
        s.gradeLevel || "",
        s.status || "active",
        s.email || "",
        s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : ""
      ].map(field => `"${field}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "Students exported to CSV" });
  };

  const downloadAttendanceRoster = () => {
    if (!attendanceClass || attendanceClassStudents.length === 0) return;
    const dateFormatted = new Date(attendanceDate + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const headers = ["#", "First Name", "Last Name", "Student ID", "Grade Level", "Attendance Status", "Notes"];
    const rows = attendanceClassStudents.map((s, i) => {
      const status = attendanceRecords[s.id] || "present";
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      return [
        i + 1,
        s.firstName,
        s.lastName,
        s.studentId || "",
        s.gradeLevel || "",
        statusLabel,
        ""
      ].map(field => `"${field}"`).join(",");
    });
    const csvContent = [
      `"Class: ${attendanceClass.name}"`,
      `"Date: ${dateFormatted}"`,
      `"Subject: ${attendanceClass.subject || "N/A"}"`,
      `"Period: ${attendanceClass.period || "N/A"}"`,
      `"Total Students: ${attendanceClassStudents.length}"`,
      "",
      headers.join(","),
      ...rows
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeName = attendanceClass.name.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `attendance_${safeName}_${attendanceDate}.csv`;
    link.click();
    toast({ title: "Attendance roster downloaded", description: `${attendanceClassStudents.length} students for ${dateFormatted}` });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-oswald text-xl mb-2">Sign in to manage your classroom</h2>
        <p className="text-muted-foreground">Create classes and add students to get started</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center">
            <School className="h-6 w-6 text-lys-teal" />
          </div>
          <div>
            <h1 className="font-marker text-3xl sm:text-4xl text-foreground">
              {viewMode === "organization" ? "Organization Classroom" : "My Classroom"}
            </h1>
            <p className="font-roboto text-muted-foreground">
              {viewMode === "organization" 
                ? "View classes and students across your organization"
                : "Manage your classes and students"}
            </p>
          </div>
        </div>
      </div>

      {isCampusAdmin && userOrgs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              View Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={viewMode === "organization"}
                  onCheckedChange={(checked) => {
                    setViewMode(checked ? "organization" : "personal");
                    if (checked && userOrgs.length > 0 && !selectedOrgId) {
                      setSelectedOrgId(userOrgs[0].organizationId);
                    }
                  }}
                  data-testid="switch-view-mode"
                />
                <Label className="text-sm">
                  {viewMode === "organization" ? "Organization View" : "Personal View"}
                </Label>
              </div>
              
              {viewMode === "organization" && (
                <Select
                  value={selectedOrgId || ""}
                  onValueChange={setSelectedOrgId}
                >
                  <SelectTrigger className="w-64" data-testid="select-organization">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOrgs.map((orgMembership) => (
                      <SelectItem 
                        key={orgMembership.organizationId} 
                        value={orgMembership.organizationId}
                      >
                        {orgMembership.organization?.name || "Unknown Organization"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {viewMode === "organization" && selectedOrgId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span>
                  Viewing all classes and students in this organization. 
                  Admins can share data with other organizations.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="classes" data-testid="tab-classes">
            <BookOpen className="h-4 w-4 mr-2" />
            Classes ({classes.length})
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">
            <Users className="h-4 w-4 mr-2" />
            Students ({students.length})
          </TabsTrigger>
          {isCampusAdmin && selectedOrgId && (
            <TabsTrigger value="lesson-authors" data-testid="tab-lesson-authors">
              <GraduationCap className="h-4 w-4 mr-2" />
              Lesson Authors ({campusLessonAuthors.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="communications" data-testid="tab-communications">
            <Megaphone className="h-4 w-4 mr-2" />
            Communications
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Link href="/assignments">
              <Button 
                variant="outline"
                data-testid="button-open-create-assignment"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </Link>
            <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-create-class">
                  <Plus className="h-4 w-4 mr-2" />
                  New Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>Add a new class to organize your students.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="class-name">Class Name *</Label>
                    <Input
                      id="class-name"
                      placeholder="e.g., Algebra 1 - Period 3"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      data-testid="input-class-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="class-subject">Subject</Label>
                      <Input
                        id="class-subject"
                        placeholder="e.g., Mathematics"
                        value={newClass.subject || ""}
                        onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                        data-testid="input-class-subject"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="class-period">Period</Label>
                      <Input
                        id="class-period"
                        placeholder="e.g., 3rd Period"
                        value={newClass.period || ""}
                        onChange={(e) => setNewClass({ ...newClass, period: e.target.value })}
                        data-testid="input-class-period"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="class-grade">Grade Level</Label>
                      <Select
                        value={newClass.gradeLevel || ""}
                        onValueChange={(value) => setNewClass({ ...newClass, gradeLevel: value })}
                      >
                        <SelectTrigger data-testid="select-class-grade">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_LEVELS.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="class-year">School Year</Label>
                      <Input
                        id="class-year"
                        placeholder="e.g., 2024-2025"
                        value={newClass.schoolYear || ""}
                        onChange={(e) => setNewClass({ ...newClass, schoolYear: e.target.value })}
                        data-testid="input-class-year"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Career Fields (Optional)</Label>
                      {newClass.subject && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const suggested = suggestCareerFields(newClass.subject || "");
                            setNewClass({ ...newClass, careerFields: suggested });
                          }}
                        >
                          Auto-suggest
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Link this class to career categories
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {CAREER_FIELDS.map((field) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`new-career-${field.id}`}
                            checked={(newClass.careerFields as string[] || []).includes(field.id)}
                            onCheckedChange={(checked) => {
                              const current = (newClass.careerFields as string[]) || [];
                              const updated = checked
                                ? [...current, field.id]
                                : current.filter(f => f !== field.id);
                              setNewClass({ ...newClass, careerFields: updated });
                            }}
                          />
                          <label htmlFor={`new-career-${field.id}`} className="text-xs">
                            {field.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createClassMutation.mutate(newClass)}
                    disabled={!newClass.name || createClassMutation.isPending}
                    data-testid="button-submit-class"
                  >
                    {createClassMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {classesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No classes yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first class to start organizing students
                </p>
                <Button variant="outline" onClick={() => setIsCreateClassOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((cls) => (
                <Card key={cls.id} data-testid={`card-class-${cls.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-lys-teal/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-lys-teal" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          {cls.subject && <span>{cls.subject}</span>}
                          {cls.period && <Badge variant="outline">{cls.period}</Badge>}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setAttendanceClass(cls)}
                        title="Take Attendance"
                        data-testid={`button-attendance-${cls.id}`}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setManagingStudentsClass(cls)}
                        title="Manage Students"
                        data-testid={`button-manage-students-${cls.id}`}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      {isCampusAdmin && userOrgs.length > 0 && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSharingClass(cls)}
                            data-testid={`button-share-class-${cls.id}`}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setManagingSharesClass(cls)}
                            data-testid={`button-manage-shares-${cls.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingClass(cls)}
                        data-testid={`button-edit-class-${cls.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteClassMutation.mutate(cls.id)}
                        data-testid={`button-delete-class-${cls.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {cls.gradeLevel && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {cls.gradeLevel}
                        </div>
                      )}
                      {cls.schoolYear && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {cls.schoolYear}
                        </div>
                      )}
                      <Badge variant={cls.isActive ? "default" : "secondary"}>
                        {cls.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {viewMode === "organization" && sharedWithUs.some(
                        s => s.entityType === "class" && s.entityId === cls.id
                      ) && (
                        <Badge variant="outline" className="text-lys-teal border-lys-teal">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-1 gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or ID..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-students"
                />
              </div>
              <Select value={studentGradeFilter} onValueChange={setStudentGradeFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-grade">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={studentStatusFilter} onValueChange={setStudentStatusFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportStudentsToCSV} data-testid="button-export-students">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)} data-testid="button-bulk-upload">
                <FileText className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Dialog open={isCreateStudentOpen} onOpenChange={setIsCreateStudentOpen}>
              <DialogTrigger asChild>
                <Button className="bg-lys-red hover:bg-lys-red/90" data-testid="button-add-student">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Add a student to your roster. You can assign them to classes later.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="student-first">First Name *</Label>
                      <Input
                        id="student-first"
                        placeholder="First name"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        data-testid="input-student-first"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="student-last">Last Name *</Label>
                      <Input
                        id="student-last"
                        placeholder="Last name"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        data-testid="input-student-last"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="student-id">Student ID</Label>
                      <Input
                        id="student-id"
                        placeholder="Optional ID"
                        value={newStudent.studentId || ""}
                        onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                        data-testid="input-student-id"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="student-grade">Grade Level</Label>
                      <Select
                        value={newStudent.gradeLevel || ""}
                        onValueChange={(value) => setNewStudent({ ...newStudent, gradeLevel: value })}
                      >
                        <SelectTrigger data-testid="select-student-grade">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_LEVELS.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="student-notes">Notes</Label>
                    <Textarea
                      id="student-notes"
                      placeholder="Any additional notes about this student..."
                      value={newStudent.notes || ""}
                      onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                      data-testid="input-student-notes"
                    />
                  </div>

                  {/* Accommodations Section */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Accommodations (IEP/504/BIP)
                    </Label>
                    
                    {((newStudent.accommodations || []) as AccommodationItem[]).length > 0 && (
                      <div className="space-y-2">
                        {((newStudent.accommodations || []) as AccommodationItem[]).map((acc, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Badge variant="outline">{ACCOMMODATION_LABELS[acc.type as AccommodationType] || acc.type}</Badge>
                            <span className="text-sm flex-1 truncate">{acc.description}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeAccommodation(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Select
                        value={newAccommodation.type}
                        onValueChange={(value: AccommodationType) => setNewAccommodation({ ...newAccommodation, type: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOMMODATION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Accommodation description..."
                        value={newAccommodation.description}
                        onChange={(e) => setNewAccommodation({ ...newAccommodation, description: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={addAccommodationToStudent}
                        disabled={!newAccommodation.description.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateStudentOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createStudentMutation.mutate(newStudent)}
                    disabled={!newStudent.firstName || !newStudent.lastName || createStudentMutation.isPending}
                    data-testid="button-submit-student"
                  >
                    {createStudentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Student
                  </Button>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Student count and filter info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {filteredStudents.length} of {students.length} students</span>
            {(studentSearchQuery || studentGradeFilter !== "all" || studentStatusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => {
                setStudentSearchQuery("");
                setStudentGradeFilter("all");
                setStudentStatusFilter("all");
              }}>
                Clear filters
              </Button>
            )}
          </div>

          {studentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No students yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add students to track their progress and create personalized assignments
                </p>
                <Button variant="outline" onClick={() => setIsCreateStudentOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Student
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} data-testid={`card-student-${student.id}`}>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-lys-red/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-lys-red" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {student.firstName} {student.lastName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          {student.studentId && <span>ID: {student.studentId}</span>}
                          {student.gradeLevel && <Badge variant="outline">{student.gradeLevel}</Badge>}
                          {student.status && student.status !== "active" && (
                            <Badge variant="secondary" className="capitalize">{student.status}</Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Student Notes"
                        onClick={() => { setViewingStudent(student); setIsStudentNotesOpen(true); }}
                        data-testid={`button-notes-student-${student.id}`}
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>
                      <Link href={`/student-dashboard/${student.id}`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Student Dashboard"
                          data-testid={`button-dashboard-student-${student.id}`}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Invite Parent"
                        onClick={() => {
                          setInviteParentStudent(student);
                          setGeneratedMagicLink("");
                          setIsInviteParentOpen(true);
                        }}
                        data-testid={`button-invite-parent-${student.id}`}
                      >
                        <UserPlus className="h-4 w-4 text-green-600" />
                      </Button>
                      {isCampusAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Transfer Student"
                          onClick={() => {
                            setTransferStudent(student);
                            setIsTransferDialogOpen(true);
                          }}
                          data-testid={`button-transfer-student-${student.id}`}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingStudent(student)}
                        data-testid={`button-edit-student-${student.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteStudentMutation.mutate(student.id)}
                        data-testid={`button-delete-student-${student.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {((student.accommodations && student.accommodations.length > 0) || student.notes) && (
                    <CardContent className="pt-0">
                      {student.accommodations && student.accommodations.length > 0 && (
                        <div className="space-y-2 mb-2">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">IEP/504 Accommodations</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {student.accommodations.map((acc, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className="text-xs"
                                title={acc.description}
                              >
                                {ACCOMMODATION_LABELS[acc.type as AccommodationType] || acc.type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {student.notes && (
                        <p className="text-sm text-muted-foreground">{student.notes}</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campus Lesson Authors Tab */}
        {isCampusAdmin && selectedOrgId && (
          <TabsContent value="lesson-authors" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-oswald text-xl">Campus-Level Lesson Authors</h2>
                <p className="text-sm text-muted-foreground">
                  Educators authorized to create lessons that influence AI-generated content for <strong>this campus</strong>. 
                  System-level authors (managed by site admins) influence content across the entire system.
                </p>
              </div>
              <Dialog open={isAddCampusAuthorOpen} onOpenChange={setIsAddCampusAuthorOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-lys-teal hover:bg-lys-teal/90" data-testid="button-add-campus-author">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Author
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Campus Lesson Author</DialogTitle>
                    <DialogDescription>
                      Grant an educator permission to create lessons that influence AI-generated content for this campus.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="campus-author-user">Select Educator</Label>
                      <Select value={selectedAuthorUserId} onValueChange={setSelectedAuthorUserId}>
                        <SelectTrigger data-testid="select-campus-author-user">
                          <SelectValue placeholder="Choose an educator..." />
                        </SelectTrigger>
                        <SelectContent>
                          {orgEducators
                            .filter((m: any) => !campusLessonAuthors.some(a => a.userId === m.userId))
                            .map((member: any) => (
                              <SelectItem key={member.userId} value={member.userId}>
                                {member.user?.firstName || "User"} {member.user?.lastName || ""} ({member.user?.email || member.userId})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="campus-author-specializations">Specializations (comma-separated)</Label>
                      <Input
                        id="campus-author-specializations"
                        placeholder="e.g., math, elementary, stem"
                        onChange={(e) => setCampusAuthorSpecializations(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        data-testid="input-campus-author-specializations"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="campus-author-bio">Bio (optional)</Label>
                      <Textarea
                        id="campus-author-bio"
                        placeholder="Brief description of the author's expertise..."
                        value={campusAuthorBio}
                        onChange={(e) => setCampusAuthorBio(e.target.value)}
                        data-testid="input-campus-author-bio"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createCampusAuthorMutation.mutate({ 
                        userId: selectedAuthorUserId, 
                        specializations: campusAuthorSpecializations, 
                        bio: campusAuthorBio 
                      })}
                      disabled={!selectedAuthorUserId || createCampusAuthorMutation.isPending}
                      data-testid="button-submit-campus-author"
                    >
                      {createCampusAuthorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Author
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {campusAuthorsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : campusLessonAuthors.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No campus lesson authors yet. Add your first author to start influencing AI-generated lessons for this campus.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campusLessonAuthors.map((author) => (
                  <Card key={author.id} data-testid={`campus-author-card-${author.userId}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-lys-teal/20 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-lys-teal" />
                          </div>
                          <div>
                            <p className="font-semibold">{author.userName || "Unknown User"}</p>
                            <p className="text-sm text-muted-foreground">{author.userEmail}</p>
                            {author.bio && (
                              <p className="text-sm mt-1">{author.bio}</p>
                            )}
                            {author.specializations && author.specializations.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {author.specializations.map((spec, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">{spec}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={author.status === "active" ? "default" : "secondary"}>
                            {author.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {author.lessonsCreated || 0} lessons
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCampusAuthorMutation.mutate(author.userId)}
                            disabled={deleteCampusAuthorMutation.isPending}
                            data-testid={`button-remove-campus-author-${author.userId}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-500" />
                <CardTitle>Quiet Hours</CardTitle>
              </div>
              <CardDescription>
                Set times when students and parents will not receive notifications or messages from your classes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quietHoursList.length > 0 && (
                <div className="space-y-2 mb-4">
                  {quietHoursList.map((qh: any) => (
                    <div key={qh.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{qh.startTime} – {qh.endTime}</span>
                        <Badge variant="outline" className="text-xs">
                          {Array.isArray(qh.daysOfWeek) ? qh.daysOfWeek.map((d: number) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ") : ""}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{qh.timezone}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuietHoursMutation.mutate(qh.id)}
                        disabled={deleteQuietHoursMutation.isPending}
                        data-testid={`button-delete-quiet-hours-${qh.id}`}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time (No notifications after)</Label>
                  <Input
                    type="time"
                    value={qhStartTime}
                    onChange={(e) => setQhStartTime(e.target.value)}
                    data-testid="input-qh-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time (Resume at)</Label>
                  <Input
                    type="time"
                    value={qhEndTime}
                    onChange={(e) => setQhEndTime(e.target.value)}
                    data-testid="input-qh-end"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex gap-2 flex-wrap">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day, idx) => (
                    <Button
                      key={day}
                      type="button"
                      variant={qhDays.includes(idx) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQhDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                      data-testid={`button-qh-day-${day}`}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={qhTimezone} onValueChange={setQhTimezone}>
                  <SelectTrigger data-testid="select-qh-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createQuietHoursMutation.mutate({ startTime: qhStartTime, endTime: qhEndTime, daysOfWeek: qhDays, timezone: qhTimezone })}
                disabled={createQuietHoursMutation.isPending || qhDays.length === 0}
                data-testid="button-save-quiet-hours"
              >
                {createQuietHoursMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                Save Quiet Hours
              </Button>
            </CardContent>
          </Card>

          {/* Broadcast Announcements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-amber-500" />
                  <CardTitle>Announcements</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsCreateBroadcastOpen(true)}
                  data-testid="button-open-create-broadcast"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
              </div>
              <CardDescription>
                Post announcements visible to parents and/or students in your classes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {broadcastPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No announcements yet. Post your first to keep parents informed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcastPosts.map((post: any) => (
                    <div key={post.id} className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {post.isPinned && <PinIcon className="h-4 w-4 text-amber-500" />}
                          <h4 className="font-medium">{post.title}</h4>
                          <Badge variant="outline" className="text-xs">{post.audience}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBroadcastMutation.mutate(post.id)}
                          data-testid={`button-delete-broadcast-${post.id}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{post.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                <CardTitle>Portfolio Oversight</CardTitle>
                {portfolioReports.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">{portfolioReports.length} flagged</Badge>
                )}
              </div>
              <CardDescription>
                Items flagged for review across your students' digital portfolios. Flag items directly from any student's public portfolio page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioReports.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No flagged portfolio items. You can flag items from any student's portfolio view.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {portfolioReports.map((report: any) => (
                    <div key={report.id} className="flex items-start justify-between p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Item #{report.portfolioItemId?.slice(0, 8)}</span>
                          <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:text-red-400">
                            {report.reason}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${report.status === "resolved" ? "border-green-300 text-green-700" : "border-amber-300 text-amber-700"}`}
                          >
                            {report.status || "pending"}
                          </Badge>
                        </div>
                        {report.notes && (
                          <p className="text-xs text-muted-foreground pl-6">{report.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground pl-6">
                          Reported {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Broadcast Dialog */}
        <Dialog open={isCreateBroadcastOpen} onOpenChange={setIsCreateBroadcastOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Announcement</DialogTitle>
              <DialogDescription>Post an announcement to parents and/or students.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Field Trip Permission Slip Due"
                  data-testid="input-broadcast-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  data-testid="input-broadcast-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select value={broadcastAudience} onValueChange={setBroadcastAudience}>
                    <SelectTrigger data-testid="select-broadcast-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parents">Parents Only</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="all">Parents & Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class (Optional)</Label>
                  <Select value={broadcastClassId} onValueChange={setBroadcastClassId}>
                    <SelectTrigger data-testid="select-broadcast-class">
                      <SelectValue placeholder="All my classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All my classes</SelectItem>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateBroadcastOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createBroadcastMutation.mutate({
                  title: broadcastTitle,
                  content: broadcastContent,
                  audience: broadcastAudience,
                  ...(broadcastClassId ? { classId: broadcastClassId } : {}),
                })}
                disabled={createBroadcastMutation.isPending || !broadcastTitle.trim() || !broadcastContent.trim()}
                data-testid="button-submit-broadcast"
              >
                {createBroadcastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Post Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>

      {/* Invite Parent Dialog */}
      <Dialog open={isInviteParentOpen} onOpenChange={(open) => { setIsInviteParentOpen(open); if (!open) { setGeneratedMagicLink(""); setInviteParentStudent(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Parent / Guardian</DialogTitle>
            <DialogDescription>
              Generate a magic link for {inviteParentStudent?.firstName} {inviteParentStudent?.lastName}'s parent or guardian to connect to LYS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Share this link with the parent. They will be prompted to create or sign into a LYS account and will be automatically linked to their child's profile.
            </p>
            {generatedMagicLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                  <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs break-all flex-1">{generatedMagicLink}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedMagicLink);
                    toast({ title: "Link copied!", description: "Share this link with the parent." });
                  }}
                  data-testid="button-copy-magic-link"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setGeneratedMagicLink("")}
                  data-testid="button-regenerate-link"
                >
                  Generate New Link
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  if (inviteParentStudent?.userId) {
                    generateMagicLinkMutation.mutate(inviteParentStudent.userId);
                  } else {
                    toast({ title: "No account linked", description: "This student does not have a LYS user account yet.", variant: "destructive" });
                  }
                }}
                disabled={generateMagicLinkMutation.isPending}
                data-testid="button-generate-magic-link"
              >
                {generateMagicLinkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Generate Invite Link
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteParentOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class information.</DialogDescription>
          </DialogHeader>
          {editingClass && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-class-name">Class Name</Label>
                <Input
                  id="edit-class-name"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  data-testid="input-edit-class-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-class-subject">Subject</Label>
                  <Input
                    id="edit-class-subject"
                    value={editingClass.subject || ""}
                    onChange={(e) => setEditingClass({ ...editingClass, subject: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-class-period">Period</Label>
                  <Input
                    id="edit-class-period"
                    value={editingClass.period || ""}
                    onChange={(e) => setEditingClass({ ...editingClass, period: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label>Active Class</Label>
                <Switch
                  checked={editingClass.isActive ?? true}
                  onCheckedChange={(checked) => setEditingClass({ ...editingClass, isActive: checked })}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Career Fields</Label>
                  {editingClass.subject && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const suggested = suggestCareerFields(editingClass.subject || "");
                        setEditingClass({ ...editingClass, careerFields: suggested });
                      }}
                      data-testid="button-suggest-careers"
                    >
                      Auto-suggest
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Select career categories this class prepares students for
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {CAREER_FIELDS.map((field) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`career-${field.id}`}
                        checked={(editingClass.careerFields as string[] || []).includes(field.id)}
                        onCheckedChange={(checked) => {
                          const current = (editingClass.careerFields as string[]) || [];
                          const updated = checked
                            ? [...current, field.id]
                            : current.filter(f => f !== field.id);
                          setEditingClass({ ...editingClass, careerFields: updated });
                        }}
                      />
                      <label htmlFor={`career-${field.id}`} className="text-sm">
                        {field.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClass(null)}>Cancel</Button>
            <Button
              onClick={() => editingClass && updateClassMutation.mutate({
                id: editingClass.id,
                updates: {
                  name: editingClass.name,
                  subject: editingClass.subject,
                  period: editingClass.period,
                  isActive: editingClass.isActive,
                  careerFields: editingClass.careerFields,
                }
              })}
              disabled={updateClassMutation.isPending}
              data-testid="button-submit-edit-class"
            >
              {updateClassMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information.</DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-student-first">First Name</Label>
                  <Input
                    id="edit-student-first"
                    value={editingStudent.firstName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                    data-testid="input-edit-student-first"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-student-last">Last Name</Label>
                  <Input
                    id="edit-student-last"
                    value={editingStudent.lastName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                    data-testid="input-edit-student-last"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-student-id">Student ID</Label>
                  <Input
                    id="edit-student-id"
                    value={editingStudent.studentId || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-student-grade">Grade Level</Label>
                  <Select
                    value={editingStudent.gradeLevel || ""}
                    onValueChange={(value) => setEditingStudent({ ...editingStudent, gradeLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((grade) => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-student-notes">Notes</Label>
                <Textarea
                  id="edit-student-notes"
                  value={editingStudent.notes || ""}
                  onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
            <Button
              onClick={() => editingStudent && updateStudentMutation.mutate({
                id: editingStudent.id,
                updates: {
                  firstName: editingStudent.firstName,
                  lastName: editingStudent.lastName,
                  studentId: editingStudent.studentId,
                  gradeLevel: editingStudent.gradeLevel,
                  notes: editingStudent.notes,
                }
              })}
              disabled={updateStudentMutation.isPending}
              data-testid="button-submit-edit-student"
            >
              {updateStudentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Shares Dialog */}
      <Dialog open={!!managingSharesClass} onOpenChange={(open) => !open && setManagingSharesClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Shares</DialogTitle>
            <DialogDescription>
              View and manage shares for "{managingSharesClass?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {classShares.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No shares for this class yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classShares.map((share) => {
                  const targetOrg = allOrgs.find(o => o.id === share.targetOrganizationId);
                  return (
                    <div 
                      key={share.id} 
                      className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{targetOrg?.name || "Unknown Organization"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{share.permission}</Badge>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => revokeShareMutation.mutate(share.id)}
                        disabled={revokeShareMutation.isPending}
                        data-testid={`button-revoke-share-${share.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingSharesClass(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Class Dialog */}
      <Dialog open={!!sharingClass} onOpenChange={(open) => !open && setSharingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Class</DialogTitle>
            <DialogDescription>
              Share "{sharingClass?.name}" with another organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="share-target-org">Target Organization</Label>
              <Select
                value={shareTargetOrgId}
                onValueChange={setShareTargetOrgId}
              >
                <SelectTrigger data-testid="select-share-target-org">
                  <SelectValue placeholder="Select organization to share with" />
                </SelectTrigger>
                <SelectContent>
                  {allOrgs
                    .filter(org => {
                      const sourceOrgId = sharingClass?.organizationId || selectedOrgId;
                      return org.id !== sourceOrgId;
                    })
                    .map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="share-permission">Permission Level</Label>
              <Select
                value={sharePermission}
                onValueChange={(v) => setSharePermission(v as "view" | "edit" | "copy")}
              >
                <SelectTrigger data-testid="select-share-permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="copy">Copy</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {sharePermission === "view" && "Target organization can view this class but not modify it."}
                {sharePermission === "edit" && "Target organization can view and modify this class."}
                {sharePermission === "copy" && "Target organization can create their own copy of this class."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSharingClass(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (sharingClass && shareTargetOrgId) {
                  const sourceOrgId = sharingClass.organizationId || selectedOrgId || userOrgs[0]?.organizationId;
                  if (sourceOrgId) {
                    shareClassMutation.mutate({
                      orgId: sourceOrgId,
                      classId: sharingClass.id,
                      targetOrgId: shareTargetOrgId,
                      permission: sharePermission,
                    });
                  }
                }
              }}
              disabled={!shareTargetOrgId || shareClassMutation.isPending}
              data-testid="button-submit-share"
            >
              {shareClassMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Share Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={!!managingStudentsClass} onOpenChange={(open) => !open && setManagingStudentsClass(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Students - {managingStudentsClass?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove students from this class.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Students */}
            <div>
              <Label className="text-sm font-medium">Students in Class ({managedClassStudents.length})</Label>
              {managedClassStudentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : managedClassStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No students assigned to this class yet.</p>
              ) : (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {managedClassStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{student.firstName} {student.lastName}</span>
                        {student.gradeLevel && <Badge variant="outline" className="text-xs">{student.gradeLevel}</Badge>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (managingStudentsClass) {
                            removeStudentFromClassMutation.mutate({
                              classId: managingStudentsClass.id,
                              studentId: student.id
                            });
                          }
                        }}
                        data-testid={`button-remove-student-from-class-${student.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Students to Add */}
            <div>
              <Label className="text-sm font-medium">Add Students</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {students
                  .filter(s => !managedClassStudents.find(cs => cs.id === s.id))
                  .map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 border rounded-md hover-elevate">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{student.firstName} {student.lastName}</span>
                        {student.gradeLevel && <Badge variant="outline" className="text-xs">{student.gradeLevel}</Badge>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (managingStudentsClass) {
                            addStudentToClassMutation.mutate({
                              classId: managingStudentsClass.id,
                              studentId: student.id
                            });
                          }
                        }}
                        disabled={addStudentToClassMutation.isPending}
                        data-testid={`button-add-student-to-class-${student.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                {students.filter(s => !managedClassStudents.find(cs => cs.id === s.id)).length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    All students are already in this class, or no students have been created yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingStudentsClass(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Students Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Students</DialogTitle>
            <DialogDescription>
              Paste student data in CSV format. Each line should have: First Name, Last Name, Student ID, Grade Level
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>CSV Data</Label>
              <Textarea
                placeholder="John,Doe,12345,9th Grade
Jane,Smith,12346,10th Grade
..."
                value={bulkUploadData}
                onChange={(e) => setBulkUploadData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                data-testid="textarea-bulk-upload"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Format: FirstName,LastName,StudentID,GradeLevel (one student per line)
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const lines = bulkUploadData.trim().split('\n').filter(line => line.trim().length > 0);
                let successCount = 0;
                let errorCount = 0;
                const errors: string[] = [];
                
                for (const line of lines) {
                  const parts = line.split(',').map(p => p.trim());
                  const firstName = parts[0] || "";
                  const lastName = parts[1] || "";
                  
                  if (!firstName || !lastName) {
                    errors.push(`Skipped line: "${line}" (missing name)`);
                    errorCount++;
                    continue;
                  }
                  
                  try {
                    await apiRequest("POST", "/api/students", {
                      firstName,
                      lastName,
                      studentId: parts[2] || "",
                      gradeLevel: parts[3] || ""
                    });
                    successCount++;
                  } catch (err: any) {
                    errors.push(`Failed: ${firstName} ${lastName}`);
                    errorCount++;
                  }
                }
                
                queryClient.invalidateQueries({ queryKey: ["/api/students"] });
                toast({
                  title: `Bulk upload complete`,
                  description: `${successCount} students added${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
                  variant: errorCount > 0 ? "destructive" : "default"
                });
                setBulkUploadData("");
                setIsBulkUploadOpen(false);
              }}
              disabled={!bulkUploadData.trim()}
              data-testid="button-submit-bulk-upload"
            >
              Upload Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Notes Dialog */}
      <Dialog open={isStudentNotesOpen} onOpenChange={(open) => { if (!open) { setIsStudentNotesOpen(false); setViewingStudent(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Notes for {viewingStudent?.firstName} {viewingStudent?.lastName}
            </DialogTitle>
            <DialogDescription>
              Add private notes about this student. Only you can see these notes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Add new note */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex gap-2">
                <Select value={newNoteType} onValueChange={setNewNoteType}>
                  <SelectTrigger className="w-[140px]" data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Write a note about this student..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                data-testid="textarea-new-note"
              />
              <Button
                onClick={() => viewingStudent && createNoteMutation.mutate({ 
                  studentId: viewingStudent.id, 
                  content: newNoteContent, 
                  noteType: newNoteType 
                })}
                disabled={!newNoteContent.trim() || createNoteMutation.isPending}
                data-testid="button-add-note"
              >
                {createNoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Note
              </Button>
            </div>

            {/* Existing notes */}
            <div className="space-y-3">
              {studentNotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No notes yet</p>
              ) : (
                studentNotes.map((note) => (
                  <div key={note.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">{note.noteType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {note.createdAt && new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteNoteMutation.mutate(note.id)}
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={!!attendanceClass} onOpenChange={(open) => !open && setAttendanceClass(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Take Attendance - {attendanceClass?.name}
            </DialogTitle>
            <DialogDescription>
              Mark attendance for {attendanceDate}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-[180px]"
                  data-testid="input-attendance-date"
                />
              </div>
              <Button
                variant="outline"
                onClick={downloadAttendanceRoster}
                disabled={attendanceClassStudents.length === 0}
                className="gap-1"
                data-testid="button-download-attendance-roster"
              >
                <Download className="h-4 w-4" />
                Download Roster
              </Button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {attendanceClassStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No students in this class</p>
              ) : (
                attendanceClassStudents.map((student) => {
                  const currentStatus = attendanceRecords[student.id] || "present";
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`attendance-row-${student.id}`}>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{student.firstName} {student.lastName}</span>
                      </div>
                      <div className="flex gap-1">
                        {ATTENDANCE_STATUSES.map((status) => {
                          const Icon = status.icon;
                          const isSelected = currentStatus === status.value;
                          return (
                            <Button
                              key={status.value}
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className={isSelected ? status.selectedClass : ""}
                              onClick={() => setAttendanceRecords({ ...attendanceRecords, [student.id]: status.value })}
                              data-testid={`button-attendance-${student.id}-${status.value}`}
                            >
                              <Icon className="h-4 w-4 mr-1" />
                              {status.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceClass(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!attendanceClass) return;
                const records = attendanceClassStudents.map(s => ({
                  studentId: s.id,
                  date: new Date(attendanceDate),
                  status: attendanceRecords[s.id] || "present"
                }));
                saveAttendanceMutation.mutate({ classId: attendanceClass.id, records });
              }}
              disabled={saveAttendanceMutation.isPending || attendanceClassStudents.length === 0}
              data-testid="button-save-attendance"
            >
              {saveAttendanceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Student Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsTransferDialogOpen(false);
          setTransferStudent(null);
          setTargetOrganizationId("");
          setTransferReason("");
          setTransferNotes("");
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Student
            </DialogTitle>
            <DialogDescription>
              Request to transfer {transferStudent?.firstName} {transferStudent?.lastName} to another organization. 
              This requires approval from campus, district, and system administrators.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Triple Confirmation Required</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Organization transfers require approval from:
                  </p>
                  <ol className="text-xs text-amber-700 dark:text-amber-300 mt-1 list-decimal list-inside">
                    <li>Campus Administrator</li>
                    <li>District Administrator</li>
                    <li>System Administrator</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transfer Type</Label>
              <Select value={transferType} onValueChange={(v) => setTransferType(v as "educator" | "organization")}>
                <SelectTrigger data-testid="select-transfer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="educator">Transfer to Different Educator (Same Campus)</SelectItem>
                  <SelectItem value="organization">Transfer to Different Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferType === "organization" && (
              <div className="space-y-2">
                <Label>Target Organization</Label>
                <Select value={targetOrganizationId} onValueChange={setTargetOrganizationId}>
                  <SelectTrigger data-testid="select-target-org">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {allOrgs
                      .filter(org => org.id !== transferStudent?.organizationId)
                      .map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} ({org.type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="transfer-reason">Reason for Transfer</Label>
              <Input
                id="transfer-reason"
                placeholder="e.g., Family relocation, program change"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                data-testid="input-transfer-reason"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="transfer-notes"
                placeholder="Any additional information for approvers"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows={3}
                data-testid="input-transfer-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (transferStudent) {
                  createTransferMutation.mutate({
                    studentId: transferStudent.id,
                    transferType,
                    targetOrganizationId: transferType === "organization" ? targetOrganizationId : undefined,
                    reason: transferReason,
                    notes: transferNotes
                  });
                }
              }}
              disabled={
                createTransferMutation.isPending ||
                !transferReason ||
                (transferType === "organization" && !targetOrganizationId)
              }
              data-testid="button-submit-transfer"
            >
              {createTransferMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Submit Transfer Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
