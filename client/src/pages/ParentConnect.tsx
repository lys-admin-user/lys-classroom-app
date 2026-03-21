import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  UserPlus,
  Heart,
  Loader2,
  LogIn,
  GraduationCap,
  Link2,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const MAGIC_TOKEN_STORAGE_KEY = "lys_pending_magic_token";

export default function ParentConnect() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [alreadyLinked, setAlreadyLinked] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const magicToken = params.get("magic");

  useEffect(() => {
    if (magicToken) {
      localStorage.setItem(MAGIC_TOKEN_STORAGE_KEY, magicToken);
    }
  }, [magicToken]);

  const storedToken = magicToken || localStorage.getItem(MAGIC_TOKEN_STORAGE_KEY) || "";

  const { data: inviteData, isLoading: inviteLoading, error: inviteError } = useQuery<any>({
    queryKey: ["/api/parent-portal/magic-accept", storedToken],
    queryFn: async () => {
      if (!storedToken) throw new Error("No token");
      const res = await fetch(`/api/parent-portal/magic-accept/${storedToken}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Invalid or expired link");
      }
      return res.json();
    },
    enabled: !!storedToken,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/parent-portal/invitations/accept", {
        token: storedToken,
      });
      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem(MAGIC_TOKEN_STORAGE_KEY);
      setAccepted(true);
      toast({ title: "Connected!", description: "You're now connected to your child's LYS account." });
    },
    onError: (err: any) => {
      if (err?.message?.includes("already")) {
        setAlreadyLinked(true);
      } else {
        toast({
          title: "Could not accept invitation",
          description: err?.message || "The link may have already been used or expired.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSignIn = () => {
    window.location.href = `/api/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  };

  if (inviteLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-2">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!storedToken || inviteError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="font-oswald text-xl">Link Not Valid</CardTitle>
            <CardDescription>
              {inviteError instanceof Error
                ? inviteError.message
                : "This parent invitation link is invalid or has expired. Please ask your teacher or school to send a new one."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
            <CardTitle className="font-oswald text-2xl text-green-600">You're Connected!</CardTitle>
            <CardDescription className="text-base">
              You now have access to your child's LYS progress, career readiness insights, and school updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => setLocation("/parent-portal")}>
              <Heart className="h-4 w-4 mr-2" />
              Open Parent Portal
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyLinked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-14 w-14 text-lys-teal mx-auto mb-3" />
            <CardTitle className="font-oswald text-xl">Already Connected</CardTitle>
            <CardDescription>
              You're already linked to this student's account. Head to your Parent Portal to view their progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setLocation("/parent-portal")}>
              Open Parent Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const relationshipLabel = inviteData?.relationship
    ? inviteData.relationship.charAt(0).toUpperCase() + inviteData.relationship.slice(1)
    : "Parent / Guardian";

  const inviterLabel = inviteData?.inviterType === "educator"
    ? "a teacher"
    : inviteData?.inviterType === "campus_admin"
    ? "a school administrator"
    : inviteData?.inviterType === "student"
    ? "your child"
    : inviteData?.inviterType === "parent"
    ? "another guardian"
    : "your school";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Header branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lys-yellow/20 mb-3">
            <Link2 className="h-8 w-8 text-lys-yellow" />
          </div>
          <h1 className="font-oswald text-3xl font-bold">LYS Family Connect</h1>
          <p className="text-muted-foreground text-sm mt-1">Laddering Your Success — together</p>
        </div>

        {/* Invitation card */}
        <Card className="border-2 border-lys-yellow/40">
          <CardHeader className="text-center pb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-lys-teal" />
              <Badge variant="outline" className="text-xs">{relationshipLabel}</Badge>
            </div>
            <CardTitle className="font-oswald text-xl">You've been invited</CardTitle>
            <CardDescription>
              You were invited by {inviterLabel} to connect to a student's LYS account. Once connected, you can track their Be-Know-Do journey, view progress, and stay informed about their education.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">

            {/* What you get */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">As a connected parent you can:</p>
              {[
                "View your child's Be-Know-Do progress",
                "Read teacher announcements",
                "Track goals and milestones",
                "Browse career exploration activity",
                "View their digital portfolio",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {!isAuthenticated ? (
              <div className="space-y-3 pt-1">
                <p className="text-sm text-center text-muted-foreground">
                  Sign in or create a free LYS account to accept this invitation.
                </p>
                <Button className="w-full" onClick={handleSignIn} data-testid="button-signin-to-connect">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In / Create Account
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your invitation link will still be here after you sign in.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-sm text-center text-muted-foreground">
                  Signed in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
                </p>
                <Button
                  className="w-full"
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  data-testid="button-accept-connection"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Accept & Connect
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Not you?{" "}
                  <button
                    className="underline hover:text-foreground transition-colors"
                    onClick={handleSignIn}
                  >
                    Sign in with a different account
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          LYS is free for families. Your child's school uses LYS to support their academic journey.
        </p>
      </div>
    </div>
  );
}
