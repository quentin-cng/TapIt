"use server";

import { createClient } from "@/lib/supabase/server";

export type CheckinActionState = {
  status:
    | "idle"
    | "success"
    | "cooldown"
    | "invalid_tag"
    | "location_required"
    | "invalid_location"
    | "location_too_inaccurate"
    | "outside_geofence"
    | "error";
  locationName?: string;
  pointsAwarded?: number;
  totalPoints?: number;
  checkedInAt?: string;
  nextEligibleAt?: string;
  weeklyGoal?: number;
  weeklySessions?: number;
  weeklyBonusPoints?: number;
  weeklyGoalCompleted?: boolean;
  totalPointsEarned?: number;
};

type CheckinRpcStatus = Exclude<
  CheckinActionState["status"],
  "idle" | "error"
>;

type CheckinRpcRow = {
  status: CheckinRpcStatus;
  location_name: string | null;
  points_awarded: number;
  total_points: number | null;
  checked_in_at: string | null;
  next_eligible_at: string | null;
  weekly_goal: number | null;
  weekly_sessions: number | null;
  weekly_bonus_points: number;
  weekly_goal_completed: boolean;
  total_points_earned: number;
};

type SupabaseRpcError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const rpcStatuses = new Set<CheckinRpcStatus>([
  "success",
  "cooldown",
  "invalid_tag",
  "location_required",
  "invalid_location",
  "location_too_inaccurate",
  "outside_geofence",
]);

function logCheckinError(context: string, error: SupabaseRpcError) {
  console.error(`[checkin] ${context}`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function readOptionalNumber(formData: FormData, field: string) {
  const value = formData.get(field);

  if (value === null || value === "") return { valid: true, value: null };
  if (typeof value !== "string") return { valid: false, value: null };

  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? { valid: true, value: parsed }
    : { valid: false, value: null };
}

function isCheckinRpcRow(value: unknown): value is CheckinRpcRow {
  if (!value || typeof value !== "object") return false;

  const status = (value as { status?: unknown }).status;
  return typeof status === "string" && rpcStatuses.has(status as CheckinRpcStatus);
}

export async function performCheckin(
  token: string,
  _previousState: CheckinActionState,
  formData: FormData,
): Promise<CheckinActionState> {
  void _previousState;

  if (!token || token.length > 256) return { status: "invalid_tag" };

  const latitude = readOptionalNumber(formData, "latitude");
  const longitude = readOptionalNumber(formData, "longitude");
  const accuracy = readOptionalNumber(formData, "accuracy");

  if (!latitude.valid || !longitude.valid || !accuracy.valid) {
    return { status: "invalid_location" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("perform_checkin", {
    p_token: token,
    p_latitude: latitude.value,
    p_longitude: longitude.value,
    p_accuracy_meters: accuracy.value,
  });

  if (error) {
    logCheckinError("perform_checkin RPC failed", error);
    return { status: "error" };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!isCheckinRpcRow(result)) {
    logCheckinError("perform_checkin returned an unexpected response", {
      message: "The RPC did not return a recognized status row.",
    });
    return { status: "error" };
  }

  if (result.status === "invalid_tag") return { status: "invalid_tag" };

  return {
    status: result.status,
    locationName: result.location_name ?? "TapIt location",
    pointsAwarded: result.points_awarded,
    totalPoints: result.total_points ?? undefined,
    checkedInAt: result.checked_in_at ?? undefined,
    nextEligibleAt: result.next_eligible_at ?? undefined,
    weeklyGoal: result.weekly_goal ?? undefined,
    weeklySessions: result.weekly_sessions ?? undefined,
    weeklyBonusPoints: result.weekly_bonus_points,
    weeklyGoalCompleted: result.weekly_goal_completed,
    totalPointsEarned: result.total_points_earned,
  };
}
