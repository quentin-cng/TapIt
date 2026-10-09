import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  CreateAccountChoice,
  type CreateAccountCredentials,
  type CreateAccountSubmissionResult,
} from "./CreateAccountChoice";

function friendlySignupError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists")
  ) {
    return "An account already exists for this email.";
  }

  if (normalizedMessage.includes("email")) {
    return "Enter a valid email address.";
  }

  if (normalizedMessage.includes("password")) {
    return "That password does not meet the security requirements. Try a longer password.";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return "Too many signup attempts. Please wait and try again.";
  }

  if (
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("fetch")
  ) {
    return "We couldn’t reach TapIt. Check your connection and try again.";
  }

  return "We could not create your account. Please try again.";
}

async function createAccount({
  email,
  password,
}: CreateAccountCredentials): Promise<CreateAccountSubmissionResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { message: friendlySignupError(error.message), status: "error" };
  }

  if (!data.session) {
    return {
      message:
        "Account created. Check your email to confirm it, then return to TapIt and sign in.",
      status: "confirmation-required",
    };
  }

  return { status: "complete" };
}

export function SignUpScreen() {
  return (
    <CreateAccountChoice
      onBack={() => router.back()}
      onSignIn={() => router.replace("/sign-in")}
      onSubmit={createAccount}
    />
  );
}
