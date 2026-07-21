import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Download,
  Upload,
  Save,
  GraduationCap,
  Calculator,
  FileSpreadsheet,
  Share2,
  TrendingUp,
  Settings,
  Briefcase,
  Target,
  StickyNote,
  ChevronLeft,
  Globe,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Class, Student, StudentGrade, GradeCategory, InsertStudentGrade, InsertGradeCategory, ClassGradingSettings } from "@shared/schema";
import { CAREER_FIELDS } from "@shared/schema";

const LETTER_GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-600",
  "A": "bg-green-500",
  "A-": "bg-green-400",
  "B+": "bg-teal-500",
  "B": "bg-teal-400",
  "B-": "bg-teal-300",
  "C+": "bg-yellow-500",
  "C": "bg-yellow-400",
  "C-": "bg-yellow-300",
  "D+": "bg-amber-500",
  "D": "bg-amber-400",
  "D-": "bg-amber-300",
  "F": "bg-red-500",
};

// Top 10 international grading systems
const GRADING_SYSTEMS = [
  { id: "af_us", label: "A–F (USA / Canada)", description: "Letter grades A+ through F, 0–100% scale" },
  { id: "percent_100", label: "0–100 Percentage", description: "Pure percentage, no letter grade" },
  { id: "gpa_4", label: "4.0 GPA Scale", description: "0.0–4.0 used in US higher education" },
  { id: "1_10", label: "1–10 Scale", description: "Used in Netherlands, Colombia, Mexico, Turkey" },
  { id: "1_7", label: "1–7 Scale", description: "Used in Chile, IB Diploma Programme" },
  { id: "af_uk", label: "UK Grades (A*–U)", description: "A*–U used in GCSE/A-Level (UK)" },
  { id: "5_point", label: "5-Point Scale (1–5)", description: "Used in Germany, Russia, many Eastern European countries" },
  { id: "20_point", label: "20-Point Scale", description: "Used in France, Lebanon, and parts of Africa" },
  { id: "hd_f", label: "HD–F (Australia)", description: "High Distinction, Distinction, Credit, Pass, Fail" },
  { id: "credit_distinction", label: "Pass / Merit / Distinction", description: "Common in UK vocational and some African systems" },
];

const GRADE_WEIGHT_LABELS: Record<string, string> = {
  major: "Major",
  minor: "Minor",
  other: "Other",
};
const GRADE_WEIGHT_COLORS: Record<string, string> = {
  major: "bg-lys-red/10 text-lys-red border-lys-red/20",
  minor: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  other: "bg-muted text-muted-foreground",
};

type SisConnection = {
  id: string;
  provider: string;
  name: string;
  status: string;
  accessToken?: string;
};

export default function Gradebook() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isSisExportOpen, setIsSisExportOpen] = useState(false);
  const [isGradingSystemOpen, setIsGradingSystemOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null);
  const [activeTab, setActiveTab] = useState("grades");
  const [selectedSisConnection, setSelectedSisConnection] = useState<string>("");

  // Student drill-down
  const [drillStudent, setDrillStudent] = useState<Student | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("academic");

  const [newGrade, setNewGrade] = useState<Partial<InsertStudentGrade>>({
    title: "",
    pointsPossible: 100,
    pointsEarned: undefined,
    studentId: "",
    classId: "",
    categoryId: "",
  });

  const [newCategory, setNewCategory] = useState<Partial<InsertGradeCategory>>({
    name: "",
    weight: 100,
    color: "#3b82f6",
  });

  // Grading system settings local state
  const [gradingSystemDraft, setGradingSystemDraft] = useState({
    gradingSystem: "af_us",
    majorWeight: 50,
    minorWeight: 35,
    otherWeight: 15,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<StudentGrade[]>({
    queryKey: ["/api/classes", selectedClassId, "grades"],
    enabled: !!selectedClassId,
  });

  const { data: categories = [] } = useQuery<GradeCategory[]>({
    queryKey: ["/api/classes", selectedClassId, "grade-categories"],
    enabled: !!selectedClassId,
  });

  const { data: classStudents = [] } = useQuery<{ studentId: string }[]>({
    queryKey: ["/api/classes", selectedClassId, "students"],
    enabled: !!selectedClassId,
  });

  const { data: sisConnections = [] } = useQuery<SisConnection[]>({
    queryKey: ["/api/integrations/sis/connections"],
  });

  const { data: gradingSettings } = useQuery<ClassGradingSettings | null>({
    queryKey: ["/api/classes", selectedClassId, "grading-settings"],
    enabled: !!selectedClassId,
  });

  // Student notes for drill-down
  const { data: studentNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/students", drillStudent?.id, "notes"],
    enabled: !!drillStudent,
  });

  const studentsInClass = useMemo(() => {
    const studentIds = classStudents.map((cs) => cs.studentId);
    return students.filter((s) => studentIds.includes(s.id));
  }, [students, classStudents]);

  const createGradeMutation = useMutation({
    mutationFn: async (grade: Partial<InsertStudentGrade>) => {
      return await apiRequest("POST", "/api/grades", grade);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "grades"] });
      toast({ title: "Grade added successfully" });
      setIsAddGradeOpen(false);
      setNewGrade({ title: "", pointsPossible: 100, pointsEarned: undefined, studentId: "", classId: "", categoryId: "" });
    },
    onError: () => {
      toast({ title: "Failed to add grade", variant: "destructive" });
    },
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StudentGrade> }) => {
      return await apiRequest("PATCH", `/api/grades/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "grades"] });
      toast({ title: "Grade updated" });
      setEditingGrade(null);
    },
    onError: () => {
      toast({ title: "Failed to update grade", variant: "destructive" });
    },
  });

  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/grades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "grades"] });
      toast({ title: "Grade deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete grade", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: Partial<InsertGradeCategory>) => {
      return await apiRequest("POST", "/api/grade-categories", { ...category, classId: selectedClassId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "grade-categories"] });
      toast({ title: "Category created" });
      setIsAddCategoryOpen(false);
      setNewCategory({ name: "", weight: 100, color: "#3b82f6" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/grade-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "grade-categories"] });
      toast({ title: "Category deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const exportToSisMutation = useMutation({
    mutationFn: async ({ connectionId, classId }: { connectionId: string; classId: string }) => {
      const res = await apiRequest("POST", `/api/integrations/sis/connections/${connectionId}/export-grades`, { classId });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Grades exported", description: data.message || "Grades successfully sent to SIS" });
      setIsSisExportOpen(false);
      setSelectedSisConnection("");
    },
    onError: () => {
      toast({ title: "Failed to export grades", variant: "destructive" });
    },
  });

  const saveGradingSettingsMutation = useMutation({
    mutationFn: async (settings: typeof gradingSystemDraft) =>
      apiRequest("PUT", `/api/classes/${selectedClassId}/grading-settings`, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClassId, "grading-settings"] });
      toast({ title: "Grading settings saved" });
      setIsGradingSystemOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to save grading settings", variant: "destructive" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { studentId: string; content: string; noteType: string; classId: string }) =>
      apiRequest("POST", "/api/student-notes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", drillStudent?.id, "notes"] });
      toast({ title: "Note saved" });
      setNoteContent("");
    },
    onError: () => {
      toast({ title: "Failed to save note", variant: "destructive" });
    },
  });

  const handleExportToSis = () => {
    if (!selectedSisConnection || !selectedClassId) {
      toast({ title: "Please select a SIS connection", variant: "destructive" });
      return;
    }
    exportToSisMutation.mutate({ connectionId: selectedSisConnection, classId: selectedClassId });
  };

  const configuredSisConnections = sisConnections.filter(
    (c) => c.status === "active" || c.accessToken
  );

  const handleExportCSV = () => {
    if (!selectedClassId) return;
    window.open(`/api/classes/${selectedClassId}/grades/export`, "_blank");
  };

  const handleAddGrade = () => {
    if (!newGrade.title || !newGrade.studentId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createGradeMutation.mutate({
      ...newGrade,
      classId: selectedClassId,
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.name) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const openGradingSystem = () => {
    setGradingSystemDraft({
      gradingSystem: gradingSettings?.gradingSystem || "af_us",
      majorWeight: gradingSettings?.majorWeight ?? 50,
      minorWeight: gradingSettings?.minorWeight ?? 35,
      otherWeight: gradingSettings?.otherWeight ?? 15,
    });
    setIsGradingSystemOpen(true);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown";
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const calculateStudentAverage = (studentId: string) => {
    const sg = grades.filter((g) => g.studentId === studentId && g.percentage !== null);
    if (sg.length === 0) return null;
    const sum = sg.reduce((acc, g) => acc + (g.percentage || 0), 0);
    return Math.round(sum / sg.length);
  };

  const getLetterGradeColor = (letterGrade: string | null) => {
    if (!letterGrade) return "bg-muted";
    return LETTER_GRADE_COLORS[letterGrade] || "bg-muted";
  };

  const avgToLetter = (avg: number | null) => {
    if (avg === null) return null;
    return avg >= 97 ? "A+" : avg >= 93 ? "A" : avg >= 90 ? "A-"
      : avg >= 87 ? "B+" : avg >= 83 ? "B" : avg >= 80 ? "B-"
      : avg >= 77 ? "C+" : avg >= 73 ? "C" : avg >= 70 ? "C-"
      : avg >= 67 ? "D+" : avg >= 63 ? "D" : avg >= 60 ? "D-" : "F";
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const activeGradingSystem = GRADING_SYSTEMS.find(s => s.id === (gradingSettings?.gradingSystem || "af_us"));

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Student drill-down view ──────────────────────────────────────────────
  if (drillStudent) {
    const studentGradeList = grades.filter((g) => g.studentId === drillStudent.id);
    const avg = calculateStudentAverage(drillStudent.id);
    const letter = avgToLetter(avg);

    return (
      <div className="container mx-auto p-4 space-y-6" data-testid="page-student-drill-down">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDrillStudent(null)} data-testid="button-back-gradebook">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{drillStudent.firstName} {drillStudent.lastName}</h1>
            <p className="text-muted-foreground text-sm">{selectedClass?.name} — Individual Grade View</p>
          </div>
          {letter && (
            <Badge className={`${getLetterGradeColor(letter)} text-white ml-auto text-lg px-3 py-1`} data-testid="badge-student-grade">
              {letter} ({avg}%)
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Assignment grades */}
          <Card data-testid="card-student-grades">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Assignment Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentGradeList.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No grades recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {studentGradeList.map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-2" data-testid={`row-grade-${g.id}`}>
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`text-grade-title-${g.id}`}>{g.title}</p>
                        <p className="text-xs text-muted-foreground">{getCategoryName(g.categoryId)}</p>
                        {g.comments && (
                          <p className="text-xs text-muted-foreground italic mt-0.5" data-testid={`text-grade-comment-${g.id}`}>"{g.comments}"</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{g.pointsEarned ?? "–"} / {g.pointsPossible}</p>
                        {g.letterGrade && (
                          <Badge className={`${getLetterGradeColor(g.letterGrade)} text-white text-xs`}>{g.letterGrade}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher notes */}
          <Card data-testid="card-teacher-notes">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Teacher Notes
              </CardTitle>
              <CardDescription>Private notes — visible only to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentNotes.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {studentNotes.map((note: any) => (
                    <div key={note.id} className="border rounded-md px-3 py-2 text-sm" data-testid={`note-${note.id}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">{note.noteType?.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-sm" data-testid={`text-note-content-${note.id}`}>{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <Label>Add a Note</Label>
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="parent_contact">Parent Contact</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Write a note about this student..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  data-testid="input-note-content"
                  rows={3}
                />
                <Button
                  size="sm"
                  disabled={!noteContent.trim() || createNoteMutation.isPending}
                  onClick={() => {
                    if (!drillStudent || !selectedClassId) return;
                    createNoteMutation.mutate({
                      studentId: drillStudent.id,
                      content: noteContent.trim(),
                      noteType,
                      classId: selectedClassId,
                    });
                  }}
                  data-testid="button-save-note"
                >
                  {createNoteMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Save Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main gradebook view ──────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Gradebook
          </h1>
          <p className="text-muted-foreground">Manage and track student grades</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-class">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClassId && (
            <Button variant="outline" size="sm" onClick={openGradingSystem} data-testid="button-grading-system">
              <Globe className="h-4 w-4 mr-1" />
              {activeGradingSystem?.label || "Grading System"}
            </Button>
          )}
        </div>
      </div>

      {!selectedClassId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
            <p className="text-muted-foreground text-center">
              Choose a class from the dropdown above to view and manage grades
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentsInClass.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{grades.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {grades.length > 0
                    ? Math.round(grades.filter(g => g.percentage != null).reduce((acc, g) => acc + (g.percentage || 0), 0) / grades.filter(g => g.percentage != null).length) + "%"
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade weight summary banner */}
          {gradingSettings && (
            <Card className="border-dashed" data-testid="card-weight-summary">
              <CardContent className="py-3 px-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-medium text-muted-foreground">Grade Weights:</span>
                  <span className="flex items-center gap-1.5"><Badge variant="outline" className={GRADE_WEIGHT_COLORS.major}>Major</Badge>{gradingSettings.majorWeight}%</span>
                  <span className="flex items-center gap-1.5"><Badge variant="outline" className={GRADE_WEIGHT_COLORS.minor}>Minor</Badge>{gradingSettings.minorWeight}%</span>
                  <span className="flex items-center gap-1.5"><Badge variant="outline" className={GRADE_WEIGHT_COLORS.other}>Other</Badge>{gradingSettings.otherWeight}%</span>
                  <span className="text-muted-foreground">· System: {activeGradingSystem?.label}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Dialog open={isAddGradeOpen} onOpenChange={setIsAddGradeOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-grade">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grade
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Grade</DialogTitle>
                  <DialogDescription>Enter the grade details for a student</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="grade-student">Student</Label>
                    <Select
                      value={newGrade.studentId}
                      onValueChange={(v) => setNewGrade({ ...newGrade, studentId: v })}
                    >
                      <SelectTrigger data-testid="select-grade-student">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsInClass.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="grade-title">Assignment Title</Label>
                    <Input
                      id="grade-title"
                      value={newGrade.title}
                      onChange={(e) => setNewGrade({ ...newGrade, title: e.target.value })}
                      placeholder="e.g., Chapter 5 Quiz"
                      data-testid="input-grade-title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={newGrade.categoryId || ""}
                        onValueChange={(v) => setNewGrade({ ...newGrade, categoryId: v === "__none__" ? undefined : v || undefined })}
                      >
                        <SelectTrigger data-testid="select-grade-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No Category</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name} ({cat.weight}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Grade Weight</Label>
                      <Select
                        value={(newGrade as any).gradeWeight || ""}
                        onValueChange={(v) => setNewGrade({ ...newGrade, ...(v && v !== "__none__" ? { gradeWeight: v } : { gradeWeight: undefined }) } as any)}
                      >
                        <SelectTrigger data-testid="select-grade-weight">
                          <SelectValue placeholder="Weight type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No weight</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grade-earned">Points Earned</Label>
                      <Input
                        id="grade-earned"
                        type="number"
                        value={newGrade.pointsEarned ?? ""}
                        onChange={(e) => setNewGrade({ ...newGrade, pointsEarned: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="0"
                        data-testid="input-points-earned"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grade-possible">Points Possible</Label>
                      <Input
                        id="grade-possible"
                        type="number"
                        value={newGrade.pointsPossible}
                        onChange={(e) => setNewGrade({ ...newGrade, pointsPossible: parseInt(e.target.value) || 100 })}
                        placeholder="100"
                        data-testid="input-points-possible"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="grade-comments">Comments (optional)</Label>
                    <Input
                      id="grade-comments"
                      value={(newGrade as any).comments || ""}
                      onChange={(e) => setNewGrade({ ...newGrade, ...(e.target.value ? { comments: e.target.value } : {}) } as any)}
                      placeholder="Optional teacher feedback"
                      data-testid="input-grade-comments"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddGradeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddGrade} disabled={createGradeMutation.isPending} data-testid="button-save-grade">
                    {createGradeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Grade
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-category">
                  <Settings className="h-4 w-4 mr-2" />
                  Categories
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grade Categories</DialogTitle>
                  <DialogDescription>Manage grade categories and weights</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color || "#3b82f6" }}
                            />
                            <span>{cat.name}</span>
                            <Badge variant="secondary">{cat.weight}%</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(cat.id)}
                            data-testid={`button-delete-category-${cat.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-4 space-y-3">
                    <Label>Add New Category</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Category name (e.g., Homework)"
                      data-testid="input-category-name"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={newCategory.weight}
                        onChange={(e) => setNewCategory({ ...newCategory, weight: parseInt(e.target.value) || 0 })}
                        placeholder="Weight %"
                        className="w-24"
                        data-testid="input-category-weight"
                      />
                      <Input
                        type="color"
                        value={newCategory.color || "#3b82f6"}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-16 p-1 h-9"
                      />
                      <Button onClick={handleAddCategory} disabled={createCategoryMutation.isPending} data-testid="button-save-category">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Dialog open={isSisExportOpen} onOpenChange={setIsSisExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-share-sis">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share to SIS
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Grades to SIS</DialogTitle>
                  <DialogDescription>
                    Send grades to your Student Information System (Skyward, Frontline, Clever, etc.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {configuredSisConnections.length === 0 ? (
                    <div className="text-center py-4">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">No SIS connections configured</p>
                      <Button variant="outline" onClick={() => window.location.href = "/sis-integration"}>
                        Configure SIS Integration
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>Select SIS Connection</Label>
                        <Select value={selectedSisConnection} onValueChange={setSelectedSisConnection}>
                          <SelectTrigger data-testid="select-sis-connection">
                            <SelectValue placeholder="Choose a connection" />
                          </SelectTrigger>
                          <SelectContent>
                            {configuredSisConnections.map((conn) => (
                              <SelectItem key={conn.id} value={conn.id}>
                                {conn.name || conn.provider}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Export Summary</p>
                        <p className="text-muted-foreground">
                          {grades.length} grade entries for {studentsInClass.length} students in {selectedClass?.name}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {configuredSisConnections.length > 0 && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSisExportOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExportToSis}
                      disabled={!selectedSisConnection || exportToSisMutation.isPending}
                      data-testid="button-confirm-sis-export"
                    >
                      {exportToSisMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Export Grades
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Grading System Dialog */}
          <Dialog open={isGradingSystemOpen} onOpenChange={setIsGradingSystemOpen}>
            <DialogContent className="sm:max-w-lg" data-testid="dialog-grading-system">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Grading System</DialogTitle>
                <DialogDescription>
                  Choose the grading scale for this class and set the weight for each grade type
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Grading Scale</Label>
                  <Select value={gradingSystemDraft.gradingSystem} onValueChange={(v) => setGradingSystemDraft(d => ({ ...d, gradingSystem: v }))}>
                    <SelectTrigger data-testid="select-grading-system">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADING_SYSTEMS.map(s => (
                        <SelectItem key={s.id} value={s.id} data-testid={`option-grading-system-${s.id}`}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {GRADING_SYSTEMS.find(s => s.id === gradingSystemDraft.gradingSystem)?.description}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label className="font-semibold">Grade Weight Percentages</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Customize how much each grade type counts toward the final grade. Must add up to 100%.</p>
                  </div>
                  {[
                    { key: "majorWeight" as const, label: "Major", color: "text-lys-red" },
                    { key: "minorWeight" as const, label: "Minor", color: "text-teal-600" },
                    { key: "otherWeight" as const, label: "Other / Daily", color: "text-muted-foreground" },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Label className={`w-24 shrink-0 ${color}`}>{label}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={gradingSystemDraft[key]}
                        onChange={(e) => setGradingSystemDraft(d => ({ ...d, [key]: parseInt(e.target.value) || 0 }))}
                        className="w-24"
                        data-testid={`input-${key}`}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  ))}
                  {gradingSystemDraft.majorWeight + gradingSystemDraft.minorWeight + gradingSystemDraft.otherWeight !== 100 && (
                    <p className="text-xs text-destructive" data-testid="text-weight-warning">
                      Weights must add up to 100% (currently {gradingSystemDraft.majorWeight + gradingSystemDraft.minorWeight + gradingSystemDraft.otherWeight}%)
                    </p>
                  )}
                </div>

                <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Texas example (default):</p>
                  <p>Major 50% · Minor 35% · Other 15%</p>
                  <p>You can adjust to match your district or country's policy.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGradingSystemOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => saveGradingSettingsMutation.mutate(gradingSystemDraft)}
                  disabled={
                    saveGradingSettingsMutation.isPending ||
                    gradingSystemDraft.majorWeight + gradingSystemDraft.minorWeight + gradingSystemDraft.otherWeight !== 100
                  }
                  data-testid="button-save-grading-system"
                >
                  {saveGradingSettingsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="grades" data-testid="tab-grades">All Grades</TabsTrigger>
              <TabsTrigger value="by-student" data-testid="tab-by-student">By Student</TabsTrigger>
              <TabsTrigger value="career-alignment" data-testid="tab-career-alignment">
                <Briefcase className="h-4 w-4 mr-1" />
                Career Alignment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Entries</CardTitle>
                  <CardDescription>
                    All grade entries for {selectedClass?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gradesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : grades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No grades recorded yet. Click "Add Grade" to get started.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Assignment</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">%</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grades.map((grade) => (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">
                                {getStudentName(grade.studentId)}
                              </TableCell>
                              <TableCell>{grade.title}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{getCategoryName(grade.categoryId)}</Badge>
                              </TableCell>
                              <TableCell>
                                {(grade as any).gradeWeight ? (
                                  <Badge variant="outline" className={GRADE_WEIGHT_COLORS[(grade as any).gradeWeight]}>
                                    {GRADE_WEIGHT_LABELS[(grade as any).gradeWeight]}
                                  </Badge>
                                ) : <span className="text-muted-foreground text-xs">—</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                {editingGrade?.id === grade.id ? (
                                  <Input
                                    type="number"
                                    value={editingGrade.pointsEarned ?? ""}
                                    onChange={(e) => setEditingGrade({ ...editingGrade, pointsEarned: parseInt(e.target.value) || 0 })}
                                    className="w-20 text-right"
                                    data-testid="input-edit-score"
                                  />
                                ) : (
                                  `${grade.pointsEarned ?? "-"} / ${grade.pointsPossible}`
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {grade.percentage !== null ? `${grade.percentage}%` : "-"}
                              </TableCell>
                              <TableCell>
                                {grade.letterGrade && (
                                  <Badge className={`${getLetterGradeColor(grade.letterGrade)} text-white`}>
                                    {grade.letterGrade}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {editingGrade?.id === grade.id ? (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        updateGradeMutation.mutate({
                                          id: grade.id,
                                          updates: { pointsEarned: editingGrade.pointsEarned },
                                        });
                                      }}
                                      data-testid="button-save-edit"
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setEditingGrade(null)}
                                      data-testid="button-cancel-edit"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setEditingGrade(grade)}
                                      data-testid={`button-edit-grade-${grade.id}`}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteGradeMutation.mutate(grade.id)}
                                      data-testid={`button-delete-grade-${grade.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="by-student" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Averages</CardTitle>
                  <CardDescription>
                    Click a student's name to see their individual grades and add notes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {studentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : studentsInClass.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No students enrolled in this class yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Graded</TableHead>
                            <TableHead className="text-right">Average</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentsInClass.map((student) => {
                            const studentGrades = grades.filter((g) => g.studentId === student.id);
                            const avg = calculateStudentAverage(student.id);
                            const letterGrade = avgToLetter(avg);

                            return (
                              <TableRow
                                key={student.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setDrillStudent(student)}
                                data-testid={`row-student-${student.id}`}
                              >
                                <TableCell className="font-medium text-primary hover:underline">
                                  {student.firstName} {student.lastName}
                                </TableCell>
                                <TableCell className="text-right">{studentGrades.length}</TableCell>
                                <TableCell className="text-right">
                                  {avg !== null ? `${avg}%` : "-"}
                                </TableCell>
                                <TableCell>
                                  {letterGrade && (
                                    <Badge className={`${getLetterGradeColor(letterGrade)} text-white`}>
                                      {letterGrade}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <p className="text-xs text-muted-foreground mt-3">Click a student's name to see their assignment details and add notes.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="career-alignment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Career Alignment Insights
                  </CardTitle>
                  <CardDescription>
                    See how grades in {selectedClass?.name} align with saved career interests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">This class relates to:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedClass?.careerFields as string[] || []).length > 0 ? (
                        (selectedClass?.careerFields as string[]).map((fieldId) => {
                          const field = CAREER_FIELDS.find((f) => f.id === fieldId);
                          return field ? (
                            <Badge key={fieldId} variant="secondary">
                              {field.name}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No career fields assigned to this class yet. Educators can assign career fields in class settings.
                        </p>
                      )}
                    </div>
                  </div>

                  {studentsInClass.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No students enrolled in this class.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Student Career Readiness</h4>
                        <p className="text-xs text-muted-foreground">
                          Based on grade performance in career-aligned skills
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Current Grade</TableHead>
                              <TableHead>Career Readiness</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentsInClass.map((student) => {
                              const avg = calculateStudentAverage(student.id);
                              const letterGrade = avgToLetter(avg);
                              const readinessScore = avg !== null ? avg : 0;
                              const readinessStatus = avg !== null
                                ? avg >= 90 ? "Excellent" : avg >= 80 ? "Good" : avg >= 70 ? "Developing" : "Needs Support"
                                : "No Data";
                              const statusColor = avg !== null
                                ? avg >= 90 ? "bg-green-500" : avg >= 80 ? "bg-teal-500" : avg >= 70 ? "bg-yellow-500" : "bg-red-500"
                                : "bg-gray-400";

                              return (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">
                                    {student.firstName} {student.lastName}
                                  </TableCell>
                                  <TableCell>
                                    {letterGrade ? (
                                      <Badge className={`${getLetterGradeColor(letterGrade)} text-white`}>
                                        {letterGrade}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">No grades</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2 min-w-32">
                                      <Progress value={readinessScore} className="h-2" />
                                      <span className="text-sm text-muted-foreground w-10">
                                        {readinessScore.toFixed(0)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${statusColor} text-white`}>
                                      {readinessStatus}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {(selectedClass?.careerFields as string[] || []).length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium text-sm">Performance by Career Field</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(selectedClass?.careerFields as string[]).map((fieldId) => {
                          const field = CAREER_FIELDS.find((f) => f.id === fieldId);
                          if (!field) return null;
                          const classAvg = studentsInClass.reduce((sum, student) => {
                            const avg = calculateStudentAverage(student.id);
                            return sum + (avg || 0);
                          }, 0) / (studentsInClass.length || 1);

                          return (
                            <Card key={fieldId}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{field.name}</span>
                                  <Badge variant={classAvg >= 80 ? "default" : classAvg >= 70 ? "secondary" : "destructive"}>
                                    {classAvg.toFixed(0)}%
                                  </Badge>
                                </div>
                                <Progress value={classAvg} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Class average in {field.name.toLowerCase()} skills
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
