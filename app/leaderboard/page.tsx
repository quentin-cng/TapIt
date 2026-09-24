import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { mapSocialWeeklyStats } from "@/lib/stats/social-weekly";
import { createClient } from "@/lib/supabase/server";

type LeaderboardPageProps = {
  searchParams: Promise<{ view?: string }>;
};

type LeaderboardProfile = {
  key: string;
  username: string;
  total_points: number;
  is_current_user?: boolean;
  best_weekly_goal_streak?: number;
};

type GlobalLeaderboardRow = {
  rank_position: number;
  username: string;
  total_points: number;
  is_current_user: boolean;
};

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const { view } = await searchParams;
  const activeView =
    view === "general" || view === "mcgill" ? "general" : "friends";
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect(
      `/login?next=${encodeURIComponent(`/leaderboard?view=${activeView}`)}`,
    );
  }

  const { data: configuredGoal, error: goalError } = await supabase
    .from("weekly_goal_schedules")
    .select("effective_week")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!goalError && !configuredGoal) {
    redirect("/onboarding");
  }

  let profiles: LeaderboardProfile[] = [];
  let loadError = Boolean(goalError);

  if (activeView === "friends") {
    const { data, error } = await supabase.rpc("get_social_weekly_stats");
    const socialStats = mapSocialWeeklyStats(data);

    if (error) {
      loadError = true;
    } else {
      profiles = socialStats
        .map((stat) => ({
          key: stat.userId,
          username: stat.username,
          total_points: stat.totalPoints,
          is_current_user: stat.userId === userId,
          best_weekly_goal_streak: stat.bestWeeklyGoalStreak,
        }))
        .sort(
          (a, b) =>
            b.total_points - a.total_points ||
            a.username.localeCompare(b.username),
        );
    }
  } else {
    const { data, error } = await supabase.rpc("get_global_leaderboard", {
      p_limit: 100,
    });

    profiles = ((data ?? []) as GlobalLeaderboardRow[]).map((profile) => ({
      key: String(profile.rank_position),
      username: profile.username,
      total_points: profile.total_points,
      is_current_user: profile.is_current_user,
    }));
    loadError = Boolean(error);
  }

  return (
    <AppShell className="leaderboard-page">
      <PageHeader
        description="Points, consistency, and the people who keep showing up."
        eyebrow="Standings"
        title="Leaderboard"
      />

      <nav className="leaderboard-tabs" aria-label="Leaderboard type">
        <Link
          aria-current={activeView === "friends" ? "page" : undefined}
          className={activeView === "friends" ? "active" : undefined}
          href="/leaderboard"
        >
          Friends
        </Link>
        <Link
          aria-current={activeView === "general" ? "page" : undefined}
          className={activeView === "general" ? "active" : undefined}
          href="/leaderboard?view=general"
        >
          General
        </Link>
      </nav>

      <section className="leaderboard-card">
        <div className="leaderboard-heading">
          <div>
            <p className="section-label">
              {activeView === "friends" ? "Your circle" : "General standings"}
            </p>
            <h2>
              {activeView === "friends" ? "Friends ranking" : "Top 100"}
            </h2>
          </div>
          <div className="leaderboard-column-labels">
            <span>Points</span>
            {activeView === "friends" ? <span>Best</span> : null}
          </div>
        </div>

        {loadError ? (
          <p className="social-error" role="alert">
            We couldn&apos;t load the leaderboard. Refresh and try again.
          </p>
        ) : profiles.length ? (
          <ol className="leaderboard-list">
            {profiles.map((profile, index) => {
              const isCurrentUser = profile.is_current_user === true;

              return (
                <li
                  className={`${isCurrentUser ? "current-user " : ""}${index === 0 ? "top-ranked" : ""}`.trim()}
                  key={profile.key}
                >
                  <span className="leaderboard-rank">{index + 1}</span>
                  <div className="leaderboard-user">
                    <strong>
                      {profile.username === "Anonymous"
                        ? profile.username
                        : `@${profile.username}`}
                    </strong>
                    {isCurrentUser ? <small>You</small> : null}
                  </div>
                  <div className="leaderboard-row-stats">
                    <strong className="leaderboard-points">
                      {profile.total_points} <small>pts</small>
                    </strong>
                    {activeView === "friends" ? (
                      <strong className="leaderboard-streak">
                        <span aria-hidden="true">🔥</span>{" "}
                        {profile.best_weekly_goal_streak ?? 0}
                      </strong>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="social-empty compact">
            <span aria-hidden="true">↗</span>
            <h3>No rankings yet.</h3>
            <p>Points from the first check-in will appear here.</p>
          </div>
        )}

        {activeView === "friends" && profiles.length === 1 ? (
          <p className="leaderboard-note">
            Add friends to turn this into a competition.
          </p>
        ) : null}
        {activeView === "general" ? (
          <p className="leaderboard-note">
            General leaderboard: the top 100 TapIt profiles globally.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
