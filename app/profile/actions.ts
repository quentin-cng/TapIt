"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  isValidDisplayName,
  normalizeDisplayName,
} from "@/lib/profile-identity";
import { createClient } from "@/lib/supabase/server";

export type GeneralLeaderboardPreferenceState = {
  status: "idle" | "success" | "error";
  message: string;
  showUsername?: boolean;
};

export type DeleteAccountState = {
  status: "idle" | "error";
  message: string;
};

export type ProfileIdentityState = {
  status: "idle" | "success" | "error";
  message: string;
  values?: {
    displayName: string;
    username: string;
  };
};

const usernamePattern = /^[a-z0-9_]{3,30}$/;

export async function updateProfileIdentity(
  _previousState: ProfileIdentityState,
  formData: FormData,
): Promise<ProfileIdentityState> {
  const rawDisplayName = formData.get("display_name");
  const rawUsername = formData.get("username");
  const displayName = normalizeDisplayName(
    typeof rawDisplayName === "string" ? rawDisplayName : "",
  );
  const username = (
    typeof rawUsername === "string" ? rawUsername : ""
  )
    .trim()
    .toLowerCase();
  const values = { displayName, username };

  if (!isValidDisplayName(displayName)) {
    return {
      status: "error",
      message: "Display name must be between 1 and 30 characters.",
      values,
    };
  }

  if (!usernamePattern.test(username)) {
    return {
      status: "error",
      message:
        "Username must be 3–30 lowercase letters, numbers, or underscores.",
      values,
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "error",
      message: "Your session expired. Log in and try again.",
      values,
    };
  }

  const { error } = await supabase.rpc("update_my_profile", {
    p_display_name: displayName,
    p_username: username,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[profile] identity update failed", {
        code: error.code,
        message: error.message,
      });
    }

    const isUsernameConflict =
      error.code === "23505" ||
      error.message.toLowerCase().includes("duplicate key");

    return {
      status: "error",
      message: isUsernameConflict
        ? "That username is already taken."
        : "We couldn't update your profile. Please try again.",
      values,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/friends");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  revalidatePath("/recap");

  return {
    status: "success",
    message: "Profile updated.",
    values,
  };
}

export async function updateGeneralLeaderboardPreference(
  _previousState: GeneralLeaderboardPreferenceState,
  formData: FormData,
): Promise<GeneralLeaderboardPreferenceState> {
  const visibility = formData.get("visibility");

  if (visibility !== "true" && visibility !== "false") {
    return {
      status: "error",
      message: "Choose a valid leaderboard visibility setting.",
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "error",
      message: "Your session expired. Log in and try again.",
    };
  }

  const { error } = await supabase.rpc("set_general_leaderboard_preference", {
    p_show_username: visibility === "true",
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[profile] leaderboard preference update failed", {
        code: error.code,
        message: error.message,
      });
    }

    return {
      status: "error",
      message: "We couldn't save this setting. Please try again.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");

  return {
    status: "success",
    message: "Saved",
    showUsername: visibility === "true",
  };
}

export async function deleteAccount(
  _previousState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirmation = formData.get("confirmation");

  if (confirmation !== "DELETE") {
    return {
      status: "error",
      message: "Type DELETE exactly to confirm account deletion.",
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "error",
      message: "Your session expired. Log in and try again.",
    };
  }

  const { error } = await supabase.rpc("delete_current_account");

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[account] delete_current_account failed", {
        code: error.code,
        message: error.message,
      });
    }

    return {
      status: "error",
      message: "We couldn't delete your account. Please try again.",
    };
  }

  // auth-js clears the local cookie even when the user was just removed and
  // the remote sign-out endpoint consequently responds with 401/404.
  await supabase.auth.signOut({ scope: "global" });
  redirect("/?accountDeleted=1");
}
