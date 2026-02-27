import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

function generateFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("LYS-fp", 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth?.toString() || "",
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "",
    canvasData.slice(-50),
  ];

  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "fp_" + Math.abs(hash).toString(36);
}

export interface TrialStatus {
  hasTrial: boolean;
  isActive: boolean;
  daysRemaining?: number;
  totalDays?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  trialId?: string;
  canStartTrial?: boolean;
  trialsUsed?: number;
  trialsAllowed?: number;
  nextEligibleDate?: string | null;
}

export function useTrial() {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    setFingerprint(generateFingerprint());
  }, []);

  const { data: trialStatus, isLoading } = useQuery<TrialStatus>({
    queryKey: ["/api/trial/status", fingerprint],
    queryFn: async () => {
      const params = fingerprint ? `?fingerprint=${fingerprint}` : "";
      const res = await fetch(`/api/trial/status${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check trial status");
      return res.json();
    },
    enabled: !!fingerprint,
    refetchInterval: 60000,
  });

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const metadata = {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
      };
      const res = await apiRequest("POST", "/api/trial/start", { fingerprint, metadata });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial/status"] });
    },
  });

  const bindTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trial/bind", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial/status"] });
    },
  });

  return {
    trialStatus: trialStatus || { hasTrial: false, isActive: false },
    isLoading,
    isTrialActive: trialStatus?.isActive || false,
    daysRemaining: trialStatus?.daysRemaining || 0,
    canStartTrial: trialStatus?.canStartTrial || false,
    startTrial: startTrialMutation.mutate,
    isStartingTrial: startTrialMutation.isPending,
    startTrialError: startTrialMutation.error,
    bindTrial: bindTrialMutation.mutate,
    fingerprint,
  };
}
