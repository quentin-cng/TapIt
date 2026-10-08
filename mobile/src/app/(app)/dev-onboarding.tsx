import { Redirect, router } from "expo-router";
import { OnboardingPreviewFlow } from "../../features/onboarding/OnboardingPreviewFlow";

export default function DevelopmentOnboardingPreviewRoute() {
  if (!__DEV__) return <Redirect href="/profile" />;

  return <OnboardingPreviewFlow onExit={() => router.replace("/")} />;
}
