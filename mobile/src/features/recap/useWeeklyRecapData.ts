import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildWeeklyRecap,
  mapSocialWeeklyStats,
  type SocialWeeklyStat,
  type WeeklyRecap,
} from "../../domain/social-weekly";
import { supabase } from "../../lib/supabase";

export type WeeklyRecapData = {
  currentUser: SocialWeeklyStat;
  previousWeekStart: string;
  recap: WeeklyRecap;
};

export function useWeeklyRecapData(userId: string) {
  const [data, setData] = useState<WeeklyRecapData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestId = useRef(0);
  const hasData = useRef(false);

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
      } else if (!hasData.current) {
        setIsLoading(true);
      }

      setError("");

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_social_weekly_stats",
        );

        if (rpcError) throw rpcError;

        const stats = mapSocialWeeklyStats(rpcData);
        const currentUser = stats.find((stat) => stat.userId === userId);

        if (!currentUser) {
          throw new Error("Authenticated user missing from social statistics");
        }

        if (currentRequest !== requestId.current) return;

        setData({
          currentUser,
          previousWeekStart: currentUser.previousWeekStart,
          recap: buildWeeklyRecap(stats),
        });
        hasData.current = true;
      } catch (loadError) {
        console.error("[mobile recap] data load failed", loadError);
        if (currentRequest === requestId.current) {
          hasData.current = false;
          setData(null);
          setError("We couldn’t load your weekly recap. Please try again.");
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

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    load,
    refresh,
  };
}
