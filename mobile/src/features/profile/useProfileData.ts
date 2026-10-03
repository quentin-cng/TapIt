import { useCallback, useEffect, useRef, useState } from "react";
import {
  isValidDisplayName,
  isValidUsername,
  normalizeDisplayName,
  normalizeUsername,
} from "../../domain/profile-identity";
import { addCalendarDays, getMontrealWeekStart } from "../../domain/montreal-calendar";
import {
  calculateWeeklyGoalStreaks,
  calculateWeeklyProgress,
  getGoalForWeek,
  type WeeklyGoalSchedule,
  type WeeklyGoalStreaks,
  type WeeklyProgress,
} from "../../domain/weekly-goals";
import { supabase } from "../../lib/supabase";

export type MyProfile = {
  display_name: string | null;
  username: string;
  total_points: number;
  created_at: string;
};

type CheckinRow = {
  created_at: string;
};

type ScheduleRow = {
  effective_week: string;
  goal_sessions: number;
};

type ConfigureGoalResult = {
  goal_sessions: number;
  effective_week: string;
  applies_current_week: boolean;
};

export type ProfileData = {
  currentGoal: number | null;
  currentWeekSessions: number;
  generalPreference: boolean;
  hasDataError: boolean;
  pendingGoal: WeeklyGoalSchedule | null;
  profile: MyProfile;
  weeklyProgress: WeeklyProgress | null;
  weeklyStreaks: WeeklyGoalStreaks;
};

export type ProfileMutationResult = {
  status: "success" | "error";
  message: string;
};

export type IdentityMutationResult = ProfileMutationResult & {
  values: {
    displayName: string;
    username: string;
  };
};

export type PrivacyMutationResult = ProfileMutationResult & {
  value: boolean;
};

function formatEffectiveWeek(dateKey: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Montreal",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function isConfigureGoalResult(value: unknown): value is ConfigureGoalResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<ConfigureGoalResult>;
  return (
    typeof result.goal_sessions === "number" &&
    typeof result.effective_week === "string" &&
    typeof result.applies_current_week === "boolean"
  );
}

function logMutationError(
  action: string,
  error: { code?: string; message?: string },
) {
  if (__DEV__) {
    console.error(`[mobile profile] ${action} failed`, {
      code: error.code,
      message: error.message,
    });
  }
}

export function useProfileData(userId: string) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);
  const mutationsInFlight = useRef(new Set<string>());

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  const load = useCallback(
    async (showRefreshIndicator = false) => {
      const currentRequest = ++requestId.current;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else if (!hasLoaded.current) {
        setIsLoading(true);
      }

      setError("");

      try {
        const [
          profileResult,
          checkinsResult,
          schedulesResult,
          preferenceResult,
        ] = await Promise.all([
          supabase.rpc("get_my_profile").single(),
          supabase
            .from("checkins")
            .select("created_at")
            .eq("user_id", userId)
            .gt("points_awarded", 0)
            .order("created_at", { ascending: false }),
          supabase
            .from("weekly_goal_schedules")
            .select("effective_week, goal_sessions")
            .eq("user_id", userId)
            .order("effective_week", { ascending: true }),
          supabase.rpc("get_my_general_leaderboard_preference"),
        ]);

        if (profileResult.error || !profileResult.data) {
          throw new Error("Profile unavailable");
        }

        const profile = profileResult.data as MyProfile;
        const checkins = (checkinsResult.data ?? []) as CheckinRow[];
        const schedules = ((schedulesResult.data ?? []) as ScheduleRow[]).map(
          (schedule): WeeklyGoalSchedule => ({
            effectiveWeek: schedule.effective_week,
            goalSessions: schedule.goal_sessions,
          }),
        );
        const currentWeek = getMontrealWeekStart();
        const nextWeek = addCalendarDays(currentWeek, 7);
        const currentGoal = getGoalForWeek(schedules, currentWeek) ?? null;
        const checkinTimestamps = checkins.map((checkin) => checkin.created_at);
        const currentWeekSessions = checkinTimestamps.filter(
          (timestamp) => getMontrealWeekStart(timestamp) === currentWeek,
        ).length;

        if (currentRequest !== requestId.current) return;

        setData({
          currentGoal,
          currentWeekSessions,
          generalPreference: preferenceResult.data !== false,
          hasDataError: Boolean(
            checkinsResult.error ||
              schedulesResult.error ||
              preferenceResult.error,
          ),
          pendingGoal:
            schedules.find((schedule) => schedule.effectiveWeek === nextWeek) ??
            null,
          profile,
          weeklyProgress: currentGoal
            ? calculateWeeklyProgress(checkinTimestamps, currentGoal)
            : null,
          weeklyStreaks: calculateWeeklyGoalStreaks(
            checkinTimestamps,
            schedules,
          ),
        });
        hasLoaded.current = true;
      } catch (loadError) {
        console.error("[mobile profile] data load failed", loadError);
        if (currentRequest === requestId.current) {
          setData(null);
          setError("We couldn’t load your profile. Please try again.");
          hasLoaded.current = false;
        }
      } finally {
        if (currentRequest === requestId.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [userId],
  );

  const refresh = useCallback(() => load(true), [load]);

  const updateIdentity = useCallback(
    async (
      rawDisplayName: string,
      rawUsername: string,
    ): Promise<IdentityMutationResult> => {
      const displayName = normalizeDisplayName(rawDisplayName);
      const username = normalizeUsername(rawUsername);
      const values = { displayName, username };

      if (!isValidDisplayName(displayName)) {
        return {
          status: "error",
          message: "Display name must be between 1 and 30 characters.",
          values,
        };
      }

      if (!isValidUsername(username)) {
        return {
          status: "error",
          message:
            "Username must be 3–30 lowercase letters, numbers, or underscores.",
          values,
        };
      }

      if (mutationsInFlight.current.has("identity")) {
        return {
          status: "error",
          message: "Your profile is already being saved.",
          values,
        };
      }

      mutationsInFlight.current.add("identity");

      try {
        const { error: updateError } = await supabase.rpc("update_my_profile", {
          p_display_name: displayName,
          p_username: username,
        });

        if (updateError) {
          logMutationError("update identity", updateError);
          const isUsernameConflict =
            updateError.code === "23505" ||
            updateError.message.toLowerCase().includes("duplicate key");

          return {
            status: "error",
            message: isUsernameConflict
              ? "That username is already taken."
              : "We couldn’t update your profile. Please try again.",
            values,
          };
        }

        await load();
        return { status: "success", message: "Profile updated.", values };
      } catch (failure) {
        console.error("[mobile profile] identity update failed", failure);
        return {
          status: "error",
          message: "We couldn’t update your profile. Please try again.",
          values,
        };
      } finally {
        mutationsInFlight.current.delete("identity");
      }
    },
    [load],
  );

  const updateWeeklyGoal = useCallback(
    async (goal: number): Promise<ProfileMutationResult> => {
      if (!Number.isInteger(goal) || goal < 1 || goal > 7) {
        return {
          status: "error",
          message: "Choose a weekly goal from 1 to 7 sessions.",
        };
      }

      if (mutationsInFlight.current.has("goal")) {
        return {
          status: "error",
          message: "Your weekly goal is already being saved.",
        };
      }

      mutationsInFlight.current.add("goal");

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "configure_weekly_goal",
          { p_goal_sessions: goal },
        );

        if (rpcError) {
          logMutationError("configure weekly goal", rpcError);
          return {
            status: "error",
            message: "We couldn’t save your weekly goal. Please try again.",
          };
        }

        const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;

        if (!isConfigureGoalResult(result)) {
          logMutationError("configure weekly goal", {
            message: "The RPC returned no valid result row.",
          });
          return {
            status: "error",
            message: "We couldn’t save your weekly goal. Please try again.",
          };
        }

        await load();

        const goalLabel = `${result.goal_sessions} ${
          result.goal_sessions === 1 ? "session" : "sessions"
        }/week`;
        return {
          status: "success",
          message: result.applies_current_week
            ? `Your goal of ${goalLabel} starts this week.`
            : `Your goal of ${goalLabel} is scheduled for ${formatEffectiveWeek(
                result.effective_week,
              )}.`,
        };
      } catch (failure) {
        console.error("[mobile profile] weekly goal update failed", failure);
        return {
          status: "error",
          message: "We couldn’t save your weekly goal. Please try again.",
        };
      } finally {
        mutationsInFlight.current.delete("goal");
      }
    },
    [load],
  );

  const updatePrivacy = useCallback(
    async (nextValue: boolean): Promise<PrivacyMutationResult> => {
      const previousValue = data?.generalPreference ?? !nextValue;

      if (mutationsInFlight.current.has("privacy")) {
        return {
          status: "error",
          message: "This setting is already being saved.",
          value: previousValue,
        };
      }

      mutationsInFlight.current.add("privacy");
      requestId.current += 1;
      setIsLoading(false);
      setIsRefreshing(false);
      setData((current) =>
        current ? { ...current, generalPreference: nextValue } : current,
      );

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "set_general_leaderboard_preference",
          { p_show_username: nextValue },
        );

        if (rpcError) {
          logMutationError("update leaderboard privacy", rpcError);
          setData((current) =>
            current
              ? { ...current, generalPreference: previousValue }
              : current,
          );
          return {
            status: "error",
            message: "We couldn’t save this setting. Please try again.",
            value: previousValue,
          };
        }

        if (typeof rpcData !== "boolean") {
          logMutationError("update leaderboard privacy", {
            message: "The RPC returned no boolean preference.",
          });
          setData((current) =>
            current
              ? { ...current, generalPreference: previousValue }
              : current,
          );
          return {
            status: "error",
            message: "We couldn’t save this setting. Please try again.",
            value: previousValue,
          };
        }

        setData((current) =>
          current ? { ...current, generalPreference: rpcData } : current,
        );

        return { status: "success", message: "Saved", value: rpcData };
      } catch (failure) {
        console.error("[mobile profile] privacy update failed", failure);
        setData((current) =>
          current ? { ...current, generalPreference: previousValue } : current,
        );
        return {
          status: "error",
          message: "We couldn’t save this setting. Please try again.",
          value: previousValue,
        };
      } finally {
        mutationsInFlight.current.delete("privacy");
      }
    },
    [data?.generalPreference],
  );

  const signOut = useCallback(async (): Promise<ProfileMutationResult> => {
    if (mutationsInFlight.current.has("logout")) {
      return { status: "error", message: "Logout is already in progress." };
    }

    mutationsInFlight.current.add("logout");

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        logMutationError("logout", signOutError);
        return {
          status: "error",
          message: "We could not log you out. Please try again.",
        };
      }

      return { status: "success", message: "" };
    } catch (failure) {
      console.error("[mobile profile] logout failed", failure);
      return {
        status: "error",
        message: "We could not log you out. Please try again.",
      };
    } finally {
      mutationsInFlight.current.delete("logout");
    }
  }, []);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    load,
    refresh,
    signOut,
    updateIdentity,
    updatePrivacy,
    updateWeeklyGoal,
  };
}
