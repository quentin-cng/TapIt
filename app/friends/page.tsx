import { redirect } from "next/navigation";
import { FriendAction } from "./friend-action";
import { AppShell } from "@/components/app-shell";
import { PageHeader, ProgressBar } from "@/components/ui";
import { mapSocialWeeklyStats } from "@/lib/stats/social-weekly";
import { createClient } from "@/lib/supabase/server";

type FriendsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

type RelationshipProfile = {
  profile_id: string;
  username: string;
  total_points: number;
  created_at: string;
};

type SearchProfile = {
  username: string;
  total_points: number;
  relationship_status: "friends" | "outgoing" | "incoming" | "none";
  request_id: string | null;
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const { q: rawQuery } = await searchParams;
  const query = (rawQuery ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .slice(0, 30);
  const queryIsValid = query === "" || /^[a-z0-9_]+$/.test(query);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect(`/login?next=${encodeURIComponent("/friends")}`);
  }

  const { data: configuredGoal, error: goalError } = await supabase
    .from("weekly_goal_schedules")
    .select("effective_week")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!goalError && !configuredGoal) redirect("/onboarding");

  const [friendshipsResult, requestsResult, socialStatsResult] =
    await Promise.all([
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
    ]);
  const { data: friendshipRows, error: friendshipsError } = friendshipsResult;
  const { data: requestRows, error: requestsError } = requestsResult;
  const socialStats = mapSocialWeeklyStats(socialStatsResult.data);
  const socialStatsById = new Map(
    socialStats.map((stat) => [stat.userId, stat]),
  );
  const friendIds = (friendshipRows ?? []).map((friendship) =>
    friendship.user_id === userId
      ? friendship.friend_id
      : friendship.user_id,
  );
  const friendIdSet = new Set(friendIds);
  const incomingRequests = (requestRows ?? []).filter(
    (request) => request.recipient_id === userId,
  );
  const incomingRequesterIds = incomingRequests.map(
    (request) => request.requester_id,
  );

  const [relationshipProfilesResult, searchResult] = await Promise.all([
      supabase.rpc("get_relationship_profiles"),
      query && queryIsValid
        ? supabase.rpc("search_profiles", {
            p_query: query,
            p_limit: 10,
          })
        : Promise.resolve({ data: [], error: null }),
    ]);
  const relationshipProfiles = (relationshipProfilesResult.data ??
    []) as RelationshipProfile[];
  const searchProfiles = (searchResult.data ?? []) as SearchProfile[];
  const friends = relationshipProfiles.filter((profile) =>
    friendIdSet.has(profile.profile_id),
  );
  const incomingProfilesById = new Map(
    relationshipProfiles
      .filter((profile) => incomingRequesterIds.includes(profile.profile_id))
      .map((profile) => [profile.profile_id, profile]),
  );
  const hasDataError = Boolean(
    goalError ||
      friendshipsError ||
      requestsError ||
      socialStatsResult.error ||
      relationshipProfilesResult.error ||
      searchResult.error,
  );

  return (
    <AppShell className="friends-page">
      <PageHeader
        eyebrow="Your crew"
        title="Friends"
      />

      {hasDataError ? (
        <p className="inline-alert error" role="alert">
          We couldn&apos;t load all friend data. Refresh and try again.
        </p>
      ) : null}

      <div className="friends-layout">
        <div className="friends-primary-column">
          {incomingRequests.length ? (
            <section
              className="content-card friend-requests-card"
              id="friend-requests"
            >
              <div className="card-heading-row">
                <div>
                  <span className="section-label">Friend requests</span>
                  <h2>
                    {incomingRequests.length}{" "}
                    {incomingRequests.length === 1 ? "request" : "requests"}
                  </h2>
                </div>
              </div>
              <div className="friend-request-list" role="list">
                {incomingRequests.map((request) => {
                  const requester = incomingProfilesById.get(
                    request.requester_id,
                  );

                  if (!requester) return null;

                  return (
                    <article
                      className="friend-request-row"
                      key={request.id}
                      role="listitem"
                    >
                      <span className="initial-avatar" aria-hidden="true">
                        {requester.username.charAt(0).toUpperCase()}
                      </span>
                      <div className="friend-request-identity">
                        <strong>@{requester.username}</strong>
                        <small>{requester.total_points} points</small>
                      </div>
                      <div className="friend-request-actions">
                        <FriendAction mode="accept" entityId={request.id} />
                        <FriendAction mode="decline" entityId={request.id} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="content-card friends-list-card">
            <div className="card-heading-row">
              <div>
                <span className="section-label">Your friends</span>
                <h2>
                  {friendIds.length ? `${friendIds.length} connected` : "Your crew"}
                </h2>
              </div>
            </div>

            {friends.length ? (
              <div className="friends-table" role="list">
                {friends.map((friend) => {
                  const weeklyStat = socialStatsById.get(friend.profile_id);
                  const goal = weeklyStat?.currentGoal;
                  const sessions = weeklyStat?.currentSessions ?? 0;

                  return (
                    <article
                      className="friend-row"
                      key={friend.profile_id}
                      role="listitem"
                    >
                      <span className="initial-avatar" aria-hidden="true">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                      <div className="friend-identity">
                        <strong>@{friend.username}</strong>
                        <small>{friend.total_points} points</small>
                      </div>
                      <div className="friend-progress">
                        <span>
                          {goal === null || goal === undefined
                            ? "No weekly goal"
                            : `${sessions} / ${goal} this week`}
                        </span>
                        {goal ? (
                          <ProgressBar
                            label={`${friend.username} completed ${sessions} of ${goal} weekly sessions`}
                            max={goal}
                            value={sessions}
                          />
                        ) : null}
                      </div>
                      <div className="friend-streak">
                        <small>Weekly streak</small>
                        <strong>
                          {weeklyStat?.currentWeeklyGoalStreak ?? 0} wk
                        </strong>
                      </div>
                      <span
                        className={`status-badge${weeklyStat?.currentGoalAchieved ? " success" : ""}`}
                      >
                        {weeklyStat?.currentGoalAchieved
                          ? "Goal complete"
                          : goal
                            ? "In progress"
                            : "No goal"}
                      </span>
                      <FriendAction mode="remove" entityId={friend.profile_id} />
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">◎</span>
                <strong>No friends yet</strong>
                <p>Find another TapIt member and send a friend request.</p>
              </div>
            )}
          </section>
        </div>

        <section className="content-card friend-search-card">
          <div className="card-heading-row">
            <div>
              <span className="section-label">Find friends</span>
              <h2>Search by username</h2>
            </div>
          </div>
          <form className="user-search" action="/friends" method="get">
            <label className="sr-only" htmlFor="friend-search">
              Search users by username
            </label>
            <input
              autoCapitalize="none"
              defaultValue={query}
              id="friend-search"
              maxLength={30}
              name="q"
              placeholder="Search username"
              spellCheck={false}
              type="search"
            />
            <button type="submit">Search</button>
          </form>

          {!query ? (
            <p className="field-help">Enter a username to find another member.</p>
          ) : !queryIsValid ? (
            <p className="field-help error-text">
              Use only letters, numbers, and underscores.
            </p>
          ) : searchProfiles.length ? (
            <div className="search-results-list">
              {searchProfiles.map((profile) => {
                const isFriend = profile.relationship_status === "friends";
                const isOutgoing = profile.relationship_status === "outgoing";
                const isIncoming = profile.relationship_status === "incoming";

                return (
                  <article className="search-result-row" key={profile.username}>
                    <span className="initial-avatar" aria-hidden="true">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>@{profile.username}</strong>
                      <small>{profile.total_points} points</small>
                    </div>
                    {isFriend ? (
                      <span className="status-badge success">Friends</span>
                    ) : isOutgoing && profile.request_id ? (
                      <div className="search-request-state">
                        <span className="status-badge">Requested</span>
                        <FriendAction
                          mode="cancel"
                          entityId={profile.request_id}
                        />
                      </div>
                    ) : isIncoming ? (
                      <a className="status-badge" href="#friend-requests">
                        Respond
                      </a>
                    ) : (
                      <FriendAction mode="send" entityId={profile.username} />
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state compact">
              <strong>No matching users</strong>
              <p>Check the username and try again.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
