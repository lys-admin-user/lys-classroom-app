import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { getFingerprint } from "@/lib/fingerprint";

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
    setFingerprint(getFingerprint());
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
    // Optional captchaToken: only needed for ANONYMOUS trial starts once
    // Turnstile keys are configured; authenticated starts skip captcha.
    mutationFn: async (captchaToken?: string) => {
      const metadata = {
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
      };
      const res = await apiRequest("POST", "/api/trial/start", {
        fingerprint,
        metadata,
        captchaToken: captchaToken || undefined,
      });
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
    startTrial: (captchaToken?: string) => startTrialMutation.mutate(captchaToken),
    isStartingTrial: startTrialMutation.isPending,
    startTrialError: startTrialMutation.error,
    bindTrial: bindTrialMutation.mutate,
    fingerprint,
  };
}
