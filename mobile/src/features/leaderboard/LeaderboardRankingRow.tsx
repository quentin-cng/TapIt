import { StyleSheet, Text, View } from "react-native";
import { SessionDots } from "../../components/consistency/SessionDots";
import { colors, fonts, radii } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
  LeaderboardView,
} from "./useLeaderboardData";
import { getAvatarColors, getInitials } from "./leaderboard-visuals";

type RankingRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

export function LeaderboardRankingRow({
  row,
  view,
}: {
  row: RankingRow;
  view: LeaderboardView;
}) {
  const avatarColors = getAvatarColors(row.username ?? row.displayName);
  const friendsRow =
    view === "friends" && "currentSessions" in row ? row : null;

  return (
    <View style={[styles.container, row.isCurrentUser && styles.currentUserRow]}>
      <Text style={styles.rank}>{row.rank}</Text>
      <View
        style={[styles.avatar, { backgroundColor: avatarColors.background }]}
      >
        <Text style={[styles.initials, { color: avatarColors.foreground }]}>
          {getInitials(row.displayName)}
        </Text>
      </View>
      <View style={styles.identity}>
        <View style={styles.nameLine}>
          <Text numberOfLines={1} style={styles.name}>
            {row.displayName}
          </Text>
          {row.isCurrentUser ? <Text style={styles.youLabel}>You</Text> : null}
        </View>

        {friendsRow ? (
          friendsRow.currentGoal ? (
            <View style={styles.weeklyLine}>
              <SessionDots
                compact
                completed={friendsRow.currentSessions}
                target={friendsRow.currentGoal}
              />
              <Text style={styles.secondaryText}>
                {friendsRow.currentSessions}/{friendsRow.currentGoal} this week
              </Text>
            </View>
          ) : (
            <Text style={styles.secondaryText}>No weekly goal</Text>
          )
        ) : row.username ? (
          <Text numberOfLines={1} style={styles.secondaryText}>
            @{row.username}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.points, row.isCurrentUser && styles.currentPoints]}>
        {row.totalPoints} <Text style={styles.pointsUnit}>pts</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  currentUserRow: {
    marginHorizontal: -2,
    borderBottomColor: "transparent",
    borderRadius: radii.large,
    backgroundColor: "#eee8fb",
    paddingHorizontal: 10,
  },
  rank: {
    width: 25,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    gap: 5,
  },
  nameLine: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    minWidth: 0,
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  youLabel: {
    borderRadius: 999,
    backgroundColor: "#d9cdf8",
    paddingHorizontal: 7,
    paddingVertical: 2,
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  weeklyLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  secondaryText: {
    minWidth: 0,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  points: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  currentPoints: {
    color: colors.purple,
  },
  pointsUnit: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
});
