import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateStreakStats } from "../lib/stats/streaks";

const now = "2026-09-23T16:00:00.000Z"; // Sep 23 at noon in Montreal.

describe("calculateStreakStats", () => {
  it("returns zeroes with no check-ins", () => {
    assert.deepEqual(calculateStreakStats([], now), {
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
    });
  });

  it("counts one check-in today", () => {
    assert.deepEqual(calculateStreakStats(["2026-09-23T15:00:00Z"], now), {
      currentStreak: 1,
      longestStreak: 1,
      activeDays: 1,
    });
  });

  it("keeps a streak alive when the latest check-in was yesterday", () => {
    assert.deepEqual(calculateStreakStats(["2026-09-22T15:00:00Z"], now), {
      currentStreak: 1,
      longestStreak: 1,
      activeDays: 1,
    });
  });

  it("counts consecutive check-ins through today", () => {
    const stats = calculateStreakStats(
      [
        "2026-09-21T15:00:00Z",
        "2026-09-22T15:00:00Z",
        "2026-09-23T15:00:00Z",
      ],
      now,
    );

    assert.equal(stats.currentStreak, 3);
    assert.equal(stats.longestStreak, 3);
  });

  it("deduplicates multiple check-ins on the same Montreal day", () => {
    assert.deepEqual(
      calculateStreakStats(
        ["2026-09-23T13:00:00Z", "2026-09-23T20:00:00Z"],
        now,
      ),
      { currentStreak: 1, longestStreak: 1, activeDays: 1 },
    );
  });

  it("keeps the historical longest streak after a gap", () => {
    const stats = calculateStreakStats(
      [
        "2026-09-15T15:00:00Z",
        "2026-09-16T15:00:00Z",
        "2026-09-17T15:00:00Z",
        "2026-09-23T15:00:00Z",
      ],
      now,
    );

    assert.deepEqual(stats, {
      currentStreak: 1,
      longestStreak: 3,
      activeDays: 4,
    });
  });

  it("returns a zero current streak when the latest day was two days ago", () => {
    assert.deepEqual(
      calculateStreakStats(["2026-09-21T15:00:00Z"], now),
      { currentStreak: 0, longestStreak: 1, activeDays: 1 },
    );
  });

  it("uses Montreal dates across the UTC midnight boundary", () => {
    const sameLocalDay = calculateStreakStats(
      ["2026-09-23T04:30:00Z", "2026-09-24T03:30:00Z"],
      now,
    );
    const differentLocalDays = calculateStreakStats(
      ["2026-09-23T03:30:00Z", "2026-09-23T04:30:00Z"],
      now,
    );

    assert.deepEqual(sameLocalDay, {
      currentStreak: 1,
      longestStreak: 1,
      activeDays: 1,
    });
    assert.deepEqual(differentLocalDays, {
      currentStreak: 2,
      longestStreak: 2,
      activeDays: 2,
    });
  });
});
