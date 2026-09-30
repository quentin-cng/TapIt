import { useCallback, useEffect, useRef, useState } from "react";
import type { SocialWeeklyStat } from "../../domain/social-weekly";
import { mapSocialWeeklyStats } from "../../domain/social-weekly";
import { supabase } from "../../lib/supabase";

type FriendshipRow = {
  user_id: string;
  friend_id: string;
};

type FriendRequestRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  created_at: string;
};

export type RelationshipProfile = {
  profile_id: string;
  display_name: string | null;
  username: string;
  total_points: number;
  created_at: string;
};

export type SearchProfile = {
  display_name: string | null;
  username: string;
  total_points: number;
  relationship_status: "friends" | "outgoing" | "incoming" | "none";
  request_id: string | null;
};

export type FriendView = {
  profile: RelationshipProfile;
  weeklyStat: SocialWeeklyStat | null;
};

export type IncomingRequestView = {
  id: string;
  profile: RelationshipProfile;
};

export type FriendsData = {
  friends: FriendView[];
  hasDataError: boolean;
  incomingRequests: IncomingRequestView[];
};

export type FriendActionMode =
  | "send"
  | "cancel"
  | "accept"
  | "decline"
  | "remove";

export type FriendActionResult = {
  status: "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeSearchQuery(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase().slice(0, 30);
}

function logRpcError(action: string, error: { code?: string; message?: string }) {
  if (__DEV__) {
    console.error(`[mobile friendships] ${action} failed`, {
      code: error.code,
      message: error.message,
    });
  }
}

export function useFriendsData(userId: string) {
  const [data, setData] = useState<FriendsData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchProfiles, setSearchProfiles] = useState<SearchProfile[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const dataRequestId = useRef(0);
  const searchRequestId = useRef(0);
  const hasLoaded = useRef(false);
  const activeSearchQuery = useRef("");
  const mutationsInFlight = useRef(new Set<string>());

  useEffect(
    () => () => {
      dataRequestId.current += 1;
      searchRequestId.current += 1;
    },
    [],
  );

  const loadFriends = useCallback(async () => {
    const currentRequest = ++dataRequestId.current;

    if (!hasLoaded.current) {
      setIsLoading(true);
    }

    setError("");

    try {
      const [
        friendshipsResult,
        requestsResult,
        socialStatsResult,
        relationshipProfilesResult,
      ] = await Promise.all([
        supabase
          .from("friendships")
          .select("user_id, friend_id")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
        supabase
          .from("friend_requests")
          .select("id, requester_id, recipient_id, created_at")
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          .order("created_at", { ascending: false }),
        supabase.rpc("get_social_weekly_stats"),
        supabase.rpc("get_relationship_profiles"),
      ]);

      if (friendshipsResult.error || relationshipProfilesResult.error) {
        throw new Error("Relationship data unavailable");
      }

      const friendshipRows = (friendshipsResult.data ?? []) as FriendshipRow[];
      const requestRows = (requestsResult.data ?? []) as FriendRequestRow[];
      const relationshipProfiles = (relationshipProfilesResult.data ??
        []) as RelationshipProfile[];
      const socialStats = mapSocialWeeklyStats(socialStatsResult.data);
      const socialStatsById = new Map(
        socialStats.map((stat) => [stat.userId, stat]),
      );
      const friendIds = new Set(
        friendshipRows.map((friendship) =>
          friendship.user_id === userId
            ? friendship.friend_id
            : friendship.user_id,
        ),
      );
      const relationshipProfilesById = new Map(
        relationshipProfiles.map((profile) => [profile.profile_id, profile]),
      );

      if (currentRequest !== dataRequestId.current) return;

      setData({
        friends: relationshipProfiles
          .filter((profile) => friendIds.has(profile.profile_id))
          .map((profile) => ({
            profile,
            weeklyStat: socialStatsById.get(profile.profile_id) ?? null,
          })),
        hasDataError: Boolean(requestsResult.error || socialStatsResult.error),
        incomingRequests: requestRows
          .filter((request) => request.recipient_id === userId)
          .flatMap((request) => {
            const profile = relationshipProfilesById.get(request.requester_id);
            return profile ? [{ id: request.id, profile }] : [];
          }),
      });
      hasLoaded.current = true;
    } catch (loadError) {
      console.error("[mobile friends] data load failed", loadError);
      if (currentRequest === dataRequestId.current) {
        setError("Your friends could not be loaded. Please try again.");
      }
    } finally {
      if (currentRequest === dataRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  const runSearch = useCallback(
    async (rawQuery: string, options: { silent?: boolean } = {}) => {
      const query = normalizeSearchQuery(rawQuery);
      const currentRequest = ++searchRequestId.current;

      setSearchedQuery(query);
      setSearchError("");

      if (!query) {
        activeSearchQuery.current = "";
        setSearchProfiles([]);
        setIsSearching(false);
        return;
      }

      if (!/^[a-z0-9_]+$/.test(query)) {
        activeSearchQuery.current = "";
        setSearchProfiles([]);
        setSearchError("Use only letters, numbers, and underscores.");
        setIsSearching(false);
        return;
      }

      activeSearchQuery.current = query;
      if (!options.silent) setIsSearching(true);

      try {
        const { data: results, error: rpcError } = await supabase.rpc(
          "search_profiles",
          { p_query: query, p_limit: 10 },
        );

        if (currentRequest !== searchRequestId.current) return;

        if (rpcError) {
          logRpcError("search profiles", rpcError);
          setSearchProfiles([]);
          setSearchError("Search is unavailable. Please try again.");
        } else {
          setSearchProfiles((results ?? []) as SearchProfile[]);
        }
      } catch (searchFailure) {
        console.error("[mobile friends] profile search failed", searchFailure);
        if (currentRequest === searchRequestId.current) {
          setSearchProfiles([]);
          setSearchError("Search is unavailable. Please try again.");
        }
      } finally {
        if (currentRequest === searchRequestId.current) {
          setIsSearching(false);
        }
      }
    },
    [],
  );

  const refreshRelationshipState = useCallback(async () => {
    const query = activeSearchQuery.current;
    await Promise.all([
      loadFriends(),
      query ? runSearch(query, { silent: true }) : Promise.resolve(),
    ]);
  }, [loadFriends, runSearch]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshRelationshipState();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshRelationshipState]);

  const performAction = useCallback(
    async (
      mode: FriendActionMode,
      rawEntityId: string,
    ): Promise<FriendActionResult> => {
      const entityId =
        mode === "send"
          ? rawEntityId.trim().toLowerCase()
          : rawEntityId.toLowerCase();
      const actionKey = `${mode}:${entityId}`;

      if (mutationsInFlight.current.has(actionKey)) {
        return { status: "error", message: "That action is already in progress." };
      }

      if (mode === "send" && !/^[a-z0-9_]{3,30}$/.test(entityId)) {
        return { status: "error", message: "That user could not be found." };
      }

      if (mode !== "send" && !uuidPattern.test(entityId)) {
        return { status: "error", message: "That request could not be found." };
      }

      mutationsInFlight.current.add(actionKey);

      try {
        const result =
          mode === "send"
            ? await supabase.rpc("send_friend_request_by_username", {
                p_username: entityId,
              })
            : mode === "accept"
              ? await supabase.rpc("accept_friend_request", {
                  p_request_id: entityId,
                })
              : mode === "decline"
                ? await supabase.rpc("decline_friend_request", {
                    p_request_id: entityId,
                  })
                : mode === "cancel"
                  ? await supabase.rpc("cancel_friend_request", {
                      p_request_id: entityId,
                    })
                  : await supabase.rpc("remove_friend", {
                      p_friend_id: entityId,
                    });

        if (result.error) {
          logRpcError(mode, result.error);
          return {
            status: "error",
            message:
              mode === "send"
                ? "Could not send this friend request. Please try again."
                : mode === "remove"
                  ? "Could not remove this friend. Please try again."
                  : `Could not ${mode} this request. Please try again.`,
          };
        }

        const status = result.data as string;

        if (mode === "send") {
          if (status === "not_found") {
            return { status: "error", message: "That user could not be found." };
          }

          await refreshRelationshipState();

          if (status === "accepted") {
            return {
              status: "success",
              message: "Request accepted. You’re friends.",
            };
          }
          if (status === "friends") {
            return { status: "success", message: "You are already friends." };
          }
          if (status === "requested") {
            return { status: "success", message: "Request already sent." };
          }
          return { status: "success", message: "Friend request sent." };
        }

        if (status === "not_found") {
          await refreshRelationshipState();
          return mode === "remove"
            ? { status: "success", message: "Friendship was already removed." }
            : {
                status: "error",
                message: "This request is no longer available.",
              };
        }

        await refreshRelationshipState();

        return {
          status: "success",
          message:
            mode === "accept"
              ? "Friend request accepted."
              : mode === "decline"
                ? "Friend request declined."
                : mode === "cancel"
                  ? "Friend request cancelled."
                  : "Friend removed.",
        };
      } catch (actionFailure) {
        console.error("[mobile friends] relationship action failed", actionFailure);
        return {
          status: "error",
          message: "That action could not be completed. Please try again.",
        };
      } finally {
        mutationsInFlight.current.delete(actionKey);
      }
    },
    [refreshRelationshipState],
  );

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    isSearching,
    loadFriends,
    performAction,
    refresh,
    runSearch,
    searchError,
    searchProfiles,
    searchedQuery,
  };
}
