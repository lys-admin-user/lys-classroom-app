import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Pencil, Trash2, Award, GraduationCap, Users, TrendingUp, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock,
  Trophy, Target, Star, School, UserCheck
} from "lucide-react";
import type { SystemAchievement, InsertSystemAchievement, StudentAchievement } from "@shared/schema";

const ACHIEVEMENT_CATEGORIES = [
  { value: "academic", label: "Academic", icon: GraduationCap },
  { value: "skill", label: "Skill Mastery", icon: Target },
  { value: "behavior", label: "Behavior", icon: UserCheck },
  { value: "extracurricular", label: "Extracurricular", icon: Trophy },
  { value: "career", label: "Career Readiness", icon: TrendingUp },
  { value: "bkd", label: "Be-Know-Do", icon: Star },
  { value: "custom", label: "Custom", icon: Award },
] as const;

const MATRICULATION_EVENT_TYPES = [
  { value: "enrollment", label: "Enrollment", color: "bg-green-500" },
  { value: "grade_promotion", label: "Grade Promotion", color: "bg-blue-500" },
  { value: "grade_retention", label: "Grade Retention", color: "bg-yellow-500" },
  { value: "transfer_in", label: "Transfer In", color: "bg-purple-500" },
  { value: "transfer_out", label: "Transfer Out", color: "bg-orange-500" },
  { value: "withdrawal", label: "Withdrawal", color: "bg-red-500" },
  { value: "graduation", label: "Graduation", color: "bg-emerald-500" },
  { value: "re_enrollment", label: "Re-enrollment", color: "bg-cyan-500" },
  { value: "status_change", label: "Status Change", color: "bg-gray-500" },
] as const;

type MatriculationStats = {
  totalEnrollments: number;
  totalGraduations: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  totalWithdrawals: number;
  gradePromotions: number;
  gradeRetentions: number;
  byGradeLevel: { gradeLevel: string; count: number }[];
  byAcademicYear: { academicYear: string; enrollments: number; graduations: number }[];
};

type AchievementStats = {
  totalAchievementsAwarded: number;
  totalStudentsWithAchievements: number;
  totalPendingVerification: number;
  byCategory: { category: string; count: number }[];
  mostAwardedAchievements: { achievementId: string; name: string; count: number }[];
  recentAwards: { achievementId: string; studentId: string; earnedAt: string }[];
};

function CategoryIcon({ category }: { category: string }) {
  const cat = ACHIEVEMENT_CATEGORIES.find(c => c.value === category);
  const Icon = cat?.icon || Award;
  return <Icon className="w-4 h-4" />;
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: { 
  title: string; 
  value: number | string; 
  icon: any;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementForm({
  achievement,
  onSubmit,
  onCancel,
  isLoading,
}: {
  achievement?: SystemAchievement;
  onSubmit: (data: Partial<InsertSystemAchievement>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: "academic" | "skill" | "behavior" | "extracurricular" | "career" | "bkd" | "custom";
    badgeImageUrl: string;
    iconName: string;
    color: string;
    pointValue: number;
    isSystemWide: boolean;
    isActive: boolean;
    criteria: { type: "automatic" | "manual" };
  }>({
    name: achievement?.name || "",
    description: achievement?.description || "",
    category: achievement?.category || "academic",
    badgeImageUrl: achievement?.badgeImageUrl || "",
    iconName: achievement?.iconName || "",
    color: achievement?.color || "#4f46e5",
    pointValue: achievement?.pointValue || 0,
    isSystemWide: achievement?.isSystemWide ?? true,
    isActive: achievement?.isActive ?? true,
    criteria: achievement?.criteria || { type: "manual" as const },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Achievement Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Honor Roll"
            required
            data-testid="input-achievement-name"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the achievement criteria..."
            data-testid="input-achievement-description"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger data-testid="select-achievement-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACHIEVEMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pointValue">Point Value</Label>
          <Input
            id="pointValue"
            type="number"
            value={formData.pointValue}
            onChange={(e) => setFormData({ ...formData, pointValue: parseInt(e.target.value) || 0 })}
            min={0}
            data-testid="input-achievement-points"
          />
        </div>

        <div>
          <Label htmlFor="color">Badge Color</Label>
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="h-10"
            data-testid="input-achievement-color"
          />
        </div>

        <div>
          <Label htmlFor="iconName">Icon Name (Lucide)</Label>
          <Input
            id="iconName"
            value={formData.iconName}
            onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
            placeholder="e.g., trophy, star, award"
            data-testid="input-achievement-icon"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="isSystemWide"
            checked={formData.isSystemWide}
            onCheckedChange={(checked) => setFormData({ ...formData, isSystemWide: checked })}
            data-testid="switch-system-wide"
          />
          <Label htmlFor="isSystemWide">System-Wide</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-active"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="button-save-achievement">
          {isLoading ? "Saving..." : achievement ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function MatriculationAchievementAdmin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<SystemAchievement | undefined>();
  const [selectedYear, setSelectedYear] = useState("");

  const { data: adminCheck, isLoading: checkLoading } = useQuery<{ isSiteAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const isAdmin = adminCheck?.isSiteAdmin;

  const effectiveYear = selectedYear && selectedYear !== "__all__" ? selectedYear : "";

  const { data: matriculationStats, isLoading: matriculationLoading } = useQuery<MatriculationStats>({
    queryKey: ["/api/admin/matriculation/stats", effectiveYear],
    queryFn: async () => {
      const params = effectiveYear ? `?academicYear=${effectiveYear}` : "";
      const res = await fetch(`/api/admin/matriculation/stats${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch matriculation stats");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: achievementStats, isLoading: achievementLoading } = useQuery<AchievementStats>({
    queryKey: ["/api/admin/achievements/stats", effectiveYear],
    queryFn: async () => {
      const params = effectiveYear ? `?academicYear=${effectiveYear}` : "";
      const res = await fetch(`/api/admin/achievements/stats${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch achievement stats");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<SystemAchievement[]>({
    queryKey: ["/api/achievements"],
    enabled: isAdmin,
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (data: Partial<InsertSystemAchievement>) => {
      return apiRequest("POST", "/api/admin/achievements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements/stats"] });
      setShowAchievementDialog(false);
      toast({ title: "Achievement created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create achievement", variant: "destructive" });
    },
  });

  const updateAchievementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSystemAchievement> }) => {
      return apiRequest("PATCH", `/api/admin/achievements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setShowAchievementDialog(false);
      setEditingAchievement(undefined);
      toast({ title: "Achievement updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update achievement", variant: "destructive" });
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements/stats"] });
      toast({ title: "Achievement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete achievement", variant: "destructive" });
    },
  });

  if (authLoading || checkLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldOff className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You need system or site admin privileges to access this page.</p>
      </div>
    );
  }

  const handleEditAchievement = (achievement: SystemAchievement) => {
    setEditingAchievement(achievement);
    setShowAchievementDialog(true);
  };

  const handleSubmitAchievement = (data: Partial<InsertSystemAchievement>) => {
    if (editingAchievement) {
      updateAchievementMutation.mutate({ id: editingAchievement.id, data });
    } else {
      createAchievementMutation.mutate(data);
    }
  };

  const academicYears = ["2025-2026", "2024-2025", "2023-2024"];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Matriculation & Achievements</h1>
          <p className="text-muted-foreground">System-level tracking of student progress and achievements</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40" data-testid="select-academic-year">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="matriculation" data-testid="tab-matriculation">Matriculation</TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">Achievements</TabsTrigger>
          <TabsTrigger value="manage" data-testid="tab-manage">Manage Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Enrollments"
              value={matriculationStats?.totalEnrollments || 0}
              icon={Users}
            />
            <StatCard
              title="Graduations"
              value={matriculationStats?.totalGraduations || 0}
              icon={GraduationCap}
            />
            <StatCard
              title="Achievements Awarded"
              value={achievementStats?.totalAchievementsAwarded || 0}
              icon={Award}
            />
            <StatCard
              title="Students with Achievements"
              value={achievementStats?.totalStudentsWithAchievements || 0}
              icon={Trophy}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Matriculation Events</CardTitle>
                <CardDescription>Student enrollment and progression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Grade Promotions</span>
                    <Badge variant="secondary">{matriculationStats?.gradePromotions || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Grade Retentions</span>
                    <Badge variant="secondary">{matriculationStats?.gradeRetentions || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Transfers In</span>
                    <Badge variant="secondary">{matriculationStats?.totalTransfersIn || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Transfers Out</span>
                    <Badge variant="secondary">{matriculationStats?.totalTransfersOut || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements by Category</CardTitle>
                <CardDescription>Distribution of awarded achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievementStats?.byCategory?.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat.category} />
                        <span className="capitalize">{cat.category}</span>
                      </div>
                      <Badge>{cat.count}</Badge>
                    </div>
                  )) || <p className="text-muted-foreground">No data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matriculation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Enrollments" value={matriculationStats?.totalEnrollments || 0} icon={Users} />
            <StatCard title="Graduations" value={matriculationStats?.totalGraduations || 0} icon={GraduationCap} />
            <StatCard title="Promotions" value={matriculationStats?.gradePromotions || 0} icon={ArrowUpRight} />
            <StatCard title="Transfers In" value={matriculationStats?.totalTransfersIn || 0} icon={School} />
            <StatCard title="Withdrawals" value={matriculationStats?.totalWithdrawals || 0} icon={XCircle} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>By Grade Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {matriculationStats?.byGradeLevel?.map((grade) => (
                  <div key={grade.gradeLevel} className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{grade.count}</p>
                    <p className="text-sm text-muted-foreground">{grade.gradeLevel}</p>
                  </div>
                )) || <p className="text-muted-foreground col-span-full">No grade level data available</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Academic Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matriculationStats?.byAcademicYear?.map((year) => (
                  <div key={year.academicYear} className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">{year.academicYear}</span>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{year.enrollments}</p>
                        <p className="text-xs text-muted-foreground">Enrollments</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{year.graduations}</p>
                        <p className="text-xs text-muted-foreground">Graduations</p>
                      </div>
                    </div>
                  </div>
                )) || <p className="text-muted-foreground">No academic year data available</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total Awarded" value={achievementStats?.totalAchievementsAwarded || 0} icon={Award} />
            <StatCard title="Students Recognized" value={achievementStats?.totalStudentsWithAchievements || 0} icon={Users} />
            <StatCard title="Pending Verification" value={achievementStats?.totalPendingVerification || 0} icon={Clock} />
            <StatCard title="Achievement Types" value={achievements.length} icon={Trophy} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Awarded Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievementStats?.mostAwardedAchievements?.slice(0, 5).map((ach, idx) => (
                    <div key={ach.achievementId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                        <span>{ach.name}</span>
                      </div>
                      <Badge>{ach.count} awards</Badge>
                    </div>
                  )) || <p className="text-muted-foreground">No awards data available</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Awards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievementStats?.recentAwards?.slice(0, 5).map((award, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm">Student: {award.studentId.substring(0, 8)}...</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(award.earnedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )) || <p className="text-muted-foreground">No recent awards</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Achievements</h2>
            <Button
              onClick={() => {
                setEditingAchievement(undefined);
                setShowAchievementDialog(true);
              }}
              data-testid="button-add-achievement"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Achievement
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={!achievement.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: achievement.color || "#4f46e5" }}
                      >
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{achievement.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          <CategoryIcon category={achievement.category} />
                          <span className="ml-1 capitalize">{achievement.category}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditAchievement(achievement)}
                        data-testid={`button-edit-achievement-${achievement.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteAchievementMutation.mutate(achievement.id)}
                        data-testid={`button-delete-achievement-${achievement.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {achievement.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">{achievement.pointValue} pts</Badge>
                    {achievement.isSystemWide && <Badge variant="outline">System-wide</Badge>}
                    {!achievement.isActive && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {achievements.length === 0 && !achievementsLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No achievements defined</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-2">
                  Create system-wide achievements to recognize student accomplishments.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowAchievementDialog(true)}
                  data-testid="button-add-first-achievement"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Achievement
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAchievementDialog} onOpenChange={setShowAchievementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement ? "Edit Achievement" : "Create Achievement"}
            </DialogTitle>
            <DialogDescription>
              Define a system-wide achievement that can be awarded to students.
            </DialogDescription>
          </DialogHeader>
          <AchievementForm
            achievement={editingAchievement}
            onSubmit={handleSubmitAchievement}
            onCancel={() => {
              setShowAchievementDialog(false);
              setEditingAchievement(undefined);
            }}
            isLoading={createAchievementMutation.isPending || updateAchievementMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
