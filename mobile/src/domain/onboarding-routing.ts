export const SIGNED_OUT_LANDING_PATH = "/welcome" as const;

export type SetupReadiness =
  | "avatar-required"
  | "identity-incomplete"
  | "weekly-goal-required"
  | "confirmation-required"
  | "complete"
  | "error"
  | "loading"
  | "signed-out";

export function getAuthoritativeSetupPath(readiness: SetupReadiness) {
  if (readiness === "avatar-required") return "/onboarding/avatar";
  if (readiness === "identity-incomplete") return "/onboarding/profile";
  if (readiness === "weekly-goal-required") {
    return "/onboarding/weekly-goal";
  }
  if (readiness === "confirmation-required") {
    return "/onboarding/complete";
  }
  return null;
}

export function isDevelopmentOnboardingPreviewPath(
  pathname: string,
  isDevelopment: boolean,
) {
  return isDevelopment && pathname === "/dev-onboarding";
}
