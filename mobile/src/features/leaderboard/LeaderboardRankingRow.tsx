import { StyleSheet, Text, View } from "react-native";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { colors, fonts } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type RankingRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

export function LeaderboardRankingRow({ row }: { row: RankingRow }) {
  const streak =
    "bestWeeklyGoalStreak" in row ? row.bestWeeklyGoalStreak : null;

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{row.rank}</Text>
      <TapItAvatar avatarId={row.avatarId} size={38} />
      <View style={styles.identity}>
        <Text numberOfLines={1} style={styles.name}>
          {row.displayName}
        </Text>
        {streak !== null && streak > 0 ? (
          <View style={styles.streakRow}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.streak}>{streak} week streak</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.pointsBlock}>
        <Text style={styles.points}>
          {new Intl.NumberFormat("en-CA").format(row.totalPoints)}
        </Text>
        <Text style={styles.pointsLabel}>points</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eadccd",
    paddingHorizontal: 3,
    paddingVertical: 10,
  },
  rank: {
    width: 23,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  identity: {
    minWidth: 0,
    flex: 1,
  },
  name: {
    color: "#1a1333",
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  streakRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flame: {
    fontSize: 11,
  },
  streak: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  pointsBlock: {
    alignItems: "flex-end",
  },
  points: {
    color: "#1a1333",
    fontFamily: fonts.display,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  pointsLabel: {
    marginTop: -1,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 9,
  },
});
