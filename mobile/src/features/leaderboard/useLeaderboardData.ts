import { useCallback, useEffect, useRef, useState } from "react";
import { resolveDisplayName } from "../../domain/profile-identity";
import { mapSocialWeeklyStats } from "../../domain/social-weekly";
import { supabase } from "../../lib/supabase";

export type LeaderboardView = "friends" | "general";

export type FriendsLeaderboardRow = {
  key: string;
  rank: number;
  displayName: string;
  username: string;
  totalPoints: number;
  isCurrentUser: boolean;
  currentGoal: number | null;
  currentSessions: number;
  bestWeeklyGoalStreak: number;
};

export type GeneralLeaderboardRow = {
  key: string;
  rank: number;
  displayName: string;
  username: string | null;
  totalPoints: number;
  isCurrentUser: boolean;
};

type GlobalLeaderboardRpcRow = {
  rank_position: number;
  display_name: string | null;
  username: string | null;
  total_points: number;
  is_current_user: boolean;
};

export type LeaderboardData =
  | { view: "friends"; rows: FriendsLeaderboardRow[] }
  | { view: "general"; rows: GeneralLeaderboardRow[] };

export function useLeaderboardData(
  activeView: LeaderboardView,
  userId: string,
) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loadError, setLoadError] = useState<{
    view: LeaderboardView;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generalPreference, setGeneralPreference] = useState(true);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const requestId = useRef(0);
  const activeViewRef = useRef(activeView);

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  const load = useCallback(
    async (showRefreshIndicator = false) => {
      const requestedView = activeView;
      const currentRequest = ++requestId.current;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError(null);

      try {
        if (requestedView === "friends") {
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            "get_social_weekly_stats",
          );

          if (rpcError) throw rpcError;

          const rows = mapSocialWeeklyStats(rpcData)
            .map((stat) => ({
              key: stat.userId,
              displayName: stat.displayName,
              username: stat.username,
              totalPoints: stat.totalPoints,
              isCurrentUser: stat.userId === userId,
              currentGoal: stat.currentGoal,
              currentSessions: stat.currentSessions,
              bestWeeklyGoalStreak: stat.bestWeeklyGoalStreak,
            }))
            .sort(
              (a, b) =>
                b.totalPoints - a.totalPoints ||
                a.username.localeCompare(b.username),
            )
            .map((row, index) => ({ ...row, rank: index + 1 }));

          if (
            currentRequest !== requestId.current ||
            activeViewRef.current !== requestedView
          ) {
            return;
          }

          setData({ view: "friends", rows });
        } else {
          const [leaderboardResult, preferenceResult] = await Promise.all([
            supabase.rpc("get_global_leaderboard", { p_limit: 100 }),
            supabase.rpc("get_my_general_leaderboard_preference"),
          ]);

          if (leaderboardResult.error) throw leaderboardResult.error;
          if (preferenceResult.error) throw preferenceResult.error;

          const rows = ((leaderboardResult.data ?? []) as GlobalLeaderboardRpcRow[]).map(
            (profile) => ({
              key: String(profile.rank_position),
              rank: profile.rank_position,
              displayName:
                profile.display_name === "Anonymous"
                  ? "Anonymous"
                  : resolveDisplayName(
                      profile.display_name,
                      profile.username ?? "Anonymous",
                    ),
              username: profile.username,
              totalPoints: profile.total_points,
              isCurrentUser: profile.is_current_user,
            }),
          );

          if (
            currentRequest !== requestId.current ||
            activeViewRef.current !== requestedView
          ) {
            return;
          }

          setGeneralPreference(preferenceResult.data !== false);
          setData({ view: "general", rows });
        }
      } catch (loadError) {
        console.error("[mobile leaderboard] data load failed", loadError);
        if (
          currentRequest === requestId.current &&
          activeViewRef.current === requestedView
        ) {
          setLoadError({
            view: requestedView,
            message: "We couldn’t load the leaderboard. Please try again.",
          });
          setData(null);
        }
      } finally {
        if (
          currentRequest === requestId.current &&
          activeViewRef.current === requestedView
        ) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [activeView, userId],
  );

  const refresh = useCallback(() => load(true), [load]);

  const updateGeneralPreference = useCallback(
    async (nextValue: boolean) => {
      if (isSavingPreference) return;

      const previousValue = generalPreference;
      setPreferenceMessage(null);
      setGeneralPreference(nextValue);
      setIsSavingPreference(true);

      try {
        const { data: savedValue, error: saveError } = await supabase.rpc(
          "set_general_leaderboard_preference",
          { p_show_username: nextValue },
        );

        if (saveError) throw saveError;

        setGeneralPreference(savedValue !== false);
        setPreferenceMessage({ status: "success", message: "Saved" });

        if (activeViewRef.current === "general") {
          await load();
        }
      } catch (saveFailure) {
        console.error(
          "[mobile leaderboard] preference update failed",
          saveFailure,
        );
        setGeneralPreference(previousValue);
        setPreferenceMessage({
          status: "error",
          message: "We couldn’t save this setting. Please try again.",
        });
      } finally {
        setIsSavingPreference(false);
      }
    },
    [generalPreference, isSavingPreference, load],
  );

  const visibleData = data?.view === activeView ? data : null;
  const visibleError =
    loadError?.view === activeView ? loadError.message : "";

  return {
    data: visibleData,
    error: visibleError,
    generalPreference,
    isLoading,
    isRefreshing,
    isSavingPreference,
    load,
    preferenceMessage,
    refresh,
    updateGeneralPreference,
  };
}
