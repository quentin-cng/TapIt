import { useCallback, useRef, useState } from "react";
import {
  calculateWeeklyGoalStreaks,
  calculateWeeklyProgress,
  getGoalForWeek,
  type WeeklyGoalSchedule,
  type WeeklyGoalStreaks,
  type WeeklyProgress,
} from "../../domain/weekly-goals";
import { getMontrealWeekStart } from "../../domain/montreal-calendar";
import { supabase } from "../../lib/supabase";

type MyProfile = {
  display_name: string | null;
  username: string;
  total_points: number;
};

type CheckinRow = {
  created_at: string;
};

type ScheduleRow = {
  effective_week: string;
  goal_sessions: number;
};

export type HomeData = {
  hasPersonalDataError: boolean;
  profile: MyProfile;
  weeklyProgress: WeeklyProgress | null;
  weeklyStreaks: WeeklyGoalStreaks;
};

export function useHomeData(userId: string) {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);

  const load = useCallback(async (showRefreshIndicator = false) => {
    const currentRequest = ++requestId.current;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else if (!hasLoaded.current) {
      setIsLoading(true);
    }

    setError("");

    try {
      const [profileResult, checkinsResult, schedulesResult] = await Promise.all([
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
      ]);

      if (profileResult.error || !profileResult.data) {
        throw new Error("Profile unavailable");
      }

      const profile = profileResult.data as MyProfile;
      const checkins = (checkinsResult.data ?? []) as CheckinRow[];
      const schedules: WeeklyGoalSchedule[] = (
        (schedulesResult.data ?? []) as ScheduleRow[]
      ).map((schedule) => ({
        effectiveWeek: schedule.effective_week,
        goalSessions: schedule.goal_sessions,
      }));
      const currentWeeklyGoal = getGoalForWeek(
        schedules,
        getMontrealWeekStart(),
      );
      const checkinTimestamps = checkins.map((checkin) => checkin.created_at);
      if (currentRequest !== requestId.current) return;

      setData({
        hasPersonalDataError: Boolean(
          checkinsResult.error || schedulesResult.error,
        ),
        profile,
        weeklyProgress: currentWeeklyGoal
          ? calculateWeeklyProgress(checkinTimestamps, currentWeeklyGoal)
          : null,
        weeklyStreaks: calculateWeeklyGoalStreaks(checkinTimestamps, schedules),
      });
      hasLoaded.current = true;
    } catch (loadError) {
      console.error("[mobile home] data load failed", loadError);
      if (currentRequest === requestId.current) {
        setError("Your TapIt Home could not be loaded. Please try again.");
      }
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [userId]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, error, isLoading, isRefreshing, load, refresh };
}
