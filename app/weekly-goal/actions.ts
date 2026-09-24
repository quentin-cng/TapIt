"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type WeeklyGoalActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type SupabaseActionError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function logDevelopmentError(context: string, error: SupabaseActionError) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[weekly-goal] ${context}`, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
}

function readGoal(formData: FormData) {
  const value = formData.get("goalSessions");
  const goal = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(goal) && goal >= 1 && goal <= 7 ? goal : null;
}

async function configureGoal(formData: FormData) {
  const goal = readGoal(formData);

  if (goal === null) {
    return {
      ok: false,
      state: {
        status: "error" as const,
        message: "Choose a weekly goal from 1 to 7 sessions.",
      },
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      ok: false,
      state: {
        status: "error" as const,
        message: "Your session expired. Log in and try again.",
      },
    };
  }

  const { data, error } = await supabase.rpc("configure_weekly_goal", {
    p_goal_sessions: goal,
  });
  const result = Array.isArray(data) ? data[0] : data;

  if (error) {
    logDevelopmentError("configure_weekly_goal RPC failed", error);

    return {
      ok: false,
      state: {
        status: "error" as const,
        message: "We couldn't save your weekly goal. Please try again.",
      },
    };
  }

  if (!result) {
    logDevelopmentError("configure_weekly_goal returned no row", {
      message: "The RPC completed without returning its expected result row.",
    });

    return {
      ok: false,
      state: {
        status: "error" as const,
        message: "We couldn't save your weekly goal. Please try again.",
      },
    };
  }

  return { ok: true, goal, result } as const;
}

export async function completeOnboarding(
  _previousState: WeeklyGoalActionState,
  formData: FormData,
): Promise<WeeklyGoalActionState> {
  void _previousState;
  const requestedNext = formData.get("next");
  const next = getSafeNextPath(
    typeof requestedNext === "string" ? requestedNext : null,
  );
  const outcome = await configureGoal(formData);

  if (!outcome.ok) {
    return outcome.state;
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function changeWeeklyGoal(
  _previousState: WeeklyGoalActionState,
  formData: FormData,
): Promise<WeeklyGoalActionState> {
  void _previousState;
  const outcome = await configureGoal(formData);

  if (!outcome.ok) {
    return outcome.state;
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return {
    status: "success",
    message: `Your new goal of ${outcome.goal} ${outcome.goal === 1 ? "session" : "sessions"}/week starts next Monday.`,
  };
}
