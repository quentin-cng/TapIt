import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWeeklyRecap,
  getWeeklyRecapMessage,
  type SocialWeeklyStat,
} from "../lib/stats/social-weekly";

function stat(
  overrides: Partial<SocialWeeklyStat> & Pick<SocialWeeklyStat, "userId" | "username">,
): SocialWeeklyStat {
  const { userId, username, ...remainingOverrides } = overrides;

  return {
    userId,
    username,
    totalPoints: 0,
    currentWeekStart: "2026-09-21",
    currentGoal: 3,
    currentSessions: 0,
    currentGoalAchieved: false,
    previousWeekStart: "2026-09-14",
    previousGoal: 3,
    previousSessions: 0,
    previousGoalAchieved: false,
    previousWeekPoints: 0,
    currentWeeklyGoalStreak: 0,
    bestWeeklyGoalStreak: 0,
    ...remainingOverrides,
  };
}

describe("social weekly recap", () => {
  it("groups 3/3 as a hit, 1/3 and 0/2 as missed, and no goal separately", () => {
    const recap = buildWeeklyRecap([
      stat({
        userId: "a",
        username: "achieved",
        previousSessions: 3,
        previousGoal: 3,
        previousGoalAchieved: true,
      }),
      stat({
        userId: "b",
        username: "short",
        previousSessions: 1,
        previousGoal: 3,
      }),
      stat({
        userId: "c",
        username: "zero",
        previousSessions: 0,
        previousGoal: 2,
      }),
      stat({
        userId: "d",
        username: "neutral",
        previousGoal: null,
        previousGoalAchieved: null,
      }),
    ]);

    assert.deepEqual(recap.goalsHit.map((item) => item.username), ["achieved"]);
    assert.deepEqual(recap.goalsMissed.map((item) => item.username), [
      "short",
      "zero",
    ]);
    assert.deepEqual(recap.noGoal.map((item) => item.username), ["neutral"]);
    assert.equal(recap.achievedCount, 1);
    assert.equal(recap.eligibleCount, 3);
  });

  it("keeps the historical goal separate from the current goal", () => {
    const historical = stat({
      userId: "a",
      username: "history",
      currentGoal: 2,
      previousGoal: 3,
      previousSessions: 3,
      previousGoalAchieved: true,
    });

    assert.equal(historical.previousGoal, 3);
    assert.equal(historical.currentGoal, 2);
    assert.equal(buildWeeklyRecap([historical]).goalsHit.length, 1);
  });

  it("uses check-in plus bonus points reported for the previous week", () => {
    const recap = buildWeeklyRecap([
      stat({
        userId: "a",
        username: "forty_five",
        previousSessions: 3,
        previousGoalAchieved: true,
        previousWeekPoints: 45,
      }),
    ]);

    assert.equal(recap.mostPoints[0].previousWeekPoints, 45);
  });

  it("selects most-points leaders by weekly points rather than lifetime points", () => {
    const recap = buildWeeklyRecap([
      stat({
        userId: "a",
        username: "lifetime_leader",
        totalPoints: 1000,
        previousWeekPoints: 10,
      }),
      stat({
        userId: "b",
        username: "weekly_leader",
        totalPoints: 50,
        previousWeekPoints: 45,
      }),
    ]);

    assert.deepEqual(recap.mostPoints.map((item) => item.username), [
      "weekly_leader",
    ]);
  });

  it("uses best weekly goal streak and preserves deterministic ties", () => {
    const recap = buildWeeklyRecap([
      stat({ userId: "a", username: "zoe", bestWeeklyGoalStreak: 5 }),
      stat({ userId: "b", username: "amy", bestWeeklyGoalStreak: 5 }),
      stat({ userId: "c", username: "lee", bestWeeklyGoalStreak: 2 }),
    ]);

    assert.deepEqual(recap.bestStreak.map((item) => item.username), [
      "amy",
      "zoe",
    ]);
  });

  it("does not let current incomplete progress change the previous result", () => {
    const recap = buildWeeklyRecap([
      stat({
        userId: "a",
        username: "still_training",
        currentSessions: 1,
        currentGoal: 4,
        currentGoalAchieved: false,
        previousSessions: 3,
        previousGoal: 3,
        previousGoalAchieved: true,
      }),
    ]);

    assert.equal(recap.goalsHit.length, 1);
    assert.equal(recap.goalsMissed.length, 0);
  });

  it("narrates only missed goals and never treats no-goal users as failures", () => {
    const recap = buildWeeklyRecap([
      stat({
        userId: "a",
        username: "missed",
        previousGoalAchieved: false,
      }),
      stat({
        userId: "b",
        username: "no_goal",
        previousGoal: null,
        previousGoalAchieved: null,
      }),
    ]);

    const message = getWeeklyRecapMessage(recap);

    assert.equal(message, "@missed didn't hit their goal last week.");
    assert.doesNotMatch(message, /no_goal/);
  });

  it("uses a positive recap when everyone with a goal succeeded", () => {
    const recap = buildWeeklyRecap([
      stat({
        userId: "a",
        username: "hit",
        previousGoalAchieved: true,
      }),
      stat({
        userId: "b",
        username: "no_goal",
        previousGoal: null,
        previousGoalAchieved: null,
      }),
    ]);

    assert.equal(
      getWeeklyRecapMessage(recap),
      "Everyone with a goal hit it last week.",
    );
  });
});
