import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  User,
  Building2,
  AlertTriangle,
  Shield
} from "lucide-react";
import type { StudentTransferRequest, Student } from "@shared/schema";

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_campus: { label: "Pending Campus Approval", variant: "secondary" },
  pending_district: { label: "Pending District Approval", variant: "secondary" },
  pending_system_admin: { label: "Pending System Admin", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

export default function TransferApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<StudentTransferRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const userRole = (user?.role || "") as string;
  
  const canViewLevel = (level: string) => {
    if (level === "campus") return ["campus_admin", "district_admin", "site_admin"].includes(userRole);
    if (level === "district") return ["district_admin", "site_admin"].includes(userRole);
    if (level === "system_admin") return userRole === "site_admin";
    return false;
  };

  const { data: campusPending = [], isLoading: loadingCampus } = useQuery<StudentTransferRequest[]>({
    queryKey: ["/api/transfers/pending/campus"],
    enabled: canViewLevel("campus"),
  });

  const { data: districtPending = [], isLoading: loadingDistrict } = useQuery<StudentTransferRequest[]>({
    queryKey: ["/api/transfers/pending/district"],
    enabled: canViewLevel("district"),
  });

  const { data: systemAdminPending = [], isLoading: loadingSystem } = useQuery<StudentTransferRequest[]>({
    queryKey: ["/api/transfers/pending/system_admin"],
    enabled: canViewLevel("system_admin"),
  });

  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const getStudent = (studentId: string) => allStudents.find(s => s.id === studentId);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/transfers/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending/campus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending/district"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending/system_admin"] });
      toast({ title: "Transfer approved", description: "The transfer has been moved to the next approval level." });
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: "Failed to approve transfer", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/transfers/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending/campus"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending/district"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/pending/system_admin"] });
      toast({ title: "Transfer rejected" });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: "Failed to reject transfer", variant: "destructive" });
    },
  });

  const renderTransferCard = (request: StudentTransferRequest, level: "campus" | "district" | "system_admin") => {
    const student = getStudent(request.studentId);
    const statusInfo = STATUS_BADGES[request.status] || { label: request.status, variant: "outline" as const };

    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {student ? `${student.firstName} ${student.lastName}` : "Unknown Student"}
            </CardTitle>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <CardDescription>
            {request.transferType === "organization" ? "Organization Transfer" : "Educator Transfer"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Student ID:</span>
                <span className="ml-2">{student?.studentId || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Grade:</span>
                <span className="ml-2">{student?.gradeLevel || "N/A"}</span>
              </div>
            </div>

            {request.reason && (
              <div className="text-sm">
                <span className="text-muted-foreground">Reason:</span>
                <p className="mt-1">{request.reason}</p>
              </div>
            )}

            {request.notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes:</span>
                <p className="mt-1">{request.notes}</p>
              </div>
            )}

            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-2">Approval Progress:</p>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${request.campusApprovedAt ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {request.campusApprovedAt ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  <span className="text-xs">Campus</span>
                </div>
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${request.districtApprovedAt ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {request.districtApprovedAt ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  <span className="text-xs">District</span>
                </div>
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${request.systemAdminApprovedAt ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {request.systemAdminApprovedAt ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  <span className="text-xs">System</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(request.id)}
                disabled={approveMutation.isPending}
                data-testid={`button-approve-${request.id}`}
              >
                {approveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedRequest(request);
                  setIsRejectDialogOpen(true);
                }}
                data-testid={`button-reject-${request.id}`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!canViewLevel("campus")) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need campus admin, district admin, or system admin permissions to view transfer approvals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <ArrowRightLeft className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Transfer Approvals</h1>
          <p className="text-muted-foreground">Review and approve student transfer requests</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md mb-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Triple Confirmation Workflow</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Student transfers between organizations require three levels of approval:
              Campus → District → System Admin. Each level must approve before passing to the next.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={canViewLevel("campus") ? "campus" : "district"}>
        <TabsList className="grid w-full grid-cols-3">
          {canViewLevel("campus") && (
            <TabsTrigger value="campus" className="relative" data-testid="tab-campus">
              Campus
              {campusPending.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{campusPending.length}</Badge>
              )}
            </TabsTrigger>
          )}
          {canViewLevel("district") && (
            <TabsTrigger value="district" data-testid="tab-district">
              District
              {districtPending.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{districtPending.length}</Badge>
              )}
            </TabsTrigger>
          )}
          {canViewLevel("system_admin") && (
            <TabsTrigger value="system_admin" data-testid="tab-system">
              System Admin
              {systemAdminPending.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{systemAdminPending.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {canViewLevel("campus") && (
          <TabsContent value="campus" className="mt-4">
            {loadingCampus ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : campusPending.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Pending Campus Approvals</p>
                  <p className="text-sm text-muted-foreground">All transfer requests at the campus level have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              campusPending.map(request => renderTransferCard(request, "campus"))
            )}
          </TabsContent>
        )}

        {canViewLevel("district") && (
          <TabsContent value="district" className="mt-4">
            {loadingDistrict ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : districtPending.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Pending District Approvals</p>
                  <p className="text-sm text-muted-foreground">All transfer requests at the district level have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              districtPending.map(request => renderTransferCard(request, "district"))
            )}
          </TabsContent>
        )}

        {canViewLevel("system_admin") && (
          <TabsContent value="system_admin" className="mt-4">
            {loadingSystem ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : systemAdminPending.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Pending System Admin Approvals</p>
                  <p className="text-sm text-muted-foreground">All transfer requests at the system admin level have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              systemAdminPending.map(request => renderTransferCard(request, "system_admin"))
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsRejectDialogOpen(false);
          setRejectionReason("");
          setSelectedRequest(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Transfer Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transfer request. The requester will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                data-testid="input-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason });
                }
              }}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
