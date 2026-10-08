import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const introPager = source(
  "../mobile/src/features/onboarding/IntroPager.tsx",
);
const weeklyGoalScene = source(
  "../mobile/src/features/onboarding/intro/WeeklyGoalIntroScene.tsx",
);

describe("native onboarding M3 weekly-goal scene", () => {
  it("uses a dedicated Slide 2 scene with the final copy", () => {
    assert.match(introPager, /import \{ WeeklyGoalIntroScene \}/);
    assert.match(
      introPager,
      /title="Build consistency"[\s\S]*<WeeklyGoalIntroScene \{\.\.\.slideMotion\[1\]}/,
    );
    assert.match(
      introPager,
      /copy="Set a weekly goal and earn points for showing up\."/,
    );
  });

  it("illustrates one final session, ten points, and goal completion", () => {
    assert.match(weeklyGoalScene, />\s*2 \/ 3\s*</);
    assert.match(weeklyGoalScene, />\s*3 \/ 3\s*</);
    assert.match(weeklyGoalScene, /<CompletedMarker \/>[\s\S]*<CompletedMarker \/>/);
    assert.match(weeklyGoalScene, />\+10</);
    assert.match(weeklyGoalScene, /Goal complete/);
  });

  it("runs one cancellable UI-thread timeline only while active", () => {
    assert.match(
      weeklyGoalScene,
      /if \(!active\)[\s\S]*timeline\.set\(0\)/,
    );
    assert.match(weeklyGoalScene, /withRepeat\([\s\S]*withSequence\(/);
    assert.match(weeklyGoalScene, /cancelAnimation\(timeline\)/);
    assert.match(
      weeklyGoalScene,
      /return \(\) => \{[\s\S]*timeline\.set\(0\)/,
    );
    assert.doesNotMatch(
      weeklyGoalScene,
      /setInterval|setTimeout|requestAnimationFrame/,
    );
  });

  it("uses a complete explanatory state when motion is reduced", () => {
    assert.match(
      weeklyGoalScene,
      /if \(reduceMotion\)[\s\S]*timeline\.set\(STATIC_COMPLETE_PROGRESS\)/,
    );
    assert.match(
      weeklyGoalScene,
      /if \(reduceMotion\)[\s\S]*opacity: 1/,
    );
  });

  it("cannot read or mutate real product state", () => {
    assert.doesNotMatch(
      weeklyGoalScene,
      /supabase|configure_weekly_goal|perform_checkin|useOnboarding|useCheckinFlow|usePendingCheckin|AsyncStorage/,
    );
    assert.doesNotMatch(weeklyGoalScene, /LinearGradient|BlurView|Haptics/);
  });
});
