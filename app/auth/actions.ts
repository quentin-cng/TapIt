"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  values?: {
    email?: string;
    username?: string;
  };
};

const usernamePattern = /^[a-z0-9_]{3,30}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function friendlyLoginError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirm your email before logging in.";
  }

  return "We could not log you in. Please try again.";
}

function friendlySignupError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("already registered")) {
    return "An account already exists for this email.";
  }

  if (
    normalizedMessage.includes("database error") ||
    normalizedMessage.includes("duplicate key")
  ) {
    return "That username may already be taken. Try another one.";
  }

  if (normalizedMessage.includes("password")) {
    return message;
  }

  return "We could not create your account. Please try again.";
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getText(formData, "email").trim().toLowerCase();
  const password = getText(formData, "password");
  const next = getSafeNextPath(getText(formData, "next"));
  const values = { email };

  if (!emailPattern.test(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      values,
    };
  }

  if (!password) {
    return { status: "error", message: "Enter your password.", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: friendlyLoginError(error.message),
      values,
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = getText(formData, "username").trim().toLowerCase();
  const email = getText(formData, "email").trim().toLowerCase();
  const password = getText(formData, "password");
  const next = getSafeNextPath(getText(formData, "next"));
  const values = { email, username };

  if (!usernamePattern.test(username)) {
    return {
      status: "error",
      message:
        "Username must be 3–30 characters using only lowercase letters, numbers, and underscores.",
      values,
    };
  }

  if (!emailPattern.test(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      values,
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
      values,
    };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      ...(origin
        ? {
            emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
          }
        : {}),
    },
  });

  if (error) {
    return {
      status: "error",
      message: friendlySignupError(error.message),
      values,
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    status: "success",
    message: "Account created. Check your email to confirm it, then log in.",
    values: { email },
  };
}
