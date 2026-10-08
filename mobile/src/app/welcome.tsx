import { router } from "expo-router";
import { IntroPager } from "../features/onboarding/IntroPager";

export default function WelcomeScreen() {
  return (
    <IntroPager
      onComplete={() => router.push("/create-account")}
      onSignIn={() => router.push("/sign-in")}
    />
  );
}
