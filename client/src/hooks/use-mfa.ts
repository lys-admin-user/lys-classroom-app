import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface MfaMethods {
  totp: boolean;
  email: boolean;
}

export interface MfaStatus {
  enabled: boolean;
  verifiedFresh: boolean;
  encryptionConfigured: boolean;
  methods?: MfaMethods;
  emailConfigured?: boolean;
  // True when this user (educator+) must complete a second factor before
  // mutating, and hasn't yet this session. Drives the login-MFA challenge.
  loginMfaRequired?: boolean;
}

export interface MfaEnrollResponse {
  otpauthUri: string;
  qrDataUrl: string;
  secret: string;
}

export type OtpPurpose = "mfa" | "login";

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

// Request a one-time code be emailed to the signed-in user's account address.
export function useMfaEmailSend() {
  return useMutation<
    { success: boolean; sentTo?: string; transport?: string },
    Error,
    OtpPurpose | void
  >({
    mutationFn: async (purpose) => {
      const res = await apiRequest("POST", "/api/mfa/email/send", {
        purpose: purpose ?? "mfa",
      });
      return res.json();
    },
  });
}

// Verify an emailed one-time code; marks the session freshly verified.
export function useMfaEmailVerify() {
  return useMutation<{ success: boolean }, Error, { code: string; purpose?: OtpPurpose }>({
    mutationFn: async ({ code, purpose }) => {
      const res = await apiRequest("POST", "/api/mfa/email/verify", {
        code,
        purpose: purpose ?? "mfa",
      });
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

// Detect the login-MFA gate 403 (educator+ must verify before mutating).
export function isLoginMfaRequiredError(err: unknown): boolean {
  return !!(err && typeof err === "object" && (err as any).loginMfaRequired === true);
}

// Extract which second-factor methods the server advertised on a 403.
export function mfaMethodsFromError(err: unknown): MfaMethods | undefined {
  const m = (err as any)?.methods;
  return m && typeof m === "object" ? (m as MfaMethods) : undefined;
}
