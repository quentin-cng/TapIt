export type CheckinContextRow = {
  status: "valid" | "invalid_tag";
  location_name: string | null;
  requires_location_verification: boolean;
};

const checkinTokenPattern = /^[0-9a-f]{64}$/;

export function isValidCheckinToken(value: unknown): value is string {
  return typeof value === "string" && checkinTokenPattern.test(value);
}

export type CheckinStatus =
  | "success"
  | "cooldown"
  | "invalid_tag"
  | "location_required"
  | "invalid_location"
  | "location_too_inaccurate"
  | "outside_geofence";

export type CheckinRow = {
  status: CheckinStatus;
  checkin_id: string | null;
  location_id: string | null;
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

const checkinStatuses = new Set<CheckinStatus>([
  "success",
  "cooldown",
  "invalid_tag",
  "location_required",
  "invalid_location",
  "location_too_inaccurate",
  "outside_geofence",
]);

export function firstRow(data: unknown) {
  return Array.isArray(data) ? data[0] : data;
}

export function isCheckinContextRow(
  value: unknown,
): value is CheckinContextRow {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  return (
    (row.status === "valid" || row.status === "invalid_tag") &&
    (typeof row.location_name === "string" || row.location_name === null) &&
    typeof row.requires_location_verification === "boolean"
  );
}

function isNullableString(value: unknown) {
  return typeof value === "string" || value === null;
}

function isNullableNumber(value: unknown) {
  return typeof value === "number" || value === null;
}

export function isCheckinRow(value: unknown): value is CheckinRow {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  return (
    typeof row.status === "string" &&
    checkinStatuses.has(row.status as CheckinStatus) &&
    isNullableString(row.checkin_id) &&
    isNullableString(row.location_id) &&
    isNullableString(row.location_name) &&
    typeof row.points_awarded === "number" &&
    isNullableNumber(row.total_points) &&
    isNullableString(row.checked_in_at) &&
    isNullableString(row.next_eligible_at) &&
    isNullableNumber(row.weekly_goal) &&
    isNullableNumber(row.weekly_sessions) &&
    typeof row.weekly_bonus_points === "number" &&
    typeof row.weekly_goal_completed === "boolean" &&
    typeof row.total_points_earned === "number"
  );
}

export function formatTimestamp(value: string | null) {
  if (!value) return "the time shown by the venue";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getResultCopy(result: CheckinRow) {
  switch (result.status) {
    case "cooldown":
      return {
        eyebrow: "Already checked in",
        title: "Your next tap isn’t ready yet.",
        message: `You can check in again after ${formatTimestamp(result.next_eligible_at)}.`,
        retryable: false,
      };
    case "invalid_tag":
      return {
        eyebrow: "Tag unavailable",
        title: "This TapIt tag is invalid or disabled.",
        message: "Try another tag or ask the fitness location for help.",
        retryable: false,
      };
    case "location_required":
      return {
        eyebrow: "Location not verified",
        title: "Your location is required here.",
        message: "Allow TapIt to get a fresh location, then try again.",
        retryable: true,
      };
    case "invalid_location":
      return {
        eyebrow: "Location not verified",
        title: "We couldn’t validate that location.",
        message: "Check location services on your phone, then try again.",
        retryable: true,
      };
    case "location_too_inaccurate":
      return {
        eyebrow: "Location not verified",
        title: "Your location isn’t accurate enough.",
        message: "Move closer to the entrance or a window, then try again.",
        retryable: true,
      };
    case "outside_geofence":
      return {
        eyebrow: "Location not verified",
        title: "You need to be at this TapIt location.",
        message: "Move closer to the fitness location, then try the tag again.",
        retryable: true,
      };
    case "success":
      return {
        eyebrow: "Checked in",
        title: "You showed up.",
        message: "Your visit was rewarded.",
        retryable: false,
      };
  }
}
