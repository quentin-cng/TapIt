import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildHomeSocialNudge,
  type HomeSocialNudge,
} from "../../domain/home-social-nudge";
import { mapSocialWeeklyStats } from "../../domain/social-weekly";
import { supabase } from "../../lib/supabase";

export function useHomeSocialNudge(userId: string) {
  const [data, setData] = useState<HomeSocialNudge | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);

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
      setHasError(false);

      try {
        const { data: rpcData, error } = await supabase.rpc(
          "get_social_weekly_stats",
        );
        if (error) throw error;

        const nudge = buildHomeSocialNudge(
          mapSocialWeeklyStats(rpcData),
          userId,
        );
        if (!nudge) throw new Error("Current user social data unavailable");
        if (currentRequest !== requestId.current) return;

        setData(nudge);
        setHasError(false);
        hasLoaded.current = true;
      } catch (loadError) {
        if (__DEV__) {
          console.error("[mobile home] social data load failed", loadError);
        }
        if (currentRequest === requestId.current) {
          setData(null);
          setHasError(true);
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

  return { data, hasError, isLoading, isRefreshing, load, refresh };
}
