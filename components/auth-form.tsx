"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  login,
  signup,
  type AuthActionState,
} from "@/app/auth/actions";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

type AuthFormProps = {
  mode: "login" | "signup";
  initialError?: string;
  next?: string;
};

function SubmitButton({ mode }: { mode: AuthFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending
        ? mode === "login"
          ? "Logging in…"
          : "Creating account…"
        : mode === "login"
          ? "Log in"
          : "Create account"}
    </button>
  );
}

export function AuthForm({ mode, initialError, next = "/dashboard" }: AuthFormProps) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState(action, {
    ...initialState,
    ...(initialError
      ? { status: "error" as const, message: initialError }
      : {}),
  });

  return (
    <form className="auth-form" action={formAction} noValidate>
      <input name="next" type="hidden" value={next} />
      {mode === "signup" ? (
        <>
          <label>
            <span>Display name</span>
            <input
              autoComplete="name"
              defaultValue={state.values?.displayName}
              maxLength={30}
              name="display_name"
              placeholder="Quentin"
              required
              type="text"
            />
            <small>The name your friends will see.</small>
          </label>
          <label>
            <span>Username</span>
            <input
              autoCapitalize="none"
              autoComplete="username"
              defaultValue={state.values?.username}
              inputMode="text"
              maxLength={30}
              minLength={3}
              name="username"
              pattern="[a-z0-9_]{3,30}"
              placeholder="quentincng"
              required
              spellCheck={false}
              type="text"
            />
            <small>Unique: 3–30 lowercase letters, numbers, or underscores.</small>
          </label>
        </>
      ) : null}

      <label>
        <span>Email</span>
        <input
          autoCapitalize="none"
          autoComplete="email"
          defaultValue={state.values?.email}
          inputMode="email"
          name="email"
          placeholder="you@mcgill.ca"
          required
          spellCheck={false}
          type="email"
        />
      </label>

      <label>
        <span>Password</span>
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
      </label>

      {state.message ? (
        <p
          className={`form-message ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      {mode === "signup" ? (
        <p className="signup-legal-notice">
          You must be at least 16. By creating an account, you agree to the{" "}
          <Link href="/terms">Terms of Service</Link> and acknowledge the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      ) : null}

      <SubmitButton mode={mode} />
    </form>
  );
}
