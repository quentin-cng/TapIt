import { resolveDisplayName } from "@/lib/profile-identity";

export type SocialWeeklyStat = {
  userId: string;
  displayName: string;
  username: string;
  totalPoints: number;
  currentWeekStart: string;
  currentGoal: number | null;
  currentSessions: number;
  currentGoalAchieved: boolean | null;
  previousWeekStart: string;
  previousGoal: number | null;
  previousSessions: number;
  previousGoalAchieved: boolean | null;
  previousWeekPoints: number;
  currentWeeklyGoalStreak: number;
  bestWeeklyGoalStreak: number;
};

type SocialWeeklyRpcRow = {
  participant_user_id: string;
  display_name: string | null;
  username: string;
  total_points: number;
  current_week_start: string;
  current_weekly_goal: number | null;
  current_weekly_sessions: number;
  current_week_goal_achieved: boolean | null;
  previous_week_start: string;
  previous_weekly_goal: number | null;
  previous_weekly_sessions: number;
  previous_week_goal_achieved: boolean | null;
  previous_week_points: number;
  current_weekly_goal_streak: number;
  best_weekly_goal_streak: number;
};

export type WeeklyRecap = {
  goalsHit: SocialWeeklyStat[];
  goalsMissed: SocialWeeklyStat[];
  noGoal: SocialWeeklyStat[];
  eligibleCount: number;
  achievedCount: number;
  mostPoints: SocialWeeklyStat[];
  bestStreak: SocialWeeklyStat[];
};

function isRpcRow(value: unknown): value is SocialWeeklyRpcRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Partial<SocialWeeklyRpcRow>;
  return (
    typeof row.participant_user_id === "string" &&
    (typeof row.display_name === "string" || row.display_name === null) &&
    typeof row.username === "string" &&
    typeof row.total_points === "number" &&
    typeof row.current_week_start === "string" &&
    typeof row.current_weekly_sessions === "number" &&
    typeof row.previous_week_start === "string" &&
    typeof row.previous_weekly_sessions === "number" &&
    typeof row.previous_week_points === "number" &&
    typeof row.current_weekly_goal_streak === "number" &&
    typeof row.best_weekly_goal_streak === "number"
  );
}

export function mapSocialWeeklyStats(data: unknown): SocialWeeklyStat[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isRpcRow).map((row) => ({
    userId: row.participant_user_id,
    displayName: resolveDisplayName(row.display_name, row.username),
    username: row.username,
    totalPoints: row.total_points,
    currentWeekStart: row.current_week_start,
    currentGoal: row.current_weekly_goal,
    currentSessions: row.current_weekly_sessions,
    currentGoalAchieved: row.current_week_goal_achieved,
    previousWeekStart: row.previous_week_start,
    previousGoal: row.previous_weekly_goal,
    previousSessions: row.previous_weekly_sessions,
    previousGoalAchieved: row.previous_week_goal_achieved,
    previousWeekPoints: row.previous_week_points,
    currentWeeklyGoalStreak: row.current_weekly_goal_streak,
    bestWeeklyGoalStreak: row.best_weekly_goal_streak,
  }));
}

function byUsername(a: SocialWeeklyStat, b: SocialWeeklyStat) {
  return a.username.localeCompare(b.username);
}

function tiedLeaders(
  stats: readonly SocialWeeklyStat[],
  selectValue: (stat: SocialWeeklyStat) => number,
) {
  if (stats.length === 0) {
    return [];
  }

  const highestValue = Math.max(...stats.map(selectValue));
  return stats
    .filter((stat) => selectValue(stat) === highestValue)
    .sort(byUsername);
}

export function buildWeeklyRecap(
  stats: readonly SocialWeeklyStat[],
): WeeklyRecap {
  const goalsHit = stats
    .filter((stat) => stat.previousGoalAchieved === true)
    .sort(byUsername);
  const goalsMissed = stats
    .filter((stat) => stat.previousGoalAchieved === false)
    .sort(byUsername);
  const noGoal = stats
    .filter((stat) => stat.previousGoalAchieved === null)
    .sort(byUsername);

  return {
    goalsHit,
    goalsMissed,
    noGoal,
    eligibleCount: goalsHit.length + goalsMissed.length,
    achievedCount: goalsHit.length,
    mostPoints: tiedLeaders(stats, (stat) => stat.previousWeekPoints),
    bestStreak: tiedLeaders(stats, (stat) => stat.bestWeeklyGoalStreak),
  };
}

export function getWeeklyRecapMessage(recap: WeeklyRecap) {
  const missedNames = recap.goalsMissed.map((stat) => stat.displayName);

  if (missedNames.length === 0) {
    return recap.eligibleCount > 0
      ? "Everyone with a goal hit it last week."
      : "No completed goals were available to recap last week.";
  }

  if (missedNames.length === 1) {
    return `${missedNames[0]} didn't hit their goal last week.`;
  }

  if (missedNames.length === 2) {
    return `${missedNames[0]} and ${missedNames[1]} didn't hit their goals last week.`;
  }

  return `${missedNames[0]}, ${missedNames[1]}, and ${missedNames.length - 2} others didn't hit their goals last week.`;
}
