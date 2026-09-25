import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getFriendsLeaderboardCommentary,
  getGeneralLeaderboardCommentary,
  type LeaderboardCommentaryEntry,
} from "../lib/stats/leaderboard-commentary";

function entry(
  username: string,
  totalPoints: number,
  isCurrentUser = false,
): LeaderboardCommentaryEntry {
  return { username, totalPoints, isCurrentUser };
}

describe("leaderboard mascot commentary", () => {
  it("uses the highest and lowest ranked friends while excluding the current user", () => {
    const message = getFriendsLeaderboardCommentary([
      entry("current_user", 100, true),
      entry("alex", 80),
      entry("sam", 30),
    ]);

    assert.equal(
      message,
      "@alex is leading your crew, @sam, you're up next.",
    );
    assert.doesNotMatch(message, /current_user/);
  });

  it("congratulates a sole friend without identifying a bottom friend", () => {
    assert.equal(
      getFriendsLeaderboardCommentary([
        entry("current_user", 100, true),
        entry("alex", 80),
      ]),
      "@alex is your highest-ranked friend with 80 points!",
    );
  });

  it("handles an all-points tie without suggesting anyone is behind", () => {
    assert.equal(
      getFriendsLeaderboardCommentary([
        entry("alex", 40),
        entry("sam", 40),
      ]),
      "@alex and @sam are tied at 40 points, keep it going!",
    );
  });

  it("shows neutral encouragement with no friends", () => {
    assert.equal(
      getFriendsLeaderboardCommentary([entry("current_user", 100, true)]),
      "Add friends to see who takes the lead.",
    );
  });

  it("uses only the privacy-filtered General leader returned to the UI", () => {
    assert.equal(
      getGeneralLeaderboardCommentary([entry("Anonymous", 320)]),
      "Anonymous is leading TapIt with 320 points!",
    );
    assert.equal(
      getGeneralLeaderboardCommentary([entry("alex", 320)]),
      "@alex is leading TapIt with 320 points!",
    );
  });

  it("does not use dash separators in mascot commentary", () => {
    const friendsMessage = getFriendsLeaderboardCommentary([
      entry("alex", 80),
      entry("sam", 30),
    ]);
    const generalMessage = getGeneralLeaderboardCommentary([
      entry("alex", 80),
    ]);

    assert.doesNotMatch(`${friendsMessage} ${generalMessage}`, /—|--/);
  });
});
