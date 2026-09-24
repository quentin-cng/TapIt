import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMontrealWeekStart } from "../lib/stats/montreal-calendar";
import {
  calculateWeeklyGoalStreaks,
  calculateWeeklyProgress,
  getGoalForWeek,
  weeklyBonusForGoal,
  type WeeklyGoalSchedule,
} from "../lib/stats/weekly-goals";

const now = "2026-09-23T16:00:00Z";

describe("weekly goal progress", () => {
  it("reports 0/3 as incomplete", () => {
    assert.deepEqual(calculateWeeklyProgress([], 3, now), {
      weekStart: "2026-09-21",
      sessionsCompleted: 0,
      targetSessions: 3,
      remainingSessions: 3,
      isComplete: false,
    });
  });

  it("reports 2/3 as incomplete", () => {
    const result = calculateWeeklyProgress(
      ["2026-09-21T15:00:00Z", "2026-09-22T15:00:00Z"],
      3,
      now,
    );

    assert.equal(result.sessionsCompleted, 2);
    assert.equal(result.remainingSessions, 1);
    assert.equal(result.isComplete, false);
  });

  it("reports 3/3 as complete", () => {
    const result = calculateWeeklyProgress(
      [
        "2026-09-21T15:00:00Z",
        "2026-09-22T15:00:00Z",
        "2026-09-23T15:00:00Z",
      ],
      3,
      now,
    );

    assert.equal(result.sessionsCompleted, 3);
    assert.equal(result.remainingSessions, 0);
    assert.equal(result.isComplete, true);
  });

  it("does not cap sessions after completing the goal", () => {
    const result = calculateWeeklyProgress(
      [
        "2026-09-21T10:00:00Z",
        "2026-09-21T16:00:00Z",
        "2026-09-22T15:00:00Z",
        "2026-09-23T15:00:00Z",
      ],
      3,
      now,
    );

    assert.equal(result.sessionsCompleted, 4);
    assert.equal(result.remainingSessions, 0);
    assert.equal(result.isComplete, true);
  });
});

describe("weekly goal history", () => {
  const schedules: WeeklyGoalSchedule[] = [
    { effectiveWeek: "2026-09-07", goalSessions: 4 },
    { effectiveWeek: "2026-09-21", goalSessions: 3 },
    { effectiveWeek: "2026-09-28", goalSessions: 2 },
  ];

  it("keeps Thursday's change out of the current week", () => {
    assert.equal(getGoalForWeek(schedules, "2026-09-21"), 3);
    assert.equal(getGoalForWeek(schedules, "2026-09-28"), 2);
  });

  it("uses the goal that historically applied to each week", () => {
    assert.equal(getGoalForWeek(schedules, "2026-09-14"), 4);
    assert.equal(getGoalForWeek(schedules, "2026-09-21"), 3);
  });
});

describe("weekly goal streaks", () => {
  it("counts three successful weeks", () => {
    const result = calculateWeeklyGoalStreaks(
      [
        "2026-09-07T15:00:00Z",
        "2026-09-14T15:00:00Z",
        "2026-09-21T15:00:00Z",
      ],
      [{ effectiveWeek: "2026-09-07", goalSessions: 1 }],
      now,
    );

    assert.deepEqual(result, { currentStreak: 3, bestStreak: 3 });
  });

  it("resets after a failed completed week", () => {
    const result = calculateWeeklyGoalStreaks(
      [
        "2026-08-31T15:00:00Z",
        "2026-09-07T15:00:00Z",
        "2026-09-21T15:00:00Z",
      ],
      [{ effectiveWeek: "2026-08-31", goalSessions: 1 }],
      now,
    );

    assert.deepEqual(result, { currentStreak: 1, bestStreak: 2 });
  });

  it("does not let an incomplete current week break four prior successes", () => {
    const result = calculateWeeklyGoalStreaks(
      [
        "2026-08-24T15:00:00Z",
        "2026-08-31T15:00:00Z",
        "2026-09-07T15:00:00Z",
        "2026-09-14T15:00:00Z",
      ],
      [{ effectiveWeek: "2026-08-24", goalSessions: 1 }],
      now,
    );

    assert.deepEqual(result, { currentStreak: 4, bestStreak: 4 });
  });

  it("extends the streak when the current week becomes successful", () => {
    const result = calculateWeeklyGoalStreaks(
      [
        "2026-08-24T15:00:00Z",
        "2026-08-31T15:00:00Z",
        "2026-09-07T15:00:00Z",
        "2026-09-14T15:00:00Z",
        "2026-09-21T15:00:00Z",
      ],
      [{ effectiveWeek: "2026-08-24", goalSessions: 1 }],
      now,
    );

    assert.deepEqual(result, { currentStreak: 5, bestStreak: 5 });
  });
});

describe("weekly reward and Montreal boundaries", () => {
  it("calculates the weekly bonus from the committed goal", () => {
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6, 7].map(weeklyBonusForGoal),
      [5, 10, 15, 20, 25, 30, 35],
    );
  });

  it("uses Montreal Monday and Sunday boundaries", () => {
    assert.equal(
      getMontrealWeekStart("2026-09-21T03:30:00Z"),
      "2026-09-14",
    );
    assert.equal(
      getMontrealWeekStart("2026-09-21T04:30:00Z"),
      "2026-09-21",
    );
  });

  it("handles the Montreal fall DST transition", () => {
    assert.equal(
      getMontrealWeekStart("2026-11-01T05:30:00Z"),
      "2026-10-26",
    );
    assert.equal(
      getMontrealWeekStart("2026-11-01T06:30:00Z"),
      "2026-10-26",
    );
    assert.equal(
      getMontrealWeekStart("2026-11-02T05:30:00Z"),
      "2026-11-02",
    );
  });

  it("handles the Montreal spring DST transition", () => {
    assert.equal(
      getMontrealWeekStart("2026-03-08T06:30:00Z"),
      "2026-03-02",
    );
    assert.equal(
      getMontrealWeekStart("2026-03-08T07:30:00Z"),
      "2026-03-02",
    );
    assert.equal(
      getMontrealWeekStart("2026-03-09T04:30:00Z"),
      "2026-03-09",
    );
  });
});
