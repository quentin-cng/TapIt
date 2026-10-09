import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getAuthoritativeSetupPath } from "../mobile/src/domain/onboarding-routing";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const weeklyGoalRoute = source(
  "../mobile/src/app/onboarding/weekly-goal.tsx",
);
const weeklyGoalScreen = source(
  "../mobile/src/features/onboarding/WeeklyGoalSetupScreen.tsx",
);
const onboardingProvider = source(
  "../mobile/src/onboarding/OnboardingProvider.tsx",
);
const rootLayout = source("../mobile/src/app/_layout.tsx");
const previewFlow = source(
  "../mobile/src/features/onboarding/OnboardingPreviewFlow.tsx",
);
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);

describe("native onboarding M8 production Weekly Goal", () => {
  it("preserves the authoritative setup order and weekly-goal route", () => {
    assert.equal(
      getAuthoritativeSetupPath("avatar-required"),
      "/onboarding/avatar",
    );
    assert.equal(
      getAuthoritativeSetupPath("identity-incomplete"),
      "/onboarding/profile",
    );
    assert.equal(
      getAuthoritativeSetupPath("weekly-goal-required"),
      "/onboarding/weekly-goal",
    );
    assert.match(weeklyGoalRoute, /WeeklyGoalSetupScreen as default/);

    const avatarIndex = onboardingProvider.indexOf(
      "!nextProfile.avatar_selected_at",
    );
    const identityIndex = onboardingProvider.indexOf(
      "nextProfile.username === getGeneratedFallbackUsername(userId)",
    );
    const weeklyGoalIndex = onboardingProvider.indexOf("if (!goalResult.data)");
    assert.ok(avatarIndex >= 0 && avatarIndex < identityIndex);
    assert.ok(identityIndex < weeklyGoalIndex);
  });

  it("offers exactly 1–7 with no preselected or skip value", () => {
    assert.match(
      weeklyGoalScreen,
      /const weeklyGoalOptions = \[1, 2, 3, 4, 5, 6, 7\] as const/,
    );
    assert.match(
      weeklyGoalScreen,
      /useState<number \| null>\(null\)/,
    );
    assert.match(weeklyGoalScreen, /selectedGoal === null/);
    assert.doesNotMatch(weeklyGoalScreen, /skip|no goal|every day/i);
  });

  it("validates selection and persists only through configure_weekly_goal", () => {
    assert.match(weeklyGoalScreen, /if \(!isWeeklyGoal\(selectedGoal\)\)/);
    assert.match(
      weeklyGoalScreen,
      /supabase\.rpc\(\s*"configure_weekly_goal",\s*\{ p_goal_sessions: selectedGoal \}/,
    );
    assert.doesNotMatch(
      weeklyGoalScreen,
      /from\(["']weekly_goal_schedules["']\)|\.insert\(|\.update\(/,
    );
  });

  it("guards duplicates and preserves the selected value after failure", () => {
    assert.match(
      weeklyGoalScreen,
      /if \(submissionInFlight\.current\) return/,
    );
    assert.match(weeklyGoalScreen, /disabled=\{isContinueDisabled\}/);
    assert.match(
      weeklyGoalScreen,
      /We couldn’t save your weekly goal\. Please try again\./,
    );
    assert.doesNotMatch(weeklyGoalScreen, /setSelectedGoal\(null\)/);
  });

  it("refreshes authoritative readiness only after a matching successful RPC result", () => {
    const rpcIndex = weeklyGoalScreen.indexOf(
      'supabase.rpc(\n        "configure_weekly_goal"',
    );
    const resultIndex = weeklyGoalScreen.indexOf(
      "result.goal_sessions !== selectedGoal",
    );
    const refreshIndex = weeklyGoalScreen.indexOf("await refresh()");
    assert.ok(rpcIndex >= 0 && rpcIndex < resultIndex);
    assert.ok(resultIndex < refreshIndex);
    assert.doesNotMatch(weeklyGoalScreen, /router\.(?:push|replace)/);
    assert.doesNotMatch(weeklyGoalScreen, /AsyncStorage|onboarding.*complete/i);
  });

  it("keeps preview local and pending NFC untouched", () => {
    assert.match(previewFlow, /setWeeklyGoal\(goal\)/);
    assert.doesNotMatch(
      previewFlow,
      /configure_weekly_goal|weekly_goal_schedules|useOnboarding/,
    );
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.doesNotMatch(
      weeklyGoalScreen,
      /persistPendingToken|acknowledgePendingToken|perform_checkin/,
    );
  });
});

describe("native onboarding M8 completion boundary", () => {
  it("now changes readiness from weekly-goal-required to confirmation-required", () => {
    assert.match(
      onboardingProvider,
      /if \(!goalResult\.data\)[\s\S]*setReadiness\("weekly-goal-required"\)[\s\S]*nextProfile\.onboarding_completed_at[\s\S]*"complete"[\s\S]*"confirmation-required"/,
    );
  });

  it("keeps confirmation inside onboarding until authoritative completion", () => {
    assert.match(
      rootLayout,
      /Stack\.Protected guard=\{Boolean\(session\) && isOnboardingComplete\}/,
    );
    assert.match(
      rootLayout,
      /Stack\.Protected guard=\{Boolean\(session\) && !isOnboardingComplete\}/,
    );
    assert.equal(
      getAuthoritativeSetupPath("confirmation-required"),
      "/onboarding/complete",
    );
  });
});
