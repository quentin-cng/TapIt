export type LeaderboardCommentaryEntry = {
  username: string;
  totalPoints: number;
  isCurrentUser: boolean;
};

function displayUsername(username: string) {
  return username === "Anonymous" ? username : `@${username}`;
}

export function getFriendsLeaderboardCommentary(
  rankedEntries: readonly LeaderboardCommentaryEntry[],
) {
  const friends = rankedEntries.filter((entry) => !entry.isCurrentUser);

  if (friends.length === 0) {
    return "Add friends to see who takes the lead.";
  }

  const topFriend = friends[0];

  if (friends.length === 1) {
    return `${displayUsername(topFriend.username)} is your highest-ranked friend with ${topFriend.totalPoints} points!`;
  }

  const bottomFriend = friends[friends.length - 1];
  const topName = displayUsername(topFriend.username);
  const bottomName = displayUsername(bottomFriend.username);

  if (topFriend.totalPoints === bottomFriend.totalPoints) {
    return friends.length === 2
      ? `${topName} and ${bottomName} are tied at ${topFriend.totalPoints} points, keep it going!`
      : `${topName}, ${bottomName}, and your crew are tied at ${topFriend.totalPoints} points.`;
  }

  return `${topName} is leading your crew, ${bottomName}, you're up next.`;
}

export function getGeneralLeaderboardCommentary(
  rankedEntries: readonly LeaderboardCommentaryEntry[],
) {
  const leader = rankedEntries[0];

  if (!leader) {
    return "The first TapIt points will set the pace.";
  }

  return `${displayUsername(leader.username)} is leading TapIt with ${leader.totalPoints} points!`;
}
