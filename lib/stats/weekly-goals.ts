import {
  addCalendarDays,
  dateKeyToOrdinal,
  getMontrealWeekStart,
} from "./montreal-calendar";

export type WeeklyGoalSchedule = {
  effectiveWeek: string;
  goalSessions: number;
};

export type WeeklyProgress = {
  weekStart: string;
  sessionsCompleted: number;
  targetSessions: number;
  remainingSessions: number;
  isComplete: boolean;
};

export type WeeklyGoalStreaks = {
  currentStreak: number;
  bestStreak: number;
};

export function getGoalForWeek(
  schedules: readonly WeeklyGoalSchedule[],
  weekStart: string,
) {
  return schedules
    .filter((schedule) => schedule.effectiveWeek <= weekStart)
    .sort((a, b) => b.effectiveWeek.localeCompare(a.effectiveWeek))[0]
    ?.goalSessions;
}

export function calculateWeeklyProgress(
  timestamps: readonly (string | Date)[],
  targetSessions: number,
  now: string | Date = new Date(),
): WeeklyProgress {
  const weekStart = getMontrealWeekStart(now);
  const sessionsCompleted = timestamps.filter(
    (timestamp) => getMontrealWeekStart(timestamp) === weekStart,
  ).length;

  return {
    weekStart,
    sessionsCompleted,
    targetSessions,
    remainingSessions: Math.max(0, targetSessions - sessionsCompleted),
    isComplete: sessionsCompleted >= targetSessions,
  };
}

export function calculateWeeklyGoalStreaks(
  timestamps: readonly (string | Date)[],
  schedules: readonly WeeklyGoalSchedule[],
  now: string | Date = new Date(),
): WeeklyGoalStreaks {
  if (schedules.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const orderedSchedules = [...schedules].sort((a, b) =>
    a.effectiveWeek.localeCompare(b.effectiveWeek),
  );
  const firstWeek = orderedSchedules[0].effectiveWeek;
  const currentWeek = getMontrealWeekStart(now);
  const firstOrdinal = dateKeyToOrdinal(firstWeek);
  const currentOrdinal = dateKeyToOrdinal(currentWeek);

  if (
    firstOrdinal === null ||
    currentOrdinal === null ||
    firstOrdinal > currentOrdinal
  ) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sessionsPerWeek = new Map<string, number>();

  for (const timestamp of timestamps) {
    const week = getMontrealWeekStart(timestamp);
    sessionsPerWeek.set(week, (sessionsPerWeek.get(week) ?? 0) + 1);
  }

  const outcomes: boolean[] = [];

  for (let ordinal = firstOrdinal; ordinal <= currentOrdinal; ordinal += 7) {
    const weekStart = addCalendarDays(firstWeek, ordinal - firstOrdinal);
    const target = getGoalForWeek(orderedSchedules, weekStart);

    if (!target) {
      continue;
    }

    const achieved = (sessionsPerWeek.get(weekStart) ?? 0) >= target;

    if (weekStart === currentWeek && !achieved) {
      break;
    }

    outcomes.push(achieved);
  }

  let bestStreak = 0;
  let runningStreak = 0;

  for (const achieved of outcomes) {
    runningStreak = achieved ? runningStreak + 1 : 0;
    bestStreak = Math.max(bestStreak, runningStreak);
  }

  let currentStreak = 0;

  for (let index = outcomes.length - 1; index >= 0; index -= 1) {
    if (!outcomes[index]) {
      break;
    }

    currentStreak += 1;
  }

  return { currentStreak, bestStreak };
}

export function weeklyBonusForGoal(goalSessions: number) {
  return goalSessions * 5;
}

export function formatWeekCount(weeks: number) {
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}

export function formatSessionCount(sessions: number) {
  return `${sessions} ${sessions === 1 ? "session" : "sessions"}`;
}
