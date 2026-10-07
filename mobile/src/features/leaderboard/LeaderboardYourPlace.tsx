import { StyleSheet, Text, View } from "react-native";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { fonts } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type PlacementRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

export function LeaderboardYourPlace({ row }: { row: PlacementRow }) {
  const streak =
    "bestWeeklyGoalStreak" in row ? row.bestWeeklyGoalStreak : null;

  return (
    <View
      accessibilityLabel={`Your rank is ${row.rank} with ${row.totalPoints} points`}
      style={styles.row}
    >
      <Text style={styles.rank}>{row.rank}</Text>
      <TapItAvatar avatarId={row.avatarId} size={38} />
      <View style={styles.identity}>
        <Text style={styles.name}>You</Text>
        <View style={styles.secondaryRow}>
          <Text style={styles.secondary}>Your place</Text>
          {streak !== null && streak > 0 ? (
            <Text numberOfLines={1} style={styles.secondary}>
              · 🔥 {streak} week streak
            </Text>
          ) : null}
        </View>
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
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#cfc0f6",
    borderRadius: 17,
    backgroundColor: "#f2edff",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  rank: {
    width: 23,
    color: "#5b3df6",
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  identity: { minWidth: 0, flex: 1 },
  name: {
    color: "#1a1333",
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  secondary: {
    color: "#777386",
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  secondaryRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  pointsBlock: { alignItems: "flex-end" },
  points: {
    color: "#5b3df6",
    fontFamily: fonts.display,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  pointsLabel: {
    marginTop: -1,
    color: "#777386",
    fontFamily: fonts.regular,
    fontSize: 9,
  },
});
