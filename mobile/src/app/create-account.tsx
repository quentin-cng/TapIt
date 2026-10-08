import { router } from "expo-router";
import { CreateAccountChoice } from "../features/onboarding/CreateAccountChoice";

export default function CreateAccountScreen() {
  return (
    <CreateAccountChoice
      onBack={() => router.back()}
      onEmail={() => router.push("/sign-up")}
      onSignIn={() => router.push("/sign-in")}
    />
  );
}
