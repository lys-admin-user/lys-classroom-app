import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface MfaStatus {
  enabled: boolean;
  verifiedFresh: boolean;
  encryptionConfigured: boolean;
}

export interface MfaEnrollResponse {
  otpauthUri: string;
  qrDataUrl: string;
  secret: string;
}

export function useMfaStatus(enabled = true) {
  return useQuery<MfaStatus>({
    queryKey: ["/api/mfa/status"],
    enabled,
  });
}

export function invalidateMfaStatus() {
  queryClient.invalidateQueries({ queryKey: ["/api/mfa/status"] });
}

export function useMfaEnroll() {
  return useMutation<MfaEnrollResponse, Error, void>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mfa/enroll");
      return res.json();
    },
  });
}

export function useMfaActivate() {
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/mfa/activate", { token });
      return res.json();
    },
    onSuccess: () => invalidateMfaStatus(),
  });
}

export function useMfaVerify() {
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/mfa/verify", { token });
      return res.json();
    },
    onSuccess: () => invalidateMfaStatus(),
  });
}

export function useMfaDisable() {
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/mfa/disable", { token });
      return res.json();
    },
    onSuccess: () => invalidateMfaStatus(),
  });
}

// Detect the structured 403 response emitted by requireFreshMfa / checkFreshMfa.
export function isMfaRequiredError(err: unknown): boolean {
  return !!(err && typeof err === "object" && (err as any).mfaRequired === true);
}

export function isMfaEnrollmentRequiredError(err: unknown): boolean {
  return !!(err && typeof err === "object" && (err as any).enrollmentRequired === true);
}
