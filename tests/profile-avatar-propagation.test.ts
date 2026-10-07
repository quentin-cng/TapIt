import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { normalizeProfileAvatarId } from "../mobile/src/domain/profile-avatar";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const friendsScreen = source(
  "../mobile/src/features/friends/FriendsScreen.tsx",
);
const friendRow = source(
  "../mobile/src/features/friends/FriendConsistencyRow.tsx",
);
const friendDetail = source(
  "../mobile/src/features/friends/FriendDetailSheet.tsx",
);
const recap = source(
  "../mobile/src/features/recap/WeeklyRecapScreen.tsx",
);
const leaderboardData = source(
  "../mobile/src/features/leaderboard/useLeaderboardData.ts",
);
const podium = source(
  "../mobile/src/features/leaderboard/LeaderboardPodium.tsx",
);
const rankingRow = source(
  "../mobile/src/features/leaderboard/LeaderboardRankingRow.tsx",
);
const currentUserRow = source(
  "../mobile/src/features/leaderboard/LeaderboardYourPlace.tsx",
);
const home = source("../mobile/src/features/home/HomeScreen.tsx");
const rewards = source("../mobile/src/features/rewards/RewardsScreen.tsx");
const friendsData = source(
  "../mobile/src/features/friends/useFriendsData.ts",
);
const tapItAvatar = source(
  "../mobile/src/components/identity/TapItAvatar.tsx",
);

describe("profile avatar product propagation", () => {
  it("uses relationship and search payload avatars across Friends", () => {
    assert.match(friendRow, /avatarId=\{friend\.profile\.avatar_id\}/);
    assert.match(
      friendsScreen,
      /avatarId=\{request\.profile\.avatar_id\}/,
    );
    assert.match(friendsScreen, /avatarId=\{profile\.avatar_id\}/);
    assert.match(friendDetail, /avatarId=\{friend\.profile\.avatar_id\}/);
    assert.match(
      friendsData,
      /socialStatsById\.get\(userId\)\?\.avatarId \?\? "default"/,
    );
    assert.match(
      friendsScreen,
      /<FriendsHeader avatarId=\{data\.currentUserAvatarId\} \/>/,
    );
  });

  it("uses mapped social avatars throughout Recap", () => {
    assert.match(recap, /<TapItAvatar avatarId=\{stat\.avatarId\} size=\{38\} \/>/);
    assert.doesNotMatch(recap, /V3InitialAvatar/);
  });

  it("uses only each authoritative leaderboard row avatar", () => {
    assert.match(podium, /avatarId=\{row\.avatarId\}/);
    assert.match(rankingRow, /avatarId=\{row\.avatarId\}/);
    assert.match(currentUserRow, /avatarId=\{row\.avatarId\}/);
    assert.doesNotMatch(podium, /get_my_profile/);
    assert.doesNotMatch(rankingRow, /get_my_profile/);
    assert.doesNotMatch(currentUserRow, /get_my_profile/);
  });

  it("maps the authoritative top three to second, first, third podium slots", () => {
    assert.match(podium, /const first = rows\[0\]/);
    assert.match(podium, /const second = rows\[1\]/);
    assert.match(podium, /const third = rows\[2\]/);
    assert.match(
      podium,
      /secondSlot[\s\S]*PodiumParticipant row=\{second\}[\s\S]*firstSlot[\s\S]*PodiumParticipant featured row=\{first\}[\s\S]*thirdSlot[\s\S]*PodiumParticipant row=\{third\}/,
    );
  });

  it("preserves server-masked General avatars for public and private users", () => {
    assert.match(
      leaderboardData,
      /avatarId: normalizeProfileAvatarId\(profile\.avatar_id\)/,
    );
    assert.doesNotMatch(leaderboardData, /avatarId:[^\n]*isCurrentUser/);
    assert.doesNotMatch(leaderboardData, /get_my_profile/);
  });

  it("uses authoritative self-profile avatars on Home and Rewards", () => {
    assert.match(home, /<HomeTopBar avatarId=\{profile\.avatar_id\} \/>/);
    assert.match(rewards, /avatarId=\{profile\?\.avatar_id\}/);
  });

  it("uses the current leaderboard payload for its Profile control", () => {
    assert.match(
      source("../mobile/src/features/leaderboard/LeaderboardScreen.tsx"),
      /data\?\.rows\.find\(\(row\) => row\.isCurrentUser\)\?\.avatarId/,
    );
  });

  it("keeps safe fallback normalization and explicit Android image sizing", () => {
    assert.equal(normalizeProfileAvatarId(null), "default");
    assert.equal(normalizeProfileAvatarId(undefined), "default");
    assert.equal(normalizeProfileAvatarId("future-avatar"), "default");
    assert.match(tapItAvatar, /style=\{\{ width: size, height: size \}\}/);
    assert.doesNotMatch(tapItAvatar, /StyleSheet\.absoluteFill/);
  });

  it("introduces no per-identity profile queries", () => {
    for (const feature of [friendsScreen, friendRow, friendDetail, recap, podium, rankingRow, currentUserRow]) {
      assert.doesNotMatch(feature, /\.from\("profiles"\)/);
      assert.doesNotMatch(feature, /get_my_profile/);
    }
  });
});
