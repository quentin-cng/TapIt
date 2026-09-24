import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/dashboard/actions";
import { AppShell } from "@/components/app-shell";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { GeneralLeaderboardPrivacyForm } from "@/components/general-leaderboard-privacy-form";
import { PageHeader, ProgressBar } from "@/components/ui";
import { WeeklyGoalForm } from "@/components/weekly-goal-form";
import { addCalendarDays, getMontrealWeekStart } from "@/lib/stats/montreal-calendar";
import { calculateStreakStats, formatDayCount } from "@/lib/stats/streaks";
import {
  calculateWeeklyGoalStreaks,
  calculateWeeklyProgress,
  formatSessionCount,
  formatWeekCount,
  getGoalForWeek,
  type WeeklyGoalSchedule,
} from "@/lib/stats/weekly-goals";
import { createClient } from "@/lib/supabase/server";
import styles from "./profile-settings.module.css";

type MyProfile = {
  username: string;
  total_points: number;
  created_at: string;
};

type CheckinLocation = {
  location_id: string;
  location_name: string;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect(`/login?next=${encodeURIComponent("/profile")}`);
  }

  const [
    profileResult,
    checkinsResult,
    schedulesResult,
    leaderboardPreferenceResult,
  ] = await Promise.all([
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
    supabase.rpc("get_my_general_leaderboard_preference"),
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

  const currentWeek = getMontrealWeekStart();
  const nextWeek = addCalendarDays(currentWeek, 7);
  const currentWeeklyGoal = getGoalForWeek(schedules, currentWeek);
  const pendingGoal = schedules.find(
    (schedule) => schedule.effectiveWeek === nextWeek,
  );
  const weeklyProgress = currentWeeklyGoal
    ? calculateWeeklyProgress(
        checkins.map((checkin) => checkin.created_at),
        currentWeeklyGoal,
      )
    : null;
  const weeklyStreaks = calculateWeeklyGoalStreaks(
    checkins.map((checkin) => checkin.created_at),
    schedules,
  );
  const streaks = calculateStreakStats(
    checkins.map((checkin) => checkin.created_at),
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
  const hasDataError =
    profileError ||
    checkinsResult.error ||
    schedulesResult.error ||
    leaderboardPreferenceResult.error ||
    locationsResult.error;

  return (
    <AppShell className="profile-page">
      <PageHeader
        description="Your commitment, history, and account."
        eyebrow="Account"
        title="Profile"
      />

      <section className="profile-card profile-summary-card">
        {profileError || !profile ? (
          <p className="social-error" role="alert">
            We couldn&apos;t load your profile. Refresh and try again.
          </p>
        ) : (
          <>
            <span className="profile-avatar" aria-hidden="true">
              {profile.username.charAt(0).toUpperCase()}
            </span>
            <h2>@{profile.username}</h2>
            <p>{profile.total_points} total points</p>
            <small>
              Member since{" "}
              {new Intl.DateTimeFormat("en-CA", {
                month: "short",
                year: "numeric",
                timeZone: "America/Montreal",
              }).format(new Date(profile.created_at))}
            </small>
          </>
        )}
      </section>

      {profile ? (
        <>
          {hasDataError ? (
            <p className="social-error" role="alert">
              Some profile activity could not be loaded. Refresh to try again.
            </p>
          ) : null}

          {weeklyProgress ? (
            <section className="weekly-goal-card">
              <div className="section-heading">
                <div>
                  <p className="section-label">Weekly commitment</p>
                  <h2>
                    {formatSessionCount(weeklyProgress.targetSessions)}/week
                  </h2>
                </div>
                {weeklyProgress.isComplete ? (
                  <span className="goal-complete-badge">Goal complete</span>
                ) : null}
              </div>
              <p className="profile-weekly-progress">
                <strong>{weeklyProgress.sessionsCompleted}</strong> / {weeklyProgress.targetSessions} this week
              </p>
              <ProgressBar
                label={`${weeklyProgress.sessionsCompleted} of ${weeklyProgress.targetSessions} weekly sessions completed`}
                max={weeklyProgress.targetSessions}
                value={weeklyProgress.sessionsCompleted}
              />
              <div className="weekly-streak-summary">
                <span>
                  Current weekly streak
                  <strong>{formatWeekCount(weeklyStreaks.currentStreak)}</strong>
                </span>
                <span>
                  Best weekly streak
                  <strong>{formatWeekCount(weeklyStreaks.bestStreak)}</strong>
                </span>
              </div>
              <div className="goal-settings">
                <h3>Change goal</h3>
                <p>
                  Changes start next Monday, so this week&apos;s commitment stays
                  fixed.
                </p>
                {pendingGoal ? (
                  <p className="pending-goal-note">
                    Scheduled for next Monday: {formatSessionCount(pendingGoal.goalSessions)}/week.
                    Choose again below to replace it.
                  </p>
                ) : null}
                <WeeklyGoalForm
                  currentGoal={pendingGoal?.goalSessions}
                  mode="profile"
                />
              </div>
            </section>
          ) : null}

          <section className="profile-stats" aria-label="Profile statistics">
            <article>
              <span>Daily activity streak</span>
              <strong>
                {streaks.currentStreak > 0 ? "🔥 " : ""}
                {formatDayCount(streaks.currentStreak)}
              </strong>
            </article>
            <article>
              <span>Longest streak</span>
              <strong>{formatDayCount(streaks.longestStreak)}</strong>
            </article>
            <article>
              <span>Check-ins</span>
              <strong>{checkins.length}</strong>
            </article>
            <article>
              <span>Active days</span>
              <strong>{streaks.activeDays}</strong>
            </article>
          </section>

          <section className="recent-activity-card">
            <div className="section-heading">
              <div>
                <p className="section-label">Activity</p>
                <h2>Recent check-ins</h2>
              </div>
            </div>
            {recentCheckins.length ? (
              <ol className="activity-list">
                {recentCheckins.map((checkin, index) => (
                  <li key={`${checkin.created_at}-${index}`}>
                    <div>
                      <strong>
                        {locationNames.get(checkin.location_id) ??
                          "TapIt location"}
                      </strong>
                      <small>
                        {new Intl.DateTimeFormat("en-CA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "America/Montreal",
                        }).format(new Date(checkin.created_at))}
                      </small>
                    </div>
                    <strong className="activity-points">
                      +{checkin.points_awarded}
                    </strong>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="social-empty compact">
                <span aria-hidden="true">⌁</span>
                <h3>No check-ins yet.</h3>
                <p>Your first rewarded visit will appear here.</p>
              </div>
            )}
          </section>

          <section className={styles.settings}>
            <div className={styles.header}>
              <div>
                <p className="section-label">Settings</p>
                <h2>Account and legal</h2>
              </div>
              <span className={styles.headerMark} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2.8 14 5l3-.2.8 2.9 2.6 1.5-1.1 2.8 1.1 2.8-2.6 1.5-.8 2.9-3-.2-2 2.2-2-2.2-3 .2-.8-2.9-2.6-1.5L4.7 12 3.6 9.2l2.6-1.5L7 4.8l3 .2 2-2.2Zm0 6.1a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Z" />
                </svg>
              </span>
            </div>

            <div className={styles.sessionRow}>
              <div className={styles.sessionCopy}>
                <h3>Session</h3>
                <p>Sign out of TapIt on this device.</p>
              </div>
              <form className={styles.logoutForm} action={logout}>
                <button className={styles.logoutButton} type="submit">
                  Log out
                </button>
              </form>
            </div>

            <GeneralLeaderboardPrivacyForm
              initialValue={leaderboardPreferenceResult.data !== false}
            />

            <div className={styles.dangerZone}>
              <div className={styles.dangerCopy}>
                <span className={styles.dangerLabel}>Danger zone</span>
                <h3>Delete account</h3>
                <p>
                  This permanently deletes your TapIt account and associated
                  TapIt data, including your check-ins, goals, points,
                  friendships, and friend requests. This cannot be undone.
                </p>
              </div>
              <DeleteAccountForm />
            </div>

            <nav className={styles.legalLinks} aria-label="Legal information">
              <Link href="/privacy">Privacy Policy</Link>
              <span className={styles.legalSeparator} aria-hidden="true">·</span>
              <Link href="/terms">Terms of Service</Link>
            </nav>
          </section>
        </>
      ) : null}

    </AppShell>
  );
}
