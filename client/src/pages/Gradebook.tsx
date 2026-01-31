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
  Settings
} from "lucide-react";
import type { Class, Student, StudentGrade, GradeCategory, InsertStudentGrade, InsertGradeCategory } from "@shared/schema";

const LETTER_GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-600",
  "A": "bg-green-500",
  "A-": "bg-green-400",
  "B+": "bg-blue-500",
  "B": "bg-blue-400",
  "B-": "bg-blue-300",
  "C+": "bg-yellow-500",
  "C": "bg-yellow-400",
  "C-": "bg-yellow-300",
  "D+": "bg-orange-500",
  "D": "bg-orange-400",
  "D-": "bg-orange-300",
  "F": "bg-red-500",
};

export default function Gradebook() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null);
  const [activeTab, setActiveTab] = useState("grades");

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
    const studentGrades = grades.filter((g) => g.studentId === studentId && g.percentage !== null);
    if (studentGrades.length === 0) return null;
    const sum = studentGrades.reduce((acc, g) => acc + (g.percentage || 0), 0);
    return Math.round(sum / studentGrades.length);
  };

  const getLetterGradeColor = (letterGrade: string | null) => {
    if (!letterGrade) return "bg-muted";
    return LETTER_GRADE_COLORS[letterGrade] || "bg-muted";
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

        <div className="flex items-center gap-2">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[200px]" data-testid="select-class">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    ? Math.round(grades.filter(g => g.percentage).reduce((acc, g) => acc + (g.percentage || 0), 0) / grades.filter(g => g.percentage).length) + "%"
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={isAddGradeOpen} onOpenChange={setIsAddGradeOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-grade">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grade
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                  <div>
                    <Label htmlFor="grade-category">Category (Optional)</Label>
                    <Select
                      value={newGrade.categoryId || ""}
                      onValueChange={(v) => setNewGrade({ ...newGrade, categoryId: v || undefined })}
                    >
                      <SelectTrigger data-testid="select-grade-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.weight}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            <Button variant="outline" data-testid="button-share-sis">
              <Share2 className="h-4 w-4 mr-2" />
              Share to SIS
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="grades" data-testid="tab-grades">All Grades</TabsTrigger>
              <TabsTrigger value="by-student" data-testid="tab-by-student">By Student</TabsTrigger>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="by-student" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Averages</CardTitle>
                  <CardDescription>
                    Overall grades by student for {selectedClass?.name}
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead className="text-right">Assignments Graded</TableHead>
                          <TableHead className="text-right">Average</TableHead>
                          <TableHead>Current Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsInClass.map((student) => {
                          const studentGrades = grades.filter((g) => g.studentId === student.id);
                          const avg = calculateStudentAverage(student.id);
                          const letterGrade = avg !== null
                            ? avg >= 97 ? "A+" : avg >= 93 ? "A" : avg >= 90 ? "A-"
                            : avg >= 87 ? "B+" : avg >= 83 ? "B" : avg >= 80 ? "B-"
                            : avg >= 77 ? "C+" : avg >= 73 ? "C" : avg >= 70 ? "C-"
                            : avg >= 67 ? "D+" : avg >= 63 ? "D" : avg >= 60 ? "D-" : "F"
                            : null;

                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
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
