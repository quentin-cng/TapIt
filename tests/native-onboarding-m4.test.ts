import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const introPager = source(
  "../mobile/src/features/onboarding/IntroPager.tsx",
);
const socialScene = source(
  "../mobile/src/features/onboarding/intro/SocialIntroScene.tsx",
);

describe("native onboarding M4 social scene", () => {
  it("uses a dedicated Slide 3 scene with the final copy", () => {
    assert.match(introPager, /import \{ SocialIntroScene \}/);
    assert.match(
      introPager,
      /title="Better together"[\s\S]*<SocialIntroScene \{\.\.\.slideMotion\[2\]}/,
    );
    assert.match(
      introPager,
      /copy="Compete with friends and keep each other going\."/,
    );
  });

  it("uses a mathematically valid local ranking story", () => {
    const initialYouPoints = 105;
    const reward = 10;
    const finalYouPoints = 115;
    const passedFriendPoints = 110;

    assert.equal(initialYouPoints + reward, finalYouPoints);
    assert.ok(initialYouPoints < passedFriendPoints);
    assert.ok(finalYouPoints > passedFriendPoints);
    assert.match(socialScene, /name="Maya"/);
    assert.match(socialScene, />Alex</);
    assert.match(socialScene, />You</);
    assert.match(socialScene, />\+10</);
    assert.match(socialScene, />\s*105\s*</);
    assert.match(socialScene, />\s*115\s*</);
    assert.match(socialScene, />110</);
  });

  it("physically trades the two row positions with transforms", () => {
    assert.match(
      socialScene,
      /translateY: ROW_STEP \* getReorderProgress\(timeline\.value\)/,
    );
    assert.match(
      socialScene,
      /translateY: -ROW_STEP \* reorderProgress/,
    );
    assert.match(socialScene, /finalRank="3"[\s\S]*initialRank="2"/);
    assert.match(socialScene, /finalRank="2"[\s\S]*initialRank="3"/);
    assert.doesNotMatch(socialScene, /setState|setRows|sort\(/);
  });

  it("runs only while active and has a static reduced-motion result", () => {
    assert.match(socialScene, /if \(!active\)[\s\S]*timeline\.set\(0\)/);
    assert.match(socialScene, /withRepeat\([\s\S]*withSequence\(/);
    assert.match(socialScene, /cancelAnimation\(timeline\)/);
    assert.match(
      socialScene,
      /if \(reduceMotion\)[\s\S]*timeline\.set\(STATIC_FINAL_PROGRESS\)/,
    );
    assert.match(
      socialScene,
      /if \(reduceMotion\)[\s\S]*opacity: 1/,
    );
    assert.doesNotMatch(
      socialScene,
      /setInterval|setTimeout|requestAnimationFrame/,
    );
  });

  it("cannot read or mutate real social or points data", () => {
    assert.doesNotMatch(
      socialScene,
      /supabase|get_global_leaderboard|perform_checkin|useLeaderboard|useFriends|usePendingCheckin|AsyncStorage/,
    );
    assert.doesNotMatch(socialScene, /LinearGradient|BlurView|Haptics/);
  });
});
