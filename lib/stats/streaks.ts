import {
  dateKeyToOrdinal,
  MONTREAL_TIME_ZONE,
  toMontrealDateKey,
} from "./montreal-calendar";

export const STREAK_TIME_ZONE = MONTREAL_TIME_ZONE;

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
};

function toLocalDayOrdinal(value: string | Date) {
  const dateKey = toMontrealDateKey(value);
  return dateKey ? dateKeyToOrdinal(dateKey) : null;
}

export function calculateStreakStats(
  timestamps: readonly (string | Date)[],
  now: string | Date = new Date(),
): StreakStats {
  const today = toLocalDayOrdinal(now);

  if (today === null) {
    throw new Error("The reference date is invalid.");
  }

  const activeDayOrdinals = [
    ...new Set(
      timestamps
        .map(toLocalDayOrdinal)
        .filter((day): day is number => day !== null),
    ),
  ].sort((a, b) => a - b);

  if (activeDayOrdinals.length === 0) {
    return { currentStreak: 0, longestStreak: 0, activeDays: 0 };
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (let index = 1; index < activeDayOrdinals.length; index += 1) {
    if (activeDayOrdinals[index] === activeDayOrdinals[index - 1] + 1) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  const mostRecentDay = activeDayOrdinals.at(-1)!;
  let currentStreak = 0;

  if (mostRecentDay === today || mostRecentDay === today - 1) {
    currentStreak = 1;

    for (
      let index = activeDayOrdinals.length - 2;
      index >= 0;
      index -= 1
    ) {
      const expectedDay = mostRecentDay - currentStreak;

      if (activeDayOrdinals[index] !== expectedDay) {
        break;
      }

      currentStreak += 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    activeDays: activeDayOrdinals.length,
  };
}

export function formatDayCount(days: number) {
  return `${days} ${days === 1 ? "day" : "days"}`;
}
