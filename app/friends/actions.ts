"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FriendshipActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FriendRpcError = {
  code?: string;
  message?: string;
};

function getEntityId(formData: FormData) {
  const value = formData.get("entityId");
  return typeof value === "string" ? value.toLowerCase() : "";
}

function getUsername(formData: FormData) {
  const value = formData.get("entityId");
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function getActionContext(formData: FormData) {
  const entityId = getEntityId(formData);

  if (!uuidPattern.test(entityId)) {
    return { ok: false, message: "That request could not be found." } as const;
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims?.sub;

  if (claimsError || !currentUserId) {
    return {
      ok: false,
      message: "Your session expired. Log in and try again.",
    } as const;
  }

  return { ok: true, supabase, entityId } as const;
}

function revalidateSocialPages() {
  revalidatePath("/friends");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/recap");
}

function logRpcError(action: string, error: FriendRpcError) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[friendships] ${action} failed`, {
      code: error.code,
      message: error.message,
    });
  }
}

export async function sendFriendRequest(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  void _previousState;
  const username = getUsername(formData);

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { status: "error", message: "That user could not be found." };
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

  const { data, error } = await supabase.rpc("send_friend_request_by_username", {
    p_username: username,
  });

  if (error) {
    logRpcError("send request", error);
    return {
      status: "error",
      message: "Could not send this friend request. Please try again.",
    };
  }

  if (data === "not_found") {
    return { status: "error", message: "That user could not be found." };
  }

  revalidateSocialPages();

  if (data === "accepted") {
    return { status: "success", message: "Request accepted. You’re friends." };
  }

  if (data === "friends") {
    return { status: "success", message: "You are already friends." };
  }

  if (data === "requested") {
    return { status: "success", message: "Request already sent." };
  }

  return { status: "success", message: "Friend request sent." };
}

export async function acceptFriendRequest(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  void _previousState;
  const context = await getActionContext(formData);

  if (!context.ok) return { status: "error", message: context.message };

  const { data, error } = await context.supabase.rpc("accept_friend_request", {
    p_request_id: context.entityId,
  });

  if (error) {
    logRpcError("accept request", error);
    return {
      status: "error",
      message: "Could not accept this request. Please try again.",
    };
  }

  if (data === "not_found") {
    return { status: "error", message: "This request is no longer available." };
  }

  revalidateSocialPages();
  return { status: "success", message: "Friend request accepted." };
}

export async function declineFriendRequest(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  void _previousState;
  const context = await getActionContext(formData);

  if (!context.ok) return { status: "error", message: context.message };

  const { data, error } = await context.supabase.rpc("decline_friend_request", {
    p_request_id: context.entityId,
  });

  if (error) {
    logRpcError("decline request", error);
    return {
      status: "error",
      message: "Could not decline this request. Please try again.",
    };
  }

  if (data === "not_found") {
    return { status: "error", message: "This request is no longer available." };
  }

  revalidateSocialPages();
  return { status: "success", message: "Friend request declined." };
}

export async function cancelFriendRequest(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  void _previousState;
  const context = await getActionContext(formData);

  if (!context.ok) return { status: "error", message: context.message };

  const { data, error } = await context.supabase.rpc("cancel_friend_request", {
    p_request_id: context.entityId,
  });

  if (error) {
    logRpcError("cancel request", error);
    return {
      status: "error",
      message: "Could not cancel this request. Please try again.",
    };
  }

  if (data === "not_found") {
    return { status: "error", message: "This request is no longer available." };
  }

  revalidateSocialPages();
  return { status: "success", message: "Friend request cancelled." };
}

export async function removeFriend(
  _previousState: FriendshipActionState,
  formData: FormData,
): Promise<FriendshipActionState> {
  void _previousState;
  const context = await getActionContext(formData);

  if (!context.ok) return { status: "error", message: context.message };

  const { data, error } = await context.supabase.rpc("remove_friend", {
    p_friend_id: context.entityId,
  });

  if (error) {
    logRpcError("remove friend", error);
    return {
      status: "error",
      message: "Could not remove this friend. Please try again.",
    };
  }

  if (data === "not_found") {
    return { status: "success", message: "Friendship was already removed." };
  }

  revalidateSocialPages();
  return { status: "success", message: "Friend removed." };
}
