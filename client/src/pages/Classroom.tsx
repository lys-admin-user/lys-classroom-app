import { useState } from "react";
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
  Filter
} from "lucide-react";
import { Link } from "wouter";
import type { Class, Student, InsertClass, InsertStudent, AccommodationType, Organization, OrgMembership, StudentNote, AttendanceRecord } from "@shared/schema";

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
  const [activeTab, setActiveTab] = useState<"classes" | "students">("classes");
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
  
  // Assignment creation
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [assignmentTargetType, setAssignmentTargetType] = useState<"class" | "accommodation_group" | "individual">("class");
  const [assignmentClassId, setAssignmentClassId] = useState<string>("");
  const [selectedAccommodationTypes, setSelectedAccommodationTypes] = useState<AccommodationType[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    totalPoints: 100
  });

  const isCampusAdmin = user?.role === "campus_admin";
  
  const { data: userOrgs = [] } = useQuery<OrgWithDetails[]>({
    queryKey: ["/api/organizations/mine"],
    enabled: !!user && isCampusAdmin,
  });

  const { data: allOrgs = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: !!user && isCampusAdmin,
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
    queryKey: ["/api/classes", attendanceClass?.id, "attendance"],
    enabled: !!attendanceClass,
  });

  // Query for students in attendance class
  const { data: attendanceClassStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/classes", attendanceClass?.id, "students"],
    enabled: !!attendanceClass,
  });

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

  // Query for students with specific accommodations (for assignment targeting)
  const { data: accommodationStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/students/by-accommodations", selectedAccommodationTypes, assignmentClassId],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/students/by-accommodations", {
        accommodationTypes: selectedAccommodationTypes,
        classId: assignmentClassId || undefined
      });
      return response.json();
    },
    enabled: assignmentTargetType === "accommodation_group" && selectedAccommodationTypes.length > 0,
  });

  // Assignment creation mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Assignment created" });
      setIsCreateAssignmentOpen(false);
      setNewAssignment({ title: "", description: "", instructions: "", dueDate: "", totalPoints: 100 });
      setAssignmentTargetType("class");
      setAssignmentClassId("");
      setSelectedAccommodationTypes([]);
      setSelectedStudentIds([]);
    },
    onError: () => {
      toast({ title: "Failed to create assignment", variant: "destructive" });
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
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsCreateAssignmentOpen(true)} 
              data-testid="button-open-create-assignment"
            >
              <FileText className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
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
      </Tabs>

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
            <div className="flex items-center gap-4">
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-[180px]"
                data-testid="input-attendance-date"
              />
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

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateAssignmentOpen} onOpenChange={setIsCreateAssignmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Assignment
            </DialogTitle>
            <DialogDescription>
              Create a new assignment and choose who to assign it to
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-title">Title</Label>
              <Input
                id="assignment-title"
                placeholder="Assignment title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                data-testid="input-assignment-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-description">Description</Label>
              <Textarea
                id="assignment-description"
                placeholder="Brief description of the assignment"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                data-testid="input-assignment-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-instructions">Instructions</Label>
              <Textarea
                id="assignment-instructions"
                placeholder="Detailed instructions for students"
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })}
                rows={4}
                data-testid="input-assignment-instructions"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment-due-date">Due Date</Label>
                <Input
                  id="assignment-due-date"
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  data-testid="input-assignment-due-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-points">Total Points</Label>
                <Input
                  id="assignment-points"
                  type="number"
                  value={newAssignment.totalPoints}
                  onChange={(e) => setNewAssignment({ ...newAssignment, totalPoints: parseInt(e.target.value) || 0 })}
                  data-testid="input-assignment-points"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <Label className="text-base font-semibold mb-3 block">Assign To</Label>
              
              <div className="flex gap-2 mb-4">
                <Button
                  variant={assignmentTargetType === "class" ? "default" : "outline"}
                  onClick={() => setAssignmentTargetType("class")}
                  size="sm"
                  data-testid="button-target-class"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Whole Class
                </Button>
                <Button
                  variant={assignmentTargetType === "accommodation_group" ? "default" : "outline"}
                  onClick={() => setAssignmentTargetType("accommodation_group")}
                  size="sm"
                  data-testid="button-target-accommodation"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  IEP Group
                </Button>
                <Button
                  variant={assignmentTargetType === "individual" ? "default" : "outline"}
                  onClick={() => setAssignmentTargetType("individual")}
                  size="sm"
                  data-testid="button-target-individual"
                >
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Individual Students
                </Button>
              </div>

              {/* Class Selection (for class or accommodation_group targeting) */}
              {(assignmentTargetType === "class" || assignmentTargetType === "accommodation_group") && (
                <div className="space-y-2 mb-4">
                  <Label>Select Class</Label>
                  <Select value={assignmentClassId} onValueChange={setAssignmentClassId}>
                    <SelectTrigger data-testid="select-assignment-class">
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.period && `(${cls.period})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Accommodation Types Selection */}
              {assignmentTargetType === "accommodation_group" && (
                <div className="space-y-2">
                  <Label>Select Accommodation Types (IEP)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Students with any of these accommodations will be assigned
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ACCOMMODATION_TYPES.map((type) => {
                      const isSelected = selectedAccommodationTypes.includes(type);
                      return (
                        <Badge
                          key={type}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAccommodationTypes(selectedAccommodationTypes.filter(t => t !== type));
                            } else {
                              setSelectedAccommodationTypes([...selectedAccommodationTypes, type]);
                            }
                          }}
                          data-testid={`badge-accommodation-${type}`}
                        >
                          {ACCOMMODATION_LABELS[type]}
                        </Badge>
                      );
                    })}
                  </div>
                  {selectedAccommodationTypes.length > 0 && accommodationStudents.length > 0 && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-2">
                        {accommodationStudents.length} student{accommodationStudents.length !== 1 ? 's' : ''} will receive this assignment:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {accommodationStudents.slice(0, 10).map((student) => (
                          <Badge key={student.id} variant="secondary" className="text-xs">
                            {student.firstName} {student.lastName}
                          </Badge>
                        ))}
                        {accommodationStudents.length > 10 && (
                          <Badge variant="secondary" className="text-xs">
                            +{accommodationStudents.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Individual Student Selection */}
              {assignmentTargetType === "individual" && (
                <div className="space-y-2">
                  <Label>Select Students</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                    {students.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover-elevate ${isSelected ? 'bg-primary/10' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                            } else {
                              setSelectedStudentIds([...selectedStudentIds, student.id]);
                            }
                          }}
                          data-testid={`checkbox-student-${student.id}`}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span>{student.firstName} {student.lastName}</span>
                          {student.gradeLevel && (
                            <Badge variant="outline" className="text-xs">{student.gradeLevel}</Badge>
                          )}
                        </div>
                      );
                    })}
                    {students.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No students available
                      </p>
                    )}
                  </div>
                  {selectedStudentIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateAssignmentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const data: any = {
                  title: newAssignment.title,
                  description: newAssignment.description,
                  instructions: newAssignment.instructions,
                  dueDate: newAssignment.dueDate ? new Date(newAssignment.dueDate) : null,
                  totalPoints: newAssignment.totalPoints,
                  targetType: assignmentTargetType,
                  classId: assignmentClassId || null,
                  targetAccommodations: assignmentTargetType === "accommodation_group" ? selectedAccommodationTypes : null,
                  targetStudentIds: assignmentTargetType === "individual" ? selectedStudentIds : null,
                };
                createAssignmentMutation.mutate(data);
              }}
              disabled={
                !newAssignment.title ||
                createAssignmentMutation.isPending ||
                (assignmentTargetType === "class" && !assignmentClassId) ||
                (assignmentTargetType === "accommodation_group" && (selectedAccommodationTypes.length === 0 || !assignmentClassId)) ||
                (assignmentTargetType === "individual" && selectedStudentIds.length === 0)
              }
              data-testid="button-create-assignment"
            >
              {createAssignmentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
