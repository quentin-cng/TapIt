import type { SocialWeeklyStat } from "./social-weekly";

export type HomeSocialNudge = {
  actionLabel: "Add friends" | "View friends";
  kind: "comparison" | "neutral" | "no-friends";
  message: string;
  supportingText: string;
};

function byUsername(a: SocialWeeklyStat, b: SocialWeeklyStat) {
  return a.username.localeCompare(b.username);
}

function progressLabel(stat: SocialWeeklyStat) {
  return stat.currentGoal === null
    ? `${stat.currentSessions} ${stat.currentSessions === 1 ? "session" : "sessions"}`
    : `${stat.currentSessions} / ${stat.currentGoal}`;
}

function comparisonText(
  currentUser: SocialWeeklyStat,
  friend: SocialWeeklyStat,
) {
  return `You: ${progressLabel(currentUser)} · ${friend.displayName}: ${progressLabel(friend)}`;
}

export function buildHomeSocialNudge(
  stats: readonly SocialWeeklyStat[],
  userId: string,
): HomeSocialNudge | null {
  const currentUser = stats.find((stat) => stat.userId === userId);
  if (!currentUser) return null;

  const friends = stats
    .filter((stat) => stat.userId !== userId)
    .sort(byUsername);

  if (friends.length === 0) {
    return {
      actionLabel: "Add friends",
      kind: "no-friends",
      message: "TapIt is better with friends.",
      supportingText: "Add friends to compare your week.",
    };
  }

  if (currentUser.currentGoal === null) {
    return {
      actionLabel: "View friends",
      kind: "neutral",
      message: "See how your friends are showing up this week.",
      supportingText: "Open Friends to see everyone’s progress.",
    };
  }

  const oneSessionAhead = friends.find(
    (friend) => friend.currentSessions === currentUser.currentSessions + 1,
  );
  if (oneSessionAhead) {
    return {
      actionLabel: "View friends",
      kind: "comparison",
      message: `${oneSessionAhead.displayName} is one session ahead.`,
      supportingText: comparisonText(currentUser, oneSessionAhead),
    };
  }

  const highestFriendSessions = Math.max(
    ...friends.map((friend) => friend.currentSessions),
  );
  if (
    currentUser.currentSessions > 0 &&
    currentUser.currentSessions > highestFriendSessions
  ) {
    const closestFriend = friends.reduce((leader, friend) =>
      friend.currentSessions > leader.currentSessions ? friend : leader,
    );
    return {
      actionLabel: "View friends",
      kind: "comparison",
      message: "You’re leading your friends this week.",
      supportingText: comparisonText(currentUser, closestFriend),
    };
  }

  const tiedFriend = friends.find(
    (friend) =>
      currentUser.currentSessions > 0 &&
      friend.currentSessions === currentUser.currentSessions,
  );
  if (tiedFriend) {
    return {
      actionLabel: "View friends",
      kind: "comparison",
      message: `You and ${tiedFriend.displayName} are tied this week.`,
      supportingText: comparisonText(currentUser, tiedFriend),
    };
  }

  const completedCount = friends.filter(
    (friend) => friend.currentGoalAchieved === true,
  ).length;
  if (completedCount > 0) {
    return {
      actionLabel: "View friends",
      kind: "comparison",
      message:
        completedCount === 1
          ? "1 friend completed their goal this week."
          : `${completedCount} friends completed their goals this week.`,
      supportingText: "Open Friends to see everyone’s progress.",
    };
  }

  return {
    actionLabel: "View friends",
    kind: "neutral",
    message: "See how your friends are showing up this week.",
    supportingText: "Open Friends to see everyone’s progress.",
  };
}
