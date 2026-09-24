import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/ui";
import { getMontrealWeekStart } from "@/lib/stats/montreal-calendar";
import {
  calculateWeeklyGoalStreaks,
  calculateWeeklyProgress,
  formatWeekCount,
  getGoalForWeek,
  type WeeklyGoalSchedule,
} from "@/lib/stats/weekly-goals";
import { createClient } from "@/lib/supabase/server";

type MyProfile = {
  username: string;
  total_points: number;
};

type CheckinLocation = {
  location_id: string;
  location_name: string;
};

const activityFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Montreal",
});

function getMontrealGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Montreal",
    }).format(new Date()),
  );

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) redirect("/login");

  const [profileResult, checkinsResult, schedulesResult] = await Promise.all([
    supabase.rpc("get_my_profile").single(),
    supabase
      .from("checkins")
      .select("location_id, points_awarded, created_at")
      .eq("user_id", userId)
      .gt("points_awarded", 0)
      .order("created_at", { ascending: false }),
    supabase
      .from("weekly_goal_schedules")
      .select("effective_week, goal_sessions")
      .eq("user_id", userId)
      .order("effective_week", { ascending: true }),
  ]);

  const profile = profileResult.data as MyProfile | null;
  const { error: profileError } = profileResult;
  const checkins = checkinsResult.data ?? [];
  const schedules: WeeklyGoalSchedule[] = (schedulesResult.data ?? []).map(
    (schedule) => ({
      effectiveWeek: schedule.effective_week,
      goalSessions: schedule.goal_sessions,
    }),
  );

  if (!schedulesResult.error && schedules.length === 0) {
    redirect("/onboarding");
  }

  const currentWeeklyGoal = getGoalForWeek(schedules, getMontrealWeekStart());
  const checkinTimestamps = checkins.map((checkin) => checkin.created_at);
  const weeklyProgress = currentWeeklyGoal
    ? calculateWeeklyProgress(checkinTimestamps, currentWeeklyGoal)
    : null;
  const weeklyStreaks = calculateWeeklyGoalStreaks(
    checkinTimestamps,
    schedules,
  );
  const recentCheckins = checkins.slice(0, 5);
  const recentLocationIds = [
    ...new Set(recentCheckins.map((checkin) => checkin.location_id)),
  ];
  const locationsResult = recentLocationIds.length
    ? await supabase.rpc("get_my_checkin_locations")
    : { data: [], error: null };
  const locationNames = new Map<string, string>(
    ((locationsResult.data ?? []) as CheckinLocation[]).map((location) => [
      location.location_id,
      location.location_name,
    ]),
  );
  const hasDataError = Boolean(
    checkinsResult.error || schedulesResult.error || locationsResult.error,
  );

  return (
    <AppShell className="dashboard-page">
      {profileError || !profile ? (
        <section className="error-card">
          <h1>Profile unavailable</h1>
          <p>Your account is active, but your profile could not be loaded.</p>
        </section>
      ) : (
        <>
          <header className="dashboard-greeting">
            <p>{getMontrealGreeting()},</p>
            <h1>{profile.username}</h1>
          </header>

          {hasDataError ? (
            <p className="inline-alert error" role="alert">
              Some activity data could not be loaded. Refresh to try again.
            </p>
          ) : null}

          <section
            className="home-hero"
            aria-label="Points and weekly progress"
          >
            <div className="home-points">
              <span>Total points</span>
              <strong>{profile.total_points}</strong>
              <small>Points</small>
            </div>

            <div className="home-week">
              <div className="home-week-heading">
                <span>This week</span>
                {weeklyProgress?.isComplete ? (
                  <b className="status-badge success">Goal complete</b>
                ) : null}
              </div>
              {weeklyProgress ? (
                <>
                  <p className="home-week-metric">
                    <strong>{weeklyProgress.sessionsCompleted}</strong>
                    <span>/ {weeklyProgress.targetSessions} sessions</span>
                  </p>
                  <ProgressBar
                    label={`${weeklyProgress.sessionsCompleted} of ${weeklyProgress.targetSessions} weekly sessions completed`}
                    max={weeklyProgress.targetSessions}
                    value={weeklyProgress.sessionsCompleted}
                  />
                  <p className="home-week-note">
                    {weeklyProgress.isComplete
                      ? "Weekly commitment complete."
                      : `${weeklyProgress.remainingSessions} ${weeklyProgress.remainingSessions === 1 ? "session" : "sessions"} remaining.`}
                  </p>
                </>
              ) : (
                <p className="home-week-note">Weekly progress unavailable.</p>
              )}
            </div>
          </section>

          <div className="home-secondary-layout">
            <section className="home-activity-section">
              <div className="home-section-heading">
                <h2>Recent activity</h2>
                {recentCheckins.length ? (
                  <span>{recentCheckins.length} latest</span>
                ) : null}
              </div>

              {recentCheckins.length ? (
                <ol className="home-activity-list">
                  {recentCheckins.map((checkin, index) => (
                    <li key={`${checkin.location_id}-${checkin.created_at}`}>
                      <div>
                        <strong>
                          {locationNames.get(checkin.location_id) ??
                            "TapIt location"}
                        </strong>
                        <small>
                          {activityFormatter.format(
                            new Date(checkin.created_at),
                          )}
                          {index === 0 ? " · Latest" : ""}
                        </small>
                      </div>
                      <b>+{checkin.points_awarded}</b>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="home-empty-activity">
                  <strong>No check-ins yet</strong>
                  <p>Your first rewarded visit will appear here.</p>
                </div>
              )}
            </section>

            <aside className="home-streak-panel">
              <span>Weekly streak</span>
              <div>
                <strong>{formatWeekCount(weeklyStreaks.currentStreak)}</strong>
              </div>
              <p>
                {weeklyStreaks.currentStreak > 0
                  ? "Keep your commitment going."
                  : "Complete this week to start your streak."}
              </p>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  );
}
