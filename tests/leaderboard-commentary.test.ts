import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getFriendsLeaderboardCommentary,
  getGeneralLeaderboardCommentary,
  type LeaderboardCommentaryEntry,
} from "../lib/stats/leaderboard-commentary";

function entry(
  displayName: string,
  totalPoints: number,
  isCurrentUser = false,
): LeaderboardCommentaryEntry {
  return { displayName, totalPoints, isCurrentUser };
}

describe("leaderboard mascot commentary", () => {
  it("uses the highest and lowest ranked friends while excluding the current user", () => {
    const message = getFriendsLeaderboardCommentary([
      entry("Current User", 100, true),
      entry("Alex", 80),
      entry("Sam", 30),
    ]);

    assert.equal(
      message,
      "Alex is leading your crew, Sam, you're up next.",
    );
    assert.doesNotMatch(message, /Current User/);
  });

  it("congratulates a sole friend without identifying a bottom friend", () => {
    assert.equal(
      getFriendsLeaderboardCommentary([
        entry("Current User", 100, true),
        entry("Alex", 80),
      ]),
      "Alex is your highest-ranked friend with 80 points!",
    );
  });

  it("handles an all-points tie without suggesting anyone is behind", () => {
    assert.equal(
      getFriendsLeaderboardCommentary([
        entry("Alex", 40),
        entry("Sam", 40),
      ]),
      "Alex and Sam are tied at 40 points, keep it going!",
    );
  });

  it("shows neutral encouragement with no friends", () => {
    assert.equal(
      getFriendsLeaderboardCommentary([entry("Current User", 100, true)]),
      "Add friends to see who takes the lead.",
    );
  });

  it("uses only the privacy-filtered General leader returned to the UI", () => {
    assert.equal(
      getGeneralLeaderboardCommentary([entry("Anonymous", 320)]),
      "Anonymous is leading TapIt with 320 points!",
    );
    assert.equal(
      getGeneralLeaderboardCommentary([entry("Alex", 320)]),
      "Alex is leading TapIt with 320 points!",
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
