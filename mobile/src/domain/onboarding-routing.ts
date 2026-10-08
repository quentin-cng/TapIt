export const SIGNED_OUT_LANDING_PATH = "/welcome" as const;

export type SetupReadiness =
  | "identity-incomplete"
  | "weekly-goal-required"
  | "complete"
  | "error"
  | "loading"
  | "signed-out";

export function getAuthoritativeSetupPath(readiness: SetupReadiness) {
  if (readiness === "identity-incomplete") return "/onboarding/profile";
  if (readiness === "weekly-goal-required") {
    return "/onboarding/weekly-goal";
  }
  return null;
}

export function isDevelopmentOnboardingPreviewPath(
  pathname: string,
  isDevelopment: boolean,
) {
  return isDevelopment && pathname === "/dev-onboarding";
}
