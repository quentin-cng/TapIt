import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const appShell = source("../components/app-shell.tsx");
const dashboard = source("../app/dashboard/page.tsx");
const friends = source("../app/friends/page.tsx");
const recap = source("../app/recap/page.tsx");
const profile = source("../app/profile/page.tsx");
const leaderboard = source("../app/leaderboard/page.tsx");
const privacyControl = source(
  "../components/general-leaderboard-privacy-form.tsx",
);
const profileActions = source("../app/profile/actions.ts");
const mascot = source("../components/tapit-mascot.tsx");
const mascotStyles = source("../components/tapit-mascot.module.css");
const mascotSpeech = source("../components/tapit-mascot-speech.tsx");
const mascotSpeechStyles = source(
  "../components/tapit-mascot-speech.module.css",
);
const tapitBrand = source("../components/tapit-brand.tsx");

describe("focused UI and branding cleanup", () => {
  it("uses the new primary callout and selective mascot states", () => {
    assert.match(appShell, /TAP FOR POINTS/);
    assert.doesNotMatch(appShell, /Show up together|Commit\. Tap\. Earn\. Repeat/);
    assert.doesNotMatch(dashboard, /TapItMascot|home-mascot/);
    assert.match(recap, /TapItMascotSpeech/);
    assert.match(appShell, /<TapItBrand \/>/);
    assert.match(tapitBrand, /<TapItMascot size="brand" \/>/);
  });

  it("constrains every mascot through explicit responsive size variants", () => {
    assert.match(
      mascot,
      /size\?: "brand" \| "small" \| "speech" \| "medium" \| "large"/,
    );
    assert.match(mascot, /fill/);
    assert.match(mascotStyles, /\.small[\s\S]*\.medium[\s\S]*\.large/);
    assert.match(mascotStyles, /max-width: 100%/);
    assert.match(mascotStyles, /object-fit: contain/);
    assert.doesNotMatch(dashboard, /size="medium"/);
  });

  it("removes obsolete Profile activity and daily streak UI", () => {
    assert.doesNotMatch(
      profile,
      /Recent check-ins|Daily activity streak|Active days|Longest streak|profile-stats/,
    );
    assert.match(profile, /Current weekly streak/);
    assert.match(profile, /GeneralLeaderboardPrivacyForm/);
  });

  it("removes redundant main-page subtitles while preserving recap dates", () => {
    assert.doesNotMatch(friends, /<PageHeader[\s\S]*?description=/);
    assert.doesNotMatch(leaderboard, /<PageHeader[\s\S]*?description=/);
    assert.doesNotMatch(profile, /<PageHeader[\s\S]*?description=/);
    assert.match(recap, /description=\{previousWeek/);
  });

  it("hides no-goal recap presentation without changing recap data", () => {
    assert.doesNotMatch(recap, /recap\.noGoal|status="none"|No commitment recorded/);
    assert.match(recap, /getWeeklyRecapMessage\(recap\)/);
    assert.match(recap, /const hasGoalResults/);
    assert.match(recap, /\{hasGoalResults \? \(/);
    assert.doesNotMatch(recap, /No goal results last week/);
  });

  it("auto-saves through the secure preference action with no Save button", () => {
    assert.match(privacyControl, /startTransition\(\(\) => submitPreference/);
    assert.match(privacyControl, /pending \? "Saving…"/);
    assert.match(privacyControl, /setShowUsername\(previousValue\.current\)/);
    assert.doesNotMatch(privacyControl, /SaveButton|type="submit"|>Save</);
    assert.match(
      profileActions,
      /rpc\("set_general_leaderboard_preference"/,
    );
  });

  it("uses the same privacy control and preference source on General", () => {
    assert.match(
      leaderboard,
      /rpc\("get_my_general_leaderboard_preference"\)/,
    );
    assert.match(
      leaderboard,
      /<GeneralLeaderboardPrivacyForm[\s\S]*compact[\s\S]*initialValue=\{generalPreference\}/,
    );
  });

  it("shows compact talking-mascot commentary on both leaderboard views", () => {
    assert.match(leaderboard, /getFriendsLeaderboardCommentary/);
    assert.match(leaderboard, /getGeneralLeaderboardCommentary/);
    assert.match(leaderboard, /<TapItMascotSpeech/);
    assert.match(mascotSpeech, /size="speech" variant="talking"/);
    assert.match(mascotSpeech, /<p className=\{styles\.message\}>/);
    assert.match(mascotSpeechStyles, /grid-template-columns: auto minmax\(0, 1fr\)/);
    assert.match(mascotSpeechStyles, /\.bubble::before/);
    assert.match(mascotSpeechStyles, /overflow-wrap: anywhere/);
  });
});
